import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Calculator,
  CreditCard,
  Coins,
  Calendar,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Plus,
  Trash2,
  RefreshCw,
  Copy,
  Check,
  ArrowRight,
  TrendingUp,
  Percent,
  Layers,
  FileSpreadsheet,
  Info,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Zap,
  Clock,
  Send,
  Save,
  Download,
  Upload,
  Sparkles,
  FolderOpen,
  CheckCircle,
  XCircle,
  Sliders,
  History
} from 'lucide-react';
import { SatkerIKPA } from '../../types';

export interface UpTupPer5CalculatorProps {
  satkers?: SatkerIKPA[];
  selectedSatkerId?: string;
  onSelectSatker?: (satkerId: string) => void;
  onApplyScoreToMainSimulator?: (score: number) => void;
  isDark?: boolean;
}

// Baris data transaksi kas UP & TUP (Slide 33)
export interface UpTunaiRow {
  id: string;
  jenis: 'UP' | 'GUP' | 'TUP' | 'GUP NIHIL' | 'SETORAN TUP' | 'GTUP NIHIL';
  tanggal: string; // YYYY-MM-DD atau DD/MM/YYYY
  selisihHari: number | null; // Delta t (hari kalender)
  totalNilai: number; // Nilai transaksi
  outstanding: number; // Running balance UP/TUP
  persenGup: number | null; // % GUP terhadap UP
  status: 'TEPAT WAKTU' | 'TERLAMBAT' | '-';
  nilaiKetepatan: number | null; // 100 atau 0
  gupDisebulankan: number | null; // % GUP Disebulankan
  nilaiSetoranTup: number | null; // Nilai Kinerja Setoran TUP
}

// Data KKP per Triwulan (Slide 32 & 34)
export interface KkpQuarterData {
  tw: string;
  label: string;
  targetPersen: number; // 1%, 5%, 9%, 12.5%
  realisasiKumulatif: number;
}

// 4 Kasus Penilaian KKP (Slide 30)
export type KkpCaseType =
  | 'CASE_1_TIDAK_ADA_KKP' // Bebas UP KKP (Konversi 100% Tunai)
  | 'CASE_2_BELUM_TRANSAKSI' // Sudah punya KKP tapi belum transaksi (Konversi 100% Tunai)
  | 'CASE_3_BELUM_CAPAI_TARGET' // Ada transaksi tapi belum capai target (Skor KKP = 100)
  | 'CASE_4_CAPAI_TARGET' // Capai target triwulanan (Skor KKP = 110 - Bonus Reward)
  | 'CASE_AUTO_TABEL'; // Otomatis dari realisasi 4 triwulan

// Snapshot Skenario Simpanan Lokal
export interface SavedScenario {
  id: string;
  name: string;
  savedAt: string;
  satkerKode?: string;
  finalScore: number;
  paguUpTunai: number;
  upKkpPerBulan: number;
  hasKkp: boolean;
  kkpCase: KkpCaseType;
  tunaiRows: UpTunaiRow[];
  kkpQuarters: KkpQuarterData[];
}

// Contoh Data Resmi Slide 33 (untuk tombol template referensi DJPb)
const OFFICIAL_SLIDE_33_TUNAI: UpTunaiRow[] = [
  { id: 'ref-1', jenis: 'UP', tanggal: '2024-03-07', selisihHari: null, totalNilai: 60000000, outstanding: 60000000, persenGup: null, status: '-', nilaiKetepatan: null, gupDisebulankan: null, nilaiSetoranTup: null },
  { id: 'ref-2', jenis: 'GUP', tanggal: '2024-04-05', selisihHari: 29, totalNilai: 60000000, outstanding: 60000000, persenGup: 100, status: 'TEPAT WAKTU', nilaiKetepatan: 100, gupDisebulankan: 100.0, nilaiSetoranTup: null },
  { id: 'ref-3', jenis: 'GUP', tanggal: '2024-05-03', selisihHari: 28, totalNilai: 60000000, outstanding: 60000000, persenGup: 100, status: 'TEPAT WAKTU', nilaiKetepatan: 100, gupDisebulankan: 100.0, nilaiSetoranTup: null },
  { id: 'ref-4', jenis: 'GUP', tanggal: '2024-05-31', selisihHari: 28, totalNilai: 30690750, outstanding: 60000000, persenGup: 51.15, status: 'TEPAT WAKTU', nilaiKetepatan: 100, gupDisebulankan: 56.63, nilaiSetoranTup: null },
  { id: 'ref-5', jenis: 'GUP', tanggal: '2024-06-28', selisihHari: 28, totalNilai: 60000000, outstanding: 60000000, persenGup: 100, status: 'TEPAT WAKTU', nilaiKetepatan: 100, gupDisebulankan: 100.0, nilaiSetoranTup: null },
  { id: 'ref-6', jenis: 'GUP', tanggal: '2024-07-26', selisihHari: 28, totalNilai: 51299830, outstanding: 60000000, persenGup: 85.50, status: 'TEPAT WAKTU', nilaiKetepatan: 100, gupDisebulankan: 91.61, nilaiSetoranTup: null },
  { id: 'ref-7', jenis: 'GUP', tanggal: '2024-08-23', selisihHari: 28, totalNilai: 60000000, outstanding: 60000000, persenGup: 100, status: 'TEPAT WAKTU', nilaiKetepatan: 100, gupDisebulankan: 100.0, nilaiSetoranTup: null },
  { id: 'ref-8', jenis: 'GUP', tanggal: '2024-09-25', selisihHari: 33, totalNilai: 54243380, outstanding: 60000000, persenGup: 90.41, status: 'TERLAMBAT', nilaiKetepatan: 0, gupDisebulankan: 84.93, nilaiSetoranTup: null },
  { id: 'ref-9', jenis: 'GUP', tanggal: '2024-11-08', selisihHari: 44, totalNilai: 60000000, outstanding: 60000000, persenGup: 100, status: 'TERLAMBAT', nilaiKetepatan: 0, gupDisebulankan: 68.18, nilaiSetoranTup: null },
  { id: 'ref-10', jenis: 'GUP', tanggal: '2024-12-06', selisihHari: 28, totalNilai: 60000000, outstanding: 60000000, persenGup: 100, status: 'TEPAT WAKTU', nilaiKetepatan: 100, gupDisebulankan: 100.0, nilaiSetoranTup: null },
  { id: 'ref-11', jenis: 'TUP', tanggal: '2024-12-09', selisihHari: null, totalNilai: 20786000, outstanding: 20786000, persenGup: null, status: '-', nilaiKetepatan: null, gupDisebulankan: null, nilaiSetoranTup: null },
  { id: 'ref-12', jenis: 'GUP', tanggal: '2024-12-09', selisihHari: 3, totalNilai: 60000000, outstanding: 60000000, persenGup: 100, status: 'TEPAT WAKTU', nilaiKetepatan: 100, gupDisebulankan: 100.0, nilaiSetoranTup: null },
  { id: 'ref-13', jenis: 'GUP NIHIL', tanggal: '2024-12-31', selisihHari: 22, totalNilai: -60000000, outstanding: 0, persenGup: null, status: 'TEPAT WAKTU', nilaiKetepatan: 100, gupDisebulankan: null, nilaiSetoranTup: null },
  { id: 'ref-14', jenis: 'SETORAN TUP', tanggal: '2024-12-31', selisihHari: 22, totalNilai: -210000, outstanding: 20576000, persenGup: null, status: '-', nilaiKetepatan: null, gupDisebulankan: null, nilaiSetoranTup: 98.99 },
  { id: 'ref-15', jenis: 'GTUP NIHIL', tanggal: '2024-12-31', selisihHari: 22, totalNilai: -20576000, outstanding: 0, persenGup: null, status: 'TEPAT WAKTU', nilaiKetepatan: 100, gupDisebulankan: null, nilaiSetoranTup: null }
];

const DEFAULT_KKP_QUARTERS: KkpQuarterData[] = [
  { tw: 'TW I', label: 'Triwulan I (s.d. Mar)', targetPersen: 1.0, realisasiKumulatif: 4000000 },
  { tw: 'TW II', label: 'Triwulan II (s.d. Jun)', targetPersen: 5.0, realisasiKumulatif: 35000000 },
  { tw: 'TW III', label: 'Triwulan III (s.d. Sep)', targetPersen: 9.0, realisasiKumulatif: 57000000 },
  { tw: 'TW IV', label: 'Triwulan IV (s.d. Des)', targetPersen: 12.5, realisasiKumulatif: 85051810 }
];

const STORAGE_PREFIX = 'ikpa_sim_uptup_local_';

