import * as XLSX from 'xlsx';
import { SatkerIKPA, UploadLog, MasterSatker } from '../types';
import { hitungTotalIKPA, getPredikatIKPA } from '../data/initialSatkerData';

export interface ProcessedExcelResult {
  satkers: SatkerIKPA[];
  log: UploadLog;
}

// Clean text values
function cleanText(val: any): string {
  if (val === null || val === undefined) return '';
  return String(val).trim().replace(/\s+/g, ' ');
}

// Clean number strings like "Rp 12.500.000", "85,50%", "90.5" -> number
function parseFormattedNumber(val: any, defaultValue: number = 0): number {
  if (val === null || val === undefined || val === '') return defaultValue;
  if (typeof val === 'number') return isNaN(val) ? defaultValue : val;
  
  let str = String(val).trim();
  // Remove currency symbol, %, space
  str = str.replace(/Rp|\$|%|\s/gi, '');
  
  // Handle Indonesian decimal comma e.g., "85,5" -> "85.5" or "1.500.000,00"
  if (str.includes(',') && str.includes('.')) {
    // Thousands dot, decimal comma: 1.500.000,00 -> 1500000.00
    str = str.replace(/\./g, '').replace(',', '.');
  } else if (str.includes(',')) {
    // Just comma decimal: 85,5 -> 85.5
    str = str.replace(',', '.');
  }
  
  const num = parseFloat(str);
  return isNaN(num) ? defaultValue : num;
}

