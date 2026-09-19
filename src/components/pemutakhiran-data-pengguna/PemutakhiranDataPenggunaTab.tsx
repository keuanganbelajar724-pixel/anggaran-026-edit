import React, { useState, useEffect, useMemo } from 'react';
import {
  MasterSatker,
  UserSaktiRecord,
  PemutakhiranDataDraft,
  PemutakhiranDataUserItem,
  PemutakhiranDataHistoryItem,
  PemutakhiranDataAuditLog
} from '../../types';
import { MASTER_ROLE_MAP, sortRolesByMasterOrder } from '../../data/masterRoleSakti';
import { RoleMultiSelector } from '../perubahan-user-sakti/RoleMultiSelector';
import { PilihUserDataModal } from './PilihUserDataModal';
import { PreviewPemutakhiranDataModal } from './PreviewPemutakhiranDataModal';
import { RiwayatPemutakhiranDataModal } from './RiwayatPemutakhiranDataModal';
import {
  exportPemutakhiranDataToExcel,
  exportPemutakhiranDataToPDF,
  validatePemutakhiranDataDraft,
  isValidSaktiEmail
} from '../../utils/pemutakhiranDataExport';
import { formatToDdMmYyyy } from '../../utils/saktiMasterTemplateService';
import {
  Users,
  Search,
  Plus,
  Trash2,
  FileSpreadsheet,
  FileText,
  Eye,
  History,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ShieldCheck,
  Download,
  Save,
  Send,
  HelpCircle,
  RotateCcw,
  Sparkles,
  Lock,
  ArrowRight,
  UserPlus,
  Mail,
  Phone,
  Calendar,
  Building2,
  BadgeCheck,
  Info
} from 'lucide-react';

interface PemutakhiranDataPenggunaTabProps {
  satker: MasterSatker;
  existingUsers: UserSaktiRecord[];
  levelSatker?: string;
  kpaName?: string;
  kpaNip?: string;
  userName?: string;
  onSaveUserToMaster?: (updatedUser: UserSaktiRecord) => void;
}

