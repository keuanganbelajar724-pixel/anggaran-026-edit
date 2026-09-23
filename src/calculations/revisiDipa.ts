import { RevisiDIPAInput, RevisionDipaRow, IndicatorResult, CalculationDetail } from '../models/ikpa';
import { round2 } from './rounding';

/**
 * Master Data: 14 Jenis Revisi yang Diakui IKPA 2026 (PER-5/PB/2022 & PER-5/PB/2024)
 * Revisi dalam batas pagu tetap (pagu sebelum === pagu menjadi)
 */
export const VALID_REVISION_CODES = [
  "201", "211", "212", "213", "217", "219", "220", "221",
  "222", "224", "225", "226", "229", "231", "233", "234", "236", "238", "239"
];

export const VALID_REVISION_CODE_MAP: Record<string, string> = {
  // 14 Jenis Revisi yang Diperhitungkan (Pagu Tetap - Kewenangan Kanwil DJPb / DJA)
  "201": "Antar-Fungsi/Sub-Fungsi dan/atau Antar-Program",
  "211": "Pemenuhan Belanja Operasional",
  "212": "Penyelesaian Pagu Minus Belanja Pegawai Operasional",
  "213": "Pergeseran Anggaran dari Belanja Operasional ke Belanja Non-Operasional",
  "217": "Penyelesaian Tunggakan",
  "219": "Kegiatan Dekonsentrasi dan/atau Tugas Pembantuan dan Urusan Bersama",
  "220": "Pemanfaatan Sisa Anggaran Kontraktual dan/atau Swakelola",
  "221": "Pergeseran Anggaran Antarjenis Belanja",
  "222": "Kontrak Tahun Jamak (Multi-Years Contract)",
  "224": "Pergeseran Anggaran dalam 1 (satu) RO Prioritas Nasional",
  "225": "Rincian Output (RO) Cadangan",
  "226": "Penurunan Volume RO secara Total",
  "229": "Penyelesaian Putusan Pengadilan Berkekuatan Hukum Tetap (Inkracht)",
  "231": "Penyelesaian Pekerjaan yang Tidak Terselesaikan sampai dengan Akhir Tahun Anggaran",
  "233": "Pergeseran Anggaran DIPA K/L untuk Anggaran dari SP SABA 999.08",
  "234": "Pergeseran Belanja Barang Diserahkan ke Pemda/Masyarakat (Akun 526)",
  "236": "Pergeseran Anggaran Antar-KRO dan/atau Antar-Kegiatan",
  "238": "Pergeseran Anggaran Antar-Satker",
  "239": "Revisi dalam Rangka Pagu Anggaran Tetap Lainnya",

  // Kategori Administrasi KPA (Kode 300-an) - Bukan 14 Jenis IKPA (Pengecualian / Bebas)
  "311": "Ralat Kode Akun Kebijakan Akuntansi (KPA)",
  "312": "Perubahan Pejabat Perbendaharaan KPA/PPK/PPSPM/Bendahara (KPA)",
  "313": "Ralat Kode KPPN/Lokasi Satker (KPA)",
  "314": "Perubahan Nomenklatur Bagian Anggaran dan/atau Satker (KPA)",
  "315": "Pencantuman/Perubahan Rencana Penarikan Dana (RPD) Hal III DIPA (KPA)",
  "316": "Ralat Redaksional Penulisan DIPA (KPA)",
  "317": "Perubahan/Pergeseran dalam 1 (satu) RO Komponen/Subkomponen (KPA)",
  "318": "Pembukaan Blokir Anggaran (KPA)",
  "321": "Revisi Administrasi KPA Lainnya (KPA)",

  // Kategori DJA / Pagu Berubah (Kode 100-an)
  "101": "Perubahan Pagu Anggaran Belanja (DJA/DPR)",
  "102": "Tanggap Darurat Bencana (DJA)",
  "103": "Luncuran Pinjaman/Hibah Luar Negeri - PHLN (DJA)",
  "104": "Penggunaan Saldo Awal BLU (DJA)",
  "105": "Pengesahan Pendapatan Hibah Langsung (DJA)"
};

