import React, { useState, useEffect } from 'react';
import {
  X,
  Trophy,
  Award,
  CheckCircle2,
  HelpCircle,
  RotateCcw,
  Sparkles,
  PartyPopper,
  Gamepad2,
  Share2,
  Download,
  Flame,
  Check
} from 'lucide-react';
import { playChimeSound } from '../../../utils/buletinSoundEffects';
import { useToast } from '../../ToastNotification';

interface BuletinInteractiveGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  soundEnabled?: boolean;
}

// 6x6 Crossword Puzzle Grid for Fiscal APBN & KPPN
// Words:
// 1. SAKTI (Mendatar)
// 2. IKPA (Menurun)
// 3. APBN (Mendatar)
// 4. KKP (Mendatar)
// 5. SPM (Menurun)
interface CrosswordClue {
  num: number;
  direction: 'across' | 'down';
  clue: string;
  answer: string;
  startRow: number;
  startCol: number;
}

const CROSSWORD_CLUES: CrosswordClue[] = [
  {
    num: 1,
    direction: 'across',
    clue: 'Sistem Aplikasi Keuangan Tingkat Instansi andalan Kemenkeu',
    answer: 'SAKTI',
    startRow: 0,
    startCol: 0
  },
  {
    num: 2,
    direction: 'down',
    clue: 'Indikator Kinerja Pelaksanaan Anggaran',
    answer: 'IKPA',
    startRow: 0,
    startCol: 4
  },
  {
    num: 3,
    direction: 'across',
    clue: 'Anggaran Pendapatan dan Belanja Negara (Singkatan)',
    answer: 'APBN',
    startRow: 2,
    startCol: 1
  },
  {
    num: 4,
    direction: 'down',
    clue: 'Surat Perintah Membayar yang diterbitkan PPSPM Satker',
    answer: 'SPM',
    startRow: 0,
    startCol: 0
  },
  {
    num: 5,
    direction: 'across',
    clue: 'Kartu Kredit Pemerintah untuk pembayaran cashless',
    answer: 'KKP',
    startRow: 4,
    startCol: 2
  }
];

const QUIZ_QUESTIONS = [
  {
    id: 1,
    question: 'Berapa jumlah indikator utama penilaian IKPA pada regulasi terbaru Perdirjen Perbendaharaan?',
    options: ['6 Indikator', '8 Indikator', '10 Indikator', '12 Indikator'],
    correctIndex: 1,
    explanation: 'IKPA terdiri dari 8 indikator yang terbagi dalam 3 aspek: Kualitas Perencanaan, Pelaksanaan, dan Hasil.'
  },
  {
    id: 2,
    question: 'Batas deviasi penarikan dana bulanan terhadap Rencana Penarikan Dana (RPD) Halaman III DIPA yang ideal adalah...',
    options: ['Maksimal 5%', 'Maksimal 10%', 'Maksimal 15%', 'Maksimal 20%'],
    correctIndex: 0,
    explanation: 'Deviasi Halaman III DIPA bernilai maksimal jika deviasi bulanan berada di bawah toleransi 5%.'
  },
  {
    id: 3,
    question: 'Platform marketplace digital pengadaan barang/jasa pemerintah dengan sistem pembayaran cashless adalah...',
    options: ['Digipay Satu', 'SiRUP LKPP', 'E-Katalog SAKTI', 'SIMPONI'],
    correctIndex: 0,
    explanation: 'Digipay Satu menghubungkan satker, perbankan HIMBARA, dan vendor UMKM lokal dalam satu ekosistem pengadaan terintegrasi.'
  },
  {
    id: 4,
    question: 'Prinsip utama Zona Integritas KPPN Semarang I dalam memberikan pelayanan kepada seluruh satker adalah...',
    options: ['Berbayar sesuai tarif PNBP', 'Zero Rupiah & Bebas Gratifikasi (WBK/WBBM)', 'Hanya melayani secara online', 'Prioritas satker besar'],
    correctIndex: 1,
    explanation: 'Semua layanan di KPPN Semarang I adalah Rp0,- tanpa biaya dan menjunjung tinggi integritas anti-korupsi.'
  }
];

