import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageSquare,
  Bot,
  X,
  Minus,
  Maximize2,
  Volume2,
  VolumeX,
  Send,
  Music,
  HelpCircle,
  Sparkles,
  RefreshCw,
  Mic,
  Smile,
  Check,
  ChevronDown,
  Move
} from 'lucide-react';
import { NavigationTab, AppUser } from '../types';
import { CuteRobotAvatar } from './CuteRobotAvatar';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  isSinging?: boolean;
}

interface CakraBotProps {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  currentUser?: AppUser | null;
  isDark?: boolean;
}

// Preset lagu-lagu lucu / edukatif perbendaharaan yang bisa dinyanyikan Cakra Bot
const CAKRA_SONGS = [
  {
    title: 'Mars Perbendaharaan Ceria 🎶',
    prompt: 'Cakra, nyanyikan mars perbendaharaan dengan gaya ceria dan semangat pantang mundur!',
    lyrics: `🎵 *Tring-tring! Cakra mulai bernyanyi~* 🎵\n\n🎶 Di sini KPPN Semarang Satu tercinta,\nKawal APBN untuk Indonesia jaya!\nDispensasi IKPA mari kita pantau bersama,\nLangkah Akhir Tahun beres, hati pun gembira! 🎶\n\n✨ *Tarik nafas... Huft!* ✨\n🎶 Satker tertib, SPM meluncur lancar,\nCakra siap bantu bikin senyummu mekar! Lalala~ Horeee! 🎉💃`,
  },
  {
    title: 'Jingle SPM Tepat Waktu ⏱️',
    prompt: 'Cakra, nyanyi jingle SPM tepat waktu dong biar satker gak telat!',
    lyrics: `🎵 *Tut-tut-tut! Bunyi bel SPM!* 🎵\n\n🎶 Jangan tunggu tanggal tua, ayo ajukan segera!\nBAST beres, pendaftaran kontrak jangan lupa,\nLima hari kerja batasnya, ingat-ingat ya kawan semua!\n\n🎤 *Reff:* \nKPPN Semarang Satu, sahabat setia kita,\nCepat, Tepat, Akuntabel, melayani dengan cinta! Asyikkk~ 🎶🕺`,
  },
  {
    title: 'Lagu IKPA Sang Juara 🏆',
    prompt: 'Cakra nyanyikan lagu motivasi nilai IKPA 100!',
    lyrics: `🎵 *Do-Re-Mi~ Cakra bawa piala!* 🎵\n\n🎶 Halaman Tiga DIPA deviasinya dijaga,\nCapaian output terisi seratus angka!\nUP/TUP tuntas tak ada sisa,\nSatker kita mantap, nomor satu di Nusantara! 🌟\n\n✨ *Tralala-trilili, terima kasih semuanya!* ✨`,
  }
];

// Quick prompts perbendaharaan lengkap
const QUICK_SUGGESTIONS = [
  { label: 'Apa itu PER-9/PB/2026? 📜', query: 'Jelaskan apa itu Perdirjen PER-9/PB/2026 tentang LLAT dan poin-poin utamanya!' },
  { label: 'Batas 5 HK SPM & Kontrak? ⏱️', query: 'Bagaimana ketentuan batas waktu 5 hari kerja untuk pendaftaran kontrak dan SPM BAST Oktober?' },
  { label: 'Dispensasi IKPA ND-1423 ⚖️', query: 'Bagaimana syarat dan alur pengajuan dispensasi IKPA menurut ND-1423?' },
  { label: 'SPM Ditolak KPPN? ❌', query: 'Jika SPM ditolak KPPN, berapa lama batas waktu perbaikan sesuai Pasal 19 PER-9/PB/2026?' },
  { label: 'Ayo nyanyi buat aku! 🎤', query: 'Cakra, ayo nyanyi lagu ceria buat menghiburku hari ini!' },
];