/**
 * Memecah kode jenis revisi string (mendukung koma, titik koma, spasi, atau garis miring)
 * Contoh: "217, 315" -> ["217", "315"]
 * Contoh: "217,315" -> ["217", "315"]
 * Contoh: "201; 212" -> ["201", "212"]
 */
export function parseRevisionCodes(codeStr: string | null | undefined): string[] {
  if (!codeStr) return [];
  return String(codeStr)
    .split(/[,;\s/]+/)
    .map(s => s.trim())
    .filter(Boolean);
}

/**
 * Mengecek apakah kode revisi yang diinput termasuk dalam 14 jenis revisi
 */
export function checkRevisionCodes(codeStr: string | null | undefined): {
  codes: string[];
  hasAny14: boolean;
  hasAll14: boolean;
  matchedCodes: string[];
  unmatchedCodes: string[];
  descriptions: { kode: string; uraian: string; is14: boolean }[];
} {
  const codes = parseRevisionCodes(codeStr);
  if (codes.length === 0) {
    return {
      codes: [],
      hasAny14: false,
      hasAll14: false,
      matchedCodes: [],
      unmatchedCodes: [],
      descriptions: []
    };
  }
  const matchedCodes = codes.filter(c => VALID_REVISION_CODES.includes(c));
  const unmatchedCodes = codes.filter(c => !VALID_REVISION_CODES.includes(c));
  const descriptions = codes.map(c => ({
    kode: c,
    uraian: VALID_REVISION_CODE_MAP[c] || (c.startsWith('3') ? 'Revisi Administrasi KPA (Non-14 Jenis)' : 'Kode revisi di luar 14 jenis pembatasan IKPA'),
    is14: VALID_REVISION_CODES.includes(c)
  }));

  return {
    codes,
    hasAny14: matchedCodes.length > 0,
    hasAll14: unmatchedCodes.length === 0,
    matchedCodes,
    unmatchedCodes,
    descriptions
  };
}

/**
 * Logika Kolom I: Apakah diperhitungkan dalam Indikator Revisi DIPA
 * Formula Excel: =IF(AND(H4="ya",F4=G4),"diperhitungkan","tidak diperhitungkan")
 *
 * Syarat:
 * 1. H === "ya" (atau auto-infer dari kodeJenisRevisi jika H masih "-")
 * 2. Pagu Sebelum (F) === Pagu Menjadi (G) (keduanya tidak null/kosong dan > 0)
 */
export function calculateRevisionEligibility(
  row: Partial<RevisionDipaRow & RevisiDIPAInput>
): "diperhitungkan" | "tidak diperhitungkan" {
  let hRaw = row.empatBelasJenis ?? row.jenisRevisi14 ?? "-";
  let h = String(hRaw).trim().toLowerCase();

  // Otomatis deteksi dari kode jenis revisi jika kolom H belum dipilih secara eksplisit ("-")
  if (h === "-" && row.kodeJenisRevisi) {
    const check = checkRevisionCodes(row.kodeJenisRevisi);
    if (check.hasAny14) {
      h = "ya";
    } else if (check.codes.length > 0) {
      h = "tidak";
    }
  }

  // Jika tidak ada revisi ("-") atau "tidak", otomatis tidak diperhitungkan
  if (h !== "ya") {
    return "tidak diperhitungkan";
  }

  const f = row.paguSebelum !== undefined && row.paguSebelum !== null
    ? Number(row.paguSebelum)
    : (row.paguDipaSebelum !== undefined && row.paguDipaSebelum !== null ? Number(row.paguDipaSebelum) : null);

  const g = row.paguMenjadi !== undefined && row.paguMenjadi !== null
    ? Number(row.paguMenjadi)
    : (row.paguDipaMenjadi !== undefined && row.paguDipaMenjadi !== null ? Number(row.paguDipaMenjadi) : null);

  // Jika H === "ya", F dan G wajib ada dan F === G (Pagu DIPA Tetap)
  if (f !== null && g !== null && f === g && f > 0) {
    return "diperhitungkan";
  }

  return "tidak diperhitungkan";
}

