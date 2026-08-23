import React, { useState, useRef, useEffect } from 'react';
import {
  Image,
  Sparkles,
  Layers,
  Plus,
  Trash2,
  Edit,
  ArrowUp,
  ArrowDown,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Clock,
  Video,
  ExternalLink,
  Upload,
  RefreshCw,
  Info,
  Sliders,
  Check,
  X,
  Play,
  Pause,
  Maximize2
} from 'lucide-react';
import { SlideShowConfig, SlideShowBannerItem, NavigationTab } from '../../types';
import { SlideShowBannerCarousel } from '../SlideShowBannerCarousel';
import { INITIAL_SLIDESHOW_CONFIG } from '../../data/initialSlideShowData';
import { normalizeImageUrl, isGoogleDriveUrl, extractGoogleDriveFileId, getAlternativeImageUrl } from '../../utils/imageUrlHelper';

interface SlideShowAdminSectionProps {
  slideShowConfig?: SlideShowConfig;
  onUpdateConfig: (newConfig: SlideShowConfig) => void;
  isDark?: boolean;
  addLog?: (action: string, category: 'AUTH' | 'UPLOAD' | 'SETTINGS' | 'ANNOUNCEMENT', details: string, status?: 'SUCCESS' | 'WARNING' | 'INFO') => void;
  showToast?: (opts: { type: 'success' | 'error' | 'warning' | 'info'; title: string; message: string }) => void;
}

