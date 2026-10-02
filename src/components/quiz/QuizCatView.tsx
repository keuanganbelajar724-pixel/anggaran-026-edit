import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  HelpCircle, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw, 
  Trophy, 
  Award, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  Building2, 
  User, 
  Sparkles, 
  BookOpen, 
  Filter, 
  Search, 
  Flag, 
  Eraser, 
  FastForward, 
  Play, 
  FileText,
  Check,
  X,
  Share2,
  Download,
  Info,
  Layers,
  ArrowRight,
  Medal,
  Crown,
  Calendar
} from 'lucide-react';
import { QuizPackage, QuizQuestion, QuizUserAnswer, QuizResultRecord, QuizAudience } from '../../types/quiz';
import { AppUser, AppTheme, MasterSatker } from '../../types';
import { 
  getQuizPackages, 
  subscribeToQuizPackages, 
  saveQuizResult, 
  checkPackageScheduleStatus,
  subscribeToQuizResults,
  rankQuizResults 
} from '../../utils/quizStorage';

interface QuizCatViewProps {
  currentUser: AppUser | null;
  isAdminAuthenticated: boolean;
  theme?: AppTheme;
  masterSatkers?: MasterSatker[];
  onOpenLoginModal?: () => void;
  onNavigateToAdmin?: () => void;
}

type ExamStep = 'SELECT_PACKAGE' | 'IN_EXAM' | 'EXAM_RESULT';

