import { SatkerIKPA, PejabatSertifikasi } from '../types';
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
