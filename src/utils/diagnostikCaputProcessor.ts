import * as XLSX from 'xlsx';
import { DiagnostikCaputROItem, DiagnostikCaputResult, DiagnostikCaputSatkerSummary } from '../types';

/**
 * Clean & Parse numeric strings (handles Indonesian format like "1.250.000,50" or "0,01" or percentage strings "75,50%")
 */
export function parseCaputNumber(val: unknown): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  
  let str = String(val)
    .trim()
    .replace(/[\u00A0\u1680\u180e\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]/g, ' ') // strip non-breaking spaces
    .replace(/%/g, '')
    .replace(/Rp\.?/gi, '')
    .replace(/\s+/g, '');
    
  if (!str || str === '-' || str.toLowerCase() === 'nan' || str.includes('#N/A') || str.includes('DIV/0')) return 0;

  // Handle accounting negative format: (123.45) -> -123.45
  let isNegative = false;
  if (str.startsWith('(') && str.endsWith(')')) {
    isNegative = true;
    str = str.substring(1, str.length - 1);
  }

  // Handle Indonesian vs International decimal format:
  // "1.250.000,50" -> "1250000.50"
  if (str.includes(',') && str.includes('.')) {
    if (str.lastIndexOf(',') > str.lastIndexOf('.')) {
      // Indonesian: dots are thousand separators, comma is decimal
      str = str.replace(/\./g, '').replace(/,/g, '.');
    } else {
      // International: commas are thousand separators, dot is decimal
      str = str.replace(/,/g, '');
    }
  } else if (str.includes(',')) {
    // Only comma present: assume decimal comma "75,5" -> "75.5"
    str = str.replace(/,/g, '.');
  }

  const num = parseFloat(str);
  if (isNaN(num)) return 0;
  return isNegative ? -num : num;
}

/**
 * Format currency to Indonesian Rupiah (Rp)
 */
export function formatRupiahCaput(val: number): string {
  return 'Rp ' + Math.round(val).toLocaleString('id-ID');
}

/**
 * Standard Engine to Diagnose Single RO against Kemenkeu / SAKTI IKPA Rules (Kolom P, Q, X, Y, Z Logic)
 */
