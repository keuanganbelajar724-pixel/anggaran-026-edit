import React, { useState, useEffect, useMemo } from 'react';
import { MasterSatker, UserSaktiRecord, PerubahanUserData, PerubahanUserHistoryItem, PerubahanUserAuditLog } from '../../types';
import { MASTER_ROLE_MAP, sortRolesByMasterOrder } from '../../data/masterRoleSakti';
import { RoleMultiSelector } from './RoleMultiSelector';
import { UserSelectorModal } from './UserSelectorModal';
import { PreviewPerubahanModal } from './PreviewPerubahanModal';
import { RiwayatPerubahanUserModal } from './RiwayatPerubahanUserModal';
import {
  calculatePerubahanDiff,
  exportPerubahanUserToExcel,
  exportPerubahanUserToPDF
} from '../../utils/perubahanUserSaktiExport';
import { normalizePhoneNumber } from '../../utils/pendaftaranSaktiValidation';
import {
  Users,
  Search,
  UserCheck,
  FileSpreadsheet,
  FileText,
  Eye,
  History,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Info,
  Calendar,
  Lock,
  Edit3,
  RotateCcw,
  Send,
  HelpCircle
} from 'lucide-react';

interface PerubahanUserSaktiTabProps {
  satker: MasterSatker;
  existingUsers: UserSaktiRecord[];
  levelSatker?: string;
  kpaName?: string;
  kpaNip?: string;
  userName?: string;
}

