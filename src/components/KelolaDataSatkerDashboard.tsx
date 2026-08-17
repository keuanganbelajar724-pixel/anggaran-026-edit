import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  Check
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { MasterSatker, SatkerIKPA, AppTheme } from '../types';
import { ModernConfirmModal, ConfirmModalState } from './ModernConfirmModal';

interface KelolaDataSatkerDashboardProps {
  masterSatkers: MasterSatker[];
  satkers?: SatkerIKPA[];
  theme?: AppTheme;
  isAdminAuthenticated?: boolean;
  onSaveMasterSatker: (satker: MasterSatker) => Promise<void> | void;
  onUpdateMasterSatkers: (satkers: MasterSatker[]) => void;
  onDeleteMasterSatker: (id: string) => void;
  onDeleteBatchMasterSatkers: (ids: string[]) => void;
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

  // Search, Filter & Tabs
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'AKTIF' | 'NONAKTIF' | 'ADA_NO_HP' | 'BELUM_ADA_NO_HP'>('ALL');
  const [filterKL, setFilterKL] = useState<string>('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'ALL' | 'KONTAK' | 'MASTER'>('ALL');

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState | null>(null);

  // Modal State for Add / Edit Single Satker
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSatker, setEditingSatker] = useState<MasterSatker | null>(null);
  const [isQuickPhoneModalOpen, setIsQuickPhoneModalOpen] = useState(false);
  const [quickPhoneTarget, setQuickPhoneTarget] = useState<MasterSatker | null>(null);

  // Form State
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

