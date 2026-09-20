import * as XLSX from 'xlsx';
import {
  MonitoringLPJRecord,
  LPJUploadBatch,
  LPJBatchSummary,
  LPJStatusType,
  LPJJenisBendahara,
  LPJVerifikasiStatus,
  MasterSatker
} from '../types';

export interface ParseLPJResult {
  batch: LPJUploadBatch;
  records: MonitoringLPJRecord[];
  errors: { row: number; column: string; value: any; message: string }[];
  warnings: string[];
}

/**
 * Helper to safely extract string from worksheet cell
 */
function getCellStr(sheet: XLSX.WorkSheet, colIndex: number, rowIndex: number): string {
  const cellAddress = XLSX.utils.encode_cell({ c: colIndex, r: rowIndex });
  const cell = sheet[cellAddress];
  if (!cell || cell.v === undefined || cell.v === null) return '';
  return String(cell.v).trim();
}

/**
 * Helper to safely extract number from worksheet cell
 */
function getCellNum(sheet: XLSX.WorkSheet, colIndex: number, rowIndex: number): number {
  const str = getCellStr(sheet, colIndex, rowIndex);
  if (!str) return 0;
  const clean = str.replace(/[^0-9.-]+/g, '');
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

/**
 * Format currency IDR
 */
export function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(value);
}

/**
 * Flexible Excel Parser for Monitoring LPJ Bendahara
 */
