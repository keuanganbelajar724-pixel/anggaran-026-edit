import React, { useState, useMemo } from 'react';
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
  Lock, 
  ShieldCheck, 
  UserX, 
  UserCheck, 
  Building, 
  Calendar,
  X,
  FileText,
  AlertTriangle,
  RefreshCw,
  ChevronRight,
  ExternalLink,
  Sparkles,
  Info,
  Check,
  Layers,
  ArrowRight,
  HelpCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { PejabatSertifikasi, AppTheme, DashboardConfig, MasterSatker } from '../types';
import { 
  downloadPejabatBelumBersertifikatTemplate, 
  downloadPejabatBelumPerpanjanganTemplate, 
  downloadPejabatTemplate,
  validatePejabatExcelFile 
} from '../utils/modularExcelProcessors';

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
  masterSatkers?: MasterSatker[];
}

export const SertifikasiPejabatView: React.FC<SertifikasiPejabatViewProps> = ({
  pejabatList,
  onUpdatePejabatList,
  lastUpdateTimestamp,
  onUpdateTimestamp,
  isAdminAuthenticated,
  onAuthenticateAdmin,
  theme = 'light',
  dashboardConfig,
  masterSatkers = []
}) => {
  const isDark = theme === 'dark';

  // Primary Sub-View Selection:
  // 'BELUM_SERTIFIKAT' -> Sub-tampilan 1: Khusus Pejabat Belum Bersertifikat
  // 'BELUM_PERPANJANGAN' -> Sub-tampilan 2: Khusus Pejabat Belum Perpanjangan
  // 'SEMUA_TERPISAH' -> Sub-tampilan 3: Tampilkan Kedua Tabel Terpisah Berdampingan
  const [activeSubTab, setActiveSubTab] = useState<'BELUM_SERTIFIKAT' | 'BELUM_PERPANJANGAN' | 'SEMUA_TERPISAH'>('BELUM_SERTIFIKAT');

  // Filters for Belum Bersertifikat
  const [searchBelumSert, setSearchBelumSert] = useState('');
  const [satkerBelumSert, setSatkerBelumSert] = useState<string>('ALL');
  const [jabatanBelumSert, setJabatanBelumSert] = useState<string>('ALL');
  const [statusUsulanBelumSert, setStatusUsulanBelumSert] = useState<string>('ALL');

  // Filters for Belum Perpanjangan
  const [searchPerpanjangan, setSearchPerpanjangan] = useState('');
  const [satkerPerpanjangan, setSatkerPerpanjangan] = useState<string>('ALL');
  const [jabatanPerpanjangan, setJabatanPerpanjangan] = useState<string>('ALL');
  const [statusUsulanPerpanjangan, setStatusUsulanPerpanjangan] = useState<string>('ALL');
  const [statusJabatanPerpanjangan, setStatusJabatanPerpanjangan] = useState<string>('ALL');
  const [statusMasaBerlakuFilter, setStatusMasaBerlakuFilter] = useState<string>('ALL');
  const [klPerpanjanganFilter, setKlPerpanjanganFilter] = useState<string>('ALL');

  // Selected Detail Modal
  const [selectedPejabat, setSelectedPejabat] = useState<PejabatSertifikasi | null>(null);

  // Upload modal state (Admin only)
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<any | null>(null);
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadMode, setUploadMode] = useState<'MERGE' | 'REPLACE_CATEGORY' | 'REPLACE_ALL'>('MERGE');

  // Auth modal state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authPinInput, setAuthPinInput] = useState('');
  const [authPinError, setAuthPinError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

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

  // Base Datasets (Distinctly Separated)
  const listBelumBersertifikat = useMemo(() => {
    return pejabatList.filter(p => {
      if (p.kategoriData === 'BELUM_SERTIFIKAT') return true;
      const noSert = (p.noSertifikat || '').trim().toLowerCase();
      return !noSert || noSert === '-' || noSert === 'tidak ada' || noSert === 'belum ada';
    });
  }, [pejabatList]);

  const listBelumPerpanjangan = useMemo(() => {
    return pejabatList.filter(p => {
      if (p.kategoriData === 'BELUM_PERPANJANGAN') return true;
      const noSert = (p.noSertifikat || '').trim().toLowerCase();
      return noSert && noSert !== '-' && noSert !== 'tidak ada' && noSert !== 'belum ada';
    });
  }, [pejabatList]);

  // Dropdown options for Belum Bersertifikat
  const satkerOptionsBelumSert = useMemo(() => {
    const map = new Map<string, { kdSatker: string; nmSatker: string; count: number }>();
    listBelumBersertifikat.forEach(p => {
      const kd = (p.kdSatker || '').trim();
      if (!kd) return;
      if (!map.has(kd)) {
        map.set(kd, { kdSatker: kd, nmSatker: p.nmSatker || kd, count: 0 });
      }
      map.get(kd)!.count += 1;
    });
    return Array.from(map.values()).sort((a, b) => a.kdSatker.localeCompare(b.kdSatker));
  }, [listBelumBersertifikat]);

  const jabatanOptionsBelumSert = useMemo(() => {
    return Array.from(new Set(listBelumBersertifikat.map(p => p.nmJabatan).filter(Boolean))).sort();
  }, [listBelumBersertifikat]);

  const statusUsulanOptionsBelumSert = useMemo(() => {
    return Array.from(new Set(listBelumBersertifikat.map(p => p.statusUsulan).filter(Boolean))).sort();
  }, [listBelumBersertifikat]);

  // Dropdown options for Belum Perpanjangan
  const satkerOptionsPerpanjangan = useMemo(() => {
    const map = new Map<string, { kdSatker: string; nmSatker: string; count: number }>();
    listBelumPerpanjangan.forEach(p => {
      const kd = (p.kdSatker || '').trim();
      if (!kd) return;
      if (!map.has(kd)) {
        map.set(kd, { kdSatker: kd, nmSatker: p.nmSatker || kd, count: 0 });
      }
      map.get(kd)!.count += 1;
    });
    return Array.from(map.values()).sort((a, b) => a.kdSatker.localeCompare(b.kdSatker));
  }, [listBelumPerpanjangan]);

  const jabatanOptionsPerpanjangan = useMemo(() => {
    return Array.from(new Set(listBelumPerpanjangan.map(p => p.nmJabatan).filter(Boolean))).sort();
  }, [listBelumPerpanjangan]);

  const statusUsulanOptionsPerpanjangan = useMemo(() => {
    return Array.from(new Set(listBelumPerpanjangan.map(p => p.statusUsulan).filter(Boolean))).sort();
  }, [listBelumPerpanjangan]);

  const klOptionsPerpanjangan = useMemo(() => {
    return Array.from(new Set(listBelumPerpanjangan.map(p => p.kementerianLembaga).filter(Boolean))).sort();
  }, [listBelumPerpanjangan]);

  // Filtered List 1: Pejabat Belum Bersertifikat
  const filteredBelumBersertifikat = useMemo(() => {
    return listBelumBersertifikat.filter(p => {
      if (satkerBelumSert !== 'ALL' && p.kdSatker !== satkerBelumSert) return false;
      if (jabatanBelumSert !== 'ALL' && p.nmJabatan !== jabatanBelumSert) return false;
      if (statusUsulanBelumSert !== 'ALL' && p.statusUsulan !== statusUsulanBelumSert) return false;

      if (searchBelumSert.trim() !== '') {
        const q = searchBelumSert.toLowerCase();
        const matchNama = (p.nama || '').toLowerCase().includes(q);
        const matchNip = (p.nip || '').toLowerCase().includes(q);
        const matchKdSatker = (p.kdSatker || '').toLowerCase().includes(q);
        const matchNmSatker = (p.nmSatker || '').toLowerCase().includes(q);
        const matchJabatan = (p.nmJabatan || '').toLowerCase().includes(q);
        const matchStatusUsulan = (p.statusUsulan || '').toLowerCase().includes(q);

        return matchNama || matchNip || matchKdSatker || matchNmSatker || matchJabatan || matchStatusUsulan;
      }
      return true;
    });
  }, [listBelumBersertifikat, satkerBelumSert, jabatanBelumSert, statusUsulanBelumSert, searchBelumSert]);

  // Filtered List 2: Pejabat Belum Perpanjangan
  const filteredBelumPerpanjangan = useMemo(() => {
    return listBelumPerpanjangan.filter(p => {
      if (satkerPerpanjangan !== 'ALL' && p.kdSatker !== satkerPerpanjangan) return false;
      if (jabatanPerpanjangan !== 'ALL' && p.nmJabatan !== jabatanPerpanjangan) return false;
      if (statusUsulanPerpanjangan !== 'ALL' && p.statusUsulan !== statusUsulanPerpanjangan) return false;
      if (statusJabatanPerpanjangan !== 'ALL' && (p.statusJabatan || 'Aktif') !== statusJabatanPerpanjangan) return false;
      if (klPerpanjanganFilter !== 'ALL' && p.kementerianLembaga !== klPerpanjanganFilter) return false;

      if (statusMasaBerlakuFilter === 'KADALUARSA' && !p.isKadaluarsa) return false;
      if (statusMasaBerlakuFilter === 'MENDEKATI' && !p.isMendekatiKadaluarsa) return false;
      if (statusMasaBerlakuFilter === 'AMAN' && (p.isKadaluarsa || p.isMendekatiKadaluarsa)) return false;

      if (searchPerpanjangan.trim() !== '') {
        const q = searchPerpanjangan.toLowerCase();
        const matchNama = (p.nama || '').toLowerCase().includes(q);
        const matchNip = (p.nip || '').toLowerCase().includes(q);
        const matchKdSatker = (p.kdSatker || '').toLowerCase().includes(q);
        const matchNmSatker = (p.nmSatker || '').toLowerCase().includes(q);
        const matchJabatan = (p.nmJabatan || '').toLowerCase().includes(q);
        const matchSertifikat = (p.noSertifikat || '').toLowerCase().includes(q);
        const matchKL = (p.kementerianLembaga || '').toLowerCase().includes(q);
        const matchStatusUsulan = (p.statusUsulan || '').toLowerCase().includes(q);

        return matchNama || matchNip || matchKdSatker || matchNmSatker || matchJabatan || matchSertifikat || matchKL || matchStatusUsulan;
      }
      return true;
    });
  }, [listBelumPerpanjangan, satkerPerpanjangan, jabatanPerpanjangan, statusUsulanPerpanjangan, statusJabatanPerpanjangan, klPerpanjanganFilter, statusMasaBerlakuFilter, searchPerpanjangan]);

  // Check filter active states
  const isBelumSertFiltered = searchBelumSert !== '' || satkerBelumSert !== 'ALL' || jabatanBelumSert !== 'ALL' || statusUsulanBelumSert !== 'ALL';
  const handleResetBelumSertFilters = () => {
    setSearchBelumSert('');
    setSatkerBelumSert('ALL');
    setJabatanBelumSert('ALL');
    setStatusUsulanBelumSert('ALL');
  };

  const isPerpanjanganFiltered = searchPerpanjangan !== '' || satkerPerpanjangan !== 'ALL' || jabatanPerpanjangan !== 'ALL' || statusUsulanPerpanjangan !== 'ALL' || statusJabatanPerpanjangan !== 'ALL' || statusMasaBerlakuFilter !== 'ALL' || klPerpanjanganFilter !== 'ALL';
  const handleResetPerpanjanganFilters = () => {
    setSearchPerpanjangan('');
    setSatkerPerpanjangan('ALL');
    setJabatanPerpanjangan('ALL');
    setStatusUsulanPerpanjangan('ALL');
    setStatusJabatanPerpanjangan('ALL');
    setStatusMasaBerlakuFilter('ALL');
    setKlPerpanjanganFilter('ALL');
  };

  // Helper to normalize certificate info (prevent date appearing in cert number column)
  const formatSertifikatInfo = (p: Partial<PejabatSertifikasi> | null | undefined) => {
    if (!p) return { noSertifikat: '-', tglSertifikat: '-', tglKadaluarsa: '-' };

    const isDatePattern = (str?: string) => {
      if (!str) return false;
      const s = str.trim();
      return /^\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}$/.test(s) || /^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}$/.test(s);
    };

    let noSert = (p.noSertifikat || '').trim();
    let tglSert = (p.tglSertifikat || '').trim();
    const tglKad = (p.tglKadaluarsa || '').trim();

    // If noSertifikat is actually a date and tglSertifikat is empty
    if (isDatePattern(noSert) && (!tglSert || tglSert === '-' || tglSert === '')) {
      tglSert = noSert;
      noSert = '-';
    } else if (isDatePattern(noSert) && !isDatePattern(tglSert) && tglSert && tglSert !== '-') {
      // Columns were inverted
      const temp = noSert;
      noSert = tglSert;
      tglSert = temp;
    }

    if (!noSert || noSert.toLowerCase() === 'belum ada' || noSert.toLowerCase() === 'tidak ada') {
      noSert = p.kategoriData === 'BELUM_SERTIFIKAT' ? 'Belum Ada' : '-';
    }

    return {
      noSertifikat: noSert,
      tglSertifikat: tglSert || '-',
      tglKadaluarsa: tglKad || '-'
    };
  };

  // Helper to compute standard DJPb recommendations (SIMASPATEN & SWIPE-AP)
  const getPejabatRekomendasi = (p: Partial<PejabatSertifikasi>): string => {
    const statusUsulan = (p.statusUsulan || '').toLowerCase().trim();
    const kategori = p.kategoriData;
    const isKadaluarsa = p.isKadaluarsa;
    const isMendekati = p.isMendekatiKadaluarsa;
    const sisaHari = p.sisaHariMasaBerlaku;

    if (kategori === 'BELUM_SERTIFIKAT' || !p.noSertifikat || p.noSertifikat === 'Belum Ada' || p.noSertifikat === '-') {
      if (statusUsulan.includes('antrean diklat') || statusUsulan.includes('antrean')) {
        return 'Pantau pemanggilan diklat e-learning / antrean diklat pada portal SWIPE-AP.';
      }
      if (statusUsulan.includes('verifikasi') || statusUsulan.includes('proses verifikasi')) {
        return 'Berkas usulan dalam verifikasi unit pembina SIMASPATEN. Cek notifikasi berkala.';
      }
      if (statusUsulan.includes('jadwal') || statusUsulan.includes('ujian') || statusUsulan.includes('uji kompetensi')) {
        return 'Pejabat dijadwalkan Ujian Kompetensi. Harap hadir tepat waktu sesuai jadwal SIMASPATEN.';
      }
      if (statusUsulan.includes('belum') || statusUsulan === '' || statusUsulan === '-') {
        return 'Segera rekam usulan kepesertaan penilaian kompetensi pejabat melalui aplikasi SIMASPATEN.';
      }
      if (p.catatanRekomendasi) {
        return p.catatanRekomendasi
          .replace(/SIMASPATI/gi, 'SIMASPATEN')
          .replace(/kemenkeu learning center|klc/gi, 'SWIPE-AP');
      }
      return 'Segera rekam usulan kepesertaan penilaian kompetensi pejabat melalui aplikasi SIMASPATEN.';
    }

    // Kategori Pejabat Belum Perpanjangan (Masa Berlaku)
    const statusJabatan = (p.statusJabatan || 'Aktif').toLowerCase();
    if (statusJabatan === 'non-aktif' || statusJabatan === 'non aktif') {
      return 'Pejabat Non-Aktif. Dapat diajukan perpanjangan di SIMASPATEN jika ditugaskan kembali.';
    }

    if (isKadaluarsa || (typeof sisaHari === 'number' && sisaHari <= 0)) {
      return 'URGENT: Pejabat Aktif masa berlaku telah habis. Segera rekam perpanjangan di SIMASPATEN!';
    }
    if (isMendekati || (typeof sisaHari === 'number' && sisaHari <= 60)) {
      return `PRIORITAS TINGGI: Sisa waktu ${sisaHari ?? 0} hari. Segera rekam perpanjangan di SIMASPATEN.`;
    }
    if (statusUsulan.includes('verifikasi')) {
      return 'Usulan perpanjangan sedang diverifikasi unit pembina di SIMASPATEN.';
    }
    if (p.catatanRekomendasi) {
      return p.catatanRekomendasi
        .replace(/SIMASPATI/gi, 'SIMASPATEN')
        .replace(/kemenkeu learning center|klc/gi, 'SWIPE-AP');
    }
    return 'Siapkan portofolio PPL dan rekam usulan perpanjangan di SIMASPATEN.';
  };

  // Export Specific Excel Functions
  const handleExportBelumBersertifikat = () => {
    const exportRows = filteredBelumBersertifikat.map((p, idx) => ({
      'No': idx + 1,
      'NIP': p.nip,
      'Nama Pejabat': p.nama,
      'Jabatan': p.nmJabatan,
      'Kode Satker': p.kdSatker,
      'Nama Satker': p.nmSatker,
      'Status Sertifikasi': 'Belum Tersertifikasi',
      'Status Usulan SIMASPATEN': p.statusUsulan || 'Belum rekam usulan',
      'KPPN': p.kppn || 'SEMARANG I',
      'Catatan / Rekomendasi': getPejabatRekomendasi(p)
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Belum Bersertifikat');
    XLSX.writeFile(workbook, `Monitoring_Pejabat_Belum_Bersertifikat_KPPN_Semarang1_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleExportBelumPerpanjangan = () => {
    const exportRows = filteredBelumPerpanjangan.map((p, idx) => ({
      'No': idx + 1,
      'Nama Pejabat': p.nama,
      'NIP': p.nip,
      'Kode Satker': p.kdSatker,
      'Nama Satker': p.nmSatker,
      'Jabatan': p.nmJabatan,
      'Nomor Sertifikat': p.noSertifikat || '-',
      'Tanggal Sertifikat': p.tglSertifikat || '-',
      'Tanggal Kadaluarsa': p.tglKadaluarsa || '-',
      'Sisa Masa Berlaku': p.sisaHariMasaBerlaku !== undefined ? (p.sisaHariMasaBerlaku <= 0 ? 'Habis (Kadaluarsa)' : `${p.sisaHariMasaBerlaku} Hari`) : '-',
      'Status Jabatan': p.statusJabatan || 'Aktif',
      'Status Usulan SIMASPATEN': p.statusUsulan || 'Belum Diusulkan',
      'Kementerian / Lembaga': p.kementerianLembaga || '-',
      'Rekomendasi Satker': getPejabatRekomendasi(p)
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Belum Perpanjangan');
    XLSX.writeFile(workbook, `Monitoring_Pejabat_Belum_Perpanjangan_KPPN_Semarang1_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Upload Excel handler
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    setUploadFile(file);
    setUploadError(null);
    setIsProcessingUpload(true);

    try {
      const preview = await validatePejabatExcelFile(file, masterSatkers);
      setUploadPreview(preview);
    } catch (err: any) {
      setUploadError(err.message || 'Gagal memproses file Excel.');
      setUploadPreview(null);
    } finally {
      setIsProcessingUpload(false);
    }
  };

  const handleApplyUpload = () => {
    if (!uploadPreview || !uploadPreview.validData || uploadPreview.validData.length === 0) return;

    let mergedList: PejabatSertifikasi[] = [];

    if (uploadMode === 'REPLACE_ALL') {
      mergedList = uploadPreview.validData;
    } else if (uploadMode === 'REPLACE_CATEGORY') {
      const incomingCategory = uploadPreview.validData[0]?.kategoriData || 'BELUM_SERTIFIKAT';
      const keepOtherCategories = pejabatList.filter(p => p.kategoriData !== incomingCategory);
      mergedList = [...keepOtherCategories, ...uploadPreview.validData];
    } else {
      const existingMap = new Map<string, PejabatSertifikasi>();
      pejabatList.forEach(p => {
        const key = `${p.nip || ''}_${p.kdSatker || ''}_${p.nmJabatan || ''}`;
        existingMap.set(key, p);
      });

      uploadPreview.validData.forEach((newP: PejabatSertifikasi) => {
        const key = `${newP.nip || ''}_${newP.kdSatker || ''}_${newP.nmJabatan || ''}`;
        existingMap.set(key, newP);
      });

      mergedList = Array.from(existingMap.values());
    }

    onUpdatePejabatList(mergedList);

    const nowStr = new Date().toLocaleDateString('id-ID', {
      day: '2-digit', month: 'long', year: 'numeric'
    }) + ' jam ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';

    if (onUpdateTimestamp) {
      onUpdateTimestamp(nowStr);
    }

    setShowUploadModal(false);
    setUploadFile(null);
    setUploadPreview(null);
    setUploadError(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner Header & Timestamp Display */}
      <div className={`p-6 sm:p-8 rounded-3xl border shadow-lg transition-all ${
        isDark ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/70 border-slate-800 text-slate-100' : 'bg-gradient-to-br from-white via-amber-50/40 to-indigo-50/50 border-slate-200 text-slate-900'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-amber-500/15 text-amber-700 dark:text-amber-300 font-black text-xs uppercase px-3 py-1 rounded-full border border-amber-500/30 flex items-center gap-1.5 shadow-2xs">
                <Award className="w-4 h-4 text-amber-500" />
                {dashboardConfig?.customTexts?.sertifikasiBadge || 'MONITORING SERTIFIKASI PEJABAT PERBENDAHARAAN KPPN SEMARANG I'}
              </span>

              <div className="bg-sky-50 dark:bg-sky-950/80 text-sky-900 dark:text-sky-300 font-bold text-xs px-3 py-1 rounded-full border border-sky-200 dark:border-sky-800 flex items-center gap-1.5 shadow-2xs">
                <Clock className="w-3.5 h-3.5 text-sky-500 animate-pulse" />
                <span>Update Terakhir: <strong className="font-extrabold">{lastUpdateTimestamp}</strong></span>
              </div>
            </div>

            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              {dashboardConfig?.customTexts?.sertifikasiTitle || 'Monitoring Pejabat Perbendaharaan (PTP / PPK / PPSPM / Bendahara)'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
              Pantau status sertifikasi dan perpanjangan masa berlaku sertifikat pejabat perbendaharaan Satker mitra KPPN Semarang I secara terpisah dan mudah dimonitor.
            </p>
          </div>

          {/* Action Buttons: Upload & Templates */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => handleProtectedAction(() => setShowUploadModal(true))}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-all active:scale-95 hover:shadow-indigo-500/20"
            >
              <Upload className="w-4 h-4" />
              <span>Update Data Excel</span>
            </button>

            <div className="relative group">
              <button
                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <FileSpreadsheet className="w-4 h-4 text-amber-500" />
                <span>Format Excel</span>
              </button>
              <div className="absolute right-0 mt-1.5 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-2 hidden group-hover:block z-30 space-y-1">
                <button
                  onClick={downloadPejabatBelumBersertifikatTemplate}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-xl flex items-center justify-between"
                >
                  <span>1. Template Belum Bersertifikat</span>
                  <Download className="w-3.5 h-3.5 text-rose-600" />
                </button>
                <button
                  onClick={downloadPejabatBelumPerpanjanganTemplate}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-slate-800 rounded-xl flex items-center justify-between"
                >
                  <span>2. Template Belum Perpanjangan</span>
                  <Download className="w-3.5 h-3.5 text-amber-600" />
                </button>
                <button
                  onClick={downloadPejabatTemplate}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-xl flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-2"
                >
                  <span>Template Gabungan Standard</span>
                  <Download className="w-3.5 h-3.5 text-indigo-600" />
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* PRIMARY SUB-TAB SELECTOR (KATEGORI TERPISAH JELAS) */}
      <div className="bg-slate-100 dark:bg-slate-900/90 p-1.5 rounded-3xl border border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-2">
        
        {/* Sub-Tab 1: Belum Bersertifikat */}
        <button
          type="button"
          onClick={() => setActiveSubTab('BELUM_SERTIFIKAT')}
          className={`flex items-center justify-between p-3.5 sm:p-4 rounded-2xl transition-all cursor-pointer text-left ${
            activeSubTab === 'BELUM_SERTIFIKAT'
              ? 'bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-lg ring-2 ring-rose-400/50'
              : 'bg-white dark:bg-slate-950/80 text-slate-700 dark:text-slate-300 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 border border-slate-200/80 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${
              activeSubTab === 'BELUM_SERTIFIKAT' ? 'bg-white/20 text-white' : 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400'
            }`}>
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider opacity-80">Tampilan 1</div>
              <div className="font-extrabold text-sm leading-tight">1. Belum Bersertifikat</div>
              <div className="text-[11px] opacity-75 mt-0.5">PPK / PPSPM / Bendahara</div>
            </div>
          </div>
          <div className="text-right">
            <span className={`text-xl font-black px-2.5 py-1 rounded-xl block ${
              activeSubTab === 'BELUM_SERTIFIKAT' ? 'bg-white/20 text-white' : 'bg-rose-50 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
            }`}>
              {listBelumBersertifikat.length}
            </span>
            <span className="text-[9px] font-bold uppercase block mt-0.5 opacity-75">Pejabat</span>
          </div>
        </button>

        {/* Sub-Tab 2: Belum Perpanjangan */}
        <button
          type="button"
          onClick={() => setActiveSubTab('BELUM_PERPANJANGAN')}
          className={`flex items-center justify-between p-3.5 sm:p-4 rounded-2xl transition-all cursor-pointer text-left ${
            activeSubTab === 'BELUM_PERPANJANGAN'
              ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg ring-2 ring-amber-400/50'
              : 'bg-white dark:bg-slate-950/80 text-slate-700 dark:text-slate-300 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 border border-slate-200/80 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${
              activeSubTab === 'BELUM_PERPANJANGAN' ? 'bg-white/20 text-white' : 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400'
            }`}>
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider opacity-80">Tampilan 2</div>
              <div className="font-extrabold text-sm leading-tight">2. Belum Perpanjangan</div>
              <div className="text-[11px] opacity-75 mt-0.5">Monitoring Masa Berlaku Sertifikat</div>
            </div>
          </div>
          <div className="text-right">
            <span className={`text-xl font-black px-2.5 py-1 rounded-xl block ${
              activeSubTab === 'BELUM_PERPANJANGAN' ? 'bg-white/20 text-white' : 'bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
            }`}>
              {listBelumPerpanjangan.length}
            </span>
            <span className="text-[9px] font-bold uppercase block mt-0.5 opacity-75">Pejabat</span>
          </div>
        </button>

        {/* Sub-Tab 3: Tampilkan Kedua Tabel Sekaligus */}
        <button
          type="button"
          onClick={() => setActiveSubTab('SEMUA_TERPISAH')}
          className={`flex items-center justify-between p-3.5 sm:p-4 rounded-2xl transition-all cursor-pointer text-left ${
            activeSubTab === 'SEMUA_TERPISAH'
              ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg ring-2 ring-indigo-400/50'
              : 'bg-white dark:bg-slate-950/80 text-slate-700 dark:text-slate-300 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 border border-slate-200/80 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${
              activeSubTab === 'SEMUA_TERPISAH' ? 'bg-white/20 text-white' : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
            }`}>
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider opacity-80">Tampilan Lengkap</div>
              <div className="font-extrabold text-sm leading-tight">Kedua Tabel Sekaligus</div>
              <div className="text-[11px] opacity-75 mt-0.5">Tampilan bertingkat terpisah</div>
            </div>
          </div>
          <div className="text-right">
            <span className={`text-xl font-black px-2.5 py-1 rounded-xl block ${
              activeSubTab === 'SEMUA_TERPISAH' ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
            }`}>
              {pejabatList.length}
            </span>
            <span className="text-[9px] font-bold uppercase block mt-0.5 opacity-75">Total</span>
          </div>
        </button>

      </div>


      {/* ========================================================================= */}
      {/* BAGIAN 1: TABEL PEJABAT BELUM BERSERTIFIKAT                               */}
      {/* ========================================================================= */}
      {(activeSubTab === 'BELUM_SERTIFIKAT' || activeSubTab === 'SEMUA_TERPISAH') && (
        <div className="space-y-4 pt-2">
          
          {/* Section 1 Header & KPIs */}
          <div className={`p-6 rounded-3xl border ${
            isDark ? 'bg-slate-900 border-rose-900/40 text-slate-100' : 'bg-rose-50/40 border-rose-200 text-slate-900'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rose-200/60 dark:border-rose-900/40 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-md">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-rose-900 dark:text-rose-300 flex items-center gap-2">
                    <span>1. Daftar Pejabat Belum Bersertifikat</span>
                    <span className="bg-rose-200 dark:bg-rose-950 text-rose-800 dark:text-rose-300 text-xs px-2.5 py-0.5 rounded-full font-bold">
                      {listBelumBersertifikat.length} Pejabat
                    </span>
                  </h3>
                  <p className="text-xs text-rose-700/80 dark:text-rose-400 mt-0.5">
                    Data pejabat perbendaharaan yang belum memiliki sertifikat kompetensi (PNT/BNT/PTP) dan memerlukan usulan diklat / uji kompetensi.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleExportBelumBersertifikat}
                className="bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-all active:scale-95 shrink-0 self-start sm:self-auto"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Excel Belum Bersertifikat (.xlsx)</span>
              </button>
            </div>

            {/* Quick KPI Stats for Belum Bersertifikat */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs">
              <div className="bg-white dark:bg-slate-950 p-3 rounded-2xl border border-rose-100 dark:border-slate-800 shadow-2xs">
                <span className="text-slate-500 font-semibold block text-[11px]">Total Pejabat</span>
                <span className="text-xl font-black text-rose-600 dark:text-rose-400 mt-0.5 block">
                  {listBelumBersertifikat.length} <span className="text-xs font-normal text-slate-400">Orang</span>
                </span>
              </div>

              <div className="bg-white dark:bg-slate-950 p-3 rounded-2xl border border-rose-100 dark:border-slate-800 shadow-2xs">
                <span className="text-slate-500 font-semibold block text-[11px]">Belum Rekam Usulan</span>
                <span className="text-xl font-black text-slate-800 dark:text-slate-200 mt-0.5 block">
                  {listBelumBersertifikat.filter(p => (p.statusUsulan || '').toLowerCase().includes('belum') || (p.statusUsulan || '').trim() === '').length} <span className="text-xs font-normal text-slate-400">Orang</span>
                </span>
              </div>

              <div className="bg-white dark:bg-slate-950 p-3 rounded-2xl border border-rose-100 dark:border-slate-800 shadow-2xs">
                <span className="text-slate-500 font-semibold block text-[11px]">Antrean Diklat KLC</span>
                <span className="text-xl font-black text-blue-600 dark:text-blue-400 mt-0.5 block">
                  {listBelumBersertifikat.filter(p => (p.statusUsulan || '').toLowerCase().includes('antrean diklat')).length} <span className="text-xs font-normal text-slate-400">Orang</span>
                </span>
              </div>

              <div className="bg-white dark:bg-slate-950 p-3 rounded-2xl border border-rose-100 dark:border-slate-800 shadow-2xs">
                <span className="text-slate-500 font-semibold block text-[11px]">Verifikasi / Jadwal Ujian</span>
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                  {listBelumBersertifikat.filter(p => (p.statusUsulan || '').toLowerCase().includes('verifikasi') || (p.statusUsulan || '').toLowerCase().includes('jadwal')).length} <span className="text-xs font-normal text-slate-400">Orang</span>
                </span>
              </div>
            </div>

            {/* Filter Bar for Belum Bersertifikat */}
            <div className="mt-4 pt-3 border-t border-rose-200/50 dark:border-rose-900/30 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* 1. Filter Satker */}
                <div>
                  <label className="text-[10px] font-black text-rose-900/60 dark:text-rose-300 uppercase tracking-wider block mb-1">
                    Filter Satuan Kerja
                  </label>
                  <select
                    value={satkerBelumSert}
                    onChange={(e) => setSatkerBelumSert(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-rose-500"
                  >
                    <option value="ALL">-- Semua Satker ({satkerOptionsBelumSert.length} Satker) --</option>
                    {satkerOptionsBelumSert.map(s => (
                      <option key={s.kdSatker} value={s.kdSatker}>
                        [{s.kdSatker}] {s.nmSatker} ({s.count})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Filter Jabatan */}
                <div>
                  <label className="text-[10px] font-black text-rose-900/60 dark:text-rose-300 uppercase tracking-wider block mb-1">
                    Filter Jabatan
                  </label>
                  <select
                    value={jabatanBelumSert}
                    onChange={(e) => setJabatanBelumSert(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-rose-500"
                  >
                    <option value="ALL">-- Semua Jabatan ({listBelumBersertifikat.length}) --</option>
                    {jabatanOptionsBelumSert.map(j => (
                      <option key={j} value={j}>{j}</option>
                    ))}
                  </select>
                </div>

                {/* 3. Status Usulan */}
                <div>
                  <label className="text-[10px] font-black text-rose-900/60 dark:text-rose-300 uppercase tracking-wider block mb-1">
                    Status Usulan SIMASPATEN
                  </label>
                  <select
                    value={statusUsulanBelumSert}
                    onChange={(e) => setStatusUsulanBelumSert(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-rose-500"
                  >
                    <option value="ALL">-- Semua Status Usulan --</option>
                    {statusUsulanOptionsBelumSert.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* 4. Pencarian */}
                <div>
                  <label className="text-[10px] font-black text-rose-900/60 dark:text-rose-300 uppercase tracking-wider block mb-1">
                    Cari Pejabat / NIP / Satker
                  </label>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      value={searchBelumSert}
                      onChange={(e) => setSearchBelumSert(e.target.value)}
                      placeholder="Ketik NIP, Nama, Satker..."
                      className="w-full pl-9 pr-8 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl py-2 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-rose-500"
                    />
                    {searchBelumSert && (
                      <button
                        onClick={() => setSearchBelumSert('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Active Filter Indicator & Reset */}
              {isBelumSertFiltered && (
                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium">
                    Filter aktif: Menampilkan <strong>{filteredBelumBersertifikat.length}</strong> dari <strong>{listBelumBersertifikat.length}</strong> pejabat
                  </span>
                  <button
                    type="button"
                    onClick={handleResetBelumSertFilters}
                    className="text-rose-600 hover:text-rose-700 dark:text-rose-400 font-bold text-xs flex items-center gap-1 cursor-pointer underline underline-offset-2"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Reset Semua Filter</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Scroll info indicator */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-1">
            <span className="flex items-center gap-1.5 font-medium">
              <ArrowRight className="w-3.5 h-3.5 text-rose-500" />
              <span>Geser tabel ke kanan untuk melihat seluruh kolom (Rekomendasi &amp; Detail).</span>
            </span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Total {filteredBelumBersertifikat.length} Baris
            </span>
          </div>

          {/* Table 1: Pejabat Belum Bersertifikat */}
          <div className={`rounded-3xl border overflow-hidden shadow-md ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="overflow-x-auto w-full scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
              <table className="w-full text-left border-collapse text-xs min-w-[1050px]">
                <thead>
                  <tr className={`border-b uppercase font-black tracking-wider text-[11px] ${
                    isDark ? 'bg-slate-950 text-slate-300 border-slate-800' : 'bg-rose-100/60 text-rose-950 border-rose-200'
                  }`}>
                    <th className="py-3 px-3 text-center w-12 shrink-0">No</th>
                    <th className="py-3 px-3 min-w-[140px]">NIP Pejabat</th>
                    <th className="py-3 px-3 min-w-[180px]">Nama Pejabat</th>
                    <th className="py-3 px-3 min-w-[140px]">Jabatan</th>
                    <th className="py-3 px-3 min-w-[220px]">Satuan Kerja &amp; K/L</th>
                    <th className="py-3 px-3 text-center min-w-[130px]">Status Sertifikasi</th>
                    <th className="py-3 px-3 min-w-[160px]">Status Usulan SIMASPATEN</th>
                    <th className="py-3 px-3 min-w-[110px]">KPPN</th>
                    <th className="py-3 px-3 min-w-[200px]">Rekomendasi Tindak Lanjut</th>
                    <th className="py-3 px-3 text-center w-16">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredBelumBersertifikat.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400">
                        <UserX className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
                        <p className="font-extrabold text-sm text-slate-700 dark:text-slate-300">
                          Tidak Ditemukan Pejabat Belum Bersertifikat
                        </p>
                        <p className="text-xs mt-1 text-slate-400">
                          {isBelumSertFiltered
                            ? 'Coba sesuaikan kata kunci pencarian atau reset filter di atas.'
                            : 'Belum ada data pada kategori ini.'}
                        </p>
                        {isBelumSertFiltered && (
                          <button
                            onClick={handleResetBelumSertFilters}
                            className="mt-3 px-3 py-1.5 bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 rounded-lg text-xs font-bold hover:bg-rose-200 transition-all cursor-pointer"
                          >
                            Reset Filter
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredBelumBersertifikat.map((p, idx) => (
                      <tr 
                        key={p.id || `belum-sert-${idx}`}
                        className="hover:bg-rose-50/30 dark:hover:bg-slate-800/60 transition-colors"
                      >
                        {/* No */}
                        <td className="py-3 px-3 text-center font-bold text-slate-400 font-mono">
                          {idx + 1}
                        </td>

                        {/* NIP */}
                        <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                          {p.nip}
                        </td>

                        {/* Nama Pejabat */}
                        <td className="py-3 px-3">
                          <div className="font-extrabold text-slate-900 dark:text-slate-100">
                            {p.nama}
                          </div>
                        </td>

                        {/* Jabatan */}
                        <td className="py-3 px-3">
                          <span className="inline-block bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {p.nmJabatan}
                          </span>
                        </td>

                        {/* Satker */}
                        <td className="py-3 px-3 min-w-[220px] max-w-[280px]">
                          <div className="flex items-start gap-1.5">
                            <span className="font-mono font-bold text-[10px] bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 px-1.5 py-0.5 rounded shrink-0 mt-0.5">
                              {p.kdSatker}
                            </span>
                            <div className="font-bold text-slate-900 dark:text-slate-100 text-xs leading-snug line-clamp-2" title={p.nmSatker}>
                              {p.nmSatker}
                            </div>
                          </div>
                        </td>

                        {/* Status Sertifikasi */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 font-bold text-[10px] px-2.5 py-0.5 rounded-full border border-rose-300 dark:border-rose-800">
                            <AlertCircle className="w-3 h-3 text-rose-500" />
                            <span>Belum Tersertifikasi</span>
                          </span>
                        </td>

                        {/* Status Usulan SIMASPATEN */}
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            {p.statusUsulan?.toLowerCase().includes('antrean') && (
                              <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                            )}
                            {p.statusUsulan?.toLowerCase().includes('verifikasi') && (
                              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
                            )}
                            {p.statusUsulan?.toLowerCase().includes('jadwal') && (
                              <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0"></span>
                            )}
                            <span>{p.statusUsulan || 'Belum rekam usulan'}</span>
                          </div>
                        </td>

                        {/* KPPN */}
                        <td className="py-3 px-3 font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {p.kppn || 'SEMARANG I'}
                        </td>

                        {/* Rekomendasi Tindak Lanjut Satker */}
                        <td className="py-3 px-3 min-w-[200px] max-w-[260px]">
                          <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                            {getPejabatRekomendasi(p)}
                          </div>
                        </td>

                        {/* Detail Info Button (No WA) */}
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => setSelectedPejabat(p)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-all cursor-pointer"
                            title="Lihat Detail Profil"
                          >
                            <Info className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>Menampilkan <strong>{filteredBelumBersertifikat.length}</strong> dari <strong>{listBelumBersertifikat.length}</strong> pejabat belum bersertifikat.</span>
              <span className="font-semibold text-rose-700 dark:text-rose-400">Tabel 1: Format Standar Belum Bersertifikat</span>
            </div>
          </div>

        </div>
      )}


      {/* ========================================================================= */}
      {/* BAGIAN 2: TABEL PEJABAT BELUM PERPANJANGAN (MASA BERLAKU SERTIFIKAT)       */}
      {/* ========================================================================= */}
      {(activeSubTab === 'BELUM_PERPANJANGAN' || activeSubTab === 'SEMUA_TERPISAH') && (
        <div className="space-y-4 pt-2">
          
          {/* Section 2 Header & KPIs */}
          <div className={`p-6 rounded-3xl border ${
            isDark ? 'bg-slate-900 border-amber-900/40 text-slate-100' : 'bg-amber-50/40 border-amber-200 text-slate-900'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-200/60 dark:border-amber-900/40 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-md">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-amber-900 dark:text-amber-300 flex items-center gap-2">
                    <span>2. Daftar Pejabat Belum Perpanjangan (Masa Berlaku Sertifikat)</span>
                    <span className="bg-amber-200 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-xs px-2.5 py-0.5 rounded-full font-bold">
                      {listBelumPerpanjangan.length} Pejabat
                    </span>
                  </h3>
                  <p className="text-xs text-amber-700/80 dark:text-amber-400 mt-0.5">
                    Data pejabat perbendaharaan bersertifikat (PPK/PPSPM) yang masa berlakunya telah habis (kadaluarsa) atau mendekati masa kadaluarsa dan perlu perpanjangan PPL SIMASPATEN.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleExportBelumPerpanjangan}
                className="bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-all active:scale-95 shrink-0 self-start sm:self-auto"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Excel Belum Perpanjangan (.xlsx)</span>
              </button>
            </div>

            {/* Quick KPI Stats for Belum Perpanjangan */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs">
              <div className="bg-white dark:bg-slate-950 p-3 rounded-2xl border border-amber-100 dark:border-slate-800 shadow-2xs">
                <span className="text-slate-500 font-semibold block text-[11px]">Total Pejabat</span>
                <span className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5 block">
                  {listBelumPerpanjangan.length} <span className="text-xs font-normal text-slate-400">Orang</span>
                </span>
              </div>

              <div className="bg-white dark:bg-slate-950 p-3 rounded-2xl border border-amber-100 dark:border-slate-800 shadow-2xs">
                <span className="text-slate-500 font-semibold block text-[11px]">Masa Berlaku Habis (Expired)</span>
                <span className="text-xl font-black text-rose-600 dark:text-rose-400 mt-0.5 block">
                  {listBelumPerpanjangan.filter(p => p.isKadaluarsa).length} <span className="text-xs font-normal text-slate-400">Pejabat</span>
                </span>
              </div>

              <div className="bg-white dark:bg-slate-950 p-3 rounded-2xl border border-amber-100 dark:border-slate-800 shadow-2xs">
                <span className="text-slate-500 font-semibold block text-[11px]">Pejabat Status Aktif</span>
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                  {listBelumPerpanjangan.filter(p => (p.statusJabatan || 'Aktif').toLowerCase() === 'aktif').length} <span className="text-xs font-normal text-slate-400">Pejabat</span>
                </span>
              </div>

              <div className="bg-white dark:bg-slate-950 p-3 rounded-2xl border border-amber-100 dark:border-slate-800 shadow-2xs">
                <span className="text-slate-500 font-semibold block text-[11px]">Usulan Terkirim ke DSP</span>
                <span className="text-xl font-black text-blue-600 dark:text-blue-400 mt-0.5 block">
                  {listBelumPerpanjangan.filter(p => (p.statusUsulan || '').toLowerCase().includes('admin dsp')).length} <span className="text-xs font-normal text-slate-400">Pejabat</span>
                </span>
              </div>
            </div>

            {/* Filter Bar for Belum Perpanjangan */}
            <div className="mt-4 pt-3 border-t border-amber-200/50 dark:border-amber-900/30 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {/* 1. Filter Satker */}
                <div>
                  <label className="text-[10px] font-black text-amber-900/60 dark:text-amber-300 uppercase tracking-wider block mb-1">
                    Satuan Kerja
                  </label>
                  <select
                    value={satkerPerpanjangan}
                    onChange={(e) => setSatkerPerpanjangan(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500 truncate"
                  >
                    <option value="ALL">-- Semua Satker ({satkerOptionsPerpanjangan.length}) --</option>
                    {satkerOptionsPerpanjangan.map(s => (
                      <option key={s.kdSatker} value={s.kdSatker}>
                        [{s.kdSatker}] {s.nmSatker} ({s.count})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Filter Jabatan */}
                <div>
                  <label className="text-[10px] font-black text-amber-900/60 dark:text-amber-300 uppercase tracking-wider block mb-1">
                    Jabatan
                  </label>
                  <select
                    value={jabatanPerpanjangan}
                    onChange={(e) => setJabatanPerpanjangan(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500 truncate"
                  >
                    <option value="ALL">-- Semua Jabatan ({listBelumPerpanjangan.length}) --</option>
                    {jabatanOptionsPerpanjangan.map(j => (
                      <option key={j} value={j}>{j}</option>
                    ))}
                  </select>
                </div>

                {/* 3. Filter Status Jabatan */}
                <div>
                  <label className="text-[10px] font-black text-amber-900/60 dark:text-amber-300 uppercase tracking-wider block mb-1">
                    Status Jabatan
                  </label>
                  <select
                    value={statusJabatanPerpanjangan}
                    onChange={(e) => setStatusJabatanPerpanjangan(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="ALL">-- Semua Status Jabatan --</option>
                    <option value="Aktif">Aktif</option>
                    <option value="Non Aktif">Non Aktif</option>
                  </select>
                </div>

                {/* 4. Filter Status Masa Berlaku */}
                <div>
                  <label className="text-[10px] font-black text-amber-900/60 dark:text-amber-300 uppercase tracking-wider block mb-1">
                    Status Masa Berlaku
                  </label>
                  <select
                    value={statusMasaBerlakuFilter}
                    onChange={(e) => setStatusMasaBerlakuFilter(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500 truncate"
                  >
                    <option value="ALL">-- Semua Masa Berlaku --</option>
                    <option value="KADALUARSA">Sudah Kadaluarsa (Expired)</option>
                    <option value="MENDEKATI">Kritis (&le; 60 Hari)</option>
                    <option value="AMAN">Masih Aktif (&gt; 60 Hari)</option>
                  </select>
                </div>

                {/* 5. Filter K/L */}
                <div>
                  <label className="text-[10px] font-black text-amber-900/60 dark:text-amber-300 uppercase tracking-wider block mb-1">
                    Kementerian / Lembaga
                  </label>
                  <select
                    value={klPerpanjanganFilter}
                    onChange={(e) => setKlPerpanjanganFilter(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500 truncate"
                  >
                    <option value="ALL">-- Semua K/L Mitra --</option>
                    {klOptionsPerpanjangan.map(kl => (
                      <option key={kl} value={kl}>{kl}</option>
                    ))}
                  </select>
                </div>

                {/* 6. Pencarian */}
                <div>
                  <label className="text-[10px] font-black text-amber-900/60 dark:text-amber-300 uppercase tracking-wider block mb-1">
                    Cari Nama / NIP / Sertifikat
                  </label>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      value={searchPerpanjangan}
                      onChange={(e) => setSearchPerpanjangan(e.target.value)}
                      placeholder="Ketik NIP, Nama, Satker..."
                      className="w-full pl-9 pr-8 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl py-2 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500"
                    />
                    {searchPerpanjangan && (
                      <button
                        onClick={() => setSearchPerpanjangan('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Active Filter Indicator & Reset */}
              {isPerpanjanganFiltered && (
                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium">
                    Filter aktif: Menampilkan <strong>{filteredBelumPerpanjangan.length}</strong> dari <strong>{listBelumPerpanjangan.length}</strong> pejabat
                  </span>
                  <button
                    type="button"
                    onClick={handleResetPerpanjanganFilters}
                    className="text-amber-700 hover:text-amber-800 dark:text-amber-400 font-bold text-xs flex items-center gap-1 cursor-pointer underline underline-offset-2"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Reset Semua Filter</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Scroll info indicator */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-1">
            <span className="flex items-center gap-1.5 font-medium">
              <ArrowRight className="w-3.5 h-3.5 text-amber-500" />
              <span>Geser tabel ke kanan untuk melihat seluruh kolom (Status Usulan, K/L &amp; Detail).</span>
            </span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Total {filteredBelumPerpanjangan.length} Baris
            </span>
          </div>

          {/* Table 2: Pejabat Belum Perpanjangan */}
          <div className={`rounded-3xl border overflow-hidden shadow-md ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="overflow-x-auto w-full scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
              <table className="w-full text-left border-collapse text-xs min-w-[1180px]">
                <thead>
                  <tr className={`border-b uppercase font-black tracking-wider text-[11px] ${
                    isDark ? 'bg-slate-950 text-slate-300 border-slate-800' : 'bg-amber-100/60 text-amber-950 border-amber-200'
                  }`}>
                    <th className="py-3 px-3 text-center w-12 shrink-0">No</th>
                    <th className="py-3 px-3 min-w-[180px]">Nama Pejabat &amp; NIP</th>
                    <th className="py-3 px-3 min-w-[220px]">Kode &amp; Satuan Kerja</th>
                    <th className="py-3 px-3 min-w-[140px]">Jabatan</th>
                    <th className="py-3 px-3 min-w-[130px]">Nomor Sertifikat</th>
                    <th className="py-3 px-3 text-center min-w-[95px]">Tgl Sertifikat</th>
                    <th className="py-3 px-3 text-center min-w-[105px]">Tgl Kadaluarsa</th>
                    <th className="py-3 px-3 text-center min-w-[125px]">Status Berlaku</th>
                    <th className="py-3 px-3 text-center min-w-[95px]">Status Jabatan</th>
                    <th className="py-3 px-3 min-w-[140px]">Status Usulan</th>
                    <th className="py-3 px-3 min-w-[130px]">K/L</th>
                    <th className="py-3 px-3 text-center w-16">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredBelumPerpanjangan.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="py-12 text-center text-slate-400">
                        <UserX className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
                        <p className="font-extrabold text-sm text-slate-700 dark:text-slate-300">
                          Tidak Ditemukan Pejabat Belum Perpanjangan
                        </p>
                        <p className="text-xs mt-1 text-slate-400">
                          {isPerpanjanganFiltered
                            ? 'Coba sesuaikan kata kunci pencarian atau reset filter di atas.'
                            : 'Belum ada data pada kategori ini.'}
                        </p>
                        {isPerpanjanganFiltered && (
                          <button
                            onClick={handleResetPerpanjanganFilters}
                            className="mt-3 px-3 py-1.5 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 rounded-lg text-xs font-bold hover:bg-amber-200 transition-all cursor-pointer"
                          >
                            Reset Filter
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredBelumPerpanjangan.map((p, idx) => {
                      const isAktif = (p.statusJabatan || 'Aktif').toLowerCase() === 'aktif';
                      const cert = formatSertifikatInfo(p);

                      return (
                        <tr 
                          key={p.id || `belum-perpanjangan-${idx}`}
                          className={`hover:bg-amber-50/40 dark:hover:bg-slate-800/60 transition-colors ${
                            p.isKadaluarsa ? (isDark ? 'bg-rose-950/20' : 'bg-rose-50/30') : ''
                          }`}
                        >
                          {/* No */}
                          <td className="py-3 px-3 text-center font-bold text-slate-400 font-mono">
                            {idx + 1}
                          </td>

                          {/* Nama Pejabat & NIP */}
                          <td className="py-3 px-3">
                            <div className="font-extrabold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                              {p.nama}
                            </div>
                            <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                              NIP: {p.nip}
                            </div>
                          </td>

                          {/* Kode & Satker */}
                          <td className="py-3 px-3 min-w-[220px] max-w-[280px]">
                            <div className="flex items-start gap-1.5">
                              <span className="font-mono font-bold text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded shrink-0 mt-0.5">
                                {p.kdSatker}
                              </span>
                              <div className="font-bold text-slate-900 dark:text-slate-100 text-xs leading-snug line-clamp-2" title={p.nmSatker}>
                                {p.nmSatker}
                              </div>
                            </div>
                          </td>

                          {/* Jabatan */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className="inline-block bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200">
                              {p.nmJabatan}
                            </span>
                          </td>

                          {/* Nomor Sertifikat */}
                          <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                            {cert.noSertifikat}
                          </td>

                          {/* Tanggal Sertifikat */}
                          <td className="py-3 px-3 text-center font-mono text-[11px] text-slate-600 dark:text-slate-400 whitespace-nowrap">
                            {cert.tglSertifikat}
                          </td>

                          {/* Tanggal Kadaluarsa */}
                          <td className="py-3 px-3 text-center font-mono font-bold text-[11px] whitespace-nowrap">
                            <span className={p.isKadaluarsa ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-200'}>
                              {cert.tglKadaluarsa}
                            </span>
                          </td>

                          {/* Status Berlaku */}
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            {p.isKadaluarsa ? (
                              <span className="bg-rose-600 text-white font-bold text-[10px] px-2.5 py-0.5 rounded-md shadow-xs">
                                HABIS
                              </span>
                            ) : p.sisaHariMasaBerlaku !== undefined && p.sisaHariMasaBerlaku <= 60 ? (
                              <span className="bg-amber-500 text-slate-950 font-bold text-[10px] px-2.5 py-0.5 rounded-md shadow-xs">
                                Sisa {p.sisaHariMasaBerlaku} Hari
                              </span>
                            ) : (
                              <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[10px] px-2.5 py-0.5 rounded-md border border-emerald-300 dark:border-emerald-800">
                                Aktif ({p.sisaHariMasaBerlaku || '-'} Hari)
                              </span>
                            )}
                          </td>

                          {/* Status Jabatan */}
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                              isAktif
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}>
                              {p.statusJabatan || 'Aktif'}
                            </span>
                          </td>

                          {/* Status Usulan */}
                          <td className="py-3 px-3 whitespace-nowrap font-medium text-slate-800 dark:text-slate-200">
                            {p.statusUsulan || 'Belum Diusulkan'}
                          </td>

                          {/* Kementerian / Lembaga */}
                          <td className="py-3 px-3 min-w-[130px] max-w-[180px] text-slate-500 dark:text-slate-400 text-[11px]" title={p.kementerianLembaga}>
                            <div className="line-clamp-2">
                              {p.kementerianLembaga || '-'}
                            </div>
                          </td>

                          {/* Detail Info Button (No WA) */}
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => setSelectedPejabat(p)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-all cursor-pointer"
                              title="Lihat Detail Profil"
                            >
                              <Info className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>Menampilkan <strong>{filteredBelumPerpanjangan.length}</strong> dari <strong>{listBelumPerpanjangan.length}</strong> pejabat belum perpanjangan.</span>
              <span className="font-semibold text-amber-700 dark:text-amber-400">Tabel 2: Format Standar Belum Perpanjangan</span>
            </div>
          </div>

        </div>
      )}


      {/* ========================================================================= */}
      {/* MODAL DETAIL INFORMASI PEJABAT (CLEAN INFO FOR SATKER - NO WA BUTTONS)    */}
      {/* ========================================================================= */}
      {selectedPejabat && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`w-full max-w-xl rounded-3xl border shadow-2xl overflow-hidden ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-500/10 to-indigo-500/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-md">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base">{selectedPejabat.nama}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">NIP: {selectedPejabat.nip}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedPejabat(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              
              {/* Profile Details */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Satuan Kerja</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs mt-0.5 block">
                    {selectedPejabat.nmSatker}
                  </span>
                  <span className="font-mono text-amber-600 dark:text-amber-400 text-xs">
                    Kode Satker: {selectedPejabat.kdSatker}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Kementerian / Lembaga</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs mt-0.5 block">
                    {selectedPejabat.kementerianLembaga || 'Kementerian / Lembaga Mitra'}
                  </span>
                  <span className="text-slate-500 text-xs">
                    KPPN: {selectedPejabat.kppn || 'SEMARANG I'}
                  </span>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-800 pt-2.5">
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Jabatan Pejabat</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 text-xs mt-0.5 block">
                    {selectedPejabat.nmJabatan}
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    Status Jabatan: <strong>{selectedPejabat.statusJabatan || 'Aktif'}</strong>
                  </span>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-800 pt-2.5">
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Nomor Sertifikat</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white text-xs mt-0.5 block">
                    {formatSertifikatInfo(selectedPejabat).noSertifikat}
                  </span>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-500 text-[11px] mt-1">
                    {formatSertifikatInfo(selectedPejabat).tglSertifikat !== '-' && (
                      <span>Tgl Terbit: <strong className="text-slate-700 dark:text-slate-300">{formatSertifikatInfo(selectedPejabat).tglSertifikat}</strong></span>
                    )}
                    {formatSertifikatInfo(selectedPejabat).tglKadaluarsa !== '-' && (
                      <span>Kadaluarsa: <strong className={selectedPejabat.isKadaluarsa ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}>{formatSertifikatInfo(selectedPejabat).tglKadaluarsa}</strong></span>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Usulan & Rekomendasi Tindak Lanjut */}
              <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-amber-800 dark:text-amber-300 font-bold text-xs flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Status Usulan &amp; Rekomendasi SIMASPATEN</span>
                  </span>
                  <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-2.5 py-0.5 rounded-full">
                    {selectedPejabat.statusUsulan || 'Belum Rekam Usulan'}
                  </span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  {getPejabatRekomendasi(selectedPejabat)}
                </p>
              </div>

              {/* Administrative Info note for Satker */}
              <div className="bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 p-3.5 rounded-2xl text-[11px] text-sky-800 dark:text-sky-300 flex items-start gap-2">
                <Info className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                <p>
                  Data ini disinkronkan secara berkala dengan sistem SIMASPATEN &amp; KPPN Semarang I. Satuan Kerja diharapkan segera menindaklanjuti pejabat dengan status usulan belum rekam atau sertifikat yang telah/akan kadaluarsa demi kelancaran pengelolaan keuangan.
                </p>
              </div>

            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedPejabat(null)}
                className="bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ========================================================================= */}
      {/* MODAL UPLOAD EXCEL PEJABAT (ADMIN ONLY)                                    */}
      {/* ========================================================================= */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`w-full max-w-3xl rounded-3xl border shadow-2xl overflow-hidden ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-500/10 to-indigo-500/10">
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-6 h-6 text-indigo-500" />
                <div>
                  <h3 className="font-extrabold text-base">Unggah File Excel Pejabat Perbendaharaan</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Otomatis mengenali file Belum Bersertifikat &amp; Belum Perpanjangan KPPN Semarang I
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadFile(null);
                  setUploadPreview(null);
                  setUploadError(null);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              
              {/* Drag & Drop Box */}
              <div className="border-2 border-dashed border-indigo-300 dark:border-indigo-800 hover:border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/20 rounded-2xl p-6 text-center transition-all">
                <input
                  type="file"
                  id="excelPejabatUploadInput"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <label
                  htmlFor="excelPejabatUploadInput"
                  className="cursor-pointer block space-y-2"
                >
                  <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 rounded-full flex items-center justify-center mx-auto">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-200 block">
                      {uploadFile ? uploadFile.name : 'Pilih atau Tarik File Excel ke Sini'}
                    </span>
                    <span className="text-slate-500 text-xs mt-1 block">
                      Mendukung Format 1 (Belum Bersertifikat), Format 2 (Belum Perpanjangan), atau Format Gabungan (.xlsx, .xls)
                    </span>
                  </div>
                </label>
              </div>

              {isProcessingUpload && (
                <div className="p-4 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 rounded-2xl text-center flex items-center justify-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Memvalidasi &amp; membaca baris data Excel...</span>
                </div>
              )}

              {uploadError && (
                <div className="p-4 bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 rounded-2xl flex items-center gap-2 font-semibold">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Upload Mode Selector */}
              {uploadPreview && (
                <div className="space-y-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-800 dark:text-slate-200 text-xs">
                      Pilihan Metode Penerapan Data:
                    </span>
                    <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[10px] px-2.5 py-0.5 rounded-full">
                      Terbaca {uploadPreview.validData.length} Pejabat ({uploadPreview.periode})
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setUploadMode('MERGE')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        uploadMode === 'MERGE'
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 font-bold text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <div className="font-black text-xs">1. Gabungkan &amp; Update</div>
                      <div className="text-[10px] mt-0.5 text-slate-500">Pertahankan data kategori lain &amp; perbarui yang cocok.</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setUploadMode('REPLACE_CATEGORY')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        uploadMode === 'REPLACE_CATEGORY'
                          ? 'border-amber-600 bg-amber-50 dark:bg-amber-950 font-bold text-amber-900 dark:text-amber-200 ring-2 ring-amber-500'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <div className="font-black text-xs">2. Ganti Kategori Ini</div>
                      <div className="text-[10px] mt-0.5 text-slate-500">Timpa seluruh data dalam kategori yang sama.</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setUploadMode('REPLACE_ALL')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        uploadMode === 'REPLACE_ALL'
                          ? 'border-rose-600 bg-rose-50 dark:bg-rose-950 font-bold text-rose-900 dark:text-rose-200 ring-2 ring-rose-500'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <div className="font-black text-xs">3. Ganti Semua Data</div>
                      <div className="text-[10px] mt-0.5 text-slate-500">Kosongkan seluruh data lama &amp; ganti baru.</div>
                    </button>
                  </div>
                </div>
              )}

              {/* Preview Table */}
              {uploadPreview && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                    <span>Pratinjau Data (10 Baris Pertama):</span>
                    <span>Total: {uploadPreview.validData.length} Pejabat</span>
                  </div>

                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto max-h-56">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-100 dark:bg-slate-800 font-black uppercase text-slate-700 dark:text-slate-300 sticky top-0">
                        <tr>
                          <th className="p-2">No</th>
                          <th className="p-2">Pejabat &amp; NIP</th>
                          <th className="p-2">Satker</th>
                          <th className="p-2">Jabatan</th>
                          <th className="p-2">Status Usulan</th>
                          <th className="p-2">Sertifikat</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {uploadPreview.validData.slice(0, 10).map((row: any, i: number) => (
                          <tr key={i}>
                            <td className="p-2 font-mono">{i + 1}</td>
                            <td className="p-2 font-bold">{row.nama} <span className="font-mono text-[10px] text-slate-500 block">{row.nip}</span></td>
                            <td className="p-2">{row.nmSatker}</td>
                            <td className="p-2">{row.nmJabatan}</td>
                            <td className="p-2">{row.statusUsulan}</td>
                            <td className="p-2 font-mono">{row.noSertifikat || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadFile(null);
                  setUploadPreview(null);
                  setUploadError(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleApplyUpload}
                disabled={!uploadPreview || !uploadPreview.validData || uploadPreview.validData.length === 0}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Terapkan ke Dashboard ({uploadPreview?.validData?.length || 0} Data)</span>
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ========================================================================= */}
      {/* MODAL ADMIN AUTH PIN                                                      */}
      {/* ========================================================================= */}
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
                Fitur upload ini terproteksi khusus untuk Admin KPPN Semarang I.
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
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
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
