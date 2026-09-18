import { SatkerIKPA, PejabatSertifikasi, DeviasiHal3Record, PengelolaanUPRecord } from '../types';
import { evaluateUPRecordStatus } from '../data/initialUPData';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Export Satker IKPA Data to Excel (.xlsx)
 */
export function exportSatkersToExcel(satkers: SatkerIKPA[], filename = 'Data_IKPA_Satker_KPPN_Semarang_I.xlsx') {
  const excelData = satkers.map((s, index) => ({
    'No': index + 1,
    'Kode Satker': s.kodeSatker,
    'Nama Satker': s.namaSatker,
    'Kementerian/Lembaga': s.kementerianLembaga,
    'Pagu Anggaran (Rp)': s.paguAnggaran,
    'Realisasi Anggaran (Rp)': s.realisasiAnggaran,
    '% Penyerapan': Number(s.persenPenyerapan.toFixed(2)),
    'Revisi DIPA (10%)': s.indikator.revisiDipa,
    'Deviasi Hal III DIPA (15%)': s.indikator.deviasiHal3Dipa,
    'Penyerapan Anggaran (20%)': s.indikator.penyerapanAnggaran,
    'Belanja Kontraktual (10%)': s.indikator.belanjaKontraktual,
    'Penyelesaian Tagihan (10%)': s.indikator.penyelesaianTagihan,
    'Pengelolaan UP/TUP (10%)': s.indikator.pengelolaanUpTup,
    'Dispensasi SPM (25%)': s.indikator.dispensasiSpm,
    'Capaian Output (25%)': s.indikator.capaianOutput,
    'Nilai Total IKPA': Number(s.nilaiTotalIKPA.toFixed(2)),
    'Predikat IKPA': s.predikat,
    'PIC / Penanggung Jawab': s.namaPic || '-',
    'Kontak PIC': s.noHpPic || '-'
  }));

  const worksheet = XLSX.utils.json_to_sheet(excelData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data IKPA');
  XLSX.writeFile(workbook, filename);
}

export interface ExportSatkersPdfOptions {
  title?: string;
  subtitle?: string;
  periodeLabel?: string;
  filterLabel?: string;
  pejabatNama?: string;
  pejabatNip?: string;
  pejabatJabatan?: string;
  filename?: string;
}

/**
 * Menggambar Emblem / Lencana Resmi Kementerian Keuangan & DJPb secara Vektor
 */
export function drawKemenkeuEmblem(doc: jsPDF, x: number, y: number, size: number = 14) {
  const r = size / 2;
  const cx = x + r;
  const cy = y + r;

  // 1. Lingkaran luar Navy Tua Kemenkeu
  doc.setFillColor(15, 47, 87); // #0F2F57
  doc.circle(cx, cy, r, 'F');

  // 2. Cincin Emas Kemenkeu
  doc.setDrawColor(212, 175, 55); // Gold #D4AF37
  doc.setLineWidth(0.6);
  doc.circle(cx, cy, r - 0.7, 'D');

  // 3. Lingkaran dalam Biru Navy Sedang
  doc.setFillColor(30, 58, 138); // #1E3A8A
  doc.circle(cx, cy, r - 1.6, 'F');

  // 4. Perisai / Segitiga Emblem Emas
  doc.setFillColor(217, 119, 6); // Amber Gold
  doc.triangle(cx - 2.8, cy - 2, cx + 2.8, cy - 2, cx, cy + 3.4, 'F');

  // 5. Bintang Emas Pusat
  doc.setFillColor(254, 240, 138); // Soft Light Gold
  doc.circle(cx, cy - 0.5, 1.2, 'F');

  // 6. Teks Monogram Resmi DJPb di bawah
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(4);
  doc.setTextColor(255, 255, 255);
  doc.text('DJPb', cx, cy + 4.6, { align: 'center' });
}

/**
 * Export Satker IKPA Data to PDF (.pdf)
 * Standar Eksekutif Ditjen Perbendaharaan (DJPb - Kemenkeu):
 * - Orientasi A4 Landscape elegan dan proporsional (297 mm x 210 mm)
 * - Kop resmi Kementerian Keuangan & KPPN Tipe A1 Semarang I dengan emblem vektor
 * - Kartu ringkasan KPI eksekutif (Rata-rata IKPA, Sangat Baik, Baik, Cukup, Kurang, Total Anggaran)
 * - Tabel komprehensif Two-Tier Header memuat 8 Indikator IKPA (PER-5/PB/2024), Nilai Akhir, Predikat, dan Rekomendasi
 * - Penyorotan otomatis nilai indikator kritis (< 70) dan predikat dengan kontras warna tinggi
 * - Running header & footer dinamis dengan penomoran resmi
 * - Lembar Pengesahan / Tanda Tangan resmi Pejabat Pengawas di halaman akhir
 */
export function exportSatkersToPDF(
  satkers: SatkerIKPA[],
  titleOrOptions?: string | ExportSatkersPdfOptions
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const totalPagesExp = '{total_pages_count_string}';

  const options: ExportSatkersPdfOptions =
    typeof titleOrOptions === 'string'
      ? { title: titleOrOptions }
      : titleOrOptions || {};

  const printDate = new Date();
  const printDateStr = printDate.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const printTimeStr =
    printDate.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    }) + ' WIB';

  const docTitle = options.title || 'LAPORAN MONITORING NILAI IKPA SATUAN KERJA';
  const docSubtitle =
    options.subtitle || 'EVALUASI 8 INDIKATOR KINERJA PELAKSANAAN ANGGARAN (PER-5/PB/2024)';
  const periodeText = options.periodeLabel || 's.d. Bulan Berjalan 2026';
  const filterBadge = options.filterLabel || `Semua Satker (${satkers.length} Satker)`;

  // --- Statistik Eksekutif ---
  const totalSatker = satkers.length;
  let totalPagu = 0;
  let totalRealisasi = 0;
  let totalNilaiIKPA = 0;
  let countSangatBaik = 0;
  let countBaik = 0;
  let countCukup = 0;
  let countKurang = 0;

  satkers.forEach((s) => {
    totalPagu += s.paguAnggaran || 0;
    totalRealisasi += s.realisasiAnggaran || 0;
    totalNilaiIKPA += s.nilaiTotalIKPA || 0;

    const val = s.nilaiTotalIKPA || 0;
    if (val >= 95) countSangatBaik++;
    else if (val >= 89) countBaik++;
    else if (val >= 70) countCukup++;
    else countKurang++;
  });

  const avgNilai = totalSatker > 0 ? totalNilaiIKPA / totalSatker : 0;
  const avgRealisasiPersen = totalPagu > 0 ? (totalRealisasi / totalPagu) * 100 : 0;

  const formatShortRp = (val: number) => {
    if (!val || isNaN(val) || val === 0) return 'Rp 0';
    const abs = Math.abs(val);
    if (abs >= 1_000_000_000_000) {
      return 'Rp ' + (val / 1_000_000_000_000).toFixed(2) + ' T';
    }
    if (abs >= 1_000_000_000) {
      return 'Rp ' + (val / 1_000_000_000).toFixed(2) + ' M';
    }
    if (abs >= 1_000_000) {
      return 'Rp ' + (val / 1_000_000).toFixed(1) + ' Jt';
    }
    return 'Rp ' + Math.round(val).toLocaleString('id-ID');
  };

  // --- 1. ACCENT TOP BAR (Navy + Gold Kemenkeu) ---
  doc.setFillColor(15, 47, 87); // Deep Navy Kemenkeu #0F2F57
  doc.rect(0, 0, 297, 3.2, 'F');
  doc.setFillColor(212, 175, 55); // Kemenkeu Gold #D4AF37
  doc.rect(0, 3.2, 297, 1, 'F');

  // --- 2. HEADER KOP INSTANSI RESMI KEMENKEU DENGAN EMBLEM VEKTOR ---
  drawKemenkeuEmblem(doc, 10, 6.5, 14.5);

  const kopTextX = 27.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 47, 87);
  doc.text('KEMENTERIAN KEUANGAN REPUBLIK INDONESIA', kopTextX, 9.8);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 64, 175);
  doc.text('DIREKTORAT JENDERAL PERBENDAHARAAN', kopTextX, 13.8);

  doc.setFontSize(7.2);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('KANTOR WILAYAH PROVINSI JAWA TENGAH', kopTextX, 17.2);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('KANTOR PELAYANAN PERBENDAHARAAN NEGARA TIPE A1 SEMARANG I (KPPN 026)', kopTextX, 20.8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'Jalan Ki Mangunsarkoro No. 34, Semarang 50241 | Telepon (024) 8412850 | Laman: djpb.kemenkeu.go.id/kppn/semarang1',
    kopTextX,
    24
  );

  // Garis Ganda Pembatas Kop Surat
  doc.setDrawColor(15, 47, 87);
  doc.setLineWidth(0.65);
  doc.line(10, 26, 287, 26);

  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.3);
  doc.line(10, 27.1, 287, 27.1);

  // --- 3. JUDUL LAPORAN & SUBTITLE ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 47, 87);
  doc.text(docTitle, 10, 32.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.2);
  doc.setTextColor(30, 64, 175);
  doc.text(docSubtitle, 10, 36.8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Periode: ${periodeText}   |   Waktu Unduh: ${printDateStr}, ${printTimeStr}   |   Kategori: ${filterBadge}   |   Sumber Data: OMSPAN / SAKTI Kemenkeu`,
    10,
    41
  );

  // --- 4. EXECUTIVE SUMMARY METRIC CARDS ---
  const cardY = 43.5;
  const cardH = 11.5;
  const cardW = 39;
  const gap = 3;

  // Card 1: Rata-Rata Nilai IKPA
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.25);
  doc.roundedRect(10, cardY, cardW, cardH, 1.5, 1.5, 'FD');
  doc.setFillColor(15, 47, 87);
  doc.rect(10, cardY, cardW, 1.2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(100, 116, 139);
  doc.text('RATA-RATA IKPA', 13, cardY + 4.2);
  doc.setFontSize(10);
  doc.setTextColor(15, 47, 87);
  doc.text(`${avgNilai.toFixed(2)}`, 13, cardY + 8.4);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.8);
  doc.setTextColor(71, 85, 105);
  const avgPred = avgNilai >= 95 ? 'Sangat Baik' : avgNilai >= 89 ? 'Baik' : avgNilai >= 70 ? 'Cukup' : 'Kurang';
  doc.text(`Predikat: ${avgPred} (${totalSatker} Satker)`, 13, cardY + 10.5);

  // Card 2: Sangat Baik (>= 95)
  const c2X = 10 + (cardW + gap);
  doc.setFillColor(236, 253, 245);
  doc.setDrawColor(167, 243, 208);
  doc.roundedRect(c2X, cardY, cardW, cardH, 1.5, 1.5, 'FD');
  doc.setFillColor(5, 150, 105);
  doc.rect(c2X, cardY, cardW, 1.2, 'F');
  doc.circle(c2X + 4, cardY + 3.8, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(4, 120, 87);
  doc.text('SANGAT BAIK (>= 95)', c2X + 6.5, cardY + 4.2);
  doc.setFontSize(10);
  doc.setTextColor(4, 120, 87);
  doc.text(`${countSangatBaik} Satker`, c2X + 6.5, cardY + 8.4);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.8);
  doc.setTextColor(5, 150, 105);
  doc.text(
    `${totalSatker > 0 ? ((countSangatBaik / totalSatker) * 100).toFixed(1) : 0}% dari total satker`,
    c2X + 6.5,
    cardY + 10.5
  );

  // Card 3: Baik (89 - 94.99)
  const c3X = 10 + (cardW + gap) * 2;
  doc.setFillColor(239, 246, 255);
  doc.setDrawColor(191, 219, 254);
  doc.roundedRect(c3X, cardY, cardW, cardH, 1.5, 1.5, 'FD');
  doc.setFillColor(37, 99, 235);
  doc.rect(c3X, cardY, cardW, 1.2, 'F');
  doc.circle(c3X + 4, cardY + 3.8, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(29, 78, 216);
  doc.text('BAIK (89 - <95)', c3X + 6.5, cardY + 4.2);
  doc.setFontSize(10);
  doc.setTextColor(29, 78, 216);
  doc.text(`${countBaik} Satker`, c3X + 6.5, cardY + 8.4);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.8);
  doc.setTextColor(37, 99, 235);
  doc.text(
    `${totalSatker > 0 ? ((countBaik / totalSatker) * 100).toFixed(1) : 0}% dari total satker`,
    c3X + 6.5,
    cardY + 10.5
  );

  // Card 4: Cukup (70 - 88.99)
  const c4X = 10 + (cardW + gap) * 3;
  doc.setFillColor(254, 252, 232);
  doc.setDrawColor(254, 240, 138);
  doc.roundedRect(c4X, cardY, cardW, cardH, 1.5, 1.5, 'FD');
  doc.setFillColor(202, 138, 4);
  doc.rect(c4X, cardY, cardW, 1.2, 'F');
  doc.circle(c4X + 4, cardY + 3.8, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(161, 98, 7);
  doc.text('CUKUP (70 - <89)', c4X + 6.5, cardY + 4.2);
  doc.setFontSize(10);
  doc.setTextColor(133, 77, 14);
  doc.text(`${countCukup} Satker`, c4X + 6.5, cardY + 8.4);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.8);
  doc.setTextColor(180, 83, 9);
  doc.text('Perlu pembinaan indikator', c4X + 6.5, cardY + 10.5);

  // Card 5: Kurang (< 70)
  const c5X = 10 + (cardW + gap) * 4;
  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(254, 202, 202);
  doc.roundedRect(c5X, cardY, cardW, cardH, 1.5, 1.5, 'FD');
  doc.setFillColor(220, 38, 38);
  doc.rect(c5X, cardY, cardW, 1.2, 'F');
  doc.circle(c5X + 4, cardY + 3.8, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(185, 28, 28);
  doc.text('KURANG (< 70)', c5X + 6.5, cardY + 4.2);
  doc.setFontSize(10);
  doc.setTextColor(153, 27, 27);
  doc.text(`${countKurang} Satker`, c5X + 6.5, cardY + 8.4);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.8);
  doc.setTextColor(220, 38, 38);
  doc.text('Prioritas asistensi KPPN', c5X + 6.5, cardY + 10.5);

  // Card 6: Ringkasan Anggaran (Pagu & Realisasi)
  const c6X = 10 + (cardW + gap) * 5;
  const c6W = 287 - c6X;
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(c6X, cardY, c6W, cardH, 1.5, 1.5, 'FD');
  doc.setFillColor(71, 85, 105);
  doc.rect(c6X, cardY, c6W, 1.2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(15, 23, 42);
  doc.text('TOTAL REALISASI BELANJA', c6X + 3, cardY + 4.2);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.8);
  doc.setTextColor(51, 65, 85);
  doc.text(`Pagu: ${formatShortRp(totalPagu)}`, c6X + 3, cardY + 6.8);
  doc.text(`Realisasi: ${formatShortRp(totalRealisasi)} (${avgRealisasiPersen.toFixed(1)}%)`, c6X + 3, cardY + 9);
  doc.text(`Standar Acuan: PER-5/PB/2024`, c6X + 3, cardY + 11);

  // --- 5. TWO-TIER TABLE HEADER & DATA ---
  const tableHead: any = [
    [
      { content: 'NO', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
      { content: 'KODE & SATUAN KERJA', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
      { content: 'ANGGARAN DIPA', colSpan: 2, styles: { halign: 'center' } },
      { content: '8 INDIKATOR KINERJA IKPA (PER-5/PB/2024)', colSpan: 8, styles: { halign: 'center' } },
      { content: 'NILAI AKHIR', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
      { content: 'PREDIKAT', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
      { content: 'REKOMENDASI & TINDAK LANJUT', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } }
    ],
    [
      { content: 'PAGU (Rp)', styles: { halign: 'center' } },
      { content: 'REALISASI (%)', styles: { halign: 'center' } },
      { content: 'REVISI', styles: { halign: 'center' } },
      { content: 'DEVIASI', styles: { halign: 'center' } },
      { content: 'SERAP', styles: { halign: 'center' } },
      { content: 'KTRK', styles: { halign: 'center' } },
      { content: 'TAGIH', styles: { halign: 'center' } },
      { content: 'UP/TUP', styles: { halign: 'center' } },
      { content: 'DISPEN', styles: { halign: 'center' } },
      { content: 'CAPUT', styles: { halign: 'center' } }
    ]
  ];

  const tableRows = satkers.map((s, index) => {
    const ind = s.indikator || {
      revisiDipa: 100,
      deviasiHal3Dipa: 100,
      penyerapanAnggaran: 100,
      belanjaKontraktual: 100,
      penyelesaianTagihan: 100,
      pengelolaanUpTup: 100,
      dispensasiSpm: 100,
      capaianOutput: 100
    };

    const valRev = ind.revisiDipa ?? 100;
    const valDev = ind.deviasiHal3Dipa ?? 100;
    const valSerap = ind.penyerapanAnggaran ?? 100;
    const valKtrk = (ind.belanjaKontraktual ?? ind.dataKontrak) ?? 100;
    const valTagih = ind.penyelesaianTagihan ?? 100;
    const valUpTup = (ind.pengelolaanUpTup ?? ind.pengelolaanUPTUP) ?? 100;
    const valDisp = (ind.dispensasiSpm ?? ind.dispensasiSPM) ?? 100;
    const valCaput = ind.capaianOutput ?? 100;

    const satkerText = `${s.namaSatker}\nKode: ${s.kodeSatker}${s.kementerianLembaga ? ' | ' + s.kementerianLembaga : ''}`;
    const paguText = formatShortRp(s.paguAnggaran);
    const realText = `${formatShortRp(s.realisasiAnggaran)}\n(${s.persenPenyerapan.toFixed(1)}%)`;

    // Smart Actionable Recommendation
    const scores = [
      { name: 'Deviasi Hal III', val: valDev, text: 'Akselerasi RPD Hal III DIPA & revisi triwulan tepat waktu.' },
      { name: 'Penyerapan', val: valSerap, text: 'Tingkatkan serapan belanja modal/barang sesuai target triwulanan.' },
      { name: 'Capaian Output', val: valCaput, text: 'Selesaikan konfirmasi dan pelaporan Capaian Output pada SAKTI.' },
      { name: 'Pengelolaan UP/TUP', val: valUpTup, text: 'Tertibkan revolving GUP bulanan & pertanggungjawaban TUP.' },
      { name: 'Penyelesaian Tagihan', val: valTagih, text: 'Percepat penerbitan SPM-LS maks. 17 hari kerja pasca BAST.' },
      { name: 'Belanja Kontraktual', val: valKtrk, text: 'Daftarkan kontrak ke KPPN maks. 3 hari kerja & akselerasi paket 53.' },
      { name: 'Dispensasi SPM', val: valDisp, text: 'Hindari penerbitan SPM dispensasi di luar jadwal reguler.' },
      { name: 'Revisi DIPA', val: valRev, text: 'Batasi frekuensi revisi anggaran DIPA per triwulan.' }
    ];

    scores.sort((a, b) => a.val - b.val);
    const lowest = scores[0];

    let rekomendasi = 'Kinerja pelaksanaan anggaran sangat baik. Pertahankan kedisiplinan pelaporan SAKTI.';
    if (s.nilaiTotalIKPA < 70) {
      rekomendasi = `PRIORITAS KRITIS: ${lowest.name} (${lowest.val.toFixed(1)}). ${lowest.text}`;
    } else if (s.nilaiTotalIKPA < 89) {
      rekomendasi = `PERHATIAN: Tingkatkan ${lowest.name} (${lowest.val.toFixed(1)}). ${lowest.text}`;
    } else if (s.nilaiTotalIKPA < 95) {
      if (lowest.val < 85) {
        rekomendasi = `Optimalkan ${lowest.name} (${lowest.val.toFixed(1)}). ${lowest.text}`;
      } else {
        rekomendasi = 'Kinerja baik. Jaga konsistensi realisasi belanja dan kepatuhan SAKTI.';
      }
    }

    let predikatLabel = '[ SANGAT BAIK ]';
    if (s.nilaiTotalIKPA >= 95) predikatLabel = '[ SANGAT BAIK ]';
    else if (s.nilaiTotalIKPA >= 89) predikatLabel = '[ BAIK ]';
    else if (s.nilaiTotalIKPA >= 70) predikatLabel = '[ CUKUP ]';
    else predikatLabel = '[ KURANG ]';

    return [
      index + 1,
      satkerText,
      paguText,
      realText,
      valRev.toFixed(1),
      valDev.toFixed(1),
      valSerap.toFixed(1),
      valKtrk.toFixed(1),
      valTagih.toFixed(1),
      valUpTup.toFixed(1),
      valDisp.toFixed(1),
      valCaput.toFixed(1),
      s.nilaiTotalIKPA.toFixed(2),
      predikatLabel,
      rekomendasi
    ];
  });

  autoTable(doc, {
    head: tableHead,
    body: tableRows,
    startY: cardY + cardH + 3.5,
    margin: { left: 10, right: 10, top: 19, bottom: 14 },
    theme: 'grid',
    showHead: 'everyPage',
    styles: {
      fontSize: 6.5,
      cellPadding: 1.8,
      lineColor: [226, 232, 240],
      lineWidth: 0.18,
      textColor: [30, 41, 59],
      valign: 'top'
    },
    headStyles: {
      fillColor: [15, 47, 87],
      textColor: [255, 255, 255],
      fontSize: 6.8,
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
      lineWidth: 0.2,
      lineColor: [255, 255, 255]
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 7, fontStyle: 'bold' }, // NO
      1: { halign: 'left', cellWidth: 48 }, // KODE & SATKER
      2: { halign: 'right', cellWidth: 18 }, // PAGU
      3: { halign: 'right', cellWidth: 18 }, // REALISASI & %
      4: { halign: 'center', cellWidth: 11 }, // REVISI
      5: { halign: 'center', cellWidth: 11 }, // DEVIASI
      6: { halign: 'center', cellWidth: 11 }, // SERAP
      7: { halign: 'center', cellWidth: 11 }, // KTRK
      8: { halign: 'center', cellWidth: 11 }, // TAGIH
      9: { halign: 'center', cellWidth: 11 }, // UP/TUP
      10: { halign: 'center', cellWidth: 11 }, // DISPEN
      11: { halign: 'center', cellWidth: 11 }, // CAPUT
      12: { halign: 'center', cellWidth: 16, fontStyle: 'bold' }, // NILAI AKHIR
      13: { halign: 'center', cellWidth: 24, fontStyle: 'bold' }, // PREDIKAT
      14: { halign: 'left', cellWidth: 55 } // REKOMENDASI
    },
    didParseCell: function (data) {
      if (data.section === 'body') {
        const s = satkers[data.row.index];
        if (!s) return;

        // Highlight low indicator values (< 70) in red, optimal (>= 95) in green
        if (data.column.index >= 4 && data.column.index <= 11) {
          const cellVal = parseFloat(data.cell.raw as string);
          if (!isNaN(cellVal) && cellVal < 70) {
            data.cell.styles.fillColor = [254, 242, 242]; // red-50
            data.cell.styles.textColor = [185, 28, 28]; // red-700
            data.cell.styles.fontStyle = 'bold';
          } else if (!isNaN(cellVal) && cellVal >= 95) {
            data.cell.styles.textColor = [4, 120, 87]; // emerald-700
          }
        }

        // Nilai Akhir (column 12)
        if (data.column.index === 12) {
          data.cell.styles.fontStyle = 'bold';
          if (s.nilaiTotalIKPA >= 95) {
            data.cell.styles.fillColor = [236, 253, 245]; // emerald-50
            data.cell.styles.textColor = [4, 120, 87];
          } else if (s.nilaiTotalIKPA >= 89) {
            data.cell.styles.fillColor = [239, 246, 255]; // blue-50
            data.cell.styles.textColor = [29, 78, 216];
          } else if (s.nilaiTotalIKPA >= 70) {
            data.cell.styles.fillColor = [254, 252, 232]; // yellow-50
            data.cell.styles.textColor = [161, 98, 7];
          } else {
            data.cell.styles.fillColor = [254, 226, 226]; // red-100
            data.cell.styles.textColor = [185, 28, 28];
          }
        }

        // Predikat (column 13)
        if (data.column.index === 13) {
          data.cell.styles.fontStyle = 'bold';
          if (s.nilaiTotalIKPA >= 95) {
            data.cell.styles.textColor = [4, 120, 87];
          } else if (s.nilaiTotalIKPA >= 89) {
            data.cell.styles.textColor = [29, 78, 216];
          } else if (s.nilaiTotalIKPA >= 70) {
            data.cell.styles.textColor = [161, 98, 7];
          } else {
            data.cell.styles.textColor = [185, 28, 28];
          }
        }
      }
    },
    didDrawPage: function (data) {
      const pageHeight = doc.internal.pageSize.getHeight();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Top accent bar
      doc.setFillColor(15, 47, 87);
      doc.rect(0, 0, pageWidth, 2.5, 'F');
      doc.setFillColor(212, 175, 55);
      doc.rect(0, 2.5, pageWidth, 0.8, 'F');

      // Running header for pages > 1
      if (data.pageNumber > 1) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(15, 47, 87);
        doc.text(
          `KEMENTERIAN KEUANGAN RI - KPPN TIPE A1 SEMARANG I  |  LAPORAN MONITORING NILAI IKPA SATKER`,
          10,
          9.5
        );

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.8);
        doc.setTextColor(180, 83, 9);
        doc.text(
          `Periode: ${periodeText}  •  Kategori: ${filterBadge}  •  Standar PER-5/PB/2024`,
          10,
          13.8
        );

        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.25);
        doc.line(10, 15.5, 287, 15.5);
      }

      // Footer line
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.3);
      doc.line(10, pageHeight - 9, 287, pageHeight - 9);

      // Running footer text
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.8);
      doc.setTextColor(15, 47, 87);
      doc.text('KPPN TIPE A1 SEMARANG I (026)', 10, pageHeight - 5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(
        ' •  Seksi Manajemen Satker & Kepatuhan Internal (MSKI)  •  Evaluasi Kinerja Anggaran SAKTI & OMSPAN',
        50,
        pageHeight - 5
      );

      // Page numbering
      const pageStr = `Halaman ${data.pageNumber} dari ${totalPagesExp}`;
      doc.text(pageStr, 287, pageHeight - 5, { align: 'right' });
    }
  });

  // --- 6. LEMBAR PENGESAHAN / TANDA TANGAN RESMI KEMENKEU DI AKHIR LAPORAN ---
  const finalTableY = (doc as any).lastAutoTable
    ? (doc as any).lastAutoTable.finalY
    : 140;
  const pageHeight = doc.internal.pageSize.getHeight();
  const signatureHeight = 36;

  if (pageHeight - finalTableY < signatureHeight + 16) {
    doc.addPage();
  }

  const sigStartY =
    pageHeight - finalTableY >= signatureHeight + 16 ? finalTableY + 6 : 24;

  // Sisi Kiri: Boks Catatan Dinas & Dasar Hukum
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.25);
  doc.roundedRect(10, sigStartY, 140, signatureHeight - 3, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(15, 47, 87);
  doc.text('CATATAN PEMBINAAN & TINDAK LANJUT EVALUASI IKPA:', 13, sigStartY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.setTextColor(71, 85, 105);
  doc.text(
    '1. Evaluasi IKPA berpedoman pada Perdirjen Perbendaharaan No. PER-5/PB/2024 tentang',
    13,
    sigStartY + 8.5
  );
  doc.text(
    '   Petunjuk Teknis Penilaian Indikator Kinerja Pelaksanaan Anggaran Belanja K/L.',
    13,
    sigStartY + 11.8
  );
  doc.text(
    '2. Satuan kerja berpredikat Cukup (<89) dan Kurang (<70) diprioritaskan untuk asistensi',
    13,
    sigStartY + 15.5
  );
  doc.text(
    '   dan pembinaan intensif bersama Seksi MSKI KPPN Semarang I.',
    13,
    sigStartY + 18.8
  );
  doc.text(
    '3. Rekomendasi perbaikan agar segera dieksekusi sebelum masa cut-off triwulan berakhir',
    13,
    sigStartY + 22.5
  );
  doc.text(
    '   guna mendongkrak capaian nilai IKPA gabungan KPPN Semarang I.',
    13,
    sigStartY + 25.8
  );

  // Sisi Kanan: Format Pengesahan Dinas
  const sigX = 205;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(30, 41, 59);
  doc.text(`Semarang, ${printDateStr}`, sigX, sigStartY + 3.5);

  doc.text('a.n. Kepala Kantor Pelayanan Perbendaharaan Negara', sigX, sigStartY + 7.5);
  doc.text('Tipe A1 Semarang I', sigX, sigStartY + 11);

  doc.setFont('helvetica', 'bold');
  doc.text(
    options.pejabatJabatan || 'Kepala Seksi Manajemen Satker dan Kepatuhan Internal,',
    sigX,
    sigStartY + 15
  );

  // Ruang Tanda Tangan
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  const namaPejabat = options.pejabatNama || 'SUHARTONO, S.E., M.M.';
  const nipPejabat = options.pejabatNip || 'NIP 19780512 200212 1 001';
  doc.text(namaPejabat, sigX, sigStartY + 28);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(nipPejabat, sigX, sigStartY + 31.5);

  // Garis penutup tanda tangan
  doc.setDrawColor(15, 47, 87);
  doc.setLineWidth(0.25);
  doc.line(sigX, sigStartY + 28.5, sigX + 65, sigStartY + 28.5);

  if (typeof (doc as any).putTotalPages === 'function') {
    (doc as any).putTotalPages(totalPagesExp);
  }

  const cleanPeriode = (periodeText || 'IKPA').replace(/[^a-zA-Z0-9]/g, '_');
  const safeFilename =
    options.filename ||
    `Laporan_Monitoring_IKPA_Satker_${cleanPeriode}_${printDate.toISOString().slice(0, 10)}.pdf`;
  doc.save(safeFilename);
}

/**
 * Export Pejabat Sertifikasi to Excel
 */
export function exportPejabatToExcel(pejabatList: PejabatSertifikasi[], filename = 'Data_Pejabat_Sertifikasi_KPPN_Semarang_I.xlsx') {
  const data = pejabatList.map((p, index) => ({
    'No': index + 1,
    'NIP': p.nip,
    'Nama Pejabat': p.nama,
    'Kode Satker': p.kdSatker,
    'Nama Satker': p.nmSatker,
    'Jabatan': p.nmJabatan,
    'Nomor Sertifikat (NTPN/NTR)': p.noSertifikat || '-',
    'Tanggal Terbit': p.tglSertifikat || '-',
    'Masa Kadaluarsa': p.tglKadaluarsa || '-'
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Pejabat Perbendaharaan');
  XLSX.writeFile(workbook, filename);
}

/**
 * Export Pejabat Sertifikasi to PDF
 */
export function exportPejabatToPDF(pejabatList: PejabatSertifikasi[], title = 'Laporan Sertifikasi Pejabat Perbendaharaan') {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('KPPN SEMARANG I - SERTIFIKASI PEJABAT PERBENDAHARAAN', 14, 15);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 14, 22);

  const tableColumn = ['No', 'NIP', 'Nama Pejabat', 'Kode Satker', 'Nama Satker', 'Jabatan', 'No. Sertifikat', 'Masa Kadaluarsa'];
  const tableRows = pejabatList.map((p, index) => [
    index + 1,
    p.nip,
    p.nama,
    p.kdSatker,
    p.nmSatker.length > 25 ? p.nmSatker.substring(0, 23) + '...' : p.nmSatker,
    p.nmJabatan,
    p.noSertifikat || '-',
    p.tglKadaluarsa || '-'
  ]);

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 28,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [14, 116, 144], textColor: [255, 255, 255], fontStyle: 'bold' }
  });

  doc.save(`${title.replace(/\s+/g, '_')}.pdf`);
}

export interface ExportDeviasiHal3PdfOptions {
  periodeLabel?: string;
  filename?: string;
  klLabel?: string;
}

/**
 * Export Tabel Kepatuhan Deviasi Halaman III DIPA Satker to PDF
 * Desain Eksekutif Standar Ditjen Perbendaharaan (DJPb - Kemenkeu):
 * 1. Menampilkan seluruh halaman / seluruh satker yang ada
 * 2. Tanpa kolom total deviasi (fokus pada jenis belanja 51, 52, 53, 57)
 * 3. Two-tier header elegan dengan kode warna jenis belanja
 * 4. Executive summary cards (Total Satker, Sesuai RPD, Ada Deviasi)
 * 5. Box petunjuk resmi My Intress dengan navigasi breadcrumb yang jelas
 * 6. Running header & footer resmi KPPN Semarang I dengan penomoran dinamis
 */
export function exportDeviasiHal3ToPDF(
  records: DeviasiHal3Record[],
  options?: ExportDeviasiHal3PdfOptions
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const totalPagesExp = '{total_pages_count_string}';

  const getNamaBulanPdf = (p: number | string | undefined): string => {
    const num = Number(p) || 9;
    const names: { [k: number]: string } = {
      1: 'Januari', 2: 'Februari', 3: 'Maret', 4: 'April',
      5: 'Mei', 6: 'Juni', 7: 'Juli', 8: 'Agustus',
      9: 'September', 10: 'Oktober', 11: 'November', 12: 'Desember'
    };
    return names[num] || `Bulan ${num}`;
  };

  const periodeText = options?.periodeLabel || 'Bulan September (09)';
  const klText = options?.klLabel && options.klLabel !== 'ALL' ? ` | K/L: ${options.klLabel}` : '';
  const printDateStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const formatRp = (val: number) => {
    if (!val || val === 0) return 'Rp 0';
    return 'Rp ' + Math.round(val).toLocaleString('id-ID');
  };

  // --- 1. ACCENT TOP BAR (Navy + Gold Kemenkeu) ---
  doc.setFillColor(30, 58, 138); // navy-900
  doc.rect(0, 0, 297, 3, 'F');
  doc.setFillColor(217, 119, 6); // amber-600 gold accent
  doc.rect(0, 3, 297, 1, 'F');

  // --- 2. HEADER INSTANSI (Bersih & Resmi Kemenkeu) ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text('KEMENTERIAN KEUANGAN REPUBLIK INDONESIA', 12, 11);
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text('DIREKTORAT JENDERAL PERBENDAHARAAN - KPPN TIPE A1 SEMARANG I (KPPN 026)', 12, 15.5);

  // --- 3. JUDUL LAPORAN & METADATA RESMI (Basis Data: My Intress) ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(17, 24, 39); // gray-900
  doc.text('TABEL KEPATUHAN DEVIASI HALAMAN III DIPA SATUAN KERJA', 12, 22.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Periode Evaluasi: ${periodeText}${klText}   |   Jumlah Satker: ${records.length} Satker   |   Tanggal Cetak: ${printDateStr}   |   Basis Data: My Intress`, 12, 27.5);

  // --- 4. NOTICE BOX RESMI MY INTRESS ---
  // Container Background
  doc.setFillColor(255, 251, 235); // amber-50/yellow-50
  doc.setDrawColor(245, 158, 11);  // amber-500
  doc.setLineWidth(0.4);
  doc.roundedRect(12, 30.5, 273, 11.5, 1.8, 1.8, 'FD');

  // Badge Tag "PETUNJUK SATKER"
  doc.setFillColor(217, 119, 6); // amber-600
  doc.roundedRect(15, 32.2, 28, 4.2, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(255, 255, 255);
  doc.text('PETUNJUK SATKER', 29, 35.2, { align: 'center' });

  // Breadcrumb path & instruction
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(120, 53, 15); // amber-950
  doc.text('Silakan cek My Intress:', 46, 35.2);

  // Path highlight
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 138); // blue path
  doc.text('Tematik  >  Indikator Kinerja Pelaksanaan Anggaran  >  Indikator Kinerja Pelaksanaan Anggaran Satker  >  klik nilai Halaman III DIPA', 78, 35.2);

  // Subtitle note
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.1);
  doc.setTextColor(146, 64, 14);
  doc.text('untuk melakukan cek kesesuaian RPD (Matriks di bawah ini menyajikan nominal selisih/deviasi Rupiah per jenis belanja tanpa menyajikan angka RPD dan Realisasi).', 15, 39.8);

  // --- 5. TABLE SETUP WITH 2-TIER HEADER (TANPA STATUS & TANPA TOTAL DEVIASI) ---
  // Row 1 & Row 2 headers
  const headRow1 = [
    { content: 'NO', rowSpan: 2, styles: { halign: 'center', valign: 'middle', fillColor: [30, 41, 59] } },
    { content: 'SATUAN KERJA', rowSpan: 2, styles: { halign: 'left', valign: 'middle', fillColor: [30, 41, 59] } },
    { content: 'BULAN DEVIASI', rowSpan: 2, styles: { halign: 'center', valign: 'middle', fillColor: [30, 41, 59] } },
    { content: 'RINCIAN DEVIASI NOMINAL PER JENIS BELANJA (RUPIAH)', colSpan: 4, styles: { halign: 'center', valign: 'middle', fillColor: [30, 58, 138], fontStyle: 'bold' } }
  ];

  const headRow2 = [
    { content: '51 PEGAWAI', styles: { halign: 'right', fillColor: [2, 132, 199], textColor: [255, 255, 255] } }, // sky-600
    { content: '52 BARANG', styles: { halign: 'right', fillColor: [217, 119, 6], textColor: [255, 255, 255] } },  // amber-600
    { content: '53 MODAL', styles: { halign: 'right', fillColor: [124, 58, 237], textColor: [255, 255, 255] } }, // purple-600
    { content: '57 BANSOS', styles: { halign: 'right', fillColor: [5, 150, 105], textColor: [255, 255, 255] } }  // emerald-600
  ];

  const tableRows = records.map((r, index) => {
    const dev51 = r.rincianJenisBelanja?.belanja51?.deviasiNominal || 0;
    const dev52 = r.rincianJenisBelanja?.belanja52?.deviasiNominal || 0;
    const dev53 = r.rincianJenisBelanja?.belanja53?.deviasiNominal || 0;
    const dev57 = r.rincianJenisBelanja?.belanja57?.deviasiNominal || 0;

    const satkerLabel = `${r.namaSatker}\n[${r.kodeSatker}]${r.kementerianLembaga ? ' ' + r.kementerianLembaga : ''}`;
    const bulanNama = getNamaBulanPdf(r.periodeAngka);
    const bln = `Bulan ${bulanNama}\n(${String(r.periodeAngka || 1).padStart(2, '0')})`;

    return [
      index + 1,
      satkerLabel,
      bln,
      formatRp(dev51),
      formatRp(dev52),
      formatRp(dev53),
      formatRp(dev57)
    ];
  });

  autoTable(doc, {
    head: [headRow1 as any, headRow2 as any],
    body: tableRows,
    startY: 44,
    margin: { left: 12, right: 12, top: 18, bottom: 14 },
    theme: 'grid',
    showHead: 'everyPage',
    styles: {
      fontSize: 7.2,
      cellPadding: 1.6,
      lineColor: [226, 232, 240], // slate-200
      lineWidth: 0.18,
      textColor: [30, 41, 59],
      valign: 'middle'
    },
    headStyles: {
      fontSize: 7.5,
      fontStyle: 'bold',
      textColor: [255, 255, 255],
      lineWidth: 0.2,
      lineColor: [255, 255, 255]
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252] // slate-50
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'left', cellWidth: 97, fontStyle: 'bold' },
      2: { halign: 'center', cellWidth: 26, fontStyle: 'bold' },
      3: { halign: 'right', cellWidth: 35 },
      4: { halign: 'right', cellWidth: 35 },
      5: { halign: 'right', cellWidth: 35 },
      6: { halign: 'right', cellWidth: 35 }
    },
    didParseCell: function(data) {
      if (data.section === 'body') {
        const rowIdx = data.row.index;
        const rowRecord = records[rowIdx];
        if (!rowRecord) return;

        // Visual contrast & colors
        if (data.column.index === 3) {
          const v = rowRecord.rincianJenisBelanja?.belanja51?.deviasiNominal || 0;
          if (v > 0) {
            data.cell.styles.textColor = [2, 132, 199]; // sky-600
            data.cell.styles.fontStyle = 'bold';
          } else {
            data.cell.styles.textColor = [148, 163, 184]; // slate-400
          }
        } else if (data.column.index === 4) {
          const v = rowRecord.rincianJenisBelanja?.belanja52?.deviasiNominal || 0;
          if (v > 0) {
            data.cell.styles.textColor = [217, 119, 6]; // amber-600
            data.cell.styles.fontStyle = 'bold';
          } else {
            data.cell.styles.textColor = [148, 163, 184];
          }
        } else if (data.column.index === 5) {
          const v = rowRecord.rincianJenisBelanja?.belanja53?.deviasiNominal || 0;
          if (v > 0) {
            data.cell.styles.textColor = [124, 58, 237]; // purple-600
            data.cell.styles.fontStyle = 'bold';
          } else {
            data.cell.styles.textColor = [148, 163, 184];
          }
        } else if (data.column.index === 6) {
          const v = rowRecord.rincianJenisBelanja?.belanja57?.deviasiNominal || 0;
          if (v > 0) {
            data.cell.styles.textColor = [5, 150, 105]; // emerald-600
            data.cell.styles.fontStyle = 'bold';
          } else {
            data.cell.styles.textColor = [148, 163, 184];
          }
        }
      }
    },
    didDrawPage: function(data) {
      const pageHeight = doc.internal.pageSize.getHeight();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Top running accent on all pages
      doc.setFillColor(30, 58, 138);
      doc.rect(0, 0, pageWidth, 2.5, 'F');
      doc.setFillColor(217, 119, 6);
      doc.rect(0, 2.5, pageWidth, 0.8, 'F');

      // Running header for pages > 1
      if (data.pageNumber > 1) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(30, 41, 59);
        doc.text(`TABEL KEPATUHAN DEVIASI HALAMAN III DIPA  •  ${periodeText}  •  Basis Data: My Intress  •  KPPN SEMARANG I`, 12, 9);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.8);
        doc.setTextColor(146, 64, 14);
        doc.text('Petunjuk My Intress: Tematik > Indikator Kinerja Pelaksanaan Anggaran > Satker > klik nilai Hal III DIPA', 12, 13.5);

        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.2);
        doc.line(12, 15, 285, 15);
      }

      // Footer line
      doc.setDrawColor(203, 213, 225); // slate-300
      doc.setLineWidth(0.3);
      doc.line(12, pageHeight - 10, 285, pageHeight - 10);

      // Footer note
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(30, 58, 138);
      doc.text('KPPN TIPE A1 SEMARANG I', 12, pageHeight - 5.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      doc.setTextColor(100, 116, 139);
      doc.text(' •  Basis Data: My Intress  •  Monitoring Deviasi Halaman III DIPA Satker', 49, pageHeight - 5.5);

      // Page numbering
      const pageStr = `Halaman ${data.pageNumber} dari ${totalPagesExp}`;
      doc.setFont('helvetica', 'bold');
      doc.text(pageStr, 285, pageHeight - 5.5, { align: 'right' });
    }
  });

  // Calculate total pages dynamically
  if (typeof (doc as any).putTotalPages === 'function') {
    (doc as any).putTotalPages(totalPagesExp);
  }

  const safeFilename = options?.filename || `Tabel_Kepatuhan_Deviasi_Hal_III_DIPA_Satker_${periodeText.replace(/\s+/g, '_')}.pdf`;
  doc.save(safeFilename);
}

