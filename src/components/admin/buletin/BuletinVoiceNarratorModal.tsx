import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  FastForward,
  Rewind,
  Sparkles,
  Languages,
  Mic,
  Headphones,
  CheckCircle2
} from 'lucide-react';
import { useToast } from '../../ToastNotification';

interface BuletinVoiceNarratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPage: number;
  currentPageTitle: string;
  pageTextContent: string;
  onNavigatePage: (pageNum: number) => void;
  totalPages: number;
}

export const BuletinVoiceNarratorModal: React.FC<BuletinVoiceNarratorModalProps> = ({
  isOpen,
  onClose,
  currentPage,
  currentPageTitle,
  pageTextContent,
  onNavigatePage,
  totalPages
}) => {
  const { addToast } = useToast();
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [rate, setRate] = useState<number>(1.0);
  const [pitch, setPitch] = useState<number>(1.0);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState<number>(0);
  const [sentences, setSentences] = useState<string[]>([]);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [autoAdvance, setAutoAdvance] = useState<boolean>(true);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Parse text into sentences
  useEffect(() => {
    if (pageTextContent) {
      // Split by punctuation and cleanup
      const clean = pageTextContent
        .replace(/\s+/g, ' ')
        .replace(/[^\w\s.,!?:;%()\-–—]/g, '');
      const rawSentences = clean
        .split(/(?<=[.!?])\s+/)
        .map(s => s.trim())
        .filter(s => s.length > 5);

      setSentences(rawSentences.length > 0 ? rawSentences : [clean]);
      setCurrentSentenceIndex(0);
    }
  }, [pageTextContent, currentPage]);

  // Load available browser voices
  useEffect(() => {
    const updateVoices = () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const available = window.speechSynthesis.getVoices();
        setVoices(available);
        
        // Find Indonesian voice or default to Google/Natural voice
        const idVoice = available.find(
          v => v.lang.startsWith('id') || v.name.toLowerCase().includes('indonesia')
        );
        const preferred = idVoice || available[0] || null;
        setSelectedVoice(preferred);
      }
    };

    updateVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }

    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Stop audio on modal close
  useEffect(() => {
    if (!isOpen) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlaying(false);
      setIsPaused(false);
    }
  }, [isOpen]);

  const speakSentence = (index: number) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      addToast('Browser Anda tidak mendukung Text-to-Speech API.', 'warning');
      return;
    }

    window.speechSynthesis.cancel();

    if (index >= sentences.length) {
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentSentenceIndex(0);
      
      if (autoAdvance && currentPage < totalPages) {
        addToast(`Selesai membaca Halaman ${currentPage}. Lanjut ke Halaman ${currentPage + 1}...`, 'info');
        onNavigatePage(currentPage + 1);
      }
      return;
    }

    const textToSpeak = sentences[index];
    if (!textToSpeak) return;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.lang = selectedVoice?.lang || 'id-ID';

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
      setCurrentSentenceIndex(index);
    };

    utterance.onend = () => {
      if (index + 1 < sentences.length) {
        speakSentence(index + 1);
      } else {
        setIsPlaying(false);
        setIsPaused(false);
        if (autoAdvance && currentPage < totalPages) {
          addToast(`Membaca selesai. Membuka Halaman ${currentPage + 1}...`, 'info');
          onNavigatePage(currentPage + 1);
        }
      }
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const handlePlayPause = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (isPlaying) {
      if (isPaused) {
        window.speechSynthesis.resume();
        setIsPaused(false);
      } else {
        window.speechSynthesis.pause();
        setIsPaused(true);
      }
    } else {
      speakSentence(currentSentenceIndex);
    }
  };

  const handleStop = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentSentenceIndex(0);
  };

  const handleNextSentence = () => {
    const nextIdx = Math.min(sentences.length - 1, currentSentenceIndex + 1);
    speakSentence(nextIdx);
  };

  const handlePrevSentence = () => {
    const prevIdx = Math.max(0, currentSentenceIndex - 1);
    speakSentence(prevIdx);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-xl w-full flex flex-col shadow-2xl overflow-hidden text-white animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">Voice Narrator AI</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Text-to-Speech
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Mendengarkan Halaman {currentPage}: {currentPageTitle}
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

        {/* Content Box with Active Sentence Highlighting */}
        <div className="p-6 overflow-y-auto max-h-[320px] bg-slate-950/50 border-b border-slate-800 space-y-3">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Naskah Narasi Halaman</span>
            <span>
              Kalimat {currentSentenceIndex + 1} / {sentences.length || 1}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-sm leading-relaxed text-slate-300 space-y-2">
            {sentences.map((sent, idx) => (
              <span
                key={idx}
                onClick={() => speakSentence(idx)}
                className={`cursor-pointer transition-all duration-150 rounded px-1.5 py-0.5 inline-block ${
                  idx === currentSentenceIndex && isPlaying
                    ? 'bg-amber-400 text-slate-950 font-bold shadow-sm scale-[1.01]'
                    : idx < currentSentenceIndex
                    ? 'text-slate-500'
                    : 'hover:text-white hover:bg-slate-800'
                }`}
              >
                {sent}{' '}
              </span>
            ))}
            {sentences.length === 0 && (
              <p className="text-slate-500 italic">Tidak ada naskah teks terbaca di halaman ini.</p>
            )}
          </div>
        </div>

        {/* Player Controls & Voice Settings */}
        <div className="p-6 space-y-4">
          {/* Main Controls */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handlePrevSentence}
              disabled={currentSentenceIndex === 0}
              className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white transition-colors"
              title="Kalimat Sebelumnya"
            >
              <Rewind className="w-5 h-5" />
            </button>

            <button
              onClick={handlePlayPause}
              className={`p-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 transition-all shadow-lg ${
                isPlaying && !isPaused
                  ? 'bg-amber-400 text-slate-950 hover:bg-amber-300 shadow-amber-500/20'
                  : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-600/30'
              }`}
            >
              {isPlaying && !isPaused ? (
                <>
                  <Pause className="w-5 h-5" />
                  <span>Jeda Narasi</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 ml-0.5" />
                  <span>{isPaused ? 'Lanjutkan' : 'Mulai Membaca'}</span>
                </>
              )}
            </button>

            <button
              onClick={handleStop}
              className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Hentikan Narasi"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            <button
              onClick={handleNextSentence}
              disabled={currentSentenceIndex >= sentences.length - 1}
              className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white transition-colors"
              title="Kalimat Selanjutnya"
            >
              <FastForward className="w-5 h-5" />
            </button>
          </div>

          {/* Sliders and Options */}
          <div className="grid grid-cols-2 gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs">
            <div>
              <label className="text-slate-400 block mb-1 font-medium">Kecepatan Suara: {rate}x</label>
              <input
                type="range"
                min="0.75"
                max="1.5"
                step="0.1"
                value={rate}
                onChange={e => setRate(parseFloat(e.target.value))}
                className="w-full accent-amber-400"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-medium">Karakter Nada: {pitch}</label>
              <input
                type="range"
                min="0.8"
                max="1.3"
                step="0.1"
                value={pitch}
                onChange={e => setPitch(parseFloat(e.target.value))}
                className="w-full accent-indigo-400"
              />
            </div>
          </div>

          {/* Voice Selector and Auto Advance Checkbox */}
          <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
            <div className="flex items-center gap-2">
              <Mic className="w-3.5 h-3.5 text-amber-400" />
              <select
                value={selectedVoice?.name || ''}
                onChange={e => {
                  const v = voices.find(voice => voice.name === e.target.value);
                  if (v) setSelectedVoice(v);
                }}
                className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-400 max-w-[200px] truncate"
              >
                {voices.map(v => (
                  <option key={v.name} value={v.name}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>

            <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
              <input
                type="checkbox"
                checked={autoAdvance}
                onChange={e => setAutoAdvance(e.target.checked)}
                className="rounded accent-amber-400"
              />
              <span>Pindah halaman otomatis</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
