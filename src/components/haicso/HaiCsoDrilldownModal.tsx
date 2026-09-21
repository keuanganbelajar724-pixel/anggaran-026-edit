import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Download,
  Copy,
  Check,
  Ticket,
  CheckCircle2,
  Clock,
  AlertCircle,
  Send,
  Users,
  Mail,
  Building2,
  Filter,
  Eye,
  AlertTriangle,
  FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  HAICSOTicket,
  MasterSatker,
  HAICSOUserTicketSummary,
  HAICSOEmailTicketSummary,
  HAICSOSatkerTicketSummary
} from '../../types';
import {
  computeUserTicketFrequency,
  computeEmailTicketFrequency,
  computeSatkerTicketSummary
} from '../../utils/haiCsoExcelParser';

export type HaiCsoDrilldownType =
  | 'total_tiket'
  | 'selesai'
  | 'menunggu_satker'
  | 'belum_feedback'
  | 'menunggu_kppn'
  | 'kirim_hai'
  | 'total_pengguna'
  | 'total_email'
  | 'satker_bertiket'
  | 'satker_belum_tiket';

interface HaiCsoDrilldownModalProps {
  type: HaiCsoDrilldownType | null;
  onClose: () => void;
  tickets: HAICSOTicket[];
  masterSatkers?: MasterSatker[];
  onSelectTicket?: (ticket: HAICSOTicket) => void;
  onApplyFilter?: (filterType: string, value: string) => void;
  isDark?: boolean;
}