export async function processExcelFile(file: File, requestedCategory?: string): Promise<ProcessedExcelResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Take the first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert sheet to 2D array matrix for smart header detection
        const matrix: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
        
        if (!matrix || matrix.length === 0) {
          throw new Error('File Excel kosong atau tidak memiliki data yang valid.');
        }

        // 1. Detect Month & Period & Year from top 25 rows or filename
        let detectedMonth = '';
        let detectedYear = '2026';
        let detectedPeriodText = '';

        const monthsList = [
          'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
          'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];

        // Smart Month Detection helper
        const extractBestMonth = (text: string): { month: string; isSd: boolean } | null => {
          const lower = text.toLowerCase();
          
          // Check for "s.d." or "sampai" or "-" with month (e.g. "s.d. Juli", "s.d Juli", "sd Juli", "sampai dengan Juli", "Januari - Juli")
          for (let m = monthsList.length - 1; m >= 0; m--) {
            const mName = monthsList[m];
            const mLower = mName.toLowerCase();
            const regexSd = new RegExp(`(?:s\\.?d\\.?|sd|sampai(?:\\s+dengan)?|-|s\\/d)\\s*${mLower}`, 'i');
            if (regexSd.test(lower)) {
              return { month: mName, isSd: true };
            }
          }

          // Check for exact "Bulan [Nama]" or "Periode [Nama]" from end of year downwards
          for (let m = monthsList.length - 1; m >= 0; m--) {
            const mName = monthsList[m];
            const mLower = mName.toLowerCase();
            const regexBulan = new RegExp(`(?:bulan|periode|kondisi|tahap|data)\\s+${mLower}`, 'i');
            if (regexBulan.test(lower)) {
              return { month: mName, isSd: true };
            }
          }

          // Check any occurrence from latest months down to January
          for (let m = monthsList.length - 1; m >= 0; m--) {
            const mName = monthsList[m];
            const mLower = mName.toLowerCase();
            if (lower.includes(mLower)) {
              return { month: mName, isSd: lower.includes('s.d') || lower.includes('sd') || lower.includes('sampai') };
            }
          }

          return null;
        };

        // Scan top 30 rows for period keywords
        for (let i = 0; i < Math.min(30, matrix.length); i++) {
          if (!matrix[i]) continue;
          const rowStr = matrix[i].map(c => String(c || '')).join(' ');
          
          // Check for year (2024, 2025, 2026, 2027)
          const yearMatch = rowStr.match(/\b(202[4-9])\b/);
          if (yearMatch) {
            detectedYear = yearMatch[1];
          }

          const match = extractBestMonth(rowStr);
          if (match && !detectedMonth) {
            detectedMonth = match.month;
            detectedPeriodText = `s.d. ${match.month} ${detectedYear}`;
          }
        }

        if (!detectedMonth) {
          const match = extractBestMonth(file.name);
          if (match) {
            detectedMonth = match.month;
            detectedPeriodText = `s.d. ${match.month} ${detectedYear}`;
          }
          const fileYearMatch = file.name.match(/\b(202[4-9])\b/);
          if (fileYearMatch) detectedYear = fileYearMatch[1];
        }

        if (!detectedMonth) {
          detectedMonth = 'Juli';
        }

        const periodeFormatted = detectedPeriodText || `s.d. ${detectedMonth} ${detectedYear}`;

        // Determine whether file format is dedicated Capaian Output or full IKPA
        let hasIKPAColumns = false;
        for (let i = 0; i < Math.min(30, matrix.length); i++) {
          if (!matrix[i]) continue;
          const rowStr = matrix[i].map(c => String(c).toLowerCase()).join(' ');
          if (
            rowStr.includes('revisi dipa') ||
            rowStr.includes('revisi') ||
            rowStr.includes('deviasi') ||
            rowStr.includes('penyerapan') ||
            rowStr.includes('kontraktual') ||
            rowStr.includes('tagihan') ||
            rowStr.includes('up/tup') ||
            rowStr.includes('uptup') ||
            rowStr.includes('dispensasi') ||
            rowStr.includes('nilai akhir') ||
            rowStr.includes('total ikpa') ||
            rowStr.includes('nilai total') ||
            rowStr.includes('bobot') ||
            rowStr.includes('komposit')
          ) {
            hasIKPAColumns = true;
            break;
          }
        }

        let isCaputFormat = false;
        let caputHeaderRow = -1;

        if (requestedCategory === 'IKPA') {
          // Explicitly IKPA requested -> ALWAYS parse as IKPA
          isCaputFormat = false;
        } else if (requestedCategory === 'CAPAIAN_OUTPUT') {
          // If explicitly requested as Capaian Output, only use Caput format if it does NOT have full IKPA columns
          if (!hasIKPAColumns) {
            isCaputFormat = true;
          } else {
            isCaputFormat = false;
          }
        } else {
          // Auto-detection: Only treat as Caput if NO IKPA columns exist AND it matches Caput report patterns
          if (!hasIKPAColumns) {
            for (let i = 0; i < Math.min(25, matrix.length); i++) {
              if (!matrix[i]) continue;
              const rowStr = matrix[i].map(c => String(c).toLowerCase()).join(' ');
              if (
                rowStr.includes('rekap kertas kerja capaian output') ||
                rowStr.includes('konfirmasi capaian output') ||
                (rowStr.includes('kode') && (rowStr.includes('data masuk') || rowStr.includes('status penyampaian')))
              ) {
                isCaputFormat = true;
                caputHeaderRow = i;
                break;
              }
            }
          }
        }

        if (isCaputFormat && caputHeaderRow === -1) {
          for (let i = 0; i < Math.min(25, matrix.length); i++) {
            if (!matrix[i]) continue;
            const rowStr = matrix[i].map(c => String(c).toLowerCase()).join(' ');
            if (rowStr.includes('kode') || rowStr.includes('satker')) {
              caputHeaderRow = i;
              break;
            }
          }
          if (caputHeaderRow === -1) caputHeaderRow = 0;
        }

        const cleanedSatkers: SatkerIKPA[] = [];
        let cleanedCount = 0;
        let recomputedTotalCount = 0;
        const notes: string[] = [];

        if (isCaputFormat && caputHeaderRow !== -1) {
          // Column E = index 4 (Kode Satker)
          // Column F = index 5 (Nama Satuan Kerja)
          // Column O = index 14 (Status Penyampaian)
          let colKode = 4;
          let colNama = 5;
          let colPersen = 14;
          
          if (matrix[caputHeaderRow]) {
            matrix[caputHeaderRow].forEach((colVal: any, cIdx: number) => {
              const cStr = String(colVal).toLowerCase();
              if (cStr.includes('kode satker') || cStr.includes('kdsatker') || (cStr.includes('kode') && !cStr.includes('koderincian'))) colKode = cIdx;
              if (cStr.includes('nama satker') || cStr.includes('nmsatker') || cStr.includes('satuan kerja') || cStr === 'nama') colNama = cIdx;
              if (cStr.includes('status penyampaian') || cStr.includes('data masuk') || cStr.includes('upload') || cStr.includes('status')) colPersen = cIdx;
            });
          }

          let zeroCaputCount = 0;
          let terlaporkanCaputCount = 0;

          for (let r = caputHeaderRow + 1; r < matrix.length; r++) {
            const row = matrix[r];
            if (!row || row.length === 0) continue;

            // Target Column E (index 4) or fallback search for 5-6 digit Kode Satker
            let rawKode = String(row[colKode] !== undefined ? row[colKode] : '').trim();
            if (!rawKode || !/^\d{5,6}$/.test(rawKode)) {
              for (let c = 0; c < row.length; c++) {
                const cellStr = String(row[c] || '').trim();
                if (/^\d{5,6}$/.test(cellStr)) {
                  rawKode = cellStr;
                  if (row[c + 1]) colNama = c + 1;
                  break;
                }
              }
            }

            if (rawKode && /^\d{5,6}$/.test(rawKode)) {
              const kodeSatker = rawKode.padStart(6, '0');
              const rawNama = row[colNama] !== undefined ? cleanText(row[colNama] || '') : '';
              const namaSatker = rawNama || `SATKER ${kodeSatker}`;
              
              // Target Column O (index 14) for Status Penyampaian / % Data
              const rawStatusStr = String(row[colPersen] !== undefined ? row[colPersen] : (row[14] !== undefined ? row[14] : '')).trim();
              const lowerStatus = rawStatusStr.toLowerCase();

              const isZeroPercent = 
                lowerStatus === '0%' || 
                lowerStatus === '0' || 
                lowerStatus === '0.00%' || 
                lowerStatus === '0,00%' || 
                lowerStatus === '0.0%' || 
                lowerStatus.includes('0%') || 
                lowerStatus.includes('belum') || 
                parseFormattedNumber(rawStatusStr, -1) === 0;

              let statusCapaianOutput: SatkerIKPA['statusCapaianOutput'] = 'Sudah Terlaporkan';
              let capaianOutputScore = 100;

              if (isZeroPercent) {
                statusCapaianOutput = 'Belum Terlaporkan';
                capaianOutputScore = 0;
                zeroCaputCount++;
              } else {
                statusCapaianOutput = 'Sudah Terlaporkan';
                const parsedVal = parseFormattedNumber(rawStatusStr, 100);
                capaianOutputScore = (parsedVal > 0 && parsedVal <= 100) ? parsedVal : 100;
                terlaporkanCaputCount++;
              }

              // Since this is purely a Capaian Output file, do NOT generate fake IKPA data
              const indikatorObj = {
                revisiDipa: 0,
                deviasiHal3Dipa: 0,
                penyerapanAnggaran: 0,
                belanjaKontraktual: 0,
                penyelesaianTagihan: 0,
                pengelolaanUpTup: 0,
                dispensasiSpm: 0,
                capaianOutput: capaianOutputScore
              };

              const nilaiTotalIKPA = 0;
              const predikat: SatkerIKPA['predikat'] = 'Cukup';

              const paguAnggaran = 0;
              const realisasiAnggaran = 0;

              const issues: string[] = [];
              if (statusCapaianOutput === 'Belum Terlaporkan' || capaianOutputScore === 0) {
                issues.push('Capaian Output 0% (Belum Mengirim Capaian Output ke SAKTI)');
              }

              cleanedCount++;
              cleanedSatkers.push({
                id: `caput-${kodeSatker}-${Date.now()}-${cleanedCount}`,
                kodeSatker,
                namaSatker: namaSatker || `SATKER ${kodeSatker}`,
                kementerianLembaga: `BA ${row[3] || '015'} - KPPN Semarang I`,
                unitEselon1: 'Unit Kerja Terkait',
                paguAnggaran,
                realisasiAnggaran,
                persenPenyerapan: 0,
                statusCapaianOutput,
                indikator: indikatorObj,
                nilaiTotalIKPA,
                predikat,
                hasIKPAData: false,
                hasCapaianOutputData: true,
                issues,
                namaPic: `Operator ${kodeSatker}`,
                noHpPic: '081234567890',
                emailPic: `satker.${kodeSatker}@kemenkeu.go.id`,
                alamatSatker: 'Kota Semarang',
                periodeUpdate: periodeFormatted,
                isModified: true
              });
            }
          }

          notes.push(`Berhasil mengenali format Rekap Kertas Kerja Capaian Output OM-SPAN (${periodeFormatted}).`);
          notes.push(`Memproses ${cleanedSatkers.length} Satker: ${zeroCaputCount} Satker belum mengirim (0% data masuk), ${terlaporkanCaputCount} Satker sudah/terlambat mengirim.`);

        } else {
          // General / OM-SPAN / SAKTI / Custom Excel Universal Parser
          // 1. Find the true table header row with highest indicator keyword matches
          let bestHeaderRowIdx = -1;
          let maxHeaderMatches = 0;

          for (let i = 0; i < Math.min(35, matrix.length); i++) {
            if (!matrix[i]) continue;
            const rowStr = matrix[i].map(c => String(c || '').toLowerCase()).join(' ');
            let score = 0;
            if (rowStr.includes('revisi')) score += 3;
            if (rowStr.includes('deviasi') || rowStr.includes('hal iii') || rowStr.includes('hal 3')) score += 3;
            if (rowStr.includes('penyerapan')) score += 3;
            if (rowStr.includes('kontraktual') || rowStr.includes('kontrak')) score += 3;
            if (rowStr.includes('tagihan') || rowStr.includes('penyelesaian')) score += 3;
            if (rowStr.includes('up dan tup') || rowStr.includes('uptup') || rowStr.includes('pengelolaan up')) score += 3;
            if (rowStr.includes('capaian output') || rowStr.includes('output')) score += 3;
            if (rowStr.includes('dispensasi')) score += 3;
            if (rowStr.includes('kode satker') || rowStr.includes('uraian satker')) score += 2;
            if (rowStr.includes('kualitas perencanaan') || rowStr.includes('kualitas pelaksanaan')) score += 2;
            if (rowStr.includes('konversi bobot') || rowStr.includes('nilai akhir')) score += 2;

            if (score > maxHeaderMatches) {
              maxHeaderMatches = score;
              bestHeaderRowIdx = i;
            }
          }

          if (bestHeaderRowIdx === -1) bestHeaderRowIdx = 0;

          // Combine headers across adjacent rows to handle multi-level merged headers
          const rawHeaders: string[] = [];
          const maxCols = Math.max(...matrix.slice(0, Math.min(40, matrix.length)).map(r => r ? r.length : 0));

          for (let c = 0; c < maxCols; c++) {
            let combined = '';
            for (let r = Math.max(0, bestHeaderRowIdx - 2); r <= Math.min(matrix.length - 1, bestHeaderRowIdx + 2); r++) {
              if (matrix[r] && matrix[r][c] !== undefined && matrix[r][c] !== '') {
                combined += ' ' + String(matrix[r][c]);
              }
            }
            rawHeaders.push(combined.toLowerCase().trim());
          }

          const colMap = {
            kode: -1,
            kodeBa: -1,
            nama: -1,
            keterangan: -1,
            periode: -1,
            revisi: -1,
            deviasi: -1,
            penyerapan: -1,
            kontraktual: -1,
            tagihan: -1,
            uptup: -1,
            dispensasi: -1,
            capaian: -1,
            nilaiTotal: -1,
            konversiBobot: -1,
            nilaiAkhir: -1,
            pagu: -1,
            realisasi: -1,
            kl: -1,
            statusCaput: -1,
            picNama: -1,
            picHp: -1,
            picEmail: -1
          };

          // Step A: Parse headers with precise keyword checking
          for (let colIdx = 0; colIdx < maxCols; colIdx++) {
            const h = rawHeaders[colIdx] || '';
            const cleanH = h.replace(/[^a-z0-9]/g, '');
            
            // Check specific header cell in the bestHeaderRowIdx
            const directHeaderCell = String(matrix[bestHeaderRowIdx]?.[colIdx] || '').toLowerCase().trim();
            const cleanDirect = directHeaderCell.replace(/[^a-z0-9]/g, '');
            const isAspek = cleanDirect.includes('aspek') || cleanDirect.includes('nilaiaspek') || cleanH.endsWith('nilaiaspek') || cleanH.includes('aspek');

            if (cleanDirect.includes('kodeba') || cleanH.includes('kodeba') || cleanH.includes('kdba')) {
              colMap.kodeBa = colIdx;
            }

            if (colMap.kode === -1 && (cleanDirect.includes('kodesatker') || cleanH.includes('kodesatker') || cleanH.includes('kdsatker') || cleanH.includes('satkercode'))) {
              colMap.kode = colIdx;
            }

            if (colMap.nama === -1 && (cleanDirect.includes('uraiansatker') || cleanH.includes('namasatker') || cleanH.includes('nmsatker') || cleanH.includes('uraiansatker') || cleanH.includes('satkername') || (cleanH.includes('nama') && !cleanH.includes('pic') && !cleanH.includes('pejabat')) || cleanH.includes('uraian'))) {
              colMap.nama = colIdx;
            }

            if (colMap.keterangan === -1 && (cleanDirect === 'keterangan' || cleanH.includes('keterangan') || cleanH === 'ket')) {
              colMap.keterangan = colIdx;
            }

            if (colMap.periode === -1 && (cleanH.includes('periode') || cleanH.includes('bulan') || cleanH.includes('triwulan') || cleanH.includes('tw'))) {
              colMap.periode = colIdx;
            }

            // Indicators (EXCLUDE columns that represent aspect sub-totals / "Nilai Aspek")
            if (!isAspek) {
              if (colMap.revisi === -1 && (cleanDirect.includes('revisi') || cleanH.includes('revisidipa') || cleanH.includes('revisi'))) {
                colMap.revisi = colIdx;
              }
              if (colMap.deviasi === -1 && (cleanDirect.includes('deviasi') || cleanH.includes('deviasihal3') || cleanH.includes('deviasihaliii') || cleanH.includes('deviasihalaman3') || cleanH.includes('deviasihalamanii') || cleanH.includes('hal3') || cleanH.includes('haliii') || cleanH.includes('deviasi'))) {
                colMap.deviasi = colIdx;
              }
              if (colMap.penyerapan === -1 && (cleanDirect.includes('penyerapan') || cleanH.includes('penyerapananggaran') || cleanH.includes('penyerapan') || cleanH.includes('persenpenyerapan') || cleanH.includes('serap'))) {
                colMap.penyerapan = colIdx;
              }
              if (colMap.kontraktual === -1 && (cleanDirect.includes('kontrak') || cleanH.includes('belanjakontraktual') || cleanH.includes('kontraktual') || cleanH.includes('kontrak'))) {
                colMap.kontraktual = colIdx;
              }
              if (colMap.tagihan === -1 && (cleanDirect.includes('tagihan') || cleanH.includes('penyelesaiantagihan') || cleanH.includes('tagihan') || cleanH.includes('spmtagihan'))) {
                colMap.tagihan = colIdx;
              }
              if (colMap.uptup === -1 && (cleanDirect.includes('uptup') || cleanDirect.includes('up') || cleanH.includes('pengelolaanuptup') || cleanH.includes('updantup') || cleanH.includes('uptup') || cleanH.includes('pengelolaanup'))) {
                colMap.uptup = colIdx;
              }
              if (colMap.dispensasi === -1 && (cleanDirect.includes('dispensasi') || cleanH.includes('dispensasispm') || cleanH.includes('dispensasi'))) {
                colMap.dispensasi = colIdx;
              }
              if (colMap.capaian === -1 && (cleanDirect.includes('capaian') || cleanDirect.includes('output') || cleanH.includes('capaianoutput') || cleanH.includes('datamasuk') || cleanH.includes('persenoutput') || cleanH.includes('capaian'))) {
                colMap.capaian = colIdx;
              }
            }

            if (colMap.konversiBobot === -1 && (cleanDirect.includes('konversi') || cleanH.includes('konversibobot') || cleanH.includes('bobotkonversi'))) {
              colMap.konversiBobot = colIdx;
            }

            if (colMap.nilaiAkhir === -1 && (
              cleanDirect.includes('nilaiakhir') ||
              cleanH.includes('nilaiakhir') ||
              cleanH.includes('nilaitotal/konversibobot') ||
              cleanH.includes('nilaitotalkonversibobot') ||
              cleanH.includes('akhirikpa')
            )) {
              colMap.nilaiAkhir = colIdx;
            }

            if (colMap.nilaiTotal === -1 && (
              cleanDirect.includes('nilaitotal') ||
              cleanH.includes('nilaitotal') ||
              cleanH.includes('nilaikomposit') ||
              cleanH === 'nilaiakhir' ||
              cleanH === 'ikpa'
            )) {
              colMap.nilaiTotal = colIdx;
            }

            if (colMap.pagu === -1 && (cleanH.includes('paguanggaran') || cleanH.includes('totalpagu') || cleanH.includes('pagu'))) {
              colMap.pagu = colIdx;
            }
            if (colMap.realisasi === -1 && (cleanH.includes('realisasianggaran') || cleanH.includes('totalrealisasi') || cleanH.includes('realisasi'))) {
              colMap.realisasi = colIdx;
            }
            if (colMap.kl === -1 && (cleanH.includes('kementerian') || cleanH.includes('lembaga') || cleanH.includes('bagiananggaran'))) {
              colMap.kl = colIdx;
            }
            if (colMap.statusCaput === -1 && (cleanH.includes('statuscapaian') || cleanH.includes('statusoutput') || cleanH.includes('status'))) {
              colMap.statusCaput = colIdx;
            }
            if (colMap.picNama === -1 && (cleanH.includes('namapic') || cleanH.includes('pic') || cleanH.includes('kontak'))) {
              colMap.picNama = colIdx;
            }
            if (colMap.picHp === -1 && (cleanH.includes('nohp') || cleanH.includes('wa') || cleanH.includes('telepon'))) {
              colMap.picHp = colIdx;
            }
            if (colMap.picEmail === -1 && (cleanH.includes('email') || cleanH.includes('mail'))) {
              colMap.picEmail = colIdx;
            }
          }

          // Check if this matches the standard OM-SPAN matrix (columns A to T/U)
          const isStandardOMSPAN = maxCols >= 19;

          // Track seen satkers to only take the FIRST primary row per satker (e.g. row 8, 11, 14...)
          // and ignore auxiliary rows (BOBOT, NILAI AKHIR, NILAI KONVERSI)
          const seenKodeSatkers = new Set<string>();
          let skippedAuxiliaryRows = 0;

          // Iterate through data rows starting after headerRowIdx
          for (let r = bestHeaderRowIdx + 1; r < matrix.length; r++) {
            const row = matrix[r];
            if (!row || row.length === 0) continue;

            const rowUpper = row.map(c => String(c || '').trim().toUpperCase()).join(' ');

            // 1. FILTER OUT Auxiliary rows (Bobot, Nilai Akhir, Nilai Konversi, Rata-rata, Jumlah, etc.)
            if (
              rowUpper.includes('BOBOT') ||
              rowUpper.includes('NILAI AKHIR') ||
              rowUpper.includes('NILAI KONVERSI') ||
              rowUpper.includes('BOBOT KONVERSI') ||
              rowUpper.includes('TOTAL BOBOT') ||
              rowUpper.includes('RATA-RATA') ||
              rowUpper.includes('JUMLAH')
            ) {
              skippedAuxiliaryRows++;
              continue; // STRICTLY SKIP auxiliary / weight / converted rows
            }

            // Extract Kode Satker
            let rawKode = colMap.kode !== -1 ? cleanText(row[colMap.kode]) : '';
            let kodeColIndex = colMap.kode;

            if (!rawKode || !/^\d{5,6}$/.test(rawKode)) {
              for (let c = 0; c < Math.min(6, row.length); c++) {
                if (c === colMap.kodeBa) continue; // skip Kode BA (e.g. 136)
                const cellVal = cleanText(row[c]);
                if (/^\d{5,6}$/.test(cellVal)) {
                  rawKode = cellVal;
                  kodeColIndex = c;
                  break;
                }
              }
            }

            if (!rawKode || !/^\d{5,6}$/.test(rawKode)) continue;

            const kodeSatker = rawKode.padStart(6, '0');

            // 2. DEDUPLICATE: If this Satker has already been extracted from its first row, SKIP subsequent rows
            if (seenKodeSatkers.has(kodeSatker)) {
              continue;
            }
            seenKodeSatkers.add(kodeSatker);

            // Extract Nama Satker
            let namaSatker = colMap.nama !== -1 ? cleanText(row[colMap.nama]) : '';
            if (!namaSatker) {
              // Try adjacent cells to kodeSatker
              if (kodeColIndex !== -1 && row[kodeColIndex + 1]) {
                const candidate = cleanText(row[kodeColIndex + 1]);
                if (candidate && !/^\d+$/.test(candidate) && !['NILAI', 'BOBOT', 'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI', 'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'].includes(candidate.toUpperCase())) {
                  namaSatker = candidate;
                }
              }
              if (!namaSatker && kodeColIndex !== -1 && row[kodeColIndex + 2]) {
                const candidate2 = cleanText(row[kodeColIndex + 2]);
                if (candidate2 && !/^\d+$/.test(candidate2) && !['NILAI', 'BOBOT', 'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI', 'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'].includes(candidate2.toUpperCase())) {
                  namaSatker = candidate2;
                }
              }
            }
            if (!namaSatker) {
              namaSatker = `SATKER ${kodeSatker}`;
            }

            // Extract Indicators
            // EXACT EXCEL COLUMN SPECIFICATION (0-indexed):
            // Col H (Index 7): Revisi DIPA (e.g. 100.00)
            // Col I (Index 8): Deviasi Halaman III DIPA (e.g. 100.00)
            // Col J (Index 9): Nilai Aspek Kualitas Perencanaan Anggaran [Subtotal - SKIP]
            // Col K (Index 10): Penyerapan Anggaran (e.g. 15.53)
            // Col L (Index 11): Belanja Kontraktual (e.g. 0.00)
            // Col M (Index 12): Penyelesaian Tagihan (e.g. 0.00)
            // Col N (Index 13): Pengelolaan UP dan TUP (e.g. 100.00)
            // Col O (Index 14): Nilai Aspek Kualitas Pelaksanaan Anggaran [Subtotal - SKIP]
            // Col P (Index 15): Capaian Output (e.g. 30.00)
            // Col Q (Index 16): Nilai Aspek Kualitas Hasil Pelaksanaan Anggaran [Subtotal - SKIP]
            // Col R (Index 17): Nilai Total [Subtotal - SKIP]
            // Col S (Index 18): Konversi Bobot [Subtotal - SKIP]
            // Col T (Index 19): Dispensasi SPM (e.g. 0.00)
            // Col U (Index 20) / Col V (Index 21): Nilai Akhir Total IKPA (e.g. 57.01)

            let rawRevisi = -1;
            let rawDeviasi = -1;
            let rawPenyerapan = -1;
            let rawKontraktual = -1;
            let rawTagihan = -1;
            let rawUpTup = -1;
            let rawCapaian = -1;
            let rawDispensasi = -1;

            if (row.length >= 20 || isStandardOMSPAN) {
              // Direct deterministic extraction for OM-SPAN format
              rawRevisi = row.length > 7 ? parseFormattedNumber(row[7], -1) : -1;
              rawDeviasi = row.length > 8 ? parseFormattedNumber(row[8], -1) : -1;
              rawPenyerapan = row.length > 10 ? parseFormattedNumber(row[10], -1) : -1;
              rawKontraktual = row.length > 11 ? parseFormattedNumber(row[11], -1) : -1;
              rawTagihan = row.length > 12 ? parseFormattedNumber(row[12], -1) : -1;
              rawUpTup = row.length > 13 ? parseFormattedNumber(row[13], -1) : -1;
              rawCapaian = row.length > 15 ? parseFormattedNumber(row[15], -1) : -1;
              rawDispensasi = row.length > 19 ? parseFormattedNumber(row[19], -1) : -1;
            } else {
              // Fallback to colMap for smaller or non-standard custom sheets
              rawRevisi = colMap.revisi !== -1 ? parseFormattedNumber(row[colMap.revisi], -1) : -1;
              rawDeviasi = colMap.deviasi !== -1 ? parseFormattedNumber(row[colMap.deviasi], -1) : -1;
              rawPenyerapan = colMap.penyerapan !== -1 ? parseFormattedNumber(row[colMap.penyerapan], -1) : -1;
              rawKontraktual = colMap.kontraktual !== -1 ? parseFormattedNumber(row[colMap.kontraktual], -1) : -1;
              rawTagihan = colMap.tagihan !== -1 ? parseFormattedNumber(row[colMap.tagihan], -1) : -1;
              rawUpTup = colMap.uptup !== -1 ? parseFormattedNumber(row[colMap.uptup], -1) : -1;
              rawCapaian = colMap.capaian !== -1 ? parseFormattedNumber(row[colMap.capaian], -1) : -1;
              rawDispensasi = colMap.dispensasi !== -1 ? parseFormattedNumber(row[colMap.dispensasi], -1) : -1;
            }

            const hasIKPAInFile = (
              colMap.nilaiAkhir !== -1 ||
              colMap.nilaiTotal !== -1 ||
              colMap.penyerapan !== -1 ||
              colMap.revisi !== -1 ||
              colMap.deviasi !== -1 ||
              rawRevisi !== -1 ||
              rawPenyerapan !== -1 ||
              (row.length >= 20 && (parseFormattedNumber(row[20], -1) >= 0 || parseFormattedNumber(row[19], -1) >= 0 || parseFormattedNumber(row[21], -1) >= 0))
            );

            let revisiDipa = rawRevisi >= 0 ? rawRevisi : 100;
            let deviasiHal3Dipa = rawDeviasi >= 0 ? rawDeviasi : 100;
            let penyerapanAnggaran = rawPenyerapan >= 0 ? rawPenyerapan : 0;
            let belanjaKontraktual = rawKontraktual >= 0 ? rawKontraktual : 0;
            let penyelesaianTagihan = rawTagihan >= 0 ? rawTagihan : 0;
            let pengelolaanUpTup = rawUpTup >= 0 ? rawUpTup : 0;
            let dispensasiSpm = rawDispensasi >= 0 ? rawDispensasi : 0;
            let capaianOutput = rawCapaian >= 0 ? rawCapaian : 0;

            const indikatorObj = {
              revisiDipa: Math.min(100, Math.max(0, revisiDipa)),
              deviasiHal3Dipa: Math.min(100, Math.max(0, deviasiHal3Dipa)),
              penyerapanAnggaran: Math.min(100, Math.max(0, penyerapanAnggaran)),
              belanjaKontraktual: Math.min(100, Math.max(0, belanjaKontraktual)),
              penyelesaianTagihan: Math.min(100, Math.max(0, penyelesaianTagihan)),
              pengelolaanUpTup: Math.min(100, Math.max(0, pengelolaanUpTup)),
              dispensasiSpm: Math.min(100, Math.max(0, dispensasiSpm)),
              capaianOutput: Math.min(100, Math.max(0, capaianOutput))
            };

            let nilaiTotalIKPA = 0;
            if (hasIKPAInFile) {
              // 1. Check explicit Nilai Akhir column
              if (colMap.nilaiAkhir !== -1) {
                const valAkhir = parseFormattedNumber(row[colMap.nilaiAkhir], -1);
                if (valAkhir >= 0 && valAkhir <= 100) {
                  nilaiTotalIKPA = valAkhir;
                }
              }

              // 2. Check Standard OM-SPAN Column U (index 20) or V (index 21)
              if (nilaiTotalIKPA === 0 && row.length > 20) {
                const colUVal = parseFormattedNumber(row[20], -1);
                if (colUVal > 0 && colUVal <= 100) {
                  nilaiTotalIKPA = colUVal;
                } else if (row.length > 21) {
                  const colVVal = parseFormattedNumber(row[21], -1);
                  if (colVVal > 0 && colVVal <= 100) {
                    nilaiTotalIKPA = colVVal;
                  }
                }
              }

              // 3. If not found, check colMap.nilaiTotal
              if (nilaiTotalIKPA === 0 && colMap.nilaiTotal !== -1) {
                nilaiTotalIKPA = parseFormattedNumber(row[colMap.nilaiTotal], 0);
              }
              
              // 4. Fallback: Recompute weighted score
              if (nilaiTotalIKPA === 0) {
                nilaiTotalIKPA = hitungTotalIKPA(indikatorObj);
                recomputedTotalCount++;
              }
            }

            const predikat = hasIKPAInFile ? getPredikatIKPA(nilaiTotalIKPA) : 'Cukup';

            const rawStatusStr = colMap.statusCaput !== -1 ? cleanText(row[colMap.statusCaput]).toLowerCase() : '';
            let statusCapaianOutput: SatkerIKPA['statusCapaianOutput'] = 'Sudah Terlaporkan';

            if (capaianOutput === 0 || rawStatusStr.includes('belum') || rawStatusStr.includes('0%')) {
              statusCapaianOutput = 'Belum Terlaporkan';
            } else if (rawStatusStr.includes('lambat')) {
              statusCapaianOutput = 'Terlambat';
            } else {
              statusCapaianOutput = 'Sudah Terlaporkan';
            }

            const paguAnggaran = (hasIKPAInFile && colMap.pagu !== -1)
              ? parseFormattedNumber(row[colMap.pagu], 0)
              : 0;

            const realisasiAnggaran = (hasIKPAInFile && colMap.realisasi !== -1)
              ? parseFormattedNumber(row[colMap.realisasi], 0)
              : 0;

            let satkerMonth = detectedMonth;
            let satkerPeriode = periodeFormatted;

            if (colMap.periode !== -1 && row[colMap.periode]) {
              const rawRowPeriode = cleanText(row[colMap.periode]);
              if (rawRowPeriode) {
                for (const m of monthsList) {
                  if (rawRowPeriode.toLowerCase().includes(m.toLowerCase())) {
                    satkerMonth = m;
                    satkerPeriode = `${m} 2026`;
                    break;
                  }
                }
                if (satkerMonth === detectedMonth) {
                  const numMatch = rawRowPeriode.match(/\b([1-9]|1[0-2])\b/);
                  if (numMatch && numMatch[1]) {
                    const mIdx = parseInt(numMatch[1], 10) - 1;
                    if (monthsList[mIdx]) {
                      satkerMonth = monthsList[mIdx];
                      satkerPeriode = `${satkerMonth} 2026`;
                    }
                  }
                }
              }
            }

            const kementerianLembaga = colMap.kl !== -1 && cleanText(row[colMap.kl])
              ? cleanText(row[colMap.kl])
              : `BA ${row[3] || '015'} - KPPN Semarang I`;

            const issues: string[] = [];
            if (statusCapaianOutput === 'Belum Terlaporkan' || capaianOutput === 0) {
              issues.push('Capaian Output Belum Diselesaikan (0%)');
            } else if (statusCapaianOutput === 'Terlambat') {
              issues.push('Pengiriman Capaian Output Terlambat');
            }

            if (hasIKPAInFile) {
              if (nilaiTotalIKPA < 87.5) {
                issues.push(`Nilai IKPA (${nilaiTotalIKPA.toFixed(2)}) Di Bawah Target KPPN (≥87.5)`);
              }
              if (penyerapanAnggaran < 75) {
                issues.push(`Penyerapan Anggaran Rendah (${penyerapanAnggaran.toFixed(1)}%)`);
              }
              if (deviasiHal3Dipa < 75) {
                issues.push(`Deviasi Halaman III DIPA Tinggi (${deviasiHal3Dipa.toFixed(1)}%)`);
              }
              if (capaianOutput < 90 && statusCapaianOutput !== 'Belum Terlaporkan') {
                issues.push(`Capaian Output Belum Maksimal (${capaianOutput.toFixed(1)}%)`);
              }
            }

            cleanedCount++;
            cleanedSatkers.push({
              id: `excel-${kodeSatker}-${Date.now()}-${cleanedCount}`,
              kodeSatker,
              namaSatker,
              kementerianLembaga,
              unitEselon1: 'Unit Kerja Terkait',
              paguAnggaran,
              realisasiAnggaran,
              persenPenyerapan: hasIKPAInFile ? penyerapanAnggaran : 0,
              statusCapaianOutput,
              indikator: indikatorObj,
              nilaiTotalIKPA,
              predikat,
              hasIKPAData: hasIKPAInFile,
              hasCapaianOutputData: !hasIKPAInFile && isCaputFormat,
              issues,
              namaPic: colMap.picNama !== -1 && cleanText(row[colMap.picNama]) ? cleanText(row[colMap.picNama]) : '',
              noHpPic: colMap.picHp !== -1 && cleanText(row[colMap.picHp]) ? cleanText(row[colMap.picHp]) : '',
              emailPic: colMap.picEmail !== -1 && cleanText(row[colMap.picEmail]) ? cleanText(row[colMap.picEmail]) : '',
              alamatSatker: 'Kota Semarang',
              periodeUpdate: satkerPeriode,
              riwayatBulanan: [
                {
                  bulan: satkerMonth,
                  nilaiIKPA: nilaiTotalIKPA,
                  capaianOutput: indikatorObj.capaianOutput,
                  deviasiHal3Dipa: indikatorObj.deviasiHal3Dipa,
                  penyerapanAnggaran: indikatorObj.penyerapanAnggaran,
                  revisiDipa: indikatorObj.revisiDipa,
                  belanjaKontraktual: indikatorObj.belanjaKontraktual,
                  penyelesaianTagihan: indikatorObj.penyelesaianTagihan,
                  pengelolaanUpTup: indikatorObj.pengelolaanUpTup,
                  dispensasiSpm: indikatorObj.dispensasiSpm
                }
              ],
              isModified: true
            });
          }

          notes.push(`Berhasil memproses ${cleanedSatkers.length} Satker dari file Excel (${periodeFormatted}).`);
          notes.push(`Otomatis mendeteksi struktur kolom, menyatukan header & membersihkan spasi.`);
          if (recomputedTotalCount > 0) {
            notes.push(`Otomatis menghitung ulang ${recomputedTotalCount} nilai total IKPA berdasarkan bobot standar DJPb.`);
          }
        }

        if (cleanedSatkers.length === 0) {
          throw new Error('Tidak ditemukan data Satker (kode 5-6 digit) yang dapat dibaca dari file Excel. Pastikan file berisi kolom Kode Satker dan Nilai IKPA.');
        }

        const uploadLog: UploadLog = {
          id: `log-${Date.now()}`,
          fileName: file.name,
          uploadDate: new Date().toLocaleString('id-ID'),
          rowCount: cleanedSatkers.length,
          cleanedCount,
          status: 'Success',
          notes
        };

        resolve({ satkers: cleanedSatkers, log: uploadLog });
      } catch (err: any) {
        reject(new Error(err.message || 'Gagal membaca file Excel. Pastikan format file sesuai.'));
      }
    };

    reader.onerror = () => reject(new Error('Gagal membaca file dari disk.'));
    reader.readAsArrayBuffer(file);
  });
}

