import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  Unlock,
  Pin,
  Calendar,
  User,
  Sparkles,
  Layers,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Pencil,
  Highlighter,
  Trash2,
  MousePointer,
  Circle,
  Clock,
  Star,
  HelpCircle,
  FileText,
  Hand,
  ArrowDown,
  ArrowUp,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  KeyRound,
  Eye,
  EyeOff,
  Globe,
  Scan,
  Crown,
  LogOut,
  AlertCircle
} from 'lucide-react';
import { PresentationMaterial, AppTheme, DashboardConfig, NavigationTab } from '../types';
import { AppUser } from '../types/user';
import { PdfSlideViewer } from './PdfSlideViewer';
import { PaginationControl } from './PaginationControl';

interface MateriSlideTabProps {
  materials?: PresentationMaterial[];
  theme?: AppTheme;
  dashboardConfig?: DashboardConfig;
  isAdminAuthenticated?: boolean;
  currentUser?: AppUser | null;
  onOpenLoginModal?: () => void;
  scope?: 'UMUM' | 'INTERNAL';
  onNavigateTab?: (tab: NavigationTab) => void;
}

type AnnotationTool = 'pointer' | 'hand' | 'laser' | 'pen' | 'highlighter';

interface DrawingStroke {
  tool: 'pen' | 'highlighter';
  color: string;
  width: number;
  points: { x: number; y: number }[];
}

// Default fallback materials for Public and Internal KPPN
const DEFAULT_MATERIALS: PresentationMaterial[] = [
  // 1. UMUM / PUBLIK (Dapat diakses seluruh Satker Mitra)
  {
    id: 'mat-umum-per5-ikpa',
    title: 'Panduan Peningkatan Nilai IKPA 2025 & Reformulasi PER-5/PB/2024',
    category: 'PER-5 & IKPA',
    description: 'Paparan komprehensif 8 indikator IKPA, formula deviasi Hal III DIPA, percepatan penyerapan anggaran, dan mitigasi dispensasi SPM bagi seluruh Satker.',
    presenter: 'Seksi MSKI KPPN Semarang I',
    date: '2026-09-15',
    embedUrl: 'https://docs.google.com/presentation/d/1_sample_ikpa_per5/preview',
    type: 'google_slides',
    slideCount: 32,
    isPinned: true,
    isActive: true,
    importance: 'Sangat Penting',
    accessType: 'UMUM',
    tags: ['IKPA', 'PER-5', 'Deviasi Hal III', 'Capaian Output']
  },
  {
    id: 'mat-umum-sakti-digitalisasi',
    title: 'Bimtek Digitalisasi Transaksi: Optimalisasi KKP Domestik & Digipay Satu',
    category: 'SAKTI & Juknis',
    description: 'Panduan praktis pendaftaran KKP, mekanisme belanja pengadaan barang/jasa via Marketplace Digipay, dan percepatan penyelesaian tagihan belanja modal.',
    presenter: 'Tim Pembina SAKTI KPPN Semarang I',
    date: '2026-09-08',
    embedUrl: 'https://docs.google.com/presentation/d/1_sample_kkp_digipay/preview',
    type: 'google_slides',
    slideCount: 28,
    isPinned: false,
    isActive: true,
    importance: 'Penting',
    accessType: 'UMUM',
    tags: ['KKP', 'Digipay Satu', 'SAKTI', 'Bendahara']
  },
  {
    id: 'mat-umum-rekon-lpj',
    title: 'Pedoman Rekonsiliasi Laporan Keuangan & Monitoring Kepatuhan LPJ Bendahara',
    category: 'Laporan Keuangan',
    description: 'Modul rekonsiliasi data belanja SAKTI vs SPAN, penanganan to-do list, penutupan periode pelaporan, serta tata cara penyampaian LPJ Bendahara tepat waktu.',
    presenter: 'Seksi Vera KPPN Semarang I',
    date: '2026-08-28',
    embedUrl: 'https://docs.google.com/presentation/d/1_sample_rekon_lpj/preview',
    type: 'google_slides',
    slideCount: 24,
    isPinned: false,
    isActive: true,
    importance: 'Penting',
    accessType: 'UMUM',
    tags: ['Rekonsiliasi', 'LPJ Bendahara', 'Laporan Keuangan', 'Vera']
  },
  // 2. KHUSUS INTERNAL KPPN (Satker TIDAK BISA BUKA / TERPROTEKSI)
  {
    id: 'mat-internal-rakor-pimpinan',
    title: 'Bahan Rapat Dinas Pimpinan: Evaluasi Komprehensif Kinerja & Anomali Satker Mitra',
    category: 'PER-5 & IKPA',
    description: 'Dokumen strategis internal: analisis tren deviasi belanja 50 satker, profil risiko dispensasi SPM akhir triwulan, dan matriks intervensi peringatan dini.',
    presenter: 'Kepala Seksi MSKI & Tim Analis KPPN',
    date: '2026-09-22',
    embedUrl: 'https://docs.google.com/presentation/d/1_sample_internal_rakor/preview',
    type: 'google_slides',
    slideCount: 45,
    isPinned: true,
    isActive: true,
    importance: 'Sangat Penting',
    accessType: 'INTERNAL',
    tags: ['Internal KPPN', 'Rapat Pimpinan', 'Evaluasi Kinerja', 'Rahasia']
  },
  {
    id: 'mat-internal-peta-risiko',
    title: 'Peta Strategis & Matriks Pembinaan Khusus Satker Berkinerja Rendah (Red Flags)',
    category: 'Umum',
    description: 'Pemetaan satker dengan nilai IKPA di bawah target nasional, evaluasi keterlambatan SPM, tindak lanjut pengaduan HAICSO, dan jadwal asistensi tatap muka.',
    presenter: 'Tim Monev Internal KPPN Semarang I',
    date: '2026-09-18',
    embedUrl: 'https://docs.google.com/presentation/d/1_sample_internal_redflags/preview',
    type: 'google_slides',
    slideCount: 36,
    isPinned: true,
    isActive: true,
    importance: 'Sangat Penting',
    accessType: 'INTERNAL',
    tags: ['Internal KPPN', 'Red Flags', 'Pembinaan Satker', 'Monev']
  },
  {
    id: 'mat-internal-sop-pera',
    title: 'Standar Operasional Prosedur (SOP) Pengujian Substantif SPM & Validasi SP2D',
    category: 'Mekanisme SP2D',
    description: 'Pedoman verifikasi dokumen tagihan SPM, validasi supplier, kepatuhan batas waktu penerbitan SP2D, serta mitigasi risiko fraud pada sistem SPAN.',
    presenter: 'Seksi Pencairan Dana (Pera) KPPN',
    date: '2026-09-10',
    embedUrl: 'https://docs.google.com/presentation/d/1_sample_internal_sop_pera/preview',
    type: 'google_slides',
    slideCount: 30,
    isPinned: false,
    isActive: true,
    importance: 'Penting',
    accessType: 'INTERNAL',
    tags: ['Internal KPPN', 'SOP Pera', 'Validasi SPM', 'SP2D']
  }
];

