import { QuestionBankItem } from '../types/questionBank';
import { FormField, KppnForm, FormCategory } from '../types/form';
import { INITIAL_QUESTION_BANK } from '../data/questionBankData';
import { safeLocalStorageGet, safeLocalStorageSet } from './safeStorage';

const QUESTION_BANK_KEY = 'kppn_question_bank_items_v1';

/**
 * Retrieves the complete question bank from storage or seeds default
 */
export function getQuestionBank(): QuestionBankItem[] {
  if (typeof window === 'undefined') return INITIAL_QUESTION_BANK;

  const raw = safeLocalStorageGet(QUESTION_BANK_KEY);
  if (!raw) {
    safeLocalStorageSet(QUESTION_BANK_KEY, JSON.stringify(INITIAL_QUESTION_BANK));
    return INITIAL_QUESTION_BANK;
  }

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_QUESTION_BANK;
  } catch (e) {
    console.error('Error parsing question bank:', e);
    return INITIAL_QUESTION_BANK;
  }
}

/**
 * Saves a new or updated question in the bank
 */
export function saveQuestionBankItem(item: QuestionBankItem): QuestionBankItem[] {
  const current = getQuestionBank();
  const existingIndex = current.findIndex(q => q.id === item.id);

  let updated: QuestionBankItem[];
  if (existingIndex >= 0) {
    updated = [...current];
    updated[existingIndex] = { ...item };
  } else {
    updated = [item, ...current];
  }

  safeLocalStorageSet(QUESTION_BANK_KEY, JSON.stringify(updated));
  return updated;
}

/**
 * Deletes a question from the bank
 */
export function deleteQuestionBankItem(id: string): QuestionBankItem[] {
  const current = getQuestionBank();
  const updated = current.filter(q => q.id !== id);
  safeLocalStorageSet(QUESTION_BANK_KEY, JSON.stringify(updated));
  return updated;
}

/**
 * Resets the question bank to official initial questions
 */
export function resetQuestionBankToDefault(): QuestionBankItem[] {
  safeLocalStorageSet(QUESTION_BANK_KEY, JSON.stringify(INITIAL_QUESTION_BANK));
  return INITIAL_QUESTION_BANK;
}

/**
 * Converts a QuestionBankItem into a FormField that can be placed in a Form Builder
 */
export function convertQuestionToFormField(item: QuestionBankItem): FormField {
  const formattedLabel = item.scenario 
    ? `[${item.code} - ${item.title}]\n${item.scenario}\n\nPertanyaan: ${item.question}`
    : `[${item.code}] ${item.question}`;

  const field: FormField = {
    id: `field_qb_${item.code.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now().toString(36)}`,
    type: item.type,
    label: formattedLabel,
    description: `Topik: ${item.topic} | Tingkat: ${item.difficulty}`,
    required: true,
    options: item.options ? item.options.map(opt => ({ id: opt.id, label: opt.label })) : undefined,
    minRating: item.type === 'RATING' ? 1 : undefined,
    maxRating: item.type === 'RATING' ? 5 : undefined,
    minRatingLabel: item.type === 'RATING' ? 'Sangat Kurang' : undefined,
    maxRatingLabel: item.type === 'RATING' ? 'Sangat Baik' : undefined
  };

  return field;
}

/**
 * Creates a ready-to-use Form / Quiz from an array of QuestionBankItems
 */
export function createQuizFormFromQuestions(
  title: string,
  description: string,
  questions: QuestionBankItem[],
  category: FormCategory = 'EVALUASI_IKPA'
): KppnForm {
  const fields: FormField[] = questions.map(convertQuestionToFormField);

  const form: KppnForm = {
    id: `form_quiz_${Date.now()}`,
    title: title.trim(),
    description: description.trim() || 'Kuis dan Uji Pemahaman Perbendaharaan KPPN Semarang I.',
    category,
    targetAudience: 'satker',
    isActive: true,
    isPublicStatsVisible: true,
    allowMultipleSubmissions: true,
    fields,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  return form;
}