  // Quick Phone Form
  const [quickPhoneForm, setQuickPhoneForm] = useState({
    namaPic: '',
    noHpPic: '',
    emailPic: '',
    alamatSatker: ''
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
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Distinct K/L options for filtering
  const klOptions = useMemo(() => {
    const set = new Set<string>();
    masterSatkers.forEach(m => {
      if (m.kementerianLembaga) set.add(m.kementerianLembaga);
    });
    return Array.from(set).sort();
  }, [masterSatkers]);

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
        (m.kementerianLembaga && m.kementerianLembaga.toLowerCase().includes(q));

      if (!matchSearch) return false;

      if (filterKL !== 'ALL' && m.kementerianLembaga !== filterKL) return false;

      if (filterStatus === 'AKTIF') return m.isActive === true;
      if (filterStatus === 'NONAKTIF') return m.isActive === false;
      if (filterStatus === 'ADA_NO_HP') return !!(m.noHpPic && m.noHpPic.trim().length > 5);
      if (filterStatus === 'BELUM_ADA_NO_HP') return !m.noHpPic || m.noHpPic.trim().length < 6;

      return true;
    });
  }, [masterSatkers, searchQuery, filterStatus, filterKL]);

  // Metrics
  const totalMaster = masterSatkers.length;
  const totalAktif = masterSatkers.filter(m => m.isActive).length;
  const totalNonaktif = masterSatkers.filter(m => !m.isActive).length;
  const totalHasPhone = masterSatkers.filter(m => m.noHpPic && m.noHpPic.trim().length > 5).length;
  const totalNoPhone = totalMaster - totalHasPhone;

  // Open Edit Modal
  const handleOpenEdit = (satker: MasterSatker) => {
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
      passwordSatker: satker.passwordSatker || '',
      catatan: satker.catatan || ''
    });
    setIsModalOpen(true);
  };

  // Open Add Modal
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

  // Open Quick Phone Edit
  const handleOpenQuickPhone = (satker: MasterSatker) => {
    setQuickPhoneTarget(satker);
    setQuickPhoneForm({
      namaPic: satker.namaPic || '',
      noHpPic: satker.noHpPic || '',
      emailPic: satker.emailPic || '',
      alamatSatker: satker.alamatSatker || ''
    });
    setIsQuickPhoneModalOpen(true);
  };

  // Save Quick Phone Form
  const handleSaveQuickPhone = async () => {
    if (!quickPhoneTarget) return;

    let cleanPhone = quickPhoneForm.noHpPic.trim();
    if (cleanPhone.startsWith('+62')) {
      cleanPhone = '0' + cleanPhone.substring(3);
    } else if (cleanPhone.startsWith('62') && cleanPhone.length > 8) {
      cleanPhone = '0' + cleanPhone.substring(2);
    }

    const updated: MasterSatker = {
      ...quickPhoneTarget,
      namaPic: quickPhoneForm.namaPic.trim() || undefined,
      noHpPic: cleanPhone || undefined,
      emailPic: quickPhoneForm.emailPic.trim() || undefined,
      alamatSatker: quickPhoneForm.alamatSatker.trim() || undefined,
      updatedAt: new Date().toISOString()
    };

    await onSaveMasterSatker(updated);
    setIsQuickPhoneModalOpen(false);
    setQuickPhoneTarget(null);
    triggerToast(`Nomor telepon & PIC untuk Satker ${updated.namaSatker} (${updated.kodeSatker}) berhasil disimpan.`);
  };

  // Save Full Form
  const handleSaveFullForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.kodeSatker || !formData.namaSatker) {
      alert('Kode Satker dan Nama Satker wajib diisi!');
      return;
    }

    const cleanKode = formData.kodeSatker.trim();
    let cleanPhone = (formData.noHpPic || '').trim();
    if (cleanPhone.startsWith('+62')) {
      cleanPhone = '0' + cleanPhone.substring(3);
    } else if (cleanPhone.startsWith('62') && cleanPhone.length > 8) {
      cleanPhone = '0' + cleanPhone.substring(2);
    }

    const payload: MasterSatker = {
      id: editingSatker ? editingSatker.id : `satker-${cleanKode}-${Date.now()}`,
      kodeSatker: cleanKode,
      namaSatker: formData.namaSatker.trim(),
      isActive: formData.isActive ?? true,
      kodeBa: formData.kodeBa?.trim() || '018',
      kementerianLembaga: formData.kementerianLembaga?.trim() || 'Kementerian / Lembaga Mitra',
      unitEselon1: formData.unitEselon1?.trim() || '',
      namaPic: formData.namaPic?.trim() || undefined,
      noHpPic: cleanPhone || undefined,
      emailPic: formData.emailPic?.trim() || undefined,
      alamatSatker: formData.alamatSatker?.trim() || undefined,
      passwordSatker: formData.passwordSatker?.trim() || undefined,
      catatan: formData.catatan?.trim() || undefined,
      updatedAt: new Date().toISOString(),
      createdAt: editingSatker?.createdAt || new Date().toISOString()
    };

    await onSaveMasterSatker(payload);
    setIsModalOpen(false);
    setEditingSatker(null);
    triggerToast(`Data Satker ${payload.namaSatker} (${payload.kodeSatker}) berhasil disimpan!`);
  };

  // Batch Select Toggle
  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredSatkers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredSatkers.map(m => m.id));
    }
  };

  // Batch Delete
  const handleBatchDelete = () => {
    if (selectedIds.length === 0) return;
    setConfirmModal({
      isOpen: true,
      title: `Hapus ${selectedIds.length} Satker Terpilih?`,
      message: `Apakah Anda yakin ingin menghapus ${selectedIds.length} data Satker yang dipilih dari database Master Satker?`,
      confirmText: `Ya, Hapus ${selectedIds.length} Satker`,
      cancelText: 'Batal',
      variant: 'danger',
      iconType: 'trash',
      onConfirm: () => {
        onDeleteBatchMasterSatkers(selectedIds);
        setSelectedIds([]);
        triggerToast(`${selectedIds.length} Data Satker berhasil dihapus.`);
      }
    });
  };

  // Delete All (Hapus Seluruh Master Satker)
  const handleRequestDeleteAll = () => {
    if (masterSatkers.length === 0) return;
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Seluruh Data Master Satker?',
      message: `PERHATIAN: Apakah Anda yakin ingin MENGHAPUS SEMUA (${masterSatkers.length}) Data Master Satker? Tindakan ini akan mengosongkan seluruh database master satuan kerja. Anda dapat mengimpor kembali file Excel referensi master kapan saja.`,
      confirmText: `Ya, Hapus Semua (${masterSatkers.length} Satker)`,
      cancelText: 'Batal',
      variant: 'danger',
      iconType: 'trash',
      onConfirm: () => {
        if (onClearAllMasterSatkers) {
          onClearAllMasterSatkers();
        } else {
          onUpdateMasterSatkers([]);
        }
        setSelectedIds([]);
        triggerToast('Seluruh data Master Satker berhasil dikosongkan.');
      }
    });
  };

  // Delete Single Satker
  const handleRequestDeleteSingle = (satker: MasterSatker) => {
    setConfirmModal({
      isOpen: true,
      title: `Hapus Satker ${satker.kodeSatker}?`,
      message: `Apakah Anda yakin ingin menghapus "${satker.namaSatker}" (${satker.kodeSatker}) dari daftar master satker?`,
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      variant: 'danger',
      iconType: 'trash',
      onConfirm: () => {
        onDeleteMasterSatker(satker.id);
        triggerToast(`Satker ${satker.namaSatker} (${satker.kodeSatker}) berhasil dihapus.`);
      }
    });
  };

  // Batch Activate / Deactivate
  const handleBatchToggleStatus = (targetActive: boolean) => {
    if (selectedIds.length === 0) return;
    const updated = masterSatkers.map(m => {
      if (selectedIds.includes(m.id)) {
        return { ...m, isActive: targetActive, updatedAt: new Date().toISOString() };
      }
      return m;
    });
    onUpdateMasterSatkers(updated);
    setSelectedIds([]);
    triggerToast(`${selectedIds.length} Satker berhasil diubah menjadi ${targetActive ? 'AKTIF' : 'NONAKTIF'}.`);
  };

  // Upload Excel Master Satker (Kolom H, I, J)
  const handleMasterFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const jsonData = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

        if (jsonData.length < 2) {
          throw new Error('File Excel tidak memiliki baris data.');
        }

        // Cari header index atau default ke kolom H (idx 7), I (idx 8), J (idx 9)
        let headerRowIdx = 0;
        let colKode = 7;
        let colNama = 8;
        let colStatus = 9;
        let colPic = -1;
        let colHp = -1;
        let colEmail = -1;

        for (let r = 0; r < Math.min(jsonData.length, 10); r++) {
          const row = jsonData[r];
          if (!row) continue;
          row.forEach((cell: any, cIdx: number) => {
            const str = String(cell || '').toLowerCase().trim();
            if (str.includes('kode') && str.includes('satker')) colKode = cIdx;
            if (str.includes('nama') && str.includes('satker')) colNama = cIdx;
            if (str.includes('status') || str.includes('aktif')) colStatus = cIdx;
            if (str.includes('pic') || str.includes('kontak') || str.includes('nama pic')) colPic = cIdx;
            if (str.includes('hp') || str.includes('wa') || str.includes('telepon') || str.includes('no hp')) colHp = cIdx;
            if (str.includes('email')) colEmail = cIdx;
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
          const rawStatus = row[colStatus] !== undefined ? String(row[colStatus]).trim().toUpperCase() : 'AKTIF';
          const isActive = !rawStatus.includes('NON') && !rawStatus.includes('TIDAK') && !rawStatus.includes('PASIF') && rawStatus !== '0' && rawStatus !== 'FALSE';

          const namaPic = colPic !== -1 && row[colPic] ? String(row[colPic]).trim() : undefined;
          const noHpPic = colHp !== -1 && row[colHp] ? String(row[colHp]).trim() : undefined;
          const emailPic = colEmail !== -1 && row[colEmail] ? String(row[colEmail]).trim() : undefined;

          const existing = newMasterMap.get(kodeSatker);
          if (existing) {
            newMasterMap.set(kodeSatker, {
              ...existing,
              namaSatker: namaSatker || existing.namaSatker,
              isActive: isActive,
              namaPic: namaPic || existing.namaPic,
              noHpPic: noHpPic || existing.noHpPic,
              emailPic: emailPic || existing.emailPic,
              updatedAt: new Date().toISOString()
            });
            updatedCount++;
          } else {
            newMasterMap.set(kodeSatker, {
              id: `master-${kodeSatker}-${Date.now()}-${r}`,
              kodeSatker,
              namaSatker,
              isActive,
              kodeBa: '018',
              kementerianLembaga: 'Kementerian / Lembaga Mitra',
              namaPic,
              noHpPic,
              emailPic,
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
          message: `Berhasil mengolah Excel Master Satker! ${addedCount} Satker baru ditambahkan, ${updatedCount} Satker diperbarui. Total Master: ${resultList.length} Satker.`
        });
        triggerToast(`Excel Master Satker berhasil diimpor (${addedCount + updatedCount} baris terproses).`);
      } catch (err: any) {
        console.error('Error importing master satker excel:', err);
        setUploadFeedback({
          type: 'error',
          message: `Gagal memproses file Excel: ${err.message || 'Format kolom tidak sesuai.'}`
        });
      } finally {
        setIsProcessingFile(false);
        if (masterFileInputRef.current) masterFileInputRef.current.value = '';
      }
    };

    reader.readAsBinaryString(file);
  };

  // Upload Excel Khusus Kontak & Nomor HP PIC
  const handlePhoneFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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

        if (jsonData.length < 2) throw new Error('File tidak memiliki baris data.');

        let colKode = 0;
        let colPic = 1;
        let colHp = 2;
        let colEmail = 3;

        // Auto detect header
        const header = jsonData[0] || [];
        header.forEach((cell: any, idx: number) => {
          const str = String(cell || '').toLowerCase();
          if (str.includes('kode')) colKode = idx;
          if (str.includes('nama pic') || str.includes('pic') || str.includes('petugas')) colPic = idx;
          if (str.includes('hp') || str.includes('wa') || str.includes('telepon') || str.includes('kontak')) colHp = idx;
          if (str.includes('email')) colEmail = idx;
        });

        const masterMap = new Map<string, MasterSatker>();
        masterSatkers.forEach(m => masterMap.set(m.kodeSatker, { ...m }));

        let updatedPhoneCount = 0;

        for (let r = 1; r < jsonData.length; r++) {
          const row = jsonData[r];
          if (!row || !row[colKode]) continue;

          const rawKode = String(row[colKode]).trim().replace(/\D/g, '');
          if (!rawKode || rawKode.length < 5) continue;
          const kodeSatker = rawKode.padStart(6, '0');

          const namaPic = row[colPic] ? String(row[colPic]).trim() : '';
          let noHp = row[colHp] ? String(row[colHp]).trim().replace(/\s+/g, '').replace(/[-_.]/g, '') : '';
          if (noHp.startsWith('+62')) noHp = '0' + noHp.substring(3);
          else if (noHp.startsWith('62') && noHp.length > 8) noHp = '0' + noHp.substring(2);

          const email = row[colEmail] ? String(row[colEmail]).trim() : '';

          const existing = masterMap.get(kodeSatker);
          if (existing) {
            masterMap.set(kodeSatker, {
              ...existing,
              namaPic: namaPic || existing.namaPic,
              noHpPic: noHp || existing.noHpPic,
              emailPic: email || existing.emailPic,
              updatedAt: new Date().toISOString()
            });
            updatedPhoneCount++;
          }
        }

        const resultList = Array.from(masterMap.values());
        onUpdateMasterSatkers(resultList);
        setUploadFeedback({
          type: 'success',
          message: `Berhasil memperbarui ${updatedPhoneCount} nomor HP dan PIC Satker dari file Excel!`
        });
        triggerToast(`${updatedPhoneCount} Nomor Telepon PIC berhasil diperbarui.`);
      } catch (err: any) {
        console.error('Error importing phone numbers:', err);
        setUploadFeedback({
          type: 'error',
          message: `Gagal membaca Excel Kontak: ${err.message}`
        });
      } finally {
        setIsProcessingFile(false);
        if (phoneFileInputRef.current) phoneFileInputRef.current.value = '';
      }
    };

    reader.readAsBinaryString(file);
  };

  // Download Template Master Satker (Kolom H, I, J)
  const downloadMasterSatkerTemplate = () => {
    const headers = [
      ['KEMENTERIAN KEUANGAN REPUBLIK INDONESIA', '', '', '', '', '', '', '', '', ''],
      ['DIREKTORAT JENDERAL PERBENDAHARAAN - KPPN SEMARANG I (026)', '', '', '', '', '', '', '', '', ''],
      ['DAFTAR MASTER SATKER MITRA KERJA (SOURCE OF TRUTH)', '', '', '', '', '', '', '', '', ''],
      [''],
      ['No', 'Kode BA', 'Kementerian/Lembaga', 'Kode Unit', 'Unit Eselon I', 'Kode KPPN', 'Nama KPPN', 'Kode Satker', 'Nama Satker', 'Status Satker']
    ];

    const sampleRows = masterSatkers.length > 0
      ? masterSatkers.slice(0, 10).map((m, idx) => [
          idx + 1,
          m.kodeBa || '018',
          m.kementerianLembaga || 'Kementerian Pertanian',
          '01',
          m.unitEselon1 || 'Sekretariat Jenderal',
          '026',
          'KPPN SEMARANG I',
          m.kodeSatker,
          m.namaSatker,
          m.isActive ? 'AKTIF' : 'NONAKTIF'
        ])
      : [
          [1, '018', 'Kementerian Pertanian', '01', 'Sekretariat Jenderal', '026', 'KPPN SEMARANG I', '651046', 'BBPPTP SURAKARTA', 'AKTIF'],
          [2, '060', 'Kepolisian Negara Republik Indonesia', '01', 'POLDA JAWA TENGAH', '026', 'KPPN SEMARANG I', '652189', 'POLRESTABES SEMARANG', 'AKTIF'],
          [3, '015', 'Kementerian Keuangan', '08', 'Kanwil Ditjen Perbendaharaan', '026', 'KPPN SEMARANG I', '415392', 'KPPN SEMARANG I', 'AKTIF']
        ];

    const wsData = [...headers, ...sampleRows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [
      { wch: 5 }, { wch: 10 }, { wch: 30 }, { wch: 10 }, { wch: 30 }, { wch: 12 }, { wch: 20 }, { wch: 15 }, { wch: 45 }, { wch: 15 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Master_Satker');
    XLSX.writeFile(wb, 'Format_Master_Satker_KPPN_Semarang_I.xlsx');
  };

  // Download Template Update Nomor HP Satker
  const downloadPhoneUpdateTemplate = () => {
    const data = masterSatkers.map(m => ({
      'Kode Satker': m.kodeSatker,
      'Nama Satker': m.namaSatker,
      'Nama PIC / Operator': m.namaPic || '',
      'Nomor WhatsApp / HP': m.noHpPic || '',
      'Email PIC': m.emailPic || '',
      'Status': m.isActive ? 'Aktif' : 'Nonaktif'
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [
      { wch: 15 }, { wch: 40 }, { wch: 25 }, { wch: 20 }, { wch: 30 }, { wch: 12 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Update_Kontak_Satker');
    XLSX.writeFile(wb, 'Template_Update_Nomor_Telepon_Satker_KPPN026.xlsx');
  };

  // Export Full Master Satker to Excel
  const handleExportExcel = () => {
    const exportData = filteredSatkers.map((m, idx) => ({
      'No': idx + 1,
      'Kode Satker': m.kodeSatker,
      'Nama Satker': m.namaSatker,
      'Status Kemitraan': m.isActive ? 'AKTIF' : 'NONAKTIF',
      'Kementerian / Lembaga': m.kementerianLembaga || '-',
      'Kode BA': m.kodeBa || '-',
      'Unit Eselon I': m.unitEselon1 || '-',
      'Nama PIC': m.namaPic || '-',
      'No WhatsApp / HP': m.noHpPic || '-',
      'Email PIC': m.emailPic || '-',
      'Alamat Satker': m.alamatSatker || '-',
      'Catatan': m.catatan || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    ws['!cols'] = [
      { wch: 5 }, { wch: 14 }, { wch: 40 }, { wch: 18 }, { wch: 30 }, { wch: 10 }, { wch: 25 }, { wch: 25 }, { wch: 20 }, { wch: 28 }, { wch: 35 }, { wch: 25 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data_Satker_KPPN026');
    XLSX.writeFile(wb, `Master_Data_Satker_KPPN_Semarang_I_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 right-5 z-50 bg-emerald-600 text-white font-bold text-xs px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-emerald-400"
          >
            <CheckCircle2 className="w-4 h-4 text-white" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

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
        onChange={handlePhoneFileUpload}
        accept=".xlsx, .xls, .csv"
        className="hidden"
      />

      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-2xl border border-sky-500/30 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-sky-500/20 border border-sky-400/40 text-sky-200 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-xs">
              <Building2 className="w-3.5 h-3.5 text-sky-400" />
              <span>DASHBOARD DEDIKASI KELOLA DATA SATKER • SOURCE OF TRUTH</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Pusat Manajemen Master Satker &amp; Database Kontak PIC
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Pengelolaan seluruh data mitra satker KPPN Semarang I: nomor WhatsApp/telepon PIC, status kemitraan aktif/nonaktif, alamat, dan referensi resmi. 
              <strong> Pengisian nomor telepon kini terpusat di sini</strong> dan tidak bercampur dengan file Excel IKPA.
            </p>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleOpenAdd}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Satker Baru</span>
            </button>

            <button
              type="button"
              onClick={() => phoneFileInputRef.current?.click()}
              disabled={isProcessingFile}
              className="bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-md border border-sky-400/30 transition-all flex items-center gap-2 cursor-pointer"
              title="Upload file Excel khusus untuk update massal Nama PIC dan Nomor HP WhatsApp Satker"
            >
              <Phone className="w-4 h-4 text-sky-200" />
              <span>Upload Kontak (.xlsx)</span>
            </button>

            <button
              type="button"
              onClick={() => masterFileInputRef.current?.click()}
              disabled={isProcessingFile}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-md border border-indigo-400/30 transition-all flex items-center gap-2 cursor-pointer"
              title="Upload file referensi resmi Master Satker (Kolom H, I, J)"
            >
              <Upload className="w-4 h-4 text-indigo-200" />
              <span>Upload Master Referensi</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
              title="Ekspor seluruh data Satker beserta kontak ke Excel"
            >
              <FileDown className="w-4 h-4 text-slate-300" />
              <span>Export (.xlsx)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Upload Feedback Alert if any */}
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
          <button
            onClick={() => setUploadFeedback(null)}
            className="text-xs font-bold underline cursor-pointer"
          >
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
              Total Master Satker
            </span>
            <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-slate-100">
              {totalMaster}
            </span>
            <span className="text-xs font-medium text-slate-500">Satker terdaftar</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Sumber acuan seluruh indikator IKPA &amp; Capaian Output
          </p>
        </div>

        <div className={`p-5 rounded-2xl border transition-all ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Satker Aktif (Muncul)
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
            {totalNonaktif} Satker nonaktif disembunyikan dari dashboard
          </p>
        </div>

        <div className={`p-5 rounded-2xl border transition-all ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
              Kontak WhatsApp Ada
            </span>
            <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
              <Phone className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-sky-600 dark:text-sky-400">
              {totalHasPhone}
            </span>
            <span className="text-xs font-medium text-slate-500">
              ({totalMaster > 0 ? Math.round((totalHasPhone / totalMaster) * 100) : 0}%)
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Siap dihubungi via WhatsApp Gateway &amp; Reminder
          </p>
        </div>

        <div className={`p-5 rounded-2xl border transition-all ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Belum Ada No WhatsApp
            </span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-600 dark:text-amber-400">
              {totalNoPhone}
            </span>
            <button
              onClick={() => setFilterStatus('BELUM_ADA_NO_HP')}
              className="text-[11px] font-extrabold text-amber-600 hover:underline cursor-pointer"
            >
              Filter &amp; Isi &rarr;
            </button>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Klik tombol di atas untuk mengisi nomor telepon satker ini
          </p>
        </div>
      </div>

      {/* Helper Guideline Bar */}
      <div className="bg-gradient-to-r from-sky-50 via-indigo-50/40 to-emerald-50 dark:from-sky-950/30 dark:via-indigo-950/20 dark:to-emerald-950/30 border border-sky-200 dark:border-sky-800/60 p-4 sm:p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2 font-black text-slate-900 dark:text-slate-100">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Format Download &amp; Template Pengisian:</span>
          </div>
          <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
            Anda dapat mengunduh format template Master Satker resmi atau template pengisian Nomor Telepon PIC untuk dibagikan kepada satker mitra.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={downloadPhoneUpdateTemplate}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Format Update Kontak (.xlsx)</span>
          </button>

          <button
            type="button"
            onClick={downloadMasterSatkerTemplate}
            className="bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Format Master Referensi (Kolom H, I, J)</span>
          </button>
        </div>
      </div>

      {/* Search, Filter & Bulk Action Toolbar */}
      <div className={`p-4 sm:p-5 rounded-2xl border space-y-3 ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
      }`}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari Kode Satker (6 digit), Nama Satker, Nama PIC, No WhatsApp, atau K/L..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full text-xs rounded-xl pl-9 pr-4 py-2.5 border focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all ${
                isDark
                  ? 'bg-slate-950 text-slate-100 border-slate-800 placeholder:text-slate-500'
                  : 'bg-slate-50 text-slate-900 border-slate-300 placeholder:text-slate-400 focus:bg-white'
              }`}
            />
          </div>

          {/* Filter Status Pills */}
          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterStatus === 'ALL'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Semua ({totalMaster})
            </button>

            <button
              onClick={() => setFilterStatus('AKTIF')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                filterStatus === 'AKTIF'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>Aktif ({totalAktif})</span>
            </button>

            <button
              onClick={() => setFilterStatus('NONAKTIF')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                filterStatus === 'NONAKTIF'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100'
              }`}
            >
              <XCircle className="w-3 h-3" />
              <span>Nonaktif ({totalNonaktif})</span>
            </button>

            <button
              onClick={() => setFilterStatus('ADA_NO_HP')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                filterStatus === 'ADA_NO_HP'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 hover:bg-sky-100'
              }`}
            >
              <Phone className="w-3 h-3" />
              <span>Ada No HP ({totalHasPhone})</span>
            </button>

            <button
              onClick={() => setFilterStatus('BELUM_ADA_NO_HP')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                filterStatus === 'BELUM_ADA_NO_HP'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 hover:bg-amber-100'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>Belum Ada No HP ({totalNoPhone})</span>
            </button>
          </div>
        </div>

        {/* Second Filter Row: K/L Dropdown & Batch Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-semibold">Filter K/L:</span>
            <select
              value={filterKL}
              onChange={(e) => setFilterKL(e.target.value)}
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

          {/* Batch Action Bar if items selected */}
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
                onClick={handleBatchDelete}
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] px-2.5 py-1 rounded-lg transition-all flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Hapus</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="text-slate-500 hover:text-slate-700 text-[11px] font-bold px-1"
              >
                Batal
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Satkers Table */}
      <div className={`rounded-3xl border overflow-hidden shadow-xl ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
              Daftar Master Satker KPPN Semarang I ({filteredSatkers.length} Satker)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Klik pada tombol <strong className="text-sky-600">Isi / Edit Kontak</strong> untuk memperbarui nomor WhatsApp PIC satker secara instan.
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
                <th className="py-3.5 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={filteredSatkers.length > 0 && selectedIds.length === filteredSatkers.length}
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-sky-600 cursor-pointer"
                  />
                </th>
                <th className="py-3.5 px-4">Kode Satker</th>
                <th className="py-3.5 px-4">Nama Satker &amp; K/L</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Kontak PIC / WhatsApp</th>
                <th className="py-3.5 px-4">Email &amp; Alamat</th>
                <th className="py-3.5 px-4 text-center">Aksi Manajemen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredSatkers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Building2 className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                    <p className="font-bold text-sm">Tidak ada Satker yang sesuai kriteria pencarian</p>
                    <p className="text-xs mt-1">Coba ubah kata kunci atau reset filter status.</p>
                  </td>
                </tr>
              ) : (
                filteredSatkers.map((satker) => {
                  const isSelected = selectedIds.includes(satker.id);
                  const hasPhone = !!(satker.noHpPic && satker.noHpPic.trim().length > 5);

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
                      {/* Checkbox */}
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(satker.id)}
                          className="rounded border-slate-300 text-sky-600 cursor-pointer"
                        />
                      </td>

                      {/* Kode Satker */}
                      <td className="py-3.5 px-4 font-mono font-black text-sky-600 dark:text-sky-400 text-sm whitespace-nowrap">
                        {satker.kodeSatker}
                        {satker.kodeBa && (
                          <span className="block text-[10px] font-mono text-slate-400 font-normal">
                            BA: {satker.kodeBa}
                          </span>
                        )}
                      </td>

                      {/* Nama Satker & K/L */}
                      <td className="py-3.5 px-4 min-w-[220px]">
                        <div className="font-extrabold text-slate-900 dark:text-slate-100 text-xs">
                          {satker.namaSatker}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                          {satker.kementerianLembaga || 'Kementerian / Lembaga Mitra'}
                        </div>
                      </td>

                      {/* Status Aktif / Nonaktif Toggle */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onToggleActiveMasterSatker(satker.id)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black border transition-all cursor-pointer ${
                            satker.isActive
                              ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                              : 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                          }`}
                          title="Klik untuk mengubah status aktif / nonaktif Satker"
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
                      </td>

                      {/* Kontak PIC / WhatsApp */}
                      <td className="py-3.5 px-4 min-w-[200px]">
                        {hasPhone ? (
                          <div className="space-y-1">
                            <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                              <User className="w-3 h-3 text-sky-600" />
                              <span>{satker.namaPic || 'PIC Satker'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <a
                                href={`https://wa.me/${satker.noHpPic?.replace(/[^0-9]/g, '').replace(/^0/, '62')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 font-mono font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 px-2 py-0.5 rounded-md text-[11px] transition-colors"
                                title="Klik untuk chat WhatsApp langsung"
                              >
                                <Phone className="w-3 h-3" />
                                <span>{satker.noHpPic}</span>
                                <ExternalLink className="w-2.5 h-2.5 ml-0.5 opacity-70" />
                              </a>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenQuickPhone(satker)}
                            className="bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 font-extrabold text-[11px] px-2.5 py-1 rounded-lg border border-amber-300 dark:border-amber-800 transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>+ Tambah No WhatsApp</span>
                          </button>
                        )}
                      </td>

                      {/* Email & Alamat */}
                      <td className="py-3.5 px-4 min-w-[180px] text-[11px]">
                        <div className="text-slate-600 dark:text-slate-300 flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[160px]">{satker.emailPic || '-'}</span>
                        </div>
                        <div className="text-slate-400 dark:text-slate-500 text-[10px] mt-0.5 truncate max-w-[180px]">
                          {satker.alamatSatker || 'Alamat belum diatur'}
                        </div>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenQuickPhone(satker)}
                            className="p-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/60 dark:hover:bg-sky-900/80 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 transition-colors cursor-pointer"
                            title="Edit Cepat Nomor Telepon & PIC"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(satker)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                            title="Edit Lengkap Master Satker"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Hapus Satker ${satker.namaSatker} (${satker.kodeSatker}) dari Master Satker?`)) {
                                onDeleteMasterSatker(satker.id);
                                triggerToast(`Satker ${satker.kodeSatker} berhasil dihapus.`);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/80 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                            title="Hapus Satker"
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

      {/* MODAL 1: Quick Phone & Contact Editor */}
      {isQuickPhoneModalOpen && quickPhoneTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className={`rounded-3xl border shadow-2xl max-w-lg w-full p-6 space-y-5 ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 px-2.5 py-0.5 rounded-full">
                  FORM PENGISIAN NOMOR TELEPON SATKER
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 mt-1">
                  Kontak WhatsApp Satker {quickPhoneTarget.kodeSatker}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickPhoneModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-sky-50 dark:bg-sky-950/50 p-3 rounded-2xl border border-sky-200 dark:border-sky-800 text-xs">
              <span className="font-extrabold text-sky-900 dark:text-sky-200 block">{quickPhoneTarget.namaSatker}</span>
              <span className="text-slate-500 text-[11px]">K/L: {quickPhoneTarget.kementerianLembaga || '-'}</span>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="font-extrabold block text-slate-700 dark:text-slate-300 mb-1">
                  Nama PIC / Operator Satker:
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Budi Santoso (Operator SAS/SAKTI)"
                  value={quickPhoneForm.namaPic}
                  onChange={(e) => setQuickPhoneForm({ ...quickPhoneForm, namaPic: e.target.value })}
                  className={`w-full text-xs rounded-xl p-2.5 border focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                    isDark ? 'bg-slate-950 text-slate-100 border-slate-800' : 'bg-slate-50 text-slate-900 border-slate-300'
                  }`}
                />
              </div>

              <div>
                <label className="font-extrabold block text-slate-700 dark:text-slate-300 mb-1">
                  Nomor WhatsApp / HP Resmi Satker (08xxx / 628xxx):
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-3 text-emerald-600" />
                  <input
                    type="text"
                    placeholder="Contoh: 081234567890"
                    value={quickPhoneForm.noHpPic}
                    onChange={(e) => setQuickPhoneForm({ ...quickPhoneForm, noHpPic: e.target.value })}
                    className={`w-full text-xs font-mono font-bold rounded-xl pl-9 pr-3 py-2.5 border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      isDark ? 'bg-slate-950 text-slate-100 border-slate-800' : 'bg-slate-50 text-slate-900 border-slate-300'
                    }`}
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Nomor ini akan digunakan untuk Broadcast Pengingat WhatsApp, Notifikasi Capaian Output &amp; Evaluasi IKPA.
                </p>
              </div>

              <div>
                <label className="font-extrabold block text-slate-700 dark:text-slate-300 mb-1">
                  Email Resmi Satker / PIC (Opsional):
                </label>
                <input
                  type="email"
                  placeholder="satker@kemenkeu.go.id"
                  value={quickPhoneForm.emailPic}
                  onChange={(e) => setQuickPhoneForm({ ...quickPhoneForm, emailPic: e.target.value })}
                  className={`w-full text-xs rounded-xl p-2.5 border focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                    isDark ? 'bg-slate-950 text-slate-100 border-slate-800' : 'bg-slate-50 text-slate-900 border-slate-300'
                  }`}
                />
              </div>

              <div>
                <label className="font-extrabold block text-slate-700 dark:text-slate-300 mb-1">
                  Alamat Kantor Satker (Opsional):
                </label>
                <input
                  type="text"
                  placeholder="Jl. Pahlawan No. 1, Kota Semarang"
                  value={quickPhoneForm.alamatSatker}
                  onChange={(e) => setQuickPhoneForm({ ...quickPhoneForm, alamatSatker: e.target.value })}
                  className={`w-full text-xs rounded-xl p-2.5 border focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                    isDark ? 'bg-slate-950 text-slate-100 border-slate-800' : 'bg-slate-50 text-slate-900 border-slate-300'
                  }`}
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsQuickPhoneModalOpen(false)}
                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleSaveQuickPhone}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Nomor Telepon</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Full Add/Edit Master Satker */}
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

              {/* Kontak Section */}
              <div className="p-4 rounded-2xl bg-sky-50/50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/60 space-y-3">
                <span className="font-black text-sky-800 dark:text-sky-300 text-xs block">
                  Informasi Kontak &amp; Nomor Telepon PIC
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold block text-slate-700 dark:text-slate-300 mb-1">
                      Nama PIC / Operator:
                    </label>
                    <input
                      type="text"
                      placeholder="Nama Petugas Keuangan"
                      value={formData.namaPic || ''}
                      onChange={(e) => setFormData({ ...formData, namaPic: e.target.value })}
                      className={`w-full text-xs rounded-xl p-2 border ${
                        isDark ? 'bg-slate-950 text-slate-100 border-slate-800' : 'bg-white text-slate-900 border-slate-300'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="font-semibold block text-slate-700 dark:text-slate-300 mb-1">
                      Nomor WhatsApp / HP:
                    </label>
                    <input
                      type="text"
                      placeholder="081234567890"
                      value={formData.noHpPic || ''}
                      onChange={(e) => setFormData({ ...formData, noHpPic: e.target.value })}
                      className={`w-full text-xs font-mono font-bold rounded-xl p-2 border ${
                        isDark ? 'bg-slate-950 text-slate-100 border-slate-800' : 'bg-white text-slate-900 border-slate-300'
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold block text-slate-700 dark:text-slate-300 mb-1">
                      Email Satker:
                    </label>
                    <input
                      type="email"
                      placeholder="satker@kemenkeu.go.id"
                      value={formData.emailPic || ''}
                      onChange={(e) => setFormData({ ...formData, emailPic: e.target.value })}
                      className={`w-full text-xs rounded-xl p-2 border ${
                        isDark ? 'bg-slate-950 text-slate-100 border-slate-800' : 'bg-white text-slate-900 border-slate-300'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="font-semibold block text-slate-700 dark:text-slate-300 mb-1">
                      Password Login Satker:
                    </label>
                    <input
                      type="text"
                      placeholder="Kode rahasia login profil"
                      value={formData.passwordSatker || ''}
                      onChange={(e) => setFormData({ ...formData, passwordSatker: e.target.value })}
                      className={`w-full text-xs font-mono rounded-xl p-2 border ${
                        isDark ? 'bg-slate-950 text-slate-100 border-slate-800' : 'bg-white text-slate-900 border-slate-300'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold block text-slate-700 dark:text-slate-300 mb-1">
                    Alamat Satker:
                  </label>
                  <input
                    type="text"
                    placeholder="Alamat kantor satker lengkap"
                    value={formData.alamatSatker || ''}
                    onChange={(e) => setFormData({ ...formData, alamatSatker: e.target.value })}
                    className={`w-full text-xs rounded-xl p-2 border ${
                      isDark ? 'bg-slate-950 text-slate-100 border-slate-800' : 'bg-white text-slate-900 border-slate-300'
                    }`}
                  />
                </div>
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
                  <span>Simpan Data Satker</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
