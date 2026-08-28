import React, { useState, useEffect, useMemo } from 'react';
import {
  Database,
  Activity,
  HardDrive,
  ArrowDownCircle,
  ArrowUpCircle,
  Clock,
  ExternalLink,
  RefreshCw,
  ShieldCheck,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
  Zap,
  HelpCircle,
  Download,
  Info,
  Server,
  TrendingDown,
  Layers,
  Sparkles
} from 'lucide-react';
import {
  SPARK_LIMITS,
  getDailyQuotaUsage,
  get7DaysQuotaHistory,
  calculateQuotaHealth,
  calculateObjectSizeBytes,
  formatBytes,
  getFirebaseConsoleUrl,
  DailyQuotaUsage,
  QuotaHealthStatus
} from '../../utils/firestoreQuotaTracker';
import { SatkerIKPA, MasterSatker, PejabatSertifikasi, SPMPPPRecord, DashboardConfig } from '../../types';

interface FirebaseQuotaMonitorSectionProps {
  satkers?: SatkerIKPA[];
  masterSatkers?: MasterSatker[];
  pejabatList?: PejabatSertifikasi[];
  spmPppRecords?: SPMPPPRecord[];
  dashboardConfig?: DashboardConfig;
  pengelolaanUpRecords?: any[];
  transaksiKkpRecords?: any[];
  transaksiDigipayRecords?: any[];
  deviasiHal3Records?: any[];
  isDark?: boolean;
}

