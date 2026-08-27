import React, { useState, useMemo } from 'react';
import { 
  Presentation, 
  Download, 
  Printer, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Award, 
  CheckSquare, 
  Square, 
  Bot, 
  Filter, 
  Layers, 
  Target, 
  FileText, 
  Copy, 
  Check, 
  Zap, 
  Sliders, 
  Send, 
  RefreshCw, 
  Clock, 
  ShieldAlert, 
  ListOrdered, 
  BookOpen, 
  Volume2, 
  Maximize2, 
  Palette, 
  Layout, 
  MessageSquare, 
  AlertTriangle, 
  ArrowRight,
  FileSpreadsheet,
  FileCode,
  Share2,
  Table,
  CheckCircle2,
  PieChart as PieIcon,
  BarChart3,
  TrendingUp,
  Activity,
  Layers3,
  Settings,
  HelpCircle,
  Eye
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell, 
  PieChart, 
  Pie, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  LineChart, 
  Line, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import pptxgen from 'pptxgenjs';
import { generateGeminiContent, getClientStoredApiKey } from '../../services/geminiService';
import { SatkerIKPA, DashboardConfig } from '../../types';
import { 
  PeriodScope, 
  SlideCategory, 
  DetailedSlideContent, 
  generate50PresentationSlides,
  RootCauseItem,
  ActionPlanItem,
  RiskMatrixItem
} from '../../data/presentationSlidesData';
import { generateLocalFinancialAnalysis } from '../../utils/localAiAnalystEngine';

// 12 Pilihan Tema Visual
export type PresentationTheme = 
  | 'midnight'        // 1. Midnight Executive Navy (Kemenkeu Standard)
  | 'corporate_light' // 2. Clean Corporate Light (Minimalis Cetak)
  | 'cyber_matrix'    // 3. Cyber Analytics Dark (Futuristic Neon Cyan)
  | 'crimson_alert'   // 4. Sunset Crimson Risk (Evaluasi Risiko & Audit)
  | 'royal_gold'      // 5. Royal Gold Prestige (Penghargaan & Apresiasi Satker)
  | 'emerald_gov'     // 6. Emerald Governance (Akuntabilitas Hijau Mint)
  | 'nordic_slate'    // 7. Nordic Slate Frost (Minimalis Modern Abu-biru)
  | 'deep_ocean'      // 8. Deep Ocean Cobalt (Deep Blue Biru Laut Teduh)
  | 'sunset_amber'    // 9. Warm Sunset Amber (Orange Keemasan)
  | 'executive_mono'  // 10. Executive High-Contrast Mono (Hitam Putih Tajam)
  | 'amethyst_purple' // 11. Amethyst Imperial Purple (Ungu Elegan)
  | 'telemagenta_kpa';// 12. Magisterial Rose KPA (Merah Muda Tua & Emas)

// 8 Pilihan Format & Density Mode Slide
export type SlideDensityMode = 
  | 'deep_narrative'     // 1. 📖 Narasi Mendalam & Whitepaper (Dense 250-400 words, telaah regulasi)
  | 'executive_balanced' // 2. 📊 Paparan Eksekutif (Seimbang visual & poin kajian)
  | 'infographic_grid'   // 3. 📈 Infografis & Visual KPI Grid (Fokus chart & matriks)
  | 'speaking_notes'     // 4. 🎙️ Naskah Pidato Pimpinan (Full speech script siap baca)
  | 'root_cause_focus'   // 5. 🔍 Diagnosa Akar Masalah (Deep Root Cause & Fishbone)
  | 'action_matrix'      // 6. ⚡ Matriks Rencana Aksi Terstruktur (PIC, Timeline & Prioritas)
  | 'risk_compliance'    // 7. 🛡️ Matriks Risiko & Kepatuhan Regulasi (Risk Mitigation)
  | 'satker_scorecard';  // 8. 🏆 Kartu Skor Satker & Evaluasi Kinerja (Scorecard view)

// 4 Pilihan Rasio & Layout Slide
export type SlideAspectLayout = '16:9' | '4:3' | '16:10' | 'A4_landscape';

// 8 Pilihan Format Output / Ekspor
export type OutputExportFormat = 
  | 'pptx'           // Microsoft PowerPoint (.pptx)
  | 'html_deck'      // Interactive HTML Slides Presentation (Standalone Offline)
  | 'word_doc'       // Ringkasan Dokumen Naskah (Rich Text / Markdown .doc)
  | 'csv_dataset'    // Tabulasi Data 50 Slide (.csv)
  | 'json_data'      // JSON Raw Structure (.json)
  | 'print_pdf';     // Print to PDF siap cetak

// 6 Sub-Tab Detail Slide Stage
export type SlideStageSubTab = 
  | 'analysis'       // Narasi & Fakta Strategis
  | 'root_causes'    // Diagnosa Akar Masalah
  | 'action_plan'    // Matriks Rencana Aksi
  | 'risk_matrix'    // Matriks Risiko & Mitigasi
  | 'speaking_notes' // Naskah Pidato Pimpinan
  | 'table_view';    // Tabel Data Rinci

interface IKPAPresentationDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  satkers: SatkerIKPA[];
  dashboardConfig: DashboardConfig;
  isDark?: boolean;
  onAskGeminiForTopic?: (topicPrompt: string) => void;
}