export interface ExportPengelolaanUPPdfOptions {
  referenceDate?: Date;
  title?: string;
  subtitle?: string;
  filterLabel?: string;
  updateDateStr?: string;
  filename?: string;
  pejabatNama?: string;
  pejabatNip?: string;
  pejabatJabatan?: string;
}

/**
 * Export Laporan Monitoring Batas Waktu UP & TUP Satker ke PDF
 * Standar Eksekutif Ditjen Perbendaharaan (DJPb - Kemenkeu):
 * - Orientasi A4 Landscape elegan dan proporsional (297 mm x 210 mm)
 * - Kop resmi Kementerian Keuangan & KPPN Tipe A1 Semarang I dengan emblem vektor
 * - Kartu ringkasan KPI eksekutif (Total, Telat, Hari Ini, Siaga <= 7 Hari, Ketentuan SAKTI)
 * - Tabel komprehensif bersih tanpa karakter rusak/mojibake
 * - Pewarnaan baris otomatis sesuai level urgensi dengan kontras tinggi
 * - Running header & footer dinamis dengan nomor halaman resmi
 * - Blok Pengesahan / Tanda Tangan resmi Pejabat Pengawas di halaman akhir
 */
export function exportPengelolaanUPToPDF(
  records: PengelolaanUPRecord[],
  options?: ExportPengelolaanUPPdfOptions
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const totalPagesExp = '{total_pages_count_string}';
  const refDate = options?.referenceDate || new Date();

  // Evaluasi setiap record satker
  const evaluatedList = records.map((record) => {
    const up = evaluateUPRecordStatus(record, refDate, 'UP');
    const tup = evaluateUPRecordStatus(record, refDate, 'TUP');
    const isTelatAny = up.isTelat || tup.isTelat;
    const isHariIniAny = !isTelatAny && (up.isHariIni || tup.isHariIni);
    const isMendekatiAny = !isTelatAny && !isHariIniAny && (up.isMendekati1Minggu || tup.isMendekati1Minggu);
    const is1MingguAny = up.isDalam1Minggu || tup.isDalam1Minggu;
    const isNihilAny = up.isNihil && tup.isNihil;

    let priorityScore = 4;
    if (isTelatAny) priorityScore = 1;
    else if (isHariIniAny) priorityScore = 2;
    else if (isMendekatiAny) priorityScore = 3;

    const minDays = Math.min(
      up.rawDeadline !== '-' && up.rawDeadline !== '' ? up.sisaHari : 999,
      tup.rawDeadline !== '-' && tup.rawDeadline !== '' ? tup.sisaHari : 999
    );

    return {
      record,
      up,
      tup,
      isTelatAny,
      isHariIniAny,
      isMendekatiAny,
      is1MingguAny,
      isNihilAny,
      priorityScore,
      minDays
    };
  });

  // Urutkan berdasarkan prioritas urgensi: Telat -> Hari Ini -> Sisa Hari Terkecil -> Kode Satker
  evaluatedList.sort((a, b) => {
    if (a.priorityScore !== b.priorityScore) return a.priorityScore - b.priorityScore;
    if (a.minDays !== b.minDays) return a.minDays - b.minDays;
    return a.record.kodeSatker.localeCompare(b.record.kodeSatker);
  });

  // Hitung statistik
  const countTotal = evaluatedList.length;
  const countTelat = evaluatedList.filter(e => e.isTelatAny).length;
  const countHariIni = evaluatedList.filter(e => e.isHariIniAny).length;
  const countMendekati = evaluatedList.filter(e => e.isMendekatiAny).length;

  const printDateStr = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const printTimeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
  const refDateStr = refDate.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const docTitle = options?.title || 'LAPORAN MONITORING BATAS WAKTU PENGELOLAAN UP DAN TUP';
  const docSubtitle = options?.subtitle || 'DAFTAR SATUAN KERJA PRIORITAS PENGAWASAN (KURUN WAKTU < 1 MINGGU & TELAT)';
  const filterBadge = options?.filterLabel || 'Kurun < 1 Minggu & Telat';
  const updateInfo = options?.updateDateStr ? `Update Data: ${options.updateDateStr}` : 'Sumber: Data Karwas SAKTI / OMSPAN';

  // --- 1. ACCENT TOP BAR (Navy + Gold Kemenkeu) ---
  doc.setFillColor(15, 47, 87); // Deep Navy Kemenkeu #0F2F57
  doc.rect(0, 0, 297, 3.2, 'F');
  doc.setFillColor(212, 175, 55); // Kemenkeu Gold #D4AF37
  doc.rect(0, 3.2, 297, 1, 'F');

  // --- 2. HEADER KOP INSTANSI RESMI KEMENKEU DENGAN EMBLEM VEKTOR ---
  drawKemenkeuEmblem(doc, 12, 6.5, 14.5);

  const kopTextX = 29.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 47, 87);
  doc.text('KEMENTERIAN KEUANGAN REPUBLIK INDONESIA', kopTextX, 9.8);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 64, 175); // Blue-700
  doc.text('DIREKTORAT JENDERAL PERBENDAHARAAN', kopTextX, 13.8);

  doc.setFontSize(7.2);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('KANTOR WILAYAH PROVINSI JAWA TENGAH', kopTextX, 17.2);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('KANTOR PELAYANAN PERBENDAHARAAN NEGARA TIPE A1 SEMARANG I', kopTextX, 20.8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Jalan Ki Mangunsarkoro No. 34, Semarang 50241 | Telepon (024) 8412850 | Laman: djpb.kemenkeu.go.id/kppn/semarang1', kopTextX, 24);

  // Garis Ganda Pembatas Kop Surat Kemenkeu
  doc.setDrawColor(15, 47, 87);
  doc.setLineWidth(0.65);
  doc.line(12, 26, 285, 26);

  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.3);
  doc.line(12, 27.1, 285, 27.1);

  // --- 3. JUDUL LAPORAN & SUBTITLE ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 47, 87);
  doc.text(docTitle, 12, 32.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(153, 27, 27); // Dark Red / Crimson
  doc.text(docSubtitle, 12, 36.8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Tanggal Acuan: ${refDateStr}   |   Waktu Unduh: ${printDateStr}, ${printTimeStr}   |   Kategori: ${filterBadge}   |   ${updateInfo}`,
    12,
    41
  );

  // --- 4. EXECUTIVE SUMMARY METRIC CARDS ---
  const cardY = 43.5;
  const cardH = 11.5;
  const cardW = 44;
  const gap = 3.5;

  // Card 1: Total Terdaftar
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.25);
  doc.roundedRect(12, cardY, cardW, cardH, 1.5, 1.5, 'FD');
  // Accent bar mini
  doc.setFillColor(15, 47, 87);
  doc.rect(12, cardY, cardW, 1.2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL TERDAFTAR', 15, cardY + 4.2);
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`${countTotal} Satker`, 15, cardY + 8.4);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.8);
  doc.setTextColor(148, 163, 184);
  doc.text('Dalam pengawasan aktif', 15, cardY + 10.5);

  // Card 2: Telat / Overdue
  const c2X = 12 + (cardW + gap);
  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(248, 113, 113);
  doc.roundedRect(c2X, cardY, cardW, cardH, 1.5, 1.5, 'FD');
  doc.setFillColor(185, 28, 28);
  doc.rect(c2X, cardY, cardW, 1.2, 'F');
  // Dot indicator
  doc.circle(c2X + 4.5, cardY + 3.8, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(185, 28, 28);
  doc.text('TELAT / LEWAT BATAS', c2X + 7, cardY + 4.2);
  doc.setFontSize(10);
  doc.setTextColor(153, 27, 27);
  doc.text(`${countTelat} Satker`, c2X + 7, cardY + 8.4);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.8);
  doc.setTextColor(220, 38, 38);
  doc.text('Segera terbitkan SPM GUP!', c2X + 7, cardY + 10.5);

  // Card 3: Jatuh Tempo Hari Ini
  const c3X = 12 + (cardW + gap) * 2;
  doc.setFillColor(255, 251, 235);
  doc.setDrawColor(251, 191, 36);
  doc.roundedRect(c3X, cardY, cardW, cardH, 1.5, 1.5, 'FD');
  doc.setFillColor(217, 119, 6);
  doc.rect(c3X, cardY, cardW, 1.2, 'F');
  // Dot indicator
  doc.circle(c3X + 4.5, cardY + 3.8, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(180, 83, 9);
  doc.text('JATUH TEMPO HARI INI', c3X + 7, cardY + 4.2);
  doc.setFontSize(10);
  doc.setTextColor(146, 64, 14);
  doc.text(`${countHariIni} Satker`, c3X + 7, cardY + 8.4);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.8);
  doc.setTextColor(202, 138, 4);
  doc.text('Cut-off jam kerja SAKTI', c3X + 7, cardY + 10.5);

  // Card 4: Siaga (Sisa <= 7 Hari)
  const c4X = 12 + (cardW + gap) * 3;
  doc.setFillColor(254, 252, 232);
  doc.setDrawColor(250, 204, 21);
  doc.roundedRect(c4X, cardY, cardW, cardH, 1.5, 1.5, 'FD');
  doc.setFillColor(202, 138, 4);
  doc.rect(c4X, cardY, cardW, 1.2, 'F');
  // Dot indicator
  doc.circle(c4X + 4.5, cardY + 3.8, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(161, 98, 7);
  doc.text('SIAGA (SISA <= 7 HARI)', c4X + 7, cardY + 4.2);
  doc.setFontSize(10);
  doc.setTextColor(133, 77, 14);
  doc.text(`${countMendekati} Satker`, c4X + 7, cardY + 8.4);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.8);
  doc.setTextColor(180, 83, 9);
  doc.text('Siapkan berkas pengajuan SPM', c4X + 7, cardY + 10.5);

  // Card 5: Ketentuan Pengelolaan UP/TUP
  const noticeX = 12 + (cardW + gap) * 4;
  const noticeW = 285 - noticeX;
  doc.setFillColor(239, 246, 255);
  doc.setDrawColor(191, 219, 254);
  doc.roundedRect(noticeX, cardY, noticeW, cardH, 1.5, 1.5, 'FD');
  doc.setFillColor(30, 58, 138);
  doc.rect(noticeX, cardY, noticeW, 1.2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(30, 58, 138);
  doc.text('KETENTUAN PENGELOLAAN UP/TUP', noticeX + 3, cardY + 4.2);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.6);
  doc.setTextColor(51, 65, 85);
  doc.text('1. Revolving GUP minimal 1x dalam 1 bulan kalender.', noticeX + 3, cardY + 7);
  doc.text('2. Pertanggungjawaban TUP paling lambat 1 bulan sejak SP2D terbit.', noticeX + 3, cardY + 9.2);
  doc.text('3. Menjaga indikator IKPA Pengelolaan UP & likuiditas Kas Negara.', noticeX + 3, cardY + 11);

  // --- 5. TABLE CONFIGURATION ---
  const tableColumns = [
    { header: 'NO', dataKey: 'no' },
    { header: 'KODE & NAMA SATKER', dataKey: 'satker' },
    { header: 'BATAS WAKTU UP (KOLOM N)', dataKey: 'up' },
    { header: 'BATAS WAKTU TUP (KOLOM H)', dataKey: 'tup' },
    { header: 'STATUS URGENSI', dataKey: 'status' },
    { header: 'TINDAK LANJUT / REKOMENDASI', dataKey: 'rekomendasi' }
  ];

  const tableRows = evaluatedList.map((item, idx) => {
    const s = item.record;
    const up = item.up;
    const tup = item.tup;

    const satkerText = `${s.namaSatker}\nKode: ${s.kodeSatker}${s.kementerianLembaga ? ' | ' + s.kementerianLembaga : ''}`;

    let upText = '-';
    if (up.rawDeadline !== '-' && up.rawDeadline !== '') {
      let upStatusClean = 'Aman';
      if (up.isTelat) upStatusClean = `Telat ${Math.abs(up.sisaHari)} Hari`;
      else if (up.isHariIni) upStatusClean = 'Jatuh Tempo Hari Ini';
      else if (up.isMendekati1Minggu) upStatusClean = `Sisa H-${up.sisaHari} Hari`;
      else if (up.isNihil) upStatusClean = 'Nihil (Selesai)';

      upText = `${up.fullDateWithDay}\nStatus: ${upStatusClean}`;
      if (up.isWeekend && !up.isNihil) {
        const saranBersih = up.saranTglPengajuan.replace(/[()]/g, '').trim();
        upText += `\n(Hari Libur: Ajukan paling lambat ${saranBersih})`;
      }
    }

    let tupText = '-';
    if (tup.rawDeadline !== '-' && tup.rawDeadline !== '') {
      let tupStatusClean = 'Aman';
      if (tup.isTelat) tupStatusClean = `Telat ${Math.abs(tup.sisaHari)} Hari`;
      else if (tup.isHariIni) tupStatusClean = 'Jatuh Tempo Hari Ini';
      else if (tup.isMendekati1Minggu) tupStatusClean = `Sisa H-${tup.sisaHari} Hari`;
      else if (tup.isNihil) tupStatusClean = 'Nihil (Selesai)';

      tupText = `${tup.fullDateWithDay}\nStatus: ${tupStatusClean}`;
      if (tup.isWeekend && !tup.isNihil) {
        const saranBersih = tup.saranTglPengajuan.replace(/[()]/g, '').trim();
        tupText += `\n(Hari Libur: Ajukan paling lambat ${saranBersih})`;
      }
    }

    let statusText = '[ AMAN ]';
    if (item.isTelatAny) {
      const maxTelat = Math.max(
        up.isTelat ? Math.abs(up.sisaHari) : 0,
        tup.isTelat ? Math.abs(tup.sisaHari) : 0
      );
      statusText = `[ TELAT ] Lewat ${maxTelat} Hari`;
    } else if (item.isHariIniAny) {
      statusText = '[ HARI INI ] Jatuh Tempo';
    } else if (item.isMendekatiAny) {
      const minSisa = Math.min(
        up.isMendekati1Minggu ? up.sisaHari : 999,
        tup.isMendekati1Minggu ? tup.sisaHari : 999
      );
      statusText = `[ SIAGA ] Sisa H-${minSisa} Hari`;
    } else if (item.isNihilAny) {
      statusText = '[ TERTIB ] Nihil';
    }

    let recText = 'Pengelolaan UP/TUP dalam batas waktu normal.';
    if (item.isTelatAny) {
      if (up.isTelat && tup.isTelat) {
        recText = 'SEGERA terbitkan SPM GUP & pertanggungjawabkan/setor sisa TUP ke Kas Negara hari ini!';
      } else if (up.isTelat) {
        recText = 'Batas revolving UP terlampaui. SEGERA terbitkan dan kirimkan SPM GUP ke KPPN Semarang I.';
      } else {
        recText = 'Batas waktu TUP terlampaui. SEGERA ajukan SPM PTUP atau lakukan setoran sisa dana TUP.';
      }
    } else if (item.isHariIniAny) {
      recText = 'Jatuh tempo HARI INI. Ajukan berkas SPM GUP/PTUP sebelum batas waktu operasional SAKTI.';
    } else if (item.isMendekatiAny) {
      const isWeekendAny = (up.isMendekati1Minggu && up.isWeekend) || (tup.isMendekati1Minggu && tup.isWeekend);
      if (isWeekendAny) {
        recText = 'Batas jatuh pada hari libur. SPM wajib diajukan paling lambat pada hari kerja sebelumnya.';
      } else {
        recText = 'Segera selesaikan SPP/SPM GUP/PTUP dan unggah ke KPPN sebelum tanggal batas waktu.';
      }
    } else if (item.isNihilAny) {
      recText = 'GU Nihil telah selesai diproses. Tidak ada kewajiban revolving UP aktif.';
    }

    return {
      no: idx + 1,
      satker: satkerText,
      up: upText,
      tup: tupText,
      status: statusText,
      rekomendasi: recText,
      isTelat: item.isTelatAny,
      isHariIni: item.isHariIniAny,
      isMendekati: item.isMendekatiAny,
      isNihil: item.isNihilAny
    };
  });

  autoTable(doc, {
    columns: tableColumns,
    body: tableRows,
    startY: cardY + cardH + 3.5,
    margin: { left: 12, right: 12, top: 19, bottom: 14 },
    theme: 'grid',
    showHead: 'everyPage',
    styles: {
      fontSize: 6.8,
      cellPadding: 2,
      lineColor: [226, 232, 240], // slate-200
      lineWidth: 0.2,
      textColor: [30, 41, 59],
      valign: 'top'
    },
    headStyles: {
      fillColor: [15, 47, 87], // Deep Navy Kemenkeu
      textColor: [255, 255, 255],
      fontSize: 7.2,
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
      lineWidth: 0.25,
      lineColor: [255, 255, 255]
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252] // slate-50
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8, fontStyle: 'bold' }, // NO
      1: { halign: 'left', cellWidth: 73 }, // SATKER
      2: { halign: 'left', cellWidth: 47 }, // UP
      3: { halign: 'left', cellWidth: 47 }, // TUP
      4: { halign: 'center', cellWidth: 39, fontStyle: 'bold' }, // STATUS
      5: { halign: 'left', cellWidth: 59 } // REKOMENDASI
    },
    didParseCell: function(data) {
      if (data.section === 'body') {
        const rowIdx = data.row.index;
        const rowData = tableRows[rowIdx];
        if (!rowData) return;

        if (rowData.isTelat) {
          data.cell.styles.fillColor = [254, 242, 242]; // red-50
          if (data.column.index === 4) {
            data.cell.styles.fillColor = [254, 226, 226]; // red-100
            data.cell.styles.textColor = [185, 28, 28]; // red-700
            data.cell.styles.fontStyle = 'bold';
          }
          if (data.column.index === 5) {
            data.cell.styles.textColor = [153, 27, 27]; // red-800
            data.cell.styles.fontStyle = 'bold';
          }
        } else if (rowData.isHariIni) {
          data.cell.styles.fillColor = [254, 252, 232]; // yellow-50
          if (data.column.index === 4) {
            data.cell.styles.fillColor = [254, 240, 138]; // yellow-200
            data.cell.styles.textColor = [133, 77, 14]; // yellow-800
            data.cell.styles.fontStyle = 'bold';
          }
        } else if (rowData.isMendekati) {
          if (data.column.index === 4) {
            data.cell.styles.fillColor = [254, 243, 199]; // amber-100
            data.cell.styles.textColor = [180, 83, 9]; // amber-700
            data.cell.styles.fontStyle = 'bold';
          }
        } else if (rowData.isNihil) {
          if (data.column.index === 4) {
            data.cell.styles.fillColor = [209, 250, 229]; // emerald-100
            data.cell.styles.textColor = [4, 120, 87]; // emerald-700
          }
        }
      }
    },
    didDrawPage: function(data) {
      const pageHeight = doc.internal.pageSize.getHeight();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Top running accent on all pages
      doc.setFillColor(15, 47, 87);
      doc.rect(0, 0, pageWidth, 2.5, 'F');
      doc.setFillColor(212, 175, 55);
      doc.rect(0, 2.5, pageWidth, 0.8, 'F');

      // Running header for pages > 1
      if (data.pageNumber > 1) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(15, 47, 87);
        doc.text(`KEMENTERIAN KEUANGAN RI - KPPN TIPE A1 SEMARANG I  |  LAPORAN MONITORING BATAS WAKTU UP & TUP`, 12, 9.5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.8);
        doc.setTextColor(180, 83, 9);
        doc.text(`Kategori: ${filterBadge}  •  Acuan: ${refDateStr}`, 12, 13.8);

        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.25);
        doc.line(12, 15.5, 285, 15.5);
      }

      // Footer line
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.3);
      doc.line(12, pageHeight - 9, 285, pageHeight - 9);

      // Footer note
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.8);
      doc.setTextColor(15, 47, 87);
      doc.text('KPPN TIPE A1 SEMARANG I (026)', 12, pageHeight - 5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(' •  Seksi Manajemen Satker & Kepatuhan Internal (MSKI)  •  Pengawasan Batas Waktu UP & TUP SAKTI', 52, pageHeight - 5);

      // Page numbering
      const pageStr = `Halaman ${data.pageNumber} dari ${totalPagesExp}`;
      doc.setFont('helvetica', 'bold');
      doc.text(pageStr, 285, pageHeight - 5, { align: 'right' });
    }
  });

  // --- 6. LEMBAR PENGESAHAN / TANDA TANGAN RESMI KEMENKEU DI AKHIR LAPORAN ---
  const finalTableY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY : 140;
  const pageHeight = doc.internal.pageSize.getHeight();
  const signatureHeight = 36; // Tinggi blok tanda tangan

  // Jika sisa ruang di halaman terakhir tidak cukup, tambahkan halaman baru
  if (pageHeight - finalTableY < signatureHeight + 16) {
    doc.addPage();
  }

  const sigStartY = pageHeight - finalTableY >= signatureHeight + 16 ? finalTableY + 6 : 24;

  // Sisi Kiri: Catatan Penting Pengawasan
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.25);
  doc.roundedRect(12, sigStartY, 130, signatureHeight - 3, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(15, 47, 87);
  doc.text('CATATAN PENGAWASAN & INSTRUKSI TINDAK LANJUT:', 15, sigStartY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.setTextColor(71, 85, 105);
  doc.text('1. Laporan ini merupakan instrumen kendali internal KPPN Semarang I guna memitigasi', 15, sigStartY + 8.5);
  doc.text('   keterlambatan revolving UP dan pertanggungjawaban TUP pada satker mitra.', 15, sigStartY + 11.8);
  doc.text('2. Bagi satuan kerja berstatus TELAT atau SIAGA, wajib segera mengajukan SPM ke KPPN', 15, sigStartY + 15.5);
  doc.text('   atau memberikan klarifikasi tertulis kepada Seksi MSKI KPPN Semarang I.', 15, sigStartY + 18.8);
  doc.text('3. Kelalaian revolving UP berpotensi menurunkan skor Indikator Kinerja Pelaksanaan', 15, sigStartY + 22.5);
  doc.text('   Anggaran (IKPA) Satker serta pemotongan besaran UP pada periode berikutnya.', 15, sigStartY + 25.8);

  // Sisi Kanan: Format Pengesahan Dinas
  const sigX = 200;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(30, 41, 59);
  doc.text(`Semarang, ${refDateStr}`, sigX, sigStartY + 3.5);

  doc.text('a.n. Kepala Kantor Pelayanan Perbendaharaan Negara', sigX, sigStartY + 7.5);
  doc.text('Tipe A1 Semarang I', sigX, sigStartY + 11);

  doc.setFont('helvetica', 'bold');
  doc.text(options?.pejabatJabatan || 'Kepala Seksi Manajemen Satker dan Kepatuhan Internal,', sigX, sigStartY + 15);

  // Ruang Tanda Tangan
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  const namaPejabat = options?.pejabatNama || 'SUHARTONO, S.E., M.M.';
  const nipPejabat = options?.pejabatNip || 'NIP 19780512 200212 1 001';
  doc.text(namaPejabat, sigX, sigStartY + 28);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(nipPejabat, sigX, sigStartY + 31.5);

  // Garis penutup tanda tangan
  doc.setDrawColor(15, 47, 87);
  doc.setLineWidth(0.25);
  doc.line(sigX, sigStartY + 28.5, sigX + 65, sigStartY + 28.5);

  if (typeof (doc as any).putTotalPages === 'function') {
    (doc as any).putTotalPages(totalPagesExp);
  }

  const cleanFilterName = filterBadge.replace(/[^a-zA-Z0-9]/g, '_');
  const safeFilename = options?.filename || `Laporan_Batas_Waktu_UP_TUP_${cleanFilterName}_${refDate.toISOString().slice(0, 10)}.pdf`;
  doc.save(safeFilename);
}

/**
 * Export Laporan Batas Waktu UP & TUP ke Excel (.xlsx)
 */
export function exportPengelolaanUPToExcel(
  records: PengelolaanUPRecord[],
  referenceDate: Date = new Date(),
  filename = 'Laporan_Batas_Waktu_UP_TUP_KPPN_Semarang_I.xlsx'
) {
  const excelData = records.map((r, index) => {
    const up = evaluateUPRecordStatus(r, referenceDate, 'UP');
    const tup = evaluateUPRecordStatus(r, referenceDate, 'TUP');
    
    let statusUrgensi = 'Aman';
    if (up.isTelat || tup.isTelat) statusUrgensi = 'Telat / Sudah Jatuh Tempo';
    else if (up.isHariIni || tup.isHariIni) statusUrgensi = 'Jatuh Tempo Hari Ini';
    else if (up.isMendekati1Minggu || tup.isMendekati1Minggu) statusUrgensi = 'Kurun 1 Minggu (<= 7 Hari)';
    else if (up.isNihil && tup.isNihil) statusUrgensi = 'Nihil';

    return {
      'No': index + 1,
      'Kode Satker': r.kodeSatker,
      'Nama Satker': r.namaSatker,
      'Kementerian/Lembaga': r.kementerianLembaga || '-',
      'Batas Waktu UP (Kolom N)': up.fullDateWithDay,
      'Status Batas UP': up.badgeLabel.replace(/[⚠️⚡⏱️✓]/g, '').trim(),
      'Sisa Hari UP': up.sisaHari < 900 ? up.sisaHari : '-',
      'Batas Waktu TUP (Kolom H)': tup.fullDateWithDay,
      'Status Batas TUP': tup.badgeLabel.replace(/[⚠️⚡⏱️✓]/g, '').trim(),
      'Sisa Hari TUP': tup.sisaHari < 900 ? tup.sisaHari : '-',
      'Status Urgensi': statusUrgensi,
      'Saran Pengajuan': up.isWeekend ? up.saranTglPengajuan : (tup.isWeekend ? tup.saranTglPengajuan : '-')
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(excelData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Monitoring UP TUP');
  XLSX.writeFile(workbook, filename);
}


