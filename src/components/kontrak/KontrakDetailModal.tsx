import React from 'react';
import {
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  FileCheck,
  FileText,
  Layers,
  Sparkles,
  Tag,
  User,
  X
} from 'lucide-react';
import { KontrakMonitoringRecord } from '../../types';
import { formatRupiah } from '../../utils/kontrakCalculations';

interface KontrakDetailModalProps {
  record: KontrakMonitoringRecord | null;
  onClose: () => void;
  isDark?: boolean;
}

export const KontrakDetailModal: React.FC<KontrakDetailModalProps> = ({
  record,
  onClose,
  isDark = false
}) => {
  if (!record) return null;

  const isNrkMismatch =
    record.status_nrk === 'SESUAIKAN DENGAN NRK SPAN' ||
    (record.nrk_span && record.nrk_sakti && record.nrk_span !== record.nrk_sakti);

  const isTerlambat =
    record.status_progress_kontrak === 'BELUM SELESAI TERLAMBAT TERMIN' ||
    record.status_progress_kontrak === 'BELUM SELESAI TERLAMBAT' ||
    record.status_progress_kontrak === 'SELESAI TERLAMBAT';

  const isBelumSelesai =
    record.status_progress_kontrak === 'BELUM SELESAI' ||
    record.status_progress_kontrak === 'BELUM SELESAI TERLAMBAT TERMIN' ||
    record.status_progress_kontrak === 'BELUM SELESAI TERLAMBAT';

  // Warnings
  const warnings: string[] = [];
  if (record.nilai_pembayaran > record.nilai_kontrak) {
    warnings.push('⚠️ Nilai pembayaran melebihi nilai kontrak!');
  }
  if (record.sisa_kontrak < 0) {
    warnings.push('⚠️ Sisa kontrak bernilai negatif!');
  }
  if (record.tanggal_mulai && record.tanggal_selesai && record.tanggal_selesai < record.tanggal_mulai) {
    warnings.push('⚠️ Tanggal selesai mendahului tanggal mulai!');
  }
  if (isNrkMismatch) {
    warnings.push('⚠️ Status NRK memerlukan penyesuaian antara SPAN dan SAKTI.');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden ${
          isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg">Detail Data Kontrak</h3>
                <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                  No. {record.no}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">{record.nomor_kontrak}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs sm:text-sm">
          {/* Warning Banner if any */}
          {warnings.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Catatan Kualitas Data (Quality Warning):</span>
              </div>
              {warnings.map((w, idx) => (
                <div key={idx} className="text-xs pl-5 font-medium">
                  {w}
                </div>
              ))}
            </div>
          )}

          {/* 3 Status Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Status Progress */}
            <div
              className={`p-3.5 rounded-2xl border ${
                record.status_progress_kontrak === 'SELESAI TEPAT WAKTU'
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 text-emerald-800 dark:text-emerald-300'
                  : isTerlambat
                  ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 text-rose-800 dark:text-rose-300'
                  : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 text-amber-800 dark:text-amber-300'
              }`}
            >
              <span className="text-[11px] block font-medium opacity-80">STATUS PROGRESS KONTRAK</span>
              <strong className="text-xs sm:text-sm block mt-0.5">{record.status_progress_kontrak}</strong>
            </div>

            {/* Status NRK */}
            <div
              className={`p-3.5 rounded-2xl border ${
                record.status_nrk === 'SESUAI'
                  ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 text-blue-800 dark:text-blue-300'
                  : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 text-amber-800 dark:text-amber-300'
              }`}
            >
              <span className="text-[11px] block font-medium opacity-80">STATUS NRK</span>
              <strong className="text-xs sm:text-sm block mt-0.5">{record.status_nrk}</strong>
            </div>

            {/* Status Kirim ke KPPN */}
            <div className="p-3.5 rounded-2xl border bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
              <span className="text-[11px] block font-medium opacity-80">STATUS KIRIM KE KPPN</span>
              <strong className="text-xs sm:text-sm block mt-0.5 text-emerald-600 font-mono">
                {record.status_kirim_kppn || 'SUDAH'}
              </strong>
            </div>
          </div>

          {/* Section: Nilai Finansial */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/50 to-teal-50/30 dark:from-emerald-950/20 dark:to-teal-950/10 border border-emerald-200 dark:border-emerald-800">
            <h4 className="font-extrabold text-xs text-emerald-800 dark:text-emerald-400 mb-3 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4" />
              <span>NILAI KONTRAK, PEMBAYARAN, &amp; SISA KONTRAK</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <span className="text-xs text-slate-500 block">Nilai Kontrak:</span>
                <strong className="text-base sm:text-lg font-mono text-slate-900 dark:text-white font-extrabold">
                  {formatRupiah(record.nilai_kontrak)}
                </strong>
                <span className="text-[10px] text-slate-400 block font-mono">Mata Uang: {record.kode_mata_uang}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Nilai Pembayaran:</span>
                <strong className="text-base sm:text-lg font-mono text-emerald-600 dark:text-emerald-400 font-extrabold">
                  {formatRupiah(record.nilai_pembayaran)}
                </strong>
                <span className="text-[10px] text-slate-400 block">
                  {record.nilai_kontrak > 0
                    ? `Realisasi: ${((record.nilai_pembayaran / record.nilai_kontrak) * 100).toFixed(1)}%`
                    : '-'}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Sisa Kontrak:</span>
                <strong
                  className={`text-base sm:text-lg font-mono font-extrabold ${
                    record.sisa_kontrak > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600'
                  }`}
                >
                  {formatRupiah(record.sisa_kontrak)}
                </strong>
                <span className="text-[10px] text-slate-400 block">
                  {record.nilai_kontrak > 0
                    ? `Sisa: ${((record.sisa_kontrak / record.nilai_kontrak) * 100).toFixed(1)}%`
                    : '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Section: Perbandingan NRK */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <h4 className="font-extrabold text-xs text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-blue-600" />
              <span>PERBANDINGAN NRK SPAN VS NRK SAKTI</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <span className="text-xs text-slate-500 block font-medium">NRK SPAN:</span>
                <strong className="font-mono text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                  {record.nrk_span || '-'}
                </strong>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <span className="text-xs text-slate-500 block font-medium">NRK SAKTI:</span>
                <strong className="font-mono text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                  {record.nrk_sakti || '-'}
                </strong>
              </div>
            </div>
            {isNrkMismatch && (
              <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-2 font-medium">
                * Terdapat perbedaan antara NRK SPAN dan NRK SAKTI. Silakan lakukan rekonsiliasi data pada aplikasi SPAN/SAKTI.
              </p>
            )}
          </div>

          {/* Section: Satker & Supplier Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Satker Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <h5 className="font-extrabold text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <span>INFORMASI SATKER &amp; KPPN</span>
              </h5>
              <div>
                <span className="text-slate-500 text-xs">Kode Satker:</span>
                <strong className="font-mono font-bold text-slate-800 dark:text-slate-200 block text-sm">
                  {record.kode_satker}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 text-xs">Nama Satker:</span>
                <strong className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
                  {record.deskripsi_satker}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 text-xs">Kode KPPN:</span>
                <strong className="font-mono font-bold text-slate-800 dark:text-slate-200 block text-xs">
                  {record.kode_kppn}
                </strong>
              </div>
            </div>

            {/* Supplier Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <h5 className="font-extrabold text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <User className="w-4 h-4 text-blue-600" />
                <span>INFORMASI SUPPLIER</span>
              </h5>
              <div>
                <span className="text-slate-500 text-xs">Nama Supplier:</span>
                <strong className="font-bold text-slate-800 dark:text-slate-200 block text-sm">
                  {record.nama_supplier}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 text-xs">Nomor Register Supplier (NRS):</span>
                <strong className="font-mono font-bold text-slate-800 dark:text-slate-200 block text-xs">
                  {record.nomor_register_supplier || '-'}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 text-xs">Kode COA:</span>
                <strong className="font-mono font-bold text-slate-800 dark:text-slate-200 block text-xs">
                  {record.kode_coa || '-'}
                </strong>
              </div>
            </div>
          </div>

          {/* Section: Timeline & Dates */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <h5 className="font-extrabold text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5 mb-3">
              <Calendar className="w-4 h-4 text-amber-600" />
              <span>TIMELINE TANGGAL KONTRAK</span>
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-slate-500 text-xs block">Tanggal Kontrak:</span>
                <strong className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {record.tanggal_kontrak || '-'}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 text-xs block">Tanggal Mulai:</span>
                <strong className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {record.tanggal_mulai || '-'}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 text-xs block">Tanggal Selesai:</span>
                <strong className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {record.tanggal_selesai || '-'}
                </strong>
              </div>
            </div>
          </div>

          {/* Section: Uraian Kontrak & Detail Barang Jasa */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
            <div>
              <span className="text-slate-500 text-xs font-bold block mb-1">Uraian Kontrak:</span>
              <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                {record.uraian_kontrak || 'Tidak ada uraian.'}
              </p>
            </div>
            <div>
              <span className="text-slate-500 text-xs font-bold block mb-1">Detail Barang / Jasa (Kolom V):</span>
              <p className="text-xs text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 font-mono">
                {record.detail_barang_jasa || 'Lihat Detail Barang/Jasa'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 pt-4 border-t border-slate-200 dark:border-slate-800 shrink-0">
          <span className="text-[11px] text-slate-400 font-mono">
            Batch ID: {record.upload_batch_id || '-'}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-xs font-bold transition-all cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
