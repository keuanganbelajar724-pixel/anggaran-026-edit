import React from 'react';
import { Flame, Star, QrCode } from 'lucide-react';
import { BuletinConfig, RealisasiBelanjaSummary } from '../../../types';
import { OFFICIAL_PRESET_IMAGES } from '../../../data/buletinEditionPresets';

interface BuletinPageCoverProps {
  buletinConfig: BuletinConfig;
  overallSummary?: RealisasiBelanjaSummary | null;
  formatTheme: any;
}

export const BuletinPageCover: React.FC<BuletinPageCoverProps> = ({
  buletinConfig,
  overallSummary,
  formatTheme
}) => {
  const namaBuletin = buletinConfig.namaBuletin || 'WARTA SEMARANG SATU';
  const tagline = buletinConfig.taglineBuletin || 'Kiprah Perbendaharaan & Kinerja APBN Wilayah KPPN Semarang I';

  return (
    <div
      className={`flex-1 flex flex-col justify-between p-8 sm:p-10 bg-gradient-to-br ${formatTheme.coverGradient} text-white relative overflow-hidden min-h-[1050px] shadow-2xl`}
    >
      {/* Background Cover Image */}
      {buletinConfig.fotoCoverUrl ? (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-luminosity scale-105 pointer-events-none"
          style={{ backgroundImage: `url(${buletinConfig.fotoCoverUrl})` }}
        />
      ) : (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25 mix-blend-luminosity scale-105 pointer-events-none"
          style={{ backgroundImage: `url(${OFFICIAL_PRESET_IMAGES.coverBuletin})` }}
        />
      )}

      {/* Glowing gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent pointer-events-none" />

      {/* Top Brand Header */}
      <div className="relative z-10 space-y-3 border-b border-white/20 pb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs">
              026
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-widest text-amber-300 uppercase block">
                DJPB KEMENKEU RI • KPPN TIPE A1 SEMARANG I
              </span>
              <span className="text-[9px] text-slate-300">
                Seksi Manajemen Satker &amp; Kepatuhan Internal (MSKI)
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-xs font-mono uppercase shadow-md">
              {buletinConfig.edisi}
            </span>
          </div>
        </div>

        <div className="text-center pt-2">
          <h1 className="text-4xl sm:text-5xl font-serif font-black tracking-tight text-white uppercase drop-shadow-md">
            {namaBuletin}
          </h1>
          <p className="text-xs sm:text-sm font-light text-amber-200 tracking-wide mt-1 italic">
            "{tagline}"
          </p>
        </div>
      </div>

      {/* Central Headline Spotlight */}
      <div className="relative z-10 my-auto py-6 space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/90 text-white font-extrabold text-[11px] uppercase tracking-wider backdrop-blur-sm shadow-md">
          <Flame className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
          <span>LAPORAN UTAMA EDISI INI</span>
        </div>

        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-black text-white leading-tight uppercase drop-shadow-lg">
          {buletinConfig.judulUtama}
        </h2>

        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-light text-justify max-w-xl bg-slate-900/60 backdrop-blur-md p-4 rounded-2xl border border-white/10">
          {buletinConfig.subJudul}
        </p>

        {/* Cover Headlines List */}
        <div className="space-y-2 pt-2">
          <div className="p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-start gap-3 hover:bg-white/15 transition-all">
            <Star className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span className="text-xs font-bold text-slate-100">
              {buletinConfig.coverHighlight1 || 'RAPOR 8 INDIKATOR IKPA & PRESTASI SATKER ZERO RETUR SP2D'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-start gap-3 hover:bg-white/15 transition-all">
            <Star className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span className="text-xs font-bold text-slate-100">
              {buletinConfig.coverHighlight2 || 'AKSELERASI BELANJA MODAL 53, DIGIPAY SATU & UMKM BINAAN KEMENKEU'}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Barcode & Fiscal Indicator Badge */}
      <div className="relative z-10 border-t border-white/20 pt-4 flex items-center justify-between text-xs">
        <div>
          <div className="font-mono text-[10px] text-amber-300 font-bold">PERIODE LAPORAN:</div>
          <div className="font-black text-white">{buletinConfig.bulanTahun}</div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] text-slate-300">REALISASI AGREGAT</div>
            <div className="font-mono font-black text-emerald-400 text-sm">
              {overallSummary && Number.isFinite(overallSummary.persenRealisasiTotal) ? `${overallSummary.persenRealisasiTotal.toFixed(1)}%` : '78.5%'}
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-white p-1 flex items-center justify-center">
            <QrCode className="w-full h-full text-slate-950" />
          </div>
        </div>
      </div>
    </div>
  );
};
