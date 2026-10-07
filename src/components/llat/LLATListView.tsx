import React, { useState } from 'react';
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
  FileText
} from 'lucide-react';
import { LLATEvent } from '../../types/llat';
import { getCountdownInfo, getPriorityBadge, getStatusBadge } from '../../data/defaultLlatData';

interface LLATListViewProps {
  events: LLATEvent[];
  onSelectEvent: (event: LLATEvent) => void;
  searchQuery?: string;
}

export const LLATListView: React.FC<LLATListViewProps> = ({
  events,
  onSelectEvent,
  searchQuery = ''
}) => {
  const [sortField, setSortField] = useState<'tanggal_batas' | 'prioritas' | 'kode_kegiatan' | 'kategori'>('tanggal_batas');
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const pageSize = 10;

  const handleSort = (field: 'tanggal_batas' | 'prioritas' | 'kode_kegiatan' | 'kategori') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // Sorted items
  const sortedEvents = React.useMemo(() => {
    return [...events].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'tanggal_batas') {
        cmp = a.tanggal_batas.localeCompare(b.tanggal_batas);
      } else if (sortField === 'prioritas') {
        const pOrder: Record<string, number> = { KRITIS: 1, PENTING: 2, NORMAL: 3 };
        cmp = (pOrder[a.prioritas] || 4) - (pOrder[b.prioritas] || 4);
      } else if (sortField === 'kode_kegiatan') {
        cmp = a.kode_kegiatan.localeCompare(b.kode_kegiatan);
      } else if (sortField === 'kategori') {
        cmp = a.kategori.localeCompare(b.kategori);
      }
      return sortAsc ? cmp : -cmp;
    });
  }, [events, sortField, sortAsc]);

  const totalPages = Math.ceil(sortedEvents.length / pageSize) || 1;
  const paginatedEvents = sortedEvents.slice((page - 1) * pageSize, page * pageSize);

  // Format date helper
  const formatDateIndo = (dateStr: string) => {
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

  if (events.length === 0) {
    return (
      <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
        <h4 className="text-base font-bold text-slate-700 dark:text-slate-300">
          Tidak ada kegiatan LLAT yang ditemukan
        </h4>
        <p className="text-xs text-slate-400 mt-1">
          Silakan sesuaikan kriteria pencarian atau filter yang dipilih.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Table Header Summary */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-900/90">
        <div>
          <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
            DAFTAR JADWAL &amp; BATAS WAKTU LLAT
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Menampilkan {sortedEvents.length} kegiatan aktif
          </p>
        </div>

        <div className="text-xs text-slate-500 font-bold flex items-center gap-2">
          <span>Urutkan berdasarkan:</span>
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value as any)}
            className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
          >
            <option value="tanggal_batas">Tanggal Batas (Deadline)</option>
            <option value="prioritas">Prioritas</option>
            <option value="kode_kegiatan">Kode Kegiatan</option>
            <option value="kategori">Kategori</option>
          </select>
        </div>
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 uppercase font-black tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="py-3 px-4 cursor-pointer hover:text-indigo-600" onClick={() => handleSort('kode_kegiatan')}>
                <div className="flex items-center gap-1">
                  <span>Kode</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4">Nama Kegiatan &amp; Ketentuan</th>
              <th className="py-3 px-4 cursor-pointer hover:text-indigo-600" onClick={() => handleSort('kategori')}>
                <div className="flex items-center gap-1">
                  <span>Kategori</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4 cursor-pointer hover:text-indigo-600" onClick={() => handleSort('tanggal_batas')}>
                <div className="flex items-center gap-1">
                  <span>Batas Akhir (Deadline)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4 cursor-pointer hover:text-indigo-600" onClick={() => handleSort('prioritas')}>
                <div className="flex items-center gap-1">
                  <span>Prioritas</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4">Hitung Mundur</th>
              <th className="py-3 px-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {paginatedEvents.map((item) => {
              const priority = getPriorityBadge(item.prioritas);
              const countdown = getCountdownInfo(item);
              const status = getStatusBadge(item.status);

              return (
                <tr
                  key={item.llat_id}
                  onClick={() => onSelectEvent(item)}
                  className="hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-colors cursor-pointer group"
                >
                  {/* Kode */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="font-mono font-black text-xs px-2 py-0.5 rounded bg-slate-900 text-amber-300">
                      {item.kode_kegiatan}
                    </span>
                  </td>

                  {/* Nama Kegiatan */}
                  <td className="py-3.5 px-4 min-w-[240px] max-w-md">
                    <div className="space-y-1">
                      <h5 className="font-extrabold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug">
                        {item.nama_kegiatan}
                      </h5>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                        {item.deskripsi}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        {item.target_pengguna?.map((t, i) => (
                          <span
                            key={i}
                            className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono font-bold"
                          >
                            {t.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  </td>

                  {/* Kategori */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800 text-[11px]">
                      {item.kategori}
                    </span>
                  </td>

                  {/* Batas Akhir */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="space-y-0.5">
                      <span className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-blue-500" />
                        {formatDateIndo(item.tanggal_batas)}
                      </span>
                      <span className="text-[11px] font-mono text-rose-600 dark:text-rose-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {item.jam_batas} {item.timezone}
                      </span>
                    </div>
                  </td>

                  {/* Prioritas & Status */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <span className={`inline-block text-[10px] font-black px-2 py-0.5 rounded-full ${priority.badgeClass}`}>
                        {priority.label}
                      </span>
                      <div>
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.2 rounded-md ${status.badgeClass}`}>
                          {status.label}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Hitung Mundur */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className={`inline-block text-[11px] font-black px-2.5 py-1 rounded-lg ${countdown.badgeClass}`}>
                      {countdown.text}
                    </span>
                  </td>

                  {/* Aksi */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEvent(item);
                      }}
                      className="px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-600 hover:text-white text-indigo-700 dark:text-indigo-300 font-bold text-xs transition-all flex items-center gap-1 mx-auto"
                    >
                      <span>Detail</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            Halaman {page} dari {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 font-bold"
            >
              Sebelumnya
            </button>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 font-bold"
            >
              Berikutnya
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
