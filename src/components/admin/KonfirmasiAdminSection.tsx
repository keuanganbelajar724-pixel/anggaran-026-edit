import React, { useState, useMemo } from 'react';
import {
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileSpreadsheet,
  Search,
  Plus,
  Trash2,
  Edit3,
  Calendar,
  MapPin,
  Send,
  UserCheck,
  X,
  Eye,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import {
  UndanganKonfirmasiKegiatan,
  KonfirmasiKehadiranRecord,
  MasterSatker,
  TargetPejabatUndangan
} from '../../types';
import { exportKonfirmasiKehadiranToExcel } from '../../utils/exportKonfirmasiExcel';

interface KonfirmasiAdminSectionProps {
  isDark: boolean;
  kegiatanList: UndanganKonfirmasiKegiatan[];
  konfirmasiList: KonfirmasiKehadiranRecord[];
  masterSatkers: MasterSatker[];
  onSaveKegiatan?: (kegiatan: UndanganKonfirmasiKegiatan) => void;
  onDeleteKegiatan?: (kegiatanId: string) => void;
  onSaveKonfirmasi?: (record: KonfirmasiKehadiranRecord) => void;
  onDeleteKonfirmasi?: (recordId: string) => void;
  requestConfirm: (title: string, message: string, onConfirm: () => void, isDestructive?: boolean) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const KonfirmasiAdminSection: React.FC<KonfirmasiAdminSectionProps> = ({
  isDark,
  kegiatanList,
  konfirmasiList,
  masterSatkers,
  onSaveKegiatan,
  onDeleteKegiatan,
  onSaveKonfirmasi: _onSaveKonfirmasi,
  onDeleteKonfirmasi,
  requestConfirm,
  showToast
}) => {
  // Selected activity for monitoring
  const [selectedKegiatanId, setSelectedKegiatanId] = useState<string>(() => {
    return kegiatanList[0]?.id || '';
  });

  // Table filter inside monitoring
  const [activeTab, setActiveTab] = useState<'belum' | 'sudah' | 'semua'>('belum');
  const [searchQuery, setSearchQuery] = useState('');

  // Activity Edit/Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKegiatanId, setEditingKegiatanId] = useState<string | null>(null);
  const [formNomor, setFormNomor] = useState('');
  const [formJudul, setFormJudul] = useState('');
  const [formSubJudul, setFormSubJudul] = useState('');
  const [formDeskripsi, setFormDeskripsi] = useState('');
  const [formTanggal, setFormTanggal] = useState('');
  const [formWaktu, setFormWaktu] = useState('08:30 - 12:00 WIB');
  const [formLokasi, setFormLokasi] = useState('Aula Lantai 2 KPPN Semarang I');
  const [formTipe, setFormTipe] = useState<'OFFLINE' | 'ONLINE' | 'HYBRID'>('OFFLINE');
  const [formLinkMeeting, setFormLinkMeeting] = useState('');
  const [formDeadline, setFormDeadline] = useState('');
  const [formTargetPejabat, setFormTargetPejabat] = useState<TargetPejabatUndangan[]>(['PPK', 'PPSPM']);
  const [formIsActive, setFormIsActive] = useState(true);
  const [formIsSemuaSatker, setFormIsSemuaSatker] = useState(true);
  const [formSelectedSatkers, setFormSelectedSatkers] = useState<string[]>([]);
  const [satkerSearchModal, setSatkerSearchModal] = useState('');

  // Currently selected activity
  const activeKegiatan = useMemo(() => {
    return kegiatanList.find(k => k.id === selectedKegiatanId) || kegiatanList[0];
  }, [kegiatanList, selectedKegiatanId]);

  // Invited satkers for the active activity
  const invitedSatkers = useMemo(() => {
    if (!activeKegiatan) return [];
    if (activeKegiatan.isSemuaSatker) return masterSatkers;
    const targetCodes = new Set(activeKegiatan.targetSatkerCodes || []);
    return masterSatkers.filter(s => targetCodes.has(s.kodeSatker));
  }, [activeKegiatan, masterSatkers]);

  // Target roles required for current activity
  const targetRoles: TargetPejabatUndangan[] = useMemo(() => {
    if (activeKegiatan && activeKegiatan.targetPejabat && activeKegiatan.targetPejabat.length > 0) {
      return activeKegiatan.targetPejabat;
    }
    return ['PPK', 'PPSPM'];
  }, [activeKegiatan]);

  // Confirmations map for active activity grouped by satker
  const satkerConfirmationsMap = useMemo(() => {
    const map = new Map<string, KonfirmasiKehadiranRecord[]>();
    if (!activeKegiatan) return map;
    konfirmasiList
      .filter(k => k.kegiatanId === activeKegiatan.id && k.isComplete)
      .forEach(rec => {
        const existing = map.get(rec.kodeSatker) || [];
        const filtered = existing.filter(r => r.pejabatTarget !== rec.pejabatTarget);
        filtered.push(rec);
        map.set(rec.kodeSatker, filtered);
      });
    return map;
  }, [activeKegiatan, konfirmasiList]);

  // Helper to get status of satker
  const getSatkerStatus = useMemo(() => {
    return (kodeSatker: string) => {
      const records = satkerConfirmationsMap.get(kodeSatker) || [];
      const confirmedRoles = records.map(r => r.pejabatTarget);
      const missingRoles = targetRoles.filter(role => !confirmedRoles.includes(role));
      const isComplete = targetRoles.length > 0 ? missingRoles.length === 0 : records.length > 0;
      const isPartial = confirmedRoles.length > 0 && !isComplete;
      const isUnconfirmed = confirmedRoles.length === 0;

      return {
        records,
        confirmedRoles,
        missingRoles,
        isComplete,
        isPartial,
        isUnconfirmed,
        count: confirmedRoles.length,
        total: targetRoles.length
      };
    };
  }, [satkerConfirmationsMap, targetRoles]);

  // Satkers who haven't completed RSVP
  const unconfirmedSatkers = useMemo(() => {
    return invitedSatkers.filter(s => !getSatkerStatus(s.kodeSatker).isComplete);
  }, [invitedSatkers, getSatkerStatus]);

  // Satkers who have completed all required role RSVPs
  const confirmedSatkers = useMemo(() => {
    return invitedSatkers.filter(s => getSatkerStatus(s.kodeSatker).isComplete);
  }, [invitedSatkers, getSatkerStatus]);

  // Filtered Satkers based on search & tab
  const displayedSatkers = useMemo(() => {
    let baseList: MasterSatker[] = [];
    if (activeTab === 'belum') {
      baseList = unconfirmedSatkers;
    } else if (activeTab === 'sudah') {
      baseList = confirmedSatkers;
    } else {
      baseList = invitedSatkers;
    }

    if (!searchQuery.trim()) return baseList;
    const q = searchQuery.toLowerCase().trim();
    return baseList.filter(s => {
      const statusInfo = getSatkerStatus(s.kodeSatker);
      const participantNames = statusInfo.records.map(r => r.namaPeserta || '').join(' ').toLowerCase();
      const rolesStr = statusInfo.confirmedRoles.join(' ').toLowerCase();

      return (
        s.kodeSatker.toLowerCase().includes(q) ||
        s.namaSatker.toLowerCase().includes(q) ||
        (s.kementerianLembaga && s.kementerianLembaga.toLowerCase().includes(q)) ||
        (s.namaPic && s.namaPic.toLowerCase().includes(q)) ||
        participantNames.includes(q) ||
        rolesStr.includes(q)
      );
    });
  }, [activeTab, unconfirmedSatkers, confirmedSatkers, invitedSatkers, searchQuery, getSatkerStatus]);

  // Toggle active status for an activity
  const handleToggleActivityStatus = (kegiatan: UndanganKonfirmasiKegiatan) => {
    if (!onSaveKegiatan) return;
    const updated: UndanganKonfirmasiKegiatan = {
      ...kegiatan,
      isActive: !kegiatan.isActive,
      updatedAt: new Date().toISOString()
    };
    onSaveKegiatan(updated);
    showToast(
      `Status undangan "${kegiatan.judulKegiatan}" berhasil diubah: ${updated.isActive ? 'AKTIF (Menerima RSVP)' : 'NON-AKTIF (Ditutup)'}`,
      updated.isActive ? 'success' : 'info'
    );
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingKegiatanId(null);
    setFormNomor(`UND-${Math.floor(100 + Math.random() * 900)}/KPN.1401/2026`);
    setFormJudul('');
    setFormSubJudul('');
    setFormDeskripsi('');
    setFormTanggal(new Date().toISOString().split('T')[0]);
    setFormWaktu('08:30 - 12:00 WIB');
    setFormLokasi('Aula Lantai 2 KPPN Semarang I / Zoom Meeting Hybrid');
    setFormTipe('HYBRID');
    setFormLinkMeeting('');
    setFormDeadline(new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + ' 17:00 WIB');
    setFormTargetPejabat(['PPK', 'PPSPM']);
    setFormIsActive(true);
    setFormIsSemuaSatker(true);
    setFormSelectedSatkers([]);
    setSatkerSearchModal('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (kegiatan: UndanganKonfirmasiKegiatan) => {
    setEditingKegiatanId(kegiatan.id);
    setFormNomor(kegiatan.nomorSurat || '');
    setFormJudul(kegiatan.judulKegiatan || '');
    setFormSubJudul(kegiatan.subJudul || '');
    setFormDeskripsi(kegiatan.deskripsi || '');
    setFormTanggal(kegiatan.tanggalKegiatan || '');
    setFormWaktu(kegiatan.waktuKegiatan || '');
    setFormLokasi(kegiatan.lokasiKegiatan || '');
    setFormTipe(kegiatan.tipePelaksanaan || 'OFFLINE');
    setFormLinkMeeting(kegiatan.linkMeeting || '');
    setFormDeadline(kegiatan.batasWaktuKonfirmasi || '');
    setFormTargetPejabat(kegiatan.targetPejabat || ['PPK', 'PPSPM']);
    setFormIsActive(kegiatan.isActive ?? true);
    setFormIsSemuaSatker(kegiatan.isSemuaSatker ?? true);
    setFormSelectedSatkers(kegiatan.targetSatkerCodes || []);
    setSatkerSearchModal('');
    setIsModalOpen(true);
  };

  // Save Activity
  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formJudul.trim()) {
      alert('Judul kegiatan wajib diisi.');
      return;
    }
    if (formTargetPejabat.length === 0) {
      alert('Pilih minimal 1 sasaran pejabat (KPA, PPK, PPSPM, dll).');
      return;
    }
    if (!formIsSemuaSatker && formSelectedSatkers.length === 0) {
      alert('Jika tidak memilih Semua Satker, pilih minimal 1 satker spesifik.');
      return;
    }

    const payload: UndanganKonfirmasiKegiatan = {
      id: editingKegiatanId || `konf-act-${Date.now()}`,
      nomorSurat: formNomor.trim(),
      judulKegiatan: formJudul.trim(),
      subJudul: formSubJudul.trim(),
      deskripsi: formDeskripsi.trim(),
      tanggalKegiatan: formTanggal,
      waktuKegiatan: formWaktu.trim(),
      lokasiKegiatan: formLokasi.trim(),
      tipePelaksanaan: formTipe,
      linkMeeting: formLinkMeeting.trim(),
      batasWaktuKonfirmasi: formDeadline.trim(),
      targetPejabat: formTargetPejabat,
      isSemuaSatker: formIsSemuaSatker,
      targetSatkerCodes: formIsSemuaSatker ? [] : formSelectedSatkers,
      isActive: formIsActive,
      createdAt: editingKegiatanId ? (kegiatanList.find(k => k.id === editingKegiatanId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (onSaveKegiatan) {
      onSaveKegiatan(payload);
      showToast(
        editingKegiatanId
          ? 'Data undangan kegiatan berhasil diperbarui!'
          : 'Undangan kegiatan baru berhasil dibuat dan diterbitkan!',
        'success'
      );
      if (!selectedKegiatanId || editingKegiatanId === selectedKegiatanId) {
        setSelectedKegiatanId(payload.id);
      }
    }
    setIsModalOpen(false);
  };

  // Delete Activity
  const handleDeleteActivity = (kegiatan: UndanganKonfirmasiKegiatan) => {
    requestConfirm(
      'Hapus Undangan Kegiatan',
      `Apakah Anda yakin ingin menghapus surat undangan "${kegiatan.judulKegiatan}"? Semua data konfirmasi kehadiran yang terhubung dengan kegiatan ini akan terhapus.`,
      () => {
        if (onDeleteKegiatan) {
          onDeleteKegiatan(kegiatan.id);
          showToast(`Undangan "${kegiatan.judulKegiatan}" berhasil dihapus.`, 'info');
          if (selectedKegiatanId === kegiatan.id) {
            const remaining = kegiatanList.filter(k => k.id !== kegiatan.id);
            if (remaining.length > 0) {
              setSelectedKegiatanId(remaining[0].id);
            }
          }
        }
      },
      true
    );
  };

  // Delete/Reset single Confirmation
  const handleDeleteConfirmation = (record: KonfirmasiKehadiranRecord) => {
    requestConfirm(
      'Reset Konfirmasi Kehadiran Satker',
      `Hapus data konfirmasi kehadiran dari Satker "${record.namaSatker}" (${record.kodeSatker})? Satker akan kembali berstatus Belum Konfirmasi dan dapat mengisi ulang form RSVP.`,
      () => {
        if (onDeleteKonfirmasi) {
          onDeleteKonfirmasi(record.id);
          showToast(`Konfirmasi satker ${record.kodeSatker} berhasil di-reset.`, 'info');
        }
      },
      true
    );
  };

  // Send WhatsApp Reminder
  const handleSendWaReminder = (satker: MasterSatker) => {
    if (!activeKegiatan) return;
    const phone = satker.noHpPic || satker.pejabatOperator?.ppk?.noHp || satker.pejabatOperator?.ppspm?.noHp || '';
    if (!phone) {
      alert(`Nomor WhatsApp PIC/Pejabat untuk Satker ${satker.namaSatker} (${satker.kodeSatker}) belum terdaftar di Master Satker.`);
      return;
    }
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const formattedPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.substring(1) : cleanPhone;

    const status = getSatkerStatus(satker.kodeSatker);
    const missingStr = status.missingRoles.join(' & ') || 'Pejabat Terundang';
    const statusNote = status.isPartial
      ? `*BELUM LENGKAP MENGISI KONFIRMASI KEHADIRAN (RSVP)* untuk pejabat: *${missingStr}* (Sudah mengisi: ${status.confirmedRoles.join(', ')})`
      : `*BELUM MENGISI KONFIRMASI KEHADIRAN (RSVP)* untuk pejabat: *${missingStr}*`;

    const message = `Yth. Pimpinan/Pejabat Satuan Kerja *${satker.namaSatker}* (${satker.kodeSatker}),\n\nMenindaklanjuti Surat Undangan KPPN Semarang I No. *${activeKegiatan.nomorSurat}* perihal:\n*${activeKegiatan.judulKegiatan}*\n\nJadwal Pelaksanaan:\n📅 *${activeKegiatan.tanggalKegiatan}* (${activeKegiatan.waktuKegiatan})\n📍 *${activeKegiatan.lokasiKegiatan}*\n👥 Sasaran: *${activeKegiatan.targetPejabat.join(', ')}*\n⏰ Batas Konfirmasi: *${activeKegiatan.batasWaktuKonfirmasi || 'Segera'}*\n\nBerdasarkan monitoring kami, Satuan Kerja Bapak/Ibu tercatat ${statusNote}.\n\nMohon kesediaannya segera melengkapi konfirmasi kehadiran delegasi pejabat yang hadir melalui Portal Monitoring IKPA KPPN Semarang I pada menu *🤝 Konfirmasi Kehadiran*.\n\nAtas kerja sama dan kehadiran Bapak/Ibu, kami sampaikan terima kasih.\n\n_Seksi MSKI KPPN Semarang I (026)_`;

    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // Export to Excel
  const handleExportExcel = () => {
    if (!activeKegiatan) {
      alert('Pilih kegiatan terlebih dahulu untuk mengunduh rekap.');
      return;
    }
    const activeConfirmations = konfirmasiList.filter(k => k.kegiatanId === activeKegiatan.id && k.isComplete);
    exportKonfirmasiKehadiranToExcel({
      kegiatan: activeKegiatan,
      konfirmasiList: activeConfirmations,
      invitedSatkers,
      belumKonfirmasiSatkers: unconfirmedSatkers
    });
    showToast('File laporan Excel (.xlsx) konfirmasi kehadiran berhasil diunduh!', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className={`${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'} rounded-3xl border shadow-xl p-6 sm:p-8 space-y-4`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-3 py-1 rounded-full text-xs font-bold mb-2">
              <UserCheck className="w-3.5 h-3.5" />
              MODUL ADMIN: KONFIRMASI KEHADIRAN SATUAN KERJA (RSVP)
            </div>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight">
              Manajemen Undangan Kegiatan &amp; Monitoring Kehadiran Satker
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1 max-w-3xl">
              Atur status keaktifan surat undangan (aktif/tidak aktif), kelola target pejabat &amp; satker yang diundang, pantau satker yang belum/sudah mengisi RSVP secara transparan, serta ekspor rekapitulasi resmi ke format Excel.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="font-extrabold text-xs sm:text-sm px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              <span>➕ Buat Undangan Baru</span>
            </button>
          </div>
        </div>

        {/* SECTION 1: DAFTAR UNDANGAN & PENGATURAN STATUS KEAKTIFAN */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-2">
              <span>📋 Daftar Surat Undangan Kegiatan ({kegiatanList.length})</span>
              <span className="text-[11px] font-normal text-slate-400">
                (Klik switch untuk Mengaktifkan / Menutup RSVP di halaman satker)
              </span>
            </h4>
          </div>

          {kegiatanList.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <p className="text-xs text-slate-500">Belum ada undangan kegiatan yang dibuat. Klik tombol Buat Undangan Baru di atas.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {kegiatanList.map(k => {
                const isSelected = activeKegiatan?.id === k.id;
                const totalSatkerK = k.isSemuaSatker ? masterSatkers.length : (k.targetSatkerCodes?.length || 0);
                const confirmedK = konfirmasiList.filter(rec => rec.kegiatanId === k.id && rec.isComplete).length;
                const percentK = totalSatkerK > 0 ? ((confirmedK / totalSatkerK) * 100).toFixed(0) : '0';

                return (
                  <div
                    key={k.id}
                    className={`rounded-2xl border transition-all p-4 flex flex-col justify-between ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-md ring-2 ring-emerald-500/20'
                        : isDark
                        ? 'bg-slate-800/60 border-slate-700/80 hover:border-slate-600'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      {/* Top status bar & toggle */}
                      <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-200 dark:border-slate-700">
                        <span className="text-[10px] font-mono font-bold text-slate-500 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                          {k.nomorSurat}
                        </span>

                        {/* Status Toggle Switch */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleActivityStatus(k)}
                            className={`flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                              k.isActive
                                ? 'bg-emerald-500 text-white border-emerald-600 shadow-2xs hover:bg-emerald-600'
                                : 'bg-slate-200 text-slate-600 border-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600 hover:bg-slate-300'
                            }`}
                            title="Klik untuk menyalakan/mematikan keaktifan undangan ini"
                          >
                            {k.isActive ? (
                              <>
                                <ToggleRight className="w-4 h-4" />
                                <span>STATUS: AKTIF</span>
                              </>
                            ) : (
                              <>
                                <ToggleLeft className="w-4 h-4 text-slate-400" />
                                <span>NON-AKTIF</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Judul & Agenda */}
                      <h5 className="font-extrabold text-sm line-clamp-2 text-slate-900 dark:text-white">
                        {k.judulKegiatan}
                      </h5>
                      {k.subJudul && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                          {k.subJudul}
                        </p>
                      )}

                      {/* Info chips */}
                      <div className="mt-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{k.tanggalKegiatan} ({k.waktuKegiatan})</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span className="truncate">{k.lokasiKegiatan}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <Users className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span>Pejabat: <strong className="text-slate-900 dark:text-white">{k.targetPejabat.join(', ')}</strong></span>
                        </div>
                      </div>

                      {/* Progress RSVP mini */}
                      <div className="mt-3 bg-white dark:bg-slate-900 rounded-xl p-2.5 border border-slate-200 dark:border-slate-700">
                        <div className="flex justify-between items-center text-[11px] font-bold mb-1">
                          <span className="text-slate-500">Respon Satker:</span>
                          <span className="text-emerald-600 dark:text-emerald-400">
                            {confirmedK} / {totalSatkerK} ({percentK}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all"
                            style={{ width: `${Math.min(100, Number(percentK))}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action buttons */}
                    <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedKegiatanId(k.id)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{isSelected ? 'Sedang Dipantau' : 'Pantau RSVP'}</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(k)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                          title="Edit Undangan"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteActivity(k)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Undangan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: DETAIL MONITORING KEGIATAN TERPILIH */}
      {activeKegiatan && (
        <div className={`${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'} rounded-3xl border shadow-xl p-6 sm:p-8 space-y-6`}>
          {/* Header Monitoring */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  {activeKegiatan.nomorSurat}
                </span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  activeKegiatan.isActive
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}>
                  {activeKegiatan.isActive ? 'STATUS: AKTIF' : 'STATUS: DITUTUP / NON-AKTIF'}
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {activeKegiatan.judulKegiatan}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Target Pejabat: <strong className="text-slate-800 dark:text-slate-200">{activeKegiatan.targetPejabat.join(', ')}</strong> &bull; Batas RSVP: <strong className="text-amber-600 dark:text-amber-400">{activeKegiatan.batasWaktuKonfirmasi || '-'}</strong>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleExportExcel}
                className="font-extrabold text-xs sm:text-sm px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white shadow-md flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>📥 Unduh Rekap Excel (XLSX)</span>
              </button>
            </div>
          </div>

          {/* KPI Statistics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-bold mb-1">
                <Users className="w-4 h-4 text-blue-500" />
                <span>Total Diundang</span>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {invitedSatkers.length}
                <span className="text-xs font-normal text-slate-400 ml-1">Satker</span>
              </div>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl p-4 border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs font-bold mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Sudah Konfirmasi</span>
              </div>
              <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
                {confirmedSatkers.length}
                <span className="text-xs font-semibold ml-1.5">
                  ({invitedSatkers.length > 0 ? ((confirmedSatkers.length / invitedSatkers.length) * 100).toFixed(1) : 0}%)
                </span>
              </div>
            </div>

            <div className="bg-rose-50 dark:bg-rose-950/40 rounded-2xl p-4 border border-rose-200 dark:border-rose-800">
              <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 text-xs font-bold mb-1">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Belum Konfirmasi</span>
              </div>
              <div className="text-2xl font-black text-rose-700 dark:text-rose-400">
                {unconfirmedSatkers.length}
                <span className="text-xs font-semibold ml-1.5">
                  ({invitedSatkers.length > 0 ? ((unconfirmedSatkers.length / invitedSatkers.length) * 100).toFixed(1) : 0}%)
                </span>
              </div>
            </div>

            <div className="bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl p-4 border border-indigo-200 dark:border-indigo-800">
              <div className="flex items-center gap-2 text-indigo-800 dark:text-indigo-300 text-xs font-bold mb-1">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span>Tipe Pelaksanaan</span>
              </div>
              <div className="text-sm font-extrabold text-indigo-900 dark:text-indigo-200 mt-1">
                {activeKegiatan.tipePelaksanaan === 'HYBRID' ? 'Hybrid (Aula & Zoom)' : activeKegiatan.tipePelaksanaan === 'OFFLINE' ? 'Luring (Aula KPPN)' : 'Daring (Zoom)'}
              </div>
            </div>
          </div>

          {/* Filter Tabs & Search */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setActiveTab('belum')}
                className={`flex-1 sm:flex-none text-xs font-extrabold px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  activeTab === 'belum'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                <span>🔴 Belum Konfirmasi</span>
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px]">
                  {unconfirmedSatkers.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('sudah')}
                className={`flex-1 sm:flex-none text-xs font-extrabold px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  activeTab === 'sudah'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                <span>🟢 Sudah Konfirmasi</span>
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px]">
                  {confirmedSatkers.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('semua')}
                className={`flex-1 sm:flex-none text-xs font-extrabold px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  activeTab === 'semua'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                <span>Semua Satker</span>
                <span className="bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded-full text-[10px]">
                  {invitedSatkers.length}
                </span>
              </button>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari satker / nama pejabat..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Table Monitoring */}
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 font-extrabold border-b border-slate-200 dark:border-slate-700">
                  <th className="py-3 px-3 w-10 text-center">No</th>
                  <th className="py-3 px-4">Satuan Kerja</th>
                  <th className="py-3 px-3 text-center">Status RSVP</th>
                  <th className="py-3 px-4">Detail Pejabat / Delegasi</th>
                  <th className="py-3 px-4">Kontak WhatsApp</th>
                  <th className="py-3 px-3 text-center">Aksi Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {displayedSatkers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                      Tidak ada satuan kerja yang sesuai kriteria filter.
                    </td>
                  </tr>
                ) : (
                  displayedSatkers.map((satker, idx) => {
                    const status = getSatkerStatus(satker.kodeSatker);

                    return (
                      <tr
                        key={satker.kodeSatker}
                        className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                          status.isUnconfirmed
                            ? 'bg-rose-50/20 dark:bg-rose-950/10'
                            : status.isPartial
                            ? 'bg-amber-50/25 dark:bg-amber-950/10'
                            : ''
                        }`}
                      >
                        <td className="py-3 px-3 text-center font-mono text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-extrabold text-slate-900 dark:text-white">
                            {satker.namaSatker}
                          </div>
                          <div className="text-[11px] font-mono text-slate-500">
                            Kode: {satker.kodeSatker} &bull; {satker.kementerianLembaga || 'K/L'}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {status.isComplete ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              LENGKAP ({status.count}/{status.total})
                            </span>
                          ) : status.isPartial ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              BELUM LENGKAP ({status.count}/{status.total})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              BELUM KONFIRMASI
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-1.5">
                            {targetRoles.map(role => {
                              const rec = status.records.find(r => r.pejabatTarget === role);
                              if (rec) {
                                return (
                                  <div key={role} className="flex flex-wrap items-center gap-1.5 text-[11px]">
                                    <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-extrabold px-1.5 py-0.5 rounded text-[10px]">
                                      {role}:
                                    </span>
                                    <span className="font-bold text-slate-800 dark:text-slate-200">
                                      {rec.namaPeserta}
                                    </span>
                                    <span className="text-slate-400 font-mono text-[10px]">
                                      (NIP: {rec.nipPeserta || '-'})
                                    </span>
                                    <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                                      &bull; {rec.statusKehadiran === 'HADIR_LANGSUNG' ? '📍 Langsung' : rec.statusKehadiran === 'HADIR_ONLINE' ? '💻 Zoom' : rec.statusKehadiran === 'DIKUASAKAN' ? `🤝 Kuasa (${rec.namaPengganti || '-'})` : '❌ Izin'}
                                    </span>
                                  </div>
                                );
                              } else {
                                return (
                                  <div key={role} className="flex items-center gap-1.5 text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                                    <span className="bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-extrabold px-1.5 py-0.5 rounded text-[10px]">
                                      {role}:
                                    </span>
                                    <span className="italic">Belum mengisi konfirmasi</span>
                                  </div>
                                );
                              }
                            })}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                          {status.records[0]?.noHpWhatsapp ? (
                            <span>{status.records[0].noHpWhatsapp}</span>
                          ) : (
                            <span>{satker.noHpPic || satker.pejabatOperator?.ppk?.noHp || '-'}</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {!status.isComplete && (
                              <button
                                type="button"
                                onClick={() => handleSendWaReminder(satker)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] shadow-2xs transition-all cursor-pointer"
                                title="Kirim Pesan WhatsApp Pengingat Resmi ke Satker"
                              >
                                <Send className="w-3 h-3" />
                                <span>Kirim WA</span>
                              </button>
                            )}

                            {status.records.length > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  // Reset all records for this satker for this activity
                                  status.records.forEach(r => handleDeleteConfirmation(r));
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-[11px] font-bold transition-all cursor-pointer"
                                title="Reset status konfirmasi satker ini agar bisa mengisi ulang"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Reset RSVP</span>
                              </button>
                            )}
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
      )}

      {/* MODAL BUAT / EDIT UNDANGAN */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                  {editingKegiatanId ? '✏️ Edit Surat Undangan Kegiatan' : '➕ Buat Undangan Kegiatan Baru'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Lengkapi data detail agenda kedinasan dan atur status keaktifan surat undangan.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4">
              {/* Status Switch Aktif */}
              <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-2xl border border-amber-200 dark:border-amber-800 flex items-center justify-between">
                <div>
                  <div className="font-extrabold text-sm text-amber-900 dark:text-amber-200">
                    Status Keaktifan Undangan (Live RSVP)
                  </div>
                  <div className="text-xs text-amber-700 dark:text-amber-400">
                    Jika AKTIF, undangan akan muncul di dashboard satker untuk menerima pengisian RSVP.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFormIsActive(!formIsActive)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-black text-xs cursor-pointer transition-all ${
                    formIsActive
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                  }`}
                >
                  {formIsActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                  <span>{formIsActive ? 'AKTIF (BUKA)' : 'NON-AKTIF (TUTUP)'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nomor Surat Undangan *
                  </label>
                  <input
                    type="text"
                    required
                    value={formNomor}
                    onChange={e => setFormNomor(e.target.value)}
                    placeholder="Contoh: UND-118/KPN.1401/2026"
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tipe Pelaksanaan *
                  </label>
                  <select
                    value={formTipe}
                    onChange={e => setFormTipe(e.target.value as any)}
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  >
                    <option value="HYBRID">HYBRID (Tatap Muka &amp; Zoom Online)</option>
                    <option value="OFFLINE">OFFLINE (Tatap Muka Langsung)</option>
                    <option value="ONLINE">ONLINE (Daring / Video Conference)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Judul Acara / Kegiatan Kedinasan *
                </label>
                <input
                  type="text"
                  required
                  value={formJudul}
                  onChange={e => setFormJudul(e.target.value)}
                  placeholder="Contoh: Sosialisasi Evaluasi Pelaksanaan Anggaran & IKPA Triwulan III TA 2026"
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Sub Tema / Agenda Singkat
                </label>
                <input
                  type="text"
                  value={formSubJudul}
                  onChange={e => setFormSubJudul(e.target.value)}
                  placeholder="Contoh: Optimalisasi Kinerja Penyerapan, Deviasi Hal III, dan Kepatuhan Pelaporan SAKTI"
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tanggal Pelaksanaan *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTanggal}
                    onChange={e => setFormTanggal(e.target.value)}
                    placeholder="Contoh: 30 September 2026"
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Waktu / Jam Pelaksanaan *
                  </label>
                  <input
                    type="text"
                    required
                    value={formWaktu}
                    onChange={e => setFormWaktu(e.target.value)}
                    placeholder="Contoh: 08:30 - 12:00 WIB"
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Lokasi Tempat Pelaksanaan *
                </label>
                <input
                  type="text"
                  required
                  value={formLokasi}
                  onChange={e => setFormLokasi(e.target.value)}
                  placeholder="Contoh: Aula Lantai 2 KPPN Semarang I / Zoom Meeting Hybrid"
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              {formTipe !== 'OFFLINE' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Link Zoom / Video Meeting (Opsional)
                  </label>
                  <input
                    type="text"
                    value={formLinkMeeting}
                    onChange={e => setFormLinkMeeting(e.target.value)}
                    placeholder="https://zoom.us/j/..."
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Batas Waktu Konfirmasi (Deadline RSVP) *
                </label>
                <input
                  type="text"
                  required
                  value={formDeadline}
                  onChange={e => setFormDeadline(e.target.value)}
                  placeholder="Contoh: 29 September 2026, 17:00 WIB"
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                />
              </div>

              {/* Target Pejabat */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Sasaran Pejabat Satuan Kerja yang Diundang * (Bisa Lebih dari 1)
                </label>
                <div className="flex flex-wrap gap-2">
                  {(['KPA', 'PPK', 'PPSPM', 'Bendahara', 'Operator', 'Lainnya'] as TargetPejabatUndangan[]).map(role => {
                    const isChecked = formTargetPejabat.includes(role);
                    return (
                      <button
                        type="button"
                        key={role}
                        onClick={() => {
                          if (isChecked) {
                            setFormTargetPejabat(formTargetPejabat.filter(r => r !== role));
                          } else {
                            setFormTargetPejabat([...formTargetPejabat, role]);
                          }
                        }}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all border cursor-pointer ${
                          isChecked
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        {isChecked ? '✓ ' : '+ '}{role}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cakupan Satker */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Cakupan Satuan Kerja yang Diundang
                </label>
                <div className="flex items-center gap-4 text-xs font-bold">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="cakupanSatker"
                      checked={formIsSemuaSatker}
                      onChange={() => setFormIsSemuaSatker(true)}
                    />
                    <span>Seluruh Satker Mitra KPPN ({masterSatkers.length} Satker)</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="cakupanSatker"
                      checked={!formIsSemuaSatker}
                      onChange={() => setFormIsSemuaSatker(false)}
                    />
                    <span>Pilih Satker Tertentu ({formSelectedSatkers.length} Dipilih)</span>
                  </label>
                </div>

                {!formIsSemuaSatker && (
                  <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <input
                      type="text"
                      placeholder="Cari satker dalam daftar..."
                      value={satkerSearchModal}
                      onChange={e => setSatkerSearchModal(e.target.value)}
                      className="w-full text-xs p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                    <div className="max-h-40 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900">
                      {masterSatkers
                        .filter(s => {
                          if (!satkerSearchModal) return true;
                          return (
                            s.kodeSatker.includes(satkerSearchModal) ||
                            s.namaSatker.toLowerCase().includes(satkerSearchModal.toLowerCase())
                          );
                        })
                        .map(s => {
                          const isChecked = formSelectedSatkers.includes(s.kodeSatker);
                          return (
                            <label
                              key={s.kodeSatker}
                              className="flex items-center gap-2 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-xs"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  if (isChecked) {
                                    setFormSelectedSatkers(formSelectedSatkers.filter(c => c !== s.kodeSatker));
                                  } else {
                                    setFormSelectedSatkers([...formSelectedSatkers, s.kodeSatker]);
                                  }
                                }}
                              />
                              <span className="font-mono text-slate-500">{s.kodeSatker}</span>
                              <span className="truncate">{s.namaSatker}</span>
                            </label>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md cursor-pointer transition-all"
                >
                  {editingKegiatanId ? 'Simpan Perubahan Undangan' : 'Terbitkan Undangan Baru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
