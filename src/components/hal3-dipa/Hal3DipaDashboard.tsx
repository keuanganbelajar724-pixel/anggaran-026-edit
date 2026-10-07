import React, { useState, useMemo } from 'react';
import { 
  FileCheck, 
  Search, 
  Filter, 
  RefreshCw, 
  Upload, 
  FileSpreadsheet, 
  FileDown, 
  Printer, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Building2, 
  ArrowRight, 
  Info, 
  ChevronRight, 
  Layers, 
  Send, 
  Phone, 
  PieChart, 
  BarChart3, 
  Sparkles, 
  Eye, 
  HelpCircle,
  Package,
  SlidersHorizontal,
  Flame,
  ShieldCheck,
  Check
} from 'lucide-react';
import { 
  MonitoringHal3Item, 
  TindakLanjutHal3, 
  HistoriHal3Item, 
  UploadHal3Batch,
  StatusKanwilHal3,
  StatusTindakLanjutHal3,
  KeputusanSatkerHal3,
  STANDAR_ALASAN_TIDAK_MENGAJUKAN
} from '../../types/hal3Dipa';
import { LLATEvent } from '../../types/llat';
import { Hal3DipaDetailModal } from './Hal3DipaDetailModal';
import { Hal3DipaUploadModal } from './Hal3DipaUploadModal';
import { Hal3DipaHistoryModal } from './Hal3DipaHistoryModal';
import { Hal3DipaExportPdfModal } from './Hal3DipaExportPdfModal';
import { exportHal3DipaToExcel } from '../../utils/hal3DipaExport';
import { generateDefaultHal3DipaData, DEFAULT_HAL3_UPLOAD_BATCH } from '../../data/defaultHal3DipaData';

interface Hal3DipaDashboardProps {
  records: MonitoringHal3Item[];
  batches: UploadHal3Batch[];
  onUpdateRecords: (records: MonitoringHal3Item[], batches: UploadHal3Batch[]) => void;
  llatEvents?: LLATEvent[];
  isAdminAuthenticated: boolean;
  currentUser?: { name?: string; role?: string; satkerCode?: string } | null;
  onNavigateTab?: (tab: string) => void;
  theme?: string;
}

