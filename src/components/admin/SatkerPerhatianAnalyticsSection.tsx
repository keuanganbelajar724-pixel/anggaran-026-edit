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
  BarChart3,
  ShoppingCart,
  Receipt,
  UserX,
  Zap,
  TrendingUp,
  Bot,
  BrainCircuit
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { ExecutiveReportModal } from './ExecutiveReportModal';
import { 
  SatkerIKPA, 
  AppTheme, 
  PejabatSertifikasi, 
  PengelolaanUPRecord, 
  TransaksiKKPRecord,
  DigipayRecord,
  MasterSatker,
  DashboardConfig
} from '../../types';

export type RiskClusterKey = 
  | 'ALL' 
  | 'OUTPUT_KRITIS' 
  | 'DEVIASI_RPD' 
  | 'PENYERAPAN_LAMBAT' 
  | 'DISIPLIN_TAGIHAN' 
  | 'PENGELOLAAN_UP_TUP'
  | 'TRANSAKSI_KKP'
  | 'TRANSAKSI_DIGIPAY'
  | 'SERTIFIKASI_PEJABAT'
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
  
  // Modul Capaian Output
  outputStatus: {
    status: string;
    score: number;
    hasWarning: boolean;
    label: string;
  };

  // Modul Pengelolaan UP/TUP
  upStatus?: {
    hasWarning: boolean;
    isCritical: boolean;
    label: string;
    sisaHari?: number;
    persenRevolving?: number;
    nilaiSisaUP?: number;
    record?: PengelolaanUPRecord;
  };

  // Modul Transaksi KKP
  kkpStatus?: {
    hasWarning: boolean;
    label: string;
    jumlahTransaksi: number;
    totalNominal: number;
    record?: TransaksiKKPRecord;
  };

  // Modul Transaksi Digipay Satu
  digipayStatus?: {
    hasWarning: boolean;
    label: string;
    jumlahTransaksi: number;
    totalNominal: number;
    records?: DigipayRecord[];
  };

  // Modul Sertifikasi Pejabat
  sertifikasiStatus?: {
    hasWarning: boolean;
    label: string;
    details: string;
    totalPejabat: number;
    uncertifiedPejabats: PejabatSertifikasi[];
  };
}

interface SatkerPerhatianAnalyticsSectionProps {
  satkers: SatkerIKPA[];
  masterSatkers?: MasterSatker[];
  pejabatList?: PejabatSertifikasi[];
  pengelolaanUpRecords?: PengelolaanUPRecord[];
  transaksiKkpRecords?: TransaksiKKPRecord[];
  transaksiDigipayRecords?: DigipayRecord[];
  dashboardConfig?: DashboardConfig;
  isDark?: boolean;
  theme?: AppTheme;
  onOpenEditSatker?: (satker: SatkerIKPA) => void;
  onConsultSatkerWithAI?: (satker: SatkerIKPA) => void;
  onOpenAiTab?: () => void;
}

