import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Sliders,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
  Percent
} from 'lucide-react';
import { round2 } from '../../../calculations/deviasiHalIII';
import { BelanjaKontraktualSummary } from '../../../calculations/belanjaKontraktual';

interface DispensasiKontraktualCardProps {
  summary: BelanjaKontraktualSummary;
  isNormalisasi: boolean;
  overrideNilai: number | null | undefined;
  keteranganDispensasi: string | undefined;
  onUpdateDispensasi: (overrideNilai: number | null, isNormalisasi: boolean, keterangan?: string) => void;
  isDark?: boolean;
}

export const DispensasiKontraktualCard: React.FC<DispensasiKontraktualCardProps> = ({
  summary,
  isNormalisasi,
  overrideNilai,
  keteranganDispensasi,
  onUpdateDispensasi,
  isDark = false
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const isOverrideActive = overrideNilai !== undefined && overrideNilai !== null;
  const [inputOverride, setInputOverride] = useState<string>(
    isOverrideActive ? String(overrideNilai) : '100'
  );
  const [inputKeterangan, setInputKeterangan] = useState<string>(
    keteranganDispensasi || 'Dispensasi KPPN / Penyesuaian My InTress'
  );

  const handleToggleOverride = (enable: boolean) => {
    if (enable) {
      const parsed = parseFloat(inputOverride.replace(',', '.'));
      const val = !isNaN(parsed) ? Math.min(100, Math.max(0, parsed)) : 100;
      onUpdateDispensasi(val, isNormalisasi, inputKeterangan);
    } else {
      onUpdateDispensasi(null, isNormalisasi, undefined);
    }
  };

  const handleOverrideValueChange = (valStr: string) => {
    setInputOverride(valStr);
    const parsed = parseFloat(valStr.replace(',', '.'));
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
      onUpdateDispensasi(round2(parsed), isNormalisasi, inputKeterangan);
    }
  };

  const handleKeteranganChange = (txt: string) => {
    setInputKeterangan(txt);
    if (isOverrideActive) {
      onUpdateDispensasi(overrideNilai, isNormalisasi, txt);
    }
  };

  const handleToggleNormalisasi = (norm: boolean) => {
    onUpdateDispensasi(overrideNilai ?? null, norm, inputKeterangan);
  };

  const handleResetToStandard = () => {
    setInputOverride('100');
    setInputKeterangan('Dispensasi KPPN / Penyesuaian My InTress');
    onUpdateDispensasi(null, true, undefined);
  };

  return (
    <div
      id="card-dispensasi-kontraktual"
      className={`rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs ${
        isDark
          ? isOverrideActive
            ? 'bg-slate-900/95 border-amber-500/40 ring-1 ring-amber-500/20'
            : 'bg-slate-900/90 border-slate-800'
          : isOverrideActive
          ? 'bg-gradient-to-r from-amber-50/60 via-white to-amber-50/40 border-amber-300 ring-1 ring-amber-300/30'
          : 'bg-white border-slate-200/90'
      }`}
    >
      {/* Header Card */}
      <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-start gap-3">
          <div
            className={`p-2.5 rounded-xl mt-0.5 transition-colors ${
              isOverrideActive
                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {isOverrideActive ? (
              <ShieldAlert className="h-5 w-5" />
            ) : (
              <ShieldCheck className="h-5 w-5" />
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Evaluasi My InTress & Pengaturan Dispensasi Belanja Kontraktual
              </h3>
              {isOverrideActive ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-700">
                  <Sliders className="h-3 w-3" />
                  Mode Dispensasi Aktif (Nilai: {overrideNilai})
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700">
                  <CheckCircle2 className="h-3 w-3" />
                  Formula Standar My InTress & PER-5
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Sinkronisasi perhitungan dengan sistem My InTress Kemenkeu serta fasilitas dispensasi bila satker memiliki dispensasi KPPN.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-center">
          {isOverrideActive && (
            <button
              onClick={handleResetToStandard}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 border border-rose-200 dark:border-rose-800 transition-colors"
              title="Kembalikan ke formula standar"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset ke Standar
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label={isExpanded ? 'Sembunyikan' : 'Tampilkan'}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-5">
          {/* Diagnostic Banner: Mengapa nilai bisa berbeda dengan My InTress? */}
          <div className={`p-4 rounded-xl border text-xs leading-relaxed ${
            isDark ? 'bg-slate-800/60 border-slate-700/80 text-slate-300' : 'bg-sky-50/70 border-sky-200/80 text-sky-950'
          }`}>
            <div className="flex items-start gap-2.5">
              <Info className="h-4 w-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
              <div className="space-y-2">
                <div className="font-bold text-sky-900 dark:text-sky-300 flex items-center gap-2">
                  <span>Penyebab Perbedaan Nilai Aplikasi dengan My InTress & Solusi Penyelarasannya:</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                  <div className="p-2.5 rounded-lg bg-white/70 dark:bg-slate-900/60 border border-sky-100 dark:border-slate-700 space-y-1">
                    <span className="font-bold text-sky-700 dark:text-sky-300 flex items-center gap-1">
                      <Percent className="h-3 w-3" /> 1. Normalisasi Bobot Komponen
                    </span>
                    <p className="text-slate-600 dark:text-slate-400">
                      Di My InTress, jika satker tidak memiliki objek <strong>Belanja Modal 53 (50-200jt)</strong> atau <strong>Kontrak Dini TW I</strong>, kolom tersebut bernilai <em>blank</em> (bukan 0). My InTress secara otomatis menormalisasi pembagi bobot sehingga nilai satker tidak terpotong 40%-80%.
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white/70 dark:bg-slate-900/60 border border-sky-100 dark:border-slate-700 space-y-1">
                    <span className="font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1">
                      <FileCheck2 className="h-3 w-3" /> 2. Surat Dispensasi KPPN
                    </span>
                    <p className="text-slate-600 dark:text-slate-400">
                      Apabila satker terlambat mendaftarkan kontrak namun mendapatkan persetujuan dispensasi dari KPPN, nilai IKPA pada My InTress akan ditetapkan sesuai surat persetujuan dispensasi tersebut.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Controls Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Box 1: Normalisasi Bobot */}
            <div className={`p-4 rounded-xl border flex flex-col justify-between ${
              isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Normalisasi Bobot (Standar My InTress)
                  </span>
                  <input
                    type="checkbox"
                    id="checkbox-normalisasi-kontraktual"
                    checked={isNormalisasi}
                    onChange={(e) => handleToggleNormalisasi(e.target.checked)}
                    className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isNormalisasi
                    ? `Aktif: Bobot dihitung hanya dari komponen yang memiliki transaksi (${Math.round(summary.totalActiveWeight * 100)}% aktif). Nilai tidak terpotong 0 jika satker tidak memiliki Belanja 53 50-200jt.`
                    : 'Nonaktif: Menggunakan pembagi statis 100% (Standar tanpa normalisasi).'}
                </p>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-200 dark:border-slate-700 text-[11px] font-mono flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>Total Bobot Aktif:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {Math.round(summary.totalActiveWeight * 100)}%
                  {summary.totalActiveWeight < 1 && isNormalisasi && ' (Dinormalisasi ke 100%)'}
                </span>
              </div>
            </div>

            {/* Box 2: Override Nilai Dispensasi */}
            <div className={`p-4 rounded-xl border flex flex-col justify-between ${
              isOverrideActive
                ? isDark
                  ? 'bg-amber-950/20 border-amber-800/60'
                  : 'bg-amber-50/60 border-amber-300'
                : isDark
                ? 'bg-slate-800/40 border-slate-700'
                : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Sliders className="h-3.5 w-3.5 text-amber-500" />
                    Dispensasi / Override Manual Nilai IKPA
                  </span>
                  <input
                    type="checkbox"
                    id="checkbox-override-kontraktual"
                    checked={isOverrideActive}
                    onChange={(e) => handleToggleOverride(e.target.checked)}
                    className="h-4 w-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300 cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Aktifkan jika satker memiliki dispensasi tertulis atau ingin mencocokkan persis dengan angka My InTress.
                </p>
              </div>

              {isOverrideActive ? (
                <div className="pt-3 mt-2 border-t border-amber-200 dark:border-amber-900/60 space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      Nilai IKPA (0-100):
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={inputOverride}
                      onChange={(e) => handleOverrideValueChange(e.target.value)}
                      className="w-24 px-2 py-1 text-xs font-mono font-bold text-right rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-amber-500"
                    />
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOverrideValueChange('100')}
                        className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200/60 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 hover:bg-amber-300 transition-colors"
                      >
                        100
                      </button>
                      <button
                        onClick={() => handleOverrideValueChange(String(summary.nilaiIndikator))}
                        className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 transition-colors"
                      >
                        Hitungan
                      </button>
                    </div>
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="Nomor Surat Dispensasi / Catatan Penyelarasan..."
                      value={inputKeterangan}
                      onChange={(e) => handleKeteranganChange(e.target.value)}
                      className="w-full px-2.5 py-1 text-xs rounded-lg border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400"
                    />
                  </div>
                </div>
              ) : (
                <div className="pt-3 mt-3 border-t border-slate-200 dark:border-slate-700 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Status:</span>
                  <span className="font-semibold text-slate-500">Mengikuti Formula Otomatis</span>
                </div>
              )}
            </div>
          </div>

          {/* Tampilan Format Laporan OM-SPAN (Identik 100% dengan My InTress) */}
          <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-900/80 border-slate-700' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Komparasi Format Laporan OM-SPAN / My InTress
                </h4>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-semibold">
                Nilai OM-SPAN: {summary.nilaiIndikator.toFixed(2).replace('.', ',')}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-[11px] text-center border-collapse">
                <thead>
                  <tr className={isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700 font-semibold'}>
                    <th colSpan={3} className="py-1.5 px-2 border border-slate-200 dark:border-slate-700 text-emerald-700 dark:text-emerald-400">
                      KOMPONEN DISTRIBUSI AKSELERASI KONTRAK
                    </th>
                    <th colSpan={3} className="py-1.5 px-2 border border-slate-200 dark:border-slate-700 text-sky-700 dark:text-sky-400">
                      KOMPONEN AKSELERASI KONTRAK DINI
                    </th>
                    <th colSpan={3} className="py-1.5 px-2 border border-slate-200 dark:border-slate-700 text-amber-700 dark:text-amber-400">
                      KOMPONEN AKSELERASI BELANJA 53
                    </th>
                    <th rowSpan={2} className="py-1.5 px-3 border border-slate-200 dark:border-slate-700 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 font-bold">
                      NILAI
                    </th>
                  </tr>
                  <tr className={`text-[10px] ${isDark ? 'bg-slate-800/60 text-slate-400' : 'bg-slate-50 text-slate-600'}`}>
                    <th className="py-1 px-1.5 border border-slate-200 dark:border-slate-700">JUMLAH KONTRAK</th>
                    <th className="py-1 px-1.5 border border-slate-200 dark:border-slate-700">JUMLAH KONTRAK SMT I</th>
                    <th className="py-1 px-1.5 border border-slate-200 dark:border-slate-700 font-semibold">NILAI KOMPONEN</th>
                    <th className="py-1 px-1.5 border border-slate-200 dark:border-slate-700">JUMLAH KONTRAK TW I</th>
                    <th className="py-1 px-1.5 border border-slate-200 dark:border-slate-700">JUMLAH KONTRAK AKSELERASI</th>
                    <th className="py-1 px-1.5 border border-slate-200 dark:border-slate-700 font-semibold">NILAI KOMPONEN</th>
                    <th className="py-1 px-1.5 border border-slate-200 dark:border-slate-700">JUMLAH KONTRAK BELANJA 53</th>
                    <th className="py-1 px-1.5 border border-slate-200 dark:border-slate-700">JUMLAH KONTRAK AKSELERASI</th>
                    <th className="py-1 px-1.5 border border-slate-200 dark:border-slate-700 font-semibold">NILAI KOMPONEN</th>
                  </tr>
                </thead>
                <tbody className="font-mono text-xs">
                  <tr className={isDark ? 'bg-slate-900 text-slate-200' : 'bg-white text-slate-800'}>
                    <td className="py-2 px-2 border border-slate-200 dark:border-slate-700">{summary.rowCount}</td>
                    <td className="py-2 px-2 border border-slate-200 dark:border-slate-700">{summary.countKontrakSmtI}</td>
                    <td className="py-2 px-2 border border-slate-200 dark:border-slate-700 font-bold text-emerald-600 dark:text-emerald-400">
                      {(summary.hasDistribusi ? summary.avgDistribusiRaw : 0).toFixed(2).replace('.', ',')}
                    </td>
                    <td className="py-2 px-2 border border-slate-200 dark:border-slate-700">{summary.countKontrakTWI}</td>
                    <td className="py-2 px-2 border border-slate-200 dark:border-slate-700">{summary.countEarlyContract}</td>
                    <td className="py-2 px-2 border border-slate-200 dark:border-slate-700 font-bold text-sky-600 dark:text-sky-400">
                      {(summary.hasKontrakDini && summary.avgKontrakDini !== null ? summary.avgKontrakDini : 0).toFixed(2).replace('.', ',')}
                    </td>
                    <td className="py-2 px-2 border border-slate-200 dark:border-slate-700">{summary.countKontrak53}</td>
                    <td className="py-2 px-2 border border-slate-200 dark:border-slate-700">{summary.countBelanja53Eligible}</td>
                    <td className="py-2 px-2 border border-slate-200 dark:border-slate-700 font-bold text-amber-600 dark:text-amber-400">
                      {(summary.hasAkselerasi53 && summary.avgAkselerasi53 !== null ? summary.avgAkselerasi53 : 0).toFixed(2).replace('.', ',')}
                    </td>
                    <td className="py-2 px-3 border border-slate-200 dark:border-slate-700 font-black text-sm bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                      {summary.nilaiIndikator.toFixed(2).replace('.', ',')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
              <p className="font-semibold text-slate-700 dark:text-slate-300">
                🔍 Mengapa di luar (OM-SPAN) bernilai 50 sedangkan di formula lama Excel hanya 10?
              </p>
              <ul className="list-disc pl-4 space-y-0.5 text-slate-600 dark:text-slate-400">
                <li>
                  <strong>Di OM-SPAN:</strong> Satker Anda hanya memiliki 1 kontrak di Semester II (Bukan TW I dan Bukan Belanja 53). Maka <em>Jumlah Kontrak TW I = 0</em> dan <em>Jumlah Belanja 53 = 0</em> (Nihil Objek). OM-SPAN <strong>tidak membagi dengan 100%</strong>, melainkan menormalisasi bobot penuh ke Komponen Distribusi (Nilai = 50,00).
                </li>
                <li>
                  <strong>Di Formula Lama Excel:</strong> Excel kaku menghitung <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded font-mono">(20% × 50) + (40% × 0) + (40% × 0) = 10,00</code> karena menganggap komponen kosong sebagai angka nol (0).
                </li>
                <li>
                  <strong>Di Aplikasi Angkasa Sekarang:</strong> Dengan mengaktifkan formula normalisasi standar OM-SPAN di atas, nilai indikator langsung tersinkronisasi menjadi <strong>50,00</strong> (Nilai Berbobot IKPA 10% = <strong>5,00</strong>).
                </li>
              </ul>
            </div>
          </div>

          {/* Quick Metrics Comparison Footer */}
          <div className="p-3 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Komp. Distribusi (20%):</span>
                <span className="ml-1 font-mono font-bold text-slate-800 dark:text-slate-200">{summary.kompDistribusi}</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Komp. Dini (40%):</span>
                <span className="ml-1 font-mono font-bold text-slate-800 dark:text-slate-200">{summary.kompKontrakDini}</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Komp. 53 (40%):</span>
                <span className="ml-1 font-mono font-bold text-slate-800 dark:text-slate-200">{summary.kompAkselerasi53}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[11px] text-slate-500">Nilai Akhir Indikator (N30):</span>
              <span className={`font-mono text-base font-black ${
                isOverrideActive ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}>
                {summary.nilaiIndikator}
              </span>
              <span className="text-[11px] text-slate-500">Berbobot 10% (J8):</span>
              <span className="font-mono text-base font-black text-sky-600 dark:text-sky-400">
                {summary.weightedValue}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
