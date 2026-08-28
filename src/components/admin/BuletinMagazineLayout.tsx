import React, { useState, useMemo } from 'react';
import { 
  Award, 
  TrendingUp, 
  CheckCircle2, 
  BookOpen, 
  UserCheck, 
  Zap, 
  Building2, 
  Calendar, 
  Compass, 
  Quote, 
  Sparkles, 
  MapPin, 
  ShieldCheck, 
  Landmark, 
  FileText,
  HeartHandshake,
  Lightbulb,
  Camera,
  Layers,
  ChevronRight,
  Phone,
  Mail,
  Globe,
  Share2,
  Printer,
  ChevronLeft,
  Image as ImageIcon,
  Edit3,
  SlidersHorizontal,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { BuletinConfig, RealisasiBelanjaSummary, SatkerIKPA } from '../../types';
import { formatRupiahShort, formatRupiahFull } from '../../utils/realisasiBelanjaProcessor';
import { OFFICIAL_PRESET_IMAGES } from '../../data/buletinEditionPresets';
import { generateDeepTreasuryAnalysis } from '../../utils/buletinTreasuryEngine';

interface BuletinMagazineLayoutProps {
  buletinConfig: BuletinConfig;
  overallSummary: RealisasiBelanjaSummary | null;
  satkers?: SatkerIKPA[];
  themeStyles?: {
    primaryBg?: string;
    headerBg?: string;
    accentBorder?: string;
    badgeBg?: string;
    subHeaderBg?: string;
    cardBorder?: string;
    accentText?: string;
  };
  onUpdateBuletinConfig?: (updated: BuletinConfig) => void;
  onEditField?: (fieldKey: string) => void;
}

export const BuletinMagazineLayout: React.FC<BuletinMagazineLayoutProps> = ({
  buletinConfig,
  overallSummary,
  satkers = [],
  onUpdateBuletinConfig,
  onEditField
}) => {
  const [selectedPageView, setSelectedPageView] = useState<number | 'all'>('all');

  const namaBuletin = buletinConfig.namaBuletin || 'WARTA SEMARANG SATU';
  const tagline = buletinConfig.taglineBuletin || 'Kiprah Perbendaharaan & Kinerja APBN Wilayah KPPN Semarang I';
  const currentFormat = buletinConfig.layoutFormat || 'executive_magazine';
  const isHighlightMissing = buletinConfig.highlightMissingData !== false;

  // Deep Treasury Analysis Engine calculation
  const deepAnalysis = useMemo(() => {
    return generateDeepTreasuryAnalysis(overallSummary, satkers, buletinConfig.bulanTahun);
  }, [overallSummary, satkers, buletinConfig.bulanTahun]);

  // Visual Theme Profile definition for each of the 5 layouts
  const formatTheme = useMemo(() => {
    switch (currentFormat) {
      case 'canva_vibrant':
        return {
          containerClass: 'bg-gradient-to-br from-indigo-50/50 via-white to-pink-50/40 text-slate-900',
          pageCardClass: 'bg-white/95 rounded-3xl shadow-xl shadow-indigo-100/70 border border-violet-100 backdrop-blur-sm',
          headerClass: 'bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-500 text-white rounded-2xl shadow-md p-4',
          headerTitleClass: 'font-sans font-black tracking-tight text-white',
          titleColor: 'text-violet-950 font-black font-sans',
          badgeClass: 'bg-gradient-to-r from-amber-300 to-yellow-400 text-slate-950 font-black shadow-xs rounded-full px-3 py-1',
          accentPillClass: 'bg-pink-100 text-pink-700 font-extrabold rounded-full px-3 py-0.5 text-xs',
          tableHeaderClass: 'bg-gradient-to-r from-violet-800 to-fuchsia-800 text-white font-bold',
          cardStyleClass: 'bg-white rounded-3xl border border-violet-100 shadow-md shadow-violet-50 p-5',
          statCardClass: 'p-4 rounded-2xl bg-gradient-to-br from-violet-50 to-pink-50 border border-violet-200 text-center',
          borderColor: 'border-violet-200',
          footerClass: 'bg-violet-900 text-violet-200 rounded-full px-6 py-2 shadow-sm font-bold text-xs',
          coverGradient: 'from-violet-950 via-purple-900 to-fuchsia-950'
        };
      case 'clean_treasury':
        return {
          containerClass: 'bg-[#fcfdfc] text-slate-900',
          pageCardClass: 'bg-white rounded-2xl shadow-sm border border-emerald-200',
          headerClass: 'bg-emerald-900 text-white border-b-4 border-emerald-500 p-4 rounded-xl',
          headerTitleClass: 'font-sans font-extrabold tracking-wide uppercase text-white',
          titleColor: 'text-emerald-950 font-extrabold font-sans',
          badgeClass: 'bg-emerald-500 text-white font-bold tracking-wider rounded-lg px-3 py-1',
          accentPillClass: 'bg-emerald-100 text-emerald-900 font-bold rounded-md px-2.5 py-0.5 text-xs border border-emerald-300',
          tableHeaderClass: 'bg-emerald-950 text-emerald-100 font-bold',
          cardStyleClass: 'bg-emerald-50/30 rounded-xl border border-emerald-200 p-5',
          statCardClass: 'p-4 rounded-xl bg-emerald-50/70 border border-emerald-300 text-center',
          borderColor: 'border-emerald-300',
          footerClass: 'border-t-2 border-emerald-700 text-emerald-900 font-bold text-xs py-2',
          coverGradient: 'from-emerald-950 via-slate-900 to-teal-950'
        };
      case 'royal_indigo':
        return {
          containerClass: 'bg-[#fbf9fe] text-slate-900',
          pageCardClass: 'bg-white rounded-2xl shadow-lg border border-purple-200 ring-1 ring-purple-100',
          headerClass: 'bg-gradient-to-r from-slate-950 via-indigo-950 to-purple-950 text-white border-b-2 border-rose-400 p-4 rounded-xl shadow-md',
          headerTitleClass: 'font-serif font-black tracking-tight italic text-amber-200',
          titleColor: 'text-indigo-950 font-black font-serif italic',
          badgeClass: 'bg-rose-500 text-white font-black tracking-wider rounded-full px-3 py-1 shadow-xs',
          accentPillClass: 'bg-purple-100 text-purple-900 font-black rounded-full px-3 py-0.5 text-xs border border-purple-300',
          tableHeaderClass: 'bg-indigo-950 text-rose-200 font-bold',
          cardStyleClass: 'bg-white rounded-2xl border border-purple-200 shadow-sm p-5 ring-1 ring-purple-50',
          statCardClass: 'p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 text-center',
          borderColor: 'border-purple-300',
          footerClass: 'border-t-2 border-indigo-900 text-indigo-900 font-serif font-bold text-xs py-2',
          coverGradient: 'from-slate-950 via-indigo-950 to-purple-950'
        };
      case 'classic_newsletter':
        return {
          containerClass: 'bg-[#fbf8f1] text-slate-950',
          pageCardClass: 'bg-[#fdfbf7] rounded-none shadow-[4px_4px_0px_rgba(0,0,0,1)] border-2 border-slate-900',
          headerClass: 'bg-[#f4efe4] text-slate-950 border-y-4 border-slate-900 p-4',
          headerTitleClass: 'font-serif font-black tracking-normal uppercase text-slate-950',
          titleColor: 'text-slate-950 font-black font-serif uppercase',
          badgeClass: 'bg-slate-900 text-white font-serif font-bold uppercase tracking-widest px-3 py-1',
          accentPillClass: 'bg-slate-200 text-slate-900 font-mono font-bold px-2 py-0.5 text-xs border border-slate-800',
          tableHeaderClass: 'bg-slate-900 text-white font-serif uppercase font-bold',
          cardStyleClass: 'bg-[#fdfbf7] border-2 border-slate-900 p-5 shadow-[2px_2px_0px_rgba(0,0,0,1)]',
          statCardClass: 'p-4 bg-[#f8f4eb] border-2 border-slate-900 text-center',
          borderColor: 'border-slate-900',
          footerClass: 'border-t-2 border-slate-900 text-slate-900 font-serif font-bold text-xs py-2 text-center tracking-widest',
          coverGradient: 'from-slate-950 via-stone-900 to-slate-900'
        };
      case 'executive_magazine':
      default:
        return {
          containerClass: 'bg-[#fafaf9] text-slate-900',
          pageCardClass: 'bg-white rounded-2xl shadow-md border border-slate-200',
          headerClass: 'bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white border-b-2 border-amber-400/80 p-4 rounded-xl shadow-md',
          headerTitleClass: 'font-serif font-black tracking-tight text-white',
          titleColor: 'text-slate-900 font-black font-serif',
          badgeClass: 'bg-amber-400 text-slate-950 font-black uppercase tracking-wider rounded-lg px-3 py-1 shadow-xs',
          accentPillClass: 'bg-amber-50 text-amber-900 font-bold rounded-lg px-2.5 py-0.5 text-xs border border-amber-200',
          tableHeaderClass: 'bg-slate-950 text-amber-300 font-bold uppercase',
          cardStyleClass: 'bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:border-amber-400/40 transition-all',
          statCardClass: 'p-4 rounded-xl bg-slate-50 border border-slate-200 text-center shadow-2xs',
          borderColor: 'border-slate-300',
          footerClass: 'border-t-2 border-slate-900 text-slate-700 font-serif font-bold text-xs py-2',
          coverGradient: 'from-slate-950 via-slate-900 to-indigo-950'
        };
    }
  }, [currentFormat]);

  // Helper to check if a value is empty or missing
  const isFieldEmpty = (value: string | undefined | null) => {
    if (!value) return true;
    const trimmed = value.trim();
    return trimmed === '' || trimmed === '-' || trimmed.toLowerCase() === 'n/a';
  };

  // Helper to render text with red missing highlight if empty
  const renderTextOrMissing = (
    value: string | undefined | null,
    fieldName: string,
    hintText: string,
    elementClassName: string = "text-slate-700 leading-relaxed text-justify",
    fallbackText?: string,
    asParagraph = true
  ) => {
    const empty = isFieldEmpty(value);
    if (empty) {
      if (isHighlightMissing) {
        return (
          <div 
            onClick={() => onEditField?.(fieldName)}
            className="p-3.5 my-2 rounded-xl border-2 border-dashed border-rose-500 bg-rose-50 text-rose-800 text-xs font-semibold cursor-pointer hover:bg-rose-100 transition-all flex items-center justify-between gap-3 shadow-xs group"
            title={`Klik untuk mengedit ${fieldName}`}
          >
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
              </span>
              <div>
                <div className="font-bold text-rose-900 flex items-center gap-1.5">
                  <span>[⚠️ DATA BELUM DIISI: {fieldName.toUpperCase()}]</span>
                </div>
                <p className="text-[11px] text-rose-700 font-normal italic mt-0.5">{hintText}</p>
              </div>
            </div>
            <span className="text-[11px] font-bold underline text-rose-700 group-hover:text-rose-900 shrink-0 bg-white px-2.5 py-1 rounded-lg border border-rose-200 shadow-2xs">
              ✏️ Isi Sekarang
            </span>
          </div>
        );
      } else if (fallbackText) {
        return asParagraph ? <p className={elementClassName}>{fallbackText}</p> : <span className={elementClassName}>{fallbackText}</span>;
      } else {
        return null;
      }
    }

    return asParagraph ? <p className={elementClassName}>{value}</p> : <span className={elementClassName}>{value}</span>;
  };

  // Helper to render photo with missing highlight and change trigger
  const renderPhotoOrMissing = (
    photoUrl: string | undefined | null,
    photoLabel: string,
    aspectRatioClass: string = "h-56",
    defaultPlaceholderUrl: string = OFFICIAL_PRESET_IMAGES.coverBuletin,
    editTargetKey: string
  ) => {
    const finalUrl = photoUrl && photoUrl.trim().length > 10 ? photoUrl : defaultPlaceholderUrl;
    const isCustom = photoUrl && photoUrl.trim().length > 10;

    return (
      <div className={`relative ${aspectRatioClass} rounded-2xl overflow-hidden shadow-md group border ${formatTheme.borderColor}`}>
        <img 
          src={finalUrl} 
          alt={photoLabel} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {!isCustom && isHighlightMissing && (
          <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-amber-500/90 text-slate-950 font-extrabold text-[10px] flex items-center gap-1 shadow-md">
            <span>📷 Foto Bawaan / Default</span>
          </div>
        )}

        <button
          onClick={() => onEditField?.(editTargetKey)}
          className="absolute bottom-2 right-2 px-3 py-1.5 rounded-lg bg-black/75 backdrop-blur-md text-white text-xs font-bold opacity-90 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 cursor-pointer shadow-lg hover:bg-black"
        >
          <Camera className="w-3.5 h-3.5 text-amber-300" />
          <span>{isCustom ? 'Ganti Foto' : 'Unggah Foto Anda'}</span>
        </button>
      </div>
    );
  };

  // 5 Top K/L list for Page 6 & Page 7
  const klList = useMemo(() => {
    if (overallSummary?.breakdownKementerian && overallSummary.breakdownKementerian.length > 0) {
      return overallSummary.breakdownKementerian.slice(0, 15).map((item, idx) => ({
        no: idx + 1,
        ba: item.kode,
        kl: item.nama,
        pagu: item.pagu,
        realisasi: item.realisasi,
        persen: item.persen
      }));
    }
    return [
      { no: 1, ba: '060', kl: 'KEPOLISIAN NEGARA REPUBLIK INDONESIA', pagu: 1850000000000, realisasi: 1425000000000, persen: 77.03 },
      { no: 2, ba: '025', kl: 'KEMENTERIAN AGAMA', pagu: 820000000000, realisasi: 615000000000, persen: 75.00 },
      { no: 3, ba: '023', kl: 'KEMENDIKBUDRISTEK', pagu: 1450000000000, realisasi: 980000000000, persen: 67.59 },
      { no: 4, ba: '033', kl: 'KEMENTERIAN PEKERJAAN UMUM DAN PERUMAHAN RAKYAT', pagu: 920000000000, realisasi: 590000000000, persen: 64.13 },
      { no: 5, ba: '013', kl: 'KEMENTERIAN HUKUM DAN HAK ASASI MANUSIA', pagu: 340000000000, realisasi: 245000000000, persen: 72.06 },
      { no: 6, ba: '022', kl: 'KEMENTERIAN PERHUBUNGAN', pagu: 280000000000, realisasi: 195000000000, persen: 69.64 },
      { no: 7, ba: '004', kl: 'BADAN PEMERIKSA KEUANGAN (BPK)', pagu: 95000000000, realisasi: 72000000000, persen: 75.79 },
      { no: 8, ba: '015', kl: 'KEMENTERIAN KEUANGAN', pagu: 180000000000, realisasi: 135000000000, persen: 75.00 }
    ];
  }, [overallSummary]);

  const renderPageWrapper = (pageNum: number, title: string, children: React.ReactNode) => {
    if (selectedPageView !== 'all' && selectedPageView !== pageNum) {
      return null;
    }

    return (
      <div 
        key={`page-${pageNum}`}
        id={`buletin-page-${pageNum}`} 
        className={`w-full bg-white rounded-2xl shadow-xl overflow-hidden border ${formatTheme.borderColor} min-h-[1120px] flex flex-col justify-between print:min-h-[1120px] print:shadow-none print:m-0 print:rounded-none page-break-after-always relative transition-all duration-300`}
      >
        {/* Page Top Indicator for screen mode */}
        <div className="bg-slate-900 text-white text-[10px] font-bold px-4 py-1 flex items-center justify-between print:hidden">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span>HALAMAN {pageNum} DARI 20 • {title.toUpperCase()}</span>
          </span>
          <span className="text-amber-300 font-mono">Format: {currentFormat.replace('_', ' ').toUpperCase()}</span>
        </div>

        {/* Page Content */}
        <div className="flex-1 flex flex-col justify-between">
          {children}
        </div>

        {/* Page Footer */}
        {pageNum > 1 && pageNum < 20 && (
          <div className="px-10 py-3 bg-slate-50/90 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500 font-semibold print:bg-transparent">
            <span>{namaBuletin} • {buletinConfig.edisi}</span>
            <span className="font-bold text-slate-700">KPPN Tipe A1 Semarang I</span>
            <span className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-[10px]">
              {pageNum}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`space-y-6 print:space-y-0 ${formatTheme.containerClass} p-4 sm:p-6 rounded-3xl`}>
      
      {/* Control Ribbon Toolbar */}
      <div className="sticky top-20 z-30 p-4 rounded-2xl bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-lg flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wide">
                Pratinjau Majalah Buletin (20 Halaman Lengkap)
              </h3>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${formatTheme.badgeClass}`}>
                {currentFormat.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {namaBuletin} • {buletinConfig.edisi} ({buletinConfig.bulanTahun})
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Missing data highlight toggle */}
          <label className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300 text-xs font-bold cursor-pointer hover:bg-rose-100 transition-colors">
            <input
              type="checkbox"
              checked={isHighlightMissing}
              onChange={(e) => {
                if (onUpdateBuletinConfig) {
                  onUpdateBuletinConfig({ ...buletinConfig, highlightMissingData: e.target.checked });
                }
              }}
              className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
            />
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block animate-pulse" />
              <span>Sorot Data Belum Diisi (Merah)</span>
            </span>
          </label>

          {/* Page Filter Tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedPageView('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedPageView === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Semua (20 Hal)
            </button>

            <select
              value={selectedPageView}
              onChange={(e) => setSelectedPageView(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 cursor-pointer"
            >
              <option value="all">📖 Semua 20 Halaman</option>
              <option value="1">Hal 1: Cover Majalah KPPN Semarang I</option>
              <option value="2">Hal 2: Kata Pengantar Kepala KPPN</option>
              <option value="3">Hal 3: Sekilas Tentang Buletin &amp; Tim Redaksi</option>
              <option value="4">Hal 4: Daftar Isi Majalah</option>
              <option value="5">Hal 5: Realisasi Belanja (Infografis &amp; Analisis)</option>
              <option value="6">Hal 6: Tabel Realisasi Belanja K/L Lengkap</option>
              <option value="7">Hal 7: Realisasi 5 K/L &amp; Jenis Belanja</option>
              <option value="8">Hal 8: Penyaluran Transfer ke Daerah (TKD)</option>
              <option value="9">Hal 9: Guyub Rukun (Wawancara Satker Bag. 1)</option>
              <option value="10">Hal 10: Guyub Rukun (Praktik Baik Bag. 2)</option>
              <option value="11">Hal 11: Sarwa Sarwi (Capacity Building)</option>
              <option value="12">Hal 12: Sarwa Sarwi (Outbound KPPN)</option>
              <option value="13">Hal 13: Sarwa Sarwi (Purna Bakti)</option>
              <option value="14">Hal 14: Sarwa Sarwi (River Tubing)</option>
              <option value="15">Hal 15: Pagelaran Semarang (Karnaval &amp; Seni)</option>
              <option value="16">Hal 16: Pagelaran Semarang (UMKM Kemenkeu Satu)</option>
              <option value="17">Hal 17: Teropong Semarang (Kota Lama)</option>
              <option value="18">Hal 18: Teropong Semarang (Lawang Sewu)</option>
              <option value="19">Hal 19: Zona Integritas &amp; Pantun Antikorupsi</option>
              <option value="20">Hal 20: Back Cover &amp; Info Kontak KPPN</option>
            </select>
          </div>
        </div>
      </div>

      <div id="buletin-magazine-container" className="max-w-4xl mx-auto space-y-12 print:space-y-0 text-slate-900">
        
        {/* ========================================================================= */}
        {/* HALAMAN 1: COVER MAJALAH RESMI KPPN SEMARANG I (Full Color Theme Adaptive) */}
        {/* ========================================================================= */}
        {renderPageWrapper(1, 'Cover Depan', (
          <div className={`flex-1 flex flex-col justify-between p-8 bg-gradient-to-br ${formatTheme.coverGradient} text-white relative overflow-hidden min-h-[1100px]`}>
            {/* Background Image / Pattern */}
            {buletinConfig.fotoCoverUrl ? (
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-35 mix-blend-overlay pointer-events-none"
                style={{ backgroundImage: `url(${buletinConfig.fotoCoverUrl})` }}
              />
            ) : (
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-25 mix-blend-overlay pointer-events-none"
                style={{ backgroundImage: `url(${OFFICIAL_PRESET_IMAGES.coverBuletin})` }}
              />
            )}
            
            {/* Top Brand Banner */}
            <div className="relative z-10 flex items-center justify-between border-b border-white/20 pb-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-400 text-slate-950 flex flex-col items-center justify-center font-black shadow-xl">
                  <span className="text-sm tracking-tighter leading-none">KPPN</span>
                  <span className="text-xs tracking-widest leading-none font-extrabold text-slate-800">026</span>
                </div>
                <div>
                  <div className="text-[11px] tracking-widest uppercase font-bold text-amber-300">
                    KEMENTERIAN KEUANGAN REPUBLIK INDONESIA • DJPb
                  </div>
                  <div className="text-sm sm:text-base font-black tracking-wide">
                    KPPN TIPE A1 SEMARANG I
                  </div>
                  <div className="text-[10px] text-slate-300">
                    Mengawal APBN, Membangun Negeri • InTress Treasury Prime
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className={`inline-block px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${formatTheme.badgeClass}`}>
                  {buletinConfig.edisi}
                </div>
                <div className="text-xs text-slate-300 font-bold mt-1">
                  {buletinConfig.bulanTahun}
                </div>
              </div>
            </div>

            {/* Central Visual & Magazine Masthead */}
            <div className="relative z-10 my-auto py-8 space-y-6 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-amber-300 font-black text-xs tracking-widest uppercase shadow-sm">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>BULETIN RESMI PERBENDAHARAAN</span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white drop-shadow-lg font-serif">
                {namaBuletin}
              </h1>

              <div className="w-24 h-1.5 bg-amber-400 mx-auto rounded-full" />

              <p className="text-sm sm:text-lg text-amber-100/90 font-medium max-w-xl mx-auto italic">
                "{tagline}"
              </p>

              {/* Cover Feature Card */}
              <div className="p-6 rounded-3xl bg-white/10 backdrop-blur-lg border border-white/20 max-w-2xl mx-auto text-left shadow-2xl space-y-3">
                <div className="text-xs uppercase font-bold tracking-wider text-amber-300">Fokus Laporan Utama:</div>
                <h2 className="text-xl sm:text-2xl font-black text-white leading-snug">
                  {buletinConfig.judulUtama}
                </h2>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {buletinConfig.subJudul}
                </p>
              </div>
            </div>

            {/* Bottom Highlights Bar */}
            <div className="relative z-10 grid grid-cols-2 gap-4 pt-6 border-t border-white/20 text-xs">
              <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
                <span className="text-[10px] uppercase font-bold text-amber-300 block">
                  {buletinConfig.coverHighlight1 ? 'HIGHLIGHT 1' : 'RUBRIK SARWA SARWI'}
                </span>
                <span className="font-extrabold text-white text-sm">
                  {buletinConfig.coverHighlight1 || 'CAPACITY BUILDING: SINERGI & KOLABORASI TINGKATKAN PRESTASI'}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
                <span className="text-[10px] uppercase font-bold text-amber-300 block">
                  {buletinConfig.coverHighlight2 ? 'HIGHLIGHT 2' : 'RUBRIK PAGELARAN SEMARANG'}
                </span>
                <span className="font-extrabold text-white text-sm">
                  {buletinConfig.coverHighlight2 || 'FESTIVAL KOTA LAMA & AKSELERASI PRODUK UMKM BINAAN'}
                </span>
              </div>
            </div>
          </div>
        ))}


        {/* ========================================================================= */}
        {/* HALAMAN 2: KATA PENGANTAR KEPALA KPPN SEMARANG I                         */}
        {/* ========================================================================= */}
        {renderPageWrapper(2, 'Kata Pengantar Kepala Kantor', (
          <div className="p-10 space-y-8 flex-1 flex flex-col justify-between">
            <div className="space-y-6">
              <div className={formatTheme.headerClass}>
                <div className="flex items-center justify-between">
                  <h2 className={`text-2xl sm:text-3xl font-black ${formatTheme.headerTitleClass}`}>
                    Kata Pengantar
                  </h2>
                  <span className="text-xs font-bold uppercase tracking-widest text-amber-300">
                    Editorial Kepala KPPN Semarang I
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                <div className="md:col-span-2 space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed text-justify">
                  <p>
                    Dengan memanjatkan puji dan syukur ke hadirat Allah SWT, Tuhan Yang Maha Kuasa, KPPN Tipe A1 Semarang I dengan penuh rasa bangga mempersembahkan buletin <strong>{namaBuletin}</strong> edisi <strong>{buletinConfig.edisi}</strong> kepada seluruh Kuasa Pengguna Anggaran, Pengelola Perbendaharaan Satker mitra, serta seluruh pemangku kepentingan di wilayah Kota Semarang dan sekitarnya.
                  </p>
                  
                  {renderTextOrMissing(
                    buletinConfig.sambutanKepala,
                    'sambutanKepala',
                    'Sambutan resmi Kepala Kantor mengenai pengawalan APBN dan integritas layanan.',
                    'text-slate-700 leading-relaxed text-justify font-medium bg-slate-50/70 p-4 rounded-xl border border-slate-200'
                  )}

                  <p>
                    Di tengah akselerasi modernisasi perbendaharaan melalui ekosistem SAKTI dan digitalisasi pembayaran pemerintah (Digipay Satu &amp; KKP), kami senantiasa menempatkan akuntabilitas, ketepatan waktu penerbitan SP2D, dan mitigasi deviasi Rencana Penarikan Dana (RPD) sebagai prioritas utama.
                  </p>
                  
                  <p>
                    Semoga sajian informasi, ulasan analitis data fiskal, dan dokumentasi praktik baik dalam edisi ini dapat menjadi referensi strategis dan penyemangat bagi kita semua dalam mewujudkan tata kelola keuangan negara yang semakin prima, transparan, dan berintegritas.
                  </p>
                </div>

                {/* Profile Box Kepala KPPN */}
                <div className={formatTheme.cardStyleClass}>
                  <div className="text-center space-y-4">
                    {renderPhotoOrMissing(
                      buletinConfig.fotoKepalaUrl,
                      buletinConfig.namaKepalaKantor,
                      'h-48 w-40 mx-auto',
                      OFFICIAL_PRESET_IMAGES.kepalaKantor,
                      'fotoKepalaUrl'
                    )}

                    <div className="space-y-1">
                      <div className={`inline-block px-3 py-1 rounded-full font-black text-xs uppercase tracking-wider ${formatTheme.badgeClass}`}>
                        {buletinConfig.namaKepalaKantor}
                      </div>
                      <p className="text-[11px] font-bold text-slate-600 uppercase">
                        {buletinConfig.jabatanKepala || 'Kepala KPPN Tipe A1 Semarang I'}
                      </p>
                      <p className="text-[10px] text-slate-400 italic">
                        Kementerian Keuangan Republik Indonesia
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={formatTheme.footerClass}>
              Mengawal APBN • Mendorong Pertumbuhan Ekonomi Kota Semarang
            </div>
          </div>
        ))}


        {/* ========================================================================= */}
        {/* HALAMAN 3: SEKILAS TENTANG BULETIN & TIM REDAKSI                         */}
        {/* ========================================================================= */}
        {renderPageWrapper(3, 'Sekilas Tentang & Redaksi', (
          <div className="p-10 space-y-6 flex-1 flex flex-col justify-between">
            <div className="space-y-6">
              <div className={formatTheme.headerClass}>
                <div className="flex items-center justify-between">
                  <h2 className={`text-2xl font-black ${formatTheme.headerTitleClass}`}>
                    Sekilas Tentang &amp; Tim Redaksi
                  </h2>
                  <span className="text-xs font-bold uppercase text-amber-300">Warta Semarang Satu</span>
                </div>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed text-justify">
                {renderTextOrMissing(
                  buletinConfig.sekilasBuletin,
                  'sekilasBuletin',
                  'Deskripsi profil majalah, tujuan publikasi, dan rubrikasi berkala.',
                  'text-slate-700 leading-relaxed text-justify',
                  `Buletin ${namaBuletin} merupakan media publikasi berkala yang disusun secara mandiri oleh Seksi Manajemen Satker dan Kepatuhan Internal (MSKI) KPPN Tipe A1 Semarang I. Buletin ini diterbitkan sebagai sarana penyebarluasan informasi kinerja perbendaharaan, edukasi regulasi pengelolaan keuangan negara, serta wadah sinergi dan penguatan integritas bersama seluruh Satuan Kerja mitra kerja.`
                )}

                {/* Tajuk Rencana Highlight */}
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-slate-800 space-y-2">
                  <div className="flex items-center gap-2 font-black text-amber-900 text-xs uppercase tracking-wide">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>Catatan Tajuk Rencana Edisi Ini:</span>
                  </div>
                  {renderTextOrMissing(
                    buletinConfig.tajukRencana,
                    'tajukRencana',
                    'Ulasan tajuk rencana edisi ini.',
                    'text-xs text-slate-800 leading-relaxed italic'
                  )}
                </div>

                {/* Tim Redaksi Structured Table */}
                <div className="space-y-3 pt-2">
                  <h3 className={`text-sm font-black uppercase tracking-wider ${formatTheme.titleColor}`}>
                    Susunan Tim Redaksi &amp; Penerbitan
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Pelindung:</span>
                      <span className="font-extrabold text-slate-900">
                        {buletinConfig.redaksiTim?.pelindung || 'Kepala Kanwil DJPb Provinsi Jawa Tengah'}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Penanggung Jawab:</span>
                      <span className="font-extrabold text-slate-900">
                        {buletinConfig.redaksiTim?.penanggungJawab || buletinConfig.namaKepalaKantor}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Pemimpin Redaksi:</span>
                      <span className="font-extrabold text-slate-900">
                        {buletinConfig.redaksiTim?.pemimpinRedaksi || 'Kepala Seksi MSKI KPPN Semarang I'}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Redaktur Pelaksana:</span>
                      <span className="font-extrabold text-slate-900">
                        {buletinConfig.redaksiTim?.redakturPelaksana || 'Kepala Seksi Pencairan Dana & Seksi Bank'}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Tim Liputan &amp; Analis:</span>
                      <span className="font-extrabold text-slate-900">
                        {buletinConfig.redaksiTim?.timLiputan || 'Staf Seksi MSKI & Seksi Verifikasi Akuntansi'}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Desain &amp; Tata Letak:</span>
                      <span className="font-extrabold text-slate-900">
                        {buletinConfig.redaksiTim?.desainTataLetak || 'Tim Media Digital & Publikasi KPPN Semarang I'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}


        {/* ========================================================================= */}
        {/* HALAMAN 4: DAFTAR ISI MAJALAH (Format 20 Halaman Lengkap)                */}
        {/* ========================================================================= */}
        {renderPageWrapper(4, 'Daftar Isi Majalah', (
          <div className="p-10 space-y-6 flex-1 flex flex-col justify-between">
            <div className="space-y-6">
              <div className={formatTheme.headerClass}>
                <div className="flex items-center justify-between">
                  <h2 className={`text-2xl font-black ${formatTheme.headerTitleClass}`}>
                    Daftar Isi Majalah
                  </h2>
                  <span className="text-xs font-bold uppercase text-amber-300">{namaBuletin}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2.5 text-xs">
                
                <div className="flex items-center justify-between py-1.5 border-b border-slate-200">
                  <span className="font-semibold text-slate-700">Cover Depan Majalah</span>
                  <span className="font-mono font-bold text-slate-900">01</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-200">
                  <span className="font-semibold text-slate-700">Kata Pengantar Kepala KPPN</span>
                  <span className="font-mono font-bold text-slate-900">02</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-200">
                  <span className="font-semibold text-slate-700">Sekilas Tentang &amp; Tim Redaksi</span>
                  <span className="font-mono font-bold text-slate-900">03</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-200">
                  <span className="font-semibold text-slate-700">Daftar Isi Majalah</span>
                  <span className="font-mono font-bold text-slate-900">04</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-200">
                  <span className="font-bold text-blue-900">Realisasi Belanja (Infografis &amp; Analisis)</span>
                  <span className="font-mono font-bold text-blue-900">05</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-200">
                  <span className="font-bold text-blue-900">Pagu &amp; Realisasi Belanja K/L Lengkap</span>
                  <span className="font-mono font-bold text-blue-900">06</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-200">
                  <span className="font-bold text-blue-900">Realisasi 5 K/L Terbesar &amp; Jenis Belanja</span>
                  <span className="font-mono font-bold text-blue-900">07</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-200">
                  <span className="font-bold text-blue-900">Penyaluran Transfer Ke Daerah (TKD)</span>
                  <span className="font-mono font-bold text-blue-900">08</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-200">
                  <span className="font-bold text-emerald-900">Guyub Rukun: Wawancara Satker (Bag. 1)</span>
                  <span className="font-mono font-bold text-emerald-900">09</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-200">
                  <span className="font-bold text-emerald-900">Guyub Rukun: Praktik Baik (Bag. 2)</span>
                  <span className="font-mono font-bold text-emerald-900">10</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-200">
                  <span className="font-bold text-purple-900">Sarwa Sarwi: Capacity Building (Bag. 1)</span>
                  <span className="font-mono font-bold text-purple-900">11</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-200">
                  <span className="font-bold text-purple-900">Sarwa Sarwi: Outbound Tim (Bag. 2)</span>
                  <span className="font-mono font-bold text-purple-900">12</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-200">
                  <span className="font-bold text-purple-900">Sarwa Sarwi: Penghormatan Purnabakti</span>
                  <span className="font-mono font-bold text-purple-900">13</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-200">
                  <span className="font-bold text-purple-900">Sarwa Sarwi: River Tubing &amp; Family Day</span>
                  <span className="font-mono font-bold text-purple-900">14</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-200">
                  <span className="font-bold text-amber-900">Pagelaran: Pawai Budaya Kota Semarang</span>
                  <span className="font-mono font-bold text-amber-900">15</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-200">
                  <span className="font-bold text-amber-900">Pagelaran: Pemberdayaan UMKM Binaan</span>
                  <span className="font-mono font-bold text-amber-900">16</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-200">
                  <span className="font-bold text-rose-900">Teropong: Pesona Kawasan Kota Lama</span>
                  <span className="font-mono font-bold text-rose-900">17</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-200">
                  <span className="font-bold text-rose-900">Teropong: Lawang Sewu &amp; Pasar Johar</span>
                  <span className="font-mono font-bold text-rose-900">18</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-200">
                  <span className="font-bold text-slate-900">Zona Integritas &amp; Pantun Antikorupsi</span>
                  <span className="font-mono font-bold text-slate-900">19</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-200">
                  <span className="font-semibold text-slate-700">Back Cover: Info &amp; Kontak KPPN</span>
                  <span className="font-mono font-bold text-slate-900">20</span>
                </div>

              </div>
            </div>
          </div>
        ))}


        {/* ========================================================================= */}
        {/* HALAMAN 5: REALISASI BELANJA (INFOGRAFIS & ANALISIS FISKAL MENDALAM)       */}
        {/* ========================================================================= */}
        {renderPageWrapper(5, 'Realisasi Belanja & Analisis', (
          <div className="p-10 space-y-6 flex-1 flex flex-col justify-between">
            <div className="space-y-6">
              <div className={formatTheme.headerClass}>
                <div className="text-center space-y-1">
                  <h2 className={`text-2xl sm:text-3xl font-black uppercase ${formatTheme.headerTitleClass}`}>
                    REALISASI BELANJA NEGARA
                  </h2>
                  <h3 className="text-sm font-extrabold uppercase text-amber-300 tracking-wider">
                    KPPN TIPE A1 SEMARANG I • {buletinConfig.bulanTahun}
                  </h3>
                </div>
              </div>

              {/* Hero Summary Box */}
              <div className={formatTheme.cardStyleClass}>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed text-justify mb-4">
                  {deepAnalysis.headlineSummary}
                </p>

                <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                  <div className={formatTheme.statCardClass}>
                    <div className="text-[10px] text-slate-500 font-bold uppercase">TOTAL PAGU KELOLAAN</div>
                    <div className="text-xl font-black text-amber-600">
                      {overallSummary ? formatRupiahShort(overallSummary.totalPagu) : 'Rp 6,85 T'}
                    </div>
                  </div>
                  <div className={formatTheme.statCardClass}>
                    <div className="text-[10px] text-slate-500 font-bold uppercase">TOTAL REALISASI BELANJA</div>
                    <div className="text-xl font-black text-emerald-600">
                      {overallSummary ? formatRupiahShort(overallSummary.totalRealisasi) : 'Rp 4,92 T'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Per Jenis Belanja Breakdown */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className={`text-xs font-black uppercase tracking-wider ${formatTheme.titleColor}`}>
                    Rincian Penyerapan 4 Jenis Belanja APBN
                  </h4>
                  <span className="text-[10px] text-slate-400 font-bold">Akun 51, 52, 53, &amp; 57</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {overallSummary?.breakdownJenisBelanja.map(item => (
                    <div key={item.kode} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/80 text-center space-y-1.5 shadow-2xs">
                      <div className="font-extrabold text-[11px] text-slate-800 uppercase">{item.nama}</div>
                      <div className="text-base font-black" style={{ color: item.color }}>
                        {formatRupiahShort(item.realisasi)}
                      </div>
                      <div className="text-[10px] text-slate-500 font-bold">
                        Capaian: {item.persen.toFixed(1)}%
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${Math.min(100, item.persen)}%`, backgroundColor: item.color }} />
                      </div>
                    </div>
                  )) || (
                    <>
                      <div className="p-3 rounded-xl bg-slate-50 text-center">
                        <span className="text-[10px] font-bold text-slate-500">Pegawai (51)</span>
                        <div className="text-sm font-black text-blue-600">Rp 2,15 T (78.4%)</div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 text-center">
                        <span className="text-[10px] font-bold text-slate-500">Barang (52)</span>
                        <div className="text-sm font-black text-amber-600">Rp 1,65 T (68.2%)</div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 text-center">
                        <span className="text-[10px] font-bold text-slate-500">Modal (53)</span>
                        <div className="text-sm font-black text-emerald-600">Rp 890 M (61.5%)</div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 text-center">
                        <span className="text-[10px] font-bold text-slate-500">Bansos (57)</span>
                        <div className="text-sm font-black text-purple-600">Rp 230 M (82.1%)</div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Deep Fiscal Analysis Paragraphs */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-700 leading-relaxed text-justify">
                <p>{deepAnalysis.analisisBppParagraphs[0]}</p>
                <p>{deepAnalysis.analisisBppParagraphs[1]}</p>
              </div>
            </div>
          </div>
        ))}


        {/* ========================================================================= */}
        {/* HALAMAN 6: TABEL PAGU & REALISASI K/L LINGKUP KPPN SEMARANG I             */}
        {/* ========================================================================= */}
        {renderPageWrapper(6, 'Tabel Realisasi Belanja K/L', (
          <div className="p-8 space-y-4 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2">
                <div>
                  <h2 className="text-xl font-black text-slate-900 font-serif uppercase">
                    Pagu dan Realisasi Belanja K/L Lingkup KPPN
                  </h2>
                  <p className="text-[10px] text-slate-500">
                    Sumber Data: Rekapitulasi Realisasi Belanja OM-SPAN per {buletinConfig.bulanTahun}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase ${formatTheme.badgeClass}`}>
                  KPPN SEMARANG I
                </span>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-xs">
                <table className="w-full text-[10px] text-left border-collapse">
                  <thead className={formatTheme.tableHeaderClass}>
                    <tr>
                      <th className="py-2 px-2 text-center w-8">NO</th>
                      <th className="py-2 px-2 text-center w-12">BA</th>
                      <th className="py-2 px-3">KEMENTERIAN / LEMBAGA (K/L)</th>
                      <th className="py-2 px-3 text-right">PAGU</th>
                      <th className="py-2 px-3 text-right">REALISASI</th>
                      <th className="py-2 px-2 text-center w-14">%</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {klList.map((row, idx) => (
                      <tr key={row.ba} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                        <td className="py-1.5 px-2 text-center font-bold text-slate-500">{row.no}</td>
                        <td className="py-1.5 px-2 text-center font-mono font-bold text-slate-700">{row.ba}</td>
                        <td className="py-1.5 px-3 font-semibold text-slate-900 truncate max-w-xs">{row.kl}</td>
                        <td className="py-1.5 px-3 text-right font-mono text-slate-700">{formatRupiahShort(row.pagu)}</td>
                        <td className="py-1.5 px-3 text-right font-mono font-bold text-emerald-700">{formatRupiahShort(row.realisasi)}</td>
                        <td className="py-1.5 px-2 text-center font-bold">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] ${row.persen >= 65 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                            {row.persen.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Table Analysis Note */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed text-justify">
                <p>
                  <strong>Catatan Analisis K/L:</strong> {deepAnalysis.topPerformersAnalysis} {deepAnalysis.bottomPerformersMitigation}
                </p>
              </div>
            </div>
          </div>
        ))}


        {/* ========================================================================= */}
        {/* HALAMAN 7: REALISASI 5 K/L TERBESAR & GRAFIK JENIS BELANJA               */}
        {/* ========================================================================= */}
        {renderPageWrapper(7, 'Grafik Realisasi 5 K/L Terbesar', (
          <div className="p-10 space-y-6 flex-1 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="border-b-2 border-slate-900 pb-3">
                <h2 className="text-xl font-black text-slate-900 font-serif uppercase">
                  Realisasi Belanja 5 K/L Terbesar TA 2026 Lingkup KPPN Semarang I
                </h2>
              </div>

              {/* Bar Chart Representation */}
              <div className="space-y-3.5 p-5 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-end gap-4 text-[11px] font-bold">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-amber-500" />
                    <span>Pagu Anggaran</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-blue-600" />
                    <span>Realisasi</span>
                  </div>
                </div>

                {klList.slice(0, 5).map(item => (
                  <div key={item.ba} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-800">
                      <span className="truncate max-w-sm">{item.kl}</span>
                      <span className="text-blue-700 font-black">{item.persen.toFixed(2)}% ({formatRupiahShort(item.realisasi)})</span>
                    </div>
                    <div className="grid grid-cols-1 gap-1">
                      <div className="w-full bg-slate-200 h-3 rounded-md overflow-hidden flex">
                        <div className="bg-amber-500 h-full" style={{ width: '100%' }} title={`Pagu: ${formatRupiahShort(item.pagu)}`} />
                      </div>
                      <div className="w-full bg-slate-200 h-3 rounded-md overflow-hidden flex">
                        <div className="bg-blue-600 h-full" style={{ width: `${Math.min(100, item.persen)}%` }} title={`Realisasi: ${formatRupiahShort(item.realisasi)}`} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagu vs Realisasi Per Jenis Belanja */}
              <div className="space-y-3 pt-2">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                  Rincian Penyerapan &amp; Analisis Per Jenis Belanja
                </h3>

                <div className="space-y-2 text-xs text-slate-700 leading-relaxed text-justify">
                  <p>{deepAnalysis.analisisJenisBelanja.belanjaPegawai}</p>
                  <p>{deepAnalysis.analisisJenisBelanja.belanjaBarang}</p>
                  <p>{deepAnalysis.analisisJenisBelanja.belanjaModal}</p>
                  <p>{deepAnalysis.analisisJenisBelanja.belanjaBansos}</p>
                </div>
              </div>
            </div>
          </div>
        ))}


        {/* ========================================================================= */}
        {/* HALAMAN 8: PENYALURAN TRANSFER KE DAERAH (TKD)                            */}
        {/* ========================================================================= */}
        {renderPageWrapper(8, 'Penyaluran Transfer Ke Daerah', (
          <div className="p-10 space-y-6 flex-1 flex flex-col justify-between">
            <div className="space-y-6">
              <div className={formatTheme.headerClass}>
                <div className="text-center space-y-1">
                  <h2 className={`text-2xl font-black uppercase ${formatTheme.headerTitleClass}`}>
                    TRANSFER KE DAERAH (TKD)
                  </h2>
                  <h3 className="text-xs font-extrabold text-amber-300 uppercase">
                    KPPN TIPE A1 SEMARANG I • KOTA SEMARANG
                  </h3>
                </div>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed text-justify">
                {buletinConfig.tkdData?.catatanTkd || deepAnalysis.analisisTkdParagraphs[0]}
              </p>

              {/* 6 Grid TKD Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 text-xs">
                
                <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 space-y-1.5 text-center">
                  <div className="w-full py-1 rounded bg-blue-600 text-white font-black text-[11px] uppercase">
                    DBH
                  </div>
                  <div className="text-sm font-black text-blue-950">
                    {buletinConfig.tkdData?.dbh ? formatRupiahShort(buletinConfig.tkdData.dbh) : 'Rp 182,45 M'}
                  </div>
                  <p className="text-[10px] text-slate-600 text-left leading-relaxed">
                    Dana Bagi Hasil dialokasikan berdasarkan potensi pajak dan SDA untuk mengurangi ketimpangan fiskal daerah.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 space-y-1.5 text-center">
                  <div className="w-full py-1 rounded bg-blue-600 text-white font-black text-[11px] uppercase">
                    DAU
                  </div>
                  <div className="text-sm font-black text-blue-950">
                    {buletinConfig.tkdData?.dau ? formatRupiahShort(buletinConfig.tkdData.dau) : 'Rp 1,482 T'}
                  </div>
                  <p className="text-[10px] text-slate-600 text-left leading-relaxed">
                    Dana Alokasi Umum untuk pemerataan kemampuan keuangan dan penggajian formasi PPPK daerah.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 space-y-1.5 text-center">
                  <div className="w-full py-1 rounded bg-blue-600 text-white font-black text-[11px] uppercase">
                    DAK FISIK
                  </div>
                  <div className="text-sm font-black text-blue-950">
                    {buletinConfig.tkdData?.dakFisik ? formatRupiahShort(buletinConfig.tkdData.dakFisik) : 'Rp 45,80 M'}
                  </div>
                  <p className="text-[10px] text-slate-600 text-left leading-relaxed">
                    Membantu mendanai kegiatan fisik prioritas nasional di bidang jalan, sanitasi, dan sarana kesehatan.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 space-y-1.5 text-center">
                  <div className="w-full py-1 rounded bg-blue-600 text-white font-black text-[11px] uppercase">
                    DAK NON-FISIK
                  </div>
                  <div className="text-sm font-black text-blue-950">
                    {buletinConfig.tkdData?.dakNonFisik ? formatRupiahShort(buletinConfig.tkdData.dakNonFisik) : 'Rp 512,18 M'}
                  </div>
                  <p className="text-[10px] text-slate-600 text-left leading-relaxed">
                    Digunakan untuk Bantuan Operasional Sekolah (BOS) dan tunjangan profesi guru ASN daerah.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 space-y-1.5 text-center">
                  <div className="w-full py-1 rounded bg-blue-600 text-white font-black text-[11px] uppercase">
                    INSENTIF FISKAL
                  </div>
                  <div className="text-sm font-black text-blue-950">
                    {buletinConfig.tkdData?.insentifFiskal ? formatRupiahShort(buletinConfig.tkdData.insentifFiskal) : 'Rp 38,20 M'}
                  </div>
                  <p className="text-[10px] text-slate-600 text-left leading-relaxed">
                    Diberikan atas capaian kinerja tata kelola keuangan dan pengendalian inflasi daerah.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 space-y-1.5 text-center">
                  <div className="w-full py-1 rounded bg-blue-600 text-white font-black text-[11px] uppercase">
                    DANA KELURAHAN
                  </div>
                  <div className="text-sm font-black text-blue-950">
                    {buletinConfig.tkdData?.danaKelurahan ? formatRupiahShort(buletinConfig.tkdData.danaKelurahan) : 'Rp 86,50 M'}
                  </div>
                  <p className="text-[10px] text-slate-600 text-left leading-relaxed">
                    Mendukung pemberdayaan masyarakat dan sarana prasarana lingkungan kelurahan di Kota Semarang.
                  </p>
                </div>

              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed text-justify">
                <p>{deepAnalysis.analisisTkdParagraphs[1]}</p>
              </div>
            </div>
          </div>
        ))}


        {/* ========================================================================= */}
        {/* HALAMAN 9: GUYUB RUKUN - WAWANCARA SATKER (Bagian 1)                      */}
        {/* ========================================================================= */}
        {renderPageWrapper(9, 'Guyub Rukun (Wawancara Satker 1)', (
          <div className="p-10 space-y-6 flex-1 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b-2 border-slate-900 pb-3">
                <span className="px-3 py-1 rounded-md bg-emerald-600 text-white font-black text-xs uppercase">
                  GUYUB RUKUN
                </span>
                <h2 className="text-2xl font-black text-slate-900 font-serif">
                  WAWANCARA SATKER MITRA
                </h2>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                <h3 className="text-sm font-black text-emerald-950 italic">
                  "{buletinConfig.wawancaraSatker?.judul || 'Pentingnya Disiplin RPD dan Transparansi Anggaran bagi Satuan Kerja'}"
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs sm:text-sm text-slate-700 leading-relaxed text-justify">
                <div className="md:col-span-1 p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-3">
                  {renderPhotoOrMissing(
                    buletinConfig.wawancaraSatker?.fotoNarasumberUrl,
                    buletinConfig.wawancaraSatker?.narasumber || 'Narasumber Satker',
                    'h-36 w-32 mx-auto',
                    OFFICIAL_PRESET_IMAGES.narasumberSatker,
                    'wawancara.fotoNarasumberUrl'
                  )}
                  <div>
                    <div className="font-black text-slate-900 text-xs">
                      {buletinConfig.wawancaraSatker?.narasumber || 'Budi Santoso, S.E.'}
                    </div>
                    <div className="text-[10px] text-slate-500 font-bold">
                      {buletinConfig.wawancaraSatker?.jabatan || 'PPK / Pengelola Keuangan'}
                    </div>
                    <div className="text-[9px] text-emerald-700 font-black">
                      {buletinConfig.wawancaraSatker?.satker || 'Satuan Kerja Mitra KPPN Semarang I'}
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 space-y-3">
                  <p>
                    Dalam rubrik <strong>Guyub Rukun</strong> edisi kali ini, Tim Redaksi KPPN Semarang I berkesempatan mewawancarai <strong>{buletinConfig.wawancaraSatker?.narasumber || 'Pengelola Keuangan'}</strong> selaku pengelola anggaran dari <strong>{buletinConfig.wawancaraSatker?.satker || 'Satuan Kerja'}</strong>.
                  </p>
                  
                  {renderTextOrMissing(
                    buletinConfig.wawancaraSatker?.isiWawancara,
                    'wawancara.isiWawancara',
                    'Uraian jawaban narasumber satker mengenai strategi pengelolaan anggaran.',
                    'text-slate-700 leading-relaxed text-justify'
                  )}

                  <div className="p-3.5 rounded-xl bg-white border border-emerald-200 italic text-emerald-900 font-medium">
                    <Quote className="w-4 h-4 text-emerald-500 inline mr-1" />
                    "{buletinConfig.wawancaraSatker?.kutipanPenting || 'Koordinasi aktif dengan Helpdesk KPPN Semarang I membuat seluruh kendala teknis SP2D dan SAKTI terselesaikan dalam hitungan jam.'}"
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}


        {/* ========================================================================= */}
        {/* HALAMAN 10: GUYUB RUKUN - PRAKTIK BAIK & DOKUMENTASI (Bagian 2)           */}
        {/* ========================================================================= */}
        {renderPageWrapper(10, 'Guyub Rukun (Praktik Baik 2)', (
          <div className="p-10 space-y-6 flex-1 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="border-b-2 border-slate-900 pb-3 flex items-center justify-between">
                <span className="text-xs font-black uppercase text-emerald-700 tracking-wider">
                  GUYUB RUKUN • PRAKTIK BAIK PENGELOLAAN KEUANGAN
                </span>
                <span className="text-[10px] text-slate-400 font-bold">KPPN SEMARANG I</span>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed text-justify">
                {renderTextOrMissing(
                  buletinConfig.wawancaraSatker?.isiWawancara2,
                  'wawancara.isiWawancara2',
                  'Kelanjutan wawancara mengenai digitalisasi, CMS, KKP, dan implementasi SAKTI.',
                  'text-slate-700 leading-relaxed text-justify',
                  'Dalam pemanfaatan alokasi belanja operasional dan pemeliharaan, satker senantiasa menerapkan Indikator Kinerja Utama (IKU) sebagai tolok ukur efektivitas setiap rupiah anggaran negara. Penerapan Cash Management System (CMS) dan Kartu Kredit Pemerintah (KKP) juga terus dioptimalkan.'
                )}

                <div className="my-4">
                  {renderPhotoOrMissing(
                    buletinConfig.wawancaraSatker?.fotoKegiatanSatkerUrl,
                    'Dokumentasi Kegiatan Satker',
                    'h-52 w-full',
                    OFFICIAL_PRESET_IMAGES.kegiatanSatker,
                    'wawancara.fotoKegiatanSatkerUrl'
                  )}
                </div>

                {renderTextOrMissing(
                  buletinConfig.wawancaraSatker?.prestasiSatker,
                  'wawancara.prestasiSatker',
                  'Prestasi atau penghargaan yang diraih satker.',
                  'p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium',
                  'Sinergi yang terbangun antara Satker dan KPPN Semarang I melalui asistensi intensif pada masa rekonsiliasi bulanan terbukti mampu mempertahankan predikat IKPA Sangat Baik dengan nilai di atas 95.00 secara konsisten.'
                )}
              </div>
            </div>
          </div>
        ))}


        {/* ========================================================================= */}
        {/* HALAMAN 11: SARWA SARWI KPPN - CAPACITY BUILDING (Bagian 1)                */}
        {/* ========================================================================= */}
        {renderPageWrapper(11, 'Sarwa Sarwi (Capacity Building 1)', (
          <div className="p-10 space-y-6 flex-1 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
                <span className="px-3 py-1 rounded-md bg-purple-700 text-white font-black text-xs uppercase">
                  SARWA SARWI KPPN
                </span>
                <span className="text-xs font-bold text-slate-500">Kiprah Internal Insan Perbendaharaan</span>
              </div>

              <div className="text-center space-y-1">
                <h3 className="text-xl font-black text-slate-900 font-serif">
                  "{buletinConfig.sarwaSarwi?.judul || 'Sinergi dan Kolaborasi Tingkatkan Prestasi'}"
                </h3>
                <p className="text-xs font-bold text-purple-700 uppercase">
                  {buletinConfig.sarwaSarwi?.temaKegiatan || 'Capacity Building & Outbound Insan KPPN Semarang I'}
                </p>
              </div>

              {renderPhotoOrMissing(
                buletinConfig.sarwaSarwi?.fotoCapacityBuilding1Url,
                'Capacity Building Utama',
                'h-60 w-full',
                OFFICIAL_PRESET_IMAGES.capacityBuilding1,
                'sarwaSarwi.fotoCapacityBuilding1Url'
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700 leading-relaxed text-justify">
                {renderTextOrMissing(
                  buletinConfig.sarwaSarwi?.ceritaBagian1,
                  'sarwaSarwi.ceritaBagian1',
                  'Cerita pembuka mengenai pelaksanaan Capacity Building internal.',
                  'text-slate-700 leading-relaxed text-justify',
                  'Capacity Building diselenggarakan sebagai wujud nyata penguatan sinergi internal serta penyegaran semangat kerja insan KPPN Tipe A1 Semarang I. Kegiatan diselenggarakan di kawasan sejuk Bandungan, Kabupaten Semarang.'
                )}
                {renderTextOrMissing(
                  buletinConfig.sarwaSarwi?.ceritaBagian2,
                  'sarwaSarwi.ceritaBagian2',
                  'Cerita antusiasme peserta dan dinamika kebersamaan tim.',
                  'text-slate-700 leading-relaxed text-justify',
                  'Seluruh pegawai tanpa terkecuali, mulai dari Kepala Kantor, para Kepala Seksi, Pejabat Fungsional, Pelaksana, hingga PPNPN turut ambil bagian dengan penuh antusias dan kegembiraan.'
                )}
              </div>
            </div>
          </div>
        ))}


        {/* ========================================================================= */}
        {/* HALAMAN 12: SARWA SARWI KPPN - OUTBOUND & TEAM BUILDING (Bagian 2)        */}
        {/* ========================================================================= */}
        {renderPageWrapper(12, 'Sarwa Sarwi (Outbound KPPN 2)', (
          <div className="p-10 space-y-6 flex-1 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="border-b-2 border-slate-900 pb-3 flex items-center justify-between">
                <span className="text-xs font-black uppercase text-purple-700">SARWA SARWI • OUTBOUND &amp; KEKOMPAKAN</span>
                <span className="text-[10px] text-slate-400 font-bold">KPPN SEMARANG I</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="space-y-3 text-xs text-slate-700 leading-relaxed text-justify">
                  <p>
                    Sesampainya di lokasi kegiatan, peserta disambut dengan yel-yel penyemangat dan senam pemanasan yang mengundang tawa. Beragam permainan tim (*team building games*) dirancang khusus untuk melatih konsentrasi, komunikasi efektif, dan kecepatan pengambilan keputusan bersama.
                  </p>
                  <p>
                    Tantangan demi tantangan dilalui dengan kompak, menunjukkan bahwa koordinasi kerja yang solid di kantor berakar dari rasa saling percaya dan kebersamaan di lapangan.
                  </p>
                </div>

                <div>
                  {renderPhotoOrMissing(
                    buletinConfig.sarwaSarwi?.fotoCapacityBuilding2Url,
                    'Outbound Games',
                    'h-56 w-full',
                    OFFICIAL_PRESET_IMAGES.capacityBuilding2,
                    'sarwaSarwi.fotoCapacityBuilding2Url'
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}


        {/* ========================================================================= */}
        {/* HALAMAN 13: SARWA SARWI KPPN - PELEPASAN PURNA BAKTI (Bagian 3)           */}
        {/* ========================================================================= */}
        {renderPageWrapper(13, 'Sarwa Sarwi (Purna Bakti 3)', (
          <div className="p-10 space-y-6 flex-1 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="border-b-2 border-slate-900 pb-3 flex items-center justify-between">
                <span className="text-xs font-black uppercase text-purple-700">SARWA SARWI • PENGHORMATAN PURNA BAKTI</span>
                <span className="text-[10px] text-slate-400 font-bold">KPPN SEMARANG I</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div>
                  {renderPhotoOrMissing(
                    buletinConfig.sarwaSarwi?.fotoPurnabaktiUrl,
                    'Purna Bakti Pegawai',
                    'h-60 w-full',
                    OFFICIAL_PRESET_IMAGES.purnabakti,
                    'sarwaSarwi.fotoPurnabaktiUrl'
                  )}
                </div>

                <div className="space-y-3 text-xs text-slate-700 leading-relaxed text-justify">
                  {renderTextOrMissing(
                    buletinConfig.sarwaSarwi?.ceritaBagian3Purnabakti,
                    'sarwaSarwi.ceritaBagian3Purnabakti',
                    'Liputan pelepasan pegawai purnabakti dan apresiasi pengabdian.',
                    'text-slate-700 leading-relaxed text-justify',
                    'Memasuki siang hari, suasana penuh kehangatan menyelimuti aula saat dilangsungkannya acara pelepasan pegawai purnabakti yang telah mendedikasikan tenaga dan pikirannya selama puluhan tahun bagi Kementerian Keuangan.'
                  )}
                  <p>
                    Penyerahan cinderamata dan pemutaran video kenangan menjadi momentum haru yang mengingatkan seluruh insan perbendaharaan akan arti dedikasi, loyalitas, dan kebersamaan sejati.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}


        {/* ========================================================================= */}
        {/* HALAMAN 14: SARWA SARWI KPPN - RIVER TUBING & PENUTUP (Bagian 4)          */}
        {/* ========================================================================= */}
        {renderPageWrapper(14, 'Sarwa Sarwi (River Tubing 4)', (
          <div className="p-10 space-y-6 flex-1 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="border-b-2 border-slate-900 pb-3 flex items-center justify-between">
                <span className="text-xs font-black uppercase text-purple-700">SARWA SARWI • RIVER TUBING &amp; PENUTUP</span>
                <span className="text-[10px] text-slate-400 font-bold">KPPN SEMARANG I</span>
              </div>

              {renderPhotoOrMissing(
                buletinConfig.sarwaSarwi?.fotoRiverTubingUrl,
                'River Tubing Bersama',
                'h-56 w-full',
                OFFICIAL_PRESET_IMAGES.riverTubing,
                'sarwaSarwi.fotoRiverTubingUrl'
              )}

              <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 space-y-2 text-xs text-purple-950 leading-relaxed">
                <div className="font-black uppercase flex items-center gap-1.5">
                  <Quote className="w-4 h-4 text-purple-600" />
                  <span>Pesan Kepala KPPN Semarang I:</span>
                </div>
                {renderTextOrMissing(
                  buletinConfig.sarwaSarwi?.pesanKepala,
                  'sarwaSarwi.pesanKepala',
                  'Pesan motivasi Kepala Kantor bagi seluruh pegawai.',
                  'italic font-medium text-purple-950',
                  'Semoga rasa kebersamaan, kekompakan, dan energi positif yang terbangun selama Capacity Building ini terus menyala dalam pelaksanaan tugas sehari-hari demi memberikan pelayanan prima tanpa celah bagi seluruh mitra kerja KPPN Semarang I.'
                )}
              </div>
            </div>
          </div>
        ))}


        {/* ========================================================================= */}
        {/* HALAMAN 15: PAGELARAN SEMARANG - FESTIVAL & BUDAYA (Bagian 1)             */}
        {/* ========================================================================= */}
        {renderPageWrapper(15, 'Pagelaran Semarang (Pawai Budaya)', (
          <div className="p-10 space-y-6 flex-1 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b-2 border-slate-900 pb-3">
                <span className="px-3 py-1 rounded-md bg-amber-600 text-white font-black text-xs uppercase">
                  PAGELARAN SEMARANG
                </span>
                <h2 className="text-2xl font-black text-slate-900 font-serif">
                  {buletinConfig.pagelaranSemarang?.judulEvent || 'SEMARANG NIGHT CARNIVAL & FESTIVAL BUDAYA'}
                </h2>
              </div>

              {renderPhotoOrMissing(
                buletinConfig.pagelaranSemarang?.fotoEvent1Url,
                'Pawai Budaya Semarang',
                'h-60 w-full',
                OFFICIAL_PRESET_IMAGES.pagelaranBudaya,
                'pagelaran.fotoEvent1Url'
              )}

              <div className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed text-justify">
                {renderTextOrMissing(
                  buletinConfig.pagelaranSemarang?.deskripsiEvent,
                  'pagelaran.deskripsiEvent',
                  'Ulasan festival budaya lokal, pawai seni, dan antusiasme masyarakat Kota Semarang.',
                  'text-slate-700 leading-relaxed text-justify',
                  'Kemeriahan parade budaya Kota Semarang menampilkan ragam pesona kriya dan busana adiluhung yang memadukan akulturasi budaya Jawa, Tionghoa, Arab, dan Kolonial. Ribuan masyarakat tumpah ruah menyaksikan pawai yang menggerakkan perputaran ekonomi kreatif lokal.'
                )}
              </div>
            </div>
          </div>
        ))}


        {/* ========================================================================= */}
        {/* HALAMAN 16: PAGELARAN SEMARANG - BAZAR & UMKM BINAAN (Bagian 2)           */}
        {/* ========================================================================= */}
        {renderPageWrapper(16, 'Pagelaran Semarang (UMKM Binaan)', (
          <div className="p-10 space-y-6 flex-1 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="border-b-2 border-slate-900 pb-3 flex items-center justify-between">
                <span className="text-xs font-black uppercase text-amber-700">PAGELARAN SEMARANG • PEMBERDAYAAN UMKM BINAAN</span>
                <span className="text-[10px] text-slate-400 font-bold">KPPN SEMARANG I</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="space-y-3 text-xs text-slate-700 leading-relaxed text-justify">
                  {renderTextOrMissing(
                    buletinConfig.pagelaranSemarang?.deskripsiUmkm,
                    'pagelaran.deskripsiUmkm',
                    'Uraian program pemberdayaan UMKM Kemenkeu Satu, Digipay Satu, dan pembiayaan UMi.',
                    'text-slate-700 leading-relaxed text-justify',
                    'KPPN Semarang I secara aktif mendorong pemberdayaan Usaha Mikro, Kecil, dan Menengah (UMKM) melalui fasilitasi pembiayaan Ultra Mikro (UMi) dan digitalisasi transaksi pengadaan pemerintah lewat platform Digipay Satu.'
                  )}
                  <p>
                    Pada ajang bazar pameran, beragam produk unggulan olahan kuliner khas Semarang seperti Bandeng Presto, Wingko Babat, serta batik semarangan berhasil menarik antusiasme tinggi pembeli.
                  </p>
                </div>

                <div>
                  {renderPhotoOrMissing(
                    buletinConfig.pagelaranSemarang?.fotoUmkmUrl,
                    'Bazar UMKM Binaan',
                    'h-56 w-full',
                    OFFICIAL_PRESET_IMAGES.umkmBinaan,
                    'pagelaran.fotoUmkmUrl'
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}


        {/* ========================================================================= */}
        {/* HALAMAN 17: TEROPONG SEMARANG - KAWASAN KOTA LAMA (Bagian 1)              */}
        {/* ========================================================================= */}
        {renderPageWrapper(17, 'Teropong Semarang (Kota Lama)', (
          <div className="p-10 space-y-6 flex-1 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b-2 border-slate-900 pb-3">
                <span className="px-3 py-1 rounded-md bg-rose-600 text-white font-black text-xs uppercase">
                  TEROPONG SEMARANG
                </span>
                <h2 className="text-2xl font-black text-slate-900 font-serif">
                  {buletinConfig.teropongSemarang?.lokasi1Nama || 'PESONA KAWASAN KOTA LAMA'}
                </h2>
              </div>

              {renderPhotoOrMissing(
                buletinConfig.teropongSemarang?.fotoTeropong1Url,
                'Kawasan Kota Lama Semarang',
                'h-60 w-full',
                OFFICIAL_PRESET_IMAGES.kotaLama,
                'teropong.fotoTeropong1Url'
              )}

              <div className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed text-justify">
                {renderTextOrMissing(
                  buletinConfig.teropongSemarang?.lokasi1Deskripsi,
                  'teropong.lokasi1Deskripsi',
                  'Ulasan arsitektur bersejarah, Gereja Blenduk, dan revitalisasi Kota Lama.',
                  'text-slate-700 leading-relaxed text-justify',
                  'Kawasan Kota Lama Semarang dengan deretan bangunan bersejarah abad ke-18 seperti Gereja Blenduk dan Gedung Marba menjadi magnet pariwisata yang tak lekang oleh waktu. Penataan pedestrian yang asri menjadikannya ruang publik yang inklusif dan sarat nilai edukasi sejarah.'
                )}
              </div>
            </div>
          </div>
        ))}


        {/* ========================================================================= */}
        {/* HALAMAN 18: TEROPONG SEMARANG - LAWANG SEWU & PASAR JOHAR (Bagian 2)      */}
        {/* ========================================================================= */}
        {renderPageWrapper(18, 'Teropong Semarang (Lawang Sewu)', (
          <div className="p-10 space-y-6 flex-1 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="border-b-2 border-slate-900 pb-3 flex items-center justify-between">
                <span className="text-xs font-black uppercase text-rose-700">TEROPONG SEMARANG • LANDMARK &amp; KULINER</span>
                <span className="text-[10px] text-slate-400 font-bold">KPPN SEMARANG I</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  {renderPhotoOrMissing(
                    buletinConfig.teropongSemarang?.fotoTeropong2Url,
                    'Kemegahan Lawang Sewu',
                    'h-48 w-full',
                    OFFICIAL_PRESET_IMAGES.lawangSewu,
                    'teropong.fotoTeropong2Url'
                  )}
                  <p className="text-xs text-slate-600 text-justify">
                    {buletinConfig.teropongSemarang?.lokasi2Deskripsi || 'Lawang Sewu di bundaran Tugu Muda berdiri megah sebagai ikon perkeretaapian nasional dan saksi perjuangan Pertempuran Lima Hari di Semarang.'}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="h-48 rounded-2xl overflow-hidden shadow-sm border border-slate-200">
                    <img 
                      src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=800" 
                      alt="Kuliner Semarangan" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-xs text-slate-600 text-justify">
                    Kekayaan kuliner khas Semarang seperti Lumpia Gang Lombok, Tahu Gimbal, dan Bandeng Juwana melengkapi pesona kota atlas yang memikat para wisatawan domestik maupun mancanegara.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}


        {/* ========================================================================= */}
        {/* HALAMAN 19: ZONA INTEGRITAS & PANTUN ANTIKORUPSI                          */}
        {/* ========================================================================= */}
        {renderPageWrapper(19, 'Zona Integritas & Pantun', (
          <div className="p-10 space-y-6 flex-1 flex flex-col justify-between">
            <div className="space-y-6">
              <div className={formatTheme.headerClass}>
                <div className="flex items-center justify-between">
                  <h2 className={`text-2xl font-black uppercase ${formatTheme.headerTitleClass}`}>
                    POJOK INTEGRITAS &amp; ANTIKORUPSI
                  </h2>
                  <span className="text-xs font-bold text-amber-300">WBBM KPPN SEMARANG I</span>
                </div>
              </div>

              {/* Integrity Pledge Box */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white space-y-4 shadow-xl">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-8 h-8 text-amber-400 shrink-0" />
                  <div>
                    <h3 className="font-black text-sm uppercase tracking-wide text-amber-300">
                      KOMITMEN LAYANAN TANPA BIAYA (RP 0,-)
                    </h3>
                    <p className="text-xs text-slate-300">
                      Seluruh Layanan Perbendaharaan KPPN Semarang I Bebas dari Segala Pungli &amp; Gratifikasi
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-200 leading-relaxed text-justify border-t border-white/10 pt-3">
                  {buletinConfig.pantunAntiKorupsi?.pesanIntegritas || 'KPPN Tipe A1 Semarang I berkomitmen menjaga integritas tanpa kompromi. Seluruh layanan perbendaharaan, penerbitan SP2D, bimbingan SAKTI, dan konsultasi anggaran diberikan GRATIS (Rp0,-). Laporkan segala bentuk pungutan liar atau gratifikasi melalui saluran resmi SIPANDU Kemkeu dan WBS Kemenkeu.'}
                </p>
              </div>

              {/* Pantun Box */}
              <div className="p-6 rounded-2xl bg-amber-50/90 border border-amber-300 text-center space-y-3 shadow-sm">
                <div className="inline-block px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider">
                  PANTUN INTEGRITAS KPPN SEMARANG I
                </div>

                <div className="space-y-1.5 text-xs sm:text-sm font-serif italic text-slate-800 leading-relaxed">
                  <p>"{buletinConfig.pantunAntiKorupsi?.bait1 || 'Jalan-jalan ke Simpang Lima membeli lumpia,'}"</p>
                  <p>"{buletinConfig.pantunAntiKorupsi?.bait2 || 'Mampir kulineran tahu gimbal nikmat tiada tara;'}"</p>
                  <p>"{buletinConfig.pantunAntiKorupsi?.bait3 || 'KPPN Semarang I melayani dengan tulus dan prima,'}"</p>
                  <p className="font-bold text-amber-900">"{buletinConfig.pantunAntiKorupsi?.bait4 || 'Tanpa suap, tolak gratifikasi, integritas nomor satu selamanya!'}"</p>
                </div>
              </div>

              {/* 5 Strategic Recommendations for Satkers */}
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                  5 Pedoman Kepatuhan Pelaksanaan Anggaran bagi Satker Mitra:
                </h4>
                <div className="grid grid-cols-1 gap-2 text-[11px] text-slate-700">
                  {deepAnalysis.rekomendasiStrategis.map((rec, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}


        {/* ========================================================================= */}
        {/* HALAMAN 20: BACK COVER MAJALAH & INFORMASI KONTAK LENGKAP KPPN            */}
        {/* ========================================================================= */}
        {renderPageWrapper(20, 'Back Cover & Kontak', (
          <div className={`flex-1 flex flex-col justify-between p-8 bg-gradient-to-br ${formatTheme.coverGradient} text-white relative overflow-hidden min-h-[1100px]`}>
            {/* Background Image / Pattern */}
            {buletinConfig.kontakKppn?.fotoGedungUrl ? (
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-overlay pointer-events-none"
                style={{ backgroundImage: `url(${buletinConfig.kontakKppn.fotoGedungUrl})` }}
              />
            ) : (
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-25 mix-blend-overlay pointer-events-none"
                style={{ backgroundImage: `url(${OFFICIAL_PRESET_IMAGES.gedungKppn})` }}
              />
            )}

            {/* Top Brand Banner */}
            <div className="relative z-10 flex items-center justify-between border-b border-white/20 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs">
                  026
                </div>
                <div>
                  <div className="text-xs font-black uppercase text-amber-300">KPPN TIPE A1 SEMARANG I</div>
                  <div className="text-[10px] text-slate-300">Direktorat Jenderal Perbendaharaan</div>
                </div>
              </div>

              <div className="text-right text-xs font-bold text-amber-300">
                {buletinConfig.edisi}
              </div>
            </div>

            {/* Central Building Card & Info */}
            <div className="relative z-10 my-auto py-6 space-y-6 text-center">
              <div className="max-w-md mx-auto p-6 rounded-3xl bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl space-y-4">
                <Building2 className="w-12 h-12 text-amber-400 mx-auto" />

                <h3 className="text-xl font-black text-white uppercase tracking-wide">
                  KANTOR PELAYANAN PERBENDAHARAAN NEGARA (KPPN) TIPE A1 SEMARANG I
                </h3>

                <div className="space-y-2 text-xs text-slate-200 text-left border-t border-white/10 pt-4">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>{buletinConfig.kontakKppn?.alamat || 'Jl. Ki Mangunsarkoro No. 34, Karangkidul, Kec. Semarang Tengah, Kota Semarang, Jawa Tengah 50241'}</span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{buletinConfig.kontakKppn?.telepon || '(024) 8414002 / 8414003'}</span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-bold text-emerald-300">{buletinConfig.kontakKppn?.whatsappHelpdesk || '+62 811-2700-026 (Helpdesk SAKTI)'}</span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{buletinConfig.kontakKppn?.email || 'kppnsemarang1@kemenkeu.go.id'}</span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <Globe className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{buletinConfig.kontakKppn?.website || 'djpb.kemenkeu.go.id/kppn/semarang1'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Footer Credits */}
            <div className="relative z-10 text-center border-t border-white/20 pt-4 text-[10px] text-slate-400 space-y-1">
              <p>© 2026 KPPN Tipe A1 Semarang I • Hak Cipta Dilindungi Undang-Undang</p>
              <p className="text-amber-300/80 italic">"InTress Treasury: Handal, Amanah, dan Berintegritas Mengawal APBN untuk Negeri"</p>
            </div>
          </div>
        ))}

      </div>
    </div>
  );
};
