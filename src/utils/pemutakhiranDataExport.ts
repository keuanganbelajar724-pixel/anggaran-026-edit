import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PemutakhiranDataDraft, PemutakhiranDataUserItem } from '../types';
import {
  exportPemutakhiranDataViaTemplate,
  formatToDdMmYyyy,
  TemplateValidationReport
} from './saktiMasterTemplateService';
import { formatRolesForExcel, sortRolesByMasterOrder, MASTER_ROLE_MAP } from '../data/masterRoleSakti';
import { formatIndonesianDate } from './pendaftaranSaktiExport';

/**
 * Validates whether email belongs to official domain
 */
export function isValidSaktiEmail(email: string): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return clean.endsWith('@sakti.mail.go.id') || clean.endsWith('@kemenkeu.go.id');
}

/**
 * Validates Pemutakhiran Data Draft before submission/export
 */
export function validatePemutakhiranDataDraft(draft: PemutakhiranDataDraft): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!draft.kodeSatker || draft.kodeSatker.trim().length !== 6) {
    errors.push('Kode Satker harus berupa 6 digit angka');
  }

  if (!draft.namaSatker || !draft.namaSatker.trim()) {
    errors.push('Nama Satker wajib diisi');
  }

  if (!draft.users || draft.users.length === 0) {
    errors.push('Minimal 1 pengguna SAKTI harus ditambahkan untuk pemutakhiran data');
  } else {
    const nikSet = new Set<string>();
    draft.users.forEach((u, idx) => {
      const num = idx + 1;
      const userName = u.nama?.trim() || `Pengguna #${num}`;

      if (!u.nama || !u.nama.trim()) {
        errors.push(`Pengguna #${num}: Nama wajib diisi`);
      }

      // NIP validation
      const cleanNip = (u.nip || '').replace(/\D/g, '');
      if (!cleanNip) {
        errors.push(`Pengguna #${num} (${userName}): NIP wajib diisi angka`);
      }

      // NIK validation (wajib 16 digit)
      const cleanNik = (u.nik || '').replace(/\D/g, '');
      if (cleanNik.length !== 16) {
        errors.push(`Pengguna #${num} (${userName}): NIK wajib tepat 16 digit angka`);
      } else {
        if (nikSet.has(cleanNik)) {
          errors.push(`Pengguna #${num} (${userName}): NIK ${cleanNik} duplikat dengan pengguna lain`);
        } else {
          nikSet.add(cleanNik);
        }
      }

      // NPWP validation (angka tanpa simbol)
      const cleanNpwp = (u.npwp || '').replace(/\D/g, '');
      if (u.npwp && !cleanNpwp) {
        errors.push(`Pengguna #${num} (${userName}): NPWP harus berupa angka`);
      }

      // Email validation (@sakti.mail.go.id / @kemenkeu.go.id)
      if (!u.email || !u.email.trim()) {
        errors.push(`Pengguna #${num} (${userName}): E-mail wajib diisi`);
      } else if (!isValidSaktiEmail(u.email)) {
        errors.push(`Pengguna #${num} (${userName}): E-mail harus berdomain @sakti.mail.go.id atau @kemenkeu.go.id`);
      }

      // No HP validation (diawali 08)
      const cleanHp = (u.noHp || '').replace(/[^\d+]/g, '');
      if (!cleanHp) {
        errors.push(`Pengguna #${num} (${userName}): No. HP wajib diisi`);
      } else if (!cleanHp.startsWith('08') && !cleanHp.startsWith('+628')) {
        errors.push(`Pengguna #${num} (${userName}): No. HP wajib diawali dengan 08`);
      }

      // Tanggal SK validation (DD-MM-YYYY)
      const tglFormatted = formatToDdMmYyyy(u.tanggalSk);
      if (!tglFormatted || !/^\d{2}-\d{2}-\d{4}$/.test(tglFormatted)) {
        errors.push(`Pengguna #${num} (${userName}): Tanggal SK harus dalam format DD-MM-YYYY`);
      }

      // Nomor SK validation
      if (!u.nomorSk || !u.nomorSk.trim()) {
        errors.push(`Pengguna #${num} (${userName}): Nomor SK wajib diisi`);
      }

      // Roles validation
      if (!u.peranList || u.peranList.length === 0) {
        errors.push(`Pengguna #${num} (${userName}): Minimal 1 Peran/Role SAKTI wajib dipilih`);
      } else {
        u.peranList.forEach(r => {
          if (!MASTER_ROLE_MAP.has(r)) {
            errors.push(`Pengguna #${num}: Role "${r}" tidak terdaftar dalam master ROLE_REFERENCE`);
          }
        });
      }
    });
  }

  if (!draft.kpa?.nama || !draft.kpa.nama.trim()) {
    errors.push('Nama Kuasa Pengguna Anggaran (KPA) wajib diisi untuk penandatanganan');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Export to Excel using Master Template: "Form Pemutakhiran Data Pengguna Aplikasi SAKTI.xlsx"
 */
export async function exportPemutakhiranDataToExcel(
  draft: PemutakhiranDataDraft
): Promise<TemplateValidationReport> {
  return await exportPemutakhiranDataViaTemplate(draft);
}

/**
 * Export to official printable PDF with landscape layout, standard Kop, 10 columns, notes & KPA signature
 */
export function exportPemutakhiranDataToPDF(draft: PemutakhiranDataDraft): void {
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
  doc.text('FORMULIR PEMUTAKHIRAN DATA PENGGUNA APLIKASI SAKTI', pageWidth / 2, currentY, { align: 'center' });
  currentY += 3;

  // Horizontal divider
  doc.setLineWidth(0.6);
  doc.line(14, currentY, pageWidth - 14, currentY);
  currentY += 6;

  // Identitas Satker
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(`KODE SATKER   : ${draft.kodeSatker}`, 14, currentY);
  doc.text(`NAMA SATKER   : ${draft.namaSatker}`, 90, currentY);
  currentY += 4.5;
  doc.text(`LEVEL SATKER  : ${draft.levelSatker || 'Satker Daerah (KD)'}`, 14, currentY);
  doc.text(`TANGGAL DOKUMEN: ${formatIndonesianDate(draft.tanggalPenetapan || new Date().toISOString())}`, 90, currentY);
  currentY += 6.5;

  // Table Data (10 columns A-J)
  const tableRows = (draft.users || []).map((u, idx) => {
    const sortedRoles = sortRolesByMasterOrder(u.peranList || []);
    const rolesStr = formatRolesForExcel(sortedRoles);
    const cleanNik = (u.nik || '').replace(/\D/g, '');
    const cleanNip = (u.nip || '').replace(/\D/g, '');
    const cleanNpwp = (u.npwp || '').replace(/\D/g, '');
    const tglSkStr = formatToDdMmYyyy(u.tanggalSk);

    return [
      idx + 1,
      draft.kodeSatker,
      rolesStr || '-',
      u.nama || '-',
      cleanNip || '-',
      cleanNpwp || '-',
      cleanNik || '-',
      u.email || '-',
      u.noHp || '-',
      u.nomorSk || '-',
      tglSkStr || '-'
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [[
      'No',
      'Kode Satker',
      'Peran (Role SAKTI)',
      'Nama',
      'NIP',
      'NPWP',
      'NIK',
      'E-mail',
      'No. HP',
      'Nomor SK',
      'Tanggal SK'
    ]],
    body: tableRows,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 1.8,
      textColor: [30, 41, 59],
      lineColor: [203, 213, 225],
      lineWidth: 0.1
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 18, halign: 'center' },
      2: { cellWidth: 42 },
      3: { cellWidth: 32, fontStyle: 'bold' },
      4: { cellWidth: 26, halign: 'center' },
      5: { cellWidth: 24, halign: 'center' },
      6: { cellWidth: 26, halign: 'center' },
      7: { cellWidth: 32 },
      8: { cellWidth: 22, halign: 'center' },
      9: { cellWidth: 26 },
      10: { cellWidth: 18, halign: 'center' }
    },
    margin: { left: 14, right: 14 }
  });

  let finalY = (doc as any).lastAutoTable?.finalY || (currentY + 40);

  // Check if we need a new page for notes and signature
  if (finalY > 150) {
    doc.addPage();
    finalY = 20;
  } else {
    finalY += 7;
  }

  // Catatan Template Resmi
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Catatan:', 14, finalY);
  finalY += 4;
  doc.setFont('helvetica', 'normal');
  doc.text('1. NIP, NPWP, dan NIK diisi angka tanpa pemisah simbol', 14, finalY);
  finalY += 3.5;
  doc.text('2. Email diisi dengan email SAKTI (@sakti.mail.go.id) atau Kemenkeu (@kemenkeu.go.id) bagi pegawai Kemenkeu', 14, finalY);
  finalY += 3.5;
  doc.text('3. tanggal SK diisi dengan format DD-MM-YYYY', 14, finalY);

  // Signature Area
  const sigX = pageWidth - 90;
  let sigY = finalY + 4;

  const tempat = draft.tempatPenetapan || 'Jakarta';
  const tglStr = formatIndonesianDate(draft.tanggalPenetapan || new Date().toISOString());

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(`${tempat}, ${tglStr}`, sigX, sigY);
  sigY += 4.5;
  doc.setFont('helvetica', 'bold');
  doc.text(draft.kpa?.jabatan || 'Kuasa Pengguna Anggaran', sigX, sigY);
  sigY += 22; // Space for signature and stamp
  doc.text(draft.kpa?.nama ? `(${draft.kpa.nama})` : '(..................................................)', sigX, sigY);
  sigY += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.text(draft.kpa?.nip ? `NIP. ${draft.kpa.nip}` : 'NIP. ...........................................', sigX, sigY);

  const ymd = (draft.tanggalPenetapan || new Date().toISOString().split('T')[0]).replace(/-/g, '');
  const pdfFilename = `Form-Pemutakhiran-Data-Pengguna-SAKTI-${draft.kodeSatker}-${ymd}.pdf`;
  doc.save(pdfFilename);
}
