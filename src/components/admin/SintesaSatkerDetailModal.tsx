import React, { useState, useMemo } from 'react';
import { 
  X, 
  Download, 
  Search, 
  Layers, 
  Building2, 
  Tag, 
  Edit3, 
  Trash2, 
  Plus, 
  FileSpreadsheet, 
  LayoutGrid, 
  Table as TableIcon,
  ChevronRight,
  Sparkles,
  Info,
  ShieldCheck,
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import { RealisasiBelanjaRecord } from '../../types';
import { formatRupiahFull, formatRupiahShort, exportRealisasiBelanjaToExcel, getJenisBelanjaInfo, getOfficialSumberDanaName } from '../../utils/realisasiBelanjaProcessor';

interface SintesaSatkerDetailModalProps {
  satkerInfo: {
    satkerKode: string;
    satkerUraian: string;
    kementerianKode: string;
    kementerianUraian: string;
    kewenanganUraian?: string;
    totalPagu: number;
    totalRealisasi: number;
    sisaPagu: number;
    persen: number;
    records: RealisasiBelanjaRecord[];
  } | null;
  onClose: () => void;
  onEditRecord: (record: RealisasiBelanjaRecord) => void;
  onDeleteRecord: (id: string) => void;
  onAddNewRecord: () => void;
}

export const SintesaSatkerDetailModal: React.FC<SintesaSatkerDetailModalProps> = ({
  satkerInfo,
  onClose,
  onEditRecord,
  onDeleteRecord,
  onAddNewRecord
}) => {
  const [modalSearch, setModalSearch] = useState<string>('');
  const [viewMode, setViewMode] = useState<'hierarchy_cards' | 'full_table'>('hierarchy_cards');
  const [filterAkunType, setFilterAkunType] = useState<string>('ALL');

  if (!satkerInfo) return null;

  // Filter records within this Satker
  const filteredRecords = useMemo(() => {
    return satkerInfo.records.filter(r => {
      if (filterAkunType !== 'ALL' && r.jenisBelanjaKode !== filterAkunType) {
        return false;
      }
      if (modalSearch) {
        const q = modalSearch.toLowerCase();
        const matchAkun = (r.akunKode && r.akunKode.toLowerCase().includes(q)) || (r.akunUraian && r.akunUraian.toLowerCase().includes(q));
        const matchProg = r.programUraian && r.programUraian.toLowerCase().includes(q);
        const matchKeg = r.kegiatanUraian && r.kegiatanUraian.toLowerCase().includes(q);
        const matchKro = (r.outputKroKode && r.outputKroKode.toLowerCase().includes(q)) || (r.outputKroUraian && r.outputKroUraian.toLowerCase().includes(q));
        const matchSD = (r.sumberdanaKode && r.sumberdanaKode.toLowerCase().includes(q)) || (r.sumberdanaUraian && r.sumberdanaUraian.toLowerCase().includes(q));
        const matchEselon = (r.eselonIKode && r.eselonIKode.toLowerCase().includes(q)) || (r.eselonIUraian && r.eselonIUraian.toLowerCase().includes(q));
        const matchFungsi = (r.fungsiKode && r.fungsiKode.toLowerCase().includes(q)) || (r.fungsiUraian && r.fungsiUraian.toLowerCase().includes(q));

        if (!matchAkun && !matchProg && !matchKeg && !matchKro && !matchSD && !matchEselon && !matchFungsi) {
          return false;
        }
      }
      return true;
    });
  }, [satkerInfo.records, modalSearch, filterAkunType]);

  const firstRec = satkerInfo.records[0] || {};
  const eselonInfo = `${firstRec.eselonIKode ? `[${firstRec.eselonIKode}] ` : ''}${firstRec.eselonIUraian || 'Unit Eselon I'}`;
  const kewenanganInfo = `${firstRec.kewenanganKode ? `[${firstRec.kewenanganKode}] ` : ''}${firstRec.kewenanganUraian || satkerInfo.kewenanganUraian || 'Kantor Daerah'}`;
  const fungsiUtama = firstRec.fungsiUraian ? `${firstRec.fungsiKode ? `[${firstRec.fungsiKode}] ` : ''}${firstRec.fungsiUraian}` : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-6xl w-full max-h-[94vh] flex flex-col border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
        
        {/* ========================================================================= */}
        {/* MODAL HEADER: COMPLETE SATKER DIMENSIONS                                   */}
        {/* ========================================================================= */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-800">
          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30">
                Detail SINTESA Satker
              </span>
              <span className="text-xs font-mono bg-white/10 px-2 py-0.5 rounded text-amber-300 font-bold">
                Kode Satker (Kolom O): {satkerInfo.satkerKode}
              </span>
              <span className="text-xs font-mono bg-white/10 px-2 py-0.5 rounded text-slate-300">
                Kode K/L (Kolom B): {satkerInfo.kementerianKode}
              </span>
            </div>

            <h3 className="text-lg sm:text-xl font-black text-white leading-snug">
              {satkerInfo.satkerUraian}
            </h3>

            {/* SINTESA Hierarchy Breadcrumb Metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs text-slate-300">
              <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                <span className="text-[10px] text-slate-400 font-medium block">Kementerian / Lembaga (Kolom B)</span>
                <span className="font-semibold text-white">{satkerInfo.kementerianUraian}</span>
              </div>
              <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                <span className="text-[10px] text-slate-400 font-medium block">Eselon I (Kolom C &amp; D)</span>
                <span className="font-semibold text-white">{eselonInfo}</span>
              </div>
              <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                <span className="text-[10px] text-slate-400 font-medium block">Kewenangan (Kolom E &amp; F)</span>
                <span className="font-semibold text-emerald-300">{kewenanganInfo}</span>
              </div>
            </div>

            {fungsiUtama && (
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-0.5">
                <span className="text-slate-500 font-medium">Fungsi &amp; Subfungsi (Kolom Q &amp; R):</span>
                <span className="text-slate-200 font-semibold">{fungsiUtama}</span>
                {firstRec.subfungsiUraian && (
                  <span className="text-slate-400">» {firstRec.subfungsiKode ? `[${firstRec.subfungsiKode}] ` : ''}{firstRec.subfungsiUraian}</span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-start">
            <button
              onClick={onAddNewRecord}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Baris</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm font-bold cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* FINANCIAL SUMMARY METRICS BANNER                                          */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-xs">
          <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
            <span className="text-[10px] font-semibold text-slate-400">Total Pagu DIPA (Kolom AP)</span>
            <p className="font-black text-sm sm:text-base text-slate-900 dark:text-white mt-0.5">
              {formatRupiahFull(satkerInfo.totalPagu)}
            </p>
            <span className="text-[10px] text-slate-400 font-mono">
              {formatRupiahShort(satkerInfo.totalPagu)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-900/50 shadow-2xs">
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">Total Realisasi (Kolom AQ)</span>
            <p className="font-black text-sm sm:text-base text-emerald-700 dark:text-emerald-400 mt-0.5">
              {formatRupiahFull(satkerInfo.totalRealisasi)}
            </p>
            <span className="text-[10px] text-emerald-600 font-mono">
              {formatRupiahShort(satkerInfo.totalRealisasi)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-900/50 shadow-2xs">
            <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">Sisa Pagu Anggaran</span>
            <p className="font-black text-sm sm:text-base text-amber-700 dark:text-amber-400 mt-0.5">
              {formatRupiahFull(satkerInfo.sisaPagu)}
            </p>
            <span className="text-[10px] text-amber-600 font-mono">
              {formatRupiahShort(satkerInfo.sisaPagu)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-900/50 shadow-2xs">
            <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">Capaian Realisasi (%)</span>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="font-black text-base sm:text-lg text-blue-600 dark:text-blue-400">
                {satkerInfo.persen.toFixed(2)}%
              </p>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                satkerInfo.persen >= 80 
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : satkerInfo.persen >= 50
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
              }`}>
                {satkerInfo.persen >= 80 ? 'Optimal' : satkerInfo.persen >= 50 ? 'Sedang' : 'Rendah'}
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MODAL TOOLBAR: SEARCH & VIEW SWITCHER                                     */}
        {/* ========================================================================= */}
        <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[240px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari Akun (AA/AB) / KRO / Program..."
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              {modalSearch && (
                <button
                  onClick={() => setModalSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Jenis Belanja */}
            <select
              value={filterAkunType}
              onChange={(e) => setFilterAkunType(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              <option value="ALL">Semua Jenis Belanja</option>
              <option value="51">51 - Belanja Pegawai</option>
              <option value="52">52 - Belanja Barang</option>
              <option value="53">53 - Belanja Modal</option>
              <option value="57">57 - Belanja Bansos</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setViewMode('hierarchy_cards')}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'hierarchy_cards'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Kartu Rinci</span>
              </button>
              <button
                onClick={() => setViewMode('full_table')}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'full_table'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Tabel Lengkap</span>
              </button>
            </div>

            {/* Ekspor Excel Satker */}
            <button
              onClick={() => exportRealisasiBelanjaToExcel(
                satkerInfo.records, 
                `SINTESA_${satkerInfo.satkerKode}_${satkerInfo.satkerUraian.replace(/\s+/g, '_')}.xlsx`
              )}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor Excel ({filteredRecords.length})</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MODAL BODY: DETAILED BREAKDOWN LIST (NO TRUNCATION!)                      */}
        {/* ========================================================================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50 dark:bg-slate-950/50">
          {filteredRecords.length === 0 ? (
            <div className="text-center py-12 text-slate-500 space-y-2">
              <FileSpreadsheet className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="font-semibold text-sm">Tidak ada baris data SINTESA yang cocok dengan pencarian.</p>
            </div>
          ) : viewMode === 'hierarchy_cards' ? (
            /* =================================================================== */
            /* VIEW 1: FULL HIERARCHY CARDS WITH COMPLETE DESCRIPTIONS (NO TRUNCATE)*/
            /* =================================================================== */
            <div className="space-y-3.5">
              {filteredRecords.map((r, idx) => {
                const jenisInfo = getJenisBelanjaInfo(r.akunKode);
                const sisa = Math.max(0, r.paguDipa - r.realisasi);

                return (
                  <div 
                    key={r.id || idx}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700/80 shadow-xs hover:border-blue-300 dark:hover:border-blue-700 transition-all space-y-3"
                  >
                    {/* Card Top: Row No, Akun 6-digit & Action buttons */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center text-xs font-bold">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span 
                              className="font-mono font-black text-sm px-2.5 py-0.5 rounded-md"
                              style={{ backgroundColor: `${jenisInfo.color}15`, color: jenisInfo.color }}
                            >
                              Akun (AA): {r.akunKode}
                            </span>
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              {r.akunUraian} (Kolom AB)
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          {getOfficialSumberDanaName(r.sumberdanaKode, r.sumberdanaUraian).label}
                        </span>
                        <button
                          onClick={() => onEditRecord(r)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                          title="Edit Baris Data Ini"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteRecord(r.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Hapus Baris Data Ini"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Card Middle: Program, Kegiatan, KRO (Full Visible Text) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      {/* Program (V) */}
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Program (Kolom U &amp; V)
                        </span>
                        <p className="font-bold text-slate-900 dark:text-white mt-0.5 leading-relaxed break-words">
                          {r.programUraian || '-'}
                        </p>
                        {r.programKode && (
                          <span className="text-[10px] text-slate-500 font-mono block mt-1">
                            Kode: {r.programKode}
                          </span>
                        )}
                      </div>

                      {/* Kegiatan (X) */}
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Kegiatan (Kolom W &amp; X)
                        </span>
                        <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5 leading-relaxed break-words">
                          {r.kegiatanUraian || '-'}
                        </p>
                        {r.kegiatanKode && (
                          <span className="text-[10px] text-slate-500 font-mono block mt-1">
                            Kode: {r.kegiatanKode}
                          </span>
                        )}
                      </div>

                      {/* Output KRO (Z) */}
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Output KRO (Kolom Y &amp; Z)
                        </span>
                        <p className="font-bold text-slate-900 dark:text-white mt-0.5 leading-relaxed break-words">
                          {r.outputKroUraian || '-'}
                        </p>
                        {r.outputKroKode && (
                          <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono block mt-1 font-semibold">
                            Kode KRO: {r.outputKroKode}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Extra Meta Dimension Badges: Eselon, Kewenangan, Fungsi */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] pt-1">
                      {r.eselonIUraian && (
                        <span className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                          Eselon I (C &amp; D): {r.eselonIKode ? `[${r.eselonIKode}] ` : ''}{r.eselonIUraian}
                        </span>
                      )}
                      {r.kewenanganUraian && (
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          Kewenangan (E &amp; F): {r.kewenanganKode ? `[${r.kewenanganKode}] ` : ''}{r.kewenanganUraian}
                        </span>
                      )}
                      {r.fungsiUraian && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          Fungsi (Q &amp; R): {r.fungsiKode ? `[${r.fungsiKode}] ` : ''}{r.fungsiUraian}
                        </span>
                      )}
                    </div>

                    {/* Card Bottom: Financial Figures (AP, AQ, Sisa, Capaian %) */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 text-xs">
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                        <span className="text-[10px] text-slate-400">Pagu DIPA (AP)</span>
                        <p className="font-mono font-bold text-slate-900 dark:text-white">
                          {formatRupiahFull(r.paguDipa)}
                        </p>
                      </div>
                      <div className="p-2 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/40">
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Realisasi (AQ)</span>
                        <p className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                          {formatRupiahFull(r.realisasi)}
                        </p>
                      </div>
                      <div className="p-2 rounded-lg bg-amber-50/60 dark:bg-amber-950/40">
                        <span className="text-[10px] text-amber-600">Sisa Pagu</span>
                        <p className="font-mono font-bold text-amber-700 dark:text-amber-400">
                          {formatRupiahFull(sisa)}
                        </p>
                      </div>
                      <div className="p-2 rounded-lg bg-blue-50/60 dark:bg-blue-950/40 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-blue-600 dark:text-blue-400">Capaian</span>
                          <p className="font-black text-sm text-blue-700 dark:text-blue-300">
                            {r.persenRealisasi.toFixed(2)}%
                          </p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                          r.persenRealisasi >= 80 
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                            : r.persenRealisasi >= 50
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200'
                        }`}>
                          {r.persenRealisasi >= 80 ? 'Optimal' : r.persenRealisasi >= 50 ? 'Sedang' : 'Rendah'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* =================================================================== */
            /* VIEW 2: COMPREHENSIVE SINTESA TABLE (WRAP TEXT, ALL COLUMNS)        */
            /* =================================================================== */
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-3 px-3 w-10">No</th>
                    <th className="py-3 px-3 min-w-[200px]">Program &amp; Kegiatan (V &amp; X)</th>
                    <th className="py-3 px-3 min-w-[180px]">Output KRO (Y &amp; Z)</th>
                    <th className="py-3 px-3 min-w-[200px]">Akun 6-Digit (AA &amp; AB)</th>
                    <th className="py-3 px-3 min-w-[160px]">Eselon I &amp; Kewenangan (C &amp; E)</th>
                    <th className="py-3 px-3 min-w-[140px]">Fungsi (Q &amp; R)</th>
                    <th className="py-3 px-3 text-center">Sumber Dana (AD)</th>
                    <th className="py-3 px-3 text-right min-w-[120px]">Pagu (AP)</th>
                    <th className="py-3 px-3 text-right min-w-[120px]">Realisasi (AQ)</th>
                    <th className="py-3 px-3 text-center">Capaian</th>
                    <th className="py-3 px-3 text-center w-20">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredRecords.map((r, idx) => (
                    <tr key={r.id || idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors">
                      <td className="py-3 px-3 font-semibold text-slate-400 align-top">{idx + 1}</td>
                      
                      {/* Program & Kegiatan */}
                      <td className="py-3 px-3 align-top whitespace-normal break-words">
                        <div className="font-bold text-slate-900 dark:text-white leading-snug">
                          {r.programUraian || '-'}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1 leading-snug">
                          {r.kegiatanUraian || '-'}
                        </div>
                      </td>

                      {/* Output KRO */}
                      <td className="py-3 px-3 align-top whitespace-normal break-words">
                        <div className="font-bold text-slate-800 dark:text-slate-200 leading-snug">
                          {r.outputKroUraian || '-'}
                        </div>
                        <div className="text-[10px] text-blue-600 dark:text-blue-400 font-mono font-semibold mt-1">
                          KRO: {r.outputKroKode || '-'}
                        </div>
                      </td>

                      {/* Akun 6-digit & Uraian Akun */}
                      <td className="py-3 px-3 align-top whitespace-normal break-words">
                        <div className="font-mono font-black text-slate-900 dark:text-white">
                          {r.akunKode}
                        </div>
                        <div className="text-[11px] text-slate-700 dark:text-slate-300 mt-0.5 leading-snug">
                          {r.akunUraian}
                        </div>
                      </td>

                      {/* Eselon I & Kewenangan */}
                      <td className="py-3 px-3 align-top whitespace-normal break-words text-[11px]">
                        <div className="font-semibold text-purple-700 dark:text-purple-300">
                          {r.eselonIUraian || '-'}
                        </div>
                        <div className="text-slate-500 mt-0.5">
                          Kewenangan: {r.kewenanganUraian || 'Kantor Daerah'}
                        </div>
                      </td>

                      {/* Fungsi */}
                      <td className="py-3 px-3 align-top whitespace-normal break-words text-[11px]">
                        <div className="text-slate-700 dark:text-slate-300 font-medium">
                          {r.fungsiUraian || '-'}
                        </div>
                      </td>

                      {/* Sumber Dana */}
                      <td className="py-3 px-3 align-top text-center">
                        <span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-center leading-snug">
                          {getOfficialSumberDanaName(r.sumberdanaKode, r.sumberdanaUraian).label}
                        </span>
                      </td>

                      {/* Pagu */}
                      <td className="py-3 px-3 align-top text-right font-mono font-medium text-slate-900 dark:text-white">
                        {formatRupiahFull(r.paguDipa)}
                      </td>

                      {/* Realisasi */}
                      <td className="py-3 px-3 align-top text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        {formatRupiahFull(r.realisasi)}
                      </td>

                      {/* % Capaian */}
                      <td className="py-3 px-3 align-top text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black ${
                          r.persenRealisasi >= 80 
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : r.persenRealisasi >= 50
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}>
                          {r.persenRealisasi.toFixed(1)}%
                        </span>
                      </td>

                      {/* Aksi */}
                      <td className="py-3 px-3 align-top text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onEditRecord(r)}
                            className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                            title="Edit Baris"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteRecord(r.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                            title="Hapus Baris"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* MODAL FOOTER                                                              */}
        {/* ========================================================================= */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Menampilkan <strong>{filteredRecords.length}</strong> dari {satkerInfo.records.length} baris data SINTESA satker ini.
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onAddNewRecord}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 dark:hover:bg-blue-900/60 transition-colors cursor-pointer"
            >
              + Tambah Baris Satker Ini
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-black text-white dark:bg-slate-700 dark:hover:bg-slate-600 transition-colors cursor-pointer shadow-xs"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