export function parseMonitoringLPJWorkbook(
  workbook: XLSX.WorkBook,
  fileName: string,
  uploadedBy: string = 'Admin KPPN',
  forcePeriode?: string
): ParseLPJResult {
  const sheetNames = workbook.SheetNames || [];
  if (sheetNames.length === 0) {
    throw new Error('File Excel tidak memiliki sheet yang valid.');
  }

  // Cari sheet target: 'LPJ', 'Data', 'Monitoring LPJ', atau sheet pertama
  const targetSheetName = 
    sheetNames.find(s => s.trim().toLowerCase().includes('lpj')) ||
    sheetNames.find(s => s.trim().toLowerCase() === 'data') ||
    sheetNames[0];

  const sheet = workbook.Sheets[targetSheetName];
  if (!sheet) {
    throw new Error(`Sheet ${targetSheetName} tidak dapat dibuka.`);
  }

  const ref = sheet['!ref'];
  if (!ref) {
    throw new Error('Sheet data kosong.');
  }
  const range = XLSX.utils.decode_range(ref);

  // Cari header baris dengan memeriksa baris 1 s.d. 10
  let headerRow = -1;
  let colMap: Record<string, number> = {};

  for (let r = range.s.r; r <= Math.min(range.s.r + 10, range.e.r); r++) {
    const rowValues: string[] = [];
    for (let c = range.s.c; c <= range.e.c; c++) {
      rowValues.push(getCellStr(sheet, c, r).toLowerCase());
    }

    const hasKodeSatker = rowValues.some(v => v.includes('kode satker') || v.includes('kd satker') || v.includes('kdsatker') || v === 'satker');
    const hasNamaSatker = rowValues.some(v => v.includes('nama satker') || v.includes('nmsatker') || v.includes('nama'));
    const hasStatus = rowValues.some(v => v.includes('status') || v.includes('kirim') || v.includes('lpj'));

    if (hasKodeSatker || (hasNamaSatker && hasStatus)) {
      headerRow = r;
      // Map columns
      for (let c = range.s.c; c <= range.e.c; c++) {
        const val = getCellStr(sheet, c, r).toLowerCase();
        if ((val.includes('no') || val === '#') && !val.includes('kppn') && !val.includes('lpj') && !val.includes('hp')) colMap['no'] = c;
        if (val.includes('kode satker') || val.includes('kd satker') || val.includes('kdsatker')) colMap['kodeSatker'] = c;
        if (val.includes('nama satker') || val.includes('nmsatker') || (val.includes('nama') && !val.includes('bendahara'))) colMap['namaSatker'] = c;
        if (val.includes('kppn')) colMap['kodeKppn'] = c;
        if (val.includes('jenis') || val.includes('tipe') || val.includes('bendahara')) colMap['jenisBendahara'] = c;
        if (val.includes('periode') || val.includes('bulan')) colMap['periode'] = c;
        if (val.includes('status pengiriman') || val.includes('status kirim') || val.includes('pengiriman') || (val.includes('status') && !val.includes('verifikasi'))) colMap['statusPengiriman'] = c;
        if (val.includes('tanggal') || val.includes('tgl kirim') || val.includes('tgl upload')) colMap['tanggalKirim'] = c;
        if (val.includes('no lpj') || val.includes('nomor lpj') || val.includes('dokumen')) colMap['nomorLpj'] = c;
        if (val.includes('verifikasi') || val.includes('status verifikasi')) colMap['statusVerifikasi'] = c;
        if (val.includes('bank') || val.includes('saldo bank')) colMap['saldoBank'] = c;
        if (val.includes('tunai') || val.includes('saldo tunai')) colMap['saldoTunai'] = c;
        if (val.includes('selisih')) colMap['selisihKas'] = c;
        if (val.includes('nama bendahara') || val.includes('pejabat bendahara')) colMap['namaBendahara'] = c;
        if (val.includes('hp') || val.includes('wa') || val.includes('telepon') || val.includes('kontak')) colMap['noHpBendahara'] = c;
        if (val.includes('keterangan') || val.includes('catatan')) colMap['keterangan'] = c;
      }
      break;
    }
  }

  // Fallback defaults jika kolom tidak terdeteksi via nama
  if (colMap['kodeSatker'] === undefined) colMap['kodeSatker'] = 2; // Column C
  if (colMap['namaSatker'] === undefined) colMap['namaSatker'] = 3; // Column D
  if (colMap['statusPengiriman'] === undefined) colMap['statusPengiriman'] = 6;
  if (headerRow === -1) headerRow = 4; // default header row index 4 (baris ke-5)

  const records: MonitoringLPJRecord[] = [];
  const errors: { row: number; column: string; value: any; message: string }[] = [];
  const warnings: string[] = [];

  const uploadId = `LPJ-${Date.now()}`;
  let detectedPeriode = forcePeriode || '';

  for (let r = headerRow + 1; r <= range.e.r; r++) {
    const rawKode = getCellStr(sheet, colMap['kodeSatker'] ?? 2, r);
    const rawNama = getCellStr(sheet, colMap['namaSatker'] ?? 3, r);

    // Skip baris kosong
    if (!rawKode && !rawNama) continue;

    // Bersihkan kode satker (harus 6 digit atau teks relevan)
    const cleanKode = rawKode.replace(/[^0-9]/g, '');
    if (!cleanKode && !rawNama) continue;

    const rowNo = colMap['no'] !== undefined ? getCellStr(sheet, colMap['no'], r) : `${records.length + 1}`;
    const rawKppn = colMap['kodeKppn'] !== undefined ? getCellStr(sheet, colMap['kodeKppn'], r) : '026';
    const rawJenis = colMap['jenisBendahara'] !== undefined ? getCellStr(sheet, colMap['jenisBendahara'], r) : 'Pengeluaran';
    const rawPeriode = colMap['periode'] !== undefined ? getCellStr(sheet, colMap['periode'], r) : (detectedPeriode || 'Agustus 2026');
    if (!detectedPeriode && rawPeriode) detectedPeriode = rawPeriode;

    const rawStatus = colMap['statusPengiriman'] !== undefined ? getCellStr(sheet, colMap['statusPengiriman'], r) : '';
    const rawTglKirim = colMap['tanggalKirim'] !== undefined ? getCellStr(sheet, colMap['tanggalKirim'], r) : '';
    const rawNoLpj = colMap['nomorLpj'] !== undefined ? getCellStr(sheet, colMap['nomorLpj'], r) : '';
    const rawVerif = colMap['statusVerifikasi'] !== undefined ? getCellStr(sheet, colMap['statusVerifikasi'], r) : '';
    const rawSaldoBank = colMap['saldoBank'] !== undefined ? getCellNum(sheet, colMap['saldoBank'], r) : 0;
    const rawSaldoTunai = colMap['saldoTunai'] !== undefined ? getCellNum(sheet, colMap['saldoTunai'], r) : 0;
    const rawSelisih = colMap['selisihKas'] !== undefined ? getCellNum(sheet, colMap['selisihKas'], r) : 0;
    const rawBendahara = colMap['namaBendahara'] !== undefined ? getCellStr(sheet, colMap['namaBendahara'], r) : 'Bendahara Pengeluaran';
    const rawHp = colMap['noHpBendahara'] !== undefined ? getCellStr(sheet, colMap['noHpBendahara'], r) : '';
    const rawKet = colMap['keterangan'] !== undefined ? getCellStr(sheet, colMap['keterangan'], r) : '';

    // Normalisasi Status Pengiriman
    const isSudahKirim = 
      rawStatus.toUpperCase().includes('SUDAH') ||
      rawStatus.toUpperCase().includes('LENGKAP') ||
      rawStatus.toUpperCase().includes('TERKIRIM') ||
      rawStatus.toUpperCase().includes('SELESAI') ||
      Boolean(rawTglKirim && rawTglKirim !== '-');

    const statusPengiriman: LPJStatusType = isSudahKirim ? 'SUDAH_KIRIM' : 'BELUM_KIRIM';

    // Normalisasi Jenis Bendahara
    let jenisBendahara: LPJJenisBendahara = 'PENGELUARAN';
    if (rawJenis.toUpperCase().includes('PENERIMAAN')) {
      jenisBendahara = 'PENERIMAAN';
    } else if (rawJenis.toUpperCase().includes('KEDUANYA') || rawJenis.toUpperCase().includes('SEMUA')) {
      jenisBendahara = 'KEDUANYA';
    }

    // Normalisasi Status Verifikasi
    let statusVerifikasi: LPJVerifikasiStatus = 'BELUM_KIRIM';
    if (statusPengiriman === 'SUDAH_KIRIM') {
      if (rawVerif.toUpperCase().includes('DISETUJUI') || rawVerif.toUpperCase().includes('APPROVED')) {
        statusVerifikasi = 'DISETUJUI';
      } else if (rawVerif.toUpperCase().includes('TOLAK') || rawVerif.toUpperCase().includes('REJECT')) {
        statusVerifikasi = 'DITOLAK';
      } else if (rawVerif.toUpperCase().includes('MENUNGGU') || rawVerif.toUpperCase().includes('PROSES')) {
        statusVerifikasi = 'MENUNGGU_VERIFIKASI';
      } else {
        statusVerifikasi = 'TERVERIFIKASI';
      }
    }

    // Periode bulan & tahun
    let periodeBulan = 'Agustus';
    let tahun = 2026;
    if (rawPeriode.toLowerCase().includes('september')) periodeBulan = 'September';
    else if (rawPeriode.toLowerCase().includes('agustus')) periodeBulan = 'Agustus';
    else if (rawPeriode.toLowerCase().includes('juli')) periodeBulan = 'Juli';
    else if (rawPeriode.toLowerCase().includes('oktober')) periodeBulan = 'Oktober';
    else if (rawPeriode.toLowerCase().includes('november')) periodeBulan = 'November';
    else if (rawPeriode.toLowerCase().includes('desember')) periodeBulan = 'Desember';

    const matchYear = rawPeriode.match(/\b20\d{2}\b/);
    if (matchYear) tahun = parseInt(matchYear[0], 10);

    const periodeFormatted = `${periodeBulan} ${tahun}`;

    const totalSaldoKas = rawSaldoBank + rawSaldoTunai;
    const statusKlopKas = statusPengiriman === 'BELUM_KIRIM' 
      ? 'BELUM_VERIFIKASI' 
      : (rawSelisih === 0 ? 'KLOP' : 'SELISIH');

    const record: MonitoringLPJRecord = {
      id: `${uploadId}-${cleanKode || r}`,
      uploadId,
      no: parseInt(rowNo, 10) || records.length + 1,
      kodeKppn: rawKppn || '026',
      kodeSatker: cleanKode || rawKode,
      namaSatker: rawNama || `Satker ${cleanKode}`,
      jenisBendahara,
      periodeBulan,
      tahun,
      periodeFormatted,
      statusPengiriman,
      tanggalKirim: statusPengiriman === 'SUDAH_KIRIM' ? (rawTglKirim || '08/09/2026') : '-',
      nomorLpj: statusPengiriman === 'SUDAH_KIRIM' ? (rawNoLpj || `LPJ-${periodeBulan.substring(0, 3).toUpperCase()}/${tahun}/${cleanKode}`) : '-',
      statusVerifikasi,
      saldoRekeningBank: rawSaldoBank,
      saldoKasTunai: rawSaldoTunai,
      totalSaldoKas,
      selisihKas: rawSelisih,
      statusKlopKas,
      namaBendahara: rawBendahara,
      noHpBendahara: rawHp || '081234567890',
      keterangan: rawKet || (statusPengiriman === 'SUDAH_KIRIM' ? 'LPJ Lengkap & Klop' : 'Belum mengirimkan LPJ ke KPPN'),
      statusKetepatanWaktu: statusPengiriman === 'SUDAH_KIRIM' ? 'TEPAT_WAKTU' : 'BELUM_KIRIM',
      isLengkapDokumen: statusPengiriman === 'SUDAH_KIRIM',
      batasWaktuPengiriman: `10 ${periodeBulan === 'Agustus' ? 'September' : 'Oktober'} ${tahun}`,
      auditInfo: {
        uploadedAt: new Date().toISOString(),
        uploadedBy
      }
    };

    records.push(record);
  }

  if (records.length === 0) {
    throw new Error('Tidak ditemukan data baris satker yang valid pada file Excel.');
  }

  const sudahKirimCount = records.filter(r => r.statusPengiriman === 'SUDAH_KIRIM').length;
  const belumKirimCount = records.filter(r => r.statusPengiriman === 'BELUM_KIRIM').length;

  const batch: LPJUploadBatch = {
    id: uploadId,
    filename: fileName,
    uploadedAt: new Date().toISOString(),
    uploadedBy,
    periode: detectedPeriode || `${records[0].periodeFormatted}`,
    jumlahData: records.length,
    sudahKirimCount,
    belumKirimCount,
    status: errors.length > 0 ? 'WARNING' : 'SUCCESS',
    notes: `Berhasil memproses ${records.length} satker LPJ (${sudahKirimCount} terkirim, ${belumKirimCount} belum kirim)`
  };

  return {
    batch,
    records,
    errors,
    warnings
  };
}

