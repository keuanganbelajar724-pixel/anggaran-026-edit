import React, { useState, useMemo } from 'react';
import { 
  Award, 
  TrendingUp, 
  CheckCircle2, 
  BookOpen, 
  UserCheck, 
  Zap, 
  Building2, 
  Calendar, 
  Compass, 
  Quote, 
  Sparkles, 
  MapPin, 
  ShieldCheck, 
  Landmark, 
  FileText,
  HeartHandshake,
  Lightbulb,
  Camera,
  Layers,
  ChevronRight,
  Phone,
  Mail,
  Globe,
  Share2,
  Printer,
  ChevronLeft,
  Image as ImageIcon
} from 'lucide-react';
import { BuletinConfig, RealisasiBelanjaSummary, SatkerIKPA } from '../../types';
import { formatRupiahShort, formatRupiahFull } from '../../utils/realisasiBelanjaProcessor';

interface BuletinMagazineLayoutProps {
  buletinConfig: BuletinConfig;
  overallSummary: RealisasiBelanjaSummary | null;
  satkers?: SatkerIKPA[];
  themeStyles: {
    primaryBg: string;
    headerBg: string;
    accentBorder: string;
    badgeBg: string;
    subHeaderBg: string;
    cardBorder: string;
    accentText: string;
  };
}

