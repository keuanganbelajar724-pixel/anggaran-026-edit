import React from 'react';
import {
  Sparkles,
  Quote,
  ShieldCheck,
  Building2,
  Phone,
  Mail,
  Globe,
  MapPin,
  QrCode,
  CheckCircle2,
  RotateCcw,
  BookOpen,
  ShoppingBag
} from 'lucide-react';
import { BuletinConfig } from '../../../types';
import { OFFICIAL_PRESET_IMAGES } from '../../../data/buletinEditionPresets';

interface BuletinPageCultureAndKuisProps {
  pageNumber: number;
  buletinConfig: BuletinConfig;
  formatTheme: any;
  renderTextOrMissing: any;
  renderPhotoOrMissing: any;
  ttsInputs: { [key: string]: string };
  onTtsChange: (key: string, val: string) => void;
  onTtsCheck: () => void;
  onTtsReset: () => void;
  ttsChecked: boolean;
}

export const BuletinPageCultureAndKuis: React.FC<BuletinPageCultureAndKuisProps> = ({
  pageNumber,
  buletinConfig,
  formatTheme,
  renderTextOrMissing,
  renderPhotoOrMissing,
  ttsInputs,
  onTtsChange,
  onTtsCheck,
  onTtsReset,
  ttsChecked
}) => {
  // HALAMAN 20: OPINI PRANATA KEUANGAN APBN
  if (pageNumber === 20) {
    const opini = buletinConfig.opiniPranata;

    return (
      <div className="p-8 sm:p-10 space-y-6 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          <div className={formatTheme.headerClass}>
            <div className="flex items-center justify-between">
              <h2 className={`text-2xl font-black ${formatTheme.headerTitleClass}`}>
                Opini Pranata Keuangan APBN
              </h2>
              <span className="text-xs font-bold uppercase text-amber-300">
                Gagasan &amp; Gagasan Fiskal
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
              {opini?.judul || 'Akselerasi Green Budgeting & Ekosistem Digital SAKTI dalam Penguatan Ekonomi Regional'}
            </h3>

            {/* Author card */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden shrink-0">
                {opini?.fotoPenulisUrl ? (
                  <img
                    src={opini.fotoPenulisUrl}
                    alt={opini.penulis}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-slate-500">
                    FP
                  </div>
                )}
              </div>
              <div>
                <div className="font-black text-xs text-slate-900">{opini?.penulis}</div>
                <div className="text-[11px] text-slate-500">{opini?.jabatanPenulis}</div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50 border-l-4 border-emerald-600 text-emerald-950 italic text-xs font-medium">
              <Quote className="w-3.5 h-3.5 inline mr-1 text-emerald-600" />
              "{opini?.kutipanOpini || 'Digitalisasi perbendaharaan mengawinkan presisi data fiskal dengan kepedulian lingkungan.'}"
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed text-justify pt-1">
              <p>{opini?.isiOpini}</p>
            </div>
          </div>
        </div>

        <div className={formatTheme.footerClass}>
          Rubrik Opini &amp; Pemikiran • KPPN Tipe A1 Semarang I
        </div>
      </div>
    );
  }

  // HALAMAN 21: GLOSARIUM SAKTI & PAGELARAN BUDAYA KOTA SEMARANG
  if (pageNumber === 21) {
    const kamus = buletinConfig.kamusSakti || [];
    const pagele = buletinConfig.pagelaranSemarang;

    return (
      <div className="p-8 sm:p-10 space-y-6 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          <div className={formatTheme.headerClass}>
            <div className="flex items-center justify-between">
              <h2 className={`text-2xl font-black ${formatTheme.headerTitleClass}`}>
                Glosarium SAKTI &amp; Pagelaran Budaya
              </h2>
              <span className="text-xs font-bold uppercase text-amber-300">
                Edukasi &amp; Kearifan Lokal
              </span>
            </div>
          </div>

          {/* Glosarium SAKTI Mini */}
          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase text-slate-900 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <span>Kamus Istilah Perbendaharaan SAKTI</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              {kamus.slice(0, 4).map((k, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-0.5">
                  <div className="font-black text-slate-900 text-[11px]">{k.istilah}</div>
                  <div className="text-[10px] text-slate-500 font-semibold">{k.kepanjangan}</div>
                  <p className="text-[10px] text-slate-600 leading-tight">{k.definisi}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Pagelaran Budaya & UMKM */}
          <div className="space-y-2 pt-1">
            <h3 className="text-xs font-black uppercase text-slate-900 flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-amber-600" />
              <span>{pagele?.judulEvent || 'Semarang Night Carnival & Festival Budaya'}</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start text-xs">
              <div>
                {renderPhotoOrMissing(
                  pagele?.fotoEvent1Url,
                  'Parade Budaya Semarang',
                  'h-32 w-full object-cover rounded-xl shadow-2xs',
                  OFFICIAL_PRESET_IMAGES.pagelaranBudaya,
                  'pagelaranSemarang.fotoEvent1Url'
                )}
              </div>
              <div className="space-y-1.5 text-[11px] text-slate-700 leading-relaxed text-justify">
                <p>{pagele?.deskripsiEvent}</p>
                <p><strong>Pemberdayaan UMKM:</strong> {pagele?.deskripsiUmkm}</p>
              </div>
            </div>
          </div>
        </div>

        <div className={formatTheme.footerClass}>
          Glosarium &amp; Budaya Semarangan • KPPN Tipe A1 Semarang I
        </div>
      </div>
    );
  }

  // HALAMAN 22: TEROPONG WISATA: KOTA LAMA SEMARANG & LAWANG SEWU
  if (pageNumber === 22) {
    const t = buletinConfig.teropongSemarang;

    return (
      <div className="p-8 sm:p-10 space-y-6 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          <div className={formatTheme.headerClass}>
            <div className="flex items-center justify-between">
              <h2 className={`text-2xl font-black ${formatTheme.headerTitleClass}`}>
                Teropong Wisata &amp; Warisan Sejarah
              </h2>
              <span className="text-xs font-bold uppercase text-amber-300">
                Eksotika Semarang
              </span>
            </div>
          </div>

          {/* Spot 1: Kota Lama */}
          <div className="space-y-2">
            <h3 className="text-sm font-black text-slate-900">
              {t?.lokasi1Nama || 'KAWASAN KOTA LAMA SEMARANG (LITTLE NETHERLAND)'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
              <div className="md:col-span-1">
                {renderPhotoOrMissing(
                  t?.fotoTeropong1Url,
                  'Kota Lama Semarang',
                  'h-28 w-full object-cover rounded-xl shadow-2xs',
                  OFFICIAL_PRESET_IMAGES.kotaLama,
                  'teropongSemarang.fotoTeropong1Url'
                )}
              </div>
              <div className="md:col-span-2 text-xs text-slate-700 leading-relaxed text-justify">
                <p>{t?.lokasi1Deskripsi}</p>
              </div>
            </div>
          </div>

          {/* Spot 2: Lawang Sewu & Tugu Muda */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <h3 className="text-sm font-black text-slate-900">
              {t?.lokasi2Nama || 'LANDMARK LAWANG SEWU & KAWASAN TUGU MUDA'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
              <div className="md:col-span-1">
                {renderPhotoOrMissing(
                  t?.fotoTeropong2Url,
                  'Lawang Sewu Semarang',
                  'h-28 w-full object-cover rounded-xl shadow-2xs',
                  OFFICIAL_PRESET_IMAGES.lawangSewu,
                  'teropongSemarang.fotoTeropong2Url'
                )}
              </div>
              <div className="md:col-span-2 text-xs text-slate-700 leading-relaxed text-justify">
                <p>{t?.lokasi2Deskripsi}</p>
              </div>
            </div>
          </div>
        </div>

        <div className={formatTheme.footerClass}>
          Pesona Kota Semarang • KPPN Tipe A1 Semarang I
        </div>
      </div>
    );
  }

  // HALAMAN 23: ZONA INTEGRITAS WBBM & TEKA-TEKI SILANG PERBENDAHARAAN (TTS)
  if (pageNumber === 23) {
    const pantun = buletinConfig.pantunAntiKorupsi;
    const tts = buletinConfig.ttsPerbendaharaan;

    return (
      <div className="p-8 sm:p-10 space-y-6 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          <div className={formatTheme.headerClass}>
            <div className="flex items-center justify-between">
              <h2 className={`text-2xl font-black ${formatTheme.headerTitleClass}`}>
                Zona Integritas &amp; Teka-Teki Silang
              </h2>
              <span className="text-xs font-bold uppercase text-amber-300">
                Menuju WBBM 2026
              </span>
            </div>
          </div>

          {/* Komitmen Zona Integritas & Pantun */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-red-950 to-slate-900 text-white space-y-2 shadow-sm">
            <div className="flex items-center gap-2 font-black text-amber-300 text-xs uppercase tracking-wide">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Komitmen Anti Korupsi &amp; Layanan Rp0,-</span>
            </div>
            <div className="text-xs font-serif italic text-slate-200 leading-relaxed pl-2 border-l-2 border-amber-400">
              <p>{pantun?.bait1}</p>
              <p>{pantun?.bait2}</p>
              <p>{pantun?.bait3}</p>
              <p className="font-bold text-amber-300">{pantun?.bait4}</p>
            </div>
            <p className="text-[10px] text-slate-300 pt-1">{pantun?.pesanIntegritas}</p>
          </div>

          {/* Interactive Teka-Teki Silang (TTS) Perbendaharaan */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase text-slate-900">
                {tts?.judul || 'TTS Perbendaharaan KPPN Semarang I'}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={onTtsCheck}
                  className="px-2.5 py-1 rounded-md bg-emerald-600 text-white font-bold text-[10px] hover:bg-emerald-700 transition-colors"
                >
                  Cek Jawaban
                </button>
                <button
                  onClick={onTtsReset}
                  className="px-2.5 py-1 rounded-md bg-slate-200 text-slate-700 font-bold text-[10px] hover:bg-slate-300 transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {/* Mendatar */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-extrabold text-slate-900 text-[11px] block">MENDATAR:</span>
                <div className="space-y-1.5 text-[11px]">
                  {(tts?.pertanyaanMendatar || []).map(item => (
                    <div key={item.no} className="flex items-center justify-between gap-2">
                      <span className="text-slate-700 font-medium">
                        {item.no}. {item.tanya}
                      </span>
                      <input
                        type="text"
                        maxLength={item.length}
                        value={ttsInputs[`${item.no}_across`] || ''}
                        onChange={e => onTtsChange(`${item.no}_across`, e.target.value.toUpperCase())}
                        placeholder={`${item.length} huruf`}
                        className={`w-20 text-center font-mono font-bold text-xs uppercase px-1 py-0.5 rounded border ${
                          ttsChecked && ttsInputs[`${item.no}_across`]?.toUpperCase() === item.jawaban
                            ? 'bg-emerald-100 border-emerald-500 text-emerald-800'
                            : 'bg-white border-slate-300'
                        }`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Menurun */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-extrabold text-slate-900 text-[11px] block">MENURUN:</span>
                <div className="space-y-1.5 text-[11px]">
                  {(tts?.pertanyaanMenurun || []).map(item => (
                    <div key={item.no} className="flex items-center justify-between gap-2">
                      <span className="text-slate-700 font-medium">
                        {item.no}. {item.tanya}
                      </span>
                      <input
                        type="text"
                        maxLength={item.length}
                        value={ttsInputs[`${item.no}_down`] || ''}
                        onChange={e => onTtsChange(`${item.no}_down`, e.target.value.toUpperCase())}
                        placeholder={`${item.length} huruf`}
                        className={`w-20 text-center font-mono font-bold text-xs uppercase px-1 py-0.5 rounded border ${
                          ttsChecked && ttsInputs[`${item.no}_down`]?.toUpperCase() === item.jawaban
                            ? 'bg-emerald-100 border-emerald-500 text-emerald-800'
                            : 'bg-white border-slate-300'
                        }`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={formatTheme.footerClass}>
          TTS Interaktif &amp; Integritas • KPPN Tipe A1 Semarang I
        </div>
      </div>
    );
  }

  // HALAMAN 24: RUANG PENGENDALIAN GRATIFIKASI, SIPANDU & WHISTLEBLOWING SYSTEM (WISE)
  return (
    <div className="p-8 sm:p-10 space-y-6 flex-1 flex flex-col justify-between">
      <div className="space-y-4">
        <div className={formatTheme.headerClass}>
          <div className="flex items-center justify-between">
            <h2 className={`text-2xl font-black ${formatTheme.headerTitleClass}`}>
              Pengendalian Gratifikasi &amp; Pengaduan
            </h2>
            <span className="text-xs font-bold uppercase text-amber-300">
              Kemenkeu Bersih &amp; Melayani
            </span>
          </div>
        </div>

        <div className="text-xs text-slate-600 font-medium leading-relaxed text-justify">
          KPPN Tipe A1 Semarang I berkomitmen penuh menjunjung tinggi integritas dengan menolak segala bentuk suap, gratifikasi, uang pelicin, maupun fasilitas ilegal lainnya. Kami siap memberikan pelayanan terbaik dengan standar biaya <strong>Rp0,- (Nol Rupiah)</strong>.
        </div>

        {/* 3 Reporting Channels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2 border border-slate-700">
            <div className="w-8 h-8 rounded-lg bg-red-500 text-white flex items-center justify-center font-black">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-xs text-red-300">UPG KPPN Semarang I</h3>
            <p className="text-[10px] text-slate-300">Unit Pengendalian Gratifikasi internal siap menerima konsultasi dan penyerahan laporan gratifikasi.</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2 border border-slate-700">
            <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-black">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-amber-300">WISE Kemenkeu</h3>
            <p className="text-[10px] text-slate-300">Whistleblowing System Kementerian Keuangan di <strong className="text-amber-200">wise.kemenkeu.go.id</strong> menjaga kerahasiaan pelapor 100%.</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2 border border-slate-700">
            <div className="w-8 h-8 rounded-lg bg-blue-400 text-slate-950 flex items-center justify-center font-black">
              <Globe className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-blue-300">SIPANDU DJPb</h3>
            <p className="text-[10px] text-slate-300">Saluran Pengaduan Terpadu DJPb di <strong className="text-blue-200">pengaduandjpb.kemenkeu.go.id</strong> untuk kritik dan saran konstruktif.</p>
          </div>
        </div>

        {/* Maklumat Pelayanan */}
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
          <div className="flex items-center gap-2 font-black text-amber-950 text-xs uppercase">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Maklumat Pelayanan KPPN Tipe A1 Semarang I</span>
          </div>
          <p className="text-xs font-serif italic text-amber-950 leading-relaxed text-justify">
            "Dengan ini kami menyatakan sanggup menyelenggarakan pelayanan sesuai standar pelayanan yang telah ditetapkan, dan apabila tidak menepati janji ini, kami siap menerima sanksi sesuai ketentuan peraturan perundang-undangan yang berlaku."
          </p>
        </div>
      </div>

      <div className={formatTheme.footerClass}>
        Pengendalian Gratifikasi • KPPN Tipe A1 Semarang I
      </div>
    </div>
  );
};