/**
 * Logika Kolom J: Menghitung jumlah revisi yang diperhitungkan secara kumulatif
 * Excel: COUNTIF(range, "diperhitungkan")
 */
export function calculateCumulativeCount(
  rows: { diperhitungkan?: "diperhitungkan" | "tidak diperhitungkan" }[],
  startIndex: number,
  endIndex: number
): number {
  let count = 0;
  for (let i = startIndex; i <= endIndex; i++) {
    if (rows[i]?.diperhitungkan === "diperhitungkan") {
      count++;
    }
  }
  return count;
}

/**
 * Logika Kolom L: Nilai Indikator
 * Formula Excel: =IF(J4<=1,110,IF(J4=2,100,50))
 * Catatan: JANGAN cap 100 pada kolom L. Nilai 110 harus tetap diperbolehkan!
 */
export function calculateRevisionIndicator(count: number): number {
  if (count <= 1) return 110;
  if (count === 2) return 100;
  return 50;
}

/**
 * Menghitung seluruh tabel Revisi DIPA untuk 12 periode.
 *
 * Pemisahan Semester:
 * - Semester I (Periode 01-06, baris index 0-5):
 *   - J[i] = COUNTIF(I[0..i], "diperhitungkan")
 *   - L[i] = calculateRevisionIndicator(J[i])
 *   - M[i] = L[i] (M4..M9 = L4..L9)
 *
 * - Semester II (Periode 07-12, baris index 6-11):
 *   - J[i] = COUNTIF(I[6..i], "diperhitungkan") (KUMULATIF DIMULAI KEMBALI DARI PERIODE 07!)
 *   - L[i] = calculateRevisionIndicator(J[i])
 *   - M[i] = AVERAGE(L[5], L[i]) = (L[5] + L[i]) / 2 (Excel AVERAGE($L$9, L_curr))
 */
