import React from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  Tag, 
  Users, 
  BookOpen, 
  FileText, 
  ExternalLink, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert,
  Share2,
  Bookmark
} from 'lucide-react';
import { LLATEvent } from '../../types/llat';
import { getCountdownInfo, getPriorityBadge, getStatusBadge } from '../../data/defaultLlatData';

interface LLATDetailModalProps {
  event: LLATEvent | null;
  onClose: () => void;
  onEdit?: (event: LLATEvent) => void;
  isAdmin?: boolean;
}

export const LLATDetailModal: React.FC<LLATDetailModalProps> = ({
  event,
  onClose,
  onEdit,
  isAdmin = false
}) => {
  if (!event) return null;

  const countdown = getCountdownInfo(event);
  const priority = getPriorityBadge(event.prioritas);
  const status = getStatusBadge(event.status);

  // Format date readable
  const formatDateIndo = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Priority color accent */}
        <div className={`p-5 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4 ${
          event.prioritas === 'KRITIS'
            ? 'bg-gradient-to-r from-rose-50 via-red-50 to-amber-50 dark:from-rose-950/40 dark:via-red-950/30 dark:to-slate-900'
            : event.prioritas === 'PENTING'
            ? 'bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-slate-900'
            : 'bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-slate-900'
        }`}>
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-black px-2 py-0.5 rounded-md bg-slate-900 text-amber-300">
                {event.kode_kegiatan}
              </span>
              <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${priority.badgeClass}`}>
                Prioritas: {priority.label}
              </span>
              <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${status.badgeClass}`}>
                {status.label}
              </span>
              <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                TA {event.tahun_anggaran}
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-tight">
              {event.nama_kegiatan}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors shrink-0"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Countdown Banner */}
        <div className={`px-6 py-3 border-b flex items-center justify-between gap-3 ${
          countdown.isPast
            ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200'
            : countdown.isToday
            ? 'bg-red-600 text-white font-extrabold'
            : countdown.daysRemaining <= 3
            ? 'bg-amber-500 text-white font-extrabold'
            : 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-100 dark:border-indigo-900 text-indigo-900 dark:text-indigo-200'
        }`}>
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold">
            <Clock className="w-4 h-4 shrink-0" />
            <span>Hitung Mundur Batas Waktu:</span>
          </div>
          <div className="text-xs sm:text-sm font-black tracking-wide">
            {countdown.text}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Tanggal & Batas Waktu Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
            <div>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                Tanggal Mulai Kegiatan
              </span>
              <p className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">
                {formatDateIndo(event.tanggal_mulai)}
              </p>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                Batas Akhir (Deadline)
              </span>
              <p className="font-extrabold text-rose-600 dark:text-rose-400 text-sm">
                {formatDateIndo(event.tanggal_batas)}
                <span className="ml-2 font-mono text-xs px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                  Pukul {event.jam_batas || '23:59'} {event.timezone || 'WIB'}
                </span>
              </p>
            </div>
          </div>

          {/* Kategori & Target Pengguna */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1.5">
                <Tag className="w-3.5 h-3.5 text-emerald-500" />
                Kategori Kegiatan
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800 text-xs">
                {event.kategori}
              </span>
            </div>

            <div>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-500" />
                Target Pengguna / Satker
              </span>
              <div className="flex flex-wrap gap-1.5">
                {event.target_pengguna && event.target_pengguna.length > 0 ? (
                  event.target_pengguna.map((target, idx) => (
                    <span 
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[11px] font-bold font-mono"
                    >
                      {target.replace('_', ' ')}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-400 text-xs">Semua Satker</span>
                )}
              </div>
            </div>
          </div>

          {/* Deskripsi Kegiatan */}
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-500" />
              Deskripsi &amp; Ketentuan Teknis
            </span>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 leading-relaxed text-xs sm:text-sm whitespace-pre-line">
              {event.deskripsi || 'Tidak ada deskripsi rinci.'}
            </div>
          </div>

          {/* Dasar Hukum & Regulasi */}
          <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 space-y-2">
            <span className="text-xs font-extrabold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              Dasar Hukum &amp; Nomor Peraturan
            </span>
            <div className="text-xs text-amber-800 dark:text-amber-200 space-y-1">
              <p className="font-bold">{event.nomor_peraturan || 'Perdirjen LLAT Tahun 2026'}</p>
              <p className="text-[11px] opacity-90">{event.dasar_hukum}</p>
            </div>
          </div>

          {/* Catatan Penting / Mitigasi Risiko */}
          {event.catatan && (
            <div className="p-3.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/60">
              <span className="text-xs font-extrabold text-rose-900 dark:text-rose-300 flex items-center gap-1.5 mb-1">
                <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                Catatan Penting Petugas KPPN / Mitigasi Kendala
              </span>
              <p className="text-xs text-rose-800 dark:text-rose-200 leading-relaxed">
                {event.catatan}
              </p>
            </div>
          )}

          {/* Link Sumber Resmi */}
          {event.sumber_url && (
            <div className="pt-1">
              <a
                href={event.sumber_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-xs font-extrabold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Buka Sumber Resmi / Pengumuman Terkait</span>
              </a>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500 font-mono">
            ID: {event.llat_id} • Status: {event.publikasi}
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(event);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white transition-all shadow-xs"
              >
                Edit Kegiatan
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-xs font-extrabold bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-700 dark:hover:bg-slate-600 transition-all shadow-xs"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
