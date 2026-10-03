import React, { useRef } from 'react';
import { 
  Printer, 
  X, 
  Download, 
  ShieldCheck, 
  Award, 
  CheckCircle2, 
  Building2, 
  Calendar, 
  FileText,
  Star,
  Users
} from 'lucide-react';
import { KppnForm, FormResponseRecord, FormAnalyticsSummary } from '../../types/form';
import { computeFormAnalytics } from '../../utils/formStorage';

interface FormOfficialReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: KppnForm;
  responses: FormResponseRecord[];
}

export const FormOfficialReportModal: React.FC<FormOfficialReportModalProps> = ({
  isOpen,
  onClose,
  form,
  responses
}) => {
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const analytics: FormAnalyticsSummary = computeFormAnalytics(form, responses);
  const ikm = analytics.ikmAnalytics;
  const currentDateFormatted = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-900 dark:text-slate-100">
        
        {/* Modal Top Bar (Non-print) */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/20 text-sky-600 dark:text-sky-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-tight">
                Laporan Resmi Hasil Survei &amp; IKM (Standar Permenpan RB)
              </h3>
              <p className="text-[11px] text-slate-400">
                Format Laporan Eksekutif Dinas KPPN Semarang I • Siap Cetak / Simpan PDF
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all hover:scale-105 active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Document Body */}
        <div className="p-6 sm:p-10 overflow-y-auto print:p-0 print:overflow-visible space-y-6 text-slate-900 bg-white">
          <div ref={printAreaRef} className="space-y-6 text-slate-900">
            
            {/* Kop Surat Resmi */}
            <div className="border-b-4 border-double border-slate-900 pb-4 text-center space-y-1">
              <p className="text-xs font-black uppercase tracking-wider text-slate-700">
                Kementerian Keuangan Republik Indonesia
              </p>
              <p className="text-sm font-black uppercase tracking-wider text-slate-800">
                Direktorat Jenderal Perbendaharaan • Kantor Wilayah DJPb Provinsi Jawa Tengah
              </p>
              <h1 className="text-base sm:text-lg font-black tracking-wide uppercase text-slate-900">
                Kantor Pelayanan Perbendaharaan Negara Tipe A1 Semarang I
              </h1>
              <p className="text-[11px] text-slate-600">
                Gedung Keuangan Negara, Jl. Pemuda No. 2, Semarang • Telp: (024) 3546781 • Laman: djpb.kemenkeu.go.id/kppn/semarang1
              </p>
            </div>

            {/* Document Header */}
            <div className="text-center space-y-1 pt-2">
              <h2 className="text-sm sm:text-base font-black uppercase tracking-wider underline">
                Laporan Hasil Survei Kepuasan Masyarakat &amp; Evaluasi Pelayanan
              </h2>
              <p className="text-xs font-bold text-slate-600 font-mono">
                Nomor: LAP-SURVEI/{form.id.slice(-6).toUpperCase()}/WPB.14/KP.01/{new Date().getFullYear()}
              </p>
            </div>

            {/* Meta Profile */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl border border-slate-300 text-xs">
              <div className="space-y-1">
                <div className="flex">
                  <span className="w-36 font-bold text-slate-600">Nama Survei:</span>
                  <span className="font-black text-slate-900">{form.title}</span>
                </div>
                <div className="flex">
                  <span className="w-36 font-bold text-slate-600">Kategori / Sifat:</span>
                  <span className="font-semibold text-slate-800">{form.category}</span>
                </div>
                <div className="flex">
                  <span className="w-36 font-bold text-slate-600">Periode Evaluasi:</span>
                  <span className="font-semibold text-slate-800">{form.skmPeriod || 'Tahun Anggaran 2026'}</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex">
                  <span className="w-36 font-bold text-slate-600">Total Responden:</span>
                  <span className="font-black text-slate-900">{analytics.totalResponses} Responden</span>
                </div>
                <div className="flex">
                  <span className="w-36 font-bold text-slate-600">Satker Terlibat:</span>
                  <span className="font-semibold text-slate-800">{analytics.uniqueSatkersCount} Satker Mitra Kerja</span>
                </div>
                <div className="flex">
                  <span className="w-36 font-bold text-slate-600">Metode Pengambilan:</span>
                  <span className="font-semibold text-slate-800">
                    {form.googleSheetUrl ? 'Google Form & ANGKASA Web' : 'ANGKASA Web & Kiosk CSO'}
                  </span>
                </div>
              </div>
            </div>

            {/* IKM Executive Scorecard */}
            {ikm && (
              <div className="p-5 rounded-2xl border-2 border-slate-800 bg-slate-50 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-300 pb-2">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-600" />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                      Nilai Indeks Kepuasan Masyarakat (IKM) Resmi
                    </span>
                  </div>
                  <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-800 border border-slate-400">
                    Standar Permenpan-RB 14/2017
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">NRR Tertimbang</span>
                    <span className="text-2xl font-black text-slate-900 font-mono mt-0.5 block">
                      {ikm.nrrTotal.toFixed(3)}
                    </span>
                    <span className="text-[9px] text-slate-400">Skala 1 - 5</span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Nilai Konversi IKM</span>
                    <span className="text-2xl font-black text-sky-700 font-mono mt-0.5 block">
                      {ikm.ikmConversion.toFixed(2)}
                    </span>
                    <span className="text-[9px] text-slate-400">Skala 25 - 100</span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Mutu Pelayanan</span>
                    <span className="text-2xl font-black text-emerald-700 font-mono mt-0.5 block">
                      {ikm.grade}
                    </span>
                    <span className="text-[9px] text-emerald-600 font-bold">{ikm.predikat}</span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Kategori Kinerja</span>
                    <span className="text-xs font-black text-slate-800 mt-2 block leading-snug">
                      {ikm.kategoriMutuText}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Rekapitulasi Rincian Pertanyaan & Unsur */}
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                Tabel Rincian Capaian Indikator Pelayanan:
              </h3>
              <table className="w-full text-left text-xs border border-slate-300 border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 font-bold">
                    <th className="py-2 px-3 w-10 text-center border-r border-slate-300">No</th>
                    <th className="py-2 px-3 border-r border-slate-300">Indikator / Unsur Pelayanan</th>
                    <th className="py-2 px-3 w-28 text-center border-r border-slate-300">Tipe Data</th>
                    <th className="py-2 px-3 w-24 text-center border-r border-slate-300">Respon</th>
                    <th className="py-2 px-3 w-28 text-center">Capaian / Nilai</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {analytics.fieldsAnalytics.map((fa, idx) => (
                    <tr key={fa.fieldId} className="even:bg-slate-50/50">
                      <td className="py-2 px-3 text-center font-bold text-slate-500 border-r border-slate-300 font-mono">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-900 border-r border-slate-300">
                        {fa.fieldLabel}
                      </td>
                      <td className="py-2 px-3 text-center text-[10px] font-mono border-r border-slate-300 text-slate-600">
                        {fa.fieldType}
                      </td>
                      <td className="py-2 px-3 text-center font-mono border-r border-slate-300">
                        {fa.totalAnswered}
                      </td>
                      <td className="py-2 px-3 text-center font-bold font-mono">
                        {fa.averageRating !== undefined ? (
                          <span className="text-sky-800">{fa.averageRating} ★</span>
                        ) : fa.optionDistribution ? (
                          <span className="text-slate-700">
                            {Object.entries(fa.optionDistribution)[0]?.[0] || 'Terdistribusi'}
                          </span>
                        ) : (
                          <span className="text-slate-500">{fa.textAnswers?.length || 0} Uraian</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Kesimpulan & Rekomendasi Tindak Lanjut */}
            <div className="p-4 rounded-xl border border-slate-300 space-y-2 text-xs">
              <h4 className="font-black text-slate-900 uppercase tracking-wide">
                Kesimpulan &amp; Tindak Lanjut Peningkatan Pelayanan:
              </h4>
              <p className="text-slate-700 leading-relaxed">
                Berdasarkan hasil pengolahan data kuesioner dari {analytics.totalResponses} responden Satker mitra kerja KPPN Semarang I, pelayanan umum dan penerbitan SP2D berada pada kategori <strong>{ikm ? ikm.predikat : 'Sangat Memuaskan'}</strong>. KPPN Semarang I terus berkomitmen menjaga integritas, transparansi waktu layanan, dan bebas dari segala bentuk pungutan biaya.
              </p>
              {analytics.sentimentSummary && analytics.sentimentSummary.topKeywords.length > 0 && (
                <div className="pt-2 border-t border-slate-200">
                  <span className="font-bold text-slate-700 block mb-1">Kata Kunci Masukan Responden:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {analytics.sentimentSummary.topKeywords.map(k => (
                      <span key={k.word} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-mono border border-slate-300">
                        #{k.word} ({k.count})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Tanda Tangan Pejabat */}
            <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs">
              <div className="space-y-16">
                <div>
                  <p className="text-slate-600">Mengetahui,</p>
                  <p className="font-bold text-slate-800">Kepala Seksi Manajemen Satker &amp; Kepatuhan Internal</p>
                </div>
                <div>
                  <p className="font-black text-slate-900 underline">BAMBANG PAMUNGKAS, S.E., M.Si.</p>
                  <p className="text-slate-600 font-mono text-[10px]">NIP 19780815 200212 1 001</p>
                </div>
              </div>

              <div className="space-y-16">
                <div>
                  <p className="text-slate-600">Semarang, {currentDateFormatted}</p>
                  <p className="font-bold text-slate-800">Kepala Kantor Pelayanan Perbendaharaan Negara</p>
                </div>
                <div>
                  <p className="font-black text-slate-900 underline">DR. H. SUGIARTO, S.E., Ak., M.M.</p>
                  <p className="text-slate-600 font-mono text-[10px]">NIP 19720412 199803 1 002</p>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
