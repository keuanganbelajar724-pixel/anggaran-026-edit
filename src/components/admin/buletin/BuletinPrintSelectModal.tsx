import React, { useState } from 'react';
import { 
  Printer, 
  FileText, 
  Sparkles, 
  CheckSquare, 
  Square, 
  Copy, 
  Download, 
  X, 
  Layers, 
  Palette, 
  Check, 
  ExternalLink,
  BookOpen
} from 'lucide-react';
import { BuletinConfig, RealisasiBelanjaSummary, SatkerIKPA } from '../../../types';
import { formatRupiahShort, formatRupiahFull } from '../../../utils/realisasiBelanjaProcessor';
import { useToast } from '../../ToastNotification';

interface BuletinPrintSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  pageDirectory: Array<{ num: number; title: string; section: string }>;
  buletinConfig: BuletinConfig;
  overallSummary?: RealisasiBelanjaSummary | null;
  onApplyPrintSelection: (selectedPageNums: number[]) => void;
}

export const BuletinPrintSelectModal: React.FC<BuletinPrintSelectModalProps> = ({
  isOpen,
  onClose,
  pageDirectory,
  buletinConfig,
  overallSummary,
  onApplyPrintSelection
}) => {
  const { addToast } = useToast();

  const allPageNums = pageDirectory.map(p => p.num);
  const [selectedPages, setSelectedPages] = useState<number[]>(allPageNums);
  const [activeTab, setActiveTab] = useState<'print' | 'canva'>('print');
  const [copiedCanvaPage, setCopiedCanvaPage] = useState<number | null>(null);

  if (!isOpen) return null;

  const togglePage = (num: number) => {
    setSelectedPages(prev => 
      prev.includes(num) ? prev.filter(p => p !== num) : [...prev, num].sort((a, b) => a - b)
    );
  };

  const selectAll = () => setSelectedPages(allPageNums);
  const clearAll = () => setSelectedPages([]);

  // Preset Filters
  const selectPreset = (type: 'cover_editorial' | 'fiskal' | 'ikpa' | 'komunitas' | 'executive_summary' | 'advanced_analytics') => {
    switch (type) {
      case 'cover_editorial':
        setSelectedPages([1, 2, 3, 4].filter(n => allPageNums.includes(n)));
        break;
      case 'fiskal':
        setSelectedPages([5, 6, 7, 8, 25, 27, 29, 32, 43, 44, 50].filter(n => allPageNums.includes(n)));
        break;
      case 'ikpa':
        setSelectedPages([9, 10, 11, 12, 13, 26, 28, 30, 33, 34, 37, 40, 41, 42, 47, 50].filter(n => allPageNums.includes(n)));
        break;
      case 'komunitas':
        setSelectedPages([14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 31, 35, 38, 39, 45, 46, 48, 49, 50].filter(n => allPageNums.includes(n)));
        break;
      case 'advanced_analytics':
        setSelectedPages([25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50].filter(n => allPageNums.includes(n)));
        break;
      case 'executive_summary':
        setSelectedPages([1, 2, 5, 9, 25, 30, 34, 40, 44, 46, 50].filter(n => allPageNums.includes(n)));
        break;
    }
  };

  // Trigger browser print with selected pages filter
  const handlePrintNow = () => {
    if (selectedPages.length === 0) {
      addToast({
        title: 'Pilih Minimal 1 Halaman',
        message: 'Silakan centang setidaknya satu halaman yang ingin dicetak ke PDF.',
        type: 'warning'
      });
      return;
    }

    onApplyPrintSelection(selectedPages);
    onClose();

    // Trigger print after state applies
    setTimeout(() => {
      window.print();
    }, 300);
  };

  // Generate Canva-ready copy text for selected pages
  const generateCanvaContentForPage = (pageNum: number): string => {
    const nama = buletinConfig.namaBuletin || 'WARTA SEMARANG SATU';
    const edisi = buletinConfig.edisi || 'EDISI 2 | TW.II/2026';
    const pagu = overallSummary ? formatRupiahShort(overallSummary.totalPagu) : 'Rp12,85 Triliun';
    const real = overallSummary ? formatRupiahShort(overallSummary.totalRealisasi) : 'Rp8,42 Triliun';
    const persen = overallSummary ? `${overallSummary.persenRealisasiTotal.toFixed(1)}%` : '65.5%';

    switch (pageNum) {
      case 1:
        return `=== CANVA TEMPLATE: HALAMAN 1 (SAMPUL UTAMA) ===\nNAMA MAJALAH: ${nama}\nEDISI: ${edisi}\nPERIODE: ${buletinConfig.bulanTahun}\nJUDUL UTAMA: ${buletinConfig.judulUtama || 'OPTIMALISASI PENYERAPAN BELANJA APBN'}\nSUB JUDUL: ${buletinConfig.subJudul || 'Kinerja Fiskal Berkualitas & Akselerasi Digitalisasi SAKTI'}\n\nHIGHLIGHT 1: ${buletinConfig.coverHighlight1 || 'CAPACITY BUILDING: SINERGI & KOLABORASI'}\nHIGHLIGHT 2: ${buletinConfig.coverHighlight2 || 'FESTIVAL KOTA LAMA & UMKM BINAAN KEMENKEU SATU'}\nPAGU TOTAL: ${pagu}\nREALISASI: ${real} (${persen})`;

      case 2:
        return `=== CANVA TEMPLATE: HALAMAN 2 (KATA PENGANTAR KEPALA KPPN) ===\nJUDUL RUBRIK: KATA PENGANTAR EDITORIAL KEPALA KPPN SEMARANG I\nNAMA KEPALA KANTOR: ${buletinConfig.namaKepalaKantor || 'Drs. H. Ahmad Fauzi, M.Si.'}\nJABATAN: ${buletinConfig.jabatanKepala || 'Kepala KPPN Tipe A1 Semarang I'}\n\nISI SAMBUTAN:\n${buletinConfig.sambutanKepala || 'Puji syukur kita panjatkan ke hadirat Tuhan Yang Maha Esa atas limpahan rahmat dan hidayah-Nya. KPPN Tipe A1 Semarang I senantiasa berkomitmen mengawal pelaksanaan anggaran satker mitra agar senantiasa efektif, transparan, dan akuntabel guna mendukung akselerasi pembangunan serta pertumbuhan ekonomi di Kota Semarang dan wilayah Jawa Tengah.'}\n\nFOOTER: Mengawal APBN • Mendorong Pertumbuhan Ekonomi Kota Semarang`;

      case 5:
        return `=== CANVA TEMPLATE: HALAMAN 5 (LAPORAN KINERJA REALISASI BELANJA) ===\nJUDUL: KINERJA REALISASI BELANJA APBN REGIONAL\nPERIODE: ${buletinConfig.bulanTahun}\nTOTAL PAGU: ${pagu}\nTOTAL REALISASI: ${real}\nPERSENTASE PENYERAPAN: ${persen}\nTOTAL SATKER: ${overallSummary?.totalSatkerCount || 127} Satker Mitra\n\nPOIN ANALISIS:\n1. Belanja Pegawai (Akun 51) teralisasi terjaga stabil mendukung kelancaran birokrasi.\n2. Belanja Barang (Akun 52) terakselerasi melalui pemanfaatan KKP dan Digipay Satu.\n3. Belanja Modal (Akun 53) dipacu melalui percepatan pendaftaran kontrak dini.`;

      default:
        const pg = pageDirectory.find(p => p.num === pageNum);
        return `=== CANVA TEMPLATE: HALAMAN ${pageNum} (${pg?.title || 'RUBRIK MAJALAH'}) ===\nRUBRIK: ${pg?.section || 'Perbendaharaan'}\nEDISI: ${edisi}\nKPPN TIPE A1 SEMARANG I\nKEMENTERIAN KEUANGAN REPUBLIK INDONESIA\n\n[Salin teks ini ke kotak teks pada template Canva Anda]`;
    }
  };

  const handleCopyCanvaText = (pageNum: number) => {
    const text = generateCanvaContentForPage(pageNum);
    navigator.clipboard.writeText(text);
    setCopiedCanvaPage(pageNum);
    addToast({
      title: `Teks Halaman ${pageNum} Disalin!`,
      message: 'Format teks siap ditempel (paste) ke kotak teks desain Canva Anda.',
      type: 'success'
    });
    setTimeout(() => setCopiedCanvaPage(null), 2500);
  };

  const handleCopyAllSelectedCanvaText = () => {
    const allText = selectedPages
      .map(num => generateCanvaContentForPage(num))
      .join('\n\n' + '='.repeat(50) + '\n\n');
    
    navigator.clipboard.writeText(allText);
    addToast({
      title: `${selectedPages.length} Halaman Disalin untuk Canva!`,
      message: 'Seluruh narasi halaman terpilih telah disalin ke clipboard.',
      type: 'success'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn print:hidden">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-white">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md">
              <Printer className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                Pilih Halaman Cetak, PDF &amp; Format Canva
              </h3>
              <p className="text-xs text-slate-400">
                Pilih halaman tertentu untuk dicetak ke PDF A4 atau disalin narasinya ke Canva.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle: Cetak / PDF vs Format Canva */}
        <div className="px-6 pt-4 border-b border-slate-800 flex items-center gap-4 bg-slate-900/60">
          <button
            onClick={() => setActiveTab('print')}
            className={`pb-3 text-xs font-black flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'print'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>Seleksi Halaman Cetak / PDF ({selectedPages.length}/{allPageNums.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('canva')}
            className={`pb-3 text-xs font-black flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'canva'
                ? 'border-indigo-400 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Format Naskah Canva ({selectedPages.length} Halaman)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* Quick Preset Buttons */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                Pilih Cepat Berdasarkan Bagian / Rubrik:
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={selectAll}
                  className="text-[11px] text-amber-400 hover:underline font-bold"
                >
                  Pilih Semua
                </button>
                <span className="text-slate-600">•</span>
                <button
                  onClick={clearAll}
                  className="text-[11px] text-slate-400 hover:underline font-bold"
                >
                  Kosongkan
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => selectPreset('executive_summary')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold border border-slate-700 text-amber-300 transition-colors"
              >
                ⭐ Ringkasan Eksekutif (Hal 1, 2, 5, 9, 25, 30, 34, 40)
              </button>
              <button
                onClick={() => selectPreset('cover_editorial')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold border border-slate-700 text-slate-200 transition-colors"
              >
                📖 Sampul &amp; Editorial (Hal 1-4)
              </button>
              <button
                onClick={() => selectPreset('fiskal')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold border border-slate-700 text-slate-200 transition-colors"
              >
                📊 Laporan Fiskal &amp; Green Budgeting (Hal 5-8, 25, 27, 29, 32)
              </button>
              <button
                onClick={() => selectPreset('ikpa')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold border border-slate-700 text-slate-200 transition-colors"
              >
                🏆 8 Indikator IKPA &amp; RPD (Hal 9-13, 26, 28, 30, 33, 34, 37)
              </button>
              <button
                onClick={() => selectPreset('advanced_analytics')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold border border-slate-700 text-sky-300 transition-colors"
              >
                🔬 Analisis Mendalam (Hal 25-40)
              </button>
              <button
                onClick={() => selectPreset('komunitas')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold border border-slate-700 text-slate-200 transition-colors"
              >
                🤝 Komunitas, UMKM &amp; Layanan (Hal 14-24, 31, 35, 38, 39)
              </button>
            </div>
          </div>

          {/* Page Grid Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {pageDirectory.map(page => {
              const isSelected = selectedPages.includes(page.num);
              return (
                <div
                  key={page.num}
                  onClick={() => togglePage(page.num)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-amber-950/40 border-amber-500/80 text-white shadow-md'
                      : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-7 h-7 rounded-xl font-mono font-black text-xs flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-amber-400 text-slate-950' : 'bg-slate-700 text-slate-300'
                    }`}>
                      {page.num.toString().padStart(2, '0')}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-xs truncate text-white">
                        {page.title}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {page.section}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    {activeTab === 'canva' && isSelected && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyCanvaText(page.num);
                        }}
                        className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                        title="Salin Naskah Halaman Ini"
                      >
                        {copiedCanvaPage === page.num ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Canva Helper Guide Tab */}
          {activeTab === 'canva' && (
            <div className="p-4 rounded-2xl bg-indigo-950/60 border border-indigo-700/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-indigo-400" />
                  <span className="font-extrabold text-xs text-indigo-200">
                    Panduan Alur Desain Canva Majalah:
                  </span>
                </div>
                <button
                  onClick={handleCopyAllSelectedCanvaText}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Semua Halaman Terpilih ({selectedPages.length})</span>
                </button>
              </div>
              <p className="text-[11px] text-indigo-200/80 leading-relaxed">
                1. Klik tombol <strong>Salin Semua Halaman Terpilih</strong> atau ikon salin per halaman di atas.<br />
                2. Buka template majalah/buletin Anda di Canva.<br />
                3. Tempelkan (Paste) data angka realisasi, judul, dan narasi yang telah terstruktur secara instan tanpa perlu mengetik manual.
              </p>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-800 bg-slate-900 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            Terpilih <strong className="text-amber-400">{selectedPages.length}</strong> dari {allPageNums.length} halaman untuk dicetak.
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
            >
              Batal
            </button>

            <button
              onClick={handlePrintNow}
              disabled={selectedPages.length === 0}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-40"
            >
              <Printer className="w-4 h-4 text-slate-950" />
              <span>Cetak / Simpan PDF Halaman Terpilih ({selectedPages.length})</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
