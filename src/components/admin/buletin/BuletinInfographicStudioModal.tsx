import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Download,
  Copy,
  Check,
  Palette,
  Layers,
  Image as ImageIcon,
  BarChart3,
  Award,
  TrendingUp,
  Quote
} from 'lucide-react';
import { BuletinConfig, RealisasiBelanjaSummary, SatkerIKPA } from '../../../types';
import { formatRupiahShort, formatRupiahFull } from '../../../utils/realisasiBelanjaProcessor';
import { useToast } from '../../ToastNotification';

interface BuletinInfographicStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  buletinConfig: BuletinConfig;
  overallSummary?: RealisasiBelanjaSummary;
  satkers?: SatkerIKPA[];
}

export const BuletinInfographicStudioModal: React.FC<BuletinInfographicStudioModalProps> = ({
  isOpen,
  onClose,
  buletinConfig,
  overallSummary,
  satkers = []
}) => {
  const { addToast } = useToast();
  const [templateType, setTemplateType] = useState<'apbn_summary' | 'top_ikpa' | 'quote_banner' | 'tkd_card'>('apbn_summary');
  const [cardTheme, setCardTheme] = useState<'navy_gold' | 'emerald_modern' | 'cyber_dark' | 'sunset_amber'>('navy_gold');
  const [customTitle, setCustomTitle] = useState<string>('KINERJA APBN WILAYAH KPPN SEMARANG I');
  const [customSubtitle, setCustomSubtitle] = useState<string>('Akselerasi Belanja Berkualitas untuk Pertumbuhan Ekonomi');
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const totalPagu = overallSummary?.totalPagu || 14250000000000;
  const totalRealisasi = overallSummary?.totalRealisasi || 10830000000000;
  const persenRealisasi = Number.isFinite(overallSummary?.persenRealisasiTotal)
    ? (overallSummary?.persenRealisasiTotal as number)
    : (Number.isFinite(overallSummary?.persentaseRealisasi)
      ? (overallSummary?.persentaseRealisasi as number)
      : (totalPagu > 0 ? (totalRealisasi / totalPagu) * 100 : 76.0));

  // Sorted Top 5 Satkers
  const topSatkers = [...satkers]
    .sort((a, b) => (b.nilaiIKPA || 0) - (a.nilaiIKPA || 0))
    .slice(0, 5);

  const themeStyles = {
    navy_gold: {
      bg: 'from-slate-950 via-slate-900 to-indigo-950',
      border: 'border-amber-400/40',
      accent: 'text-amber-400',
      badgeBg: 'bg-amber-400 text-slate-950',
      barBg: 'bg-gradient-to-r from-amber-500 to-amber-300'
    },
    emerald_modern: {
      bg: 'from-emerald-950 via-slate-900 to-teal-950',
      border: 'border-emerald-400/40',
      accent: 'text-emerald-400',
      badgeBg: 'bg-emerald-400 text-slate-950',
      barBg: 'bg-gradient-to-r from-emerald-500 to-teal-300'
    },
    cyber_dark: {
      bg: 'from-slate-950 via-slate-900 to-blue-950',
      border: 'border-cyan-400/40',
      accent: 'text-cyan-400',
      badgeBg: 'bg-cyan-400 text-slate-950',
      barBg: 'bg-gradient-to-r from-cyan-500 to-blue-400'
    },
    sunset_amber: {
      bg: 'from-amber-950 via-slate-900 to-rose-950',
      border: 'border-rose-400/40',
      accent: 'text-rose-400',
      badgeBg: 'bg-rose-400 text-white',
      barBg: 'bg-gradient-to-r from-amber-500 to-rose-400'
    }
  }[cardTheme];

  const handleCopySnippet = () => {
    const code = `<!-- INFOGRAFIS RESMI KPPN SEMARANG I -->
<div style="background: #0f172a; color: white; padding: 24px; border-radius: 16px; border: 1px solid #f59e0b; font-family: sans-serif;">
  <h3 style="color: #f59e0b; font-size: 16px; font-weight: bold;">${customTitle}</h3>
  <p style="font-size: 12px; color: #94a3b8;">${customSubtitle}</p>
  <div style="margin-top: 16px; font-size: 28px; font-weight: 900;">${persenRealisasi.toFixed(1)}% Realisasi</div>
  <p style="font-size: 12px; color: #cbd5e1;">Pagu: Rp ${formatRupiahShort(totalPagu)} | Realisasi: Rp ${formatRupiahShort(totalRealisasi)}</p>
</div>`;
    navigator.clipboard.writeText(code);
    setCopied(true);
    addToast('Kode HTML infografis berhasil disalin!', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-white animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Studio Infografis &amp; Callout Desain Majalah</h3>
              <p className="text-xs text-slate-400">
                Buat kartu statistik kustom beresolusi tinggi untuk disematkan di artikel atau media publikasi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Controls & Live Preview Grid */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Form Controls */}
          <div className="lg:col-span-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Pilih Format Infografis:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setTemplateType('apbn_summary')}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all ${
                    templateType === 'apbn_summary'
                      ? 'bg-amber-400 text-slate-950 border-amber-400'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  📊 Ringkasan APBN
                </button>

                <button
                  onClick={() => setTemplateType('top_ikpa')}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all ${
                    templateType === 'top_ikpa'
                      ? 'bg-amber-400 text-slate-950 border-amber-400'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  🏆 Top 5 Satker IKPA
                </button>

                <button
                  onClick={() => setTemplateType('quote_banner')}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all ${
                    templateType === 'quote_banner'
                      ? 'bg-amber-400 text-slate-950 border-amber-400'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  💬 Kutipan Editorial
                </button>

                <button
                  onClick={() => setTemplateType('tkd_card')}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all ${
                    templateType === 'tkd_card'
                      ? 'bg-amber-400 text-slate-950 border-amber-400'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  🏙️ Transfer Ke Daerah
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Skema Warna &amp; Palet:</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'navy_gold', label: '🏛️ Royal Navy & Gold' },
                  { id: 'emerald_modern', label: '🌿 Emerald Green' },
                  { id: 'cyber_dark', label: '🌌 Cyber Obsidian' },
                  { id: 'sunset_amber', label: '🌅 Sunset Rose' }
                ].map(th => (
                  <button
                    key={th.id}
                    onClick={() => setCardTheme(th.id as any)}
                    className={`p-2 rounded-xl border text-xs font-medium text-left transition-all ${
                      cardTheme === th.id
                        ? 'bg-slate-800 border-amber-400 text-white font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {th.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Judul Kartu:</label>
              <input
                type="text"
                value={customTitle}
                onChange={e => setCustomTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Sub Judul / Keterangan Singkat:</label>
              <textarea
                rows={2}
                value={customSubtitle}
                onChange={e => setCustomSubtitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:ring-1 focus:ring-amber-400 leading-relaxed"
              />
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={handleCopySnippet}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Tersalin!' : 'Salin HTML Code'}</span>
              </button>
            </div>
          </div>

          {/* Right Column: Live Infographic Stage */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center p-4 bg-slate-950 rounded-3xl border border-slate-800">
            <div className="w-full max-w-md">
              <div className="text-[11px] font-bold text-slate-400 mb-2 flex items-center justify-between">
                <span>Pratinjau Kartu Infografis</span>
                <span className="font-mono text-amber-400">Rasio Fleksibel</span>
              </div>

              {/* CARD PREVIEW */}
              <div
                id="infographic-export-card"
                className={`p-6 rounded-3xl border ${themeStyles.border} bg-gradient-to-br ${themeStyles.bg} shadow-2xl relative overflow-hidden space-y-4`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className={`text-[10px] font-black tracking-widest px-2.5 py-0.5 rounded-full ${themeStyles.badgeBg}`}>
                      KPPN SEMARANG I
                    </span>
                    <h3 className="text-base font-black text-white leading-tight mt-2">{customTitle}</h3>
                    <p className="text-xs text-slate-300 mt-0.5">{customSubtitle}</p>
                  </div>
                </div>

                {/* TEMPLATE 1: APBN SUMMARY */}
                {templateType === 'apbn_summary' && (
                  <div className="space-y-4 pt-2">
                    <div className="bg-slate-900/70 backdrop-blur-md p-4 rounded-2xl border border-white/10 space-y-2">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs text-slate-400">Tingkat Penyerapan Anggaran</span>
                        <span className={`text-2xl font-black ${themeStyles.accent}`}>
                          {(Number.isFinite(persenRealisasi) ? persenRealisasi : 0).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
                        <div className={`h-full ${themeStyles.barBg}`} style={{ width: `${Math.min(100, Math.max(0, Number.isFinite(persenRealisasi) ? persenRealisasi : 0))}%` }} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5">
                        <div className="text-[10px] text-slate-400 uppercase">Pagu Total</div>
                        <div className="text-sm font-black text-white mt-0.5">
                          Rp {formatRupiahShort(totalPagu)}
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5">
                        <div className="text-[10px] text-slate-400 uppercase">Realisasi</div>
                        <div className="text-sm font-black text-emerald-400 mt-0.5">
                          Rp {formatRupiahShort(totalRealisasi)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TEMPLATE 2: TOP 5 IKPA */}
                {templateType === 'top_ikpa' && (
                  <div className="space-y-2 pt-1">
                    {topSatkers.map((satker, idx) => (
                      <div
                        key={satker.kodeSatker || idx}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/70 border border-white/5 text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span
                            className={`w-5 h-5 rounded-md flex items-center justify-center font-black text-[10px] ${
                              idx === 0 ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <span className="font-bold text-slate-200 truncate">{satker.namaSatker}</span>
                        </div>
                        <span className="font-mono font-black text-amber-300 shrink-0 ml-2">
                          {(Number.isFinite(satker.nilaiIKPA) ? satker.nilaiIKPA : 98).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* TEMPLATE 3: QUOTE BANNER */}
                {templateType === 'quote_banner' && (
                  <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 space-y-3">
                    <Quote className={`w-6 h-6 ${themeStyles.accent} opacity-80`} />
                    <p className="text-xs italic text-slate-200 leading-relaxed font-serif">
                      "{buletinConfig.sambutanKepala?.slice(0, 180) || 'Anggaran negara adalah instrumen utama pembangunan yang harus dikelola secara akuntabel, transparan, dan berdampak nyata bagi kemakmuran rakyat.'}..."
                    </p>
                    <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
                      <span className="font-bold text-white">{buletinConfig.namaKepalaKantor}</span>
                      <span className="text-slate-400">Kepala KPPN Semarang I</span>
                    </div>
                  </div>
                )}

                {/* TEMPLATE 4: TKD CARD */}
                {templateType === 'tkd_card' && (
                  <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                    <div className="p-3 rounded-xl bg-slate-900/70 border border-white/5">
                      <div className="text-[10px] text-slate-400">DAU (Dana Alokasi Umum)</div>
                      <div className="text-sm font-black text-white mt-1">Rp 1,42 T</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900/70 border border-white/5">
                      <div className="text-[10px] text-slate-400">DBH (Dana Bagi Hasil)</div>
                      <div className="text-sm font-black text-white mt-1">Rp 385 M</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900/70 border border-white/5">
                      <div className="text-[10px] text-slate-400">DAK Non Fisik</div>
                      <div className="text-sm font-black text-white mt-1">Rp 612 M</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900/70 border border-white/5">
                      <div className="text-[10px] text-slate-400">Insentif Fiskal</div>
                      <div className="text-sm font-black text-amber-300 mt-1">Rp 48 M</div>
                    </div>
                  </div>
                )}

                {/* Footer Watermark */}
                <div className="pt-2 flex items-center justify-between text-[9px] text-slate-400 border-t border-white/10">
                  <span>Edisi {buletinConfig.edisi || 'IV/2026'}</span>
                  <span>kemenkeu.go.id • Kemenkeu Satu</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>KPPN Semarang I — Studio Visual Fiskal</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
