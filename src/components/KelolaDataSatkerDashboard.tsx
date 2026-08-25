import React, { useState, useMemo, useRef } from 'react';
import {
  Building2,
  Phone,
  Mail,
  User,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Upload,
  Download,
  FileSpreadsheet,
  FileDown,
  Search,
  Filter,
  Send,
  Lock,
  Unlock,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
  Save,
  X,
  ExternalLink,
  MessageSquare,
  Check,
  KeyRound,
  Users,
  Shield,
  Briefcase,
  Coins,
  FileText,
  BadgeCheck,
  HelpCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { MasterSatker, SatkerIKPA, AppTheme, PejabatDanOperator, PejabatRoleInfo } from '../types';
import { ModernConfirmModal, ConfirmModalState } from './ModernConfirmModal';
import { getSatkerDefaultPassword, verifySatkerPassword, resolveKodeBA } from '../utils/satkerSecurity';
import { PaginationControl } from './PaginationControl';

interface KelolaDataSatkerDashboardProps {
  masterSatkers: MasterSatker[];
  satkers?: SatkerIKPA[];
  theme?: AppTheme;
  isAdminAuthenticated?: boolean;
  onSaveMasterSatker: (satker: MasterSatker) => Promise<void> | void;
  onUpdateMasterSatkers: (satkers: MasterSatker[]) => void;
  onDeleteMasterSatker?: (id: string) => void;
  onDeleteBatchMasterSatkers?: (ids: string[]) => void;
  onClearAllMasterSatkers?: () => void;
  onToggleActiveMasterSatker: (id: string) => void;
  onGoToAdmin?: () => void;
  onOpenReminder?: (satker: SatkerIKPA) => void;
}

export const KelolaDataSatkerDashboard: React.FC<KelolaDataSatkerDashboardProps> = ({
  masterSatkers = [],
  satkers = [],
  theme = 'light',
  isAdminAuthenticated = false,
  onSaveMasterSatker,
  onUpdateMasterSatkers,
  onDeleteMasterSatker,
  onDeleteBatchMasterSatkers,
  onClearAllMasterSatkers,
  onToggleActiveMasterSatker,
  onGoToAdmin,
  onOpenReminder
}) => {
  const isDark = theme === 'dark';

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'AKTIF' | 'NONAKTIF' | 'LENGKAP' | 'BELUM_LENGKAP'>('ALL');
  const [filterKL, setFilterKL] = useState<string>('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState | null>(null);

  // Modal State for Add / Edit Master Satker Full
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSatker, setEditingSatker] = useState<MasterSatker | null>(null);

  // Modal State for Pejabat & Operator Satker (Protected by Satker Password)
  const [isPejabatModalOpen, setIsPejabatModalOpen] = useState(false);
  const [selectedSatkerForPejabat, setSelectedSatkerForPejabat] = useState<MasterSatker | null>(null);
  
  // Password Protection Gatekeeper State
  const [isPasswordUnlocked, setIsPasswordUnlocked] = useState(false);
  const [inputPassword, setInputPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showPasswordText, setShowPasswordText] = useState(false);

  // Quick Password Change Modal for Admin
  const [quickPasswordModal, setQuickPasswordModal] = useState<{
    isOpen: boolean;
    satker: MasterSatker | null;
    passwordValue: string;
  }>({
    isOpen: false,
    satker: null,
    passwordValue: ''
  });

  // Pejabat & Operator Form State
  const [pejabatFormData, setPejabatFormData] = useState<{
    kpa: PejabatRoleInfo;
    ppk: PejabatRoleInfo;
    ppspm: PejabatRoleInfo;
    bendahara: PejabatRoleInfo;
    operatorPembayaran: PejabatRoleInfo;
    operatorKomitmen: PejabatRoleInfo;
    operatorGaji: PejabatRoleInfo;
    operatorPelaporan: PejabatRoleInfo;
    namaPic: string;
    noHpPic: string;
    emailPic: string;
    alamatSatker: string;
    passwordSatker: string;
  }>({
    kpa: { nama: '', noHp: '', nip: '', email: '' },
    ppk: { nama: '', noHp: '', nip: '', email: '' },
    ppspm: { nama: '', noHp: '', nip: '', email: '' },
    bendahara: { nama: '', noHp: '', nip: '', email: '' },
    operatorPembayaran: { nama: '', noHp: '', nip: '', email: '' },
    operatorKomitmen: { nama: '', noHp: '', nip: '', email: '' },
    operatorGaji: { nama: '', noHp: '', nip: '', email: '' },
    operatorPelaporan: { nama: '', noHp: '', nip: '', email: '' },
    namaPic: '',
    noHpPic: '',
    emailPic: '',
    alamatSatker: '',
    passwordSatker: ''
  });

  // Master Form State
  const [formData, setFormData] = useState<Partial<MasterSatker>>({
    kodeSatker: '',
    namaSatker: '',
    isActive: true,
    kodeBa: '018',
    kementerianLembaga: '',
    unitEselon1: '',
    namaPic: '',
    noHpPic: '',
    emailPic: '',
    alamatSatker: '',
    passwordSatker: '',
    catatan: ''
  });

  // File Upload Refs
  const masterFileInputRef = useRef<HTMLInputElement>(null);
  const phoneFileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3800);
  };

  // Distinct K/L options for filtering
  const klOptions = useMemo(() => {
    const set = new Set<string>();
    masterSatkers.forEach(m => {
      if (m.kementerianLembaga) set.add(m.kementerianLembaga);
    });
    return Array.from(set).sort();
  }, [masterSatkers]);

  // Helper count filled roles for a satker
  const getFilledRolesCount = (satker: MasterSatker): number => {
    const p = satker.pejabatOperator;
    if (!p) return satker.noHpPic ? 1 : 0;

    let count = 0;
    if (p.kpa?.nama || p.kpa?.noHp) count++;
    if (p.ppk?.nama || p.ppk?.noHp) count++;
    if (p.ppspm?.nama || p.ppspm?.noHp) count++;
    if (p.bendahara?.nama || p.bendahara?.noHp) count++;
    if (p.operatorPembayaran?.nama || p.operatorPembayaran?.noHp) count++;
    if (p.operatorKomitmen?.nama || p.operatorKomitmen?.noHp) count++;
    if (p.operatorGaji?.nama || p.operatorGaji?.noHp) count++;
    if (p.operatorPelaporan?.nama || p.operatorPelaporan?.noHp) count++;
    return count;
  };

  // Filtered List
  const filteredSatkers = useMemo(() => {
    return masterSatkers.filter(m => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        m.kodeSatker.toLowerCase().includes(q) ||
        m.namaSatker.toLowerCase().includes(q) ||
        (m.namaPic && m.namaPic.toLowerCase().includes(q)) ||
        (m.noHpPic && m.noHpPic.includes(q)) ||
        (m.kementerianLembaga && m.kementerianLembaga.toLowerCase().includes(q)) ||
        (m.pejabatOperator?.kpa?.nama && m.pejabatOperator.kpa.nama.toLowerCase().includes(q)) ||
        (m.pejabatOperator?.ppk?.nama && m.pejabatOperator.ppk.nama.toLowerCase().includes(q)) ||
        (m.pejabatOperator?.ppspm?.nama && m.pejabatOperator.ppspm.nama.toLowerCase().includes(q)) ||
        (m.pejabatOperator?.bendahara?.nama && m.pejabatOperator.bendahara.nama.toLowerCase().includes(q));

      if (!matchSearch) return false;

      if (filterKL !== 'ALL' && m.kementerianLembaga !== filterKL) return false;

      const rolesFilled = getFilledRolesCount(m);
      if (filterStatus === 'AKTIF') return m.isActive === true;
      if (filterStatus === 'NONAKTIF') return m.isActive === false;
      if (filterStatus === 'LENGKAP') return rolesFilled >= 4;
      if (filterStatus === 'BELUM_LENGKAP') return rolesFilled < 4;

      return true;
    });
  }, [masterSatkers, searchQuery, filterStatus, filterKL]);

  const paginatedSatkers = useMemo(() => {
    if (pageSize <= 0) return filteredSatkers;
    return filteredSatkers.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [filteredSatkers, currentPage, pageSize]);

  // Metrics
  const totalMaster = masterSatkers.length;
  const totalAktif = masterSatkers.filter(m => m.isActive).length;
  const totalNonaktif = masterSatkers.filter(m => !m.isActive).length;
  const totalLengkap = masterSatkers.filter(m => getFilledRolesCount(m) >= 4).length;
  const totalBelumLengkap = totalMaster - totalLengkap;

  // Open Pejabat / Satker Data Form with Password Verification
  const handleOpenPejabatModal = (satker: MasterSatker) => {
    setSelectedSatkerForPejabat(satker);
    setInputPassword('');
    setPasswordError(null);
    setShowPasswordText(false);

    const po = satker.pejabatOperator || {};
    setPejabatFormData({
      kpa: { nama: po.kpa?.nama || '', noHp: po.kpa?.noHp || '', nip: po.kpa?.nip || '', email: po.kpa?.email || '' },
      ppk: { nama: po.ppk?.nama || '', noHp: po.ppk?.noHp || '', nip: po.ppk?.nip || '', email: po.ppk?.email || '' },
      ppspm: { nama: po.ppspm?.nama || '', noHp: po.ppspm?.noHp || '', nip: po.ppspm?.nip || '', email: po.ppspm?.email || '' },
      bendahara: { nama: po.bendahara?.nama || '', noHp: po.bendahara?.noHp || '', nip: po.bendahara?.nip || '', email: po.bendahara?.email || '' },
      operatorPembayaran: { nama: po.operatorPembayaran?.nama || '', noHp: po.operatorPembayaran?.noHp || '', nip: po.operatorPembayaran?.nip || '', email: po.operatorPembayaran?.email || '' },
      operatorKomitmen: { nama: po.operatorKomitmen?.nama || '', noHp: po.operatorKomitmen?.noHp || '', nip: po.operatorKomitmen?.nip || '', email: po.operatorKomitmen?.email || '' },
      operatorGaji: { nama: po.operatorGaji?.nama || '', noHp: po.operatorGaji?.noHp || '', nip: po.operatorGaji?.nip || '', email: po.operatorGaji?.email || '' },
      operatorPelaporan: { nama: po.operatorPelaporan?.nama || '', noHp: po.operatorPelaporan?.noHp || '', nip: po.operatorPelaporan?.nip || '', email: po.operatorPelaporan?.email || '' },
      namaPic: satker.namaPic || '',
      noHpPic: satker.noHpPic || '',
      emailPic: satker.emailPic || '',
      alamatSatker: satker.alamatSatker || '',
      passwordSatker: satker.passwordSatker || getSatkerDefaultPassword(satker)
    });

    // Admin bypass: If admin is authenticated, unlock immediately
    if (isAdminAuthenticated) {
      setIsPasswordUnlocked(true);
    } else {
      setIsPasswordUnlocked(false);
    }

    setIsPejabatModalOpen(true);
  };

  // Verify Satker Password
  const handleVerifyPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSatkerForPejabat) return;

    const isValid = verifySatkerPassword(selectedSatkerForPejabat, inputPassword, isAdminAuthenticated);

    if (isValid) {
      setIsPasswordUnlocked(true);
      setPasswordError(null);
    } else {
      setPasswordError('Password Satker tidak sesuai. Silakan hubungi Admin KPPN jika Anda lupa password.');
    }
  };

  // Open Quick Password Change Dialog (Admin Only)
  const handleOpenQuickPassword = (satker: MasterSatker) => {
    setQuickPasswordModal({
      isOpen: true,
      satker,
      passwordValue: satker.passwordSatker || getSatkerDefaultPassword(satker)
    });
  };

  // Save Quick Password (Admin Only)
  const handleSaveQuickPassword = async () => {
    if (!quickPasswordModal.satker) return;
    const newPass = quickPasswordModal.passwordValue.trim() || getSatkerDefaultPassword(quickPasswordModal.satker);
    const updatedSatker: MasterSatker = {
      ...quickPasswordModal.satker,
      passwordSatker: newPass,
      updatedAt: new Date().toISOString()
    };

    await onSaveMasterSatker(updatedSatker);
    triggerToast(`Password untuk Satker ${updatedSatker.namaSatker} (${updatedSatker.kodeSatker}) berhasil diubah menjadi: ${newPass}`);
    setQuickPasswordModal({ isOpen: false, satker: null, passwordValue: '' });
  };

  // Save Pejabat & Operator Data
  const handleSavePejabatData = async () => {
    if (!selectedSatkerForPejabat) return;

    // Helper format nomor hp
    const cleanHp = (hp?: string) => {
      if (!hp) return undefined;
      let clean = hp.trim().replace(/\s+/g, '').replace(/[-_.]/g, '');
      if (clean.startsWith('+62')) clean = '0' + clean.substring(3);
      else if (clean.startsWith('62') && clean.length > 8) clean = '0' + clean.substring(2);
      return clean || undefined;
    };

    const newPejabatOperator: PejabatDanOperator = {
      kpa: {
        nama: pejabatFormData.kpa.nama.trim(),
        noHp: cleanHp(pejabatFormData.kpa.noHp),
        nip: pejabatFormData.kpa.nip?.trim() || undefined,
        email: pejabatFormData.kpa.email?.trim() || undefined
      },
      ppk: {
        nama: pejabatFormData.ppk.nama.trim(),
        noHp: cleanHp(pejabatFormData.ppk.noHp),
        nip: pejabatFormData.ppk.nip?.trim() || undefined,
        email: pejabatFormData.ppk.email?.trim() || undefined
      },
      ppspm: {
        nama: pejabatFormData.ppspm.nama.trim(),
        noHp: cleanHp(pejabatFormData.ppspm.noHp),
        nip: pejabatFormData.ppspm.nip?.trim() || undefined,
        email: pejabatFormData.ppspm.email?.trim() || undefined
      },
      bendahara: {
        nama: pejabatFormData.bendahara.nama.trim(),
        noHp: cleanHp(pejabatFormData.bendahara.noHp),
        nip: pejabatFormData.bendahara.nip?.trim() || undefined,
        email: pejabatFormData.bendahara.email?.trim() || undefined
      },
      operatorPembayaran: {
        nama: pejabatFormData.operatorPembayaran.nama.trim(),
        noHp: cleanHp(pejabatFormData.operatorPembayaran.noHp),
        nip: pejabatFormData.operatorPembayaran.nip?.trim() || undefined,
        email: pejabatFormData.operatorPembayaran.email?.trim() || undefined
      },
      operatorKomitmen: {
        nama: pejabatFormData.operatorKomitmen.nama.trim(),
        noHp: cleanHp(pejabatFormData.operatorKomitmen.noHp),
        nip: pejabatFormData.operatorKomitmen.nip?.trim() || undefined,
        email: pejabatFormData.operatorKomitmen.email?.trim() || undefined
      },
      operatorGaji: {
        nama: pejabatFormData.operatorGaji.nama.trim(),
        noHp: cleanHp(pejabatFormData.operatorGaji.noHp),
        nip: pejabatFormData.operatorGaji.nip?.trim() || undefined,
        email: pejabatFormData.operatorGaji.email?.trim() || undefined
      },
      operatorPelaporan: {
        nama: pejabatFormData.operatorPelaporan.nama.trim(),
        noHp: cleanHp(pejabatFormData.operatorPelaporan.noHp),
        nip: pejabatFormData.operatorPelaporan.nip?.trim() || undefined,
        email: pejabatFormData.operatorPelaporan.email?.trim() || undefined
      }
    };

    // Primary PIC fallback
    const primaryPhone =
      cleanHp(pejabatFormData.noHpPic) ||
      newPejabatOperator.operatorPembayaran?.noHp ||
      newPejabatOperator.bendahara?.noHp ||
      newPejabatOperator.ppk?.noHp ||
      newPejabatOperator.kpa?.noHp;

    const primaryName =
      pejabatFormData.namaPic.trim() ||
      newPejabatOperator.operatorPembayaran?.nama ||
      newPejabatOperator.bendahara?.nama ||
      newPejabatOperator.ppk?.nama ||
      newPejabatOperator.kpa?.nama;

    const updated: MasterSatker = {
      ...selectedSatkerForPejabat,
      pejabatOperator: newPejabatOperator,
      namaPic: primaryName || undefined,
      noHpPic: primaryPhone || undefined,
      emailPic: pejabatFormData.emailPic.trim() || undefined,
      alamatSatker: pejabatFormData.alamatSatker.trim() || undefined,
      passwordSatker: pejabatFormData.passwordSatker.trim() || getSatkerDefaultPassword(selectedSatkerForPejabat),
      updatedAt: new Date().toISOString()
    };

    await onSaveMasterSatker(updated);
    setIsPejabatModalOpen(false);
    setSelectedSatkerForPejabat(null);
    triggerToast(`Data Pejabat & Kontak Satker ${updated.namaSatker} (${updated.kodeSatker}) berhasil disimpan!`);
  };

  // Bulk Apply Default Passwords ([KodeSatker]_[KodeBA]) for All Satkers
  const handleBulkSetDefaultPasswords = () => {
    setConfirmModal({
      title: 'Terapkan Password Default Massal ([KodeSatker]_[KodeBA])?',
      message: `Tindakan ini akan menyetel / mereset password untuk seluruh ${masterSatkers.length} Satker ke format standar resmi KPPN: [KodeSatker]_[KodeBA] (Contoh: 890594_018). Satker hanya dapat mengedit datanya sendiri dengan memasukkan password ini.`,
      confirmText: `Ya, Terapkan ke ${masterSatkers.length} Satker`,
      cancelText: 'Batal',
      type: 'warning',
      onConfirm: () => {
        const updatedList = masterSatkers.map(m => ({
          ...m,
          passwordSatker: getSatkerDefaultPassword(m),
          updatedAt: new Date().toISOString()
        }));

        onUpdateMasterSatkers(updatedList);
        triggerToast(`Password default [KodeSatker]_[KodeBA] berhasil diterapkan untuk seluruh ${updatedList.length} Satker.`);
      }
    });
  };

  // Export Satker Credentials & Contacts to Excel
  const handleExportAccountsToExcel = () => {
    const exportData = masterSatkers.map((m, idx) => {
      const p = m.pejabatOperator || {};
      const defaultPw = getSatkerDefaultPassword(m);

      return {
        'No': idx + 1,
        'Kode Satker': m.kodeSatker,
        'Nama Satker': m.namaSatker,
        'Kementerian / Lembaga': m.kementerianLembaga || '-',
        'Kode BA': m.kodeBa || resolveKodeBA(m),
        'Status Satker': m.isActive ? 'AKTIF' : 'NONAKTIF',
        'Password Akses Satker': m.passwordSatker || defaultPw,
        'KPA (Nama)': p.kpa?.nama || '-',
        'KPA (No HP)': p.kpa?.noHp || '-',
        'PPK (Nama)': p.ppk?.nama || '-',
        'PPK (No HP)': p.ppk?.noHp || '-',
        'PPSPM (Nama)': p.ppspm?.nama || '-',
        'PPSPM (No HP)': p.ppspm?.noHp || '-',
        'Bendahara Pengeluaran (Nama)': p.bendahara?.nama || '-',
        'Bendahara Pengeluaran (No HP)': p.bendahara?.noHp || '-',
        'Operator Pembayaran (Nama)': p.operatorPembayaran?.nama || '-',
        'Operator Pembayaran (No HP)': p.operatorPembayaran?.noHp || '-',
        'Operator Komitmen (Nama)': p.operatorKomitmen?.nama || '-',
        'Operator Komitmen (No HP)': p.operatorKomitmen?.noHp || '-',
        'Operator Gaji (Nama)': p.operatorGaji?.nama || '-',
        'Operator Gaji (No HP)': p.operatorGaji?.noHp || '-',
        'Operator Pelaporan (Nama)': p.operatorPelaporan?.nama || '-',
        'Operator Pelaporan (No HP)': p.operatorPelaporan?.noHp || '-',
        'Email PIC': m.emailPic || '-',
        'Alamat': m.alamatSatker || '-'
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    ws['!cols'] = [
      { wch: 5 }, { wch: 14 }, { wch: 40 }, { wch: 30 }, { wch: 10 }, { wch: 12 }, { wch: 22 },
      { wch: 25 }, { wch: 16 }, { wch: 25 }, { wch: 16 }, { wch: 25 }, { wch: 16 }, { wch: 25 }, { wch: 16 },
      { wch: 25 }, { wch: 16 }, { wch: 25 }, { wch: 16 }, { wch: 25 }, { wch: 16 }, { wch: 25 }, { wch: 16 },
      { wch: 25 }, { wch: 35 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Akun_dan_Kontak_Satker');
    XLSX.writeFile(wb, `Daftar_Akun_Password_Kontak_Satker_KPPN026_${new Date().toISOString().slice(0, 10)}.xlsx`);
    triggerToast('Excel Daftar Akun & Password Satker berhasil diunduh.');
  };

  // Open Full Add / Edit Master Satker
  const handleOpenAdd = () => {
    setEditingSatker(null);
    setFormData({
      kodeSatker: '',
      namaSatker: '',
      isActive: true,
      kodeBa: '018',
      kementerianLembaga: '',
      unitEselon1: '',
      namaPic: '',
      noHpPic: '',
      emailPic: '',
      alamatSatker: '',
      passwordSatker: '',
      catatan: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditMaster = (satker: MasterSatker) => {
    setEditingSatker(satker);
    setFormData({
      id: satker.id,
      kodeSatker: satker.kodeSatker,
      namaSatker: satker.namaSatker,
      isActive: satker.isActive ?? true,
      kodeBa: satker.kodeBa || '018',
      kementerianLembaga: satker.kementerianLembaga || '',
      unitEselon1: satker.unitEselon1 || '',
      namaPic: satker.namaPic || '',
      noHpPic: satker.noHpPic || '',
      emailPic: satker.emailPic || '',
      alamatSatker: satker.alamatSatker || '',
      passwordSatker: satker.passwordSatker || getSatkerDefaultPassword(satker),
      catatan: satker.catatan || ''
    });
    setIsModalOpen(true);
  };

  const handleSaveFullForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.kodeSatker || !formData.namaSatker) {
      alert('Kode Satker dan Nama Satker wajib diisi!');
      return;
    }

    const cleanKode = formData.kodeSatker.trim();
    const payload: MasterSatker = {
      id: editingSatker ? editingSatker.id : `satker-${cleanKode}-${Date.now()}`,
      kodeSatker: cleanKode,
      namaSatker: formData.namaSatker.trim(),
      isActive: formData.isActive ?? true,
      kodeBa: formData.kodeBa?.trim() || '018',
      kementerianLembaga: formData.kementerianLembaga?.trim() || 'Kementerian / Lembaga Mitra',
      unitEselon1: formData.unitEselon1?.trim() || '',
      namaPic: formData.namaPic?.trim() || undefined,
      noHpPic: formData.noHpPic?.trim() || undefined,
      emailPic: formData.emailPic?.trim() || undefined,
      alamatSatker: formData.alamatSatker?.trim() || undefined,
      passwordSatker: formData.passwordSatker?.trim() || `${cleanKode}_${formData.kodeBa?.trim() || '018'}`,
      catatan: formData.catatan?.trim() || undefined,
      pejabatOperator: editingSatker?.pejabatOperator,
      updatedAt: new Date().toISOString(),
      createdAt: editingSatker?.createdAt || new Date().toISOString()
    };

    await onSaveMasterSatker(payload);
    setIsModalOpen(false);
    setEditingSatker(null);
    triggerToast(`Data Satker ${payload.namaSatker} (${payload.kodeSatker}) berhasil disimpan!`);
  };

  // Upload Excel Master Satker
  const handleMasterFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

        if (jsonData.length < 2) throw new Error('File Excel tidak memiliki baris data.');

        let headerRowIdx = 0;
        let colKode = -1;
        let colNama = -1;
        let colStatus = -1;
        let colBA = -1;
        let colKL = -1;

        for (let r = 0; r < Math.min(10, jsonData.length); r++) {
          const row = jsonData[r];
          if (!row) continue;
          row.forEach((cell: any, cIdx: number) => {
            const str = String(cell || '').toLowerCase().trim();
            if (str.includes('kode') && str.includes('satker')) colKode = cIdx;
            if (str.includes('nama') && str.includes('satker')) colNama = cIdx;
            if (str.includes('status') || str.includes('aktif')) colStatus = cIdx;
            if (str.includes('kode ba') || str.includes('ba')) colBA = cIdx;
            if (str.includes('kementerian') || str.includes('lembaga')) colKL = cIdx;
          });
          if (colKode !== -1 && colNama !== -1) {
            headerRowIdx = r;
            break;
          }
        }

        const newMasterMap = new Map<string, MasterSatker>();
        masterSatkers.forEach(m => newMasterMap.set(m.kodeSatker, { ...m }));

        let addedCount = 0;
        let updatedCount = 0;

        for (let r = headerRowIdx + 1; r < jsonData.length; r++) {
          const row = jsonData[r];
          if (!row || !row[colKode]) continue;

          const rawKode = String(row[colKode]).trim().replace(/\D/g, '');
          if (!rawKode || rawKode.length < 5) continue;
          const kodeSatker = rawKode.padStart(6, '0');

          const namaSatker = row[colNama] ? String(row[colNama]).trim() : `Satker ${kodeSatker}`;
          const rawStatus = colStatus !== -1 && row[colStatus] !== undefined ? String(row[colStatus]).trim().toUpperCase() : 'AKTIF';
          const isActive = !rawStatus.includes('NON') && !rawStatus.includes('TIDAK') && !rawStatus.includes('PASIF');
          const kodeBa = colBA !== -1 && row[colBA] ? String(row[colBA]).trim().padStart(3, '0') : '018';
          const kementerianLembaga = colKL !== -1 && row[colKL] ? String(row[colKL]).trim() : 'Kementerian / Lembaga Mitra';

          const existing = newMasterMap.get(kodeSatker);
          if (existing) {
            newMasterMap.set(kodeSatker, {
              ...existing,
              namaSatker: namaSatker || existing.namaSatker,
              isActive: isActive,
              kodeBa: kodeBa || existing.kodeBa,
              kementerianLembaga: kementerianLembaga || existing.kementerianLembaga,
              passwordSatker: existing.passwordSatker || `${kodeSatker}_${kodeBa}`,
              updatedAt: new Date().toISOString()
            });
            updatedCount++;
          } else {
            newMasterMap.set(kodeSatker, {
              id: `master-${kodeSatker}-${Date.now()}-${r}`,
              kodeSatker,
              namaSatker,
              isActive,
              kodeBa,
              kementerianLembaga,
              passwordSatker: `${kodeSatker}_${kodeBa}`,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
            addedCount++;
          }
        }

        const resultList = Array.from(newMasterMap.values());
        onUpdateMasterSatkers(resultList);
        setUploadFeedback({
          type: 'success',
          message: `Berhasil memproses Excel Master Satker! ${addedCount} Satker baru ditambahkan, ${updatedCount} Satker diperbarui. Total Master: ${resultList.length} Satker.`
        });
        triggerToast(`Master Satker berhasil diperbarui (${addedCount + updatedCount} baris).`);
      } catch (err: any) {
        setUploadFeedback({
          type: 'error',
          message: `Gagal memproses file Excel: ${err.message || 'Format tidak sesuai.'}`
        });
      } finally {
        setIsProcessingFile(false);
        if (masterFileInputRef.current) masterFileInputRef.current.value = '';
      }
    };

    reader.readAsBinaryString(file);
  };

  // Upload Excel Batch Kontak Pejabat & Operator (Safe merge - never deletes or blanks existing data)
  const handlePhoneContactsUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

        if (jsonData.length < 2) throw new Error('File Excel tidak memiliki baris data kontak.');

        // Find header row and column indexes
        let headerRowIdx = 0;
        let colKode = -1;
        let colNamaSatker = -1;
        let colKpaNama = -1, colKpaHp = -1;
        let colPpkNama = -1, colPpkHp = -1;
        let colPpspmNama = -1, colPpspmHp = -1;
        let colBendaharaNama = -1, colBendaharaHp = -1;
        let colOpBayarNama = -1, colOpBayarHp = -1;
        let colOpKomitmenNama = -1, colOpKomitmenHp = -1;
        let colOpGajiNama = -1, colOpGajiHp = -1;
        let colOpLaporNama = -1, colOpLaporHp = -1;
        let colPicNama = -1, colPicHp = -1, colPicEmail = -1, colAlamat = -1;

        for (let r = 0; r < Math.min(10, jsonData.length); r++) {
          const row = jsonData[r];
          if (!row) continue;
          row.forEach((cell: any, cIdx: number) => {
            const str = String(cell || '').toLowerCase().trim();
            if (str.includes('kode') && str.includes('satker')) colKode = cIdx;
            else if (str === 'kode' || str === 'kdsatker' || str === 'kode_satker') colKode = cIdx;
            if (str.includes('nama') && str.includes('satker')) colNamaSatker = cIdx;
            
            // KPA
            if (str.includes('kpa') && (str.includes('hp') || str.includes('wa') || str.includes('telp') || str.includes('kontak') || str.includes('nomor') || str.includes('phone'))) colKpaHp = cIdx;
            else if (str.includes('kpa') && (str.includes('nama') || str.includes('pejabat'))) colKpaNama = cIdx;
            else if (str === 'kpa' || str.includes('kuasa pengguna')) colKpaNama = cIdx;

            // PPK
            if (str.includes('ppk') && (str.includes('hp') || str.includes('wa') || str.includes('telp') || str.includes('kontak') || str.includes('nomor') || str.includes('phone'))) colPpkHp = cIdx;
            else if (str.includes('ppk') && (str.includes('nama') || str.includes('pejabat'))) colPpkNama = cIdx;
            else if (str === 'ppk' || str.includes('komitmen')) colPpkNama = cIdx;

            // PPSPM
            if (str.includes('ppspm') && (str.includes('hp') || str.includes('wa') || str.includes('telp') || str.includes('kontak') || str.includes('nomor') || str.includes('phone'))) colPpspmHp = cIdx;
            else if (str.includes('ppspm') && (str.includes('nama') || str.includes('pejabat'))) colPpspmNama = cIdx;
            else if (str === 'ppspm' || str.includes('penguji')) colPpspmNama = cIdx;

            // Bendahara
            if ((str.includes('bendahara') || str.includes('bpp')) && (str.includes('hp') || str.includes('wa') || str.includes('telp') || str.includes('kontak') || str.includes('nomor') || str.includes('phone'))) colBendaharaHp = cIdx;
            else if ((str.includes('bendahara') || str.includes('bpp')) && (str.includes('nama') || str.includes('pejabat'))) colBendaharaNama = cIdx;
            else if (str.includes('bendahara')) colBendaharaNama = cIdx;

            // Op Pembayaran
            if ((str.includes('bayar') || str.includes('pembayaran') || str.includes('spp')) && (str.includes('hp') || str.includes('wa') || str.includes('telp') || str.includes('kontak') || str.includes('phone'))) colOpBayarHp = cIdx;
            else if (str.includes('bayar') || str.includes('pembayaran')) colOpBayarNama = cIdx;

            // Op Komitmen
            if ((str.includes('komitmen') || str.includes('kontrak')) && (str.includes('hp') || str.includes('wa') || str.includes('telp') || str.includes('kontak') || str.includes('phone'))) colOpKomitmenHp = cIdx;
            else if (str.includes('komitmen') || str.includes('kontrak')) colOpKomitmenNama = cIdx;

            // Op Gaji
            if ((str.includes('gaji') || str.includes('ppn') || str.includes('tukin')) && (str.includes('hp') || str.includes('wa') || str.includes('telp') || str.includes('kontak') || str.includes('phone'))) colOpGajiHp = cIdx;
            else if (str.includes('gaji')) colOpGajiNama = cIdx;

            // Op Pelaporan / Caput
            if ((str.includes('lapor') || str.includes('pelaporan') || str.includes('caput') || str.includes('akuntansi')) && (str.includes('hp') || str.includes('wa') || str.includes('telp') || str.includes('kontak') || str.includes('phone'))) colOpLaporHp = cIdx;
            else if (str.includes('lapor') || str.includes('pelaporan') || str.includes('caput')) colOpLaporNama = cIdx;

            // General PIC / HP
            if ((str.includes('pic') || str.includes('kontak') || str.includes('whatsapp') || str.includes('no hp') || str.includes('nohp') || str.includes('telepon')) && !str.includes('kpa') && !str.includes('ppk') && !str.includes('ppspm') && !str.includes('bendahara')) {
              if (str.includes('nama')) colPicNama = cIdx;
              else colPicHp = cIdx;
            }
            if (str.includes('email')) colPicEmail = cIdx;
            if (str.includes('alamat')) colAlamat = cIdx;
          });

          if (colKode !== -1) {
            headerRowIdx = r;
            break;
          }
        }

        if (colKode === -1) {
          throw new Error('Kolom "Kode Satker" tidak ditemukan dalam file Excel.');
        }

        const cleanHp = (hp?: any) => {
          if (!hp) return undefined;
          let str = String(hp).trim().replace(/\s+/g, '').replace(/[-_.]/g, '');
          if (str.startsWith('+62')) str = '0' + str.substring(3);
          else if (str.startsWith('62') && str.length > 8) str = '0' + str.substring(2);
          return str.length >= 8 ? str : undefined;
        };

        const newMasterMap = new Map<string, MasterSatker>();
        masterSatkers.forEach(m => newMasterMap.set(m.kodeSatker, { ...m }));

        let updatedCount = 0;

        for (let r = headerRowIdx + 1; r < jsonData.length; r++) {
          const row = jsonData[r];
          if (!row || !row[colKode]) continue;

          const rawKode = String(row[colKode]).trim().replace(/\D/g, '');
          if (!rawKode || rawKode.length < 5) continue;
          const kodeSatker = rawKode.padStart(6, '0');

          const existing = newMasterMap.get(kodeSatker);
          if (!existing) continue;

          const existingPo = existing.pejabatOperator || {};

          const valKpaNama = colKpaNama !== -1 && row[colKpaNama] ? String(row[colKpaNama]).trim() : undefined;
          const valKpaHp = colKpaHp !== -1 ? cleanHp(row[colKpaHp]) : undefined;

          const valPpkNama = colPpkNama !== -1 && row[colPpkNama] ? String(row[colPpkNama]).trim() : undefined;
          const valPpkHp = colPpkHp !== -1 ? cleanHp(row[colPpkHp]) : undefined;

          const valPpspmNama = colPpspmNama !== -1 && row[colPpspmNama] ? String(row[colPpspmNama]).trim() : undefined;
          const valPpspmHp = colPpspmHp !== -1 ? cleanHp(row[colPpspmHp]) : undefined;

          const valBendaharaNama = colBendaharaNama !== -1 && row[colBendaharaNama] ? String(row[colBendaharaNama]).trim() : undefined;
          const valBendaharaHp = colBendaharaHp !== -1 ? cleanHp(row[colBendaharaHp]) : undefined;

          const valOpBayarNama = colOpBayarNama !== -1 && row[colOpBayarNama] ? String(row[colOpBayarNama]).trim() : undefined;
          const valOpBayarHp = colOpBayarHp !== -1 ? cleanHp(row[colOpBayarHp]) : undefined;

          const valOpKomitmenNama = colOpKomitmenNama !== -1 && row[colOpKomitmenNama] ? String(row[colOpKomitmenNama]).trim() : undefined;
          const valOpKomitmenHp = colOpKomitmenHp !== -1 ? cleanHp(row[colOpKomitmenHp]) : undefined;

          const valOpGajiNama = colOpGajiNama !== -1 && row[colOpGajiNama] ? String(row[colOpGajiNama]).trim() : undefined;
          const valOpGajiHp = colOpGajiHp !== -1 ? cleanHp(row[colOpGajiHp]) : undefined;

          const valOpLaporNama = colOpLaporNama !== -1 && row[colOpLaporNama] ? String(row[colOpLaporNama]).trim() : undefined;
          const valOpLaporHp = colOpLaporHp !== -1 ? cleanHp(row[colOpLaporHp]) : undefined;

          const valPicNama = colPicNama !== -1 && row[colPicNama] ? String(row[colPicNama]).trim() : undefined;
          const valPicHp = colPicHp !== -1 ? cleanHp(row[colPicHp]) : undefined;
          const valPicEmail = colPicEmail !== -1 && row[colPicEmail] ? String(row[colPicEmail]).trim() : undefined;
          const valAlamat = colAlamat !== -1 && row[colAlamat] ? String(row[colAlamat]).trim() : undefined;

          const mergedPo: PejabatDanOperator = {
            kpa: {
              nama: valKpaNama || existingPo.kpa?.nama || '',
              noHp: valKpaHp || existingPo.kpa?.noHp || undefined,
              nip: existingPo.kpa?.nip,
              email: existingPo.kpa?.email
            },
            ppk: {
              nama: valPpkNama || existingPo.ppk?.nama || '',
              noHp: valPpkHp || existingPo.ppk?.noHp || undefined,
              nip: existingPo.ppk?.nip,
              email: existingPo.ppk?.email
            },
            ppspm: {
              nama: valPpspmNama || existingPo.ppspm?.nama || '',
              noHp: valPpspmHp || existingPo.ppspm?.noHp || undefined,
              nip: existingPo.ppspm?.nip,
              email: existingPo.ppspm?.email
            },
            bendahara: {
              nama: valBendaharaNama || existingPo.bendahara?.nama || '',
              noHp: valBendaharaHp || existingPo.bendahara?.noHp || undefined,
              nip: existingPo.bendahara?.nip,
              email: existingPo.bendahara?.email
            },
            operatorPembayaran: {
              nama: valOpBayarNama || existingPo.operatorPembayaran?.nama || '',
              noHp: valOpBayarHp || existingPo.operatorPembayaran?.noHp || undefined,
              nip: existingPo.operatorPembayaran?.nip,
              email: existingPo.operatorPembayaran?.email
            },
            operatorKomitmen: {
              nama: valOpKomitmenNama || existingPo.operatorKomitmen?.nama || '',
              noHp: valOpKomitmenHp || existingPo.operatorKomitmen?.noHp || undefined,
              nip: existingPo.operatorKomitmen?.nip,
              email: existingPo.operatorKomitmen?.email
            },
            operatorGaji: {
              nama: valOpGajiNama || existingPo.operatorGaji?.nama || '',
              noHp: valOpGajiHp || existingPo.operatorGaji?.noHp || undefined,
              nip: existingPo.operatorGaji?.nip,
              email: existingPo.operatorGaji?.email
            },
            operatorPelaporan: {
              nama: valOpLaporNama || existingPo.operatorPelaporan?.nama || '',
              noHp: valOpLaporHp || existingPo.operatorPelaporan?.noHp || undefined,
              nip: existingPo.operatorPelaporan?.nip,
              email: existingPo.operatorPelaporan?.email
            }
          };

          const primaryPhone =
            valPicHp ||
            existing.noHpPic ||
            mergedPo.operatorPembayaran?.noHp ||
            mergedPo.bendahara?.noHp ||
            mergedPo.ppk?.noHp ||
            mergedPo.kpa?.noHp;

          const primaryName =
            valPicNama ||
            existing.namaPic ||
            mergedPo.operatorPembayaran?.nama ||
            mergedPo.bendahara?.nama ||
            mergedPo.ppk?.nama ||
            mergedPo.kpa?.nama;

          newMasterMap.set(kodeSatker, {
            ...existing,
            pejabatOperator: mergedPo,
            namaPic: primaryName || existing.namaPic,
            noHpPic: primaryPhone || existing.noHpPic,
            emailPic: valPicEmail || existing.emailPic,
            alamatSatker: valAlamat || existing.alamatSatker,
            updatedAt: new Date().toISOString()
          });

          updatedCount++;
        }

        const resultList = Array.from(newMasterMap.values());
        onUpdateMasterSatkers(resultList);
        setUploadFeedback({
          type: 'success',
          message: `Berhasil memutakhirkan kontak pejabat & operator untuk ${updatedCount} Satker. Data yang sudah ada tetap aman dan tidak terhapus!`
        });
        triggerToast(`Kontak ${updatedCount} Satker berhasil dimutakhirkan secara aman.`);
      } catch (err: any) {
        setUploadFeedback({
          type: 'error',
          message: `Gagal memproses batch kontak: ${err.message || 'Format tidak sesuai.'}`
        });
      } finally {
        setIsProcessingFile(false);
        if (phoneFileInputRef.current) phoneFileInputRef.current.value = '';
      }
    };

    reader.readAsBinaryString(file);
  };

  // Batch Toggle Status
  const handleBatchToggleStatus = (targetActive: boolean) => {
    if (selectedIds.length === 0) return;
    const updated = masterSatkers.map(m =>
      selectedIds.includes(m.id) ? { ...m, isActive: targetActive, updatedAt: new Date().toISOString() } : m
    );
    onUpdateMasterSatkers(updated);
    setSelectedIds([]);
    triggerToast(`${selectedIds.length} Satker diubah statusnya menjadi ${targetActive ? 'AKTIF' : 'NONAKTIF'}.`);
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredSatkers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredSatkers.map(m => m.id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Modern Confirmation Modal */}
      {confirmModal && (
        <ModernConfirmModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmText={confirmModal.confirmText}
          cancelText={confirmModal.cancelText}
          variant={confirmModal.variant}
          iconType={confirmModal.iconType}
          onConfirm={() => {
            confirmModal.onConfirm();
            setConfirmModal(null);
          }}
          onCancel={() => setConfirmModal(null)}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div
          className="fixed top-5 right-5 z-50 bg-emerald-600 text-white font-bold text-xs px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-emerald-400 animate-in fade-in duration-200"
        >
          <CheckCircle2 className="w-4 h-4 text-white" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={masterFileInputRef}
        onChange={handleMasterFileUpload}
        accept=".xlsx, .xls, .csv"
        className="hidden"
      />
      <input
        type="file"
        ref={phoneFileInputRef}
        onChange={handlePhoneContactsUpload}
        accept=".xlsx, .xls, .csv"
        className="hidden"
      />

      {/* Top Banner & Header */}
      <div className="bg-gradient-to-br from-slate-900 via-sky-950 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-2xl border border-sky-500/30 relative overflow-hidden space-y-6">
        <div className="absolute right-0 top-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Title & Description Row */}
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 bg-sky-500/20 border border-sky-400/40 text-sky-200 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-xs">
            <Building2 className="w-3.5 h-3.5 text-sky-400" />
            <span>{isAdminAuthenticated ? 'ADMIN KELOLA DATA SATKER & PENGATURAN PASSWORD' : 'PORTAL PESERTA SATKER & PEMUTAKHIRAN DATA KONTAK'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
            Kelola Data Satker, Kontak Pejabat &amp; Operator SAKTI
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-4xl">
            Satker dapat mengisi Nama &amp; Nomor WhatsApp untuk <strong>8 Pejabat/Operator</strong> (KPA, PPK, PPSPM, Bendahara Pengeluaran, Op. Pembayaran, Op. Komitmen, Op. Gaji, dan Op. Pelaporan). 
            Akses dilindungi oleh <strong>Password Satker</strong> untuk memastikan data Anda aman dan tidak dapat diubah oleh satker lain.
          </p>
        </div>

        {/* Action Buttons Toolbar Bar */}
        <div className="relative z-10 pt-4 border-t border-sky-500/20 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs font-semibold text-sky-200/80 flex items-center gap-2">
            <Shield className="w-4 h-4 text-sky-400" />
            <span>Total <strong>{totalMaster}</strong> Satker terdaftar dalam sistem</span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {isAdminAuthenticated ? (
              <>
                {/* Setting Password All Button (Admin) */}
                <button
                  type="button"
                  onClick={handleBulkSetDefaultPasswords}
                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-amber-400/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95 border border-amber-300"
                  title="Setel atau reset password default ([KodeSatker]) untuk seluruh Satker mitra"
                >
                  <KeyRound className="w-4 h-4 text-slate-950" />
                  <span>Setting Password All</span>
                </button>

                {/* Export Credentials & Contacts (Admin) */}
                <button
                  type="button"
                  onClick={handleExportAccountsToExcel}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
                  title="Download Excel berisi daftar username, password, dan kontak lengkap pejabat seluruh Satker"
                >
                  <FileDown className="w-4 h-4 text-slate-300" />
                  <span>Export Akun &amp; Password (.xlsx)</span>
                </button>

                {/* Tambah Satker Baru (Admin) */}
                <button
                  type="button"
                  onClick={handleOpenAdd}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-3.5 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Satker Baru</span>
                </button>

                <button
                  type="button"
                  onClick={() => masterFileInputRef.current?.click()}
                  disabled={isProcessingFile}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-md border border-indigo-400/30 transition-all flex items-center gap-2 cursor-pointer"
                  title="Upload file referensi resmi Master Satker Excel"
                >
                  <Upload className="w-4 h-4 text-indigo-200" />
                  <span>Upload Master Satker</span>
                </button>

                <button
                  type="button"
                  onClick={() => phoneFileInputRef.current?.click()}
                  disabled={isProcessingFile}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-md border border-emerald-400/30 transition-all flex items-center gap-2 cursor-pointer"
                  title="Upload batch kontak HP pejabat & operator dari Excel (penggabungan aman tanpa hapus data lama)"
                >
                  <Phone className="w-4 h-4 text-emerald-200" />
                  <span>Upload Batch Kontak</span>
                </button>

                {/* Proteksi Data Anti-Hapus */}
                <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 text-xs font-bold shadow-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Data Aman: Anti-Hapus &amp; Hanya Update</span>
                </div>
              </>
            ) : (
              <button
                type="button"
                onClick={handleExportAccountsToExcel}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
                title="Download Excel rekap daftar kontak resmi seluruh Satker"
              >
                <Download className="w-4 h-4 text-slate-300" />
                <span>Unduh Rekap Kontak Satker (.xlsx)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Upload Feedback */}
      {uploadFeedback && (
        <div className={`p-4 rounded-2xl border text-xs flex items-center justify-between gap-3 ${
          uploadFeedback.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
            : 'bg-rose-50 dark:bg-rose-950/80 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {uploadFeedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
            <span className="font-semibold">{uploadFeedback.message}</span>
          </div>
          <button onClick={() => setUploadFeedback(null)} className="text-xs font-bold underline cursor-pointer">
            Tutup
          </button>
        </div>
      )}

      {/* 4 Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`p-5 rounded-2xl border transition-all ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Mitra Satker
            </span>
            <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-slate-100">
              {totalMaster}
            </span>
            <span className="text-xs font-medium text-slate-500">Satuan Kerja</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Terhubung di KPPN Semarang I (026)
          </p>
        </div>

        <div className={`p-5 rounded-2xl border transition-all ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Satker Aktif
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {totalAktif}
            </span>
            <span className="text-xs font-medium text-slate-500">Satker aktif</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {totalNonaktif} Satker nonaktif disembunyikan
          </p>
        </div>

        <div className={`p-5 rounded-2xl border transition-all ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              Kontak Pejabat Lengkap
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
              {totalLengkap}
            </span>
            <span className="text-xs font-medium text-slate-500">
              ({totalMaster > 0 ? Math.round((totalLengkap / totalMaster) * 100) : 0}%)
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Minimal 4 pejabat &amp; operator telah terisi
          </p>
        </div>

        <div className={`p-5 rounded-2xl border transition-all ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Belum Lengkap Diisi
            </span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-600 dark:text-amber-400">
              {totalBelumLengkap}
            </span>
            <button
              onClick={() => setFilterStatus('BELUM_LENGKAP')}
              className="text-[11px] font-extrabold text-amber-600 hover:underline cursor-pointer ml-2"
            >
              Filter &amp; Isi &rarr;
            </button>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Klik Satker untuk memasukkan password &amp; melengkapi kontak
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className={`p-4 sm:p-5 rounded-3xl border shadow-xs space-y-4 ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari Kode Satker, Nama Satker, Nama KPA / PPK / PPSPM / Bendahara..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className={`w-full text-xs rounded-2xl pl-10 pr-4 py-3 border focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all ${
                isDark ? 'bg-slate-950 text-slate-100 border-slate-800' : 'bg-slate-50 text-slate-900 border-slate-300'
              }`}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setFilterStatus('ALL');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterStatus === 'ALL'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              Semua ({totalMaster})
            </button>

            <button
              type="button"
              onClick={() => {
                setFilterStatus('LENGKAP');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterStatus === 'LENGKAP'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
              }`}
            >
              Kontak Lengkap ({totalLengkap})
            </button>

            <button
              type="button"
              onClick={() => {
                setFilterStatus('BELUM_LENGKAP');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterStatus === 'BELUM_LENGKAP'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
              }`}
            >
              Belum Lengkap ({totalBelumLengkap})
            </button>
          </div>
        </div>

        {/* Second Filter Row: K/L & Batch Action */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-semibold">Filter K/L:</span>
            <select
              value={filterKL}
              onChange={(e) => {
                setFilterKL(e.target.value);
                setCurrentPage(1);
              }}
              className={`text-xs rounded-xl px-3 py-1.5 border focus:outline-none focus:ring-1 focus:ring-sky-500 ${
                isDark ? 'bg-slate-950 text-slate-200 border-slate-800' : 'bg-slate-50 text-slate-800 border-slate-300'
              }`}
            >
              <option value="ALL">Semua Kementerian / Lembaga ({klOptions.length} K/L)</option>
              {klOptions.map(kl => (
                <option key={kl} value={kl}>{kl}</option>
              ))}
            </select>
          </div>

          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 bg-sky-50 dark:bg-sky-950/80 p-1.5 rounded-xl border border-sky-200 dark:border-sky-800">
              <span className="text-[11px] font-bold text-sky-800 dark:text-sky-200 px-2">
                {selectedIds.length} Satker dipilih:
              </span>
              <button
                type="button"
                onClick={() => handleBatchToggleStatus(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] px-2.5 py-1 rounded-lg transition-all"
              >
                Set Aktif
              </button>
              <button
                type="button"
                onClick={() => handleBatchToggleStatus(false)}
                className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] px-2.5 py-1 rounded-lg transition-all"
              >
                Set Nonaktif
              </button>
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="text-slate-500 hover:text-slate-700 text-[11px] font-bold px-1 cursor-pointer"
              >
                Batal
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Master Satkers Table */}
      <div className={`rounded-3xl border overflow-hidden shadow-xl ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-sky-500" />
              <span>Daftar Master Satker &amp; Status Pengisian Kontak Pejabat ({filteredSatkers.length} Satker)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Klik tombol <strong className="text-sky-600 dark:text-sky-400">Isi / Kelola Kontak Pejabat</strong> untuk mengisi data KPA, PPK, PPSPM, Bendahara, dan 4 Operator Satker.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectAll}
              className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
            >
              {selectedIds.length === filteredSatkers.length ? 'Batalkan Pilih Semua' : 'Pilih Semua Satker'}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className={`border-b text-[11px] font-black uppercase tracking-wider ${
                isDark ? 'bg-slate-950/80 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}>
                {isAdminAuthenticated && (
                  <th className="py-3.5 px-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={filteredSatkers.length > 0 && selectedIds.length === filteredSatkers.length}
                      onChange={handleSelectAll}
                      className="rounded border-slate-300 text-sky-600 cursor-pointer"
                    />
                  </th>
                )}
                <th className="py-3.5 px-4">Kode Satker</th>
                <th className="py-3.5 px-4 min-w-[200px]">Nama Satker &amp; K/L</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 min-w-[280px]">Rincian Kontak 8 Pejabat &amp; Operator</th>
                <th className="py-3.5 px-4 text-center">Password Satker</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredSatkers.length === 0 ? (
                <tr>
                  <td colSpan={isAdminAuthenticated ? 7 : 6} className="py-16 text-center text-slate-400">
                    <Building2 className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                    <p className="font-bold text-sm">Tidak ada Satker yang sesuai kriteria pencarian</p>
                    <p className="text-xs mt-1">Coba ubah kata kunci atau reset filter.</p>
                  </td>
                </tr>
              ) : (
                paginatedSatkers.map((satker) => {
                  const isSelected = selectedIds.includes(satker.id);
                  const po = satker.pejabatOperator || {};
                  const filledCount = getFilledRolesCount(satker);
                  const defaultPw = getSatkerDefaultPassword(satker);

                  return (
                    <tr
                      key={satker.id}
                      className={`transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/50 ${
                        isSelected
                          ? 'bg-sky-50/60 dark:bg-sky-950/40'
                          : !satker.isActive
                          ? 'opacity-60 bg-slate-50/30 dark:bg-slate-950/30'
                          : ''
                      }`}
                    >
                      {/* Checkbox (Admin Only) */}
                      {isAdminAuthenticated && (
                        <td className="py-3.5 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              setSelectedIds(prev =>
                                prev.includes(satker.id) ? prev.filter(x => x !== satker.id) : [...prev, satker.id]
                              );
                            }}
                            className="rounded border-slate-300 text-sky-600 cursor-pointer"
                          />
                        </td>
                      )}

                      {/* Kode Satker */}
                      <td className="py-3.5 px-4 font-mono font-black text-sky-600 dark:text-sky-400 text-sm whitespace-nowrap">
                        {satker.kodeSatker}
                      </td>

                      {/* Nama Satker & K/L */}
                      <td className="py-3.5 px-4 min-w-[200px]">
                        <div className="font-extrabold text-slate-900 dark:text-slate-100 text-xs">
                          {satker.namaSatker}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                          {satker.kementerianLembaga || 'Kementerian / Lembaga Mitra'}
                        </div>
                      </td>

                      {/* Status Aktif / Nonaktif */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {isAdminAuthenticated ? (
                          <button
                            type="button"
                            onClick={() => onToggleActiveMasterSatker(satker.id)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black border transition-all cursor-pointer ${
                              satker.isActive
                                ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                                : 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                            }`}
                            title="Klik untuk mengubah status aktif / nonaktif Satker (Admin)"
                          >
                            {satker.isActive ? (
                              <>
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span>AKTIF</span>
                              </>
                            ) : (
                              <>
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                <span>NONAKTIF</span>
                              </>
                            )}
                          </button>
                        ) : (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                            satker.isActive
                              ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                              : 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${satker.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            <span>{satker.isActive ? 'AKTIF' : 'NONAKTIF'}</span>
                          </span>
                        )}
                      </td>

                      {/* Rincian Kontak 8 Pejabat & Operator */}
                      <td className="py-3.5 px-4 min-w-[280px]">
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-1">
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                              filledCount >= 4 
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                                : filledCount > 0 
                                ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}>
                              {filledCount}/8 Posisi Terisi
                            </span>

                            {po.kpa?.nama && <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded font-semibold">KPA ✓</span>}
                            {po.ppk?.nama && <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded font-semibold">PPK ✓</span>}
                            {po.ppspm?.nama && <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded font-semibold">PPSPM ✓</span>}
                            {po.bendahara?.nama && <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded font-semibold">Bendahara ✓</span>}
                          </div>

                          {satker.noHpPic ? (
                            <div className="flex items-center gap-2">
                              <a
                                href={`https://wa.me/${satker.noHpPic?.replace(/[^0-9]/g, '').replace(/^0/, '62')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 px-2 py-0.5 rounded-md text-[11px] transition-colors"
                              >
                                <Phone className="w-3 h-3" />
                                <span>{satker.noHpPic}</span>
                                <ExternalLink className="w-2.5 h-2.5 ml-0.5 opacity-70" />
                              </a>
                              {satker.namaPic && <span className="text-[11px] text-slate-500 truncate max-w-[120px]">({satker.namaPic})</span>}
                            </div>
                          ) : (
                            <div className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Kontak belum lengkap</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Password Satker Info */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {isAdminAuthenticated ? (
                          <div className="inline-flex items-center gap-1.5">
                            <span className="font-mono text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 font-bold">
                              {satker.passwordSatker || defaultPw}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleOpenQuickPassword(satker)}
                              className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/80 text-amber-700 dark:text-amber-300 transition-colors cursor-pointer"
                              title="Ubah Password Satker ini (Admin)"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                            <Lock className="w-3 h-3 text-amber-500" />
                            <span>Terlindungi</span>
                          </span>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenPejabatModal(satker)}
                            className="bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs px-3 py-1.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                            title="Buka form pengisian kontak KPA, PPK, PPSPM, Bendahara & Operator Satker"
                          >
                            <User className="w-3.5 h-3.5" />
                            <span>Isi / Kelola Kontak</span>
                          </button>

                          {isAdminAuthenticated && (
                            <button
                              type="button"
                              onClick={() => handleOpenEditMaster(satker)}
                              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                              title="Edit Data Master Satker (Admin)"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
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

        {/* Pagination Control */}
        <PaginationControl
          currentPage={currentPage}
          totalItems={filteredSatkers.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemLabel="Satker"
          isDark={isDark}
          className="p-4 border-t border-slate-100 dark:border-slate-800"
        />
      </div>

      {/* MODAL 1: PENGISIAN KONTAK PEJABAT & OPERATOR SATKER (DENGAN GATEKEEPER PASSWORD) */}
      {isPejabatModalOpen && selectedSatkerForPejabat && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
          <div className={`rounded-3xl border shadow-2xl max-w-3xl w-full my-6 overflow-hidden flex flex-col max-h-[92vh] ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            
            {/* Modal Header */}
            <div className="bg-slate-950 text-white p-5 sm:p-6 border-b border-slate-800 flex items-start justify-between relative shrink-0">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="font-mono text-xs bg-amber-400 text-slate-950 font-black px-2.5 py-0.5 rounded-lg shadow-xs">
                    KODE SATKER: {selectedSatkerForPejabat.kodeSatker}
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-black text-white leading-tight">
                  {selectedSatkerForPejabat.namaSatker}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedSatkerForPejabat.kementerianLembaga || 'Kementerian / Lembaga Mitra'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsPejabatModalOpen(false)}
                className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Gatekeeper / Form Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
              
              {/* IF LOCKED: SHOW PASSWORD AUTHENTICATION SCREEN */}
              {!isPasswordUnlocked ? (
                <div className="max-w-md mx-auto py-8 space-y-4">
                  <div className={`p-6 sm:p-8 rounded-3xl border shadow-xl text-center space-y-4 ${
                    isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="w-16 h-16 bg-amber-500/20 border border-amber-500/30 text-amber-500 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                      <Lock className="w-8 h-8" />
                    </div>

                    <div>
                      <span className="inline-block bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 px-3 py-1 rounded-full text-xs font-bold mb-2">
                        AUTENTIKASI KEAMANAN SATKER
                      </span>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white">
                        Masukkan Password Satker
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Untuk menjaga keamanan data dan mencegah satker lain mengubah kontak satker Anda, silakan masukkan password satker ini.
                      </p>
                    </div>

                    <form onSubmit={handleVerifyPassword} className="space-y-3 pt-2 text-left">
                      <div>
                        <label className="text-xs font-extrabold block text-slate-700 dark:text-slate-300 mb-1">
                          Password Satker {selectedSatkerForPejabat.kodeSatker}:
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswordText ? 'text' : 'password'}
                            required
                            placeholder="Masukkan password satker Anda..."
                            value={inputPassword}
                            onChange={(e) => {
                              setInputPassword(e.target.value);
                              setPasswordError(null);
                            }}
                            className={`w-full font-mono text-xs font-bold rounded-xl px-3.5 py-3 border focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                              isDark ? 'bg-slate-950 text-white border-slate-700' : 'bg-white text-slate-900 border-slate-300'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswordText(!showPasswordText)}
                            className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                          >
                            {showPasswordText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {passwordError && (
                        <div className="p-3 bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>{passwordError}</span>
                        </div>
                      )}

                      <button
                        type="submit"
                        className="w-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                      >
                        <Unlock className="w-4 h-4" />
                        <span>Buka &amp; Kelola Kontak Satker</span>
                      </button>
                    </form>
                  </div>
                </div>
              ) : (
                /* IF UNLOCKED: SHOW COMPREHENSIVE 8 ROLES & CONTACT FORM */
                <div className="space-y-6 text-xs">
                  
                  {/* Status Banner */}
                  <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-4 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <div>
                        <span className="font-extrabold text-emerald-900 dark:text-emerald-200 block text-xs">
                          Akses Terbuka &amp; Terverifikasi
                        </span>
                        <span className="text-[11px] text-emerald-700 dark:text-emerald-300">
                          Data kontak ini digunakan oleh KPPN Semarang I untuk koordinasi monev IKPA, pengingat Capaian Output, dan WhatsApp Gateway.
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Section A: 4 Pejabat Utama Perbendaharaan */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                      <Briefcase className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                      <h4 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                        A. Pejabat Perbendaharaan Satker (KPA / PPK / PPSPM / Bendahara)
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* 1. KPA */}
                      <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'} space-y-2.5`}>
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-sky-600 dark:text-sky-400 block text-xs">
                            1. Kuasa Pengguna Anggaran (KPA)
                          </span>
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Nama Lengkap KPA:</label>
                          <input
                            type="text"
                            placeholder="Nama Lengkap KPA"
                            value={pejabatFormData.kpa.nama}
                            onChange={(e) => setPejabatFormData({ ...pejabatFormData, kpa: { ...pejabatFormData.kpa, nama: e.target.value } })}
                            className={`w-full text-xs rounded-xl p-2 border ${isDark ? 'bg-slate-900 text-white border-slate-700' : 'bg-white text-slate-900 border-slate-300'}`}
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Nomor WhatsApp / HP KPA:</label>
                          <input
                            type="text"
                            placeholder="081234567890"
                            value={pejabatFormData.kpa.noHp || ''}
                            onChange={(e) => setPejabatFormData({ ...pejabatFormData, kpa: { ...pejabatFormData.kpa, noHp: e.target.value } })}
                            className={`w-full font-mono text-xs rounded-xl p-2 border ${isDark ? 'bg-slate-900 text-white border-slate-700' : 'bg-white text-slate-900 border-slate-300'}`}
                          />
                        </div>
                      </div>

                      {/* 2. PPK */}
                      <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'} space-y-2.5`}>
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-sky-600 dark:text-sky-400 block text-xs">
                            2. Pejabat Pembuat Komitmen (PPK)
                          </span>
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Nama Lengkap PPK:</label>
                          <input
                            type="text"
                            placeholder="Nama Lengkap PPK"
                            value={pejabatFormData.ppk.nama}
                            onChange={(e) => setPejabatFormData({ ...pejabatFormData, ppk: { ...pejabatFormData.ppk, nama: e.target.value } })}
                            className={`w-full text-xs rounded-xl p-2 border ${isDark ? 'bg-slate-900 text-white border-slate-700' : 'bg-white text-slate-900 border-slate-300'}`}
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Nomor WhatsApp / HP PPK:</label>
                          <input
                            type="text"
                            placeholder="081234567890"
                            value={pejabatFormData.ppk.noHp || ''}
                            onChange={(e) => setPejabatFormData({ ...pejabatFormData, ppk: { ...pejabatFormData.ppk, noHp: e.target.value } })}
                            className={`w-full font-mono text-xs rounded-xl p-2 border ${isDark ? 'bg-slate-900 text-white border-slate-700' : 'bg-white text-slate-900 border-slate-300'}`}
                          />
                        </div>
                      </div>

                      {/* 3. PPSPM */}
                      <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'} space-y-2.5`}>
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-sky-600 dark:text-sky-400 block text-xs">
                            3. Pejabat Penandatangan SPM (PPSPM)
                          </span>
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Nama Lengkap PPSPM:</label>
                          <input
                            type="text"
                            placeholder="Nama Lengkap PPSPM"
                            value={pejabatFormData.ppspm.nama}
                            onChange={(e) => setPejabatFormData({ ...pejabatFormData, ppspm: { ...pejabatFormData.ppspm, nama: e.target.value } })}
                            className={`w-full text-xs rounded-xl p-2 border ${isDark ? 'bg-slate-900 text-white border-slate-700' : 'bg-white text-slate-900 border-slate-300'}`}
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Nomor WhatsApp / HP PPSPM:</label>
                          <input
                            type="text"
                            placeholder="081234567890"
                            value={pejabatFormData.ppspm.noHp || ''}
                            onChange={(e) => setPejabatFormData({ ...pejabatFormData, ppspm: { ...pejabatFormData.ppspm, noHp: e.target.value } })}
                            className={`w-full font-mono text-xs rounded-xl p-2 border ${isDark ? 'bg-slate-900 text-white border-slate-700' : 'bg-white text-slate-900 border-slate-300'}`}
                          />
                        </div>
                      </div>

                      {/* 4. Bendahara Pengeluaran */}
                      <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'} space-y-2.5`}>
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-sky-600 dark:text-sky-400 block text-xs">
                            4. Bendahara Pengeluaran
                          </span>
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Nama Lengkap Bendahara:</label>
                          <input
                            type="text"
                            placeholder="Nama Lengkap Bendahara Pengeluaran"
                            value={pejabatFormData.bendahara.nama}
                            onChange={(e) => setPejabatFormData({ ...pejabatFormData, bendahara: { ...pejabatFormData.bendahara, nama: e.target.value } })}
                            className={`w-full text-xs rounded-xl p-2 border ${isDark ? 'bg-slate-900 text-white border-slate-700' : 'bg-white text-slate-900 border-slate-300'}`}
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Nomor WhatsApp / HP Bendahara:</label>
                          <input
                            type="text"
                            placeholder="081234567890"
                            value={pejabatFormData.bendahara.noHp || ''}
                            onChange={(e) => setPejabatFormData({ ...pejabatFormData, bendahara: { ...pejabatFormData.bendahara, noHp: e.target.value } })}
                            className={`w-full font-mono text-xs rounded-xl p-2 border ${isDark ? 'bg-slate-900 text-white border-slate-700' : 'bg-white text-slate-900 border-slate-300'}`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section B: 4 Operator SAKTI */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                      <Coins className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <h4 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                        B. Operator SAKTI Satker (Pembayaran / Komitmen / Gaji / Pelaporan)
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Operator Pembayaran */}
                      <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'} space-y-2.5`}>
                        <span className="font-extrabold text-indigo-600 dark:text-indigo-400 block text-xs">
                          5. Operator Pembayaran (SPM / SP2D)
                        </span>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Nama Operator Pembayaran:</label>
                          <input
                            type="text"
                            placeholder="Nama Operator Pembayaran"
                            value={pejabatFormData.operatorPembayaran.nama}
                            onChange={(e) => setPejabatFormData({ ...pejabatFormData, operatorPembayaran: { ...pejabatFormData.operatorPembayaran, nama: e.target.value } })}
                            className={`w-full text-xs rounded-xl p-2 border ${isDark ? 'bg-slate-900 text-white border-slate-700' : 'bg-white text-slate-900 border-slate-300'}`}
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Nomor WhatsApp / HP Operator Pembayaran:</label>
                          <input
                            type="text"
                            placeholder="081234567890"
                            value={pejabatFormData.operatorPembayaran.noHp || ''}
                            onChange={(e) => setPejabatFormData({ ...pejabatFormData, operatorPembayaran: { ...pejabatFormData.operatorPembayaran, noHp: e.target.value } })}
                            className={`w-full font-mono text-xs rounded-xl p-2 border ${isDark ? 'bg-slate-900 text-white border-slate-700' : 'bg-white text-slate-900 border-slate-300'}`}
                          />
                        </div>
                      </div>

                      {/* Operator Komitmen */}
                      <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'} space-y-2.5`}>
                        <span className="font-extrabold text-indigo-600 dark:text-indigo-400 block text-xs">
                          6. Operator Komitmen (Kontrak &amp; BAST)
                        </span>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Nama Operator Komitmen:</label>
                          <input
                            type="text"
                            placeholder="Nama Operator Komitmen"
                            value={pejabatFormData.operatorKomitmen.nama}
                            onChange={(e) => setPejabatFormData({ ...pejabatFormData, operatorKomitmen: { ...pejabatFormData.operatorKomitmen, nama: e.target.value } })}
                            className={`w-full text-xs rounded-xl p-2 border ${isDark ? 'bg-slate-900 text-white border-slate-700' : 'bg-white text-slate-900 border-slate-300'}`}
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Nomor WhatsApp / HP Operator Komitmen:</label>
                          <input
                            type="text"
                            placeholder="081234567890"
                            value={pejabatFormData.operatorKomitmen.noHp || ''}
                            onChange={(e) => setPejabatFormData({ ...pejabatFormData, operatorKomitmen: { ...pejabatFormData.operatorKomitmen, noHp: e.target.value } })}
                            className={`w-full font-mono text-xs rounded-xl p-2 border ${isDark ? 'bg-slate-900 text-white border-slate-700' : 'bg-white text-slate-900 border-slate-300'}`}
                          />
                        </div>
                      </div>

                      {/* Operator Gaji */}
                      <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'} space-y-2.5`}>
                        <span className="font-extrabold text-indigo-600 dark:text-indigo-400 block text-xs">
                          7. Operator Gaji (PPABP / GPP)
                        </span>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Nama Operator Gaji:</label>
                          <input
                            type="text"
                            placeholder="Nama Operator Gaji"
                            value={pejabatFormData.operatorGaji.nama}
                            onChange={(e) => setPejabatFormData({ ...pejabatFormData, operatorGaji: { ...pejabatFormData.operatorGaji, nama: e.target.value } })}
                            className={`w-full text-xs rounded-xl p-2 border ${isDark ? 'bg-slate-900 text-white border-slate-700' : 'bg-white text-slate-900 border-slate-300'}`}
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Nomor WhatsApp / HP Operator Gaji:</label>
                          <input
                            type="text"
                            placeholder="081234567890"
                            value={pejabatFormData.operatorGaji.noHp || ''}
                            onChange={(e) => setPejabatFormData({ ...pejabatFormData, operatorGaji: { ...pejabatFormData.operatorGaji, noHp: e.target.value } })}
                            className={`w-full font-mono text-xs rounded-xl p-2 border ${isDark ? 'bg-slate-900 text-white border-slate-700' : 'bg-white text-slate-900 border-slate-300'}`}
                          />
                        </div>
                      </div>

                      {/* Operator Pelaporan */}
                      <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'} space-y-2.5`}>
                        <span className="font-extrabold text-indigo-600 dark:text-indigo-400 block text-xs">
                          8. Operator Pelaporan / Capaian Output (GLP)
                        </span>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Nama Operator Pelaporan:</label>
                          <input
                            type="text"
                            placeholder="Nama Operator Pelaporan SAKTI"
                            value={pejabatFormData.operatorPelaporan.nama}
                            onChange={(e) => setPejabatFormData({ ...pejabatFormData, operatorPelaporan: { ...pejabatFormData.operatorPelaporan, nama: e.target.value } })}
                            className={`w-full text-xs rounded-xl p-2 border ${isDark ? 'bg-slate-900 text-white border-slate-700' : 'bg-white text-slate-900 border-slate-300'}`}
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Nomor WhatsApp / HP Operator Pelaporan:</label>
                          <input
                            type="text"
                            placeholder="081234567890"
                            value={pejabatFormData.operatorPelaporan.noHp || ''}
                            onChange={(e) => setPejabatFormData({ ...pejabatFormData, operatorPelaporan: { ...pejabatFormData.operatorPelaporan, noHp: e.target.value } })}
                            className={`w-full font-mono text-xs rounded-xl p-2 border ${isDark ? 'bg-slate-900 text-white border-slate-700' : 'bg-white text-slate-900 border-slate-300'}`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section C: Kontak Utama Satker & Pengaturan Password Satker */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                      <Shield className="w-4 h-4 text-amber-500" />
                      <h4 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                        C. Kontak Resmi Satker &amp; Keamanan Password
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Email Resmi Satker:</label>
                        <input
                          type="email"
                          placeholder="satker@kemenkeu.go.id"
                          value={pejabatFormData.emailPic}
                          onChange={(e) => setPejabatFormData({ ...pejabatFormData, emailPic: e.target.value })}
                          className={`w-full text-xs rounded-xl p-2.5 border ${isDark ? 'bg-slate-950 text-white border-slate-700' : 'bg-white text-slate-900 border-slate-300'}`}
                        />
                      </div>

                      {isAdminAuthenticated ? (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                              Password Satker (Admin Mode):
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                setPejabatFormData(prev => ({
                                  ...prev,
                                  passwordSatker: getSatkerDefaultPassword(selectedSatkerForPejabat)
                                }));
                              }}
                              className="text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                            >
                              Reset Default
                            </button>
                          </div>
                          <input
                            type="text"
                            placeholder="Password untuk login satker"
                            value={pejabatFormData.passwordSatker}
                            onChange={(e) => setPejabatFormData({ ...pejabatFormData, passwordSatker: e.target.value })}
                            className={`w-full font-mono text-xs rounded-xl p-2.5 border ${isDark ? 'bg-slate-950 text-white border-slate-700' : 'bg-white text-slate-900 border-slate-300'}`}
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                            Status Keamanan Password:
                          </label>
                          <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                            isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                          }`}>
                            <Lock className="w-4 h-4 text-amber-500 shrink-0" />
                            <span className="text-xs font-semibold">Password Satker Terlindungi &amp; Terverifikasi</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Alamat Lengkap Kantor Satker:</label>
                      <input
                        type="text"
                        placeholder="Alamat kantor satker"
                        value={pejabatFormData.alamatSatker}
                        onChange={(e) => setPejabatFormData({ ...pejabatFormData, alamatSatker: e.target.value })}
                        className={`w-full text-xs rounded-xl p-2.5 border ${isDark ? 'bg-slate-950 text-white border-slate-700' : 'bg-white text-slate-900 border-slate-300'}`}
                      />
                    </div>
                  </div>

                </div>
              )}

            </div>

            {/* Modal Footer */}
            {isPasswordUnlocked && (
              <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3 bg-slate-50 dark:bg-slate-950/80 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsPejabatModalOpen(false)}
                  className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer"
                >
                  Batal
                </button>

                <button
                  type="button"
                  onClick={handleSavePejabatData}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-6 py-2.5 rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Seluruh Data Pejabat &amp; Kontak</span>
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* MODAL 2: FULL ADD / EDIT MASTER SATKER (ADMIN) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className={`rounded-3xl border shadow-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 px-2.5 py-0.5 rounded-full">
                  {editingSatker ? 'EDIT MASTER SATKER' : 'TAMBAH SATKER BARU'}
                </span>
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">
                  {editingSatker ? `Edit Satker ${formData.kodeSatker}` : 'Tambah Master Data Satker Mitra'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveFullForm} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-extrabold block text-slate-700 dark:text-slate-300 mb-1">
                    Kode Satker (6 Digit)*:
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="Contoh: 651046"
                    value={formData.kodeSatker || ''}
                    onChange={(e) => setFormData({ ...formData, kodeSatker: e.target.value })}
                    className={`w-full font-mono font-bold text-xs rounded-xl p-2.5 border focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                      isDark ? 'bg-slate-950 text-slate-100 border-slate-800' : 'bg-slate-50 text-slate-900 border-slate-300'
                    }`}
                  />
                </div>

                <div>
                  <label className="font-extrabold block text-slate-700 dark:text-slate-300 mb-1">
                    Status Satker:
                  </label>
                  <select
                    value={formData.isActive ? 'AKTIF' : 'NONAKTIF'}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'AKTIF' })}
                    className={`w-full text-xs rounded-xl p-2.5 border focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                      isDark ? 'bg-slate-950 text-slate-100 border-slate-800' : 'bg-slate-50 text-slate-900 border-slate-300'
                    }`}
                  >
                    <option value="AKTIF">🟢 AKTIF (Muncul di Dashboard)</option>
                    <option value="NONAKTIF">🔴 NONAKTIF (Disembunyikan)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-extrabold block text-slate-700 dark:text-slate-300 mb-1">
                  Nama Lengkap Satker*:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: BALAI BESAR PENGEMBANGAN PENJAMINAN MUTU PENDIDIKAN VOKASI"
                  value={formData.namaSatker || ''}
                  onChange={(e) => setFormData({ ...formData, namaSatker: e.target.value })}
                  className={`w-full text-xs font-bold rounded-xl p-2.5 border focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                    isDark ? 'bg-slate-950 text-slate-100 border-slate-800' : 'bg-slate-50 text-slate-900 border-slate-300'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-extrabold block text-slate-700 dark:text-slate-300 mb-1">
                    Kementerian / Lembaga:
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Kementerian Pendidikan Dasar dan Menengah"
                    value={formData.kementerianLembaga || ''}
                    onChange={(e) => setFormData({ ...formData, kementerianLembaga: e.target.value })}
                    className={`w-full text-xs rounded-xl p-2.5 border focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                      isDark ? 'bg-slate-950 text-slate-100 border-slate-800' : 'bg-slate-50 text-slate-900 border-slate-300'
                    }`}
                  />
                </div>

                <div>
                  <label className="font-extrabold block text-slate-700 dark:text-slate-300 mb-1">
                    Kode BA (Bagian Anggaran):
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 023 atau 018"
                    value={formData.kodeBa || ''}
                    onChange={(e) => setFormData({ ...formData, kodeBa: e.target.value })}
                    className={`w-full text-xs font-mono rounded-xl p-2.5 border focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                      isDark ? 'bg-slate-950 text-slate-100 border-slate-800' : 'bg-slate-50 text-slate-900 border-slate-300'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="font-extrabold block text-slate-700 dark:text-slate-300 mb-1">
                  Password Satker (Default: {formData.kodeSatker ? `${formData.kodeSatker}_${formData.kodeBa || '018'}` : '[KodeSatker]_[KodeBA]'}):
                </label>
                <input
                  type="text"
                  placeholder="Kode rahasia login satker"
                  value={formData.passwordSatker || ''}
                  onChange={(e) => setFormData({ ...formData, passwordSatker: e.target.value })}
                  className={`w-full text-xs font-mono rounded-xl p-2.5 border ${
                    isDark ? 'bg-slate-950 text-slate-100 border-slate-800' : 'bg-white text-slate-900 border-slate-300'
                  }`}
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-6 py-2.5 rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Master Satker</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: QUICK EDIT PASSWORD SATKER (ADMIN ONLY) */}
      {quickPasswordModal.isOpen && quickPasswordModal.satker && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className={`rounded-3xl border shadow-2xl max-w-md w-full p-6 space-y-5 ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 rounded-xl">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    ADMIN MODE
                  </span>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Ubah Password Satker
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuickPasswordModal({ isOpen: false, satker: null, passwordValue: '' })}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-1">
              <div className="font-extrabold text-slate-900 dark:text-white">
                {quickPasswordModal.satker.namaSatker}
              </div>
              <div className="flex items-center gap-3 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                <span>Kode: <strong>{quickPasswordModal.satker.kodeSatker}</strong></span>
                <span>BA: <strong>{quickPasswordModal.satker.kodeBa || resolveKodeBA(quickPasswordModal.satker)}</strong></span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                    Password Satker Baru:
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (quickPasswordModal.satker) {
                        setQuickPasswordModal(prev => ({
                          ...prev,
                          passwordValue: getSatkerDefaultPassword(quickPasswordModal.satker!)
                        }));
                      }
                    }}
                    className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                  >
                    Reset Default ([Kode]_[BA])
                  </button>
                </div>
                <input
                  type="text"
                  value={quickPasswordModal.passwordValue}
                  onChange={(e) => setQuickPasswordModal(prev => ({ ...prev, passwordValue: e.target.value }))}
                  placeholder="Masukkan password..."
                  className={`w-full font-mono font-bold text-xs rounded-xl p-3 border focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                    isDark ? 'bg-slate-950 text-white border-slate-700' : 'bg-white text-slate-900 border-slate-300'
                  }`}
                />
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Satker akan menggunakan password ini untuk membuka dan mengisi form kontak pejabat di portal satker.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setQuickPasswordModal({ isOpen: false, satker: null, passwordValue: '' })}
                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs px-4 py-2 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveQuickPassword}
                className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs px-5 py-2 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Password</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ModernConfirmModal
        isOpen={!!confirmModal}
        onClose={() => setConfirmModal(null)}
        onConfirm={() => {
          if (confirmModal?.onConfirm) confirmModal.onConfirm();
          setConfirmModal(null);
        }}
        title={confirmModal?.title || ''}
        message={confirmModal?.message || ''}
        confirmText={confirmModal?.confirmText || 'Konfirmasi'}
        cancelText={confirmModal?.cancelText || 'Batal'}
        type={confirmModal?.type || 'warning'}
        theme={theme}
      />
    </div>
  );
};