export function downloadExcelTemplate() {
  const sampleData = [
    {
      'Kode Satker': '652189',
      'Nama Satker': 'POLRESTABES SEMARANG',
      'Kementerian / Lembaga': 'Kepolisian Negara Republik Indonesia',
      'Pagu Anggaran': 145800000000,
      'Realisasi Anggaran': 112500000000,
      'Status Capaian Output': 'Terlambat',
      'Revisi DIPA': 95.0,
      'Deviasi Hal III DIPA': 62.5,
      'Penyerapan Anggaran': 77.1,
      'Belanja Kontraktual': 88.0,
      'Penyelesaian Tagihan': 80.0,
      'Pengelolaan UP TUP': 75.0,
      'Dispensasi SPM': 100.0,
      'Capaian Output': 45.0,
      'Nama PIC': 'Bambang Prasetyo',
      'No HP PIC': '081234567890',
      'Email PIC': 'keu.polrestabes@polri.go.id'
    },
    {
      'Kode Satker': '015432',
      'Nama Satker': 'KANWIL KEMENTERIAN AGAMA PROVINSI JAWA TENGAH',
      'Kementerian / Lembaga': 'Kementerian Agama',
      'Pagu Anggaran': 210500000000,
      'Realisasi Anggaran': 185400000000,
      'Status Capaian Output': 'Belum Terlaporkan',
      'Revisi DIPA': 90.0,
      'Deviasi Hal III DIPA': 70.0,
      'Penyerapan Anggaran': 88.0,
      'Belanja Kontraktual': 92.0,
      'Penyelesaian Tagihan': 85.0,
      'Pengelolaan UP TUP': 90.0,
      'Dispensasi SPM': 100.0,
      'Capaian Output': 50.0,
      'Nama PIC': 'H. Ahmad Fauzi',
      'No HP PIC': '081398765432',
      'Email PIC': 'keuangan.jateng@kemenag.go.id'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Format IKPA Satker');
  
  XLSX.writeFile(workbook, 'Template_Excel_IKPA_KPPN_Semarang1.xlsx');
}

export function downloadCapaianOutputTemplate() {
  const sampleData = [
    {
      'Kode Satker': '652189',
      'Nama Satker': 'POLRESTABES SEMARANG',
      'Status Capaian Output': 'Belum Terlaporkan',
      'Persen Data Masuk': 0,
      'Nilai Capaian Output': 0,
      'Jumlah KRO RO': 12,
      'Terkonfirmasi': 0,
      'Keterangan': 'Belum Mengunggah SAKTI'
    },
    {
      'Kode Satker': '015432',
      'Nama Satker': 'KANWIL KEMENTERIAN AGAMA PROVINSI JAWA TENGAH',
      'Status Capaian Output': 'Sudah Terlaporkan',
      'Persen Data Masuk': 100,
      'Nilai Capaian Output': 95.5,
      'Jumlah KRO RO': 25,
      'Terkonfirmasi': 25,
      'Keterangan': 'Sudah Sesuai Batas Waktu'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Format Capaian Output');
  
  XLSX.writeFile(workbook, 'Template_Excel_Capaian_Output_SAKTI.xlsx');
}

export function downloadSertifikasiTemplate() {
  const sampleData = [
    {
      'NIP': '196909241992031001',
      'NAMA': 'DJOKO DWI ANTONO',
      'KDSATKER': '692963',
      'NMSATKER': 'RUMAH DETENSI IMIGRASI SEMARANG',
      'NMJABATAN': 'Pejabat Pembuat Komitmen',
      'NO_SERTIFIKAT': 'PNT-06134/026/044/2021',
      'TGL_SERTIFIKAT': '30/06/2021'
    },
    {
      'NIP': '197203161992012001',
      'NAMA': 'WAHJU INDAH ANGGRAENI',
      'KDSATKER': '500104',
      'NMSATKER': 'KPPN SEMARANG I PENYALUR DANA TRANSFER UMUM',
      'NMJABATAN': 'Pejabat Penanda Tangan Surat Perintah Membayar',
      'NO_SERTIFIKAT': 'Tidak Ada',
      'TGL_SERTIFIKAT': ''
    },
    {
      'NIP': '85101460',
      'NAMA': 'LUTFI',
      'KDSATKER': '643187',
      'NMSATKER': 'DITLANTAS POLDA JATENG',
      'NMJABATAN': 'Bendahara Penerimaan',
      'NO_SERTIFIKAT': 'Tidak Ada',
      'TGL_SERTIFIKAT': ''
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sertifikasi Pejabat');
  
  XLSX.writeFile(workbook, 'Template_Excel_Sertifikasi_Pejabat_KPPN026.xlsx');
}

export async function processSertifikasiExcel(file: File): Promise<{
  pejabatList: any[];
  log: UploadLog;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawRows || rawRows.length === 0) {
          throw new Error('File Excel Sertifikasi kosong.');
        }

        const pejabatList: any[] = [];
        let count = 0;

        rawRows.forEach((row, idx) => {
          const getVal = (...keys: string[]): any => {
            const rowKeys = Object.keys(row);
            for (const k of keys) {
              const matchedKey = rowKeys.find(rk => 
                rk.toLowerCase().replace(/[^a-z0-9]/g, '') === k.toLowerCase().replace(/[^a-z0-9]/g, '')
              );
              if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== '') {
                return row[matchedKey];
              }
            }
            return '';
          };

          const nip = cleanText(getVal('nip', 'nipofficer', 'nippejabat'));
          const nama = cleanText(getVal('namapejabat', 'nama', 'nmpejabat')) || `Pejabat Satker ${idx + 1}`;
          const kdSatker = cleanText(getVal('kodesatker', 'kdsatker', 'satker', 'kode')).padStart(6, '0');
          const nmSatker = cleanText(getVal('namasatker', 'nmsatker', 'satker')) || `SATKER KPPN ${kdSatker}`;
          const nmJabatan = cleanText(getVal('namajabatan', 'nmjabatan', 'jabatan', 'role')) || 'Pejabat Perbendaharaan';
          let noSertifikat = cleanText(getVal('nomorsertifikat', 'nosertifikat', 'sertifikat', 'nosert'));
          const tglSertifikat = cleanText(getVal('tanggalsertifikat', 'tglsertifikat', 'tglterbit'));
          const tglKadaluarsa = cleanText(getVal('tanggalkadaluarsa', 'tglkadaluarsa', 'exp'));
          const statusJabatan = cleanText(getVal('statusjabatan', 'stsjabatan')) || 'Aktif';
          const statusUsulan = cleanText(getVal('statususulan', 'usulan')) || (noSertifikat ? 'Belum Diusulkan' : 'Belum rekam usulan');
          const kppn = cleanText(getVal('kppn', 'namakppn')) || 'SEMARANG I';
          const kl = cleanText(getVal('kl', 'kementerianlembaga', 'kementerian'));
          const tglDownload = cleanText(getVal('tanggaldownload', 'tgldownload')) || new Date().toLocaleDateString('id-ID');

          let kategoriData: 'BELUM_SERTIFIKAT' | 'BELUM_PERPANJANGAN' | 'TERSERTIFIKASI_AKTIF' = 'BELUM_SERTIFIKAT';
          let statusSertifikasi: 'Belum Tersertifikasi' | 'Belum Perpanjangan' | 'Tersertifikasi' | 'Kadaluarsa' = 'Belum Tersertifikasi';
          let sisaHari = 0;
          let isKadaluarsa = false;
          let isMendekatiKadaluarsa = false;

          if (tglKadaluarsa || (noSertifikat && noSertifikat !== '-' && noSertifikat.toUpperCase() !== 'BELUM ADA' && noSertifikat.toUpperCase() !== 'TIDAK ADA')) {
            kategoriData = 'BELUM_PERPANJANGAN';
            statusSertifikasi = 'Belum Perpanjangan';

            if (tglKadaluarsa) {
              let expDate: Date | null = null;
              if (tglKadaluarsa.includes('-')) {
                const parts = tglKadaluarsa.split('-');
                if (parts[0].length === 4) {
                  expDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                } else if (parts[2].length === 4) {
                  expDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
                }
              } else if (tglKadaluarsa.includes('/')) {
                const parts = tglKadaluarsa.split('/');
                if (parts[2].length === 4) {
                  expDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
                }
              }

              if (expDate && !isNaN(expDate.getTime())) {
                const today = new Date();
                const diffTime = expDate.getTime() - today.getTime();
                sisaHari = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (sisaHari <= 0) {
                  isKadaluarsa = true;
                  statusSertifikasi = 'Kadaluarsa';
                } else if (sisaHari <= 60) {
                  isMendekatiKadaluarsa = true;
                }
              }
            }
          } else {
            kategoriData = 'BELUM_SERTIFIKAT';
            statusSertifikasi = 'Belum Tersertifikasi';
            noSertifikat = 'Belum Ada';
          }

          let catatanRekomendasi = '';
          if (kategoriData === 'BELUM_SERTIFIKAT') {
            if (statusUsulan.toLowerCase().includes('antrean diklat') || statusUsulan.toLowerCase().includes('antrean')) {
              catatanRekomendasi = 'Pantau pemanggilan diklat e-learning / antrean diklat pada portal SWIPE-AP.';
            } else if (statusUsulan.toLowerCase().includes('verifikasi')) {
              catatanRekomendasi = 'Berkas usulan dalam verifikasi unit pembina SIMASPATEN. Cek notifikasi berkala.';
            } else if (statusUsulan.toLowerCase().includes('jadwal') || statusUsulan.toLowerCase().includes('uji kompetensi') || statusUsulan.toLowerCase().includes('ujian')) {
              catatanRekomendasi = 'Pejabat dijadwalkan Ujian Kompetensi. Harap hadir tepat waktu sesuai jadwal SIMASPATEN.';
            } else {
              catatanRekomendasi = 'Segera rekam usulan kepesertaan penilaian kompetensi pejabat melalui aplikasi SIMASPATEN.';
            }
          } else {
            if (statusJabatan.toLowerCase() === 'aktif') {
              if (isKadaluarsa) {
                catatanRekomendasi = 'URGENT: Pejabat Aktif masa berlaku telah habis. Segera rekam perpanjangan di SIMASPATEN!';
              } else if (isMendekatiKadaluarsa) {
                catatanRekomendasi = `PRIORITAS TINGGI: Sisa waktu ${sisaHari} hari. Segera rekam perpanjangan di SIMASPATEN.`;
              } else {
                catatanRekomendasi = 'Siapkan portofolio PPL dan rekam usulan perpanjangan di SIMASPATEN.';
              }
            } else {
              catatanRekomendasi = 'Pejabat Non-Aktif. Dapat diajukan perpanjangan di SIMASPATEN jika ditugaskan kembali.';
            }
          }

          pejabatList.push({
            id: `pejabat-excel-${Date.now()}-${idx}`,
            nomor: idx + 1,
            nip: nip || `198001012005011${String(idx).padStart(3, '0')}`,
            nama,
            kdSatker,
            nmSatker,
            nmJabatan,
            noSertifikat,
            tglSertifikat,
            tglKadaluarsa,
            statusJabatan,
            statusUsulan,
            status: statusSertifikasi,
            statusSertifikasi,
            kategoriData,
            kppn,
            tglDownload,
            sisaHariMasaBerlaku: sisaHari,
            isKadaluarsa,
            isMendekatiKadaluarsa,
            kementerianLembaga: kl,
            catatanRekomendasi,
            keterangan: `${statusSertifikasi} - ${statusUsulan}`
          });
          count++;
        });

        const uploadLog: UploadLog = {
          id: `log-sert-${Date.now()}`,
          fileName: file.name,
          uploadDate: new Date().toLocaleString('id-ID'),
          rowCount: rawRows.length,
          cleanedCount: count,
          status: 'Success',
          notes: [`Berhasil mengimpor ${count} data Pejabat Perbendaharaan (Belum Tersertifikasi & Belum Perpanjangan).`]
        };

        resolve({ pejabatList, log: uploadLog });
      } catch (err: any) {
        reject(new Error(err.message || 'Gagal membaca file Excel Sertifikasi Pejabat.'));
      }
    };
    reader.onerror = () => reject(new Error('Gagal membaca file dari disk.'));
    reader.readAsArrayBuffer(file);
  });
}