export const PerubahanUserSaktiTab: React.FC<PerubahanUserSaktiTabProps> = ({
  satker,
  existingUsers,
  levelSatker = 'Satker Daerah (KD)',
  kpaName,
  kpaNip,
  userName = 'Operator Satker'
}) => {
  const kodeSatker = satker.kodeSatker;
  const namaSatker = satker.namaSatker;
  const isBLU = (levelSatker || '').toLowerCase().includes('blu') || (namaSatker || '').toLowerCase().includes('blu');

  // Storage Keys per Satker for strict isolation
  const HISTORY_STORAGE_KEY = `sakti_perubahan_user_history_${kodeSatker}`;
  const AUDIT_STORAGE_KEY = `sakti_perubahan_user_audit_${kodeSatker}`;

  // Modal States
  const [isUserSelectorOpen, setIsUserSelectorOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSaktiRecord | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // History State
  const [historyList, setHistoryList] = useState<PerubahanUserHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load perubahan history', e);
    }
    return [];
  });

  // Save history on change
  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(historyList));
    } catch (e) {
      console.error('Failed to save perubahan history', e);
    }
  }, [historyList, HISTORY_STORAGE_KEY]);

  // Form State: SEMULA & MENJADI
  const today = new Date().toISOString().split('T')[0];

  const emptyData: PerubahanUserData = {
    kodeSatker,
    roles: [],
    nama: '',
    nip: '',
    npwp: '',
    nik: '',
    email: '',
    noHp: '',
    nomorSk: '',
    tanggalSk: today,
    keterangan: ''
  };

  const [semula, setSemula] = useState<PerubahanUserData>(emptyData);
  const [menjadi, setMenjadi] = useState<PerubahanUserData>(emptyData);

  // Auto select first user if available and none selected yet
  useEffect(() => {
    if (!selectedUser && existingUsers.length > 0) {
      handleSelectUser(existingUsers[0]);
    }
  }, [existingUsers]);

  // Audit log helper
  const addAuditLog = (action: string, detail: string) => {
    try {
      const logs: PerubahanUserAuditLog[] = JSON.parse(localStorage.getItem(AUDIT_STORAGE_KEY) || '[]');
      const newLog: PerubahanUserAuditLog = {
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action,
        detail,
        user: userName
      };
      logs.unshift(newLog);
      localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(logs.slice(0, 100)));
    } catch (e) {
      console.error('Audit log error', e);
    }
  };

  // Populate data when user is picked
  const handleSelectUser = (user: UserSaktiRecord) => {
    setSelectedUser(user);
    const cleanNip = (user.nip || '').replace(/\D/g, '');
    const cleanNik = (user.nik || '').replace(/\D/g, '');
    const cleanNpwp = (user.npwp || '').trim();
    const cleanPhone = normalizePhoneNumber(user.noHp || '');
    const userRoles = sortRolesByMasterOrder(user.roles || []);

    const userData: PerubahanUserData = {
      kodeSatker,
      roles: [...userRoles],
      nama: user.namaLengkap || '',
      nip: cleanNip,
      npwp: cleanNpwp,
      nik: cleanNik,
      email: user.email || '',
      noHp: cleanPhone,
      nomorSk: user.nomorSk || '',
      tanggalSk: user.tanggalSk || today,
      keterangan: user.keterangan || 'Data awal terdaftar di SAKTI'
    };

    setSemula(userData);
    // Auto populate MENJADI with same data so user only changes what needs to be changed
    setMenjadi({
      ...userData,
      keterangan: 'Perubahan peran / data kepegawaian SAKTI'
    });

    addAuditLog('PILIH_USER', `Membuka data pengguna ${user.namaLengkap} (NIP: ${cleanNip})`);
    showToast('info', `Data pengguna "${user.namaLengkap}" dimuat ke formulir SEMULA & MENJADI.`);
  };

  // Reset MENJADI back to SEMULA
  const handleResetMenjadiToSemula = () => {
    if (!selectedUser) return;
    setMenjadi({
      ...semula,
      keterangan: 'Perubahan peran / data kepegawaian SAKTI'
    });
    showToast('info', 'Data MENJADI disetel ulang mengikuti data SEMULA.');
  };

  // Live Auto-Diff
  const diff = useMemo(() => {
    return calculatePerubahanDiff(semula, menjadi);
  }, [semula, menjadi]);

  const showToast = (type: 'success' | 'error' | 'info', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Build current submission object
  const currentSubmission: PerubahanUserHistoryItem = useMemo(() => {
    return {
      id: `perubahan-${selectedUser?.id || 'new'}-${Date.now()}`,
      kodeSatker,
      namaSatker,
      levelSatker,
      userId: selectedUser?.id || `user-${Date.now()}`,
      semula,
      menjadi,
      diffSummary: diff,
      keterangan: menjadi.keterangan || 'Pengajuan perubahan data pengguna SAKTI',
      status: 'DIAJUKAN',
      tanggalPengajuan: today,
      pejabatPenandatangan: {
        nama: kpaName || satker.pejabatOperator?.kpa?.nama || 'Nama Kuasa Pengguna Anggaran',
        nip: kpaNip || satker.pejabatOperator?.kpa?.nip || '198001012005011001',
        jabatan: 'Kuasa Pengguna Anggaran'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: userName
    };
  }, [selectedUser, semula, menjadi, diff, kodeSatker, namaSatker, levelSatker, today, kpaName, kpaNip, satker, userName]);

  // Handle Export Excel
  const handleExportExcel = async () => {
    if (!selectedUser) {
      showToast('error', 'Silakan pilih user SAKTI terlebih dahulu.');
      return;
    }
    if (!diff.hasChanges) {
      showToast('error', 'Belum ada perubahan data. Ubah peran atau data pengguna pada bagian MENJADI.');
      return;
    }

    try {
      await exportPerubahanUserToExcel(currentSubmission, namaSatker, levelSatker);
      addAuditLog('EXPORT_EXCEL', `Export Excel perubahan user ${menjadi.nama} sesuai template master`);
      showToast('success', 'File Excel Form Perubahan User SAKTI berhasil dibuat dari template resmi dan lolos 14 poin validasi.');
    } catch (e: any) {
      console.error('Error exporting Excel', e);
      showToast('error', e?.message || 'Gagal membuat file Excel: Struktur template tidak valid.');
    }
  };

  // Handle Export PDF
  const handleExportPdf = () => {
    if (!selectedUser) {
      showToast('error', 'Silakan pilih user SAKTI terlebih dahulu.');
      return;
    }
    if (!diff.hasChanges) {
      showToast('error', 'Belum ada perubahan data. Ubah peran atau data pengguna pada bagian MENJADI.');
      return;
    }

    try {
      exportPerubahanUserToPDF(currentSubmission, {
        kodeSatker,
        namaSatker,
        levelSatker,
        namaKpa: kpaName || satker.pejabatOperator?.kpa?.nama,
        nipKpa: kpaNip || satker.pejabatOperator?.kpa?.nip
      });
      addAuditLog('EXPORT_PDF', `Export PDF perubahan user ${menjadi.nama}`);
      showToast('success', 'Dokumen PDF Formulir Perubahan User SAKTI berhasil dibuat.');
    } catch (e) {
      console.error('Error exporting PDF', e);
      showToast('error', 'Gagal membuat dokumen PDF.');
    }
  };

  // Handle Save / Submit
  const handleSaveSubmission = () => {
    if (!selectedUser) {
      showToast('error', 'Silakan pilih user SAKTI terlebih dahulu.');
      return;
    }
    if (!diff.hasChanges) {
      showToast('error', 'Belum ada perubahan data terdeteksi antara SEMULA dan MENJADI.');
      return;
    }
    if (menjadi.roles.length === 0) {
      showToast('error', 'Pengguna harus memiliki minimal 1 peran SAKTI pada bagian MENJADI.');
      return;
    }

    const newHistoryItem: PerubahanUserHistoryItem = {
      ...currentSubmission,
      id: `perubahan-${Date.now()}`
    };

    setHistoryList(prev => [newHistoryItem, ...prev]);
    addAuditLog('SIMPAN_PENGAJUAN', `Menyimpan pengajuan perubahan user ${menjadi.nama}`);
    showToast('success', 'Pengajuan perubahan berhasil disimpan ke riwayat Satker!');
  };

  // Load from history item into form
  const handleLoadFromHistory = (item: PerubahanUserHistoryItem) => {
    setSemula(item.semula);
    setMenjadi(item.menjadi);
    setIsHistoryOpen(false);
    showToast('info', `Memuat draf perubahan atas nama "${item.menjadi.nama}" ke formulir.`);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl shadow-2xl flex items-center gap-3 border text-xs font-semibold animate-in slide-in-from-bottom-5 duration-200 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-900/90 text-white border-emerald-700'
              : toastMessage.type === 'error'
              ? 'bg-rose-900/90 text-white border-rose-700'
              : 'bg-indigo-900/90 text-white border-indigo-700'
          }`}
        >
          {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-300" />}
          {toastMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-300" />}
          {toastMessage.type === 'info' && <Info className="w-4 h-4 text-indigo-300" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Banner & Quick Controls */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/20 shadow-xl text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <RotateCcw className="w-4 h-4" />
            </span>
            <h2 className="text-base sm:text-lg font-black tracking-tight">
              Formulir Perubahan Data User SAKTI
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
              SEMULA → MENJADI
            </span>
          </div>
          <p className="text-xs text-indigo-200/80">
            Pilih pengguna terdaftar dari basis data SAKTI, tentukan perubahan peran atau data kepegawaian, lalu hasilkan file Excel & PDF resmi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Pick User Button */}
          <button
            type="button"
            onClick={() => setIsUserSelectorOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer transition-colors"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Pilih User SAKTI</span>
            {existingUsers.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-indigo-800 text-[10px]">
                {existingUsers.length}
              </span>
            )}
          </button>

          {/* History Button */}
          <button
            type="button"
            onClick={() => setIsHistoryOpen(true)}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 cursor-pointer transition-colors"
          >
            <History className="w-3.5 h-3.5" />
            <span>Riwayat Perubahan ({historyList.length})</span>
          </button>
        </div>
      </div>

      {/* Selected User Header Card */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">Pengguna Terpilih:</span>
              <span className="font-bold text-sm text-slate-900 dark:text-white">
                {selectedUser ? selectedUser.namaLengkap : '(Belum ada pengguna dipilih)'}
              </span>
              {selectedUser?.peranJabatan && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {selectedUser.peranJabatan}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 text-xs text-slate-500 font-mono mt-0.5">
              <span>Satker: {kodeSatker} - {namaSatker}</span>
              {selectedUser?.nip && <span>• NIP: {selectedUser.nip}</span>}
              {selectedUser?.nik && <span>• NIK: {selectedUser.nik}</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsUserSelectorOpen(true)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          >
            Ganti Pengguna
          </button>
          {selectedUser && (
            <button
              type="button"
              onClick={handleResetMenjadiToSemula}
              className="px-3 py-1.5 rounded-lg border border-dashed border-amber-300 dark:border-amber-700/80 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-xs font-semibold cursor-pointer transition-colors"
              title="Reset data MENJADI agar kembali sama persis dengan SEMULA"
            >
              Reset ke SEMULA
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: SEMULA vs MENJADI */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CARD 1: DATA SEMULA (Read-Only) */}
        <div className="p-5 rounded-2xl bg-amber-50/40 dark:bg-slate-900 border-2 border-amber-200/80 dark:border-amber-900/50 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-amber-200/60 dark:border-amber-900/40 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
              <h3 className="text-sm font-black text-amber-900 dark:text-amber-300 tracking-wide uppercase">
                1. DATA SEMULA (SEBELUM PERUBAHAN)
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              <span>Read-Only</span>
            </span>
          </div>

          <div className="space-y-3.5 text-xs">
            {/* Kode Satker */}
            <div>
              <label className="block font-medium text-slate-500 dark:text-slate-400 mb-1">
                Kode Satker
              </label>
              <input
                type="text"
                value={semula.kodeSatker}
                disabled
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 font-mono font-semibold"
              />
            </div>

            {/* Peran SAKTI Semula */}
            <div>
              <label className="block font-medium text-slate-500 dark:text-slate-400 mb-1">
                Peran SAKTI Saat Ini (SEMULA)
              </label>
              <div className="min-h-[44px] p-2 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl flex flex-wrap items-center gap-1.5">
                {semula.roles.length === 0 ? (
                  <span className="text-slate-400 italic">Belum ada role terdaftar</span>
                ) : (
                  semula.roles.map(code => (
                    <span
                      key={code}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800"
                    >
                      {MASTER_ROLE_MAP.get(code)?.roleName || code}
                      <span className="ml-1 text-[10px] font-mono text-amber-700 dark:text-amber-400">({code})</span>
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Nama Lengkap */}
            <div>
              <label className="block font-medium text-slate-500 dark:text-slate-400 mb-1">
                Nama Pegawai
              </label>
              <input
                type="text"
                value={semula.nama}
                disabled
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-semibold"
              />
            </div>

            {/* NIP & NIK */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-500 dark:text-slate-400 mb-1">
                  NIP / NRP
                </label>
                <input
                  type="text"
                  value={semula.nip}
                  disabled
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-mono"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-500 dark:text-slate-400 mb-1">
                  NIK (16 Digit)
                </label>
                <input
                  type="text"
                  value={semula.nik}
                  disabled
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-mono"
                />
              </div>
            </div>

            {/* NPWP & No HP */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-500 dark:text-slate-400 mb-1">
                  NPWP
                </label>
                <input
                  type="text"
                  value={semula.npwp}
                  disabled
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-mono"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Nomor HP / WA
                </label>
                <input
                  type="text"
                  value={semula.noHp}
                  disabled
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-mono"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block font-medium text-slate-500 dark:text-slate-400 mb-1">
                E-mail Pegawai
              </label>
              <input
                type="text"
                value={semula.email}
                disabled
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
              />
            </div>

            {/* Nomor & Tanggal SK */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Nomor SK
                </label>
                <input
                  type="text"
                  value={semula.nomorSk}
                  disabled
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Tanggal SK
                </label>
                <input
                  type="text"
                  value={semula.tanggalSk}
                  disabled
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-mono"
                />
              </div>
            </div>

            {/* Keterangan */}
            <div>
              <label className="block font-medium text-slate-500 dark:text-slate-400 mb-1">
                Keterangan Semula
              </label>
              <input
                type="text"
                value={semula.keterangan}
                disabled
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>
        </div>

        {/* CARD 2: DATA MENJADI (Editable) */}
        <div className="p-5 rounded-2xl bg-emerald-50/30 dark:bg-slate-900 border-2 border-emerald-300/80 dark:border-emerald-800/60 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-emerald-200/60 dark:border-emerald-900/40 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <h3 className="text-sm font-black text-emerald-900 dark:text-emerald-300 tracking-wide uppercase">
                2. DATA MENJADI (SETELAH PERUBAHAN)
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 flex items-center gap-1">
              <Edit3 className="w-3 h-3" />
              <span>Dapat Diubah</span>
            </span>
          </div>

          <div className="space-y-3.5 text-xs">
            {/* Kode Satker */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Kode Satker
              </label>
              <input
                type="text"
                value={menjadi.kodeSatker}
                disabled
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 font-mono font-semibold"
              />
            </div>

            {/* Peran SAKTI MENJADI (Role Selector) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold text-slate-900 dark:text-white">
                  Peran SAKTI yang Ditetapkan (MENJADI) <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                  {menjadi.roles.length} Peran Terpilih
                </span>
              </div>
              <RoleMultiSelector
                selectedRoles={menjadi.roles}
                onChange={(roles) => setMenjadi(prev => ({ ...prev, roles }))}
                isBLU={isBLU}
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Pilih peran resmi dari master ROLE_REFERENCE. Anda dapat menambah, menghapus, atau mengganti kombinasi role.
              </p>
            </div>

            {/* Nama Lengkap */}
            <div>
              <label className="block font-semibold text-slate-900 dark:text-white mb-1">
                Nama Pegawai (dengan gelar bila ada) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={menjadi.nama}
                onChange={(e) => setMenjadi(prev => ({ ...prev, nama: e.target.value }))}
                placeholder="Nama lengkap pegawai"
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-semibold transition-all"
              />
            </div>

            {/* NIP & NIK */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-900 dark:text-white mb-1">
                  NIP / NRP (Format Teks Murni)
                </label>
                <input
                  type="text"
                  value={menjadi.nip}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, '').slice(0, 18);
                    setMenjadi(prev => ({ ...prev, nip: clean }));
                  }}
                  placeholder="18 digit angka NIP"
                  maxLength={18}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono transition-all"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-900 dark:text-white mb-1">
                  NIK (16 Digit)
                </label>
                <input
                  type="text"
                  value={menjadi.nik}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, '').slice(0, 16);
                    setMenjadi(prev => ({ ...prev, nik: clean }));
                  }}
                  placeholder="16 digit angka NIK"
                  maxLength={16}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono transition-all"
                />
              </div>
            </div>

            {/* NPWP & No HP */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-900 dark:text-white mb-1">
                  NPWP (15 / 16 digit)
                </label>
                <input
                  type="text"
                  value={menjadi.npwp}
                  onChange={(e) => setMenjadi(prev => ({ ...prev, npwp: e.target.value }))}
                  placeholder="Nomor NPWP Pegawai"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono transition-all"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-900 dark:text-white mb-1">
                  Nomor HP / WhatsApp Aktif
                </label>
                <input
                  type="text"
                  value={menjadi.noHp}
                  onChange={(e) => setMenjadi(prev => ({ ...prev, noHp: e.target.value }))}
                  placeholder="0812xxxxxxxx"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block font-semibold text-slate-900 dark:text-white mb-1">
                E-mail Pegawai (Kedinasan / Utama)
              </label>
              <input
                type="email"
                value={menjadi.email}
                onChange={(e) => setMenjadi(prev => ({ ...prev, email: e.target.value }))}
                placeholder="nama.pegawai@kemenkeu.go.id"
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>

            {/* Nomor & Tanggal SK */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-900 dark:text-white mb-1">
                  Nomor SK Perubahan
                </label>
                <input
                  type="text"
                  value={menjadi.nomorSk}
                  onChange={(e) => setMenjadi(prev => ({ ...prev, nomorSk: e.target.value }))}
                  placeholder="e.g. KEP-123/WPB.14/KP.01/2026"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-900 dark:text-white mb-1">
                  Tanggal SK Perubahan
                </label>
                <input
                  type="date"
                  value={menjadi.tanggalSk}
                  onChange={(e) => setMenjadi(prev => ({ ...prev, tanggalSk: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono transition-all"
                />
              </div>
            </div>

            {/* Keterangan */}
            <div>
              <label className="block font-semibold text-slate-900 dark:text-white mb-1">
                Keterangan / Alasan Perubahan <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                value={menjadi.keterangan}
                onChange={(e) => setMenjadi(prev => ({ ...prev, keterangan: e.target.value }))}
                placeholder="Contoh: Penambahan role Operator Komitmen, Perubahan nomor SK, Pergantian pejabat"
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: RINGKASAN PERUBAHAN TERDETEKSI (AUTO-DIFF) */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Ringkasan Perubahan Terdeteksi
            </h3>
          </div>

          {diff.hasChanges ? (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              Perubahan Siap Diajukan
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              Belum Ada Perubahan Data
            </span>
          )}
        </div>

        {!diff.hasChanges ? (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 text-center">
            Data SEMULA dan MENJADI saat ini masih identik. Silakan ubah peran atau data pengguna pada kolom "DATA MENJADI" di sebelah kanan untuk mendeteksi perubahan.
          </div>
        ) : (
          <div className="space-y-2.5 text-xs">
            {/* Roles Added */}
            {diff.rolesAdded.length > 0 && (
              <div className="p-2.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 flex items-start gap-2">
                <span className="font-bold text-emerald-800 dark:text-emerald-300 whitespace-nowrap">
                  + Role Ditambahkan:
                </span>
                <div className="flex flex-wrap gap-1">
                  {diff.rolesAdded.map(code => (
                    <span
                      key={code}
                      className="px-2 py-0.5 rounded-md font-semibold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 text-[11px]"
                    >
                      {MASTER_ROLE_MAP.get(code)?.roleName || code} ({code})
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Roles Removed */}
            {diff.rolesRemoved.length > 0 && (
              <div className="p-2.5 rounded-xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2">
                <span className="font-bold text-rose-800 dark:text-rose-300 whitespace-nowrap">
                  - Role Dihapus:
                </span>
                <div className="flex flex-wrap gap-1">
                  {diff.rolesRemoved.map(code => (
                    <span
                      key={code}
                      className="px-2 py-0.5 rounded-md font-semibold bg-rose-100 dark:bg-rose-900/60 text-rose-900 dark:text-rose-200 border border-rose-300 dark:border-rose-700 line-through text-[11px]"
                    >
                      {MASTER_ROLE_MAP.get(code)?.roleName || code} ({code})
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Field changes */}
            {diff.fieldChanges.length > 0 && (
              <div className="p-2.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/60 space-y-1">
                <span className="font-bold text-indigo-900 dark:text-indigo-300 block mb-1">
                  Perubahan Data Kepegawaian & Dokumen:
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                  {diff.fieldChanges.map(fc => (
                    <div key={fc.field} className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <span className="font-semibold text-indigo-700 dark:text-indigo-400">{fc.label}:</span>
                      <span className="text-slate-400 font-mono">"{fc.from || '(kosong)'}"</span>
                      <ArrowRight className="w-3 h-3 text-indigo-500" />
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">"{fc.to || '(kosong)'}"</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Toolbar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            100% Master Template: Contoh Baru Form-Perubahan-User-SAKTI-Web.xlsx
          </span>
          <a
            href="/templates/Contoh Baru Form-Perubahan-User-SAKTI-Web.xlsx"
            download="Contoh Baru Form-Perubahan-User-SAKTI-Web.xlsx"
            className="text-[11px] font-medium text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 underline underline-offset-2 flex items-center gap-1"
            title="Download file master template asli untuk referensi"
          >
            Unduh Master Blank
          </a>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Preview Button */}
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            disabled={!selectedUser}
            className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Eye className="w-4 h-4 text-indigo-500" />
            <span>Preview Dokumen</span>
          </button>

          {/* Export Excel Button */}
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={!selectedUser || !diff.hasChanges}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            title="Download formulir perubahan format Excel resmi (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Excel (.xlsx)</span>
          </button>

          {/* Export PDF Button */}
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={!selectedUser || !diff.hasChanges}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            title="Download formulir perubahan format PDF siap cetak & tanda tangan KPA"
          >
            <FileText className="w-4 h-4" />
            <span>Export PDF (.pdf)</span>
          </button>

          {/* Save / Submit Button */}
          <button
            type="button"
            onClick={handleSaveSubmission}
            disabled={!selectedUser || !diff.hasChanges}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Send className="w-4 h-4" />
            <span>Ajukan Perubahan</span>
          </button>
        </div>
      </div>

      {/* MODALS */}
      <UserSelectorModal
        isOpen={isUserSelectorOpen}
        onClose={() => setIsUserSelectorOpen(false)}
        users={existingUsers}
        onSelectUser={handleSelectUser}
        kodeSatker={kodeSatker}
        namaSatker={namaSatker}
      />

      <PreviewPerubahanModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        submission={currentSubmission}
        onExportExcel={handleExportExcel}
        onExportPdf={handleExportPdf}
        kpaName={kpaName || satker.pejabatOperator?.kpa?.nama || 'Nama Kuasa Pengguna Anggaran'}
        kpaNip={kpaNip || satker.pejabatOperator?.kpa?.nip || '198001012005011001'}
      />

      <RiwayatPerubahanUserModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        historyList={historyList}
        onDeleteHistory={(id) => {
          setHistoryList(prev => prev.filter(h => h.id !== id));
          showToast('info', 'Arsip riwayat berhasil dihapus.');
        }}
        onPreviewItem={(item) => {
          setSemula(item.semula);
          setMenjadi(item.menjadi);
          setIsHistoryOpen(false);
          setIsPreviewOpen(true);
        }}
        onLoadIntoDraft={handleLoadFromHistory}
        satker={{
          kodeSatker,
          namaSatker,
          levelSatker,
          namaKpa: kpaName || satker.pejabatOperator?.kpa?.nama,
          nipKpa: kpaNip || satker.pejabatOperator?.kpa?.nip
        }}
      />
    </div>
  );
};
