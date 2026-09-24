import React, { useState, useMemo } from 'react';
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Search,
  Building2,
  Calendar,
  MapPin,
  UserCheck,
  Check,
  X,
  Info,
  Settings,
  Edit3,
  ShieldCheck,
  ArrowRight,
  Trash2
} from 'lucide-react';
import {
  UndanganKonfirmasiKegiatan,
  KonfirmasiKehadiranRecord,
  MasterSatker,
  AppTheme,
  TargetPejabatUndangan,
  StatusKehadiranRSVP,
  DashboardConfig,
  DashboardCustomTexts
} from '../types';
import { exportKonfirmasiKehadiranToExcel } from '../utils/exportKonfirmasiExcel';

interface KonfirmasiKehadiranDashboardProps {
  kegiatanList: UndanganKonfirmasiKegiatan[];
  konfirmasiList: KonfirmasiKehadiranRecord[];
  masterSatkers: MasterSatker[];
  theme: AppTheme;
  dashboardConfig?: DashboardConfig;
  customTexts?: DashboardCustomTexts;
  isAdminAuthenticated?: boolean;
  onSaveKegiatan?: (kegiatan: UndanganKonfirmasiKegiatan) => void;
  onDeleteKegiatan?: (kegiatanId: string) => void;
  onSaveKonfirmasi: (record: KonfirmasiKehadiranRecord) => void;
  onDeleteKonfirmasi?: (recordId: string) => void;
  onClearAllKonfirmasi?: () => void;
  onGoToAdmin?: () => void;
}

