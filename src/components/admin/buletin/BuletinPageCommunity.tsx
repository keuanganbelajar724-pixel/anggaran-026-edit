import React from 'react';
import { Sparkles, MapPin, Calendar } from 'lucide-react';
import { BuletinConfig } from '../../../types';
import { OFFICIAL_PRESET_IMAGES } from '../../../data/buletinEditionPresets';

interface BuletinPageCommunityProps {
  pageNumber: number;
  buletinConfig: BuletinConfig;
  formatTheme: any;
  renderTextOrMissing: any;
  renderPhotoOrMissing: any;
}

export const BuletinPageCommunity: React.FC<BuletinPageCommunityProps> = ({
  pageNumber,
  buletinConfig,
  formatTheme,
  renderTextOrMissing,
  renderPhotoOrMissing
}) => {
  const sarwa = buletinConfig.sarwaSarwi;

  // HALAMAN 16: SARWA SARWI 1: CAPACITY BUILDING PEMBUKAAN
  if (pageNumber === 16) {
    return (
      <div className="p-8 sm:p-10 space-y-6 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          <div className={formatTheme.headerClass}>
            <div className="flex items-center justify-between">
              <h2 className={`text-2xl font-black ${formatTheme.headerTitleClass}`}>
                Sarwa Sarwi: Capacity Building
              </h2>
              <span className="text-xs font-bold uppercase text-amber-300">
                Sinergi &amp; Kolaborasi
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-black text-slate-900">
              {sarwa?.judul || 'Sinergi dan Kolaborasi Tingkatkan Prestasi'}
            </h3>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                {sarwa?.tanggal || '18 Juni 2026'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-red-600" />
                {sarwa?.lokasi || 'Kawasan Wisata Bandungan, Kab. Semarang'}
              </span>
            </div>

            {renderPhotoOrMissing(
              sarwa?.fotoCapacityBuilding1Url,
              'Capacity Building Pegawai',
              'h-56 w-full object-cover rounded-2xl shadow-md',
              OFFICIAL_PRESET_IMAGES.capacityBuilding1,
              'sarwaSarwi.fotoCapacityBuilding1Url'
            )}

            <div className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed text-justify pt-1">
              <p>{sarwa?.ceritaBagian1}</p>
              <p>{sarwa?.ceritaBagian2}</p>
            </div>
          </div>
        </div>

        <div className={formatTheme.footerClass}>
          Dokumentasi Sarwa Sarwi • KPPN Tipe A1 Semarang I
        </div>
      </div>
    );
  }

  // HALAMAN 17: SARWA SARWI 2: FUN GAMES & KEPEMIMPINAN
  if (pageNumber === 17) {
    return (
      <div className="p-8 sm:p-10 space-y-6 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          <div className={formatTheme.headerClass}>
            <div className="flex items-center justify-between">
              <h2 className={`text-2xl font-black ${formatTheme.headerTitleClass}`}>
                Sarwa Sarwi: Fun Games &amp; Tim
              </h2>
              <span className="text-xs font-bold uppercase text-amber-300">
                Kekompakan Tanpa Sekat
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {renderPhotoOrMissing(
              sarwa?.fotoCapacityBuilding2Url,
              'Outbound Games KPPN Semarang I',
              'h-56 w-full object-cover rounded-2xl shadow-md',
              OFFICIAL_PRESET_IMAGES.capacityBuilding2,
              'sarwaSarwi.fotoCapacityBuilding2Url'
            )}

            <div className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed text-justify pt-1">
              <p>
                Rangkaian dinamika kelompok memupuk rasa saling percaya dan menghilangkan sekat hierarki struktural. Seluruh pegawai saling membahu menyelesaikan misi kelompok yang menuntut koordinasi cepat, komunikasi efektif, dan ketahanan mental.
              </p>
              <p>
                Nilai-nilai Kementerian Keuangan (Integritas, Profesionalisme, Sinergi, Pelayanan, dan Kesempurnaan) diinternalisasikan secara menyenangkan lewat simulasi pemecahan masalah di alam terbuka.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 italic">
              "Kekuatan tim bukan terletak pada individu yang sempurna, melainkan pada kemauan untuk saling melengkapi dan bergerak serentak demi tujuan bersama."
            </div>
          </div>
        </div>

        <div className={formatTheme.footerClass}>
          Dinamika Kelompok • KPPN Tipe A1 Semarang I
        </div>
      </div>
    );
  }

  // HALAMAN 18: SARWA SARWI 3: PELEPASAN PURNA BAKTI PEGAWAI
  if (pageNumber === 18) {
    return (
      <div className="p-8 sm:p-10 space-y-6 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          <div className={formatTheme.headerClass}>
            <div className="flex items-center justify-between">
              <h2 className={`text-2xl font-black ${formatTheme.headerTitleClass}`}>
                Sarwa Sarwi: Purnabakti Pegawai
              </h2>
              <span className="text-xs font-bold uppercase text-amber-300">
                Dedikasi Sepenuh Hati
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {renderPhotoOrMissing(
              sarwa?.fotoPurnabaktiUrl,
              'Pelepasan Pegawai Purnabakti',
              'h-56 w-full object-cover rounded-2xl shadow-md',
              OFFICIAL_PRESET_IMAGES.purnabakti,
              'sarwaSarwi.fotoPurnabaktiUrl'
            )}

            <div className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed text-justify pt-1">
              <p>{sarwa?.ceritaBagian3Purnabakti}</p>
              <p>
                Keluarga besar KPPN Semarang I menyampaikan apresiasi dan penghormatan setinggi-tingginya atas loyalitas dan jejak keteladanan yang ditinggalkan. Tali silaturahmi akan senantiasa terjalin erat melintasi masa tugas kedinasan.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-100 text-xs text-slate-800 font-medium">
              "Terima kasih atas darma bakti dan ketulusan mengabdi bagi negeri bersama insan perbendaharaan KPPN Semarang I."
            </div>
          </div>
        </div>

        <div className={formatTheme.footerClass}>
          Penghormatan Purnabakti • KPPN Tipe A1 Semarang I
        </div>
      </div>
    );
  }

  // HALAMAN 19: SARWA SARWI 4: RIVER TUBING & PESAN KEPALA KANTOR
  return (
    <div className="p-8 sm:p-10 space-y-6 flex-1 flex flex-col justify-between">
      <div className="space-y-4">
        <div className={formatTheme.headerClass}>
          <div className="flex items-center justify-between">
            <h2 className={`text-2xl font-black ${formatTheme.headerTitleClass}`}>
              Sarwa Sarwi: Uji Nyali River Tubing
            </h2>
            <span className="text-xs font-bold uppercase text-amber-300">
              Kebersamaan Mengarungi Arus
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {renderPhotoOrMissing(
            sarwa?.fotoRiverTubingUrl,
            'Keseruan River Tubing Insan KPPN',
            'h-56 w-full object-cover rounded-2xl shadow-md',
            OFFICIAL_PRESET_IMAGES.riverTubing,
            'sarwaSarwi.fotoRiverTubingUrl'
          )}

          <div className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed text-justify pt-1">
            <p>{sarwa?.ceritaBagian4RiverTubing}</p>
          </div>

          {/* Pesan Kepala Kantor */}
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs space-y-1.5 shadow-2xs">
            <div className="font-bold text-emerald-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Pesan &amp; Harapan Kepala Kantor:</span>
            </div>
            <p className="leading-relaxed italic">
              "{sarwa?.pesanKepala || 'Semoga energi kebersamaan ini terus menyala dalam melayani satker mitra tanpa celah.'}"
            </p>
          </div>
        </div>
      </div>

      <div className={formatTheme.footerClass}>
        Refleksi Kebersamaan • KPPN Tipe A1 Semarang I
      </div>
    </div>
  );
};
