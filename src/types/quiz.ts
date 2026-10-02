export type QuizAudience = 'satker' | 'kppn_internal' | 'all';

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
}