export const IKPAPresentationDeckModal: React.FC<IKPAPresentationDeckModalProps> = ({
  isOpen,
  onClose,
  satkers,
  isDark = false,
  onAskGeminiForTopic
}) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [periodScope, setPeriodScope] = useState<PeriodScope>('TW1');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<SlideCategory>('ALL');
  const [selectedSlideIds, setSelectedSlideIds] = useState<number[]>(
    Array.from({ length: 50 }, (_, i) => i + 1)
  );

  // Customization: Theme, Density Mode, Aspect Ratio & Export Format
  const [activeTheme, setActiveTheme] = useState<PresentationTheme>('midnight');
  const [densityMode, setDensityMode] = useState<SlideDensityMode>('deep_narrative');
  const [aspectRatio, setAspectRatio] = useState<SlideAspectLayout>('16:9');
  const [stageSubTab, setStageSubTab] = useState<SlideStageSubTab>('analysis');

  // Slide Edits & AI Enhanced Overrides (keyed by slide id)
  const [slideOverrides, setSlideOverrides] = useState<Record<number, Partial<DetailedSlideContent>>>({});

  // Export State
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportFeedback, setExportFeedback] = useState<string>('');
  const [copiedTextStatus, setCopiedTextStatus] = useState<boolean>(false);

  // In-Modal Gemini AI Studio State
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [aiPromptInput, setAiPromptInput] = useState<string>('');
  const [aiPersona, setAiPersona] = useState<string>('mski_analyst');
  const [aiModel, setAiModel] = useState<string>('gemini-3.7-flash');
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);
  const [aiGeneratedResult, setAiGeneratedResult] = useState<string>('');
  const [aiApiKey] = useState<string>(() => {
    return getClientStoredApiKey();
  });

  // Generate 50 slides dynamically based on satker dataset & period
  const raw50Slides: DetailedSlideContent[] = useMemo(() => {
    return generate50PresentationSlides(satkers, periodScope);
  }, [satkers, periodScope]);

  // Merge raw slides with user/AI overrides
  const all50Slides: DetailedSlideContent[] = useMemo(() => {
    return raw50Slides.map(slide => {
      const override = slideOverrides[slide.id];
      if (override) {
        return { ...slide, ...override };
      }
      return slide;
    });
  }, [raw50Slides, slideOverrides]);

  // Filtered Slides for list
  const displayedSlides = useMemo(() => {
    if (selectedCategoryFilter === 'ALL') return all50Slides;
    return all50Slides.filter(s => s.category === selectedCategoryFilter);
  }, [all50Slides, selectedCategoryFilter]);

  const currentSlide = all50Slides[currentSlideIndex] || all50Slides[0];

  // Word count & reader time estimate for current slide
  const slideWordCount = useMemo(() => {
    const textPool = [
      currentSlide.title,
      currentSlide.subtitle,
      currentSlide.deepNarrative || '',
      ...(currentSlide.analysisPoints || []),
      currentSlide.recommendation || '',
      currentSlide.speakingNotes || ''
    ].join(' ');
    const words = textPool.trim().split(/\s+/).filter(Boolean).length;
    const estMinutes = Math.max(1, Math.round(words / 130));
    return { words, estMinutes };
  }, [currentSlide]);

  if (!isOpen) return null;

  const toggleSlideSelection = (id: number) => {
    setSelectedSlideIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id].sort((a, b) => a - b)
    );
  };

  const selectAllSlides = () => setSelectedSlideIds(all50Slides.map(s => s.id));
  const deselectAllSlides = () => setSelectedSlideIds([]);

  // 12 Pilihan Tema Palet Warna Lengkap
  const themeStyles: Record<PresentationTheme, {
    name: string;
    bgPptx: string;
    stageBg: string;
    cardBg: string;
    border: string;
    accent: string;
    accentPptx: string;
    textColor: string;
    badgeBg: string;
    badgeBorder: string;
    badgeText: string;
    dot: string;
  }> = {
    midnight: {
      name: 'Midnight Navy (Kemenkeu)',
      bgPptx: '090D16',
      stageBg: 'bg-slate-950',
      cardBg: 'bg-slate-900/90',
      border: 'border-slate-800',
      accent: 'text-indigo-400',
      accentPptx: '6366F1',
      textColor: 'text-slate-100',
      badgeBg: 'bg-indigo-950/80',
      badgeBorder: 'border-indigo-500/40',
      badgeText: 'text-indigo-300',
      dot: 'bg-indigo-600'
    },
    corporate_light: {
      name: 'Corporate Light (Cetak)',
      bgPptx: 'F8FAFC',
      stageBg: 'bg-slate-50',
      cardBg: 'bg-white',
      border: 'border-slate-200',
      accent: 'text-blue-600',
      accentPptx: '2563EB',
      textColor: 'text-slate-900',
      badgeBg: 'bg-blue-50',
      badgeBorder: 'border-blue-200',
      badgeText: 'text-blue-700',
      dot: 'bg-blue-400'
    },
    cyber_matrix: {
      name: 'Cyber Analytics Dark',
      bgPptx: '030712',
      stageBg: 'bg-gray-950',
      cardBg: 'bg-gray-900/90',
      border: 'border-cyan-900/50',
      accent: 'text-cyan-400',
      accentPptx: '06B6D4',
      textColor: 'text-cyan-50',
      badgeBg: 'bg-cyan-950/80',
      badgeBorder: 'border-cyan-500/40',
      badgeText: 'text-cyan-300',
      dot: 'bg-cyan-400'
    },
    crimson_alert: {
      name: 'Sunset Crimson Risk',
      bgPptx: '180509',
      stageBg: 'bg-rose-950/40',
      cardBg: 'bg-rose-950/60',
      border: 'border-rose-900/60',
      accent: 'text-rose-400',
      accentPptx: 'E11D48',
      textColor: 'text-rose-50',
      badgeBg: 'bg-rose-950',
      badgeBorder: 'border-rose-500/40',
      badgeText: 'text-rose-300',
      dot: 'bg-rose-500'
    },
    royal_gold: {
      name: 'Royal Gold Prestige',
      bgPptx: '0C0A09',
      stageBg: 'bg-stone-950',
      cardBg: 'bg-stone-900/90',
      border: 'border-amber-800/40',
      accent: 'text-amber-400',
      accentPptx: 'D97706',
      textColor: 'text-amber-50',
      badgeBg: 'bg-amber-950/80',
      badgeBorder: 'border-amber-500/40',
      badgeText: 'text-amber-300',
      dot: 'bg-amber-500'
    },
    emerald_gov: {
      name: 'Emerald Governance',
      bgPptx: '041F16',
      stageBg: 'bg-emerald-950/40',
      cardBg: 'bg-emerald-950/60',
      border: 'border-emerald-800/50',
      accent: 'text-emerald-400',
      accentPptx: '10B981',
      textColor: 'text-emerald-50',
      badgeBg: 'bg-emerald-950',
      badgeBorder: 'border-emerald-500/40',
      badgeText: 'text-emerald-300',
      dot: 'bg-emerald-500'
    },
    nordic_slate: {
      name: 'Nordic Slate Frost',
      bgPptx: '0F172A',
      stageBg: 'bg-slate-900',
      cardBg: 'bg-slate-800/90',
      border: 'border-slate-700',
      accent: 'text-sky-300',
      accentPptx: '38BDF8',
      textColor: 'text-slate-100',
      badgeBg: 'bg-slate-800',
      badgeBorder: 'border-sky-500/40',
      badgeText: 'text-sky-300',
      dot: 'bg-sky-400'
    },
    deep_ocean: {
      name: 'Deep Ocean Cobalt',
      bgPptx: '05162E',
      stageBg: 'bg-blue-950/70',
      cardBg: 'bg-blue-900/50',
      border: 'border-blue-800/60',
      accent: 'text-blue-300',
      accentPptx: '3B82F6',
      textColor: 'text-blue-50',
      badgeBg: 'bg-blue-950',
      badgeBorder: 'border-blue-500/40',
      badgeText: 'text-blue-300',
      dot: 'bg-blue-600'
    },
    sunset_amber: {
      name: 'Warm Sunset Amber',
      bgPptx: '1C1004',
      stageBg: 'bg-amber-950/40',
      cardBg: 'bg-amber-950/60',
      border: 'border-amber-800/50',
      accent: 'text-amber-300',
      accentPptx: 'F59E0B',
      textColor: 'text-amber-50',
      badgeBg: 'bg-amber-950',
      badgeBorder: 'border-amber-500/40',
      badgeText: 'text-amber-300',
      dot: 'bg-orange-500'
    },
    executive_mono: {
      name: 'Executive Mono Contrast',
      bgPptx: '000000',
      stageBg: 'bg-black',
      cardBg: 'bg-zinc-900/90',
      border: 'border-zinc-700',
      accent: 'text-white',
      accentPptx: 'FFFFFF',
      textColor: 'text-zinc-100',
      badgeBg: 'bg-zinc-800',
      badgeBorder: 'border-zinc-500',
      badgeText: 'text-zinc-200',
      dot: 'bg-zinc-400'
    },
    amethyst_purple: {
      name: 'Amethyst Imperial',
      bgPptx: '130822',
      stageBg: 'bg-purple-950/50',
      cardBg: 'bg-purple-900/40',
      border: 'border-purple-800/60',
      accent: 'text-purple-300',
      accentPptx: 'A855F7',
      textColor: 'text-purple-50',
      badgeBg: 'bg-purple-950',
      badgeBorder: 'border-purple-500/40',
      badgeText: 'text-purple-300',
      dot: 'bg-purple-500'
    },
    telemagenta_kpa: {
      name: 'Magisterial Rose KPA',
      bgPptx: '1E0B14',
      stageBg: 'bg-pink-950/40',
      cardBg: 'bg-pink-950/60',
      border: 'border-pink-800/50',
      accent: 'text-pink-300',
      accentPptx: 'EC4899',
      textColor: 'text-pink-50',
      badgeBg: 'bg-pink-950',
      badgeBorder: 'border-pink-500/40',
      badgeText: 'text-pink-300',
      dot: 'bg-pink-500'
    }
  };

  const activeThemeConfig = themeStyles[activeTheme];

  // Handler to Execute Gemini AI Analysis for Current Slide
  const handleRunAiSlideEnhance = async (presetPrompt?: string) => {
    const promptToUse = presetPrompt || aiPromptInput || `Perdalam analisis data pada slide ${currentSlide.id}: "${currentSlide.title}" (${currentSlide.subtitle}). Berikan analisis mendalam 300 kata, telaah akar masalah SAKTI, dan naskah pidato pimpinan.`;
    
    setIsAiGenerating(true);
    setAiGeneratedResult('');

    // Context summary
    const satkerStatsSummary = {
      total: satkers.length,
      avgIKPA: Number((satkers.reduce((acc, s) => acc + (s.nilaiTotalIKPA || 0), 0) / (satkers.length || 1)).toFixed(2)),
      satkerDalamPerhatian: satkers.filter(s => s.nilaiTotalIKPA < 87.5),
      belowIKPA: satkers.filter(s => s.nilaiTotalIKPA < 87.5),
      belowOutput: satkers.filter(s => s.statusCapaianOutput !== 'Sudah Terlaporkan'),
      belowDeviasi: satkers.filter(s => (s.indikator?.deviasiHal3Dipa || 0) < 75),
      belowPenyerapan: satkers.filter(s => (s.persenPenyerapan || 0) < 75)
    };

    try {
      const systemPrompt = `Anda adalah Spesialis Analis Eksekutif Keuangan Negara & Master Presenter IKPA SAKTI di KPPN Tipe A1 Semarang I (Kode 026).
Slide yang sedang dibahas: Slide #${currentSlide.id} - ${currentSlide.title} (${currentSlide.subtitle}).
Data agregat KPPN: ${satkers.length} Satker, Rata-rata IKPA: ${satkerStatsSummary.avgIKPA}.
Fokus instruksi: Hasilkan narasi paparan berbobot tinggi, kaya kata-kata, analisis mendalam, bahasa kedinasan elegan, fakta empiris, dan arahan konkret pimpinan.`;

      const response = await generateGeminiContent({
        model: aiModel || 'gemini-3.7-flash',
        prompt: `Permintaan Pengguna: ${promptToUse}`,
        systemInstruction: systemPrompt,
        apiKey: aiApiKey || undefined
      });

      if (response.text) {
        setAiGeneratedResult(response.text);
      } else {
        setAiGeneratedResult('Respon AI kosong. Silakan coba kembali.');
      }
    } catch (err: any) {
      console.warn('Gemini API call error, falling back to Local Financial Intelligence Engine', err);
      const fallbackResult = generateLocalFinancialAnalysis(
        promptToUse,
        aiPersona,
        satkers,
        satkerStatsSummary,
        null
      );
      setAiGeneratedResult(`*(Mode Cepat - Local Financial Intelligence Engine)*\n\n${fallbackResult}`);
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Apply AI Result to Current Slide
  const handleApplyAiToCurrentSlide = () => {
    if (!aiGeneratedResult) return;

    setSlideOverrides(prev => ({
      ...prev,
      [currentSlide.id]: {
        ...prev[currentSlide.id],
        deepNarrative: aiGeneratedResult,
        speakingNotes: `Naskah Pidato Pimpinan (Dihasilkan oleh Gemini AI):\n${aiGeneratedResult.slice(0, 350)}...`
      }
    }));

    alert(`✨ Hasil analisis Gemini AI berhasil diterapkan ke Slide ${currentSlide.id}! Format tayang, teks, dan PPTX telah diperbarui.`);
    setIsAiModalOpen(false);
  };

  // Copy Full Slide Script to Clipboard
  const handleCopySlideScript = () => {
    const fullText = `=== PAPARAN IKPA KPPN SEMARANG I (SLIDE ${currentSlide.id}/50) ===
Judul: ${currentSlide.title}
Subjudul: ${currentSlide.subtitle}
Topik: ${currentSlide.category} | ${currentSlide.badge}

--- KAJIAN STRATEGIS & NARASI MENDALAM ---
${currentSlide.deepNarrative || currentSlide.analysisPoints.join('\n')}

--- POIN FAKTA EMPIRIS ---
${currentSlide.analysisPoints.map(p => `• ${p}`).join('\n')}

--- REKOMENDASI TINDAKAN ---
${currentSlide.recommendation}

--- MATRIKS RENCANA AKSI ---
${(currentSlide.actionPlanDetails || []).map(a => `[${a.priority}] ${a.actor}: ${a.action} (Target: ${a.timeline})`).join('\n')}

--- DIAGNOSA AKAR MASALAH (ROOT CAUSES) ---
${(currentSlide.rootCauses || []).map(r => `• [${r.category}] ${r.description} -> Dampak: ${r.impact || '-'}`).join('\n')}

--- MATRIKS RISIKO & MITIGASI ---
${(currentSlide.riskMatrix || []).map(m => `• [Risiko ${m.level}] ${m.riskItem} -> Mitigasi: ${m.mitigation}`).join('\n')}

--- NASKAH PIDATO PIMPINAN (SPEAKING NOTES) ---
${currentSlide.speakingNotes || '-'}

Dasar Regulasi: ${currentSlide.regulationRef || 'Juknis IKPA DJPb'}`;

    navigator.clipboard.writeText(fullText);
    setCopiedTextStatus(true);
    setTimeout(() => setCopiedTextStatus(false), 2000);
  };

  // Export Format Handler: Menangani PPTX, HTML Interactive Deck, Word Doc, CSV, JSON
  const handleExportCustomFormat = async (format: OutputExportFormat) => {
    const slidesToExport = all50Slides.filter(s => selectedSlideIds.includes(s.id));
    if (slidesToExport.length === 0) {
      alert('Silakan pilih minimal 1 slide untuk diekspor.');
      return;
    }

    setIsExporting(true);
    setExportFeedback(`Mengekspor dalam format ${format.toUpperCase()}...`);

    try {
      if (format === 'pptx') {
        const pptx = new pptxgen();
        pptx.layout = aspectRatio === '4:3' ? 'LAYOUT_4x3' : 'LAYOUT_16x9';
        pptx.author = 'KPPN Semarang I';
        pptx.company = 'Direktorat Jenderal Perbendaharaan - Kementerian Keuangan RI';
        pptx.title = `Paparan Evaluasi Kinerja IKPA ${periodScope} - 50 Slide Komprehensif`;

        const isLight = activeTheme === 'corporate_light';
        const bgColor = activeThemeConfig.bgPptx;
        const accentHex = activeThemeConfig.accentPptx;
        const textMainHex = isLight ? '0F172A' : 'FFFFFF';
        const textSubHex = isLight ? '334155' : '94A3B8';
        const cardBgHex = isLight ? 'FFFFFF' : '111827';
        const cardBorderHex = isLight ? 'CBD5E1' : '1F2937';

        slidesToExport.forEach((slideItem) => {
          const slide = pptx.addSlide();
          slide.background = { color: bgColor };

          // Top Accent Stripe
          slide.addShape(pptx.ShapeType.rect, {
            x: 0,
            y: 0,
            w: aspectRatio === '4:3' ? 10 : 13.33,
            h: 0.12,
            fill: { color: accentHex }
          });

          // Category Badge
          slide.addShape(pptx.ShapeType.roundRect, {
            x: 0.6,
            y: 0.3,
            w: 2.8,
            h: 0.32,
            fill: { color: isLight ? 'E0E7FF' : '1E1B4B' },
            line: { color: accentHex, width: 1 }
          });

          slide.addText(slideItem.category.replace('_', ' '), {
            x: 0.6,
            y: 0.3,
            w: 2.8,
            h: 0.32,
            fontSize: 8.5,
            bold: true,
            color: isLight ? '3730A3' : 'A5B4FC',
            align: 'center'
          });

          // Slide Number Pill
          slide.addText(`Slide ${slideItem.id} dari 50`, {
            x: aspectRatio === '4:3' ? 7.2 : 10.5,
            y: 0.3,
            w: 2.2,
            h: 0.32,
            fontSize: 8.5,
            color: textSubHex,
            align: 'right'
          });

          // Slide Title & Subtitle
          slide.addText(slideItem.title, {
            x: 0.6,
            y: 0.7,
            w: aspectRatio === '4:3' ? 8.8 : 12.13,
            h: 0.45,
            fontSize: 15,
            bold: true,
            color: textMainHex
          });

          slide.addText(slideItem.subtitle, {
            x: 0.6,
            y: 1.15,
            w: aspectRatio === '4:3' ? 8.8 : 12.13,
            h: 0.28,
            fontSize: 9.5,
            color: isLight ? '0284C7' : '38BDF8',
            bold: true
          });

          const hasChart = !!slideItem.chartConfig && densityMode !== 'deep_narrative';
          const contentWidth = hasChart ? (aspectRatio === '4:3' ? 4.5 : 5.8) : (aspectRatio === '4:3' ? 8.8 : 12.13);
          let topY = 1.55;

          // Stats Highlight Cards if available
          if (slideItem.statsHighlight && slideItem.statsHighlight.length > 0) {
            const count = slideItem.statsHighlight.length;
            const cardWidth = (contentWidth - 0.15 * (count - 1)) / count;

            slideItem.statsHighlight.forEach((stat, idx) => {
              const cardX = 0.6 + idx * (cardWidth + 0.15);
              slide.addShape(pptx.ShapeType.roundRect, {
                x: cardX,
                y: topY,
                w: cardWidth,
                h: 0.78,
                fill: { color: cardBgHex },
                line: { color: cardBorderHex, width: 1 }
              });

              slide.addText(stat.label.toUpperCase(), {
                x: cardX + 0.05,
                y: topY + 0.05,
                w: cardWidth - 0.1,
                h: 0.18,
                fontSize: 7,
                bold: true,
                color: textSubHex,
                align: 'center'
              });

              slide.addText(stat.value, {
                x: cardX + 0.05,
                y: topY + 0.22,
                w: cardWidth - 0.1,
                h: 0.32,
                fontSize: 12,
                bold: true,
                color: stat.color === 'emerald' ? '10B981' : stat.color === 'rose' ? 'EF4444' : stat.color === 'amber' ? 'F59E0B' : accentHex,
                align: 'center'
              });
            });
            topY += 0.88;
          }

          // Deep Narrative Box
          if (slideItem.deepNarrative) {
            slide.addShape(pptx.ShapeType.roundRect, {
              x: 0.6,
              y: topY,
              w: contentWidth,
              h: 1.45,
              fill: { color: isLight ? 'F1F5F9' : '111827' },
              line: { color: isLight ? 'CBD5E1' : '334155', width: 1 }
            });

            slide.addText('Analisis Komprehensif & Telaah Substansi:', {
              x: 0.75,
              y: topY + 0.08,
              w: contentWidth - 0.3,
              h: 0.2,
              fontSize: 8.5,
              bold: true,
              color: isLight ? 'B45309' : 'FBBF24'
            });

            slide.addText(slideItem.deepNarrative, {
              x: 0.75,
              y: topY + 0.28,
              w: contentWidth - 0.3,
              h: 1.1,
              fontSize: 8,
              color: textMainHex,
              lineSpacing: 13
            });

            topY += 1.55;
          }

          // Strategic Analysis Bullet Points
          if (slideItem.analysisPoints && slideItem.analysisPoints.length > 0) {
            slide.addText('Kajian Strategis & Fakta Pelaksanaan Anggaran:', {
              x: 0.6,
              y: topY,
              w: contentWidth,
              h: 0.22,
              fontSize: 9,
              color: isLight ? '92400E' : 'FBBF24',
              bold: true
            });

            const bulletText = slideItem.analysisPoints.map(p => `• ${p}`).join('\n');
            slide.addText(bulletText, {
              x: 0.6,
              y: topY + 0.22,
              w: contentWidth,
              h: hasChart ? 1.6 : 1.3,
              fontSize: 8,
              color: textMainHex,
              lineSpacing: 13
            });

            topY += (hasChart ? 1.85 : 1.45);
          }

          // Native Chart
          if (hasChart && slideItem.chartConfig) {
            const cfg = slideItem.chartConfig;
            const chartX = aspectRatio === '4:3' ? 5.3 : 6.7;
            const chartY = 1.55;
            const chartW = aspectRatio === '4:3' ? 4.1 : 6.0;
            const chartH = 3.6;

            slide.addText(`Grafik Analisis: ${cfg.title}`, {
              x: chartX,
              y: chartY - 0.22,
              w: chartW,
              h: 0.2,
              fontSize: 8.5,
              color: isLight ? '0369A1' : '38BDF8',
              bold: true
            });

            try {
              if (cfg.type === 'donut' || cfg.type === 'gauge') {
                const pieData = [{
                  name: cfg.title,
                  labels: cfg.data.map(d => d.name),
                  values: cfg.data.map(d => d.value)
                }];

                slide.addChart(pptx.ChartType.doughnut, pieData, {
                  x: chartX,
                  y: chartY,
                  w: chartW,
                  h: chartH,
                  showLegend: true,
                  legendPos: 'b',
                  legendFontSize: 7.5,
                  legendColor: textSubHex,
                  showPercent: true
                });
              } else if (cfg.type === 'line') {
                const lineData = [{
                  name: 'Realisasi/Capaian',
                  labels: cfg.data.map(d => d.name),
                  values: cfg.data.map(d => d.value)
                }];

                slide.addChart(pptx.ChartType.line, lineData, {
                  x: chartX,
                  y: chartY,
                  w: chartW,
                  h: chartH,
                  showLegend: true,
                  legendPos: 'b',
                  legendFontSize: 7.5,
                  legendColor: textSubHex,
                  lineSmooth: true,
                  chartColors: ['10B981']
                });
              } else {
                const barData = [{
                  name: 'Capaian',
                  labels: cfg.data.map(d => d.name),
                  values: cfg.data.map(d => d.value)
                }];

                slide.addChart(pptx.ChartType.bar, barData, {
                  x: chartX,
                  y: chartY,
                  w: chartW,
                  h: chartH,
                  showLegend: false,
                  chartColors: [accentHex]
                });
              }
            } catch (chartErr) {
              console.warn('Native chart generation note', chartErr);
            }
          }

          // Recommendation Box
          if (slideItem.recommendation) {
            const recY = Math.min(topY, 5.85);
            slide.addShape(pptx.ShapeType.roundRect, {
              x: 0.6,
              y: recY,
              w: aspectRatio === '4:3' ? 8.8 : 12.13,
              h: 0.72,
              fill: { color: isLight ? 'EFF6FF' : '1E1B4B' },
              line: { color: accentHex, width: 1 }
            });

            slide.addText(`Rekomendasi Tindakan: ${slideItem.recommendation}`, {
              x: 0.75,
              y: recY + 0.08,
              w: (aspectRatio === '4:3' ? 8.8 : 12.13) - 0.3,
              h: 0.56,
              fontSize: 8,
              color: isLight ? '1E3A8A' : 'C7D2FE',
              bold: true
            });
          }

          // Speaker Notes
          const speakerNotesText = [
            `=== CATATAN PEMBICARA (SPEAKING NOTES) - SLIDE ${slideItem.id} ===`,
            slideItem.speakingNotes || `Paparan mengenai ${slideItem.title}.`,
            '',
            '--- MATRIKS AKSI KHUSUS ---',
            ...(slideItem.actionPlanDetails || []).map(a => `[${a.actor}] ${a.action} (${a.timeline})`),
            '',
            'Dasar Regulasi: ' + (slideItem.regulationRef || 'Petunjuk Teknis IKPA DJPb')
          ].join('\n');

          slide.addNotes(speakerNotesText);

          // Footer Bar
          slide.addText('Portal ANGKASA V3.2  •  Seksi MSKI KPPN Semarang I  •  Layanan Bebas Biaya (Rp 0,-)', {
            x: 0.6,
            y: 6.8,
            w: 8.0,
            h: 0.28,
            fontSize: 7.5,
            color: textSubHex
          });
        });

        const fileName = `Paparan_IKPA_${periodScope}_${activeTheme}_${slidesToExport.length}Slide.pptx`;
        await pptx.writeFile({ fileName });
      } 
      else if (format === 'html_deck') {
        // Generate Standalone Interactive HTML Presentation Deck (Offline Ready)
        const htmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Paparan IKPA KPPN Semarang I - ${periodScope} (50 Slide)</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background-color: #030712; color: #f8fafc; }
    .slide { display: none; min-height: 85vh; }
    .slide.active { display: flex; }
  </style>
</head>
<body class="p-4 sm:p-8 flex flex-col items-center justify-center min-h-screen">
  <div class="w-full max-w-6xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl flex flex-col justify-between">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
      <div class="flex items-center gap-3">
        <span class="px-3 py-1 bg-indigo-500/20 text-indigo-300 text-xs font-black rounded-full uppercase">KPPN SEMARANG I (026)</span>
        <span class="text-xs text-slate-400 font-mono">Periode: ${periodScope}</span>
      </div>
      <div class="text-xs text-amber-400 font-bold font-mono" id="slideCounter">Slide 1 / ${slidesToExport.length}</div>
    </div>

    <!-- Slides Container -->
    <div id="slidesWrapper">
      ${slidesToExport.map((s, idx) => `
        <div class="slide flex-col justify-between ${idx === 0 ? 'active' : ''}" data-index="${idx}">
          <div>
            <span class="text-xs text-indigo-400 font-mono font-black uppercase tracking-widest">${s.badge} • ${s.category}</span>
            <h1 class="text-2xl sm:text-3xl font-black mt-1 text-white">${s.title}</h1>
            <p class="text-sm text-sky-400 font-semibold mb-6">${s.subtitle}</p>

            ${s.deepNarrative ? `
              <div class="p-4 rounded-2xl bg-slate-950 border border-slate-800 mb-4 text-xs sm:text-sm text-slate-200 leading-relaxed">
                <strong class="text-amber-400 block mb-1">📖 Telaah Substansi & Analisis:</strong>
                ${s.deepNarrative}
              </div>
            ` : ''}

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
              <div class="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80">
                <strong class="text-amber-400 text-xs uppercase block mb-2">Poin Fakta Kunci:</strong>
                <ul class="space-y-1.5 text-xs text-slate-300">
                  ${s.analysisPoints.map(p => `<li class="flex items-start gap-1.5"><span class="text-indigo-400">•</span><span>${p}</span></li>`).join('')}
                </ul>
              </div>

              <div class="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80">
                <strong class="text-emerald-400 text-xs uppercase block mb-2">Rencana Aksi & Tindak Lanjut:</strong>
                <ul class="space-y-1.5 text-xs text-slate-300">
                  ${(s.actionPlanDetails || []).map(a => `<li class="flex items-start gap-1.5"><span class="text-emerald-400 font-bold">[${a.actor}]</span><span>${a.action} (${a.timeline})</span></li>`).join('')}
                </ul>
              </div>
            </div>

            <div class="p-3.5 rounded-2xl bg-indigo-950/70 border border-indigo-500/40 text-xs text-indigo-200 mt-2">
              <strong class="text-amber-300">Rekomendasi Pimpinan:</strong> ${s.recommendation}
            </div>
          </div>

          <div class="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>Seksi MSKI KPPN Semarang I • Layanan Bebas Biaya (Rp 0,-)</span>
            <span>${s.regulationRef || 'Regulasi DJPb Kemenkeu RI'}</span>
          </div>
        </div>
      `).join('')}
    </div>

    <!-- Navigator Footer -->
    <div class="flex items-center justify-between pt-6 border-t border-slate-800 mt-6">
      <button onclick="prevSlide()" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl cursor-pointer">← Sebelumnya</button>
      <div class="text-xs text-slate-400">Gunakan tombol panah keyboard ← / →</div>
      <button onclick="nextSlide()" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl cursor-pointer">Selanjutnya →</button>
    </div>
  </div>

  <script>
    let currentIdx = 0;
    const slides = document.querySelectorAll('.slide');
    const counter = document.getElementById('slideCounter');
    function showSlide(idx) {
      slides.forEach((s, i) => s.classList.toggle('active', i === idx));
      counter.innerText = 'Slide ' + (idx + 1) + ' / ' + slides.length;
    }
    function prevSlide() { if(currentIdx > 0) { currentIdx--; showSlide(currentIdx); } }
    function nextSlide() { if(currentIdx < slides.length - 1) { currentIdx++; showSlide(currentIdx); } }
    document.addEventListener('keydown', (e) => {
      if(e.key === 'ArrowLeft') prevSlide();
      if(e.key === 'ArrowRight') nextSlide();
    });
  </script>
</body>
</html>`;
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Paparan_Interaktif_IKPA_${periodScope}_50Slide.html`;
        a.click();
        URL.revokeObjectURL(url);
      }
      else if (format === 'word_doc') {
        // Generate Rich Document Text / Markdown / Word-Compatible Naskah Lengkap
        let docText = `# LAPORAN EKSEKUTIF & NASKAH PAPARAN LENGKAP IKPA 50 SLIDE\n`;
        docText += `KPPN Tipe A1 Semarang I (Kode 026) - Periode: ${periodScope}\n`;
        docText += `Direktorat Jenderal Perbendaharaan - Kementerian Keuangan RI\n`;
        docText += `================================================================================\n\n`;

        slidesToExport.forEach(s => {
          docText += `## SLIDE ${s.id}: ${s.title}\n`;
          docText += `Subjudul: ${s.subtitle}\n`;
          docText += `Kategori: ${s.category} | Topik: ${s.badge}\n\n`;
          
          docText += `### 1. KAJIAN STRATEGIS & NARASI MENDALAM\n`;
          docText += `${s.deepNarrative || '-'}\n\n`;

          docText += `### 2. POIN FAKTA EMPIRIS\n`;
          s.analysisPoints.forEach(p => { docText += `* ${p}\n`; });
          docText += `\n`;

          docText += `### 3. DIAGNOSA AKAR MASALAH (ROOT CAUSES)\n`;
          (s.rootCauses || []).forEach(r => {
            docText += `* [${r.category}] ${r.description} (Dampak: ${r.impact || '-'})\n`;
          });
          docText += `\n`;

          docText += `### 4. MATRIKS RENCANA AKSI (ACTION PLAN)\n`;
          (s.actionPlanDetails || []).map(a => {
            docText += `* [${a.priority}] ${a.actor}: ${a.action} -> Target: ${a.timeline}\n`;
          });
          docText += `\n`;

          docText += `### 5. MATRIKS RISIKO & MITIGASI\n`;
          (s.riskMatrix || []).forEach(m => {
            docText += `* [Risiko ${m.level}] ${m.riskItem} -> Mitigasi: ${m.mitigation}\n`;
          });
          docText += `\n`;

          docText += `### 6. REKOMENDASI PIMPINAN\n`;
          docText += `${s.recommendation}\n\n`;

          docText += `### 7. NASKAH PIDATO PIMPINAN (SPEAKING NOTES)\n`;
          docText += `${s.speakingNotes || '-'}\n\n`;

          docText += `Dasar Regulasi: ${s.regulationRef || 'Juknis IKPA DJPb'}\n`;
          docText += `--------------------------------------------------------------------------------\n\n`;
        });

        const blob = new Blob([docText], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Naskah_Lengkap_Paparan_IKPA_${periodScope}_50Slide.doc`;
        a.click();
        URL.revokeObjectURL(url);
      }
      else if (format === 'csv_dataset') {
        // Generate CSV Dataset dari 50 Slide
        let csvContent = 'ID,Kategori,Topik,Judul,Subjudul,Narasi_Mendalam,Rekomendasi,Dasar_Regulasi\n';
        slidesToExport.forEach(s => {
          const row = [
            s.id,
            `"${(s.category || '').replace(/"/g, '""')}"`,
            `"${(s.badge || '').replace(/"/g, '""')}"`,
            `"${(s.title || '').replace(/"/g, '""')}"`,
            `"${(s.subtitle || '').replace(/"/g, '""')}"`,
            `"${(s.deepNarrative || '').replace(/"/g, '""')}"`,
            `"${(s.recommendation || '').replace(/"/g, '""')}"`,
            `"${(s.regulationRef || '').replace(/"/g, '""')}"`
          ];
          csvContent += row.join(',') + '\n';
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Dataset_Slide_IKPA_${periodScope}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
      else if (format === 'json_data') {
        // Generate Raw JSON
        const jsonString = JSON.stringify(slidesToExport, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Struktur_Slide_IKPA_${periodScope}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
      else if (format === 'print_pdf') {
        window.print();
      }
    } catch (err: any) {
      console.error(err);
      alert('Gagal mengekspor: ' + (err?.message || 'Terjadi kesalahan'));
    } finally {
      setIsExporting(false);
      setExportFeedback('');
    }
  };

  // Render Visual Dynamic Charts in Slide Preview
  const renderSlideChart = (cfg: NonNullable<DetailedSlideContent['chartConfig']>) => {
    return (
      <div className="h-full w-full flex flex-col p-3 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-inner">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-black text-sky-400 uppercase tracking-tight flex items-center gap-1.5 truncate">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shrink-0" />
            <span className="truncate">{cfg.title}</span>
          </span>
          {cfg.unit && (
            <span className="text-[9px] font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded shrink-0">
              {cfg.unit}
            </span>
          )}
        </div>

        <div className="flex-1 w-full min-h-[160px]">
          {cfg.type === 'donut' || cfg.type === 'gauge' ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={cfg.data}
                  cx="50%"
                  cy="50%"
                  innerRadius="50%"
                  outerRadius="80%"
                  paddingAngle={3}
                  dataKey="value"
                >
                  {cfg.data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || '#6366F1'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px', color: '#fff' }}
                  formatter={(val: any) => [`${val} ${cfg.unit || ''}`, 'Nilai']}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }}
                  formatter={(value) => <span className="text-slate-300 text-[10px]">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : cfg.type === 'radar' ? (
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={cfg.data}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 9, fill: '#94a3b8' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" tick={{ fontSize: 8, fill: '#64748b' }} />
                <Radar name="Capaian Satker" dataKey="value" stroke="#6366F1" fill="#6366F1" fillOpacity={0.4} />
                <Radar name="Target Nasional" dataKey="target" stroke="#10B981" fill="#10B981" fillOpacity={0.15} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px', color: '#fff' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          ) : cfg.type === 'line' ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cfg.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 9, fill: '#94a3b8' }} />
                <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 9, fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px', color: '#fff' }}
                />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                <Line type="monotone" dataKey="value" name="Realisasi/Capaian" stroke="#10B981" strokeWidth={2.5} dot={{ r: 4, fill: '#10B981' }} />
                <Line type="monotone" dataKey="target" name="Target Ideal" stroke="#F59E0B" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3, fill: '#F59E0B' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cfg.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 9, fill: '#94a3b8' }} />
                <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 9, fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px', color: '#fff' }}
                  formatter={(val: any) => [`${val} ${cfg.unit || ''}`, 'Nilai']}
                />
                <Bar dataKey="value" name="Capaian" radius={[6, 6, 0, 0]}>
                  {cfg.data.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.color || '#6366F1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    );
  };

  // Render Slide Stage Content (Rich Visual & Text Preview)
  const renderSlideStage = (slide: DetailedSlideContent) => {
    return (
      <div className={`h-full flex flex-col justify-between p-4 sm:p-6 ${activeThemeConfig.stageBg} ${activeThemeConfig.textColor} relative overflow-y-auto transition-colors duration-300`}>
        {/* Ambient Backlight */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Slide Header */}
        <div className={`border-b ${activeThemeConfig.border} pb-2.5 flex items-center justify-between relative z-10 shrink-0 gap-2`}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2.5 py-0.5 rounded-full ${activeThemeConfig.badgeBg} border ${activeThemeConfig.badgeBorder} ${activeThemeConfig.badgeText} text-[10px] font-black uppercase`}>
              {slide.category.replace('_', ' ')}
            </span>
            <span className="text-xs text-slate-400 font-mono">Slide {slide.id} / 50</span>
            <span className="hidden sm:inline text-[10px] text-slate-500 font-mono">
              • ~{slideWordCount.words} Kata ({slideWordCount.estMinutes} mnt baca)
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => toggleSlideSelection(slide.id)}
              className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                selectedSlideIds.includes(slide.id)
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {selectedSlideIds.includes(slide.id) ? (
                <>
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Dipilih Ekspor</span>
                </>
              ) : (
                <>
                  <Square className="w-3.5 h-3.5" />
                  <span>Lewati</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Main Slide Body */}
        <div className="my-auto py-2.5 space-y-3 relative z-10">
          
          {/* Slide Titles */}
          <div>
            <div className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-widest mb-0.5">
              <Target className="w-3 h-3 text-amber-400" />
              <span>{slide.badge}</span>
            </div>
            <h2 className="text-base sm:text-lg font-black tracking-tight uppercase leading-snug">
              {slide.title}
            </h2>
            <p className="text-xs text-sky-400 font-semibold mt-0.5">
              {slide.subtitle}
            </p>
          </div>

          {/* Stats Highlight Cards */}
          {slide.statsHighlight && slide.statsHighlight.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {slide.statsHighlight.map((stat, sIdx) => (
                <div key={sIdx} className={`p-2 rounded-xl ${activeThemeConfig.cardBg} border ${activeThemeConfig.border} text-center`}>
                  <span className="text-[9px] text-slate-400 font-bold block uppercase">{stat.label}</span>
                  <span className={`text-lg font-black block mt-0.5 ${
                    stat.color === 'emerald' ? 'text-emerald-400' :
                    stat.color === 'rose' ? 'text-rose-400' :
                    stat.color === 'amber' ? 'text-amber-400' : 'text-sky-400'
                  }`}>
                    {stat.value}
                  </span>
                  {stat.note && <span className="text-[9px] text-slate-400 block mt-0.5">{stat.note}</span>}
                </div>
              ))}
            </div>
          )}

          {/* Sub-Tab Navigation for Deep Slide Content */}
          <div className="flex items-center gap-1 border-b border-slate-800/80 pb-1.5 overflow-x-auto text-[11px] font-bold">
            <button
              onClick={() => setStageSubTab('analysis')}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1 whitespace-nowrap transition-all cursor-pointer ${
                stageSubTab === 'analysis' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Analisis Mendalam &amp; Fakta</span>
            </button>

            <button
              onClick={() => setStageSubTab('root_causes')}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1 whitespace-nowrap transition-all cursor-pointer ${
                stageSubTab === 'root_causes' 
                  ? 'bg-amber-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Akar Masalah (Root Causes)</span>
            </button>

            <button
              onClick={() => setStageSubTab('action_plan')}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1 whitespace-nowrap transition-all cursor-pointer ${
                stageSubTab === 'action_plan' 
                  ? 'bg-emerald-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Matriks Rencana Aksi</span>
            </button>

            <button
              onClick={() => setStageSubTab('risk_matrix')}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1 whitespace-nowrap transition-all cursor-pointer ${
                stageSubTab === 'risk_matrix' 
                  ? 'bg-rose-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Matriks Risiko</span>
            </button>

            <button
              onClick={() => setStageSubTab('speaking_notes')}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1 whitespace-nowrap transition-all cursor-pointer ${
                stageSubTab === 'speaking_notes' 
                  ? 'bg-purple-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Naskah Pidato Pimpinan</span>
            </button>
          </div>

          {/* Sub-Tab 1: Deep Narrative & Analysis Facts */}
          {stageSubTab === 'analysis' && (
            <div className={`grid gap-3 ${slide.chartConfig && densityMode !== 'deep_narrative' ? 'grid-cols-1 md:grid-cols-12' : 'grid-cols-1'}`}>
              <div className={`space-y-2.5 ${slide.chartConfig && densityMode !== 'deep_narrative' ? 'md:col-span-6' : 'w-full'}`}>
                
                {/* Deep Narrative Multi-Paragraph */}
                {slide.deepNarrative && (
                  <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/80 text-xs leading-relaxed space-y-1">
                    <div className="flex items-center justify-between text-amber-400 font-black text-[11px] uppercase">
                      <div className="flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Telaah Substansi &amp; Narasi Komprehensif:</span>
                      </div>
                      <span className="text-[9px] text-slate-400 font-mono">150-300 Kata</span>
                    </div>
                    <p className="text-slate-200 text-[11px] text-justify leading-relaxed">
                      {slide.deepNarrative}
                    </p>
                  </div>
                )}

                {/* Bullet Points */}
                {slide.analysisPoints && slide.analysisPoints.length > 0 && (
                  <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-1 text-xs">
                    <div className="flex items-center gap-1.5 text-amber-400 font-black text-[11px] uppercase">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Kajian Strategis &amp; Fakta Empiris:</span>
                    </div>
                    <ul className="space-y-1 text-slate-200 text-[11px] leading-relaxed">
                      {slide.analysisPoints.map((point, pIdx) => (
                        <li key={pIdx} className="flex items-start gap-1.5">
                          <span className="text-indigo-400 font-bold shrink-0">•</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Chart Canvas */}
              {slide.chartConfig && densityMode !== 'deep_narrative' && (
                <div className="md:col-span-6 h-[210px] flex items-center justify-center">
                  {renderSlideChart(slide.chartConfig)}
                </div>
              )}
            </div>
          )}

          {/* Sub-Tab 2: Root Causes */}
          {stageSubTab === 'root_causes' && (
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/70 space-y-2">
              <div className="flex items-center gap-1.5 text-amber-400 font-black text-xs uppercase">
                <AlertTriangle className="w-4 h-4" />
                <span>Diagnosa Mendalam Akar Masalah (Root Causes):</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                {(slide.rootCauses || []).map((rc, rcIdx) => (
                  <div key={rcIdx} className="p-2.5 rounded-lg bg-slate-900/90 border border-amber-500/30 space-y-1">
                    <span className="text-[10px] font-black text-amber-400 uppercase tracking-tight block">
                      {rc.category}
                    </span>
                    <p className="text-[11px] text-slate-200 leading-snug">
                      {rc.description}
                    </p>
                    {rc.impact && (
                      <span className="text-[10px] text-rose-400 font-semibold block pt-0.5">
                        Dampak: {rc.impact}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sub-Tab 3: Action Plan */}
          {stageSubTab === 'action_plan' && (
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/70 space-y-2">
              <div className="flex items-center gap-1.5 text-emerald-400 font-black text-xs uppercase">
                <Zap className="w-4 h-4" />
                <span>Matriks Rencana Aksi Terstruktur (Action Plan):</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(slide.actionPlanDetails || []).map((act, aIdx) => (
                  <div key={aIdx} className="p-2.5 rounded-lg bg-slate-900/90 border border-emerald-500/30 flex items-start gap-2">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-black shrink-0 ${
                      act.priority === 'TINGGI' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {act.priority}
                    </span>
                    <div className="space-y-0.5 flex-1">
                      <div className="text-[11px] font-black text-emerald-300">
                        {act.actor}
                      </div>
                      <p className="text-[10.5px] text-slate-200 leading-snug">
                        {act.action}
                      </p>
                      <span className="text-[9.5px] font-mono text-slate-400 block">
                        Jadwal: {act.timeline}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sub-Tab 4: Risk Matrix */}
          {stageSubTab === 'risk_matrix' && (
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/70 space-y-2">
              <div className="flex items-center gap-1.5 text-rose-400 font-black text-xs uppercase">
                <ShieldAlert className="w-4 h-4" />
                <span>Matriks Titik Rawan &amp; Mitigasi Risiko Kepatuhan:</span>
              </div>
              <div className="space-y-1.5">
                {(slide.riskMatrix || []).map((rm, rIdx) => (
                  <div key={rIdx} className="p-2 rounded-lg bg-slate-900/90 border border-slate-700/80 flex items-start gap-2 text-xs">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black shrink-0 ${
                      rm.level === 'TINGGI' ? 'bg-rose-600 text-white' : 'bg-amber-600 text-white'
                    }`}>
                      {rm.level}
                    </span>
                    <div className="flex-1">
                      <span className="font-bold text-slate-100 block">{rm.riskItem}</span>
                      <span className="text-slate-300 text-[10.5px] block mt-0.5">
                        <strong className="text-emerald-400">Mitigasi:</strong> {rm.mitigation}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sub-Tab 5: Speaker Notes */}
          {stageSubTab === 'speaking_notes' && (
            <div className="p-3 rounded-xl bg-purple-950/70 border border-purple-500/40 space-y-2 text-xs">
              <div className="flex items-center justify-between text-purple-300 font-black text-xs uppercase">
                <div className="flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-purple-400" />
                  <span>Naskah Pidato &amp; Catatan Pembicara (Speaking Notes):</span>
                </div>
                <span className="text-[10px] text-purple-400 font-mono">Siap Baca di Forum Rapat</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/80 border border-purple-500/20 text-slate-100 text-xs italic leading-relaxed whitespace-pre-line">
                {slide.speakingNotes}
              </div>
            </div>
          )}

          {/* Recommendation Box */}
          {slide.recommendation && (
            <div className="p-2.5 rounded-xl bg-indigo-950/70 border border-indigo-500/40 text-[11px] text-indigo-200 flex items-start gap-2">
              <Award className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-black text-amber-300 mr-1">Rekomendasi Tindakan:</span>
                <span>{slide.recommendation}</span>
              </div>
            </div>
          )}

        </div>

        {/* Bottom Slide Footer */}
        <div className={`border-t ${activeThemeConfig.border} pt-2 flex items-center justify-between text-xs text-slate-400 relative z-10 shrink-0 gap-2`}>
          <div className="flex items-center gap-2 truncate">
            <span className="truncate">KPPN Semarang I (026) • Seksi MSKI</span>
            {slide.regulationRef && (
              <span className="hidden sm:inline text-[10px] text-slate-500 font-mono truncate max-w-xs">
                | {slide.regulationRef}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySlideScript}
              className="text-[11px] text-slate-400 hover:text-white font-bold flex items-center gap-1 cursor-pointer bg-slate-800/80 hover:bg-slate-800 px-2.5 py-1 rounded-lg"
              title="Salin Seluruh Naskah Slide Ini"
            >
              {copiedTextStatus ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedTextStatus ? 'Tersalin!' : 'Salin Naskah'}</span>
            </button>

            <button
              onClick={() => {
                setAiPromptInput(`Perdalam analisis data pada slide ${slide.id}: "${slide.title}" (${slide.subtitle}). Berikan narasi 350 kata yang komprehensif, diagnosa akar masalah SAKTI, dan naskah pidato pimpinan.`);
                setIsAiModalOpen(true);
              }}
              className="text-[11px] text-amber-400 hover:text-amber-300 font-black flex items-center gap-1 cursor-pointer bg-amber-500/20 hover:bg-amber-500/30 px-2.5 py-1 rounded-lg border border-amber-500/40"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Perdalam dengan Gemini AI</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-2 sm:p-3 bg-slate-950/95 backdrop-blur-md animate-in fade-in duration-200">
      <div className={`relative w-full max-w-7xl h-[96vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden ${
        isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        
        {/* Top Navigation & Control Bar */}
        <div className="p-3 sm:p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Presentation className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 bg-indigo-500/20 text-indigo-300 text-[10px] font-black px-2 py-0.5 rounded-full mb-0.5">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>EXECUTIVE 50-SLIDE MULTI-FORMAT STUDIO &amp; GEMINI AI</span>
              </div>
              <h3 className="text-sm sm:text-base font-black tracking-tight text-white flex items-center gap-2">
                <span>Bank Paparan &amp; Analisis Komprehensif</span>
                <span className="text-amber-400 text-xs font-mono font-bold">({periodScope})</span>
              </h3>
            </div>
          </div>

          {/* Period Scope Selector */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            {(['TW1', 'TW2', 'TW3', 'TW4', 'BULANAN', 'TAHUNAN'] as PeriodScope[]).map(scope => (
              <button
                key={scope}
                onClick={() => setPeriodScope(scope)}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                  periodScope === scope 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {scope}
              </button>
            ))}
          </div>

          {/* Export & Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsAiModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-xs font-black shadow-lg shadow-indigo-950/50 flex items-center gap-1.5 cursor-pointer transition-all hover:scale-105 active:scale-95 border border-indigo-400/40"
              title="Buka Asisten Gemini AI untuk Memperkaya Materi Slide"
            >
              <Bot className="w-4 h-4 text-amber-300" />
              <span>Gemini AI Studio</span>
            </button>

            {/* Main Export PPTX */}
            <button
              onClick={() => handleExportCustomFormat('pptx')}
              disabled={isExporting || selectedSlideIds.length === 0}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-white text-xs font-black shadow-lg shadow-amber-950/40 flex items-center gap-1.5 cursor-pointer transition-all hover:scale-105 active:scale-95 disabled:opacity-50 border border-amber-300/40"
              title="Unduh File PowerPoint (.pptx)"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Menyiapkan...' : `Unduh PPTX (${selectedSlideIds.length})`}</span>
            </button>

            {/* Quick Export Dropdown / Format Tools */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => handleExportCustomFormat('html_deck')}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
                title="Unduh HTML Slide Deck Interaktif (Bisa Dibuka Offline Tanpa PowerPoint)"
              >
                <FileCode className="w-4 h-4 text-cyan-400" />
              </button>

              <button
                onClick={() => handleExportCustomFormat('word_doc')}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
                title="Unduh Naskah Lengkap Dokumen (.doc / Markdown)"
              >
                <FileText className="w-4 h-4 text-blue-400" />
              </button>

              <button
                onClick={() => handleExportCustomFormat('csv_dataset')}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
                title="Unduh Tabulasi Data Slide ke CSV / Excel"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              </button>

              <button
                onClick={() => handleExportCustomFormat('print_pdf')}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
                title="Cetak Langsung ke PDF"
              >
                <Printer className="w-4 h-4 text-amber-400" />
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Multi-Format Customizer Bar: Theme, Density Mode & Aspect Ratio */}
        <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          
          {/* 12 Theme Selector */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black uppercase text-slate-400 flex items-center gap-1">
              <Palette className="w-3.5 h-3.5 text-amber-400" />
              <span>12 Tema:</span>
            </span>
            <div className="flex items-center gap-1 overflow-x-auto max-w-md py-0.5">
              {(Object.keys(themeStyles) as PresentationTheme[]).map(tKey => {
                const t = themeStyles[tKey];
                return (
                  <button
                    key={tKey}
                    onClick={() => setActiveTheme(tKey)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                      activeTheme === tKey 
                        ? 'bg-slate-800 text-white border border-slate-600 shadow-sm' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${t.dot}`} />
                    <span>{t.name.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 8 Density Mode Selector (Gaya Analisis & Kerapatan Kata) */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black uppercase text-slate-400 flex items-center gap-1">
              <Layout className="w-3.5 h-3.5 text-indigo-400" />
              <span>Format Analisis:</span>
            </span>
            <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-xl border border-slate-800 overflow-x-auto">
              {[
                { key: 'deep_narrative', label: '📖 Narasi Padat' },
                { key: 'executive_balanced', label: '📊 Paparan Seimbang' },
                { key: 'infographic_grid', label: '📈 Infografis & Chart' },
                { key: 'speaking_notes', label: '🎙️ Naskah Pidato' },
                { key: 'root_cause_focus', label: '🔍 Akar Masalah' },
                { key: 'action_matrix', label: '⚡ Matriks Aksi' }
              ].map(m => (
                <button
                  key={m.key}
                  onClick={() => {
                    setDensityMode(m.key as SlideDensityMode);
                    if (m.key === 'root_cause_focus') setStageSubTab('root_causes');
                    else if (m.key === 'action_matrix') setStageSubTab('action_plan');
                    else if (m.key === 'speaking_notes') setStageSubTab('speaking_notes');
                    else setStageSubTab('analysis');
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                    densityMode === m.key
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* 4 Rasio & Layout Selector */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-slate-400 font-mono font-bold">Rasio:</span>
            {(['16:9', '4:3', '16:10', 'A4_landscape'] as SlideAspectLayout[]).map(ratio => (
              <button
                key={ratio}
                onClick={() => setAspectRatio(ratio)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer transition-all ${
                  aspectRatio === ratio
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {ratio}
              </button>
            ))}
          </div>

        </div>

        {/* Category Filter Bar */}
        <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-2 overflow-x-auto shrink-0 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-black uppercase text-slate-500 flex items-center gap-1">
              <Filter className="w-3 h-3" />
              <span>Topik:</span>
            </span>
            {[
              { key: 'ALL', label: 'Semua (50)' },
              { key: 'PEMBUKA', label: 'Pembuka' },
              { key: 'MAKRO', label: 'Makro' },
              { key: 'INDIKATOR_DETAIL', label: '8 Indikator' },
              { key: 'SATKER_RANKING', label: 'Ranking' },
              { key: 'DIAGNOSA_RISIKO', label: 'Diagnosa & Risiko' },
              { key: 'KEMENTERIAN', label: 'K/L Mitra' },
              { key: 'DIGITALISASI', label: 'Digitalisasi' },
              { key: 'REGULASI_HOT_TOPIC', label: 'Hot Topic' },
              { key: 'REKOMENDASI_AKSI', label: 'Rekomendasi' },
              { key: 'PENUTUP', label: 'Penutup' }
            ].map(cat => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategoryFilter(cat.key as SlideCategory)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategoryFilter === cat.key
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0 text-[11px]">
            <button
              onClick={selectAllSlides}
              className="text-emerald-400 hover:underline font-bold cursor-pointer"
            >
              Pilih Semua (50)
            </button>
            <span className="text-slate-600">•</span>
            <button
              onClick={deselectAllSlides}
              className="text-rose-400 hover:underline font-bold cursor-pointer"
            >
              Kosongkan
            </button>
          </div>
        </div>

        {/* Main Stage & Thumbnails Area */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-950">
          
          {/* Left Thumbnails Strip (Scrollable List of 50 Slides) */}
          <div className="hidden md:flex flex-col w-76 bg-slate-900/90 border-r border-slate-800 p-2 overflow-y-auto space-y-1.5 shrink-0">
            <div className="text-[10px] font-black uppercase text-slate-400 px-2 py-1 flex items-center justify-between">
              <span>Pilih Slide Paparan</span>
              <span className="text-amber-400 font-mono font-bold">
                {selectedSlideIds.length} / 50 Terpilih
              </span>
            </div>

            {displayedSlides.map((slide) => {
              const actualIdx = all50Slides.findIndex(s => s.id === slide.id);
              const isCurrent = currentSlideIndex === actualIdx;
              const isChecked = selectedSlideIds.includes(slide.id);
              const hasCustomAi = !!slideOverrides[slide.id];

              return (
                <div
                  key={slide.id}
                  className={`w-full p-2 rounded-xl border transition-all flex items-center gap-2 ${
                    isCurrent 
                      ? 'bg-indigo-950/80 border-indigo-500 shadow-md scale-102' 
                      : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/80'
                  }`}
                >
                  <button
                    onClick={() => toggleSlideSelection(slide.id)}
                    className="p-1 text-slate-400 hover:text-white cursor-pointer"
                    title={isChecked ? 'Batalkan pilihan' : 'Pilih slide ini untuk diekspor'}
                  >
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-600" />
                    )}
                  </button>

                  <button
                    onClick={() => setCurrentSlideIndex(actualIdx)}
                    className="flex-1 text-left flex items-center gap-2 truncate cursor-pointer"
                  >
                    <span className={`w-5 h-5 rounded-md text-[10px] font-black flex items-center justify-center shrink-0 ${
                      isCurrent ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {slide.id}
                    </span>
                    <div className="truncate flex-1">
                      <span className={`text-[11px] block truncate ${isCurrent ? 'font-black text-white' : 'font-medium text-slate-300'}`}>
                        {slide.title}
                      </span>
                      <div className="flex items-center gap-1 text-[9px] text-slate-500">
                        <span className="truncate">{slide.badge}</span>
                        {hasCustomAi && (
                          <span className="px-1 rounded bg-amber-500/20 text-amber-300 font-bold">AI</span>
                        )}
                      </div>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Center Presentation Stage */}
          <div className="flex-1 flex flex-col items-center justify-center p-2 sm:p-4 overflow-hidden relative">
            <div className={`w-full max-w-5xl ${
              aspectRatio === '4:3' ? 'aspect-[4/3]' : 
              aspectRatio === '16:10' ? 'aspect-[16/10]' : 
              aspectRatio === 'A4_landscape' ? 'aspect-[1.414/1]' : 'aspect-[16/9]'
            } rounded-2xl border ${activeThemeConfig.border} shadow-2xl overflow-hidden relative flex flex-col justify-between`}>
              {renderSlideStage(currentSlide)}
            </div>
          </div>
        </div>

        {/* Bottom Navigator Bar */}
        <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300 shrink-0">
          <div className="flex items-center gap-2 truncate">
            <span className="font-bold text-white">Slide {currentSlide.id} dari 50:</span>
            <span className="text-slate-300 font-medium truncate max-w-xs">{currentSlide.title}</span>
            <span className="hidden sm:inline px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-400 font-mono">
              {currentSlide.badge}
            </span>
          </div>

          {/* Stepper Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentSlideIndex(prev => Math.max(0, prev - 1))}
              disabled={currentSlideIndex === 0}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Sebelumnya</span>
            </button>

            <button
              onClick={() => setCurrentSlideIndex(prev => Math.min(all50Slides.length - 1, prev + 1))}
              disabled={currentSlideIndex === all50Slides.length - 1}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
            >
              <span>Selanjutnya</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* Gemini AI Presentation Studio Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-[180] flex items-center justify-center p-3 bg-slate-950/90 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-3xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-2xl flex flex-col justify-between overflow-hidden text-white">
            
            {/* AI Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
                  <Bot className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black tracking-tight flex items-center gap-2">
                    <span>Gemini AI Presentation Specialist</span>
                    <span className="text-xs text-amber-400 font-mono">(Slide #{currentSlide.id})</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Memperdalam analisis data, naskah pidato pimpinan, dan solusi teknis SAKTI
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsAiModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* AI Body */}
            <div className="my-3 space-y-3 overflow-y-auto flex-1 pr-1">
              
              {/* Presets Grid */}
              <div>
                <span className="text-[10px] font-black uppercase text-slate-400 block mb-1.5">
                  Pilihan Prompt Instan (Quick Presets):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {[
                    { label: '📝 Narasi Mendalam 350+ Kata', prompt: `Buatkan telaah substansi dan narasi analisis mendalam 350 kata mengenai ${currentSlide.title} (${currentSlide.subtitle}) dengan data kuantitatif dan prinsip Value for Money.` },
                    { label: '🎙️ Naskah Pidato Pembuka Rapat KPA', prompt: `Susun naskah pidato resmi kata-demi-kata bagi Kepala KPPN / KPA untuk membawakan slide "${currentSlide.title}" dengan gaya tegas, berwibawa, dan solutif.` },
                    { label: '🔍 Bedah Akar Masalah Teknis SAKTI', prompt: `Analisis titik rawan kendala teknis pada aplikasi SAKTI dan berikan langkah taktis penyelesaiannya untuk topik "${currentSlide.title}".` },
                    { label: '⚡ 3 Key Takeaways & Action Plan', prompt: `Sajikan 3 poin kesimpulan eksekutif kunci serta matriks rencana aksi berjenjang untuk KPA, PPK, dan Bendahara pada topik "${currentSlide.title}".` }
                  ].map((preset, pIdx) => (
                    <button
                      key={pIdx}
                      onClick={() => {
                        setAiPromptInput(preset.prompt);
                        handleRunAiSlideEnhance(preset.prompt);
                      }}
                      className="p-2 rounded-xl bg-slate-800/80 hover:bg-indigo-950/80 border border-slate-700 hover:border-indigo-500 text-left text-xs font-bold text-slate-200 hover:text-white transition-all cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Input */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400">
                  Instruksi Kustom untuk Gemini:
                </label>
                <div className="flex gap-2">
                  <textarea
                    rows={2}
                    value={aiPromptInput}
                    onChange={(e) => setAiPromptInput(e.target.value)}
                    placeholder="Ketik permintaan khusus (contoh: Perdalam narasi khusus aspek kepatuhan pengadaan barang/jasa...)"
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 outline-none resize-none"
                  />
                  <button
                    onClick={() => handleRunAiSlideEnhance()}
                    disabled={isAiGenerating}
                    className="px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-1 text-xs cursor-pointer shadow-md"
                  >
                    {isAiGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span>{isAiGenerating ? 'Proses...' : 'Analisis'}</span>
                  </button>
                </div>
              </div>

              {/* Output Canvas */}
              {aiGeneratedResult && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase text-amber-400 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Hasil Analisis Gemini AI:</span>
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(aiGeneratedResult);
                        alert('Teks hasil AI berhasil disalin!');
                      }}
                      className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 font-bold cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Salin Hasil</span>
                    </button>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-200 leading-relaxed max-h-56 overflow-y-auto whitespace-pre-line font-sans">
                    {aiGeneratedResult}
                  </div>
                </div>
              )}

            </div>

            {/* AI Footer Buttons */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-400">
                Model: <strong className="text-indigo-400">gemini-3.7-flash</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAiModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-bold cursor-pointer"
                >
                  Tutup
                </button>

                {aiGeneratedResult && (
                  <button
                    type="button"
                    onClick={handleApplyAiToCurrentSlide}
                    className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-lg shadow-emerald-950/50 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Terapkan ke Slide #{currentSlide.id}</span>
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
