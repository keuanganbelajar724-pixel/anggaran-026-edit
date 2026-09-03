import React, { useState } from 'react';
import { DiagnostikCaputResult, DiagnostikCaputROItem } from '../types';
import { 
  BarChart3, 
  TrendingUp, 
  Layers, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  Sliders, 
  Filter,
  PieChart as PieIcon,
  HelpCircle
} from 'lucide-react';

interface KroDistributionAnalyticsProps {
  data: DiagnostikCaputResult;
  onSelectRo: (ro: DiagnostikCaputROItem) => void;
  isDark?: boolean;
}

interface KroGroupSummary {
  kodeKro: string;
  namaKro: string;
  roCount: number;
  totalPagu: number;
  totalRealisasiPpa: number;
  avgPcro: number;
  avgTpcro: number;
  avgScoreZ: number;
  roKritisCount: number;
  items: DiagnostikCaputROItem[];
}

export const KroDistributionAnalyticsView: React.FC<KroDistributionAnalyticsProps> = ({
  data,
  onSelectRo,
  isDark = false
}) => {
  const [selectedKro, setSelectedKro] = useState<string>('ALL');

  // Group items by KRO (First 6-8 digits of kodeRo, or derived from kodeRo format: Program.Kegiatan.KRO.RO)
  const kroGroups: Record<string, KroGroupSummary> = {};

  data.items.forEach(item => {
    // Determine KRO code (e.g. 5262.EBA or prefix before .001)
    const parts = item.kodeRo.split('.');
    let kodeKro = 'UMUM';
    if (parts.length >= 3) {
      kodeKro = `${parts[0]}.${parts[1]}.${parts[2]}`;
    } else if (parts.length >= 2) {
      kodeKro = `${parts[0]}.${parts[1]}`;
    } else {
      kodeKro = item.kodeRo.slice(0, 6) || 'KRO-01';
    }

    if (!kroGroups[kodeKro]) {
      kroGroups[kodeKro] = {
        kodeKro,
        namaKro: item.namaRo.split('-')[0] || `Kelompok Output ${kodeKro}`,
        roCount: 0,
        totalPagu: 0,
        totalRealisasiPpa: 0,
        avgPcro: 0,
        avgTpcro: 0,
        avgScoreZ: 0,
        roKritisCount: 0,
        items: []
      };
    }

    const group = kroGroups[kodeKro];
    group.roCount += 1;
    group.totalPagu += item.alokasiAnggaran || 0;
    group.totalRealisasiPpa += (item.alokasiAnggaran || 0) * (item.realisasiAnggaran / 100);
    group.avgPcro += item.realisasiProgres;
    group.avgTpcro += item.targetProgres;
    group.avgScoreZ += item.nilaiKomponenRo;
    if (item.diagnosaSeverity === 'KRITIS') {
      group.roKritisCount += 1;
    }
    group.items.push(item);
  });

  // Calculate averages
  const kroList: KroGroupSummary[] = Object.values(kroGroups).map(g => ({
    ...g,
    avgPcro: g.roCount > 0 ? Number((g.avgPcro / g.roCount).toFixed(1)) : 0,
    avgTpcro: g.roCount > 0 ? Number((g.avgTpcro / g.roCount).toFixed(1)) : 0,
    avgScoreZ: g.roCount > 0 ? Number((g.avgScoreZ / g.roCount).toFixed(2)) : 0,
  })).sort((a, b) => a.avgScoreZ - b.avgScoreZ); // Lowest score first

  const activeKroItems = selectedKro === 'ALL' 
    ? data.items 
    : data.items.filter(it => {
        const parts = it.kodeRo.split('.');
        const itKro = parts.length >= 3 ? `${parts[0]}.${parts[1]}.${parts[2]}` : it.kodeRo.slice(0, 6);
        return itKro === selectedKro;
      });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className={`p-6 sm:p-8 rounded-3xl border ${
        isDark ? 'bg-slate-800/90 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
      } space-y-4`}>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-cyan-300 text-xs font-bold">
          <Layers className="w-3.5 h-3.5" />
          <span>Analisis Portofolio KRO &bull; Klasifikasi Rincian Output</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
          Klasterisasi Kinerja Output Berdasarkan KRO &amp; Bobot Anggaran
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-3xl leading-relaxed">
          Mengidentifikasi kelompok KRO penyumbang deviasi terbesar (bottleneck) dan mengevaluasi efisiensi pencapaian fisik antar-kegiatan untuk bahan rapat pimpinan evaluasi bulanan/triwulanan.
        </p>
      </div>

      {/* Grid of KRO Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {kroList.map((kro) => (
          <div
            key={kro.kodeKro}
            onClick={() => setSelectedKro(selectedKro === kro.kodeKro ? 'ALL' : kro.kodeKro)}
            className={`p-5 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between ${
              selectedKro === kro.kodeKro
                ? 'bg-indigo-50/90 dark:bg-indigo-950/80 border-indigo-500 ring-2 ring-indigo-500/20 shadow-md'
                : isDark 
                  ? 'bg-slate-800/80 border-slate-700 hover:bg-slate-800' 
                  : 'bg-white border-slate-200 hover:bg-slate-50 shadow-sm'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-cyan-300">
                  {kro.kodeKro}
                </span>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                  kro.avgScoreZ >= 99.99
                    ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    : 'bg-rose-600 text-white font-bold shadow-sm'
                }`}>
                  Rata-rata Z: {kro.avgScoreZ.toFixed(1)}
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                  {kro.namaKro}
                </h4>
                <span className="text-[11px] text-slate-400">
                  {kro.roCount} Rincian Output (RO) &bull; {kro.roKritisCount > 0 ? `🚨 ${kro.roKritisCount} Kritis` : '✅ Seluruhnya Aman'}
                </span>
              </div>

              {/* Mini Progress Bars */}
              <div className="space-y-2 pt-1 text-xs">
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-500">Realisasi Fisik (PCRO)</span>
                    <strong className="font-mono text-slate-700 dark:text-slate-300">{kro.avgPcro}%</strong>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 rounded-full" 
                      style={{ width: `${Math.min(100, kro.avgPcro)}%` }} 
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-500">Target Progres (TPCRO)</span>
                    <strong className="font-mono text-slate-700 dark:text-slate-300">{kro.avgTpcro}%</strong>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-cyan-500 rounded-full" 
                      style={{ width: `${Math.min(100, kro.avgTpcro)}%` }} 
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-current/10 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-400">
                Pagu: Rp {kro.totalPagu.toLocaleString('id-ID')}
              </span>
              <span className="text-xs font-bold text-indigo-600 dark:text-cyan-400">
                {selectedKro === kro.kodeKro ? 'Tampilkan Semua' : 'Filter KRO &rarr;'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Filtered Table of ROs inside Selected KRO */}
      <div className={`p-6 rounded-3xl border ${
        isDark ? 'bg-slate-800/90 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
      } space-y-4`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Daftar RO Terkait:</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-cyan-300 font-mono">
                {selectedKro === 'ALL' ? 'Semua KRO' : `KRO ${selectedKro}`} ({activeKroItems.length} RO)
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Klik salah satu RO untuk membuka simulator atau penyusun narasi.
            </p>
          </div>

          {selectedKro !== 'ALL' && (
            <button
              onClick={() => setSelectedKro('ALL')}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-all cursor-pointer"
            >
              Reset Filter KRO
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className={`text-[11px] font-bold uppercase tracking-wider ${
              isDark ? 'bg-slate-900 text-slate-400' : 'bg-slate-50 text-slate-500'
            }`}>
              <tr>
                <th className="p-3 rounded-l-xl">Kode RO</th>
                <th className="p-3">Nama Rincian Output</th>
                <th className="p-3 text-center">PCRO (Fisik)</th>
                <th className="p-3 text-center">TPCRO (Target)</th>
                <th className="p-3 text-center">Kolom Z (IKPA)</th>
                <th className="p-3 text-center">Status SAKTI</th>
                <th className="p-3 text-right rounded-r-xl">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-current/5">
              {activeKroItems.map(ro => (
                <tr key={ro.id} className="hover:bg-slate-500/5 transition-colors">
                  <td className="p-3 font-mono font-bold text-indigo-600 dark:text-cyan-400 whitespace-nowrap">
                    {ro.kodeRo}
                  </td>
                  <td className="p-3 font-medium text-slate-800 dark:text-slate-200 max-w-xs truncate">
                    {ro.namaRo}
                  </td>
                  <td className="p-3 text-center font-mono">
                    {ro.realisasiProgres.toFixed(1)}%
                  </td>
                  <td className="p-3 text-center font-mono">
                    {ro.targetProgres.toFixed(1)}%
                  </td>
                  <td className="p-3 text-center font-mono">
                    <span className={`px-2 py-0.5 rounded font-bold ${
                      ro.nilaiKomponenRo >= 99.99
                        ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        : 'bg-rose-600 text-white font-black shadow-sm'
                    }`}>
                      {ro.nilaiKomponenRo.toFixed(1)}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      ro.validasiSaktiStatus?.includes('Ditolak')
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        : ro.validasiSaktiStatus?.includes('Early Warning')
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}>
                      {ro.validasiSaktiStatus || 'Lolos Validasi'}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => onSelectRo(ro)}
                      className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                    >
                      Buka RO
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
