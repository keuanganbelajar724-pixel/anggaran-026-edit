import React, { useState } from 'react';
import { 
  Calendar, 
  Plus, 
  FileSpreadsheet, 
  FileDown, 
  Copy, 
  Archive, 
  Trash2, 
  Edit3, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  SlidersHorizontal, 
  RotateCcw, 
  Search, 
  History, 
  Bell, 
  Tag, 
  Bot, 
  ArrowUp, 
  ArrowDown, 
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Printer
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { 
  LLATEvent, 
  LLATCategory, 
  LLATSettings, 
  LLATAuditLogEntry, 
  LLATPublikasi,
  LLATPrioritas 
} from '../../types/llat';
import { getCountdownInfo, getPriorityBadge, getStatusBadge } from '../../data/defaultLlatData';
import { LLATDetailModal } from './LLATDetailModal';
import { LLATEventFormModal } from './LLATEventFormModal';
import { LLATExcelImportModal } from './LLATExcelImportModal';
import { LLATExportPdfModal } from './LLATExportPdfModal';
import { LLATAiDraftModal } from './LLATAiDraftModal';

interface LLATAdminSectionProps {
  events: LLATEvent[];
  categories: LLATCategory[];
  settings: LLATSettings;
  auditLogs: LLATAuditLogEntry[];
  onSaveEvents: (events: LLATEvent[]) => void;
  onSaveCategories: (categories: LLATCategory[]) => void;
  onSaveSettings: (settings: LLATSettings) => void;
  onAddAuditLog: (entry: Omit<LLATAuditLogEntry, 'id' | 'timestamp'>) => void;
  currentUser?: { name?: string; role?: string } | null;
}

export const LLATAdminSection: React.FC<LLATAdminSectionProps> = ({
  events,
  categories,
  settings,
  auditLogs,
  onSaveEvents,
  onSaveCategories,
  onSaveSettings,
  onAddAuditLog,
  currentUser
}) => {
  const currentYear = settings.tahun_aktif || 2026;
  const adminName = currentUser?.name || 'Administrator KPPN';

  // State
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [statusFilter, setStatusFilter] = useState<'ALL' | LLATPublikasi>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState<boolean>(false);
  const [eventToEdit, setEventToEdit] = useState<LLATEvent | null>(null);
  const [detailEvent, setDetailEvent] = useState<LLATEvent | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [isExportPdfModalOpen, setIsExportPdfModalOpen] = useState<boolean>(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState<boolean>(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);

  // Filtered Events
  const filteredEvents = events.filter((ev) => {
    if (ev.tahun_anggaran !== selectedYear) return false;
    if (statusFilter !== 'ALL' && ev.publikasi !== statusFilter) return false;
    if (categoryFilter !== 'ALL' && ev.kategori !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match = 
        ev.nama_kegiatan.toLowerCase().includes(q) ||
        ev.kode_kegiatan.toLowerCase().includes(q) ||
        ev.deskripsi.toLowerCase().includes(q) ||
        ev.dasar_hukum.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  }).sort((a, b) => (a.urutan || 0) - (b.urutan || 0));

  // Available Years
  const availableYears = Array.from(new Set(events.map((e) => e.tahun_anggaran))).sort((a, b) => b - a);
  if (!availableYears.includes(2026)) availableYears.push(2026);
  if (!availableYears.includes(2027)) availableYears.push(2027);

  // Handlers
  const handleSaveEvent = (savedEvent: LLATEvent) => {
    const isEdit = events.some((e) => e.llat_id === savedEvent.llat_id);
    let updated: LLATEvent[];

    if (isEdit) {
      const old = events.find((e) => e.llat_id === savedEvent.llat_id);
      updated = events.map((e) => (e.llat_id === savedEvent.llat_id ? savedEvent : e));
      onAddAuditLog({
        user: adminName,
        action: 'UPDATE_EVENT',
        record_id: savedEvent.llat_id,
        kegiatan_name: savedEvent.nama_kegiatan,
        old_value: `${old?.tanggal_batas} (${old?.status})`,
        new_value: `${savedEvent.tanggal_batas} (${savedEvent.status})`,
        details: `Mengubah rincian kegiatan ${savedEvent.kode_kegiatan}`
      });
    } else {
      updated = [...events, savedEvent];
      onAddAuditLog({
        user: adminName,
        action: 'CREATE_EVENT',
        record_id: savedEvent.llat_id,
        kegiatan_name: savedEvent.nama_kegiatan,
        new_value: savedEvent.tanggal_batas,
        details: `Menambah kegiatan baru ${savedEvent.kode_kegiatan} TA ${savedEvent.tahun_anggaran}`
      });
    }

    onSaveEvents(updated);
    setEventToEdit(null);
  };

  const handleDeleteEvent = (id: string) => {
    const target = events.find((e) => e.llat_id === id);
    if (!target) return;
    if (!window.confirm(`Hapus kegiatan "${target.nama_kegiatan}" (${target.kode_kegiatan})?`)) return;

    const updated = events.filter((e) => e.llat_id !== id);
    onSaveEvents(updated);
    onAddAuditLog({
      user: adminName,
      action: 'DELETE_EVENT',
      record_id: id,
      kegiatan_name: target.nama_kegiatan,
      old_value: target.kode_kegiatan,
      details: `Menghapus kegiatan ${target.kode_kegiatan}`
    });
  };

  const handleToggleActive = (id: string) => {
    const updated = events.map((e) => {
      if (e.llat_id === id) {
        const nextActive = !e.is_active;
        onAddAuditLog({
          user: adminName,
          action: nextActive ? 'ACTIVATE_EVENT' : 'DEACTIVATE_EVENT',
          record_id: id,
          kegiatan_name: e.nama_kegiatan,
          old_value: String(e.is_active),
          new_value: String(nextActive),
          details: `${nextActive ? 'Mengaktifkan' : 'Menonaktifkan'} kegiatan ${e.kode_kegiatan}`
        });
        return { ...e, is_active: nextActive, updated_at: new Date().toISOString() };
      }
      return e;
    });
    onSaveEvents(updated);
  };

  const handlePublishEvent = (id: string, newPub: LLATPublikasi) => {
    const updated = events.map((e) => {
      if (e.llat_id === id) {
        onAddAuditLog({
          user: adminName,
          action: `SET_PUBLIKASI_${newPub}`,
          record_id: id,
          kegiatan_name: e.nama_kegiatan,
          old_value: e.publikasi,
          new_value: newPub,
          details: `Mengubah status publikasi ke ${newPub}`
        });
        return { ...e, publikasi: newPub, updated_at: new Date().toISOString() };
      }
      return e;
    });
    onSaveEvents(updated);
  };

  const handleDuplicateEvent = (event: LLATEvent) => {
    const newId = `llat-${Date.now()}`;
    const newCode = `${event.kode_kegiatan}-DUP`;
    const newEvent: LLATEvent = {
      ...event,
      llat_id: newId,
      kode_kegiatan: newCode,
      nama_kegiatan: `(Salinan) ${event.nama_kegiatan}`,
      publikasi: 'DRAFT',
      urutan: events.length + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    onSaveEvents([...events, newEvent]);
    onAddAuditLog({
      user: adminName,
      action: 'DUPLICATE_EVENT',
      record_id: newId,
      kegiatan_name: newEvent.nama_kegiatan,
      details: `Menduplikasi kegiatan dari ${event.kode_kegiatan}`
    });
  };

  const handleDuplicateToNextYear = () => {
    const nextYear = selectedYear + 1;
    if (!window.confirm(`Duplikasi seluruh kegiatan LLAT tahun ${selectedYear} ke tahun ${nextYear}? Seluruh data baru akan disimpan sebagai DRAFT sehingga Anda dapat menyesuaikan tanggal sebelum dipublikasikan.`)) {
      return;
    }

    const currentYearEvents = events.filter((e) => e.tahun_anggaran === selectedYear);
    if (currentYearEvents.length === 0) {
      alert(`Tidak ada data di tahun ${selectedYear} untuk diduplikasi.`);
      return;
    }

    const clonedEvents: LLATEvent[] = currentYearEvents.map((e, idx) => {
      // Adjust year by +1
      const updateDateYear = (dateStr: string) => {
        if (!dateStr) return dateStr;
        const [y, m, d] = dateStr.split('-');
        return `${Number(y) + 1}-${m}-${d}`;
      };

      return {
        ...e,
        llat_id: `llat-${nextYear}-${idx + 1}-${Date.now()}`,
        tahun_anggaran: nextYear,
        tanggal_mulai: updateDateYear(e.tanggal_mulai),
        tanggal_batas: updateDateYear(e.tanggal_batas),
        publikasi: 'DRAFT', // Always DRAFT for next year
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        version: 1
      };
    });

    onSaveEvents([...events, ...clonedEvents]);
    setSelectedYear(nextYear);
    onAddAuditLog({
      user: adminName,
      action: 'CLONE_YEAR_CALENDAR',
      old_value: `TA ${selectedYear} (${currentYearEvents.length} items)`,
      new_value: `TA ${nextYear} (${clonedEvents.length} items)`,
      details: `Duplikasi kalender LLAT ke tahun ${nextYear} dengan status DRAFT`
    });
    alert(`Berhasil menduplikasi ${clonedEvents.length} kegiatan ke Tahun Anggaran ${nextYear} dalam status DRAFT!`);
  };

  const handleMoveOrder = (index: number, direction: 'up' | 'down') => {
    const targetEvents = [...filteredEvents];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= targetEvents.length) return;

    const temp = targetEvents[index];
    targetEvents[index] = targetEvents[targetIdx];
    targetEvents[targetIdx] = temp;

    // Update urutan
    const updatedWithOrder = events.map((e) => {
      const foundIdx = targetEvents.findIndex((te) => te.llat_id === e.llat_id);
      if (foundIdx >= 0) {
        return { ...e, urutan: foundIdx + 1 };
      }
      return e;
    });

    onSaveEvents(updatedWithOrder);
  };

  const handleExportExcel = () => {
    try {
      const dataRows = filteredEvents.map((e, idx) => ({
        'No': idx + 1,
        'Tahun': e.tahun_anggaran,
        'Kode Kegiatan': e.kode_kegiatan,
        'Nama Kegiatan': e.nama_kegiatan,
        'Kategori': e.kategori,
        'Tanggal Mulai': e.tanggal_mulai,
        'Tanggal Batas': e.tanggal_batas,
        'Jam Batas': e.jam_batas,
        'Zona Waktu': e.timezone,
        'Prioritas': e.prioritas,
        'Status': e.status,
        'Target Pengguna': e.target_pengguna?.join(', ') || 'Semua Satker',
        'Dasar Hukum': e.dasar_hukum,
        'Nomor Peraturan': e.nomor_peraturan,
        'Publikasi': e.publikasi,
        'Aktif': e.is_active ? 'Ya' : 'Tidak',
        'Deskripsi': e.deskripsi,
        'Catatan': e.catatan || ''
      }));

      const ws = XLSX.utils.json_to_sheet(dataRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `LLAT_${selectedYear}`);
      XLSX.writeFile(wb, `Kalender_LLAT_${selectedYear}_KPPN_Semarang_I.xlsx`);
    } catch (e) {
      console.error('Export Excel failed:', e);
      alert('Gagal mengekspor file Excel.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Admin Title Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-2xl p-5 sm:p-6 text-white shadow-xl border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider flex items-center gap-1 shadow-xs">
                <Calendar className="w-3.5 h-3.5" />
                <span>Pusat Kelola Kalender LLAT</span>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white/10 text-white text-xs font-bold font-mono">
                Versi {settings.version} • TA {selectedYear}
              </span>
              <span className={`px-2.5 py-1 rounded-lg text-xs font-black ${
                settings.is_active ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}>
                {settings.is_active ? '🟢 Modul LLAT Publik Aktif' : '🔴 Modul LLAT Publik Nonaktif'}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Pusat Pengendalian Jadwal &amp; Langkah-Langkah Akhir Tahun (LLAT)
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Kelola batas akhir pengajuan SPM, pendaftaran kontrak, persetujuan TUP, rekonsiliasi, dan kewajiban akhir tahun Satker KPPN Semarang I tanpa koding. Perubahan langsung tersinkron ke dashboard publik Satker.
            </p>
          </div>

          {/* Quick Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setEventToEdit(null);
                setIsAddEditModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tambah Kegiatan</span>
            </button>

            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Import Excel</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <FileDown className="w-4 h-4 text-sky-400" />
              <span>Export Excel</span>
            </button>

            <button
              type="button"
              onClick={() => setIsExportPdfModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak PDF Resmi</span>
            </button>
          </div>
        </div>

        {/* Secondary Admin Action Buttons Toolbar */}
        <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleDuplicateToNextYear}
              className="px-3 py-1.5 rounded-lg bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 border border-indigo-700 font-bold flex items-center gap-1.5 transition-all"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Duplikasi ke Tahun {selectedYear + 1} (Draft)</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAiModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-700 font-bold flex items-center gap-1.5 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>AI Bantu Susun Kalender</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCategoryModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 font-bold flex items-center gap-1.5 transition-all"
            >
              <Tag className="w-3.5 h-3.5 text-emerald-400" />
              <span>Kelola Kategori ({categories.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setIsReminderModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 font-bold flex items-center gap-1.5 transition-all"
            >
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              <span>Pengaturan Reminder</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsAuditModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 font-bold flex items-center gap-1.5 transition-all ml-auto"
          >
            <History className="w-3.5 h-3.5 text-blue-400" />
            <span>Riwayat Audit Log ({auditLogs.length})</span>
          </button>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Tahun Anggaran Select */}
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-500">Tahun:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-extrabold text-slate-900 dark:text-white"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>TA {yr}</option>
              ))}
            </select>
          </div>

          {/* Status Publikasi Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === 'ALL' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-extrabold' : 'text-slate-500'
              }`}
            >
              Semua ({events.filter(e => e.tahun_anggaran === selectedYear).length})
            </button>
            <button
              onClick={() => setStatusFilter('PUBLISHED')}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === 'PUBLISHED' ? 'bg-emerald-600 text-white shadow-2xs font-extrabold' : 'text-slate-500'
              }`}
            >
              Published ({events.filter(e => e.tahun_anggaran === selectedYear && e.publikasi === 'PUBLISHED').length})
            </button>
            <button
              onClick={() => setStatusFilter('DRAFT')}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === 'DRAFT' ? 'bg-amber-500 text-slate-950 shadow-2xs font-extrabold' : 'text-slate-500'
              }`}
            >
              Draft ({events.filter(e => e.tahun_anggaran === selectedYear && e.publikasi === 'DRAFT').length})
            </button>
            <button
              onClick={() => setStatusFilter('ARCHIVED')}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === 'ARCHIVED' ? 'bg-slate-700 text-white shadow-2xs font-extrabold' : 'text-slate-500'
              }`}
            >
              Archived ({events.filter(e => e.tahun_anggaran === selectedYear && e.publikasi === 'ARCHIVED').length})
            </button>
          </div>

          {/* Kategori Select */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
          >
            <option value="ALL">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.nama}>{c.nama}</option>
            ))}
          </select>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kode / nama kegiatan..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
          />
        </div>
      </div>

      {/* Main Table for Admin Management */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 uppercase font-black text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-3 text-center w-14">Urutan</th>
                <th className="py-3 px-3">Kode</th>
                <th className="py-3 px-4">Nama Kegiatan LLAT &amp; Ketentuan</th>
                <th className="py-3 px-3">Kategori</th>
                <th className="py-3 px-3">Batas Akhir</th>
                <th className="py-3 px-3">Prioritas</th>
                <th className="py-3 px-3">Publikasi</th>
                <th className="py-3 px-3">Status Aktif</th>
                <th className="py-3 px-4 text-center">Aksi Pengelolaan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Tidak ada kegiatan LLAT pada kriteria filter ini.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((item, index) => {
                  const priority = getPriorityBadge(item.prioritas);

                  return (
                    <tr 
                      key={item.llat_id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                        !item.is_active ? 'opacity-60 bg-rose-50/20' : ''
                      }`}
                    >
                      {/* Urutan & Move Buttons */}
                      <td className="py-3 px-2 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <span className="font-mono font-bold text-slate-400 text-[11px] w-5">
                            #{item.urutan || index + 1}
                          </span>
                          <div className="flex flex-col">
                            <button
                              type="button"
                              disabled={index === 0}
                              onClick={() => handleMoveOrder(index, 'up')}
                              className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                              title="Pindahkan Ke Atas"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              disabled={index === filteredEvents.length - 1}
                              onClick={() => handleMoveOrder(index, 'down')}
                              className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                              title="Pindahkan Ke Bawah"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Kode */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="font-mono font-black text-xs px-2 py-0.5 rounded bg-slate-900 text-amber-300">
                          {item.kode_kegiatan}
                        </span>
                      </td>

                      {/* Nama Kegiatan */}
                      <td className="py-3 px-4 min-w-[240px] max-w-sm">
                        <div className="space-y-1">
                          <h5 
                            onClick={() => setDetailEvent(item)}
                            className="font-extrabold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
                          >
                            {item.nama_kegiatan}
                          </h5>
                          <p className="text-[11px] text-slate-500 line-clamp-1">
                            {item.deskripsi}
                          </p>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {item.nomor_peraturan || item.dasar_hukum}
                          </div>
                        </div>
                      </td>

                      {/* Kategori */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="inline-block px-2.5 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800 text-[10px]">
                          {item.kategori}
                        </span>
                      </td>

                      {/* Batas Akhir */}
                      <td className="py-3 px-3 whitespace-nowrap font-mono font-bold">
                        <span className="text-rose-600 dark:text-rose-400 block">{item.tanggal_batas}</span>
                        <span className="text-[10px] text-slate-400">{item.jam_batas} {item.timezone}</span>
                      </td>

                      {/* Prioritas */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${priority.badgeClass}`}>
                          {priority.label}
                        </span>
                      </td>

                      {/* Status Publikasi */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <select
                          value={item.publikasi}
                          onChange={(e) => handlePublishEvent(item.llat_id, e.target.value as LLATPublikasi)}
                          className={`text-[10px] font-black px-2 py-1 rounded-lg border cursor-pointer ${
                            item.publikasi === 'PUBLISHED'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : item.publikasi === 'DRAFT'
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : 'bg-slate-100 text-slate-700 border-slate-300'
                          }`}
                        >
                          <option value="PUBLISHED">PUBLISHED</option>
                          <option value="DRAFT">DRAFT</option>
                          <option value="ARCHIVED">ARCHIVED</option>
                        </select>
                      </td>

                      {/* Toggle Aktif */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(item.llat_id)}
                          className={`text-[10px] font-black px-2.5 py-1 rounded-lg transition-all ${
                            item.is_active
                              ? 'bg-emerald-600 text-white shadow-2xs'
                              : 'bg-rose-600 text-white shadow-2xs'
                          }`}
                        >
                          {item.is_active ? 'AKTIF' : 'NONAKTIF'}
                        </button>
                      </td>

                      {/* Aksi */}
                      <td className="py-3 px-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Preview Detail */}
                          <button
                            type="button"
                            onClick={() => setDetailEvent(item)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-indigo-600 hover:bg-slate-100"
                            title="Preview Detail"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => {
                              setEventToEdit(item);
                              setIsAddEditModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                            title="Edit Kegiatan"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Duplikat */}
                          <button
                            type="button"
                            onClick={() => handleDuplicateEvent(item)}
                            className="p-1.5 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                            title="Duplikat Kegiatan"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          {/* Hapus */}
                          <button
                            type="button"
                            onClick={() => handleDeleteEvent(item.llat_id)}
                            className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                            title="Hapus Kegiatan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {isAddEditModalOpen && (
        <LLATEventFormModal
          eventToEdit={eventToEdit}
          categories={categories}
          currentYear={selectedYear}
          existingEvents={events}
          onClose={() => {
            setIsAddEditModalOpen(false);
            setEventToEdit(null);
          }}
          onSave={handleSaveEvent}
        />
      )}

      {detailEvent && (
        <LLATDetailModal
          event={detailEvent}
          isAdmin={true}
          onClose={() => setDetailEvent(null)}
          onEdit={(ev) => {
            setDetailEvent(null);
            setEventToEdit(ev);
            setIsAddEditModalOpen(true);
          }}
        />
      )}

      {isImportModalOpen && (
        <LLATExcelImportModal
          onClose={() => setIsImportModalOpen(false)}
          existingEvents={events}
          currentYear={selectedYear}
          onImportSuccess={(newEvents) => {
            onSaveEvents([...events, ...newEvents]);
            onAddAuditLog({
              user: adminName,
              action: 'IMPORT_EXCEL',
              new_value: `${newEvents.length} items`,
              details: `Berhasil mengimpor ${newEvents.length} data kalender dari Excel sebagai DRAFT`
            });
            alert(`Berhasil mengimpor ${newEvents.length} kegiatan kalender LLAT!`);
          }}
        />
      )}

      {isExportPdfModalOpen && (
        <LLATExportPdfModal
          events={events.filter((e) => e.tahun_anggaran === selectedYear)}
          categories={categories}
          currentYear={selectedYear}
          onClose={() => setIsExportPdfModalOpen(false)}
        />
      )}

      {isAiModalOpen && (
        <LLATAiDraftModal
          currentYear={selectedYear}
          existingCount={events.length}
          onClose={() => setIsAiModalOpen(false)}
          onApplyDrafts={(draftEvents) => {
            onSaveEvents([...events, ...draftEvents]);
            onAddAuditLog({
              user: adminName,
              action: 'AI_DRAFT_GENERATE',
              new_value: `${draftEvents.length} items`,
              details: `Menerapkan usulan AI untuk ${draftEvents.length} kegiatan draft LLAT`
            });
            alert(`Berhasil menambahkan ${draftEvents.length} draft kegiatan dari asisten AI!`);
          }}
        />
      )}

      {/* Reminder Settings Modal */}
      {isReminderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div 
            className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Pengaturan Reminder LLAT
                </h3>
              </div>
              <button onClick={() => setIsReminderModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                ×
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-500 leading-relaxed">
                Tentukan interval pengingat otomatis (countdown highlight &amp; in-app banner) untuk Satker menjelang batas waktu:
              </p>

              <div className="space-y-3">
                <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 cursor-pointer">
                  <span className="font-bold text-slate-800 dark:text-slate-200">Reminder H-7 (7 Hari Sebelum Batas)</span>
                  <input
                    type="checkbox"
                    checked={settings.reminder.reminder_h7}
                    onChange={(e) => {
                      const newCfg = { ...settings, reminder: { ...settings.reminder, reminder_h7: e.target.checked } };
                      onSaveSettings(newCfg);
                    }}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 cursor-pointer">
                  <span className="font-bold text-slate-800 dark:text-slate-200">Reminder H-3 (3 Hari Sebelum Batas)</span>
                  <input
                    type="checkbox"
                    checked={settings.reminder.reminder_h3}
                    onChange={(e) => {
                      const newCfg = { ...settings, reminder: { ...settings.reminder, reminder_h3: e.target.checked } };
                      onSaveSettings(newCfg);
                    }}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 cursor-pointer">
                  <span className="font-bold text-slate-800 dark:text-slate-200">Reminder H-1 (H-1 Menjelang Jatuh Tempo)</span>
                  <input
                    type="checkbox"
                    checked={settings.reminder.reminder_h1}
                    onChange={(e) => {
                      const newCfg = { ...settings, reminder: { ...settings.reminder, reminder_h1: e.target.checked } };
                      onSaveSettings(newCfg);
                    }}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 cursor-pointer">
                  <span className="font-bold text-slate-800 dark:text-slate-200">Reminder Hari H (Peringatan Hari Batas Waktu)</span>
                  <input
                    type="checkbox"
                    checked={settings.reminder.reminder_h0}
                    onChange={(e) => {
                      const newCfg = { ...settings, reminder: { ...settings.reminder, reminder_h0: e.target.checked } };
                      onSaveSettings(newCfg);
                    }}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                </label>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setIsReminderModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Management Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div 
            className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-emerald-500" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Kelola Kategori Kegiatan LLAT
                </h3>
              </div>
              <button onClick={() => setIsCategoryModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                ×
              </button>
            </div>

            <div className="p-6 space-y-3 text-xs max-h-80 overflow-y-auto">
              {categories.map((cat, idx) => (
                <div key={cat.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/30">
                  <div>
                    <span className="font-extrabold text-slate-900 dark:text-white text-sm">{cat.nama}</span>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{cat.deskripsi}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = categories.map((c) => c.id === cat.id ? { ...c, is_active: !c.is_active } : c);
                      onSaveCategories(updated);
                    }}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                      cat.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {cat.is_active ? 'Aktif' : 'Nonaktif'}
                  </button>
                </div>
              ))}
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Log Modal */}
      {isAuditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div 
            className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh] animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-blue-500" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Riwayat Audit Log Perubahan Kalender LLAT
                </h3>
              </div>
              <button onClick={() => setIsAuditModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                ×
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-2.5 text-xs flex-1">
              {auditLogs.length === 0 ? (
                <div className="p-8 text-center text-slate-400">Belum ada riwayat perubahan terekam.</div>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-900 dark:text-white">{log.user}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(log.timestamp).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                      {log.action}: {log.kegiatan_name || log.record_id}
                    </div>
                    {log.details && <p className="text-[11px] text-slate-600 dark:text-slate-300">{log.details}</p>}
                    {log.old_value && log.new_value && (
                      <div className="text-[10px] text-slate-500 font-mono">
                        <span className="line-through">{log.old_value}</span> → <span className="font-bold text-emerald-600">{log.new_value}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setIsAuditModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
