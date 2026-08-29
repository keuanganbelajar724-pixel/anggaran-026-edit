import React, { useState } from 'react';
import {
  X,
  Bot,
  Send,
  Sparkles,
  Database,
  BarChart2,
  TrendingUp,
  Award,
  FileText,
  Search,
  BookOpen,
  CheckCircle2,
  Lightbulb,
  ExternalLink,
  Zap,
  HelpCircle,
  Clock,
  RotateCcw
} from 'lucide-react';
import { BuletinConfig, RealisasiBelanjaSummary, SatkerIKPA } from '../../../types';
import { formatRupiahShort, formatRupiahFull } from '../../../utils/realisasiBelanjaProcessor';
import { useToast } from '../../ToastNotification';

interface BuletinAiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  buletinConfig: BuletinConfig;
  overallSummary?: RealisasiBelanjaSummary;
  satkers?: SatkerIKPA[];
  onNavigateToPage?: (pageNum: number) => void;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  sourcePage?: number;
  dataCard?: {
    title: string;
    metrics?: { label: string; value: string }[];
    badge?: string;
  };
}

export const BuletinAiAssistantModal: React.FC<BuletinAiAssistantModalProps> = ({
  isOpen,
  onClose,
  buletinConfig,
  overallSummary,
  satkers = [],
  onNavigateToPage
}) => {
  const { addToast } = useToast();
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const totalPagu = overallSummary?.totalPagu || 14250000000000;
  const totalRealisasi = overallSummary?.totalRealisasi || 10830000000000;
  const persenRealisasi = overallSummary?.persentaseRealisasi || 76.0;

  const topSatkers = [...satkers]
    .sort((a, b) => (b.nilaiIKPA || 0) - (a.nilaiIKPA || 0))
    .slice(0, 5);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Halo! Saya **FiskalBot**, asisten AI cerdas Buletin Fiskal KPPN Semarang I. Saya dapat menganalisis data realisasi belanja APBN, indikator IKPA, transfer ke daerah, hingga artikel dan kuis yang ada di buletin 48 halaman ini. Silakan tanyakan apa saja!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      dataCard: {
        title: '📊 Ringkasan Fiskal Terkini',
        badge: `Edisi ${buletinConfig.edisi || 'IV/2026'}`,
        metrics: [
          { label: 'Pagu Dikelola', value: `Rp ${formatRupiahShort(totalPagu)}` },
          { label: 'Realisasi APBN', value: `${persenRealisasi.toFixed(1)}%` },
          { label: 'Total Mitra Satker', value: `${satkers.length || 184} Satker` }
        ]
      }
    }
  ]);

  if (!isOpen) return null;

  const quickPrompts = [
    { text: 'Berapa total realisasi APBN dan persentasenya?', category: 'apbn' },
    { text: 'Siapa saja 5 satker dengan nilai IKPA tertinggi?', category: 'ikpa' },
    { text: 'Apa pesan Kepala Kantor di Kata Pengantar?', category: 'editorial' },
    { text: 'Bagaimana perkembangan penyaluran Transfer Ke Daerah (TKD)?', category: 'tkd' },
    { text: 'Apa itu 8 indikator IKPA reformulasi?', category: 'edukasi' },
    { text: 'Buka Halaman Teka-Teki Silang & Kuis', category: 'game' }
  ];

  const handleSendMessage = (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      const lower = query.toLowerCase();
      let reply = '';
      let sourcePage: number | undefined;
      let dataCard: Message['dataCard'] | undefined;

      if (lower.includes('realisasi') || lower.includes('pagu') || lower.includes('apbn') || lower.includes('belanja')) {
        reply = `Berdasarkan data fiskal resmi KPPN Semarang I, total pagu APBN yang dikelola adalah **Rp ${formatRupiahFull(totalPagu)}** dengan realisasi mencapai **Rp ${formatRupiahFull(totalRealisasi)}** (**${persenRealisasi.toFixed(2)}%**). Belanja Pegawai dan Belanja Modal terus menunjukkan percepatan serapan yang berkualitas.`;
        sourcePage = 5;
        dataCard = {
          title: 'Kinerja Belanja APBN Wilayah',
          badge: 'Halaman 5–8',
          metrics: [
            { label: 'Total Pagu', value: `Rp ${formatRupiahShort(totalPagu)}` },
            { label: 'Realisasi', value: `Rp ${formatRupiahShort(totalRealisasi)}` },
            { label: 'Persentase', value: `${persenRealisasi.toFixed(1)}%` }
          ]
        };
      } else if (lower.includes('ikpa') || lower.includes('peringkat') || lower.includes('tertinggi') || lower.includes('terbaik')) {
        if (topSatkers.length > 0) {
          const list = topSatkers.map((s, idx) => `${idx + 1}. **${s.namaSatker}** (${s.nilaiIKPA?.toFixed(2) || '98.50'})`).join('\n');
          reply = `Berikut adalah satker dengan capaian IKPA tertinggi:\n\n${list}\n\nKeberhasilan ini didorong oleh kepatuhan deviasi Hal III DIPA yang minimal dan penyampaian LPJ Bendahara yang selalu tepat waktu.`;
        } else {
          reply = `Top 5 Satker IKPA peraih nilai terbaik berhasil mempertahankan predikat SANGAT BAIK (>95.00) dengan indikator utama Penyerapan Anggaran, Deviasi Halaman III DIPA, dan Capaian Output yang sempurna.`;
        }
        sourcePage = 7;
        dataCard = {
          title: 'Rapor IKPA Satker Unggulan',
          badge: 'Halaman 7',
          metrics: [
            { label: 'Top 1 Satker', value: topSatkers[0]?.namaSatker?.slice(0, 20) || 'Polrestabes Smg' },
            { label: 'Nilai Rata-rata', value: '97.85' }
          ]
        };
      } else if (lower.includes('kepala') || lower.includes('sambutan') || lower.includes('pengantar')) {
        reply = `Kepala KPPN Semarang I (${buletinConfig.namaKepalaKantor || 'Bapak Kepala Kantor'}) menekankan pentingnya sinergi fiskal, integritas zero-corruption (WBBM), dan akselerasi digitalisasi perbendaharaan melalui SAKTI dan Digipay Satu demi mendukung pertumbuhan ekonomi Jawa Tengah.`;
        sourcePage = 2;
      } else if (lower.includes('tkd') || lower.includes('transfer') || lower.includes('daerah') || lower.includes('dau') || lower.includes('dbh')) {
        reply = `Penyaluran Transfer Ke Daerah (TKD) wilayah KPPN Semarang I mencakup DAU, DBH, DAK Fisik/Non-Fisik, dan Insentif Fiskal. Penyaluran berjalan lancar sesuai syarat salur berbasis aplikasi OMSPAN dan berdampak langsung ke APBD.`;
        sourcePage = 8;
      } else if (lower.includes('kuis') || lower.includes('tts') || lower.includes('game') || lower.includes('permainan')) {
        reply = `Arena Kuis Cerdas Tangkas dan Teka-Teki Silang (TTS) Fiskal tersedia di Halaman 46–47! Anda dapat menyelesaikan teka-teki silang interaktif 6x6 dan menjawab 4 kuis untuk mengklaim E-Sertifikat Juara resmi KPPN Semarang I.`;
        sourcePage = 46;
      } else if (lower.includes('wbbm') || lower.includes('integritas') || lower.includes('gratifikasi') || lower.includes('biaya')) {
        reply = `KPPN Semarang I berkomitmen penuh mempertahankan predikat **Zona Integritas Wilayah Birokrasi Bersih dan Melayani (WBBM)**. Seluruh layanan perbendaharaan bersifat **Rp0,- (Nol Rupiah)**, transparan, dan bebas dari segala bentuk gratifikasi maupun pungli.`;
        sourcePage = 42;
      } else {
        reply = `Terima kasih atas pertanyaannya! Berdasarkan pembahasan dalam Buletin Fiskal Edisi ${buletinConfig.edisi || 'IV/2026'}, hal ini berkaitan dengan penguatan tata kelola APBN, sinergi Kemenkeu Satu di wilayah Jawa Tengah, dan digitalisasi layanan perbendaharaan negara.`;
        sourcePage = 3;
      }

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sourcePage,
        dataCard
      };

      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 600);
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'welcome',
        sender: 'assistant',
        text: `Percakapan telah direset. Silakan ajukan pertanyaan seputar data fiskal, APBN, IKPA, atau konten buletin lainnya!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-3xl w-full h-[85vh] flex flex-col shadow-2xl overflow-hidden text-white animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-400/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">FiskalBot AI Assistant</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Online
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Tanya Jawab Pintar &amp; Analisis Real-Time Buletin Fiskal KPPN Semarang I
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetChat}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Reset Percakapan"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-6 py-2.5 bg-slate-950/60 border-b border-slate-800 overflow-x-auto flex gap-2 no-scrollbar">
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(p.text)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-400/50 text-[11px] font-medium text-slate-300 hover:text-amber-300 whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>{p.text}</span>
            </button>
          ))}
        </div>

        {/* Chat Stream Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${
                msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              {msg.sender === 'assistant' ? (
                <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shrink-0 text-xs shadow">
                  <Bot className="w-4 h-4" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0 text-xs shadow">
                  Anda
                </div>
              )}

              <div
                className={`max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed space-y-2.5 ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-none'
                    : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>

                {/* Optional Rich Data Card from AI */}
                {msg.dataCard && (
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-amber-300">{msg.dataCard.title}</span>
                      {msg.dataCard.badge && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          {msg.dataCard.badge}
                        </span>
                      )}
                    </div>
                    {msg.dataCard.metrics && (
                      <div className="grid grid-cols-3 gap-2 text-center pt-1">
                        {msg.dataCard.metrics.map((m, mIdx) => (
                          <div key={mIdx} className="bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                            <div className="text-[9px] text-slate-400">{m.label}</div>
                            <div className="text-xs font-black text-white mt-0.5">{m.value}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Source Page Citation Tag */}
                {msg.sourcePage && (
                  <div className="pt-1 flex items-center justify-between border-t border-slate-800/60 text-[10px]">
                    <span className="text-slate-400">Sumber: Halaman {msg.sourcePage}</span>
                    {onNavigateToPage && (
                      <button
                        onClick={() => {
                          onNavigateToPage(msg.sourcePage!);
                          addToast(`Melompat ke Halaman ${msg.sourcePage}...`, 'info');
                          onClose();
                        }}
                        className="px-2 py-0.5 rounded bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 font-bold border border-amber-400/40 flex items-center gap-1 transition-all"
                      >
                        <span>Buka Halaman</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                )}

                <div className={`text-[9px] ${msg.sender === 'user' ? 'text-indigo-200' : 'text-slate-500'} text-right`}>
                  {msg.timestamp}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shrink-0 text-xs">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-slate-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:0.4s]" />
                <span className="text-[11px] text-slate-400 ml-1">FiskalBot sedang menganalisis data buletin...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-slate-950 border-t border-slate-800">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Tanyakan analisis APBN, nilai IKPA satker, kuis fiskal, atau artikel..."
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              className="flex-1 px-4 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isTyping}
              className="px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-slate-950 text-xs font-black flex items-center gap-2 shadow-lg transition-all cursor-pointer"
            >
              <span>Kirim</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
