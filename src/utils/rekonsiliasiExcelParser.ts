import * as XLSX from 'xlsx';
import {
  MonitoringRekonsiliasiRecord,
  MonitoringRekonsiliasiUploadBatch,
  RekonsiliasiBatchSummary,
  RekonsiliasiStatusType,
  TodolistStatusType,
  TutupPeriodeStatusType,
  Sp2sStatusType,
  Sp3sStatusType,
  PrioritasKategoriType
} from '../types';

export interface ParseRekonsiliasiResult {
  batch: MonitoringRekonsiliasiUploadBatch;
  records: MonitoringRekonsiliasiRecord[];
  errors: { row: number; column: string; value: any; message: string }[];
  warnings: string[];
}

/**
 * Format string periode (YYYY-MM) menjadi teks tampilan (e.g. "2026-09" -> "September 2026")
 */
export function formatPeriodeRekonsiliasi(periode: string): string {
  if (!periode) return '-';
  const parts = periode.trim().split('-');
  if (parts.length === 2) {
    const year = parts[0];
    const monthNum = parseInt(parts[1], 10);
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    if (monthNum >= 1 && monthNum <= 12) {
      return `${months[monthNum - 1]} ${year}`;
    }
  }
  return periode;
}

/**
 * Helper to safely extract string from cell
 */
function getCellStr(sheet: XLSX.WorkSheet, colIndex: number, rowIndex: number): string {
  const cellAddress = XLSX.utils.encode_cell({ c: colIndex, r: rowIndex });
  const cell = sheet[cellAddress];
  if (!cell || cell.v === undefined || cell.v === null) return '';
  return String(cell.v).trim();
}

/**
 * Parser file Excel Monitoring Kepatuhan Satker.
 * Mengikuti struktur spesifik template:
 * - Sheet: "Data"
 * - Baris 1: Monitoring Kepatuhan Satker
 * - Baris 2: Waktu unduh excel: ...
 * - Baris 5-6: Header bertingkat (15 kolom A-O)
 * - Baris 7: Data dimulai
 */
