import { DigipayRecord, DigipaySatkerSummary } from '../types';
import { parseDateToTimestamp } from '../utils/modularExcelProcessors';

/**
 * Initial records for Digipay across multiple months (Januari s.d. Agustus 2026)
 */
export const INITIAL_DIGIPAY_RECORDS: DigipayRecord[] = [
  // ==========================================
  // PERIODE: AGUSTUS 2026
  // ==========================================
  {
    id: 'dgp-agu-001',
    kodeSatker: '643340',
    namaSatker: 'PUSDIKBINMAS LEMDIKLAT POLRI',
    kementerianLembaga: 'KEPOLISIAN NEGARA REPUBLIK INDONESIA',
    tipePembayaran: 'VA',
    noTransaksi: 'DGP-202608-0192',
    tglTransaksi: '18-08-2026',
    namaVendor: 'CV Berkah Alat Tulis Kantor Semarang',
    namaBank: 'Bank Rakyat Indonesia (BRI)',
    nominalTransaksi: 12500000,
    statusTransaksi: 'Selesai',
    uraianBarang: 'Pengadaan Kertas A4, Toner Printer & ATK Pelatihan Siswa',
    periode: 'Agustus 2026',
    tahun: 2026
  },
  {
    id: 'dgp-agu-002',
    kodeSatker: '643340',
    namaSatker: 'PUSDIKBINMAS LEMDIKLAT POLRI',
    kementerianLembaga: 'KEPOLISIAN NEGARA REPUBLIK INDONESIA',
    tipePembayaran: 'KKP',
    noTransaksi: 'DGP-202608-0245',
    tglTransaksi: '15-08-2026',
    namaVendor: 'PT Sinar Maju Komputer Semarang',
    namaBank: 'Bank Rakyat Indonesia (BRI)',
    nominalTransaksi: 24750000,
    statusTransaksi: 'Selesai',
    uraianBarang: 'Pembelian Scanner & Perlengkapan Multimedia Kelas',
    periode: 'Agustus 2026',
    tahun: 2026
  },
  {
    id: 'dgp-agu-003',
    kodeSatker: '651046',
    namaSatker: 'POLRESTABES SEMARANG',
    kementerianLembaga: 'KEPOLISIAN NEGARA REPUBLIK INDONESIA',
    tipePembayaran: 'KKP',
    noTransaksi: 'DGP-202608-0312',
    tglTransaksi: '16-08-2026',
    namaVendor: 'UD Jaya Makmur Ban & Suku Cadang',
    namaBank: 'Bank Rakyat Indonesia (BRI)',
    nominalTransaksi: 18900000,
    statusTransaksi: 'Selesai',
    uraianBarang: 'Pemeliharaan dan Penggantian Ban Kendaraan Patroli Sabhara',
    periode: 'Agustus 2026',
    tahun: 2026
  },
  {
    id: 'dgp-agu-004',
    kodeSatker: '651046',
    namaSatker: 'POLRESTABES SEMARANG',
    kementerianLembaga: 'KEPOLISIAN NEGARA REPUBLIK INDONESIA',
    tipePembayaran: 'VA',
    noTransaksi: 'DGP-202608-0388',
    tglTransaksi: '12-08-2026',
    namaVendor: 'Catering Bu Nur Asri',
    namaBank: 'Bank Mandiri',
    nominalTransaksi: 8650000,
    statusTransaksi: 'Selesai',
    uraianBarang: 'Penyediaan Konsumsi Rapat Koordinasi Lintas Sektoral Operasi Candi',
    periode: 'Agustus 2026',
    tahun: 2026
  },
  {
    id: 'dgp-agu-005',
    kodeSatker: '417315',
    namaSatker: 'BALAI BESAR WILAYAH SUNGAI PEMALI JUANA',
    kementerianLembaga: 'KEMENTERIAN PEKERJAAN UMUM DAN PERUMAHAN RAKYAT',
    tipePembayaran: 'VA',
    noTransaksi: 'DGP-202608-0410',
    tglTransaksi: '14-08-2026',
    namaVendor: 'CV Mandiri Perkasa Teknik',
    namaBank: 'Bank Mandiri',
    nominalTransaksi: 32400000,
    statusTransaksi: 'Selesai',
    uraianBarang: 'Pengadaan Sparepart Pompa Air Hidrologi & Alat Ukur Debit',
    periode: 'Agustus 2026',
    tahun: 2026
  },

  // ==========================================
  // PERIODE: JULI 2026
  // ==========================================
  {
    id: 'dgp-jul-001',
    kodeSatker: '643340',
    namaSatker: 'PUSDIKBINMAS LEMDIKLAT POLRI',
    kementerianLembaga: 'KEPOLISIAN NEGARA REPUBLIK INDONESIA',
    tipePembayaran: 'VA',
    noTransaksi: 'DGP-202607-0112',
    tglTransaksi: '20-07-2026',
    namaVendor: 'CV Berkah Alat Tulis Kantor Semarang',
    namaBank: 'Bank Rakyat Indonesia (BRI)',
    nominalTransaksi: 11200000,
    statusTransaksi: 'Selesai',
    uraianBarang: 'Kertas HVS & ATK Ujian Kejuruan Siswa',
    periode: 'Juli 2026',
    tahun: 2026
  },
  {
    id: 'dgp-jul-002',
    kodeSatker: '651046',
    namaSatker: 'POLRESTABES SEMARANG',
    kementerianLembaga: 'KEPOLISIAN NEGARA REPUBLIK INDONESIA',
    tipePembayaran: 'KKP',
    noTransaksi: 'DGP-202607-0230',
    tglTransaksi: '18-07-2026',
    namaVendor: 'PT Sinar Maju Komputer Semarang',
    namaBank: 'Bank Rakyat Indonesia (BRI)',
    nominalTransaksi: 15400000,
    statusTransaksi: 'Selesai',
    uraianBarang: 'Perangkat Jaringan Wifi & Aksesoris Command Center',
    periode: 'Juli 2026',
    tahun: 2026
  },
  {
    id: 'dgp-jul-003',
    kodeSatker: '411821',
    namaSatker: 'KANWIL DJKN JAWA TENGAH DAN D.I. YOGYAKARTA',
    kementerianLembaga: 'KEMENTERIAN KEUANGAN',
    tipePembayaran: 'VA',
    noTransaksi: 'DGP-202607-0345',
    tglTransaksi: '15-07-2026',
    namaVendor: 'Catering Bu Nur Asri',
    namaBank: 'Bank Mandiri',
    nominalTransaksi: 6800000,
    statusTransaksi: 'Selesai',
    uraianBarang: 'Konsumsi Sosialisasi Pengelolaan BMN Satker K/L',
    periode: 'Juli 2026',
    tahun: 2026
  },

  // ==========================================
  // PERIODE: JUNI 2026
  // ==========================================
  {
    id: 'dgp-jun-001',
    kodeSatker: '643340',
    namaSatker: 'PUSDIKBINMAS LEMDIKLAT POLRI',
    kementerianLembaga: 'KEPOLISIAN NEGARA REPUBLIK INDONESIA',
    tipePembayaran: 'KKP',
    noTransaksi: 'DGP-202606-0098',
    tglTransaksi: '22-06-2026',
    namaVendor: 'PT Sinar Maju Komputer Semarang',
    namaBank: 'Bank Rakyat Indonesia (BRI)',
    nominalTransaksi: 19500000,
    statusTransaksi: 'Selesai',
    uraianBarang: 'Pengadaan Harddisk Eksternal & Router Pelatihan',
    periode: 'Juni 2026',
    tahun: 2026
  },
  {
    id: 'dgp-jun-002',
    kodeSatker: '417315',
    namaSatker: 'BALAI BESAR WILAYAH SUNGAI PEMALI JUANA',
    kementerianLembaga: 'KEMENTERIAN PEKERJAAN UMUM DAN PERUMAHAN RAKYAT',
    tipePembayaran: 'VA',
    noTransaksi: 'DGP-202606-0177',
    tglTransaksi: '18-06-2026',
    namaVendor: 'CV Mandiri Perkasa Teknik',
    namaBank: 'Bank Mandiri',
    nominalTransaksi: 22000000,
    statusTransaksi: 'Selesai',
    uraianBarang: 'Perbaikan Sistem Otomasi Bendung Wilayah Semarang',
    periode: 'Juni 2026',
    tahun: 2026
  },

  // ==========================================
  // PERIODE: MEI 2026
  // ==========================================
  {
    id: 'dgp-mei-001',
    kodeSatker: '651046',
    namaSatker: 'POLRESTABES SEMARANG',
    kementerianLembaga: 'KEPOLISIAN NEGARA REPUBLIK INDONESIA',
    tipePembayaran: 'VA',
    noTransaksi: 'DGP-202605-0078',
    tglTransaksi: '20-05-2026',
    namaVendor: 'CV Berkah Alat Tulis Kantor Semarang',
    namaBank: 'Bank Rakyat Indonesia (BRI)',
    nominalTransaksi: 9400000,
    statusTransaksi: 'Selesai',
    uraianBarang: 'Kertas Blangko Laporan & Form Pelayanan SIM',
    periode: 'Mei 2026',
    tahun: 2026
  },
  {
    id: 'dgp-mei-002',
    kodeSatker: '692164',
    namaSatker: 'RUTAN KELAS II B SALATIGA',
    kementerianLembaga: 'KEMENTERIAN HUKUM DAN HAK ASASI MANUSIA',
    tipePembayaran: 'KKP',
    noTransaksi: 'DGP-202605-0144',
    tglTransaksi: '15-05-2026',
    namaVendor: 'UD Berkah Abadi Perlengkapan',
    namaBank: 'Bank Rakyat Indonesia (BRI)',
    nominalTransaksi: 7800000,
    statusTransaksi: 'Selesai',
    uraianBarang: 'Perlengkapan Kebersihan Blok & Fasilitas Hunian WBP',
    periode: 'Mei 2026',
    tahun: 2026
  },

  // ==========================================
  // PERIODE: APRIL 2026
  // ==========================================
  {
    id: 'dgp-apr-001',
    kodeSatker: '643340',
    namaSatker: 'PUSDIKBINMAS LEMDIKLAT POLRI',
    kementerianLembaga: 'KEPOLISIAN NEGARA REPUBLIK INDONESIA',
    tipePembayaran: 'VA',
    noTransaksi: 'DGP-202604-0056',
    tglTransaksi: '24-04-2026',
    namaVendor: 'Catering Bu Nur Asri',
    namaBank: 'Bank Rakyat Indonesia (BRI)',
    nominalTransaksi: 14500000,
    statusTransaksi: 'Selesai',
    uraianBarang: 'Konsumsi Buka Puasa Bersama & Kegiatan Keagamaan Siswa',
    periode: 'April 2026',
    tahun: 2026
  },
  {
    id: 'dgp-apr-002',
    kodeSatker: '411821',
    namaSatker: 'KANWIL DJKN JAWA TENGAH DAN D.I. YOGYAKARTA',
    kementerianLembaga: 'KEMENTERIAN KEUANGAN',
    tipePembayaran: 'KKP',
    noTransaksi: 'DGP-202604-0110',
    tglTransaksi: '18-04-2026',
    namaVendor: 'PT Sinar Maju Komputer Semarang',
    namaBank: 'Bank Mandiri',
    nominalTransaksi: 12800000,
    statusTransaksi: 'Selesai',
    uraianBarang: 'Cartridge Toner Printer Warna & Pita Label BMN',
    periode: 'April 2026',
    tahun: 2026
  },

  // ==========================================
  // PERIODE: MARET 2026
  // ==========================================
  {
    id: 'dgp-mar-001',
    kodeSatker: '651046',
    namaSatker: 'POLRESTABES SEMARANG',
    kementerianLembaga: 'KEPOLISIAN NEGARA REPUBLIK INDONESIA',
    tipePembayaran: 'KKP',
    noTransaksi: 'DGP-202603-0045',
    tglTransaksi: '22-03-2026',
    namaVendor: 'UD Jaya Makmur Ban & Suku Cadang',
    namaBank: 'Bank Rakyat Indonesia (BRI)',
    nominalTransaksi: 14200000,
    statusTransaksi: 'Selesai',
    uraianBarang: 'Ganti Oli & Filter Mesin Mobil Patroli Lalulintas',
    periode: 'Maret 2026',
    tahun: 2026
  },
  {
    id: 'dgp-mar-002',
    kodeSatker: '417315',
    namaSatker: 'BALAI BESAR WILAYAH SUNGAI PEMALI JUANA',
    kementerianLembaga: 'KEMENTERIAN PEKERJAAN UMUM DAN PERUMAHAN RAKYAT',
    tipePembayaran: 'VA',
    noTransaksi: 'DGP-202603-0091',
    tglTransaksi: '15-03-2026',
    namaVendor: 'CV Berkah Alat Tulis Kantor Semarang',
    namaBank: 'Bank Mandiri',
    nominalTransaksi: 8300000,
    statusTransaksi: 'Selesai',
    uraianBarang: 'Kertas Gambar Kalkir & Tinta Plotter Perencanaan',
    periode: 'Maret 2026',
    tahun: 2026
  },

  // ==========================================
  // PERIODE: FEBRUARI 2026
  // ==========================================
  {
    id: 'dgp-feb-001',
    kodeSatker: '643340',
    namaSatker: 'PUSDIKBINMAS LEMDIKLAT POLRI',
    kementerianLembaga: 'KEPOLISIAN NEGARA REPUBLIK INDONESIA',
    tipePembayaran: 'VA',
    noTransaksi: 'DGP-202602-0032',
    tglTransaksi: '20-02-2026',
    namaVendor: 'CV Berkah Alat Tulis Kantor Semarang',
    namaBank: 'Bank Rakyat Indonesia (BRI)',
    nominalTransaksi: 10400000,
    statusTransaksi: 'Selesai',
    uraianBarang: 'Pengadaan Modul Pembelajaran & Alat Tulis Kelas',
    periode: 'Februari 2026',
    tahun: 2026
  },
  {
    id: 'dgp-feb-002',
    kodeSatker: '692164',
    namaSatker: 'RUTAN KELAS II B SALATIGA',
    kementerianLembaga: 'KEMENTERIAN HUKUM DAN HAK ASASI MANUSIA',
    tipePembayaran: 'KKP',
    noTransaksi: 'DGP-202602-0078',
    tglTransaksi: '16-02-2026',
    namaVendor: 'UD Berkah Abadi Perlengkapan',
    namaBank: 'Bank Rakyat Indonesia (BRI)',
    nominalTransaksi: 6200000,
    statusTransaksi: 'Selesai',
    uraianBarang: 'Pengadaan Lampu LED & Kelistrikan Pos Jaga Rutan',
    periode: 'Februari 2026',
    tahun: 2026
  },

  // ==========================================
  // PERIODE: JANUARI 2026
  // ==========================================
  {
    id: 'dgp-jan-001',
    kodeSatker: '411821',
    namaSatker: 'KANWIL DJKN JAWA TENGAH DAN D.I. YOGYAKARTA',
    kementerianLembaga: 'KEMENTERIAN KEUANGAN',
    tipePembayaran: 'VA',
    noTransaksi: 'DGP-202601-0012',
    tglTransaksi: '19-01-2026',
    namaVendor: 'CV Berkah Alat Tulis Kantor Semarang',
    namaBank: 'Bank Mandiri',
    nominalTransaksi: 8500000,
    statusTransaksi: 'Selesai',
    uraianBarang: 'Pengadaan Kertas Kerja & ATK Awal Tahun Anggaran 2026',
    periode: 'Januari 2026',
    tahun: 2026
  },
  {
    id: 'dgp-jan-002',
    kodeSatker: '692164',
    namaSatker: 'RUTAN KELAS II B SALATIGA',
    kementerianLembaga: 'KEMENTERIAN HUKUM DAN HAK ASASI MANUSIA',
    tipePembayaran: 'KKP',
    noTransaksi: 'DGP-202601-0025',
    tglTransaksi: '21-01-2026',
    namaVendor: 'UD Berkah Abadi Perlengkapan',
    namaBank: 'Bank Rakyat Indonesia (BRI)',
    nominalTransaksi: 5400000,
    statusTransaksi: 'Selesai',
    uraianBarang: 'Pengadaan Perlengkapan Medis Dasar Poliklinik Rutan',
    periode: 'Januari 2026',
    tahun: 2026
  },
  {
    id: 'dgp-jan-003',
    kodeSatker: '694391',
    namaSatker: 'BALAI PELAKSANA PEMILIHAN JASA KONSTRUKSI WILAYAH JAWA TENGAH',
    kementerianLembaga: 'KEMENTERIAN PEKERJAAN UMUM DAN PERUMAHAN RAKYAT',
    tipePembayaran: 'VA',
    noTransaksi: 'DGP-202601-0038',
    tglTransaksi: '26-01-2026',
    namaVendor: 'PT Sinar Maju Komputer Semarang',
    namaBank: 'Bank Mandiri',
    nominalTransaksi: 12500000,
    statusTransaksi: 'Selesai',
    uraianBarang: 'Perawatan Server & Jaringan Seleksi Tender LPSE',
    periode: 'Januari 2026',
    tahun: 2026
  },
  {
    id: 'dgp-jan-004',
    kodeSatker: '692167',
    namaSatker: 'LAPAS KELAS II A AMBARAWA',
    kementerianLembaga: 'KEMENTERIAN HUKUM DAN HAK ASASI MANUSIA',
    tipePembayaran: 'KKP',
    noTransaksi: 'DGP-202601-0049',
    tglTransaksi: '26-01-2026',
    namaVendor: 'Catering Bu Nur Asri',
    namaBank: 'Bank Rakyat Indonesia (BRI)',
    nominalTransaksi: 9800000,
    statusTransaksi: 'Selesai',
    uraianBarang: 'Konsumsi Rapat Koordinasi Pembinaan Warga Binaan',
    periode: 'Januari 2026',
    tahun: 2026
  },
  {
    id: 'dgp-jan-005',
    kodeSatker: '409546',
    namaSatker: 'KPP PRATAMA SALATIGA',
    kementerianLembaga: 'KEMENTERIAN KEUANGAN',
    tipePembayaran: 'VA',
    noTransaksi: 'DGP-202601-0058',
    tglTransaksi: '27-01-2026',
    namaVendor: 'CV Berkah Alat Tulis Kantor Semarang',
    namaBank: 'Bank Mandiri',
    nominalTransaksi: 7600000,
    statusTransaksi: 'Selesai',
    uraianBarang: 'Banner & Spanduk Sosialisasi Pelaporan SPT Tahunan 2026',
    periode: 'Januari 2026',
    tahun: 2026
  },
  {
    id: 'dgp-jan-006',
    kodeSatker: '643340',
    namaSatker: 'PUSDIKBINMAS LEMDIKLAT POLRI',
    kementerianLembaga: 'KEPOLISIAN NEGARA REPUBLIK INDONESIA',
    tipePembayaran: 'KKP',
    noTransaksi: 'DGP-202601-0064',
    tglTransaksi: '28-01-2026',
    namaVendor: 'PT Sinar Maju Komputer Semarang',
    namaBank: 'Bank Rakyat Indonesia (BRI)',
    nominalTransaksi: 16800000,
    statusTransaksi: 'Selesai',
    uraianBarang: 'Peralatan Jaringan Komputer Laboratorium Siswa',
    periode: 'Januari 2026',
    tahun: 2026
  },
  {
    id: 'dgp-jan-007',
    kodeSatker: '651046',
    namaSatker: 'POLRESTABES SEMARANG',
    kementerianLembaga: 'KEPOLISIAN NEGARA REPUBLIK INDONESIA',
    tipePembayaran: 'VA',
    noTransaksi: 'DGP-202601-0072',
    tglTransaksi: '29-01-2026',
    namaVendor: 'CV Mandiri Perkasa Teknik',
    namaBank: 'Bank Rakyat Indonesia (BRI)',
    nominalTransaksi: 11400000,
    statusTransaksi: 'Selesai',
    uraianBarang: 'Pemeliharaan Genset & Instalasi Daya SPKT',
    periode: 'Januari 2026',
    tahun: 2026
  }
];

