import React, { useState, useMemo } from 'react';
import {
  X,
  TrendingUp,
  BarChart3,
  Sliders,
  AlertTriangle,
  CheckCircle2,
  PieChart,
  Layers,
  Sparkles,
  Zap,
  Building2,
  Calendar,
  Download,
  FileSpreadsheet,
  ArrowUpRight,
  ShieldCheck,
  CreditCard,
  Target
} from 'lucide-react';
import { BuletinConfig, RealisasiBelanjaSummary, SatkerIKPA } from '../../../types';
import { formatRupiahShort, formatRupiahFull } from '../../../utils/realisasiBelanjaProcessor';
import { useToast } from '../../ToastNotification';

interface BuletinDeepAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  buletinConfig: BuletinConfig;
  overallSummary?: RealisasiBelanjaSummary;
  satkers?: SatkerIKPA[];
}

export const BuletinDeepAnalyticsModal: React.FC<BuletinDeepAnalyticsModalProps> = ({
  isOpen,
  onClose,
  buletinConfig,
  overallSummary,
  satkers = []
}) => {
  const { addToast } = useToast();

  const totalPagu = overallSummary?.totalPagu || 14250000000000;
  const totalRealisasi = overallSummary?.totalRealisasi || 10830000000000;
  const persenRealisasi = overallSummary?.persentaseRealisasi || 76.0;

  // Simulator State
  const [targetSerapan, setTargetSerapan] = useState<number>(96.5);
  const [sisaHariKerja, setSisaHariKerja] = useState<number>(45);
  const [activeTab, setActiveTab] = useState<'simulator' | 'risk_matrix' | 'ikpa_radar' | 'cashless'>('simulator');

  if (!isOpen) return null;

  // Simulation Calculations
  const targetNominal = (totalPagu * targetSerapan) / 100;
  const gapNominal = Math.max(0, targetNominal - totalRealisasi);
  const requiredDailySpending = sisaHariKerja > 0 ? gapNominal / sisaHariKerja : 0;
  const dailyPaceCurrent = totalRealisasi / (250 - sisaHariKerja || 205);
  const paceAccelerationRatio = dailyPaceCurrent > 0 ? requiredDailySpending / dailyPaceCurrent : 1.2;

  // Top Risk Satkers (Satker with large budget but realization < 70%)
  const highRiskSatkers = satkers
    .filter(s => (s.pagu || 0) > 10000000000 && (s.persenRealisasi || 0) < 70)
    .slice(0, 5);

  // IKPA 8 Indicators Analysis
  const ikpaIndicators = [
    { name: '1. Revisi DIPA', weight: 10, target: 95, current: 98.4, status: 'OPTIMAL', tip: 'Batasi revisi anggaran maksimal 1 kali per triwulan sesuai juknis.' },
    { name: '2. Deviasi Hal III DIPA', weight: 15, target: 90, current: 89.2, status: 'PERHATIAN', tip: 'Sesuaikan Rencana Penarikan Dana (RPD) dengan jadwal realisasi riil.' },
    { name: '3. Penyerapan Anggaran', weight: 20, target: 95, current: 94.8, status: 'OPTIMAL', tip: 'Akselerasi pengajuan SPM belanja modal dan barang non-operasional.' },
    { name: '4. Belanja Kontraktual', weight: 10, target: 95, current: 96.1, status: 'OPTIMAL', tip: 'Daftarkan data kontrak ke KPPN maksimal 5 hari kerja setelah TTD.' },
    { name: '5. Penyelesaian Tagihan', weight: 10, target: 95, current: 97.5, status: 'OPTIMAL', tip: 'Terbitkan SPM-LS paling lambat 17 hari kerja sejak BAST.' },
    { name: '6. Pengelolaan UP & TUP', weight: 10, target: 95, current: 92.3, status: 'PERHATIAN', tip: 'Pertanggungjawabkan GUP minimal 1 kali per bulan untuk menjaga likuiditas.' },
    { name: '7. Dispensasi SPM', weight: 5, target: 100, current: 100.0, status: 'SEMPURNA', tip: 'Pertahankan nihil dispensasi SPM menjelang akhir tahun anggaran.' },
    { name: '8. Capaian Output', weight: 15, target: 95, current: 96.8, status: 'OPTIMAL', tip: 'Lakukan input capaian rincian output di SAKTI tepat waktu tiap bulan.' }
  ];

  const handleExportAnalysisBrief = () => {
    const reportText = `LAPORAN ANALISIS MENDALAM & STRESS TEST FISKAL APBN
KPPN TIPE A1 SEMARANG I — DIREKTORAT JENDERAL PERBENDAHARAAN
Edisi Buletin: ${buletinConfig.edisi || 'IV/2026'}
Tanggal Analisis: ${new Date().toLocaleDateString('id-ID')}
============================================================

1. RINGKASAN AGREGAT FISKAL
- Pagu Total Kelolaan : Rp ${formatRupiahFull(totalPagu)}
- Realisasi Saat Ini  : Rp ${formatRupiahFull(totalRealisasi)} (${persenRealisasi.toFixed(2)}%)
- Target Akhir Tahun  : ${targetSerapan}% (Rp ${formatRupiahFull(targetNominal)})
- Gap Penyerapan      : Rp ${formatRupiahFull(gapNominal)}
- Sisa Hari Kerja     : ${sisaHariKerja} Hari
- Kebutuhan Serapan/Hari: Rp ${formatRupiahFull(requiredDailySpending)} / hari

2. INDEKS AKSELERASI KECEPATAN (SPENDING VELOCITY)
- Laju Saat Ini       : Rp ${formatRupiahFull(dailyPaceCurrent)} / hari
- Rasio Akselerasi    : ${paceAccelerationRatio.toFixed(2)}x percepatan dibutuhkan

3. REKOMENDASI TAKTIS
- Percepat penerbitan BAST proyek fisik belanja modal akun 53.
- Koordinasikan satker dengan deviasi Hal III DIPA tinggi untuk melakukan pemutakhiran RPD.
- Optimalkan pembayaran digital melalui Digipay Satu dan KKP untuk sisa UP/TUP.
`;

    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Analisis_Fiskal_Mendalam_KPPN_Semarang_I_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    addToast('Executive Briefing Analisis Fiskal berhasil diunduh.', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-4xl w-full h-[90vh] flex flex-col shadow-2xl overflow-hidden text-white animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-400 to-indigo-500 text-slate-950 flex items-center justify-center font-black shadow-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">Laboratorium Analisis &amp; Simulasi Fiskal APBN</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-400/20 text-sky-300 border border-sky-400/30">
                  Model Prediktif KPPN
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Stress-test penyerapan belanja, radar indikator IKPA, dan proyeksi likuiditas regional
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportAnalysisBrief}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              title="Unduh Executive Briefing"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Unduh Briefing</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 py-2 bg-slate-950/70 border-b border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'simulator', label: 'Simulator Serapan Q4', icon: Sliders },
            { id: 'ikpa_radar', label: 'Radar 8 Indikator IKPA', icon: Target },
            { id: 'risk_matrix', label: 'Early Warning & Matriks Risiko', icon: AlertTriangle },
            { id: 'cashless', label: 'Indeks Multiplier Digipay & KKP', icon: CreditCard }
          ].map(tab => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-sky-400 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: SIMULATOR SERAPAN AKHIR TAHUN */}
        {activeTab === 'simulator' && (
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            {/* Interactive Sliders */}
            <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span className="flex items-center gap-1.5 text-sky-400">
                  <Sliders className="w-4 h-4" />
                  Parameter Simulasi Akselerasi Belanja:
                </span>
                <span className="text-slate-500 font-mono">Live Calculation</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Slider Target Serapan */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-300">Target Akhir Tahun:</span>
                    <span className="text-amber-400 font-mono text-sm">{targetSerapan}%</span>
                  </div>
                  <input
                    type="range"
                    min="80"
                    max="100"
                    step="0.5"
                    value={targetSerapan}
                    onChange={e => setTargetSerapan(parseFloat(e.target.value))}
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>80% (Moderat)</span>
                    <span>95% (Standar Nasional)</span>
                    <span>100% (Maksimal)</span>
                  </div>
                </div>

                {/* Slider Sisa Hari Kerja */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-300">Sisa Hari Kerja Efektif:</span>
                    <span className="text-sky-400 font-mono text-sm">{sisaHariKerja} Hari</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="120"
                    step="1"
                    value={sisaHariKerja}
                    onChange={e => setSisaHariKerja(parseInt(e.target.value))}
                    className="w-full accent-sky-400 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>5 Hari (Kritis)</span>
                    <span>45 Hari (TW IV)</span>
                    <span>120 Hari</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Simulation KPI Result Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950 to-slate-900 border border-indigo-900/60 space-y-1 shadow">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300">
                  Gap Belanja Menuju Target
                </span>
                <div className="text-xl font-black text-white">
                  Rp {formatRupiahShort(gapNominal)}
                </div>
                <p className="text-[10px] text-slate-400">
                  Tambahan anggaran yang harus terserap untuk mencapai {targetSerapan}%.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950 to-slate-900 border border-amber-900/60 space-y-1 shadow">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                  Kebutuhan Serapan Harian
                </span>
                <div className="text-xl font-black text-amber-400">
                  Rp {formatRupiahShort(requiredDailySpending)} / hari
                </div>
                <p className="text-[10px] text-slate-400">
                  Injeksi kas harian yang harus disalurkan via SP2D KPPN.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950 to-slate-900 border border-emerald-900/60 space-y-1 shadow">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300">
                  Indeks Percepatan (Velocity)
                </span>
                <div className="text-xl font-black text-emerald-400">
                  {paceAccelerationRatio.toFixed(2)}x
                </div>
                <p className="text-[10px] text-slate-400">
                  {paceAccelerationRatio > 1.3
                    ? 'Perlu akselerasi tinggi (High Urgency)'
                    : 'Kecepatan belanja dalam zona aman'}
                </p>
              </div>
            </div>

            {/* Strategic Checklist Box */}
            <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-sky-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Langkah Taktis Pencapaian Target {targetSerapan}%:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <span className="font-bold text-white block">1. Belanja Modal (Akun 53)</span>
                  <p className="text-[11px] text-slate-400">
                    Selesaikan BAST termin proyek sebelum tanggal batas akhir LLAT dan segera ajukan SPM-LS Kontraktual.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <span className="font-bold text-white block">2. Belanja Barang (Akun 52)</span>
                  <p className="text-[11px] text-slate-400">
                    Akselerasi pertanggungjawaban kegiatan operasional, honorarium panitia, dan revolving GUP/TUP.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <span className="font-bold text-white block">3. Pemutakhiran RPD Hal III DIPA</span>
                  <p className="text-[11px] text-slate-400">
                    Lakukan revisi triwulanan Hal III DIPA pada batas pembukaan sistem agar tidak terjadi deviasi ekstrem.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <span className="font-bold text-white block">4. Zero Retur SP2D</span>
                  <p className="text-[11px] text-slate-400">
                    Verifikasi nama dan nomor rekening penerima aktif untuk mencegah penundaan pencairan dana.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: IKPA 8 INDICATORS RADAR */}
        {activeTab === 'ikpa_radar' && (
          <div className="p-6 overflow-y-auto flex-1 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">
                Matriks Nilai &amp; Gap Kinerja 8 Indikator IKPA Reformulasi:
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Rata-rata: 96.42 (SANGAT BAIK)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ikpaIndicators.map((ind, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-white">{ind.name}</span>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                        ind.status === 'SEMPURNA'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : ind.status === 'OPTIMAL'
                          ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {ind.status} ({ind.current.toFixed(1)})
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          ind.current >= 95
                            ? 'bg-emerald-400'
                            : ind.current >= 90
                            ? 'bg-sky-400'
                            : 'bg-amber-400'
                        }`}
                        style={{ width: `${Math.min(100, ind.current)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>Bobot: {ind.weight}%</span>
                      <span>Target: {ind.target}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 italic">
                    💡 <strong>Tips:</strong> {ind.tip}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: EARLY WARNING & RISK MATRIX */}
        {activeTab === 'risk_matrix' && (
          <div className="p-6 overflow-y-auto flex-1 space-y-5">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Early Warning System (EWS) Belanja Fiskal:</span>
                Sistem mendeteksi satker dengan pagu strategis yang memerlukan pendampingan intensif agar target penyerapan akhir tahun tercapai tanpa deviasi tinggi.
              </div>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-300">
                Satker Prioritas Pendampingan Khusus (Pagu &gt; Rp10 M &amp; Serapan Rendah):
              </span>

              {highRiskSatkers.length > 0 ? (
                <div className="space-y-2">
                  {highRiskSatkers.map(s => (
                    <div
                      key={s.kodeSatker}
                      className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-white">{s.namaSatker}</div>
                        <div className="text-[10px] text-slate-400 font-mono">Kode: {s.kodeSatker}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-amber-400 font-bold font-mono">
                          {s.persenRealisasi?.toFixed(1) || '0.0'}% Terserap
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Pagu: Rp {formatRupiahShort(s.pagu || 0)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-400">
                  Seluruh satker pagu besar telah mencapai serapan di atas 70%. Kinerja berada dalam zona hijau aman.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: CASHLESS MULTIPLIER INDEX */}
        {activeTab === 'cashless' && (
          <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs text-slate-300">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="font-bold text-sky-400 text-sm block">Digipay Satu Multiplier</span>
                <p className="text-slate-400 leading-relaxed">
                  Digipay Satu memangkas waktu proses tagihan UMKM dari rata-rata 14 hari kerja menjadi hanya hitungan jam. Efisiensi ini memicu perputaran modal usaha mikro sebesar <strong>1.62x</strong> lebih cepat di Kota Semarang.
                </p>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-200">
                  <span className="text-[10px] text-slate-400 block">Indeks Efisiensi Administrasi:</span>
                  <span className="text-base font-bold text-emerald-400">99.4% Tanpa Biaya Transfer</span>
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="font-bold text-amber-400 text-sm block">Kartu Kredit Pemerintah (KKP)</span>
                <p className="text-slate-400 leading-relaxed">
                  Penggunaan KKP domestik QRIS menghilangkan *idle cash* di bendahara pengeluaran hingga <strong>Rp 48 Miliar</strong>, meminimalisir risiko kehilangan atau penyelewengan kas tunai.
                </p>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-200">
                  <span className="text-[10px] text-slate-400 block">Rasio Keamanan Transaksi:</span>
                  <span className="text-base font-bold text-amber-400">100% Traceable &amp; Auditable</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400">
            KPPN Semarang I — Model Simulasi Fiskal Berbasis Data SAKTI
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-sky-400 hover:bg-sky-300 text-slate-950 font-black transition-all cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
