import React, { useState, useMemo, useRef } from 'react';
import {
  Calculator,
  Sliders,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Target,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Copy,
  MessageSquare,
  Search,
  RotateCcw,
  Sparkles,
  Flame,
  Filter,
  Check,
  Phone,
  BarChart3,
  Layers,
  Award,
  Scale,
  Save,
  Trash2,
  FolderOpen,
  Bookmark
} from 'lucide-react';
import { SatkerIKPA, IndikatorIKPA, PejabatSertifikasi, AppTheme } from '../../types';
import { hitungTotalIKPA, getPredikatIKPA } from '../../data/initialSatkerData';
import { IkpaRadarChart } from './whatif/IkpaRadarChart';
import { DeviasiHal3DipaCalculatorModal } from './whatif/DeviasiHal3DipaCalculatorModal';
import { PenyerapanBelanjaCalculatorModal } from './whatif/PenyerapanBelanjaCalculatorModal';
import { HeadToHeadComparison } from './whatif/HeadToHeadComparison';
import { KppnAggregateImpactCard } from './whatif/KppnAggregateImpactCard';

interface AdvancedWhatIfAnalyticsSectionProps {
  satkers: SatkerIKPA[];
  pejabatList?: PejabatSertifikasi[];
  theme?: AppTheme;
  onUpdateSatker?: (updatedSatker: SatkerIKPA) => void;
}

// Weight definitions
interface IndicatorMeta {
  key: keyof IndikatorIKPA;
  label: string;
  shortLabel: string;
  weight: number; // 0.25 = 25%
  category: 'output' | 'pelaksanaan' | 'perencanaan';
  impactTier: 'high' | 'medium' | 'low';
  description: string;
  targetOfficial: number;
}

const INDICATOR_METAS: IndicatorMeta[] = [
  {
    key: 'capaianOutput',
    label: 'Capaian Output SAKTI',
    shortLabel: 'Caput SAKTI',
    weight: 0.25,
    category: 'output',
    impactTier: 'high',
    description: 'Konfirmasi capaian rincian output bulanan pada aplikasi SAKTI sebelum tanggal 5.',
    targetOfficial: 100
  },
  {
    key: 'penyerapanAnggaran',
    label: 'Penyerapan Anggaran',
    shortLabel: 'Penyerapan',
    weight: 0.20,
    category: 'pelaksanaan',
    impactTier: 'high',
    description: 'Realisasi anggaran triwulanan sesuai target belanja barang, modal, dan pegawai.',
    targetOfficial: 95
  },
  {
    key: 'deviasiHal3Dipa',
    label: 'Deviasi Halaman III DIPA',
    shortLabel: 'Deviasi Hal III',
    weight: 0.10,
    category: 'perencanaan',
    impactTier: 'medium',
    description: 'Kesesuaian realisasi bulanan terhadap rencana penarikan dana RPD Halaman III DIPA.',
    targetOfficial: 90
  },
  {
    key: 'belanjaKontraktual',
    label: 'Belanja Kontraktual',
    shortLabel: 'Kontraktual',
    weight: 0.10,
    category: 'pelaksanaan',
    impactTier: 'medium',
    description: 'Pendaftaran kontrak tepat waktu (maksimal 3 hari kerja sejak penandatanganan).',
    targetOfficial: 100
  },
  {
    key: 'penyelesaianTagihan',
    label: 'Penyelesaian Tagihan',
    shortLabel: 'Tagihan SPM',
    weight: 0.10,
    category: 'pelaksanaan',
    impactTier: 'medium',
    description: 'Penyampaian SPM LS Kontraktual ke KPPN maksimal 17 hari kerja sejak BAST.',
    targetOfficial: 100
  },
  {
    key: 'pengelolaanUpTup',
    label: 'Pengelolaan UP dan TUP',
    shortLabel: 'UP & TUP',
    weight: 0.10,
    category: 'pelaksanaan',
    impactTier: 'medium',
    description: 'Ketepatan revolving UP (GUP minimal 1x per bulan) dan pertanggungjawaban TUP (1 bulan).',
    targetOfficial: 100
  },
  {
    key: 'revisiDipa',
    label: 'Revisi DIPA',
    shortLabel: 'Revisi DIPA',
    weight: 0.10,
    category: 'perencanaan',
    impactTier: 'medium',
    description: 'Frekuensi revisi DIPA kewenangan KPA/Kanwil maksimal 1 kali dalam 1 triwulan.',
    targetOfficial: 100
  },
  {
    key: 'dispensasiSpm',
    label: 'Dispensasi SPM',
    shortLabel: 'Dispensasi SPM',
    weight: 0.05,
    category: 'pelaksanaan',
    impactTier: 'low',
    description: 'Ketiadaan pengajuan dispensasi SPM di luar batas waktu pada akhir tahun anggaran.',
    targetOfficial: 100
  }
];