/**
 * Generate sample LPJ Excel files:
 * 1. Mode 'Agustus 2026': 100% SUDAH KIRIM (lengkap pengiriman)
 * 2. Mode 'September 2026': 100% BELUM KIRIM (belum mengirimkan sama sekali)
 */
export function generateSampleLPJWorkbookBytes(
  periode: 'Agustus 2026' | 'September 2026',
  masterSatkers: MasterSatker[] = []
): Uint8Array {
  const isAgustus = periode.includes('Agustus');
  const wb = XLSX.utils.book_new();

  const headerRows: any[][] = [
    ['MONITORING LAPORAN PERTANGGUNGJAWABAN (LPJ) BENDAHARA'],
    [`KPPN 026 SEMARANG - PERIODE: ${periode.toUpperCase()}`],
    [`Waktu Unduh Data SAKTI: ${new Date().toLocaleString('id-ID')} WIB`],
    [],
    [
      'NO',
      'KODE KPPN',
      'KODE SATKER',
      'NAMA SATKER',
      'JENIS BENDAHARA',
      'PERIODE LPJ',
      'STATUS PENGIRIMAN',
      'TANGGAL KIRIM',
      'NOMOR LPJ',
      'STATUS VERIFIKASI',
      'SALDO BANK (RP)',
      'SALDO TUNAI (RP)',
      'TOTAL SALDO (RP)',
      'SELISIH KAS (RP)',
      'STATUS KLOP',
      'NAMA BENDAHARA',
      'NO HP / WA',
      'KETERANGAN'
    ]
  ];

  // Base list satker: ambil dari masterSatkers jika ada, ditambah satker standar Semarang
  const baseSatkers: { kode: string; nama: string; ba: string; bendahara: string; noHp: string }[] = [];

  if (masterSatkers && masterSatkers.length > 0) {
    masterSatkers.slice(0, 80).forEach((m, idx) => {
      baseSatkers.push({
        kode: m.kodeSatker,
        nama: m.namaSatker,
        ba: m.kodeBa || '015',
        bendahara: `Bendahara ${m.namaSatker.split(' ')[0]}`,
        noHp: m.noHpPic || `0812${Math.floor(10000000 + Math.random() * 90000000)}`
      });
    });
  }

  // Tambahkan daftar instansi utama jika kurang dari 50
  const defaultList = [
    { kode: '890594', nama: 'BPK PERWAKILAN PROVINSI JAWA TENGAH', ba: '004', bendahara: 'Agus Setiawan, S.E.', noHp: '081234567801' },
    { kode: '651046', nama: 'PENGADILAN TINGGI AGAMA SEMARANG', ba: '005', bendahara: 'Siti Rahmawati, A.Md.', noHp: '081398765402' },
    { kode: '527181', nama: 'KEJAKSAAN TINGGI JAWA TENGAH', ba: '006', bendahara: 'Budi Hartono, S.Sos.', noHp: '081523456703' },
    { kode: '411800', nama: 'KANWIL KEMENTERIAN AGAMA PROV. JAWA TENGAH', ba: '025', bendahara: 'H. Ahmad Fauzi, M.Si.', noHp: '082145678904' },
    { kode: '648011', nama: 'POLDA JAWA TENGAH', ba: '060', bendahara: 'Iptu Bambang Suryadi', noHp: '081324567805' },
    { kode: '018022', nama: 'UNIVERSITAS DIPONEGORO', ba: '023', bendahara: 'Dewi Anggraeni, M.Ak.', noHp: '081287654306' },
    { kode: '018035', nama: 'POLITEKNIK NEGERI SEMARANG', ba: '023', bendahara: 'Ir. Hendro Wicaksono', noHp: '085712345607' },
    { kode: '401928', nama: 'BALAI BESAR WILAYAH SUNGAI PEMALI JUANA', ba: '033', bendahara: 'Tri Prasetyo, S.T.', noHp: '081298765408' },
    { kode: '415623', nama: 'RSUP DR. KARIADI SEMARANG', ba: '024', bendahara: 'dr. Ratna Wulandari', noHp: '081345678909' },
    { kode: '422310', nama: 'BBPOM DI SEMARANG', ba: '063', bendahara: 'Nurul Hidayati, S.Si.', noHp: '081567890110' },
    { kode: '445210', nama: 'KANTOR KESEHATAN PELABUHAN KELAS II SEMARANG', ba: '024', bendahara: 'Eko Wahyudi, S.K.M.', noHp: '082123456711' },
    { kode: '488319', nama: 'BALAI KARANTINA HEWAN IKAN DAN TUMBUHAN JAWA TENGAH', ba: '018', bendahara: 'Sri Mulyani, S.P.', noHp: '081234987612' },
    { kode: '499201', nama: 'DISTRIK NAVIGASI KELAS II SEMARANG', ba: '022', bendahara: 'Kapten Joko Susilo', noHp: '081387654313' },
    { kode: '512390', nama: 'KSOP KELAS I TANJUNG EMAS SEMARANG', ba: '022', bendahara: 'M. Rizky Pratama, S.E.', noHp: '085612345614' },
    { kode: '523881', nama: 'BP2IP / PIP SEMARANG', ba: '022', bendahara: 'Wahyu Nugroho, M.Mar.E.', noHp: '081265432115' },
    { kode: '544120', nama: 'STASIUN METEOROLOGI AHMAD YANI SEMARANG', ba: '035', bendahara: 'Anisa Kusuma, S.Tr.', noHp: '081376543216' },
    { kode: '566210', nama: 'PERWAKILAN BKKBN PROVINSI JAWA TENGAH', ba: '068', bendahara: 'Drs. Supriyanto', noHp: '082134567817' },
    { kode: '588902', nama: 'KANTOR IMIGRASI KELAS I KHUSUS TPI SEMARANG', ba: '013', bendahara: 'Farhan Maulana, S.H.', noHp: '081290123418' },
    { kode: '602119', nama: 'LEMBAGA PEMASYARAKATAN KELAS I SEMARANG', ba: '013', bendahara: 'Hadi Gunawan, A.Md.IP.', noHp: '081345123419' },
    { kode: '611290', nama: 'BALAI PEMASYARAKATAN KELAS I SEMARANG', ba: '013', bendahara: 'Yuliana Lestari, S.Psi.', noHp: '085789012320' },
    { kode: '622101', nama: 'PENGADILAN NEGERI SEMARANG', ba: '005', bendahara: 'Rina Oktavia, S.H.', noHp: '081223344521' },
    { kode: '633450', nama: 'KEJAKSAAN NEGERI KOTA SEMARANG', ba: '006', bendahara: 'Danang Prabowo, S.H.', noHp: '081334455622' },
    { kode: '644102', nama: 'POLRESTABES SEMARANG', ba: '060', bendahara: 'Aipda Sigit Wibowo', noHp: '082145566723' },
    { kode: '655890', nama: 'KANTOR PELAYANAN PAJAK PRATAMA SEMARANG BARAT', ba: '015', bendahara: 'Linda Permata, S.E.', noHp: '081256677824' },
    { kode: '666321', nama: 'KANTOR PENGAWASAN DAN PELAYANAN BEA CUKAI TANJUNG EMAS', ba: '015', bendahara: 'Fajar Nugraha, S.S.T.', noHp: '081367788925' },
    { kode: '677219', nama: 'KANTOR PELAYANAN KEKAYAAN NEGARA DAN LELANG SEMARANG', ba: '015', bendahara: 'Maya Safitri, S.E.', noHp: '085678899026' },
    { kode: '688190', nama: 'BADAN PUSAT STATISTIK PROVINSI JAWA TENGAH', ba: '054', bendahara: 'Heru Wicaksono, SST.', noHp: '082189900127' },
    { kode: '699201', nama: 'TVRI STASIUN JAWA TENGAH', ba: '074', bendahara: 'Endang Purwanti, S.Sos.', noHp: '081290011228' },
    { kode: '710329', nama: 'RRI SEMARANG', ba: '074', bendahara: 'Bambang Irawan, S.E.', noHp: '081301122329' },
    { kode: '721450', nama: 'KANTOR PENCARIAN DAN PERTOLONGAN (BASARNAS) SEMARANG', ba: '068', bendahara: 'Agung Laksono, S.E.', noHp: '085712233430' }
  ];

  defaultList.forEach(item => {
    if (!baseSatkers.some(b => b.kode === item.kode)) {
      baseSatkers.push(item);
    }
  });

  const dataRows: any[][] = [];

  baseSatkers.forEach((satker, idx) => {
    const no = idx + 1;
    const kodeKppn = '026';
    const jenisBendahara = idx % 5 === 0 ? 'Penerimaan' : 'Pengeluaran';

    if (isAgustus) {
      // DATA AGUSTUS: LENGKAP PENGIRIMAN (100% SUDAH KIRIM)
      const day = String((idx % 8) + 1).padStart(2, '0');
      const tanggalKirim = `${day}/09/2026`;
      const nomorLpj = `LPJ-08/2026/${satker.kode}`;
      const statusPengiriman = 'SUDAH MENGIRIMKAN';
      const statusVerifikasi = idx % 7 === 0 ? 'Disetujui' : 'Terverifikasi';
      const saldoBank = (idx + 1) * 1250000 + 350000;
      const saldoTunai = idx % 3 === 0 ? 500000 : 0;
      const totalSaldo = saldoBank + saldoTunai;
      const selisihKas = 0; // Selisih 0 = Klop
      const statusKlop = 'KLOP';
      const keterangan = 'LPJ SAKTI Lengkap & Saldo Klop (Diterima KPPN)';

      dataRows.push([
        no,
        kodeKppn,
        satker.kode,
        satker.nama,
        jenisBendahara,
        'Agustus 2026',
        statusPengiriman,
        tanggalKirim,
        nomorLpj,
        statusVerifikasi,
        saldoBank,
        saldoTunai,
        totalSaldo,
        selisihKas,
        statusKlop,
        satker.bendahara,
        satker.noHp,
        keterangan
      ]);
    } else {
      // DATA SEPTEMBER: BELUM MENGIRIMKAN SAMA SEKALI (0% PENGIRIMAN)
      const statusPengiriman = 'BELUM MENGIRIMKAN';
      const tanggalKirim = '-';
      const nomorLpj = '-';
      const statusVerifikasi = 'Belum Kirim';
      const saldoBank = 0;
      const saldoTunai = 0;
      const totalSaldo = 0;
      const selisihKas = 0;
      const statusKlop = 'Belum Verifikasi';
      const keterangan = 'Belum menyampaikan LPJ September 2026 (Menunggu Pengiriman ADK SAKTI)';

      dataRows.push([
        no,
        kodeKppn,
        satker.kode,
        satker.nama,
        jenisBendahara,
        'September 2026',
        statusPengiriman,
        tanggalKirim,
        nomorLpj,
        statusVerifikasi,
        saldoBank,
        saldoTunai,
        totalSaldo,
        selisihKas,
        statusKlop,
        satker.bendahara,
        satker.noHp,
        keterangan
      ]);
    }
  });

  const ws = XLSX.utils.aoa_to_sheet([...headerRows, ...dataRows]);

  // Set column widths
  ws['!cols'] = [
    { wch: 6 },  // NO
    { wch: 12 }, // KPPN
    { wch: 14 }, // KODE
    { wch: 45 }, // NAMA
    { wch: 18 }, // JENIS
    { wch: 16 }, // PERIODE
    { wch: 22 }, // STATUS PENGIRIMAN
    { wch: 16 }, // TGL KIRIM
    { wch: 24 }, // NO LPJ
    { wch: 18 }, // VERIFIKASI
    { wch: 16 }, // SALDO BANK
    { wch: 16 }, // SALDO TUNAI
    { wch: 16 }, // TOTAL SALDO
    { wch: 16 }, // SELISIH
    { wch: 16 }, // STATUS KLOP
    { wch: 26 }, // BENDAHARA
    { wch: 18 }, // NO HP
    { wch: 45 }  // KETERANGAN
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Monitoring LPJ');
  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
}

/**
 * Generate initial combined dataset:
 * Agustus 2026 (100% SUDAH KIRIM) & September 2026 (100% BELUM KIRIM)
 */
export function generateInitialLPJData(masterSatkers: MasterSatker[] = []): {
  records: MonitoringLPJRecord[];
  batches: LPJUploadBatch[];
} {
  // 1. Parse data Agustus
  const agustusBytes = generateSampleLPJWorkbookBytes('Agustus 2026', masterSatkers);
  const wbAgustus = XLSX.read(agustusBytes, { type: 'array' });
  const resultAgustus = parseMonitoringLPJWorkbook(wbAgustus, 'Monitoring_LPJ_Agustus_2026_Lengkap.xlsx', 'Sistem KPPN 026');

  // 2. Parse data September
  const septemberBytes = generateSampleLPJWorkbookBytes('September 2026', masterSatkers);
  const wbSeptember = XLSX.read(septemberBytes, { type: 'array' });
  const resultSeptember = parseMonitoringLPJWorkbook(wbSeptember, 'Monitoring_LPJ_September_2026_Belum_Kirim.xlsx', 'Sistem KPPN 026');

  return {
    records: [...resultAgustus.records, ...resultSeptember.records],
    batches: [resultSeptember.batch, resultAgustus.batch]
  };
}

/**
 * Compute summary statistics for a set of LPJ records
 */
export function computeLPJSummary(records: MonitoringLPJRecord[]): LPJBatchSummary {
  const totalSatker = records.length;
  const sudahKirim = records.filter(r => r.statusPengiriman === 'SUDAH_KIRIM').length;
  const belumKirim = records.filter(r => r.statusPengiriman === 'BELUM_KIRIM').length;
  const persenKepatuhan = totalSatker > 0 ? Math.round((sudahKirim / totalSatker) * 100) : 0;

  const bendaharaPengeluaranCount = records.filter(r => r.jenisBendahara === 'PENGELUARAN').length;
  const bendaharaPenerimaanCount = records.filter(r => r.jenisBendahara === 'PENERIMAAN').length;

  const terverifikasiCount = records.filter(r => r.statusVerifikasi === 'TERVERIFIKASI' || r.statusVerifikasi === 'DISETUJUI').length;
  const menungguVerifikasiCount = records.filter(r => r.statusVerifikasi === 'MENUNGGU_VERIFIKASI').length;
  const belumKirimCount = records.filter(r => r.statusVerifikasi === 'BELUM_KIRIM').length;

  const totalSaldoKas = records.reduce((acc, r) => acc + (r.totalSaldoKas || 0), 0);
  const totalSelisihKas = records.reduce((acc, r) => acc + (r.selisihKas || 0), 0);

  return {
    totalSatker,
    sudahKirim,
    belumKirim,
    persenKepatuhan,
    bendaharaPengeluaranCount,
    bendaharaPenerimaanCount,
    terverifikasiCount,
    menungguVerifikasiCount,
    belumKirimCount,
    totalSaldoKas,
    totalSelisihKas
  };
}
