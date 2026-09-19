import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PegawaiEmailRecord, PejabatEmailPenandatangan } from '../types';
import { formatIndonesianDate, getFormattedDateForFilename } from './pendaftaranSaktiExport';

import { exportPendaftaranEmailViaTemplate } from './saktiMasterTemplateService';

export const STATUS_PEGAWAI_MAP: Record<number, string> = {
  1: 'TNI',
  2: 'POLRI',
  3: 'PNS',
  4: 'PPNPN',
  5: 'P3K'
};

/**
 * Export Pendaftaran Email to Excel adhering strictly to template "format1 (57).xlsx"
 */
export async function exportPendaftaranEmailToExcel(
  kodeKppnOrDraft: string | { kodeKppn: string; kodeSatker: string; namaSatker: string; pegawaiList: PegawaiEmailRecord[] },
  kodeSatker?: string,
  namaSatker?: string,
  pegawaiList?: PegawaiEmailRecord[]
): Promise<void> {
  if (typeof kodeKppnOrDraft === 'object' && kodeKppnOrDraft !== null) {
    await exportPendaftaranEmailViaTemplate(
      kodeKppnOrDraft.kodeKppn,
      kodeKppnOrDraft.kodeSatker,
      kodeKppnOrDraft.namaSatker,
      kodeKppnOrDraft.pegawaiList
    );
  } else {
    await exportPendaftaranEmailViaTemplate(
      kodeKppnOrDraft,
      kodeSatker || '',
      namaSatker || '',
      pegawaiList || []
    );
  }
}

/**
 * Export formal printable PDF document for email registration
 */
export function exportPendaftaranEmailToPDF(
  kodeKppn: string,
  kodeSatker: string,
  namaSatker: string,
  pegawaiList: PegawaiEmailRecord[],
  pejabat: PejabatEmailPenandatangan
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = 16;

  // Header / Kop
  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.text('KEMENTERIAN KEUANGAN REPUBLIK INDONESIA', pageWidth / 2, currentY, { align: 'center' });
  currentY += 5;
  doc.setFontSize(10);
  doc.text('DIREKTORAT JENDERAL PERBENDAHARAAN', pageWidth / 2, currentY, { align: 'center' });
  currentY += 5;
  doc.setFontSize(9);
  doc.setFont('times', 'normal');
  doc.text('FORMULIR PENDAFTARAN ALAMAT EMAIL KEDINASAN PEGAWAI SATUAN KERJA', pageWidth / 2, currentY, { align: 'center' });
  currentY += 3;

  // Horizontal divider
  doc.setLineWidth(0.6);
  doc.line(14, currentY, pageWidth - 14, currentY);
  currentY += 6;

  // Satker Information
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`KODE KPPN     : ${kodeKppn || '136'} (KPPN Semarang I)`, 14, currentY);
  currentY += 4.5;
  doc.text(`KODE SATKER   : ${kodeSatker}`, 14, currentY);
  doc.text(`NAMA SATKER   : ${namaSatker}`, 80, currentY);
  currentY += 4.5;
  doc.text(`TANGGAL DOK   : ${formatIndonesianDate()}`, 14, currentY);
  doc.text(`TOTAL PEGAWAI : ${pegawaiList.length} Orang`, 80, currentY);
  currentY += 6;

  // Table
  const tableData = pegawaiList.map((p, idx) => [
    (idx + 1).toString(),
    p.nama || '-',
    p.nip || '-',
    p.nik || '-',
    `${p.status} (${STATUS_PEGAWAI_MAP[p.status] || 'PNS'})`,
    p.jabatan || '-'
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [[
      'No',
      'Nama Pegawai',
      'NIP / NRP',
      'NIK',
      'Status',
      'Jabatan / Keterangan'
    ]],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
      textColor: [30, 41, 59],
      lineColor: [203, 213, 225],
      lineWidth: 0.2
    },
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 46 },
      2: { cellWidth: 38, halign: 'center' },
      3: { cellWidth: 36, halign: 'center' },
      4: { cellWidth: 22, halign: 'center' },
      5: { cellWidth: 30 }
    },
    margin: { left: 14, right: 14 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // Check page overflow for signature block
  if (currentY > 235) {
    doc.addPage();
    currentY = 20;
  }

  // Signature Block
  const sigX = pageWidth - 85;
  doc.setFont('times', 'normal');
  doc.setFontSize(9);
  doc.text('Mengetahui,', sigX, currentY);
  currentY += 4.5;
  doc.text(pejabat.jabatan || 'Kuasa Pengguna Anggaran', sigX, currentY);
  currentY += 16;
  doc.setFont('times', 'bold');
  doc.text(pejabat.nama, sigX, currentY);
  currentY += 4;
  doc.setFont('times', 'normal');
  doc.text(`NIP/NRP: ${pejabat.nip}`, sigX, currentY);

  const filename = `Form-Pendaftaran-Email-${kodeSatker}-${getFormattedDateForFilename()}.pdf`;
  doc.save(filename);
}

export function getStatusNameByCode(code: number): string {
  return STATUS_PEGAWAI_MAP[code] || 'Lainnya';
}

export const OFFICIAL_EMAIL_EXCEL_HEADERS = [
  'Kode KPPN',
  'Kode Satker',
  'Nama Satker',
  'Nama Pegawai',
  'NIP/NRP',
  'NIK',
  'Status (1=TNI; 2=POLRI; 3=PNS; 4=PPNPN; 5=P3K)'
];

export function downloadPendaftaranEmailTemplate(): void {
  const link = document.createElement('a');
  link.href = '/templates/format1 (57).xlsx';
  link.download = 'format1 (57).xlsx';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export const exportPendaftaranEmailToPdf = exportPendaftaranEmailToPDF;
