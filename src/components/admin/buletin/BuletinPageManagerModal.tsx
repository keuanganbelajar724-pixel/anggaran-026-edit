import React, { useState, useMemo } from 'react';
import {
  X,
  CheckCircle2,
  Eye,
  EyeOff,
  RotateCcw,
  Trash2,
  SlidersHorizontal,
  Sparkles,
  Search,
  CheckSquare,
  Square,
  FileSpreadsheet,
  TrendingUp,
  Award,
  BookOpen
} from 'lucide-react';
import { BuletinConfig } from '../../../types';

interface BuletinPageManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  buletinConfig: BuletinConfig;
  onUpdateBuletinConfig: (updated: BuletinConfig) => void;
  pageDirectory: Array<{ num: number; title: string; section: string }>;
}

export const BuletinPageManagerModal: React.FC<BuletinPageManagerModalProps> = ({
  isOpen,
  onClose,
  buletinConfig,
  onUpdateBuletinConfig,
  pageDirectory
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Categories extraction
  const categories = useMemo(() => {
    if (!pageDirectory) return ['all'];
    const cats = Array.from(new Set(pageDirectory.map(p => p.section)));
    return ['all', ...cats];
  }, [pageDirectory]);

  // Filtered pages
  const filteredPages = useMemo(() => {
    if (!pageDirectory) return [];
    return pageDirectory.filter(p => {
      const matchSearch =
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.section.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.num.toString().includes(searchQuery);
      const matchCategory = selectedCategory === 'all' || p.section === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [pageDirectory, searchQuery, selectedCategory]);

  if (!isOpen) return null;

  const excluded = buletinConfig.excludedPages || [];

  const togglePageVisibility = (pageNum: number) => {
    let newExcluded: number[];
    if (excluded.includes(pageNum)) {
      newExcluded = excluded.filter(p => p !== pageNum);
    } else {
      newExcluded = [...excluded, pageNum];
    }
    onUpdateBuletinConfig({
      ...buletinConfig,
      excludedPages: newExcluded
    });
  };

  const setExcludedPages = (newExcluded: number[]) => {
    onUpdateBuletinConfig({
      ...buletinConfig,
      excludedPages: newExcluded
    });
  };

  const resetAllPages = () => {
    setExcludedPages([]);
  };

  // Presets
  const applyPreset = (presetKey: string) => {
    const allNums = pageDirectory.map(p => p.num);
    let keepNums: number[] = [];

    switch (presetKey) {
      case 'all':
        keepNums = allNums;
        break;
      case 'executive':
        // Hal 1, 2, 5, 9, 25, 30, 34, 40, 44, 46, 50
        keepNums = [1, 2, 5, 9, 25, 30, 34, 40, 44, 46, 50];
        break;
      case 'fiscal':
        // Hal 1, 2, 5, 6, 7, 8, 25, 27, 29, 32, 43, 44, 50
        keepNums = [1, 2, 5, 6, 7, 8, 25, 27, 29, 32, 43, 44, 50];
        break;
      case 'ikpa':
        // Hal 1, 2, 9, 10, 11, 12, 13, 26, 28, 30, 33, 34, 37, 42, 47, 50
        keepNums = [1, 2, 9, 10, 11, 12, 13, 26, 28, 30, 33, 34, 37, 42, 47, 50];
        break;
      case 'community':
        // Hal 1, 3, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 31, 35, 38, 39, 46, 49, 50
        keepNums = [1, 3, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 31, 35, 38, 39, 46, 49, 50];
        break;
      case 'analytics':
        // Hal 25 to 50
        keepNums = [1, 2, 4, ...Array.from({ length: 26 }, (_, i) => i + 25)];
        break;
      default:
        keepNums = allNums;
    }

    const newExcluded = allNums.filter(n => !keepNums.includes(n));
    setExcludedPages(newExcluded);
  };

  const activeCount = pageDirectory.length - excluded.length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight flex items-center gap-2">
                <span>Kelola Rubrikasi &amp; Seleksi Halaman Majalah</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-bold">
                  {pageDirectory.length} Master Halaman
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                Pilih halaman yang ingin diterbitkan atau disembunyikan. Penomoran halaman dan Daftar Isi akan otomatis menyesuaikan secara dinamis.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Preset Toolbar */}
        <div className="p-4 bg-slate-800 border-b border-slate-700 text-white space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
            <span className="font-bold text-amber-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Preset Cepat Rubrikasi:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => applyPreset('all')}
                className="px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold border border-slate-600 transition-colors"
              >
                ✅ Semua ({pageDirectory.length} Hal)
              </button>
              <button
                onClick={() => applyPreset('executive')}
                className="px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-amber-300 text-xs font-bold border border-slate-600 transition-colors"
              >
                ⭐ Ringkasan Eksekutif (11 Hal)
              </button>
              <button
                onClick={() => applyPreset('fiscal')}
                className="px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-emerald-300 text-xs font-bold border border-slate-600 transition-colors"
              >
                📊 Laporan Fiskal (13 Hal)
              </button>
              <button
                onClick={() => applyPreset('ikpa')}
                className="px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-indigo-300 text-xs font-bold border border-slate-600 transition-colors"
              >
                🏆 8 IKPA &amp; Kas (16 Hal)
              </button>
              <button
                onClick={() => applyPreset('community')}
                className="px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-purple-300 text-xs font-bold border border-slate-600 transition-colors"
              >
                🤝 Komunitas &amp; Wisata (20 Hal)
              </button>
              <button
                onClick={() => applyPreset('analytics')}
                className="px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-cyan-300 text-xs font-bold border border-slate-600 transition-colors"
              >
                🔬 Analisis Mendalam (29 Hal)
              </button>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari judul halaman, nomor, atau rubrik..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
              />
            </div>

            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-slate-400 hover:text-white underline"
              >
                Reset Cari
              </button>
            )}
          </div>
        </div>

        {/* Content Directory Checklist */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1 bg-slate-50">
          <div className="flex items-center justify-between text-xs text-slate-600 pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span>Status Majalah:</span>
              <span className="px-2.5 py-0.5 rounded-lg bg-slate-900 text-amber-300 font-mono font-black text-xs">
                {activeCount} Halaman Diterbitkan
              </span>
              {excluded.length > 0 && (
                <span className="text-slate-500 font-medium">
                  ({excluded.length} halaman dinonaktifkan)
                </span>
              )}
            </div>

            <button
              onClick={resetAllPages}
              className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 font-bold"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Pulihkan Semua Halaman</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {filteredPages.map(page => {
              const isHidden = excluded.includes(page.num);
              return (
                <div
                  key={page.num}
                  onClick={() => togglePageVisibility(page.num)}
                  className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition-all cursor-pointer select-none ${
                    isHidden
                      ? 'bg-slate-200/70 border-slate-300 opacity-60 hover:opacity-90'
                      : 'bg-white border-slate-200 shadow-2xs hover:border-indigo-400 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span
                      className={`w-7 h-7 rounded-xl font-mono font-black text-xs flex items-center justify-center shrink-0 ${
                        isHidden
                          ? 'bg-slate-300 text-slate-600'
                          : 'bg-slate-900 text-amber-300 shadow-2xs'
                      }`}
                    >
                      {page.num.toString().padStart(2, '0')}
                    </span>
                    <div className="truncate">
                      <div
                        className={`text-xs font-bold truncate ${
                          isHidden ? 'text-slate-500 line-through' : 'text-slate-900'
                        }`}
                      >
                        {page.title}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">{page.section}</div>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {isHidden ? (
                      <span className="w-6 h-6 rounded-lg bg-slate-300 text-slate-600 flex items-center justify-center">
                        <EyeOff className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            💡 Klik pada kotak halaman mana saja untuk mengaktifkan atau menonaktifkan.
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-900 text-amber-300 font-bold text-xs hover:bg-slate-800 transition-colors shadow-lg"
          >
            Terapkan &amp; Lihat Majalah ({activeCount} Halaman)
          </button>
        </div>
      </div>
    </div>
  );
};
