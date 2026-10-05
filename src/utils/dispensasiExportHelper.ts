import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DispensasiIKPARecord } from '../types';

export function getLabelJenisDispensasi(jenis: string): string {
  switch (jenis) {
    case 'DISPENSASI_SPM':
      return 'Dispensasi SPM Terlambat (Akhir Tahun / Triwulan IV)';
    case 'DEVIASI_HAL3':
      return 'Dispensasi Deviasi Hal III DIPA';
    case 'KONTRAKTUAL':
      return 'Dispensasi Pendaftaran Kontrak';
    case 'CAPAIAN_OUTPUT':
      return 'Dispensasi Konfirmasi Capaian Output';
    case 'UP_TUP':
      return 'Dispensasi Pengelolaan UP / TUP';
    case 'LAINNYA':
      return 'Dispensasi Lainnya / Force Majeure';
    default:
      return jenis || 'Dispensasi IKPA';
  }
}

export function getLabelStatusDispensasi(status: string): string {
  switch (status) {
    case 'DIAJUKAN_CSO':
    case 'VERIFIKASI_KPPN':
      return 'Diterima KPPN';
    case 'VERIFIKASI_KANWIL':
      return 'Posisi Kanwil';
    case 'DIAJUKAN_PUSAT':
      return 'Posisi Kanpus';
    case 'DISETUJUI':
      return 'Disetujui';
    case 'DITOLAK':
      return 'Ditolak';
    case 'PERBAIKAN_DOKUMEN':
      return 'Perbaikan Dokumen';
    default:
      return status;
  }
}

export function exportDispensasiToExcel(records: DispensasiIKPARecord[]) {
  const rows = records.map((r, idx) => ({
    'No': idx + 1,
    'Nomor Tiket': r.nomorTiket,
    'Kode Satker': r.kodeSatker,
    'Nama Satker': r.namaSatker,
    'Kementerian / Lembaga': r.kementerianLembaga || '-',
    'Jenis Dispensasi': getLabelJenisDispensasi(r.jenisDispensasi),
    'Nomor Surat Satker': r.nomorSurat,
    'Tanggal Surat Satker': r.tanggalSurat,
    'Tanggal Masuk CSO': r.tanggalPengajuan,
    'Uraian Alasan Dispensasi': r.alasanDispensasi || '-',
    'Status Progres': getLabelStatusDispensasi(r.status),
    'Link Dokumen CSO': r.linkDokumenCso,
    'Link Dokumen Pendukung': r.linkDokumenPendukung || '-',
    'Nomor Surat Hasil': r.nomorSuratHasil || '-',
    'Tanggal Surat Hasil': r.tanggalSuratHasil || '-',
    'Link Surat Hasil': r.linkSuratHasil || '-',
    'Catatan / Disposisi KPPN': r.catatanAdmin || '-',
    'Waktu Update': r.updatedAt ? new Date(r.updatedAt).toLocaleString('id-ID') : '-'
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Dispensasi IKPA');

  const todayStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `Rekap_Pengajuan_Dispensasi_IKPA_${todayStr}.xlsx`);
}

export function exportDispensasiToPDF(records: DispensasiIKPARecord[], filterStatusLabel: string = 'Semua Status') {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  const printDateStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Top accent bar
  doc.setFillColor(15, 47, 87);
  doc.rect(0, 0, 297, 3.2, 'F');
  doc.setFillColor(212, 175, 55);
  doc.rect(0, 3.2, 297, 1, 'F');

  // Title (Clean without institution kop)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 47, 87);
  doc.text('LAPORAN MONITORING PENGAJUAN DISPENSASI IKPA SATKER', 10, 11);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.2);
  doc.setTextColor(30, 64, 175);
  doc.text('LAYANAN CSO & SEKSI MSKI KPPN TIPE A1 SEMARANG I (PER-5/PB/2022 & PER-5/PB/2024)', 10, 15.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Tanggal Cetak: ${printDateStr}   |   Filter: ${filterStatusLabel} (${records.length} Berkas)   |   Sistem Pelayanan CSO Terpadu KPPN`,
    10,
    20
  );

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(10, 22.2, 287, 22.2);

  const tableHead = [
    ['NO', 'NO TIKET', 'SATUAN KERJA', 'JENIS DISPENSASI', 'NO SURAT & TGL', 'URAIAN ALASAN DISPENSASI', 'STATUS PROGRES', 'SURAT HASIL / CATATAN']
  ];

  const tableRows = records.map((r, idx) => [
    idx + 1,
    r.nomorTiket,
    `${r.namaSatker}\n[${r.kodeSatker}]`,
    getLabelJenisDispensasi(r.jenisDispensasi),
    `${r.nomorSurat}\nTgl: ${r.tanggalSurat}`,
    r.alasanDispensasi || '-',
    getLabelStatusDispensasi(r.status),
    r.nomorSuratHasil ? `No: ${r.nomorSuratHasil}\nTgl: ${r.tanggalSuratHasil || '-'}` : (r.catatanAdmin || '-')
  ]);

  autoTable(doc, {
    head: tableHead,
    body: tableRows,
    startY: 25,
    margin: { left: 10, right: 10, top: 15, bottom: 12 },
    theme: 'grid',
    styles: {
      fontSize: 6.8,
      cellPadding: 2,
      lineColor: [226, 232, 240],
      lineWidth: 0.18,
      valign: 'top',
      textColor: [15, 23, 42]
    },
    headStyles: {
      fillColor: [15, 47, 87],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.2,
      halign: 'center'
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 20 },
      2: { cellWidth: 50 },
      3: { cellWidth: 38 },
      4: { cellWidth: 38 },
      5: { cellWidth: 38 },
      6: { cellWidth: 38 },
      7: { cellWidth: 47 }
    }
  });

  const todayStr = new Date().toISOString().split('T')[0];
  doc.save(`Laporan_Dispensasi_IKPA_${todayStr}.pdf`);
}
