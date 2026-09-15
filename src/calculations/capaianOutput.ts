import {
  CapaianOutputInput,
  CapaianOutputKetepatanInput,
  IndicatorResult,
  CalculationDetail
} from '../models/ikpa';

/**
 * Excel-grade 2-decimal rounding with IEEE-754 binary floating nudge
 */
export function roundExcel2(val: number): number {
  if (isNaN(val) || !isFinite(val)) return 0;
  return Math.round((val + 1e-9) * 100) / 100;
}

/**
 * Interface untuk detail perhitungan per baris Rincian Output (RO)
 * Mengikuti kolom Excel:
 * E = Bulan
 * K = Target Volume
 * M = Realisasi Volume (RVRO)
 * N = Persen Progres (PCRO)
 * O = Status Konfirmasi ("terkonfirmasi" | "tidak terkonfirmasi")
 * P = Target PCRO
 * Q = Nilai Capaian RO (sebelum pembatasan)
 * R = Nilai Akhir Capaian RO: ROUND(IF(Q > 100, 100, Q), 2)
 */
export interface SingleROResult {
  no: number;
  bulan: number; // E
  satker?: string;
  namaSatker?: string;
  kppn?: string;
  program?: string;
  kegiatan?: string;
  kro?: string;
  ro?: string;
  uraianRO?: string;
  target: number; // K
  satuan?: string;
  realisasiRO: number; // M
  persenProgress: number; // N
  statusKonfirmasi: 'terkonfirmasi' | 'tidak terkonfirmasi'; // O
  targetPCRO: number; // P
  q: number; // Q
  r: number; // R
  branch: string; // Cabang logika formula yang diterapkan
  isConfirmed: boolean;
  isCapped: boolean;
  warning?: string;
  isValid: boolean;
}

/**
 * Interface untuk detail perhitungan Ketepatan Waktu Pelaporan Bulanan
 * Mengikuti kolom Excel:
 * X = Status Ketepatan Waktu ("Tepat Waktu" | "Tidak Tepat Waktu")
 * Y = IF(X = "Tepat Waktu", 100, 0)
 */
export interface SingleKetepatanResult {
  no: number;
  bulan: string;
  satker?: string;
  namaSatker?: string;
  x: string; // Kolom X
  y: number; // Kolom Y
  tanggalPelaporan?: string;
  isTepatWaktu: boolean;
  isValid: boolean;
}

export interface CapaianOutputCalculationReport {
  // Komponen Ketepatan Waktu (AB6, AC6, AD6)
  ab6AvgKetepatan: number;
  ac6BobotKetepatan: number; // 0.30
  ad6KontribusiKetepatan: number;

  // Komponen Capaian RO (AB7, AC7, AD7)
  ab7AvgCapaianRO: number;
  ac7BobotCapaianRO: number; // 0.70
  ad7KontribusiCapaianRO: number;

  // Nilai Akhir Capaian Output (AD8)
  ad8NilaiFinal: number;
  nilaiTerbobot: number; // AD8 * 25% / 100

  // Statistik Data
  totalROCount: number;
  validROCount: number;
  confirmedROCount: number;
  unconfirmedROCount: number;
  totalKetepatanCount: number;
  tepatWaktuCount: number;
  terlambatCount: number;

  // Hasil Per-Baris
  processedRO: SingleROResult[];
  processedKetepatan: SingleKetepatanResult[];

  // Validasi
  warnings: string[];
  hasIncompleteData: boolean;
}

/**
 * Menghitung nilai Q dan R untuk satu baris RO sesuai formula workbook Excel:
 * Q = IF(O="tidak terkonfirmasi", 0,
 *        IF(AND(E=12, O="terkonfirmasi"), M/K*100,
 *        IF(AND(N=100, O="terkonfirmasi"), M/K*100,
 *        IF(AND(N<100, O="terkonfirmasi"), M/P*100, M/K*100))))
 * R = ROUND(IF(Q > 100, 100, Q), 2)
 */
