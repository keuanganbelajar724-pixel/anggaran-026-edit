import { AduanSatkerRecord } from '../types';

export const INITIAL_ADUAN_RECORDS: AduanSatkerRecord[] = [
  {
    id: 'adu-202608-001',
    tiketNomor: 'TKT-8921',
    tanggal: '18 Agu 2026, 09:15 WIB',
    createdAt: '2026-08-18T09:15:00.000Z',
    aliasPelapor: 'Bendahara Pengeluaran',
    namaSatker: 'Pengadilan Negeri Semarang',
    kodeSatker: '005012',
    kontakHp: '081229384711',
    emailPelapor: 'bendahara.pn.smg@example.go.id',
    kategori: 'Kendala Teknis SAKTI & Rekonsiliasi',
    judulAduan: 'Selisih Pagu Minus & Konfirmasi Data LPJ Bendahara pada MonSAKTI',
    deskripsi: 'Mohon bantuan dan pendampingan terkait munculnya notifikasi selisih pembukuan pada Modul Bendahara SAKTI saat proses validasi LPJ Bulan Juli 2026, status masih terdapat selisih kas di brankas Rp 125.000,- yang perlu dikonfirmasi.',
    status: 'DIPROSES',
    urgensi: 'PENTING',
    sumber: 'DASHBOARD_FORM',
    catatanAdmin: 'Sedang dikoordinasikan dengan Pembina Seksi MSKI & Verifikasi Akuntansi. Telah dihubungi via WA untuk asistensi remote via AnyDesk.',
    petugasPenyelesai: 'Seksi MSKI KPPN Semarang I',
    riwayatTindakLanjut: [
      {
        id: 'rwy-1',
        waktu: '18 Agu 2026, 09:30 WIB',
        petugas: 'Admin Helpdesk (Seksi MSKI)',
        catatan: 'Tiket diterima dan diteruskan ke petugas pembina satker terkait.',
        statusSebelumnya: 'MENUNGGU',
        statusBaru: 'DIPROSES'
      }
    ]
  },
  {
    id: 'adu-202608-002',
    tiketNomor: 'TKT-8922',
    tanggal: '17 Agu 2026, 14:20 WIB',
    createdAt: '2026-08-17T14:20:00.000Z',
    aliasPelapor: 'Anonim (Operator Komitmen)',
    namaSatker: 'Kemenag Kota Semarang',
    kodeSatker: '417281',
    kontakHp: '081390123456',
    emailPelapor: 'satker417281@kemenag.go.id',
    kategori: 'Permintaan Konsultasi / Pendampingan',
    judulAduan: 'Asistensi Perekaman Data Capaian Output Terindikasi Deviasi Tinggi',
    deskripsi: 'Kami membutuhkan asistensi cara menghitung persentase Progress Capaian Rincian Output (PCRO) pada kegiatan bantuan operasional sekolah agar tidak terjadi anomali gap antara realisasi anggaran dan capaian output.',
    status: 'SELESAI',
    urgensi: 'BIASA',
    sumber: 'DASHBOARD_FORM',
    catatanAdmin: 'Selesai didampingi melalui sesi Zoom asistensi Capaian Output pada 18 Agu 2026. Nilai progres output telah berhasil disesuaikan di SAKTI dan berstatus Terlaporkan 100%.',
    petugasPenyelesai: 'Pembina SAKTI (Seksi MSKI)',
    tanggalSelesai: '18 Agu 2026, 11:00 WIB',
    riwayatTindakLanjut: [
      {
        id: 'rwy-2a',
        waktu: '17 Agu 2026, 15:00 WIB',
        petugas: 'Seksi MSKI',
        catatan: 'Dijadwalkan sesi konsultasi bimbingan teknis daring.',
        statusSebelumnya: 'MENUNGGU',
        statusBaru: 'DIPROSES'
      },
      {
        id: 'rwy-2b',
        waktu: '18 Agu 2026, 11:00 WIB',
        petugas: 'Seksi MSKI',
        catatan: 'Asistensi selesai, permasalahan Satker telah teratasi secara tuntas.',
        statusSebelumnya: 'DIPROSES',
        statusBaru: 'SELESAI'
      }
    ]
  },
  {
    id: 'adu-202608-003',
    tiketNomor: 'TKT-8923',
    tanggal: '19 Agu 2026, 10:45 WIB',
    createdAt: '2026-08-19T10:45:00.000Z',
    aliasPelapor: 'Pelapor Rahasia (Inisial R)',
    namaSatker: 'Anonim / Rahasia',
    kodeSatker: '-',
    kontakHp: '',
    emailPelapor: '',
    kategori: 'Pengaduan Gratifikasi / Imbalan',
    judulAduan: 'Konfirmasi Bebas Biaya Layanan Layanan KPPN Semarang I',
    deskripsi: 'Menyampaikan apresiasi bahwa seluruh proses pencairan SPM dan konsultasi di Front Office KPPN Semarang I berjalan sangat cepat, ramah, dan 100% tanpa dipungut biaya apapun (Rp 0,-). Mohon standar pelayanan WBBM ini tetap dipertahankan.',
    status: 'SELESAI',
    urgensi: 'BIASA',
    sumber: 'DASHBOARD_FORM',
    catatanAdmin: 'Laporan apresiasi telah dicatat dalam register Pemantauan Pengendalian Gratifikasi (PPG) dan Indeks Kepuasan Masyarakat (IKM) Seksi Kepatuhan Internal KPPN Semarang I.',
    petugasPenyelesai: 'Seksi Kepatuhan Internal',
    tanggalSelesai: '19 Agu 2026, 13:00 WIB',
    riwayatTindakLanjut: [
      {
        id: 'rwy-3',
        waktu: '19 Agu 2026, 13:00 WIB',
        petugas: 'Seksi Kepatuhan Internal',
        catatan: 'Apresiasi diverifikasi dan direkam ke sistem monev integritas WBBM.',
        statusSebelumnya: 'MENUNGGU',
        statusBaru: 'SELESAI'
      }
    ]
  }
];
