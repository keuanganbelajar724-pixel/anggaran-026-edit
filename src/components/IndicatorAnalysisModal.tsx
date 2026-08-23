import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Sparkles, 
  Target, 
  AlertTriangle, 
  Building2, 
  ExternalLink, 
  ShieldCheck, 
  FileText, 
  Lightbulb
} from 'lucide-react';
import { SatkerIKPA, AppTheme } from '../types';

export interface IndicatorAnalysisModalData {
  satker: SatkerIKPA;
  indicatorKey: 'revisiDipa' | 'deviasiHal3Dipa' | 'penyerapanAnggaran' | 'belanjaKontraktual' | 'penyelesaianTagihan' | 'pengelolaanUpTup' | 'dispensasiSpm' | 'capaianOutput';
  value: number;
  category: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Kurang';
  periodLabel?: string;
}

interface IndicatorAnalysisModalProps {
  data: IndicatorAnalysisModalData | null;
  onClose: () => void;
  onSelectSatker: (satker: SatkerIKPA) => void;
  onOpenReminder?: (satker: SatkerIKPA) => void;
  theme?: AppTheme;
}

export const IndicatorAnalysisModal: React.FC<IndicatorAnalysisModalProps> = ({
  data,
  onClose,
  onSelectSatker,
  theme = 'light'
}) => {
  const [activeTab, setActiveTab] = useState<'rekomendasi' | 'ketentuan'>('rekomendasi');

  if (!data) return null;

  const { satker, indicatorKey, value, category } = data;
  const isDark = theme === 'dark';

  const indicatorDetailsMap = {
    revisiDipa: {
      name: 'Revisi DIPA',
      bobot: '10%',
      aspek: 'Kualitas Perencanaan Anggaran',
      target: '≥ 95.00 (Maks. 1 kali revisi per triwulan)',
      regulasi: 'PER-5/PB/2024 Pasal 4 & Petunjuk Teknis IKPA Kemenkeu',
      toleransi: 'Maksimal 1 kali pengesahan revisi dalam kewenangan Kanwil DJPb/DJA per triwulan kalender.',
      masalah: value < 95 
        ? `Satker ${satker.namaSatker} tercatat melakukan frekuensi revisi DIPA melebihi kuota optimal triwulanan (lebih dari 1 kali revisi Kanwil/DJA), yang mengakibatkan penurunan skor indikator ke ${value.toFixed(2)}.`
        : `Satker ${satker.namaSatker} telah menjaga frekuensi revisi anggaran secara optimal dan sesuai batas kuota triwulanan.`,
      rekomendasiSatker: [
        'Lakukan evaluasi rencana kegiatan secara menyeluruh sebelum mengajukan revisi ke Kanwil DJPb / DJA.',
        'Gunakan mekanisme "Single Window Revision" atau revisi terpadu satu kali dalam satu triwulan untuk menampung seluruh kebutuhan pergeseran anggaran.',
        'Prioritaskan revisi dalam kewenangan KPA (pergeseran antar rincian output dalam satu RO) yang tidak mengurangi skor IKPA Revisi DIPA.',
        'Pastikan matriks usulan revisi telah disetujui KPA dan tidak terjadi pengajuan revisi susulan yang berulang dalam triwulan berjalan.'
      ],
      tindakanKPPN: [
        'Menyampaikan rekapitulasi histori pengesahan revisi DIPA Satker pada triwulan berjalan.',
        'Memberikan asistensi penyusunan telaah revisi anggaran komprehensif bersama bagian perencanaan Satker.',
        'Melakukan koordinasi dengan Kanwil DJPb terkait monitoring dispensasi revisi DIPA strategis.'
      ]
    },
    deviasiHal3Dipa: {
      name: 'Deviasi Halaman III DIPA',
      bobot: '10%',
      aspek: 'Kualitas Perencanaan Anggaran',
      target: '≥ 95.00 (Rata-rata deviasi RPD per bulan ≤ 5.0%)',
      regulasi: 'PER-5/PB/2024 Pasal 5 & Modul Pelaksanaan SAKTI',
      toleransi: 'Deviasi bulanan dihitung dari selisih mutlak realisasi SPM per jenis belanja terhadap RPD Hal III DIPA hasil pemutakhiran triwulanan.',
      masalah: value < 95
        ? `Realisasi penarikan dana bulanan Satker ${satker.namaSatker} mengalami selisih/deviasi yang cukup besar terhadap target RPD Halaman III DIPA (skor indikator saat ini: ${value.toFixed(2)}).`
        : `Kesesuaian realisasi bulanan terhadap RPD Halaman III DIPA Satker ${satker.namaSatker} sangat presisi dan terjaga dengan baik.`,
      rekomendasiSatker: [
        'Manfaatkan masa pemutakhiran RPD Halaman III DIPA pada 10 (sepuluh) hari kerja pertama di setiap awal triwulan (Januari, April, Juli, Oktober) pada aplikasi SAKTI.',
        'Susun proyeksi RPD per jenis belanja (51, 52, 53) secara realistis berdasarkan jadwal pelaksanaan kontrak, kalender kegiatan, dan jatuh tempo tagihan pihak ketiga.',
        'Pastikan PPK berkoordinasi erat dengan Pejabat Pengadaan dan Bendahara sebelum memfinalisasi matriks RPD bulanan.',
        'Jika terdapat pergeseran jadwal pekerjaan pada triwulan berjalan, segera sesuaikan rencana SPM agar tidak memicu deviasi di luar toleransi.'
      ],
      tindakanKPPN: [
        'Menerbitkan nota dinas / broadcast pengingat jadwal pemutakhiran RPD Hal III DIPA pada 10 hari kerja pertama awal triwulan.',
        'Membuka layanan konsultasi khusus (Desk Deviasi Hal III) bagi satker dengan deviasi tinggi pada triwulan sebelumnya.',
        'Menyediakan data perbandingan RPD vs Realisasi harian melalui My Intress / SAKTI.'
      ]
    },
    penyerapanAnggaran: {
      name: 'Penyerapan Anggaran',
      bobot: '20%',
      aspek: 'Kualitas Pelaksanaan Anggaran',
      target: '≥ 95.00 (Realisasi Belanja memenuhi target proporsional triwulanan)',
      regulasi: 'PER-5/PB/2024 Pasal 6 (Target: TW I 20%, TW II 50%, TW III 75%, TW IV 95%)',
      toleransi: 'Dihitung per jenis belanja (Belanja Pegawai, Barang, Modal, Bansos) dengan pembobotan sesuai proporsi pagu DIPA Satker.',
      masalah: value < 95
        ? `Realisasi penyerapan anggaran Satker ${satker.namaSatker} belum mencapai target proporsional triwulan berjalan (skor: ${value.toFixed(2)}), berpotensi memicu penumpukan tagihan di akhir tahun.`
        : `Realisasi penyerapan anggaran Satker ${satker.namaSatker} berjalan optimal melampaui target proporsional triwulan.`,
      rekomendasiSatker: [
        'Percepat penyelesaian pekerjaan belanja barang operasional dan pelaksanaan lelang paket pekerjaan belanja modal.',
        'Segera ajukan SPM-LS untuk paket pekerjaan yang telah selesai BAST tanpa menunggu batas akhir bulan.',
        'Bagi satker dengan blokir anggaran (Automatic Adjustment/tanda bintang), segera lengkapi dokumen buka blokir ke DJA / Eselon I kementerian terkait.',
        'Lakukan monitoring realisasi mingguan bersama seluruh PPK dan Bendahara Pengeluaran.'
      ],
      tindakanKPPN: [
        'Monitoring dashboard realisasi belanja Satker harian dan pengiriman alert dini bagi Satker yang realisasinya di bawah ambang batas batas aman.',
        'Membantu satker dalam percepatan proses verifikasi SPP/SPM di FO/BO KPPN Semarang I.',
        'Memberikan bimbingan teknis mekanisme SPM-LS dan UP/TUP bertahap.'
      ]
    },
    belanjaKontraktual: {
      name: 'Belanja Kontraktual',
      bobot: '10%',
      aspek: 'Kualitas Pelaksanaan Anggaran',
      target: '≥ 95.00 (Pendaftaran data kontrak maksimal 3 hari kerja setelah SPK/Kontrak)',
      regulasi: 'PER-5/PB/2024 Pasal 7 & Perdirjen Perbendaharaan',
      toleransi: 'Pendaftaran Nomor Register Kontrak (NRK) ke KPPN maksimal 3 (tiga) hari kerja sejak tanggal penandatanganan kontrak/SPK.',
      masalah: value < 95
        ? `Terdapat kontrak/SPK pada Satker ${satker.namaSatker} yang didaftarkan ke KPPN melebihi batas waktu 3 hari kerja sejak penandatanganan (skor saat ini: ${value.toFixed(2)}).`
        : `Kepatuhan pendaftaran kontrak Satker ${satker.namaSatker} terpelihara sangat baik tepat waktu dalam 3 hari kerja.`,
      rekomendasiSatker: [
        'Pastikan operator Modul Komitmen SAKTI langsung menginput dan mengirimkan ADK Kontrak ke KPPN pada hari yang sama saat SPK/kontrak ditandatangani PPK.',
        'Lakukan pra-verifikasi kelengkapan dokumen pendukung (karwas kontrak, jaminan uang muka, NPWP rekanan, rekening) sebelum tandatangan kontrak.',
        'Percepat proses lelang dini (pra-DIPA) untuk paket-paket pengadaan barang/jasa bernilai besar di awal tahun anggaran.',
        'Catat tanggal penandatanganan kontrak dengan akurat dan hindari penanggalan mundur (backdate) pada dokumen SPK.'
      ],
      tindakanKPPN: [
        'Penerbitan Nomor Register Kontrak (NRK) secara instan (SLA < 1 jam kerja) setelah ADK Kontrak masuk.',
        'Monitoring berkala kontrak-kontrak yang belum terbit NRK pada Modul Komitmen SAKTI.',
        'Konsultasi intensif bersama PPK satker mengenai tata cara addendum kontrak.'
      ]
    },
    penyelesaianTagihan: {
      name: 'Penyelesaian Tagihan (SPM-LS)',
      bobot: '10%',
      aspek: 'Kualitas Pelaksanaan Anggaran',
      target: '≥ 95.00 (Penerbitan SPM-LS non-pihak ketiga maks 17 hari kerja sejak BAST)',
      regulasi: 'PER-5/PB/2024 Pasal 8 & PMK Tata Cara Pembayaran APBN',
      toleransi: 'Batas waktu penerbitan dan pengajuan SPM-LS Kontraktual ke KPPN adalah maksimal 17 (tujuh belas) hari kerja terhitung sejak tanggal BAST/BAP.',
      masalah: value < 95
        ? `Terdapat tagihan SPM-LS pada Satker ${satker.namaSatker} yang diajukan ke KPPN melebihi batas 17 hari kerja sejak tanggal BAST (skor: ${value.toFixed(2)}).`
        : `Satker ${satker.namaSatker} selalu tertib dan tepat waktu memproses tagihan SPM-LS sebelum batas 17 hari kerja.`,
      rekomendasiSatker: [
        'PPK wajib segera menerbitkan SPP-LS maksimal 5 hari kerja setelah BAST/BAP ditandatangani rekanan.',
        'PPSPM memvalidasi kelengkapan berkas dan menerbitkan SPM-LS maksimal 5 hari kerja setelah menerima SPP.',
        'Segera kirimkan ADK SPM ke KPPN Semarang I begitu SPM ditandatangani secara elektronik (TTE) oleh PPSPM.',
        'Gunakan fitur monitoring aging BAST pada Modul Komitmen SAKTI agar tidak ada BAST yang terlewat atau mengendap.'
      ],
      tindakanKPPN: [
        'Pemberitahuan dini daftar tagihan BAST yang mendekati batas jatuh tempo 17 hari kerja.',
        'Percepatan verifikasi SPM masuk di Seksi Pencairan Dana KPPN Semarang I.',
        'Edukasi alur kerja digitalisasi SPM dan tanda tangan elektronik (TTE) tersertifikasi.'
      ]
    },
    pengelolaanUpTup: {
      name: 'Pengelolaan UP dan TUP',
      bobot: '10%',
      aspek: 'Kualitas Pelaksanaan Anggaran',
      target: '≥ 95.00 (Revolving GUP minimal 1x per bulan 50% & pertanggungjawaban TUP 30 hari)',
      regulasi: 'PER-5/PB/2024 Pasal 9 & Peraturan Menteri Keuangan Pengelolaan UP',
      toleransi: 'GUP diajukan minimal 1 kali dalam 30 hari kalender dengan besaran minimal 50% dari besaran pagu UP. TUP wajib diselesaikan dalam 30 hari kalender.',
      masalah: value < 95
        ? `Satker ${satker.namaSatker} mengalami kendala pada ketepatan revolving GUP bulanan atau pertanggungjawaban dana TUP melebihi 30 hari kalender (skor: ${value.toFixed(2)}).`
        : `Pengelolaan revolving UP dan pertanggungjawaban TUP Satker ${satker.namaSatker} sangat tertib dan akuntabel.`,
      rekomendasiSatker: [
        'Bendahara Pengeluaran wajib menjadwalkan pengajuan SPM GUP secara rutin setiap 3 atau 4 minggu tanpa menunggu saldo UP benar-benar habis.',
        'Pastikan persentase revolving GUP mencapai minimal 50% dari total besaran UP yang dikelola satker.',
        'Untuk penggunaan TUP, pastikan seluruh kuitansi telah terverifikasi dan sisa dana TUP disetor kembali ke Kas Negara sebelum hari ke-30.',
        'Manfaatkan fasilitas Digipay / KKP (Kartu Kredit Pemerintah) untuk mempercepat perputaran belanja non-tunai.'
      ],
      tindakanKPPN: [
        'Penerbitan surat pemberitahuan / reminder otomatis menjelang hari ke-25 revolving UP / TUP.',
        'Pemberian asistensi rekonsiliasi kas bendahara pengeluaran dan LPJ Bendahara.',
        'Fasilitasi aktivasi dan optimalisasi penggunaan KKP dan CMS Satker.'
      ]
    },
    dispensasiSpm: {
      name: 'Dispensasi SPM',
      bobot: '5%',
      aspek: 'Kualitas Pelaksanaan Anggaran',
      target: '≥ 95.00 (Zero dispensasi pengajuan SPM terlambat)',
      regulasi: 'PER-5/PB/2024 Pasal 10 & Petunjuk LLAT DJPb',
      toleransi: 'Setiap pengajuan dispensasi keterlambatan SPM ke KPPN / Kanwil mengurangi nilai indikator dispensasi secara proporsional.',
      masalah: value < 95
        ? `Satker ${satker.namaSatker} mengajukan permohonan dispensasi SPM karena melewati batas waktu reguler pengajuan (skor: ${value.toFixed(2)}).`
        : `Satker ${satker.namaSatker} berhasil mempertahankan nol (0) dispensasi SPM selama periode anggaran.`,
      rekomendasiSatker: [
        'Pedomani secara ketat kalender kerja dan surat edaran Langkah-Langkah Akhir Tahun (LLAT) dari KPPN Semarang I.',
        'Hindari penundaan penerbitan SPM belanja rutin maupun kontraktual ke minggu-minggu kritis batas akhir penerimaan SPM.',
        'Tingkatkan koordinasi internal antara Tim Perencana, PPK, PPSPM, dan Bendahara agar berkas administrasi tuntas lebih awal.',
        'Ajukan SPM secara terjadwal sejak awal dan pertengahan bulan.'
      ],
      tindakanKPPN: [
        'Sosialisasi jadwal batas akhir pengajuan SPM (Langkah-Langkah Akhir Tahun / LLAT) secara masif.',
        'Pengawalan khusus bagi Satker dengan proyek strategis nasional (PSN) atau pagu belanja modal besar.',
        'Layanan konsultasi percepatan penerbitan SP2D.'
      ]
    },
    capaianOutput: {
      name: 'Capaian Output SAKTI',
      bobot: '25%',
      aspek: 'Kualitas Hasil Pelaksanaan Anggaran',
      target: '≥ 95.00 (Keluaran RO terlaporkan tepat waktu 100% dan target fisik tercapai)',
      regulasi: 'PER-5/PB/2024 Pasal 11 & Juknis Pelaporan Capaian Output SAKTI',
      toleransi: 'Input data progres capaian rincian output (RO) dilakukan sebelum tanggal cut-off bulanan (maksimal hari kerja ke-5 bulan berikutnya).',
      masalah: value < 95
        ? `Terdapat Rincian Output (RO) pada Satker ${satker.namaSatker} yang belum terlaporkan, terlambat lapor, atau capaian fisik/progres masih 0% (skor: ${value.toFixed(2)}).`
        : `Pelaporan Capaian Output SAKTI Satker ${satker.namaSatker} sangat disiplin, lengkap, dan mencerminkan progres fisik aktual.`,
      rekomendasiSatker: [
        'Operator Pelaporan SAKTI wajib melakukan pengisian data progres capaian output dan progres fisik sebelum tanggal 5 setiap bulan.',
        'Koordinasikan capaian progres fisik lapangan bersama masing-masing Penanggung Jawab Output (PPK/Pejabat Pelaksana Kegiatan).',
        'Pastikan anomali data (misal: realisasi anggaran > 50% namun progres fisik 0%, atau sebaliknya) telah diisi penjelasan/keterangan yang memadai.',
        'Lakukan pengecekan status validasi data Capaian Output pada modul Pelaporan/Komitmen SAKTI hingga status Terlaporkan.'
      ],
      tindakanKPPN: [
        'Monitoring berkala daftar satker yang belum menginput Capaian Output menjelang cut-off bulanan.',
        'Pendampingan teknis dan rekon mandiri Capaian Output SAKTI melalui Seksi MSKI / Manajemen Satker.',
        'Penerbitan surat teguran tertulis bagi Satker yang terlambat menyampaikan laporan capaian output.'
      ]
    }
  };

  const currentDetail = indicatorDetailsMap[indicatorKey] || indicatorDetailsMap.deviasiHal3Dipa;
  const gapScore = Math.max(0, 95.0 - value);

  const content = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-all duration-300"
      />

      {/* Modal Container */}
      <div 
        className={`relative w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl border transition-all my-8 ${
          isDark 
            ? 'bg-slate-900 text-slate-100 border-slate-700/80 shadow-slate-950/90' 
            : 'bg-white text-slate-900 border-slate-200 shadow-slate-900/20'
        }`}
      >
        {/* Top Accent Gradient Header */}
        <div className={`p-6 sm:p-7 border-b relative ${
          category === 'Kurang' 
            ? 'bg-gradient-to-r from-rose-950/40 via-slate-900 to-rose-950/30 border-rose-500/30' 
            : category === 'Cukup'
            ? 'bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/30 border-amber-500/30'
            : 'bg-gradient-to-r from-emerald-950/40 via-slate-900 to-emerald-950/30 border-emerald-500/30'
        }`}>
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-2xl text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer z-10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pr-8">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-sky-400" />
                  ANALISIS &amp; REKOMENDASI PEMBINAAN
                </span>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-slate-800 text-slate-300 border border-slate-700">
                  PER-5/PB/2024
                </span>
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight leading-tight text-white flex items-center gap-2">
                  <span>{currentDetail.name}</span>
                  <span className="text-sm font-extrabold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-lg border border-amber-500/30">
                    Bobot {currentDetail.bobot}
                  </span>
                </h3>
                <p className="text-xs text-slate-300 font-medium mt-1 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{satker.namaSatker}</span>
                  <span className="font-mono text-slate-400 font-bold">({satker.kodeSatker})</span>
                </p>
              </div>
            </div>

            {/* Score Pill Card */}
            <div className={`p-4 rounded-2xl border flex flex-col items-center justify-center shrink-0 min-w-[140px] shadow-lg ${
              category === 'Kurang'
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                : category === 'Cukup'
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
            }`}>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                Nilai Indikator
              </span>
              <span className="text-2xl sm:text-3xl font-black font-mono my-0.5">
                {value.toFixed(2)}
              </span>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                category === 'Kurang' ? 'bg-rose-500/30 text-rose-200' :
                category === 'Cukup' ? 'bg-amber-500/30 text-amber-200' :
                category === 'Baik' ? 'bg-sky-500/30 text-sky-200' :
                'bg-emerald-500/30 text-emerald-200'
              }`}>
                {category}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Selection Bar */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('rekomendasi')}
            className={`pb-3 px-3 text-xs font-black border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'rekomendasi'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Rekomendasi Taktis Satker</span>
          </button>

          <button
            onClick={() => setActiveTab('ketentuan')}
            className={`pb-3 px-3 text-xs font-black border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'ketentuan'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Ketentuan &amp; Regulasi</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-7 max-h-[65vh] overflow-y-auto space-y-6">
          {/* Diagnostic Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className={`p-3 rounded-2xl border ${
              isDark ? 'bg-slate-800/60 border-slate-700/80' : 'bg-slate-50 border-slate-200'
            }`}>
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Target Standar KPPN</span>
              <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">≥ 95.00</span>
              <span className="text-[10px] text-slate-500 block">Kategori Sangat Baik</span>
            </div>

            <div className={`p-3 rounded-2xl border ${
              isDark ? 'bg-slate-800/60 border-slate-700/80' : 'bg-slate-50 border-slate-200'
            }`}>
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Selisih ke Target</span>
              <span className={`text-sm font-black font-mono ${gapScore > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                {gapScore > 0 ? `-${gapScore.toFixed(2)} Poin` : '✓ Optimal'}
              </span>
              <span className="text-[10px] text-slate-500 block">{gapScore > 0 ? 'Perlu Ditingkatkan' : 'Pertahankan'}</span>
            </div>

            <div className={`p-3 rounded-2xl border ${
              isDark ? 'bg-slate-800/60 border-slate-700/80' : 'bg-slate-50 border-slate-200'
            }`}>
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Total IKPA Satker</span>
              <span className="text-sm font-black text-sky-600 dark:text-sky-400 font-mono">
                {satker.nilaiTotalIKPA.toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-500 block">Predikat: {satker.predikat}</span>
            </div>

            <div className={`p-3 rounded-2xl border ${
              isDark ? 'bg-slate-800/60 border-slate-700/80' : 'bg-slate-50 border-slate-200'
            }`}>
              <span className="text-[10px] font-bold text-slate-400 block uppercase">PIC / Kontak Satker</span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate block">
                {satker.namaPic || 'PIC SAKTI / KPA'}
              </span>
              <span className="text-[10px] text-slate-500 font-mono block truncate">
                {satker.noHpPic || 'Belum Ada No HP'}
              </span>
            </div>
          </div>

          {/* TAB 1: REKOMENDASI TAKTIS SATKER */}
          {activeTab === 'rekomendasi' && (
            <div className="space-y-5">
              {/* Diagnosis Alert Box */}
              <div className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
                category === 'Kurang' 
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-950 dark:text-rose-200' 
                  : category === 'Cukup'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-200'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200'
              }`}>
                <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${
                  category === 'Kurang' ? 'text-rose-500' : category === 'Cukup' ? 'text-amber-500' : 'text-emerald-500'
                }`} />
                <div className="space-y-1 text-xs leading-relaxed">
                  <strong className="block text-xs font-extrabold uppercase tracking-wide">
                    Identifikasi Masalah &amp; Akar Penyebab:
                  </strong>
                  <p>{currentDetail.masalah}</p>
                </div>
              </div>

              {/* Action Plan for Satker */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-500 font-bold">
                    <Target className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-black tracking-tight">
                    Langkah Solutif &amp; Aksi Mitigasi Satker (PER-5/PB/2024):
                  </h4>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {currentDetail.rekomendasiSatker.map((rec, idx) => (
                    <div 
                      key={idx}
                      className={`p-3.5 rounded-2xl border flex items-start gap-3 transition-colors ${
                        isDark ? 'bg-slate-800/40 border-slate-700/60' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                        {idx + 1}
                      </div>
                      <p className="text-xs leading-relaxed font-medium text-slate-700 dark:text-slate-200">
                        {rec}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Plan for KPPN */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-500 font-bold">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-black tracking-tight">
                    Langkah Pendampingan &amp; Pembinaan KPPN Semarang I:
                  </h4>
                </div>

                <ul className={`p-4 rounded-2xl border text-xs space-y-2 font-medium ${
                  isDark ? 'bg-slate-800/30 border-slate-700/50 text-slate-300' : 'bg-sky-50/70 border-sky-200 text-sky-950'
                }`}>
                  {currentDetail.tindakanKPPN.map((act, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-sky-500 font-bold">✓</span>
                      <span>{act}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* TAB 2: KETENTUAN & REGULASI */}
          {activeTab === 'ketentuan' && (
            <div className="space-y-4">
              <div className={`p-4 rounded-2xl border space-y-2 text-xs leading-relaxed ${
                isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="font-extrabold text-amber-500 flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  <span>Dasar Hukum &amp; Ketentuan PER-5/PB/2024:</span>
                </div>
                <p><strong>Regulasi:</strong> {currentDetail.regulasi}</p>
                <p><strong>Aspek Penilaian:</strong> {currentDetail.aspek}</p>
                <p><strong>Target Standar:</strong> {currentDetail.target}</p>
                <p><strong>Toleransi &amp; Batas Layering:</strong> {currentDetail.toleransi}</p>
              </div>

              <div className={`p-4 rounded-2xl border text-xs space-y-2 ${
                isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
              }`}>
                <h5 className="font-bold text-slate-900 dark:text-white">Petunjuk Pembinaan KPPN Semarang I:</h5>
                <p className="text-[11px] leading-relaxed">
                  Evaluasi kinerja indikator ditujukan untuk membantu satker mendeteksi dini kendala penyerapan dan kepatuhan norma waktu sebelum periode penilaian ditutup resmi. Satker didorong untuk proaktif berkonsultasi melalui Front Office KPPN atau saluran Helpdesk SAKTI.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/80">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onSelectSatker(satker);
              }}
              className={`px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isDark 
                  ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200' 
                  : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800 shadow-xs'
              }`}
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-500" />
              <span>Lihat Detail Lengkap Profil Satker</span>
            </button>
          </div>

          <div className="flex items-center justify-end gap-2.5">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-black transition-all cursor-pointer hover:opacity-90 shadow-md"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(content, document.body) : null;
};
