import * as XLSX from 'xlsx';
import { UndanganKonfirmasiKegiatan, KonfirmasiKehadiranRecord, MasterSatker } from '../types';

export interface ExportKonfirmasiExcelParams {
  kegiatan: UndanganKonfirmasiKegiatan;
  konfirmasiList: KonfirmasiKehadiranRecord[];
  invitedSatkers: MasterSatker[];
  belumKonfirmasiSatkers: MasterSatker[];
}

export function exportKonfirmasiKehadiranToExcel({
  kegiatan,
  konfirmasiList,
  invitedSatkers,
  belumKonfirmasiSatkers
}: ExportKonfirmasiExcelParams) {
  const wb = XLSX.utils.book_new();

  // Helper status label
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'HADIR_LANGSUNG': return 'Hadir Langsung (Luring)';
      case 'HADIR_ONLINE': return 'Hadir Online (Daring/Zoom)';
      case 'DIKUASAKAN': return 'Dikuasakan / Mewakili';
      case 'BERHALANGAN': return 'Berhalangan / Tidak Hadir';
      default: return status;
    }
  };

  // 1. DATA SHEET 1: REKAP KEHADIRAN (SUDAH KONFIRMASI)
  const rowsSheet1: any[] = [];

  // Title / Metadata
  rowsSheet1.push({ A: 'KEMENTERIAN KEUANGAN REPUBLIK INDONESIA' });
  rowsSheet1.push({ A: 'DIREKTORAT JENDERAL PERBENDAHARAAN' });
  rowsSheet1.push({ A: 'KPPN SEMARANG I (026)' });
  rowsSheet1.push({ A: '' });
  rowsSheet1.push({ A: 'LAPORAN REKAPITULASI KONFIRMASI KEHADIRAN SATUAN KERJA' });
  rowsSheet1.push({ A: `Kegiatan: ${kegiatan.judulKegiatan}` });
  if (kegiatan.subJudul) rowsSheet1.push({ A: `Sub Tema: ${kegiatan.subJudul}` });
  rowsSheet1.push({ A: `Nomor Surat Undangan: ${kegiatan.nomorSurat}` });
  rowsSheet1.push({ A: `Waktu & Tempat: ${kegiatan.tanggalKegiatan}, ${kegiatan.waktuKegiatan} @ ${kegiatan.lokasiKegiatan}` });
  rowsSheet1.push({ A: `Target Pejabat Wajib: ${kegiatan.targetPejabat.join(', ')}` });
  rowsSheet1.push({ A: `Tipe Pelaksanaan: ${kegiatan.tipePelaksanaan}` });
  rowsSheet1.push({ A: `Waktu Cetak / Unduh: ${new Date().toLocaleString('id-ID')}` });
  rowsSheet1.push({ A: '' });

  // Ringkasan Statistik
  const totalTerundang = invitedSatkers.length;
  const totalSudah = konfirmasiList.length;
  const totalBelum = belumKonfirmasiSatkers.length;
  const hadirLangsung = konfirmasiList.filter(k => k.statusKehadiran === 'HADIR_LANGSUNG').length;
  const hadirOnline = konfirmasiList.filter(k => k.statusKehadiran === 'HADIR_ONLINE').length;
  const dikuasakan = konfirmasiList.filter(k => k.statusKehadiran === 'DIKUASAKAN').length;
  const berhalangan = konfirmasiList.filter(k => k.statusKehadiran === 'BERHALANGAN').length;

  rowsSheet1.push({ A: '--- RINGKASAN MONITORING RSVP ---' });
  rowsSheet1.push({ A: 'Total Satker Terundang', B: totalTerundang });
  rowsSheet1.push({ A: 'Total Pejabat Sudah RSVP', B: `${totalSudah} Pejabat` });
  rowsSheet1.push({ A: 'Satker Belum Lengkap / Belum Konfirmasi', B: `${totalBelum} Satker (${totalTerundang > 0 ? ((totalBelum / totalTerundang) * 100).toFixed(1) : 0}%)` });
  rowsSheet1.push({ A: 'Rincian: Hadir Langsung', B: hadirLangsung });
  rowsSheet1.push({ A: 'Rincian: Hadir Online', B: hadirOnline });
  rowsSheet1.push({ A: 'Rincian: Dikuasakan / Mewakili', B: dikuasakan });
  rowsSheet1.push({ A: 'Rincian: Berhalangan', B: berhalangan });
  rowsSheet1.push({ A: '' });

  // Header Tabel
  rowsSheet1.push({
    A: 'No',
    B: 'Kode Satker',
    C: 'Nama Satuan Kerja',
    D: 'Peran Pejabat Terundang',
    E: 'Status Kehadiran',
    F: 'Nama Peserta',
    G: 'NIP Peserta',
    H: 'Jabatan di Satker',
    I: 'No WhatsApp / HP',
    J: 'Email Peserta',
    K: 'Nama & NIP Pengganti (Jika Dikuasakan)',
    L: 'Alasan (Jika Berhalangan)',
    M: 'Catatan Satker',
    N: 'Waktu RSVP Konfirmasi'
  });

  // Isi Data
  konfirmasiList.forEach((item, idx) => {
    rowsSheet1.push({
      A: idx + 1,
      B: item.kodeSatker,
      C: item.namaSatker,
      D: item.pejabatTarget,
      E: getStatusLabel(item.statusKehadiran),
      F: item.namaPeserta,
      G: item.nipPeserta || '-',
      H: item.jabatanPeserta || '-',
      I: item.noHpWhatsapp || '-',
      J: item.emailPeserta || '-',
      K: item.statusKehadiran === 'DIKUASAKAN'
        ? `${item.namaPengganti || '-'} (NIP: ${item.nipPengganti || '-'} / ${item.jabatanPengganti || '-'})`
        : '-',
      L: item.statusKehadiran === 'BERHALANGAN' ? (item.alasanBerhalangan || '-') : '-',
      M: item.catatan || '-',
      N: item.waktuKonfirmasi ? new Date(item.waktuKonfirmasi).toLocaleString('id-ID') : '-'
    });
  });

  const ws1 = XLSX.utils.json_to_sheet(rowsSheet1, { skipHeader: true });

  // Column widths for sheet 1
  ws1['!cols'] = [
    { wch: 6 },   // No
    { wch: 14 },  // Kode
    { wch: 42 },  // Nama Satker
    { wch: 16 },  // Peran
    { wch: 24 },  // Status
    { wch: 32 },  // Nama Peserta
    { wch: 22 },  // NIP
    { wch: 30 },  // Jabatan
    { wch: 18 },  // WA
    { wch: 28 },  // Email
    { wch: 36 },  // Pengganti
    { wch: 30 },  // Alasan
    { wch: 32 },  // Catatan
    { wch: 22 }   // Waktu
  ];

  XLSX.utils.book_append_sheet(wb, ws1, 'Sudah_Konfirmasi');

  // 2. DATA SHEET 2: DAFTAR SATKER BELUM KONFIRMASI / BELUM LENGKAP
  const rowsSheet2: any[] = [];
  rowsSheet2.push({ A: 'DAFTAR SATKER BELUM KONFIRMASI KEHADIRAN (FOLLOW UP KPPN)' });
  rowsSheet2.push({ A: `Kegiatan: ${kegiatan.judulKegiatan} (${kegiatan.nomorSurat})` });
  rowsSheet2.push({ A: `Batas Waktu Konfirmasi: ${kegiatan.batasWaktuKonfirmasi || 'Sebelum acara dimulai'}` });
  rowsSheet2.push({ A: `Jumlah Satker Belum Lengkap: ${belumKonfirmasiSatkers.length} Satker` });
  rowsSheet2.push({ A: '' });

  rowsSheet2.push({
    A: 'No',
    B: 'Kode Satker',
    C: 'Nama Satuan Kerja',
    D: 'Kementerian / Lembaga',
    E: 'Nama PIC Satker',
    F: 'No HP / WhatsApp PIC',
    G: 'Email PIC',
    H: 'Target Pejabat Wajib Konfirmasi',
    I: 'Pejabat yang Belum Mengisi'
  });

  const confirmedBySatker = new Map<string, string[]>();
  konfirmasiList.forEach(k => {
    const list = confirmedBySatker.get(k.kodeSatker) || [];
    list.push(k.pejabatTarget);
    confirmedBySatker.set(k.kodeSatker, list);
  });

  belumKonfirmasiSatkers.forEach((satker, idx) => {
    const confirmedRoles = confirmedBySatker.get(satker.kodeSatker) || [];
    const missingRoles = kegiatan.targetPejabat.filter(r => !confirmedRoles.includes(r));

    rowsSheet2.push({
      A: idx + 1,
      B: satker.kodeSatker,
      C: satker.namaSatker,
      D: satker.kementerianLembaga || '-',
      E: satker.namaPic || '-',
      F: satker.noHpPic || '-',
      G: satker.emailPic || '-',
      H: kegiatan.targetPejabat.join(', '),
      I: missingRoles.length > 0
        ? `Belum mengisi: ${missingRoles.join(' & ')} ${confirmedRoles.length > 0 ? `(Sudah: ${confirmedRoles.join(', ')})` : ''}`
        : 'Belum Konfirmasi RSVP'
    });
  });

  const ws2 = XLSX.utils.json_to_sheet(rowsSheet2, { skipHeader: true });
  ws2['!cols'] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 42 },
    { wch: 35 },
    { wch: 24 },
    { wch: 20 },
    { wch: 28 },
    { wch: 25 },
    { wch: 35 }
  ];

  XLSX.utils.book_append_sheet(wb, ws2, 'Belum_Konfirmasi');

  // File naming
  const cleanTitle = kegiatan.judulKegiatan.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 35);
  const fileName = `Rekap_Konfirmasi_Kehadiran_${cleanTitle}_KPPN026_${new Date().toISOString().slice(0, 10)}.xlsx`;

  XLSX.writeFile(wb, fileName);
}