export const SatkerPerhatianAnalyticsSection: React.FC<SatkerPerhatianAnalyticsSectionProps> = ({
  satkers,
  masterSatkers = [],
  pejabatList = [],
  pengelolaanUpRecords = [],
  transaksiKkpRecords = [],
  transaksiDigipayRecords = [],
  dashboardConfig,
  isDark = false,
  onOpenEditSatker,
  onConsultSatkerWithAI,
  onOpenAiTab
}) => {
  const [isExecutiveReportOpen, setIsExecutiveReportOpen] = useState<boolean>(false);
  const [selectedCluster, setSelectedCluster] = useState<RiskClusterKey>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterUrgency, setFilterUrgency] = useState<'ALL' | 'KRITIS' | 'TINGGI' | 'SEDANG'>('ALL');
  const [selectedSatkerDiagnostic, setSelectedSatkerDiagnostic] = useState<SatkerDiagnosticProfile | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<'ikpa' | 'output' | 'up' | 'kkp' | 'digipay' | 'sertifikasi'>('ikpa');
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

  // Build Comprehensive Diagnostic Profiles for each Satker
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

      const cleanKode = satker.kodeSatker?.trim() || '';
      const clusters: RiskClusterKey[] = [];
      const rootCauses: string[] = [];
      const recommendedActions: string[] = [];
      let urgencyScore = 0;

      // 1. Modul Capaian Output SAKTI (Bobot 25%)
      const outputScore = ind.capaianOutput ?? 100;
      const isOutputIssue = 
        satker.statusCapaianOutput !== 'Sudah Terlaporkan' || 
        outputScore === 0 || 
        outputScore < 70;
      
      const outputStatus = {
        status: satker.statusCapaianOutput || 'Belum Terlaporkan',
        score: outputScore,
        hasWarning: isOutputIssue,
        label: satker.statusCapaianOutput !== 'Sudah Terlaporkan'
          ? '⚠️ Belum Terkonfirmasi SAKTI'
          : outputScore < 70
          ? `⚠️ RVO Rendah (${outputScore.toFixed(1)}%)`
          : `✅ Terkonfirmasi (${outputScore.toFixed(1)}%)`
      };

      if (isOutputIssue) {
        clusters.push('OUTPUT_KRITIS');
        urgencyScore += 4;
        if (satker.statusCapaianOutput !== 'Sudah Terlaporkan' || outputScore === 0) {
          rootCauses.push('Capaian Output SAKTI belum dikonfirmasi/terlaporkan atau terdeteksi 0% pada sistem.');
          recommendedActions.push('Asistensi percepatan konfirmasi data capaian output pada modul Pelaporan SAKTI sebelum batas cut-off.');
        } else {
          rootCauses.push(`Realisasi progress capaian output rendah (${outputScore.toFixed(1)}%), terjadi gap terhadap target fisik.`);
          recommendedActions.push('Evaluasi gap pencapaian target fisik output strategis dan rekonsiliasi data referensi output.');
        }
      }

      // 2. Modul Deviasi Hal III DIPA (Bobot 10%)
      const isDeviasiIssue = (ind.deviasiHal3Dipa ?? 100) < 80;
      if (isDeviasiIssue) {
        clusters.push('DEVIASI_RPD');
        urgencyScore += 3;
        rootCauses.push(`Deviasi Rencana Penarikan Dana (RPD) Hal III DIPA tinggi (skor: ${(ind.deviasiHal3Dipa ?? 0).toFixed(1)}), realisasi meleset dari jadwal.`);
        recommendedActions.push('Optimalkan pemutakhiran matriks RPD pada 10 hari kerja pertama awal triwulan dan susun kalender belanja per jenis.');
      }

      // 3. Modul Penyerapan Anggaran (Bobot 20%)
      const isPenyerapanIssue = (satker.persenPenyerapan ?? 100) < 75 || (ind.penyerapanAnggaran ?? 100) < 75;
      if (isPenyerapanIssue) {
        clusters.push('PENYERAPAN_LAMBAT');
        urgencyScore += 2;
        rootCauses.push(`Realisasi penyerapan anggaran lambat (${(satker.persenPenyerapan || 0).toFixed(1)}%), tertinggal dari target triwulan.`);
        recommendedActions.push('Akselerasi penerbitan SPM kontraktual/operasional dan identifikasi kendala blokir/termin belanja modal.');
      }

      // 4. Modul Disiplin Tagihan, Kontrak, LPJ & Dispensasi (Bobot Gabungan)
      const isDisiplinIssue = 
        (ind.penyelesaianTagihan ?? 100) < 85 || 
        (ind.dataKontrak ?? 100) < 85 || 
        (ind.penyampaianLPJBendahara ?? 100) < 85 ||
        (ind.dispensasiSPM ?? 100) < 90;
      
      if (isDisiplinIssue) {
        clusters.push('DISIPLIN_TAGIHAN');
        urgencyScore += 2;
        const subCauses: string[] = [];
        if ((ind.penyelesaianTagihan ?? 100) < 85) subCauses.push('Keterlambatan penyampaian SPM > 17 hari kerja dari BAST');
        if ((ind.dataKontrak ?? 100) < 85) subCauses.push('Pendaftaran kontrak ke KPPN > 3 hari kerja');
        if ((ind.penyampaianLPJBendahara ?? 100) < 85) subCauses.push('Penyampaian LPJ Bendahara terlambat atau ditolak');
        if ((ind.dispensasiSPM ?? 100) < 90) subCauses.push('Adanya permohonan dispensasi SPM');
        
        rootCauses.push(`Kendala kepatuhan administrasi perbendaharaan: ${subCauses.join(', ')}.`);
        recommendedActions.push('Sosialisasi & pembinaan disiplin timeline pendaftaran kontrak, BAST SPM, dan tertib LPJ Bendahara.');
      }

      // 5. Modul Pengelolaan UP & TUP (Batas Waktu Revolving 30 Hari)
      const upRec = pengelolaanUpRecords.find(r => r.kodeSatker?.trim() === cleanKode);
      let upStatus: SatkerDiagnosticProfile['upStatus'] = undefined;
      if (upRec) {
        const sisaHari = upRec.sisaHariRevolving !== undefined ? upRec.sisaHariRevolving : 30;
        const persenRevolving = upRec.persentaseRevolving !== undefined ? upRec.persentaseRevolving : 100;
        const isCriticalUP = sisaHari <= 3 || persenRevolving < 30 || (upRec.statusPeringatan && upRec.statusPeringatan.toLowerCase().includes('kritis'));
        const isWarningUP = sisaHari <= 7 || persenRevolving < 50 || (ind.pengelolaanUPTUP ?? 100) < 85;

        upStatus = {
          hasWarning: isWarningUP || isCriticalUP,
          isCritical: isCriticalUP,
          label: isCriticalUP
            ? `🔴 Kritis (Sisa ${sisaHari} Hari / Revolving ${persenRevolving}%)`
            : isWarningUP
            ? `⚠️ Perhatian (Sisa ${sisaHari} Hari / Revolving ${persenRevolving}%)`
            : `✅ UP Terkendali (${persenRevolving}%)`,
          sisaHari,
          persenRevolving,
          nilaiSisaUP: upRec.sisaUP,
          record: upRec
        };

        if (isWarningUP || isCriticalUP) {
          clusters.push('PENGELOLAAN_UP_TUP');
          urgencyScore += isCriticalUP ? 3 : 2;
          rootCauses.push(`Pengelolaan UP/TUP mendekati atau melampaui batas waktu 30 hari (Sisa ${sisaHari} hari, Revolving ${persenRevolving}%).`);
          recommendedActions.push('Segera ajukan SPM GUP (Penggantian UP) ke KPPN Semarang I sebelum jatuh tempo 30 hari kalender.');
        }
      } else if ((ind.pengelolaanUPTUP ?? 100) < 85) {
        clusters.push('PENGELOLAAN_UP_TUP');
        urgencyScore += 2;
        rootCauses.push(`Indikator Pengelolaan UP/TUP IKPA rendah (${(ind.pengelolaanUPTUP ?? 0).toFixed(1)}).`);
        recommendedActions.push('Tertibkan revolving UP bulanan dan monitor kuitansi belanja sebelum batas waktu.');
      }

      // 6. Modul Transaksi KKP (Kartu Kredit Pemerintah)
      const kkpRec = transaksiKkpRecords.find(r => r.kodeSatker?.trim() === cleanKode);
      let kkpStatus: SatkerDiagnosticProfile['kkpStatus'] = undefined;
      if (kkpRec) {
        const jmlTrx = kkpRec.jumlahTransaksi || 0;
        const totNom = kkpRec.totalNominal || 0;
        const isKkpWarning = jmlTrx === 0 || kkpRec.statusKeaktifan === 'Perlu Akselerasi';

        kkpStatus = {
          hasWarning: isKkpWarning,
          label: isKkpWarning 
            ? `⚠️ Belanja KKP Rendah (${jmlTrx} Transaksi / Rp ${totNom.toLocaleString('id-ID')})`
            : `✅ KKP Aktif (${jmlTrx} Trx / Rp ${totNom.toLocaleString('id-ID')})`,
          jumlahTransaksi: jmlTrx,
          totalNominal: totNom,
          record: kkpRec
        };

        if (isKkpWarning) {
          clusters.push('TRANSAKSI_KKP');
          urgencyScore += 1;
          rootCauses.push(`Pemanfaatan Kartu Kredit Pemerintah (KKP) masih minim/nihil (${jmlTrx} transaksi).`);
          recommendedActions.push('Akselerasi penggunaan KKP untuk belanja operasional/perjalanan dinas dan pastikan penerbitan SPM GUP KKP.');
        }
      }

      // 7. Modul Transaksi Digipay Satu
      const satkerDigipayRecs = transaksiDigipayRecords.filter(r => r.kodeSatker?.trim() === cleanKode);
      let digipayStatus: SatkerDiagnosticProfile['digipayStatus'] = undefined;
      if (satkerDigipayRecs.length > 0 || transaksiDigipayRecords.length > 0) {
        const totalTrx = satkerDigipayRecs.length;
        const totalNominal = satkerDigipayRecs.reduce((acc, r) => acc + (r.nominalTransaksi || 0), 0);
        const isDigipayWarning = totalTrx === 0;

        digipayStatus = {
          hasWarning: isDigipayWarning,
          label: isDigipayWarning
            ? '⚠️ Belum Ada Transaksi Digipay'
            : `✅ Digipay Aktif (${totalTrx} Trx / Rp ${totalNominal.toLocaleString('id-ID')})`,
          jumlahTransaksi: totalTrx,
          totalNominal,
          records: satkerDigipayRecs
        };

        if (isDigipayWarning && transaksiDigipayRecords.length > 0) {
          clusters.push('TRANSAKSI_DIGIPAY');
          urgencyScore += 1;
          rootCauses.push('Belum terdapat transaksi belanja pengadaan barang/jasa melalui ekosistem Digipay Satu.');
          recommendedActions.push('Sosialisasikan pemanfaatan platform Digipay Satu dan ajak rekanan UMKM satker bergabung.');
        }
      }

      // 8. Modul Sertifikasi Pejabat Perbendaharaan (PPK, PPSPM, Bendahara)
      const pejabatsForSatker = pejabatList.filter(p => p.kodeSatker?.trim() === cleanKode);
      let sertifikasiStatus: SatkerDiagnosticProfile['sertifikasiStatus'] = undefined;
      if (pejabatsForSatker.length > 0) {
        const uncertified = pejabatsForSatker.filter(p => {
          const st = (p.statusSertifikasi || '').toLowerCase();
          return !st || st.includes('belum') || st.includes('tidak') || st.includes('proses');
        });
        const hasWarning = uncertified.length > 0;
        
        sertifikasiStatus = {
          hasWarning,
          label: hasWarning 
            ? `⚠️ ${uncertified.length} Pejabat Belum Bersertifikat` 
            : `✅ Seluruh Pejabat (${pejabatsForSatker.length}) Bersertifikat`,
          details: uncertified.map(u => `${u.jabatan || 'Pejabat'}: ${u.namaPejabat || 'Anonim'}`).join('; '),
          totalPejabat: pejabatsForSatker.length,
          uncertifiedPejabats: uncertified
        };

        if (hasWarning) {
          clusters.push('SERTIFIKASI_PEJABAT');
          urgencyScore += 2;
          rootCauses.push(`Terdapat ${uncertified.length} Pejabat Perbendaharaan (PPK/PPSPM/Bendahara) yang belum mengantongi Sertifikat PNT/SNT.`);
          recommendedActions.push('Daftarkan pejabat yang belum bersertifikat ke program diklat & sertifikasi Pusdiklat Anggaran/Kemenkeu Corpu.');
        }
      }

      // 9. Modul Komplikasi Multi-Indikator (Total IKPA < 87.5 atau Banyak Klaster)
      if (satker.nilaiTotalIKPA < 87.5 || clusters.length >= 3) {
        clusters.push('KOMPLIKASI_MULTI');
        urgencyScore += 3;
        rootCauses.push(`Nilai Total IKPA berada di zona risiko (${satker.nilaiTotalIKPA.toFixed(2)} - ${satker.predikat}) dengan multi-indikator bermasalah.`);
        recommendedActions.push('Fasilitasi sesi pembinaan one-on-one mendalam antara Seksi MSKI KPPN Semarang I dengan KPA & PPK Satker.');
      }

      // Tentukan Primary Cluster & Urgency Level
      let primaryCluster: RiskClusterKey = 'ALL';
      if (clusters.includes('OUTPUT_KRITIS')) primaryCluster = 'OUTPUT_KRITIS';
      else if (clusters.includes('PENGELOLAAN_UP_TUP')) primaryCluster = 'PENGELOLAAN_UP_TUP';
      else if (clusters.includes('KOMPLIKASI_MULTI')) primaryCluster = 'KOMPLIKASI_MULTI';
      else if (clusters.includes('DEVIASI_RPD')) primaryCluster = 'DEVIASI_RPD';
      else if (clusters.includes('PENYERAPAN_LAMBAT')) primaryCluster = 'PENYERAPAN_LAMBAT';
      else if (clusters.includes('SERTIFIKASI_PEJABAT')) primaryCluster = 'SERTIFIKASI_PEJABAT';
      else if (clusters.includes('DISIPLIN_TAGIHAN')) primaryCluster = 'DISIPLIN_TAGIHAN';
      else if (clusters.includes('TRANSAKSI_KKP')) primaryCluster = 'TRANSAKSI_KKP';
      else if (clusters.includes('TRANSAKSI_DIGIPAY')) primaryCluster = 'TRANSAKSI_DIGIPAY';

      let urgencyLevel: 'KRITIS' | 'TINGGI' | 'SEDANG' = 'SEDANG';
      if (
        urgencyScore >= 5 || 
        satker.nilaiTotalIKPA < 75 || 
        satker.statusCapaianOutput !== 'Sudah Terlaporkan' ||
        (upStatus && upStatus.isCritical)
      ) {
        urgencyLevel = 'KRITIS';
      } else if (urgencyScore >= 3 || satker.nilaiTotalIKPA < 87.5) {
        urgencyLevel = 'TINGGI';
      }

      const clusterLabels: string[] = [];
      if (clusters.includes('OUTPUT_KRITIS')) clusterLabels.push('Capaian Output Kritis');
      if (clusters.includes('DEVIASI_RPD')) clusterLabels.push('Deviasi Hal III DIPA');
      if (clusters.includes('PENYERAPAN_LAMBAT')) clusterLabels.push('Penyerapan Rendah');
      if (clusters.includes('DISIPLIN_TAGIHAN')) clusterLabels.push('Disiplin Tagihan/Kontrak/LPJ');
      if (clusters.includes('PENGELOLAAN_UP_TUP')) clusterLabels.push('Batas Waktu UP & TUP');
      if (clusters.includes('TRANSAKSI_KKP')) clusterLabels.push('Akselerasi KKP');
      if (clusters.includes('TRANSAKSI_DIGIPAY')) clusterLabels.push('Akselerasi Digipay');
      if (clusters.includes('SERTIFIKASI_PEJABAT')) clusterLabels.push('Sertifikasi Pejabat');
      if (clusters.includes('KOMPLIKASI_MULTI')) clusterLabels.push('Multi-Risiko Kinerja');

      const kppnImpact = clusters.includes('OUTPUT_KRITIS')
        ? 'Berdampak langsung menurunkan agregat nilai IKPA KPPN (bobot output 25%) dan memicu anomali pelaporan SAKTI.'
        : clusters.includes('PENGELOLAAN_UP_TUP')
        ? 'Menyebabkan pengendapan kas negara pada rekening bendahara satker melampaui batas regulasi 30 hari.'
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
        outputStatus,
        upStatus,
        kkpStatus,
        digipayStatus,
        sertifikasiStatus
      };
    }).filter(p => p.clusters.length > 0);
  }, [satkers, pejabatList, pengelolaanUpRecords, transaksiKkpRecords, transaksiDigipayRecords]);

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
          (s.kementerianLembaga || '').toLowerCase().includes(q) ||
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
    const pengelolaanUpTup = diagnosticProfiles.filter(p => p.clusters.includes('PENGELOLAAN_UP_TUP')).length;
    const transaksiKkp = diagnosticProfiles.filter(p => p.clusters.includes('TRANSAKSI_KKP')).length;
    const transaksiDigipay = diagnosticProfiles.filter(p => p.clusters.includes('TRANSAKSI_DIGIPAY')).length;
    const sertifikasiPejabat = diagnosticProfiles.filter(p => p.clusters.includes('SERTIFIKASI_PEJABAT')).length;
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
      pengelolaanUpTup,
      transaksiKkp,
      transaksiDigipay,
      sertifikasiPejabat,
      komplikasiMulti,
      kritisCount,
      tinggiCount,
      sedangCount,
      avgIkpa
    };
  }, [diagnosticProfiles]);

  // Export Executive Deep Diagnostic Excel Report with all indicators
  const handleExportExecutiveReport = () => {
    const dataToExport = filteredProfiles.map((p, idx) => ({
      'No': idx + 1,
      'Kode Satker': p.satker.kodeSatker,
      'Nama Satuan Kerja': p.satker.namaSatker,
      'Kementerian / Lembaga': p.satker.kementerianLembaga,
      'Nilai Total IKPA': p.satker.nilaiTotalIKPA,
      'Predikat IKPA': p.satker.predikat,
      'Tingkat Urgensi': p.urgencyLevel,
      'Kluster Masalah': p.clusterLabels.join(', '),
      'Status Capaian Output SAKTI': `${p.outputStatus.status} (${p.outputStatus.score}%)`,
      'Deviasi Hal III DIPA (%)': `${p.satker.indikator?.deviasiHal3Dipa || 0}%`,
      'Penyerapan Anggaran (%)': `${p.satker.persenPenyerapan || 0}%`,
      'Penyelesaian Tagihan SPM': `${p.satker.indikator?.penyelesaianTagihan || 0}`,
      'Pengelolaan UP/TUP IKPA': `${p.satker.indikator?.pengelolaanUPTUP || 0}`,
      'Status Batas Waktu UP/TUP': p.upStatus?.label || 'Belum Terpetakan',
      'Status Transaksi KKP': p.kkpStatus?.label || 'Belum Terpetakan',
      'Status Transaksi Digipay': p.digipayStatus?.label || 'Belum Terpetakan',
      'Status Sertifikasi Pejabat': p.sertifikasiStatus?.label || 'Belum Terpetakan',
      'Diagnosa Akar Masalah': p.rootCauses.join(' | '),
      'Dampak Terhadap KPPN': p.kppnImpact,
      'Rekomendasi Pembinaan MSKI': p.recommendedActions.join(' | '),
      'Catatan Evaluasi Admin MSKI': adminNotes[p.satker.kodeSatker] || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Analisis_Komprehensif_Satker');
    XLSX.writeFile(wb, `Analisis_Diagnosa_Komprehensif_Satker_KPPN026_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Main Container */}
      <div className={`${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'} rounded-3xl border shadow-xl p-6 sm:p-8 space-y-6`}>
        
        {/* Executive Header Banner */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div className="space-y-1.5 max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-indigo-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 px-3 py-1 rounded-full text-xs font-black">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
              <span>WORKSPACE EKSEKUTIF ANALISIS DIAGNOSA MULTI-INDIKATOR SATKER</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Evaluasi Mendalam &amp; Klasterisasi Satuan Kerja Dalam Perhatian
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
              Mendiagnosa akar masalah secara terpadu berbasis seluruh modul instrumen: <strong>IKPA (PER-5)</strong>, <strong>Capaian Output SAKTI</strong>, <strong>Batas Waktu UP &amp; TUP</strong>, <strong>Transaksi KKP</strong>, <strong>Transaksi Digipay Satu</strong>, dan <strong>Sertifikasi Pejabat Perbendaharaan</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsExecutiveReportOpen(true)}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-950/20 flex items-center gap-2 cursor-pointer active:scale-95 border border-indigo-400/30"
              title="Buka Lembar Laporan Eksekutif PDF / Cetak Siap Disposisi Pimpinan"
            >
              <FileText className="w-4 h-4 text-amber-300" />
              <span>Cetak Laporan Eksekutif (PDF) 📄</span>
            </button>

            {onOpenAiTab && (
              <button
                type="button"
                onClick={onOpenAiTab}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-purple-950/20 flex items-center gap-2 cursor-pointer active:scale-95 border border-purple-400/30"
                title="Buka Asisten Analis Gemini AI untuk bedah satker interaktif"
              >
                <Bot className="w-4 h-4 text-purple-200 animate-pulse" />
                <span>Analisis via Gemini AI ✨</span>
              </button>
            )}

            <button
              onClick={handleExportExecutiveReport}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-950/20 flex items-center gap-2 cursor-pointer active:scale-95"
              title="Unduh Rekap Diagnosa Komprehensif Seluruh Indikator (Format Excel)"
            >
              <Download className="w-4 h-4" />
              <span>Unduh Rekap Multi-Indikator (Excel)</span>
            </button>
          </div>
        </div>

        {/* Top Executive KPI Cards - 6 Multi-Indicator Snapshots */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          {/* Total Satker Perhatian */}
          <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-rose-50/60 border-rose-200/70'} space-y-1`}>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 font-bold text-[11px]">Total Perhatian</span>
              <span className="p-1 rounded-lg bg-rose-500/10 text-rose-600 font-black text-[9px]">ALL</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400">
              {clusterCounts.all} <span className="text-xs font-normal text-slate-400">Satker</span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Rata-rata IKPA: <span className="font-extrabold text-rose-600">{clusterCounts.avgIkpa}</span>
            </p>
          </div>

          {/* Urgensi Kritis */}
          <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-amber-50/60 border-amber-200/70'} space-y-1`}>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 font-bold text-[11px]">Urgensi Kritis</span>
              <span className="p-1 rounded-lg bg-rose-600 text-white font-black text-[9px]">KRITIS</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">
              {clusterCounts.kritisCount} <span className="text-xs font-normal text-slate-400">Satker</span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
              IKPA &lt; 75 / Output 0% / UP Kritis
            </p>
          </div>

          {/* Output SAKTI Kritis */}
          <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-red-50/60 border-red-200/70'} space-y-1`}>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 font-bold text-[11px]">Output SAKTI</span>
              <span className="p-1 rounded-lg bg-red-500/10 text-red-600 font-black text-[9px]">25% IKPA</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-red-600 dark:text-red-400">
              {clusterCounts.outputKritis} <span className="text-xs font-normal text-slate-400">Satker</span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
              0% / Belum Terlaporkan
            </p>
          </div>

          {/* Batas Waktu UP/TUP */}
          <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-purple-50/60 border-purple-200/70'} space-y-1`}>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 font-bold text-[11px]">Batas Waktu UP</span>
              <span className="p-1 rounded-lg bg-purple-500/10 text-purple-600 font-black text-[9px]">30 HARI</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400">
              {clusterCounts.pengelolaanUpTup} <span className="text-xs font-normal text-slate-400">Satker</span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
              Jatuh tempo / Revolving lambat
            </p>
          </div>

          {/* Transaksi KKP & Digipay */}
          <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-cyan-50/60 border-cyan-200/70'} space-y-1`}>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 font-bold text-[11px]">KKP &amp; Digipay</span>
              <span className="p-1 rounded-lg bg-cyan-500/10 text-cyan-600 font-black text-[9px]">DIGITAL</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-cyan-700 dark:text-cyan-400">
              {clusterCounts.transaksiKkp + clusterCounts.transaksiDigipay} <span className="text-xs font-normal text-slate-400">Satker</span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
              KKP: {clusterCounts.transaksiKkp} • Digipay: {clusterCounts.transaksiDigipay}
            </p>
          </div>

          {/* Sertifikasi Pejabat */}
          <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-sky-50/60 border-sky-200/70'} space-y-1`}>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 font-bold text-[11px]">Sertifikasi Pejabat</span>
              <span className="p-1 rounded-lg bg-sky-500/10 text-sky-600 font-black text-[9px]">PNT/SNT</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-sky-700 dark:text-sky-300">
              {clusterCounts.sertifikasiPejabat} <span className="text-xs font-normal text-slate-400">Satker</span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
              PPK/PPSPM belum bersertifikat
            </p>
          </div>
        </div>

        {/* 9 Multi-Indicator Risk Clusters Navigation */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-rose-500" />
              Kelompok / Klaster Penyebab Masalah Kinerja Satker (Multi-Modul):
            </span>
            <span className="text-[11px] text-slate-400">
              Klik salah satu kartu klaster untuk memfilter
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
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
              <span className="text-[10px] opacity-75 mt-2 line-clamp-1 font-medium">Kompilasi Seluruh Instrumen</span>
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

            {/* Cluster 5: Pengelolaan UP & TUP */}
            <button
              type="button"
              onClick={() => setSelectedCluster('PENGELOLAAN_UP_TUP')}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                selectedCluster === 'PENGELOLAAN_UP_TUP'
                  ? 'bg-fuchsia-600 text-white border-fuchsia-600 shadow-lg ring-2 ring-fuchsia-400/50'
                  : isDark ? 'bg-slate-950/60 hover:bg-slate-800 border-slate-800 text-slate-200' : 'bg-fuchsia-50/50 hover:bg-fuchsia-100/60 border-fuchsia-200 text-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase">5. Batas Waktu UP/TUP</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  selectedCluster === 'PENGELOLAAN_UP_TUP' ? 'bg-white/20 text-white' : 'bg-fuchsia-100 dark:bg-fuchsia-950 text-fuchsia-700 dark:text-fuchsia-300'
                }`}>
                  {clusterCounts.pengelolaanUpTup}
                </span>
              </div>
              <span className="text-[10px] opacity-80 mt-2 line-clamp-1 font-medium">Jatuh Tempo 30 Hari</span>
            </button>

            {/* Cluster 6: Transaksi KKP */}
            <button
              type="button"
              onClick={() => setSelectedCluster('TRANSAKSI_KKP')}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                selectedCluster === 'TRANSAKSI_KKP'
                  ? 'bg-amber-700 text-white border-amber-700 shadow-lg ring-2 ring-amber-500/50'
                  : isDark ? 'bg-slate-950/60 hover:bg-slate-800 border-slate-800 text-slate-200' : 'bg-amber-50/50 hover:bg-amber-100/60 border-amber-200 text-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase">6. Akselerasi KKP</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  selectedCluster === 'TRANSAKSI_KKP' ? 'bg-white/20 text-white' : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                }`}>
                  {clusterCounts.transaksiKkp}
                </span>
              </div>
              <span className="text-[10px] opacity-80 mt-2 line-clamp-1 font-medium">Belanja KKP Rendah</span>
            </button>

            {/* Cluster 7: Transaksi Digipay */}
            <button
              type="button"
              onClick={() => setSelectedCluster('TRANSAKSI_DIGIPAY')}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                selectedCluster === 'TRANSAKSI_DIGIPAY'
                  ? 'bg-teal-600 text-white border-teal-600 shadow-lg ring-2 ring-teal-400/50'
                  : isDark ? 'bg-slate-950/60 hover:bg-slate-800 border-slate-800 text-slate-200' : 'bg-teal-50/50 hover:bg-teal-100/60 border-teal-200 text-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase">7. Transaksi Digipay</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  selectedCluster === 'TRANSAKSI_DIGIPAY' ? 'bg-white/20 text-white' : 'bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300'
                }`}>
                  {clusterCounts.transaksiDigipay}
                </span>
              </div>
              <span className="text-[10px] opacity-80 mt-2 line-clamp-1 font-medium">Belanja UMKM Digipay Satu</span>
            </button>

            {/* Cluster 8: Sertifikasi Pejabat */}
            <button
              type="button"
              onClick={() => setSelectedCluster('SERTIFIKASI_PEJABAT')}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                selectedCluster === 'SERTIFIKASI_PEJABAT'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-lg ring-2 ring-blue-400/50'
                  : isDark ? 'bg-slate-950/60 hover:bg-slate-800 border-slate-800 text-slate-200' : 'bg-blue-50/50 hover:bg-blue-100/60 border-blue-200 text-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase">8. Sertifikasi Pejabat</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  selectedCluster === 'SERTIFIKASI_PEJABAT' ? 'bg-white/20 text-white' : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                }`}>
                  {clusterCounts.sertifikasiPejabat}
                </span>
              </div>
              <span className="text-[10px] opacity-80 mt-2 line-clamp-1 font-medium">PPK/PPSPM Belum PNT/SNT</span>
            </button>

            {/* Cluster 9: Komplikasi Multi */}
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
                <span className="text-[11px] font-black uppercase">9. Multi-Risiko</span>
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
              className="w-full sm:w-auto px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs cursor-pointer"
            >
              <option value="ALL">Semua Urgensi ({diagnosticProfiles.length})</option>
              <option value="KRITIS">🔴 Prioritas Kritis</option>
              <option value="TINGGI">⚠️ Prioritas Tinggi</option>
              <option value="SEDANG">🟡 Prioritas Sedang</option>
            </select>
          </div>
        </div>

        {/* Multi-Indicator Analytical Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 font-extrabold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-3.5">Satker &amp; K/L</th>
                <th className="py-3 px-3 text-center">IKPA</th>
                <th className="py-3 px-3">Output SAKTI</th>
                <th className="py-3 px-3">Batas Waktu UP</th>
                <th className="py-3 px-3">KKP &amp; Digipay</th>
                <th className="py-3 px-3">Sertifikasi</th>
                <th className="py-3 px-3">Diagnosa Akar Masalah</th>
                <th className="py-3 px-3 text-center">Aksi Telaah</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredProfiles.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                      <span className="font-bold text-sm">Tidak ditemukan Satker pada kriteria filter ini</span>
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
                      <td className="py-3.5 px-3.5 max-w-[220px]">
                        <div className="font-black text-slate-900 dark:text-slate-100 text-xs truncate" title={s.namaSatker}>
                          {s.namaSatker}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-500 font-mono">
                          <span>Kode: {s.kodeSatker}</span>
                          <span>•</span>
                          <span className="font-sans truncate max-w-[120px]">{s.kementerianLembaga}</span>
                        </div>
                        <div className="mt-1 flex items-center gap-1">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                            isKritis ? 'bg-rose-600 text-white' : isTinggi ? 'bg-amber-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                          }`}>
                            {p.urgencyLevel}
                          </span>
                        </div>
                      </td>

                      {/* IKPA Score Column */}
                      <td className="py-3.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-lg font-black text-xs inline-block ${
                          s.nilaiTotalIKPA < 80 
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300' 
                            : s.nilaiTotalIKPA < 87.5 
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}>
                          {s.nilaiTotalIKPA.toFixed(2)}
                        </span>
                        <div className="text-[9px] text-slate-400 uppercase mt-0.5 font-extrabold">{s.predikat}</div>
                      </td>

                      {/* Output SAKTI Column */}
                      <td className="py-3.5 px-3">
                        <div className={`text-[11px] font-bold ${p.outputStatus.hasWarning ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {p.outputStatus.label}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Skor: {p.outputStatus.score.toFixed(1)}%
                        </div>
                      </td>

                      {/* Batas Waktu UP Column */}
                      <td className="py-3.5 px-3">
                        {p.upStatus ? (
                          <div>
                            <div className={`text-[11px] font-bold ${p.upStatus.hasWarning ? 'text-purple-600 dark:text-purple-400' : 'text-slate-600 dark:text-slate-300'}`}>
                              {p.upStatus.label}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {p.upStatus.sisaHari !== undefined ? `Sisa: ${p.upStatus.sisaHari} Hari` : 'Monitoring Revolving'}
                            </div>
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400 italic">UP: Sesuai Siklus</div>
                        )}
                      </td>

                      {/* KKP & Digipay Column */}
                      <td className="py-3.5 px-3 space-y-0.5">
                        {p.kkpStatus ? (
                          <div className="text-[10px] font-semibold truncate max-w-[140px]" title={p.kkpStatus.label}>
                            💳 {p.kkpStatus.label}
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400">💳 KKP: Belum Terdata</div>
                        )}
                        {p.digipayStatus ? (
                          <div className="text-[10px] font-semibold truncate max-w-[140px]" title={p.digipayStatus.label}>
                            🛒 {p.digipayStatus.label}
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400">🛒 Digipay: Nihil</div>
                        )}
                      </td>

                      {/* Sertifikasi Column */}
                      <td className="py-3.5 px-3">
                        {p.sertifikasiStatus ? (
                          <div className={`text-[10px] font-bold ${p.sertifikasiStatus.hasWarning ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-300'}`}>
                            {p.sertifikasiStatus.label}
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400 italic">Pejabat: Bersertifikat</div>
                        )}
                      </td>

                      {/* Root Causes Column */}
                      <td className="py-3.5 px-3 max-w-xs">
                        <ul className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300 list-disc list-inside">
                          {p.rootCauses.slice(0, 2).map((rc, i) => (
                            <li key={i} className="line-clamp-2 leading-tight">
                              {rc}
                            </li>
                          ))}
                        </ul>
                      </td>

                      {/* Action Column */}
                      <td className="py-3.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSatkerDiagnostic(p);
                              setActiveModalTab('ikpa');
                            }}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer active:scale-95"
                            title="Buka Lembar Diagnosa Eksekutif Multi-Indikator"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Diagnosa</span>
                          </button>

                          {onConsultSatkerWithAI && (
                            <button
                              type="button"
                              onClick={() => onConsultSatkerWithAI(s)}
                              className="p-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 dark:bg-purple-950 dark:hover:bg-purple-900 text-purple-700 dark:text-purple-300 transition-colors cursor-pointer border border-purple-300 dark:border-purple-800"
                              title="Tanyakan Analisis Satker ini ke Google Gemini AI"
                            >
                              <Bot className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                            </button>
                          )}

                          {onOpenEditSatker && (
                            <button
                              type="button"
                              onClick={() => onOpenEditSatker(s)}
                              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer border border-slate-300 dark:border-slate-700"
                              title="Edit Data Satker"
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

      {/* MODAL LEMBAR DIAGNOSA EKSEKUTIF SATKER (MULTI-MODUL LENGKAP) */}
      {selectedSatkerDiagnostic && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
          <div 
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md" 
            onClick={() => setSelectedSatkerDiagnostic(null)} 
          />

          <div className={`relative w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-3xl border shadow-2xl z-10 p-6 sm:p-8 space-y-6 ${
            isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-500/10 text-rose-600 border border-rose-500/30">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>LEMBAR TELAAH &amp; DIAGNOSA MULTI-INDIKATOR EKSEKUTIF KPPN SEMARANG I</span>
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
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-slate-500 font-bold block">Nilai Total IKPA</span>
                <span className="text-2xl font-black text-rose-600 mt-1 block">
                  {selectedSatkerDiagnostic.satker.nilaiTotalIKPA.toFixed(2)}
                </span>
                <span className="text-[10px] text-slate-400 font-extrabold uppercase">
                  Predikat: {selectedSatkerDiagnostic.satker.predikat}
                </span>
              </div>

              <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-slate-500 font-bold block">Tingkat Urgensi</span>
                <span className={`text-xl font-black mt-1 block ${
                  selectedSatkerDiagnostic.urgencyLevel === 'KRITIS' ? 'text-rose-600' : selectedSatkerDiagnostic.urgencyLevel === 'TINGGI' ? 'text-amber-600' : 'text-slate-700 dark:text-slate-300'
                }`}>
                  {selectedSatkerDiagnostic.urgencyLevel}
                </span>
                <span className="text-[10px] text-slate-400 line-clamp-1">
                  {selectedSatkerDiagnostic.clusterLabels.join(', ')}
                </span>
              </div>

              <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-slate-500 font-bold block">Status Output SAKTI</span>
                <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 mt-1 block truncate">
                  {selectedSatkerDiagnostic.outputStatus.label}
                </span>
                <span className="text-[10px] text-slate-400">
                  Skor Output: {selectedSatkerDiagnostic.outputStatus.score.toFixed(1)}%
                </span>
              </div>

              <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-slate-500 font-bold block">Status Batas Waktu UP</span>
                <span className="text-sm font-black text-purple-600 dark:text-purple-400 mt-1 block truncate">
                  {selectedSatkerDiagnostic.upStatus?.label || '✅ Terkendali'}
                </span>
                <span className="text-[10px] text-slate-400">
                  {selectedSatkerDiagnostic.upStatus?.sisaHari !== undefined ? `Sisa Waktu: ${selectedSatkerDiagnostic.upStatus.sisaHari} Hari` : 'Siklus 30 Hari'}
                </span>
              </div>
            </div>

            {/* Modal Detail Tabs (IKPA, Output, UP/TUP, KKP, Digipay, Sertifikasi) */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2">
                <button
                  type="button"
                  onClick={() => setActiveModalTab('ikpa')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeModalTab === 'ikpa'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>1. 10 Indikator IKPA</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveModalTab('output')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeModalTab === 'output'
                      ? 'bg-rose-600 text-white shadow-md'
                      : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Target className="w-3.5 h-3.5" />
                  <span>2. Capaian Output SAKTI</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveModalTab('up')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeModalTab === 'up'
                      ? 'bg-purple-600 text-white shadow-md'
                      : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>3. Pengelolaan UP/TUP</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveModalTab('kkp')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeModalTab === 'kkp'
                      ? 'bg-amber-600 text-white shadow-md'
                      : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>4. Transaksi KKP</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveModalTab('digipay')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeModalTab === 'digipay'
                      ? 'bg-teal-600 text-white shadow-md'
                      : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>5. Transaksi Digipay</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveModalTab('sertifikasi')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeModalTab === 'sertifikasi'
                      ? 'bg-blue-600 text-white shadow-md'
                      : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>6. Sertifikasi Pejabat</span>
                </button>
              </div>

              {/* Tab 1: 10 Indikator IKPA Breakdown */}
              {activeModalTab === 'ikpa' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <BarChart3 className="w-3.5 h-3.5 text-indigo-500" />
                    Matriks Nilai Indikator IKPA Satker vs Target Standar (95.00):
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
                      'Capaian Output (25%)': selectedSatkerDiagnostic.satker.indikator?.capaianOutput ?? 100,
                      'Data Kontrak (10%)': selectedSatkerDiagnostic.satker.indikator?.dataKontrak ?? 100,
                      'LPJ Bendahara': selectedSatkerDiagnostic.satker.indikator?.penyampaianLPJBendahara ?? 100
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
              )}

              {/* Tab 2: Capaian Output SAKTI Detail */}
              {activeModalTab === 'output' && (
                <div className={`p-4 rounded-2xl border space-y-3 text-xs ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-black text-rose-600 dark:text-rose-400 uppercase tracking-wide flex items-center gap-1.5">
                      <Target className="w-4 h-4" />
                      Detail Modul Capaian Output SAKTI
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                      Bobot IKPA Terbesar (25%)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500 font-bold block text-[11px]">Status Konfirmasi Pelaporan:</span>
                      <span className="font-extrabold text-slate-800 dark:text-slate-100 mt-1 block">
                        {selectedSatkerDiagnostic.satker.statusCapaianOutput}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500 font-bold block text-[11px]">Skor Capaian Output:</span>
                      <span className="font-extrabold text-indigo-600 dark:text-indigo-400 mt-1 block text-base">
                        {(selectedSatkerDiagnostic.satker.indikator?.capaianOutput || 0).toFixed(1)}%
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500 font-bold block text-[11px]">Risiko Anomali Data:</span>
                      <span className="font-extrabold text-amber-600 dark:text-amber-400 mt-1 block">
                        {selectedSatkerDiagnostic.outputStatus.hasWarning ? '⚠️ Memerlukan Konfirmasi Segera' : '✅ Nihil Anomali'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Pengelolaan UP/TUP Detail */}
              {activeModalTab === 'up' && (
                <div className={`p-4 rounded-2xl border space-y-3 text-xs ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-black text-purple-600 dark:text-purple-400 uppercase tracking-wide flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      Detail Monitoring Batas Waktu UP &amp; TUP (Maks 30 Hari)
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                      PER-5/PB/2024
                    </span>
                  </div>

                  {selectedSatkerDiagnostic.upStatus?.record ? (
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500 font-bold block text-[11px]">Sisa Hari Revolving:</span>
                        <span className="font-black text-purple-600 dark:text-purple-400 mt-1 block text-base">
                          {selectedSatkerDiagnostic.upStatus.sisaHari} Hari
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500 font-bold block text-[11px]">Persentase Revolving:</span>
                        <span className="font-black text-slate-800 dark:text-slate-100 mt-1 block text-base">
                          {selectedSatkerDiagnostic.upStatus.persenRevolving}%
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500 font-bold block text-[11px]">Sisa UP Belum GUP:</span>
                        <span className="font-black text-slate-800 dark:text-slate-100 mt-1 block text-xs truncate">
                          Rp {(selectedSatkerDiagnostic.upStatus.nilaiSisaUP || 0).toLocaleString('id-ID')}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500 font-bold block text-[11px]">Status Peringatan:</span>
                        <span className="font-extrabold text-purple-600 dark:text-purple-400 mt-1 block text-xs">
                          {selectedSatkerDiagnostic.upStatus.label}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500">
                      Data spesifik batas waktu UP satker ini belum tercatat pada daftar monitoring UP terkini.
                    </div>
                  )}
                </div>
              )}

              {/* Tab 4: Transaksi KKP Detail */}
              {activeModalTab === 'kkp' && (
                <div className={`p-4 rounded-2xl border space-y-3 text-xs ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-black text-amber-600 dark:text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4" />
                      Detail Monitoring Transaksi KKP (Kartu Kredit Pemerintah)
                    </span>
                  </div>

                  {selectedSatkerDiagnostic.kkpStatus?.record ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500 font-bold block text-[11px]">Jumlah Transaksi KKP:</span>
                        <span className="font-black text-amber-600 dark:text-amber-400 mt-1 block text-base">
                          {selectedSatkerDiagnostic.kkpStatus.jumlahTransaksi} Transaksi
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500 font-bold block text-[11px]">Total Realisasi KKP:</span>
                        <span className="font-black text-slate-800 dark:text-slate-100 mt-1 block text-sm">
                          Rp {(selectedSatkerDiagnostic.kkpStatus.totalNominal || 0).toLocaleString('id-ID')}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500 font-bold block text-[11px]">Bank Penerbit / Status:</span>
                        <span className="font-extrabold text-slate-800 dark:text-slate-200 mt-1 block text-xs">
                          {selectedSatkerDiagnostic.kkpStatus.record.bankPenerbit || 'Bank Mitra'} • {selectedSatkerDiagnostic.kkpStatus.record.statusKeaktifan || 'Aktif'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500">
                      Satker belum memiliki rekaman transaksi KKP pada periode aktif ini.
                    </div>
                  )}
                </div>
              )}

              {/* Tab 5: Transaksi Digipay Satu Detail */}
              {activeModalTab === 'digipay' && (
                <div className={`p-4 rounded-2xl border space-y-3 text-xs ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-black text-teal-600 dark:text-teal-400 uppercase tracking-wide flex items-center gap-1.5">
                      <ShoppingCart className="w-4 h-4" />
                      Detail Monitoring Belanja Digipay Satu (VA &amp; KKP)
                    </span>
                  </div>

                  {selectedSatkerDiagnostic.digipayStatus?.records && selectedSatkerDiagnostic.digipayStatus.records.length > 0 ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                          <span className="text-slate-500 font-bold block text-[11px]">Total Transaksi Digipay:</span>
                          <span className="font-black text-teal-600 dark:text-teal-400 mt-1 block text-base">
                            {selectedSatkerDiagnostic.digipayStatus.jumlahTransaksi} Pesanan
                          </span>
                        </div>

                        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                          <span className="text-slate-500 font-bold block text-[11px]">Total Belanja Rekanan UMKM:</span>
                          <span className="font-black text-slate-800 dark:text-slate-100 mt-1 block text-sm">
                            Rp {(selectedSatkerDiagnostic.digipayStatus.totalNominal || 0).toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>

                      <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800">
                        <table className="w-full text-left text-[11px]">
                          <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                            <tr>
                              <th className="p-2">No Transaksi</th>
                              <th className="p-2">Rekanan UMKM</th>
                              <th className="p-2">Tipe</th>
                              <th className="p-2 text-right">Nominal</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {selectedSatkerDiagnostic.digipayStatus.records.map((r, i) => (
                              <tr key={i}>
                                <td className="p-2 font-mono">{r.noTransaksi || '-'}</td>
                                <td className="p-2">{r.namaVendor || '-'}</td>
                                <td className="p-2 font-bold">{r.tipePembayaran}</td>
                                <td className="p-2 text-right font-mono font-bold">Rp {(r.nominalTransaksi || 0).toLocaleString('id-ID')}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500">
                      Belum terdapat rekaman transaksi belanja melalui Digipay Satu untuk Satker ini.
                    </div>
                  )}
                </div>
              )}

              {/* Tab 6: Sertifikasi Pejabat Detail */}
              {activeModalTab === 'sertifikasi' && (
                <div className={`p-4 rounded-2xl border space-y-3 text-xs ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-black text-blue-600 dark:text-blue-400 uppercase tracking-wide flex items-center gap-1.5">
                      <Award className="w-4 h-4" />
                      Detail Sertifikasi Pejabat Perbendaharaan (PPK, PPSPM, Bendahara)
                    </span>
                  </div>

                  {selectedSatkerDiagnostic.sertifikasiStatus?.uncertifiedPejabats && selectedSatkerDiagnostic.sertifikasiStatus.uncertifiedPejabats.length > 0 ? (
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 block">
                        ⚠️ Daftar Pejabat yang Belum Memiliki Sertifikat PNT / SNT:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {selectedSatkerDiagnostic.sertifikasiStatus.uncertifiedPejabats.map((p, idx) => (
                          <div key={idx} className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 space-y-1">
                            <div className="font-black text-rose-700 dark:text-rose-300">{p.jabatan || 'Pejabat'}</div>
                            <div className="font-bold text-slate-800 dark:text-slate-200 text-xs">{p.namaPejabat}</div>
                            <div className="text-[10px] text-slate-500 font-mono">NIP: {p.nip || '-'}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500">
                      Seluruh Pejabat Perbendaharaan Satker ini telah mengantongi Sertifikat PNT/SNT yang sah.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Root Causes & KPPN Actions */}
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
                  Rekomendasi Aksi Pembinaan KPPN Semarang I
                </span>
                <ul className="space-y-1.5 list-disc list-inside text-slate-700 dark:text-slate-300 leading-relaxed">
                  {selectedSatkerDiagnostic.recommendedActions.map((ra, idx) => (
                    <li key={idx}>{ra}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Internal Monev Notes for Admin MSKI */}
            <div className="space-y-2 text-xs">
              <label className="font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-500" />
                Catatan Hasil Pembinaan Tim MSKI KPPN (Tersimpan Otomatis):
              </label>
              <textarea
                value={adminNotes[selectedSatkerDiagnostic.satker.kodeSatker] || ''}
                onChange={(e) => handleSaveNote(selectedSatkerDiagnostic.satker.kodeSatker, e.target.value)}
                placeholder="Tuliskan komitmen tindak lanjut satker, jadwal konsultasi, atau disposisi pembinaan di sini..."
                rows={3}
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
              />
              <span className="text-[10px] text-slate-400">
                Catatan otomatis tersimpan pada peramban untuk histori rekam jejak pembinaan internal KPPN Semarang I.
              </span>
            </div>

            {/* Modal Footer */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800 pt-4">
              <div>
                {onConsultSatkerWithAI && (
                  <button
                    type="button"
                    onClick={() => {
                      const target = selectedSatkerDiagnostic.satker;
                      setSelectedSatkerDiagnostic(null);
                      onConsultSatkerWithAI(target);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs transition-all shadow-md shadow-purple-950/20 flex items-center gap-2 cursor-pointer border border-purple-400/30 active:scale-95"
                  >
                    <Bot className="w-4 h-4 text-purple-200 animate-pulse" />
                    <span>Konsultasikan Satker Ini ke Gemini AI ✨</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
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
        </div>
      )}
      {/* Executive PDF Report Generator Modal */}
      {isExecutiveReportOpen && (
        <ExecutiveReportModal
          isOpen={isExecutiveReportOpen}
          onClose={() => setIsExecutiveReportOpen(false)}
          satkers={satkers}
          dashboardConfig={dashboardConfig || ({} as DashboardConfig)}
          isDark={isDark}
        />
      )}
    </div>
  );
};
