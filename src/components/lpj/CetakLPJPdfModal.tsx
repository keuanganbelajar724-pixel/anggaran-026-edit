import React, { useState } from 'react';
import {
  X,
  Printer,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Calendar,
  Download,
  Filter,
  ShieldCheck
} from 'lucide-react';
import { MonitoringLPJRecord, LPJBatchSummary } from '../../types';
import { exportLPJPDF } from '../../utils/lpjExportHelper';
import { computeLPJSummary } from '../../utils/lpjExcelParser';

interface CetakLPJPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  allRecords: MonitoringLPJRecord[];
  currentFilteredRecords: MonitoringLPJRecord[];
  currentPeriode: string;
  isDark: boolean;
}

export type CetakMode = 'BELUM_KIRIM' | 'SUDAH_KIRIM' | 'CURRENT_FILTER' | 'SEMUA';

export const CetakLPJPdfModal: React.FC<CetakLPJPdfModalProps> = ({
  isOpen,
  onClose,
  allRecords,
  currentFilteredRecords,
  currentPeriode,
  isDark
}) => {
  const [selectedMode, setSelectedMode] = useState<CetakMode>('BELUM_KIRIM');
  const [selectedPeriode, setSelectedPeriode] = useState<string>(currentPeriode || 'ALL');
  const [customTitle, setCustomTitle] = useState<string>('');

  if (!isOpen) return null;

  const bgModal = isDark ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900';
  const cardBg = isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-500';

  // Get available periodes
  const availablePeriodes = Array.from(new Set(allRecords.map(r => r.periodeFormatted))).filter(Boolean);

  // Filter records based on selectedMode and selectedPeriode
  const recordsToPrint = (() => {
    let list = selectedMode === 'CURRENT_FILTER' ? [...currentFilteredRecords] : [...allRecords];

    if (selectedMode !== 'CURRENT_FILTER' && selectedPeriode !== 'ALL') {
      list = list.filter(r => r.periodeFormatted === selectedPeriode);
    }

    if (selectedMode === 'BELUM_KIRIM') {
      list = list.filter(r => r.statusPengiriman === 'BELUM_KIRIM');
    } else if (selectedMode === 'SUDAH_KIRIM') {
      list = list.filter(r => r.statusPengiriman === 'SUDAH_KIRIM');
    }

    return list;
  })();

  const summary = computeLPJSummary(recordsToPrint);

  const handleExecutePrint = () => {
    let title = customTitle.trim();
    let filterLabel = '';
    let prefix = 'Monitoring-LPJ';

    if (!title) {
      if (selectedMode === 'BELUM_KIRIM') {
        title = 'DAFTAR SATKER YANG BELUM MENYAMPAIKAN LPJ BENDAHARA';
        filterLabel = 'Satker Status Belum Mengirimkan LPJ';
        prefix = 'Daftar-Satker-Belum-Kirim-LPJ';
      } else if (selectedMode === 'SUDAH_KIRIM') {
        title = 'DAFTAR SATKER YANG TELAH MENYAMPAIKAN LPJ BENDAHARA LENGKAP';
        filterLabel = 'Satker Status Sudah Mengirimkan (Terverifikasi)';
        prefix = 'Daftar-Satker-Lengkap-Kirim-LPJ';
      } else if (selectedMode === 'CURRENT_FILTER') {
        title = 'REKAPITULASI MONITORING LPJ BENDAHARA (DATA TERFILTER)';
        filterLabel = 'Berdasarkan Filter Tampilan Aktif Pengguna';
        prefix = 'Rekap-LPJ-Filter-Aktif';
      } else {
        title = 'REKAPITULASI KESELURUHAN PENYAMPAIAN LPJ BENDAHARA';
        filterLabel = 'Seluruh Satuan Kerja Terdaftar';
        prefix = 'Rekap-Semua-LPJ-Bendahara';
      }
    }

    const periodeText = selectedPeriode === 'ALL' ? 'Semua Periode' : selectedPeriode;

    exportLPJPDF(recordsToPrint, summary, periodeText, {
      customTitle: title,
      filterLabel,
      filenamePrefix: prefix,
      periodeLabel: periodeText,
      themeColor: selectedMode === 'BELUM_KIRIM' ? [225, 29, 72] : [16, 185, 129]
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-2xl rounded-2xl shadow-2xl border ${bgModal} ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        } overflow-hidden flex flex-col`}
      >
        {/* Header Modal */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${isDark ? 'bg-indigo-950/60 text-indigo-400 border border-indigo-800/50' : 'bg-indigo-50 text-indigo-600 border border-indigo-200'}`}>
              <Printer className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold leading-tight">Cetak Laporan PDF Monitoring LPJ</h3>
              <p className={`text-xs ${textMuted} mt-0.5`}>
                Format Dokumen Resmi KPPN 026 Semarang Siap Unduh &amp; Cetak
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
          {/* Opsi Preset Pilihan Cetak */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Pilih Ketentuan Dokumen Yang Akan Dicetak:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedMode('BELUM_KIRIM')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  selectedMode === 'BELUM_KIRIM'
                    ? isDark ? 'bg-rose-950/40 border-rose-500 ring-2 ring-rose-500/30' : 'bg-rose-50 border-rose-500 ring-2 ring-rose-500/20'
                    : isDark ? 'bg-slate-800/40 border-slate-700 hover:border-slate-600' : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" /> Daftar Satker Belum Kirim
                  </span>
                  {selectedMode === 'BELUM_KIRIM' && <CheckCircle2 className="w-4 h-4 text-rose-500" />}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  Dokumen rekap daftar satker yang belum menyampaikan LPJ (untuk surat tagihan/teguran KPPN).
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMode('SUDAH_KIRIM')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  selectedMode === 'SUDAH_KIRIM'
                    ? isDark ? 'bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/30' : 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20'
                    : isDark ? 'bg-slate-800/40 border-slate-700 hover:border-slate-600' : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Daftar Satker Lengkap / Selesai
                  </span>
                  {selectedMode === 'SUDAH_KIRIM' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  Dokumen rekap satker yang sudah mengirimkan berkas lengkap &amp; berstatus terverifikasi.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMode('CURRENT_FILTER')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  selectedMode === 'CURRENT_FILTER'
                    ? isDark ? 'bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/30' : 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/20'
                    : isDark ? 'bg-slate-800/40 border-slate-700 hover:border-slate-600' : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                    <Filter className="w-4 h-4" /> Cetak Filter Aktif Saat Ini
                  </span>
                  {selectedMode === 'CURRENT_FILTER' && <CheckCircle2 className="w-4 h-4 text-indigo-500" />}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  Cetak tepat {currentFilteredRecords.length} satker yang sedang difilter pada layar dashboard Anda.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMode('SEMUA')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  selectedMode === 'SEMUA'
                    ? isDark ? 'bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/30' : 'bg-blue-50 border-blue-500 ring-2 ring-blue-500/20'
                    : isDark ? 'bg-slate-800/40 border-slate-700 hover:border-slate-600' : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                    <Layers className="w-4 h-4" /> Rekap Lengkap Seluruh Satker
                  </span>
                  {selectedMode === 'SEMUA' && <CheckCircle2 className="w-4 h-4 text-blue-500" />}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  Mencetak keseluruhan satker baik yang sudah maupun yang belum mengirimkan.
                </p>
              </button>
            </div>
          </div>

          {/* Pilihan Periode Bulan */}
          {selectedMode !== 'CURRENT_FILTER' && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Pilih Periode Bulan:
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPeriode('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    selectedPeriode === 'ALL'
                      ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900'
                      : 'bg-transparent text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                  }`}
                >
                  Semua Periode
                </button>
                {availablePeriodes.map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setSelectedPeriode(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      selectedPeriode === p
                        ? p.includes('Agustus')
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-rose-600 text-white border-rose-600'
                        : 'bg-transparent text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    {p} {p.includes('Agustus') ? '(Lengkap)' : p.includes('September') ? '(Belum Kirim)' : ''}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Judul Kustom (Opsional) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Judul Header Dokumen (Opsional):
            </label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="Gunakan judul default resmi sistem atau tulis judul kustom..."
              className={`w-full px-3.5 py-2 rounded-xl text-xs border ${
                isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
              } focus:outline-hidden focus:ring-2 focus:ring-indigo-500`}
            />
          </div>

          {/* Preview Ringkasan Satker yang akan dicetak */}
          <div className={`p-4 rounded-xl border ${cardBg} flex items-center justify-between`}>
            <div>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                Jumlah Satker Yang Akan Dicetak:
              </span>
              <p className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5">
                {recordsToPrint.length} <span className="text-xs font-normal text-slate-500">Satker Terpilih</span>
              </p>
            </div>
            <div className="text-right text-xs space-y-0.5">
              <p><span className="text-emerald-600 font-bold">{summary.sudahKirim}</span> Sudah Kirim</p>
              <p><span className="text-rose-600 font-bold">{summary.belumKirim}</span> Belum Kirim</p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className={`flex items-center justify-between px-6 py-4 border-t ${isDark ? 'border-slate-800 bg-slate-900/90' : 'border-slate-200 bg-slate-50/90'}`}>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleExecutePrint}
            disabled={recordsToPrint.length === 0}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all ${
              selectedMode === 'BELUM_KIRIM'
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Download className="w-4 h-4" />
            Unduh &amp; Cetak PDF Resmi ({recordsToPrint.length})
          </button>
        </div>
      </div>
    </div>
  );
};
