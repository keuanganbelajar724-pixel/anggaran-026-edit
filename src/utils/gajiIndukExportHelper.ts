import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  GajiSatkerBulanan,
  SPMGajiRecord,
  GajiIndukSummary,
  GajiIndukJenis
} from '../types';
import { formatPeriodeGaji, formatDisplayDate } from './gajiIndukExcelParser';

/**
 * Format angka rupiah
 */
export function formatRupiahGaji(amount: number): string {
  if (!amount || isNaN(amount)) return 'Rp 0';
  return 'Rp ' + Math.round(amount).toLocaleString('id-ID');
}

/**
 * CETAK PDF: Daftar Satker Belum Mengirim Gaji Induk
 */
export function exportPdfSatkerBelumGaji(
  items: GajiSatkerBulanan[],
  periodeKey: string,
  jenisGaji: 'ALL' | GajiIndukJenis = 'ALL'
): void {
  const doc = new jsPDF('portrait', 'mm', 'a4');
  const formattedPeriode = formatPeriodeGaji(periodeKey);

  // Filter hanya yang belum mengirim
  const belumList = items.filter(s => s.statusPengiriman === 'BELUM_MENGIRIM');

  // Header KOP Surat KPPN
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('KEMENTERIAN KEUANGAN REPUBLIK INDONESIA', 105, 14, { align: 'center' });
  doc.setFontSize(10);
  doc.text('DIREKTORAT JENDERAL PERBENDAHARAAN', 105, 19, { align: 'center' });
  doc.setFontSize(9);
  doc.text('KANTOR PELAYANAN PERBENDAHARAAN NEGARA TIPE A1 SEMARANG I', 105, 24, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Jl. Ki Mangunsarkoro No. 34 Semarang 50241 | Telp. (024) 8412345 | kppnsemarang1@kemenkeu.go.id', 105, 28, { align: 'center' });

  doc.setLineWidth(0.5);
  doc.line(14, 31, 196, 31);
  doc.setLineWidth(0.2);
  doc.line(14, 32, 196, 32);

  // Judul Dokumen
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  const jenisText = jenisGaji === 'ALL' ? 'PNS DAN PPPK' : jenisGaji === 'PPPK' ? 'PPPK/P3K' : 'PNS';
  doc.text(`DAFTAR SATKER BELUM MENYAMPAIKAN GAJI INDUK ${jenisText}`, 105, 40, { align: 'center' });
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Periode: ${formattedPeriode} | Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 105, 45, { align: 'center' });

  // Ringkasan
  doc.setFontSize(8.5);
  doc.text(`Total Satker Belum Mengirim: ${belumList.length} Satuan Kerja`, 14, 52);

  // Tabel
  const tableRows = belumList.map((item, idx) => [
    idx + 1,
    item.kodeSatker,
    item.namaSatker,
    item.kodeKppn,
    item.jenisGaji === 'PPPK' ? 'Gaji Induk PPPK' : 'Gaji Induk PNS',
    item.jumlahSpm,
    item.jumlahSpmBulanLalu !== null ? item.jumlahSpmBulanLalu : '-',
    item.selisihSpm !== null ? (item.selisihSpm > 0 ? `+${item.selisihSpm}` : String(item.selisihSpm)) : '-',
    'BELUM MENGIRIM'
  ]);

  autoTable(doc, {
    startY: 56,
    head: [[
      'No',
      'Kode',
      'Nama Satuan Kerja',
      'KPPN',
      'Jenis Gaji',
      'SPM Ini',
      'SPM Lalu',
      'Selisih',
      'Status'
    ]],
    body: tableRows.length > 0 ? tableRows : [['-', '-', 'Semua Satker telah menyampaikan Gaji Induk pada periode ini', '-', '-', '-', '-', '-', 'LENGKAP']],
    theme: 'grid',
    headStyles: {
      fillColor: [185, 28, 28], // Merah tegas
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: 40
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 15, halign: 'center' },
      2: { cellWidth: 60 },
      3: { cellWidth: 12, halign: 'center' },
      4: { cellWidth: 26, halign: 'center' },
      5: { cellWidth: 14, halign: 'center' },
      6: { cellWidth: 14, halign: 'center' },
      7: { cellWidth: 14, halign: 'center' },
      8: { cellWidth: 22, halign: 'center' }
    },
    margin: { left: 14, right: 14 }
  });

  // Tanda Tangan Pejabat
  const finalY = (doc as any).lastAutoTable?.finalY || 180;
  const ttdY = Math.min(finalY + 15, 240);

  doc.setFontSize(8.5);
  doc.text('Semarang, ' + new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }), 140, ttdY);
  doc.text('Kepala Seksi Pencairan Dana / MSKI', 140, ttdY + 5);
  doc.text('KPPN Semarang I', 140, ttdY + 9);
  doc.text('( .................................................... )', 140, ttdY + 30);
  doc.text('NIP. .............................................', 140, ttdY + 35);

  doc.save(`Daftar-Satker-Belum-Gaji-Induk-${periodeKey}.pdf`);
}

