import React, { useState, useMemo } from 'react';
import { 
  Clock, 
  Calendar, 
  Tag, 
  Users, 
  ArrowUpDown, 
  ChevronRight, 
  Search,
  ExternalLink,
  SlidersHorizontal,
  FileText,
  Filter,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Eye
} from 'lucide-react';
import { LLATEvent, LLATCategory } from '../../types/llat';
import { 
  getCountdownInfo, 
  getPriorityBadge, 
  getStatusBadge,
  getVerificationBadge,
  getDeadlineTypeBadge 
} from '../../data/defaultLlatData';

interface LLATListViewProps {
  events: LLATEvent[];
  categories?: LLATCategory[];
  onSelectEvent: (event: LLATEvent) => void;
  searchQuery?: string;
}

type SortFieldType = 
  | 'tanggal_batas' 
  | 'prioritas' 
  | 'kategori' 
  | 'jenis_tenggat' 
  | 'status_verifikasi' 
  | 'publikasi' 
  | 'kode_kegiatan';

export const LLATListView: React.FC<LLATListViewProps> = ({
  events,
  categories = [],
  onSelectEvent,
  searchQuery = ''
}) => {
  const [localSearch, setLocalSearch] = useState<string>(searchQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [selectedVerification, setSelectedVerification] = useState<string>('ALL');
  const [sortField, setSortField] = useState<SortFieldType>('tanggal_batas');
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const pageSize = 12;

  const handleSort = (field: SortFieldType) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // Filtered items
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      // Local search
      const q = (localSearch || searchQuery).trim().toLowerCase();
      if (q) {
        const matchTitle = ev.nama_kegiatan.toLowerCase().includes(q);
        const matchCode = ev.kode_kegiatan.toLowerCase().includes(q);
        const matchDesc = ev.deskripsi.toLowerCase().includes(q);
        const matchCategory = ev.kategori.toLowerCase().includes(q);
        const matchDasar = (ev.dasar_hukum || '').toLowerCase().includes(q);
        if (!matchTitle && !matchCode && !matchDesc && !matchCategory && !matchDasar) {
          return false;
        }
      }

      // Category filter
      if (selectedCategory !== 'ALL' && ev.kategori !== selectedCategory) {
        return false;
      }

      // Priority filter
      if (selectedPriority !== 'ALL' && ev.prioritas !== selectedPriority) {
        return false;
      }

      // Verification filter
      if (selectedVerification !== 'ALL' && ev.status_verifikasi !== selectedVerification) {
        return false;
      }

      return true;
    });
  }, [events, localSearch, searchQuery, selectedCategory, selectedPriority, selectedVerification]);

  // Sorted items
  const sortedEvents = useMemo(() => {
    return [...filteredEvents].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'tanggal_batas') {
        const aDate = a.tanggal_batas || '';
        const bDate = b.tanggal_batas || '';
        cmp = aDate.localeCompare(bDate);
      } else if (sortField === 'prioritas') {
        const pOrder: Record<string, number> = { KRITIS: 1, PENTING: 2, NORMAL: 3 };
        cmp = (pOrder[a.prioritas] || 4) - (pOrder[b.prioritas] || 4);
      } else if (sortField === 'kategori') {
        cmp = a.kategori.localeCompare(b.kategori);
      } else if (sortField === 'jenis_tenggat') {
        cmp = (a.jenis_tenggat || '').localeCompare(b.jenis_tenggat || '');
      } else if (sortField === 'status_verifikasi') {
        cmp = (a.status_verifikasi || '').localeCompare(b.status_verifikasi || '');
      } else if (sortField === 'publikasi') {
        cmp = a.publikasi.localeCompare(b.publikasi);
      } else if (sortField === 'kode_kegiatan') {
        cmp = a.kode_kegiatan.localeCompare(b.kode_kegiatan);
      }
      return sortAsc ? cmp : -cmp;
    });
  }, [filteredEvents, sortField, sortAsc]);

  const totalPages = Math.ceil(sortedEvents.length / pageSize) || 1;
  const paginatedEvents = sortedEvents.slice((page - 1) * pageSize, page * pageSize);

  // Format date helper
  const formatDateIndo = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-4">
      {/* Header & Filter Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/90 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              DAFTAR TENGGAT &amp; JADWAL LLAT TA 2026
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Menampilkan {sortedEvents.length} kegiatan (dapat diurutkan dan difilter berdasarkan seluruh atribut resmi)
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kegiatan, kategori, dasar hukum..."
              value={localSearch}
              onChange={(e) => {
                setLocalSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Quick Filter Badges */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 font-bold text-[11px]">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter Kategori:</span>
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
            className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="ALL">Semua Kategori</option>
            {Array.from(new Set(events.map(e => e.kategori))).sort().map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={selectedPriority}
            onChange={(e) => { setSelectedPriority(e.target.value); setPage(1); }}
            className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="ALL">Semua Prioritas</option>
            <option value="KRITIS">KRITIS</option>
            <option value="PENTING">PENTING</option>
            <option value="NORMAL">NORMAL</option>
          </select>

          <select
            value={selectedVerification}
            onChange={(e) => { setSelectedVerification(e.target.value); setPage(1); }}
            className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="ALL">Semua Verifikasi</option>
            <option value="TERVERIFIKASI">Terverifikasi Sumber</option>
            <option value="PERLU_PEMERIKSAAN_MANUAL">Perlu Pemeriksaan Manual</option>
            <option value="BELUM_DIVERIFIKASI">Belum Diverifikasi</option>
          </select>
        </div>
      </div>

      {/* Main Table View */}
      {sortedEvents.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h4 className="text-base font-bold text-slate-700 dark:text-slate-300">
            Tidak ada kegiatan LLAT yang sesuai dengan filter
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            Silakan sesuaikan kriteria pencarian atau atur ulang pilihan filter di atas.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 font-black text-slate-600 dark:text-slate-300">
                <th 
                  onClick={() => handleSort('tanggal_batas')}
                  className="p-3.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
                >
                  <div className="flex items-center gap-1.5">
                    <span>TANGGAL &amp; BATAS</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('kode_kegiatan')}
                  className="p-3.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>NAMA KEGIATAN</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('jenis_tenggat')}
                  className="p-3.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors hidden sm:table-cell"
                >
                  <div className="flex items-center gap-1.5">
                    <span>JENIS TENGGAT</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('kategori')}
                  className="p-3.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors hidden md:table-cell"
                >
                  <div className="flex items-center gap-1.5">
                    <span>KATEGORI</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="p-3.5 hidden lg:table-cell">
                  KETERANGAN SINGKAT
                </th>
                <th className="p-3.5 hidden xl:table-cell">
                  SUMBER MATERI
                </th>
                <th 
                  onClick={() => handleSort('status_verifikasi')}
                  className="p-3.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors hidden sm:table-cell"
                >
                  <div className="flex items-center gap-1.5">
                    <span>STATUS VERIFIKASI</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="p-3.5 text-center shrink-0">
                  AKSI
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {paginatedEvents.map((event) => {
                const priority = getPriorityBadge(event.prioritas);
                const verification = getVerificationBadge(event.status_verifikasi);
                const deadlineType = getDeadlineTypeBadge(event.jenis_tenggat);
                const countdown = getCountdownInfo(event);

                return (
                  <tr
                    key={event.llat_id}
                    onClick={() => onSelectEvent(event)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                  >
                    {/* Tanggal & Jam */}
                    <td className="p-3.5 align-top whitespace-nowrap">
                      <div className="font-extrabold text-slate-900 dark:text-white">
                        {formatDateIndo(event.tanggal_batas)}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{event.jam_batas || '17:00'} {event.timezone || 'WIB'}</span>
                      </div>
                      <span className={`inline-block mt-1 text-[9px] font-black px-1.5 py-0.2 rounded ${priority.badgeClass}`}>
                        {priority.label}
                      </span>
                    </td>

                    {/* Nama Kegiatan */}
                    <td className="p-3.5 align-top">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="font-mono text-[10px] font-black px-1.5 py-0.2 rounded bg-slate-900 text-amber-300">
                          {event.kode_kegiatan}
                        </span>
                      </div>
                      <h5 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug">
                        {event.nama_kegiatan}
                      </h5>
                      {/* Mobile subtitle for small screens */}
                      <div className="sm:hidden mt-1 flex flex-wrap gap-1">
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${deadlineType.badgeClass}`}>
                          {deadlineType.label}
                        </span>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {event.kategori}
                        </span>
                      </div>
                    </td>

                    {/* Jenis Tenggat */}
                    <td className="p-3.5 align-top hidden sm:table-cell">
                      <span className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full ${deadlineType.badgeClass}`}>
                        {deadlineType.label}
                      </span>
                    </td>

                    {/* Kategori */}
                    <td className="p-3.5 align-top hidden md:table-cell whitespace-nowrap">
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {event.kategori}
                      </span>
                    </td>

                    {/* Keterangan Singkat */}
                    <td className="p-3.5 align-top hidden lg:table-cell max-w-xs">
                      <p className="text-slate-500 dark:text-slate-400 line-clamp-2 text-[11px] leading-relaxed">
                        {event.deskripsi}
                      </p>
                    </td>

                    {/* Sumber PDF */}
                    <td className="p-3.5 align-top hidden xl:table-cell whitespace-nowrap text-[11px]">
                      <span className="font-bold text-slate-700 dark:text-slate-300 block">
                        {event.file_sumber || 'sosialisasi LLAT 2026'}
                      </span>
                      <span className="text-slate-400">
                        {event.halaman_sumber || 'Halaman Slide'}
                      </span>
                    </td>

                    {/* Status Verifikasi */}
                    <td className="p-3.5 align-top hidden sm:table-cell whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${verification.badgeClass}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${verification.dotClass}`} />
                        <span>{verification.label}</span>
                      </span>
                    </td>

                    {/* Aksi Detail */}
                    <td className="p-3.5 align-top text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectEvent(event);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-300 text-xs font-bold transition-colors inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Detail</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <div>
            Halaman {page} dari {totalPages} ({sortedEvents.length} total)
          </div>
          <div className="flex items-center gap-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold"
            >
              Sebelumnya
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
