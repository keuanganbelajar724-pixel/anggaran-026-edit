import React, { useState } from 'react';
import { X, BookOpen, Search, ShieldCheck, AlertCircle, FileText, ExternalLink, Check, Copy } from 'lucide-react';
import { KRITERIA_DISPENSASI_ND1423, CATATAN_KAKI_ND1423, IndikatorDispensasiConfig } from '../../data/kriteriaDispensasiData';
import { JenisDispensasiIKPA } from '../../types';

interface KriteriaND1423ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectKriteria?: (jenis: JenisDispensasiIKPA, kriteriaId: string, kriteriaTeks: string) => void;
  isDark?: boolean;
}

export const KriteriaND1423Modal: React.FC<KriteriaND1423ModalProps> = ({
  isOpen,
  onClose,
  onSelectKriteria,
  isDark = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndikatorNo, setSelectedIndikatorNo] = useState<number | 'ALL'>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const filteredIndikators = KRITERIA_DISPENSASI_ND1423.filter(ind => {
    if (selectedIndikatorNo !== 'ALL' && ind.nomor !== selectedIndikatorNo) {
      return false;
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchNama = ind.nama.toLowerCase().includes(q);
    const matchKriteria = ind.kriteria.some(k => k.teks.toLowerCase().includes(q) || k.id.includes(q));
    return matchNama || matchKriteria;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className={`relative w-full max-w-4xl rounded-3xl shadow-2xl border my-6 transition-colors overflow-hidden flex flex-col max-h-[90vh] ${
        isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${
          isDark ? 'border-slate-800 bg-slate-950/80' : 'border-slate-100 bg-gradient-to-r from-indigo-50 via-sky-50 to-emerald-50'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-600/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-600 text-white">
                  PEDOMAN RESMI DJPb
                </span>
                <span className="text-xs font-mono font-bold text-slate-500">
                  ND-1423/PB.2/2026
                </span>
              </div>
              <h3 className="font-extrabold text-base sm:text-lg leading-tight mt-0.5 text-slate-900 dark:text-white">
                Kriteria Pengajuan Permohonan Penyesuaian IKPA
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Nota Dinas Direktur Pelaksanaan Anggaran No. ND-1423/PB.2/2026 tanggal 6 Oktober 2026
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className={`p-4 border-b space-y-3 ${
          isDark ? 'border-slate-800 bg-slate-900/90' : 'border-slate-100 bg-slate-50/60'
        }`}>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari indikator, alasan permohonan, kata kunci seperti penyerapan, BA BUN, bencana..."
                className={`w-full text-xs pl-9 pr-3 py-2 rounded-xl border focus:outline-none transition-colors ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-slate-100 focus:border-indigo-500'
                    : 'bg-white border-slate-300 text-slate-900 focus:border-indigo-500'
                }`}
              />
            </div>

            <select
              value={selectedIndikatorNo}
              onChange={(e) => setSelectedIndikatorNo(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
              className={`text-xs px-3 py-2 rounded-xl border font-bold focus:outline-none cursor-pointer ${
                isDark
                  ? 'bg-slate-800 border-slate-700 text-slate-200'
                  : 'bg-white border-slate-300 text-slate-800'
              }`}
            >
              <option value="ALL">Semua Indikator IKPA (8 Indikator)</option>
              {KRITERIA_DISPENSASI_ND1423.filter(k => k.nomor <= 8).map(ind => (
                <option key={ind.nomor} value={ind.nomor}>
                  {ind.nomor}. {ind.nama}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Indicator Badges */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedIndikatorNo('ALL')}
              className={`text-[11px] px-2.5 py-1 rounded-lg font-bold shrink-0 transition-all ${
                selectedIndikatorNo === 'ALL'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              Semua
            </button>
            {KRITERIA_DISPENSASI_ND1423.map(ind => (
              <button
                key={ind.nomor}
                onClick={() => setSelectedIndikatorNo(ind.nomor)}
                className={`text-[11px] px-2.5 py-1 rounded-lg font-bold shrink-0 border transition-all ${
                  selectedIndikatorNo === ind.nomor
                    ? `${ind.warnaBadge} ring-2 ring-indigo-500/30 scale-105`
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                {ind.nomor}. {ind.singkatan}
              </button>
            ))}
          </div>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Note Banner */}
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed space-y-1">
              <p className="font-bold">Ketentuan Selektivitas Pengajuan Permohonan Penyesuaian IKPA:</p>
              <p>
                Pengajuan permohonan penyesuaian IKPA agar dilakukan <strong>secara selektif</strong> melalui proses reviu di KPPN dan Kanwil DJPb, dengan memenuhi kriteria resmi di bawah ini.
              </p>
            </div>
          </div>

          {/* List of Indicators and Criteria */}
          <div className="space-y-4">
            {filteredIndikators.map(ind => (
              <div 
                key={ind.jenis} 
                className={`rounded-2xl border transition-all overflow-hidden ${
                  isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                }`}
              >
                {/* Header Indikator */}
                <div className={`px-4 py-3 border-b flex items-center justify-between gap-3 ${
                  isDark ? 'bg-slate-800/60 border-slate-800' : 'bg-slate-50/80 border-slate-100'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-black flex items-center justify-center shrink-0">
                      {ind.nomor}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {ind.nama}
                    </h4>
                  </div>
                  <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border ${ind.warnaBadge}`}>
                    {ind.kriteria.length} Kriteria
                  </span>
                </div>

                {/* Kriteria list */}
                <div className="p-3 sm:p-4 divide-y divide-slate-100 dark:divide-slate-800 space-y-2">
                  {ind.kriteria.map(item => (
                    <div 
                      key={item.id} 
                      className={`pt-2.5 first:pt-0 group rounded-xl p-2.5 transition-colors ${
                        isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 shrink-0 mt-0.5">
                            {item.kode}.
                          </span>
                          <div className="space-y-1.5">
                            <p className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                              {item.teks}
                            </p>

                            {/* Specific footnote tags */}
                            {item.memerlukanSuratMenteri && (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                                <span>*) Wajib Dokumen Pendukung: Minimal memuat Surat/Keputusan Kepala Badan/Menteri</span>
                              </div>
                            )}

                            {item.memerlukanDipaIVB && (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-sky-100 text-sky-900 dark:bg-sky-950/80 dark:text-sky-300 border border-sky-300 dark:border-sky-700">
                                <span>**) Penambahan anggaran BA BUN: Terlihat melalui Catatan pada DIPA Halaman IVB</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action buttons: Gunakan / Copy */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleCopy(item.id, item.teks)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Salin teks alasan permohonan"
                          >
                            {copiedId === item.id ? (
                              <Check className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>

                          {onSelectKriteria && (
                            <button
                              type="button"
                              onClick={() => {
                                onSelectKriteria(ind.jenis, item.id, item.teks);
                                onClose();
                              }}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer transition-all active:scale-95"
                            >
                              Gunakan
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footnotes Section */}
          <div className="p-4 rounded-2xl border bg-slate-50 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 text-xs space-y-2">
            <h5 className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide text-[11px]">
              Catatan Kaki Resmi (ND-1423/PB.2/2026):
            </h5>
            <div className="space-y-1 text-slate-600 dark:text-slate-400 leading-relaxed">
              <p>
                <strong>*)</strong> {CATATAN_KAKI_ND1423.kebijakanKL}
              </p>
              <p>
                <strong>**)</strong> {CATATAN_KAKI_ND1423.anggaranBUN}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`px-6 py-3.5 border-t flex items-center justify-between gap-3 ${
          isDark ? 'border-slate-800 bg-slate-950/80' : 'border-slate-100 bg-slate-50'
        }`}>
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>KPPN Semarang I • Layanan Pembinaan IKPA dan Verifikasi Permohonan CSO</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
