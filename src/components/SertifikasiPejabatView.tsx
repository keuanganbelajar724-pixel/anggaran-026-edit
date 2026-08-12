import React, { useState } from 'react';
import { 
  Award, 
  AlertCircle, 
  CheckCircle2, 
  Search, 
  FileSpreadsheet, 
  Download, 
  Upload, 
  Clock, 
  Filter, 
  Send, 
  Lock, 
  ShieldCheck, 
  UserX, 
  UserCheck, 
  Building, 
  Calendar,
  X,
  FileText
} from 'lucide-react';
import { PejabatSertifikasi, AppTheme, DashboardConfig } from '../types';

interface SertifikasiPejabatViewProps {
  pejabatList: PejabatSertifikasi[];
  onUpdatePejabatList: (newList: PejabatSertifikasi[]) => void;
  lastUpdateTimestamp: string;
  onUpdateTimestamp?: (newTimestamp: string) => void;
  isAdminAuthenticated: boolean;
  onAuthenticateAdmin: (pin: string) => boolean;
  onOpenReminderWithPejabat?: (pejabat: PejabatSertifikasi) => void;
  theme?: AppTheme;
  dashboardConfig?: DashboardConfig;
}

export const SertifikasiPejabatView: React.FC<SertifikasiPejabatViewProps> = ({
  pejabatList,
  onUpdatePejabatList,
  lastUpdateTimestamp,
  onUpdateTimestamp,
  isAdminAuthenticated,
  onAuthenticateAdmin,
  onOpenReminderWithPejabat,
  theme = 'light',
  dashboardConfig
}) => {
  const isDark = theme === 'dark';

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNAPPROVED' | 'APPROVED'>('UNAPPROVED'); // Default to Belum Tersertifikasi
  const [jabatanFilter, setJabatanFilter] = useState<string>('ALL');

  // Modal for Excel / Paste import
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);

  // Modal for Admin Auth inside view if needed
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authPinInput, setAuthPinInput] = useState('');
  const [authPinError, setAuthPinError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // Helper to trigger admin action safely
  const handleProtectedAction = (action: () => void) => {
    if (isAdminAuthenticated) {
      action();
    } else {
      setPendingAction(() => action);
      setShowAuthModal(true);
    }
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onAuthenticateAdmin(authPinInput)) {
      setAuthPinError(null);
      setAuthPinInput('');
      setShowAuthModal(false);
      if (pendingAction) {
        pendingAction();
        setPendingAction(null);
      }
    } else {
      setAuthPinError('Password Admin salah. Silakan coba lagi (Gunakan: admin123 atau kppn026)');
    }
  };

  // Stats
  const totalPejabat = pejabatList.length;
  const belumSertifikatCount = pejabatList.filter(
    p => !p.noSertifikat || p.noSertifikat.trim() === '' || p.noSertifikat.toLowerCase().includes('tidak ada')
  ).length;
  const sudahSertifikatCount = totalPejabat - belumSertifikatCount;

  // Distinct Jabatans
  const jabatanOptions = Array.from(new Set(pejabatList.map(p => p.nmJabatan))).filter(Boolean);

  // Filtering
  const filteredList = pejabatList.filter(p => {
    const isUnapproved = !p.noSertifikat || p.noSertifikat.trim() === '' || p.noSertifikat.toLowerCase().includes('tidak ada');

    if (statusFilter === 'UNAPPROVED' && !isUnapproved) return false;
    if (statusFilter === 'APPROVED' && isUnapproved) return false;

    if (jabatanFilter !== 'ALL' && p.nmJabatan !== jabatanFilter) return false;

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchNama = p.nama.toLowerCase().includes(q);
      const matchNip = p.nip.toLowerCase().includes(q);
      const matchKdSatker = p.kdSatker.toLowerCase().includes(q);
      const matchNmSatker = p.nmSatker.toLowerCase().includes(q);
      const matchJabatan = p.nmJabatan.toLowerCase().includes(q);
      const matchSertifikat = p.noSertifikat.toLowerCase().includes(q);

      return matchNama || matchNip || matchKdSatker || matchNmSatker || matchJabatan || matchSertifikat;
    }

    return true;
  });

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Nomor', 'NIP', 'NAMA', 'KDSATKER', 'NMSATKER', 'NMJABATAN', 'NO_SERTIFIKAT', 'TGL_SERTIFIKAT', 'TGL_KADALUARSA'];
    const rows = filteredList.map(p => [
      p.nomor,
      `"${p.nip}"`,
      `"${p.nama.replace(/"/g, '""')}"`,
      `"${p.kdSatker}"`,
      `"${p.nmSatker.replace(/"/g, '""')}"`,
      `"${p.nmJabatan.replace(/"/g, '""')}"`,
      `"${p.noSertifikat}"`,
      `"${p.tglSertifikat || ''}"`,
      `"${p.tglKadaluarsa || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Sertifikasi_Pejabat_KPPN_Semarang_I_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import text parser
  const handleProcessImport = () => {
    if (!importText.trim()) {
      setImportError('Silakan masukkan teks atau baris CSV/Tab-delimited dari Excel.');
      return;
    }

    try {
      const lines = importText.trim().split('\n');
      const newList: PejabatSertifikasi[] = [];

      lines.forEach((line, index) => {
        // split by tab or comma
        const cols = line.includes('\t') ? line.split('\t') : line.split(',');
        if (cols.length < 5) return; // ignore invalid header rows

        const cleanCol = (val: string) => val ? val.trim().replace(/^"/, '').replace(/"$/, '') : '';

        // Check if first row is header
        if (index === 0 && (cleanCol(cols[0]).toLowerCase().includes('nomor') || cleanCol(cols[1]).toLowerCase().includes('nip'))) {
          return;
        }

        const nomorVal = parseInt(cleanCol(cols[0])) || (newList.length + 1);
        const nipVal = cleanCol(cols[1]);
        const namaVal = cleanCol(cols[2]);
        const kdSatkerVal = cleanCol(cols[3]);
        const nmSatkerVal = cleanCol(cols[4]);
        const nmJabatanVal = cols[5] ? cleanCol(cols[5]) : '-';
        const noSertifikatVal = cols[6] ? cleanCol(cols[6]) : 'Tidak Ada';
        const tglSertifikatVal = cols[7] ? cleanCol(cols[7]) : '';
        const tglKadaluarsaVal = cols[8] ? cleanCol(cols[8]) : '';

        if (nipVal || namaVal) {
          newList.push({
            id: `cert-import-${Date.now()}-${newList.length + 1}`,
            nomor: nomorVal,
            nip: nipVal,
            nama: namaVal,
            kdSatker: kdSatkerVal,
            nmSatker: nmSatkerVal,
            nmJabatan: nmJabatanVal,
            noSertifikat: noSertifikatVal || 'Tidak Ada',
            tglSertifikat: tglSertifikatVal,
            tglKadaluarsa: tglKadaluarsaVal
          });
        }
      });

      if (newList.length === 0) {
        setImportError('Tidak dapat membaca baris data. Pastikan format mengandung kolom NIP, Nama, Kode Satker, Nama Satker.');
        return;
      }

      onUpdatePejabatList(newList);
      
      const nowStr = new Date().toLocaleDateString('id-ID', {
        day: '2-digit', month: 'long', year: 'numeric'
      }) + ' jam ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
      
      if (onUpdateTimestamp) {
        onUpdateTimestamp(nowStr);
      }

      setShowImportModal(false);
      setImportText('');
      setImportError(null);
    } catch (err) {
      setImportError('Gagal memproses data Excel: ' + (err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner Header & Timestamp Display */}
      <div className={`p-5 sm:p-6 rounded-3xl border shadow-sm transition-all ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-amber-500/15 text-amber-700 dark:text-amber-300 font-black text-[10px] sm:text-xs uppercase px-3 py-1 rounded-full border border-amber-500/30 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-500" />
                {dashboardConfig?.customTexts?.sertifikasiBadge || 'MONITORING SERTIFIKASI PEJABAT PERBENDAHARAAN'}
              </span>

              {/* Timestamp Column Requirement */}
              <div className="bg-sky-50 dark:bg-sky-950/80 text-sky-900 dark:text-sky-300 font-bold text-xs px-3 py-1 rounded-full border border-sky-200 dark:border-sky-800 flex items-center gap-1.5 shadow-2xs">
                <Clock className="w-3.5 h-3.5 text-sky-500 animate-pulse" />
                <span>Update Data Terakhir: <strong className="font-extrabold">{lastUpdateTimestamp}</strong></span>
              </div>
            </div>

            <h2 className="text-lg sm:text-xl font-black tracking-tight">
              {dashboardConfig?.customTexts?.sertifikasiTitle || 'Daftar Pejabat Satker Belum & Sudah Tersertifikasi (PNT / PPK / PPSPM / Bendahara)'}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
              {dashboardConfig?.customTexts?.sertifikasiSubtitle || 'Memantau status kepemilikan Nomor Sertifikat Pejabat Perbendaharaan (NTPN/PNT) untuk PPK, PPSPM, Bendahara Pengeluaran, dan Bendahara Penerimaan pada seluruh Satker mitra KPPN Semarang I.'}
            </p>
          </div>

          {/* Excel Import / Export Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => handleProtectedAction(() => setShowImportModal(true))}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs px-3.5 py-2.5 rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <Upload className="w-4 h-4" />
              <span>Update Data Excel</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Ekspor Excel/CSV</span>
            </button>
          </div>

        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Total Listed Officials */}
        <div className={`p-4 rounded-2xl border flex items-center justify-between ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Total Pejabat Terdaftar
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-0.5">
              {totalPejabat} <span className="text-xs font-semibold text-slate-500">Orang</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Mitra KPPN Semarang I
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800 shrink-0">
            <Building className="w-6 h-6" />
          </div>
        </div>

        {/* Belum Tersertifikasi (Highlight Red) */}
        <div className={`p-4 rounded-2xl border flex items-center justify-between relative overflow-hidden ${
          isDark ? 'bg-slate-900 border-rose-900/60' : 'bg-rose-50/70 border-rose-200 shadow-xs'
        }`}>
          <div className="z-10">
            <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 text-[11px] font-black uppercase tracking-wider">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Belum Tersertifikasi (Tidak Ada)</span>
            </div>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-0.5">
              {belumSertifikatCount} <span className="text-xs font-semibold text-rose-500">Pejabat</span>
            </div>
            <span className="text-[10px] text-rose-700 dark:text-rose-300 font-semibold mt-1 block">
              Perlu percepatan sertifikasi / PNT
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-300 dark:border-rose-800 shrink-0 z-10">
            <UserX className="w-6 h-6" />
          </div>
        </div>

        {/* Sudah Tersertifikasi */}
        <div className={`p-4 rounded-2xl border flex items-center justify-between ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div>
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-[11px] font-black uppercase tracking-wider">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Sudah Tersertifikasi</span>
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              {sudahSertifikatCount} <span className="text-xs font-semibold text-emerald-500">Pejabat</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Memiliki No. Sertifikat Aktif
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800 shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Toolbar Search & Status Filters */}
      <div className={`p-4 rounded-2xl border space-y-3 ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Status Tabs Filter */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl overflow-x-auto">
            <button
              onClick={() => setStatusFilter('UNAPPROVED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                statusFilter === 'UNAPPROVED'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Belum Tersertifikasi ({belumSertifikatCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('APPROVED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                statusFilter === 'APPROVED'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Sudah Tersertifikasi ({sudahSertifikatCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === 'ALL'
                  ? 'bg-slate-800 dark:bg-slate-700 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <span>Semua Data ({totalPejabat})</span>
            </button>
          </div>

          {/* Jabatan Selector Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={jabatanFilter}
              onChange={(e) => setJabatanFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">-- Filter Semua Jabatan --</option>
              {jabatanOptions.map(jab => (
                <option key={jab} value={jab}>{jab}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari berdasarkan NIP, Nama Pejabat, Kode Satker, Nama Satker, atau No Sertifikat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-400"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Main Table Layout Matching Exact Uploaded Spreadsheet */}
      <div className={`rounded-3xl border overflow-hidden shadow-sm ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className={`border-b uppercase font-black tracking-wider text-[11px] ${
                isDark ? 'bg-slate-950 text-slate-300 border-slate-800' : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}>
                <th className="py-3.5 px-3 text-center w-12">Nomor</th>
                <th className="py-3.5 px-3">NIP</th>
                <th className="py-3.5 px-3">Nama Pejabat</th>
                <th className="py-3.5 px-3 text-center">KdSatker</th>
                <th className="py-3.5 px-3">Nama Satker</th>
                <th className="py-3.5 px-3">Nama Jabatan</th>
                <th className="py-3.5 px-3 text-center">No_Sertifikat</th>
                <th className="py-3.5 px-3 text-center">Tgl_Sertifikat</th>
                <th className="py-3.5 px-3 text-center">Tgl_Kadaluarsa</th>
                <th className="py-3.5 px-3 text-center">Aksi (Admin)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-slate-400">
                    <UserX className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
                    <p className="font-extrabold text-sm text-slate-700 dark:text-slate-300">
                      {pejabatList.length === 0 ? 'Belum Ada Data Pejabat (0 Pejabat)' : 'Tidak Ada Data Pejabat Terkait'}
                    </p>
                    <p className="text-xs mt-1 text-slate-500 dark:text-slate-400">
                      {pejabatList.length === 0
                        ? 'Seluruh data dummy telah dikosongkan. Gunakan tombol "Import Excel Pejabat" di atas untuk memasukkan data asli.'
                        : 'Coba sesuaikan kata kunci pencarian atau filter status sertifikat.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredList.map((p, idx) => {
                  const isUnapproved = !p.noSertifikat || p.noSertifikat.trim() === '' || p.noSertifikat.toLowerCase().includes('tidak ada');

                  return (
                    <tr 
                      key={p.id || `p-${idx}`}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors ${
                        isUnapproved ? (isDark ? 'bg-rose-950/10' : 'bg-rose-50/30') : ''
                      }`}
                    >
                      {/* Nomor */}
                      <td className="py-3 px-3 text-center font-bold text-slate-400 font-mono">
                        {p.nomor || idx + 1}
                      </td>

                      {/* NIP */}
                      <td className="py-3 px-3 font-mono font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {p.nip}
                      </td>

                      {/* NAMA */}
                      <td className="py-3 px-3 font-extrabold text-slate-900 dark:text-slate-100">
                        {p.nama}
                      </td>

                      {/* KDSATKER */}
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-600 dark:text-slate-300 bg-slate-100/60 dark:bg-slate-800/40 rounded-lg">
                        {p.kdSatker}
                      </td>

                      {/* NMSATKER */}
                      <td className="py-3 px-3 font-semibold text-slate-700 dark:text-slate-300 max-w-[240px] truncate" title={p.nmSatker}>
                        {p.nmSatker}
                      </td>

                      {/* NMJABATAN */}
                      <td className="py-3 px-3 font-medium text-slate-800 dark:text-slate-200">
                        <span className="inline-block bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md text-[11px]">
                          {p.nmJabatan}
                        </span>
                      </td>

                      {/* NO_SERTIFIKAT */}
                      <td className="py-3 px-3 text-center">
                        {isUnapproved ? (
                          <span className="inline-flex items-center gap-1 bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 font-black text-[10px] px-2.5 py-1 rounded-full border border-rose-300 dark:border-rose-800">
                            <AlertCircle className="w-3 h-3 text-rose-500" />
                            <span>Tidak Ada</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-mono font-bold text-[10px] px-2.5 py-1 rounded-full border border-emerald-300 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span>{p.noSertifikat}</span>
                          </span>
                        )}
                      </td>

                      {/* TGL_SERTIFIKAT */}
                      <td className="py-3 px-3 text-center font-mono text-slate-600 dark:text-slate-400">
                        {p.tglSertifikat || '-'}
                      </td>

                      {/* TGL_KADALUARSA */}
                      <td className="py-3 px-3 text-center font-mono text-slate-600 dark:text-slate-400">
                        {p.tglKadaluarsa || '-'}
                      </td>

                      {/* AKSI (ADMIN KHUSUS) */}
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleProtectedAction(() => {
                            if (onOpenReminderWithPejabat) {
                              onOpenReminderWithPejabat(p);
                            }
                          })}
                          className={`px-2.5 py-1.5 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1 transition-all cursor-pointer ${
                            isUnapproved 
                              ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-xs' 
                              : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800'
                          }`}
                          title="Kirim Pesan Teguran/Pengingat WA (Khusus Admin KPPN)"
                        >
                          <Send className="w-3 h-3" />
                          <span className="hidden sm:inline">{isUnapproved ? 'Pengingat WA' : 'Kontak WA'}</span>
                        </button>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            Menampilkan <strong className="text-slate-800 dark:text-slate-200">{filteredList.length}</strong> dari <strong className="text-slate-800 dark:text-slate-200">{totalPejabat}</strong> pejabat perbendaharaan.
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Data Terintegrasi SAKTI &amp; KPPN Semarang I (026)</span>
          </div>
        </div>
      </div>


      {/* MODAL IMPORT EXCEL / PASTE DATA */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-500" />
                <h3 className="font-extrabold text-base">Import Data Sertifikasi dari Excel / CSV</h3>
              </div>
              <button 
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Salin (Copy) sel/baris tabel dari Excel Anda dan tempel (Paste) ke kolom di bawah ini. Pastikan urutan kolom sesuai format berikut:
              </p>
              <div className="bg-slate-100 dark:bg-slate-950 p-3 rounded-xl font-mono text-[11px] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                Nomor [Tab] NIP [Tab] NAMA [Tab] KDSATKER [Tab] NMSATKER [Tab] NMJABATAN [Tab] NO_SERTIFIKAT [Tab] TGL_SERTIFIKAT [Tab] TGL_KADALUARSA
              </div>

              {importError && (
                <div className="bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 p-3 rounded-xl flex items-center gap-2 font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              <textarea
                rows={8}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Tempel baris dari Excel di sini..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl p-3 font-mono text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
              >
                Batal
              </button>
              <button
                onClick={handleProcessImport}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md cursor-pointer active:scale-95 transition-all"
              >
                Proses &amp; Update Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ADMIN AUTH PIN */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-3xl border shadow-2xl p-6 text-center space-y-4 ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="w-12 h-12 bg-amber-500/15 text-amber-500 rounded-2xl flex items-center justify-center mx-auto border border-amber-500/30">
              <Lock className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-extrabold">Otentikasi Admin KPPN</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Fitur ini terproteksi khusus untuk Admin KPPN Semarang I. Silakan masukkan password admin.
              </p>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-3">
              <input
                type="password"
                placeholder="Password Admin (admin123 / kppn026)..."
                value={authPinInput}
                onChange={(e) => {
                  setAuthPinInput(e.target.value);
                  if (authPinError) setAuthPinError(null);
                }}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-amber-500"
              />

              {authPinError && (
                <div className="text-[11px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/60 p-2 rounded-xl border border-rose-200 dark:border-rose-900">
                  {authPinError}
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAuthModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs py-2.5 rounded-xl shadow-md cursor-pointer"
                >
                  Buka Akses
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
