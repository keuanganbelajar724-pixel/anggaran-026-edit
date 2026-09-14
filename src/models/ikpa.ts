export interface IKPAWeights {
  revisiDIPA: number;
  deviasiHalIII: number;
  penyerapan: number;
  belanjaKontraktual: number;
  penyelesaianTagihan: number;
  pengelolaanUPTUP: number;
  capaianOutput: number;
}

export const DEFAULT_WEIGHTS: IKPAWeights = {
  revisiDIPA: 10,
  deviasiHalIII: 15,
  penyerapan: 20,
  belanjaKontraktual: 10,
  penyelesaianTagihan: 10,
  pengelolaanUPTUP: 10,
  capaianOutput: 25
};

export interface CalculationDetail {
  step: string;
  formulaHuman: string;
  formulaTechnical?: string;
  excelCell?: string;
  value: string | number;
  note?: string;
}

export interface IndicatorResult {
  rawValue: number;
  cappedValue: number;
  weight: number;
  weightedValue: number;
  isActive: boolean;
  details: CalculationDetail[];
  metadata?: Record<string, any>;
}

export interface IKPAResult {
  indicators: {
    revisiDIPA: IndicatorResult;
    deviasiHalIII: IndicatorResult;
    penyerapan: IndicatorResult;
    belanjaKontraktual: IndicatorResult;
    penyelesaianTagihan: IndicatorResult;
    pengelolaanUPTUP: IndicatorResult;
    capaianOutput: IndicatorResult;
  };
  total: number;
  totalWeighted: number;
  weightConversion: number;
  dispensasiReduction: number;
  dispensasiRatio: number;
  finalScore: number;
  predikat: string;
}

export interface RevisionDipaRow {
  no: number;
  periode: string;
  revisiKe: number | null;
  tanggalRevisi: string | null;
  kodeJenisRevisi: string;
  paguSebelum: number | null;
  paguMenjadi: number | null;
  empatBelasJenis: "ya" | "tidak" | "-";
  diperhitungkan: "diperhitungkan" | "tidak diperhitungkan";
  jumlahDiperhitungkan: number;
  keterangan: string;
  nilaiIndikator: number;
  nilaiIKPA: number;
}

export interface RevisiDIPAInput {
  no: number;
  periode: string; // e.g. "01", "02"
  revisiKe?: number | null;
  tanggalRevisi?: string | null;
  kodeJenisRevisi?: string;
  paguDipaSebelum?: number | null;
  paguDipaMenjadi?: number | null;
  jenisRevisi14: "ya" | "tidak" | "-";
  keterangan?: string;
  // Aliases for exact RevisionDipaRow compatibility
  paguSebelum?: number | null;
  paguMenjadi?: number | null;
  empatBelasJenis?: "ya" | "tidak" | "-";
  diperhitungkan?: "diperhitungkan" | "tidak diperhitungkan";
  jumlahDiperhitungkan?: number;
  nilaiIndikator?: number;
  nilaiIKPA?: number;
}

export interface DeviasiHal3Row {
  periode: string; // "01" .. "12"

  pagu51?: number;
  pagu52?: number;
  pagu53?: number;
  pagu57?: number;

  rencana51: number;
  rencana52: number;
  rencana53: number;
  rencana57: number;

  penyerapan51: number;
  penyerapan52: number;
  penyerapan53: number;
  penyerapan57: number;

  deviasi51: number;
  deviasi52: number;
  deviasi53: number;
  deviasi57: number;

  persenDeviasi51: number;
  persenDeviasi52: number;
  persenDeviasi53: number;
  persenDeviasi57: number;

  proporsi51: number;
  proporsi52: number;
  proporsi53: number;
  proporsi57: number;

  deviasiTertimbang51: number;
  deviasiTertimbang52: number;
  deviasiTertimbang53: number;
  deviasiTertimbang57: number;

  // Dispensasi & Override Deviasi Tertimbang
  overrideDeviasiTertimbang51?: number | null;
  overrideDeviasiTertimbang52?: number | null;
  overrideDeviasiTertimbang53?: number | null;
  overrideDeviasiTertimbang57?: number | null;
  isDispensasi51?: boolean;
  isDispensasi52?: boolean;
  isDispensasi53?: boolean;
  isDispensasi57?: boolean;
  autoDeviasiTertimbang51?: number;
  autoDeviasiTertimbang52?: number;
  autoDeviasiTertimbang53?: number;
  autoDeviasiTertimbang57?: number;

