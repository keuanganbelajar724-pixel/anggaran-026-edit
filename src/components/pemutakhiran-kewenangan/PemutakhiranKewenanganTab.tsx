import React, { useState, useEffect, useMemo } from 'react';
import {
  MasterSatker,
  UserSaktiRecord,
  PemutakhiranKewenanganDraft,
  PemutakhiranUserItem,
  PemutakhiranKewenanganHistoryItem,
  PemutakhiranAuditLog,
  PemutakhiranKategoriPeran
} from '../../types';
import { MASTER_ROLE_MAP, sortRolesByMasterOrder } from '../../data/masterRoleSakti';
import { RoleMultiSelector } from '../perubahan-user-sakti/RoleMultiSelector';
import { PilihUserPemutakhiranModal } from './PilihUserPemutakhiranModal';
import { PreviewPemutakhiranModal } from './PreviewPemutakhiranModal';
import { RiwayatPemutakhiranModal } from './RiwayatPemutakhiranModal';
import {
  exportPemutakhiranKewenanganToExcel,
  exportPemutakhiranKewenanganToPDF,
  validatePemutakhiranDraft
} from '../../utils/pemutakhiranKewenanganExport';
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
  ShieldCheck,
  Download,
  Save,
  Send,
  HelpCircle,
  RotateCcw,
  Sparkles,
  Lock,
  ArrowRight,
  UserPlus
} from 'lucide-react';

interface PemutakhiranKewenanganTabProps {
  satker: MasterSatker;
  existingUsers: UserSaktiRecord[];
  levelSatker?: string;
  kpaName?: string;
  kpaNip?: string;
  userName?: string;
}

