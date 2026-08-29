import React, { useState } from 'react';
import {
  X,
  Share2,
  Instagram,
  Linkedin,
  MessageSquare,
  Copy,
  Check,
  Download,
  Code,
  QrCode,
  Sparkles,
  Smartphone,
  ExternalLink,
  Layers,
  Send
} from 'lucide-react';
import { BuletinConfig, RealisasiBelanjaSummary } from '../../../types';
import { formatRupiahShort, formatRupiahFull } from '../../../utils/realisasiBelanjaProcessor';
import { useToast } from '../../ToastNotification';

interface BuletinDistributionHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  buletinConfig: BuletinConfig;
  overallSummary?: RealisasiBelanjaSummary;
}

export const BuletinDistributionHubModal: React.FC<BuletinDistributionHubModalProps> = ({
  isOpen,
  onClose,
  buletinConfig,
  overallSummary
}) => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'instagram' | 'embed' | 'qrcode'>('whatsapp');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedSlide, setSelectedSlide] = useState<number>(0);

  if (!isOpen) return null;

  const totalPagu = overallSummary?.totalPagu || 14250000000000;
  const totalRealisasi = overallSummary?.totalRealisasi || 10830000000000;
  const persenRealisasi = overallSummary?.persentaseRealisasi || 76.0;

  // WhatsApp formatted text
  const whatsappBroadcastText = `📢 *E-BULETIN FISKAL EDISI SPESIAL KPPN SEMARANG I* 📢
🏛️ *${buletinConfig.judulBuletin || 'SINERGI FISKAL SEMARANG'}* - Edisi ${buletinConfig.edisi || 'IV/2026'}

Halo Bapak/Ibu Kuasa Pengguna Anggaran (KPA), PPK, dan Pejabat Pengelola Keuangan Mitra KPPN Semarang I,

Telah terbit Majalah & Buletin Fiskal Resmi KPPN Semarang I setebal 50 Halaman dengan ulasan komprehensif:
📊 *HIGHLIGHT KINERJA BELANJA NEGARA:*
• Total Pagu Dikelola: *${formatRupiahFull(totalPagu)}*
• Realisasi Belanja: *${formatRupiahFull(totalRealisasi)} (${persenRealisasi.toFixed(2)}%)*
• Nilai Rata-rata IKPA: *95.40 (Kategori Sangat Baik)*

⭐ *RUBRIK UTAMA DALAM EDISI INI:*
1. 📖 Editorial Kepala Kantor: _"${buletinConfig.subJudul || 'Kinerja Fiskal Berkualitas & Digitalisasi'}"_
2. 🏆 Rapor 8 Indikator IKPA & 10 Satker Berprestasi
3. 🌿 Green Budgeting & Efisiensi Belanja Operasional
4. 🏗️ Proyek Strategis Nasional: Normalisasi Drainase & Tanggul Rob Semarang
5. 🛡️ Zona Integritas WBK/WBBM & Anti-Gratifikasi
6. 🧩 Teka-Teki Silang & Kuis Cerdas Tangkas APBN

📲 *BACA E-BULETIN FLIPBOOK INTERAKTIF:*
https://kppn-semarang1.kemenkeu.go.id/buletin-fiskal

_KPPN Semarang I — Handal, Amanah, Melayani dengan Sepenuh Hati._
#KemenkeuSatu #UangKita #KPPNSemarangI #FiskalJateng`;

  // Social Carousel Cards Data
  const carouselCards = [
    {
      title: 'Kinerja APBN Wilayah Semarang',
      badge: 'KINERJA FISKAL',
      headline: `${persenRealisasi.toFixed(1)}% Realisasi APBN`,
      subtitle: `Total belanja negara terealisasi Rp ${formatRupiahShort(totalRealisasi)} dari pagu Rp ${formatRupiahShort(totalPagu)}`,
      color: 'from-amber-500 via-amber-600 to-amber-700',
      bgPattern: 'bg-slate-900',
      statLabel: 'Penyaluran TKD & Belanja K/L',
      statVal: 'Tumbuh Positif'
    },
    {
      title: 'Akselerasi Digitalisasi Keuangan',
      badge: 'POJOK DIGITAL & SAKTI',
      headline: '99.8% Transaksi Digital (Digipay & KKP)',
      subtitle: 'Modernisasi cashless payment mendorong efisiensi birokrasi & pemberdayaan UMKM lokal Jawa Tengah.',
      color: 'from-blue-600 via-indigo-600 to-slate-900',
      bgPattern: 'bg-indigo-950',
      statLabel: 'Satker Cashless',
      statVal: '100% Onboarding'
    },
    {
      title: 'Infrastruktur Pengendalian Banjir & Rob',
      badge: 'INFRASTRUKTUR STRATEGIS',
      headline: 'Rp 850 Miliar untuk Normalisasi Sungai',
      subtitle: 'Dukungan APBN nyata mempercepat pembangunan tanggul laut dan pompa drainase pesisir utara Semarang.',
      color: 'from-emerald-600 via-teal-700 to-slate-950',
      bgPattern: 'bg-emerald-950',
      statLabel: 'Dampak Sosial',
      statVal: 'Bebas Genangan'
    },
    {
      title: 'Penguatan Integritas & Pelayanan',
      badge: 'WBK / WBBM',
      headline: '0 Rupiah Biaya Layanan (Zero Gratifikasi)',
      subtitle: 'KPPN Semarang I berkomitmen menjaga integritas tanpa kompromi demi perbendaharaan negara yang terpercaya.',
      color: 'from-rose-600 via-rose-700 to-slate-950',
      bgPattern: 'bg-rose-950',
      statLabel: 'Indeks Kepuasan',
      statVal: '4.98 / 5.00'
    }
  ];

  // Embed Iframe snippet
  const embedCodeSnippet = `<iframe 
  src="https://kppn-semarang1.kemenkeu.go.id/buletin-fiskal?view=embed" 
  width="100%" 
  height="700px" 
  frameborder="0" 
  allow="fullscreen" 
  style="border: 1px solid #334155; border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);"
  title="E-Buletin Fiskal KPPN Semarang I">
</iframe>`;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    addToast('Teks berhasil disalin ke clipboard!', 'success');
    setTimeout(() => setCopiedKey(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-white animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Pusat Distribusi &amp; Publikasi Majalah</h3>
              <p className="text-xs text-slate-400">
                Format broadcast WhatsApp, feed media sosial, embed web, dan QR code instan
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
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-6 pt-3 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`pb-3 px-3 text-xs font-black flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'whatsapp'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>WhatsApp / Telegram</span>
          </button>

          <button
            onClick={() => setActiveTab('instagram')}
            className={`pb-3 px-3 text-xs font-black flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'instagram'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Instagram className="w-4 h-4" />
            <span>Feed &amp; Carousel Medsos</span>
          </button>

          <button
            onClick={() => setActiveTab('embed')}
            className={`pb-3 px-3 text-xs font-black flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'embed'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-4 h-4" />
            <span>Embed Widget Web</span>
          </button>

          <button
            onClick={() => setActiveTab('qrcode')}
            className={`pb-3 px-3 text-xs font-black flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'qrcode'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>QR Code Flipbook</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: WhatsApp Broadcast */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-white">Format Siaran Pesan Instan</h4>
                  <p className="text-xs text-slate-400">
                    Gunakan template ini untuk siaran ke grup KPA Satker, PPK, dan stakeholder Kemenkeu.
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(whatsappBroadcastText, 'wa')}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black flex items-center gap-2 transition-colors shadow"
                >
                  {copiedKey === 'wa' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedKey === 'wa' ? 'Tersalin!' : 'Salin Pesan WA'}</span>
                </button>
              </div>

              <div className="relative">
                <textarea
                  readOnly
                  value={whatsappBroadcastText}
                  rows={11}
                  className="w-full font-mono text-xs p-4 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300 focus:outline-none leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* TAB 2: Instagram Carousel Previews */}
          {activeTab === 'instagram' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-white">Kartu Feed / Carousel Instagram &amp; LinkedIn</h4>
                  <p className="text-xs text-slate-400">
                    Ringkasan grafis berasio 1:1 siap dipublikasikan di akun resmi KPPN Semarang I.
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  {carouselCards.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedSlide(i)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                        selectedSlide === i ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview Box Card */}
              <div className="flex justify-center py-2">
                <div
                  className={`w-72 sm:w-80 aspect-square rounded-3xl p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden border border-slate-700 bg-gradient-to-br ${carouselCards[selectedSlide].color}`}
                >
                  {/* Watermark Logo */}
                  <div className="absolute right-4 bottom-4 opacity-10 font-black text-8xl pointer-events-none select-none">
                    KPPN
                  </div>

                  <div className="space-y-2 relative z-10">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black tracking-widest px-2.5 py-1 rounded-full bg-white/20 text-white backdrop-blur-md">
                        {carouselCards[selectedSlide].badge}
                      </span>
                      <span className="text-[10px] font-bold text-white/80">KPPN SEMARANG I</span>
                    </div>

                    <h3 className="text-lg font-black text-white leading-tight pt-2">
                      {carouselCards[selectedSlide].headline}
                    </h3>
                  </div>

                  <div className="relative z-10 space-y-4">
                    <p className="text-xs text-white/90 leading-relaxed font-medium">
                      {carouselCards[selectedSlide].subtitle}
                    </p>

                    <div className="pt-3 border-t border-white/20 flex items-center justify-between">
                      <div>
                        <div className="text-[9px] uppercase tracking-wider text-white/70">
                          {carouselCards[selectedSlide].statLabel}
                        </div>
                        <div className="text-sm font-black text-white">
                          {carouselCards[selectedSlide].statVal}
                        </div>
                      </div>
                      <div className="text-[10px] font-bold text-white/90 bg-black/30 px-3 py-1.5 rounded-xl backdrop-blur-sm">
                        Slide {selectedSlide + 1} / {carouselCards.length}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <p className="text-xs text-slate-400">
                  Tip: Gunakan tangkapan layar (screenshot) beresolusi tinggi atau cetak halaman infografis untuk feed.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: Web Embed */}
          {activeTab === 'embed' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-white">Kode Iframe Widget Portal Web</h4>
                  <p className="text-xs text-slate-400">
                    Sisipkan kode HTML ini ke website Kanwil DJPb, portal satker, atau intranet KPPN.
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(embedCodeSnippet, 'embed')}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black flex items-center gap-2 transition-colors shadow"
                >
                  {copiedKey === 'embed' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedKey === 'embed' ? 'Tersalin!' : 'Salin Kode Embed'}</span>
                </button>
              </div>

              <textarea
                readOnly
                value={embedCodeSnippet}
                rows={6}
                className="w-full font-mono text-xs p-4 rounded-2xl bg-slate-950 border border-slate-800 text-amber-300 focus:outline-none leading-relaxed"
              />
            </div>
          )}

          {/* TAB 4: QR Code Flipbook */}
          {activeTab === 'qrcode' && (
            <div className="space-y-4 text-center py-4">
              <div className="w-48 h-48 mx-auto bg-white rounded-3xl p-4 flex flex-col items-center justify-center shadow-xl border-4 border-amber-400">
                {/* SVG QR Code Simulation with Center KPPN emblem */}
                <svg className="w-full h-full text-slate-950" viewBox="0 0 100 100" fill="currentColor">
                  {/* Outer corner markers */}
                  <rect x="5" y="5" width="26" height="26" rx="4" />
                  <rect x="9" y="9" width="18" height="18" fill="white" rx="2" />
                  <rect x="13" y="13" width="10" height="10" rx="1" />

                  <rect x="69" y="5" width="26" height="26" rx="4" />
                  <rect x="73" y="9" width="18" height="18" fill="white" rx="2" />
                  <rect x="77" y="13" width="10" height="10" rx="1" />

                  <rect x="5" y="69" width="26" height="26" rx="4" />
                  <rect x="9" y="73" width="18" height="18" fill="white" rx="2" />
                  <rect x="13" y="77" width="10" height="10" rx="1" />

                  {/* Data patterns */}
                  <rect x="36" y="8" width="6" height="6" />
                  <rect x="46" y="8" width="6" height="6" />
                  <rect x="56" y="8" width="6" height="6" />
                  <rect x="36" y="18" width="10" height="6" />
                  <rect x="50" y="18" width="6" height="6" />
                  <rect x="8" y="36" width="6" height="10" />
                  <rect x="18" y="36" width="6" height="6" />
                  <rect x="28" y="36" width="6" height="6" />
                  <rect x="38" y="36" width="24" height="28" fill="#f59e0b" rx="4" />
                  <text x="50" y="54" fontSize="8" fontWeight="bold" fill="#020617" textAnchor="middle">
                    KPPN
                  </text>
                  <rect x="66" y="36" width="10" height="6" />
                  <rect x="80" y="36" width="12" height="6" />
                  <rect x="8" y="50" width="16" height="6" />
                  <rect x="68" y="50" width="24" height="6" />
                  <rect x="36" y="68" width="8" height="8" />
                  <rect x="48" y="68" width="8" height="8" />
                  <rect x="60" y="68" width="12" height="8" />
                  <rect x="76" y="68" width="16" height="8" />
                  <rect x="36" y="80" width="20" height="12" />
                  <rect x="60" y="80" width="16" height="12" />
                  <rect x="80" y="80" width="12" height="12" />
                </svg>
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-black text-white">Scan untuk Baca di Ponsel / Tablet</h4>
                <p className="text-xs text-slate-400">
                  Cetak QR Code ini pada banner standing lobby, kartu nama, atau flyer satker.
                </p>
              </div>

              <div className="flex justify-center gap-2">
                <button
                  onClick={() => handleCopy('https://kppn-semarang1.kemenkeu.go.id/buletin-fiskal', 'url')}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Tautan Singkat</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>KPPN Semarang I — Distribusi Cepat &amp; Transparan</span>
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