export function diagnoseRO(raw: {
  id?: string;
  kodeSatker: string;
  namaSatker: string;
  kodeProgram?: string;
  namaProgram?: string;
  kodeKegiatan?: string;
  namaKegiatan?: string;
  kodeKro?: string;
  namaKro?: string;
  kodeRo: string;
  namaRo: string;
  volumeTarget: number;       // Kolom X: Target Volume (TVRO)
  volumeRealisasi: number;    // Kolom P: Realisasi Volume (RVRO)
  targetProgres: number;      // Kolom Y: Target Progres (TPCRO)
  realisasiProgres: number;   // Kolom Q: Realisasi Progres (PCRO)
  paguAnggaran?: number;
  realisasiAnggaran?: number;
  persenPenyerapan?: number;
  polarisasi?: 'MAXIMIZE' | 'MINIMIZE' | 'RANGE';
  keteranganSakti?: string;
}): DiagnostikCaputROItem {
  const tpcro = Math.max(0, raw.targetProgres);   // Kolom Y
  const pcro = Math.max(0, raw.realisasiProgres); // Kolom Q
  const tvro = Math.max(0, raw.volumeTarget);     // Kolom X
  const rvro = Math.max(0, raw.volumeRealisasi);  // Kolom P
  
  const pagu = Math.max(0, raw.paguAnggaran || 0);
  const realisasi = Math.max(0, raw.realisasiAnggaran || 0);
  const persenSerap = pagu > 0 ? (realisasi / pagu) * 100 : (raw.persenPenyerapan || 0);

  // Perhitungan Nilai Komponen RO (Kolom Z / NKRO):
  // Aturan SAKTI & IKPA Kemenkeu:
  // Kolom Z nilainya idealnya 100 semua.
  // 1. Jika Kolom Y (TPCRO) = 0 dan Kolom Q (PCRO) = 0 -> SAKTI tidak membentuk progres -> Kolom Z = 0,00
  // 2. Jika Kolom Y (TPCRO) = 0 dan Kolom Q (PCRO) > 0 -> Kolom Z = 100,00
  // 3. Jika Kolom Y (TPCRO) > 0 -> Kolom Z = Math.min(100, (PCRO / TPCRO) * 100)
  let nilaiKomponen = 0;
  let isTpcRoZeroPcroZero = false;

  if (tpcro === 0 && pcro === 0) {
    nilaiKomponen = 0;
    isTpcRoZeroPcroZero = true;
  } else if (tpcro === 0 && pcro > 0) {
    nilaiKomponen = 100;
  } else {
    nilaiKomponen = Math.min(100, (pcro / tpcro) * 100);
  }

  const gapKinerja = tpcro - pcro;
  let severity: DiagnostikCaputROItem['diagnosaSeverity'] = 'OPTIMAL';
  let code: DiagnostikCaputROItem['diagnosaCode'] = 'OPTIMAL';
  let title = '✅ Kolom Z Optimal: Nilai Komponen RO = 100 (Target Terpenuhi)';
  let description = `Progres fisik Kolom Q (PCRO: ${pcro.toFixed(2)}%) telah memenuhi Kolom Y (Target: ${tpcro.toFixed(2)}%) dengan Nilai Komponen Kolom Z = ${nilaiKomponen.toFixed(2)}.`;
  const rekomendasi: string[] = [];
  let templateKeterangan = '';

  // KENDALA 3: Nilai pada Kolom Y (Target TPCRO) = 0 dan di Kolom Q (PCRO) juga 0 (harusnya > 0)
  if (isTpcRoZeroPcroZero) {
    severity = 'KRITIS';
    code = 'TPCRO_PCRO_ZERO';
    title = '🚨 Kritis: Kolom Y (Target TPCRO) = 0 & Kolom Q (PCRO) = 0 (Harusnya > 0) — Sistem SAKTI Tidak Membentuk Progres';
    description = 'Kondisi Kolom Y (Target TPCRO) = 0 dan Kolom Q (PCRO) = 0 menyebabkan sistem SAKTI TIDAK MEMBENTUK PROGRES sehingga Nilai Kolom Z menjadi 0,00 dan merusak capaian IKPA Satker.';
    rekomendasi.push(
      'Isi Kolom Q (PCRO) minimal 0,01 pada periode berjalan di Modul Komitmen SAKTI agar sistem membentuk progres perhitungan dan Nilai Kolom Z tidak nol.',
      'Lakukan pemutakhiran proyeksi target pada Kolom Y (Target TPCRO) pada periode pembukaan pemutakhiran berikutnya agar target realistis.',
      'Segera simpan data dan mintakan approval Pejabat Pembuat Komitmen (PPK) sebelum batas waktu cut-off.'
    );
    templateKeterangan = `[Permasalahan]: Progres fisik RO ${raw.kodeRo} dalam tahap persiapan teknis/administrasi awal (Kolom Y Target = 0 & Kolom Q Realisasi = 0). [Langkah Tindak Lanjut]: Telah diinput Kolom Q (PCRO) minimal 0,01 di SAKTI agar sistem membentuk progres perhitungan sesuai juknis DJPb. [Target Waktu]: Pelaksanaan kegiatan dan pemutakhiran target akan direalisasikan optimal pada periode berikutnya.`;
  }
  // KENDALA 1 (Paling Sering): Kolom Q (isian PCRO) di bawah nilai Kolom Y (Target TPCRO) -> Kolom Z tidak bisa 100
  else if (pcro < tpcro) {
    const isBigGap = gapKinerja > 20 || pcro === 0;
    severity = isBigGap ? 'KRITIS' : 'PERINGATAN';
    code = 'PCRO_BELOW_TPCRO';
    title = `🚨 Kolom Q (PCRO: ${pcro.toFixed(2)}%) di Bawah Kolom Y (Target TPCRO: ${tpcro.toFixed(2)}%) — Kolom Z = ${nilaiKomponen.toFixed(2)} (Tidak Bisa 100)`;
    description = `Realisasi Progres (Kolom Q) terisi ${pcro.toFixed(2)}%, di bawah Target Progres (Kolom Y) sebesar ${tpcro.toFixed(2)}% (Gap: -${gapKinerja.toFixed(2)}%). Ini kendala utama penyebab Nilai Kolom Z hanya ${nilaiKomponen.toFixed(2)} (tidak bisa mencapai 100).`;
    rekomendasi.push(
      `Akselerasi penyelesaian fisik dan perbarui Kolom Q (PCRO) di Modul Komitmen SAKTI agar minimal sama dengan Kolom Y (${tpcro.toFixed(2)}%) agar Nilai Kolom Z mencapai 100.`,
      'Wajib mengisi kolom Keterangan SAKTI mengenai kendala atau tahapan pekerjaan yang sedang berlangsung sebelum approval PPK.',
      'Jika target di Kolom Y terlalu tinggi akibat perubahan jadwal kerja, lakukan pemutakhiran proyeksi target pada kesempatan pemutakhiran berikutnya.'
    );
    templateKeterangan = `[Permasalahan]: Realisasi fisik RO ${raw.kodeRo} pada Kolom Q baru tercapai ${pcro.toFixed(2)}% dari target Kolom Y sebesar ${tpcro.toFixed(2)}% (deviasi ${gapKinerja.toFixed(1)}%) dikarenakan penyesuaian jadwal teknis. [Langkah Tindak Lanjut]: Percepatan tahapan kegiatan dan penyelesaian administrasi BAST sedang diakselerasi. [Target Waktu]: Target capaian 100% dipenuhi pada akhir triwulan berjalan.`;
  }
  // KENDALA 2: Progres PCRO pada Kolom Q = 100, AKAN TETAPI Kolom P (Realisasi Volume) < Kolom X (Target Volume)
  else if (pcro >= 100 && tvro > 0 && rvro < tvro) {
    severity = 'PERINGATAN';
    code = 'PCRO_100_RVRO_BELOW_TVRO';
    title = `⚠️ Kolom Q (PCRO) Sudah 100% namun Kolom P (Realisasi Volume: ${rvro}) < Kolom X (Target Volume: ${tvro})`;
    description = `Progres tahapan fisik pada Kolom Q sudah terisi 100%, akan tetapi Realisasi Volume pada Kolom P baru terisi ${rvro} dari Target Volume Kolom X (${tvro}). Perlu sinkronisasi agar volume fisik output tercatat tuntas 100%.`;
    rekomendasi.push(
      `Periksa kelengkapan Berita Acara Serah Terima (BAST) / laporan akhir pekerjaan fisik apakah target ${tvro} volume telah tuntas.`,
      `Inputkan jumlah Realisasi Volume (RVRO) pada Kolom P di Modul Komitmen SAKTI hingga bernilai ${tvro} jika seluruh keluaran output telah selesai.`,
      'Jika terdapat efisiensi atau perubahan target volume dari DIPA awal, cantumkan penjelasan perubahan volume pada kolom Keterangan SAKTI.'
    );
    templateKeterangan = `[Permasalahan]: Tahapan pelaksanaan fisik RO ${raw.kodeRo} telah tuntas 100% (Kolom Q = 100%), namun pencatatan Realisasi Volume Kolom P baru terisi ${rvro} dari target Kolom X (${tvro} vol) karena proses verifikasi administrasi BAST akhir. [Langkah Tindak Lanjut]: Sinkronisasi penginputan Kolom P (RVRO = ${tvro}) dilakukan di SAKTI. [Target Waktu]: Selesai pada periode berjalan.`;
  }
  // Kasus Tambahan: Realisasi Anggaran Belanja Tinggi tapi PCRO Jauh Tertinggal (Lagging Output)
  else if (persenSerap >= 30 && pcro < 10 && gapKinerja > 20) {
    severity = 'KRITIS';
    code = 'LAGGING_CAPUT';
    title = '🚨 Kritis: Realisasi Anggaran Tinggi namun Kolom Q (Fisik) Tertinggal Signifikan';
    description = `Penyerapan anggaran belanja telah mencapai ${persenSerap.toFixed(1)}% (${formatRupiahCaput(realisasi)}), namun Kolom Q (PCRO) baru terlaporkan ${pcro.toFixed(2)}% (Target Kolom Y: ${tpcro.toFixed(2)}%).`;
    rekomendasi.push(
      'Pastikan dokumen BAST / laporan kemajuan pekerjaan fisik terbaru telah direkam pada Modul Komitmen SAKTI.',
      `Sinkronkan persentase Kolom Q (PCRO) agar sejalan dengan serapan belanja yang sudah ${persenSerap.toFixed(1)}%.`,
      'Jika pembayaran merupakan uang muka kontrak, cantumkan narasi penjelasan uang muka pada kolom Keterangan SAKTI.'
    );
    templateKeterangan = `[Permasalahan]: Realisasi belanja RO ${raw.kodeRo} sebesar ${formatRupiahCaput(realisasi)} (${persenSerap.toFixed(1)}%) mencakup pembayaran termin/uang muka pengadaan. [Langkah Tindak Lanjut]: Pelaksanaan fisik sedang berlangsung dan BAST bertahap diproses. [Target Waktu]: Capaian PCRO dimutakhirkan penuh pada periode berjalan.`;
  }
  // Kasus Tambahan: Volume Realisasi (Kolom P) Ada tapi PCRO (Kolom Q) Nol/Sangat Rendah
  else if (rvro > 0 && pcro < 10) {
    severity = 'PERINGATAN';
    code = 'RVRO_ANOMALY';
    title = '⚠️ Anomali Kolom P & Q: Volume Realisasi (Kolom P) Terisi namun Progres (Kolom Q) Belum Sinkron';
    description = `Volume realisasi (Kolom P) telah terisi ${rvro} ${tvro > 0 ? `dari target ${tvro}` : 'output'}, namun Progres Capaian (Kolom Q) baru ${pcro.toFixed(2)}%.`;
    rekomendasi.push(
      'Perbarui nilai Kolom Q (PCRO) di SAKTI agar proporsional dengan volume output yang sudah selesai di Kolom P (RVRO).',
      'Pastikan validasi antara volume fisik dan persentase tahapan pekerjaan telah sinkron.'
    );
    templateKeterangan = `[Permasalahan]: Telah diserahterimakan volume realisasi fisik sebanyak ${rvro} output pada RO ${raw.kodeRo}. [Langkah Tindak Lanjut]: Persentase Kolom Q (PCRO) disesuaikan sejalan dengan penyelesaian BAST pekerjaan. [Target Waktu]: Sinkronisasi data tuntas pada periode berjalan.`;
  }
  // Default Optimal (Kolom Z = 100)
  else {
    severity = 'OPTIMAL';
    code = 'OPTIMAL';
    title = '✅ Kolom Z Optimal: Nilai Komponen RO = 100,00';
    description = `Progres fisik Kolom Q (PCRO: ${pcro.toFixed(2)}%) telah memenuhi Kolom Y (Target: ${tpcro.toFixed(2)}%) dengan Nilai Komponen Kolom Z = 100,00.`;
    rekomendasi.push('Pertahankan ketertiban pengisian dan approval PPK tepat waktu setiap periode pelaporan.');
    templateKeterangan = `Kegiatan RO ${raw.kodeRo} terlaksana optimal dan memenuhi target yang ditetapkan (Kolom Z = 100,00). Dokumen pendukung BAST lengkap.`;
  }

  const potensiKenaikan = Math.max(0, 100 - nilaiKomponen);

  return {
    id: raw.id || `RO-${raw.kodeRo}-${Math.random().toString(36).substring(2, 7)}`,
    kodeSatker: raw.kodeSatker,
    namaSatker: raw.namaSatker,
    kodeProgram: raw.kodeProgram,
    namaProgram: raw.namaProgram,
    kodeKegiatan: raw.kodeKegiatan,
    namaKegiatan: raw.namaKegiatan,
    kodeKro: raw.kodeKro,
    namaKro: raw.namaKro,
    kodeRo: raw.kodeRo,
    namaRo: raw.namaRo,
    volumeTarget: tvro,         // Kolom X
    volumeRealisasi: rvro,      // Kolom P
    targetProgres: tpcro,       // Kolom Y
    realisasiProgres: pcro,     // Kolom Q
    paguAnggaran: pagu,
    realisasiAnggaran: realisasi,
    persenPenyerapan: persenSerap,
    polarisasi: raw.polarisasi || 'MAXIMIZE',
    keteranganSakti: raw.keteranganSakti || '',
    diagnosaSeverity: severity,
    diagnosaCode: code,
    diagnosaTitle: title,
    diagnosaDescription: description,
    rekomendasiTindakan: rekomendasi,
    templateKeteranganSakti: templateKeterangan,
    gapKinerja,
    nilaiKomponenRo: nilaiKomponen, // Kolom Z
    potensiKenaikanSkor: potensiKenaikan
  };
}

