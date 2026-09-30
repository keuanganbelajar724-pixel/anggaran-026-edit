import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  HelpCircle,
  Info,
  Copy,
  PhoneCall,
  AtSign,
  Code,
  Terminal,
  CheckCheck,
  ShieldAlert
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { MasterSatker, SatkerIKPA, AppTheme, PejabatDanOperator, PejabatRoleInfo, UserSaktiRecord, AppUser } from '../types';
import { ModernConfirmModal, ConfirmModalState } from './ModernConfirmModal';
import { getSatkerDefaultPassword, verifySatkerPassword, resolveKodeBA } from '../utils/satkerSecurity';
import { PaginationControl } from './PaginationControl';
import { 
  subscribeAllSaktiUserContacts, 
  formatWhatsAppUrl, 
  formatTelUrl 
} from '../utils/saktiUserContactSync';

interface KelolaDataSatkerDashboardProps {
  masterSatkers: MasterSatker[];
  satkers?: SatkerIKPA[];
  theme?: AppTheme;
  isAdminAuthenticated?: boolean;
  isReadOnly?: boolean;
  currentUser?: AppUser | null;
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
  isAdminAuthenticated: rawIsAdmin = false,
  isReadOnly = false,
  currentUser = null,
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
  const isTamu = currentUser?.role === 'tamu' || isReadOnly;
  const isRealAdmin = rawIsAdmin && !isTamu;
  const isAdminAuthenticated = isRealAdmin;

  // Masking helpers for Guest (Tamu) to protect confidential data
  const maskPhone = (phone?: string) => {
    if (!phone) return '-';
    if (!isTamu) return phone;
    const clean = phone.replace(/[^0-9]/g, '');
    if (clean.length <= 6) return '••••••';
    return clean.slice(0, 4) + '-****-' + clean.slice(-3);
  };

  const maskEmail = (email?: string) => {
    if (!email) return '-';
    if (!isTamu) return email;
    const parts = email.split('@');
    if (parts.length !== 2) return '••••••@***';
    const user = parts[0];
    const domain = parts[1];
    return (user.length > 2 ? user.slice(0, 2) : user.slice(0, 1)) + '***@' + domain;
  };

  const maskNip = (nip?: string) => {
    if (!nip) return '-';
    if (!isTamu) return nip;
    if (nip.length <= 6) return '••••••';
    return nip.slice(0, 4) + '********' + nip.slice(-4);
  };

  const maskNama = (nama?: string) => {
    if (!nama) return '';
    if (!isTamu) return nama;
    const words = nama.trim().split(/\s+/);
    return words.map(w => w.length > 2 ? w.slice(0, 2) + '*'.repeat(Math.min(w.length - 2, 4)) : w).join(' ');
  };

  const maskAddress = (alamat?: string) => {
    if (!alamat) return '-';
    if (!isTamu) return alamat;
    return '•••••••••••••••••••• (Disensor untuk Tamu)';
  };

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'AKTIF' | 'NONAKTIF' | 'LENGKAP' | 'BELUM_LENGKAP'>('ALL');
  const [filterEmail, setFilterEmail] = useState<'ALL' | 'WITH_EMAIL' | 'NO_EMAIL'>('ALL');
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

  // Quick Email Change Modal for Admin / Satker
  const [quickEmailModal, setQuickEmailModal] = useState<{
    isOpen: boolean;
    satker: MasterSatker | null;
    emailValue: string;
  }>({
    isOpen: false,
    satker: null,
    emailValue: ''
  });