export const KonfirmasiKehadiranDashboard: React.FC<KonfirmasiKehadiranDashboardProps> = ({
  kegiatanList,
  konfirmasiList,
  masterSatkers,
  theme,
  isAdminAuthenticated = false,
  onSaveKonfirmasi,
  onDeleteKonfirmasi,
  onClearAllKonfirmasi,
  onGoToAdmin
}) => {
  const isDark = theme === 'dark';

  // Only take active activities (isActive !== false)
  const activeKegiatanList = useMemo(() => {
    return kegiatanList.filter(k => k.isActive !== false);
  }, [kegiatanList]);

  // Selected active activity for RSVP & monitoring
  const [selectedKegiatanId, setSelectedKegiatanId] = useState<string>(() => {
    const active = kegiatanList.filter(k => k.isActive !== false);
    return active[0]?.id || kegiatanList[0]?.id || '';
  });

  // Current active activity
  const currentKegiatan = useMemo(() => {
    if (activeKegiatanList.length === 0) return null;
    return activeKegiatanList.find(k => k.id === selectedKegiatanId) || activeKegiatanList[0];
  }, [activeKegiatanList, selectedKegiatanId]);

  // Target pejabat roles required for current activity
  const targetRoles: TargetPejabatUndangan[] = useMemo(() => {
    if (currentKegiatan && currentKegiatan.targetPejabat && currentKegiatan.targetPejabat.length > 0) {
      return currentKegiatan.targetPejabat;
    }
    return ['PPK', 'PPSPM'];
  }, [currentKegiatan]);

  // Tab filter: 'belum' by default as requested ("langsung ketahuan siapa yang belum")
  const [filterTab, setFilterTab] = useState<'belum' | 'sudah' | 'semua'>('belum');
  const [searchQuery, setSearchQuery] = useState('');

  // Invited satkers for current activity
  const invitedSatkers = useMemo(() => {
    if (!currentKegiatan) return masterSatkers;
    if (currentKegiatan.isSemuaSatker) return masterSatkers;
    const targetCodes = new Set(currentKegiatan.targetSatkerCodes || []);
    return masterSatkers.filter(s => targetCodes.has(s.kodeSatker));
  }, [currentKegiatan, masterSatkers]);

  // Map of completed confirmations grouped by satker code -> array of records
  const satkerConfirmationsMap = useMemo(() => {
    const map = new Map<string, KonfirmasiKehadiranRecord[]>();
    if (!currentKegiatan) return map;
    konfirmasiList
      .filter(k => k.kegiatanId === currentKegiatan.id && k.isComplete)
      .forEach(rec => {
        const existing = map.get(rec.kodeSatker) || [];
        // prevent duplicate role
        const filtered = existing.filter(r => r.pejabatTarget !== rec.pejabatTarget);
        filtered.push(rec);
        map.set(rec.kodeSatker, filtered);
      });
    return map;
  }, [currentKegiatan, konfirmasiList]);

  // Helper to calculate completion for a satker
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

  // List of Satkers who haven't completed RSVP (either 0 confirmed or partial)
  const unconfirmedSatkers = useMemo(() => {
    return invitedSatkers.filter(s => !getSatkerStatus(s.kodeSatker).isComplete);
  }, [invitedSatkers, getSatkerStatus]);

  // List of Satkers who have completed all required role RSVPs
  const confirmedSatkers = useMemo(() => {
    return invitedSatkers.filter(s => getSatkerStatus(s.kodeSatker).isComplete);
  }, [invitedSatkers, getSatkerStatus]);

  // Filtered Satkers based on Tab & Search Query
  const displayedSatkers = useMemo(() => {
    let baseList: MasterSatker[] = [];
    if (filterTab === 'belum') {
      baseList = unconfirmedSatkers;
    } else if (filterTab === 'sudah') {
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
  }, [filterTab, unconfirmedSatkers, confirmedSatkers, invitedSatkers, searchQuery, getSatkerStatus]);

  // RSVP Modal State
  const [isRsvpModalOpen, setIsRsvpModalOpen] = useState(false);
  const [modalSatker, setModalSatker] = useState<MasterSatker | null>(null);

  // Form Fields
  const [formPejabat, setFormPejabat] = useState<TargetPejabatUndangan>('PPK');
  const [formStatus, setFormStatus] = useState<StatusKehadiranRSVP>('HADIR_LANGSUNG');
  const [formNama, setFormNama] = useState('');
  const [formNip, setFormNip] = useState('');
  const [formJabatan, setFormJabatan] = useState('');
  const [formWa, setFormWa] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPenggantiNama, setFormPenggantiNama] = useState('');
  const [formPenggantiNip, setFormPenggantiNip] = useState('');
  const [formPenggantiJabatan, setFormPenggantiJabatan] = useState('');
  const [formAlasan, setFormAlasan] = useState('');
  const [formCatatan, setFormCatatan] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [roleSuccessMessage, setRoleSuccessMessage] = useState<string | null>(null);

  // Load data for a specific role inside the modal
  const loadRoleData = (role: TargetPejabatUndangan, satker: MasterSatker) => {
    if (!currentKegiatan) return;
    setFormPejabat(role);

    const satkerRecords = satkerConfirmationsMap.get(satker.kodeSatker) || [];
    const existing = satkerRecords.find(r => r.pejabatTarget === role);

    if (existing) {
      // Editing existing confirmation
      setFormStatus(existing.statusKehadiran);
      setFormNama(existing.namaPeserta || '');
      setFormNip(existing.nipPeserta || '');
      setFormJabatan(existing.jabatanPeserta || '');
      setFormWa(existing.noHpWhatsapp || '');
      setFormEmail(existing.emailPeserta || '');
      setFormPenggantiNama(existing.namaPengganti || '');
      setFormPenggantiNip(existing.nipPengganti || '');
      setFormPenggantiJabatan(existing.jabatanPengganti || '');
      setFormAlasan(existing.alasanBerhalangan || '');
      setFormCatatan(existing.catatan || '');
    } else {
      // New RSVP: prefill from masterSatker data for this specific role
      setFormStatus('HADIR_LANGSUNG');
      const roleKey = role.toLowerCase() as keyof typeof satker.pejabatOperator;
      const roleData = satker.pejabatOperator?.[roleKey];

      if (roleData && roleData.nama) {
        setFormNama(roleData.nama);
        setFormNip(roleData.nip || '');
        setFormWa(roleData.noHp || satker.noHpPic || '');
        setFormEmail(roleData.email || satker.emailPic || '');
      } else {
        setFormNama(satker.namaPic || '');
        setFormNip('');
        setFormWa(satker.noHpPic || '');
        setFormEmail(satker.emailPic || '');
      }

      setFormJabatan(
        role === 'KPA'
          ? 'Kuasa Pengguna Anggaran'
          : role === 'PPK'
          ? 'Pejabat Pembuat Komitmen'
          : role === 'PPSPM'
          ? 'Pejabat Penandatangan SPM'
          : role === 'Bendahara'
          ? 'Bendahara Pengeluaran'
          : 'Operator SAKTI'
      );
      setFormPenggantiNama('');
      setFormPenggantiNip('');
      setFormPenggantiJabatan('');
      setFormAlasan('');
      setFormCatatan('');
    }
  };

  // Open RSVP Modal for a specific satker
  const handleOpenRsvpModal = (satker: MasterSatker, initialRole?: TargetPejabatUndangan) => {
    if (!currentKegiatan) return;
    setModalSatker(satker);
    setRoleSuccessMessage(null);

    // Pick first unconfirmed role, or the first role in targetRoles
    const status = getSatkerStatus(satker.kodeSatker);
    const chosenRole = initialRole || (status.missingRoles.length > 0 ? status.missingRoles[0] : targetRoles[0]);
    loadRoleData(chosenRole, satker);
    setIsRsvpModalOpen(true);
  };

  // Switch role inside the modal
  const handleChangeRole = (newRole: TargetPejabatUndangan) => {
    if (!modalSatker) return;
    setRoleSuccessMessage(null);
    loadRoleData(newRole, modalSatker);
  };

  // Submit RSVP Form
  const handleSubmitRsvp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentKegiatan || !modalSatker) return;

    if (!formNama.trim()) {
      alert(`Mohon isi nama lengkap pejabat ${formPejabat} atau delegasi yang hadir.`);
      return;
    }
    if (!formWa.trim()) {
      alert('Mohon isi nomor WhatsApp aktif untuk koordinasi kegiatan.');
      return;
    }

    setIsSubmitting(true);

    const satkerRecords = satkerConfirmationsMap.get(modalSatker.kodeSatker) || [];
    const prev = satkerRecords.find(r => r.pejabatTarget === formPejabat);

    const record: KonfirmasiKehadiranRecord = {
      id: prev ? prev.id : `rsvp-${currentKegiatan.id}-${modalSatker.kodeSatker}-${formPejabat}`,
      kegiatanId: currentKegiatan.id,
      kodeSatker: modalSatker.kodeSatker,
      namaSatker: modalSatker.namaSatker,
      pejabatTarget: formPejabat,
      statusKehadiran: formStatus,
      namaPeserta: formNama.trim(),
      nipPeserta: formNip.trim() || '-',
      jabatanPeserta: formJabatan.trim(),
      noHpWhatsapp: formWa.trim(),
      emailPeserta: formEmail.trim(),
      namaPengganti: formStatus === 'DIKUASAKAN' ? formPenggantiNama.trim() : undefined,
      nipPengganti: formStatus === 'DIKUASAKAN' ? formPenggantiNip.trim() : undefined,
      jabatanPengganti: formStatus === 'DIKUASAKAN' ? formPenggantiJabatan.trim() : undefined,
      alasanBerhalangan: formStatus === 'BERHALANGAN' ? formAlasan.trim() : undefined,
      catatan: formCatatan.trim() || undefined,
      isComplete: true,
      waktuKonfirmasi: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSaveKonfirmasi(record);
    setIsSubmitting(false);

    // Check if there are other unconfirmed roles for this satker
    const updatedRecords = [...satkerRecords.filter(r => r.pejabatTarget !== formPejabat), record];
    const confirmedRoleSet = new Set(updatedRecords.map(r => r.pejabatTarget));
    const remainingRoles = targetRoles.filter(r => !confirmedRoleSet.has(r));

    if (remainingRoles.length > 0) {
      // Keep modal open and switch to next pending role
      const nextRole = remainingRoles[0];
      setRoleSuccessMessage(
        `✅ Konfirmasi kehadiran untuk ${formPejabat} (${formNama.trim()}) berhasil disimpan! Mohon lanjutkan mengisi konfirmasi untuk ${nextRole} agar kehadiran satker berstatus lengkap.`
      );
      loadRoleData(nextRole, modalSatker);
    } else {
      // All required target roles for this satker are completed!
      setIsRsvpModalOpen(false);
      setShowSuccessToast(true);
      setTimeout(() => {
        setShowSuccessToast(false);
      }, 4500);
    }
  };

  // Export Excel
  const handleExportExcel = () => {
    if (!currentKegiatan) return;
    const activeConfirmations = konfirmasiList.filter(k => k.kegiatanId === currentKegiatan.id && k.isComplete);
    exportKonfirmasiKehadiranToExcel({
      kegiatan: currentKegiatan,
      konfirmasiList: activeConfirmations,
      invitedSatkers,
      belumKonfirmasiSatkers: unconfirmedSatkers
    });
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {showSuccessToast && (
        <div className="fixed top-6 right-6 z-50 animate-bounce">
          <div className="bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-400">
            <CheckCircle2 className="w-5 h-5 text-white" />
            <div>
              <div className="font-extrabold text-sm">Konfirmasi Lengkap Berhasil Disimpan!</div>
              <div className="text-xs text-emerald-100">Semua target pejabat ({targetRoles.join(', ')}) telah terisi. Satuan kerja otomatis berpindah ke daftar Sudah Konfirmasi.</div>
            </div>
          </div>
        </div>
      )}

      {/* Main Header Card */}
      <div className={`${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'} rounded-3xl border shadow-xl p-6 sm:p-8 space-y-4`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-3 py-1 rounded-full text-xs font-bold mb-2">
              <UserCheck className="w-3.5 h-3.5" />
              KONFIRMASI KEHADIRAN SATUAN KERJA (RSVP)
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Daftar Konfirmasi Kehadiran Satuan Kerja KPPN Semarang I
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1 max-w-3xl">
              Pantau langsung daftar satuan kerja yang telah dan belum mengisi konfirmasi kehadiran (RSVP) pejabat per kegiatan dinas resmi.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {currentKegiatan && (
              <button
                type="button"
                onClick={handleExportExcel}
                className="font-extrabold text-xs sm:text-sm px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white shadow-md flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>📥 Unduh Rekap Excel</span>
              </button>
            )}

            {konfirmasiList.length > 0 && onClearAllKonfirmasi && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Kosongkan semua data respon konfirmasi kehadiran (RSVP)? Semua data konfirmasi saat ini akan dibersihkan agar Anda dapat mengisi dari awal secara mandiri.')) {
                    onClearAllKonfirmasi();
                  }
                }}
                className="font-extrabold text-xs sm:text-sm px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-md flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
                title="Kosongkan seluruh data RSVP untuk mencoba pengisian dari awal"
              >
                <Trash2 className="w-4 h-4" />
                <span>🗑️ Kosongkan Data RSVP ({konfirmasiList.length})</span>
              </button>
            )}

            {isAdminAuthenticated && onGoToAdmin && (
              <button
                type="button"
                onClick={onGoToAdmin}
                className="font-extrabold text-xs sm:text-sm px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white dark:bg-slate-700 dark:hover:bg-slate-600 shadow-md flex items-center gap-2 cursor-pointer transition-all"
                title="Buka panel admin untuk mengatur undangan aktif atau membuat undangan baru"
              >
                <Settings className="w-4 h-4 text-emerald-400" />
                <span>⚙️ Pengaturan di Tab Admin</span>
              </button>
            )}
          </div>
        </div>

        {/* Active Activity Selector (If multiple active invitations) */}
        {activeKegiatanList.length > 1 && (
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs font-extrabold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-600" />
              Pilih Surat Undangan Kegiatan Aktif:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {activeKegiatanList.map(k => (
                <button
                  type="button"
                  key={k.id}
                  onClick={() => setSelectedKegiatanId(k.id)}
                  className={`text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                    currentKegiatan?.id === k.id
                      ? 'bg-emerald-600 text-white shadow-sm font-extrabold'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {k.nomorSurat}: {k.judulKegiatan.substring(0, 35)}...
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Current Invitation Information Card */}
        {currentKegiatan ? (
          <div className="bg-linear-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 rounded-2xl p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-extrabold px-2.5 py-1 rounded bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300">
                  {currentKegiatan.nomorSurat}
                </span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500 text-white">
                  UNDANGAN AKTIF
                </span>
              </div>
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Batas RSVP: <strong className="text-amber-600 dark:text-amber-400 font-extrabold">{currentKegiatan.batasWaktuKonfirmasi || 'Segera'}</strong>
              </div>
            </div>

            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                {currentKegiatan.judulKegiatan}
              </h3>
              {currentKegiatan.subJudul && (
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5">
                  {currentKegiatan.subJudul}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2 bg-white/60 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">WAKTU KEGIATAN</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{currentKegiatan.tanggalKegiatan} ({currentKegiatan.waktuKegiatan})</span>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-white/60 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                <div className="truncate">
                  <span className="text-[10px] text-slate-400 block font-bold">TEMPAT / LOKASI</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">{currentKegiatan.lokasiKegiatan}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-emerald-50/80 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-300 dark:border-emerald-800">
                <Users className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="text-[10px] text-emerald-800 dark:text-emerald-300 block font-extrabold">PEJABAT WAJIB HADIR (TARGET)</span>
                  <span className="font-black text-emerald-900 dark:text-emerald-200">{targetRoles.join(', ')}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-10 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
            <Info className="w-8 h-8 text-slate-400 mx-auto" />
            <h4 className="text-base font-bold text-slate-700 dark:text-slate-300">
              Belum Ada Undangan Kegiatan Aktif
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Saat ini belum ada surat undangan kegiatan yang aktif memerlukan RSVP. Admin dapat mengaktifkan atau membuat surat undangan baru melalui menu Pengaturan Admin.
            </p>
            {isAdminAuthenticated && onGoToAdmin && (
              <button
                type="button"
                onClick={onGoToAdmin}
                className="mt-2 text-xs font-bold px-4 py-2 rounded-xl bg-emerald-600 text-white cursor-pointer hover:bg-emerald-500"
              >
                Ke Menu Admin Undangan
              </button>
            )}
          </div>
        )}

        {/* Real-time KPI Statistics */}
        {currentKegiatan && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 pt-1">
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-bold mb-1">
                <Building2 className="w-4 h-4 text-blue-500" />
                <span>Total Satker Diundang</span>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {invitedSatkers.length}
                <span className="text-xs font-normal text-slate-400 ml-1">Satker</span>
              </div>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl p-4 border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs font-bold mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Sudah Konfirmasi Lengkap</span>
              </div>
              <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
                {confirmedSatkers.length}
                <span className="text-xs font-semibold ml-1.5">
                  ({invitedSatkers.length > 0 ? ((confirmedSatkers.length / invitedSatkers.length) * 100).toFixed(1) : 0}%)
                </span>
              </div>
            </div>

            <div className="bg-rose-50 dark:bg-rose-950/40 rounded-2xl p-4 border border-rose-200 dark:border-rose-800 col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 text-xs font-bold mb-1">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Belum Konfirmasi / Belum Lengkap</span>
              </div>
              <div className="text-2xl font-black text-rose-700 dark:text-rose-400">
                {unconfirmedSatkers.length}
                <span className="text-xs font-semibold ml-1.5">
                  ({invitedSatkers.length > 0 ? ((unconfirmedSatkers.length / invitedSatkers.length) * 100).toFixed(1) : 0}%)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Filter Tabs & Search Bar */}
        {currentKegiatan && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3">
            {/* Quick Filter Buttons */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setFilterTab('belum')}
                className={`flex-1 sm:flex-none text-xs font-black px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  filterTab === 'belum'
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
                onClick={() => setFilterTab('sudah')}
                className={`flex-1 sm:flex-none text-xs font-black px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  filterTab === 'sudah'
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
                onClick={() => setFilterTab('semua')}
                className={`flex-1 sm:flex-none text-xs font-black px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  filterTab === 'semua'
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

            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari kode satker, nama, K/L..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>
          </div>
        )}

        {/* SATKER LIST TABLE */}
        {currentKegiatan && (
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl mt-2">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 font-black border-b border-slate-200 dark:border-slate-700">
                  <th className="py-3.5 px-3 w-10 text-center">No</th>
                  <th className="py-3.5 px-4 min-w-[220px]">Satuan Kerja &amp; Instansi</th>
                  <th className="py-3.5 px-3 text-center min-w-[170px]">
                    Status RSVP (Wajib: {targetRoles.join(' & ')})
                  </th>
                  <th className="py-3.5 px-4 min-w-[280px]">Delegasi Pejabat yang Hadir</th>
                  <th className="py-3.5 px-3 text-center min-w-[150px]">Aksi Konfirmasi (RSVP)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {displayedSatkers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 italic">
                      Tidak ada satuan kerja yang sesuai dengan filter pencarian.
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
                        <td className="py-3.5 px-3 text-center font-mono text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-extrabold text-slate-900 dark:text-white">
                            {satker.namaSatker}
                          </div>
                          <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                            Kode: <span className="font-bold text-slate-700 dark:text-slate-300">{satker.kodeSatker}</span> &bull; {satker.kementerianLembaga || 'K/L'}
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          {status.isComplete ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shadow-2xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              LENGKAP ({status.count}/{status.total})
                            </span>
                          ) : status.isPartial ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800 shadow-2xs">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                              BELUM LENGKAP ({status.count}/{status.total})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800 shadow-2xs animate-pulse">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                              BELUM KONFIRMASI
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="space-y-1.5">
                            {targetRoles.map(role => {
                              const rec = status.records.find(r => r.pejabatTarget === role);
                              if (rec) {
                                return (
                                  <div key={role} className="flex flex-wrap items-center gap-1.5 text-[11px]">
                                    <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-extrabold px-1.5 py-0.5 rounded text-[10px]">
                                      {role}
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
                                      {role}
                                    </span>
                                    <span className="italic">Belum mengisi konfirmasi</span>
                                  </div>
                                );
                              }
                            })}
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          {!status.isComplete ? (
                            <button
                              type="button"
                              onClick={() => handleOpenRsvpModal(satker)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition-all hover:scale-[1.03] cursor-pointer"
                            >
                              <span>✍️ Isi RSVP {status.missingRoles.length > 0 ? `(${status.missingRoles.join(' & ')})` : ''}</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenRsvpModal(satker)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 font-bold text-[11px] transition-all cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                              <span>Ubah RSVP</span>
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
      </div>

      {/* MODAL FORM RSVP KONFIRMASI KEHADIRAN */}
      {isRsvpModalOpen && modalSatker && currentKegiatan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-5">
            {/* Header Modal */}
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-mono font-bold mb-1">
                  KODE SATKER: {modalSatker.kodeSatker}
                </span>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                  {modalSatker.namaSatker}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Form Konfirmasi Kehadiran Undangan: <strong className="text-slate-800 dark:text-slate-200">{currentKegiatan.judulKegiatan}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsRsvpModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notification when previous role was saved */}
            {roleSuccessMessage && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 rounded-2xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{roleSuccessMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmitRsvp} className="space-y-4">
              {/* Pilihan Peran Pejabat Terundang (STRICTLY FILTERED BY UNDANGAN) */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black text-slate-900 dark:text-white">
                    🎯 Pejabat yang Wajib Konfirmasi Kehadiran Sesuai Surat Undangan:
                  </label>
                  <span className="text-[10px] font-bold text-slate-500">
                    Target: {targetRoles.join(', ')}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Hanya pejabat yang tercantum pada surat undangan KPPN yang wajib mengisi form kehadiran di bawah ini:
                </p>
                
                {/* STRICTLY RENDER ONLY TARGET ROLES FROM INVITATION */}
                <div className="flex flex-wrap gap-2.5 pt-1">
                  {targetRoles.map(role => {
                    const isSelected = formPejabat === role;
                    const satkerRecords = satkerConfirmationsMap.get(modalSatker.kodeSatker) || [];
                    const isFilled = satkerRecords.some(r => r.pejabatTarget === role && r.isComplete);

                    return (
                      <button
                        type="button"
                        key={role}
                        onClick={() => handleChangeRole(role)}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all border cursor-pointer flex items-center gap-2 ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-500/30'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-slate-400'
                        }`}
                      >
                        <span>{role}</span>
                        {isFilled ? (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-extrabold ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}>
                            ✓ Sudah Terisi
                          </span>
                        ) : (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-extrabold ${
                            isSelected ? 'bg-amber-300 text-amber-950' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}>
                            Wajib Diisi
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status Kehadiran */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Status Kehadiran untuk {formPejabat} *
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setFormStatus('HADIR_LANGSUNG')}
                    className={`p-3 rounded-xl border text-left font-bold transition-all cursor-pointer ${
                      formStatus === 'HADIR_LANGSUNG'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    📍 Hadir Langsung di Lokasi
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormStatus('HADIR_ONLINE')}
                    className={`p-3 rounded-xl border text-left font-bold transition-all cursor-pointer ${
                      formStatus === 'HADIR_ONLINE'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    💻 Hadir Online (Zoom)
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormStatus('DIKUASAKAN')}
                    className={`p-3 rounded-xl border text-left font-bold transition-all cursor-pointer ${
                      formStatus === 'DIKUASAKAN'
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    🤝 Dikuasakan / Mewakili
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormStatus('BERHALANGAN')}
                    className={`p-3 rounded-xl border text-left font-bold transition-all cursor-pointer ${
                      formStatus === 'BERHALANGAN'
                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 ring-2 ring-rose-500/20'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    ❌ Berhalangan Hadir
                  </button>
                </div>
              </div>

              {/* Data Pejabat Utama */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Pejabat / Perwakilan ({formPejabat}) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formNama}
                    onChange={e => setFormNama(e.target.value)}
                    placeholder="Contoh: Budi Santoso, S.E., M.Si."
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    NIP (18 Digit atau tanda -)
                  </label>
                  <input
                    type="text"
                    value={formNip}
                    onChange={e => setFormNip(e.target.value)}
                    placeholder="198501012010011001"
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nomor WhatsApp Aktif *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formWa}
                    onChange={e => setFormWa(e.target.value)}
                    placeholder="081234567890"
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email Satker / Pejabat
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={e => setFormEmail(e.target.value)}
                    placeholder="satker@kemenkeu.go.id"
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Jabatan Kedinasan
                </label>
                <input
                  type="text"
                  value={formJabatan}
                  onChange={e => setFormJabatan(e.target.value)}
                  placeholder="Pejabat Pembuat Komitmen"
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              {/* Form Tambahan Jika Dikuasakan */}
              {formStatus === 'DIKUASAKAN' && (
                <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 space-y-3">
                  <div className="font-extrabold text-xs text-indigo-900 dark:text-indigo-200">
                    Data Pejabat / Pegawai Pengganti yang Ditugaskan Mewakili {formPejabat}:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Nama Pengganti *
                      </label>
                      <input
                        type="text"
                        required
                        value={formPenggantiNama}
                        onChange={e => setFormPenggantiNama(e.target.value)}
                        placeholder="Nama Pegawai yang Ditugaskan"
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        NIP Pengganti
                      </label>
                      <input
                        type="text"
                        value={formPenggantiNip}
                        onChange={e => setFormPenggantiNip(e.target.value)}
                        placeholder="NIP Pegawai Pengganti"
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Form Tambahan Jika Berhalangan */}
              {formStatus === 'BERHALANGAN' && (
                <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 space-y-2">
                  <label className="block text-xs font-bold text-rose-900 dark:text-rose-200">
                    Alasan Berhalangan Hadir untuk {formPejabat} *
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={formAlasan}
                    onChange={e => setFormAlasan(e.target.value)}
                    placeholder="Contoh: Bersamaan dengan agenda pemeriksaan BPK / Tugas luar kota"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              )}

              {/* Catatan Tambahan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Catatan Tambahan Satker (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={formCatatan}
                  onChange={e => setFormCatatan(e.target.value)}
                  placeholder="Catatan koordinasi kegiatan..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsRsvpModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Tutup
                  </button>

                  {/* If this role already has a saved record, allow deleting it */}
                  {(() => {
                    const satkerRecords = satkerConfirmationsMap.get(modalSatker.kodeSatker) || [];
                    const existing = satkerRecords.find(r => r.pejabatTarget === formPejabat);
                    if (existing && onDeleteKonfirmasi) {
                      return (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Hapus data konfirmasi kehadiran untuk pejabat ${formPejabat} di satker ${modalSatker.namaSatker}?`)) {
                              onDeleteKonfirmasi(existing.id);
                              loadRoleData(formPejabat, modalSatker);
                            }
                          }}
                          className="px-3 py-2 rounded-xl border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                          title={`Hapus rekaman konfirmasi ${formPejabat}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus Data {formPejabat}</span>
                        </button>
                      );
                    }
                    return null;
                  })()}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md cursor-pointer transition-all flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Konfirmasi ({formPejabat})</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