export function exportSatkersToExcel(satkers: SatkerIKPA[], fileName: string = 'Data_Satker_IKPA.xlsx') {
  const exportData = satkers.map(s => ({
    'Kode Satker': s.kodeSatker,
    'Nama Satker': s.namaSatker,
    'Kementerian / Lembaga': s.kementerianLembaga,
    'Unit Eselon 1': s.unitEselon1 || 'KPPN Semarang I',
    'Pagu Anggaran (Rp)': s.paguAnggaran,
    'Realisasi Anggaran (Rp)': s.realisasiAnggaran,
    'Persen Penyerapan (%)': s.persenPenyerapan,
    'Total Nilai IKPA': s.nilaiTotalIKPA,
    'Predikat': s.predikat,
    'Status Capaian Output': s.statusCapaianOutput,
    'Revisi DIPA': s.indikator.revisiDipa,
    'Deviasi Hal III DIPA': s.indikator.deviasiHal3Dipa,
    'Penyerapan Anggaran': s.indikator.penyerapanAnggaran,
    'Belanja Kontraktual': s.indikator.belanjaKontraktual,
    'Penyelesaian Tagihan': s.indikator.penyelesaianTagihan,
    'Pengelolaan UP/TUP': s.indikator.pengelolaanUpTup,
    'Dispensasi SPM': s.indikator.dispensasiSpm,
    'Capaian Output': s.indikator.capaianOutput,
    'Nama PIC': s.namaPic || '',
    'No HP PIC': s.noHpPic || '',
    'Email PIC': s.emailPic || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data IKPA Satker');

  const finalFileName = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
  XLSX.writeFile(workbook, finalFileName);
}

export function downloadPasswordBatchTemplate() {
  const sampleData = [
    {
      'Kode Satker': '652189',
      'Nama Satker': 'POLRESTABES SEMARANG',
      'Password Satker': 'smg652189'
    },
    {
      'Kode Satker': '015432',
      'Nama Satker': 'KANWIL KEMENTERIAN AGAMA PROVINSI JAWA TENGAH',
      'Password Satker': 'kemenag015'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Password Satker');
  
  XLSX.writeFile(workbook, 'Template_Batch_Password_Satker.xlsx');
}

export async function processPasswordBatchExcel(file: File): Promise<{
  passwordMap: Record<string, string>;
  count: number;
  log: UploadLog;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawRows || rawRows.length === 0) {
          throw new Error('File Excel Password Satker kosong.');
        }

        const passwordMap: Record<string, string> = {};
        let count = 0;

        rawRows.forEach((row) => {
          const getVal = (...keys: string[]): any => {
            const rowKeys = Object.keys(row);
            for (const k of keys) {
              const matchedKey = rowKeys.find(rk => 
                rk.toLowerCase().replace(/[^a-z0-9]/g, '') === k.toLowerCase().replace(/[^a-z0-9]/g, '')
              );
              if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== '') {
                return row[matchedKey];
              }
            }
            return '';
          };

          const rawKode = cleanText(getVal('kodesatker', 'kode', 'kdsatker')).padStart(6, '0');
          const pass = cleanText(getVal('passwordsatker', 'password', 'pass', 'pinsatker', 'pin'));

          if (rawKode && pass) {
            passwordMap[rawKode] = pass;
            count++;
          }
        });

        const uploadLog: UploadLog = {
          id: `log-pass-${Date.now()}`,
          fileName: file.name,
          uploadDate: new Date().toLocaleString('id-ID'),
          rowCount: rawRows.length,
          cleanedCount: count,
          status: 'Success',
          notes: [`Berhasil membaca ${count} password Satker dari file Excel.`]
        };

        resolve({ passwordMap, count, log: uploadLog });
      } catch (err: any) {
        reject(new Error(err.message || 'Gagal membaca file Excel Password Satker.'));
      }
    };
    reader.onerror = () => reject(new Error('Gagal membaca file dari disk.'));
    reader.readAsArrayBuffer(file);
  });
}