export const BuletinInteractiveGameModal: React.FC<BuletinInteractiveGameModalProps> = ({
  isOpen,
  onClose,
  soundEnabled = true
}) => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'tts' | 'kuis' | 'certificate'>('tts');

  // TTS State: 6x6 Grid
  const [grid, setGrid] = useState<string[][]>(() =>
    Array(6)
      .fill('')
      .map(() => Array(6).fill(''))
  );
  const [isTtsCompleted, setIsTtsCompleted] = useState<boolean>(false);

  // Quiz State
  const [quizAnswers, setQuizAnswers] = useState<{ [qId: number]: number }>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [quizScore, setQuizScore] = useState<number>(0);

  // Certificate State
  const [userName, setUserName] = useState<string>('');
  const [userSatker, setUserSatker] = useState<string>('');

  if (!isOpen) return null;

  // Grid mask to see which cells are active
  const isCellActive = (r: number, c: number) => {
    return CROSSWORD_CLUES.some(clue => {
      if (clue.direction === 'across') {
        return r === clue.startRow && c >= clue.startCol && c < clue.startCol + clue.answer.length;
      } else {
        return c === clue.startCol && r >= clue.startRow && r < clue.startRow + clue.answer.length;
      }
    });
  };

  const handleCellChange = (r: number, c: number, val: string) => {
    const char = val.slice(-1).toUpperCase();
    const newGrid = grid.map((row, rIdx) =>
      row.map((cell, cIdx) => (rIdx === r && cIdx === c ? char : cell))
    );
    setGrid(newGrid);

    // Auto check TTS completion
    let allCorrect = true;
    for (const clue of CROSSWORD_CLUES) {
      for (let i = 0; i < clue.answer.length; i++) {
        const row = clue.direction === 'across' ? clue.startRow : clue.startRow + i;
        const col = clue.direction === 'across' ? clue.startCol + i : clue.startCol;
        if (newGrid[row][col] !== clue.answer[i]) {
          allCorrect = false;
          break;
        }
      }
      if (!allCorrect) break;
    }

    if (allCorrect && !isTtsCompleted) {
      setIsTtsCompleted(true);
      playChimeSound(soundEnabled);
      addToast('🎉 Selamat! Teka-Teki Silang Fiskal berhasil diselesaikan dengan sempurna!', 'success');
    }
  };

  const handleQuizOption = (questionId: number, optionIndex: number) => {
    if (quizSubmitted) return;
    setQuizAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const handleQuizSubmit = () => {
    let score = 0;
    QUIZ_QUESTIONS.forEach(q => {
      if (quizAnswers[q.id] === q.correctIndex) {
        score += 25;
      }
    });
    setQuizScore(score);
    setQuizSubmitted(true);
    playChimeSound(soundEnabled);
    if (score >= 75) {
      addToast(`🎉 Luar Biasa! Skor Anda: ${score}/100. Anda berhak mengklaim sertifikat!`, 'success');
    } else {
      addToast(`Skor Anda: ${score}/100. Ayo pelajari kembali ulasan buletin dan coba lagi!`, 'info');
    }
  };

  const handleResetTts = () => {
    setGrid(
      Array(6)
        .fill('')
        .map(() => Array(6).fill(''))
    );
    setIsTtsCompleted(false);
  };

  const handleResetQuiz = () => {
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(0);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-white animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">Arena Kuis &amp; TTS Fiskal Interaktif</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Halaman 46–47
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Uji pengetahuan perbendaharaan negara dan dapatkan e-sertifikat resmi KPPN Semarang I
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
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('tts')}
            className={`pb-3 px-3 text-xs font-black flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'tts'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Teka-Teki Silang (TTS)</span>
            {isTtsCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
          </button>

          <button
            onClick={() => setActiveTab('kuis')}
            className={`pb-3 px-3 text-xs font-black flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'kuis'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Kuis Cerdas Tangkas APBN</span>
            {quizSubmitted && <span className="text-[10px] font-mono font-bold text-amber-300">({quizScore} Poin)</span>}
          </button>

          <button
            onClick={() => setActiveTab('certificate')}
            className={`pb-3 px-3 text-xs font-black flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'certificate'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Klaim Sertifikat Juara</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: TEKA TEKI SILANG */}
          {activeTab === 'tts' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Interactive TTS Grid */}
              <div className="flex flex-col items-center bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-inner">
                <div className="grid grid-cols-6 gap-1.5 w-64 h-64">
                  {grid.map((row, rIdx) =>
                    row.map((cell, cIdx) => {
                      const active = isCellActive(rIdx, cIdx);
                      return (
                        <div
                          key={`${rIdx}-${cIdx}`}
                          className={`relative rounded-xl flex items-center justify-center font-black text-lg transition-all ${
                            active
                              ? 'bg-slate-900 border-2 border-amber-400/60 focus-within:border-amber-400 shadow-sm'
                              : 'bg-slate-950/80 border border-slate-900 opacity-40'
                          }`}
                        >
                          {/* Small Clue Number on start cell */}
                          {CROSSWORD_CLUES.some(c => c.startRow === rIdx && c.startCol === cIdx) && (
                            <span className="absolute top-0.5 left-1 text-[8px] font-mono text-amber-400 pointer-events-none">
                              {CROSSWORD_CLUES.find(c => c.startRow === rIdx && c.startCol === cIdx)?.num}
                            </span>
                          )}

                          {active ? (
                            <input
                              type="text"
                              maxLength={1}
                              value={cell}
                              onChange={e => handleCellChange(rIdx, cIdx, e.target.value)}
                              className="w-full h-full text-center uppercase bg-transparent text-amber-300 font-black focus:outline-none"
                            />
                          ) : null}
                        </div>
                      );
                    })
                  )}
                </div>

                {isTtsCompleted && (
                  <div className="mt-4 p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl flex items-center gap-2 text-emerald-300 text-xs font-bold animate-bounce">
                    <PartyPopper className="w-4 h-4" />
                    <span>TTS Berhasil Diselesaikan!</span>
                  </div>
                )}

                <div className="flex items-center gap-2 mt-4">
                  <button
                    onClick={handleResetTts}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Kotak</span>
                  </button>
                </div>
              </div>

              {/* Clues List */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 mb-2">
                    Mendatar (Across)
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-300">
                    {CROSSWORD_CLUES.filter(c => c.direction === 'across').map(c => (
                      <li key={c.num} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                        <span className="font-bold text-amber-400 mr-1.5">{c.num}.</span>
                        <span>{c.clue}</span>
                        <span className="text-slate-500 ml-1.5">({c.answer.length} Huruf)</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-indigo-400 mb-2">
                    Menurun (Down)
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-300">
                    {CROSSWORD_CLUES.filter(c => c.direction === 'down').map(c => (
                      <li key={c.num} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                        <span className="font-bold text-indigo-400 mr-1.5">{c.num}.</span>
                        <span>{c.clue}</span>
                        <span className="text-slate-500 ml-1.5">({c.answer.length} Huruf)</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: KUIS APBN */}
          {activeTab === 'kuis' && (
            <div className="space-y-5">
              {QUIZ_QUESTIONS.map((q, qIndex) => {
                const selectedOpt = quizAnswers[q.id];
                const isAnswered = selectedOpt !== undefined;

                return (
                  <div key={q.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-lg bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center shrink-0">
                        {qIndex + 1}
                      </span>
                      <p className="text-sm font-bold text-white leading-snug">{q.question}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 pl-9">
                      {q.options.map((opt, optIndex) => {
                        const isSelected = selectedOpt === optIndex;
                        const isCorrect = optIndex === q.correctIndex;

                        let optClass = 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700';
                        if (quizSubmitted) {
                          if (isCorrect) {
                            optClass = 'bg-emerald-950/80 border-emerald-500 text-emerald-300 font-bold';
                          } else if (isSelected && !isCorrect) {
                            optClass = 'bg-rose-950/80 border-rose-500 text-rose-300';
                          }
                        } else if (isSelected) {
                          optClass = 'bg-amber-400 text-slate-950 font-bold border-amber-400 shadow';
                        }

                        return (
                          <button
                            key={optIndex}
                            onClick={() => handleQuizOption(q.id, optIndex)}
                            className={`p-2.5 rounded-xl text-xs text-left border transition-all flex items-center justify-between ${optClass}`}
                          >
                            <span>{opt}</span>
                            {quizSubmitted && isCorrect && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                          </button>
                        );
                      })}
                    </div>

                    {quizSubmitted && (
                      <div className="text-xs text-slate-400 bg-slate-900 p-3 rounded-xl border border-slate-800 ml-9">
                        <span className="font-bold text-amber-300">Penjelasan: </span>
                        {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={handleResetQuiz}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Ulangi Kuis</span>
                </button>

                {!quizSubmitted ? (
                  <button
                    onClick={handleQuizSubmit}
                    disabled={Object.keys(quizAnswers).length < QUIZ_QUESTIONS.length}
                    className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-slate-950 text-xs font-black shadow-lg transition-all"
                  >
                    Kirim Jawaban &amp; Cek Skor
                  </button>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-300">
                      Skor Total: <span className="text-amber-400 text-base">{quizScore}</span> / 100
                    </span>
                    <button
                      onClick={() => setActiveTab('certificate')}
                      className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black flex items-center gap-1.5 transition-colors shadow"
                    >
                      <Trophy className="w-3.5 h-3.5 text-amber-300" />
                      <span>Klaim E-Sertifikat</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: SERTIFIKAT JUARA FISKAL */}
          {activeTab === 'certificate' && (
            <div className="space-y-6">
              {/* Form Input Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Nama Lengkap &amp; Gelar:</label>
                  <input
                    type="text"
                    placeholder="Contoh: Budi Santoso, S.E., M.M."
                    value={userName}
                    onChange={e => setUserName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Instansi / Satuan Kerja:</label>
                  <input
                    type="text"
                    placeholder="Contoh: Polrestabes Semarang / Pengadilan Negeri"
                    value={userSatker}
                    onChange={e => setUserSatker(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                </div>
              </div>

              {/* Certificate Template Preview */}
              <div className="bg-gradient-to-br from-amber-50 via-white to-amber-100 p-8 rounded-3xl border-8 border-double border-amber-600 text-slate-950 shadow-2xl relative overflow-hidden text-center select-none">
                {/* Background Emblem */}
                <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none text-9xl font-serif font-black">
                  Kemenkeu
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] font-black uppercase tracking-widest text-amber-800">
                    KEMENTERIAN KEUANGAN REPUBLIK INDONESIA • KPPN SEMARANG I
                  </div>
                  <h2 className="text-xl font-serif font-black text-slate-900 tracking-wide">
                    SERTIFIKAT PENGHARGAAN
                  </h2>
                  <div className="w-24 h-0.5 bg-amber-600 mx-auto" />
                </div>

                <div className="py-4 space-y-2">
                  <p className="text-xs text-slate-600 italic">Diberikan secara terhormat kepada:</p>
                  <h3 className="text-lg font-serif font-black text-slate-950 underline decoration-amber-500 underline-offset-4">
                    {userName.trim() || '[ Nama Lengkap Pengelola Keuangan ]'}
                  </h3>
                  <p className="text-xs font-bold text-slate-700">
                    {userSatker.trim() || '[ Satuan Kerja / Mitra KPPN Semarang I ]'}
                  </p>
                </div>

                <p className="text-xs text-slate-700 max-w-md mx-auto leading-relaxed">
                  Atas partisipasi aktif dan penguasaan materi perbendaharaan negara serta regulasi IKPA pada{' '}
                  <span className="font-bold">E-Buletin Fiskal Edisi Spesial KPPN Semarang I</span>.
                </p>

                <div className="pt-6 flex items-center justify-between max-w-sm mx-auto text-[10px] text-slate-600">
                  <div className="text-left">
                    <div>Semarang, Agustus 2026</div>
                    <div className="font-bold text-slate-800 mt-6">Tim Redaksi Buletin Fiskal</div>
                  </div>
                  <div className="w-12 h-12 rounded-full border-2 border-amber-600 flex items-center justify-center font-bold text-[8px] text-amber-900 bg-amber-200/50">
                    RESMI KPPN
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => {
                    window.print();
                    addToast('Membuka dialog cetak sertifikat...', 'info');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black flex items-center gap-2 shadow-lg transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Cetak / Simpan PDF Sertifikat</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>KPPN Semarang I — Cerdas, Berintegritas, Melayani Sepenuh Hati</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-colors"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
