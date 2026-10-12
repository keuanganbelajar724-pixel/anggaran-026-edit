import React, { useState } from 'react';
import { 
  AlertTriangle, 
  X, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  FileText, 
  ShieldAlert, 
  HelpCircle, 
  Copy, 
  ExternalLink,
  Search,
  Filter,
  Sparkles
} from 'lucide-react';
import { 
  REJECTED_SPM_RULES, 
  FIXED_REJECTED_SPM_SCHEDULE, 
  calculateRejectedSpmDeadline,
  FixedRejectedSpmEventDef 
} from '../../utils/llatRejectedSpmEngine';

interface LLATRejectedSpmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDate?: (dateStr: string) => void;
}

export const LLATRejectedSpmModal: React.FC<LLATRejectedSpmModalProps> = ({
  isOpen,
  onClose,
  onSelectDate
}) => {
  const [activeTab, setActiveTab] = useState<'jadwal_pasti' | 'kalkulator'>('jadwal_pasti');
  
  // States for Calculator
  const [selectedRuleId, setSelectedRuleId] = useState<string>('pasal-19');
  const [tanggalDitolak, setTanggalDitolak] = useState<string>('2026-10-12');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // States for Schedule Filtering
  const [scheduleFilter, setScheduleFilter] = useState<'ALL' | '2026-10' | '2026-11' | '2026-12' | '2027-01'>('ALL');
  const [hkRuleFilter, setHkRuleFilter] = useState<'ALL' | '1_HK' | '2_HK'>('ALL');
  const [searchSchedule, setSearchSchedule] = useState<string>('');

  if (!isOpen) return null;

  // Run calculation
  const calcResult = calculateRejectedSpmDeadline(selectedRuleId, tanggalDitolak);

  // Filter schedule items
  const filteredSchedule = FIXED_REJECTED_SPM_SCHEDULE.filter((item) => {
    if (scheduleFilter !== 'ALL' && !item.tanggalBatas.startsWith(scheduleFilter)) {
      return false;
    }
    if (hkRuleFilter !== 'ALL' && item.hkRule !== hkRuleFilter) {
      return false;
    }
    if (searchSchedule.trim()) {
      const q = searchSchedule.toLowerCase();
      return (
        item.jenisSpm.toLowerCase().includes(q) ||
        item.pasal.toLowerCase().includes(q) ||
        item.deskripsi.toLowerCase().includes(q) ||
        item.tanggalBatas.includes(q) ||
        item.hkLabel.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCopySummary = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(id);
    setTimeout(() => setCopyFeedback(null), 2500);
  };

  const formatIndonesianDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100">
        
        {/* HEADER */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-rose-900 via-red-900 to-slate-900 text-white flex items-start justify-between gap-4 border-b border-rose-800/40">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-2xl bg-rose-500/20 border border-rose-400/30 text-rose-300">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-rose-500/30 text-rose-200 border border-rose-400/40">
                  Resmi PER-9/PB/2026
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/30 text-amber-200 border border-amber-400/40">
                  Pasal 9 • 12 • 15 • 17 • 19 • 24 • 28
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
                Batas Waktu Pengajuan Kembali SPM yang Ditolak KPPN
              </h2>
              <p className="text-xs text-rose-100/80 mt-1 max-w-2xl leading-relaxed">
                Panduan tanggal pasti dan kalkulator hitung hari kerja untuk perbaikan SPM dan/atau data supplier yang ditolak KPPN agar tidak terlewat dari tenggat akhir tahun anggaran.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-rose-200 hover:text-white hover:bg-white/10 transition-colors"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TAB NAVIGATION */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-5 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('jadwal_pasti')}
            className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 border-b-2 ${
              activeTab === 'jadwal_pasti'
                ? 'border-rose-600 text-rose-600 dark:text-rose-400 bg-white dark:bg-slate-900 shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Matriks Tanggal Pasti Regulasi ({FIXED_REJECTED_SPM_SCHEDULE.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('kalkulator')}
            className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 border-b-2 ${
              activeTab === 'kalkulator'
                ? 'border-rose-600 text-rose-600 dark:text-rose-400 bg-white dark:bg-slate-900 shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Kalkulator Tanggal Penolakan Satker</span>
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">

          {/* ALERT PERSYARATAN WAJIB */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-black text-amber-800 dark:text-amber-300">
                SYARAT WAJIB REGULASI SEMUA PENGAJUAN KEMBALI SPM DITOLAK:
              </p>
              <p className="text-amber-700 dark:text-amber-300/90 leading-relaxed">
                Satker <span className="font-bold underline">wajib melampirkan bukti penolakan SPM dari KPPN</span> saat mengajukan kembali perbaikan SPM dan/atau data supplier. SP2D atas perbaikan SPM diselesaikan KPPN paling lambat pada Hari Kerja berikutnya setelah perbaikan diterima secara lengkap dan benar.
              </p>
            </div>
          </div>

          {/* TAB 1: MATRIKS TANGGAL PASTI */}
          {activeTab === 'jadwal_pasti' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    Daftar Batas Waktu Pengajuan Kembali SPM Berdasarkan PER-9/PB/2026
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Klik baris atau tanggal untuk langsung menandai di kalender LLAT
                  </p>
                </div>

                {/* Filter Bulan & Pencarian */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Cari jenis SPM / pasal..."
                      value={searchSchedule}
                      onChange={(e) => setSearchSchedule(e.target.value)}
                      className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:ring-2 focus:ring-rose-500 outline-none w-44"
                    />
                  </div>

                  {/* Filter Bulan */}
                  <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-0.5 text-xs font-bold">
                    <button
                      onClick={() => setScheduleFilter('ALL')}
                      className={`px-2 py-1 rounded-lg transition-colors ${
                        scheduleFilter === 'ALL' ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-white shadow-xs font-black' : 'text-slate-500'
                      }`}
                    >
                      Semua Bulan
                    </button>
                    <button
                      onClick={() => setScheduleFilter('2026-10')}
                      className={`px-2 py-1 rounded-lg transition-colors ${
                        scheduleFilter === '2026-10' ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-white shadow-xs font-black' : 'text-slate-500'
                      }`}
                    >
                      Okt 2026
                    </button>
                    <button
                      onClick={() => setScheduleFilter('2026-11')}
                      className={`px-2 py-1 rounded-lg transition-colors ${
                        scheduleFilter === '2026-11' ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-white shadow-xs font-black' : 'text-slate-500'
                      }`}
                    >
                      Nov 2026
                    </button>
                    <button
                      onClick={() => setScheduleFilter('2026-12')}
                      className={`px-2 py-1 rounded-lg transition-colors ${
                        scheduleFilter === '2026-12' ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-white shadow-xs font-black' : 'text-slate-500'
                      }`}
                    >
                      Des 2026
                    </button>
                    <button
                      onClick={() => setScheduleFilter('2027-01')}
                      className={`px-2 py-1 rounded-lg transition-colors ${
                        scheduleFilter === '2027-01' ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-white shadow-xs font-black' : 'text-slate-500'
                      }`}
                    >
                      Jan 2027
                    </button>
                  </div>

                  {/* Filter Aturan Hari Kerja (1 HK vs 2 HK) */}
                  <div className="flex items-center rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/70 dark:bg-rose-950/40 p-0.5 text-xs font-bold">
                    <button
                      onClick={() => setHkRuleFilter('ALL')}
                      className={`px-2 py-1 rounded-lg transition-colors ${
                        hkRuleFilter === 'ALL' ? 'bg-rose-600 text-white shadow-xs font-black' : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Semua Aturan
                    </button>
                    <button
                      onClick={() => setHkRuleFilter('1_HK')}
                      className={`px-2 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                        hkRuleFilter === '1_HK' ? 'bg-rose-600 text-white shadow-xs font-black' : 'text-rose-700 dark:text-rose-300'
                      }`}
                      title="Aturan penolakan yang wajib diajukan kembali 1 Hari Kerja berikutnya (Kritis di Desember)"
                    >
                      <span>⚡ 1 HK</span>
                    </button>
                    <button
                      onClick={() => setHkRuleFilter('2_HK')}
                      className={`px-2 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                        hkRuleFilter === '2_HK' ? 'bg-amber-600 text-white shadow-xs font-black' : 'text-amber-800 dark:text-amber-300'
                      }`}
                      title="Aturan penolakan standar 2 Hari Kerja berikutnya"
                    >
                      <span>⏱️ 2 HK</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Table Matrix */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-black border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="py-3 px-3.5">Pasal &amp; Jenis SPM</th>
                        <th className="py-3 px-3.5">Kondisi / Tgl Penolakan KPPN</th>
                        <th className="py-3 px-3.5 bg-rose-500/10 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300">
                          Batas Pengajuan Kembali
                        </th>
                        <th className="py-3 px-3.5">Aturan Waktu</th>
                        <th className="py-3 px-3.5">Penyelesaian SP2D</th>
                        <th className="py-3 px-3.5 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredSchedule.map((item) => {
                        const copyText = `${item.pasal} ${item.ayat}: ${item.jenisSpm}. Batas Pengajuan Kembali: ${formatIndonesianDate(item.tanggalBatas)} pukul ${item.jamBatas} WIB [${item.hkLabel}]. ${item.deskripsi}`;
                        const is1HK = item.hkRule === '1_HK';
                        return (
                          <tr 
                            key={item.id}
                            className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors ${
                              is1HK ? 'bg-rose-500/3' : ''
                            }`}
                          >
                            <td className="py-3 px-3.5 align-top">
                              <div className="font-black text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                                <span>{item.jenisSpm}</span>
                                {is1HK && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-600 text-white animate-pulse">
                                    ⚡ 1 HK
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-rose-600 dark:text-rose-400 font-bold mt-0.5">
                                {item.pasal} {item.ayat}
                              </div>
                            </td>
                            <td className="py-3 px-3.5 align-top">
                              <span className="font-semibold text-slate-700 dark:text-slate-300">
                                {item.kondisiPenolakan}
                              </span>
                            </td>
                            <td className="py-3 px-3.5 align-top bg-rose-500/5 dark:bg-rose-500/10 font-bold text-slate-900 dark:text-white">
                              <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-300 font-black">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>{formatIndonesianDate(item.tanggalBatas)}</span>
                              </div>
                              <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                <Clock className="w-3 h-3 text-amber-500" />
                                <span>Pukul {item.jamBatas} WIB</span>
                              </div>
                            </td>
                            <td className="py-3 px-3.5 align-top">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black ${
                                is1HK
                                  ? 'bg-rose-600 text-white shadow-xs animate-pulse'
                                  : item.hkRule === '2_HK'
                                  ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700'
                                  : 'bg-blue-100 dark:bg-blue-900/60 text-blue-900 dark:text-blue-200 border border-blue-300 dark:border-blue-700'
                              }`}>
                                {item.hkLabel}
                              </span>
                            </td>
                            <td className="py-3 px-3.5 align-top text-slate-600 dark:text-slate-400 text-[11px]">
                              Hari Kerja berikutnya setelah perbaikan lengkap
                            </td>
                            <td className="py-3 px-3.5 align-top text-center">
                              <div className="flex items-center justify-center gap-1">
                                {onSelectDate && (
                                  <button
                                    onClick={() => {
                                      onSelectDate(item.tanggalBatas);
                                      onClose();
                                    }}
                                    className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/30 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 text-[10px] font-bold"
                                    title="Lihat di Kalender"
                                  >
                                    Kalender
                                  </button>
                                )}
                                <button
                                  onClick={() => handleCopySummary(copyText, item.id)}
                                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                                  title="Salin Rangkuman"
                                >
                                  {copyFeedback === item.id ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: KALKULATOR TANGGAL PENOLAKAN */}
          {activeTab === 'kalkulator' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Pilih Jenis SPM */}
                <div className="md:col-span-7 space-y-1.5">
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                    Pilih Jenis SPM / Pasal Regulasi
                  </label>
                  <select
                    value={selectedRuleId}
                    onChange={(e) => setSelectedRuleId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-none"
                  >
                    {REJECTED_SPM_RULES.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.pasal} {r.ayat ? `(${r.ayat})` : ''} - {r.namaSpm}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {REJECTED_SPM_RULES.find(r => r.id === selectedRuleId)?.deskripsiAturan}
                  </p>
                </div>

                {/* Input Tanggal Penolakan KPPN */}
                <div className="md:col-span-5 space-y-1.5">
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                    Tanggal SPM Ditolak oleh KPPN
                  </label>
                  <input
                    type="date"
                    value={tanggalDitolak}
                    onChange={(e) => setTanggalDitolak(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Format: YYYY-MM-DD</span>
                    <button
                      type="button"
                      onClick={() => setTanggalDitolak(new Date().toISOString().split('T')[0])}
                      className="text-rose-600 dark:text-rose-400 font-bold hover:underline"
                    >
                      Hari Ini
                    </button>
                  </div>
                </div>
              </div>

              {/* CARD HASIL PERHITUNGAN */}
              <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-rose-500/10 via-amber-500/10 to-indigo-500/10 border-2 border-rose-300 dark:border-rose-700/60 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rose-200 dark:border-rose-800/60 pb-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">
                      Hasil Kalkulasi Batas Pengajuan Kembali
                    </span>
                    <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-0.5">
                      {calcResult.rule.namaSpm}
                    </h4>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-xs font-black tracking-wide inline-flex items-center gap-1.5 ${calcResult.statusBadgeColor}`}>
                    <Clock className="w-3.5 h-3.5" />
                    {calcResult.sisaHari === 0 && 'DEADLINE HARI INI'}
                    {calcResult.sisaHari > 0 && `${calcResult.sisaHari} Hari Tersisa`}
                    {calcResult.sisaHari < 0 && `Terlewat ${Math.abs(calcResult.sisaHari)} Hari`}
                  </span>
                </div>

                {/* Aturan Waktu Banner (1 HK vs 2 HK) */}
                <div className={`p-3 rounded-2xl flex items-center justify-between gap-2 border text-xs font-bold ${
                  calcResult.hkRule === '1_HK'
                    ? 'bg-rose-600 text-white border-rose-500 shadow-sm animate-pulse'
                    : calcResult.hkRule === '2_HK'
                    ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-950 dark:text-amber-200 border-amber-300 dark:border-amber-700'
                    : 'bg-blue-100 dark:bg-blue-950/80 text-blue-950 dark:text-blue-200 border-blue-300 dark:border-blue-700'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className="text-base">{calcResult.hkRule === '1_HK' ? '⚡' : '⏱️'}</span>
                    <span>Norma Waktu Regulasi: <strong>{calcResult.hkRuleLabel}</strong></span>
                  </div>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-black/20">
                    {calcResult.rule.pasal}
                  </span>
                </div>

                {/* Big Deadline Box */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-800/80 shadow-sm space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                      Batas Waktu Pengajuan Kembali:
                    </span>
                    <div className="text-base sm:text-lg font-black text-rose-600 dark:text-rose-400 flex items-center gap-2">
                      <Calendar className="w-5 h-5 shrink-0" />
                      <span>{formatIndonesianDate(calcResult.tanggalBatasPengajuan)}</span>
                    </div>
                    <div className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Paling lambat pukul {calcResult.jamBatasPengajuan} WIB</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                      Penyelesaian SP2D oleh KPPN:
                    </span>
                    <div className="text-sm font-black text-slate-900 dark:text-white">
                      {calcResult.batasSp2d}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Diterbitkan setelah perbaikan SPM diterima lengkap dan benar oleh KPPN.
                    </p>
                  </div>
                </div>

                {/* Legal Note & Rules */}
                <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 text-xs space-y-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">Alasan / Dasar Perhitungan: </span>
                      <span className="text-slate-600 dark:text-slate-300">{calcResult.alasanPenetapan}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 pt-1 border-t border-slate-100 dark:border-slate-700/50">
                    <FileText className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">Kutipan Pasal PER-9/PB/2026: </span>
                      <span className="text-slate-600 dark:text-slate-300 italic">{calcResult.kutipanResmi}</span>
                    </div>
                  </div>
                </div>

                {/* Copy Button */}
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => {
                      const text = `RANGKUMAN BATAS PENGAJUAN KEMBALI SPM DITOLAK:
• Jenis SPM: ${calcResult.rule.namaSpm} (${calcResult.rule.pasal})
• Tanggal Ditolak KPPN: ${calcResult.tanggalDitolak}
• BATAS PENGAJUAN KEMBALI: ${formatIndonesianDate(calcResult.tanggalBatasPengajuan)} Pukul ${calcResult.jamBatasPengajuan} WIB
• Syarat: Wajib melampirkan bukti penolakan SPM dari KPPN
• Penyelesaian SP2D: ${calcResult.batasSp2d}
• Dasar Regulasi: ${calcResult.kutipanResmi}`;
                      handleCopySummary(text, 'calc-summary');
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs hover:bg-slate-800 transition-colors flex items-center gap-2"
                  >
                    {copyFeedback === 'calc-summary' ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Tersalin ke Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Salin Rangkuman untuk Satker</span>
                      </>
                    )}
                  </button>

                  {onSelectDate && (
                    <button
                      onClick={() => {
                        onSelectDate(calcResult.tanggalBatasPengajuan);
                        onClose();
                      }}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs transition-colors flex items-center gap-1.5"
                    >
                      <Calendar className="w-4 h-4" />
                      <span>Buka di Kalender</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>KPPN Semarang I • Satker LLAT 2026</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold transition-colors"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