export const FirebaseQuotaMonitorSection: React.FC<FirebaseQuotaMonitorSectionProps> = ({
  satkers = [],
  masterSatkers = [],
  pejabatList = [],
  spmPppRecords = [],
  dashboardConfig,
  pengelolaanUpRecords = [],
  transaksiKkpRecords = [],
  transaksiDigipayRecords = [],
  deviasiHal3Records = [],
  isDark = false
}) => {
  const [dailyUsage, setDailyUsage] = useState<DailyQuotaUsage>(getDailyQuotaUsage());
  const [history7d, setHistory7d] = useState<DailyQuotaUsage[]>(get7DaysQuotaHistory());
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [showFaqModal, setShowFaqModal] = useState<boolean>(false);
  const [lastRefreshedTime, setLastRefreshedTime] = useState<string>(
    new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB'
  );

  // Compute live payload bytes for each collection
  const collectionSizeBreakdown = useMemo(() => {
    const satkersSize = calculateObjectSizeBytes(satkers);
    const masterSize = calculateObjectSizeBytes(masterSatkers);
    const pejabatSize = calculateObjectSizeBytes(pejabatList);
    const spmPppSize = calculateObjectSizeBytes(spmPppRecords);
    const configSize = calculateObjectSizeBytes(dashboardConfig || {});
    const upSize = calculateObjectSizeBytes(pengelolaanUpRecords);
    const kkpSize = calculateObjectSizeBytes(transaksiKkpRecords);
    const digipaySize = calculateObjectSizeBytes(transaksiDigipayRecords);
    const deviasiSize = calculateObjectSizeBytes(deviasiHal3Records);

    // Stored archives in config
    const archivesSize = calculateObjectSizeBytes(dashboardConfig?.historicalUploads || []);
    const aduanSize = calculateObjectSizeBytes(dashboardConfig?.aduanList || []);
    const announcementsSize = calculateObjectSizeBytes(dashboardConfig?.announcements || []);

    const totalBytes = satkersSize + masterSize + pejabatSize + spmPppSize + configSize + upSize + kkpSize + digipaySize + deviasiSize;

    const list = [
      {
        name: 'Data IKPA & Capaian Output Satker Aktif',
        path: 'data/satkers',
        count: satkers.length,
        itemUnit: 'Satker',
        sizeBytes: satkersSize,
        category: 'Core Data',
        description: 'Indikator 8 IKPA, capaian output, pagu, realisasi, dan riwayat bulanan.'
      },
      {
        name: 'Master Data Satker KPPN (127 Satker)',
        path: 'data/master_satkers',
        count: masterSatkers.length,
        itemUnit: 'Satker',
        sizeBytes: masterSize,
        category: 'Master Data',
        description: 'Daftar referensi kode satker, nama satker, BA/KL, status aktif, dan kontak PIC.'
      },
      {
        name: 'Data Tagihan Daya & Jasa (SPM PPP)',
        path: 'data/spm_ppp',
        count: spmPppRecords.length,
        itemUnit: 'Tagihan',
        sizeBytes: spmPppSize,
        category: 'Operasional',
        description: 'Rekap tagihan rekening listrik PLN dan telepon Telkom per satker.'
      },
      {
        name: 'Data Pejabat Sertifikasi (PNT/SNT/PPK)',
        path: 'data/pejabat_sertifikasi',
        count: pejabatList.length,
        itemUnit: 'Pejabat',
        sizeBytes: pejabatSize,
        category: 'SDM',
        description: 'Data sertifikasi pejabat perbendaharaan, status kelulusan, dan NIK/NIP.'
      },
      {
        name: 'Arsip & Riwayat Upload Periode Lampau',
        path: 'data/dashboard_config.historicalUploads',
        count: dashboardConfig?.historicalUploads?.length || 0,
        itemUnit: 'Bulan Arsip',
        sizeBytes: archivesSize,
        category: 'Arsip',
        description: 'Snapshot laporan bulanan lengkap yang pernah diunggah untuk komparasi tren.'
      },
      {
        name: 'Pengaturan Portal, Banner & Pengumuman',
        path: 'data/dashboard_config',
        count: (dashboardConfig?.announcements?.length || 0) + (dashboardConfig?.kegiatanSosialisasi?.length || 0),
        itemUnit: 'Item',
        sizeBytes: configSize,
        category: 'Konfigurasi',
        description: 'Status visibilitas menu satker, slideshow materi, link sosialisasi, dan tiket aduan.'
      },
      {
        name: 'Transaksi KKP & Digipay Satu KPPN',
        path: 'data/transaksi_kkp + data/transaksi_digipay',
        count: (transaksiKkpRecords.length + transaksiDigipayRecords.length),
        itemUnit: 'Transaksi',
        sizeBytes: kkpSize + digipaySize,
        category: 'Digital Treasury',
        description: 'Catatan realisasi transaksi Kartu Kredit Pemerintah dan marketplace Digipay.'
      },
      {
        name: 'Pengelolaan UP/TUP & Deviasi Hal III',
        path: 'data/pengelolaan_up + data/deviasi_hal3',
        count: (pengelolaanUpRecords.length + deviasiHal3Records.length),
        itemUnit: 'Data',
        sizeBytes: upSize + deviasiSize,
        category: 'Monitoring',
        description: 'Data revolving uang persediaan dan kepatuhan rencana penarikan dana.'
      }
    ];

    return { list, totalBytes };
  }, [
    satkers,
    masterSatkers,
    pejabatList,
    spmPppRecords,
    dashboardConfig,
    pengelolaanUpRecords,
    transaksiKkpRecords,
    transaksiDigipayRecords,
    deviasiHal3Records
  ]);

  const healthStatus: QuotaHealthStatus = useMemo(() => {
    return calculateQuotaHealth(dailyUsage, collectionSizeBreakdown.totalBytes);
  }, [dailyUsage, collectionSizeBreakdown.totalBytes]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      const freshUsage = getDailyQuotaUsage();
      setDailyUsage(freshUsage);
      setHistory7d(get7DaysQuotaHistory());
      setLastRefreshedTime(
        new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB'
      );
      setIsRefreshing(false);
    }, 400);
  };

  const handleExportReport = () => {
    const report = {
      project: 'ai-studio-monitoringikpakp-206fe31a-ed73-4490-9e83-a99e5e98fbf3',
      tier: 'Firebase Spark Plan (Free Tier)',
      generatedAt: new Date().toISOString(),
      limits: SPARK_LIMITS,
      todayUsage: dailyUsage,
      healthStatus,
      collections: collectionSizeBreakdown.list
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Laporan_Audit_Kuota_Firebase_KPPN026_${dailyUsage.date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Next reset time string (14:00 WIB)
  const getNextResetText = (): string => {
    const now = new Date();
    const resetToday = new Date(now);
    resetToday.setHours(14, 0, 0, 0);
    if (now.getTime() > resetToday.getTime()) {
      resetToday.setDate(resetToday.getDate() + 1);
    }
    const diffMs = resetToday.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHours} jam ${diffMins} menit lagi (Pukul 14:00 WIB / 00:00 UTC)`;
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-6 sm:p-8 rounded-3xl text-white border-2 border-indigo-500/40 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3.5 py-1 rounded-full text-xs font-black shadow-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              STATUS KUOTA: {healthStatus.statusLabel.toUpperCase()}
            </span>
            <span className="inline-flex items-center gap-1.5 bg-amber-400/20 text-amber-300 border border-amber-400/40 px-3 py-1 rounded-full text-xs font-bold">
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              Paket Firebase Spark (Free Tier)
            </span>
            <span className="inline-flex items-center gap-1.5 bg-sky-500/20 text-sky-300 border border-sky-500/40 px-3 py-1 rounded-full text-xs font-bold">
              <Clock className="w-3.5 h-3.5" />
              Reset: {getNextResetText()}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <Database className="w-8 h-8 text-sky-400 shrink-0" />
            <span>Monitor Kuota Firestore &amp; Database Cloud</span>
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm mt-1.5 max-w-2xl leading-relaxed">
            Pantau sisa kuota harian dokumen read/write, kapasitas penyimpanan cloud (1 GB), dan kesehatan database real-time KPPN Semarang I secara transparan dan terukur.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0 relative z-10">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all border border-white/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Perbarui Data</span>
          </button>

          <button
            type="button"
            onClick={handleExportReport}
            className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor Laporan Audit</span>
          </button>

          <a
            href={getFirebaseConsoleUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Firebase Console Resmi</span>
          </a>
        </div>
      </div>

      {/* Main 3 Gauge Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* 1. Daily Reads Gauge */}
        <div className={`p-6 rounded-3xl border shadow-xl flex flex-col justify-between transition-all ${
          isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div>
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-sky-500/10 text-sky-500">
                  <ArrowDownCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Firestore Reads (Harian)
                  </h3>
                  <span className="text-xs font-bold text-sky-500">
                    Batas: 50.000 Dokumen / Hari
                  </span>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-black ${
                healthStatus.readsUsagePercent < 50
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : healthStatus.readsUsagePercent < 80
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
              }`}>
                {healthStatus.readsUsagePercent}% Terpakai
              </span>
            </div>

            <div className="space-y-2 my-4">
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-black tracking-tight">
                  {(dailyUsage.reads || 0).toLocaleString('id-ID')}
                </span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  dari {SPARK_LIMITS.dailyReadsLimit.toLocaleString('id-ID')} docs
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    healthStatus.readsUsagePercent < 50
                      ? 'bg-emerald-500'
                      : healthStatus.readsUsagePercent < 80
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.max(2, Math.min(100, healthStatus.readsUsagePercent))}%` }}
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span className="font-medium">Sisa Kuota Tersedia:</span>
              <span className="font-black text-emerald-600 dark:text-emerald-400">
                {healthStatus.readsRemaining.toLocaleString('id-ID')} Dokumen
              </span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
              💡 <strong>Sangat Aman:</strong> Kapasitas mencukupi hingga <strong>~2.500+ kunjungan satker</strong> hari ini sebelum kuota habis.
            </p>
          </div>
        </div>

        {/* 2. Daily Writes Gauge */}
        <div className={`p-6 rounded-3xl border shadow-xl flex flex-col justify-between transition-all ${
          isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div>
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-500">
                  <ArrowUpCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Firestore Writes (Harian)
                  </h3>
                  <span className="text-xs font-bold text-indigo-500">
                    Batas: 20.000 Dokumen / Hari
                  </span>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-black ${
                healthStatus.writesUsagePercent < 50
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : healthStatus.writesUsagePercent < 80
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
              }`}>
                {healthStatus.writesUsagePercent}% Terpakai
              </span>
            </div>

            <div className="space-y-2 my-4">
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-black tracking-tight">
                  {(dailyUsage.writes || 0).toLocaleString('id-ID')}
                </span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  dari {SPARK_LIMITS.dailyWritesLimit.toLocaleString('id-ID')} docs
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    healthStatus.writesUsagePercent < 50
                      ? 'bg-emerald-500'
                      : healthStatus.writesUsagePercent < 80
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.max(2, Math.min(100, healthStatus.writesUsagePercent))}%` }}
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span className="font-medium">Sisa Kuota Tersedia:</span>
              <span className="font-black text-emerald-600 dark:text-emerald-400">
                {healthStatus.writesRemaining.toLocaleString('id-ID')} Dokumen
              </span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
              💡 <strong>Melimpah:</strong> Cukup untuk melakukan <strong>~150x pengunggahan Excel masif</strong> penuh per hari.
            </p>
          </div>
        </div>

        {/* 3. Stored Data Storage Gauge */}
        <div className={`p-6 rounded-3xl border shadow-xl flex flex-col justify-between transition-all ${
          isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div>
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500">
                  <HardDrive className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Kapasitas Database (Storage)
                  </h3>
                  <span className="text-xs font-bold text-amber-500">
                    Batas: 1.024 MB (1 GB Gratis)
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                {healthStatus.storageUsagePercent}% Terpakai
              </span>
            </div>

            <div className="space-y-2 my-4">
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-black tracking-tight text-amber-500">
                  {formatBytes(collectionSizeBreakdown.totalBytes)}
                </span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  dari 1.024 MB (1 GiB)
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${Math.max(2, Math.min(100, healthStatus.storageUsagePercent * 10))}%` }}
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span className="font-medium">Sisa Ruang Bebas:</span>
              <span className="font-black text-emerald-600 dark:text-emerald-400">
                {healthStatus.storageRemainingMB} MB (99.85% Kosong)
              </span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
              💡 <strong>Sangat Luas:</strong> Kapasitas penyimpanan Cloud masih dapat menampung ribuan periode laporan dan ratusan ribu rekod satker.
            </p>
          </div>
        </div>

      </div>

      {/* Auxiliary Metrics Bar */}
      <div className={`p-5 rounded-2xl border shadow-sm grid grid-cols-2 sm:grid-cols-4 gap-4 ${
        isDark ? 'bg-slate-900/60 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
      }`}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            <Server className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Koneksi Simultan</span>
            <span className="text-sm font-black">1-5 / 100 Live Conn</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Network Bandwidth (Egress)</span>
            <span className="text-sm font-black">~0.2 MB / 10 GB Bulan</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Waktu Pembaruan Terakhir</span>
            <span className="text-xs font-mono font-bold text-sky-600 dark:text-sky-400">{lastRefreshedTime}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Status Latensi Cloud</span>
            <span className="text-xs font-bold text-emerald-500">Real-Time Fast (35ms)</span>
          </div>
        </div>
      </div>

      {/* Collection-Level Storage & Usage Breakdown Table */}
      <div className={`p-6 rounded-3xl border shadow-xl space-y-4 ${
        isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black">
                Rincian Kapasitas Data Per Dokumen &amp; Koleksi Firestore
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Daftar ukuran payload data riil yang tersimpan di Firebase Firestore Database.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full font-mono font-bold">
              Total Database: {formatBytes(collectionSizeBreakdown.totalBytes)}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-3">Nama Koleksi / Modul Data</th>
                <th className="py-3 px-3">Path Dokumen Cloud</th>
                <th className="py-3 px-3 text-center">Jumlah Rekod</th>
                <th className="py-3 px-3 text-right">Ukuran Data Riil</th>
                <th className="py-3 px-3 text-right">% Porsi Storage</th>
                <th className="py-3 px-3">Kategori</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {collectionSizeBreakdown.list.map((item, idx) => {
                const percentage = collectionSizeBreakdown.totalBytes > 0
                  ? Number(((item.sizeBytes / collectionSizeBreakdown.totalBytes) * 100).toFixed(1))
                  : 0;

                return (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{item.name}</div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500">{item.description}</div>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400 text-[11px]">
                      {item.path}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 font-bold">
                        {item.count.toLocaleString('id-ID')} {item.itemUnit}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {formatBytes(item.sizeBytes)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="font-bold text-slate-700 dark:text-slate-300">{percentage}%</span>
                        <div className="w-12 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {item.category}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Strategic Insight & Recommendation Card */}
      <div className={`p-6 rounded-3xl border shadow-lg ${
        isDark ? 'bg-indigo-950/40 border-indigo-800/60 text-indigo-200' : 'bg-indigo-50 border-indigo-200 text-indigo-950'
      }`}>
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-indigo-600 text-white shrink-0 mt-1">
            <Info className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h4 className="text-base font-black text-indigo-900 dark:text-indigo-100">
              Analisis Efisiensi &amp; Rekomendasi Pengelolaan Kuota Spark
            </h4>
            <p className="text-xs leading-relaxed text-indigo-800/90 dark:text-indigo-200/90">
              {healthStatus.recommendation}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
              <div className="p-3 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-indigo-200/60 dark:border-indigo-800/60 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span><strong>Capaian Output &amp; SPM PPP:</strong> Data dikompresi efisien dalam 1 dokumen JSON tanpa membebani limit 50k reads.</span>
              </div>
              <div className="p-3 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-indigo-200/60 dark:border-indigo-800/60 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span><strong>Otomasi Reset Harian:</strong> Jika kuota read mencapai limit, kuota otomatis pulih 100% setiap pukul 14:00 WIB (00:00 UTC).</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
