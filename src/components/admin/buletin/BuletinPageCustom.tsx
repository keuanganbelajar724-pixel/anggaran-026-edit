import React from 'react';
import {
  Sparkles,
  TrendingUp,
  Award,
  Layers,
  FileText,
  Quote,
  CheckCircle2,
  Table as TableIcon,
  BarChart2,
  Image as ImageIcon,
  Tag,
  Calendar,
  Building2,
  Zap,
  Star
} from 'lucide-react';
import { CustomBuletinPage, BuletinConfig } from '../../../types';

interface BuletinPageCustomProps {
  customPage: CustomBuletinPage;
  pageNumber: number;
  buletinConfig: BuletinConfig;
  formatTheme: any;
  onEdit?: () => void;
}

export const BuletinPageCustom: React.FC<BuletinPageCustomProps> = ({
  customPage,
  pageNumber,
  buletinConfig,
  formatTheme,
  onEdit
}) => {
  const {
    title,
    section,
    template,
    subtitle,
    contentParagraph1,
    contentParagraph2,
    contentParagraph3,
    quote,
    quoteAuthor,
    stats,
    photoUrl,
    photoCaption,
    tableData,
    tableHeaders,
    tags
  } = customPage;

  return (
    <div className="p-8 sm:p-10 space-y-6 flex-1 flex flex-col justify-between relative group">
      <div className="space-y-5">
        {/* Header */}
        <div className={formatTheme.headerClass}>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-400/20 text-amber-500 border border-amber-400/30">
                  {section || 'Rubrik Tambahan'}
                </span>
                {tags && tags.length > 0 && (
                  <div className="hidden sm:flex items-center gap-1">
                    {tags.map((t, idx) => (
                      <span key={idx} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <h2 className={`text-2xl font-black mt-1 ${formatTheme.headerTitleClass}`}>
                {title || 'Halaman Kustom'}
              </h2>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold uppercase text-amber-500 font-mono">
                Edisi {buletinConfig.edisi || 'IV/2026'}
              </span>
            </div>
          </div>
          {subtitle && (
            <p className="text-xs text-slate-500 font-medium italic mt-1">
              {subtitle}
            </p>
          )}
        </div>

        {/* TEMPLATE 1: SPLIT ARTICLE (2-3 Paragraphs + Quote Callout + Side Photo) */}
        {template === 'split_article' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
              <div className="md:col-span-7 space-y-3 text-xs text-slate-700 font-normal leading-relaxed text-justify">
                {contentParagraph1 && <p>{contentParagraph1}</p>}
                {contentParagraph2 && <p>{contentParagraph2}</p>}
              </div>
              <div className="md:col-span-5 space-y-3">
                {photoUrl ? (
                  <div className="rounded-2xl overflow-hidden shadow-md border border-slate-200 bg-slate-50">
                    <img
                      src={photoUrl}
                      alt={title}
                      referrerPolicy="no-referrer"
                      className="w-full h-48 object-cover"
                    />
                    {photoCaption && (
                      <div className="p-2 text-[10px] text-slate-500 italic bg-white border-t border-slate-100">
                        {photoCaption}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white space-y-2 shadow-md">
                    <div className="flex items-center gap-2 text-amber-300">
                      <Sparkles className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-wider">Sorotan Redaksi</span>
                    </div>
                    <p className="text-xs font-serif italic leading-relaxed text-slate-200">
                      "{quote || 'Integritas dan dedikasi prima adalah pondasi kokoh perbendaharaan negara.'}"
                    </p>
                    {quoteAuthor && (
                      <div className="text-[10px] font-bold text-amber-400 text-right">— {quoteAuthor}</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {quote && photoUrl && (
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 space-y-1">
                <p className="text-xs font-serif italic text-amber-950">
                  "{quote}"
                </p>
                {quoteAuthor && (
                  <div className="text-[10px] font-bold text-amber-700 text-right">— {quoteAuthor}</div>
                )}
              </div>
            )}

            {contentParagraph3 && (
              <div className="text-xs text-slate-700 font-normal leading-relaxed text-justify">
                {contentParagraph3}
              </div>
            )}
          </div>
        )}

        {/* TEMPLATE 2: INFOGRAPHIC & 3-CARD STATS SHOWCASE */}
        {template === 'infographic_cards' && (
          <div className="space-y-4">
            {contentParagraph1 && (
              <p className="text-xs text-slate-700 font-normal leading-relaxed text-justify">
                {contentParagraph1}
              </p>
            )}

            {/* Metric Cards Grid */}
            {stats && stats.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {stats.map((st, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white space-y-1.5 shadow-md border border-slate-700"
                  >
                    <div className="flex items-center justify-between text-amber-300">
                      <span className="text-[10px] font-black uppercase tracking-wider">{st.label}</span>
                      <TrendingUp className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-2xl font-black text-amber-400">{st.value}</div>
                    {st.desc && (
                      <p className="text-[10px] text-slate-300 leading-tight">{st.desc}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {photoUrl && (
              <div className="rounded-2xl overflow-hidden shadow-md border border-slate-200">
                <img
                  src={photoUrl}
                  alt={title}
                  referrerPolicy="no-referrer"
                  className="w-full h-44 object-cover"
                />
                {photoCaption && (
                  <div className="p-2 text-[10px] text-slate-500 italic bg-white border-t border-slate-100">
                    {photoCaption}
                  </div>
                )}
              </div>
            )}

            {contentParagraph2 && (
              <p className="text-xs text-slate-700 font-normal leading-relaxed text-justify">
                {contentParagraph2}
              </p>
            )}
          </div>
        )}

        {/* TEMPLATE 3: INTERVIEW / SPOTLIGHT (Q&A Style) */}
        {template === 'interview_spotlight' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white flex flex-col sm:flex-row items-center gap-4 shadow-md">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={quoteAuthor || title}
                  referrerPolicy="no-referrer"
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-amber-400 shrink-0 shadow"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xl shrink-0">
                  <Star className="w-8 h-8" />
                </div>
              )}
              <div className="space-y-1 text-center sm:text-left">
                <div className="text-xs font-bold uppercase text-amber-300 tracking-wider">
                  Narasumber Terpilih
                </div>
                <div className="text-base font-black text-white">
                  {quoteAuthor || 'Pejabat / Tokoh Satker Teladan'}
                </div>
                <p className="text-[11px] text-slate-300 italic">
                  "{quote || 'Komitmen kami adalah melayani dengan integritas tanpa kompromi.'}"
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-700 font-normal leading-relaxed text-justify">
              {contentParagraph1 && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="font-bold text-slate-900 block mb-1">Q: Apa kunci utama keberhasilan kinerja instansi Anda?</span>
                  <p>{contentParagraph1}</p>
                </div>
              )}
              {contentParagraph2 && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="font-bold text-slate-900 block mb-1">Q: Bagaimana sinergi yang terbangun dengan KPPN Semarang I?</span>
                  <p>{contentParagraph2}</p>
                </div>
              )}
              {contentParagraph3 && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="font-bold text-slate-900 block mb-1">Q: Harapan dan langkah strategis ke depan?</span>
                  <p>{contentParagraph3}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TEMPLATE 4: PHOTO STORY & GALLERY */}
        {template === 'photo_story' && (
          <div className="space-y-4">
            {photoUrl && (
              <div className="rounded-2xl overflow-hidden shadow-lg border border-slate-200">
                <img
                  src={photoUrl}
                  alt={title}
                  referrerPolicy="no-referrer"
                  className="w-full h-64 object-cover"
                />
                {photoCaption && (
                  <div className="p-3 text-xs font-medium text-slate-700 italic bg-white border-t border-slate-100 flex items-center justify-between">
                    <span>{photoCaption}</span>
                    <span className="text-[10px] text-slate-400 font-mono">Dokumentasi Resmi</span>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700 font-normal leading-relaxed text-justify">
              {contentParagraph1 && <p>{contentParagraph1}</p>}
              {contentParagraph2 && <p>{contentParagraph2}</p>}
            </div>

            {quote && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-serif italic text-amber-950">
                "{quote}"
                {quoteAuthor && <span className="font-sans font-bold not-italic block text-right mt-1 text-[10px] text-amber-800">— {quoteAuthor}</span>}
              </div>
            )}
          </div>
        )}

        {/* TEMPLATE 5: DATA TABLE */}
        {template === 'data_table' && (
          <div className="space-y-4">
            {contentParagraph1 && (
              <p className="text-xs text-slate-700 font-normal leading-relaxed text-justify">
                {contentParagraph1}
              </p>
            )}

            <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-amber-300 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-2.5">{tableHeaders?.[0] || 'No / Kode'}</th>
                    <th className="p-2.5">{tableHeaders?.[1] || 'Uraian / Satker'}</th>
                    <th className="p-2.5">{tableHeaders?.[2] || 'Alokasi / Pagu'}</th>
                    <th className="p-2.5 text-right">{tableHeaders?.[3] || 'Realisasi / Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {tableData && tableData.length > 0 ? (
                    tableData.map((row, rIdx) => (
                      <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                        <td className="p-2.5 font-mono text-[11px] font-bold text-slate-900">{row.col1}</td>
                        <td className="p-2.5">{row.col2}</td>
                        <td className="p-2.5 font-mono text-[11px]">{row.col3}</td>
                        <td className="p-2.5 text-right font-bold text-emerald-700">{row.col4}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-slate-400 italic">
                        Belum ada data tabel yang dimasukkan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {contentParagraph2 && (
              <p className="text-xs text-slate-700 font-normal leading-relaxed text-justify">
                {contentParagraph2}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className={formatTheme.footerClass}>
        <span>KPPN Semarang I — {buletinConfig.namaBuletin || 'Warta Semarang Satu'}</span>
        <span className="font-mono font-bold">Halaman {pageNumber}</span>
      </div>
    </div>
  );
};
