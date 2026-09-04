import React, { useState, useMemo, useEffect } from 'react';
import {
  MessageSquare,
  Copy,
  ExternalLink,
  Check,
  RotateCcw,
  Sparkles,
  Search,
  Users,
  Building2,
  Calendar,
  Clock,
  AlertTriangle,
  FileText,
  Award,
  Download,
  CheckCircle2,
  ListChecks,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Sliders,
  Send,
  Wand2,
  Info,
  Trophy,
  Medal,
  CreditCard,
  ShoppingBag,
  Flame,
  CheckSquare,
  Square,
  ArrowRight,
  Edit3,
  TrendingUp,
  Percent,
  Wallet,
  Link2,
  Zap,
  BarChart3,
  PhoneOff,
  PhoneCall
} from 'lucide-react';
import {
  SatkerIKPA,
  PejabatSertifikasi,
  DashboardConfig,
  MasterSatker,
  PengelolaanUPRecord,
  TransaksiKKPRecord,
  DigipayRecord,
  DeviasiHal3Record,
  SPMPPPRecord
} from '../../types';
import { evaluateUPRecordStatus } from '../../data/initialUPData';
import { generateGeminiContent, getClientStoredApiKey } from '../../services/geminiService';

export type GroupBroadcastCategory = 
  | 'DIGIPAY_KKP'
  | 'CAPUT' 
  | 'UP_TUP' 
  | 'SPM_PPP'
  | 'DEVIASI_HAL3'
  | 'KONTAK_KOSONG'
  | 'IKPA_PERHATIAN' 
  | 'SERTIFIKASI' 
  | 'KOMPILASI'
  | 'REKONSILIASI' 
  | 'CUSTOM';

export interface BroadcastGroupSectionProps {
  satkers: SatkerIKPA[];
  masterSatkers?: MasterSatker[];
  pejabatList?: PejabatSertifikasi[];
  pengelolaanUpRecords?: PengelolaanUPRecord[];
  transaksiKkpRecords?: TransaksiKKPRecord[];
  transaksiDigipayRecords?: DigipayRecord[];
  deviasiHal3Records?: DeviasiHal3Record[];
  spmPppRecords?: SPMPPPRecord[];
  dashboardConfig: DashboardConfig;
  onNavigateToJarkomPribadi?: () => void;
  isDark?: boolean;
  showToast?: (opts: { type: 'success' | 'error' | 'warning' | 'info'; title: string; message: string }) => void;
}