export function calculateSingleRO(row: CapaianOutputInput): SingleROResult {
  const statusStr = (row.statusKonfirmasi || '').toString().trim().toLowerCase();
  const isConfirmed = statusStr === 'terkonfirmasi';
  const isExplicitlyUnconfirmed = statusStr === 'tidak terkonfirmasi';

  const E = Number(row.bulan) || 0;
  const K = typeof row.target === 'number' ? row.target : Number(row.target) || 0;
  const M = typeof row.realisasiRO === 'number' ? row.realisasiRO : Number(row.realisasiRO) || 0;
  const N = typeof row.persenProgress === 'number' ? row.persenProgress : Number(row.persenProgress) || 0;
  const P = typeof row.targetPCRO === 'number' ? row.targetPCRO : Number(row.targetPCRO) || 0;

  let q = 0;
  let branch = '';
  let warning: string | undefined;

  // Cek validitas data
  const hasEmptyFields = (row.target === undefined || row.target === null || isNaN(K)) &&
                         (row.realisasiRO === undefined || row.realisasiRO === null || isNaN(M));
  
  if (K < 0 || M < 0 || N < 0 || P < 0) {
    warning = 'Target atau Realisasi tidak boleh bernilai negatif';
  }

  if (isExplicitlyUnconfirmed || !isConfirmed) {
    q = 0;
    branch = 'O = "tidak terkonfirmasi" → Q = 0';
  } else {
    // Terkonfirmasi
    if (E === 12) {
      if (K === 0) {
        q = 0;
        warning = 'Target (K) bernilai 0 pada bulan 12';
        branch = 'AND(E=12, O="terkonfirmasi") dengan Target=0 → 0';
      } else {
        q = (M / K) * 100;
        branch = `AND(E=12, O="terkonfirmasi") → M/K*100 = ${M}/${K}*100`;
      }
    } else if (N >= 100) {
      if (K === 0) {
        q = 0;
        warning = 'Target (K) bernilai 0 dengan Progres >= 100%';
        branch = 'AND(N>=100, O="terkonfirmasi") dengan Target=0 → 0';
      } else {
        q = (M / K) * 100;
        branch = `AND(N>=100, O="terkonfirmasi") → M/K*100 = ${M}/${K}*100`;
      }
    } else {
      // N < 100
      if (P === 0) {
        q = 0;
        warning = 'Target PCRO (P) bernilai 0 dengan Progres < 100%';
        branch = 'AND(N<100, O="terkonfirmasi") dengan Target PCRO=0 → 0';
      } else {
        q = (M / P) * 100;
        branch = `AND(N<100, O="terkonfirmasi") → M/P*100 = ${M}/${P}*100`;
      }
    }
  }

  // Handle NaN atau Infinity
  if (isNaN(q) || !isFinite(q)) {
    q = 0;
    warning = warning || 'Hasil perhitungan tidak terdefinisi (div by zero)';
  }

  // R = ROUND(IF(Q > 100, 100, Q), 2)
  const isCapped = q > 100;
  const clampedQ = Math.max(0, isCapped ? 100 : q);
  const r = roundExcel2(clampedQ);

  const isValid = !hasEmptyFields;

  return {
    no: row.no || 1,
    bulan: E,
    satker: row.satker,
    namaSatker: row.namaSatker,
    kppn: row.kppn,
    program: row.program,
    kegiatan: row.kegiatan,
    kro: row.kro,
    ro: row.ro,
    uraianRO: row.uraianRO,
    target: K,
    satuan: row.satuan,
    realisasiRO: M,
    persenProgress: N,
    statusKonfirmasi: isConfirmed ? 'terkonfirmasi' : 'tidak terkonfirmasi',
    targetPCRO: P,
    q: roundExcel2(q),
    r,
    branch,
    isConfirmed,
    isCapped,
    warning,
    isValid
  };
}

/**
 * Backward compatibility: returns score R (0..100)
 */
export function calculateSingleROScore(row: CapaianOutputInput): number {
  return calculateSingleRO(row).r;
}

/**
 * Menghitung nilai Y untuk satu baris ketepatan waktu pelaporan:
 * Y = IF(X = "Tepat Waktu", 100, 0)
 */
