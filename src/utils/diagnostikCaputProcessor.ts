import * as XLSX from 'xlsx';
import { DiagnostikCaputROItem, DiagnostikCaputResult, DiagnostikCaputSatkerSummary, SaktiReferensiItem } from '../types';

/**
 * 9 Kode Referensi Keterangan Resmi SAKTI (Sesuai Juknis SAKTI Ver 3.2 Tahun 2026 - Hal 27-31)
 */
export const SAKTI_REFERENSI_LIST: SaktiReferensiItem[] = [
  {
    kode: '01',
    judul: 'Adanya efisiensi anggaran',
    kategoriAnomali: 'Capaian Kinerja Terlalu Tinggi',
    deskripsiJuknis: 'Tercapainya output dengan jumlah input (anggaran) yang lebih sedikit. Realisasi anggaran tidak mencapai 100% dari alokasi pagu DIPA, namun output tercapai optimal sesuai target.',
    kondisiPemicu: 'GAP (PCRO - PPA) > 20% (atau > 5% untuk RO PN) dengan efisiensi biaya pelaksanaan.'
  },
  {
    kode: '02',
    judul: 'Kegiatan sudah dilaksanakan, namun pertanggungjawaban keuangan belum dilakukan/masih dalam proses',
    kategoriAnomali: 'Capaian Kinerja Terlalu Tinggi',
    deskripsiJuknis: 'Aktivitas atau tahapan fisik pekerjaan telah terlaksana dan diakui sebagai progres, namun berkas SPJ/pembayaran SP2D masih dalam proses administrasi pengujian/pengajuan.',
    kondisiPemicu: 'GAP (PCRO - PPA) > 20% karena fisik mendahului pencairan keuangan.'
  },
  {
    kode: '03',
    judul: 'Alokasi Anggaran terlalu besar/melebihi kebutuhan',
    kategoriAnomali: 'Capaian Kinerja Terlalu Tinggi',
    deskripsiJuknis: 'Alokasi anggaran yang ditetapkan pada DIPA awal lebih besar dari kebutuhan riil di lapangan, sehingga output selesai 100% dengan sisa anggaran belanja.',
    kondisiPemicu: 'GAP (PCRO - PPA) > 20% akibat estimasi biaya awal berlebih.'
  },
  {
    kode: '04',
    judul: 'Tidak/belum dilakukan revisi penyesuaian target output',
    kategoriAnomali: 'Capaian Kinerja Terlalu Tinggi',
    deskripsiJuknis: 'Terdapat perubahan target atau jadwal pelaksanaan kegiatan di lapangan yang belum disesuaikan melalui proses revisi DIPA/POK pada sistem informasi.',
    kondisiPemicu: 'Terjadi pergeseran target output atau jadwal kegiatan yang belum direvisi.'
  },
  {
    kode: '05',
    judul: 'Penilaian Progress Output dilakukan secara periodik. Saat ini belum dilakukan penilaian output',
    kategoriAnomali: 'Capaian Kinerja Terlalu Rendah',
    deskripsiJuknis: 'Pengumpulan data atau penilaian fisik dilakukan pada periode tertentu (misal akhir triwulan/semester), sedangkan serapan anggaran operasional sudah berjalan rutin.',
    kondisiPemicu: 'GAP (PCRO - PPA) < -20% (atau < -5% untuk RO PN) karena penilaian fisik belum cut-off.'
  },
  {
    kode: '06',
    judul: 'Adanya Pembayaran Uang Muka Pekerjaan, sementara pekerjaan belum/baru dilakukan',
    kategoriAnomali: 'Capaian Kinerja Terlalu Rendah',
    deskripsiJuknis: 'Telah dilakukan pencairan uang muka kontrak (termin awal), namun tahapan pekerjaan fisik oleh penyedia baru dimulai atau dalam mobilisasi.',
    kondisiPemicu: 'GAP (PCRO - PPA) < -20% akibat pencairan uang muka kontrak.'
  },
  {
    kode: '07',
    judul: 'Output telah tercapai, hanya menunggu finalisasi laporan/serah terima',
    kategoriAnomali: 'Anomali Kuantitatif Lainnya',
    deskripsiJuknis: 'Pekerjaan fisik telah selesai 100% (PCRO 100%), namun Berita Acara Serah Terima (BAST) atau laporan akhir administratif masih dalam proses penandatanganan/verifikasi.',
    kondisiPemicu: 'PCRO = 100% namun RVRO masih 0 atau kurang dari target DIPA.'
  },
  {
    kode: '08',
    judul: 'Adanya pembayaran untuk tunggakan/tagihan tahun lalu',
    kategoriAnomali: 'Capaian Kinerja Terlalu Rendah',
    deskripsiJuknis: 'Terjadi realisasi penyerapan anggaran untuk pelunasan tagihan/tunggakan pekerjaan tahun anggaran sebelumnya, tanpa menambah progres fisik output tahun berjalan.',
    kondisiPemicu: 'GAP (PCRO - PPA) < -20% akibat pembayaran tunggakan belanja tahun lalu.'
  },
  {
    kode: '99',
    judul: 'Lainnya (⚠️ DIHINDARI - Prioritaskan Kode 01 s.d. 08)',
    kategoriAnomali: 'Semua Kondisi Anomali',
    deskripsiJuknis: 'PERHATIAN DJPb & KPPN: Penggunaan Kode 99 (Lain-lain) sebaiknya dihindari. Utamakan penggunaan kode referensi 01 s.d. 08 yang substantif agar data capaian output disetujui dan tidak dipertanyakan atau ditolak KPPN saat rekonsiliasi.',
    kondisiPemicu: 'Dihindari. Hanya gunakan jika kondisi mutlak tidak tercakup pada kode 01 s.d. 08 dan wajib memuat 3 elemen keterangan lengkap.'
  }
];

/**
 * 8 Variabel Kualitas Data Validasi SAKTI (Juknis SAKTI Hal 8-9 & 31-39)
 */
export const SAKTI_VALIDASI_RULES = [
  {
    kode: '01',
    nama: 'Validasi 01',
    kondisi: 'PCRO dilaporkan 0 meskipun telah ada realisasi anggaran',
    statusAction: 'Input Ditolak (Wajib Perbaikan)',
    warningBox: 'Isian data tidak valid. PCRO tidak boleh 0% karena telah ada realisasi anggaran.',
    petunjuk: 'Operator wajib menginput progres fisik (Kolom Q / PCRO) minimal 0,01% atau sesuai tahapan riil.'
  },
  {
    kode: '02',
    nama: 'Validasi 02',
    kondisi: 'PCRO dilaporkan lebih rendah dari realisasi anggaran (PCRO < PPA)',
    statusAction: 'Input Diterima (Early Warning / Konfirmasi KPPN)',
    warningBox: 'PCRO lebih rendah dari realisasi anggaran, apakah anda yakin?',
    petunjuk: 'Satker wajib memilih Referensi substantif (05/06/08 - hindari 99) dan mengisi Keterangan SAKTI yang memadai.'
  },
  {
    kode: '03',
    nama: 'Validasi 03',
    kondisi: 'PCRO 100% namun capaian fisik (RVRO) masih 0',
    statusAction: 'Input Ditolak (Wajib Perbaikan)',
    warningBox: 'Isian data tidak valid. Realisasi Volume RO tidak boleh 0 karena PCRO telah 100%.',
    petunjuk: 'Jika fisik tuntas, input Realisasi Volume (Kolom P). Jika belum tuntas, sesuaikan PCRO < 100%.'
  },
  {
    kode: '04',
    nama: 'Validasi 04',
    kondisi: 'PCRO 100% namun capaian fisik (RVRO) tidak mencapai target/volume DIPA',
    statusAction: 'Input Ditolak (Wajib Perbaikan)',
    warningBox: 'Isian data tidak valid. PCRO telah 100% namun Realisasi Volume RO tidak mencapai target.',
    petunjuk: 'Samakan RVRO dengan Target Volume DIPA jika pekerjaan tuntas, atau turunkan PCRO jika volume belum tuntas.'
  },
  {
    kode: '05',
    nama: 'Validasi 05',
    kondisi: 'Terdapat RVRO yang dilaporkan namun Realisasi Anggaran masih 0',
    statusAction: 'Input Diterima (Early Warning / Konfirmasi KPPN)',
    warningBox: 'Terdapat Realisasi Volume RO namun realisasi anggaran 0, apakah anda yakin?',
    petunjuk: 'Pilih Referensi 02 (kegiatan fisik telah jalan, SPJ masih proses) dan lengkapi Keterangan SAKTI.'
  },
  {
    kode: '06',
    nama: 'Validasi 06',
    kondisi: 'RVRO dalam bentuk desimal pada satuan yang tidak diizinkan desimal',
    statusAction: 'Input Ditolak (Wajib Perbaikan)',
    warningBox: 'Isian data tidak valid. Realisasi Volume RO tidak boleh diisi menggunakan tanda desimal.',
    petunjuk: 'Hanya 42 satuan yang boleh desimal (M2, Km, %, kg, dll). Satuan seperti Dokumen, Orang, KK wajib bilangan bulat.'
  },
  {
    kode: '07',
    nama: 'Validasi 07',
    kondisi: 'RVRO dengan capaian melebihi target/volume DIPA',
    statusAction: 'Input Diterima (Early Warning / Konfirmasi KPPN)',
    warningBox: 'Realisasi Volume RO telah melebihi Target RO, apakah anda yakin?',
    petunjuk: 'Hanya diizinkan untuk Jenis RO Dinamis. Satker wajib mengisi Keterangan dan konfirmasi KPPN.'
  },
  {
    kode: '08',
    nama: 'Validasi 08',
    kondisi: 'RVRO telah mencapai target, tetapi PCRO belum 100%',
    statusAction: 'Input Diterima (Early Warning / Konfirmasi KPPN)',
    warningBox: 'PCRO belum 100% namun Realisasi Volume RO telah memenuhi Target RO, apakah anda yakin?',
    petunjuk: 'Berfungsi sebagai early warning. Jika tahapan penyelesaian akhir masih berjalan, beri Keterangan SAKTI.'
  }
];

