import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  BookOpen, 
  Users, 
  FileText, 
  ArrowRight,
  ShieldAlert,
  Tag,
  Sparkles,
  Inbox
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

interface LLATDailyAgendaViewProps {
  events: LLATEvent[];
  initialDate?: string; // YYYY-MM-DD
  onSelectEvent: (event: LLATEvent) => void;
}

export const LLATDailyAgendaView: React.FC<LLATDailyAgendaViewProps> = ({
  events,
  initialDate = '2026-12-08',
  onSelectEvent
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(initialDate);

  const selectedDateObj = useMemo(() => {
    try {
      return new Date(selectedDate + 'T00:00:00');
    } catch {
      return new Date(2026, 11, 8);
    }
  }, [selectedDate]);

  const todayStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  const handlePrevDay = () => {
    const d = new Date(selectedDateObj);
    d.setDate(d.getDate() - 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setSelectedDate(`${y}-${m}-${day}`);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDateObj);
    d.setDate(d.getDate() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setSelectedDate(`${y}-${m}-${day}`);
  };

  const handleSetToday = () => {
    setSelectedDate(todayStr);
  };

  // Find all events due on this day (either tanggal_batas, tanggal_penerimaan, or tanggal_penyelesaian)
  // or active during this day
  const eventsForDay = useMemo(() => {
    return events.filter(ev => {
      const penDate = ev.tanggal_penerimaan || ev.tanggal_batas;
      const selDate = ev.tanggal_penyelesaian;
      const startDate = ev.tanggal_mulai;

      const isDue = penDate === selectedDate || selDate === selectedDate;
      const isRunning = startDate <= selectedDate && selectedDate <= (selDate || penDate);

      return isDue || isRunning;
    }).sort((a, b) => {
      // Prioritize items that have cut-off today
      const aIsCutOff = (a.tanggal_penerimaan || a.tanggal_batas) === selectedDate || a.tanggal_penyelesaian === selectedDate;
      const bIsCutOff = (b.tanggal_penerimaan || b.tanggal_batas) === selectedDate || b.tanggal_penyelesaian === selectedDate;
      if (aIsCutOff && !bIsCutOff) return -1;
      if (!aIsCutOff && bIsCutOff) return 1;

      // Then by priority
      const pOrder: Record<string, number> = { KRITIS: 1, PENTING: 2, NORMAL: 3 };
      return (pOrder[a.prioritas] || 4) - (pOrder[b.prioritas] || 4);
    });
  }, [events, selectedDate]);

  // Key quick dates in LLAT 2026
  const quickMilestones = [
    { label: '4 Des (Kontrak I)', date: '2026-12-04' },
    { label: '7 Des (TUP Tunai)', date: '2026-12-07' },
    { label: '8 Des (Gaji Jan)', date: '2026-12-08' },
    { label: '11 Des (SPM-LS)', date: '2026-12-11' },
    { label: '21 Des (Bank Garansi)', date: '2026-12-21' },
    { label: '28 Des (Setor UP)', date: '2026-12-28' },
    { label: '30 Des (SPM PTUP)', date: '2026-12-30' },
    { label: '15 Jan (Tutup Modul)', date: '2027-01-15' },
    { label: '20 Jan (Rekon SHR)', date: '2027-01-20' },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-4">
      {/* Day Selector Header */}
      <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/90 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center text-white shadow-md">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                {selectedDateObj.toLocaleDateString('id-ID', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </h4>
              {selectedDate === todayStr && (
                <span className="text-xs font-black px-2 py-0.5 rounded-full bg-red-600 text-white animate-pulse">
                  HARI INI
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Terdapat {eventsForDay.length} agenda dan batas waktu yang relevan pada tanggal ini
            </p>
          </div>
        </div>

        {/* Date Stepper Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevDay}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            title="Hari Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <button
            onClick={handleNextDay}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            title="Hari Berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleSetToday}
            className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-extrabold hover:bg-blue-700 transition-colors shadow-xs"
          >
            Hari Ini
          </button>
        </div>
      </div>

      {/* Quick Milestones Jump */}
      <div className="px-4 sm:px-6 py-2 bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-200/80 dark:border-slate-800 flex items-center gap-2 overflow-x-auto text-xs">
        <span className="font-bold text-slate-500 shrink-0 text-[11px]">Tenggat Utama:</span>
        <div className="flex items-center gap-1.5 shrink-0">
          {quickMilestones.map((m) => (
            <button
              key={m.date}
              onClick={() => setSelectedDate(m.date)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                selectedDate === m.date
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-400'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Day Events Feed */}
      <div className="p-4 sm:p-6 space-y-4">
        {eventsForDay.length === 0 ? (
          <div className="p-12 text-center bg-slate-50/60 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
            <CalendarIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h5 className="text-base font-bold text-slate-700 dark:text-slate-300">
              Tidak ada agenda atau batas waktu pada tanggal ini
            </h5>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Silakan geser hari atau gunakan tombol pintas tenggat utama di atas untuk melihat tanggal-tanggal penting lainnya.
            </p>
          </div>
        ) : (
          eventsForDay.map((event) => {
            const penDate = event.tanggal_penerimaan || event.tanggal_batas;
            const isCutOffToday = penDate === selectedDate || event.tanggal_penyelesaian === selectedDate;
            const priority = getPriorityBadge(event.prioritas);
            const status = getStatusBadge(event.status);
            const countdown = getCountdownInfo(event);
            const verification = getVerificationBadge(event.status_verifikasi);
            const deadlineType = getDeadlineTypeBadge(event.jenis_tenggat);

            return (
              <div
                key={event.llat_id}
                onClick={() => onSelectEvent(event)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer group bg-white dark:bg-slate-900 shadow-sm hover:shadow-md ${
                  isCutOffToday
                    ? 'border-indigo-300 dark:border-indigo-700 ring-1 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1 min-w-[280px]">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-slate-900 text-amber-300">
                        {event.kode_kegiatan}
                      </span>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${priority.badgeClass}`}>
                        Prioritas {priority.label}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${deadlineType.badgeClass}`}>
                        {deadlineType.label}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${verification.badgeClass}`}>
                        {verification.label}
                      </span>
                    </div>

                    <h4 className="text-base font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {event.nama_kegiatan}
                    </h4>

                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {event.deskripsi}
                    </p>
                  </div>

                  <div className="shrink-0 text-right space-y-1">
                    <span className={`inline-block text-xs font-black px-3 py-1 rounded-xl ${countdown.badgeClass}`}>
                      {countdown.text}
                    </span>
                    <div className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center justify-end gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Cut-off: {event.jam_batas || '17:00'} {event.timezone || 'WIB'}</span>
                    </div>
                  </div>
                </div>

                {/* Event Metadata Cards */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 block mb-0.5">Kategori &amp; Target</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                      {event.kategori}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 block mb-0.5">Dasar Hukum &amp; Referensi</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                      {event.nomor_peraturan || event.dasar_hukum}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 block mb-0.5">Sumber PDF Sosialisasi</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                      {event.file_sumber || 'sosialisasi LLAT 2026 ga full.pdf'} ({event.halaman_sumber || 'Halaman Slide'})
                    </span>
                  </div>
                </div>

                {/* Special terms if available */}
                {event.ketentuan_khusus && (
                  <div className="mt-2 p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Ketentuan Khusus: </span>
                      {event.ketentuan_khusus}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
