import * as XLSX from 'xlsx';
import { MonitoringHal3Item, UploadHal3Batch, HistoriHal3Item } from '../types/hal3Dipa';

export interface Hal3ParsedRow {
  rowNumber: number;
  kodeSatker: string;
  namaSatker: string;
  statusKanwil: string;
  raw: Record<string, any>;
  isValid: boolean;
  error?: string;
}

export interface Hal3ExcelPreview {
  fileName: string;
  fileSize: number;
  sheetNames: string[];
  selectedSheet: string;
  totalRows: number;
  validRowCount: number;
  detectedHeaders: {
    kodeSatkerCol?: string;
    namaSatkerCol?: string;
    statusKanwilCol?: string;
  };
  sampleRows: Hal3ParsedRow[];
  parsedRows: Hal3ParsedRow[];
}

// Deteksi header kolom pintar
function findColumnKey(headers: string[], candidates: string[]): string | undefined {
  const normalized = headers.map(h => ({
    key: h,
    clean: String(h || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '')
  }));

  for (const cand of candidates) {
    const candClean = cand.toLowerCase().replace(/[^a-z0-9]/g, '');
    const found = normalized.find(n => n.clean.includes(candClean));
    if (found) return found.key;
  }
  return undefined;
}

// Normalisasi status Kanwil
export function normalizeStatusKanwil(val: any): string {
  if (!val) return 'Belum Mengajukan';
  const str = String(val).trim();
  const lower = str.toLowerCase();

  if (lower.includes('sudah') || lower.includes('telah') || lower.includes('diajukan') || lower.includes('selesai') || lower === 'ya' || lower === 'yes') {
    return 'Sudah Mengajukan';
  }
  if (lower.includes('belum') || lower.includes('tidak') || lower === 'tidak mengajukan' || lower === 'no') {
    return 'Belum Mengajukan';
  }
  return str;
}

export function parseHal3DipaExcel(
  fileBuffer: ArrayBuffer,
  fileName: string,
  fileSize: number
): Hal3ExcelPreview {
  const workbook = XLSX.read(fileBuffer, { type: 'array' });
  const sheetNames = workbook.SheetNames;
  if (!sheetNames || sheetNames.length === 0) {
    throw new Error('File Excel tidak memiliki worksheet.');
  }

  // Pilih sheet pertama atau sheet dengan nama 'Monitoring' / 'Hal III' / 'Revisi'
  let selectedSheet = sheetNames[0];
  const preferredSheet = sheetNames.find(s => 
    /monitoring|hal\s*iii|hal\s*3|revisi/i.test(s)
  );
  if (preferredSheet) {
    selectedSheet = preferredSheet;
  }

  const worksheet = workbook.Sheets[selectedSheet];
  const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

  if (!rawRows || rawRows.length === 0) {
    throw new Error('Worksheet yang dipilih kosong.');
  }

  // Cari baris header (biasanya baris ke-1 s.d. ke-10 yang mengandung kata kode satker / nama satker)
  let headerRowIndex = -1;
  let headers: string[] = [];

  for (let i = 0; i < Math.min(rawRows.length, 15); i++) {
    const row = rawRows[i];
    const rowText = row.map(cell => String(cell || '').toLowerCase()).join(' ');
    if (
      (rowText.includes('kode') || rowText.includes('kdsatker') || rowText.includes('satker')) &&
      (rowText.includes('status') || rowText.includes('nama') || rowText.includes('revisi') || rowText.includes('pengajuan'))
    ) {
      headerRowIndex = i;
      headers = row.map((cell, idx) => String(cell || '').trim() || `Kolom_${idx + 1}`);
      break;
    }
  }

  if (headerRowIndex === -1) {
    // Fallback: gunakan baris pertama
    headerRowIndex = 0;
    headers = rawRows[0].map((cell, idx) => String(cell || '').trim() || `Kolom_${idx + 1}`);
  }

  // Deteksi kolom kunci
  const kodeCol = findColumnKey(headers, ['kodesatker', 'kdsatker', 'kode', 'kd_satker', 'kodesatker6digit']);
  const namaCol = findColumnKey(headers, ['namasatker', 'nmsatker', 'satker', 'nama', 'uraian_satker']);
  const statusCol = findColumnKey(headers, ['statusrevisi', 'statuspengajuan', 'statuskanwil', 'status', 'revisihal3', 'keterangan']);

  const kodeColIdx = kodeCol ? headers.indexOf(kodeCol) : -1;
  const namaColIdx = namaCol ? headers.indexOf(namaCol) : -1;
  const statusColIdx = statusCol ? headers.indexOf(statusCol) : -1;

  const parsedRows: Hal3ParsedRow[] = [];

  for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row || row.every(c => c === '' || c === null || c === undefined)) {
      continue; // Lewati baris kosong
    }

    const rawKode = kodeColIdx !== -1 ? String(row[kodeColIdx] || '').trim() : '';
    // Ekstrak 6 digit kode satker jika diformat string panjang
    let cleanKode = rawKode;
    const digitMatch = rawKode.match(/\b\d{6}\b/);
    if (digitMatch) {
      cleanKode = digitMatch[0];
    }

    const rawNama = namaColIdx !== -1 ? String(row[namaColIdx] || '').trim() : '';
    const rawStatus = statusColIdx !== -1 ? String(row[statusColIdx] || '').trim() : '';

    const rowObj: Record<string, any> = {};
    headers.forEach((h, idx) => {
      rowObj[h] = row[idx] ?? '';
    });

    const isValid = cleanKode.length >= 5;
    const parsedRow: Hal3ParsedRow = {
      rowNumber: r + 1,
      kodeSatker: cleanKode,
      namaSatker: rawNama,
      statusKanwil: normalizeStatusKanwil(rawStatus),
      raw: rowObj,
      isValid,
      error: !isValid ? 'Kode Satker tidak valid (kurang dari 5 digit)' : undefined
    };

    parsedRows.push(parsedRow);
  }

  const validRowCount = parsedRows.filter(p => p.isValid).length;

  return {
    fileName,
    fileSize,
    sheetNames,
    selectedSheet,
    totalRows: parsedRows.length,
    validRowCount,
    detectedHeaders: {
      kodeSatkerCol: kodeCol,
      namaSatkerCol: namaCol,
      statusKanwilCol: statusCol
    },
    sampleRows: parsedRows.slice(0, 8),
    parsedRows
  };
}