/**
 * Clean & Parse numeric strings (handles Indonesian format like "1.250.000,50" or "0,01" or percentage strings "75,50%")
 */
export function parseCaputNumber(val: unknown): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  
  let str = String(val)
    .trim()
    .replace(/[\u00A0\u1680\u180e\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]/g, ' ')
    .replace(/%/g, '')
    .replace(/Rp\.?/gi, '')
    .replace(/\s+/g, '');
    
  if (!str || str === '-' || str.toLowerCase() === 'nan' || str.includes('#N/A') || str.includes('DIV/0')) return 0;

  let isNegative = false;
  if (str.startsWith('(') && str.endsWith(')')) {
    isNegative = true;
    str = str.substring(1, str.length - 1);
  }

  if (str.includes(',') && str.includes('.')) {
    if (str.lastIndexOf(',') > str.lastIndexOf('.')) {
      str = str.replace(/\./g, '').replace(/,/g, '.');
    } else {
      str = str.replace(/,/g, '');
    }
  } else if (str.includes(',')) {
    str = str.replace(/,/g, '.');
  }

  const num = parseFloat(str);
  if (isNaN(num)) return 0;
  return isNegative ? -num : num;
}

/**
 * Format currency to Indonesian Rupiah (Rp)
 */
export function formatRupiahCaput(val: number): string {
  return 'Rp ' + Math.round(val).toLocaleString('id-ID');
}

/**
 * Generate Dynamic Compliant SAKTI Narrative based on official reference code and RO conditions
 */
export function generateSaktiTemplateByRef(
  refCode: string,
  params: {
    kodeRo: string;
    namaRo: string;
    pcro: number;
    tpcro: number;
    ppa: number;
    rvro: number;
    tvro: number;
    nilaiZ: number;
  }
): string {
  const { kodeRo, pcro, tpcro, ppa, rvro, tvro, nilaiZ } = params;
  const gapKinerja = Number((tpcro - pcro).toFixed(2));
  const gapPpa = Number((pcro - ppa).toFixed(2));

  switch (refCode) {
    case '01':
      return `[Referensi 01 - Efisiensi Anggaran]: Pelaksanaan RO ${kodeRo} telah mencapai progres fisik ${pcro.toFixed(2)}% dengan penyerapan anggaran ${ppa.toFixed(2)}% (GAP: +${gapPpa.toFixed(2)}%). Efisiensi dicapai melalui optimalisasi alokasi operasional dan negosiasi harga pengadaan tanpa mengurangi kualitas volume keluaran (${rvro}/${tvro} vol). Seluruh tahapan telah sesuai standar operasional.`;

    case '02':
      return `[Referensi 02 - Pertanggungjawaban Keuangan Masih Proses]: Progres fisik RO ${kodeRo} telah terlaksana sebesar ${pcro.toFixed(2)}% mendahului pencatatan belanja (PPA: ${ppa.toFixed(2)}%). Pekerjaan lapangan telah tuntas, saat ini berkas pertanggungjawaban administrasi/SPJ dan pengajuan SPM/SP2D sedang dalam proses verifikasi pejabat perbendaharaan untuk pencairan.`;

    case '03':
      return `[Referensi 03 - Alokasi Anggaran Melebihi Kebutuhan]: Capaian fisik RO ${kodeRo} telah mencapai ${pcro.toFixed(2)}% (Nilai Kolom Z: ${nilaiZ.toFixed(2)}), sementara realisasi belanja baru terserap ${ppa.toFixed(2)}%. Hal ini disebabkan alokasi anggaran DIPA awal lebih besar dibandingkan kebutuhan riil setelah pelaksanaan efisiensi kegiatan dan standardisasi belanja.`;

    case '04':
      return `[Referensi 04 - Belum Dilakukan Revisi Target]: Realisasi fisik Kolom Q tercatat ${pcro.toFixed(2)}% terhadap target Kolom Y (${tpcro.toFixed(2)}%). Terdapat penyesuaian jadwal dan volume riil kegiatan di lapangan yang saat ini sedang diajukan pemutakhiran/revisi target kinerja pada menu RUH Target Kinerja SAKTI periode berikutnya.`;

    case '05':
      return `[Referensi 05 - Penilaian Progres Dilakukan Periodik]: Realisasi belanja RO ${kodeRo} tercatat ${ppa.toFixed(2)}% sementara PCRO terlaporkan ${pcro.toFixed(2)}% (GAP: ${gapPpa.toFixed(2)}%). Penilaian dan pengumpulan instrumen bukti capaian fisik dilakukan secara berkala (cut-off triwulanan/semesteran), sehingga pembaruan data fisik akan terakselerasi pada periode penilaian berikutnya.`;

    case '06':
      return `[Referensi 06 - Pembayaran Uang Muka Pekerjaan]: Penyerapan anggaran telah terealisasi ${ppa.toFixed(2)}% yang merupakan pembayaran Uang Muka Kontrak pekerjaan fisik/pengadaan, sedangkan pekerjaan lapangan oleh penyedia jasa baru dimulai (PCRO: ${pcro.toFixed(2)}%). Progres tahapan fisik akan meningkat signifikan pada termin pekerjaan berikutnya.`;

    case '07':
      return `[Referensi 07 - Menunggu Finalisasi Laporan/BAST]: Tahapan pelaksanaan fisik RO ${kodeRo} telah tuntas 100% (PCRO: ${pcro.toFixed(2)}%), namun pencatatan Realisasi Volume (Kolom P: ${rvro} dari target ${tvro} vol) masih menunggu finalisasi verifikasi dokumen Berita Acara Serah Terima (BAST) dan laporan akhir pekerjaan sebelum ditutup tuntas.`;

    case '08':
      return `[Referensi 08 - Pembayaran Tunggakan/Tagihan Tahun Lalu]: Penyerapan belanja tercatat ${ppa.toFixed(2)}% mencakup penyelesaian pembayaran tagihan/tunggakan kegiatan tahun anggaran sebelumnya sesuai ketentuan regulasi, sehingga belanja tidak berkorelasi langsung dengan kenaikan fisik output tahun berjalan (PCRO: ${pcro.toFixed(2)}%).`;

    case '99':
    default:
      return `[Catatan: Disarankan memilih Kode 01 s.d. 08 untuk menghindari penolakan KPPN]. [Capaian & Tahapan Aktivitas]: Pelaksanaan kegiatan RO ${kodeRo} telah berjalan dengan progres fisik ${pcro.toFixed(2)}% dari target ${tpcro.toFixed(2)}% (Nilai Kolom Z = ${nilaiZ.toFixed(2)}). [Permasalahan & Tindak Lanjut]: Terjadi deviasi kinerja sebesar ${gapKinerja > 0 ? '-' : '+'}${Math.abs(gapKinerja).toFixed(2)}% dikarenakan proses penyesuaian teknis di lapangan; langkah akselerasi dan koordinasi intensif telah dijalankan. [Metode Perhitungan & Substansi]: Perhitungan progres didasarkan pada bobot penyelesaian tahapan dokumen pendukung dan verifikasi PPK sesuai regulasi PER-5/PB/2024.`;
  }
}

