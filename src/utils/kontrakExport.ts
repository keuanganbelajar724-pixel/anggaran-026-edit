import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { KontrakFilterState, KontrakMonitoringRecord } from '../types';
import { formatNumber, formatRupiah } from './kontrakCalculations';

export interface KontrakExportOptions {
  title?: string;
  subtitle?: string;
  kppn?: string;
  periode?: string;
  filterSummary?: string;
}

export function exportKontrakToPDF(
  records: KontrakMonitoringRecord[],
  filter?: KontrakFilterState,
  options?: KontrakExportOptions
): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const title = options?.title || 'MONITORING DATA KONTRAK';
  const kppn = options?.kppn || 'KPPN 026 - SEMARANG I';
  const periode = options?.periode || 'Tahun Anggaran 2026';
  const printDate = new Date().toLocaleString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Calculate totals
  let totalNilai = 0;
  let totalBayar = 0;
  let totalSisa = 0;
  records.forEach(r => {
    totalNilai += r.nilai_kontrak;
    totalBayar += r.nilai_pembayaran;
    totalSisa += r.sisa_kontrak;
  });

  // Header Title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 15);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`${kppn} | Periode: ${periode}`, 14, 21);
  doc.text(`Tanggal Cetak: ${printDate} WIB | Total: ${records.length} Kontrak`, 14, 26);

  if (options?.filterSummary) {
    doc.setFont('helvetica', 'italic');
    doc.text(`Filter Aktif: ${options.filterSummary}`, 14, 31);
  }

  // Table rows
  // Limit to max 1,000 in PDF to prevent browser freezing if entire 2,225 are printed
  const displayRecords = records.slice(0, 1000);

  const tableData = displayRecords.map((r, i) => [
    i + 1,
    r.kode_satker,
    r.deskripsi_satker.length > 25 ? r.deskripsi_satker.slice(0, 23) + '..' : r.deskripsi_satker,
    r.nomor_kontrak,
    r.nama_supplier.length > 20 ? r.nama_supplier.slice(0, 18) + '..' : r.nama_supplier,
    r.tanggal_mulai,
    r.tanggal_selesai,
    formatRupiah(r.nilai_kontrak),
    formatRupiah(r.nilai_pembayaran),
    formatRupiah(r.sisa_kontrak),
    r.status_progress_kontrak
  ]);

  // Total footer row
  const footRows = [
    [
      '',
      '',
      `TOTAL (${records.length} KONTRAK)`,
      '',
      '',
      '',
      '',
      formatRupiah(totalNilai),
      formatRupiah(totalBayar),
      formatRupiah(totalSisa),
      ''
    ]
  ];

  autoTable(doc, {
    startY: options?.filterSummary ? 35 : 30,
    head: [
      [
        'No',
        'Kode',
        'Nama Satker',
        'Nomor Kontrak',
        'Supplier',
        'Mulai',
        'Selesai',
        'Nilai Kontrak',
        'Pembayaran',
        'Sisa',
        'Status Progress'
      ]
    ],
    body: tableData,
    foot: footRows,
    theme: 'grid',
    headStyles: {
      fillColor: [16, 185, 129], // Emerald
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center'
    },
    footStyles: {
      fillColor: [240, 253, 244],
      textColor: [6, 78, 59],
      fontSize: 8,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 7,
      cellPadding: 1.5
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { halign: 'center', cellWidth: 14 },
      2: { cellWidth: 38 },
      3: { cellWidth: 32 },
      4: { cellWidth: 32 },
      5: { halign: 'center', cellWidth: 18 },
      6: { halign: 'center', cellWidth: 18 },
      7: { halign: 'right', cellWidth: 28 },
      8: { halign: 'right', cellWidth: 28 },
      9: { halign: 'right', cellWidth: 28 },
      10: { cellWidth: 30 }
    },
    margin: { left: 10, right: 10, top: 12, bottom: 12 }
  });

  doc.save(`${title.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function exportKontrakToExcel(
  records: KontrakMonitoringRecord[],
  fileName: string = 'Export_Monitoring_Data_Kontrak'
): void {
  let totalNilai = 0;
  let totalBayar = 0;
  let totalSisa = 0;

  const dataRows: Record<string, any>[] = records.map((r, i) => {
    totalNilai += r.nilai_kontrak;
    totalBayar += r.nilai_pembayaran;
    totalSisa += r.sisa_kontrak;

    return {
      'NO': i + 1,
      'KODE SATKER': r.kode_satker,
      'DESKRIPSI SATKER': r.deskripsi_satker,
      'KODE KPPN': r.kode_kppn,
      'NOMOR KONTRAK': r.nomor_kontrak,
      'NRK SPAN': r.nrk_span,
      'NRK SAKTI': r.nrk_sakti,
      'STATUS NRK': r.status_nrk,
      'TANGGAL KONTRAK': r.tanggal_kontrak,
      'KODE MATA UANG': r.kode_mata_uang,
      'NAMA SUPPLIER': r.nama_supplier,
      'NOMOR REGISTER SUPPLIER': r.nomor_register_supplier,
      'TANGGAL MULAI': r.tanggal_mulai,
      'TANGGAL SELESAI': r.tanggal_selesai,
      'URAIAN KONTRAK': r.uraian_kontrak,
      'NILAI KONTRAK': r.nilai_kontrak,
      'NILAI PEMBAYARAN': r.nilai_pembayaran,
      'SISA KONTRAK': r.sisa_kontrak,
      'STATUS PROGRESS KONTRAK': r.status_progress_kontrak,
      'KODE COA': r.kode_coa,
      'STATUS KIRIM KE KPPN': r.status_kirim_kppn,
      'DETAIL BARANG JASA': r.detail_barang_jasa
    };
  });

  // Add Summary row at bottom
  dataRows.push({
    'NO': 'TOTAL' as any,
    'KODE SATKER': `${records.length} Kontrak`,
    'DESKRIPSI SATKER': '',
    'KODE KPPN': '',
    'NOMOR KONTRAK': '',
    'NRK SPAN': '',
    'NRK SAKTI': '',
    'STATUS NRK': '',
    'TANGGAL KONTRAK': '',
    'KODE MATA UANG': '',
    'NAMA SUPPLIER': '',
    'NOMOR REGISTER SUPPLIER': '',
    'TANGGAL MULAI': '',
    'TANGGAL SELESAI': '',
    'URAIAN KONTRAK': '',
    'NILAI KONTRAK': totalNilai,
    'NILAI PEMBAYARAN': totalBayar,
    'SISA KONTRAK': totalSisa,
    'STATUS PROGRESS KONTRAK': '',
    'KODE COA': '',
    'STATUS KIRIM KE KPPN': '',
    'DETAIL BARANG JASA': ''
  });

  const ws = XLSX.utils.json_to_sheet(dataRows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Monitoring Kontrak');

  XLSX.writeFile(wb, `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportKontrakBelumSelesaiPDF(records: KontrakMonitoringRecord[]): void {
  const filtered = records.filter(
    r =>
      r.status_progress_kontrak === 'BELUM SELESAI' ||
      r.status_progress_kontrak === 'BELUM SELESAI TERLAMBAT TERMIN' ||
      r.status_progress_kontrak === 'BELUM SELESAI TERLAMBAT'
  );
  exportKontrakToPDF(filtered, undefined, {
    title: 'MONITORING KONTRAK BELUM SELESAI',
    filterSummary: 'Kategori: Kontrak Belum Selesai (Termasuk Terlambat Termin)'
  });
}

export function exportKontrakTerlambatPDF(records: KontrakMonitoringRecord[]): void {
  const filtered = records.filter(
    r =>
      r.status_progress_kontrak === 'BELUM SELESAI TERLAMBAT TERMIN' ||
      r.status_progress_kontrak === 'BELUM SELESAI TERLAMBAT' ||
      r.status_progress_kontrak === 'SELESAI TERLAMBAT'
  );
  exportKontrakToPDF(filtered, undefined, {
    title: 'MONITORING KONTRAK TERLAMBAT',
    filterSummary: 'Kategori: Kontrak Terlambat (Belum Selesai Terlambat & Selesai Terlambat)'
  });
}

export function exportNrkPerluPenyesuaianPDF(records: KontrakMonitoringRecord[]): void {
  const filtered = records.filter(r => r.status_nrk === 'SESUAIKAN DENGAN NRK SPAN');
  exportKontrakToPDF(filtered, undefined, {
    title: 'MONITORING NRK PERLU PENYESUAIAN',
    filterSummary: 'Status NRK: SESUAIKAN DENGAN NRK SPAN (Perlu Verifikasi SPAN vs SAKTI)'
  });
}

export function exportSisaKontrakTerbesarPDF(records: KontrakMonitoringRecord[]): void {
  const sorted = [...records].sort((a, b) => b.sisa_kontrak - a.sisa_kontrak).slice(0, 50);
  exportKontrakToPDF(sorted, undefined, {
    title: 'MONITORING 50 KONTRAK DENGAN SISA TERBESAR',
    filterSummary: 'Top 50 Kontrak Sisa Terbesar'
  });
}