export const MateriSlideTab: React.FC<MateriSlideTabProps> = ({
  materials: propsMaterials,
  theme = 'light',
  dashboardConfig,
  isAdminAuthenticated = false,
  currentUser = null,
  onOpenLoginModal,
  scope,
  onNavigateTab
}) => {
  const isDark = theme === 'dark';
  // Sub-Tab internal: 'PUBLIK' (Slide Umum Satker) vs 'INTERNAL' (Slide Khusus Internal KPPN)
  const [slideSubTab, setSlideSubTab] = useState<'PUBLIK' | 'INTERNAL'>('PUBLIK');
  const activeScope: 'UMUM' | 'INTERNAL' = scope || (slideSubTab === 'INTERNAL' ? 'INTERNAL' : 'UMUM');

  useEffect(() => {
    if (scope) {
      setSlideSubTab(scope === 'INTERNAL' ? 'INTERNAL' : 'PUBLIK');
    }
  }, [scope]);

  // Internal Session Unlock State (Stored in session storage so refresh keeps internal session alive)
  const [isInternalSessionUnlocked, setIsInternalSessionUnlocked] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('kppn_slide_internal_unlocked') === 'true';
    }
    return false;
  });

  // Internal Security Gate verification state
  const [gatePasswordInput, setGatePasswordInput] = useState<string>('');
  const [gateErrorMsg, setGateErrorMsg] = useState<string | null>(null);
  const [showGatePassword, setShowGatePassword] = useState<boolean>(false);
  const [isVerifyingGate, setIsVerifyingGate] = useState<boolean>(false);

  // Determine whether current viewer has authorized internal clearance
  const isUserInternal = Boolean(isAdminAuthenticated || currentUser);
  const hasInternalAccess = isUserInternal || isInternalSessionUnlocked;
  
  // Combine material sources
  const displayMaterials = (propsMaterials && propsMaterials.length > 0)
    ? propsMaterials
    : (dashboardConfig?.presentationMaterials && dashboardConfig.presentationMaterials.length > 0)
    ? dashboardConfig.presentationMaterials
    : DEFAULT_MATERIALS;

  // Real-time counts
  const totalUmumCount = displayMaterials.filter(m => m.isActive !== false && m.accessType !== 'INTERNAL').length;
  const totalInternalCount = displayMaterials.filter(m => m.isActive !== false && m.accessType === 'INTERNAL').length;

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [filterImportance, setFilterImportance] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(6);

  // Internal Password Verification State (for single material prompt fallback)
  const [unlockedMaterialIds, setUnlockedMaterialIds] = useState<Set<string>>(new Set());
  const [promptPasswordMaterial, setPromptPasswordMaterial] = useState<PresentationMaterial | null>(null);
  const [inputPassword, setInputPassword] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showPasswordText, setShowPasswordText] = useState<boolean>(false);

  // Slide Show Modal State
  const [activeSlideShow, setActiveSlideShow] = useState<PresentationMaterial | null>(null);
  const [isFullscreenMode, setIsFullscreenMode] = useState<boolean>(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState<boolean>(false);

  // Presenter Controls State
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(1);
  const [detectedPdfPages, setDetectedPdfPages] = useState<number | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(100); // 100% default
  const [rotation, setRotation] = useState<number>(0); // 0, 90, 180, 270 deg (Firefox PDF style)
  const [fitMode, setFitMode] = useState<'page' | 'width'>('page'); // 'page' or 'width'
  const [isPlayingAuto, setIsPlayingAuto] = useState<boolean>(false);
  const [autoSpeedSeconds, setAutoSpeedSeconds] = useState<number>(5);

  // Pan Offset & Dragging State for Hand Tool / Scroll
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

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
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

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

    // Strict Scope Separation (Satker can NEVER see internal slides)
    if (slideSubTab === 'PUBLIK' && item.accessType === 'INTERNAL') {
      return false;
    }
    if (slideSubTab === 'INTERNAL' && item.accessType !== 'INTERNAL') {
      return false;
    }

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

  // Handle clicking on a material card
  const handleOpenMaterial = (material: PresentationMaterial) => {
    // If user has internal authorization, open directly without password barrier
    if (material.accessType === 'INTERNAL' && hasInternalAccess) {
      setActiveSlideShow(material);
      return;
    }

    // If Internal and not yet unlocked in this session
    if (material.accessType === 'INTERNAL' && !unlockedMaterialIds.has(material.id)) {
      setPromptPasswordMaterial(material);
      setInputPassword('');
      setPasswordError(null);
      setShowPasswordText(false);
      return;
    }

    // Otherwise open slide show directly
    setActiveSlideShow(material);
  };

  // Handle submitting password for internal slide
  const handleVerifyPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptPasswordMaterial) return;

    const correctPassword = promptPasswordMaterial.password;
    const entered = inputPassword.trim();
    const currentAdminPin = (typeof localStorage !== 'undefined' && localStorage.getItem('kppn_admin_pin')) || 'kppn026';

    if (
      (correctPassword && entered === correctPassword) ||
      (currentAdminPin && entered === currentAdminPin)
    ) {
      setUnlockedMaterialIds(prev => new Set(prev).add(promptPasswordMaterial.id));
      const targetMat = promptPasswordMaterial;
      setPromptPasswordMaterial(null);
      setPasswordError(null);
      setActiveSlideShow(targetMat);
    } else {
      setPasswordError('Password slide internal salah. Silakan periksa kembali kata sandi atau hubungi Admin KPPN.');
    }
  };

  // Handle submitting internal security clearance gate
  const handleVerifyGate = (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifyingGate(true);
    setGateErrorMsg(null);

    const entered = gatePasswordInput.trim();
    const currentAdminPin = (typeof localStorage !== 'undefined' && localStorage.getItem('kppn_admin_pin')) || 'kppn026';

    setTimeout(() => {
      if (currentAdminPin && entered === currentAdminPin) {
        setIsInternalSessionUnlocked(true);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('kppn_slide_internal_unlocked', 'true');
        }
        setGatePasswordInput('');
        setGateErrorMsg(null);
      } else {
        setGateErrorMsg('PIN / Kredensial Akses Internal KPPN tidak valid. Pastikan Anda memasukkan kode dinas yang benar.');
      }
      setIsVerifyingGate(false);
    }, 250);
  };

  // Handle locking internal session
  const handleLockInternalSession = () => {
    setIsInternalSessionUnlocked(false);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('kppn_slide_internal_unlocked');
    }
    setUnlockedMaterialIds(new Set());
    setActiveSlideShow(null);
  };

  // Reset presenter tools state when opening a new slide show
  useEffect(() => {
    if (activeSlideShow) {
      setCurrentSlideIndex(1);
      setDetectedPdfPages(null);
      setZoomLevel(100);
      setRotation(0);
      setFitMode('page');
      setPanOffset({ x: 0, y: 0 });
      setIsPlayingAuto(false);
      setTimerSeconds(0);
      setIsTimerRunning(true);
      setActiveTool('pointer');
      setStrokes([]);
      setCurrentStroke(null);
    } else {
      setDetectedPdfPages(null);
      setIsTimerRunning(false);
      setPanOffset({ x: 0, y: 0 });
      setRotation(0);
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
      const total = detectedPdfPages || activeSlideShow.slideCount || 30;
      playInterval = setInterval(() => {
        setCurrentSlideIndex(prev => (prev >= total ? 1 : prev + 1));
      }, autoSpeedSeconds * 1000);
    }
    return () => clearInterval(playInterval);
  }, [isPlayingAuto, autoSpeedSeconds, activeSlideShow, detectedPdfPages]);

  // Keyboard Navigation Listener (Firefox PDF Presentation Mode compliant)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!activeSlideShow) return;

      const total = detectedPdfPages || activeSlideShow.slideCount || 30;

      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        setCurrentSlideIndex(prev => Math.min(total, prev + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        setCurrentSlideIndex(prev => Math.max(1, prev - 1));
      } else if (e.key === 'Home') {
        e.preventDefault();
        setCurrentSlideIndex(1);
      } else if (e.key === 'End') {
        e.preventDefault();
        setCurrentSlideIndex(total);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        scrollSlideDown();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        scrollSlideUp();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        setRotation(prev => (e.shiftKey ? (prev - 90 + 360) % 360 : (prev + 90) % 360));
      } else if (e.key === 'h' || e.key === 'H') {
        setActiveTool(prev => (prev === 'hand' ? 'pointer' : 'hand'));
      } else if (e.key === 'f' || e.key === 'F') {
        toggleNativeFullscreen();
      } else if (e.key === 'c' || e.key === 'C') {
        clearCanvas();
      } else if (e.key === '+' || e.key === '=') {
        setZoomLevel(prev => Math.min(200, prev + 15));
      } else if (e.key === '-') {
        setZoomLevel(prev => Math.max(50, prev - 15));
      } else if (e.key === '0') {
        resetPanAndZoom();
      } else if (e.key === '?') {
        setShowShortcutsHelp(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSlideShow, detectedPdfPages]);

  // Hand Tool Mouse & Touch Dragging Handlers
  const handleStageMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool === 'hand') {
      setIsDragging(true);
      setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleStageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool === 'hand' && isDragging) {
      // Clamp panOffset dynamically based on zoomLevel to prevent sliding out into empty void
      const maxPanX = zoomLevel > 100 ? (zoomLevel - 100) * 8 + 150 : 150;
      const maxPanY = zoomLevel > 100 ? (zoomLevel - 100) * 8 + 150 : 150;
      setPanOffset({
        x: Math.max(-maxPanX, Math.min(maxPanX, e.clientX - dragStart.x)),
        y: Math.max(-maxPanY, Math.min(maxPanY, e.clientY - dragStart.y))
      });
    }
  };

  const handleStageMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (activeTool === 'hand' && e.touches.length > 0) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - panOffset.x,
        y: e.touches[0].clientY - panOffset.y
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (activeTool === 'hand' && isDragging && e.touches.length > 0) {
      const maxPanX = zoomLevel > 100 ? (zoomLevel - 100) * 8 + 150 : 150;
      const maxPanY = zoomLevel > 100 ? (zoomLevel - 100) * 8 + 150 : 150;
      setPanOffset({
        x: Math.max(-maxPanX, Math.min(maxPanX, e.touches[0].clientX - dragStart.x)),
        y: Math.max(-maxPanY, Math.min(maxPanY, e.touches[0].clientY - dragStart.y))
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Wheel Scrolling for Hand tool or container
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (activeTool === 'hand' && zoomLevel > 100) {
      const maxPanX = (zoomLevel - 100) * 8 + 150;
      const maxPanY = (zoomLevel - 100) * 8 + 150;
      setPanOffset(prev => ({
        x: Math.max(-maxPanX, Math.min(maxPanX, prev.x - e.deltaX * 0.6)),
        y: Math.max(-maxPanY, Math.min(maxPanY, prev.y - e.deltaY * 0.6))
      }));
    }
  };

  // Scroll Helpers with safe bounds
  const scrollSlideDown = (distance = 120) => {
    if (zoomLevel > 100) {
      const maxPan = (zoomLevel - 100) * 8 + 150;
      setPanOffset(prev => ({ ...prev, y: Math.max(-maxPan, prev.y - distance) }));
    }
  };

  const scrollSlideUp = (distance = 120) => {
    if (zoomLevel > 100) {
      const maxPan = (zoomLevel - 100) * 8 + 150;
      setPanOffset(prev => ({ ...prev, y: Math.min(maxPan, prev.y + distance) }));
    }
  };

  const resetPanAndZoom = () => {
    setPanOffset({ x: 0, y: 0 });
    setZoomLevel(100);
  };

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
      ctx.globalAlpha = stroke.tool === 'highlighter' ? 0.4 : 1.0;
      ctx.stroke();
    });

    // Draw current active stroke
    if (currentStroke && currentStroke.length > 1) {
      ctx.beginPath();
      ctx.moveTo(currentStroke[0].x, currentStroke[0].y);
      for (let i = 1; i < currentStroke.length; i++) {
        ctx.lineTo(currentStroke[i].x, currentStroke[i].y);
      }
      ctx.strokeStyle = penColor;
      ctx.lineWidth = activeTool === 'highlighter' ? 18 : penWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = activeTool === 'highlighter' ? 0.4 : 1.0;
      ctx.stroke();
    }
    ctx.globalAlpha = 1.0;
  };

  useEffect(() => {
    redrawCanvas();
  }, [strokes, currentStroke]);

  // Adjust canvas size to match container
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (canvas && container) {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      redrawCanvas();
    }
  }, [activeSlideShow, zoomLevel, panOffset]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool !== 'pen' && activeTool !== 'highlighter') return;
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
    }

    if ((activeTool === 'pen' || activeTool === 'highlighter') && currentStroke) {
      setCurrentStroke(prev => (prev ? [...prev, { x, y }] : [{ x, y }]));
    }
  };

  const handleMouseUp = () => {
    if (currentStroke && currentStroke.length > 0) {
      const newStroke: DrawingStroke = {
        tool: activeTool === 'highlighter' ? 'highlighter' : 'pen',
        color: penColor,
        width: activeTool === 'highlighter' ? 18 : penWidth,
        points: currentStroke
      };
      setStrokes(prev => [...prev, newStroke]);
      setCurrentStroke(null);
    }
  };

  const clearCanvas = () => {
    setStrokes([]);
    setCurrentStroke(null);
  };

  // Helper to detect direct binary PDF format suitable for pdfjs canvas rendering
  const isPdfFormat = (url: string): boolean => {
    if (!url || typeof url !== 'string') return false;
    const lower = url.toLowerCase().trim();
    // Google Drive URLs provide /preview iframe
    if (lower.includes('drive.google.com') || lower.includes('docs.google.com')) {
      return false;
    }
    return lower.startsWith('data:application/pdf') || 
           lower.startsWith('blob:') || 
           lower.endsWith('.pdf') ||
           lower.includes('.pdf?');
  };

  // Helper to format embed URL for Google Slides and Google Drive with active slide/page number
  const formatEmbedUrl = (rawUrl: string, slideIndex: number): string => {
    if (!rawUrl || typeof rawUrl !== 'string') return '';
    let url = rawUrl.trim();
    
    // 1. Google Slides Presentation
    if (url.includes('docs.google.com/presentation')) {
      const match = url.match(/\/presentation\/d\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        return `https://docs.google.com/presentation/d/${match[1]}/embed?start=false&loop=false&delayms=3000&slide=${slideIndex}`;
      }
      return url.replace(/\/(edit|view|present|preview|pub).*$/, `/embed?start=false&loop=false&delayms=3000&slide=${slideIndex}`);
    }

    // 2. Google Drive PDF / Presentation / Document Preview File
    if (url.includes('drive.google.com')) {
      const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        return `https://drive.google.com/file/d/${match[1]}/preview#page=${slideIndex}`;
      }
      url = url.replace(/\/view(\?.*)?$/, '/preview').replace(/\/edit(\?.*)?$/, '/preview');
      if (!url.includes('/preview')) {
        url = url.replace(/\/$/, '') + '/preview';
      }
      return `${url}#page=${slideIndex}`;
    }

    // 3. Direct PDF (Data URL Base64, Blob URL, or Web PDF)
    if (url.startsWith('data:application/pdf') || url.toLowerCase().includes('.pdf') || url.startsWith('blob:')) {
      const baseUrl = url.split('#')[0];
      return `${baseUrl}#page=${slideIndex}&toolbar=0&navpanes=0&scrollbar=1&view=FitH`;
    }

    return url;
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const totalSlides = detectedPdfPages || activeSlideShow?.slideCount || 30;

  // Render Component View
  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* 0. SUB-TAB NAVIGATOR: Slide Publik vs Slide Internal KPPN (Satu Menu, Dua Tab di Dalamnya) */}
      <div className={`p-3 sm:p-4 rounded-3xl border shadow-lg transition-all ${
        isDark ? 'bg-slate-900/95 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Sub-Tab Selector Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 w-full md:w-auto">
            <button
              type="button"
              onClick={() => {
                setSlideSubTab('PUBLIK');
                setCurrentPage(1);
              }}
              className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                slideSubTab === 'PUBLIK'
                  ? 'bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30 ring-2 ring-indigo-400/40 scale-[1.01]'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-900'
              }`}
            >
              <Globe className={`w-4 h-4 shrink-0 ${slideSubTab === 'PUBLIK' ? 'text-white' : 'text-indigo-500'}`} />
              <span>Slide Publik (Satker &amp; Mitra)</span>
              <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-mono font-bold ${
                slideSubTab === 'PUBLIK' ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-300'
              }`}>
                {totalUmumCount} Slide
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSlideSubTab('INTERNAL');
                setCurrentPage(1);
              }}
              className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                slideSubTab === 'INTERNAL'
                  ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/30 ring-2 ring-amber-300 scale-[1.01]'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-900'
              }`}
            >
              <Lock className={`w-4 h-4 shrink-0 ${slideSubTab === 'INTERNAL' ? 'text-slate-950' : 'text-amber-500'}`} />
              <span>Slide Khusus Internal KPPN</span>
              <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-mono font-bold ${
                slideSubTab === 'INTERNAL' ? 'bg-slate-950/20 text-slate-950 font-black' : 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300'
              }`}>
                {totalInternalCount} Slide
              </span>
              <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${
                hasInternalAccess ? 'bg-emerald-600 text-white shadow-xs' : 'bg-rose-600 text-white shadow-xs'
              }`}>
                {hasInternalAccess ? '✓ TERVERIFIKASI' : '🔒 TERKUNCI'}
              </span>
            </button>
          </div>

          {/* Quick Sub-Tab Context Info Badge */}
          <div className="flex items-center gap-2 px-1">
            {slideSubTab === 'INTERNAL' ? (
              hasInternalAccess ? (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Akses Internal Aktif ({currentUser ? currentUser.displayName : 'Pegawai Resmi KPPN'})</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleLockInternalSession}
                    className="p-1.5 rounded-xl bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-950/60 dark:text-slate-400 dark:hover:text-rose-300 border border-slate-300 dark:border-slate-700 transition-all cursor-pointer"
                    title="Kunci kembali sesi internal"
                  >
                    <Lock className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>Akses Terbatas Khusus Internal KPPN (Satker Terproteksi)</span>
                </span>
              )
            ) : (
              <span className="inline-flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs">
                <Globe className="w-4 h-4 text-indigo-600" />
                <span>Materi Terbuka Seluruh Satker Mitra &amp; Publik</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* GERBANG KEAMANAN INTERNAL (Jika user membuka tab internal tapi belum otentikasi) */}
      {activeScope === 'INTERNAL' && !hasInternalAccess ? (
        <div className="space-y-6 max-w-4xl mx-auto py-4 px-2">
          {/* Security Gate Card */}
          <div className={`p-8 sm:p-10 rounded-3xl border shadow-2xl relative overflow-hidden text-center space-y-6 ${
            isDark 
              ? 'bg-gradient-to-b from-slate-900 via-slate-900 to-amber-950/40 border-amber-500/40 text-slate-100 ring-1 ring-amber-500/20' 
              : 'bg-gradient-to-b from-white via-white to-amber-50/60 border-amber-400 text-slate-800 shadow-amber-500/10 ring-1 ring-amber-400/30'
          }`}>
            {/* Lock Icon */}
            <div className="relative inline-flex items-center justify-center">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-slate-950 shadow-xl shadow-amber-500/30">
                <Lock className="w-10 h-10 text-slate-950" />
              </div>
              <div className="absolute -top-1 -right-1 p-1.5 rounded-full bg-rose-600 text-white shadow-md">
                <ShieldAlert className="w-4 h-4" />
              </div>
            </div>

            <div className="space-y-2 max-w-xl mx-auto">
              <span className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40 text-[11px] font-black uppercase px-3 py-1 rounded-full inline-flex items-center gap-1.5 tracking-wider">
                <Lock className="w-3 h-3" />
                Area Khusus Pejabat &amp; Pegawai KPPN
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                Slide &amp; Dokumen Khusus Internal KPPN
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                Tab ini difungsikan khusus untuk menyimpan dokumen rapat dinas pimpinan, evaluasi kinerja 50 satker mitra, peta risiko monev IKPA, dan materi penting internal KPPN Semarang I.
              </p>
            </div>

            {/* Warning banner for Satker */}
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-300 text-xs text-left max-w-xl mx-auto flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
              <div className="space-y-1">
                <p className="font-black text-rose-700 dark:text-rose-200">
                  Pemberitahuan untuk Satker Mitra KPPN:
                </p>
                <p className="text-[11px] leading-relaxed opacity-90">
                  Satker Mitra KPPN <strong>TIDAK MEMILIKI AKSES</strong> ke dokumen internal ini demi kerahasiaan evaluasi kinerja dinas. Seluruh materi bimtek, sosialisasi, dan regulasi resmi telah disediakan secara terbuka di tab <strong>Slide Publik</strong> di atas.
                </p>
              </div>
            </div>

            {/* Two path options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto pt-2 text-left">
              {/* Option 1: Back to Public Slides for Satker */}
              <div className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 ${
                isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-black text-indigo-600 dark:text-indigo-400">
                    <Globe className="w-4 h-4" />
                    <span>Untuk Satker Mitra KPPN</span>
                  </div>
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Slide Publik Satker
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Akses materi sosialisasi PER-5, petunjuk teknis SAKTI, modul rekonsiliasi, dan tutorial pencairan dana tanpa perlu login.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSlideSubTab('PUBLIK')}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Presentation className="w-4 h-4" />
                  <span>Beralih ke Tab Slide Publik Satker &rarr;</span>
                </button>
              </div>

              {/* Option 2: Internal Staff Clearance Verification */}
              <div className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 ${
                isDark ? 'bg-amber-950/20 border-amber-500/30' : 'bg-amber-50/50 border-amber-300'
              }`}>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-black text-amber-600 dark:text-amber-400">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Untuk Pegawai / Pejabat KPPN</span>
                  </div>
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Otentikasi Akses Internal
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Masuk dengan akun pegawai resmi KPPN atau verifikasi kode kredensial dinas untuk membuka seluruh slide rahasia/penting.
                  </p>
                </div>

                <div className="space-y-2">
                  {onOpenLoginModal && (
                    <button
                      type="button"
                      onClick={onOpenLoginModal}
                      className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <User className="w-4 h-4" />
                      <span>Login Akun Pegawai KPPN</span>
                    </button>
                  )}

                  {/* Quick PIN Verification Form */}
                  <form onSubmit={handleVerifyGate} className="space-y-2 pt-1">
                    <div className="relative">
                      <input
                        type={showGatePassword ? "text" : "password"}
                        value={gatePasswordInput}
                        onChange={(e) => {
                          setGatePasswordInput(e.target.value);
                          if (gateErrorMsg) setGateErrorMsg(null);
                        }}
                        placeholder="Masukkan PIN / Sandi Internal KPPN..."
                        className={`w-full p-2 rounded-xl border text-xs font-mono font-bold pr-9 focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                          isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowGatePassword(!showGatePassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                      >
                        {showGatePassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {gateErrorMsg && (
                      <p className="text-[11px] text-rose-500 font-bold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>{gateErrorMsg}</span>
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={isVerifyingGate || !gatePasswordInput.trim()}
                      className="w-full py-2 px-3 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-amber-400 font-black text-[11px] border border-amber-500/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>{isVerifyingGate ? 'Memverifikasi...' : 'Verifikasi Cepat PIN Internal'}</span>
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Top Banner / Header (Scope-Aware) */}
          {activeScope === 'INTERNAL' ? (
            <div className={`p-6 sm:p-8 rounded-3xl border shadow-xl relative overflow-hidden ${
              isDark
                ? 'bg-gradient-to-r from-amber-950 via-slate-900 to-orange-950 border-amber-500/40 text-white'
                : 'bg-gradient-to-r from-amber-900 via-slate-900 to-orange-900 border-amber-300 text-white shadow-amber-900/10'
            }`}>
              <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-amber-500/10 to-transparent pointer-events-none" />

              <div className="relative z-10 max-w-4xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-amber-500 text-slate-950 border border-amber-400 text-[10px] sm:text-xs font-black uppercase px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                      <Lock className="w-3.5 h-3.5" />
                      🔒 PUSTAKA SLIDE KHUSUS INTERNAL KPPN SEMARANG I
                    </span>

                    <span className="bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-[10px] sm:text-xs font-black px-3 py-1 rounded-full flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      Akses Terverifikasi: {currentUser ? currentUser.displayName : (isAdminAuthenticated ? 'Super Admin KPPN' : 'Sesi Internal Pegawai')} (Satker Terblokir)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleLockInternalSession}
                      className="px-3 py-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                    >
                      <Lock className="w-3.5 h-3.5 text-rose-400" />
                      <span>Kunci Sesi Internal</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSlideSubTab('PUBLIK')}
                      className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                    >
                      <Globe className="w-3.5 h-3.5 text-sky-300" />
                      <span>Lihat Slide Publik Satker</span>
                    </button>
                  </div>
                </div>

                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black leading-tight tracking-tight">
                  Pustaka Slide Evaluasi &amp; Rapat Dinas Pimpinan
                </h2>

                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium max-w-3xl">
                  Koleksi slide penting, paparan rakor pimpinan KPPN Semarang I, analisis anomali kinerja 50 satker, serta materi strategis pembinaan internal. Dokumen ini aman dan terproteksi dari akses Satker.
                </p>

                <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-amber-200/90 font-bold">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>{filteredMaterials.length} Slide Internal Tersedia</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Maximize2 className="w-4 h-4 text-sky-400" />
                    <span>Dukungan Native Fullscreen HD &amp; Presenter Mode</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Pencil className="w-4 h-4 text-emerald-400" />
                    <span>Laser Pointer, Pena Coret &amp; Stabilo</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className={`p-6 sm:p-8 rounded-3xl border shadow-xl relative overflow-hidden ${
              isDark
                ? 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-slate-800 text-white'
                : 'bg-gradient-to-r from-indigo-900 via-slate-900 to-sky-900 border-indigo-200 text-white shadow-indigo-900/10'
            }`}>
              <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />

              <div className="relative z-10 max-w-4xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 text-[10px] sm:text-xs font-black uppercase px-3 py-1 rounded-full flex items-center gap-1.5 shadow-xs backdrop-blur-md">
                      <Presentation className="w-3.5 h-3.5 text-indigo-300" />
                      {dashboardConfig?.customTexts?.materiSlideBadge || 'Pustaka Slide & Modul Edukasi Satker KPPN Semarang I'}
                    </span>

                    <span className="bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 text-[10px] sm:text-xs font-extrabold px-3 py-1 rounded-full flex items-center gap-1">
                      <Globe className="w-3 h-3 text-emerald-400" />
                      Bebas Akses Seluruh Satker Mitra
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSlideSubTab('INTERNAL')}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Slide Khusus Internal KPPN &rarr;</span>
                  </button>
                </div>

                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black leading-tight tracking-tight">
                  {dashboardConfig?.customTexts?.materiSlideTitle || 'Kumpulan Slide Presentation & PowerPoint'}
                </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium max-w-3xl">
              {dashboardConfig?.customTexts?.materiSlideSubtitle || 'Pusat paparan sosialisasi, bimbingan teknis, dan modul PowerPoint perbendaharaan. Nikmati fitur Slide Show Layar Penuh (Native Fullscreen), Navigasi Slide, Zoom In/Out, serta Laser &amp; Pena Coret-Coret langsung di dashboard.'}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-indigo-200/90 font-bold">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>{filteredMaterials.length} Modul Aktif Satker</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Maximize2 className="w-4 h-4 text-sky-400" />
                <span>Dukungan Native Fullscreen HD</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Pencil className="w-4 h-4 text-emerald-400" />
                <span>Laser Pointer &amp; Stabilo Coret Slide</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Control Panel: Search & Filters */}
      <div className={`p-4 sm:p-5 rounded-2xl border ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      } space-y-4`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder={activeScope === 'INTERNAL' ? "Cari slide rapat dinas, evaluasi satker, SOP Pera, materi rahasia..." : "Cari materi PowerPoint, judul PER-5, atau kata kunci SAKTI..."}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className={`w-full text-xs rounded-xl pl-10 pr-4 py-2.5 border focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                isDark 
                  ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400' 
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Scope Indicator Badge */}
          <div className="flex items-center gap-2 shrink-0">
            {activeScope === 'INTERNAL' ? (
              <span className="text-xs font-black text-amber-900 dark:text-amber-200 bg-amber-500/15 border border-amber-500/40 px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-xs">
                <Lock className="w-3.5 h-3.5 text-amber-500 fill-current" />
                <span>Pustaka Khusus Internal KPPN</span>
              </span>
            ) : (
              <span className="text-xs font-black text-emerald-900 dark:text-emerald-200 bg-emerald-500/15 border border-emerald-500/40 px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-xs">
                <Globe className="w-3.5 h-3.5 text-emerald-500" />
                <span>Slide Publik Satker</span>
              </span>
            )}
          </div>

          {/* Importance Priority Filter */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setFilterImportance('ALL');
                setCurrentPage(1);
              }}
              className={`px-3 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                filterImportance === 'ALL'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Semua Prioritas
            </button>
            <button
              onClick={() => {
                setFilterImportance('PENTING');
                setCurrentPage(1);
              }}
              className={`px-3 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1 transition-all cursor-pointer ${
                filterImportance === 'PENTING'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
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
              onClick={() => {
                setSelectedCategory(cat);
                setCurrentPage(1);
              }}
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
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Tidak Ada Materi Presentation Ditemukan</h3>
          <p className="text-xs max-w-md mx-auto text-slate-500">
            Coba sesuaikan kata kunci pencarian atau ganti filter akses (Umum / Internal) dan kategori topik materi.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {(pageSize <= 0 ? filteredMaterials : filteredMaterials.slice((currentPage - 1) * pageSize, currentPage * pageSize)).map((material) => {
              const isInternal = material.accessType === 'INTERNAL';
              const isUnlocked = unlockedMaterialIds.has(material.id);

              return (
                <div
                  key={material.id}
                  className={`rounded-3xl border flex flex-col justify-between overflow-hidden transition-all shadow-md relative hover:-translate-y-1 hover:shadow-xl ${
                    isInternal
                      ? isDark
                        ? 'bg-slate-900 border-amber-500/60 ring-1 ring-amber-500/30'
                        : 'bg-white border-amber-400 ring-1 ring-amber-400/30 shadow-amber-500/5'
                      : material.importance === 'Sangat Penting' || material.isPinned
                      ? isDark
                        ? 'bg-slate-900 border-rose-500/50 ring-2 ring-rose-500/30'
                        : 'bg-white border-rose-400 ring-2 ring-rose-400/40 shadow-rose-500/5'
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
                        {/* Internal vs Umum Badge */}
                        {isInternal ? (
                          <span className="bg-amber-500 text-slate-950 font-black px-2.5 py-0.5 rounded-full text-[10px] flex items-center gap-1 border border-amber-600 shadow-xs">
                            <Lock className="w-2.5 h-2.5 fill-current" />
                            🔒 INTERNAL {isUnlocked ? '✓ TERBUKA' : ''}
                          </span>
                        ) : (
                          <span className="bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 font-extrabold px-2.5 py-0.5 rounded-full text-[10px] flex items-center gap-1 border border-emerald-300 dark:border-emerald-800">
                            🌐 UMUM
                          </span>
                        )}

                        {material.importance === 'Sangat Penting' && (
                          <span className="bg-rose-500 text-white font-black px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1 border border-rose-600 shadow-xs animate-pulse">
                            <Star className="w-2.5 h-2.5 fill-current" />
                            PENTING
                          </span>
                        )}

                        {material.isPinned && (
                          <span className="bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1 border border-amber-500">
                            <Pin className="w-2.5 h-2.5 fill-current" />
                            PIN
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
                    <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-slate-500 dark:text-slate-400">
                      {isInternal ? (
                        <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1 font-bold">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Internal Terverifikasi</span>
                        </span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-bold">
                          <Globe className="w-3 h-3 text-emerald-500" />
                          <span>Bebas Akses Satker</span>
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleOpenMaterial(material)}
                      className={`px-4 py-2 rounded-xl font-black text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer shrink-0 ${
                        isInternal
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                      }`}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{isInternal ? 'Buka Slide Internal' : 'Mulai Slide Show'}</span>
                    </button>
                  </div>

                </div>
              );
            })}
          </div>

          {/* Pagination Control for Slide Materials */}
          <PaginationControl
            currentPage={currentPage}
            totalItems={filteredMaterials.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            itemLabel="Slide"
            isDark={isDark}
            className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
          />
        </div>
      )}
        </>
      )}

      {/* PASSWORD VERIFICATION MODAL FOR INTERNAL SLIDES */}
      {typeof document !== 'undefined' && promptPasswordMaterial && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl space-y-4 ${
              isDark ? 'bg-slate-900 border-amber-500/50 text-white' : 'bg-white border-amber-300 text-slate-900'
            }`}
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-amber-500 text-slate-950 rounded-2xl shrink-0 shadow-md">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-amber-500 uppercase tracking-wider">
                    🔒 Materi Internal Terproteksi
                  </span>
                  <h3 className="text-base font-extrabold leading-snug">
                    Masukkan Password Slide
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setPromptPasswordMaterial(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-900 dark:text-amber-300 space-y-1">
              <p className="font-extrabold truncate">
                📄 {promptPasswordMaterial.title}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Materi ini khusus untuk kalangan internal KPPN Semarang I. Silakan masukkan kata sandi untuk mengakses konten slide show.
              </p>
            </div>

            <form onSubmit={handleVerifyPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-slate-300">
                  Kata Sandi / Password Akses:
                </label>
                <div className="relative">
                  <input
                    type={showPasswordText ? "text" : "password"}
                    autoFocus
                    required
                    value={inputPassword}
                    onChange={(e) => {
                      setInputPassword(e.target.value);
                      if (passwordError) setPasswordError(null);
                    }}
                    placeholder="Ketik password materi di sini..."
                    className={`w-full p-3 rounded-xl border text-xs font-mono font-bold pr-10 focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordText(!showPasswordText)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  >
                    {showPasswordText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {passwordError && (
                  <p className="text-xs text-rose-500 font-bold mt-1.5 flex items-center gap-1 animate-pulse">
                    <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                    <span>{passwordError}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPromptPasswordMaterial(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Buka Slide Show</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Slide Show Modal (Full Interactive Presentation Viewer with Native Fullscreen & Presenter Toolbar) */}
      {typeof document !== 'undefined' && activeSlideShow && createPortal(
        <div className="fixed inset-0 z-[99999] flex flex-col w-screen h-screen p-0 bg-slate-950 overflow-hidden select-none animate-in fade-in duration-150">
          <div
            ref={modalContainerRef}
            onContextMenu={(e) => e.preventDefault()}
            className="w-full h-full flex flex-col bg-slate-950 text-white relative overflow-hidden"
          >
                
                {/* Top Modal Header - Minimalist Sleek Presentation Bar */}
                <div className="px-3 py-2 bg-slate-900/95 border-b border-slate-800/80 flex items-center justify-between gap-3 shrink-0 z-30 backdrop-blur-md">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-1.5 rounded-lg bg-indigo-600/80 text-white shrink-0 shadow-sm">
                      <Presentation className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-700/50 shrink-0">
                        {activeSlideShow.category}
                      </span>
                      {activeSlideShow.accessType === 'INTERNAL' ? (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-700/50 flex items-center gap-1 shrink-0">
                          <Lock className="w-2.5 h-2.5" /> INTERNAL
                        </span>
                      ) : (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-700/50 flex items-center gap-1 shrink-0">
                          <Globe className="w-2.5 h-2.5" /> UMUM
                        </span>
                      )}
                      <h3 className="text-xs sm:text-sm font-bold text-slate-100 truncate">
                        {activeSlideShow.title}
                      </h3>
                    </div>
                  </div>

                  {/* Right Header Controls */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Timer Stopwatch */}
                    <div className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-amber-300 font-mono font-bold text-xs flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                      <span>{formatTime(timerSeconds)}</span>
                    </div>

                    {/* Open in New Tab */}
                    {activeSlideShow.embedUrl && (
                      <a
                        href={activeSlideShow.embedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                        title="Buka Dokumen di Tab Baru"
                      >
                        <ExternalLink className="w-4 h-4 text-sky-400" />
                      </a>
                    )}

                    {/* Shortcuts Help Toggle */}
                    <button
                      onClick={() => setShowShortcutsHelp(!showShortcutsHelp)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                      title="Petunjuk Keyboard Shortcuts (?)"
                    >
                      <HelpCircle className="w-4 h-4 text-indigo-400" />
                    </button>

                    {/* Native Fullscreen Button */}
                    <button
                      onClick={toggleNativeFullscreen}
                      className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold px-2.5"
                      title={isFullscreenMode ? 'Keluar Layar Penuh (F)' : 'Layar Penuh / Fullscreen (F)'}
                    >
                      {isFullscreenMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                      <span className="hidden sm:inline">{isFullscreenMode ? 'Keluar' : 'Fullscreen'}</span>
                    </button>

                    {/* Close Slide Show */}
                    <button
                      onClick={() => {
                        setActiveSlideShow(null);
                        setIsFullscreenMode(false);
                        if (document.fullscreenElement) {
                          document.exitFullscreen().catch(() => {});
                        }
                      }}
                      className="p-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white transition-colors cursor-pointer border border-rose-500/30"
                      title="Tutup Presentasi (Esc)"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Main Presentation Stage & Canvas Coret-Coret */}
                <div 
                  ref={containerRef}
                  onMouseDown={handleStageMouseDown}
                  onMouseMove={handleStageMouseMove}
                  onMouseUp={handleStageMouseUp}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  onWheel={handleWheel}
                  className={`relative flex-1 w-full h-full bg-slate-950 overflow-hidden flex items-center justify-center select-none ${
                    activeTool === 'hand' ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : ''
                  }`}
                >
                  {/* Scalable & Scrollable Viewport Wrapper */}
                  <div 
                    className="w-full h-full flex items-center justify-center transition-transform duration-75 ease-out origin-center"
                    style={{ 
                      transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel / 100})` 
                    }}
                  >
                    {isPdfFormat(activeSlideShow.embedUrl) ? (
                      <PdfSlideViewer
                        url={activeSlideShow.embedUrl}
                        currentPage={currentSlideIndex}
                        zoomLevel={zoomLevel}
                        rotation={rotation}
                        fitMode={fitMode}
                        onTotalPagesLoaded={(total) => setDetectedPdfPages(total)}
                        className="w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full overflow-hidden relative flex items-center justify-center bg-slate-900">
                        <iframe
                          ref={iframeRef}
                          key={`${activeSlideShow.id}-${currentSlideIndex}`}
                          src={formatEmbedUrl(activeSlideShow.embedUrl, currentSlideIndex)}
                          title={activeSlideShow.title}
                          className="w-full h-[calc(100%+38px)] -mb-[38px] border-0 pointer-events-auto bg-slate-900"
                          allowFullScreen
                          allow="autoplay; fullscreen"
                        />
                      </div>
                    )}
                  </div>

                  {/* Coret-Coret Drawing Canvas Layer */}
                  <canvas
                    ref={canvasRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    className={`absolute inset-0 z-20 w-full h-full ${
                      activeTool === 'pointer' || activeTool === 'hand'
                        ? 'pointer-events-none'
                        : 'pointer-events-auto cursor-crosshair'
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
                        <li><strong className="text-white">Home / End:</strong> Halaman Pertama / Terakhir</li>
                        <li><strong className="text-white">R:</strong> Rotasi Dokumen 90° Searah Jarum Jam</li>
                        <li><strong className="text-white">H:</strong> Alat Tangan (Hand / Drag Pan)</li>
                        <li><strong className="text-white">+ / -:</strong> Zoom In / Zoom Out</li>
                        <li><strong className="text-white">0:</strong> Reset Posisi & Zoom 100%</li>
                        <li><strong className="text-white">F:</strong> Toggle Layar Penuh (Fullscreen)</li>
                        <li><strong className="text-white">C:</strong> Hapus Seluruh Coretan</li>
                        <li><strong className="text-white">?:</strong> Buka / Tutup Petunjuk Ini</li>
                      </ul>
                    </div>
                  )}
                </div>

                {/* FIREFOX-INSPIRED FULLY FUNCTIONAL BOTTOM PRESENTER TOOLBAR */}
                <div className="p-2.5 bg-slate-900/95 border-t border-slate-800 z-30 flex flex-wrap items-center justify-between gap-2.5 text-xs shrink-0 backdrop-blur-md shadow-2xl">
                  
                  {/* 1. Complete Page Navigation (Firefox Style) */}
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 shadow-inner">
                    {/* First Page Button */}
                    <button
                      onClick={() => setCurrentSlideIndex(1)}
                      disabled={currentSlideIndex <= 1}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-white font-bold transition-all cursor-pointer"
                      title="Halaman Pertama (Home)"
                    >
                      <ChevronsLeft className="w-4 h-4" />
                    </button>

                    {/* Previous Page Button */}
                    <button
                      onClick={() => setCurrentSlideIndex(prev => Math.max(1, prev - 1))}
                      disabled={currentSlideIndex <= 1}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-white font-bold transition-all cursor-pointer"
                      title="Halaman Sebelumnya (Panah Kiri)"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    {/* Direct Page Input */}
                    <div className="px-2.5 py-0.5 bg-slate-900 rounded-md border border-slate-800 font-bold text-amber-300 text-xs flex items-center gap-1">
                      <span className="text-[11px] text-slate-400">Hal.</span>
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
                        className="w-9 bg-slate-950 border border-slate-700 rounded text-center text-amber-400 font-extrabold focus:outline-none focus:ring-1 focus:ring-amber-500 py-0.5"
                      />
                      <span className="text-slate-400 font-normal">/ {totalSlides}</span>
                    </div>

                    {/* Next Page Button */}
                    <button
                      onClick={() => setCurrentSlideIndex(prev => Math.min(totalSlides, prev + 1))}
                      disabled={currentSlideIndex >= totalSlides}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-white font-bold transition-all cursor-pointer"
                      title="Halaman Berikutnya (Panah Kanan / Spasi)"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    {/* Last Page Button */}
                    <button
                      onClick={() => setCurrentSlideIndex(totalSlides)}
                      disabled={currentSlideIndex >= totalSlides}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-white font-bold transition-all cursor-pointer"
                      title="Halaman Terakhir (End)"
                    >
                      <ChevronsRight className="w-4 h-4" />
                    </button>

                    <div className="h-4 w-px bg-slate-800 my-auto mx-0.5" />

                    {/* Auto-Play Slide Toggle */}
                    <button
                      onClick={() => setIsPlayingAuto(!isPlayingAuto)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                        isPlayingAuto
                          ? 'bg-amber-500 text-slate-950 shadow-sm animate-pulse'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                      title={isPlayingAuto ? 'Hentikan Putar Otomatis' : 'Putar Otomatis (Auto Slide Show)'}
                    >
                      {isPlayingAuto ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                      <span className="hidden md:inline">{isPlayingAuto ? 'Pause' : 'Auto Play'}</span>
                    </button>
                  </div>

                  {/* 2. Interactive Presenter Tools (Pointer, Hand, Laser, Pen, Highlighter) */}
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 shadow-inner">
                    {/* Normal Cursor */}
                    <button
                      onClick={() => {
                        setActiveTool('pointer');
                      }}
                      className={`p-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1 transition-all cursor-pointer ${
                        activeTool === 'pointer'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                      }`}
                      title="Kursor Normal (Navigasi Dokumen)"
                    >
                      <MousePointer className="w-4 h-4" />
                      <span className="hidden xl:inline">Navigasi</span>
                    </button>

                    {/* Hand Tool (Pan/Drag) */}
                    <button
                      onClick={() => setActiveTool('hand')}
                      className={`p-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1 transition-all cursor-pointer ${
                        activeTool === 'hand'
                          ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                      title="Alat Tangan / Geser Dokumen (Drag Pan) - Tombol H"
                    >
                      <Hand className="w-4 h-4" />
                      <span className="hidden sm:inline">Tangan</span>
                    </button>

                    {/* Laser Pointer */}
                    <button
                      onClick={() => setActiveTool('laser')}
                      className={`p-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1 transition-all cursor-pointer ${
                        activeTool === 'laser'
                          ? 'bg-rose-600 text-white shadow-sm animate-pulse'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                      }`}
                      title="Laser Pointer (Sorotan Merah)"
                    >
                      <Circle className="w-4 h-4 fill-rose-500 text-rose-500" />
                      <span className="hidden xl:inline">Laser</span>
                    </button>

                    {/* Pen Drawing Tool */}
                    <button
                      onClick={() => setActiveTool('pen')}
                      className={`p-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1 transition-all cursor-pointer ${
                        activeTool === 'pen'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                      }`}
                      title="Coret-Coret Slide (Pena Gambar)"
                    >
                      <Pencil className="w-4 h-4" />
                      <span className="hidden xl:inline">Pena</span>
                    </button>

                    {/* Highlighter Marker */}
                    <button
                      onClick={() => setActiveTool('highlighter')}
                      className={`p-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1 transition-all cursor-pointer ${
                        activeTool === 'highlighter'
                          ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                      }`}
                      title="Stabilo / Marker Sorot Teks"
                    >
                      <Highlighter className="w-4 h-4" />
                      <span className="hidden xl:inline">Stabilo</span>
                    </button>

                    {/* Pen Color Palette */}
                    {(activeTool === 'pen' || activeTool === 'highlighter') && (
                      <div className="flex items-center gap-1 pl-1 border-l border-slate-800">
                        {['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#ffffff'].map(c => (
                          <button
                            key={c}
                            onClick={() => setPenColor(c)}
                            className={`w-4 h-4 rounded-full border transition-transform cursor-pointer ${
                              penColor === c ? 'scale-125 border-white ring-2 ring-indigo-500' : 'border-transparent opacity-75 hover:opacity-100'
                            }`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    )}

                    {/* Clear Drawings */}
                    <button
                      onClick={clearCanvas}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 transition-colors cursor-pointer ml-0.5"
                      title="Hapus Semua Coretan (Tombol C)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* 3. Firefox PDF Presentation Tools (Rotate, Fit Mode, Zoom, Fit Reset) */}
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 shadow-inner">
                    {/* Rotate 90° Clockwise */}
                    <button
                      onClick={() => setRotation(prev => (prev + 90) % 360)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold transition-all cursor-pointer flex items-center gap-1"
                      title="Putar Dokumen 90° Searah Jarum Jam (Tombol R)"
                    >
                      <RotateCw className="w-4 h-4 text-emerald-400" />
                      {rotation !== 0 && (
                        <span className="text-[10px] text-emerald-300 font-mono">{rotation}°</span>
                      )}
                    </button>

                    {/* Fit Page vs Fit Width (Firefox Presentation Toggle) */}
                    <button
                      onClick={() => setFitMode(prev => (prev === 'page' ? 'width' : 'page'))}
                      className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        fitMode === 'width'
                          ? 'bg-sky-600 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                      title={fitMode === 'page' ? 'Mode: Pas Layar Penuh (Klik untuk Pas Lebar Halaman)' : 'Mode: Pas Lebar Halaman (Klik untuk Pas Layar Penuh)'}
                    >
                      <Scan className="w-4 h-4" />
                      <span className="hidden sm:inline text-[10px]">{fitMode === 'page' ? 'Pas Layar' : 'Pas Lebar'}</span>
                    </button>

                    <div className="h-4 w-px bg-slate-800 my-auto mx-0.5" />

                    {/* Zoom Out */}
                    <button
                      onClick={() => setZoomLevel(prev => Math.max(50, prev - 15))}
                      disabled={zoomLevel <= 50}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white font-bold transition-all cursor-pointer"
                      title="Perkecil Tampilan (Zoom Out / -)"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>

                    {/* Zoom Indicator */}
                    <span className="px-1.5 font-mono font-bold text-indigo-300 text-xs w-11 text-center">
                      {zoomLevel}%
                    </span>

                    {/* Zoom In */}
                    <button
                      onClick={() => setZoomLevel(prev => Math.min(200, prev + 15))}
                      disabled={zoomLevel >= 200}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white font-bold transition-all cursor-pointer"
                      title="Perbesar Tampilan (Zoom In / +)"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>

                    {/* Fit Layar 100% Reset */}
                    <button
                      onClick={resetPanAndZoom}
                      className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 font-bold ${
                        panOffset.x !== 0 || panOffset.y !== 0 || zoomLevel !== 100
                          ? 'bg-amber-500 text-slate-950 font-black animate-pulse'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                      title="Reset Posisi & Zoom ke 100% (Tombol 0)"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline text-[10px]">100%</span>
                    </button>
                  </div>

                </div>

              </div>
            </div>,
            document.body
          )}

    </div>
  );
};
