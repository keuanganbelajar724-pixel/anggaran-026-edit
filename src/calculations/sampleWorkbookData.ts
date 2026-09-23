import {
  SimulationProject,
  RevisiDIPAInput,
  DeviasiHalIIIInput,
  PenyerapanInput,
  BelanjaKontraktualInput,
  PenyelesaianTagihanInput,
  UPTUPTunaiInput,
  UPTUPKKPInput,
  CapaianOutputInput,
  CapaianOutputKetepatanInput,
  DEFAULT_WEIGHTS
} from '../models/ikpa';
import {
  DEFAULT_EXCEL_REVISI_ROWS,
  DEFAULT_EXCEL_DEV_HAL3_ROWS,
  DEFAULT_EXCEL_PENYERAPAN_PERIODS,
  DEFAULT_EXCEL_KONTRAKTUAL_ROWS,
  DEFAULT_EXCEL_TAGIHAN_ROWS,
  DEFAULT_EXCEL_UP_TUNAI_ROWS,
  DEFAULT_EXCEL_UP_KKP_ROWS,
  DEFAULT_EXCEL_DISPENSASI,
  DEFAULT_EXCEL_CAPUT_RO_ROWS,
  DEFAULT_EXCEL_KETEPATAN_ROWS
} from '../utils/excelReferenceDefaultData';
import { calculateIKPA } from './ikpa';
import { normalizeDateToIso } from '../utils/ikpaDateUtils';

export const WORKBOOK_EXPECTED_RESULTS = {
  revisiDIPA: { raw: 80.00, capped: 80.00, weighted: 8.00, weight: 10 },
  deviasiHalIII: { raw: 87.51, capped: 87.51, weighted: 13.13, weight: 15 },
  penyerapan: { raw: 99.93, capped: 99.93, weighted: 19.99, weight: 20 },
  belanjaKontraktual: { raw: 99.04, capped: 99.04, weighted: 9.90, weight: 10 },
  penyelesaianTagihan: { raw: 96.15, capped: 96.15, weighted: 9.62, weight: 10 },
  pengelolaanUPTUP: { raw: 94.21, capped: 94.21, weighted: 9.42, weight: 10 },
  capaianOutput: { raw: 100.00, capped: 100.00, weighted: 25.00, weight: 25 },
  dispensasiSPM: { reduction: 0.75, ratio: 3.64 },
  totalWeighted: 95.06,
  weightConversion: 1.00,
  finalScore: 94.31
};

