import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  HelpCircle, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  Copy, 
  Check, 
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Layers,
  FileText
} from 'lucide-react';

interface SaktiPlaybookAnomaliProps {
  isDark?: boolean;
}

interface AnomalyCase {
  id: string;
  title: string;
  category: 'KONTRAKTUAL' | 'GAP_ANGGARAN' | 'VALIDASI' | 'SISTEM';
  severity: 'TINGGI' | 'SEDANG' | 'RENDAH';
  gejala: string;
  dampak: string;
  kodeRefSakti: string;
  solusiSakti: string[];
  solusiKppn: string[];
  templateNarasi: string;
}

const PLAYBOOK_CASES: AnomalyCase[] = [
  {
    id: 'CASE_01',
    title: 'PCRO Sudah 100% Tetapi RVRO Masih 0 (Menunggu BAST Akhir)',
    category: 'KONTRAKTUAL',
    severity: 'SEDANG',
    gejala: 'Pekerjaan fisik konstruksi atau pengadaan barang telah selesai 100%, namun dokumen Berita Acara Serah Terima (BAST) final belum ditandatangani atau volume belum disahkan.',
    dampak: 'SAKTI akan memunculkan Early Warning (Validasi 05). Nilai Kolom Z terhitung penuh dari PCRO jika TPCRO tercapai, namun berpotensi dipertanyakan saat rekonsiliasi triwulanan.',
    kodeRefSakti: '01',
    solusiSakti: [
      'Input PCRO sebesar 100% dan tetap input RVRO sesuai realisasi riil (misal 0 jika belum ada serah terima parsial).',
      'Pilih Referensi SAKTI: 01) Tahapan Pelaksanaan Kegiatan Belum Selesai / Menunggu BAST.',
      'Lengkapi narasi dengan mencantumkan progres fisik 100% dan nomor/tanggal jadwal rencana BAST.'
    ],
    solusiKppn: [
      'Lampirkan laporan kemajuan pekerjaan dari konsultan pengawas/panitia penerima hasil pekerjaan jika diminta KPPN.',
      'Pastikan pada bulan berikutnya ketika BAST terbit, RVRO langsung diinput 100%.'
    ],
    templateNarasi: 'Aktivitas fisik pekerjaan telah selesai 100% di lapangan. Kendala saat ini dokumen BAST final masih dalam proses penandatanganan para pihak dan pengujian akhir fungsi barang/pekerjaan. Solusi: RVRO akan diinput penuh pada periode pelaporan berikutnya setelah BAST sah ditandatangani.'
  },
  {
    id: 'CASE_02',
    title: 'Penyerapan Anggaran 100% Tapi Realisasi Fisik (PCRO) Jauh Tertinggal (GAP > 20%)',
    category: 'GAP_ANGGARAN',
    severity: 'TINGGI',
    gejala: 'PPA (Penyerapan Anggaran) telah mencapai 100% karena belanja modal/bahan telah dibayarkan penuh diawal, namun tahapan fisik kegiatan baru mencapai sebagian (misal 40%).',
    dampak: 'Memicu Validasi SAKTI 08 (Early Warning GAP Penyerapan vs Fisik > 20%). Berpotensi dicurigai sebagai anomali pencairan dana mendahului prestasi kerja.',
    kodeRefSakti: '08',
    solusiSakti: [
      'Wajib memilih Kode Referensi: 08) GAP Penyerapan Anggaran dan Capaian Output > 20%.',
      'Wajib mengisi narasi minimal 30 karakter yang menjelaskan secara detail mengapa belanja mendahului fisik (misal: pembayaran uang muka/bahan baku impor).'
    ],
    solusiKppn: [
      'Siapkan data pendukung kontrak dan jaminan pembayaran/bank garansi apabila KPPN melakukan klarifikasi lapangan.'
    ],
    templateNarasi: 'Realisasi anggaran 100% dialokasikan untuk pembayaran pengadaan material/komponen utama secara sekaligus diawal sesuai klausul kontrak nomor [No Kontrak]. Kendala: Perakitan dan instalasi fisik masih berjalan bertahap di lapangan (saat ini 45%). Solusi: Percepatan instalasi ditargetkan tuntas pada [Bulan/Minggu Target].'
  },
  {
    id: 'CASE_03',
    title: 'Target Progres (TPCRO) Tidak Realistis / Lompatan Target Mendadak',
    category: 'SISTEM',
    severity: 'TINGGI',
    gejala: 'Target TPCRO pada bulan berjalan melonjak drastis dari bulan sebelumnya (misal dari 20% langsung ke 90%) akibat pembagian target manual di awal tahun yang tidak beraturan.',
    dampak: 'Nilai Kolom Z (Capaian Output) anjlok drastis ke angka merah jika realisasi riil hanya mencapai 50-60%.',
    kodeRefSakti: '05',
    solusiSakti: [
      'Jika periode belum terkunci, sesuaikan proyeksi target di rencana kerja/Halaman III DIPA pada periode revisi triwulanan.',
      'Jika sudah berjalan, pilih Kode Referensi: 05) Kendala Teknis Lapangan atau 06) Perubahan Kebijakan / Jadwal Kegiatan.'
    ],
    solusiKppn: [
      'Ajukan penyesuaian target RPD Halaman III DIPA pada triwulan berikutnya agar trajektori target realistis dengan kurva S pekerjaan.'
    ],
    templateNarasi: 'Target kumulatif TPCRO bulan berjalan (85%) melebihi kapasitas riil tahapan kegiatan. Realisasi PCRO saat ini tercapai 60%. Kendala: Kurva pelaksanaan kegiatan mengalami pergeseran jadwal ke triwulan berikutnya. Solusi: Melakukan penyesuaian target pada pemutakhiran Halaman III DIPA triwulan mendatang.'
  },
  {
    id: 'CASE_04',
    title: 'Revisi DIPA Pertengahan Tahun: Target Volume (TVRO) Naik/Turun',
    category: 'VALIDASI',
    severity: 'SEDANG',
    gejala: 'Satker menerima revisi DIPA yang merubah target volume rincian output (misal dari 10 Layanan menjadi 5 Layanan atau sebaliknya).',
    dampak: 'Berpotensi memicu Validasi 03 (Input Ditolak jika RVRO melebihi TVRO baru) atau Validasi 04 (RVRO naik tapi PCRO tidak bergerak).',
    kodeRefSakti: '06',
    solusiSakti: [
      'Pastikan data DIPA revisi telah ditarik dan di-load sepenuhnya di aplikasi SAKTI sebelum input capaian output.',
      'Sesuaikan kembali proporsi PCRO terhadap TVRO yang baru.',
      'Pilih Kode Referensi: 06) Perubahan Kebijakan/Prioritas atau 04) Penyesuaian Target/Jadwal (Hindari Kode 99).'
    ],
    solusiKppn: [
      'Sertakan nomor surat pengesahan Revisi DIPA Ditjen Anggaran/Kanwil DJPb pada narasi.'
    ],
    templateNarasi: 'Target volume disesuaikan berdasarkan Pengesahan Revisi DIPA nomor [Nomor SP DIPA] tanggal [Tanggal]. Realisasi volume dan progres fisik telah dihitung ulang secara proporsional. Solusi: Pelaksanaan sisa target output akan diselesaikan sesuai alokasi revisi anggaran terbaru.'
  },
  {
    id: 'CASE_05',
    title: 'Pembayaran Kontrak Sistem Termin / Uang Muka Tanpa Progres Fisik Signifikan',
    category: 'KONTRAKTUAL',
    severity: 'SEDANG',
    gejala: 'SP2D Termin pertama atau Uang Muka telah terbit dan menyerap anggaran, namun progres fisik baru tahap mobilisasi alat dan persiapan awal.',
    dampak: 'Muncul peringatan deviasi penyerapan vs fisik > 20% di SAKTI dan MyIntress.',
    kodeRefSakti: '08',
    solusiSakti: [
      'Input PCRO sesuai bobot riil prestasi kerja (misal 15%).',
      'Pilih Referensi 08) GAP Penyerapan vs Fisik > 20% atau 01) Tahapan Pelaksanaan Belum Selesai.',
      'Tuliskan secara jelas bahwa pembayaran merupakan uang muka / termin I.'
    ],
    solusiKppn: [
      'Pastikan jaminan uang muka dan dokumen kontrak termonitor dalam aplikasi SAKTI modul Komitmen.'
    ],
    templateNarasi: 'Realisasi anggaran terserap untuk pembayaran uang muka kerja sebesar 20% sesuai BAP nomor [No BAP]. Realisasi fisik saat ini sebesar 10% (tahap mobilisasi peralatan dan pembersihan lahan). Solusi: Pelaksanaan konstruksi utama dijadwalkan mulai minggu depan dengan target progres mencapai 40% bulan depan.'
  },
  {
    id: 'CASE_06',
    title: 'Terjadi Efisiensi Belanja (Sisa Pagu Tanpa Mengurangi Kuantitas Fisik)',
    category: 'GAP_ANGGARAN',
    severity: 'RENDAH',
    gejala: 'Volume fisik (RVRO) dan Progres (PCRO) telah selesai 100%, namun sisa anggaran masih ada 15-20% akibat efisiensi pengadaan lelang atau diskon harga satuan.',
    dampak: 'PPA bernilai 80-85% sementara PCRO 100%. Terjadi GAP > 15-20%.',
    kodeRefSakti: '07',
    solusiSakti: [
      'Input PCRO 100% dan RVRO = TVRO.',
      'Pilih Kode Referensi: 07) Efisiensi Anggaran.',
      'Narasi mencantumkan bahwa seluruh output telah terwujud 100% dan sisa dana merupakan murni efisiensi.'
    ],
    solusiKppn: [
      'KPPN akan mencatat sebagai performa optimal dengan nilai IKPA maksimal 100.'
    ],
    templateNarasi: 'Target keluaran fisik (RVRO) dan progres (PCRO) telah selesai tercapai 100% dan telah diserahterimakan. Sisa anggaran sebesar [Rp Sisa / %] merupakan hasil efisiensi lelang pengadaan barang/jasa tanpa mengurangi mutu dan volume keluaran rincian output.'
  },
  {
    id: 'CASE_07',
    title: 'Output Bersifat Penilaian Periodik (Triwulanan/Semesteran)',
    category: 'SISTEM',
    severity: 'SEDANG',
    gejala: 'Kegiatan seperti Audit, Evaluasi AKIP, atau Laporan Keuangan yang keluarannya hanya terbit di akhir triwulan atau akhir tahun (bulan 3, 6, 9, 12).',
    dampak: 'Pada bulan 1, 2, 4, 5, nilai realisasi volume (RVRO) tercatat 0 sehingga terindikasi seolah-olah tidak ada perkembangan.',
    kodeRefSakti: '01',
    solusiSakti: [
      'Input PCRO secara bertahap mencerminkan tahapan pengumpulan bahan/data (misal Bulan 1: 30%, Bulan 2: 70%, Bulan 3: 100% dan RVRO = 1).',
      'Gunakan Referensi 01) Tahapan Pelaksanaan Belum Selesai pada bulan-bulan antara.'
    ],
    solusiKppn: [
      'Pastikan jadwal tahapan penyusunan laporan tertuang dalam KAK/TOR kegiatan.'
    ],
    templateNarasi: 'Kegiatan penyusunan laporan bersifat periodik triwulanan. Progres fisik saat ini mencapai [X]% pada tahap analisis data dan perumusan draf awal. Solusi: Laporan final dan dokumen keluaran akan diselesaikan serta disahkan pada akhir periode triwulan bersangkutan.'
  },
  {
    id: 'CASE_08',
    title: 'Data Terkunci di SAKTI Karena Lewat Batas Hari Kerja ke-7',
    category: 'SISTEM',
    severity: 'TINGGI',
    gejala: 'Operator atau PPK terlambat melakukan simpan/approval di aplikasi SAKTI sampai lewat pukul 23:59 WIB pada Hari Kerja ke-7.',
    dampak: 'Form input di SAKTI menjadi Read-Only / Terkunci. Nilai IKPA periode bersangkutan langsung 0 jika tidak ada data sama sekali atau menggunakan data bulan sebelumnya.',
    kodeRefSakti: '09',
    solusiSakti: [
      'Ajukan pembukaan dispensasi periode (Open Period Khusus) kepada KPPN mitra kerja.',
      'Setelah dispensasi disetujui, segera input dan lakukan Approval PPK seketika.'
    ],
    solusiKppn: [
      'Kirim Surat Permohonan Pembukaan Kunci Periode Capaian Output yang ditandatangani KPA disertai alasan keterlambatan dan SPTJM (Surat Pernyataan Tanggung Jawab Mutlak).'
    ],
    templateNarasi: 'Penginputan data capaian output dilakukan melalui mekanisme pembukaan dispensasi periode SAKTI nomor persetujuan KPPN [No Tiket/Surat]. Seluruh rincian progres fisik dan volume telah diverifikasi dan disetujui PPK.'
  },
  {
    id: 'CASE_09',
    title: 'Nilai Kolom Z di MyIntress Berbeda dengan Perhitungan Manual SAKTI',
    category: 'SISTEM',
    severity: 'RENDAH',
    gejala: 'Operator melihat ada perbedaan skor antara tampilan di SAKTI dengan Laporan MyIntress.',
    dampak: 'Kepanikan operator saat rekonsiliasi data IKPA.',
    kodeRefSakti: '09',
    solusiSakti: [
      'Pahami bahwa MyIntress melakukan penarikan data DWH (Data Warehouse) secara batch setiap malam (H+1).',
      'Perubahan yang baru disetujui PPK di SAKTI hari ini baru akan terefleksi di MyIntress keesokan harinya pukul 07:00 WIB.'
    ],
    solusiKppn: [
      'Gunakan data MyIntress cut-off harian untuk acuan resmi evaluasi IKPA Ditjen Perbendaharaan.'
    ],
    templateNarasi: 'Data capaian output telah disetujui oleh PPK pada modul Komitmen SAKTI pada [Tanggal & Waktu]. Data pada aplikasi MyIntress sedang menunggu siklus sinkronisasi harian Data Warehouse (DWH).'
  },
  {
    id: 'CASE_10',
    title: 'Penolakan Verifikasi KPPN Terhadap Penggunaan Kode Referensi 99 (Lain-lain)',
    category: 'VALIDASI',
    severity: 'TINGGI',
    gejala: 'KPPN menolak konfirmasi capaian output karena satker menggunakan Kode 99 tanpa narasi penjelasan yang memadai (kurang dari 3 elemen wajib).',
    dampak: 'Satker diminta memperbaiki narasi keterangan dan berisiko terlambat rekonsiliasi.',
    kodeRefSakti: '99',
    solusiSakti: [
      'Hindari penggunaan Kode 99 jika kondisi kendala dapat dipetakan ke Kode 01 s.d 08.',
      'Jika terpaksa menggunakan Kode 99, wajib menyusun narasi 3 elemen: 1. Tahapan saat ini, 2. Kendala spesifik, 3. Langkah penyelesaian.'
    ],
    solusiKppn: [
      'Gunakan fitur Smart Narrative Builder pada dashboard ini untuk menghasilkan narasi standar 3 elemen yang dijamin lolos verifikasi KPPN.'
    ],
    templateNarasi: 'Aktivitas yang dilaksanakan meliputi [Nama Tahapan Kegiatan]. Kendala yang dihadapi adalah [Uraikan Kendala Unik Secara Jelas]. Solusi dan tindak lanjut: Satker telah mengoordinasikan [Langkah Konkret] dan menargetkan penyelesaian tuntas pada [Waktu Target].'
  }
];

