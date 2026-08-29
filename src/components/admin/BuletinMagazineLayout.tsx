import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Printer,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileSpreadsheet,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  Volume2,
  VolumeX,
  BookOpen,
  Award,
  ShieldCheck,
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Zap,
  TrendingUp,
  PieChart as PieIcon,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  RotateCcw,
  Check,
  Quote,
  LayoutGrid,
  MonitorPlay,
  QrCode,
  Share2,
  Download,
  Search,
  Flame,
  Star,
  SlidersHorizontal,
  Headphones,
  FileCode,
  FileText,
  Wand2,
  Stamp,
  Palette,
  Bookmark,
  StickyNote,
  Tv,
  Gamepad2,
  BarChart3,
  Glasses,
  Mic,
  Bot,
  Plus
} from 'lucide-react';
import { BuletinConfig, RealisasiBelanjaSummary, SatkerIKPA } from '../../types';
import { formatRupiahShort, formatRupiahFull } from '../../utils/realisasiBelanjaProcessor';
import { OFFICIAL_PRESET_IMAGES } from '../../data/buletinEditionPresets';
import { generateDeepTreasuryAnalysis } from '../../utils/buletinTreasuryEngine';
import { exportStandaloneBuletinHtml } from '../../utils/buletinFlipbookHtmlExporter';
import { generateAiBuletinEditorial } from '../../services/buletinAiEngine';
import { playPageFlipSound, playChimeSound } from '../../utils/buletinSoundEffects';
import { useToast } from '../ToastNotification';

import { BuletinPageCover } from './buletin/BuletinPageCover';
import { BuletinPageEditorial } from './buletin/BuletinPageEditorial';
import { BuletinPageFiscalData } from './buletin/BuletinPageFiscalData';
import { BuletinPageSemarangTreasuryData } from './buletin/BuletinPageSemarangTreasuryData';
import { BuletinPageArticles } from './buletin/BuletinPageArticles';
import { BuletinPageCommunity } from './buletin/BuletinPageCommunity';
import { BuletinPageCultureAndKuis } from './buletin/BuletinPageCultureAndKuis';
import { BuletinPageAdvancedAnalytics } from './buletin/BuletinPageAdvancedAnalytics';
import { BuletinPageCustom } from './buletin/BuletinPageCustom';
import { BuletinPageManagerModal } from './buletin/BuletinPageManagerModal';
import { BuletinAudioPodcastBar } from './buletin/BuletinAudioPodcastBar';
import { BuletinPrintSelectModal } from './buletin/BuletinPrintSelectModal';
import { BuletinAiStudioModal } from './buletin/BuletinAiStudioModal';
import { BuletinSearchModal } from './buletin/BuletinSearchModal';
import { BuletinAnnotationDrawer } from './buletin/BuletinAnnotationDrawer';
import { BuletinThemePaletteModal } from './buletin/BuletinThemePaletteModal';
import { BuletinPresentationMode } from './buletin/BuletinPresentationMode';
import { BuletinVoiceNarratorModal } from './buletin/BuletinVoiceNarratorModal';
import { BuletinDistributionHubModal } from './buletin/BuletinDistributionHubModal';
import { BuletinInteractiveGameModal } from './buletin/BuletinInteractiveGameModal';
import { BuletinInfographicStudioModal } from './buletin/BuletinInfographicStudioModal';
import { BuletinAiAssistantModal } from './buletin/BuletinAiAssistantModal';
import { BuletinDataExportModal } from './buletin/BuletinDataExportModal';
import { BuletinCustomPageBuilderModal } from './buletin/BuletinCustomPageBuilderModal';
import { BuletinDeepAnalyticsModal } from './buletin/BuletinDeepAnalyticsModal';

interface BuletinMagazineLayoutProps {
  buletinConfig: BuletinConfig;
  overallSummary?: RealisasiBelanjaSummary | null;
  satkers?: SatkerIKPA[];
  onUpdateBuletinConfig?: (updated: BuletinConfig) => void;
  onEditField?: (fieldKey: string) => void;
}

type ReaderMode = 'flipbook' | 'single' | 'grid' | 'continuous' | 'presentation';