export function calculateSingleKetepatan(row: CapaianOutputKetepatanInput): SingleKetepatanResult {
  const x = (row.ketepatan || '').toString().trim();
  const isTepatWaktu = x.toLowerCase() === 'tepat waktu';
  const y = isTepatWaktu ? 100 : 0;

  return {
    no: row.no || 1,
    bulan: row.bulan || '01',
    satker: row.satker,
    namaSatker: row.namaSatker,
    x: isTepatWaktu ? 'Tepat Waktu' : 'Tidak Tepat Waktu',
    y,
    tanggalPelaporan: row.tanggalPelaporan,
    isTepatWaktu,
    isValid: true
  };
}

/**
 * Helper untuk memastikan selalu tersedia 12 bulan (Periode 01 s.d. 12) ketepatan pelaporan
 */
export function buildDefault12MonthsKetepatan(
  existing?: CapaianOutputKetepatanInput[],
  defaultStatus: 'Tepat Waktu' | 'Tidak Tepat Waktu' = 'Tepat Waktu',
  satkerKode: string = '',
  namaSatker: string = ''
): CapaianOutputKetepatanInput[] {
  return Array.from({ length: 12 }, (_, i) => {
    const monthNum = i + 1;
    const monthStr = String(monthNum).padStart(2, '0');
    const found = (existing || []).find(e => {
      const bNum = parseInt(e.bulan, 10);
      return bNum === monthNum || e.bulan === monthStr || e.bulan === String(monthNum);
    });

    if (found) {
      return {
        ...found,
        no: found.no || monthNum,
        satker: found.satker || satkerKode,
        namaSatker: found.namaSatker || namaSatker,
        bulan: monthStr,
        ketepatan: found.ketepatan || defaultStatus
      };
    }

    return {
      no: monthNum,
      satker: satkerKode,
      namaSatker: namaSatker,
      bulan: monthStr,
      ketepatan: defaultStatus
    };
  });
}

/**
 * Perhitungan komprehensif indikator Capaian Output IKPA 2026
 * Mengikuti sheet "Capaian Output" pada workbook Excel:
 * AB6 = AVERAGE(Y5:Y16)
 * AC6 = 0.30
 * AD6 = AC6 * AB6
 * AB7 = AVERAGE(R5:R63)
 * AC7 = 0.70
 * AD7 = AC7 * AB7
 * AD8 = SUM(AD6:AD7)
 */
