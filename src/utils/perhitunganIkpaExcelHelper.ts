import * as XLSX from 'xlsx';
import { ExcelSheetData, PerhitunganIkpaExcelReference } from '../types';

/**
 * Data acuan bawaan resmi PER-5/PB/2024 & Reformulasi IKPA 2025
 */
export const DEFAULT_PERHITUNGAN_IKPA_REFERENCE: PerhitunganIkpaExcelReference = {
  id: 'ref-default-per5-2025',
  fileName: 'Acuan_Resmi_Dasar_Perhitungan_IKPA_PER-5_PB_2024_2025.xlsx',
  fileSizeBytes: 42580,
  uploadedAt: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }),
  uploadedBy: 'Administrator KPPN Semarang I (Official DJPb)',
  tahunAnggaran: '2024 / 2025',
  dasarHukum: 'PER-5/PB/2024 & Petunjuk Teknis Reformulasi IKPA DJPb',
  catatanAdmin: 'Acuan standar formula perhitungan IKPA dengan 8 indikator kinerja, matriks bobot resmi, target trajektori triwulanan, dan komponen simulasi satker.',
  totalSheets: 5,
  totalDataRows: 38,
  extractedRules: {
    revisiDipaBobot: 10,
    deviasiHal3Bobot: 15,
    penyerapanAnggaranBobot: 20,
    belanjaKontraktualBobot: 10,
    penyelesaianTagihanBobot: 10,
    pengelolaanUpTupBobot: 10,
    capaianOutputBobot: 25,
    dispensasiSpmPengurangMax: 5,
    targetPenyerapanTw1: 15,
    targetPenyerapanTw2: 50,
    targetPenyerapanTw3: 70,
    targetPenyerapanTw4: 90,
    ambangBatasDeviasi: 5.0
  },
  sheets: [
    {
      sheetName: '1. Matriks Bobot 8 Indikator',
      columns: ['No', 'Aspek Evaluasi', 'Indikator IKPA', 'Bobot PER-5', 'Ambang Batas / Target Ideal', 'Metode & Rumus Perhitungan', 'Ketentuan Tambahan'],
      totalRows: 8,
      rows: [
        {
          'No': 1,
          'Aspek Evaluasi': 'Kualitas Perencanaan (25%)',
          'Indikator IKPA': 'Revisi DIPA',
          'Bobot PER-5': '10%',
          'Ambang Batas / Target Ideal': 'Maksimal 1 kali per semester',
          'Metode & Rumus Perhitungan': 'NKRA = 50% × NKRA Sem I + 50% × NKRA Sem II (0-1 kali = 110, 2 kali = 100, ≥3 kali = 50)',
          'Ketentuan Tambahan': 'Khusus 14 kriteria revisi pagu tetap. Dihitung per semester bukan kumulatif tahunan.'
        },
        {
          'No': 2,
          'Aspek Evaluasi': 'Kualitas Perencanaan (25%)',
          'Indikator IKPA': 'Deviasi Halaman III DIPA',
          'Bobot PER-5': '15%',
          'Ambang Batas / Target Ideal': 'Deviasi Rata-rata ≤ 5.0%',
          'Metode & Rumus Perhitungan': 'Deviasi = Σ (Deviasi per Jenis Belanja × Bobot Pagu). Jika Deviasi ≤ 5% => Skor 100.',
          'Ketentuan Tambahan': 'Pemutakhiran RPD Triwulanan di hari kerja ke-10 awal triwulan (Feb, Apr, Jul, Okt).'
        },
        {
          'No': 3,
          'Aspek Evaluasi': 'Kualitas Pelaksanaan (50%)',
          'Indikator IKPA': 'Penyerapan Anggaran',
          'Bobot PER-5': '20%',
          'Ambang Batas / Target Ideal': 'TW I: 20/15/10/25% | TW II: 50% | TW III: 70-75% | TW IV: 90-95%',
          'Metode & Rumus Perhitungan': 'Rata-rata tertimbang rasio realisasi terhadap target penyerapan 4 jenis belanja (51, 52, 53, 57).',
          'Ketentuan Tambahan': 'Proporsi belanja modal & barang dipercepat sejak awal tahun anggaran.'
        },
        {
          'No': 4,
          'Aspek Evaluasi': 'Kualitas Pelaksanaan (50%)',
          'Indikator IKPA': 'Belanja Kontraktual',
          'Bobot PER-5': '10%',
          'Ambang Batas / Target Ideal': 'Kontrak Pra-DIPA, Akselerasi 53 TW I, Distribusi TW II > 75%',
          'Metode & Rumus Perhitungan': 'Nilai = (Pra-DIPA × 40%) + (Akselerasi 53 × 40%) + (Distribusi TW II × 20%)',
          'Ketentuan Tambahan': 'Kontrak 50-200 juta diselesaikan sekaligus pada Triwulan I.'
        },
        {
          'No': 5,
          'Aspek Evaluasi': 'Kualitas Pelaksanaan (50%)',
          'Indikator IKPA': 'Penyelesaian Tagihan',
          'Bobot PER-5': '10%',
          'Ambang Batas / Target Ideal': '100% tepat waktu (≤ 17 HK)',
          'Metode & Rumus Perhitungan': '(Jumlah SPM LS Kontraktual Tepat Waktu / Total SPM LS Kontraktual) × 100',
          'Ketentuan Tambahan': 'Dihitung sejak tanggal timbulnya hak tagih (BAST / BAPP di modul Komitmen SAKTI).'
        },
        {
          'No': 6,
          'Aspek Evaluasi': 'Kualitas Pelaksanaan (50%)',
          'Indikator IKPA': 'Pengelolaan UP dan TUP',
          'Bobot PER-5': '10%',
          'Ambang Batas / Target Ideal': 'Revolving GUP 100%, Disebulankan 100%, Setoran TUP tepat, Transaksi KKP aktif',
          'Metode & Rumus Perhitungan': 'Skor = (50% GUP tepat + 25% GUP disebulankan + 25% Setor TUP) × 90% + (KKP × 10%)',
          'Ketentuan Tambahan': 'Penggunaan KKP minimal 1 transaksi per semester memberikan nilai bonus pengungkit 110.'
        },
        {
          'No': 7,
          'Aspek Evaluasi': 'Kualitas Hasil (25%)',
          'Indikator IKPA': 'Capaian Output',
          'Bobot PER-5': '25%',
          'Ambang Batas / Target Ideal': 'Ketepatan Lapor HK ke-5 & Capaian RO ≥ Target',
          'Metode & Rumus Perhitungan': 'Skor RO = (Ketepatan Waktu × 30%) + (Ketercapaian Target RO × 70%). Ditimbang ke seluruh RO.',
          'Ketentuan Tambahan': 'Wajib konfirmasi KPPN jika deviasi progres anomali agar tidak bernilai 0 di MyIntress.'
        },
        {
          'No': 8,
          'Aspek Evaluasi': 'Faktor Pengurang (Minus)',
          'Indikator IKPA': 'Dispensasi SPM',
          'Bobot PER-5': 'Pengurang Akhir',
          'Ambang Batas / Target Ideal': '0 kali dispensasi SPM akhir tahun',
          'Metode & Rumus Perhitungan': 'Rasio permil dispensasi terhadap total SPM Triwulan IV dikurangi langsung dari nilai total IKPA.',
          'Ketentuan Tambahan': 'Pengurang maksimal s.d. 5 poin dari skor akhir satker.'
        }
      ]
    },
    {
      sheetName: '2. Simulasi Contoh Satker A',
      columns: ['Kode Satker', 'Nama Satker', 'Revisi DIPA (10%)', 'Deviasi Hal III (15%)', 'Penyerapan (20%)', 'Kontraktual (10%)', 'Tagihan (10%)', 'UP & TUP (10%)', 'Output (25%)', 'Pengurang Dispensasi', 'Total Nilai IKPA', 'Predikat'],
      totalRows: 5,
      rows: [
        {
          'Kode Satker': '411822',
          'Nama Satker': 'KANTOR WILAYAH KEMENTERIAN HUKUM DAN HAM JAWA TENGAH',
          'Revisi DIPA (10%)': 100.0,
          'Deviasi Hal III (15%)': 92.4,
          'Penyerapan (20%)': 96.8,
          'Kontraktual (10%)': 90.0,
          'Tagihan (10%)': 98.5,
          'UP & TUP (10%)': 95.0,
          'Output (25%)': 94.2,
          'Pengurang Dispensasi': 0.0,
          'Total Nilai IKPA': 94.98,
          'Predikat': 'Baik (Mendekati Sangat Baik)'
        },
        {
          'Kode Satker': '654321',
          'Nama Satker': 'POLRESTABES SEMARANG',
          'Revisi DIPA (10%)': 100.0,
          'Deviasi Hal III (15%)': 96.5,
          'Penyerapan (20%)': 98.0,
          'Kontraktual (10%)': 95.0,
          'Tagihan (10%)': 100.0,
          'UP & TUP (10%)': 100.0,
          'Output (25%)': 96.0,
          'Pengurang Dispensasi': 0.0,
          'Total Nilai IKPA': 97.58,
          'Predikat': 'Sangat Baik'
        },
        {
          'Kode Satker': '527819',
          'Nama Satker': 'PENGADILAN TINGGI AGAMA SEMARANG',
          'Revisi DIPA (10%)': 100.0,
          'Deviasi Hal III (15%)': 88.0,
          'Penyerapan (20%)': 91.5,
          'Kontraktual (10%)': 85.0,
          'Tagihan (10%)': 94.0,
          'UP & TUP (10%)': 90.0,
          'Output (25%)': 89.0,
          'Pengurang Dispensasi': 0.0,
          'Total Nilai IKPA': 90.55,
          'Predikat': 'Baik'
        },
        {
          'Kode Satker': '641203',
          'Nama Satker': 'BALAI BESAR PENGAWAS OBAT DAN MAKANAN DI SEMARANG',
          'Revisi DIPA (10%)': 50.0,
          'Deviasi Hal III (15%)': 74.0,
          'Penyerapan (20%)': 82.0,
          'Kontraktual (10%)': 80.0,
          'Tagihan (10%)': 90.0,
          'UP & TUP (10%)': 85.0,
          'Output (25%)': 81.0,
          'Pengurang Dispensasi': 0.5,
          'Total Nilai IKPA': 79.75,
          'Predikat': 'Cukup'
        },
        {
          'Kode Satker': '015099',
          'Nama Satker': 'SATKER CONTOH SIMULASI OPTIMALISASI 2025',
          'Revisi DIPA (10%)': 110.0,
          'Deviasi Hal III (15%)': 100.0,
          'Penyerapan (20%)': 100.0,
          'Kontraktual (10%)': 100.0,
          'Tagihan (10%)': 100.0,
          'UP & TUP (10%)': 105.0,
          'Output (25%)': 100.0,
          'Pengurang Dispensasi': 0.0,
          'Total Nilai IKPA': 100.0,
          'Predikat': 'Sangat Baik (Sempurna)'
        }
      ]
    },
    {
      sheetName: '3. Detail Formula UP & TUP',
      columns: ['Komponen Pengelolaan UP/TUP', 'Bobot Komponen', 'Parameter Input', 'Kriteria Penilaian', 'Formula Excel', 'Skor Standar', 'Skor Maksimal'],
      totalRows: 6,
      rows: [
        {
          'Komponen Pengelolaan UP/TUP': '1. Ketepatan Waktu GUP (Revolving)',
          'Bobot Komponen': '50% dari Sub-UP',
          'Parameter Input': 'Tanggal SP2D GUP vs Batas Revolving (1 Bulan)',
          'Kriteria Penilaian': 'Revolving sebelum batas 30 hari kalender bernilai 100',
          'Formula Excel': '=IF(TglGUP <= BatasRevolving, 100, MAX(0, 100 - (HariTerlambat * 5)))',
          'Skor Standar': 100,
          'Skor Maksimal': 100
        },
        {
          'Komponen Pengelolaan UP/TUP': '2. GUP Disebulankan (Besaran)',
          'Bobot Komponen': '25% dari Sub-UP',
          'Parameter Input': 'Total GUP per Bulan / Pagu UP',
          'Kriteria Penilaian': 'Minimal 100% dari pagu UP revolving dalam 1 bulan',
          'Formula Excel': '=MIN(100, (RealisasiGUPBulanan / PaguUP) * 100)',
          'Skor Standar': 100,
          'Skor Maksimal': 100
        },
        {
          'Komponen Pengelolaan UP/TUP': '3. Pertanggungjawaban TUP',
          'Bobot Komponen': '25% dari Sub-UP',
          'Parameter Input': 'Tanggal Setor Sisa TUP / SPM PTUP',
          'Kriteria Penilaian': 'Tepat waktu sebelum batas 30 hari kalender sejak SP2D TUP terbit',
          'Formula Excel': '=IF(HariPenyelesaianTUP <= 30, 100, 50)',
          'Skor Standar': 100,
          'Skor Maksimal': 100
        },
        {
          'Komponen Pengelolaan UP/TUP': '4. Subtotal Pengelolaan UP Tunai',
          'Bobot Komponen': '90% dari Total UP/TUP',
          'Parameter Input': 'Gabungan Komponen 1, 2, dan 3',
          'Kriteria Penilaian': '(Komponen 1 × 50%) + (Komponen 2 × 25%) + (Komponen 3 × 25%)',
          'Formula Excel': '=(GUP_Tepat*0.5) + (GUP_Sebulan*0.25) + (TUP_Tepat*0.25)',
          'Skor Standar': 100,
          'Skor Maksimal': 100
        },
        {
          'Komponen Pengelolaan UP/TUP': '5. Penggunaan KKP (Kartu Kredit Pemerintah)',
          'Bobot Komponen': '10% dari Total UP/TUP',
          'Parameter Input': 'Keaktifan Transaksi KKP Satker',
          'Kriteria Penilaian': 'Ada transaksi KKP => Skor 110 (Bonus), Belum aktif => Skor 90, Tidak punya proporsi KKP => 100',
          'Formula Excel': '=IF(AdaTransaksiKKP, 110, IF(PunyaPorsiKKP, 90, 100))',
          'Skor Standar': 100,
          'Skor Maksimal': 110
        },
        {
          'Komponen Pengelolaan UP/TUP': 'TOTAL NILAI INDIKATOR UP/TUP',
          'Bobot Komponen': '10% dari Nilai IKPA Total',
          'Parameter Input': '(Subtotal UP Tunai × 90%) + (Skor KKP × 10%)',
          'Kriteria Penilaian': 'Maksimal nilai 100 (atau s.d. 101 jika KKP bonus mencapai 110)',
          'Formula Excel': '=MIN(100, (SkorUPTunai * 0.9) + (SkorKKP * 0.1))',
          'Skor Standar': 100,
          'Skor Maksimal': 101
        }
      ]
    },
    {
      sheetName: '4. Target Trajektori Penyerapan',
      columns: ['Jenis Belanja', 'Kode Akun', 'Target Triwulan I', 'Target Triwulan II', 'Target Triwulan III', 'Target Triwulan IV', 'Prioritas Pengawasan KPPN'],
      totalRows: 5,
      rows: [
        {
          'Jenis Belanja': 'Belanja Pegawai',
          'Kode Akun': '51',
          'Target Triwulan I': '20.0%',
          'Target Triwulan II': '50.0%',
          'Target Triwulan III': '75.0%',
          'Target Triwulan IV': '95.0%',
          'Prioritas Pengawasan KPPN': 'Gaji induk, uang makan, tunjangan kinerja, dan lembur bulanan tepat waktu'
        },
        {
          'Jenis Belanja': 'Belanja Barang',
          'Kode Akun': '52',
          'Target Triwulan I': '15.0%',
          'Target Triwulan II': '50.0%',
          'Target Triwulan III': '70.0%',
          'Target Triwulan IV': '90.0%',
          'Prioritas Pengawasan KPPN': 'Akselerasi pengadaan operasional kantor dan perjalanan dinas terencana'
        },
        {
          'Jenis Belanja': 'Belanja Modal',
          'Kode Akun': '53',
          'Target Triwulan I': '10.0%',
          'Target Triwulan II': '40.0%',
          'Target Triwulan III': '70.0%',
          'Target Triwulan IV': '90.0%',
          'Prioritas Pengawasan KPPN': 'Lelang dini (Pra-DIPA) & termin terminasi fisik tanpa tunda BAST'
        },
        {
          'Jenis Belanja': 'Belanja Bantuan Sosial',
          'Kode Akun': '57',
          'Target Triwulan I': '25.0%',
          'Target Triwulan II': '50.0%',
          'Target Triwulan III': '75.0%',
          'Target Triwulan IV': '95.0%',
          'Prioritas Pengawasan KPPN': 'Penyaluran bertahap sesuai SK penerima bantuan'
        },
        {
          'Jenis Belanja': 'TARGET KOMPOSIT RATA-RATA',
          'Kode Akun': 'SEMUA',
          'Target Triwulan I': '≥ 15.0%',
          'Target Triwulan II': '≥ 50.0%',
          'Target Triwulan III': '≥ 70.0%',
          'Target Triwulan IV': '≥ 90.0%',
          'Prioritas Pengawasan KPPN': 'Satker di bawah ambang batas akan masuk daftar Red Flags KPPN'
        }
      ]
    },
    {
      sheetName: '5. Ketentuan Deviasi RPD Hal III',
      columns: ['Tingkat Deviasi Rata-rata', 'Nilai Indikator', 'Kategori Kinerja', 'Dampak ke Total IKPA', 'Langkah Wajib Satker'],
      totalRows: 6,
      rows: [
        {
          'Tingkat Deviasi Rata-rata': '≤ 5.00%',
          'Nilai Indikator': 100.0,
          'Kategori Kinerja': 'Sangat Baik (Sempurna)',
          'Dampak ke Total IKPA': 'Memberikan kontribusi 15.00 poin penuh',
          'Langkah Wajib Satker': 'Pertahankan keselarasan pencairan SPM dengan rencana penarikan dana bulanan'
        },
        {
          'Tingkat Deviasi Rata-rata': '5.01% - 10.00%',
          'Nilai Indikator': 95.0 - 75.0,
          'Kategori Kinerja': 'Baik',
          'Dampak ke Total IKPA': 'Kehilangan 0.75 - 3.75 poin total',
          'Langkah Wajib Satker': 'Lakukan revisi RPD pada hari kerja ke-10 awal triwulan berikutnya'
        },
        {
          'Tingkat Deviasi Rata-rata': '10.01% - 15.00%',
          'Nilai Indikator': 75.0 - 50.0,
          'Kategori Kinerja': 'Cukup',
          'Dampak ke Total IKPA': 'Kehilangan 3.75 - 7.50 poin total',
          'Langkah Wajib Satker': 'Konsolidasi PPK dengan Bendahara agar SPM tidak meleset dari jadwal'
        },
        {
          'Tingkat Deviasi Rata-rata': '15.01% - 20.00%',
          'Nilai Indikator': 50.0 - 25.0,
          'Kategori Kinerja': 'Kurang',
          'Dampak ke Total IKPA': 'Kehilangan 7.50 - 11.25 poin total',
          'Langkah Wajib Satker': 'Konsultasi intensif dengan Customer Service KPPN Semarang I'
        },
        {
          'Tingkat Deviasi Rata-rata': '> 20.00%',
          'Nilai Indikator': 0.0,
          'Kategori Kinerja': 'Sangat Rendah (0 Poin)',
          'Dampak ke Total IKPA': 'Kehilangan 15.00 poin penuh (Defisit Fatal)',
          'Langkah Wajib Satker': 'KPA wajib melakukan reviu menyeluruh terhadap seluruh kalender kerja satuan kerja'
        },
        {
          'Tingkat Deviasi Rata-rata': 'Koreksi Hari Kerja ke-10',
          'Nilai Indikator': 'Disesuaikan',
          'Kategori Kinerja': 'Fasilitas Pemutakhiran',
          'Dampak ke Total IKPA': 'Memulihkan deviasi bulan berjalan dan triwulan mendatang',
          'Langkah Wajib Satker': 'Kirim revisi RPD sebelum batas cut-off sistem SAKTI ditutup'
        }
      ]
    }
  ]
};

