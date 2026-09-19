import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  PerubahanUserData,
  PerubahanUserDiffSummary,
  PerubahanUserHistoryItem,
  PerubahanUserFieldChange
} from '../types';
import {
  formatRolesForExcel,
  sortRolesByMasterOrder,
  MASTER_ROLE_MAP
} from '../data/masterRoleSakti';
import { normalizePhoneNumber } from './pendaftaranSaktiValidation';
import { formatIndonesianDate, getFormattedDateForFilename } from './pendaftaranSaktiExport';

/**
 * Calculates differences between SEMULA and MENJADI data
 */
export function calculatePerubahanDiff(
  semula: PerubahanUserData,
  menjadi: PerubahanUserData
): PerubahanUserDiffSummary {
  const semulaRoles = sortRolesByMasterOrder(semula.roles || []);
  const menjadiRoles = sortRolesByMasterOrder(menjadi.roles || []);

  const semulaSet = new Set(semulaRoles);
  const menjadiSet = new Set(menjadiRoles);

  const rolesAdded = menjadiRoles.filter(r => !semulaSet.has(r));
  const rolesRemoved = semulaRoles.filter(r => !menjadiSet.has(r));
  const rolesUnchanged = semulaRoles.filter(r => menjadiSet.has(r));

  const fieldChanges: PerubahanUserFieldChange[] = [];

  const checkField = (
    field: keyof PerubahanUserData,
    label: string,
    transform?: (val: string) => string
  ) => {
    const fromVal = transform ? transform(semula[field] as string || '') : (semula[field] as string || '').trim();
    const toVal = transform ? transform(menjadi[field] as string || '') : (menjadi[field] as string || '').trim();

    if (fromVal !== toVal) {
      fieldChanges.push({
        field,
        label,
        from: fromVal,
        to: toVal
      });
    }
  };

  checkField('nama', 'Nama Lengkap');
  checkField('nip', 'NIP / NRP', v => v.replace(/\D/g, ''));
  checkField('npwp', 'NPWP');
  checkField('nik', 'NIK', v => v.replace(/\D/g, ''));
  checkField('email', 'E-mail');
  checkField('noHp', 'Nomor HP / WhatsApp', v => normalizePhoneNumber(v));
  checkField('nomorSk', 'Nomor SK');
  checkField('tanggalSk', 'Tanggal SK');
  checkField('keterangan', 'Keterangan');

  const hasChanges = rolesAdded.length > 0 || rolesRemoved.length > 0 || fieldChanges.length > 0;

  return {
    hasChanges,
    rolesAdded,
    rolesRemoved,
    rolesUnchanged,
    fieldChanges
  };
}

import {
  exportPerubahanUserViaTemplate,
  formatToDdMmYyyy
} from './saktiMasterTemplateService';

/**
 * Exports Perubahan User to Excel adhering strictly to master template "Contoh Baru Form-Perubahan-User-SAKTI-Web.xlsx"
 */
export async function exportPerubahanUserToExcel(
  submission: PerubahanUserHistoryItem,
  namaSatker: string,
  levelSatker: string = 'Satker Daerah (KD)'
): Promise<void> {
  await exportPerubahanUserViaTemplate(submission, {
    kodeSatker: submission.kodeSatker,
    namaSatker,
    levelSatker
  });
}

/**
 * Exports Perubahan User to formal printable PDF document with official styling
 */
