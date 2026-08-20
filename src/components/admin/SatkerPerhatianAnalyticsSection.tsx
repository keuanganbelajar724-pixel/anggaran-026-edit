import React, { useState, useMemo } from 'react';
import { 
  AlertTriangle, 
  AlertCircle, 
  Search, 
  Download, 
  Layers, 
  FileSpreadsheet, 
  TrendingDown, 
  Target, 
  ShieldAlert, 
  Activity, 
  SlidersHorizontal, 
  Eye, 
  ChevronRight, 
  Calendar, 
  Award, 
  CreditCard, 
  UserCheck, 
  HelpCircle, 
  Info, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Building2, 
  Wrench, 
  X, 
  Edit3,
  BarChart3
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { 
  SatkerIKPA, 
  AppTheme, 
  PejabatSertifikasi, 
  PengelolaanUPRecord, 
  MasterSatker 
} from '../../types';

export type RiskClusterKey = 
  | 'ALL' 
  | 'OUTPUT_KRITIS' 
  | 'DEVIASI_RPD' 
  | 'PENYERAPAN_LAMBAT' 
  | 'DISIPLIN_TAGIHAN' 
  | 'KOMPLIKASI_MULTI';

export interface SatkerDiagnosticProfile {
  satker: SatkerIKPA;
  clusters: RiskClusterKey[];
  primaryCluster: RiskClusterKey;
  clusterLabels: string[];
  rootCauses: string[];
  kppnImpact: string;
  recommendedActions: string[];
  urgencyLevel: 'KRITIS' | 'TINGGI' | 'SEDANG';
  upStatus?: {
    hasWarning: boolean;
    label: string;
  };
  sertifikasiStatus?: {
    hasWarning: boolean;
    label: string;
    details: string;
  };
}

interface SatkerPerhatianAnalyticsSectionProps {
  satkers: SatkerIKPA[];
  masterSatkers?: MasterSatker[];
  pejabatList?: PejabatSertifikasi[];
  pengelolaanUpRecords?: PengelolaanUPRecord[];
  isDark?: boolean;
  theme?: AppTheme;
  onOpenEditSatker?: (satker: SatkerIKPA) => void;
}

export const SatkerPerhatianAnalyticsSection: React.FC<SatkerPerhatianAnalyticsSectionProps> = ({
  satkers,
  masterSatkers = [],
  pejabatList = [],
  pengelolaanUpRecords = [],
  isDark = false,
  onOpenEditSatker
}) => {
  const [selectedCluster, setSelectedCluster] = useState<RiskClusterKey>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterUrgency, setFilterUrgency] = useState<'ALL' | 'KRITIS' | 'TINGGI' | 'SEDANG'>('ALL');
  const [selectedSatkerDiagnostic, setSelectedSatkerDiagnostic] = useState<SatkerDiagnosticProfile | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('kppn_satker_perhatian_notes');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Save admin notes to LocalStorage
  const handleSaveNote = (kodeSatker: string, noteText: string) => {
    const updated = { ...adminNotes, [kodeSatker]: noteText };
    setAdminNotes(updated);
    try {
      localStorage.setItem('kppn_satker_perhatian_notes', JSON.stringify(updated));
    } catch (e) {
      console.warn('Gagal menyimpan catatan admin:', e);
    }
  };

  // Build Diagnostic Profiles for each Satker
  const diagnosticProfiles = useMemo<SatkerDiagnosticProfile[]>(() => {
    return satkers.map(satker => {
      const ind = satker.indikator || {
        revisiDipa: 100,
        deviasiHal3Dipa: 100,
        penyerapanAnggaran: 100,
        belanjaKontraktual: 100,
        penyelesaianTagihan: 100,
        pengelolaanUPTUP: 100,
        dispensasiSPM: 100,
        capaianOutput: 100,
        dataKontrak: 100,
        penyampaianLPJBendahara: 100
      };

      const clusters: RiskClusterKey[] = [];
      const rootCauses: string[] = [];
      const recommendedActions: string[] = [];
      let urgencyScore = 0;

      // 1. Kluster Capaian Output Kritis (Bobot 25%)
      const isOutputIssue = 
        satker.statusCapaianOutput !== 'Sudah Terlaporkan' || 
        ind.capaianOutput === 0 || 
        ind.capaianOutput < 65;
      
      if (isOutputIssue) {
        clusters.push('OUTPUT_KRITIS');
        urgencyScore += 4;
        if (satker.statusCapaianOutput !== 'Sudah Terlaporkan' || ind.capaianOutput === 0) {
          rootCauses.push('Data Capaian Output SAKTI belum dikonfirmasi/terlaporkan atau terdeteksi 0% pada sistem.');
          recommendedActions.push('Asistensi percepatan konfirmasi data capaian output pada modul Pelaporan SAKTI sebelum tanggal cut-off.');
        } else {
          rootCauses.push(`Realisasi progress capaian output rendah (${ind.capaianOutput}%), terjadi gap terhadap target fisik.`);
          recommendedActions.push('Evaluasi gap pencapaian target fisik output strategis dan rekonsiliasi data referensi output.');
        }
      }

      // 2. Kluster Deviasi Hal III DIPA (Bobot 10%)
      const isDeviasiIssue = ind.deviasiHal3Dipa < 80;
      if (isDeviasiIssue) {
        clusters.push('DEVIASI_RPD');
        urgencyScore += 3;
        rootCauses.push(`Deviasi Rencana Penarikan Dana (RPD) Hal III DIPA cukup tinggi (skor: ${ind.deviasiHal3Dipa.toFixed(1)}), realisasi meleset dari jadwal.`);
        recommendedActions.push('Optimalkan pemutakhiran matriks RPD pada 10 hari kerja pertama awal triwulan dan susun kalender belanja per jenis.');
      }

      // 3. Kluster Penyerapan Anggaran Lambat (Bobot 20%)
      const isPenyerapanIssue = satker.persenPenyerapan < 75 || ind.penyerapanAnggaran < 75;
      if (isPenyerapanIssue) {
        clusters.push('PENYERAPAN_LAMBAT');
        urgencyScore += 2;
        rootCauses.push(`Realisasi penyerapan anggaran lambat (${satker.persenPenyerapan.toFixed(1)}%), tertinggal dari target triwulan.`);
        recommendedActions.push('Akselerasi penerbitan SPM kontraktual/operasional dan identifikasi kendala blokir/termin belanja modal.');
      }

      // 4. Kluster Disiplin Tagihan, Kontrak, & LPJ (Bobot 35% gabungan)
      const isDisiplinIssue = 
        ind.penyelesaianTagihan < 85 || 
        ind.dataKontrak < 85 || 
        ind.penyampaianLPJBendahara < 85 ||
        ind.pengelolaanUPTUP < 85;
      
      if (isDisiplinIssue) {
        clusters.push('DISIPLIN_TAGIHAN');
        urgencyScore += 2;
        const subCauses: string[] = [];
        if (ind.penyelesaianTagihan < 85) subCauses.push('Keterlambatan penyampaian SPM > 17 hari kerja dari BAST');
        if (ind.dataKontrak < 85) subCauses.push('Pendaftaran kontrak ke KPPN > 3 hari kerja');
        if (ind.penyampaianLPJBendahara < 85) subCauses.push('Penyampaian LPJ Bendahara terlambat atau ditolak');
        if (ind.pengelolaanUPTUP < 85) subCauses.push('Revolving UP melampaui batas 30 hari atau tidak tertib GUP');
        
        rootCauses.push(`Kendala kepatuhan administrasi perbendaharaan: ${subCauses.join(', ')}.`);
        recommendedActions.push('Sosialisasi & pembinaan disiplin timeline pendaftaran kontrak, BAST SPM, dan tertib LPJ Bendahara.');
      }

      // 5. Kluster Komplikasi Multi-Indikator (Total IKPA < 87.5)
      if (satker.nilaiTotalIKPA < 87.5 || clusters.length >= 2) {
        clusters.push('KOMPLIKASI_MULTI');
        urgencyScore += 3;
        rootCauses.push(`Nilai Total IKPA berada di zona risiko (${satker.nilaiTotalIKPA.toFixed(2)} - ${satker.predikat}) dengan multi-indikator anjlok.`);
        recommendedActions.push('Fasilitasi sesi konsultasi & asistensi khusus (one-on-one monev) antara Seksi MSKI dan KPA/PPK Satker.');
      }

      // Hubungan ke Pengelolaan UP/TUP
      const cleanKode = satker.kodeSatker?.trim() || '';
      const upRec = pengelolaanUpRecords.find(r => r.kodeSatker?.trim() === cleanKode);
      let upStatus: { hasWarning: boolean; label: string } | undefined = undefined;
      if (upRec) {
        const isRevolvingSlow = (upRec.persentaseRevolving || 0) < 50 || upRec.sisaHariRevolving !== undefined && upRec.sisaHariRevolving <= 5;
        upStatus = {
          hasWarning: isRevolvingSlow,
          label: isRevolvingSlow 
            ? `⚠️ Revolving Rendah (${(upRec.persentaseRevolving || 0)}%) / Sisa Waktu Kritis` 
            : `✅ UP Terkendali (${(upRec.persentaseRevolving || 0)}%)`
        };
        if (isRevolvingSlow) {
          urgencyScore += 1;
        }
      }

      // Hubungan ke Sertifikasi Pejabat Perbendaharaan
      const pejabatsForSatker = pejabatList.filter(p => p.kodeSatker?.trim() === cleanKode);
      let sertifikasiStatus: { hasWarning: boolean; label: string; details: string } | undefined = undefined;
      if (pejabatsForSatker.length > 0) {
        const uncertified = pejabatsForSatker.filter(p => !p.statusSertifikasi || p.statusSertifikasi.toLowerCase().includes('belum') || p.statusSertifikasi.toLowerCase().includes('tidak'));
        const hasWarning = uncertified.length > 0;
        sertifikasiStatus = {
          hasWarning,
          label: hasWarning ? `⚠️ ${uncertified.length} Pejabat Belum Bersertifikat` : `✅ Seluruh Pejabat (${pejabatsForSatker.length}) Bersertifikat`,
          details: uncertified.map(u => `${u.jabatan}: ${u.namaPejabat}`).join('; ')
        };
        if (hasWarning) {
          urgencyScore += 1;
        }
      }

      // Tentukan Primary Cluster & Urgency Level
      let primaryCluster: RiskClusterKey = 'ALL';
      if (clusters.includes('OUTPUT_KRITIS')) primaryCluster = 'OUTPUT_KRITIS';
      else if (clusters.includes('KOMPLIKASI_MULTI')) primaryCluster = 'KOMPLIKASI_MULTI';
      else if (clusters.includes('DEVIASI_RPD')) primaryCluster = 'DEVIASI_RPD';
      else if (clusters.includes('PENYERAPAN_LAMBAT')) primaryCluster = 'PENYERAPAN_LAMBAT';
      else if (clusters.includes('DISIPLIN_TAGIHAN')) primaryCluster = 'DISIPLIN_TAGIHAN';

      let urgencyLevel: 'KRITIS' | 'TINGGI' | 'SEDANG' = 'SEDANG';
      if (urgencyScore >= 5 || satker.nilaiTotalIKPA < 75 || satker.statusCapaianOutput !== 'Sudah Terlaporkan') {
        urgencyLevel = 'KRITIS';
      } else if (urgencyScore >= 3 || satker.nilaiTotalIKPA < 87.5) {
        urgencyLevel = 'TINGGI';
      }

      const clusterLabels: string[] = [];
      if (clusters.includes('OUTPUT_KRITIS')) clusterLabels.push('Capaian Output Kritis');
      if (clusters.includes('DEVIASI_RPD')) clusterLabels.push('Deviasi Hal III DIPA');
      if (clusters.includes('PENYERAPAN_LAMBAT')) clusterLabels.push('Penyerapan Rendah');
      if (clusters.includes('DISIPLIN_TAGIHAN')) clusterLabels.push('Disiplin Tagihan/Kontrak/LPJ');
      if (clusters.includes('KOMPLIKASI_MULTI')) clusterLabels.push('Multi-Indikator Risiko');

      const kppnImpact = clusters.includes('OUTPUT_KRITIS')
        ? 'Berdampak langsung menurunkan agregat nilai IKPA KPPN (bobot output 25%) dan risiko anomali data di tingkat Kanwil/Kantor Pusat.'
        : clusters.includes('DEVIASI_RPD')
        ? 'Mengurangi presisi proyeksi perencanaan kas harian/bulanan KPPN Semarang I.'
        : 'Membebani evaluasi kinerja perbendaharaan dan kepatuhan regulasi PER-5/PB/2024.';

      return {
        satker,
        clusters,
        primaryCluster,
        clusterLabels,
        rootCauses,
        kppnImpact,
        recommendedActions,
        urgencyLevel,
        upStatus,
        sertifikasiStatus
      };
    }).filter(p => p.clusters.length > 0);
  }, [satkers, pejabatList, pengelolaanUpRecords]);

  // Filtered List
  const filteredProfiles = useMemo(() => {
    return diagnosticProfiles.filter(p => {
      // Cluster filter
      if (selectedCluster !== 'ALL' && !p.clusters.includes(selectedCluster)) {
        return false;
      }
      // Urgency filter
      if (filterUrgency !== 'ALL' && p.urgencyLevel !== filterUrgency) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const s = p.satker;
        return (
          s.namaSatker.toLowerCase().includes(q) ||
          s.kodeSatker.includes(q) ||
          s.kementerianLembaga.toLowerCase().includes(q) ||
          p.clusterLabels.some(l => l.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [diagnosticProfiles, selectedCluster, filterUrgency, searchQuery]);

  // Statistics per Cluster
  const clusterCounts = useMemo(() => {
    const all = diagnosticProfiles.length;
    const outputKritis = diagnosticProfiles.filter(p => p.clusters.includes('OUTPUT_KRITIS')).length;
    const deviasiRpd = diagnosticProfiles.filter(p => p.clusters.includes('DEVIASI_RPD')).length;
    const penyerapanLambat = diagnosticProfiles.filter(p => p.clusters.includes('PENYERAPAN_LAMBAT')).length;
    const disiplinTagihan = diagnosticProfiles.filter(p => p.clusters.includes('DISIPLIN_TAGIHAN')).length;
    const komplikasiMulti = diagnosticProfiles.filter(p => p.clusters.includes('KOMPLIKASI_MULTI')).length;

    const kritisCount = diagnosticProfiles.filter(p => p.urgencyLevel === 'KRITIS').length;
    const tinggiCount = diagnosticProfiles.filter(p => p.urgencyLevel === 'TINGGI').length;
    const sedangCount = diagnosticProfiles.filter(p => p.urgencyLevel === 'SEDANG').length;

    const avgIkpa = all > 0 
      ? (diagnosticProfiles.reduce((acc, p) => acc + p.satker.nilaiTotalIKPA, 0) / all).toFixed(2)
      : '0.00';

    return {
      all,
      outputKritis,
      deviasiRpd,
      penyerapanLambat,
      disiplinTagihan,
      komplikasiMulti,
      kritisCount,
      tinggiCount,
      sedangCount,
      avgIkpa
    };
  }, [diagnosticProfiles]);

  // Export Executive Deep Diagnostic Excel Report
  const handleExportExecutiveReport = () => {
    const dataToExport = filteredProfiles.map((p, idx) => ({
      'No': idx + 1,
      'Kode Satker': p.satker.kodeSatker,
      'Nama Satuan Kerja': p.satker.namaSatker,
      'Kementerian / Lembaga': p.satker.kementerianLembaga,
      'Nilai Total IKPA': p.satker.nilaiTotalIKPA,
      'Predikat IKPA': p.satker.predikat,
      'Tingkat Urgensi': p.urgencyLevel,
      'Kluster Risiko Masalah': p.clusterLabels.join(', '),
      'Status Capaian Output': `${p.satker.statusCapaianOutput} (${p.satker.indikator?.capaianOutput || 0}%)`,
      'Deviasi Hal III DIPA': `${p.satker.indikator?.deviasiHal3Dipa || 0}%`,
      'Persen Penyerapan': `${p.satker.persenPenyerapan || 0}%`,
      'Diagnosa Akar Penyebab (Root Cause)': p.rootCauses.join(' | '),
      'Dampak Terhadap KPPN': p.kppnImpact,
      'Rekomendasi Tindak Lanjut Pembinaan MSKI': p.recommendedActions.join(' | '),
      'Status Kaitan Pengelolaan UP/TUP': p.upStatus?.label || 'Belum Terpetakan',
      'Status Kaitan Sertifikasi Pejabat': p.sertifikasiStatus?.label || 'Belum Terpetakan',
      'Catatan Evaluasi Tim MSKI': adminNotes[p.satker.kodeSatker] || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Analisis_Satker_Perhatian');
    XLSX.writeFile(wb, `Analisis_Diagnosa_Satker_Perhatian_KPPN026_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Container Box */}
      <div className={`${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'} rounded-3xl border shadow-xl p-6 sm:p-8 space-y-6`}>
        
        {/* Executive Header Banner */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div className="space-y-1.5 max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-sky-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 px-3 py-1 rounded-full text-xs font-black">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
              <span>WORKSPACE EKSEKUTIF ANALISIS DIAGNOSA &amp; KLASTER RISIKO SATKER</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Evaluasi Mendalam &amp; Klasterisasi Satuan Kerja Dalam Perhatian
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
              Modul analitik internal Admin untuk mendiagnosa akar penyebab, memetakan kelompok masalah kinerja (Capaian Output, Deviasi Hal III DIPA, Penyerapan, Disiplin Tagihan), serta merumuskan rekomendasi pembinaan KPPN Semarang I.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleExportExecutiveReport}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-950/20 flex items-center gap-2 cursor-pointer active:scale-95"
              title="Unduh Laporan Analisis Diagnosa Lengkap (Format Excel)"
            >
              <Download className="w-4 h-4" />
              <span>Unduh Rekap Diagnosa Eksekutif (Excel)</span>
            </button>
          </div>
        </div>

        {/* Executive Risk KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-rose-50/60 border-rose-200/70'} space-y-1`}>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 font-bold">Total Satker Perhatian</span>
              <span className="p-1 rounded-lg bg-rose-500/10 text-rose-600 font-black text-[10px]">ALL</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400">
              {clusterCounts.all} <span className="text-xs font-normal text-slate-400">Satker</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Rata-rata IKPA: <span className="font-extrabold text-rose-600">{clusterCounts.avgIkpa}</span>
            </p>
          </div>

          <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-amber-50/60 border-amber-200/70'} space-y-1`}>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 font-bold">Tingkat Urgensi Kritis</span>
              <span className="p-1 rounded-lg bg-rose-600 text-white font-black text-[10px]">KRITIS</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
              {clusterCounts.kritisCount} <span className="text-xs font-normal text-slate-400">Satker</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Output 0% / IKPA &lt; 75 / Multi-kegagalan
            </p>
          </div>

          <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-purple-50/60 border-purple-200/70'} space-y-1`}>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 font-bold">Urgensi Tinggi &amp; Sedang</span>
              <span className="p-1 rounded-lg bg-purple-500/10 text-purple-600 font-black text-[10px]">MONITORING</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400">
              {clusterCounts.tinggiCount + clusterCounts.sedangCount} <span className="text-xs font-normal text-slate-400">Satker</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Tinggi: {clusterCounts.tinggiCount} • Sedang: {clusterCounts.sedangCount}
            </p>
          </div>

          <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-sky-50/60 border-sky-200/70'} space-y-1`}>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 font-bold">Kaitan UP &amp; Sertifikasi</span>
              <span className="p-1 rounded-lg bg-sky-500/10 text-sky-600 font-black text-[10px]">FORWARD</span>
            </div>
            <div className="text-sm font-extrabold text-sky-700 dark:text-sky-300 mt-1">
              Siap Terhubung &amp; Terintegrasi
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Monev UP 30 Hari &amp; Sertifikat PPK/PPSPM
            </p>
          </div>
        </div>

        {/* 5 Risk Clusters Navigation Buttons */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-rose-500" />
              Kelompok / Klaster Penyebab Masalah Kinerja Satker:
            </span>
            <span className="text-[11px] text-slate-400">
              Klik klaster untuk memfilter analisis
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {/* Cluster All */}
            <button
              type="button"
              onClick={() => setSelectedCluster('ALL')}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                selectedCluster === 'ALL'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-lg ring-2 ring-slate-400/30'
                  : isDark ? 'bg-slate-950/60 hover:bg-slate-800 border-slate-800 text-slate-200' : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase">Semua Klaster</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  selectedCluster === 'ALL' ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}>
                  {clusterCounts.all}
                </span>
              </div>
              <span className="text-[10px] opacity-75 mt-2 line-clamp-1 font-medium">Kompilasi Seluruh Masalah</span>
            </button>

            {/* Cluster 1: Capaian Output Kritis */}
            <button
              type="button"
              onClick={() => setSelectedCluster('OUTPUT_KRITIS')}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                selectedCluster === 'OUTPUT_KRITIS'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-lg ring-2 ring-rose-400/50'
                  : isDark ? 'bg-slate-950/60 hover:bg-slate-800 border-slate-800 text-slate-200' : 'bg-rose-50/50 hover:bg-rose-100/60 border-rose-200 text-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase">1. Output Kritis (25%)</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  selectedCluster === 'OUTPUT_KRITIS' ? 'bg-white/20 text-white' : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                }`}>
                  {clusterCounts.outputKritis}
                </span>
              </div>
              <span className="text-[10px] opacity-80 mt-2 line-clamp-1 font-medium">0% / Belum Lapor SAKTI</span>
            </button>

            {/* Cluster 2: Deviasi Hal III DIPA */}
            <button
              type="button"
              onClick={() => setSelectedCluster('DEVIASI_RPD')}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                selectedCluster === 'DEVIASI_RPD'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-lg ring-2 ring-amber-400/50'
                  : isDark ? 'bg-slate-950/60 hover:bg-slate-800 border-slate-800 text-slate-200' : 'bg-amber-50/50 hover:bg-amber-100/60 border-amber-200 text-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase">2. Deviasi RPD (10%)</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  selectedCluster === 'DEVIASI_RPD' ? 'bg-white/20 text-white' : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                }`}>
                  {clusterCounts.deviasiRpd}
                </span>
              </div>
              <span className="text-[10px] opacity-80 mt-2 line-clamp-1 font-medium">Meleset dari Rencana Kas</span>
            </button>

            {/* Cluster 3: Penyerapan Lambat */}
            <button
              type="button"
              onClick={() => setSelectedCluster('PENYERAPAN_LAMBAT')}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                selectedCluster === 'PENYERAPAN_LAMBAT'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-lg ring-2 ring-purple-400/50'
                  : isDark ? 'bg-slate-950/60 hover:bg-slate-800 border-slate-800 text-slate-200' : 'bg-purple-50/50 hover:bg-purple-100/60 border-purple-200 text-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase">3. Serapan Rendah (20%)</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  selectedCluster === 'PENYERAPAN_LAMBAT' ? 'bg-white/20 text-white' : 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                }`}>
                  {clusterCounts.penyerapanLambat}
                </span>
              </div>
              <span className="text-[10px] opacity-80 mt-2 line-clamp-1 font-medium">Kurva Belanja Tertinggal</span>
            </button>

            {/* Cluster 4: Disiplin Tagihan & LPJ */}
            <button
              type="button"
              onClick={() => setSelectedCluster('DISIPLIN_TAGIHAN')}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                selectedCluster === 'DISIPLIN_TAGIHAN'
                  ? 'bg-sky-600 text-white border-sky-600 shadow-lg ring-2 ring-sky-400/50'
                  : isDark ? 'bg-slate-950/60 hover:bg-slate-800 border-slate-800 text-slate-200' : 'bg-sky-50/50 hover:bg-sky-100/60 border-sky-200 text-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase">4. Tagihan &amp; LPJ</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  selectedCluster === 'DISIPLIN_TAGIHAN' ? 'bg-white/20 text-white' : 'bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300'
                }`}>
                  {clusterCounts.disiplinTagihan}
                </span>
              </div>
              <span className="text-[10px] opacity-80 mt-2 line-clamp-1 font-medium">SPM/Kontrak/LPJ Terlambat</span>
            </button>

            {/* Cluster 5: Komplikasi Multi */}
            <button
              type="button"
              onClick={() => setSelectedCluster('KOMPLIKASI_MULTI')}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                selectedCluster === 'KOMPLIKASI_MULTI'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg ring-2 ring-indigo-400/50'
                  : isDark ? 'bg-slate-950/60 hover:bg-slate-800 border-slate-800 text-slate-200' : 'bg-indigo-50/50 hover:bg-indigo-100/60 border-indigo-200 text-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase">5. Multi-Risiko</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  selectedCluster === 'KOMPLIKASI_MULTI' ? 'bg-white/20 text-white' : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                }`}>
                  {clusterCounts.komplikasiMulti}
                </span>
              </div>
              <span className="text-[10px] opacity-80 mt-2 line-clamp-1 font-medium">IKPA &lt; 87.5 / Anjlok</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-100/80 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari Kode, Nama Satker, atau K/L..."
              className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="font-bold text-slate-500 text-[11px] shrink-0">Filter Urgensi:</span>
            <select
              value={filterUrgency}
              onChange={(e) => setFilterUrgency(e.target.value as any)}
              className="w-full sm:w-auto px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs"
            >
              <option value="ALL">Semua Urgensi ({diagnosticProfiles.length})</option>
              <option value="KRITIS">🔴 Prioritas Kritis</option>
              <option value="TINGGI">⚠️ Prioritas Tinggi</option>
              <option value="SEDANG">🟡 Prioritas Sedang</option>
            </select>
          </div>
        </div>

        {/* Analytical Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 font-extrabold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4">Satker &amp; K/L</th>
                <th className="py-3 px-4 text-center">Nilai IKPA</th>
                <th className="py-3 px-4">Klaster Masalah &amp; Urgensi</th>
                <th className="py-3 px-4">Diagnosa Akar Penyebab (Root Cause)</th>
                <th className="py-3 px-4">Kaitan UP &amp; Sertifikasi</th>
                <th className="py-3 px-4 text-center">Aksi Telaah Eksekutif</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredProfiles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                      <span className="font-bold text-sm">Tidak ditemukan Satker pada kriteria ini</span>
                      <span className="text-xs text-slate-500">Semua satker pada filter ini memiliki performa yang baik.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProfiles.map((p) => {
                  const s = p.satker;
                  const isKritis = p.urgencyLevel === 'KRITIS';
                  const isTinggi = p.urgencyLevel === 'TINGGI';

                  return (
                    <tr key={s.id || s.kodeSatker} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors">
                      {/* Satker Column */}
                      <td className="py-3.5 px-4">
                        <div className="font-black text-slate-900 dark:text-slate-100 text-xs">
                          {s.namaSatker}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-500 font-mono">
                          <span>Kode: {s.kodeSatker}</span>
                          <span>•</span>
                          <span className="font-sans truncate max-w-[200px]">{s.kementerianLembaga}</span>
                        </div>
                      </td>

                      {/* IKPA Score Column */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-xl font-black text-xs inline-block ${
                          s.nilaiTotalIKPA < 80 
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300' 
                            : s.nilaiTotalIKPA < 87.5 
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}>
                          {s.nilaiTotalIKPA.toFixed(2)}
                        </span>
                        <div className="text-[10px] text-slate-400 uppercase mt-0.5 font-extrabold">{s.predikat}</div>
                      </td>

                      {/* Clusters & Urgency Column */}
                      <td className="py-3.5 px-4 space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                            isKritis
                              ? 'bg-rose-600 text-white'
                              : isTinggi
                              ? 'bg-amber-500 text-white'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                          }`}>
                            {p.urgencyLevel}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {p.clusters.map(c => {
                            let label = '';
                            let badgeStyle = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
                            if (c === 'OUTPUT_KRITIS') {
                              label = 'Output 0%/Kritis';
                              badgeStyle = 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold';
                            } else if (c === 'DEVIASI_RPD') {
                              label = 'Deviasi RPD';
                              badgeStyle = 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold';
                            } else if (c === 'PENYERAPAN_LAMBAT') {
                              label = 'Serapan Lambat';
                              badgeStyle = 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 font-bold';
                            } else if (c === 'DISIPLIN_TAGIHAN') {
                              label = 'Disiplin SPM/LPJ';
                              badgeStyle = 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 font-bold';
                            } else if (c === 'KOMPLIKASI_MULTI') {
                              label = 'Multi-Risiko';
                              badgeStyle = 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 font-bold';
                            }
                            return (
                              <span key={c} className={`text-[10px] px-2 py-0.5 rounded ${badgeStyle}`}>
                                {label}
                              </span>
                            );
                          })}
                        </div>
                      </td>

                      {/* Root Causes Column */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <ul className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300 list-disc list-inside">
                          {p.rootCauses.slice(0, 2).map((rc, i) => (
                            <li key={i} className="line-clamp-2 leading-tight">
                              {rc}
                            </li>
                          ))}
                        </ul>
                      </td>

                      {/* Forward Looking Integration Column (UP & Sertifikasi) */}
                      <td className="py-3.5 px-4 space-y-1">
                        {p.upStatus ? (
                          <div className="text-[10px] font-bold">
                            {p.upStatus.label}
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400 italic">UP: Siap terhubung</div>
                        )}

                        {p.sertifikasiStatus ? (
                          <div className="text-[10px] font-bold">
                            {p.sertifikasiStatus.label}
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400 italic">Sertifikasi: Siap terhubung</div>
                        )}
                      </td>

                      {/* Action Column (No WhatsApp - Deep Admin Analysis Only) */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedSatkerDiagnostic(p)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer active:scale-95"
                            title="Buka Lembar Diagnosa Eksekutif & Rencana Tindak Lanjut"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Diagnosa</span>
                          </button>

                          {onOpenEditSatker && (
                            <button
                              type="button"
                              onClick={() => onOpenEditSatker(s)}
                              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer border border-slate-300 dark:border-slate-700"
                              title="Edit / Sinkronisasi Data Satker"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-sky-500" />
                            </button>
                          )}
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

      {/* MODAL LEMBAR DIAGNOSA EKSEKUTIF SATKER */}
      {selectedSatkerDiagnostic && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
          <div 
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md" 
            onClick={() => setSelectedSatkerDiagnostic(null)} 
          />

          <div className={`relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border shadow-2xl z-10 p-6 sm:p-8 space-y-6 ${
            isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-500/10 text-rose-600 border border-rose-500/30">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>LEMBAR TELAAH &amp; DIAGNOSA MONEV EKSEKUTIF KPPN</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight">
                  {selectedSatkerDiagnostic.satker.namaSatker}
                </h3>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
                  <span>Kode: {selectedSatkerDiagnostic.satker.kodeSatker}</span>
                  <span>•</span>
                  <span className="font-sans">{selectedSatkerDiagnostic.satker.kementerianLembaga}</span>
                  <span>•</span>
                  <span>Periode: {selectedSatkerDiagnostic.satker.periodeUpdate || '2026'}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedSatkerDiagnostic(null)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Score & Urgency Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-slate-500 font-bold block">Nilai Total IKPA</span>
                <span className="text-2xl font-black text-rose-600 mt-1 block">
                  {selectedSatkerDiagnostic.satker.nilaiTotalIKPA.toFixed(2)}
                </span>
                <span className="text-[11px] text-slate-400 font-extrabold uppercase">
                  Predikat: {selectedSatkerDiagnostic.satker.predikat}
                </span>
              </div>

              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-slate-500 font-bold block">Tingkat Urgensi Intervensi</span>
                <span className={`text-xl font-black mt-1 block ${
                  selectedSatkerDiagnostic.urgencyLevel === 'KRITIS' ? 'text-rose-600' : selectedSatkerDiagnostic.urgencyLevel === 'TINGGI' ? 'text-amber-600' : 'text-slate-700 dark:text-slate-300'
                }`}>
                  {selectedSatkerDiagnostic.urgencyLevel}
                </span>
                <span className="text-[11px] text-slate-400">
                  {selectedSatkerDiagnostic.clusterLabels.join(', ')}
                </span>
              </div>

              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-slate-500 font-bold block">Status Output SAKTI</span>
                <span className="text-base font-black text-indigo-600 dark:text-indigo-400 mt-1 block">
                  {selectedSatkerDiagnostic.satker.statusCapaianOutput}
                </span>
                <span className="text-[11px] text-slate-400">
                  Skor Output: {selectedSatkerDiagnostic.satker.indikator?.capaianOutput || 0}%
                </span>
              </div>
            </div>

            {/* 8 Indikator IKPA Radar Breakdown */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-indigo-500" />
                Matriks Nilai 8 Indikator IKPA Satker vs Target Standar (95.00):
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {Object.entries({
                  'Revisi DIPA (10%)': selectedSatkerDiagnostic.satker.indikator?.revisiDipa ?? 100,
                  'Deviasi Hal III (10%)': selectedSatkerDiagnostic.satker.indikator?.deviasiHal3Dipa ?? 100,
                  'Penyerapan (20%)': selectedSatkerDiagnostic.satker.indikator?.penyerapanAnggaran ?? 100,
                  'Belanja Kontrak (10%)': selectedSatkerDiagnostic.satker.indikator?.belanjaKontraktual ?? 100,
                  'Penyelesaian Tagihan (10%)': selectedSatkerDiagnostic.satker.indikator?.penyelesaianTagihan ?? 100,
                  'Pengelolaan UP/TUP (10%)': selectedSatkerDiagnostic.satker.indikator?.pengelolaanUPTUP ?? 100,
                  'Dispensasi SPM (5%)': selectedSatkerDiagnostic.satker.indikator?.dispensasiSPM ?? 100,
                  'Capaian Output (25%)': selectedSatkerDiagnostic.satker.indikator?.capaianOutput ?? 100
                }).map(([name, val]) => {
                  const isLow = val < 80;
                  return (
                    <div 
                      key={name} 
                      className={`p-2.5 rounded-xl border ${
                        isLow 
                          ? 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800' 
                          : isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="text-[11px] font-bold text-slate-500 truncate">{name}</div>
                      <div className={`text-base font-black mt-0.5 ${isLow ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-200'}`}>
                        {Number(val).toFixed(1)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Root Causes & KPPN Impact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className={`p-4 rounded-2xl border space-y-2 ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-rose-50/40 border-rose-200'}`}>
                <span className="font-black text-rose-700 dark:text-rose-400 flex items-center gap-1.5 uppercase tracking-wide">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  Diagnosa Akar Masalah (Root Causes)
                </span>
                <ul className="space-y-1.5 list-disc list-inside text-slate-700 dark:text-slate-300 leading-relaxed">
                  {selectedSatkerDiagnostic.rootCauses.map((rc, idx) => (
                    <li key={idx}>{rc}</li>
                  ))}
                </ul>
              </div>

              <div className={`p-4 rounded-2xl border space-y-2 ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-indigo-50/40 border-indigo-200'}`}>
                <span className="font-black text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5 uppercase tracking-wide">
                  <Target className="w-4 h-4 text-indigo-600" />
                  Rekomendasi Aksi Pembinaan KPPN
                </span>
                <ul className="space-y-1.5 list-disc list-inside text-slate-700 dark:text-slate-300 leading-relaxed">
                  {selectedSatkerDiagnostic.recommendedActions.map((ra, idx) => (
                    <li key={idx}>{ra}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Forward Looking: Kaitan Pengelolaan UP & Sertifikasi Pejabat */}
            <div className={`p-4 rounded-2xl border space-y-2 text-xs ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <span className="font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-sky-500" />
                Keterkaitan Pengelolaan UP/TUP &amp; Sertifikasi Pejabat Perbendaharaan:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="font-bold text-slate-500 block text-[11px]">Status Pengelolaan UP/TUP:</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200 mt-0.5 block">
                    {selectedSatkerDiagnostic.upStatus?.label || '✅ UP Terkendali / Tertib'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="font-bold text-slate-500 block text-[11px]">Status Sertifikasi Pejabat:</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200 mt-0.5 block">
                    {selectedSatkerDiagnostic.sertifikasiStatus?.label || '✅ Pejabat Memenuhi Syarat'}
                  </span>
                  {selectedSatkerDiagnostic.sertifikasiStatus?.details && (
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      {selectedSatkerDiagnostic.sertifikasiStatus.details}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Internal Monev Notes for Admin MSKI */}
            <div className="space-y-2 text-xs">
              <label className="font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-500" />
                Catatan Hasil Monev &amp; Tindak Lanjut Tim MSKI (Tersimpan Lokal):
              </label>
              <textarea
                value={adminNotes[selectedSatkerDiagnostic.satker.kodeSatker] || ''}
                onChange={(e) => handleSaveNote(selectedSatkerDiagnostic.satker.kodeSatker, e.target.value)}
                placeholder="Tuliskan catatan hasil koordinasi, janji tindak lanjut satker, atau disposisi pembinaan di sini..."
                rows={3}
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
              />
              <span className="text-[10px] text-slate-400">
                Catatan otomatis tersimpan untuk rekam jejak pembinaan internal KPPN.
              </span>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-4">
              <button
                type="button"
                onClick={() => setSelectedSatkerDiagnostic(null)}
                className="px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs transition-all hover:opacity-90 shadow-md cursor-pointer"
              >
                Tutup Lembar Diagnosa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
