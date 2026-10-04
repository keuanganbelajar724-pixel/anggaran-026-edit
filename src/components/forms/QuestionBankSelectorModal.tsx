import React, { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  Check, 
  HelpCircle, 
  BookOpen, 
  FileText, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp,
  Sparkles,
  Scale,
  Plus
} from 'lucide-react';
import { QuestionBankItem, QuestionDifficulty, QuestionTopic } from '../../types/questionBank';
import { FormField } from '../../types/form';
import { getQuestionBank, convertQuestionToFormField } from '../../utils/questionBankStorage';
import { QUESTION_TOPIC_METAS } from '../../data/questionBankData';

interface QuestionBankSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertFields: (fields: FormField[]) => void;
}

export const QuestionBankSelectorModal: React.FC<QuestionBankSelectorModalProps> = ({
  isOpen,
  onClose,
  onInsertFields
}) => {
  const [questions] = useState<QuestionBankItem[]>(() => getQuestionBank());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'ALL' | QuestionDifficulty>('ALL');
  const [selectedTopic, setSelectedTopic] = useState<'ALL' | QuestionTopic>('ALL');
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());
  const [expandedExplanationIds, setExpandedExplanationIds] = useState<Set<string>>(new Set());

  // Filtered Questions
  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      // Difficulty filter
      if (selectedDifficulty !== 'ALL' && q.difficulty !== selectedDifficulty) {
        return false;
      }
      // Topic filter
      if (selectedTopic !== 'ALL' && q.topic !== selectedTopic) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const inTitle = q.title.toLowerCase().includes(query);
        const inQuestion = q.question.toLowerCase().includes(query);
        const inScenario = q.scenario ? q.scenario.toLowerCase().includes(query) : false;
        const inCode = q.code.toLowerCase().includes(query);
        const inLegal = q.legalBasis.toLowerCase().includes(query);
        const inTags = q.tags.some(t => t.toLowerCase().includes(query));
        if (!inTitle && !inQuestion && !inScenario && !inCode && !inLegal && !inTags) {
          return false;
        }
      }
      return true;
    });
  }, [questions, selectedDifficulty, selectedTopic, searchQuery]);

  if (!isOpen) return null;

  const toggleSelectQuestion = (id: string) => {
    setSelectedQuestionIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAllFiltered = () => {
    if (selectedQuestionIds.size === filteredQuestions.length && filteredQuestions.length > 0) {
      setSelectedQuestionIds(new Set());
    } else {
      setSelectedQuestionIds(new Set(filteredQuestions.map(q => q.id)));
    }
  };

  const toggleExplanation = (id: string) => {
    setExpandedExplanationIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleInsertSelected = () => {
    const selectedItems = questions.filter(q => selectedQuestionIds.has(q.id));
    if (selectedItems.length === 0) return;

    const fieldsToInsert = selectedItems.map(convertQuestionToFormField);
    onInsertFields(fieldsToInsert);
    onClose();
  };

  const handleInsertSingle = (item: QuestionBankItem) => {
    const field = convertQuestionToFormField(item);
    onInsertFields([field]);
    onClose();
  };

  const getDifficultyBadge = (diff: QuestionDifficulty) => {
    switch (diff) {
      case 'GAMPANG':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Gampang (Dasar)
          </span>
        );
      case 'SEDANG':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Sedang (Prosedural)
          </span>
        );
      case 'ANALISIS_HOTS':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300 dark:border-purple-800 flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5 text-purple-600 dark:text-purple-400" />
            Analisis (Kasus HOTS)
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-sky-50 to-indigo-50 dark:from-slate-800/60 dark:to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-600 dark:bg-sky-500 text-white flex items-center justify-center shadow-lg shadow-sky-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Bank Soal & Pengetahuan Pintar
                </h3>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
                  {filteredQuestions.length} Soal Tersedia
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pilih soal dari seluruh referensi perbendaharaan lengkap dengan pembahasan & dasar hukum
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari kata kunci soal, kasus, dasar hukum, SPM, SP2D, IKPA, IKM..."
              className="w-full pl-10 pr-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Difficulty & Topic Switchers */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            {/* Difficulty Tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mr-1">Tingkat:</span>
              <button
                type="button"
                onClick={() => setSelectedDifficulty('ALL')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  selectedDifficulty === 'ALL'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                }`}
              >
                Semua Tingkat
              </button>
              <button
                type="button"
                onClick={() => setSelectedDifficulty('GAMPANG')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  selectedDifficulty === 'GAMPANG'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50'
                }`}
              >
                🟢 Gampang (Dasar)
              </button>
              <button
                type="button"
                onClick={() => setSelectedDifficulty('SEDANG')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  selectedDifficulty === 'SEDANG'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-400 hover:bg-amber-50'
                }`}
              >
                🟡 Sedang (Prosedural)
              </button>
              <button
                type="button"
                onClick={() => setSelectedDifficulty('ANALISIS_HOTS')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  selectedDifficulty === 'ANALISIS_HOTS'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-400 hover:bg-purple-50'
                }`}
              >
                🔴 Analisis (Kasus HOTS)
              </button>
            </div>

            {/* Topic Select */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Topik:</span>
              <select
                value={selectedTopic}
                onChange={e => setSelectedTopic(e.target.value as any)}
                className="px-2.5 py-1 rounded-lg text-[11px] font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                <option value="ALL">Semua Topik Perbendaharaan</option>
                {QUESTION_TOPIC_METAS.map(t => (
                  <option key={t.topic} value={t.topic}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Question List View */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {filteredQuestions.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500">
              <HelpCircle className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-bold">Tidak ada soal yang cocok dengan kriteria filter.</p>
              <p className="text-xs mt-1">Coba gunakan kata kunci pencarian yang lebih umum atau ubah filter tingkat kesulitan.</p>
            </div>
          ) : (
            filteredQuestions.map((item, idx) => {
              const isSelected = selectedQuestionIds.has(item.id);
              const isExp = expandedExplanationIds.has(item.id);

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isSelected
                      ? 'bg-sky-50/60 dark:bg-sky-950/20 border-sky-400 dark:border-sky-600 shadow-md ring-1 ring-sky-400'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {/* Item Top Bar */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <button
                        type="button"
                        onClick={() => toggleSelectQuestion(item.id)}
                        className={`mt-0.5 w-5 h-5 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-sky-600 text-white shadow-sm'
                            : 'border-2 border-slate-300 dark:border-slate-700 hover:border-sky-500 bg-white dark:bg-slate-800'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-black text-slate-700 dark:text-slate-300">
                            #{idx + 1} [{item.code}]
                          </span>
                          {getDifficultyBadge(item.difficulty)}
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {item.title}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Single Insert Button */}
                    <button
                      type="button"
                      onClick={() => handleInsertSingle(item)}
                      className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer shrink-0 transition-transform active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Sisipkan Soal Ini</span>
                    </button>
                  </div>

                  {/* Scenario Narration (for HOTS Analysis) */}
                  {item.scenario && (
                    <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-950 dark:text-amber-200 leading-relaxed">
                      <span className="font-black flex items-center gap-1 text-amber-700 dark:text-amber-400 mb-1">
                        <FileText className="w-3.5 h-3.5" />
                        Studi Kasus / Skenario Masalah:
                      </span>
                      {item.scenario}
                    </div>
                  )}

                  {/* Question Text */}
                  <div className="mt-2.5 text-xs font-bold text-slate-900 dark:text-white leading-relaxed">
                    Pertanyaan: {item.question}
                  </div>

                  {/* Options List */}
                  {item.options && item.options.length > 0 && (
                    <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {item.options.map(opt => (
                        <div
                          key={opt.id}
                          className={`p-2 rounded-xl text-xs flex items-start gap-2 border ${
                            opt.isCorrect
                              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                              : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                            opt.isCorrect
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}>
                            {opt.id.replace('opt_', '').toUpperCase()}
                          </span>
                          <span className="flex-1 font-medium">{opt.label}</span>
                          {opt.isCorrect && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Explanation Toggle & Content */}
                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => toggleExplanation(item.id)}
                      className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {isExp ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      <span>{isExp ? 'Sembunyikan Pembahasan & Dasar Hukum' : '💡 Lihat Pembahasan & Dasar Hukum Lengkap'}</span>
                    </button>

                    {isExp && (
                      <div className="mt-2 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs space-y-2.5 animate-in fade-in duration-150">
                        {/* Explanation */}
                        <div>
                          <span className="font-black text-sky-700 dark:text-sky-400 block mb-0.5">
                            💡 Pembahasan Komprehensif:
                          </span>
                          <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                            {item.explanation}
                          </p>
                        </div>

                        {/* Legal Basis */}
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                          <span className="font-black text-indigo-700 dark:text-indigo-400 flex items-center gap-1 mb-0.5">
                            <Scale className="w-3.5 h-3.5" />
                            Dasar Hukum & Regulasi Resmi:
                          </span>
                          <p className="text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                            {item.legalBasis}
                          </p>
                        </div>

                        {/* Key Learning Points */}
                        {item.keyTakeaways && item.keyTakeaways.length > 0 && (
                          <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                            <span className="font-black text-slate-800 dark:text-slate-200 block mb-1">
                              📌 Poin Kunci Pembelajaran Satker:
                            </span>
                            <ul className="list-disc pl-4 space-y-0.5 text-slate-600 dark:text-slate-400">
                              {item.keyTakeaways.map((point, pIdx) => (
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
            })
          )}
        </div>

        {/* Footer / Action Bar */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleSelectAllFiltered}
              className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-sky-600 underline cursor-pointer"
            >
              {selectedQuestionIds.size === filteredQuestions.length && filteredQuestions.length > 0
                ? 'Batal Pilih Semua'
                : `Pilih Semua (${filteredQuestions.length} Soal)`}
            </button>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="text-xs font-black text-sky-600 dark:text-sky-400">
              {selectedQuestionIds.size} soal dipilih
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={selectedQuestionIds.size === 0}
              onClick={handleInsertSelected}
              className={`px-5 py-2 rounded-xl text-xs font-black flex items-center gap-2 shadow-lg transition-all ${
                selectedQuestionIds.size > 0
                  ? 'bg-sky-600 hover:bg-sky-700 text-white shadow-sky-500/25 cursor-pointer active:scale-95'
                  : 'bg-slate-300 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Sisipkan {selectedQuestionIds.size} Soal ke Formulir</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
