import React from 'react';
import {
  X,
  Building2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  Clock,
  Send,
  HelpCircle
} from 'lucide-react';
import {
  MonitoringRekonsiliasiRecord,
  MasterSatker
} from '../../types';
import { formatPeriodeRekonsiliasi } from '../../utils/rekonsiliasiExcelParser';

interface DetailSatkerRekonsiliasiModalProps {
  record: MonitoringRekonsiliasiRecord | null;
  masterSatker?: MasterSatker;
  isDark: boolean;
  onClose: () => void;
}

export const DetailSatkerRekonsiliasiModal: React.FC<DetailSatkerRekonsiliasiModalProps> = ({
  record,
  masterSatker,
  isDark,
  onClose
}) => {
  if (!record) return null;

  const bgModal = isDark ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900';
  const cardBg = isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-500';

  // Hubungi PIC WhatsApp jika ada
  const handleContactPic = () => {
    if (!masterSatker?.noHpPic) return;
    const phone = masterSatker.noHpPic.replace(/[^0-9]/g, '');
    const cleanPhone = phone.startsWith('0') ? '62' + phone.substring(1) : phone;
    const message = encodeURIComponent(
      `Halo Bapak/Ibu PIC ${record.namaSatker} (${record.kodeSatker}), ini dari KPPN 026 Semarang perihal Monitoring Kepatuhan Satker periode ${formatPeriodeRekonsiliasi(record.periode)}.\n\nStatus saat ini:\n- Rekonsiliasi: ${record.rekonsiliasiRaw}\n- Todolist: ${record.todolistRaw}\n- Tutup Periode: ${record.tutupPeriodeRaw}\n\nMohon untuk segera menindaklanjuti. Terima kasih.`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-3xl rounded-2xl shadow-2xl border ${bgModal} ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        } overflow-hidden max-h-[90vh] flex flex-col`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${isDark ? 'bg-blue-900/40 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold leading-tight">Detail Kepatuhan Satker</h3>
              <p className={`text-xs ${textMuted} flex items-center gap-2 mt-0.5`}>
                <span>Kode: <strong className="font-mono">{record.kodeSatker}</strong></span>
                <span>•</span>
                <span>No KPPN: <strong className="font-mono">{record.noKppnSatker}</strong></span>
                <span>•</span>
                <span>Periode: {formatPeriodeRekonsiliasi(record.periode)}</span>
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
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Top Banner Satker Info */}
          <div className={`p-4 rounded-xl border ${cardBg} flex flex-col md:flex-row md:items-center justify-between gap-4`}>
            <div>
              <span className={`text-xs uppercase font-semibold tracking-wider ${textMuted}`}>Nama Satker</span>
              <h4 className="text-base font-bold mt-0.5 text-blue-600 dark:text-blue-400">{record.namaSatker}</h4>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
                <span className={`px-2.5 py-0.5 rounded-full font-medium ${
                  record.statusSatker === 'AKTIF'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                }`}>
                  Status: {record.statusSatker}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-700'}`}>
                  KPPN: {record.kodeKppn}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-700'}`}>
                  Urutan: No. {record.no}
                </span>
              </div>
            </div>

            {/* Status Tindak Lanjut Faktual */}
            <div className="flex flex-col items-start md:items-end">
              <span className={`text-xs uppercase font-semibold tracking-wider ${textMuted} mb-1`}>Status Evaluasi</span>
              {record.prioritasKategori === 'PERLU_TINDAKAN' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  Perlu Tindakan
                </span>
              )}
              {record.prioritasKategori === 'PERLU_PEMANTAUAN' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                  <Clock className="w-4 h-4 text-amber-500" />
                  Perlu Pemantauan
                </span>
              )}
              {record.prioritasKategori === 'SELESAI' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Kepatuhan Selesai
                </span>
              )}
            </div>
          </div>

          {/* Status Kepatuhan 3 Pilar */}
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Status Kepatuhan Satker (Sumber Excel Asli)
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Rekonsiliasi */}
              <div className={`p-4 rounded-xl border ${cardBg}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-400">1. Rekonsiliasi</span>
                  {record.rekonsiliasiStatus === 'SELESAI' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                      <CheckCircle2 className="w-3 h-3" /> Selesai
                    </span>
                  ) : record.rekonsiliasiStatus === 'BELUM_SELESAI' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400">
                      <AlertTriangle className="w-3 h-3" /> Belum Selesai
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      <HelpCircle className="w-3 h-3" /> Unknown
                    </span>
                  )}
                </div>
                <p className="text-sm font-semibold mt-1">{record.rekonsiliasiRaw || '-'}</p>
              </div>

              {/* Todolist */}
              <div className={`p-4 rounded-xl border ${cardBg}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-400">2. Todolist</span>
                  {record.todolistStatus === 'SELESAI' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                      <CheckCircle2 className="w-3 h-3" /> Selesai
                    </span>
                  ) : record.todolistStatus === 'BELUM_SELESAI' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400">
                      <AlertTriangle className="w-3 h-3" /> Belum Selesai
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      <HelpCircle className="w-3 h-3" /> Unknown
                    </span>
                  )}
                </div>
                <p className="text-sm font-semibold mt-1">{record.todolistRaw || '-'}</p>
              </div>

              {/* Tutup Periode */}
              <div className={`p-4 rounded-xl border ${cardBg}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-400">3. Tutup Periode</span>
                  {record.tutupPeriodeStatus === 'SUDAH_TUTUP' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                      <CheckCircle2 className="w-3 h-3" /> Sudah Tutup
                    </span>
                  ) : record.tutupPeriodeStatus === 'BELUM_TUTUP' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
                      <Clock className="w-3 h-3" /> Belum Tutup
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      <HelpCircle className="w-3 h-3" /> Unknown
                    </span>
                  )}
                </div>
                <p className="text-sm font-semibold mt-1">{record.tutupPeriodeRaw || '-'}</p>
              </div>
            </div>
          </div>

          {/* Dokumen SP2S, SP3S & Dispensasi */}
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Dokumen Kepatuhan & Dispensasi
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* SP2S */}
              <div className={`p-4 rounded-xl border ${cardBg}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" /> SP2S
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    record.sp2sStatus === 'ADA'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                    {record.sp2sStatus === 'ADA' ? 'Ada' : 'Tidak Ada'}
                  </span>
                </div>
                <div className="text-xs space-y-1 mt-2">
                  <p><span className={textMuted}>Nomor:</span> <span className="font-semibold">{record.sp2sNomor}</span></p>
                  <p><span className={textMuted}>Tanggal:</span> <span className="font-semibold">{record.sp2sTanggal}</span></p>
                </div>
              </div>

              {/* SP3S */}
              <div className={`p-4 rounded-xl border ${cardBg}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" /> SP3S
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    record.sp3sStatus === 'ADA'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                    {record.sp3sStatus === 'ADA' ? 'Ada' : 'Belum Ada'}
                  </span>
                </div>
                <div className="text-xs space-y-1 mt-2">
                  <p><span className={textMuted}>Nomor:</span> <span className="font-semibold">{record.sp3sNomor}</span></p>
                  <p><span className={textMuted}>Tanggal:</span> <span className="font-semibold">{record.sp3sTanggal}</span></p>
                </div>
              </div>

              {/* Dispensasi */}
              <div className={`p-4 rounded-xl border ${cardBg}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-3.5 h-3.5" /> Dispensasi
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    record.dispensasi !== '-'
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                    {record.dispensasi !== '-' ? 'Ada' : 'Nihil (-)'}
                  </span>
                </div>
                <div className="text-xs space-y-1 mt-2">
                  <p><span className={textMuted}>Keterangan:</span> <span className="font-semibold">{record.dispensasi}</span></p>
                </div>
              </div>
            </div>
          </div>

          {/* Informasi PIC Master Satker (Sinkronisasi ANGKASA) */}
          {masterSatker && (
            <div className={`p-4 rounded-xl border ${cardBg}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Data Kontak Satker (Master Data ANGKASA)
                </span>
                {masterSatker.noHpPic && (
                  <button
                    onClick={handleContactPic}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors"
                  >
                    <Send className="w-3 h-3" />
                    Kirim Pesan WhatsApp
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs mt-2">
                <div>
                  <span className={textMuted}>Nama PIC:</span>
                  <p className="font-semibold">{masterSatker.namaPic || '-'}</p>
                </div>
                <div>
                  <span className={textMuted}>No. HP PIC:</span>
                  <p className="font-semibold">{masterSatker.noHpPic || '-'}</p>
                </div>
                <div>
                  <span className={textMuted}>Email PIC:</span>
                  <p className="font-semibold">{masterSatker.emailPic || '-'}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'} flex justify-end`}>
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
