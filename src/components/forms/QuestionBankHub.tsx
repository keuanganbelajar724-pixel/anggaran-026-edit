import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  Search, 
  Sparkles, 
  Scale, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Play, 
  Plus, 
  RotateCcw, 
  FileText, 
  Award, 
  Check, 
  ArrowRight,
  TrendingUp,
  Clock,
  Layers,
  Send,
  Eye,
  Trash2
} from 'lucide-react';
import { 
  QuestionBankItem, 
  QuestionDifficulty, 
  QuestionTopic 
} from '../../types/questionBank';
import { 
  getQuestionBank, 
  saveQuestionBankItem, 
  deleteQuestionBankItem,
  resetQuestionBankToDefault,
  createQuizFormFromQuestions
} from '../../utils/questionBankStorage';
import { saveKppnForm } from '../../utils/formStorage';
import { QUESTION_TOPIC_METAS } from '../../data/questionBankData';
import { KppnForm } from '../../types/form';

interface QuestionBankHubProps {
  onFormCreated?: (newForm: KppnForm) => void;
  onSelectFormForBuilder?: (formId: string) => void;
}

type HubTab = 'BROWSE' | 'PRACTICE_TRYOUT' | 'ADD_QUESTION';

export const QuestionBankHub: React.FC<QuestionBankHubProps> = ({
  onFormCreated,
  onSelectFormForBuilder
}) => {
  const [activeTab, setActiveTab] = useState<HubTab>('BROWSE');
  const [questions, setQuestions] = useState<QuestionBankItem[]>(() => getQuestionBank());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'ALL' | QuestionDifficulty>('ALL');
  const [selectedTopic, setSelectedTopic] = useState<'ALL' | QuestionTopic>('ALL');
  const [expandedExplanationIds, setExpandedExplanationIds] = useState<Set<string>>(new Set());
  const [feedbackToast, setFeedbackToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Practice / Tryout Mode State
  const [practiceTopic, setPracticeTopic] = useState<'ALL' | QuestionTopic>('ALL');
  const [practiceDifficulty, setPracticeDifficulty] = useState<'ALL' | QuestionDifficulty>('ALL');
  const [practiceActiveIndex, setPracticeActiveIndex] = useState<number>(0);
  const [practiceAnswers, setPracticeAnswers] = useState<Record<string, string>>({}); // questionId -> optionId
  const [practiceChecked, setPracticeChecked] = useState<Record<string, boolean>>({}); // questionId -> boolean
  const [isPracticeFinished, setIsPracticeFinished] = useState<boolean>(false);

  // New Custom Question State
  const [newTitle, setNewTitle] = useState<string>('');
  const [newCode, setNewCode] = useState<string>('');
  const [newTopic, setNewTopic] = useState<QuestionTopic>('IKPA_ANGGARAN');
  const [newDifficulty, setNewDifficulty] = useState<QuestionDifficulty>('ANALISIS_HOTS');
  const [newScenario, setNewScenario] = useState<string>('');
  const [newQuestion, setNewQuestion] = useState<string>('');
  const [newOptions, setNewOptions] = useState<Array<{ id: string; label: string; isCorrect: boolean }>>([
    { id: 'opt_a', label: '', isCorrect: true },
    { id: 'opt_b', label: '', isCorrect: false },
    { id: 'opt_c', label: '', isCorrect: false },
    { id: 'opt_d', label: '', isCorrect: false }
  ]);
  const [newExplanation, setNewExplanation] = useState<string>('');
  const [newLegalBasis, setNewLegalBasis] = useState<string>('');
  const [newTakeaway, setNewTakeaway] = useState<string>('');

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackToast({ text, type });
    setTimeout(() => setFeedbackToast(null), 3500);
  };

  // Stats
  const stats = useMemo(() => {
    const total = questions.length;
    const gampang = questions.filter(q => q.difficulty === 'GAMPANG').length;
    const sedang = questions.filter(q => q.difficulty === 'SEDANG').length;
    const hots = questions.filter(q => q.difficulty === 'ANALISIS_HOTS').length;
    return { total, gampang, sedang, hots };
  }, [questions]);

  // Filtered Questions for Browse Tab
  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      if (selectedDifficulty !== 'ALL' && q.difficulty !== selectedDifficulty) return false;
      if (selectedTopic !== 'ALL' && q.topic !== selectedTopic) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const inTitle = q.title.toLowerCase().includes(query);
        const inQuestion = q.question.toLowerCase().includes(query);
        const inScenario = q.scenario ? q.scenario.toLowerCase().includes(query) : false;
        const inCode = q.code.toLowerCase().includes(query);
        const inLegal = q.legalBasis.toLowerCase().includes(query);
        const inTags = q.tags.some(t => t.toLowerCase().includes(query));
        if (!inTitle && !inQuestion && !inScenario && !inCode && !inLegal && !inTags) return false;
      }
      return true;
    });
  }, [questions, selectedDifficulty, selectedTopic, searchQuery]);

  // Questions for Practice / Tryout Mode
  const practiceQuestions = useMemo(() => {
    return questions.filter(q => {
      if (practiceTopic !== 'ALL' && q.topic !== practiceTopic) return false;
      if (practiceDifficulty !== 'ALL' && q.difficulty !== practiceDifficulty) return false;
      return true;
    });
  }, [questions, practiceTopic, practiceDifficulty]);

  const toggleExplanation = (id: string) => {
    setExpandedExplanationIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset seluruh bank soal kembali ke standar kurikulum resmi Kemenkeu/Perbendaharaan?')) {
      const defs = resetQuestionBankToDefault();
      setQuestions(defs);
      showToast('Bank soal berhasil di-reset ke standar resmi!', 'success');
    }
  };

  const handleDeleteQuestion = (id: string) => {
    if (window.confirm('Hapus butir soal ini dari bank soal?')) {
      const updated = deleteQuestionBankItem(id);
      setQuestions(updated);
      showToast('Soal berhasil dihapus dari bank soal.', 'success');
    }
  };

  // 1-Click Generate Quiz Form from Filtered Questions
  const handleGenerateQuizForm = async () => {
    if (filteredQuestions.length === 0) {
      showToast('Tidak ada soal yang dipilih / terfilter.', 'error');
      return;
    }

    const title = `Kuis & Evaluasi Perbendaharaan: ${selectedDifficulty === 'ALL' ? 'Komprehensif' : selectedDifficulty} (${filteredQuestions.length} Soal)`;
    const desc = `Kuis evaluasi pemahaman regulasi APBN, tata kelola SP2D, IKPA, dan standar layanan KPPN. Dilengkapi kunci dan pembahasan.`;
    
    const newForm = createQuizFormFromQuestions(title, desc, filteredQuestions, 'EVALUASI_IKPA');
    await saveKppnForm(newForm);

    if (onFormCreated) {
      onFormCreated(newForm);
    }

    showToast(`Formulir kuis baru "${title}" berhasil dibuat! Siap disebarkan ke satker.`, 'success');
  };

  // Practice Mode Handlers
  const handleSelectPracticeOption = (questionId: string, optionId: string) => {
    if (practiceChecked[questionId]) return; // Already checked
    setPracticeAnswers(prev => ({ ...prev, [questionId]: optionId }));
  };

  const handleCheckAnswer = (questionId: string) => {
    setPracticeChecked(prev => ({ ...prev, [questionId]: true }));
  };

  const handleResetPractice = () => {
    setPracticeAnswers({});
    setPracticeChecked({});
    setPracticeActiveIndex(0);
    setIsPracticeFinished(false);
  };

  // Calculate practice score
  const practiceScore = useMemo(() => {
    let correctCount = 0;
    practiceQuestions.forEach(q => {
      const userAns = practiceAnswers[q.id];
      const correctOpt = q.options?.find(o => o.isCorrect);
      if (userAns && correctOpt && userAns === correctOpt.id) {
        correctCount++;
      }
    });
    const total = practiceQuestions.length;
    const percentage = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    return { correctCount, total, percentage };
  }, [practiceQuestions, practiceAnswers]);

  // Handle Save New Custom Question
  const handleSaveCustomQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newQuestion.trim()) {
      showToast('Judul dan Pertanyaan wajib diisi!', 'error');
      return;
    }

    const hasCorrectOpt = newOptions.some(o => o.isCorrect && o.label.trim());
    if (!hasCorrectOpt) {
      showToast('Wajib menentukan minimal 1 opsi jawaban yang benar!', 'error');
      return;
    }

    const correctOption = newOptions.find(o => o.isCorrect);

    const newItem: QuestionBankItem = {
      id: `qb_custom_${Date.now()}`,
      code: newCode.trim() || `CUST-${Math.floor(100 + Math.random() * 900)}`,
      title: newTitle.trim(),
      difficulty: newDifficulty,
      topic: newTopic,
      question: newQuestion.trim(),
      scenario: newScenario.trim() || undefined,
      type: 'MULTIPLE_CHOICE',
      options: newOptions.filter(o => o.label.trim()).map(o => ({
        id: o.id,
        label: o.label.trim(),
        isCorrect: o.isCorrect
      })),
      correctAnswerId: correctOption?.id,
      correctAnswerLabel: correctOption?.label,
      explanation: newExplanation.trim() || 'Pembahasan mendalam untuk butir soal ini.',
      legalBasis: newLegalBasis.trim() || 'Regulasi Perbendaharaan Kemenkeu RI.',
      keyTakeaways: newTakeaway.trim() ? [newTakeaway.trim()] : ['Pahami prosedur dan dasar hukum terkait.'],
      tags: ['Custom', newDifficulty, newTopic],
      isOfficial: false,
      createdAt: new Date().toISOString()
    };

    const updated = saveQuestionBankItem(newItem);
    setQuestions(updated);
    showToast('Soal kustom baru berhasil disimpan ke Bank Soal!', 'success');

    // Reset Form
    setNewTitle('');
    setNewCode('');
    setNewScenario('');
    setNewQuestion('');
    setNewExplanation('');
    setNewLegalBasis('');
    setNewTakeaway('');
    setActiveTab('BROWSE');
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {feedbackToast && (
        <div className={`p-4 rounded-2xl flex items-center justify-between shadow-xl text-xs font-bold transition-all animate-in slide-in-from-top-4 ${
          feedbackToast.type === 'success' 
            ? 'bg-emerald-600 text-white shadow-emerald-500/20' 
            : 'bg-rose-600 text-white shadow-rose-500/20'
        }`}>
          <div className="flex items-center gap-2">
            {feedbackToast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            <span>{feedbackToast.text}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setFeedbackToast(null)} 
            className="text-white/80 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Hero Header & Quick Stats */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-sky-950 to-indigo-950 text-white shadow-xl relative overflow-hidden border border-sky-800/40">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  Treasury Knowledge & Question Bank
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  Gampang, Sedang & Kasus HOTS
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
                <BookOpen className="w-6 h-6 text-sky-400" />
                Bank Soal & Pengetahuan Pintar Perbendaharaan
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                Koleksi referensi ilmu keuangan negara, regulasi APBN, teknis SAKTI, standar IKM Permenpan-RB, 
                dan studi kasus analisis perbendaharaan lengkap dengan pembahasan mendalam & dasar hukum.
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleGenerateQuizForm}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-sky-500/25 cursor-pointer active:scale-95 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>🚀 Buat Kuis Baru Otomatis ({filteredQuestions.length} Soal)</span>
              </button>
              <button
                type="button"
                onClick={handleResetDefaults}
                className="px-3 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-slate-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Kembalikan ke standar resmi Kemenkeu"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Standar</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <span className="text-[10px] font-bold text-slate-400 block">Total Koleksi Soal</span>
              <span className="text-xl sm:text-2xl font-black text-white">{stats.total} Soal</span>
              <span className="text-[10px] text-sky-400 block mt-0.5">8 Topik Regulasi</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-sm">
              <span className="text-[10px] font-bold text-emerald-300 block">🟢 Tingkat Gampang</span>
              <span className="text-xl sm:text-2xl font-black text-emerald-200">{stats.gampang} Soal</span>
              <span className="text-[10px] text-emerald-400 block mt-0.5">Pemahaman & Konseptual</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 backdrop-blur-sm">
              <span className="text-[10px] font-bold text-amber-300 block">🟡 Tingkat Sedang</span>
              <span className="text-xl sm:text-2xl font-black text-amber-200">{stats.sedang} Soal</span>
              <span className="text-[10px] text-amber-400 block mt-0.5">Aplikasi & Prosedur</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 backdrop-blur-sm">
              <span className="text-[10px] font-bold text-purple-300 block">🔴 Analisis Kasus HOTS</span>
              <span className="text-xl sm:text-2xl font-black text-purple-200">{stats.hots} Soal</span>
              <span className="text-[10px] text-purple-400 block mt-0.5">Problem Solving & Solusi</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('BROWSE')}
          className={`pb-3 px-4 font-black text-xs flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'BROWSE'
              ? 'border-sky-600 text-sky-600 dark:text-sky-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Katalog Soal & Pembahasan Pintar ({filteredQuestions.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('PRACTICE_TRYOUT')}
          className={`pb-3 px-4 font-black text-xs flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'PRACTICE_TRYOUT'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Play className="w-4 h-4" />
          <span>🎯 Mode Tryout & Latihan Mandiri</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ADD_QUESTION')}
          className={`pb-3 px-4 font-black text-xs flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'ADD_QUESTION'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>➕ Tambah Butir Soal Baru</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: BROWSE QUESTION CATALOG & COMPREHENSIVE EXPLANATIONS               */}
      {/* ========================================================================= */}
      {activeTab === 'BROWSE' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari soal: ketik kata kunci, UU, PMK, Deviasi Halaman III, SAKTI, SP2D, Retur, IKM..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              {/* Difficulty Filter */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mr-1">Tingkat Kesulitan:</span>
                <button
                  type="button"
                  onClick={() => setSelectedDifficulty('ALL')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedDifficulty === 'ALL'
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  Semua ({questions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDifficulty('GAMPANG')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedDifficulty === 'GAMPANG'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50'
                  }`}
                >
                  🟢 Gampang ({stats.gampang})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDifficulty('SEDANG')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedDifficulty === 'SEDANG'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-400 hover:bg-amber-50'
                  }`}
                >
                  🟡 Sedang ({stats.sedang})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDifficulty('ANALISIS_HOTS')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedDifficulty === 'ANALISIS_HOTS'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-400 hover:bg-purple-50'
                  }`}
                >
                  🔴 Analisis HOTS ({stats.hots})
                </button>
              </div>

              {/* Topic Select */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Topik Bidang:</span>
                <select
                  value={selectedTopic}
                  onChange={e => setSelectedTopic(e.target.value as any)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  <option value="ALL">Semua Topik ({QUESTION_TOPIC_METAS.length} Bidang)</option>
                  {QUESTION_TOPIC_METAS.map(t => (
                    <option key={t.topic} value={t.topic}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Question List Cards */}
          <div className="space-y-4">
            {filteredQuestions.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-slate-50 dark:bg-slate-800/20 border border-slate-200 dark:border-slate-800">
                <HelpCircle className="w-12 h-12 mx-auto mb-3 text-slate-400 opacity-40" />
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Tidak ada butir soal yang sesuai filter</h4>
                <p className="text-xs text-slate-400 mt-1">Coba gunakan kata kunci pencarian lain atau pilih Semua Tingkat.</p>
              </div>
            ) : (
              filteredQuestions.map((q, qIdx) => {
                const isExp = expandedExplanationIds.has(q.id);

                return (
                  <div
                    key={q.id}
                    className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all space-y-4"
                  >
                    {/* Card Header */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                          #{qIdx + 1} [{q.code}]
                        </span>

                        {q.difficulty === 'GAMPANG' && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Gampang (Dasar)
                          </span>
                        )}
                        {q.difficulty === 'SEDANG' && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            Sedang (Prosedural)
                          </span>
                        )}
                        {q.difficulty === 'ANALISIS_HOTS' && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300 dark:border-purple-800 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                            Analisis Kasus HOTS
                          </span>
                        )}

                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                          • {q.title}
                        </span>
                      </div>

                      {/* Right action */}
                      <div className="flex items-center gap-2">
                        {!q.isOfficial && (
                          <button
                            type="button"
                            onClick={() => handleDeleteQuestion(q.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                            title="Hapus soal kustom"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('PRACTICE_TRYOUT');
                            setPracticeActiveIndex(practiceQuestions.findIndex(item => item.id === q.id) || 0);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Play className="w-3 h-3" />
                          <span>Coba Jawab</span>
                        </button>
                      </div>
                    </div>

                    {/* Scenario (HOTS Case Narrative) */}
                    {q.scenario && (
                      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-950 dark:text-amber-100 leading-relaxed space-y-1">
                        <span className="font-black flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                          <FileText className="w-4 h-4" />
                          Kasus & Skenario Masalah Nyata:
                        </span>
                        <p>{q.scenario}</p>
                      </div>
                    )}

                    {/* Question Content */}
                    <div className="text-sm font-black text-slate-900 dark:text-white leading-relaxed">
                      {q.question}
                    </div>

                    {/* Options list */}
                    {q.options && q.options.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options.map(opt => (
                          <div
                            key={opt.id}
                            className={`p-3 rounded-2xl text-xs flex items-start gap-2.5 border transition-all ${
                              opt.isCorrect
                                ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100 font-bold'
                                : 'bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                              opt.isCorrect
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                            }`}>
                              {opt.id.replace('opt_', '').toUpperCase()}
                            </span>
                            <span className="flex-1 leading-relaxed">{opt.label}</span>
                            {opt.isCorrect && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* In-depth Explanation Accordion */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => toggleExplanation(q.id)}
                        className="text-xs font-black text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 flex items-center gap-1.5 cursor-pointer py-1"
                      >
                        {isExp ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        <span>{isExp ? 'Tutup Pembahasan & Dasar Hukum' : '💡 Buka Pembahasan Mendalam & Dasar Hukum Lengkap'}</span>
                      </button>

                      {isExp && (
                        <div className="mt-3 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-sky-50/40 dark:from-slate-800/80 dark:to-slate-800/40 border border-sky-100 dark:border-slate-700 text-xs space-y-3.5 animate-in fade-in duration-150">
                          {/* Explanation */}
                          <div>
                            <span className="font-black text-sky-800 dark:text-sky-300 flex items-center gap-1.5 mb-1 text-sm">
                              💡 Pembahasan & Logika Analisis:
                            </span>
                            <div className="text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line space-y-1">
                              {q.explanation}
                            </div>
                          </div>

                          {/* Legal Basis */}
                          <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                            <span className="font-black text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5 mb-1">
                              <Scale className="w-4 h-4" />
                              Dasar Hukum & Regulasi Resmi:
                            </span>
                            <p className="text-slate-600 dark:text-slate-400 font-mono text-[11px] leading-relaxed">
                              {q.legalBasis}
                            </p>
                          </div>

                          {/* Key Takeaways */}
                          {q.keyTakeaways && q.keyTakeaways.length > 0 && (
                            <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                              <span className="font-black text-slate-800 dark:text-slate-200 block mb-1.5">
                                📌 Ringkasan Ilmu Pembelajaran:
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                {q.keyTakeaways.map((point, pIdx) => (
                                  <div key={pIdx} className="flex items-start gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300">
                                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                    <span>{point}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: INTERACTIVE PRACTICE & SMART TRYOUT MODE                           */}
      {/* ========================================================================= */}
      {activeTab === 'PRACTICE_TRYOUT' && (
        <div className="space-y-6">
          {/* Practice Header & Topic Controls */}
          <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Play className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  Mode Latihan Mandiri & Uji Kompetensi Pintar
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Uji pemahaman Anda terhadap regulasi dan kasus perbendaharaan. Dapatkan penilaian instan dan pembahasan langsung!
                </p>
              </div>

              {/* Reset Tryout */}
              <button
                type="button"
                onClick={handleResetPractice}
                className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Ulangi Tryout</span>
              </button>
            </div>

            {/* Filter selectors for tryout */}
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-500">Pilih Topik:</span>
                <select
                  value={practiceTopic}
                  onChange={e => {
                    setPracticeTopic(e.target.value as any);
                    handleResetPractice();
                  }}
                  className="px-3 py-1.5 rounded-xl font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  <option value="ALL">Seluruh Bidang ({questions.length} Soal)</option>
                  {QUESTION_TOPIC_METAS.map(t => (
                    <option key={t.topic} value={t.topic}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-500">Tingkat Kesulitan:</span>
                <select
                  value={practiceDifficulty}
                  onChange={e => {
                    setPracticeDifficulty(e.target.value as any);
                    handleResetPractice();
                  }}
                  className="px-3 py-1.5 rounded-xl font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  <option value="ALL">Campuran (Gampang, Sedang & HOTS)</option>
                  <option value="GAMPANG">🟢 Hanya Soal Gampang (Dasar)</option>
                  <option value="SEDANG">🟡 Hanya Soal Sedang (Prosedural)</option>
                  <option value="ANALISIS_HOTS">🔴 Hanya Soal Analisis Kasus HOTS</option>
                </select>
              </div>

              {/* Score indicator */}
              <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-black">
                <Award className="w-4 h-4" />
                <span>Skor: {practiceScore.percentage}% ({practiceScore.correctCount} / {practiceScore.total} Benar)</span>
              </div>
            </div>
          </div>

          {/* Practice Question Card */}
          {practiceQuestions.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-slate-50 dark:bg-slate-800/20 border border-slate-200 dark:border-slate-800">
              <p className="text-sm font-bold text-slate-600">Tidak ada soal pada kombinasi filter ini.</p>
            </div>
          ) : (
            (() => {
              const currentQ = practiceQuestions[practiceActiveIndex] || practiceQuestions[0];
              const userAnswer = practiceAnswers[currentQ.id];
              const isChecked = practiceChecked[currentQ.id];
              const correctOption = currentQ.options?.find(o => o.isCorrect);
              const isUserCorrect = userAnswer && correctOption && userAnswer === correctOption.id;

              return (
                <div className="space-y-4">
                  {/* Question Navigator Bar */}
                  <div className="flex flex-wrap items-center gap-1.5 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[11px] font-bold text-slate-400 mr-2">Nomor:</span>
                    {practiceQuestions.map((pq, idx) => {
                      const ans = practiceAnswers[pq.id];
                      const chk = practiceChecked[pq.id];
                      const corr = pq.options?.find(o => o.isCorrect);
                      const isCorr = ans && corr && ans === corr.id;

                      let btnColor = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400';
                      if (chk) {
                        btnColor = isCorr ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white';
                      } else if (ans) {
                        btnColor = 'bg-sky-600 text-white';
                      }

                      const isActive = practiceActiveIndex === idx;

                      return (
                        <button
                          key={pq.id}
                          type="button"
                          onClick={() => setPracticeActiveIndex(idx)}
                          className={`w-7 h-7 rounded-lg text-xs font-black transition-all cursor-pointer ${btnColor} ${
                            isActive ? 'ring-2 ring-indigo-500 scale-110 shadow-md' : 'opacity-80 hover:opacity-100'
                          }`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>

                  {/* Main Question Practice Card */}
                  <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-6">
                    {/* Top status */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 font-mono text-xs font-black">
                          Soal {practiceActiveIndex + 1} dari {practiceQuestions.length} [{currentQ.code}]
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {currentQ.difficulty}
                        </span>
                      </div>

                      <span className="text-xs font-bold text-slate-400">
                        {currentQ.title}
                      </span>
                    </div>

                    {/* Scenario */}
                    {currentQ.scenario && (
                      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs sm:text-sm text-amber-950 dark:text-amber-100 leading-relaxed space-y-1">
                        <span className="font-black flex items-center gap-1.5 text-amber-700 dark:text-amber-400 text-xs">
                          <FileText className="w-4 h-4" />
                          Kasus Skenario HOTS:
                        </span>
                        <p>{currentQ.scenario}</p>
                      </div>
                    )}

                    {/* Question text */}
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-relaxed">
                      {currentQ.question}
                    </h3>

                    {/* Interactive Options list */}
                    <div className="space-y-2.5">
                      {currentQ.options?.map(opt => {
                        const isChosen = userAnswer === opt.id;
                        let optStyle = 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-sky-400';

                        if (isChosen && !isChecked) {
                          optStyle = 'bg-sky-50 dark:bg-sky-950/40 border-sky-500 text-sky-900 dark:text-sky-100 ring-2 ring-sky-500/30';
                        } else if (isChecked) {
                          if (opt.isCorrect) {
                            optStyle = 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-100 ring-2 ring-emerald-500/30 font-bold';
                          } else if (isChosen && !opt.isCorrect) {
                            optStyle = 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-900 dark:text-rose-100 ring-2 ring-rose-500/30';
                          }
                        }

                        return (
                          <div
                            key={opt.id}
                            onClick={() => handleSelectPracticeOption(currentQ.id, opt.id)}
                            className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-start gap-3 transition-all cursor-pointer select-none ${optStyle}`}
                          >
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                              isChosen 
                                ? 'bg-sky-600 text-white' 
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                            }`}>
                              {opt.id.replace('opt_', '').toUpperCase()}
                            </span>
                            <span className="flex-1 leading-relaxed mt-0.5">{opt.label}</span>
                            {isChecked && opt.isCorrect && (
                              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                            )}
                            {isChecked && isChosen && !opt.isCorrect && (
                              <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Bottom Action: Check Answer & Read Explanation */}
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {!isChecked ? (
                          <button
                            type="button"
                            disabled={!userAnswer}
                            onClick={() => handleCheckAnswer(currentQ.id)}
                            className={`px-5 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all ${
                              userAnswer
                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/25 cursor-pointer active:scale-95'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                            }`}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Periksa Jawaban & Buka Pembahasan</span>
                          </button>
                        ) : (
                          <div className={`px-4 py-2 rounded-2xl text-xs font-black flex items-center gap-2 ${
                            isUserCorrect 
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}>
                            {isUserCorrect ? (
                              <>
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                <span>Luar Biasa! Jawaban Anda Benar (100)</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-4 h-4 text-rose-600" />
                                <span>Kurang Tepat. Kunci yang benar adalah {correctOption?.id.replace('opt_', '').toUpperCase()}</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Navigation buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={practiceActiveIndex === 0}
                          onClick={() => setPracticeActiveIndex(prev => Math.max(0, prev - 1))}
                          className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 disabled:opacity-40 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          Sebelumnya
                        </button>
                        <button
                          type="button"
                          disabled={practiceActiveIndex === practiceQuestions.length - 1}
                          onClick={() => setPracticeActiveIndex(prev => Math.min(practiceQuestions.length - 1, prev + 1))}
                          className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-black disabled:opacity-40 cursor-pointer hover:opacity-90 flex items-center gap-1.5"
                        >
                          <span>Selanjutnya</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Instant Explanation Box when checked */}
                    {isChecked && (
                      <div className="mt-4 p-5 rounded-2xl bg-gradient-to-br from-indigo-50/70 to-sky-50/50 dark:from-slate-800 dark:to-slate-800/60 border border-indigo-200 dark:border-indigo-900 text-xs space-y-3 animate-in fade-in duration-200">
                        <div>
                          <span className="font-black text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5 text-sm mb-1">
                            💡 Pembahasan & Analisis Soal:
                          </span>
                          <p className="text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                            {currentQ.explanation}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-indigo-200/60 dark:border-slate-700">
                          <span className="font-black text-slate-800 dark:text-slate-300 flex items-center gap-1 mb-1">
                            <Scale className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                            Dasar Hukum:
                          </span>
                          <p className="text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                            {currentQ.legalBasis}
                          </p>
                        </div>

                        {currentQ.keyTakeaways && currentQ.keyTakeaways.length > 0 && (
                          <div className="pt-2 border-t border-indigo-200/60 dark:border-slate-700">
                            <span className="font-black text-slate-800 dark:text-slate-200 block mb-1">
                              📌 Poin Belajar Agar Lebih Pintar:
                            </span>
                            <ul className="list-disc pl-4 space-y-0.5 text-slate-600 dark:text-slate-400">
                              {currentQ.keyTakeaways.map((point, pIdx) => (
                                <li key={pIdx}>{point}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ADD NEW CUSTOM QUESTION                                            */}
      {/* ========================================================================= */}
      {activeTab === 'ADD_QUESTION' && (
        <form onSubmit={handleSaveCustomQuestion} className="space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-5">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                Tambah Butir Soal Baru ke Bank Soal
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Buat soal custom baru lengkap dengan narasi skenario, pilihan jawaban, kunci jawaban, serta pembahasan mendalam.
              </p>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Kode Soal (Opsional):
                </label>
                <input
                  type="text"
                  value={newCode}
                  onChange={e => setNewCode(e.target.value)}
                  placeholder="Contoh: HOTS-07 atau IKPA-08"
                  className="w-full px-3 py-2 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Topik Perbendaharaan:
                </label>
                <select
                  value={newTopic}
                  onChange={e => setNewTopic(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  {QUESTION_TOPIC_METAS.map(t => (
                    <option key={t.topic} value={t.topic}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tingkat Kesulitan:
                </label>
                <select
                  value={newDifficulty}
                  onChange={e => setNewDifficulty(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value="GAMPANG">🟢 Gampang (Pemahaman Dasar)</option>
                  <option value="SEDANG">🟡 Sedang (Prosedural & Aturan)</option>
                  <option value="ANALISIS_HOTS">🔴 Analisis Tinggi (Kasus HOTS)</option>
                </select>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Judul Ringkas Soal: *
              </label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="Contoh: Analisis Keterlambatan Realisasi SPM Kontraktual"
                className="w-full px-3 py-2 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            {/* Scenario Narrative (for HOTS) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Narasi Skenario / Kasus Nyata (Sangat Dianjurkan untuk Soal Analisis):
              </label>
              <textarea
                rows={3}
                value={newScenario}
                onChange={e => setNewScenario(e.target.value)}
                placeholder="Tuliskan latar belakang masalah satker, kendala pencairan, atau kasus perbendaharaan yang terjadi..."
                className="w-full px-3 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            {/* Question Text */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Kalimat Pertanyaan Inti: *
              </label>
              <textarea
                rows={2}
                required
                value={newQuestion}
                onChange={e => setNewQuestion(e.target.value)}
                placeholder="Tuliskan butir pertanyaan yang harus dijawab..."
                className="w-full px-3 py-2 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            {/* Options & Correct Answer Radio */}
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Pilihan Jawaban (Pilih radio button di kiri untuk kunci jawaban yang benar): *
              </label>

              <div className="space-y-2">
                {newOptions.map((opt, idx) => (
                  <div key={opt.id} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correctOption"
                      checked={opt.isCorrect}
                      onChange={() => {
                        setNewOptions(prev => prev.map((o, i) => ({ ...o, isCorrect: i === idx })));
                      }}
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      title="Tandai sebagai jawaban benar"
                    />
                    <span className="w-6 text-xs font-black text-slate-500">
                      {opt.id.replace('opt_', '').toUpperCase()}.
                    </span>
                    <input
                      type="text"
                      value={opt.label}
                      onChange={e => {
                        const val = e.target.value;
                        setNewOptions(prev => prev.map((o, i) => i === idx ? { ...o, label: val } : o));
                      }}
                      placeholder={`Opsi ${opt.id.replace('opt_', '').toUpperCase()}...`}
                      className={`flex-1 px-3 py-1.5 rounded-xl text-xs border ${
                        opt.isCorrect 
                          ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 font-bold' 
                          : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'
                      }`}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* In-depth Explanation & Legal Basis */}
            <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  💡 Pembahasan Komprehensif (Agar Satker/Pengguna Lebih Pintar): *
                </label>
                <textarea
                  rows={4}
                  required
                  value={newExplanation}
                  onChange={e => setNewExplanation(e.target.value)}
                  placeholder="Jelaskan secara mendalam mengapa jawaban benar adalah itu, mengapa opsi lain salah, dan bagaimana analisis logikanya..."
                  className="w-full px-3 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Dasar Hukum & Regulasi Resmi:
                  </label>
                  <input
                    type="text"
                    value={newLegalBasis}
                    onChange={e => setNewLegalBasis(e.target.value)}
                    placeholder="Contoh: PMK No. 190/PMK.05/2012 jo PMK 210/PMK.05/2022"
                    className="w-full px-3 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Poin Pembelajaran (Takeaway):
                  </label>
                  <input
                    type="text"
                    value={newTakeaway}
                    onChange={e => setNewTakeaway(e.target.value)}
                    placeholder="Contoh: Pendaftaran kontrak maksimal 5 hari kerja"
                    className="w-full px-3 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
            </div>

            {/* Submit button */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-purple-500/25 cursor-pointer active:scale-95 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Simpan Butir Soal ke Bank Soal</span>
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