export function calculateCapaianOutputDetailed(
  roInputs: CapaianOutputInput[],
  ketepatanInputs: CapaianOutputKetepatanInput[],
  weight: number = 25,
  cutoffMonth: number = 12
): CapaianOutputCalculationReport {
  const warnings: string[] = [];
  const cutoff = Math.min(12, Math.max(1, cutoffMonth || 12));

  // 1. Proses baris RO (filter bulan <= cutoff jika field bulan terdefinisi)
  const allProcessedRO = (roInputs || []).map(r => calculateSingleRO(r));
  const processedRO = allProcessedRO.filter(r => {
    const b = parseInt(String((r as any).bulan || ''), 10) || 0;
    return b === 0 || b <= cutoff;
  });
  const validRO = processedRO.filter(r => r.isValid);

  let confirmedCount = 0;
  let unconfirmedCount = 0;
  processedRO.forEach(r => {
    if (r.isConfirmed) confirmedCount++;
    else unconfirmedCount++;
    if (r.warning) warnings.push(`RO ${r.ro || r.no}: ${r.warning}`);
  });

  // Hitung AVERAGE(R) secara semantik Excel (hanya baris valid)
  let ab7AvgCapaianRO = 0;
  if (validRO.length > 0) {
    const sumR = validRO.reduce((acc, curr) => acc + curr.r, 0);
    ab7AvgCapaianRO = roundExcel2(sumR / validRO.length);
  }

  // 2. Proses baris Ketepatan Waktu (evaluasi s.d. cutoff bulan)
  // Pastikan selalu 12 bulan bila input kosong atau kurang lengkap
  const effectiveKetepatan = (!ketepatanInputs || ketepatanInputs.length === 0)
    ? buildDefault12MonthsKetepatan([], 'Tepat Waktu')
    : (ketepatanInputs.length < 12 ? buildDefault12MonthsKetepatan(ketepatanInputs, 'Tepat Waktu') : ketepatanInputs);

  const processedKetepatan = effectiveKetepatan.map(k => calculateSingleKetepatan(k));
  const validKetepatan = processedKetepatan.filter(k => k.isValid);

  // Filter ketepatan s.d. bulan cutoff (contoh: Januari s.d. September)
  const filteredKetepatan = validKetepatan.filter(k => {
    const b = parseInt(k.bulan, 10) || 0;
    return b === 0 || b <= cutoff;
  });
  const evalKetepatan = filteredKetepatan.length > 0 ? filteredKetepatan : validKetepatan;

  let tepatWaktuCount = 0;
  let terlambatCount = 0;
  evalKetepatan.forEach(k => {
    if (k.isTepatWaktu) tepatWaktuCount++;
    else terlambatCount++;
  });

  // Hitung AVERAGE(Y) secara semantik Excel
  let ab6AvgKetepatan = 0;
  if (evalKetepatan.length > 0) {
    const sumY = evalKetepatan.reduce((acc, curr) => acc + curr.y, 0);
    ab6AvgKetepatan = roundExcel2(sumY / evalKetepatan.length);
  }

  // 3. Komponen kontribusi
  const ac6BobotKetepatan = 0.30;
  const ad6KontribusiKetepatan = roundExcel2(ac6BobotKetepatan * ab6AvgKetepatan);

  const ac7BobotCapaianRO = 0.70;
  const ad7KontribusiCapaianRO = roundExcel2(ac7BobotCapaianRO * ab7AvgCapaianRO);

  // AD8 = SUM(AD6:AD7)
  const ad8NilaiFinal = roundExcel2(ad6KontribusiKetepatan + ad7KontribusiCapaianRO);
  const clampedFinal = Math.min(100, Math.max(0, ad8NilaiFinal));
  const nilaiTerbobot = roundExcel2((clampedFinal * weight) / 100);

  const hasIncompleteData = processedRO.length === 0;

  return {
    ab6AvgKetepatan,
    ac6BobotKetepatan,
    ad6KontribusiKetepatan,
    ab7AvgCapaianRO,
    ac7BobotCapaianRO,
    ad7KontribusiCapaianRO,
    ad8NilaiFinal: clampedFinal,
    nilaiTerbobot,
    totalROCount: processedRO.length,
    validROCount: validRO.length,
    confirmedROCount: confirmedCount,
    unconfirmedROCount: unconfirmedCount,
    totalKetepatanCount: processedKetepatan.length,
    tepatWaktuCount,
    terlambatCount,
    processedRO,
    processedKetepatan,
    warnings,
    hasIncompleteData
  };
}

/**
 * Fungsi utama kalkulator IKPA: calculateCapaianOutput
 */
