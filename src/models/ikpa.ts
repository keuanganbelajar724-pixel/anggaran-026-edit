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

export interface RevisiDIPAInput {
  no: number;
  periode: string; // e.g. "01", "02"
  revisiKe?: number;
  tanggalRevisi?: string;
  kodeJenisRevisi?: string;
  paguDipaSebelum?: number;
  paguDipaMenjadi?: number;
  jenisRevisi14: "ya" | "tidak" | "-";
  keterangan?: string;
}

export interface DeviasiHalIIIInput {
  periode: string; // "01" .. "12"
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
}

export interface PenyerapanInput {
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
  nilaiDistribusiAkselerasi?: number;
  nilaiKontrakDini?: number;
  nilaiAkselerasi53?: number;
}

export interface PenyelesaianTagihanInput {
  no: number;
  satker?: string;
  nomorSP2D: string;
  tanggalSP2D: string;
  nomorSPM: string;
  tanggalSPM: string;
  nilaiSP2D: number;
  tanggalBAST?: string;
  tanggalBAPP?: string;
  tanggalMulaiPerhitungan: string;
  tanggalKonversiADK: string;
  jumlahHariLibur: number;
}

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

export interface DispensasiSPMInput {
  jumlahSPMTriwulanIV: number;
  jumlahDispensasiSPM: number;
}

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
}

export interface SimulationProject {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  isBaseline?: boolean;
  parentId?: string; // If branched from another scenario

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
