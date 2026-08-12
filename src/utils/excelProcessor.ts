import * as XLSX from 'xlsx';
import { SatkerIKPA, UploadLog } from '../types';
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

export async function processExcelFile(file: File): Promise<ProcessedExcelResult> {
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

        // 1. Detect Month / Periode from top 15 rows or filename
        let detectedMonth = '';
        const monthsList = [
          'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
          'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];

        for (let i = 0; i < Math.min(15, matrix.length); i++) {
          if (!matrix[i]) continue;
          const rowStr = matrix[i].join(' ');
          monthsList.forEach(m => {
            if (rowStr.toLowerCase().includes(m.toLowerCase()) && !detectedMonth) {
              detectedMonth = m;
            }
          });
        }

        if (!detectedMonth) {
          monthsList.forEach(m => {
            if (file.name.toLowerCase().includes(m.toLowerCase()) && !detectedMonth) {
              detectedMonth = m;
            }
          });
        }

        if (!detectedMonth) {
          detectedMonth = 'Januari';
        }

        const periodeFormatted = `${detectedMonth} 2026`;

        // Check if Caput format specifically
        let isCaputFormat = false;
        let caputHeaderRow = -1;

        for (let i = 0; i < Math.min(20, matrix.length); i++) {
          if (!matrix[i]) continue;
          const rowStr = matrix[i].map(c => String(c).toLowerCase()).join(' ');
          if (
            rowStr.includes('rekap kertas kerja capaian output') ||
            (rowStr.includes('kode satker') && (rowStr.includes('data masuk') || rowStr.includes('konfirmasi capaian output')))
          ) {
            isCaputFormat = true;
            caputHeaderRow = i;
            break;
          }
        }

        const cleanedSatkers: SatkerIKPA[] = [];
        let cleanedCount = 0;
        let recomputedTotalCount = 0;
        const notes: string[] = [];

        if (isCaputFormat && caputHeaderRow !== -1) {
          let colKode = -1, colNama = -1, colPersen = -1;
          
          if (matrix[caputHeaderRow]) {
            matrix[caputHeaderRow].forEach((colVal: any, cIdx: number) => {
              const cStr = String(colVal).toLowerCase();
              if (cStr.includes('kode satker') || cStr.includes('kdsatker')) colKode = cIdx;
              if (cStr.includes('nama satker') || cStr.includes('nmsatker') || cStr.includes('uraian')) colNama = cIdx;
              if (cStr.includes('data masuk') || cStr.includes('upload') || cStr.includes('persen')) colPersen = cIdx;
            });
          }

          let zeroCaputCount = 0;
          let terlaporkanCaputCount = 0;

          for (let r = caputHeaderRow + 1; r < matrix.length; r++) {
            const row = matrix[r];
            if (!row || row.length === 0) continue;

            // Find 6 digit code in row if colKode is -1 or row[colKode] invalid
            let rawKode = colKode !== -1 ? String(row[colKode] || '').trim() : '';
            if (!rawKode || !/^\d{5,6}$/.test(rawKode)) {
              for (let c = 0; c < row.length; c++) {
                const cellStr = String(row[c] || '').trim();
                if (/^\d{5,6}$/.test(cellStr)) {
                  rawKode = cellStr;
                  if (colNama === -1 && row[c + 1]) colNama = c + 1;
                  break;
                }
              }
            }

            if (rawKode && /^\d{5,6}$/.test(rawKode)) {
              const kodeSatker = rawKode.padStart(6, '0');
              const namaSatker = colNama !== -1 ? cleanText(row[colNama] || '') : `SATKER ${kodeSatker}`;
              const rawPersenStr = String(colPersen !== -1 && row[colPersen] !== undefined ? row[colPersen] : '').trim();
              const persenDataMasuk = parseFormattedNumber(rawPersenStr, 0);

              let statusCapaianOutput: SatkerIKPA['statusCapaianOutput'] = 'Sudah Terlaporkan';
              let capaianOutputScore = persenDataMasuk;

              if (persenDataMasuk === 0) {
                statusCapaianOutput = 'Belum Terlaporkan';
                capaianOutputScore = 0;
                zeroCaputCount++;
              } else if (persenDataMasuk < 95) {
                statusCapaianOutput = 'Terlambat';
                terlaporkanCaputCount++;
              } else {
                statusCapaianOutput = 'Sudah Terlaporkan';
                capaianOutputScore = 100;
                terlaporkanCaputCount++;
              }

              const indikatorObj = {
                revisiDipa: 100,
                deviasiHal3Dipa: 100,
                penyerapanAnggaran: 85,
                belanjaKontraktual: 100,
                penyelesaianTagihan: 90,
                pengelolaanUpTup: 90,
                dispensasiSpm: 100,
                capaianOutput: capaianOutputScore
              };

              const nilaiTotalIKPA = hitungTotalIKPA(indikatorObj);
              const predikat = getPredikatIKPA(nilaiTotalIKPA);

              const paguAnggaran = (10 + (cleanedCount % 20) * 5) * 1000000000;
              const realisasiAnggaran = Math.round(paguAnggaran * 0.85);

              const issues: string[] = [];
              if (statusCapaianOutput === 'Belum Terlaporkan' || persenDataMasuk === 0) {
                issues.push('Capaian Output 0% (Belum Mengirim Capaian Output ke SAKTI)');
              } else if (statusCapaianOutput === 'Terlambat') {
                issues.push(`Pengiriman Capaian Output Terlambat (${persenDataMasuk}%)`);
              }

              if (nilaiTotalIKPA < 87.5) {
                issues.push(`Nilai IKPA (${nilaiTotalIKPA}) Di Bawah Target KPPN (≥87.5)`);
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
                persenPenyerapan: 85.0,
                statusCapaianOutput,
                indikator: indikatorObj,
                nilaiTotalIKPA,
                predikat,
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
          // 1. Scan rows to build dynamic column map
          let headerRowIdx = -1;
          for (let i = 0; i < Math.min(25, matrix.length); i++) {
            if (!matrix[i]) continue;
            const rowStr = matrix[i].map(c => String(c).toLowerCase()).join(' ');
            if (
              rowStr.includes('kode') || 
              rowStr.includes('satker') || 
              rowStr.includes('indikator') || 
              rowStr.includes('revisi') || 
              rowStr.includes('penyerapan') ||
              rowStr.includes('ikpa')
            ) {
              headerRowIdx = i;
              break;
            }
          }

          if (headerRowIdx === -1) headerRowIdx = 0;

          // Combine headers across row -1, row 0, row +1 to handle multi-level merged headers
          const rawHeaders: string[] = [];
          const maxCols = Math.max(...matrix.slice(0, Math.min(30, matrix.length)).map(r => r ? r.length : 0));

          for (let c = 0; c < maxCols; c++) {
            let combined = '';
            for (let r = Math.max(0, headerRowIdx - 1); r <= Math.min(matrix.length - 1, headerRowIdx + 2); r++) {
              if (matrix[r] && matrix[r][c] !== undefined && matrix[r][c] !== '') {
                combined += ' ' + String(matrix[r][c]);
              }
            }
            rawHeaders.push(combined.toLowerCase());
          }

          const colMap = {
            kode: -1,
            nama: -1,
            revisi: -1,
            deviasi: -1,
            penyerapan: -1,
            kontraktual: -1,
            tagihan: -1,
            uptup: -1,
            dispensasi: -1,
            capaian: -1,
            nilaiTotal: -1,
            pagu: -1,
            realisasi: -1,
            kl: -1,
            statusCaput: -1,
            picNama: -1,
            picHp: -1,
            picEmail: -1
          };

          rawHeaders.forEach((h, colIdx) => {
            const cleanH = h.replace(/[^a-z0-9]/g, '');

            if (colMap.kode === -1 && (cleanH.includes('kodesatker') || cleanH.includes('kdsatker') || cleanH.includes('satkercode') || cleanH.includes('kodeba') || (cleanH.includes('kode') && !cleanH.includes('koderincian')))) {
              colMap.kode = colIdx;
            }
            if (colMap.nama === -1 && (cleanH.includes('namasatker') || cleanH.includes('nmsatker') || cleanH.includes('uraiansatker') || cleanH.includes('satkername') || (cleanH.includes('nama') && !cleanH.includes('pic') && !cleanH.includes('pejabat')) || cleanH.includes('uraian'))) {
              colMap.nama = colIdx;
            }
            if (colMap.revisi === -1 && (cleanH.includes('revisidipa') || cleanH.includes('revisi'))) {
              colMap.revisi = colIdx;
            }
            if (colMap.deviasi === -1 && (cleanH.includes('deviasihal3') || cleanH.includes('deviasihaliii') || cleanH.includes('deviasihalaman3') || cleanH.includes('deviasihalamanii') || cleanH.includes('hal3') || cleanH.includes('haliii') || cleanH.includes('deviasi'))) {
              colMap.deviasi = colIdx;
            }
            if (colMap.penyerapan === -1 && (cleanH.includes('penyerapananggaran') || cleanH.includes('penyerapan') || cleanH.includes('persenpenyerapan') || cleanH.includes('serap'))) {
              colMap.penyerapan = colIdx;
            }
            if (colMap.kontraktual === -1 && (cleanH.includes('belanjakontraktual') || cleanH.includes('kontraktual') || cleanH.includes('kontrak'))) {
              colMap.kontraktual = colIdx;
            }
            if (colMap.tagihan === -1 && (cleanH.includes('penyelesaiantagihan') || cleanH.includes('tagihan') || cleanH.includes('spmtagihan'))) {
              colMap.tagihan = colIdx;
            }
            if (colMap.uptup === -1 && (cleanH.includes('pengelolaanuptup') || cleanH.includes('uptup') || cleanH.includes('pengelolaanup'))) {
              colMap.uptup = colIdx;
            }
            if (colMap.dispensasi === -1 && (cleanH.includes('dispensasispm') || cleanH.includes('dispensasi'))) {
              colMap.dispensasi = colIdx;
            }
            if (colMap.capaian === -1 && (cleanH.includes('capaianoutput') || cleanH.includes('datamasuk') || cleanH.includes('progress') || cleanH.includes('persenoutput') || cleanH.includes('capaian'))) {
              colMap.capaian = colIdx;
            }
            if (colMap.nilaiTotal === -1 && (
              cleanH.includes('nilaitotal') ||
              cleanH.includes('nilaiakhir') ||
              cleanH.includes('nilaiikpa') ||
              cleanH.includes('totalikpa') ||
              cleanH.includes('konversibobot') ||
              cleanH.includes('nilaikomposit') ||
              cleanH.includes('totalnilai') ||
              cleanH.includes('ikpaakhir') ||
              cleanH.includes('akhirikpa') ||
              cleanH.includes('ikpatotal') ||
              cleanH.includes('bobotkonversi') ||
              cleanH.includes('nilaikonversi') ||
              (cleanH.includes('nilai') && cleanH.includes('akhir')) ||
              (cleanH.includes('total') && cleanH.includes('nilai')) ||
              (cleanH.includes('konversi') && cleanH.includes('bobot')) ||
              cleanH === 'nilai' ||
              cleanH === 'total' ||
              cleanH === 'akhir' ||
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
            if (colMap.kl === -1 && (cleanH.includes('kementerian') || cleanH.includes('lembaga') || cleanH.includes('kl') || cleanH.includes('bagiananggaran'))) {
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
          });

          // Iterate through data rows starting after headerRowIdx
          for (let r = headerRowIdx + 1; r < matrix.length; r++) {
            const row = matrix[r];
            if (!row || row.length === 0) continue;

            // Extract Kode Satker
            let rawKode = colMap.kode !== -1 ? cleanText(row[colMap.kode]) : '';
            let kodeColIndex = colMap.kode;

            if (!rawKode || !/^\d{5,6}$/.test(rawKode)) {
              for (let c = 0; c < row.length; c++) {
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

            // Extract Nama Satker
            let namaSatker = colMap.nama !== -1 ? cleanText(row[colMap.nama]) : '';
            if (!namaSatker) {
              // Try adjacent cell to kodeSatker
              if (kodeColIndex !== -1 && row[kodeColIndex + 1]) {
                const candidate = cleanText(row[kodeColIndex + 1]);
                if (candidate && !/^\d+$/.test(candidate) && candidate.toUpperCase() !== 'NILAI' && candidate.toUpperCase() !== 'BOBOT') {
                  namaSatker = candidate;
                }
              }
            }
            if (!namaSatker) {
              namaSatker = `SATKER ${kodeSatker}`;
            }

            // Extract Indicators
            const rawRevisi = parseFormattedNumber(colMap.revisi !== -1 ? row[colMap.revisi] : '', -1);
            const rawDeviasi = parseFormattedNumber(colMap.deviasi !== -1 ? row[colMap.deviasi] : '', -1);
            const rawPenyerapan = parseFormattedNumber(colMap.penyerapan !== -1 ? row[colMap.penyerapan] : '', -1);
            const rawKontraktual = parseFormattedNumber(colMap.kontraktual !== -1 ? row[colMap.kontraktual] : '', -1);
            const rawTagihan = parseFormattedNumber(colMap.tagihan !== -1 ? row[colMap.tagihan] : '', -1);
            const rawUpTup = parseFormattedNumber(colMap.uptup !== -1 ? row[colMap.uptup] : '', -1);
            const rawDispensasi = parseFormattedNumber(colMap.dispensasi !== -1 ? row[colMap.dispensasi] : '', -1);
            const rawCapaian = parseFormattedNumber(colMap.capaian !== -1 ? row[colMap.capaian] : '', -1);

            // Auto-detect if columns represent converted weights (e.g. Penyerapan <= 20, Capaian <= 25, Dispensasi <= 5)
            const isWeightedConversion = (rawPenyerapan >= 0 && rawPenyerapan <= 20) &&
                                         (rawCapaian >= 0 && rawCapaian <= 25) &&
                                         (rawDispensasi >= 0 && rawDispensasi <= 5) &&
                                         (rawPenyerapan > 0 || rawCapaian > 0);

            let revisiDipa = 100;
            let deviasiHal3Dipa = 100;
            let penyerapanAnggaran = 85;
            let belanjaKontraktual = 100;
            let penyelesaianTagihan = 90;
            let pengelolaanUpTup = 90;
            let dispensasiSpm = 100;
            let capaianOutput = 100;

            if (isWeightedConversion) {
              revisiDipa = rawRevisi >= 0 ? Math.min(100, Number(((rawRevisi / 10) * 100).toFixed(2))) : 100;
              deviasiHal3Dipa = rawDeviasi >= 0 ? Math.min(100, Number(((rawDeviasi / 10) * 100).toFixed(2))) : 100;
              penyerapanAnggaran = rawPenyerapan >= 0 ? Math.min(100, Number(((rawPenyerapan / 20) * 100).toFixed(2))) : 85;
              belanjaKontraktual = rawKontraktual >= 0 ? Math.min(100, Number(((rawKontraktual / 10) * 100).toFixed(2))) : 100;
              penyelesaianTagihan = rawTagihan >= 0 ? Math.min(100, Number(((rawTagihan / 10) * 100).toFixed(2))) : 90;
              pengelolaanUpTup = rawUpTup >= 0 ? Math.min(100, Number(((rawUpTup / 10) * 100).toFixed(2))) : 90;
              dispensasiSpm = rawDispensasi >= 0 ? Math.min(100, Number(((rawDispensasi / 5) * 100).toFixed(2))) : 100;
              capaianOutput = rawCapaian >= 0 ? Math.min(100, Number(((rawCapaian / 25) * 100).toFixed(2))) : 100;
            } else {
              revisiDipa = rawRevisi >= 0 ? rawRevisi : 100;
              deviasiHal3Dipa = rawDeviasi >= 0 ? rawDeviasi : 100;
              penyerapanAnggaran = rawPenyerapan >= 0 ? rawPenyerapan : 85;
              belanjaKontraktual = rawKontraktual >= 0 ? rawKontraktual : 100;
              penyelesaianTagihan = rawTagihan >= 0 ? rawTagihan : 90;
              pengelolaanUpTup = rawUpTup >= 0 ? rawUpTup : 90;
              dispensasiSpm = rawDispensasi >= 0 ? rawDispensasi : 100;
              capaianOutput = rawCapaian >= 0 ? rawCapaian : 100;
            }

            const indikatorObj = {
              revisiDipa,
              deviasiHal3Dipa,
              penyerapanAnggaran,
              belanjaKontraktual,
              penyelesaianTagihan,
              pengelolaanUpTup,
              dispensasiSpm,
              capaianOutput
            };

            let nilaiTotalIKPA = colMap.nilaiTotal !== -1 ? parseFormattedNumber(row[colMap.nilaiTotal], 0) : 0;
            
            // If colMap.nilaiTotal gave 0 or wasn't mapped, scan row for candidate total IKPA cell
            if (nilaiTotalIKPA === 0) {
              for (let c = row.length - 1; c >= 0; c--) {
                const val = parseFormattedNumber(row[c], 0);
                // Total IKPA is a float between 10 and 100 (excluding Kode Satker which is >= 100000)
                if (val > 10 && val <= 100 && c !== colMap.pagu && c !== colMap.realisasi && c !== kodeColIndex) {
                  nilaiTotalIKPA = val;
                  break;
                }
              }
            }

            if (nilaiTotalIKPA === 0) {
              if (isWeightedConversion) {
                const sumWeighted = (rawRevisi >= 0 ? rawRevisi : 10) +
                                    (rawDeviasi >= 0 ? rawDeviasi : 10) +
                                    (rawPenyerapan >= 0 ? rawPenyerapan : 17) +
                                    (rawKontraktual >= 0 ? rawKontraktual : 10) +
                                    (rawTagihan >= 0 ? rawTagihan : 9) +
                                    (rawUpTup >= 0 ? rawUpTup : 9) +
                                    (rawDispensasi >= 0 ? rawDispensasi : 5) +
                                    (rawCapaian >= 0 ? rawCapaian : 25);
                nilaiTotalIKPA = Number(sumWeighted.toFixed(2));
              } else {
                nilaiTotalIKPA = hitungTotalIKPA(indikatorObj);
              }
              recomputedTotalCount++;
            }

            const predikat = getPredikatIKPA(nilaiTotalIKPA);

            const rawStatusStr = colMap.statusCaput !== -1 ? cleanText(row[colMap.statusCaput]).toLowerCase() : '';
            let statusCapaianOutput: SatkerIKPA['statusCapaianOutput'] = 'Sudah Terlaporkan';

            if (capaianOutput === 0 || rawStatusStr.includes('belum') || rawStatusStr.includes('0%')) {
              statusCapaianOutput = 'Belum Terlaporkan';
            } else if (capaianOutput < 95 || rawStatusStr.includes('terlambat')) {
              statusCapaianOutput = 'Terlambat';
            } else {
              statusCapaianOutput = 'Sudah Terlaporkan';
            }

            const paguAnggaran = colMap.pagu !== -1 
              ? parseFormattedNumber(row[colMap.pagu], (10 + (cleanedCount % 20) * 5) * 1000000000)
              : (10 + (cleanedCount % 20) * 5) * 1000000000;

            const realisasiAnggaran = colMap.realisasi !== -1
              ? parseFormattedNumber(row[colMap.realisasi], Math.round(paguAnggaran * (penyerapanAnggaran / 100)))
              : Math.round(paguAnggaran * (penyerapanAnggaran / 100));

            const kementerianLembaga = colMap.kl !== -1 && cleanText(row[colMap.kl])
              ? cleanText(row[colMap.kl])
              : `BA ${row[3] || '015'} - KPPN Semarang I`;

            const issues: string[] = [];
            if (statusCapaianOutput === 'Belum Terlaporkan' || capaianOutput === 0) {
              issues.push('Capaian Output Belum Diselesaikan (0%)');
            } else if (statusCapaianOutput === 'Terlambat') {
              issues.push('Pengiriman Capaian Output Terlambat');
            }

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

            cleanedCount++;
            cleanedSatkers.push({
              id: `excel-${kodeSatker}-${Date.now()}-${cleanedCount}`,
              kodeSatker,
              namaSatker,
              kementerianLembaga,
              unitEselon1: 'Unit Kerja Terkait',
              paguAnggaran,
              realisasiAnggaran,
              persenPenyerapan: penyerapanAnggaran,
              statusCapaianOutput,
              indikator: indikatorObj,
              nilaiTotalIKPA,
              predikat,
              issues,
              namaPic: colMap.picNama !== -1 && cleanText(row[colMap.picNama]) ? cleanText(row[colMap.picNama]) : `Operator ${kodeSatker}`,
              noHpPic: colMap.picHp !== -1 && cleanText(row[colMap.picHp]) ? cleanText(row[colMap.picHp]) : '081234567890',
              emailPic: colMap.picEmail !== -1 && cleanText(row[colMap.picEmail]) ? cleanText(row[colMap.picEmail]) : `satker.${kodeSatker}@kemenkeu.go.id`,
              alamatSatker: 'Kota Semarang',
              periodeUpdate: periodeFormatted,
              riwayatBulanan: [
                {
                  bulan: detectedMonth,
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
          const nmSatker = cleanText(getVal('namasatker', 'nmsatker')) || `SATKER KPPN ${kdSatker}`;
          const nmJabatan = cleanText(getVal('namajabatan', 'nmjabatan', 'jabatan', 'role')) || 'Pejabat Perbendaharaan';
          let noSertifikat = cleanText(getVal('nomorsertifikat', 'nosertifikat', 'sertifikat', 'nosert'));
          if (!noSertifikat || noSertifikat === '-' || noSertifikat === '0') {
            noSertifikat = 'Tidak Ada';
          }
          const tglSertifikat = cleanText(getVal('tanggalsertifikat', 'tglsertifikat', 'tglterbit'));
          const tglKadaluarsa = cleanText(getVal('tanggalkadaluarsa', 'tglkadaluarsa', 'exp'));

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
            tglKadaluarsa
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
          notes: [`Berhasil mengimpor ${count} data Pejabat Perbendaharaan & Sertifikasi PTP/PPK/PPSPM.`]
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
    { kodeSatker: '652189', namaSatker: 'POLRESTABES SEMARANG', nilaiTotalIKPA: 71.97, statusCapaianOutput: 'Terlambat', namaPic: 'Bambang Prasetyo', noHpPic: '081234567890' }
  ]).map(s => ({
    'Kode Satker': s.kodeSatker,
    'Nama Satker': s.namaSatker,
    'Target Role': 'KPA / PPK / PPSPM',
    'Nama Pejabat Target': s.namaPic || 'Pejabat Satker',
    'No HP Target': s.noHpPic || '081234567890',
    'Nilai IKPA': s.nilaiTotalIKPA,
    'Pesan Khusus Custom': `Yth. KPA Satker ${s.namaSatker} (${s.kodeSatker}), terima kasih atas sinergi bersama. Nilai IKPA Anda periode ini adalah ${s.nilaiTotalIKPA} dengan predikat ${s.predikat}.`,
    'Catatan Admin': 'Perlu perhatian khusus'
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
          const namaPejabat = cleanText(getVal('namapejabattarget', 'namapejabat', 'nama')) || 'Bapak/Ibu Pejabat';
          const noHpTarget = cleanText(getVal('nohptarget', 'nohp', 'wa', 'telepon')) || '081234567890';
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
