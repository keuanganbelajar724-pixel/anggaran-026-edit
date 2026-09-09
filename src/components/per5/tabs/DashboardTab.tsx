import React from 'react';
import {
  TrendingUp,
  Award,
  Sliders,
  Sparkles,
  ArrowRight,
  Calculator,
  HelpCircle,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Zap,
  Info
} from 'lucide-react';
import { SimulationProject, IndicatorResult } from '../../../models/ikpa';
import { GoldenTestCard } from '../goldenTestCard';

interface DashboardTabProps {
  project: SimulationProject;
  onNavigateTab: (tabId: any) => void;
  onOpenInspector: (title: string, cell: string, formula: string, score: string, details: any[]) => void;
  isDark?: boolean;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  project,
  onNavigateTab,
  onOpenInspector,
  isDark = false
}) => {
  const output = project.output;
  if (!output) return null;

  const getPredikatBadgeColor = (predikat: string) => {
    switch (predikat) {
      case 'Sangat Baik':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400';
      case 'Baik':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400';
      case 'Cukup':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400';
      default:
        return 'bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400';
    }
  };

  const indicatorCards: {
    key: keyof typeof output.indicators;
    title: string;
    tabId: string;
    cell: string;
    formula: string;
    description: string;
  }[] = [
    {
      key: 'revisiDIPA',
      title: 'Revisi DIPA',
      tabId: 'revisi-dipa',
      cell: 'M15',
      formula: '=MIN(100, M15)',
      description: 'Maks. 1x revisi per semester yang diperhitungkan (14 jenis pengecualian)'
    },
    {
      key: 'deviasiHalIII',
      title: 'Deviasi Halaman III DIPA',
      tabId: 'deviasi-hal3',
      cell: 'AC15',
      formula: '=ROUND(100 - RataRataKumulatif, 2)',
      description: 'Deviasi bulanan antara rencana penarikan dana dan realisasi per jenis belanja'
    },
    {
      key: 'penyerapan',
      title: 'Penyerapan Anggaran',
      tabId: 'penyerapan',
      cell: 'Q71',
      formula: '=AVERAGE($P$17, $P$35, $P$53, P71)',
      description: 'Capaian realisasi anggaran terhadap target penyerapan triwulanan'
    },
    {
      key: 'belanjaKontraktual',
      title: 'Belanja Kontraktual',
      tabId: 'kontraktual',
      cell: 'N30',
      formula: '=(20%*Distribusi) + (40%*KontrakDini) + (40%*Akselerasi53)',
      description: 'Penyampaian kontrak < 5 hari, akselerasi belanja modal, dan kontrak dini'
    },
    {
      key: 'penyelesaianTagihan',
      title: 'Penyelesaian Tagihan',
      tabId: 'tagihan',
      cell: 'N30',
      formula: '=ROUND((SPM_Tepat_Waktu / Total_SPM) * 100, 2)',
      description: 'Ketepatan waktu penerbitan SPM LS Kontraktual (17 hari kerja BAST)'
    },
    {
      key: 'pengelolaanUPTUP',
      title: 'Pengelolaan UP dan TUP',
      tabId: 'up-tup',
      cell: 'H16',
      formula: '=MIN(100, (UP_Tunai*90%) + (UP_KKP*10%))',
      description: 'Revolving GUP disebulankan, setoran TUP, dan penggunaan KKP'
    },
    {
      key: 'capaianOutput',
      title: 'Capaian Output',
      tabId: 'capaian-output',
      cell: 'V27',
      formula: '=ROUND((70%*CapaianRO) + (30%*KetepatanWaktu), 2)',
      description: 'Persentase capaian target rincian output dan ketepatan pelaporan bulanan'
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. Main Performance Banner */}
      <div className={`relative overflow-hidden rounded-2xl border p-6 shadow-sm transition-all ${
        isDark 
          ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border-slate-800' 
          : 'bg-gradient-to-br from-white via-white to-emerald-50/50 border-slate-200'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-xs font-semibold ${getPredikatBadgeColor(output.predikat)}`}>
                <Award className="h-3.5 w-3.5" /> Predikat: {output.predikat}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-0.5 text-xs font-mono font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                Mode: {project.calculationMode === 'excel_compatible' ? 'Excel Compatible (Default)' : 'Standard Validation'}
              </span>
              <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-mono font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                TA {project.metadata.tahunAnggaran} - Cut-off: Bln {project.metadata.periodeCutoff}
              </span>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {project.metadata.namaSatker || 'Simulasi Mandiri'}
              </h2>
              {project.metadata.kodeSatker ? (
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Kode Satker: <span className="font-mono font-semibold">{project.metadata.kodeSatker}</span>
                  {project.metadata.kodeKPPN && <> | KPPN: <span className="font-mono font-semibold">{project.metadata.kodeKPPN}</span></>}
                </p>
              ) : (
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Simulator Mandiri IKPA — Terbuka & Fleksibel untuk Seluruh Satker
                </p>
              )}
            </div>
          </div>

          {/* Big Score Box */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 bg-slate-50 dark:bg-slate-800/60 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
            <div className="text-right">
              <span className={`text-xs font-semibold uppercase tracking-wider block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Nilai Akhir IKPA
              </span>
              <div className="flex items-baseline justify-end gap-1">
                <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
                  {output.finalScore.toFixed(2)}
                </span>
                <span className="text-sm font-semibold text-slate-400">/ 100</span>
              </div>
              <button
                onClick={() => onOpenInspector(
                  'Nilai Akhir IKPA 2026',
                  'N34',
                  '=ROUND(NilaiTotal / KonversiBobot, 2) - PengurangDispensasi',
                  output.finalScore.toFixed(2),
                  [
                    { step: 'Nilai Total Tertimbang (G8:M8)', formulaHuman: 'SUM(Bobot Tertimbang 7 Indikator)', value: output.totalWeighted, excelCell: 'N32' },
                    { step: 'Konversi Bobot', formulaHuman: 'SUM(Bobot Aktif) / 100', value: `${(output.weightConversion * 100).toFixed(0)}%`, excelCell: 'N33' },
                    { step: 'Skor Sebelum Dispensasi', formulaHuman: 'Total / KonversiBobot', value: Number((output.totalWeighted / (output.weightConversion || 1)).toFixed(2)) },
                    { step: 'Pengurang Dispensasi SPM', formulaHuman: 'Matrix Rasio Dispensasi TW IV', value: -output.dispensasiReduction, excelCell: 'N34' },
                    { step: 'Nilai Akhir IKPA Final', formulaHuman: 'MAX(0, Skor - Dispensasi)', value: output.finalScore }
                  ]
                )}
                className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline"
              >
                <Calculator className="h-3 w-3" /> Formula Inspector
              </button>
            </div>

            <div className="h-12 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className={`block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total Tertimbang:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm">
                  {output.totalWeighted.toFixed(2)}
                </span>
              </div>
              <div>
                <span className={`block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Konversi Bobot:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm">
                  {(output.weightConversion * 100).toFixed(0)}%
                </span>
              </div>
              <div>
                <span className={`block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Dispensasi SPM:</span>
                <span className="font-mono font-bold text-rose-600 dark:text-rose-400 text-sm">
                  -{output.dispensasiReduction.toFixed(2)}
                </span>
              </div>
              <div>
                <span className={`block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Target Kinerja:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                  ≥ 95.00
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Kalkulasi Alur IKPA & Pengurang Dispensasi SPM */}
        <div className={`flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl border ${
          isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-emerald-50/50 border-emerald-100'
        }`}>
          <div className="flex items-center gap-2.5 text-xs font-mono">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Calculator className="h-4 w-4" />
            </div>
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200 mr-2">Rumus Perhitungan Nilai Akhir:</span>
              <span className="text-slate-600 dark:text-slate-400">
                (Total Tertimbang ÷ Konversi Bobot) − Pengurang Dispensasi SPM
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold">
            <span className="text-slate-600 dark:text-slate-400">
              ({output.totalWeighted.toFixed(2)} ÷ {output.weightConversion.toFixed(2)})
            </span>
            <span className="text-rose-600 dark:text-rose-400">
              − {output.dispensasiReduction.toFixed(2)}
            </span>
            <span className="text-slate-400">=</span>
            <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
              {output.finalScore.toFixed(2)}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-sans">
              {output.predikat}
            </span>
          </div>
        </div>
      </div>

      {/* 2. 8 Indicators & Dispensasi Summary Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Ringkasan 8 Komponen Indikator IKPA & Pengurang Dispensasi SPM
          </h3>
          <span className="text-xs text-slate-500">
            Klik indikator untuk membuka rincian simulasi
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {indicatorCards.map(card => {
            const ind = output.indicators[card.key];
            const isFull = ind.cappedValue >= 95;

            return (
              <div
                key={card.key}
                className={`group relative flex flex-col justify-between rounded-2xl border p-4 shadow-xs transition-all hover:shadow-md ${
                  isDark ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 hover:border-emerald-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        Bobot {ind.weight}%
                      </span>
                      <h4 className="font-bold text-sm text-slate-850 dark:text-slate-100 group-hover:text-emerald-600 transition-colors">
                        {card.title}
                      </h4>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenInspector(
                          `Indikator: ${card.title}`,
                          card.cell,
                          card.formula,
                          ind.cappedValue.toFixed(2),
                          ind.details
                        );
                      }}
                      title="Formula Inspector"
                      className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Calculator className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <p className={`text-[11px] mt-1 line-clamp-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {card.description}
                  </p>

                  <div className="mt-4 flex items-baseline justify-between border-t pt-3 border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block font-medium">Nilai Akhir</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100">
                          {ind.cappedValue.toFixed(2)}
                        </span>
                        {ind.rawValue > 100 && (
                          <span className="text-[10px] text-slate-400 font-mono">({ind.rawValue.toFixed(0)})</span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase text-slate-400 block font-medium">Tertimbang</span>
                      <span className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        {ind.weightedValue.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className={`h-full rounded-full transition-all ${
                        ind.cappedValue >= 95 
                          ? 'bg-emerald-500' 
                          : ind.cappedValue >= 80 
                            ? 'bg-blue-500' 
                            : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min(100, ind.cappedValue)}%` }}
                    />
                  </div>
                </div>

                <button
                  onClick={() => onNavigateTab(card.tabId)}
                  className={`mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-xl py-1.5 text-xs font-semibold transition-colors ${
                    isDark
                      ? 'bg-slate-800 text-slate-200 hover:bg-emerald-950 hover:text-emerald-300'
                      : 'bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700'
                  }`}
                >
                  Buka Detail Simulasi <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            );
          })}

          {/* 8. Card Khusus: Pengurang Dispensasi SPM */}
          <div
            className={`group relative flex flex-col justify-between rounded-2xl border p-4 shadow-xs transition-all hover:shadow-md ${
              isDark ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 hover:border-rose-300'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded">
                    Faktor Pengurang (Minus)
                  </span>
                  <h4 className="font-bold text-sm text-slate-850 dark:text-slate-100 group-hover:text-rose-600 transition-colors mt-1">
                    Dispensasi SPM
                  </h4>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenInspector(
                      'Faktor Pengurang: Dispensasi SPM',
                      'N35',
                      '=IF(Rasio=0, 0, IF(Rasio<=0.099, 0.25, IF(Rasio<=0.99, 0.50, IF(Rasio<=4.99, 0.75, 1.00))))',
                      `-${output.dispensasiReduction.toFixed(2)}`,
                      [
                        {
                          step: 'Jumlah SPM Triwulan IV',
                          formulaHuman: `${project.dispensasiSPM?.jumlahSPMTriwulanIV || 0} SPM`,
                          value: project.dispensasiSPM?.jumlahSPMTriwulanIV || 0
                        },
                        {
                          step: 'Jumlah SPM Dispensasi',
                          formulaHuman: `${project.dispensasiSPM?.jumlahDispensasiSPM || 0} SPM`,
                          value: project.dispensasiSPM?.jumlahDispensasiSPM || 0
                        },
                        {
                          step: 'Rasio Dispensasi SPM (Permil)',
                          formulaHuman: `(${project.dispensasiSPM?.jumlahDispensasiSPM || 0} ÷ ${project.dispensasiSPM?.jumlahSPMTriwulanIV || 1}) × 1000 = ${output.dispensasiRatio.toFixed(2)}‰`,
                          value: `${output.dispensasiRatio.toFixed(2)}‰`
                        },
                        {
                          step: 'Pengurang Nilai Akhir IKPA',
                          formulaHuman: `Penalti pengurang = -${output.dispensasiReduction.toFixed(2)} poin`,
                          value: `-${output.dispensasiReduction.toFixed(2)}`
                        }
                      ]
                    );
                  }}
                  title="Formula Inspector Dispensasi SPM"
                  className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Calculator className="h-3.5 w-3.5" />
                </button>
              </div>

              <p className={`text-[11px] mt-1 line-clamp-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Rasio SPM dispensasi terhadap total SPM TW IV. Mengurangi Nilai Akhir IKPA secara langsung.
              </p>

              <div className="mt-4 flex items-baseline justify-between border-t pt-3 border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[10px] uppercase text-slate-400 block font-medium">Rasio Permil</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100">
                      {output.dispensasiRatio.toFixed(2)}‰
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      ({project.dispensasiSPM?.jumlahDispensasiSPM || 0}/{project.dispensasiSPM?.jumlahSPMTriwulanIV || 0})
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase text-slate-400 block font-medium">Pengurang</span>
                  <span className="text-base font-bold font-mono text-rose-600 dark:text-rose-400">
                    -{output.dispensasiReduction.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Progress Bar (Penalti) */}
              <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-rose-500 transition-all"
                  style={{ width: `${Math.min(100, (output.dispensasiReduction / 5.0) * 100)}%` }}
                />
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('dispensasi-spm')}
              className={`mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-xl py-1.5 text-xs font-semibold transition-colors ${
                isDark
                  ? 'bg-slate-800 text-slate-200 hover:bg-rose-950 hover:text-rose-300'
                  : 'bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-700'
              }`}
            >
              Buka Detail Simulasi <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Golden Test Live Card */}
      <GoldenTestCard isDark={isDark} />

      {/* 4. Sensitivity & Quick Insights */}
      <div className={`rounded-2xl border p-5 ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-4 w-4 text-amber-500" />
          <h3 className="font-semibold text-sm">Matriks Sensitivitas & Prioritas Perbaikan Kinerja</h3>
        </div>
        <p className={`text-xs mb-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Estimasi dampak perbaikan masing-masing indikator terhadap Nilai Akhir IKPA berdasarkan bobot indikator tahun 2026:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <span className="font-semibold text-xs block text-slate-800 dark:text-slate-200">Capaian Output (Bobot 25%)</span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono font-medium block mt-1">
              +1.0 poin = +0.25 IKPA Final
            </span>
            <p className="text-[11px] text-slate-500 mt-1">Bobot tertinggi. Wajib konfirmasi tepat waktu tiap tanggal 15.</p>
          </div>
          <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <span className="font-semibold text-xs block text-slate-800 dark:text-slate-200">Penyerapan Anggaran (Bobot 20%)</span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono font-medium block mt-1">
              +1.0 poin = +0.20 IKPA Final
            </span>
            <p className="text-[11px] text-slate-500 mt-1">Capai target triwulan (Q1: 20%, Q2: 50%, Q3: 75%, Q4: 95%).</p>
          </div>
          <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <span className="font-semibold text-xs block text-slate-800 dark:text-slate-200">Deviasi Hal III (Bobot 15%)</span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono font-medium block mt-1">
              +1.0 poin = +0.15 IKPA Final
            </span>
            <p className="text-[11px] text-slate-500 mt-1">Jaga deviasi bulanan tetap di bawah ambang batas 5%.</p>
          </div>
          <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <span className="font-semibold text-xs block text-slate-800 dark:text-slate-200">Dispensasi SPM (Pengurang)</span>
            <span className="text-xs text-rose-600 dark:text-rose-400 font-mono font-medium block mt-1">
              1 SPM Dispensasi = -0.50 s.d -5.00
            </span>
            <p className="text-[11px] text-slate-500 mt-1">Hindari pengajuan SPM melewati batas waktu resmi di TW IV.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
