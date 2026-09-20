import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  MonitoringRekonsiliasiRecord,
  RekonsiliasiBatchSummary
} from '../types';
import { formatPeriodeRekonsiliasi } from './rekonsiliasiExcelParser';

/**
 * Export Rekap Monitoring Kepatuhan Satker ke Excel Multi-Sheet
 */
export function exportRekapRekonsiliasiExcel(
  records: MonitoringRekonsiliasiRecord[],
  summary: RekonsiliasiBatchSummary,
  periode: string
): void {
  const wb = XLSX.utils.book_new();
  const formattedPeriode = formatPeriodeRekonsiliasi(periode);

  // Helper formatting row satker
  const formatRecordRow = (r: MonitoringRekonsiliasiRecord, idx: number) => [
    idx + 1,
    r.noKppnSatker,
    r.kodeSatker,
    r.namaSatker,
    r.kodeKppn,
    r.statusSatker,
    r.periode,
    r.rekonsiliasiRaw,
    r.todolistRaw,
    r.tutupPeriodeRaw,
    r.sp2sNomor,
    r.sp2sTanggal,
    r.sp3sNomor,
    r.sp3sTanggal,
    r.dispensasi,
    r.prioritasKategori === 'PERLU_TINDAKAN'
      ? 'Perlu Tindakan'
      : r.prioritasKategori === 'PERLU_PEMANTAUAN'
      ? 'Perlu Pemantauan'
      : 'Selesai'
  ];

  const headerCols = [
    'No',
    'No KPPN Satker',
    'Kode Satker',
    'Nama Satker',
    'Kode KPPN',
    'Status Satker',
    'Periode',
    'Rekonsiliasi',
    'Todolist',
    'Tutup Periode',
    'SP2S Nomor',
    'SP2S Tanggal',
    'SP3S Nomor',
    'SP3S Tanggal',
    'Dispensasi',
    'Prioritas'
  ];

  const colWidths = [
    { wch: 6 },
    { wch: 14 },
    { wch: 14 },
    { wch: 45 },
    { wch: 12 },
    { wch: 14 },
    { wch: 12 },
    { wch: 32 },
    { wch: 30 },
    { wch: 40 },
    { wch: 18 },
    { wch: 14 },
    { wch: 18 },
    { wch: 14 },
    { wch: 14 },
    { wch: 18 }
  ];

  // ==========================================
  // SHEET 1: DASHBOARD / RINGKASAN
  // ==========================================
  const dashRows: any[][] = [
    ['REKAP MONITORING KEPATUHAN SATKER'],
    [`KPPN 026 SEMARANG - PERIODE: ${formattedPeriode} (${periode})`],
    [`Tanggal Unduh Rekap: ${new Date().toLocaleString('id-ID')}`],
    [],
    ['RINGKASAN INDIKATOR KEPATUHAN', 'JUMLAH SATKER', 'PERSENTASE (%)'],
    ['Total Satker Terdaftar', summary.totalSatker, '100%'],
    ['Rekonsiliasi Selesai (Sudah Sama)', summary.rekonsiliasiSelesai, summary.totalSatker ? `${((summary.rekonsiliasiSelesai / summary.totalSatker) * 100).toFixed(1)}%` : '0%'],
    ['Rekonsiliasi Belum Selesai (Selisih TDK)', summary.rekonsiliasiBelumSelesai, summary.totalSatker ? `${((summary.rekonsiliasiBelumSelesai / summary.totalSatker) * 100).toFixed(1)}%` : '0%'],
    ['Todolist Selesai', summary.todolistSelesai, summary.totalSatker ? `${((summary.todolistSelesai / summary.totalSatker) * 100).toFixed(1)}%` : '0%'],
    ['Todolist Belum Selesai', summary.todolistBelumSelesai, summary.totalSatker ? `${((summary.todolistBelumSelesai / summary.totalSatker) * 100).toFixed(1)}%` : '0%'],
    ['Sudah Tutup Periode', summary.sudahTutupPeriode, summary.totalSatker ? `${((summary.sudahTutupPeriode / summary.totalSatker) * 100).toFixed(1)}%` : '0%'],
    ['Belum Tutup Periode', summary.belumTutupPeriode, summary.totalSatker ? `${((summary.belumTutupPeriode / summary.totalSatker) * 100).toFixed(1)}%` : '0%'],
    ['Ada SP2S', summary.adaSp2s, summary.totalSatker ? `${((summary.adaSp2s / summary.totalSatker) * 100).toFixed(1)}%` : '0%'],
    ['Ada SP3S', summary.adaSp3s, summary.totalSatker ? `${((summary.adaSp3s / summary.totalSatker) * 100).toFixed(1)}%` : '0%'],
    ['Ada Dispensasi', summary.adaDispensasi, summary.totalSatker ? `${((summary.adaDispensasi / summary.totalSatker) * 100).toFixed(1)}%` : '0%'],
    [],
    ['STATUS TINDAK LANJUT FAKTUAL', 'JUMLAH SATKER', 'PERSENTASE (%)'],
    ['Perlu Tindakan (Belum Rekon / Belum Tutup / Ada Todolist)', summary.perluTindakan, summary.totalSatker ? `${((summary.perluTindakan / summary.totalSatker) * 100).toFixed(1)}%` : '0%'],
    ['Perlu Pemantauan', summary.perluPemantauan, summary.totalSatker ? `${((summary.perluPemantauan / summary.totalSatker) * 100).toFixed(1)}%` : '0%'],
    ['Kepatuhan Selesai Penuh', summary.selesai, summary.totalSatker ? `${((summary.selesai / summary.totalSatker) * 100).toFixed(1)}%` : '0%']
  ];

  const wsDash = XLSX.utils.aoa_to_sheet(dashRows);
  wsDash['!cols'] = [{ wch: 55 }, { wch: 18 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, wsDash, 'Dashboard');

  // ==========================================
  // SHEET 2: SELURUH DATA
  // ==========================================
  const wsAll = XLSX.utils.aoa_to_sheet([
    headerCols,
    ...records.map((r, i) => formatRecordRow(r, i))
  ]);
  wsAll['!cols'] = colWidths;
  XLSX.utils.book_append_sheet(wb, wsAll, 'Seluruh Data');

  // ==========================================
  // SHEET 3: BELUM REKONSILIASI
  // ==========================================
  const belumRekon = records.filter(r => r.rekonsiliasiStatus === 'BELUM_SELESAI');
  const wsBelumRekon = XLSX.utils.aoa_to_sheet([
    headerCols,
    ...belumRekon.map((r, i) => formatRecordRow(r, i))
  ]);
  wsBelumRekon['!cols'] = colWidths;
  XLSX.utils.book_append_sheet(wb, wsBelumRekon, 'Belum Rekonsiliasi');

  // ==========================================
  // SHEET 4: MASIH TODOLIST
  // ==========================================
  const masihTodo = records.filter(r => r.todolistStatus === 'BELUM_SELESAI');
  const wsMasihTodo = XLSX.utils.aoa_to_sheet([
    headerCols,
    ...masihTodo.map((r, i) => formatRecordRow(r, i))
  ]);
  wsMasihTodo['!cols'] = colWidths;
  XLSX.utils.book_append_sheet(wb, wsMasihTodo, 'Masih Todolist');

  // ==========================================
  // SHEET 5: BELUM TUTUP PERIODE
  // ==========================================
  const belumTutup = records.filter(r => r.tutupPeriodeStatus === 'BELUM_TUTUP');
  const wsBelumTutup = XLSX.utils.aoa_to_sheet([
    headerCols,
    ...belumTutup.map((r, i) => formatRecordRow(r, i))
  ]);
  wsBelumTutup['!cols'] = colWidths;
  XLSX.utils.book_append_sheet(wb, wsBelumTutup, 'Belum Tutup Periode');

  // ==========================================
  // SHEET 6: SP2S (Bila ada)
  // ==========================================
  const adaSp2s = records.filter(r => r.sp2sStatus === 'ADA');
  if (adaSp2s.length > 0) {
    const wsSp2s = XLSX.utils.aoa_to_sheet([
      headerCols,
      ...adaSp2s.map((r, i) => formatRecordRow(r, i))
    ]);
    wsSp2s['!cols'] = colWidths;
    XLSX.utils.book_append_sheet(wb, wsSp2s, 'SP2S');
  }

  // ==========================================
  // SHEET 7: SP3S (Bila ada)
  // ==========================================
  const adaSp3s = records.filter(r => r.sp3sStatus === 'ADA');
  if (adaSp3s.length > 0) {
    const wsSp3s = XLSX.utils.aoa_to_sheet([
      headerCols,
      ...adaSp3s.map((r, i) => formatRecordRow(r, i))
    ]);
    wsSp3s['!cols'] = colWidths;
    XLSX.utils.book_append_sheet(wb, wsSp3s, 'SP3S');
  }

  const cleanPeriode = (periode || 'all').replace(/[^a-zA-Z0-9-]/g, '_');
  XLSX.writeFile(wb, `Rekap-Monitoring-Kepatuhan-Satker-${cleanPeriode}.xlsx`);
}

export interface ExportRekonsiliasiPDFOptions {
  customTitle?: string;
  customSubtitle?: string;
  filterLabel?: string;
  themeColor?: [number, number, number];
  filenamePrefix?: string;
}

/**
 * Export Ringkasan & Data Rekonsiliasi ke Dokumen PDF Resmi
 */
export function exportRekapRekonsiliasiPDF(
  records: MonitoringRekonsiliasiRecord[],
  summary: RekonsiliasiBatchSummary,
  periode: string,
  options?: ExportRekonsiliasiPDFOptions
): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const formattedPeriode = formatPeriodeRekonsiliasi(periode);
  const themeColor: [number, number, number] = options?.themeColor || [37, 99, 235]; // Default Blue

  // Header Title
  const title = options?.customTitle || 'REKAPITULASI MONITORING KEPATUHAN SATKER';
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text(title, 14, 14);

  // Subtitle / Agency info
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139); // slate-500
  const subText = options?.customSubtitle || `KPPN 026 SEMARANG | KEMENTERIAN KEUANGAN REPUBLIK INDONESIA`;
  doc.text(subText, 14, 19);

  // Meta info: Periode, Filter, Jam Cetak
  const metaParts = [
    `Periode: ${formattedPeriode} (${periode})`,
    options?.filterLabel ? `Kriteria: ${options.filterLabel}` : null,
    `Total Terdaftar: ${records.length} Satker`,
    `Dicetak: ${new Date().toLocaleString('id-ID')}`
  ].filter(Boolean).join(' | ');

  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(metaParts, 14, 24);

  // Summary Metrics Table (Only if total summary matches or if general report)
  const summaryRows = [
    [
      `Total Satker: ${summary.totalSatker}`,
      `Rekon Selesai: ${summary.rekonsiliasiSelesai}`,
      `Rekon Belum: ${summary.rekonsiliasiBelumSelesai}`,
      `Todolist Selesai: ${summary.todolistSelesai}`,
      `Todolist Belum: ${summary.todolistBelumSelesai}`
    ],
    [
      `Sudah Tutup: ${summary.sudahTutupPeriode}`,
      `Belum Tutup: ${summary.belumTutupPeriode}`,
      `Ada SP2S: ${summary.adaSp2s}`,
      `Ada SP3S: ${summary.adaSp3s}`,
      `Ada Dispensasi: ${summary.adaDispensasi}`
    ]
  ];

  autoTable(doc, {
    startY: 27,
    body: summaryRows,
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 1.8, textColor: [30, 41, 59], fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 55 },
      2: { cellWidth: 55 },
      3: { cellWidth: 55 },
      4: { cellWidth: 55 }
    }
  });

  // Data Satker Table
  const tableData = records.map((r, i) => [
    i + 1,
    r.noKppnSatker,
    r.kodeSatker,
    r.namaSatker.length > 35 ? r.namaSatker.substring(0, 33) + '...' : r.namaSatker,
    r.rekonsiliasiStatus === 'SELESAI' ? 'Selesai' : 'Belum (TDK)',
    r.todolistStatus === 'SELESAI' ? 'Selesai' : 'Masih Ada',
    r.tutupPeriodeStatus === 'SUDAH_TUTUP' ? 'Sudah' : 'Belum',
    r.sp2sStatus === 'ADA' ? r.sp2sNomor : 'Tidak Ada',
    r.sp3sStatus === 'ADA' ? r.sp3sNomor : 'Belum Ada',
    r.dispensasi,
    r.prioritasKategori === 'PERLU_TINDAKAN' ? 'Tindakan' : r.prioritasKategori === 'PERLU_PEMANTAUAN' ? 'Pantau' : 'Selesai'
  ]);

  const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY : 38;

  autoTable(doc, {
    startY: finalY + 4,
    head: [[
      'No', 'No KPPN', 'Kode', 'Nama Satker', 'Rekon', 'Todolist', 'Tutup', 'SP2S', 'SP3S', 'Disp', 'Status'
    ]],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: themeColor, textColor: [255, 255, 255], fontSize: 7, halign: 'center', fontStyle: 'bold' },
    styles: { fontSize: 6.5, cellPadding: 1.5, overflow: 'ellipsize' },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 16, halign: 'center' },
      2: { cellWidth: 16, halign: 'center' },
      3: { cellWidth: 70 },
      4: { cellWidth: 22, halign: 'center' },
      5: { cellWidth: 22, halign: 'center' },
      6: { cellWidth: 18, halign: 'center' },
      7: { cellWidth: 25 },
      8: { cellWidth: 25 },
      9: { cellWidth: 14, halign: 'center' },
      10: { cellWidth: 18, halign: 'center' }
    },
    didDrawPage: (data) => {
      // Footer page number
      const str = `Halaman ${data.pageNumber} | KPPN 026 Semarang - Monitoring Rekonsiliasi SAKTI`;
      doc.setFontSize(7);
      doc.setTextColor(150);
      doc.text(str, data.settings.margin.left, doc.internal.pageSize.height - 6);
    }
  });

  const cleanPeriode = (periode || 'all').replace(/[^a-zA-Z0-9-]/g, '_');
  const prefix = options?.filenamePrefix || 'Rekap-Monitoring-Kepatuhan-Satker';
  doc.save(`${prefix}-${cleanPeriode}.pdf`);
}
