import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SkSaktiDraft, UserSaktiRecord } from '../types';

/**
 * Format Indonesian date string
 */
function formatIndoDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      const day = parseInt(parts[2], 10);
      const month = months[parseInt(parts[1], 10) - 1] || parts[1];
      const year = parts[0];
      return `${day} ${month} ${year}`;
    }
  } catch {
    // fallback
  }
  return dateStr;
}

/**
 * Generates official PDF document matching the exact structure of SK Penetapan User SAKTI
 */
export function generateSkSaktiPdf(
  draft: SkSaktiDraft,
  allUsers: UserSaktiRecord[]
): void {
  const selectedUsers = allUsers.filter(u => draft.selectedUserIds.includes(u.id));
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const marginX = 22;
  const contentWidth = pageWidth - marginX * 2;
  const formattedDate = formatIndoDate(draft.tanggalSk);

  // =========================================================================
  // PAGE 1: KOP, JUDUL SK, MENIMBANG, MENGINGAT
  // =========================================================================
  let curY = 20;

  // Kop Surat Instansi
  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  if (draft.kopSurat.kementerian) {
    doc.text(draft.kopSurat.kementerian.toUpperCase(), pageWidth / 2, curY, { align: 'center' });
    curY += 5.5;
  }
  if (draft.kopSurat.eselon1) {
    doc.text(draft.kopSurat.eselon1.toUpperCase(), pageWidth / 2, curY, { align: 'center' });
    curY += 5.5;
  }
  doc.setFontSize(13);
  doc.text((draft.kopSurat.satkerUnit || draft.namaSatker).toUpperCase(), pageWidth / 2, curY, { align: 'center' });
  curY += 5;

  if (draft.kopSurat.alamatKontak) {
    doc.setFont('times', 'normal');
    doc.setFontSize(8.5);
    doc.text(draft.kopSurat.alamatKontak, pageWidth / 2, curY, { align: 'center' });
    curY += 4;
  }

  // Divider Line
  doc.setLineWidth(0.8);
  doc.line(marginX, curY, pageWidth - marginX, curY);
  curY += 6;

  // Judul Keputusan
  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  const judulPejabat = `KEPUTUSAN ${(draft.pejabat.jabatan || 'KUASA PENGGUNA ANGGARAN').toUpperCase()} ${draft.namaSatker.toUpperCase()}`;
  doc.text(judulPejabat, pageWidth / 2, curY, { align: 'center' });
  curY += 5;

  doc.text(`NOMOR ${draft.nomorSk || 'KEP-    /    /    /2026'}`, pageWidth / 2, curY, { align: 'center' });
  curY += 5;

  doc.text('TENTANG', pageWidth / 2, curY, { align: 'center' });
  curY += 5;

  // Tentang (Wrap text centered)
  const tentangLines = doc.splitTextToSize(draft.tentang.toUpperCase(), contentWidth - 20);
  doc.text(tentangLines, pageWidth / 2, curY, { align: 'center' });
  curY += (tentangLines.length * 4.8) + 4;

  const pejabatLine = `${(draft.pejabat.jabatan || 'KUASA PENGGUNA ANGGARAN').toUpperCase()} ${draft.namaSatker.toUpperCase()},`;
  doc.text(pejabatLine, pageWidth / 2, curY, { align: 'center' });
  curY += 7;

  // Bagian Menimbang
  doc.setFont('times', 'bold');
  doc.setFontSize(10);
  doc.text('Menimbang :', marginX, curY);
  
  doc.setFont('times', 'normal');
  const indentHuruf = marginX + 25;
  const textWidth = pageWidth - marginX - indentHuruf;

  draft.menimbang.forEach((item, idx) => {
    const huruf = item.huruf || String.fromCharCode(97 + idx);
    doc.setFont('times', 'bold');
    doc.text(`${huruf}.`, marginX + 20, curY);
    doc.setFont('times', 'normal');

    const lines = doc.splitTextToSize(item.text, textWidth);
    doc.text(lines, indentHuruf, curY, { align: 'justify', maxWidth: textWidth });
    curY += (lines.length * 4.4) + 2.5;
  });

  curY += 3;

  // Bagian Mengingat
  doc.setFont('times', 'bold');
  doc.text('Mengingat   :', marginX, curY);

  draft.mengingat.forEach((item, idx) => {
    const num = item.nomor || idx + 1;
    doc.setFont('times', 'bold');
    doc.text(`${num}.`, marginX + 20, curY);
    doc.setFont('times', 'normal');

    const lines = doc.splitTextToSize(item.text, textWidth);
    doc.text(lines, indentHuruf, curY, { align: 'justify', maxWidth: textWidth });
    curY += (lines.length * 4.4) + 2.5;
  });

  // =========================================================================
  // PAGE 2: MEMUTUSKAN, DIKTUM, TANDA TANGAN
  // =========================================================================
  doc.addPage();
  curY = 24;

  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.text('MEMUTUSKAN:', pageWidth / 2, curY, { align: 'center' });
  curY += 7;

  doc.text('Menetapkan :', marginX, curY);
  doc.setFont('times', 'bold');
  const menetapkanLines = doc.splitTextToSize(`  ${draft.menetapkan}`, textWidth);
  doc.text(menetapkanLines, indentHuruf, curY, { align: 'justify', maxWidth: textWidth });
  curY += (menetapkanLines.length * 4.6) + 4;

  // Diktum Pertama s/d Keempat
  draft.diktum.forEach(dik => {
    doc.setFont('times', 'bold');
    doc.text(`${dik.label} :`, marginX, curY);
    doc.setFont('times', 'normal');

    const dikLines = doc.splitTextToSize(dik.text, textWidth);
    doc.text(dikLines, indentHuruf, curY, { align: 'justify', maxWidth: textWidth });
    curY += (dikLines.length * 4.6) + 3.5;
  });

  curY += 8;

  // Tanda Tangan KPA (Right Aligned block)
  const signX = pageWidth - marginX - 70;
  doc.setFont('times', 'normal');
  doc.text(`Ditetapkan di ${draft.tempatPenetapan || 'Semarang'}`, signX, curY);
  curY += 4.5;
  doc.text(`pada tanggal ${formattedDate || '                   '}`, signX, curY);
  curY += 5;

  doc.setFont('times', 'bold');
  const kpaLines = doc.splitTextToSize(`${(draft.pejabat.jabatan || 'Kuasa Pengguna Anggaran').toUpperCase()} ${draft.namaSatker.toUpperCase()},`, 75);
  doc.text(kpaLines, signX, curY);
  curY += (kpaLines.length * 4.5) + 20; // Ruang tanda tangan

  // Nama Pejabat (Underlined)
  doc.text(draft.pejabat.namaPejabat || '( .................................................... )', signX, curY);
  const textWidthName = doc.getTextWidth(draft.pejabat.namaPejabat || '( .................................................... )');
  doc.setLineWidth(0.3);
  doc.line(signX, curY + 0.8, signX + textWidthName, curY + 0.8);
  curY += 5;

  doc.setFont('times', 'normal');
  doc.text(`NIP ${draft.pejabat.nipPejabat || '....................................'}`, signX, curY);

  // =========================================================================
  // PAGE 3: LAMPIRAN (TABEL DAFTAR PENGGUNA SAKTI)
  // =========================================================================
  doc.addPage();
  curY = 20;

  doc.setFont('times', 'bold');
  doc.setFontSize(9.5);
  doc.text(`LAMPIRAN KEPUTUSAN ${(draft.pejabat.jabatan || 'KUASA PENGGUNA ANGGARAN').toUpperCase()} ${draft.namaSatker.toUpperCase()}`, marginX, curY);
  curY += 4.2;
  doc.text(`NOMOR     : ${draft.nomorSk}`, marginX, curY);
  curY += 4.2;
  doc.text(`TANGGAL : ${formattedDate}`, marginX, curY);
  curY += 7;

  doc.setFontSize(10.5);
  doc.text('DAFTAR PEJABAT, OPERATOR, DAN ADMINISTRATOR PENGGUNA SISTEM SAKTI', pageWidth / 2, curY, { align: 'center' });
  curY += 4.8;
  doc.text('TINGKAT SATUAN KERJA', pageWidth / 2, curY, { align: 'center' });
  curY += 4.8;
  doc.text(`PADA ${draft.namaSatker.toUpperCase()} (${draft.kodeSatker})`, pageWidth / 2, curY, { align: 'center' });
  curY += 4.8;
  doc.text(`TAHUN ANGGARAN ${draft.tahunAnggaran}`, pageWidth / 2, curY, { align: 'center' });
  curY += 6;

  // Build Table Data
  const tableData = selectedUsers.map((user, idx) => [
    String(idx + 1),
    `${user.namaLengkap}\nNIP. ${user.nip || '-'}\n${user.pangkatGolongan || 'Penata / III/c'}`,
    user.jabatan || 'Pengelola Keuangan / Pelaksana',
    user.peranJabatan || 'Operator',
    user.jabatanPerbendaharaan || 'Operator Anggaran'
  ]);

  autoTable(doc, {
    startY: curY,
    margin: { left: marginX, right: marginX },
    head: [[
      'NO',
      'NAMA / NIP /\nPANGKAT / GOLONGAN',
      'JABATAN',
      'PERAN JABATAN',
      'JABATAN PERBENDAHARAAN'
    ]],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [243, 244, 246],
      textColor: [31, 41, 55],
      font: 'times',
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'center',
      valign: 'middle',
      lineWidth: 0.2,
      lineColor: [156, 163, 175]
    },
    bodyStyles: {
      font: 'times',
      fontSize: 8,
      textColor: [17, 24, 39],
      valign: 'top',
      lineWidth: 0.2,
      lineColor: [209, 213, 219]
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 62 },
      2: { cellWidth: 40 },
      3: { cellWidth: 26, halign: 'center', fontStyle: 'bold' },
      4: { cellWidth: 28 }
    },
    styles: {
      overflow: 'linebreak',
      cellPadding: 2.2
    }
  });

  // Tanda Tangan Lampiran KPA
  const finalY = (doc as any).lastAutoTable?.finalY || 180;
  let signLampiranY = finalY + 8;
  if (signLampiranY > 230) {
    doc.addPage();
    signLampiranY = 24;
  }

  doc.setFont('times', 'normal');
  doc.setFontSize(9.5);
  doc.text(`Ditetapkan di ${draft.tempatPenetapan || 'Semarang'}`, signX, signLampiranY);
  signLampiranY += 4.5;
  doc.text(`pada tanggal ${formattedDate || '                   '}`, signX, signLampiranY);
  signLampiranY += 5;

  doc.setFont('times', 'bold');
  const kpaLampiranLines = doc.splitTextToSize(`${(draft.pejabat.jabatan || 'Kuasa Pengguna Anggaran').toUpperCase()} ${draft.namaSatker.toUpperCase()},`, 75);
  doc.text(kpaLampiranLines, signX, signLampiranY);
  signLampiranY += (kpaLampiranLines.length * 4.5) + 18;

  doc.text(draft.pejabat.namaPejabat || '( .................................................... )', signX, signLampiranY);
  const textWidthNameLampiran = doc.getTextWidth(draft.pejabat.namaPejabat || '( .................................................... )');
  doc.setLineWidth(0.3);
  doc.line(signX, signLampiranY + 0.8, signX + textWidthNameLampiran, signLampiranY + 0.8);
  signLampiranY += 5;

  doc.setFont('times', 'normal');
  doc.text(`NIP ${draft.pejabat.nipPejabat || '....................................'}`, signX, signLampiranY);

  // =========================================================================
  // PAGE 4: PETUNJUK PENGISIAN (JIKA !hideInstructionPage)
  // =========================================================================
  if (!draft.hideInstructionPage) {
    doc.addPage();
    curY = 24;

    doc.setFont('times', 'bold');
    doc.setFontSize(11);
    doc.text('PETUNJUK PENGISIAN FORMAT SK PENETAPAN USER SAKTI', pageWidth / 2, curY, { align: 'center' });
    curY += 8;

    doc.setFont('times', 'normal');
    doc.setFontSize(9);

    const instructions = [
      '1. Format Surat Keputusan (SK) ini merupakan format baku penetapan pengguna SAKTI tingkat satuan kerja sesuai pedoman Kementerian Keuangan.',
      '2. Kolom NAMA / NIP / PANGKAT / GOLONGAN diisi nama lengkap pegawai sesuai data resmi BKN, NIP 18 digit tanpa spasi/titik, serta pangkat dan golongan ruang terakhir (misal: Penata Tk. I / III/d).',
      '3. Kolom JABATAN diisi jabatan kedinasan definitif pegawai pada struktur organisasi satuan kerja (misal: Kepala Seksi, Kasubbag Umum, Analis Anggaran, Pelaksana).',
      '4. Kolom PERAN JABATAN wajib dipilih salah satu dari 4 (empat) peran kewenangan resmi SAKTI:\n   • Approval: Pejabat yang berwenang menyetujui transaksi anggaran/komitmen (KPA, PPK).\n   • Validator: Pejabat yang bertugas menguji dan memvalidasi kebenaran dokumen perintah pembayaran (PPSPM).\n   • Operator: Pelaksana teknis perekaman dan input data pada modul SAKTI (Anggaran, Komitmen, Pembayaran, Bendahara, Aset, Persediaan, GLP).\n   • Admin: Pengelola administrasi pengguna, pembagian kewenangan user, dan pemeliharaan teknis di tingkat Satker.',
      '5. Kolom JABATAN PERBENDAHARAAN mencantumkan peran pengelolaan keuangan negara yang diampu (KPA, PPK, PPSPM, Bendahara Pengeluaran, Bendahara Penerimaan, Operator Komitmen, Operator Pembayaran, Operator Anggaran, Administrator SAKTI).',
      '6. Asas Pemisahan Kewenangan (Segregation of Duties) wajib dipatuhi. Dilarang merangkap jabatan yang bertentangan (misal: PPK merangkap PPSPM atau Bendahara merangkap PPK/PPSPM).',
      '7. Surat Keputusan yang telah ditandatangani KPA dan dibubuhi cap dinas resmi diunggah melalui formulir elektronik pendaftaran user SAKTI atau disampaikan ke KPPN Semarang I.'
    ];

    instructions.forEach(ins => {
      const insLines = doc.splitTextToSize(ins, contentWidth);
      doc.text(insLines, marginX, curY);
      curY += (insLines.length * 4.3) + 3;
    });
  }

  // Save PDF
  const safeFilename = `SK_User_SAKTI_${draft.kodeSatker}_TA${draft.tahunAnggaran}.pdf`;
  doc.save(safeFilename);
}