  deviasiSeluruhJenisBelanja: number;
  rataRataDeviasiKumulatif: number;
  nilaiIKPA: number;
  overrideNilaiIKPA?: number | null;
  isDispensasiNilaiIKPA?: boolean;
  autoNilaiIKPA?: number;
}

export interface DeviasiHalIIIInput extends Partial<DeviasiHal3Row> {
  periode: string; // "01" .. "12"
  pagu51?: number;
  pagu52?: number;
  pagu53?: number;
  pagu57?: number;
  rencana51: number;
  rencana52: number;
  rencana53: number;
  rencana57: number;
  penyerapan51: number;
  penyerapan52: number;
  penyerapan53: number;
  penyerapan57: number;
  proporsiPagu51?: number;
  proporsiPagu52?: number;
  proporsiPagu53?: number;
  proporsiPagu57?: number;
  overrideDeviasiTertimbang51?: number | null;
  overrideDeviasiTertimbang52?: number | null;
  overrideDeviasiTertimbang53?: number | null;
  overrideDeviasiTertimbang57?: number | null;
}

export interface PenyerapanPeriod {
  periode: string;

  pagu51: number;
  pagu52: number;
  pagu53: number;
  pagu57: number;

  blokir51: number;
  blokir52: number;
  blokir53: number;
  blokir57: number;

  realisasi51: number;
  realisasi52: number;
  realisasi53: number;
  realisasi57: number;

  paguNetto51: number;
  paguNetto52: number;
  paguNetto53: number;
  paguNetto57: number;

  target51: number;
  target52: number;
  target53: number;
  target57: number;

  targetNominal51: number;
  targetNominal52: number;
  targetNominal53: number;
  targetNominal57: number;

  achievement51: number;
  achievement52: number;
  achievement53: number;
  achievement57: number;

  proportion51: number;
  proportion52: number;
  proportion53: number;
  proportion57: number;

  nkpa51: number;
  nkpa52: number;
  nkpa53: number;
  nkpa57: number;

  nilaiPeriode: number;
  nilaiIndikator: number;
}

export interface PenyerapanInput extends Partial<PenyerapanPeriod> {
  periode: string; // "01" .. "12"
  pagu51: number;
  pagu52: number;
  pagu53: number;
  pagu57: number;
  blokir51: number;
  blokir52: number;
  blokir53: number;
  blokir57: number;
  target51?: number;
  target52?: number;
  target53?: number;
  target57?: number;
  realisasi51: number;
  realisasi52: number;
  realisasi53: number;
  realisasi57: number;
}

export interface BelanjaKontraktualInput {
  no: number;
  kodeSatker?: string;
  namaSatker?: string;
  kodeKPPN?: string;
  nomorKontrak?: string;
  jenisBelanja: "51" | "52" | "53" | "57";
  nilaiKontrak: number;
  tanggalKontrak: string;
  tanggalMasuk: string;
  tanggalPenyelesaian: string;
  // Optionals / manual override if supplied
  quarterKontrak?: "I" | "II" | "III" | "IV";
  semesterKontrak?: "I" | "II";
  isEarlyContract?: boolean; // >= 110
  nilaiDistribusiAkselerasi?: number | null;
  nilaiKontrakDini?: number | null;
  nilaiAkselerasi53?: number | null;
  overrideNilaiIKPA?: number | null;
  isDispensasi?: boolean;
  keteranganDispensasi?: string;
}

export interface PenyelesaianTagihanRow {
  no: number;
  identitasTagihan: string;
  keterangan: string;
  jenisTagihan: string;
  nomorSPP: string;
  tanggalSPP: string | null;
  tanggalTagihan: string | null;
  tanggalDokumenPendukung: string | null;
  tanggalPenyampaian: string | null;
  tanggalMulai: string | null;
  tanggalKonversi: string | null;
  selisihHari: number | null;
  hariLibur: number;
  jumlahHariEfektif: number | null;
  status: "TEPAT" | "TERLAMBAT" | "BELUM LENGKAP";
  keteranganHasil: string;
  // Compatibility & Legacy fields
  satker?: string;
  nomorSPM?: string;
  tanggalSPM?: string | null;
  nomorSP2D?: string;
  tanggalSP2D?: string | null;
  nilaiSP2D?: number;
  tanggalBAST?: string | null;
  tanggalBAPP?: string | null;
  tanggalMulaiPerhitungan?: string | null;
  tanggalKonversiADK?: string | null;
  jumlahHariLibur?: number;
  jumlahHariFinal?: number | null;
}

