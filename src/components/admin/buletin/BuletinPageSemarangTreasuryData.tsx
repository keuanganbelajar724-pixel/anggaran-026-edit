import React from 'react';
import {
  Award,
  ShieldCheck,
  Building2,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Zap,
  Clock,
  Sparkles,
  PieChart as PieIcon,
  CreditCard,
  ShoppingBag,
  RotateCcw
} from 'lucide-react';
import { BuletinConfig, RealisasiBelanjaSummary, SatkerIKPA } from '../../../types';
import { formatRupiahShort, formatRupiahFull } from '../../../utils/realisasiBelanjaProcessor';

interface BuletinPageSemarangTreasuryDataProps {
  pageNumber: number;
  buletinConfig: BuletinConfig;
  overallSummary?: RealisasiBelanjaSummary | null;
  satkers?: SatkerIKPA[];
  formatTheme: any;
  deepAnalysis: any;
  renderTextOrMissing: any;
}

export const BuletinPageSemarangTreasuryData: React.FC<BuletinPageSemarangTreasuryDataProps> = ({
  pageNumber,
  buletinConfig,
  overallSummary,
  satkers = [],
  formatTheme,
  deepAnalysis,
  renderTextOrMissing
}) => {
  // HALAMAN 8: RAPOR SATKER PAGU BESAR (> RP 50 MILIAR) & SATKER STRATEGIS SEMARANG
  if (pageNumber === 8) {
    const listSatkerBesar = buletinConfig.satkerPaguBesarTable || [];

    return (
      <div className="p-8 sm:p-10 space-y-6 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          <div className={formatTheme.headerClass}>
            <div className="flex items-center justify-between">
              <h2 className={`text-2xl font-black ${formatTheme.headerTitleClass}`}>
                Rapor Satker Pagu Besar Kota Semarang
              </h2>
              <span className="text-xs font-bold uppercase text-amber-300">
                Pagu &gt; Rp50 Miliar
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed text-justify">
            Satuan kerja dengan alokasi pagu di atas Rp50 Miliar memegang peran sentral sebagai lokomotif penyerapan fiskal dan pembentukan modal tetap bruto di wilayah Kota Semarang:
          </p>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-amber-300 font-mono text-[10px] uppercase">
                  <th className="py-2.5 px-3">Kode</th>
                  <th className="py-2.5 px-3">Nama Satuan Kerja Mitra</th>
                  <th className="py-2.5 px-3 text-right">Pagu</th>
                  <th className="py-2.5 px-3 text-right">Realisasi</th>
                  <th className="py-2.5 px-3 text-right">% Serap</th>
                  <th className="py-2.5 px-3 text-center">IKPA</th>
                  <th className="py-2.5 px-3 text-center">Predikat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {listSatkerBesar.map((s, idx) => (
                  <tr key={s.kode} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                    <td className="py-2 px-3 font-mono font-bold text-slate-500">{s.kode}</td>
                    <td className="py-2 px-3 font-bold text-slate-800">{s.nama}</td>
                    <td className="py-2 px-3 text-right font-mono text-slate-600">
                      {formatRupiahShort(s.pagu)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                      {formatRupiahShort(s.realisasi)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-black text-emerald-700">
                      {(Number.isFinite(s.persen) ? s.persen : 0).toFixed(1)}%
                    </td>
                    <td className="py-2 px-3 text-center font-mono font-black text-indigo-700">
                      {(Number.isFinite(s.ikpa) ? s.ikpa : 0).toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px]">
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-100 text-xs text-indigo-950 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-indigo-900">
              <Sparkles className="w-4 h-4 text-indigo-600" /> Analisis Satker Pagu Besar:
            </div>
            <p className="text-[11px] leading-relaxed text-justify">
              Tingkat kepatuhan satker pagu besar di KPPN Semarang I menunjukkan tren yang sangat positif dengan rata-rata nilai IKPA di atas 99.00. Satker dengan volume belanja konstruksi seperti BBWS Pemali Juana dan PIP Semarang terus mendapat pendampingan asistensi proaktif dari Seksi MSKI.
            </p>
          </div>
        </div>

        <div className={formatTheme.footerClass}>
          Rapor Satker Strategis • KPPN Tipe A1 Semarang I
        </div>
      </div>
    );
  }

  // HALAMAN 9: EVALUASI MENDALAM 8 INDIKATOR IKPA KPPN SEMARANG I
  if (pageNumber === 9) {
    const ikpa = buletinConfig.evaluasiDelapanIkpa;

    return (
      <div className="p-8 sm:p-10 space-y-6 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          <div className={formatTheme.headerClass}>
            <div className="flex items-center justify-between">
              <h2 className={`text-2xl font-black ${formatTheme.headerTitleClass}`}>
                Evaluasi 8 Indikator IKPA Wilayah
              </h2>
              <span className="text-xs font-bold uppercase text-amber-300">
                Rata-rata KPPN: {ikpa?.rataRataKppn || 97.20} (Sangat Baik)
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed text-justify">
            Pengukuran Indikator Kinerja Pelaksanaan Anggaran (IKPA) mencakup 3 aspek reformasi: Kualitas Perencanaan, Kualitas Pelaksanaan, dan Kualitas Hasil Anggaran:
          </p>

          {/* 8 Indikator Grid Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900">1. Revisi DIPA</span>
                <span className="font-mono font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  {ikpa?.revisiDipa?.nilai ?? 98.50}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                {ikpa?.revisiDipa?.analisis || 'Pengendalian revisi DIPA sangat tertib dengan rata-rata revisi terkendali.'}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900">2. Deviasi Halaman III DIPA</span>
                <span className="font-mono font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                  {ikpa?.deviasiHal3?.nilai ?? 91.20}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                {ikpa?.deviasiHal3?.analisis || 'Deviasi penarikan dana bulanan terjaga di bawah ambang batas toleransi nasional.'}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900">3. Penyerapan Anggaran</span>
                <span className="font-mono font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  {ikpa?.penyerapanAnggaran?.nilai ?? 96.80}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                {ikpa?.penyerapanAnggaran?.analisis || 'Realisasi penyerapan anggaran melampaui target proporsional periode berjalan.'}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900">4. Belanja Kontraktual</span>
                <span className="font-mono font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  {ikpa?.belanjaKontraktual?.nilai ?? 97.40}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                {ikpa?.belanjaKontraktual?.analisis || 'Pendaftaran kontrak ke KPPN terlaksana tepat waktu maksimal 5 hari kerja.'}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900">5. Penyelesaian Tagihan (17 Hari)</span>
                <span className="font-mono font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  {ikpa?.penyelesaianTagihan?.nilai ?? 98.90}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                {ikpa?.penyelesaianTagihan?.analisis || 'Penerbitan SPM tagihan kontraktual 17 hari kerja terlaksana tanpa keterlambatan.'}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900">6. Pengelolaan UP / TUP</span>
                <span className="font-mono font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  {ikpa?.pengelolaanUpTup?.nilai ?? 99.10}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                {ikpa?.pengelolaanUpTup?.analisis || 'Revolving UP tepat waktu 1 bulan dan pertanggungjawaban TUP tertib.'}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900">7. Dispensasi SPM</span>
                <span className="font-mono font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  {ikpa?.dispensasiSpm?.nilai ?? 100.00}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                {ikpa?.dispensasiSpm?.analisis || 'Nol dispensasi penerbitan SPM di luar batas waktu reguler (sempurna).'}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900">8. Konfirmasi Capaian Output</span>
                <span className="font-mono font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  {ikpa?.capaianOutput?.nilai ?? 95.70}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                {ikpa?.capaianOutput?.analisis || 'Konfirmasi capaian output terverifikasi 100% dengan anomali 0%.'}
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-100 text-[11px] text-slate-700">
            <strong>Kesimpulan &amp; Arah Kebijakan:</strong> {ikpa?.kesimpulan || 'Nilai IKPA lingkup KPPN Semarang I stabil pada kategori Sangat Baik dengan akselerasi penyelesaian tagihan 17 hari kerja dan nol dispensasi SPM.'}
          </div>
        </div>

        <div className={formatTheme.footerClass}>
          Evaluasi 8 Indikator IKPA • KPPN Tipe A1 Semarang I
        </div>
      </div>
    );
  }

  // HALAMAN 10: MONITORING PROYEK STRATEGIS BELANJA MODAL (AKUN 53)
  if (pageNumber === 10) {
    const modal = buletinConfig.belanjaModalProyek;

    return (
      <div className="p-8 sm:p-10 space-y-6 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          <div className={formatTheme.headerClass}>
            <div className="flex items-center justify-between">
              <h2 className={`text-2xl font-black ${formatTheme.headerTitleClass}`}>
                Monitoring Belanja Modal (Akun 53)
              </h2>
              <span className="text-xs font-bold uppercase text-amber-300">
                Proyek Strategis Regional
              </span>
            </div>
          </div>

          {/* Banner Pagu Belanja Modal */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950 to-slate-900 text-white flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold">
                TOTAL PAGU BELANJA MODAL WILAYAH SEMARANG I
              </span>
              <div className="text-2xl font-mono font-black">
                {modal ? formatRupiahShort(modal.totalPaguModal) : 'Rp670.00 M'}
              </div>
              <p className="text-xs text-slate-300">
                Realisasi:{' '}
                <strong className="text-emerald-300">
                  {modal ? formatRupiahShort(modal.realisasiModal) : 'Rp420.00 M'}
                </strong>{' '}
                ({modal && Number.isFinite(modal.persenModal) ? modal.persenModal.toFixed(1) : '62.7'}%)
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-emerald-400" />
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed text-justify">
            Daftar paket pengadaan konstruksi gedung, jaringan irigasi, dan pengadaan peralatan mesin strategis di wilayah pembayaran KPPN Semarang I:
          </p>

          {/* Project List Cards */}
          <div className="space-y-2.5">
            {(modal?.daftarProyek || []).map((p, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-black text-slate-900">{p.namaPaket}</span>
                  <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    {formatRupiahShort(p.pagu)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-600">
                  <span>Satker: <strong className="text-slate-800">{p.satker}</strong></span>
                  <span className="font-bold text-indigo-700">{p.progres}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-1">
            <strong>Rekomendasi Percepatan:</strong> {modal?.rekomendasi || 'Satker pengelola Akun 53 diimbau menyelesaikan pendaftaran kontrak tepat waktu (maksimal 5 hari kerja) dan mempercepat BAST termin akhir.'}
          </div>
        </div>

        <div className={formatTheme.footerClass}>
          Laporan Proyek Belanja Modal • KPPN Tipe A1 Semarang I
        </div>
      </div>
    );
  }

  // HALAMAN 11: MONITORING RETUR SP2D & KAMPANYE ZERO RETUR SAKTI
  if (pageNumber === 11) {
    const retur = buletinConfig.monitoringReturSp2d;

    return (
      <div className="p-8 sm:p-10 space-y-6 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          <div className={formatTheme.headerClass}>
            <div className="flex items-center justify-between">
              <h2 className={`text-2xl font-black ${formatTheme.headerTitleClass}`}>
                Monitoring Retur SP2D &amp; Zero Retur
              </h2>
              <span className="text-xs font-bold uppercase text-amber-300">
                Rasio Keberhasilan: {retur?.rasioZeroRetur || 99.98}%
              </span>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Total SPM Diterbitkan</span>
              <div className="font-mono font-black text-slate-900 text-base">
                {retur?.totalSpmDiterbitkan ? retur.totalSpmDiterbitkan.toLocaleString() : '28,450'}
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Total Retur SP2D</span>
              <div className="font-mono font-black text-red-600 text-base">
                {retur?.totalRetur ?? 2} Transaksi
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-1">
              <span className="text-[10px] text-emerald-800 font-bold uppercase">Nominal Sukses Cair</span>
              <div className="font-mono font-black text-emerald-900 text-base">99.98%</div>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed text-justify">
            Retur SP2D terjadi saat transfer dana dari Kas Negara ke rekening penerima (pegawai/pihak ketiga) ditolak oleh sistem kliring perbankan. KPPN Semarang I terus mengedukasi mitigasi kesalahan suplier:
          </p>

          {/* Root Causes Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase text-slate-900">
              Analisis Penyebab Retur &amp; Langkah Solutif
            </h3>
            {(retur?.penyebabRetur || []).map((item, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span>{item.penyebab}</span>
                  <span className="font-mono text-red-700 bg-red-50 px-2 py-0.5 rounded">{Number.isFinite(item.persen) ? item.persen : 0}%</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  <strong>Solusi Mitigasi:</strong> {item.solusi}
                </p>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-950 space-y-1">
            <strong>SOP Penanganan Retur:</strong> {retur?.sopPenanganan || 'Penerbitan surat ralat rekening maksimal 2 hari kerja dan rekonsiliasi data supplier terpadu.'}
          </div>
        </div>

        <div className={formatTheme.footerClass}>
          Kampanye Zero Retur SP2D • KPPN Tipe A1 Semarang I
        </div>
      </div>
    );
  }

  // HALAMAN 12: TRANSFORMASI DIGITAL: DIGIPAY SATU & KKP DOMESTIK
  const digital = buletinConfig.leaderboardDigipayKkp;

  return (
    <div className="p-8 sm:p-10 space-y-6 flex-1 flex flex-col justify-between">
      <div className="space-y-4">
        <div className={formatTheme.headerClass}>
          <div className="flex items-center justify-between">
            <h2 className={`text-2xl font-black ${formatTheme.headerTitleClass}`}>
              Digitalisasi Belanja: Digipay &amp; KKP
            </h2>
            <span className="text-xs font-bold uppercase text-amber-300">
              Pemberdayaan UMKM Kemenkeu Satu
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed text-justify">
          Ekosistem pembayaran non-tunai di KPPN Semarang I menunjukkan akselerasi pesat dengan keterlibatan {digital?.jumlahVendorUmkm || 186} vendor UMKM lokal yang terdaftar pada platform Digipay Satu:
        </p>

        {/* 2 Leaderboards: Digipay & KKP */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Top Digipay */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 font-black text-slate-900 border-b pb-2">
              <ShoppingBag className="w-4 h-4 text-indigo-600" />
              <span>Top Satker Transaksi Digipay Satu</span>
            </div>
            <div className="space-y-2">
              {(digital?.topDigipaySatker || []).map((s, idx) => (
                <div key={idx} className="flex items-center justify-between text-[11px] pb-1 border-b border-slate-100">
                  <span className="font-semibold text-slate-800 truncate max-w-[160px]">
                    #{idx + 1} {s.nama}
                  </span>
                  <span className="font-mono font-bold text-indigo-900">
                    {s.transaksi} trx ({formatRupiahShort(s.nominal)})
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Top KKP */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 font-black text-slate-900 border-b pb-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>Top Satker Transaksi KKP Domestik</span>
            </div>
            <div className="space-y-2">
              {(digital?.topKkpSatker || []).map((s, idx) => (
                <div key={idx} className="flex items-center justify-between text-[11px] pb-1 border-b border-slate-100">
                  <span className="font-semibold text-slate-800 truncate max-w-[160px]">
                    #{idx + 1} {s.nama}
                  </span>
                  <span className="font-mono font-bold text-emerald-900">
                    {s.transaksi} trx ({formatRupiahShort(s.nominal)})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-emerald-900">
            <Sparkles className="w-4 h-4 text-emerald-600" /> Manfaat Strategis Transaksi Digital:
          </div>
          <p className="text-[11px] leading-relaxed text-justify">
            Transaksi pengadaan via Digipay Satu dan KKP membebaskan bendahara dari risiko kehilangan uang kas fisik, otomatisasi pemotongan/penyetoran pajak rekanan, serta membuka akses pasar pengadaan pemerintah bagi pelaku UMKM kuliner dan ATK di Kota Semarang.
          </p>
        </div>
      </div>

      <div className={formatTheme.footerClass}>
        Leaderboard Digital Payment • KPPN Tipe A1 Semarang I
      </div>
    </div>
  );
};
