import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PemutakhiranKewenanganDraft, PemutakhiranUserItem } from '../types';
import {
  exportPemutakhiranKewenanganViaTemplate,
  TemplateValidationReport
} from './saktiMasterTemplateService';
import { formatRolesForExcel, sortRolesByMasterOrder, MASTER_ROLE_MAP } from '../data/masterRoleSakti';
import { formatIndonesianDate } from './pendaftaranSaktiExport';

/**
 * Validates the draft before export or submission
 */
export function validatePemutakhiranDraft(draft: PemutakhiranKewenanganDraft): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!draft.kodeSatker || draft.kodeSatker.trim().length !== 6) {
    errors.push('Kode Satker harus berupa 6 digit angka');
  }

  if (!draft.namaSatker || !draft.namaSatker.trim()) {
    errors.push('Nama Satker wajib diisi');
  }

  if (!draft.users || draft.users.length === 0) {
    errors.push('Minimal 1 pengguna SAKTI harus dipilih untuk dimutakhirkan kewenangannya');
  } else {
    const nikSet = new Set<string>();
    draft.users.forEach((u, idx) => {
      const num = idx + 1;
      if (!u.nama || !u.nama.trim()) {
        errors.push(`Pengguna #${num}: Nama wajib diisi`);
      }

      const cleanNik = (u.nik || '').replace(/\D/g, '');
      if (cleanNik.length !== 16) {
        errors.push(`Pengguna #${num} (${u.nama || 'Tanpa Nama'}): NIK wajib tepat 16 digit angka`);
      } else {
        if (nikSet.has(cleanNik)) {
          errors.push(`Pengguna #${num} (${u.nama}): NIK ${cleanNik} telah ditambahkan sebelumnya (duplikat)`);
        } else {
          nikSet.add(cleanNik);
        }
      }

      if (!u.rolesPemutakhiran || u.rolesPemutakhiran.length === 0) {
        errors.push(`Pengguna #${num} (${u.nama || 'Tanpa Nama'}): Minimal satu role SAKTI wajib dipilih`);
      } else {
        u.rolesPemutakhiran.forEach(r => {
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
 * Exports draft to Excel via Master Template
 */
export async function exportPemutakhiranKewenanganToExcel(
  draft: PemutakhiranKewenanganDraft
): Promise<TemplateValidationReport> {
  return await exportPemutakhiranKewenanganViaTemplate(draft);
}

/**
 * Exports draft to official printable PDF with standard Kemenkeu Kop & Signatures
 */
export function exportPemutakhiranKewenanganToPDF(draft: PemutakhiranKewenanganDraft): void {
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
  doc.text('FORMULIR PEMUTAKHIRAN KEWENANGAN PENGGUNA APLIKASI SAKTI', pageWidth / 2, currentY, { align: 'center' });
  currentY += 3;

  // Horizontal divider
  doc.setLineWidth(0.6);
  doc.line(14, currentY, pageWidth - 14, currentY);
  currentY += 6;

  // Satker Information
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`KODE SATKER   : ${draft.kodeSatker}`, 14, currentY);
  doc.text(`NAMA SATKER   : ${draft.namaSatker}`, 80, currentY);
  currentY += 5;
  doc.text(`LEVEL SATKER  : ${draft.levelSatker || 'Satker Daerah (KD)'}`, 14, currentY);
  doc.text(`TANGGAL DOKUMEN: ${formatIndonesianDate(draft.tanggalPenetapan || new Date().toISOString())}`, 80, currentY);
  currentY += 7;

  // Table Data
  const tableRows = (draft.users || []).map((u, idx) => {
    const sortedRoles = sortRolesByMasterOrder(u.rolesPemutakhiran || []);
    const rolesStr = formatRolesForExcel(sortedRoles);
    return [
      idx + 1,
      draft.kodeSatker,
      u.tipe || 'SATKER',
      u.peranKategori || 'OPERATOR',
      u.nama || '-',
      u.nik || '-',
      rolesStr || '-'
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [['No', 'Kode Satker', 'Tipe', 'Peran', 'Nama', 'NIK', 'Peran (Role SAKTI)']],
    body: tableRows,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
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
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 22, halign: 'center' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 25, halign: 'center' },
      4: { cellWidth: 50, fontStyle: 'bold' },
      5: { cellWidth: 35, halign: 'center' },
      6: { cellWidth: 'auto' }
    },
    margin: { left: 14, right: 14 }
  });

  let finalY = (doc as any).lastAutoTable?.finalY || (currentY + 40);

  // Check if we need a new page for notes and signature
  if (finalY > 150) {
    doc.addPage();
    finalY = 20;
  } else {
    finalY += 8;
  }

  // Official Template Notes
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Catatan Resmi Formulir Pemutakhiran Kewenangan SAKTI:', 14, finalY);
  finalY += 4;
  doc.setFont('helvetica', 'normal');
  doc.text('1. Silakan mengisi data pengguna (User) yang ingin di-update kewenangannya.', 14, finalY);
  finalY += 3.5;
  doc.text('2. Pastikan NIK telah benar dimiliki oleh pengguna dan sesuai (16 digit).', 14, finalY);
  finalY += 3.5;
  doc.text('3. Isian Formulir Pemutakhiran Kewenangan akan mengupdate kewenangan user yang ada saat ini.', 14, finalY);

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
  doc.text(draft.kpa?.nama || '(..................................................)', sigX, sigY);
  sigY += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.text(`NIP. ${draft.kpa?.nip || '...........................................'}`, sigX, sigY);

  const ymd = (draft.tanggalPenetapan || new Date().toISOString().split('T')[0]).replace(/-/g, '');
  const pdfFilename = `Form-Pemutakhiran-Kewenangan-${draft.kodeSatker}-${ymd}.pdf`;
  doc.save(pdfFilename);
}
