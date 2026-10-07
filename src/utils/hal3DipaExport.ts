import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MonitoringHal3Item } from '../types/hal3Dipa';

export function exportHal3DipaToExcel(records: MonitoringHal3Item[], filename = 'Monitoring_Hal_III_DIPA_KPPN_Semarang_I.xlsx') {
  const exportData = records.map((item, index) => {
    const tl = item.tindak_lanjut;
    return {
      'No': index + 1,
      'Kode Satker': item.kode_satker,
      'Nama Satker': item.nama_satker || item.nama_satker_source,
      'Tahun Anggaran': item.tahun_anggaran,
      'Periode': item.periode,
      'Status Kanwil': item.status_kanwil,
      'Status Tindak Lanjut': tl?.status_tindak_lanjut || 'Belum Ditindaklanjuti',
      'Keputusan Satker': tl?.keputusan_satker || '-',
      'Alasan Tidak Mengajukan': tl?.alasan_kode || '-',
      'Penjelasan Tambahan': tl?.alasan_detail || '-',
      'Tanggal Konfirmasi': tl?.tanggal_konfirmasi || '-',
      'Nama PIC Satker': tl?.nama_pic || '-',
      'Jabatan PIC': tl?.jabatan_pic || '-',
      'No HP/WA PIC': tl?.no_hp_pic || '-',
      'Media Konfirmasi': tl?.media_konfirmasi || '-',
      'Catatan Internal KPPN': tl?.catatan_kppn || '-',
      'Rencana Tindak Lanjut': tl?.rencana_tindak_lanjut || '-',
      'Tanggal Follow Up': tl?.tanggal_follow_up || '-',
      'Petugas': tl?.petugas_nama || '-',
      'Sumber File Kanwil': item.source_file_name,
      'Status Upload Terkini': item.is_in_latest_upload !== false ? 'Aktif di File Terakhir' : 'Tidak Tercantum di File Terakhir',
      'Update Terakhir': new Date(item.updated_at).toLocaleString('id-ID')
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  // Set lebar kolom otomatis
  worksheet['!cols'] = [
    { wch: 6 },  // No
    { wch: 12 }, // Kode Satker
    { wch: 45 }, // Nama Satker
    { wch: 10 }, // TA
    { wch: 10 }, // Periode
    { wch: 20 }, // Status Kanwil
    { wch: 22 }, // Status Tindak Lanjut
    { wch: 25 }, // Keputusan Satker
    { wch: 40 }, // Alasan
    { wch: 35 }, // Penjelasan
    { wch: 18 }, // Tanggal Konfirmasi
    { wch: 22 }, // PIC
    { wch: 20 }, // Jabatan
    { wch: 16 }, // No WA
    { wch: 16 }, // Media
    { wch: 35 }, // Catatan KPPN
    { wch: 30 }, // Rencana Tindak Lanjut
    { wch: 18 }, // Tanggal Follow Up
    { wch: 22 }, // Petugas
    { wch: 35 }, // Sumber File
    { wch: 25 }, // Status Upload
    { wch: 22 }  // Update Terakhir
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Monitoring Hal III DIPA');
  XLSX.writeFile(workbook, filename);
}

export interface ExportPdfOptions {
  kategoriFilter?: 'ALL' | 'BELUM_MENGAJUKAN' | 'BELUM_DITINDAKLANJUTI' | 'AKAN_MENGAJUKAN' | 'TIDAK_MENGAJUKAN' | 'REKAP_ALASAN';
  tahunAnggaran: number;
  periode: string;
  petugasName?: string;
}

export function exportHal3DipaToPdf(
  records: MonitoringHal3Item[],
  options: ExportPdfOptions
) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const now = new Date();
  const dateFormatted = now.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Filter records berdasarkan opsi
  let filtered = [...records];
  let filterTitle = 'Rekap Seluruh Satuan Kerja';

  if (options.kategoriFilter === 'BELUM_MENGAJUKAN') {
    filtered = filtered.filter(r => r.status_kanwil === 'Belum Mengajukan');
    filterTitle = 'Daftar Satker Belum Mengajukan Revisi Hal III DIPA';
  } else if (options.kategoriFilter === 'BELUM_DITINDAKLANJUTI') {
    filtered = filtered.filter(r => r.status_kanwil === 'Belum Mengajukan' && (!r.tindak_lanjut || r.tindak_lanjut.status_tindak_lanjut === 'Belum Ditindaklanjuti'));
    filterTitle = 'Prioritas: Satker Belum Mengajukan & Belum Ditindaklanjuti KPPN';
  } else if (options.kategoriFilter === 'AKAN_MENGAJUKAN') {
    filtered = filtered.filter(r => r.tindak_lanjut?.keputusan_satker === 'Akan Mengajukan');
    filterTitle = 'Satker Berjanji / Menyatakan Akan Mengajukan Revisi';
  } else if (options.kategoriFilter === 'TIDAK_MENGAJUKAN') {
    filtered = filtered.filter(r => r.tindak_lanjut?.keputusan_satker === 'Tidak Mengajukan' || r.tindak_lanjut?.keputusan_satker === 'Hal III Sudah Sesuai');
    filterTitle = 'Satker Konfirmasi Tidak Mengajukan Revisi Hal III DIPA';
  }

  // Header Formal Kemenkeu
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('KEMENTERIAN KEUANGAN REPUBLIK INDONESIA', doc.internal.pageSize.getWidth() / 2, 12, { align: 'center' });
  doc.setFontSize(10);
  doc.text('DIREKTORAT JENDERAL PERBENDAHARAAN', doc.internal.pageSize.getWidth() / 2, 17, { align: 'center' });
  doc.text('KANTOR PELAYANAN PERBENDAHARAAN NEGARA TIPE A1 SEMARANG I', doc.internal.pageSize.getWidth() / 2, 22, { align: 'center' });

  // Garis pemisah kop
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.8);
  doc.line(14, 25, doc.internal.pageSize.getWidth() - 14, 25);
  doc.setLineWidth(0.2);
  doc.line(14, 26, doc.internal.pageSize.getWidth() - 14, 26);

  // Judul Laporan
  doc.setFontSize(12);
  doc.text('LAPORAN MONITORING REVISI HAL III DIPA KANWIL & TINDAK LANJUT KPPN', doc.internal.pageSize.getWidth() / 2, 33, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Periode: ${options.periode} Tahun Anggaran ${options.tahunAnggaran}  |  Kategori: ${filterTitle}`, doc.internal.pageSize.getWidth() / 2, 38, { align: 'center' });

  // Statistik Ringkasan
  const totalSatker = records.length;
  const sudahMengajukan = records.filter(r => r.status_kanwil === 'Sudah Mengajukan').length;
  const belumMengajukan = records.filter(r => r.status_kanwil === 'Belum Mengajukan').length;
  const sudahDikonfirmasi = records.filter(r => r.tindak_lanjut && r.tindak_lanjut.status_tindak_lanjut !== 'Belum Ditindaklanjuti').length;
  const belumDitindaklanjuti = records.filter(r => r.status_kanwil === 'Belum Mengajukan' && (!r.tindak_lanjut || r.tindak_lanjut.status_tindak_lanjut === 'Belum Ditindaklanjuti')).length;

  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  const summaryText = `Ringkasan: Total ${totalSatker} Satker | Sudah Mengajukan: ${sudahMengajukan} (${((sudahMengajukan / (totalSatker || 1)) * 100).toFixed(1)}%) | Belum Mengajukan: ${belumMengajukan} | Sudah Dikonfirmasi: ${sudahDikonfirmasi} | Perlu Tindak Lanjut: ${belumDitindaklanjuti}`;
  doc.text(summaryText, 14, 44);
  doc.text(`Tanggal Cetak: ${dateFormatted}  |  Total Satker dalam Dokumen: ${filtered.length}`, doc.internal.pageSize.getWidth() - 14, 44, { align: 'right' });

  // Data Tabel
  const tableData = filtered.map((item, idx) => {
    const tl = item.tindak_lanjut;
    const alasanGabung = tl?.alasan_kode 
      ? `${tl.alasan_kode}${tl.alasan_detail ? ` (${tl.alasan_detail})` : ''}`
      : '-';

    return [
      idx + 1,
      item.kode_satker,
      (item.nama_satker || item.nama_satker_source).substring(0, 40),
      item.status_kanwil,
      tl?.status_tindak_lanjut || 'Belum Ditindaklanjuti',
      tl?.keputusan_satker || '-',
      alasanGabung.substring(0, 50),
      tl?.tanggal_konfirmasi || '-',
      tl?.petugas_nama || '-'
    ];
  });

  autoTable(doc, {
    startY: 47,
    head: [[
      'No',
      'Kode',
      'Nama Satker',
      'Status Kanwil',
      'Tindak Lanjut',
      'Keputusan Satker',
      'Alasan / Penjelasan',
      'Tgl Konfirm',
      'Petugas'
    ]],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 1.5,
      textColor: [30, 41, 59],
      overflow: 'linebreak'
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 16, halign: 'center' },
      2: { cellWidth: 58 },
      3: { cellWidth: 26, halign: 'center' },
      4: { cellWidth: 32, halign: 'center' },
      5: { cellWidth: 32, halign: 'center' },
      6: { cellWidth: 55 },
      7: { cellWidth: 18, halign: 'center' },
      8: { cellWidth: 24, halign: 'center' }
    },
    didDrawPage: (data) => {
      // Footer Halaman
      const pageCount = (doc as any).internal.getNumberOfPages();
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Dicetak otomatis oleh ANGKASA KPPN Semarang I - Halaman ${data.pageNumber} dari ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 6,
        { align: 'center' }
      );
    }
  });

  // Simpan PDF
  const safeFilename = `Laporan_Monitoring_Hal_III_DIPA_${options.periode}_TA${options.tahunAnggaran}.pdf`;
  doc.save(safeFilename);
}
