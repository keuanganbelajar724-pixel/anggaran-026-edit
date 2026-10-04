import React, { useState, useMemo, useEffect } from 'react';
import { 
  BookOpen, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Sparkles, 
  Scale, 
  RotateCcw, 
  Lock, 
  Unlock, 
  KeyRound, 
  ShieldCheck, 
  Building2, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  X, 
  Shuffle, 
  ArrowRight, 
  Award,
  Layers,
  GraduationCap,
  Flame,
  ThumbsUp,
  AlertCircle
} from 'lucide-react';
import { QuizPackage, QuizQuestion, QuestionDifficulty } from '../../types/quiz';
import { MasterBankQuestion } from '../../types/quiz';
import { AppUser, AppTheme } from '../../types';
import { getMasterQuizBank } from '../../utils/quizStorage';

interface QuizPracticeViewProps {
  currentUser: AppUser | null;
  theme?: AppTheme;
  packages: QuizPackage[];
  onExitPractice: () => void;
  initialPackageId?: string | null;
}

const DEFAULT_KPPN_PASSWORD = 'kppn026';

export const QuizPracticeView: React.FC<QuizPracticeViewProps> = ({
  currentUser,
  theme = 'light',
  packages,
  onExitPractice,
  initialPackageId = null
}) => {
  const isDark = theme === 'dark';
  const isInternalKppnUser = currentUser?.role === 'superadmin' || currentUser?.role === 'pegawai';

  // Master bank questions (520 questions)
  const masterQuestions = useMemo(() => getMasterQuizBank(), []);

  // Practice selection state
  // Source: 'BANK_TOPIC' or 'PACKAGE'
  const [selectedSourceType, setSelectedSourceType] = useState<'BANK_TOPIC' | 'PACKAGE'>('BANK_TOPIC');
  const [selectedTopic, setSelectedTopic] = useState<string>('ALL');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'ALL' | QuestionDifficulty>('ALL');
  const [selectedPackageId, setSelectedPackageId] = useState<string>(initialPackageId || (packages[0]?.id || ''));
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Audience filter: 'ALL' | 'satker' | 'kppn_internal'
  const [audienceFilter, setAudienceFilter] = useState<'ALL' | 'satker' | 'kppn_internal'>('ALL');

  // KPPN PIN / Password protection state
  const [isKppnUnlocked, setIsKppnUnlocked] = useState<boolean>(isInternalKppnUser);
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);
  const [enteredPassword, setEnteredPassword] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [pendingKppnTarget, setPendingKppnTarget] = useState<{ type: 'BANK' | 'PACKAGE'; id?: string } | null>(null);

  // Active Practice Session State
  const [isPracticing, setIsPracticing] = useState<boolean>(false);
  const [practiceQuestions, setPracticeQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  // Store answered choices: key is question id, value is selected answer ('A' | 'B' | 'C' | 'D')
  const [answeredState, setAnsweredState] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({});
  
  // Show Completion / "Sudah Puas" Modal
  const [showFinishedModal, setShowFinishedModal] = useState<boolean>(false);

  // Auto-sync unlocked if user logs in as internal pegawai
  useEffect(() => {
    if (isInternalKppnUser) {
      setIsKppnUnlocked(true);
    }
  }, [isInternalKppnUser]);

  // Extract unique topics from master bank
  const uniqueTopics = useMemo(() => {
    const set = new Set<string>();
    masterQuestions.forEach(q => {
      if (q.topic) set.add(q.topic);
    });
    return Array.from(set);
  }, [masterQuestions]);

  // If initialPackageId is provided on mount, auto-start or select that package
  useEffect(() => {
    if (initialPackageId) {
      const pkg = packages.find(p => p.id === initialPackageId);
      if (pkg) {
        setSelectedSourceType('PACKAGE');
        setSelectedPackageId(pkg.id);
        if (pkg.targetAudience === 'kppn_internal' && !isKppnUnlocked) {
          setPendingKppnTarget({ type: 'PACKAGE', id: pkg.id });
          setShowPasswordModal(true);
        } else {
          startPackagePractice(pkg);
        }
      }
    }
  }, [initialPackageId]);

  // Filtered packages
  const filteredPackages = useMemo(() => {
    return packages.filter(pkg => {
      if (audienceFilter !== 'ALL' && pkg.targetAudience !== audienceFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = pkg.title.toLowerCase().includes(q);
        const inDesc = pkg.description.toLowerCase().includes(q);
        const inCat = pkg.category.toLowerCase().includes(q);
        if (!inTitle && !inDesc && !inCat) return false;
      }
      return true;
    });
  }, [packages, audienceFilter, searchQuery]);

  // Count of bank questions matching topic & difficulty
  const filteredBankCount = useMemo(() => {
    return masterQuestions.filter(q => {
      if (selectedTopic !== 'ALL' && q.topic !== selectedTopic) return false;
      if (selectedDifficulty !== 'ALL' && q.difficulty !== selectedDifficulty) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const inText = q.questionText.toLowerCase().includes(query);
        const inExp = q.explanation ? q.explanation.toLowerCase().includes(query) : false;
        if (!inText && !inExp) return false;
      }
      return true;
    }).length;
  }, [masterQuestions, selectedTopic, selectedDifficulty, searchQuery]);

  // Handle password submission for KPPN Internal
  const handleVerifyPassword = () => {
    if (enteredPassword.trim().toLowerCase() === DEFAULT_KPPN_PASSWORD || enteredPassword.trim().toLowerCase() === 'internal026') {
      setIsKppnUnlocked(true);
      setShowPasswordModal(false);
      setEnteredPassword('');
      setPasswordError(null);

      if (pendingKppnTarget) {
        if (pendingKppnTarget.type === 'PACKAGE' && pendingKppnTarget.id) {
          const pkg = packages.find(p => p.id === pendingKppnTarget.id);
          if (pkg) startPackagePractice(pkg);
        } else {
          startBankPractice(true);
        }
      }
    } else {
      setPasswordError('Password salah. Silakan coba lagi (petunjuk: hubungi pengawas / ketik kppn026)');
    }
  };

  // Start practice from Bank Soal
  const startBankPractice = (skipPasswordCheck = false) => {
    // If practicing internal topic and not unlocked
    const isTopicInternal = selectedTopic.toLowerCase().includes('kppn internal') || selectedTopic.toLowerCase().includes('kepatuhan internal');
    if (isTopicInternal && !isKppnUnlocked && !skipPasswordCheck) {
      setPendingKppnTarget({ type: 'BANK' });
      setShowPasswordModal(true);
      return;
    }

    const filtered = masterQuestions.filter(q => {
      if (selectedTopic !== 'ALL' && q.topic !== selectedTopic) return false;
      if (selectedDifficulty !== 'ALL' && q.difficulty !== selectedDifficulty) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const inText = q.questionText.toLowerCase().includes(query);
        const inExp = q.explanation ? q.explanation.toLowerCase().includes(query) : false;
        if (!inText && !inExp) return false;
      }
      return true;
    });

    if (filtered.length === 0) return;

    setPracticeQuestions(filtered);
    setCurrentIdx(0);
    setAnsweredState({});
    setIsPracticing(true);
  };

  // Start practice from Package
  const startPackagePractice = (pkg: QuizPackage) => {
    if (pkg.targetAudience === 'kppn_internal' && !isKppnUnlocked) {
      setPendingKppnTarget({ type: 'PACKAGE', id: pkg.id });
      setShowPasswordModal(true);
      return;
    }

    if (!pkg.questions || pkg.questions.length === 0) return;

    setPracticeQuestions(pkg.questions);
    setCurrentIdx(0);
    setAnsweredState({});
    setIsPracticing(true);
  };

  // Current practicing question
  const currentQ = practiceQuestions[currentIdx];
  const userSelectedChoice = currentQ ? answeredState[currentQ.id] : undefined;
  const isCurrentAnswered = userSelectedChoice !== undefined;
  const isCurrentCorrect = isCurrentAnswered && userSelectedChoice === currentQ?.correctAnswer;

  // Running practice statistics
  const sessionStats = useMemo(() => {
    let answered = 0;
    let correct = 0;
    let wrong = 0;

    practiceQuestions.forEach(q => {
      const ans = answeredState[q.id];
      if (ans) {
        answered++;
        if (ans === q.correctAnswer) correct++;
        else wrong++;
      }
    });

    const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : 0;
    return { answered, correct, wrong, accuracy, total: practiceQuestions.length };
  }, [practiceQuestions, answeredState]);

  // Handle choice selection with instant answer reveal
  const handleSelectChoice = (choice: 'A' | 'B' | 'C' | 'D') => {
    if (!currentQ) return;
    // Allow answering or changing answer
    setAnsweredState(prev => ({
      ...prev,
      [currentQ.id]: choice
    }));
  };

  // Shuffle questions in current practice session
  const handleShuffleQuestions = () => {
    const shuffled = [...practiceQuestions].sort(() => Math.random() - 0.5);
    setPracticeQuestions(shuffled);
    setCurrentIdx(0);
  };

  // Reset practice
  const handleResetSession = () => {
    setAnsweredState({});
    setCurrentIdx(0);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Top Banner Mode Latihan Soal */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white shadow-xl">
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-black uppercase tracking-wider">
              <GraduationCap className="w-4 h-4 text-emerald-200" />
              <span>Ruang Belajar &amp; Latihan Soal Mandiri</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950 text-[10px] font-black">
                Jawaban Langsung Terbuka
              </span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">
              Belajar Santai &amp; Pembahasan Instan
            </h1>
            
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
              Khusus bagi Anda yang ingin mengasah pemahaman perbendaharaan tanpa tekanan batas waktu ujian. Setiap butir pertanyaan langsung menampilkan kunci jawaban yang benar, pembahasan ilmiah, dan dasar hukum resmi seketika.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            {isPracticing && (
              <button
                type="button"
                onClick={() => setShowFinishedModal(true)}
                className="px-4 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-lg transition-all cursor-pointer hover:scale-105 active:scale-95"
              >
                <Award className="w-4 h-4 text-amber-900" />
                <span>Sudah Puas / Selesai Latihan</span>
              </button>
            )}

            <button
              type="button"
              onClick={onExitPractice}
              className="px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer backdrop-blur-md"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Kembali ke Simulasi Ujian CAT</span>
            </button>
          </div>
        </div>

        {/* Live Practice Running Stats Bar (if practicing) */}
        {isPracticing && (
          <div className="mt-6 pt-4 border-t border-white/20 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-2.5 rounded-xl bg-black/20 backdrop-blur-xs">
              <span className="text-[10px] text-emerald-200 block uppercase font-bold">Progres Latihan</span>
              <span className="text-base sm:text-lg font-black font-mono">
                {sessionStats.answered} / {sessionStats.total} Soal
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-black/20 backdrop-blur-xs">
              <span className="text-[10px] text-emerald-200 block uppercase font-bold">Jawaban Benar</span>
              <span className="text-base sm:text-lg font-black font-mono text-emerald-300">
                ✓ {sessionStats.correct}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-black/20 backdrop-blur-xs">
              <span className="text-[10px] text-rose-200 block uppercase font-bold">Perlu Dipelajari Lagi</span>
              <span className="text-base sm:text-lg font-black font-mono text-rose-300">
                ✗ {sessionStats.wrong}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-black/20 backdrop-blur-xs">
              <span className="text-[10px] text-cyan-200 block uppercase font-bold">Tingkat Penguasaan</span>
              <span className="text-base sm:text-lg font-black font-mono text-cyan-300">
                {sessionStats.accuracy}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* VIEW A: SELEKSI MATERI LATIHAN (JIKA BELUM MULAI LATIHAN) */}
      {/* ===================================================================== */}
      {!isPracticing && (
        <div className="space-y-6">
          {/* Quick Notice: Satker Bebas Akses vs KPPN Password Protected */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`p-4 rounded-3xl border flex items-start gap-3.5 transition-all ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-emerald-50/70 border-emerald-200'
            }`}>
              <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 font-black shadow-md">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-black text-emerald-900 dark:text-emerald-300 uppercase tracking-wider">
                  Khusus Rekan Mitra Satker (Bebas Akses)
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  <strong>Tidak perlu login</strong> sama sekali! Anda dapat langsung memilih paket latihan Satker atau memilih salah satu dari 520 butir bank soal berdasarkan topik perbendaharaan.
                </p>
              </div>
            </div>

            <div className={`p-4 rounded-3xl border flex items-start gap-3.5 transition-all ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-indigo-50/70 border-indigo-200'
            }`}>
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 font-black shadow-md">
                {isKppnUnlocked ? <Unlock className="w-5 h-5 text-amber-300" /> : <Lock className="w-5 h-5" />}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-black text-indigo-900 dark:text-indigo-300 uppercase tracking-wider">
                    Khusus Internal KPPN (Dilindungi Password)
                  </h4>
                  {isKppnUnlocked ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                      ✓ Akses Terbuka
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { setPendingKppnTarget(null); setShowPasswordModal(true); }}
                      className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-600 text-white hover:bg-indigo-500 cursor-pointer"
                    >
                      Buka Password
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Materi khusus pegawai internal KPPN dilindungi PIN/Password pengawas <code>(kppn026)</code> atau otomatis terbuka bila Anda sudah masuk dengan akun pegawai KPPN.
                </p>
              </div>
            </div>
          </div>

          {/* Mode Source Tab Selector: Bank Soal 520 vs Paket Kuis */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-200 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setSelectedSourceType('BANK_TOPIC')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                  selectedSourceType === 'BANK_TOPIC'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Latihan Berdasarkan Topik Bank Soal (520 Soal)</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedSourceType('PACKAGE')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                  selectedSourceType === 'PACKAGE'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Latihan Berdasarkan Paket Kuis ({packages.length})</span>
              </button>
            </div>

            {/* Keyword Search */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari materi / kata kunci latihan..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* ================================================================= */}
          {/* TAB 1: BANK SOAL 520 BY TOPIC & DIFFICULTY */}
          {/* ================================================================= */}
          {selectedSourceType === 'BANK_TOPIC' && (
            <div className={`p-6 rounded-3xl border shadow-lg space-y-6 ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-500" />
                    <span>Konfigurasi Materi Latihan Mandiri (520 Butir Soal)</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Pilih topik dan tingkat kesulitan soal yang ingin Anda pelajari secara langsung.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">
                    Ditemukan: <strong className="text-emerald-600 dark:text-emerald-400">{filteredBankCount} Butir Soal</strong>
                  </span>
                  
                  <button
                    type="button"
                    disabled={filteredBankCount === 0}
                    onClick={() => startBankPractice()}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-black text-xs flex items-center gap-2 shadow-md cursor-pointer transition-all hover:scale-105 active:scale-95"
                  >
                    <span>Mulai Latihan Sekarang</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Filters: Topic & Difficulty */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Topic Selector */}
                <div className="space-y-1.5">
                  <label className="block font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Pilih Topik Perbendaharaan:
                  </label>
                  <select
                    value={selectedTopic}
                    onChange={e => setSelectedTopic(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-slate-900 dark:text-slate-100 focus:outline-hidden"
                  >
                    <option value="ALL">🌟 Semua Topik Perbendaharaan (Campuran 520 Soal)</option>
                    {uniqueTopics.map(t => (
                      <option key={t} value={t}>
                        {t} {t.toLowerCase().includes('kppn internal') ? '🔒 (Khusus KPPN)' : '🌐 (Satker & Umum)'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Difficulty Selector */}
                <div className="space-y-1.5">
                  <label className="block font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Tingkat Kesulitan:
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedDifficulty('ALL')}
                      className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selectedDifficulty === 'ALL'
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                          : 'border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Semua
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedDifficulty('MUDAH')}
                      className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selectedDifficulty === 'MUDAH'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'border border-emerald-300 text-emerald-700 dark:border-emerald-800 dark:text-emerald-400'
                      }`}
                    >
                      🟢 Mudah
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedDifficulty('SEDANG')}
                      className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selectedDifficulty === 'SEDANG'
                          ? 'bg-amber-500 text-white shadow-sm'
                          : 'border border-amber-300 text-amber-700 dark:border-amber-800 dark:text-amber-400'
                      }`}
                    >
                      🟡 Sedang
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedDifficulty('ANALISIS')}
                      className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selectedDifficulty === 'ANALISIS'
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'border border-purple-300 text-purple-700 dark:border-purple-800 dark:text-purple-400'
                      }`}
                    >
                      🔴 HOTS
                    </button>
                  </div>
                </div>
              </div>

              {/* Topic Quick Cards Grid */}
              <div className="pt-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-3">
                  Pintasan Topik Populer:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {uniqueTopics.slice(0, 9).map(topicName => {
                    const isInternal = topicName.toLowerCase().includes('kppn internal') || topicName.toLowerCase().includes('kepatuhan internal');
                    const isSelected = selectedTopic === topicName;
                    const countInThisTopic = masterQuestions.filter(q => q.topic === topicName).length;

                    return (
                      <div
                        key={topicName}
                        onClick={() => setSelectedTopic(topicName)}
                        className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-md ring-1 ring-emerald-500'
                            : 'border-slate-200 dark:border-slate-800 hover:border-emerald-300'
                        }`}
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-1.5">
                            {isInternal ? (
                              <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 flex items-center gap-1">
                                <Lock className="w-2.5 h-2.5" />
                                KPPN
                              </span>
                            ) : (
                              <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                Satker
                              </span>
                            )}
                            <span className="text-xs font-black truncate">{topicName}</span>
                          </div>
                          <span className="text-[11px] text-slate-500">{countInThisTopic} butir soal</span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTopic(topicName);
                            startBankPractice();
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500 shrink-0"
                        >
                          Latihan
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 2: LATIHAN DARI PAKET KUIS */}
          {/* ================================================================= */}
          {selectedSourceType === 'PACKAGE' && (
            <div className="space-y-4">
              {/* Audience Filter for Packages */}
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-slate-500">Kategori Audiens:</span>
                <button
                  type="button"
                  onClick={() => setAudienceFilter('ALL')}
                  className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                    audienceFilter === 'ALL'
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                      : 'border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Semua Paket ({packages.length})
                </button>
                <button
                  type="button"
                  onClick={() => setAudienceFilter('satker')}
                  className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                    audienceFilter === 'satker'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Mitra Satker (Bebas Login)
                </button>
                <button
                  type="button"
                  onClick={() => setAudienceFilter('kppn_internal')}
                  className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                    audienceFilter === 'kppn_internal'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Khusus KPPN (Dengan Password)
                </button>
              </div>

              {/* Package Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredPackages.map(pkg => {
                  const isInternal = pkg.targetAudience === 'kppn_internal';
                  const isProtected = isInternal && !isKppnUnlocked;

                  return (
                    <div
                      key={pkg.id}
                      className={`p-5 rounded-3xl border-2 transition-all flex flex-col justify-between ${
                        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 hover:border-emerald-400'
                      } shadow-md hover:shadow-xl`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {pkg.category}
                          </span>

                          {isInternal ? (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 flex items-center gap-1 border border-indigo-200 dark:border-indigo-800">
                              {isProtected ? <Lock className="w-3 h-3 text-indigo-600" /> : <Unlock className="w-3 h-3 text-indigo-400" />}
                              <span>Internal KPPN</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center gap-1 border border-emerald-200 dark:border-emerald-800">
                              <Building2 className="w-3 h-3 text-emerald-600" />
                              <span>Mitra Satker</span>
                            </span>
                          )}
                        </div>

                        <div>
                          <h4 className="font-black text-sm text-slate-900 dark:text-white leading-snug">
                            {pkg.title}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                            {pkg.description}
                          </p>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs flex items-center justify-between font-bold">
                          <span>Jumlah Soal:</span>
                          <span className="font-mono text-emerald-600 dark:text-emerald-400">{pkg.questions?.length || 0} Soal</span>
                        </div>
                      </div>

                      <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800">
                        {isProtected ? (
                          <button
                            type="button"
                            onClick={() => {
                              setPendingKppnTarget({ type: 'PACKAGE', id: pkg.id });
                              setShowPasswordModal(true);
                            }}
                            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all"
                          >
                            <KeyRound className="w-4 h-4" />
                            <span>Buka dengan Password KPPN</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => startPackagePractice(pkg)}
                            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all hover:scale-102 active:scale-98"
                          >
                            <BookOpen className="w-4 h-4" />
                            <span>Mulai Latihan Paket Ini</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* VIEW B: INTERACTIVE PRACTICE SESSION (SATU PER SATU DENGAN INSTANT FEEDBACK) */}
      {/* ===================================================================== */}
      {isPracticing && currentQ && (
        <div className="space-y-6">
          {/* Header Navigation & Question Navigator */}
          <div className={`p-4 rounded-3xl border shadow-md flex flex-wrap items-center justify-between gap-4 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-2xl bg-emerald-600 text-white font-black flex items-center justify-center text-sm shadow-md">
                #{currentIdx + 1}
              </span>
              <div>
                <span className="text-xs font-black text-slate-800 dark:text-slate-200 block">
                  Soal No. {currentIdx + 1} dari {practiceQuestions.length}
                </span>
                <span className="text-[11px] text-slate-500">
                  {currentQ.topic || 'Materi Perbendaharaan'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleShuffleQuestions}
                title="Acak Urutan Soal Latihan"
                className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>Acak Urutan</span>
              </button>

              <button
                type="button"
                onClick={handleResetSession}
                title="Bersihkan Semua Jawaban"
                className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Jawaban</span>
              </button>

              <button
                type="button"
                onClick={() => setShowFinishedModal(true)}
                className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Award className="w-4 h-4" />
                <span>Sudah Puas / Selesai</span>
              </button>
            </div>
          </div>

          {/* Main Question Card with Instant Feedback */}
          <div className={`p-6 sm:p-8 rounded-3xl border-2 shadow-xl space-y-6 transition-all ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            {/* Topic & Difficulty Badges */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                  {currentQ.topic || 'Umum'}
                </span>

                {currentQ.difficulty === 'MUDAH' && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    🟢 Mudah (Dasar)
                  </span>
                )}
                {currentQ.difficulty === 'SEDANG' && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                    🟡 Sedang (Prosedural)
                  </span>
                )}
                {currentQ.difficulty === 'ANALISIS' && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300 dark:border-purple-800 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-purple-600" />
                    🔴 Analisis HOTS
                  </span>
                )}
              </div>

              {/* Status Indicator */}
              {isCurrentAnswered ? (
                isCurrentCorrect ? (
                  <span className="px-3 py-1 rounded-xl text-xs font-black bg-emerald-500 text-white flex items-center gap-1.5 shadow-sm animate-in zoom-in-95">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Jawaban Anda Benar!</span>
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-xl text-xs font-black bg-rose-600 text-white flex items-center gap-1.5 shadow-sm animate-in zoom-in-95">
                    <XCircle className="w-4 h-4" />
                    <span>Jawaban Anda Keliru</span>
                  </span>
                )
              ) : (
                <span className="text-xs font-bold text-slate-400">
                  Pilih salah satu jawaban di bawah untuk melihat pembahasan:
                </span>
              )}
            </div>

            {/* Question Text */}
            <div className="space-y-2">
              <h3 className="text-base sm:text-lg lg:text-xl font-black text-slate-900 dark:text-white leading-relaxed whitespace-pre-line">
                {currentQ.questionText}
              </h3>
            </div>

            {/* ABCD Options with Instant Color Feedback */}
            <div className="space-y-3 pt-2">
              {(['A', 'B', 'C', 'D'] as const).map(optionKey => {
                const optText = currentQ[`option${optionKey}` as keyof QuizQuestion] as string;
                if (!optText) return null;

                const isChosen = userSelectedChoice === optionKey;
                const isCorrectKey = currentQ.correctAnswer === optionKey;

                // Color classes based on answered state
                let optionStyle = 'border-slate-200 dark:border-slate-700 hover:border-emerald-400 bg-slate-50/60 dark:bg-slate-800/40 text-slate-800 dark:text-slate-200';
                
                if (isCurrentAnswered) {
                  if (isCorrectKey) {
                    optionStyle = 'border-emerald-500 bg-emerald-100/70 dark:bg-emerald-950/50 text-emerald-950 dark:text-emerald-100 font-bold ring-2 ring-emerald-500 shadow-md';
                  } else if (isChosen && !isCorrectKey) {
                    optionStyle = 'border-rose-500 bg-rose-100/70 dark:bg-rose-950/50 text-rose-950 dark:text-rose-100 ring-2 ring-rose-500 shadow-md';
                  } else {
                    optionStyle = 'opacity-40 border-slate-200 dark:border-slate-800 text-slate-500';
                  }
                }

                return (
                  <button
                    key={optionKey}
                    type="button"
                    onClick={() => handleSelectChoice(optionKey)}
                    className={`w-full p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 text-left text-xs sm:text-sm ${optionStyle}`}
                  >
                    <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 transition-all ${
                      isCurrentAnswered && isCorrectKey
                        ? 'bg-emerald-600 text-white'
                        : isCurrentAnswered && isChosen && !isCorrectKey
                          ? 'bg-rose-600 text-white'
                          : 'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}>
                      {optionKey}
                    </span>

                    <span className="flex-1 pt-0.5 leading-relaxed">
                      {optText}
                    </span>

                    {/* Checkmark or Cross Indicator */}
                    {isCurrentAnswered && isCorrectKey && (
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-600 text-white text-[10px] font-black uppercase shrink-0">
                        ✓ Kunci Jawaban
                      </span>
                    )}
                    {isCurrentAnswered && isChosen && !isCorrectKey && (
                      <span className="px-2 py-0.5 rounded-lg bg-rose-600 text-white text-[10px] font-black uppercase shrink-0">
                        ✗ Pilihan Anda
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* INSTANT FEEDBACK: PEMBAHASAN MENDALAM & DASAR HUKUM */}
            {isCurrentAnswered && (
              <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-emerald-50 via-teal-50 to-slate-50 dark:from-slate-800 dark:via-slate-800/90 dark:to-slate-800/60 border-2 border-emerald-300 dark:border-emerald-700 space-y-4 animate-in slide-in-from-top-4 duration-200 shadow-lg">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-black text-sm">
                  <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>💡 Pembahasan Lengkap &amp; Rasional Jawaban:</span>
                </div>

                <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line pl-1">
                  {currentQ.explanation || 'Pembahasan materi untuk butir soal ini telah diverifikasi sesuai ketentuan perbendaharaan.'}
                </p>

                {currentQ.referenceRegulation && (
                  <div className="pt-3 border-t border-emerald-200 dark:border-slate-700 flex items-start gap-2 text-xs">
                    <Scale className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-black text-slate-900 dark:text-slate-100 block">
                        Dasar Hukum &amp; Referensi Regulasi:
                      </span>
                      <span className="font-mono text-slate-600 dark:text-slate-300 text-[11px]">
                        {currentQ.referenceRegulation}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Bottom Question Navigators (Prev / Next) */}
            <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                disabled={currentIdx <= 0}
                onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
                className="px-4 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 text-xs font-bold disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Soal Sebelumnya</span>
              </button>

              <div className="flex items-center gap-1.5">
                {currentIdx < practiceQuestions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentIdx(prev => Math.min(practiceQuestions.length - 1, prev + 1))}
                    className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-2 shadow-md cursor-pointer transition-all hover:scale-105 active:scale-95"
                  >
                    <span>Soal Berikutnya</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowFinishedModal(true)}
                    className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-md cursor-pointer transition-all"
                  >
                    <Award className="w-4 h-4 text-slate-950" />
                    <span>Selesai Latihan</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Quick Question Number Grid Selector */}
          <div className={`p-5 rounded-3xl border shadow-md space-y-3 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <span className="text-xs font-black uppercase tracking-wider text-slate-500 block">
              Navigasi Cepat Butir Soal ({practiceQuestions.length} Soal):
            </span>

            <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-1">
              {practiceQuestions.map((q, idx) => {
                const userChoice = answeredState[q.id];
                const isAnswered = userChoice !== undefined;
                const isCorrect = isAnswered && userChoice === q.correctAnswer;
                const isCurrent = idx === currentIdx;

                let btnClass = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700';
                if (isCurrent) {
                  btnClass = 'ring-2 ring-emerald-500 bg-emerald-600 text-white font-black';
                } else if (isAnswered) {
                  btnClass = isCorrect 
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300'
                    : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-rose-300';
                }

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentIdx(idx)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${btnClass}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 1: PASSWORD KHUSUS KPPN INTERNAL */}
      {/* ===================================================================== */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className={`w-full max-w-md rounded-3xl p-6 border shadow-2xl space-y-4 ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black">
                    Materi Khusus Pegawai KPPN
                  </h3>
                  <p className="text-xs text-slate-500">
                    Masukkan PIN / Password akses internal KPPN
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => { setShowPasswordModal(false); setEnteredPassword(''); setPasswordError(null); }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {passwordError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Password Akses Internal:
              </label>
              <input
                type="password"
                autoFocus
                value={enteredPassword}
                onChange={e => { setEnteredPassword(e.target.value); setPasswordError(null); }}
                onKeyDown={e => { if (e.key === 'Enter') handleVerifyPassword(); }}
                placeholder="Ketik password internal (kppn026)..."
                className="w-full px-4 py-3 rounded-2xl border-2 border-indigo-500 text-sm font-bold bg-slate-50 dark:bg-slate-800 focus:outline-hidden"
              />
              <span className="text-[11px] text-slate-400 block pt-1">
                💡 Petunjuk default untuk pegawai dinas: <code>kppn026</code>
              </span>
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => { setShowPasswordModal(false); setEnteredPassword(''); setPasswordError(null); }}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleVerifyPassword}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-md cursor-pointer"
              >
                Buka Akses Latihan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2: "SUDAH PUAS / SELESAI LATIHAN" SUMMARY MODAL */}
      {/* ===================================================================== */}
      {showFinishedModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className={`w-full max-w-lg rounded-3xl p-6 sm:p-8 border shadow-2xl space-y-6 text-center ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center mx-auto text-2xl shadow-xl">
              🎉
            </div>

            <div className="space-y-1">
              <h3 className="text-xl sm:text-2xl font-black">
                Selesai Belajar Mandiri!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Latihan santai Anda telah selesai. Anda dapat meninjau pemahaman yang diperoleh hari ini.
              </p>
            </div>

            {/* Stats Highlight Grid */}
            <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-black block">Soal Dicoba</span>
                <span className="text-xl font-black font-mono text-slate-900 dark:text-white">
                  {sessionStats.answered} / {sessionStats.total}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-black block">Benar</span>
                <span className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                  {sessionStats.correct}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-cyan-600 dark:text-cyan-400 uppercase font-black block">Akurasi</span>
                <span className="text-xl font-black font-mono text-cyan-600 dark:text-cyan-400">
                  {sessionStats.accuracy}%
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowFinishedModal(false);
                  setIsPracticing(false);
                }}
                className="w-full py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-black hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Pilih Materi Latihan Lain
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowFinishedModal(false);
                  onExitPractice();
                }}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md cursor-pointer transition-all"
              >
                Kembali ke Simulasi Ujian CAT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