export const SaktiPlaybookAnomaliView: React.FC<SaktiPlaybookAnomaliProps> = ({
  isDark = false
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedCaseId, setSelectedCaseId] = useState<string>(PLAYBOOK_CASES[0].id);
  const [copiedCaseId, setCopiedCaseId] = useState<string | null>(null);

  // Filter cases
  const filteredCases = PLAYBOOK_CASES.filter(c => {
    if (selectedCategory !== 'ALL' && c.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return c.title.toLowerCase().includes(q) || 
        c.gejala.toLowerCase().includes(q) || 
        c.dampak.toLowerCase().includes(q);
    }
    return true;
  });

  const activeCase = PLAYBOOK_CASES.find(c => c.id === selectedCaseId) || PLAYBOOK_CASES[0];

  const handleCopyNarrative = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCaseId(id);
    setTimeout(() => setCopiedCaseId(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className={`p-6 sm:p-8 rounded-3xl border ${
        isDark ? 'bg-slate-800/90 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
      } space-y-4`}>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-cyan-300 text-xs font-bold">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Troubleshooting Playbook &bull; 10 Kasus Anomali Ekstrem Caput SAKTI</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
          Panduan Solusi Cepat &amp; Mitigasi Kendala Lapangan Satker
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-3xl leading-relaxed">
          Kompilasi panduan teknis pemecahan masalah (troubleshooting) untuk menangani 10 skenario anomali pelaporan capaian output, pencegahan penolakan validasi SAKTI, mitigasi deviasi anggaran, dan format narasi lolos verifikasi KPPN.
        </p>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari kendala, kata kunci, BAST, uang muka, GAP > 20%, atau error validasi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-4 py-2.5 text-xs rounded-xl border outline-none font-medium ${
                isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
              }`}
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === 'ALL'
                  ? 'bg-indigo-600 text-white'
                  : isDark ? 'bg-slate-900 text-slate-400' : 'bg-slate-100 text-slate-600'
              }`}
            >
              Semua ({PLAYBOOK_CASES.length})
            </button>
            <button
              onClick={() => setSelectedCategory('KONTRAKTUAL')}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === 'KONTRAKTUAL'
                  ? 'bg-indigo-600 text-white'
                  : isDark ? 'bg-slate-900 text-slate-400' : 'bg-slate-100 text-slate-600'
              }`}
            >
              Kontraktual &amp; BAST
            </button>
            <button
              onClick={() => setSelectedCategory('GAP_ANGGARAN')}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === 'GAP_ANGGARAN'
                  ? 'bg-indigo-600 text-white'
                  : isDark ? 'bg-slate-900 text-slate-400' : 'bg-slate-100 text-slate-600'
              }`}
            >
              GAP Anggaran
            </button>
            <button
              onClick={() => setSelectedCategory('VALIDASI')}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === 'VALIDASI'
                  ? 'bg-indigo-600 text-white'
                  : isDark ? 'bg-slate-900 text-slate-400' : 'bg-slate-100 text-slate-600'
              }`}
            >
              Validasi &amp; DIPA
            </button>
            <button
              onClick={() => setSelectedCategory('SISTEM')}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === 'SISTEM'
                  ? 'bg-indigo-600 text-white'
                  : isDark ? 'bg-slate-900 text-slate-400' : 'bg-slate-100 text-slate-600'
              }`}
            >
              Sistem &amp; Kunci
            </button>
          </div>
        </div>
      </div>

      {/* Main 2-Column Interactive Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left List of Cases */}
        <div className="lg:col-span-5 space-y-2 max-h-[750px] overflow-y-auto pr-1">
          {filteredCases.map((c, idx) => (
            <div
              key={c.id}
              onClick={() => setSelectedCaseId(c.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                selectedCaseId === c.id
                  ? 'bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-500 shadow-md ring-1 ring-indigo-500/20'
                  : isDark ? 'bg-slate-800/80 border-slate-700 hover:bg-slate-800' : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-cyan-300">
                    Kasus #{idx + 1}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                    c.severity === 'TINGGI'
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      : c.severity === 'SEDANG'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  }`}>
                    Prioritas {c.severity}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Ref #{c.kodeRefSakti}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2">
                  {c.title}
                </h4>
                <p className="text-[11px] text-slate-500 line-clamp-2">
                  {c.gejala}
                </p>
              </div>

              <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${
                selectedCaseId === c.id ? 'text-indigo-600 dark:text-cyan-400 translate-x-1' : 'text-slate-400'
              }`} />
            </div>
          ))}
        </div>

        {/* Right Active Case Deep-Dive Detail */}
        <div className="lg:col-span-7">
          <div className={`p-6 rounded-3xl border ${
            isDark ? 'bg-slate-800/90 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
          } space-y-6 sticky top-6`}>
            {/* Header of Active Case */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-cyan-300">
                  {activeCase.category}
                </span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                  Kode Referensi Rekomendasi: {activeCase.kodeRefSakti}
                </span>
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white leading-snug">
                {activeCase.title}
              </h3>
            </div>

            {/* Gejala & Dampak Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-1">
                <strong className="text-amber-800 dark:text-amber-300 font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Gejala &amp; Indikator Masalah:</span>
                </strong>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
                  {activeCase.gejala}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-1">
                <strong className="text-rose-800 dark:text-rose-300 font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Dampak terhadap Nilai IKPA:</span>
                </strong>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
                  {activeCase.dampak}
                </p>
              </div>
            </div>

            {/* Step-by-Step Solutions */}
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-cyan-400 flex items-center gap-1.5 mb-2">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Langkah Solusi Operasional di Aplikasi SAKTI:</span>
                </h4>
                <div className="space-y-2">
                  {activeCase.solusiSakti.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-cyan-300 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="text-slate-700 dark:text-slate-300 leading-relaxed">
                        {step}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Langkah Administratif &amp; Koordinasi KPPN:</span>
                </h4>
                <div className="space-y-2">
                  {activeCase.solusiKppn.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="text-slate-700 dark:text-slate-300 leading-relaxed">
                        {step}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Template Narasi Khusus */}
            <div className="space-y-2 pt-2 border-t border-current/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Template Narasi SAKTI Khusus Kasus Ini:</span>
                </span>
                <button
                  onClick={() => handleCopyNarrative(activeCase.id, activeCase.templateNarasi)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    copiedCaseId === activeCase.id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-cyan-300 border border-indigo-200 dark:border-indigo-800'
                  }`}
                >
                  {copiedCaseId === activeCase.id ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin Narasi</span>
                    </>
                  )}
                </button>
              </div>

              <div className={`p-4 rounded-2xl border font-mono text-xs leading-relaxed select-all ${
                isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}>
                {activeCase.templateNarasi}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