/**
 * Standard Engine to Diagnose Single RO against Kemenkeu / SAKTI IKPA Rules (Kolom P, Q, X, Y, Z Logic)
 */
export function diagnoseRO(raw: {
  id?: string;
  kodeSatker: string;
  namaSatker: string;
  kodeProgram?: string;
  namaProgram?: string;
  kodeKegiatan?: string;
  namaKegiatan?: string;
  kodeKro?: string;
  namaKro?: string;
  kodeRo: string;
  namaRo: string;
  volumeTarget: number;       // Kolom X: Target Volume (Target RVRO)
  volumeRealisasi: number;    // Kolom P: Realisasi Volume (Realisasi RO)
  targetProgres: number;      // Kolom Y: Target Progres (Target PCRO)
  realisasiProgres: number;   // Kolom Q: Realisasi Progres (Progress RO)
  statusKonfirmasi?: string;  // Kolom R: Status Konfirmasi KPPN
  nilaiCaput?: number;        // Kolom Z: Nilai Capaian Output langsung dari file Excel
  paguAnggaran?: number;
  realisasiAnggaran?: number;
  persenPenyerapan?: number;
  polarisasi?: 'MAXIMIZE' | 'MINIMIZE' | 'RANGE';
  keteranganSakti?: string;
  selectedRefCode?: string;
}): DiagnostikCaputROItem {
  const tpcro = Math.max(0, raw.targetProgres);   // Kolom Y (Target PCRO)
  const pcro = Math.max(0, raw.realisasiProgres); // Kolom Q (Progress RO)
  const tvro = Math.max(0, raw.volumeTarget);     // Kolom X (Target RVRO)
  const rvro = Math.max(0, raw.volumeRealisasi);  // Kolom P (Realisasi RO)
  
  const pagu = Math.max(0, raw.paguAnggaran || 0);
  const realisasi = Math.max(0, raw.realisasiAnggaran || 0);
  const persenSerap = pagu > 0 ? (realisasi / pagu) * 100 : (raw.persenPenyerapan || 0);

  // Evaluasi Kolom R: Status Konfirmasi KPPN
  const rawStatus = (raw.statusKonfirmasi || '').trim();
  const lowerStatus = rawStatus.toLowerCase();
  let statusKonfirmasiKppn = rawStatus || 'TERKONFIRMASI';
  let isUnconfirmedKppn = false;

  if (
    lowerStatus.includes('tidak terkonfirmasi') ||
    lowerStatus.includes('belum terkonfirmasi') ||
    lowerStatus.includes('menunggu konfirmasi') ||
    lowerStatus.includes('belum dikonfirmasi') ||
    lowerStatus.includes('ditolak')
  ) {
    isUnconfirmedKppn = true;
    statusKonfirmasiKppn = rawStatus ? rawStatus.toUpperCase() : 'TIDAK TERKONFIRMASI';
  } else if (lowerStatus.includes('terkonfirmasi otomatis') || lowerStatus.includes('otomatis')) {
    statusKonfirmasiKppn = 'TERKONFIRMASI OTOMATIS';
  } else if (lowerStatus.includes('terkonfirmasi') || lowerStatus.includes('setuju') || lowerStatus.includes('disetujui')) {
    statusKonfirmasiKppn = 'TERKONFIRMASI';
  } else if (!rawStatus) {
    statusKonfirmasiKppn = 'TERKONFIRMASI';
  }

  // Perhitungan Nilai Komponen RO (Kolom Z / NKRO):
  let nilaiKomponen = 0;
  const isTpcRoZeroPcroZero = (tpcro === 0 && pcro === 0);

  if (raw.nilaiCaput !== undefined && raw.nilaiCaput !== null && !isNaN(raw.nilaiCaput) && raw.nilaiCaput >= 0) {
    nilaiKomponen = Number(raw.nilaiCaput.toFixed(2));
  } else {
    if (isUnconfirmedKppn) {
      // Pada sistem MyIntress, status tidak terkonfirmasi di Kolom R umumnya menghasilkan nilai 0
      nilaiKomponen = 0;
    } else if (isTpcRoZeroPcroZero) {
      nilaiKomponen = 0;
    } else if (tpcro === 0 && pcro > 0) {
      nilaiKomponen = 100;
    } else {
      nilaiKomponen = Number(Math.min(100, (pcro / tpcro) * 100).toFixed(2));
    }
  }

  const gapKinerja = Number((tpcro - pcro).toFixed(2));
  const gapPpa = Number((pcro - persenSerap).toFixed(2));

  let severity: DiagnostikCaputROItem['diagnosaSeverity'] = 'OPTIMAL';
  let code: DiagnostikCaputROItem['diagnosaCode'] = 'OPTIMAL';
  let title = '✅ Kolom Z Optimal: Nilai Komponen RO = 100.00';
  let description = `Progres fisik Kolom Q (PCRO: ${pcro.toFixed(2)}%) telah memenuhi Kolom Y (Target: ${tpcro.toFixed(2)}%) dengan Nilai Komponen Kolom Z = 100.00. Status Kolom R Terkonfirmasi (Aman).`;
  const rekomendasi: string[] = [];

  // Tentukan Kode Referensi SAKTI & Kode Validasi SAKTI
  let defaultRefCode = '07';
  let validasiCode: DiagnostikCaputROItem['validasiSaktiCode'] = '00';
  let validasiStatus: DiagnostikCaputROItem['validasiSaktiStatus'] = 'Valid by System';

  // 1. Validasi 01: PCRO = 0 padahal ada realisasi anggaran
  if (persenSerap > 0 && pcro === 0) {
    validasiCode = '01';
    validasiStatus = 'Input Ditolak (Wajib Perbaikan)';
  }
  // 2. Validasi 03: PCRO 100% tapi RVRO masih 0
  else if (pcro >= 100 && rvro === 0 && tvro > 0) {
    validasiCode = '03';
    validasiStatus = 'Input Ditolak (Wajib Perbaikan)';
    defaultRefCode = '07';
  }
  // 3. Validasi 04: PCRO 100% tapi RVRO < TVRO
  else if (pcro >= 100 && rvro < tvro && tvro > 0) {
    validasiCode = '04';
    validasiStatus = 'Input Ditolak (Wajib Perbaikan)';
    defaultRefCode = '07';
  }
  // 4. Validasi 02: PCRO < PPA (GAP < -20%)
  else if (pcro < persenSerap && gapPpa < -20) {
    validasiCode = '02';
    validasiStatus = 'Input Diterima (Early Warning / Konfirmasi KPPN)';
    defaultRefCode = '05';
  }
  // 5. Validasi 05: RVRO > 0 tapi Realisasi Anggaran 0%
  else if (rvro > 0 && persenSerap === 0) {
    validasiCode = '05';
    validasiStatus = 'Input Diterima (Early Warning / Konfirmasi KPPN)';
    defaultRefCode = '02';
  }
  // 6. Validasi 08: RVRO >= TVRO tapi PCRO belum 100%
  else if (tvro > 0 && rvro >= tvro && pcro < 100) {
    validasiCode = '08';
    validasiStatus = 'Input Diterima (Early Warning / Konfirmasi KPPN)';
    defaultRefCode = '04';
  }
  // 7. GAP Kinerja Tinggi (PCRO > PPA)
  else if (gapPpa > 20) {
    defaultRefCode = '02';
  }

  // -------------------------------------------------------------
  // EVALUASI KEPARAHAN (SEVERITY) BERDASARKAN KOLOM Z, KOLOM R & JUKNIS
  // -------------------------------------------------------------
  if (isUnconfirmedKppn) {
    severity = 'KRITIS';
    code = 'MISSING_EXPLANATION';
    title = `🚨 Perhatian Kolom R: Status "${statusKonfirmasiKppn}" oleh KPPN (Potensi Nilai Kolom Z = 0)`;
    description = `Status pada Kolom R (Konfirmasi KPPN) terdeteksi "${statusKonfirmasiKppn}". Perlu jadi perhatian serius: Jika status Kolom R tidak terkonfirmasi, biasanya nilainya menjadi 0 (Nol) pada aplikasi MyIntress sehingga satker harus segera konfirmasi atau lapor ke KPPN mitra kerja. (Catatan: Jika seluruh data sudah OK dan divalidasi namun belum 100, silakan tunggu pembaruan batch OLAP MyIntress sekitar 2 jam kemudian).`;
    rekomendasi.push(
      'Segera lapor dan lakukan konfirmasi ke KPPN mitra kerja (Seksi MSKI / PIC Caput) untuk memohon persetujuan/konfirmasi atas data output ini.',
      'Pastikan Operator Komitmen telah memilih Kode Referensi yang tepat dan mengisi kolom Keterangan SAKTI secara lengkap (minimal 3 elemen substansi).',
      'Pastikan Pejabat Pembuat Komitmen (PPK) telah memvalidasi (Setuju) dan Operator PPK Umum telah melakukan pengiriman data.',
      'Tunggu Siklus OLAP MyIntress: Apabila data di SAKTI sudah OK dan KPPN telah konfirmasi, nilai pada MyIntress akan ter-refresh setelah proses OLAP berjalan (estimasi 2 jam kemudian).'
    );
    defaultRefCode = '07';
  } else if (isTpcRoZeroPcroZero) {
    severity = 'KRITIS';
    code = 'TPCRO_PCRO_ZERO';
    title = '🚨 Kritis: Kolom Y (Target TPCRO) = 0 & Kolom Q (PCRO) = 0 — SAKTI Tidak Membentuk Progres (Kolom Z = 0)';
    description = 'Kondisi Kolom Y (Target TPCRO) = 0 dan Kolom Q (PCRO) = 0 menyebabkan sistem SAKTI TIDAK MEMBENTUK PROGRES sehingga Nilai Kolom Z menjadi 0,00 dan merusak capaian IKPA Satker.';
    rekomendasi.push(
      'Isi Kolom Q (PCRO) minimal 0,01 pada periode berjalan di Modul Komitmen SAKTI agar sistem membentuk progres perhitungan.',
      'Lakukan pemutakhiran proyeksi target pada Kolom Y (Target TPCRO) pada periode pembukaan pemutakhiran berikutnya.',
      'Segera simpan data dan mintakan approval Pejabat Pembuat Komitmen (PPK) sebelum batas waktu cut-off.'
    );
    defaultRefCode = '04';
  } else if (nilaiKomponen < 60) {
    severity = 'KRITIS';
    code = 'PCRO_BELOW_TPCRO';
    title = `🚨 Kritis: Nilai Kolom Z = ${nilaiKomponen.toFixed(2)} (< 60) — Realisasi (Kolom Q: ${pcro.toFixed(2)}%) Jauh di Bawah Target (Kolom Y: ${tpcro.toFixed(2)}%)`;
    description = `Nilai Capaian Output Kolom Z sangat rendah (${nilaiKomponen.toFixed(2)} / 100) karena Realisasi Progres (Kolom Q) baru terisi ${pcro.toFixed(2)}% dari Target (Kolom Y) sebesar ${tpcro.toFixed(2)}% (Gap: -${gapKinerja.toFixed(2)}%).`;
    rekomendasi.push(
      `Akselerasi penyelesaian fisik dan perbarui Kolom Q (PCRO) di Modul Komitmen SAKTI agar minimal sama dengan Kolom Y (${tpcro.toFixed(2)}%) sehingga Nilai Kolom Z mencapai 100.`,
      'Wajib mengisi kolom Keterangan SAKTI mengenai kendala atau tahapan pekerjaan yang sedang berlangsung sebelum approval PPK.',
      'Jika target di Kolom Y terlalu tinggi akibat pergeseran jadwal, lakukan pemutakhiran proyeksi target.'
    );
    defaultRefCode = '04';
  } else if (nilaiKomponen < 99.99) {
    severity = 'PERINGATAN';
    code = 'PCRO_BELOW_TPCRO';
    title = `⚠️ Peringatan: Nilai Kolom Z = ${nilaiKomponen.toFixed(2)} (Belum 100) — Kolom Q (PCRO: ${pcro.toFixed(2)}%) Belum Memenuhi Kolom Y (Target: ${tpcro.toFixed(2)}%)`;
    description = `Nilai Capaian Output Kolom Z belum optimal (${nilaiKomponen.toFixed(2)} / 100) karena Realisasi Progres (Kolom Q: ${pcro.toFixed(2)}%) masih di bawah Target Progres (Kolom Y: ${tpcro.toFixed(2)}%) dengan Gap -${gapKinerja.toFixed(2)}%.`;
    rekomendasi.push(
      `Tingkatkan progres fisik pada Kolom Q (PCRO) di SAKTI hingga mencapai target Kolom Y (${tpcro.toFixed(2)}%) agar Nilai Kolom Z menjadi 100.`,
      'Lengkapi pengisian kolom Keterangan SAKTI mengenai perkembangan capaian fisik output.',
      'Pastikan dokumen BAST atau bukti fisik telah diverifikasi oleh PPK sebelum cut-off pelaporan.'
    );
    defaultRefCode = '04';
  } else if (nilaiKomponen >= 99.99 && tvro > 0 && rvro < tvro && pcro >= 100) {
    severity = 'PERINGATAN';
    code = 'PCRO_100_RVRO_BELOW_TVRO';
    title = `⚠️ Kolom Q (PCRO) Sudah 100% namun Kolom P (Realisasi Volume: ${rvro}) < Kolom X (Target Volume: ${tvro})`;
    description = `Progres tahapan fisik pada Kolom Q sudah terisi 100%, akan tetapi Realisasi Volume pada Kolom P baru terisi ${rvro} dari Target Volume Kolom X (${tvro}). Perlu sinkronisasi agar volume fisik output tercatat tuntas.`;
    rekomendasi.push(
      `Periksa kelengkapan Berita Acara Serah Terima (BAST) / laporan akhir pekerjaan fisik apakah target ${tvro} volume telah tuntas.`,
      `Inputkan jumlah Realisasi Volume (RVRO) pada Kolom P di Modul Komitmen SAKTI hingga bernilai ${tvro} jika seluruh keluaran output telah selesai.`,
      'Jika terdapat efisiensi atau perubahan target volume dari DIPA awal, cantumkan penjelasan perubahan volume pada kolom Keterangan SAKTI.'
    );
    defaultRefCode = '07';
  } else {
    severity = 'OPTIMAL';
    code = 'OPTIMAL';
    title = '✅ Kolom Z Optimal: Nilai Komponen RO = 100.00';
    description = `Progres fisik Kolom Q (PCRO: ${pcro.toFixed(2)}%) telah memenuhi Kolom Y (Target: ${tpcro.toFixed(2)}%) dengan Nilai Komponen Kolom Z = 100.00. Status Kolom R Terkonfirmasi (Aman).`;
    rekomendasi.push('Pertahankan ketertiban pengisian dan approval PPK tepat waktu setiap periode pelaporan.');
  }

  const finalRefCode = raw.selectedRefCode || defaultRefCode;
  const refObj = SAKTI_REFERENSI_LIST.find(r => r.kode === finalRefCode) || SAKTI_REFERENSI_LIST[8];
  
  const templateKeterangan = generateSaktiTemplateByRef(finalRefCode, {
    kodeRo: raw.kodeRo,
    namaRo: raw.namaRo,
    pcro,
    tpcro,
    ppa: persenSerap,
    rvro,
    tvro,
    nilaiZ: nilaiKomponen
  });

  const potensiKenaikan = Math.max(0, Number((100 - nilaiKomponen).toFixed(2)));

  return {
    id: raw.id || `RO-${raw.kodeRo}-${Math.random().toString(36).substring(2, 7)}`,
    kodeSatker: raw.kodeSatker,
    namaSatker: raw.namaSatker,
    kodeProgram: raw.kodeProgram,
    namaProgram: raw.namaProgram,
    kodeKegiatan: raw.kodeKegiatan,
    namaKegiatan: raw.namaKegiatan,
    kodeKro: raw.kodeKro,
    namaKro: raw.namaKro,
    kodeRo: raw.kodeRo,
    namaRo: raw.namaRo,
    volumeTarget: tvro,
    volumeRealisasi: rvro,
    targetProgres: tpcro,
    realisasiProgres: pcro,
    paguAnggaran: pagu,
    realisasiAnggaran: realisasi,
    persenPenyerapan: persenSerap,
    polarisasi: raw.polarisasi || 'MAXIMIZE',
    keteranganSakti: raw.keteranganSakti || '',
    statusKonfirmasiKppn,
    isUnconfirmedKppn,
    diagnosaSeverity: severity,
    diagnosaCode: code,
    diagnosaTitle: title,
    diagnosaDescription: description,
    rekomendasiTindakan: rekomendasi,
    templateKeteranganSakti: templateKeterangan,
    selectedReferensiSakti: finalRefCode,
    uraianReferensiSakti: `${refObj.kode}) ${refObj.judul}`,
    validasiSaktiCode: validasiCode,
    validasiSaktiStatus: validasiStatus,
    gapKinerja,
    gapPpa,
    nilaiKomponenRo: nilaiKomponen,
    potensiKenaikanSkor: potensiKenaikan
  };
}

