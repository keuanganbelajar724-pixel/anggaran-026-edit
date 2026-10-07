import React, { useState } from 'react';
import { 
  X, 
  FileText, 
  Printer, 
  Download, 
  CheckCircle2, 
  Filter, 
  Building2,
  Calendar
} from 'lucide-react';
import { MonitoringHal3Item } from '../../types/hal3Dipa';
import { exportHal3DipaToPdf, ExportPdfOptions } from '../../utils/hal3DipaExport';

interface Hal3DipaExportPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: MonitoringHal3Item[];
  tahunAnggaran: number;
  periode: string;
  currentUser?: { name?: string; role?: string } | null;
}

export const Hal3DipaExportPdfModal: React.FC<Hal3DipaExportPdfModalProps> = ({
  isOpen,
  onClose,
  records,
  tahunAnggaran,
  periode,
  currentUser
}) => {
  if (!isOpen) return null;

  const [kategoriFilter, setKategoriFilter] = useState<ExportPdfOptions['kategoriFilter']>('ALL');
  const [isExporting, setIsExporting] = useState(false);

  const handleDownload = () => {
    setIsExporting(true);
    try {
      exportHal3DipaToPdf(records, {
        kategoriFilter,
        tahunAnggaran,
        periode,
        petugasName: currentUser?.name || 'Petugas KPPN Semarang I'
      });
      onClose();
    } catch (e) {
      console.error('Error exporting PDF:', e);
    } finally {
      setIsExporting(false);
    }
  };

  const getFilteredCount = () => {
    if (kategoriFilter === 'BELUM_MENGAJUKAN') {
      return records.filter(r => r.status_kanwil === 'Belum Mengajukan').length;
    }
    if (kategoriFilter === 'BELUM_DITINDAKLANJUTI') {
      return records.filter(r => r.status_kanwil === 'Belum Mengajukan' && (!r.tindak_lanjut || r.tindak_lanjut.status_tindak_lanjut === 'Belum Ditindaklanjuti')).length;
    }
    if (kategoriFilter === 'AKAN_MENGAJUKAN') {
      return records.filter(r => r.tindak_lanjut?.keputusan_satker === 'Akan Mengajukan').length;
    }
    if (kategoriFilter === 'TIDAK_MENGAJUKAN') {
      return records.filter(r => r.tindak_lanjut?.keputusan_satker === 'Tidak Mengajukan' || r.tindak_lanjut?.keputusan_satker === 'Hal III Sudah Sesuai').length;
    }
    return records.length;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300 font-black shadow-inner">
              📄
            </div>
            <div>
              <span className="text-[10px] uppercase font-black tracking-widest px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-400/30">
                EXPORT DOKUMEN RESMI
              </span>
              <h2 className="text-base font-black text-white mt-0.5">
                Cetak Laporan Monitoring PDF
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Options */}
        <div className="p-6 space-y-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-teal-600" />
              KPPN SEMARANG I (026)
            </div>
            <p className="text-[11px] text-slate-500">
              Format kop dinas Kementerian Keuangan & Ditjen Perbendaharaan siap untuk bahan rapat pimpinan atau koordinasi Kanwil.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              Pilihan Kategori Data Laporan:
            </label>
            <div className="space-y-2">
              {[
                { id: 'ALL', label: 'Rekap Semua Satker (100%)', desc: 'Daftar lengkap seluruh satker beserta status Kanwil dan tindak lanjut KPPN' },
                { id: 'BELUM_MENGAJUKAN', label: 'Satker Belum Mengajukan', desc: 'Hanya satker yang tercatat belum mengajukan revisi pada data Kanwil' },
                { id: 'BELUM_DITINDAKLANJUTI', label: 'Prioritas: Belum Ditindaklanjuti', desc: 'Daftar satker yang belum mengajukan dan belum dihubungi KPPN' },
                { id: 'AKAN_MENGAJUKAN', label: 'Satker Berjanji Akan Mengajukan', desc: 'Satker yang telah menyatakan komitmen akan mengajukan revisi' },
                { id: 'TIDAK_MENGAJUKAN', label: 'Satker Tidak Mengajukan & Alasan', desc: 'Daftar satker yang memutuskan tidak merevisi beserta alasannya' },
              ].map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                    kategoriFilter === opt.id
                      ? 'border-teal-500 bg-teal-50/60 dark:bg-teal-950/40 text-teal-950 dark:text-teal-200 ring-2 ring-teal-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="pdf-category"
                    value={opt.id}
                    checked={kategoriFilter === opt.id}
                    onChange={() => setKategoriFilter(opt.id as any)}
                    className="mt-0.5 text-teal-600"
                  />
                  <div>
                    <div className="text-xs font-bold">{opt.label}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900/60 flex items-center justify-between text-xs">
            <span className="text-teal-800 dark:text-teal-300 font-medium">Satker yang akan tercetak:</span>
            <strong className="text-teal-900 dark:text-teal-200 font-black text-sm">{getFilteredCount()} Satker</strong>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 transition-all cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={isExporting}
            className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-black shadow-lg shadow-teal-600/30 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Membuat PDF...' : 'Unduh Dokumen PDF'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
