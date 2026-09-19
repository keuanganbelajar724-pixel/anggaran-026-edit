import React, { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  Building2, 
  ShieldCheck, 
  Lock, 
  Check, 
  Filter, 
  Building,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { MasterSatker } from '../../types';
import { resolveKodeBA, resolveSatkerKementerian } from '../../utils/satkerSecurity';

interface SatkerSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  satkers: MasterSatker[];
  selectedKodeSatker: string;
  unlockedSatkerKodes?: Set<string>;
  activeUnlockedSatkerKode?: string | null;
  onSelectSatker: (satker: MasterSatker) => void;
  isAdminAuthenticated?: boolean;
}

export const SatkerSelectorModal: React.FC<SatkerSelectorModalProps> = ({
  isOpen,
  onClose,
  satkers = [],
  selectedKodeSatker,
  unlockedSatkerKodes,
  activeUnlockedSatkerKode,
  onSelectSatker,
  isAdminAuthenticated = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKL, setSelectedKL] = useState<string>('ALL');

  // Extract distinct K/L list for filtering
  const distinctKLList = useMemo(() => {
    const map = new Map<string, number>();
    satkers.forEach(s => {
      const kl = s.kementerianLembaga || resolveSatkerKementerian(s);
      if (kl && kl !== '-') {
        map.set(kl, (map.get(kl) || 0) + 1);
      }
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([kl, count]) => ({ kl, count }));
  }, [satkers]);

  // Filtered Satker List
  const filteredList = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return satkers.filter(s => {
      const matchSearch =
        !q ||
        s.kodeSatker.toLowerCase().includes(q) ||
        s.namaSatker.toLowerCase().includes(q) ||
        (s.kodeBa && s.kodeBa.toLowerCase().includes(q)) ||
        (s.kementerianLembaga && s.kementerianLembaga.toLowerCase().includes(q));

      if (!matchSearch) return false;

      if (selectedKL !== 'ALL') {
        const kl = s.kementerianLembaga || resolveSatkerKementerian(s);
        if (kl !== selectedKL) return false;
      }

      return true;
    });
  }, [satkers, searchQuery, selectedKL]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white flex items-center justify-between border-b border-teal-500/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                Pilih Satuan Kerja (Satker)
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-400/30">
                  {satkers.length} Satker KPPN 026
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                Referensi resmi lengkap Satker mitra kerja KPPN Semarang I
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search and Filters Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-3 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari berdasarkan Kode Satker (6-digit), Nama Satker, Kode BA, atau Kementerian/Lembaga..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Clear
              </button>
            )}
          </div>

          {/* K/L Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
              <Filter className="w-3 h-3" /> Filter K/L:
            </span>
            <button
              type="button"
              onClick={() => setSelectedKL('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer ${
                selectedKL === 'ALL'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-700'
              }`}
            >
              Semua ({satkers.length})
            </button>
            {distinctKLList.slice(0, 8).map(({ kl, count }) => (
              <button
                key={kl}
                type="button"
                onClick={() => setSelectedKL(kl)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 transition-all truncate max-w-[200px] cursor-pointer ${
                  selectedKL === kl
                    ? 'bg-teal-600 text-white shadow-xs font-bold'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-700'
                }`}
                title={kl}
              >
                {kl} ({count})
              </button>
            ))}
          </div>
        </div>

        {/* Satker List Scrollable Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredList.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Building className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Tidak ada Satker yang cocok dengan pencarian
              </p>
              <p className="text-xs">
                Coba ubah kata kunci atau pilih filter Kementerian / Lembaga "Semua".
              </p>
            </div>
          ) : (
            filteredList.map((s) => {
              const isSelected = s.kodeSatker === selectedKodeSatker;
              const isUnlocked = isAdminAuthenticated || (activeUnlockedSatkerKode ? s.kodeSatker === activeUnlockedSatkerKode : (unlockedSatkerKodes?.has(s.kodeSatker) ?? false));
              const isCurrentSessionActive = isSelected && isUnlocked;
              const kodeBa = s.kodeBa || resolveKodeBA(s);
              const klName = s.kementerianLembaga || resolveSatkerKementerian(s);

              return (
                <div
                  key={s.kodeSatker}
                  onClick={() => {
                    onSelectSatker(s);
                    onClose();
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-500/60 shadow-xs'
                      : 'bg-white dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700/80'
                  }`}
                >
                  <div className="min-w-0 flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-mono font-black text-xs ${
                      isSelected
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}>
                      {s.kodeSatker.slice(0, 3)}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-black text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-800">
                          {s.kodeSatker}
                        </span>
                        {isAdminAuthenticated && kodeBa && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            BA {kodeBa}
                          </span>
                        )}
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[280px]">
                          {klName}
                        </span>
                      </div>

                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                        {s.namaSatker}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Lock / Unlock Badge */}
                    {isCurrentSessionActive ? (
                      <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        Sesi Terbuka
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-lg text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center gap-1" title="Memerlukan verifikasi password Satker untuk membuka">
                        <Lock className="w-3 h-3 text-slate-400" />
                        Perlu Password
                      </span>
                    )}

                    {isSelected ? (
                      <div className="w-7 h-7 rounded-full bg-teal-600 text-white flex items-center justify-center">
                        <Check className="w-4 h-4" />
                      </div>
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Info */}
        <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>Menampilkan <strong>{filteredList.length}</strong> dari {satkers.length} Satker</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
