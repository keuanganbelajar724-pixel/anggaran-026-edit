import React from 'react';
import { Sparkles, BookOpen, Layers, CheckCircle2, ChevronRight, Award, ShieldCheck } from 'lucide-react';
import { BuletinConfig } from '../../../types';
import { OFFICIAL_PRESET_IMAGES } from '../../../data/buletinEditionPresets';

interface PageDirectoryItem {
  num: number;
  title: string;
  section: string;
  seqIndex?: number;
  origNum?: number;
}

interface BuletinPageEditorialProps {
  pageNumber: number;
  buletinConfig: BuletinConfig;
  formatTheme: any;
  onEditField?: (fieldKey: string) => void;
  renderTextOrMissing: any;
  renderPhotoOrMissing: any;
  pageDirectory: PageDirectoryItem[];
}

export const BuletinPageEditorial: React.FC<BuletinPageEditorialProps> = ({
  pageNumber,
  buletinConfig,
  formatTheme,
  onEditField,
  renderTextOrMissing,
  renderPhotoOrMissing,
  pageDirectory
}) => {
  const namaBuletin = buletinConfig.namaBuletin || 'WARTA SEMARANG SATU';

  // HALAMAN 2: KATA PENGANTAR KEPALA KPPN
  if (pageNumber === 2) {
    return (
      <div className="p-8 sm:p-10 space-y-6 flex-1 flex flex-col justify-between">
        <div className="space-y-6">
          <div className={formatTheme.headerClass}>
            <div className="flex items-center justify-between">
              <h2 className={`text-2xl sm:text-3xl font-black ${formatTheme.headerTitleClass}`}>
                Kata Pengantar
              </h2>
              <span className="text-xs font-bold uppercase tracking-widest text-amber-300">
                Editorial Kepala KPPN Semarang I
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            <div className="md:col-span-2 space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed text-justify">
              <p>
                Dengan memanjatkan puji dan syukur ke hadirat Tuhan Yang Maha Esa, KPPN Tipe A1 Semarang I mempersembahkan majalah <strong>{namaBuletin}</strong> edisi <strong>{buletinConfig.edisi}</strong> kepada seluruh Kuasa Pengguna Anggaran, Pejabat Pembuat Komitmen, Bendahara Pengeluaran satker mitra, dan para pemangku kepentingan di wilayah kerja Kota Semarang.
              </p>

              {buletinConfig.sambutanKepala ? (
                <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200/90 text-slate-800 leading-relaxed text-justify shadow-2xs">
                  <p className="font-serif italic text-slate-800 text-xs sm:text-[13px] leading-relaxed">
                    "{buletinConfig.sambutanKepala}"
                  </p>
                </div>
              ) : (
                renderTextOrMissing(
                  buletinConfig.sambutanKepala,
                  'sambutanKepala',
                  'Sambutan resmi Kepala Kantor mengenai pengawalan APBN dan integritas layanan.',
                  'text-slate-800 leading-relaxed text-justify font-medium'
                )
              )}

              <p>
                Akselerasi modernisasi perbendaharaan melalui ekosistem SAKTI, digital payment (Digipay Satu &amp; KKP Domestik), serta pengawalan ketat terhadap 8 Indikator IKPA terus menjadi prioritas kita bersama dalam menjamin setiap rupiah APBN termanfaatkan secara tepat sasaran, efisien, dan akuntabel.
              </p>

              <p>
                Semoga kompilasi data fiskal analitis, profil satker berprestasi, laporan belanja modal, serta rubrik kebersamaan dalam edisi ini dapat memperkaya wawasan dan memperkokoh sinergi kita menuju birokrasi berintegritas WBBM.
              </p>
            </div>

            {/* Profile Box Kepala KPPN */}
            <div className={formatTheme.cardStyleClass}>
              <div className="text-center space-y-3">
                {renderPhotoOrMissing(
                  buletinConfig.fotoKepalaUrl,
                  buletinConfig.namaKepalaKantor,
                  'h-48 w-40 mx-auto',
                  OFFICIAL_PRESET_IMAGES.kepalaKantor,
                  'fotoKepalaUrl'
                )}

                <div className="space-y-1">
                  <div className={`inline-block px-3 py-1 rounded-full font-black text-xs uppercase tracking-wider ${formatTheme.badgeClass}`}>
                    {buletinConfig.namaKepalaKantor}
                  </div>
                  <p className="text-[11px] font-bold text-slate-600 uppercase">
                    {buletinConfig.jabatanKepala || 'Kepala KPPN Tipe A1 Semarang I'}
                  </p>
                  <p className="text-[10px] text-slate-400 italic">
                    Kementerian Keuangan Republik Indonesia
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={formatTheme.footerClass}>
          Mengawal APBN • Mendorong Pertumbuhan Ekonomi Kota Semarang
        </div>
      </div>
    );
  }

  // HALAMAN 3: SEKILAS TENTANG BULETIN & TIM REDAKSI
  if (pageNumber === 3) {
    return (
      <div className="p-8 sm:p-10 space-y-6 flex-1 flex flex-col justify-between">
        <div className="space-y-6">
          <div className={formatTheme.headerClass}>
            <div className="flex items-center justify-between">
              <h2 className={`text-2xl font-black ${formatTheme.headerTitleClass}`}>
                Sekilas Tentang &amp; Tim Redaksi
              </h2>
              <span className="text-xs font-bold uppercase text-amber-300">Warta Semarang Satu</span>
            </div>
          </div>

          <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed text-justify">
            {renderTextOrMissing(
              buletinConfig.sekilasBuletin,
              'sekilasBuletin',
              'Deskripsi profil majalah, tujuan publikasi, dan rubrikasi berkala.',
              'text-slate-700 leading-relaxed text-justify',
              `Buletin ${namaBuletin} merupakan media publikasi berkala yang disusun secara mandiri oleh Seksi Manajemen Satker dan Kepatuhan Internal (MSKI) KPPN Tipe A1 Semarang I. Buletin ini diterbitkan sebagai sarana penyebarluasan informasi kinerja perbendaharaan, edukasi regulasi pengelolaan keuangan negara, serta wadah sinergi dan penguatan integritas bersama seluruh Satuan Kerja mitra kerja.`
            )}

            {/* Tajuk Rencana Highlight */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-slate-800 space-y-2 shadow-2xs">
              <div className="flex items-center gap-2 font-black text-amber-900 text-xs uppercase tracking-wide">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Catatan Tajuk Rencana Edisi Ini:</span>
              </div>
              {renderTextOrMissing(
                buletinConfig.tajukRencana,
                'tajukRencana',
                'Ulasan tajuk rencana edisi ini.',
                'text-xs text-slate-800 leading-relaxed italic'
              )}
            </div>

            {/* Tim Redaksi Structured Table */}
            <div className="space-y-3 pt-2">
              <h3 className={`text-sm font-black uppercase tracking-wider ${formatTheme.titleColor}`}>
                Susunan Tim Redaksi &amp; Penerbitan
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Pelindung:</span>
                  <span className="font-extrabold text-slate-900">
                    {buletinConfig.redaksiTim?.pelindung || 'Kepala Kanwil DJPb Provinsi Jawa Tengah'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Penanggung Jawab:</span>
                  <span className="font-extrabold text-slate-900">
                    {buletinConfig.redaksiTim?.penanggungJawab || buletinConfig.namaKepalaKantor}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Pemimpin Redaksi:</span>
                  <span className="font-extrabold text-slate-900">
                    {buletinConfig.redaksiTim?.pemimpinRedaksi || 'Kepala Seksi MSKI KPPN Semarang I'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Redaktur Pelaksana:</span>
                  <span className="font-extrabold text-slate-900">
                    {buletinConfig.redaksiTim?.redakturPelaksana || 'Kepala Seksi Pencairan Dana & Seksi Bank'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Tim Liputan &amp; Analis:</span>
                  <span className="font-extrabold text-slate-900">
                    {buletinConfig.redaksiTim?.timLiputan || 'Staf Seksi MSKI & Seksi Verifikasi Akuntansi'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Desain &amp; Tata Letak:</span>
                  <span className="font-extrabold text-slate-900">
                    {buletinConfig.redaksiTim?.desainTataLetak || 'Tim Media Digital & Publikasi KPPN Semarang I'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={formatTheme.footerClass}>
          Diterbitkan Berkala Oleh Seksi MSKI • KPPN Tipe A1 Semarang I
        </div>
      </div>
    );
  }

  // HALAMAN 4: DAFTAR ISI MAJALAH (TABLE OF CONTENTS)
  return (
    <div className="p-8 sm:p-10 space-y-6 flex-1 flex flex-col justify-between">
      <div className="space-y-6">
        <div className={formatTheme.headerClass}>
          <div className="flex items-center justify-between">
            <h2 className={`text-2xl font-black ${formatTheme.headerTitleClass}`}>
              Daftar Isi Majalah
            </h2>
            <span className="text-xs font-bold uppercase text-amber-300">
              Edisi Lengkap {pageDirectory.length} Halaman
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-600 font-medium">
          Panduan navigasi rubrikasi majalah perbendaharaan edisi {buletinConfig.bulanTahun}:
        </p>

        {/* 2-Column TOC Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-xs">
          {pageDirectory.map(item => {
            const displayNum = (item.seqIndex || item.num).toString().padStart(2, '0');
            return (
              <div
                key={item.num}
                className="flex items-center justify-between py-1.5 border-b border-slate-100 group hover:bg-slate-50 px-2 rounded-lg transition-all"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className="w-6 h-6 rounded bg-slate-900 text-amber-400 font-mono font-black text-[11px] flex items-center justify-center shrink-0">
                    {displayNum}
                  </span>
                  <span className="font-bold text-slate-800 truncate group-hover:text-indigo-900 transition-colors">
                    {item.title}
                  </span>
                </div>
                <span className="text-[10px] font-mono font-extrabold text-slate-400 bg-slate-100 px-2 py-0.5 rounded shrink-0">
                  {item.section}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className={formatTheme.footerClass}>
        Daftar Isi Majalah • {namaBuletin} Edisi {buletinConfig.edisi}
      </div>
    </div>
  );
};
