import React, { useState, useMemo } from 'react';
import { 
  Award, 
  ShieldCheck, 
  UserCheck, 
  AlertCircle, 
  Clock, 
  AlertTriangle, 
  Search, 
  Copy, 
  Check, 
  ExternalLink, 
  FileSpreadsheet, 
  Upload, 
  CheckCircle2, 
  Building2, 
  HelpCircle,
  LayoutGrid,
  Table as TableIcon
} from 'lucide-react';
import { PejabatSertifikasi, SatkerIKPA, AppTheme } from '../types';

interface PejabatPerbendaharaanSatkerTabProps {
  satker: SatkerIKPA;
  pejabatList?: PejabatSertifikasi[];
  isAdminAuthenticated?: boolean;
  onGoToAdminTab?: () => void;
  theme?: AppTheme;
}

export const PejabatPerbendaharaanSatkerTab: React.FC<PejabatPerbendaharaanSatkerTabProps> = ({
  satker,
  pejabatList = [],
  isAdminAuthenticated = false,
  onGoToAdminTab,
  theme = 'light'
}) => {
  const isDark = theme === 'dark';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Find all pejabat belonging to this satker (matching code or name)
  const satkerPejabatList = useMemo(() => {
    const kode = (satker.kodeSatker || '').trim();
    const namaSatker = (satker.namaSatker || '').trim().toLowerCase();
    const cleanNamaSatker = namaSatker.replace(/[^a-z0-9]/g, '');

    const matched = pejabatList.filter(p => {
      // 1. Direct code match
      const pKode = (p.kdSatker || p.kodeSatker || '').trim();
      if (kode && pKode && pKode === kode) return true;

      // 2. Name match
      const pSatkerName = (p.nmSatker || p.satker || '').trim().toLowerCase();
      const pCleanName = pSatkerName.replace(/[^a-z0-9]/g, '');
      if (cleanNamaSatker && pCleanName) {
        if (cleanNamaSatker === pCleanName) return true;
        if (cleanNamaSatker.length > 5 && pCleanName.length > 5) {
          if (cleanNamaSatker.includes(pCleanName) || pCleanName.includes(cleanNamaSatker)) return true;
        }
      }
      return false;
    });

    if (matched.length > 0) return matched;

    // Fallback: If no records in uploaded list, construct from satker.pejabatOperator
    if (satker.pejabatOperator) {
      const po = satker.pejabatOperator;
      const fallbackList: PejabatSertifikasi[] = [];
      const roleDefs: Array<{ key: keyof typeof po; label: string }> = [
        { key: 'kpa', label: 'Kuasa Pengguna Anggaran (KPA)' },
        { key: 'ppk', label: 'Pejabat Pembuat Komitmen (PPK)' },
        { key: 'ppspm', label: 'Pejabat Penandatangan SPM (PPSPM)' },
        { key: 'bendahara', label: 'Bendahara Pengeluaran' },
        { key: 'operatorKomitmen', label: 'Operator Komitmen' },
        { key: 'operatorPembayaran', label: 'Operator Pembayaran' },
        { key: 'operatorPelaporan', label: 'Operator Pelaporan' },
        { key: 'operatorGaji', label: 'Operator Gaji' }
      ];

      roleDefs.forEach((r, idx) => {
        const p = po[r.key];
        if (p && (p.nama || p.nip)) {
          fallbackList.push({
            id: `po-${satker.kodeSatker}-${r.key}-${idx}`,
            nomor: fallbackList.length + 1,
            kdSatker: satker.kodeSatker,
            nmSatker: satker.namaSatker,
            nip: p.nip || '-',
            nama: p.nama || `Pejabat ${r.label}`,
            nmJabatan: r.label,
            statusJabatan: 'Aktif',
            noSertifikat: (p as any).noSertifikat || 'Belum Ada',
            statusSertifikasi: (p as any).statusSertifikasi || ((p as any).noSertifikat ? 'Tersertifikasi' : 'Belum Tersertifikasi'),
            status: 'Aktif',
            kategoriData: (p as any).noSertifikat ? 'TERSERTIFIKASI_AKTIF' : 'BELUM_SERTIFIKAT',
            noHp: p.noHp || '-',
            email: p.email || '-'
          });
        }
      });
      if (fallbackList.length > 0) return fallbackList;
    }

    return [];
  }, [satker, pejabatList]);

  // Statistics for this specific Satker
  const stats = useMemo(() => {
    const total = satkerPejabatList.length;
    const tersertifikasi = satkerPejabatList.filter(p => 
      p.statusSertifikasi === 'Tersertifikasi' || p.kategoriData === 'TERSERTIFIKASI_AKTIF'
    ).length;
    const perluPerpanjangan = satkerPejabatList.filter(p => 
      p.isKadaluarsa || p.isMendekatiKadaluarsa || p.statusSertifikasi === 'Kadaluarsa' || p.statusSertifikasi === 'Belum Perpanjangan' || p.kategoriData === 'BELUM_PERPANJANGAN'
    ).length;
    const belumSertifikat = satkerPejabatList.filter(p => 
      p.kategoriData === 'BELUM_SERTIFIKAT' || p.statusSertifikasi === 'Belum Tersertifikasi' || !p.noSertifikat || p.noSertifikat === 'Belum Ada' || p.noSertifikat === '-'
    ).length;
    const aktif = satkerPejabatList.filter(p => (p.statusJabatan || 'Aktif').toLowerCase() === 'aktif').length;

    return { total, tersertifikasi, perluPerpanjangan, belumSertifikat, aktif };
  }, [satkerPejabatList]);

  // Unique roles for filter chips
  const roleOptions = useMemo(() => {
    const roles = new Set<string>();
    satkerPejabatList.forEach(p => {
      if (p.nmJabatan) roles.add(p.nmJabatan.trim());
    });
    return Array.from(roles).sort();
  }, [satkerPejabatList]);

  // Filtered officials
  const filteredPejabat = useMemo(() => {
    return satkerPejabatList.filter(p => {
      if (selectedRoleFilter !== 'ALL' && (p.nmJabatan || '').trim() !== selectedRoleFilter) {
        return false;
      }

      if (selectedStatusFilter === 'TERSERTIFIKASI') {
        if (p.statusSertifikasi !== 'Tersertifikasi' && p.kategoriData !== 'TERSERTIFIKASI_AKTIF') return false;
      } else if (selectedStatusFilter === 'BELUM_PERPANJANGAN') {
        const isExp = p.isKadaluarsa || p.isMendekatiKadaluarsa || p.statusSertifikasi === 'Kadaluarsa' || p.statusSertifikasi === 'Belum Perpanjangan' || p.kategoriData === 'BELUM_PERPANJANGAN';
        if (!isExp) return false;
      } else if (selectedStatusFilter === 'BELUM_SERTIFIKAT') {
        const isBelum = p.kategoriData === 'BELUM_SERTIFIKAT' || p.statusSertifikasi === 'Belum Tersertifikasi' || !p.noSertifikat || p.noSertifikat === 'Belum Ada' || p.noSertifikat === '-';
        if (!isBelum) return false;
      }

      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        (p.nama || '').toLowerCase().includes(q) ||
        (p.nip || '').includes(q) ||
        (p.nmJabatan || '').toLowerCase().includes(q) ||
        (p.noSertifikat || '').toLowerCase().includes(q) ||
        (p.statusUsulan || '').toLowerCase().includes(q)
      );
    });
  }, [satkerPejabatList, selectedRoleFilter, selectedStatusFilter, searchQuery]);

  // Helper for role badge colors
  const getRoleBadgeStyle = (jabatan: string) => {
    const j = jabatan.toLowerCase();
    if (j.includes('ppk') || j.includes('komitmen')) {
      return isDark ? 'bg-purple-950/80 text-purple-300 border-purple-800' : 'bg-purple-100 text-purple-800 border-purple-200';
    }
    if (j.includes('ppspm') || j.includes('spm') || j.includes('penguji')) {
      return isDark ? 'bg-blue-950/80 text-blue-300 border-blue-800' : 'bg-blue-100 text-blue-800 border-blue-200';
    }
    if (j.includes('bendahara pengeluaran')) {
      return isDark ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800' : 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
    if (j.includes('bendahara penerimaan')) {
      return isDark ? 'bg-teal-950/80 text-teal-300 border-teal-800' : 'bg-teal-100 text-teal-800 border-teal-200';
    }
    if (j.includes('bendahara')) {
      return isDark ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800' : 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
    return isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="space-y-6">
      {/* Top Satker Pejabat Summary Card */}
      <div className={`p-5 sm:p-6 rounded-3xl border shadow-sm ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 bg-gradient-to-r from-amber-500/20 via-indigo-500/20 to-sky-500/20 text-amber-700 dark:text-amber-300 border border-amber-300/40 dark:border-amber-700/40">
              <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>DATA PEJABAT PERBENDAHARAAN SATKER • SIMASPATEN &amp; IKPA</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 leading-tight">
              {satker.namaSatker}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2 font-medium">
              <span>Kode Satker: <strong className="font-mono font-bold text-amber-600 dark:text-amber-400">{satker.kodeSatker}</strong></span>
              <span>•</span>
              <span>K/L: {satker.kementerianLembaga || 'Kementerian / Lembaga Mitra'}</span>
            </p>
          </div>

          {isAdminAuthenticated && onGoToAdminTab && (
            <button
              type="button"
              onClick={onGoToAdminTab}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-extrabold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md hover:shadow-lg transition-all self-start lg:self-center cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Unggah / Sinkronkan Data Excel Pejabat</span>
            </button>
          )}
        </div>

        {/* Metric Cards for this Satker */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <button
            type="button"
            onClick={() => setSelectedStatusFilter('ALL')}
            className={`p-3.5 rounded-2xl border text-left transition-all ${
              selectedStatusFilter === 'ALL'
                ? 'ring-2 ring-indigo-500 shadow-md ' + (isDark ? 'bg-indigo-950/60 border-indigo-500/60' : 'bg-indigo-50 border-indigo-200')
                : isDark ? 'bg-slate-950/50 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Total Pejabat</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{stats.total}</span>
              <span className="text-xs text-slate-400">Orang</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatusFilter('TERSERTIFIKASI')}
            className={`p-3.5 rounded-2xl border text-left transition-all ${
              selectedStatusFilter === 'TERSERTIFIKASI'
                ? 'ring-2 ring-emerald-500 shadow-md ' + (isDark ? 'bg-emerald-950/60 border-emerald-500/60' : 'bg-emerald-50 border-emerald-200')
                : isDark ? 'bg-slate-950/50 border-slate-800 hover:border-slate-700' : 'bg-emerald-50/40 border-emerald-100 hover:bg-emerald-50'
            }`}
          >
            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 block">Tersertifikasi Aktif</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.tersertifikasi}</span>
              <span className="text-xs text-slate-400">Orang</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatusFilter('BELUM_PERPANJANGAN')}
            className={`p-3.5 rounded-2xl border text-left transition-all ${
              selectedStatusFilter === 'BELUM_PERPANJANGAN'
                ? 'ring-2 ring-amber-500 shadow-md ' + (isDark ? 'bg-amber-950/60 border-amber-500/60' : 'bg-amber-50 border-amber-200')
                : isDark ? 'bg-slate-950/50 border-slate-800 hover:border-slate-700' : 'bg-amber-50/40 border-amber-100 hover:bg-amber-50'
            }`}
          >
            <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 block">Perlu Perpanjangan / Expired</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-amber-600 dark:text-amber-400">{stats.perluPerpanjangan}</span>
              <span className="text-xs text-slate-400">Orang</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatusFilter('BELUM_SERTIFIKAT')}
            className={`p-3.5 rounded-2xl border text-left transition-all ${
              selectedStatusFilter === 'BELUM_SERTIFIKAT'
                ? 'ring-2 ring-rose-500 shadow-md ' + (isDark ? 'bg-rose-950/60 border-rose-500/60' : 'bg-rose-50 border-rose-200')
                : isDark ? 'bg-slate-950/50 border-slate-800 hover:border-slate-700' : 'bg-rose-50/40 border-rose-100 hover:bg-rose-50'
            }`}
          >
            <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-300 block">Belum Bersertifikat</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-rose-600 dark:text-rose-400">{stats.belumSertifikat}</span>
              <span className="text-xs text-slate-400">Orang</span>
            </div>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama, NIP, no sertifikat, jabatan..."
            className={`w-full pl-10 pr-4 py-2.5 text-xs rounded-2xl border transition-all ${
              isDark 
                ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-500 focus:border-amber-500' 
                : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-amber-500 shadow-xs'
            }`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              ×
            </button>
          )}
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className={`p-1 rounded-xl border flex items-center gap-1 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                viewMode === 'cards'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Tampilan Kartu"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kartu</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                viewMode === 'table'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Tampilan Tabel"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tabel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Role Filter Chips */}
      {roleOptions.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Filter Jabatan:</span>
          <button
            type="button"
            onClick={() => setSelectedRoleFilter('ALL')}
            className={`px-3 py-1 rounded-xl font-bold whitespace-nowrap transition-all ${
              selectedRoleFilter === 'ALL'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
          >
            Semua ({satkerPejabatList.length})
          </button>
          {roleOptions.map(role => {
            const count = satkerPejabatList.filter(p => (p.nmJabatan || '').trim() === role).length;
            return (
              <button
                key={role}
                type="button"
                onClick={() => setSelectedRoleFilter(role)}
                className={`px-3 py-1 rounded-xl font-bold whitespace-nowrap transition-all ${
                  selectedRoleFilter === role
                    ? 'bg-amber-500 text-slate-950'
                    : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                {role} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Content Rendering: Empty State vs Cards vs Table */}
      {filteredPejabat.length === 0 ? (
        <div className={`p-8 sm:p-12 rounded-3xl border text-center space-y-4 ${
          isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
            <Award className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto">
            <h4 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
              {satkerPejabatList.length === 0 
                ? 'Belum Ada Data Pejabat Perbendaharaan Terunggah' 
                : 'Tidak Ada Pejabat Sesuai Filter'}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              {satkerPejabatList.length === 0 ? (
                <>
                  Data pejabat perbendaharaan (PPK, PPSPM, Bendahara) untuk Satker <strong>{satker.namaSatker} ({satker.kodeSatker})</strong> belum terdaftar dalam sistem atau belum diunggah dari file Excel SIMASPATEN.
                </>
              ) : (
                'Coba sesuaikan kata kunci pencarian atau ubah filter jabatan di atas.'
              )}
            </p>
          </div>

          {satkerPejabatList.length === 0 && (
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              {isAdminAuthenticated && onGoToAdminTab ? (
                <button
                  type="button"
                  onClick={onGoToAdminTab}
                  className="px-4 py-2.5 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md transition-all cursor-pointer flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>Unggah File Excel di Admin</span>
                </button>
              ) : (
                <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 inline-block">
                  Silakan koordinasikan dengan Seksi MSKI KPPN Semarang I apabila ingin memperbarui data pejabat Satker.
                </div>
              )}
            </div>
          )}
        </div>
      ) : viewMode === 'cards' ? (
        /* Grid of Official Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPejabat.map((p, idx) => {
            const isTersertifikasi = p.statusSertifikasi === 'Tersertifikasi' || p.kategoriData === 'TERSERTIFIKASI_AKTIF';
            const isPerluPerpanjangan = p.isKadaluarsa || p.isMendekatiKadaluarsa || p.statusSertifikasi === 'Kadaluarsa' || p.statusSertifikasi === 'Belum Perpanjangan' || p.kategoriData === 'BELUM_PERPANJANGAN';
            const hasCert = p.noSertifikat && p.noSertifikat !== 'Belum Ada' && p.noSertifikat !== '-';

            return (
              <div 
                key={p.id || idx}
                className={`p-5 rounded-3xl border transition-all duration-200 hover:shadow-md flex flex-col justify-between ${
                  isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200/90 shadow-xs'
                }`}
              >
                <div>
                  {/* Top Bar: Role badge + Status Sertifikasi */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`px-2.5 py-1 rounded-xl text-xs font-extrabold border ${getRoleBadgeStyle(p.nmJabatan || 'Pejabat')}`}>
                      {p.nmJabatan || 'Pejabat Perbendaharaan'}
                    </span>

                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black border ${
                      isTersertifikasi
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800'
                        : isPerluPerpanjangan
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 border-amber-300 dark:border-amber-800'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200 border-rose-300 dark:border-rose-800'
                    }`}>
                      {isTersertifikasi ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      ) : isPerluPerpanjangan ? (
                        <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                      )}
                      <span>
                        {p.statusSertifikasi || (isTersertifikasi ? 'Tersertifikasi' : isPerluPerpanjangan ? 'Perlu Perpanjangan' : 'Belum Bersertifikat')}
                      </span>
                    </span>
                  </div>

                  {/* Name and NIP */}
                  <div>
                    <h4 className="text-base font-extrabold text-slate-900 dark:text-slate-100 leading-snug">
                      {p.nama}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                        NIP: {p.nip || '-'}
                      </span>
                      {p.nip && (
                        <button
                          type="button"
                          onClick={() => handleCopy(p.nip!, `nip-${idx}`)}
                          className="text-[10px] text-slate-400 hover:text-amber-500 font-semibold inline-flex items-center gap-0.5 cursor-pointer"
                          title="Salin NIP"
                        >
                          {copiedText === `nip-${idx}` ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Certificate Details Box */}
                  <div className={`mt-4 p-3.5 rounded-2xl border space-y-2 text-xs ${
                    isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50/70 border-slate-200/80'
                  }`}>
                    {/* Nomor Sertifikat */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px]">Nomor Sertifikat:</span>
                      {hasCert ? (
                        <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 px-2.5 py-0.5 rounded-lg border border-slate-200 dark:border-slate-800">
                          <span className="text-[11px]">{p.noSertifikat}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(p.noSertifikat!, `cert-${idx}`)}
                            className="text-slate-400 hover:text-amber-500 cursor-pointer"
                            title="Salin Nomor Sertifikat"
                          >
                            {copiedText === `cert-${idx}` ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Belum Ada</span>
                      )}
                    </div>

                    {/* Tanggal Kadaluarsa */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px]">Tanggal Kadaluarsa:</span>
                      {p.tglKadaluarsa ? (
                        <div className="text-right">
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                            {p.tglKadaluarsa}
                          </span>
                          {p.isKadaluarsa ? (
                            <span className="block text-[10px] text-rose-500 font-extrabold">Kedaluwarsa</span>
                          ) : p.isMendekatiKadaluarsa ? (
                            <span className="block text-[10px] text-amber-500 font-extrabold">Mendekati Kedaluwarsa</span>
                          ) : (
                            <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Masa Berlaku Aktif</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">-</span>
                      )}
                    </div>

                    {/* Status Usulan SIMASPATEN */}
                    {p.statusUsulan && (
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                        <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px]">Status Usulan:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300 text-[11px] text-right">
                          {p.statusUsulan}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Recommendation / Action Note */}
                {p.catatanRekomendasi && (
                  <div className={`mt-3 p-2.5 rounded-xl text-[11px] leading-relaxed flex items-start gap-2 ${
                    isTersertifikasi
                      ? isDark ? 'bg-emerald-950/30 text-emerald-300' : 'bg-emerald-50 text-emerald-800'
                      : isPerluPerpanjangan
                      ? isDark ? 'bg-amber-950/30 text-amber-300' : 'bg-amber-50 text-amber-800'
                      : isDark ? 'bg-rose-950/30 text-rose-300' : 'bg-rose-50 text-rose-800'
                  }`}>
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{p.catatanRekomendasi}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Responsive Table View */
        <div className={`rounded-3xl border overflow-hidden shadow-sm ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 font-extrabold text-slate-700 dark:text-slate-300 uppercase">
                <tr>
                  <th className="py-3 px-3.5">No</th>
                  <th className="py-3 px-3.5">Jabatan</th>
                  <th className="py-3 px-3.5">Nama Pejabat &amp; NIP</th>
                  <th className="py-3 px-3.5">Nomor Sertifikat</th>
                  <th className="py-3 px-3.5">Kadaluarsa</th>
                  <th className="py-3 px-3.5">Status Usulan</th>
                  <th className="py-3 px-3.5 text-center">Status Sertifikasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredPejabat.map((p, idx) => {
                  const isTersertifikasi = p.statusSertifikasi === 'Tersertifikasi' || p.kategoriData === 'TERSERTIFIKASI_AKTIF';
                  const isPerluPerpanjangan = p.isKadaluarsa || p.isMendekatiKadaluarsa || p.statusSertifikasi === 'Kadaluarsa' || p.statusSertifikasi === 'Belum Perpanjangan' || p.kategoriData === 'BELUM_PERPANJANGAN';
                  const hasCert = p.noSertifikat && p.noSertifikat !== 'Belum Ada' && p.noSertifikat !== '-';

                  return (
                    <tr key={p.id || idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3.5 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-3.5">
                        <span className={`inline-block px-2.5 py-0.5 rounded-lg text-[11px] font-bold border ${getRoleBadgeStyle(p.nmJabatan || 'Pejabat')}`}>
                          {p.nmJabatan}
                        </span>
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="font-extrabold text-slate-900 dark:text-slate-100">{p.nama}</div>
                        <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400">NIP: {p.nip || '-'}</div>
                      </td>
                      <td className="py-3 px-3.5 font-mono">
                        {hasCert ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                              {p.noSertifikat}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(p.noSertifikat!, `table-cert-${idx}`)}
                              className="text-slate-400 hover:text-amber-500 cursor-pointer"
                              title="Salin Nomor Sertifikat"
                            >
                              {copiedText === `table-cert-${idx}` ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Belum Ada</span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 font-mono text-[11px]">
                        {p.tglKadaluarsa ? (
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{p.tglKadaluarsa}</span>
                            {p.isKadaluarsa && (
                              <span className="block text-[10px] text-rose-500 font-extrabold">Kedaluwarsa</span>
                            )}
                            {p.isMendekatiKadaluarsa && (
                              <span className="block text-[10px] text-amber-500 font-extrabold">Mendekati Kedaluwarsa</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-slate-600 dark:text-slate-400 text-[11px]">{p.statusUsulan || '-'}</td>
                      <td className="py-3 px-3.5 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          isTersertifikasi
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800'
                            : isPerluPerpanjangan
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 border-amber-300 dark:border-amber-800'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200 border-rose-300 dark:border-rose-800'
                        }`}>
                          {p.statusSertifikasi || (isTersertifikasi ? 'Tersertifikasi' : isPerluPerpanjangan ? 'Perlu Perpanjangan' : 'Belum Bersertifikat')}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