/**
 * Aggregate Digipay records into satker summaries
 */
export function aggregateDigipayRecords(records: DigipayRecord[]): DigipaySatkerSummary[] {
  const satkerMap = new Map<string, {
    kodeSatker: string;
    namaSatker: string;
    kementerianLembaga: string;
    totalTransaksiVA: number;
    totalNominalVA: number;
    totalTransaksiKKP: number;
    totalNominalKKP: number;
    banks: Record<string, number>;
    vendors: Record<string, number>;
    latestDate: string;
  }>();

  records.forEach(r => {
    const k = r.kodeSatker;
    if (!satkerMap.has(k)) {
      satkerMap.set(k, {
        kodeSatker: r.kodeSatker,
        namaSatker: r.namaSatker,
        kementerianLembaga: r.kementerianLembaga || 'Kementerian / Lembaga Mitra',
        totalTransaksiVA: 0,
        totalNominalVA: 0,
        totalTransaksiKKP: 0,
        totalNominalKKP: 0,
        banks: {},
        vendors: {},
        latestDate: r.tglTransaksi || ''
      });
    }

    const item = satkerMap.get(k)!;
    const nominal = Number(r.nominalTransaksi) || 0;

    if (r.tipePembayaran === 'VA') {
      item.totalTransaksiVA += 1;
      item.totalNominalVA += nominal;
    } else if (r.tipePembayaran === 'KKP') {
      item.totalTransaksiKKP += 1;
      item.totalNominalKKP += nominal;
    }

    if (r.namaBank) {
      item.banks[r.namaBank] = (item.banks[r.namaBank] || 0) + 1;
    }
    if (r.namaVendor) {
      item.vendors[r.namaVendor] = (item.vendors[r.namaVendor] || 0) + 1;
    }

    if (r.tglTransaksi && r.tglTransaksi !== '-') {
      const curTime = parseDateToTimestamp(r.tglTransaksi);
      const prevTime = parseDateToTimestamp(item.latestDate || '');
      if (curTime >= prevTime) {
        item.latestDate = r.tglTransaksi;
      }
    }
  });

  const summaries: DigipaySatkerSummary[] = Array.from(satkerMap.values()).map(item => {
    const totalSemuaTransaksi = item.totalTransaksiVA + item.totalTransaksiKKP;
    const totalSemuaNominal = item.totalNominalVA + item.totalNominalKKP;

    // Get dominant bank
    let bankTerbanyak = '';
    let maxBankCount = 0;
    Object.entries(item.banks).forEach(([b, cnt]) => {
      if (cnt > maxBankCount) {
        maxBankCount = cnt;
        bankTerbanyak = b;
      }
    });

    // Get dominant vendor
    let vendorTerbanyak = '';
    let maxVendorCount = 0;
    Object.entries(item.vendors).forEach(([v, cnt]) => {
      if (cnt > maxVendorCount) {
        maxVendorCount = cnt;
        vendorTerbanyak = v;
      }
    });

    let statusKeaktifan: DigipaySatkerSummary['statusKeaktifan'] = 'Belum Ada Transaksi';
    if (totalSemuaTransaksi >= 4) {
      statusKeaktifan = 'Sangat Aktif';
    } else if (totalSemuaTransaksi >= 2) {
      statusKeaktifan = 'Aktif';
    } else if (totalSemuaTransaksi > 0) {
      statusKeaktifan = 'Perlu Akselerasi';
    }

    return {
      kodeSatker: item.kodeSatker,
      namaSatker: item.namaSatker,
      kementerianLembaga: item.kementerianLembaga,
      totalTransaksiVA: item.totalTransaksiVA,
      totalNominalVA: item.totalNominalVA,
      totalTransaksiKKP: item.totalTransaksiKKP,
      totalNominalKKP: item.totalNominalKKP,
      totalSemuaTransaksi,
      totalSemuaNominal,
      bankTerbanyak,
      vendorTerbanyak,
      tglTransaksiTerakhir: item.latestDate,
      statusKeaktifan
    };
  });

  // Sort by count for rank
  const sortedByCount = [...summaries].sort((a, b) => b.totalSemuaTransaksi - a.totalSemuaTransaksi || b.totalSemuaNominal - a.totalSemuaNominal);
  sortedByCount.forEach((s, idx) => {
    s.rankByCount = idx + 1;
  });

  // Sort by nominal for rank
  const sortedByNominal = [...summaries].sort((a, b) => b.totalSemuaNominal - a.totalSemuaNominal || b.totalSemuaTransaksi - a.totalSemuaTransaksi);
  sortedByNominal.forEach((s, idx) => {
    s.rankByNominal = idx + 1;
  });

  return sortedByCount;
}

export const INITIAL_DIGIPAY_DATA = INITIAL_DIGIPAY_RECORDS;