export const HaiCsoDrilldownModal: React.FC<HaiCsoDrilldownModalProps> = ({
  type,
  onClose,
  tickets,
  masterSatkers = [],
  onSelectTicket,
  onApplyFilter,
  isDark = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);

  // Compute sub-datasets based on drill-down type
  const targetTickets = useMemo(() => {
    if (!type) return [];
    switch (type) {
      case 'total_tiket':
        return tickets;
      case 'selesai':
        return tickets.filter(t => (t.status || '').toLowerCase().includes('selesai'));
      case 'menunggu_satker':
        return tickets.filter(t => {
          const s = (t.status || '').toLowerCase();
          return s.includes('respons satker') || s.includes('respon satker');
        });
      case 'belum_feedback':
        return tickets.filter(t => (t.status_feedback || '').toLowerCase().includes('belum'));
      case 'menunggu_kppn':
        return tickets.filter(t => {
          const s = (t.status || '').toLowerCase();
          return s.includes('respon kppn') || s.includes('respons kppn');
        });
      case 'kirim_hai':
        return tickets.filter(t => (t.status || '').toLowerCase().includes('hai'));
      default:
        return [];
    }
  }, [type, tickets]);

  // Search filtered tickets
  const filteredTickets = useMemo(() => {
    if (!searchTerm.trim()) return targetTickets;
    const q = searchTerm.toLowerCase();
    return targetTickets.filter(
      t =>
        t.nomor_referensi.toLowerCase().includes(q) ||
        t.nama_satker.toLowerCase().includes(q) ||
        t.kode_satker.toLowerCase().includes(q) ||
        (t.nama_pengguna || '').toLowerCase().includes(q) ||
        (t.email || '').toLowerCase().includes(q) ||
        (t.subjek || '').toLowerCase().includes(q) ||
        (t.cso || '').toLowerCase().includes(q)
    );
  }, [targetTickets, searchTerm]);

  // Users data
  const usersList: HAICSOUserTicketSummary[] = useMemo(() => {
    if (type !== 'total_pengguna') return [];
    const all = computeUserTicketFrequency(tickets);
    if (!searchTerm.trim()) return all;
    const q = searchTerm.toLowerCase();
    return all.filter(
      u =>
        u.nama_pengguna.toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        u.nama_satker.toLowerCase().includes(q)
    );
  }, [type, tickets, searchTerm]);

  // Emails data
  const emailsList: HAICSOEmailTicketSummary[] = useMemo(() => {
    if (type !== 'total_email') return [];
    const all = computeEmailTicketFrequency(tickets);
    if (!searchTerm.trim()) return all;
    const q = searchTerm.toLowerCase();
    return all.filter(
      e =>
        e.email.toLowerCase().includes(q) ||
        e.nama_pengguna.toLowerCase().includes(q) ||
        e.nama_satker.toLowerCase().includes(q)
    );
  }, [type, tickets, searchTerm]);

  // Satkers with tickets data
  const satkersWithTickets: HAICSOSatkerTicketSummary[] = useMemo(() => {
    if (type !== 'satker_bertiket') return [];
    const all = computeSatkerTicketSummary(tickets);
    if (!searchTerm.trim()) return all;
    const q = searchTerm.toLowerCase();
    return all.filter(
      s =>
        s.nama_satker.toLowerCase().includes(q) ||
        s.kode_satker.toLowerCase().includes(q)
    );
  }, [type, tickets, searchTerm]);

  // Satkers without tickets (belum pernah buat tiket)
  const satkersWithoutTickets = useMemo(() => {
    if (type !== 'satker_belum_tiket') return [];

    // Set of satker codes and lowercase names that have submitted tickets
    const withTicketCodes = new Set<string>();
    const withTicketNames = new Set<string>();
    tickets.forEach(t => {
      if (t.kode_satker) withTicketCodes.add(t.kode_satker.trim());
      if (t.nama_satker) withTicketNames.add(t.nama_satker.trim().toLowerCase());
    });

    // Filter master satkers
    const uncontacted = masterSatkers.filter(m => {
      const code = (m.kodeSatker || '').trim();
      const name = (m.namaSatker || '').trim().toLowerCase();
      return !withTicketCodes.has(code) && !withTicketNames.has(name);
    });

    if (!searchTerm.trim()) return uncontacted;
    const q = searchTerm.toLowerCase();
    return uncontacted.filter(
      m =>
        (m.kodeSatker || '').toLowerCase().includes(q) ||
        (m.namaSatker || '').toLowerCase().includes(q) ||
        (m.kementerianLembaga || '').toLowerCase().includes(q)
    );
  }, [type, tickets, masterSatkers, searchTerm]);

  if (!type) return null;

  // Metadata per type
  const getHeaderMeta = () => {
    switch (type) {
      case 'total_tiket':
        return {
          title: 'Daftar Seluruh Tiket HAICSO',
          subtitle: `Menampilkan total ${tickets.length} tiket yang tercatat di sistem`,
          badge: `${filteredTickets.length} Tiket`,
          icon: Ticket,
          iconBg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
          color: 'slate'
        };
      case 'selesai':
        return {
          title: 'Daftar Tiket: Selesai (IKU KPPN)',
          subtitle: `Tiket yang telah berhasil diselesaikan tuntas oleh CSO/KPPN (${targetTickets.length} tiket)`,
          badge: `${filteredTickets.length} Tiket Selesai`,
          icon: CheckCircle2,
          iconBg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
          color: 'emerald'
        };
      case 'menunggu_satker':
        return {
          title: 'Daftar Tiket: Menunggu Respons Satker',
          subtitle: `Tiket yang sedang menunggu respon, dokumen, atau konfirmasi dari pihak Satker (${targetTickets.length} tiket)`,
          badge: `${filteredTickets.length} Tiket Menunggu Satker`,
          icon: Clock,
          iconBg: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
          color: 'amber'
        };
      case 'belum_feedback':
        return {
          title: 'Daftar Tiket: Belum Memberikan Feedback',
          subtitle: `Tiket yang sudah dijawab/ditangani tetapi satker belum mengisi rating kepuasan feedback (${targetTickets.length} tiket)`,
          badge: `${filteredTickets.length} Tiket Belum Feedback`,
          icon: AlertCircle,
          iconBg: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400',
          color: 'rose'
        };
      case 'menunggu_kppn':
        return {
          title: 'Daftar Tiket: Menunggu Respon KPPN',
          subtitle: `Tiket yang sedang dalam proses penanganan internal petugas CSO / KPPN (${targetTickets.length} tiket)`,
          badge: `${filteredTickets.length} Tiket Menunggu KPPN`,
          icon: AlertTriangle,
          iconBg: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
          color: 'blue'
        };
      case 'kirim_hai':
        return {
          title: 'Daftar Tiket: Kirim ke HAI Pusat',
          subtitle: `Tiket yang dieskalasi ke tingkat Kantor Pusat DJPb / HAI Kemenkeu (${targetTickets.length} tiket)`,
          badge: `${filteredTickets.length} Tiket Kirim ke HAI`,
          icon: Send,
          iconBg: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400',
          color: 'purple'
        };
      case 'total_pengguna':
        return {
          title: 'Daftar Seluruh Pengguna Pembuat Tiket',
          subtitle: `Rincian seluruh pemohon/user yang pernah mengajukan tiket HAICSO (${usersList.length} orang)`,
          badge: `${usersList.length} Pengguna`,
          icon: Users,
          iconBg: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
          color: 'amber'
        };
      case 'total_email':
        return {
          title: 'Daftar Seluruh Email Akun Pengirim Tiket',
          subtitle: `Rincian seluruh akun email satker yang tercatat membuat tiket (${emailsList.length} email)`,
          badge: `${emailsList.length} Akun Email`,
          icon: Mail,
          iconBg: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
          color: 'blue'
        };
      case 'satker_bertiket':
        return {
          title: 'Analisis Satker Yang Pernah Mengajukan Tiket',
          subtitle: `Daftar seluruh Satuan Kerja yang aktif berkonsultasi via tiket HAICSO (${satkersWithTickets.length} Satker)`,
          badge: `${satkersWithTickets.length} Satker Bertiket`,
          icon: Building2,
          iconBg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
          color: 'emerald'
        };
      case 'satker_belum_tiket':
        return {
          title: 'Analisis Satker Yang Belum Pernah Bertiket',
          subtitle: `Daftar Satker binaan KPPN yang tercatat belum pernah mengajukan tiket HAICSO (${satkersWithoutTickets.length} Satker)`,
          badge: `${satkersWithoutTickets.length} Satker Belum Bertiket`,
          icon: Building2,
          iconBg: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400',
          color: 'rose'
        };
    }
  };

  const meta = getHeaderMeta();
  const HeaderIcon = meta.icon;

  // Export to Excel handler
  const handleExportExcel = () => {
    let exportData: Record<string, any>[] = [];
    let filename = `Data_HAICSO_${type}_${new Date().toISOString().slice(0, 10)}.xlsx`;

    if (
      type === 'total_tiket' ||
      type === 'selesai' ||
      type === 'menunggu_satker' ||
      type === 'belum_feedback' ||
      type === 'menunggu_kppn' ||
      type === 'kirim_hai'
    ) {
      exportData = filteredTickets.map((t, idx) => ({
        No: idx + 1,
        'No. Referensi': t.nomor_referensi,
        'Nomor Tiket': t.nomor,
        'Kode Satker': t.kode_satker,
        'Nama Satker': t.nama_satker,
        'Nama Pemohon': t.nama_pengguna,
        Email: t.email,
        'Tanggal Tiket': t.tanggal_tiket,
        Triwulan: t.triwulan,
        Tahun: t.tahun,
        Subjek: t.subjek,
        'Status Utama': t.status,
        'Status Feedback': t.status_feedback,
        CSO: t.cso
      }));
    } else if (type === 'total_pengguna') {
      exportData = usersList.map((u, idx) => ({
        No: idx + 1,
        'Nama Pengguna': u.nama_pengguna,
        Email: u.email,
        'Satuan Kerja': u.nama_satker,
        'Total Tiket': u.totalTiket,
        Selesai: u.selesai,
        'Menunggu Satker': u.menungguSatker,
        'Belum Feedback': u.belumFeedback
      }));
    } else if (type === 'total_email') {
      exportData = emailsList.map((e, idx) => ({
        No: idx + 1,
        'Alamat Email': e.email,
        'Nama Pemohon Terkait': e.nama_pengguna,
        'Satuan Kerja': e.nama_satker,
        'Total Tiket': e.totalTiket,
        Selesai: e.selesai,
        'Belum Selesai': e.belumSelesai,
        'Belum Feedback': e.belumFeedback
      }));
    } else if (type === 'satker_bertiket') {
      exportData = satkersWithTickets.map((s, idx) => ({
        No: idx + 1,
        'Kode Satker': s.kode_satker,
        'Nama Satker': s.nama_satker,
        'Total Tiket': s.totalTiket,
        Selesai: s.selesai,
        'Menunggu Satker': s.menungguSatker,
        'Belum Feedback': s.belumFeedback,
        'Menunggu KPPN': s.menungguKppn,
        'Kirim ke HAI': s.kirimHai,
        '% Selesai': `${s.totalTiket > 0 ? Math.round((s.selesai / s.totalTiket) * 100) : 0}%`
      }));
    } else if (type === 'satker_belum_tiket') {
      exportData = satkersWithoutTickets.map((m, idx) => ({
        No: idx + 1,
        'Kode Satker': m.kodeSatker,
        'Nama Satker': m.namaSatker,
        'Kementerian / Lembaga': m.kementerianLembaga || '-',
        'Status Tiket HAICSO': 'Belum Pernah Mengajukan Tiket (0 Tiket)'
      }));
    }

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rincian Data');
    XLSX.writeFile(wb, filename);
  };

  // Copy list text handler
  const handleCopyList = () => {
    let text = '';
    if (
      type === 'total_tiket' ||
      type === 'selesai' ||
      type === 'menunggu_satker' ||
      type === 'belum_feedback' ||
      type === 'menunggu_kppn' ||
      type === 'kirim_hai'
    ) {
      text = filteredTickets
        .map(
          (t, i) =>
            `${i + 1}. [${t.nomor_referensi}] ${t.nama_satker} (${t.kode_satker}) - ${t.nama_pengguna}: "${t.subjek}" [Status: ${t.status}]`
        )
        .join('\n');
    } else if (type === 'total_pengguna') {
      text = usersList
        .map((u, i) => `${i + 1}. ${u.nama_pengguna} (${u.email || '-'}) - ${u.nama_satker}: ${u.totalTiket} Tiket`)
        .join('\n');
    } else if (type === 'total_email') {
      text = emailsList
        .map((e, i) => `${i + 1}. ${e.email} - ${e.nama_pengguna} (${e.nama_satker}): ${e.totalTiket} Tiket`)
        .join('\n');
    } else if (type === 'satker_bertiket') {
      text = satkersWithTickets
        .map((s, i) => `${i + 1}. [${s.kode_satker}] ${s.nama_satker}: ${s.totalTiket} Tiket (Selesai: ${s.selesai})`)
        .join('\n');
    } else if (type === 'satker_belum_tiket') {
      text = satkersWithoutTickets
        .map((m, i) => `${i + 1}. [${m.kodeSatker}] ${m.namaSatker} (${m.kementerianLembaga || 'KL'}) - Belum Pernah Buat Tiket`)
        .join('\n');
    }

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isTicketType =
    type === 'total_tiket' ||
    type === 'selesai' ||
    type === 'menunggu_satker' ||
    type === 'belum_feedback' ||
    type === 'menunggu_kppn' ||
    type === 'kirim_hai';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/90 dark:bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${meta.iconBg}`}>
              <HeaderIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {meta.title}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                  {meta.badge}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {meta.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 transition-colors"
              title="Unduh data rincian ini ke Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export Excel</span>
            </button>

            <button
              onClick={handleCopyList}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition-colors"
              title="Salin daftar teks ke clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tersalin!' : 'Salin Teks'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              title="Tutup (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder={
                isTicketType
                  ? 'Cari no referensi, satker, pemohon, email, subjek, cso...'
                  : type === 'total_pengguna'
                  ? 'Cari nama pengguna, email, atau satker...'
                  : type === 'total_email'
                  ? 'Cari alamat email, nama pemohon, atau satker...'
                  : type === 'satker_bertiket'
                  ? 'Cari nama satker atau kode satker...'
                  : 'Cari kode, nama satker, kementerian/lembaga...'
              }
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              autoFocus
            />
          </div>

          <div className="flex items-center gap-2">
            {isTicketType && onApplyFilter && (
              <button
                type="button"
                onClick={() => {
                  if (type === 'selesai') onApplyFilter('status', 'Selesai');
                  else if (type === 'menunggu_satker') onApplyFilter('status', 'Menunggu Satker');
                  else if (type === 'belum_feedback') onApplyFilter('feedback', 'BELUM');
                  else if (type === 'menunggu_kppn') onApplyFilter('status', 'Menunggu KPPN');
                  else if (type === 'kirim_hai') onApplyFilter('status', 'Kirim ke HAI');
                  else if (type === 'total_tiket') onApplyFilter('reset', 'ALL');
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition-all"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Terapkan ke Dashboard & Tutup</span>
              </button>
            )}

            <button
              onClick={handleExportExcel}
              className="sm:hidden inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Tables based on Type */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {/* CASE 1: TICKETS LIST (Total, Selesai, Menunggu Satker, Belum Feedback, Menunggu KPPN, Kirim ke HAI) */}
          {isTicketType && (
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold uppercase text-[10px] sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3 text-center w-10">No</th>
                    <th className="py-2.5 px-3 w-28">No. Referensi</th>
                    <th className="py-2.5 px-3">Satuan Kerja</th>
                    <th className="py-2.5 px-3 w-16 text-center">Kode</th>
                    <th className="py-2.5 px-3">Pemohon & Email</th>
                    <th className="py-2.5 px-3">Subjek / Masalah</th>
                    <th className="py-2.5 px-3 text-center">Status Utama</th>
                    <th className="py-2.5 px-3 text-center">Feedback</th>
                    <th className="py-2.5 px-3">CSO</th>
                    <th className="py-2.5 px-3 text-center w-16">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                  {filteredTickets.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400">
                        Tidak ada tiket yang cocok dengan pencarian kata kunci "{searchTerm}".
                      </td>
                    </tr>
                  ) : (
                    filteredTickets.map((t, idx) => {
                      const isSelesai = (t.status || '').toLowerCase().includes('selesai');
                      const isMenungguSatker =
                        (t.status || '').toLowerCase().includes('respons satker') ||
                        (t.status || '').toLowerCase().includes('respon satker');
                      const isMenungguKppn =
                        (t.status || '').toLowerCase().includes('respon kppn') ||
                        (t.status || '').toLowerCase().includes('respons kppn');
                      const isKirimHai = (t.status || '').toLowerCase().includes('hai');
                      const isBelumFeedback = (t.status_feedback || '').toLowerCase().includes('belum');

                      return (
                        <tr
                          key={t.id}
                          className="hover:bg-amber-50/50 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-2.5 px-3 text-center text-slate-500 font-mono text-[11px]">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-amber-700 dark:text-amber-400">
                            {t.nomor_referensi}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">
                              {t.nama_satker}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {t.tanggal_tiket} • {t.triwulan}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-medium text-slate-600 dark:text-slate-400">
                            {t.kode_satker}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-medium text-slate-800 dark:text-slate-200">
                              {t.nama_pengguna || '-'}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              {t.email || '-'}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 max-w-xs">
                            <div className="text-slate-700 dark:text-slate-300 line-clamp-2" title={t.subjek}>
                              {t.subjek}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                isSelesai
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                                  : isMenungguSatker
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300'
                                  : isMenungguKppn
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300'
                                  : isKirimHai
                                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300'
                                  : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                              }`}
                            >
                              {t.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                                isBelumFeedback
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-900'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900'
                              }`}
                            >
                              {t.status_feedback || 'Belum'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 text-[11px]">
                            {t.cso || '-'}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {onSelectTicket && (
                              <button
                                type="button"
                                onClick={() => onSelectTicket(t)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold bg-slate-100 hover:bg-amber-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                              >
                                <Eye className="w-3 h-3 text-amber-600" />
                                <span>Detail</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* CASE 2: TOTAL PENGGUNA LIST */}
          {type === 'total_pengguna' && (
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold uppercase text-[10px] sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3 text-center w-12">No</th>
                    <th className="py-2.5 px-3">Nama Pengguna (Pemohon)</th>
                    <th className="py-2.5 px-3">Alamat Email</th>
                    <th className="py-2.5 px-3">Satuan Kerja</th>
                    <th className="py-2.5 px-3 text-center">Total Tiket</th>
                    <th className="py-2.5 px-3 text-center text-emerald-600">Selesai</th>
                    <th className="py-2.5 px-3 text-center text-amber-600">Menunggu Satker</th>
                    <th className="py-2.5 px-3 text-center text-rose-600">Belum Feedback</th>
                    <th className="py-2.5 px-3 text-center w-24">Filter</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                  {usersList.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        Tidak ditemukan pengguna dengan pencarian "{searchTerm}".
                      </td>
                    </tr>
                  ) : (
                    usersList.map((u, idx) => (
                      <tr key={idx} className="hover:bg-amber-50/40 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 text-center text-slate-500 font-mono">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-slate-100">
                          {u.nama_pengguna}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400 text-[11px]">
                          {u.email || '-'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">{u.nama_satker}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-amber-600 dark:text-amber-400">
                          {u.totalTiket} kali
                        </td>
                        <td className="py-2.5 px-3 text-center font-semibold text-emerald-600">{u.selesai}</td>
                        <td className="py-2.5 px-3 text-center font-semibold text-amber-600">{u.menungguSatker}</td>
                        <td className="py-2.5 px-3 text-center font-semibold text-rose-600">{u.belumFeedback}</td>
                        <td className="py-2.5 px-3 text-center">
                          {onApplyFilter && (
                            <button
                              type="button"
                              onClick={() => {
                                onApplyFilter('user', u.nama_pengguna);
                                onClose();
                              }}
                              className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-300 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300 transition-colors"
                            >
                              Lihat Tiket
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* CASE 3: TOTAL EMAIL LIST */}
          {type === 'total_email' && (
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold uppercase text-[10px] sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3 text-center w-12">No</th>
                    <th className="py-2.5 px-3">Alamat Email</th>
                    <th className="py-2.5 px-3">Nama Pemohon Terkait</th>
                    <th className="py-2.5 px-3">Satuan Kerja</th>
                    <th className="py-2.5 px-3 text-center">Frekuensi Tiket</th>
                    <th className="py-2.5 px-3 text-center text-emerald-600">Selesai</th>
                    <th className="py-2.5 px-3 text-center text-amber-600">Belum Selesai</th>
                    <th className="py-2.5 px-3 text-center text-rose-600">Belum Feedback</th>
                    <th className="py-2.5 px-3 text-center w-24">Filter</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                  {emailsList.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        Tidak ditemukan email dengan pencarian "{searchTerm}".
                      </td>
                    </tr>
                  ) : (
                    emailsList.map((e, idx) => (
                      <tr key={idx} className="hover:bg-blue-50/40 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 text-center text-slate-500 font-mono">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-blue-700 dark:text-blue-400">
                          {e.email}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">
                          {e.nama_pengguna}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">{e.nama_satker}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-blue-600 dark:text-blue-400">
                          {e.totalTiket} kali
                        </td>
                        <td className="py-2.5 px-3 text-center font-semibold text-emerald-600">{e.selesai}</td>
                        <td className="py-2.5 px-3 text-center font-semibold text-amber-600">{e.belumSelesai}</td>
                        <td className="py-2.5 px-3 text-center font-semibold text-rose-600">{e.belumFeedback}</td>
                        <td className="py-2.5 px-3 text-center">
                          {onApplyFilter && (
                            <button
                              type="button"
                              onClick={() => {
                                onApplyFilter('email', e.email);
                                onClose();
                              }}
                              className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-300 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-300 transition-colors"
                            >
                              Lihat Tiket
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* CASE 4: SATKER BERTIKET LIST */}
          {type === 'satker_bertiket' && (
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold uppercase text-[10px] sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3 text-center w-12">No</th>
                    <th className="py-2.5 px-3">Nama Satuan Kerja</th>
                    <th className="py-2.5 px-3 text-center w-20">Kode</th>
                    <th className="py-2.5 px-3 text-center">Total Tiket</th>
                    <th className="py-2.5 px-3 text-center text-emerald-600">Selesai</th>
                    <th className="py-2.5 px-3 text-center text-amber-600">Menunggu Satker</th>
                    <th className="py-2.5 px-3 text-center text-rose-600">Belum Feedback</th>
                    <th className="py-2.5 px-3 text-center text-blue-600">Menunggu KPPN</th>
                    <th className="py-2.5 px-3 text-center text-purple-600">Kirim HAI</th>
                    <th className="py-2.5 px-3 text-center">Tingkat Selesai</th>
                    <th className="py-2.5 px-3 text-center w-24">Filter</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                  {satkersWithTickets.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-slate-400">
                        Tidak ditemukan Satker bertiket dengan pencarian "{searchTerm}".
                      </td>
                    </tr>
                  ) : (
                    satkersWithTickets.map((s, idx) => (
                      <tr key={idx} className="hover:bg-emerald-50/40 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 text-center text-slate-500 font-mono">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-slate-100">
                          {s.nama_satker}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-600 dark:text-slate-400 font-semibold">
                          {s.kode_satker}
                        </td>
                        <td className="py-2.5 px-3 text-center font-extrabold text-slate-900 dark:text-slate-100">
                          {s.totalTiket}
                        </td>
                        <td className="py-2.5 px-3 text-center font-semibold text-emerald-600">{s.selesai}</td>
                        <td className="py-2.5 px-3 text-center font-semibold text-amber-600">{s.menungguSatker}</td>
                        <td className="py-2.5 px-3 text-center font-semibold text-rose-600">{s.belumFeedback}</td>
                        <td className="py-2.5 px-3 text-center font-semibold text-blue-600">{s.menungguKppn}</td>
                        <td className="py-2.5 px-3 text-center font-semibold text-purple-600">{s.kirimHai}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="font-bold text-emerald-600">
                            {s.totalTiket > 0 ? Math.round((s.selesai / s.totalTiket) * 100) : 0}%
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {onApplyFilter && (
                            <button
                              type="button"
                              onClick={() => {
                                onApplyFilter('satker', s.nama_satker);
                                onClose();
                              }}
                              className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 transition-colors"
                            >
                              Lihat Tiket
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* CASE 5: SATKER BELUM PERNAH TIKET (ANALISIS SATKER BELUM NIKET) */}
          {type === 'satker_belum_tiket' && (
            <div className="space-y-4">
              {/* Insight Banner */}
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-bold">Analisis Kepatuhan & Keaktifan Satker:</span>
                  <p className="mt-1 text-slate-700 dark:text-slate-300">
                    Daftar di bawah ini adalah satuan kerja binaan KPPN yang <strong>belum pernah tercatat membuat tiket layanan HAICSO</strong> dalam basis data periode ini. Satker ini dapat diprioritaskan untuk sosialisasi tata cara konsultasi digital, asistensi kendala sistem (SAKTI/SPAN), atau konfirmasi apakah mereka menyelesaikan kendala secara langsung (tatap muka).
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold uppercase text-[10px] sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3 text-center w-12">No</th>
                      <th className="py-2.5 px-3 w-24 text-center">Kode Satker</th>
                      <th className="py-2.5 px-3">Nama Satuan Kerja</th>
                      <th className="py-2.5 px-3">Kementerian / Lembaga</th>
                      <th className="py-2.5 px-3 text-center">Status Tiket HAICSO</th>
                      <th className="py-2.5 px-3 text-center w-36">Tindakan KPPN</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                    {satkersWithoutTickets.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          {searchTerm
                            ? `Tidak ada Satker yang sesuai dengan kata kunci "${searchTerm}".`
                            : 'Hebat! Seluruh Satker binaan KPPN telah tercatat pernah membuat tiket konsultasi HAICSO.'}
                        </td>
                      </tr>
                    ) : (
                      satkersWithoutTickets.map((m, idx) => (
                        <tr key={m.kodeSatker || idx} className="hover:bg-rose-50/40 dark:hover:bg-slate-800/40">
                          <td className="py-2.5 px-3 text-center text-slate-500 font-mono">{idx + 1}</td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900 dark:text-slate-100">
                            {m.kodeSatker}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">
                            {m.namaSatker}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                            {m.kementerianLembaga || 'Kementerian/Lembaga Terkait'}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/50 dark:border-rose-900 dark:text-rose-300">
                              0 Tiket (Belum Pernah)
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="text-[11px] text-slate-500 font-medium italic">
                              Perlu Sosialisasi / FO
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/50 flex items-center justify-between">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Tekan <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[10px] font-mono">Esc</kbd> untuk menutup rincian
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