export function calculateSemesterIKPA(
  inputs: (RevisionDipaRow | RevisiDIPAInput)[]
): RevisionDipaRow[] {
  if (!inputs || inputs.length === 0) {
    return [];
  }

  const preparedRows: RevisionDipaRow[] = inputs.map((existing, i) => {
    const no = existing?.no ?? (i + 1);
    const periode = existing?.periode ?? String(no).padStart(2, '0');
    const isSem1 = no <= 6;
    const keterangan = isSem1 ? 'Semester I' : 'Semester II';

    const rawRevKe = existing?.revisiKe !== undefined && existing?.revisiKe !== null ? Number(existing.revisiKe) : null;
    const revisiKe = rawRevKe !== null && !isNaN(rawRevKe) ? Math.max(0, Math.abs(rawRevKe)) : null;
    const tanggalRevisi = existing?.tanggalRevisi || null;
    const kodeJenisRevisi = existing?.kodeJenisRevisi || '';

    const f = (existing as any)?.paguSebelum !== undefined
      ? (existing as any).paguSebelum
      : ((existing as any)?.paguDipaSebelum !== undefined ? (existing as any).paguDipaSebelum : null);

    const g = (existing as any)?.paguMenjadi !== undefined
      ? (existing as any).paguMenjadi
      : ((existing as any)?.paguDipaMenjadi !== undefined ? (existing as any).paguDipaMenjadi : null);

    const hRaw = (existing as any)?.empatBelasJenis ?? (existing as any)?.jenisRevisi14 ?? '-';
    const empatBelasJenis: "ya" | "tidak" | "-" =
      hRaw === 'ya' ? 'ya' : (hRaw === 'tidak' ? 'tidak' : '-');

    return {
      no,
      periode,
      revisiKe,
      tanggalRevisi,
      kodeJenisRevisi,
      paguSebelum: f !== null && f !== undefined ? Number(f) : null,
      paguMenjadi: g !== null && g !== undefined ? Number(g) : null,
      empatBelasJenis,
      diperhitungkan: 'tidak diperhitungkan',
      jumlahDiperhitungkan: 0,
      keterangan,
      nilaiIndikator: 110,
      nilaiIKPA: 110
    };
  });

  // Step 1: Hitung status diperhitungkan (Kolom I) untuk setiap baris
  for (let i = 0; i < preparedRows.length; i++) {
    preparedRows[i].diperhitungkan = calculateRevisionEligibility(preparedRows[i]);
  }

  // Kelompokkan indeks baris per Semester I (no <= 6) dan Semester II (no > 6)
  const sem1Indices: number[] = [];
  const sem2Indices: number[] = [];
  preparedRows.forEach((row, idx) => {
    if (row.no <= 6) {
      sem1Indices.push(idx);
    } else {
      sem2Indices.push(idx);
    }
  });

  // Step 2: Semester I
  for (let idx of sem1Indices) {
    const count = calculateCumulativeCount(preparedRows, sem1Indices[0], idx);
    preparedRows[idx].jumlahDiperhitungkan = count;
    preparedRows[idx].keterangan = 'Semester I';
    const indicator = calculateRevisionIndicator(count);
    preparedRows[idx].nilaiIndikator = indicator;
    preparedRows[idx].nilaiIKPA = indicator;
  }

  // Nilai Semester I terakhir
  const lastSem1Idx = sem1Indices.length > 0 ? sem1Indices[sem1Indices.length - 1] : -1;
  const l9Value = lastSem1Idx >= 0 ? preparedRows[lastSem1Idx].nilaiIndikator : 110;

  // Step 3: Semester II (Kumulatif Semester II dimulai dari awal Semester II)
  for (let idx of sem2Indices) {
    const count = calculateCumulativeCount(preparedRows, sem2Indices[0], idx);
    preparedRows[idx].jumlahDiperhitungkan = count;
    preparedRows[idx].keterangan = 'Semester II';
    const indicator = calculateRevisionIndicator(count);
    preparedRows[idx].nilaiIndikator = indicator;
    preparedRows[idx].nilaiIKPA = (l9Value + indicator) / 2;
  }

  return preparedRows;
}

export function hasActualRevisiDIPAData(inputs?: (RevisiDIPAInput | RevisionDipaRow)[]): boolean {
  if (!inputs || inputs.length === 0) return false;
  return inputs.some(r => {
    if (!r) return false;
    const revKe = Number(r.revisiKe);
    if (!isNaN(revKe) && revKe > 0) return true;
    if (typeof r.tanggalRevisi === 'string' && r.tanggalRevisi.trim() !== '') return true;
    const pSeb = Number((r as any).paguDipaSebelum ?? (r as any).paguSebelum);
    if (!isNaN(pSeb) && pSeb > 0) return true;
    const pMen = Number((r as any).paguDipaMenjadi ?? (r as any).paguMenjadi);
    if (!isNaN(pMen) && pMen > 0) return true;
    if (r.kodeJenisRevisi && String(r.kodeJenisRevisi).trim() !== '') return true;
    return false;
  });
}

/**
 * Logika Final yang Masuk ke Interface (Dashboard):
 * Formula Excel: =IF('Revisi DIPA'!M15>100, 100, 'Revisi DIPA'!M15)
 *
 * Cap 100 HANYA dilakukan pada nilai akhir yang masuk ke dashboard/interface.
 * Kolom L dan M tabel tetap mempertahankan nilai asli (misal 110 atau 105).
 */