export function downloadBroadcastExcelTemplate(satkers: SatkerIKPA[]) {
  const sampleData = (satkers.length > 0 ? satkers : [
    { kodeSatker: '652189', namaSatker: 'POLRESTABES SEMARANG', nilaiTotalIKPA: 71.97, statusCapaianOutput: 'Terlambat', namaPic: '', noHpPic: '' }
  ]).map(s => ({
    'Kode Satker': s.kodeSatker,
    'Nama Satker': s.namaSatker,
    'Target Role': 'KPA / PPK / PPSPM',
    'Nama Pejabat Target': s.namaPic || '',
    'No HP Target': s.noHpPic || '',
    'Nilai IKPA': s.nilaiTotalIKPA,
    'Pesan Khusus Custom': `Yth. Pimpinan/Pejabat Satker ${s.namaSatker} (${s.kodeSatker}), terima kasih atas sinergi bersama. Nilai IKPA Anda periode ini adalah ${s.nilaiTotalIKPA} dengan predikat ${s.predikat}.`,
    'Catatan Admin': ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Broadcast Satker');
  
  XLSX.writeFile(workbook, 'Template_Excel_Custom_Broadcast_Satker.xlsx');
}

export async function processBroadcastExcel(file: File): Promise<{
  broadcastList: any[];
  count: number;
  log: UploadLog;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawRows || rawRows.length === 0) {
          throw new Error('File Excel Broadcast kosong.');
        }

        const broadcastList: any[] = [];
        let count = 0;

        rawRows.forEach((row, idx) => {
          const getVal = (...keys: string[]): any => {
            const rowKeys = Object.keys(row);
            for (const k of keys) {
              const matchedKey = rowKeys.find(rk => 
                rk.toLowerCase().replace(/[^a-z0-9]/g, '') === k.toLowerCase().replace(/[^a-z0-9]/g, '')
              );
              if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== '') {
                return row[matchedKey];
              }
            }
            return '';
          };

          const kodeSatker = cleanText(getVal('kodesatker', 'kode', 'kdsatker')).padStart(6, '0');
          const namaSatker = cleanText(getVal('namasatker', 'satker', 'nmsatker')) || `SATKER ${kodeSatker}`;
          const targetRole = cleanText(getVal('targetrole', 'role', 'jabatan', 'peran')) || 'Pejabat';
          const namaPejabat = cleanText(getVal('namapejabattarget', 'namapejabat', 'nama')) || '';
          const noHpTarget = cleanText(getVal('nohptarget', 'nohp', 'wa', 'telepon')) || '';
          const customMessage = cleanText(getVal('pesankhususcustom', 'pesankhusus', 'pesan', 'custommessage', 'text'));
          const nilaiIkpa = parseFormattedNumber(getVal('nilaiikpa', 'ikpa'), 0);
          const catatanKhusus = cleanText(getVal('catatanadmin', 'catatan'));

          if (kodeSatker) {
            broadcastList.push({
              id: `broadcast-excel-${Date.now()}-${idx}`,
              kodeSatker,
              namaSatker,
              targetRole,
              namaPejabat,
              noHpTarget,
              customMessage,
              nilaiIkpa,
              catatanKhusus
            });
            count++;
          }
        });

        const uploadLog: UploadLog = {
          id: `log-bcast-${Date.now()}`,
          fileName: file.name,
          uploadDate: new Date().toLocaleString('id-ID'),
          rowCount: rawRows.length,
          cleanedCount: count,
          status: 'Success',
          notes: [`Berhasil mengimpor ${count} pesan broadcast khusus Satker dari Excel.`]
        };

        resolve({ broadcastList, count, log: uploadLog });
      } catch (err: any) {
        reject(new Error(err.message || 'Gagal membaca file Excel Broadcast.'));
      }
    };
    reader.onerror = () => reject(new Error('Gagal membaca file dari disk.'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Download Template Excel Master Data Satker
 * Format Kolom H (Kode Satker), Kolom I (Nama Satker), Kolom J (Status Aktif)
 * Sesuai referensi: https://docs.google.com/spreadsheets/d/1ze5IoKiFUgiehhnceOUh8OouyIt6LQT-
 */
export function downloadMasterSatkerTemplate() {
  const sampleData = [
    {
      'No': 1,
      'Kode BA': '015',
      'Kementerian / Lembaga': 'KEMENTERIAN KEUANGAN',
      'Kode Eselon 1': '08',
      'Unit Eselon 1': 'DIREKTORAT JENDERAL PAJAK',
      'Kode KPPN': '026',
      'Nama KPPN': 'KPPN SEMARANG I',
      'Kode Satker': '651046',
      'Nama Satker': 'KANTOR PELAYANAN PAJAK PRATAMA SEMARANG CANDISARI',
      'Status Aktif': 'AKTIF',
      'Password Satker': 'KPPN026#651046',
      'Nama PIC': 'Budi Santoso',
      'No HP PIC': '081234567890',
      'Email PIC': 'kpp.candisari@pajak.go.id'
    },
    {
      'No': 2,
      'Kode BA': '060',
      'Kementerian / Lembaga': 'KEPOLISIAN NEGARA REPUBLIK INDONESIA',
      'Kode Eselon 1': '01',
      'Unit Eselon 1': 'POLRI',
      'Kode KPPN': '026',
      'Nama KPPN': 'KPPN SEMARANG I',
      'Kode Satker': '652189',
      'Nama Satker': 'POLRESTABES SEMARANG',
      'Status Aktif': 'AKTIF',
      'Password Satker': 'KPPN026#652189',
      'Nama PIC': 'Agus Prasetyo',
      'No HP PIC': '081298765432',
      'Email PIC': 'polrestabes.semarang@polri.go.id'
    },
    {
      'No': 3,
      'Kode BA': '025',
      'Kementerian / Lembaga': 'KEMENTERIAN AGAMA',
      'Kode Eselon 1': '04',
      'Unit Eselon 1': 'DITJEN BIMAS ISLAM',
      'Kode KPPN': '026',
      'Nama KPPN': 'KPPN SEMARANG I',
      'Kode Satker': '416075',
      'Nama Satker': 'KANTOR KEMENTERIAN AGAMA KOTA SEMARANG',
      'Status Aktif': 'AKTIF',
      'Password Satker': 'KPPN026#416075',
      'Nama PIC': 'Dra. Siti Rahmah',
      'No HP PIC': '081323456789',
      'Email PIC': 'kemenag.semarangkota@kemenag.go.id'
    },
    {
      'No': 4,
      'Kode BA': '018',
      'Kementerian / Lembaga': 'KEMENTERIAN PERTANIAN',
      'Kode Eselon 1': '03',
      'Unit Eselon 1': 'BADAN KARANTINA INDONESIA',
      'Kode KPPN': '026',
      'Nama KPPN': 'KPPN SEMARANG I',
      'Kode Satker': '543210',
      'Nama Satker': 'BALAI KARANTINA HEWAN, IKAN, DAN TUMBUHAN JATENG (INAKTIF)',
      'Status Aktif': 'NONAKTIF',
      'Password Satker': 'KPPN026#543210',
      'Nama PIC': 'Ir. Hendro Wijaya',
      'No HP PIC': '081567890123',
      'Email PIC': 'karantina.jateng@pertanian.go.id'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  
  // Set explicit column widths
  worksheet['!cols'] = [
    { wch: 6 },  // A: No
    { wch: 10 }, // B: Kode BA
    { wch: 38 }, // C: Kementerian / Lembaga
    { wch: 14 }, // D: Kode Eselon 1
    { wch: 32 }, // E: Unit Eselon 1
    { wch: 12 }, // F: Kode KPPN
    { wch: 20 }, // G: Nama KPPN
    { wch: 15 }, // H: KODE SATKER (Penting)
    { wch: 50 }, // I: NAMA SATKER (Penting)
    { wch: 16 }, // J: STATUS AKTIF (Penting: AKTIF / NONAKTIF)
    { wch: 20 }, // K: Password
    { wch: 22 }, // L: PIC
    { wch: 18 }, // M: No HP
    { wch: 30 }  // N: Email
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Master Data Satker');
  
  XLSX.writeFile(workbook, 'Template_Master_Data_Satker_KPPN026.xlsx');
}

/**
 * Process Excel file for Master Data Satker
 * Specifically supports Column H (Kode Satker), Column I (Nama Satker), Column J (Status Aktif)
 * as well as auto-detecting headers like KD_SATKER, NM_SATKER, STATUS/AKTIF.
 */
export async function processMasterSatkerExcel(file: File): Promise<{
  masterSatkers: MasterSatker[];
  activeCount: number;
  nonActiveCount: number;
  log: UploadLog;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // 1. Convert to 2D Array Matrix for positional & header inspection
        const matrix: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        if (!matrix || matrix.length === 0) {
          throw new Error('File Excel Master Satker kosong atau tidak berisi data.');
        }

        // Find Header Row Index and map column positions
        let headerRowIdx = -1;
        let colKodeIdx = 7;   // Default Column H (0-indexed 7)
        let colNamaIdx = 8;   // Default Column I (0-indexed 8)
        let colAktifIdx = 9;  // Default Column J (0-indexed 9)
        let colBaIdx = 1;     // Column B
        let colKlIdx = 2;     // Column C
        let colEs1Idx = 4;    // Column E
        let colKppnIdx = 5;   // Column F
        let colNamaKppnIdx = 6; // Column G
        let colPassIdx = 10;  // Column K
        let colPicIdx = 11;
        let colHpIdx = 12;
        let colEmailIdx = 13;

        // Inspect first 20 rows to detect header labels dynamically
        for (let r = 0; r < Math.min(20, matrix.length); r++) {
          const row = matrix[r];
          if (!row || !Array.isArray(row)) continue;

          const rowClean = row.map(c => String(c || '').toLowerCase().replace(/[^a-z0-9]/g, ''));
          const hasKodeHeader = rowClean.some(c => c === 'kodesatker' || c === 'kdsatker' || c === 'kdsatkerinduk' || c === 'satker');
          const hasNamaHeader = rowClean.some(c => c === 'namasatker' || c === 'nmsatker' || c === 'satkernama');

          if (hasKodeHeader || (hasNamaHeader && rowClean.some(c => c === 'status' || c === 'aktif' || c === 'statusaktif'))) {
            headerRowIdx = r;
            // Map exact column positions based on this header row
            rowClean.forEach((cellStr, idx) => {
              if (['kodesatker', 'kdsatker', 'kd_satker', 'kodesatkerinduk'].includes(cellStr)) colKodeIdx = idx;
              else if (['namasatker', 'nmsatker', 'nm_satker', 'satkernama'].includes(cellStr)) colNamaIdx = idx;
              else if (['statusaktif', 'status', 'aktif', 'isactive', 'keaktifan', 'stsatker'].includes(cellStr)) colAktifIdx = idx;
              else if (['kodeba', 'kdba', 'kd_ba', 'ba'].includes(cellStr)) colBaIdx = idx;
              else if (['kementerianlembaga', 'kementerian', 'lembaga', 'kl', 'namaba', 'nmba'].includes(cellStr)) colKlIdx = idx;
              else if (['uniteselon1', 'eselon1', 'es1', 'nmeselon1', 'unit'].includes(cellStr)) colEs1Idx = idx;
              else if (['kodekppn', 'kdkppn', 'kppn'].includes(cellStr)) colKppnIdx = idx;
              else if (['namakppn', 'nmkppn'].includes(cellStr)) colNamaKppnIdx = idx;
              else if (['passwordsatker', 'password', 'pass', 'pin'].includes(cellStr)) colPassIdx = idx;
              else if (['namapic', 'pic', 'pejabat', 'kontak'].includes(cellStr)) colPicIdx = idx;
              else if (['nohppic', 'nohp', 'wa', 'hp', 'telepon'].includes(cellStr)) colHpIdx = idx;
              else if (['emailpic', 'email'].includes(cellStr)) colEmailIdx = idx;
            });
            break;
          }
        }

        // Also fallback to sheet_to_json if matrix header detection was at row 0 or none
        const startDataRow = headerRowIdx >= 0 ? headerRowIdx + 1 : 1;
        const masterSatkers: MasterSatker[] = [];
        const seenKodes = new Set<string>();
        let activeCount = 0;
        let nonActiveCount = 0;

        for (let r = startDataRow; r < matrix.length; r++) {
          const row = matrix[r];
          if (!row || !Array.isArray(row) || row.length === 0) continue;

          // 1. Extract Kode Satker
          let rawKode = String(row[colKodeIdx] !== undefined ? row[colKodeIdx] : '').trim();
          // If empty in colKodeIdx, check if any cell contains a 6-digit number
          if (!rawKode) {
            for (let c = 0; c < row.length; c++) {
              const val = String(row[c] || '').trim();
              if (/^\d{6}$/.test(val)) {
                rawKode = val;
                break;
              }
            }
          }

          // Clean Kode Satker (extract 6 digits or clean text)
          let cleanKode = rawKode.replace(/[^0-9]/g, '');
          if (cleanKode.length > 6) {
            // Take the 6-digit satker code portion if format is like 018.01.651046
            const match = rawKode.match(/(\d{6})/);
            if (match) cleanKode = match[1];
            else cleanKode = cleanKode.slice(-6);
          }
          if (cleanKode.length < 6 && cleanKode.length > 0) {
            cleanKode = cleanKode.padStart(6, '0');
          }

          // 2. Extract Nama Satker
          let rawNama = cleanText(row[colNamaIdx] !== undefined ? row[colNamaIdx] : '');
          if (!rawNama) {
            // Check adjacent cells
            for (let c = 0; c < row.length; c++) {
              if (c === colKodeIdx) continue;
              const val = cleanText(row[c]);
              if (val.length > 5 && isNaN(Number(val)) && !val.toLowerCase().includes('kppn') && !val.toLowerCase().includes('kemen')) {
                rawNama = val;
                break;
              }
            }
          }

          // Skip empty or invalid rows (headers, totals, remarks)
          if (!cleanKode && !rawNama) continue;
          if (rawNama.toUpperCase().startsWith('TOTAL') || rawNama.toUpperCase().startsWith('JUMLAH') || rawNama.toUpperCase().startsWith('KETERANGAN')) {
            continue;
          }

          if (!cleanKode) {
            // Fallback if no numeric code: generate temporary identifier
            continue;
          }

          if (seenKodes.has(cleanKode)) {
            // Duplicate row in file, skip or update
            continue;
          }
          seenKodes.add(cleanKode);

          // 3. Extract Status Aktif (Column J)
          const rawStatus = cleanText(row[colAktifIdx] !== undefined ? row[colAktifIdx] : '').toUpperCase();
          let isActive = true;
          if (
            rawStatus === 'NONAKTIF' || 
            rawStatus === 'TIDAK AKTIF' || 
            rawStatus === 'NON AKTIF' || 
            rawStatus === 'TIDAK' || 
            rawStatus === 'N' || 
            rawStatus === 'NO' || 
            rawStatus === '0' || 
            rawStatus === 'FALSE' || 
            rawStatus === 'INAKTIF' || 
            rawStatus === 'PASIF' ||
            rawStatus === 'TUTUP'
          ) {
            isActive = false;
          } else {
            // 'AKTIF', 'Y', 'YA', '1', 'TRUE', 'ACTIVE', 'V' or default blank
            isActive = true;
          }

          if (isActive) activeCount++;
          else nonActiveCount++;

          // 4. Extract Supporting Columns
          const kodeBa = cleanText(row[colBaIdx] || '').padStart(3, '0');
          let kementerianLembaga = cleanText(row[colKlIdx] || '');
          if (!kementerianLembaga) {
            if (rawNama.includes('KEPOLISIAN') || rawNama.includes('POLRES') || rawNama.includes('POLDA')) {
              kementerianLembaga = 'KEPOLISIAN NEGARA REPUBLIK INDONESIA';
            } else if (rawNama.includes('PAJAK') || rawNama.includes('BEA CUKAI') || rawNama.includes('KPKNL')) {
              kementerianLembaga = 'KEMENTERIAN KEUANGAN';
            } else if (rawNama.includes('AGAMA') || rawNama.includes('KUA') || rawNama.includes('MAN ') || rawNama.includes('MTsN')) {
              kementerianLembaga = 'KEMENTERIAN AGAMA';
            } else if (rawNama.includes('PENGADILAN') || rawNama.includes('MAHKAMAH')) {
              kementerianLembaga = 'MAHKAMAH AGUNG';
            } else if (rawNama.includes('KEJAKSAAN')) {
              kementerianLembaga = 'KEJAKSAAN REPUBLIK INDONESIA';
            } else if (rawNama.includes('BPS') || rawNama.includes('STATISTIK')) {
              kementerianLembaga = 'BADAN PUSAT STATISTIK';
            } else if (rawNama.includes('KPU') || rawNama.includes('PEMILIHAN')) {
              kementerianLembaga = 'KOMISI PEMILIHAN UMUM';
            } else {
              kementerianLembaga = 'KEMENTERIAN / LEMBAGA MITRA';
            }
          }

          const unitEselon1 = cleanText(row[colEs1Idx] || '') || 'KPPN Semarang I';
          const kodeKppn = cleanText(row[colKppnIdx] || '026');
          const namaKppn = cleanText(row[colNamaKppnIdx] || 'KPPN SEMARANG I');
          const passwordSatker = cleanText(row[colPassIdx] || '') || `KPPN026#${cleanKode}`;
          const namaPic = cleanText(row[colPicIdx] || '');
          const noHpPic = cleanText(row[colHpIdx] || '');
          const emailPic = cleanText(row[colEmailIdx] || '');

          masterSatkers.push({
            id: `master-satker-${cleanKode}`,
            kodeSatker: cleanKode,
            namaSatker: rawNama || `SATKER KPPN ${cleanKode}`,
            isActive,
            kementerianLembaga,
            kodeBa: kodeBa !== '000' ? kodeBa : undefined,
            unitEselon1,
            kodeKppn,
            namaKppn,
            passwordSatker,
            namaPic: namaPic || undefined,
            noHpPic: noHpPic || undefined,
            emailPic: emailPic || undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }

        if (masterSatkers.length === 0) {
          throw new Error('Tidak ditemukan baris data Satker yang valid dalam file Excel. Pastikan Kolom H berisi Kode Satker dan Kolom I berisi Nama Satker.');
        }

        const uploadLog: UploadLog = {
          id: `log-master-${Date.now()}`,
          fileName: file.name,
          uploadDate: new Date().toLocaleString('id-ID'),
          rowCount: matrix.length,
          cleanedCount: masterSatkers.length,
          status: 'Success',
          notes: [
            `Berhasil memproses ${masterSatkers.length} Master Data Satker.`,
            `Status Keaktifan: ${activeCount} Satker AKTIF (Tampil di Dashboard), ${nonActiveCount} Satker NONAKTIF (Disembunyikan).`,
            `Data Master ini dijadikan acuan penyaringan (source of truth) untuk seluruh data IKPA dan Capaian Output.`
          ]
        };

        resolve({
          masterSatkers,
          activeCount,
          nonActiveCount,
          log: uploadLog
        });
      } catch (err: any) {
        reject(new Error(err.message || 'Gagal membaca file Excel Master Data Satker.'));
      }
    };
    reader.onerror = () => reject(new Error('Gagal membaca file Excel dari media penyimpanan.'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Export Master Data Satker to Excel
 */
export function exportMasterSatkerToExcel(masterSatkers: MasterSatker[], fileName: string = 'Master_Data_Satker_KPPN026.xlsx') {
  const exportData = masterSatkers.map((s, idx) => ({
    'No': idx + 1,
    'Kode BA': s.kodeBa || '',
    'Kementerian / Lembaga': s.kementerianLembaga || '',
    'Unit Eselon 1': s.unitEselon1 || '',
    'Kode KPPN': s.kodeKppn || '026',
    'Nama KPPN': s.namaKppn || 'KPPN SEMARANG I',
    'Kode Satker': s.kodeSatker,
    'Nama Satker': s.namaSatker,
    'Status Aktif': s.isActive ? 'AKTIF' : 'NONAKTIF',
    'Password Satker': s.passwordSatker || `KPPN026#${s.kodeSatker}`,
    'Nama PIC': s.namaPic || '',
    'No HP PIC': s.noHpPic || '',
    'Email PIC': s.emailPic || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 10 },
    { wch: 38 },
    { wch: 30 },
    { wch: 12 },
    { wch: 20 },
    { wch: 15 },
    { wch: 50 },
    { wch: 15 },
    { wch: 20 },
    { wch: 20 },
    { wch: 18 },
    { wch: 30 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Master Data Satker');

  const finalFileName = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
  XLSX.writeFile(workbook, finalFileName);
}

