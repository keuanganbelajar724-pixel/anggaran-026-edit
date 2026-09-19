import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PendaftaranUserSaktiDraft } from '../types';
import { formatRolesForExcel, MASTER_ROLE_SAKTI_LIST } from '../data/masterRoleSakti';
import { normalizePhoneNumber } from './pendaftaranSaktiValidation';

/**
 * Format date to YYYYMMDD for filenames
 */
export function getFormattedDateForFilename(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * Format date for Indonesian display (e.g. 15 Januari 2026)
 */
export function formatIndonesianDate(dateStr?: string): string {
  if (!dateStr) {
    const now = new Date();
    return now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

import { exportPendaftaranSaktiViaTemplate } from './saktiMasterTemplateService';

/**
 * Generates official Excel workbook adhering strictly to the government master template "Contoh Form-Pendaftaran-User-SAKTI-Web-SATKER.xlsx"
 */
export async function exportPendaftaranSaktiToExcel(draft: PendaftaranUserSaktiDraft): Promise<void> {
  await exportPendaftaranSaktiViaTemplate(draft);
}

export interface IkpaSummaryForPDF {
  totalNilai?: number;
  predikat?: string;
  rank?: number;
  capaianOutput?: number;
  penyerapanAnggaran?: number;
  efisiensi?: number;
}

/**
 * Generates official PDF document for SAKTI user registration
 */
export function exportPendaftaranSaktiToPDF(
  draft: PendaftaranUserSaktiDraft,
  ikpaInfo?: IkpaSummaryForPDF
): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;

  // Header Banner / Garuda & KPPN identity
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(margin, margin, pageWidth - (margin * 2), 20, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('KEMENTERIAN KEUANGAN REPUBLIK INDONESIA', margin + 6, margin + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text('DIREKTORAT JENDERAL PERBENDAHARAAN • KPPN SEMARANG I (026)', margin + 6, margin + 12);
  doc.text('FORMULIR RESMI PENDAFTARAN / PEMUTAKHIRAN PENGGUNA APLIKASI SAKTI', margin + 6, margin + 17);

  // Satker Information Card
  const hasIkpa = ikpaInfo && typeof ikpaInfo.totalNilai === 'number';
  const cardHeight = hasIkpa ? 24 : 18;
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, margin + 23, pageWidth - (margin * 2), cardHeight, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('INFORMASI SATUAN KERJA (SATKER):', margin + 4, margin + 28);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Kode Satker : `, margin + 4, margin + 34);
  doc.setFont('helvetica', 'bold');
  doc.text(`${draft.kodeSatker}`, margin + 24, margin + 34);

  doc.setFont('helvetica', 'normal');
  doc.text(`Nama Satker : `, margin + 55, margin + 34);
  doc.setFont('helvetica', 'bold');
  doc.text(`${draft.namaSatker}`, margin + 76, margin + 34);

  doc.setFont('helvetica', 'normal');
  doc.text(`Level Satker : `, margin + 185, margin + 34);
  doc.setFont('helvetica', 'bold');
  doc.text(`${draft.levelSatker} ${draft.isBLU ? '(Satker BLU)' : ''}`, margin + 204, margin + 34);

  if (hasIkpa) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 118, 110); // teal-700
    doc.text('Status Capaian IKPA KPPN 026 :', margin + 4, margin + 41);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const ikpaStr = `Nilai Akhir: ${ikpaInfo.totalNilai?.toFixed(2)} (${ikpaInfo.predikat || 'Sangat Baik'}) | Peringkat KPPN: #${ikpaInfo.rank || '-'} | Capaian Output: ${ikpaInfo.capaianOutput !== undefined ? ikpaInfo.capaianOutput.toFixed(1) + '%' : '-'} | Penyerapan: ${ikpaInfo.penyerapanAnggaran !== undefined ? ikpaInfo.penyerapanAnggaran.toFixed(1) + '%' : '-'}`;
    doc.text(ikpaStr, margin + 50, margin + 41);
  }

  // Table Body
  const tableData = draft.users.map((user, idx) => {
    const roleString = formatRolesForExcel(user.roles || []);
    const cleanPhone = normalizePhoneNumber(user.noHp || '');
    const cleanNIP = (user.nip || '').replace(/\D/g, '');
    const cleanNIK = (user.nik || '').replace(/\D/g, '');
    const cleanNPWP = (user.npwp || '').trim();

    return [
      (idx + 1).toString(),
      `${user.namaLengkap}\nNIP. ${cleanNIP || '-'}`,
      `NIK: ${cleanNIK || '-'}\nNPWP: ${cleanNPWP || '-'}`,
      `E-mail:\n${user.email || '-'}\nHP/WA:\n${cleanPhone || '-'}`,
      roleString,
      `No: ${user.nomorSk || '-'}\nTgl: ${user.tanggalSk || '-'}`
    ];
  });

  autoTable(doc, {
    startY: margin + (hasIkpa ? 51 : 44),
    margin: { left: margin, right: margin, bottom: 42 },
    head: [[
      'No',
      'Nama & NIP Pegawai',
      'NIK & NPWP',
      'Kontak Aktif',
      'Peran / Role SAKTI (Resmi)',
      'Dasar SK Pengangkatan'
    ]],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59], // Slate 800
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
      valign: 'middle',
      cellPadding: 2.5
    },
    styles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
      cellPadding: 2.2,
      lineColor: [203, 213, 225],
      lineWidth: 0.2,
      valign: 'top',
      overflow: 'linebreak'
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 46 },
      2: { cellWidth: 38 },
      3: { cellWidth: 44 },
      4: { cellWidth: 85 },
      5: { cellWidth: 50 }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    didDrawPage: (data) => {
      // Footer page numbering
      const str = `Halaman ${doc.internal.pages.length - 1} • Dicetak melalui ANGKASA KPPN Semarang I`;
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(str, margin, pageHeight - 6);

      const timestamp = `Waktu Cetak: ${new Date().toLocaleString('id-ID')}`;
      doc.text(timestamp, pageWidth - margin - doc.getTextWidth(timestamp), pageHeight - 6);
    }
  });

  // Signature Block on final page
  const finalY = (doc as any).lastAutoTable.finalY || margin + 50;
  const sigRequiredSpace = 36;
  let sigY = finalY + 8;

  // Add new page if not enough space for signature
  if (sigY + sigRequiredSpace > pageHeight - margin) {
    doc.addPage();
    sigY = margin + 10;
  }

  const tempat = draft.tempatPenetapan || 'Semarang';
  const tglStr = formatIndonesianDate(draft.tanggalPenetapan);
  const sigX = pageWidth - margin - 80;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  doc.text(`${tempat}, ${tglStr}`, sigX, sigY);
  doc.text('Kuasa Pengguna Anggaran (KPA),', sigX, sigY + 5);

  doc.setFont('helvetica', 'bold');
  doc.text(draft.namaKpa || '( ...................................................... )', sigX, sigY + 24);
  doc.setFont('helvetica', 'normal');
  doc.text(`NIP. ${draft.nipKpa || '...................................................'}`, sigX, sigY + 29);

  // Trigger download
  const dateStr = getFormattedDateForFilename();
  const filename = `Form-Pendaftaran-User-SAKTI-${draft.kodeSatker}-${dateStr}.pdf`;
  doc.save(filename);
}