export const BuletinMagazineLayout: React.FC<BuletinMagazineLayoutProps> = ({
  buletinConfig,
  overallSummary,
  satkers = [],
  onUpdateBuletinConfig,
  onEditField
}) => {
  const { addToast } = useToast();

  // Reader navigation & display states
  const [readerMode, setReaderMode] = useState<ReaderMode>('flipbook');
  const [currentSpread, setCurrentSpread] = useState<number>(0); // 0 = Hal 1 & 2, 1 = Hal 3 & 4 ...
  const [currentSinglePage, setCurrentSinglePage] = useState<number>(1);
  const [zoomScale, setZoomScale] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isPlayingSlideshow, setIsPlayingSlideshow] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showThumbnails, setShowThumbnails] = useState<boolean>(true);
  const [selectedPageView, setSelectedPageView] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Interactive Modals State
  const [isPageManagerOpen, setIsPageManagerOpen] = useState<boolean>(false);
  const [isPrintSelectModalOpen, setIsPrintSelectModalOpen] = useState<boolean>(false);
  const [isAiStudioOpen, setIsAiStudioOpen] = useState<boolean>(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState<boolean>(false);
  const [isAnnotationDrawerOpen, setIsAnnotationDrawerOpen] = useState<boolean>(false);
  const [isThemePaletteModalOpen, setIsThemePaletteModalOpen] = useState<boolean>(false);
  const [isPresentationModeOpen, setIsPresentationModeOpen] = useState<boolean>(false);
  const [isVoiceNarratorOpen, setIsVoiceNarratorOpen] = useState<boolean>(false);
  const [isDistributionHubOpen, setIsDistributionHubOpen] = useState<boolean>(false);
  const [isInteractiveGameOpen, setIsInteractiveGameOpen] = useState<boolean>(false);
  const [isInfographicStudioOpen, setIsInfographicStudioOpen] = useState<boolean>(false);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState<boolean>(false);
  const [isDataExportOpen, setIsDataExportOpen] = useState<boolean>(false);
  const [isCustomPageBuilderOpen, setIsCustomPageBuilderOpen] = useState<boolean>(false);
  const [isDeepAnalyticsOpen, setIsDeepAnalyticsOpen] = useState<boolean>(false);
  const [readingFilter, setReadingFilter] = useState<'normal' | 'sepia' | 'dark' | 'eink'>('normal');
  
  const [printSelectedPages, setPrintSelectedPages] = useState<number[] | null>(null);
  const [showAudioPodcast, setShowAudioPodcast] = useState<boolean>(false);
  const [showOfficialWatermark, setShowOfficialWatermark] = useState<boolean>(true);
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);

  // Interactive TTS State
  const [ttsInputs, setTtsInputs] = useState<{ [key: string]: string }>({
    '1_across': 'SAKTI',
    '3_across': 'SP2D',
    '5_across': '',
    '7_across': '',
    '8_across': '',
    '1_down': '',
    '2_down': '',
    '4_down': '',
    '6_down': ''
  });
  const [ttsChecked, setTtsChecked] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const customPages = buletinConfig.customPages || [];

  // Master Pages Directory with Complete Treasury & Analytical Compendium + Dynamic Custom Pages
  const masterPageDirectory = useMemo(() => {
    const basePages = [
      { num: 1, title: 'Cover Depan Majalah', section: 'Sampul Depan' },
      { num: 2, title: 'Kata Pengantar Kepala KPPN', section: 'Editorial' },
      { num: 3, title: 'Sekilas Tentang & Susunan Redaksi', section: 'Redaksi' },
      { num: 4, title: 'Daftar Isi Majalah (TOC)', section: 'Daftar Isi' },
      { num: 5, title: 'Kinerja Belanja APBN Regional', section: 'Fiskal Makro' },
      { num: 6, title: 'Tabel Pagu & Realisasi Top 10 K/L', section: 'Data K/L' },
      { num: 7, title: 'Analisis Komposisi 5 K/L Terbesar', section: 'Infografis' },
      { num: 8, title: 'Rapor Satker Pagu Besar (>Rp50 M)', section: 'Satker Strategis' },
      { num: 9, title: 'Evaluasi 8 Indikator IKPA Wilayah', section: 'Rapor IKPA' },
      { num: 10, title: 'Monitoring Belanja Modal (Akun 53)', section: 'Proyek Modal' },
      { num: 11, title: 'Monitoring Retur SP2D & Zero Retur', section: 'Zero Retur' },
      { num: 12, title: 'Digitalisasi Belanja: Digipay & KKP', section: 'Digipay Satu' },
      { num: 13, title: 'Penyaluran Transfer Ke Daerah (TKD)', section: 'Desentralisasi' },
      { num: 14, title: 'Guyub Rukun: Wawancara Satker Juara', section: 'Wawancara' },
      { num: 15, title: 'Wall of Fame Satker Teladan', section: 'Penghargaan' },
      { num: 16, title: 'Sarwa Sarwi 1: Capacity Building', section: 'Kegiatan Insan' },
      { num: 17, title: 'Sarwa Sarwi 2: Fun Games & Tim', section: 'Internal' },
      { num: 18, title: 'Sarwa Sarwi 3: Purnabakti Pegawai', section: 'Purna Tugas' },
      { num: 19, title: 'Sarwa Sarwi 4: River Tubing & Pesan', section: 'Refleksi' },
      { num: 20, title: 'Opini Pranata Keuangan APBN', section: 'Opini Ilmiah' },
      { num: 21, title: 'Glosarium SAKTI & Pagelaran Budaya', section: 'Edukasi' },
      { num: 22, title: 'Teropong Wisata: Kota Lama Semarang', section: 'Wisata' },
      { num: 23, title: 'Zona Integritas & TTS Interaktif', section: 'Kuis Integritas' },
      { num: 24, title: 'Pengendalian Gratifikasi & Pengaduan', section: 'Integritas' },
      { num: 25, title: 'Dampak Ekonomi APBN & PDRB Daerah', section: 'Ekonomi Regional' },
      { num: 26, title: 'Peta Ketepatan RPD Hal III DIPA', section: 'Akurasi Kas' },
      { num: 27, title: 'Rapor 4 Kluster Belanja APBN', section: 'Early Warning' },
      { num: 28, title: 'Dashboard Modernisasi Non-Tunai', section: 'Cashless' },
      { num: 29, title: 'Monitoring Penyaluran TKD Daerah', section: 'APBN & APBD' },
      { num: 30, title: 'Grand Strategy Akselerasi Belanja', section: 'Panduan Taktis' },
      { num: 31, title: 'Suara Stakeholder & Sinergi Kemenkeu Satu', section: 'Sinergi' },
      { num: 32, title: 'Green Budgeting & Mitigasi Iklim', section: 'Fiskal Hijau' },
      { num: 33, title: 'Pengendalian Intern & Manajemen Risiko', section: 'SPIP & MR' },
      { num: 34, title: 'Formula Nilai IKPA 100 Sempurna', section: 'Pedoman IKPA' },
      { num: 35, title: 'Pemberdayaan UMKM Kemenkeu Satu', section: 'UMKM & UMi' },
      { num: 36, title: 'Klinik Konsultasi & FAQ SAKTI', section: 'Klinik Anggaran' },
      { num: 37, title: 'Laporan Keuangan & Opini WTP', section: 'MonSAKTI' },
      { num: 38, title: 'Sertifikasi Pejabat BNT/PNT', section: 'Standardisasi' },
      { num: 39, title: 'Inovasi Layanan Publik Prima & WBBM', section: 'Inklusif' },
      { num: 40, title: 'Tata Kelola Rekening Pemerintah', section: 'Kas & Rekening' },
      { num: 41, title: 'Akuntansi Akrual & Aset BMN', section: 'BMN & Akuntansi' },
      { num: 42, title: 'Strategi Zero Retur SP2D', section: 'Seksi Bank' },
      { num: 43, title: 'Hibah, PHLN & Proyek SBSN', section: 'SBSN & Hibah' },
      { num: 44, title: 'Peran Regional Chief Economist', section: 'Financial Advisor' },
      { num: 45, title: 'Kinerja Anggaran Pesta Demokrasi', section: 'KPU & Bawaslu' },
      { num: 46, title: 'Indeks Kepuasan Masyarakat (IKM)', section: 'Layanan Prima' },
      { num: 47, title: 'Pedoman Langkah Akhir Tahun (LLAT)', section: 'Tutup Buku' },
      { num: 48, title: 'Transformasi Digital Treasury', section: 'Teknologi' },
      { num: 49, title: 'Galeri Prestasi & Penghargaan', section: 'Prestasi' },
      { num: 50, title: 'Sampul Belakang & Janji Layanan Rp0,-', section: 'Sampul Belakang' }
    ];

    const mappedCustom = customPages.map((cp, idx) => ({
      num: 51 + idx,
      title: cp.title,
      section: cp.section || 'Halaman Kustom',
      isCustom: true,
      customId: cp.id
    }));

    return [...basePages, ...mappedCustom];
  }, [customPages]);

  // Flipping animation state
  const [isFlipping, setIsFlipping] = useState<boolean>(false);
  const [flipDirection, setFlipDirection] = useState<'next' | 'prev' | null>(null);

  // Filter excluded pages if user hid them
  const excluded = buletinConfig.excludedPages || [];
  const activePages = useMemo(() => {
    return masterPageDirectory.filter(p => !excluded.includes(p.num));
  }, [masterPageDirectory, excluded]);

  // Active page directory with sequential index for seamless dynamic renumbering
  const activePageDirectory = useMemo(() => {
    return activePages.map((page, idx) => ({
      ...page,
      seqIndex: idx + 1,
      origNum: page.num
    }));
  }, [activePages]);

  const totalPages = activePages.length;
  const totalSpreads = Math.ceil(totalPages / 2);

  const namaBuletin = buletinConfig.namaBuletin || 'WARTA SEMARANG SATU';
  const tagline = buletinConfig.taglineBuletin || 'Kiprah Perbendaharaan & Kinerja APBN Wilayah KPPN Semarang I';
  const currentFormat = buletinConfig.layoutFormat || 'executive_magazine';
  const isHighlightMissing = buletinConfig.highlightMissingData !== false;

  // Deep Treasury Analysis Engine calculation
  const deepAnalysis = useMemo(() => {
    return generateDeepTreasuryAnalysis(overallSummary, satkers, buletinConfig.bulanTahun);
  }, [overallSummary, satkers, buletinConfig.bulanTahun]);

  // Realistic Web Audio synthesized paper flip acoustics
  const playPageTurnSound = () => {
    playPageFlipSound(soundEnabled);
  };

  // Dynamic clean text extractor for Voice Narrator (TTS)
  const getActivePageText = (pageNum: number): string => {
    const pageObj = masterPageDirectory.find(p => p.num === pageNum);
    const title = pageObj?.title || `Halaman ${pageNum}`;
    const section = pageObj?.section || 'Buletin Fiskal';

    if (pageNum === 1) {
      return `${buletinConfig.judulBuletin || 'Sinergi Fiskal Semarang'}. Edisi ${buletinConfig.edisi || 'IV 2026'}. ${buletinConfig.subJudul || 'Kinerja Fiskal Berkualitas, Akselerasi Digitalisasi SAKTI, dan Transformasi Layanan KPPN Semarang I'}. Diterbitkan resmi oleh KPPN Semarang I, Direktorat Jenderal Perbendaharaan, Kementerian Keuangan Republik Indonesia.`;
    }
    if (pageNum === 2) {
      return `Kata Pengantar Kepala Kantor Pelayanan Perbendaharaan Negara Semarang I, ${buletinConfig.namaKepalaKantor || 'Bapak Kepala Kantor'}. ${buletinConfig.sambutanKepala || 'Selamat datang di edisi buletin fiskal resmi KPPN Semarang I. Pengelolaan APBN yang transparan, akuntabel, dan berdampak nyata bagi kemakmuran rakyat adalah komitmen teguh kami.'}`;
    }
    if (pageNum === 3) {
      return `Tajuk Rencana dan Susunan Dewan Redaksi Buletin Fiskal. ${buletinConfig.tajukRencana || 'Menavigasi tantangan ekonomi regional dengan inovasi perbendaharaan dan penguatan tata kelola fiskal daerah yang adaptif dan inklusif.'}`;
    }
    if (pageNum >= 5 && pageNum <= 8) {
      return `Laporan Realisasi Kinerja Belanja Negara APBN Wilayah KPPN Semarang I. Total pagu anggaran dikelola mencapai Rp ${formatRupiahShort(overallSummary?.totalPagu || 14250000000000)}. Realisasi belanja mencapai ${overallSummary?.persentaseRealisasi?.toFixed(1) || '76'} persen. Rapor 8 indikator IKPA dan penyaluran Transfer Ke Daerah berlangsung optimal dan tepat sasaran.`;
    }
    if (pageNum >= 9 && pageNum <= 10) {
      return `Rubrik Guyub Rukun Wawancara Eksklusif Mitra Satuan Kerja. Narasumber: ${buletinConfig.wawancaraSatker?.narasumber || 'Kuasa Pengguna Anggaran'}, ${buletinConfig.wawancaraSatker?.jabatan || 'Pimpinan Satker'}. ${buletinConfig.wawancaraSatker?.isiWawancara || 'Kunci sukses pencapaian nilai IKPA maksimal adalah kedisiplinan eksekusi RPD Halaman III DIPA dan rekonsiliasi data tepat waktu.'}`;
    }
    if (pageNum >= 11 && pageNum <= 14) {
      return `Sarwa Sarwi KPPN Semarang I. Dokumentasi Kegiatan Penguatan Kapasitas dan Capacity Building Internal Pegawai. Mengukuhkan sinergi, integritas prima, dan semangat melayani perbendaharaan negara tanpa kompromi.`;
    }
    if (pageNum >= 15 && pageNum <= 18) {
      return `Pagelaran dan Teropong Budaya Semarang. Mengangkat potensi UMKM binaan, kuliner legendaris, serta warisan cagar budaya Kota Lama Semarang yang didukung dana APBN.`;
    }
    if (pageNum >= 19 && pageNum <= 24) {
      return `Pojok Digitalisasi dan Transformasi Layanan Perbendaharaan. Akselerasi implementasi Digipay Satu, Kartu Kredit Pemerintah (KKP), dan modernisasi CMS Virtual Account pada satker.`;
    }
    if (pageNum >= 25 && pageNum <= 30) {
      return `Sorotan Khusus Proyek Strategis Nasional dan Pengendalian Banjir Rob Kota Semarang. Alokasi anggaran infrastruktur untuk polder, normalisasi kali, dan tanggul pesisir pantai utara Jawa.`;
    }
    if (pageNum >= 41 && pageNum <= 45) {
      return `Zona Integritas Menuju Wilayah Birokrasi Bersih dan Melayani (WBBM). Komitmen KPPN Semarang I memberikan layanan tanpa biaya, zero rupiah, bebas pungli, dan anti gratifikasi.`;
    }
    if (pageNum >= 46 && pageNum <= 47) {
      return `Rubrik Rekreasi dan Teka-Teki Silang Fiskal. Asah pemahaman Anda mengenai istilah APBN, SAKTI, IKPA, SPM, dan regulasi keuangan negara secara interaktif.`;
    }
    return `Halaman ${pageNum}: ${title}. Rubrik ${section} Buletin Fiskal KPPN Semarang I. Mengulas kinerja perbendaharaan, tata kelola belanja negara, dan akuntabilitas keuangan negara secara komprehensif.`;
  };

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Global shortcut for search (Ctrl+K or Cmd+K)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsSearchModalOpen(prev => !prev);
        return;
      }

      if (['input', 'textarea'].includes((e.target as HTMLElement)?.tagName?.toLowerCase())) return;

      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        goToNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        goToPrev();
      } else if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSpread, currentSinglePage, totalSpreads, totalPages, readerMode, isFullscreen]);

  // Slideshow Auto-Advance
  useEffect(() => {
    let interval: any;
    if (isPlayingSlideshow) {
      interval = setInterval(() => {
        if (readerMode === 'flipbook') {
          setCurrentSpread(prev => (prev + 1 >= totalSpreads ? 0 : prev + 1));
        } else {
          setCurrentSinglePage(prev => (prev >= totalPages ? 1 : prev + 1));
        }
        playPageTurnSound();
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [isPlayingSlideshow, totalSpreads, totalPages, readerMode]);

  const triggerFlipAnimation = (direction: 'next' | 'prev') => {
    setIsFlipping(true);
    setFlipDirection(direction);
    playPageTurnSound();
    setTimeout(() => {
      setIsFlipping(false);
      setFlipDirection(null);
    }, 450);
  };

  const goToNext = () => {
    if (readerMode === 'flipbook') {
      if (currentSpread < totalSpreads - 1) {
        triggerFlipAnimation('next');
        setCurrentSpread(prev => prev + 1);
      }
    } else {
      if (currentSinglePage < totalPages) {
        triggerFlipAnimation('next');
        setCurrentSinglePage(prev => prev + 1);
      }
    }
  };

  const goToPrev = () => {
    if (readerMode === 'flipbook') {
      if (currentSpread > 0) {
        triggerFlipAnimation('prev');
        setCurrentSpread(prev => prev - 1);
      }
    } else {
      if (currentSinglePage > 1) {
        triggerFlipAnimation('prev');
        setCurrentSinglePage(prev => prev - 1);
      }
    }
  };

  const goToPage = (pageNumber: number) => {
    const activeIdx = activePages.findIndex(p => p.num === pageNumber);
    if (activeIdx < 0) return;
    
    if (readerMode === 'flipbook') {
      const targetSpread = Math.floor(activeIdx / 2);
      triggerFlipAnimation(targetSpread > currentSpread ? 'next' : 'prev');
      setCurrentSpread(targetSpread);
    } else {
      triggerFlipAnimation(activeIdx + 1 > currentSinglePage ? 'next' : 'prev');
      setCurrentSinglePage(activeIdx + 1);
    }
  };

  // Search filter jumps to matching page
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const q = searchQuery.toLowerCase();
    const match = activePages.find(p => p.title.toLowerCase().includes(q) || p.section.toLowerCase().includes(q));
    if (match) {
      goToPage(match.num);
    }
  };

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  // Standalone HTML Flipbook Export Handler
  const handleExportOfflineHtml = () => {
    try {
      exportStandaloneBuletinHtml(buletinConfig, overallSummary);
      addToast({
        title: '📦 Ekspor Majalah HTML Mandiri Berhasil!',
        message: 'File .html interaktif telah diunduh. Anda dapat membukanya secara offline di peramban apa pun.',
        type: 'success'
      });
    } catch (e: any) {
      addToast({
        title: 'Gagal Ekspor HTML',
        message: e?.message || 'Terjadi kendala saat mengekspor file HTML.',
        type: 'error'
      });
    }
  };

  // 1-Click AI Editorial Generator (Gemini 3.7 Flash)
  const handleGenerateAiEditorial = async () => {
    setIsGeneratingAi(true);
    try {
      addToast({
        title: '✨ Menghubungi Google Gemini 3.7 Flash...',
        message: 'AI sedang menganalisis data realisasi & menyusun naskah redaksi resmi berbobot tinggi...',
        type: 'info'
      });

      const updated = await generateAiBuletinEditorial(buletinConfig, overallSummary, satkers);
      if (onUpdateBuletinConfig) {
        onUpdateBuletinConfig({
          ...buletinConfig,
          ...updated
        });
      }

      addToast({
        title: '🎉 Naskah Redaksi AI Berhasil Disusun!',
        message: 'Kata Pengantar, Opini Pranata Keuangan, Wawancara Satker, dan Rubrik Integritas telah disempurnakan.',
        type: 'success'
      });
    } catch (err: any) {
      addToast({
        title: 'Notice AI Drafting',
        message: err?.message || 'Gagal menyusun naskah AI otomatis. Menggunakan data default.',
        type: 'warning'
      });
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Theme styling definitions
  const formatTheme = useMemo(() => {
    switch (currentFormat) {
      case 'modern_newsletter':
        return {
          wrapperClass: 'font-sans bg-emerald-50/20 text-slate-900',
          pageClass: 'bg-white shadow-xl border border-emerald-100/80 rounded-2xl',
          headerClass: 'border-b-2 border-emerald-600 pb-3 mb-4',
          headerTitleClass: 'text-emerald-950 font-sans tracking-tight font-extrabold',
          accentColor: 'emerald',
          coverGradient: 'from-emerald-950 via-teal-900 to-slate-950',
          badgeClass: 'bg-emerald-600 text-white shadow-xs',
          titleColor: 'text-emerald-900',
          cardStyleClass: 'bg-emerald-50/50 border border-emerald-100 rounded-xl p-4',
          footerClass: 'text-[10px] font-sans text-emerald-800/80 border-t border-emerald-100 pt-2 flex justify-between'
        };
      case 'corporate_report':
        return {
          wrapperClass: 'font-sans bg-slate-100/50 text-slate-900',
          pageClass: 'bg-white shadow-xl border border-slate-200 rounded-none',
          headerClass: 'border-b-2 border-slate-900 pb-3 mb-4',
          headerTitleClass: 'text-slate-950 font-sans tracking-tighter uppercase font-black',
          accentColor: 'slate',
          coverGradient: 'from-slate-950 via-slate-900 to-indigo-950',
          badgeClass: 'bg-slate-900 text-amber-300 shadow-xs',
          titleColor: 'text-slate-900',
          cardStyleClass: 'bg-slate-50 border border-slate-200 rounded-none p-4',
          footerClass: 'text-[10px] font-mono text-slate-600 border-t border-slate-200 pt-2 flex justify-between'
        };
      case 'infographic_bulletin':
        return {
          wrapperClass: 'font-sans bg-amber-50/30 text-slate-900',
          pageClass: 'bg-white shadow-2xl border border-amber-200/80 rounded-3xl',
          headerClass: 'border-b-4 border-amber-500 pb-3 mb-4',
          headerTitleClass: 'text-slate-900 font-sans tracking-normal font-black',
          accentColor: 'amber',
          coverGradient: 'from-slate-950 via-amber-950 to-slate-900',
          badgeClass: 'bg-amber-500 text-slate-950 font-black shadow-xs',
          titleColor: 'text-amber-900',
          cardStyleClass: 'bg-amber-50/60 border border-amber-200 rounded-2xl p-4',
          footerClass: 'text-[10px] font-sans font-bold text-amber-900 border-t border-amber-200 pt-2 flex justify-between'
        };
      case 'executive_magazine':
      default:
        return {
          wrapperClass: 'font-serif bg-slate-950 text-slate-900',
          pageClass: 'bg-white shadow-2xl border border-slate-200/90 rounded-sm',
          headerClass: 'border-b-2 border-amber-500/80 pb-3 mb-4',
          headerTitleClass: 'text-slate-900 font-serif tracking-tight font-black',
          accentColor: 'amber',
          coverGradient: 'from-slate-950 via-indigo-950 to-slate-900',
          badgeClass: 'bg-amber-500 text-slate-950 font-bold shadow-xs',
          titleColor: 'text-indigo-950',
          cardStyleClass: 'bg-slate-50/80 border border-slate-200/80 rounded-xl p-4',
          footerClass: 'text-[10px] font-serif italic text-slate-500 border-t border-slate-200 pt-2 flex justify-between'
        };
    }
  }, [currentFormat]);

  // Helper renderer for missing data highlight or clean print mode
  const renderTextOrMissing = (
    val: string | undefined | null,
    fieldKey: string,
    placeholder: string,
    customClass = '',
    fallbackText?: string
  ) => {
    if (val && val.trim() !== '') {
      return <div className={customClass}>{val}</div>;
    }
    if (fallbackText) {
      return <div className={customClass}>{fallbackText}</div>;
    }
    if (isHighlightMissing) {
      return (
        <div
          onClick={() => onEditField && onEditField(fieldKey)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-100 border border-amber-300 text-amber-900 font-sans text-xs font-semibold cursor-pointer hover:bg-amber-200 transition-colors my-1"
          title={`Klik untuk melengkapi data [${fieldKey}]`}
        >
          <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
          <span>[Lengkapi: {placeholder}]</span>
        </div>
      );
    }
    return <div className={`text-slate-400 italic ${customClass}`}>{placeholder}</div>;
  };

  const renderPhotoOrMissing = (
    url: string | undefined | null,
    alt: string,
    imgClass = 'h-48 w-full object-cover rounded-xl',
    fallbackPresetUrl?: string,
    fieldKey?: string
  ) => {
    const finalUrl = url || fallbackPresetUrl;
    if (finalUrl) {
      return (
        <div className="relative group overflow-hidden rounded-xl">
          <img
            src={finalUrl}
            alt={alt}
            referrerPolicy="no-referrer"
            className={`${imgClass} transition-transform duration-500 group-hover:scale-105`}
          />
          {fieldKey && onEditField && (
            <button
              onClick={() => onEditField(fieldKey)}
              className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-900/80 text-amber-300 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm shadow-md"
              title="Ganti Foto"
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      );
    }
    if (isHighlightMissing && fieldKey) {
      return (
        <div
          onClick={() => onEditField && onEditField(fieldKey)}
          className="h-44 w-full rounded-xl border-2 border-dashed border-amber-400 bg-amber-50/50 flex flex-col items-center justify-center p-4 text-center cursor-pointer hover:bg-amber-100/60 transition-colors"
        >
          <Sparkles className="w-6 h-6 text-amber-600 mb-1" />
          <span className="text-xs font-bold text-amber-900 font-sans">Unggah Foto {alt}</span>
          <span className="text-[10px] text-amber-700">Klik untuk memilih file dari komputer</span>
        </div>
      );
    }
    return null;
  };

  // TTS Handlers
  const handleTtsChange = (key: string, val: string) => {
    setTtsInputs(prev => ({ ...prev, [key]: val }));
  };

  const handleTtsCheck = () => {
    setTtsChecked(true);
  };

  const handleTtsReset = () => {
    setTtsInputs({
      '1_across': '',
      '3_across': '',
      '5_across': '',
      '7_across': '',
      '8_across': '',
      '1_down': '',
      '2_down': '',
      '4_down': '',
      '6_down': ''
    });
    setTtsChecked(false);
  };

  // Central Page Render Dispatcher
  const renderSinglePageContent = (pageNumber: number) => {
    if (pageNumber === 1) {
      return (
        <BuletinPageCover
          buletinConfig={buletinConfig}
          overallSummary={overallSummary}
          formatTheme={formatTheme}
        />
      );
    }

    if (pageNumber >= 2 && pageNumber <= 4) {
      return (
        <BuletinPageEditorial
          pageNumber={pageNumber}
          buletinConfig={buletinConfig}
          formatTheme={formatTheme}
          onEditField={onEditField}
          renderTextOrMissing={renderTextOrMissing}
          renderPhotoOrMissing={renderPhotoOrMissing}
          pageDirectory={activePageDirectory}
        />
      );
    }

    if (pageNumber >= 5 && pageNumber <= 7) {
      return (
        <BuletinPageFiscalData
          pageNumber={pageNumber}
          buletinConfig={buletinConfig}
          overallSummary={overallSummary}
          satkers={satkers}
          formatTheme={formatTheme}
          deepAnalysis={deepAnalysis}
          renderTextOrMissing={renderTextOrMissing}
        />
      );
    }

    if (pageNumber >= 8 && pageNumber <= 12) {
      return (
        <BuletinPageSemarangTreasuryData
          pageNumber={pageNumber}
          buletinConfig={buletinConfig}
          overallSummary={overallSummary}
          satkers={satkers}
          formatTheme={formatTheme}
          deepAnalysis={deepAnalysis}
          renderTextOrMissing={renderTextOrMissing}
        />
      );
    }

    if (pageNumber >= 13 && pageNumber <= 15) {
      return (
        <BuletinPageArticles
          pageNumber={pageNumber}
          buletinConfig={buletinConfig}
          overallSummary={overallSummary}
          satkers={satkers}
          formatTheme={formatTheme}
          deepAnalysis={deepAnalysis}
          renderTextOrMissing={renderTextOrMissing}
          renderPhotoOrMissing={renderPhotoOrMissing}
        />
      );
    }

    if (pageNumber >= 16 && pageNumber <= 19) {
      return (
        <BuletinPageCommunity
          pageNumber={pageNumber}
          buletinConfig={buletinConfig}
          formatTheme={formatTheme}
          renderTextOrMissing={renderTextOrMissing}
          renderPhotoOrMissing={renderPhotoOrMissing}
        />
      );
    }

    if (pageNumber >= 20 && pageNumber <= 24) {
      return (
        <BuletinPageCultureAndKuis
          pageNumber={pageNumber}
          buletinConfig={buletinConfig}
          formatTheme={formatTheme}
          renderTextOrMissing={renderTextOrMissing}
          renderPhotoOrMissing={renderPhotoOrMissing}
          ttsInputs={ttsInputs}
          onTtsChange={handleTtsChange}
          onTtsCheck={handleTtsCheck}
          onTtsReset={handleTtsReset}
          ttsChecked={ttsChecked}
        />
      );
    }

    // Dynamic Custom Pages (Page > 50)
    if (pageNumber > 50) {
      const customIndex = pageNumber - 51;
      const customPage = customPages[customIndex];
      if (customPage) {
        return (
          <BuletinPageCustom
            customPage={customPage}
            pageNumber={pageNumber}
            buletinConfig={buletinConfig}
            formatTheme={formatTheme}
            onEdit={() => setIsCustomPageBuilderOpen(true)}
          />
        );
      }
    }

    // Pages 25-50: Advanced Analytics, RPD Hal III DIPA, TKD, Strategy & Ultimate Back Cover
    return (
      <BuletinPageAdvancedAnalytics
        pageNumber={pageNumber}
        buletinConfig={buletinConfig}
        overallSummary={overallSummary}
        satkers={satkers}
        formatTheme={formatTheme}
        deepAnalysis={deepAnalysis}
        renderTextOrMissing={renderTextOrMissing}
        renderPhotoOrMissing={renderPhotoOrMissing}
      />
    );
  };

  // Wrapper with standard A4 aspect ratio, realistic 3D paper spine, and responsive scaling
  const renderPageWrapper = (pageNumber: number, isRightPage = false) => {
    const activeIndex = activePages.findIndex(p => p.num === pageNumber);
    const seqPageNum = activeIndex !== -1 ? activeIndex + 1 : pageNumber;
    const isFirstPage = activeIndex === 0 || pageNumber === 1;
    const isLastPage = activeIndex === activePages.length - 1 || pageNumber === masterPageDirectory.length;

    return (
      <div
        key={pageNumber}
        id={`buletin-page-${pageNumber}`}
        className={`w-full max-w-[794px] min-h-[1050px] mx-auto ${formatTheme.pageClass} flex flex-col justify-between overflow-hidden relative print:shadow-none print:border-none print:w-full print:max-w-none print:min-h-screen print:rounded-none page-break-after-always shadow-2xl transition-all duration-500 ease-out group ${
          isRightPage
            ? 'shadow-[-10px_10px_30px_rgba(0,0,0,0.35)] rounded-r-2xl border-l border-slate-300/40'
            : 'shadow-[10px_10px_30px_rgba(0,0,0,0.35)] rounded-l-2xl border-r border-slate-300/40'
        }`}
        style={{ aspectRatio: '1 / 1.414' }}
      >
        {/* Realistic Book Spine Crease Shadow */}
        <div
          className={`absolute top-0 bottom-0 pointer-events-none z-30 print:hidden ${
            isRightPage
              ? 'left-0 w-8 bg-gradient-to-r from-black/25 via-black/5 to-transparent'
              : 'right-0 w-8 bg-gradient-to-l from-black/25 via-black/5 to-transparent'
          }`}
        />

        {/* Paper Surface Texture & Subtle Gloss Lighting */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-40 z-10 print:hidden" />

        {renderSinglePageContent(pageNumber)}

        {/* Interactive Bottom Corner Curl Indicator (Flip trigger on click) */}
        <div
          onClick={() => (isRightPage ? goToNext() : goToPrev())}
          className={`absolute bottom-0 z-40 print:hidden cursor-pointer w-14 h-14 flex items-end justify-center p-1.5 transition-transform duration-300 opacity-60 hover:opacity-100 hover:scale-110 ${
            isRightPage
              ? 'right-0 rounded-tl-2xl bg-gradient-to-br from-amber-400/90 to-amber-600 text-slate-950 shadow-lg'
              : 'left-0 rounded-tr-2xl bg-gradient-to-bl from-amber-400/90 to-amber-600 text-slate-950 shadow-lg'
          }`}
          title={isRightPage ? 'Klik untuk membalik ke halaman berikutnya' : 'Klik untuk membalik ke halaman sebelumnya'}
        >
          <span className="font-mono text-[9px] font-black uppercase">
            {isRightPage ? '▶ Hal ' + Math.min(totalPages, seqPageNum + 1) : '◀ Hal ' + Math.max(1, seqPageNum - 1)}
          </span>
        </div>

        {/* Official Watermark Overlay */}
        {showOfficialWatermark && !isFirstPage && !isLastPage && (
          <div className="absolute top-4 right-8 pointer-events-none opacity-30 select-none hidden sm:flex items-center gap-1 font-mono text-[9px] uppercase tracking-widest text-slate-500 z-20">
            <span>KPPN SEMARANG I • TIPE A1</span>
          </div>
        )}

        {/* Page Number Marker (Except cover 1 and back cover) */}
        {!isFirstPage && !isLastPage && (
          <div className="absolute bottom-3 right-6 print:bottom-2 print:right-4 z-20 pointer-events-none">
            <span className="font-mono text-[11px] font-black px-2.5 py-0.5 rounded-lg bg-slate-900 text-amber-300 shadow-md">
              Hal {seqPageNum} {excluded.length > 0 && <span className="opacity-50 text-[9px] font-normal ml-0.5">({pageNumber})</span>}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className={`min-h-screen ${isFullscreen ? 'fixed inset-0 z-50 overflow-y-auto bg-slate-950 p-4' : 'relative py-6'} ${formatTheme.wrapperClass}`}
    >
      {/* Audio Podcast Player Bar (Floating or Sticky) */}
      {showAudioPodcast && (
        <BuletinAudioPodcastBar
          buletinConfig={buletinConfig}
          overallSummary={overallSummary}
          onClose={() => setShowAudioPodcast(false)}
        />
      )}

      {/* Top Professional Control Bar (Sticky & Responsive) */}
      <div className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md text-white border-b border-white/10 px-4 py-3 shadow-xl mb-6 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Brand & Edition Title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black flex items-center justify-center text-sm shadow-md">
              026
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-extrabold text-white tracking-wide uppercase">
                  {namaBuletin}
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] font-mono">
                  {buletinConfig.edisi}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 hidden sm:block truncate max-w-md">
                KPPN Tipe A1 Semarang I • {activePages.length} Halaman Aktif Siap Cetak
              </p>
            </div>
          </div>

          {/* Search Trigger Button */}
          <button
            onClick={() => setIsSearchModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs text-slate-300 hover:text-white transition-all group"
            title="Cari kata kunci di seluruh 50 halaman (Ctrl/Cmd + K)"
          >
            <Search className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="hidden md:inline">Cari Topik / Halaman...</span>
            <kbd className="hidden lg:inline px-1.5 py-0.5 rounded bg-slate-900/60 text-[9px] text-slate-400 font-mono">
              Cari
            </kbd>
          </button>

          {/* Reader View Mode Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-white/10 text-xs">
            <button
              onClick={() => setReaderMode('flipbook')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                readerMode === 'flipbook'
                  ? 'bg-amber-400 text-slate-950 shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="Mode 2 Halaman (Flipbook Majalah)"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Flipbook</span>
            </button>
            <button
              onClick={() => setReaderMode('single')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                readerMode === 'single'
                  ? 'bg-amber-400 text-slate-950 shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="Mode 1 Halaman Tunggal"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tunggal</span>
            </button>
            <button
              onClick={() => setReaderMode('continuous')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                readerMode === 'continuous'
                  ? 'bg-amber-400 text-slate-950 shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="Mode Berkelanjutan (Semua Halaman Scroll)"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Semua</span>
            </button>
            <button
              onClick={() => setReaderMode('grid')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                readerMode === 'grid'
                  ? 'bg-amber-400 text-slate-950 shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="Tinjauan Grid Kartu"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Grid</span>
            </button>
          </div>

          {/* Action Tools (Studio AI, Catatan, Tema, Presentasi, Audio, HTML, Kelola, Cetak) */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* AI Studio & Writer Assistant */}
            <button
              onClick={() => setIsAiStudioOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
              title="Buka Studio Redaksi AI & Copywriter Cerdas (Gemini 3.7 Flash)"
            >
              <Sparkles className="w-3.5 h-3.5 text-slate-950" />
              <span>Studio AI</span>
            </button>

            {/* Sticky Notes & Annotation Drawer */}
            <button
              onClick={() => setIsAnnotationDrawerOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
              title="Buka Panel Catatan & Bookmark Review Majalah"
            >
              <StickyNote className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden xl:inline">Catatan</span>
            </button>

            {/* Theme & Visual Palette Switcher */}
            <button
              onClick={() => setIsThemePaletteModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
              title="Pilih Tema Warna & Palet Visual Majalah"
            >
              <Palette className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden xl:inline">Tema</span>
            </button>

            {/* Reading Mode Filters (Sepia, E-Ink, Dark, Normal) */}
            <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-xl p-0.5">
              <button
                onClick={() => setReadingFilter('normal')}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  readingFilter === 'normal'
                    ? 'bg-amber-400 text-slate-950 font-black'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Tampilan Normal"
              >
                Normal
              </button>
              <button
                onClick={() => setReadingFilter('sepia')}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  readingFilter === 'sepia'
                    ? 'bg-amber-700 text-amber-100 font-black'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Filter Sepia Ramah Mata"
              >
                Sepia
              </button>
              <button
                onClick={() => setReadingFilter('eink')}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  readingFilter === 'eink'
                    ? 'bg-slate-300 text-slate-950 font-black'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Filter E-Ink Monochrome Tajam"
              >
                E-Ink
              </button>
            </div>

            {/* AI Assistant (FiskalBot Q&A) */}
            <button
              onClick={() => setIsAiAssistantOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
              title="FiskalBot AI: Tanya Jawab Pintar Data APBN & IKPA"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Tanya AI</span>
            </button>

            {/* Data Export (CSV/JSON/Executive Summary) */}
            <button
              onClick={() => setIsDataExportOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
              title="Pusat Unduh & Ekspor Dataset APBN / IKPA"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden xl:inline">Ekspor Data</span>
            </button>

            {/* Voice Narrator (TTS Web Speech Engine) */}
            <button
              onClick={() => setIsVoiceNarratorOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
              title="Putar Narasi Suara AI (Text-to-Speech Otomatis)"
            >
              <Mic className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="hidden xl:inline">Voice AI</span>
            </button>

            {/* Interactive Game Arena & TTS */}
            <button
              onClick={() => setIsInteractiveGameOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
              title="Arena Teka-Teki Silang & Kuis APBN Interaktif"
            >
              <Gamepad2 className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden xl:inline">Game Arena</span>
            </button>

            {/* Infographic & Callout Studio */}
            <button
              onClick={() => setIsInfographicStudioOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
              title="Studio Desain Kartu Callout & Infografis Media"
            >
              <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden xl:inline">Studio Grafis</span>
            </button>

            {/* Distribution Hub (WhatsApp / Sosmed / Embed / QR) */}
            <button
              onClick={() => setIsDistributionHubOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
              title="Pusat Distribusi WhatsApp, Medsos, Web Embed & QR Code"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden xl:inline">Distribusi</span>
            </button>

            {/* Presentation / Kiosk Slideshow Mode */}
            <button
              onClick={() => setIsPresentationModeOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
              title="Mode Presentasi Layar Penuh / Layar Lobby KPPN"
            >
              <Tv className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden xl:inline">Kiosk</span>
            </button>

            {/* Audio Podcast Button */}
            <button
              onClick={() => setShowAudioPodcast(!showAudioPodcast)}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md transition-all ${
                showAudioPodcast
                  ? 'bg-amber-400 text-slate-950'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
              title="Putar Narasi Suara Eksekutif Buletin"
            >
              <Headphones className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Audio</span>
            </button>

            {/* Standalone HTML Export */}
            <button
              onClick={handleExportOfflineHtml}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
              title="Unduh E-Book Majalah Flipbook HTML (Offline)"
            >
              <FileCode className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden lg:inline">E-Book HTML</span>
            </button>

            {/* Custom Page Builder (Tambah & Desain Halaman Majalah) */}
            <button
              onClick={() => setIsCustomPageBuilderOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
              title="Tambah & Desain Halaman Kustom (Artikel, Infografis, Wawancara, Tabel)"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Tambah Halaman</span>
            </button>

            {/* Deep Analytics & Stress Test Lab */}
            <button
              onClick={() => setIsDeepAnalyticsOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
              title="Laboratorium Analisis Fiskal Mendalam & Simulasi APBN"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Analisis Mendalam</span>
            </button>

            {/* Page Manager */}
            <button
              onClick={() => setIsPageManagerOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
              title="Kelola & Sembunyikan / Hapus Halaman Tertentu"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Kelola ({activePages.length})</span>
            </button>

            {/* Selective Print / PDF & Canva Generator */}
            <button
              onClick={() => setIsPrintSelectModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
              title="Pilih Halaman Tertentu untuk Dicetak ke PDF atau Disalin Formatnya ke Canva"
            >
              <Printer className="w-3.5 h-3.5 text-slate-950" />
              <span>Cetak &amp; Canva</span>
            </button>

            {/* Sound Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl transition-colors ${
                soundEnabled
                  ? 'bg-amber-400/20 text-amber-300 hover:bg-amber-400/30'
                  : 'bg-white/10 hover:bg-white/20 text-slate-400'
              }`}
              title={soundEnabled ? 'Suara Buka Kertas Aktif (Klik untuk Matikan)' : 'Suara Buka Kertas Mati (Klik untuk Aktifkan)'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Fullscreen */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
              title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Magazine Canvas Container (Screen View Only) */}
      <div
        className={`max-w-7xl mx-auto px-4 print:hidden transition-all duration-300 ${
          readingFilter === 'sepia'
            ? 'sepia-[0.35] brightness-[0.98]'
            : readingFilter === 'eink'
            ? 'grayscale contrast-125'
            : ''
        }`}
      >
        {/* Flipbook Mode (Spread 2 Halaman Berdampingan dengan Efek 3D Page Turn & Spine Shadow) */}
        {readerMode === 'flipbook' && (
          <div className="space-y-6">
            <div className="flex items-center justify-center gap-2 sm:gap-4">
              <button
                onClick={goToPrev}
                disabled={currentSpread === 0}
                className="p-3 rounded-full bg-slate-900 text-amber-400 hover:bg-slate-800 hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed shadow-2xl transition-all z-20"
                title="Halaman Sebelumnya"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              {/* 3D Magazine Spread Shell */}
              <div 
                className="relative max-w-6xl w-full flex flex-col lg:flex-row items-center justify-center p-2 sm:p-4 rounded-3xl bg-slate-950/60 border border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.7)] backdrop-blur-md transition-all"
                style={{ perspective: '2500px' }}
              >
                {/* Central Spine Shadow & Binder Effect (Desktop only) */}
                <div className="hidden lg:block absolute top-4 bottom-4 left-1/2 -translate-x-1/2 w-4 bg-gradient-to-r from-black/40 via-black/80 to-black/40 rounded-full z-40 shadow-[0_0_15px_rgba(0,0,0,0.8)] pointer-events-none" />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-0 items-start w-full transition-transform duration-500">
                  {/* Left Page with 3D Flip Rotation */}
                  <div 
                    className={`w-full transition-all duration-500 origin-right ${
                      isFlipping && flipDirection === 'prev' 
                        ? 'transform -rotate-y-12 scale-[0.98] brightness-110 shadow-2xl z-30' 
                        : 'z-10'
                    }`}
                  >
                    {activePages[currentSpread * 2] ? (
                      renderPageWrapper(activePages[currentSpread * 2].num, false)
                    ) : (
                      <div className="hidden lg:flex w-full min-h-[1050px] rounded-l-2xl bg-slate-900/50 border border-white/10 items-center justify-center text-slate-500 font-mono text-xs">
                        [Sampul Awal]
                      </div>
                    )}
                  </div>

                  {/* Right Page with 3D Flip Rotation */}
                  <div 
                    className={`w-full transition-all duration-500 origin-left ${
                      isFlipping && flipDirection === 'next' 
                        ? 'transform rotate-y-12 scale-[0.98] brightness-110 shadow-2xl z-30' 
                        : 'z-10'
                    }`}
                  >
                    {activePages[currentSpread * 2 + 1] ? (
                      renderPageWrapper(activePages[currentSpread * 2 + 1].num, true)
                    ) : (
                      <div className="hidden lg:flex w-full min-h-[1050px] rounded-r-2xl bg-slate-900/40 border border-dashed border-white/10 items-center justify-center text-slate-400 font-mono text-xs">
                        [Akhir Majalah - Sampul Belakang]
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={goToNext}
                disabled={currentSpread >= totalSpreads - 1}
                className="p-3 rounded-full bg-slate-900 text-amber-400 hover:bg-slate-800 hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed shadow-2xl transition-all z-20"
                title="Halaman Berikutnya"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            {/* Bottom Spread Navigation Counter & Status */}
            <div className="flex items-center justify-center gap-3 text-xs text-slate-400 font-mono">
              <span className="px-3 py-1 rounded-full bg-slate-900 border border-white/10 text-amber-400 font-bold">
                📖 Spread {currentSpread + 1} dari {totalSpreads}
              </span>
              <span>•</span>
              <span>
                Halaman {activePages[currentSpread * 2]?.num || 1}
                {activePages[currentSpread * 2 + 1]
                  ? ` & ${activePages[currentSpread * 2 + 1].num}`
                  : ''}{' '}
                dari {masterPageDirectory.length} Master Pages
              </span>
            </div>
          </div>
        )}

        {/* Single Page Mode */}
        {readerMode === 'single' && (
          <div className="space-y-6">
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={goToPrev}
                disabled={currentSinglePage <= 1}
                className="p-3 rounded-full bg-slate-900 text-amber-400 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed shadow-xl transition-all"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <div className="max-w-3xl w-full">
                {activePages[currentSinglePage - 1] &&
                  renderPageWrapper(activePages[currentSinglePage - 1].num)}
              </div>

              <button
                onClick={goToNext}
                disabled={currentSinglePage >= totalPages}
                className="p-3 rounded-full bg-slate-900 text-amber-400 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed shadow-xl transition-all"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            <div className="text-center font-mono text-xs text-slate-400">
              Halaman {activePages[currentSinglePage - 1]?.num || 1} dari {totalPages}
            </div>
          </div>
        )}

        {/* Continuous Scroll Mode (Semua Halaman Vertikal) */}
        {readerMode === 'continuous' && (
          <div className="space-y-8 max-w-4xl mx-auto">
            {activePages.map(page => renderPageWrapper(page.num))}
          </div>
        )}

        {/* Grid Overview Mode */}
        {readerMode === 'grid' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {activePages.map((page, idx) => (
              <div
                key={page.num}
                onClick={() => {
                  setReaderMode('single');
                  setCurrentSinglePage(idx + 1);
                }}
                className="group p-3 rounded-2xl bg-slate-900/90 border border-white/10 hover:border-amber-400 cursor-pointer transition-all flex flex-col justify-between space-y-2 shadow-lg hover:shadow-amber-500/10"
              >
                <div className="w-full h-32 rounded-xl bg-slate-800 overflow-hidden flex items-center justify-center p-2 text-center border border-white/5 group-hover:scale-105 transition-transform">
                  <div className="space-y-1">
                    <span className="w-7 h-7 rounded-lg bg-amber-400 text-slate-950 font-black font-mono text-xs flex items-center justify-center mx-auto">
                      {page.num}
                    </span>
                    <p className="text-[10px] text-slate-200 font-bold line-clamp-2">{page.title}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-mono text-slate-400">Hal {page.num}</span>
                  <span className="text-amber-300 font-bold">{page.section}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bottom Thumbnail Strip (Quick Jump Bar) */}
        {readerMode !== 'continuous' && readerMode !== 'grid' && (
          <div className="mt-8 pt-6 border-t border-white/10 print:hidden">
            <div className="flex items-center justify-between mb-3 text-xs text-slate-400">
              <span className="font-bold text-slate-200">Lompat Cepat ke Halaman:</span>
              <span>{activePages.length} Halaman Siap Cetak</span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-3 scrollbar-thin">
              {activePages.map((page, idx) => {
                const isSelected =
                  readerMode === 'flipbook'
                    ? Math.floor(idx / 2) === currentSpread
                    : idx + 1 === currentSinglePage;

                return (
                  <button
                    key={page.num}
                    onClick={() => goToPage(page.num)}
                    className={`shrink-0 px-3 py-2 rounded-xl font-mono text-xs font-bold transition-all flex flex-col items-center gap-1 border ${
                      isSelected
                        ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md scale-105'
                        : 'bg-slate-900 text-slate-300 border-white/10 hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-[11px] font-black">{page.num.toString().padStart(2, '0')}</span>
                    <span className="text-[9px] font-sans truncate max-w-[80px]">
                      {page.section}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Dedicated Print & PDF Engine (Only Selected Pages Are Printed) */}
      <div className="hidden print:block w-full">
        {(printSelectedPages && printSelectedPages.length > 0
          ? printSelectedPages
          : activePages.map(p => p.num)
        ).map(pageNum => renderPageWrapper(pageNum))}
      </div>

      {/* Page Manager Modal */}
      <BuletinPageManagerModal
        isOpen={isPageManagerOpen}
        onClose={() => setIsPageManagerOpen(false)}
        buletinConfig={buletinConfig}
        onUpdateBuletinConfig={updated => onUpdateBuletinConfig && onUpdateBuletinConfig(updated)}
        pageDirectory={masterPageDirectory}
      />

      {/* Selective Print / PDF & Canva Selector Modal */}
      <BuletinPrintSelectModal
        isOpen={isPrintSelectModalOpen}
        onClose={() => setIsPrintSelectModalOpen(false)}
        pageDirectory={activePages}
        buletinConfig={buletinConfig}
        overallSummary={overallSummary}
        onApplyPrintSelection={selectedNums => {
          setPrintSelectedPages(selectedNums);
        }}
      />

      {/* AI Studio & Copywriter Modal (Gemini 3.7 Flash) */}
      <BuletinAiStudioModal
        isOpen={isAiStudioOpen}
        onClose={() => setIsAiStudioOpen(false)}
        buletinConfig={buletinConfig}
        overallSummary={overallSummary}
        satkers={satkers}
        onApplyAiDraft={updatedFields => {
          if (onUpdateBuletinConfig) {
            onUpdateBuletinConfig({
              ...buletinConfig,
              ...updatedFields
            });
          }
        }}
      />

      {/* Global 50-Page Keyword Search Modal */}
      <BuletinSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        pages={activePages}
        onSelectPage={pageNum => {
          goToPage(pageNum);
          setIsSearchModalOpen(false);
        }}
      />

      {/* Interactive Sticky Notes & Bookmark Drawer */}
      <BuletinAnnotationDrawer
        isOpen={isAnnotationDrawerOpen}
        onClose={() => setIsAnnotationDrawerOpen(false)}
        currentPage={readerMode === 'flipbook' ? currentSpread * 2 + 1 : currentSinglePage}
        onJumpToPage={pageNum => {
          goToPage(pageNum);
        }}
        soundEnabled={soundEnabled}
      />

      {/* Theme Palette & Styling Modal */}
      <BuletinThemePaletteModal
        isOpen={isThemePaletteModalOpen}
        onClose={() => setIsThemePaletteModalOpen(false)}
        buletinConfig={buletinConfig}
        onUpdateBuletinConfig={updated => onUpdateBuletinConfig && onUpdateBuletinConfig(updated)}
        soundEnabled={soundEnabled}
      />

      {/* Immersive Fullscreen Presentation / Kiosk Mode */}
      <BuletinPresentationMode
        isOpen={isPresentationModeOpen}
        onClose={() => setIsPresentationModeOpen(false)}
        renderPageContent={pageNum => renderPageWrapper(pageNum)}
        activePages={activePages}
        initialPage={readerMode === 'flipbook' ? currentSpread * 2 + 1 : currentSinglePage}
        soundEnabled={soundEnabled}
      />

      {/* Voice Narrator (TTS Speech Synthesis Engine) */}
      <BuletinVoiceNarratorModal
        isOpen={isVoiceNarratorOpen}
        onClose={() => setIsVoiceNarratorOpen(false)}
        currentPage={readerMode === 'flipbook' ? currentSpread * 2 + 1 : currentSinglePage}
        totalPages={activePages.length}
        pageContent={getActivePageText(readerMode === 'flipbook' ? currentSpread * 2 + 1 : currentSinglePage)}
        onNextPage={goToNext}
        onPrevPage={goToPrev}
      />

      {/* Distribution Hub (WhatsApp / Sosmed / Embed / QR) */}
      <BuletinDistributionHubModal
        isOpen={isDistributionHubOpen}
        onClose={() => setIsDistributionHubOpen(false)}
        buletinConfig={buletinConfig}
        overallSummary={overallSummary}
        totalPages={activePages.length}
      />

      {/* Interactive Game Arena (TTS & Kuis APBN) */}
      <BuletinInteractiveGameModal
        isOpen={isInteractiveGameOpen}
        onClose={() => setIsInteractiveGameOpen(false)}
        soundEnabled={soundEnabled}
      />

      {/* Infographic & Callout Studio */}
      <BuletinInfographicStudioModal
        isOpen={isInfographicStudioOpen}
        onClose={() => setIsInfographicStudioOpen(false)}
        buletinConfig={buletinConfig}
        overallSummary={overallSummary || undefined}
        satkers={satkers}
      />

      {/* AI Assistant (FiskalBot Q&A with Citation Navigation) */}
      <BuletinAiAssistantModal
        isOpen={isAiAssistantOpen}
        onClose={() => setIsAiAssistantOpen(false)}
        buletinConfig={buletinConfig}
        overallSummary={overallSummary || undefined}
        satkers={satkers}
        onNavigateToPage={pageNum => {
          if (readerMode === 'flipbook') {
            const targetSpread = Math.floor((pageNum - 1) / 2);
            setCurrentSpread(Math.max(0, Math.min(totalSpreads - 1, targetSpread)));
          } else {
            setCurrentSinglePage(pageNum);
          }
          playPageFlipSound(soundEnabled);
        }}
      />

      {/* Data Export Modal (CSV, JSON, Executive Summary) */}
      <BuletinDataExportModal
        isOpen={isDataExportOpen}
        onClose={() => setIsDataExportOpen(false)}
        buletinConfig={buletinConfig}
        overallSummary={overallSummary || undefined}
        satkers={satkers}
      />

      {/* Custom Page Builder Modal (Tambah & Kelola Halaman Kustom) */}
      <BuletinCustomPageBuilderModal
        isOpen={isCustomPageBuilderOpen}
        onClose={() => setIsCustomPageBuilderOpen(false)}
        buletinConfig={buletinConfig}
        onUpdateBuletinConfig={updated => onUpdateBuletinConfig && onUpdateBuletinConfig(updated)}
      />

      {/* Deep Fiscal Analytics & Simulation Modal */}
      <BuletinDeepAnalyticsModal
        isOpen={isDeepAnalyticsOpen}
        onClose={() => setIsDeepAnalyticsOpen(false)}
        buletinConfig={buletinConfig}
        overallSummary={overallSummary || undefined}
        satkers={satkers}
      />
    </div>
  );
};