  // Modal Export / Format API Email Helper
  const [isApiEmailModalOpen, setIsApiEmailModalOpen] = useState(false);
  const [apiEmailTab, setApiEmailTab] = useState<'csv' | 'json' | 'curl'>('csv');
  const [apiEmailScope, setApiEmailScope] = useState<'resmi' | 'all_contacts'>('resmi');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Real-time SAKTI registered users synced from Pendaftaran User SAKTI
  const [saktiUsersMap, setSaktiUsersMap] = useState<Record<string, UserSaktiRecord[]>>({});
  const [copyFeedbackToast, setCopyFeedbackToast] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeAllSaktiUserContacts((map) => {
      setSaktiUsersMap(map);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (copyFeedbackToast) {
      const timer = setTimeout(() => setCopyFeedbackToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [copyFeedbackToast]);

  const modalSaktiUsers = useMemo(() => {
    if (!selectedSatkerForPejabat?.kodeSatker) return [];
    return saktiUsersMap[selectedSatkerForPejabat.kodeSatker] || [];
  }, [selectedSatkerForPejabat?.kodeSatker, saktiUsersMap]);

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
    emailSatker: '',
    email: '',
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
  const triggerToast = (msg: string, _type?: 'success' | 'error' | 'warning' | 'info' | string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3800);
  };

  // Helper Copy Text to Clipboard with Feedback
  const handleCopyText = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    triggerToast(`${label} berhasil disalin ke clipboard!`);
    setTimeout(() => setCopiedText(null), 2500);
  };

  // Quick Email Modal Open & Save
  const handleOpenQuickEmail = (satker: MasterSatker) => {
    setQuickEmailModal({
      isOpen: true,
      satker,
      emailValue: satker.emailPic || satker.emailSatker || satker.email || ''
    });
  };

  const handleSaveQuickEmail = async () => {
    if (isTamu) {
      triggerToast('Tamu studi banding tidak diizinkan mengubah email satker.', 'error');
      return;
    }
    if (!quickEmailModal.satker) return;
    const cleanEmail = quickEmailModal.emailValue.trim();
    const updatedSatker: MasterSatker = {
      ...quickEmailModal.satker,
      emailPic: cleanEmail || undefined,
      emailSatker: cleanEmail || undefined,
      email: cleanEmail || undefined,
      updatedAt: new Date().toISOString()
    };

    await onSaveMasterSatker(updatedSatker);
    setQuickEmailModal({ isOpen: false, satker: null, emailValue: '' });
    triggerToast(`Email resmi Satker ${updatedSatker.namaSatker} (${updatedSatker.kodeSatker}) berhasil disimpan!`);
  };

  // Download Comprehensive Template Excel (Includes all Email fields)
  const handleDownloadTemplate = () => {
    const templateRows = [
      {
        'Kode Satker': '651046',
        'Nama Satker': 'BALAI BESAR PENGEMBANGAN PENJAMINAN MUTU PENDIDIKAN VOKASI SENI DAN BUDAYA',
        'Kementerian / Lembaga': 'Kementerian Pendidikan Dasar dan Menengah',
        'Kode BA': '023',
        'Status Satker': 'AKTIF',
        'Password Akses Satker': '651046_023',
        'Email Satker (Resmi / API)': 'satker651046@kemdikbud.go.id',
        'No HP PIC (WhatsApp)': '081234567890',
        'Nama PIC': 'Budi Santoso',
        'KPA (Nama)': 'Dr. H. Hendra Wijaya, M.Pd.',
        'KPA (No HP)': '081211112222',
        'KPA (Email)': 'hendra.kpa@kemdikbud.go.id',
        'PPK (Nama)': 'Drs. Supriyanto, M.M.',
        'PPK (No HP)': '081233334444',
        'PPK (Email)': 'supriyanto.ppk@kemdikbud.go.id',
        'PPSPM (Nama)': 'Rina Kartikasari, S.E.',
        'PPSPM (No HP)': '081255556666',
        'PPSPM (Email)': 'rina.ppspm@kemdikbud.go.id',
        'Bendahara Pengeluaran (Nama)': 'Agus Prasetyo, A.Md.',
        'Bendahara Pengeluaran (No HP)': '081277778888',
        'Bendahara Pengeluaran (Email)': 'agus.bendahara@kemdikbud.go.id',
        'Operator Pembayaran (Nama)': 'Dewi Lestari, S.Kom.',
        'Operator Pembayaran (No HP)': '081299990000',
        'Operator Pembayaran (Email)': 'dewi.bayar@kemdikbud.go.id',
        'Operator Komitmen (Nama)': 'Bambang Trihatmojo',
        'Operator Komitmen (No HP)': '081311112222',
        'Operator Komitmen (Email)': 'bambang.komitmen@kemdikbud.go.id',
        'Operator Gaji (Nama)': 'Siti Nurhaliza, S.E.',
        'Operator Gaji (No HP)': '081333334444',
        'Operator Gaji (Email)': 'siti.gaji@kemdikbud.go.id',
        'Operator Pelaporan (Nama)': 'Eko Wahyudi, S.A.P.',
        'Operator Pelaporan (No HP)': '081355556666',
        'Operator Pelaporan (Email)': 'eko.pelaporan@kemdikbud.go.id',
        'Alamat Satker': 'Jl. Kaliurang KM 9, Sleman, D.I. Yogyakarta'
      },
      {
        'Kode Satker': '411792',
        'Nama Satker': 'KANTOR PELAYANAN PAJAK PRATAMA CANDISARI',
        'Kementerian / Lembaga': 'Kementerian Keuangan',
        'Kode BA': '015',
        'Status Satker': 'AKTIF',
        'Password Akses Satker': '411792_015',
        'Email Satker (Resmi / API)': 'kpp.candisari@pajak.go.id',
        'No HP PIC (WhatsApp)': '081399887766',
        'Nama PIC': 'Sri Rahayu',
        'KPA (Nama)': 'Bambang Setiawan, Ak.',
        'KPA (No HP)': '081288889999',
        'KPA (Email)': 'bambang.kpa@pajak.go.id',
        'PPK (Nama)': 'Indah Permatasari, S.E.',
        'PPK (No HP)': '081244445555',
        'PPK (Email)': 'indah.ppk@pajak.go.id',
        'PPSPM (Nama)': 'Hadi Purnomo',
        'PPSPM (No HP)': '081266667777',
        'PPSPM (Email)': 'hadi.ppspm@pajak.go.id',
        'Bendahara Pengeluaran (Nama)': 'Wahyu Hidayat',
        'Bendahara Pengeluaran (No HP)': '081211223344',
        'Bendahara Pengeluaran (Email)': 'wahyu.bendahara@pajak.go.id',
        'Operator Pembayaran (Nama)': 'Maya Anggraini',
        'Operator Pembayaran (No HP)': '081322334455',
        'Operator Pembayaran (Email)': 'maya.bayar@pajak.go.id',
        'Operator Komitmen (Nama)': 'Rizky Firmansyah',
        'Operator Komitmen (No HP)': '081333445566',
        'Operator Komitmen (Email)': 'rizky.komitmen@pajak.go.id',
        'Operator Gaji (Nama)': 'Dina Marlina',
        'Operator Gaji (No HP)': '081344556677',
        'Operator Gaji (Email)': 'dina.gaji@pajak.go.id',
        'Operator Pelaporan (Nama)': 'Fajar Nugroho',
        'Operator Pelaporan (No HP)': '081355667788',
        'Operator Pelaporan (Email)': 'fajar.pelaporan@pajak.go.id',
        'Alamat Satker': 'Jl. Pemuda No. 1, Semarang'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateRows);
    ws['!cols'] = [
      { wch: 14 }, { wch: 45 }, { wch: 35 }, { wch: 10 }, { wch: 12 }, { wch: 22 },
      { wch: 32 }, { wch: 22 }, { wch: 25 }, { wch: 28 }, { wch: 18 }, { wch: 28 },
      { wch: 28 }, { wch: 18 }, { wch: 28 }, { wch: 28 }, { wch: 18 }, { wch: 28 },
      { wch: 28 }, { wch: 18 }, { wch: 28 }, { wch: 28 }, { wch: 18 }, { wch: 28 },
      { wch: 28 }, { wch: 18 }, { wch: 28 }, { wch: 28 }, { wch: 18 }, { wch: 28 },
      { wch: 28 }, { wch: 18 }, { wch: 28 }, { wch: 40 }
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template_Satker_dan_Email');
    XLSX.writeFile(wb, `Template_Master_Satker_Kontak_Email_KPPN026.xlsx`);
    triggerToast('Template Excel Satker & Email berhasil diunduh.');
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
      const satkerEmail = (m.emailPic || m.emailSatker || m.email || '').toLowerCase();
      const po = m.pejabatOperator;
      const poEmails = [
        po?.kpa?.email,
        po?.ppk?.email,
        po?.ppspm?.email,
        po?.bendahara?.email,
        po?.operatorPembayaran?.email,
        po?.operatorKomitmen?.email,
        po?.operatorGaji?.email,
        po?.operatorPelaporan?.email
      ].filter(Boolean).map(e => String(e).toLowerCase());

      const matchSearch =
        !q ||
        m.kodeSatker.toLowerCase().includes(q) ||
        m.namaSatker.toLowerCase().includes(q) ||
        satkerEmail.includes(q) ||
        poEmails.some(e => e.includes(q)) ||
        (m.namaPic && m.namaPic.toLowerCase().includes(q)) ||
        (m.noHpPic && m.noHpPic.includes(q)) ||
        (m.kementerianLembaga && m.kementerianLembaga.toLowerCase().includes(q)) ||
        (m.pejabatOperator?.kpa?.nama && m.pejabatOperator.kpa.nama.toLowerCase().includes(q)) ||
        (m.pejabatOperator?.ppk?.nama && m.pejabatOperator.ppk.nama.toLowerCase().includes(q)) ||
        (m.pejabatOperator?.ppspm?.nama && m.pejabatOperator.ppspm.nama.toLowerCase().includes(q)) ||
        (m.pejabatOperator?.bendahara?.nama && m.pejabatOperator.bendahara.nama.toLowerCase().includes(q)) ||
        (saktiUsersMap[m.kodeSatker]?.some(u => 
          (u.namaLengkap && u.namaLengkap.toLowerCase().includes(q)) || 
          (u.noHp && u.noHp.includes(q)) ||
          (u.nip && u.nip.includes(q)) ||
          (u.email && u.email.toLowerCase().includes(q)) ||
          (u.jabatan && u.jabatan.toLowerCase().includes(q)) ||
          (u.jabatanPerbendaharaan && u.jabatanPerbendaharaan.toLowerCase().includes(q))
        ));

      if (!matchSearch) return false;

      if (filterKL !== 'ALL' && m.kementerianLembaga !== filterKL) return false;

      const hasEmail = Boolean(m.emailPic || m.emailSatker || m.email || poEmails.length > 0);
      if (filterEmail === 'WITH_EMAIL' && !hasEmail) return false;
      if (filterEmail === 'NO_EMAIL' && hasEmail) return false;

      const rolesFilled = getFilledRolesCount(m);
      if (filterStatus === 'AKTIF') return m.isActive === true;
      if (filterStatus === 'NONAKTIF') return m.isActive === false;
      if (filterStatus === 'LENGKAP') return rolesFilled >= 4;
      if (filterStatus === 'BELUM_LENGKAP') return rolesFilled < 4;

      return true;
    });
  }, [masterSatkers, searchQuery, filterStatus, filterKL, filterEmail, saktiUsersMap]);

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
  const totalWithEmail = masterSatkers.filter(m => !!(m.emailPic || m.emailSatker || m.email)).length;
  const totalNoEmail = totalMaster - totalWithEmail;

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
      emailPic: satker.emailPic || satker.emailSatker || satker.email || '',
      alamatSatker: satker.alamatSatker || '',
      passwordSatker: satker.passwordSatker || getSatkerDefaultPassword(satker)
    });

    // Admin / Tamu bypass:
    // If real admin: unlock immediately for editing
    // If tamu: unlock form in read-only observation mode with all data masked
    // If satker (not admin, not tamu): require satker password
    if (isRealAdmin || isTamu) {
      setIsPasswordUnlocked(true);
    } else {
      setIsPasswordUnlocked(false);
    }

    setIsPejabatModalOpen(true);
  };

  // Helper to render role cards in Pejabat Modal with full Tamu sensor protection
  const renderRoleCard = (
    key: 'kpa' | 'ppk' | 'ppspm' | 'bendahara' | 'operatorPembayaran' | 'operatorKomitmen' | 'operatorGaji' | 'operatorPelaporan',
    roleTitle: string,
    roleNumber: number,
    colorScheme: 'sky' | 'indigo' = 'sky'
  ) => {
    const roleData = pejabatFormData[key];
    const isIndigo = colorScheme === 'indigo';
    const titleColor = isIndigo ? 'text-indigo-600 dark:text-indigo-400' : 'text-sky-600 dark:text-sky-400';
    const displayNama = isTamu ? maskNama(roleData.nama) : roleData.nama;
    const displayHp = isTamu ? maskPhone(roleData.noHp) : (roleData.noHp || '');
    const displayEmail = isTamu ? maskEmail(roleData.email) : (roleData.email || '');

    return (
      <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'} space-y-2.5`}>
        <div className="flex items-center justify-between">
          <span className={`font-extrabold ${titleColor} block text-xs`}>
            {roleNumber}. {roleTitle}
          </span>
          {isTamu && (
            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-800">
              <Lock className="w-2.5 h-2.5 text-amber-500" />
              <span>Disensor</span>
            </span>
          )}
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
            {isTamu && <Lock className="w-2.5 h-2.5 inline mr-1 text-amber-500" />} Nama Lengkap {roleTitle} {isTamu ? '(Disensor)' : ''}:
          </label>
          <input
            type="text"
            placeholder={`Nama Lengkap ${roleTitle}`}
            value={displayNama}
            disabled={isTamu}
            readOnly={isTamu}
            onChange={(e) => setPejabatFormData({ ...pejabatFormData, [key]: { ...roleData, nama: e.target.value } })}
            className={`w-full text-xs rounded-xl p-2 border ${
              isTamu 
                ? 'bg-slate-100 dark:bg-slate-800/80 text-slate-500 cursor-not-allowed border-slate-300 dark:border-slate-700 font-mono' 
                : isDark ? 'bg-slate-900 text-white border-slate-700' : 'bg-white text-slate-900 border-slate-300'
            }`}
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
            {isTamu && <Lock className="w-2.5 h-2.5 inline mr-1 text-amber-500" />} Nomor WhatsApp / HP {roleTitle} {isTamu ? '(Disensor)' : ''}:
          </label>
          <input
            type="text"
            placeholder="081234567890"
            value={displayHp}
            disabled={isTamu}
            readOnly={isTamu}
            onChange={(e) => setPejabatFormData({ ...pejabatFormData, [key]: { ...roleData, noHp: e.target.value } })}
            className={`w-full font-mono text-xs rounded-xl p-2 border ${
              isTamu 
                ? 'bg-slate-100 dark:bg-slate-800/80 text-slate-500 cursor-not-allowed border-slate-300 dark:border-slate-700' 
                : isDark ? 'bg-slate-900 text-white border-slate-700' : 'bg-white text-slate-900 border-slate-300'
            }`}
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
            {isTamu && <Lock className="w-2.5 h-2.5 inline mr-1 text-amber-500" />} Email {roleTitle} (Notifikasi / API) {isTamu ? '(Disensor)' : ''}:
          </label>
          <input
            type={isTamu ? "text" : "email"}
            placeholder={`${key}@satker.go.id`}
            value={displayEmail}
            disabled={isTamu}
            readOnly={isTamu}
            onChange={(e) => setPejabatFormData({ ...pejabatFormData, [key]: { ...roleData, email: e.target.value } })}
            className={`w-full text-xs rounded-xl p-2 border ${
              isTamu 
                ? 'bg-slate-100 dark:bg-slate-800/80 text-slate-500 cursor-not-allowed border-slate-300 dark:border-slate-700 font-mono' 
                : isDark ? 'bg-slate-900 text-white border-slate-700' : 'bg-white text-slate-900 border-slate-300'
            }`}
          />
        </div>
      </div>
    );
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
    if (isTamu) {
      triggerToast('Tamu studi banding tidak diizinkan mengubah password satker.', 'error');
      return;
    }
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
    if (isTamu) {
      triggerToast('Tamu studi banding tidak diizinkan mengubah kontak pejabat satker.', 'error');
      return;
    }
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

    const savedEmail = pejabatFormData.emailPic.trim() || undefined;
    const updated: MasterSatker = {
      ...selectedSatkerForPejabat,
      pejabatOperator: newPejabatOperator,
      namaPic: primaryName || undefined,
      noHpPic: primaryPhone || undefined,
      emailPic: savedEmail,
      emailSatker: savedEmail,
      email: savedEmail,
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
    if (isTamu) {
      triggerToast('Tamu studi banding tidak diizinkan mereset password satker.', 'error');
      return;
    }
    setConfirmModal({
      isOpen: true,
      title: 'Terapkan Password Default Massal ([KodeSatker]_[KodeBA])?',
      message: `Tindakan ini akan menyetel / mereset password untuk seluruh ${masterSatkers.length} Satker ke format standar resmi KPPN: [KodeSatker]_[KodeBA] (Contoh: 890594_018). Password ini langsung terintegrasi secara terpusat untuk Simulasi IKPA, form kontak 8 pejabat & operator SAKTI, serta seluruh akses Satker di aplikasi.`,
      confirmText: `Ya, Terapkan ke ${masterSatkers.length} Satker`,
      cancelText: 'Batal',
      variant: 'warning',
      iconType: 'alert',
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

  // Export Satker Credentials & Contacts to Excel (Including Emails for API & blast)
  const handleExportAccountsToExcel = () => {
    if (isTamu) {
      triggerToast('Tamu studi banding tidak diizinkan mengekspor kredensial rahasia satker.', 'error');
      return;
    }
    const exportData = masterSatkers.map((m, idx) => {
      const p = m.pejabatOperator || {};
      const defaultPw = getSatkerDefaultPassword(m);
      const saktiUsers = saktiUsersMap[m.kodeSatker] || [];
      const saktiContactsSummary = saktiUsers.length > 0
        ? saktiUsers.map(u => `${u.namaLengkap} (${u.jabatanPerbendaharaan || u.peranJabatan || 'User SAKTI'}: ${u.noHp || '-'}, Email: ${u.email || '-'})`).join('; ')
        : '-';

      return {
        'No': idx + 1,
        'Kode Satker': m.kodeSatker,
        'Nama Satker': m.namaSatker,
        'Kementerian / Lembaga': m.kementerianLembaga || '-',
        'Kode BA': m.kodeBa || resolveKodeBA(m),
        'Status Satker': m.isActive ? 'AKTIF' : 'NONAKTIF',
        'Password Akses Satker': m.passwordSatker || defaultPw,
        'Email Satker (Resmi / API)': m.emailPic || m.emailSatker || m.email || '-',
        'Kontak Utama (No HP)': m.noHpPic || '-',
        'Nama PIC / Narahubung': m.namaPic || '-',
        'Kontak Tambahan (Pendaftaran SAKTI)': saktiContactsSummary,
        'KPA (Nama)': p.kpa?.nama || '-',
        'KPA (No HP)': p.kpa?.noHp || '-',
        'KPA (Email)': p.kpa?.email || '-',
        'PPK (Nama)': p.ppk?.nama || '-',
        'PPK (No HP)': p.ppk?.noHp || '-',
        'PPK (Email)': p.ppk?.email || '-',
        'PPSPM (Nama)': p.ppspm?.nama || '-',
        'PPSPM (No HP)': p.ppspm?.noHp || '-',
        'PPSPM (Email)': p.ppspm?.email || '-',
        'Bendahara Pengeluaran (Nama)': p.bendahara?.nama || '-',
        'Bendahara Pengeluaran (No HP)': p.bendahara?.noHp || '-',
        'Bendahara Pengeluaran (Email)': p.bendahara?.email || '-',
        'Operator Pembayaran (Nama)': p.operatorPembayaran?.nama || '-',
        'Operator Pembayaran (No HP)': p.operatorPembayaran?.noHp || '-',
        'Operator Pembayaran (Email)': p.operatorPembayaran?.email || '-',
        'Operator Komitmen (Nama)': p.operatorKomitmen?.nama || '-',
        'Operator Komitmen (No HP)': p.operatorKomitmen?.noHp || '-',
        'Operator Komitmen (Email)': p.operatorKomitmen?.email || '-',
        'Operator Gaji (Nama)': p.operatorGaji?.nama || '-',
        'Operator Gaji (No HP)': p.operatorGaji?.noHp || '-',
        'Operator Gaji (Email)': p.operatorGaji?.email || '-',
        'Operator Pelaporan (Nama)': p.operatorPelaporan?.nama || '-',
        'Operator Pelaporan (No HP)': p.operatorPelaporan?.noHp || '-',
        'Operator Pelaporan (Email)': p.operatorPelaporan?.email || '-',
        'Alamat': m.alamatSatker || '-'
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    ws['!cols'] = [
      { wch: 5 }, { wch: 14 }, { wch: 40 }, { wch: 30 }, { wch: 10 }, { wch: 12 }, { wch: 22 },
      { wch: 32 }, { wch: 18 }, { wch: 22 }, { wch: 28 },
      { wch: 25 }, { wch: 16 }, { wch: 25 },
      { wch: 25 }, { wch: 16 }, { wch: 25 },
      { wch: 25 }, { wch: 16 }, { wch: 25 },
      { wch: 25 }, { wch: 16 }, { wch: 25 },
      { wch: 25 }, { wch: 16 }, { wch: 25 },
      { wch: 25 }, { wch: 16 }, { wch: 25 },
      { wch: 25 }, { wch: 16 }, { wch: 25 },
      { wch: 25 }, { wch: 16 }, { wch: 25 },
      { wch: 35 }
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
      emailSatker: '',
      email: '',
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
      emailPic: satker.emailPic || satker.emailSatker || satker.email || '',
      emailSatker: satker.emailSatker || satker.emailPic || satker.email || '',
      email: satker.email || satker.emailSatker || satker.emailPic || '',
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
    const cleanEmail = formData.emailPic?.trim() || undefined;
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
      emailPic: cleanEmail,
      emailSatker: cleanEmail,
      email: cleanEmail,
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
        let colEmail = -1;

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
            if (str.includes('email') || str.includes('mail')) colEmail = cIdx;
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
          const valEmail = colEmail !== -1 && row[colEmail] ? String(row[colEmail]).trim() : undefined;

          const existing = newMasterMap.get(kodeSatker);
          if (existing) {
            newMasterMap.set(kodeSatker, {
              ...existing,
              namaSatker: namaSatker || existing.namaSatker,
              isActive: isActive,
              kodeBa: kodeBa || existing.kodeBa,
              kementerianLembaga: kementerianLembaga || existing.kementerianLembaga,
              emailPic: valEmail || existing.emailPic,
              emailSatker: valEmail || existing.emailSatker || existing.emailPic,
              email: valEmail || existing.email || existing.emailPic,
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
              emailPic: valEmail,
              emailSatker: valEmail,
              email: valEmail,
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
        let colKpaNama = -1, colKpaHp = -1, colKpaEmail = -1;
        let colPpkNama = -1, colPpkHp = -1, colPpkEmail = -1;
        let colPpspmNama = -1, colPpspmHp = -1, colPpspmEmail = -1;
        let colBendaharaNama = -1, colBendaharaHp = -1, colBendaharaEmail = -1;
        let colOpBayarNama = -1, colOpBayarHp = -1, colOpBayarEmail = -1;
        let colOpKomitmenNama = -1, colOpKomitmenHp = -1, colOpKomitmenEmail = -1;
        let colOpGajiNama = -1, colOpGajiHp = -1, colOpGajiEmail = -1;
        let colOpLaporNama = -1, colOpLaporHp = -1, colOpLaporEmail = -1;
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
            else if (str.includes('kpa') && (str.includes('email') || str.includes('mail'))) colKpaEmail = cIdx;
            else if (str.includes('kpa') && (str.includes('nama') || str.includes('pejabat'))) colKpaNama = cIdx;
            else if (str === 'kpa' || str.includes('kuasa pengguna')) colKpaNama = cIdx;

            // PPK
            if (str.includes('ppk') && (str.includes('hp') || str.includes('wa') || str.includes('telp') || str.includes('kontak') || str.includes('nomor') || str.includes('phone'))) colPpkHp = cIdx;
            else if (str.includes('ppk') && (str.includes('email') || str.includes('mail'))) colPpkEmail = cIdx;
            else if (str.includes('ppk') && (str.includes('nama') || str.includes('pejabat'))) colPpkNama = cIdx;
            else if (str === 'ppk' || str.includes('komitmen')) colPpkNama = cIdx;

            // PPSPM
            if (str.includes('ppspm') && (str.includes('hp') || str.includes('wa') || str.includes('telp') || str.includes('kontak') || str.includes('nomor') || str.includes('phone'))) colPpspmHp = cIdx;
            else if (str.includes('ppspm') && (str.includes('email') || str.includes('mail'))) colPpspmEmail = cIdx;
            else if (str.includes('ppspm') && (str.includes('nama') || str.includes('pejabat'))) colPpspmNama = cIdx;
            else if (str === 'ppspm' || str.includes('penguji')) colPpspmNama = cIdx;

            // Bendahara
            if ((str.includes('bendahara') || str.includes('bpp')) && (str.includes('hp') || str.includes('wa') || str.includes('telp') || str.includes('kontak') || str.includes('nomor') || str.includes('phone'))) colBendaharaHp = cIdx;
            else if ((str.includes('bendahara') || str.includes('bpp')) && (str.includes('email') || str.includes('mail'))) colBendaharaEmail = cIdx;
            else if ((str.includes('bendahara') || str.includes('bpp')) && (str.includes('nama') || str.includes('pejabat'))) colBendaharaNama = cIdx;
            else if (str.includes('bendahara')) colBendaharaNama = cIdx;

            // Op Pembayaran
            if ((str.includes('bayar') || str.includes('pembayaran') || str.includes('spp')) && (str.includes('hp') || str.includes('wa') || str.includes('telp') || str.includes('kontak') || str.includes('phone'))) colOpBayarHp = cIdx;
            else if ((str.includes('bayar') || str.includes('pembayaran') || str.includes('spp')) && (str.includes('email') || str.includes('mail'))) colOpBayarEmail = cIdx;
            else if (str.includes('bayar') || str.includes('pembayaran')) colOpBayarNama = cIdx;

            // Op Komitmen
            if ((str.includes('komitmen') || str.includes('kontrak')) && (str.includes('hp') || str.includes('wa') || str.includes('telp') || str.includes('kontak') || str.includes('phone'))) colOpKomitmenHp = cIdx;
            else if ((str.includes('komitmen') || str.includes('kontrak')) && (str.includes('email') || str.includes('mail'))) colOpKomitmenEmail = cIdx;
            else if (str.includes('komitmen') || str.includes('kontrak')) colOpKomitmenNama = cIdx;

            // Op Gaji
            if ((str.includes('gaji') || str.includes('ppn') || str.includes('tukin')) && (str.includes('hp') || str.includes('wa') || str.includes('telp') || str.includes('kontak') || str.includes('phone'))) colOpGajiHp = cIdx;
            else if ((str.includes('gaji') || str.includes('ppn') || str.includes('tukin')) && (str.includes('email') || str.includes('mail'))) colOpGajiEmail = cIdx;
            else if (str.includes('gaji')) colOpGajiNama = cIdx;

            // Op Pelaporan / Caput
            if ((str.includes('lapor') || str.includes('pelaporan') || str.includes('caput') || str.includes('akuntansi')) && (str.includes('hp') || str.includes('wa') || str.includes('telp') || str.includes('kontak') || str.includes('phone'))) colOpLaporHp = cIdx;
            else if ((str.includes('lapor') || str.includes('pelaporan') || str.includes('caput') || str.includes('akuntansi')) && (str.includes('email') || str.includes('mail'))) colOpLaporEmail = cIdx;
            else if (str.includes('lapor') || str.includes('pelaporan') || str.includes('caput')) colOpLaporNama = cIdx;

            // General Satker Email / PIC Email
            if ((str.includes('email') || str.includes('mail')) && !str.includes('kpa') && !str.includes('ppk') && !str.includes('ppspm') && !str.includes('bendahara') && !str.includes('bayar') && !str.includes('komitmen') && !str.includes('gaji') && !str.includes('lapor')) {
              colPicEmail = cIdx;
            }

            // General PIC / HP
            if ((str.includes('pic') || str.includes('kontak') || str.includes('whatsapp') || str.includes('no hp') || str.includes('nohp') || str.includes('telepon')) && !str.includes('kpa') && !str.includes('ppk') && !str.includes('ppspm') && !str.includes('bendahara')) {
              if (str.includes('nama')) colPicNama = cIdx;
              else colPicHp = cIdx;
            }
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
          const valKpaEmail = colKpaEmail !== -1 && row[colKpaEmail] ? String(row[colKpaEmail]).trim() : undefined;

          const valPpkNama = colPpkNama !== -1 && row[colPpkNama] ? String(row[colPpkNama]).trim() : undefined;
          const valPpkHp = colPpkHp !== -1 ? cleanHp(row[colPpkHp]) : undefined;
          const valPpkEmail = colPpkEmail !== -1 && row[colPpkEmail] ? String(row[colPpkEmail]).trim() : undefined;

          const valPpspmNama = colPpspmNama !== -1 && row[colPpspmNama] ? String(row[colPpspmNama]).trim() : undefined;
          const valPpspmHp = colPpspmHp !== -1 ? cleanHp(row[colPpspmHp]) : undefined;
          const valPpspmEmail = colPpspmEmail !== -1 && row[colPpspmEmail] ? String(row[colPpspmEmail]).trim() : undefined;

          const valBendaharaNama = colBendaharaNama !== -1 && row[colBendaharaNama] ? String(row[colBendaharaNama]).trim() : undefined;
          const valBendaharaHp = colBendaharaHp !== -1 ? cleanHp(row[colBendaharaHp]) : undefined;
          const valBendaharaEmail = colBendaharaEmail !== -1 && row[colBendaharaEmail] ? String(row[colBendaharaEmail]).trim() : undefined;

          const valOpBayarNama = colOpBayarNama !== -1 && row[colOpBayarNama] ? String(row[colOpBayarNama]).trim() : undefined;
          const valOpBayarHp = colOpBayarHp !== -1 ? cleanHp(row[colOpBayarHp]) : undefined;
          const valOpBayarEmail = colOpBayarEmail !== -1 && row[colOpBayarEmail] ? String(row[colOpBayarEmail]).trim() : undefined;

          const valOpKomitmenNama = colOpKomitmenNama !== -1 && row[colOpKomitmenNama] ? String(row[colOpKomitmenNama]).trim() : undefined;
          const valOpKomitmenHp = colOpKomitmenHp !== -1 ? cleanHp(row[colOpKomitmenHp]) : undefined;
          const valOpKomitmenEmail = colOpKomitmenEmail !== -1 && row[colOpKomitmenEmail] ? String(row[colOpKomitmenEmail]).trim() : undefined;

          const valOpGajiNama = colOpGajiNama !== -1 && row[colOpGajiNama] ? String(row[colOpGajiNama]).trim() : undefined;
          const valOpGajiHp = colOpGajiHp !== -1 ? cleanHp(row[colOpGajiHp]) : undefined;
          const valOpGajiEmail = colOpGajiEmail !== -1 && row[colOpGajiEmail] ? String(row[colOpGajiEmail]).trim() : undefined;

          const valOpLaporNama = colOpLaporNama !== -1 && row[colOpLaporNama] ? String(row[colOpLaporNama]).trim() : undefined;
          const valOpLaporHp = colOpLaporHp !== -1 ? cleanHp(row[colOpLaporHp]) : undefined;
          const valOpLaporEmail = colOpLaporEmail !== -1 && row[colOpLaporEmail] ? String(row[colOpLaporEmail]).trim() : undefined;

          const valPicNama = colPicNama !== -1 && row[colPicNama] ? String(row[colPicNama]).trim() : undefined;
          const valPicHp = colPicHp !== -1 ? cleanHp(row[colPicHp]) : undefined;
          const valPicEmail = colPicEmail !== -1 && row[colPicEmail] ? String(row[colPicEmail]).trim() : undefined;
          const valAlamat = colAlamat !== -1 && row[colAlamat] ? String(row[colAlamat]).trim() : undefined;

          const mergedPo: PejabatDanOperator = {
            kpa: {
              nama: valKpaNama || existingPo.kpa?.nama || '',
              noHp: valKpaHp || existingPo.kpa?.noHp || undefined,
              nip: existingPo.kpa?.nip,
              email: valKpaEmail || existingPo.kpa?.email
            },
            ppk: {
              nama: valPpkNama || existingPo.ppk?.nama || '',
              noHp: valPpkHp || existingPo.ppk?.noHp || undefined,
              nip: existingPo.ppk?.nip,
              email: valPpkEmail || existingPo.ppk?.email
            },
            ppspm: {
              nama: valPpspmNama || existingPo.ppspm?.nama || '',
              noHp: valPpspmHp || existingPo.ppspm?.noHp || undefined,
              nip: existingPo.ppspm?.nip,
              email: valPpspmEmail || existingPo.ppspm?.email
            },
            bendahara: {
              nama: valBendaharaNama || existingPo.bendahara?.nama || '',
              noHp: valBendaharaHp || existingPo.bendahara?.noHp || undefined,
              nip: existingPo.bendahara?.nip,
              email: valBendaharaEmail || existingPo.bendahara?.email
            },
            operatorPembayaran: {
              nama: valOpBayarNama || existingPo.operatorPembayaran?.nama || '',
              noHp: valOpBayarHp || existingPo.operatorPembayaran?.noHp || undefined,
              nip: existingPo.operatorPembayaran?.nip,
              email: valOpBayarEmail || existingPo.operatorPembayaran?.email
            },
            operatorKomitmen: {
              nama: valOpKomitmenNama || existingPo.operatorKomitmen?.nama || '',
              noHp: valOpKomitmenHp || existingPo.operatorKomitmen?.noHp || undefined,
              nip: existingPo.operatorKomitmen?.nip,
              email: valOpKomitmenEmail || existingPo.operatorKomitmen?.email
            },
            operatorGaji: {
              nama: valOpGajiNama || existingPo.operatorGaji?.nama || '',
              noHp: valOpGajiHp || existingPo.operatorGaji?.noHp || undefined,
              nip: existingPo.operatorGaji?.nip,
              email: valOpGajiEmail || existingPo.operatorGaji?.email
            },
            operatorPelaporan: {
              nama: valOpLaporNama || existingPo.operatorPelaporan?.nama || '',
              noHp: valOpLaporHp || existingPo.operatorPelaporan?.noHp || undefined,
              nip: existingPo.operatorPelaporan?.nip,
              email: valOpLaporEmail || existingPo.operatorPelaporan?.email
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
            emailSatker: valPicEmail || existing.emailSatker || existing.emailPic,
            email: valPicEmail || existing.email || existing.emailPic,
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
          modal={confirmModal}
          onClose={() => setConfirmModal(null)}
          isDark={theme === 'dark'}
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
            <span>{isReadOnly ? 'MODE TAMU STUDI BANDING (HANYA LIHAT / READ-ONLY)' : isAdminAuthenticated ? 'ADMIN KELOLA DATA SATKER & PENGATURAN PASSWORD' : 'PORTAL PESERTA SATKER & PEMUTAKHIRAN DATA KONTAK'}</span>
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
                  title="Download Excel berisi daftar username, password, email resmi, dan kontak lengkap pejabat seluruh Satker"
                >
                  <FileDown className="w-4 h-4 text-slate-300" />
                  <span>Export Akun &amp; Email (.xlsx)</span>
                </button>

                {/* API Email Generator / Formatter */}
                <button
                  type="button"
                  onClick={() => setIsApiEmailModalOpen(true)}
                  className="bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-extrabold text-xs px-3.5 py-2.5 rounded-xl shadow-lg shadow-sky-600/25 border border-sky-400/40 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                  title="Lihat format data email siap pakai untuk integrasi API Email KPPN (JSON / List Koma / CSV)"
                >
                  <Mail className="w-4 h-4 text-sky-200 animate-pulse" />
                  <span>Format API Email ({totalWithEmail})</span>
                </button>

                {/* Download Template Excel Satker & Email */}
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
                  title="Download format / template Excel resmi untuk upload Master Satker, kontak WhatsApp, dan Email"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>Template Excel Email</span>
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
                  title="Upload batch kontak HP & email pejabat / operator dari Excel (penggabungan aman tanpa hapus data lama)"
                >
                  <Phone className="w-4 h-4 text-emerald-200" />
                  <span>Upload Batch Kontak &amp; Email</span>
                </button>

                {/* Proteksi Data Anti-Hapus */}
                <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 text-xs font-bold shadow-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Data Aman: Anti-Hapus &amp; Hanya Update</span>
                </div>
              </>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsApiEmailModalOpen(true)}
                  className="bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-extrabold text-xs px-3.5 py-2.5 rounded-xl shadow-md border border-sky-400/40 transition-all flex items-center gap-2 cursor-pointer"
                  title="Buka format API Email Satker"
                >
                  <Mail className="w-4 h-4 text-sky-200" />
                  <span>Format API Email ({totalWithEmail})</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
                  title="Unduh format template Excel resmi kontak & email Satker"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>Template Excel</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportAccountsToExcel}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
                  title="Download Excel rekap daftar kontak resmi seluruh Satker"
                >
                  <Download className="w-4 h-4 text-slate-300" />
                  <span>Unduh Rekap Kontak Satker (.xlsx)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dedicated Tamu Notice if isReadOnly */}
      {isReadOnly && (
        <div className="p-4 sm:p-5 rounded-3xl bg-purple-950/40 border-2 border-purple-500/40 text-purple-200 shadow-md flex items-center gap-3.5 animate-in fade-in duration-200">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center shrink-0 text-purple-300">
            <Eye className="w-5 h-5 text-purple-300" />
          </div>
          <div className="text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">Mode Observasi Tamu Studi Banding (Read-Only)</span>
              <span className="text-[10px] bg-purple-400 text-slate-950 px-2 py-0.5 rounded-full font-black uppercase">Hanya Lihat</span>
            </div>
            <p className="text-purple-200/90 mt-0.5">
              Anda dapat melihat dan mencari seluruh data referensi satker, struktur kontak, serta informasi pejabat. Seluruh fungsi rekam, ubah, dan hapus data dinonaktifkan demi menjaga integritas data.
            </p>
          </div>
        </div>
      )}

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

      {/* 5 Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
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
              onClick={() => {
                setFilterStatus('BELUM_LENGKAP');
                setCurrentPage(1);
              }}
              className="text-[11px] font-extrabold text-amber-600 hover:underline cursor-pointer ml-2"
            >
              Filter &amp; Isi &rarr;
            </button>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Klik Satker untuk memasukkan password &amp; melengkapi kontak
          </p>
        </div>

        {/* 5th Card: Email Satker (API Ready) */}
        <div className={`p-5 rounded-2xl border transition-all ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider flex items-center gap-1">
              <span>Email Satker (API Ready)</span>
            </span>
            <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
              <Mail className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-sky-600 dark:text-sky-400">
              {totalWithEmail}
            </span>
            <span className="text-xs font-medium text-slate-500">
              ({totalMaster > 0 ? Math.round((totalWithEmail / totalMaster) * 100) : 0}%)
            </span>
            <button
              onClick={() => {
                setFilterEmail(prev => prev === 'WITH_EMAIL' ? 'ALL' : 'WITH_EMAIL');
                setCurrentPage(1);
              }}
              className="text-[11px] font-extrabold text-sky-600 hover:underline cursor-pointer ml-2"
            >
              {filterEmail === 'WITH_EMAIL' ? 'Reset' : 'Filter Email \u2192'}
            </button>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {totalNoEmail} Satker belum ada email terdaftar
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
              placeholder="Cari Kode Satker, Nama Satker, Email Satker, Email Pejabat, Nama KPA / PPK / PPSPM / Bendahara..."
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
                setFilterEmail('ALL');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterStatus === 'ALL' && filterEmail === 'ALL'
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

            {/* Email Filter Pills */}
            <button
              type="button"
              onClick={() => {
                setFilterEmail(prev => prev === 'WITH_EMAIL' ? 'ALL' : 'WITH_EMAIL');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filterEmail === 'WITH_EMAIL'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
              }`}
            >
              <Mail className="w-3 h-3" />
              <span>Ada Email ({totalWithEmail})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setFilterEmail(prev => prev === 'NO_EMAIL' ? 'ALL' : 'NO_EMAIL');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filterEmail === 'NO_EMAIL'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
              }`}
            >
              <span>Belum Ada Email ({totalNoEmail})</span>
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

            {!isTamu && (
              <button
                type="button"
                onClick={() => setIsApiEmailModalOpen(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800 transition-all cursor-pointer"
                title="Buka format payload dan daftar alamat email untuk API Email"
              >
                <AtSign className="w-3.5 h-3.5 text-indigo-500" />
                <span>Daftar Email API</span>
              </button>
            )}
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
              {isTamu ? (
                <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1.5 mt-0.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Mode Tamu / Studi Banding: Seluruh data kontak dan password satker disensor otomatis demi keamanan privasi. Klik <strong>Lihat Kontak (Disensor)</strong> untuk melihat struktur rincian pejabat.</span>
                </span>
              ) : (
                <>Klik tombol <strong className="text-sky-600 dark:text-sky-400">Isi / Kelola Kontak Pejabat</strong> untuk mengisi data KPA, PPK, PPSPM, Bendahara, dan 4 Operator Satker.</>
              )}
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
                <th className="py-3.5 px-4 min-w-[210px]">
                  <div className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400">
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email Resmi Satker (API)</span>
                  </div>
                </th>
                <th className="py-3.5 px-4 min-w-[280px]">Rincian Kontak 8 Pejabat &amp; Operator</th>
                <th className="py-3.5 px-4 min-w-[250px]">
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <Users className="w-3.5 h-3.5" />
                    <span>Kontak Tambahan (Pendaftaran SAKTI)</span>
                  </div>
                </th>
                <th className="py-3.5 px-4 text-center">Password Satker</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredSatkers.length === 0 ? (
                <tr>
                  <td colSpan={isAdminAuthenticated ? 9 : 8} className="py-16 text-center text-slate-400">
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
                  const currentEmail = satker.emailPic || satker.emailSatker || satker.email;
                  const roleEmails = [
                    po.kpa?.email, po.ppk?.email, po.ppspm?.email, po.bendahara?.email,
                    po.operatorPembayaran?.email, po.operatorKomitmen?.email, po.operatorGaji?.email, po.operatorPelaporan?.email
                  ].filter(Boolean);

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

                      {/* Email Resmi Satker (API Ready) */}
                      <td className="py-3.5 px-4 min-w-[210px]">
                        {currentEmail ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              {isTamu ? (
                                <span
                                  className="inline-flex items-center gap-1.5 font-mono font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 px-2 py-1 rounded-lg text-[11px] truncate max-w-[200px] border border-slate-200 dark:border-slate-700"
                                  title="Email resmi disensor untuk akun Tamu"
                                >
                                  <Mail className="w-3 h-3 shrink-0 text-slate-400" />
                                  <span className="truncate">{maskEmail(currentEmail)}</span>
                                </span>
                              ) : (
                                <>
                                  <a
                                    href={`mailto:${currentEmail}`}
                                    className="inline-flex items-center gap-1.5 font-mono font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/70 hover:bg-sky-100 dark:hover:bg-sky-900/60 px-2 py-1 rounded-lg text-[11px] transition-colors truncate max-w-[200px] border border-sky-200/60 dark:border-sky-800/60"
                                    title={`Kirim email ke ${currentEmail}`}
                                  >
                                    <Mail className="w-3 h-3 shrink-0 text-sky-500" />
                                    <span className="truncate">{currentEmail}</span>
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyText(currentEmail, `Email ${satker.kodeSatker}`)}
                                    className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer shrink-0"
                                    title="Salin alamat email"
                                  >
                                    {copiedText === currentEmail ? (
                                      <Check className="w-3 h-3 text-emerald-500" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                </>
                              )}
                              {isAdminAuthenticated && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenQuickEmail(satker)}
                                  className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors cursor-pointer shrink-0"
                                  title="Ubah alamat email Satker ini"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>

                            {roleEmails.length > 0 && (
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span>+{roleEmails.length} email pejabat/operator {isTamu ? '(disensor)' : ''}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-dashed border-amber-300 dark:border-amber-800">
                              <Mail className="w-3 h-3 text-amber-500" />
                              <span>Belum ada email</span>
                            </span>
                            {isAdminAuthenticated && (
                              <button
                                type="button"
                                onClick={() => handleOpenQuickEmail(satker)}
                                className="text-[10px] font-bold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                                title="Isi email satker ini"
                              >
                                + Isi
                              </button>
                            )}
                          </div>
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
                              {isTamu ? (
                                <span
                                  className="inline-flex items-center gap-1 font-mono font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-[11px] border border-slate-200 dark:border-slate-700"
                                  title="Nomor HP disensor untuk akun Tamu"
                                >
                                  <Phone className="w-3 h-3 text-slate-400" />
                                  <span>{maskPhone(satker.noHpPic)}</span>
                                </span>
                              ) : (
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
                              )}
                              {satker.namaPic && (
                                <span className="text-[11px] text-slate-500 truncate max-w-[120px]">
                                  ({isTamu ? maskNama(satker.namaPic) : satker.namaPic})
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Kontak belum lengkap</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Kontak Tambahan dari Pendaftaran SAKTI (Opsi Cadangan KPPN) */}
                      <td className="py-3.5 px-4 min-w-[250px]">
                        {(() => {
                          const saktiUsers = saktiUsersMap[satker.kodeSatker] || [];
                          if (saktiUsers.length === 0) {
                            return (
                              <div className="text-slate-400 dark:text-slate-500 text-[11px] italic flex items-center gap-1">
                                <span>-</span>
                                <span className="text-[10px]">(Belum ada pendaftaran SAKTI)</span>
                              </div>
                            );
                          }

                          return (
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  {saktiUsers.length} User SAKTI
                                </span>
                                {filledCount === 0 && !satker.noHpPic && (
                                  <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                                    Opsi Kontak KPPN
                                  </span>
                                )}
                              </div>

                              <div className="space-y-1">
                                {saktiUsers.slice(0, 2).map((usr) => {
                                  const waUrl = formatWhatsAppUrl(usr.noHp, `Halo Bapak/Ibu ${usr.namaLengkap}, kami dari KPPN Semarang I terkait koordinasi Satker ${satker.kodeSatker} - ${satker.namaSatker}`);
                                  const telUrl = formatTelUrl(usr.noHp);

                                  return (
                                    <div key={usr.id} className="flex items-center justify-between gap-1.5 p-1.5 rounded-lg bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-[11px]">
                                      <div className="min-w-0 flex-1">
                                        <div className="font-bold text-slate-800 dark:text-slate-200 truncate">
                                          {isTamu ? maskNama(usr.namaLengkap) : usr.namaLengkap}
                                        </div>
                                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                          {usr.jabatanPerbendaharaan || usr.peranJabatan || (usr.roles && usr.roles.length > 0 ? usr.roles[0] : 'Operator SAKTI')}
                                        </div>
                                      </div>
                                      {usr.noHp ? (
                                        isTamu ? (
                                          <span className="inline-flex items-center gap-1 font-mono font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px] border border-slate-200 dark:border-slate-700">
                                            <Phone className="w-2.5 h-2.5 text-slate-400" />
                                            <span>{maskPhone(usr.noHp)}</span>
                                          </span>
                                        ) : (
                                          <div className="flex items-center gap-1 shrink-0">
                                            <a
                                              href={waUrl}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="inline-flex items-center gap-1 font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 px-1.5 py-0.5 rounded text-[10px] transition-colors"
                                              title={`Kirim pesan WhatsApp ke ${usr.namaLengkap} (${usr.noHp})`}
                                            >
                                              <MessageSquare className="w-2.5 h-2.5" />
                                              <span>{usr.noHp}</span>
                                            </a>
                                            <a
                                              href={telUrl}
                                              className="p-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                                              title="Panggil nomor telepon"
                                            >
                                              <Phone className="w-2.5 h-2.5" />
                                            </a>
                                          </div>
                                        )
                                      ) : (
                                        <span className="text-[10px] text-slate-400 italic shrink-0">No HP -</span>
                                      )}
                                    </div>
                                  );
                                })}

                                {saktiUsers.length > 2 && (
                                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold pl-1">
                                    +{saktiUsers.length - 2} kontak lainnya {isTamu ? '(disensor)' : '(buka rincian)'}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })()}
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
                          <div className="inline-flex flex-col items-center gap-0.5">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                              <Lock className="w-3 h-3 text-amber-500" />
                              <span>Terlindungi</span>
                            </span>
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">
                              Hubungi Admin KPPN
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenPejabatModal(satker)}
                            className={`font-extrabold text-xs px-3 py-1.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                              isTamu
                                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20'
                                : 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-600/20'
                            }`}
                            title={
                              isTamu
                                ? "Buka rincian kontak pejabat (Mode Tamu: Data Disensor)"
                                : "Buka form pengisian kontak KPA, PPK, PPSPM, Bendahara & Operator Satker"
                            }
                          >
                            {isTamu ? <ShieldAlert className="w-3.5 h-3.5 text-amber-200" /> : <User className="w-3.5 h-3.5" />}
                            <span>{isTamu ? "Lihat Kontak (Disensor)" : "Isi / Kelola Kontak"}</span>
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
                  {isTamu ? (
                    <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 p-4 rounded-2xl flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                        <ShieldAlert className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-amber-950 dark:text-amber-200 text-xs uppercase tracking-wide">
                            Mode Tamu / Studi Banding — Data Rahasia Terproteksi &amp; Disensor
                          </span>
                          <span className="text-[10px] bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 font-extrabold px-2.5 py-0.5 rounded-full border border-amber-300 dark:border-amber-700">
                            Akses Read-Only
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-800/90 dark:text-amber-300/90 mt-1 leading-relaxed">
                          Sesuai standar operasional keamanan dan perlindungan privasi data Satker mitra KPPN Semarang I, seluruh informasi kontak rahasia (Nama Lengkap, Nomor HP/WhatsApp, NIP, Email Resmi, Alamat, dan Password Satker) disensor secara otomatis. Tamu studi banding tidak dapat melihat data sensitif maupun mengubah isian kontak satker.
                        </p>
                      </div>
                    </div>
                  ) : (
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
                  )}

                  {/* Section A: 4 Pejabat Utama Perbendaharaan */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                      <Briefcase className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                      <h4 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                        A. Pejabat Perbendaharaan Satker (KPA / PPK / PPSPM / Bendahara)
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {renderRoleCard('kpa', 'Kuasa Pengguna Anggaran (KPA)', 1, 'sky')}
                      {renderRoleCard('ppk', 'Pejabat Pembuat Komitmen (PPK)', 2, 'sky')}
                      {renderRoleCard('ppspm', 'Pejabat Penandatangan SPM (PPSPM)', 3, 'sky')}
                      {renderRoleCard('bendahara', 'Bendahara Pengeluaran', 4, 'sky')}
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
                      {renderRoleCard('operatorPembayaran', 'Operator Pembayaran (SPM / SP2D)', 5, 'indigo')}
                      {renderRoleCard('operatorKomitmen', 'Operator Komitmen (Kontrak & BAST)', 6, 'indigo')}
                      {renderRoleCard('operatorGaji', 'Operator Gaji (PPABP / GPP)', 7, 'indigo')}
                      {renderRoleCard('operatorPelaporan', 'Operator Pelaporan / Capaian Output (GLP)', 8, 'indigo')}
                    </div>
                  </div>

                  {/* Section C: Kontak Tambahan dari Pendaftaran User SAKTI (Opsi Kontak KPPN) */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <h4 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                          C. Kontak Tambahan Dari Pendaftaran User SAKTI (Data KPPN)
                        </h4>
                      </div>
                      <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                        {modalSaktiUsers.length} Kontak Terdaftar
                      </span>
                    </div>

                    <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl text-[11px] text-emerald-900 dark:text-emerald-200 flex items-start gap-2.5">
                      <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-bold">Kolom Tambahan Kontak Cadangan KPPN:</p>
                        <p className="text-slate-600 dark:text-slate-400 text-[10px] leading-relaxed">
                          Kolom ini disinkronkan otomatis dari menu <strong>Pendaftaran User SAKTI</strong> untuk Satker <strong>{selectedSatkerForPejabat?.kodeSatker}</strong>. Apabila Satker belum mengisi kolom permanen (KPA, PPK, PPSPM, Bendahara, Operator) di atas, KPPN memiliki opsi menghubungi kontak dari pendaftaran user di bawah ini. {isTamu ? 'Khusus akun Tamu, seluruh nomor HP, NIP, dan email disensor.' : ''}
                        </p>
                      </div>
                    </div>

                    {copyFeedbackToast && (
                      <div className="p-2.5 bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-md animate-in fade-in slide-in-from-top-1">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>{copyFeedbackToast}</span>
                      </div>
                    )}

                    {modalSaktiUsers.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {modalSaktiUsers.map((usr, uIdx) => {
                          const waUrl = formatWhatsAppUrl(usr.noHp, `Halo Bapak/Ibu ${usr.namaLengkap}, kami dari KPPN Semarang I terkait koordinasi Satker ${selectedSatkerForPejabat?.kodeSatker} - ${selectedSatkerForPejabat?.namaSatker}`);
                          const telUrl = formatTelUrl(usr.noHp);

                          return (
                            <div 
                              key={usr.id || uIdx}
                              className={`p-4 rounded-2xl border space-y-3 transition-all ${
                                isDark ? 'bg-slate-950/70 border-slate-800 hover:border-slate-700' : 'bg-slate-50/80 border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 block">
                                    Pengguna SAKTI #{uIdx + 1}
                                  </span>
                                  <h5 className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                                    {isTamu ? maskNama(usr.namaLengkap) : usr.namaLengkap}
                                  </h5>
                                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                    {usr.jabatanPerbendaharaan || usr.peranJabatan || usr.jabatan || 'Pejabat/Operator SAKTI'}
                                    {usr.nip ? ` • NIP: ${isTamu ? maskNip(usr.nip) : usr.nip}` : ''}
                                  </p>
                                </div>
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
                                  {usr.roles && usr.roles.length > 0 ? `${usr.roles.length} Role` : 'SAKTI'}
                                </span>
                              </div>

                              {usr.roles && usr.roles.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {usr.roles.slice(0, 4).map((r, rIdx) => (
                                    <span key={rIdx} className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                                      {r}
                                    </span>
                                  ))}
                                  {usr.roles.length > 4 && (
                                    <span className="text-[9px] text-slate-400 px-1 py-0.5">
                                      +{usr.roles.length - 4} lagi
                                    </span>
                                  )}
                                </div>
                              )}

                              <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-2">
                                <div>
                                  <span className="text-[9px] text-slate-400 block">Nomor WhatsApp / HP:</span>
                                  <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200">
                                    {isTamu ? maskPhone(usr.noHp) : (usr.noHp || '-')}
                                  </span>
                                </div>

                                {usr.noHp ? (
                                  isTamu ? (
                                    <span className="inline-flex items-center gap-1 font-mono font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-[10px] border border-slate-200 dark:border-slate-700">
                                      <Lock className="w-2.5 h-2.5 text-amber-500" />
                                      <span>Disensor</span>
                                    </span>
                                  ) : (
                                    <div className="flex items-center gap-1 shrink-0">
                                      <a
                                        href={waUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-lg shadow-xs transition-all cursor-pointer"
                                        title="Kirim pesan WhatsApp"
                                      >
                                        <MessageSquare className="w-3 h-3" />
                                        <span>WhatsApp</span>
                                      </a>
                                      <a
                                        href={telUrl}
                                        className="inline-flex items-center gap-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-[10px] p-1.5 rounded-lg transition-colors cursor-pointer"
                                        title="Hubungi Telepon"
                                      >
                                        <Phone className="w-3 h-3" />
                                      </a>
                                    </div>
                                  )
                                ) : (
                                  <span className="text-[10px] text-slate-400 italic">Tidak ada nomor</span>
                                )}
                              </div>

                              {usr.email && (
                                <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800/80 flex items-center justify-between gap-2">
                                  <div className="min-w-0 flex-1">
                                    <span className="text-[9px] text-slate-400 block">Email Pengguna:</span>
                                    <span className="font-mono text-[11px] text-sky-600 dark:text-sky-400 truncate block">
                                      {isTamu ? maskEmail(usr.email) : usr.email}
                                    </span>
                                  </div>
                                  {!isTamu && (
                                    <div className="flex items-center gap-1 shrink-0">
                                      <a
                                        href={`mailto:${usr.email}`}
                                        className="inline-flex items-center gap-1 bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-300 font-bold text-[10px] px-2 py-1 rounded-lg border border-sky-200 dark:border-sky-800 transition-colors"
                                        title="Kirim email"
                                      >
                                        <Mail className="w-3 h-3 text-sky-500" />
                                        <span>Email</span>
                                      </a>
                                      <button
                                        type="button"
                                        onClick={() => handleCopyText(usr.email!, `Email ${usr.namaLengkap}`)}
                                        className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                                        title="Salin alamat email"
                                      >
                                        <Copy className="w-3 h-3" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Quick Apply to Permanent Fields above (Hidden for Tamu) */}
                              {!isTamu && (
                                <div className="pt-2 border-t border-dashed border-slate-200 dark:border-slate-800">
                                  <span className="text-[9px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                                    Terapkan Kontak Ini ke Form Permanen:
                                  </span>
                                  <div className="flex flex-wrap gap-1">
                                    {[
                                      { key: 'kpa', label: 'KPA' },
                                      { key: 'ppk', label: 'PPK' },
                                      { key: 'ppspm', label: 'PPSPM' },
                                      { key: 'bendahara', label: 'Bendahara' },
                                      { key: 'operatorPembayaran', label: 'Op. Bayar' },
                                      { key: 'operatorKomitmen', label: 'Op. Komitmen' }
                                    ].map((target) => (
                                      <button
                                        key={target.key}
                                        type="button"
                                        onClick={() => {
                                          setPejabatFormData(prev => ({
                                            ...prev,
                                            [target.key]: {
                                              nama: usr.namaLengkap,
                                              noHp: usr.noHp || '',
                                              nip: usr.nip || '',
                                              email: usr.email || ''
                                            }
                                          }));
                                          setCopyFeedbackToast(`Kontak "${usr.namaLengkap}" berhasil disalin ke kolom permanen ${target.label}`);
                                        }}
                                        className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-200/80 hover:bg-emerald-100 hover:text-emerald-800 dark:bg-slate-800 dark:hover:bg-emerald-950 dark:hover:text-emerald-300 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                                        title={`Salin data ${usr.namaLengkap} ke kolom permanen ${target.label}`}
                                      >
                                        + {target.label}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className={`p-5 rounded-2xl border text-center space-y-2 ${
                        isDark ? 'bg-slate-950/40 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
                      }`}>
                        <Users className="w-8 h-8 mx-auto text-slate-400 opacity-60" />
                        <p className="font-bold text-xs">Belum ada pengguna terdaftar di Pendaftaran User SAKTI untuk Satker ini</p>
                        <p className="text-[11px] max-w-md mx-auto">
                          Setelah data user atau nomor handphone diinput di menu Pendaftaran User SAKTI, kontak akan otomatis muncul pada kolom tambahan ini sebagai opsi cadangan untuk KPPN.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Section D: Kontak Utama Satker & Pengaturan Password Satker */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                      <Shield className="w-4 h-4 text-amber-500" />
                      <h4 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                        D. Kontak Resmi Satker &amp; Keamanan Password
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          {isTamu && <Lock className="w-2.5 h-2.5 inline mr-1 text-amber-500" />} Email Resmi Satker {isTamu ? '(Disensor)' : ''}:
                        </label>
                        <input
                          type={isTamu ? "text" : "email"}
                          placeholder="satker@kemenkeu.go.id"
                          value={isTamu ? maskEmail(pejabatFormData.emailPic) : pejabatFormData.emailPic}
                          disabled={isTamu}
                          readOnly={isTamu}
                          onChange={(e) => setPejabatFormData({ ...pejabatFormData, emailPic: e.target.value })}
                          className={`w-full text-xs rounded-xl p-2.5 border ${
                            isTamu 
                              ? 'bg-slate-100 dark:bg-slate-800/80 text-slate-500 cursor-not-allowed border-slate-300 dark:border-slate-700 font-mono' 
                              : isDark ? 'bg-slate-950 text-white border-slate-700' : 'bg-white text-slate-900 border-slate-300'
                          }`}
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
                      ) : isTamu ? (
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                            Status Keamanan Password:
                          </label>
                          <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                            isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                          }`}>
                            <div className="flex items-center gap-2">
                              <Lock className="w-4 h-4 text-amber-500 shrink-0" />
                              <span className="text-xs font-semibold font-mono">•••••••••••• (Rahasia Satker)</span>
                            </div>
                            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-800">
                              Hubungi Admin KPPN
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                            Kredensial password dilindungi. Akun Tamu tidak dapat melihat atau mengubah password satker.
                          </p>
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
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        {isTamu && <Lock className="w-2.5 h-2.5 inline mr-1 text-amber-500" />} Alamat Lengkap Kantor Satker {isTamu ? '(Disensor)' : ''}:
                      </label>
                      <input
                        type="text"
                        placeholder="Alamat kantor satker"
                        value={isTamu ? maskAddress(pejabatFormData.alamatSatker) : pejabatFormData.alamatSatker}
                        disabled={isTamu}
                        readOnly={isTamu}
                        onChange={(e) => setPejabatFormData({ ...pejabatFormData, alamatSatker: e.target.value })}
                        className={`w-full text-xs rounded-xl p-2.5 border ${
                          isTamu 
                            ? 'bg-slate-100 dark:bg-slate-800/80 text-slate-500 cursor-not-allowed border-slate-300 dark:border-slate-700 font-mono' 
                            : isDark ? 'bg-slate-950 text-white border-slate-700' : 'bg-white text-slate-900 border-slate-300'
                        }`}
                      />
                    </div>
                  </div>

                </div>
              )}

            </div>

            {/* Modal Footer */}
            {isPasswordUnlocked && (
              <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/80 shrink-0">
                {isTamu ? (
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 font-semibold">
                      <ShieldAlert className="w-4 h-4 shrink-0" />
                      <span>Mode Tamu / Studi Banding: Hak Akses Baca Terproteksi (Read-Only &amp; Disensor)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsPejabatModalOpen(false)}
                      className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl cursor-pointer transition-colors active:scale-95"
                    >
                      Tutup
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-end gap-3 w-full">
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

              {/* Email Resmi & Kontak PIC (API Ready) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-extrabold block text-slate-700 dark:text-slate-300 mb-1">
                    Email Resmi Satker (Untuk API Email &amp; Notifikasi):
                  </label>
                  <input
                    type="email"
                    placeholder="satker@kemenkeu.go.id"
                    value={formData.emailPic || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      emailPic: e.target.value,
                      emailSatker: e.target.value,
                      email: e.target.value
                    })}
                    className={`w-full text-xs rounded-xl p-2.5 border focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                      isDark ? 'bg-slate-950 text-slate-100 border-slate-800' : 'bg-slate-50 text-slate-900 border-slate-300'
                    }`}
                  />
                </div>

                <div>
                  <label className="font-extrabold block text-slate-700 dark:text-slate-300 mb-1">
                    Nomor WhatsApp / HP PIC Satker:
                  </label>
                  <input
                    type="text"
                    placeholder="081234567890"
                    value={formData.noHpPic || ''}
                    onChange={(e) => setFormData({ ...formData, noHpPic: e.target.value })}
                    className={`w-full font-mono text-xs rounded-xl p-2.5 border focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                      isDark ? 'bg-slate-950 text-slate-100 border-slate-800' : 'bg-slate-50 text-slate-900 border-slate-300'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-extrabold block text-slate-700 dark:text-slate-300 mb-1">
                    Nama PIC Utama Satker:
                  </label>
                  <input
                    type="text"
                    placeholder="Nama PIC Satker"
                    value={formData.namaPic || ''}
                    onChange={(e) => setFormData({ ...formData, namaPic: e.target.value })}
                    className={`w-full text-xs rounded-xl p-2.5 border focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                      isDark ? 'bg-slate-950 text-slate-100 border-slate-800' : 'bg-slate-50 text-slate-900 border-slate-300'
                    }`}
                  />
                </div>

                <div>
                  <label className="font-extrabold block text-slate-700 dark:text-slate-300 mb-1">
                    Alamat Lengkap Kantor Satker:
                  </label>
                  <input
                    type="text"
                    placeholder="Alamat kantor satker"
                    value={formData.alamatSatker || ''}
                    onChange={(e) => setFormData({ ...formData, alamatSatker: e.target.value })}
                    className={`w-full text-xs rounded-xl p-2.5 border focus:outline-none focus:ring-2 focus:ring-sky-500 ${
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
                Password ini terintegrasi penuh untuk seluruh portal Satker: <strong>Simulasi IKPA</strong>, form kontak 8 pejabat & operator SAKTI, transaksi KKP, serta Digipay.
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

      {/* MODAL 4: QUICK EDIT EMAIL SATKER (ADMIN ONLY) */}
      {quickEmailModal.isOpen && quickEmailModal.satker && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className={`rounded-3xl border shadow-2xl max-w-md w-full p-6 space-y-5 ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 rounded-xl">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-sky-600 dark:text-sky-400">
                    KELOLA EMAIL RESMI (API READY)
                  </span>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Ubah Email Satker
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuickEmailModal({ isOpen: false, satker: null, emailValue: '' })}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-1">
              <div className="font-extrabold text-slate-900 dark:text-white">
                {quickEmailModal.satker.namaSatker}
              </div>
              <div className="flex items-center gap-3 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                <span>Kode: <strong>{quickEmailModal.satker.kodeSatker}</strong></span>
                <span>BA: <strong>{quickEmailModal.satker.kodeBa || resolveKodeBA(quickEmailModal.satker)}</strong></span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block mb-1">
                  Alamat Email Resmi Satker:
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="email"
                    value={quickEmailModal.emailValue}
                    onChange={(e) => setQuickEmailModal(prev => ({ ...prev, emailValue: e.target.value }))}
                    placeholder="contoh: satker651046@kemenkeu.go.id"
                    className={`w-full font-mono text-xs rounded-xl pl-10 pr-3.5 py-3 border focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                      isDark ? 'bg-slate-950 text-white border-slate-700' : 'bg-white text-slate-900 border-slate-300'
                    }`}
                  />
                </div>
              </div>

              {quickEmailModal.emailValue && (
                <div className="flex items-center justify-between text-[11px] p-2.5 bg-sky-50 dark:bg-sky-950/40 rounded-xl border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    Format email terisi
                  </span>
                  <a
                    href={`mailto:${quickEmailModal.emailValue}`}
                    className="font-bold text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-1"
                  >
                    <span>Kirim Test</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Email resmi ini digunakan sebagai target integrasi API Email Gateway KPPN, blast pengingat Capaian Output, serta notifikasi monev IKPA Satker.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setQuickEmailModal({ isOpen: false, satker: null, emailValue: '' })}
                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs px-4 py-2 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveQuickEmail}
                className="bg-sky-600 hover:bg-sky-500 text-white font-black text-xs px-5 py-2 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Email</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: INTEGRASI API EMAIL GATEWAY & FORMAT DATA HELPER */}
      {isApiEmailModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
          <div className={`rounded-3xl border shadow-2xl max-w-4xl w-full my-6 flex flex-col max-h-[92vh] overflow-hidden ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-950 via-sky-950 to-indigo-950 text-white p-5 sm:p-6 border-b border-slate-800 flex items-start justify-between relative shrink-0">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 bg-sky-500/20 border border-sky-400/40 text-sky-200 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">
                  <Mail className="w-3 h-3 text-sky-400" />
                  <span>INTEGRASI API EMAIL GATEWAY KPPN</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                  <span>Portal Format API Email Satker</span>
                </h2>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  Gunakan format data di bawah ini untuk menghubungkan data email Satker ke API Email Anda (Nodemailer, SendGrid, Mailgun, Resend, atau REST API Email KPPN).
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsApiEmailModalOpen(false)}
                className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Scope & Tab Toolbar */}
            <div className="p-4 sm:px-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex flex-wrap items-center justify-between gap-3 shrink-0">
              {/* Tab Selector */}
              <div className="flex items-center gap-1.5 bg-slate-200/80 dark:bg-slate-800 p-1 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setApiEmailTab('csv')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                    apiEmailTab === 'csv'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Daftar Koma / CSV</span>
                </button>

                <button
                  type="button"
                  onClick={() => setApiEmailTab('json')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                    apiEmailTab === 'json'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>Payload JSON API</span>
                </button>

                <button
                  type="button"
                  onClick={() => setApiEmailTab('curl')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                    apiEmailTab === 'curl'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Contoh cURL / Fetch</span>
                </button>
              </div>

              {/* Scope Selector */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-500">Cakupan Email:</span>
                <select
                  value={apiEmailScope}
                  onChange={(e) => setApiEmailScope(e.target.value as any)}
                  className={`text-xs font-bold rounded-xl px-3 py-1.5 border focus:outline-none focus:ring-1 focus:ring-sky-500 ${
                    isDark ? 'bg-slate-950 text-slate-200 border-slate-800' : 'bg-white text-slate-800 border-slate-300'
                  }`}
                >
                  <option value="resmi">Email Resmi Satker Saja ({totalWithEmail} Satker)</option>
                  <option value="all_contacts">Semua Kontak (+ Email Pejabat/Operator &amp; SAKTI)</option>
                </select>
              </div>
            </div>

            {/* Modal Content Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              {/* Quick Metrics Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Master Satker</span>
                  <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{totalMaster} Satker</div>
                </div>

                <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-sky-950/30 border-sky-800/60' : 'bg-sky-50/80 border-sky-200'}`}>
                  <span className="text-[10px] uppercase font-bold text-sky-600 dark:text-sky-400 block">Satker Siap API Email</span>
                  <div className="text-xl font-black text-sky-600 dark:text-sky-400 mt-0.5">
                    {totalWithEmail} Satker ({totalMaster > 0 ? Math.round((totalWithEmail / totalMaster) * 100) : 0}%)
                  </div>
                </div>

                <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-amber-950/30 border-amber-800/60' : 'bg-amber-50/80 border-amber-200'}`}>
                  <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 block">Belum Ada Email Resmi</span>
                  <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5">
                    {totalNoEmail} Satker
                  </div>
                </div>
              </div>

              {/* TAB 1: CSV / LIST KOMA */}
              {apiEmailTab === 'csv' && (() => {
                const emailsList: string[] = [];
                masterSatkers.forEach(m => {
                  const main = m.emailPic || m.emailSatker || m.email;
                  if (main && !emailsList.includes(main)) emailsList.push(main);
                  if (apiEmailScope === 'all_contacts' && m.pejabatOperator) {
                    const po = m.pejabatOperator;
                    [
                      po.kpa?.email, po.ppk?.email, po.ppspm?.email, po.bendahara?.email,
                      po.operatorPembayaran?.email, po.operatorKomitmen?.email, po.operatorGaji?.email, po.operatorPelaporan?.email
                    ].forEach(e => {
                      if (e && !emailsList.includes(e)) emailsList.push(e);
                    });
                  }
                  if (apiEmailScope === 'all_contacts') {
                    const sUsers = saktiUsersMap[m.kodeSatker] || [];
                    sUsers.forEach(u => {
                      if (u.email && !emailsList.includes(u.email)) emailsList.push(u.email);
                    });
                  }
                });

                const csvString = emailsList.join(', ');

                return (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-700 dark:text-slate-300">
                        Daftar Alamat Email ({emailsList.length} Alamat Siap Kirim):
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopyText(csvString, `${emailsList.length} Alamat Email`)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-xs cursor-pointer active:scale-95 transition-all"
                        >
                          {copiedText === csvString ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedText === csvString ? 'Tersalin!' : 'Salin Semua Email'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const blob = new Blob([csvString], { type: 'text/plain;charset=utf-8' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `daftar_email_satker_${Date.now()}.txt`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                            triggerToast('File daftar email berhasil diunduh!');
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Unduh .txt</span>
                        </button>
                      </div>
                    </div>

                    <div className="relative">
                      <textarea
                        readOnly
                        rows={10}
                        value={csvString || '(Belum ada data email terdaftar. Silakan upload Excel kontak atau isi email satker)'}
                        className={`w-full font-mono text-xs p-4 rounded-2xl border resize-y focus:outline-none ${
                          isDark ? 'bg-slate-950 text-sky-300 border-slate-800' : 'bg-slate-50 text-slate-800 border-slate-300'
                        }`}
                      />
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      Format di atas dapat langsung disalin ke kolom <strong>BCC</strong> email klien (Gmail / Outlook / Mail Gateway) atau dipisahkan dengan koma untuk parameter pengiriman API massal.
                    </p>
                  </div>
                );
              })()}

              {/* TAB 2: JSON API PAYLOAD */}
              {apiEmailTab === 'json' && (() => {
                const targetSatkers = masterSatkers.filter(m => !!(m.emailPic || m.emailSatker || m.email || apiEmailScope === 'all_contacts'));
                const jsonData = targetSatkers.map(m => {
                  const emailResmi = m.emailPic || m.emailSatker || m.email || null;
                  const po = m.pejabatOperator || {};
                  return {
                    kodeSatker: m.kodeSatker,
                    namaSatker: m.namaSatker,
                    emailResmi: emailResmi,
                    kodeBa: m.kodeBa || '018',
                    kementerianLembaga: m.kementerianLembaga || 'Kementerian / Lembaga Mitra',
                    kontakUtama: {
                      nama: m.namaPic || null,
                      noHp: m.noHpPic || null,
                      alamat: m.alamatSatker || null
                    },
                    pejabatOperator: {
                      kpa: { nama: po.kpa?.nama || null, noHp: po.kpa?.noHp || null, email: po.kpa?.email || null },
                      ppk: { nama: po.ppk?.nama || null, noHp: po.ppk?.noHp || null, email: po.ppk?.email || null },
                      ppspm: { nama: po.ppspm?.nama || null, noHp: po.ppspm?.noHp || null, email: po.ppspm?.email || null },
                      bendahara: { nama: po.bendahara?.nama || null, noHp: po.bendahara?.noHp || null, email: po.bendahara?.email || null },
                      operatorPembayaran: { nama: po.operatorPembayaran?.nama || null, noHp: po.operatorPembayaran?.noHp || null, email: po.operatorPembayaran?.email || null },
                      operatorKomitmen: { nama: po.operatorKomitmen?.nama || null, noHp: po.operatorKomitmen?.noHp || null, email: po.operatorKomitmen?.email || null },
                      operatorGaji: { nama: po.operatorGaji?.nama || null, noHp: po.operatorGaji?.noHp || null, email: po.operatorGaji?.email || null },
                      operatorPelaporan: { nama: po.operatorPelaporan?.nama || null, noHp: po.operatorPelaporan?.noHp || null, email: po.operatorPelaporan?.email || null }
                    }
                  };
                });

                const jsonString = JSON.stringify(jsonData, null, 2);

                return (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-700 dark:text-slate-300">
                        Payload JSON Format API ({jsonData.length} Satker):
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopyText(jsonString, 'Payload JSON API Email')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-xs cursor-pointer active:scale-95 transition-all"
                        >
                          {copiedText === jsonString ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedText === jsonString ? 'Tersalin!' : 'Salin JSON API'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `satker_email_api_payload_${Date.now()}.json`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                            triggerToast('File payload JSON berhasil diunduh!');
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Unduh .json</span>
                        </button>
                      </div>
                    </div>

                    <div className="relative">
                      <textarea
                        readOnly
                        rows={12}
                        value={jsonString}
                        className={`w-full font-mono text-[11px] p-4 rounded-2xl border resize-y focus:outline-none ${
                          isDark ? 'bg-slate-950 text-emerald-400 border-slate-800' : 'bg-slate-950 text-emerald-300 border-slate-800'
                        }`}
                      />
                    </div>
                  </div>
                );
              })()}

              {/* TAB 3: cURL & FETCH INTEGRATION CODE SNIPPET */}
              {apiEmailTab === 'curl' && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                      Panduan Pemanggilan Endpoint API Email
                    </h4>
                    <p className="text-slate-500 dark:text-slate-400 text-xs">
                      Berikut adalah contoh implementasi pemanggilan API Email menggunakan Node.js fetch atau cURL ke endpoint email gateway:
                    </p>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Contoh cURL:</span>
                    <pre className="p-4 rounded-2xl bg-slate-950 text-sky-300 font-mono text-[11px] overflow-x-auto border border-slate-800">
{`curl -X POST https://api-email.kppn-semarang1.id/v1/send-broadcast \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_EMAIL_API_KEY" \\
  -d '{
    "sender": "kppn026.monev@kemenkeu.go.id",
    "subject": "[KPPN 026] Pemberitahuan Batas Akhir Capaian Output Triwulan III",
    "recipients": [
      "satker651046@kemdikbud.go.id",
      "kpp.candisari@pajak.go.id"
    ],
    "messageHtml": "<h1>Yth. Kuasa Pengguna Anggaran & Operator Satker</h1><p>Mohon segera melengkapi pelaporan Capaian Output...</p>"
  }'`}
                    </pre>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Contoh Node.js / JavaScript Fetch:</span>
                    <pre className="p-4 rounded-2xl bg-slate-950 text-indigo-300 font-mono text-[11px] overflow-x-auto border border-slate-800">
{`// Contoh pemanggilan API Email dari Node.js / script otomasi KPPN
async function kirimEmailSatker(recipients, subject, htmlBody) {
  const response = await fetch('https://api-email.kppn-semarang1.id/v1/send-broadcast', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + process.env.EMAIL_API_KEY
    },
    body: JSON.stringify({
      sender: 'kppn026.monev@kemenkeu.go.id',
      recipients: recipients,
      subject: subject,
      messageHtml: htmlBody
    })
  });
  return await response.json();
}`}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50 shrink-0">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Format kompatibel dengan seluruh Email Gateway (SMTP / REST API / Webhook)</span>
              </div>

              <button
                type="button"
                onClick={() => setIsApiEmailModalOpen(false)}
                className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer"
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