/**
 * Intelligent Multi-Format Excel Cleaner & Parser (MyIntress / MonSAKTI / OMSPAN / Caput156)
 */
export async function parseMyIntressCaputExcel(file: File): Promise<DiagnostikCaputResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  if (!sheet) {
    throw new Error('File Excel tidak memiliki lembar kerja (worksheet) yang valid.');
  }

  // Convert to 2D array of strings/values for flexible header detection
  const matrix: (string | number | undefined)[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: '',
    raw: false
  });

  if (!matrix || matrix.length === 0) {
    throw new Error('File Excel kosong atau tidak memiliki baris data.');
  }

  // Extract Top-Level Metadata from rows 0-15 (e.g. Satker info, Bulan, Tahun)
  let extractedKodeSatker = '';
  let extractedNamaSatker = '';
  let extractedPeriode = 'Agustus 2026';

  for (let r = 0; r < Math.min(15, matrix.length); r++) {
    const rowStr = (matrix[r] || []).join(' ').trim();
    if (!rowStr) continue;

    // Detect Satker: e.g. "Satker: 651046 - KEMENAG KOLAKA" or "Kode Satker : 651046"
    const satkerMatch = rowStr.match(/satker\s*[:=]?\s*([0-9]{6})\s*[-–]?\s*([^,\n\r]+)?/i) ||
                        rowStr.match(/kode\s*satker\s*[:=]?\s*([0-9]{6})/i);
    if (satkerMatch) {
      if (satkerMatch[1] && !extractedKodeSatker) extractedKodeSatker = satkerMatch[1];
      if (satkerMatch[2] && !extractedNamaSatker) extractedNamaSatker = satkerMatch[2].trim();
    }

    // Detect Periode / Bulan: e.g. "Periode : Agustus 2026" or "Bulan : Agustus"
    const periodeMatch = rowStr.match(/(?:periode|bulan|cut\s*off)\s*[:=]?\s*([A-Za-z0-9\s]+)/i);
    if (periodeMatch && periodeMatch[1] && periodeMatch[1].length < 30) {
      extractedPeriode = periodeMatch[1].trim();
    }
  }

  // Keywords to find the actual table header row
  const headerKeywords = [
    'satker', 'kdsatker', 'kodesatker',
    'kro', 'ro', 'kodero', 'rincianoutput', 'namaro', 'uraianro',
    'tvro', 'rvro', 'tpcro', 'pcro', 'target', 'realisasi', 'progres', 'progress',
    'pagu', 'anggaran', 'keterangan'
  ];

  let headerRowIndex = -1;
  let maxKeywordMatches = 0;

  for (let r = 0; r < Math.min(25, matrix.length); r++) {
    const row = matrix[r] || [];
    let matches = 0;
    for (const cell of row) {
      const cellStr = String(cell || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      if (headerKeywords.some(kw => cellStr.includes(kw))) {
        matches++;
      }
    }
    if (matches > maxKeywordMatches) {
      maxKeywordMatches = matches;
      headerRowIndex = r;
    }
  }

  if (headerRowIndex === -1 || maxKeywordMatches < 2) {
    // Fallback to row 0 if no clear header was detected
    headerRowIndex = 0;
  }

  // Build Normalized Column Map
  const headerRow = matrix[headerRowIndex] || [];
  const prevHeaderRow = headerRowIndex > 0 ? matrix[headerRowIndex - 1] || [] : [];
  const columnHeaders: string[] = [];

  for (let c = 0; c < headerRow.length; c++) {
    const currCell = String(headerRow[c] || '').trim();
    const prevCell = String(prevHeaderRow[c] || '').trim();
    
    // Combine 2-row headers if applicable (e.g. Row 1: "TARGET", Row 2: "PROGRES (%)" -> "TARGET PROGRES (%)")
    let combined = currCell;
    if (prevCell && prevCell !== currCell && !currCell.toLowerCase().includes(prevCell.toLowerCase())) {
      combined = `${prevCell} ${currCell}`;
    }
    columnHeaders.push(combined);
  }

  // Helper matcher for column indices
  const findColIndex = (patterns: string[]): number => {
    for (let c = 0; c < columnHeaders.length; c++) {
      const cleanHeader = columnHeaders[c].toLowerCase().replace(/[^a-z0-9]/g, '');
      if (patterns.some(p => cleanHeader.includes(p.toLowerCase().replace(/[^a-z0-9]/g, '')))) {
        return c;
      }
    }
    return -1;
  };

  const colKodeSatker = findColIndex(['kodesatker', 'kdsatker', 'satker', 'kode_satker', 'kdkantor']);
  const colNamaSatker = findColIndex(['namasatker', 'nmsatker', 'satker_nama', 'nama_satker', 'nmkantor', 'uraiansatker']);
  const colProgram = findColIndex(['kodeprogram', 'kdprogram', 'program']);
  const colNamaProgram = findColIndex(['namaprogram', 'nmprogram', 'uraianprogram']);
  const colKegiatan = findColIndex(['kodekegiatan', 'kdkegiatan', 'kegiatan']);
  const colNamaKegiatan = findColIndex(['namakegiatan', 'nmkegiatan', 'uraiankegiatan']);
  const colKro = findColIndex(['kodekro', 'kdkro', 'kro', 'klasifikasirincianoutput']);
  const colNamaKro = findColIndex(['namakro', 'nmkro', 'uraiankro']);
  const colKodeRo = findColIndex(['kodero', 'kdro', 'rincianoutput', 'koderincianoutput', 'output', 'kategorioutput']);
  const colNamaRo = findColIndex(['namaro', 'nmro', 'uraianro', 'nama_ro', 'uraian_ro', 'namarincianoutput', 'uraianrincianoutput', 'deskripsiro']);
  
  const colTvro = findColIndex(['targetvolume', 'tvro', 'volumetarget', 'target_volume', 'voltarget', 'trvro', 't_rvro']);
  const colRvro = findColIndex(['realisasivolume', 'rvro', 'volumerealisasi', 'realisasi_volume', 'volrealisasi', 'realisasirvro']);
  const colTpcro = findColIndex(['targetprogres', 'tpcro', 'targetpcro', 't_pcro', 'targetprogress', 'progrestarget', 'progresstarget', 'progreskemenkeu']);
  const colPcro = findColIndex(['realisasiprogres', 'pcro', 'realisasipcro', 'progressrealisasi', 'progresrealisasi', 'progrescapaian', 'progresfisik', 'capaianoutput']);
  
  const colPagu = findColIndex(['paguanggaran', 'pagudipa', 'pagu', 'alokasi', 'pagu_dipa', 'anggaran']);
  const colRealisasi = findColIndex(['realisasianggaran', 'realisasibelanja', 'realisasispan', 'realisasi', 'penyerapan', 'realisasi_anggaran']);
  const colKet = findColIndex(['keterangansakti', 'keterangan', 'alasandeviasi', 'penjelasan', 'kendala', 'alasan', 'catatan']);

  const items: DiagnostikCaputROItem[] = [];
  const satkerMap: Record<string, { kodeSatker: string; namaSatker: string; items: DiagnostikCaputROItem[] }> = {};

  // Parse Rows starting after the header
  for (let r = headerRowIndex + 1; r < matrix.length; r++) {
    const row = matrix[r] || [];
    if (!row || row.length === 0) continue;

    const rawKodeRo = String(colKodeRo >= 0 ? row[colKodeRo] : '').trim();
    const rawNamaRo = String(colNamaRo >= 0 ? row[colNamaRo] : '').trim();

    // Skip empty lines or summary rows
    if (!rawKodeRo && !rawNamaRo) continue;
    const testSummary = `${rawKodeRo} ${rawNamaRo}`.toLowerCase();
    if (
      testSummary.includes('total') ||
      testSummary.includes('jumlah') ||
      testSummary.includes('sub total') ||
      testSummary.includes('subtotal') ||
      testSummary.includes('rata-rata') ||
      testSummary.includes('grand total') ||
      testSummary.startsWith('halaman')
    ) {
      continue;
    }

    // Extract Satker info
    let rowKodeSatker = String(colKodeSatker >= 0 ? row[colKodeSatker] : '').trim();
    let rowNamaSatker = String(colNamaSatker >= 0 ? row[colNamaSatker] : '').trim();

    // Normalize 6-digit satker code if combined
    if (rowKodeSatker && rowKodeSatker.length > 6) {
      const matchSix = rowKodeSatker.match(/\b([0-9]{6})\b/);
      if (matchSix) rowKodeSatker = matchSix[1];
    }

    if (rowKodeSatker && !extractedKodeSatker) extractedKodeSatker = rowKodeSatker;
    if (rowNamaSatker && !extractedNamaSatker) extractedNamaSatker = rowNamaSatker;

    const finalSatkerKode = rowKodeSatker || extractedKodeSatker || '651046';
    const finalSatkerNama = rowNamaSatker || extractedNamaSatker || 'Satuan Kerja Lingkup KPPN';

    // Parse Program/Kegiatan/KRO/RO compound logic (e.g. 2129.EBA.994)
    let kodeProgram = String(colProgram >= 0 ? row[colProgram] : '').trim();
    let namaProgram = String(colNamaProgram >= 0 ? row[colNamaProgram] : '').trim();
    let kodeKegiatan = String(colKegiatan >= 0 ? row[colKegiatan] : '').trim();
    let namaKegiatan = String(colNamaKegiatan >= 0 ? row[colNamaKegiatan] : '').trim();
    let kodeKro = String(colKro >= 0 ? row[colKro] : '').trim();
    let namaKro = String(colNamaKro >= 0 ? row[colNamaKro] : '').trim();
    let kodeRo = rawKodeRo;
    let namaRo = rawNamaRo;

    // If kodeRo is compound like "2129.EBA.994" or "025.01.WA.2129.EBA.994"
    if (kodeRo.includes('.')) {
      const parts = kodeRo.split('.');
      if (parts.length >= 3) {
        if (!kodeKegiatan) kodeKegiatan = parts[parts.length - 3];
        if (!kodeKro) kodeKro = `${parts[parts.length - 3]}.${parts[parts.length - 2]}`;
      }
    }

    // Column fallback: Kolom X (idx 23: TVRO), Kolom P (idx 15: RVRO), Kolom Y (idx 24: TPCRO), Kolom Q (idx 16: PCRO)
    const tvro = parseCaputNumber(colTvro >= 0 ? row[colTvro] : (row.length > 23 ? row[23] : 0));
    const rvro = parseCaputNumber(colRvro >= 0 ? row[colRvro] : (row.length > 15 ? row[15] : 0));
    const tpcro = parseCaputNumber(colTpcro >= 0 ? row[colTpcro] : (row.length > 24 ? row[24] : 0));
    const pcro = parseCaputNumber(colPcro >= 0 ? row[colPcro] : (row.length > 16 ? row[16] : 0));
    const pagu = parseCaputNumber(colPagu >= 0 ? row[colPagu] : 0);
    const realisasi = parseCaputNumber(colRealisasi >= 0 ? row[colRealisasi] : 0);
    const ket = String(colKet >= 0 ? row[colKet] : '').trim();

    const diagnosed = diagnoseRO({
      id: `EXCEL-RO-${items.length + 1}`,
      kodeSatker: finalSatkerKode,
      namaSatker: finalSatkerNama,
      kodeProgram,
      namaProgram,
      kodeKegiatan,
      namaKegiatan,
      kodeKro,
      namaKro,
      kodeRo: kodeRo || `RO-${items.length + 1}`,
      namaRo: namaRo || `Rincian Output ${kodeRo || items.length + 1}`,
      volumeTarget: tvro,
      volumeRealisasi: rvro,
      targetProgres: tpcro,
      realisasiProgres: pcro,
      paguAnggaran: pagu,
      realisasiAnggaran: realisasi,
      keteranganSakti: ket
    });

    items.push(diagnosed);

    // Group by Satker for breakdown
    if (!satkerMap[finalSatkerKode]) {
      satkerMap[finalSatkerKode] = {
        kodeSatker: finalSatkerKode,
        namaSatker: finalSatkerNama,
        items: []
      };
    }
    satkerMap[finalSatkerKode].items.push(diagnosed);
  }

  if (items.length === 0) {
    throw new Error('Tidak ditemukan data Rincian Output (RO) yang valid pada file Excel tersebut. Pastikan format kolom Target/Realisasi Progres sesuai format MyIntress/SAKTI.');
  }

  // Calculate Overall Aggregates
  const totalRo = items.length;
  const roKritisCount = items.filter(it => it.diagnosaSeverity === 'KRITIS').length;
  const roPeringatanCount = items.filter(it => it.diagnosaSeverity === 'PERINGATAN').length;
  const roOptimalCount = items.filter(it => it.diagnosaSeverity === 'OPTIMAL').length;

  const sumKomponen = items.reduce((acc, it) => acc + it.nilaiKomponenRo, 0);
  const currentScoreCaput = totalRo > 0 ? Number((sumKomponen / totalRo).toFixed(2)) : 0;

  const sumProjected = items.reduce((acc, it) => {
    if (it.diagnosaSeverity === 'KRITIS' || it.diagnosaSeverity === 'PERINGATAN') {
      return acc + 100;
    }
    return acc + it.nilaiKomponenRo;
  }, 0);
  const projectedScoreCaput = totalRo > 0 ? Number((sumProjected / totalRo).toFixed(2)) : 100;

  const totalPagu = items.reduce((acc, it) => acc + (it.paguAnggaran || 0), 0);
  const totalRealisasi = items.reduce((acc, it) => acc + (it.realisasiAnggaran || 0), 0);
  const persenPenyerapanTotal = totalPagu > 0 ? Number(((totalRealisasi / totalPagu) * 100).toFixed(2)) : 0;

  const avgPCRO = Number((items.reduce((acc, it) => acc + it.realisasiProgres, 0) / totalRo).toFixed(2));
  const avgTPCRO = Number((items.reduce((acc, it) => acc + it.targetProgres, 0) / totalRo).toFixed(2));

  // Build Satker Breakdown Matrix
  const satkerBreakdown: DiagnostikCaputSatkerSummary[] = Object.values(satkerMap).map(s => {
    const sTotal = s.items.length;
    const sKritis = s.items.filter(it => it.diagnosaSeverity === 'KRITIS').length;
    const sPeringatan = s.items.filter(it => it.diagnosaSeverity === 'PERINGATAN').length;
    const sOptimal = s.items.filter(it => it.diagnosaSeverity === 'OPTIMAL').length;
    const sSumKomp = s.items.reduce((acc, it) => acc + it.nilaiKomponenRo, 0);
    const sCurrentScore = sTotal > 0 ? Number((sSumKomp / sTotal).toFixed(2)) : 0;

    const sSumProj = s.items.reduce((acc, it) => {
      if (it.diagnosaSeverity === 'KRITIS' || it.diagnosaSeverity === 'PERINGATAN') {
        return acc + 100;
      }
      return acc + it.nilaiKomponenRo;
    }, 0);
    const sProjectedScore = sTotal > 0 ? Number((sSumProj / sTotal).toFixed(2)) : 100;

    const sPagu = s.items.reduce((acc, it) => acc + (it.paguAnggaran || 0), 0);
    const sReal = s.items.reduce((acc, it) => acc + (it.realisasiAnggaran || 0), 0);
    const sPersenSerap = sPagu > 0 ? Number(((sReal / sPagu) * 100).toFixed(2)) : 0;
    const sAvgPcro = Number((s.items.reduce((acc, it) => acc + it.realisasiProgres, 0) / sTotal).toFixed(2));
    const sAvgTpcro = Number((s.items.reduce((acc, it) => acc + it.targetProgres, 0) / sTotal).toFixed(2));

    return {
      kodeSatker: s.kodeSatker,
      namaSatker: s.namaSatker,
      totalRo: sTotal,
      roKritisCount: sKritis,
      roPeringatanCount: sPeringatan,
      roOptimalCount: sOptimal,
      currentScoreCaput: sCurrentScore,
      projectedScoreCaput: sProjectedScore,
      avgPCRO: sAvgPcro,
      avgTPCRO: sAvgTpcro,
      totalPagu: sPagu,
      totalRealisasi: sReal,
      persenPenyerapan: sPersenSerap
    };
  });

  return {
    summary: {
      totalRo,
      roKritisCount,
      roPeringatanCount,
      roOptimalCount,
      currentScoreCaput,
      projectedScoreCaput,
      persenKetercapaianTarget: avgTPCRO > 0 ? Number(Math.min(100, (avgPCRO / avgTPCRO) * 100).toFixed(2)) : 100,
      avgPCRO,
      avgTPCRO,
      totalPagu,
      totalRealisasi,
      persenPenyerapanTotal,
      kodeSatker: extractedKodeSatker || (satkerBreakdown.length === 1 ? satkerBreakdown[0].kodeSatker : 'WILAYAH-156'),
      namaSatker: extractedNamaSatker || (satkerBreakdown.length === 1 ? satkerBreakdown[0].namaSatker : 'Seluruh Satuan Kerja Lingkup KPPN Kolaka'),
      periode: extractedPeriode
    },
    satkerBreakdown,
    items,
    uploadedFileName: file.name,
    analyzedAt: new Date().toISOString()
  };
}