/**
 * Intelligent Multi-Format Excel Cleaner & Parser (MyIntress / MonSAKTI / OMSPAN / Caput156)
 */
export async function parseMyIntressCaputExcel(file: File): Promise<DiagnostikCaputResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  if (!sheet) {
    throw new Error('File Excel tidak memiliki lembar kerja (worksheet) yang valid.');
  }

  const matrix: (string | number | undefined)[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: '',
    raw: false
  });

  if (!matrix || matrix.length === 0) {
    throw new Error('File Excel kosong atau tidak memiliki baris data.');
  }

  let extractedKodeSatker = '';
  let extractedNamaSatker = '';
  let extractedPeriode = 'Agustus 2026';

  for (let r = 0; r < Math.min(15, matrix.length); r++) {
    const rowStr = (matrix[r] || []).join(' ').trim();
    if (!rowStr) continue;

    const satkerMatch = rowStr.match(/satker\s*[:=]?\s*([0-9]{6})\s*[-–]?\s*([^,\n\r]+)?/i) ||
                        rowStr.match(/kode\s*satker\s*[:=]?\s*([0-9]{6})/i) ||
                        rowStr.match(/([0-9]{6})\s*[-–]\s*([A-Za-z0-9\s.]+)/);
    if (satkerMatch) {
      if (satkerMatch[1] && !extractedKodeSatker) extractedKodeSatker = satkerMatch[1];
      if (satkerMatch[2] && !extractedNamaSatker) extractedNamaSatker = satkerMatch[2].trim();
    }

    const periodeMatch = rowStr.match(/(?:periode|bulan|cut\s*off)\s*[:=]?\s*([A-Za-z0-9\s]+)/i);
    if (periodeMatch && periodeMatch[1] && periodeMatch[1].length < 30) {
      extractedPeriode = periodeMatch[1].trim();
    }
  }

  const headerKeywords = [
    'satker', 'kdsatker', 'kodesatker',
    'kro', 'ro', 'kodero', 'rincianoutput', 'namaro', 'uraianro',
    'tvro', 'rvro', 'tpcro', 'pcro', 'target', 'realisasi', 'progres', 'progress',
    'pagu', 'anggaran', 'keterangan', 'nilai'
  ];

  let headerRowIndex = -1;
  let maxKeywordMatches = 0;

  for (let r = 0; r < Math.min(25, matrix.length); r++) {
    const row = matrix[r] || [];
    let matches = 0;
    for (const cell of row) {
      const cellStr = String(cell || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      if (headerKeywords.some(kw => cellStr.includes(kw))) {
        matches++;
      }
    }
    if (matches > maxKeywordMatches) {
      maxKeywordMatches = matches;
      headerRowIndex = r;
    }
  }

  if (headerRowIndex === -1 || maxKeywordMatches < 2) {
    headerRowIndex = 0;
  }

  const headerRow = matrix[headerRowIndex] || [];
  const prevHeaderRow = headerRowIndex > 0 ? matrix[headerRowIndex - 1] || [] : [];
  const columnHeaders: string[] = [];

  for (let c = 0; c < headerRow.length; c++) {
    const currCell = String(headerRow[c] || '').trim();
    const prevCell = String(prevHeaderRow[c] || '').trim();
    
    let combined = currCell;
    if (prevCell && prevCell !== currCell && !currCell.toLowerCase().includes(prevCell.toLowerCase())) {
      combined = `${prevCell} ${currCell}`;
    }
    columnHeaders.push(combined);
  }

  const findColIndex = (positivePatterns: string[], negativePatterns: string[] = []): number => {
    for (let c = 0; c < columnHeaders.length; c++) {
      const cleanHeader = columnHeaders[c].toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!cleanHeader) continue;
      const hasNegative = negativePatterns.some(neg => cleanHeader.includes(neg.toLowerCase().replace(/[^a-z0-9]/g, '')));
      if (hasNegative) continue;

      const hasExactPositive = positivePatterns.some(pos => cleanHeader === pos.toLowerCase().replace(/[^a-z0-9]/g, ''));
      if (hasExactPositive) return c;
    }

    for (let c = 0; c < columnHeaders.length; c++) {
      const cleanHeader = columnHeaders[c].toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!cleanHeader) continue;
      const hasNegative = negativePatterns.some(neg => cleanHeader.includes(neg.toLowerCase().replace(/[^a-z0-9]/g, '')));
      if (hasNegative) continue;

      const hasPositive = positivePatterns.some(pos => cleanHeader.includes(pos.toLowerCase().replace(/[^a-z0-9]/g, '')));
      if (hasPositive) return c;
    }
    return -1;
  };

  const colKodeSatker = findColIndex(['kodesatker', 'kdsatker', 'satker', 'kode_satker', 'kdkantor'], ['nama', 'uraian', 'target', 'realisasi', 'nilai']);
  const colNamaSatker = findColIndex(['namasatker', 'nmsatker', 'satker_nama', 'nama_satker', 'nmkantor', 'uraiansatker'], ['kode']);
  const colProgram = findColIndex(['kodeprogram', 'kdprogram', 'program'], ['nama', 'uraian']);
  const colNamaProgram = findColIndex(['namaprogram', 'nmprogram', 'uraianprogram']);
  const colKegiatan = findColIndex(['kodekegiatan', 'kdkegiatan', 'kegiatan'], ['nama', 'uraian']);
  const colNamaKegiatan = findColIndex(['namakegiatan', 'nmkegiatan', 'uraiankegiatan']);
  const colKro = findColIndex(['kodekro', 'kdkro', 'kro', 'klasifikasirincianoutput'], ['nama', 'uraian']);
  const colNamaKro = findColIndex(['namakro', 'nmkro', 'uraiankro']);
  const colKodeRo = findColIndex(['kodero', 'kdro', 'rincianoutput', 'koderincianoutput', 'output', 'kategorioutput'], ['nama', 'uraian', 'target', 'realisasi', 'progress', 'progres', 'nilai']);
  const colNamaRo = findColIndex(['namaro', 'nmro', 'uraianro', 'nama_ro', 'uraian_ro', 'namarincianoutput', 'uraianrincianoutput', 'deskripsiro'], ['kode']);
  
  // Kolom X: Target RVRO
  const colTvro = findColIndex(['targetrvro', 'trvro', 'target_rvro', 'targetvolume', 'tvro', 'volumetarget', 'target_volume', 'voltarget'], ['pcro', 'progres', 'progress', 'realisasi']);
  
  // Kolom P: Realisasi RO / Realisasi Volume (RVRO)
  const colRvro = findColIndex(['realisasiro', 'realisasi_ro', 'realisasirvro', 'realisasivolume', 'rvro', 'volumerealisasi', 'realisasi_volume', 'volrealisasi'], ['pcro', 'progres', 'progress', 'target']);
  
  // Kolom Y: Target PCRO / Target Progres (TPCRO)
  const colTpcro = findColIndex(['targetpcro', 'target_pcro', 'targetprogres', 'targetprogress', 'tpcro', 't_pcro', 'progrestarget', 'progresstarget'], ['realisasi', 'rvro', 'volume', 'nilai']);
  
  // Kolom Q: Progress RO / Realisasi Progres (PCRO)
  const colPcro = findColIndex(['progressro', 'progresro', 'realisasipcro', 'realisasiprogres', 'realisasi_pcro', 'realisasi_progres', 'progresrealisasi', 'progressrealisasi', 'progrescapaian', 'progresfisik'], ['target', 'tpcro', 'polarisasi', 'rvro', 'volume', 'nilai']);
  
  // Kolom R: Status Konfirmasi KPPN (Kolom R)
  const colStatusKonfirmasi = findColIndex(
    ['statuskonfirmasi', 'statuskonfirmasikppn', 'konfirmasikppn', 'statkonfirmasi', 'statusapproval', 'approvalkppn', 'kolomr', 'statuskonfir'],
    ['satker', 'ro', 'kro', 'kegiatan', 'program', 'validasi']
  );

  // Kolom Z: Nilai / Nilai Caput / Nilai Komponen RO
  const colNilaiCaput = findColIndex(['nilai', 'nilaicaput', 'nilaikomponen', 'nilaikomponenro', 'nkro', 'nilaikinerja', 'skorcaput', 'skor', 'kolomz'], ['pagu', 'belanja', 'realisasianggaran', 'persen', 'target', 'progres', 'progress', 'volume', 'rupiah', 'satuan', 'status']);
  
  const colPagu = findColIndex(['paguanggaran', 'pagudipa', 'pagu', 'alokasi', 'pagu_dipa', 'anggaran'], ['realisasi', 'nilai']);
  const colRealisasi = findColIndex(['realisasianggaran', 'realisasibelanja', 'realisasispan', 'realisasi', 'penyerapan', 'realisasi_anggaran'], ['pagu', 'nilai', 'pcro', 'rvro', 'target']);
  const colKet = findColIndex(['keterangansakti', 'keterangan', 'alasandeviasi', 'penjelasan', 'kendala', 'alasan', 'catatan']);

  const items: DiagnostikCaputROItem[] = [];
  const satkerMap: Record<string, { kodeSatker: string; namaSatker: string; items: DiagnostikCaputROItem[] }> = {};

  for (let r = headerRowIndex + 1; r < matrix.length; r++) {
    const row = matrix[r] || [];
    if (!row || row.length === 0) continue;

    const rawKodeRo = String(colKodeRo >= 0 ? row[colKodeRo] : '').trim();
    const rawNamaRo = String(colNamaRo >= 0 ? row[colNamaRo] : (row.length > 7 ? row[7] : '')).trim();

    if (!rawKodeRo && !rawNamaRo) continue;
    const testSummary = `${rawKodeRo} ${rawNamaRo}`.toLowerCase();
    if (
      testSummary.includes('total') ||
      testSummary.includes('jumlah') ||
      testSummary.includes('sub total') ||
      testSummary.includes('subtotal') ||
      testSummary.includes('rata-rata') ||
      testSummary.includes('grand total') ||
      testSummary.startsWith('halaman')
    ) {
      continue;
    }

    const hasAnyText = row.slice(0, 12).some(cell => typeof cell === 'string' && cell.trim().length > 1 && isNaN(Number(cell.trim())));
    if (!hasAnyText && !rawNamaRo) {
      continue;
    }

    let rowKodeSatker = String(colKodeSatker >= 0 ? row[colKodeSatker] : '').trim();
    let rowNamaSatker = String(colNamaSatker >= 0 ? row[colNamaSatker] : '').trim();

    if (rowKodeSatker && rowKodeSatker.length > 6) {
      const matchSix = rowKodeSatker.match(/\b([0-9]{6})\b/);
      if (matchSix) rowKodeSatker = matchSix[1];
    }

    if (rowKodeSatker && !extractedKodeSatker) extractedKodeSatker = rowKodeSatker;
    if (rowNamaSatker && !extractedNamaSatker) extractedNamaSatker = rowNamaSatker;

    const finalSatkerKode = rowKodeSatker || extractedKodeSatker || '643131';
    const finalSatkerNama = rowNamaSatker || extractedNamaSatker || 'Satuan Kerja';

    let kodeProgram = String(colProgram >= 0 ? row[colProgram] : '').trim();
    let namaProgram = String(colNamaProgram >= 0 ? row[colNamaProgram] : '').trim();
    let kodeKegiatan = String(colKegiatan >= 0 ? row[colKegiatan] : '').trim();
    let namaKegiatan = String(colNamaKegiatan >= 0 ? row[colNamaKegiatan] : '').trim();
    let kodeKro = String(colKro >= 0 ? row[colKro] : '').trim();
    let namaKro = String(colNamaKro >= 0 ? row[colNamaKro] : '').trim();
    let kodeRo = rawKodeRo;
    let namaRo = rawNamaRo;

    if (kodeRo.includes('.')) {
      const parts = kodeRo.split('.');
      if (parts.length >= 3) {
        if (!kodeKegiatan) kodeKegiatan = parts[parts.length - 3];
        if (!kodeKro) kodeKro = `${parts[parts.length - 3]}.${parts[parts.length - 2]}`;
      }
    }

    const tvro = parseCaputNumber(colTvro >= 0 ? row[colTvro] : (row.length > 23 ? row[23] : 0));
    const rvro = parseCaputNumber(colRvro >= 0 ? row[colRvro] : (row.length > 15 ? row[15] : 0));
    const tpcro = parseCaputNumber(colTpcro >= 0 ? row[colTpcro] : (row.length > 24 ? row[24] : 0));
    const pcro = parseCaputNumber(colPcro >= 0 ? row[colPcro] : (row.length > 16 ? row[16] : 0));
    
    // Status Konfirmasi KPPN (Kolom R / Kolom 17)
    let rawStatusKonfirmasi = '';
    if (colStatusKonfirmasi >= 0 && row[colStatusKonfirmasi] !== undefined) {
      rawStatusKonfirmasi = String(row[colStatusKonfirmasi] || '').trim();
    } else if (row.length > 17 && typeof row[17] === 'string' && (
      row[17].toLowerCase().includes('konfirmasi') ||
      row[17].toLowerCase().includes('terkonfirmasi') ||
      row[17].toLowerCase().includes('setuju') ||
      row[17].toLowerCase().includes('tolak')
    )) {
      rawStatusKonfirmasi = String(row[17] || '').trim();
    }

    const rawNilaiZ = colNilaiCaput >= 0 ? row[colNilaiCaput] : (row.length > 25 ? row[25] : undefined);
    const nilaiZ = rawNilaiZ !== undefined && rawNilaiZ !== '' ? parseCaputNumber(rawNilaiZ) : undefined;

    const pagu = parseCaputNumber(colPagu >= 0 ? row[colPagu] : 0);
    const realisasi = parseCaputNumber(colRealisasi >= 0 ? row[colRealisasi] : 0);
    const ket = String(colKet >= 0 ? row[colKet] : '').trim();

    const diagnosed = diagnoseRO({
      id: `EXCEL-RO-${items.length + 1}`,
      kodeSatker: finalSatkerKode,
      namaSatker: finalSatkerNama,
      kodeProgram,
      namaProgram,
      kodeKegiatan,
      namaKegiatan,
      kodeKro,
      namaKro,
      kodeRo: kodeRo || `RO-${items.length + 1}`,
      namaRo: namaRo || `Rincian Output ${kodeRo || items.length + 1}`,
      volumeTarget: tvro,
      volumeRealisasi: rvro,
      targetProgres: tpcro,
      realisasiProgres: pcro,
      statusKonfirmasi: rawStatusKonfirmasi,
      nilaiCaput: nilaiZ,
      paguAnggaran: pagu,
      realisasiAnggaran: realisasi,
      keteranganSakti: ket
    });

    items.push(diagnosed);

    if (!satkerMap[finalSatkerKode]) {
      satkerMap[finalSatkerKode] = {
        kodeSatker: finalSatkerKode,
        namaSatker: finalSatkerNama,
        items: []
      };
    }
    satkerMap[finalSatkerKode].items.push(diagnosed);
  }

  if (items.length === 0) {
    throw new Error('Tidak ditemukan data Rincian Output (RO) yang valid pada file Excel tersebut. Pastikan format kolom Target/Realisasi Progres sesuai format MyIntress/SAKTI.');
  }

  const totalRo = items.length;
  const roKritisCount = items.filter(it => it.diagnosaSeverity === 'KRITIS').length;
  const roPeringatanCount = items.filter(it => it.diagnosaSeverity === 'PERINGATAN').length;
  const roOptimalCount = items.filter(it => it.diagnosaSeverity === 'OPTIMAL').length;
  const roUnconfirmedCount = items.filter(it => it.isUnconfirmedKppn).length;

  const sumKomponen = items.reduce((acc, it) => acc + it.nilaiKomponenRo, 0);
  const currentScoreCaput = totalRo > 0 ? Number((sumKomponen / totalRo).toFixed(2)) : 0;

  const sumProjected = items.reduce((acc, it) => {
    if (it.diagnosaSeverity === 'KRITIS' || it.diagnosaSeverity === 'PERINGATAN') {
      return acc + 100;
    }
    return acc + it.nilaiKomponenRo;
  }, 0);
  const projectedScoreCaput = totalRo > 0 ? Number((sumProjected / totalRo).toFixed(2)) : 100;

  const totalPagu = items.reduce((acc, it) => acc + (it.paguAnggaran || 0), 0);
  const totalRealisasi = items.reduce((acc, it) => acc + (it.realisasiAnggaran || 0), 0);
  const persenPenyerapanTotal = totalPagu > 0 ? Number(((totalRealisasi / totalPagu) * 100).toFixed(2)) : 0;

  const avgPCRO = Number((items.reduce((acc, it) => acc + it.realisasiProgres, 0) / totalRo).toFixed(2));
  const avgTPCRO = Number((items.reduce((acc, it) => acc + it.targetProgres, 0) / totalRo).toFixed(2));

  const satkerBreakdown: DiagnostikCaputSatkerSummary[] = Object.values(satkerMap).map(s => {
    const sTotal = s.items.length;
    const sKritis = s.items.filter(it => it.diagnosaSeverity === 'KRITIS').length;
    const sPeringatan = s.items.filter(it => it.diagnosaSeverity === 'PERINGATAN').length;
    const sOptimal = s.items.filter(it => it.diagnosaSeverity === 'OPTIMAL').length;
    const sUnconfirmed = s.items.filter(it => it.isUnconfirmedKppn).length;
    const sSumKomp = s.items.reduce((acc, it) => acc + it.nilaiKomponenRo, 0);
    const sCurrentScore = sTotal > 0 ? Number((sSumKomp / sTotal).toFixed(2)) : 0;

    const sSumProj = s.items.reduce((acc, it) => {
      if (it.diagnosaSeverity === 'KRITIS' || it.diagnosaSeverity === 'PERINGATAN') {
        return acc + 100;
      }
      return acc + it.nilaiKomponenRo;
    }, 0);
    const sProjectedScore = sTotal > 0 ? Number((sSumProj / sTotal).toFixed(2)) : 100;

    const sPagu = s.items.reduce((acc, it) => acc + (it.paguAnggaran || 0), 0);
    const sReal = s.items.reduce((acc, it) => acc + (it.realisasiAnggaran || 0), 0);
    const sPersenSerap = sPagu > 0 ? Number(((sReal / sPagu) * 100).toFixed(2)) : 0;
    const sAvgPcro = Number((s.items.reduce((acc, it) => acc + it.realisasiProgres, 0) / sTotal).toFixed(2));
    const sAvgTpcro = Number((s.items.reduce((acc, it) => acc + it.targetProgres, 0) / sTotal).toFixed(2));

    return {
      kodeSatker: s.kodeSatker,
      namaSatker: s.namaSatker,
      totalRo: sTotal,
      roKritisCount: sKritis,
      roPeringatanCount: sPeringatan,
      roOptimalCount: sOptimal,
      roUnconfirmedCount: sUnconfirmed,
      currentScoreCaput: sCurrentScore,
      projectedScoreCaput: sProjectedScore,
      avgPCRO: sAvgPcro,
      avgTPCRO: sAvgTpcro,
      totalPagu: sPagu,
      totalRealisasi: sReal,
      persenPenyerapan: sPersenSerap
    };
  });

  const finalSatkerCode = extractedKodeSatker || (satkerBreakdown.length === 1 ? satkerBreakdown[0].kodeSatker : 'SATKER');
  const finalSatkerName = extractedNamaSatker || (satkerBreakdown.length === 1 ? satkerBreakdown[0].namaSatker : 'Satuan Kerja');

  return {
    summary: {
      totalRo,
      roKritisCount,
      roPeringatanCount,
      roOptimalCount,
      roUnconfirmedCount,
      currentScoreCaput,
      projectedScoreCaput,
      persenKetercapaianTarget: avgTPCRO > 0 ? Number(Math.min(100, (avgPCRO / avgTPCRO) * 100).toFixed(2)) : 100,
      avgPCRO,
      avgTPCRO,
      totalPagu,
      totalRealisasi,
      persenPenyerapanTotal,
      kodeSatker: finalSatkerCode,
      namaSatker: finalSatkerName,
      periode: extractedPeriode
    },
    satkerBreakdown,
    items,
    uploadedFileName: file.name,
    analyzedAt: new Date().toISOString()
  };
}