export const SlideShowAdminSection: React.FC<SlideShowAdminSectionProps> = ({
  slideShowConfig,
  onUpdateConfig,
  isDark = false,
  addLog,
  showToast
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Current active configuration (fallback to initial config)
  const currentConfig: SlideShowConfig = slideShowConfig || INITIAL_SLIDESHOW_CONFIG;

  // Edit / Form state
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<SlideShowBannerItem, 'id'>>({
    title: '',
    subtitle: '',
    imageUrl: '',
    imageFit: 'contain',
    badge: 'EVENT',
    eventDate: '',
    eventTime: '',
    eventLocation: '',
    linkUrl: '',
    linkLabel: 'Buka Tautan / Gabung Acara',
    targetTabs: ['ALL'],
    isActive: true,
    order: 1
  });

  const [imageUploadLoading, setImageUploadLoading] = useState(false);
  const [imagePreviewError, setImagePreviewError] = useState(false);

  // Reset image preview error when imageUrl changes
  useEffect(() => {
    setImagePreviewError(false);
  }, [formData.imageUrl]);

  // Available tabs list for multi-target selection
  const availableTabOptions: { key: string; label: string }[] = [
    { key: 'ALL', label: '🌟 Semua Menu / Tab' },
    { key: 'dashboard', label: '1. Dashboard Overview IKPA' },
    { key: 'capaian-output', label: '2. Capaian Output SAKTI' },
    { key: 'pengelolaan-up', label: '3. Pengelolaan UP & TUP' },
    { key: 'transaksi-kkp', label: '4. Transaksi KKP (GUP)' },
    { key: 'transaksi-digipay', label: '5. Transaksi Digipay' },
    { key: 'kelola-satker', label: '6. Kelola Data Satker' },
    { key: 'redflags', label: '7. Red Flags & Anomali' },
    { key: 'sertifikasi', label: '8. Sertifikasi Pejabat' },
    { key: 'per5-analisis', label: '9. Analisis PER-5/PB/2024' },
    { key: 'materi-slide', label: '10. Materi Slide Presentation' },
    { key: 'portal-link', label: '11. Link Sosialisasi' },
    { key: 'presensi', label: '12. Presensi Online' },
    { key: 'pengetahuan', label: '13. Pengetahuan & Juknis' },
    { key: 'aduan', label: '14. Lapor Aduan Satker' }
  ];

  // Handle master toggle
  const handleToggleMasterEnable = (isEnabled: boolean) => {
    const updated: SlideShowConfig = {
      ...currentConfig,
      isEnabled,
      updatedAt: new Date().toISOString()
    };
    onUpdateConfig(updated);
    if (showToast) {
      showToast({
        type: isEnabled ? 'success' : 'info',
        title: isEnabled ? 'Slide Show Banner Diaktifkan' : 'Slide Show Dinonaktifkan',
        message: isEnabled
          ? 'Banner gambar bergerak kini tampil di bagian atas menu Satker.'
          : 'Banner slide show dinonaktifkan dan disembunyikan dari seluruh menu.'
      });
    }
  };

  // Handle autoPlay toggle
  const handleToggleAutoPlay = (autoPlay: boolean) => {
    const updated: SlideShowConfig = {
      ...currentConfig,
      autoPlay,
      updatedAt: new Date().toISOString()
    };
    onUpdateConfig(updated);
  };

  // Handle interval change
  const handleChangeInterval = (seconds: number) => {
    const updated: SlideShowConfig = {
      ...currentConfig,
      intervalSeconds: seconds,
      updatedAt: new Date().toISOString()
    };
    onUpdateConfig(updated);
  };

  // Handle local image file upload (convert to Base64 data URL)
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      if (showToast) {
        showToast({
          type: 'error',
          title: 'Format Tidak Sesuai',
          message: 'Harap pilih file gambar (JPG, PNG, WebP, SVG, atau GIF bergerak).'
        });
      }
      return;
    }

    setImageUploadLoading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setFormData((prev) => ({ ...prev, imageUrl: result }));
      setImageUploadLoading(false);
      if (showToast) {
        showToast({
          type: 'success',
          title: 'Gambar Berhasil Dimuat',
          message: 'Gambar banner siap digunakan pada slide.'
        });
      }
    };
    reader.onerror = () => {
      setImageUploadLoading(false);
      if (showToast) {
        showToast({
          type: 'error',
          title: 'Gagal Membaca File',
          message: 'Terjadi kesalahan saat memproses file gambar.'
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // Save / Update Slide
  const handleSaveSlide = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title?.trim() && !formData.imageUrl?.trim()) {
      if (showToast) {
        showToast({
          type: 'warning',
          title: 'Data Belum Lengkap',
          message: 'Harap unggah/masukkan URL Gambar Banner atau isi Judul Informasi.'
        });
      }
      return;
    }

    const currentSlides = [...(currentConfig.slides || [])];
    const slideTitleDisplay = formData.title?.trim() || 'Banner Gambar';

    if (editingSlideId) {
      // Update existing
      const updatedSlides = currentSlides.map((s) => {
        if (s.id === editingSlideId) {
          return {
            ...s,
            ...formData
          };
        }
        return s;
      });

      const updatedConfig: SlideShowConfig = {
        ...currentConfig,
        slides: updatedSlides,
        updatedAt: new Date().toISOString()
      };
      onUpdateConfig(updatedConfig);
      setEditingSlideId(null);

      if (showToast) {
        showToast({
          type: 'success',
          title: 'Slide Berhasil Diperbarui',
          message: `Slide "${slideTitleDisplay}" telah berhasil diubah.`
        });
      }
    } else {
      // Create new slide
      const newSlide: SlideShowBannerItem = {
        id: `slide-${Date.now()}`,
        ...formData,
        order: (currentSlides.length || 0) + 1,
        createdAt: new Date().toISOString()
      };

      const updatedConfig: SlideShowConfig = {
        ...currentConfig,
        slides: [...currentSlides, newSlide],
        updatedAt: new Date().toISOString()
      };
      onUpdateConfig(updatedConfig);

      if (showToast) {
        showToast({
          type: 'success',
          title: 'Slide Baru Ditambahkan',
          message: `Slide "${slideTitleDisplay}" telah ditambahkan ke Slide Show.`
        });
      }
    }

    // Reset form
    setFormData({
      title: '',
      subtitle: '',
      imageUrl: '',
      imageFit: 'contain',
      badge: 'EVENT',
      eventDate: '',
      eventTime: '',
      eventLocation: '',
      linkUrl: '',
      linkLabel: 'Buka Tautan / Gabung Acara',
      targetTabs: ['ALL'],
      isActive: true,
      order: 1
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Start editing a slide
  const handleEditClick = (slide: SlideShowBannerItem) => {
    setEditingSlideId(slide.id);
    setFormData({
      title: slide.title || '',
      subtitle: slide.subtitle || '',
      imageUrl: slide.imageUrl || '',
      imageFit: slide.imageFit || 'contain',
      badge: slide.badge || 'EVENT',
      eventDate: slide.eventDate || '',
      eventTime: slide.eventTime || '',
      eventLocation: slide.eventLocation || '',
      linkUrl: slide.linkUrl || '',
      linkLabel: slide.linkLabel || 'Buka Tautan / Gabung Acara',
      targetTabs: slide.targetTabs || ['ALL'],
      isActive: slide.isActive ?? true,
      order: slide.order || 1
    });
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingSlideId(null);
    setFormData({
      title: '',
      subtitle: '',
      imageUrl: '',
      imageFit: 'contain',
      badge: 'EVENT',
      eventDate: '',
      eventTime: '',
      eventLocation: '',
      linkUrl: '',
      linkLabel: 'Buka Tautan / Gabung Acara',
      targetTabs: ['ALL'],
      isActive: true,
      order: 1
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Delete slide
  const handleDeleteSlide = (id: string, title: string) => {
    const updatedSlides = (currentConfig.slides || []).filter((s) => s.id !== id);
    const updatedConfig: SlideShowConfig = {
      ...currentConfig,
      slides: updatedSlides,
      updatedAt: new Date().toISOString()
    };
    onUpdateConfig(updatedConfig);
    if (editingSlideId === id) handleCancelEdit();

    if (showToast) {
      showToast({
        type: 'info',
        title: 'Slide Dihapus',
        message: `Slide "${title || 'Banner'}" telah dihapus dari rotasi.`
      });
    }
  };

  // Toggle single slide active status
  const handleToggleSlideActive = (id: string) => {
    const updatedSlides = (currentConfig.slides || []).map((s) => {
      if (s.id === id) {
        return { ...s, isActive: !s.isActive };
      }
      return s;
    });
    const updatedConfig: SlideShowConfig = {
      ...currentConfig,
      slides: updatedSlides,
      updatedAt: new Date().toISOString()
    };
    onUpdateConfig(updatedConfig);
  };

  // Reorder slide up/down
  const handleMoveOrder = (index: number, direction: 'up' | 'down') => {
    const slides = [...(currentConfig.slides || [])];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= slides.length) return;

    const temp = slides[index];
    slides[index] = slides[targetIndex];
    slides[targetIndex] = temp;

    // Update order numbers
    const reordered = slides.map((s, i) => ({ ...s, order: i + 1 }));

    const updatedConfig: SlideShowConfig = {
      ...currentConfig,
      slides: reordered,
      updatedAt: new Date().toISOString()
    };
    onUpdateConfig(updatedConfig);
  };

  // Reset to default sample slides
  const handleResetToDefault = () => {
    onUpdateConfig(INITIAL_SLIDESHOW_CONFIG);
    if (showToast) {
      showToast({
        type: 'info',
        title: 'Reset Slide Bawaan',
        message: 'Slide show dikembalikan ke pengaturan dan contoh banner bawaan.'
      });
    }
  };

  const activeCount = (currentConfig.slides || []).filter((s) => s.isActive).length;

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* 1. TOP STATUS & MASTER CONTROLS CARD */}
      <div className={`${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'} rounded-3xl border shadow-xl p-6 sm:p-8 space-y-6`}>
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30 px-3 py-1 rounded-full text-xs font-black mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              MODUL SLIDE SHOW / BANNER GAMBAR BERGERAK (CAROUSEL)
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              Pengaturan Banner Slide Show Satker
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl font-medium">
              Banner bergerak (Carousel) akan tampil elegan di bagian atas layar dashboard (tepat di bawah deretan tab menu dan di atas tabel monitoring). Jika dinonaktifkan atau tidak ada gambar aktif, tampilan kembali normal seperti biasa.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Master Switch ON / OFF */}
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 p-2 rounded-2xl border border-slate-200 dark:border-slate-700">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 pl-2">
                Status Banner:
              </span>
              <button
                type="button"
                onClick={() => handleToggleMasterEnable(!currentConfig.isEnabled)}
                className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-sm ${
                  currentConfig.isEnabled
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 ring-2 ring-emerald-400/40'
                    : 'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${currentConfig.isEnabled ? 'bg-slate-950 animate-ping' : 'bg-slate-400'}`} />
                <span>{currentConfig.isEnabled ? 'AKTIF (ON)' : 'NONAKTIF (OFF)'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Global Carousel Controls (AutoPlay & Duration) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/70">
          
          {/* AutoPlay Toggle */}
          <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                {currentConfig.autoPlay ? <Play className="w-3.5 h-3.5 text-emerald-500" /> : <Pause className="w-3.5 h-3.5 text-amber-500" />}
                <span>Auto-Play Slide</span>
              </div>
              <div className="text-[10px] text-slate-400">Berganti slide secara otomatis</div>
            </div>
            <button
              type="button"
              onClick={() => handleToggleAutoPlay(!currentConfig.autoPlay)}
              className={`px-3 py-1 rounded-lg text-xs font-black cursor-pointer transition-all ${
                currentConfig.autoPlay
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              {currentConfig.autoPlay ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Interval Duration */}
          <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                <span>Durasi Perpindahan</span>
              </div>
              <div className="text-[10px] text-slate-400">Waktu tayang per gambar</div>
            </div>
            <select
              value={currentConfig.intervalSeconds || 5}
              onChange={(e) => handleChangeInterval(Number(e.target.value))}
              className="bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs font-bold rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
            >
              <option value={3}>3 Detik (Cepat)</option>
              <option value={5}>5 Detik (Ideal)</option>
              <option value={7}>7 Detik (Sedang)</option>
              <option value={10}>10 Detik (Lambat)</option>
            </select>
          </div>

          {/* Status Slide Aktif */}
          <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 sm:col-span-2 lg:col-span-1">
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-purple-500" />
                <span>Total Slide Aktif</span>
              </div>
              <div className="text-[10px] text-slate-400">Dari total {(currentConfig.slides || []).length} slide tersimpan</div>
            </div>
            <span className="text-sm font-black px-3 py-1 bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 rounded-lg border border-purple-200 dark:border-purple-800">
              {activeCount} Slide
            </span>
          </div>

        </div>

      </div>

      {/* 2. PANDUAN & INSTRUKSI UKURAN GAMBAR (Spesifik & Lengkap) */}
      <div className="bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-purple-500/10 dark:from-amber-950/30 dark:via-indigo-950/30 dark:to-purple-950/30 rounded-3xl p-6 border border-amber-500/30 dark:border-amber-500/20 space-y-3">
        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-black text-sm">
          <Info className="w-4 h-4 text-amber-500 shrink-0" />
          <span>📐 Panduan &amp; Rekomendasi Ukuran Gambar Slide Show / Banner</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-xs">
          <div className="bg-white/80 dark:bg-slate-900/80 p-3.5 rounded-2xl border border-amber-500/20 shadow-sm space-y-1">
            <span className="font-extrabold text-amber-700 dark:text-amber-400 block">
              1. Ukuran Ideal (Rekomendasi)
            </span>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
              Gunakan resolusi <strong className="font-mono text-indigo-600 dark:text-indigo-400">1920 × 600 px</strong> (Rasio ~16:5 / 3.2:1) atau <strong className="font-mono text-indigo-600 dark:text-indigo-400">1200 × 400 px</strong> (Rasio 3:1).
            </p>
          </div>

          <div className="bg-white/80 dark:bg-slate-900/80 p-3.5 rounded-2xl border border-amber-500/20 shadow-sm space-y-1">
            <span className="font-extrabold text-indigo-700 dark:text-indigo-400 block">
              2. Otomatis Menyesuaikan Layar
            </span>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
              Sistem website telah dilengkapi CSS pintar <code>object-fit: cover</code> yang secara otomatis mengatur proporsi banner secara proporsional di Desktop, Laptop, iPad, maupun Layar HP.
            </p>
          </div>

          <div className="bg-white/80 dark:bg-slate-900/80 p-3.5 rounded-2xl border border-amber-500/20 shadow-sm space-y-1">
            <span className="font-extrabold text-purple-700 dark:text-purple-400 block">
              3. Format &amp; Gambar Bergerak
            </span>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
              Mendukung file format <strong>PNG, JPG, WebP, SVG</strong>, serta <strong>GIF Animasi (Gambar Bergerak)</strong> untuk flyer kegiatan interaktif.
            </p>
          </div>
        </div>
      </div>

      {/* 3. LIVE INTERACTIVE PREVIEW BOX */}
      {currentConfig.isEnabled && (currentConfig.slides || []).length > 0 && (
        <div className={`${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} rounded-3xl border shadow-xl p-6 space-y-3`}>
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2 font-black text-sm text-slate-900 dark:text-white">
              <Eye className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Pratinjau Langsung (Live Preview di Sisi Satker)</span>
            </div>
            <span className="text-[11px] text-slate-400">
              Menampilkan carousel interaktif persis seperti tampilan di dashboard
            </span>
          </div>

          <div className="pt-2">
            <SlideShowBannerCarousel
              config={currentConfig}
              activeTab="dashboard"
              isDark={isDark}
              isAdmin={false}
            />
          </div>
        </div>
      )}

      {/* 4. FORM TAMBAH / EDIT SLIDE BANNER */}
      <div className={`${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'} rounded-3xl border shadow-xl p-6 sm:p-8 space-y-6`}>
        
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h4 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>{editingSlideId ? 'Edit Slide Banner' : 'Tambah Slide Banner Baru'}</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Unggah file gambar banner atau masukkan tautan URL poster, judul kegiatan, dan link terkait.
            </p>
          </div>

          {editingSlideId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 transition-all flex items-center gap-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Batal Edit</span>
            </button>
          )}
        </div>

        <form onSubmit={handleSaveSlide} className="space-y-5">
          
          {/* 1. Image Upload Dropzone & Image URL */}
          <div className="space-y-3 bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80">
            <label className="block text-xs font-extrabold text-slate-900 dark:text-white">
              Gambar Banner / Poster (Pilih Salah Satu: Unggah File ATAU Masukkan URL) *
            </label>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              
              {/* Option A: Direct File Upload */}
              <div className="md:col-span-6">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                  onChange={handleImageFileUpload}
                  className="hidden"
                  id="slide-image-file-input"
                />
                <label
                  htmlFor="slide-image-file-input"
                  className="w-full flex flex-col items-center justify-center p-4 border-2 border-dashed border-indigo-300 dark:border-indigo-700/80 rounded-2xl hover:border-indigo-500 bg-white dark:bg-slate-900 cursor-pointer transition-all hover:bg-indigo-50/50"
                >
                  <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center mb-2">
                    {imageUploadLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                  </div>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    {imageUploadLoading ? 'Memproses Gambar...' : 'Klik untuk Unggah Gambar dari Komputer'}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    Mendukung JPG, PNG, WebP, SVG, &amp; GIF Animasi
                  </span>
                </label>
              </div>

              {/* Option B: Direct Image URL */}
              <div className="md:col-span-6 space-y-2">
                <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  Atau masukkan URL Tautan Gambar Publik / Google Drive / CDN:
                </div>
                <input
                  type="url"
                  placeholder="https://drive.google.com/file/d/.../view atau https://example.com/banner.png"
                  value={formData.imageUrl}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData((prev) => ({ ...prev, imageUrl: val }));
                  }}
                  onBlur={(e) => {
                    const val = e.target.value.trim();
                    if (val && isGoogleDriveUrl(val)) {
                      const normalized = normalizeImageUrl(val);
                      if (normalized !== val) {
                        setFormData((prev) => ({ ...prev, imageUrl: normalized }));
                      }
                    }
                  }}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-200 font-mono"
                />

                {/* Google Drive Detection Notice */}
                {isGoogleDriveUrl(formData.imageUrl) && (
                  <div className="text-[11px] bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800 text-cyan-800 dark:text-cyan-200 px-3 py-2 rounded-xl flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-extrabold block">Link Google Drive Terdeteksi:</span>
                      <span>Sistem otomatis mengonversi ke format embed langsung (<code>lh3.googleusercontent.com/d/...</code>). Pastikan akses file di Google Drive disetel ke <strong>"Siapa saja yang memiliki link"</strong> (Anyone with link / Publik).</span>
                    </div>
                  </div>
                )}

                {/* Quick Sample Image Buttons */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-400">Gunakan Sampel Cepat:</span>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      imageUrl: 'https://images.unsplash.com/photo-1591604466107-ec97de577aff?auto=format&fit=crop&w=1920&q=80',
                      title: 'Spectrum Ramadhan 1446 H',
                      subtitle: 'Meningkatkan Iman, Taqwa, dan Ukhuwah untuk Menggapai Maghfirah',
                      badge: 'EVENT',
                      eventDate: 'Jumat, 21 Februari 2025',
                      eventTime: '09.30 s.d 12.15 WIB',
                      eventLocation: 'id: 432 277 387 738 (password: iu63Po97) • MT. Tazkiyatun Nufus',
                      linkLabel: 'Gabung Acara'
                    }))}
                    className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100"
                  >
                    Ramadhan Event
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      imageUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1920&q=80',
                      title: 'Sosialisasi IKPA & Revolving UP KPPN',
                      subtitle: 'Panduan Praktis Akselerasi Penyerapan Anggaran & Sertifikasi Pejabat',
                      badge: 'BIMTEK',
                      eventDate: 'Selasa, 25 Agustus 2026',
                      eventTime: '09.00 - 12.00 WIB',
                      eventLocation: 'Aula KPPN Semarang I / Hybrid Zoom',
                      linkLabel: 'Unduh Materi'
                    }))}
                    className="text-[10px] font-bold px-2 py-0.5 bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 rounded border border-amber-200 dark:border-amber-800 hover:bg-amber-100"
                  >
                    Sosialisasi IKPA
                  </button>
                </div>
              </div>

            </div>

            {/* Thumbnail Preview of Chosen Image */}
            {formData.imageUrl && (
              <div className="pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <div className="w-28 h-16 rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 bg-slate-950 shrink-0 relative flex items-center justify-center">
                    <img
                      src={normalizeImageUrl(formData.imageUrl)}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onLoad={() => setImagePreviewError(false)}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        const altUrl = getAlternativeImageUrl(formData.imageUrl);
                        if (altUrl && target.src !== altUrl) {
                          target.src = altUrl;
                        } else {
                          setImagePreviewError(true);
                        }
                      }}
                    />
                    {imagePreviewError && (
                      <div className="absolute inset-0 bg-rose-950/80 flex flex-col items-center justify-center text-rose-200 p-1 text-center">
                        <AlertTriangle className="w-4 h-4 text-rose-400 mb-0.5" />
                        <span className="text-[9px] font-bold">Gagal Dimuat</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-1">
                    {!imagePreviewError ? (
                      <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>Gambar banner berhasil dimuat dan siap ditampilkan!</span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="text-xs text-rose-600 dark:text-rose-400 font-extrabold flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                          <span>Gambar Tidak Dapat Dimuat dari URL Ini</span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                          {isGoogleDriveUrl(formData.imageUrl) ? (
                            <>
                              File Google Drive belum memiliki izin akses publik. <strong>Solusi:</strong> Buka Google Drive &gt; Klik Bagikan (Share) &gt; Ubah Akses Umum ke <strong>"Siapa saja yang memiliki link"</strong> (Anyone with the link). Atau langsung gunakan tombol <strong>"Unggah Gambar dari Komputer"</strong> di atas.
                            </>
                          ) : (
                            <>
                              Pastikan URL gambar berakhiran format gambar (misal .jpg / .png / .webp) dan dapat diakses publik, atau unggah langsung filenya dari komputer Anda.
                            </>
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Mode Penyesuaian Gambar (Fit Mode) */}
                <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      Mode Penyesuaian Tampilan Gambar (Agar Tidak Terpotong):
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Pilih bagaimana gambar disesuaikan dengan bingkai banner website.
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, imageFit: 'contain' }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        formData.imageFit !== 'cover'
                          ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-500/30'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                      title="Menampilkan seluruh poster utuh 100% dari atas sampai bawah tanpa terpotong"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>🎯 Pas &amp; Utuh (Tidak Terpotong)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, imageFit: 'cover' }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        formData.imageFit === 'cover'
                          ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-500/30'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                      title="Memenuhi seluruh bingkai banner"
                    >
                      <span>📐 Isi Penuh (Cover)</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. Judul, Subjudul & Badge */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            
            <div className="md:col-span-8 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Judul Utama Acara / Pengumuman (Opsional)
                </label>
                <span className="text-[10px] text-slate-400 font-medium">
                  Boleh kosong jika hanya berupa flyer poster gambar
                </span>
              </div>
              <input
                type="text"
                placeholder="Contoh: Spectrum Ramadhan 1446 H (Boleh kosong jika ingin gambar flyer saja)"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
              />
            </div>

            <div className="md:col-span-4 space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Badge / Kategori Acara
              </label>
              <input
                type="text"
                placeholder="Contoh: EVENT / KAJIAN / SOSIALISASI"
                value={formData.badge}
                onChange={(e) => setFormData((prev) => ({ ...prev, badge: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-indigo-500 text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div className="md:col-span-12 space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Subjudul / Tema Acara / Deskripsi Singkat
              </label>
              <input
                type="text"
                placeholder="Contoh: Meningkatkan Iman, Taqwa, dan Ukhuwah untuk Menggapai Maghfirah"
                value={formData.subtitle}
                onChange={(e) => setFormData((prev) => ({ ...prev, subtitle: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
              />
            </div>

          </div>

          {/* 3. Event Details: Date, Time, Zoom/Location */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                📅 Tanggal Acara (Opsional)
              </label>
              <input
                type="text"
                placeholder="Contoh: Jumat, 21 Februari 2025"
                value={formData.eventDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, eventDate: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                ⏰ Waktu / Jam (Opsional)
              </label>
              <input
                type="text"
                placeholder="Contoh: 09.30 s.d 12.15 WIB"
                value={formData.eventTime}
                onChange={(e) => setFormData((prev) => ({ ...prev, eventTime: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                📍 Info Zoom ID / Tempat (Opsional)
              </label>
              <input
                type="text"
                placeholder="Contoh: id: 432 277 387 738 (Pass: iu63Po97)"
                value={formData.eventLocation}
                onChange={(e) => setFormData((prev) => ({ ...prev, eventLocation: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          {/* 4. Action Link & Target Tabs */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-7 space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                🔗 Tautan Aksi (Link Zoom / Form Pendaftaran / Drive)
              </label>
              <input
                type="url"
                placeholder="https://zoom.us/j/..."
                value={formData.linkUrl}
                onChange={(e) => setFormData((prev) => ({ ...prev, linkUrl: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="md:col-span-5 space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Label Tombol Tautan
              </label>
              <input
                type="text"
                placeholder="Contoh: Gabung Zoom / Lihat Info"
                value={formData.linkLabel}
                onChange={(e) => setFormData((prev) => ({ ...prev, linkLabel: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="md:col-span-12 space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                🎯 Target Menu / Tab Tampilan
              </label>
              <select
                value={formData.targetTabs?.[0] || 'ALL'}
                onChange={(e) => setFormData((prev) => ({ ...prev, targetTabs: [e.target.value] }))}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                {availableTabOptions.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Switch & Submit Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
                className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Aktifkan Slide Ini (Tayangkan pada Slide Show)
              </span>
            </label>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{editingSlideId ? 'Simpan Perubahan Slide' : 'Tambahkan ke Slide Show'}</span>
            </button>
          </div>

        </form>

      </div>

      {/* 5. DAFTAR SLIDE TERSIMPAN */}
      <div className={`${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'} rounded-3xl border shadow-xl p-6 sm:p-8 space-y-4`}>
        
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h4 className="text-base font-black flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-500" />
            <span>Daftar Slide Tersimpan ({(currentConfig.slides || []).length})</span>
          </h4>
          <span className="text-xs text-slate-500">
            Urutkan, aktifkan, atau hapus slide banner
          </span>
        </div>

        <div className="space-y-3">
          {(currentConfig.slides || []).length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              Belum ada slide banner yang dibuat. Tambahkan slide pertama Anda di atas.
            </div>
          ) : (
            currentConfig.slides.map((slide, idx) => (
              <div
                key={slide.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  slide.isActive
                    ? 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                    : 'bg-slate-100/60 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 opacity-60'
                }`}
              >
                {/* Left side: Thumbnail & Title Info */}
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  {/* Thumbnail */}
                  <div className="w-20 h-14 rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 bg-slate-950 shrink-0">
                    {slide.imageUrl ? (
                      <img
                        src={normalizeImageUrl(slide.imageUrl)}
                        alt={slide.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          const altUrl = getAlternativeImageUrl(slide.imageUrl);
                          if (altUrl && target.src !== altUrl) {
                            target.src = altUrl;
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-500">
                        No Image
                      </div>
                    )}
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {slide.badge && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                          {slide.badge}
                        </span>
                      )}
                      <h5 className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                        {slide.title?.trim() ? slide.title : 'Banner Poster Gambar (Tanpa Judul)'}
                      </h5>
                    </div>

                    {slide.subtitle && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {slide.subtitle}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                      {slide.eventDate && <span>🗓️ {slide.eventDate}</span>}
                      {slide.eventTime && <span>• ⏰ {slide.eventTime}</span>}
                      {slide.targetTabs && (
                        <span>• 🎯 {slide.targetTabs.includes('ALL') ? 'Semua Menu' : slide.targetTabs.join(', ')}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right side: Reorder buttons, Active toggle, Edit, Delete */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                  {/* Reorder Buttons */}
                  <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveOrder(idx, 'up')}
                      className="p-1 rounded text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 cursor-pointer"
                      title="Geser Naik"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === (currentConfig.slides || []).length - 1}
                      onClick={() => handleMoveOrder(idx, 'down')}
                      className="p-1 rounded text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 cursor-pointer"
                      title="Geser Turun"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Toggle Active */}
                  <button
                    type="button"
                    onClick={() => handleToggleSlideActive(slide.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer transition-all ${
                      slide.isActive
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {slide.isActive ? 'AKTIF' : 'NONAKTIF'}
                  </button>

                  {/* Edit */}
                  <button
                    type="button"
                    onClick={() => handleEditClick(slide)}
                    className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-700 dark:text-slate-300 hover:text-indigo-600 rounded-xl transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
                    title="Edit Slide"
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => handleDeleteSlide(slide.id, slide.title)}
                    className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-700 dark:text-slate-300 hover:text-rose-600 rounded-xl transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
                    title="Hapus Slide"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

      </div>

    </div>
  );
};