export function calculateCapaianOutput(
  roInputs: CapaianOutputInput[],
  ketepatanInputs: CapaianOutputKetepatanInput[],
  weight: number = 25,
  isActive: boolean = true,
  cutoffMonth: number = 12
): IndicatorResult {
  const details: CalculationDetail[] = [];

  if (!isActive || weight === 0) {
    return {
      rawValue: 0,
      cappedValue: 0,
      weight: isActive ? weight : 0,
      weightedValue: 0,
      isActive,
      details: [{
        step: 'Indikator Tidak Aktif',
        formulaHuman: 'Bobot = 0%',
        value: 0
      }]
    };
  }

  const report = calculateCapaianOutputDetailed(roInputs, ketepatanInputs, weight, cutoffMonth);

  if (report.hasIncompleteData && report.totalROCount === 0) {
    return {
      rawValue: 0,
      cappedValue: 0,
      weight: isActive ? weight : 0,
      weightedValue: 0,
      isActive,
      details: [{
        step: 'Data Capaian Output Kosong',
        formulaHuman: 'Belum ada data Rincian Output (RO) yang diinputkan (Nilai = 0)',
        value: 0
      }],
      metadata: {
        avgKetepatan: report.ab6AvgKetepatan,
        bobotKetepatan: report.ac6BobotKetepatan,
        kontribusiKetepatan: report.ad6KontribusiKetepatan,
        avgCapaianRO: report.ab7AvgCapaianRO,
        bobotCapaianRO: report.ac7BobotCapaianRO,
        kontribusiCapaianRO: report.ad7KontribusiCapaianRO,
        nilaiFinalCapaianOutput: 0,
        roCount: 0
      }
    };
  }

  // 1. Detail Ketepatan Waktu Pelaporan
  details.push({
    step: 'Indikator Ketepatan Waktu Pelaporan (Bobot 30%) - Sel AD6',
    formulaHuman: `Rata-rata ketepatan ${report.totalKetepatanCount} bulan (AB6) = ${report.ab6AvgKetepatan.toFixed(2)} → Kontribusi AD6 = 30% × ${report.ab6AvgKetepatan.toFixed(2)} = ${report.ad6KontribusiKetepatan.toFixed(2)}`,
    formulaTechnical: 'AD6 = AC6 * AB6 = 0.30 * AVERAGE(Y5:Y16)',
    value: report.ad6KontribusiKetepatan
  });

  // 2. Detail Capaian RO
  details.push({
    step: 'Indikator Capaian Rincian Output (Bobot 70%) - Sel AD7',
    formulaHuman: `Rata-rata capaian ${report.validROCount} Rincian Output (AB7) = ${report.ab7AvgCapaianRO.toFixed(2)} → Kontribusi AD7 = 70% × ${report.ab7AvgCapaianRO.toFixed(2)} = ${report.ad7KontribusiCapaianRO.toFixed(2)}`,
    formulaTechnical: 'AD7 = AC7 * AB7 = 0.70 * AVERAGE(R5:R63)',
    value: report.ad7KontribusiCapaianRO
  });

  // 3. Nilai Akhir Capaian Output (AD8)
  details.push({
    step: 'Nilai Akhir Capaian Output (Sel AD8)',
    formulaHuman: `Kontribusi Ketepatan (${report.ad6KontribusiKetepatan.toFixed(2)}) + Kontribusi Capaian RO (${report.ad7KontribusiCapaianRO.toFixed(2)}) = ${report.ad8NilaiFinal.toFixed(2)}`,
    formulaTechnical: 'AD8 = SUM(AD6:AD7)',
    value: report.ad8NilaiFinal
  });

  // 4. Nilai Terbobot IKPA (M8)
  details.push({
    step: 'Nilai Terbobot IKPA (Bobot 25%)',
    formulaHuman: `ROUND(${report.ad8NilaiFinal.toFixed(2)} × ${weight}% / 100; 2) = ${report.nilaiTerbobot.toFixed(2)}`,
    formulaTechnical: `ROUND(${report.ad8NilaiFinal.toFixed(2)} * ${weight} / 100, 2)`,
    value: report.nilaiTerbobot
  });

  return {
    rawValue: report.ad8NilaiFinal,
    cappedValue: report.ad8NilaiFinal,
    weight,
    weightedValue: report.nilaiTerbobot,
    isActive,
    details,
    metadata: {
      avgKetepatan: report.ab6AvgKetepatan,
      bobotKetepatan: report.ac6BobotKetepatan,
      kontribusiKetepatan: report.ad6KontribusiKetepatan,
      avgCapaianRO: report.ab7AvgCapaianRO,
      bobotCapaianRO: report.ac7BobotCapaianRO,
      kontribusiCapaianRO: report.ad7KontribusiCapaianRO,
      nilaiFinalCapaianOutput: report.ad8NilaiFinal,
      roCount: report.validROCount,
      report
    }
  };
}

/**
 * GOLDEN TESTS SUITE:
 * Verifikasi kompatibilitas 100% dengan Workbook Excel "Kalkulator Perhitungan IKPA 2026"
 */
export interface CapaianOutputGoldenTestCase {
  id: string;
  name: string;
  description: string;
  expectedAD6: number; // Kontribusi Ketepatan Waktu
  expectedAD7: number; // Kontribusi Capaian RO
  expectedAD8: number; // Nilai Akhir Capaian Output
  expectedTerbobot: number; // Terbobot 25%
  roData: CapaianOutputInput[];
  ketepatanData: CapaianOutputKetepatanInput[];
}

export interface CapaianOutputGoldenReport {
  timestamp: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  allPassed: boolean;
  results: Array<{
    id: string;
    name: string;
    passed: boolean;
    actualAD8: number;
    expectedAD8: number;
    actualAD6: number;
    expectedAD6: number;
    actualAD7: number;
    expectedAD7: number;
    diff: number;
    details: string;
  }>;
}

