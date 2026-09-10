import React, { useState } from 'react';
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Target,
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  BookOpen
} from 'lucide-react';

export interface PetunjukIndicatorContent {
  id: string;
  title: string;
  bobot: string;
  aspek: string;
  color: string;
  sumberData: string[];
  langkahPengisian: Array<{
    kolom: string;
    tipe: 'Input' | 'Otomatis' | 'Input/Hitung';
    keterangan: string;
  }>;
  rumusExcel: string;
  penjelasanRumus: string[];
  tipsNilai100: string[];
}

export const PETUNJUK_INDIKATOR_DATA: Record<string, PetunjukIndicatorContent> = {
  'revisi-dipa': {
    id: 'revisi-dipa',
    title: 'Indikator 1: Revisi DIPA',
    bobot: '10%',
    aspek: 'Kualitas Perencanaan Anggaran',
    color: 'indigo',
    sumberData: [
      'SAKTI Modul Penganggaran (Riwayat Revisi DIPA)',
      'Data Matriks Perubahan DIPA dari DJA / Kanwil DJPb',
      'Format Sheet Excel: Revisi DIPA (Baris 5 s.d. 14)'
    ],
    langkahPengisian: [
      { kolom: 'Semester (A5:A14)', tipe: 'Input', keterangan: 'Pilih Semester I atau Semester II.' },
      { kolom: 'Tanggal Pengesahan (B5:B14)', tipe: 'Input', keterangan: 'Tanggal terbit SP DIPA Revisi (DD/MM/YYYY).' },
      { kolom: 'Pagu Menjadi (C5:C14)', tipe: 'Input', keterangan: 'Nominal pagu total setelah pengesahan revisi.' },
      { kolom: 'Pagu DIPA Sebelum (D5:D14)', tipe: 'Input', keterangan: 'Nominal pagu total sebelum pengesahan revisi.' },
      { kolom: 'Jenis Revisi (E5:E14)', tipe: 'Input', keterangan: 'Pilih jenis revisi (Pagu Tetap, Pergeseran, atau Pengecualian 1-14).' },
      { kolom: 'Diperhitungkan? (G5:G14)', tipe: 'Otomatis', keterangan: 'Bernilai 1 jika revisi mengurangi frekuensi, 0 jika masuk jenis pengecualian.' }
    ],
    rumusExcel: "=IF(M15 > 100, 100, M15) di mana M15 dihitung dari frekuensi revisi pagu tetap per semester",
    penjelasanRumus: [
      'Toleransi: Maksimal 1 kali revisi DIPA per semester pada kategori Pagu Tetap.',
      'Jika Revisi Semester I <= 1 kali dan Semester II <= 1 kali, maka Nilai = 100.',
      'Setiap kelebihan revisi pagu tetap akan mengurangi nilai indikator.',
      'Terdapat 14 jenis revisi yang dikecualikan (tidak dihitung sebagai pengurang).'
    ],
    tipsNilai100: [
      'Konsolidasikan seluruh usulan perubahan anggaran dalam 1 kali revisi pagu tetap per semester.',
      'Manfaatkan klausul revisi yang masuk daftar pengecualian (seperti revisi administratif, perubahan akun, atau arahan Presiden/Menteri Keuangan).',
      'Lakukan reviu berkala atas Rencana Penarikan Dana (RPD) sebelum mengajukan usulan revisi DIPA.'
    ]
  },

  'deviasi-hal3': {
    id: 'deviasi-hal3',
    title: 'Indikator 2: Deviasi Halaman III DIPA',
    bobot: '15%',
    aspek: 'Kualitas Perencanaan Anggaran',
    color: 'sky',
    sumberData: [
      'Halaman III DIPA Petikan Satker (Tabel RPD Bulanan per Jenis Belanja)',
      'Laporan Realisasi Anggaran (LRA) Bulanan SAKTI Modul Pelaporan / SPAN',
      'Format Sheet Excel: Deviasi Hal III DIPA (Baris 5 s.d. 16)'
    ],
    langkahPengisian: [
      { kolom: 'Periode (A5:A16)', tipe: 'Otomatis', keterangan: '12 Periode Bulanan (01 = Januari s.d. 12 = Desember).' },
      { kolom: 'Rencana Belanja 51, 52, 53, 57 (B:E)', tipe: 'Input', keterangan: 'Target RPD bulanan per jenis belanja dari Halaman III DIPA.' },
      { kolom: 'Penyerapan Belanja 51, 52, 53, 57 (F:I)', tipe: 'Input', keterangan: 'Realisasi penyerapan anggaran riil per jenis belanja pada bulan tersebut.' },
      { kolom: 'Proporsi Pagu Belanja (R:U)', tipe: 'Input', keterangan: 'Bobot proporsi pagu masing-masing jenis belanja terhadap total pagu satker.' },
      { kolom: 'Deviasi Tertimbang (V:Y)', tipe: 'Otomatis', keterangan: '% Deviasi × Proporsi Pagu. Catatan: Pada Bulan Maret (03), belanja 51 dan 52 diberikan dispensasi 0%.' },
      { kolom: 'Rata-Rata Kumulatif (AA)', tipe: 'Otomatis', keterangan: 'Rata-rata kumulatif deviasi bulanan s.d. bulan berjalan.' }
    ],
    rumusExcel: "=IF(AA16 <= 5, 100, 100 - AA16)",
    penjelasanRumus: [
      'Deviasi nominal = ABS(Penyerapan - Rencana).',
      '% Deviasi dihitung dari Deviasi Nominal dibagi Rencana.',
      'Sesuai ketentuan PER-5/PB/2024, ambang batas toleransi rata-rata deviasi adalah 5%.',
      'Jika rata-rata deviasi kumulatif <= 5%, maka nilai indikator = 100.',
      'Jika rata-rata deviasi > 5%, maka nilai indikator = 100 - rata-rata deviasi.',
      'Evaluasi bulanan berjalan dapat dihitung s.d. bulan cut-off (misalnya September) tanpa menunggu akhir tahun.'
    ],
    tipsNilai100: [
      'Segera lakukan Pemutakhiran Halaman III DIPA pada setiap awal triwulan (Maret, Juni, September) sesuai jadwal kalender RPD.',
      'Sinkronkan jadwal pengadaan/SPK dengan jadwal RPD pada Halaman III DIPA.',
      'Pantau deviasi bulanan per jenis belanja agar rata-rata tertimbangnya tidak melampaui toleransi 5%.'
    ]
  },

  'penyerapan': {
    id: 'penyerapan',
    title: 'Indikator 3: Penyerapan Anggaran',
    bobot: '20%',
    aspek: 'Kualitas Pelaksanaan Anggaran',
    color: 'emerald',
    sumberData: [
      'DIPA Satker (Pagu & Data Blokir per Jenis Belanja: 51, 52, 53, 57)',
      'Laporan Realisasi SP2D SAKTI Modul Pembayaran / OMSPAN',
      'Format Sheet Excel: Penyerapan Anggaran (Baris 5 s.d. 71)'
    ],
    langkahPengisian: [
      { kolom: 'Pagu & Blokir (B:E & F:I)', tipe: 'Input', keterangan: 'Pagu DIPA dan nilai dana yang masih diblokir untuk Belanja Pegawai (51), Barang (52), Modal (53), dan Bansos (57).' },
      { kolom: 'Realisasi Kumulatif (J:M)', tipe: 'Input', keterangan: 'Akumulasi realisasi belanja s.d. akhir periode triwulan/bulan berkenaan.' },
      { kolom: 'Pagu Netto', tipe: 'Otomatis', keterangan: 'Pagu dikurangi blokir. Hanya pagu netto yang menjadi dasar penilaian penyerapan.' },
      { kolom: 'NKPA per Jenis Belanja', tipe: 'Otomatis', keterangan: 'Rasio realisasi terhadap target triwulanan (Belanja 51, 52, 53, 57).' },
      { kolom: 'Nilai Periode (P)', tipe: 'Otomatis', keterangan: 'Penjumlahan tertimbang NKPA seluruh jenis belanja.' }
    ],
    rumusExcel: "=AVERAGE(P17, P35, P53, P71) di mana P17=TW I, P35=TW II, P53=TW III, P71=TW IV",
    penjelasanRumus: [
      'Target minimal penyerapan triwulanan PER-5/PB/2024: TW I: 20% (51), 15% (52), 10% (53); TW II: 50% (51, 52, 53); TW III: 75% (51), 70% (52, 53); TW IV: 95% (51), 90% (52, 53).',
      'Rasio penyerapan maksimal yang dihitung per jenis belanja adalah 100%.',
      'Pagu yang diblokir otomatis dikeluarkan dari perhitungan pagu penyerapan.'
    ],
    tipsNilai100: [
      'Akumulasikan penyerapan sesuai target minimal per triwulan, jangan menumpuk pencairan di akhir tahun.',
      'Segera buka blokir anggaran di awal tahun jika dokumen pemenuhan blokir telah siap.',
      'Percepat proses pengadaan barang/jasa dan penerbitan SPK sejak triwulan I.'
    ]
  },

  'kontraktual': {
    id: 'kontraktual',
    title: 'Indikator 4: Belanja Kontraktual',
    bobot: '10%',
    aspek: 'Kualitas Pelaksanaan Anggaran',
    color: 'amber',
    sumberData: [
      'SAKTI Modul Komitmen (Daftar CAN/Karwas Kontrak & Tanggal BAST)',
      'Data Pendaftaran Kontrak KPPN (SPAN / OMSPAN)',
      'Format Sheet Excel: Belanja Kontraktual'
    ],
    langkahPengisian: [
      { kolom: 'No & Nomor Kontrak', tipe: 'Input', keterangan: 'Nomor identifikasi kontrak/SPK/perjanjian kerja sama.' },
      { kolom: 'Tanggal Kontrak / SPK', tipe: 'Input', keterangan: 'Tanggal penandatanganan kontrak oleh PPK.' },
      { kolom: 'Tanggal Pendaftaran KPPN', tipe: 'Input', keterangan: 'Tanggal penyampaian resume kontrak ke KPPN via SAKTI.' },
      { kolom: 'Nilai Kontrak & Akun', tipe: 'Input', keterangan: 'Nominal kontrak dan akun belanja (Belanja Modal 53 atau Belanja Barang 52).' },
      { kolom: 'Ketepatan Pendaftaran', tipe: 'Otomatis', keterangan: 'Tepat Waktu jika pendaftaran <= 5 Hari Kerja sejak tanggal kontrak.' }
    ],
    rumusExcel: "=ROUND(IF(N29 > 100, 100, N29), 2) dari bobot ketepatan waktu, akselerasi modal, dan kontrak dini",
    penjelasanRumus: [
      'Ketepatan waktu pendaftaran kontrak: Wajib didaftarkan ke KPPN paling lambat 5 hari kerja setelah penandatanganan.',
      'Akselerasi belanja modal (53): Kontrak belanja modal yang diselesaikan sebelum Triwulan III mendapat nilai tambah/akselerasi.',
      'Kontrak dini pra-DIPA: Kontrak yang ditandatangani sebelum tahun anggaran berjalan memberikan insentif nilai.'
    ],
    tipsNilai100: [
      'Daftarkan resume kontrak ke KPPN secara realtime pada hari yang sama atau maksimal 3 hari kerja setelah ditandatangani.',
      'Lakukan pengadaan belanja modal 53 pada awal tahun anggaran agar tuntas sebelum September.',
      'Pastikan dokumen jaminan pelaksanaan dan kelengkapan kontrak telah lengkap sebelum penandatanganan.'
    ]
  },

  'tagihan': {
    id: 'tagihan',
    title: 'Indikator 5: Penyelesaian Tagihan',
    bobot: '10%',
    aspek: 'Kualitas Pelaksanaan Anggaran',
    color: 'violet',
    sumberData: [
      'SAKTI Modul Pembayaran (SPM-LS Kontraktual)',
      'Berita Acara Serah Terima (BAST) / Berita Acara Penyelesaian Pekerjaan (BAPP)',
      'Format Sheet Excel: Penyelesaian Tagihan'
    ],
    langkahPengisian: [
      { kolom: 'Nomor BAST / Dokumen Hak', tipe: 'Input', keterangan: 'Nomor dokumen serah terima pekerjaan/barang.' },
      { kolom: 'Tanggal BAST', tipe: 'Input', keterangan: 'Tanggal penyelesaian pekerjaan yang disepakati.' },
      { kolom: 'Nomor & Tanggal SPM', tipe: 'Input', keterangan: 'Tanggal penerbitan SPM-LS Non-Pegawai oleh PPSPM.' },
      { kolom: 'Hari Kerja (BAST s.d. SPM)', tipe: 'Otomatis', keterangan: 'Jumlah hari kerja antara tanggal BAST dan tanggal SPM (hari libur/akhir pekan tidak dihitung).' },
      { kolom: 'Status Ketepatan', tipe: 'Otomatis', keterangan: 'Tepat Waktu jika <= 17 Hari Kerja; Terlambat jika > 17 Hari Kerja.' }
    ],
    rumusExcel: "=IF(COUNT(D5:D) = 0, 100, (COUNTIF(Status, 'Tepat Waktu') / Total_SPM) * 100)",
    penjelasanRumus: [
      'Batas penyelesaian tagihan kontraktual (SPM-LS non belanja pegawai) adalah maksimal 17 hari kerja sejak timbulnya hak tagih (BAST).',
      'Nilai indikator merupakan persentase jumlah SPM yang tepat waktu (<=17 HK) dibandingkan seluruh SPM yang diajukan.',
      'Jika tidak ada tagihan kontraktual pada satker bersangkutan, nilai default dihitung 100.'
    ],
    tipsNilai100: [
      'Segera verifikasi BAST dan uji kelengkapan dokumen tagihan dalam 3-5 hari pertama.',
      'Tetapkan SOP internal penerbitan SPP maksimal 5 hari kerja dan penerbitan SPM maksimal 5 hari kerja berikutnya.',
      'Hindari menumpuk penandatanganan BAST jika rekanan belum melengkapi tagihan fisik.'
    ]
  },

  'up-tup': {
    id: 'up-tup',
    title: 'Indikator 6: Pengelolaan UP dan TUP',
    bobot: '10%',
    aspek: 'Kualitas Pelaksanaan Anggaran',
    color: 'teal',
    sumberData: [
      'SAKTI Modul Bendahara (Buku Kas Umum, Karwas UP/TUP)',
      'SP2D GUP, SPM PTUP, dan Bukti Setor Sisa UP/TUP (SSPB/SSBP)',
      'Data Transaksi Kartu Kredit Pemerintah (KKP)',
      'Format Sheet Excel: Pengelolaan UP TUP KKP'
    ],
    langkahPengisian: [
      { kolom: 'Ketepatan Revolving UP (Q27)', tipe: 'Input/Hitung', keterangan: 'Persentase revolving GUP minimal 1 kali sebulan (target 100%). Bobot 50% pada UP Tunai.' },
      { kolom: 'GUP Disebulankan (R27)', tipe: 'Input/Hitung', keterangan: 'Realisasi revolving GUP terhadap total pagu UP yang dikelola. Bobot 25% pada UP Tunai.' },
      { kolom: 'Pertanggungjawaban TUP (S27)', tipe: 'Input/Hitung', keterangan: 'Penyelesaian TUP dan penyetoran sisa TUP dalam 30 hari kalender. Bobot 25% pada UP Tunai.' },
      { kolom: 'Pagu & Penggunaan KKP (Sheet KKP)', tipe: 'Input', keterangan: 'Besaran UP KKP dan realisasi transaksi pembayaran belanja dengan KKP setiap bulan.' }
    ],
    rumusExcel: "=ROUND(IF((UP_Tunai*90% + KKP*10%) > 100, 100, UP_Tunai*90% + KKP*10%), 2)",
    penjelasanRumus: [
      'Komposisi bobot: 90% Pengelolaan UP/TUP Tunai + 10% Penggunaan Kartu Kredit Pemerintah (KKP).',
      'Jika satker tidak memiliki kewajiban KKP (besaran KKP = 0), bobot dialihkan 100% ke UP Tunai.',
      'Penggunaan KKP yang melampaui target bulanan dapat memperoleh nilai reward 110.'
    ],
    tipsNilai100: [
      'Lakukan revolving GUP minimal 1 kali per bulan secara disiplin sebelum tanggal 30/31.',
      'Selesaikan dan pertanggungjawabkan TUP tepat waktu sebelum melewati batas 30 hari kalender.',
      'Aktifkan penggunaan KKP untuk belanja operasional dan perjalanan dinas sesuai porsi target triwulanan.'
    ]
  },

  'capaian-output': {
    id: 'capaian-output',
    title: 'Indikator 7: Capaian Output',
    bobot: '25%',
    aspek: 'Kualitas Hasil Pelaksanaan Anggaran',
    color: 'purple',
    sumberData: [
      'SAKTI Modul Komitmen / Pelaporan (Perekaman Capaian Kinerja Output / Rincian Output)',
      'Data Konfirmasi Capaian Output dari KPPN (OMSPAN)',
      'Format Sheet Excel: Capaian Output (Kolom A s.d. AD)'
    ],
    langkahPengisian: [
      { kolom: 'Kode & Nama RO (A:B)', tipe: 'Input', keterangan: 'Daftar seluruh Rincian Output yang dikelola satker sesuai DIPA.' },
      { kolom: 'Target & Realisasi RVRO (F & H)', tipe: 'Input', keterangan: 'Target volume output setahun dan realisasi kumulatif volume output yang telah dihasilkan.' },
      { kolom: 'Target & Realisasi PCRO (N & P)', tipe: 'Input', keterangan: 'Target progres capaian rincian output dan realisasi kumulatif progres fisik (%).' },
      { kolom: 'Status Konfirmasi KPPN (D)', tipe: 'Input', keterangan: 'Wajib berstatus "Terkonfirmasi" agar dihitung valid oleh sistem.' },
      { kolom: 'Tepat Waktu Pelaporan (Tabel Ketepatan)', tipe: 'Input', keterangan: 'Status pelaporan capaian output setiap bulan s.d. batas tanggal 5 hari kerja bulan berikutnya.' }
    ],
    rumusExcel: "=ROUND(AD6 + AD7, 2) di mana AD6 = 30% × Rata2 Ketepatan Waktu, AD7 = 70% × Rata2 Capaian RO",
    penjelasanRumus: [
      'Bobot indikator ini adalah 25% (terbesar di antara seluruh indikator IKPA).',
      'Komponen 1 (Bobot 30%): Rata-rata ketepatan waktu pelaporan bulanan (12 bulan atau s.d. cut-off).',
      'Komponen 2 (Bobot 70%): Rata-rata nilai capaian seluruh Rincian Output (RO).',
      'Nilai Capaian per RO (Kolom R) dihitung dari rasio PCRO dan RVRO dengan toleransi anomali data.'
    ],
    tipsNilai100: [
      'Laporkan data capaian output pada SAKTI setiap awal bulan paling lambat sebelum tanggal 5 hari kerja.',
      'Pastikan seluruh RO mendapatkan konfirmasi valid dari KPPN (hindari status "Belum Terkonfirmasi").',
      'Perbarui progres fisik (PCRO) dan realisasi volume (RVRO) secara bertahap sesuai progres lapangan riil.'
    ]
  },

  'dispensasi-spm': {
    id: 'dispensasi-spm',
    title: 'Faktor Pengurang: Dispensasi SPM',
    bobot: 'Pengurang Nilai',
    aspek: 'Kepatuhan Akhir Tahun Anggaran',
    color: 'rose',
    sumberData: [
      'Surat Persetujuan Dispensasi KPPN / Kanwil DJPb untuk pengajuan SPM terlambat di Triwulan IV',
      'Data Jumlah SPM Triwulan IV dari SAKTI / SPAN',
      'Format Sheet Excel: Dispensasi SPM'
    ],
    langkahPengisian: [
      { kolom: 'Jumlah SPM Triwulan IV (A2)', tipe: 'Input', keterangan: 'Total seluruh SPM yang diajukan satker pada bulan Oktober, November, dan Desember.' },
      { kolom: 'Jumlah Dispensasi SPM (B2)', tipe: 'Input', keterangan: 'Jumlah SPM yang diajukan melebihi batas waktu akhir tahun sehingga memerlukan dispensasi.' },
      { kolom: 'Rasio Dispensasi (C2)', tipe: 'Otomatis', keterangan: 'B2 / A2 (Persentase SPM yang menggunakan dispensasi).' },
      { kolom: 'Pengurang Nilai (D2)', tipe: 'Otomatis', keterangan: 'Nilai penalti pengurang langsung terhadap total nilai IKPA satker.' }
    ],
    rumusExcel: "=IF(C2=0, 0, IF(C2<=0.05, 0.5, IF(C2<=0.1, 1, IF(C2<=0.2, 2, IF(C2<=0.3, 3, 5)))))",
    penjelasanRumus: [
      'Dispensasi SPM bukan merupakan indikator penambah, melainkan PENGURANG NILAI TOTAL IKPA.',
      'Jika rasio dispensasi = 0%, pengurang = 0,00 (tidak ada pengurangan nilai).',
      'Jika rasio > 0% s.d. 5%, pengurang = 0,5 poin.',
      'Jika rasio > 5% s.d. 10%, pengurang = 1,0 poin.',
      'Jika rasio > 10% s.d. 20%, pengurang = 2,0 poin.',
      'Jika rasio > 20% s.d. 30%, pengurang = 3,0 poin.',
      'Jika rasio > 30%, pengurang = 5,0 poin (maksimal penalti).'
    ],
    tipsNilai100: [
      'Cermati Peraturan Direktur Jenderal Perbendaharaan mengenai Pedoman Penerimaan dan Pengeluaran Negara pada Akhir Tahun Anggaran (Langkah-Langkah Akhir Tahun / LLAT).',
      'Ajukan SPM LS Kontraktual dan GUP Nihil sesuai jadwal batching tanpa menunda ke hari-hari terakhir batas pengajuan.',
      'Pastikan tidak ada SPM yang terlambat diajukan ke KPPN agar nilai pengurang tetap 0,00.'
    ]
  }
};

