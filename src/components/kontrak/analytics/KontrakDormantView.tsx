import React, { useMemo, useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  Clock,
  Copy,
  DollarSign,
  Download,
  Filter,
  Ghost,
  Info,
  Search,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { KontrakMonitoringRecord } from '../../../types';
import {
  computeDormantContracts,
  DormantContractItem,
  formatNumber,
  formatRupiah
} from '../../../utils/kontrakCalculations';

interface KontrakDormantViewProps {
  records: KontrakMonitoringRecord[];
  isDark?: boolean;
}

export const KontrakDormantView: React.FC<KontrakDormantViewProps> = ({
  records,
  isDark = false
}) => {
  const [tierFilter, setTierFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const dormant = useMemo(() => {
    return computeDormantContracts(records);
  }, [records]);

  // Filtered records
  const filteredList = useMemo(() => {
    return dormant.dormantRecords.filter(item => {
      if (tierFilter !== 'ALL' && item.riskTier !== tierFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const r = item.record;
        const match =
          r.nomor_kontrak.toLowerCase().includes(q) ||
          r.kode_satker.toLowerCase().includes(q) ||
          r.deskripsi_satker.toLowerCase().includes(q) ||
          r.nama_supplier.toLowerCase().includes(q) ||
          r.uraian_kontrak.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [dormant, tierFilter, searchQuery]);

  const handleCopyWa = (item: DormantContractItem, index: number) => {
    const r = item.record;
    let urgencyBadge = '';
    if (item.riskTier === 'HIGH') {
      urgencyBadge = `🚨 KRITIS (> 60 HARI SEJAK MULAI)`;
    } else if (item.riskTier === 'MEDIUM') {
      urgencyBadge = `⚠️ WASPADA (31 - 60 HARI SEJAK MULAI)`;
    } else {
      urgencyBadge = `⏳ PEMANTAUAN AWAL (< 30 HARI SEJAK MULAI)`;
    }

    const text =
      `*PEMBERITAHUAN MONITORING KONTRAK NOL REALISASI (DORMAN)*\n` +
      `*KPPN 026 SEMARANG I*\n\n` +
      `Kepada Yth. PPK Satker: *${r.deskripsi_satker}* (${r.kode_satker})\n\n` +
      `Berdasarkan data sistem SPAN/SAKTI, terdeteksi kontrak berikut *BELUM ADA REALISASI PEMBAYARAN (Rp 0)* meskipun masa pelaksanaan telah berjalan:\n` +
      `• *Status:* ${urgencyBadge}\n` +
      `• *Masa Berjalan:* Telah berjalan *${item.daysSinceStart} hari* sejak tanggal mulai (${r.tanggal_mulai})\n` +
      `• *Nomor Kontrak:* ${r.nomor_kontrak}\n` +
      `• *Rekanan/Supplier:* ${r.nama_supplier}\n` +
      `• *Nilai Kontrak:* *${formatRupiah(r.nilai_kontrak)}*\n` +
      `• *Tanggal Selesai:* ${r.tanggal_selesai}\n` +
      `• *Uraian:* ${r.uraian_kontrak}\n\n` +
      `Mohon konfirmasi perkembangan pelaksanaan fisik/serah terima pekerjaan (BAST) dan segera mengajukan SPM pencairan termin/pembayaran kontraktual guna menghindari penumpukan SPM di akhir tahun.\n\n` +
      `_Seksi Manajemen Satker & Kepatuhan Internal - KPPN Semarang I._`;

    navigator.clipboard.writeText(text);
    setCopiedIdx(index);
    setTimeout(() => setCopiedIdx(null), 2500);
  };

  const handleExportCsv = () => {
    const headers = [
      'No',
      'Kode Satker',
      'Nama Satker',
      'Nomor Kontrak',
      'Supplier',
      'Tanggal Mulai',
      'Tanggal Selesai',
      'Hari Sejak Mulai',
      'Tingkat Risiko Dorman',
      'Nilai Kontrak',
      'Uraian Kontrak'
    ];

    const rows = filteredList.map((item, idx) => {
      const r = item.record;
      return [
        idx + 1,
        `"${r.kode_satker}"`,
        `"${r.deskripsi_satker.replace(/"/g, '""')}"`,
        `"${r.nomor_kontrak.replace(/"/g, '""')}"`,
        `"${r.nama_supplier.replace(/"/g, '""')}"`,
        r.tanggal_mulai,
        r.tanggal_selesai,
        item.daysSinceStart,
        item.riskTier,
        r.nilai_kontrak,
        `"${r.uraian_kontrak.replace(/"/g, '""')}"`
      ].join(';');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Kontrak_Dorman_Nol_Realisasi_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* BANNER HEADER */}
      <div
        className={`p-5 rounded-3xl border shadow-sm ${
          isDark
            ? 'bg-gradient-to-r from-slate-900 via-rose-950/40 to-slate-900 border-rose-900/60'
            : 'bg-gradient-to-r from-rose-50/70 via-white to-amber-50/70 border-rose-200/80 shadow-rose-500/5'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-600/20 shrink-0">
              <Ghost className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                  Deteksi Kontrak Dorman (Zero Disbursement / Nol Realisasi Pembayaran)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                  RED FLAG FISKAL
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Identifikasi dini paket kontrak yang tanggal mulainya sudah berjalan namun belum ada realisasi pembayaran (SP2D Rp 0). Sangat berisiko memicu keterlambatan atau gagal serap.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-700 dark:text-slate-300">
              {formatNumber(dormant.totalDormant)} Kontrak Terdeteksi
            </span>
          </div>
        </div>
      </div>

      {/* 4 SCORECARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Kontrak Dorman */}
        <div
          className={`p-4 sm:p-5 rounded-3xl border shadow-sm transition-all hover:scale-[1.01] ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">TOTAL KONTRAK DORMAN</span>
            <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600">
              <Ghost className="w-4 h-4" />
            </div>
          </div>
          <strong className="text-2xl sm:text-3xl font-mono font-black text-rose-600 dark:text-rose-400 block">
            {formatNumber(dormant.totalDormant)}
          </strong>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Kontrak bernilai tanpa ada pencairan (0%)
          </span>
        </div>

        {/* Card 2: Total Nilai Terkunci */}
        <div
          className={`p-4 sm:p-5 rounded-3xl border shadow-sm transition-all hover:scale-[1.01] ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">NILAI DANA TERKUNCI</span>
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <strong className="text-xl sm:text-2xl font-mono font-black text-amber-600 dark:text-amber-400 block truncate">
            {formatRupiah(dormant.totalDormantNilai)}
          </strong>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Alokasi dana kontraktual belum terserap
          </span>
        </div>

        {/* Card 3: Dorman Kritis > 60 Hari */}
        <div
          className={`p-4 sm:p-5 rounded-3xl border shadow-sm transition-all hover:scale-[1.01] ${
            isDark ? 'bg-slate-900 border-rose-950' : 'bg-white border-rose-200'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600">KRITIS &gt; 60 HARI</span>
            <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <strong className="text-2xl sm:text-3xl font-mono font-black text-rose-600 block">
            {formatNumber(dormant.countHighRisk)}
          </strong>
          <span className="text-[11px] text-rose-600 font-bold mt-1 block">
            Sudah &gt; 2 bulan tanpa ada pembayaran
          </span>
        </div>

        {/* Card 4: Waspada 31 - 60 Hari */}
        <div
          className={`p-4 sm:p-5 rounded-3xl border shadow-sm transition-all hover:scale-[1.01] ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">WASPADA (31 - 60 HARI)</span>
            <div className="p-2 rounded-xl bg-orange-100 dark:bg-orange-950 text-orange-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <strong className="text-2xl sm:text-3xl font-mono font-black text-orange-600 block">
            {formatNumber(dormant.countMediumRisk)}
          </strong>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Perlu konfirmasi progress fisik &amp; termin
          </span>
        </div>
      </div>

      {/* TABLE */}
      <div
        className={`p-5 rounded-3xl border shadow-sm space-y-4 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-500" />
              <span>Daftar Kontrak Nol Realisasi ({filteredList.length} Kontrak)</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Menampilkan paket pengadaan yang berstatus nol realisasi, diurutkan berdasarkan tingkat risiko dan nilai kontrak.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh CSV</span>
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
            <button
              onClick={() => setTierFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                tierFilter === 'ALL'
                  ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Semua Dorman ({dormant.totalDormant})
            </button>

            <button
              onClick={() => setTierFilter('HIGH')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
                tierFilter === 'HIGH'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100'
              }`}
            >
              <AlertOctagon className="w-3 h-3" />
              <span>Kritis &gt; 60 Hari ({dormant.countHighRisk})</span>
            </button>

            <button
              onClick={() => setTierFilter('MEDIUM')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
                tierFilter === 'MEDIUM'
                  ? 'bg-orange-600 text-white'
                  : 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 hover:bg-orange-100'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>Waspada 31-60 Hari ({dormant.countMediumRisk})</span>
            </button>

            <button
              onClick={() => setTierFilter('LOW')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
                tierFilter === 'LOW'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100'
              }`}
            >
              <span>Baru &lt; 30 Hari ({dormant.countLowRisk})</span>
            </button>
          </div>

          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari satker, supplier, no kontrak..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
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
                <th className="p-3">Rekanan / Supplier</th>
                <th className="p-3">Masa Berjalan Sejak Mulai</th>
                <th className="p-3 text-right">Nilai Kontrak</th>
                <th className="p-3 text-center">Tingkat Risiko</th>
                <th className="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredList.slice(0, 50).map((item, idx) => {
                const r = item.record;
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
                      <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                        {r.uraian_kontrak}
                      </div>
                    </td>

                    <td className="p-3 max-w-[200px]">
                      <div className="font-bold text-slate-800 dark:text-slate-200 truncate">
                        {r.nama_supplier}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        COA: {r.kode_coa}
                      </div>
                    </td>

                    <td className="p-3 whitespace-nowrap">
                      <div className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                        {item.daysSinceStart} Hari Berjalan
                      </div>
                      <span className="text-[10px] text-slate-400 block font-normal">
                        Mulai: {r.tanggal_mulai} • Selesai: {r.tanggal_selesai}
                      </span>
                    </td>

                    <td className="p-3 text-right font-mono font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                      {formatRupiah(r.nilai_kontrak)}
                    </td>

                    <td className="p-3 text-center whitespace-nowrap">
                      {item.riskTier === 'HIGH' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                          <AlertOctagon className="w-3 h-3" />
                          <span>KRITIS &gt; 60 HARI</span>
                        </span>
                      ) : item.riskTier === 'MEDIUM' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300">
                          <Clock className="w-3 h-3" />
                          <span>WASPADA 31-60 HARI</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                          <span>BARU &lt; 30 HARI</span>
                        </span>
                      )}
                    </td>

                    <td className="p-3 text-center whitespace-nowrap">
                      <button
                        onClick={() => handleCopyWa(item, idx)}
                        className="px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-[11px] font-bold transition-all border border-emerald-200 dark:border-emerald-800 cursor-pointer inline-flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copiedIdx === idx ? 'Tersalin!' : 'WA PPK'}</span>
                      </button>
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
