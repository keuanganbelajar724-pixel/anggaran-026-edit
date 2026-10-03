import * as XLSX from 'xlsx';
import { 
  KppnForm, 
  FormResponseRecord, 
  FormAnalyticsSummary, 
  FieldAnalyticsSummary,
  FormField
} from '../types/form';
import { safeLocalStorageGet, safeLocalStorageSet } from './safeStorage';
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { INITIAL_OFFICIAL_FORMS, INITIAL_OFFICIAL_RESPONSES } from '../data/initialFormData';

const FORMS_STORAGE_KEY = 'kppn_custom_forms_v1';
const RESPONSES_STORAGE_KEY = 'kppn_form_responses_v1';
const FIRESTORE_FORMS_COLLECTION = 'kppn_forms';
const FIRESTORE_RESPONSES_COLLECTION = 'kppn_form_responses';

// Template Formulir Bawaan Resmi KPPN
export const DEFAULT_OFFICIAL_FORMS: KppnForm[] = INITIAL_OFFICIAL_FORMS;

// ============================================================================
// 1. FORMS MANAGEMENT (GET, SAVE, DELETE, REAL-TIME SUBSCRIBE)
// ============================================================================

export function getKppnForms(): KppnForm[] {
  const raw = safeLocalStorageGet(FORMS_STORAGE_KEY);
  if (!raw) {
    safeLocalStorageSet(FORMS_STORAGE_KEY, JSON.stringify(DEFAULT_OFFICIAL_FORMS));
    return DEFAULT_OFFICIAL_FORMS;
  }
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return DEFAULT_OFFICIAL_FORMS;
    }
    return parsed;
  } catch (err) {
    console.error('[FormStorage] Error parsing forms:', err);
    return DEFAULT_OFFICIAL_FORMS;
  }
}

export function subscribeToKppnForms(callback: (forms: KppnForm[]) => void): () => void {
  // 1. Provide cached immediately
  callback(getKppnForms());

  const handleLocalUpdate = () => {
    callback(getKppnForms());
  };
  window.addEventListener('kppn_forms_updated', handleLocalUpdate);

  if (!db) {
    return () => window.removeEventListener('kppn_forms_updated', handleLocalUpdate);
  }

  try {
    const colRef = collection(db, FIRESTORE_FORMS_COLLECTION);
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const cloudForms: KppnForm[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data && data.id) cloudForms.push(data as KppnForm);
      });

      if (cloudForms.length > 0) {
        cloudForms.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        safeLocalStorageSet(FORMS_STORAGE_KEY, JSON.stringify(cloudForms));
        callback(cloudForms);
      } else {
        // Seed default if empty
        const current = getKppnForms();
        callback(current);
      }
    }, (error) => {
      console.warn('[FormStorage] Firestore forms subscription notice:', error);
      callback(getKppnForms());
    });

    return () => {
      unsubscribe();
      window.removeEventListener('kppn_forms_updated', handleLocalUpdate);
    };
  } catch (err) {
    console.warn('[FormStorage] Error subscribing to forms:', err);
    return () => window.removeEventListener('kppn_forms_updated', handleLocalUpdate);
  }
}

export async function saveKppnForm(form: KppnForm): Promise<KppnForm[]> {
  const forms = getKppnForms();
  const existingIdx = forms.findIndex(f => f.id === form.id);
  let updated: KppnForm[];

  if (existingIdx >= 0) {
    updated = forms.map(f => (f.id === form.id ? form : f));
  } else {
    updated = [form, ...forms];
  }

  safeLocalStorageSet(FORMS_STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('kppn_forms_updated'));

  if (db) {
    try {
      await setDoc(doc(db, FIRESTORE_FORMS_COLLECTION, form.id), form, { merge: true });
    } catch (err) {
      console.warn('[FormStorage] Error saving form to Firestore:', err);
    }
  }

  return updated;
}

export async function deleteKppnForm(formId: string): Promise<KppnForm[]> {
  const forms = getKppnForms();
  const updated = forms.filter(f => f.id !== formId);
  safeLocalStorageSet(FORMS_STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('kppn_forms_updated'));

  // Also clear responses for this form
  await clearFormResponses(formId);

  if (db) {
    try {
      await deleteDoc(doc(db, FIRESTORE_FORMS_COLLECTION, formId));
    } catch (err) {
      console.warn('[FormStorage] Error deleting form from Firestore:', err);
    }
  }

  return updated;
}

// ============================================================================
// 2. RESPONSES MANAGEMENT (GET, SAVE, DELETE, CLEAR FOR MEMORY)
// ============================================================================

