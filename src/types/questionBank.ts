import { FormFieldType } from './form';

export type QuestionDifficulty = 'GAMPANG' | 'SEDANG' | 'ANALISIS_HOTS';

export type QuestionTopic = 
  | 'IKPA_ANGGARAN'       // IKPA & Kinerja Pelaksanaan Anggaran
  | 'SP2D_KAS'           // SP2D, SPM & Manajemen Kas Negara
  | 'REGULASI_KEUANGAN'   // UU Keuangan Negara & Perbendaharaan
  | 'IKM_PELAYANAN'      // Survei IKM Permenpan-RB & Pelayanan Publik
  | 'SAKTI_DIGITAL'      // Aplikasi SAKTI & Digital Treasury
  | 'INTEGRITAS_WBS'     // Integritas, Anti-Gratifikasi & WBS
  | 'AKUNTANSI_LPJ'      // Akuntansi Pemerintah & LPJ Bendahara
  | 'PBJ_KONTRAK';       // Pengadaan Barang/Jasa & Kontrak Satker

export interface QuestionOption {
  id: string;
  label: string;
  isCorrect?: boolean;
  feedback?: string; // Ulasan kenapa opsi ini benar/salah
}

export interface QuestionBankItem {
  id: string;
  code: string;                 // Contoh: "HOTS-01", "IKPA-02", "REG-03"
  title: string;                // Judul singkat konsep soal
  difficulty: QuestionDifficulty; // GAMPANG (Mudah), SEDANG (Prosedural), ANALISIS_HOTS (Analisis Tinggi)
  topic: QuestionTopic;
  question: string;             // Kalimat pertanyaan
  scenario?: string;            // Narasi studi kasus / konteks masalah (HOTS)
  type: FormFieldType;          // MULTIPLE_CHOICE, RATING, YES_NO, DROPDOWN, dll
  options?: QuestionOption[];   // Pilihan jawaban
  correctAnswerId?: string;     // ID opsi yang tepat
  correctAnswerLabel?: string;  // Teks kunci jawaban yang tepat
  explanation: string;          // Pembahasan mendalam & komprehensif
  legalBasis: string;           // Dasar hukum resmi (UU, PMK, Permenpan, Perdirjen)
  keyTakeaways: string[];       // Poin ringkas pembelajaran agar satker/pegawai makin pintar
  tags: string[];               // Tag pencarian: misal ["SP2D", "Retur", "SLA", "HOTS"]
  isOfficial: boolean;          // True = Dari standar kurikulum perbendaharaan resmi
  createdAt?: string;
}

export interface QuestionTopicMeta {
  topic: QuestionTopic;
  name: string;
  description: string;
  iconName: string;
  colorClass: string;
}