export function calculateFinalRevisionScore(rows: RevisionDipaRow[]): number {
  if (!rows || rows.length === 0 || !hasActualRevisiDIPAData(rows)) return 0;
  // Ambil M15 (periode 12, index 11)
  const lastRow = rows.length >= 12 ? rows[11] : rows[rows.length - 1];
  const m15 = lastRow ? lastRow.nilaiIKPA : 0;
  return Math.min(100, m15);
}

/**
 * Fungsi kalkulasi utama untuk modul IKPA Engine.
 * Mengembalikan IndicatorResult lengkap dengan rincian audit perhitungan.
 */
export function calculateRevisiDIPA(
  inputs: RevisiDIPAInput[] | RevisionDipaRow[],
  weight: number = 10,
  isActive: boolean = true
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
        formulaHuman: 'Bobot = 0% atau indikator dinonaktifkan',
        value: 0
      }]
    };
  }

  // Jika belum ada data revisi DIPA yang diisi, kembalikan nilai 0 (bukan default 100/110)
  if (!hasActualRevisiDIPAData(inputs)) {
    return {
      rawValue: 0,
      cappedValue: 0,
      weight: isActive ? weight : 0,
      weightedValue: 0,
      isActive,
      details: [{
        step: 'Data Revisi DIPA Kosong',
        formulaHuman: 'Belum ada data revisi DIPA yang diinputkan (Nilai = 0)',
        formulaTechnical: '0',
        value: 0,
        note: 'Nilai awal simulasi 0 sebelum data revisi DIPA diisi'
      }],
      metadata: {
        rows: [],
        sem1Count: 0,
        sem2Count: 0,
        sem1Indicator: 0,
        sem2Indicator: 0,
        m15: 0,
        finalScore: 0
      }
    };
  }

  // Hitung tabel periode (12 periode standar atau baris dinamis satker)
  const calculatedRows = calculateSemesterIKPA(inputs || []);
  if (calculatedRows.length === 0) {
    return {
      rawValue: 0,
      cappedValue: 0,
      weight: isActive ? weight : 0,
      weightedValue: 0,
      isActive,
      details: [{
        step: 'Data Revisi DIPA Kosong',
        formulaHuman: 'Belum ada data revisi DIPA yang diinputkan (Nilai = 0)',
        formulaTechnical: '0',
        value: 0,
        note: 'Nilai awal simulasi 0 sebelum data revisi DIPA diisi'
      }],
      metadata: {
        rows: [],
        sem1Count: 0,
        sem2Count: 0,
        sem1Indicator: 0,
        sem2Indicator: 0,
        m15: 0,
        finalScore: 0
      }
    };
  }

  // Cari baris terakhir Semester I (no <= 6) dan Semester II (no > 6)
  const sem1Rows = calculatedRows.filter(r => r.no <= 6);
  const sem2Rows = calculatedRows.filter(r => r.no > 6);
  const lastSem1 = sem1Rows.length > 0 ? sem1Rows[sem1Rows.length - 1] : undefined;
  const lastSem2 = sem2Rows.length > 0 ? sem2Rows[sem2Rows.length - 1] : undefined;

  const sem1Count = lastSem1 ? lastSem1.jumlahDiperhitungkan : 0;
  const sem2Count = lastSem2 ? lastSem2.jumlahDiperhitungkan : 0;
  const l9Value = lastSem1 ? lastSem1.nilaiIndikator : 110;
  const l15Value = lastSem2 ? lastSem2.nilaiIndikator : l9Value;

  const lastRow = calculatedRows[calculatedRows.length - 1];
  const m15Value = lastRow ? lastRow.nilaiIKPA : (lastSem2 ? (l9Value + l15Value) / 2 : l9Value);

  const rawValue = m15Value;
  const cappedValue = Math.min(100, rawValue);
  const weightedValue = round2((cappedValue * weight) / 100);

  details.push({
    step: 'Revisi Diperhitungkan Semester I (J9)',
    formulaHuman: `COUNTIF(I4:I9; "diperhitungkan") = ${sem1Count} revisi`,
    formulaTechnical: 'COUNTIF(I4:I9, "diperhitungkan")',
    excelCell: 'J9',
    value: sem1Count,
    note: sem1Count <= 1 ? 'Maksimal 1 revisi per semester (Nilai 110)' : (sem1Count === 2 ? '2 revisi (Nilai 100)' : '>2 revisi (Nilai 50)')
  });

  details.push({
    step: 'Nilai Indikator Semester I (L9)',
    formulaHuman: `IF(J9<=1; 110; IF(J9=2; 100; 50)) = ${l9Value}`,
    formulaTechnical: 'IF(J9<=1, 110, IF(J9=2, 100, 50))',
    excelCell: 'L9',
    value: l9Value
  });

  if (sem2Rows.length > 0) {
    details.push({
      step: 'Revisi Diperhitungkan Semester II (J15)',
      formulaHuman: `COUNTIF(I10:I15; "diperhitungkan") = ${sem2Count} revisi (dihitung ulang mulai periode 07)`,
      formulaTechnical: 'COUNTIF(I10:I15, "diperhitungkan")',
      excelCell: 'J15',
      value: sem2Count,
      note: 'Basis perhitungan Semester II terpisah, tidak menggabungkan Semester I'
    });

    details.push({
      step: 'Nilai Indikator Semester II (L15)',
      formulaHuman: `IF(J15<=1; 110; IF(J15=2; 100; 50)) = ${l15Value}`,
      formulaTechnical: 'IF(J15<=1, 110, IF(J15=2, 100, 50))',
      excelCell: 'L15',
      value: l15Value
    });

    details.push({
      step: 'Nilai Akhir Indikator (M15)',
      formulaHuman: `AVERAGE(L9; L15) = (${l9Value} + ${l15Value}) / 2 = ${m15Value}`,
      formulaTechnical: 'AVERAGE($L$9, L15)',
      excelCell: 'M15',
      value: m15Value
    });
  } else {
    details.push({
      step: 'Nilai Akhir Indikator Semester I (M)',
      formulaHuman: `Nilai Semester I = ${m15Value}`,
      formulaTechnical: 'M = L9',
      excelCell: 'M9',
      value: m15Value,
      note: 'Belum ada data revisi untuk Semester II'
    });
  }

  details.push({
    step: 'Nilai Capped Masuk Dashboard (Interface G6)',
    formulaHuman: `MIN(100; M15) = MIN(100; ${m15Value}) = ${cappedValue}`,
    formulaTechnical: 'IF(M15>100, 100, M15)',
    excelCell: 'G6',
    value: cappedValue,
    note: 'Nilai indikator dibatasi maksimal 100 pada dashboard utama'
  });

  details.push({
    step: 'Nilai Berbobot (Interface G8)',
    formulaHuman: `ROUND(${cappedValue} × ${weight}% / 100; 2) = ${weightedValue}`,
    formulaTechnical: `ROUND(${cappedValue} * ${weight} / 100, 2)`,
    excelCell: 'G8',
    value: weightedValue
  });

  return {
    rawValue,
    cappedValue,
    weight,
    weightedValue,
    isActive,
    details,
    metadata: {
      rows: calculatedRows,
      sem1Count,
      sem2Count,
      sem1Indicator: l9Value,
      sem2Indicator: l15Value,
      m15: m15Value,
      finalScore: cappedValue
    }
  };
}

