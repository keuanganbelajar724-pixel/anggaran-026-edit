import React from 'react';
import { TrendingUp, PieChart as PieIcon, Layers, Award } from 'lucide-react';
import { BuletinConfig, RealisasiBelanjaSummary, SatkerIKPA } from '../../../types';
import { formatRupiahShort, formatRupiahFull } from '../../../utils/realisasiBelanjaProcessor';

interface BuletinPageFiscalDataProps {
  pageNumber: number;
  buletinConfig: BuletinConfig;
  overallSummary?: RealisasiBelanjaSummary | null;
  satkers?: SatkerIKPA[];
  formatTheme: any;
  deepAnalysis: any;
  renderTextOrMissing: any;
}

export const BuletinPageFiscalData: React.FC<BuletinPageFiscalDataProps> = ({
  pageNumber,
  buletinConfig,
  overallSummary,
  satkers = [],
  formatTheme,
  deepAnalysis,
  renderTextOrMissing
}) => {
  // HALAMAN 5: REALISASI BELANJA APBN REGIONAL
  if (pageNumber === 5) {
    return (
      <div className="p-8 sm:p-10 space-y-6 flex-1 flex flex-col justify-between">
        <div className="space-y-5">
          <div className={formatTheme.headerClass}>
            <div className="flex items-center justify-between">
              <h2 className={`text-2xl font-black ${formatTheme.headerTitleClass}`}>
                Kinerja Realisasi Belanja APBN
              </h2>
              <span className="text-xs font-bold uppercase text-amber-300">
                Data Fiskal {buletinConfig.bulanTahun}
              </span>
            </div>
          </div>

          {/* Speedometer Agregat Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-md flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-mono tracking-widest text-amber-300 uppercase block">
                TOTAL KELOLAAN BELANJA PEMERINTAH PUSAT (BPP)
              </span>
              <div className="text-2xl sm:text-3xl font-mono font-black text-white">
                {overallSummary ? formatRupiahShort(overallSummary.totalRealisasi) : 'Rp3.84 Triliun'}
              </div>
              <p className="text-xs text-slate-300">
                Dari Total Alokasi Pagu:{' '}
                <strong className="text-white">
                  {overallSummary ? formatRupiahShort(overallSummary.totalPagu) : 'Rp4.92 Triliun'}
                </strong>{' '}
                ({overallSummary ? overallSummary.totalSatkerCount : 186} Satuan Kerja)
              </p>
            </div>

            <div className="text-right bg-white/10 px-5 py-3 rounded-xl border border-white/20">
              <div className="text-[10px] text-amber-300 font-bold uppercase">Capaian Agregat</div>
              <div className="text-3xl font-mono font-black text-emerald-400">
                {overallSummary ? `${(Number.isFinite(overallSummary.persenRealisasiTotal) ? overallSummary.persenRealisasiTotal : 0).toFixed(2)}%` : '78.05%'}
              </div>
            </div>
          </div>

          {/* Breakdown 4 Akun Utama */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {overallSummary?.breakdownJenisBelanja.map(b => (
              <div key={b.kode} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-[11px] bg-slate-900 text-amber-400 px-1.5 py-0.5 rounded">
                    Akun {b.kode}
                  </span>
                  <span className="font-bold text-emerald-700">{(Number.isFinite(b.persen) ? b.persen : 0).toFixed(1)}%</span>
                </div>
                <div className="font-extrabold text-slate-800 text-[11px] truncate">{b.nama}</div>
                <div className="text-[10px] text-slate-500">
                  Real: <strong className="text-slate-800">{formatRupiahShort(b.realisasi)}</strong>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full"
                    style={{ width: `${Math.min(Number.isFinite(b.persen) ? b.persen : 0, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Analisis Deskriptif */}
          <div className="space-y-2.5 text-xs sm:text-sm text-slate-700 leading-relaxed text-justify">
            {renderTextOrMissing(
              deepAnalysis.analisisBppParagraphs[0],
              'catatanAnalis',
              'Ulasan analisis penyerapan belanja APBN regional.',
              'text-slate-700 leading-relaxed text-justify'
            )}
            {renderTextOrMissing(
              deepAnalysis.analisisBppParagraphs[1],
              'catatanAnalis',
              'Ulasan faktor pendukung dan kepatuhan RPD satker.',
              'text-slate-700 leading-relaxed text-justify'
            )}
          </div>
        </div>

        <div className={formatTheme.footerClass}>
          Statistik Fiskal APBN • KPPN Tipe A1 Semarang I
        </div>
      </div>
    );
  }

  // HALAMAN 6: TABEL PAGU & REALISASI TOP 10 KEMENTERIAN / LEMBAGA
  if (pageNumber === 6) {
    const rawKLList = overallSummary?.breakdownKementerian || (overallSummary as any)?.breakdownKL || [];
    const topKL = rawKLList.slice(0, 10);
    return (
      <div className="p-8 sm:p-10 space-y-6 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          <div className={formatTheme.headerClass}>
            <div className="flex items-center justify-between">
              <h2 className={`text-2xl font-black ${formatTheme.headerTitleClass}`}>
                Rapor Realisasi Kementerian / Lembaga
              </h2>
              <span className="text-xs font-bold uppercase text-amber-300">Top 10 K/L Pengelola Anggaran</span>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed text-justify">
            Berikut adalah profil alokasi pagu dan penyerapan anggaran pada 10 Kementerian/Lembaga dengan volume belanja terbesar di wilayah pembayaran KPPN Semarang I per {buletinConfig.bulanTahun}:
          </p>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-amber-300 font-mono text-[10px] uppercase">
                  <th className="py-2.5 px-3">No</th>
                  <th className="py-2.5 px-3">Kode &amp; Nama Kementerian / Lembaga</th>
                  <th className="py-2.5 px-3 text-right">Pagu (Rp)</th>
                  <th className="py-2.5 px-3 text-right">Realisasi (Rp)</th>
                  <th className="py-2.5 px-3 text-right">% Serap</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {topKL.map((kl: any, idx: number) => {
                  const kode = kl.kode || kl.kodeKL || '000';
                  const nama = kl.nama || kl.namaKL || 'Kementerian / Lembaga';
                  return (
                    <tr key={kode} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                      <td className="py-2 px-3 font-mono font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-2 px-3 font-semibold text-slate-800">
                        <span className="font-mono text-[10px] text-slate-400 mr-1.5">[{kode}]</span>
                        {nama}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-slate-600">
                        {formatRupiahShort(kl.pagu || 0)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                        {formatRupiahShort(kl.realisasi || 0)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-black text-emerald-700">
                        {(Number.isFinite(kl.persen) ? kl.persen : 0).toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-3 rounded-xl bg-slate-100 text-[11px] text-slate-700 space-y-1">
            <strong>Catatan Evaluasi:</strong> {deepAnalysis.topPerformersAnalysis}
          </div>
        </div>

        <div className={formatTheme.footerClass}>
          Tabel Kinerja K/L • KPPN Tipe A1 Semarang I
        </div>
      </div>
    );
  }

  // HALAMAN 7: INFOGRAFIS ANALISIS KOMPOSISI 5 K/L TERBESAR
  const rawKLList7 = overallSummary?.breakdownKementerian || (overallSummary as any)?.breakdownKL || [];
  const top5 = rawKLList7.slice(0, 5);
  return (
    <div className="p-8 sm:p-10 space-y-6 flex-1 flex flex-col justify-between">
      <div className="space-y-5">
        <div className={formatTheme.headerClass}>
          <div className="flex items-center justify-between">
            <h2 className={`text-2xl font-black ${formatTheme.headerTitleClass}`}>
              Analisis Komposisi 5 K/L Terbesar
            </h2>
            <span className="text-xs font-bold uppercase text-amber-300">Infografis Fiskal</span>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed text-justify">
          Distribusi proporsi pagu belanja terkonsentrasi pada sektor pertahanan/keamanan, pendidikan tinggi/kesehatan maritim, infrastruktur sumber daya air, keagamaan, dan penegakan hukum:
        </p>

        {/* Visual Comparison Bars */}
        <div className="space-y-3.5">
          {top5.map((kl: any, i: number) => {
            const kode = kl.kode || kl.kodeKL || `kl_${i}`;
            const nama = kl.nama || kl.namaKL || 'Kementerian / Lembaga';
            const persen = kl.persen || 0;
            return (
              <div key={kode} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="font-extrabold text-slate-900">
                    #{i + 1} {nama}
                  </div>
                  <div className="font-mono font-black text-indigo-900">
                    {formatRupiahShort(kl.realisasi || 0)} / {formatRupiahShort(kl.pagu || 0)} ({(Number.isFinite(persen) ? persen : 0).toFixed(1)}%)
                  </div>
                </div>
                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden flex">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(Math.max(Number.isFinite(persen) ? persen : 0, 0), 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Key takeaways */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-2">
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-emerald-800">
              <Award className="w-4 h-4" /> Kunci Keberhasilan Penyerapan:
            </div>
            <p className="text-[11px] leading-relaxed">
              Pelaksanaan lelang dini sejak awal tahun anggaran dan percepatan verifikasi tagihan kontraktual pihak ketiga.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-amber-800">
              <TrendingUp className="w-4 h-4" /> Rekomendasi Triwulan Berikutnya:
            </div>
            <p className="text-[11px] leading-relaxed">
              Mitigasi deviasi Halaman III DIPA dengan pemutakhiran jadwal penarikan kas pada aplikasi SAKTI.
            </p>
          </div>
        </div>
      </div>

      <div className={formatTheme.footerClass}>
        Infografis Kinerja Belanja • KPPN Tipe A1 Semarang I
      </div>
    </div>
  );
};