export function getFormResponses(formId?: string): FormResponseRecord[] {
  const raw = safeLocalStorageGet(RESPONSES_STORAGE_KEY);
  if (!raw) {
    safeLocalStorageSet(RESPONSES_STORAGE_KEY, JSON.stringify(INITIAL_OFFICIAL_RESPONSES));
    if (formId) return INITIAL_OFFICIAL_RESPONSES.filter(r => r && r.formId === formId);
    return INITIAL_OFFICIAL_RESPONSES;
  }
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      safeLocalStorageSet(RESPONSES_STORAGE_KEY, JSON.stringify(INITIAL_OFFICIAL_RESPONSES));
      if (formId) return INITIAL_OFFICIAL_RESPONSES.filter(r => r && r.formId === formId);
      return INITIAL_OFFICIAL_RESPONSES;
    }
    if (formId) return parsed.filter(r => r && r.formId === formId);
    return parsed;
  } catch (err) {
    console.error('[FormStorage] Error parsing responses:', err);
    return INITIAL_OFFICIAL_RESPONSES;
  }
}

export function subscribeToFormResponses(callback: (responses: FormResponseRecord[]) => void): () => void {
  // 1. Initial cached
  callback(getFormResponses());

  const handleLocalUpdate = () => {
    callback(getFormResponses());
  };
  window.addEventListener('kppn_form_responses_updated', handleLocalUpdate);

  if (!db) {
    return () => window.removeEventListener('kppn_form_responses_updated', handleLocalUpdate);
  }

  try {
    const colRef = collection(db, FIRESTORE_RESPONSES_COLLECTION);
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const cloudResp: FormResponseRecord[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data && data.id) cloudResp.push(data as FormResponseRecord);
      });

      // Merge local and cloud
      const local = getFormResponses();
      const map = new Map<string, FormResponseRecord>();
      local.forEach(r => { if (r && r.id) map.set(r.id, r); });
      cloudResp.forEach(r => { if (r && r.id) map.set(r.id, r); });

      const combined = Array.from(map.values());
      combined.sort((a, b) => new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime());

      safeLocalStorageSet(RESPONSES_STORAGE_KEY, JSON.stringify(combined.slice(0, 1000)));
      callback(combined);
    }, (error) => {
      console.warn('[FormStorage] Firestore responses subscription notice:', error);
      callback(getFormResponses());
    });

    return () => {
      unsubscribe();
      window.removeEventListener('kppn_form_responses_updated', handleLocalUpdate);
    };
  } catch (err) {
    console.warn('[FormStorage] Error subscribing to responses:', err);
    return () => window.removeEventListener('kppn_form_responses_updated', handleLocalUpdate);
  }
}

export async function saveFormResponse(record: FormResponseRecord): Promise<FormResponseRecord[]> {
  const responses = getFormResponses();
  const filtered = responses.filter(r => r.id !== record.id);
  const updated = [record, ...filtered].slice(0, 1000);

  safeLocalStorageSet(RESPONSES_STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('kppn_form_responses_updated'));

  if (db) {
    try {
      await setDoc(doc(db, FIRESTORE_RESPONSES_COLLECTION, record.id), record, { merge: true });
    } catch (err) {
      console.warn('[FormStorage] Could not persist response to Firestore:', err);
    }
  }

  return updated;
}

export async function deleteFormResponse(responseId: string): Promise<FormResponseRecord[]> {
  const responses = getFormResponses();
  const updated = responses.filter(r => r.id !== responseId);
  safeLocalStorageSet(RESPONSES_STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('kppn_form_responses_updated'));

  if (db) {
    try {
      await deleteDoc(doc(db, FIRESTORE_RESPONSES_COLLECTION, responseId));
    } catch (err) {
      console.warn('[FormStorage] Could not delete response from Firestore:', err);
    }
  }

  return updated;
}

export async function clearFormResponses(formId?: string): Promise<FormResponseRecord[]> {
  const responses = getFormResponses();
  let updated: FormResponseRecord[];
  let toDeleteIds: string[] = [];

  if (formId) {
    toDeleteIds = responses.filter(r => r.formId === formId).map(r => r.id);
    updated = responses.filter(r => r.formId !== formId);
  } else {
    toDeleteIds = responses.map(r => r.id);
    updated = [];
  }

  safeLocalStorageSet(RESPONSES_STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('kppn_form_responses_updated'));

  if (db && toDeleteIds.length > 0) {
    try {
      for (const id of toDeleteIds.slice(0, 100)) {
        await deleteDoc(doc(db, FIRESTORE_RESPONSES_COLLECTION, id));
      }
    } catch (err) {
      console.warn('[FormStorage] Could not batch delete responses from Firestore:', err);
    }
  }

  return updated;
}