export const UpTupPer5Calculator: React.FC<UpTupPer5CalculatorProps> = ({
  satkers = [],
  selectedSatkerId,
  onSelectSatker,
  onApplyScoreToMainSimulator,
  isDark = false
}) => {
  // Current active satker info
  const currentSatker = useMemo(() => {
    return satkers.find(s => s.id === selectedSatkerId) || satkers[0];
  }, [satkers, selectedSatkerId]);

  const satkerStorageKey = useMemo(() => {
    return currentSatker ? `${STORAGE_PREFIX}${currentSatker.kodeSatker}` : `${STORAGE_PREFIX}default`;
  }, [currentSatker]);

  // View modes: 'DETAIL_TABEL' | 'QUICK_SIMULATOR' | 'PANDUAN_RUMUS'
  const [calculatorViewMode, setCalculatorViewMode] = useState<'DETAIL_TABEL' | 'QUICK_SIMULATOR' | 'PANDUAN_RUMUS'>('DETAIL_TABEL');

  // Config Satker Pagu UP & KKP (bisa dicoba-coba)
  const [paguUpTunai, setPaguUpTunai] = useState<number>(60000000);
  const [upKkpPerBulan, setUpKkpPerBulan] = useState<number>(50000000);
  const [hasKkp, setHasKkp] = useState<boolean>(true);
  const upKkpSetahun = useMemo(() => hasKkp ? upKkpPerBulan * 12 : 0, [hasKkp, upKkpPerBulan]);

  // State: Baris Transaksi Kas (AWALNYA KOSONG untuk simulator coba-coba)
  const [tunaiRows, setTunaiRows] = useState<UpTunaiRow[]>([]);

  // State: KKP Quarters
  const [kkpQuarters, setKkpQuarters] = useState<KkpQuarterData[]>(DEFAULT_KKP_QUARTERS);
  const [kkpCase, setKkpCase] = useState<KkpCaseType>('CASE_AUTO_TABEL');

  // Quick Simulator State (Slider What-If)
  const [quickKetepatan, setQuickKetepatan] = useState<number>(85);
  const [quickGupDisebulankan, setQuickGupDisebulankan] = useState<number>(90);
  const [quickTotalTup, setQuickTotalTup] = useState<number>(20000000);
  const [quickSetoranTup, setQuickSetoranTup] = useState<number>(200000);
  const [quickKkpSkor, setQuickKkpSkor] = useState<number>(110);

  // Status Auto-save & Local Storage
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [savedScenariosList, setSavedScenariosList] = useState<SavedScenario[]>([]);
  const [showScenarioModal, setShowScenarioModal] = useState<boolean>(false);
  const [newScenarioName, setNewScenarioName] = useState<string>('');
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Micro-calculator state (Single GUP tester)
  const [microNilaiGup, setMicroNilaiGup] = useState<number>(60000000);
  const [microRentangHari, setMicroRentangHari] = useState<number>(28);
  const [microHariSebulan, setMicroHariSebulan] = useState<number>(30);

  // -------------------------------------------------------------
  // 1. LOCAL STORAGE: LOAD DRAFT (Awalnya Kosong jika belum ada simpanan)
  // -------------------------------------------------------------
  useEffect(() => {
    try {
      const savedDataStr = localStorage.getItem(satkerStorageKey);
      if (savedDataStr) {
        const parsed = JSON.parse(savedDataStr);
        if (Array.isArray(parsed.tunaiRows)) {
          setTunaiRows(parsed.tunaiRows);
        } else {
          setTunaiRows([]);
        }
        if (typeof parsed.paguUpTunai === 'number') setPaguUpTunai(parsed.paguUpTunai);
        if (typeof parsed.upKkpPerBulan === 'number') setUpKkpPerBulan(parsed.upKkpPerBulan);
        if (typeof parsed.hasKkp === 'boolean') setHasKkp(parsed.hasKkp);
        if (parsed.kkpCase) setKkpCase(parsed.kkpCase);
        if (Array.isArray(parsed.kkpQuarters)) setKkpQuarters(parsed.kkpQuarters);
        if (parsed.lastSaved) setLastSavedTime(parsed.lastSaved);
      } else {
        // AWALNYA KOSONG UNTUK SATKER COBA-COBA
        setTunaiRows([]);
        setLastSavedTime(null);
      }

      // Muat daftar skenario tersimpan untuk satker ini
      const scenariosStr = localStorage.getItem(`${STORAGE_PREFIX}scenarios`);
      if (scenariosStr) {
        setSavedScenariosList(JSON.parse(scenariosStr));
      }
    } catch (e) {
      console.warn('Error loading local storage for UP/TUP simulation:', e);
      setTunaiRows([]);
    }
  }, [satkerStorageKey]);

  // -------------------------------------------------------------
  // 2. LOCAL STORAGE: AUTO-SAVE KE KOMPUTER LOKAL
  // -------------------------------------------------------------
  const saveToLocalStorage = useCallback((rowsToSave: UpTunaiRow[], kkpToSave: KkpQuarterData[], currentCase: KkpCaseType, upTunaiVal: number, kkpVal: number, isKkpActive: boolean) => {
    try {
      const nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const payload = {
        satkerKode: currentSatker?.kodeSatker || 'CUSTOM',
        satkerNama: currentSatker?.namaSatker || 'Simulasi Satker',
        tunaiRows: rowsToSave,
        paguUpTunai: upTunaiVal,
        upKkpPerBulan: kkpVal,
        hasKkp: isKkpActive,
        kkpCase: currentCase,
        kkpQuarters: kkpToSave,
        lastSaved: nowStr
      };
      localStorage.setItem(satkerStorageKey, JSON.stringify(payload));
      setLastSavedTime(nowStr);
    } catch (err) {
      console.error('Failed to auto-save UP/TUP simulation to local storage:', err);
    }
  }, [satkerStorageKey, currentSatker]);

  // Trigger auto-save debounce saat ada perubahan state penting
  useEffect(() => {
    const timer = setTimeout(() => {
      saveToLocalStorage(tunaiRows, kkpQuarters, kkpCase, paguUpTunai, upKkpPerBulan, hasKkp);
    }, 400);
    return () => clearTimeout(timer);
  }, [tunaiRows, kkpQuarters, kkpCase, paguUpTunai, upKkpPerBulan, hasKkp, saveToLocalStorage]);

  // -------------------------------------------------------------
  // 3. KALKULASI AKURAT SESUAI PER-5/PB/2024 (Slide 30-34)
  // -------------------------------------------------------------

  // 3.1. Ketepatan Waktu (KW - Bobot 50% dari Tunai)
  const calculatedKetepatan = useMemo(() => {
    const validRows = tunaiRows.filter(r => r.nilaiKetepatan !== null);
    if (validRows.length === 0) return 100;
    const sum = validRows.reduce((acc, r) => acc + (r.nilaiKetepatan || 0), 0);
    return Number((sum / validRows.length).toFixed(2));
  }, [tunaiRows]);

  // 3.2. % GUP Disebulankan (PGUP - Bobot 25% dari Tunai)
  const calculatedGupDisebulankan = useMemo(() => {
    const validRows = tunaiRows.filter(r => r.gupDisebulankan !== null);
    if (validRows.length === 0) return 100;
    const sum = validRows.reduce((acc, r) => acc + (r.gupDisebulankan || 0), 0);
    return Number((sum / validRows.length).toFixed(2));
  }, [tunaiRows]);

  // 3.3. % Setoran TUP (NKSetor - Bobot 25% dari Tunai)
  const calculatedSetoranTup = useMemo(() => {
    const rowsWithSetor = tunaiRows.filter(r => r.nilaiSetoranTup !== null);
    if (rowsWithSetor.length > 0) {
      const sum = rowsWithSetor.reduce((acc, r) => acc + (r.nilaiSetoranTup || 0), 0);
      return Number((sum / rowsWithSetor.length).toFixed(2));
    }
    return 100; // Default 100 jika tidak ada sisa TUP yang disetor
  }, [tunaiRows]);

  // 3.4. Nilai Kinerja Komponen UP dan TUP Tunai (Bobot 90%)
  const calculatedNkTunai = useMemo(() => {
    const val = (0.50 * calculatedKetepatan) + (0.25 * calculatedGupDisebulankan) + (0.25 * calculatedSetoranTup);
    return Number(val.toFixed(2));
  }, [calculatedKetepatan, calculatedGupDisebulankan, calculatedSetoranTup]);

  // 3.5. Evaluasi KKP per Triwulan (Reward 110 jika capai target, 100 jika belum)
  const calculatedKkpQuarters = useMemo(() => {
    return kkpQuarters.map(q => {
      const nominalTarget = (q.targetPersen / 100) * upKkpSetahun;
      const isReached = q.realisasiKumulatif >= nominalTarget;
      const score = isReached ? 110 : 100;
      return {
        ...q,
        nominalTarget,
        isReached,
        score
      };
    });
  }, [kkpQuarters, upKkpSetahun]);

  // 3.6. Nilai Kinerja KKP (Bobot 10%)
  const calculatedNkKkp = useMemo(() => {
    if (!hasKkp || kkpCase === 'CASE_1_TIDAK_ADA_KKP' || kkpCase === 'CASE_2_BELUM_TRANSAKSI') {
      return null; // Konversi 100% dari Tunai
    }
    if (kkpCase === 'CASE_3_BELUM_CAPAI_TARGET') {
      return 100.0;
    }
    if (kkpCase === 'CASE_4_CAPAI_TARGET') {
      return 110.0;
    }
    // Default: CASE_AUTO_TABEL
    const sum = calculatedKkpQuarters.reduce((acc, q) => acc + q.score, 0);
    return Number((sum / calculatedKkpQuarters.length).toFixed(2));
  }, [hasKkp, kkpCase, calculatedKkpQuarters]);

  // 3.7. Skor Akhir IKPA Pengelolaan UP dan TUP (Slide 30)
  const finalIkpaScore = useMemo(() => {
    if (calculatorViewMode === 'QUICK_SIMULATOR') {
      const nkTunaiQuick = (0.50 * quickKetepatan) + (0.25 * quickGupDisebulankan) + (0.25 * Math.max(0, 100 - ((quickSetoranTup / (quickTotalTup || 1)) * 100)));
      if (!hasKkp || kkpCase === 'CASE_1_TIDAK_ADA_KKP' || kkpCase === 'CASE_2_BELUM_TRANSAKSI') {
        return Number(nkTunaiQuick.toFixed(2));
      }
      const score = (0.90 * nkTunaiQuick) + (0.10 * quickKkpSkor);
      return Number(score.toFixed(2));
    }

    // Detail Mode
    if (!hasKkp || kkpCase === 'CASE_1_TIDAK_ADA_KKP' || kkpCase === 'CASE_2_BELUM_TRANSAKSI' || calculatedNkKkp === null) {
      // Bebas KKP: 100% Nilai Kinerja Tunai
      return calculatedNkTunai;
    }

    // Standard formula: (90% x NK-Tunai) + (10% x NK-KKP)
    const score = (0.90 * calculatedNkTunai) + (0.10 * calculatedNkKkp);
    return Number(score.toFixed(2));
  }, [calculatorViewMode, calculatedNkTunai, calculatedNkKkp, hasKkp, kkpCase, quickKetepatan, quickGupDisebulankan, quickTotalTup, quickSetoranTup, quickKkpSkor]);

  // Selisih dengan skor eksisting di database
  const existingScore = currentSatker?.indikator?.pengelolaanUpTup ?? null;
  const scoreDelta = useMemo(() => {
    if (existingScore === null) return null;
    return Number((finalIkpaScore - existingScore).toFixed(2));
  }, [finalIkpaScore, existingScore]);

  // Predikat
  const predikatScore = useMemo(() => {
    if (finalIkpaScore >= 95) return { label: 'Sangat Baik', color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800' };
    if (finalIkpaScore >= 89) return { label: 'Baik', color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800' };
    if (finalIkpaScore >= 75) return { label: 'Cukup', color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800' };
    return { label: 'Kurang', color: 'text-rose-700 dark:text-rose-300', bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800' };
  }, [finalIkpaScore]);

  // Micro tool result
  const microResult = useMemo(() => {
    const persenGupMurni = paguUpTunai > 0 ? (microNilaiGup / paguUpTunai) * 100 : 0;
    const rentang = microRentangHari > 0 ? microRentangHari : 1;
    const disebulankan = persenGupMurni * (microHariSebulan / rentang);
    return {
      persenGupMurni: Number(persenGupMurni.toFixed(2)),
      gupDisebulankan: Number(disebulankan.toFixed(2))
    };
  }, [paguUpTunai, microNilaiGup, microRentangHari, microHariSebulan]);

  // -------------------------------------------------------------
  // 4. SMART ROW MANAGEMENT & FORMULA ENGINE
  // -------------------------------------------------------------

  // Hitung ulang seluruh baris secara sekuensial (Running balance + auto status)
  const recalculateAllRows = (rows: UpTunaiRow[], basePaguUp: number): UpTunaiRow[] => {
    let runningBalance = 0;
    return rows.map((r, i) => {
      const updated = { ...r };
      
      // Auto delta days if previous date exists and current row is date-based
      if (i > 0 && updated.tanggal && rows[i - 1].tanggal && updated.selisihHari === null && updated.jenis !== 'UP' && updated.jenis !== 'TUP') {
        const dPrev = new Date(rows[i - 1].tanggal);
        const dCurr = new Date(updated.tanggal);
        if (!isNaN(dPrev.getTime()) && !isNaN(dCurr.getTime())) {
          const diffTime = Math.abs(dCurr.getTime() - dPrev.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          updated.selisihHari = diffDays;
        }
      }

      // Status Ketepatan Waktu (Batas 30 hari)
      if (updated.selisihHari !== null) {
        if (updated.selisihHari > 30) {
          updated.status = 'TERLAMBAT';
          updated.nilaiKetepatan = 0;
        } else {
          updated.status = 'TEPAT WAKTU';
          updated.nilaiKetepatan = 100;
        }
      } else {
        updated.status = '-';
        updated.nilaiKetepatan = null;
      }

      // % GUP terhadap Pagu UP
      if (updated.jenis === 'GUP' && basePaguUp > 0) {
        updated.persenGup = Number(((updated.totalNilai / basePaguUp) * 100).toFixed(2));
        // % GUP Disebulankan: % GUP x 30 / deltaT
        if (updated.selisihHari && updated.selisihHari > 0) {
          const sebulan = (updated.persenGup * 30) / updated.selisihHari;
          updated.gupDisebulankan = Number(sebulan.toFixed(2));
        } else {
          updated.gupDisebulankan = 100.0;
        }
      } else if (updated.jenis === 'GUP NIHIL') {
        updated.persenGup = null;
        updated.gupDisebulankan = null;
      }

      // Running Balance Outstanding
      if (updated.jenis === 'UP') {
        runningBalance = updated.totalNilai;
      } else if (updated.jenis === 'GUP') {
        // Revolving mengisi kembali UP
        runningBalance = basePaguUp;
      } else if (updated.jenis === 'TUP') {
        runningBalance += updated.totalNilai;
      } else if (updated.jenis === 'SETORAN TUP') {
        runningBalance = Math.max(0, runningBalance - Math.abs(updated.totalNilai));
      } else if (updated.jenis === 'GUP NIHIL' || updated.jenis === 'GTUP NIHIL') {
        runningBalance = Math.max(0, runningBalance - Math.abs(updated.totalNilai));
      }
      updated.outstanding = runningBalance;

      return updated;
    });
  };

  // Tambah baris transaksi baru
  const handleAddTunaiRow = (jenis: UpTunaiRow['jenis'] = 'GUP') => {
    const today = new Date().toISOString().split('T')[0];
    const newId = `row-${Date.now()}`;
    const defaultVal = jenis === 'UP' ? paguUpTunai : jenis === 'GUP' ? paguUpTunai : jenis === 'TUP' ? 20000000 : jenis === 'SETORAN TUP' ? -200000 : -paguUpTunai;
    const defaultDelta = (jenis === 'UP' || jenis === 'TUP') ? null : 28;

    const newRow: UpTunaiRow = {
      id: newId,
      jenis,
      tanggal: today,
      selisihHari: defaultDelta,
      totalNilai: defaultVal,
      outstanding: paguUpTunai,
      persenGup: jenis === 'GUP' ? 100 : null,
      status: defaultDelta ? (defaultDelta <= 30 ? 'TEPAT WAKTU' : 'TERLAMBAT') : '-',
      nilaiKetepatan: defaultDelta ? (defaultDelta <= 30 ? 100 : 0) : null,
      gupDisebulankan: jenis === 'GUP' ? 100 : null,
      nilaiSetoranTup: jenis === 'SETORAN TUP' ? 99.0 : null
    };

    setTunaiRows(prev => recalculateAllRows([...prev, newRow], paguUpTunai));
  };

  const handleUpdateRow = (id: string, field: keyof UpTunaiRow, val: any) => {
    setTunaiRows(prev => {
      const updatedList = prev.map(r => r.id === id ? { ...r, [field]: val } : r);
      return recalculateAllRows(updatedList, paguUpTunai);
    });
  };

  const handleDeleteRow = (id: string) => {
    setTunaiRows(prev => recalculateAllRows(prev.filter(r => r.id !== id), paguUpTunai));
  };

  // -------------------------------------------------------------
  // 5. TEMPLATE GENERATORS UNTUK COBA-COBA
  // -------------------------------------------------------------

  // Bersihkan lembar simulasi (KOSONGKAN TOTAL)
  const handleClearToBlank = () => {
    setTunaiRows([]);
    setSaveToast('✨ Lembar kerja telah dikosongkan. Siap untuk mencoba simulasi baru!');
    setTimeout(() => setSaveToast(null), 3000);
  };

  // Template 1: 12 Bulan Ideal (Nilai 100)
  const handleLoadIdeal12Months = () => {
    const rows: UpTunaiRow[] = [
      { id: 'id-0', jenis: 'UP', tanggal: '2024-01-10', selisihHari: null, totalNilai: paguUpTunai, outstanding: paguUpTunai, persenGup: null, status: '-', nilaiKetepatan: null, gupDisebulankan: null, nilaiSetoranTup: null },
      { id: 'id-1', jenis: 'GUP', tanggal: '2024-02-06', selisihHari: 27, totalNilai: paguUpTunai, outstanding: paguUpTunai, persenGup: 100, status: 'TEPAT WAKTU', nilaiKetepatan: 100, gupDisebulankan: 100, nilaiSetoranTup: null },
      { id: 'id-2', jenis: 'GUP', tanggal: '2024-03-05', selisihHari: 28, totalNilai: paguUpTunai, outstanding: paguUpTunai, persenGup: 100, status: 'TEPAT WAKTU', nilaiKetepatan: 100, gupDisebulankan: 100, nilaiSetoranTup: null },
      { id: 'id-3', jenis: 'GUP', tanggal: '2024-04-02', selisihHari: 28, totalNilai: paguUpTunai, outstanding: paguUpTunai, persenGup: 100, status: 'TEPAT WAKTU', nilaiKetepatan: 100, gupDisebulankan: 100, nilaiSetoranTup: null },
      { id: 'id-4', jenis: 'GUP', tanggal: '2024-04-30', selisihHari: 28, totalNilai: paguUpTunai, outstanding: paguUpTunai, persenGup: 100, status: 'TEPAT WAKTU', nilaiKetepatan: 100, gupDisebulankan: 100, nilaiSetoranTup: null },
      { id: 'id-5', jenis: 'GUP', tanggal: '2024-05-28', selisihHari: 28, totalNilai: paguUpTunai, outstanding: paguUpTunai, persenGup: 100, status: 'TEPAT WAKTU', nilaiKetepatan: 100, gupDisebulankan: 100, nilaiSetoranTup: null },
      { id: 'id-6', jenis: 'GUP', tanggal: '2024-06-25', selisihHari: 28, totalNilai: paguUpTunai, outstanding: paguUpTunai, persenGup: 100, status: 'TEPAT WAKTU', nilaiKetepatan: 100, gupDisebulankan: 100, nilaiSetoranTup: null },
      { id: 'id-7', jenis: 'GUP', tanggal: '2024-07-23', selisihHari: 28, totalNilai: paguUpTunai, outstanding: paguUpTunai, persenGup: 100, status: 'TEPAT WAKTU', nilaiKetepatan: 100, gupDisebulankan: 100, nilaiSetoranTup: null },
      { id: 'id-8', jenis: 'GUP', tanggal: '2024-08-20', selisihHari: 28, totalNilai: paguUpTunai, outstanding: paguUpTunai, persenGup: 100, status: 'TEPAT WAKTU', nilaiKetepatan: 100, gupDisebulankan: 100, nilaiSetoranTup: null },
      { id: 'id-9', jenis: 'GUP', tanggal: '2024-09-17', selisihHari: 28, totalNilai: paguUpTunai, outstanding: paguUpTunai, persenGup: 100, status: 'TEPAT WAKTU', nilaiKetepatan: 100, gupDisebulankan: 100, nilaiSetoranTup: null },
      { id: 'id-10', jenis: 'GUP', tanggal: '2024-10-15', selisihHari: 28, totalNilai: paguUpTunai, outstanding: paguUpTunai, persenGup: 100, status: 'TEPAT WAKTU', nilaiKetepatan: 100, gupDisebulankan: 100, nilaiSetoranTup: null },
      { id: 'id-11', jenis: 'GUP', tanggal: '2024-11-12', selisihHari: 28, totalNilai: paguUpTunai, outstanding: paguUpTunai, persenGup: 100, status: 'TEPAT WAKTU', nilaiKetepatan: 100, gupDisebulankan: 100, nilaiSetoranTup: null },
      { id: 'id-12', jenis: 'GUP', tanggal: '2024-12-10', selisihHari: 28, totalNilai: paguUpTunai, outstanding: paguUpTunai, persenGup: 100, status: 'TEPAT WAKTU', nilaiKetepatan: 100, gupDisebulankan: 100, nilaiSetoranTup: null },
      { id: 'id-13', jenis: 'GUP NIHIL', tanggal: '2024-12-30', selisihHari: 20, totalNilai: -paguUpTunai, outstanding: 0, persenGup: null, status: 'TEPAT WAKTU', nilaiKetepatan: 100, gupDisebulankan: null, nilaiSetoranTup: null }
    ];
    setTunaiRows(recalculateAllRows(rows, paguUpTunai));
    setKkpCase('CASE_4_CAPAI_TARGET');
    setSaveToast('⚡ Berhasil memuat Template Siklus Ideal 1 Tahun Penuh (Skor 100 & Reward KKP 110)!');
    setTimeout(() => setSaveToast(null), 3000);
  };

  // Template 2: Simulasi Kasus Keterlambatan Revolving (Melihat efek nilai anjlok)
  const handleLoadLateScenario = () => {
    const rows: UpTunaiRow[] = [
      { id: 'late-1', jenis: 'UP', tanggal: '2024-03-01', selisihHari: null, totalNilai: paguUpTunai, outstanding: paguUpTunai, persenGup: null, status: '-', nilaiKetepatan: null, gupDisebulankan: null, nilaiSetoranTup: null },
      { id: 'late-2', jenis: 'GUP', tanggal: '2024-03-28', selisihHari: 27, totalNilai: paguUpTunai, outstanding: paguUpTunai, persenGup: 100, status: 'TEPAT WAKTU', nilaiKetepatan: 100, gupDisebulankan: 100, nilaiSetoranTup: null },
      { id: 'late-3', jenis: 'GUP', tanggal: '2024-05-08', selisihHari: 41, totalNilai: paguUpTunai, outstanding: paguUpTunai, persenGup: 100, status: 'TERLAMBAT', nilaiKetepatan: 0, gupDisebulankan: 73.17, nilaiSetoranTup: null },
      { id: 'late-4', jenis: 'GUP', tanggal: '2024-06-05', selisihHari: 28, totalNilai: paguUpTunai, outstanding: paguUpTunai, persenGup: 100, status: 'TEPAT WAKTU', nilaiKetepatan: 100, gupDisebulankan: 100, nilaiSetoranTup: null },
      { id: 'late-5', jenis: 'GUP', tanggal: '2024-07-25', selisihHari: 50, totalNilai: paguUpTunai * 0.7, outstanding: paguUpTunai, persenGup: 70, status: 'TERLAMBAT', nilaiKetepatan: 0, gupDisebulankan: 42.0, nilaiSetoranTup: null }
    ];
    setTunaiRows(recalculateAllRows(rows, paguUpTunai));
    setSaveToast('🧪 Berhasil memuat Kasus Keterlambatan Revolving (> 30 Hari). Perhatikan penurunan skor ketepatan waktu!');
    setTimeout(() => setSaveToast(null), 3500);
  };

  // Template 3: Muat Data Resmi Slide 33 & 34 DJPb
  const handleLoadOfficialSlide = () => {
    setTunaiRows(recalculateAllRows(OFFICIAL_SLIDE_33_TUNAI, 60000000));
    setPaguUpTunai(60000000);
    setUpKkpPerBulan(50000000);
    setHasKkp(true);
    setKkpCase('CASE_AUTO_TABEL');
    setKkpQuarters(DEFAULT_KKP_QUARTERS);
    setSaveToast('📋 Memuat data acuan resmi DJPb (Slide 33 & 34 Petunjuk Teknis).');
    setTimeout(() => setSaveToast(null), 3000);
  };

  // -------------------------------------------------------------
  // 6. MANAJEMEN SKENARIO TERSIMPAN (SNAPSHOTS)
  // -------------------------------------------------------------
  const handleSaveScenarioPrompt = () => {
    if (!newScenarioName.trim()) return;
    const newScenario: SavedScenario = {
      id: `scen-${Date.now()}`,
      name: newScenarioName.trim(),
      savedAt: new Date().toLocaleString('id-ID'),
      satkerKode: currentSatker?.kodeSatker,
      finalScore: finalIkpaScore,
      paguUpTunai,
      upKkpPerBulan,
      hasKkp,
      kkpCase,
      tunaiRows,
      kkpQuarters
    };

    const nextList = [newScenario, ...savedScenariosList.slice(0, 19)];
    setSavedScenariosList(nextList);
    localStorage.setItem(`${STORAGE_PREFIX}scenarios`, JSON.stringify(nextList));
    setNewScenarioName('');
    setShowScenarioModal(false);
    setSaveToast(`💾 Skenario "${newScenario.name}" berhasil disimpan di komputer lokal Anda!`);
    setTimeout(() => setSaveToast(null), 3000);
  };

  const handleApplySavedScenario = (scen: SavedScenario) => {
    setTunaiRows(scen.tunaiRows || []);
    setPaguUpTunai(scen.paguUpTunai || 60000000);
    setUpKkpPerBulan(scen.upKkpPerBulan || 50000000);
    setHasKkp(scen.hasKkp ?? true);
    setKkpCase(scen.kkpCase || 'CASE_AUTO_TABEL');
    if (scen.kkpQuarters) setKkpQuarters(scen.kkpQuarters);
    setShowScenarioModal(false);
    setSaveToast(`📂 Memuat skenario "${scen.name}" (Skor: ${scen.finalScore.toFixed(1)}).`);
    setTimeout(() => setSaveToast(null), 3000);
  };

  const handleDeleteSavedScenario = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = savedScenariosList.filter(s => s.id !== id);
    setSavedScenariosList(filtered);
    localStorage.setItem(`${STORAGE_PREFIX}scenarios`, JSON.stringify(filtered));
  };

  // Ekspor JSON ke file lokal
  const handleExportJson = () => {
    const dataToExport = {
      version: 'PER-5/PB/2024',
      appName: 'Sistem Monitoring KPPN Semarang I',
      satker: currentSatker ? { kode: currentSatker.kodeSatker, nama: currentSatker.namaSatker } : null,
      exportedAt: new Date().toISOString(),
      finalScore: finalIkpaScore,
      paguUpTunai,
      upKkpPerBulan,
      hasKkp,
      kkpCase,
      tunaiRows,
      kkpQuarters
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `simulasi_uptup_${currentSatker?.kodeSatker || 'coba_coba'}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setSaveToast('📥 File cadangan simulasi berhasil diunduh ke komputer!');
    setTimeout(() => setSaveToast(null), 3000);
  };

  // Impor JSON dari komputer lokal
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed.tunaiRows)) {
          setTunaiRows(parsed.tunaiRows);
          if (parsed.paguUpTunai) setPaguUpTunai(parsed.paguUpTunai);
          if (parsed.upKkpPerBulan) setUpKkpPerBulan(parsed.upKkpPerBulan);
          if (typeof parsed.hasKkp === 'boolean') setHasKkp(parsed.hasKkp);
          if (parsed.kkpCase) setKkpCase(parsed.kkpCase);
          if (Array.isArray(parsed.kkpQuarters)) setKkpQuarters(parsed.kkpQuarters);
          setSaveToast('📤 File simulasi lokal berhasil dimuat!');
          setTimeout(() => setSaveToast(null), 3000);
        } else {
          alert('Format berkas JSON tidak valid.');
        }
      } catch (err) {
        alert('Gagal membaca berkas JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Salin Resume Teks
  const handleCopyAnalysis = () => {
    const text = `*HASIL SIMULASI INDIKATOR PENGELOLAAN UP DAN TUP (PER-5/PB/2024)*
${currentSatker ? `Satker: [${currentSatker.kodeSatker}] ${currentSatker.namaSatker}` : 'Laboratorium Simulasi Satker'}
Tersimpan di: Komputer Lokal Satker

🎯 *NILAI HASIL SIMULASI: ${finalIkpaScore.toFixed(2)} (${predikatScore.label})*
${existingScore !== null ? `(Skor Aktual di Sistem: ${existingScore.toFixed(2)} | Dampak: ${scoreDelta && scoreDelta >= 0 ? '+' : ''}${scoreDelta})` : ''}

*Rincian Sub-Indikator:*
1. UP & TUP Tunai (Bobot 90%): ${calculatedNkTunai.toFixed(2)}
   - Ketepatan Waktu (50%): ${calculatedKetepatan.toFixed(2)} (${tunaiRows.filter(r => r.status === 'TERLAMBAT').length} kali terlambat)
   - % GUP Disebulankan (25%): ${calculatedGupDisebulankan.toFixed(2)}%
   - % Setoran TUP (25%): ${calculatedSetoranTup.toFixed(2)}
2. KKP (Bobot 10%): ${calculatedNkKkp !== null ? calculatedNkKkp.toFixed(2) : 'Dikonversi ke Tunai'}
   - Status KKP: ${!hasKkp ? 'Bebas KKP' : kkpCase === 'CASE_4_CAPAI_TARGET' ? 'Mencapai Target (Reward 110)' : 'Standar'}

Dihitung via Simulator Mandiri Satker - Petunjuk Teknis PER-5/PB/2024.`;

    navigator.clipboard.writeText(text);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  return (
    <div className="space-y-6">

      {/* TOAST PEMBERITAHUAN LOCAL STORAGE */}
      {saveToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold rounded-xl shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* HEADER UTAMA: SIMULATOR MANDIRI SATKER (COBA-COBA LOKAL) */}
      {/* ========================================================================= */}
      <div className={`p-5 sm:p-6 rounded-2xl border transition-all ${
        isDark 
          ? 'bg-slate-900/90 border-slate-800 text-white' 
          : 'bg-white border-slate-200 text-slate-900 shadow-sm'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300 border border-purple-300 dark:border-purple-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-300" />
                Simulator Coba-Coba Satker
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Tersimpan di Lokal Komputer (Aman)
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                Formula Resmi PER-5/PB/2024
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
              <span>Laboratorium Simulasi Pengelolaan UP &amp; TUP Satker</span>
            </h2>

            <p className={`text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Ruang uji coba khusus satker untuk menguji berbagai skenario revolving, keterlambatan SP2D, setoran TUP, dan reward KKP (110 poin). 
              <strong> Data disimpan di komputer Anda sendiri (tidak mempengaruhi database server).</strong>
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 self-start lg:self-center shrink-0">
            <button
              onClick={() => setCalculatorViewMode('DETAIL_TABEL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                calculatorViewMode === 'DETAIL_TABEL'
                  ? 'bg-purple-600 text-white shadow-sm font-black'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Lembar Transaksi Riil</span>
            </button>

            <button
              onClick={() => setCalculatorViewMode('QUICK_SIMULATOR')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                calculatorViewMode === 'QUICK_SIMULATOR'
                  ? 'bg-purple-600 text-white shadow-sm font-black'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Kalkulator Cepat (Slider)</span>
            </button>

            <button
              onClick={() => setCalculatorViewMode('PANDUAN_RUMUS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                calculatorViewMode === 'PANDUAN_RUMUS'
                  ? 'bg-purple-600 text-white shadow-sm font-black'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              <span>Panduan Rumus (Slide 30-34)</span>
            </button>
          </div>
        </div>

        {/* SATKER SELECTOR & LOCAL STORAGE CONTROLS */}
        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className={`font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Satker yang Dicoba:</span>
            {satkers.length > 0 && onSelectSatker ? (
              <select
                value={selectedSatkerId || ''}
                onChange={(e) => onSelectSatker(e.target.value)}
                className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold focus:outline-none cursor-pointer ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-white'
                    : 'bg-white border-slate-300 text-slate-900'
                }`}
              >
                {satkers.slice(0, 30).map(s => (
                  <option key={s.id} value={s.id}>
                    [{s.kodeSatker}] {s.namaSatker.length > 32 ? s.namaSatker.substring(0, 32) + '...' : s.namaSatker} (Aktual: {s.indikator.pengelolaanUpTup.toFixed(1)})
                  </option>
                ))}
              </select>
            ) : (
              <span className="font-bold text-purple-600 dark:text-purple-400">Mode Simulasi Umum</span>
            )}

            {lastSavedTime && (
              <span className="text-2xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-emerald-500" />
                <span>Tersimpan lokal: {lastSavedTime}</span>
              </span>
            )}
          </div>

          {/* Quick Local Storage Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowScenarioModal(true)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Simpan atau buka daftar skenario coba-coba yang disimpan di komputer ini"
            >
              <FolderOpen className="w-3.5 h-3.5 text-amber-500" />
              <span>Skenario ({savedScenariosList.length})</span>
            </button>

            <button
              onClick={handleExportJson}
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Unduh data simulasi ini sebagai berkas JSON cadangan"
            >
              <Download className="w-3.5 h-3.5 text-blue-500" />
              <span>Ekspor</span>
            </button>

            <label className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 transition-colors flex items-center gap-1.5 cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-purple-500" />
              <span>Impor</span>
              <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
            </label>

            <button
              onClick={handleCopyAnalysis}
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/50 border border-purple-200 dark:border-purple-800 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {copiedNotification ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedNotification ? 'Tersalin!' : 'Salin Resume'}</span>
            </button>

            {onApplyScoreToMainSimulator && (
              <button
                onClick={() => onApplyScoreToMainSimulator(finalIkpaScore)}
                className="px-3 py-1.5 rounded-lg text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                title="Terapkan nilai hasil simulasi coba-coba ini ke simulator utama 8 indikator IKPA"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Terapkan ke Simulator Utama ({finalIkpaScore.toFixed(1)})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* KARTU RINGKASAN SKOR HASIL SIMULASI & PERBANDINGAN */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Card 1: Nilai Akhir Hasil Simulasi Coba-Coba */}
        <div className={`p-5 rounded-2xl border relative overflow-hidden flex flex-col justify-between ${
          isDark 
            ? 'bg-gradient-to-br from-purple-950/50 to-slate-900 border-purple-800 text-white' 
            : 'bg-gradient-to-br from-purple-50 to-white border-purple-200 text-slate-900 shadow-sm'
        }`}>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                NILAI SIMULASI UP &amp; TUP
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-black border ${predikatScore.bg} ${predikatScore.color}`}>
                {predikatScore.label}
              </span>
            </div>
            
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-black tracking-tight text-purple-700 dark:text-purple-300">
                {finalIkpaScore.toFixed(2)}
              </span>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">/ 100</span>
            </div>

            {existingScore !== null && (
              <div className="mt-2 flex items-center gap-2 text-2xs">
                <span className="text-slate-500">Aktual di Sistem:</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{existingScore.toFixed(1)}</span>
                {scoreDelta !== null && (
                  <span className={`font-black px-1.5 py-0.5 rounded ${
                    scoreDelta > 0 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                    scoreDelta < 0 ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                    'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}>
                    {scoreDelta > 0 ? `+${scoreDelta}` : scoreDelta}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="mt-3 pt-2.5 border-t border-purple-200/60 dark:border-purple-800/60 text-2xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Bobot Indikator: 10%</span>
            <span className="font-bold text-purple-600 dark:text-purple-400">
              {(finalIkpaScore * 0.10).toFixed(2)} Poin Total IKPA
            </span>
          </div>
        </div>

        {/* Card 2: UP & TUP Tunai (90%) */}
        <div className={`p-5 rounded-2xl border flex flex-col justify-between ${
          isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
        }`}>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                1. NK - TUNAI (90%)
              </span>
              <span className="px-2 py-0.5 rounded text-2xs font-extrabold bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
                Bobot 90%
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black tracking-tight text-blue-600 dark:text-blue-400">
                {calculatedNkTunai.toFixed(2)}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                (x 90% = {(calculatedNkTunai * 0.90).toFixed(2)})
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800 text-2xs space-y-1 text-slate-500 dark:text-slate-400">
            <div className="flex justify-between">
              <span>Ketepatan Waktu (50%):</span>
              <strong className={calculatedKetepatan < 100 ? 'text-rose-500 font-bold' : 'text-slate-700 dark:text-slate-200'}>
                {calculatedKetepatan.toFixed(1)}
              </strong>
            </div>
            <div className="flex justify-between">
              <span>% GUP Sebulan (25%):</span>
              <strong className="text-slate-700 dark:text-slate-200">{calculatedGupDisebulankan.toFixed(1)}%</strong>
            </div>
            <div className="flex justify-between">
              <span>% Setoran TUP (25%):</span>
              <strong className="text-slate-700 dark:text-slate-200">{calculatedSetoranTup.toFixed(1)}</strong>
            </div>
          </div>
        </div>

        {/* Card 3: Nilai Kinerja Penggunaan KKP (10%) */}
        <div className={`p-5 rounded-2xl border flex flex-col justify-between ${
          isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
        }`}>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                2. NK - KKP (10%)
              </span>
              <span className="px-2 py-0.5 rounded text-2xs font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                Reward Max 110
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
                {calculatedNkKkp !== null ? calculatedNkKkp.toFixed(2) : '-'}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                {calculatedNkKkp !== null ? `(x 10% = ${(calculatedNkKkp * 0.10).toFixed(2)})` : '(Konversi 100% Tunai)'}
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800 text-2xs space-y-1 text-slate-500 dark:text-slate-400">
            <div className="flex justify-between">
              <span>Status KKP Satker:</span>
              <strong className="text-slate-700 dark:text-slate-200">
                {!hasKkp ? 'Bebas KKP' :
                 kkpCase === 'CASE_4_CAPAI_TARGET' ? 'Mencapai Target (110 ⭐)' :
                 kkpCase === 'CASE_3_BELUM_CAPAI_TARGET' ? 'Belum Capai (100)' : 'Otomatis 4 TW'}
              </strong>
            </div>
            <div className="flex justify-between">
              <span>Pagu KKP / Tahun:</span>
              <strong className="text-slate-700 dark:text-slate-200">
                {hasKkp ? `Rp ${(upKkpSetahun).toLocaleString('id-ID')}` : 'Tidak Ada'}
              </strong>
            </div>
          </div>
        </div>

        {/* Card 4: Quick Mini Calculator % GUP Sebulan */}
        <div className={`p-4 rounded-2xl border flex flex-col justify-between ${
          isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
        }`}>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
              <Calculator className="w-3.5 h-3.5" />
              <span>Tester Cepat % GUP Sebulan</span>
            </div>
            <div className="mt-2 space-y-2 text-2xs">
              <div className="flex items-center justify-between gap-1">
                <span className="text-slate-500">Nilai GUP (Juta):</span>
                <input
                  type="number"
                  value={microNilaiGup / 1000000}
                  onChange={(e) => setMicroNilaiGup((Number(e.target.value) || 0) * 1000000)}
                  className="w-16 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 text-right font-bold bg-transparent"
                />
              </div>

              <div className="flex items-center justify-between gap-1">
                <span className="text-slate-500">Rentang Waktu (Δt):</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={microRentangHari}
                    onChange={(e) => setMicroRentangHari(Number(e.target.value) || 1)}
                    className="w-12 px-1 py-0.5 rounded border border-slate-300 dark:border-slate-700 text-right font-bold bg-transparent"
                  />
                  <span>hari</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-2xs text-slate-500 font-semibold">% GUP Sebulan:</span>
            <span className={`text-sm font-black ${microResult.gupDisebulankan >= 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {microResult.gupDisebulankan.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: LEMBAR TRANSAKSI DETAIL (AWALNYA KOSONG + OPSI TEMPLATE) */}
      {/* ========================================================================= */}
      {calculatorViewMode === 'DETAIL_TABEL' && (
        <div className="space-y-6">

          {/* Pengaturan Pagu Satker Coba-Coba */}
          <div className={`p-4 sm:p-5 rounded-2xl border flex flex-wrap items-center justify-between gap-4 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex flex-wrap items-center gap-6">
              <div>
                <label className="block text-2xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                  Pagu UP Tunai Satker (Rp):
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-500">Rp</span>
                  <input
                    type="number"
                    value={paguUpTunai}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 0;
                      setPaguUpTunai(val);
                      setTunaiRows(prev => recalculateAllRows(prev, val));
                    }}
                    step="1000000"
                    className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 w-36"
                  />
                </div>
              </div>

              <div>
                <label className="block text-2xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                  Pagu KKP per Bulan (Rp):
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">Rp</span>
                  <input
                    type="number"
                    value={upKkpPerBulan}
                    onChange={(e) => setUpKkpPerBulan(Number(e.target.value) || 0)}
                    disabled={!hasKkp}
                    step="1000000"
                    className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 w-36 disabled:opacity-50"
                  />
                  <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer ml-2">
                    <input
                      type="checkbox"
                      checked={hasKkp}
                      onChange={(e) => setHasKkp(e.target.checked)}
                      className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span>Satker Memiliki KKP</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Template & Reset Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleLoadIdeal12Months}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Muat simulasi siklus 12 bulan ideal dengan revolving lancar (Skor 100)"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>⚡ Muat Template 12 Bulan Ideal</span>
              </button>

              <button
                type="button"
                onClick={handleLoadLateScenario}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-300 dark:hover:bg-amber-900/60 border border-amber-300 dark:border-amber-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Coba simulasi jika terdapat keterlambatan pertanggungjawaban revolving > 30 hari"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>🧪 Coba Kasus Terlambat</span>
              </button>

              <button
                type="button"
                onClick={handleLoadOfficialSlide}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Muat 15 baris resmi dari Slide 33 & 34 DJPb"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>📋 Slide 33 DJPb</span>
              </button>

              <button
                type="button"
                onClick={handleClearToBlank}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/50 dark:text-rose-300 dark:hover:bg-rose-900/60 border border-rose-300 dark:border-rose-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Kosongkan lembar simulasi ini untuk mencoba dari awal"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Kosongkan Lembar</span>
              </button>
            </div>
          </div>

          {/* MATRIKS TABEL TRANSAKSI (JIKA ADA ISI MAUPUN KOSONG) */}
          <div className={`p-5 sm:p-6 rounded-2xl border ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-base sm:text-lg font-black tracking-tight">
                    Matriks Transaksi Pengelolaan UP &amp; TUP Tunai (Bobot 90%)
                  </h3>
                </div>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Ketepatan Waktu: batas maksimal 30 hari kalender. % GUP Disebulankan ditargetkan 100% sebulan.
                </p>
              </div>

              {/* Quick Row Inserters */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAddTunaiRow('UP')}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ SP2D UP Awal</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddTunaiRow('GUP')}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ Revolving GUP</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddTunaiRow('TUP')}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ Pengajuan TUP</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddTunaiRow('GUP NIHIL')}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ GUP Nihil (Tutup Tahun)</span>
                </button>
              </div>
            </div>

            {/* EMPTY STATE JIKA BELUM ADA BARIS TRANSAKSI */}
            {tunaiRows.length === 0 ? (
              <div className={`p-8 sm:p-12 rounded-2xl border-2 border-dashed text-center space-y-4 ${
                isDark ? 'border-slate-800 bg-slate-800/30' : 'border-slate-300 bg-slate-50/50'
              }`}>
                <div className="w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 flex items-center justify-center mx-auto shadow-inner">
                  <Coins className="w-8 h-8" />
                </div>

                <div className="max-w-md mx-auto space-y-1.5">
                  <h4 className="text-base sm:text-lg font-black tracking-tight">
                    Lembar Simulasi Masih Kosong
                  </h4>
                  <p className={`text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Silakan mulai menambahkan transaksi SP2D UP untuk Satker Anda, atau gunakan salah satu template otomatis di bawah untuk mencoba-coba perhitungannya.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => handleAddTunaiRow('UP')}
                    className="px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-600/30 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Tambah Transaksi SP2D UP Pertama</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLoadIdeal12Months}
                    className="px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/30 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Zap className="w-4 h-4" />
                    <span>⚡ Gunakan Template 12 Bulan Ideal</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLoadOfficialSlide}
                    className="px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>📋 Muat Data Resmi Slide 33</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className={`border-b text-2xs font-extrabold uppercase tracking-wider ${
                      isDark ? 'bg-slate-800/80 text-slate-300 border-slate-700' : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}>
                      <th className="py-2.5 px-3 w-10 text-center">No</th>
                      <th className="py-2.5 px-3 w-28">Jenis Transaksi</th>
                      <th className="py-2.5 px-3 w-32">Tanggal</th>
                      <th className="py-2.5 px-3 w-24 text-center">Rentang (Δt)</th>
                      <th className="py-2.5 px-3 w-36 text-right">Nilai / GU (Rp)</th>
                      <th className="py-2.5 px-3 w-32 text-right">Outstanding UP</th>
                      <th className="py-2.5 px-3 w-24 text-center">% GUP</th>
                      <th className="py-2.5 px-3 w-28 text-center">Ketepatan</th>
                      <th className="py-2.5 px-3 w-20 text-center">Skor Waktu</th>
                      <th className="py-2.5 px-3 w-28 text-center">% GUP Sebulan</th>
                      <th className="py-2.5 px-3 w-24 text-center">Setoran TUP</th>
                      <th className="py-2.5 px-2 w-12 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {tunaiRows.map((row, idx) => (
                      <tr 
                        key={row.id}
                        className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors ${
                          row.status === 'TERLAMBAT' ? 'bg-rose-50/50 dark:bg-rose-950/20' : ''
                        }`}
                      >
                        <td className="py-2 px-3 text-center font-bold text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3">
                          <select
                            value={row.jenis}
                            onChange={(e) => handleUpdateRow(row.id, 'jenis', e.target.value as any)}
                            className={`px-2 py-1 rounded text-2xs font-extrabold border focus:outline-none cursor-pointer ${
                              row.jenis === 'UP' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300' :
                              row.jenis === 'GUP' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300' :
                              row.jenis === 'TUP' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300' :
                              row.jenis === 'SETORAN TUP' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300' :
                              'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300'
                            }`}
                          >
                            <option value="UP">UP</option>
                            <option value="GUP">GUP</option>
                            <option value="TUP">TUP</option>
                            <option value="GUP NIHIL">GUP NIHIL</option>
                            <option value="SETORAN TUP">SETORAN TUP</option>
                            <option value="GTUP NIHIL">GTUP NIHIL</option>
                          </select>
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="date"
                            value={row.tanggal.includes('/') ? row.tanggal.split('/').reverse().join('-') : row.tanggal}
                            onChange={(e) => handleUpdateRow(row.id, 'tanggal', e.target.value)}
                            className="w-full px-2 py-1 text-2xs font-medium rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                          />
                        </td>
                        <td className="py-2 px-3 text-center">
                          <input
                            type="number"
                            value={row.selisihHari ?? ''}
                            onChange={(e) => handleUpdateRow(row.id, 'selisihHari', e.target.value ? Number(e.target.value) : null)}
                            placeholder="-"
                            className={`w-14 px-1 py-1 text-2xs font-bold text-center rounded border ${
                              (row.selisihHari || 0) > 30 
                                ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-300 font-black' 
                                : 'border-slate-300 dark:border-slate-700 bg-transparent'
                            }`}
                          />
                        </td>
                        <td className="py-2 px-3 text-right">
                          <input
                            type="number"
                            value={row.totalNilai}
                            onChange={(e) => handleUpdateRow(row.id, 'totalNilai', Number(e.target.value) || 0)}
                            className="w-28 px-1.5 py-1 text-2xs font-mono font-bold text-right rounded border border-slate-300 dark:border-slate-700 bg-transparent text-slate-800 dark:text-slate-200"
                          />
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-2xs font-semibold text-slate-600 dark:text-slate-400">
                          Rp {row.outstanding.toLocaleString('id-ID')}
                        </td>
                        <td className="py-2 px-3 text-center font-mono text-2xs">
                          {row.persenGup !== null ? `${row.persenGup.toFixed(1)}%` : '-'}
                        </td>
                        <td className="py-2 px-3 text-center">
                          {row.status === 'TEPAT WAKTU' && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-3xs font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              Tepat Waktu
                            </span>
                          )}
                          {row.status === 'TERLAMBAT' && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-3xs font-extrabold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 animate-pulse">
                              <AlertCircle className="w-2.5 h-2.5" />
                              Terlambat
                            </span>
                          )}
                          {row.status === '-' && <span className="text-slate-400">-</span>}
                        </td>
                        <td className="py-2 px-3 text-center font-mono text-2xs font-black">
                          {row.nilaiKetepatan !== null ? (
                            <span className={row.nilaiKetepatan === 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                              {row.nilaiKetepatan}
                            </span>
                          ) : '-'}
                        </td>
                        <td className="py-2 px-3 text-center font-mono text-2xs font-bold text-purple-600 dark:text-purple-400">
                          {row.gupDisebulankan !== null ? `${row.gupDisebulankan.toFixed(1)}%` : '-'}
                        </td>
                        <td className="py-2 px-3 text-center font-mono text-2xs font-bold text-amber-600 dark:text-amber-400">
                          {row.nilaiSetoranTup !== null ? `${row.nilaiSetoranTup.toFixed(1)}` : '-'}
                        </td>
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteRow(row.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                            title="Hapus baris transaksi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>

                  {/* Summary Footer */}
                  <tfoot>
                    <tr className={`border-t-2 font-black text-2xs ${
                      isDark ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-slate-100 text-slate-800 border-slate-300'
                    }`}>
                      <td colSpan={8} className="py-2.5 px-3 text-right">
                        RATA-RATA KOMPONEN KINERJA TUNAI:
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-black text-emerald-600 dark:text-emerald-400">
                        {calculatedKetepatan.toFixed(1)}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-black text-purple-600 dark:text-purple-400">
                        {calculatedGupDisebulankan.toFixed(1)}%
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-black text-amber-600 dark:text-amber-400">
                        {calculatedSetoranTup.toFixed(1)}
                      </td>
                      <td></td>
                    </tr>
                    <tr className={`border-t font-black text-xs ${
                      isDark ? 'bg-blue-950/40 text-blue-300 border-blue-900' : 'bg-blue-50 text-blue-900 border-blue-200'
                    }`}>
                      <td colSpan={8} className="py-3 px-3 text-right">
                        NILAI KINERJA TUNAI (NK-TUNAI) = (50% x KW) + (25% x PGUP) + (25% x NKSetor):
                      </td>
                      <td colSpan={4} className="py-3 px-3 text-left font-mono text-sm font-black text-blue-700 dark:text-blue-300">
                        {calculatedNkTunai.toFixed(2)} / 100
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* SECTION 2: EVALUASI PENGGUNAAN KKP (Bobot 10%) - Slide 32 & 34 */}
          <div className={`p-5 sm:p-6 rounded-2xl border ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-base sm:text-lg font-black tracking-tight">
                    2. Evaluasi Penggunaan KKP (Bobot 10% - Reward 110 Poin)
                  </h3>
                </div>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Target triwulanan dihitung dari Pagu KKP Tahunan (Pagu Bulanan x 12). Capaian target menghasilkan nilai bonus 110.
                </p>
              </div>

              {/* Toggle Kasus KKP */}
              <div className="flex items-center gap-2">
                <select
                  value={kkpCase}
                  onChange={(e) => setKkpCase(e.target.value as KkpCaseType)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold focus:outline-none cursor-pointer ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="CASE_AUTO_TABEL">Auto: Hitung dari Realisasi Triwulan</option>
                  <option value="CASE_4_CAPAI_TARGET">Case 4: Mencapai Target (Reward 110)</option>
                  <option value="CASE_3_BELUM_CAPAI_TARGET">Case 3: Ada Transaksi Belum Capai (Skor 100)</option>
                  <option value="CASE_2_BELUM_TRANSAKSI">Case 2: Belum Ada Transaksi (Konversi 100% Tunai)</option>
                  <option value="CASE_1_TIDAK_ADA_KKP">Case 1: Tidak Memiliki KKP (Bebas KKP)</option>
                </select>
              </div>
            </div>

            {hasKkp && kkpCase === 'CASE_AUTO_TABEL' && (
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className={`border-b text-2xs font-extrabold uppercase tracking-wider ${
                      isDark ? 'bg-slate-800/80 text-slate-300 border-slate-700' : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}>
                      <th className="py-2.5 px-3">Triwulan</th>
                      <th className="py-2.5 px-3">Periode</th>
                      <th className="py-2.5 px-3 text-center">Target %</th>
                      <th className="py-2.5 px-3 text-right">Target Nominal (Rp)</th>
                      <th className="py-2.5 px-3 text-right">Realisasi Kumulatif (Rp)</th>
                      <th className="py-2.5 px-3 text-center">Status Target</th>
                      <th className="py-2.5 px-3 text-center">Skor Triwulan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {calculatedKkpQuarters.map((q, idx) => (
                      <tr key={q.tw} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-slate-700 dark:text-slate-300">{q.tw}</td>
                        <td className="py-2.5 px-3 text-slate-500">{q.label}</td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-purple-600 dark:text-purple-400">
                          {q.targetPersen}%
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                          Rp {Math.round(q.nominalTarget).toLocaleString('id-ID')}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <input
                            type="number"
                            value={q.realisasiKumulatif}
                            onChange={(e) => {
                              const val = Number(e.target.value) || 0;
                              setKkpQuarters(prev => {
                                const next = [...prev];
                                next[idx].realisasiKumulatif = val;
                                return next;
                              });
                            }}
                            className="w-36 px-2 py-1 text-2xs font-mono font-bold text-right rounded border border-slate-300 dark:border-slate-700 bg-transparent text-slate-800 dark:text-slate-200"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {q.isReached ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-3xs font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Tercapai
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-3xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300">
                              Belum Capai
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-black text-sm">
                          <span className={q.isReached ? 'text-emerald-600 dark:text-emerald-400 font-extrabold' : 'text-slate-600 dark:text-slate-400'}>
                            {q.score} {q.isReached && '⭐'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className={`border-t-2 font-black text-xs ${
                      isDark ? 'bg-emerald-950/40 text-emerald-300 border-emerald-900' : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                    }`}>
                      <td colSpan={6} className="py-3 px-3 text-right">
                        NILAI KINERJA KKP (NK-KKP) RATA-RATA:
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-sm font-black text-emerald-600 dark:text-emerald-400">
                        {calculatedNkKkp !== null ? calculatedNkKkp.toFixed(2) : 'Dikonversi ke Tunai'}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: KALKULATOR CEPAT (MODE SLIDER WHAT-IF) */}
      {/* ========================================================================= */}
      {calculatorViewMode === 'QUICK_SIMULATOR' && (
        <div className={`p-6 rounded-2xl border space-y-6 ${
          isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
        }`}>
          <div>
            <h3 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
              <Sliders className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span>Simulasi Cepat What-If Pengelolaan UP &amp; TUP</span>
            </h3>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Geser slider parameter untuk melihat bagaimana perubahan ketepatan revolving atau penyerapan TUP langsung mempengaruhi nilai IKPA satker.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Slider 1: Ketepatan Waktu */}
            <div className={`p-4 rounded-xl border space-y-3 ${isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex justify-between items-center text-xs font-bold">
                <span>1. Ketepatan Waktu Pertanggungjawaban (Bobot 50% Tunai)</span>
                <span className="font-mono text-sm text-blue-600 dark:text-blue-400 font-black">{quickKetepatan}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={quickKetepatan}
                onChange={(e) => setQuickKetepatan(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <p className="text-2xs text-slate-500">Maksimal 30 hari kalender sejak SP2D terbit.</p>
            </div>

            {/* Slider 2: % GUP Disebulankan */}
            <div className={`p-4 rounded-xl border space-y-3 ${isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex justify-between items-center text-xs font-bold">
                <span>2. % GUP Disebulankan (Bobot 25% Tunai)</span>
                <span className="font-mono text-sm text-purple-600 dark:text-purple-400 font-black">{quickGupDisebulankan}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="0.5"
                value={quickGupDisebulankan}
                onChange={(e) => setQuickGupDisebulankan(Number(e.target.value))}
                className="w-full accent-purple-600 cursor-pointer"
              />
              <p className="text-2xs text-slate-500">Target revolving dalam 1 bulan kalender minimal 100% dari pagu UP.</p>
            </div>

            {/* Slider 3: Setoran Sisa TUP */}
            <div className={`p-4 rounded-xl border space-y-3 ${isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex justify-between items-center text-xs font-bold">
                <span>3. % Setoran Sisa TUP ke Kas Negara (Bobot 25% Tunai)</span>
                <span className="font-mono text-sm text-amber-600 dark:text-amber-400 font-black">
                  {((quickSetoranTup / (quickTotalTup || 1)) * 100).toFixed(1)}% disetor
                </span>
              </div>
              <input
                type="range"
                min="0"
                max={quickTotalTup}
                step={quickTotalTup / 50}
                value={quickSetoranTup}
                onChange={(e) => setQuickSetoranTup(Number(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer"
              />
              <div className="flex justify-between text-2xs text-slate-500">
                <span>Total TUP: Rp {quickTotalTup.toLocaleString('id-ID')}</span>
                <span>Nilai Kinerja: {(100 - ((quickSetoranTup / (quickTotalTup || 1)) * 100)).toFixed(1)}</span>
              </div>
            </div>

            {/* Slider 4: Skor KKP */}
            <div className={`p-4 rounded-xl border space-y-3 ${isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex justify-between items-center text-xs font-bold">
                <span>4. Skor KKP (Bobot 10% Komposit IKPA)</span>
                <span className="font-mono text-sm text-emerald-600 dark:text-emerald-400 font-black">{quickKkpSkor} Poin</span>
              </div>
              <input
                type="range"
                min="100"
                max="110"
                step="2.5"
                value={quickKkpSkor}
                onChange={(e) => setQuickKkpSkor(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <p className="text-2xs text-slate-500">Nilai 110 diperoleh jika memenuhi target triwulanan.</p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: PANDUAN STRUKTUR RUMUS RESMI (SLIDE 30-34) */}
      {/* ========================================================================= */}
      {calculatorViewMode === 'PANDUAN_RUMUS' && (
        <div className="space-y-6">
          <div className={`p-5 sm:p-6 rounded-2xl border ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
          }`}>
            <h3 className="text-base sm:text-lg font-black tracking-tight mb-2 flex items-center gap-2">
              <Info className="w-5 h-5 text-purple-600" />
              <span>Ketentuan &amp; Tata Cara Penilaian Pengelolaan UP &amp; TUP (PER-5/PB/2024)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div className={`p-4 rounded-xl border font-mono text-xs space-y-2 ${
                isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}>
                <strong className="text-purple-700 dark:text-purple-300 font-sans block text-sm font-bold">
                  Komposisi Indikator (Slide 30):
                </strong>
                <div className="p-2 rounded bg-purple-100/60 dark:bg-purple-950/40 border border-purple-300 dark:border-purple-800 font-bold text-slate-900 dark:text-slate-100">
                  IKPA UP/TUP = (90% x NK-Tunai) + (10% x NK-KKP)
                </div>
                <p className="text-2xs font-sans text-slate-600 dark:text-slate-400">
                  Jika satker tidak memiliki proporsi UP KKP, nilai akhir 100% diambil dari Nilai Kinerja Tunai.
                </p>
              </div>

              <div className={`p-4 rounded-xl border font-mono text-xs space-y-2 ${
                isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}>
                <strong className="text-blue-700 dark:text-blue-300 font-sans block text-sm font-bold">
                  Komposisi Nilai Tunai (Slide 31):
                </strong>
                <div className="p-2 rounded bg-blue-100/60 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-800 font-bold text-slate-900 dark:text-slate-100">
                  NK-Tunai = (50% x KW) + (25% x PGUP) + (25% x NKSetor)
                </div>
                <ul className="text-2xs font-sans text-slate-600 dark:text-slate-400 space-y-1">
                  <li>• <strong>KW:</strong> Ketepatan Waktu pertanggungjawaban (maksimal 30 hari).</li>
                  <li>• <strong>PGUP:</strong> % GUP Disebulankan (Target 100% sebulan).</li>
                  <li>• <strong>NKSetor:</strong> 100 - % Sisa TUP yang disetor ke kas negara.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DAFTAR SKENARIO SIMPANAN LOKAL */}
      {/* ========================================================================= */}
      {showScenarioModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className={`w-full max-w-lg rounded-2xl border p-6 space-y-4 shadow-2xl ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-amber-500" />
                <h4 className="text-base font-black">Daftar Skenario Lokal Tersimpan</h4>
              </div>
              <button
                onClick={() => setShowScenarioModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Simpan Skenario Baru */}
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2">
              <label className="text-xs font-bold block text-slate-700 dark:text-slate-300">
                Simpan Lembar Saat Ini sebagai Skenario Baru:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Contoh: Rencana GUP 25 Hari Tanpa Terlambat"
                  value={newScenarioName}
                  onChange={(e) => setNewScenarioName(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                />
                <button
                  type="button"
                  onClick={handleSaveScenarioPrompt}
                  disabled={!newScenarioName.trim()}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 cursor-pointer"
                >
                  Simpan
                </button>
              </div>
            </div>

            {/* List Skenario Tersimpan */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {savedScenariosList.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500">
                  Belum ada skenario yang disimpan di komputer ini.
                </div>
              ) : (
                savedScenariosList.map((scen) => (
                  <div
                    key={scen.id}
                    onClick={() => handleApplySavedScenario(scen)}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer hover:border-purple-500 transition-all ${
                      isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-800 dark:text-slate-100">{scen.name}</div>
                      <div className="text-2xs text-slate-500">
                        {scen.savedAt} • Skor: <strong className="text-purple-600 dark:text-purple-400">{scen.finalScore.toFixed(1)}</strong>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xs font-bold text-purple-600 dark:text-purple-400">Muat ↗</span>
                      <button
                        onClick={(e) => handleDeleteSavedScenario(scen.id, e)}
                        className="text-slate-400 hover:text-rose-500 p-1"
                        title="Hapus skenario ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