/**
 * Buat file Excel asli (WorkBook) dari data referensi
 */
export function createWorkbookFromReference(ref: PerhitunganIkpaExcelReference): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  ref.sheets.forEach(sheetData => {
    // Generate sheet from JSON
    const ws = XLSX.utils.json_to_sheet(sheetData.rows, {
      header: sheetData.columns
    });

    // Set standard column widths
    const colWidths = sheetData.columns.map(col => {
      const maxContent = sheetData.rows.reduce((max, row) => {
        const val = row[col] ? String(row[col]) : '';
        return Math.max(max, val.length);
      }, col.length);
      return { wch: Math.min(60, Math.max(12, maxContent + 3)) };
    });
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, sheetData.sheetName.substring(0, 31));
  });

  return wb;
}

/**
 * Unduh file Excel acuan aktif
 */
export function downloadPerhitunganIkpaExcel(ref: PerhitunganIkpaExcelReference): void {
  try {
    const wb = createWorkbookFromReference(ref);
    const sanitizedFileName = (ref.fileName || 'Dasar_Perhitungan_IKPA.xlsx').endsWith('.xlsx')
      ? ref.fileName
      : `${ref.fileName || 'Dasar_Perhitungan_IKPA'}.xlsx`;
    
    XLSX.writeFile(wb, sanitizedFileName);
  } catch (err) {
    console.error('Gagal mengunduh file excel referensi:', err);
  }
}

