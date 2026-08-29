import React from 'react';
import { X, Check, Palette, Sparkles } from 'lucide-react';
import { BuletinConfig } from '../../../types';
import { useToast } from '../../ToastNotification';
import { playChimeSound } from '../../../utils/buletinSoundEffects';

interface BuletinThemePaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  buletinConfig: BuletinConfig;
  onUpdateBuletinConfig: (updated: BuletinConfig) => void;
  soundEnabled?: boolean;
}

export const THEME_PALETTES = [
  {
    id: 'navy_gold',
    name: '🏛️ Royal Treasury & Gold',
    description: 'Palet resmi Kementerian Keuangan bernuansa biru navy berwibawa dipadu aksen emas elegan.',
    primaryColor: '#0f172a',
    accentColor: '#f59e0b',
    badgeColor: '#1e293b',
    previewBg: 'from-slate-950 via-slate-900 to-indigo-950'
  },
  {
    id: 'emerald_green',
    name: '🌿 Green Budgeting & Sustainable',
    description: 'Nuansa hijau zamrud melambangkan efisiensi energi, normalisasi drainase rob, dan fiskal hijau.',
    primaryColor: '#064e3b',
    accentColor: '#10b981',
    badgeColor: '#047857',
    previewBg: 'from-emerald-950 via-slate-900 to-teal-950'
  },
  {
    id: 'maroon_heritage',
    name: '🏰 Kota Lama Heritage & Burgundy',
    description: 'Warna bata klasik dan merah maroon khas bangunan cagar budaya Kota Lama Semarang.',
    primaryColor: '#4c0519',
    accentColor: '#fb7185',
    badgeColor: '#881337',
    previewBg: 'from-rose-950 via-slate-900 to-amber-950'
  },
  {
    id: 'cyber_slate',
    name: '🌌 Executive Cyber Obsidian',
    description: 'Gaya modern futuristik dengan kontras tinggi untuk presentasi digital dan lobby KPPN.',
    primaryColor: '#020617',
    accentColor: '#38bdf8',
    badgeColor: '#0f172a',
    previewBg: 'from-slate-950 via-slate-900 to-blue-950'
  },
  {
    id: 'editorial_classic',
    name: '📜 Classic Editorial Sepia',
    description: 'Nuansa koran editorial prestisius dengan tipografi tegas dan elegan.',
    primaryColor: '#1c1917',
    accentColor: '#d97706',
    badgeColor: '#292524',
    previewBg: 'from-stone-950 via-stone-900 to-amber-950'
  }
];

export const BuletinThemePaletteModal: React.FC<BuletinThemePaletteModalProps> = ({
  isOpen,
  onClose,
  buletinConfig,
  onUpdateBuletinConfig,
  soundEnabled = true
}) => {
  const { addToast } = useToast();

  if (!isOpen) return null;

  const currentTheme = buletinConfig.temaWarna || 'navy_gold';

  const selectTheme = (themeId: string) => {
    onUpdateBuletinConfig({
      ...buletinConfig,
      temaWarna: themeId as any
    });
    playChimeSound(soundEnabled);
    addToast('Tema warna buletin berhasil diubah!', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-white animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Palet Gaya &amp; Tema Visual Majalah</h3>
              <p className="text-xs text-slate-400">Pilih skema warna terpadu untuk 50 halaman buletin fiskal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Theme List */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {THEME_PALETTES.map(theme => {
            const isSelected = currentTheme === theme.id;
            return (
              <div
                key={theme.id}
                onClick={() => selectTheme(theme.id)}
                className={`p-4 rounded-2xl border flex items-center justify-between gap-4 cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-slate-800 border-amber-400 shadow-lg'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${theme.previewBg} border border-slate-700 flex items-center justify-center shadow-inner shrink-0`}
                  >
                    <div
                      className="w-4 h-4 rounded-full shadow"
                      style={{ backgroundColor: theme.accentColor }}
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white flex items-center gap-2">
                      {theme.name}
                      {isSelected && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                          Aktif
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-slate-400 leading-snug mt-0.5">
                      {theme.description}
                    </p>
                  </div>
                </div>

                <div className="shrink-0">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                      isSelected
                        ? 'bg-amber-400 border-amber-400 text-slate-950'
                        : 'border-slate-700 text-transparent'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>Skema warna berlaku instan pada sampul, header, dan kartu infografis.</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-colors"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
