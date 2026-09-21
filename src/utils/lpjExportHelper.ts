import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  MonitoringLPJRecord,
  LPJBatchSummary
} from '../types';
import { formatRupiah } from './lpjExcelParser';

export interface ExportLPJPDFOptions {
  customTitle?: string;
  customSubtitle?: string;
  filterLabel?: string;
  periodeLabel?: string;
  filenamePrefix?: string;
  themeColor?: [number, number, number]; // RGB
  catatanKaki?: string;
}

/**
 * Export Rekap LPJ ke Excel Multi-Sheet
 */
export function exportLPJExcel(
  records: MonitoringLPJRecord[],
  summary: LPJBatchSummary,
  periode: string
): void {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Ringkasan Eksekutif
  const summaryRows: any[][] = [
    ['REKAPITULASI MONITORING LPJ BENDAHARA'],
    [`KPPN 026 SEMARANG - PERIODE: ${periode.toUpperCase()}`],
    [`Tanggal Unduh Data: ${new Date().toLocaleString('id-ID')} WIB`],
    [],
    ['INDIKATOR KEPATUHAN LPJ', 'JUMLAH SATKER', 'PERSENTASE (%)'],
    ['Total Satker Terdaftar', summary.totalSatker, '100%'],
    ['Sudah Mengirimkan LPJ', summary.sudahKirim, summary.totalSatker ? `${summary.persenKepatuhan}%` : '0%'],
    ['Belum Mengirimkan LPJ', summary.belumKirim, summary.totalSatker ? `${100 - summary.persenKepatuhan}%` : '0%'],
    ['Bendahara Pengeluaran', summary.bendaharaPengeluaranCount, '-'],
    ['Bendahara Penerimaan', summary.bendaharaPenerimaanCount, '-'],
    ['Status Terverifikasi / Disetujui', summary.terverifikasiCount, '-'],
    ['Status Menunggu Verifikasi', summary.menungguVerifikasiCount, '-'],
    ['Status Belum Kirim', summary.belumKirimCount, '-'],
    ['Total Saldo Kas Bank + Tunai', summary.totalSaldoKas, '-'],
    ['Total Selisih Kas (Wajib 0)', summary.totalSelisihKas, '-']
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  wsSummary['!cols'] = [{ wch: 35 }, { wch: 18 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan LPJ');

  // Sheet 2: Data Rinci Satker
  const detailHeaders = [
    'No',
    'Kode Satker',
    'Nama Satker',
    'Jenis Bendahara',
    'Periode',
    'Status Pengiriman',
    'Tanggal Kirim',
    'Nomor LPJ',
    'Status Verifikasi',
    'Saldo Bank (Rp)',
    'Saldo Tunai (Rp)',
    'Total Saldo (Rp)',
    'Selisih Kas (Rp)',
    'Status Klop',
    'Nama Bendahara',
    'No HP / WA',
    'Keterangan'
  ];

  const detailRows = records.map((r, i) => [
    i + 1,
    r.kodeSatker,
    r.namaSatker,
    r.jenisBendahara,
    r.periodeFormatted,
    r.statusPengiriman === 'SUDAH_KIRIM' ? 'SUDAH MENGIRIMKAN' : 'BELUM MENGIRIMKAN',
    r.tanggalKirim || '-',
    r.nomorLpj || '-',
    r.statusVerifikasi,
    r.saldoRekeningBank,
    r.saldoKasTunai,
    r.totalSaldoKas,
    r.selisihKas,
    r.statusKlopKas,
    r.namaBendahara,
    r.noHpBendahara || '-',
    r.keterangan || '-'
  ]);

  const wsDetail = XLSX.utils.aoa_to_sheet([
    ['DATA DETAIL MONITORING LPJ BENDAHARA SATKER'],
    [`KPPN 026 SEMARANG - POSISI DATA ${periode.toUpperCase()}`],
    [],
    detailHeaders,
    ...detailRows
  ]);

  wsDetail['!cols'] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 45 },
    { wch: 18 },
    { wch: 16 },
    { wch: 22 },
    { wch: 16 },
    { wch: 24 },
    { wch: 18 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 26 },
    { wch: 18 },
    { wch: 45 }
  ];

  XLSX.utils.book_append_sheet(wb, wsDetail, 'Detail Satker');

  const cleanPeriode = periode.replace(/[^a-zA-Z0-9-]/g, '_');
  XLSX.writeFile(wb, `Rekap_Monitoring_LPJ_${cleanPeriode}.xlsx`);
}

/**
 * Export Cetak PDF Resmi KPPN Semarang I dengan Filter Tertentu
 */
export function exportLPJPDF(
  records: MonitoringLPJRecord[],
  summary: LPJBatchSummary,
  periode: string,
  options?: ExportLPJPDFOptions
): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const themeColor: [number, number, number] = options?.themeColor || [16, 185, 129]; // Emerald KPPN

  // 1. Kop Surat & Judul Resmi KPPN
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59); // slate-800
  const title = options?.customTitle || 'DAFTAR MONITORING PENYAMPAIAN LPJ BENDAHARA';
  doc.text(title, 14, 13);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139); // slate-500
  const subTitle = options?.customSubtitle || 'KPPN SEMARANG I (026) • DIREKTORAT JENDERAL PERBENDAHARAAN KEMENKEU RI';
  doc.text(subTitle, 14, 18);

  // Garis pembatas header
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.line(14, 21, 283, 21);

  // Meta Info Box (Filter, Periode, Jam Cetak)
  const metaParts = [
    `Periode LPJ: ${options?.periodeLabel || periode}`,
    options?.filterLabel ? `Kriteria Filter: ${options.filterLabel}` : null,
    `Total Terdaftar: ${records.length} Satker`,
    `Waktu Cetak: ${new Date().toLocaleString('id-ID')} WIB`
  ].filter(Boolean).join('  |  ');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text(metaParts, 14, 26);

  // Summary Metrics Table (Mini Box)
  const summaryRows = [
    [
      `Total: ${summary.totalSatker}`,
      `Sudah: ${summary.sudahKirim} (${summary.persenKepatuhan}%)`,
      `Pengeluaran: ${summary.bendaharaPengeluaranCount} (S:${summary.pengeluaranSudahKirim || 0}/B:${summary.pengeluaranBelumKirim || 0})`,
      `Penerimaan: ${summary.bendaharaPenerimaanCount} (S:${summary.penerimaanSudahKirim || 0}/B:${summary.penerimaanBelumKirim || 0})`,
      `BLU: ${summary.bendaharaBluCount || 0} (S:${summary.bluSudahKirim || 0}/B:${summary.bluBelumKirim || 0})`
    ]
  ];

  autoTable(doc, {
    startY: 29,
    body: summaryRows,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 1.8,
      textColor: [30, 41, 59],
      fontStyle: 'bold',
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 50 },
      2: { cellWidth: 62 },
      3: { cellWidth: 62 },
      4: { cellWidth: 55 }
    }
  });

  // Table Data Satker
  const tableData = records.map((r, i) => [
    i + 1,
    r.kodeSatker,
    r.namaSatker.length > 40 ? r.namaSatker.substring(0, 38) + '...' : r.namaSatker,
    r.jenisBendahara === 'PENERIMAAN' ? 'Penerimaan' : r.jenisBendahara === 'BLU' ? 'BLU' : 'Pengeluaran',
    r.periodeFormatted,
    r.statusPengiriman === 'SUDAH_KIRIM' ? 'SUDAH KIRIM' : 'BELUM KIRIM',
    r.tanggalKirim || '-',
    r.nomorLpj || '-',
    r.statusVerifikasi === 'TERVERIFIKASI' ? 'Terverifikasi' : r.statusVerifikasi === 'DISETUJUI' ? 'Disetujui' : r.statusVerifikasi === 'BELUM_KIRIM' ? 'Belum Kirim' : r.statusVerifikasi,
    formatRupiah(r.totalSaldoKas),
    r.statusKlopKas === 'KLOP' ? 'Klop (Rp 0)' : r.statusKlopKas === 'SELISIH' ? `Selisih ${formatRupiah(r.selisihKas)}` : '-',
    r.namaBendahara.length > 25 ? r.namaBendahara.substring(0, 23) + '..' : r.namaBendahara,
    r.noHpBendahara || '-'
  ]);

  const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY : 36;

  autoTable(doc, {
    startY: finalY + 3,
    head: [[
      'No',
      'Kode',
      'Nama Satuan Kerja',
      'Tipe',
      'Periode',
      'Status LPJ',
      'Tgl Kirim',
      'No LPJ / Berkas',
      'Verifikasi',
      'Total Kas',
      'Selisih Kas',
      'Nama Bendahara',
      'Kontak WA'
    ]],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: themeColor,
      textColor: [255, 255, 255],
      fontSize: 7,
      halign: 'center',
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 6.5,
      cellPadding: 1.6,
      overflow: 'ellipsize'
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 16, halign: 'center' },
      2: { cellWidth: 58 },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 18, halign: 'center' },
      5: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
      6: { cellWidth: 16, halign: 'center' },
      7: { cellWidth: 26 },
      8: { cellWidth: 20, halign: 'center' },
      9: { cellWidth: 22, halign: 'right' },
      10: { cellWidth: 18, halign: 'center' },
      11: { cellWidth: 25 },
      12: { cellWidth: 18, halign: 'center' }
    },
    didParseCell: (data) => {
      // Highlight row cell jika Belum Kirim (warna merah/pink lembut)
      if (data.section === 'body') {
        const rowData = records[data.row.index];
        if (rowData && rowData.statusPengiriman === 'BELUM_KIRIM') {
          if (data.column.index === 5) {
            data.cell.styles.textColor = [185, 28, 28]; // red-700
            data.cell.styles.fontStyle = 'bold';
          }
        } else if (rowData && rowData.statusPengiriman === 'SUDAH_KIRIM') {
          if (data.column.index === 5) {
            data.cell.styles.textColor = [4, 120, 87]; // emerald-700
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    },
    didDrawPage: (data) => {
      // Catatan kaki & footer halaman
      const pageCount = (doc as any).internal.getNumberOfPages();
      const str = `Halaman ${data.pageNumber} dari ${pageCount}  |  ANGKASA KPPN Semarang I - Sistem Monitoring LPJ Bendahara`;
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(str, data.settings.margin.left, doc.internal.pageSize.height - 6);

      // Tanda Tangan / Legalisasi KPPN di halaman terakhir
      if (data.pageNumber === pageCount) {
        const signY = doc.internal.pageSize.height - 28;
        if (signY > (doc as any).lastAutoTable.finalY + 12) {
          doc.setFontSize(7.5);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(71, 85, 105);
          doc.text('Semarang, ' + new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }), 230, signY);
          doc.text('Kepala Seksi Vera / Verifikasi KPPN,', 230, signY + 4);
          doc.setFont('helvetica', 'bold');
          doc.text('KPPN SEMARANG I', 230, signY + 16);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(6.5);
          doc.text('Dokumen ini dicetak otomatis via ANGKASA', 230, signY + 20);
        }
      }
    }
  });

  const cleanPrefix = options?.filenamePrefix || 'Daftar-Monitoring-LPJ';
  const cleanPeriode = periode.replace(/[^a-zA-Z0-9-]/g, '_');
  doc.save(`${cleanPrefix}-${cleanPeriode}.pdf`);
}