/**
 * Data Referensi Golden Test Resmi
 */
export const REVISI_DIPA_GOLDEN_INPUTS: Omit<RevisionDipaRow, 'diperhitungkan' | 'jumlahDiperhitungkan' | 'keterangan' | 'nilaiIndikator' | 'nilaiIKPA'>[] = [
  { no: 1, periode: "01", revisiKe: 1, tanggalRevisi: "2024-01-24", kodeJenisRevisi: "212", paguSebelum: 7535000000, paguMenjadi: 7535000000, empatBelasJenis: "ya" },
  { no: 2, periode: "02", revisiKe: 2, tanggalRevisi: "2024-02-19", kodeJenisRevisi: "315, 325", paguSebelum: 7535000000, paguMenjadi: 7535000000, empatBelasJenis: "tidak" },
  { no: 3, periode: "03", revisiKe: null, tanggalRevisi: null, kodeJenisRevisi: "", paguSebelum: null, paguMenjadi: null, empatBelasJenis: "-" },
  { no: 4, periode: "04", revisiKe: 3, tanggalRevisi: "2024-04-22", kodeJenisRevisi: "102, 221, 315", paguSebelum: 7535000000, paguMenjadi: 9876500000, empatBelasJenis: "ya" },
  { no: 5, periode: "05", revisiKe: null, tanggalRevisi: null, kodeJenisRevisi: "", paguSebelum: null, paguMenjadi: null, empatBelasJenis: "-" },
  { no: 6, periode: "06", revisiKe: null, tanggalRevisi: null, kodeJenisRevisi: "", paguSebelum: null, paguMenjadi: null, empatBelasJenis: "-" },
  { no: 7, periode: "07", revisiKe: 4, tanggalRevisi: "2024-07-12", kodeJenisRevisi: "221, 315", paguSebelum: 9876500000, paguMenjadi: 9876500000, empatBelasJenis: "ya" },
  { no: 8, periode: "08", revisiKe: 5, tanggalRevisi: "2024-08-08", kodeJenisRevisi: "226", paguSebelum: 9876500000, paguMenjadi: 9876500000, empatBelasJenis: "ya" },
  { no: 9, periode: "09", revisiKe: 6, tanggalRevisi: "2024-09-23", kodeJenisRevisi: "220", paguSebelum: 9876500000, paguMenjadi: 9876500000, empatBelasJenis: "ya" },
  { no: 10, periode: "10", revisiKe: 7, tanggalRevisi: "2024-10-11", kodeJenisRevisi: "238, 315", paguSebelum: 9876500000, paguMenjadi: 9989000000, empatBelasJenis: "tidak" },
  { no: 11, periode: "11", revisiKe: null, tanggalRevisi: null, kodeJenisRevisi: "", paguSebelum: null, paguMenjadi: null, empatBelasJenis: "-" },
  { no: 12, periode: "12", revisiKe: null, tanggalRevisi: null, kodeJenisRevisi: "", paguSebelum: null, paguMenjadi: null, empatBelasJenis: "-" },
];

