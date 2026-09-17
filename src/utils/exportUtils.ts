import { SatkerIKPA, PejabatSertifikasi, DeviasiHal3Record } from '../types';
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

/**
 * Export Satker IKPA Data to PDF (.pdf)
 */
export function exportSatkersToPDF(satkers: SatkerIKPA[], title = 'Laporan Monitoring IKPA KPPN Semarang I') {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // Header Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('KEMENTERIAN KEUANGAN REPUBLIK INDONESIA', 14, 15);
  doc.setFontSize(12);
  doc.text('KANTOR PELAYANAN PERBENDAHARAAN NEGARA SEMARANG I (KPPN 026)', 14, 22);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(title, 14, 29);
  doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 14, 35);

  const tableColumn = [
    'No', 'Kode', 'Nama Satker', 'K/L', 'Pagu (Rp)', 'Realisasi (Rp)', '% Serap', 'Nilai IKPA', 'Predikat'
  ];

  const tableRows = satkers.map((s, index) => [
    index + 1,
    s.kodeSatker,
    s.namaSatker.length > 30 ? s.namaSatker.substring(0, 28) + '...' : s.namaSatker,
    s.kementerianLembaga || '-',
    s.paguAnggaran.toLocaleString('id-ID'),
    s.realisasiAnggaran.toLocaleString('id-ID'),
    `${s.persenPenyerapan.toFixed(1)}%`,
    s.nilaiTotalIKPA.toFixed(2),
    s.predikat
  ]);

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 40,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] }
  });

  doc.save(`${title.replace(/\s+/g, '_')}.pdf`);
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

  const periodeText = options?.periodeLabel || 'Semua Periode';
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
  doc.roundedRect(12, 30.5, 273, 11, 1.8, 1.8, 'FD');

  // Badge Tag "PETUNJUK SATKER"
  doc.setFillColor(217, 119, 6); // amber-600
  doc.roundedRect(15, 32.2, 31, 4.2, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(255, 255, 255);
  doc.text('PETUNJUK SATKER', 30.5, 35.2, { align: 'center' });

  // Breadcrumb path & instruction
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(120, 53, 15); // amber-950
  doc.text('Silakan cek My Intress:', 49, 35.3);

  // Path highlight
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 138); // blue path
  doc.text('Menu Tematik  >  Indikator Pelaksanaan Anggaran  >  Monitoring Deviasi Halaman III DIPA', 83, 35.3);

  // Subtitle note
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(146, 64, 14);
  doc.text('Catatan: Matriks di bawah ini murni menampilkan nominal selisih/deviasi Rupiah per jenis belanja tanpa menyajikan angka RPD dan Realisasi.', 15, 39.5);

  // --- 5. TABLE SETUP WITH 2-TIER HEADER ---
  // Row 1 & Row 2 headers
  const headRow1 = [
    { content: 'NO', rowSpan: 2, styles: { halign: 'center', valign: 'middle', fillColor: [30, 41, 59] } },
    { content: 'SATUAN KERJA', rowSpan: 2, styles: { halign: 'left', valign: 'middle', fillColor: [30, 41, 59] } },
    { content: 'BLN', rowSpan: 2, styles: { halign: 'center', valign: 'middle', fillColor: [30, 41, 59] } },
    { content: 'RINCIAN DEVIASI NOMINAL PER JENIS BELANJA (RUPIAH)', colSpan: 4, styles: { halign: 'center', valign: 'middle', fillColor: [30, 58, 138], fontStyle: 'bold' } },
    { content: 'STATUS', rowSpan: 2, styles: { halign: 'center', valign: 'middle', fillColor: [30, 41, 59] } }
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
    const isNihil = (r.deviasiNominalTotal || 0) === 0 && (dev51 + dev52 + dev53 + dev57 === 0);

    const satkerLabel = `${r.namaSatker}\n[${r.kodeSatker}]${r.kementerianLembaga ? ' ' + r.kementerianLembaga : ''}`;
    const bln = String(r.periodeAngka || 1).padStart(2, '0');

    return [
      index + 1,
      satkerLabel,
      bln,
      formatRp(dev51),
      formatRp(dev52),
      formatRp(dev53),
      formatRp(dev57),
      isNihil ? 'Sesuai RPD' : 'Ada Deviasi'
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
      1: { halign: 'left', cellWidth: 86, fontStyle: 'bold' },
      2: { halign: 'center', cellWidth: 11 },
      3: { halign: 'right', cellWidth: 40 },
      4: { halign: 'right', cellWidth: 40 },
      5: { halign: 'right', cellWidth: 40 },
      6: { halign: 'right', cellWidth: 24 },
      7: { halign: 'center', cellWidth: 22, fontStyle: 'bold' }
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
        } else if (data.column.index === 7) {
          const isNihil = (rowRecord.deviasiNominalTotal || 0) === 0;
          if (isNihil) {
            data.cell.styles.textColor = [21, 128, 61]; // green-700
            data.cell.styles.fillColor = [240, 253, 244]; // green-50
          } else {
            data.cell.styles.textColor = [180, 83, 9]; // amber-700
            data.cell.styles.fillColor = [254, 243, 199]; // amber-100
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
        doc.text('Petunjuk: Cek My Intress > Menu Tematik > Indikator Pelaksanaan Anggaran > Monitoring Deviasi Halaman III DIPA', 12, 13.5);

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