// Proses Batch Import dengan penggabungan data lama & perlindungan data tindak lanjut
export function processHal3BatchImport(
  parsedRows: Hal3ParsedRow[],
  existingRecords: MonitoringHal3Item[],
  uploadBatch: UploadHal3Batch,
  currentUserNama: string = 'Admin'
): {
  updatedRecords: MonitoringHal3Item[];
  stats: {
    total: number;
    baru: number;
    diperbarui: number;
    tidakValid: number;
    duplikat: number;
    dipertahankan: number;
  };
} {
  const now = new Date().toISOString();
  const existingMap = new Map<string, MonitoringHal3Item>();
  existingRecords.forEach(r => {
    // Key gabungan: kode_satker + tahun_anggaran + periode
    const key = `${r.kode_satker}-${r.tahun_anggaran}-${r.periode}`;
    existingMap.set(key, r);
  });

  let countBaru = 0;
  let countUpdate = 0;
  let countTidakValid = 0;
  let countDuplikat = 0;

  const seenInThisBatch = new Set<string>();
  const processedKeys = new Set<string>();

  const resultItems: MonitoringHal3Item[] = [];

  for (const row of parsedRows) {
    if (!row.isValid) {
      countTidakValid++;
      continue;
    }

    const itemKey = `${row.kodeSatker}-${uploadBatch.tahun_anggaran}-${uploadBatch.periode}`;

    if (seenInThisBatch.has(itemKey)) {
      countDuplikat++;
      continue;
    }
    seenInThisBatch.add(itemKey);
    processedKeys.add(itemKey);

    const existing = existingMap.get(itemKey);

    if (existing) {
      // UPDATE DATA: Pertahankan data tindak lanjut KPPN dan riwayat lama
      countUpdate++;
      const isStatusKanwilChanged = existing.status_kanwil !== row.statusKanwil;
      const histori = [...(existing.histori || [])];

      if (isStatusKanwilChanged) {
        histori.unshift({
          id: `hist-${row.kodeSatker}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          monitoring_id: existing.id,
          tanggal: now,
          jenis_perubahan: 'STATUS_KANWIL_BERUBAH',
          status_lama: existing.status_kanwil,
          status_baru: row.statusKanwil,
          keterangan: `Status monitoring Kanwil diperbarui dari "${existing.status_kanwil}" menjadi "${row.statusKanwil}" melalui upload ${uploadBatch.nama_file}`,
          user_nama: currentUserNama,
          created_at: now
        });
      }

      // Jika status Kanwil berubah jadi "Sudah Mengajukan", otomatis perbarui tindak lanjut jika relevan
      let updatedTindakLanjut = existing.tindak_lanjut ? { ...existing.tindak_lanjut } : undefined;
      if (row.statusKanwil === 'Sudah Mengajukan' && updatedTindakLanjut) {
        if (updatedTindakLanjut.status_tindak_lanjut !== 'Selesai') {
          updatedTindakLanjut.status_tindak_lanjut = 'Selesai';
          updatedTindakLanjut.updated_at = now;
          histori.unshift({
            id: `hist-${row.kodeSatker}-auto-done-${Date.now()}`,
            monitoring_id: existing.id,
            tanggal: now,
            jenis_perubahan: 'SELESAI',
            status_lama: existing.tindak_lanjut?.status_tindak_lanjut,
            status_baru: 'Selesai',
            keterangan: 'Tindak lanjut otomatis ditandai Selesai karena satker telah terkonfirmasi Sudah Mengajukan di Kanwil.',
            user_nama: 'Sistem',
            created_at: now
          });
        }
      }

      resultItems.push({
        ...existing,
        nama_satker: existing.nama_satker || row.namaSatker,
        nama_satker_source: row.namaSatker || existing.nama_satker_source,
        status_kanwil: row.statusKanwil,
        source_upload_id: uploadBatch.id,
        source_file_name: uploadBatch.nama_file,
        tanggal_data: now.split('T')[0],
        source_row_reference: row.rowNumber,
        is_in_latest_upload: true,
        tindak_lanjut: updatedTindakLanjut,
        histori,
        updated_at: now
      });
    } else {
      // DATA BARU
      countBaru++;
      const newId = itemKey;
      const histori: HistoriHal3Item[] = [
        {
          id: `hist-${row.kodeSatker}-new-${Date.now()}`,
          monitoring_id: newId,
          tanggal: now,
          jenis_perubahan: 'UPLOAD_KANWIL',
          status_baru: row.statusKanwil,
          keterangan: `Satker ditambahkan dari file monitoring Kanwil: ${uploadBatch.nama_file}`,
          user_nama: currentUserNama,
          created_at: now
        }
      ];

      resultItems.push({
        id: newId,
        tahun_anggaran: uploadBatch.tahun_anggaran,
        periode: uploadBatch.periode,
        kppn_kode: uploadBatch.kppn_kode,
        kode_satker: row.kodeSatker,
        nama_satker: row.namaSatker,
        nama_satker_source: row.namaSatker,
        status_kanwil: row.statusKanwil,
        source_upload_id: uploadBatch.id,
        source_file_name: uploadBatch.nama_file,
        tanggal_data: now.split('T')[0],
        source_row_reference: row.rowNumber,
        is_in_latest_upload: true,
        tindak_lanjut: undefined,
        histori,
        created_at: now,
        updated_at: now
      });
    }
  }

  // JANGAN HAPUS data lama yang tidak ada di file terbaru!
  // Tandai sebagai `is_in_latest_upload: false`
  let countDipertahankan = 0;
  existingRecords.forEach(existing => {
    const itemKey = `${existing.kode_satker}-${existing.tahun_anggaran}-${existing.periode}`;
    if (!processedKeys.has(itemKey)) {
      countDipertahankan++;
      resultItems.push({
        ...existing,
        is_in_latest_upload: false,
        updated_at: now
      });
    }
  });

  return {
    updatedRecords: resultItems,
    stats: {
      total: parsedRows.length,
      baru: countBaru,
      diperbarui: countUpdate,
      tidakValid: countTidakValid,
      duplikat: countDuplikat,
      dipertahankan: countDipertahankan
    }
  };
}