interface PetunjukPengisianCardProps {
  indicatorId?: string;
  defaultExpanded?: boolean;
  className?: string;
  isDark?: boolean;
}

export const PetunjukPengisianCard: React.FC<PetunjukPengisianCardProps> = ({
  indicatorId,
  defaultExpanded = false,
  className = '',
  isDark = false
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [selectedId, setSelectedId] = useState<string>(indicatorId || 'revisi-dipa');

  const activeId = indicatorId || selectedId;
  const currentData = PETUNJUK_INDIKATOR_DATA[activeId] || PETUNJUK_INDIKATOR_DATA['revisi-dipa'];

  return (
    <div
      className={`rounded-2xl border transition-all shadow-sm overflow-hidden ${
        isDark
          ? 'bg-slate-900/90 border-slate-800 text-slate-100'
          : 'bg-white border-slate-200/90 text-slate-800'
      } ${className}`}
    >
      {/* Header Bar */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className={`px-5 py-4 flex items-center justify-between cursor-pointer select-none transition-colors ${
          isDark ? 'hover:bg-slate-800/60' : 'hover:bg-slate-50'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-base tracking-tight">
                Petunjuk Pengisian & Logika Perhitungan
              </span>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                {currentData.title}
              </span>
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                Bobot {currentData.bobot}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Panduan langkah demi langkah, sumber data resmi, formula Excel, dan tips nilai optimal 100
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 hidden sm:inline">
            {isExpanded ? 'Tutup Panduan' : 'Buka Panduan Lengkap'}
          </span>
          <button
            type="button"
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-5 pb-6 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-6">
          {/* Indicator Switcher (if no specific indicatorId passed or in generic view) */}
          {!indicatorId && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 scrollbar-thin">
              {Object.values(PETUNJUK_INDIKATOR_DATA).map(item => (
                <button
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  type="button"
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                    selectedId === item.id
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {item.title.split(':')[0]} ({item.bobot})
                </button>
              ))}
            </div>
          )}

          {/* Grid: Sumber Data & Aspek */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-800/50 border-slate-700/70' : 'bg-slate-50 border-slate-200/80'}`}>
              <div className="flex items-center gap-2 font-semibold text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2">
                <Target className="h-4 w-4" /> Aspek Penilaian & Bobot
              </div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {currentData.aspek}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Kontribusi terhadap Total IKPA Satker: <span className="font-bold text-slate-800 dark:text-slate-100">{currentData.bobot}</span>
              </p>
            </div>

            <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-800/50 border-slate-700/70' : 'bg-slate-50 border-slate-200/80'}`}>
              <div className="flex items-center gap-2 font-semibold text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2">
                <FileSpreadsheet className="h-4 w-4" /> Sumber Data Resmi (SAKTI / SPAN / Excel)
              </div>
              <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                {currentData.sumberData.map((src, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>{src}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Langkah Pengisian Kolom demi Kolom */}
          <div>
            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2 text-slate-800 dark:text-slate-100">
              <Info className="h-4 w-4 text-blue-500" />
              Panduan Kolom Tabel (Input Pengguna vs Perhitungan Otomatis)
            </h4>
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-xs text-left">
                <thead className={`text-slate-600 dark:text-slate-300 font-semibold border-b ${isDark ? 'bg-slate-800/70 border-slate-700' : 'bg-slate-100/80 border-slate-200'}`}>
                  <tr>
                    <th className="px-3.5 py-2.5 w-1/4">Nama Kolom / Format</th>
                    <th className="px-3.5 py-2.5 w-24">Sifat</th>
                    <th className="px-3.5 py-2.5">Keterangan & Aturan Pengisian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {currentData.langkahPengisian.map((row, idx) => (
                    <tr
                      key={idx}
                      className={idx % 2 === 1 ? (isDark ? 'bg-slate-800/30' : 'bg-slate-50/50') : ''}
                    >
                      <td className="px-3.5 py-2.5 font-medium text-slate-700 dark:text-slate-200">
                        {row.kolom}
                      </td>
                      <td className="px-3.5 py-2.5">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                            row.tipe === 'Input'
                              ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                              : 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30'
                          }`}
                        >
                          {row.tipe}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-600 dark:text-slate-300">
                        {row.keterangan}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Formula & Penjelasan Logika Excel */}
          <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-800/40 border-slate-700/60' : 'bg-slate-50 border-slate-200/80'}`}>
            <div className="flex items-center gap-2 font-semibold text-xs text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2">
              <Sparkles className="h-4 w-4" /> Rumus & Logika Excel Sesuai Workbook 2026
            </div>
            <div className="p-2.5 rounded-lg font-mono text-xs bg-slate-900 text-emerald-400 dark:bg-black/60 dark:text-emerald-300 mb-3 overflow-x-auto">
              {currentData.rumusExcel}
            </div>
            <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
              {currentData.penjelasanRumus.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-indigo-500 mt-0.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Tips Strategis Nilai 100 */}
          <div className={`p-4 rounded-xl border ${isDark ? 'bg-amber-950/20 border-amber-900/40 text-amber-200' : 'bg-amber-50/80 border-amber-200 text-amber-900'}`}>
            <div className="flex items-center gap-2 font-semibold text-xs uppercase tracking-wider mb-2 text-amber-700 dark:text-amber-400">
              <Lightbulb className="h-4 w-4" /> Tips Praktis Meraih Nilai 100 (Optimal)
            </div>
            <ul className="space-y-1 text-xs text-slate-700 dark:text-amber-200/90">
              {currentData.tipsNilai100.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-amber-600 dark:text-amber-400 font-bold">✓</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