export function getWorkbookSampleProject(): SimulationProject {
  const revisiDIPA: RevisiDIPAInput[] = DEFAULT_EXCEL_REVISI_ROWS.map((r: any) => {
    const hasRevision = Boolean(r.kodeJenisRevisi && String(r.kodeJenisRevisi).trim());
    const jenis14: "ya" | "tidak" | "-" = r.empatBelasJenis || (r.is14Jenis ? 'ya' : (hasRevision ? 'tidak' : '-'));
    return {
      no: r.id,
      periode: r.periode,
      revisiKe: hasRevision ? r.revisiKe : null,
      tanggalRevisi: hasRevision ? normalizeDateToIso(r.tanggalRevisi) : null,
      kodeJenisRevisi: r.kodeJenisRevisi || '',
      paguDipaSebelum: hasRevision ? r.paguSebelum : null,
      paguDipaMenjadi: hasRevision ? r.paguMenjadi : null,
      paguSebelum: hasRevision ? r.paguSebelum : null,
      paguMenjadi: hasRevision ? r.paguMenjadi : null,
      jenisRevisi14: jenis14,
      empatBelasJenis: jenis14,
      keterangan: r.id <= 6 ? 'Semester I' : 'Semester II'
    };
  });

  const deviasiHalIII: DeviasiHalIIIInput[] = DEFAULT_EXCEL_DEV_HAL3_ROWS.map((d: any) => ({
    periode: d.periode,
    rencana51: d.rencana51 || 0,
    rencana52: d.rencana52 || 0,
    rencana53: d.rencana53 || 0,
    rencana57: d.rencana57 || 0,
    penyerapan51: d.realisasi51 || 0,
    penyerapan52: d.realisasi52 || 0,
    penyerapan53: d.realisasi53 || 0,
    penyerapan57: d.realisasi57 || 0,
    proporsiPagu51: 38.09,
    proporsiPagu52: 51.59,
    proporsiPagu53: 9.34,
    proporsiPagu57: 0.98
  }));

  const penyerapan: PenyerapanInput[] = DEFAULT_EXCEL_PENYERAPAN_PERIODS.map((p: any) => ({
    periode: p.periode,
    pagu51: p.pagu51,
    pagu52: p.pagu52,
    pagu53: p.pagu53,
    pagu57: p.pagu57,
    blokir51: p.blokir51,
    blokir52: p.blokir52,
    blokir53: p.blokir53,
    blokir57: p.blokir57,
    target51: p.target51,
    target52: p.target52,
    target53: p.target53,
    target57: p.target57,
    realisasi51: p.realisasi51,
    realisasi52: p.realisasi52,
    realisasi53: p.realisasi53,
    realisasi57: p.realisasi57
  }));

  const belanjaKontraktual: BelanjaKontraktualInput[] = DEFAULT_EXCEL_KONTRAKTUAL_ROWS.map((k: any) => ({
    no: k.id,
    kodeSatker: k.kodeSatker,
    namaSatker: k.namaSatker,
    nomorKontrak: k.noKontrak,
    jenisBelanja: k.jenisBelanja === '53' ? '53' : (k.jenisBelanja === '52' ? '52' : '51'),
    nilaiKontrak: k.nilaiKontrak,
    tanggalKontrak: normalizeDateToIso(k.tanggalKontrak),
    tanggalMasuk: normalizeDateToIso(k.tanggalMasuk),
    tanggalPenyelesaian: normalizeDateToIso(k.tanggalPenyelesaian),
    isEarlyContract: k.nilaiKontrakDini >= 110,
    nilaiDistribusiAkselerasi: k.nilaiDistribusiAkselerasi,
    nilaiKontrakDini: k.nilaiKontrakDini,
    nilaiAkselerasi53: k.nilaiAkselerasi53
  }));

  const penyelesaianTagihan: PenyelesaianTagihanInput[] = DEFAULT_EXCEL_TAGIHAN_ROWS.map((t: any) => ({
    no: t.id || t.no || 1,
    identitasTagihan: t.identitasTagihan || `TAG-${t.noSp2d || t.id}`,
    keterangan: t.keterangan || '-',
    jenisTagihan: t.jenisTagihan || 'Kontraktual',
    nomorSPP: t.nomorSPP || t.noSpp || '-',
    tanggalSPP: normalizeDateToIso(t.tanggalSpp || t.tanggalSpm),
    hariLibur: t.jumlahHariLibur ?? 0,
    jumlahHariEfektif: t.jumlahHariEfektif ?? null,
    status: (t.status || 'TEPAT') as any,
    keteranganHasil: t.keteranganHasil || 'Tepat Waktu',
    tanggalMulai: normalizeDateToIso(t.tanggalMulaiPerhitungan),
    tanggalKonversi: normalizeDateToIso(t.tanggalKonversiAdk),
    selisihHari: null,
    satker: t.satker,
    nomorSP2D: t.noSp2d,
    tanggalSP2D: normalizeDateToIso(t.tanggalSp2d),
    nomorSPM: t.noSpm,
    tanggalSPM: normalizeDateToIso(t.tanggalSpm),
    nilaiSP2D: t.nilaiSp2d,
    tanggalBAST: normalizeDateToIso(t.tanggalBast),
    tanggalBAPP: normalizeDateToIso(t.tanggalBapp),
    tanggalMulaiPerhitungan: normalizeDateToIso(t.tanggalMulaiPerhitungan),
    tanggalKonversiADK: normalizeDateToIso(t.tanggalKonversiAdk),
    jumlahHariLibur: t.jumlahHariLibur
  }));

  const upTUPTunai: UPTUPTunaiInput[] = DEFAULT_EXCEL_UP_TUNAI_ROWS.map((u: any) => ({
    no: u.id,
    kodeSatker: u.kodeSatker,
    namaSatker: u.namaSatker,
    sumberDana: u.sumberDana,
    jenis: u.jenis,
    tanggal: normalizeDateToIso(u.tanggal),
    selisihHariKalender: u.selisihHariKalender,
    totalGUP: u.totalGu,
    totalOutstandingUP: u.totalOutstandingUp,
    totalHariSebulan: u.totalHariSebulan,
    totalTUP: u.totalTup,
    totalSetoranTUP: u.totalSetoranTup,
    status: u.status,
    nilaiKetepatanWaktu: u.nilaiKetepatanWaktu,
    nilaiPersentaseGupDisebulankan: u.nilaiPersentaseGupDisebulankan,
    nilaiSetoranTup: u.nilaiSetoranTup
  }));

  const upTUPKKP: UPTUPKKPInput[] = DEFAULT_EXCEL_UP_KKP_ROWS.map((kp: any) => ({
    periode: kp.periode,
    upKKPPerBulan: kp.upKkpPerBulan,
    penggunaanKKP: kp.penggunaanKkp
  }));

  const capaianOutput: CapaianOutputInput[] = DEFAULT_EXCEL_CAPUT_RO_ROWS.map((c: any) => ({
    no: c.id,
    satker: c.satker,
    namaSatker: c.namaSatker,
    kppn: c.kppn,
    bulan: c.bulan,
    program: c.program,
    kegiatan: c.kegiatan,
    kro: c.kro,
    ro: c.ro,
    uraianRO: c.uraianRo,
    target: c.target,
    satuan: c.satuan,
    realisasiRO: c.realisasiRo,
    persenProgress: c.persenProgress,
    statusKonfirmasi: c.statusKonfirmasi === 'terkonfirmasi' ? 'terkonfirmasi' : 'tidak terkonfirmasi',
    targetPCRO: c.targetPcro
  }));

  const capaianOutputKetepatan: CapaianOutputKetepatanInput[] = DEFAULT_EXCEL_KETEPATAN_ROWS.map((kt: any) => ({
    no: kt.no,
    satker: kt.satker,
    namaSatker: kt.namaSatker,
    bulan: kt.bulan,
    ketepatan: kt.ketepatan === 'Tepat Waktu' ? 'Tepat Waktu' : 'Tidak Tepat Waktu'
  }));

  const proj: SimulationProject = {
    id: 'sample_workbook_2026',
    name: 'Simulasi IKPA 2026 (Workbook Reference)',
    description: 'Data referensi resmi dari Kalkulator Perhitungan IKPA 2026.xlsx',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isBaseline: true,
    calculationVersion: 'IKPA-2026-EXCEL-COMPATIBLE-v1',
    calculationMode: 'excel_compatible',
    metadata: {
      tahunAnggaran: 2026,
      kodeKementerian: '015',
      namaKementerian: 'KEMENTERIAN KEUANGAN',
      kodeSatker: '411792',
      namaSatker: 'KPPN SEMARANG I (Contoh Workbook)',
      kodeKPPN: '032',
      periodeCutoff: 12
    },
    weights: { ...DEFAULT_WEIGHTS },
    activeIndicators: {
      revisiDIPA: true,
      deviasiHalIII: true,
      penyerapan: true,
      belanjaKontraktual: true,
      penyelesaianTagihan: true,
      pengelolaanUPTUP: true,
      capaianOutput: true
    },
    revisiDIPA,
    deviasiHalIII,
    penyerapan,
    belanjaKontraktual,
    penyelesaianTagihan,
    upTUPTunai,
    upTUPKKP,
    dispensasiSPM: {
      jumlahSPMTriwulanIV: DEFAULT_EXCEL_DISPENSASI.jumlahSpmTw4,
      jumlahDispensasiSPM: DEFAULT_EXCEL_DISPENSASI.jumlahDispensasiSpm
    },
    capaianOutput,
    capaianOutputKetepatan
  };

  proj.output = calculateIKPA(proj);
  return proj;
}
