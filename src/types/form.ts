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
  // Enhanced Google Form & Kiosk Capabilities
  googleSheetUrl?: string;       // URL Live Google Sheets / CSV responses
  googleFormEmbedUrl?: string;   // URL viewform resmi Google Form (jika di-embed)
  lastSyncedAt?: string;         // Timestamp penarikan data live terakhir
  isOfficialSkm?: boolean;       // Survei Kepuasan Masyarakat standar Permenpan-RB 14/2017
  skmPeriod?: string;            // Contoh: "Triwulan I 2026"
  kioskModePin?: string;         // PIN pengaman Kiosk Front Office KPPN
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
  source?: 'APP_WEB' | 'GOOGLE_FORM_IMPORT' | 'KIOSK_FO' | 'GOOGLE_SHEET_SYNC';
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

export interface IkmElementScore {
  elementNumber: number;
  fieldId: string;
  elementName: string;
  nrr: number;           // Nilai Rata-rata per Unsur (Skala 1 - 5 atau 1 - 4)
  nrrWeighted: number;   // NRR x Bobot (misal 1/9 = 0.111)
}

export interface IkmAnalyticsSummary {
  totalElements: number;
  elementScores: IkmElementScore[];
  nrrTotal: number;
  ikmConversion: number;     // Skala 25 - 100
  grade: 'A' | 'B' | 'C' | 'D';
  predikat: 'SANGAT BAIK' | 'BAIK' | 'KURANG BAIK' | 'TIDAK BAIK';
  kategoriMutuText: string;
  period: string;
}

export interface FormAnalyticsSummary {
  formId: string;
  formTitle: string;
  totalResponses: number;
  uniqueSatkersCount: number;
  latestSubmission?: string;
  fieldsAnalytics: FieldAnalyticsSummary[];
  ikmAnalytics?: IkmAnalyticsSummary;
  sentimentSummary?: {
    positiveCount: number;
    constructiveCount: number;
    topKeywords: Array<{ word: string; count: number }>;
  };
}
