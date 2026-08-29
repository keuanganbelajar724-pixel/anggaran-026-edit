import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  BookOpen,
  ArrowRight,
  Sparkles,
  Layers,
  FileText,
  TrendingUp,
  Award,
  CreditCard,
  Building2,
  Users
} from 'lucide-react';
import { BuletinConfig } from '../../../types';

interface BuletinSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  pageDirectory: Array<{ num: number; title: string; section: string; seqIndex?: number }>;
  onJumpToPage: (pageNum: number) => void;
}

export const BuletinSearchModal: React.FC<BuletinSearchModalProps> = ({
  isOpen,
  onClose,
  pageDirectory,
  onJumpToPage
}) => {
  const [query, setQuery] = useState<string>('');

  // Sample page search keywords & content tags for fast, accurate search hits across 50 pages
  const pageKeywordsMap: { [key: number]: string[] } = useMemo(() => ({
    1: ['cover', 'sampul', 'depan', 'warta', 'semarang', 'judul', 'utama'],
    2: ['kata', 'pengantar', 'sambutan', 'kepala', 'kppn', 'editorial', 'pesan'],
    3: ['dewan', 'redaksi', 'susunan', 'tim', 'sekilas', 'visi', 'misi'],
    4: ['daftar', 'isi', 'table', 'content', 'rubrikasi', 'halaman'],
    5: ['kinerja', 'belanja', 'realisasi', 'apbn', 'regional', 'pagu', 'total'],
    6: ['top', '10', 'k/l', 'kementerian', 'lembaga', 'polri', 'kemenag', 'pupr', 'kemendikbud'],
    7: ['infografis', 'proporsi', 'komposisi', 'persentase', 'belanja', 'terbesar'],
    8: ['rapor', 'satker', 'pagu', 'besar', 'strategis', '50', 'miliar', 'evaluasi'],
    9: ['8', 'indikator', 'ikpa', 'rpd', 'halaman', 'iii', 'dipa', 'deviasi'],
    10: ['belanja', 'modal', '53', 'infrastruktur', 'gedung', 'peralatan', 'mesin'],
    11: ['monitoring', 'retur', 'sp2d', 'bank', 'rekening', 'supplier', 'penolakan'],
    12: ['modernisasi', 'pembayaran', 'digipay', 'satu', 'kkp', 'kartu', 'kredit', 'pemerintah', 'cms'],
    13: ['transfer', 'ke', 'daerah', 'tkd', 'dana', 'alokasi', 'umum', 'dau', 'dak', 'dbh', 'insentif'],
    14: ['guyub', 'rukun', 'wawancara', 'eksklusif', 'satker', 'juara', 'polrestabes'],
    15: ['wall', 'of', 'fame', 'penghargaan', 'satker', 'teladan', 'terbaik', 'piagam'],
    16: ['sarwa', 'sarwi', 'capacity', 'building', 'sdm', 'pelatihan', 'pegawai'],
    17: ['fun', 'games', 'kebersamaan', 'outing', 'tim', 'sinergi'],
    18: ['pelepasan', 'purnabakti', 'pensiun', 'dedikasi', 'penghargaan'],
    19: ['river', 'tubing', 'nilai', 'kemenkeu', 'alam', 'rekreasi'],
    20: ['opini', 'ilmiah', 'pranata', 'keuangan', 'apbn', 'jurnal', 'analisis'],
    21: ['glosarium', 'cerdas', 'sakti', 'istilah', 'kamus', 'seni', 'budaya'],
    22: ['teropong', 'wisata', 'kota', 'lama', 'semarang', 'heritage', 'gereja', 'blenduk'],
    23: ['teka', 'teki', 'silang', 'tts', 'interaktif', 'kuis', 'integritas'],
    24: ['pengendalian', 'gratifikasi', 'spip', 'wise', 'sipandu', 'pengaduan', 'whistleblowing'],
    25: ['analisis', 'dampak', 'ekonomi', 'pdrb', 'daya', 'beli', 'multiplier', 'effect'],
    26: ['peta', 'ketepatan', 'rpd', 'halaman', 'tiga', 'dipa', 'triwulan'],
    27: ['evaluasi', '4', 'kluster', 'belanja', '51', 'pegawai', '52', 'barang', '53', 'modal', '57', 'bansos'],
    28: ['dashboard', 'akselerasi', 'non-tunai', 'cashless', 'society', 'qr', 'digipay'],
    29: ['matriks', 'sinkronisasi', 'belanja', 'pusat', 'tkd', 'pemda', 'kota', 'semarang'],
    30: ['10', 'grand', 'strategy', 'action', 'plan', 'percepatan', 'realisasi', 'serapan'],
    31: ['suara', 'stakeholder', 'sinergi', 'kemenkeu', 'satu', 'polres', 'kejaksaan', 'bpkad'],
    32: ['green', 'budgeting', 'mitigasi', 'perubahan', 'iklim', 'tanggul', 'laut', 'banjir', 'rob'],
    33: ['maturitas', 'pengendalian', 'intern', 'spip', 'manajemen', 'risiko', 'mr'],
    34: ['formula', 'nilai', 'ikpa', '100', 'sempurna', 'tips', 'ppk', 'ppspm'],
    35: ['pemberdayaan', 'umkm', 'pembiayaan', 'umi', 'ultra', 'mikro', 'bazaar'],
    36: ['klinik', 'konsultasi', 'anggaran', 'faq', 'solusi', 'error', 'sakti'],
    37: ['harmonisasi', 'laporan', 'keuangan', 'monsakti', 'opini', 'wtp', 'bpk'],
    38: ['standardisasi', 'kompetensi', 'pejabat', 'bnt', 'pnt', 'sertifikasi'],
    39: ['inovasi', 'layanan', 'publik', 'prima', 'ramah', 'disabilitas', 'wbbm'],
    40: ['tata', 'kelola', 'rekening', 'pemerintah', 'virtual', 'account', 'tsa', 'sub-rkun'],
    41: ['akuntansi', 'akrual', 'aset', 'bmn', 'simak', 'neraca', 'kdp'],
    42: ['zero', 'retur', 'sp2d', 'validasi', 'bank', 'supplier', 'rekening'],
    43: ['hibah', 'langsung', 'phln', 'sbsn', 'proyek', 'strategis', 'sp3hl'],
    44: ['regional', 'chief', 'economist', 'rce', 'financial', 'advisory', 'alco'],
    45: ['kinerja', 'anggaran', 'pemilu', 'pilkada', 'serentak', 'kpu', 'bawaslu'],
    46: ['indeks', 'kepuasan', 'masyarakat', 'ikm', '4.98', 'sangat', 'puas'],
    47: ['pedoman', 'langkah-langkah', 'akhir', 'tahun', 'llat', 'tutup', 'buku'],
    48: ['transformasi', 'digital', 'treasury', 'omspan', '2.0', 'mobile', 'ai'],
    49: ['galeri', 'prestasi', 'penghargaan', 'wbk', 'wbbm', 'peringkat', 'satu'],
    50: ['sampul', 'belakang', 'kontak', 'resmi', 'janji', 'layanan', 'rp0', 'bebas', 'pungutan']
  }), []);

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();

    return pageDirectory.filter(p => {
      const titleMatch = p.title.toLowerCase().includes(q);
      const secMatch = p.section.toLowerCase().includes(q);
      const numMatch = p.num.toString() === q || (p.seqIndex && p.seqIndex.toString() === q);
      const tags = pageKeywordsMap[p.num] || [];
      const tagsMatch = tags.some(tag => tag.includes(q));

      return titleMatch || secMatch || numMatch || tagsMatch;
    });
  }, [query, pageDirectory, pageKeywordsMap]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-white animate-in fade-in zoom-in-95 duration-200">
        {/* Search Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-amber-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Cari topik dalam 50 halaman (cth: Digipay, IKPA, TKD, Green Budgeting, SBSN, Wisata, LLAT)..."
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded-lg bg-slate-800"
            >
              Clear
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Suggestion Pills */}
        <div className="px-5 py-2.5 bg-slate-900/80 border-b border-slate-800 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-slate-400 text-[11px] font-bold">Populer:</span>
          {['8 IKPA', 'Digipay & KKP', 'Green Budgeting', 'Zero Retur', 'TKD Semarang', 'TTS Integritas', 'LLAT', 'MonSAKTI'].map(chip => (
            <button
              key={chip}
              onClick={() => setQuery(chip)}
              className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 font-medium text-[11px] border border-slate-700 transition-colors shrink-0"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="p-5 overflow-y-auto flex-1 space-y-2.5">
          {!query.trim() ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <BookOpen className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <p className="text-sm font-bold text-slate-300">Pencarian Cepat Seluruh Rubrik Majalah</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Ketikkan nama topik, kata kunci fiskal, instansi satker, atau nomor halaman untuk melompat langsung.
              </p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <p className="text-sm font-bold text-slate-300">Tidak ditemukan hasil untuk "{query}"</p>
              <p className="text-xs text-slate-500">Coba kata kunci lain atau pilih dari topik populer di atas.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-400 px-1">
                Ditemukan {searchResults.length} halaman relevan:
              </div>
              {searchResults.map(item => {
                const displayNum = (item.seqIndex || item.num).toString().padStart(2, '0');
                return (
                  <div
                    key={item.num}
                    onClick={() => {
                      onJumpToPage(item.seqIndex || item.num);
                      onClose();
                    }}
                    className="p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 hover:border-amber-400 transition-all flex items-center justify-between gap-3 cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 truncate">
                      <div className="w-9 h-9 rounded-xl bg-slate-950 group-hover:bg-amber-400 group-hover:text-slate-950 text-amber-300 font-mono font-black text-xs flex items-center justify-center shrink-0 transition-colors shadow">
                        Hal {displayNum}
                      </div>
                      <div className="truncate">
                        <h4 className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors truncate">
                          {item.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-medium">
                          Rubrik: {item.section}
                        </span>
                      </div>
                    </div>

                    <button className="px-3 py-1.5 rounded-xl bg-slate-900 text-amber-300 group-hover:bg-amber-400 group-hover:text-slate-950 text-xs font-bold flex items-center gap-1 shrink-0 transition-colors">
                      <span>Buka</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>Indeks Pencarian Cerdas 50 Halaman</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