/**
 * Parse File Excel yang diunggah oleh Admin
 */
export async function parseUploadedPerhitunganExcel(
  file: File, 
  uploadedBy: string = 'Administrator KPPN Semarang I'
): Promise<PerhitunganIkpaExcelReference> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          throw new Error('File Excel tidak memiliki lembar kerja (worksheet) yang valid.');
        }

        const extractedSheets: ExcelSheetData[] = [];
        let totalDataRows = 0;

        // Extract each worksheet
        workbook.SheetNames.forEach(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

          if (rawRows.length > 0) {
            // Get unique column headers
            const columnsSet = new Set<string>();
            rawRows.forEach(row => {
              Object.keys(row).forEach(k => columnsSet.add(k));
            });
            const columns = Array.from(columnsSet);

            extractedSheets.push({
              sheetName,
              columns,
              rows: rawRows,
              totalRows: rawRows.length
            });
            totalDataRows += rawRows.length;
          }
        });

        if (extractedSheets.length === 0) {
          throw new Error('Worksheet dalam file Excel kosong atau tidak memiliki baris data.');
        }

        // Auto-detect weights or custom rules if present in sheet cells
        const rules = detectRulesFromSheets(extractedSheets);

        const newRef: PerhitunganIkpaExcelReference = {
          id: `ref-${Date.now()}`,
          fileName: file.name,
          fileSizeBytes: file.size,
          uploadedAt: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          uploadedBy,
          tahunAnggaran: rules.detectedYear || '2025',
          dasarHukum: rules.detectedRegulasi || 'PER-5/PB/2024 & Pembaruan Acuan KPPN',
          catatanAdmin: `File spreadsheet dasar perhitungan berhasil diunggah oleh ${uploadedBy}. Terdiri dari ${extractedSheets.length} sheet dengan total ${totalDataRows} baris data acuan.`,
          totalSheets: extractedSheets.length,
          totalDataRows,
          sheets: extractedSheets,
          extractedRules: rules.extractedWeights
        };

        resolve(newRef);
      } catch (err: any) {
        reject(new Error(err?.message || 'Format file Excel tidak dapat dibaca. Pastikan format .xlsx atau .xls valid.'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Gagal membaca berkas file Excel dari komputer.'));
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Deteksi aturan bobot dan regulasi secara cerdas dari lembar spreadsheet
 */
function detectRulesFromSheets(sheets: ExcelSheetData[]) {
  const extractedWeights = {
    revisiDipaBobot: 10,
    deviasiHal3Bobot: 15,
    penyerapanAnggaranBobot: 20,
    belanjaKontraktualBobot: 10,
    penyelesaianTagihanBobot: 10,
    pengelolaanUpTupBobot: 10,
    capaianOutputBobot: 25,
    dispensasiSpmPengurangMax: 5,
    targetPenyerapanTw1: 15,
    targetPenyerapanTw2: 50,
    targetPenyerapanTw3: 70,
    targetPenyerapanTw4: 90,
    ambangBatasDeviasi: 5.0
  };

  let detectedYear = '2025';
  let detectedRegulasi = 'PER-5/PB/2024 & Acuan Perhitungan IKPA 2025';

  sheets.forEach(sheet => {
    sheet.rows.forEach(row => {
      const rowString = JSON.stringify(row).toLowerCase();

      if (rowString.includes('2025')) detectedYear = '2025';
      else if (rowString.includes('2026')) detectedYear = '2026';

      if (rowString.includes('per-5') || rowString.includes('per5')) {
        detectedRegulasi = 'PER-5/PB/2024 (Regulasi Acuan Resmi)';
      }

      // Detect weights if written like "revisi dipa" and has 10%
      Object.keys(row).forEach(key => {
        const val = String(row[key]);
        const keyLower = key.toLowerCase();

        if (keyLower.includes('bobot') || keyLower.includes('persen') || keyLower.includes('%')) {
          const numMatch = val.match(/(\d+(\.\d+)?)/);
          if (numMatch) {
            const numVal = parseFloat(numMatch[1]);
            if (rowString.includes('revisi')) extractedWeights.revisiDipaBobot = numVal;
            if (rowString.includes('deviasi') || rowString.includes('hal iii')) extractedWeights.deviasiHal3Bobot = numVal;
            if (rowString.includes('penyerapan')) extractedWeights.penyerapanAnggaranBobot = numVal;
            if (rowString.includes('kontrak')) extractedWeights.belanjaKontraktualBobot = numVal;
            if (rowString.includes('tagihan')) extractedWeights.penyelesaianTagihanBobot = numVal;
            if (rowString.includes('up') && rowString.includes('tup')) extractedWeights.pengelolaanUpTupBobot = numVal;
            if (rowString.includes('output') || rowString.includes('caput')) extractedWeights.capaianOutputBobot = numVal;
          }
        }
      });
    });
  });

  return { extractedWeights, detectedYear, detectedRegulasi };
}