export const CakraBotWidget: React.FC<CakraBotProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  isDark = false,
}) => {
  // State panel
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    try {
      return localStorage.getItem('cakra_bot_open') === 'true';
    } catch {
      return false;
    }
  });
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    try {
      return localStorage.getItem('cakra_bot_muted') === 'true';
    } catch {
      return false;
    }
  });

  // =========================================================================
  // DRAGGABLE POSITION STATE (Dapat ditarik / dipindah bebas ke mana saja)
  // =========================================================================
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    try {
      const saved = localStorage.getItem('cakra_bot_position');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          return parsed;
        }
      }
    } catch {}
    // Default: Kanan bawah (window.innerWidth - 110, window.innerHeight - 130)
    if (typeof window !== 'undefined') {
      return {
        x: Math.max(20, window.innerWidth - 110),
        y: Math.max(20, window.innerHeight - 140)
      };
    }
    return { x: 500, y: 500 };
  });

  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number; hasMoved: boolean }>({
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
    hasMoved: false
  });

  // Initial welcome message (reset setiap kali aplikasi direfresh)
  const getInitialWelcomeMessage = (): ChatMessage => ({
    id: `msg-welcome-${Date.now()}`,
    sender: 'bot',
    text: `Halo ${currentUser?.name || 'Sobat Satker'}! 👋\n\nAku **Cakra Bot**, robot asisten AI serba tahu KPPN Semarang I. Kamu bisa **tanya apapun** ke aku—mulai dari aturan perbendaharaan, PER-9/PB/2026, dispensasi IKPA, SAKTI, sampai hal-hal umum lainnya! Cakra juga bisa bersuara, bernyanyi, dan posisiku bisa ditarik/dipindah ke mana saja di layar. Ada yang bisa Cakra bantu? 😊✨`,
    timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
  });

  // State percakapan (Fresh session: otomatis kembali ke awal / tereset saat refresh)
  const [messages, setMessages] = useState<ChatMessage[]>([getInitialWelcomeMessage()]);

  const [inputQuery, setInputQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [showSpeechBubble, setShowSpeechBubble] = useState<boolean>(true);
  const [currentGreetingIndex, setCurrentGreetingIndex] = useState<number>(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const synthRef = useRef<SpeechSynthesis | null>(typeof window !== 'undefined' ? window.speechSynthesis : null);

  // Auto-scroll ke pesan terbaru
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized, scrollToBottom]);

  // Simpan status dan posisi (percakapan TIDAK disimpan di localStorage agar selalu reset saat refresh)
  useEffect(() => {
    try {
      localStorage.setItem('cakra_bot_open', String(isOpen));
      localStorage.setItem('cakra_bot_muted', String(isMuted));
      localStorage.removeItem('cakra_bot_messages'); // Hapus jejak chat lama agar bersih saat refresh
      localStorage.setItem('cakra_bot_position', JSON.stringify(position));
    } catch {}
  }, [isOpen, isMuted, position]);

  // Respon window resize agar robot tidak keluar layar
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => ({
        x: Math.min(Math.max(10, prev.x), window.innerWidth - 90),
        y: Math.min(Math.max(10, prev.y), window.innerHeight - 120)
      }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Bubble greeting berkala di avatar saat tertutup
  const GREETINGS = [
    'Hai! Geser aku ke mana saja sesukamu! 🤖',
    'Tanya regulasi PER-9/PB/2026 atau IKPA ke Cakra yuk! 📜',
    'Pantau batas waktu LLAT bareng Cakra! ⏱️',
    'Klik atau suruh aku bernyanyi! 🎵✨',
  ];

  useEffect(() => {
    if (isOpen) {
      setShowSpeechBubble(false);
      return;
    }
    const interval = setInterval(() => {
      setCurrentGreetingIndex((prev) => (prev + 1) % GREETINGS.length);
      setShowSpeechBubble(true);
      setTimeout(() => setShowSpeechBubble(false), 8000);
    }, 24000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // =========================================================================
  // DRAGGABLE AVATAR TRIGGER (Tombol Robot Melompat)
  // =========================================================================
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y,
      hasMoved: false
    };

    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragRef.current.startX;
    const deltaY = e.clientY - dragRef.current.startY;

    if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
      dragRef.current.hasMoved = true;
    }

    const newX = Math.min(Math.max(10, dragRef.current.initialX + deltaX), window.innerWidth - 90);
    const newY = Math.min(Math.max(10, dragRef.current.initialY + deltaY), window.innerHeight - 120);

    setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {}

    if (!dragRef.current.hasMoved) {
      setIsOpen(true);
    }
  };

  // =========================================================================
  // DRAGGABLE CHAT WINDOW POSITION (Jendela chat & minimize bisa digeser)
  // =========================================================================
  const [modalPosition, setModalPosition] = useState<{ x: number; y: number }>(() => {
    try {
      const saved = localStorage.getItem('cakra_bot_modal_pos');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          return parsed;
        }
      }
    } catch {}
    if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth < 640;
      return {
        x: isMobile ? 16 : Math.max(20, window.innerWidth - 440),
        y: Math.max(20, window.innerHeight - 630)
      };
    }
    return { x: 100, y: 100 };
  });

  const [isModalDragging, setIsModalDragging] = useState<boolean>(false);
  const modalDragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number }>({
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0
  });

  // DRAG LOGIC UNTUK JENDELA CHAT (Drag via Header Bar)
  const handleModalPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    // Hindari trigger drag jika klik tombol kontrol di header (close, mute, song, minimize)
    if ((e.target as HTMLElement).closest('button')) return;

    setIsModalDragging(true);
    modalDragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: modalPosition.x,
      initialY: modalPosition.y
    };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handleModalPointerMove = (e: React.PointerEvent) => {
    if (!isModalDragging) return;
    const deltaX = e.clientX - modalDragRef.current.startX;
    const deltaY = e.clientY - modalDragRef.current.startY;

    const maxW = isMinimized ? 320 : 430;
    const newX = Math.min(Math.max(10, modalDragRef.current.initialX + deltaX), window.innerWidth - maxW);
    const newY = Math.min(Math.max(10, modalDragRef.current.initialY + deltaY), window.innerHeight - (isMinimized ? 70 : 300));

    setModalPosition({ x: newX, y: newY });
  };

  const handleModalPointerUp = (e: React.PointerEvent) => {
    if (!isModalDragging) return;
    setIsModalDragging(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
      localStorage.setItem('cakra_bot_modal_pos', JSON.stringify(modalPosition));
    } catch {}
  };

  // Text to Speech
  const speakBotMessage = useCallback((text: string) => {
    if (isMuted || !synthRef.current) return;
    try {
      synthRef.current.cancel();
      // Bersihkan karakter markdown agar pengucapan alami
      const cleanText = text
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/#/g, '')
        .replace(/`{1,3}[^`]*`{1,3}/g, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/[🎶🎵✨👋🤖⏱️🏆🎤💃🕺🌟📜⚖️❌]/g, '');

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'id-ID';
      utterance.rate = 1.05;
      utterance.pitch = 1.15; // Suara robot agak tinggi ceria & lucu

      const voices = synthRef.current.getVoices();
      const idVoice = voices.find((v) => v.lang.startsWith('id') || v.lang.includes('ID'));
      if (idVoice) {
        utterance.voice = idVoice;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      synthRef.current.speak(utterance);
    } catch (e) {
      console.warn('TTS error:', e);
      setIsSpeaking(false);
    }
  }, [isMuted]);

  // Hentikan suara jika bot di-mute
  const toggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      if (next && synthRef.current) {
        synthRef.current.cancel();
        setIsSpeaking(false);
      }
      return next;
    });
  };

  // Kirim pesan ke API Gemini Server dengan prompt komprehensif perbendaharaan
  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    // Cek apakah user minta nyanyi secara spesifik
    const lower = query.toLowerCase();
    const isSongRequest = lower.includes('nyanyi') || lower.includes('lagu') || lower.includes('sing') || lower.includes('jingle');

    if (isSongRequest) {
      const randomSong = CAKRA_SONGS[Math.floor(Math.random() * CAKRA_SONGS.length)];
      setTimeout(() => {
        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: `Siap Sobat! Ini lagu spesial dari Cakra buat kamu:\n\n**${randomSong.title}**\n\n${randomSong.lyrics}`,
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          isSinging: true,
        };
        setMessages((prev) => [...prev, botMsg]);
        setIsLoading(false);
        speakBotMessage(randomSong.lyrics);
      }, 700);
      return;
    }

    try {
      const systemInstruction = `Kamu adalah "Cakra Bot", robot maskot pintar, ramah, lucu, dan serba tahu dari KPPN Tipe A1 Semarang I (Kode 026) - Ditjen Perbendaharaan Kementerian Keuangan.
TAHUN BERJALAN SISTEM: Tahun Anggaran 2026.
PERATURAN RESMI BERLAKU: Peraturan Direktur Jenderal Perbendaharaan Nomor PER-9/PB/2026 tentang Pedoman Pelaksanaan Penerimaan dan Pengeluaran Negara pada Akhir Tahun Anggaran 2026 (LLAT TA 2026).
JANGAN PERNAH MENYATAKAN SEKARANG MASIH 2024 ATAU PER-9/PB/2026 BELUM TERBIT! Di sistem ANGKASA, PER-9/PB/2026 adalah dasar hukum aktif yang sedang dipantau.

PENGETAHUAN LENGKAP PERBENDAHARAAN & APLIKASI ANGKASA:
1. LLAT (Langkah-Langkah Akhir Tahun 2026 - PER-9/PB/2026):
   - Pendaftaran Kontrak: paling lambat 5 (lima) Hari Kerja setelah penandatanganan (Pasal 6 ayat 2 & ayat 3). Khusus Desember diatur jadwal bertahap (7 Des, 14 Des, 21 Des, dan penutupan NRK 23 Des).
   - SPM BAST Oktober: BAST/BAPP/Jaminan terbit Oktober berlaku batas 5 Hari Kerja (Pasal 18 ayat 1 huruf b) dengan batas mutlak 6 November 2026.
   - SPM BAST November: Pengajuan secara bertahap (gelondongan): BAST 1-15 Nov diajukan s.d. 20 Nov 2026, BAST 16-30 Nov diajukan s.d. 7 Des 2026.
   - SPM Ditolak KPPN: Sesuai Pasal 19 PER-9/PB/2026, jika SPM ditolak oleh KPPN, Satker dapat mengajukan kembali perbaikan paling lambat 2 Hari Kerja setelah tanggal penolakan (pukul 15:00 WIB untuk Okt/Nov, pukul 17:00 WIB untuk Des) dengan melampirkan bukti penolakan.
   - Gaji Induk Januari 2027: Diajukan paling lambat 7 Desember 2026.
   - SPM UP/TUP dan Nihil: Batas akhir pertanggungjawaban TUP dan pengajuan SPM Nihil/GUP Nihil akhir tahun.
2. DISPENSASI IKPA (ND-1423):
   - Alur Dispensasi: Satker ajukan surat permohonan dispensasi -> diverifikasi KPPN -> diteruskan rekomendasi Kanwil DJPb Jateng -> Putusan persetujuan/penolakan final dari Kantor Pusat DJPb.
   - Kriteria Dispensasi: Gangguan jaringan SAKTI/SPAN terpusat, bencana alam, keadaan kahar, perubahan kebijakan mendadak.
3. KINERJA IKPA (8 INDIKATOR):
   - Revisi DIPA, Deviasi Halaman III DIPA (maks 5%), Penyerapan Anggaran per Triwulan, Belanja Kontraktual, Penyelesaian Tagihan (SPM-LS 17 hari kalender), Pengelolaan UP/TUP (revolving 1 bulan), Dispensasi SPM, Capaian Output (terkonfirmasi & valid).
4. AKUNTANSI & REKONSILIASI:
   - Rekonsiliasi SAKTI-SPAN (MonSAKTI), LPJ Bendahara Pengeluaran & Penerimaan, saldo kas di bendahara.
5. SERTIFIKASI PEJABAT:
   - Sertifikasi PPK, PPSPM, dan Bendahara (PNT/SNT/BNT), perpanjangan masa berlaku sertifikat kompetensi.
6. KONTAK & LAYANAN KPPN SEMARANG I:
   - Alamat: Jl. Ki Mangunsarkoro No. 34 Semarang. Telepon: (024) 8414441. Layanan HAI CSO online dan tatap muka: Cepat, Tepat, Akuntabel, dan Tanpa Biaya (Gratis)!

Gaya Menjawab: Sangat ramah, sopan, antusias, cerdas, runtut, jelas mengutip regulasi/pasal bila relevan, dan menggunakan emoji yang ceria.`;

      const res = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gemini-3.1-flash-lite',
          prompt: query,
          systemInstruction,
        }),
      });

      const data = await res.json();
      let botReply = '';

      if (data && data.success && data.text) {
        botReply = data.text;
      } else {
        // Fallback cerdas mandiri jika server Gemini sedang sibuk atau offline
        botReply = generateSmartFallbackReply(query, activeTab);
      }

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: botReply,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
      speakBotMessage(botReply);
    } catch (err) {
      console.warn('Cakra bot fetch error, using smart local fallback:', err);
      const fallbackReply = generateSmartFallbackReply(query, activeTab);
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: fallbackReply,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
      speakBotMessage(fallbackReply);
    } finally {
      setIsLoading(false);
    }
  };

  // Fallback respons lokal jika koneksi API terputus
  const generateSmartFallbackReply = (q: string, tab: NavigationTab): string => {
    const lq = q.toLowerCase();

    // 1. Deteksi PER-9/PB/2026 dan LLAT 2026
    if (
      lq.includes('per-9') ||
      lq.includes('perdirjen 9') ||
      lq.includes('perdirjen') ||
      lq.includes('per 9') ||
      lq.includes('9 2026') ||
      lq.includes('llat') ||
      lq.includes('langkah akhir tahun')
    ) {
      return `Tentu saja aku tahu! **PER-9/PB/2026** adalah Peraturan Direktur Jenderal Perbendaharaan tentang Pedoman Pelaksanaan Penerimaan dan Pengeluaran Negara pada Akhir Tahun Anggaran 2026 (LLAT TA 2026).\n\n📌 **Ketentuan Pokok PER-9/PB/2026 yang Wajib Diketahui:**\n1. **Pendaftaran Kontrak (Pasal 6):** Wajib didaftarkan ke KPPN paling lambat **5 Hari Kerja (H+5 HK)** setelah tanggal penandatanganan kontrak/addendum.\n2. **SPM-LS BAST Oktober (Pasal 18 ayat 1b):** Untuk BAST/BAPP/Jaminan terbit Oktober berlaku batas **5 Hari Kerja** (batas mutlak sapu jagat 6 November 2026 pukul 15:00 WIB).\n3. **SPM-LS BAST November:** Diajukan secara gelondongan bertahap (BAST 1–15 Nov batasnya 20 Nov 2026, BAST 16–30 Nov batasnya 7 Des 2026).\n4. **SPM Ditolak KPPN (Pasal 19):** Jika SPM ditolak oleh KPPN, perbaikan diajukan paling lambat **2 Hari Kerja** setelah tanggal penolakan pukul 15:00 WIB dengan melampirkan bukti penolakan KPPN.\n5. **Gaji Induk Januari 2027:** SPM diajukan paling lambat 7 Desember 2026.\n\nKamu bisa melihat jadwal interaktif dan kalender lengkapnya di tab **Monitoring LLAT**! 🗓️✨`;
    }

    // 2. Deteksi Dispensasi IKPA & ND-1423
    if (lq.includes('dispensasi') || lq.includes('ikpa') || lq.includes('nd-1423') || lq.includes('nd 1423')) {
      return `Terkait **Dispensasi IKPA (ND-1423/PB/2024 / Regulasi Dispensasi)**:\n- Permohonan dispensasi diajukan jika Satker mengalami kendala mendesak atau gangguan teknis sistem (SAKTI/SPAN) yang mengakibatkan keterlambatan SPM, pendaftaran kontrak, atau deviasi Hal III DIPA.\n- **Alur Persetujuan:** Satker ajukan permohonan online -> Diverifikasi KPPN Semarang I -> Rekomendasi Kanwil DJPb Jateng -> Keputusan Final Kantor Pusat DJPb.\n- Klik tombol *"Ajukan Dispensasi"* di tab Dispensasi IKPA untuk mengajukan langsung berkasmu! ⚖️📝`;
    }

    // 3. Deteksi SPM Ditolak / Pasal 19
    if (lq.includes('pasal 19') || lq.includes('spm ditolak') || lq.includes('tolak') || lq.includes('revisi spm')) {
      return `Sesuai **Pasal 19 PER-9/PB/2026**, dalam hal SPM yang diajukan oleh Satker ditolak oleh KPPN, Satker dapat mengajukan kembali perbaikan SPM paling lambat **2 (dua) Hari Kerja** setelah tanggal penolakan SPM oleh KPPN (pukul 15:00 WIB untuk periode Okt–Nov, dan pukul 17:00 WIB untuk Des) dengan melampirkan bukti surat/lembar penolakan SPM resmi dari KPPN. ⏱️📑`;
    }

    // 4. Deteksi Alamat & Layanan KPPN Semarang I
    if (lq.includes('alamat') || lq.includes('kontak') || lq.includes('kppn') || lq.includes('semarang')) {
      return `📍 **KPPN Tipe A1 Semarang I (Kode 026)** beralamat di Jalan Ki Mangunsarkoro No. 34, Semarang 50241. Telepon: (024) 8414441. Layanan tatap muka dan online HAI CSO siap melayani seluruh 127 Satker dengan integritas dan tanpa biaya (Gratis)! 🏛️✨`;
    }

    // 5. General AI response helper
    return `Halo! Cakra mengerti pertanyaanmu tentang "${q}". Sebagai AI Asisten KPPN Semarang I, aku siap menjawab materi perbendaharaan seperti PER-9/PB/2026, LLAT, Dispensasi IKPA, Deviasi Hal III DIPA, Rekonsiliasi SAKTI, LPJ Bendahara, UP/TUP, maupun hal-hal lainnya. Ada hal spesifik yang ingin kamu ketahui? Tanyakan saja pada Cakra! 🤖✨`;
  };

  return (
    <>
      {/* 1. FLOATING DRAGGABLE AVATAR BUTTON (Bisa digeser & ditarik bebas) */}
      {!isOpen && (
        <div
          style={{
            position: 'fixed',
            left: `${position.x}px`,
            top: `${position.y}px`,
            zIndex: 99980,
            touchAction: 'none'
          }}
          className="select-none flex items-end gap-3"
        >
          {/* Speech Bubble Cute Greeting */}
          {showSpeechBubble && (
            <div
              onClick={() => setIsOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-xl border border-indigo-200 dark:border-indigo-700/60 text-xs font-semibold cursor-pointer animate-bounce hover:scale-105 transition-all -ml-64 pointer-events-auto"
            >
              <Sparkles className="w-4 h-4 text-amber-500 animate-spin" style={{ animationDuration: '3s' }} />
              <span className="truncate max-w-[200px]">{GREETINGS[currentGreetingIndex]}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSpeechBubble(false);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Maskot Robot Jumping Cute Character Button (Draggable) */}
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            title="Klik untuk Chat, Tahan & Geser untuk Memindahkan Posisi Cakra Bot"
            className={`relative group flex flex-col items-center justify-end transition-transform duration-200 cursor-grab active:cursor-grabbing ${
              isDragging ? 'scale-110 opacity-90' : 'hover:scale-105'
            }`}
          >
            {/* Free Standing Jumping Cute Robot Character with Hands & Legs */}
            <div className="relative w-20 h-24 flex items-center justify-center pointer-events-none">
              <CuteRobotAvatar
                className="w-20 h-24"
                isSpeaking={isSpeaking}
                isHovered={isDragging}
                showFullBody={true}
              />

              {/* Bot status badge (Green online dot dekat kaki) */}
              <span className="absolute bottom-3 right-2 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 shadow-md animate-pulse" title="Online" />
            </div>

            {/* Drag handle pill kecil di bawah bayangan */}
            <div className="mt-0.5 px-2 py-0.5 rounded-full bg-slate-900/80 text-white text-[8px] font-mono font-bold flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity shadow-xs pointer-events-none">
              <Move className="w-2.5 h-2.5 text-cyan-300" />
              <span>Geser Cakra</span>
            </div>

            {/* Hover Tooltip Label */}
            <span className="absolute -top-7 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-slate-900/95 border border-indigo-500/50 text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl pointer-events-none flex items-center gap-1">
              🤖 Cakra Bot KPPN
            </span>
          </div>
        </div>
      )}

      {/* 2. DIALOG BOX CHATBOT (Expand / Minimize Modal - Draggable via Header) */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            left: `${modalPosition.x}px`,
            top: `${modalPosition.y}px`,
            zIndex: 99995,
            touchAction: 'none'
          }}
          className={`shadow-2xl rounded-3xl overflow-hidden flex flex-col border border-indigo-200/80 dark:border-indigo-900/60 bg-white dark:bg-slate-900 transition-shadow ${
            isModalDragging ? 'shadow-indigo-500/30 ring-2 ring-indigo-400' : ''
          } ${
            isMinimized
              ? 'w-72 sm:w-80 h-auto'
              : 'w-[calc(100vw-2rem)] sm:w-[420px] max-w-[430px] h-[600px] max-h-[85vh]'
          }`}
        >
          {/* HEADER CHATBOT (DRAG HANDLE UNTUK MEMINDAHKAN JENDELA CHAT) */}
          <div
            onPointerDown={handleModalPointerDown}
            onPointerMove={handleModalPointerMove}
            onPointerUp={handleModalPointerUp}
            onPointerCancel={handleModalPointerUp}
            title="Tahan & geser header ini untuk memindahkan posisi jendela chat"
            className={`p-3.5 bg-gradient-to-r from-indigo-700 via-indigo-600 to-cyan-600 text-white flex items-center justify-between shadow-md shrink-0 select-none cursor-grab active:cursor-grabbing ${
              isModalDragging ? 'cursor-grabbing' : ''
            }`}
          >
            <div className="flex items-center gap-2.5 pointer-events-none">
              <div className="relative w-10 h-10 rounded-2xl bg-slate-900/40 p-0.5 flex items-center justify-center border border-white/30 overflow-hidden shadow-inner">
                <CuteRobotAvatar
                  className="w-9 h-9"
                  isSpeaking={isSpeaking}
                  showFullBody={false}
                />
                {isSpeaking && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-cyan-300 animate-ping" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-black tracking-tight leading-none">
                    Cakra Bot
                  </h3>
                  <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-emerald-400 text-slate-950">
                    AI Online
                  </span>
                  <Move className="w-3 h-3 text-cyan-200 opacity-60 ml-1" title="Bisa Digeser" />
                </div>
                <p className="text-[10px] text-indigo-100 font-medium truncate max-w-[170px]">
                  Tahan &amp; geser untuk pindah posisi
                </p>
              </div>
            </div>

            {/* Header Controls: Mute, Song, Minimize, Close */}
            <div className="flex items-center gap-1">
              {/* Button Nyanyi Cepat */}
              {/* Button Reset Chat */}
              {!isMinimized && (
                <button
                  type="button"
                  onClick={() => {
                    setMessages([getInitialWelcomeMessage()]);
                    if (synthRef.current) synthRef.current.cancel();
                  }}
                  title="Reset Percakapan ke Awal (Bersihkan Obrolan)"
                  className="p-1.5 rounded-xl bg-white/15 hover:bg-white/30 text-emerald-200 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Button Nyanyi Cepat */}
              {!isMinimized && (
                <button
                  type="button"
                  onClick={() => handleSendMessage('Cakra, ayo nyanyi lagu ceria buat menghiburku hari ini!')}
                  title="Suruh Cakra Bernyanyi 🎤"
                  className="p-1.5 rounded-xl bg-white/15 hover:bg-white/30 text-amber-300 transition-colors cursor-pointer"
                >
                  <Music className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Mute / Unmute Button */}
              <button
                type="button"
                onClick={toggleMute}
                title={isMuted ? 'Aktifkan Suara Robot' : 'Mute Suara Robot'}
                className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                  isMuted ? 'bg-rose-500/80 text-white' : 'bg-white/15 hover:bg-white/30 text-white'
                }`}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-200" />}
              </button>

              {/* Minimize / Expand Button */}
              <button
                type="button"
                onClick={() => setIsMinimized((prev) => !prev)}
                title={isMinimized ? 'Perbesar Chat' : 'Minimize Chat'}
                className="p-1.5 rounded-xl bg-white/15 hover:bg-white/30 text-white transition-colors cursor-pointer"
              >
                {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Tutup Cakra Bot"
                className="p-1.5 rounded-xl bg-white/15 hover:bg-rose-600 text-white transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* KONTEN CHAT (Jika tidak di-minimize) */}
          {!isMinimized && (
            <>
              {/* AREA PESAN CHAT */}
              <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-slate-50/70 dark:bg-slate-900/60 text-xs">
                {messages.map((m) => {
                  const isBot = m.sender === 'bot';
                  return (
                    <div
                      key={m.id}
                      className={`flex items-start gap-2 ${isBot ? 'justify-start' : 'justify-end'}`}
                    >
                      {isBot && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-500 p-0.5 shrink-0 shadow-sm mt-0.5">
                          <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center p-0.5">
                            <CuteRobotAvatar className="w-full h-full" isSpeaking={isSpeaking} showFullBody={false} />
                          </div>
                        </div>
                      )}

                      <div
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-sm leading-relaxed ${
                          isBot
                            ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700/80 rounded-tl-xs'
                            : 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-tr-xs shadow-indigo-500/20'
                        } ${m.isSinging ? 'border-2 border-amber-400 bg-amber-50/90 dark:bg-amber-950/40 text-amber-950 dark:text-amber-100' : ''}`}
                      >
                        {/* Teks pesan */}
                        <div className="whitespace-pre-wrap break-words">{m.text}</div>

                        {/* Waktu & Tombol Dengarkan Ulang */}
                        <div className={`mt-1.5 flex items-center justify-between gap-2 text-[9px] font-mono ${isBot ? 'text-slate-400' : 'text-indigo-200'}`}>
                          <span>{m.timestamp}</span>
                          {isBot && (
                            <button
                              type="button"
                              onClick={() => speakBotMessage(m.text)}
                              title="Dengarkan Suara Cakra"
                              className="hover:text-indigo-500 flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <Volume2 className="w-3 h-3" />
                              <span>Baca</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {isLoading && (
                  <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-xs py-1">
                    <div className="w-6 h-6 rounded-full bg-indigo-600/20 flex items-center justify-center animate-pulse">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
                    </div>
                    <span className="font-medium animate-pulse">Cakra sedang berpikir &amp; merangkai jawaban... 🤖</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* QUICK CHIPS SUGGESTIONS */}
              <div className="px-3 py-1.5 bg-slate-100/90 dark:bg-slate-800/80 border-t border-slate-200/70 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
                {QUICK_SUGGESTIONS.map((sug, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSendMessage(sug.query)}
                    className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-700/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-[10px] font-medium whitespace-nowrap shrink-0 transition-colors shadow-2xs cursor-pointer flex items-center gap-1"
                  >
                    <span>{sug.label}</span>
                  </button>
                ))}
              </div>

              {/* INPUT BAR */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="p-2.5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 shrink-0"
              >
                <input
                  ref={chatInputRef}
                  type="text"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  placeholder="Ketik pertanyaan atau 'Cakra ayo nyanyi'..."
                  disabled={isLoading}
                  className="flex-1 px-3.5 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all"
                />

                <button
                  type="submit"
                  disabled={!inputQuery.trim() || isLoading}
                  className="p-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 disabled:opacity-40 text-white shadow-md shadow-indigo-600/30 transition-all cursor-pointer disabled:cursor-not-allowed shrink-0"
                  title="Kirim Pesan"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          )}

          {/* TAMPILAN MINI (Saat di-minimize) */}
          {isMinimized && (
            <div
              onClick={() => setIsMinimized(false)}
              className="p-3 bg-white dark:bg-slate-900 flex items-center justify-between text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-slate-700 dark:text-slate-200 font-medium truncate">
                  Klik untuk membuka chat Cakra Bot
                </span>
              </div>
              <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
            </div>
          )}
        </div>
      )}
    </>
  );
};