/**
 * CETAK PDF: Rekapitulasi Monitoring Gaji Induk
 */
export function exportPdfRekapitulasiGaji(
  items: GajiSatkerBulanan[],
  summary: GajiIndukSummary,
  periodeKey: string
): void {
  const doc = new jsPDF('landscape', 'mm', 'a4');
  const formattedPeriode = formatPeriodeGaji(periodeKey);

  // KOP
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('KEMENTERIAN KEUANGAN REPUBLIK INDONESIA - DIREKTORAT JENDERAL PERBENDAHARAAN', 148, 12, { align: 'center' });
  doc.setFontSize(10);
  doc.text('KANTOR PELAYANAN PERBENDAHARAAN NEGARA TIPE A1 SEMARANG I', 148, 17, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Jl. Ki Mangunsarkoro No. 34 Semarang 50241 | Telp. (024) 8412345', 148, 21, { align: 'center' });

  doc.setLineWidth(0.4);
  doc.line(14, 23, 283, 23);

  // Judul
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`REKAPITULASI MONITORING PROSES SPM GAJI INDUK (PNS & PPPK)`, 148, 30, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Periode Evaluasi: ${formattedPeriode} | Waktu Ekspor: ${new Date().toLocaleString('id-ID')}`, 148, 35, { align: 'center' });

  // Ringkasan KPI
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text(
    `Total Satker: ${summary.totalSatkerWajib} | Sudah Mengirim: ${summary.sudahKirim} | Belum Mengirim: ${summary.belumKirim} | Total SPM: ${summary.totalSpm} | Total Pembayaran: ${formatRupiahGaji(summary.totalPembayaran)}`,
    14,
    42
  );

  const tableRows = items.map((item, idx) => [
    idx + 1,
    item.kodeSatker,
    item.namaSatker,
    item.kodeKppn,
    item.jenisGaji === 'PPPK' ? 'PPPK' : 'PNS',
    item.statusPengiriman === 'SUDAH_MENGIRIM' ? 'SUDAH' : 'BELUM',
    item.jumlahSpm,
    item.jumlahSpmBulanLalu !== null ? item.jumlahSpmBulanLalu : '-',
    item.selisihSpm !== null ? (item.selisihSpm > 0 ? `+${item.selisihSpm}` : String(item.selisihSpm)) : '-',
    formatRupiahGaji(item.totalPembayaran),
    item.jumlahSp2d,
    item.tglSpmTerakhir ? formatDisplayDate(item.tglSpmTerakhir) : '-',
    item.tglSp2dTerakhir ? formatDisplayDate(item.tglSp2dTerakhir) : '-',
    item.statusSp2dSummary
  ]);

  autoTable(doc, {
    startY: 46,
    head: [[
      'No',
      'Kode',
      'Nama Satuan Kerja',
      'KPPN',
      'Jenis',
      'Status',
      'SPM Ini',
      'SPM Lalu',
      'Perubahan',
      'Total Pembayaran',
      'Jml SP2D',
      'Tgl SPM',
      'Tgl SP2D',
      'Keterangan'
    ]],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 7,
      textColor: 30
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 15, halign: 'center' },
      2: { cellWidth: 62 },
      3: { cellWidth: 10, halign: 'center' },
      4: { cellWidth: 12, halign: 'center' },
      5: { cellWidth: 16, halign: 'center' },
      6: { cellWidth: 12, halign: 'center' },
      7: { cellWidth: 12, halign: 'center' },
      8: { cellWidth: 14, halign: 'center' },
      9: { cellWidth: 32, halign: 'right' },
      10: { cellWidth: 14, halign: 'center' },
      11: { cellWidth: 18, halign: 'center' },
      12: { cellWidth: 18, halign: 'center' },
      13: { cellWidth: 24, halign: 'center' }
    },
    margin: { left: 14, right: 14 }
  });

  doc.save(`Rekapitulasi-Monitoring-Gaji-Induk-${periodeKey}.pdf`);
}

/**
 * CETAK PDF: Perubahan Jumlah SPM Antarbulan
 */
export function exportPdfPerubahanJumlahSpm(
  items: GajiSatkerBulanan[],
  periodeKey: string
): void {
  const doc = new jsPDF('portrait', 'mm', 'a4');
  const formattedPeriode = formatPeriodeGaji(periodeKey);

  // Filter satker yang jumlah SPM-nya berubah
  const berubahList = items.filter(s => s.arahPerubahan === 'NAIK' || s.arahPerubahan === 'TURUN');

  // KOP
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('KEMENTERIAN KEUANGAN REPUBLIK INDONESIA', 105, 14, { align: 'center' });
  doc.setFontSize(10);
  doc.text('KANTOR PELAYANAN PERBENDAHARAAN NEGARA TIPE A1 SEMARANG I', 105, 19, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Jl. Ki Mangunsarkoro No. 34 Semarang 50241 | Telp. (024) 8412345', 105, 24, { align: 'center' });

  doc.setLineWidth(0.4);
  doc.line(14, 27, 196, 27);

  // Judul
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('DAFTAR SATKER DENGAN PERUBAHAN JUMLAH SPM GAJI INDUK', 105, 35, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Periode: ${formattedPeriode} (Dibandingkan Bulan Sebelumnya)`, 105, 40, { align: 'center' });

  const tableRows = berubahList.map((item, idx) => [
    idx + 1,
    item.kodeSatker,
    item.namaSatker,
    item.jenisGaji === 'PPPK' ? 'PPPK' : 'PNS',
    item.jumlahSpmBulanLalu !== null ? item.jumlahSpmBulanLalu : '-',
    item.jumlahSpm,
    item.selisihSpm !== null ? (item.selisihSpm > 0 ? `+${item.selisihSpm}` : String(item.selisihSpm)) : '-',
    item.arahPerubahan === 'NAIK' ? 'NAIK (Perlu Pantau)' : 'TURUN (Perlu Pantau)'
  ]);

  autoTable(doc, {
    startY: 46,
    head: [[
      'No',
      'Kode Satker',
      'Nama Satuan Kerja',
      'Jenis',
      'SPM Lalu',
      'SPM Ini',
      'Selisih',
      'Status Monitoring'
    ]],
    body: tableRows.length > 0 ? tableRows : [['-', '-', 'Tidak ada satker dengan perubahan jumlah SPM pada periode ini', '-', '-', '-', '-', 'TETAP']],
    theme: 'grid',
    headStyles: {
      fillColor: [217, 119, 6], // Amber
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: 40
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 70 },
      3: { cellWidth: 15, halign: 'center' },
      4: { cellWidth: 16, halign: 'center' },
      5: { cellWidth: 16, halign: 'center' },
      6: { cellWidth: 16, halign: 'center' },
      7: { cellWidth: 28, halign: 'center' }
    },
    margin: { left: 14, right: 14 }
  });

  doc.save(`Perubahan-Jumlah-SPM-Gaji-${periodeKey}.pdf`);
}