export const Hal3DipaDashboard: React.FC<Hal3DipaDashboardProps> = ({
  records,
  batches,
  onUpdateRecords,
  llatEvents = [],
  isAdminAuthenticated,
  currentUser,
  onNavigateTab,
  theme = 'light'
}) => {
  // Filter States
  const [tahunAnggaran, setTahunAnggaran] = useState<number>(2026);
  const [periode, setPeriode] = useState<string>('TW IV');
  const [kppnKode, setKppnKode] = useState<string>('026');
  const [statusKanwilFilter, setStatusKanwilFilter] = useState<string>('ALL');
  const [statusTindakLanjutFilter, setStatusTindakLanjutFilter] = useState<string>('ALL');
  const [keputusanFilter, setKeputusanFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Active Action View Tab (Semua / Perlu Tindak Lanjut / Menunggu / Akan / Tidak)
  const [activeViewTab, setActiveViewTab] = useState<
    'SEMUA' | 'PERLU_TL' | 'MENUNGGU' | 'AKAN' | 'TIDAK_MENGAJUKAN'
  >('SEMUA');

  // Modal States
  const [selectedRecord, setSelectedRecord] = useState<MonitoringHal3Item | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Cek Event LLAT Terkait Hal III DIPA
  const llatHal3Event = useMemo(() => {
    return llatEvents.find(e => 
      /hal\s*iii|hal\s*3|revisi\s*dipa/i.test(e.nama_kegiatan) ||
      /hal\s*iii|hal\s*3|revisi\s*dipa/i.test(e.deskripsi || '')
    );
  }, [llatEvents]);

  // Hitung hari tersisa ke deadline LLAT jika ada
  const llatCountdown = useMemo(() => {
    if (!llatHal3Event) return null;
    try {
      const target = new Date(`${llatHal3Event.tanggal_batas}T${llatHal3Event.jam_batas || '23:59:59'}`);
      const now = new Date();
      const diffMs = target.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      return {
        days: diffDays,
        isOverdue: diffDays < 0,
        isToday: diffDays === 0,
        formattedDate: new Date(llatHal3Event.tanggal_batas).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })
      };
    } catch {
      return null;
    }
  }, [llatHal3Event]);

  // Filter Data Utama
  const filteredRecords = useMemo(() => {
    return records.filter(item => {
      // Filter TA dan Periode
      if (item.tahun_anggaran !== tahunAnggaran) return false;
      if (periode !== 'ALL' && item.periode !== periode) return false;

      // Filter Status Kanwil
      if (statusKanwilFilter !== 'ALL' && item.status_kanwil !== statusKanwilFilter) {
        return false;
      }

      // Filter Status Tindak Lanjut
      if (statusTindakLanjutFilter !== 'ALL') {
        const itemTl = item.tindak_lanjut?.status_tindak_lanjut || 'Belum Ditindaklanjuti';
        if (itemTl !== statusTindakLanjutFilter) return false;
      }

      // Filter Keputusan Satker
      if (keputusanFilter !== 'ALL') {
        const itemKep = item.tindak_lanjut?.keputusan_satker || '';
        if (itemKep !== keputusanFilter) return false;
      }

      // View Tab filter
      if (activeViewTab === 'PERLU_TL') {
        const isBelumMengajukan = item.status_kanwil === 'Belum Mengajukan';
        const isBelumTl = !item.tindak_lanjut || item.tindak_lanjut.status_tindak_lanjut === 'Belum Ditindaklanjuti';
        if (!isBelumMengajukan || !isBelumTl) return false;
      } else if (activeViewTab === 'MENUNGGU') {
        if (item.tindak_lanjut?.status_tindak_lanjut !== 'Menunggu Jawaban') return false;
      } else if (activeViewTab === 'AKAN') {
        if (item.tindak_lanjut?.keputusan_satker !== 'Akan Mengajukan') return false;
      } else if (activeViewTab === 'TIDAK_MENGAJUKAN') {
        const kep = item.tindak_lanjut?.keputusan_satker;
        if (kep !== 'Tidak Mengajukan' && kep !== 'Hal III Sudah Sesuai') return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const kode = String(item.kode_satker || '').toLowerCase();
        const nama = String(item.nama_satker || item.nama_satker_source || '').toLowerCase();
        const pic = String(item.tindak_lanjut?.nama_pic || '').toLowerCase();
        if (!kode.includes(q) && !nama.includes(q) && !pic.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [
    records, 
    tahunAnggaran, 
    periode, 
    statusKanwilFilter, 
    statusTindakLanjutFilter, 
    keputusanFilter, 
    activeViewTab, 
    searchQuery
  ]);

  // Statistik Dinamis Berdasarkan TA & Periode
  const stats = useMemo(() => {
    const scopeRecords = records.filter(
      r => r.tahun_anggaran === tahunAnggaran && (periode === 'ALL' || r.periode === periode)
    );

    const total = scopeRecords.length;
    const sudahMengajukan = scopeRecords.filter(r => r.status_kanwil === 'Sudah Mengajukan').length;
    const belumMengajukan = scopeRecords.filter(r => r.status_kanwil === 'Belum Mengajukan').length;
    
    const sudahDikonfirmasi = scopeRecords.filter(
      r => r.tindak_lanjut && r.tindak_lanjut.status_tindak_lanjut !== 'Belum Ditindaklanjuti'
    ).length;

    const belumDitindaklanjuti = scopeRecords.filter(
      r => r.status_kanwil === 'Belum Mengajukan' && 
           (!r.tindak_lanjut || r.tindak_lanjut.status_tindak_lanjut === 'Belum Ditindaklanjuti')
    ).length;

    const akanMengajukan = scopeRecords.filter(
      r => r.tindak_lanjut?.keputusan_satker === 'Akan Mengajukan'
    ).length;

    const tidakMengajukan = scopeRecords.filter(
      r => r.tindak_lanjut?.keputusan_satker === 'Tidak Mengajukan'
    ).length;

    const hal3SudahSesuai = scopeRecords.filter(
      r => r.tindak_lanjut?.keputusan_satker === 'Hal III Sudah Sesuai' || 
           r.tindak_lanjut?.status_tindak_lanjut === 'Hal III Sudah Sesuai'
    ).length;

    const menungguJawaban = scopeRecords.filter(
      r => r.tindak_lanjut?.status_tindak_lanjut === 'Menunggu Jawaban'
    ).length;

    // Persentase Pengajuan
    const percentPengajuan = total > 0 ? (sudahMengajukan / total) * 100 : 0;

    return {
      total,
      sudahMengajukan,
      belumMengajukan,
      sudahDikonfirmasi,
      belumDitindaklanjuti,
      akanMengajukan,
      tidakMengajukan,
      hal3SudahSesuai,
      menungguJawaban,
      percentPengajuan
    };
  }, [records, tahunAnggaran, periode]);

  // Distribusi Alasan Tidak Mengajukan
  const distribusiAlasan = useMemo(() => {
    const counts: Record<string, number> = {};
    records
      .filter(r => r.tahun_anggaran === tahunAnggaran && (periode === 'ALL' || r.periode === periode))
      .forEach(r => {
        const alasan = r.tindak_lanjut?.alasan_kode;
        if (alasan) {
          counts[alasan] = (counts[alasan] || 0) + 1;
        }
      });
    return counts;
  }, [records, tahunAnggaran, periode]);

  // Handler Simpan Tindak Lanjut dari Modal Detail
  const handleSaveTindakLanjut = (
    recordId: string, 
    updatedTl: TindakLanjutHal3, 
    historiItem: HistoriHal3Item
  ) => {
    const updated = records.map(r => {
      if (r.id === recordId) {
        return {
          ...r,
          tindak_lanjut: updatedTl,
          histori: [historiItem, ...(r.histori || [])],
          updated_at: new Date().toISOString()
        };
      }
      return r;
    });

    onUpdateRecords(updated, batches);
    showToast('Data tindak lanjut KPPN berhasil disimpan.');
  };

  // Handler Import dari Modal Upload
  const handleImportComplete = (
    newRecords: MonitoringHal3Item[], 
    newBatch: UploadHal3Batch
  ) => {
    const updatedBatches = [newBatch, ...batches.filter(b => b.id !== newBatch.id)];
    onUpdateRecords(newRecords, updatedBatches);
    setIsUploadOpen(false);
    showToast(`Berhasil mengimpor ${newBatch.jumlah_data} satker dari berkas ${newBatch.nama_file}`);
  };

  // Handler Reset Data ke Contoh 125 Satker
  const handleLoadSampleBaseline = () => {
    const sample = generateDefaultHal3DipaData();
    const updatedBatches = [DEFAULT_HAL3_UPLOAD_BATCH, ...batches];
    onUpdateRecords(sample, updatedBatches);
    showToast('Data sampel monitoring TW IV 2026 KPPN Semarang I (125 Satker) berhasil dimuat.');
  };

  const handleResetFilters = () => {
    setStatusKanwilFilter('ALL');
    setStatusTindakLanjutFilter('ALL');
    setKeputusanFilter('ALL');
    setSearchQuery('');
    setActiveViewTab('SEMUA');
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-teal-900 text-white border border-teal-500 shadow-2xl text-xs font-bold flex items-center gap-3 animate-slide-up">
          <CheckCircle2 className="w-5 h-5 text-teal-300 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white border border-teal-900/60 shadow-xl p-6 sm:p-8">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-60 h-60 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-400/40 shadow-xs flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5" />
                MODUL MONITORING REVISI HAL III DIPA
              </span>
              <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-white/10 text-slate-200 border border-white/10">
                KPPN Semarang I (026)
              </span>
              <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                {periode} TA {tahunAnggaran}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>MONITORING HAL III DIPA</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Pusat pemantauan pengajuan revisi Hal III DIPA satker berdasarkan data monitoring Kanwil DJPb dan rekap tindak lanjut internal KPPN Semarang I.
            </p>
          </div>

          {/* Action Buttons Top */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {isAdminAuthenticated && (
              <button
                type="button"
                onClick={() => setIsUploadOpen(true)}
                className="px-4 py-2.5 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-teal-500/30 flex items-center gap-2 transition-all cursor-pointer hover:scale-[1.02]"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Excel Kanwil</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsHistoryOpen(true)}
              className="px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/10 flex items-center gap-1.5 transition-all cursor-pointer"
              title="Lihat riwayat unggahan berkas"
            >
              <Package className="w-4 h-4" />
              <span>Riwayat Upload ({batches.length})</span>
            </button>

            <button
              type="button"
              onClick={() => exportHal3DipaToExcel(filteredRecords)}
              className="px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/10 flex items-center gap-1.5 transition-all cursor-pointer"
              title="Export ke Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Export Excel</span>
            </button>

            <button
              type="button"
              onClick={() => setIsPdfModalOpen(true)}
              className="px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/10 flex items-center gap-1.5 transition-all cursor-pointer"
              title="Cetak Laporan PDF Resmi"
            >
              <Printer className="w-4 h-4 text-sky-400" />
              <span>Export PDF</span>
            </button>
          </div>
        </div>

        {/* INTEGRASI RINGAN DENGAN LLAT */}
        {llatHal3Event && llatCountdown && (
          <div className="mt-6 pt-5 border-t border-teal-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-teal-950/40 p-4 rounded-2xl border">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center justify-center font-bold shrink-0">
                ⏰
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300">
                    AGENDA LLAT TERKAIT
                  </span>
                  <span className="font-bold text-white">
                    {llatHal3Event.nama_kegiatan}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Batas Waktu Pengajuan: <strong>{llatCountdown.formattedDate}</strong> {llatHal3Event.jam_batas ? `pukul ${llatHal3Event.jam_batas} WIB` : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className={`px-3 py-1.5 rounded-xl font-black text-xs ${
                llatCountdown.isOverdue
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
                  : llatCountdown.isToday
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30 animate-pulse'
                    : 'bg-teal-500/20 text-teal-300 border border-teal-400/30'
              }`}>
                {llatCountdown.isOverdue
                  ? `⚠️ TERLEWAT ${Math.abs(llatCountdown.days)} HARI`
                  : llatCountdown.isToday
                    ? '🔴 HARI INI BATAS AKHIR'
                    : `⏳ SISA ${llatCountdown.days} HARI LAGI`}
              </span>

              {onNavigateTab && (
                <button
                  type="button"
                  onClick={() => onNavigateTab('monitoring-llat')}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-all"
                >
                  <span>Buka Kalender LLAT &rarr;</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* FILTER BAR UTAMA */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 flex-1">
            {/* TA */}
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                Tahun Anggaran
              </label>
              <select
                value={tahunAnggaran}
                onChange={(e) => setTahunAnggaran(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none"
              >
                <option value={2026}>TA 2026</option>
                <option value={2027}>TA 2027</option>
                <option value={2025}>TA 2025</option>
              </select>
            </div>

            {/* Periode */}
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                Periode Triwulan
              </label>
              <select
                value={periode}
                onChange={(e) => setPeriode(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none"
              >
                <option value="TW IV">TW IV (Akhir Tahun)</option>
                <option value="TW III">TW III</option>
                <option value="TW II">TW II</option>
                <option value="TW I">TW I</option>
                <option value="ALL">Semua Triwulan</option>
              </select>
            </div>

            {/* Status Kanwil */}
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                Status Kanwil
              </label>
              <select
                value={statusKanwilFilter}
                onChange={(e) => setStatusKanwilFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none"
              >
                <option value="ALL">Semua Status Kanwil</option>
                <option value="Belum Mengajukan">🔴 Belum Mengajukan</option>
                <option value="Sudah Mengajukan">🟢 Sudah Mengajukan</option>
              </select>
            </div>

            {/* Status Tindak Lanjut */}
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                Tindak Lanjut KPPN
              </label>
              <select
                value={statusTindakLanjutFilter}
                onChange={(e) => setStatusTindakLanjutFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none"
              >
                <option value="ALL">Semua Tindak Lanjut</option>
                <option value="Belum Ditindaklanjuti">🔴 Belum Ditindaklanjuti</option>
                <option value="Sudah Dihubungi">📞 Sudah Dihubungi</option>
                <option value="Menunggu Jawaban">⏳ Menunggu Jawaban</option>
                <option value="Akan Mengajukan">📤 Akan Mengajukan</option>
                <option value="Tidak Mengajukan">📝 Tidak Mengajukan</option>
                <option value="Hal III Sudah Sesuai">🟢 Hal III Sudah Sesuai</option>
                <option value="Selesai">✅ Selesai</option>
              </select>
            </div>
          </div>

          {/* Search Box */}
          <div className="w-full lg:w-72 space-y-1">
            <label className="block text-[10px] font-black uppercase text-slate-400">
              Pencarian Satker
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari kode / nama satker..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Reset Filter Button */}
        {(statusKanwilFilter !== 'ALL' || statusTindakLanjutFilter !== 'ALL' || keputusanFilter !== 'ALL' || searchQuery || activeViewTab !== 'SEMUA') && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-slate-500 font-medium">
              Menampilkan {filteredRecords.length} dari {records.length} satker
            </span>
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-teal-600 dark:text-teal-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Semua Filter</span>
            </button>
          </div>
        )}
      </div>

      {/* CARD STATISTIK UTAMA (8 KARTU MODERN & DINAMIS) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* 1. TOTAL SATKER */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
          <div className="text-[10px] uppercase font-bold text-slate-400">Total Satker</div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {stats.total}
          </div>
          <div className="text-[10px] text-slate-500 font-semibold truncate">
            KPPN Semarang I
          </div>
        </div>

        {/* 2. SUDAH MENGAJUKAN */}
        <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 shadow-2xs space-y-1">
          <div className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400">Sudah Mengajukan</div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {stats.sudahMengajukan}
          </div>
          <div className="text-[10px] text-emerald-700/80 dark:text-emerald-300 font-bold">
            {stats.percentPengajuan.toFixed(1)}% dari total
          </div>
        </div>

        {/* 3. BELUM MENGAJUKAN */}
        <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 shadow-2xs space-y-1">
          <div className="text-[10px] uppercase font-bold text-rose-700 dark:text-rose-400">Belum Mengajukan</div>
          <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400">
            {stats.belumMengajukan}
          </div>
          <div className="text-[10px] text-rose-700/80 dark:text-rose-300 font-bold">
            Data Kanwil
          </div>
        </div>

        {/* 4. SUDAH DIKONFIRMASI */}
        <div className="p-4 rounded-2xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 shadow-2xs space-y-1">
          <div className="text-[10px] uppercase font-bold text-teal-700 dark:text-teal-400">Sudah Dikonfirmasi</div>
          <div className="text-xl sm:text-2xl font-black text-teal-600 dark:text-teal-400">
            {stats.sudahDikonfirmasi}
          </div>
          <div className="text-[10px] text-teal-700/80 dark:text-teal-300 font-bold">
            Tindak lanjut KPPN
          </div>
        </div>

        {/* 5. BELUM DITINDAKLANJUTI */}
        <div className="p-4 rounded-2xl bg-red-50/80 dark:bg-red-950/40 border border-red-300 dark:border-red-800 shadow-2xs space-y-1 animate-pulse">
          <div className="text-[10px] uppercase font-bold text-red-800 dark:text-red-300 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping" />
            Perlu Tindak Lanjut
          </div>
          <div className="text-xl sm:text-2xl font-black text-red-600 dark:text-red-400">
            {stats.belumDitindaklanjuti}
          </div>
          <div className="text-[10px] text-red-700 dark:text-red-300 font-bold">
            Prioritas KPPN
          </div>
        </div>

        {/* 6. AKAN MENGAJUKAN */}
        <div className="p-4 rounded-2xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 shadow-2xs space-y-1">
          <div className="text-[10px] uppercase font-bold text-sky-700 dark:text-sky-400">Akan Mengajukan</div>
          <div className="text-xl sm:text-2xl font-black text-sky-600 dark:text-sky-400">
            {stats.akanMengajukan}
          </div>
          <div className="text-[10px] text-sky-700/80 dark:text-sky-300 font-bold">
            Komitmen satker
          </div>
        </div>

        {/* 7. TIDAK MENGAJUKAN */}
        <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 shadow-2xs space-y-1">
          <div className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400">Tidak Mengajukan</div>
          <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">
            {stats.tidakMengajukan}
          </div>
          <div className="text-[10px] text-amber-700/80 dark:text-amber-300 font-bold">
            Ada alasan/justifikasi
          </div>
        </div>

        {/* 8. HAL III SUDAH SESUAI */}
        <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 shadow-2xs space-y-1">
          <div className="text-[10px] uppercase font-bold text-indigo-700 dark:text-indigo-400">Hal III Sesuai</div>
          <div className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400">
            {stats.hal3SudahSesuai}
          </div>
          <div className="text-[10px] text-indigo-700/80 dark:text-indigo-300 font-bold">
            RPD telah optimal
          </div>
        </div>
      </div>

      {/* PROGRESS BAR MONITORING */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-teal-600 dark:text-teal-400">
              PROGRESS KINERJA MONITORING PENGAJUAN
            </span>
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 mt-0.5">
              Tingkat Pengajuan Revisi Hal III DIPA Kanwil
            </h3>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-lg font-black text-teal-600 dark:text-teal-400">
              {stats.sudahMengajukan} dari {stats.total} Satker
            </span>
            <span className="ml-2 text-xs font-bold text-slate-500">
              ({stats.percentPengajuan.toFixed(1)}%)
            </span>
          </div>
        </div>

        {/* Bar */}
        <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
          <div
            className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-700 shadow-xs"
            style={{ width: `${Math.min(100, stats.percentPengajuan)}%` }}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-1">
          <span>Sudah Mengajukan: <strong className="text-emerald-600">{stats.sudahMengajukan}</strong></span>
          <span>Akan Mengajukan: <strong className="text-sky-600">{stats.akanMengajukan}</strong></span>
          <span>Tidak Mengajukan / Sesuai: <strong className="text-amber-600">{stats.tidakMengajukan + stats.hal3SudahSesuai}</strong></span>
          <span>Belum Ada Tindak Lanjut: <strong className="text-rose-600">{stats.belumDitindaklanjuti}</strong></span>
        </div>
      </div>

      {/* VIEW TABS / QUICK FILTER PANELS (UX RESPONSIF CEPAT) */}
      <div className="flex flex-wrap gap-2 pt-1 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveViewTab('SEMUA')}
          className={`px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
            activeViewTab === 'SEMUA'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-md'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <span>Semua Satker ({stats.total})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveViewTab('PERLU_TL')}
          className={`px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
            activeViewTab === 'PERLU_TL'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 hover:bg-rose-100 border border-rose-200 dark:border-rose-800'
          }`}
        >
          <span>🚨 Perlu Tindak Lanjut ({stats.belumDitindaklanjuti})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveViewTab('MENUNGGU')}
          className={`px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
            activeViewTab === 'MENUNGGU'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 hover:bg-amber-100 border border-amber-200 dark:border-amber-800'
          }`}
        >
          <span>⏳ Menunggu Jawaban ({stats.menungguJawaban})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveViewTab('AKAN')}
          className={`px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
            activeViewTab === 'AKAN'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
              : 'bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-200 hover:bg-sky-100 border border-sky-200 dark:border-sky-800'
          }`}
        >
          <span>📤 Akan Mengajukan ({stats.akanMengajukan})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveViewTab('TIDAK_MENGAJUKAN')}
          className={`px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
            activeViewTab === 'TIDAK_MENGAJUKAN'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-200 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800'
          }`}
        >
          <span>📝 Tidak Mengajukan / Sesuai ({stats.tidakMengajukan + stats.hal3SudahSesuai})</span>
        </button>
      </div>

      {/* PANEL ANALISIS ALASAN TIDAK MENGAJUKAN (JIKA ADA DATA) */}
      {Object.keys(distribusiAlasan).length > 0 && (
        <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <PieChart className="w-4 h-4 text-teal-600" />
              Distribusi Alasan Satker Tidak Mengajukan Revisi
            </h4>
            <span className="text-[11px] text-slate-500 font-bold">
              Total {Object.values(distribusiAlasan).reduce((a, b) => a + b, 0)} Satker Terkonfirmasi
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {Object.entries(distribusiAlasan).map(([alasan, count], i) => (
              <div 
                key={i} 
                className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-3 text-xs"
              >
                <div className="truncate flex-1">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate" title={alasan}>
                    {alasan}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-black text-teal-600 dark:text-teal-400">{count}</span>
                  <span className="text-[10px] text-slate-400">Satker</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TABEL UTAMA MONITORING HAL III DIPA */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs overflow-hidden space-y-2">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-teal-600" />
              Tabel Monitoring & Tindak Lanjut Satker
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Daftar seluruh satuan kerja dengan status monitoring Kanwil dan pembaruan internal KPPN.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">Tampil:</span>
            <strong className="text-slate-800 dark:text-slate-200">{filteredRecords.length} Satker</strong>
          </div>
        </div>

        {/* Empty State */}
        {filteredRecords.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto text-2xl font-black">
              📑
            </div>
            <h4 className="text-sm font-black text-slate-700 dark:text-slate-200">
              Belum Ada Data Monitoring yang Sesuai
            </h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Tidak ditemukan data untuk kombinasi filter ini atau belum ada data yang diimpor.
            </p>
            {records.length === 0 && (
              <div className="pt-2 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={handleLoadSampleBaseline}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-md cursor-pointer transition-all"
                >
                  Muat Data Sampel 125 Satker
                </button>
                {isAdminAuthenticated && (
                  <button
                    type="button"
                    onClick={() => setIsUploadOpen(true)}
                    className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 cursor-pointer transition-all"
                  >
                    Upload File Excel
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 text-[11px] font-black uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4 text-center w-12">No</th>
                  <th className="py-3 px-4 w-28">Kode Satker</th>
                  <th className="py-3 px-4 min-w-[200px]">Nama Satker</th>
                  <th className="py-3 px-4 text-center w-36">Status Kanwil</th>
                  <th className="py-3 px-4 text-center w-40">Status Tindak Lanjut</th>
                  <th className="py-3 px-4 text-center w-36">Keputusan</th>
                  <th className="py-3 px-4 min-w-[180px]">Alasan / Keterangan</th>
                  <th className="py-3 px-4 text-center w-28">Tgl Konfirm</th>
                  <th className="py-3 px-4 w-32">Petugas</th>
                  <th className="py-3 px-4 text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredRecords.map((item, idx) => {
                  const tl = item.tindak_lanjut;
                  const isBelumMengajukan = item.status_kanwil === 'Belum Mengajukan';
                  const isBelumDitindaklanjuti = !tl || tl.status_tindak_lanjut === 'Belum Ditindaklanjuti';
                  const isPriority = isBelumMengajukan && isBelumDitindaklanjuti;

                  // Status Kanwil Badge
                  const statusKanwilBadge = isBelumMengajukan ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      Belum Mengajukan
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Sudah Mengajukan
                    </span>
                  );

                  // Status Tindak Lanjut Badge
                  let tlBadge = (
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      Belum Ditindaklanjuti
                    </span>
                  );

                  if (tl?.status_tindak_lanjut === 'Selesai') {
                    tlBadge = (
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        ✅ Selesai
                      </span>
                    );
                  } else if (tl?.status_tindak_lanjut === 'Akan Mengajukan') {
                    tlBadge = (
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-300">
                        📤 Akan Mengajukan
                      </span>
                    );
                  } else if (tl?.status_tindak_lanjut === 'Menunggu Jawaban') {
                    tlBadge = (
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                        ⏳ Menunggu Jawaban
                      </span>
                    );
                  } else if (tl?.status_tindak_lanjut === 'Tidak Mengajukan') {
                    tlBadge = (
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                        📝 Tidak Mengajukan
                      </span>
                    );
                  } else if (tl?.status_tindak_lanjut === 'Hal III Sudah Sesuai') {
                    tlBadge = (
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-300">
                        🟢 Hal III Sesuai
                      </span>
                    );
                  } else if (tl?.status_tindak_lanjut === 'Sudah Dihubungi') {
                    tlBadge = (
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-300">
                        📞 Sudah Dihubungi
                      </span>
                    );
                  }

                  return (
                    <tr 
                      key={item.id || idx}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                        isPriority ? 'bg-rose-50/20 dark:bg-rose-950/10' : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-center font-mono text-slate-400 text-[11px]">
                        {idx + 1}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          {isPriority && (
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" title="Prioritas: Belum Mengajukan & Belum Ditindaklanjuti" />
                          )}
                          <span className="font-mono font-bold text-teal-700 dark:text-teal-400">
                            {item.kode_satker}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800 dark:text-slate-100">
                          {item.nama_satker || item.nama_satker_source}
                        </div>
                        {item.is_in_latest_upload === false && (
                          <span className="text-[10px] text-amber-600 font-semibold block">
                            ⚠ Tidak terdapat pada upload terbaru
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {statusKanwilBadge}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {tlBadge}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {tl?.keputusan_satker ? (
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            {tl.keputusan_satker}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      <td className="py-3 px-4 max-w-xs">
                        {tl?.alasan_kode ? (
                          <div className="space-y-0.5">
                            <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 block truncate" title={tl.alasan_kode}>
                              {tl.alasan_kode}
                            </span>
                            {tl.alasan_detail && (
                              <span className="text-[10px] text-slate-500 block truncate" title={tl.alasan_detail}>
                                {tl.alasan_detail}
                              </span>
                            )}
                          </div>
                        ) : tl?.catatan_kppn ? (
                          <span className="text-[11px] text-slate-600 dark:text-slate-400 italic truncate block" title={tl.catatan_kppn}>
                            &quot;{tl.catatan_kppn}&quot;
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center font-mono text-[11px] text-slate-500">
                        {tl?.tanggal_konfirmasi || '-'}
                      </td>

                      <td className="py-3 px-4 text-[11px] text-slate-600 dark:text-slate-400 truncate max-w-[120px]">
                        {tl?.petugas_nama || '-'}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRecord(item);
                            setIsDetailOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-[11px] shadow-xs cursor-pointer transition-all flex items-center gap-1 mx-auto"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Detail</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DETAIL MODAL */}
      {isDetailOpen && selectedRecord && (
        <Hal3DipaDetailModal
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false);
            setSelectedRecord(null);
          }}
          record={selectedRecord}
          onSaveTindakLanjut={handleSaveTindakLanjut}
          currentUser={currentUser}
        />
      )}

      {/* UPLOAD MODAL */}
      {isUploadOpen && (
        <Hal3DipaUploadModal
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          existingRecords={records}
          onImportComplete={handleImportComplete}
          currentUser={currentUser}
          defaultTahunAnggaran={tahunAnggaran}
          defaultPeriode={periode === 'ALL' ? 'TW IV' : periode}
        />
      )}

      {/* RIWAYAT UPLOAD MODAL */}
      {isHistoryOpen && (
        <Hal3DipaHistoryModal
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          batches={batches}
        />
      )}

      {/* EXPORT PDF MODAL */}
      {isPdfModalOpen && (
        <Hal3DipaExportPdfModal
          isOpen={isPdfModalOpen}
          onClose={() => setIsPdfModalOpen(false)}
          records={filteredRecords}
          tahunAnggaran={tahunAnggaran}
          periode={periode}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};