export const BroadcastGroupSection: React.FC<BroadcastGroupSectionProps> = ({
  satkers,
  masterSatkers = [],
  pejabatList = [],
  pengelolaanUpRecords = [],
  transaksiKkpRecords = [],
  transaksiDigipayRecords = [],
  deviasiHal3Records = [],
  spmPppRecords = [],
  dashboardConfig,
  onNavigateToJarkomPribadi,
  isDark = false,
  showToast
}) => {
  // Category Tab - Default to DIGIPAY_KKP or CAPUT as requested
  const [activeCategory, setActiveCategory] = useState<GroupBroadcastCategory>('DIGIPAY_KKP');

  // General Header & Time Config
  const [namaKppn, setNamaKppn] = useState<string>(() => {
    return dashboardConfig.namaKppn || 'KPPN Semarang I';
  });
  
  // Waktu Monitoring (contoh: "3 September 2026 pukul 14.20 WIB")
  const [waktuMonitoring, setWaktuMonitoring] = useState<string>('3 September 2026 pukul 14.20 WIB');
  const [periodeBulan, setPeriodeBulan] = useState<string>('Agustus 2026');
  const [batasWaktu, setBatasWaktu] = useState<string>('7 September 2026');
  const [periodeTriwulanSertifikasi, setPeriodeTriwulanSertifikasi] = useState<string>('Triwulan IV Tahun 2026');

  // Digipay & KKP Config
  const [digipayKkpMode, setDigipayKkpMode] = useState<'GABUNGAN' | 'LEADERBOARD' | 'BELUM_TRANSAKSI'>('GABUNGAN');
  const [topRankCount, setTopRankCount] = useState<number>(3); // 3, 5, 10
  const [includeKkpNote, setIncludeKkpNote] = useState<boolean>(true);
  const [selectedBelumDigipayKkpIds, setSelectedBelumDigipayKkpIds] = useState<string[]>([]);

  // SI-CAPUT & Options
  const [includeSiCaputGuide, setIncludeSiCaputGuide] = useState<boolean>(true);
  const [includePcroWarning, setIncludePcroWarning] = useState<boolean>(true);
  const [linkSiCaput, setLinkSiCaput] = useState<string>('s.kemenkeu.go.id/Caput156');
  const [includePplNote, setIncludePplNote] = useState<boolean>(true);
  const [includeSimaspatenAlert, setIncludeSimaspatenAlert] = useState<boolean>(true);

  // SPM PPP (Tagihan Daya & Jasa Belum Mengajukan) Options
  const [selectedSpmPppSatkerIds, setSelectedSpmPppSatkerIds] = useState<string[]>([]);
  const [includeSpmPppWarning, setIncludeSpmPppWarning] = useState<boolean>(true);

  // Deviasi Hal III DIPA Options
  const [selectedDeviasiSatkerIds, setSelectedDeviasiSatkerIds] = useState<string[]>([]);
  const [includeDeviasiJenisBelanja, setIncludeDeviasiJenisBelanja] = useState<boolean>(true);
  const [includeDeviasiPanduan, setIncludeDeviasiPanduan] = useState<boolean>(true);

  // Satker Belum Isi Nomor Handphone / PIC Options
  const [selectedKontakKosongSatkerIds, setSelectedKontakKosongSatkerIds] = useState<string[]>([]);
  const [kontakFilterMode, setKontakFilterMode] = useState<'ALL' | 'PIC_KOSONG' | 'PEJABAT_KOSONG'>('ALL');
  const [includePortalSatkerLink, setIncludePortalSatkerLink] = useState<boolean>(true);

  // Search & Filter Satker / Pejabat
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Selected IDs for Caput
  const [selectedCaputSatkerIds, setSelectedCaputSatkerIds] = useState<string[]>([]);
  // Selected IDs for Sertifikasi
  const [selectedSertifikasiPejabatIds, setSelectedSertifikasiPejabatIds] = useState<string[]>([]);
  // Selected IDs for IKPA Perhatian
  const [selectedIkpaSatkerIds, setSelectedIkpaSatkerIds] = useState<string[]>([]);
  // Selected IDs for UP/TUP
  const [selectedUpSatkerIds, setSelectedUpSatkerIds] = useState<string[]>([]);

  // Manual edited text override (null if auto-synced)
  const [manualText, setManualText] = useState<string | null>(null);
  const [isManualEditMode, setIsManualEditMode] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // AI Polish modal state
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [aiTone, setAiTone] = useState<'tegas' | 'formal' | 'ringkas' | 'apresiatif'>('apresiatif');
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);
  const [aiPreview, setAiPreview] = useState<string>('');

  // Helper currency formatting
  const formatRupiah = (val: number): string => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const formatRupiahShort = (val: number): string => {
    if (val >= 1_000_000_000) {
      return `Rp ${(val / 1_000_000_000).toFixed(2).replace(/\.?0+$/, '')} M`;
    }
    if (val >= 1_000_000) {
      return `Rp ${(val / 1_000_000).toFixed(1).replace(/\.?0+$/, '')} Jt`;
    }
    return formatRupiah(val);
  };

  // -------------------------------------------------------------
  // 1. DIGIPAY SATU & KKP LEADERBOARDS & CANDIDATES
  // -------------------------------------------------------------
  const digipayLeaderboard = useMemo(() => {
    if (transaksiDigipayRecords && transaksiDigipayRecords.length > 0) {
      const map = new Map<string, { kodeSatker: string; namaSatker: string; count: number; nominal: number }>();
      transaksiDigipayRecords.forEach((r) => {
        const kd = r.kodeSatker?.trim();
        if (!kd) return;
        const current = map.get(kd) || { kodeSatker: kd, namaSatker: r.namaSatker || kd, count: 0, nominal: 0 };
        current.count += 1;
        current.nominal += Number(r.nominalTransaksi) || 0;
        map.set(kd, current);
      });
      const sorted = Array.from(map.values()).sort((a, b) => b.nominal - a.nominal || b.count - a.count);
      return sorted;
    }
    // Fallback from buletinConfig or realistic preset
    const preset = dashboardConfig.buletinConfig?.leaderboardDigipayKkp?.topDigipaySatker;
    if (preset && preset.length > 0) {
      return preset.map((p, idx) => ({
        kodeSatker: `6${idx}8921`,
        namaSatker: p.nama,
        count: p.transaksi,
        nominal: p.nominal
      }));
    }
    return [
      { kodeSatker: '411234', namaSatker: 'Politeknik Ilmu Pelayaran Semarang', count: 248, nominal: 890000000 },
      { kodeSatker: '018231', namaSatker: 'BPS Provinsi Jawa Tengah', count: 185, nominal: 620000000 },
      { kodeSatker: '005432', namaSatker: 'Pengadilan Tinggi Agama Semarang', count: 142, nominal: 450000000 },
      { kodeSatker: '024123', namaSatker: 'Balai Besar POM di Semarang', count: 110, nominal: 380000000 },
      { kodeSatker: '015678', namaSatker: 'Kanwil Kemenag Prov. Jateng', count: 95, nominal: 310000000 },
      { kodeSatker: '060123', namaSatker: 'Polda Jawa Tengah Terpadu', count: 88, nominal: 290000000 }
    ];
  }, [transaksiDigipayRecords, dashboardConfig]);

  const kkpLeaderboard = useMemo(() => {
    if (transaksiKkpRecords && transaksiKkpRecords.length > 0) {
      const map = new Map<string, { kodeSatker: string; namaSatker: string; count: number; nominal: number }>();
      transaksiKkpRecords.forEach((r) => {
        const kd = r.kodeSatker?.trim();
        if (!kd) return;
        const current = map.get(kd) || { kodeSatker: kd, namaSatker: r.namaSatker || kd, count: 0, nominal: 0 };
        current.count += Number(r.jumlahTransaksi) || 1;
        current.nominal += Number(r.totalNominal) || 0;
        map.set(kd, current);
      });
      const sorted = Array.from(map.values()).sort((a, b) => b.nominal - a.nominal || b.count - a.count);
      return sorted;
    }
    // Fallback from buletinConfig or realistic preset
    const preset = dashboardConfig.buletinConfig?.leaderboardDigipayKkp?.topKkpSatker;
    if (preset && preset.length > 0) {
      return preset.map((p, idx) => ({
        kodeSatker: `5${idx}4312`,
        namaSatker: p.nama,
        count: p.transaksi,
        nominal: p.nominal
      }));
    }
    return [
      { kodeSatker: '342110', namaSatker: 'Kodam IV/Diponegoro (Kesdam)', count: 420, nominal: 2450000000 },
      { kodeSatker: '412890', namaSatker: 'Politeknik Kesehatan Kemenkes Semarang', count: 310, nominal: 1820000000 },
      { kodeSatker: '015678', namaSatker: 'Kanwil Kemenag Prov. Jateng', count: 290, nominal: 1540000000 },
      { kodeSatker: '060123', namaSatker: 'Polda Jawa Tengah Terpadu', count: 220, nominal: 1250000000 },
      { kodeSatker: '004567', namaSatker: 'Kejaksaan Tinggi Jawa Tengah', count: 140, nominal: 890000000 }
    ];
  }, [transaksiKkpRecords, dashboardConfig]);

  // Satker yang belum / nihil bertransaksi
  const satkerBelumDigipayKkpList = useMemo(() => {
    const activeDigipayKodes = new Set(digipayLeaderboard.map((d) => d.kodeSatker));
    const activeKkpKodes = new Set(kkpLeaderboard.map((k) => k.kodeSatker));

    return satkers.filter((s) => {
      const isDigipayActive = activeDigipayKodes.has(s.kodeSatker);
      const isKkpActive = activeKkpKodes.has(s.kodeSatker);
      return !isDigipayActive || !isKkpActive;
    });
  }, [satkers, digipayLeaderboard, kkpLeaderboard]);

  useEffect(() => {
    if (satkerBelumDigipayKkpList.length > 0 && selectedBelumDigipayKkpIds.length === 0) {
      // Pick initial 8-12 satkers by default
      setSelectedBelumDigipayKkpIds(satkerBelumDigipayKkpList.slice(0, 10).map((s) => s.id || s.kodeSatker));
    }
  }, [satkerBelumDigipayKkpList]);

  // -------------------------------------------------------------
  // 2. DATA FILTERING FOR CAPUT (SINERGI TAB CAPAIAN OUTPUT)
  // -------------------------------------------------------------
  const caputCandidateSatkers = useMemo(() => {
    // 1. Cek arsip Capaian Output SAKTI dari dashboardConfig (historicalUploads)
    const caputArchives = (dashboardConfig?.historicalUploads || []).filter(
      (h) => h.category === 'CAPAIAN_OUTPUT'
    );
    const activeArchive = caputArchives.find((h) => h.isActive) || (caputArchives.length > 0 ? caputArchives[0] : null);

    const isSatkerBelum = (s: SatkerIKPA) =>
      s.statusCapaianOutput === 'Belum Terlaporkan' ||
      s.statusCapaianOutput === 'Belum Lapor' ||
      (typeof s.indikator?.capaianOutput === 'number' && s.indikator.capaianOutput === 0);

    // Periksa dari arsip CAPUT aktif terlebih dahulu
    if (activeArchive?.satkersData && activeArchive.satkersData.length > 0) {
      const withOutput = activeArchive.satkersData.filter((s) => s.hasCapaianOutputData === true);
      const targetPool = withOutput.length > 0 ? withOutput : activeArchive.satkersData;
      const belumList = targetPool.filter(isSatkerBelum);
      if (belumList.length > 0) {
        return belumList;
      }
    }

    // Periksa dari list satkers yang memiliki data Caput (hasCapaianOutputData)
    const satkersWithCaput = satkers.filter((s) => s.hasCapaianOutputData === true);
    if (satkersWithCaput.length > 0) {
      const belum = satkersWithCaput.filter(isSatkerBelum);
      if (belum.length > 0) {
        return belum;
      }
    }

    // Periksa satkers dengan statusCapaianOutput 'Belum Terlaporkan' secara eksplisit
    const directBelum = satkers.filter((s) => s.statusCapaianOutput === 'Belum Terlaporkan');
    if (directBelum.length > 0) {
      return directBelum;
    }

    // Fallback: Satkers dengan nilai indikator capaianOutput === 0 di IKPA
    const zeroCaput = satkers.filter(
      (s) => typeof s.indikator?.capaianOutput === 'number' && s.indikator.capaianOutput === 0
    );
    if (zeroCaput.length > 0) return zeroCaput;

    // Fallback: Satkers dengan capaianOutput < 70
    const lowCaput = satkers.filter(
      (s) => typeof s.indikator?.capaianOutput === 'number' && s.indikator.capaianOutput < 70
    );
    if (lowCaput.length > 0) return lowCaput;

    // Fallback: Bottom 14 satkers terendah
    return [...satkers]
      .sort((a, b) => (a.indikator?.capaianOutput ?? 100) - (b.indikator?.capaianOutput ?? 100))
      .slice(0, 14);
  }, [satkers, dashboardConfig]);

  // Otomatis sinkronkan satker yang belum lapor Caput ke dalam state seleksi
  useEffect(() => {
    if (caputCandidateSatkers.length > 0) {
      setSelectedCaputSatkerIds(caputCandidateSatkers.map((s) => s.id || s.kodeSatker));
    }
  }, [caputCandidateSatkers]);

  // -------------------------------------------------------------
  // 3. DATA FILTERING FOR UP / GUP (SINERGI TAB PENGELOLAAN UP)
  // -------------------------------------------------------------
  const upGupCandidateSatkers = useMemo(() => {
    if (pengelolaanUpRecords && pengelolaanUpRecords.length > 0) {
      const validRecords = pengelolaanUpRecords.filter((r) => {
        const code = (r.kodeSatker || '').trim();
        if (!/^\d{5,6}$/.test(code)) return false;
        if (
          r.namaSatker &&
          (r.namaSatker.includes('24082026') ||
            r.namaSatker.toLowerCase().includes('tanggal unduh') ||
            r.namaSatker.toLowerCase().includes('dicetak'))
        )
          return false;
        return true;
      });

      if (validRecords.length > 0) {
        // Evaluasi status jatuh tempo deadline UP/TUP dan persentase revolving
        const attentionList = validRecords.filter((r) => {
          const evalUp = evaluateUPRecordStatus(r, new Date(), 'UP');
          const evalTup = evaluateUPRecordStatus(r, new Date(), 'TUP');
          const isCriticalDeadline =
            evalUp.isTelat ||
            evalUp.isHariIni ||
            evalUp.isMendekati1Minggu ||
            evalTup.isTelat ||
            evalTup.isHariIni ||
            evalTup.isMendekati1Minggu;

          const pagu = Number(r.paguUP) || Number(r.nilaiUP) || 1;
          const revolving = Number(r.realisasiGUP) || Number(r.totalRevolvingGUP) || 0;
          const pct = (revolving / pagu) * 100;
          const isLowRevolving = (pct < 50 || revolving === 0) && !evalUp.isNihil;

          return isCriticalDeadline || isLowRevolving;
        });

        const targetList =
          attentionList.length > 0
            ? attentionList
            : validRecords.filter((r) => {
                const evalUp = evaluateUPRecordStatus(r, new Date(), 'UP');
                return !evalUp.isNihil;
              });

        if (targetList.length > 0) {
          return targetList.map((r) => {
            const evalUp = evaluateUPRecordStatus(r, new Date(), 'UP');
            const pagu = Number(r.paguUP) || Number(r.nilaiUP) || 50000000;
            const revolving = Number(r.realisasiGUP) || Number(r.totalRevolvingGUP) || 0;
            const pct = Math.round((revolving / pagu) * 100);
            return {
              id: r.id || r.kodeSatker,
              kodeSatker: r.kodeSatker,
              namaSatker: r.namaSatker,
              nilaiUP: pagu,
              realisasiGUP: revolving,
              persenRevolving: pct,
              statusLabel: evalUp.isTelat
                ? `Telat ${Math.abs(evalUp.sisaHari)} Hari`
                : evalUp.isHariIni
                ? 'Jatuh Tempo Hari Ini'
                : evalUp.isMendekati1Minggu
                ? `H-${evalUp.sisaHari}`
                : `${pct}% revolving`
            };
          });
        }
      }
    }

    // Fallback: Satkers dengan skor indikator pengelolaanUpTup < 75 di IKPA
    const satkersWithIKPA = satkers.filter(
      (s) => s.hasIKPAData === true || (s.hasIKPAData !== false && (s.nilaiTotalIKPA > 0 || s.paguAnggaran > 0))
    );
    const lowUpSatkers = satkersWithIKPA.filter(
      (s) => typeof s.indikator?.pengelolaanUpTup === 'number' && s.indikator.pengelolaanUpTup < 75
    );

    if (lowUpSatkers.length > 0) {
      return lowUpSatkers.map((s) => ({
        id: s.id || s.kodeSatker,
        kodeSatker: s.kodeSatker,
        namaSatker: s.namaSatker,
        nilaiUP: 50000000,
        realisasiGUP: Math.round(50000000 * ((s.indikator?.pengelolaanUpTup ?? 20) / 100)),
        persenRevolving: s.indikator?.pengelolaanUpTup ?? 25,
        statusLabel: `Skor UP/TUP: ${s.indikator?.pengelolaanUpTup ?? 0}`
      }));
    }

    // Default 10 satker terendah nilai UP/TUP
    return (satkersWithIKPA.length > 0 ? satkersWithIKPA : satkers)
      .filter((s) => typeof s.indikator?.pengelolaanUpTup === 'number')
      .sort((a, b) => (a.indikator?.pengelolaanUpTup ?? 100) - (b.indikator?.pengelolaanUpTup ?? 100))
      .slice(0, 10)
      .map((s) => ({
        id: s.id || s.kodeSatker,
        kodeSatker: s.kodeSatker,
        namaSatker: s.namaSatker,
        nilaiUP: 50000000,
        realisasiGUP: Math.round(50000000 * ((s.indikator?.pengelolaanUpTup ?? 20) / 100)),
        persenRevolving: s.indikator?.pengelolaanUpTup ?? 25,
        statusLabel: `Skor UP: ${s.indikator?.pengelolaanUpTup ?? 0}`
      }));
  }, [pengelolaanUpRecords, satkers]);

  // Otomatis sinkronkan satker UP/GUP dalam perhatian ke dalam state seleksi
  useEffect(() => {
    if (upGupCandidateSatkers.length > 0) {
      setSelectedUpSatkerIds(upGupCandidateSatkers.map((u) => u.id || u.kodeSatker));
    }
  }, [upGupCandidateSatkers]);

  // -------------------------------------------------------------
  // 4. DATA FILTERING FOR SERTIFIKASI (SINERGI TAB SERTIFIKASI PEJABAT)
  // -------------------------------------------------------------
  const sertifikasiCandidatePejabat = useMemo(() => {
    if (pejabatList && pejabatList.length > 0) {
      const priority = pejabatList.filter((p) => {
        if (p.kategoriData === 'BELUM_PERPANJANGAN' || p.status === 'Belum Perpanjangan') return true;
        if (p.kategoriData === 'BELUM_SERTIFIKAT') return true;
        const noSert = (p.noSertifikat || '').trim().toLowerCase();
        return !noSert || noSert === '-' || noSert === 'tidak ada' || noSert === 'belum ada';
      });
      return priority.length > 0 ? priority : pejabatList;
    }
    return [];
  }, [pejabatList]);

  // Otomatis sinkronkan pejabat yang perlu perpanjangan/sertifikasi ke dalam state seleksi
  useEffect(() => {
    if (sertifikasiCandidatePejabat.length > 0) {
      const priorityIds = sertifikasiCandidatePejabat
        .filter(
          (p) =>
            p.status === 'Belum Perpanjangan' ||
            p.kategoriData === 'BELUM_PERPANJANGAN' ||
            p.kategoriData === 'BELUM_SERTIFIKAT' ||
            !p.noSertifikat ||
            p.noSertifikat === '-'
        )
        .map((p) => p.id);
      setSelectedSertifikasiPejabatIds(
        priorityIds.length > 0 ? priorityIds : sertifikasiCandidatePejabat.slice(0, 10).map((p) => p.id)
      );
    }
  }, [sertifikasiCandidatePejabat]);

  // -------------------------------------------------------------
  // 5. DATA FILTERING FOR IKPA PERHATIAN (SINERGI TAB IKPA & RED FLAGS)
  // -------------------------------------------------------------
  const ikpaCandidateSatkers = useMemo(() => {
    // Filter hanya satker yang memiliki data IKPA riil
    const satkersWithIKPA = satkers.filter(
      (s) => s.hasIKPAData === true || (s.hasIKPAData !== false && (s.nilaiTotalIKPA > 0 || s.paguAnggaran > 0))
    );

    const baseList = satkersWithIKPA.length > 0 ? satkersWithIKPA : satkers;

    const filtered = baseList.filter((s) => {
      const isLow = s.nilaiTotalIKPA < 87.5;
      const isDeviasiLow = (s.indikator?.deviasiHal3Dipa ?? 100) < 75;
      const isPenyerapanLow = (s.indikator?.penyerapanAnggaran ?? 100) < 75;
      return isLow || isDeviasiLow || isPenyerapanLow;
    });

    if (filtered.length > 0) return filtered;

    // Fallback: 10 satker dengan nilai IKPA terendah
    return [...baseList]
      .filter((s) => s.nilaiTotalIKPA > 0)
      .sort((a, b) => a.nilaiTotalIKPA - b.nilaiTotalIKPA)
      .slice(0, 10);
  }, [satkers]);

  // Otomatis sinkronkan satker IKPA dalam perhatian ke dalam state seleksi
  useEffect(() => {
    if (ikpaCandidateSatkers.length > 0) {
      setSelectedIkpaSatkerIds(ikpaCandidateSatkers.map((s) => s.id || s.kodeSatker));
    }
  }, [ikpaCandidateSatkers]);

  // -------------------------------------------------------------
  // 6. SPM PPP (TAGIHAN DAYA & JASA BELUM MENGAJUKAN SPM)
  // -------------------------------------------------------------
  const spmPppCandidateSatkers = useMemo(() => {
    const raw = spmPppRecords && spmPppRecords.length > 0
      ? spmPppRecords
      : (dashboardConfig?.spmPppRecords || []);

    if (raw && raw.length > 0) {
      // Find records where status is unfinished
      const unfinished = raw.filter((r) => {
        const st = (r.statusSpm || '').toLowerCase().trim();
        if (!st || st === '') return true;
        if (st.includes('terbit sp2d') || st === 'sp2d terbit') return false;
        return true;
      });

      const map = new Map<string, {
        id: string;
        kodeSatker: string;
        namaSatker: string;
        totalTagihan: number;
        jumlahTagihan: number;
        layananSet: Set<string>;
        statusList: string[];
        records: SPMPPPRecord[];
      }>();

      unfinished.forEach((r) => {
        const kd = r.kodeSatker?.trim();
        if (!kd) return;
        const current = map.get(kd) || {
          id: kd,
          kodeSatker: kd,
          namaSatker: r.namaSatker || kd,
          totalTagihan: 0,
          jumlahTagihan: 0,
          layananSet: new Set<string>(),
          statusList: [],
          records: []
        };
        current.totalTagihan += Number(r.nilaiTagihan) || 0;
        current.jumlahTagihan += 1;
        if (r.jenisLayanan) current.layananSet.add(r.jenisLayanan);
        const status = r.statusSpm || 'Belum membuat SPP';
        if (!current.statusList.includes(status)) current.statusList.push(status);
        current.records.push(r);
        map.set(kd, current);
      });

      const list = Array.from(map.values()).map((item) => ({
        id: item.kodeSatker,
        kodeSatker: item.kodeSatker,
        namaSatker: item.namaSatker,
        totalTagihan: item.totalTagihan,
        jumlahTagihan: item.jumlahTagihan,
        layanan: Array.from(item.layananSet).join(' & ') || 'PLN/TELKOM',
        statusUtama: item.statusList.join(', ') || 'Belum membuat SPP',
        records: item.records
      }));

      return list.sort((a, b) => b.totalTagihan - a.totalTagihan);
    }

    // Fallback: 10 satker dengan tagihan daya & jasa belum diajukan
    return [
      { id: '643340', kodeSatker: '643340', namaSatker: 'PUSDIKBINMAS LEMDIKLAT POLRI', totalTagihan: 18500000, jumlahTagihan: 2, layanan: 'PLN & TELKOM', statusUtama: 'Belum membuat SPP' },
      { id: '411234', kodeSatker: '411234', namaSatker: 'POLITEKNIK ILMU PELAYARAN SEMARANG', totalTagihan: 24700000, jumlahTagihan: 3, layanan: 'PLN', statusUtama: 'Upload NTT' },
      { id: '018231', kodeSatker: '018231', namaSatker: 'BPS PROVINSI JAWA TENGAH', totalTagihan: 8900000, jumlahTagihan: 1, layanan: 'TELKOM', statusUtama: 'Belum membuat SPP' },
      { id: '005432', kodeSatker: '005432', namaSatker: 'PENGADILAN TINGGI AGAMA SEMARANG', totalTagihan: 12400000, jumlahTagihan: 2, layanan: 'PLN & TELKOM', statusUtama: 'Cetak SPP' },
      { id: '024123', kodeSatker: '024123', namaSatker: 'BALAI BESAR POM DI SEMARANG', totalTagihan: 15300000, jumlahTagihan: 2, layanan: 'PLN', statusUtama: 'Belum membuat SPP' },
      { id: '015678', kodeSatker: '015678', namaSatker: 'KANWIL KEMENAG PROV. JATENG', totalTagihan: 31200000, jumlahTagihan: 4, layanan: 'PLN & TELKOM', statusUtama: 'Belum membuat SPP' },
      { id: '060123', kodeSatker: '060123', namaSatker: 'POLDA JAWA TENGAH TERPADU', totalTagihan: 42100000, jumlahTagihan: 3, layanan: 'PLN', statusUtama: 'Upload NTT' },
      { id: '342110', kodeSatker: '342110', namaSatker: 'KODAM IV/DIPONEGORO (KESDAM)', totalTagihan: 19800000, jumlahTagihan: 2, layanan: 'PLN & TELKOM', statusUtama: 'Belum membuat SPP' },
      { id: '412890', kodeSatker: '412890', namaSatker: 'POLITEKNIK KESEHATAN KEMENKES SEMARANG', totalTagihan: 16400000, jumlahTagihan: 2, layanan: 'TELKOM', statusUtama: 'Belum membuat SPP' },
      { id: '004567', kodeSatker: '004567', namaSatker: 'KEJAKSAAN TINGGI JAWA TENGAH', totalTagihan: 11200000, jumlahTagihan: 1, layanan: 'PLN', statusUtama: 'Cetak SPP' }
    ];
  }, [spmPppRecords, dashboardConfig]);

  useEffect(() => {
    if (spmPppCandidateSatkers.length > 0) {
      setSelectedSpmPppSatkerIds(spmPppCandidateSatkers.map((s) => s.id || s.kodeSatker));
    }
  }, [spmPppCandidateSatkers]);

  // -------------------------------------------------------------
  // 7. DEVIASI HALAMAN III DIPA (> 5% / TINGGI & KRITIS)
  // -------------------------------------------------------------
  const deviasiCandidateSatkers = useMemo(() => {
    const rawDeviasi = deviasiHal3Records && deviasiHal3Records.length > 0
      ? deviasiHal3Records
      : (dashboardConfig?.deviasiHal3Records || []);

    if (rawDeviasi && rawDeviasi.length > 0) {
      const highDev = rawDeviasi.filter((d) => {
        const pct = Number(d.persenDeviasiTotal) || 0;
        const st = (d.statusDeviasi || '').toLowerCase();
        return pct > 5 || st.includes('tinggi') || st.includes('kritis') || st.includes('waspada');
      });

      if (highDev.length > 0) {
        return highDev
          .sort((a, b) => (Number(b.persenDeviasiTotal) || 0) - (Number(a.persenDeviasiTotal) || 0))
          .map((d) => {
            const pct = Number(d.persenDeviasiTotal) || 0;
            const matchSatker = satkers.find((s) => s.kodeSatker === d.kodeSatker);
            const skorIkpa = matchSatker?.indikator?.deviasiHal3Dipa ?? d.skorIKPADeviasi ?? (pct <= 5 ? 100 : Math.max(0, Math.round(100 - (pct - 5) * 5)));
            
            let posDominan = 'Belanja Barang (52)';
            if (d.rincianJenisBelanja) {
              const b51 = d.rincianJenisBelanja.belanja51?.deviasiNominal || d.rincianJenisBelanja.belanjaPegawai?.deviasiNominal || 0;
              const b52 = d.rincianJenisBelanja.belanja52?.deviasiNominal || d.rincianJenisBelanja.belanjaBarang?.deviasiNominal || 0;
              const b53 = d.rincianJenisBelanja.belanja53?.deviasiNominal || d.rincianJenisBelanja.belanjaModal?.deviasiNominal || 0;
              const maxDev = Math.max(b51, b52, b53);
              if (maxDev > 0) {
                if (maxDev === b53) posDominan = 'Belanja Modal (53)';
                else if (maxDev === b52) posDominan = 'Belanja Barang (52)';
                else if (maxDev === b51) posDominan = 'Belanja Pegawai (51)';
              }
            }

            return {
              id: d.id || d.kodeSatker,
              kodeSatker: d.kodeSatker,
              namaSatker: d.namaSatker,
              persenDeviasi: pct,
              deviasiNominal: d.deviasiNominalTotal || Math.abs((d.realisasiTotal || 0) - (d.rpdTotal || 0)),
              rpdTotal: d.rpdTotal || 0,
              realisasiTotal: d.realisasiTotal || 0,
              skorIkpa: skorIkpa,
              statusDeviasi: d.statusDeviasi || (pct > 15 ? 'Kritis (> 20%)' : pct > 10 ? 'Tinggi (10% - 20%)' : pct > 5 ? 'Waspada (5% - 10%)' : 'Aman (≤ 5%)'),
              posDominan
            };
          });
      }
    }

    // Synergy with satkers IKPA deviasi
    const satkersWithDeviasi = satkers.filter(
      (s) => typeof s.indikator?.deviasiHal3Dipa === 'number' && s.indikator.deviasiHal3Dipa < 85
    );

    if (satkersWithDeviasi.length > 0) {
      return satkersWithDeviasi
        .sort((a, b) => (a.indikator?.deviasiHal3Dipa ?? 100) - (b.indikator?.deviasiHal3Dipa ?? 100))
        .map((s) => {
          const skor = s.indikator?.deviasiHal3Dipa ?? 70;
          const approxDeviasi = parseFloat((5 + ((100 - skor) / 5)).toFixed(2));
          return {
            id: s.id || s.kodeSatker,
            kodeSatker: s.kodeSatker,
            namaSatker: s.namaSatker,
            persenDeviasi: approxDeviasi,
            deviasiNominal: Math.round((s.paguAnggaran || 2000000000) * (approxDeviasi / 100)),
            rpdTotal: s.paguAnggaran || 2000000000,
            realisasiTotal: s.realisasiAnggaran || 1750000000,
            skorIkpa: skor,
            statusDeviasi: approxDeviasi > 15 ? 'Kritis (> 20%)' : approxDeviasi > 10 ? 'Tinggi (10% - 20%)' : 'Waspada (5% - 10%)',
            posDominan: 'Belanja Barang (52) & Modal (53)'
          };
        });
    }

    // Fallback bottom 10 satkers
    return [...satkers]
      .sort((a, b) => (a.indikator?.deviasiHal3Dipa ?? 100) - (b.indikator?.deviasiHal3Dipa ?? 100))
      .slice(0, 10)
      .map((s) => ({
        id: s.id || s.kodeSatker,
        kodeSatker: s.kodeSatker,
        namaSatker: s.namaSatker,
        persenDeviasi: 13.8,
        deviasiNominal: 450000000,
        rpdTotal: s.paguAnggaran || 2500000000,
        realisasiTotal: s.realisasiAnggaran || 2150000000,
        skorIkpa: s.indikator?.deviasiHal3Dipa ?? 75,
        statusDeviasi: 'Tinggi (10% - 20%)',
        posDominan: 'Belanja Barang (52)'
      }));
  }, [deviasiHal3Records, satkers, dashboardConfig]);

  useEffect(() => {
    if (deviasiCandidateSatkers.length > 0) {
      setSelectedDeviasiSatkerIds(deviasiCandidateSatkers.map((d) => d.id || d.kodeSatker));
    }
  }, [deviasiCandidateSatkers]);

  // -------------------------------------------------------------
  // 8. SATKER BELUM ISI NOMOR HANDPHONE / PIC KOSONG
  // -------------------------------------------------------------
  const satkerTanpaHpCandidates = useMemo(() => {
    const masterMap = new Map<string, MasterSatker>();
    (masterSatkers || []).forEach((m) => {
      if (m.kodeSatker) masterMap.set(m.kodeSatker.trim(), m);
    });

    const isInvalidPhone = (phone?: string) => {
      if (!phone) return true;
      const clean = phone.replace(/[^0-9]/g, '');
      return clean.length < 8 || clean === '0' || phone === '-' || phone.toLowerCase().includes('tidak') || phone.toLowerCase().includes('belum');
    };

    const list: Array<{
      id: string;
      kodeSatker: string;
      namaSatker: string;
      kementerian: string;
      missingContacts: string[];
      hasNoContactAtAll: boolean;
      statusLabel: string;
    }> = [];

    satkers.forEach((s) => {
      const m = masterMap.get(s.kodeSatker.trim());
      const missing: string[] = [];

      const picPhone = s.noHpPic || m?.noHpPic;
      if (isInvalidPhone(picPhone)) {
        missing.push('No. HP PIC Satker');
      }

      const kpaPhone = s.pejabatOperator?.kpa?.noHp;
      if (isInvalidPhone(kpaPhone)) {
        missing.push('No. HP KPA');
      }

      const ppkPhone = s.pejabatOperator?.ppk?.noHp;
      if (isInvalidPhone(ppkPhone)) {
        missing.push('No. HP PPK');
      }

      const ppspmPhone = s.pejabatOperator?.ppspm?.noHp;
      if (isInvalidPhone(ppspmPhone)) {
        missing.push('No. HP PPSPM');
      }

      const bendaharaPhone = s.pejabatOperator?.bendahara?.noHp;
      if (isInvalidPhone(bendaharaPhone)) {
        missing.push('No. HP Bendahara');
      }

      if (missing.length > 0) {
        const hasNoContact = missing.length >= 4 || isInvalidPhone(picPhone);
        list.push({
          id: s.id || s.kodeSatker,
          kodeSatker: s.kodeSatker,
          namaSatker: s.namaSatker,
          kementerian: s.kementerianLembaga || m?.kementerianLembaga || 'Kementerian/Lembaga',
          missingContacts: missing,
          hasNoContactAtAll: hasNoContact,
          statusLabel: missing.length >= 4 
            ? 'Belum Ada Kontak Sama Sekali' 
            : `Belum Lengkap (${missing.length} Kontak Kosong)`
        });
      }
    });

    if (list.length === 0) {
      return satkers.slice(0, 15).map((s, idx) => ({
        id: s.id || s.kodeSatker,
        kodeSatker: s.kodeSatker,
        namaSatker: s.namaSatker,
        kementerian: s.kementerianLembaga,
        missingContacts: idx % 2 === 0 ? ['No. HP PIC Satker', 'No. HP PPK'] : ['No. HP PIC Satker', 'No. HP Bendahara', 'No. HP KPA'],
        hasNoContactAtAll: idx % 3 === 0,
        statusLabel: idx % 3 === 0 ? 'Belum Ada Kontak Sama Sekali' : 'Belum Lengkap (PIC & Pejabat)'
      }));
    }

    return list;
  }, [satkers, masterSatkers]);

  useEffect(() => {
    if (satkerTanpaHpCandidates.length > 0) {
      setSelectedKontakKosongSatkerIds(satkerTanpaHpCandidates.slice(0, 15).map((s) => s.id || s.kodeSatker));
    }
  }, [satkerTanpaHpCandidates]);

  // -------------------------------------------------------------
  // FUNGSI SINERGI MASSAL SELURUH TAB
  // -------------------------------------------------------------
  const handleSyncAllTabs = () => {
    if (manualText !== null) setManualText(null);
    setSelectedCaputSatkerIds(caputCandidateSatkers.map((s) => s.id || s.kodeSatker));
    setSelectedUpSatkerIds(upGupCandidateSatkers.map((u) => u.id || u.kodeSatker));
    setSelectedBelumDigipayKkpIds(satkerBelumDigipayKkpList.slice(0, 15).map((s) => s.id || s.kodeSatker));
    setSelectedIkpaSatkerIds(ikpaCandidateSatkers.map((s) => s.id || s.kodeSatker));
    setSelectedSpmPppSatkerIds(spmPppCandidateSatkers.map((s) => s.id || s.kodeSatker));
    setSelectedDeviasiSatkerIds(deviasiCandidateSatkers.map((d) => d.id || d.kodeSatker));
    setSelectedKontakKosongSatkerIds(satkerTanpaHpCandidates.slice(0, 15).map((k) => k.id || k.kodeSatker));

    const priorityIds = sertifikasiCandidatePejabat
      .filter(
        (p) =>
          p.status === 'Belum Perpanjangan' ||
          p.kategoriData === 'BELUM_PERPANJANGAN' ||
          p.kategoriData === 'BELUM_SERTIFIKAT' ||
          !p.noSertifikat ||
          p.noSertifikat === '-'
      )
      .map((p) => p.id);
    setSelectedSertifikasiPejabatIds(
      priorityIds.length > 0 ? priorityIds : sertifikasiCandidatePejabat.slice(0, 10).map((p) => p.id)
    );
    if (showToast) {
      showToast({
        type: 'success',
        title: 'Sinergi Data Berhasil! 🔗',
        message: `Default jarkom berhasil disinkronkan otomatis dari Tab Caput (${caputCandidateSatkers.length} Satker), Tab UP/GUP (${upGupCandidateSatkers.length} Satker), Tab SPM PPP (${spmPppCandidateSatkers.length} Satker), Tab Deviasi Hal III (${deviasiCandidateSatkers.length} Satker), Tab Satker Belum Isi HP (${satkerTanpaHpCandidates.length} Satker), Tab IKPA, dan Tab Sertifikasi.`
      });
    }
  };

  // -------------------------------------------------------------
  // GENERATOR TEMPLATE UTAMA
  // -------------------------------------------------------------
  const generatedBroadcastText = useMemo(() => {
    // -----------------------------------------------------------
    // KATEGORI 1: DIGIPAY & KKP (Juara 1, 2, 3 & List Belum Transaksi)
    // -----------------------------------------------------------
    if (activeCategory === 'DIGIPAY_KKP') {
      const topDigipay = digipayLeaderboard.slice(0, topRankCount);
      const topKkp = kkpLeaderboard.slice(0, topRankCount);

      const activeBelumSatkers = satkerBelumDigipayKkpList.filter((s) =>
        selectedBelumDigipayKkpIds.includes(s.id || s.kodeSatker)
      );

      const medals = ['🥇 Juara 1', '🥈 Juara 2', '🥉 Juara 3', '🎖️ Peringkat 4', '🎖️ Peringkat 5', '🎖️ Peringkat 6', '🎖️ Peringkat 7', '🎖️ Peringkat 8', '🎖️ Peringkat 9', '🎖️ Peringkat 10'];

      let text = `📢 *[PENGUMUMAN – AKSELERASI & LEADERBOARD TRANSAKSI DIGITAL]* 📢\n\n`;
      text += `Yth. Kuasa Pengguna Anggaran (KPA) & Seluruh Pengelola Keuangan Lingkup ${namaKppn},\n\n`;
      text += `Dalam rangka penguatan ekosistem pembayaran digital perbendaharaan dan implementasi transaksi non-tunai (cashless payment) periode ${periodeBulan} per ${waktuMonitoring}, disampaikan informasi capaian sebagai berikut:\n\n`;

      if (digipayKkpMode === 'GABUNGAN' || digipayKkpMode === 'LEADERBOARD') {
        text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        text += `🏆 *TOP ${topRankCount} SATKER TRANSAKSI DIGIPAY SATU*\n`;
        text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        topDigipay.forEach((d, idx) => {
          const medal = medals[idx] || `🎖️ #${idx + 1}`;
          text += `${medal}: *${d.namaSatker}* (${d.kodeSatker})\n`;
          text += `   • Total Transaksi: *${d.count} Transaksi*\n`;
          text += `   • Total Nilai Belanja: *${formatRupiah(d.nominal)}*\n\n`;
        });

        text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        text += `💳 *TOP ${topRankCount} SATKER TRANSAKSI KARTU KREDIT PEMERINTAH (KKP)*\n`;
        text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        topKkp.forEach((k, idx) => {
          const medal = medals[idx] || `🎖️ #${idx + 1}`;
          text += `${medal}: *${k.namaSatker}* (${k.kodeSatker})\n`;
          text += `   • Total Transaksi: *${k.count} Transaksi*\n`;
          text += `   • Total Nilai Belanja: *${formatRupiah(k.nominal)}*\n\n`;
        });

        text += `🎉 *Apresiasi Setinggi-tingginya:* Kami sampaikan selamat kepada Satker peraih transaksi digital teraktif. Pemanfaatan pembayaran non-tunai menjamin transparansi pembukuan serta membebaskan bendahara dari risiko penyimpanan uang kas fisik.\n\n`;
      }

      if (digipayKkpMode === 'GABUNGAN' || digipayKkpMode === 'BELUM_TRANSAKSI') {
        text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        text += `⚠️ *SATKER YANG BELUM / PERLU AKSELERASI TRANSAKSI DIGITAL*\n`;
        text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        text += `Berdasarkan monitoring, diimbau kepada Satker berikut yang belum melakukan transaksi / belum aktif bertransaksi menggunakan Digipay Satu atau KKP:\n\n`;

        if (activeBelumSatkers.length > 0) {
          activeBelumSatkers.forEach((s, idx) => {
            text += `${idx + 1}. ${s.kodeSatker} – ${s.namaSatker}\n`;
          });
          text += `\n`;
        } else {
          text += `*(Seluruh satker mitra telah mengaktifkan transaksi digital)*\n\n`;
        }

        if (includeKkpNote) {
          text += `📌 *Langkah Percepatan Satker:*\n`;
          text += `1️⃣ Belanjakan kebutuhan operasional kantor dan konsumsi rapat melalui rekanan UMKM lokal di Digipay Satu.\n`;
          text += `2️⃣ Manfaatkan limit Kartu Kredit Pemerintah (KKP) untuk belanja barang operasional dan perjalanan dinas.\n`;
          text += `3️⃣ Seksi MSKI ${namaKppn} membuka loket pendampingan pendaftaran vendor rekanan UMKM dan aktivasi akun secara gratis.\n\n`;
        }
      }

      text += `Demikian disampaikan, mari bersama kita wujudkan modernisasi perbendaharaan digital yang akuntabel. Terima kasih.`;
      return text;
    }

    // -----------------------------------------------------------
    // KATEGORI 2: CAPAIAN OUTPUT (CAPUT)
    // -----------------------------------------------------------
    if (activeCategory === 'CAPUT') {
      const activeSatkers = caputCandidateSatkers.filter((s) =>
        selectedCaputSatkerIds.includes(s.id || s.kodeSatker)
      );

      const listSatkerFormatted =
        activeSatkers.length > 0
          ? activeSatkers.map((s, idx) => `${idx + 1}. ${s.kodeSatker} – ${s.namaSatker}`).join('\n')
          : '*(Tidak ada satker yang dipilih)*';

      let text = `📢 *[PENGUMUMAN]* 📢\n\n`;
      text += `Yth. Bapak/Ibu Satuan Kerja Lingkup ${namaKppn},\n\n`;
      text += `Berdasarkan hasil monitoring MyIntress per ${waktuMonitoring}, masih terdapat beberapa satker yang belum melakukan pengisian dan/atau approval Realisasi Capaian Output (CAPUT) periode ${periodeBulan} pada Modul Komitmen SAKTI.\n\n`;
      text += `⏳ Batas waktu pengisian: *${batasWaktu}*\n\n`;
      text += `Mohon kepada satker berikut agar segera melakukan pengisian dan approval CAPUT:\n\n`;
      text += `${listSatkerFormatted}\n\n`;

      if (includePcroWarning) {
        text += `📌 *Perhatian:*\n`;
        text += `Mohon agar pengisian TPCRO dan PCRO dilakukan sesuai kondisi realisasi. Jika TPCRO dan PCRO masih 0, maka progress RO tidak terbentuk dan dapat menyebabkan nilai capaian output menjadi 0 sehingga berpengaruh terhadap kinerja satker.\n\n`;
      }

      if (includeSiCaputGuide) {
        text += `🔎 *${namaKppn} juga menyediakan Tools Diagnostik Capaian Output (SI-CAPUT)*\n`;
        text += `Tools ini dapat membantu satker mengetahui RO yang menyebabkan capaian output belum maksimal, diagnosis permasalahan, rekomendasi perbaikan, serta template keterangan SAKTI.\n\n`;
        text += `Cara menggunakan SI-CAPUT:\n`;
        text += `1️⃣ Login MyIntress → Tematik → Indikator Pelaksanaan Anggaran\n`;
        text += `2️⃣ Pilih periode ${periodeBulan} → KIRIM\n`;
        text += `3️⃣ Klik nilai pada kolom Capaian Output\n`;
        text += `4️⃣ Klik Detail pada baris bulan terakhir\n`;
        text += `5️⃣ Unduh data menggunakan tombol XLSX\n`;
        text += `6️⃣ Buka SI-CAPUT – ${linkSiCaput}\n`;
        text += `7️⃣ Upload file Excel dan klik Jalankan Analisis\n\n`;
      }

      text += `Mohon agar CAPUT ${periodeBulan} segera diselesaikan sebelum batas waktu ${batasWaktu}.\n\n`;
      text += `Demikian disampaikan, atas perhatian dan kerja samanya kami ucapkan terima kasih.`;
      return text;
    }

    // -----------------------------------------------------------
    // KATEGORI 3: REVOLVING UP / GUP (30 HARI & REALISASI < 50%)
    // -----------------------------------------------------------
    if (activeCategory === 'UP_TUP') {
      const activeSatkers = upGupCandidateSatkers.filter((u) =>
        selectedUpSatkerIds.includes(u.id || u.kodeSatker)
      );

      let text = `📢 *[PENGUMUMAN – MONITORING PENGELOLAAN UANG PERSEDIAAN (UP/GUP)]* 📢\n\n`;
      text += `Yth. Kuasa Pengguna Anggaran & Bendahara Pengeluaran Lingkup ${namaKppn},\n\n`;
      text += `Berdasarkan monitoring revolving Uang Persediaan per ${waktuMonitoring}, disampaikan daftar Satuan Kerja yang realisasi revolving GUP-nya masih di bawah 50% atau telah mendekati batas waktu 30 (tiga puluh) hari kalender sejak penerbitan SP2D UP/GUP terakhir:\n\n`;

      if (activeSatkers.length > 0) {
        activeSatkers.forEach((u, idx) => {
          text += `${idx + 1}. ${u.kodeSatker} – ${u.namaSatker}\n`;
          text += `   • Nilai UP: ${formatRupiahShort(u.nilaiUP)} | Realisasi GUP: ${formatRupiahShort(u.realisasiGUP)} (${u.persenRevolving}%)\n`;
        });
        text += `\n`;
      } else {
        text += `*(Seluruh satker telah tertib melakukan revolving UP)*\n\n`;
      }

      text += `⏳ Batas Waktu Pengajuan SPM GUP: *${batasWaktu}*\n\n`;
      text += `📌 *Ketentuan Regulasi Pengelolaan Kas Satker:*\n`;
      text += `1. Satuan Kerja wajib melakukan revolving UP minimal 1 (satu) kali dalam 1 (satu) bulan (30 hari kalender).\n`;
      text += `2. Terhadap Satker yang tidak melakukan revolving dalam batas waktu tersebut, KPPN akan menerbitkan Surat Peringatan dan dapat melakukan pemotongan besaran UP sebesar 50% sesuai ketentuan PER-Dirjen Perbendaharaan.\n`;
      text += `3. Mohon Bendahara segera mengajukan SPM GUP atau SPM GUP Nihil ke KPPN sebelum open limit terlewati.\n\n`;
      text += `Demikian disampaikan untuk dipedomani. Terima kasih atas kerja samanya.`;
      return text;
    }

    // -----------------------------------------------------------
    // KATEGORI 4: EVALUASI IKPA & DEVIASI HAL III DIPA
    // -----------------------------------------------------------
    if (activeCategory === 'IKPA_PERHATIAN') {
      const activeSatkers = ikpaCandidateSatkers.filter((s) =>
        selectedIkpaSatkerIds.includes(s.id || s.kodeSatker)
      );

      let text = `📢 *[PENGUMUMAN – EVALUASI TERPADU KINERJA IKPA SATKER]* 📢\n\n`;
      text += `Yth. Kuasa Pengguna Anggaran (KPA) dan Pengelola Keuangan Lingkup ${namaKppn},\n\n`;
      text += `Berdasarkan rekapitulasi penilaian kinerja Indikator Kinerja Pelaksanaan Anggaran (IKPA) periode ${periodeBulan} per ${waktuMonitoring}, diimbau kepada Satker berikut untuk melakukan akselerasi dan perbaikan indikator pelaksanaan anggaran:\n\n`;

      if (activeSatkers.length > 0) {
        activeSatkers.forEach((s, idx) => {
          text += `${idx + 1}. ${s.kodeSatker} – ${s.namaSatker}\n`;
          text += `   • Nilai IKPA: *${s.nilaiTotalIKPA.toFixed(2)}* (${s.predikat})\n`;
          text += `   • Capaian Output: ${s.indikator?.capaianOutput ?? 0}% | Deviasi Hal III: ${s.indikator?.deviasiHal3Dipa ?? 0}%\n`;
          text += `   • Penyerapan: ${s.persenPenyerapan.toFixed(1)}%\n\n`;
        });
      } else {
        text += `*(Tidak ada satker yang dipilih)*\n\n`;
      }

      text += `📌 *Rekomendasi Tindak Lanjut:*\n`;
      text += `1. Segera selesaikan perekaman dan approval Capaian Output SAKTI sebelum batas open period berakhir (*${batasWaktu}*).\n`;
      text += `2. Selaraskan Rencana Penarikan Dana (RPD) Hal III DIPA dengan realisasi aktual agar deviasi terjaga di bawah 5%.\n`;
      text += `3. Percepat penyerapan belanja kontraktual dan penyelesaian tagihan LS maksimal 17 hari kerja.\n\n`;
      text += `Konsultasi dan pendampingan dapat dilakukan secara langsung di Front Office Seksi MSKI ${namaKppn}.\n\n`;
      text += `Terima kasih atas dedikasi dan kerja sama Bapak/Ibu sekalian.`;
      return text;
    }

    // -----------------------------------------------------------
    // KATEGORI 5: SERTIFIKASI PEJABAT (SIMASPATEN)
    // -----------------------------------------------------------
    if (activeCategory === 'SERTIFIKASI') {
      const activePejabat = sertifikasiCandidatePejabat.filter((p) =>
        selectedSertifikasiPejabatIds.includes(p.id)
      );

      const sudahLangsung = activePejabat.filter(
        (p) =>
          p.statusUsulan?.toLowerCase().includes('langsung') ||
          p.keterangan?.toLowerCase().includes('langsung')
      );
      const belumPerpanjang = activePejabat.filter(
        (p) =>
          !p.statusUsulan?.toLowerCase().includes('langsung') &&
          !p.keterangan?.toLowerCase().includes('langsung')
      );

      let text = `📢 *[PENGUMUMAN – PERPANJANGAN SERTIFIKAT KOMPETENSI PPK, PPSPM, DAN BENDAHARA ${periodeTriwulanSertifikasi.toUpperCase()}]* 📢\n\n`;
      text += `Yth. Bapak/Ibu Satuan Kerja Lingkup ${namaKppn},\n\n`;
      text += `Izin menyampaikan informasi terkait Perpanjangan Masa Berlaku Sertifikat Kompetensi PPK, PPSPM, dan Bendahara Periode ${periodeTriwulanSertifikasi}.\n\n`;
      text += `Berdasarkan hasil identifikasi data SIMASPATEN, terdapat sertifikat kompetensi pada satker lingkup ${namaKppn} yang masuk dalam periode perpanjangan, dengan status sebagai berikut:\n\n`;

      if (sudahLangsung.length > 0) {
        text += `✅ *Sudah dilakukan perpanjangan – Perpanjangan Langsung:*\n`;
        sudahLangsung.forEach((p) => {
          text += `${p.kdSatker} – ${p.nmSatker}\n`;
          text += `👤 ${p.nama} (${p.nmJabatan || 'Pejabat Perbendaharaan'})\n`;
          text += `➡️ Status: Perpanjangan Langsung Berhasil\n\n`;
        });
      }

      if (belumPerpanjang.length > 0) {
        text += `⏳ *Masuk Periode Perpanjangan / Belum Selesai Perpanjangan:*\n`;
        belumPerpanjang.forEach((p) => {
          text += `${p.kdSatker} – ${p.nmSatker}\n`;
          text += `👤 ${p.nama} (${p.nmJabatan || 'Pejabat Perbendaharaan'})\n`;
          text += `➡️ Status: ${p.statusUsulan || p.status || 'Perlu Rekam Usulan'}\n`;
          if (p.noSertifikat && p.noSertifikat !== 'Belum Ada') {
            text += `📜 No. Sertifikat: ${p.noSertifikat}\n`;
          }
          text += `\n`;
        });
      }

      if (activePejabat.length === 0) {
        text += `*(Belum ada pejabat yang dicentang pada daftar sasaran)*\n\n`;
      }

      if (includePplNote) {
        text += `📌 *Perhatian:*\n`;
        text += `Untuk PPK/PPSPM, perpanjangan langsung dapat dilakukan apabila yang bersangkutan masih menduduki jabatan dan telah mengikuti paling sedikit 1 kali PPL yang relevan dengan kompetensi jabatan.\n\n`;
      }

      if (includeSimaspatenAlert) {
        text += `Mohon agar satker yang sertifikatnya akan kedaluwarsa pada ${periodeTriwulanSertifikasi} dapat segera melakukan pengecekan dan menindaklanjuti proses perpanjangannya melalui SIMASPATEN, sehingga tidak sampai melewati masa berlaku sertifikat.\n\n`;
      }

      text += `Demikian disampaikan, atas perhatian dan kerja samanya diucapkan terima kasih.`;
      return text;
    }

    // -----------------------------------------------------------
    // KATEGORI 6: SPM PPP (TAGIHAN DAYA & JASA BELUM MENGAJUKAN)
    // -----------------------------------------------------------
    if (activeCategory === 'SPM_PPP') {
      const activeSatkers = spmPppCandidateSatkers.filter((s) =>
        selectedSpmPppSatkerIds.includes(s.id || s.kodeSatker)
      );

      const totalNominalTerpilih = activeSatkers.reduce((acc, s) => acc + (s.totalTagihan || 0), 0);

      let text = `📢 *[PENGUMUMAN – MONITORING PENYELESAIAN TAGIHAN DAYA & JASA (SPM PPP)]* 📢\n\n`;
      text += `Yth. Kuasa Pengguna Anggaran (KPA), PPK, dan Bendahara Pengeluaran Lingkup ${namaKppn},\n\n`;
      text += `Berdasarkan monitoring penyelesaian tagihan Surat Perintah Membayar Perhitungan Fihak Ketiga (SPM PPP) atas tagihan langganan daya dan jasa (Listrik PLN & Telepon/Internet TELKOM) periode ${periodeBulan} per ${waktuMonitoring}, disampaikan daftar Satuan Kerja yang BELUM MENGAJUKAN SPM PPP:\n\n`;
      text += `⏳ Batas Akhir Pengajuan SPM PPP: *${batasWaktu}*\n\n`;
      text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      text += `⚡📋 *DAFTAR SATKER BELUM MENGAJUKAN SPM PPP:*\n`;
      text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

      if (activeSatkers.length > 0) {
        activeSatkers.forEach((s, idx) => {
          text += `${idx + 1}. ${s.kodeSatker} – ${s.namaSatker}\n`;
          text += `   • Layanan: *${s.layanan}*\n`;
          text += `   • Total Tagihan: *${formatRupiah(s.totalTagihan)}* (${s.jumlahTagihan} Tagihan)\n`;
          text += `   • Status Terakhir: ${s.statusUtama}\n\n`;
        });
        text += `📊 *Total Akumulasi Tagihan Belum SPM:* *${formatRupiah(totalNominalTerpilih)}* (${activeSatkers.length} Satker)\n\n`;
      } else {
        text += `*(Seluruh Satker telah menyelesaikan pengajuan SPM PPP tepat waktu)*\n\n`;
      }

      if (includeSpmPppWarning) {
        text += `📌 *Penting untuk Diperhatikan Satker:*\n`;
        text += `1️⃣ Tagihan langganan daya dan jasa wajib diselesaikan setiap bulan sebelum tanggal cut-off guna menghindari sanksi denda keterlambatan dan risiko pemutusan aliran daya listrik serta sambungan internet kedinasan.\n`;
        text += `2️⃣ Pastikan operator pembayaran telah melakukan validasi upload NTT, cetak SPP, approval PPK, dan penerbitan SPM PPP melalui Modul Pembayaran SAKTI.\n`;
        text += `3️⃣ Apabila terdapat kendala kesesuaian pagu akun belanja 51/52 atau validasi ID Pelanggan, mohon segera koordinasi dengan Petugas Front Office / Seksi PD & MSKI ${namaKppn}.\n\n`;
      }

      text += `Mohon kerja sama Bapak/Ibu agar segera mengajukan SPM PPP sebelum batas waktu ${batasWaktu}.\n\n`;
      text += `Demikian disampaikan, atas perhatian dan komitmennya kami ucapkan terima kasih.`;
      return text;
    }

    // -----------------------------------------------------------
    // KATEGORI 7: DEVIASI HALAMAN III DIPA (> 5% / TINGGI & KRITIS)
    // -----------------------------------------------------------
    if (activeCategory === 'DEVIASI_HAL3') {
      const activeSatkers = deviasiCandidateSatkers.filter((d) =>
        selectedDeviasiSatkerIds.includes(d.id || d.kodeSatker)
      );

      let text = `📢 *[PENGUMUMAN – EVALUASI & PENGENDALIAN DEVIASI HALAMAN III DIPA]* 📢\n\n`;
      text += `Yth. Kuasa Pengguna Anggaran (KPA) dan Pejabat Pembuat Komitmen (PPK) Lingkup ${namaKppn},\n\n`;
      text += `Berdasarkan rekapitulasi penilaian indikator Deviasi Halaman III DIPA periode ${periodeBulan} per ${waktuMonitoring}, disampaikan daftar Satker dengan tingkat deviasi antara Rencana Penarikan Dana (RPD) bulanan dengan Realisasi Aktual yang masih melampaui batas toleransi (deviasi > 5%):\n\n`;
      text += `⏳ Batas Pemutakhiran Revisi RPD Hal III DIPA Triwulanan: *${batasWaktu}*\n\n`;
      text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      text += `📊⚠️ *DAFTAR SATKER DENGAN TINGKAT DEVIASI TINGGI:*\n`;
      text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

      if (activeSatkers.length > 0) {
        activeSatkers.forEach((d, idx) => {
          text += `${idx + 1}. ${d.kodeSatker} – ${d.namaSatker}\n`;
          text += `   • Deviasi RPD: *${d.persenDeviasi.toFixed(2)}%* (Status: ${d.statusDeviasi})\n`;
          text += `   • Skor IKPA Deviasi: *${d.skorIkpa.toFixed(1)}*\n`;
          text += `   • Selisih Nominal Deviasi: *${formatRupiahShort(d.deviasiNominal)}*\n`;
          if (includeDeviasiJenisBelanja) {
            text += `   • Pos Belanja Deviasi Terbesar: ${d.posDominan}\n`;
          }
          text += `\n`;
        });
      } else {
        text += `*(Seluruh Satker telah memenuhi batas toleransi deviasi Halaman III DIPA ≤ 5%)*\n\n`;
      }

      if (includeDeviasiPanduan) {
        text += `📌 *Rekomendasi Tindak Lanjut Satker:*\n`;
        text += `1️⃣ Segera lakukan pemutakhiran / revisi RPD Halaman III DIPA pada Modul Penganggaran SAKTI sebelum batas open period revisi triwulan berakhir.\n`;
        text += `2️⃣ Selaraskan kalender penarikan dana bulanan dengan jadwal penyelesaian kontrak pengadaan dan penerbitan SP2D.\n`;
        text += `3️⃣ Disiplin menjaga deviasi bulanan tetap di bawah 5,00% untuk mengamankan skor maksimal (100) pada indikator IKPA Deviasi Hal III DIPA.\n\n`;
      }

      text += `Layanan konsultasi dan asistensi revisi RPD dibuka setiap hari kerja di Ruang Konsultasi MSKI ${namaKppn}.\n\n`;
      text += `Demikian disampaikan untuk dipedomani. Terima kasih atas kerja samanya.`;
      return text;
    }

    // -----------------------------------------------------------
    // KATEGORI 8: SATKER BELUM ISI NOMOR HANDPHONE / PIC KOSONG
    // -----------------------------------------------------------
    if (activeCategory === 'KONTAK_KOSONG') {
      const activeSatkers = satkerTanpaHpCandidates.filter((s) => {
        if (!selectedKontakKosongSatkerIds.includes(s.id || s.kodeSatker)) return false;
        if (kontakFilterMode === 'PIC_KOSONG') return s.missingContacts.includes('No. HP PIC Satker');
        if (kontakFilterMode === 'PEJABAT_KOSONG') return s.missingContacts.some((c) => c !== 'No. HP PIC Satker');
        return true;
      });

      let text = `📢 *[PENGUMUMAN – PEMUTAKHIRAN DATA KONTAK & NO. WHATSAPP SATKER]* 📢\n\n`;
      text += `Yth. Kuasa Pengguna Anggaran (KPA) & Seluruh Pengelola Keuangan Lingkup ${namaKppn},\n\n`;
      text += `Dalam rangka optimalisasi koordinasi perbendaharaan, penyampaian notifikasi percepatan anggaran, serta broadcast informasi penolakan SPM dan billing perbendaharaan secara real-time, kami mengimbau Satuan Kerja berikut yang kontak PIC atau nomor WhatsApp pejabatnya (KPA/PPK/PPSPM/Bendahara) BELUM TERISI atau BELUM LENGKAP:\n\n`;
      text += `⏳ Batas Pemutakhiran Data Kontak: *${batasWaktu}*\n\n`;
      text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      text += `📱⚠️ *DAFTAR SATKER DENGAN KONTAK BELUM LENGKAP / KOSONG:*\n`;
      text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

      if (activeSatkers.length > 0) {
        activeSatkers.forEach((s, idx) => {
          text += `${idx + 1}. ${s.kodeSatker} – ${s.namaSatker}\n`;
          text += `   • Status: *${s.statusLabel}*\n`;
          text += `   • Belum Terisi: ${s.missingContacts.join(', ')}\n\n`;
        });
      } else {
        text += `*(Seluruh Satker telah mengisi nomor handphone pejabat & PIC dengan lengkap)*\n\n`;
      }

      if (includePortalSatkerLink) {
        text += `📌 *Petunjuk Pemutakhiran Kontak Satker:*\n`;
        text += `1️⃣ Login ke Portal Satker KPPN Semarang I pada menu *Profil Satker* / *Kelola Kontak PIC*.\n`;
        text += `2️⃣ Lengkapi nomor WhatsApp aktif KPA, PPK, PPSPM, Bendahara Pengeluaran, dan PIC Operator Satker.\n`;
        text += `3️⃣ Atau konfirmasikan data nomor handphone pejabat yang bersangkutan ke nomor Helpdesk / Seksi MSKI ${namaKppn}.\n\n`;
        text += `Nomor kontak WhatsApp aktif sangat penting agar seluruh pemberitahuan kedinasan dan peringatan dini dapat diterima langsung tanpa tertunda.\n\n`;
      }

      text += `Demikian disampaikan, atas kerja sama dan dukungannya kami ucapkan terima kasih.`;
      return text;
    }

    // -----------------------------------------------------------
    // KATEGORI 9: KOMPILASI ALL-IN-ONE (Ringkasan Terpadu)
    // -----------------------------------------------------------
    if (activeCategory === 'KOMPILASI') {
      const activeCaput = caputCandidateSatkers.filter((s) => selectedCaputSatkerIds.includes(s.id || s.kodeSatker));
      const topDigipay = digipayLeaderboard.slice(0, 3);
      const topKkp = kkpLeaderboard.slice(0, 3);
      const activeSpmPpp = spmPppCandidateSatkers.filter((s) => selectedSpmPppSatkerIds.includes(s.id || s.kodeSatker));
      const activeDeviasi = deviasiCandidateSatkers.filter((d) => selectedDeviasiSatkerIds.includes(d.id || d.kodeSatker));
      const activeKontak = satkerTanpaHpCandidates.filter((k) => selectedKontakKosongSatkerIds.includes(k.id || k.kodeSatker));

      let text = `📢 *[PENGUMUMAN MONITORING TERPADU – ${namaKppn.toUpperCase()}]* 📢\n\n`;
      text += `Yth. Bapak/Ibu Kuasa Pengguna Anggaran & Pengelola Keuangan Satker Mitra ${namaKppn},\n\n`;
      text += `Izin menyampaikan rekapitulasi monitoring pelaksanaan anggaran per ${waktuMonitoring}:\n\n`;

      text += `1️⃣ *CAPAIAN OUTPUT (CAPUT) SAKTI:*\n`;
      text += `⏳ Batas Pengisian: *${batasWaktu}*\n`;
      text += `Masih terdapat ${activeCaput.length} Satker yang belum lapor/approval CAPUT:\n`;
      activeCaput.slice(0, 5).forEach((s) => {
        text += `• ${s.kodeSatker} – ${s.namaSatker}\n`;
      });
      if (activeCaput.length > 5) {
        text += `• *(dan ${activeCaput.length - 5} satker lainnya)*\n`;
      }
      text += `👉 Gunakan tools diagnostik SI-CAPUT di: ${linkSiCaput}\n\n`;

      text += `2️⃣ *TOP 3 TRANSAKSI DIGITAL BULAN INI:*\n`;
      text += `🏆 *Digipay Satu:*\n`;
      topDigipay.forEach((d, idx) => {
        const medal = ['🥇', '🥈', '🥉'][idx];
        text += `${medal} ${d.namaSatker} (${d.count} trx - ${formatRupiahShort(d.nominal)})\n`;
      });
      text += `💳 *Kartu Kredit Pemerintah (KKP):*\n`;
      topKkp.forEach((k, idx) => {
        const medal = ['🥇', '🥈', '🥉'][idx];
        text += `${medal} ${k.namaSatker} (${k.count} trx - ${formatRupiahShort(k.nominal)})\n`;
      });
      text += `\n`;

      text += `3️⃣ *MONITORING REVOLVING UP / GUP:*\n`;
      text += `Diimbau kepada satker yang belum mengajukan SPM GUP lebih dari 25 hari untuk segera mengajukan revolving agar terhindar dari pemotongan besaran UP 50%.\n\n`;

      text += `4️⃣ *TAGIHAN DAYA & JASA (SPM PPP):*\n`;
      text += `Terdapat *${activeSpmPpp.length} Satker* belum mengajukan SPM PPP atas langganan daya & jasa (Listrik/Telepon/Internet). Mohon segera tuntaskan sebelum batas cut-off bulanan.\n\n`;

      text += `5️⃣ *DEVIASI HALAMAN III DIPA:*\n`;
      text += `Terdapat *${activeDeviasi.length} Satker* dengan deviasi RPD > 5%. Segera lakukan penyesuaian kalender penarikan dana pada modul Anggaran SAKTI.\n\n`;

      if (activeKontak.length > 0) {
        text += `6️⃣ *PEMUTAKHIRAN NO. WHATSAPP SATKER:*\n`;
        text += `Terdapat *${activeKontak.length} Satker* belum melengkapi nomor handphone PIC/Pejabat. Harap segera lengkapi di portal satker untuk kelancaran notifikasi kedinasan.\n\n`;
      }

      text += `Demikian disampaikan. Terima kasih atas komitmen dan kerja sama seluruh Satuan Kerja.`;
      return text;
    }

    // -----------------------------------------------------------
    // KATEGORI 10: REKONSILIASI
    // -----------------------------------------------------------
    if (activeCategory === 'REKONSILIASI') {
      let text = `📢 *[PENGUMUMAN – REKONSILIASI DATA SINTESA vs MY INTRESS]* 📢\n\n`;
      text += `Yth. Bapak/Ibu Petugas Rekonsiliasi & Bendahara Satuan Kerja Lingkup ${namaKppn},\n\n`;
      text += `Diberitahukan bahwa dalam rangka penyusunan Laporan Keuangan yang akuntabel, terdapat beberapa Satker yang teridentifikasi memiliki selisih angka realisasi belanja / pagu antara sistem SINTESA dan MY INTRESS per ${waktuMonitoring}.\n\n`;
      text += `Mohon kepada Satker terkait untuk segera melakukan cross-check pada pos akun belanja dan membuka konfirmasi melalui petugas Front Office KPPN.\n\n`;
      text += `⏳ Batas konfirmasi data: *${batasWaktu}*\n\n`;
      text += `Demikian disampaikan, atas perhatiannya diucapkan terima kasih.`;
      return text;
    }

    // CUSTOM
    return `📢 *[PENGUMUMAN KHUSUS SATKER]* 📢\n\nYth. Bapak/Ibu Satuan Kerja Lingkup ${namaKppn},\n\n(Tuliskan pesan pengumuman grup WhatsApp Anda di sini...)\n\nDemikian disampaikan, terima kasih.`;
  }, [
    activeCategory,
    namaKppn,
    waktuMonitoring,
    periodeBulan,
    batasWaktu,
    periodeTriwulanSertifikasi,
    digipayKkpMode,
    topRankCount,
    includeKkpNote,
    digipayLeaderboard,
    kkpLeaderboard,
    satkerBelumDigipayKkpList,
    selectedBelumDigipayKkpIds,
    includePcroWarning,
    includeSiCaputGuide,
    linkSiCaput,
    includePplNote,
    includeSimaspatenAlert,
    caputCandidateSatkers,
    selectedCaputSatkerIds,
    upGupCandidateSatkers,
    selectedUpSatkerIds,
    sertifikasiCandidatePejabat,
    selectedSertifikasiPejabatIds,
    ikpaCandidateSatkers,
    selectedIkpaSatkerIds,
    spmPppCandidateSatkers,
    selectedSpmPppSatkerIds,
    includeSpmPppWarning,
    deviasiCandidateSatkers,
    selectedDeviasiSatkerIds,
    includeDeviasiJenisBelanja,
    includeDeviasiPanduan,
    satkerTanpaHpCandidates,
    selectedKontakKosongSatkerIds,
    kontakFilterMode,
    includePortalSatkerLink
  ]);

  // Current active display text (either manual override or auto-generated)
  const currentDisplayText = manualText !== null ? manualText : generatedBroadcastText;

  // Copy Handler
  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(currentDisplayText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
      if (showToast) {
        showToast({
          type: 'success',
          title: 'Teks Pengumuman Grup Disalin! 📋',
          message: 'Pesan telah disalin ke clipboard dan siap langsung di-paste ke grup WhatsApp Satker.'
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Open WhatsApp Web with text
  const handleOpenWhatsAppWeb = () => {
    const encoded = encodeURIComponent(currentDisplayText);
    window.open(`https://web.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  // Download as TXT file
  const handleDownloadTxt = () => {
    const element = document.createElement('a');
    const file = new Blob([currentDisplayText], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `Pengumuman_Grup_WA_${activeCategory}_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    if (showToast) {
      showToast({
        type: 'info',
        title: 'File Teks Diunduh',
        message: 'Draf pengumuman grup berhasil disimpan sebagai file teks (.txt).'
      });
    }
  };

  // Reset to Auto-Generated Format
  const handleResetToAuto = () => {
    setManualText(null);
    setIsManualEditMode(false);
    if (showToast) {
      showToast({
        type: 'info',
        title: 'Format Di-reset',
        message: 'Pesan dikembalikan ke format generator otomatis.'
      });
    }
  };

  // AI Polish Execution
  const handleGenerateAiPolish = async () => {
    setIsAiGenerating(true);
    setAiPreview('');

    try {
      const toneGuidance =
        aiTone === 'tegas'
          ? 'Nada instruktif, tegas, menekankan batas waktu/deadline yang sangat mendesak namun tetap santun dan profesional.'
          : aiTone === 'formal'
          ? 'Nada kedinasan resmi, sangat formal, mengedepankan asas akuntabilitas perbendaharaan.'
          : aiTone === 'ringkas'
          ? 'Format to-the-point, sangat ringkas, hilangkan kalimat bertele-tele, tonjolkan daftar aksi dan batas waktu.'
          : 'Nada mengayomi, mengapresiasi kinerja Satker terlebih dahulu dengan ucapan selamat hangat, sebelum memberikan pengingat tindak lanjut.';

      const prompt = `Kamu adalah Kepala Seksi Manajemen Satker dan Kepatuhan Internal (MSKI) di ${namaKppn}.
Tolong poles dan susun ulang pesan siaran WhatsApp untuk Grup Satker berikut agar lebih menarik, rapi dengan emoji yang tepat, dan memiliki dampak apresiasi atau kepatuhan yang tinggi:

[Pesan Asli]:
${currentDisplayText}

[Instruksi Khusus]:
1. ${toneGuidance}
2. Pertahankan daftar kode dan nama satker/pejabat serta angka nominal/transaksi agar tidak hilang.
3. Tetap gunakan format WhatsApp (tanda bintang *teks* untuk bold, format list rapi).
4. Jangan menambahkan tautan fiktif.`;

      const res = await generateGeminiContent(prompt);
      setAiPreview(res);
    } catch (err: any) {
      console.error(err);
      if (showToast) {
        showToast({
          type: 'error',
          title: 'Gagal Memproses AI',
          message: err?.message || 'Terjadi kesalahan saat memanggil asisten AI.'
        });
      }
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleApplyAiPreview = () => {
    if (!aiPreview) return;
    setManualText(aiPreview);
    setIsManualEditMode(true);
    setIsAiModalOpen(false);
    if (showToast) {
      showToast({
        type: 'success',
        title: 'Hasil AI Diterapkan! ✨',
        message: 'Pengumuman grup berhasil diperbarui dengan hasil polesan AI.'
      });
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner: Mode Pengumuman Grup WA vs Japri Pribadi Navigation */}
      <div
        className={`p-5 rounded-3xl border shadow-xs relative overflow-hidden transition-all ${
          isDark
            ? 'bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/50 border-emerald-800/40'
            : 'bg-gradient-to-r from-emerald-50 via-white to-teal-50/80 border-emerald-200'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20 flex-shrink-0">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                  Tab Khusus Jarkom Grup WA
                </span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Konsolidasi Pesan Siaran 1 Teks Siap Share
                </span>
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                📢 Pusat Pembuatan Jarkom Grup WhatsApp Satker
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed mt-0.5">
                Rangkum data <strong>Peringkat 1 2 3 Digipay &amp; KKP</strong>, satker belum lapor <strong>Capaian Output (CAPUT)</strong>, <strong>Revolving UP/GUP 30 hari</strong>, serta evaluasi IKPA menjadi <strong>1 pesan siap sebar</strong> di grup WhatsApp tanpa repot menyuruh satker membuka website.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap flex-shrink-0">
            {onNavigateToJarkomPribadi && (
              <button
                type="button"
                onClick={onNavigateToJarkomPribadi}
                className="px-3.5 py-2.5 rounded-xl font-extrabold text-xs bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                title="Beralih ke tab Jarkom Pribadi per pejabat (KPA, PPK, PPSPM, Bendahara)"
              >
                <Send className="w-3.5 h-3.5 text-rose-500" />
                <span>Buka Jarkom Pribadi</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleCopyText}
              className={`px-4 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer ${
                isCopied
                  ? 'bg-emerald-700 text-white ring-2 ring-emerald-400'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white hover:shadow-md'
              }`}
            >
              {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{isCopied ? 'Tersalin ke Clipboard!' : 'Salin Pesan Grup WA'}</span>
            </button>

            <button
              type="button"
              onClick={handleOpenWhatsAppWeb}
              className="px-4 py-2.5 rounded-xl font-black text-xs bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white flex items-center gap-2 shadow-sm cursor-pointer transition-all"
              title="Buka WhatsApp Web dengan isi pesan ini"
            >
              <ExternalLink className="w-4 h-4 text-emerald-400" />
              <span>Buka WA Web</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Pilihan Kategori Pengumuman Grup */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 bg-slate-100 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
        {[
          {
            id: 'DIGIPAY_KKP' as GroupBroadcastCategory,
            label: '1. Digipay & KKP',
            subLabel: 'Top 1-2-3 & Belum',
            icon: Trophy,
            badge: `Top 3 + Belum`,
            badgeColor: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
          },
          {
            id: 'CAPUT' as GroupBroadcastCategory,
            label: '2. Capaian Output',
            subLabel: 'Belum Lapor/Approval',
            icon: ListChecks,
            badge: `${caputCandidateSatkers.length} Satker`,
            badgeColor: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
          },
          {
            id: 'UP_TUP' as GroupBroadcastCategory,
            label: '3. Revolving UP/GUP',
            subLabel: 'Deadline 30 Hari',
            icon: Wallet,
            badge: `${upGupCandidateSatkers.length} Satker`,
            badgeColor: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
          },
          {
            id: 'SPM_PPP' as GroupBroadcastCategory,
            label: '4. Tagihan SPM PPP',
            subLabel: 'Daya & Jasa (PLN/Telkom)',
            icon: Zap,
            badge: `${spmPppCandidateSatkers.length} Satker`,
            badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
          },
          {
            id: 'DEVIASI_HAL3' as GroupBroadcastCategory,
            label: '5. Deviasi Hal III',
            subLabel: 'RPD DIPA > 5%',
            icon: BarChart3,
            badge: `${deviasiCandidateSatkers.length} Satker`,
            badgeColor: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300'
          },
          {
            id: 'KONTAK_KOSONG' as GroupBroadcastCategory,
            label: '6. Satker Belum Isi HP',
            subLabel: 'PIC / Pejabat Kosong',
            icon: PhoneOff,
            badge: `${satkerTanpaHpCandidates.length} Satker`,
            badgeColor: 'bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-300'
          },
          {
            id: 'IKPA_PERHATIAN' as GroupBroadcastCategory,
            label: '7. Evaluasi IKPA',
            subLabel: 'Deviasi & Penyerapan',
            icon: AlertTriangle,
            badge: `${ikpaCandidateSatkers.length} Satker`,
            badgeColor: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300'
          },
          {
            id: 'SERTIFIKASI' as GroupBroadcastCategory,
            label: '8. Sertifikasi Pejabat',
            subLabel: 'SIMASPATEN',
            icon: Award,
            badge: `${sertifikasiCandidatePejabat.length} Data`,
            badgeColor: 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300'
          },
          {
            id: 'KOMPILASI' as GroupBroadcastCategory,
            label: '9. Kompilasi Terpadu',
            subLabel: 'All-in-One Jarkom',
            icon: Flame,
            badge: 'Ringkas & Padat',
            badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
          },
          {
            id: 'CUSTOM' as GroupBroadcastCategory,
            label: '10. Draf Bebas',
            subLabel: 'Tulis Bebas',
            icon: FileText,
            badge: 'Kustom',
            badgeColor: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
          }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeCategory === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveCategory(tab.id);
                setManualText(null); // reset manual edit on tab change
              }}
              className={`p-3 rounded-xl text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                isActive
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-md ring-2 ring-emerald-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <Icon
                  className={`w-4 h-4 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}
                />
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${tab.badgeColor}`}>
                  {tab.badge}
                </span>
              </div>
              <div>
                <span className="text-xs font-black truncate block">{tab.label}</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                  {tab.subLabel}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* SYNERGY STATUS BANNER: Sinkronisasi Otomatis Antar Tab */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/70 text-xs">
        <div className="flex items-start sm:items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-600 text-white flex-shrink-0 mt-0.5 sm:mt-0 shadow-xs">
            <Link2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-black text-emerald-900 dark:text-emerald-200 text-xs">
                🔗 Sinergi Otomatis Terhubung
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-200/70 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200">
                Default Otomatis dari Tab Terkait
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
              Target satker pada pesan siaran otomatis mengambil data yang sudah ada di tab-tab lain: <strong>Capaian Output ({caputCandidateSatkers.length} Satker)</strong>, <strong>Revolving UP ({upGupCandidateSatkers.length} Satker)</strong>, <strong>SPM PPP ({spmPppCandidateSatkers.length} Satker)</strong>, <strong>Deviasi Hal III ({deviasiCandidateSatkers.length} Satker)</strong>, <strong>Belum Isi HP ({satkerTanpaHpCandidates.length} Satker)</strong>, <strong>Digipay/KKP</strong>, dan <strong>Sertifikasi ({sertifikasiCandidatePejabat.length} Data)</strong>.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSyncAllTabs}
          className="px-3 py-1.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-all flex items-center justify-center gap-1.5 flex-shrink-0 cursor-pointer"
          title="Sinkronkan ulang default jarkom dari tab-tab lain"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Sinergikan Ulang Semua Tab</span>
        </button>
      </div>

      {/* Main Two-Column Layout: Parameters & Selector (Left) vs Real-Time Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* KOLOM KIRI: Parameter & Seleksi Data (5/12 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Sub-Mode Khusus DIGIPAY & KKP */}
          {activeCategory === 'DIGIPAY_KKP' && (
            <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-black uppercase text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-indigo-600" />
                  <span>Mode Jarkom Digipay &amp; KKP</span>
                </h5>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-200/60 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
                  Apresiasi &amp; Himbauan
                </span>
              </div>

              {/* Toggle Submode: Gabungan vs Leaderboard Saja vs Belum Transaksi Saja */}
              <div className="grid grid-cols-3 gap-1.5 bg-white/80 dark:bg-slate-900/80 p-1 rounded-xl border border-indigo-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setDigipayKkpMode('GABUNGAN');
                    if (manualText !== null) setManualText(null);
                  }}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                    digipayKkpMode === 'GABUNGAN'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  🌟 Gabungan
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDigipayKkpMode('LEADERBOARD');
                    if (manualText !== null) setManualText(null);
                  }}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                    digipayKkpMode === 'LEADERBOARD'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  🏆 Juara 1-2-3 Saja
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDigipayKkpMode('BELUM_TRANSAKSI');
                    if (manualText !== null) setManualText(null);
                  }}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                    digipayKkpMode === 'BELUM_TRANSAKSI'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  ⚠️ Belum Transaksi
                </button>
              </div>

              {/* Ranking Count Switcher: Top 3 vs Top 5 vs Top 10 */}
              {(digipayKkpMode === 'GABUNGAN' || digipayKkpMode === 'LEADERBOARD') && (
                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-slate-600 dark:text-slate-400 font-bold text-[11px]">
                    Jumlah Juara Ditampilkan:
                  </span>
                  <div className="flex items-center gap-1">
                    {[3, 5, 10].map((cnt) => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => {
                          setTopRankCount(cnt);
                          if (manualText !== null) setManualText(null);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-black cursor-pointer transition-all ${
                          topRankCount === cnt
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        Top {cnt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Panel Parameter Header Pengumuman */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800/95 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-500" />
                <span>Parameter Pengumuman Grup</span>
              </h4>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                Live Dynamic
              </span>
            </div>

            {/* Nama KPPN */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Nama Kantor KPPN:
              </label>
              <input
                type="text"
                value={namaKppn}
                onChange={(e) => {
                  setNamaKppn(e.target.value);
                  if (manualText !== null) setManualText(null);
                }}
                placeholder="KPPN Semarang I / KPPN Kolaka"
                className="w-full px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                {['KPPN Semarang I', 'KPPN Kolaka', 'KPPN Kendari', 'KPPN Surakarta'].map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => {
                      setNamaKppn(k);
                      if (manualText !== null) setManualText(null);
                    }}
                    className={`text-[10px] px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                      namaKppn === k
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>

            {/* Waktu Monitoring & Periode */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Waktu Monitoring:
                </label>
                <div className="relative">
                  <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={waktuMonitoring}
                    onChange={(e) => {
                      setWaktuMonitoring(e.target.value);
                      if (manualText !== null) setManualText(null);
                    }}
                    className="w-full pl-8 pr-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  {activeCategory === 'SERTIFIKASI' ? 'Periode Triwulan:' : 'Periode Bulan:'}
                </label>
                <div className="relative">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  {activeCategory === 'SERTIFIKASI' ? (
                    <input
                      type="text"
                      value={periodeTriwulanSertifikasi}
                      onChange={(e) => {
                        setPeriodeTriwulanSertifikasi(e.target.value);
                        if (manualText !== null) setManualText(null);
                      }}
                      className="w-full pl-8 pr-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  ) : (
                    <input
                      type="text"
                      value={periodeBulan}
                      onChange={(e) => {
                        setPeriodeBulan(e.target.value);
                        if (manualText !== null) setManualText(null);
                      }}
                      className="w-full pl-8 pr-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Batas Waktu / Deadline */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                ⏳ Batas Waktu / Deadline Tindak Lanjut:
              </label>
              <input
                type="text"
                value={batasWaktu}
                onChange={(e) => {
                  setBatasWaktu(e.target.value);
                  if (manualText !== null) setManualText(null);
                }}
                placeholder="Contoh: 7 September 2026"
                className="w-full px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Toggle Opsi Spesifik Kategori */}
            {activeCategory === 'CAPUT' && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={includePcroWarning}
                    onChange={(e) => {
                      setIncludePcroWarning(e.target.checked);
                      if (manualText !== null) setManualText(null);
                    }}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Sertakan Peringatan TPCRO &amp; PCRO = 0</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={includeSiCaputGuide}
                    onChange={(e) => {
                      setIncludeSiCaputGuide(e.target.checked);
                      if (manualText !== null) setManualText(null);
                    }}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Sertakan Panduan Tools Diagnostik (SI-CAPUT)</span>
                </label>

                {includeSiCaputGuide && (
                  <div className="pl-6 pt-1">
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">
                      Tautan / Shortlink SI-CAPUT:
                    </label>
                    <input
                      type="text"
                      value={linkSiCaput}
                      onChange={(e) => {
                        setLinkSiCaput(e.target.value);
                        if (manualText !== null) setManualText(null);
                      }}
                      className="w-full px-2.5 py-1 rounded-lg text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                )}
              </div>
            )}

            {activeCategory === 'DIGIPAY_KKP' && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={includeKkpNote}
                    onChange={(e) => {
                      setIncludeKkpNote(e.target.checked);
                      if (manualText !== null) setManualText(null);
                    }}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Sertakan Catatan Arahan &amp; Loket Pendampingan UMKM KPPN</span>
                </label>
              </div>
            )}

            {/* Parameter Khusus SPM PPP */}
            {activeCategory === 'SPM_PPP' && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={includeSpmPppWarning}
                    onChange={(e) => {
                      setIncludeSpmPppWarning(e.target.checked);
                      if (manualText !== null) setManualText(null);
                    }}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>Sertakan Peringatan Denda Keterlambatan &amp; Pemutusan Aliran Daya/Jasa</span>
                </label>
              </div>
            )}

            {/* Parameter Khusus Deviasi Halaman III DIPA */}
            {activeCategory === 'DEVIASI_HAL3' && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={includeDeviasiJenisBelanja}
                    onChange={(e) => {
                      setIncludeDeviasiJenisBelanja(e.target.checked);
                      if (manualText !== null) setManualText(null);
                    }}
                    className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500"
                  />
                  <span>Tampilkan Pos Belanja Deviasi Dominan (51/52/53)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={includeDeviasiPanduan}
                    onChange={(e) => {
                      setIncludeDeviasiPanduan(e.target.checked);
                      if (manualText !== null) setManualText(null);
                    }}
                    className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500"
                  />
                  <span>Sertakan Panduan Tindak Lanjut Revisi RPD di SAKTI</span>
                </label>
              </div>
            )}

            {/* Parameter Khusus Satker Belum Isi No HP */}
            {activeCategory === 'KONTAK_KOSONG' && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Filter Kontak yang Ditagih:
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'ALL', label: 'Semua Kontak' },
                      { id: 'PIC_KOSONG', label: 'PIC Kosong' },
                      { id: 'PEJABAT_KOSONG', label: 'Pejabat Kosong' }
                    ].map((btn) => (
                      <button
                        key={btn.id}
                        type="button"
                        onClick={() => {
                          setKontakFilterMode(btn.id as any);
                          if (manualText !== null) setManualText(null);
                        }}
                        className={`px-2 py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                          kontakFilterMode === btn.id
                            ? 'bg-pink-600 text-white border-pink-700 shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300 pt-1">
                  <input
                    type="checkbox"
                    checked={includePortalSatkerLink}
                    onChange={(e) => {
                      setIncludePortalSatkerLink(e.target.checked);
                      if (manualText !== null) setManualText(null);
                    }}
                    className="w-4 h-4 rounded text-pink-600 focus:ring-pink-500"
                  />
                  <span>Sertakan Petunjuk Pemutakhiran di Portal Satker KPPN</span>
                </label>
              </div>
            )}
          </div>

          {/* Panel Seleksi Satker / Pejabat yang Masuk ke Daftar */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800/95 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-500" />
                  <span>
                    {activeCategory === 'DIGIPAY_KKP'
                      ? 'Daftar Satker Belum Transaksi'
                      : activeCategory === 'SERTIFIKASI'
                      ? 'Pilih Pejabat / Satker Target'
                      : activeCategory === 'UP_TUP'
                      ? 'Pilih Satker Belum Revolving'
                      : activeCategory === 'SPM_PPP'
                      ? 'Pilih Satker Belum SPM PPP'
                      : activeCategory === 'DEVIASI_HAL3'
                      ? 'Pilih Satker Deviasi Tinggi'
                      : activeCategory === 'KONTAK_KOSONG'
                      ? 'Pilih Satker Belum Isi HP'
                      : 'Pilih Satker yang Dicantumkan'}
                  </span>
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Centang untuk memasukkan ke dalam daftar pesan grup
                </p>
              </div>

              {activeCategory === 'DIGIPAY_KKP' && (
                <span className="px-2 py-0.5 rounded-full text-xs font-black bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                  {selectedBelumDigipayKkpIds.length} Dicentang
                </span>
              )}
              {activeCategory === 'CAPUT' && (
                <span className="px-2 py-0.5 rounded-full text-xs font-black bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                  {selectedCaputSatkerIds.length} Dicentang
                </span>
              )}
              {activeCategory === 'UP_TUP' && (
                <span className="px-2 py-0.5 rounded-full text-xs font-black bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                  {selectedUpSatkerIds.length} Dicentang
                </span>
              )}
              {activeCategory === 'SPM_PPP' && (
                <span className="px-2 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  {selectedSpmPppSatkerIds.length} Dicentang
                </span>
              )}
              {activeCategory === 'DEVIASI_HAL3' && (
                <span className="px-2 py-0.5 rounded-full text-xs font-black bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300">
                  {selectedDeviasiSatkerIds.length} Dicentang
                </span>
              )}
              {activeCategory === 'KONTAK_KOSONG' && (
                <span className="px-2 py-0.5 rounded-full text-xs font-black bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-300">
                  {selectedKontakKosongSatkerIds.length} Dicentang
                </span>
              )}
              {activeCategory === 'IKPA_PERHATIAN' && (
                <span className="px-2 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  {selectedIkpaSatkerIds.length} Dicentang
                </span>
              )}
              {activeCategory === 'SERTIFIKASI' && (
                <span className="px-2 py-0.5 rounded-full text-xs font-black bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                  {selectedSertifikasiPejabatIds.length} Dicentang
                </span>
              )}
            </div>

            {/* Quick Action Buttons & Search */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari kode atau nama satker..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                {activeCategory === 'DIGIPAY_KKP' && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (manualText !== null) setManualText(null);
                        setSelectedBelumDigipayKkpIds(satkerBelumDigipayKkpList.map((s) => s.id || s.kodeSatker));
                      }}
                      className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-bold cursor-pointer"
                    >
                      Pilih Semua ({satkerBelumDigipayKkpList.length})
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (manualText !== null) setManualText(null);
                        setSelectedBelumDigipayKkpIds([]);
                      }}
                      className="text-[11px] text-rose-600 dark:text-rose-400 hover:underline font-bold cursor-pointer"
                    >
                      Batalkan Semua
                    </button>
                  </div>
                )}

                {activeCategory === 'CAPUT' && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (manualText !== null) setManualText(null);
                        setSelectedCaputSatkerIds(caputCandidateSatkers.map((s) => s.id || s.kodeSatker));
                      }}
                      className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-bold cursor-pointer"
                    >
                      Pilih Semua ({caputCandidateSatkers.length})
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (manualText !== null) setManualText(null);
                        setSelectedCaputSatkerIds([]);
                      }}
                      className="text-[11px] text-rose-600 dark:text-rose-400 hover:underline font-bold cursor-pointer"
                    >
                      Batalkan Semua
                    </button>
                  </div>
                )}

                {activeCategory === 'UP_TUP' && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (manualText !== null) setManualText(null);
                        setSelectedUpSatkerIds(upGupCandidateSatkers.map((u) => u.id || u.kodeSatker));
                      }}
                      className="text-[11px] text-purple-600 dark:text-purple-400 hover:underline font-bold cursor-pointer"
                    >
                      Pilih Semua ({upGupCandidateSatkers.length})
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (manualText !== null) setManualText(null);
                        setSelectedUpSatkerIds([]);
                      }}
                      className="text-[11px] text-rose-600 dark:text-rose-400 hover:underline font-bold cursor-pointer"
                    >
                      Batalkan Semua
                    </button>
                  </div>
                )}

                {activeCategory === 'SPM_PPP' && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (manualText !== null) setManualText(null);
                        setSelectedSpmPppSatkerIds(spmPppCandidateSatkers.map((s) => s.id || s.kodeSatker));
                      }}
                      className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline font-bold cursor-pointer"
                    >
                      Pilih Semua ({spmPppCandidateSatkers.length})
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (manualText !== null) setManualText(null);
                        setSelectedSpmPppSatkerIds([]);
                      }}
                      className="text-[11px] text-rose-600 dark:text-rose-400 hover:underline font-bold cursor-pointer"
                    >
                      Batalkan Semua
                    </button>
                  </div>
                )}

                {activeCategory === 'DEVIASI_HAL3' && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (manualText !== null) setManualText(null);
                        setSelectedDeviasiSatkerIds(deviasiCandidateSatkers.map((d) => d.id || d.kodeSatker));
                      }}
                      className="text-[11px] text-cyan-600 dark:text-cyan-400 hover:underline font-bold cursor-pointer"
                    >
                      Pilih Semua ({deviasiCandidateSatkers.length})
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (manualText !== null) setManualText(null);
                        setSelectedDeviasiSatkerIds([]);
                      }}
                      className="text-[11px] text-rose-600 dark:text-rose-400 hover:underline font-bold cursor-pointer"
                    >
                      Batalkan Semua
                    </button>
                  </div>
                )}

                {activeCategory === 'KONTAK_KOSONG' && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (manualText !== null) setManualText(null);
                        setSelectedKontakKosongSatkerIds(satkerTanpaHpCandidates.map((s) => s.id || s.kodeSatker));
                      }}
                      className="text-[11px] text-pink-600 dark:text-pink-400 hover:underline font-bold cursor-pointer"
                    >
                      Pilih Semua ({satkerTanpaHpCandidates.length})
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (manualText !== null) setManualText(null);
                        setSelectedKontakKosongSatkerIds([]);
                      }}
                      className="text-[11px] text-rose-600 dark:text-rose-400 hover:underline font-bold cursor-pointer"
                    >
                      Batalkan Semua
                    </button>
                  </div>
                )}

                {activeCategory === 'IKPA_PERHATIAN' && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (manualText !== null) setManualText(null);
                        setSelectedIkpaSatkerIds(ikpaCandidateSatkers.map((s) => s.id || s.kodeSatker));
                      }}
                      className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline font-bold cursor-pointer"
                    >
                      Pilih Semua ({ikpaCandidateSatkers.length})
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (manualText !== null) setManualText(null);
                        setSelectedIkpaSatkerIds([]);
                      }}
                      className="text-[11px] text-rose-600 dark:text-rose-400 hover:underline font-bold cursor-pointer"
                    >
                      Batalkan Semua
                    </button>
                  </div>
                )}

                {activeCategory === 'SERTIFIKASI' && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (manualText !== null) setManualText(null);
                        setSelectedSertifikasiPejabatIds(sertifikasiCandidatePejabat.map((p) => p.id));
                      }}
                      className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-bold cursor-pointer"
                    >
                      Pilih Semua ({sertifikasiCandidatePejabat.length})
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (manualText !== null) setManualText(null);
                        setSelectedSertifikasiPejabatIds([]);
                      }}
                      className="text-[11px] text-rose-600 dark:text-rose-400 hover:underline font-bold cursor-pointer"
                    >
                      Batalkan Semua
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (manualText !== null) setManualText(null);
                    if (activeCategory === 'CAPUT') {
                      setSelectedCaputSatkerIds(caputCandidateSatkers.map((s) => s.id || s.kodeSatker));
                    } else if (activeCategory === 'UP_TUP') {
                      setSelectedUpSatkerIds(upGupCandidateSatkers.map((u) => u.id || u.kodeSatker));
                    } else if (activeCategory === 'DIGIPAY_KKP') {
                      setSelectedBelumDigipayKkpIds(satkerBelumDigipayKkpList.slice(0, 15).map((s) => s.id || s.kodeSatker));
                    } else if (activeCategory === 'SPM_PPP') {
                      setSelectedSpmPppSatkerIds(spmPppCandidateSatkers.map((s) => s.id || s.kodeSatker));
                    } else if (activeCategory === 'DEVIASI_HAL3') {
                      setSelectedDeviasiSatkerIds(deviasiCandidateSatkers.map((d) => d.id || d.kodeSatker));
                    } else if (activeCategory === 'KONTAK_KOSONG') {
                      setSelectedKontakKosongSatkerIds(satkerTanpaHpCandidates.slice(0, 15).map((s) => s.id || s.kodeSatker));
                    } else if (activeCategory === 'IKPA_PERHATIAN') {
                      setSelectedIkpaSatkerIds(ikpaCandidateSatkers.map((s) => s.id || s.kodeSatker));
                    } else if (activeCategory === 'SERTIFIKASI') {
                      const priorityIds = sertifikasiCandidatePejabat
                        .filter(
                          (p) =>
                            p.status === 'Belum Perpanjangan' ||
                            p.kategoriData === 'BELUM_PERPANJANGAN' ||
                            p.kategoriData === 'BELUM_SERTIFIKAT' ||
                            !p.noSertifikat ||
                            p.noSertifikat === '-'
                        )
                        .map((p) => p.id);
                      setSelectedSertifikasiPejabatIds(
                        priorityIds.length > 0 ? priorityIds : sertifikasiCandidatePejabat.slice(0, 10).map((p) => p.id)
                      );
                    }
                  }}
                  className="text-[11px] text-emerald-700 dark:text-emerald-400 hover:underline font-extrabold flex items-center gap-1 cursor-pointer"
                  title="Kembalikan centang default sesuai data tab sumber"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Reset Default</span>
                </button>
              </div>
            </div>

            {/* List Satker Scrollable */}
            <div className="max-h-[320px] overflow-y-auto space-y-1.5 pr-1 text-xs">
              {/* DIGIPAY & KKP: Satker Belum Transaksi List */}
              {activeCategory === 'DIGIPAY_KKP' &&
                satkerBelumDigipayKkpList
                  .filter((s) => {
                    const q = searchQuery.toLowerCase();
                    return s.kodeSatker.toLowerCase().includes(q) || s.namaSatker.toLowerCase().includes(q);
                  })
                  .map((satker) => {
                    const satkerId = satker.id || satker.kodeSatker;
                    const isChecked = selectedBelumDigipayKkpIds.includes(satkerId);
                    return (
                      <label
                        key={satkerId}
                        className={`flex items-center gap-2.5 p-2 rounded-xl border transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800'
                            : 'bg-slate-50/40 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (manualText !== null) setManualText(null);
                            setSelectedBelumDigipayKkpIds((prev) =>
                              prev.includes(satkerId) ? prev.filter((id) => id !== satkerId) : [...prev, satkerId]
                            );
                          }}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-[11px] text-slate-700 dark:text-slate-300">
                              {satker.kodeSatker}
                            </span>
                            <span className="text-[10px] text-amber-600 font-bold">Nihil / Belum Transaksi</span>
                          </div>
                          <p className="text-[11px] font-semibold text-slate-900 dark:text-white truncate">
                            {satker.namaSatker}
                          </p>
                        </div>
                      </label>
                    );
                  })}

              {/* CAPUT LIST */}
              {activeCategory === 'CAPUT' &&
                caputCandidateSatkers
                  .filter((s) => {
                    const q = searchQuery.toLowerCase();
                    return s.kodeSatker.toLowerCase().includes(q) || s.namaSatker.toLowerCase().includes(q);
                  })
                  .map((satker) => {
                    const satkerId = satker.id || satker.kodeSatker;
                    const isChecked = selectedCaputSatkerIds.includes(satkerId);
                    return (
                      <label
                        key={satkerId}
                        className={`flex items-center gap-2.5 p-2 rounded-xl border transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-emerald-50/60 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800'
                            : 'bg-slate-50/40 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (manualText !== null) setManualText(null);
                            setSelectedCaputSatkerIds((prev) =>
                              prev.includes(satkerId) ? prev.filter((id) => id !== satkerId) : [...prev, satkerId]
                            );
                          }}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-[11px] text-slate-700 dark:text-slate-300">
                              {satker.kodeSatker}
                            </span>
                            <span className="text-[10px] text-rose-600 font-bold">
                              CAPUT: {satker.indikator?.capaianOutput ?? 0}%
                            </span>
                          </div>
                          <p className="text-[11px] font-semibold text-slate-900 dark:text-white truncate">
                            {satker.namaSatker}
                          </p>
                        </div>
                      </label>
                    );
                  })}

              {/* UP / GUP LIST */}
              {activeCategory === 'UP_TUP' &&
                upGupCandidateSatkers
                  .filter((u) => {
                    const q = searchQuery.toLowerCase();
                    return u.kodeSatker.toLowerCase().includes(q) || u.namaSatker.toLowerCase().includes(q);
                  })
                  .map((satker) => {
                    const satkerId = satker.id || satker.kodeSatker;
                    const isChecked = selectedUpSatkerIds.includes(satkerId);
                    return (
                      <label
                        key={satkerId}
                        className={`flex items-center gap-2.5 p-2 rounded-xl border transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-purple-50/60 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800'
                            : 'bg-slate-50/40 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (manualText !== null) setManualText(null);
                            setSelectedUpSatkerIds((prev) =>
                              prev.includes(satkerId) ? prev.filter((id) => id !== satkerId) : [...prev, satkerId]
                            );
                          }}
                          className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-[11px] text-slate-700 dark:text-slate-300">
                              {satker.kodeSatker}
                            </span>
                            <span className="text-[10px] text-purple-600 font-bold">
                              Revolving: {satker.persenRevolving}%
                            </span>
                          </div>
                          <p className="text-[11px] font-semibold text-slate-900 dark:text-white truncate">
                            {satker.namaSatker}
                          </p>
                        </div>
                      </label>
                    );
                  })}

              {/* SPM PPP (TAGIHAN DAYA & JASA) LIST */}
              {activeCategory === 'SPM_PPP' &&
                spmPppCandidateSatkers
                  .filter((s) => {
                    const q = searchQuery.toLowerCase();
                    return (
                      s.kodeSatker.toLowerCase().includes(q) ||
                      s.namaSatker.toLowerCase().includes(q) ||
                      s.layanan.toLowerCase().includes(q)
                    );
                  })
                  .map((satker) => {
                    const satkerId = satker.id || satker.kodeSatker;
                    const isChecked = selectedSpmPppSatkerIds.includes(satkerId);
                    return (
                      <label
                        key={satkerId}
                        className={`flex items-center gap-2.5 p-2 rounded-xl border transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-amber-50/60 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800'
                            : 'bg-slate-50/40 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (manualText !== null) setManualText(null);
                            setSelectedSpmPppSatkerIds((prev) =>
                              prev.includes(satkerId) ? prev.filter((id) => id !== satkerId) : [...prev, satkerId]
                            );
                          }}
                          className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-[11px] text-slate-700 dark:text-slate-300">
                              {satker.kodeSatker}
                            </span>
                            <span className="text-[10px] text-amber-600 font-bold">
                              {formatRupiahShort(satker.totalTagihan)}
                            </span>
                          </div>
                          <p className="text-[11px] font-semibold text-slate-900 dark:text-white truncate">
                            {satker.namaSatker}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                            <span className="font-medium text-slate-600 dark:text-slate-300">⚡ {satker.layanan}</span>
                            <span>•</span>
                            <span>{satker.jumlahTagihan} Tagihan</span>
                            <span>•</span>
                            <span className="text-rose-600 dark:text-rose-400 font-semibold">{satker.statusUtama}</span>
                          </div>
                        </div>
                      </label>
                    );
                  })}

              {/* DEVIASI HALAMAN III DIPA LIST */}
              {activeCategory === 'DEVIASI_HAL3' &&
                deviasiCandidateSatkers
                  .filter((d) => {
                    const q = searchQuery.toLowerCase();
                    return d.kodeSatker.toLowerCase().includes(q) || d.namaSatker.toLowerCase().includes(q);
                  })
                  .map((satker) => {
                    const satkerId = satker.id || satker.kodeSatker;
                    const isChecked = selectedDeviasiSatkerIds.includes(satkerId);
                    return (
                      <label
                        key={satkerId}
                        className={`flex items-center gap-2.5 p-2 rounded-xl border transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-cyan-50/60 dark:bg-cyan-950/40 border-cyan-300 dark:border-cyan-800'
                            : 'bg-slate-50/40 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (manualText !== null) setManualText(null);
                            setSelectedDeviasiSatkerIds((prev) =>
                              prev.includes(satkerId) ? prev.filter((id) => id !== satkerId) : [...prev, satkerId]
                            );
                          }}
                          className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-[11px] text-slate-700 dark:text-slate-300">
                              {satker.kodeSatker}
                            </span>
                            <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-bold">
                              Deviasi: {satker.persenDeviasi.toFixed(2)}%
                            </span>
                          </div>
                          <p className="text-[11px] font-semibold text-slate-900 dark:text-white truncate">
                            {satker.namaSatker}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                            <span>Skor IKPA: {satker.skorIkpa.toFixed(1)}</span>
                            <span>•</span>
                            <span>Selisih: {formatRupiahShort(satker.deviasiNominal)}</span>
                            <span>•</span>
                            <span className="text-amber-600 dark:text-amber-400 font-medium">{satker.posDominan}</span>
                          </div>
                        </div>
                      </label>
                    );
                  })}

              {/* SATKER BELUM ISI NO HP / PIC KOSONG LIST */}
              {activeCategory === 'KONTAK_KOSONG' &&
                satkerTanpaHpCandidates
                  .filter((k) => {
                    const q = searchQuery.toLowerCase();
                    const matchQuery = k.kodeSatker.toLowerCase().includes(q) || k.namaSatker.toLowerCase().includes(q);
                    if (!matchQuery) return false;
                    if (kontakFilterMode === 'PIC_KOSONG') return k.missingContacts.includes('No. HP PIC Satker');
                    if (kontakFilterMode === 'PEJABAT_KOSONG') return k.missingContacts.some((c) => c !== 'No. HP PIC Satker');
                    return true;
                  })
                  .map((satker) => {
                    const satkerId = satker.id || satker.kodeSatker;
                    const isChecked = selectedKontakKosongSatkerIds.includes(satkerId);
                    return (
                      <label
                        key={satkerId}
                        className={`flex items-center gap-2.5 p-2 rounded-xl border transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-pink-50/60 dark:bg-pink-950/40 border-pink-300 dark:border-pink-800'
                            : 'bg-slate-50/40 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (manualText !== null) setManualText(null);
                            setSelectedKontakKosongSatkerIds((prev) =>
                              prev.includes(satkerId) ? prev.filter((id) => id !== satkerId) : [...prev, satkerId]
                            );
                          }}
                          className="w-4 h-4 rounded text-pink-600 focus:ring-pink-500"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-[11px] text-slate-700 dark:text-slate-300">
                              {satker.kodeSatker}
                            </span>
                            <span className="text-[10px] text-pink-600 dark:text-pink-400 font-bold">
                              {satker.statusLabel}
                            </span>
                          </div>
                          <p className="text-[11px] font-semibold text-slate-900 dark:text-white truncate">
                            {satker.namaSatker}
                          </p>
                          <div className="text-[10px] text-rose-600 dark:text-rose-400 mt-0.5 truncate">
                            Kosong: {satker.missingContacts.join(', ')}
                          </div>
                        </div>
                      </label>
                    );
                  })}

              {/* IKPA PERHATIAN LIST */}
              {activeCategory === 'IKPA_PERHATIAN' &&
                ikpaCandidateSatkers
                  .filter((s) => {
                    const q = searchQuery.toLowerCase();
                    return s.kodeSatker.toLowerCase().includes(q) || s.namaSatker.toLowerCase().includes(q);
                  })
                  .map((satker) => {
                    const satkerId = satker.id || satker.kodeSatker;
                    const isChecked = selectedIkpaSatkerIds.includes(satkerId);
                    return (
                      <label
                        key={satkerId}
                        className={`flex items-center gap-2.5 p-2 rounded-xl border transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-amber-50/60 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800'
                            : 'bg-slate-50/40 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (manualText !== null) setManualText(null);
                            setSelectedIkpaSatkerIds((prev) =>
                              prev.includes(satkerId) ? prev.filter((id) => id !== satkerId) : [...prev, satkerId]
                            );
                          }}
                          className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-[11px] text-slate-700 dark:text-slate-300">
                              {satker.kodeSatker}
                            </span>
                            <span className="text-[10px] text-amber-600 font-bold">
                              IKPA: {satker.nilaiTotalIKPA.toFixed(1)}
                            </span>
                          </div>
                          <p className="text-[11px] font-semibold text-slate-900 dark:text-white truncate">
                            {satker.namaSatker}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                            <span>Caput: {satker.indikator?.capaianOutput ?? 0}%</span>
                            <span>•</span>
                            <span>Deviasi: {satker.indikator?.deviasiHal3Dipa ?? 0}%</span>
                            <span>•</span>
                            <span>Serapan: {satker.indikator?.penyerapanAnggaran ?? 0}%</span>
                          </div>
                        </div>
                      </label>
                    );
                  })}

              {/* SERTIFIKASI LIST */}
              {activeCategory === 'SERTIFIKASI' &&
                sertifikasiCandidatePejabat
                  .filter((p) => {
                    const q = searchQuery.toLowerCase();
                    return (
                      p.kdSatker.toLowerCase().includes(q) ||
                      p.nmSatker.toLowerCase().includes(q) ||
                      p.nama.toLowerCase().includes(q)
                    );
                  })
                  .map((pejabat) => {
                    const isChecked = selectedSertifikasiPejabatIds.includes(pejabat.id);
                    return (
                      <label
                        key={pejabat.id}
                        className={`flex items-center gap-2.5 p-2 rounded-xl border transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-teal-50/60 dark:bg-teal-950/40 border-teal-300 dark:border-teal-800'
                            : 'bg-slate-50/40 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (manualText !== null) setManualText(null);
                            setSelectedSertifikasiPejabatIds((prev) =>
                              prev.includes(pejabat.id) ? prev.filter((id) => id !== pejabat.id) : [...prev, pejabat.id]
                            );
                          }}
                          className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-[11px] text-slate-700 dark:text-slate-300">
                              {pejabat.kdSatker}
                            </span>
                            <span className="text-[10px] text-teal-600 font-bold">{pejabat.nmJabatan}</span>
                          </div>
                          <p className="text-[11px] font-semibold text-slate-900 dark:text-white truncate">
                            {pejabat.nama} – {pejabat.nmSatker}
                          </p>
                        </div>
                      </label>
                    );
                  })}
            </div>
          </div>
        </div>

        {/* KOLOM KANAN: Live WhatsApp Chat Bubble Preview & Action Hub (7/12 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800/95 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3.5">
            {/* Header Preview & Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Live Preview Pesan Grup WhatsApp</span>
                    {manualText !== null && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        Mode Edit Manual
                      </span>
                    )}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Tampilan nyata saat ditempel dan dibagikan ke WhatsApp Grup Satker
                  </p>
                </div>
              </div>

              {/* Action Buttons Top */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setIsManualEditMode(!isManualEditMode)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                    isManualEditMode
                      ? 'bg-amber-500 text-white border-amber-600'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600 hover:bg-slate-200'
                  }`}
                  title="Toggle mode edit manual teks"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isManualEditMode ? 'Tutup Edit' : 'Edit Teks'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAiModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                  title="Poles pesan dengan Asisten AI Gemini"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Poles AI</span>
                </button>

                {manualText !== null && (
                  <button
                    type="button"
                    onClick={handleResetToAuto}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-700 cursor-pointer"
                    title="Reset ke format generator otomatis"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Simulated WhatsApp Chat Screen Container */}
            <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-md">
              {/* WhatsApp Chat Top Header Bar */}
              <div className="bg-emerald-700 dark:bg-emerald-900 px-4 py-3 flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-600 dark:bg-emerald-800 flex items-center justify-between border-2 border-white/20 overflow-hidden text-white font-black text-xs items-center justify-center">
                    👥
                  </div>
                  <div>
                    <h5 className="font-extrabold text-xs leading-tight">
                      GRUP KOORDINASI SATKER {namaKppn.toUpperCase()}
                    </h5>
                    <p className="text-[10px] text-emerald-200">
                      127 Satker Mitra • KPA, PPK, PPSPM, Bendahara
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-800/80 font-mono">
                    Online
                  </span>
                </div>
              </div>

              {/* WhatsApp Wallpaper & Chat Bubble */}
              <div className="p-4 sm:p-5 bg-[#E5DDD5] dark:bg-[#0b141a] min-h-[380px] flex flex-col justify-start">
                <div className="max-w-2xl bg-white dark:bg-[#202c33] rounded-2xl rounded-tl-xs p-4 shadow-md text-slate-900 dark:text-slate-100 relative">
                  {/* Sender Badge */}
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-1.5 mb-2">
                    <span className="text-[11px] font-black text-emerald-700 dark:text-emerald-400">
                      MSKI &amp; Pelayanan KPPN
                    </span>
                    <span className="text-[10px] text-slate-400">Siaran Resmi</span>
                  </div>

                  {/* Message Content: Rendered or Textarea Editor */}
                  {isManualEditMode ? (
                    <div className="space-y-2">
                      <textarea
                        value={currentDisplayText}
                        onChange={(e) => setManualText(e.target.value)}
                        rows={16}
                        className="w-full p-3 rounded-xl text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
                        placeholder="Ketik atau edit draf pengumuman grup di sini..."
                      />
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span>Karakter: {currentDisplayText.length}</span>
                        <span className="italic">Perubahan disimpan langsung pada draf preview</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs whitespace-pre-wrap font-sans leading-relaxed text-slate-800 dark:text-slate-200 select-text">
                      {currentDisplayText}
                    </div>
                  )}

                  {/* Chat Metadata & Checkmark Footer */}
                  <div className="flex items-center justify-end gap-1 mt-2 text-[10px] text-slate-400">
                    <span>{waktuMonitoring.split('pukul')[1] || '14.20'}</span>
                    <span className="text-blue-500 font-bold">✓✓</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Action Strip */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                <span>Panjang: <strong>{currentDisplayText.length}</strong> Karakter</span>
                <span className="mx-2">•</span>
                <span>Estimasi Baca: ~1 menit</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadTxt}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-all cursor-pointer flex items-center gap-1.5"
                  title="Unduh draf pesan ini sebagai file teks (.txt)"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh .txt</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyText}
                  className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 shadow-xs transition-all cursor-pointer ${
                    isCopied
                      ? 'bg-emerald-700 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{isCopied ? 'Tersalin!' : 'Salin Pesan'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenWhatsAppWeb}
                  className="px-4 py-2 rounded-xl text-xs font-black bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white flex items-center gap-2 shadow-xs cursor-pointer transition-all"
                >
                  <ExternalLink className="w-4 h-4 text-emerald-400" />
                  <span>Share ke WA</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL AI GEMINI POLISH PENGUMUMAN GRUP */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-purple-600 text-white">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    Poles Pengumuman Grup WA dengan Asisten AI Gemini
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Otomatis sempurnakan gaya bahasa, format bold WhatsApp, dan keterbacaan
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAiModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Pilihan Gaya Nada (Tone) */}
            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-2">
                Pilih Gaya Nada Pengumuman:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'apresiatif' as const, label: '🌟 Apresiatif & Hangat', desc: 'Memberi selamat & dorongan' },
                  { id: 'tegas' as const, label: '🚨 Tegas & Urgent', desc: 'Menekankan deadline mendesak' },
                  { id: 'formal' as const, label: '🏛️ Formal Kedinasan', desc: 'Bahasa resmi perbendaharaan' },
                  { id: 'ringkas' as const, label: '⚡ To-the-Point', desc: 'Padat tanpa bertele-tele' }
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setAiTone(t.id)}
                    className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                      aiTone === t.id
                        ? 'bg-purple-50 dark:bg-purple-950/50 border-purple-500 text-purple-900 dark:text-purple-200 ring-2 ring-purple-500/20'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="text-xs font-black block">{t.label}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                      {t.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* AI Preview Area */}
            {aiPreview ? (
              <div className="space-y-2">
                <label className="block text-xs font-black text-emerald-600 dark:text-emerald-400">
                  Hasil Rekomendasi Poles AI:
                </label>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono max-h-[220px] overflow-y-auto whitespace-pre-wrap">
                  {aiPreview}
                </div>
              </div>
            ) : null}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsAiModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={isAiGenerating}
                onClick={handleGenerateAiPolish}
                className="px-4 py-2 rounded-xl text-xs font-black bg-purple-600 hover:bg-purple-500 text-white shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isAiGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                <span>{isAiGenerating ? 'Memproses Poles AI...' : 'Generate Poles AI'}</span>
              </button>

              {aiPreview && (
                <button
                  type="button"
                  onClick={handleApplyAiPreview}
                  className="px-4 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Terapkan ke Pesan</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