export const QuizCatView: React.FC<QuizCatViewProps> = ({
  currentUser,
  isAdminAuthenticated,
  theme = 'light',
  masterSatkers = [],
  onOpenLoginModal,
  onNavigateToAdmin
}) => {
  const isDark = theme === 'dark';
  const isSuperAdmin = currentUser?.role === 'superadmin' || isAdminAuthenticated;
  const isInternalKppnUser = isSuperAdmin || currentUser?.role === 'pegawai';

  // Packages state
  const [packages, setPackages] = useState<QuizPackage[]>([]);
  const [selectedAudienceTab, setSelectedAudienceTab] = useState<'ALL' | 'satker' | 'kppn_internal'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Exam flow states
  const [currentStep, setCurrentStep] = useState<ExamStep>('SELECT_PACKAGE');
  const [activePackage, setActivePackage] = useState<QuizPackage | null>(null);

  // Participant Registration
  const [participantName, setParticipantName] = useState<string>('');
  const [participantSatker, setParticipantSatker] = useState<string>('');
  const [regError, setRegError] = useState<string | null>(null);

  // In-Exam State
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, { answer: 'A' | 'B' | 'C' | 'D' | null; isDoubt: boolean }>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(0);
  const [isConfirmSubmitOpen, setIsConfirmSubmitOpen] = useState<boolean>(false);
  const [examStartTime, setExamStartTime] = useState<number>(0);

  // Exam Result State
  const [latestResult, setLatestResult] = useState<QuizResultRecord | null>(null);
  const [resultFilterTab, setResultFilterTab] = useState<'all' | 'correct' | 'wrong' | 'unanswered'>('all');
  const [allResults, setAllResults] = useState<QuizResultRecord[]>([]);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState<boolean>(false);
  const [leaderboardPackageId, setLeaderboardPackageId] = useState<string>('ALL');

  // Load packages and subscribe to real-time updates
  useEffect(() => {
    const unsubPackages = subscribeToQuizPackages(list => {
      setPackages(list);
    });
    const unsubResults = subscribeToQuizResults(list => {
      setAllResults(list);
    });
    return () => {
      unsubPackages();
      unsubResults();
    };
  }, []);

  // Pre-fill user data if logged in
  useEffect(() => {
    if (currentUser) {
      if (!participantName) {
        setParticipantName(currentUser.displayName || currentUser.username);
      }
      if (!participantSatker) {
        setParticipantSatker(currentUser.seksi || 'KPPN Semarang I');
      }
    }
  }, [currentUser]);

  // Timer countdown
  useEffect(() => {
    if (currentStep !== 'IN_EXAM') return;

    if (timeLeftSeconds <= 0) {
      // Time is up! Auto submit
      handleFinishExam();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeftSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinishExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentStep, timeLeftSeconds]);

  // Filtered packages
  const filteredPackages = useMemo(() => {
    return packages.filter(p => {
      if (!p.isActive) return false;
      if (selectedAudienceTab === 'satker' && p.targetAudience === 'kppn_internal') return false;
      if (selectedAudienceTab === 'kppn_internal' && p.targetAudience !== 'kppn_internal') return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
      }
      return true;
    });
  }, [packages, selectedAudienceTab, searchQuery]);

  // Format MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Start exam handler
  const handleStartExam = (pkg: QuizPackage) => {
    // Check permission for KPPN Internal packages
    if (pkg.targetAudience === 'kppn_internal' && !isInternalKppnUser) {
      setRegError('Paket Ujian ini dikhususkan untuk Pegawai Internal KPPN. Satker mitra tidak memiliki akses membuka paket ini. Silakan Login Pegawai untuk melanjutkan.');
      return;
    }

    if (!participantName.trim()) {
      setRegError('Mohon isi Nama Lengkap Peserta terlebih dahulu.');
      return;
    }

    if (!participantSatker.trim()) {
      setRegError('Mohon isi Asal Satuan Kerja / Unit Kerja.');
      return;
    }

    if (!pkg.questions || pkg.questions.length === 0) {
      setRegError('Paket ujian ini belum memiliki soal aktif.');
      return;
    }

    setRegError(null);
    setActivePackage(pkg);
    setCurrentQuestionIdx(0);

    // Initialize answer state
    const initialAnswers: Record<string, { answer: 'A' | 'B' | 'C' | 'D' | null; isDoubt: boolean }> = {};
    pkg.questions.forEach(q => {
      initialAnswers[q.id] = { answer: null, isDoubt: false };
    });
    setUserAnswers(initialAnswers);

    const totalSeconds = (pkg.durationMinutes || 15) * 60;
    setTimeLeftSeconds(totalSeconds);
    setExamStartTime(Date.now());
    setCurrentStep('IN_EXAM');
  };

  // Answer selection
  const handleSelectOption = (questionId: string, option: 'A' | 'B' | 'C' | 'D') => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        answer: option
      }
    }));
  };

  // Toggle marked as doubt / ragu-ragu
  const handleToggleDoubt = (questionId: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        isDoubt: !prev[questionId]?.isDoubt
      }
    }));
  };

  // Clear answer (kosongkan jawaban)
  const handleClearAnswer = (questionId: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        answer: null
      }
    }));
  };

  // Next / Previous
  const handleNextQuestion = () => {
    if (!activePackage) return;
    if (currentQuestionIdx < activePackage.questions.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx(prev => prev - 1);
    }
  };

  // Finish and compute score
  const handleFinishExam = async () => {
    if (!activePackage) return;
    setIsConfirmSubmitOpen(false);

    const timeSpent = Math.max(1, Math.round((Date.now() - examStartTime) / 1000));

    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;

    const answerReviewList = activePackage.questions.map(q => {
      const userAnsObj = userAnswers[q.id];
      const selected = userAnsObj?.answer || null;
      const isCorrect = selected === q.correctAnswer;

      if (!selected) {
        unansweredCount++;
      } else if (isCorrect) {
        correctCount++;
      } else {
        wrongCount++;
      }

      return {
        questionId: q.id,
        questionText: q.questionText,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        selectedAnswer: selected,
        correctAnswer: q.correctAnswer,
        isCorrect,
        explanation: q.explanation
      };
    });

    const totalQuestions = activePackage.questions.length;
    const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const passed = score >= (activePackage.passingGrade || 70);

    let roleType: 'satker' | 'pegawai' | 'superadmin' | 'tamu' = 'satker';
    if (currentUser?.role === 'superadmin') roleType = 'superadmin';
    else if (currentUser?.role === 'pegawai') roleType = 'pegawai';

    const resultRecord: QuizResultRecord = {
      id: `res_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      packageId: activePackage.id,
      packageTitle: activePackage.title,
      category: activePackage.category,
      targetAudience: activePackage.targetAudience,
      participantName: participantName.trim(),
      satkerOrUnit: participantSatker.trim(),
      userRoleType: roleType,
      totalQuestions,
      correctCount,
      wrongCount,
      unansweredCount,
      score,
      passed,
      timeSpentSeconds: timeSpent,
      completedAt: new Date().toISOString(),
      answers: answerReviewList
    };

    setLatestResult(resultRecord);
    setCurrentStep('EXAM_RESULT');

    try {
      const updated = await saveQuizResult(resultRecord);
      setAllResults(updated);
    } catch (err) {
      console.warn('[QuizCatView] Error saving result:', err);
    }
  };

  // Counts for current in-progress exam
  const inExamSummary = useMemo(() => {
    if (!activePackage) return { answered: 0, doubts: 0, unanswered: 0 };
    let answered = 0;
    let doubts = 0;
    let unanswered = 0;

    activePackage.questions.forEach(q => {
      const a = userAnswers[q.id];
      if (a?.isDoubt) doubts++;
      if (a?.answer) answered++;
      else unanswered++;
    });

    return { answered, doubts, unanswered };
  }, [activePackage, userAnswers]);

  // Current question object
  const currentQuestion = activePackage?.questions[currentQuestionIdx];
  const currentAnswerObj = currentQuestion ? userAnswers[currentQuestion.id] : null;

  // Ranked results for leaderboard modal
  const modalRankedResults = useMemo(() => {
    let list = allResults;
    if (leaderboardPackageId !== 'ALL') {
      list = list.filter(r => r.packageId === leaderboardPackageId);
    }
    return rankQuizResults(list);
  }, [allResults, leaderboardPackageId]);

  // Leaderboard & Podium Modal Component
  const renderLeaderboardModal = () => {
    if (!showLeaderboardModal) return null;

    const top1 = modalRankedResults[0] || null;
    const top2 = modalRankedResults[1] || null;
    const top3 = modalRankedResults[2] || null;
    const activePkgObj = packages.find(p => p.id === leaderboardPackageId);

    return (
      <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
        <div className={`w-full max-w-4xl max-h-[90vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden ${
          isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-600/10">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-amber-500 text-slate-950 shadow-md">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-base leading-tight">
                  🏆 Klasemen Juara &amp; Peringkat Kuis CAT
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {activePkgObj ? activePkgObj.title : 'Seluruh Paket Latihan Kuis KPPN Semarang I'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={leaderboardPackageId}
                onChange={e => setLeaderboardPackageId(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
              >
                <option value="ALL">Semua Paket ({allResults.length} peserta)</option>
                {packages.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({allResults.filter(r => r.packageId === p.id).length})
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setShowLeaderboardModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
            {/* Podium Top 3 */}
            {modalRankedResults.length > 0 ? (
              <div className="space-y-3">
                <div className="text-xs font-black uppercase tracking-wider text-slate-400 text-center">
                  Podium Penghargaan Juara
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  {/* Juara 2 (Perak) */}
                  <div className={`p-4 rounded-2xl border text-center space-y-1.5 sm:order-1 ${
                    top2 ? 'bg-slate-100/80 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 shadow-sm' : 'border-dashed border-slate-200 dark:border-slate-800 opacity-50'
                  }`}>
                    <div className="w-10 h-10 rounded-xl bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-100 mx-auto flex items-center justify-center text-lg font-black">
                      🥈
                    </div>
                    <div className="text-[10px] font-black uppercase text-slate-500">Juara 2 (Perak)</div>
                    {top2 ? (
                      <>
                        <div className="font-black text-sm truncate" title={top2.participantName}>{top2.participantName}</div>
                        <div className="text-[11px] text-slate-500 truncate">{top2.satkerOrUnit}</div>
                        <div className="text-xl font-black font-mono text-slate-700 dark:text-slate-200 pt-1">{top2.score}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Waktu: {Math.floor((top2.timeSpentSeconds || 0) / 60)}m {(top2.timeSpentSeconds || 0) % 60}d
                        </div>
                      </>
                    ) : (
                      <div className="text-xs text-slate-400 py-3">-</div>
                    )}
                  </div>

                  {/* Juara 1 (Emas) */}
                  <div className={`p-5 rounded-3xl border-2 text-center space-y-2 sm:order-2 shadow-xl sm:-translate-y-2 ${
                    top1 ? 'bg-gradient-to-b from-amber-500/20 to-amber-600/5 border-amber-400 dark:border-amber-500' : 'border-dashed border-slate-200 dark:border-slate-800 opacity-50'
                  }`}>
                    <div className="w-14 h-14 rounded-2xl bg-amber-400 text-slate-950 mx-auto flex items-center justify-center text-2xl font-black shadow-lg shadow-amber-500/30">
                      🥇
                    </div>
                    <div className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">Juara 1 (Emas)</div>
                    {top1 ? (
                      <>
                        <div className="font-black text-base truncate" title={top1.participantName}>{top1.participantName}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-300 truncate">{top1.satkerOrUnit}</div>
                        <div className="text-3xl font-black font-mono text-amber-500 pt-1">{top1.score}</div>
                        <div className="text-xs text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                          Waktu: {Math.floor((top1.timeSpentSeconds || 0) / 60)}m {(top1.timeSpentSeconds || 0) % 60}d
                        </div>
                      </>
                    ) : (
                      <div className="text-xs text-slate-400 py-4">-</div>
                    )}
                  </div>

                  {/* Juara 3 (Perunggu) */}
                  <div className={`p-4 rounded-2xl border text-center space-y-1.5 sm:order-3 ${
                    top3 ? 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800/40 shadow-sm' : 'border-dashed border-slate-200 dark:border-slate-800 opacity-50'
                  }`}>
                    <div className="w-10 h-10 rounded-xl bg-orange-200 dark:bg-orange-900/60 text-orange-900 dark:text-orange-200 mx-auto flex items-center justify-center text-lg font-black">
                      🥉
                    </div>
                    <div className="text-[10px] font-black uppercase text-orange-600 dark:text-orange-400">Juara 3 (Perunggu)</div>
                    {top3 ? (
                      <>
                        <div className="font-black text-sm truncate" title={top3.participantName}>{top3.participantName}</div>
                        <div className="text-[11px] text-slate-500 truncate">{top3.satkerOrUnit}</div>
                        <div className="text-xl font-black font-mono text-orange-600 dark:text-orange-400 pt-1">{top3.score}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Waktu: {Math.floor((top3.timeSpentSeconds || 0) / 60)}m {(top3.timeSpentSeconds || 0) % 60}d
                        </div>
                      </>
                    ) : (
                      <div className="text-xs text-slate-400 py-3">-</div>
                    )}
                  </div>
                </div>
              </div>
            ) : null}

            {/* Leaderboard Table */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3 text-center w-16">Peringkat</th>
                      <th className="py-2.5 px-3">Nama Peserta</th>
                      <th className="py-2.5 px-3">Satker / Unit</th>
                      <th className="py-2.5 px-3">Paket Ujian</th>
                      <th className="py-2.5 px-3 text-center">Skor</th>
                      <th className="py-2.5 px-3 text-center">Durasi</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {modalRankedResults.map((r) => {
                      const rankNum = r.rank || 1;
                      return (
                        <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="py-2.5 px-3 text-center">
                            {rankNum === 1 ? '🥇 #1' : rankNum === 2 ? '🥈 #2' : rankNum === 3 ? '🥉 #3' : `#${rankNum}`}
                          </td>
                          <td className="py-2.5 px-3 font-bold">{r.participantName}</td>
                          <td className="py-2.5 px-3 text-slate-500">{r.satkerOrUnit}</td>
                          <td className="py-2.5 px-3 text-slate-500 truncate max-w-[140px]">{r.packageTitle}</td>
                          <td className="py-2.5 px-3 text-center font-mono font-black text-amber-500">{r.score}</td>
                          <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-500">
                            {Math.floor((r.timeSpentSeconds || 0) / 60)}m {(r.timeSpentSeconds || 0) % 60}d
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                              r.passed
                                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                            }`}>
                              {r.passed ? 'LULUS' : 'GAGAL'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}

                    {modalRankedResults.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          Belum ada peserta yang menyelesaikan kuis pada paket ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 flex justify-end bg-slate-50 dark:bg-slate-900">
            <button
              type="button"
              onClick={() => setShowLeaderboardModal(false)}
              className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-xs cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ==========================================================================
  // RENDER 1: SELEKSI PAKET & REGISTRASI UJIAN CAT
  // ==========================================================================
  if (currentStep === 'SELECT_PACKAGE') {
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white shadow-xl">
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-black uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                <span>Simulasi Ujian Berbasis Komputer (CAT KPPN 026)</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">
                Portal Kuis &amp; Uji Kompetensi Perbendaharaan
              </h1>
              <p className="text-xs sm:text-sm text-amber-100/90 leading-relaxed">
                Asah pemahaman regulasi IKPA, Capaian Output, modul SAKTI, dan SOP Perbendaharaan dengan sistem simulasi CAT interaktif layaknya ujian resmi BKN.
              </p>
            </div>

            {/* Super Admin Quick Link */}
            {isSuperAdmin && onNavigateToAdmin && (
              <button
                type="button"
                onClick={onNavigateToAdmin}
                className="bg-white text-amber-900 hover:bg-amber-50 font-black text-xs px-4 py-3 rounded-2xl shadow-lg flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shrink-0 self-start md:self-center cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>Kelola Paket Soal di Admin</span>
              </button>
            )}
          </div>
        </div>

        {/* Participant Registration Card */}
        <div className={`p-6 rounded-3xl border shadow-lg transition-all ${
          isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-amber-100 text-slate-900'
        }`}>
          <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black">
                Identitas Peserta Ujian CAT
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Isi identitas Anda sebelum memilih dan memulai paket ujian di bawah ini.
              </p>
            </div>
          </div>

          {regError && (
            <div className="mt-4 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{regError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Nama Lengkap Peserta <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={participantName}
                onChange={e => { setParticipantName(e.target.value); setRegError(null); }}
                placeholder="Contoh: Budi Santoso, S.E."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-sm font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Satuan Kerja / Unit Kerja <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={participantSatker}
                onChange={e => { setParticipantSatker(e.target.value); setRegError(null); }}
                placeholder="Contoh: KPPN Semarang I / Satker Kejaksaan Negeri..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-sm font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Filter Tab & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-200 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setSelectedAudienceTab('ALL')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                selectedAudienceTab === 'ALL'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Semua Paket ({packages.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedAudienceTab('satker')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedAudienceTab === 'satker'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Mitra Satker</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedAudienceTab('kppn_internal')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedAudienceTab === 'kppn_internal'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>🏛️ KPPN Internal</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setLeaderboardPackageId('ALL');
                setShowLeaderboardModal(true);
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
            >
              <Trophy className="w-4 h-4" />
              <span>🏆 Papan Juara ({allResults.length})</span>
            </button>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari materi kuis..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Package Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPackages.map(pkg => {
            const isInternal = pkg.targetAudience === 'kppn_internal';
            const isLocked = isInternal && !isInternalKppnUser;
            const scheduleInfo = checkPackageScheduleStatus(pkg);
            const canStart = !isLocked && scheduleInfo.isOpen;

            return (
              <div
                key={pkg.id}
                className={`relative flex flex-col justify-between rounded-3xl border-2 transition-all p-5 shadow-md ${
                  isLocked || !scheduleInfo.isOpen
                    ? 'border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 opacity-90'
                    : isDark
                      ? 'border-slate-800 bg-slate-900 hover:border-amber-500/50 hover:shadow-xl'
                      : 'border-slate-200 bg-white hover:border-amber-400 hover:shadow-xl'
                }`}
              >
                <div>
                  {/* Category & Audience Tag */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {pkg.category}
                    </span>

                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {pkg.isScheduled && (
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${scheduleInfo.badgeColor}`}>
                          {scheduleInfo.label}
                        </span>
                      )}

                      {isInternal ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-lg bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                          {isLocked ? <Lock className="w-3 h-3 text-indigo-500" /> : <Unlock className="w-3 h-3 text-indigo-400" />}
                          <span>Internal KPPN</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                          <Building2 className="w-3 h-3 text-emerald-500" />
                          <span>Mitra Satker</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="font-black text-base leading-snug text-slate-900 dark:text-white mb-2">
                    {pkg.title}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3 line-clamp-3">
                    {pkg.description}
                  </p>

                  {/* Scheduled Date Notice if configured */}
                  {pkg.isScheduled && (
                    <div className="mb-3 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-[11px] space-y-0.5">
                      <div className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        <span>Periode Buka Ujian:</span>
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                        {pkg.startAt ? new Date(pkg.startAt).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Kapan saja'} s.d. {pkg.endAt ? new Date(pkg.endAt).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Tidak terbatas'} WIB
                      </div>
                      <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 pt-0.5">
                        {scheduleInfo.details}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  {/* Meta Specs */}
                  <div className="grid grid-cols-3 gap-2 py-3 px-3 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 mb-4 text-center">
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">Soal</span>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                        {pkg.questions?.length || 0} Soal
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">Durasi</span>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center justify-center gap-0.5">
                        <Clock className="w-3 h-3 text-amber-500" />
                        <span>{pkg.durationMinutes}m</span>
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">Passing</span>
                      <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                        {pkg.passingGrade}%
                      </span>
                    </div>
                  </div>

                  {/* Lock Warning for Satker on Internal Packages */}
                  {isLocked ? (
                    <div className="space-y-2">
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-[11px] font-bold flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5 shrink-0" />
                        <span>Khusus Pegawai KPPN. Satker tidak dapat membuka paket ini.</span>
                      </div>
                      {onOpenLoginModal && (
                        <button
                          type="button"
                          onClick={onOpenLoginModal}
                          className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <User className="w-3.5 h-3.5" />
                          <span>Login Pegawai KPPN</span>
                        </button>
                      )}
                    </div>
                  ) : !scheduleInfo.isOpen ? (
                    <button
                      type="button"
                      disabled
                      className="w-full py-3 px-4 rounded-xl bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-black text-xs cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>{scheduleInfo.status === 'NOT_STARTED' ? '⏳ Belum Dibuka' : '🔒 Ujian Ditutup'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleStartExam(pkg)}
                      className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-md hover:shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Mulai Simulasi CAT</span>
                    </button>
                  )}

                  {/* Button to view this package's leaderboard */}
                  <button
                    type="button"
                    onClick={() => {
                      setLeaderboardPackageId(pkg.id);
                      setShowLeaderboardModal(true);
                    }}
                    className="w-full mt-2 py-1.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-amber-500/10 text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 font-bold text-[11px] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Trophy className="w-3.5 h-3.5 text-amber-500" />
                    <span>Lihat Juara Paket Ini ({allResults.filter(r => r.packageId === pkg.id).length})</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredPackages.length === 0 && (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            <HelpCircle className="w-12 h-12 mx-auto text-slate-400 mb-3 opacity-60" />
            <h4 className="font-bold text-slate-800 dark:text-slate-200">Tidak ada paket kuis yang cocok</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Coba gunakan kata kunci lain atau pilih tab filter audiens yang berbeda.</p>
          </div>
        )}

        {/* Global Leaderboard Modal */}
        {renderLeaderboardModal()}
      </div>
    );
  }

  // ==========================================================================
  // RENDER 2: SIMULASI UJIAN CAT AKTIF (PERSIS SEPERTI BKN CAT)
  // ==========================================================================
  if (currentStep === 'IN_EXAM' && activePackage && currentQuestion) {
    const isTimeUrgent = timeLeftSeconds < 180; // less than 3 minutes
    const isSelectedA = currentAnswerObj?.answer === 'A';
    const isSelectedB = currentAnswerObj?.answer === 'B';
    const isSelectedC = currentAnswerObj?.answer === 'C';
    const isSelectedD = currentAnswerObj?.answer === 'D';

    return (
      <div className="space-y-4 max-w-7xl mx-auto pb-16 animate-in fade-in duration-200">
        {/* Top Exam Header Bar */}
        <div className="bg-slate-950 text-white rounded-3xl p-4 sm:p-5 shadow-2xl border border-slate-800 sticky top-3 z-30 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-sm shrink-0">
              CAT
            </div>
            <div>
              <h2 className="font-black text-sm sm:text-base leading-tight flex items-center gap-2">
                <span>{activePackage.title}</span>
              </h2>
              <p className="text-[11px] text-slate-400 font-medium">
                Peserta: <strong className="text-amber-300 font-bold">{participantName}</strong> • {participantSatker}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
            {/* Countdown Timer */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-mono font-black text-sm sm:text-base border shadow-inner ${
              isTimeUrgent
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse'
                : 'bg-slate-900 text-amber-400 border-slate-800'
            }`}>
              <Clock className="w-4 h-4 shrink-0" />
              <span>{formatTime(timeLeftSeconds)}</span>
            </div>

            {/* Selesaikan Ujian Button */}
            <button
              type="button"
              onClick={() => setIsConfirmSubmitOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Selesaikan Ujian</span>
            </button>
          </div>
        </div>

        {/* Main Grid: Left Question, Right Number Palette */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Soal & Opsi (Col 8) */}
          <div className="lg:col-span-8 space-y-4">
            <div className={`p-6 sm:p-8 rounded-3xl border shadow-xl transition-all ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            }`}>
              {/* Question Header & Doubt Badge */}
              <div className="flex items-center justify-between gap-3 pb-4 mb-5 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black text-sm">
                    {currentQuestionIdx + 1}
                  </span>
                  <span className="font-extrabold text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    Soal No. {currentQuestionIdx + 1} dari {activePackage.questions.length}
                  </span>
                </div>

                {currentAnswerObj?.isDoubt && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-400/20 text-amber-600 dark:text-amber-400 border border-amber-400/40 text-[11px] font-black uppercase tracking-wider animate-pulse">
                    <Flag className="w-3 h-3 fill-current" />
                    <span>Ragu-Ragu</span>
                  </span>
                )}
              </div>

              {/* Question Text */}
              <div className="text-base sm:text-lg font-bold leading-relaxed text-slate-900 dark:text-white mb-6">
                {currentQuestion.questionText}
              </div>

              {/* Radio Options A, B, C, D */}
              <div className="space-y-3">
                {[
                  { key: 'A', text: currentQuestion.optionA, isSelected: isSelectedA },
                  { key: 'B', text: currentQuestion.optionB, isSelected: isSelectedB },
                  { key: 'C', text: currentQuestion.optionC, isSelected: isSelectedC },
                  { key: 'D', text: currentQuestion.optionD, isSelected: isSelectedD }
                ].map(opt => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => handleSelectOption(currentQuestion.id, opt.key as 'A' | 'B' | 'C' | 'D')}
                    className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex items-start gap-3.5 cursor-pointer ${
                      opt.isSelected
                        ? 'border-amber-500 bg-amber-500/10 shadow-md ring-2 ring-amber-500/20 text-slate-950 dark:text-white'
                        : isDark
                          ? 'border-slate-800 bg-slate-800/40 hover:border-slate-700 hover:bg-slate-800/70 text-slate-200'
                          : 'border-slate-200 bg-slate-50/70 hover:border-slate-300 hover:bg-white text-slate-800'
                    }`}
                  >
                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm shrink-0 transition-colors ${
                      opt.isSelected
                        ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}>
                      {opt.key}
                    </span>
                    <span className="text-sm font-semibold pt-1 leading-snug">
                      {opt.text}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom Actions Bar: Navigasi, Kosongkan, Ragu-ragu, Lewati */}
            <div className={`p-4 rounded-3xl border shadow-lg flex flex-wrap items-center justify-between gap-3 ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentQuestionIdx === 0}
                  onClick={handlePrevQuestion}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-extrabold text-xs flex items-center gap-1.5 transition-all hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Sebelumnya</span>
                </button>

                {/* Tombol Kosongkan Jawaban */}
                {currentAnswerObj?.answer && (
                  <button
                    type="button"
                    onClick={() => handleClearAnswer(currentQuestion.id)}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Hapus / batalkan pilihan jawaban pada nomor ini"
                  >
                    <Eraser className="w-3.5 h-3.5" />
                    <span>Kosongkan</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Tombol Ragu-ragu */}
                <button
                  type="button"
                  onClick={() => handleToggleDoubt(currentQuestion.id)}
                  className={`px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border ${
                    currentAnswerObj?.isDoubt
                      ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-md'
                      : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                  }`}
                  title="Tandai nomor ini ragu-ragu untuk diperiksa ulang"
                >
                  <Flag className={`w-3.5 h-3.5 ${currentAnswerObj?.isDoubt ? 'fill-current' : ''}`} />
                  <span>{currentAnswerObj?.isDoubt ? 'Batal Ragu' : 'Ragu-Ragu'}</span>
                </button>

                {/* Tombol Selanjutnya / Lewati */}
                <button
                  type="button"
                  onClick={handleNextQuestion}
                  disabled={currentQuestionIdx === activePackage.questions.length - 1}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <span>Selanjutnya</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Nomor Soal CAT Grid (Col 4) */}
          <div className="lg:col-span-4 space-y-4">
            <div className={`p-5 rounded-3xl border shadow-xl ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            }`}>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-slate-800">
                <h3 className="font-black text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-500" />
                  <span>Navigasi Nomor Soal</span>
                </h3>
                <span className="text-[11px] font-mono text-slate-500">
                  {inExamSummary.answered}/{activePackage.questions.length} Selesai
                </span>
              </div>

              {/* Number Grid */}
              <div className="grid grid-cols-5 gap-2 max-h-[380px] overflow-y-auto pr-1">
                {activePackage.questions.map((q, idx) => {
                  const state = userAnswers[q.id];
                  const isCurrent = idx === currentQuestionIdx;
                  const isAnswered = Boolean(state?.answer);
                  const isDoubt = Boolean(state?.isDoubt);

                  let bgClass = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';
                  if (isDoubt) {
                    bgClass = 'bg-amber-400 text-slate-950 font-black border-amber-500 shadow-md';
                  } else if (isAnswered) {
                    bgClass = 'bg-emerald-600 text-white font-black border-emerald-700 shadow-md';
                  }

                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setCurrentQuestionIdx(idx)}
                      className={`relative h-11 rounded-xl border-2 text-xs font-black transition-all flex items-center justify-center cursor-pointer ${bgClass} ${
                        isCurrent 
                          ? 'ring-3 ring-indigo-500 scale-105 z-10' 
                          : 'hover:scale-105'
                      }`}
                    >
                      <span>{idx + 1}</span>
                      {state?.answer && (
                        <span className="absolute bottom-0.5 text-[8px] font-mono font-bold opacity-80">
                          {state.answer}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Legend Status */}
              <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-3.5 h-3.5 rounded-md bg-emerald-600 border border-emerald-700 shrink-0" />
                  <span className="text-slate-600 dark:text-slate-300 font-medium">Sudah Terjawab ({inExamSummary.answered})</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-3.5 h-3.5 rounded-md bg-amber-400 border border-amber-500 shrink-0" />
                  <span className="text-slate-600 dark:text-slate-300 font-medium">Ragu-Ragu ({inExamSummary.doubts})</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-3.5 h-3.5 rounded-md bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 shrink-0" />
                  <span className="text-slate-600 dark:text-slate-300 font-medium">Belum Dijawab ({inExamSummary.unanswered})</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-3.5 h-3.5 rounded-md border-2 border-indigo-500 ring-2 ring-indigo-400/40 shrink-0" />
                  <span className="text-slate-600 dark:text-slate-300 font-medium">Soal Sedang Dibuka</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Konfirmasi Selesaikan Ujian */}
        {isConfirmSubmitOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
            <div className={`w-full max-w-md rounded-3xl p-6 border-2 shadow-2xl space-y-4 ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            }`}>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>

              <div className="text-center space-y-1">
                <h3 className="text-lg font-black">
                  Konfirmasi Selesaikan Ujian CAT
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Pastikan Anda telah memeriksa kembali seluruh jawaban sebelum mengumpulkan.
                </p>
              </div>

              {/* Rekap Box */}
              <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/60 text-center">
                <div>
                  <span className="text-[10px] text-slate-500 block">Terjawab</span>
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{inExamSummary.answered}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Ragu-ragu</span>
                  <span className="text-sm font-black text-amber-500">{inExamSummary.doubts}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Kosong</span>
                  <span className="text-sm font-black text-rose-500">{inExamSummary.unanswered}</span>
                </div>
              </div>

              {inExamSummary.unanswered > 0 && (
                <p className="text-xs font-bold text-amber-600 dark:text-amber-400 text-center">
                  ⚠️ Masih ada {inExamSummary.unanswered} soal yang belum Anda jawab.
                </p>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsConfirmSubmitOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Periksa Lagi
                </button>
                <button
                  type="button"
                  onClick={handleFinishExam}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md cursor-pointer"
                >
                  Kumpulkan Sekarang
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================================================
  // RENDER 3: HASIL SKOR AKHIR & PEMBAHASAN KUNCI JAWABAN LENGKAP
  // ==========================================================================
  if (currentStep === 'EXAM_RESULT' && latestResult) {
    const isPassed = latestResult.passed;
    const durationMin = Math.floor(latestResult.timeSpentSeconds / 60);
    const durationSec = latestResult.timeSpentSeconds % 60;

    const filteredAnswers = latestResult.answers.filter(ans => {
      if (resultFilterTab === 'correct') return ans.isCorrect;
      if (resultFilterTab === 'wrong') return !ans.isCorrect && ans.selectedAnswer !== null;
      if (resultFilterTab === 'unanswered') return ans.selectedAnswer === null;
      return true;
    });

    return (
      <div className="space-y-6 max-w-5xl mx-auto pb-16 animate-in fade-in duration-300">
        {/* Result Card Hero */}
        <div className={`p-8 rounded-3xl border-2 shadow-2xl text-center relative overflow-hidden ${
          isPassed
            ? 'bg-gradient-to-b from-emerald-950 via-slate-900 to-slate-950 border-emerald-500/50 text-white'
            : 'bg-gradient-to-b from-rose-950 via-slate-900 to-slate-950 border-rose-500/50 text-white'
        }`}>
          <div className="relative z-10 space-y-4 max-w-xl mx-auto">
            <div className={`w-20 h-20 rounded-3xl mx-auto flex items-center justify-center shadow-xl ${
              isPassed ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'
            }`}>
              {isPassed ? <Trophy className="w-10 h-10" /> : <AlertCircle className="w-10 h-10" />}
            </div>

            <div>
              <div className="text-xs uppercase font-black tracking-widest text-slate-400 mb-1">
                HASIL AKHIR SIMULASI UJIAN CAT
              </div>
              <h2 className="text-2xl sm:text-3xl font-black">
                {isPassed ? 'SELAMAT! ANDA LULUS' : 'BELUM MEMENUHI PASSING GRADE'}
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                {latestResult.packageTitle}
              </p>
            </div>

            {/* Score Number Display */}
            <div className="py-4">
              <span className="text-6xl sm:text-7xl font-black tracking-tight text-amber-400 font-mono">
                {latestResult.score}
              </span>
              <span className="text-lg font-bold text-slate-400"> / 100</span>
            </div>

            {/* Stats Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
              <div className="p-3 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10">
                <span className="text-[10px] text-slate-400 block font-semibold">Benar</span>
                <span className="text-sm font-black text-emerald-400">{latestResult.correctCount} Soal</span>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10">
                <span className="text-[10px] text-slate-400 block font-semibold">Salah</span>
                <span className="text-sm font-black text-rose-400">{latestResult.wrongCount} Soal</span>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10">
                <span className="text-[10px] text-slate-400 block font-semibold">Kosong</span>
                <span className="text-sm font-black text-slate-300">{latestResult.unansweredCount} Soal</span>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10">
                <span className="text-[10px] text-slate-400 block font-semibold">Waktu</span>
                <span className="text-sm font-black text-amber-300">{durationMin}m {durationSec}d</span>
              </div>
            </div>

            {/* Rank / Juara Competition Indicator */}
            {(() => {
              const packageResults = allResults.filter(r => r.packageId === latestResult.packageId);
              const combinedList = packageResults.some(r => r.id === latestResult.id) ? packageResults : [latestResult, ...packageResults];
              const rankedList = rankQuizResults(combinedList);
              const myRankObj = rankedList.find(r => r.id === latestResult.id);
              const myRank = myRankObj?.rank || 1;
              const totalContestants = rankedList.length;

              return (
                <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-center space-y-1.5 shadow-md">
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {myRank === 1 ? (
                      <span className="px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1 shadow-md">
                        🥇 JUARA 1 (EMAS)
                      </span>
                    ) : myRank === 2 ? (
                      <span className="px-3 py-1 rounded-full bg-slate-300 text-slate-950 font-black text-xs flex items-center gap-1 shadow-md">
                        🥈 JUARA 2 (PERAK)
                      </span>
                    ) : myRank === 3 ? (
                      <span className="px-3 py-1 rounded-full bg-orange-400 text-slate-950 font-black text-xs flex items-center gap-1 shadow-md">
                        🥉 JUARA 3 (PERUNGGU)
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-200 font-black text-xs border border-white/20">
                        Peringkat #{myRank}
                      </span>
                    )}
                    <span className="text-xs text-slate-200 font-bold">
                      dari total <strong>{totalContestants}</strong> peserta kuis
                    </span>
                  </div>
                  {myRank <= 3 && (
                    <p className="text-xs font-black text-amber-300">
                      🎉 Selamat! Anda menempati posisi Podium 3 Besar Pemenang Ujian Ini!
                    </p>
                  )}
                </div>
              );
            })()}

            {/* Actions */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setLeaderboardPackageId(latestResult.packageId);
                  setShowLeaderboardModal(true);
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-slate-950 font-black text-xs shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Trophy className="w-4 h-4" />
                <span>🏆 Cek Podium &amp; Peringkat Juara</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (activePackage) handleStartExam(activePackage);
                }}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Ulangi Ujian Ini</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setCurrentStep('SELECT_PACKAGE');
                  setActivePackage(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Pilih Paket Lain</span>
              </button>
            </div>
          </div>
        </div>

        {/* Pembahasan & Kunci Jawaban Lengkap */}
        <div className={`p-6 sm:p-8 rounded-3xl border shadow-xl ${
          isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-lg font-black flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-500" />
                <span>Pembahasan &amp; Kunci Jawaban Lengkap</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Evaluasi jawaban Anda terhadap kunci jawaban resmi dan penjelasan materi edukatif.
              </p>
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setResultFilterTab('all')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  resultFilterTab === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Semua ({latestResult.answers.length})
              </button>
              <button
                type="button"
                onClick={() => setResultFilterTab('correct')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  resultFilterTab === 'correct'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Benar ({latestResult.correctCount})
              </button>
              <button
                type="button"
                onClick={() => setResultFilterTab('wrong')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  resultFilterTab === 'wrong'
                    ? 'bg-rose-600 text-white'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Salah ({latestResult.wrongCount})
              </button>
              <button
                type="button"
                onClick={() => setResultFilterTab('unanswered')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  resultFilterTab === 'unanswered'
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Kosong ({latestResult.unansweredCount})
              </button>
            </div>
          </div>

          {/* List Review Soal */}
          <div className="divide-y divide-slate-200 dark:divide-slate-800 mt-4">
            {filteredAnswers.map((item, idx) => {
              const isUnanswered = item.selectedAnswer === null;

              return (
                <div key={item.questionId} className="py-6 first:pt-2 last:pb-2 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-black text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-extrabold text-slate-500">
                        Pertanyaan No. {idx + 1}
                      </span>
                    </div>

                    {/* Status Pill */}
                    {isUnanswered ? (
                      <span className="px-2.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[11px] font-bold">
                        Tidak Dijawab
                      </span>
                    ) : item.isCorrect ? (
                      <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-black flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Jawaban Benar</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-md bg-rose-500/20 text-rose-600 dark:text-rose-400 text-[11px] font-black flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Jawaban Salah</span>
                      </span>
                    )}
                  </div>

                  <p className="font-bold text-sm sm:text-base leading-relaxed text-slate-900 dark:text-white">
                    {item.questionText}
                  </p>

                  {/* Options Comparison */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {[
                      { key: 'A', text: item.optionA },
                      { key: 'B', text: item.optionB },
                      { key: 'C', text: item.optionC },
                      { key: 'D', text: item.optionD }
                    ].map(opt => {
                      const isUserChoice = item.selectedAnswer === opt.key;
                      const isKey = item.correctAnswer === opt.key;

                      let pillStyle = 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-slate-700 dark:text-slate-300';
                      if (isKey) {
                        pillStyle = 'border-emerald-500 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-bold';
                      } else if (isUserChoice && !item.isCorrect) {
                        pillStyle = 'border-rose-500 bg-rose-500/10 text-rose-800 dark:text-rose-300 line-through';
                      }

                      return (
                        <div
                          key={opt.key}
                          className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${pillStyle}`}
                        >
                          <span className="flex items-center gap-2">
                            <strong className="font-black">{opt.key}.</strong>
                            <span>{opt.text}</span>
                          </span>
                          {isKey && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-600 text-white font-black shrink-0">
                              KUNCI
                            </span>
                          )}
                          {isUserChoice && !isKey && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-600 text-white font-black shrink-0">
                              PILIHAN ANDA
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation Box */}
                  {item.explanation && (
                    <div className="p-3.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 text-xs text-indigo-900 dark:text-indigo-200 space-y-1">
                      <span className="font-black flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Pembahasan Materi:</span>
                      </span>
                      <p className="leading-relaxed">
                        {item.explanation}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Global Leaderboard Modal */}
        {renderLeaderboardModal()}
      </div>
    );
  }

  return null;
};