/**
 * Export Cleaned & Diagnosed Data to multi-sheet Excel file (.xlsx)
 */
export function exportDiagnostikCaputToExcel(data: DiagnostikCaputResult, fileNamePrefix = 'Analisis_SI_CAPUT_Kolaka'): void {
  const wb = XLSX.utils.book_new();

  // 1. Sheet 1: Analisis & Diagnostik RO (Cleaned & Diagnosed)
  const sheet1Data = data.items.map((it, idx) => ({
    'No': idx + 1,
    'Kode Satker': it.kodeSatker,
    'Nama Satker': it.namaSatker,
    'Kode Kegiatan': it.kodeKegiatan || '',
    'Kode KRO': it.kodeKro || '',
    'Kode RO': it.kodeRo,
    'Nama Rincian Output (RO)': it.namaRo,
    'Target Vol (TVRO)': it.volumeTarget,
    'Realisasi Vol (RVRO)': it.volumeRealisasi,
    'Target Progres (TPCRO) %': it.targetProgres,
    'Realisasi Progres (PCRO) %': it.realisasiProgres,
    'Deviasi / Gap Kinerja (%)': Number(it.gapKinerja.toFixed(2)),
    'Nilai Komponen RO (NKRO)': Number(it.nilaiKomponenRo.toFixed(2)),
    'Pagu Anggaran (Rp)': it.paguAnggaran || 0,
    'Realisasi Belanja (Rp)': it.realisasiAnggaran || 0,
    '% Penyerapan Anggaran': Number((it.persenPenyerapan || 0).toFixed(2)),
    'Status Diagnosa': it.diagnosaSeverity,
    'Kode Diagnosa': it.diagnosaCode,
    'Judul Diagnosa & Masalah': it.diagnosaTitle,
    'Uraian Masalah': it.diagnosaDescription,
    'Rekomendasi Tindakan Teknis': it.rekomendasiTindakan.join(' | '),
    'Template Keterangan SAKTI (Siap Salin)': it.templateKeteranganSakti
  }));
  const ws1 = XLSX.utils.json_to_sheet(sheet1Data);
  XLSX.utils.book_append_sheet(wb, ws1, '1. Diagnosa RO');

  // 2. Sheet 2: Rekapitulasi per Satker
  const satkers = data.satkerBreakdown || [{
    kodeSatker: data.summary.kodeSatker,
    namaSatker: data.summary.namaSatker,
    totalRo: data.summary.totalRo,
    roKritisCount: data.summary.roKritisCount,
    roPeringatanCount: data.summary.roPeringatanCount,
    roOptimalCount: data.summary.roOptimalCount,
    currentScoreCaput: data.summary.currentScoreCaput,
    projectedScoreCaput: data.summary.projectedScoreCaput,
    avgPCRO: data.summary.avgPCRO,
    avgTPCRO: data.summary.avgTPCRO,
    totalPagu: data.summary.totalPagu,
    totalRealisasi: data.summary.totalRealisasi,
    persenPenyerapan: data.summary.persenPenyerapanTotal
  }];

  const sheet2Data = satkers.map((s, idx) => ({
    'No': idx + 1,
    'Kode Satker': s.kodeSatker,
    'Nama Satker': s.namaSatker,
    'Total RO': s.totalRo,
    'RO Kritis (TPCRO=0 & PCRO=0)': s.roKritisCount,
    'RO Peringatan (Deviasi >20%)': s.roPeringatanCount,
    'RO Optimal': s.roOptimalCount,
    'Rata-rata PCRO (%)': s.avgPCRO,
    'Rata-rata TPCRO (%)': s.avgTPCRO,
    'Pagu DIPA (Rp)': s.totalPagu,
    'Realisasi Belanja (Rp)': s.totalRealisasi,
    '% Penyerapan Belanja': s.persenPenyerapan,
    'Skor IKPA Caput Saat Ini': s.currentScoreCaput,
    'Potensi Skor Setelah Perbaikan': s.projectedScoreCaput
  }));
  const ws2 = XLSX.utils.json_to_sheet(sheet2Data);
  XLSX.utils.book_append_sheet(wb, ws2, '2. Rekap Satker');

  // 3. Sheet 3: Template Keterangan SAKTI (Khusus RO yang Perlu Perbaikan)
  const problematicItems = data.items.filter(it => it.diagnosaSeverity !== 'OPTIMAL');
  const sheet3Data = (problematicItems.length > 0 ? problematicItems : data.items).map((it, idx) => ({
    'No': idx + 1,
    'Kode Satker': it.kodeSatker,
    'Kode RO': it.kodeRo,
    'Nama Rincian Output': it.namaRo,
    'Status Diagnosa': it.diagnosaSeverity,
    'TPCRO (%)': it.targetProgres,
    'PCRO (%)': it.realisasiProgres,
    'Template Keterangan SAKTI (Format DJPb)': it.templateKeteranganSakti
  }));
  const ws3 = XLSX.utils.json_to_sheet(sheet3Data);
  XLSX.utils.book_append_sheet(wb, ws3, '3. Template SAKTI');

  // Write file & trigger browser download
  const timestamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `${fileNamePrefix}_${data.summary.kodeSatker}_${timestamp}.xlsx`);
}