/**
 * Export Cleaned & Diagnosed Data to multi-sheet Excel file (.xlsx)
 */
export function exportDiagnostikCaputToExcel(data: DiagnostikCaputResult, fileNamePrefix = 'Analisis_Caput_Satker'): void {
  const wb = XLSX.utils.book_new();

  // 1. Sheet 1: Analisis & Diagnostik RO (Cleaned & Diagnosed)
  const sheet1Data = data.items.map((it, idx) => ({
    'No': idx + 1,
    'Kode Satker': it.kodeSatker,
    'Nama Satker': it.namaSatker,
    'Kode Kegiatan': it.kodeKegiatan || '',
    'Kode KRO': it.kodeKro || '',
    'Kode RO': it.kodeRo,
    'Nama Rincian Output (RO)': it.namaRo,
    'Kolom X (Target RVRO)': it.volumeTarget,
    'Kolom P (Realisasi RO)': it.volumeRealisasi,
    'Kolom Y (Target PCRO %)': it.targetProgres,
    'Kolom Q (Progress RO %)': it.realisasiProgres,
    'Kolom R (Status Konfirmasi KPPN)': it.statusKonfirmasiKppn || 'TERKONFIRMASI',
    'Kolom Z (Nilai Caput)': Number(it.nilaiKomponenRo.toFixed(2)),
    'Deviasi Kinerja (%)': Number(it.gapKinerja.toFixed(2)),
    'GAP PCRO vs PPA (%)': Number(it.gapPpa.toFixed(2)),
    'Pagu Anggaran (Rp)': it.paguAnggaran || 0,
    'Realisasi Belanja (Rp)': it.realisasiAnggaran || 0,
    '% Penyerapan Anggaran (PPA)': Number((it.persenPenyerapan || 0).toFixed(2)),
    'Status Diagnosa': it.diagnosaSeverity,
    'Kode Referensi SAKTI': it.selectedReferensiSakti || '99',
    'Uraian Referensi SAKTI': it.uraianReferensiSakti || '',
    'Status Validasi SAKTI': it.validasiSaktiStatus || 'Valid by System',
    'Judul Diagnosa & Masalah': it.diagnosaTitle,
    'Rekomendasi Tindakan Teknis': it.rekomendasiTindakan.join(' | '),
    'Template Keterangan SAKTI (Siap Salin)': it.templateKeteranganSakti
  }));
  const ws1 = XLSX.utils.json_to_sheet(sheet1Data);
  XLSX.utils.book_append_sheet(wb, ws1, '1. Diagnosa RO Satker');

  // 2. Sheet 2: Template Keterangan SAKTI (Khusus RO yang Perlu Perbaikan)
  const problematicItems = data.items.filter(it => it.diagnosaSeverity !== 'OPTIMAL');
  const sheet2Data = (problematicItems.length > 0 ? problematicItems : data.items).map((it, idx) => ({
    'No': idx + 1,
    'Kode Satker': it.kodeSatker,
    'Kode RO': it.kodeRo,
    'Nama Rincian Output': it.namaRo,
    'Status Diagnosa': it.diagnosaSeverity,
    'Kolom Y (Target PCRO %)': it.targetProgres,
    'Kolom Q (Progress RO %)': it.realisasiProgres,
    'Kolom R (Status Konfirmasi)': it.statusKonfirmasiKppn || 'TERKONFIRMASI',
    'Kolom Z (Nilai Caput)': it.nilaiKomponenRo,
    'Kode Referensi SAKTI': it.selectedReferensiSakti || '07',
    'Uraian Referensi': it.uraianReferensiSakti || '',
    'Template Keterangan SAKTI (Format DJPb)': it.templateKeteranganSakti
  }));
  const ws2 = XLSX.utils.json_to_sheet(sheet2Data);
  XLSX.utils.book_append_sheet(wb, ws2, '2. Template SAKTI');

  const timestamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `${fileNamePrefix}_${data.summary.kodeSatker}_${timestamp}.xlsx`);
}