export async function importGoogleFormData(form: KppnForm, responses: FormResponseRecord[]): Promise<void> {
  await saveKppnForm(form);
  const existingResponses = getFormResponses();
  const otherResponses = existingResponses.filter(r => r.formId !== form.id);
  const combined = [...responses, ...otherResponses].slice(0, 1000);
  safeLocalStorageSet(RESPONSES_STORAGE_KEY, JSON.stringify(combined));
  window.dispatchEvent(new CustomEvent('kppn_form_responses_updated'));
}

export function resetToOfficialDefaultFormsAndResponses(): void {
  safeLocalStorageSet(FORMS_STORAGE_KEY, JSON.stringify(INITIAL_OFFICIAL_FORMS));
  safeLocalStorageSet(RESPONSES_STORAGE_KEY, JSON.stringify(INITIAL_OFFICIAL_RESPONSES));
  window.dispatchEvent(new CustomEvent('kppn_forms_updated'));
  window.dispatchEvent(new CustomEvent('kppn_form_responses_updated'));
}

// ============================================================================
// 3. AUTO-ANALYTICS & PERCENTAGE GRAPH GENERATOR
// ============================================================================

export function computeFormAnalytics(form: KppnForm, responses: FormResponseRecord[]): FormAnalyticsSummary {
  const formResponses = responses.filter(r => r.formId === form.id);
  const totalResponses = formResponses.length;

  const satkersSet = new Set(formResponses.map(r => r.respondentSatker).filter(Boolean));
  const uniqueSatkersCount = satkersSet.size;

  const latestSubmission = formResponses.length > 0 
    ? formResponses[0].submittedAt 
    : undefined;

  const fieldsAnalytics: FieldAnalyticsSummary[] = form.fields.map(field => {
    // Gather all answers for this field
    const fieldAnswers = formResponses
      .map(r => r.answers.find(a => a.fieldId === field.id))
      .filter(Boolean);

    const totalAnswered = fieldAnswers.length;

    if (field.type === 'RATING') {
      let sum = 0;
      const dist: Record<number, { count: number; percentage: number }> = {
        1: { count: 0, percentage: 0 },
        2: { count: 0, percentage: 0 },
        3: { count: 0, percentage: 0 },
        4: { count: 0, percentage: 0 },
        5: { count: 0, percentage: 0 }
      };

      fieldAnswers.forEach(ans => {
        const val = Number(ans?.value) || 0;
        if (val >= 1 && val <= 5) {
          sum += val;
          dist[val].count += 1;
        }
      });

      const averageRating = totalAnswered > 0 ? Number((sum / totalAnswered).toFixed(2)) : 0;
      for (let star = 1; star <= 5; star++) {
        dist[star].percentage = totalAnswered > 0 
          ? Number(((dist[star].count / totalAnswered) * 100).toFixed(1)) 
          : 0;
      }

      return {
        fieldId: field.id,
        fieldLabel: field.label,
        fieldType: field.type,
        totalAnswered,
        averageRating,
        ratingDistribution: dist
      };
    }

    if (field.type === 'MULTIPLE_CHOICE' || field.type === 'DROPDOWN') {
      const dist: Record<string, { count: number; percentage: number }> = {};
      
      // Initialize with defined options
      (field.options || []).forEach(opt => {
        dist[opt.label] = { count: 0, percentage: 0 };
      });

      fieldAnswers.forEach(ans => {
        const val = String(ans?.value || '');
        if (val) {
          if (!dist[val]) dist[val] = { count: 0, percentage: 0 };
          dist[val].count += 1;
        }
      });

      Object.keys(dist).forEach(key => {
        dist[key].percentage = totalAnswered > 0 
          ? Number(((dist[key].count / totalAnswered) * 100).toFixed(1)) 
          : 0;
      });

      return {
        fieldId: field.id,
        fieldLabel: field.label,
        fieldType: field.type,
        totalAnswered,
        optionDistribution: dist
      };
    }

    if (field.type === 'YES_NO') {
      const dist: Record<string, { count: number; percentage: number }> = {
        'Ya': { count: 0, percentage: 0 },
        'Tidak': { count: 0, percentage: 0 }
      };

      fieldAnswers.forEach(ans => {
        const val = String(ans?.value || '').trim();
        if (val === 'Ya' || val === 'Tidak') {
          dist[val].count += 1;
        }
      });

      dist['Ya'].percentage = totalAnswered > 0 ? Number(((dist['Ya'].count / totalAnswered) * 100).toFixed(1)) : 0;
      dist['Tidak'].percentage = totalAnswered > 0 ? Number(((dist['Tidak'].count / totalAnswered) * 100).toFixed(1)) : 0;

      return {
        fieldId: field.id,
        fieldLabel: field.label,
        fieldType: field.type,
        totalAnswered,
        optionDistribution: dist
      };
    }

    // For SHORT_TEXT and PARAGRAPH
    const textAnswers = formResponses
      .map(r => {
        const a = r.answers.find(ans => ans.fieldId === field.id);
        const text = String(a?.value || '').trim();
        if (!text) return null;
        return {
          respondentName: r.respondentName,
          satker: r.respondentSatker,
          text,
          submittedAt: r.submittedAt
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));

    return {
      fieldId: field.id,
      fieldLabel: field.label,
      fieldType: field.type,
      totalAnswered,
      textAnswers
    };
  });

  return {
    formId: form.id,
    formTitle: form.title,
    totalResponses,
    uniqueSatkersCount,
    latestSubmission,
    fieldsAnalytics
  };
}

// ============================================================================
// 4. EXCEL EXPORT ENGINE
// ============================================================================

export function exportFormResponsesToExcel(form: KppnForm, responses: FormResponseRecord[]): void {
  const formResponses = responses.filter(r => r.formId === form.id);
  if (formResponses.length === 0) {
    alert('Belum ada respon untuk diekspor pada formulir ini.');
    return;
  }

  // 1. Raw Data Sheet
  const rawRows = formResponses.map((r, idx) => {
    const rowObj: Record<string, any> = {
      'No': idx + 1,
      'Waktu Pengisian': new Date(r.submittedAt).toLocaleString('id-ID'),
      'Nama Responden': r.respondentName,
      'Satker / Unit': r.respondentSatker,
      'Kode Satker': r.respondentSatkerKode || '-',
      'Email': r.respondentEmail || '-',
      'No. HP / WA': r.respondentNoHp || '-'
    };

    form.fields.forEach(f => {
      const ans = r.answers.find(a => a.fieldId === f.id);
      rowObj[f.label] = ans ? ans.value : '-';
    });

    return rowObj;
  });

  // 2. Summary Sheet (Statistics)
  const analytics = computeFormAnalytics(form, responses);
  const summaryRows: any[] = [
    { 'Metrik': 'Judul Formulir', 'Nilai': form.title },
    { 'Metrik': 'Kategori', 'Nilai': form.category },
    { 'Metrik': 'Total Responden', 'Nilai': analytics.totalResponses },
    { 'Metrik': 'Jumlah Satker Unik', 'Nilai': analytics.uniqueSatkersCount },
    { 'Metrik': 'Waktu Ekspor', 'Nilai': new Date().toLocaleString('id-ID') },
    { 'Metrik': '', 'Nilai': '' }
  ];

  analytics.fieldsAnalytics.forEach((fa, idx) => {
    summaryRows.push({ 'Metrik': `[Pertanyaan ${idx + 1}] ${fa.fieldLabel}`, 'Nilai': `Tipe: ${fa.fieldType}` });
    if (fa.averageRating !== undefined) {
      summaryRows.push({ 'Metrik': '  Rata-rata Rating (Skala 1-5)', 'Nilai': fa.averageRating });
      if (fa.ratingDistribution) {
        Object.entries(fa.ratingDistribution).forEach(([star, d]) => {
          summaryRows.push({ 'Metrik': `    Bintang ${star} ★`, 'Nilai': `${d.count} respon (${d.percentage}%)` });
        });
      }
    } else if (fa.optionDistribution) {
      Object.entries(fa.optionDistribution).forEach(([opt, d]) => {
        summaryRows.push({ 'Metrik': `    ${opt}`, 'Nilai': `${d.count} pemilih (${d.percentage}%)` });
      });
    } else {
      summaryRows.push({ 'Metrik': '  Total Jawaban Teks', 'Nilai': fa.totalAnswered });
    }
  });

  const wb = XLSX.utils.book_new();
  const wsData = XLSX.utils.json_to_sheet(rawRows);
  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);

  XLSX.utils.book_append_sheet(wb, wsData, 'Respon Peserta');
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan & Statistik');

  const filename = `Hasil_${form.title.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 35)}_${Date.now()}.xlsx`;
  XLSX.writeFile(wb, filename);
}
