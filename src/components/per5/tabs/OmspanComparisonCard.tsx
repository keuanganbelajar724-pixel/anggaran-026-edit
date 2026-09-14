import React, { useState } from 'react';
import {
  Sparkles,
  Info,
  CheckCircle2,
  Scale,
  ArrowRight,
  HelpCircle,
  Calculator,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  TrendingDown,
  FileSpreadsheet
} from 'lucide-react';
import { BelanjaKontraktualSummary } from '../../../calculations/belanjaKontraktual';
import { formatScore, formatPercent } from '../../../utils/excelReferenceDataHelper';

interface OmspanComparisonCardProps {
  summary: BelanjaKontraktualSummary;
  activeMetode: 'omspan' | 'excel';
  onSelectMetode: (metode: 'omspan' | 'excel') => void;
  onSyncToOmspan: () => void;
  isDark?: boolean;
}

export const OmspanComparisonCard: React.FC<OmspanComparisonCardProps> = ({
  summary,
  activeMetode,
  onSelectMetode,
  onSyncToOmspan,
  isDark = false
}) => {
  const [showTableJuknis, setShowTableJuknis] = useState(true);
  const isOmspan = activeMetode === 'omspan';

  // Matriks tabel resmi juknis PER-5
  const matriksRasio = [
    { label: 'Rasio > 75,00%', min: 75.001, max: 100, score: 100, desc: 'Sangat Baik' },
    { label: '50,01% < Rasio <= 75,00%', min: 50.001, max: 75, score: 80, desc: 'Baik (Posisi Satker Anda)' },
    { label: '25,01% < Rasio <= 50,00%', min: 25.001, max: 50, score: 60, desc: 'Cukup' },
    { label: '0,01% < Rasio <= 25,00%', min: 0.001, max: 25, score: 50, desc: 'Kurang' },
    { label: 'Rasio = 0%', min: 0, max: 0, score: 0, desc: 'Tidak Ada Kontrak Sem I' }
  ];

  return (
    <div
      id="card-omspan-comparison"
      className={`rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs ${
        isDark
          ? 'bg-slate-900/90 border-slate-800'
          : 'bg-white border-slate-200/90'
      }`}
    >
      {/* Header Card */}
      <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 mt-0.5">
            <Scale className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
                Distribusi Akselerasi Kontrak (Bobot 20% PER-5/PB/2022)
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                Standar Resmi OM-SPAN / My InTress
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Kontrak Semester I (s.d. TW II) bernilai <strong>100</strong>. Kontrak Semester II menurunkan rasio satker dan dinilai bertingkat.
            </p>
          </div>
        </div>

        {/* Sync Button */}
        <button
          id="btn-sync-omspan"
          onClick={onSyncToOmspan}
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 text-xs font-semibold shadow-xs transition-all cursor-pointer shrink-0"
        >
          <Sparkles className="h-4 w-4 text-amber-300" />
          <span>Sinkronkan Nilai ke Standar OM-SPAN</span>
        </button>
      </div>

      {/* Perbandingan 2 Nilai */}
      <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Kolom Kiri: Standar OM-SPAN / My InTress */}
        <div
          onClick={() => onSelectMetode('omspan')}
          className={`cursor-pointer rounded-xl p-4 border transition-all relative ${
            isOmspan
              ? isDark
                ? 'bg-blue-950/30 border-blue-500/60 ring-2 ring-blue-500/20'
                : 'bg-blue-50/50 border-blue-400 ring-2 ring-blue-400/20 shadow-xs'
              : isDark
              ? 'bg-slate-900/40 border-slate-800 opacity-80 hover:opacity-100'
              : 'bg-slate-50/50 border-slate-200 opacity-80 hover:opacity-100'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 rounded-full bg-blue-600" />
              <span className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                Standar Resmi OM-SPAN / My InTress
              </span>
            </div>
            {isOmspan && (
              <span className="flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="h-3 w-3" /> Metode Aktif
              </span>
            )}
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <span className="text-2xl sm:text-3xl font-black font-mono text-blue-600 dark:text-blue-400">
                {formatScore(summary.nilaiIndikatorOmspan)}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 ml-1.5 font-medium">
                (Bobot 10%: <strong className="text-slate-700 dark:text-slate-200 font-mono">{formatScore((summary.nilaiIndikatorOmspan * 10) / 100)}</strong>)
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Nilai Komponen Distribusi</span>
              <span className="font-mono font-bold text-sm text-blue-700 dark:text-blue-300">
                {formatScore(summary.nilaiKinerjaDistribusiOmspan)} (Bobot 20%)
              </span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-blue-100/70 dark:border-blue-900/30 text-[11px] text-slate-600 dark:text-slate-300 space-y-1.5">
            <div className="flex justify-between">
              <span>Total Kontrak (&ge; Rp50 Juta):</span>
              <span className="font-mono font-bold">{summary.rowCount} Kontrak</span>
            </div>
            <div className="flex justify-between">
              <span>Kontrak Diterbitkan s.d. TW II (Sem I):</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {summary.countKontrakSmtI} Kontrak (Poin 100)
              </span>
            </div>
            <div className="flex justify-between">
              <span>Kontrak Diterbitkan Semester II:</span>
              <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                {summary.rowCount - summary.countKontrakSmtI} Kontrak (Poin Turun)
              </span>
            </div>
            <div className="flex justify-between items-center bg-blue-100/50 dark:bg-blue-900/40 p-2 rounded-lg mt-1">
              <span>Rasio Agregat s.d. TW II:</span>
              <span className="font-mono font-bold text-blue-700 dark:text-blue-300 text-xs">
                {summary.countKontrakSmtI} / {summary.rowCount} = {formatPercent(summary.rasioKontrakSmtI)} → Skor {summary.skorDistribusiOmspan}
              </span>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Rata-Rata Kolom N Excel */}
        <div
          onClick={() => onSelectMetode('excel')}
          className={`cursor-pointer rounded-xl p-4 border transition-all relative ${
            !isOmspan
              ? isDark
                ? 'bg-amber-950/30 border-amber-500/60 ring-2 ring-amber-500/20'
                : 'bg-amber-50/50 border-amber-400 ring-2 ring-amber-400/20 shadow-xs'
              : isDark
              ? 'bg-slate-900/40 border-slate-800 opacity-80 hover:opacity-100'
              : 'bg-slate-50/50 border-slate-200 opacity-80 hover:opacity-100'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 rounded-full bg-amber-500" />
              <span className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wide">
                Simulasi Rata-Rata Baris Excel
              </span>
            </div>
            {!isOmspan && (
              <span className="flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="h-3 w-3" /> Metode Aktif
              </span>
            )}
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <span className="text-2xl sm:text-3xl font-black font-mono text-amber-600 dark:text-amber-400">
                {formatScore(summary.nilaiIndikatorExcel)}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 ml-1.5 font-medium">
                (Bobot 10%: <strong className="text-slate-700 dark:text-slate-200 font-mono">{formatScore((summary.nilaiIndikatorExcel * 10) / 100)}</strong>)
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Rata-Rata Kolom N (N27)</span>
              <span className="font-mono font-bold text-sm text-amber-700 dark:text-amber-300">
                {formatScore(summary.avgDistribusiRaw)}
              </span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-amber-100/70 dark:border-amber-900/30 text-[11px] text-slate-600 dark:text-slate-300 space-y-1.5">
            <div className="flex justify-between">
              <span>Rumus Sel N27:</span>
              <span className="font-mono font-bold text-slate-700 dark:text-slate-300">=AVERAGE(Kolom N)</span>
            </div>
            <div className="flex justify-between">
              <span>Nilai Kinerja N29:</span>
              <span className="font-mono font-bold">{formatScore(summary.kompDistribusi)} (20% × {formatScore(summary.avgDistribusiRaw)})</span>
            </div>
            <div className="flex justify-between">
              <span>Normalisasi Bobot Aktif:</span>
              <span className="font-mono font-bold">{summary.totalActiveWeight * 100}%</span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 italic pt-1">
              *Di Excel manual, jika Kolom N terisi 50, 100, 50, maka rata-ratanya 66,67 sehingga nilai indikator menjadi 66,65.
            </p>
          </div>
        </div>
      </div>

      {/* Tabel Juknis & Mekanisme Slide PER-5 */}
      <div className="px-4 pb-4 sm:px-5 sm:pb-5 space-y-3">
        <div className={`p-4 rounded-xl border text-xs leading-relaxed ${
          isDark
            ? 'bg-slate-800/40 border-slate-700/60 text-slate-300'
            : 'bg-blue-50/40 border-blue-200/70 text-slate-700'
        }`}>
          <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowTableJuknis(!showTableJuknis)}>
            <div className="flex items-center gap-2 font-bold text-sm text-blue-900 dark:text-blue-300">
              <Info className="h-4 w-4 text-blue-600" />
              <span>Pedoman Resmi: Mekanisme Penilaian Bertingkat PER-5/PB/2022</span>
            </div>
            <button className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 font-semibold">
              {showTableJuknis ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>

          {showTableJuknis && (
            <div className="mt-3 pt-3 border-t border-blue-200/60 dark:border-slate-700 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 rounded-lg bg-white/80 dark:bg-slate-900/60 border border-blue-100 dark:border-slate-800">
                  <strong className="text-blue-800 dark:text-blue-300 block mb-1">Ketentuan Dasar Juknis:</strong>
                  <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300">
                    <li>Nilai kontrak yang diperhitungkan: <strong>Rp50 juta ke atas</strong> untuk seluruh Jenis Belanja (JB: 51, 52, 53, 57).</li>
                    <li>Dihitung berdasarkan <strong>Tanggal Kontrak</strong>.</li>
                    <li>Rasio = <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-blue-700 dark:text-blue-400 font-semibold font-mono">Kontrak s.d. TW II / Seluruh Kontrak Tahun Berkenaan</code>.</li>
                  </ul>
                </div>

                <div className="p-2.5 rounded-lg bg-white/80 dark:bg-slate-900/60 border border-blue-100 dark:border-slate-800">
                  <strong className="text-emerald-700 dark:text-emerald-400 block mb-1">Mengapa Semester II Menurunkan Nilai?</strong>
                  <p className="text-slate-600 dark:text-slate-300">
                    Setiap kontrak yang terbit di <strong>Semester I (s.d. TW II) selalu bernilai 100</strong>. Jika ada kontrak baru di <strong>Semester II (setelah TW II)</strong>, total kontrak (penyebut) bertambah sehingga rasio satker turun. Akibatnya, kontrak Semester II memperoleh poin bertingkat lebih rendah (80, 60, 50, atau 0).
                  </p>
                </div>
              </div>

              {/* Tabel Matriks Resmi */}
              <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                <table className="w-full text-center text-xs">
                  <thead className="bg-blue-600 text-white font-semibold">
                    <tr>
                      <th className="py-2 px-3 text-left">Rasio Jumlah Data Perjanjian/Kontrak yang Didaftarkan s.d. TW II</th>
                      <th className="py-2 px-3 w-28">Nilai Poin</th>
                      <th className="py-2 px-3 w-44">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                    {matriksRasio.map((m, idx) => {
                      const isCurrent = summary.rasioKontrakSmtI > m.min && summary.rasioKontrakSmtI <= m.max;
                      const isZeroMatch = m.min === 0 && m.max === 0 && summary.rasioKontrakSmtI === 0;
                      const active = isCurrent || isZeroMatch;

                      return (
                        <tr
                          key={idx}
                          className={`${
                            active
                              ? 'bg-blue-100/70 dark:bg-blue-950/60 font-bold text-blue-900 dark:text-blue-200 ring-1 ring-blue-500'
                              : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <td className="py-1.5 px-3 text-left font-mono">
                            {m.label}
                          </td>
                          <td className="py-1.5 px-3 font-mono text-base font-black text-blue-600 dark:text-blue-400">
                            {m.score}
                          </td>
                          <td className="py-1.5 px-3 text-xs">
                            {active ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full font-bold">
                                <CheckCircle2 className="h-3 w-3" /> Posisi Satker Saat Ini
                              </span>
                            ) : (
                              <span className="text-slate-400">{m.desc}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Rincian Kasus Riil Satker Anda */}
              <div className="p-3 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200 text-[11px] space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Kesesuaian pada Data Satker RORENA POLDA JATENG:</span>
                </div>
                <p>
                  1. Kontrak Mei (TW II) = <strong>Poin 100</strong> (karena terbit di Semester I).<br />
                  2. Kontrak Juni (TW II) = <strong>Poin 100</strong> (karena terbit di Semester I).<br />
                  3. Kontrak Agustus (TW III / Semester II) = <strong>Poin 80</strong> (karena kontrak Semester II ini menurunkan rasio satker menjadi 2/3 = 66,67%, yang jatuh pada rentang 50,01% &lt; Rasio &le; 75,00%).
                </p>
                <p className="pt-1 text-emerald-700 dark:text-emerald-300 font-semibold">
                  Maka di OM-SPAN nilai akhir indikator menjadi <strong>80,00</strong> (atau nilai berbobot 10% = <strong>8,00</strong>).
                </p>
              </div>

              {/* Ketentuan Komponen Kontrak Dini (Bobot 40%) */}
              <div className="p-3 rounded-lg bg-sky-50/80 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/60 text-sky-950 dark:text-sky-200 text-[11px] space-y-2">
                <div className="font-bold flex items-center gap-1.5 text-sky-800 dark:text-sky-300">
                  <Sparkles className="h-4 w-4 text-sky-600" />
                  <span>Ketentuan Kontrak Dini & Fleksibilitas My InTress:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="p-2 rounded bg-white/70 dark:bg-slate-900/50 border border-sky-100 dark:border-slate-800">
                    <span className="font-bold text-sky-700 dark:text-sky-300 block">1. Otomatis Sistem (Pra-DIPA):</span>
                    <p className="text-slate-600 dark:text-slate-300 mt-0.5">
                      Kontrak yang ditandatangani <strong>sebelum 1 Januari</strong> tahun anggaran berjalan otomatis dinilai <strong>120</strong>.
                    </p>
                  </div>
                  <div className="p-2 rounded bg-white/70 dark:bg-slate-900/50 border border-sky-100 dark:border-slate-800">
                    <span className="font-bold text-sky-700 dark:text-sky-300 block">2. Fleksibilitas My InTress (TW I):</span>
                    <p className="text-slate-600 dark:text-slate-300 mt-0.5">
                      Kontrak di tahun berjalan defaultnya bukan objek dini, namun dapat <strong>diubah fleksibel ke 110 (Dini TW I)</strong> di tabel jika di My InTress memang diakui sebagai kontrak dini.
                    </p>
                  </div>
                </div>
                <div className="p-2 rounded bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200">
                  <strong className="block mb-0.5">💡 Tanpa Penalti Keterlambatan Pendaftaran:</strong>
                  Keterlambatan pendaftaran kontrak ke KPPN (&gt; 5 hari kerja) <strong>TIDAK mengurangi nilai IKPA</strong> di PER-5/PB/2022. Nilai indikator akhir juga secara otomatis di-capping maksimal <strong>100,00</strong>.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

