import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Wand2,
  BookOpen,
  FileText,
  CheckCircle2,
  RotateCcw,
  Copy,
  Check,
  Send,
  SlidersHorizontal,
  Flame,
  ArrowRight,
  TrendingUp,
  Award
} from 'lucide-react';
import { BuletinConfig, RealisasiBelanjaSummary, SatkerIKPA } from '../../../types';
import { generateGeminiContent } from '../../../services/geminiService';
import { generateAiBuletinEditorial } from '../../../services/buletinAiEngine';
import { formatRupiahShort } from '../../../utils/realisasiBelanjaProcessor';
import { useToast } from '../../ToastNotification';
import { playChimeSound } from '../../../utils/buletinSoundEffects';

interface BuletinAiStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  buletinConfig: BuletinConfig;
  overallSummary?: RealisasiBelanjaSummary | null;
  satkers?: SatkerIKPA[];
  onUpdateBuletinConfig: (updated: BuletinConfig) => void;
  soundEnabled?: boolean;
}

type AiTab = 'full_pack' | 'polish' | 'headlines' | 'fiscal_summary';

export const BuletinAiStudioModal: React.FC<BuletinAiStudioModalProps> = ({
  isOpen,
  onClose,
  buletinConfig,
  overallSummary,
  satkers = [],
  onUpdateBuletinConfig,
  soundEnabled = true
}) => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<AiTab>('full_pack');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Polish tab states
  const [inputTextToPolish, setInputTextToPolish] = useState<string>('');
  const [polishedOutput, setPolishedOutput] = useState<string>('');
  const [polishTone, setPolishTone] = useState<'formal' | 'inspirational' | 'journalistic' | 'academic'>('formal');

  // Headline tab states
  const [headlineTopic, setHeadlineTopic] = useState<string>('Akselerasi Belanja & Modernisasi Digital SAKTI');
  const [generatedHeadlines, setGeneratedHeadlines] = useState<Array<{ title: string; subtitle: string; angle: string }>>([]);

  // Fiscal summary explainer states
  const [fiscalExplainerOutput, setFiscalExplainerOutput] = useState<string>('');

  // Copied state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    playChimeSound(soundEnabled);
    addToast('Teks berhasil disalin ke clipboard!', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // 1. Generate Full Editorial Pack
  const handleGenerateFullPack = async () => {
    setIsLoading(true);
    try {
      const generated = await generateAiBuletinEditorial(buletinConfig, overallSummary, satkers);
      onUpdateBuletinConfig({
        ...buletinConfig,
        ...generated
      });
      playChimeSound(soundEnabled);
      addToast('✨ Redaksi Majalah berhasil diperbarui secara cerdas oleh AI Gemini!', 'success');
    } catch (err: any) {
      console.error(err);
      addToast('Gagal memproses redaksi AI: ' + (err.message || 'Coba lagi nanti.'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Handle Text Polish / Paraphrase
  const handlePolishText = async () => {
    if (!inputTextToPolish.trim()) {
      addToast('Silakan masukkan teks yang ingin disempurnakan!', 'warning');
      return;
    }
    setIsLoading(true);
    try {
      const prompt = `Anda adalah Redaktur Senior Majalah Perbendaharaan Kementerian Keuangan RI.
Tugas Anda: Tulis ulang dan sempurnakan paragraf berikut agar memiliki bobot intelektual tinggi, tata bahasa baku bahasa Indonesia yang elegan (KBBI/EYD), dan gaya penulisan bernuansa "${polishTone}".

TEKS ASLI:
"${inputTextToPolish}"

Berikan HANYA teks hasil penyempurnaan tanpa tanda kutip dan tanpa basa-basi pembuka/penutup.`;

      const res = await generateGeminiContent({
        prompt,
        model: 'gemini-3.7-flash',
        systemInstruction: 'Anda adalah redaktur publikasi resmi Kemenkeu RI.'
      });

      setPolishedOutput(res.text.trim());
      playChimeSound(soundEnabled);
      addToast('✨ Paragraf berhasil dipoles dengan standar publikasi DJPb!', 'success');
    } catch (err: any) {
      addToast('Gagal memoles teks: ' + (err.message || 'Error AI'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Handle Headlines Recommendation
  const handleGenerateHeadlines = async () => {
    setIsLoading(true);
    try {
      const prompt = `Buat 4 pilihan pasang Judul Utama dan Sub-Judul majalah yang sangat memikat, berwibawa, dan modern untuk Majalah Fiskal KPPN Semarang I.
Topik Utama: "${headlineTopic}"
Periode: ${buletinConfig.bulanTahun || 'Triwulan II 2026'}

Berikan output JSON valid:
[
  {
    "title": "string (Judul Utama singkat, kuat, 3-6 kata)",
    "subtitle": "string (Sub-judul penjelasan menarik)",
    "angle": "string (Fokus tema, misal: 'Fiskal Makro' / 'Digitalisasi' / 'Integritas')"
  }
]
HANYA JSON murni tanpa markdown.`;

      const res = await generateGeminiContent({
        prompt,
        model: 'gemini-3.7-flash',
        systemInstruction: 'Output JSON murni.'
      });

      let clean = res.text.trim();
      if (clean.startsWith('```json')) clean = clean.replace(/^```json/, '').replace(/```$/, '').trim();
      else if (clean.startsWith('```')) clean = clean.replace(/^```/, '').replace(/```$/, '').trim();

      const parsed = JSON.parse(clean);
      setGeneratedHeadlines(parsed);
      playChimeSound(soundEnabled);
      addToast('✨ 4 Rekomendasi Headline berhasil digenerate!', 'success');
    } catch (err: any) {
      addToast('Gagal membuat headline: ' + err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Handle Fiscal Explainer Summary
  const handleGenerateFiscalExplainer = async () => {
    setIsLoading(true);
    try {
      const paguStr = overallSummary ? formatRupiahShort(overallSummary.totalPagu) : 'Rp12,85 Triliun';
      const realStr = overallSummary ? formatRupiahShort(overallSummary.totalRealisasi) : 'Rp8,42 Triliun';
      const persen = overallSummary ? overallSummary.persenRealisasiTotal.toFixed(1) : '65.5';

      const prompt = `Tuliskan ulasan narasi eksekutif 3 paragraf padat tentang "Kilas Balik Kinerja Belanja APBN Regional KPPN Semarang I".
Data Riil:
- Pagu: ${paguStr}
- Realisasi: ${realStr} (${persen}%)
- Fokus: Kontribusi belanja modal dan bansos terhadap ekonomi masyarakat Jawa Tengah dan Kota Semarang.
Gunakan gaya penulisan jurnalisme data modern yang mudah dipahami stakeholder pimpinan.`;

      const res = await generateGeminiContent({
        prompt,
        model: 'gemini-3.7-flash',
        systemInstruction: 'Anda adalah Ekonom Regional Perbendaharaan.'
      });

      setFiscalExplainerOutput(res.text.trim());
      playChimeSound(soundEnabled);
      addToast('✨ Ulasan narasi fiskal berhasil digenerate!', 'success');
    } catch (err: any) {
      addToast('Gagal membuat ulasan fiskal: ' + err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-white animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-900 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight text-white">
                  Studio Redaksi AI &amp; Copywriter Cerdas
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 font-mono">
                  Gemini 3.7 Flash
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Penyusun naskah editorial, pemoles tata bahasa, dan rekomendasi headline perbendaharaan berstandar Kementerian Keuangan.
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

        {/* Tab Navigation */}
        <div className="px-6 pt-3 bg-slate-900/60 border-b border-slate-800 flex items-center gap-2 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('full_pack')}
            className={`px-4 py-2.5 rounded-t-xl font-bold flex items-center gap-2 transition-all border-b-2 ${
              activeTab === 'full_pack'
                ? 'bg-slate-800 text-amber-300 border-amber-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Paket Redaksi Lengkap</span>
          </button>

          <button
            onClick={() => setActiveTab('polish')}
            className={`px-4 py-2.5 rounded-t-xl font-bold flex items-center gap-2 transition-all border-b-2 ${
              activeTab === 'polish'
                ? 'bg-slate-800 text-amber-300 border-amber-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Poles Teks / Paragraf</span>
          </button>

          <button
            onClick={() => setActiveTab('headlines')}
            className={`px-4 py-2.5 rounded-t-xl font-bold flex items-center gap-2 transition-all border-b-2 ${
              activeTab === 'headlines'
                ? 'bg-slate-800 text-amber-300 border-amber-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Ide Headline &amp; Cover</span>
          </button>

          <button
            onClick={() => setActiveTab('fiscal_summary')}
            className={`px-4 py-2.5 rounded-t-xl font-bold flex items-center gap-2 transition-all border-b-2 ${
              activeTab === 'fiscal_summary'
                ? 'bg-slate-800 text-amber-300 border-amber-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Narasi Fiskal Eksekutif</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: FULL EDITORIAL PACK */}
          {activeTab === 'full_pack' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-800/50 space-y-2">
                <h4 className="font-bold text-sm text-indigo-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Otomasi Seluruh Naskah Redaksi Edisi Ini
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  AI akan membaca total pagu dan realisasi belanja dari database, nama satker champion IKPA, lalu secara simultan menyusun Sambutan Kepala KPPN, Tajuk Rencana, Opini Pranata APBN, Wawancara Eksklusif, dan Pantun Integritas.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Data Referensi Saat Ini:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-700/60">
                    <span className="text-slate-400 block text-[10px]">Periode Majalah</span>
                    <strong className="text-amber-300 font-bold">{buletinConfig.bulanTahun || 'Triwulan II 2026'}</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-700/60">
                    <span className="text-slate-400 block text-[10px]">Total Pagu</span>
                    <strong className="text-slate-200 font-bold">{overallSummary ? formatRupiahShort(overallSummary.totalPagu) : 'Rp12,85 T'}</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-700/60">
                    <span className="text-slate-400 block text-[10px]">Realisasi Total</span>
                    <strong className="text-emerald-400 font-bold">{overallSummary ? `${Number.isFinite(overallSummary.persenRealisasiTotal) ? overallSummary.persenRealisasiTotal.toFixed(1) : '0.0'}%` : '65.5%'}</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-700/60">
                    <span className="text-slate-400 block text-[10px]">Satker Terdepan</span>
                    <strong className="text-slate-200 font-bold truncate block">{overallSummary?.topSatkers?.[0]?.namaSatker || satkers[0]?.namaSatker || 'Polrestabes Semarang'}</strong>
                  </div>
                </div>
              </div>

              <button
                onClick={handleGenerateFullPack}
                disabled={isLoading}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-black text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Menyusun Naskah Redaksi DJPb...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    <span>Generate &amp; Terapkan Seluruh Naskah Buletin Sekarang</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 2: POLISH TEXT */}
          {activeTab === 'polish' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Tempelkan Teks Asli / Draf Anda:</span>
                  <span className="text-[10px] text-slate-400">Pilih Gaya Bahasa:</span>
                </label>

                <div className="flex items-center gap-2 flex-wrap mb-2">
                  {[
                    { key: 'formal', label: '🏛️ Formal Kemenkeu' },
                    { key: 'inspirational', label: '⭐ Inspiratif & Bersemangat' },
                    { key: 'journalistic', label: '📰 Jurnalisme Populer' },
                    { key: 'academic', label: '🎓 Kajian Akademis' }
                  ].map(t => (
                    <button
                      key={t.key}
                      onClick={() => setPolishTone(t.key as any)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
                        polishTone === t.key
                          ? 'bg-amber-400 text-slate-950 border-amber-400'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={4}
                  value={inputTextToPolish}
                  onChange={e => setInputTextToPolish(e.target.value)}
                  placeholder="Contoh: Pembayaran non tunai di satker semarang sudah lumayan banyak lewat kkp dan digipay..."
                  className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <button
                onClick={handlePolishText}
                disabled={isLoading || !inputTextToPolish.trim()}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Sedang Menyempurnakan Teks...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Poles dengan AI</span>
                  </>
                )}
              </button>

              {polishedOutput && (
                <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      Hasil Teks yang Disempurnakan:
                    </span>
                    <button
                      onClick={() => copyToClipboard(polishedOutput, 'polished')}
                      className="px-3 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-[11px] font-bold flex items-center gap-1 transition-colors"
                    >
                      {copiedId === 'polished' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId === 'polished' ? 'Tersalin' : 'Salin Teks'}</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap bg-slate-950 p-3 rounded-xl border border-slate-800">
                    {polishedOutput}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: HEADLINE RECOMMENDER */}
          {activeTab === 'headlines' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300">
                  Topik / Fokus Utama Edisi:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={headlineTopic}
                    onChange={e => setHeadlineTopic(e.target.value)}
                    placeholder="Contoh: Green Budgeting & Digitalisasi Pembayaran Satker"
                    className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                  <button
                    onClick={handleGenerateHeadlines}
                    disabled={isLoading}
                    className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Flame className="w-3.5 h-3.5" />
                    <span>Cari Ide</span>
                  </button>
                </div>
              </div>

              {generatedHeadlines.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {generatedHeadlines.map((h, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700 hover:border-amber-400/60 transition-all space-y-2 group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-slate-900 text-amber-300 border border-slate-800">
                          {h.angle}
                        </span>
                        <button
                          onClick={() => {
                            onUpdateBuletinConfig({
                              ...buletinConfig,
                              judulUtama: h.title,
                              subJudul: h.subtitle
                            });
                            playChimeSound(soundEnabled);
                            addToast('Judul Utama Majalah berhasil diterapkan!', 'success');
                          }}
                          className="text-[11px] font-bold text-indigo-300 hover:text-indigo-200 group-hover:underline flex items-center gap-1"
                        >
                          <span>Terapkan</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                      <h5 className="text-sm font-black text-white leading-tight">
                        {h.title}
                      </h5>
                      <p className="text-xs text-slate-400 leading-snug">
                        {h.subtitle}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: FISCAL SUMMARY EXPLAINER */}
          {activeTab === 'fiscal_summary' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
                <h4 className="font-bold text-xs text-amber-300 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4" />
                  Narasi Kilas Balik Anggaran untuk Laporan Eksekutif
                </h4>
                <p className="text-xs text-slate-300">
                  Ubah data tabular angka realisasi menjadi cerita ekonomi menarik yang siap dibaca oleh media massa, pimpinan K/L, dan Pemda.
                </p>
              </div>

              <button
                onClick={handleGenerateFiscalExplainer}
                disabled={isLoading}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Menganalisis Angka Fiskal...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Susun Ulasan Narasi Fiskal</span>
                  </>
                )}
              </button>

              {fiscalExplainerOutput && (
                <div className="p-4 rounded-2xl bg-slate-800 border border-slate-700 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                    <span>Ulasan Fiskal Siap Pakai:</span>
                    <button
                      onClick={() => copyToClipboard(fiscalExplainerOutput, 'fiscal')}
                      className="px-3 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-[11px] font-bold flex items-center gap-1"
                    >
                      {copiedId === 'fiscal' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Salin Ulasan</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                    {fiscalExplainerOutput}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>AI Redaksi Terintegrasi • KPPN Tipe A1 Semarang I</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
