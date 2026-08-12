import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Presentation,
  Search,
  Filter,
  Play,
  Pause,
  Maximize2,
  Minimize2,
  X,
  Lock,
  Pin,
  Calendar,
  User,
  Sparkles,
  Layers,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Pencil,
  Highlighter,
  Trash2,
  MousePointer,
  Circle,
  Clock,
  Eye,
  AlertTriangle,
  Star,
  CheckCircle2,
  HelpCircle,
  EyeOff
} from 'lucide-react';
import { PresentationMaterial, AppTheme, DashboardConfig } from '../types';

interface MateriSlideTabProps {
  materials?: PresentationMaterial[];
  theme?: AppTheme;
  dashboardConfig?: DashboardConfig;
}

type AnnotationTool = 'pointer' | 'laser' | 'pen' | 'highlighter';

interface DrawingStroke {
  tool: 'pen' | 'highlighter';
  color: string;
  width: number;
  points: { x: number; y: number }[];
}

// Default fallback materials if none provided by Admin
const DEFAULT_MATERIALS: PresentationMaterial[] = [];

export const MateriSlideTab: React.FC<MateriSlideTabProps> = ({
  materials: propsMaterials,
  theme = 'light',
  dashboardConfig
}) => {
  const isDark = theme === 'dark';
  
  // Combine material sources
  const displayMaterials = (propsMaterials && propsMaterials.length > 0)
    ? propsMaterials
    : (dashboardConfig?.presentationMaterials && dashboardConfig.presentationMaterials.length > 0)
    ? dashboardConfig.presentationMaterials
    : DEFAULT_MATERIALS;

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [filterImportance, setFilterImportance] = useState<string>('ALL');

  // Slide Show Modal State
  const [activeSlideShow, setActiveSlideShow] = useState<PresentationMaterial | null>(null);
  const [isFullscreenMode, setIsFullscreenMode] = useState<boolean>(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState<boolean>(false);

  // Presenter Controls State
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(1);
  const [zoomLevel, setZoomLevel] = useState<number>(100); // 100% default
  const [isPlayingAuto, setIsPlayingAuto] = useState<boolean>(false);
  const [autoSpeedSeconds, setAutoSpeedSeconds] = useState<number>(5);

  // Timer Stopwatch State
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // Canvas Drawing & Laser State
  const [activeTool, setActiveTool] = useState<AnnotationTool>('pointer');
  const [penColor, setPenColor] = useState<string>('#ef4444'); // Default Red
  const [penWidth, setPenWidth] = useState<number>(4);
  const [strokes, setStrokes] = useState<DrawingStroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<{ x: number; y: number }[] | null>(null);
  
  // Laser Dot Position
  const [laserPos, setLaserPos] = useState<{ x: number; y: number } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const modalContainerRef = useRef<HTMLDivElement | null>(null);

  const categories = [
    'ALL',
    'PER-5 & IKPA',
    'SAKTI & Juknis',
    'Bimtek Perbendaharaan',
    'Mekanisme SP2D',
    'Laporan Keuangan',
    'Umum'
  ];

  // Sync fullscreen state with Browser Fullscreen API
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreenMode(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, []);

  // Request Native Fullscreen
  const toggleNativeFullscreen = async () => {
    const target = modalContainerRef.current || document.documentElement;
    if (!document.fullscreenElement) {
      try {
        if (target.requestFullscreen) {
          await target.requestFullscreen();
        } else if ((target as any).webkitRequestFullscreen) {
          await (target as any).webkitRequestFullscreen();
        }
        setIsFullscreenMode(true);
      } catch (err) {
        console.warn('Native fullscreen not available, falling back to viewport expansion', err);
        setIsFullscreenMode(true);
      }
    } else {
      try {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
        setIsFullscreenMode(false);
      } catch (err) {
        setIsFullscreenMode(false);
      }
    }
  };

  // Filter Active & Matching Materials
  const filteredMaterials = displayMaterials.filter((item) => {
    // Hide inactive materials unless specified
    if (item.isActive === false) return false;

    if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
      return false;
    }

    if (filterImportance !== 'ALL') {
      if (filterImportance === 'PENTING' && item.importance !== 'Penting' && item.importance !== 'Sangat Penting' && !item.isPinned) {
        return false;
      }
      if (filterImportance === 'SANGAT_PENTING' && item.importance !== 'Sangat Penting') {
        return false;
      }
    }

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      const matchPresenter = item.presenter.toLowerCase().includes(q);
      const matchTags = item.tags?.some(t => t.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchPresenter && !matchTags) {
        return false;
      }
    }
    return true;
  }).sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    if (a.importance === 'Sangat Penting' && b.importance !== 'Sangat Penting') return -1;
    if (a.importance !== 'Sangat Penting' && b.importance === 'Sangat Penting') return 1;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  // Reset presenter tools state when opening a new slide show
  useEffect(() => {
    if (activeSlideShow) {
      setCurrentSlideIndex(1);
      setZoomLevel(100);
      setIsPlayingAuto(false);
      setTimerSeconds(0);
      setIsTimerRunning(true);
      setActiveTool('pointer');
      setStrokes([]);
      setCurrentStroke(null);
    } else {
      setIsTimerRunning(false);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }, [activeSlideShow]);

  // Timer Stopwatch tick
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && activeSlideShow) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, activeSlideShow]);

  // Auto-play slides tick
  useEffect(() => {
    let playInterval: any = null;
    if (isPlayingAuto && activeSlideShow) {
      const total = activeSlideShow.slideCount || 30;
      playInterval = setInterval(() => {
        setCurrentSlideIndex(prev => (prev >= total ? 1 : prev + 1));
      }, autoSpeedSeconds * 1000);
    }
    return () => clearInterval(playInterval);
  }, [isPlayingAuto, autoSpeedSeconds, activeSlideShow]);

  // Keyboard Navigation Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!activeSlideShow) return;

      const total = activeSlideShow.slideCount || 30;

      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        setCurrentSlideIndex(prev => Math.min(total, prev + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        setCurrentSlideIndex(prev => Math.max(1, prev - 1));
      } else if (e.key === 'f' || e.key === 'F') {
        toggleNativeFullscreen();
      } else if (e.key === 'c' || e.key === 'C') {
        clearCanvas();
      } else if (e.key === '?') {
        setShowShortcutsHelp(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSlideShow]);

  // Canvas Redraw Logic
  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw saved strokes
    strokes.forEach(stroke => {
      if (stroke.points.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }

      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (stroke.tool === 'highlighter') {
        ctx.globalAlpha = 0.45;
      } else {
        ctx.globalAlpha = 1.0;
      }

      ctx.stroke();
    });

    // Draw active stroke
    if (currentStroke && currentStroke.length > 1) {
      ctx.beginPath();
      ctx.moveTo(currentStroke[0].x, currentStroke[0].y);

      for (let i = 1; i < currentStroke.length; i++) {
        ctx.lineTo(currentStroke[i].x, currentStroke[i].y);
      }

      ctx.strokeStyle = penColor;
      ctx.lineWidth = activeTool === 'highlighter' ? penWidth * 3 : penWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = activeTool === 'highlighter' ? 0.45 : 1.0;
      ctx.stroke();
    }

    ctx.globalAlpha = 1.0;
  };

  useEffect(() => {
    redrawCanvas();
  }, [strokes, currentStroke]);

  // Adjust canvas resolution dynamically
  useEffect(() => {
    if (activeSlideShow && containerRef.current && canvasRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      canvasRef.current.width = rect.width;
      canvasRef.current.height = rect.height;
      redrawCanvas();
    }
  }, [activeSlideShow, zoomLevel, isFullscreenMode]);

  // Canvas Drawing Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool === 'pointer' || activeTool === 'laser') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setCurrentStroke([{ x, y }]);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeTool === 'laser') {
      setLaserPos({ x, y });
    } else {
      setLaserPos(null);
    }

    if (!currentStroke) return;
    setCurrentStroke(prev => (prev ? [...prev, { x, y }] : null));
  };

  const handleMouseUp = () => {
    if (currentStroke && currentStroke.length > 1) {
      setStrokes(prev => [
        ...prev,
        {
          tool: activeTool === 'highlighter' ? 'highlighter' : 'pen',
          color: penColor,
          width: activeTool === 'highlighter' ? penWidth * 3 : penWidth,
          points: currentStroke
        }
      ]);
    }
    setCurrentStroke(null);
  };

  const clearCanvas = () => {
    setStrokes([]);
    setCurrentStroke(null);
  };

  // Helper to format embed URL with slide parameter
  const formatEmbedUrl = (rawUrl: string, slideIndex: number): string => {
    if (!rawUrl) return '';
    let url = rawUrl;
    
    if (url.includes('drive.google.com') && url.includes('/view')) {
      url = url.replace('/view', '/preview');
    }
    
    if (url.includes('docs.google.com/presentation')) {
      if (!url.includes('/embed')) {
        url = url.replace(/\/edit.*$/, '/embed?start=false&loop=false&delayms=3000');
        url = url.replace(/\/pub.*$/, '/embed?start=false&loop=false&delayms=3000');
      }
      if (url.includes('#slide=')) {
        url = url.replace(/#slide=.*$/, `#slide=id.p${slideIndex}`);
      } else {
        url = `${url}#slide=id.p${slideIndex}`;
      }
    }

    return url;
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const totalSlides = activeSlideShow?.slideCount || 30;

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* Top Banner / Header */}
      <div className={`p-6 sm:p-8 rounded-3xl border shadow-xl relative overflow-hidden ${
        isDark
          ? 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-slate-800 text-white'
          : 'bg-gradient-to-r from-indigo-900 via-slate-900 to-sky-900 border-indigo-200 text-white shadow-indigo-900/10'
      }`}>
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 text-[10px] sm:text-xs font-black uppercase px-3 py-1 rounded-full flex items-center gap-1.5 shadow-xs backdrop-blur-md">
              <Presentation className="w-3.5 h-3.5 text-indigo-300" />
              {dashboardConfig?.customTexts?.materiSlideBadge || 'Galeri Slide Show & Modul Perbendaharaan KPPN Semarang I'}
            </span>

            <span className="bg-rose-500/20 text-rose-200 border border-rose-500/40 text-[10px] sm:text-xs font-extrabold px-3 py-1 rounded-full flex items-center gap-1">
              <Lock className="w-3 h-3 text-rose-400" />
              Proteksi Hak Cipta (Mode Slide Show &amp; Fullscreen)
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black leading-tight tracking-tight">
            {dashboardConfig?.customTexts?.materiSlideTitle || 'Kumpulan Slide Presentation & PowerPoint'}
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
            {dashboardConfig?.customTexts?.materiSlideSubtitle || 'Pusat paparan sosialisasi, bimbingan teknis, dan modul PowerPoint perbendaharaan. Nikmati fitur Slide Show Layar Penuh (Native Fullscreen), Navigasi Slide, Zoom In/Out, serta Laser &amp; Pena Coret-Coret langsung di dashboard.'}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-indigo-200/90 font-bold">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>{filteredMaterials.length} Modul Active Ready</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Maximize2 className="w-4 h-4 text-sky-400" />
              <span>Dukungan Native Fullscreen Monitor HD</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Pencil className="w-4 h-4 text-emerald-400" />
              <span>Laser Pointer &amp; Stabilo Coret Slide</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Panel: Search & Filters */}
      <div className={`p-4 sm:p-5 rounded-2xl border ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      } space-y-4`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari materi PowerPoint, judul PER-5, atau kata kunci SAKTI..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full text-xs rounded-xl pl-10 pr-4 py-2.5 border focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                isDark 
                  ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400' 
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Importance Priority Filter */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold text-slate-500 hidden sm:inline">Prioritas:</span>
            <button
              onClick={() => setFilterImportance('ALL')}
              className={`px-3 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                filterImportance === 'ALL'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setFilterImportance('PENTING')}
              className={`px-3 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1 transition-all cursor-pointer ${
                filterImportance === 'PENTING'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300/60'
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>Sangat Penting / Pinned</span>
            </button>
          </div>

        </div>

        {/* Categories Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none">
          <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            Topik:
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 border border-indigo-400/40'
                  : isDark
                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
              }`}
            >
              {cat === 'ALL' ? 'Semua Topik Slide' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Presentation Cards Grid */}
      {filteredMaterials.length === 0 ? (
        <div className={`p-12 text-center rounded-3xl border ${
          isDark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
        } space-y-3`}>
          <div className="p-4 bg-indigo-500/10 text-indigo-500 rounded-2xl w-14 h-14 flex items-center justify-center mx-auto">
            <Presentation className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Tidak Ada Materi Presentation Aktif Ditemukan</h3>
          <p className="text-xs max-w-md mx-auto text-slate-500">
            Coba sesuaikan kata kunci pencarian atau ganti filter kategori topik materi.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMaterials.map((material) => (
            <motion.div
              key={material.id}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className={`rounded-3xl border flex flex-col justify-between overflow-hidden transition-all shadow-md relative ${
                material.importance === 'Sangat Penting' || material.isPinned
                  ? isDark
                    ? 'bg-slate-900 border-amber-500/50 ring-2 ring-amber-500/30'
                    : 'bg-white border-amber-400 ring-2 ring-amber-400/40 shadow-amber-500/5'
                  : material.importance === 'Penting'
                  ? isDark
                    ? 'bg-slate-900 border-sky-500/40'
                    : 'bg-white border-sky-300'
                  : isDark
                  ? 'bg-slate-900 border-slate-800'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="p-5 sm:p-6 space-y-4">
                
                {/* Header Category & Badges */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
                    material.category === 'PER-5 & IKPA' ? 'bg-emerald-100 text-emerald-950 border-emerald-300' :
                    material.category === 'SAKTI & Juknis' ? 'bg-sky-100 text-sky-950 border-sky-300' :
                    material.category === 'Mekanisme SP2D' ? 'bg-indigo-100 text-indigo-950 border-indigo-300' :
                    'bg-slate-100 text-slate-900 border-slate-300'
                  }`}>
                    {material.category}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {material.importance === 'Sangat Penting' && (
                      <span className="bg-rose-500 text-white font-black px-2.5 py-0.5 rounded-full text-[10px] flex items-center gap-1 border border-rose-600 shadow-xs animate-pulse">
                        <Star className="w-2.5 h-2.5 fill-current" />
                        SANGAT PENTING
                      </span>
                    )}

                    {material.importance === 'Penting' && !material.importance?.includes('Sangat') && (
                      <span className="bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1 border border-amber-600">
                        <Sparkles className="w-2.5 h-2.5 fill-current" />
                        Penting
                      </span>
                    )}

                    {material.isPinned && (
                      <span className="bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1 border border-amber-500">
                        <Pin className="w-2.5 h-2.5 fill-current" />
                        Disematkan
                      </span>
                    )}

                    {material.slideCount && (
                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold px-2 py-0.5 rounded-full text-[10px] border border-slate-300 dark:border-slate-700 flex items-center gap-1">
                        <Layers className="w-2.5 h-2.5" />
                        {material.slideCount} Slide
                      </span>
                    )}
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-base sm:text-lg font-black leading-snug text-slate-900 dark:text-white line-clamp-2">
                  {material.title}
                </h3>

                {/* Description */}
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3 font-medium">
                  {material.description}
                </p>

                {/* Author & Date Metadata */}
                <div className="space-y-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-3">
                  <div className="flex items-center gap-1.5 truncate">
                    <User className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span className="truncate">Pemateri: <strong className="text-slate-800 dark:text-slate-200">{material.presenter}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>Tanggal: <strong className="text-slate-800 dark:text-slate-200">{material.date}</strong></span>
                  </div>
                </div>

                {/* Tags list */}
                {material.tags && material.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {material.tags.map(tag => (
                      <span key={tag} className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold px-2 py-0.5 rounded-md">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Bar: Slide Show Trigger */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-1 text-[10px] font-extrabold text-slate-500 dark:text-slate-400">
                  <Lock className="w-3 h-3 text-amber-600" />
                  <span>Interactive Slide Show</span>
                </div>

                <button
                  onClick={() => setActiveSlideShow(material)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs flex items-center gap-2 shadow-md shadow-indigo-600/30 transition-all cursor-pointer shrink-0"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Mulai Slide Show</span>
                </button>
              </div>

            </motion.div>
          ))}
        </div>
      )}

      {/* Slide Show Modal (Full Interactive Presentation Viewer with Native Fullscreen & Presenter Toolbar) */}
      <AnimatePresence>
        {activeSlideShow && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-0 bg-slate-950 backdrop-blur-md overflow-hidden">
            <motion.div
              ref={modalContainerRef}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              onContextMenu={(e) => e.preventDefault()} // Disable right-click on slide show modal frame
              className="w-full h-full border-0 shadow-2xl overflow-hidden flex flex-col bg-slate-950 text-white relative"
            >
              
              {/* Top Modal Header */}
              <div className="p-2.5 sm:p-3 bg-slate-900/95 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0 z-30 backdrop-blur-md">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-xl bg-indigo-600 text-white shrink-0">
                    <Presentation className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700/60">
                        {activeSlideShow.category}
                      </span>
                      {activeSlideShow.importance === 'Sangat Penting' && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-500 text-white animate-pulse">
                          SANGAT PENTING
                        </span>
                      )}
                      <span className="text-[10px] font-bold text-amber-400 hidden sm:flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Hak Cipta KPPN Semarang I
                      </span>
                    </div>
                    <h3 className="text-xs sm:text-sm font-black text-white truncate">
                      {activeSlideShow.title}
                    </h3>
                  </div>
                </div>

                {/* Right Header Badges & Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Timer Stopwatch */}
                  <div className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-amber-300 font-mono font-black text-xs flex items-center gap-1.5 shadow-xs">
                    <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                    <span>{formatTime(timerSeconds)}</span>
                  </div>

                  {/* Shortcuts Help Toggle */}
                  <button
                    onClick={() => setShowShortcutsHelp(!showShortcutsHelp)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                    title="Petunjuk Keyboard Shortcuts (?)"
                  >
                    <HelpCircle className="w-4 h-4 text-indigo-400" />
                  </button>

                  {/* Native Fullscreen Button */}
                  <button
                    onClick={toggleNativeFullscreen}
                    className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer flex items-center gap-1 text-xs font-black px-3 shadow-md shadow-indigo-600/30"
                    title={isFullscreenMode ? 'Keluar Fullscreen (F)' : 'Layar Penuh / Fullscreen Monitor (F)'}
                  >
                    {isFullscreenMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    <span className="hidden md:inline">{isFullscreenMode ? 'Exit Fullscreen' : 'Native Fullscreen'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveSlideShow(null);
                      setIsFullscreenMode(false);
                      if (document.fullscreenElement) {
                        document.exitFullscreen().catch(() => {});
                      }
                    }}
                    className="p-2 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white transition-colors cursor-pointer border border-rose-500/30"
                    title="Tutup Slide Show"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Main Presentation Stage & Canvas Coret-Coret */}
              <div 
                ref={containerRef}
                className="relative flex-1 bg-black overflow-hidden flex items-center justify-center select-none"
              >
                
                {/* Scalable Container for Zooming */}
                <div 
                  className="w-full h-full flex items-center justify-center transition-transform duration-150 ease-out origin-center"
                  style={{ transform: `scale(${zoomLevel / 100})` }}
                >
                  <iframe
                    src={formatEmbedUrl(activeSlideShow.embedUrl, currentSlideIndex)}
                    title={activeSlideShow.title}
                    className="w-full h-full min-h-[450px] border-0 pointer-events-auto"
                    allowFullScreen
                    sandbox="allow-scripts allow-same-origin allow-popups"
                  />
                </div>

                {/* Coret-Coret Drawing Canvas Layer */}
                <canvas
                  ref={canvasRef}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  className={`absolute inset-0 z-20 ${
                    activeTool === 'pointer' ? 'pointer-events-none' : 'pointer-events-auto cursor-crosshair'
                  }`}
                />

                {/* Laser Pointer Dot Overlay */}
                {activeTool === 'laser' && laserPos && (
                  <div
                    className="absolute z-25 w-6 h-6 rounded-full bg-rose-500 border-2 border-white shadow-[0_0_20px_#f43f5e] pointer-events-none transform -translate-x-1/2 -translate-y-1/2 transition-none animate-ping"
                    style={{ left: laserPos.x, top: laserPos.y }}
                  />
                )}
                {activeTool === 'laser' && laserPos && (
                  <div
                    className="absolute z-26 w-3.5 h-3.5 rounded-full bg-rose-500 border border-white shadow-[0_0_12px_#f43f5e] pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
                    style={{ left: laserPos.x, top: laserPos.y }}
                  />
                )}

                {/* Watermark Security Overlay */}
                <div className="absolute top-3 right-3 z-10 opacity-30 pointer-events-none text-[10px] font-black text-white bg-slate-900/80 px-2.5 py-1 rounded-md border border-white/20 uppercase tracking-widest">
                  KPPN SEMARANG I • PRESENTER SLIDE SHOW
                </div>

                {/* Shortcuts Tooltip Popup */}
                {showShortcutsHelp && (
                  <div className="absolute top-4 left-4 z-40 bg-slate-900/95 border border-slate-700 p-4 rounded-2xl shadow-2xl text-xs max-w-sm space-y-2 text-slate-200 backdrop-blur-md animate-fade-in">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="font-black text-amber-400 flex items-center gap-1">
                        <HelpCircle className="w-4 h-4" /> Keyboard Shortcuts Presentasi
                      </span>
                      <button onClick={() => setShowShortcutsHelp(false)} className="text-slate-400 hover:text-white">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <ul className="space-y-1 text-[11px] font-mono">
                      <li><strong className="text-white">Panah Kiri / Kanan:</strong> Pindah Slide</li>
                      <li><strong className="text-white">Space / PageDown:</strong> Slide Berikutnya</li>
                      <li><strong className="text-white">F:</strong> Toggle Native Fullscreen</li>
                      <li><strong className="text-white">C:</strong> Hapus Seluruh Coretan Slide</li>
                      <li><strong className="text-white">?:</strong> Buka / Tutup Bantuan Ini</li>
                    </ul>
                  </div>
                )}
              </div>

              {/* PREMIUM FLOATING PRESENTER TOOLBAR */}
              <div className="p-3 bg-slate-900/95 border-t border-slate-800 z-30 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 backdrop-blur-md">
                
                {/* 1. Slide Navigation Controls */}
                <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
                  <button
                    onClick={() => setCurrentSlideIndex(prev => Math.max(1, prev - 1))}
                    disabled={currentSlideIndex <= 1}
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-white font-bold transition-all cursor-pointer"
                    title="Slide Sebelumnya (Panah Kiri)"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="px-3 py-1 bg-slate-900 rounded-lg border border-slate-800 font-extrabold text-amber-300 text-xs flex items-center gap-1">
                    <span>Slide</span>
                    <input
                      type="number"
                      min={1}
                      max={totalSlides}
                      value={currentSlideIndex}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (!isNaN(val) && val >= 1 && val <= totalSlides) {
                          setCurrentSlideIndex(val);
                        }
                      }}
                      className="w-10 bg-slate-950 border border-slate-700 rounded text-center text-amber-400 font-black focus:outline-none focus:ring-1 focus:ring-amber-500 py-0.5"
                    />
                    <span className="text-slate-400">/ {totalSlides}</span>
                  </div>

                  <button
                    onClick={() => setCurrentSlideIndex(prev => Math.min(totalSlides, prev + 1))}
                    disabled={currentSlideIndex >= totalSlides}
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-white font-bold transition-all cursor-pointer"
                    title="Slide Berikutnya (Panah Kanan / Space)"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <div className="h-4 w-px bg-slate-800 my-auto mx-0.5" />

                  {/* Auto-Play Slide Toggle */}
                  <button
                    onClick={() => setIsPlayingAuto(!isPlayingAuto)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                      isPlayingAuto
                        ? 'bg-amber-500 text-slate-950 shadow-sm animate-pulse'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                    title={isPlayingAuto ? 'Hentikan Auto-Play' : 'Putar Otomatis (Auto Slide Show)'}
                  >
                    {isPlayingAuto ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                    <span className="hidden md:inline">{isPlayingAuto ? 'Pause' : 'Auto Play'}</span>
                  </button>
                </div>

                {/* 2. Interactive Annotation Pen & Laser Tools */}
                <div className="flex items-center gap-1 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
                  <span className="text-[10px] font-black uppercase text-slate-500 px-1 hidden lg:inline">Alat Presentasi:</span>

                  {/* Pointer Mode */}
                  <button
                    onClick={() => setActiveTool('pointer')}
                    className={`p-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1 transition-all cursor-pointer ${
                      activeTool === 'pointer'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                    }`}
                    title="Kursor Normal / Navigasi Slide"
                  >
                    <MousePointer className="w-4 h-4" />
                    <span className="hidden xl:inline">Navigasi</span>
                  </button>

                  {/* Laser Pointer */}
                  <button
                    onClick={() => setActiveTool('laser')}
                    className={`p-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1 transition-all cursor-pointer ${
                      activeTool === 'laser'
                        ? 'bg-rose-600 text-white shadow-md animate-pulse'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                    }`}
                    title="Laser Pointer (Sorotan Merah)"
                  >
                    <Circle className="w-4 h-4 fill-rose-500 text-rose-500" />
                    <span className="hidden xl:inline">Laser</span>
                  </button>

                  {/* Pen Mode (Coret-Coret) */}
                  <button
                    onClick={() => setActiveTool('pen')}
                    className={`p-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1 transition-all cursor-pointer ${
                      activeTool === 'pen'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                    }`}
                    title="Coret-Coret Slide (Pena Merah/Warna)"
                  >
                    <Pencil className="w-4 h-4" />
                    <span className="hidden xl:inline">Pena Coret</span>
                  </button>

                  {/* Highlighter Marker */}
                  <button
                    onClick={() => setActiveTool('highlighter')}
                    className={`p-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1 transition-all cursor-pointer ${
                      activeTool === 'highlighter'
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                    }`}
                    title="Stabilo / Marker Sorot Teks"
                  >
                    <Highlighter className="w-4 h-4" />
                    <span className="hidden xl:inline">Stabilo</span>
                  </button>

                  {/* Color Picker Palette */}
                  {(activeTool === 'pen' || activeTool === 'highlighter') && (
                    <div className="flex items-center gap-1 pl-1 border-l border-slate-800">
                      {['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#ffffff'].map(c => (
                        <button
                          key={c}
                          onClick={() => setPenColor(c)}
                          className={`w-5 h-5 rounded-full border-2 transition-transform cursor-pointer ${
                            penColor === c ? 'scale-125 border-white ring-2 ring-indigo-500' : 'border-transparent opacity-80 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Clear Canvas Drawing */}
                  <button
                    onClick={clearCanvas}
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 transition-colors cursor-pointer ml-1"
                    title="Hapus Semua Coretan (Tombol C)"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* 3. Zoom Controls */}
                <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
                  <button
                    onClick={() => setZoomLevel(prev => Math.max(50, prev - 15))}
                    disabled={zoomLevel <= 50}
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white font-bold transition-all cursor-pointer"
                    title="Perkecil Slide (Zoom Out)"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>

                  <span className="px-2 font-mono font-black text-indigo-300 text-xs w-12 text-center">
                    {zoomLevel}%
                  </span>

                  <button
                    onClick={() => setZoomLevel(prev => Math.min(200, prev + 15))}
                    disabled={zoomLevel >= 200}
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white font-bold transition-all cursor-pointer"
                    title="Perbesar Slide (Zoom In)"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setZoomLevel(100)}
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                    title="Reset Ukuran (100%)"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
