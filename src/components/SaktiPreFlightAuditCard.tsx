import React, { useState } from 'react';
import { DiagnostikCaputResult, DiagnostikCaputROItem } from '../types';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Sparkles, 
  HelpCircle,
  TrendingUp,
  FileCheck,
  Zap,
  ArrowRight
} from 'lucide-react';

interface SaktiPreFlightAuditProps {
  data: DiagnostikCaputResult;
  onOpenSimulator: (ro: DiagnostikCaputROItem) => void;
  onOpenNarrativeBuilder: (ro: DiagnostikCaputROItem) => void;
  isDark?: boolean;
}

export const SaktiPreFlightAuditCard: React.FC<SaktiPreFlightAuditProps> = ({
  data,
  onOpenSimulator,
  onOpenNarrativeBuilder,
  isDark = false
}) => {
  const [selectedAuditFilter, setSelectedAuditFilter] = useState<'ALL' | 'SIAP' | 'PERLU_PERBAIKAN' | 'DITOLAK'>('ALL');

  const totalRo = data.items.length;
  if (totalRo === 0) return null;

  // Audit Calculations
  const roDitolakList = data.items.filter(it => it.validasiSaktiStatus?.includes('Ditolak'));
  const roEarlyWarningList = data.items.filter(it => it.validasiSaktiStatus?.includes('Early Warning'));
  const roBelum100List = data.items.filter(it => it.nilaiKomponenRo < 100);
  const roOptimalList = data.items.filter(it => it.diagnosaSeverity === 'OPTIMAL' && !it.validasiSaktiStatus?.includes('Ditolak'));
  const roPerluPerbaikanList = data.items.filter(it => it.validasiSaktiStatus?.includes('Ditolak') || it.diagnosaSeverity === 'KRITIS');

  // Health Score Calculation (0 - 100%)
  const validasiScore = Math.max(0, 100 - (roDitolakList.length / totalRo * 60) - (roEarlyWarningList.length / totalRo * 25));
  const healthScore = Math.round((validasiScore * 0.5) + (data.summary.currentScoreCaput * 0.5));

  // Readiness categorization
  let readinessStatus: 'SIAP' | 'PERLU_PERHATIAN' | 'BAHAYA' = 'SIAP';
  if (roDitolakList.length > 0 || healthScore < 70) {
    readinessStatus = 'BAHAYA';
  } else if (roEarlyWarningList.length > 0 || healthScore < 90) {
    readinessStatus = 'PERLU_PERHATIAN';
  }

  // Filter items for mini-checklist table
  const auditList = data.items.filter(it => {
    if (selectedAuditFilter === 'SIAP') return it.validasiSaktiCode === '00' && it.nilaiKomponenRo >= 100;
    if (selectedAuditFilter === 'PERLU_PERBAIKAN') return it.validasiSaktiCode !== '00' || it.nilaiKomponenRo < 100;
    if (selectedAuditFilter === 'DITOLAK') return it.validasiSaktiStatus?.includes('Ditolak');
    return true;
  });

  return (
    <div className={`p-6 sm:p-7 rounded-3xl border ${
      isDark ? 'bg-slate-800/90 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
    } space-y-6`}>
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-cyan-300 text-xs font-bold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Audit Pra-Approval SAKTI 2026 &bull; Health-Check Scorecard</span>
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <span>Status Kesiapan SAKTI &amp; Evaluasi Kepatuhan PPK</span>
            <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
              readinessStatus === 'SIAP'
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                : readinessStatus === 'PERLU_PERHATIAN'
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300'
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300'
            }`}>
              {readinessStatus === 'SIAP' ? '✅ SIAP APPROVAL' : readinessStatus === 'PERLU_PERHATIAN' ? '⚠️ PERIKSA EARLY WARNING' : '🚨 PERLU PERBAIKAN SEBELUM APPROVAL'}
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Audit otomatis sebelum PPK melakukan persetujuan (Approval) data Capaian Output pada modul Komitmen SAKTI. Memastikan bebas dari penolakan sistemik dan memaksimalkan nilai IKPA.
          </p>
        </div>
      </div>

      {/* Grid of Key Scorecard Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Health Index Card */}
        <div className={`p-4 rounded-2xl border flex flex-col justify-between ${
          healthScore >= 90
            ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
            : healthScore >= 70
              ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
              : 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800'
        }`}>
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
            <span>Skor Kesiapan SAKTI</span>
            <Sparkles className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="my-2 text-center">
            <div className={`text-3xl font-black ${
              healthScore >= 90 ? 'text-emerald-600 dark:text-emerald-400' : healthScore >= 70 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
            }`}>
              {healthScore}%
            </div>
            <span className="text-[11px] text-slate-500">
              {healthScore >= 90 ? 'Tingkat Kepatuhan Sempurna' : healthScore >= 70 ? 'Cukup (Perlu Mitigasi)' : 'Beresiko Ditolak SAKTI'}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 pt-2 border-t border-current/10">
            Target Nilai IKPA: <strong className="text-slate-700 dark:text-slate-300 font-mono">{data.summary.currentScoreCaput.toFixed(2)}</strong>
          </div>
        </div>

        {/* Status Error Validasi */}
        <div className={`p-4 rounded-2xl border flex flex-col justify-between ${
          roDitolakList.length === 0
            ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
            : 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-300 dark:border-rose-900'
        }`}>
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
            <span>Input Ditolak SAKTI</span>
            {roDitolakList.length === 0 ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-rose-500" />}
          </div>
          <div className="my-2 text-center">
            <div className={`text-3xl font-black ${roDitolakList.length === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {roDitolakList.length} <span className="text-sm font-semibold text-slate-400">/ {totalRo} RO</span>
            </div>
            <span className="text-[11px] text-slate-500">
              {roDitolakList.length === 0 ? 'Tidak ada error pencekalan' : 'Harus diperbaiki sebelum simpan'}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 pt-2 border-t border-current/10">
            Aturan: Validasi 01, 03, 04, 06
          </div>
        </div>

        {/* Early Warning Alert */}
        <div className={`p-4 rounded-2xl border flex flex-col justify-between ${
          roEarlyWarningList.length === 0
            ? 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800'
            : 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-300 dark:border-amber-900'
        }`}>
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
            <span>Early Warning Validasi</span>
            <AlertTriangle className={`w-4 h-4 ${roEarlyWarningList.length > 0 ? 'text-amber-500' : 'text-slate-400'}`} />
          </div>
          <div className="my-2 text-center">
            <div className={`text-3xl font-black ${roEarlyWarningList.length === 0 ? 'text-slate-700 dark:text-slate-300' : 'text-amber-600 dark:text-amber-400'}`}>
              {roEarlyWarningList.length} <span className="text-sm font-semibold text-slate-400">/ {totalRo} RO</span>
            </div>
            <span className="text-[11px] text-slate-500">
              {roEarlyWarningList.length === 0 ? 'Seluruh parameter wajar' : 'Wajib isi kode referensi & keterangan'}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 pt-2 border-t border-current/10">
            Aturan: Validasi 02, 05, 07, 08
          </div>
        </div>

        {/* Cut-off Countdown / Open Period */}
        <div className={`p-4 rounded-2xl border flex flex-col justify-between ${
          isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
            <span>Batas Waktu Pelaporan</span>
            <Clock className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="my-2 text-center">
            <div className="text-xl font-black text-indigo-600 dark:text-cyan-400">
              Hari Kerja ke-7
            </div>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              Pkl 23:59 WIB Bulan Berjalan
            </span>
          </div>
          <div className="text-[10px] text-slate-400 pt-2 border-t border-current/10 flex justify-between">
            <span>Periode: <strong>{data.summary.periode}</strong></span>
            <span className="text-emerald-600 font-bold">Open Period</span>
          </div>
        </div>
      </div>

      {/* 5 Checklist Prasyarat Approval PPK */}
      <div className={`p-4 sm:p-5 rounded-2xl border ${
        isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
      } space-y-3`}>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <FileCheck className="w-4 h-4 text-indigo-500" />
          <span>5 Butir Checklist Kepatuhan Pelaporan SAKTI (PER-5/PB/2024):</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            {roDitolakList.length === 0 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            )}
            <div>
              <strong className="block font-bold">1. Bebas Error Pencekalan</strong>
              <p className="text-[11px] text-slate-500">PCRO ≤ 100%, PCRO ≥ capaian bulan lalu, RVRO ≤ TVRO.</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">2. Kode Referensi Terpilih</strong>
              <p className="text-[11px] text-slate-500">Referensi substantif 01 s.d. 08 telah dipilih sesuai kondisi riil (hindari kode 99).</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">3. 3 Elemen Narasi Keterangan</strong>
              <p className="text-[11px] text-slate-500">Memuat tahapan aktivitas, kendala deviasi, dan rencana solusi.</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">4. Keselarasan Fisik &amp; Belanja</strong>
              <p className="text-[11px] text-slate-500">GAP PCRO dan PPA &gt; 20% telah dilengkapi justifikasi logis.</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">5. Otorisasi PPK (Modul Komitmen)</strong>
              <p className="text-[11px] text-slate-500">PPK melakukan approval user sebelum periode cut-off berakhir.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mini Interactive Filterable List of ROs for Action */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Tabel Audit Cepat Rincian Output:
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSelectedAuditFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedAuditFilter === 'ALL'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              Semua ({totalRo})
            </button>
            <button
              onClick={() => setSelectedAuditFilter('DITOLAK')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedAuditFilter === 'DITOLAK'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
              }`}
            >
              🚨 Ditolak ({roDitolakList.length})
            </button>
            <button
              onClick={() => setSelectedAuditFilter('PERLU_PERBAIKAN')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedAuditFilter === 'PERLU_PERBAIKAN'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-rose-50 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
              }`}
            >
              🚨 Belum Optimal ({roEarlyWarningList.length + roBelum100List.length})
            </button>
            <button
              onClick={() => setSelectedAuditFilter('SIAP')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedAuditFilter === 'SIAP'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
              }`}
            >
              Siap Approval ({roOptimalList.length})
            </button>
          </div>
        </div>

        <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
          {auditList.map(ro => {
            const isBelumOpt = ro.nilaiKomponenRo < 99.99 || ro.diagnosaSeverity !== 'OPTIMAL' || ro.validasiSaktiStatus?.includes('Ditolak');
            return (
              <div 
                key={ro.id}
                className={`p-3 rounded-xl border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-all ${
                  isBelumOpt
                    ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-400 dark:border-rose-800 text-rose-950 dark:text-rose-100 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-mono font-bold px-1.5 py-0.5 rounded text-xs ${
                      isBelumOpt
                        ? 'bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-200'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}>
                      {ro.kodeRo}
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-sm sm:max-w-md">
                      {ro.namaRo}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                    <span>PCRO: <strong>{ro.realisasiProgres.toFixed(1)}%</strong></span>
                    <span>&bull;</span>
                    <span>TPCRO: <strong>{ro.targetProgres.toFixed(1)}%</strong></span>
                    <span>&bull;</span>
                    <span>Kolom Z: <strong className={isBelumOpt ? 'text-rose-600 dark:text-rose-400 font-black' : 'text-slate-700 dark:text-slate-300 font-bold'}>{ro.nilaiKomponenRo.toFixed(1)}</strong></span>
                    <span>&bull;</span>
                    <span className={ro.validasiSaktiStatus?.includes('Ditolak') ? 'text-rose-600 font-bold' : isBelumOpt ? 'text-rose-700 dark:text-rose-300' : 'text-slate-600'}>
                      Validasi: {ro.validasiSaktiStatus || 'Normal'}
                    </span>
                  </div>
                </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => onOpenNarrativeBuilder(ro)}
                  className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-cyan-300 font-bold text-[11px] transition-colors cursor-pointer"
                  title="Susun Narasi 3 Elemen"
                >
                  Narasi SAKTI
                </button>
                <button
                  onClick={() => onOpenSimulator(ro)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px] transition-colors cursor-pointer"
                  title="Simulasikan Nilai"
                >
                  Simulasi
                </button>
              </div>
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
};
