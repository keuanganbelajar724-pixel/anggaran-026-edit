import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Calculator, 
  BookOpen, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  Sparkles, 
  Search, 
  ArrowRight, 
  ShieldCheck, 
  Copy, 
  Check, 
  RotateCcw,
  BarChart2,
  PieChart,
  HelpCircle,
  Sliders,
  Award,
  Zap,
  ChevronDown,
  ChevronUp,
  Info,
  Calendar
} from 'lucide-react';
import { SatkerIKPA, AppTheme, DashboardConfig } from '../types';

interface Per5AnalisisViewProps {
  satkers: SatkerIKPA[];
  onSelectSatker?: (satker: SatkerIKPA) => void;
  onOpenReminderWithAnalysis?: (satker: SatkerIKPA, analysisText: string) => void;
  theme: AppTheme;
  dashboardConfig?: DashboardConfig;
}

export const PER5_INDIKATOR_INFO = [
  {
    id: 'revisiDipa',
    nama: '1. Revisi DIPA',
    aspek: 'Kualitas Perencanaan (25%)',
    bobot: '10%',
    deskripsi: 'Pengendalian revisi pagu tetap secara semesteran (bukan kumulatif). Memperhitungkan 14 jenis revisi pagu tetap.',
    rumus: 'IKPA Rev = (50% × NKRA Sem I) + (50% × NKRA Sem II)',
    layering: 'Jumlah Revisi: 0-1 kali = Nilai 110 | 2 kali = Nilai 100 | ≥3 kali = Nilai 50',
    strategi: [
      'Lakukan reviu DIPA secara periodik (minimal triwulanan) untuk kesesuaian alokasi.',
      'Konsolidasi revisi anggaran secara internal agar frekuensi revisi minim.',
      'Batas revisi pagu tetap dihitung per semesteran (maksimal 1-2 kali per semester).'
    ],
    color: 'emerald'
  },
  {
    id: 'deviasiHal3Dipa',
    nama: '2. Deviasi Halaman III DIPA',
    aspek: 'Kualitas Perencanaan (25%)',
    bobot: '15%',
    deskripsi: 'Deviasi rata-rata tertimbang kesesuaian antara realisasi anggaran terhadap RPD bulanan per jenis belanja.',
    rumus: 'DevDIPA Tertimbang = Σ (Deviasi per Jenis Belanja × Proporsi Pagu Jenis Belanja)',
    layering: 'Ambang Batas Rata-Rata Deviasi Bulanan ≤ 5.0% = Nilai 100 | > 5.0% = Nilai 0 - 95.0',
    strategi: [
      'Mutakhirkan RPD Halaman III DIPA pada hari kerja ke-10 awal triwulan (Feb, Apr, Jul, Okt).',
      'Pastikan seluruh unit kerja melaksanakan kegiatan sesuai jadwal RPD.',
      'Jaga deviasi bulanan agar tidak melebihi 5%.'
    ],
    color: 'sky'
  },
  {
    id: 'penyerapanAnggaran',
    nama: '3. Penyerapan Anggaran',
    aspek: 'Kualitas Implementasi (50%)',
    bobot: '20%',
    deskripsi: 'Tingkat penyerapan anggaran terhadap target penyerapan triwulanan masing-masing jenis belanja.',
    rumus: 'NKPAT = Rata-rata tertimbang penyerapan vs target (B.Pegawai, B.Barang, B.Modal, B.Bansos)',
    layering: 'Target TW I (20/15/10/25%) | TW II (50/50/40/50%) | TW III (75/70/70/75%) | TW IV (95/90/90/95%)',
    strategi: [
      'Percepat belanja barang & modal sejak awal tahun anggaran.',
      'Optimalkan penyerapan proporsional setiap bulan sesuai trajektori.',
      'Jangan menumpuk pencairan anggaran di akhir tahun.'
    ],
    color: 'blue'
  },
  {
    id: 'belanjaKontraktual',
    nama: '4. Belanja Kontraktual',
    aspek: 'Kualitas Implementasi (50%)',
    bobot: '20%', // Or 10%
    bobotDetail: '10%',
    deskripsi: 'Diukur dari 3 komponen: Kontrak Pra DIPA (40%), Akselerasi Kontrak 53 (40%), Distribusi Akselerasi Kontrak (20%).',
    rumus: 'Nilai = (Pra DIPA × 40%) + (Akselerasi 53 × 40%) + (Distribusi TW II × 20%)',
    layering: 'Pra DIPA = 120 (s.d 31 Des) / 110 (1 Jan-31 Mar) | Akselerasi 53 (50-200jt) = 100 | Distribusi s.d. TW II (>75% = 100)',
    strategi: [
      'Upayakan Pengadaan Barang/Jasa (PBJ) dilaksanakan sebelum tahun anggaran (Pra DIPA).',
      'Selesaikan pengadaan sekaligus Rp50-200 juta pada Triwulan I.',
      'Daftarkan seluruh kontrak paling lambat Semester I (Rasio > 75%).'
    ],
    color: 'amber'
  },
  {
    id: 'penyelesaianTagihan',
    nama: '5. Penyelesaian Tagihan',
    aspek: 'Kualitas Implementasi (50%)',
    bobot: '10%',
    deskripsi: 'Ketepatan waktu penyampaian SPM LS Kontraktual (paling lambat 17 hari kerja sejak BAST/BAPP).',
    rumus: 'IKPA PT = (SPM LS Tepat Waktu / Total SPM LS Kontraktual) × 100',
    layering: 'Maksimal 17 Hari Kerja dari Tanggal BAST/BAPP di modul Komitmen SAKTI.',
    strategi: [
      'Segera selesaikan pembayaran begitu pekerjaan selesai, jangan menunda BAST.',
      'Perhatikan tenggat 17 HK sejak timbulnya hak tagih negara.',
      'Disiplin dalam penginputan tanggal BAST di SAKTI.'
    ],
    color: 'indigo'
  },
  {
    id: 'pengelolaanUpTup',
    nama: '6. Pengelolaan UP & TUP',
    aspek: 'Kualitas Implementasi (50%)',
    bobot: '10%',
    deskripsi: 'Komposit dari UP/TUP Tunai (90%) dan UP Kartu Kredit Pemerintah/KKP (10%). Reward 110 jika KKP capai target.',
    rumus: 'IKPA UP/TUP = (NK Tunai × 90%) + (NK KKP × 10%)',
    layering: 'UP Tunai: Waktu (50%), % GUP Disebulankan (25%), % Setoran (25%). UP KKP: Target TW I(1%), TW II(5%), TW III(9%), TW IV(12.5%)',
    strategi: [
      'Percepat revolving UP Tunai (GUP 100% disebulankan).',
      'Utamakan transaksi menggunakan KKP untuk kebutuhan operasional.',
      'Setor sisa TUP tepat waktu dan tidak melebihi batas 1 bulan.'
    ],
    color: 'purple'
  },
  {
    id: 'dispensasiSpm',
    nama: '7. Dispensasi SPM',
    aspek: 'Kualitas Implementasi (50%)',
    bobot: 'Pengurang Nilai',
    deskripsi: 'Faktor pengurang nilai IKPA berdasarkan rasio dispensasi SPM akhir tahun per 1.000 SPM (permil).',
    rumus: 'Rasio Permil = (Dispensasi SPM / Total SPM TW IV) × 1000',
    layering: '0 permil = 0 (Tanpa Pengurang) | 0.01-0.99 = -0.25 | 1-4.99 = -0.75 | ≥5.00 = -1.00',
    strategi: [
      'Hitung prognosis belanja agar tidak menumpuk di akhir tahun.',
      'Hindari pengajuan dispensasi SPM di batas akhir Desember.',
      'Tetapkan mitigasi risiko penyelesaian pekerjaan lebih awal.'
    ],
    color: 'rose'
  },
  {
    id: 'capaianOutput',
    nama: '8. Capaian Output SAKTI',
    aspek: 'Kualitas Hasil (25%)',
    bobot: '25%',
    deskripsi: 'Komposit dari Ketepatan Waktu Pelaporan (30%) dan Capaian Rincian Output / RO (70%).',
    rumus: 'IKPA CO = (NK Ketepatan Waktu × 30%) + (NK Capaian RO × 70%)',
    layering: 'Ketepatan Waktu: Max HK-5 bulan berikutnya (Tepat=100, Terlambat=0). Capaian RO: PCRO/TPCRO atau RVRO/Target RO.',
    strategi: [
      'Isi data Capaian Output bulanan secara akurat sebelum batas HK-5.',
      'Pastikan status data pada aplikasi OMSPAN telah Terkonfirmasi.',
      'Pantau gap antara realisasi anggaran dengan progres fisik (PCRO).'
    ],
    color: 'teal'
  }
];

