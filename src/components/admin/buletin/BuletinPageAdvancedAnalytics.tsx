import React from 'react';
import {
  TrendingUp,
  BarChart3,
  Calendar,
  Layers,
  CreditCard,
  Building2,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ShieldCheck,
  MapPin,
  Phone,
  Mail,
  Globe,
  Sparkles,
  QrCode,
  Users,
  Compass,
  Zap,
  Target,
  FileSpreadsheet,
  PieChart as PieIcon
} from 'lucide-react';
import { BuletinConfig, RealisasiBelanjaSummary, SatkerIKPA } from '../../../types';
import { formatRupiahShort, formatRupiahFull } from '../../../utils/realisasiBelanjaProcessor';
import { OFFICIAL_PRESET_IMAGES } from '../../../data/buletinEditionPresets';

interface BuletinPageAdvancedAnalyticsProps {
  pageNumber: number;
  buletinConfig: BuletinConfig;
  overallSummary?: RealisasiBelanjaSummary | null;
  satkers?: SatkerIKPA[];
  formatTheme: any;
  deepAnalysis: any;
  renderTextOrMissing: any;
  renderPhotoOrMissing: any;
}

export const BuletinPageAdvancedAnalytics: React.FC<BuletinPageAdvancedAnalyticsProps> = ({
  pageNumber,
  buletinConfig,
  overallSummary,
  satkers = [],
  formatTheme,
  deepAnalysis,
  renderTextOrMissing,
  renderPhotoOrMissing
}) => {
  const totalPagu = (overallSummary && Number.isFinite(overallSummary.totalPagu) && overallSummary.totalPagu > 0) ? overallSummary.totalPagu : 12850000000000;
  const totalRealisasi = (overallSummary && Number.isFinite(overallSummary.totalRealisasi) && overallSummary.totalRealisasi > 0) ? overallSummary.totalRealisasi : 8420000000000;
  const persen = (overallSummary && Number.isFinite(overallSummary.persenRealisasiTotal)) ? overallSummary.persenRealisasiTotal : 65.5;

  // HALAMAN 25: ANALISIS DAMPAK EKONOMI APBN TERHADAP PDRB KOTA SEMARANG
  if (pageNumber === 25) {
    return (
      <div className="p-8 sm:p-10 space-y-6 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          <div className={formatTheme.headerClass}>
            <div className="flex items-center justify-between">
              <h2 className={`text-2xl font-black ${formatTheme.headerTitleClass}`}>
                Dampak Ekonomi APBN Terhadap PDRB
              </h2>
              <span className="text-xs font-bold uppercase text-amber-300">
                Fiskal Regional Semarang
              </span>
            </div>
          </div>

          <div className="text-xs text-slate-600 font-medium leading-relaxed text-justify">
            Belanja Negara yang disalurkan melalui KPPN Tipe A1 Semarang I berfungsi sebagai stimulus utama penggerak perekonomian (*fiscal multiplier effect*). Dengan total alokasi kelolaan sebesar <strong>{formatRupiahShort(totalPagu)}</strong>, arus kas APBN mengalir langsung ke sektor-sektor produktif dan konsumsi riil di Kota Semarang.
          </div>

          {/* 3 Impact Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-900 to-slate-900 text-white space-y-1.5 shadow-sm">
              <div className="flex items-center justify-between text-amber-300">
                <span className="text-[10px] font-black uppercase tracking-wider">Kontribusi Belanja</span>
                <TrendingUp className="w-4 h-4" />
              </div>
              <div className="text-xl font-black">{persen.toFixed(1)}%</div>
              <p className="text-[10px] text-slate-300 leading-tight">Tingkat injeksi likuiditas kas negara ke perbankan regional.</p>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-br from-blue-900 to-slate-900 text-white space-y-1.5 shadow-sm">
              <div className="flex items-center justify-between text-sky-300">
                <span className="text-[10px] font-black uppercase tracking-wider">Multiplier Effect</span>
                <Zap className="w-4 h-4" />
              </div>
              <div className="text-xl font-black">1.48x</div>
              <p className="text-[10px] text-slate-300 leading-tight">Setiap Rp1 triliun belanja modal memicu output ekonomi sekunder Rp1,48 T.</p>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-900 to-slate-900 text-white space-y-1.5 shadow-sm">
              <div className="flex items-center justify-between text-emerald-300">
                <span className="text-[10px] font-black uppercase tracking-wider">Mitra UMKM Terlibat</span>
                <Users className="w-4 h-4" />
              </div>
              <div className="text-xl font-black">450+ Vendor</div>
              <p className="text-[10px] text-slate-300 leading-tight">Penyedia barang/jasa lokal Semarang yang menyerap belanja APBN.</p>
            </div>
          </div>

          {/* Sektoral Deep Breakdown */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <h3 className="text-xs font-black text-slate-900 uppercase flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-700" />
              <span>Transmisi Belanja APBN ke Sektor PDRB Unggulan Kota Semarang</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">1. Sektor Konstruksi &amp; Infrastruktur Publik</span>
                  <span className="text-[11px] text-slate-500">Realisasi Belanja Modal (Akun 53) jalan, jembatan, gedung kantor &amp; fasilitas pendidikan.</span>
                </div>
                <span className="font-mono font-black text-indigo-900 bg-indigo-50 px-2.5 py-1 rounded-lg">High Impact</span>
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">2. Sektor Perdagangan, Hotel &amp; Restoran (MICE)</span>
                  <span className="text-[11px] text-slate-500">Didorong oleh Belanja Barang Operasional (Akun 52) perjalanan dinas, konsumsi &amp; sewa lokal.</span>
                </div>
                <span className="font-mono font-black text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-lg">Stabil</span>
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">3. Sektor Konsumsi Rumah Tangga</span>
                  <span className="text-[11px] text-slate-500">Penyaluran Gaji &amp; Tunjangan ASN/TNI/Polri (Akun 51) menjaga daya beli pasar tradisional &amp; ritel.</span>
                </div>
                <span className="font-mono font-black text-amber-900 bg-amber-50 px-2.5 py-1 rounded-lg">Konsisten</span>
              </div>
            </div>
          </div>
        </div>

        <div className={formatTheme.footerClass}>
          Analisis Ekonomi Regional • KPPN Tipe A1 Semarang I
        </div>
      </div>
    );
  }

  // HALAMAN 26: PETA KETEPATAN RPD HALAMAN III DIPA TRIWULANAN
  if (pageNumber === 26) {
    return (
      <div className="p-8 sm:p-10 space-y-6 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          <div className={formatTheme.headerClass}>
            <div className="flex items-center justify-between">
              <h2 className={`text-2xl font-black ${formatTheme.headerTitleClass}`}>
                Peta RPD Halaman III DIPA
              </h2>
              <span className="text-xs font-bold uppercase text-amber-300">
                Akurasi Perencanaan Kas
              </span>
            </div>
          </div>

          <div className="text-xs text-slate-600 font-medium leading-relaxed text-justify">
            Indikator Deviasi Halaman III DIPA mengukur deviasi antara Rencana Penarikan Dana (RPD) bulanan yang dimuat dalam DIPA dengan realisasi riil SPM yang diajukan ke KPPN Semarang I. Batas maksimal deviasi yang ditoleransi untuk nilai sempurna adalah <strong>maksimal 5%</strong>.
          </div>

          {/* Triwulan Matrix */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
            <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 space-y-1">
              <div className="text-[10px] font-bold text-indigo-700 uppercase">Triwulan I</div>
              <div className="text-lg font-black text-indigo-950">3.8%</div>
              <div className="text-[9px] font-extrabold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded">Sangat Baik</div>
            </div>
            <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 space-y-1">
              <div className="text-[10px] font-bold text-indigo-700 uppercase">Triwulan II</div>
              <div className="text-lg font-black text-indigo-950">4.2%</div>
              <div className="text-[9px] font-extrabold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded">Sangat Baik</div>
            </div>
            <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 space-y-1">
              <div className="text-[10px] font-bold text-indigo-700 uppercase">Triwulan III</div>
              <div className="text-lg font-black text-indigo-950">4.9%</div>
              <div className="text-[9px] font-extrabold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded">Sangat Baik</div>
            </div>
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-1">
              <div className="text-[10px] font-bold text-amber-700 uppercase">Triwulan IV (Est)</div>
              <div className="text-lg font-black text-amber-950">5.4%</div>
              <div className="text-[9px] font-extrabold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">Waspada Deviasi</div>
            </div>
          </div>

          {/* 4 Mitigation Strategies */}
          <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3">
            <h3 className="text-xs font-black uppercase text-amber-300 flex items-center gap-2">
              <Target className="w-4 h-4" />
              <span>4 Langkah Mitigasi Deviasi Hal III DIPA untuk Satker</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] text-slate-300">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <strong className="text-white block font-bold">1. Pemutakhiran DIPA Terjadwal</strong>
                <span>Lakukan revisi administratif Hal III DIPA pada batas akhir triwulan sebelum batas cut-off KPPN.</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <strong className="text-white block font-bold">2. Penjadwalan Kontrak Ketat</strong>
                <span>Sinkronkan jadwal termin pembayaran kontrak rekanan dengan alokasi kas bulanan pada SAKTI.</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <strong className="text-white block font-bold">3. Monitoring Mingguan OM-SPAN</strong>
                <span>PPK dan Bendahara wajib memantau selisih riil penarikan dana per jenis belanja setiap hari Jumat.</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <strong className="text-white block font-bold">4. Hindari Penumpukan di Akhir Tahun</strong>
                <span>Cegah pengajuan SPM serentak di bulan Desember dengan menyelesaikan tagihan berkala per bulan.</span>
              </div>
            </div>
          </div>
        </div>

        <div className={formatTheme.footerClass}>
          Monitoring RPD Hal III DIPA • KPPN Tipe A1 Semarang I
        </div>
      </div>
    );
  }

  // HALAMAN 27: RAPOR PENYERAPAN 4 KLUSTER BELANJA & EARLY WARNING
  if (pageNumber === 27) {
    return (
      <div className="p-8 sm:p-10 space-y-6 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          <div className={formatTheme.headerClass}>
            <div className="flex items-center justify-between">
              <h2 className={`text-2xl font-black ${formatTheme.headerTitleClass}`}>
                Rapor 4 Kluster Belanja APBN
              </h2>
              <span className="text-xs font-bold uppercase text-amber-300">
                Early Warning System
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-600 font-medium text-justify">
            Pemetaan komprehensif penyerapan anggaran per kluster jenis belanja negara (Akun 51, 52, 53, dan 57) guna mendeteksi anomali penyerapan secara dini:
          </p>

          {/* 4 Kluster Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Akun 51 */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-black text-xs text-slate-900">Belanja Pegawai (51)</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">Normal / Stabil</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-emerald-600 h-2 rounded-full" style={{ width: '74%' }} />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>Capaian: 74.2%</span>
                <span>Pagu: Rp4,82 T</span>
              </div>
              <p className="text-[10px] text-slate-600">Penyaluran gaji, tunjangan kinerja, dan uang lembur berjalan tepat waktu tanpa kendala.</p>
            </div>

            {/* Akun 52 */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-black text-xs text-slate-900">Belanja Barang (52)</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">Progresif</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '68%' }} />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>Capaian: 68.1%</span>
                <span>Pagu: Rp4,15 T</span>
              </div>
              <p className="text-[10px] text-slate-600">Pemanfaatan KKP Domestik dan Digipay Satu mendorong akselerasi belanja operasional.</p>
            </div>

            {/* Akun 53 */}
            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-300 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-black text-xs text-amber-950">Belanja Modal (53)</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-900">Perlu Akselerasi</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-amber-500 h-2 rounded-full" style={{ width: '58%' }} />
              </div>
              <div className="flex justify-between text-[10px] text-slate-600 font-mono">
                <span>Capaian: 58.4%</span>
                <span>Pagu: Rp3,65 T</span>
              </div>
              <p className="text-[10px] text-amber-900">Proyek fisik tahun jamak (multiyears) dan pengadaan alutsista/peralatan memerlukan percepatan termin BAST.</p>
            </div>

            {/* Akun 57 */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-black text-xs text-slate-900">Belanja Bantuan Sosial (57)</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">Tepat Sasaran</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-purple-600 h-2 rounded-full" style={{ width: '81%' }} />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>Capaian: 81.3%</span>
                <span>Pagu: Rp230 M</span>
              </div>
              <p className="text-[10px] text-slate-600">Bantuan program rehabilitasi sosial dan beasiswa tersalurkan 100% ke rekening penerima.</p>
            </div>
          </div>
        </div>

        <div className={formatTheme.footerClass}>
          Early Warning System Fiskal • KPPN Tipe A1 Semarang I
        </div>
      </div>
    );
  }

  // HALAMAN 28: DASHBOARD DIGITAL PAYMENT & MODERNISASI NON-TUNAI
  if (pageNumber === 28) {
    return (
      <div className="p-8 sm:p-10 space-y-6 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          <div className={formatTheme.headerClass}>
            <div className="flex items-center justify-between">
              <h2 className={`text-2xl font-black ${formatTheme.headerTitleClass}`}>
                Digitalisasi &amp; Cashless Society
              </h2>
              <span className="text-xs font-bold uppercase text-amber-300">
                Digipay Satu, KKP &amp; CMS
              </span>
            </div>
          </div>

          <div className="text-xs text-slate-600 font-medium leading-relaxed text-justify">
            KPPN Semarang I terus mendorong transformasi transaksi non-tunai pada 127 satuan kerja mitra kerja sama dengan Bank Himbara. Penggunaan Kartu Kredit Pemerintah (KKP) dan platform Digipay Satu menjamin keamanan kas bendahara, transparansi pembukuan, serta memberdayakan pelaku UMKM lokal Kota Semarang.
          </div>

          {/* 3 Pillars of Cashless */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2 border border-slate-700">
              <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-black">
                <CreditCard className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-xs text-amber-300">KKP Domestik</h3>
              <p className="text-[10px] text-slate-300">Total pagu UP KKP teraktivasi mencapai Rp18,4 Miliar di seluruh satker mitra.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2 border border-slate-700">
              <div className="w-8 h-8 rounded-lg bg-indigo-400 text-slate-950 flex items-center justify-center font-black">
                <Globe className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-indigo-300">Digipay Satu</h3>
              <p className="text-[10px] text-slate-300">1.240+ transaksi marketplace pengadaan barang/jasa dengan perputaran dana Rp8,9 Miliar.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2 border border-slate-700">
              <div className="w-8 h-8 rounded-lg bg-emerald-400 text-slate-950 flex items-center justify-center font-black">
                <Zap className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-emerald-300">CMS Perbankan</h3>
              <p className="text-[10px] text-slate-300">98.5% bendahara pengeluaran telah menerapkan Cash Management System (Internet Banking Satker).</p>
            </div>
          </div>

          {/* Manfaat Utama */}
          <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 space-y-2">
            <span className="font-extrabold text-xs text-indigo-950 uppercase block">Keunggulan Ekosistem Cashless:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-indigo-900">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Zero Cash Risk: Menghilangkan risiko pencurian uang tunai brankas.</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Otomatisasi Pajak: PPh &amp; PPN terhitung otomatis oleh sistem.</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Pemberdayaan UMKM: Merchant lokal langsung menerima pembayaran cepat.</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Audit Trail Digital: Jejak transaksi terekam utuh pada SAKTI &amp; OM-SPAN.</span>
              </div>
            </div>
          </div>
        </div>

        <div className={formatTheme.footerClass}>
          Modernisasi Pembayaran Non-Tunai • KPPN Tipe A1 Semarang I
        </div>
      </div>
    );
  }

  // HALAMAN 29: MONITORING TRANSFER KE DAERAH (TKD) KOTA SEMARANG
  if (pageNumber === 29) {
    return (
      <div className="p-8 sm:p-10 space-y-6 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          <div className={formatTheme.headerClass}>
            <div className="flex items-center justify-between">
              <h2 className={`text-2xl font-black ${formatTheme.headerTitleClass}`}>
                Penyaluran Transfer Ke Daerah (TKD)
              </h2>
              <span className="text-xs font-bold uppercase text-amber-300">
                Sinergi APBN &amp; APBD
              </span>
            </div>
          </div>

          <div className="text-xs text-slate-600 font-medium leading-relaxed text-justify">
            Selain belanja K/L instansi vertikal, KPPN Tipe A1 Semarang I mengemban amanah strategis menyalurkan Transfer Ke Daerah (TKD) guna mendanai desentralisasi fiskal, pelayanan publik dasar, pendidikan, kesehatan, dan pembangunan infrastruktur di Pemerintah Kota Semarang.
          </div>

          {/* TKD Allocation Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <table className="w-full">
              <thead className="bg-slate-900 text-white font-extrabold text-[11px]">
                <tr>
                  <th className="p-2.5 text-left">Jenis Transfer Ke Daerah (TKD)</th>
                  <th className="p-2.5 text-right">Alokasi Pagu</th>
                  <th className="p-2.5 text-right">Penyaluran</th>
                  <th className="p-2.5 text-center">% Realisasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-sans font-bold text-slate-900">Dana Alokasi Umum (DAU)</td>
                  <td className="p-2.5 text-right">Rp1.450 M</td>
                  <td className="p-2.5 text-right text-emerald-700 font-bold">Rp1.087 M</td>
                  <td className="p-2.5 text-center font-bold text-emerald-700">75.0%</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-sans font-bold text-slate-900">Dana Bagi Hasil (DBH Pajak/SDA)</td>
                  <td className="p-2.5 text-right">Rp385 M</td>
                  <td className="p-2.5 text-right text-emerald-700 font-bold">Rp269 M</td>
                  <td className="p-2.5 text-center font-bold text-emerald-700">69.8%</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-sans font-bold text-slate-900">DAK Non Fisik (BOS &amp; BOK)</td>
                  <td className="p-2.5 text-right">Rp410 M</td>
                  <td className="p-2.5 text-right text-emerald-700 font-bold">Rp328 M</td>
                  <td className="p-2.5 text-center font-bold text-emerald-700">80.0%</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-sans font-bold text-slate-900">DAK Fisik (Infrastruktur &amp; Sanitasi)</td>
                  <td className="p-2.5 text-right">Rp195 M</td>
                  <td className="p-2.5 text-right text-amber-700 font-bold">Rp117 M</td>
                  <td className="p-2.5 text-center font-bold text-amber-700">60.0%</td>
                </tr>
                <tr className="bg-slate-100/80 font-bold text-slate-900">
                  <td className="p-2.5 font-sans">TOTAL TKD KOTA SEMARANG</td>
                  <td className="p-2.5 text-right">Rp2.440 M</td>
                  <td className="p-2.5 text-right text-indigo-900">Rp1.801 M</td>
                  <td className="p-2.5 text-center text-indigo-900">73.8%</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950">
            <strong>Catatan Kebijakan:</strong> Penyaluran DAK Fisik tahap berikutnya mensyaratkan pemenuhan laporan penyerapan dana dan capaian output fisik terverifikasi oleh Inspektorat Kota Semarang melalui aplikasi OMSPAN TKD.
          </div>
        </div>

        <div className={formatTheme.footerClass}>
          Laporan Penyaluran TKD • KPPN Tipe A1 Semarang I
        </div>
      </div>
    );
  }

  // HALAMAN 30: GRAND STRATEGY AKSELERASI BELANJA SEMESTER BERIKUTNYA
  if (pageNumber === 30) {
    return (
      <div className="p-8 sm:p-10 space-y-6 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          <div className={formatTheme.headerClass}>
            <div className="flex items-center justify-between">
              <h2 className={`text-2xl font-black ${formatTheme.headerTitleClass}`}>
                Grand Strategy Akselerasi Belanja
              </h2>
              <span className="text-xs font-bold uppercase text-amber-300">
                10 Langkah Taktis Satker
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-600 font-medium text-justify">
            Menghadapi sisa tahun anggaran, KPPN Tipe A1 Semarang I merumuskan 10 panduan operasional wajib bagi seluruh KPA, PPK, dan Bendahara satker mitra:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-extrabold text-slate-900 block">1. Lelang Dini Pengadaan</span>
              <span className="text-[11px] text-slate-600">Segera daftarkan kontrak proyek modal ke KPPN maksimal 5 hari kerja setelah penandatanganan.</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-extrabold text-slate-900 block">2. Disiplin BAST Tagihan</span>
              <span className="text-[11px] text-slate-600">Terbitkan SPP/SPM maksimal 17 hari kerja sejak Berita Acara Serah Terima ditandatangani.</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-extrabold text-slate-900 block">3. Ketertiban Revolving UP</span>
              <span className="text-[11px] text-slate-600">Lakukan pengajuan GUP minimal 1 kali dalam sebulan untuk menghindari sanksi pemotongan UP.</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-extrabold text-slate-900 block">4. Pemutakhiran Rekening Satker</span>
              <span className="text-[11px] text-slate-600">Pastikan data supplier rekanan valid (nama, nomor rekening) guna menjamin Zero Retur SP2D.</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-extrabold text-slate-900 block">5. Sinkronisasi Data SAKTI &amp; Capaian Output</span>
              <span className="text-[11px] text-slate-600">Isi capaian output rincian output (RO) secara rutin setiap tanggal 5 bulan berikutnya.</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-extrabold text-slate-900 block">6. Optimalisasi KKP &amp; Digipay</span>
              <span className="text-[11px] text-slate-600">Gunakan porsi 20% UP KKP secara aktif untuk belanja operasional perkantoran dan konsumsi.</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-extrabold text-slate-900 block">7. Rekonsiliasi Eksternal Tepat Waktu</span>
              <span className="text-[11px] text-slate-600">Selesaikan penerbitan Surat Keterangan Rekonsiliasi (SKR) pada Modul Akuntansi MonSAKTI.</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-extrabold text-slate-900 block">8. Konsultasi Aktif dengan CSO KPPN</span>
              <span className="text-[11px] text-slate-600">Manfaatkan layanan HAI DJPb dan WhatsApp CSO KPPN Semarang I apabila mengalami kendala teknis.</span>
            </div>
          </div>
        </div>

        <div className={formatTheme.footerClass}>
          Pedoman Taktis Pelaksanaan Anggaran • KPPN Tipe A1 Semarang I
        </div>
      </div>
    );
  }

  // HALAMAN 31: SUARA STAKEHOLDER & SINERGI KEMENKEU SATU
  if (pageNumber === 31) {
    return (
      <div className="p-8 sm:p-10 space-y-6 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          <div className={formatTheme.headerClass}>
            <div className="flex items-center justify-between">
              <h2 className={`text-2xl font-black ${formatTheme.headerTitleClass}`}>
                Suara Stakeholder &amp; Sinergi
              </h2>
              <span className="text-xs font-bold uppercase text-amber-300">
                Kemenkeu Satu Semarang
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-600 font-medium text-justify">
            Apresiasi dan komitmen sinergi dari para pimpinan satuan kerja mitra dan instansi pemerintah di wilayah Kota Semarang:
          </p>

          {/* 3 Stakeholder Testimonial Cards */}
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-indigo-900 text-white font-bold text-xs flex items-center justify-center">
                    PL
                  </div>
                  <div>
                    <span className="font-bold text-xs text-slate-900 block">KPA Polrestabes Semarang</span>
                    <span className="text-[10px] text-slate-500">Satker Juara IKPA Kategori Pagu Besar</span>
                  </div>
                </div>
                <span className="text-amber-500 text-xs">★★★★★</span>
              </div>
              <p className="text-xs text-slate-700 italic text-justify">
                "Pelayanan pencairan dana SP2D di KPPN Semarang I sangat cepat, transparan, dan tanpa biaya sepeser pun. Bimbingan teknis dari petugas CSO sangat membantu kami mencapai nilai IKPA 100."
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-900 text-white font-bold text-xs flex items-center justify-center">
                    KN
                  </div>
                  <div>
                    <span className="font-bold text-xs text-slate-900 block">KPA Kejaksaan Negeri Kota Semarang</span>
                    <span className="text-[10px] text-slate-500">Mitra Penegakan Hukum &amp; Tata Kelola</span>
                  </div>
                </div>
                <span className="text-amber-500 text-xs">★★★★★</span>
              </div>
              <p className="text-xs text-slate-700 italic text-justify">
                "Kolaborasi pengelolaan keuangan negara bersama KPPN Semarang I memberikan rasa aman dan kepastian hukum dalam setiap proses pengadaan dan pertanggungjawaban APBN."
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-blue-900 text-white font-bold text-xs flex items-center justify-center">
                    BP
                  </div>
                  <div>
                    <span className="font-bold text-xs text-slate-900 block">Kepala BPKAD Kota Semarang</span>
                    <span className="text-[10px] text-slate-500">Pemerintah Kota Semarang</span>
                  </div>
                </div>
                <span className="text-amber-500 text-xs">★★★★★</span>
              </div>
              <p className="text-xs text-slate-700 italic text-justify">
                "Sinergi penyaluran Dana Transfer Ke Daerah (TKD) berjalan sangat harmonis. Dana DAU dan DAK tersalurkan tepat waktu sehingga proyek layanan masyarakat Kota Semarang tidak terhambat."
              </p>
            </div>
          </div>
        </div>

        <div className={formatTheme.footerClass}>
          Sinergi Kemenkeu Satu • KPPN Tipe A1 Semarang I
        </div>
      </div>
    );
  }

  // HALAMAN 32: GREEN BUDGETING & MITIGASI PERUBAHAN IKLIM REGIONAL
  if (pageNumber === 32) {
    return (
      <div className="p-8 sm:p-10 space-y-6 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          <div className={formatTheme.headerClass}>
            <div className="flex items-center justify-between">
              <h2 className={`text-2xl font-black ${formatTheme.headerTitleClass}`}>
                Green Budgeting &amp; Perubahan Iklim
              </h2>
              <span className="text-xs font-bold uppercase text-amber-300">
                Fiskal Berkelanjutan
              </span>
            </div>
          </div>

          <div className="text-xs text-slate-600 font-medium leading-relaxed text-justify">
            Kementerian Keuangan mengimplementasikan *Climate Budget Tagging* (CBT) guna melacak alokasi belanja negara yang berdampak langsung pada mitigasi bencana banjir rob, penataan pesisir pantai utara, serta efisiensi energi di Kota Semarang.
          </div>

          {/* 3 Green Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-emerald-950 text-white space-y-2 border border-emerald-800">
              <div className="w-8 h-8 rounded-lg bg-emerald-400 text-slate-950 flex items-center justify-center font-black">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-xs text-emerald-300">Tagging Anggaran Hijau</h3>
              <p className="text-[10px] text-emerald-100">Alokasi Rp342 Miliar pada satker PUPR &amp; KLHK untuk normalisasi sungai &amp; tanggul rob pesisir Semarang.</p>
            </div>

            <div className="p-4 rounded-xl bg-emerald-950 text-white space-y-2 border border-emerald-800">
              <div className="w-8 h-8 rounded-lg bg-teal-400 text-slate-950 flex items-center justify-center font-black">
                <Globe className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-teal-300">Paperless Office SAKTI</h3>
              <p className="text-[10px] text-teal-100">Penerapan Tanda Tangan Elektronik (TTE) menghemat lebih dari 1,8 juta lembar kertas per tahun di wilayah kerja.</p>
            </div>

            <div className="p-4 rounded-xl bg-emerald-950 text-white space-y-2 border border-emerald-800">
              <div className="w-8 h-8 rounded-lg bg-lime-400 text-slate-950 flex items-center justify-center font-black">
                <Zap className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-lime-300">Eco-Efficiency Gedung</h3>
              <p className="text-[10px] text-lime-100">Instalasi panel surya &amp; sensor pencahayaan hemat energi di Gedung Keuangan Negara (GKN) Semarang.</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
            <span className="font-bold text-xs text-emerald-950 uppercase block">Rekomendasi Satker Ramah Lingkungan:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-emerald-900">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>Prioritaskan e-Katalog pengadaan kendaraan listrik operasional dinas.</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>Batasi konsumsi plastik sekali pakai dalam setiap rapat dinas satker.</span>
              </div>
            </div>
          </div>
        </div>

        <div className={formatTheme.footerClass}>
          Green Treasury • KPPN Tipe A1 Semarang I
        </div>
      </div>
    );
  }

  // HALAMAN 33: MATURITAS PENGENDALIAN INTERN & MANAJEMEN RISIKO
  if (pageNumber === 33) {
    return (
      <div className="p-8 sm:p-10 space-y-6 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          <div className={formatTheme.headerClass}>
            <div className="flex items-center justify-between">
              <h2 className={`text-2xl font-black ${formatTheme.headerTitleClass}`}>
                Pengendalian Intern &amp; Risiko
              </h2>
              <span className="text-xs font-bold uppercase text-amber-300">
                Sistem Pengendalian Intern (SPI)
              </span>
            </div>
          </div>

          <div className="text-xs text-slate-600 font-medium leading-relaxed text-justify">
            Penerapan Manajemen Risiko (MR) dan Sistem Pengendalian Intern Pemerintah (SPIP) pada setiap tahapan penerbitan SP2D memastikan seluruh transaksi perbendaharaan bebas dari potensi penyimpangan dan kesalahan administratif.
          </div>

          {/* Risk Control Matrix */}
          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <table className="w-full">
              <thead className="bg-slate-900 text-white font-extrabold text-[11px]">
                <tr>
                  <th className="p-2.5 text-left">Area Risiko Kritis</th>
                  <th className="p-2.5 text-left">Tingkat Risiko</th>
                  <th className="p-2.5 text-left">Mitigasi Pengendalian KPPN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-bold text-slate-900">Retur SP2D Rekening Rekanan</td>
                  <td className="p-2.5"><span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-bold">Sedang</span></td>
                  <td className="p-2.5 text-slate-600">Validasi otomatis data supplier &amp; konfirmasi nama pemilik rekening ke Bank Operasional.</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-bold text-slate-900">Keterlambatan Pendaftaran Kontrak</td>
                  <td className="p-2.5"><span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-bold">Sedang</span></td>
                  <td className="p-2.5 text-slate-600">Peringatan otomatis H-3 batas waktu pendaftaran 5 hari kerja melalui portal OMSPAN.</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-bold text-slate-900">Ketidaksesuaian SPM &amp; Bukti Tagihan</td>
                  <td className="p-2.5"><span className="px-2 py-0.5 rounded bg-red-100 text-red-900 text-[10px] font-bold">Tinggi</span></td>
                  <td className="p-2.5 text-slate-600">Verifikasi berlapis oleh Front Office (FO), Validator Seksi Pencairan Dana, dan Kasi PD.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-950">
            <strong>Target Capaian 2026:</strong> Mempertahankan predikat <em>Zero Fraud</em>, <em>Zero SP2D Error</em>, dan waktu rata-rata penerbitan SP2D kurang dari 45 menit sejak SPM disetujui.
          </div>
        </div>

        <div className={formatTheme.footerClass}>
          Manajemen Risiko &amp; SPIP • KPPN Tipe A1 Semarang I
        </div>
      </div>
    );
  }

  // HALAMAN 34: DEEP DIVE 8 INDIKATOR IKPA 2026 MENUJU NILAI SEMPURNA 100
  if (pageNumber === 34) {
    return (
      <div className="p-8 sm:p-10 space-y-6 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          <div className={formatTheme.headerClass}>
            <div className="flex items-center justify-between">
              <h2 className={`text-2xl font-black ${formatTheme.headerTitleClass}`}>
                Formula Nilai IKPA 100 Sempurna
              </h2>
              <span className="text-xs font-bold uppercase text-amber-300">
                Panduan Teknis PPK &amp; PPSPM
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="font-extrabold text-slate-900 block text-xs">1. Revisi DIPA (Bobot 10%)</span>
              <p className="text-[11px] text-slate-600">Maksimal 1 kali revisi per triwulan yang mengubah pagu/output untuk mempertahankan nilai 100.</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="font-extrabold text-slate-900 block text-xs">2. Deviasi Halaman III DIPA (Bobot 10%)</span>
              <p className="text-[11px] text-slate-600">Deviasi realisasi terhadap RPD bulanan maksimal 5% di setiap akhir triwulan.</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="font-extrabold text-slate-900 block text-xs">3. Penyerapan Anggaran (Bobot 20%)</span>
              <p className="text-[11px] text-slate-600">Target triwulanan: TW I (20%), TW II (50%), TW III (75%), TW IV (minimal 95%).</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="font-extrabold text-slate-900 block text-xs">4. Belanja Kontraktual (Bobot 10%)</span>
              <p className="text-[11px] text-slate-600">Daftarkan data kontrak maksimal 5 hari kerja sejak tanggal penandatanganan.</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="font-extrabold text-slate-900 block text-xs">5. Penyelesaian Tagihan (Bobot 10%)</span>
              <p className="text-[11px] text-slate-600">SPM LS Non-Belanja Pegawai diajukan maksimal 17 hari kerja sejak BAST sah.</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="font-extrabold text-slate-900 block text-xs">6. Pengelolaan UP dan TUP (Bobot 10%)</span>
              <p className="text-[11px] text-slate-600">Revolving GUP minimal 1 kali per bulan dan setor sisa TUP tepat 30 hari kalender.</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="font-extrabold text-slate-900 block text-xs">7. Dispensasi SPM (Bobot 5%)</span>
              <p className="text-[11px] text-slate-600">Zero dispensasi di akhir tahun anggaran dengan mematuhi jadwal pedoman LLAT.</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="font-extrabold text-slate-900 block text-xs">8. Capaian Output SAKTI (Bobot 25%)</span>
              <p className="text-[11px] text-slate-600">Isi Progress Output (PCRO) dan Realisasi Volume (RVRO) 100% tepat waktu.</p>
            </div>
          </div>
        </div>

        <div className={formatTheme.footerClass}>
          Pedoman Indikator IKPA • KPPN Tipe A1 Semarang I
        </div>
      </div>
    );
  }

  // HALAMAN 35: PEMBERDAYAAN UMKM KEMENKEU SATU
  if (pageNumber === 35) {
    return (
      <div className="p-8 sm:p-10 space-y-6 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          <div className={formatTheme.headerClass}>
            <div className="flex items-center justify-between">
              <h2 className={`text-2xl font-black ${formatTheme.headerTitleClass}`}>
                Pemberdayaan UMKM Kemenkeu Satu
              </h2>
              <span className="text-xs font-bold uppercase text-amber-300">
                Sinergi Regional Jawa Tengah
              </span>
            </div>
          </div>

          <div className="text-xs text-slate-600 font-medium leading-relaxed text-justify">
            Melalui payung kolaborasi Kemenkeu Satu (DJPb, DJP, DJBC, dan DJKN), KPPN Semarang I aktif menggerakkan pelaku UMKM lokal Kota Semarang agar naik kelas, mengakses pembiayaan Ultra Mikro (UMi), dan masuk dalam rantai pasok pengadaan pemerintah.
          </div>

          {/* 3 Program UMKM */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2 border border-slate-700">
              <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-black">
                <Building2 className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-xs text-amber-300">Bazaar UMKM Rutin</h3>
              <p className="text-[10px] text-slate-300">Penyelenggaraan pameran produk binaan di lobi GKN Semarang setiap kegiatan rapat akbar.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2 border border-slate-700">
              <div className="w-8 h-8 rounded-lg bg-indigo-400 text-slate-950 flex items-center justify-center font-black">
                <Globe className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-indigo-300">Onboarding Digipay</h3>
              <p className="text-[10px] text-slate-300">Pendampingan pembuatan NPWP, NIB, dan aktivasi merchant Digipay Satu secara gratis.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2 border border-slate-700">
              <div className="w-8 h-8 rounded-lg bg-emerald-400 text-slate-950 flex items-center justify-center font-black">
                <Zap className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-emerald-300">Penyaluran Dana UMi</h3>
              <p className="text-[10px] text-slate-300">Monitoring penyaluran Pembiayaan Ultra Mikro bagi 3.800+ debitur mikro di Kota Semarang.</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-1">
            <strong>Ajakan untuk Satker:</strong> Belanjakan anggaran konsumsi rapat dan pengadaan ATK kantor pada UMKM mitra lokal Semarang melalui Digipay Satu dan KKP Domestik!
          </div>
        </div>

        <div className={formatTheme.footerClass}>
          Pemberdayaan UMKM • KPPN Tipe A1 Semarang I
        </div>
      </div>
    );
  }

  // HALAMAN 36: KLINIK KONSULTASI ANGGARAN & FAQ REVISI DIPA
  if (pageNumber === 36) {
    return (
      <div className="p-8 sm:p-10 space-y-6 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          <div className={formatTheme.headerClass}>
            <div className="flex items-center justify-between">
              <h2 className={`text-2xl font-black ${formatTheme.headerTitleClass}`}>
                Klinik Konsultasi &amp; FAQ Anggaran
              </h2>
              <span className="text-xs font-bold uppercase text-amber-300">
                Solusi Masalah SAKTI
              </span>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="font-bold text-slate-900 block text-xs">❓ Tanya: Bagaimana cara mengatasi pagu minus pada akun belanja pegawai?</span>
              <p className="text-[11px] text-slate-600 text-justify">
                <strong>💡 Jawab:</strong> Segera ajukan revisi pergeseran pagu antar komponen/akun sejenis dalam 1 output melalui kewenangan KPA, atau lakukan revisi DIPA Kanwil DJPb sebelum batas waktu cut-off rekonsiliasi bulanan.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="font-bold text-slate-900 block text-xs">❓ Tanya: Rekening rekanan mengalami retur SP2D, apa langkah bendahara?</span>
              <p className="text-[11px] text-slate-600 text-justify">
                <strong>💡 Jawab:</strong> Segera minta surat keterangan rekening aktif dari bank rekanan, lakukan update data supplier di Modul Komitmen SAKTI dengan tipe supplier yang benar, lalu kirimkan surat permohonan ralat rekening ke KPPN Semarang I.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="font-bold text-slate-900 block text-xs">❓ Tanya: Apakah perubahan RPD Hal III DIPA dapat dilakukan setiap bulan?</span>
              <p className="text-[11px] text-slate-600 text-justify">
                <strong>💡 Jawab:</strong> Pemutakhiran RPD Hal III DIPA hanya dapat dilakukan pada periode revisi reguler di awal triwulan (10 hari kerja pertama triwulan berjalan) untuk penilaian IKPA triwulan berkenaan.
              </p>
            </div>
          </div>
        </div>

        <div className={formatTheme.footerClass}>
          Klinik Perbendaharaan • KPPN Tipe A1 Semarang I
        </div>
      </div>
    );
  }

  // HALAMAN 37: HARMONISASI LAPORAN KEUANGAN MENUJU OPINI WTP
  if (pageNumber === 37) {
    return (
      <div className="p-8 sm:p-10 space-y-6 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          <div className={formatTheme.headerClass}>
            <div className="flex items-center justify-between">
              <h2 className={`text-2xl font-black ${formatTheme.headerTitleClass}`}>
                Laporan Keuangan &amp; Opini WTP
              </h2>
              <span className="text-xs font-bold uppercase text-amber-300">
                MonSAKTI &amp; Kualitas LPJ
              </span>
            </div>
          </div>

          <div className="text-xs text-slate-600 font-medium leading-relaxed text-justify">
            Penyusunan Laporan Keuangan Kementerian/Lembaga (LKKL) tingkat UAKPA yang akuntabel dan transparan merupakan pilar utama mempertahankan Opini Wajar Tanpa Pengecualian (WTP) dari Badan Pemeriksa Keuangan (BPK).
          </div>

          {/* 4 Steps to WTP */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 space-y-1">
              <span className="font-extrabold text-indigo-950 block">1. Selesaikan To Do List MonSAKTI</span>
              <p className="text-[11px] text-indigo-900">Pantau menu To Do List MonSAKTI setiap hari untuk menuntaskan transaksi gantung dan persediaan belum register.</p>
            </div>

            <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 space-y-1">
              <span className="font-extrabold text-indigo-950 block">2. Terbitkan SKR Tepat Waktu</span>
              <p className="text-[11px] text-indigo-900">Lakukan proses tutup buku modul akuntansi dan pastikan Surat Keterangan Rekonsiliasi (SKR) terbit sebelum tanggal 14.</p>
            </div>

            <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 space-y-1">
              <span className="font-extrabold text-indigo-950 block">3. Validasi Saldo Kas di Bendahara</span>
              <p className="text-[11px] text-indigo-900">Kesesuaian pembukuan LPJ Bendahara Pengeluaran dan Penerimaan dengan saldo rekening koran bank per akhir bulan.</p>
            </div>

            <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 space-y-1">
              <span className="font-extrabold text-indigo-950 block">4. Inventarisasi Aset &amp; Persediaan</span>
              <p className="text-[11px] text-indigo-900">Lakukan opname fisik persediaan dan rekonsiliasi internal antara Modul Aset Tetap dengan Modul GL/Pelaporan.</p>
            </div>
          </div>
        </div>

        <div className={formatTheme.footerClass}>
          Akuntansi &amp; Pelaporan Keuangan • KPPN Tipe A1 Semarang I
        </div>
      </div>
    );
  }

  // HALAMAN 38: STANDARDISASI KOMPETENSI PEJABAT PERBENDAHARAAN (BNT/PNT)
  if (pageNumber === 38) {
    return (
      <div className="p-8 sm:p-10 space-y-6 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          <div className={formatTheme.headerClass}>
            <div className="flex items-center justify-between">
              <h2 className={`text-2xl font-black ${formatTheme.headerTitleClass}`}>
                Sertifikasi Pejabat Perbendaharaan
              </h2>
              <span className="text-xs font-bold uppercase text-amber-300">
                BNT, PPK &amp; PPSPM
              </span>
            </div>
          </div>

          <div className="text-xs text-slate-600 font-medium leading-relaxed text-justify">
            Sesuai Peraturan Presiden Nomor 7 Tahun 2016 dan ketentuan Dirjen Perbendaharaan, seluruh Bendahara Pengeluaran/Penerimaan, Pejabat Pembuat Komitmen (PPK), dan Pejabat Penandatangan SPM (PPSPM) wajib memiliki Sertifikat Kompetensi Profesi Negara.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-center">
            <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2 border border-slate-700">
              <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-black mx-auto">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-xs text-amber-300">Sertifikat BNT</h3>
              <p className="text-[10px] text-slate-300">100% Bendahara di 127 Satker mitra Semarang I telah mengantongi sertifikat BNT aktif.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2 border border-slate-700">
              <div className="w-8 h-8 rounded-lg bg-indigo-400 text-slate-950 flex items-center justify-center font-black mx-auto">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-indigo-300">Sertifikat PNT PPK</h3>
              <p className="text-[10px] text-slate-300">Pelatihan dan uji kompetensi bagi PPK secara daring melalui Kemenkeu Learning Center (KLC).</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2 border border-slate-700">
              <div className="w-8 h-8 rounded-lg bg-emerald-400 text-slate-950 flex items-center justify-center font-black mx-auto">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-emerald-300">Sertifikat PPSPM</h3>
              <p className="text-[10px] text-slate-300">Standardisasi verifikasi pengujian dokumen tagihan negara sebelum penerbitan SPM.</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-700 text-center font-medium">
            🎓 KPPN Semarang I secara berkala menyelenggarakan Refreshment dan Ujian Sertifikasi Terpadu bekerja sama dengan BPPK Kemenkeu.
          </div>
        </div>

        <div className={formatTheme.footerClass}>
          Pengembangan SDM Keuangan Negara • KPPN Tipe A1 Semarang I
        </div>
      </div>
    );
  }

  // HALAMAN 39: INOVASI LAYANAN PRIMA RAMAH DISABILITAS & WBBM
  if (pageNumber === 39) {
    return (
      <div className="p-8 sm:p-10 space-y-6 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          <div className={formatTheme.headerClass}>
            <div className="flex items-center justify-between">
              <h2 className={`text-2xl font-black ${formatTheme.headerTitleClass}`}>
                Inovasi Layanan Publik Prima
              </h2>
              <span className="text-xs font-bold uppercase text-amber-300">
                WBBM &amp; Inklusif
              </span>
            </div>
          </div>

          <div className="text-xs text-slate-600 font-medium leading-relaxed text-justify">
            KPPN Tipe A1 Semarang I terus berinovasi mewujudkan predikat Wilayah Birokrasi Bersih dan Melayani (WBBM) melalui penyediaan fasilitas inklusif, ramah kelompok rentan, dan digitalisasi *Customer Service Officer* (CSO).
          </div>

          {/* 4 Inklusif Facilities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="font-bold text-slate-900 block text-xs">♿ Jalur Pemandu &amp; Kursi Roda</span>
              <p className="text-[11px] text-slate-600">Fasilitas ramp bidang miring, guiding block tuna netra, dan kursi roda otomatis di pintu masuk utama.</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="font-bold text-slate-900 block text-xs">🤱 Ruang Laktasi &amp; Pojok Baca Anak</span>
              <p className="text-[11px] text-slate-600">Ruangan privat ber-AC dengan fasilitas higienis bagi ibu menyusui dan area bermain anak edukatif.</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="font-bold text-slate-900 block text-xs">☕ Ruang Tunggu VIP &amp; Free Coffee</span>
              <p className="text-[11px] text-slate-600">Lounge nyaman dengan Wi-Fi kencang, minuman teh/kopi gratis, dan charging station untuk petugas satker.</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="font-bold text-slate-900 block text-xs">💬 Layanan Isyarat &amp; Audio Guide</span>
              <p className="text-[11px] text-slate-600">Petugas Front Office terlatih bahasa isyarat dasar serta brosur audio untuk kemudahan komunikasi.</p>
            </div>
          </div>
        </div>

        <div className={formatTheme.footerClass}>
          Pelayanan Publik Inklusif • KPPN Tipe A1 Semarang I
        </div>
      </div>
    );
  }

  // HALAMAN 40: TATA KELOLA REKENING PEMERINTAH (RPL/RPS & VIRTUAL ACCOUNT)
  if (pageNumber === 40) {
    return (
      <div className="p-8 sm:p-10 space-y-6 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          <div className={formatTheme.headerClass}>
            <div className="flex items-center justify-between">
              <h2 className={`text-2xl font-black ${formatTheme.headerTitleClass}`}>
                Tata Kelola Rekening Pemerintah
              </h2>
              <span className="text-xs font-bold uppercase text-amber-300">
                Treasury Single Account (TSA)
              </span>
            </div>
          </div>

          <div className="text-xs text-slate-600 font-medium leading-relaxed text-justify">
            Implementasi <em>Treasury Single Account</em> (TSA) dan integrasi Rekening Pengeluaran Lainnya (RPL) ke dalam sistem Virtual Account perbankan menjamin pengelolaan saldo kas negara di seluruh satker terpantau secara konsolidatif *real-time* tanpa saldo mengendap (*zero idle cash*).
          </div>

          {/* 3 Core Principles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2 border border-slate-700">
              <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-black">
                <CreditCard className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-xs text-amber-300">Virtual Account Induk</h3>
              <p className="text-[10px] text-slate-300">Otomasi penarikan saldo harian kas bendahara menuju Sub-Rekening Kas Umum Negara (Sub-RKUN).</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2 border border-slate-700">
              <div className="w-8 h-8 rounded-lg bg-indigo-400 text-slate-950 flex items-center justify-center font-black">
                <Building2 className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-indigo-300">Izin Pembukaan Rekening</h3>
              <p className="text-[10px] text-slate-300">Seluruh rekening dinas wajib memiliki surat persetujuan izin resmi dari Kepala KPPN Semarang I.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2 border border-slate-700">
              <div className="w-8 h-8 rounded-lg bg-emerald-400 text-slate-950 flex items-center justify-center font-black">
                <Zap className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-emerald-300">Rekonsiliasi Bank Otomatis</h3>
              <p className="text-[10px] text-slate-300">Sinkronisasi pembukuan LPJ Bendahara dengan data saldo koran Bank Operasional mitra kerja.</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-1">
            <strong>Peringatan Satker:</strong> Dilarang keras membuka rekening atas nama pribadi untuk menampung dana APBN. Segera laporkan rekening yang sudah tidak aktif untuk proses penutupan resmi.
          </div>
        </div>

        <div className={formatTheme.footerClass}>
          Manajemen Kas &amp; Rekening • KPPN Tipe A1 Semarang I
        </div>
      </div>
    );
  }

  // HALAMAN 41: AKUNTANSI AKRUAL & PENGELOLAAN ASET BMN
  if (pageNumber === 41) {
    return (
      <div className="p-8 sm:p-10 space-y-6 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          <div className={formatTheme.headerClass}>
            <div className="flex items-center justify-between">
              <h2 className={`text-2xl font-black ${formatTheme.headerTitleClass}`}>
                Akuntansi Akrual &amp; Aset BMN
              </h2>
              <span className="text-xs font-bold uppercase text-amber-300">
                Laporan Keuangan Berkualitas
              </span>
            </div>
          </div>

          <div className="text-xs text-slate-600 font-medium leading-relaxed text-justify">
            Penerapan Standar Akuntansi Pemerintahan (SAP) berbasis akrual menuntut ketertiban pencatatan Barang Milik Negara (BMN), penyusutan aset tetap, dan pengakuan belanja dibayar di muka secara presisi pada Modul Aset Tetap dan Persediaan SAKTI.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="font-bold text-slate-900 block text-xs">📦 Penatausahaan Persediaan Usang</span>
              <p className="text-[11px] text-slate-600">Lakukan koreksi persediaan rusak/kedaluwarsa sebelum akhir semester untuk menghindari temuan auditor.</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="font-bold text-slate-900 block text-xs">🏗️ Konstruksi Dalam Pengerjaan (KDP)</span>
              <p className="text-[11px] text-slate-600">Segera lakukan reklasifikasi BMN dari KDP menjadi Aset Tetap Definitif setelah BAST pekerjaan fisik 100% tuntas.</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="font-bold text-slate-900 block text-xs">📑 Rekonsiliasi Internal BMN - Keuangan</span>
              <p className="text-[11px] text-slate-600">Cocokkan saldo neraca antara operator SIMAK-BMN/SAKTI Aset dengan operator GL Pelaporan secara periodik.</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="font-bold text-slate-900 block text-xs">🛡️ Pengamanan Hukum &amp; Sertifikasi Tanah</span>
              <p className="text-[11px] text-slate-600">Sinergi bersama DJKN/KPKNL Semarang dalam program sertifikasi tanah BMN milik instansi vertikal.</p>
            </div>
          </div>
        </div>

        <div className={formatTheme.footerClass}>
          Pengelolaan BMN &amp; Akuntansi • KPPN Tipe A1 Semarang I
        </div>
      </div>
    );
  }

  // HALAMAN 42: STRATEGI ZERO RETUR SP2D & VALIDASI PERBANKAN
  if (pageNumber === 42) {
    return (
      <div className="p-8 sm:p-10 space-y-6 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          <div className={formatTheme.headerClass}>
            <div className="flex items-center justify-between">
              <h2 className={`text-2xl font-black ${formatTheme.headerTitleClass}`}>
                Strategi Zero Retur SP2D
              </h2>
              <span className="text-xs font-bold uppercase text-amber-300">
                Ketepatan Penyaluran Dana
              </span>
            </div>
          </div>

          <div className="text-xs text-slate-600 font-medium leading-relaxed text-justify">
            Retur SP2D terjadi saat pencairan dana ditolak oleh sistem kliring/BI-FAST perbankan akibat perbedaan nama atau nomor rekening penerima. KPPN Semarang I menerapkan protokol verifikasi ketat guna mencapai target <em>Zero Retur SP2D</em>.
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3">
            <span className="font-bold text-xs text-amber-300 uppercase block">3 Langkah Wajib PPK Sebelum Menerbitkan SPM:</span>
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Minta salinan buku tabungan / rekening koran resmi berstempel basah dari pihak rekanan atau penerima honor.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Pastikan penulisan nama pemilik rekening di Modul Komitmen SAKTI identik tanpa singkatan yang tidak sesuai database bank.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Lakukan *test transaction* atau uji validasi nomor rekening via portal perbankan sebelum pengajuan SPM berulang.</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950">
            <strong>Kinerja Unggul:</strong> Tingkat kesuksesan transfer SP2D di KPPN Semarang I mencapai <strong>99.94%</strong>, membuktikan komitmen tinggi satker dalam menjaga validitas data supplier.
          </div>
        </div>

        <div className={formatTheme.footerClass}>
          Seksi Bank &amp; Pencairan Dana • KPPN Tipe A1 Semarang I
        </div>
      </div>
    );
  }

  // HALAMAN 43: HIBAH LANGSUNG, PHLN & SBSN PROYEK STRATEGIS
  if (pageNumber === 43) {
    return (
      <div className="p-8 sm:p-10 space-y-6 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          <div className={formatTheme.headerClass}>
            <div className="flex items-center justify-between">
              <h2 className={`text-2xl font-black ${formatTheme.headerTitleClass}`}>
                Hibah, PHLN &amp; Proyek SBSN
              </h2>
              <span className="text-xs font-bold uppercase text-amber-300">
                Pembiayaan Pembangunan
              </span>
            </div>
          </div>

          <div className="text-xs text-slate-600 font-medium leading-relaxed text-justify">
            Selain belanja rupiah murni, KPPN Semarang I mengawal pembiayaan proyek-proyek strategis berbasis Surat Berharga Syariah Negara (SBSN), Pinjaman/Hibah Luar Negeri (PHLN), serta pengesahan Hibah Langsung Dalam/Luar Negeri.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2 border border-slate-700">
              <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-black">
                <Building2 className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-xs text-amber-300">Proyek SBSN Kampus &amp; Kemenag</h3>
              <p className="text-[10px] text-slate-300">Pembangunan gedung kuliah terpadu PTKIN dan revitalisasi Balai Nikah/KUA di wilayah Kota Semarang.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2 border border-slate-700">
              <div className="w-8 h-8 rounded-lg bg-indigo-400 text-slate-950 flex items-center justify-center font-black">
                <Layers className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-indigo-300">Pengesahan Hibah (SP3HL)</h3>
              <p className="text-[10px] text-slate-300">Proses pengesahan hibah langsung bentuk uang/barang secara tertib melalui penerbitan SP2HL/SP4HL.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2 border border-slate-700">
              <div className="w-8 h-8 rounded-lg bg-emerald-400 text-slate-950 flex items-center justify-center font-black">
                <Zap className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-emerald-300">Monitoring PHLN PUPR</h3>
              <p className="text-[10px] text-slate-300">Pencairan dana pinjaman luar negeri untuk proyek drainase perkotaan dan sistem sanitasi ramah lingkungan.</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-950">
            💡 KPPN Semarang I siap memberikan asistensi registrasi nomor register hibah di Ditjen Pengelolaan Pembiayaan dan Risiko (DJPPR) bagi satker penerima hibah baru.
          </div>
        </div>

        <div className={formatTheme.footerClass}>
          Pembiayaan SBSN &amp; Hibah • KPPN Tipe A1 Semarang I
        </div>
      </div>
    );
  }

  // HALAMAN 44: PERAN REGIONAL CHIEF ECONOMIST (RCE) & FINANCIAL ADVISORY
  if (pageNumber === 44) {
    return (
      <div className="p-8 sm:p-10 space-y-6 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          <div className={formatTheme.headerClass}>
            <div className="flex items-center justify-between">
              <h2 className={`text-2xl font-black ${formatTheme.headerTitleClass}`}>
                Peran Regional Chief Economist
              </h2>
              <span className="text-xs font-bold uppercase text-amber-300">
                Financial Advisory &amp; RCE
              </span>
            </div>
          </div>

          <div className="text-xs text-slate-600 font-medium leading-relaxed text-justify">
            Transformasi Ditjen Perbendaharaan mengukuhkan KPPN bukan sekadar kasir penerbit SP2D, melainkan *Financial Advisor*, analis belanja pemerintah, dan mitra strategis Pemerintah Daerah Kota Semarang dalam forum ALCo (*Asset and Liability Committee*) Regional Jawa Tengah.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="font-bold text-slate-900 block text-xs">📊 Kajian Fiskal Regional (KFR)</span>
              <p className="text-[11px] text-slate-600">Penyusunan laporan analisis perkembangan ekonomi makro, inflasi daerah, dan daya beli masyarakat secara bulanan.</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="font-bold text-slate-900 block text-xs">🤝 Asistensi Keuangan Pemda</span>
              <p className="text-[11px] text-slate-600">Konsultasi percepatan penyerapan Dana Bagi Hasil (DBH), DAK Fisik, dan DAK Nonfisik bersama BPKAD Kota Semarang.</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="font-bold text-slate-900 block text-xs">💼 Forum Konsultasi Kemenkeu Satu</span>
              <p className="text-[11px] text-slate-600">Kolaborasi bersama Pajak, Bea Cukai, dan Lelang Negara dalam optimalisasi potensi penerimaan negara regional.</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="font-bold text-slate-900 block text-xs">🎙️ Diseminasi Fiskal Berkala</span>
              <p className="text-[11px] text-slate-600">Penyampaian siaran pers kinerja APBN kepada awak media dan akademisi universitas terkemuka di Semarang.</p>
            </div>
          </div>
        </div>

        <div className={formatTheme.footerClass}>
          Regional Chief Economist • KPPN Tipe A1 Semarang I
        </div>
      </div>
    );
  }

  // HALAMAN 45: EVALUASI PELAKSANAAN ANGGARAN PEMILU & PILKADA SERENTAK
  if (pageNumber === 45) {
    return (
      <div className="p-8 sm:p-10 space-y-6 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          <div className={formatTheme.headerClass}>
            <div className="flex items-center justify-between">
              <h2 className={`text-2xl font-black ${formatTheme.headerTitleClass}`}>
                Kinerja Anggaran Pesta Demokrasi
              </h2>
              <span className="text-xs font-bold uppercase text-amber-300">
                Satker KPU &amp; Bawaslu
              </span>
            </div>
          </div>

          <div className="text-xs text-slate-600 font-medium leading-relaxed text-justify">
            KPPN Semarang I memberikan pendampingan intensif bagi Satker Komisi Pemilihan Umum (KPU) dan Badan Pengawas Pemilu (Bawaslu) Provinsi Jawa Tengah maupun Kota Semarang guna menjamin seluruh tahapan pesta demokrasi didukung likuiditas kas negara yang tepat waktu dan akuntabel.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2 border border-slate-700">
              <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-black">
                <Users className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-xs text-amber-300">Honor Badan Adhoc</h3>
              <p className="text-[10px] text-slate-300">Penyaluran honor PPK, PPS, dan KPPS melalui mekanisme transfer massal perbankan tepat waktu.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2 border border-slate-700">
              <div className="w-8 h-8 rounded-lg bg-indigo-400 text-slate-950 flex items-center justify-center font-black">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-indigo-300">Pengadaan Logistik</h3>
              <p className="text-[10px] text-slate-300">Penyelesaian tagihan pencetakan surat suara dan kotak suara sesuai batas waktu BAST 17 hari kerja.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2 border border-slate-700">
              <div className="w-8 h-8 rounded-lg bg-emerald-400 text-slate-950 flex items-center justify-center font-black">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-emerald-300">Pengamanan TNI/Polri</h3>
              <p className="text-[10px] text-slate-300">Dukungan anggaran operasi pengamanan pemilu terpadu Polda Jateng dan Kodam IV/Diponegoro.</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950">
            ⭐ Seluruh dokumen SPM terkait tahapan pemilu diproses dengan layanan prioritas (*Golden Fast-Track Lane*) oleh tim Front Office KPPN Semarang I.
          </div>
        </div>

        <div className={formatTheme.footerClass}>
          Dukungan Anggaran Pemilu • KPPN Tipe A1 Semarang I
        </div>
      </div>
    );
  }

  // HALAMAN 46: STANDAR PELAYANAN MINIMAL & INDEKS KEPUASAN MASYARAKAT (IKM 4.98/5.00)
  if (pageNumber === 46) {
    return (
      <div className="p-8 sm:p-10 space-y-6 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          <div className={formatTheme.headerClass}>
            <div className="flex items-center justify-between">
              <h2 className={`text-2xl font-black ${formatTheme.headerTitleClass}`}>
                Indeks Kepuasan Masyarakat (IKM)
              </h2>
              <span className="text-xs font-bold uppercase text-amber-300">
                Nilai 4.98 / 5.00 (Sangat Puas)
              </span>
            </div>
          </div>

          <div className="text-xs text-slate-600 font-medium leading-relaxed text-justify">
            Berdasarkan survei kepuasan pengguna layanan semester berjalan yang melibatkan seluruh Pejabat Perbendaharaan satker mitra, KPPN Tipe A1 Semarang I berhasil mempertahankan skor Indeks Kepuasan Masyarakat (IKM) pada kategori <strong>Sangat Memuaskan</strong>.
          </div>

          {/* 4 Survey Pillars */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3.5 rounded-xl bg-slate-900 text-white space-y-1">
              <span className="text-2xl font-black text-amber-400">4.99</span>
              <span className="text-[10px] text-slate-300 block font-bold">Kerapian &amp; Kebersihan Sarana</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900 text-white space-y-1">
              <span className="text-2xl font-black text-emerald-400">4.98</span>
              <span className="text-[10px] text-slate-300 block font-bold">Kecepatan Penerbitan SP2D</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900 text-white space-y-1">
              <span className="text-2xl font-black text-indigo-400">4.97</span>
              <span className="text-[10px] text-slate-300 block font-bold">Keramahan &amp; Solusi CSO</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900 text-white space-y-1">
              <span className="text-2xl font-black text-amber-400">5.00</span>
              <span className="text-[10px] text-slate-300 block font-bold">Bebas Pungutan Liar (Rp0,-)</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
            <strong>Komitmen Berkelanjutan:</strong> Hasil survei menjadi bahan evaluasi rutin untuk senantiasa menyempurnakan fasilitas, memangkas birokrasi, dan memberikan respon cepat atas setiap aduan layanan.
          </div>
        </div>

        <div className={formatTheme.footerClass}>
          Survei Kepuasan Layanan • KPPN Tipe A1 Semarang I
        </div>
      </div>
    );
  }

  // HALAMAN 47: KALENDER KERJA & LANGKAH-LANGKAH AKHIR TAHUN (LLAT)
  if (pageNumber === 47) {
    return (
      <div className="p-8 sm:p-10 space-y-6 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          <div className={formatTheme.headerClass}>
            <div className="flex items-center justify-between">
              <h2 className={`text-2xl font-black ${formatTheme.headerTitleClass}`}>
                Pedoman Langkah Akhir Tahun (LLAT)
              </h2>
              <span className="text-xs font-bold uppercase text-amber-300">
                Jadwal Kritis Tutup Buku APBN
              </span>
            </div>
          </div>

          <div className="text-xs text-slate-600 font-medium leading-relaxed text-justify">
            Menjelang akhir tahun anggaran, kepatuhan satker terhadap batas waktu pengajuan SPM, pendaftaran kontrak akhir tahun, dan penyetoran sisa Uang Persediaan (UP) menjadi kunci sukses penutupan kas negara yang tertib tanpa penumpukan di akhir Desember.
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <table className="w-full">
              <thead className="bg-slate-900 text-white font-extrabold text-[11px]">
                <tr>
                  <th className="p-2.5 text-left">Batas Waktu</th>
                  <th className="p-2.5 text-left">Jenis Transaksi / Pengajuan SPM</th>
                  <th className="p-2.5 text-left">Keterangan Khusus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-bold text-red-600">30 November</td>
                  <td className="p-2.5 text-slate-900">Pendaftaran Kontrak Baru yang selesai Des</td>
                  <td className="p-2.5 text-slate-600">Kontrak di atas Rp50 juta wajib terdaftar</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-bold text-red-600">10 Desember</td>
                  <td className="p-2.5 text-slate-900">SPM LS Non-Kontraktual (Honor/Perjadin)</td>
                  <td className="p-2.5 text-slate-600">Batas akhir tagihan kegiatan November</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-bold text-red-600">18 Desember</td>
                  <td className="p-2.5 text-slate-900">SPM LS Kontraktual dengan BAP/Bank Garansi</td>
                  <td className="p-2.5 text-slate-600">Disertai Asli Jaminan Pembayaran Akhir Tahun</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-bold text-red-600">31 Desember</td>
                  <td className="p-2.5 text-slate-900">Setor Sisa Kas UP/TUP ke Kas Negara</td>
                  <td className="p-2.5 text-slate-600">Gunakan NTPN melalui akun penerimaan 815111</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className={formatTheme.footerClass}>
          Pedoman LLAT • KPPN Tipe A1 Semarang I
        </div>
      </div>
    );
  }

  // HALAMAN 48: TRANSFORMASI DIGITAL TREASURY: SAKTI & OMSPAN 2.0
  if (pageNumber === 48) {
    return (
      <div className="p-8 sm:p-10 space-y-6 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          <div className={formatTheme.headerClass}>
            <div className="flex items-center justify-between">
              <h2 className={`text-2xl font-black ${formatTheme.headerTitleClass}`}>
                Transformasi Digital Treasury
              </h2>
              <span className="text-xs font-bold uppercase text-amber-300">
                SAKTI, OMSPAN 2.0 &amp; AI
              </span>
            </div>
          </div>

          <div className="text-xs text-slate-600 font-medium leading-relaxed text-justify">
            Modernisasi ekosistem digital perbendaharaan menghadirkan kemudahan pemantauan realisasi anggaran dari genggaman ponsel, integrasi data SP2D dengan sistem perbankan secara instan, serta analitik cerdas berbasis kecerdasan buatan.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2 border border-slate-700">
              <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-black">
                <Globe className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-xs text-amber-300">OMSPAN 2.0 Next-Gen</h3>
              <p className="text-[10px] text-slate-300">Dashboard analitik data real-time, monitoring IKPA satker, dan deteksi dini pagu minus.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2 border border-slate-700">
              <div className="w-8 h-8 rounded-lg bg-indigo-400 text-slate-950 flex items-center justify-center font-black">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-indigo-300">SAKTI Mobile Approval</h3>
              <p className="text-[10px] text-slate-300">Persetujuan SPP dan penandatanganan SPM secara digital di mana saja dengan TTE resmi BSrE.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2 border border-slate-700">
              <div className="w-8 h-8 rounded-lg bg-emerald-400 text-slate-950 flex items-center justify-center font-black">
                <Zap className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-emerald-300">HAI-DJPb AI Bot</h3>
              <p className="text-[10px] text-slate-300">Asisten cerdas 24/7 penjawab pertanyaan teknis error SAKTI dan panduan regulasi fiskal.</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium text-center">
            🚀 Mewujudkan <em>Paperless</em>, <em>Borderless</em>, and <em>Real-Time Treasury Management</em>.
          </div>
        </div>

        <div className={formatTheme.footerClass}>
          Inovasi Teknologi Perbendaharaan • KPPN Tipe A1 Semarang I
        </div>
      </div>
    );
  }

  // HALAMAN 49: GALERI PRESTASI & PENGHARGAAN TINGKAT NASIONAL
  if (pageNumber === 49) {
    return (
      <div className="p-8 sm:p-10 space-y-6 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          <div className={formatTheme.headerClass}>
            <div className="flex items-center justify-between">
              <h2 className={`text-2xl font-black ${formatTheme.headerTitleClass}`}>
                Galeri Prestasi &amp; Penghargaan
              </h2>
              <span className="text-xs font-bold uppercase text-amber-300">
                Apresiasi Kinerja KPPN
              </span>
            </div>
          </div>

          <div className="text-xs text-slate-600 font-medium leading-relaxed text-justify">
            Dedikasi seluruh pegawai dan sinergi solid bersama seluruh Kuasa Pengguna Anggaran membuahkan deretan prestasi membanggakan bagi KPPN Tipe A1 Semarang I di kancah regional maupun nasional.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-300 space-y-1">
              <span className="font-black text-amber-950 block text-xs">🏆 Predikat Wilayah Bebas dari Korupsi (WBK)</span>
              <p className="text-[11px] text-amber-900">Penetapan resmi Kementerian PAN-RB atas komitmen integritas dan pelayanan tanpa pungutan.</p>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-300 space-y-1">
              <span className="font-black text-indigo-950 block text-xs">🥇 Kinerja Pelayanan Publik Terbaik (Kemenkeu)</span>
              <p className="text-[11px] text-indigo-900">Peringkat 1 Unit Pelayanan Publik Kategori KPPN Tipe A1 Lingkup Kanwil DJPb Jawa Tengah.</p>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-300 space-y-1">
              <span className="font-black text-emerald-950 block text-xs">🎖️ Ketepatan Penyaluran TKD Terbaik</span>
              <p className="text-[11px] text-emerald-900">Apresiasi Dirjen Perbendaharaan atas kecepatan dan akurasi transfer dana bagi hasil &amp; DAU Pemda.</p>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-300 space-y-1">
              <span className="font-black text-purple-950 block text-xs">⭐ Kepatuhan LHKPN &amp; LHKASN 100%</span>
              <p className="text-[11px] text-purple-900">Pelaporan harta kekayaan aparatur negara secara lengkap dan tepat waktu sebelum batas akhir.</p>
            </div>
          </div>
        </div>

        <div className={formatTheme.footerClass}>
          Prestasi &amp; Reputasi • KPPN Tipe A1 Semarang I
        </div>
      </div>
    );
  }

  // HALAMAN 50 (ATAU ULTIMATE BACK COVER): KONTAK RESMI & JANJI LAYANAN BEBAS PUNGUTAN (Rp0,-)
  const kontak = buletinConfig.kontakKppn;
  const namaBuletin = buletinConfig.namaBuletin || 'WARTA SEMARANG SATU';

  return (
    <div
      className={`flex-1 flex flex-col justify-between p-8 sm:p-10 bg-gradient-to-br ${formatTheme.coverGradient} text-white relative overflow-hidden min-h-[1050px] shadow-2xl`}
    >
      {/* Background Gedung Kantor */}
      {kontak?.fotoGedungUrl ? (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25 mix-blend-luminosity scale-105 pointer-events-none"
          style={{ backgroundImage: `url(${kontak.fotoGedungUrl})` }}
        />
      ) : (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20 mix-blend-luminosity scale-105 pointer-events-none"
          style={{ backgroundImage: `url(${OFFICIAL_PRESET_IMAGES.gedungKppn})` }}
        />
      )}

      {/* Top Section */}
      <div className="relative z-10 text-center space-y-2 border-b border-white/20 pb-5">
        <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 font-black flex items-center justify-center mx-auto text-lg shadow-lg">
          026
        </div>
        <h2 className="text-2xl font-serif font-black uppercase text-white tracking-wide">
          {namaBuletin}
        </h2>
        <p className="text-xs text-amber-200 font-light italic">
          Media Informasi, Publikasi &amp; Analisis Fiskal Resmi KPPN Tipe A1 Semarang I
        </p>
      </div>

      {/* Center Contact & Address Card */}
      <div className="relative z-10 max-w-lg mx-auto w-full bg-slate-900/85 backdrop-blur-md p-6 rounded-2xl border border-white/20 space-y-4 shadow-2xl">
        <div className="text-center font-extrabold text-sm uppercase text-amber-300 border-b border-white/10 pb-2">
          Kanal Layanan Terpadu &amp; Janji Layanan Rp0,-
        </div>

        <div className="space-y-2.5 text-xs text-slate-200">
          <div className="flex items-start gap-3">
            <MapPin className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{kontak?.alamat || 'Jl. Pemuda No. 2, Pandansari, Semarang Tengah, Kota Semarang 50139'}</span>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Telepon: {kontak?.telepon || '(024) 3543322'}</span>
          </div>
          <div className="flex items-center gap-3">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-bold text-amber-300">WhatsApp CSO: {kontak?.whatsappHelpdesk || '0812-2828-0260'}</span>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="w-4 h-4 text-blue-400 shrink-0" />
            <span>Email: {kontak?.email || 'kppnsemarang1@kemenkeu.go.id'}</span>
          </div>
          <div className="flex items-center gap-3">
            <Globe className="w-4 h-4 text-purple-400 shrink-0" />
            <span>Website: {kontak?.website || 'djpb.kemenkeu.go.id/kppn/semarang1'}</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-amber-400/10 border border-amber-400/30 text-[11px] text-amber-200 text-center font-medium">
          ⚖️ Seluruh pelayanan pencairan dana, konsultasi SAKTI, dan penerbitan SP2D di KPPN Semarang I tidak dipungut biaya (*Rp0,- / Bebas Gratifikasi*).
        </div>
      </div>

      {/* Bottom Barcode & Copyright */}
      <div className="relative z-10 border-t border-white/20 pt-4 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div>
          <div className="font-mono text-[10px] text-amber-300 font-bold uppercase">
            HAK CIPTA DILINDUNGI UNDANG-UNDANG
          </div>
          <div className="text-[11px] text-slate-300">
            Diterbitkan oleh Seksi MSKI KPPN Semarang I © 2026
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] text-slate-300 font-mono">PORTAL RESMI DJPB</div>
            <div className="font-mono font-bold text-amber-300 text-xs">kemenkeu.go.id</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-white p-1 flex items-center justify-center shadow">
            <QrCode className="w-full h-full text-slate-950" />
          </div>
        </div>
      </div>
    </div>
  );
};
