import React from 'react';
import {
  X,
  Ticket,
  Calendar,
  Building2,
  User,
  Mail,
  CheckCircle2,
  Clock,
  AlertCircle,
  Send,
  HelpCircle,
  FileText,
  ShieldCheck,
  Hash
} from 'lucide-react';
import { HAICSOTicket } from '../../types';

interface HaiCsoTicketDetailModalProps {
  ticket: HAICSOTicket | null;
  onClose: () => void;
}

export const HaiCsoTicketDetailModal: React.FC<HaiCsoTicketDetailModalProps> = ({
  ticket,
  onClose
}) => {
  if (!ticket) return null;

  const isSelesai = ticket.status.toLowerCase().includes('selesai');
  const isMenungguSatker = ticket.status.toLowerCase().includes('respons satker') || ticket.status.toLowerCase().includes('respon satker');
  const isMenungguKppn = ticket.status.toLowerCase().includes('respon kppn') || ticket.status.toLowerCase().includes('respons kppn');
  const isKirimHai = ticket.status.toLowerCase().includes('hai');
  const isBelumFeedback = (ticket.status_feedback || '').toLowerCase().includes('belum');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Rincian Tiket HAICSO
                </h3>
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {ticket.nomor_referensi}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tiket No. #{ticket.nomor} • Periode {ticket.triwulan} ({ticket.tahun})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Status Badges Bar */}
          <div className="flex flex-wrap items-center gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60">
            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block mb-1">
                Status Utama:
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  isSelesai
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                    : isMenungguSatker
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                    : isMenungguKppn
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-700'
                    : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-300 dark:border-purple-700'
                }`}
              >
                {isSelesai && <CheckCircle2 className="w-3.5 h-3.5" />}
                {isMenungguSatker && <AlertCircle className="w-3.5 h-3.5" />}
                {isMenungguKppn && <Clock className="w-3.5 h-3.5" />}
                {isKirimHai && <Send className="w-3.5 h-3.5" />}
                {ticket.status}
              </span>
            </div>

            <div className="border-l border-slate-200 dark:border-slate-700 pl-3">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block mb-1">
                Status Feedback:
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  isBelumFeedback
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-700'
                    : 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border border-teal-300 dark:border-teal-700'
                }`}
              >
                {isBelumFeedback ? <AlertCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                {ticket.status_feedback || 'Belum ada feedback'}
              </span>
            </div>

            <div className="border-l border-slate-200 dark:border-slate-700 pl-3 ml-auto">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block mb-1">
                Petugas CSO:
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                {ticket.cso || 'HAI CSO KPPN'}
              </span>
            </div>
          </div>

          {/* Subjek Tiket */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Subjek Tiket
            </label>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-relaxed">
                {ticket.subjek || 'Tidak ada subjek tertulis'}
              </p>
            </div>
          </div>

          {/* Informasi Satker & Pengguna Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Satker Box */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-semibold">
                <Building2 className="w-4 h-4 text-amber-500" />
                <span>Satuan Kerja</span>
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">
                {ticket.nama_satker || 'Satuan Kerja'}
              </p>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs text-slate-500 dark:text-slate-400">Kode Satker:</span>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  {ticket.kode_satker || '-'}
                </span>
              </div>
            </div>

            {/* Pemohon Tiket Box */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-semibold">
                <User className="w-4 h-4 text-blue-500" />
                <span>Pemohon Tiket</span>
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">
                {ticket.nama_pengguna || 'Pengguna'}
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 pt-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-mono break-all">{ticket.email || '-'}</span>
              </div>
            </div>
          </div>

          {/* Tanggal & Waktu Box */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-emerald-500" />
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block">Tanggal Pembuatan Tiket</span>
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {ticket.tanggal_tiket}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 dark:text-slate-400 block">Triwulan</span>
              <span className="text-xs font-bold px-2.5 py-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                {ticket.triwulan}
              </span>
            </div>
          </div>

          {/* Detail / Riwayat Percakapan */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Catatan & Tindak Lanjut Tiket
            </label>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">
              {ticket.detail || 'Tidak ada catatan detail tambahan.'}
            </div>
          </div>

          {/* Tindak Lanjut Recommendation Alert if Belum Selesai */}
          {(!isSelesai || isBelumFeedback) && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold mb-0.5">Perhatian Tindak Lanjut Satker</p>
                <p className="leading-relaxed">
                  Tiket ini memerlukan konfirmasi dan feedback dari Satuan Kerja terkait agar tiket dapat ditutup dengan status <strong>Selesai</strong> dan terhitung dalam pencapaian IKU KPPN Semarang I.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