export interface GoldenTestVerificationResult {
  passed: boolean;
  finalScore: number;
  expectedFinalScore: number;
  rowResults: {
    cellM: string;
    expectedM: number;
    actualM: number;
    passed: boolean;
  }[];
}

/**
 * Menjalankan Automated Golden Test untuk modul Revisi DIPA
 */
export function runRevisiDipaGoldenTest(): GoldenTestVerificationResult {
  const calculated = calculateSemesterIKPA(REVISI_DIPA_GOLDEN_INPUTS as any);
  const expectedM = [110, 110, 110, 110, 110, 110, 110, 105, 80, 80, 80, 80];

  const rowResults = calculated.map((row, idx) => {
    const cellM = `M${idx + 4}`;
    const exp = expectedM[idx];
    const act = row.nilaiIKPA;
    return {
      cellM,
      expectedM: exp,
      actualM: act,
      passed: Math.abs(exp - act) < 0.0001
    };
  });

  const finalScore = calculateFinalRevisionScore(calculated);
  const expectedFinalScore = 80;
  const allRowsPassed = rowResults.every(r => r.passed);
  const finalPassed = Math.abs(finalScore - expectedFinalScore) < 0.0001;

  return {
    passed: allRowsPassed && finalPassed,
    finalScore,
    expectedFinalScore,
    rowResults
  };
}