/**
 * Built-in Demonstration Data
 */
export function getDemoDiagnostikCaputData(): DiagnostikCaputResult {
  const rawList = [
    {
      kodeSatker: '643131',
      namaSatker: 'ROOPS POLDA JATENG',
      kodeProgram: '060.01.WA',
      namaProgram: 'Program Pemeliharaan Keamanan dan Ketertiban Masyarakat',
      kodeKegiatan: '5001',
      namaKegiatan: 'Operasi Kepolisian Terpadu',
      kodeKro: '5001.EBA',
      namaKro: 'Layanan Operasional Kepolisian',
      kodeRo: 'RO-1',
      namaRo: 'Kerjasama Dalam Negeri',
      volumeTarget: 7,          // Kolom X: Target RVRO
      volumeRealisasi: 7,       // Kolom P: Realisasi RO
      targetProgres: 30.0,      // Kolom Y: Target PCRO
      realisasiProgres: 27.0,   // Kolom Q: Progress RO
      statusKonfirmasi: 'TERKONFIRMASI', // Kolom R: Terkonfirmasi (Aman)
      nilaiCaput: 90.0,         // Kolom Z: Nilai = 90.00
      paguAnggaran: 77884615,
      realisasiAnggaran: 7087500,
      keteranganSakti: '',
      selectedRefCode: '02'
    },
    {
      kodeSatker: '643131',
      namaSatker: 'ROOPS POLDA JATENG',
      kodeProgram: '060.01.WA',
      namaProgram: 'Program Pemeliharaan Keamanan dan Ketertiban Masyarakat',
      kodeKegiatan: '5002',
      namaKegiatan: 'Pengamanan VVIP & VIP',
      kodeKro: '5002.QDB',
      namaKro: 'Bantuan Pengamanan Khusus',
      kodeRo: 'RO-2',
      namaRo: 'Pengamanan Kontinjensi dan Pengendalian Konflik Sosial',
      volumeTarget: 1,          // Kolom X: Target RVRO
      volumeRealisasi: 0,       // Kolom P: Realisasi RO
      targetProgres: 100.0,     // Kolom Y: Target PCRO
      realisasiProgres: 55.0,   // Kolom Q: Progress RO
      statusKonfirmasi: 'TIDAK TERKONFIRMASI', // Kolom R: Perhatian Kritis -> Nilai 0 di MyIntress / lapor KPPN
      nilaiCaput: 0.0,          // Kolom Z: Nilai = 0.00 karena Tidak Terkonfirmasi
      paguAnggaran: 120000000,
      realisasiAnggaran: 45000000,
      keteranganSakti: '',
      selectedRefCode: '04'
    },
    {
      kodeSatker: '643131',
      namaSatker: 'ROOPS POLDA JATENG',
      kodeProgram: '060.01.WA',
      namaProgram: 'Program Dukungan Manajemen',
      kodeKegiatan: '5003',
      namaKegiatan: 'Pelayanan Perkantoran Biro Operasi',
      kodeKro: '5003.EBA',
      namaKro: 'Layanan Perkantoran',
      kodeRo: 'RO-3',
      namaRo: 'Layanan Administrasi Umum dan Ketatausahaan',
      volumeTarget: 0,          // Kolom X: Target RVRO
      volumeRealisasi: 0,       // Kolom P: Realisasi RO
      targetProgres: 58.31,     // Kolom Y: Target PCRO
      realisasiProgres: 58.31,  // Kolom Q: Progress RO
      statusKonfirmasi: 'TERKONFIRMASI OTOMATIS',
      nilaiCaput: 100.0,        // Kolom Z: Nilai = 100.00
      paguAnggaran: 250000000,
      realisasiAnggaran: 145775000,
      keteranganSakti: 'Realisasi operasional berjalan normal sesuai target.',
      selectedRefCode: '01'
    },
    {
      kodeSatker: '643131',
      namaSatker: 'ROOPS POLDA JATENG',
      kodeProgram: '060.01.WA',
      namaProgram: 'Program Pemeliharaan Keamanan dan Ketertiban Masyarakat',
      kodeKegiatan: '5004',
      namaKegiatan: 'Pelaksanaan Patroli Presisi',
      kodeKro: '5004.EBA',
      namaKro: 'Patroli Wilayah',
      kodeRo: 'RO-4',
      namaRo: 'Patroli Skala Besar Kamseltibcarlantas',
      volumeTarget: 3,          // Kolom X: Target RVRO
      volumeRealisasi: 3,       // Kolom P: Realisasi RO
      targetProgres: 75.0,      // Kolom Y: Target PCRO
      realisasiProgres: 95.0,   // Kolom Q: Progress RO
      statusKonfirmasi: 'TERKONFIRMASI',
      nilaiCaput: 100.0,        // Kolom Z: Nilai = 100.00
      paguAnggaran: 85000000,
      realisasiAnggaran: 68000000,
      keteranganSakti: 'Patroli skala besar terlaksana melampaui target berkala.',
      selectedRefCode: '01'
    },
    {
      kodeSatker: '643131',
      namaSatker: 'ROOPS POLDA JATENG',
      kodeProgram: '060.01.WA',
      namaProgram: 'Program Dukungan Manajemen',
      kodeKegiatan: '5005',
      namaKegiatan: 'Pengelolaan Sarana Prasarana Operasi',
      kodeKro: '5005.QDC',
      namaKro: 'Sarpras Harkamtibmas',
      kodeRo: 'RO-5',
      namaRo: 'Pemeliharaan Alat Komunikasi dan Perangkat Khusus',
      volumeTarget: 0,          // Kolom X: Target RVRO
      volumeRealisasi: 0,       // Kolom P: Realisasi RO
      targetProgres: 58.31,     // Kolom Y: Target PCRO
      realisasiProgres: 58.31,  // Kolom Q: Progress RO
      statusKonfirmasi: 'TERKONFIRMASI',
      nilaiCaput: 100.0,        // Kolom Z: Nilai = 100.00
      paguAnggaran: 95000000,
      realisasiAnggaran: 55394500,
      keteranganSakti: 'Pemeliharaan berkala tuntas sesuai jadwal.',
      selectedRefCode: '07'
    }
  ];

  const items = rawList.map((r, idx) => diagnoseRO({ ...r, id: `DEMO-RO-${idx + 1}` }));
  const totalRo = items.length;
  const roKritisCount = items.filter(it => it.diagnosaSeverity === 'KRITIS').length;
  const roPeringatanCount = items.filter(it => it.diagnosaSeverity === 'PERINGATAN').length;
  const roOptimalCount = items.filter(it => it.diagnosaSeverity === 'OPTIMAL').length;
  const roUnconfirmedCount = items.filter(it => it.isUnconfirmedKppn).length;

  const sumKomponen = items.reduce((acc, it) => acc + it.nilaiKomponenRo, 0);
  const currentScoreCaput = Number((sumKomponen / totalRo).toFixed(2));

  const sumProjected = items.reduce((acc, it) => {
    if (it.diagnosaSeverity === 'KRITIS' || it.diagnosaSeverity === 'PERINGATAN') {
      return acc + 100;
    }
    return acc + it.nilaiKomponenRo;
  }, 0);
  const projectedScoreCaput = Number((sumProjected / totalRo).toFixed(2));

  const totalPagu = items.reduce((acc, it) => acc + (it.paguAnggaran || 0), 0);
  const totalRealisasi = items.reduce((acc, it) => acc + (it.realisasiAnggaran || 0), 0);
  const persenPenyerapanTotal = Number(((totalRealisasi / totalPagu) * 100).toFixed(2));

  const avgPCRO = Number((items.reduce((acc, it) => acc + it.realisasiProgres, 0) / totalRo).toFixed(2));
  const avgTPCRO = Number((items.reduce((acc, it) => acc + it.targetProgres, 0) / totalRo).toFixed(2));

  const satkerBreakdown: DiagnostikCaputSatkerSummary[] = [
    {
      kodeSatker: '643131',
      namaSatker: 'ROOPS POLDA JATENG',
      totalRo,
      roKritisCount,
      roPeringatanCount,
      roOptimalCount,
      roUnconfirmedCount,
      currentScoreCaput,
      projectedScoreCaput,
      avgPCRO,
      avgTPCRO,
      totalPagu,
      totalRealisasi,
      persenPenyerapan: persenPenyerapanTotal
    }
  ];

  return {
    summary: {
      totalRo,
      roKritisCount,
      roPeringatanCount,
      roOptimalCount,
      roUnconfirmedCount,
      currentScoreCaput,
      projectedScoreCaput,
      persenKetercapaianTarget: Number(((avgPCRO / avgTPCRO) * 100).toFixed(2)),
      avgPCRO,
      avgTPCRO,
      totalPagu,
      totalRealisasi,
      persenPenyerapanTotal,
      kodeSatker: '643131',
      namaSatker: 'ROOPS POLDA JATENG',
      periode: 'Agustus 2026'
    },
    satkerBreakdown,
    items,
    uploadedFileName: 'Detail_Indikator_Kinerja_Detail_Capaian_RO_2026-09-01.xlsx',
    analyzedAt: new Date().toISOString()
  };
}