export function runCapaianOutputGoldenTests(): CapaianOutputGoldenReport {
  const testCases: CapaianOutputGoldenTestCase[] = [
    {
      id: 'TC-01',
      name: 'Workbook Reference (100% Sempurna)',
      description: '12 bulan tepat waktu, 23 RO terkonfirmasi 100% capaian. Sesuai sheet Capaian Output.',
      expectedAD6: 30.00,
      expectedAD7: 70.00,
      expectedAD8: 100.00,
      expectedTerbobot: 25.00,
      roData: [
        { no: 1, bulan: 12, target: 1, realisasiRO: 1, persenProgress: 100, statusKonfirmasi: 'terkonfirmasi', targetPCRO: 90.86 },
        { no: 2, bulan: 12, target: 10, realisasiRO: 10, persenProgress: 100, statusKonfirmasi: 'terkonfirmasi', targetPCRO: 100 }
      ],
      ketepatanData: Array.from({ length: 12 }, (_, i) => ({
        no: i + 1,
        bulan: String(i + 1).padStart(2, '0'),
        ketepatan: 'Tepat Waktu' as const
      }))
    },
    {
      id: 'TC-02',
      name: 'User Prompt Illustrated Example (95 Ketepatan, 91.35 RO)',
      description: 'Ketepatan Waktu 95.00 (AD6=28.50), Capaian RO 91.35 (AD7=63.95) → AD8 = 92.45.',
      expectedAD6: 28.50,
      expectedAD7: 63.95,
      expectedAD8: 92.45,
      expectedTerbobot: 23.11,
      roData: [
        // 1 RO dengan nilai R = 91.35
        { no: 1, bulan: 12, target: 100, realisasiRO: 91.35, persenProgress: 100, statusKonfirmasi: 'terkonfirmasi', targetPCRO: 100 }
      ],
      ketepatanData: [
        // Rata-rata Y = 95.00: 19 tepat waktu (1900) + 1 terlambat (0) = 1900/20 = 95.00
        ...Array.from({ length: 19 }, (_, i) => ({
          no: i + 1,
          bulan: String(i + 1),
          ketepatan: 'Tepat Waktu' as const
        })),
        { no: 20, bulan: '20', ketepatan: 'Tidak Tepat Waktu' as const }
      ]
    },
    {
      id: 'TC-03',
      name: 'Branch E=12 (Bulan Desember: M/K*100)',
      description: 'Bulan 12, Realisasi 8 dari Target 10 → Q = 80.00, R = 80.00.',
      expectedAD6: 30.00,
      expectedAD7: 56.00, // 70% * 80 = 56.00
      expectedAD8: 86.00,
      expectedTerbobot: 21.50,
      roData: [
        { no: 1, bulan: 12, target: 10, realisasiRO: 8, persenProgress: 80, statusKonfirmasi: 'terkonfirmasi', targetPCRO: 90 }
      ],
      ketepatanData: [
        { no: 1, bulan: '01', ketepatan: 'Tepat Waktu' as const }
      ]
    },
    {
      id: 'TC-04',
      name: 'Branch N=100 (Progres 100% non-Desember: M/K*100)',
      description: 'Bulan 6, N=100, Realisasi 5 dari Target 5 → Q = 100.00, R = 100.00.',
      expectedAD6: 30.00,
      expectedAD7: 70.00,
      expectedAD8: 100.00,
      expectedTerbobot: 25.00,
      roData: [
        { no: 1, bulan: 6, target: 5, realisasiRO: 5, persenProgress: 100, statusKonfirmasi: 'terkonfirmasi', targetPCRO: 50 }
      ],
      ketepatanData: [
        { no: 1, bulan: '01', ketepatan: 'Tepat Waktu' as const }
      ]
    },
    {
      id: 'TC-05',
      name: 'Branch N<100 (Progres < 100%: M/P*100)',
      description: 'Bulan 6, N=75, Realisasi M=60, Target PCRO P=75 → Q = 60/75*100 = 80.00.',
      expectedAD6: 30.00,
      expectedAD7: 56.00, // 70% * 80 = 56.00
      expectedAD8: 86.00,
      expectedTerbobot: 21.50,
      roData: [
        { no: 1, bulan: 6, target: 100, realisasiRO: 60, persenProgress: 75, statusKonfirmasi: 'terkonfirmasi', targetPCRO: 75 }
      ],
      ketepatanData: [
        { no: 1, bulan: '01', ketepatan: 'Tepat Waktu' as const }
      ]
    },
    {
      id: 'TC-06',
      name: 'Branch Tidak Terkonfirmasi (O = "tidak terkonfirmasi" → Q = 0, R = 0)',
      description: 'Jika belum terkonfirmasi, nilai R otomatis 0.',
      expectedAD6: 30.00,
      expectedAD7: 0.00,
      expectedAD8: 30.00,
      expectedTerbobot: 7.50,
      roData: [
        { no: 1, bulan: 12, target: 10, realisasiRO: 10, persenProgress: 100, statusKonfirmasi: 'tidak terkonfirmasi', targetPCRO: 100 }
      ],
      ketepatanData: [
        { no: 1, bulan: '01', ketepatan: 'Tepat Waktu' as const }
      ]
    },
    {
      id: 'TC-07',
      name: 'Pembatasan Capping R Maksimal 100 (Q = 150 → R = 100)',
      description: 'Realisasi 15 dari Target 10 (Q=150) dibatasi maksimal R=100.00.',
      expectedAD6: 30.00,
      expectedAD7: 70.00,
      expectedAD8: 100.00,
      expectedTerbobot: 25.00,
      roData: [
        { no: 1, bulan: 12, target: 10, realisasiRO: 15, persenProgress: 100, statusKonfirmasi: 'terkonfirmasi', targetPCRO: 100 }
      ],
      ketepatanData: [
        { no: 1, bulan: '01', ketepatan: 'Tepat Waktu' as const }
      ]
    },
    {
      id: 'TC-08',
      name: 'Ketepatan Waktu Campuran (10 Tepat, 2 Terlambat)',
      description: '10 Tepat Waktu (100) dan 2 Terlambat (0) → AVERAGE Y = 83.33, AD6 = 25.00.',
      expectedAD6: 25.00,
      expectedAD7: 70.00,
      expectedAD8: 95.00,
      expectedTerbobot: 23.75,
      roData: [
        { no: 1, bulan: 12, target: 1, realisasiRO: 1, persenProgress: 100, statusKonfirmasi: 'terkonfirmasi', targetPCRO: 100 }
      ],
      ketepatanData: [
        ...Array.from({ length: 10 }, (_, i) => ({
          no: i + 1,
          bulan: String(i + 1).padStart(2, '0'),
          ketepatan: 'Tepat Waktu' as const
        })),
        { no: 11, bulan: '11', ketepatan: 'Tidak Tepat Waktu' as const },
        { no: 12, bulan: '12', ketepatan: 'Tidak Tepat Waktu' as const }
      ]
    }
  ];

  const results = testCases.map(tc => {
    const report = calculateCapaianOutputDetailed(tc.roData, tc.ketepatanData, 25);
    const diffAD8 = Math.abs(report.ad8NilaiFinal - tc.expectedAD8);
    const diffAD6 = Math.abs(report.ad6KontribusiKetepatan - tc.expectedAD6);
    const diffAD7 = Math.abs(report.ad7KontribusiCapaianRO - tc.expectedAD7);
    const passed = diffAD8 < 0.01 && diffAD6 < 0.01 && diffAD7 < 0.01;

    return {
      id: tc.id,
      name: tc.name,
      passed,
      actualAD8: report.ad8NilaiFinal,
      expectedAD8: tc.expectedAD8,
      actualAD6: report.ad6KontribusiKetepatan,
      expectedAD6: tc.expectedAD6,
      actualAD7: report.ad7KontribusiCapaianRO,
      expectedAD7: tc.expectedAD7,
      diff: roundExcel2(diffAD8),
      details: tc.description
    };
  });

  const passedTests = results.filter(r => r.passed).length;

  return {
    timestamp: new Date().toISOString(),
    totalTests: testCases.length,
    passedTests,
    failedTests: testCases.length - passedTests,
    allPassed: passedTests === testCases.length,
    results
  };
}
