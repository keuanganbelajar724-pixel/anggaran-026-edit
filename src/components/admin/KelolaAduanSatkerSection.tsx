import { safeLocalStorageSet } from '../../utils/safeStorage';
import React, { useState } from 'react';
import { PaginationControl } from '../PaginationControl';
import { 
  ShieldAlert, 
  Phone, 
  Search, 
  Filter, 
  Plus, 
  FileDown, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  AlertTriangle,
  XCircle, 
  ExternalLink, 
  MessageSquare, 
  Trash2, 
  Eye, 
  Save, 
  Lock, 
  Unlock,
  KeyRound,
  EyeOff,
  ShieldCheck,
  Building2, 
  Mail, 
  User, 
  Send,
  Sparkles,
  Zap,
  Activity,
  Check,
  X,
  RefreshCw,
  RotateCcw,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import { 
  AduanSatkerRecord, 
  AduanStatus, 
  AduanKategori, 
  DashboardConfig, 
  AppTheme 
} from '../../types';

interface KelolaAduanSatkerSectionProps {
  aduanList: AduanSatkerRecord[];
  onUpdateAduanList: (newList: AduanSatkerRecord[]) => void;
  dashboardConfig: DashboardConfig;
  onUpdateDashboardConfig: (newConfig: DashboardConfig) => void;
  isDark: boolean;
  theme: AppTheme;
  addLog?: (action: string, category: 'AUTH' | 'UPLOAD' | 'SETTINGS' | 'ANNOUNCEMENT' | 'DATA', details: string, status?: 'SUCCESS' | 'WARNING' | 'INFO') => void;
  showToast?: (opts: { message: string; type?: 'success' | 'info' | 'warning' | 'error' }) => void;
}

export const KelolaAduanSatkerSection: React.FC<KelolaAduanSatkerSectionProps> = ({
  aduanList = [],
  onUpdateAduanList,
  dashboardConfig,
  onUpdateDashboardConfig,
  isDark,
  theme,
  addLog,
  showToast
}) => {
  // Filters & Search State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | AduanStatus>('ALL');
  const [filterKategori, setFilterKategori] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Modal Detail & Follow-up State
  const [selectedAduanForDetail, setSelectedAduanForDetail] = useState<AduanSatkerRecord | null>(null);
  const [editingStatus, setEditingStatus] = useState<AduanStatus>('DIPROSES');
  const [editingCatatan, setEditingCatatan] = useState<string>('');
  const [editingPetugas, setEditingPetugas] = useState<string>('');

  // Modal Add Manual Aduan State
  const [showAddManualModal, setShowAddManualModal] = useState<boolean>(false);
  const [manualForm, setManualForm] = useState<{
    aliasPelapor: string;
    namaSatker: string;
    kodeSatker: string;
    kontakHp: string;
    emailPelapor: string;
    kategori: AduanKategori;
    judulAduan: string;
    deskripsi: string;
    urgensi: 'BIASA' | 'PENTING' | 'SANGAT_SEGERA';
    sumber: 'DASHBOARD_FORM' | 'WHATSAPP_MANUAL' | 'TATAP_MUKA' | 'SURAT_RESMI';
  }>({
    aliasPelapor: '',
    namaSatker: '',
    kodeSatker: '',
    kontakHp: '',
    emailPelapor: '',
    kategori: 'Kendala Teknis SAKTI & Rekonsiliasi',
    judulAduan: '',
    deskripsi: '',
    urgensi: 'BIASA',
    sumber: 'TATAP_MUKA'
  });

  // Helpdesk Phone & Settings Quick Form State
  const [helpdeskPhoneInput, setHelpdeskPhoneInput] = useState<string>(dashboardConfig.helpdeskPhone || '081234567890');
  const [helpdeskJamInput, setHelpdeskJamInput] = useState<string>(dashboardConfig.helpdeskJamLayanan || 'Senin - Jumat (08:00 - 16:00 WIB)');
  const [helpdeskPicInput, setHelpdeskPicInput] = useState<string>(dashboardConfig.helpdeskPicName || 'Seksi Kepatuhan Internal & Seksi MSKI');
  const [helpdeskEmailInput, setHelpdeskEmailInput] = useState<string>(dashboardConfig.helpdeskEmail || 'kppn.semarang1@kemenkeu.go.id');
  const [allowPublicTickets, setAllowPublicTickets] = useState<boolean>(dashboardConfig.allowPublicTickets !== false);
  const [isSavedSettings, setIsSavedSettings] = useState<boolean>(false);

  // Kepatuhan Internal (KI) Gatekeeper Security State
  // Sesuai arahan, rincian isi aduan & tiket hanya boleh dilihat oleh Ketua Seksi Kepatuhan Internal
  const currentKiPassword = dashboardConfig.kepatuhanInternalPassword || localStorage.getItem('kppn_ki_password') || 'ki026';
  const isDefaultKiPassword = currentKiPassword === 'ki026';
  const kiPasswordUpdatedAt = dashboardConfig.kepatuhanInternalPasswordUpdatedAt || localStorage.getItem('kppn_ki_password_updated_at') || '';
  const [isKiUnlocked, setIsKiUnlocked] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('kppn_ki_unlocked') === 'true';
    } catch {
      return false;
    }
  });
  const [kiPasswordInput, setKiPasswordInput] = useState<string>('');
  const [showKiPasswordInput, setShowKiPasswordInput] = useState<boolean>(false);
  const [kiPasswordError, setKiPasswordError] = useState<string>('');

  // Modal Ganti Password Kepatuhan Internal
  const [showChangePasswordModal, setShowChangePasswordModal] = useState<boolean>(false);
  const [oldPasswordInput, setOldPasswordInput] = useState<string>('');
  const [newPasswordInput, setNewPasswordInput] = useState<string>('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState<string>('');
  const [showOldPass, setShowOldPass] = useState<boolean>(false);
  const [showNewPass, setShowNewPass] = useState<boolean>(false);
  const [changePasswordError, setChangePasswordError] = useState<string>('');

  // Handle Unlock KI Session
  const handleUnlockKi = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!kiPasswordInput.trim()) {
      setKiPasswordError('Silakan masukkan kata sandi Kepatuhan Internal.');
      return;
    }
    if (kiPasswordInput.trim() === currentKiPassword) {
      setIsKiUnlocked(true);
      setKiPasswordError('');
      setKiPasswordInput('');
      try {
        sessionStorage.setItem('kppn_ki_unlocked', 'true');
      } catch (err) {
        console.warn(err);
      }
      if (showToast) {
        showToast({ message: 'Akses Seksi Kepatuhan Internal Terbuka. Selamat datang Ketua KI.', type: 'success' });
      }
      if (addLog) {
        addLog('Otorisasi Kepatuhan Internal', 'AUTH', 'Ketua Seksi Kepatuhan Internal membuka akses rincian aduan satker.', 'SUCCESS');
      }
    } else {
      setKiPasswordError('Kata sandi Kepatuhan Internal salah! Akses ditolak.');
    }
  };

  // Handle Lock KI Session
  const handleLockKi = () => {
    setIsKiUnlocked(false);
    try {
      sessionStorage.removeItem('kppn_ki_unlocked');
    } catch (err) {
      console.warn(err);
    }
    if (showToast) {
      showToast({ message: 'Sesi rincian tiket aduan telah dikunci kembali.', type: 'info' });
    }
    if (addLog) {
      addLog('Kunci Sesi KI', 'AUTH', 'Sesi data tiket aduan dikunci kembali.', 'INFO');
    }
  };

  // Handle Change KI Password
  const handleChangeKiPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (oldPasswordInput.trim() !== currentKiPassword) {
      setChangePasswordError('Kata sandi lama yang Anda masukkan tidak sesuai.');
      return;
    }
    if (newPasswordInput.trim().length < 4) {
      setChangePasswordError('Kata sandi baru minimal 4 karakter.');
      return;
    }
    if (newPasswordInput !== confirmPasswordInput) {
      setChangePasswordError('Konfirmasi kata sandi baru tidak sama.');
      return;
    }

    const newPass = newPasswordInput.trim();
    const nowIso = new Date().toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) + ' WIB';

    const updatedCfg: DashboardConfig = {
      ...dashboardConfig,
      kepatuhanInternalPassword: newPass,
      kepatuhanInternalPasswordUpdatedAt: nowIso
    };
    onUpdateDashboardConfig(updatedCfg);
    safeLocalStorageSet('kppn_ki_password', newPass);
    safeLocalStorageSet('kppn_ki_password_updated_at', nowIso);

    try {
      const saved = localStorage.getItem('kppn_dashboard_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        parsed.kepatuhanInternalPassword = newPass;
        parsed.kepatuhanInternalPasswordUpdatedAt = nowIso;
        safeLocalStorageSet('kppn_dashboard_config', JSON.stringify(parsed));
      }
    } catch (err) {
      console.warn(err);
    }

    if (showToast) {
      showToast({ message: 'Kata sandi Kepatuhan Internal berhasil diperbarui!', type: 'success' });
    }
    if (addLog) {
      addLog('Ganti Sandi KI', 'SETTINGS', `Kata sandi Seksi Kepatuhan Internal berhasil diperbarui oleh Pengelola KI (${nowIso}).`, 'SUCCESS');
    }

    setShowChangePasswordModal(false);
    setOldPasswordInput('');
    setNewPasswordInput('');
    setConfirmPasswordInput('');
    setChangePasswordError('');
  };

  // Handle Reset KI Password to Default (ki026)
  const handleResetKiPasswordToDefault = () => {
    const updatedCfg: DashboardConfig = {
      ...dashboardConfig,
      kepatuhanInternalPassword: 'ki026',
      kepatuhanInternalPasswordUpdatedAt: ''
    };
    onUpdateDashboardConfig(updatedCfg);
    safeLocalStorageSet('kppn_ki_password', 'ki026');
    try {
      localStorage.removeItem('kppn_ki_password_updated_at');
      const saved = localStorage.getItem('kppn_dashboard_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        parsed.kepatuhanInternalPassword = 'ki026';
        delete parsed.kepatuhanInternalPasswordUpdatedAt;
        safeLocalStorageSet('kppn_dashboard_config', JSON.stringify(parsed));
      }
    } catch (err) {
      console.warn(err);
    }

    if (showToast) {
      showToast({ message: 'Kata sandi Kepatuhan Internal telah di-reset kembali ke bawaan: ki026', type: 'info' });
    }
    if (addLog) {
      addLog('Reset Sandi KI', 'SETTINGS', 'Kata sandi Seksi Kepatuhan Internal dikembalikan ke bawaan sistem (ki026).', 'INFO');
    }

    setShowChangePasswordModal(false);
    setOldPasswordInput('');
    setNewPasswordInput('');
    setConfirmPasswordInput('');
    setChangePasswordError('');
  };

  // Deletion Modal States (Safe, In-App - No Blocked window.confirm)
  const [aduanToDelete, setAduanToDelete] = useState<{ id: string; tiketNomor: string; judul: string } | null>(null);
  const [isConfirmDeleteAllOpen, setIsConfirmDeleteAllOpen] = useState<boolean>(false);

  // Calculate Metrics
  const totalAduan = aduanList.length;
  const countMenunggu = aduanList.filter(a => a.status === 'MENUNGGU').length;
  const countDiproses = aduanList.filter(a => a.status === 'DIPROSES').length;
  const countSelesai = aduanList.filter(a => a.status === 'SELESAI').length;
  const countDitolak = aduanList.filter(a => a.status === 'DITOLAK').length;
  const countAnonim = aduanList.filter(a => a.aliasPelapor?.toLowerCase().includes('anonim') || a.namaSatker?.toLowerCase().includes('anonim')).length;

  // Filtered List
  const filteredAduanList = aduanList.filter(item => {
    // Status filter
    if (filterStatus !== 'ALL' && item.status !== filterStatus) return false;
    // Category filter
    if (filterKategori !== 'ALL' && item.kategori !== filterKategori) return false;
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTiket = item.tiketNomor?.toLowerCase().includes(q);
      const matchPelapor = item.aliasPelapor?.toLowerCase().includes(q);
      const matchSatker = item.namaSatker?.toLowerCase().includes(q) || item.kodeSatker?.toLowerCase().includes(q);
      const matchJudul = item.judulAduan?.toLowerCase().includes(q);
      const matchDeskripsi = item.deskripsi?.toLowerCase().includes(q);
      const matchKontak = item.kontakHp?.toLowerCase().includes(q);
      return matchTiket || matchPelapor || matchSatker || matchJudul || matchDeskripsi || matchKontak;
    }
    return true;
  });

  // Save Helpdesk Settings
  const handleSaveHelpdeskSettings = () => {
    const updatedCfg: DashboardConfig = {
      ...dashboardConfig,
      helpdeskPhone: helpdeskPhoneInput.trim(),
      helpdeskJamLayanan: helpdeskJamInput.trim(),
      helpdeskPicName: helpdeskPicInput.trim(),
      helpdeskEmail: helpdeskEmailInput.trim(),
      allowPublicTickets: allowPublicTickets
    };
    onUpdateDashboardConfig(updatedCfg);
    setIsSavedSettings(true);
    setTimeout(() => setIsSavedSettings(false), 3000);

    if (showToast) {
      showToast({ message: 'Pengaturan Kontak WhatsApp & Helpdesk Aduan Berhasil Disimpan!', type: 'success' });
    }
    if (addLog) {
      addLog('Ubah Pengaturan Helpdesk & WA Aduan', 'SETTINGS', `Nomor WA: ${helpdeskPhoneInput}, Jam: ${helpdeskJamInput}`, 'SUCCESS');
    }
  };

  // Open Detail Modal
  const handleOpenDetail = (item: AduanSatkerRecord) => {
    if (!isKiUnlocked) {
      if (showToast) {
        showToast({ message: 'Akses terbatas! Hanya Ketua Seksi Kepatuhan Internal yang berhak membuka rincian tiket.', type: 'warning' });
      }
      return;
    }
    setSelectedAduanForDetail(item);
    setEditingStatus(item.status);
    setEditingCatatan(item.catatanAdmin || '');
    setEditingPetugas(item.petugasPenyelesai || dashboardConfig.helpdeskPicName || 'Seksi Kepatuhan Internal');
  };

  // Save Detail Follow-up
  const handleSaveFollowUp = () => {
    if (!selectedAduanForDetail) return;

    const now = new Date();
    const formattedDate = `${now.getDate()} ${now.toLocaleString('id-ID', { month: 'short' })} ${now.getFullYear()}, ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`;

    const statusChanged = selectedAduanForDetail.status !== editingStatus;
    const notesChanged = (selectedAduanForDetail.catatanAdmin || '') !== editingCatatan;

    const newRiwayat = [...(selectedAduanForDetail.riwayatTindakLanjut || [])];

    if (statusChanged || notesChanged) {
      newRiwayat.unshift({
        id: `rwy-${Date.now()}`,
        waktu: formattedDate,
        petugas: editingPetugas.trim() || 'Admin KPPN 026',
        catatan: editingCatatan.trim() || `Status aduan diperbarui menjadi ${editingStatus}`,
        statusSebelumnya: selectedAduanForDetail.status,
        statusBaru: editingStatus
      });
    }

    const updatedAduan: AduanSatkerRecord = {
      ...selectedAduanForDetail,
      status: editingStatus,
      catatanAdmin: editingCatatan.trim(),
      petugasPenyelesai: editingPetugas.trim(),
      tanggalSelesai: editingStatus === 'SELESAI' ? formattedDate : undefined,
      riwayatTindakLanjut: newRiwayat
    };

    const updatedList = aduanList.map(a => a.id === updatedAduan.id ? updatedAduan : a);
    onUpdateAduanList(updatedList);

    // Also update dashboardConfig
    onUpdateDashboardConfig({
      ...dashboardConfig,
      aduanList: updatedList
    });

    if (showToast) {
      showToast({ message: `Tiket ${updatedAduan.tiketNomor} berhasil diperbarui (${editingStatus})`, type: 'success' });
    }
    if (addLog) {
      addLog('Update Tiket Aduan Satker', 'DATA', `Tiket ${updatedAduan.tiketNomor} diubah ke status ${editingStatus}. Catatan: ${editingCatatan.slice(0, 50)}...`, 'SUCCESS');
    }

    setSelectedAduanForDetail(null);
  };

  // Safe In-App Delete Aduan Execution
  const executeDeleteAduan = (id: string, tiketNomor: string) => {
    const updatedList = aduanList.filter(a => a.id !== id);
    onUpdateAduanList(updatedList);
    onUpdateDashboardConfig({
      ...dashboardConfig,
      aduanList: updatedList
    });

    try {
      const cfg = localStorage.getItem('kppn_dashboard_config');
      if (cfg) {
        const parsed = JSON.parse(cfg);
        parsed.aduanList = updatedList;
        safeLocalStorageSet('kppn_dashboard_config', JSON.stringify(parsed));
      }
    } catch (e) {
      console.error(e);
    }

    if (showToast) {
      showToast({ message: `Tiket ${tiketNomor} berhasil dihapus dari sistem.`, type: 'info' });
    }
    if (addLog) {
      addLog('Hapus Tiket Aduan', 'DATA', `Tiket ${tiketNomor} dihapus oleh Admin.`, 'WARNING');
    }
    setAduanToDelete(null);
  };

  // Safe In-App Clear All Tickets Execution
  const executeDeleteAllAduan = () => {
    const count = aduanList.length;
    onUpdateAduanList([]);
    onUpdateDashboardConfig({
      ...dashboardConfig,
      aduanList: []
    });

    try {
      const cfg = localStorage.getItem('kppn_dashboard_config');
      if (cfg) {
        const parsed = JSON.parse(cfg);
        parsed.aduanList = [];
        safeLocalStorageSet('kppn_dashboard_config', JSON.stringify(parsed));
      }
    } catch (e) {
      console.error(e);
    }

    if (showToast) {
      showToast({ message: `Seluruh arsip tiket aduan (${count} tiket) telah berhasil dibersihkan.`, type: 'info' });
    }
    if (addLog) {
      addLog('Kosongkan Arsip Aduan', 'DATA', `Seluruh tiket aduan (${count} tiket) dihapus oleh Admin.`, 'WARNING');
    }
    setIsConfirmDeleteAllOpen(false);
  };

  // Create Manual Aduan
  const handleSaveManualAduan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.judulAduan.trim() || !manualForm.deskripsi.trim()) {
      alert('Mohon isi Judul dan Rincian Aduan.');
      return;
    }

    const now = new Date();
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const tiketNomor = `TKT-${randNum}`;
    const formattedDate = `${now.getDate()} ${now.toLocaleString('id-ID', { month: 'short' })} ${now.getFullYear()}, ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`;

    const newRecord: AduanSatkerRecord = {
      id: `adu-${Date.now()}`,
      tiketNomor: tiketNomor,
      tanggal: formattedDate,
      createdAt: now.toISOString(),
      aliasPelapor: manualForm.aliasPelapor.trim() || 'Petugas / Pejabat Satker',
      namaSatker: manualForm.namaSatker.trim() || 'Satker Mitra KPPN',
      kodeSatker: manualForm.kodeSatker.trim() || '-',
      kontakHp: manualForm.kontakHp.trim() || '',
      emailPelapor: manualForm.emailPelapor.trim() || '',
      kategori: manualForm.kategori,
      judulAduan: manualForm.judulAduan.trim(),
      deskripsi: manualForm.deskripsi.trim(),
      status: 'DIPROSES',
      urgensi: manualForm.urgensi,
      sumber: manualForm.sumber,
      catatanAdmin: `Dicatat manual oleh Admin (${manualForm.sumber}).`,
      petugasPenyelesai: dashboardConfig.helpdeskPicName || 'Seksi Kepatuhan Internal',
      riwayatTindakLanjut: [
        {
          id: `rwy-${Date.now()}`,
          waktu: formattedDate,
          petugas: 'Admin Helpdesk',
          catatan: `Aduan diterima via ${manualForm.sumber} dan direkam ke sistem.`,
          statusSebelumnya: 'MENUNGGU',
          statusBaru: 'DIPROSES'
        }
      ]
    };

    const updatedList = [newRecord, ...aduanList];
    onUpdateAduanList(updatedList);
    onUpdateDashboardConfig({
      ...dashboardConfig,
      aduanList: updatedList
    });

    setShowAddManualModal(false);
    setManualForm({
      aliasPelapor: '',
      namaSatker: '',
      kodeSatker: '',
      kontakHp: '',
      emailPelapor: '',
      kategori: 'Kendala Teknis SAKTI & Rekonsiliasi',
      judulAduan: '',
      deskripsi: '',
      urgensi: 'BIASA',
      sumber: 'TATAP_MUKA'
    });

    if (showToast) {
      showToast({ message: `Aduan manual berhasil dibuat dengan No Tiket: ${tiketNomor}`, type: 'success' });
    }
    if (addLog) {
      addLog('Tambah Aduan Manual', 'DATA', `Tiket ${tiketNomor} dibuat secara manual (${manualForm.sumber})`, 'SUCCESS');
    }
  };

  // Export Aduan to CSV
  const handleExportAduanCSV = () => {
    if (!isKiUnlocked) {
      if (showToast) {
        showToast({ message: 'Harap buka akses Kepatuhan Internal terlebih dahulu untuk mengekspor data aduan.', type: 'warning' });
      }
      return;
    }

    if (aduanList.length === 0) {
      alert('Belum ada data aduan untuk diekspor.');
      return;
    }

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'No,Nomor Tiket,Tanggal,Status,Urgensi,Sumber,Kategori,Pelapor,Satker,Kode Satker,Kontak HP,Email,Judul Aduan,Rincian Aduan,Catatan Tindak Lanjut Admin,Petugas Penyelesai\n';

    aduanList.forEach((item, idx) => {
      csvContent += `"${idx + 1}","${item.tiketNomor}","${item.tanggal}","${item.status}","${item.urgensi}","${item.sumber}","${item.kategori.replace(/"/g, '""')}","${(item.aliasPelapor || '').replace(/"/g, '""')}","${(item.namaSatker || '').replace(/"/g, '""')}","${item.kodeSatker || ''}","${item.kontakHp || ''}","${item.emailPelapor || ''}","${(item.judulAduan || '').replace(/"/g, '""')}","${(item.deskripsi || '').replace(/"/g, '""')}","${(item.catatanAdmin || '').replace(/"/g, '""')}","${(item.petugasPenyelesai || '').replace(/"/g, '""')}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rekap_Aduan_Satker_KPPN_Semarang_I_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (showToast) {
      showToast({ message: 'Rekap aduan berhasil diekspor ke file CSV!', type: 'success' });
    }
  };

  // Open Direct WhatsApp Chat with Complainant
  const handleOpenWaChat = (phone: string, tiketNomor: string, nama: string) => {
    const rawDigits = phone.replace(/\D/g, '');
    const cleanPhone = rawDigits.startsWith('0') ? '62' + rawDigits.slice(1) : rawDigits;
    const msg = encodeURIComponent(
      `Halo Bapak/Ibu ${nama || 'Pengelola Satker'}, kami dari Helpdesk / Seksi Kepatuhan Internal KPPN Semarang I menindaklanjuti pengaduan/tiket nomor *${tiketNomor}* yang telah diajukan melalui Dashboard KPPN. Ada yang dapat kami bantu lebih lanjut?`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner Card */}
      <div className={`${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
      } rounded-3xl border shadow-xl p-6 sm:p-8 space-y-6`}>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 px-3.5 py-1 rounded-full text-xs font-black mb-2 shadow-xs">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              PUSAT KELOLA ADUAN, HELPDESK &amp; TIKET SATKER (KPPN 026)
            </div>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              Pengaturan Kontak WhatsApp CS &amp; Manajemen Tiket Aduan Masuk
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1 max-w-3xl leading-relaxed">
              Pusat kendali tindak lanjut pengaduan integritas (WBK/WBBM), konsultasi kendala teknis SAKTI, permohonan dispensasi, serta pengaturan nomor WhatsApp Helpdesk yang tampil di dashboard Satker.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {isKiUnlocked ? (
              <>
                <button
                  type="button"
                  onClick={() => setShowAddManualModal(true)}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-black text-xs sm:text-sm px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Tiket Manual</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportAduanCSV}
                  className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-bold px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <FileDown className="w-4 h-4 text-emerald-500" />
                  <span>Export CSV/Excel</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowChangePasswordModal(true)}
                  className="bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-extrabold text-xs sm:text-sm px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title="Ganti Kata Sandi Kepatuhan Internal"
                >
                  <KeyRound className="w-4 h-4 text-indigo-600" />
                  <span>Ganti Sandi KI</span>
                </button>

                <button
                  type="button"
                  onClick={handleLockKi}
                  className="bg-rose-50 dark:bg-rose-950/70 hover:bg-rose-100 dark:hover:bg-rose-900 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-extrabold text-xs sm:text-sm px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title="Kunci Akses Sesi Kepatuhan Internal"
                >
                  <Lock className="w-4 h-4 text-rose-600" />
                  <span>Kunci Sesi</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('ki-gatekeeper-box');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-amber-600 hover:bg-amber-500 text-white font-black text-xs sm:text-sm px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>Buka Akses Khusus Ketua KI</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick KPI Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
          
          {/* Total */}
          <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Aduan</span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 mt-1">{totalAduan}</div>
            <span className="text-[10px] text-slate-400 font-medium">Tiket Terdaftar</span>
          </div>

          {/* Menunggu */}
          <div className={`p-4 rounded-2xl border ${isDark ? 'bg-amber-950/30 border-amber-800/50' : 'bg-amber-50/70 border-amber-200'}`}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-amber-700 dark:text-amber-300 uppercase tracking-wider">Menunggu</span>
              {countMenunggu > 0 && (
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
              )}
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 mt-1">{countMenunggu}</div>
            <span className="text-[10px] text-amber-700/80 dark:text-amber-300/80 font-bold">Perlu Respon Admin</span>
          </div>

          {/* Diproses */}
          <div className={`p-4 rounded-2xl border ${isDark ? 'bg-sky-950/30 border-sky-800/50' : 'bg-sky-50/70 border-sky-200'}`}>
            <span className="text-[11px] font-black text-sky-700 dark:text-sky-300 uppercase tracking-wider block">Diproses</span>
            <div className="text-2xl sm:text-3xl font-black text-sky-600 dark:text-sky-400 mt-1">{countDiproses}</div>
            <span className="text-[10px] text-sky-700/80 dark:text-sky-300/80 font-bold">Sedang Ditindaklanjuti</span>
          </div>

          {/* Selesai */}
          <div className={`p-4 rounded-2xl border ${isDark ? 'bg-emerald-950/30 border-emerald-800/50' : 'bg-emerald-50/70 border-emerald-200'}`}>
            <span className="text-[11px] font-black text-emerald-700 dark:text-emerald-300 uppercase tracking-wider block">Selesai</span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{countSelesai}</div>
            <span className="text-[10px] text-emerald-700/80 dark:text-emerald-300/80 font-bold">Tuntas &amp; Solutif</span>
          </div>

          {/* Anonim & Rahasia */}
          <div className={`p-4 rounded-2xl border col-span-2 sm:col-span-1 ${isDark ? 'bg-purple-950/30 border-purple-800/50' : 'bg-purple-50/70 border-purple-200'}`}>
            <span className="text-[11px] font-black text-purple-700 dark:text-purple-300 uppercase tracking-wider block">Anonim / WBK</span>
            <div className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400 mt-1">{countAnonim}</div>
            <span className="text-[10px] text-purple-700/80 dark:text-purple-300/80 font-bold">Integritas 100% Aman</span>
          </div>

        </div>

        {/* Setting Panel: Nomor WhatsApp Helpdesk & Parameter Aduan Dashboard */}
        <div className={`p-5 rounded-3xl border ${
          isDark ? 'bg-slate-950/90 border-slate-800' : 'bg-gradient-to-r from-emerald-50/70 via-teal-50/40 to-slate-50 border-emerald-200/80'
        } space-y-4`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  Pengaturan Kontak WhatsApp CS &amp; Layanan Tiket Dashboard
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Nomor HP dan parameter yang diisi di sini akan otomatis terhubung ke tombol WhatsApp pada menu Satker.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isSavedSettings && (
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Tersimpan!
                </span>
              )}
              <button
                type="button"
                onClick={handleSaveHelpdeskSettings}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Pengaturan Helpdesk</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* WhatsApp Phone */}
            <div>
              <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">
                1. Nomor WhatsApp Helpdesk CS / Aduan: <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-emerald-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={helpdeskPhoneInput}
                  onChange={(e) => setHelpdeskPhoneInput(e.target.value)}
                  placeholder="081234567890"
                  className={`w-full pl-8.5 pr-3 py-2 rounded-xl border text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>

            {/* Jam Layanan */}
            <div>
              <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">
                2. Jam Operasional Layanan:
              </label>
              <div className="relative">
                <Clock className="w-3.5 h-3.5 text-sky-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={helpdeskJamInput}
                  onChange={(e) => setHelpdeskJamInput(e.target.value)}
                  placeholder="Senin - Jumat (08:00 - 16:00 WIB)"
                  className={`w-full pl-8.5 pr-3 py-2 rounded-xl border text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>

            {/* PIC / Unit Pengelola */}
            <div>
              <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">
                3. Seksi / Unit Pengelola Aduan:
              </label>
              <div className="relative">
                <Building2 className="w-3.5 h-3.5 text-amber-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={helpdeskPicInput}
                  onChange={(e) => setHelpdeskPicInput(e.target.value)}
                  placeholder="Seksi Kepatuhan Internal & Seksi MSKI"
                  className={`w-full pl-8.5 pr-3 py-2 rounded-xl border text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>

            {/* Email Pengaduan */}
            <div>
              <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">
                4. Email Resmi Pengaduan:
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-purple-500 absolute left-3 top-3" />
                <input
                  type="email"
                  value={helpdeskEmailInput}
                  onChange={(e) => setHelpdeskEmailInput(e.target.value)}
                  placeholder="kppn.semarang1@kemenkeu.go.id"
                  className={`w-full pl-8.5 pr-3 py-2 rounded-xl border text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-200/60 dark:border-slate-800 text-xs">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={allowPublicTickets}
                onChange={(e) => setAllowPublicTickets(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <span>🟢 Aktifkan Formulir Pembuatan Tiket Aduan Online langsung dari Dashboard Satker</span>
            </label>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href={`https://wa.me/${helpdeskPhoneInput.replace(/\D/g, '')}?text=Halo%20Admin%20KPPN%20Semarang%20I,%20ini%20adalah%20uji%20coba%20tautan%20WhatsApp%20Pengaduan.`}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Tes Klik Tautan WhatsApp ({helpdeskPhoneInput})</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              {!isDefaultKiPassword && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Reset Darurat: Kembalikan kata sandi Kepatuhan Internal ke bawaan awal sistem (ki026)?')) {
                      handleResetKiPasswordToDefault();
                    }
                  }}
                  className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  title="Kembalikan sandi KI ke bawaan default (ki026)"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Sandi KI ke Default (ki026)</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Interactive Tickets Table or KI Gatekeeper Protection */}
        {!isKiUnlocked ? (
          <div id="ki-gatekeeper-box" className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border-2 border-indigo-500/40 text-white shadow-2xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-indigo-800/60 pb-5">
              <div className="flex items-start gap-3.5">
                <div className="p-3 bg-indigo-600/30 border border-indigo-400/40 text-indigo-300 rounded-2xl shadow-inner shrink-0">
                  <ShieldAlert className="w-8 h-8 text-amber-400" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40 mb-2">
                    <Lock className="w-3.5 h-3.5" />
                    Kerahasiaan Jabatan &amp; Whistleblowing System (WBK/WBBM)
                  </div>
                  <h4 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    Area Terbatas: Khusus Ketua Seksi Kepatuhan Internal (SKI)
                  </h4>
                  <p className="text-xs sm:text-sm text-indigo-200/90 mt-1 max-w-2xl leading-relaxed">
                    Sesuai instruksi pimpinan dan regulasi perlindungan pelapor, <strong>daftar dan rincian tiket aduan satker HANYA DAPAT DIBUKA DAN DIAKSES OLEH KETUA SEKSI KEPATUHAN INTERNAL</strong>. Admin pengelola umum tidak diperkenankan membaca isi tiket demi menjamin independensi, objektivitas, serta kerahasiaan identitas satuan kerja pelapor.
                  </p>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2.5 bg-slate-950/70 border border-indigo-700/60 px-4 py-2.5 rounded-2xl text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                <span className="font-mono font-bold text-slate-200">Status Data: Terproteksi</span>
              </div>
            </div>

            {/* Password Auth Form */}
            <form onSubmit={handleUnlockKi} className="max-w-xl mx-auto bg-slate-950/80 border border-indigo-500/40 rounded-3xl p-6 sm:p-7 space-y-4 shadow-2xl backdrop-blur-md">
              <div className="text-center space-y-1 pb-1">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h5 className="text-base font-black text-white">
                  Otentikasi Sandi Seksi Kepatuhan Internal
                </h5>
                <p className="text-xs text-indigo-300/80">
                  Masukkan kata sandi otorisasi untuk membuka arsip dan rincian aduan satker
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                  <label className="text-xs font-black text-slate-200 flex items-center gap-1.5">
                    <span>Kata Sandi Kepatuhan Internal:</span>
                  </label>

                  {isDefaultKiPassword ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                      <span>Status: Masih Sandi Default</span>
                      <code className="bg-slate-900/90 px-1.5 py-0.5 rounded font-mono text-amber-300 font-black">ki026</code>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Status: Sandi Sudah Diubah (Bukan Default Lagi)</span>
                    </div>
                  )}
                </div>

                {/* Status Notice Banner */}
                {isDefaultKiPassword ? (
                  <div className="mb-3 p-3 rounded-2xl bg-amber-950/40 border border-amber-700/50 text-[11px] text-amber-200/90 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="font-bold text-amber-300">
                        Sandi Belum Diubah (Masih Bawaan Sistem)
                      </p>
                      <p className="text-amber-200/80 leading-relaxed">
                        Anda dapat masuk menggunakan kata sandi awal <code className="bg-slate-900 px-1.5 py-0.5 rounded font-mono text-amber-300 font-bold">ki026</code>. Setelah terbuka, disarankan segera memperbarui kata sandi lewat tombol <em>"Ganti Password KI"</em> agar terjaga kerahasiaannya.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mb-3 p-3 rounded-2xl bg-emerald-950/40 border border-emerald-700/50 text-[11px] text-emerald-200/90 flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-emerald-300">
                          Sandi Kustom Aktif (Telah Diperbarui oleh Ketua KI)
                        </span>
                        {kiPasswordUpdatedAt && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-900/60 border border-emerald-600/40 text-emerald-300 font-mono">
                            Diperbarui: {kiPasswordUpdatedAt}
                          </span>
                        )}
                      </div>
                      <p className="text-emerald-200/80 leading-relaxed">
                        Sandi default awal <code className="bg-slate-900/90 px-1.5 py-0.5 rounded font-mono text-slate-400 line-through">ki026</code> sudah tidak dapat digunakan. Masukkan kata sandi kustom baru yang telah ditentukan sebelumnya.
                      </p>
                    </div>
                  </div>
                )}

                <div className="relative">
                  <KeyRound className="w-4 h-4 text-indigo-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showKiPasswordInput ? "text" : "password"}
                    value={kiPasswordInput}
                    onChange={(e) => {
                      setKiPasswordInput(e.target.value);
                      if (kiPasswordError) setKiPasswordError('');
                    }}
                    placeholder={isDefaultKiPassword ? "Masukkan sandi awal (ki026)..." : "Masukkan kata sandi kustom yang telah diubah..."}
                    autoFocus
                    className="w-full pl-10 pr-10 py-3 rounded-xl border border-indigo-600/60 bg-slate-900 text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKiPasswordInput(!showKiPasswordInput)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer p-1"
                  >
                    {showKiPasswordInput ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {kiPasswordError && (
                  <p className="text-[11px] font-bold text-rose-400 mt-2 flex items-center gap-1.5 bg-rose-950/50 p-2 rounded-xl border border-rose-800/80">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{kiPasswordError}</span>
                  </p>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-black text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <Unlock className="w-4 h-4" />
                  <span>Buka Akses Tiket Kepatuhan Internal</span>
                </button>
              </div>

              <div className="pt-3 border-t border-indigo-900/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>
                    Status Sandi: <strong className={isDefaultKiPassword ? "text-amber-400" : "text-emerald-400"}>{isDefaultKiPassword ? "Bawaan / Default (ki026)" : "Kustom (Sudah Diubah)"}</strong>
                  </span>
                </span>
                <span>Kata sandi dapat diperbarui kapan saja oleh Ketua KI</span>
              </div>

              {/* Opsi Reset Tersembunyi jika Lupa Sandi Kustom */}
              {!isDefaultKiPassword && (
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Reset Darurat: Kembalikan kata sandi Kepatuhan Internal ke bawaan awal sistem ("ki026")?\n\nGunakan fitur pemulihan ini jika Ketua Seksi Kepatuhan Internal lupa kata sandi kustom yang telah diubah.')) {
                        handleResetKiPasswordToDefault();
                      }
                    }}
                    className="text-[11px] text-indigo-300/80 hover:text-amber-300 font-semibold underline underline-offset-4 cursor-pointer transition-colors inline-flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                    <span>Ketua KI lupa kata sandi? Reset darurat ke password awal (ki026)</span>
                  </button>
                </div>
              )}
            </form>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            
            {/* Top Unlocked Active Session Notification */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-500/5 border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-emerald-950 dark:text-emerald-200 text-sm">
                      🟢 Sesi Otoritas Seksi Kepatuhan Internal Terbuka (Ketua SKI)
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                      isDefaultKiPassword 
                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700' 
                        : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                    }`}>
                      {isDefaultKiPassword ? '⚠️ Sandi Masih Default (ki026)' : '🛡️ Sandi Kustom Aktif'}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-600 dark:text-slate-400 block mt-0.5">
                    Anda memiliki wewenang penuh untuk memeriksa identitas pelapor, menindaklanjuti rincian masalah, serta memperbarui status tiket.
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowChangePasswordModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-extrabold text-xs hover:bg-indigo-100 dark:hover:bg-indigo-900 flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                  title="Ganti Kata Sandi Kepatuhan Internal"
                >
                  <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Ganti Password KI</span>
                  {isDefaultKiPassword ? (
                    <span className="ml-0.5 px-1.5 py-0.2 rounded text-[10px] font-black bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30">
                      Default
                    </span>
                  ) : (
                    <span className="ml-0.5 px-1.5 py-0.2 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
                      Diubah
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleLockKi}
                  className="px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-extrabold text-xs hover:bg-rose-100 dark:hover:bg-rose-900 flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                  title="Kunci Akses Sesi Kepatuhan Internal"
                >
                  <Lock className="w-3.5 h-3.5 text-rose-600" />
                  <span>Kunci Sesi Kembali</span>
                </button>
              </div>
            </div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h4 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-rose-500" />
                <span>Inbox &amp; Daftar Tiket Aduan Satker ({filteredAduanList.length} dari {totalAduan})</span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Klik baris aduan untuk meninjau rincian lengkap, memperbarui status tiket, dan menuliskan catatan tindak lanjut.
              </p>
            </div>

            {/* Quick Status Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs">
              {[
                { key: 'ALL', label: 'Semua Status', count: totalAduan },
                { key: 'MENUNGGU', label: 'Menunggu', count: countMenunggu, color: 'text-amber-600' },
                { key: 'DIPROSES', label: 'Diproses', count: countDiproses, color: 'text-sky-600' },
                { key: 'SELESAI', label: 'Selesai', count: countSelesai, color: 'text-emerald-600' },
                { key: 'DITOLAK', label: 'Ditolak', count: countDitolak, color: 'text-rose-600' }
              ].map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setFilterStatus(tab.key as any);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                    filterStatus === tab.key
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    filterStatus === tab.key ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Search & Category Filter Bar */}
          <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Cari No Tiket, Satker, Pelapor, Kata Kunci..."
                className="w-full pl-8.5 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-900 dark:text-white"
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(''); setCurrentPage(1); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
              <span className="font-bold text-slate-500 text-[11px] shrink-0">Filter Kategori:</span>
              <select
                value={filterKategori}
                onChange={(e) => {
                  setFilterKategori(e.target.value);
                  setCurrentPage(1);
                }}
                className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs text-slate-800 dark:text-slate-200"
              >
                <option value="ALL">Semua Kategori Aduan</option>
                <option value="Pengaduan Gratifikasi / Imbalan">Pengaduan Gratifikasi / Imbalan</option>
                <option value="Pelanggaran Kode Etik / Sikap Petugas">Pelanggaran Kode Etik</option>
                <option value="Pengaduan Layanan / Disiplin">Pengaduan Layanan</option>
                <option value="Kendala Teknis SAKTI & Rekonsiliasi">Kendala Teknis SAKTI</option>
                <option value="Permintaan Konsultasi / Pendampingan">Permintaan Konsultasi</option>
                <option value="Indikasi Fraud / Penyimpangan">Indikasi Fraud</option>
                <option value="Lainnya">Lainnya</option>
              </select>

              {aduanList.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsConfirmDeleteAllOpen(true)}
                  className="px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 text-rose-700 dark:text-rose-300 font-bold text-xs hover:bg-rose-100 hover:scale-102 active:scale-98 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title="Hapus / bersihkan seluruh tiket aduan satker"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Kosongkan Seluruh Arsip</span>
                </button>
              )}
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 max-h-[550px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black uppercase tracking-wider sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700 text-[11px]">
                <tr>
                  <th className="py-3 px-3.5">Tiket &amp; Waktu</th>
                  <th className="py-3 px-3.5">Status &amp; Urgensi</th>
                  <th className="py-3 px-3.5 min-w-[180px]">Pelapor &amp; Satker</th>
                  <th className="py-3 px-3.5 min-w-[240px]">Kategori &amp; Rincian Aduan</th>
                  <th className="py-3 px-3.5 min-w-[180px]">Tindak Lanjut Admin</th>
                  <th className="py-3 px-3.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredAduanList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-700" />
                        <span className="font-bold text-sm">Tidak ada tiket aduan yang cocok</span>
                        <span className="text-xs text-slate-400">Coba ubah kata kunci pencarian atau filter status</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  (pageSize <= 0 ? filteredAduanList : filteredAduanList.slice((currentPage - 1) * pageSize, currentPage * pageSize)).map((item) => (
                    <tr 
                      key={item.id} 
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                      onClick={() => handleOpenDetail(item)}
                    >
                      {/* Ticket Number & Date */}
                      <td className="py-3 px-3.5">
                        <div className="font-mono font-black text-rose-600 dark:text-rose-400 text-sm">
                          {item.tiketNomor}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{item.tanggal}</span>
                        </div>
                        <span className="inline-block mt-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[9px] px-1.5 py-0.5 rounded font-bold">
                          {item.sumber === 'DASHBOARD_FORM' ? '🌐 Form Dashboard' : item.sumber === 'TATAP_MUKA' ? '👥 Tatap Muka' : '📱 WhatsApp'}
                        </span>
                      </td>

                      {/* Status & Urgensi */}
                      <td className="py-3 px-3.5">
                        <div className="space-y-1">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black ${
                            item.status === 'MENUNGGU' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800' :
                            item.status === 'DIPROSES' ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border border-sky-300 dark:border-sky-800' :
                            item.status === 'SELESAI' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800' :
                            'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                          }`}>
                            {item.status === 'MENUNGGU' && <AlertCircle className="w-3 h-3 text-amber-600" />}
                            {item.status === 'DIPROSES' && <Activity className="w-3 h-3 text-sky-600" />}
                            {item.status === 'SELESAI' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                            {item.status === 'DITOLAK' && <XCircle className="w-3 h-3 text-rose-600" />}
                            <span>{item.status}</span>
                          </span>

                          <div>
                            <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                              item.urgensi === 'SANGAT_SEGERA' ? 'bg-rose-500 text-white' :
                              item.urgensi === 'PENTING' ? 'bg-amber-500 text-white' :
                              'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                            }`}>
                              {item.urgensi}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Pelapor & Satker */}
                      <td className="py-3 px-3.5">
                        <div className="font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                          {item.aliasPelapor?.toLowerCase().includes('anonim') ? (
                            <Lock className="w-3 h-3 text-purple-500" />
                          ) : (
                            <User className="w-3 h-3 text-slate-400" />
                          )}
                          <span>{item.aliasPelapor}</span>
                        </div>

                        <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                          {item.namaSatker || 'Satker Mitra KPPN'}
                          {item.kodeSatker && item.kodeSatker !== '-' && (
                            <span className="font-mono text-[10px] ml-1 text-slate-400">({item.kodeSatker})</span>
                          )}
                        </div>

                        {item.kontakHp && (
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold mt-0.5">
                            WA: {item.kontakHp}
                          </div>
                        )}
                      </td>

                      {/* Kategori & Judul */}
                      <td className="py-3 px-3.5">
                        <div className="text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-0.5">
                          {item.kategori}
                        </div>
                        <div className="font-bold text-slate-900 dark:text-slate-100 leading-snug line-clamp-1">
                          {item.judulAduan}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                          {item.deskripsi}
                        </div>
                      </td>

                      {/* Catatan Admin */}
                      <td className="py-3 px-3.5">
                        {item.catatanAdmin ? (
                          <div className="bg-slate-100 dark:bg-slate-950 p-2 rounded-xl text-[11px] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 line-clamp-2">
                            {item.catatanAdmin}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Belum ada respon</span>
                        )}
                        {item.petugasPenyelesai && (
                          <div className="text-[9px] text-slate-400 font-semibold mt-1">
                            PIC: {item.petugasPenyelesai}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(item)}
                            className="p-1.5 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 hover:bg-sky-200 border border-sky-200 dark:border-sky-800 cursor-pointer"
                            title="Tinjau & Tindak Lanjut"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {item.kontakHp && (
                            <button
                              type="button"
                              onClick={() => handleOpenWaChat(item.kontakHp!, item.tiketNomor, item.aliasPelapor)}
                              className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 border border-emerald-200 dark:border-emerald-800 cursor-pointer"
                              title="Chat WhatsApp Pelapor"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setAduanToDelete({ id: item.id, tiketNomor: item.tiketNomor, judul: item.judulAduan })}
                            className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 hover:bg-rose-200 hover:scale-110 active:scale-95 transition-all border border-rose-200 dark:border-rose-800 cursor-pointer"
                            title="Hapus Tiket Aduan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls for Support Tickets */}
          <PaginationControl
            currentPage={currentPage}
            totalItems={filteredAduanList.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            itemLabel="Tiket Aduan"
            isDark={isDark}
            className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
          />

        </div>
        )}

      </div>

      {/* Modal Detail & Follow-up Aduan */}
      {selectedAduanForDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full space-y-5 shadow-2xl my-8">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-rose-600 dark:text-rose-400 text-lg">
                    {selectedAduanForDetail.tiketNomor}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                    selectedAduanForDetail.status === 'MENUNGGU' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                    selectedAduanForDetail.status === 'DIPROSES' ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300' :
                    selectedAduanForDetail.status === 'SELESAI' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                    'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  }`}>
                    {selectedAduanForDetail.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Diterima: {selectedAduanForDetail.tanggal} • Sumber: {selectedAduanForDetail.sumber}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedAduanForDetail(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Pelapor & Satker Info Card */}
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500 font-semibold block text-[11px]">Identitas Pelapor:</span>
                <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-1 mt-0.5">
                  {selectedAduanForDetail.aliasPelapor?.toLowerCase().includes('anonim') && <Lock className="w-3.5 h-3.5 text-purple-500" />}
                  {selectedAduanForDetail.aliasPelapor}
                </span>
                {selectedAduanForDetail.kontakHp && (
                  <div className="mt-1 font-mono text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    <span>{selectedAduanForDetail.kontakHp}</span>
                    <button
                      type="button"
                      onClick={() => handleOpenWaChat(selectedAduanForDetail.kontakHp!, selectedAduanForDetail.tiketNomor, selectedAduanForDetail.aliasPelapor)}
                      className="ml-2 text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded font-bold hover:bg-emerald-500 cursor-pointer"
                    >
                      Chat WA
                    </button>
                  </div>
                )}
              </div>

              <div>
                <span className="text-slate-500 font-semibold block text-[11px]">Satuan Kerja:</span>
                <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm mt-0.5 block">
                  {selectedAduanForDetail.namaSatker || 'Satker Mitra KPPN'}
                </span>
                {selectedAduanForDetail.kodeSatker && (
                  <span className="text-slate-400 font-mono text-[11px]">Kode Satker: {selectedAduanForDetail.kodeSatker}</span>
                )}
              </div>
            </div>

            {/* Aduan Content */}
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                  {selectedAduanForDetail.kategori}
                </span>
                <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 mt-1.5">
                  {selectedAduanForDetail.judulAduan}
                </h4>
              </div>

              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 leading-relaxed font-sans whitespace-pre-line text-slate-800 dark:text-slate-200 text-xs">
                {selectedAduanForDetail.deskripsi}
              </div>
            </div>

            {/* Follow-up / Response Form for Admin */}
            <div className="bg-amber-50/70 dark:bg-amber-950/30 p-4 sm:p-5 rounded-2xl border border-amber-300/60 dark:border-amber-800/60 space-y-3.5 text-xs">
              <h5 className="font-black text-slate-900 dark:text-slate-100 flex items-center gap-2 text-xs uppercase tracking-wider text-amber-800 dark:text-amber-300">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Form Tindak Lanjut &amp; Solusi Admin KPPN
              </h5>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Perbarui Status Tiket:
                  </label>
                  <select
                    value={editingStatus}
                    onChange={(e) => setEditingStatus(e.target.value as AduanStatus)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs"
                  >
                    <option value="MENUNGGU">🟡 MENUNGGU (Belum Ditindaklanjuti)</option>
                    <option value="DIPROSES">🔵 DIPROSES (Sedang Asistensi / Koordinasi)</option>
                    <option value="SELESAI">🟢 SELESAI (Tuntas &amp; Solusi Diberikan)</option>
                    <option value="DITOLAK">🔴 DITOLAK (Tidak Relevan / Duplikat / Spam)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Petugas / Seksi Penyelesai:
                  </label>
                  <input
                    type="text"
                    value={editingPetugas}
                    onChange={(e) => setEditingPetugas(e.target.value)}
                    placeholder="Contoh: Seksi MSKI / Seksi Kepatuhan Internal"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Catatan Tindak Lanjut &amp; Solusi Resmi (Dapat Dilihat Satker):
                </label>
                <textarea
                  rows={3}
                  value={editingCatatan}
                  onChange={(e) => setEditingCatatan(e.target.value)}
                  placeholder="Tuliskan hasil konfirmasi, arahan teknis, atau catatan penyelesaian..."
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Riwayat Timeline */}
            {(selectedAduanForDetail.riwayatTindakLanjut || []).length > 0 && (
              <div className="space-y-2 text-xs pt-1">
                <span className="font-extrabold text-slate-500 text-[11px] block uppercase tracking-wider">
                  Riwayat Audit &amp; Timeline Tindak Lanjut:
                </span>
                <div className="space-y-2 max-h-36 overflow-y-auto">
                  {selectedAduanForDetail.riwayatTindakLanjut?.map((rwy) => (
                    <div key={rwy.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] space-y-0.5">
                      <div className="flex items-center justify-between font-bold text-slate-700 dark:text-slate-300">
                        <span>{rwy.petugas} ({rwy.statusSebelumnya} → {rwy.statusBaru})</span>
                        <span className="font-mono text-[10px] text-slate-400">{rwy.waktu}</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400">{rwy.catatan}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedAduanForDetail(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveFollowUp}
                className="px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Tindak Lanjut</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modal Add Manual Aduan */}
      {showAddManualModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full space-y-4 shadow-2xl my-8">
            
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h4 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-rose-500" />
                  Tambah Catatan Tiket / Aduan Satker Manual
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Untuk merekam pengaduan atau konsultasi yang diterima lewat tatap muka, front office, telepon, atau surat resmi.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddManualModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveManualAduan} className="space-y-3.5 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Nama / Alias Pelapor:</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: PPK / Bendahara / Pak Agus"
                    value={manualForm.aliasPelapor}
                    onChange={(e) => setManualForm({ ...manualForm, aliasPelapor: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">Nama Satuan Kerja:</label>
                  <input
                    type="text"
                    placeholder="Contoh: Polrestabes Semarang"
                    value={manualForm.namaSatker}
                    onChange={(e) => setManualForm({ ...manualForm, namaSatker: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">Kode Satker (Opsional):</label>
                  <input
                    type="text"
                    placeholder="Contoh: 650123"
                    value={manualForm.kodeSatker}
                    onChange={(e) => setManualForm({ ...manualForm, kodeSatker: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">No. WhatsApp / HP (Opsional):</label>
                  <input
                    type="text"
                    placeholder="Contoh: 081234567890"
                    value={manualForm.kontakHp}
                    onChange={(e) => setManualForm({ ...manualForm, kontakHp: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold mb-1">Kategori Aduan:</label>
                  <select
                    value={manualForm.kategori}
                    onChange={(e) => setManualForm({ ...manualForm, kategori: e.target.value as AduanKategori })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs"
                  >
                    <option value="Kendala Teknis SAKTI & Rekonsiliasi">Kendala Teknis SAKTI</option>
                    <option value="Permintaan Konsultasi / Pendampingan">Permintaan Konsultasi</option>
                    <option value="Pengaduan Gratifikasi / Imbalan">Pengaduan Gratifikasi</option>
                    <option value="Pelanggaran Kode Etik / Sikap Petugas">Pelanggaran Kode Etik</option>
                    <option value="Pengaduan Layanan / Disiplin">Pengaduan Layanan</option>
                    <option value="Indikasi Fraud / Penyimpangan">Indikasi Fraud</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">Sumber Aduan:</label>
                  <select
                    value={manualForm.sumber}
                    onChange={(e) => setManualForm({ ...manualForm, sumber: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs"
                  >
                    <option value="TATAP_MUKA">👥 Tatap Muka / Front Office</option>
                    <option value="WHATSAPP_MANUAL">📱 WhatsApp / Telepon</option>
                    <option value="SURAT_RESMI">📄 Surat Resmi Kedinasan</option>
                    <option value="DASHBOARD_FORM">🌐 Form Dashboard</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">Tingkat Urgensi:</label>
                  <select
                    value={manualForm.urgensi}
                    onChange={(e) => setManualForm({ ...manualForm, urgensi: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs"
                  >
                    <option value="BIASA">Biasa</option>
                    <option value="PENTING">Penting</option>
                    <option value="SANGAT_SEGERA">Sangat Segera / Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Judul / Ringkasan Singkat Aduan: <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Konsultasi Koreksi Nilai Deviasi Halaman III DIPA"
                  value={manualForm.judulAduan}
                  onChange={(e) => setManualForm({ ...manualForm, judulAduan: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Rincian Lengkap Aduan / Kendala: <span className="text-rose-500">*</span></label>
                <textarea
                  rows={3}
                  required
                  placeholder="Tuliskan kronologi singkat, nomor SPM, atau detail kendala..."
                  value={manualForm.deskripsi}
                  onChange={(e) => setManualForm({ ...manualForm, deskripsi: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 leading-relaxed focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddManualModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-500 text-white shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Tiket Manual</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Tiket Tunggal */}
      {aduanToDelete && (
        <div className="fixed inset-0 z-[200] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h4 className="text-base font-black text-slate-900 dark:text-white">
                  Hapus Tiket Aduan?
                </h4>
                <p className="text-xs text-rose-600 dark:text-rose-400 font-mono font-bold">
                  {aduanToDelete.tiketNomor}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Apakah Anda yakin ingin menghapus tiket <span className="font-bold font-mono text-slate-900 dark:text-white">"{aduanToDelete.tiketNomor}"</span>? Data yang dihapus tidak dapat dipulihkan.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setAduanToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => executeDeleteAduan(aduanToDelete.id, aduanToDelete.tiketNomor)}
                className="px-4 py-2 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-500 text-white shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Tiket</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Kosongkan Seluruh Arsip Aduan */}
      {isConfirmDeleteAllOpen && (
        <div className="fixed inset-0 z-[200] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-900/80 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h4 className="text-base font-black text-slate-900 dark:text-white">
                  Kosongkan Semua Arsip Tiket?
                </h4>
                <p className="text-xs text-rose-600 dark:text-rose-400 font-bold">
                  Tindakan Bersih Total ({aduanList.length} Tiket)
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Tindakan ini akan menghapus seluruh data tiket aduan yang ada saat ini dari database &amp; penyimpanan lokal. Tabel aduan akan kembali bersih (0 tiket).
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsConfirmDeleteAllOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={executeDeleteAllAduan}
                className="px-4 py-2 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-500 text-white shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Bersihkan Semua ({aduanList.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ganti Password Seksi Kepatuhan Internal */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 max-w-md w-full space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-900 dark:text-slate-100">
                    Ganti Kata Sandi KI
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Khusus Ketua Seksi Kepatuhan Internal
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowChangePasswordModal(false);
                  setChangePasswordError('');
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current Password Status Box */}
            <div className={`p-3.5 rounded-2xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              isDefaultKiPassword 
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200' 
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
            }`}>
              <div className="flex items-start gap-2.5">
                {isDefaultKiPassword ? (
                  <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                ) : (
                  <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-black text-xs">
                      Status Saat Ini: {isDefaultKiPassword ? 'Masih Sandi Default (ki026)' : 'Sandi Sudah Pernah Diubah (Kustom)'}
                    </span>
                  </div>
                  <p className="text-[11px] opacity-80 mt-0.5">
                    {isDefaultKiPassword 
                      ? 'Sandi bawaan sistem belum pernah diganti. Silakan buat sandi baru agar tidak standar lagi.' 
                      : `Sandi telah disesuaikan oleh Ketua KI.${kiPasswordUpdatedAt ? ` (Terakhir: ${kiPasswordUpdatedAt})` : ''}`}
                  </p>
                </div>
              </div>

              {!isDefaultKiPassword && (
                <button
                  type="button"
                  onClick={handleResetKiPasswordToDefault}
                  className="shrink-0 px-3 py-1.5 text-[11px] font-bold rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-950 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-300 cursor-pointer transition-all shadow-xs"
                  title="Kembalikan kata sandi ke bawaan awal (ki026)"
                >
                  Reset ke Default (ki026)
                </button>
              )}
            </div>

            <form onSubmit={handleChangeKiPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span>Kata Sandi Saat Ini:</span>
                  {isDefaultKiPassword && (
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                      Default: ki026
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type={showOldPass ? 'text' : 'password'}
                    value={oldPasswordInput}
                    onChange={(e) => {
                      setOldPasswordInput(e.target.value);
                      if (changePasswordError) setChangePasswordError('');
                    }}
                    placeholder={isDefaultKiPassword ? "Masukkan sandi bawaan (ki026)..." : "Masukkan kata sandi saat ini..."}
                    className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPass(!showOldPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showOldPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Kata Sandi Baru:
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={newPasswordInput}
                    onChange={(e) => {
                      setNewPasswordInput(e.target.value);
                      if (changePasswordError) setChangePasswordError('');
                    }}
                    placeholder="Minimal 4 karakter..."
                    className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Ulangi Kata Sandi Baru:
                </label>
                <input
                  type={showNewPass ? 'text' : 'password'}
                  value={confirmPasswordInput}
                  onChange={(e) => {
                    setConfirmPasswordInput(e.target.value);
                    if (changePasswordError) setChangePasswordError('');
                  }}
                  placeholder="Ketik ulang kata sandi baru..."
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  required
                />
              </div>

              {changePasswordError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-600 dark:text-rose-400 font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{changePasswordError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowChangePasswordModal(false);
                    setChangePasswordError('');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-500 text-white shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Sandi Baru</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
