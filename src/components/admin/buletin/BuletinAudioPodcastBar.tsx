import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Headphones, 
  Radio, 
  ChevronRight, 
  RotateCcw,
  Sliders,
  X
} from 'lucide-react';
import { BuletinConfig, RealisasiBelanjaSummary } from '../../../types';
import { formatRupiahShort } from '../../../utils/realisasiBelanjaProcessor';

interface BuletinAudioPodcastBarProps {
  buletinConfig: BuletinConfig;
  overallSummary?: RealisasiBelanjaSummary | null;
  onClose?: () => void;
}

export const BuletinAudioPodcastBar: React.FC<BuletinAudioPodcastBarProps> = ({
  buletinConfig,
  overallSummary,
  onClose
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [currentParagraphIndex, setCurrentParagraphIndex] = useState<number>(0);
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);

  // Script to read
  const narrativeScript = React.useMemo(() => {
    const nama = buletinConfig.namaBuletin || 'Warta Semarang Satu';
    const edisi = buletinConfig.edisi || 'Edisi Khusus 2026';
    const totalPaguStr = overallSummary ? formatRupiahShort(overallSummary.totalPagu) : 'Rp12,85 Triliun';
    const totalRealStr = overallSummary ? formatRupiahShort(overallSummary.totalRealisasi) : 'Rp8,42 Triliun';
    const persenRealStr = overallSummary ? `${overallSummary.persenRealisasiTotal.toFixed(1)} persen` : '65,5 persen';
    const namaKppn = 'Kantor Pelayanan Perbendaharaan Negara Tipe A1 Semarang Satu';

    return [
      `Selamat datang di Narasi Eksekutif Audio ${nama}, ${edisi}. Diterbitkan secara resmi oleh ${namaKppn}, Direktorat Jenderal Perbendaharaan, Kementerian Keuangan Republik Indonesia.`,
      `Catatan Kinerja Fiskal: Hingga periode ${buletinConfig.bulanTahun || 'Triwulan Berjalan'}, total realisasi belanja negara telah mencapai ${totalRealStr} atau sebesar ${persenRealStr} dari total pagu kelolaan sebesar ${totalPaguStr}.`,
      `Kata Pengantar Kepala KPPN: ${buletinConfig.kataPengantar?.pesanUtama || 'Pengelolaan perbendaharaan negara diarahkan pada penciptaan nilai tambah nyata bagi perekonomian regional serta peningkatan kualitas belanja yang akuntabel.'}`,
      `Fokus Strategis 8 Indikator IKPA: KPPN Semarang I terus mengawal kepatuhan revisi DIPA Halaman Tiga, percepatan tagihan kontraktual 17 hari kerja, zero retur SP2D, serta akselerasi transaksi non-tunai melalui Kartu Kredit Pemerintah dan Digipay Satu.`,
      `Inisiatif Fiskal Berkelanjutan & Green Budgeting: Pengalokasian belanja mitigasi bencana banjir rob pesisir Semarang, efisiensi energi kantor, serta implementasi paperless office SAKTI melalui Tanda Tangan Elektronik.`,
      `Komitmen Integritas: Seluruh jajaran KPPN Semarang I menjunjung tinggi layanan prima dengan tarif nol rupiah, bebas gratifikasi, dan siap mewujudkan predikat Wilayah Birokrasi Bersih dan Melayani Tahun 2026. Terima kasih atas kerja sama seluruh Kuasa Pengguna Anggaran.`
    ];
  }, [buletinConfig, overallSummary]);

  // Load SpeechSynthesis voices
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setSpeechSupported(false);
      return;
    }

    const updateVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
      // Prefer Indonesian voice if available
      const idVoice = voices.find(v => v.lang.includes('id') || v.lang.includes('ID') || v.name.toLowerCase().includes('indonesia'));
      if (idVoice) {
        setSelectedVoice(idVoice);
      } else if (voices.length > 0) {
        setSelectedVoice(voices[0]);
      }
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speakParagraph = (index: number) => {
    if (!('speechSynthesis' in window) || index >= narrativeScript.length) {
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentParagraphIndex(0);
      return;
    }

    window.speechSynthesis.cancel();

    const textToSpeak = narrativeScript[index];
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    utterance.rate = playbackRate;
    utterance.lang = 'id-ID';

    utterance.onend = () => {
      if (index + 1 < narrativeScript.length) {
        setCurrentParagraphIndex(index + 1);
        speakParagraph(index + 1);
      } else {
        setIsPlaying(false);
        setIsPaused(false);
        setCurrentParagraphIndex(0);
      }
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis error:', e);
      setIsPlaying(false);
      setIsPaused(false);
    };

    setCurrentParagraphIndex(index);
    setIsPlaying(true);
    setIsPaused(false);
    window.speechSynthesis.speak(utterance);
  };

  const handlePlay = () => {
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPlaying(true);
      setIsPaused(false);
    } else {
      speakParagraph(currentParagraphIndex);
    }
  };

  const handlePause = () => {
    if (isPlaying) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
      setIsPaused(true);
    }
  };

  const handleStop = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentParagraphIndex(0);
  };

  const handleRateChange = () => {
    const nextRate = playbackRate === 1.0 ? 1.25 : playbackRate === 1.25 ? 1.5 : 1.0;
    setPlaybackRate(nextRate);
    if (isPlaying) {
      handleStop();
      setTimeout(() => {
        speakParagraph(currentParagraphIndex);
      }, 100);
    }
  };

  if (!speechSupported) return null;

  return (
    <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white border-y border-amber-500/30 px-4 py-3 shadow-2xl animate-fadeIn print:hidden">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Podcast Info & Visualizer */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md shrink-0">
            <Radio className={`w-5 h-5 ${isPlaying ? 'animate-pulse text-indigo-950' : ''}`} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xs tracking-wide uppercase text-amber-300">
                Warta Audio Podcast Eksekutif
              </span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-slate-950 text-[10px] font-black font-mono">
                AI Voice HD
              </span>
            </div>
            <p className="text-[11px] text-slate-300 truncate max-w-sm sm:max-w-md">
              {narrativeScript[currentParagraphIndex] || 'Ringkasan Buletin KPPN Semarang I'}
            </p>
          </div>
        </div>

        {/* Center: Audio Waveform simulation when playing */}
        <div className="hidden lg:flex items-center gap-1 h-6 px-3 bg-white/5 rounded-full border border-white/10">
          {[40, 75, 30, 90, 50, 80, 45, 95, 60, 30, 85, 40].map((h, i) => (
            <div
              key={i}
              className={`w-1 rounded-full transition-all duration-300 ${
                isPlaying ? 'bg-amber-400' : 'bg-slate-600'
              }`}
              style={{
                height: isPlaying ? `${Math.max(20, (h * (i % 2 === 0 ? 1 : 0.7)))}%` : '20%',
                animation: isPlaying ? `pulse 0.6s infinite alternate ${i * 0.08}s` : 'none'
              }}
            />
          ))}
        </div>

        {/* Right: Audio Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={isPlaying ? handlePause : handlePlay}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer hover:scale-105"
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-slate-950" />
                <span>Jeda</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-slate-950" />
                <span>{isPaused ? 'Lanjutkan' : 'Putar Audio'}</span>
              </>
            )}
          </button>

          <button
            onClick={handleStop}
            disabled={!isPlaying && !isPaused}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Hentikan Audio"
          >
            <Square className="w-4 h-4 fill-current" />
          </button>

          <button
            onClick={handleRateChange}
            className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-amber-300 font-mono font-bold text-xs transition-colors"
            title="Ubah Kecepatan Suara"
          >
            {playbackRate}x
          </button>

          {onClose && (
            <button
              onClick={() => {
                handleStop();
                onClose();
              }}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white transition-colors ml-1"
              title="Tutup Narasi Audio"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
