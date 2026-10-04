export type QuizAudience = 'satker' | 'kppn_internal' | 'all';
export type QuestionDifficulty = 'MUDAH' | 'SEDANG' | 'ANALISIS';

export interface QuizQuestion {
  id: string;
  number: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
  points?: number; // default: 10
  topic?: string; // Kategori topik, e.g. "IKPA - Deviasi Hal III DIPA", "SAKTI - Modul Bendahara", "UP & TUP", "Regulasi APBN"
  difficulty?: QuestionDifficulty; // 'MUDAH' | 'SEDANG' | 'ANALISIS'
  referenceRegulation?: string; // Dasar hukum / regulasi (e.g. "Perdirjen Perbendaharaan No. PER-5/PB/2022")
}

export interface MasterBankQuestion extends QuizQuestion {
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface QuizPackage {
  id: string;
  title: string;
  description: string;
  category: string; // e.g. "IKPA 2026", "SAKTI Modul Pembayaran", "Kepatuhan Internal"
  targetAudience: QuizAudience; // 'satker' | 'kppn_internal' | 'all'
  durationMinutes: number; // e.g. 15
  passingGrade: number; // e.g. 70 (%)
  isActive: boolean;
  questions: QuizQuestion[];
  createdAt: string;
  updatedAt: string;
  accessPin?: string; // Optional PIN for internal tests
  isScheduled?: boolean; // Apakah dibuka dengan jadwal waktu tertentu
  startAt?: string; // Tanggal & Jam Mulai Dibuka (ISO string / YYYY-MM-DDTHH:mm)
  endAt?: string; // Tanggal & Jam Ditutup (ISO string / YYYY-MM-DDTHH:mm)
  // Enhanced Uji Kompetensi CAT Features
  shuffleQuestions?: boolean; // Acak urutan butir soal
  shuffleOptions?: boolean; // Acak susunan pilihan jawaban (A, B, C, D)
  requireToken?: boolean; // Wajibkan Token Ujian CAT Resmi
  examToken?: string; // Token akses ujian (misal: "KPPN026", "CAT2026")
  strictProctoring?: boolean; // Aktifkan pengawasan integritas & anti pindah tab
  maxTabSwitches?: number; // Batas maksimal pindah tab sebelum auto-submit / peringatan (default: 3)
  showExplanationImmediately?: boolean; // Apakah pembahasan langsung tampil saat selesai (default: true)
  maxAttempts?: number; // Batas jumlah pengerjaan (1 = Resmi 1 Kali, 0 = Latihan Bebas)
  certificateEnabled?: boolean; // Izinkan unduh e-Sertifikat Kelulusan resmi
}

export interface QuizUserAnswer {
  questionId: string;
  selectedAnswer: 'A' | 'B' | 'C' | 'D' | null;
  isMarkedDoubt?: boolean; // Ragu-ragu / lewati
}

export interface QuizAnswerReviewItem {
  questionId: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  selectedAnswer: 'A' | 'B' | 'C' | 'D' | null;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  isCorrect: boolean;
  explanation?: string;
}

export interface QuizResultRecord {
  id: string;
  packageId: string;
  packageTitle: string;
  category: string;
  targetAudience: QuizAudience;
  participantName: string;
  satkerOrUnit: string;
  nipOrNik?: string;
  userRoleType: 'satker' | 'pegawai' | 'superadmin' | 'tamu';
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  score: number; // 0 - 100
  passed: boolean;
  timeSpentSeconds: number;
  completedAt: string;
  answers: QuizAnswerReviewItem[];
  // Enhanced Proctoring & Certification
  tabSwitchCount?: number;
  integrityStatus?: 'TERPERCAYA' | 'PERINGATAN' | 'INDIKASI_PELANGGARAN';
  certificateNo?: string;
  tokenUsed?: string;
  rank?: number;
}

/**
 * Local storage session state for auto-save and emergency recovery
 */
export interface QuizActiveSession {
  packageId: string;
  packageTitle: string;
  participantName: string;
  participantSatker: string;
  nipOrNik?: string;
  userAnswers: Record<string, { answer: 'A' | 'B' | 'C' | 'D' | null; isDoubt: boolean }>;
  timeLeftSeconds: number;
  examStartTime: number;
  currentQuestionIdx: number;
  tabSwitchCount: number;
  orderedQuestionIds: string[];
  lastSavedAt: string;
}

/**
 * Psychometrics item analysis for admin
 */
export interface QuestionItemAnalysis {
  questionId: string;
  questionNumber: number;
  questionText: string;
  correctAnswer: string;
  totalAnswered: number;
  correctCount: number;
  correctPercentage: number;
  optionDistribution: {
    A: number;
    B: number;
    C: number;
    D: number;
  };
  difficultyLevel: 'MUDAH' | 'SEDANG' | 'SULIT';
}

