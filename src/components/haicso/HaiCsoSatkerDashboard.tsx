import React, { useState, useMemo } from 'react';
import {
  Ticket,
  Search,
  Filter,
  Download,
  AlertCircle,
  Clock,
  Eye,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Info,
  CheckCircle2,
  ArrowUpDown
} from 'lucide-react';
import { HAICSOTicket } from '../../types';
import { exportHaiCsoSatkerPDF } from '../../utils/haiCsoExportHelper';
import { HaiCsoTicketDetailModal } from './HaiCsoTicketDetailModal';

interface HaiCsoSatkerDashboardProps {
  tickets: HAICSOTicket[];
  isDark?: boolean;
}

export const HaiCsoSatkerDashboard: React.FC<HaiCsoSatkerDashboardProps> = ({
  tickets,
  isDark = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<HAICSOTicket | null>(null);
  const [sortOrder, setSortOrder] = useState<'oldest' | 'newest'>('oldest');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // STRICT FILTER FOR SATKER DASHBOARD:
  // ONLY include tickets that need Satker follow-up:
  // - status 'Menunggu konfirmasi/respons Satker'
  // - OR status_feedback 'Belum ada feedback'
  const satkerTickets = useMemo(() => {
    return tickets.filter(t => {
      const s = (t.status || '').toLowerCase();
      const fb = (t.status_feedback || '').toLowerCase();
      const isMenungguSatker = s.includes('respons satker') || s.includes('respon satker');
      const isBelumFeedback = fb.includes('belum');
      return isMenungguSatker || isBelumFeedback;
    });
  }, [tickets]);

  // Compute 3 summary metrics for Satker view
  const summaryMetrics = useMemo(() => {
    let menungguResponsCount = 0;
    let belumFeedbackCount = 0;

    satkerTickets.forEach(t => {
      const s = (t.status || '').toLowerCase();
      const fb = (t.status_feedback || '').toLowerCase();
      if (s.includes('respons satker') || s.includes('respon satker')) {
        menungguResponsCount++;
      }
      if (fb.includes('belum')) {
        belumFeedbackCount++;
      }
    });

    return {
      menungguResponsCount,
      belumFeedbackCount,
      totalTindakLanjut: satkerTickets.length
    };
  }, [satkerTickets]);

  // Search & Filtered Tickets
  const filteredTickets = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    let result = satkerTickets;

    if (q) {
      result = result.filter(t => {
        return (
          t.nama_satker.toLowerCase().includes(q) ||
          t.kode_satker.toLowerCase().includes(q) ||
          t.nama_pengguna.toLowerCase().includes(q) ||
          t.email.toLowerCase().includes(q) ||
          t.nomor_referensi.toLowerCase().includes(q) ||
          t.subjek.toLowerCase().includes(q)
        );
      });
    }

    // Default sort: Oldest ticket first (paling lama terlebih dahulu)
    return [...result].sort((a, b) => {
      const timeA = new Date(a.tanggal_tiket).getTime() || 0;
      const timeB = new Date(b.tanggal_tiket).getTime() || 0;
      return sortOrder === 'oldest' ? timeA - timeB : timeB - timeA;
    });
  }, [satkerTickets, searchQuery, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredTickets.length / pageSize) || 1;
  const paginatedTickets = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTickets.slice(start, start + pageSize);
  }, [filteredTickets, currentPage, pageSize]);

  const handleDownloadPDF = () => {
    exportHaiCsoSatkerPDF(filteredTickets, {
      customTitle: 'MONITORING TIKET HAICSO',
      customSubtitle: 'DAFTAR TIKET YANG MEMERLUKAN TINDAK LANJUT SATKER (MENUNGGU RESPONS / BELUM ADA FEEDBACK)',
      periodeLabel: 'Tahun 2026',
      filename: `Tiket_HAICSO_Tindak_Lanjut_Satker_${new Date().toISOString().substring(0, 10)}.pdf`
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-700 dark:text-amber-300 flex-shrink-0 mt-0.5">
            <Ticket className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Monitoring Tiket Layanan HAICSO Satker
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
              Daftar tiket yang masih membutuhkan konfirmasi, respons, atau feedback dari Satuan Kerja agar statusnya dapat diselesaikan (selesai) untuk pencapaian IKU KPPN.
            </p>
          </div>
        </div>

        <button
          onClick={handleDownloadPDF}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-amber-600/20 transition-all flex-shrink-0 self-stretch sm:self-auto justify-center"
        >
          <Download className="w-4 h-4" />
          <span>Download PDF Belum Selesai</span>
        </button>
      </div>

      {/* 3 Summary Cards for Satker */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Menunggu Respons Satker */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              Tiket Menunggu Respons Satker
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/80 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
              {summaryMetrics.menungguResponsCount}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Tiket</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
            Memerlukan tanggapan / verifikasi perbaikan dari Satker
          </p>
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-amber-500/5 rounded-full pointer-events-none" />
        </div>

        {/* Card 2: Belum Ada Feedback */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
              Belum Ada Feedback
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950/80 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
              {summaryMetrics.belumFeedbackCount}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Tiket</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
            Satker belum memberikan rating feedback di portal HAICSO
          </p>
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-rose-500/5 rounded-full pointer-events-none" />
        </div>

        {/* Card 3: Total Perlu Ditindaklanjuti */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Total Perlu Ditindaklanjuti
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
              <Ticket className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
              {summaryMetrics.totalTindakLanjut}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Tiket</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
            Prioritas penanganan agar indikator IKU KPPN tercapai optimal
          </p>
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-slate-500/5 rounded-full pointer-events-none" />
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {/* Table Controls Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/20">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari Satker, Kode, Nama, Email, No Ref, Subjek..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            />
          </div>

          {/* Sort & Count */}
          <div className="flex items-center justify-between sm:justify-end gap-3">
            <button
              onClick={() => setSortOrder(prev => prev === 'oldest' ? 'newest' : 'oldest')}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              title="Urutkan tanggal tiket"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
              <span>
                Urutan: {sortOrder === 'oldest' ? 'Paling Lama Dahulu' : 'Terbaru Dahulu'}
              </span>
            </button>

            <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
              Menampilkan <strong>{filteredTickets.length}</strong> tiket
            </span>
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3.5 text-center w-12">No</th>
                <th className="py-3 px-3.5">Satuan Kerja</th>
                <th className="py-3 px-3.5 text-center w-20">Kode</th>
                <th className="py-3 px-3.5">Pemohon</th>
                <th className="py-3 px-3.5">Tanggal Tiket</th>
                <th className="py-3 px-3.5">No. Referensi</th>
                <th className="py-3 px-3.5">Subjek Tiket</th>
                <th className="py-3 px-3.5 text-center">Status</th>
                <th className="py-3 px-3.5 text-center w-20">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
              {paginatedTickets.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 dark:text-slate-500 text-sm">
                    Tidak ada tiket yang memerlukan tindak lanjut Satker.
                  </td>
                </tr>
              ) : (
                paginatedTickets.map((t, idx) => {
                  const itemIndex = (currentPage - 1) * pageSize + idx + 1;
                  const isMenungguSatker = (t.status || '').toLowerCase().includes('respons satker') || (t.status || '').toLowerCase().includes('respon satker');
                  const isBelumFeedback = (t.status_feedback || '').toLowerCase().includes('belum');

                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-3.5 text-center text-xs text-slate-500 font-medium">
                        {itemIndex}
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">
                          {t.nama_satker || 'Satker'}
                        </div>
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {t.kode_satker || '-'}
                        </span>
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="font-medium text-slate-900 dark:text-slate-100">
                          {t.nama_pengguna || '-'}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          {t.email || '-'}
                        </div>
                      </td>
                      <td className="py-3 px-3.5 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {t.tanggal_tiket}
                      </td>
                      <td className="py-3 px-3.5 font-mono text-xs font-bold text-amber-700 dark:text-amber-400 whitespace-nowrap">
                        {t.nomor_referensi}
                      </td>
                      <td className="py-3 px-3.5">
                        <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2 leading-relaxed">
                          {t.subjek}
                        </p>
                      </td>
                      <td className="py-3 px-3.5 text-center whitespace-nowrap">
                        <div className="flex flex-col items-center gap-1">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              isMenungguSatker
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {t.status}
                          </span>
                          {isBelumFeedback && (
                            <span className="inline-block px-2 py-0.5 rounded text-[9px] font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                              Belum Feedback
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <button
                          onClick={() => setSelectedTicket(t)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-500" />
                          <span>Detail</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>
              Halaman <strong>{currentPage}</strong> dari <strong>{totalPages}</strong>
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <HaiCsoTicketDetailModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
        />
      )}
    </div>
  );
};