export function parseMonitoringRekonsiliasiWorkbook(
  workbook: XLSX.WorkBook,
  fileName: string,
  uploadedBy: string = 'Admin KPPN'
): ParseRekonsiliasiResult {
  // 1. Validasi Sheet: Sheet bernama "Data" wajib ada
  const sheetNames = workbook.SheetNames || [];
  const targetSheetName = sheetNames.find(s => s.trim().toLowerCase() === 'data');
  if (!targetSheetName) {
    throw new Error('Sheet Data tidak ditemukan pada file.');
  }

  const sheet = workbook.Sheets[targetSheetName];
  if (!sheet) {
    throw new Error('Sheet Data tidak ditemukan pada file.');
  }

  // Range check
  const ref = sheet['!ref'];
  if (!ref) {
    throw new Error('Sheet Data kosong atau tidak memiliki data.');
  }
  const range = XLSX.utils.decode_range(ref);

  // Waktu unduh dari baris 2 (r = 1)
  let downloadWaktuInfo = '';
  const row2Text = getCellStr(sheet, 0, 1) || getCellStr(sheet, 1, 1);
  if (row2Text) {
    downloadWaktuInfo = row2Text;
  }

  // 2. Validasi Struktur Header Bertingkat (Baris 5 & 6, yakni r=4 & r=5)
  // Parent headers di Row 5 (r=4):
  // A5 (c=0): NO
  // B5 (c=1): No
  // C5 (c=2): Kode Satker
  // D5 (c=3): Nama Satker
  // E5 (c=4): Kode KPPN
  // F5 (c=5): Status Satker
  // G5 (c=6): Periode
  // H5 (c=7): Status Kepatuhan Satker (H5:J5)
  // K5 (c=10): SP2S (K5:L5)
  // M5 (c=12): SP3S (M5:N5)
  // O5 (c=14): DISPENSASI (O5:O6)

  const h_A5 = getCellStr(sheet, 0, 4).toUpperCase();
  const h_B5 = getCellStr(sheet, 1, 4).toUpperCase();
  const h_C5 = getCellStr(sheet, 2, 4).toUpperCase();
  const h_D5 = getCellStr(sheet, 3, 4).toUpperCase();
  const h_E5 = getCellStr(sheet, 4, 4).toUpperCase();
  const h_F5 = getCellStr(sheet, 5, 4).toUpperCase();
  const h_G5 = getCellStr(sheet, 6, 4).toUpperCase();
  const h_H5 = getCellStr(sheet, 7, 4).toUpperCase();
  const h_K5 = getCellStr(sheet, 10, 4).toUpperCase();
  const h_M5 = getCellStr(sheet, 12, 4).toUpperCase();
  const h_O5 = getCellStr(sheet, 14, 4).toUpperCase();

  // Child headers di Row 6 (r=5):
  // H6 (c=7): Rekonsiliasi
  // I6 (c=8): Todolist
  // J6 (c=9): Tutup Periode
  // K6 (c=10): Nomor
  // L6 (c=11): Tanggal
  // M6 (c=12): Nomor
  // N6 (c=13): Tanggal

  const h_H6 = getCellStr(sheet, 7, 5).toUpperCase();
  const h_I6 = getCellStr(sheet, 8, 5).toUpperCase();
  const h_J6 = getCellStr(sheet, 9, 5).toUpperCase();
  const h_K6 = getCellStr(sheet, 10, 5).toUpperCase();
  const h_L6 = getCellStr(sheet, 11, 5).toUpperCase();
  const h_M6 = getCellStr(sheet, 12, 5).toUpperCase();
  const h_N6 = getCellStr(sheet, 13, 5).toUpperCase();

  const isParentValid =
    h_A5.includes('NO') &&
    h_B5.includes('NO') &&
    h_C5.includes('KODE SATKER') &&
    h_D5.includes('NAMA SATKER') &&
    h_E5.includes('KODE KPPN') &&
    h_F5.includes('STATUS SATKER') &&
    h_G5.includes('PERIODE') &&
    h_H5.includes('STATUS KEPATUHAN') &&
    h_K5.includes('SP2S') &&
    h_M5.includes('SP3S') &&
    h_O5.includes('DISPENSASI');

  const isChildValid =
    h_H6.includes('REKONSILIASI') &&
    h_I6.includes('TODOLIST') &&
    h_J6.includes('TUTUP PERIODE') &&
    h_K6.includes('NOMOR') &&
    h_L6.includes('TANGGAL') &&
    h_M6.includes('NOMOR') &&
    h_N6.includes('TANGGAL');

  if (!isParentValid || !isChildValid) {
    throw new Error('Struktur file tidak sesuai template Monitoring Kepatuhan Satker.');
  }

  // 3. Baca Data Dimulai dari Baris 7 (r = 6)
  const uploadId = `upload-rekon-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const records: MonitoringRekonsiliasiRecord[] = [];
  const errors: { row: number; column: string; value: any; message: string }[] = [];
  const warnings: string[] = [];
  let detectedPeriode = '';

  const summary: RekonsiliasiBatchSummary = {
    totalSatker: 0,
    rekonsiliasiSelesai: 0,
    rekonsiliasiBelumSelesai: 0,
    rekonsiliasiUnknown: 0,
    todolistSelesai: 0,
    todolistBelumSelesai: 0,
    todolistUnknown: 0,
    sudahTutupPeriode: 0,
    belumTutupPeriode: 0,
    tutupPeriodeUnknown: 0,
    adaSp2s: 0,
    tidakAdaSp2s: 0,
    adaSp3s: 0,
    belumAdaSp3s: 0,
    adaDispensasi: 0,
    perluTindakan: 0,
    perluPemantauan: 0,
    selesai: 0
  };

  for (let r = 6; r <= range.e.r; r++) {
    const rawNo = getCellStr(sheet, 0, r);
    const rawNoKppn = getCellStr(sheet, 1, r); // Column B: No KPPN Satker (e.g. 00401)
    const rawKodeSatker = getCellStr(sheet, 2, r); // Column C: Kode Satker (e.g. 890594)
    const rawNamaSatker = getCellStr(sheet, 3, r);
    const rawKodeKppn = getCellStr(sheet, 4, r);
    const rawStatusSatker = getCellStr(sheet, 5, r);
    const rawPeriode = getCellStr(sheet, 6, r);
    const rawRekonsiliasi = getCellStr(sheet, 7, r);
    const rawTodolist = getCellStr(sheet, 8, r);
    const rawTutupPeriode = getCellStr(sheet, 9, r);
    const rawSp2sNomor = getCellStr(sheet, 10, r);
    const rawSp2sTanggal = getCellStr(sheet, 11, r);
    const rawSp3sNomor = getCellStr(sheet, 12, r);
    const rawSp3sTanggal = getCellStr(sheet, 13, r);
    const rawDispensasi = getCellStr(sheet, 14, r);

    // Skip trailing blank rows
    if (!rawNo && !rawKodeSatker && !rawNamaSatker) {
      continue;
    }

    const rowNumber = r + 1; // 1-indexed for user presentation

    // Jaga format No KPPN Satker (Column B) agar leading zero tidak hilang
    const formattedNoKppn = rawNoKppn.padStart(5, '0');

    // Kode Satker (Column C)
    const kodeSatker = rawKodeSatker.trim();

    // Deteksi Periode
    if (rawPeriode && !detectedPeriode) {
      detectedPeriode = rawPeriode.trim();
    }

    // Mapping Status Rekonsiliasi (Kolom H)
    let rekonsiliasiStatus: RekonsiliasiStatusType = 'UNKNOWN';
    if (rawRekonsiliasi.trim() === 'Rekonsiliasi sudah sama!') {
      rekonsiliasiStatus = 'SELESAI';
      summary.rekonsiliasiSelesai++;
    } else if (rawRekonsiliasi.trim() === 'Masih ada selisih rekonsiliasi (TDK)') {
      rekonsiliasiStatus = 'BELUM_SELESAI';
      summary.rekonsiliasiBelumSelesai++;
    } else {
      rekonsiliasiStatus = 'UNKNOWN';
      summary.rekonsiliasiUnknown++;
      errors.push({
        row: rowNumber,
        column: 'H (Rekonsiliasi)',
        value: rawRekonsiliasi,
        message: 'Ditemukan status baru yang belum memiliki aturan pemetaan.'
      });
    }

    // Mapping Status Todolist (Kolom I)
    let todolistStatus: TodolistStatusType = 'UNKNOWN';
    if (rawTodolist.trim() === 'Semua Todolist sudah selesai') {
      todolistStatus = 'SELESAI';
      summary.todolistSelesai++;
    } else if (rawTodolist.trim() === 'Masih ada todolist') {
      todolistStatus = 'BELUM_SELESAI';
      summary.todolistBelumSelesai++;
    } else {
      todolistStatus = 'UNKNOWN';
      summary.todolistUnknown++;
      errors.push({
        row: rowNumber,
        column: 'I (Todolist)',
        value: rawTodolist,
        message: 'Ditemukan status baru yang belum memiliki aturan pemetaan.'
      });
    }

    // Mapping Status Tutup Periode (Kolom J)
    let tutupPeriodeStatus: TutupPeriodeStatusType = 'UNKNOWN';
    if (rawTutupPeriode.toLowerCase().includes('belum tutup permanen')) {
      tutupPeriodeStatus = 'BELUM_TUTUP';
      summary.belumTutupPeriode++;
    } else if (rawTutupPeriode.toLowerCase().includes('sudah tutup permanen')) {
      tutupPeriodeStatus = 'SUDAH_TUTUP';
      summary.sudahTutupPeriode++;
    } else {
      tutupPeriodeStatus = 'UNKNOWN';
      summary.tutupPeriodeUnknown++;
      errors.push({
        row: rowNumber,
        column: 'J (Tutup Periode)',
        value: rawTutupPeriode,
        message: 'Ditemukan status baru yang belum memiliki aturan pemetaan.'
      });
    }

    // Mapping SP2S (Kolom K & L)
    let sp2sStatus: Sp2sStatusType = 'UNKNOWN';
    if (rawSp2sNomor.trim() === 'Tidak ada SP2S' || rawSp2sNomor.trim() === '-' || !rawSp2sNomor.trim()) {
      sp2sStatus = 'TIDAK_ADA';
      summary.tidakAdaSp2s++;
    } else {
      sp2sStatus = 'ADA';
      summary.adaSp2s++;
    }

    // Mapping SP3S (Kolom M & N)
    let sp3sStatus: Sp3sStatusType = 'UNKNOWN';
    if (rawSp3sNomor.trim() === 'Belum ada SP3S' || rawSp3sNomor.trim() === '-' || !rawSp3sNomor.trim()) {
      sp3sStatus = 'BELUM_ADA';
      summary.belumAdaSp3s++;
    } else {
      sp3sStatus = 'ADA';
      summary.adaSp3s++;
    }

    // Dispensasi (Kolom O)
    const dispensasiValue = rawDispensasi.trim() || '-';
    if (dispensasiValue !== '-') {
      summary.adaDispensasi++;
    }

    // Evaluasi Kategori Faktual
    let prioritasKategori: PrioritasKategoriType = 'SELESAI';
    const hasPerluTindakan =
      rekonsiliasiStatus === 'BELUM_SELESAI' ||
      todolistStatus === 'BELUM_SELESAI' ||
      tutupPeriodeStatus === 'BELUM_TUTUP';

    if (hasPerluTindakan) {
      prioritasKategori = 'PERLU_TINDAKAN';
      summary.perluTindakan++;
    } else if (
      rekonsiliasiStatus === 'SELESAI' &&
      todolistStatus === 'SELESAI' &&
      tutupPeriodeStatus === 'SUDAH_TUTUP'
    ) {
      prioritasKategori = 'SELESAI';
      summary.selesai++;
    } else {
      prioritasKategori = 'PERLU_PEMANTAUAN';
      summary.perluPemantauan++;
    }

    // Validasi Kelengkapan Record
    const validationNotes: string[] = [];
    let isLengkap = true;
    if (!kodeSatker) {
      isLengkap = false;
      validationNotes.push('Kode Satker kosong');
    }
    if (!rawNamaSatker) {
      isLengkap = false;
      validationNotes.push('Nama Satker kosong');
    }
    if (!rawKodeKppn) {
      isLengkap = false;
      validationNotes.push('Kode KPPN kosong');
    }
    if (!rawStatusSatker) {
      isLengkap = false;
      validationNotes.push('Status Satker kosong');
    }
    if (!rawPeriode) {
      isLengkap = false;
      validationNotes.push('Periode kosong');
    }

    if (!isLengkap) {
      warnings.push(`Baris ${rowNumber}: ⚠ Data Tidak Lengkap (${validationNotes.join(', ')})`);
    }

    const record: MonitoringRekonsiliasiRecord = {
      id: `${uploadId}-${kodeSatker || r}`,
      uploadId,
      no: parseInt(rawNo, 10) || records.length + 1,
      noKppnSatker: formattedNoKppn,
      kodeSatker,
      namaSatker: rawNamaSatker.trim(),
      kodeKppn: rawKodeKppn.trim() || '026',
      statusSatker: rawStatusSatker.trim() || 'AKTIF',
      periode: rawPeriode.trim() || detectedPeriode || '2026-09',
      rekonsiliasiRaw: rawRekonsiliasi.trim(),
      rekonsiliasiStatus,
      todolistRaw: rawTodolist.trim(),
      todolistStatus,
      tutupPeriodeRaw: rawTutupPeriode.trim(),
      tutupPeriodeStatus,
      sp2sNomor: rawSp2sNomor.trim() || 'Tidak ada SP2S',
      sp2sTanggal: rawSp2sTanggal.trim() || '-',
      sp2sStatus,
      sp3sNomor: rawSp3sNomor.trim() || 'Belum ada SP3S',
      sp3sTanggal: rawSp3sTanggal.trim() || '-',
      sp3sStatus,
      dispensasi: dispensasiValue,
      prioritasKategori,
      isLengkap,
      validationNotes: validationNotes.length > 0 ? validationNotes : undefined,
      createdAt: new Date().toISOString(),
      uploadedBy
    };

    records.push(record);
  }

  summary.totalSatker = records.length;

  const batch: MonitoringRekonsiliasiUploadBatch = {
    id: uploadId,
    filename: fileName,
    uploadedAt: new Date().toISOString(),
    uploadedBy,
    periode: detectedPeriode || '2026-09',
    jumlahData: records.length,
    status: errors.length > 0 ? 'WARNING' : 'SUCCESS',
    sheetsCount: sheetNames.length,
    sheetNames,
    summary,
    downloadWaktuInfo
  };

  return {
    batch,
    records,
    errors,
    warnings
  };
}

/**
 * Generator File Excel Contoh Resmi:
 * “Monitoring Kepatuhan Satker_2026-09-20 06-38.xlsx”
 * Menghasilkan persis 127 Satker sesuai acceptance test:
 * - 127 Total
 * - 91 Rekonsiliasi sudah sama!
 * - 36 Masih ada selisih rekonsiliasi (TDK)
 * - 63 Semua Todolist sudah selesai
 * - 64 Masih ada todolist
 * - 127 Belum tutup permanen GLP periode 2026-09
 * - 127 Tidak ada SP2S
 * - 127 Belum ada SP3S
 * - 127 Dispensasi: -
 * - Record 1 persis sesuai spesifikasi: 890594 BPK PERWAKILAN PROVINSI JAWA TENGAH
 */
export function generateSampleMonitoringKepatuhanExcel(masterSatkers: any[] = []): Uint8Array {
  const wb = XLSX.utils.book_new();

  // Buat rows data
  const rows: any[][] = [];

  // Baris 1: Judul
  rows.push(['Monitoring Kepatuhan Satker']);
  // Baris 2: Waktu Unduh
  rows.push(['Waktu unduh excel: 20-09-2026 06:38:22 WIB (+0700 GMT)']);
  // Baris 3: Kosong
  rows.push([]);
  // Baris 4: Kosong
  rows.push([]);

  // Baris 5: Parent Header (Row index 4)
  rows.push([
    'NO',                           // A5
    'No',                           // B5
    'Kode Satker',                  // C5
    'Nama Satker',                  // D5
    'Kode KPPN',                    // E5
    'Status Satker',                // F5
    'Periode',                      // G5
    'Status Kepatuhan Satker',      // H5 (merged H5:J5)
    '',                             // I5
    '',                             // J5
    'SP2S',                         // K5 (merged K5:L5)
    '',                             // L5
    'SP3S',                         // M5 (merged M5:N5)
    '',                             // N5
    'DISPENSASI'                    // O5 (merged O5:O6)
  ]);

  // Baris 6: Child Header (Row index 5)
  rows.push([
    '',                             // A6
    '',                             // B6
    '',                             // C6
    '',                             // D6
    '',                             // E6
    '',                             // F6
    '',                             // G6
    'Rekonsiliasi',                 // H6
    'Todolist',                     // I6
    'Tutup Periode',                // J6
    'Nomor',                        // K6
    'Tanggal',                      // L6
    'Nomor',                        // M6
    'Tanggal',                      // N6
    ''                              // O6
  ]);

  // Daftar Satker 127: Prioritaskan Satker 1 = BPK (890594)
  // Dilanjutkan dengan masterSatkers yang ada sampai 127 record
  const satkersList: { kode: string; nama: string }[] = [];
  satkersList.push({ kode: '890594', nama: 'BPK PERWAKILAN PROVINSI JAWA TENGAH' });

  // Tambahkan satker dari masterSatkers
  if (Array.isArray(masterSatkers)) {
    for (const m of masterSatkers) {
      if (m.kodeSatker && m.kodeSatker !== '890594' && !satkersList.some(s => s.kode === m.kodeSatker)) {
        satkersList.push({ kode: m.kodeSatker, nama: m.namaSatker || `SATKER ${m.kodeSatker}` });
      }
      if (satkersList.length >= 127) break;
    }
  }

  // Jika belum cukup 127 satker, lengkapi dengan satker dummy realistis
  const defaultSatkerNames = [
    'PENGADILAN TINGGI AGAMA SEMARANG',
    'KEJAKSAAN TINGGI JAWA TENGAH',
    'KANWIL KEMENTERIAN AGAMA PROV. JAWA TENGAH',
    'POLDA JAWA TENGAH',
    'UNIVERSITAS DIPONEGORO',
    'POLITEKNIK NEGERI SEMARANG',
    'BALAI BESAR WILAYAH SUNGAI PEMALI JUANA',
    'RUMAH SAKIT UMUM PUSAT DR. KARIADI SEMARANG',
    'BALAI BESAR PENGAWAS OBAT DAN MAKANAN DI SEMARANG',
    'KANTOR KESEHATAN PELABUHAN KELAS II SEMARANG',
    'BALAI KARANTINA HEWAN, IKAN, DAN TUMBUHAN JAWA TENGAH',
    'DISTRIK NAVIGASI KELAS II SEMARANG',
    'KANTOR KESYAHBANDARAN DAN OTORITAS PELABUHAN KELAS I TANJUNG EMAS',
    'BALAI PENDIDIKAN DAN PELATIHAN ILMU PELAYARAN SEMARANG',
    'STASIUN METEOROLOGI KELAS II AHMAD YANI SEMARANG',
    'KANTOR PERWAKILAN KOMISI PEMBERANTASAN KORUPSI WILAYAH TENGAH',
    'PERWAKILAN BKKBN PROVINSI JAWA TENGAH',
    'KANTOR IMIGRASI KELAS I KHUSUS TPI SEMARANG',
    'LEMBAGA PEMASYARAKATAN KELAS I SEMARANG',
    'BALAI PEMASYARAKATAN KELAS I SEMARANG'
  ];

  let dummyIdx = 1;
  while (satkersList.length < 127) {
    const dummyKode = String(400000 + dummyIdx);
    const name = defaultSatkerNames[(dummyIdx - 1) % defaultSatkerNames.length] + (dummyIdx > defaultSatkerNames.length ? ` (${dummyIdx})` : '');
    satkersList.push({ kode: dummyKode, nama: name });
    dummyIdx++;
  }

  // Acceptance Test Exact Counts:
  // Total = 127
  // Rekonsiliasi: 91 Selesai ("Rekonsiliasi sudah sama!"), 36 Belum ("Masih ada selisih rekonsiliasi (TDK)")
  // Todolist: 63 Selesai ("Semua Todolist sudah selesai"), 64 Belum ("Masih ada todolist")
  // Record 1: Rekonsiliasi="Rekonsiliasi sudah sama!", Todolist="Masih ada todolist"

  for (let i = 0; i < 127; i++) {
    const no = i + 1;
    // Col B: No KPPN Satker (e.g. 00401, 01501...)
    const noKppn = i === 0 ? '00401' : String(1500 + i).padStart(5, '0');
    const satker = satkersList[i];

    // Rekonsiliasi: 91 "Rekonsiliasi sudah sama!", 36 "Masih ada selisih rekonsiliasi (TDK)"
    // Index 0 s.d. 90 = Rekonsiliasi sudah sama! (total 91)
    // Index 91 s.d. 126 = Masih ada selisih rekonsiliasi (TDK) (total 36)
    const rekonsiliasiVal = i < 91 ? 'Rekonsiliasi sudah sama!' : 'Masih ada selisih rekonsiliasi (TDK)';

    // Todolist: 63 "Semua Todolist sudah selesai", 64 "Masih ada todolist"
    // Record 1 (i=0): Todolist = "Masih ada todolist"
    // Agar record 0 bernilai "Masih ada todolist", kita letakkan 64 "Masih ada todolist" pada index 0..63
    // dan 63 "Semua Todolist sudah selesai" pada index 64..126
    const todolistVal = i < 64 ? 'Masih ada todolist' : 'Semua Todolist sudah selesai';

    // Tutup Periode: 127 = "Belum tutup permanen GLP periode 2026-09"
    const tutupPeriodeVal = 'Belum tutup permanen GLP periode 2026-09';

    // SP2S: 127 = "Tidak ada SP2S", Tanggal: "-"
    const sp2sNomor = 'Tidak ada SP2S';
    const sp2sTanggal = '-';

    // SP3S: 127 = "Belum ada SP3S", Tanggal: "-"
    const sp3sNomor = 'Belum ada SP3S';
    const sp3sTanggal = '-';

    // Dispensasi: 127 = "-"
    const dispensasi = '-';

    rows.push([
      no,                         // A
      noKppn,                     // B
      satker.kode,                // C
      satker.nama,                // D
      '026',                      // E (Kode KPPN)
      'AKTIF',                    // F
      '2026-09',                  // G
      rekonsiliasiVal,            // H
      todolistVal,                // I
      tutupPeriodeVal,            // J
      sp2sNomor,                  // K
      sp2sTanggal,                // L
      sp3sNomor,                  // M
      sp3sTanggal,                // N
      dispensasi                  // O
    ]);
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Set merged cells:
  // A5:A6, B5:B6, C5:C6, D5:D6, E5:E6, F5:F6, G5:G6, H5:J5, K5:L5, M5:N5, O5:O6
  ws['!merges'] = [
    { s: { r: 4, c: 0 }, e: { r: 5, c: 0 } },  // A5:A6
    { s: { r: 4, c: 1 }, e: { r: 5, c: 1 } },  // B5:B6
    { s: { r: 4, c: 2 }, e: { r: 5, c: 2 } },  // C5:C6
    { s: { r: 4, c: 3 }, e: { r: 5, c: 3 } },  // D5:D6
    { s: { r: 4, c: 4 }, e: { r: 5, c: 4 } },  // E5:E6
    { s: { r: 4, c: 5 }, e: { r: 5, c: 5 } },  // F5:F6
    { s: { r: 4, c: 6 }, e: { r: 5, c: 6 } },  // G5:G6
    { s: { r: 4, c: 7 }, e: { r: 5, c: 9 } },  // H5:J5
    { s: { r: 4, c: 10 }, e: { r: 5, c: 11 } },// K5:L5
    { s: { r: 4, c: 12 }, e: { r: 5, c: 13 } },// M5:N5
    { s: { r: 4, c: 14 }, e: { r: 5, c: 14 } } // O5:O6
  ];

  // Set column widths
  ws['!cols'] = [
    { wch: 6 },   // A: NO
    { wch: 10 },  // B: No
    { wch: 14 },  // C: Kode Satker
    { wch: 45 },  // D: Nama Satker
    { wch: 12 },  // E: Kode KPPN
    { wch: 14 },  // F: Status Satker
    { wch: 12 },  // G: Periode
    { wch: 32 },  // H: Rekonsiliasi
    { wch: 30 },  // I: Todolist
    { wch: 40 },  // J: Tutup Periode
    { wch: 18 },  // K: SP2S Nomor
    { wch: 14 },  // L: SP2S Tanggal
    { wch: 18 },  // M: SP3S Nomor
    { wch: 14 },  // N: SP3S Tanggal
    { wch: 14 }   // O: DISPENSASI
  ];

  // Tambahkan sheet dengan nama WAJIB: "Data"
  XLSX.utils.book_append_sheet(wb, ws, 'Data');

  const excelBuf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Uint8Array(excelBuf);
}
