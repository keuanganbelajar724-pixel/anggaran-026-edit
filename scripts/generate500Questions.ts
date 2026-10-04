import * as fs from 'fs';
import * as path from 'path';

interface MasterBankQuestion {
  id: string;
  number: number;
  topic: string;
  difficulty: 'MUDAH' | 'SEDANG' | 'ANALISIS';
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  referenceRegulation: string;
  points: number;
}

// Helper to assemble structured questions
const questions: MasterBankQuestion[] = [];
let counter = 1;

function addQ(q: Omit<MasterBankQuestion, 'id' | 'number' | 'points'> & { points?: number }) {
  const pad = String(counter).padStart(3, '0');
  questions.push({
    id: `mbq_${pad}`,
    number: counter,
    topic: q.topic,
    difficulty: q.difficulty,
    questionText: q.questionText,
    optionA: q.optionA,
    optionB: q.optionB,
    optionC: q.optionC,
    optionD: q.optionD,
    correctAnswer: q.correctAnswer,
    explanation: q.explanation,
    referenceRegulation: q.referenceRegulation,
    points: q.points ?? (q.difficulty === 'ANALISIS' ? 15 : q.difficulty === 'SEDANG' ? 10 : 5),
  });
  counter++;
}

console.log('Building questions...');
