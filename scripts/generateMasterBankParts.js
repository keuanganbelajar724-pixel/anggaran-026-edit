const fs = require('fs');
const path = require('path');

// Helper to write valid TypeScript export
function writePartFile(filePath, varName, questions, startNum, endNum, partNum) {
  const header = `import { MasterBankQuestion } from '../types/quiz';

/**
 * MASTER BANK SOAL PERBENDAHARAAN & APBN PART ${partNum} (${questions.length} BUTIR SOAL: mbq_${startNum} - mbq_${endNum})
 * Bagian resmi dari Koleksi Bank Soal Komprehensif (2.050 Butir Soal).
 * Tingkat Kesulitan Berimbang: MUDAH (Konseptual), SEDANG (Prosedural), ANALISIS (HOTS Studi Kasus).
 */
export const ${varName}: MasterBankQuestion[] = ${JSON.stringify(questions, null, 2)};
`;
  fs.writeFileSync(filePath, header, 'utf8');
  console.log(`Saved ${questions.length} questions to ${filePath}`);
}

console.log("Ready to generate Part 3 and Part 4.");
