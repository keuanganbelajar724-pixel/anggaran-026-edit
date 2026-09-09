import { getWorkbookSampleProject, WORKBOOK_EXPECTED_RESULTS } from './sampleWorkbookData';
import { calculateIKPA } from './ikpa';

export interface GoldenTestItem {
  indicator: string;
  expectedRaw: number;
  actualRaw: number;
  expectedWeighted: number;
  actualWeighted: number;
  diffRaw: number;
  diffWeighted: number;
  status: 'PASS' | 'FAIL';
  tolerance: number;
}

export interface GoldenTestReport {
  timestamp: string;
  totalTests: number;
  passedCount: number;
  failedCount: number;
  overallStatus: 'PASS' | 'FAIL';
  results: GoldenTestItem[];
  overallIKPA: {
    expected: number;
    actual: number;
    diff: number;
    status: 'PASS' | 'FAIL';
  };
}

export function runGoldenTests(): GoldenTestReport {
  const sampleProj = getWorkbookSampleProject();
  const calculated = calculateIKPA(sampleProj);
  const exp = WORKBOOK_EXPECTED_RESULTS;
  const tolerance = 0.01;

  const testDefinitions: {
    key: keyof typeof exp;
    label: string;
    calcInd?: keyof typeof calculated.indicators;
  }[] = [
    { key: 'revisiDIPA', label: 'Revisi DIPA', calcInd: 'revisiDIPA' },
    { key: 'deviasiHalIII', label: 'Deviasi Hal III DIPA', calcInd: 'deviasiHalIII' },
    { key: 'penyerapan', label: 'Penyerapan Anggaran', calcInd: 'penyerapan' },
    { key: 'belanjaKontraktual', label: 'Belanja Kontraktual', calcInd: 'belanjaKontraktual' },
    { key: 'penyelesaianTagihan', label: 'Penyelesaian Tagihan', calcInd: 'penyelesaianTagihan' },
    { key: 'pengelolaanUPTUP', label: 'Pengelolaan UP dan TUP', calcInd: 'pengelolaanUPTUP' },
    { key: 'capaianOutput', label: 'Capaian Output', calcInd: 'capaianOutput' }
  ];

  const results: GoldenTestItem[] = [];

  for (const t of testDefinitions) {
    const expected = exp[t.key] as any;
    const actual = calculated.indicators[t.calcInd!];

    const diffRaw = Math.abs(expected.capped - actual.cappedValue);
    const diffWeighted = Math.abs(expected.weighted - actual.weightedValue);

    const isPass = diffRaw <= tolerance && diffWeighted <= tolerance;

    results.push({
      indicator: t.label,
      expectedRaw: expected.capped,
      actualRaw: actual.cappedValue,
      expectedWeighted: expected.weighted,
      actualWeighted: actual.weightedValue,
      diffRaw: Number(diffRaw.toFixed(4)),
      diffWeighted: Number(diffWeighted.toFixed(4)),
      status: isPass ? 'PASS' : 'FAIL',
      tolerance
    });
  }

  // Dispensasi SPM test
  const dispDiff = Math.abs(exp.dispensasiSPM.reduction - calculated.dispensasiReduction);
  results.push({
    indicator: 'Pengurang Dispensasi SPM',
    expectedRaw: exp.dispensasiSPM.reduction,
    actualRaw: calculated.dispensasiReduction,
    expectedWeighted: exp.dispensasiSPM.reduction,
    actualWeighted: calculated.dispensasiReduction,
    diffRaw: Number(dispDiff.toFixed(4)),
    diffWeighted: Number(dispDiff.toFixed(4)),
    status: dispDiff <= tolerance ? 'PASS' : 'FAIL',
    tolerance
  });

  const finalDiff = Math.abs(exp.finalScore - calculated.finalScore);
  const isFinalPass = finalDiff <= tolerance;

  const passedCount = results.filter(r => r.status === 'PASS').length + (isFinalPass ? 1 : 0);
  const totalTests = results.length + 1;
  const failedCount = totalTests - passedCount;

  return {
    timestamp: new Date().toISOString(),
    totalTests,
    passedCount,
    failedCount,
    overallStatus: failedCount === 0 ? 'PASS' : 'FAIL',
    results,
    overallIKPA: {
      expected: exp.finalScore,
      actual: calculated.finalScore,
      diff: Number(finalDiff.toFixed(4)),
      status: isFinalPass ? 'PASS' : 'FAIL'
    }
  };
}
