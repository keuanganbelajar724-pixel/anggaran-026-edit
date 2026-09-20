import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { HAICSOTicket, HAICSOStatsSummary } from '../types';

export interface ExportHaiCsoPdfOptions {
  customTitle?: string;
  customSubtitle?: string;
  periodeLabel?: string;
  filterLabel?: string;
  filename?: string;
}

/**
 * Export PDF for Satker View
 * Specifically lists tickets needing Satker action:
 * - Menunggu konfirmasi/respons Satker
 * - Belum ada feedback
 */
export function exportHaiCsoSatkerPDF(
  tickets: HAICSOTicket[],
  options?: ExportHaiCsoPdfOptions
): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // 1. Kop Resmi KPPN Semarang I
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('KEMENTERIAN KEUANGAN REPUBLIK INDONESIA', 14, 11);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('DIREKTORAT JENDERAL PERBENDAHARAAN', 14, 15);
  doc.text('KANTOR WILAYAH DIREKTORAT JENDERAL PERBENDAHARAAN PROVINSI JAWA TENGAH', 14, 19);

  doc.setFont('helvetica', 'bold');
  doc.text('KANTOR PELAYANAN PERBENDAHARAAN NEGARA TIPE A1 SEMARANG I', 14, 23);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Jalan Ki Mangunsarkoro No. 34, Semarang 50241 • Telepon (024) 8414441 • djpb.kemenkeu.go.id/kppn/semarang1', 14, 27);

  // Divider Line
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.line(14, 29, 283, 29);

  // 2. Judul Dokumen
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  const title = options?.customTitle || 'MONITORING TIKET HAICSO';
  doc.text(title, 14, 35);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(217, 119, 6); // Amber-600
  const subtitle = options?.customSubtitle || 'DAFTAR TIKET YANG MEMERLUKAN TINDAK LANJUT SATKER (MENUNGGU RESPONS / BELUM ADA FEEDBACK)';
  doc.text(subtitle, 14, 40);

  // 3. Meta Information Bar
  const now = new Date();
  const dateFormatted = now.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const timeFormatted = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Periode: ${options?.periodeLabel || 'Tahun 2026'}   |   Total Perlu Tindak Lanjut: ${tickets.length} Tiket   |   Tanggal Cetak: ${dateFormatted}, ${timeFormatted}`, 14, 45);

  // 4. Table Construction
  const headers = [
    'No',
    'Nama Satker',
    'Kode',
    'Nama Pengguna',
    'Email',
    'Tanggal Tiket',
    'No. Referensi',
    'Subjek Tiket',
    'Status Tiket'
  ];

  const tableData = tickets.map((t, idx) => [
    idx + 1,
    t.nama_satker || '-',
    t.kode_satker || '-',
    t.nama_pengguna || '-',
    t.email || '-',
    t.tanggal_tiket || '-',
    t.nomor_referensi || '-',
    t.subjek || '-',
    t.status || '-'
  ]);

  autoTable(doc, {
    startY: 48,
    head: [headers],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 1.8,
      overflow: 'linebreak',
      valign: 'middle',
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.15
    },
    headStyles: {
      fillColor: [217, 119, 6], // Amber-600
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center'
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' }, // No
      1: { cellWidth: 46 }, // Nama Satker
      2: { cellWidth: 14, halign: 'center' }, // Kode
      3: { cellWidth: 26 }, // Pengguna
      4: { cellWidth: 36 }, // Email
      5: { cellWidth: 24, halign: 'center' }, // Tanggal
      6: { cellWidth: 32, fontStyle: 'bold' }, // No Ref
      7: { cellWidth: 50 }, // Subjek
      8: { cellWidth: 33, halign: 'center', fontStyle: 'bold' } // Status
    },
    didDrawPage: (data) => {
      // Footer page numbering
      const str = `Halaman ${data.pageNumber} dari ${doc.internal.pages.length - 1}  •  KPPN Semarang I - Sistem ANGKASA`;
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text(str, doc.internal.pageSize.width - 14, doc.internal.pageSize.height - 8, { align: 'right' });
    }
  });

  const filename = options?.filename || `Tiket_HAICSO_Tindak_Lanjut_Satker_${now.toISOString().substring(0, 10)}.pdf`;
  doc.save(filename);
}

/**
 * Export Comprehensive PDF for Admin View
 */
export function exportHaiCsoAdminPDF(
  tickets: HAICSOTicket[],
  summary: HAICSOStatsSummary,
  options?: ExportHaiCsoPdfOptions
): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // 1. Kop Resmi KPPN Semarang I
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('KEMENTERIAN KEUANGAN REPUBLIK INDONESIA', 14, 11);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('DIREKTORAT JENDERAL PERBENDAHARAAN', 14, 15);
  doc.text('KANTOR WILAYAH DIREKTORAT JENDERAL PERBENDAHARAAN PROVINSI JAWA TENGAH', 14, 19);

  doc.setFont('helvetica', 'bold');
  doc.text('KANTOR PELAYANAN PERBENDAHARAAN NEGARA TIPE A1 SEMARANG I', 14, 23);

  // Divider Line
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.line(14, 26, 283, 26);

  // 2. Judul
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  const title = options?.customTitle || 'MONITORING TIKET LAYANAN HAICSO KPPN SEMARANG I';
  doc.text(title, 14, 32);

  // 3. Mini KPI Box
  const kpiText = [
    `Total Tiket: ${summary.totalTickets}`,
    `Selesai: ${summary.selesaiCount} (${summary.persenSelesai}%)`,
    `Menunggu Satker: ${summary.menungguSatkerCount}`,
    `Belum Feedback: ${summary.belumFeedbackCount}`,
    `Menunggu KPPN: ${summary.menungguKppnCount}`,
    `Kirim ke HAI: ${summary.kirimHaiCount}`
  ].join('   |   ');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text(kpiText, 14, 37);

  if (options?.filterLabel) {
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Kriteria Filter Aktif: ${options.filterLabel}`, 14, 41);
  }

  // Table
  const headers = [
    'No',
    'Nama Satker',
    'Kode',
    'Pengguna',
    'Email',
    'Tanggal',
    'No. Referensi',
    'Subjek',
    'Status',
    'Feedback',
    'CSO'
  ];

  const tableData = tickets.map((t, idx) => [
    idx + 1,
    t.nama_satker || '-',
    t.kode_satker || '-',
    t.nama_pengguna || '-',
    t.email || '-',
    t.tanggal_tiket || '-',
    t.nomor_referensi || '-',
    t.subjek || '-',
    t.status || '-',
    t.status_feedback || '-',
    t.cso || '-'
  ]);

  autoTable(doc, {
    startY: options?.filterLabel ? 44 : 41,
    head: [headers],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 7,
      cellPadding: 1.5,
      overflow: 'linebreak',
      valign: 'middle',
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.15
    },
    headStyles: {
      fillColor: [30, 41, 59], // Slate-800
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center'
    },
    columnStyles: {
      0: { cellWidth: 7, halign: 'center' },
      1: { cellWidth: 42 },
      2: { cellWidth: 13, halign: 'center' },
      3: { cellWidth: 24 },
      4: { cellWidth: 32 },
      5: { cellWidth: 22, halign: 'center' },
      6: { cellWidth: 28, fontStyle: 'bold' },
      7: { cellWidth: 44 },
      8: { cellWidth: 24, halign: 'center' },
      9: { cellWidth: 18, halign: 'center' },
      10: { cellWidth: 15 }
    },
    didDrawPage: (data) => {
      const str = `Halaman ${data.pageNumber} dari ${doc.internal.pages.length - 1}  •  KPPN Semarang I - Sistem ANGKASA`;
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text(str, doc.internal.pageSize.width - 14, doc.internal.pageSize.height - 8, { align: 'right' });
    }
  });

  const now = new Date();
  const filename = options?.filename || `Rekap_Tiket_HAICSO_${now.toISOString().substring(0, 10)}.pdf`;
  doc.save(filename);
}