export const BuletinMagazineLayout: React.FC<BuletinMagazineLayoutProps> = ({
  buletinConfig,
  overallSummary,
  satkers = [],
  themeStyles
}) => {
  const [selectedPageView, setSelectedPageView] = useState<number | 'all'>('all');

  const namaBuletin = buletinConfig.namaBuletin || 'WARTA SEMARANG SATU';
  const tagline = buletinConfig.taglineBuletin || 'Kiprah Perbendaharaan & Kinerja APBN Wilayah KPPN Semarang I';

  // Fallback K/L dataset if no Excel has been uploaded yet
  const fallbackKlList = [
    { no: 1, ba: '076', kl: 'KOMISI PEMILIHAN UMUM KOTA SEMARANG', pagu: 145873424000, realisasi: 112250432688, persen: 76.95 },
    { no: 2, ba: '012', kl: 'KEMENTERIAN PERTAHANAN / KODAM IV DIPONEGORO', pagu: 1825956145000, realisasi: 1206223608892, persen: 66.06 },
    { no: 3, ba: '060', kl: 'KEPOLISIAN NEGARA REPUBLIK INDONESIA / POLDA JATENG', pagu: 897505559000, realisasi: 574464374518, persen: 64.01 },
    { no: 4, ba: '005', kl: 'MAHKAMAH AGUNG REPUBLIK INDONESIA', pagu: 73590435000, realisasi: 45725752528, persen: 62.14 },
    { no: 5, ba: '023', kl: 'KEMENDIKBUDRISTEK / POLINES & PIP SEMARANG', pagu: 932959983000, realisasi: 543340745680, persen: 58.24 },
    { no: 6, ba: '015', kl: 'KEMENTERIAN KEUANGAN (DJP, DJBC, DJKN, DJPb JATENG)', pagu: 139446816000, realisasi: 80203672844, persen: 57.51 },
    { no: 7, ba: '006', kl: 'KEJAKSAAN TINGGI JAWA TENGAH', pagu: 64749550000, realisasi: 36240003391, persen: 55.97 },
    { no: 8, ba: '022', kl: 'KEMENTERIAN PERHUBUNGAN (KSOP / DISTRIK NAVIGASI)', pagu: 391945607000, realisasi: 214387651269, persen: 54.70 },
    { no: 9, ba: '056', kl: 'KEMENTERIAN ATR / BPN PROVINSI JAWA TENGAH', pagu: 55723452000, realisasi: 29463264309, persen: 52.87 },
    { no: 10, ba: '025', kl: 'KEMENTERIAN AGAMA (KANWIL & UIN WALISONGO)', pagu: 695654235000, realisasi: 358584227188, persen: 51.55 },
    { no: 11, ba: '024', kl: 'KEMENTERIAN KESEHATAN (RSUP DR. KARIADI)', pagu: 884710643000, realisasi: 444724180603, persen: 50.27 },
    { no: 12, ba: '033', kl: 'KEMENTERIAN PEKERJAAN UMUM DAN PERUMAHAN RAKYAT', pagu: 1123943650000, realisasi: 523483014231, persen: 46.58 },
    { no: 13, ba: '027', kl: 'KEMENTERIAN SOSIAL (SENTRA TERPADU SOEHARSO)', pagu: 67898268000, realisasi: 30969291877, persen: 45.61 },
    { no: 14, ba: '054', kl: 'BADAN PUSAT STATISTIK PROVINSI JAWA TENGAH', pagu: 34067333000, realisasi: 15733832332, persen: 46.18 },
    { no: 15, ba: '063', kl: 'BALAI BESAR PENGAWAS OBAT DAN MAKANAN SEMARANG', pagu: 14867975000, realisasi: 6296810457, persen: 42.35 },
    { no: 16, ba: '013', kl: 'KEMENTERIAN HUKUM DAN HAM JAWA TENGAH', pagu: 99701686000, realisasi: 40614856281, persen: 40.74 },
    { no: 17, ba: '029', kl: 'KEMENTERIAN LINGKUNGAN HIDUP DAN KEHUTANAN', pagu: 48206546000, realisasi: 18454499471, persen: 38.28 },
    { no: 18, ba: '026', kl: 'KEMENTERIAN KETENAGAKERJAAN (BBPVP SEMARANG)', pagu: 89568845000, realisasi: 31318991497, persen: 34.97 },
    { no: 19, ba: '059', kl: 'KEMENTERIAN KOMUNIKASI DAN DIGITAL (BPSDMP)', pagu: 18966213000, realisasi: 6437586067, persen: 33.94 },
    { no: 20, ba: '040', kl: 'KEMENTERIAN PARIWISATA DAN EKONOMI KREATIF', pagu: 4400000000, realisasi: 1241526000, persen: 28.22 }
  ];

  // Dynamic real K/L data from overallSummary if present
  const klList = useMemo(() => {
    if (overallSummary?.breakdownKementerian && overallSummary.breakdownKementerian.length > 0) {
      return overallSummary.breakdownKementerian.map((k, idx) => ({
        no: idx + 1,
        ba: k.kode || `0${idx + 1}`.slice(-3),
        kl: k.nama.toUpperCase(),
        pagu: k.pagu,
        realisasi: k.realisasi,
        persen: k.persen
      }));
    }
    return fallbackKlList;
  }, [overallSummary]);

  // Helper to render Page Container with A4 aspect ratio
  const renderPageWrapper = (pageNumber: number, title: string, children: React.ReactNode) => {
    if (selectedPageView !== 'all' && selectedPageView !== pageNumber) {
      return null;
    }

    return (
      <div 
        key={pageNumber} 
        id={`buletin-page-${pageNumber}`}
        className="bg-white rounded-2xl shadow-2xl border border-slate-300 overflow-hidden print:border-none print:shadow-none print:rounded-none page-break-after relative flex flex-col justify-between min-h-[1120px] transition-all"
      >
        <div className="flex-1 flex flex-col">
          {children}
        </div>

        {/* Standard Page Footer for pages 2 through 19 */}
        {pageNumber > 1 && pageNumber < 20 && (
          <div className="px-8 py-3 bg-slate-100/90 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500 font-medium">
            <span className="truncate max-w-md">KPPN Tipe A1 Semarang I • {namaBuletin} ({buletinConfig.edisi})</span>
            <span className="font-bold text-slate-700">Halaman {pageNumber}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* 20-Page Selector Toolbar */}
      <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs shadow-xs">
            20P
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wide">
              Struktur Lengkap Majalah (20 Halaman Edisi Cetak &amp; Digital)
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Format Majalah Resmi KPPN Tipe A1 Semarang I Berdasarkan Data Riil &amp; Foto Kustom
            </p>
          </div>
        </div>

        {/* Page Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full py-1">
          <button
            onClick={() => setSelectedPageView('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedPageView === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Tampilkan Semua (20 Hal)
          </button>

          <select
            value={selectedPageView}
            onChange={(e) => setSelectedPageView(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 cursor-pointer"
          >
            <option value="all">📖 Semua 20 Halaman</option>
            <option value="1">Hal 1: Cover Majalah KPPN Semarang I</option>
            <option value="2">Hal 2: Kata Pengantar Kepala KPPN</option>
            <option value="3">Hal 3: Sekilas Tentang Buletin</option>
            <option value="4">Hal 4: Daftar Isi Majalah</option>
            <option value="5">Hal 5: Realisasi Belanja (Infografis)</option>
            <option value="6">Hal 6: Tabel Realisasi Belanja K/L</option>
            <option value="7">Hal 7: Realisasi 5 K/L &amp; Jenis Belanja</option>
            <option value="8">Hal 8: Penyaluran Transfer ke Daerah (TKD)</option>
            <option value="9">Hal 9: Guyub Rukun (Wawancara Satker Bag. 1)</option>
            <option value="10">Hal 10: Guyub Rukun (Wawancara Satker Bag. 2)</option>
            <option value="11">Hal 11: Sarwa Sarwi KPPN (Capacity Building)</option>
            <option value="12">Hal 12: Sarwa Sarwi KPPN (Outbound Tim)</option>
            <option value="13">Hal 13: Sarwa Sarwi KPPN (Purna Bakti)</option>
            <option value="14">Hal 14: Sarwa Sarwi KPPN (River Tubing &amp; Foto)</option>
            <option value="15">Hal 15: Pagelaran Semarang (Semarang Night Carnival)</option>
            <option value="16">Hal 16: Pagelaran Semarang (Bazar UMKM Binaan)</option>
            <option value="17">Hal 17: Teropong Semarang (Kota Lama)</option>
            <option value="18">Hal 18: Teropong Semarang (Lawang Sewu &amp; Johar)</option>
            <option value="19">Hal 19: Zona Integritas &amp; Pantun Antikorupsi</option>
            <option value="20">Hal 20: Back Cover &amp; Info Kontak KPPN</option>
          </select>
        </div>
      </div>

      <div id="buletin-magazine-container" className="max-w-4xl mx-auto space-y-12 print:space-y-0 text-slate-900">
        
        {/* ========================================================================= */}
        {/* HALAMAN 1: COVER MAJALAH RESMI KPPN SEMARANG I (Format Full Color)       */}
        {/* ========================================================================= */}
        {renderPageWrapper(1, 'Cover', (
          <div className="flex-1 flex flex-col justify-between p-8 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white relative overflow-hidden min-h-[1100px]">
            {/* Background Image / Pattern */}
            {buletinConfig.fotoCoverUrl ? (
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-overlay pointer-events-none"
                style={{ backgroundImage: `url(${buletinConfig.fotoCoverUrl})` }}
              />
            ) : (
              <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
            )}
            
            {/* Top Brand Banner */}
            <div className="relative z-10 flex items-center justify-between border-b border-white/20 pb-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-400 text-slate-950 flex flex-col items-center justify-center font-black shadow-xl">
                  <span className="text-sm tracking-tighter leading-none">KPPN</span>
                  <span className="text-xs tracking-widest leading-none font-extrabold text-slate-800">026</span>
                </div>
                <div>
                  <div className="text-[11px] tracking-widest uppercase font-bold text-amber-300">
                    KEMENTERIAN KEUANGAN REPUBLIK INDONESIA • DJPb
                  </div>
                  <div className="text-sm sm:text-base font-black tracking-wide">
                    KPPN TIPE A1 SEMARANG I
                  </div>
                  <div className="text-[10px] text-slate-300">
                    Mengawal APBN, Membangun Negeri • InTress Treasury
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="inline-block px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-amber-400 text-slate-950 shadow-md">
                  {buletinConfig.edisi}
                </div>
                <div className="text-xs text-slate-300 font-bold mt-1">
                  {buletinConfig.bulanTahun}
                </div>
              </div>
            </div>

            {/* Central Visual & Magazine Masthead */}
            <div className="relative z-10 my-auto py-8 space-y-6 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-amber-300 font-black text-xs tracking-widest uppercase shadow-sm">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>BULETIN RESMI PERBENDAHARAAN</span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white drop-shadow-lg font-serif">
                {namaBuletin}
              </h1>

              <div className="w-24 h-1.5 bg-amber-400 mx-auto rounded-full" />

              <p className="text-sm sm:text-lg text-amber-100/90 font-medium max-w-xl mx-auto italic">
                "{tagline}"
              </p>

              {/* Cover Feature Card */}
              <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 max-w-2xl mx-auto text-left shadow-2xl space-y-3">
                <div className="text-xs uppercase font-bold tracking-wider text-amber-300">Fokus Laporan Utama:</div>
                <h2 className="text-xl sm:text-2xl font-black text-white leading-snug">
                  {buletinConfig.judulUtama}
                </h2>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {buletinConfig.subJudul}
                </p>
              </div>
            </div>

            {/* Bottom Highlights Bar */}
            <div className="relative z-10 grid grid-cols-2 gap-4 pt-6 border-t border-white/20 text-xs">
              <div className="p-3.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10">
                <span className="text-[10px] uppercase font-bold text-amber-300 block">
                  {buletinConfig.coverHighlight1 ? 'HIGHLIGHT 1' : 'RUBRIK SARWA SARWI'}
                </span>
                <span className="font-extrabold text-white text-sm">
                  {buletinConfig.coverHighlight1 || 'CAPACITY BUILDING: SINERGI & KOLABORASI TINGKATKAN PRESTASI'}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10">
                <span className="text-[10px] uppercase font-bold text-amber-300 block">
                  {buletinConfig.coverHighlight2 ? 'HIGHLIGHT 2' : 'RUBRIK PAGELARAN SEMARANG'}
                </span>
                <span className="font-extrabold text-white text-sm">
                  {buletinConfig.coverHighlight2 || 'FESTIVAL KOTA LAMA & AKSELERASI PRODUK UMKM BINAAN'}
                </span>
              </div>
            </div>
          </div>
        ))}


        {/* ========================================================================= */}
        {/* HALAMAN 2: KATA PENGANTAR KEPALA KPPN SEMARANG I                         */}
        {/* ========================================================================= */}
        {renderPageWrapper(2, 'Kata Pengantar', (
          <div className="p-10 space-y-8 flex-1 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="border-b-2 border-slate-900 pb-3 flex items-center justify-between">
                <h2 className="text-3xl font-black text-slate-900 font-serif tracking-tight">Kata Pengantar</h2>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Editorial KPPN Semarang I</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                <div className="md:col-span-2 space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed text-justify">
                  <p>
                    Dengan rasa syukur kami panjatkan segala puji kehadirat Allah SWT, Tuhan Yang Maha Esa. Dengan izin dan kehendak-Nya, kami dengan bangga mempersembahkan <strong>{namaBuletin}</strong> edisi <strong>{buletinConfig.edisi}</strong> kepada seluruh mitra kerja Satuan Kerja Kementerian/Lembaga serta para pemangku kepentingan.
                  </p>
                  <p>
                    Di tengah lonjakan transformasi digital perbendaharaan yang kian terakselerasi melalui implementasi SAKTI, KPPN Tipe A1 Semarang I berkomitmen untuk senantiasa menyajikan inovasi publikasi digital yang transparan, akuntabel, dan memberikan kemudahan akses data kinerja fiskal di mana pun dan kapan pun.
                  </p>
                  <p>
                    {buletinConfig.sambutanKepala}
                  </p>
                  <p>
                    Kami berharap bahwa informasi yang kami sajikan dalam buletin ini akan memberikan wawasan yang berharga bagi semua kalangan. Terutama bagi para Kuasa Pengguna Anggaran (KPA), Pejabat Pembuat Komitmen (PPK), Pejabat Penandatangan SPM (PPSPM), dan Bendahara Pengeluaran dalam mengawal ketepatan pelaksanaan anggaran serta memitigasi deviasi Halaman III DIPA.
                  </p>
                  <p>
                    Selamat membaca dan semoga Anda menikmati setiap untaian rubrik yang kami hadirkan demi penguatan tata kelola keuangan negara yang semakin prima.
                  </p>
                </div>

                {/* Profile Box Kepala KPPN */}
                <div className="md:col-span-1 p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-4 shadow-sm">
                  {buletinConfig.fotoKepalaUrl ? (
                    <div className="w-36 h-44 mx-auto rounded-xl overflow-hidden shadow-md border-2 border-slate-300">
                      <img 
                        src={buletinConfig.fotoKepalaUrl} 
                        alt={buletinConfig.namaKepalaKantor} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-32 h-40 mx-auto rounded-xl bg-gradient-to-br from-blue-700 to-indigo-900 text-white flex flex-col items-center justify-center p-2 shadow-md relative overflow-hidden">
                      <UserCheck className="w-12 h-12 text-amber-300 mb-2" />
                      <span className="text-[10px] uppercase font-bold text-slate-200">Foto Resmi</span>
                      <span className="text-[9px] text-amber-300 font-bold">KPPN SEMARANG I</span>
                    </div>
                  )}

                  <div className="space-y-1">
                    <div className="inline-block px-3 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[11px] uppercase tracking-wider">
                      {buletinConfig.namaKepalaKantor}
                    </div>
                    <p className="text-[11px] font-bold text-slate-600 uppercase">
                      {buletinConfig.jabatanKepala || 'Kepala KPPN Tipe A1 Semarang I'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}


        {/* ========================================================================= */}
        {/* HALAMAN 3: SEKILAS TENTANG BULETIN & RUBRIKASI                            */}
        {/* ========================================================================= */}
        {renderPageWrapper(3, 'Sekilas Tentang', (
          <div className="p-10 space-y-6 flex-1 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b-2 border-slate-900 pb-3">
                <span className="px-3 py-1 rounded-md bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider">
                  SEKILAS TENTANG
                </span>
                <h2 className="text-2xl font-black text-slate-900 font-serif">
                  {namaBuletin} (KPPN Tipe A1 Semarang I)
                </h2>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed text-justify">
                <p>
                  {buletinConfig.sekilasBuletin || `Buletin ${namaBuletin} merupakan media publikasi berkala yang disusun secara mandiri oleh Seksi Manajemen Satker dan Kepatuhan Internal (MSKI) KPPN Tipe A1 Semarang I. Buletin ini diterbitkan sebagai sarana penyebarluasan informasi kinerja perbendaharaan, edukasi regulasi pengelolaan keuangan negara, serta wadah sinergi dan penguatan integritas bersama seluruh Satuan Kerja mitra kerja.`}
                </p>

                <p>
                  Setiap edisinya, <strong>{namaBuletin}</strong> mengangkat tema kontekstual dengan 5 (lima) rubrikasi utama:
                </p>

                <div className="space-y-3 pt-2">
                  <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">1</span>
                    <div>
                      <strong className="text-blue-950 text-xs font-black uppercase">Realisasi Belanja &amp; Kinerja APBN:</strong>
                      <p className="text-xs text-slate-600 mt-0.5">Menyajikan ringkasan penyerapan anggaran, evaluasi IKPA satker, dan analisis per jenis belanja di wilayah kerja Semarang.</p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">2</span>
                    <div>
                      <strong className="text-emerald-950 text-xs font-black uppercase">Guyub Rukun:</strong>
                      <p className="text-xs text-slate-600 mt-0.5">Wawancara eksklusif dan bedah praktik baik bersama Satker peraih predikat IKPA terbaik dan pengelola keuangan berprestasi.</p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-100 flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">3</span>
                    <div>
                      <strong className="text-purple-950 text-xs font-black uppercase">Sarwa Sarwi KPPN:</strong>
                      <p className="text-xs text-slate-600 mt-0.5">Liputan kegiatan internal pegawai, capacity building, pembinaan mental, dan momen kebersamaan insan KPPN Semarang I.</p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-100 flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">4</span>
                    <div>
                      <strong className="text-amber-950 text-xs font-black uppercase">Pagelaran Semarang:</strong>
                      <p className="text-xs text-slate-600 mt-0.5">Pojok kebudayaan lokal Kota Semarang, festival rakyat, dan pemberdayaan produk UMKM binaan Kemenkeu Satu.</p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-100 flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">5</span>
                    <div>
                      <strong className="text-rose-950 text-xs font-black uppercase">Teropong Semarang &amp; Zona Integritas:</strong>
                      <p className="text-xs text-slate-600 mt-0.5">Ulasan ikon wisata bersejarah (Kota Lama, Lawang Sewu) serta pantun dan komitmen layanan WBBM tanpa korupsi.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}


        {/* ========================================================================= */}
        {/* HALAMAN 4: DAFTAR ISI MAJALAH (Format 20 Halaman Lengkap)                */}
        {/* ========================================================================= */}
        {renderPageWrapper(4, 'Daftar Isi', (
          <div className="p-10 space-y-6 flex-1 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="border-b-2 border-slate-900 pb-3 flex items-center justify-between">
                <h2 className="text-3xl font-black text-slate-900 font-serif tracking-tight">Daftar Isi</h2>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{namaBuletin}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-xs">
                
                <div className="flex items-center justify-between py-1.5 border-b border-slate-200">
                  <span className="font-semibold text-slate-700">Cover Depan Majalah</span>
                  <span className="font-mono font-bold text-slate-900">01</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-200">
                  <span className="font-semibold text-slate-700">Kata Pengantar Kepala KPPN</span>
                  <span className="font-mono font-bold text-slate-900">02</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-200">
                  <span className="font-semibold text-slate-700">Sekilas Tentang Buletin</span>
                  <span className="font-mono font-bold text-slate-900">03</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-200">
                  <span className="font-semibold text-slate-700">Daftar Isi</span>
                  <span className="font-mono font-bold text-slate-900">04</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-200">
                  <span className="font-bold text-blue-900">Realisasi Belanja (Infografis Utama)</span>
                  <span className="font-mono font-bold text-blue-900">05</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-200">
                  <span className="font-bold text-blue-900">Pagu &amp; Realisasi Belanja K/L</span>
                  <span className="font-mono font-bold text-blue-900">06</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-200">
                  <span className="font-bold text-blue-900">Realisasi 5 K/L Terbesar &amp; Jenis Belanja</span>
                  <span className="font-mono font-bold text-blue-900">07</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-200">
                  <span className="font-bold text-blue-900">Penyaluran Transfer Ke Daerah (TKD)</span>
                  <span className="font-mono font-bold text-blue-900">08</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-200">
                  <span className="font-bold text-emerald-900">Guyub Rukun: Wawancara Satker (Bag. 1)</span>
                  <span className="font-mono font-bold text-emerald-900">09</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-200">
                  <span className="font-bold text-emerald-900">Guyub Rukun: Praktik Baik (Bag. 2)</span>
                  <span className="font-mono font-bold text-emerald-900">10</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-200">
                  <span className="font-bold text-purple-900">Sarwa Sarwi: Capacity Building (Bag. 1)</span>
                  <span className="font-mono font-bold text-purple-900">11</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-200">
                  <span className="font-bold text-purple-900">Sarwa Sarwi: Outbound Tim (Bag. 2)</span>
                  <span className="font-mono font-bold text-purple-900">12</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-200">
                  <span className="font-bold text-purple-900">Sarwa Sarwi: Penghormatan Purnabakti</span>
                  <span className="font-mono font-bold text-purple-900">13</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-200">
                  <span className="font-bold text-purple-900">Sarwa Sarwi: River Tubing &amp; Keseruan</span>
                  <span className="font-mono font-bold text-purple-900">14</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-200">
                  <span className="font-bold text-amber-900">Pagelaran: Pawai Budaya Kota Semarang</span>
                  <span className="font-mono font-bold text-amber-900">15</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-200">
                  <span className="font-bold text-amber-900">Pagelaran: Pemberdayaan UMKM Binaan</span>
                  <span className="font-mono font-bold text-amber-900">16</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-200">
                  <span className="font-bold text-rose-900">Teropong: Pesona Kawasan Kota Lama</span>
                  <span className="font-mono font-bold text-rose-900">17</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-200">
                  <span className="font-bold text-rose-900">Teropong: Lawang Sewu &amp; Pasar Johar</span>
                  <span className="font-mono font-bold text-rose-900">18</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-200">
                  <span className="font-bold text-slate-900">Zona Integritas &amp; Pantun Antikorupsi</span>
                  <span className="font-mono font-bold text-slate-900">19</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-200">
                  <span className="font-semibold text-slate-700">Back Cover: Info &amp; Kontak KPPN</span>
                  <span className="font-mono font-bold text-slate-900">20</span>
                </div>

              </div>
            </div>
          </div>
        ))}


        {/* ========================================================================= */}
        {/* HALAMAN 5: REALISASI BELANJA KPPN SEMARANG I (INFOGRAFIS PERSIS CONTOH)    */}
        {/* ========================================================================= */}
        {renderPageWrapper(5, 'Realisasi Belanja', (
          <div className="p-10 space-y-6 flex-1 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="text-center space-y-1 border-b-2 border-slate-900 pb-3">
                <h2 className="text-2xl sm:text-3xl font-black text-blue-900 font-serif uppercase tracking-tight">
                  REALISASI BELANJA
                </h2>
                <h3 className="text-lg sm:text-xl font-extrabold text-amber-500 uppercase tracking-wide">
                  KPPN SEMARANG I
                </h3>
              </div>

              {overallSummary && (
                <div className="space-y-6">
                  {/* Hero Summary Box */}
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white text-center space-y-3 shadow-lg">
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-xl mx-auto">
                      Realisasi belanja negara dalam lingkup KPPN Tipe A1 Semarang I untuk periode {buletinConfig.bulanTahun} telah mencapai <strong>{overallSummary.persenRealisasiTotal.toFixed(2)}%</strong> atau sebesar <strong>{formatRupiahShort(overallSummary.totalRealisasi)}</strong> dari total pagu kelolaan sebesar <strong>{formatRupiahShort(overallSummary.totalPagu)}</strong>.
                    </p>

                    <div className="grid grid-cols-2 gap-4 pt-3 max-w-md mx-auto">
                      <div className="p-3 rounded-xl bg-white/10 border border-white/10">
                        <div className="text-[10px] text-slate-300 font-bold uppercase">TOTAL PAGU</div>
                        <div className="text-xl font-black text-amber-300">{formatRupiahShort(overallSummary.totalPagu)}</div>
                      </div>
                      <div className="p-3 rounded-xl bg-white/10 border border-white/10">
                        <div className="text-[10px] text-slate-300 font-bold uppercase">TOTAL REALISASI</div>
                        <div className="text-xl font-black text-emerald-300">{formatRupiahShort(overallSummary.totalRealisasi)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Per Jenis Belanja Breakdown (Like Page 5 in Wong Solo) */}
                  <div className="space-y-3">
                    <div className="text-center font-black text-sm uppercase text-slate-800 tracking-wider">
                      <span className="px-4 py-1 rounded-full bg-blue-600 text-white">Per Jenis Belanja</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-2">
                      {overallSummary.breakdownJenisBelanja.map(item => (
                        <div key={item.kode} className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-center space-y-2 shadow-2xs">
                          <div className="font-extrabold text-xs text-slate-800 uppercase">{item.nama}</div>
                          <div className="text-xl font-black" style={{ color: item.color }}>
                            {formatRupiahShort(item.realisasi)}
                          </div>
                          <div className="text-[10px] text-slate-500 font-bold">
                            Capaian: {item.persen.toFixed(2)}%
                          </div>
                          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${Math.min(100, item.persen)}%`, backgroundColor: item.color }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed text-justify bg-slate-50 p-4 rounded-xl border border-slate-200">
                    Realisasi belanja negara dalam lingkup KPPN Semarang I terdiri dari Belanja Pegawai (51), Belanja Barang (52), Belanja Modal (53), dan Belanja Bantuan Sosial (57). Alokasi belanja disalurkan langsung kepada Satker Kementerian/Lembaga guna mendukung pelayanan publik, pendidikan, pertahanan, serta pembangunan infrastruktur strategis di wilayah Jawa Tengah.
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}


        {/* ========================================================================= */}
        {/* HALAMAN 6: TABEL PAGU & REALISASI K/L LINGKUP KPPN SEMARANG I (Persis Hal 6) */}
        {/* ========================================================================= */}
        {renderPageWrapper(6, 'Tabel Realisasi K/L', (
          <div className="p-8 space-y-4 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2">
                <div>
                  <h2 className="text-xl font-black text-slate-900 font-serif uppercase">
                    Pagu dan Realisasi Belanja K/L Lingkup KPPN
                  </h2>
                  <p className="text-[10px] text-slate-500">
                    Sumber Data: Rekapitulasi Realisasi Belanja OM-SPAN per {buletinConfig.bulanTahun}
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-[10px] font-extrabold uppercase">
                  KPPN SEMARANG I
                </span>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-xs">
                <table className="w-full text-[10px] text-left border-collapse">
                  <thead className="bg-slate-900 text-white font-bold uppercase">
                    <tr>
                      <th className="py-2 px-2 text-center w-8">NO</th>
                      <th className="py-2 px-2 text-center w-12">BA</th>
                      <th className="py-2 px-3">KEMENTERIAN / LEMBAGA (K/L)</th>
                      <th className="py-2 px-3 text-right">PAGU</th>
                      <th className="py-2 px-3 text-right">REALISASI</th>
                      <th className="py-2 px-2 text-center w-14">%</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {klList.map((row, idx) => (
                      <tr key={row.ba} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                        <td className="py-1.5 px-2 text-center font-bold text-slate-500">{row.no}</td>
                        <td className="py-1.5 px-2 text-center font-mono font-bold text-slate-700">{row.ba}</td>
                        <td className="py-1.5 px-3 font-semibold text-slate-900 truncate max-w-xs">{row.kl}</td>
                        <td className="py-1.5 px-3 text-right font-mono text-slate-700">{formatRupiahShort(row.pagu)}</td>
                        <td className="py-1.5 px-3 text-right font-mono font-bold text-emerald-700">{formatRupiahShort(row.realisasi)}</td>
                        <td className="py-1.5 px-2 text-center font-bold">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] ${row.persen >= 50 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                            {row.persen.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))}


        {/* ========================================================================= */}
        {/* HALAMAN 7: REALISASI 5 K/L TERBESAR & GRAFIK (Persis Hal 7)                */}
        {/* ========================================================================= */}
        {renderPageWrapper(7, 'Grafik Realisasi', (
          <div className="p-10 space-y-6 flex-1 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="border-b-2 border-slate-900 pb-3">
                <h2 className="text-xl font-black text-slate-900 font-serif uppercase">
                  Realisasi Belanja 5 K/L Terbesar TA 2026 Lingkup KPPN Semarang I
                </h2>
              </div>

              {/* Bar Chart Representation */}
              <div className="space-y-3.5 p-5 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-end gap-4 text-[11px] font-bold">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-amber-500" />
                    <span>Pagu Anggaran</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-blue-600" />
                    <span>Realisasi</span>
                  </div>
                </div>

                {klList.slice(0, 5).map(item => (
                  <div key={item.ba} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-800">
                      <span className="truncate max-w-sm">{item.kl}</span>
                      <span className="text-blue-700 font-black">{item.persen.toFixed(2)}% ({formatRupiahShort(item.realisasi)})</span>
                    </div>
                    <div className="grid grid-cols-1 gap-1">
                      <div className="w-full bg-slate-200 h-3 rounded-md overflow-hidden flex">
                        <div className="bg-amber-500 h-full" style={{ width: '100%' }} title={`Pagu: ${formatRupiahShort(item.pagu)}`} />
                      </div>
                      <div className="w-full bg-slate-200 h-3 rounded-md overflow-hidden flex">
                        <div className="bg-blue-600 h-full" style={{ width: `${Math.min(100, item.persen)}%` }} title={`Realisasi: ${formatRupiahShort(item.realisasi)}`} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagu vs Realisasi Per Jenis Belanja */}
              <div className="space-y-3 pt-2">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                  Pagu dan Realisasi Per Jenis Belanja TA 2026
                </h3>

                {overallSummary && (
                  <div className="space-y-2.5 p-4 rounded-xl border border-slate-200 bg-white">
                    {overallSummary.breakdownJenisBelanja.map(jb => (
                      <div key={jb.kode} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50">
                        <span className="font-bold text-slate-800 w-32 truncate">{jb.nama}</span>
                        <div className="flex-1 mx-4 bg-slate-200 h-2.5 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${Math.min(100, jb.persen)}%`, backgroundColor: jb.color }} />
                        </div>
                        <div className="text-right font-mono font-bold w-24">
                          <span className="text-emerald-700">{jb.persen.toFixed(1)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}


        {/* ========================================================================= */}
        {/* HALAMAN 8: PENYALURAN TRANSFER KE DAERAH (TKD) (Persis Hal 8)              */}
        {/* ========================================================================= */}
        {renderPageWrapper(8, 'Transfer Ke Daerah', (
          <div className="p-10 space-y-6 flex-1 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="text-center space-y-1 border-b-2 border-slate-900 pb-3">
                <h2 className="text-2xl font-black text-blue-900 font-serif uppercase">
                  TRANSFER KE DAERAH (TKD)
                </h2>
                <h3 className="text-base font-extrabold text-amber-500 uppercase">
                  KPPN TIPE A1 SEMARANG I
                </h3>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed text-justify">
                {buletinConfig.tkdData?.catatanTkd || 'Dana Transfer Ke Daerah (TKD) adalah dana dari APBN yang disalurkan ke pemerintah daerah untuk mendanai urusan pemerintahan dan pelayanan publik. KPPN Semarang I mengawal penyaluran TKD ke wilayah Pemerintah Kota Semarang dan sekitarnya guna memastikan kelancaran pembangunan infrastruktur dan pemenuhan layanan dasar masyarakat.'}
              </p>

              {/* 6 Grid TKD Cards (DBH, DAU, DAK Fisik, DAK Non-Fisik, Insentif Fiskal, Dana Kelurahan) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 text-xs">
                
                <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 space-y-1.5 text-center">
                  <div className="w-full py-1 rounded bg-blue-600 text-white font-black text-[11px] uppercase">
                    DBH
                  </div>
                  <div className="text-sm font-black text-blue-950">
                    {buletinConfig.tkdData?.dbh ? formatRupiahShort(buletinConfig.tkdData.dbh) : 'Rp 182,45 M'}
                  </div>
                  <p className="text-[10px] text-slate-600 text-left leading-relaxed">
                    Dana Bagi Hasil dialokasikan berdasarkan potensi pajak dan SDA untuk mengurangi ketimpangan fiskal daerah.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 space-y-1.5 text-center">
                  <div className="w-full py-1 rounded bg-blue-600 text-white font-black text-[11px] uppercase">
                    DAU
                  </div>
                  <div className="text-sm font-black text-blue-950">
                    {buletinConfig.tkdData?.dau ? formatRupiahShort(buletinConfig.tkdData.dau) : 'Rp 1,482 T'}
                  </div>
                  <p className="text-[10px] text-slate-600 text-left leading-relaxed">
                    Dana Alokasi Umum untuk pemerataan kemampuan keuangan dan penggajian formasi PPPK daerah.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 space-y-1.5 text-center">
                  <div className="w-full py-1 rounded bg-blue-600 text-white font-black text-[11px] uppercase">
                    DAK FISIK
                  </div>
                  <div className="text-sm font-black text-blue-950">
                    {buletinConfig.tkdData?.dakFisik ? formatRupiahShort(buletinConfig.tkdData.dakFisik) : 'Rp 45,80 M'}
                  </div>
                  <p className="text-[10px] text-slate-600 text-left leading-relaxed">
                    Membantu mendanai kegiatan fisik prioritas nasional di bidang jalan, sanitasi, dan sarana kesehatan.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 space-y-1.5 text-center">
                  <div className="w-full py-1 rounded bg-blue-600 text-white font-black text-[11px] uppercase">
                    DAK NON-FISIK
                  </div>
                  <div className="text-sm font-black text-blue-950">
                    {buletinConfig.tkdData?.dakNonFisik ? formatRupiahShort(buletinConfig.tkdData.dakNonFisik) : 'Rp 512,18 M'}
                  </div>
                  <p className="text-[10px] text-slate-600 text-left leading-relaxed">
                    Digunakan untuk Bantuan Operasional Sekolah (BOS) dan tunjangan profesi guru ASN daerah.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 space-y-1.5 text-center">
                  <div className="w-full py-1 rounded bg-blue-600 text-white font-black text-[11px] uppercase">
                    INSENTIF FISKAL
                  </div>
                  <div className="text-sm font-black text-blue-950">
                    {buletinConfig.tkdData?.insentifFiskal ? formatRupiahShort(buletinConfig.tkdData.insentifFiskal) : 'Rp 38,20 M'}
                  </div>
                  <p className="text-[10px] text-slate-600 text-left leading-relaxed">
                    Diberikan atas capaian kinerja tata kelola keuangan dan pengendalian inflasi daerah.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 space-y-1.5 text-center">
                  <div className="w-full py-1 rounded bg-blue-600 text-white font-black text-[11px] uppercase">
                    DANA KELURAHAN
                  </div>
                  <div className="text-sm font-black text-blue-950">
                    {buletinConfig.tkdData?.danaKelurahan ? formatRupiahShort(buletinConfig.tkdData.danaKelurahan) : 'Rp 86,50 M'}
                  </div>
                  <p className="text-[10px] text-slate-600 text-left leading-relaxed">
                    Mendukung pemberdayaan masyarakat dan sarana prasarana lingkungan kelurahan di Kota Semarang.
                  </p>
                </div>

              </div>
            </div>
          </div>
        ))}


        {/* ========================================================================= */}
        {/* HALAMAN 9: GUYUB RUKUN - WAWANCARA SATKER (Bagian 1)                      */}
        {/* ========================================================================= */}
        {renderPageWrapper(9, 'Guyub Rukun (Bagian 1)', (
          <div className="p-10 space-y-6 flex-1 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b-2 border-slate-900 pb-3">
                <span className="px-3 py-1 rounded-md bg-emerald-600 text-white font-black text-xs uppercase">
                  GUYUB RUKUN
                </span>
                <h2 className="text-2xl font-black text-slate-900 font-serif">
                  WAWANCARA SATKER MITRA
                </h2>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                <h3 className="text-sm font-black text-emerald-950 italic">
                  "{buletinConfig.wawancaraSatker?.judul || 'Pentingnya Disiplin RPD dan Transparansi Anggaran bagi Satuan Kerja'}"
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs sm:text-sm text-slate-700 leading-relaxed text-justify">
                <div className="md:col-span-1 p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-3">
                  {buletinConfig.wawancaraSatker?.fotoNarasumberUrl ? (
                    <div className="w-28 h-32 mx-auto rounded-lg overflow-hidden shadow-sm border border-slate-300">
                      <img 
                        src={buletinConfig.wawancaraSatker.fotoNarasumberUrl} 
                        alt="Narasumber" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-28 mx-auto rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold">
                      <UserCheck className="w-10 h-10 text-amber-300" />
                    </div>
                  )}
                  <div>
                    <div className="font-black text-slate-900 text-xs">{buletinConfig.wawancaraSatker?.narasumber || 'Budi Santoso, S.E.'}</div>
                    <div className="text-[10px] text-slate-500 font-bold">{buletinConfig.wawancaraSatker?.jabatan || 'PPK / Pengelola Keuangan'}</div>
                    <div className="text-[9px] text-emerald-700 font-black">{buletinConfig.wawancaraSatker?.satker || 'Satuan Kerja Mitra KPPN Semarang I'}</div>
                  </div>
                </div>

                <div className="md:col-span-2 space-y-3">
                  <p>
                    Dalam rubrik <strong>Guyub Rukun</strong> edisi kali ini, Tim Redaksi KPPN Semarang I berkesempatan mewawancarai <strong>{buletinConfig.wawancaraSatker?.narasumber || 'Pengelola Keuangan'}</strong> selaku pengelola anggaran dari <strong>{buletinConfig.wawancaraSatker?.satker || 'Satuan Kerja'}</strong>.
                  </p>
                  <p>
                    {buletinConfig.wawancaraSatker?.isiWawancara || 'Kunci utama mencapai kinerja penyerapan anggaran yang optimal dan raihan IKPA maksimal terletak pada disiplin pemutakhiran RPD Halaman III DIPA setiap awal triwulan serta rekonsiliasi berkala sebelum tanggal cut-off SAKTI.'}
                  </p>
                  <div className="p-3.5 rounded-xl bg-white border border-emerald-200 italic text-emerald-900 font-medium">
                    <Quote className="w-4 h-4 text-emerald-500 inline mr-1" />
                    "{buletinConfig.wawancaraSatker?.kutipanPenting || 'Koordinasi aktif dengan Helpdesk KPPN Semarang I membuat seluruh kendala teknis SP2D dan SAKTI terselesaikan dalam hitungan jam.'}"
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}


        {/* ========================================================================= */}
        {/* HALAMAN 10: GUYUB RUKUN - EVALUASI & DOKUMENTASI (Bagian 2)               */}
        {/* ========================================================================= */}
        {renderPageWrapper(10, 'Guyub Rukun (Bagian 2)', (
          <div className="p-10 space-y-6 flex-1 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="border-b-2 border-slate-900 pb-3 flex items-center justify-between">
                <span className="text-xs font-black uppercase text-emerald-700 tracking-wider">
                  GUYUB RUKUN • PRAKTIK BAIK PENGELOLAAN KEUANGAN
                </span>
                <span className="text-[10px] text-slate-400 font-bold">KPPN SEMARANG I</span>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed text-justify">
                <p>
                  {buletinConfig.wawancaraSatker?.isiWawancara2 || 'Dalam pemanfaatan alokasi belanja operasional dan pemeliharaan, satker senantiasa menerapkan Indikator Kinerja Utama (IKU) sebagai tolok ukur efektivitas setiap rupiah anggaran negara. Penerapan Cash Management System (CMS) dan Kartu Kredit Pemerintah (KKP) juga terus dioptimalkan.'}
                </p>

                <div className="grid grid-cols-2 gap-4 my-4">
                  {buletinConfig.wawancaraSatker?.fotoKegiatanSatkerUrl ? (
                    <div className="col-span-2 h-48 rounded-xl overflow-hidden shadow-sm border border-slate-300">
                      <img 
                        src={buletinConfig.wawancaraSatker.fotoKegiatanSatkerUrl} 
                        alt="Kegiatan Satker" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <>
                      <div className="h-44 rounded-xl bg-slate-100 border border-slate-300 flex flex-col items-center justify-center p-3 text-center text-slate-500">
                        <Camera className="w-8 h-8 mb-2 text-slate-400" />
                        <span className="text-[10px] font-bold">Dokumentasi Pengelolaan Anggaran</span>
                        <span className="text-[9px]">Pemanfaatan APBN untuk Layanan Publik &amp; Masyarakat</span>
                      </div>
                      <div className="h-44 rounded-xl bg-slate-100 border border-slate-300 flex flex-col items-center justify-center p-3 text-center text-slate-500">
                        <Camera className="w-8 h-8 mb-2 text-slate-400" />
                        <span className="text-[10px] font-bold">Evaluasi Kinerja Berkala</span>
                        <span className="text-[9px]">Koordinasi dengan KPPN Semarang I</span>
                      </div>
                    </>
                  )}
                </div>

                <p>
                  {buletinConfig.wawancaraSatker?.prestasiSatker || 'Sinergi yang terbangun antara Satker dan KPPN Semarang I melalui asistensi intensif pada masa rekonsiliasi bulanan terbukti mampu mempertahankan predikat IKPA Sangat Baik dengan nilai di atas 95.00 secara konsisten.'}
                </p>
              </div>
            </div>
          </div>
        ))}


        {/* ========================================================================= */}
        {/* HALAMAN 11: SARWA SARWI KPPN - CAPACITY BUILDING (Bagian 1)                */}
        {/* ========================================================================= */}
        {renderPageWrapper(11, 'Sarwa Sarwi KPPN (Hal 11)', (
          <div className="p-10 space-y-6 flex-1 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
                <span className="px-3 py-1 rounded-md bg-purple-700 text-white font-black text-xs uppercase">
                  SARWA SARWI KPPN
                </span>
                <span className="text-xs font-bold text-slate-500">Kiprah Internal Pegawai</span>
              </div>

              <div className="text-center space-y-1">
                <h3 className="text-xl font-black text-slate-900 font-serif">
                  "{buletinConfig.sarwaSarwi?.judul || 'Sinergi dan Kolaborasi Tingkatkan Prestasi'}"
                </h3>
                <p className="text-xs font-bold text-purple-700 uppercase">
                  {buletinConfig.sarwaSarwi?.temaKegiatan || 'Capacity Building & Outbound Insan KPPN Semarang I'}
                </p>
              </div>

              {/* Photo placeholder or Uploaded Photo */}
              {buletinConfig.sarwaSarwi?.fotoCapacityBuilding1Url ? (
                <div className="h-64 rounded-2xl overflow-hidden shadow-md border-2 border-purple-300">
                  <img 
                    src={buletinConfig.sarwaSarwi.fotoCapacityBuilding1Url} 
                    alt="Capacity Building" 
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="h-56 rounded-2xl bg-purple-900 text-white flex flex-col items-center justify-center p-4 text-center shadow-md relative overflow-hidden">
                  <Camera className="w-10 h-10 text-amber-300 mb-2" />
                  <span className="text-sm font-black tracking-wide">DOKUMENTASI UTAMA CAPACITY BUILDING</span>
                  <span className="text-xs text-purple-200">Seluruh Pejabat dan Pegawai KPPN Semarang I di Lokasi Outbound</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700 leading-relaxed text-justify">
                <p>
                  {buletinConfig.sarwaSarwi?.ceritaBagian1 || 'Capacity Building diselenggarakan sebagai wujud nyata penguatan sinergi internal serta penyegaran semangat kerja insan KPPN Tipe A1 Semarang I. Kegiatan diselenggarakan di kawasan sejuk Bandungan, Kabupaten Semarang.'}
                </p>
                <p>
                  {buletinConfig.sarwaSarwi?.ceritaBagian2 || 'Seluruh pegawai tanpa terkecuali, mulai dari Kepala Kantor, para Kepala Seksi, Pejabat Fungsional, Pelaksana, hingga PPNPN turut ambil bagian dengan penuh antusias dan kegembiraan.'}
                </p>
              </div>
            </div>
          </div>
        ))}


        {/* ========================================================================= */}
        {/* HALAMAN 12: SARWA SARWI KPPN - OUTBOUND & TEAM BUILDING (Bagian 2)        */}
        {/* ========================================================================= */}
        {renderPageWrapper(12, 'Sarwa Sarwi KPPN (Hal 12)', (
          <div className="p-10 space-y-6 flex-1 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="border-b-2 border-slate-900 pb-3 flex items-center justify-between">
                <span className="text-xs font-black uppercase text-purple-700">SARWA SARWI • OUTBOUND &amp; KEKOMPAKAN</span>
                <span className="text-[10px] text-slate-400 font-bold">KPPN SEMARANG I</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="space-y-3 text-xs text-slate-700 leading-relaxed text-justify">
                  <p>
                    Sesampainya di lokasi kegiatan, peserta disambut dengan yel-yel penyemangat dan senam pemanasan yang mengundang tawa. Beragam permainan tim (*team building games*) dirancang khusus untuk melatih konsentrasi, komunikasi efektif, dan kecepatan pengambilan keputusan bersama.
                  </p>
                  <p>
                    Tantangan demi tantangan dilalui dengan kompak, menunjukkan bahwa koordinasi kerja yang solid di kantor berakar dari rasa saling percaya dan kebersamaan di lapangan.
                  </p>
                </div>

                <div className="space-y-3">
                  {buletinConfig.sarwaSarwi?.fotoCapacityBuilding2Url ? (
                    <div className="h-56 rounded-xl overflow-hidden shadow-sm border border-slate-300">
                      <img 
                        src={buletinConfig.sarwaSarwi.fotoCapacityBuilding2Url} 
                        alt="Outbound Games" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <>
                      <div className="h-28 rounded-xl bg-slate-100 flex flex-col items-center justify-center text-slate-500 text-[10px] font-bold p-2 text-center">
                        <Camera className="w-6 h-6 mb-1 text-slate-400" />
                        <span>Dokumentasi Permainan Tim &amp; Rias Kelompok</span>
                      </div>
                      <div className="h-28 rounded-xl bg-slate-100 flex flex-col items-center justify-center text-slate-500 text-[10px] font-bold p-2 text-center">
                        <Camera className="w-6 h-6 mb-1 text-slate-400" />
                        <span>Keseruan Yel-Yel Sinergi KPPN Semarang I</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}


        {/* ========================================================================= */}
        {/* HALAMAN 13: SARWA SARWI KPPN - PELEPASAN PURNA BAKTI (Bagian 3)           */}
        {/* ========================================================================= */}
        {renderPageWrapper(13, 'Sarwa Sarwi KPPN (Hal 13)', (
          <div className="p-10 space-y-6 flex-1 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="border-b-2 border-slate-900 pb-3 flex items-center justify-between">
                <span className="text-xs font-black uppercase text-purple-700">SARWA SARWI • PENGHORMATAN PURNA BAKTI</span>
                <span className="text-[10px] text-slate-400 font-bold">KPPN SEMARANG I</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                {buletinConfig.sarwaSarwi?.fotoPurnabaktiUrl ? (
                  <div className="h-64 rounded-2xl overflow-hidden shadow-sm border border-slate-300">
                    <img 
                      src={buletinConfig.sarwaSarwi.fotoPurnabaktiUrl} 
                      alt="Purna Bakti" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-64 rounded-2xl bg-slate-100 flex flex-col items-center justify-center text-slate-500 text-xs font-bold p-4 text-center">
                    <Camera className="w-8 h-8 mb-2 text-slate-400" />
                    <span>Foto Penyerahan Cinderamata Purna Bakti</span>
                    <span className="text-[10px] text-slate-400 font-normal mt-1">Momen Hangat dan Penuh Rasa Kekeluargaan</span>
                  </div>
                )}

                <div className="space-y-3 text-xs text-slate-700 leading-relaxed text-justify">
                  <p>
                    {buletinConfig.sarwaSarwi?.ceritaBagian3Purnabakti || 'Memasuki siang hari, suasana penuh kehangatan menyelimuti aula saat dilangsungkannya acara pelepasan pegawai purnabakti yang telah mendedikasikan tenaga dan pikirannya selama puluhan tahun bagi Kementerian Keuangan.'}
                  </p>
                  <p>
                    Penyerahan cinderamata dan pemutaran video kenangan menjadi momentum haru yang mengingatkan seluruh insan perbendaharaan akan arti dedikasi, loyalitas, dan kebersamaan sejati.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}


        {/* ========================================================================= */}
        {/* HALAMAN 14: SARWA SARWI KPPN - RIVER TUBING & PENUTUP (Bagian 4)          */}
        {/* ========================================================================= */}
        {renderPageWrapper(14, 'Sarwa Sarwi KPPN (Hal 14)', (
          <div className="p-10 space-y-6 flex-1 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="border-b-2 border-slate-900 pb-3 flex items-center justify-between">
                <span className="text-xs font-black uppercase text-purple-700">SARWA SARWI • RIVER TUBING &amp; PENUTUP</span>
                <span className="text-[10px] text-slate-400 font-bold">KPPN SEMARANG I</span>
              </div>

              {buletinConfig.sarwaSarwi?.fotoRiverTubingUrl ? (
                <div className="h-56 rounded-2xl overflow-hidden shadow-sm border border-slate-300">
                  <img 
                    src={buletinConfig.sarwaSarwi.fotoRiverTubingUrl} 
                    alt="River Tubing" 
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="h-52 rounded-2xl bg-slate-100 flex flex-col items-center justify-center text-slate-500 text-xs font-bold p-4 text-center">
                  <Camera className="w-10 h-10 mb-2 text-slate-400" />
                  <span>Foto Bersama Rombongan River Tubing</span>
                  <span className="text-[10px] text-slate-400 font-normal">Kekompakan Arus Jeram &amp; Solidaritas Tanpa Batas</span>
                </div>
              )}

              <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 space-y-2 text-xs text-purple-950 leading-relaxed">
                <div className="font-black uppercase flex items-center gap-1.5">
                  <Quote className="w-4 h-4 text-purple-600" />
                  <span>Pesan Kepala KPPN Semarang I:</span>
                </div>
                <p className="italic">
                  "{buletinConfig.sarwaSarwi?.pesanKepala || 'Semoga rasa kebersamaan, kekompakan, dan energi positif yang terbangun selama Capacity Building ini terus menyala dalam pelaksanaan tugas sehari-hari demi memberikan pelayanan prima tanpa celah bagi seluruh mitra kerja KPPN Semarang I.'}"
                </p>
              </div>
            </div>
          </div>
        ))}


        {/* ========================================================================= */}
        {/* HALAMAN 15: PAGELARAN SEMARANG - FESTIVAL & BUDAYA (Bagian 1)             */}
        {/* ========================================================================= */}
        {renderPageWrapper(15, 'Pagelaran Semarang (Hal 15)', (
          <div className="p-10 space-y-6 flex-1 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b-2 border-slate-900 pb-3">
                <span className="px-3 py-1 rounded-md bg-amber-600 text-white font-black text-xs uppercase">
                  PAGELARAN SEMARANG
                </span>
                <h2 className="text-2xl font-black text-slate-900 font-serif">
                  {buletinConfig.pagelaranSemarang?.judulEvent || 'SEMARANG NIGHT CARNIVAL & FESTIVAL BUDAYA'}
                </h2>
              </div>

              {buletinConfig.pagelaranSemarang?.fotoEvent1Url ? (
                <div className="h-64 rounded-2xl overflow-hidden shadow-md border border-amber-300">
                  <img 
                    src={buletinConfig.pagelaranSemarang.fotoEvent1Url} 
                    alt="Festival Budaya" 
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="h-60 rounded-2xl bg-amber-900 text-white flex flex-col items-center justify-center p-4 text-center shadow-md">
                  <Camera className="w-10 h-10 text-amber-300 mb-2" />
                  <span className="text-base font-black uppercase tracking-wide">Semarak Pawai Budaya Kota Semarang</span>
                  <span className="text-xs text-amber-200">Kreativitas Kostum, Seni Tradisi, dan Harmoni Keberagaman Nusantara</span>
                </div>
              )}

              <div className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed text-justify">
                <p>
                  {buletinConfig.pagelaranSemarang?.deskripsiEvent || 'Kemeriahan parade budaya Kota Semarang menampilkan ragam pesona kriya dan busana adiluhung yang memadukan akulturasi budaya Jawa, Tionghoa, Arab, dan Kolonial. Ribuan masyarakat tumpah ruah menyaksikan pawai yang menggerakkan perputaran ekonomi kreatif lokal.'}
                </p>
              </div>
            </div>
          </div>
        ))}


        {/* ========================================================================= */}
        {/* HALAMAN 16: PAGELARAN SEMARANG - BAZAR & UMKM BINAAN (Bagian 2)           */}
        {/* ========================================================================= */}
        {renderPageWrapper(16, 'Pagelaran Semarang (Hal 16)', (
          <div className="p-10 space-y-6 flex-1 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="border-b-2 border-slate-900 pb-3 flex items-center justify-between">
                <span className="text-xs font-black uppercase text-amber-700">PAGELARAN SEMARANG • PEMBERDAYAAN UMKM BINAAN</span>
                <span className="text-[10px] text-slate-400 font-bold">KPPN SEMARANG I</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="space-y-3 text-xs text-slate-700 leading-relaxed text-justify">
                  <p>
                    {buletinConfig.pagelaranSemarang?.deskripsiUmkm || 'KPPN Semarang I secara aktif mendorong pemberdayaan Usaha Mikro, Kecil, dan Menengah (UMKM) melalui fasilitasi pembiayaan Ultra Mikro (UMi) dan digitalisasi transaksi pengadaan pemerintah lewat platform Digipay Satu.'}
                  </p>
                  <p>
                    Pada ajang bazar pameran, beragam produk unggulan olahan kuliner khas Semarang seperti Bandeng Presto, Wingko Babat, serta batik semarangan berhasil menarik antusiasme tinggi pembeli.
                  </p>
                </div>

                {buletinConfig.pagelaranSemarang?.fotoUmkmUrl ? (
                  <div className="h-56 rounded-2xl overflow-hidden shadow-sm border border-slate-300">
                    <img 
                      src={buletinConfig.pagelaranSemarang.fotoUmkmUrl} 
                      alt="UMKM Binaan" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-56 rounded-2xl bg-slate-100 flex flex-col items-center justify-center text-slate-500 text-xs font-bold p-3 text-center">
                    <Camera className="w-8 h-8 mb-2 text-slate-400" />
                    <span>Stan Pameran UMKM Binaan KPPN Semarang I</span>
                    <span className="text-[10px] text-slate-400 font-normal">Transaksi Non-Tunai Menggunakan QRIS &amp; Digipay</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}


        {/* ========================================================================= */}
        {/* HALAMAN 17: TEROPONG SEMARANG - KAWASAN KOTA LAMA (Bagian 1)              */}
        {/* ========================================================================= */}
        {renderPageWrapper(17, 'Teropong Semarang (Hal 17)', (
          <div className="p-10 space-y-6 flex-1 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b-2 border-slate-900 pb-3">
                <span className="px-3 py-1 rounded-md bg-rose-600 text-white font-black text-xs uppercase">
                  TEROPONG SEMARANG
                </span>
                <h2 className="text-2xl font-black text-slate-900 font-serif">
                  {buletinConfig.teropongSemarang?.lokasi1Nama || 'PESONA KAWASAN KOTA LAMA'}
                </h2>
              </div>

              {buletinConfig.teropongSemarang?.fotoTeropong1Url ? (
                <div className="h-64 rounded-2xl overflow-hidden shadow-md border border-rose-300">
                  <img 
                    src={buletinConfig.teropongSemarang.fotoTeropong1Url} 
                    alt="Kota Lama" 
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="h-64 rounded-2xl bg-rose-950 text-white flex flex-col items-center justify-center p-4 text-center shadow-md">
                  <Camera className="w-10 h-10 text-amber-300 mb-2" />
                  <span className="text-base font-black uppercase tracking-wide">Gereja Blenduk &amp; Cagar Budaya Kota Lama</span>
                  <span className="text-xs text-rose-200">Pesona 'Little Netherland' Warisan Sejarah yang Hidup di Jantung Semarang</span>
                </div>
              )}

              <div className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed text-justify">
                <p>
                  {buletinConfig.teropongSemarang?.lokasi1Deskripsi || 'Kawasan Kota Lama Semarang dengan deretan bangunan bersejarah abad ke-18 seperti Gereja Blenduk dan Gedung Marba menjadi magnet pariwisata yang tak lekang oleh waktu. Penataan pedestrian yang asri menjadikannya ruang publik yang inklusif dan sarat nilai edukasi sejarah.'}
                </p>
              </div>
            </div>
          </div>
        ))}


        {/* ========================================================================= */}
        {/* HALAMAN 18: TEROPONG SEMARANG - LAWANG SEWU & PASAR JOHAR (Bagian 2)      */}
        {/* ========================================================================= */}
        {renderPageWrapper(18, 'Teropong Semarang (Hal 18)', (
          <div className="p-10 space-y-6 flex-1 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="border-b-2 border-slate-900 pb-3 flex items-center justify-between">
                <span className="text-xs font-black uppercase text-rose-700">TEROPONG SEMARANG • LANDMARK &amp; KULINER</span>
                <span className="text-[10px] text-slate-400 font-bold">KPPN SEMARANG I</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  {buletinConfig.teropongSemarang?.fotoTeropong2Url ? (
                    <div className="h-44 rounded-xl overflow-hidden shadow-sm border border-slate-300">
                      <img 
                        src={buletinConfig.teropongSemarang.fotoTeropong2Url} 
                        alt="Lawang Sewu" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-44 rounded-xl bg-slate-100 flex flex-col items-center justify-center text-slate-500 text-xs font-bold p-2 text-center">
                      <Camera className="w-6 h-6 mb-1 text-slate-400" />
                      <span>Kemegahan Arsitektur Lawang Sewu</span>
                    </div>
                  )}
                  <p className="text-[11px] text-slate-600 text-justify">
                    {buletinConfig.teropongSemarang?.lokasi2Deskripsi || 'Lawang Sewu di bundaran Tugu Muda berdiri megah sebagai ikon perkeretaapian nasional dan saksi perjuangan Pertempuran Lima Hari di Semarang.'}
                  </p>
                </div>

                <div className="space-y-3">
                  {buletinConfig.teropongSemarang?.fotoTeropong2Sub1Url ? (
                    <div className="h-44 rounded-xl overflow-hidden shadow-sm border border-slate-300">
                      <img 
                        src={buletinConfig.teropongSemarang.fotoTeropong2Sub1Url} 
                        alt="Pasar Johar" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-44 rounded-xl bg-slate-100 flex flex-col items-center justify-center text-slate-500 text-xs font-bold p-2 text-center">
                      <Camera className="w-6 h-6 mb-1 text-slate-400" />
                      <span>Pasar Johar &amp; Simpang Lima</span>
                    </div>
                  )}
                  <p className="text-[11px] text-slate-600 text-justify">
                    Pusat denyut perdagangan legendaris rancangan Ir. Thomas Karsten yang kini tampil modern dan menjadi kebanggaan warga ibu kota Jawa Tengah.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}


        {/* ========================================================================= */}
        {/* HALAMAN 19: ZONA INTEGRITAS & PANTUN ANTI KORUPSI (Persis Hal 19)          */}
        {/* ========================================================================= */}
        {renderPageWrapper(19, 'Zona Integritas', (
          <div className="p-10 space-y-6 flex-1 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="text-center space-y-2 border-b-2 border-slate-900 pb-3">
                <div className="inline-block px-3 py-1 rounded-md bg-amber-400 text-slate-950 font-black text-xs uppercase">
                  Pantun of The Day
                </div>
                <h2 className="text-2xl font-black text-slate-900 font-serif">
                  KOMITMEN ZONA INTEGRITAS (WBK / WBBM)
                </h2>
              </div>

              {/* Pantun Display Card */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white text-center space-y-2 shadow-xl border border-white/10 max-w-xl mx-auto">
                <p className="text-sm italic text-slate-200">"{buletinConfig.pantunAntiKorupsi?.bait1 || 'Jalan-jalan ke Simpang Lima membeli lumpia,'}"</p>
                <p className="text-sm italic text-slate-200">"{buletinConfig.pantunAntiKorupsi?.bait2 || 'Mampir kulineran tahu gimbal nikmat tiada tara;'}"</p>
                <p className="text-sm italic text-slate-200">"{buletinConfig.pantunAntiKorupsi?.bait3 || 'KPPN Semarang I melayani dengan tulus dan prima,'}"</p>
                <p className="text-base italic font-black text-amber-300">"{buletinConfig.pantunAntiKorupsi?.bait4 || 'Tanpa suap, tolak gratifikasi, integritas nomor satu selamanya!'}"</p>
              </div>

              {/* Channels Grid (GOL KPK, SIPANDU, WISE, PENGADUAN) */}
              <div className="space-y-3 pt-2">
                <div className="text-center font-black text-xs uppercase text-slate-800 tracking-wider">
                  AYO TOLAK DAN LAPORKAN GRATIFIKASI MELALUI SALURAN PENGADUAN RESMI:
                </div>

                <div className="grid grid-cols-2 gap-3.5 max-w-xl mx-auto text-xs">
                  <div className="p-3.5 rounded-xl border border-amber-300 bg-amber-50 flex items-center gap-3">
                    <ShieldCheck className="w-7 h-7 text-amber-600 shrink-0" />
                    <div>
                      <div className="font-black text-slate-900">GOL KPK</div>
                      <div className="text-[10px] text-slate-600 font-mono">gol.kpk.go.id</div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl border border-blue-300 bg-blue-50 flex items-center gap-3">
                    <ShieldCheck className="w-7 h-7 text-blue-600 shrink-0" />
                    <div>
                      <div className="font-black text-slate-900">SIPANDU DJPb</div>
                      <div className="text-[10px] text-slate-600 font-mono">pengaduandjpb.kemenkeu.go.id</div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl border border-indigo-300 bg-indigo-50 flex items-center gap-3">
                    <ShieldCheck className="w-7 h-7 text-indigo-600 shrink-0" />
                    <div>
                      <div className="font-black text-slate-900">WISE KEMENKEU</div>
                      <div className="text-[10px] text-slate-600 font-mono">wise.kemenkeu.go.id</div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl border border-emerald-300 bg-emerald-50 flex items-center gap-3">
                    <Phone className="w-7 h-7 text-emerald-600 shrink-0" />
                    <div>
                      <div className="font-black text-slate-900">HOTLINE PENGADUAN</div>
                      <div className="text-[10px] text-slate-600 font-mono">{buletinConfig.kontakKppn?.whatsappHelpdesk || '0812-3456-7890'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}


        {/* ========================================================================= */}
        {/* HALAMAN 20: BACK COVER - PROFIL & KONTAK KPPN SEMARANG I (Persis Hal 20)    */}
        {/* ========================================================================= */}
        {renderPageWrapper(20, 'Back Cover', (
          <div className="flex-1 flex flex-col justify-between p-10 bg-slate-950 text-white relative overflow-hidden min-h-[1100px]">
            {/* Background Texture */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px]" />

            {/* Top Back Header */}
            <div className="relative z-10 text-center space-y-2 border-b border-white/20 pb-6">
              <div className="w-14 h-14 rounded-2xl bg-amber-400 text-slate-950 flex flex-col items-center justify-center font-black mx-auto shadow-lg">
                <span className="text-sm leading-none">KPPN</span>
                <span className="text-xs leading-none font-bold text-slate-800">026</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white">
                KANTOR PELAYANAN PERBENDAHARAAN NEGARA TIPE A1 SEMARANG I
              </h2>
              <p className="text-xs text-amber-300 font-medium">
                DIREKTORAT JENDERAL PERBENDAHARAAN • KEMENTERIAN KEUANGAN REPUBLIK INDONESIA
              </p>
            </div>

            {/* Central Building Graphic or Uploaded Building Photo */}
            <div className="relative z-10 my-auto text-center space-y-4 max-w-lg mx-auto">
              {buletinConfig.kontakKppn?.fotoGedungUrl ? (
                <div className="h-64 rounded-3xl overflow-hidden border-2 border-amber-400 shadow-2xl">
                  <img 
                    src={buletinConfig.kontakKppn.fotoGedungUrl} 
                    alt="Gedung KPPN Semarang I" 
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="h-64 rounded-3xl bg-slate-900 border-2 border-amber-400/40 flex flex-col items-center justify-center p-6 shadow-2xl space-y-3">
                  <Building2 className="w-16 h-16 text-amber-400 animate-pulse" />
                  <div className="space-y-1">
                    <div className="text-base font-black text-white">GEDUNG KPPN SEMARANG I</div>
                    <p className="text-xs text-slate-300">
                      {buletinConfig.kontakKppn?.alamat || 'Jl. Ki Mangunsarkoro No. 34, Karangkidul, Kec. Semarang Tengah, Kota Semarang, Jawa Tengah 50241'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Contact & QR Code Section */}
            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-white/20 items-center">
              {/* QR Code / Portal Info */}
              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-white p-1 flex items-center justify-center shrink-0">
                  <Globe className="w-12 h-12 text-slate-950" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-amber-300 uppercase block">FIND US HERE</span>
                  <div className="text-xs font-black text-white">Portal &amp; Informasi Layanan</div>
                  <div className="text-[10px] text-slate-300">Akses portal resmi {buletinConfig.kontakKppn?.website || 'djpb.kemenkeu.go.id/kppn/semarang1'}</div>
                </div>
              </div>

              {/* Social Media & Contact Info */}
              <div className="space-y-1.5 text-xs text-slate-200">
                <div className="flex items-center gap-2 font-semibold">
                  <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Telp: {buletinConfig.kontakKppn?.telepon || '(024) 8414441'} / WA: {buletinConfig.kontakKppn?.whatsappHelpdesk || '0812-3456-7890'}</span>
                </div>
                <div className="flex items-center gap-2 font-semibold">
                  <Mail className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>Email: {buletinConfig.kontakKppn?.email || 'kppnsemarang1@kemenkeu.go.id'}</span>
                </div>
                <div className="flex items-center gap-2 font-semibold">
                  <Share2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>IG: {buletinConfig.kontakKppn?.instagram || '@kppnsemarang1'} • YT: {buletinConfig.kontakKppn?.youtube || 'KPPN Semarang 1'}</span>
                </div>
              </div>
            </div>

          </div>
        ))}

      </div>
    </div>
  );
};
