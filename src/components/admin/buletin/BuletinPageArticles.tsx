import React from 'react';
import { Award, ShieldCheck, Quote, Sparkles, Building2 } from 'lucide-react';
import { BuletinConfig, RealisasiBelanjaSummary, SatkerIKPA } from '../../../types';
import { formatRupiahShort, formatRupiahFull } from '../../../utils/realisasiBelanjaProcessor';
import { OFFICIAL_PRESET_IMAGES } from '../../../data/buletinEditionPresets';

interface BuletinPageArticlesProps {
  pageNumber: number;
  buletinConfig: BuletinConfig;
  overallSummary?: RealisasiBelanjaSummary | null;
  satkers?: SatkerIKPA[];
  formatTheme: any;
  deepAnalysis: any;
  renderTextOrMissing: any;
  renderPhotoOrMissing: any;
}

export const BuletinPageArticles: React.FC<BuletinPageArticlesProps> = ({
  pageNumber,
  buletinConfig,
  overallSummary,
  satkers = [],
  formatTheme,
  deepAnalysis,
  renderTextOrMissing,
  renderPhotoOrMissing
}) => {
  // HALAMAN 13: PENYALURAN TRANSFER KE DAERAH (TKD) KOTA SEMARANG
  if (pageNumber === 13) {
    const tkd = buletinConfig.tkdData;
    const totalTkd =
      (tkd?.dbh || 0) +
      (tkd?.dau || 0) +
      (tkd?.dakFisik || 0) +
      (tkd?.dakNonFisik || 0) +
      (tkd?.insentifFiskal || 0) +
      (tkd?.danaKelurahan || 0);

    return (
      <div className="p-8 sm:p-10 space-y-6 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          <div className={formatTheme.headerClass}>
            <div className="flex items-center justify-between">
              <h2 className={`text-2xl font-black ${formatTheme.headerTitleClass}`}>
                Penyaluran Transfer Ke Daerah (TKD)
              </h2>
              <span className="text-xs font-bold uppercase text-amber-300">
                Pemerintah Daerah Wilayah Semarang I
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950 to-indigo-950 text-white flex items-center justify-between shadow-md">
            <div>
              <span className="text-[10px] font-mono uppercase text-amber-300 font-bold">
                TOTAL SALUR TRANSFER KE DAERAH (TKD)
              </span>
              <div className="text-2xl sm:text-3xl font-mono font-black text-white">
                {formatRupiahShort(totalTkd || 2347180000000)}
              </div>
              <p className="text-xs text-slate-300">
                Mendorong Layanan Publik, Pendidikan (BOS), Kesehatan (BOK), dan Infrastruktur Daerah
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-amber-300" />
            </div>
          </div>

          {/* TKD 6 Breakdown Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Dana Bagi Hasil (DBH)</span>
              <div className="font-mono font-black text-slate-900 text-sm">
                {formatRupiahShort(tkd?.dbh || 182450000000)}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Dana Alokasi Umum (DAU)</span>
              <div className="font-mono font-black text-slate-900 text-sm">
                {formatRupiahShort(tkd?.dau || 1482000000000)}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase">DAK Fisik</span>
              <div className="font-mono font-black text-slate-900 text-sm">
                {formatRupiahShort(tkd?.dakFisik || 45800000000)}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase">DAK Non-Fisik (BOS/BOK)</span>
              <div className="font-mono font-black text-slate-900 text-sm">
                {formatRupiahShort(tkd?.dakNonFisik || 512180000000)}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Insentif Fiskal Kinerja</span>
              <div className="font-mono font-black text-slate-900 text-sm">
                {formatRupiahShort(tkd?.insentifFiskal || 38200000000)}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Dana Kelurahan</span>
              <div className="font-mono font-black text-slate-900 text-sm">
                {formatRupiahShort(tkd?.danaKelurahan || 8650000000)}
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1.5">
            <strong>Analisis Dampak TKD:</strong>
            {renderTextOrMissing(
              tkd?.catatanTkd || deepAnalysis.analisisTkdParagraphs[0],
              'tkdData.catatanTkd',
              'Ulasan penyaluran dana transfer ke daerah Kota Semarang.',
              'text-xs text-slate-700 leading-relaxed text-justify'
            )}
          </div>
        </div>

        <div className={formatTheme.footerClass}>
          Penyaluran TKD • KPPN Tipe A1 Semarang I
        </div>
      </div>
    );
  }

  // HALAMAN 14: GUYUB RUKUN: WAWANCARA EKSKLUSIF SATKER JUARA IKPA 100
  if (pageNumber === 14) {
    const w = buletinConfig.wawancaraSatker;

    return (
      <div className="p-8 sm:p-10 space-y-6 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          <div className={formatTheme.headerClass}>
            <div className="flex items-center justify-between">
              <h2 className={`text-2xl font-black ${formatTheme.headerTitleClass}`}>
                Guyub Rukun: Wawancara Satker
              </h2>
              <span className="text-xs font-bold uppercase text-amber-300">
                Praktik Terbaik IKPA 100
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {/* Foto Narasumber & Satker */}
            <div className="space-y-3">
              {renderPhotoOrMissing(
                w?.fotoNarasumberUrl,
                w?.narasumber || 'Narasumber Satker',
                'h-44 w-full object-cover rounded-xl shadow-md',
                OFFICIAL_PRESET_IMAGES.narasumberSatker,
                'wawancaraSatker.fotoNarasumberUrl'
              )}

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-center">
                <div className="font-black text-xs text-slate-900">{w?.narasumber}</div>
                <div className="text-[11px] text-slate-600 font-semibold">{w?.jabatan}</div>
                <div className="text-[10px] text-indigo-900 font-bold">{w?.satker}</div>
              </div>

              {w?.fotoKegiatanSatkerUrl && (
                <img
                  src={w.fotoKegiatanSatkerUrl}
                  alt="Kegiatan Satker"
                  className="h-28 w-full object-cover rounded-xl border border-slate-200 shadow-2xs"
                />
              )}
            </div>

            {/* Isi Wawancara 2 Kolom */}
            <div className="md:col-span-2 space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed text-justify">
              <h3 className="text-base font-black text-slate-900 leading-snug">
                {w?.judul || 'Strategi Mengamankan Nilai IKPA Sempurna dan Disiplin RPD'}
              </h3>

              <div className="p-3 rounded-xl bg-amber-50 border-l-4 border-amber-500 text-amber-950 italic text-xs font-medium">
                <Quote className="w-3.5 h-3.5 inline mr-1 text-amber-600" />
                "{w?.kutipanPenting || 'Komunikasi aktif dengan CSO KPPN Semarang I dan disiplin pembukuan adalah kunci utama kami.'}"
              </div>

              <p>{w?.isiWawancara}</p>
              {w?.isiWawancara2 && <p>{w.isiWawancara2}</p>}

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 font-bold text-xs flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{w?.prestasiSatker}</span>
              </div>
            </div>
          </div>
        </div>

        <div className={formatTheme.footerClass}>
          Rubrik Guyub Rukun Satker • KPPN Tipe A1 Semarang I
        </div>
      </div>
    );
  }

  // HALAMAN 15: WALL OF FAME SATKER TELADAN & PIAGAM PENGHARGAAN
  const fameList = buletinConfig.wallOfFameSatker || [];

  return (
    <div className="p-8 sm:p-10 space-y-6 flex-1 flex flex-col justify-between">
      <div className="space-y-4">
        <div className={formatTheme.headerClass}>
          <div className="flex items-center justify-between">
            <h2 className={`text-2xl font-black ${formatTheme.headerTitleClass}`}>
              Wall of Fame Satker Teladan
            </h2>
            <span className="text-xs font-bold uppercase text-amber-300">
              Apresiasi Kinerja Terbaik
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed text-justify">
          Penghargaan dan apresiasi setinggi-tingginya diberikan kepada satuan kerja berprestasi atas dedikasi dan kepatuhan tinggi dalam tata kelola perbendaharaan negara:
        </p>

        {/* Wall of Fame Grid */}
        <div className="space-y-3">
          {fameList.map((satker, idx) => (
            <div
              key={satker.kode}
              className="p-3.5 rounded-xl bg-gradient-to-r from-slate-50 to-amber-50/40 border border-slate-200 flex items-center justify-between gap-3 shadow-2xs hover:shadow-xs transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black font-mono flex items-center justify-center text-sm shadow-md shrink-0">
                  #{idx + 1}
                </div>
                <div>
                  <div className="font-extrabold text-slate-900 text-xs sm:text-sm">
                    {satker.nama}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <span className="font-mono">Kode: {satker.kode}</span>
                    <span>•</span>
                    <span className="font-semibold text-indigo-900">{satker.kategori}</span>
                  </div>
                  <div className="text-[10px] text-emerald-800 font-bold mt-0.5">
                    ★ {satker.highlight}
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Nilai IKPA</div>
                <div className="text-xl font-mono font-black text-emerald-700">
                  {satker.nilai.toFixed(2)}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 rounded-xl bg-slate-100 text-center text-xs text-slate-700 font-semibold">
          "Terus tingkatkan integritas dan akselerasi digitalisasi untuk Indonesia Maju!"
        </div>
      </div>

      <div className={formatTheme.footerClass}>
        Apresiasi Satuan Kerja • KPPN Tipe A1 Semarang I
      </div>
    </div>
  );
};