export function exportPerubahanUserToPDF(
  submission: PerubahanUserHistoryItem,
  satker: {
    kodeSatker: string;
    namaSatker: string;
    levelSatker?: string;
    namaKpa?: string;
    nipKpa?: string;
  }
): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = 14;

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
  doc.text('FORMULIR PERUBAHAN PENGGUNA APLIKASI SISTEM APLIKASI KEUANGAN TINGKAT INSTANSI (SAKTI)', pageWidth / 2, currentY, { align: 'center' });
  currentY += 3;

  // Horizontal divider
  doc.setLineWidth(0.6);
  doc.line(14, currentY, pageWidth - 14, currentY);
  currentY += 6;

  // Satker Information
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`KODE SATKER   : ${submission.kodeSatker}`, 14, currentY);
  doc.text(`NAMA SATKER   : ${satker.namaSatker || submission.namaSatker}`, 80, currentY);
  currentY += 5;
  doc.text(`LEVEL SATKER  : ${satker.levelSatker || submission.levelSatker || 'Satker Daerah (KD)'}`, 14, currentY);
  doc.text(`TANGGAL DOKUMEN: ${formatIndonesianDate(submission.tanggalPengajuan)}`, 80, currentY);
  currentY += 7;

  // Table 1: SEMULA
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(180, 83, 9); // amber tone
  doc.text('[1] DATA SEMULA (SEBELUM PERUBAHAN)', 14, currentY);
  doc.setTextColor(0, 0, 0);
  currentY += 2;

  const semulaRolesStr = formatRolesForExcel(submission.semula.roles || []);
  const semulaDataRow = [
    submission.kodeSatker,
    semulaRolesStr,
    submission.semula.nama || '-',
    submission.semula.nip || '-',
    submission.semula.npwp || '-',
    submission.semula.nik || '-',
    submission.semula.email || '-',
    submission.semula.noHp || '-',
    submission.semula.nomorSk || '-',
    submission.semula.tanggalSk || '-',
    submission.semula.keterangan || '-'
  ];

  autoTable(doc, {
    startY: currentY,
    head: [[
      'Kode Satker',
      'Peran SAKTI',
      'Nama Pegawai',
      'NIP',
      'NPWP',
      'NIK',
      'E-mail',
      'No. HP',
      'No. SK',
      'Tgl. SK',
      'Keterangan'
    ]],
    body: [semulaDataRow],
    theme: 'grid',
    styles: {
      fontSize: 7.5,
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
      0: { cellWidth: 18, halign: 'center' },
      1: { cellWidth: 42 },
      2: { cellWidth: 30 },
      3: { cellWidth: 26, halign: 'center' },
      4: { cellWidth: 22, halign: 'center' },
      5: { cellWidth: 24, halign: 'center' },
      6: { cellWidth: 28 },
      7: { cellWidth: 20, halign: 'center' },
      8: { cellWidth: 24 },
      9: { cellWidth: 16, halign: 'center' },
      10: { cellWidth: 19 }
    },
    margin: { left: 14, right: 14 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 7;

  // Table 2: MENJADI
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(16, 185, 129); // emerald tone
  doc.text('[2] DATA MENJADI (SETELAH PERUBAHAN)', 14, currentY);
  doc.setTextColor(0, 0, 0);
  currentY += 2;

  const menjadiRolesStr = formatRolesForExcel(submission.menjadi.roles || []);
  const menjadiDataRow = [
    submission.kodeSatker,
    menjadiRolesStr,
    submission.menjadi.nama || '-',
    submission.menjadi.nip || '-',
    submission.menjadi.npwp || '-',
    submission.menjadi.nik || '-',
    submission.menjadi.email || '-',
    submission.menjadi.noHp || '-',
    submission.menjadi.nomorSk || '-',
    submission.menjadi.tanggalSk || '-',
    submission.menjadi.keterangan || '-'
  ];

  autoTable(doc, {
    startY: currentY,
    head: [[
      'Kode Satker',
      'Peran SAKTI',
      'Nama Pegawai',
      'NIP',
      'NPWP',
      'NIK',
      'E-mail',
      'No. HP',
      'No. SK',
      'Tgl. SK',
      'Keterangan'
    ]],
    body: [menjadiDataRow],
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [30, 41, 59],
      lineColor: [203, 213, 225],
      lineWidth: 0.2
    },
    headStyles: {
      fillColor: [236, 253, 245],
      textColor: [6, 78, 59],
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { cellWidth: 18, halign: 'center' },
      1: { cellWidth: 42 },
      2: { cellWidth: 30 },
      3: { cellWidth: 26, halign: 'center' },
      4: { cellWidth: 22, halign: 'center' },
      5: { cellWidth: 24, halign: 'center' },
      6: { cellWidth: 28 },
      7: { cellWidth: 20, halign: 'center' },
      8: { cellWidth: 24 },
      9: { cellWidth: 16, halign: 'center' },
      10: { cellWidth: 19 }
    },
    margin: { left: 14, right: 14 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  // Summary Diff Box
  const diff = submission.diffSummary;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('RINGKASAN PERUBAHAN TERDETEKSI:', 14, currentY);
  currentY += 4.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  let summaryLines: string[] = [];
  if (diff.rolesAdded.length > 0) {
    summaryLines.push(`• Role Ditambahkan: ${diff.rolesAdded.map(r => `${r} (${MASTER_ROLE_MAP.get(r)?.roleName || r})`).join(', ')}`);
  }
  if (diff.rolesRemoved.length > 0) {
    summaryLines.push(`• Role Dihapus: ${diff.rolesRemoved.map(r => `${r} (${MASTER_ROLE_MAP.get(r)?.roleName || r})`).join(', ')}`);
  }
  diff.fieldChanges.forEach(fc => {
    summaryLines.push(`• ${fc.label}: "${fc.from || '(kosong)'}" -> "${fc.to || '(kosong)'}"`);
  });
  if (submission.keterangan) {
    summaryLines.push(`• Alasan Pengajuan: ${submission.keterangan}`);
  }

  summaryLines.forEach(line => {
    doc.text(line, 18, currentY);
    currentY += 4;
  });

  currentY += 4;

  // Signature Block (Right aligned)
  const kpaNama = submission.pejabatPenandatangan?.nama || satker.namaKpa || 'Nama Kuasa Pengguna Anggaran';
  const kpaNip = submission.pejabatPenandatangan?.nip || satker.nipKpa || '198001012005011001';
  const kpaJabatan = submission.pejabatPenandatangan?.jabatan || 'Kuasa Pengguna Anggaran';

  const sigX = pageWidth - 85;
  doc.setFont('times', 'normal');
  doc.setFontSize(9);
  doc.text('Mengetahui,', sigX, currentY);
  currentY += 4.5;
  doc.text(kpaJabatan, sigX, currentY);
  currentY += 16; // space for manual wet signature
  doc.setFont('times', 'bold');
  doc.text(kpaNama, sigX, currentY);
  currentY += 4;
  doc.setFont('times', 'normal');
  doc.text(`NIP/NRP: ${kpaNip}`, sigX, currentY);

  const filename = `Form-Perubahan-User-SAKTI-${submission.kodeSatker}-${getFormattedDateForFilename()}.pdf`;
  doc.save(filename);
}