/**
 * CETAK PDF: History Gaji Induk per Satker
 */
export function exportPdfHistorySatkerGaji(
  satker: GajiSatkerBulanan,
  allSatkerRecords: SPMGajiRecord[]
): void {
  const doc = new jsPDF('portrait', 'mm', 'a4');

  // KOP
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('KEMENTERIAN KEUANGAN REPUBLIK INDONESIA', 105, 14, { align: 'center' });
  doc.setFontSize(10);
  doc.text('KANTOR PELAYANAN PERBENDAHARAAN NEGARA TIPE A1 SEMARANG I', 105, 19, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Jl. Ki Mangunsarkoro No. 34 Semarang 50241', 105, 24, { align: 'center' });

  doc.setLineWidth(0.4);
  doc.line(14, 27, 196, 27);

  // Judul
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('LEMBAR RIWAYAT PENGIRIMAN SPM GAJI INDUK', 105, 35, { align: 'center' });

  // Informasi Satker
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Kode Satker : ${satker.kodeSatker}`, 14, 43);
  doc.text(`Nama Satker : ${satker.namaSatker}`, 14, 48);
  doc.text(`Kode KPPN   : ${satker.kodeKppn} (KPPN Semarang I)`, 14, 53);

  // Tabel Riwayat Antar-Bulan
  const periods = ['2026-06', '2026-07', '2026-08'];
  const historyRows = periods.map(pKey => {
    const pnsRecs = allSatkerRecords.filter(r => r.kodeSatker === satker.kodeSatker && r.periodeKey === pKey && r.jenisGaji === 'PNS');
    const pppkRecs = allSatkerRecords.filter(r => r.kodeSatker === satker.kodeSatker && r.periodeKey === pKey && r.jenisGaji === 'PPPK');

    const pnsNominal = pnsRecs.reduce((acc, r) => acc + (r.jmlPembayaran || 0), 0);
    const pppkNominal = pppkRecs.reduce((acc, r) => acc + (r.jmlPembayaran || 0), 0);

    return [
      formatPeriodeGaji(pKey),
      pnsRecs.length > 0 ? 'Sudah' : 'Belum',
      pnsRecs.length,
      pnsNominal > 0 ? formatRupiahGaji(pnsNominal) : '-',
      pppkRecs.length > 0 ? 'Sudah' : '-',
      pppkRecs.length,
      pppkNominal > 0 ? formatRupiahGaji(pppkNominal) : '-'
    ];
  });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('1. Ringkasan Riwayat Bulanan (Juni, Juli, Agustus)', 14, 61);

  autoTable(doc, {
    startY: 64,
    head: [[
      'Bulan',
      'PNS Status',
      'PNS SPM',
      'PNS Nominal',
      'PPPK Status',
      'PPPK SPM',
      'PPPK Nominal'
    ]],
    body: historyRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: 255,
      fontSize: 8,
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: 30
    },
    columnStyles: {
      0: { cellWidth: 28 },
      1: { cellWidth: 22, halign: 'center' },
      2: { cellWidth: 18, halign: 'center' },
      3: { cellWidth: 32, halign: 'right' },
      4: { cellWidth: 22, halign: 'center' },
      5: { cellWidth: 18, halign: 'center' },
      6: { cellWidth: 32, halign: 'right' }
    },
    margin: { left: 14, right: 14 }
  });

  // Tabel Daftar Detail SPM
  const detailY = (doc as any).lastAutoTable?.finalY + 8 || 110;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('2. Rincian Record SPM Gaji Terdata', 14, detailY);

  const spmRows = satker.records.map((r, idx) => [
    idx + 1,
    r.noSpp,
    r.jenisSpp,
    r.tglCetakSpm ? formatDisplayDate(r.tglCetakSpm) : '-',
    formatRupiahGaji(r.jmlPembayaran),
    r.sp2d || '-',
    r.tglSp2d ? formatDisplayDate(r.tglSp2d) : '-',
    r.statusSpan || r.statusSpm || '-'
  ]);

  autoTable(doc, {
    startY: detailY + 3,
    head: [[
      'No',
      'No SPP',
      'Jenis SPP',
      'Tgl SPM',
      'Pembayaran',
      'No SP2D',
      'Tgl SP2D',
      'Status SPAN'
    ]],
    body: spmRows.length > 0 ? spmRows : [['-', '-', 'Tidak ada SPM untuk periode ini', '-', '-', '-', '-', '-']],
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: 255,
      fontSize: 7.5,
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 7,
      textColor: 40
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 18, halign: 'center' },
      2: { cellWidth: 32 },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 28, halign: 'right' },
      5: { cellWidth: 32 },
      6: { cellWidth: 20, halign: 'center' },
      7: { cellWidth: 24, halign: 'center' }
    },
    margin: { left: 14, right: 14 }
  });

  doc.save(`History-Gaji-${satker.kodeSatker}-${satker.periodeKey}.pdf`);
}

/**
 * EXPORT EXCEL: Rekapitulasi Data Gaji Induk
 */
export function exportGajiIndukExcel(
  items: GajiSatkerBulanan[],
  periodeKey: string
): void {
  const wb = XLSX.utils.book_new();
  const formattedPeriode = formatPeriodeGaji(periodeKey);

  const rows: any[][] = [
    ['REKAPITULASI MONITORING PROSES SPM GAJI INDUK KPPN SEMARANG I'],
    [`Periode: ${formattedPeriode}`, `Tanggal Ekspor: ${new Date().toLocaleDateString('id-ID')}`],
    [],
    [
      'No',
      'Kode Satker',
      'Nama Satuan Kerja',
      'Kode KPPN',
      'Jenis Gaji',
      'Status Pengiriman',
      'Jumlah SPM Bulan Ini',
      'Jumlah SPM Bulan Lalu',
      'Perubahan SPM',
      'Arah Perubahan',
      'Total Pengeluaran (Rp)',
      'Total Potongan (Rp)',
      'Total Pembayaran (Rp)',
      'Jumlah SP2D',
      'Tanggal SPM Terakhir',
      'Tanggal SP2D Terakhir',
      'Status SP2D'
    ]
  ];

  items.forEach((item, idx) => {
    rows.push([
      idx + 1,
      item.kodeSatker,
      item.namaSatker,
      item.kodeKppn,
      item.jenisGaji === 'PPPK' ? 'Gaji Induk PPPK' : 'Gaji Induk PNS',
      item.statusPengiriman === 'SUDAH_MENGIRIM' ? 'Sudah Mengirim' : 'Belum Mengirim',
      item.jumlahSpm,
      item.jumlahSpmBulanLalu !== null ? item.jumlahSpmBulanLalu : '-',
      item.selisihSpm !== null ? item.selisihSpm : '-',
      item.arahPerubahan,
      item.totalPengeluaran,
      item.totalPotongan,
      item.totalPembayaran,
      item.jumlahSp2d,
      item.tglSpmTerakhir || '-',
      item.tglSp2dTerakhir || '-',
      item.statusSp2dSummary
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'Rekap Gaji Induk');
  XLSX.writeFile(wb, `Rekap-Monitoring-Gaji-Induk-${periodeKey}.xlsx`);
}
