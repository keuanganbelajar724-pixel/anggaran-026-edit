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
  HelpCircle,
  Share2,
  Bookmark,
  Sparkles,
  Inbox,
  CheckSquare
} from 'lucide-react';
import { LLATEvent } from '../../types/llat';
import { 
  getCountdownInfo, 
  getPriorityBadge, 
  getStatusBadge,
  getVerificationBadge,
  getDeadlineTypeBadge,
  getCompletionBadge 
} from '../../data/defaultLlatData';

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
  const verification = getVerificationBadge(event.status_verifikasi);
  const deadlineType = getDeadlineTypeBadge(event.jenis_tenggat);
  const completion = getCompletionBadge(event.status_penyelesaian);

  // Format date readable
  const formatDateIndo = (dateStr?: string) => {
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
        className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] animate-scale-up"
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
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${verification.badgeClass}`}>
                {verification.label}
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
        <div className={`px-6 py-3 border-b flex flex-wrap items-center justify-between gap-3 ${
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
          {/* Tanggal Penerimaan Dokumen vs Batas Penyelesaian */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
            <div>
              <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 mb-1">
                <Calendar className="w-3.5 h-3.5" />
                Batas Penerimaan Dokumen / Pendaftaran
              </span>
              <p className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                {formatDateIndo(event.tanggal_penerimaan || event.tanggal_batas)}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Pukul {event.jam_penerimaan || event.jam_batas || '17:00'} {event.timezone || 'WIB'}
              </p>
            </div>

            <div>
              <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 mb-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Batas Akhir Penyelesaian / Penerbitan SP2D
              </span>
              <p className="font-extrabold text-indigo-700 dark:text-indigo-300 text-sm">
                {formatDateIndo(event.tanggal_penyelesaian || event.tanggal_batas)}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Pukul {event.jam_penyelesaian || event.jam_batas || '17:00'} {event.timezone || 'WIB'}
              </p>
            </div>
          </div>

          {/* Aturan Relatif jika bukan tanggal pasti */}
          {event.is_tanggal_pasti === false && (
            <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs text-purple-900 dark:text-purple-200 space-y-1">
              <span className="font-black flex items-center gap-1.5 text-purple-800 dark:text-purple-300">
                <Sparkles className="w-4 h-4 text-purple-600" />
                Ketentuan Aturan Relatif:
              </span>
              <p>{event.aturan_relatif || 'Tenggat berlaku sesuai ketentuan penyelesaian bertahap.'}</p>
            </div>
          )}

          {/* Sub Deadlines jika multi-tenggat */}
          {event.sub_deadlines && event.sub_deadlines.length > 0 && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-xs font-black text-slate-700 dark:text-slate-300 block">
                Tahapan Tenggat Kegiatan Induk:
              </span>
              <div className="space-y-1.5">
                {event.sub_deadlines.map((sub) => (
                  <div key={sub.id} className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">{sub.label}</span>
                      <span className="text-[10px] text-slate-400">{sub.jenis}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{sub.tanggal}</span>
                      {sub.jam && <span className="text-[10px] text-slate-400 block">{sub.jam} WIB</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Kategori, Jenis Tenggat, Target Pengguna */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                Kategori Kegiatan
              </span>
              <span className="inline-block px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800 text-xs">
                {event.kategori}
              </span>
            </div>

            <div>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                Jenis Tenggat
              </span>
              <span className={`inline-block px-2.5 py-1 rounded-lg font-bold text-xs ${deadlineType.badgeClass}`}>
                {deadlineType.label}
              </span>
            </div>

            <div>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                Ketentuan Waktu
              </span>
              <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs">
                {event.ketentuan_waktu === 'HARI_KERJA' ? 'Hari Kerja' : event.ketentuan_waktu === 'HARI_KALENDER' ? 'Hari Kalender' : 'Sesuai Ketentuan'}
              </span>
            </div>
          </div>

          {/* Target Pengguna */}
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-500" />
              Sasaran / Pihak Terkait:
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
                <span className="text-slate-400 text-xs">Semua Satuan Kerja</span>
              )}
            </div>
          </div>

          {/* Deskripsi Lengkap */}
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-500" />
              Deskripsi &amp; Prosedur Teknis
            </span>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 leading-relaxed text-xs sm:text-sm whitespace-pre-line">
              {event.deskripsi || 'Tidak ada deskripsi rinci.'}
            </div>
          </div>

          {/* Ketentuan Khusus */}
          {event.ketentuan_khusus && (
            <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60">
              <span className="text-xs font-extrabold text-amber-900 dark:text-amber-300 flex items-center gap-1.5 mb-1">
                <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                Ketentuan Khusus &amp; Syarat Pengajuan
              </span>
              <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                {event.ketentuan_khusus}
              </p>
            </div>
          )}

          {/* Dasar Hukum & Referensi Dokumen Sumber PER-9/PB/2026 */}
          <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Dasar Hukum Resmi &amp; Rujukan PER-9/PB/2026
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 font-bold">
                {event.nomor_peraturan_resmi || event.nomor_peraturan || 'PER-9/PB/2026'}
              </span>
            </div>
            
            <div className="text-xs text-blue-900 dark:text-blue-200 space-y-1.5">
              <p className="font-bold">{event.pasal_bab || 'Ketentuan Pokok PER-9/PB/2026'}</p>
              <p className="text-[11px] opacity-90 leading-relaxed">{event.dasar_hukum}</p>
              
              {event.kutipan_sumber && (
                <div className="p-2.5 rounded-lg bg-white/80 dark:bg-slate-900/60 border border-blue-200/60 dark:border-blue-900/60 text-[11px] italic text-slate-700 dark:text-slate-300">
                  <span className="font-bold not-italic block mb-0.5 text-blue-700 dark:text-blue-300">Kutipan Ketentuan:</span>
                  &ldquo;{event.kutipan_sumber}&rdquo;
                </div>
              )}

              <div className="pt-1.5 mt-1 border-t border-blue-200/60 dark:border-blue-800 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
                <span>Rujukan Peraturan: {event.nomor_peraturan_resmi || 'PER-9/PB/2026'}</span>
                <span className="font-bold text-indigo-700 dark:text-indigo-300">{event.audit_halaman || event.halaman_sumber || 'Dokumen Resmi'}</span>
              </div>
            </div>
          </div>

          {/* Mesin Hitung Hari Kerja & Rumus Tenggat */}
          <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 space-y-1.5 text-xs">
            <span className="font-extrabold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Formula Penentuan Tanggal &amp; Hasil Mesin Hitung:
            </span>
            <div className="p-2.5 rounded-lg bg-white/80 dark:bg-slate-900/60 border border-emerald-200/60 dark:border-emerald-900/60 font-mono text-[11px] text-emerald-900 dark:text-emerald-200 space-y-1">
              <div><span className="text-slate-400">Metode: </span><span className="font-bold text-emerald-700 dark:text-emerald-300">{event.jenis_penentuan_tanggal || (event.ketentuan_waktu === 'HARI_KERJA' ? 'HARI_KERJA' : 'TANGGAL_TETAP')}</span></div>
              <div><span className="text-slate-400">Formula: </span><span className="font-bold text-slate-800 dark:text-slate-200">{event.rumus_penentuan || 'tanggal_agenda = tanggal_tetap_peraturan'}</span></div>
              <div><span className="text-slate-400">Hasil Sistem: </span><span className="font-bold text-indigo-600 dark:text-indigo-400">{event.hasil_perhitungan_sistem || event.tanggal_batas || event.tanggal_penerimaan} ({event.jam_batas || '17:00'} WIB)</span></div>
            </div>
            {event.konsekuensi_keterlambatan && (
              <div className="pt-1 text-[11px] text-rose-700 dark:text-rose-300">
                <span className="font-bold">Konsekuensi Keterlambatan: </span>
                {event.konsekuensi_keterlambatan}
              </div>
            )}
          </div>

          {/* Catatan Penting Petugas KPPN */}
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
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-3">
          <div className="text-[11px] text-slate-400">
            Terakhir diperbarui: {event.updated_at ? new Date(event.updated_at).toLocaleDateString('id-ID') : '-'}
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(event);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs transition-colors shadow-xs"
              >
                Edit Kegiatan
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
