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
 * Mirrored 1:1 with the official Excel screenshot:
 * - Centered title 'Formulir Pendaftaran Pengguna Aplikasi SAKTI'
 * - Kode Satker, Nama Satker, Level Satker
 * - Royal Blue header bar (#2F5597), white bold text
 * - Crisp black table cell borders
 * - Peach/Yellow row highlight for BLU roles
 * - Left box: Framed Statement of Responsibility (Pernyataan 1, 2, 3)
 * - Right box: Kuasa Pengguna Anggaran (KPA) Signature
 * - Keterangan & Dikirimkan HAI notes
 */
export function exportPendaftaranSaktiToPDF(
  draft: PendaftaranUserSaktiDraft,
  ikpaInfo?: IkpaSummaryForPDF
): void {
  if (!draft.users || draft.users.length === 0) {
    throw new Error('Tidak dapat mencetak formulir: Belum ada data pengguna SAKTI yang ditambahkan.');
  }

  const invalidUsers = draft.users.filter(u => {
    const cleanNik = (u.nik || '').replace(/\D/g, '');
    const cleanNpwp = (u.npwp || '').replace(/\D/g, '');
    return !cleanNik || cleanNik.length !== 16 || !cleanNpwp || (cleanNpwp.length !== 15 && cleanNpwp.length !== 16);
  });

  if (invalidUsers.length > 0) {
    const errorDetails = invalidUsers.map(u => {
      const cleanNik = (u.nik || '').replace(/\D/g, '');
      const cleanNpwp = (u.npwp || '').replace(/\D/g, '');
      const issues: string[] = [];
      if (!cleanNik) issues.push('NIK belum diisi');
      else if (cleanNik.length !== 16) issues.push(`NIK (${cleanNik.length} digit, wajib 16 digit)`);
      if (!cleanNpwp) issues.push('NPWP belum diisi');
      else if (cleanNpwp.length !== 15 && cleanNpwp.length !== 16) issues.push(`NPWP (${cleanNpwp.length} digit, wajib 15/16 digit)`);
      return `• ${u.namaLengkap}: ${issues.join(', ')}`;
    }).join('\n');

    throw new Error(`Pencetakan PDF Ditolak: Data NIK dan NPWP wajib diisi lengkap untuk seluruh pengguna:\n${errorDetails}`);
  }

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  const contentWidth = pageWidth - (margin * 2);

  // 1. Judul Formulir (Tengah, Huruf Besar, Tebal)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('Formulir Pendaftaran Pengguna Aplikasi SAKTI', pageWidth / 2, margin + 6, { align: 'center' });

  // 2. Metadata Satker (Seperti Baris 3-5 di Excel)
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);

  const metaY = margin + 13;
  doc.text('Kode Satker', margin, metaY);
  doc.text(':', margin + 22, metaY);
  doc.setFont('helvetica', 'bold');
  doc.text(draft.kodeSatker || '-', margin + 25, metaY);

  doc.setFont('helvetica', 'normal');
  doc.text('Nama Satker', margin, metaY + 4.5);
  doc.text(':', margin + 22, metaY + 4.5);
  doc.setFont('helvetica', 'bold');
  doc.text(draft.namaSatker || '-', margin + 25, metaY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.text('Level Satker', margin, metaY + 9);
  doc.text(':', margin + 22, metaY + 9);
  doc.setFont('helvetica', 'bold');
  doc.text(`${draft.levelSatker || 'Satker Daerah (KD)'} ${draft.isBLU ? '(Satker BLU)' : ''}`, margin + 25, metaY + 9);

  // 3. Tabel Data Pengguna SAKTI (10 Kolom Identik Excel)
  const cleanKodeSatker = draft.kodeSatker.trim();
  const tableData: any[] = [];

  if (draft.users.length === 0) {
    tableData.push([
      cleanKodeSatker,
      '-',
      '-',
      '-',
      '-',
      '-',
      '-',
      '-',
      '-',
      '-'
    ]);
  } else {
    draft.users.forEach(u => {
      const rolesStr = formatRolesForExcel(u.roles || []);
      const cleanPhone = normalizePhoneNumber(u.noHp || '');
      const cleanNIP = (u.nip || '').replace(/\D/g, '');
      const cleanNIK = (u.nik || '').replace(/\D/g, '');
      const cleanNPWP = (u.npwp || '').trim();

      tableData.push([
        cleanKodeSatker,
        rolesStr,
        u.namaLengkap?.trim() || '-',
        cleanNIP || '-',
        cleanNPWP || '-',
        cleanNIK || '-',
        u.email?.trim() || '-',
        cleanPhone || '-',
        u.nomorSk?.trim() || '-',
        u.tanggalSk?.trim() || '-'
      ]);
    });
  }

  // Row dst placeholder
  tableData.push(['dst', '', '', '', '', '', '', '', '', '']);

  autoTable(doc, {
    startY: metaY + 13,
    margin: { left: margin, right: margin },
    head: [[
      'Kode Satker',
      'Peran',
      'Nama',
      'NIP',
      'NPWP',
      'NIK',
      'E-mail',
      'No. HP',
      'Nomor SK',
      'Tanggal SK'
    ]],
    body: tableData,
    theme: 'plain',
    headStyles: {
      fillColor: [47, 85, 151], // Royal Blue #2F5597
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center',
      valign: 'middle',
      cellPadding: 2,
      lineWidth: 0.2,
      lineColor: [0, 0, 0]
    },
    styles: {
      fontSize: 7,
      textColor: [0, 0, 0],
      cellPadding: 1.8,
      lineWidth: 0.2,
      lineColor: [0, 0, 0],
      valign: 'middle',
      overflow: 'linebreak'
    },
    columnStyles: {
      0: { cellWidth: 18, halign: 'center' },
      1: { cellWidth: 54, halign: 'left' },
      2: { cellWidth: 32, halign: 'left' },
      3: { cellWidth: 24, halign: 'center' },
      4: { cellWidth: 22, halign: 'center' },
      5: { cellWidth: 22, halign: 'center' },
      6: { cellWidth: 32, halign: 'left' },
      7: { cellWidth: 22, halign: 'center' },
      8: { cellWidth: 24, halign: 'left' },
      9: { cellWidth: 17, halign: 'center' }
    },
    didParseCell: (data) => {
      // Italic for 'dst' row
      if (data.row.index === tableData.length - 1 && data.section === 'body') {
        data.cell.styles.fontStyle = 'italic';
      }
      // Check if user row has BLU role and apply soft peach/yellow highlight
      if (data.section === 'body' && data.row.index < draft.users.length) {
        const u = draft.users[data.row.index];
        const isBlu = (u?.roles || []).some(r => r.toUpperCase().includes('BLU') || r === 'SATKER_VALIDATOR_ANGGARAN');
        if (isBlu) {
          data.cell.styles.fillColor = [255, 242, 204]; // #FFF2CC
        }
      }
    }
  });

  // 4. Bagian Bawah: Kotak Pernyataan (Kiri) & Tanda Tangan KPA (Kanan)
  const lastY = (doc as any).lastAutoTable.finalY || 80;
  let blockY = lastY + 5;

  // Cek apakah halaman cukup untuk kotak pernyataan & TTD (butuh ~56mm)
  if (blockY + 56 > pageHeight - margin) {
    doc.addPage();
    blockY = margin + 10;
  }

  // 4A. Kotak Pernyataan Tanggung Jawab (Kiri, berbingkai garis hitam)
  const boxWidth = 158;
  const boxHeight = 28;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.25);
  doc.rect(margin, blockY, boxWidth, boxHeight);

  doc.setFontSize(6.2);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);

  const statementText = 
    "1. Saya menyatakan bahwa seluruh data yang diisi pada formulir ini adalah BENAR dan saya mengisinya dalam keadaan sehat, tanpa paksaan dari siapapun atau tanpa ada tekanan dari pihak manapun. Apabila terbukti diketahui sebaliknya di kemudian hari, maka saya bersedia menerima tuntutan di kemudian hari sesuai dengan ketentuan yang berlaku.\n\n" +
    "2. Semua informasi yang dicantumkan pada formulir ini adalah BENAR dan SAH, serta membebaskan KPPN dari segala tuntutan pihak ketiga baik perdata maupun pidana, sehubungan dengan kesalahan/ketidakbenaran dalam pemberian informasi.\n\n" +
    "3. Bilamana kemudian hari terdapat tuntutan atas transaksi pengeluaran negara atas beban APBN yang berasal dari data elektonik yang saya terbitkan, maka saya bertanggung jawab penuh atas segala risiko yang timbul.";

  doc.text(statementText, margin + 2.5, blockY + 4, {
    maxWidth: boxWidth - 5,
    lineHeightFactor: 1.25
  });

  // 4B. Tanda Tangan KPA di Sebelah Kanan (H:J)
  const kota = draft.tempatPenetapan?.trim() || 'Jakarta';
  const rawDate = draft.tanggalPenetapan || new Date().toISOString().split('T')[0];
  const tglStr = formatIndonesianDate(rawDate);

  let namaKpa = draft.namaKpa?.trim() || '';
  let nipKpa = draft.nipKpa?.trim() || '';
  if (!namaKpa || !nipKpa) {
    const kpaUser = draft.users.find(u =>
      (u.roles || []).some(r => r.toUpperCase().includes('KPA')) ||
      (u.peranJabatan || '').toUpperCase().includes('KPA') ||
      (u.jabatanPerbendaharaan || '').toUpperCase().includes('KPA')
    );
    if (kpaUser) {
      if (!namaKpa) namaKpa = kpaUser.namaLengkap;
      if (!nipKpa) nipKpa = kpaUser.nip;
    }
  }
  if (!namaKpa) namaKpa = 'Nama KPA';
  if (!nipKpa) nipKpa = '1990xxxx';

  const sigX = margin + 175;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`${kota},    ${tglStr}`, sigX, blockY + 4);

  doc.setFont('helvetica', 'bold');
  doc.text('Kuasa Pengguna Anggaran', sigX, blockY + 9);

  doc.text(namaKpa, sigX, blockY + 22);
  doc.setFont('helvetica', 'normal');
  doc.text(`NIP ${nipKpa.replace(/\D/g, '') || nipKpa}`, sigX, blockY + 26);

  // 5. Bagian Keterangan & Dikirimkan HAI
  const notesY = blockY + boxHeight + 4;
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Keterangan', margin, notesY);

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.text('*NPWP diisi angka tanpa pemisah simbol', margin, notesY + 3.5);
  doc.text('*E-mail diisi dengan e-mail resmi Kedinasan', margin, notesY + 7);
  doc.text('*Tanggal SK diisi dengan format dd-mm-yyyy', margin, notesY + 10.5);

  doc.text('*Untuk contoh pengisian peran lengkap, silakan kunjungi ', margin, notesY + 14);
  doc.setTextColor(5, 99, 193); // Blue link
  doc.text('bit.ly/rolesakti', margin + 60, notesY + 14);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Dikirimkan HAI berupa :', margin, notesY + 19);

  doc.setFont('helvetica', 'normal');
  doc.text('* file PDF bertandatangan KPA', margin, notesY + 22.5);
  doc.text('* file excel sebagai lampiran', margin, notesY + 26);
  doc.text('* file SK Penetapan Pengguna SAKTI oleh KPA sebagai lampiran', margin, notesY + 29.5);

  // Trigger download PDF
  const dateStr = getFormattedDateForFilename();
  const filename = `Form-Pendaftaran-User-SAKTI-${cleanKodeSatker}-${dateStr}.pdf`;
  doc.save(filename);
}