export type PenyelesaianTagihanInput = PenyelesaianTagihanRow;

export interface UPTUPTunaiInput {
  no: number;
  kodeSatker?: string;
  namaSatker?: string;
  kodeKPPN?: string;
  sumberDana: string;
  jenis: "UP" | "GUP" | "GUP NIHIL" | "TUP" | "SETORAN TUP" | "GTUP NIHIL";
  tanggal: string;
  selisihHariKalender?: number;
  totalGUP: number;
  totalOutstandingUP: number;
  totalHariSebulan?: number;
  totalTUP: number;
  totalSetoranTUP: number;
  status?: string; // "TEPAT WAKTU" | "-" | "TERLAMBAT"
  nilaiKetepatanWaktu?: number | null;
  nilaiPersentaseGupDisebulankan?: number | null;
  nilaiSetoranTup?: number | null;
}

export interface UPTUPKKPInput {
  periode: string; // "01" .. "12"
  kodeSatker?: string;
  namaSatker?: string;
  kodeKPPN?: string;
  upKKPPerBulan: number;
  penggunaanKKP: number;
}

export interface DispensasiSPM {
  jumlahSPMTriwulanIV: number;
  jumlahDispensasiSPM: number;
  rasio?: number;
  pengurangNilai?: number;
}

export type DispensasiSPMInput = DispensasiSPM;

export interface CapaianOutputInput {
  no: number;
  satker?: string;
  namaSatker?: string;
  kppn?: string;
  bulan: number; // 1 .. 12
  program?: string;
  kegiatan?: string;
  kro?: string;
  ro?: string;
  uraianRO?: string;
  target: number;
  satuan?: string;
  realisasiRO: number;
  persenProgress: number; // 0 .. 100
  statusKonfirmasi: "terkonfirmasi" | "tidak terkonfirmasi";
  targetPCRO: number;
}

export interface CapaianOutputKetepatanInput {
  no: number;
  satker?: string;
  namaSatker?: string;
  bulan: string; // "01" .. "12"
  ketepatan: "Tepat Waktu" | "Tidak Tepat Waktu";
  tanggalPelaporan?: string;
}

export interface ProjectMetadata {
  tahunAnggaran: number;
  kodeKementerian: string;
  namaKementerian: string;
  kodeSatker: string;
  namaSatker: string;
  kodeKPPN: string;
  periodeCutoff: number; // 1 .. 12
  ambangBatasDeviasiHal3?: number; // Ambang batas maksimal (normalnya 5.0%)
}

export interface SimulationProject {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  isBaseline?: boolean;
  parentId?: string; // If branched from another scenario
  ambangBatasDeviasiHal3?: number; // Ambang batas maksimal (normalnya 5.0%)
  overrideNilaiKontraktual?: number | null; // Dispensasi Nilai IKPA Belanja Kontraktual
  isNormalisasiBobotKontraktual?: boolean; // Normalisasi bobot jika komponen tanpa objek (Standar My InTress, default true)
  keteranganDispensasiKontraktual?: string;
  metodeKalkulasiKontraktual?: 'omspan' | 'excel'; // 'omspan' (Standar Rasio Satker PER-5, default) atau 'excel' (Rata-rata Baris Kolom N)

  calculationVersion: string; // "IKPA-2026-EXCEL-COMPATIBLE-v1"
  calculationMode: "excel_compatible" | "validation";

  metadata: ProjectMetadata;

  weights: IKPAWeights;
  activeIndicators: {
    revisiDIPA: boolean;
    deviasiHalIII: boolean;
    penyerapan: boolean;
    belanjaKontraktual: boolean;
    penyelesaianTagihan: boolean;
    pengelolaanUPTUP: boolean;
    capaianOutput: boolean;
  };

  revisiDIPA: RevisiDIPAInput[];
  deviasiHalIII: DeviasiHalIIIInput[];
  penyerapan: PenyerapanInput[];
  belanjaKontraktual: BelanjaKontraktualInput[];
  penyelesaianTagihan: PenyelesaianTagihanInput[];
  upTUPTunai: UPTUPTunaiInput[];
  upTUPKKP: UPTUPKKPInput[];
  dispensasiSPM: DispensasiSPMInput;
  capaianOutput: CapaianOutputInput[];
  capaianOutputKetepatan: CapaianOutputKetepatanInput[];

  output?: IKPAResult;
}
