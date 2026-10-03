export type FormFieldType = 
  | 'RATING'            // Skala Bintang 1 - 5 ⭐
  | 'MULTIPLE_CHOICE'   // Pilihan Ganda (Satu Pilihan)
  | 'DROPDOWN'          // Pilihan Dropdown
  | 'SHORT_TEXT'        // Isian Singkat
  | 'PARAGRAPH'         // Uraian / Masukan Panjang
  | 'YES_NO';           // Pilihan Ya / Tidak

export interface FormFieldOption {
  id: string;
  label: string;
}

export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  description?: string;
  required: boolean;
  options?: FormFieldOption[];
  placeholder?: string;
  minRating?: number;
  maxRating?: number;
  minRatingLabel?: string;
  maxRatingLabel?: string;
}

export type FormCategory = 
  | 'SURVEI_LAYANAN'
  | 'PENDAFTARAN_BIMTEK'
  | 'KONFIRMASI_SATKER'
  | 'EVALUASI_IKPA'
  | 'UMUM';

export interface KppnForm {
  id: string;
  title: string;
  description: string;
  category: FormCategory;
  targetAudience: 'ALL' | 'satker' | 'kppn_internal';
  isActive: boolean;
  isPublicStatsVisible: boolean; // Jika true, satker dapat melihat grafik statistik
  allowMultipleSubmissions: boolean;
  fields: FormField[];
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
}

export interface FormAnswer {
  fieldId: string;
  fieldLabel: string;
  fieldType: FormFieldType;
  value: string | number;
}

export interface FormResponseRecord {
  id: string;
  formId: string;
  formTitle: string;
  respondentName: string;
  respondentSatker: string;
  respondentSatkerKode?: string;
  respondentEmail?: string;
  respondentNoHp?: string;
  answers: FormAnswer[];
  submittedAt: string;
}

export interface FieldAnalyticsSummary {
  fieldId: string;
  fieldLabel: string;
  fieldType: FormFieldType;
  totalAnswered: number;
  // Khusus RATING
  averageRating?: number;
  ratingDistribution?: Record<number, { count: number; percentage: number }>;
  // Khusus MULTIPLE_CHOICE, DROPDOWN, YES_NO
  optionDistribution?: Record<string, { count: number; percentage: number }>;
  // Khusus SHORT_TEXT, PARAGRAPH
  textAnswers?: Array<{ respondentName: string; satker: string; text: string; submittedAt: string }>;
}

export interface FormAnalyticsSummary {
  formId: string;
  formTitle: string;
  totalResponses: number;
  uniqueSatkersCount: number;
  latestSubmission?: string;
  fieldsAnalytics: FieldAnalyticsSummary[];
}