/**
 * Built-in Realistic Demonstration Data (Kemenkeu KPPN Kolaka 156 Cases)
 */
export function getDemoDiagnostikCaputData(): DiagnostikCaputResult {
  const rawList = [
    {
      kodeSatker: '651046',
      namaSatker: 'KANTOR KEMENTERIAN AGAMA KAB. KOLAKA',
      kodeProgram: '025.01.WA',
      namaProgram: 'Program Dukungan Manajemen',
      kodeKegiatan: '2129',
      namaKegiatan: 'Penyelenggaraan Bimas Islam',
      kodeKro: '2129.EBA',
      namaKro: 'Layanan Pembinaan & Bimbingan Masyarakat',
      kodeRo: '2129.EBA.994',
      namaRo: 'Layanan Perkantoran dan Operasional Bimas Islam',
      volumeTarget: 1,
      volumeRealisasi: 0,
      targetProgres: 0,
      realisasiProgres: 0,
      paguAnggaran: 1250000000,
      realisasiAnggaran: 350000000,
      keteranganSakti: ''
    },
    {
      kodeSatker: '651046',
      namaSatker: 'KANTOR KEMENTERIAN AGAMA KAB. KOLAKA',
      kodeProgram: '025.01.WA',
      namaProgram: 'Program Dukungan Manajemen',
      kodeKegiatan: '2130',
      namaKegiatan: 'Peningkatan Kualitas Pendidikan Madrasah',
      kodeKro: '2130.QDB',
      namaKro: 'Bantuan Sarana & Prasarana Madrasah',
      kodeRo: '2130.QDB.001',
      namaRo: 'Rehabilitasi Ruang Kelas Madrasah Aliyah',
      volumeTarget: 4,
      volumeRealisasi: 0,
      targetProgres: 75.0,
      realisasiProgres: 5.0,
      paguAnggaran: 850000000,
      realisasiAnggaran: 425000000,
      keteranganSakti: ''
    },
    {
      kodeSatker: '651046',
      namaSatker: 'KANTOR KEMENTERIAN AGAMA KAB. KOLAKA',
      kodeProgram: '025.01.WA',
      namaProgram: 'Program Dukungan Manajemen',
      kodeKegiatan: '2132',
      namaKegiatan: 'Penyelenggaraan Haji dan Umrah',
      kodeKro: '2132.EBA',
      namaKro: 'Layanan Bimbingan Manasik Haji',
      kodeRo: '2132.EBA.005',
      namaRo: 'Pelaksanaan Bimbingan Manasik Haji Reguler Kecamatan',
      volumeTarget: 12,
      volumeRealisasi: 8,
      targetProgres: 70.0,
      realisasiProgres: 45.0,
      paguAnggaran: 320000000,
      realisasiAnggaran: 190000000,
      keteranganSakti: 'Kegiatan manasik sedang berlangsung'
    },
    {
      kodeSatker: '651046',
      namaSatker: 'KANTOR KEMENTERIAN AGAMA KAB. KOLAKA',
      kodeProgram: '025.01.WA',
      namaProgram: 'Program Dukungan Manajemen',
      kodeKegiatan: '2135',
      namaKegiatan: 'Pelayanan Administrasi Kepegawaian & Keuangan',
      kodeKro: '2135.EBA',
      namaKro: 'Layanan Perkantoran',
      kodeRo: '2135.EBA.994',
      namaRo: 'Gaji dan Tunjangan ASN Kemenag Kolaka',
      volumeTarget: 12,
      volumeRealisasi: 8,
      targetProgres: 66.67,
      realisasiProgres: 66.67,
      paguAnggaran: 4500000000,
      realisasiAnggaran: 3000000000,
      keteranganSakti: 'Realisasi gaji dan tunjangan lancar sampai periode Agustus 2026.'
    },
    {
      kodeSatker: '651046',
      namaSatker: 'KANTOR KEMENTERIAN AGAMA KAB. KOLAKA',
      kodeProgram: '025.01.WA',
      namaProgram: 'Program Dukungan Manajemen',
      kodeKegiatan: '2138',
      namaKegiatan: 'Pengembangan Kerukunan Umat Beragama',
      kodeKro: '2138.QDC',
      namaKro: 'Forum Dialog Kerukunan',
      kodeRo: '2138.QDC.002',
      namaRo: 'Sosialisasi Moderasi Beragama Pelajar & Pemuda',
      volumeTarget: 3,
      volumeRealisasi: 3,
      targetProgres: 100.0,
      realisasiProgres: 100.0,
      paguAnggaran: 180000000,
      realisasiAnggaran: 175000000,
      keteranganSakti: 'Seluruh paket sosialisasi telah selesai 100% dengan BAST lengkap.'
    },
    {
      kodeSatker: '418721',
      namaSatker: 'KANTOR PERTANAHAN KAB. KOLAKA',
      kodeProgram: '056.01.WA',
      namaProgram: 'Pengelolaan Pertanahan dan Tata Ruang',
      kodeKegiatan: '3410',
      namaKegiatan: 'Pendaftaran Tanah Sistematis Lengkap (PTSL)',
      kodeKro: '3410.RAE',
      namaKro: 'Sertifikasi Hak Atas Tanah Masyarakat',
      kodeRo: '3410.RAE.001',
      namaRo: 'Penerbitan Sertipikat Tanah Program PTSL Kolaka',
      volumeTarget: 1500,
      volumeRealisasi: 1200,
      targetProgres: 80.0,
      realisasiProgres: 80.0,
      paguAnggaran: 1800000000,
      realisasiAnggaran: 1440000000,
      keteranganSakti: 'Realisasi fisik PTSL telah mencapai 80% pengukuran bidang tanah.'
    }
  ];

  const items = rawList.map((r, idx) => diagnoseRO({ ...r, id: `DEMO-RO-${idx + 1}` }));
  const totalRo = items.length;
  const roKritisCount = items.filter(it => it.diagnosaSeverity === 'KRITIS').length;
  const roPeringatanCount = items.filter(it => it.diagnosaSeverity === 'PERINGATAN').length;
  const roOptimalCount = items.filter(it => it.diagnosaSeverity === 'OPTIMAL').length;

  const sumKomponen = items.reduce((acc, it) => acc + it.nilaiKomponenRo, 0);
  const currentScoreCaput = Number((sumKomponen / totalRo).toFixed(2));

  const sumProjected = items.reduce((acc, it) => {
    if (it.diagnosaSeverity === 'KRITIS' || it.diagnosaSeverity === 'PERINGATAN') {
      return acc + 100;
    }
    return acc + it.nilaiKomponenRo;
  }, 0);
  const projectedScoreCaput = Number((sumProjected / totalRo).toFixed(2));

  const totalPagu = items.reduce((acc, it) => acc + (it.paguAnggaran || 0), 0);
  const totalRealisasi = items.reduce((acc, it) => acc + (it.realisasiAnggaran || 0), 0);
  const persenPenyerapanTotal = Number(((totalRealisasi / totalPagu) * 100).toFixed(2));

  const avgPCRO = Number((items.reduce((acc, it) => acc + it.realisasiProgres, 0) / totalRo).toFixed(2));
  const avgTPCRO = Number((items.reduce((acc, it) => acc + it.targetProgres, 0) / totalRo).toFixed(2));

  const satkerBreakdown: DiagnostikCaputSatkerSummary[] = [
    {
      kodeSatker: '651046',
      namaSatker: 'KANTOR KEMENTERIAN AGAMA KAB. KOLAKA',
      totalRo: 5,
      roKritisCount: 2,
      roPeringatanCount: 1,
      roOptimalCount: 2,
      currentScoreCaput: 68.33,
      projectedScoreCaput: 100.0,
      avgPCRO: 43.33,
      avgTPCRO: 62.33,
      totalPagu: 7100000000,
      totalRealisasi: 4115000000,
      persenPenyerapan: 57.96
    },
    {
      kodeSatker: '418721',
      namaSatker: 'KANTOR PERTANAHAN KAB. KOLAKA',
      totalRo: 1,
      roKritisCount: 0,
      roPeringatanCount: 0,
      roOptimalCount: 1,
      currentScoreCaput: 100.0,
      projectedScoreCaput: 100.0,
      avgPCRO: 80.0,
      avgTPCRO: 80.0,
      totalPagu: 1800000000,
      totalRealisasi: 1440000000,
      persenPenyerapan: 80.0
    }
  ];

  return {
    summary: {
      totalRo,
      roKritisCount,
      roPeringatanCount,
      roOptimalCount,
      currentScoreCaput,
      projectedScoreCaput,
      persenKetercapaianTarget: Number(((avgPCRO / avgTPCRO) * 100).toFixed(2)),
      avgPCRO,
      avgTPCRO,
      totalPagu,
      totalRealisasi,
      persenPenyerapanTotal,
      kodeSatker: '651046',
      namaSatker: 'KANTOR KEMENTERIAN AGAMA KAB. KOLAKA',
      periode: 'Agustus 2026'
    },
    satkerBreakdown,
    items,
    uploadedFileName: 'Data_Capaian_Output_Detail_Agustus2026.xlsx',
    analyzedAt: new Date().toISOString()
  };
}