export const PemutakhiranDataPenggunaTab: React.FC<PemutakhiranDataPenggunaTabProps> = ({
  satker,
  existingUsers,
  levelSatker = 'Satker Daerah (KD)',
  kpaName,
  kpaNip,
  userName = 'Operator Satker',
  onSaveUserToMaster
}) => {
  const kodeSatker = satker.kodeSatker;
  const namaSatker = satker.namaSatker;
  const isBLU = (levelSatker || '').toLowerCase().includes('blu') || (namaSatker || '').toLowerCase().includes('blu');

  // Strict isolation storage keys per satker
  const DRAFT_STORAGE_KEY = `sakti_pemutakhiran_data_draft_${kodeSatker}`;
  const HISTORY_STORAGE_KEY = `sakti_pemutakhiran_data_history_${kodeSatker}`;
  const AUDIT_STORAGE_KEY = `sakti_pemutakhiran_data_audit_${kodeSatker}`;

  // Modals state
  const [isPilihUserOpen, setIsPilihUserOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<PemutakhiranDataAuditLog[]>(() => {
    try {
      const saved = localStorage.getItem(AUDIT_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const appendAudit = (action: string, detail: string) => {
    const newLog: PemutakhiranDataAuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      action,
      detail,
      user: userName
    };
    setAuditLogs(prev => {
      const updated = [newLog, ...prev].slice(0, 100);
      try {
        localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // History State
  const [historyList, setHistoryList] = useState<PemutakhiranDataHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(historyList));
    } catch (e) {}
  }, [historyList, HISTORY_STORAGE_KEY]);

  // Draft State
  const today = new Date().toISOString().split('T')[0];
  const [draft, setDraft] = useState<PemutakhiranDataDraft>(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          kodeSatker,
          namaSatker,
          levelSatker
        };
      }
    } catch (e) {}

    return {
      id: `draft-pmt-data-${kodeSatker}-${Date.now()}`,
      kodeSatker,
      namaSatker,
      levelSatker,
      users: [],
      kpa: {
        nama: kpaName || '',
        nip: kpaNip || '',
        jabatan: 'Kuasa Pengguna Anggaran'
      },
      tempatPenetapan: 'Jakarta',
      tanggalPenetapan: today,
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  });

  // Auto-sync Satker details to draft if satker prop changes
  useEffect(() => {
    setDraft(prev => ({
      ...prev,
      kodeSatker,
      namaSatker,
      levelSatker
    }));
  }, [kodeSatker, namaSatker, levelSatker]);

  // Save draft to localStorage
  const saveDraftLocally = (updatedDraft: PemutakhiranDataDraft, showToastAlert = true) => {
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(updatedDraft));
      if (showToastAlert) {
        showToast('success', 'Draf Pemutakhiran Data Pengguna SAKTI berhasil disimpan');
      }
    } catch (e) {
      console.error(e);
      if (showToastAlert) {
        showToast('error', 'Gagal menyimpan draf ke penyimpanan lokal');
      }
    }
  };

  const showToast = (type: 'success' | 'error' | 'info', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Convert existing user to PemutakhiranDataUserItem
  const mapRecordToPemutakhiranUser = (user: UserSaktiRecord): PemutakhiranDataUserItem => {
    const roles = user.roles && user.roles.length > 0 ? user.roles : ['SATKER_OPERATOR_ANGGARAN'];
    const cleanNik = (user.nik || '').replace(/\D/g, '');
    const cleanNip = (user.nip || '').replace(/\D/g, '');
    const cleanNpwp = (user.npwp || '').replace(/\D/g, '');
    const cleanHp = (user.noHp || '').replace(/[^\d+]/g, '');
    const tglSkFormatted = formatToDdMmYyyy(user.tanggalSk) || '28-02-2022';

    return {
      id: `u-pmt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      userSaktiId: user.id,
      kodeSatker,
      peranList: [...roles],
      nama: user.namaLengkap || '',
      nip: cleanNip,
      npwp: cleanNpwp,
      nik: cleanNik,
      email: user.email || '',
      noHp: cleanHp.startsWith('08') ? cleanHp : cleanHp ? `08${cleanHp.replace(/^0+/, '')}` : '',
      nomorSk: user.nomorSk || '51 / SK / Tahun 2022',
      tanggalSk: tglSkFormatted,
      dataAwal: {
        peranList: [...roles],
        nama: user.namaLengkap || '',
        nip: cleanNip,
        npwp: cleanNpwp,
        nik: cleanNik,
        email: user.email || '',
        noHp: cleanHp,
        nomorSk: user.nomorSk || '',
        tanggalSk: tglSkFormatted
      }
    };
  };

  // Handle adding users from Modal selection
  const handleAddUsersFromModal = (selectedRecords: UserSaktiRecord[]) => {
    const newItems = selectedRecords.map(mapRecordToPemutakhiranUser);
    setDraft(prev => {
      const updated: PemutakhiranDataDraft = {
        ...prev,
        users: [...prev.users, ...newItems],
        updatedAt: new Date().toISOString()
      };
      saveDraftLocally(updated, false);
      return updated;
    });

    appendAudit(
      'Pilih Pengguna',
      `Menambahkan ${selectedRecords.length} pengguna dari master Satker ke formulir pemutakhiran data (${selectedRecords.map(u => u.namaLengkap).join(', ')})`
    );
    showToast('success', `${selectedRecords.length} pengguna berhasil dimuat ke formulir`);
  };

  // Handle manual addition of empty user card
  const handleAddBlankUser = () => {
    const blankUser: PemutakhiranDataUserItem = {
      id: `u-pmt-blank-${Date.now()}`,
      kodeSatker,
      peranList: ['SATKER_OPERATOR_ANGGARAN'],
      nama: '',
      nip: '',
      npwp: '',
      nik: '',
      email: '',
      noHp: '08',
      nomorSk: '51 / SK / Tahun 2022',
      tanggalSk: '28-02-2022'
    };

    setDraft(prev => {
      const updated: PemutakhiranDataDraft = {
        ...prev,
        users: [...prev.users, blankUser],
        updatedAt: new Date().toISOString()
      };
      saveDraftLocally(updated, false);
      return updated;
    });

    appendAudit('Tambah Pengguna Manual', 'Menambahkan satu baris pengguna kosong ke formulir');
    showToast('info', 'Satu baris pengguna baru ditambahkan ke formulir');
  };

  // Handle removal of user from draft
  const handleRemoveUser = (userId: string, userName: string) => {
    setDraft(prev => {
      const updated: PemutakhiranDataDraft = {
        ...prev,
        users: prev.users.filter(u => u.id !== userId),
        updatedAt: new Date().toISOString()
      };
      saveDraftLocally(updated, false);
      return updated;
    });
    appendAudit('Hapus Pengguna', `Menghapus ${userName || 'Pengguna'} dari formulir`);
    showToast('info', `${userName || 'Pengguna'} dihapus dari formulir`);
  };

  // Handle single field update
  const handleUpdateUserField = (userId: string, field: keyof PemutakhiranDataUserItem, value: any) => {
    setDraft(prev => {
      const updatedUsers = prev.users.map(u => {
        if (u.id === userId) {
          return { ...u, [field]: value };
        }
        return u;
      });

      const updated: PemutakhiranDataDraft = {
        ...prev,
        users: updatedUsers,
        updatedAt: new Date().toISOString()
      };
      saveDraftLocally(updated, false);
      return updated;
    });
  };

  // Reset user data back to dataAwal
  const handleResetUserData = (userId: string) => {
    setDraft(prev => {
      const updatedUsers = prev.users.map(u => {
        if (u.id === userId && u.dataAwal) {
          return {
            ...u,
            peranList: [...u.dataAwal.peranList],
            nama: u.dataAwal.nama,
            nip: u.dataAwal.nip,
            npwp: u.dataAwal.npwp,
            nik: u.dataAwal.nik,
            email: u.dataAwal.email,
            noHp: u.dataAwal.noHp,
            nomorSk: u.dataAwal.nomorSk,
            tanggalSk: u.dataAwal.tanggalSk
          };
        }
        return u;
      });

      const updated: PemutakhiranDataDraft = {
        ...prev,
        users: updatedUsers,
        updatedAt: new Date().toISOString()
      };
      saveDraftLocally(updated, false);
      return updated;
    });
    showToast('info', 'Data pengguna dikembalikan ke data awal database');
  };

  // Update KPA fields
  const handleUpdateKpa = (field: 'nama' | 'nip' | 'jabatan', value: string) => {
    setDraft(prev => {
      const updated: PemutakhiranDataDraft = {
        ...prev,
        kpa: {
          ...prev.kpa,
          [field]: value
        },
        updatedAt: new Date().toISOString()
      };
      saveDraftLocally(updated, false);
      return updated;
    });
  };

  // Real-time validation
  const validationSummary = useMemo(() => {
    return validatePemutakhiranDataDraft(draft);
  }, [draft]);

  // Submission action
  const handleAjukan = () => {
    if (!validationSummary.isValid) {
      showToast('error', `Terdapat ${validationSummary.errors.length} masalah validasi yang harus diperbaiki.`);
      return;
    }

    const now = new Date().toISOString();
    const submittedDraft: PemutakhiranDataDraft = {
      ...draft,
      status: 'DIAJUKAN',
      updatedAt: now
    };

    const newHistoryItem: PemutakhiranDataHistoryItem = {
      id: `hist-pmt-data-${Date.now()}`,
      kodeSatker: draft.kodeSatker,
      namaSatker: draft.namaSatker,
      levelSatker: draft.levelSatker,
      draftData: submittedDraft,
      tanggalPengajuan: now,
      totalUser: draft.users.length,
      kpa: {
        nama: draft.kpa.nama,
        nip: draft.kpa.nip
      },
      status: 'DIAJUKAN',
      createdBy: userName,
      createdAt: now,
      updatedAt: now
    };

    setHistoryList(prev => [newHistoryItem, ...prev]);
    setDraft(submittedDraft);
    saveDraftLocally(submittedDraft, false);

    // Optionally update master records
    if (onSaveUserToMaster) {
      draft.users.forEach(u => {
        if (u.userSaktiId) {
          const masterMatch = existingUsers.find(ex => ex.id === u.userSaktiId);
          if (masterMatch) {
            onSaveUserToMaster({
              ...masterMatch,
              namaLengkap: u.nama,
              nip: u.nip,
              npwp: u.npwp,
              nik: u.nik,
              email: u.email,
              noHp: u.noHp,
              nomorSk: u.nomorSk,
              tanggalSk: u.tanggalSk,
              roles: u.peranList,
              updatedAt: now
            });
          }
        }
      });
    }

    appendAudit(
      'Ajukan Pemutakhiran Data',
      `Mengajukan Formulir Pemutakhiran Data Pengguna SAKTI untuk ${draft.users.length} orang pengguna`
    );
    showToast('success', 'Formulir Pemutakhiran Data Pengguna SAKTI berhasil diajukan!');
  };

  // Excel Export via Master Template
  const handleExportExcel = async () => {
    if (!validationSummary.isValid) {
      showToast('error', 'Perbaiki isian yang belum valid sebelum melakukan ekspor Excel');
      return;
    }

    setIsExportingExcel(true);
    try {
      const report = await exportPemutakhiranDataToExcel(draft);
      const now = new Date().toISOString();
      const updatedDraft: PemutakhiranDataDraft = {
        ...draft,
        exportedExcelAt: now,
        updatedAt: now
      };
      setDraft(updatedDraft);
      saveDraftLocally(updatedDraft, false);

      appendAudit(
        'Export Excel Master',
        `Berhasil mengekspor Formulir Pemutakhiran Data Pengguna SAKTI (${draft.users.length} pengguna) sesuai template asli Kemenkeu`
      );
      showToast('success', 'File Excel sesuai Master Template resmi berhasil diunduh!');
    } catch (err: any) {
      console.error(err);
      showToast('error', err.message || 'Gagal mengekspor file Excel Master');
    } finally {
      setIsExportingExcel(false);
    }
  };

  // PDF Export
  const handleExportPDF = () => {
    if (!validationSummary.isValid) {
      showToast('error', 'Perbaiki isian yang belum valid sebelum mengunduh PDF');
      return;
    }

    try {
      exportPemutakhiranDataToPDF(draft);
      const now = new Date().toISOString();
      const updatedDraft: PemutakhiranDataDraft = {
        ...draft,
        exportedPdfAt: now,
        updatedAt: now
      };
      setDraft(updatedDraft);
      saveDraftLocally(updatedDraft, false);

      appendAudit(
        'Export PDF',
        `Mencetak dokumen resmi Formulir Pemutakhiran Data Pengguna SAKTI siap tanda tangan KPA (${draft.users.length} pengguna)`
      );
      showToast('success', 'Dokumen PDF formulir siap cetak & tanda tangan KPA berhasil diunduh!');
    } catch (err: any) {
      console.error(err);
      showToast('error', 'Gagal membuat dokumen PDF');
    }
  };

  // Download Blank Master Template
  const handleDownloadBlankMaster = () => {
    const link = document.createElement('a');
    link.href = '/templates/Form Pemutakhiran Data Pengguna Aplikasi SAKTI.xlsx';
    link.download = 'Form Pemutakhiran Data Pengguna Aplikasi SAKTI.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    appendAudit('Unduh Master Asli', 'Mengunduh file template master asli "Form Pemutakhiran Data Pengguna Aplikasi SAKTI.xlsx"');
    showToast('success', 'Mengunduh Master Template Asli SAKTI...');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-2xl border flex items-center gap-3 text-xs font-semibold backdrop-blur-md animate-in slide-in-from-top-2 duration-200 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50'
              : toastMessage.type === 'error'
              ? 'bg-rose-950/90 text-rose-300 border-rose-500/50'
              : 'bg-teal-950/90 text-teal-300 border-teal-500/50'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : toastMessage.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          ) : (
            <Sparkles className="w-4 h-4 text-teal-400" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Banner / Satker Identity Header */}
      <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="p-1.5 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400">
                <Users className="w-4 h-4" />
              </span>
              <h2 className="text-lg font-bold text-white tracking-wide">
                Pemutakhiran Data Pengguna SAKTI
              </h2>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-teal-950 border border-teal-700/60 text-teal-300 font-mono">
                Master Template 10 Kolom
              </span>
              {isBLU && (
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-indigo-950 border border-indigo-700/60 text-indigo-300 font-semibold">
                  Satker BLU
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 max-w-3xl">
              Memperbarui data administrasi pengguna SAKTI (Nama, NIP, NPWP, NIK, E-mail, No. HP, Nomor & Tanggal SK, Peran SAKTI).
              Keluaran Excel dijamin 100% menggunakan master template resmi <span className="font-semibold text-slate-200">"Form Pemutakhiran Data Pengguna Aplikasi SAKTI.xlsx"</span>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadBlankMaster}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-750 border border-slate-700 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              Master Template Asli
            </button>
            <button
              type="button"
              onClick={() => setIsHistoryOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-750 border border-slate-700 transition-colors cursor-pointer"
            >
              <History className="w-3.5 h-3.5 text-slate-400" />
              Riwayat & Audit ({historyList.length})
            </button>
          </div>
        </div>

        {/* Satker Metadata Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800/80 text-xs">
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Kode Satker (B3)</span>
            <span className="font-mono font-bold text-teal-400">{draft.kodeSatker}</span>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Nama Satker (B4)</span>
            <span className="font-semibold text-white truncate block" title={draft.namaSatker}>{draft.namaSatker}</span>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Level Satker (B6)</span>
            <span className="text-slate-300 truncate block">{draft.levelSatker || 'Satker Daerah (KD)'}</span>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Status Formulir</span>
            <span className="font-bold text-amber-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              {draft.status}
            </span>
          </div>
        </div>
      </div>

      {/* Main Action Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPilihUserOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white shadow-md shadow-teal-950 transition-colors cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
            Cari User SAKTI
          </button>
          <button
            type="button"
            onClick={handleAddBlankUser}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Tambah Pengguna Manual
          </button>
          <button
            type="button"
            onClick={() => saveDraftLocally(draft, true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-750 border border-slate-700 transition-colors cursor-pointer"
          >
            <Save className="w-3.5 h-3.5 text-slate-400" />
            Simpan Draf
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-white border border-slate-700 transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-teal-400" />
            Preview Formulir
          </button>
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={isExportingExcel || draft.users.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-md shadow-emerald-950 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            {isExportingExcel ? 'Memvalidasi Master...' : 'Export Excel Master'}
          </button>
          <button
            type="button"
            onClick={handleExportPDF}
            disabled={draft.users.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-md shadow-rose-950 transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            Export PDF
          </button>
          <button
            type="button"
            onClick={handleAjukan}
            disabled={draft.users.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-teal-500 hover:bg-teal-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 shadow-md shadow-teal-950 transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            Ajukan Pemutakhiran
          </button>
        </div>
      </div>

      {/* Validation Banner if errors exist */}
      {!validationSummary.isValid && draft.users.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-950/50 border border-amber-800/60 text-amber-300 text-xs space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Terdapat {validationSummary.errors.length} data yang belum memenuhi kriteria template master:</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-300/90 pl-1">
            {validationSummary.errors.slice(0, 4).map((err, i) => (
              <li key={i}>{err}</li>
            ))}
            {validationSummary.errors.length > 4 && (
              <li className="font-semibold">...dan {validationSummary.errors.length - 4} catatan validasi lainnya.</li>
            )}
          </ul>
        </div>
      )}

      {/* User Items List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white">
              Daftar Pengguna yang Dimutakhirkan ({draft.users.length})
            </h3>
            <span className="text-xs text-slate-400">
              • 1 pengguna = 1 baris pada template master (Baris 8+)
            </span>
          </div>
          {draft.users.length > 0 && (
            <span className="text-xs text-teal-400 font-medium">
              Kolom A-J sesuai master template
            </span>
          )}
        </div>

        {draft.users.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-12 text-center text-slate-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30 text-teal-400" />
            <h4 className="text-base font-semibold text-white">Belum Ada Pengguna Dipilih</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
              Gunakan tombol "Cari User SAKTI" untuk memuat pengguna yang sudah terdaftar pada Satker ini, atau masukkan data secara manual.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsPilihUserOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white shadow-md transition-colors cursor-pointer"
              >
                <Search className="w-4 h-4" />
                Cari Pengguna Satker
              </button>
              <button
                type="button"
                onClick={handleAddBlankUser}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Input Manual
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {draft.users.map((user, idx) => {
              const num = idx + 1;
              const cleanNik = (user.nik || '').replace(/\D/g, '');
              const cleanNip = (user.nip || '').replace(/\D/g, '');
              const isNikValid = cleanNik.length === 16;
              const isEmailOfficial = isValidSaktiEmail(user.email);
              const dAwal = user.dataAwal;

              // Check differences
              const changedFields: string[] = [];
              if (dAwal) {
                if (dAwal.nama !== user.nama) changedFields.push('Nama');
                if (dAwal.nip !== user.nip) changedFields.push('NIP');
                if (dAwal.npwp !== user.npwp) changedFields.push('NPWP');
                if (dAwal.nik !== user.nik) changedFields.push('NIK');
                if (dAwal.email !== user.email) changedFields.push('E-mail');
                if (dAwal.noHp !== user.noHp) changedFields.push('No. HP');
                if (dAwal.nomorSk !== user.nomorSk) changedFields.push('Nomor SK');
                if (dAwal.tanggalSk !== user.tanggalSk) changedFields.push('Tanggal SK');
                const sortedAwal = [...(dAwal.peranList || [])].sort().join(',');
                const sortedNow = [...(user.peranList || [])].sort().join(',');
                if (sortedAwal !== sortedNow) changedFields.push('Peran/Role SAKTI');
              }

              return (
                <div
                  key={user.id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 shadow-lg space-y-5 transition-all"
                >
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 font-bold flex items-center justify-center text-sm font-mono">
                        #{num}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">
                            {user.nama || 'Pengguna Baru Tanpa Nama'}
                          </h4>
                          {dAwal && changedFields.length > 0 ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950 border border-amber-700 text-amber-300">
                              {changedFields.length} Data Dimutakhirkan: {changedFields.join(', ')}
                            </span>
                          ) : dAwal ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                              Belum ada perubahan dari database
                            </span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-950 border border-teal-800 text-teal-300">
                              Pengguna Manual
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Kode Satker: <span className="font-mono text-teal-400">{draft.kodeSatker}</span> • Posisi Excel: Baris {8 + idx}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {dAwal && changedFields.length > 0 && (
                        <button
                          type="button"
                          onClick={() => handleResetUserData(user.id)}
                          className="flex items-center gap-1 px-2.5 py-1 text-[11px] text-slate-400 hover:text-slate-200 bg-slate-800/80 hover:bg-slate-800 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                          title="Kembalikan semua nilai ke data awal"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Reset ke Data Awal
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveUser(user.id, user.nama)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                        title="Hapus dari formulir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Form Grid: 10 Columns Mappings */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                    {/* Col C: Nama */}
                    <div className="space-y-1.5">
                      <label className="text-slate-300 font-semibold block">
                        Nama Lengkap (Kolom C) <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={user.nama}
                        onChange={e => handleUpdateUserField(user.id, 'nama', e.target.value)}
                        placeholder="Nama lengkap..."
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-medium focus:outline-hidden focus:border-teal-500"
                      />
                      {dAwal && dAwal.nama !== user.nama && (
                        <span className="text-[10px] text-amber-400 block truncate">
                          Sebelumnya: {dAwal.nama}
                        </span>
                      )}
                    </div>

                    {/* Col D: NIP (Text) */}
                    <div className="space-y-1.5">
                      <label className="text-slate-300 font-semibold block">
                        NIP (Kolom D) <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={user.nip}
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '');
                          handleUpdateUserField(user.id, 'nip', val);
                        }}
                        placeholder="Angka tanpa spasi/simbol..."
                        className="w-full font-mono bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-hidden focus:border-teal-500"
                      />
                      <span className="text-[10px] text-slate-500 block">
                        Disimpan sebagai Text tanpa simbol
                      </span>
                    </div>

                    {/* Col E: NPWP (Text) */}
                    <div className="space-y-1.5">
                      <label className="text-slate-300 font-semibold block">
                        NPWP (Kolom E)
                      </label>
                      <input
                        type="text"
                        value={user.npwp}
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '');
                          handleUpdateUserField(user.id, 'npwp', val);
                        }}
                        placeholder="Angka tanpa titik/strip..."
                        className="w-full font-mono bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-hidden focus:border-teal-500"
                      />
                      <span className="text-[10px] text-slate-500 block">
                        Angka murni tanpa titik atau strip
                      </span>
                    </div>

                    {/* Col F: NIK (16 Digit Text) */}
                    <div className="space-y-1.5">
                      <label className="text-slate-300 font-semibold flex items-center justify-between">
                        <span>NIK (Kolom F) <span className="text-rose-400">*</span></span>
                        <span className={isNikValid ? 'text-emerald-400 text-[10px]' : 'text-rose-400 text-[10px]'}>
                          {cleanNik.length}/16 digit
                        </span>
                      </label>
                      <input
                        type="text"
                        maxLength={16}
                        value={user.nik}
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 16);
                          handleUpdateUserField(user.id, 'nik', val);
                        }}
                        placeholder="16 digit angka..."
                        className={`w-full font-mono bg-slate-950 rounded-lg px-3 py-2 text-white focus:outline-hidden border ${
                          isNikValid ? 'border-slate-700 focus:border-teal-500' : 'border-rose-600 text-rose-300'
                        }`}
                      />
                      {!isNikValid && (
                        <span className="text-[10px] text-rose-400 block">
                          Wajib tepat 16 digit angka
                        </span>
                      )}
                    </div>

                    {/* Col G: E-mail (@sakti.mail.go.id / @kemenkeu.go.id) */}
                    <div className="space-y-1.5">
                      <label className="text-slate-300 font-semibold block">
                        E-mail (Kolom G) <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="email"
                        value={user.email}
                        onChange={e => handleUpdateUserField(user.id, 'email', e.target.value.trim())}
                        placeholder="nama@sakti.mail.go.id..."
                        className={`w-full bg-slate-950 rounded-lg px-3 py-2 text-white focus:outline-hidden border ${
                          isEmailOfficial ? 'border-slate-700 focus:border-teal-500' : 'border-amber-600 text-amber-200'
                        }`}
                      />
                      {!isEmailOfficial && user.email ? (
                        <span className="text-[10px] text-amber-400 block">
                          Peringatan: Gunakan domain @sakti.mail.go.id atau @kemenkeu.go.id
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 block">
                          @sakti.mail.go.id atau @kemenkeu.go.id
                        </span>
                      )}
                    </div>

                    {/* Col H: No. HP (Text) */}
                    <div className="space-y-1.5">
                      <label className="text-slate-300 font-semibold block">
                        No. HP (Kolom H) <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={user.noHp}
                        onChange={e => handleUpdateUserField(user.id, 'noHp', e.target.value)}
                        placeholder="08123456789..."
                        className="w-full font-mono bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-hidden focus:border-teal-500"
                      />
                      <span className="text-[10px] text-slate-500 block">
                        Wajib diawali dengan 08
                      </span>
                    </div>

                    {/* Col I: Nomor SK */}
                    <div className="space-y-1.5">
                      <label className="text-slate-300 font-semibold block">
                        Nomor SK (Kolom I) <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={user.nomorSk}
                        onChange={e => handleUpdateUserField(user.id, 'nomorSk', e.target.value)}
                        placeholder="Misal: 51 / SK / Tahun 2022"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-hidden focus:border-teal-500"
                      />
                      <span className="text-[10px] text-slate-500 block">
                        Sesuai SK Penetapan Pejabat Perbendaharaan
                      </span>
                    </div>

                    {/* Col J: Tanggal SK (DD-MM-YYYY) */}
                    <div className="space-y-1.5">
                      <label className="text-slate-300 font-semibold block">
                        Tanggal SK (Kolom J) <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={user.tanggalSk}
                        onChange={e => handleUpdateUserField(user.id, 'tanggalSk', e.target.value)}
                        placeholder="Format: DD-MM-YYYY (contoh: 28-02-2022)"
                        className="w-full font-mono bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-hidden focus:border-teal-500"
                      />
                      <span className="text-[10px] text-slate-500 block">
                        Format wajib: DD-MM-YYYY
                      </span>
                    </div>
                  </div>

                  {/* Col B: Peran / Role SAKTI (Multi-select Searchable) */}
                  <div className="pt-2 border-t border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-teal-400" />
                        Peran / Role SAKTI (Kolom B Master Template) <span className="text-rose-400">*</span>
                      </label>
                      <span className="text-[11px] text-slate-400">
                        {user.peranList.length} role dipilih • Digabung dalam 1 cell dipisahkan koma
                      </span>
                    </div>

                    <RoleMultiSelector
                      selectedRoles={user.peranList || []}
                      onChange={newRoles => handleUpdateUserField(user.id, 'peranList', newRoles)}
                      isBLU={isBLU}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* KPA Signatory & Document Attributes Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
          <Building2 className="w-4 h-4 text-teal-400" />
          <h3 className="text-sm font-bold text-white">
            Penetapan & Tanda Tangan Kuasa Pengguna Anggaran (KPA)
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="space-y-1.5">
            <label className="text-slate-300 font-semibold block">
              Nama Lengkap KPA <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={draft.kpa?.nama || ''}
              onChange={e => handleUpdateKpa('nama', e.target.value)}
              placeholder="Nama KPA..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-medium focus:outline-hidden focus:border-teal-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-300 font-semibold block">
              NIP KPA <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={draft.kpa?.nip || ''}
              onChange={e => handleUpdateKpa('nip', e.target.value.replace(/\D/g, ''))}
              placeholder="18 digit NIP..."
              className="w-full font-mono bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-hidden focus:border-teal-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-300 font-semibold block">
              Tempat Penetapan
            </label>
            <input
              type="text"
              value={draft.tempatPenetapan || ''}
              onChange={e => {
                const val = e.target.value;
                setDraft(prev => {
                  const updated = { ...prev, tempatPenetapan: val };
                  saveDraftLocally(updated, false);
                  return updated;
                });
              }}
              placeholder="Kota / Tempat (misal: Semarang)"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-hidden focus:border-teal-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-300 font-semibold block">
              Tanggal Penetapan
            </label>
            <input
              type="date"
              value={draft.tanggalPenetapan || today}
              onChange={e => {
                const val = e.target.value;
                setDraft(prev => {
                  const updated = { ...prev, tanggalPenetapan: val };
                  saveDraftLocally(updated, false);
                  return updated;
                });
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-hidden focus:border-teal-500"
            />
          </div>
        </div>
      </div>

      {/* Official Template Instruction Notes Card */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 text-xs text-slate-400 space-y-2">
        <span className="font-bold text-slate-300 block">
          Catatan Resmi Template Master SAKTI (Tercetak di Excel & PDF):
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="font-bold text-teal-400 block mb-1">1. Format NIP, NPWP, NIK</span>
            <p>Diisi angka murni tanpa pemisah simbol, titik, maupun strip. Disimpan sebagai format text di file Excel.</p>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="font-bold text-teal-400 block mb-1">2. Ketentuan Domain Email</span>
            <p>Email diisi dengan email SAKTI (@sakti.mail.go.id) atau Kemenkeu (@kemenkeu.go.id) bagi pegawai Kemenkeu.</p>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="font-bold text-teal-400 block mb-1">3. Format Tanggal SK</span>
            <p>Tanggal SK wajib menggunakan format tanggal DD-MM-YYYY (contoh: 28-02-2022).</p>
          </div>
        </div>
      </div>

      {/* Modals */}
      <PilihUserDataModal
        isOpen={isPilihUserOpen}
        onClose={() => setIsPilihUserOpen(false)}
        availableUsers={existingUsers}
        alreadySelectedUserIds={draft.users.map(u => u.userSaktiId || '').filter(Boolean)}
        onSelectUsers={handleAddUsersFromModal}
      />

      <PreviewPemutakhiranDataModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        draft={draft}
        onExportExcel={handleExportExcel}
        onExportPDF={handleExportPDF}
        isExportingExcel={isExportingExcel}
      />

      <RiwayatPemutakhiranDataModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        historyList={historyList}
        auditLogs={auditLogs}
        onExportExcel={item => exportPemutakhiranDataToExcel(item.draftData)}
        onExportPDF={item => exportPemutakhiranDataToPDF(item.draftData)}
        onLoadDraft={item => {
          setDraft(item.draftData);
          saveDraftLocally(item.draftData, true);
          setIsHistoryOpen(false);
          showToast('success', `Draf riwayat pengajuan ${item.kodeSatker} dimuat ke form aktif`);
        }}
      />
    </div>
  );
};