export const PemutakhiranKewenanganTab: React.FC<PemutakhiranKewenanganTabProps> = ({
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

  // Strict isolation storage keys per satker
  const DRAFT_STORAGE_KEY = `sakti_pemutakhiran_draft_${kodeSatker}`;
  const HISTORY_STORAGE_KEY = `sakti_pemutakhiran_history_${kodeSatker}`;
  const AUDIT_STORAGE_KEY = `sakti_pemutakhiran_audit_${kodeSatker}`;

  // Modals state
  const [isPilihUserOpen, setIsPilihUserOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<PemutakhiranAuditLog[]>(() => {
    try {
      const saved = localStorage.getItem(AUDIT_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const appendAudit = (action: string, detail: string) => {
    const newLog: PemutakhiranAuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      action,
      detail,
      user: userName
    };
    setAuditLogs(prev => {
      const next = [newLog, ...prev].slice(0, 100);
      try {
        localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  // History State
  const [historyList, setHistoryList] = useState<PemutakhiranKewenanganHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(historyList));
    } catch (e) {}
  }, [historyList, HISTORY_STORAGE_KEY]);

  // Draft State
  const today = new Date().toISOString().split('T')[0];
  const [draft, setDraft] = useState<PemutakhiranKewenanganDraft>(() => {
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
      id: `draft-pmt-${kodeSatker}-${Date.now()}`,
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
      levelSatker: prev.levelSatker || levelSatker,
      kpa: {
        ...prev.kpa,
        nama: prev.kpa.nama || kpaName || '',
        nip: prev.kpa.nip || kpaNip || ''
      }
    }));
  }, [kodeSatker, namaSatker, levelSatker, kpaName, kpaNip]);

  // Save draft to localStorage
  const handleSaveDraft = (silent = false) => {
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
      appendAudit('Menyimpan Draft', `Menyimpan draft formulir pemutakhiran untuk ${draft.users.length} pengguna`);
      if (!silent) {
        showToast('success', 'Draft pemutakhiran kewenangan berhasil disimpan!');
      }
    } catch (e) {
      showToast('error', 'Gagal menyimpan draft ke penyimpanan lokal');
    }
  };

  const showToast = (type: 'success' | 'error' | 'info', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Add users from existing database
  const handleSelectUsersFromModal = (selectedUsers: UserSaktiRecord[]) => {
    const newItems: PemutakhiranUserItem[] = selectedUsers.map(u => {
      // Determine default kategori peran
      let peranKat: PemutakhiranKategoriPeran = 'OPERATOR';
      if (u.peranJabatan === 'Approval' || (u.roles || []).some(r => r.includes('APPROVER') || r.includes('KPA'))) {
        peranKat = 'APPROVER';
      } else if (u.peranJabatan === 'Validator' || (u.roles || []).some(r => r.includes('VALIDATOR') || r.includes('PPSPM'))) {
        peranKat = 'VALIDATOR';
      }

      const initialRoles = sortRolesByMasterOrder(u.roles || []);

      return {
        id: `pmt-user-${u.id}-${Date.now()}`,
        userSaktiId: u.id,
        kodeSatker,
        tipe: 'SATKER',
        peranKategori: peranKat,
        nama: u.namaLengkap,
        nik: (u.nik || '').replace(/\D/g, ''),
        nip: u.nip || '',
        rolesSaatIni: initialRoles,
        rolesPemutakhiran: initialRoles,
        diffSummary: {
          rolesAdded: [],
          rolesRemoved: [],
          rolesUnchanged: initialRoles
        }
      };
    });

    setDraft(prev => ({
      ...prev,
      users: [...prev.users, ...newItems],
      updatedAt: new Date().toISOString()
    }));

    appendAudit(
      'Menambahkan Pengguna',
      `Menambahkan ${selectedUsers.length} pengguna (${selectedUsers.map(u => u.namaLengkap).join(', ')}) ke daftar`
    );
    showToast('success', `Berhasil menambahkan ${selectedUsers.length} pengguna SAKTI`);
  };

  // Add manual user slot
  const handleAddManualUser = () => {
    const newItem: PemutakhiranUserItem = {
      id: `pmt-user-manual-${Date.now()}`,
      kodeSatker,
      tipe: 'SATKER',
      peranKategori: 'OPERATOR',
      nama: '',
      nik: '',
      nip: '',
      rolesSaatIni: [],
      rolesPemutakhiran: [],
      diffSummary: {
        rolesAdded: [],
        rolesRemoved: [],
        rolesUnchanged: []
      }
    };

    setDraft(prev => ({
      ...prev,
      users: [...prev.users, newItem],
      updatedAt: new Date().toISOString()
    }));

    appendAudit('Tambah Pengguna Manual', 'Menambahkan baris pengguna baru secara manual');
  };

  // Remove user item
  const handleRemoveUser = (userId: string, userNameStr: string) => {
    setDraft(prev => ({
      ...prev,
      users: prev.users.filter(u => u.id !== userId),
      updatedAt: new Date().toISOString()
    }));
    appendAudit('Menghapus Pengguna', `Menghapus pengguna "${userNameStr}" dari daftar formulir`);
    showToast('info', `Pengguna "${userNameStr}" dihapus dari formulir`);
  };

  // Update user fields
  const handleUpdateUserField = (userId: string, field: keyof PemutakhiranUserItem, value: any) => {
    setDraft(prev => ({
      ...prev,
      users: prev.users.map(u => {
        if (u.id !== userId) return u;
        return {
          ...u,
          [field]: value
        };
      }),
      updatedAt: new Date().toISOString()
    }));
  };

  // Update user roles
  const handleUpdateUserRoles = (userId: string, newRoles: string[]) => {
    setDraft(prev => ({
      ...prev,
      users: prev.users.map(u => {
        if (u.id !== userId) return u;

        const sortedNew = sortRolesByMasterOrder(newRoles);
        const rolesAdded = sortedNew.filter(r => !u.rolesSaatIni.includes(r));
        const rolesRemoved = u.rolesSaatIni.filter(r => !sortedNew.includes(r));
        const rolesUnchanged = sortedNew.filter(r => u.rolesSaatIni.includes(r));

        return {
          ...u,
          rolesPemutakhiran: sortedNew,
          diffSummary: {
            rolesAdded,
            rolesRemoved,
            rolesUnchanged
          }
        };
      }),
      updatedAt: new Date().toISOString()
    }));
  };

  // Export to Excel
  const handleExportExcel = async () => {
    const val = validatePemutakhiranDraft(draft);
    if (!val.isValid) {
      showToast('error', val.errors[0]);
      return;
    }

    try {
      await exportPemutakhiranKewenanganToExcel(draft);

      const now = new Date().toISOString();
      const updatedDraft = { ...draft, exportedExcelAt: now, updatedAt: now };
      setDraft(updatedDraft);
      handleSaveDraft(true);

      // Add to history
      const historyItem: PemutakhiranKewenanganHistoryItem = {
        id: `hist-${Date.now()}`,
        kodeSatker: draft.kodeSatker,
        namaSatker: draft.namaSatker,
        levelSatker: draft.levelSatker,
        draftData: updatedDraft,
        tanggalPengajuan: draft.tanggalPenetapan,
        totalUser: draft.users.length,
        kpa: {
          nama: draft.kpa.nama,
          nip: draft.kpa.nip
        },
        status: draft.status,
        exportedExcelAt: now,
        createdBy: userName,
        createdAt: now,
        updatedAt: now
      };
      setHistoryList(prev => [historyItem, ...prev]);

      appendAudit('Export Excel', `Berhasil mengekspor Formulir Pemutakhiran Kewenangan (${draft.users.length} pengguna) sesuai master template`);
      showToast('success', 'File Excel resmi SAKTI berhasil diekspor sesuai template master!');
    } catch (err: any) {
      showToast('error', err?.message || 'Gagal mengekspor file Excel');
    }
  };

  // Export to PDF
  const handleExportPDF = () => {
    const val = validatePemutakhiranDraft(draft);
    if (!val.isValid) {
      showToast('error', val.errors[0]);
      return;
    }

    try {
      exportPemutakhiranKewenanganToPDF(draft);

      const now = new Date().toISOString();
      const updatedDraft = { ...draft, exportedPdfAt: now, updatedAt: now };
      setDraft(updatedDraft);
      handleSaveDraft(true);

      appendAudit('Export PDF', `Berhasil mengekspor PDF resmi Formulir Pemutakhiran Kewenangan (${draft.users.length} pengguna)`);
      showToast('success', 'File PDF resmi siap tandatangan KPA berhasil diekspor!');
    } catch (err: any) {
      showToast('error', err?.message || 'Gagal mengekspor file PDF');
    }
  };

  // Submit document
  const handleSubmitDocument = () => {
    const val = validatePemutakhiranDraft(draft);
    if (!val.isValid) {
      showToast('error', val.errors[0]);
      return;
    }

    const now = new Date().toISOString();
    const updatedDraft: PemutakhiranKewenanganDraft = {
      ...draft,
      status: 'DIAJUKAN',
      updatedAt: now
    };
    setDraft(updatedDraft);

    const historyItem: PemutakhiranKewenanganHistoryItem = {
      id: `hist-${Date.now()}`,
      kodeSatker: draft.kodeSatker,
      namaSatker: draft.namaSatker,
      levelSatker: draft.levelSatker,
      draftData: updatedDraft,
      tanggalPengajuan: draft.tanggalPenetapan,
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
    setHistoryList(prev => [historyItem, ...prev]);

    appendAudit('Pengajuan Dokumen', `Mengajukan dokumen pemutakhiran kewenangan (${draft.users.length} pengguna) ke status DIAJUKAN`);
    showToast('success', 'Dokumen Pemutakhiran Kewenangan berhasil diajukan!');
  };

  // Load from history
  const handleLoadFromHistory = (item: PemutakhiranKewenanganHistoryItem) => {
    setDraft(item.draftData);
    appendAudit('Buka Riwayat', `Membuka kembali riwayat pengajuan tanggal ${item.tanggalPengajuan}`);
    showToast('info', 'Formulir berhasil dimuat dari riwayat');
  };

  // Delete history item
  const handleDeleteHistory = (id: string) => {
    setHistoryList(prev => prev.filter(h => h.id !== id));
    showToast('info', 'Item riwayat berhasil dihapus');
  };

  // Download raw master template
  const handleDownloadMasterTemplate = () => {
    const link = document.createElement('a');
    link.href = '/templates/Contoh Form Pemutakhiran Kewenangan (29).xlsx';
    link.download = 'Contoh Form Pemutakhiran Kewenangan (29).xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    appendAudit('Unduh Template Asli', 'Mengunduh file master template asli "Contoh Form Pemutakhiran Kewenangan (29).xlsx"');
    showToast('success', 'Mengunduh file template master asli SAKTI...');
  };

  // Real-time validation
  const validationSummary = useMemo(() => {
    return validatePemutakhiranDraft(draft);
  }, [draft]);

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
              : 'bg-indigo-950/90 text-indigo-300 border-indigo-500/50'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : toastMessage.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          ) : (
            <Sparkles className="w-4 h-4 text-indigo-400" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Banner / Satker Identity Header */}
      <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <Lock className="w-4 h-4" />
              </span>
              <h2 className="text-lg font-bold text-white tracking-tight">
                🔐 Formulir Pemutakhiran Kewenangan Pengguna SAKTI
              </h2>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 font-semibold">
                TEMPLATE: Contoh Form Pemutakhiran Kewenangan (29).xlsx
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Pengajuan pemutakhiran kewenangan/role pengguna SAKTI Satker dengan output Excel 100% kloning master template & PDF resmi.
            </p>
          </div>

          {/* Top Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadMasterTemplate}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer"
              title="Unduh file master template asli untuk verifikasi struktur"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>Template Asli (.xlsx)</span>
            </button>

            <button
              type="button"
              onClick={() => setIsHistoryOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer"
            >
              <History className="w-3.5 h-3.5 text-amber-400" />
              <span>Riwayat ({historyList.length})</span>
            </button>

            <button
              type="button"
              onClick={() => handleSaveDraft()}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 text-teal-400" />
              <span>Simpan Draft</span>
            </button>
          </div>
        </div>

        {/* Satker Metadata Cards (Cell A3, A4, A6) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-800/80 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Kode Satker (A3 / Formula =$B$3)
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-white text-sm">{kodeSatker}</span>
              <span className="text-[10px] text-emerald-400 font-medium px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/50">
                Terkunci Sesuai Akun
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Nama Satker (A4 / Sel B4)
            </span>
            <div className="font-semibold text-slate-200 truncate" title={namaSatker}>
              {namaSatker}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Level Satker (A6 / Sel B6)
            </span>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-200">{draft.levelSatker}</span>
              {isBLU && (
                <span className="text-[10px] text-amber-300 font-bold px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-800/50">
                  BLU
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl shadow-xl overflow-hidden">
        {/* Table Toolbar Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Users className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-white">
                Daftar Pemutakhiran Kewenangan ({draft.users.length} Pengguna)
              </h3>
              <p className="text-[11px] text-slate-400">
                Header Kolom Baris 7: Kode Satker | Tipe | Peran | Nama | NIK | Peran SAKTI
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setIsPilihUserOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Pilih Dari User SAKTI</span>
            </button>

            <button
              type="button"
              onClick={handleAddManualUser}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Manual</span>
            </button>
          </div>
        </div>

        {/* User Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                <th className="py-3 px-3 w-12 text-center font-bold">No</th>
                <th className="py-3 px-3 w-28 text-center font-bold">Kode Satker</th>
                <th className="py-3 px-3 w-28 text-center font-bold">Tipe</th>
                <th className="py-3 px-3 w-36 text-center font-bold">Peran (Kategori)</th>
                <th className="py-3 px-3 w-48 font-bold">Nama</th>
                <th className="py-3 px-3 w-40 text-center font-bold">NIK (16 Digit)</th>
                <th className="py-3 px-3 font-bold min-w-[320px]">Peran (Role SAKTI)</th>
                <th className="py-3 px-3 w-20 text-center font-bold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {draft.users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-medium">Belum ada pengguna yang ditambahkan</p>
                    <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
                      Klik tombol <strong>"Pilih Dari User SAKTI"</strong> untuk memilih dari data pengguna yang sudah terdaftar di Satker, atau gunakan <strong>"Tambah Manual"</strong>.
                    </p>
                  </td>
                </tr>
              ) : (
                draft.users.map((user, idx) => {
                  const cleanNik = (user.nik || '').replace(/\D/g, '');
                  const isNikValid = cleanNik.length === 16;
                  const diff = user.diffSummary || { rolesAdded: [], rolesRemoved: [], rolesUnchanged: [] };

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-850/60 transition-colors group align-top"
                    >
                      {/* No */}
                      <td className="py-3 px-3 text-center text-slate-500 font-mono text-xs">
                        {idx + 1}
                      </td>

                      {/* Kode Satker (Formula =$B$3) */}
                      <td className="py-3 px-3 text-center">
                        <span className="font-mono font-bold text-slate-300 bg-slate-950 px-2 py-1 rounded border border-slate-800 text-[11px] block" title="Formula Excel =$B$3">
                          {kodeSatker}
                        </span>
                      </td>

                      {/* Tipe (default 'SATKER') */}
                      <td className="py-3 px-3 text-center">
                        <select
                          value={user.tipe || 'SATKER'}
                          onChange={e => handleUpdateUserField(user.id, 'tipe', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-xs text-white focus:outline-hidden focus:border-indigo-500"
                        >
                          <option value="SATKER">SATKER</option>
                          <option value="PUSAT">PUSAT</option>
                          <option value="WILAYAH">WILAYAH</option>
                        </select>
                      </td>

                      {/* Peran (Kategori) */}
                      <td className="py-3 px-3 text-center">
                        <select
                          value={user.peranKategori || 'OPERATOR'}
                          onChange={e => handleUpdateUserField(user.id, 'peranKategori', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-xs text-indigo-300 font-semibold focus:outline-hidden focus:border-indigo-500"
                        >
                          <option value="OPERATOR">OPERATOR</option>
                          <option value="APPROVER">APPROVER</option>
                          <option value="VALIDATOR">VALIDATOR</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                      </td>

                      {/* Nama */}
                      <td className="py-3 px-3">
                        <input
                          type="text"
                          value={user.nama}
                          onChange={e => handleUpdateUserField(user.id, 'nama', e.target.value)}
                          placeholder="Nama lengkap pegawai..."
                          className="w-full bg-slate-950 border border-slate-700 rounded-md px-2.5 py-1 text-xs text-white font-medium focus:outline-hidden focus:border-indigo-500"
                        />
                        {user.nip && (
                          <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                            NIP: {user.nip}
                          </span>
                        )}
                      </td>

                      {/* NIK (16 Digit Text) */}
                      <td className="py-3 px-3 text-center">
                        <input
                          type="text"
                          maxLength={16}
                          value={user.nik}
                          onChange={e => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 16);
                            handleUpdateUserField(user.id, 'nik', val);
                          }}
                          placeholder="16 digit NIK..."
                          className={`w-full font-mono text-xs text-center px-2 py-1 rounded-md bg-slate-950 border focus:outline-hidden ${
                            isNikValid
                              ? 'border-slate-700 text-emerald-400 focus:border-indigo-500'
                              : 'border-rose-700 text-rose-400 focus:border-rose-500'
                          }`}
                        />
                        {!isNikValid && (
                          <span className="text-[9px] text-rose-400 block mt-0.5 font-sans">
                            {cleanNik.length}/16 digit
                          </span>
                        )}
                      </td>

                      {/* Peran SAKTI (Role SAKTI) & Diff Summary */}
                      <td className="py-3 px-3">
                        <div className="space-y-2">
                          <RoleMultiSelector
                            selectedRoles={user.rolesPemutakhiran || []}
                            onChange={newRoles => handleUpdateUserRoles(user.id, newRoles)}
                            isBLU={isBLU}
                          />

                          {/* Role Change Summary (Diff) */}
                          <div className="flex flex-wrap items-center gap-1 text-[10px] pt-1">
                            {diff.rolesAdded.length > 0 && (
                              <div className="flex items-center gap-1 text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
                                <span>+ Ditambahkan:</span>
                                <span className="font-bold font-mono">{diff.rolesAdded.length} role</span>
                              </div>
                            )}

                            {diff.rolesRemoved.length > 0 && (
                              <div className="flex items-center gap-1 text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/50">
                                <span>- Dihapus:</span>
                                <span className="font-bold font-mono">{diff.rolesRemoved.length} role</span>
                              </div>
                            )}

                            {diff.rolesAdded.length === 0 && diff.rolesRemoved.length === 0 && (
                              <span className="text-slate-500 italic">
                                Belum ada perubahan kewenangan dari role awal
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Aksi */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveUser(user.id, user.nama)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Hapus baris pengguna"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer: Official Notes & KPA Information */}
        <div className="p-5 border-t border-slate-800 bg-slate-900/60 space-y-4">
          {/* Official Notes Box */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 space-y-1">
            <span className="font-bold text-slate-300 block mb-0.5">
              Catatan Resmi Template Pemutakhiran Kewenangan SAKTI:
            </span>
            <p>1. Silakan mengisi data pengguna (User) yang ingin di-update kewenangannya.</p>
            <p>2. Pastikan NIK telah benar dimiliki oleh pengguna dan sesuai (16 digit).</p>
            <p>3. Isian Formulir Pemutakhiran Kewenangan akan mengupdate kewenangan user yang ada saat ini.</p>
          </div>

          {/* KPA Signature Inputs */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Penetapan & Tanda Tangan Kuasa Pengguna Anggaran (KPA)
              </span>
              <span className="text-[10px] text-slate-500">
                Dicetak pada area tanda tangan Excel dan PDF
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Tempat Penetapan</label>
                <input
                  type="text"
                  value={draft.tempatPenetapan || ''}
                  onChange={e => setDraft(prev => ({ ...prev, tempatPenetapan: e.target.value }))}
                  placeholder="Contoh: Jakarta"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Tanggal Penetapan</label>
                <input
                  type="date"
                  value={draft.tanggalPenetapan || ''}
                  onChange={e => setDraft(prev => ({ ...prev, tanggalPenetapan: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Nama Kuasa Pengguna Anggaran (KPA)</label>
                <input
                  type="text"
                  value={draft.kpa.nama || ''}
                  onChange={e =>
                    setDraft(prev => ({ ...prev, kpa: { ...prev.kpa, nama: e.target.value } }))
                  }
                  placeholder="Nama lengkap & gelar KPA..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs font-semibold focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">NIP KPA</label>
                <input
                  type="text"
                  value={draft.kpa.nip || ''}
                  onChange={e =>
                    setDraft(prev => ({
                      ...prev,
                      kpa: { ...prev.kpa, nip: e.target.value.replace(/\D/g, '').slice(0, 18) }
                    }))
                  }
                  placeholder="18 digit NIP..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div className="p-4 border-t border-slate-800 bg-slate-850 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {validationSummary.isValid ? (
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Seluruh 13 poin validasi master template lolos verifikasi</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-amber-400 text-xs font-semibold">
                <AlertCircle className="w-4 h-4" />
                <span>{validationSummary.errors[0]}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => setIsPreviewOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer"
            >
              <Eye className="w-4 h-4 text-indigo-400" />
              <span>Pratinjau Formulir</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              disabled={draft.users.length === 0}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Excel (Master Template)</span>
            </button>

            <button
              type="button"
              onClick={handleExportPDF}
              disabled={draft.users.length === 0}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-rose-600/20 transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Export PDF</span>
            </button>

            <button
              type="button"
              onClick={handleSubmitDocument}
              disabled={draft.users.length === 0 || draft.status === 'DIAJUKAN'}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{draft.status === 'DIAJUKAN' ? 'Dokumen Diajukan' : 'Ajukan Dokumen'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <PilihUserPemutakhiranModal
        isOpen={isPilihUserOpen}
        onClose={() => setIsPilihUserOpen(false)}
        availableUsers={existingUsers}
        alreadySelectedUserIds={draft.users.map(u => u.userSaktiId || '').filter(Boolean)}
        onSelectUsers={handleSelectUsersFromModal}
      />

      <PreviewPemutakhiranModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        draft={draft}
        onExportExcel={handleExportExcel}
        onExportPDF={handleExportPDF}
      />

      <RiwayatPemutakhiranModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        historyList={historyList}
        auditLogs={auditLogs}
        onLoadDraft={handleLoadFromHistory}
        onDeleteHistory={handleDeleteHistory}
        onExportExcelItem={item => exportPemutakhiranKewenanganToExcel(item.draftData)}
        onExportPdfItem={item => exportPemutakhiranKewenanganToPDF(item.draftData)}
      />
    </div>
  );
};
