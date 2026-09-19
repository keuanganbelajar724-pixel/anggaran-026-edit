import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  MasterSatker,
  PendaftaranUserSaktiDraft,
  PegawaiEmailRecord,
  PejabatEmailPenandatangan,
  PendaftaranEmailDraft,
  PendaftaranEmailHistoryItem
} from '../../types';
import { exportPendaftaranEmailToExcel, exportPendaftaranEmailToPDF, STATUS_PEGAWAI_MAP } from '../../utils/pendaftaranEmailExport';
import { AmbilDariUserSaktiModal } from './AmbilDariUserSaktiModal';
import { RiwayatPendaftaranEmailModal } from './RiwayatPendaftaranEmailModal';
import {
  Mail,
  Plus,
  Trash2,
  FileSpreadsheet,
  FileText,
  Upload,
  Download,
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  History,
  Building2,
  ShieldCheck,
  Edit2,
  Info
} from 'lucide-react';

interface PendaftaranEmailTabProps {
  satker: MasterSatker;
  userSaktiDraft?: PendaftaranUserSaktiDraft;
  userName?: string;
}

export const PendaftaranEmailTab: React.FC<PendaftaranEmailTabProps> = ({
  satker,
  userSaktiDraft,
  userName = 'Operator Satker'
}) => {
  const kodeKppn = satker.kodeKppn || '136';
  const kodeSatker = satker.kodeSatker;
  const namaSatker = satker.namaSatker;

  // Local storage keys per Satker for isolation
  const DRAFT_STORAGE_KEY = `sakti_pendaftaran_email_draft_${kodeSatker}`;
  const HISTORY_STORAGE_KEY = `sakti_email_history_${kodeSatker}`;

  // Main State
  const [emailDraft, setEmailDraft] = useState<PendaftaranEmailDraft>(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading email draft', e);
    }

    // Default Pejabat (KPA)
    const kpaFromMaster = satker.pejabatOperator?.kpa;
    const defaultPejabat: PejabatEmailPenandatangan = {
      nama: kpaFromMaster?.nama || userSaktiDraft?.namaKpa || 'Nama Kuasa Pengguna Anggaran',
      nip: kpaFromMaster?.nip || userSaktiDraft?.nipKpa || '198001012005011001',
      jabatan: 'Kuasa Pengguna Anggaran'
    };

    return {
      id: `email-draft-${kodeSatker}-${Date.now()}`,
      kodeKppn,
      kodeSatker,
      namaSatker,
      pegawaiList: [],
      pejabat: defaultPejabat,
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  });

  const [historyList, setHistoryList] = useState<PendaftaranEmailHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading email history', e);
    }
    return [];
  });

  // Modals & UI States
  const [isAmbilSaktiOpen, setIsAmbilSaktiOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Manual Add/Edit Pegawai Modal
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [editingPegawai, setEditingPegawai] = useState<PegawaiEmailRecord | null>(null);
  const [manualForm, setManualForm] = useState<{
    nama: string;
    nip: string;
    nik: string;
    status: 1 | 2 | 3 | 4 | 5;
    jabatan: string;
  }>({
    nama: '',
    nip: '',
    nik: '',
    status: 3,
    jabatan: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-save draft
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(emailDraft));
    } catch (e) {
      console.error('Error saving email draft', e);
    }
  }, [emailDraft, DRAFT_STORAGE_KEY]);

  // Save history
  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(historyList));
    } catch (e) {
      console.error('Error saving email history', e);
    }
  }, [historyList, HISTORY_STORAGE_KEY]);

  const showToast = (type: 'success' | 'error' | 'info', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Set of existing NIPs in draft
  const existingNips = useMemo(() => {
    return new Set(emailDraft.pegawaiList.map(p => (p.nip || '').replace(/\D/g, '')));
  }, [emailDraft.pegawaiList]);

  // Filtered employees
  const filteredPegawai = useMemo(() => {
    const q = searchTerm.toLowerCase();
    if (!q) return emailDraft.pegawaiList;
    return emailDraft.pegawaiList.filter(p => {
      const nama = (p.nama || '').toLowerCase();
      const nip = (p.nip || '').replace(/\D/g, '');
      const nik = (p.nik || '').replace(/\D/g, '');
      const statusStr = (STATUS_PEGAWAI_MAP[p.status] || '').toLowerCase();
      return nama.includes(q) || nip.includes(q) || nik.includes(q) || statusStr.includes(q);
    });
  }, [emailDraft.pegawaiList, searchTerm]);

  // Import from User SAKTI
  const handleImportFromSakti = (newRecords: PegawaiEmailRecord[]) => {
    // Filter duplicates by NIP
    const existingNipSet = new Set(emailDraft.pegawaiList.map(p => (p.nip || '').replace(/\D/g, '')));
    const toAdd = newRecords.filter(r => !existingNipSet.has(r.nip));
    const duplicateCount = newRecords.length - toAdd.length;

    setEmailDraft(prev => ({
      ...prev,
      pegawaiList: [...prev.pegawaiList, ...toAdd],
      updatedAt: new Date().toISOString()
    }));

    if (toAdd.length > 0) {
      showToast('success', `${toAdd.length} pegawai dari User SAKTI berhasil ditambahkan.`);
    } else {
      showToast('info', 'Semua pegawai yang dipilih sudah terdaftar sebelumnya.');
    }
  };

  // Handle Manual Add or Edit Save
  const handleSaveManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.nama.trim()) {
      showToast('error', 'Nama pegawai wajib diisi.');
      return;
    }
    const cleanNip = manualForm.nip.replace(/\D/g, '');
    const cleanNik = manualForm.nik.replace(/\D/g, '');

    if (editingPegawai) {
      // Edit
      setEmailDraft(prev => ({
        ...prev,
        pegawaiList: prev.pegawaiList.map(p =>
          p.id === editingPegawai.id
            ? {
                ...p,
                nama: manualForm.nama.trim(),
                nip: cleanNip,
                nik: cleanNik,
                status: manualForm.status,
                jabatan: manualForm.jabatan.trim()
              }
            : p
        ),
        updatedAt: new Date().toISOString()
      }));
      showToast('success', 'Data pegawai berhasil diperbarui.');
    } else {
      // Add
      const newRec: PegawaiEmailRecord = {
        id: `email-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        kodeKppn,
        kodeSatker,
        nama: manualForm.nama.trim(),
        nip: cleanNip,
        nik: cleanNik,
        status: manualForm.status,
        jabatan: manualForm.jabatan.trim()
      };
      setEmailDraft(prev => ({
        ...prev,
        pegawaiList: [...prev.pegawaiList, newRec],
        updatedAt: new Date().toISOString()
      }));
      showToast('success', 'Pegawai baru berhasil ditambahkan.');
    }

    setIsManualModalOpen(false);
    setEditingPegawai(null);
  };

  const openManualModalForNew = () => {
    setEditingPegawai(null);
    setManualForm({
      nama: '',
      nip: '',
      nik: '',
      status: 3,
      jabatan: ''
    });
    setIsManualModalOpen(true);
  };

  const openManualModalForEdit = (p: PegawaiEmailRecord) => {
    setEditingPegawai(p);
    setManualForm({
      nama: p.nama,
      nip: p.nip,
      nik: p.nik,
      status: p.status,
      jabatan: p.jabatan || ''
    });
    setIsManualModalOpen(true);
  };

  const handleDeletePegawai = (id: string) => {
    setEmailDraft(prev => ({
      ...prev,
      pegawaiList: prev.pegawaiList.filter(p => p.id !== id),
      updatedAt: new Date().toISOString()
    }));
    showToast('info', 'Pegawai dihapus dari daftar permohonan.');
  };

  const handleClearAll = () => {
    if (confirm('Yakin ingin mengosongkan seluruh daftar permohonan email?')) {
      setEmailDraft(prev => ({
        ...prev,
        pegawaiList: [],
        updatedAt: new Date().toISOString()
      }));
      showToast('info', 'Daftar permohonan telah dikosongkan.');
    }
  };

  // Export Excel
  const handleExportExcel = async () => {
    if (emailDraft.pegawaiList.length === 0) {
      showToast('error', 'Daftar pegawai masih kosong. Tambahkan pegawai terlebih dahulu.');
      return;
    }
    try {
      await exportPendaftaranEmailToExcel(
        emailDraft.kodeKppn,
        emailDraft.kodeSatker,
        emailDraft.namaSatker,
        emailDraft.pegawaiList
      );
      saveToHistory();
      showToast('success', 'File Excel permohonan email sesuai format master resmi berhasil diunduh.');
    } catch (e: any) {
      console.error('Error exporting email Excel', e);
      showToast('error', e?.message || 'Gagal membuat file Excel permohonan email.');
    }
  };

  // Export PDF
  const handleExportPdf = () => {
    if (emailDraft.pegawaiList.length === 0) {
      showToast('error', 'Daftar pegawai masih kosong. Tambahkan pegawai terlebih dahulu.');
      return;
    }
    exportPendaftaranEmailToPDF(
      emailDraft.kodeKppn,
      emailDraft.kodeSatker,
      emailDraft.namaSatker,
      emailDraft.pegawaiList,
      emailDraft.pejabat
    );
    saveToHistory();
    showToast('success', 'Dokumen PDF formulir email berhasil dibuat.');
  };

  const saveToHistory = () => {
    const historyItem: PendaftaranEmailHistoryItem = {
      id: `history-email-${Date.now()}`,
      kodeSatker,
      namaSatker,
      totalPegawai: emailDraft.pegawaiList.length,
      pejabat: emailDraft.pejabat,
      tanggal: new Date().toISOString().split('T')[0],
      draftData: emailDraft,
      exportedAt: new Date().toISOString()
    };
    setHistoryList(prev => [historyItem, ...prev]);
  };

  // Import Excel File
  const handleImportExcelFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

        // Expect: A=Kode KPPN, B=Kode Satker, C=Nama, D=NIP, E=NIK, F=Status
        const importedList: PegawaiEmailRecord[] = [];
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length < 3 || !row[2]) continue;

          const nama = String(row[2] || '').trim();
          const nip = String(row[3] || '').replace(/\D/g, '');
          const nik = String(row[4] || '').replace(/\D/g, '');
          const statusNum = Number(row[5]);
          const statusValid: 1 | 2 | 3 | 4 | 5 = [1, 2, 3, 4, 5].includes(statusNum)
            ? (statusNum as any)
            : 3;

          importedList.push({
            id: `email-imp-${Date.now()}-${i}`,
            kodeKppn: String(row[0] || kodeKppn).trim(),
            kodeSatker: String(row[1] || kodeSatker).trim(),
            nama,
            nip,
            nik,
            status: statusValid,
            jabatan: 'Pegawai Satker'
          });
        }

        if (importedList.length > 0) {
          setEmailDraft(prev => ({
            ...prev,
            pegawaiList: [...prev.pegawaiList, ...importedList],
            updatedAt: new Date().toISOString()
          }));
          showToast('success', `${importedList.length} data pegawai berhasil diimpor dari file Excel.`);
        } else {
          showToast('error', 'Tidak ditemukan baris data pegawai yang valid pada file Excel.');
        }
      } catch (err) {
        console.error('Import excel error', err);
        showToast('error', 'Gagal membaca file Excel. Pastikan format kolom A=KPPN, B=Satker, C=Nama, D=NIP, E=NIK, F=Status.');
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl shadow-2xl flex items-center gap-3 border text-xs font-semibold animate-in slide-in-from-bottom-5 duration-200 ${
            toastMessage.type === 'success'
              ? 'bg-teal-900/90 text-white border-teal-700'
              : toastMessage.type === 'error'
              ? 'bg-rose-900/90 text-white border-rose-700'
              : 'bg-indigo-900/90 text-white border-indigo-700'
          }`}
        >
          {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-teal-300" />}
          {toastMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-300" />}
          {toastMessage.type === 'info' && <Info className="w-4 h-4 text-indigo-300" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-teal-950 via-slate-900 to-slate-900 border border-teal-500/20 shadow-xl text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/30">
              <Mail className="w-4 h-4" />
            </span>
            <h2 className="text-base sm:text-lg font-black tracking-tight">
              Pendaftaran Email Kedinasan Pegawai Satker
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-400/20 text-teal-300 border border-teal-400/30">
              BAKU KEMENKEU
            </span>
          </div>
          <p className="text-xs text-teal-200/80">
            Format baku permohonan akun email kedinasan. Mendukung impor instan dari User SAKTI (Input Once, Generate Multiple Outputs).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Ambil dari User SAKTI Button */}
          <button
            type="button"
            onClick={() => setIsAmbilSaktiOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer transition-colors"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Ambil dari User SAKTI</span>
            {userSaktiDraft?.users?.length ? (
              <span className="px-1.5 py-0.2 rounded-full bg-teal-800 text-[10px]">
                {userSaktiDraft.users.length}
              </span>
            ) : null}
          </button>

          {/* History Button */}
          <button
            type="button"
            onClick={() => setIsHistoryOpen(true)}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 cursor-pointer transition-colors"
          >
            <History className="w-3.5 h-3.5" />
            <span>Riwayat Email ({historyList.length})</span>
          </button>
        </div>
      </div>

      {/* Metadata & Pejabat Settings */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div>
          <span className="text-slate-500 block mb-1">Satker & KPPN Terdaftar:</span>
          <span className="font-bold text-slate-900 dark:text-white font-mono text-sm block">
            {kodeSatker} - {namaSatker}
          </span>
          <span className="text-slate-400 text-[11px] block mt-0.5">
            KPPN Mitra: {kodeKppn} (Semarang I)
          </span>
        </div>

        <div>
          <span className="text-slate-500 block mb-1">Pejabat Penandatangan (KPA):</span>
          <input
            type="text"
            value={emailDraft.pejabat.nama}
            onChange={(e) => setEmailDraft(prev => ({
              ...prev,
              pejabat: { ...prev.pejabat, nama: e.target.value }
            }))}
            placeholder="Nama Kuasa Pengguna Anggaran"
            className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
          />
        </div>

        <div>
          <span className="text-slate-500 block mb-1">NIP/NRP Pejabat:</span>
          <input
            type="text"
            value={emailDraft.pejabat.nip}
            onChange={(e) => setEmailDraft(prev => ({
              ...prev,
              pejabat: { ...prev.pejabat, nip: e.target.value.replace(/\D/g, '') }
            }))}
            placeholder="18 digit angka NIP"
            className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
          />
        </div>
      </div>

      {/* Action Controls & Table Header */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama, NIP, NIK, status..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              Master: format1 (57).xlsx
            </span>
            <a
              href="/templates/format1 (57).xlsx"
              download="format1 (57).xlsx"
              className="text-[10px] font-medium text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 underline underline-offset-2"
              title="Download file master template asli format1 (57).xlsx"
            >
              Unduh Master
            </a>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Manual Add Button */}
          <button
            type="button"
            onClick={openManualModalForNew}
            className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Pegawai</span>
          </button>

          {/* Import Excel Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Impor Excel</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportExcelFile}
            accept=".xlsx, .xls"
            className="hidden"
          />

          {/* Export Excel Button */}
          <button
            type="button"
            onClick={handleExportExcel}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>

          {/* Export PDF Button */}
          <button
            type="button"
            onClick={handleExportPdf}
            className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Export PDF</span>
          </button>

          {emailDraft.pegawaiList.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              title="Kosongkan Daftar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Employee Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3 w-12 text-center">No</th>
                <th className="p-3">Kode KPPN</th>
                <th className="p-3">Kode Satker</th>
                <th className="p-3 min-w-[200px]">Nama Pegawai</th>
                <th className="p-3">NIP / NRP</th>
                <th className="p-3">NIK</th>
                <th className="p-3">Status</th>
                <th className="p-3 min-w-[140px]">Jabatan</th>
                <th className="p-3 w-20 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredPegawai.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-400">
                    <Mail className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700 mb-2 stroke-1" />
                    <p className="font-semibold text-xs">Belum ada pegawai dalam daftar permohonan email.</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Klik "Ambil dari User SAKTI" untuk memuat otomatis pegawai yang terdaftar di Tab 1, atau klik "Tambah Pegawai".
                    </p>
                  </td>
                </tr>
              ) : (
                filteredPegawai.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                    <td className="p-3 font-mono text-slate-600 dark:text-slate-400">{p.kodeKppn}</td>
                    <td className="p-3 font-mono font-semibold text-slate-900 dark:text-white">{p.kodeSatker}</td>
                    <td className="p-3 font-bold text-slate-900 dark:text-white">{p.nama}</td>
                    <td className="p-3 font-mono text-slate-700 dark:text-slate-300">{p.nip || '-'}</td>
                    <td className="p-3 font-mono text-slate-700 dark:text-slate-300">{p.nik || '-'}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300">
                        {p.status} - {STATUS_PEGAWAI_MAP[p.status] || 'PNS'}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">{p.jabatan || '-'}</td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => openManualModalForEdit(p)}
                          className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePegawai(p.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                          title="Hapus"
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

        {/* Footer info */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>Total: <strong>{emailDraft.pegawaiList.length}</strong> pegawai terdaftar</span>
          <span className="text-[11px] text-slate-400">
            Kolom baku Excel: A=KPPN, B=Satker, C=Nama, D=NIP, E=NIK, F=Status (1=TNI, 2=POLRI, 3=PNS, 4=PPNPN, 5=P3K)
          </span>
        </div>
      </div>

      {/* MODAL 1: Ambil Dari User SAKTI */}
      <AmbilDariUserSaktiModal
        isOpen={isAmbilSaktiOpen}
        onClose={() => setIsAmbilSaktiOpen(false)}
        usersSakti={userSaktiDraft?.users || []}
        kodeKppn={kodeKppn}
        kodeSatker={kodeSatker}
        existingEmailNips={existingNips}
        onImport={handleImportFromSakti}
      />

      {/* MODAL 2: Riwayat */}
      <RiwayatPendaftaranEmailModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        historyList={historyList}
        onDeleteHistory={(id) => setHistoryList(prev => prev.filter(h => h.id !== id))}
        onLoadDraft={(item) => {
          setEmailDraft(item.draftData);
          setIsHistoryOpen(false);
          showToast('info', `Memuat draf riwayat tanggal ${item.tanggal}.`);
        }}
      />

      {/* MODAL 3: Tambah / Edit Manual Pegawai */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {editingPegawai ? 'Edit Data Pegawai' : 'Tambah Pegawai Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsManualModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveManual} className="p-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={manualForm.nama}
                  onChange={(e) => setManualForm(prev => ({ ...prev, nama: e.target.value }))}
                  placeholder="Nama pegawai lengkap"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    NIP / NRP
                  </label>
                  <input
                    type="text"
                    value={manualForm.nip}
                    onChange={(e) => setManualForm(prev => ({ ...prev, nip: e.target.value }))}
                    placeholder="18 digit NIP"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    NIK (16 Digit)
                  </label>
                  <input
                    type="text"
                    value={manualForm.nik}
                    onChange={(e) => setManualForm(prev => ({ ...prev, nik: e.target.value }))}
                    placeholder="16 digit NIK"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Status Kepegawaian
                  </label>
                  <select
                    value={manualForm.status}
                    onChange={(e) => setManualForm(prev => ({ ...prev, status: Number(e.target.value) as any }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                  >
                    <option value={1}>1 = TNI</option>
                    <option value={2}>2 = POLRI</option>
                    <option value={3}>3 = PNS</option>
                    <option value={4}>4 = PPNPN</option>
                    <option value={5}>5 = P3K</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Jabatan / Unit
                  </label>
                  <input
                    type="text"
                    value={manualForm.jabatan}
                    onChange={(e) => setManualForm(prev => ({ ...prev, jabatan: e.target.value }))}
                    placeholder="e.g. Bendahara Pengeluaran"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