export const Per5AnalisisView: React.FC<Per5AnalisisViewProps> = ({
  satkers,
  onSelectSatker,
  onOpenReminderWithAnalysis,
  theme,
  dashboardConfig
}) => {
  const isDark = theme === 'dark';
  
  // Selected tab inside PER-5/PB/2024 Hub
  const [activeSubTab, setActiveSubTab] = useState<'kalkulator' | 'pengetahuan' | 'reformulasi' | 'strategi'>('kalkulator');

  // Simulator mode: 'slider' or 'transaksional'
  const [simulatorMode, setSimulatorMode] = useState<'slider' | 'transaksional'>('slider');

  // Transactional Raw Inputs for Mode 2
  const [rawInputs, setRawInputs] = useState({
    // Indikator 1: Revisi DIPA
    revisiSem1: 0, // 0-1 = 110, 2 = 100, >=3 = 50
    revisiSem2: 1, // 0-1 = 110, 2 = 100, >=3 = 50
    
    // Indikator 2: Deviasi Hal III DIPA
    deviasiRataRataPct: 3.5, // % Rata-rata deviasi bulanan (<= 5% = 100)
    
    // Indikator 3: Penyerapan Anggaran
    penyerapanPegawaiPct: 95,
    penyerapanBarangPct: 88,
    penyerapanModalPct: 82,
    penyerapanBansosPct: 100,
    
    // Indikator 4: Belanja Kontraktual
    praDipaPct: 80, // % pra dipa
    akselerasi53Pct: 90, // % akselerasi 50-200jt
    distribusiTw2Pct: 85, // % distribusi s.d TW II
    
    // Indikator 5: Penyelesaian Tagihan
    spmLsTepatWaktu: 48,
    spmLsTotal: 50,
    
    // Indikator 6: Pengelolaan UP & TUP
    ketepatanGupPct: 95,
    gupDisebulankanPct: 90,
    setoranTupTepatWaktu: true,
    penggunaanKkpMencapaiTarget: true, // Bonus 110 jika true
    
    // Indikator 7: Dispensasi SPM
    dispensasiSpmCount: 0,
    totalSpmTw4Count: 150,
    
    // Indikator 8: Capaian Output
    ketepatanWaktuOutputHk5: true, // Tepat = 100, Terlambat = 0
    rataRataCapaianRoPct: 92
  });

  // Selected Satker for analysis
  const [selectedSatkerId, setSelectedSatkerId] = useState<string>(satkers[0]?.id || '');
  const [searchSatkerQuery, setSearchSatkerQuery] = useState<string>('');
  
  // Custom Slider Values for What-If Analysis
  const [customIndikator, setCustomIndikator] = useState({
    revisiDipa: 100,
    deviasiHal3Dipa: 85,
    penyerapanAnggaran: 90,
    belanjaKontraktual: 88,
    penyelesaianTagihan: 95,
    pengelolaanUpTup: 90,
    dispensasiSpm: 100, // 100 = 0 permil pengurang
    capaianOutput: 88
  });

  // Calculate scores from raw transactional inputs
  const transactionalScores = useMemo(() => {
    // 1. Revisi DIPA
    const getSkorRevisiSem = (count: number) => {
      if (count <= 1) return 110;
      if (count === 2) return 100;
      return 50;
    };
    const revisiSem1Score = getSkorRevisiSem(rawInputs.revisiSem1);
    const revisiSem2Score = getSkorRevisiSem(rawInputs.revisiSem2);
    const scoreRevisiDipa = Math.min(100, (revisiSem1Score * 0.5) + (revisiSem2Score * 0.5));

    // 2. Deviasi Hal III DIPA
    let scoreDeviasi = 100;
    if (rawInputs.deviasiRataRataPct > 5.0) {
      scoreDeviasi = Math.max(0, 100 - ((rawInputs.deviasiRataRataPct - 5.0) * 5));
    }

    // 3. Penyerapan Anggaran (Rata-rata 4 jenis belanja)
    const scorePenyerapan = Math.min(100, (
      rawInputs.penyerapanPegawaiPct * 0.25 +
      rawInputs.penyerapanBarangPct * 0.35 +
      rawInputs.penyerapanModalPct * 0.30 +
      rawInputs.penyerapanBansosPct * 0.10
    ));

    // 4. Belanja Kontraktual
    const scorePraDipa = Math.min(100, rawInputs.praDipaPct * 1.1);
    const scoreAkselerasi53 = Math.min(100, rawInputs.akselerasi53Pct);
    const scoreDistribusi = rawInputs.distribusiTw2Pct >= 75 ? 100 : Math.min(100, (rawInputs.distribusiTw2Pct / 75) * 100);
    const scoreKontraktual = (scorePraDipa * 0.4) + (scoreAkselerasi53 * 0.4) + (scoreDistribusi * 0.2);

    // 5. Penyelesaian Tagihan
    const scoreTagihan = rawInputs.spmLsTotal > 0 
      ? Math.min(100, (rawInputs.spmLsTepatWaktu / rawInputs.spmLsTotal) * 100) 
      : 100;

    // 6. Pengelolaan UP/TUP
    const scoreUpTunai = (rawInputs.ketepatanGupPct * 0.5) + (rawInputs.gupDisebulankanPct * 0.25) + (rawInputs.setoranTupTepatWaktu ? 100 * 0.25 : 50 * 0.25);
    const scoreKkp = rawInputs.penggunaanKkpMencapaiTarget ? 110 : 90;
    const scoreUpTup = (scoreUpTunai * 0.9) + (scoreKkp * 0.1);

    // 7. Dispensasi SPM (Pengurang)
    const totalSpm = rawInputs.totalSpmTw4Count > 0 ? rawInputs.totalSpmTw4Count : 1;
    const permilDispensasi = (rawInputs.dispensasiSpmCount / totalSpm) * 1000;
    let scoreDispensasi = 100;
    let pengurangDispensasiVal = 0;
    if (permilDispensasi === 0) {
      scoreDispensasi = 100;
      pengurangDispensasiVal = 0;
    } else if (permilDispensasi < 1.0) {
      scoreDispensasi = 90;
      pengurangDispensasiVal = 0.25;
    } else if (permilDispensasi < 5.0) {
      scoreDispensasi = 70;
      pengurangDispensasiVal = 0.75;
    } else {
      scoreDispensasi = 50;
      pengurangDispensasiVal = 1.00;
    }

    // 8. Capaian Output
    const scoreWaktuOutput = rawInputs.ketepatanWaktuOutputHk5 ? 100 : 0;
    const scoreCapaianOutput = (scoreWaktuOutput * 0.3) + (rawInputs.rataRataCapaianRoPct * 0.7);

    return {
      revisiDipa: scoreRevisiDipa,
      deviasiHal3Dipa: scoreDeviasi,
      penyerapanAnggaran: scorePenyerapan,
      belanjaKontraktual: scoreKontraktual,
      penyelesaianTagihan: scoreTagihan,
      pengelolaanUpTup: scoreUpTup,
      dispensasiSpm: scoreDispensasi,
      pengurangDispensasiVal,
      capaianOutput: scoreCapaianOutput
    };
  }, [rawInputs]);

  // Apply transactional calculated scores to customIndikator
  const handleApplyTransactionalToSliders = () => {
    setCustomIndikator({
      revisiDipa: Number(transactionalScores.revisiDipa.toFixed(1)),
      deviasiHal3Dipa: Number(transactionalScores.deviasiHal3Dipa.toFixed(1)),
      penyerapanAnggaran: Number(transactionalScores.penyerapanAnggaran.toFixed(1)),
      belanjaKontraktual: Number(transactionalScores.belanjaKontraktual.toFixed(1)),
      penyelesaianTagihan: Number(transactionalScores.penyelesaianTagihan.toFixed(1)),
      pengelolaanUpTup: Number(transactionalScores.pengelolaanUpTup.toFixed(1)),
      dispensasiSpm: Number(transactionalScores.dispensasiSpm.toFixed(1)),
      capaianOutput: Number(transactionalScores.capaianOutput.toFixed(1))
    });
    setSimulatorMode('slider');
  };

  const [copiedAnalysis, setCopiedAnalysis] = useState<boolean>(false);
  const [expandedInfoIndex, setExpandedInfoIndex] = useState<number | null>(null);

  // Sync customIndikator when satker selection changes
  const activeSatker = useMemo(() => {
    return satkers.find(s => s.id === selectedSatkerId) || satkers[0];
  }, [satkers, selectedSatkerId]);

  React.useEffect(() => {
    if (activeSatker) {
      setCustomIndikator({
        revisiDipa: activeSatker.indikator.revisiDipa,
        deviasiHal3Dipa: activeSatker.indikator.deviasiHal3Dipa,
        penyerapanAnggaran: activeSatker.indikator.penyerapanAnggaran,
        belanjaKontraktual: activeSatker.indikator.belanjaKontraktual,
        penyelesaianTagihan: activeSatker.indikator.penyelesaianTagihan,
        pengelolaanUpTup: activeSatker.indikator.pengelolaanUpTup,
        dispensasiSpm: activeSatker.indikator.dispensasiSpm,
        capaianOutput: activeSatker.indikator.capaianOutput
      });
    }
  }, [activeSatker]);

  // Calculate PER-5/PB/2024 Score Live based on official weights
  // Bobot: Revisi DIPA 10%, Deviasi Hal III 15%, Penyerapan 20%, Belanja Kontraktual 10%, Penyelesaian Tagihan 10%, Pengelolaan UP/TUP 10%, Capaian Output 25%.
  // Dispensasi SPM: Pengurang nilai IKPA
  const calculatedResult = useMemo(() => {
    const {
      revisiDipa,
      deviasiHal3Dipa,
      penyerapanAnggaran,
      belanjaKontraktual,
      penyelesaianTagihan,
      pengelolaanUpTup,
      dispensasiSpm,
      capaianOutput
    } = customIndikator;

    // Standard formula with PER-5/PB/2024 weights
    const subtotal = 
      (revisiDipa * 0.10) +
      (deviasiHal3Dipa * 0.15) +
      (penyerapanAnggaran * 0.20) +
      (belanjaKontraktual * 0.10) +
      (penyelesaianTagihan * 0.10) +
      (pengelolaanUpTup * 0.10) +
      (capaianOutput * 0.25);

    // Factor pengurang dispensasi SPM (jika dispensasiSpm < 100, asumsikan ada pengurang)
    let pengurangDispensasi = 0;
    if (dispensasiSpm < 70) pengurangDispensasi = 1.0;
    else if (dispensasiSpm < 85) pengurangDispensasi = 0.75;
    else if (dispensasiSpm < 95) pengurangDispensasi = 0.50;
    else if (dispensasiSpm < 100) pengurangDispensasi = 0.25;

    const totalCalculated = Math.max(0, Math.min(100, Number((subtotal - pengurangDispensasi).toFixed(2))));

    let predikatCalculated: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Kurang' = 'Sangat Baik';
    let targetPoinNext = 0;
    let nextPredikat = '';

    if (totalCalculated >= 95) {
      predikatCalculated = 'Sangat Baik';
    } else if (totalCalculated >= 89) {
      predikatCalculated = 'Baik';
      targetPoinNext = Number((95 - totalCalculated).toFixed(2));
      nextPredikat = 'Sangat Baik (≥95.00)';
    } else if (totalCalculated >= 70) {
      predikatCalculated = 'Cukup';
      targetPoinNext = Number((89 - totalCalculated).toFixed(2));
      nextPredikat = 'Baik (≥89.00)';
    } else {
      predikatCalculated = 'Kurang';
      targetPoinNext = Number((70 - totalCalculated).toFixed(2));
      nextPredikat = 'Cukup (≥70.00)';
    }

    // List lowest indicators needing attention
    const indicatorScores = [
      { id: 'revisiDipa', name: 'Revisi DIPA', score: revisiDipa, bobot: 0.10, weightName: '10%' },
      { id: 'deviasiHal3Dipa', name: 'Deviasi Hal III DIPA', score: deviasiHal3Dipa, bobot: 0.15, weightName: '15%' },
      { id: 'penyerapanAnggaran', name: 'Penyerapan Anggaran', score: penyerapanAnggaran, bobot: 0.20, weightName: '20%' },
      { id: 'belanjaKontraktual', name: 'Belanja Kontraktual', score: belanjaKontraktual, bobot: 0.10, weightName: '10%' },
      { id: 'penyelesaianTagihan', name: 'Penyelesaian Tagihan', score: penyelesaianTagihan, bobot: 0.10, weightName: '10%' },
      { id: 'pengelolaanUpTup', name: 'Pengelolaan UP/TUP', score: pengelolaanUpTup, bobot: 0.10, weightName: '10%' },
      { id: 'capaianOutput', name: 'Capaian Output', score: capaianOutput, bobot: 0.25, weightName: '25%' },
    ];

    const sortedByScore = [...indicatorScores].sort((a, b) => a.score - b.score);
    const criticalIndicators = sortedByScore.filter(i => i.score < 90);

    return {
      subtotal,
      pengurangDispensasi,
      totalCalculated,
      predikatCalculated,
      targetPoinNext,
      nextPredikat,
      indicatorScores,
      criticalIndicators
    };
  }, [customIndikator]);

  // Filter satkers by search
  const filteredSatkerList = useMemo(() => {
    if (!searchSatkerQuery) return satkers;
    const q = searchSatkerQuery.toLowerCase();
    return satkers.filter(s => 
      s.namaSatker.toLowerCase().includes(q) || 
      s.kodeSatker.includes(q) ||
      s.kementerianLembaga.toLowerCase().includes(q)
    );
  }, [satkers, searchSatkerQuery]);

  // Generate WA analysis narrative report
  const analysisReportText = useMemo(() => {
    if (!activeSatker) return '';
    return `*DIAGNOSIS & ANALISIS IKPA (PER-5/PB/2024)*
🏢 *Satker:* ${activeSatker.namaSatker} (${activeSatker.kodeSatker})
📊 *Nilai IKPA:* ${calculatedResult.totalCalculated.toFixed(2)} (${calculatedResult.predikatCalculated})

*Rincian Skor Indikator (Reformulasi 2024):*
1. Revisi DIPA (10%): ${customIndikator.revisiDipa.toFixed(1)}
2. Deviasi Hal III DIPA (15%): ${customIndikator.deviasiHal3Dipa.toFixed(1)}
3. Penyerapan Anggaran (20%): ${customIndikator.penyerapanAnggaran.toFixed(1)}
4. Belanja Kontraktual (10%): ${customIndikator.belanjaKontraktual.toFixed(1)}
5. Penyelesaian Tagihan (10%): ${customIndikator.penyelesaianTagihan.toFixed(1)}
6. Pengelolaan UP & TUP (10%): ${customIndikator.pengelolaanUpTup.toFixed(1)}
7. Capaian Output SAKTI (25%): ${customIndikator.capaianOutput.toFixed(1)}
8. Dispensasi SPM: ${customIndikator.dispensasiSpm >= 100 ? 'Nihil (0.00)' : `Pengurang -${calculatedResult.pengurangDispensasi}`}

📌 *Rekomendasi Langkah Akselerasi PER-5/PB/2024:*
${calculatedResult.criticalIndicators.length === 0 
  ? '✅ Seluruh indikator telah sangat baik (≥90)! Pertahankan disiplin pelaporan.'
  : calculatedResult.criticalIndicators.map((ci, idx) => {
      const matchInfo = PER5_INDIKATOR_INFO.find(info => info.id === ci.id);
      return `${idx + 1}. *${ci.name}* (Skor: ${ci.score.toFixed(1)}): ${matchInfo?.strategi[0] || 'Tingkatkan kinerja pelaporan.'}`;
    }).join('\n')
}

Dibuat otomatis oleh Sistem Monitoring IKPA KPPN Semarang I (PER-5/PB/2024)`;
  }, [activeSatker, customIndikator, calculatedResult]);

  const handleCopyReport = () => {
    navigator.clipboard.writeText(analysisReportText);
    setCopiedAnalysis(true);
    setTimeout(() => setCopiedAnalysis(false), 2500);
  };

  const handleResetSliders = () => {
    if (activeSatker) {
      setCustomIndikator({
        revisiDipa: activeSatker.indikator.revisiDipa,
        deviasiHal3Dipa: activeSatker.indikator.deviasiHal3Dipa,
        penyerapanAnggaran: activeSatker.indikator.penyerapanAnggaran,
        belanjaKontraktual: activeSatker.indikator.belanjaKontraktual,
        penyelesaianTagihan: activeSatker.indikator.penyelesaianTagihan,
        pengelolaanUpTup: activeSatker.indikator.pengelolaanUpTup,
        dispensasiSpm: activeSatker.indikator.dispensasiSpm,
        capaianOutput: activeSatker.indikator.capaianOutput
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner Header PER-5/PB/2024 */}
      <div className={`p-6 sm:p-8 rounded-3xl border shadow-xl relative overflow-hidden ${
        isDark 
          ? 'bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950/80 border-slate-800 text-white' 
          : 'bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 border-emerald-800 text-white shadow-emerald-950/20'
      }`}>
        {/* Glow decoration */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{dashboardConfig?.customTexts?.per5Badge || 'Petunjuk Teknis Resmi PER-5/PB/2024'}</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-800/80 text-amber-200 border border-amber-500/30">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>Data Diperbarui: <strong className="text-white">{dashboardConfig?.updateDates?.per5Analisis || '07 Agustus 2026'}</strong></span>
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
              {dashboardConfig?.customTexts?.per5Title || 'Pusat Pengetahuan & Engine Analisis IKPA 2024'}
            </h1>
            <p className="text-sm text-slate-200 leading-relaxed">
              {dashboardConfig?.customTexts?.per5Subtitle || 'Panduan lengkap reformasi IKPA berdasarkan PER-5/PB/2024, formula perhitungan otomatis, simulasi dampak, dan rekomendasi langkah konkret.'}
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-3 shrink-0">
            <button
              onClick={() => setActiveSubTab('kalkulator')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
                activeSubTab === 'kalkulator'
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30 font-black'
                  : 'bg-white/15 text-slate-100 hover:bg-white/25 border border-white/20'
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span>Engine Analisis</span>
            </button>

            <button
              onClick={() => setActiveSubTab('pengetahuan')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
                activeSubTab === 'pengetahuan'
                  ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/30 font-black'
                  : 'bg-white/15 text-slate-100 hover:bg-white/25 border border-white/20'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>8 Indikator &amp; Rumus</span>
            </button>

            <button
              onClick={() => setActiveSubTab('reformulasi')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
                activeSubTab === 'reformulasi'
                  ? 'bg-sky-400 text-slate-950 shadow-lg shadow-sky-400/30 font-black'
                  : 'bg-white/15 text-slate-100 hover:bg-white/25 border border-white/20'
              }`}
            >
              <BarChart2 className="w-4 h-4" />
              <span>Komparasi 2022 vs 2024</span>
            </button>
          </div>
        </div>

        {/* Sub Navigation Bar */}
        <div className="mt-6 pt-4 border-t border-slate-700/60 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveSubTab('kalkulator')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
              activeSubTab === 'kalkulator' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-slate-300 hover:text-white'
            }`}
          >
            🧮 Engine Analisis &amp; Simulator
          </button>
          <button
            onClick={() => setActiveSubTab('pengetahuan')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
              activeSubTab === 'pengetahuan' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-300 hover:text-white'
            }`}
          >
            📚 Panduan 8 Indikator PER-5/PB/2024
          </button>
          <button
            onClick={() => setActiveSubTab('reformulasi')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
              activeSubTab === 'reformulasi' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' : 'text-slate-300 hover:text-white'
            }`}
          >
            🔄 Reformulasi &amp; Komparasi Regulasi
          </button>
          <button
            onClick={() => setActiveSubTab('strategi')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
              activeSubTab === 'strategi' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'text-slate-300 hover:text-white'
            }`}
          >
            💡 Strategi Optimalisasi Official DJPb
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: ENGINE ANALISIS & SIMULATOR WHAT-IF */}
      {activeSubTab === 'kalkulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Satker Picker & Indicator Sliders */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Satker Selection Card */}
            <div className={`p-5 rounded-2xl border ${
              isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className={`text-base font-bold flex items-center gap-2 ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                    <Search className="w-4 h-4 text-emerald-500" />
                    <span>Pilih Satker Kerja</span>
                  </h3>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-700 font-semibold'}`}>
                    Pilih satker untuk memuat skor indikator terkini dan lakukan simulasi what-if
                  </p>
                </div>

                <button
                  onClick={handleResetSliders}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border cursor-pointer self-start sm:self-auto transition-colors ${
                    isDark 
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' 
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Nilai Awal</span>
                </button>
              </div>

              {/* Search Satker Input & Dropdown */}
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Ketik Kode / Nama Satker..."
                  value={searchSatkerQuery}
                  onChange={(e) => setSearchSatkerQuery(e.target.value)}
                  className={`w-full px-3.5 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                  }`}
                />

                <select
                  value={selectedSatkerId}
                  onChange={(e) => setSelectedSatkerId(e.target.value)}
                  className={`w-full px-3.5 py-2.5 text-xs font-bold rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900 shadow-xs'
                  }`}
                >
                  {filteredSatkerList.map(s => (
                    <option key={s.id} value={s.id}>
                      [{s.kodeSatker}] {s.namaSatker} — Total: {s.nilaiTotalIKPA.toFixed(2)} ({s.predikat})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Interactive Sliders / Transactional Simulator Card */}
            <div className={`p-5 sm:p-6 rounded-2xl border space-y-5 ${
              isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
            }`}>
              <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 ${
                isDark ? 'border-slate-800' : 'border-slate-200'
              }`}>
                <div className="flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-amber-500" />
                  <div>
                    <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Simulasi Indikator PER-5/PB/2024
                    </h3>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-700 font-semibold'}`}>
                      Pilih mode simulasi gesper cepat atau kalkulator parameter riil
                    </p>
                  </div>
                </div>

                {/* Mode Selector Toggle */}
                <div className={`flex items-center p-1 rounded-xl border shrink-0 ${
                  isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-100 border-slate-300'
                }`}>
                  <button
                    onClick={() => setSimulatorMode('slider')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      simulatorMode === 'slider'
                        ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                        : isDark ? 'text-slate-300 hover:text-white' : 'text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    🎚️ Gesper Skor
                  </button>
                  <button
                    onClick={() => setSimulatorMode('transaksional')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      simulatorMode === 'transaksional'
                        ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                        : isDark ? 'text-slate-300 hover:text-white' : 'text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    🧮 Parameter Riil Satker
                  </button>
                </div>
              </div>

              {/* MODE 1: SLIDER GESPER SKOR */}
              {simulatorMode === 'slider' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* 1. Revisi DIPA (10%) */}
                  <div className={`p-3.5 rounded-xl border space-y-2 ${
                    isDark ? 'bg-slate-800/50 border-slate-700/60' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>1. Revisi DIPA (10%)</span>
                      <span className="font-mono font-bold text-emerald-500 dark:text-emerald-400">{customIndikator.revisiDipa.toFixed(1)}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="0.5"
                      value={customIndikator.revisiDipa}
                      onChange={(e) => setCustomIndikator({ ...customIndikator, revisiDipa: parseFloat(e.target.value) })}
                      className={`w-full accent-emerald-500 cursor-pointer h-1.5 rounded-lg ${
                        isDark ? 'bg-slate-700' : 'bg-slate-200'
                      }`}
                    />
                    <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-700 font-semibold'}`}>Pagu Tetap Semesteran (0-1 revisi=110, 2=100, ≥3=50)</p>
                  </div>

                  {/* 2. Deviasi Hal III DIPA (15%) */}
                  <div className={`p-3.5 rounded-xl border space-y-2 ${
                    isDark ? 'bg-slate-800/50 border-slate-700/60' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>2. Deviasi Hal III (15%)</span>
                      <span className="font-mono font-bold text-sky-500 dark:text-sky-400">{customIndikator.deviasiHal3Dipa.toFixed(1)}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="0.5"
                      value={customIndikator.deviasiHal3Dipa}
                      onChange={(e) => setCustomIndikator({ ...customIndikator, deviasiHal3Dipa: parseFloat(e.target.value) })}
                      className={`w-full accent-sky-500 cursor-pointer h-1.5 rounded-lg ${
                        isDark ? 'bg-slate-700' : 'bg-slate-200'
                      }`}
                    />
                    <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-700 font-semibold'}`}>Deviasi RPD Tertimbang (Target Rata-Rata Deviasi ≤ 5.0%)</p>
                  </div>

                  {/* 3. Penyerapan Anggaran (20%) */}
                  <div className={`p-3.5 rounded-xl border space-y-2 ${
                    isDark ? 'bg-slate-800/50 border-slate-700/60' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>3. Penyerapan Anggaran (20%)</span>
                      <span className="font-mono font-bold text-blue-500 dark:text-blue-400">{customIndikator.penyerapanAnggaran.toFixed(1)}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="0.5"
                      value={customIndikator.penyerapanAnggaran}
                      onChange={(e) => setCustomIndikator({ ...customIndikator, penyerapanAnggaran: parseFloat(e.target.value) })}
                      className={`w-full accent-blue-500 cursor-pointer h-1.5 rounded-lg ${
                        isDark ? 'bg-slate-700' : 'bg-slate-200'
                      }`}
                    />
                    <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-700 font-semibold'}`}>Rata-rata tertimbang realisasi vs target per TW</p>
                  </div>

                  {/* 4. Belanja Kontraktual (10%) */}
                  <div className={`p-3.5 rounded-xl border space-y-2 ${
                    isDark ? 'bg-slate-800/50 border-slate-700/60' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>4. Belanja Kontraktual (10%)</span>
                      <span className="font-mono font-bold text-amber-500 dark:text-amber-400">{customIndikator.belanjaKontraktual.toFixed(1)}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="0.5"
                      value={customIndikator.belanjaKontraktual}
                      onChange={(e) => setCustomIndikator({ ...customIndikator, belanjaKontraktual: parseFloat(e.target.value) })}
                      className={`w-full accent-amber-500 cursor-pointer h-1.5 rounded-lg ${
                        isDark ? 'bg-slate-700' : 'bg-slate-200'
                      }`}
                    />
                    <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-700 font-semibold'}`}>Pra DIPA (40%), Akselerasi 53 (40%), Distribusi TW II (20%)</p>
                  </div>

                  {/* 5. Penyelesaian Tagihan (10%) */}
                  <div className={`p-3.5 rounded-xl border space-y-2 ${
                    isDark ? 'bg-slate-800/50 border-slate-700/60' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>5. Penyelesaian Tagihan (10%)</span>
                      <span className="font-mono font-bold text-indigo-500 dark:text-indigo-400">{customIndikator.penyelesaianTagihan.toFixed(1)}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="0.5"
                      value={customIndikator.penyelesaianTagihan}
                      onChange={(e) => setCustomIndikator({ ...customIndikator, penyelesaianTagihan: parseFloat(e.target.value) })}
                      className={`w-full accent-indigo-500 cursor-pointer h-1.5 rounded-lg ${
                        isDark ? 'bg-slate-700' : 'bg-slate-200'
                      }`}
                    />
                    <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-700 font-semibold'}`}>SPM LS Kontraktual Tepat Waktu ≤ 17 Hari Kerja BAST</p>
                  </div>

                  {/* 6. Pengelolaan UP/TUP (10%) */}
                  <div className={`p-3.5 rounded-xl border space-y-2 ${
                    isDark ? 'bg-slate-800/50 border-slate-700/60' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>6. Pengelolaan UP &amp; TUP (10%)</span>
                      <span className="font-mono font-bold text-purple-500 dark:text-purple-400">{customIndikator.pengelolaanUpTup.toFixed(1)}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="0.5"
                      value={customIndikator.pengelolaanUpTup}
                      onChange={(e) => setCustomIndikator({ ...customIndikator, pengelolaanUpTup: parseFloat(e.target.value) })}
                      className={`w-full accent-purple-500 cursor-pointer h-1.5 rounded-lg ${
                        isDark ? 'bg-slate-700' : 'bg-slate-200'
                      }`}
                    />
                    <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-700 font-semibold'}`}>UP Tunai (90%) + UP KKP (10% reward 110 jika capai target)</p>
                  </div>

                  {/* 7. Capaian Output (25%) */}
                  <div className={`p-3.5 rounded-xl border space-y-2 col-span-1 sm:col-span-2 ${
                    isDark ? 'bg-slate-800/50 border-slate-700/60' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>7. Capaian Output SAKTI (25%)</span>
                      <span className="font-mono font-bold text-teal-500 dark:text-teal-400">{customIndikator.capaianOutput.toFixed(1)}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="0.5"
                      value={customIndikator.capaianOutput}
                      onChange={(e) => setCustomIndikator({ ...customIndikator, capaianOutput: parseFloat(e.target.value) })}
                      className={`w-full accent-teal-500 cursor-pointer h-1.5 rounded-lg ${
                        isDark ? 'bg-slate-700' : 'bg-slate-200'
                      }`}
                    />
                    <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-700 font-semibold'}`}>Ketepatan Waktu Pelaporan HK-5 (30%) + Capaian RO (70%)</p>
                  </div>

                </div>
              )}

              {/* MODE 2: KALKULATOR PARAMETER RIIL TRANSACTIONAL */}
              {simulatorMode === 'transaksional' && (
                <div className="space-y-5">
                  <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
                    isDark ? 'bg-amber-950/40 border-amber-800/60 text-amber-200' : 'bg-amber-50 border-amber-300 text-amber-950'
                  }`}>
                    <div className="flex items-center gap-2 text-xs">
                      <Calculator className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>Inputkan data transaksi nyata satker Anda di bawah ini untuk menghitung otomatis 8 indikator sesuai formula PER-5/PB/2024:</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    
                    {/* Input 1: Revisi DIPA */}
                    <div className={`p-3.5 rounded-xl border space-y-2.5 ${
                      isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="flex justify-between items-center font-bold">
                        <span>1. Jumlah Revisi Pagu Tetap DIPA</span>
                        <span className="font-mono text-emerald-500 font-black">{transactionalScores.revisiDipa.toFixed(1)} pt</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className={`block text-[10px] mb-1 font-black ${isDark ? 'text-slate-400' : 'text-slate-950'}`}>Revisi Semester 1</label>
                          <input
                            type="number"
                            min="0"
                            max="10"
                            value={rawInputs.revisiSem1}
                            onChange={(e) => setRawInputs({ ...rawInputs, revisiSem1: parseInt(e.target.value) || 0 })}
                            className={`w-full p-2 rounded-lg border font-mono font-bold text-center ${
                              isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-400 text-slate-950 font-black'
                            }`}
                          />
                        </div>
                        <div>
                          <label className={`block text-[10px] mb-1 font-black ${isDark ? 'text-slate-400' : 'text-slate-950'}`}>Revisi Semester 2</label>
                          <input
                            type="number"
                            min="0"
                            max="10"
                            value={rawInputs.revisiSem2}
                            onChange={(e) => setRawInputs({ ...rawInputs, revisiSem2: parseInt(e.target.value) || 0 })}
                            className={`w-full p-2 rounded-lg border font-mono font-bold text-center ${
                              isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-400 text-slate-950 font-black'
                            }`}
                          />
                        </div>
                      </div>
                      <p className={`text-[10px] font-extrabold ${isDark ? 'text-slate-400' : 'text-slate-900'}`}>Aturan PER-5: 0-1 revisi = Nilai 110 | 2 revisi = Nilai 100 | ≥3 = Nilai 50</p>
                    </div>

                    {/* Input 2: Deviasi Hal III DIPA */}
                    <div className={`p-3.5 rounded-xl border space-y-2.5 ${
                      isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-300'
                    }`}>
                      <div className="flex justify-between items-center font-bold">
                        <span>2. Rata-Rata Deviasi Hal III DIPA (%)</span>
                        <span className="font-mono text-sky-500 font-black">{transactionalScores.deviasiHal3Dipa.toFixed(1)} pt</span>
                      </div>
                      <div>
                        <label className={`block text-[10px] mb-1 font-black ${isDark ? 'text-slate-400' : 'text-slate-950'}`}>Rata-rata % Deviasi RPD vs Realisasi</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="50"
                            value={rawInputs.deviasiRataRataPct}
                            onChange={(e) => setRawInputs({ ...rawInputs, deviasiRataRataPct: parseFloat(e.target.value) || 0 })}
                            className={`w-full p-2 rounded-lg border font-mono font-bold ${
                              isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-400 text-slate-950 font-black'
                            }`}
                          />
                          <span className={`font-black ${isDark ? 'text-slate-400' : 'text-slate-950'}`}>%</span>
                        </div>
                      </div>
                      <p className={`text-[10px] font-extrabold ${isDark ? 'text-slate-400' : 'text-slate-900'}`}>Toleransi maksimal PER-5 adalah ≤ 5.0% untuk memperoleh nilai 100.</p>
                    </div>

                    {/* Input 3: Penyerapan Anggaran */}
                    <div className={`p-3.5 rounded-xl border space-y-2.5 ${
                      isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-300'
                    }`}>
                      <div className="flex justify-between items-center font-bold">
                        <span>3. Realisasi Anggaran vs Target (% Capaian)</span>
                        <span className="font-mono text-blue-500 font-black">{transactionalScores.penyerapanAnggaran.toFixed(1)} pt</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className={`block text-[10px] mb-1 font-black ${isDark ? 'text-slate-400' : 'text-slate-950'}`}>Pegawai (51) %</label>
                          <input
                            type="number"
                            value={rawInputs.penyerapanPegawaiPct}
                            onChange={(e) => setRawInputs({ ...rawInputs, penyerapanPegawaiPct: parseFloat(e.target.value) || 0 })}
                            className={`w-full p-1.5 rounded-lg border font-mono text-center font-bold ${
                              isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-400 text-slate-950 font-black'
                            }`}
                          />
                        </div>
                        <div>
                          <label className={`block text-[10px] mb-1 font-black ${isDark ? 'text-slate-400' : 'text-slate-950'}`}>Barang (52) %</label>
                          <input
                            type="number"
                            value={rawInputs.penyerapanBarangPct}
                            onChange={(e) => setRawInputs({ ...rawInputs, penyerapanBarangPct: parseFloat(e.target.value) || 0 })}
                            className={`w-full p-1.5 rounded-lg border font-mono text-center font-bold ${
                              isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-400 text-slate-950 font-black'
                            }`}
                          />
                        </div>
                        <div>
                          <label className={`block text-[10px] mb-1 font-black ${isDark ? 'text-slate-400' : 'text-slate-950'}`}>Modal (53) %</label>
                          <input
                            type="number"
                            value={rawInputs.penyerapanModalPct}
                            onChange={(e) => setRawInputs({ ...rawInputs, penyerapanModalPct: parseFloat(e.target.value) || 0 })}
                            className={`w-full p-1.5 rounded-lg border font-mono text-center font-bold ${
                              isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-400 text-slate-950 font-black'
                            }`}
                          />
                        </div>
                        <div>
                          <label className={`block text-[10px] mb-1 font-black ${isDark ? 'text-slate-400' : 'text-slate-950'}`}>Bansos (57) %</label>
                          <input
                            type="number"
                            value={rawInputs.penyerapanBansosPct}
                            onChange={(e) => setRawInputs({ ...rawInputs, penyerapanBansosPct: parseFloat(e.target.value) || 0 })}
                            className={`w-full p-1.5 rounded-lg border font-mono text-center font-bold ${
                              isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-400 text-slate-950 font-black'
                            }`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Input 5: Penyelesaian Tagihan */}
                    <div className={`p-3.5 rounded-xl border space-y-2.5 ${
                      isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-300'
                    }`}>
                      <div className="flex justify-between items-center font-bold">
                        <span>5. Ketepatan SPM LS Kontraktual (≤ 17 HK)</span>
                        <span className="font-mono text-indigo-500 font-black">{transactionalScores.penyelesaianTagihan.toFixed(1)} pt</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className={`block text-[10px] mb-1 font-black ${isDark ? 'text-slate-400' : 'text-slate-950'}`}>SPM Tepat Waktu</label>
                          <input
                            type="number"
                            value={rawInputs.spmLsTepatWaktu}
                            onChange={(e) => setRawInputs({ ...rawInputs, spmLsTepatWaktu: parseInt(e.target.value) || 0 })}
                            className={`w-full p-2 rounded-lg border font-mono text-center font-bold ${
                              isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-400 text-slate-950 font-black'
                            }`}
                          />
                        </div>
                        <div>
                          <label className={`block text-[10px] mb-1 font-black ${isDark ? 'text-slate-400' : 'text-slate-950'}`}>Total SPM LS</label>
                          <input
                            type="number"
                            value={rawInputs.spmLsTotal}
                            onChange={(e) => setRawInputs({ ...rawInputs, spmLsTotal: parseInt(e.target.value) || 0 })}
                            className={`w-full p-2 rounded-lg border font-mono text-center font-bold ${
                              isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-400 text-slate-950 font-black'
                            }`}
                          />
                        </div>
                      </div>
                      <p className={`text-[10px] font-extrabold ${isDark ? 'text-slate-400' : 'text-slate-900'}`}>Rasio SPM LS tepat waktu dihitung sejak tanggal BAST/BAPP di SAKTI.</p>
                    </div>

                    {/* Input 6: Pengelolaan UP & TUP */}
                    <div className={`p-3.5 rounded-xl border space-y-2.5 ${
                      isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="flex justify-between items-center font-bold">
                        <span>6. Pengelolaan UP/TUP &amp; KKP</span>
                        <span className="font-mono text-purple-500 font-black">{transactionalScores.pengelolaanUpTup.toFixed(1)} pt</span>
                      </div>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer pt-1">
                          <input
                            type="checkbox"
                            checked={rawInputs.penggunaanKkpMencapaiTarget}
                            onChange={(e) => setRawInputs({ ...rawInputs, penggunaanKkpMencapaiTarget: e.target.checked })}
                            className="w-4 h-4 accent-amber-500 cursor-pointer"
                          />
                          <span className="text-xs font-semibold text-amber-500 dark:text-amber-300">Penggunaan KKP Capai Target TW (Reward Nilai 110)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={rawInputs.setoranTupTepatWaktu}
                            onChange={(e) => setRawInputs({ ...rawInputs, setoranTupTepatWaktu: e.target.checked })}
                            className="w-4 h-4 accent-emerald-500 cursor-pointer"
                          />
                          <span className="text-xs">Setoran Sisa TUP Tepat Waktu (≤ 1 Bulan)</span>
                        </label>
                      </div>
                    </div>

                    {/* Input 8: Capaian Output */}
                    <div className={`p-3.5 rounded-xl border space-y-2.5 ${
                      isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="flex justify-between items-center font-bold">
                        <span>8. Capaian Output SAKTI</span>
                        <span className="font-mono text-teal-500 font-black">{transactionalScores.capaianOutput.toFixed(1)} pt</span>
                      </div>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={rawInputs.ketepatanWaktuOutputHk5}
                            onChange={(e) => setRawInputs({ ...rawInputs, ketepatanWaktuOutputHk5: e.target.checked })}
                            className="w-4 h-4 accent-teal-500 cursor-pointer"
                          />
                          <span className="text-xs font-semibold">Lapor Tepat Waktu (s.d Hari Kerja ke-5 bulan berikutnya)</span>
                        </label>
                        <div>
                          <label className={`block text-[10px] mb-1 font-black ${isDark ? 'text-slate-400' : 'text-slate-950'}`}>Rata-Rata Capaian Rincian Output (RO) %</label>
                          <input
                            type="number"
                            value={rawInputs.rataRataCapaianRoPct}
                            onChange={(e) => setRawInputs({ ...rawInputs, rataRataCapaianRoPct: parseFloat(e.target.value) || 0 })}
                            className={`w-full p-2 rounded-lg border font-mono text-center font-bold ${
                              isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-400 text-slate-950 font-black'
                            }`}
                          />
                        </div>
                      </div>
                    </div>

                  </div>

                  <button
                    onClick={handleApplyTransactionalToSliders}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer hover:from-emerald-400 hover:to-teal-500 transition-all"
                  >
                    <Check className="w-4 h-4" />
                    <span>Terapkan Hasil Kalkulator Parameter ini ke Dashboard Utama</span>
                  </button>
                </div>
              )}

            </div>

          </div>

          {/* Right Column: Live PER-5/PB/2024 Score & Diagnostic Report */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Calculation Result Score Card */}
            <div className={`p-6 rounded-3xl border shadow-xl relative overflow-hidden ${
              isDark 
                ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border-slate-800 text-white' 
                : 'bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border-slate-800 text-white'
            }`}>
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base font-bold">Hasil Perhitungan PER-5/PB/2024</h3>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700">
                  Resmi DJPb
                </span>
              </div>

              <div className="text-center py-4 space-y-2">
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Proyeksi Nilai Total IKPA</p>
                <div className="text-5xl font-black font-mono text-emerald-400 tracking-tight">
                  {calculatedResult.totalCalculated.toFixed(2)}
                </div>

                <div className="pt-2 flex items-center justify-center gap-2">
                  <span className={`px-4 py-1.5 rounded-full text-xs font-black shadow-md ${
                    calculatedResult.predikatCalculated === 'Sangat Baik' ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/30' :
                    calculatedResult.predikatCalculated === 'Baik' ? 'bg-sky-500 text-slate-950 shadow-sky-500/30' :
                    calculatedResult.predikatCalculated === 'Cukup' ? 'bg-amber-400 text-slate-950 shadow-amber-400/30' :
                    'bg-rose-600 text-white shadow-rose-600/30'
                  }`}>
                    {calculatedResult.predikatCalculated}
                  </span>
                </div>

                {calculatedResult.targetPoinNext > 0 && (
                  <p className="text-xs text-amber-300 pt-2 flex items-center justify-center gap-1 font-medium">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Butuh <strong>+{calculatedResult.targetPoinNext}</strong> poin untuk predikat <strong>{calculatedResult.nextPredikat}</strong></span>
                  </p>
                )}
              </div>

              {/* Breakdown List */}
              <div className="mt-4 pt-4 border-t border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal Bobot (8 Indikator):</span>
                  <span className="font-mono text-slate-200">{calculatedResult.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Dispensasi SPM (Pengurang Permil):</span>
                  <span className="font-mono text-rose-400">-{calculatedResult.pengurangDispensasi.toFixed(2)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleCopyReport}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-600/30"
                >
                  {copiedAnalysis ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedAnalysis ? 'Laporan Terapikopi!' : 'Salin Diagnosis WA'}</span>
                </button>

                {onOpenReminderWithAnalysis && activeSatker && (
                  <button
                    onClick={() => onOpenReminderWithAnalysis(activeSatker, analysisReportText)}
                    className="py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-purple-600/30"
                  >
                    <ArrowRight className="w-4 h-4" />
                    <span>Kirim Pengingat WA</span>
                  </button>
                )}
              </div>
            </div>

            {/* Critical Recommendation Panel */}
            <div className={`p-5 rounded-2xl border space-y-4 ${
              isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
            }`}>
              <div className={`flex items-center gap-2 border-b pb-3 ${
                isDark ? 'border-slate-800' : 'border-slate-200'
              }`}>
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Rekomendasi Akselerasi PER-5/PB/2024
                </h4>
              </div>

              {calculatedResult.criticalIndicators.length === 0 ? (
                <div className={`p-4 rounded-xl text-xs flex items-start gap-2 border ${
                  isDark 
                    ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300' 
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900 font-medium'
                }`}>
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
                  <span>Seluruh 8 Indikator IKPA telah dalam kondisi sangat prima (Skor ≥ 90)! Pertahankan kepatuhan &amp; kedisiplinan pelaporan.</span>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Berikut indikator berkinerja rendah (&lt;90) yang perlu segera ditindaklanjuti sesuai petunjuk PER-5/PB/2024:
                  </p>

                  {calculatedResult.criticalIndicators.map(ci => {
                    const info = PER5_INDIKATOR_INFO.find(i => i.id === ci.id);
                    return (
                      <div key={ci.id} className={`p-3.5 rounded-xl border space-y-2 ${
                        isDark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-rose-50/70 border-rose-200/80'
                      }`}>
                        <div className="flex items-center justify-between text-xs">
                          <span className={`font-bold flex items-center gap-1.5 ${
                            isDark ? 'text-rose-300' : 'text-rose-700'
                          }`}>
                            <span className="w-2 h-2 rounded-full bg-rose-500" />
                            {ci.name} ({ci.weightName})
                          </span>
                          <span className={`font-mono font-bold px-2 py-0.5 rounded border ${
                            isDark ? 'text-rose-400 bg-rose-950/80 border-rose-800' : 'text-rose-700 bg-rose-100 border-rose-300'
                          }`}>
                            {ci.score.toFixed(1)}
                          </span>
                        </div>

                        <ul className={`space-y-1 text-[11px] pl-4 list-disc ${
                          isDark ? 'text-slate-300' : 'text-slate-700'
                        }`}>
                          {info?.strategi.map((s, idx) => (
                            <li key={idx}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* SUB-TAB 2: PANDUAN 8 INDIKATOR PER-5/PB/2024 */}
      {activeSubTab === 'pengetahuan' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {PER5_INDIKATOR_INFO.map((info, idx) => {
              const isExpanded = expandedInfoIndex === idx;
              return (
                <div
                  key={info.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        isDark 
                          ? 'bg-slate-800 text-emerald-400 border-slate-700' 
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}>
                        {info.aspek}
                      </span>
                      <h3 className={`text-base font-bold pt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{info.nama}</h3>
                    </div>

                    <span className="text-xs font-mono font-bold px-3 py-1 rounded-xl bg-amber-500/20 text-amber-500 dark:text-amber-300 border border-amber-500/40">
                      Bobot {info.bobot}
                    </span>
                  </div>

                  <p className={`text-xs mt-3 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-800 font-medium'}`}>
                    {info.deskripsi}
                  </p>

                  <div className={`mt-3 p-3 rounded-xl border font-mono text-[11px] ${
                    isDark 
                      ? 'bg-slate-950/80 border-slate-800 text-emerald-300' 
                      : 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                  }`}>
                    <span className={`block text-[10px] mb-0.5 font-sans font-bold ${
                      isDark ? 'text-slate-400' : 'text-slate-700'
                    }`}>
                      Rumus Formulatif PER-5/PB/2024:
                    </span>
                    {info.rumus}
                  </div>

                  {/* Expandable Section for Detailed Rules & Strategies */}
                  <div className={`mt-4 pt-3 border-t flex items-center justify-between ${
                    isDark ? 'border-slate-800' : 'border-slate-200'
                  }`}>
                    <span className={`text-[11px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>
                      Detail Ketentuan &amp; Layering
                    </span>
                    <button
                      onClick={() => setExpandedInfoIndex(isExpanded ? null : idx)}
                      className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 flex items-center gap-1 cursor-pointer"
                    >
                      <span>{isExpanded ? 'Tutup' : 'Lihat Detail'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {isExpanded && (
                    <div
                      className={`mt-3 space-y-3 pt-3 border-t text-xs animate-in fade-in duration-150 ${
                        isDark ? 'border-slate-800/60' : 'border-slate-200'
                      }`}
                    >
                      <div className={`p-3 rounded-xl border ${
                        isDark 
                          ? 'bg-slate-800/50 border-slate-700/60 text-slate-300' 
                          : 'bg-amber-50/80 border-amber-200/80 text-amber-950'
                      }`}>
                        <span className="font-bold text-amber-600 dark:text-amber-300 block mb-1">Ketentuan Layering / Batas:</span>
                        <p className="text-[11px] leading-relaxed">{info.layering}</p>
                      </div>

                      <div className={`p-3 rounded-xl border space-y-1.5 ${
                        isDark 
                          ? 'bg-emerald-950/30 border-emerald-800/40 text-slate-300' 
                          : 'bg-emerald-50/90 border-emerald-200/90 text-emerald-950'
                      }`}>
                        <span className="font-bold text-emerald-700 dark:text-emerald-300 block">Langkah Strategis Satker (Slide 40-41):</span>
                        <ul className="list-disc pl-4 space-y-1 text-[11px]">
                          {info.strategi.map((st, i) => (
                            <li key={i}>{st}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: REFORMULASI & KOMPARASI REGULASI 2022 VS 2024 */}
      {activeSubTab === 'reformulasi' && (
        <div className="space-y-6">
          <div className={`p-6 rounded-2xl border ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
          }`}>
            <h3 className={`text-lg font-bold flex items-center gap-2 mb-2 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              <BarChart2 className="w-5 h-5 text-sky-500 dark:text-sky-400" />
              <span>Matriks Perubahan Reformulasi IKPA (PER-5/PB/2024 vs 2022/2023)</span>
            </h3>
            <p className={`text-xs mb-6 ${isDark ? 'text-slate-400' : 'text-slate-800 font-medium'}`}>
              Ringkasan perbedaan utama formula dan penilaian indikator kinerja pelaksanaan anggaran berdasarkan Slide 16 Petunjuk Teknis PER-5/PB/2024.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className={`uppercase font-bold text-[11px] ${
                  isDark ? 'bg-slate-800/90 text-slate-200' : 'bg-slate-100 text-slate-800 border-b border-slate-300'
                }`}>
                  <tr>
                    <th className="p-3.5 rounded-l-xl">No</th>
                    <th className="p-3.5">Indikator IKPA</th>
                    <th className="p-3.5">Ketentuan TA 2022/2023</th>
                    <th className={`p-3.5 rounded-r-xl ${
                      isDark ? 'text-emerald-300 bg-emerald-950/80' : 'text-emerald-900 bg-emerald-100 border-b border-emerald-300'
                    }`}>Reformulasi PER-5/PB/2024</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-200'}`}>
                  <tr>
                    <td className="p-3.5 font-bold">1</td>
                    <td className={`p-3.5 font-bold ${isDark ? 'text-slate-200' : 'text-slate-950'}`}>Revisi DIPA</td>
                    <td className={`p-3.5 ${isDark ? 'text-slate-400' : 'text-slate-900 font-bold'}`}>Pengendalian revisi pagu tetap secara triwulanan</td>
                    <td className={`p-3.5 font-bold ${
                      isDark ? 'text-emerald-300 bg-emerald-950/30' : 'text-emerald-950 bg-emerald-50 border-l border-emerald-300'
                    }`}>Pengendalian revisi pagu tetap secara <strong>semesteran</strong> (14 jenis revisi pagu tetap).</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-bold">2</td>
                    <td className={`p-3.5 font-bold ${isDark ? 'text-slate-200' : 'text-slate-950'}`}>Deviasi Hal III DIPA</td>
                    <td className={`p-3.5 ${isDark ? 'text-slate-400' : 'text-slate-900 font-bold'}`}>Deviasi bulanan dihitung berdasarkan rata-rata aritmatik</td>
                    <td className={`p-3.5 font-bold ${
                      isDark ? 'text-emerald-300 bg-emerald-950/30' : 'text-emerald-950 bg-emerald-50 border-l border-emerald-300'
                    }`}>Deviasi bulanan dihitung berdasarkan <strong>rata-rata tertimbang</strong> proporsi pagu jenis belanja. Target deviasi ≤ 5.0%.</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-bold">3</td>
                    <td className={`p-3.5 font-bold ${isDark ? 'text-slate-200' : 'text-slate-950'}`}>Penyerapan Anggaran</td>
                    <td className={`p-3.5 ${isDark ? 'text-slate-400' : 'text-slate-900 font-bold'}`}>Rata-rata persentase penyerapan terhadap target total</td>
                    <td className={`p-3.5 font-bold ${
                      isDark ? 'text-emerald-300 bg-emerald-950/30' : 'text-emerald-950 bg-emerald-50 border-l border-emerald-300'
                    }`}>Nilai triwulanan dihitung berdasarkan <strong>rata-rata tertimbang per jenis belanja</strong> (51, 52, 53, 57) sesuai trajektori.</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-bold">4</td>
                    <td className={`p-3.5 font-bold ${isDark ? 'text-slate-200' : 'text-slate-950'}`}>Belanja Kontraktual</td>
                    <td className={`p-3.5 ${isDark ? 'text-slate-400' : 'text-slate-900 font-bold'}`}>Ketepatan waktu, kontrak dini, akselerasi 53</td>
                    <td className={`p-3.5 font-bold ${
                      isDark ? 'text-emerald-300 bg-emerald-950/30' : 'text-emerald-950 bg-emerald-50 border-l border-emerald-300'
                    }`}>3 Komponen: (1) Kontrak Pra-DIPA 40%, (2) Akselerasi Kontrak 53 (50-200jt) 40%, (3) <strong>Distribusi Akselerasi s.d TW II 20%</strong>.</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-bold">5</td>
                    <td className={`p-3.5 font-bold ${isDark ? 'text-slate-200' : 'text-slate-950'}`}>Penyelesaian Tagihan</td>
                    <td className={`p-3.5 ${isDark ? 'text-slate-400' : 'text-slate-900 font-bold'}`}>Ketepatan waktu SPM LS Kontraktual</td>
                    <td className={`p-3.5 font-bold ${
                      isDark ? 'text-emerald-300 bg-emerald-950/30' : 'text-emerald-950 bg-emerald-50 border-l border-emerald-300'
                    }`}>Tetap (Maksimal <strong>17 Hari Kerja</strong> dari tanggal BAST/BAPP di modul Komitmen SAKTI).</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-bold">6</td>
                    <td className={`p-3.5 font-bold ${isDark ? 'text-slate-200' : 'text-slate-950'}`}>Pengelolaan UP &amp; TUP</td>
                    <td className={`p-3.5 ${isDark ? 'text-slate-400' : 'text-slate-900 font-bold'}`}>Ketepatan waktu, persentase GUP, setoran TUP</td>
                    <td className={`p-3.5 font-bold ${
                      isDark ? 'text-emerald-300 bg-emerald-950/30' : 'text-emerald-950 bg-emerald-50 border-l border-emerald-300'
                    }`}>UP/TUP Tunai 90% + <strong>Reward UP KKP 10%</strong> (Bonus Nilai 110 jika penggunaan KKP mencapai target triwulanan).</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-bold">7</td>
                    <td className={`p-3.5 font-bold ${isDark ? 'text-slate-200' : 'text-slate-950'}`}>Dispensasi SPM</td>
                    <td className={`p-3.5 ${isDark ? 'text-slate-400' : 'text-slate-900 font-bold'}`}>Komponen utama dalam perhitungan IKPA</td>
                    <td className={`p-3.5 font-bold ${
                      isDark ? 'text-emerald-300 bg-emerald-950/30' : 'text-emerald-950 bg-emerald-50 border-l border-emerald-300'
                    }`}>Dihitung di luar komponen nilai IKPA, sebagai <strong>faktor pengurang permil</strong> (-0.25 s.d. -1.00 poin).</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-bold">8</td>
                    <td className={`p-3.5 font-bold ${isDark ? 'text-slate-200' : 'text-slate-950'}`}>Capaian Output SAKTI</td>
                    <td className={`p-3.5 ${isDark ? 'text-slate-400' : 'text-slate-900 font-bold'}`}>Ketepatan waktu &amp; capaian RO</td>
                    <td className={`p-3.5 font-bold ${
                      isDark ? 'text-emerald-300 bg-emerald-950/30' : 'text-emerald-950 bg-emerald-50 border-l border-emerald-300'
                    }`}>30% Ketepatan Waktu (Batas HK-5 bulan berikutnya) + 70% Capaian Rincian Output (PCRO / TPCRO).</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: STRATEGI OPTIMALISASI OFFICIAL DJPB */}
      {activeSubTab === 'strategi' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Aspect 1: Kualitas Perencanaan */}
            <div className={`p-6 rounded-2xl border ${
              isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
            }`}>
              <div className={`flex items-center gap-2 font-bold mb-4 border-b pb-3 ${
                isDark ? 'text-emerald-400 border-slate-800' : 'text-emerald-800 border-slate-200'
              }`}>
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span>Strategi Aspek Kualitas Perencanaan (Bobot 25%)</span>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <h4 className={`font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>📌 Revisi DIPA (10%):</h4>
                  <ul className={`list-disc pl-4 space-y-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    <li>Reviu DIPA secara periodik (minimal triwulanan) untuk kesesuaian alokasi program.</li>
                    <li>Konsolidasi revisi anggaran secara internal agar revisi dapat diminimalisasi (max 1-2 kali/semester).</li>
                    <li>Segera selesaikan dokumen pendukung apabila terdapat catatan blokir DIPA.</li>
                  </ul>
                </div>

                <div>
                  <h4 className={`font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>📌 Deviasi Halaman III DIPA (15%):</h4>
                  <ul className={`list-disc pl-4 space-y-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    <li>Jadikan Halaman III DIPA sebagai alat kendali KPA dalam pencapaian kinerja.</li>
                    <li>Manfaatkan jadwal pemutakhiran RPD pada hari kerja ke-10 awal triwulan (Feb, Apr, Jul, Okt).</li>
                    <li>Jaga agar rata-rata deviasi bulanan tidak melebihi <strong>5.0%</strong>.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Aspect 2: Kualitas Implementasi */}
            <div className={`p-6 rounded-2xl border ${
              isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
            }`}>
              <div className={`flex items-center gap-2 font-bold mb-4 border-b pb-3 ${
                isDark ? 'text-amber-400 border-slate-800' : 'text-amber-800 border-slate-200'
              }`}>
                <Zap className="w-5 h-5 text-amber-500" />
                <span>Strategi Aspek Kualitas Implementasi (Bobot 50%)</span>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <h4 className={`font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>📌 Penyerapan Anggaran &amp; Belanja Kontraktual:</h4>
                  <ul className={`list-disc pl-4 space-y-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    <li>Percepat pengadaan barang/jasa sebelum tahun anggaran (Pra-DIPA).</li>
                    <li>Selesaikan pengadaan Rp50-200 juta pada Triwulan I.</li>
                    <li>Daftarkan seluruh kontrak paling lambat Semester I (Target &gt; 75%).</li>
                  </ul>
                </div>

                <div>
                  <h4 className={`font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>📌 Penyelesaian Tagihan &amp; Pengelolaan UP/TUP:</h4>
                  <ul className={`list-disc pl-4 space-y-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    <li>Ajukan SPM LS Kontraktual maksimal <strong>17 Hari Kerja</strong> dari BAST/BAPP.</li>
                    <li>Percepat revolving UP Tunai (GUP 100% disebulankan).</li>
                    <li>Memprioritaskan penggunaan Kartu Kredit Pemerintah (KKP) untuk reward nilai 110.</li>
                  </ul>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