export const AdvancedWhatIfAnalyticsSection: React.FC<AdvancedWhatIfAnalyticsSectionProps> = ({
  satkers = [],
  pejabatList = [],
  theme = 'light'
}) => {
  const isDark = theme === 'dark';
  const simulatorTopRef = useRef<HTMLDivElement>(null);

  // Selected Target Satker
  const [selectedSatkerId, setSelectedSatkerId] = useState<string>(() => satkers[0]?.id || '');
  const [searchSatkerQuery, setSearchSatkerQuery] = useState<string>('');
  
  // Current active satker
  const activeSatker = useMemo(() => {
    return satkers.find(s => s.id === selectedSatkerId) || satkers[0] || null;
  }, [satkers, selectedSatkerId]);

  // Current simulation indicator values
  const [simValues, setSimValues] = useState<IndikatorIKPA>(() => {
    const s = satkers[0];
    if (s?.indikator) {
      return { ...s.indikator };
    }
    return {
      revisiDipa: 100,
      deviasiHal3Dipa: 85,
      penyerapanAnggaran: 85,
      belanjaKontraktual: 95,
      penyelesaianTagihan: 95,
      pengelolaanUpTup: 95,
      dispensasiSpm: 100,
      capaianOutput: 80
    };
  });

  // When satker changes, reset simulation values to that satker's baseline
  const handleSelectSatker = (id: string) => {
    setSelectedSatkerId(id);
    const target = satkers.find(s => s.id === id);
    if (target?.indikator) {
      setSimValues({ ...target.indikator });
    }
  };

  // Indicator filter tabs: all | high-impact | planning | execution
  const [indicatorFilter, setIndicatorFilter] = useState<'all' | 'high-impact' | 'planning' | 'execution'>('all');

  // Copy notification state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Anomaly filter
  const [anomalyFilter, setAnomalyFilter] = useState<'all' | 'critical' | 'warning' | 'notice'>('all');
  const [searchAnomalyQuery, setSearchAnomalyQuery] = useState<string>('');

  // Goal-Seek target input state
  const [goalSeekTarget, setGoalSeekTarget] = useState<number>(95.0);
  const [showGoalSeekModal, setShowGoalSeekModal] = useState<boolean>(false);

  // Active Sub-Tab: 'simulator' | 'comparison' | 'anomalies'
  const [activeSubTab, setActiveSubTab] = useState<'simulator' | 'comparison' | 'anomalies'>('simulator');

  // Modals for technical calculators
  const [showDeviasiModal, setShowDeviasiModal] = useState<boolean>(false);
  const [showPenyerapanModal, setShowPenyerapanModal] = useState<boolean>(false);

  // Saved scenarios state
  interface SavedScenario {
    id: string;
    name: string;
    timestamp: string;
    satkerId: string;
    satkerName: string;
    satkerKode: string;
    values: IndikatorIKPA;
    score: number;
  }

  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>(() => {
    try {
      const stored = localStorage.getItem('ikpa_saved_scenarios');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [scenarioNameInput, setScenarioNameInput] = useState<string>('');
  const [showSaveScenarioModal, setShowSaveScenarioModal] = useState<boolean>(false);

  const handleSaveCurrentScenario = () => {
    if (!scenarioNameInput.trim() || !activeSatker) return;
    const newScenario: SavedScenario = {
      id: `scen_${Date.now()}`,
      name: scenarioNameInput.trim(),
      timestamp: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      satkerId: activeSatker.id,
      satkerName: activeSatker.namaSatker,
      satkerKode: activeSatker.kodeSatker,
      values: { ...simValues },
      score: simulatedScore
    };
    const updated = [newScenario, ...savedScenarios.slice(0, 9)];
    setSavedScenarios(updated);
    try {
      localStorage.setItem('ikpa_saved_scenarios', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    setScenarioNameInput('');
    setShowSaveScenarioModal(false);
  };

  const handleDeleteScenario = (id: string) => {
    const updated = savedScenarios.filter(s => s.id !== id);
    setSavedScenarios(updated);
    try {
      localStorage.setItem('ikpa_saved_scenarios', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const handleLoadScenario = (scen: SavedScenario) => {
    setSelectedSatkerId(scen.satkerId);
    setSimValues({ ...scen.values });
  };

  // Filtered indicators based on indicatorFilter
  const visibleIndicators = useMemo(() => {
    if (indicatorFilter === 'high-impact') {
      return INDICATOR_METAS.filter(m => m.impactTier === 'high');
    }
    if (indicatorFilter === 'planning') {
      return INDICATOR_METAS.filter(m => m.category === 'perencanaan');
    }
    if (indicatorFilter === 'execution') {
      return INDICATOR_METAS.filter(m => m.category === 'pelaksanaan' || m.category === 'output');
    }
    return INDICATOR_METAS;
  }, [indicatorFilter]);

  // Calculate baseline & projected scores
  const baselineScore = activeSatker?.nilaiTotalIKPA || 0;
  const simulatedScore = useMemo(() => {
    return hitungTotalIKPA(simValues);
  }, [simValues]);

  const baselinePredikat = getPredikatIKPA(baselineScore);
  const simulatedPredikat = getPredikatIKPA(simulatedScore);
  const deltaScore = Number((simulatedScore - baselineScore).toFixed(2));

  // Breakdown contribution of each indicator to the delta
  const deltaContributions = useMemo(() => {
    if (!activeSatker) return [];
    return INDICATOR_METAS.map(m => {
      const baseVal = activeSatker.indikator?.[m.key] ?? 0;
      const simVal = simValues[m.key] ?? 0;
      const diff = simVal - baseVal;
      const pointContribution = Number((diff * m.weight).toFixed(2));
      return {
        ...m,
        baseVal,
        simVal,
        diff,
        pointContribution
      };
    });
  }, [activeSatker, simValues]);

  // Smart 1-Click Preset Scenarios
  const handleApplyPreset = (presetType: 'target-95' | 'target-87.5' | 'optimistic' | 'weakest-fix' | 'stress-test' | 'reset') => {
    if (!activeSatker) return;

    if (presetType === 'reset') {
      setSimValues({ ...activeSatker.indikator });
      return;
    }

    if (presetType === 'optimistic') {
      setSimValues({
        revisiDipa: 100,
        deviasiHal3Dipa: 100,
        penyerapanAnggaran: 100,
        belanjaKontraktual: 100,
        penyelesaianTagihan: 100,
        pengelolaanUpTup: 100,
        dispensasiSpm: 100,
        capaianOutput: 100
      });
      return;
    }

    if (presetType === 'stress-test') {
      // Risk simulation: Caput drops to 0, deviasi drops by 25
      setSimValues(prev => ({
        ...prev,
        capaianOutput: 0,
        deviasiHal3Dipa: Math.max(0, (activeSatker.indikator.deviasiHal3Dipa || 75) - 25),
        penyerapanAnggaran: Math.max(0, (activeSatker.indikator.penyerapanAnggaran || 80) - 15)
      }));
      return;
    }

    if (presetType === 'weakest-fix') {
      // Find two lowest indicators and boost them to 92
      const entries = Object.entries(activeSatker.indikator || {}) as [keyof IndikatorIKPA, number][];
      const sorted = [...entries].sort((a, b) => a[1] - b[1]);
      const weakestKeys = sorted.slice(0, 2).map(e => e[0]);

      const nextVal = { ...activeSatker.indikator };
      weakestKeys.forEach(k => {
        nextVal[k] = Math.max(nextVal[k], 92);
      });
      setSimValues(nextVal);
      return;
    }

    if (presetType === 'target-95') {
      // Efficiently target >= 95
      setSimValues({
        capaianOutput: Math.max(activeSatker.indikator.capaianOutput || 0, 96),
        penyerapanAnggaran: Math.max(activeSatker.indikator.penyerapanAnggaran || 0, 95),
        deviasiHal3Dipa: Math.max(activeSatker.indikator.deviasiHal3Dipa || 0, 90),
        belanjaKontraktual: Math.max(activeSatker.indikator.belanjaKontraktual || 0, 95),
        penyelesaianTagihan: Math.max(activeSatker.indikator.penyelesaianTagihan || 0, 98),
        pengelolaanUpTup: Math.max(activeSatker.indikator.pengelolaanUpTup || 0, 98),
        revisiDipa: Math.max(activeSatker.indikator.revisiDipa || 0, 95),
        dispensasiSpm: 100
      });
      return;
    }

    if (presetType === 'target-87.5') {
      // Target >= 87.5
      setSimValues({
        capaianOutput: Math.max(activeSatker.indikator.capaianOutput || 0, 88),
        penyerapanAnggaran: Math.max(activeSatker.indikator.penyerapanAnggaran || 0, 88),
        deviasiHal3Dipa: Math.max(activeSatker.indikator.deviasiHal3Dipa || 0, 80),
        belanjaKontraktual: Math.max(activeSatker.indikator.belanjaKontraktual || 0, 85),
        penyelesaianTagihan: Math.max(activeSatker.indikator.penyelesaianTagihan || 0, 90),
        pengelolaanUpTup: Math.max(activeSatker.indikator.pengelolaanUpTup || 0, 90),
        revisiDipa: Math.max(activeSatker.indikator.revisiDipa || 0, 90),
        dispensasiSpm: 100
      });
    }
  };

  // Goal-Seek solution generator
  const goalSeekSolutions = useMemo(() => {
    if (!activeSatker) return null;
    const gap = goalSeekTarget - baselineScore;
    if (gap <= 0) {
      return {
        isAlreadyAchieved: true,
        gap: 0,
        pathA: { ...activeSatker.indikator },
        pathB: { ...activeSatker.indikator },
        pathC: { ...activeSatker.indikator }
      };
    }

    // Path A: High Impact Focus (Caput + Penyerapan)
    // 25% + 20% = 45% of total score
    const pathA = { ...activeSatker.indikator };
    const requiredCaputInc = Math.min(100 - pathA.capaianOutput, Math.ceil((gap * 0.6) / 0.25));
    pathA.capaianOutput = Math.min(100, pathA.capaianOutput + requiredCaputInc);
    const remainingGapA = gap - (requiredCaputInc * 0.25);
    if (remainingGapA > 0) {
      const reqPenyerapan = Math.min(100 - pathA.penyerapanAnggaran, Math.ceil(remainingGapA / 0.20));
      pathA.penyerapanAnggaran = Math.min(100, pathA.penyerapanAnggaran + reqPenyerapan);
    }

    // Path B: Administrative & Quick Wins Focus (Tagihan, UP/TUP, Dispensasi, Kontrak)
    const pathB = { ...activeSatker.indikator };
    pathB.penyelesaianTagihan = 100;
    pathB.pengelolaanUpTup = 100;
    pathB.belanjaKontraktual = 100;
    pathB.dispensasiSpm = 100;
    const scoreB = hitungTotalIKPA(pathB);
    const remainingGapB = goalSeekTarget - scoreB;
    if (remainingGapB > 0) {
      pathB.capaianOutput = Math.min(100, pathB.capaianOutput + Math.ceil(remainingGapB / 0.25));
    }

    // Path C: Balanced Distribution
    const pathC = { ...activeSatker.indikator };
    const evenBoost = Math.ceil(gap / 0.85); // average weight ~0.85
    INDICATOR_METAS.forEach(m => {
      pathC[m.key] = Math.min(100, pathC[m.key] + evenBoost);
    });

    return {
      isAlreadyAchieved: false,
      gap: Number(gap.toFixed(2)),
      pathA,
      pathB,
      pathC,
      scoreA: hitungTotalIKPA(pathA),
      scoreB: hitungTotalIKPA(pathB),
      scoreC: hitungTotalIKPA(pathC)
    };
  }, [activeSatker, baselineScore, goalSeekTarget]);

  // Anomaly Radar list
  interface AnomalyItem {
    satker: SatkerIKPA;
    severity: 'critical' | 'warning' | 'notice';
    severityScore: number;
    anomalies: string[];
    priorityReasons: string[];
    recommendation: string;
    picName: string;
    picPhone: string;
  }

  const anomalySatkers = useMemo<AnomalyItem[]>(() => {
    const list: AnomalyItem[] = [];

    satkers.forEach(s => {
      const anomalies: string[] = [];
      const priorityReasons: string[] = [];
      let severityScore = 0;

      const ind = s.indikator || {
        revisiDipa: 0,
        deviasiHal3Dipa: 0,
        penyerapanAnggaran: 0,
        belanjaKontraktual: 0,
        penyelesaianTagihan: 0,
        pengelolaanUpTup: 0,
        dispensasiSpm: 0,
        capaianOutput: 0
      };

      // 1. Capaian Output 0% or Belum Terlaporkan
      if (s.statusCapaianOutput === 'Belum Terlaporkan' || ind.capaianOutput === 0) {
        anomalies.push('Capaian Output 0% (SAKTI)');
        priorityReasons.push('Bobot 25% hilang penuh - risiko predikat jatuh ke Kurang.');
        severityScore += 50;
      }

      // 2. Nilai IKPA di bawah batas aman (< 87.5)
      if (s.nilaiTotalIKPA < 87.5) {
        anomalies.push(`Predikat ${s.predikat || 'Cukup/Kurang'} (${s.nilaiTotalIKPA})`);
        priorityReasons.push('Berada di bawah standar capaian minimal KPPN (87.50).');
        severityScore += 40;
      }

      // 3. Deviasi Hal III parah (< 70)
      if (ind.deviasiHal3Dipa < 70) {
        anomalies.push(`Deviasi Hal III Tinggi (${ind.deviasiHal3Dipa}%)`);
        priorityReasons.push('Realisasi melenceng jauh dari RPD bulanan Halaman III DIPA.');
        severityScore += 25;
      }

      // 4. Penyerapan rendah (< 75)
      if (ind.penyerapanAnggaran < 75) {
        anomalies.push(`Penyerapan Rendah (${ind.penyerapanAnggaran}%)`);
        priorityReasons.push('Target penyerapan triwulanan tertinggal signifikan.');
        severityScore += 20;
      }

      // 5. Belanja kontraktual (< 80)
      if (ind.belanjaKontraktual < 80) {
        anomalies.push(`Kontrak Telat Daftar (${ind.belanjaKontraktual}%)`);
        priorityReasons.push('Pendaftaran data kontrak melewati batas 3 hari kerja.');
        severityScore += 15;
      }

      // 6. Tagihan SPM (< 80)
      if (ind.penyelesaianTagihan < 80) {
        anomalies.push(`Tagihan Terlambat (${ind.penyelesaianTagihan}%)`);
        priorityReasons.push('SPM diajukan melewati batas 17 hari kerja sejak BAST.');
        severityScore += 15;
      }

      // 7. UP/TUP (< 80)
      if (ind.pengelolaanUpTup < 80) {
        anomalies.push(`Revolving UP Lambat (${ind.pengelolaanUpTup}%)`);
        priorityReasons.push('Pertanggungjawaban GUP tidak rutin atau TUP melewati 1 bulan.');
        severityScore += 15;
      }

      if (anomalies.length > 0) {
        let severity: 'critical' | 'warning' | 'notice' = 'notice';
        if (severityScore >= 50 || s.nilaiTotalIKPA < 70) {
          severity = 'critical';
        } else if (severityScore >= 30 || s.nilaiTotalIKPA < 87.5) {
          severity = 'warning';
        }

        // Tailored recommendation
        let recommendation = '';
        if (s.statusCapaianOutput === 'Belum Terlaporkan' || ind.capaianOutput === 0) {
          recommendation = `Percepatan konfirmasi data Capaian Output pada SAKTI sebelum tanggal 5. Hubungi PIC / Operator SAKTI untuk approval PPK.`;
        } else if (ind.deviasiHal3Dipa < 70) {
          recommendation = `Penjadwalan ulang RPD Halaman III DIPA pada periode revisi DIPA triwulanan berikutnya untuk menyelaraskan kalender penarikan dana.`;
        } else if (ind.penyerapanAnggaran < 75) {
          recommendation = `Akselerasi pelaksanaan pengadaan barang/jasa dan segera ajukan tagihan belanja modal termin berjalan.`;
        } else {
          recommendation = `Optimalisasi kepatuhan jadwal pengajuan tagihan dan revolving UP minimal 1 kali per bulan ke KPPN.`;
        }

        // Search contact in pejabatList or s.namaPic
        const matchingPejabat = pejabatList.find(p => p.kdSatker === s.kodeSatker);
        const picName = s.namaPic || matchingPejabat?.nama || 'Petugas KPA/PPK Satker';
        const picPhone = s.noHpPic || matchingPejabat?.noHp || '';

        list.push({
          satker: s,
          severity,
          severityScore,
          anomalies,
          priorityReasons,
          recommendation,
          picName,
          picPhone
        });
      }
    });

    // Sort by severityScore descending
    return list.sort((a, b) => b.severityScore - a.severityScore);
  }, [satkers, pejabatList]);

  // Filtered anomaly list
  const filteredAnomalies = useMemo(() => {
    return anomalySatkers.filter(item => {
      if (anomalyFilter !== 'all' && item.severity !== anomalyFilter) {
        return false;
      }
      if (searchAnomalyQuery.trim()) {
        const q = searchAnomalyQuery.toLowerCase();
        const matchName = item.satker.namaSatker.toLowerCase().includes(q);
        const matchKode = item.satker.kodeSatker.toLowerCase().includes(q);
        const matchAnomaly = item.anomalies.some(a => a.toLowerCase().includes(q));
        return matchName || matchKode || matchAnomaly;
      }
      return true;
    });
  }, [anomalySatkers, anomalyFilter, searchAnomalyQuery]);

  // Copy official recommendation to clipboard
  const handleCopyRecommendation = (item: AnomalyItem) => {
    const text = `CATATAN REKOMENDASI PEMBINAAN MSKI KPPN
Satker: [${item.satker.kodeSatker}] ${item.satker.namaSatker}
Nilai IKPA Saat Ini: ${item.satker.nilaiTotalIKPA} (${item.satker.predikat})
Status Anomali: ${item.anomalies.join(', ')}

Rekomendasi Tindak Lanjut:
${item.recommendation}

Catatan Petugas:
${item.priorityReasons.join(' ')}`;

    navigator.clipboard.writeText(text);
    setCopiedId(item.satker.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Generate WhatsApp intervensi text
  const generateWhatsAppLink = (item: AnomalyItem) => {
    let cleanPhone = item.picPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    }
    if (!cleanPhone) {
      cleanPhone = '';
    }

    const message = `Yth. Bapak/Ibu PIC/Pengelola Keuangan
${item.satker.namaSatker} (${item.satker.kodeSatker})

Salam Perbendaharaan dari KPPN.
Berdasarkan sistem monitoring pemantauan IKPA terpadu PER-5/PB/2024, teridentifikasi indikator yang memerlukan perhatian segera:

📊 Nilai IKPA Saat Ini: ${item.satker.nilaiTotalIKPA} (${item.satker.predikat})
⚠️ Indikator Perlu Intervensi:
${item.anomalies.map(a => `• ${a}`).join('\n')}

💡 Rekomendasi Langkah Konkret:
${item.recommendation}

Mohon dapat segera dilakukan langkah koordinasi sebelum batas waktu cut-off periode ini. Apabila terdapat kendala teknis SAKTI, Tim Pembina KPPN siap mendampingi. Terima kasih.`;

    const encoded = encodeURIComponent(message);
    if (cleanPhone) {
      return `https://wa.me/${cleanPhone}?text=${encoded}`;
    }
    return `https://api.whatsapp.com/send?text=${encoded}`;
  };

  // Print friendly trigger
  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div ref={simulatorTopRef} className="space-y-6">
      {/* 1. Header Banner & Executive Insights */}
      <div className={`rounded-3xl border shadow-xl p-6 sm:p-8 space-y-6 transition-all ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        
        {/* Banner Top */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-indigo-500/15 to-purple-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80 px-3.5 py-1.2 rounded-full text-xs font-black tracking-wide mb-2 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
              <span>ADVANCED WHAT-IF &amp; ANOMALY INTELLIGENCE ENGINE</span>
              <span className="bg-indigo-600 text-white text-[9px] px-1.5 py-0.5 rounded-full font-mono">PER-5/PB/2024</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Simulator Proyeksi Score IKPA &amp; Multi-Risk Radar Anomali
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1 max-w-4xl">
              Simulasi komprehensif 8 indikator dengan formula resmi PER-5/PB/2024, Reverse Goal-Seek Engine, Sensitivitas Elastisitas Poin, dan Radar Anomali multi-dimensi untuk intervensi terarah pembina KPPN.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0 print:hidden">
            <button
              onClick={() => handleApplyPreset('reset')}
              className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Reset ke Baseline Asli Satker"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset Baseline</span>
            </button>

            <button
              onClick={() => setShowGoalSeekModal(true)}
              className="px-4 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-indigo-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
              title="Cari Solusi Pemenuhan Target Nilai Tertentu"
            >
              <Target className="w-3.5 h-3.5 text-amber-300" />
              <span>Reverse Goal-Seek</span>
            </button>

            <button
              onClick={handlePrintReport}
              className="px-3.5 py-2 rounded-xl text-xs font-bold border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Cetak Format Laporan Analisis What-If"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Rekap</span>
            </button>
          </div>
        </div>

        {/* Quick Intelligence Summary Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
          <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60">
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Total Satker Dianalisis</div>
            <div className="text-xl font-black text-slate-900 dark:text-white font-mono mt-0.5">
              {satkers.length} <span className="text-xs font-normal text-slate-500 font-sans">Satker</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60">
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Rata-rata IKPA Baseline</div>
            <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 font-mono mt-0.5">
              {(satkers.reduce((acc, s) => acc + (s.nilaiTotalIKPA || 0), 0) / (satkers.length || 1)).toFixed(2)}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl border border-rose-200 dark:border-rose-950/60 bg-rose-50/50 dark:bg-rose-950/20">
            <div className="text-[11px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
              <Flame className="w-3 h-3" /> Satker Radar Anomali
            </div>
            <div className="text-xl font-black text-rose-700 dark:text-rose-300 font-mono mt-0.5">
              {anomalySatkers.length} <span className="text-xs font-normal text-rose-500 font-sans">({anomalySatkers.filter(a => a.severity === 'critical').length} Kritis)</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-950/60 bg-emerald-50/50 dark:bg-emerald-950/20">
            <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Zap className="w-3 h-3" /> Potensi Kenaikan Proyeksi
            </div>
            <div className="text-xl font-black text-emerald-700 dark:text-emerald-300 font-mono mt-0.5">
              {deltaScore >= 0 ? `+${deltaScore}` : deltaScore} <span className="text-xs font-normal text-emerald-600 font-sans">Poin Satker Aktif</span>
            </div>
          </div>
        </div>

        {/* Sub-Tab Navigation Bar & Technical Calculator Launchers */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3 pt-2 print:hidden">
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl text-xs font-black">
            <button
              onClick={() => setActiveSubTab('simulator')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                activeSubTab === 'simulator'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Simulator &amp; What-If Radar</span>
            </button>

            <button
              onClick={() => setActiveSubTab('comparison')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                activeSubTab === 'comparison'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Scale className="w-4 h-4" />
              <span>Komparasi Head-to-Head</span>
              <span className="px-1.5 py-0.2 rounded-full bg-purple-200 dark:bg-purple-900/60 text-purple-900 dark:text-purple-200 text-[9px] font-black">
                Versus
              </span>
            </button>

            <button
              onClick={() => setActiveSubTab('anomalies')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                activeSubTab === 'anomalies'
                  ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <AlertCircle className="w-4 h-4" />
              <span>Radar Anomali ({anomalySatkers.length})</span>
              {anomalySatkers.filter(a => a.severity === 'critical').length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-200 dark:bg-rose-900/60 text-rose-900 dark:text-rose-200 text-[9px] font-black animate-pulse">
                  {anomalySatkers.filter(a => a.severity === 'critical').length} Kritis
                </span>
              )}
            </button>
          </div>

          {/* Quick Technical Calculators & Scenario Tools */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowDeviasiModal(true)}
              className="px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Kalkulator Rumus Halaman III DIPA Bulanan PER-5/PB/2024"
            >
              <Calculator className="w-3.5 h-3.5 text-amber-600" />
              <span>Kalkulator Hal III DIPA</span>
            </button>

            <button
              onClick={() => setShowPenyerapanModal(true)}
              className="px-3 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Kalkulator Target Penyerapan 4 Belanja (51,52,53,57)"
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <span>Kalkulator 4 Belanja</span>
            </button>

            <button
              onClick={() => setShowSaveScenarioModal(true)}
              className="px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Simpan Skenario Simulasi Ini"
            >
              <Save className="w-3.5 h-3.5 text-indigo-500" />
              <span>Simpan Skenario</span>
              {savedScenarios.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-indigo-200 dark:bg-indigo-800 text-indigo-900 dark:text-indigo-200 text-[10px] font-mono font-bold">
                  {savedScenarios.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* 2. Interactive Simulator Workspace (Left Sliders & Right Outcome Card) */}
        {activeSubTab === 'simulator' && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
          
          {/* LEFT 7-COLS: Parameters & Sliders */}
          <div className="lg:col-span-7 space-y-4 bg-slate-50 dark:bg-slate-950/80 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <h4 className="text-sm font-extrabold flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
                <Sliders className="w-4 h-4" />
                <span>Atur Parameter 8 Indikator Simulasi</span>
              </h4>

              {/* Indicator Group Filter Chips */}
              <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-[10px] font-bold">
                <button
                  onClick={() => setIndicatorFilter('all')}
                  className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                    indicatorFilter === 'all'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Semua (8)
                </button>
                <button
                  onClick={() => setIndicatorFilter('high-impact')}
                  className={`px-2 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                    indicatorFilter === 'high-impact'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Flame className="w-2.5 h-2.5 text-amber-400" /> Bobot Besar (45%)
                </button>
                <button
                  onClick={() => setIndicatorFilter('execution')}
                  className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                    indicatorFilter === 'execution'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Pelaksanaan
                </button>
                <button
                  onClick={() => setIndicatorFilter('planning')}
                  className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                    indicatorFilter === 'planning'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Perencanaan
                </button>
              </div>
            </div>

            {/* Satker Selection with Search Filter */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300">
                Pilih Satker Sasaran Simulasi:
              </label>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <select
                    value={selectedSatkerId}
                    onChange={(e) => handleSelectSatker(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-bold text-xs shadow-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    {satkers.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.kodeSatker} - {s.namaSatker} (IKPA: {s.nilaiTotalIKPA})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Satker Mini Metadata Card */}
              {activeSatker && (
                <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Status SAKTI:</span>
                    <span className={`px-2 py-0.5 rounded-full font-extrabold text-[10px] ${
                      activeSatker.statusCapaianOutput === 'Sudah Terlaporkan'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}>
                      {activeSatker.statusCapaianOutput || 'Belum Terlaporkan'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                    <span>K/L: <strong>{activeSatker.kodeBa || activeSatker.kementerianLembaga?.slice(0, 20) || '-'}</strong></span>
                    <span>Pagu: <strong>Rp {((activeSatker.paguAnggaran || 0) / 1000000000).toFixed(2)} M</strong></span>
                  </div>
                </div>
              )}
            </div>

            {/* Preset Action Buttons */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-extrabold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-500" /> Skenario Cepat (1-Click Presets):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleApplyPreset('target-95')}
                  className="px-2.5 py-2 rounded-xl text-[11px] font-extrabold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 hover:bg-emerald-100 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Target className="w-3 h-3 text-emerald-600" /> Target Sangat Baik (≥95)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('target-87.5')}
                  className="px-2.5 py-2 rounded-xl text-[11px] font-extrabold bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800/80 hover:bg-teal-100 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <CheckCircle2 className="w-3 h-3 text-teal-600" /> Target Baik (≥87.5)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('weakest-fix')}
                  className="px-2.5 py-2 rounded-xl text-[11px] font-extrabold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80 hover:bg-amber-100 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-amber-600" /> Perbaiki 2 Terlemah
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('optimistic')}
                  className="px-2.5 py-2 rounded-xl text-[11px] font-extrabold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80 hover:bg-indigo-100 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <TrendingUp className="w-3 h-3 text-indigo-600" /> Optimis Penuh (100)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('stress-test')}
                  className="px-2.5 py-2 rounded-xl text-[11px] font-extrabold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/80 hover:bg-rose-100 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <AlertTriangle className="w-3 h-3 text-rose-600" /> Stress-Test Risiko
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('reset')}
                  className="px-2.5 py-2 rounded-xl text-[11px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3 text-slate-500" /> Reset ke Baseline
                </button>
              </div>
            </div>

            {/* Interactive Sliders Grid */}
            <div className="space-y-4 pt-3">
              {visibleIndicators.map((meta, idx) => {
                const currentSimVal = simValues[meta.key] ?? 0;
                const baselineVal = activeSatker?.indikator?.[meta.key] ?? 0;
                const diff = currentSimVal - baselineVal;

                return (
                  <div
                    key={meta.key}
                    className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs transition-all hover:border-indigo-300 dark:hover:border-indigo-800"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center font-mono font-bold text-[10px]">
                          {idx + 1}
                        </span>
                        <div>
                          <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200">
                            {meta.label}
                          </span>
                          <span className="text-[10px] ml-1.5 px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-mono font-bold border border-indigo-200/60 dark:border-indigo-800/40">
                            Bobot {(meta.weight * 100).toFixed(0)}%
                          </span>
                          {meta.impactTier === 'high' && (
                            <span className="text-[9px] ml-1 px-1 py-0.2 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold">
                              🔥 High Impact
                            </span>
                          )}
                          {meta.key === 'deviasiHal3Dipa' && (
                            <button
                              type="button"
                              onClick={() => setShowDeviasiModal(true)}
                              className="text-[9px] ml-1.5 px-2 py-0.5 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 dark:bg-amber-950/80 dark:text-amber-200 font-bold border border-amber-300 dark:border-amber-800 transition-colors cursor-pointer inline-flex items-center gap-1"
                              title="Buka Kalkulator RPD Bulanan Hal III DIPA"
                            >
                              <Calculator className="w-2.5 h-2.5 text-amber-600" />
                              <span>Hitung Hal III</span>
                            </button>
                          )}
                          {meta.key === 'penyerapanAnggaran' && (
                            <button
                              type="button"
                              onClick={() => setShowPenyerapanModal(true)}
                              className="text-[9px] ml-1.5 px-2 py-0.5 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-200 font-bold border border-emerald-300 dark:border-emerald-800 transition-colors cursor-pointer inline-flex items-center gap-1"
                              title="Buka Kalkulator Target 4 Belanja PER-5/PB/2024"
                            >
                              <TrendingUp className="w-2.5 h-2.5 text-emerald-600" />
                              <span>Hitung 4 Belanja</span>
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block font-mono">
                            Base: {baselineVal}%
                          </span>
                        </div>

                        {/* Numeric input sync */}
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={currentSimVal}
                            onChange={(e) => {
                              const val = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                              setSimValues(prev => ({ ...prev, [meta.key]: val }));
                            }}
                            className="w-14 px-2 py-0.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-right font-mono font-extrabold text-xs text-indigo-600 dark:text-indigo-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                          />
                          <span className="text-xs font-bold text-slate-400">%</span>
                        </div>
                      </div>
                    </div>

                    {/* Slider Control */}
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={currentSimVal}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setSimValues(prev => ({ ...prev, [meta.key]: val }));
                        }}
                        className="w-full accent-indigo-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Bottom Micro-Bar: Delta from Baseline */}
                    <div className="flex items-center justify-between text-[10px] mt-1.5 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                      <span className="text-slate-400 italic text-[10px] line-clamp-1">
                        {meta.description}
                      </span>
                      
                      <span className={`font-mono font-bold shrink-0 ${
                        diff > 0 ? 'text-emerald-600 dark:text-emerald-400' :
                        diff < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'
                      }`}>
                        {diff > 0 ? `+${diff}% (+${(diff * meta.weight).toFixed(2)} Poin)` :
                         diff < 0 ? `${diff}% (${(diff * meta.weight).toFixed(2)} Poin)` : 'Sama dengan data asli'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

          {/* RIGHT 5-COLS: Projection Outcome Card & Sensitivity Matrix */}
          <div className="lg:col-span-5 space-y-4 flex flex-col">
            
            {/* Main Result Card */}
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white p-6 rounded-2xl shadow-xl border border-indigo-900/50 flex flex-col justify-between space-y-5">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 px-3 py-1 rounded-full">
                    HASIL PROYEKSI SIMULASI
                  </span>
                  <span className="text-xs text-indigo-300/80 font-mono">
                    PER-5/PB/2024
                  </span>
                </div>

                <h4 className="text-xl font-black mt-3 leading-snug tracking-tight">
                  {activeSatker?.namaSatker || 'Pilih Satker'}
                </h4>
                <p className="text-xs text-indigo-200/70 font-mono mt-0.5">
                  Kode Satker: {activeSatker?.kodeSatker || '-'}
                </p>

                {/* Main Metrics Box */}
                <div className="mt-5 space-y-3 bg-white/5 p-4 rounded-2xl border border-white/10">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                    <span className="text-xs text-indigo-200/90 font-medium">IKPA Saat Ini (Baseline):</span>
                    <div className="text-right">
                      <span className="text-base font-black font-mono">{baselineScore.toFixed(2)}</span>
                      <span className="text-[10px] ml-1.5 px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold uppercase">
                        {baselinePredikat}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                    <span className="text-xs text-emerald-300 font-bold flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Proyeksi IKPA Baru:
                    </span>
                    <div className="text-right">
                      <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
                        {simulatedScore.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                    <span className="text-xs text-indigo-200 font-medium">Dampak Delta Point:</span>
                    <span className={`text-sm font-black font-mono px-2.5 py-1 rounded-lg ${
                      deltaScore > 0 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' :
                      deltaScore < 0 ? 'bg-rose-500/20 text-rose-300 border border-rose-400/30' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {deltaScore > 0 ? `+${deltaScore} Poin` : `${deltaScore} Poin`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-0.5">
                    <span className="text-xs text-indigo-200 font-medium">Predikat Proyeksi:</span>
                    <span className={`text-xs font-black uppercase px-3 py-1 rounded-full shadow-xs ${
                      simulatedPredikat === 'Sangat Baik' ? 'bg-emerald-500 text-slate-950 font-black' :
                      simulatedPredikat === 'Baik' ? 'bg-teal-400 text-slate-950 font-black' :
                      simulatedPredikat === 'Cukup' ? 'bg-amber-400 text-slate-950 font-black' : 'bg-rose-500 text-white font-black'
                    }`}>
                      {simulatedPredikat}
                    </span>
                  </div>
                </div>

                {/* Progress bar comparison */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between text-[11px] text-indigo-200">
                    <span>Baseline: {baselineScore.toFixed(1)}%</span>
                    <span className="text-emerald-300 font-bold">Proyeksi: {simulatedScore.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden flex">
                    <div
                      className="bg-indigo-500 h-full transition-all duration-300"
                      style={{ width: `${Math.min(100, baselineScore)}%` }}
                    />
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden flex">
                    <div
                      className={`h-full transition-all duration-300 ${
                        simulatedScore >= 95 ? 'bg-emerald-400' :
                        simulatedScore >= 87.5 ? 'bg-teal-400' :
                        simulatedScore >= 70 ? 'bg-amber-400' : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.min(100, simulatedScore)}%` }}
                    />
                  </div>
                </div>

                {/* Top Point Contributors Breakdown */}
                <div className="mt-4 pt-3 border-t border-indigo-900/60 space-y-2">
                  <span className="text-[10px] font-bold uppercase text-indigo-300 tracking-wider block">
                    Kontribusi Perubahan per Indikator:
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    {deltaContributions
                      .filter(d => d.diff !== 0)
                      .slice(0, 4)
                      .map(d => (
                        <div key={d.key} className="p-2 rounded-xl bg-white/5 border border-white/10 flex justify-between items-center">
                          <span className="text-indigo-200 truncate pr-1">{d.shortLabel}</span>
                          <span className={`font-mono font-black ${
                            d.pointContribution > 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {d.pointContribution > 0 ? `+${d.pointContribution}` : d.pointContribution}
                          </span>
                        </div>
                      ))}
                    {deltaContributions.filter(d => d.diff !== 0).length === 0 && (
                      <div className="col-span-2 text-center text-xs text-indigo-300/60 py-2 italic">
                        Belum ada parameter yang digeser.
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Dynamic Actionable Recommendation */}
              <div className="bg-indigo-950/90 p-3.5 rounded-xl border border-indigo-800/80 text-xs text-indigo-200 space-y-1">
                <div className="font-extrabold text-amber-300 flex items-center gap-1.5">
                  <Award className="w-4 h-4" /> Rekomendasi Khusus Pembina MSKI:
                </div>
                <p className="leading-relaxed text-[11px] text-indigo-200/90">
                  {simValues.capaianOutput === 0
                    ? '⚠️ KRITIS: Capaian Output SAKTI belum dikonfirmasi! Konfirmasi sebelum tanggal 5 sangat mutlak untuk menghindari hilangnya 25 poin penuh.'
                    : deltaScore > 3
                    ? `🚀 Target proyeksi sangat positif (+${deltaScore} poin). Prioritaskan koordinasi PIC satker untuk merealisasikan peningkatan pada indikator ${deltaContributions.sort((a,b) => b.pointContribution - a.pointContribution)[0]?.label}.`
                    : deltaScore < 0
                    ? `⚠️ Proyeksi menunjukkan penurunan skor. Lakukan mitigasi agar nilai IKPA tidak merosot di bawah batas ambang 87.50.`
                    : `Skenario saat ini identik dengan baseline asli (${baselineScore}). Gunakan tombol Skenario Cepat di atas untuk menguji proyeksi optimal.`}
                </p>
              </div>
            </div>

            {/* Radar Polygon Visualizer */}
            {activeSatker?.indikator && (
              <IkpaRadarChart
                baseline={activeSatker.indikator}
                simulated={simValues}
                isDark={isDark}
              />
            )}

            {/* Impact to KPPN Semarang I Aggregate Average */}
            {activeSatker && (
              <KppnAggregateImpactCard
                satkers={satkers}
                activeSatker={activeSatker}
                simulatedScore={simulatedScore}
                isDark={isDark}
              />
            )}

            {/* Elasticity / Sensitivity Matrix Table */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-extrabold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                  <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
                  Matriks Elastisitas Poin IKPA (+10% Peningkatan)
                </h5>
                <span className="text-[10px] text-slate-400 font-mono">Daya Dongkrak</span>
              </div>

              <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                Nilai poin total yang didapatkan satker jika masing-masing indikator dinaikkan sebesar +10%:
              </div>

              <div className="space-y-1.5 text-xs">
                {INDICATOR_METAS.map(m => {
                  const pointPer10 = (10 * m.weight).toFixed(2);
                  return (
                    <div
                      key={m.key}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          m.impactTier === 'high' ? 'bg-amber-500' :
                          m.impactTier === 'medium' ? 'bg-indigo-500' : 'bg-slate-400'
                        }`} />
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{m.label}</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-slate-400 text-[10px]">({(m.weight * 100).toFixed(0)}%)</span>
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400">+{pointPer10} Poin</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>

        {/* Saved Scenarios List Drawer */}
        {savedScenarios.length > 0 && (
          <div className="p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h5 className="text-xs font-black text-slate-800 dark:text-slate-200">
                  Skenario Simulasi Tersimpan ({savedScenarios.length})
                </h5>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                Tersimpan di browser lokal
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {savedScenarios.map((scen) => (
                <div
                  key={scen.id}
                  className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-2 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
                >
                  <div>
                    <div className="flex items-start justify-between gap-1">
                      <span className="font-extrabold text-xs text-slate-900 dark:text-white line-clamp-1">
                        {scen.name}
                      </span>
                      <span className="font-mono font-black text-xs px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                        {scen.score.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                      {scen.satkerKode} - {scen.satkerName}
                    </div>
                    <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                      {scen.timestamp}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => handleLoadScenario(scen)}
                      className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 flex items-center gap-1 cursor-pointer"
                    >
                      <FolderOpen className="w-3 h-3" />
                      <span>Terapkan Skenario</span>
                    </button>
                    <button
                      onClick={() => handleDeleteScenario(scen.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
                      title="Hapus Skenario"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </>
    )}

    {/* Sub-Tab 2: Head to Head Comparison */}
    {activeSubTab === 'comparison' && activeSatker && (
      <div className="pt-2">
        <HeadToHeadComparison
          satkerA={activeSatker}
          allSatkers={satkers}
          isDark={isDark}
          onApplyPresetToA={(newInd) => {
            setSimValues(newInd);
            setActiveSubTab('simulator');
          }}
        />
      </div>
    )}

      </div>

      {/* 3. MULTI-RISK RADAR ANOMALI & ACTION DIRECTORY (PER-5/PB/2024) */}
      {activeSubTab === 'anomalies' && (
        <div className={`rounded-3xl border shadow-xl p-6 sm:p-8 space-y-5 transition-all ${
          isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
        }`}>
        
        {/* Radar Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 px-3 py-1 rounded-full text-xs font-black">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
              <span>RADAR ANOMALI &amp; INTERVENSI SEGERA MSKI KPPN</span>
            </div>
            <h4 className="text-xl font-black mt-1.5 tracking-tight text-slate-900 dark:text-white">
              Satker Membutuhkan Asistensi &amp; Intervensi Terarah (PER-5/PB/2024)
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Daftar satker dengan indikasi kelemahan, gap nilai di bawah ambang batas, atau risiko hilangnya bobot capaian output SAKTI.
            </p>
          </div>

          {/* Category Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl text-xs font-extrabold">
            <button
              onClick={() => setAnomalyFilter('all')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                anomalyFilter === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Semua ({anomalySatkers.length})
            </button>
            <button
              onClick={() => setAnomalyFilter('critical')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
                anomalyFilter === 'critical'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
              }`}
            >
              <Flame className="w-3.5 h-3.5" /> Kritis ({anomalySatkers.filter(a => a.severity === 'critical').length})
            </button>
            <button
              onClick={() => setAnomalyFilter('warning')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
                anomalyFilter === 'warning'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" /> Waspada ({anomalySatkers.filter(a => a.severity === 'warning').length})
            </button>
            <button
              onClick={() => setAnomalyFilter('notice')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                anomalyFilter === 'notice'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40'
              }`}
            >
              Perhatian ({anomalySatkers.filter(a => a.severity === 'notice').length})
            </button>
          </div>
        </div>

        {/* Search filter for anomaly table */}
        <div className="flex items-center gap-2 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari satker, kode satker, atau jenis anomali..."
              value={searchAnomalyQuery}
              onChange={(e) => setSearchAnomalyQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          {searchAnomalyQuery && (
            <button
              onClick={() => setSearchAnomalyQuery('')}
              className="px-2 py-1 text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>

        {/* Anomaly Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-black uppercase text-[11px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Satker Bermasalah</th>
                <th className="py-3.5 px-4">Tingkat Urgensi</th>
                <th className="py-3.5 px-4">Anomali Terdeteksi</th>
                <th className="py-3.5 px-4 text-center">Nilai IKPA</th>
                <th className="py-3.5 px-4">Rekomendasi Tindak Lanjut MSKI</th>
                <th className="py-3.5 px-4 text-center">Aksi Cepat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredAnomalies.map((item) => (
                <tr
                  key={item.satker.id}
                  className={`transition-colors ${
                    item.severity === 'critical'
                      ? 'hover:bg-rose-50/50 dark:hover:bg-rose-950/20'
                      : item.severity === 'warning'
                      ? 'hover:bg-amber-50/50 dark:hover:bg-amber-950/20'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  {/* Satker Column */}
                  <td className="py-3.5 px-4 min-w-[220px]">
                    <div className="font-extrabold text-slate-900 dark:text-slate-100 text-xs">
                      {item.satker.namaSatker}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      <span>Kode: {item.satker.kodeSatker}</span>
                      {item.picPhone && (
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                          <Phone className="w-3 h-3" /> {item.picPhone}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Urgency Badge */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                      item.severity === 'critical'
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                        : item.severity === 'warning'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                        : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800'
                    }`}>
                      {item.severity === 'critical' && <Flame className="w-3 h-3 text-rose-600 animate-pulse" />}
                      {item.severity === 'warning' && <AlertTriangle className="w-3 h-3 text-amber-600" />}
                      {item.severity === 'critical' ? 'Kritis' : item.severity === 'warning' ? 'Waspada' : 'Perhatian'}
                    </span>
                  </td>

                  {/* Detected Anomalies */}
                  <td className="py-3.5 px-4 min-w-[200px]">
                    <div className="flex flex-wrap gap-1">
                      {item.anomalies.map((anom, idx) => (
                        <span
                          key={idx}
                          className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md font-bold text-[10px] border border-slate-200 dark:border-slate-700"
                        >
                          {anom}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Nilai IKPA */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <div className="font-black font-mono text-sm text-slate-900 dark:text-slate-100">
                      {item.satker.nilaiTotalIKPA}
                    </div>
                    <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded ${
                      item.satker.nilaiTotalIKPA >= 87.5
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}>
                      {item.satker.predikat || 'Kurang'}
                    </span>
                  </td>

                  {/* Recommendation */}
                  <td className="py-3.5 px-4 min-w-[260px] text-slate-700 dark:text-slate-300 leading-relaxed text-[11px]">
                    {item.recommendation}
                  </td>

                  {/* Actions Column */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5">
                      {/* Simulate this satker */}
                      <button
                        onClick={() => {
                          handleSelectSatker(item.satker.id);
                          setActiveSubTab('simulator');
                          simulatorTopRef.current?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer"
                        title="Simulasikan Satker Ini di What-If Simulator"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                      </button>

                      {/* Send WA Intervensi */}
                      <a
                        href={generateWhatsAppLink(item)}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer"
                        title="Kirim Pesan WhatsApp Intervensi Resmi KPPN"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </a>

                      {/* Copy Recommendation text */}
                      <button
                        onClick={() => handleCopyRecommendation(item)}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                        title="Salin Catatan Rekomendasi MSKI"
                      >
                        {copiedId === item.satker.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredAnomalies.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                    Tidak ada satker anomali yang cocok dengan kriteria pencarian / filter ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    )}

      {/* 4. REVERSE GOAL-SEEK MODAL */}
      {showGoalSeekModal && goalSeekSolutions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className={`w-full max-w-2xl rounded-3xl border shadow-2xl p-6 sm:p-7 space-y-5 transition-all ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-black">Reverse Goal-Seek Engine</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Cari formula indikator minimal untuk mencapai target nilai yang diinginkan
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowGoalSeekModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Target Input Controls */}
            <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/50 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-extrabold text-purple-900 dark:text-purple-200 block">
                    Satker Sasaran: {activeSatker?.namaSatker}
                  </span>
                  <span className="text-xs text-purple-700 dark:text-purple-300/80 font-mono">
                    Nilai Baseline Saat Ini: <strong>{baselineScore}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Target:</span>
                  <input
                    type="number"
                    min={baselineScore}
                    max="100"
                    step="0.5"
                    value={goalSeekTarget}
                    onChange={(e) => setGoalSeekTarget(Number(e.target.value))}
                    className="w-20 px-2.5 py-1.5 rounded-xl border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-900 font-mono font-black text-sm text-purple-700 dark:text-purple-300 text-center"
                  />
                </div>
              </div>

              {/* Fast Buttons */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[11px] text-slate-500">Pilihan Cepat:</span>
                <button
                  onClick={() => setGoalSeekTarget(87.5)}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800 font-bold text-purple-700 dark:text-purple-300 text-[11px] cursor-pointer"
                >
                  87.50 (Baik)
                </button>
                <button
                  onClick={() => setGoalSeekTarget(95.0)}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800 font-bold text-purple-700 dark:text-purple-300 text-[11px] cursor-pointer"
                >
                  95.00 (Sangat Baik)
                </button>
                <button
                  onClick={() => setGoalSeekTarget(98.0)}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800 font-bold text-purple-700 dark:text-purple-300 text-[11px] cursor-pointer"
                >
                  98.00 (Superior)
                </button>
              </div>
            </div>

            {/* Solution Paths */}
            <div className="space-y-3">
              <span className="text-xs font-extrabold uppercase text-slate-500 tracking-wider block">
                Alternatif Jalur Pencapaian (Gap: +{goalSeekSolutions.gap} Poin):
              </span>

              {/* Path A */}
              <div className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-black text-[10px]">
                      JALUR A
                    </span>
                    <span className="font-extrabold text-xs text-emerald-950 dark:text-emerald-200">
                      Effort Terkecil (Fokus Capaian Output SAKTI &amp; Penyerapan)
                    </span>
                  </div>
                  <span className="font-mono font-black text-emerald-700 dark:text-emerald-300 text-xs">
                    Hasil: {goalSeekSolutions.scoreA}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Mendongkrak Capaian Output ke {goalSeekSolutions.pathA.capaianOutput}% dan Penyerapan ke {goalSeekSolutions.pathA.penyerapanAnggaran}%. Cepat dan berdampak paling masif tanpa merombak seluruh proses satker.
                </p>
                <button
                  onClick={() => {
                    setSimValues(goalSeekSolutions.pathA);
                    setShowGoalSeekModal(false);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs cursor-pointer"
                >
                  Terapkan Jalur A ke Slider
                </button>
              </div>

              {/* Path B */}
              <div className="p-4 rounded-2xl border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-indigo-600 text-white font-black text-[10px]">
                      JALUR B
                    </span>
                    <span className="font-extrabold text-xs text-indigo-950 dark:text-indigo-200">
                      Jalur Administrasi Cepat (Tagihan, UP/TUP, &amp; Kontrak)
                    </span>
                  </div>
                  <span className="font-mono font-black text-indigo-700 dark:text-indigo-300 text-xs">
                    Hasil: {goalSeekSolutions.scoreB}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Memaksimalkan indikator yang murni berada dalam kendali bendahara/PPK: Tagihan 100%, UP/TUP 100%, dan Kontrak tepat waktu.
                </p>
                <button
                  onClick={() => {
                    setSimValues(goalSeekSolutions.pathB);
                    setShowGoalSeekModal(false);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs cursor-pointer"
                >
                  Terapkan Jalur B ke Slider
                </button>
              </div>

              {/* Path C */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-slate-700 text-white font-black text-[10px]">
                      JALUR C
                    </span>
                    <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200">
                      Peningkatan Berimbang (Distribusi Rata Seluruh Indikator)
                    </span>
                  </div>
                  <span className="font-mono font-black text-slate-800 dark:text-slate-200 text-xs">
                    Hasil: {goalSeekSolutions.scoreC}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Meningkatkan seluruh 8 indikator secara merata sebesar proporsional target.
                </p>
                <button
                  onClick={() => {
                    setSimValues(goalSeekSolutions.pathC);
                    setShowGoalSeekModal(false);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs cursor-pointer"
                >
                  Terapkan Jalur C ke Slider
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 5. DEVIASI HALAMAN III DIPA CALCULATOR MODAL */}
      <DeviasiHal3DipaCalculatorModal
        isOpen={showDeviasiModal}
        onClose={() => setShowDeviasiModal(false)}
        onApplyScore={(score) => {
          setSimValues(prev => ({ ...prev, deviasiHal3Dipa: score }));
        }}
        isDark={isDark}
      />

      {/* 6. PENYERAPAN ANGGARAN 4 BELANJA CALCULATOR MODAL */}
      <PenyerapanBelanjaCalculatorModal
        isOpen={showPenyerapanModal}
        onClose={() => setShowPenyerapanModal(false)}
        onApplyScore={(score) => {
          setSimValues(prev => ({ ...prev, penyerapanAnggaran: score }));
        }}
        isDark={isDark}
      />

      {/* 7. SAVE SCENARIO MODAL */}
      {showSaveScenarioModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className={`w-full max-w-md rounded-3xl border shadow-2xl p-6 space-y-4 transition-all ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400">
                  <Save className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black">Simpan Skenario Simulasi</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Beri nama untuk skenario proyeksi saat ini
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSaveScenarioModal(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold hover:bg-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Nama Skenario:
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Optimasi RPD Q3 + Percepatan UP"
                  value={scenarioNameInput}
                  onChange={(e) => setScenarioNameInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-hidden"
                  autoFocus
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Satker:</span>
                  <span className="font-bold">{activeSatker?.kodeSatker} - {activeSatker?.namaSatker}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Nilai Proyeksi:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    {simulatedScore.toFixed(2)} ({simulatedPredikat})
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setShowSaveScenarioModal(false)}
                className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleSaveCurrentScenario}
                disabled={!scenarioNameInput.trim()}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-black shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Skenario</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
