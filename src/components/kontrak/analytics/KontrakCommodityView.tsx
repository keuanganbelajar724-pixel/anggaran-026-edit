import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  CheckCircle2,
  ChevronRight,
  DollarSign,
  Download,
  Filter,
  Layers,
  PieChart as PieChartIcon,
  Search,
  Sparkles,
  Tag
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { KontrakMonitoringRecord } from '../../../types';
import {
  CommodityCategoryItem,
  computeCommodityIntelligence,
  formatNumber,
  formatRupiah
} from '../../../utils/kontrakCalculations';

interface KontrakCommodityViewProps {
  records: KontrakMonitoringRecord[];
  isDark?: boolean;
}

export const KontrakCommodityView: React.FC<KontrakCommodityViewProps> = ({
  records,
  isDark = false
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const commodityList: CommodityCategoryItem[] = useMemo(() => {
    return computeCommodityIntelligence(records);
  }, [records]);

  // Chart data: Top nominal
  const chartDataNominal = useMemo(() => {
    return commodityList.slice(0, 8).map(c => ({
      name: c.name,
      icon: c.icon,
      Pagu: c.totalNilai / 1000000000, // in Billions
      Pembayaran: c.totalPembayaran / 1000000000,
      serapan: c.persenSerapan,
      color: c.color
    }));
  }, [commodityList]);

  // Chart data: Donut distribution
  const chartDataPie = useMemo(() => {
    return commodityList.slice(0, 7).map(c => ({
      name: `${c.icon} ${c.name}`,
      totalNilai: c.totalNilai,
      count: c.count,
      color: c.color
    }));
  }, [commodityList]);

  // Filtered contracts
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          r.nomor_kontrak.toLowerCase().includes(q) ||
          r.kode_satker.toLowerCase().includes(q) ||
          r.deskripsi_satker.toLowerCase().includes(q) ||
          r.nama_supplier.toLowerCase().includes(q) ||
          r.uraian_kontrak.toLowerCase().includes(q);
        if (!match) return false;
      }

      // Category filter
      if (selectedCategory !== 'ALL') {
        const text = `${r.uraian_kontrak || ''} ${r.detail_barang_jasa || ''}`.toLowerCase();
        const coa = (r.kode_coa || '').trim();

        if (selectedCategory === 'konstruksi') {
          return /gedung|bangunan|renovasi|rehab|jalan|jembatan|pagar|ruang|fisik|konstruksi|saluran|drainase|atap|paving|pondasi|semen|cor/i.test(text) || coa.startsWith('53');
        }
        if (selectedCategory === 'ti') {
          return /software|server|komputer|laptop|internet|jaringan|lan|wifi|lisensi|aplikasi|hosting|domain|printer|scanner|hardware|cctv|komputasi|cloud/i.test(text);
        }
        if (selectedCategory === 'kebersihan') {
          return /cleaning|kebersihan|security|keamanan|satpam|pramubakti|pengamanan|taman|cleaning service|gardener/i.test(text);
        }
        if (selectedCategory === 'transportasi') {
          return /kendaraan|mobil|motor|sewa mobil|rental|transport|bus|sopir|driver|angkutan|tiket|bbm/i.test(text);
        }
        if (selectedCategory === 'konsumsi') {
          return /makan|snack|konsumsi|katering|catering|jamuan|prasmanan|hotel|akomodasi|paket meeting/i.test(text);
        }
        if (selectedCategory === 'atk') {
          return /atk|alat tulis|kertas|cetak|percetakan|buku|spanduk|banner|brosur|map|amplop|stempel/i.test(text);
        }
        if (selectedCategory === 'medis') {
          return /alkes|medis|obat|reagen|lab|laboratorium|kesehatan|rapid|vaksin|pasien|farmasi|darah/i.test(text);
        }
        if (selectedCategory === 'konsultansi') {
          return /konsultan|supervisi|pengawasan|perencanaan|kajian|narasumber|pelatihan|diklat|kursus|studi|penelitian|audit/i.test(text);
        }
        if (selectedCategory === 'pemeliharaan') {
          return /pemeliharaan|perawatan|servis|service|perbaikan|ac|apar|genset|kalibrasi/i.test(text);
        }
      }

      return true;
    });
  }, [records, selectedCategory, searchQuery]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* BANNER HEADER */}
      <div
        className={`p-5 rounded-3xl border shadow-sm ${
          isDark
            ? 'bg-gradient-to-r from-slate-900 via-teal-950/40 to-slate-900 border-teal-900/60'
            : 'bg-gradient-to-r from-teal-50/70 via-white to-blue-50/70 border-teal-200/80 shadow-teal-500/5'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/20 shrink-0">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                  Intelligence Komoditas &amp; Klasifikasi Jenis Belanja Pengadaan
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                  SMART CLASSIFICATION
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pengelompokan otomatis berdasarkan teks uraian kontrak, spesifikasi detail barang/jasa, dan bagan akun standar (COA).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-700 dark:text-slate-300">
              {commodityList.length} Sektor Komoditas
            </span>
          </div>
        </div>
      </div>

      {/* 2 CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Bar Chart Belanja per Sektor */}
        <div
          className={`p-5 rounded-3xl border shadow-sm ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <h4 className="font-extrabold text-xs sm:text-sm mb-1 flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-teal-600" />
            <span>Pagu Belanja Pengadaan per Sektor Komoditas (Miliar Rp)</span>
          </h4>
          <p className="text-[11px] text-slate-400 mb-4">
            Total nilai komitmen kontraktual berdasarkan jenis komoditas
          </p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartDataNominal}
                layout="vertical"
                margin={{ left: 20, right: 30, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis type="number" fontSize={11} tickFormatter={v => `${v}M`} />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={150}
                  fontSize={10}
                  tickFormatter={val => (val.length > 20 ? val.slice(0, 18) + '..' : val)}
                />
                <Tooltip
                  formatter={(val: any, name: string) => [
                    `${formatRupiah(val * 1000000000)}`,
                    name
                  ]}
                  contentStyle={{ borderRadius: '12px', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="Pagu" fill="#0d9488" radius={[0, 6, 6, 0]} />
                <Bar dataKey="Pembayaran" fill="#10b981" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Proporsi Nilai Komoditas */}
        <div
          className={`p-5 rounded-3xl border shadow-sm ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <h4 className="font-extrabold text-xs sm:text-sm mb-1 flex items-center gap-1.5">
            <PieChartIcon className="w-4 h-4 text-teal-600" />
            <span>Komposisi Persentase Sektor Belanja</span>
          </h4>
          <p className="text-[11px] text-slate-400 mb-4">
            Proporsi nilai belanja kontraktual antar komoditas utama
          </p>
          <div className="h-72 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartDataPie}
                  dataKey="totalNilai"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={2}
                >
                  {chartDataPie.map((entry, index) => (
                    <Cell key={`pie-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any, name: string) => [
                    `${formatRupiah(val)}`,
                    name
                  ]}
                  contentStyle={{ borderRadius: '12px', fontSize: '11px' }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '10px' }}
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* GRID SEKTOR KOMODITAS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {commodityList.map(cat => (
          <div
            key={cat.id}
            onClick={() => setSelectedCategory(selectedCategory === cat.id ? 'ALL' : cat.id)}
            className={`p-4 rounded-3xl border shadow-sm transition-all cursor-pointer hover:shadow-md ${
              selectedCategory === cat.id
                ? 'ring-2 ring-teal-500 bg-teal-50/50 dark:bg-teal-950/30 border-teal-300 dark:border-teal-800'
                : isDark
                ? 'bg-slate-900 border-slate-800 hover:border-slate-700'
                : 'bg-white border-slate-200 hover:border-teal-200'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">{cat.icon}</span>
                <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                  {cat.name}
                </span>
              </div>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {formatNumber(cat.count)} ktr
              </span>
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Total Nilai:</span>
                <strong className="font-mono text-slate-800 dark:text-slate-200">
                  {formatRupiah(cat.totalNilai)}
                </strong>
              </div>

              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Realisasi:</span>
                <strong className="font-mono text-emerald-600 dark:text-emerald-400">
                  {formatRupiah(cat.totalPembayaran)} ({cat.persenSerapan.toFixed(1)}%)
                </strong>
              </div>

              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Sisa Kontrak:</span>
                <strong className="font-mono text-amber-600 dark:text-amber-400">
                  {formatRupiah(cat.totalSisa)}
                </strong>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mt-2">
                <div
                  style={{ width: `${Math.min(100, cat.persenSerapan)}%`, backgroundColor: cat.color }}
                  className="h-full rounded-full transition-all"
                />
              </div>

              {/* Sample uraian */}
              {cat.samples.length > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 line-clamp-2 italic">
                  &ldquo;{cat.samples[0]}&rdquo;
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* TABLE OF CONTRACTS FOR SELECTED COMMODITY */}
      <div
        className={`p-5 rounded-3xl border shadow-sm space-y-4 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Tag className="w-5 h-5 text-teal-600" />
              <span>
                Daftar Kontrak Sektor:{' '}
                {selectedCategory === 'ALL'
                  ? 'Semua Sektor Komoditas'
                  : commodityList.find(c => c.id === selectedCategory)?.name}{' '}
                ({filteredRecords.length} Kontrak)
              </span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Menampilkan rincian paket pengadaan berdasarkan klasifikasi komoditas.
            </p>
          </div>

          {/* Quick Search */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari dalam komoditas..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-extrabold border-b border-slate-200 dark:border-slate-700">
                <th className="p-3 w-10 text-center">#</th>
                <th className="p-3">Satker &amp; No. Kontrak</th>
                <th className="p-3">Uraian / Detail Barang Jasa</th>
                <th className="p-3">Penyedia / Supplier</th>
                <th className="p-3 text-right">Nilai Kontrak</th>
                <th className="p-3 text-right">Pembayaran</th>
                <th className="p-3 text-right">Sisa Kontrak</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredRecords.slice(0, 50).map((r, idx) => {
                const serapan = r.nilai_kontrak > 0 ? (r.nilai_pembayaran / r.nilai_kontrak) * 100 : 0;
                return (
                  <tr
                    key={`${r.kode_satker}-${r.nomor_kontrak}-${idx}`}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="p-3 text-center text-slate-400 font-mono text-[11px]">
                      {idx + 1}
                    </td>

                    <td className="p-3 max-w-xs">
                      <div className="font-bold text-slate-900 dark:text-white truncate">
                        {r.deskripsi_satker}
                      </div>
                      <div className="font-mono text-[11px] text-slate-500 truncate">
                        {r.kode_satker} • No: {r.nomor_kontrak}
                      </div>
                    </td>

                    <td className="p-3 max-w-sm">
                      <div className="text-slate-800 dark:text-slate-200 font-semibold line-clamp-2">
                        {r.uraian_kontrak}
                      </div>
                      {r.detail_barang_jasa && (
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">
                          Spesifikasi: {r.detail_barang_jasa}
                        </div>
                      )}
                    </td>

                    <td className="p-3 max-w-[180px]">
                      <div className="font-bold text-slate-800 dark:text-slate-200 truncate">
                        {r.nama_supplier}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        COA: {r.kode_coa}
                      </div>
                    </td>

                    <td className="p-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      {formatRupiah(r.nilai_kontrak)}
                    </td>

                    <td className="p-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      {formatRupiah(r.nilai_pembayaran)}
                      <span className="text-[10px] block text-slate-400 font-normal">
                        {serapan.toFixed(1)}%
                      </span>
                    </td>

                    <td className="p-3 text-right font-mono font-bold text-amber-600 dark:text-amber-400 whitespace-nowrap">
                      {formatRupiah(r.sisa_kontrak)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
