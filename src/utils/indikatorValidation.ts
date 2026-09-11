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
  DispensasiSPMInput
} from '../models/ikpa';

export interface ValidationIssue {
  id: string;
  indicatorKey: string;
  rowIdentifier: string;
  fieldName: string;
  fieldLabel: string;
  currentValue: any;
  severity: 'error' | 'warning';
  message: string;
  suggestion: string;
}

export interface ValidationSummary {
  indicatorKey: string;
  hasIssues: boolean;
  errorCount: number;
  warningCount: number;
  totalIssues: number;
  issues: ValidationIssue[];
}

/**
 * 1. Validasi Revisi DIPA
 */
export function validateRevisiDIPA(inputs?: RevisiDIPAInput[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!inputs || inputs.length === 0) return issues;

  inputs.forEach((row, idx) => {
    const rowId = `Periode ${row.periode || String(idx + 1).padStart(2, '0')}`;
    const paguSeb = row.paguDipaSebelum ?? row.paguSebelum;
    const paguMen = row.paguDipaMenjadi ?? row.paguMenjadi;
    const revKe = row.revisiKe;

    if (revKe !== null && revKe !== undefined && Number(revKe) < 0) {
      issues.push({
        id: `rev-ke-neg-${idx}`,
        indicatorKey: 'revisiDIPA',
        rowIdentifier: rowId,
        fieldName: 'revisiKe',
        fieldLabel: 'Revisi Ke',
        currentValue: revKe,
        severity: 'error',
        message: 'Nomor Revisi Ke tidak boleh bernilai negatif.',
        suggestion: 'Gunakan angka bulat positif (1, 2, 3, dst).'
      });
    }

    if (paguSeb !== null && paguSeb !== undefined && Number(paguSeb) < 0) {
      issues.push({
        id: `pagu-seb-neg-${idx}`,
        indicatorKey: 'revisiDIPA',
        rowIdentifier: rowId,
        fieldName: 'paguDipaSebelum',
        fieldLabel: 'Pagu Sebelum',
        currentValue: paguSeb,
        severity: 'error',
        message: 'Nilai Pagu Sebelum tidak boleh bernilai negatif.',
        suggestion: 'Pastikan pagu bernilai positif atau Rp 0.'
      });
    }

    if (paguMen !== null && paguMen !== undefined && Number(paguMen) < 0) {
      issues.push({
        id: `pagu-men-neg-${idx}`,
        indicatorKey: 'revisiDIPA',
        rowIdentifier: rowId,
        fieldName: 'paguDipaMenjadi',
        fieldLabel: 'Pagu Menjadi',
        currentValue: paguMen,
        severity: 'error',
        message: 'Nilai Pagu Menjadi tidak boleh bernilai negatif.',
        suggestion: 'Pastikan pagu bernilai positif atau Rp 0.'
      });
    }

    // Peringatan jika 14 jenis 'ya' tapi pagu sebelum !== pagu menjadi
    const is14 = row.jenisRevisi14 === 'ya' || row.empatBelasJenis === 'ya';
    if (is14 && paguSeb !== null && paguMen !== null && Number(paguSeb) !== Number(paguMen) && (Number(paguSeb) > 0 || Number(paguMen) > 0)) {
      issues.push({
        id: `pagu-berubah-14-${idx}`,
        indicatorKey: 'revisiDIPA',
        rowIdentifier: rowId,
        fieldName: 'jenisRevisi14',
        fieldLabel: '14 Jenis Revisi',
        currentValue: 'ya (Pagu Berubah)',
        severity: 'warning',
        message: 'Revisi ditandai 14 Jenis Revisi ("ya"), tetapi Pagu Sebelum dan Menjadi berbeda (Pagu Berubah).',
        suggestion: 'Sesuai juknis PER-5/PB/2024, revisi 14 jenis hanya diakui jika Pagu Tetap (Pagu Sebelum = Pagu Menjadi).'
      });
    }

    // Baris terisi sebagian (ada tanggal tapi tidak ada pagu)
    if (row.tanggalRevisi && (paguSeb === null || paguSeb === undefined || paguMen === null || paguMen === undefined)) {
      issues.push({
        id: `pagu-incomplete-${idx}`,
        indicatorKey: 'revisiDIPA',
        rowIdentifier: rowId,
        fieldName: 'paguDipaMenjadi',
        fieldLabel: 'Pagu Revisi',
        currentValue: 'Kosong',
        severity: 'warning',
        message: 'Tanggal revisi terisi tetapi Pagu Sebelum / Menjadi belum diisi.',
        suggestion: 'Lengkapi nilai pagu sebelum dan sesudah revisi agar formula bekerja tepat.'
      });
    }
  });

  return issues;
}

/**
 * 2. Validasi Deviasi Halaman III DIPA
 */
export function validateDeviasiHalIII(inputs?: DeviasiHalIIIInput[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!inputs || inputs.length === 0) return issues;

  inputs.forEach((row, idx) => {
    const rowId = `Periode ${row.periode || String(idx + 1).padStart(2, '0')}`;
    const belanjas = ['51', '52', '53', '57'] as const;

    belanjas.forEach(b => {
      const renc = Number((row as any)[`rencana${b}`]) || 0;
      const pen = Number((row as any)[`penyerapan${b}`] ?? (row as any)[`realisasi${b}`]) || 0;

      if (renc < 0) {
        issues.push({
          id: `dev-renc-neg-${b}-${idx}`,
          indicatorKey: 'deviasiHalIII',
          rowIdentifier: rowId,
          fieldName: `rencana${b}`,
          fieldLabel: `RPD Belanja ${b}`,
          currentValue: renc,
          severity: 'error',
          message: `Rencana Penarikan Dana (RPD) Belanja ${b} tidak boleh negatif.`,
          suggestion: 'Koreksi nilai RPD menjadi angka positif atau 0.'
        });
      }

      if (pen < 0) {
        issues.push({
          id: `dev-pen-neg-${b}-${idx}`,
          indicatorKey: 'deviasiHalIII',
          rowIdentifier: rowId,
          fieldName: `penyerapan${b}`,
          fieldLabel: `Penyerapan Belanja ${b}`,
          currentValue: pen,
          severity: 'error',
          message: `Penyerapan/Realisasi Belanja ${b} tidak boleh bernilai negatif.`,
          suggestion: 'Pastikan angka penyerapan bernilai positif atau 0.'
        });
      }

      // Penyerapan ada tetapi rencana = 0
      if (pen > 0 && renc === 0) {
        issues.push({
          id: `dev-no-plan-${b}-${idx}`,
          indicatorKey: 'deviasiHalIII',
          rowIdentifier: rowId,
          fieldName: `rencana${b}`,
          fieldLabel: `RPD Belanja ${b}`,
          currentValue: `RPD: Rp 0, Realisasi: Rp ${pen.toLocaleString('id-ID')}`,
          severity: 'warning',
          message: `Terdapat penyerapan Belanja ${b} padahal RPD di Halaman III bernilai Rp 0. Hal ini menyebabkan deviasi 100%.`,
          suggestion: 'Periksa apakah ada rencana penarikan dana pada Halaman III DIPA untuk jenis belanja ini.'
        });
      }
    });
  });

  return issues;
}

/**
 * 3. Validasi Penyerapan Anggaran
 */
export function validatePenyerapan(inputs?: PenyerapanInput[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!inputs || inputs.length === 0) return issues;

  inputs.forEach((row, idx) => {
    const rowId = `Periode ${row.periode || String(idx + 1).padStart(2, '0')}`;
    const belanjas = ['51', '52', '53', '57'] as const;

    belanjas.forEach(b => {
      const pagu = Number((row as any)[`pagu${b}`]) || 0;
      const blokir = Number((row as any)[`blokir${b}`]) || 0;
      const realisasi = Number((row as any)[`realisasi${b}`]) || 0;
      const paguNetto = Math.max(0, pagu - blokir);

      if (pagu < 0) {
        issues.push({
          id: `peny-pagu-neg-${b}-${idx}`,
          indicatorKey: 'penyerapan',
          rowIdentifier: rowId,
          fieldName: `pagu${b}`,
          fieldLabel: `Pagu Belanja ${b}`,
          currentValue: pagu,
          severity: 'error',
          message: `Pagu Belanja ${b} tidak boleh negatif.`,
          suggestion: 'Koreksi nilai pagu DIPA menjadi positif.'
        });
      }

      if (blokir < 0) {
        issues.push({
          id: `peny-blokir-neg-${b}-${idx}`,
          indicatorKey: 'penyerapan',
          rowIdentifier: rowId,
          fieldName: `blokir${b}`,
          fieldLabel: `Blokir Belanja ${b}`,
          currentValue: blokir,
          severity: 'error',
          message: `Nilai Blokir Belanja ${b} tidak boleh bernilai negatif.`,
          suggestion: 'Isi angka blokir atau 0 jika tidak ada blokir anggaran.'
        });
      }

      if (blokir > pagu && pagu > 0) {
        issues.push({
          id: `peny-blokir-exceed-${b}-${idx}`,
          indicatorKey: 'penyerapan',
          rowIdentifier: rowId,
          fieldName: `blokir${b}`,
          fieldLabel: `Blokir Belanja ${b}`,
          currentValue: `Blokir: Rp ${blokir.toLocaleString('id-ID')} > Pagu: Rp ${pagu.toLocaleString('id-ID')}`,
          severity: 'error',
          message: `Nilai blokir melebihi total Pagu Belanja ${b}.`,
          suggestion: 'Blokir tidak boleh lebih besar dari Pagu DIPA.'
        });
      }

      if (realisasi < 0) {
        issues.push({
          id: `peny-real-neg-${b}-${idx}`,
          indicatorKey: 'penyerapan',
          rowIdentifier: rowId,
          fieldName: `realisasi${b}`,
          fieldLabel: `Realisasi Belanja ${b}`,
          currentValue: realisasi,
          severity: 'error',
          message: `Realisasi Belanja ${b} tidak boleh negatif.`,
          suggestion: 'Pastikan nilai penyerapan kumulatif bernilai positif.'
        });
      }

      if (realisasi > paguNetto && paguNetto > 0) {
        issues.push({
          id: `peny-real-exceed-${b}-${idx}`,
          indicatorKey: 'penyerapan',
          rowIdentifier: rowId,
          fieldName: `realisasi${b}`,
          fieldLabel: `Realisasi Belanja ${b}`,
          currentValue: `Realisasi: Rp ${realisasi.toLocaleString('id-ID')} > Pagu Netto: Rp ${paguNetto.toLocaleString('id-ID')}`,
          severity: 'error',
          message: `Realisasi Belanja ${b} melebihi Pagu Netto (Pagu - Blokir).`,
          suggestion: 'Realisasi anggaran secara legal tidak boleh melampaui sisa pagu netto yang dapat digunakan.'
        });
      }

      if (realisasi > 0 && pagu === 0) {
        issues.push({
          id: `peny-real-no-pagu-${b}-${idx}`,
          indicatorKey: 'penyerapan',
          rowIdentifier: rowId,
          fieldName: `pagu${b}`,
          fieldLabel: `Pagu Belanja ${b}`,
          currentValue: `Realisasi Rp ${realisasi.toLocaleString('id-ID')} pada Pagu Rp 0`,
          severity: 'warning',
          message: `Ada realisasi Belanja ${b} tetapi Pagu DIPA terdaftar Rp 0.`,
          suggestion: 'Periksa kembali apakah ada revisi DIPA penambahan pagu yang belum dicatat.'
        });
      }
    });
  });

  return issues;
}

/**
 * 4. Validasi Belanja Kontraktual
 */
export function validateBelanjaKontraktual(inputs?: BelanjaKontraktualInput[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!inputs || inputs.length === 0) return issues;

  inputs.forEach((k, idx) => {
    const rowId = `Kontrak #${k.no || idx + 1} (${k.nomorKontrak || 'Tanpa Nomor'})`;
    const nilai = Number(k.nilaiKontrak) || 0;

    if (nilai <= 0) {
      issues.push({
        id: `ktr-nilai-zero-${idx}`,
        indicatorKey: 'belanjaKontraktual',
        rowIdentifier: rowId,
        fieldName: 'nilaiKontrak',
        fieldLabel: 'Nilai Kontrak',
        currentValue: nilai,
        severity: 'error',
        message: 'Nilai kontrak harus lebih besar dari Rp 0.',
        suggestion: 'Masukkan nominal kontrak belanja modal/barang yang sah.'
      });
    }

    if (!k.nomorKontrak || k.nomorKontrak.trim() === '') {
      issues.push({
        id: `ktr-no-empty-${idx}`,
        indicatorKey: 'belanjaKontraktual',
        rowIdentifier: rowId,
        fieldName: 'nomorKontrak',
        fieldLabel: 'Nomor Kontrak',
        currentValue: 'Kosong',
        severity: 'warning',
        message: 'Nomor kontrak belum diisi.',
        suggestion: 'Isi nomor SPK / Kontrak agar mempermudah rekonsiliasi SP2D.'
      });
    }

    // Validasi kronologi tanggal
    if (k.tanggalKontrak && k.tanggalMasuk) {
      const tglKtr = new Date(k.tanggalKontrak);
      const tglMsk = new Date(k.tanggalMasuk);
      if (!isNaN(tglKtr.getTime()) && !isNaN(tglMsk.getTime()) && tglMsk < tglKtr) {
        issues.push({
          id: `ktr-tgl-masuk-early-${idx}`,
          indicatorKey: 'belanjaKontraktual',
          rowIdentifier: rowId,
          fieldName: 'tanggalMasuk',
          fieldLabel: 'Tanggal Masuk KPPN',
          currentValue: `${k.tanggalMasuk} < ${k.tanggalKontrak}`,
          severity: 'error',
          message: 'Tanggal pendaftaran kontrak ke KPPN lebih awal dari tanggal penandatanganan kontrak.',
          suggestion: 'Pastikan tanggal masuk KPPN sama dengan atau setelah tanggal kontrak ditandatangani.'
        });
      }
    }

    if (k.tanggalKontrak && k.tanggalPenyelesaian) {
      const tglKtr = new Date(k.tanggalKontrak);
      const tglSls = new Date(k.tanggalPenyelesaian);
      if (!isNaN(tglKtr.getTime()) && !isNaN(tglSls.getTime()) && tglSls < tglKtr) {
        issues.push({
          id: `ktr-tgl-selesai-early-${idx}`,
          indicatorKey: 'belanjaKontraktual',
          rowIdentifier: rowId,
          fieldName: 'tanggalPenyelesaian',
          fieldLabel: 'Tanggal Selesai',
          currentValue: `${k.tanggalPenyelesaian} < ${k.tanggalKontrak}`,
          severity: 'error',
          message: 'Tanggal penyelesaian pekerjaan lebih awal dari tanggal kontrak dimulai.',
          suggestion: 'Periksa kembali jangka waktu pelaksanaan pekerjaan pada BAST / Kontrak.'
        });
      }
    }
  });

  return issues;
}

/**
 * 5. Validasi Penyelesaian Tagihan
 */
export function validatePenyelesaianTagihan(inputs?: PenyelesaianTagihanInput[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!inputs || inputs.length === 0) return issues;

  inputs.forEach((t, idx) => {
    const rowId = `Tagihan #${t.no || idx + 1} (${t.nomorSPM || t.identitasTagihan || 'Tanpa ID'})`;
    const tglBast = t.tanggalBAST || t.tanggalTagihan || t.tanggalMulai;
    const tglSpm = t.tanggalSPM || t.tanggalPenyampaian;

    if (tglBast && tglSpm) {
      const dBast = new Date(tglBast);
      const dSpm = new Date(tglSpm);
      if (!isNaN(dBast.getTime()) && !isNaN(dSpm.getTime()) && dSpm < dBast) {
        issues.push({
          id: `tagih-tgl-terbalik-${idx}`,
          indicatorKey: 'penyelesaianTagihan',
          rowIdentifier: rowId,
          fieldName: 'tanggalSPM',
          fieldLabel: 'Tanggal SPM / Penyampaian',
          currentValue: `${tglSpm} < ${tglBast}`,
          severity: 'error',
          message: 'Tanggal SPM mendahului tanggal BAST / penerimaan tagihan.',
          suggestion: 'SPM baru dapat diterbitkan setelah BAST/dokumen pendukung disahkan.'
        });
      }
    }

    const selisih = t.jumlahHariEfektif ?? t.selisihHari;
    if (selisih !== null && selisih !== undefined && selisih < 0) {
      issues.push({
        id: `tagih-selisih-neg-${idx}`,
        indicatorKey: 'penyelesaianTagihan',
        rowIdentifier: rowId,
        fieldName: 'selisihHari',
        fieldLabel: 'Selisih Hari',
        currentValue: selisih,
        severity: 'error',
        message: 'Jumlah hari kerja penyelesaian tagihan bernilai negatif.',
        suggestion: 'Periksa tanggal BAST dan tanggal penyampaian SPM.'
      });
    }

    if (selisih !== null && selisih !== undefined && selisih > 90) {
      issues.push({
        id: `tagih-selisih-extreme-${idx}`,
        indicatorKey: 'penyelesaianTagihan',
        rowIdentifier: rowId,
        fieldName: 'selisihHari',
        fieldLabel: 'Selisih Hari Kerja',
        currentValue: `${selisih} hari`,
        severity: 'warning',
        message: 'Selisih hari sangat panjang (> 90 hari kerja), mohon verifikasi kebenaran tanggal dokumen.',
        suggestion: 'Konfirmasi apakah terdapat salah input tahun atau tanggal pada BAST/SPM.'
      });
    }
  });

  return issues;
}

/**
 * 6. Validasi Pengelolaan UP dan TUP
 */
export function validatePengelolaanUPTUP(tunai?: UPTUPTunaiInput[], kkp?: UPTUPKKPInput[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  (tunai || []).forEach((row, idx) => {
    const rowId = `UP/TUP #${row.no || idx + 1} (${row.jenis || 'Transaksi'})`;
    const gup = Number(row.totalGUP) || 0;
    const tup = Number(row.totalTUP) || 0;
    const setoran = Number(row.totalSetoranTUP) || 0;
    const outstanding = Number(row.totalOutstandingUP) || 0;

    if (gup < 0 || tup < 0 || setoran < 0 || outstanding < 0) {
      issues.push({
        id: `uptup-neg-${idx}`,
        indicatorKey: 'pengelolaanUPTUP',
        rowIdentifier: rowId,
        fieldName: 'nominal',
        fieldLabel: 'Nominal Transaksi',
        currentValue: `GUP: ${gup}, TUP: ${tup}, Setoran: ${setoran}`,
        severity: 'error',
        message: 'Nilai nominal UP/TUP/Setoran tidak boleh bernilai negatif.',
        suggestion: 'Koreksi input nominal menjadi angka positif atau 0.'
      });
    }

    if (setoran > tup && tup > 0) {
      issues.push({
        id: `uptup-setoran-exceed-${idx}`,
        indicatorKey: 'pengelolaanUPTUP',
        rowIdentifier: rowId,
        fieldName: 'totalSetoranTUP',
        fieldLabel: 'Setoran Sisa TUP',
        currentValue: `Setoran: Rp ${setoran.toLocaleString('id-ID')} > TUP: Rp ${tup.toLocaleString('id-ID')}`,
        severity: 'error',
        message: 'Nilai setoran sisa TUP melebihi total TUP yang diterima.',
        suggestion: 'Setoran sisa TUP maksimal sebesar sisa dana TUP yang belum dipertanggungjawabkan.'
      });
    }
  });

  (kkp || []).forEach((row, idx) => {
    const rowId = `KKP Periode ${row.periode || String(idx + 1).padStart(2, '0')}`;
    const upKkp = Number(row.upKKPPerBulan) || 0;
    const gunaKkp = Number(row.penggunaanKKP) || 0;

    if (upKkp < 0 || gunaKkp < 0) {
      issues.push({
        id: `kkp-neg-${idx}`,
        indicatorKey: 'pengelolaanUPTUP',
        rowIdentifier: rowId,
        fieldName: 'upKKPPerBulan',
        fieldLabel: 'Pagu / Penggunaan KKP',
        currentValue: `UP: ${upKkp}, Penggunaan: ${gunaKkp}`,
        severity: 'error',
        message: 'Porsi UP KKP maupun Penggunaan KKP tidak boleh bernilai negatif.',
        suggestion: 'Masukkan nominal angka positif atau 0.'
      });
    }
  });

  return issues;
}

/**
 * 7. Validasi Capaian Output
 */
export function validateCapaianOutput(
  inputs?: CapaianOutputInput[],
  _ketepatan?: CapaianOutputKetepatanInput[]
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!inputs || inputs.length === 0) return issues;

  inputs.forEach((row, idx) => {
    const rowId = `RO #${row.no || idx + 1} (${row.ro || 'Output'})`;
    const target = Number(row.target) || 0;
    const realisasi = Number(row.realisasiRO) || 0;
    const pcro = Number(row.persenProgress) || 0;

    if (target < 0) {
      issues.push({
        id: `co-target-neg-${idx}`,
        indicatorKey: 'capaianOutput',
        rowIdentifier: rowId,
        fieldName: 'target',
        fieldLabel: 'Target RO',
        currentValue: target,
        severity: 'error',
        message: 'Target rincian output (RO) tidak boleh bernilai negatif.',
        suggestion: 'Masukkan volume target output positif sesuai DIPA.'
      });
    }

    if (realisasi < 0) {
      issues.push({
        id: `co-real-neg-${idx}`,
        indicatorKey: 'capaianOutput',
        rowIdentifier: rowId,
        fieldName: 'realisasiRO',
        fieldLabel: 'Realisasi RO',
        currentValue: realisasi,
        severity: 'error',
        message: 'Realisasi volume RO tidak boleh negatif.',
        suggestion: 'Masukkan capaian volume fisik riil yang telah terverifikasi.'
      });
    }

    if (target === 0 && realisasi > 0) {
      issues.push({
        id: `co-zero-target-real-${idx}`,
        indicatorKey: 'capaianOutput',
        rowIdentifier: rowId,
        fieldName: 'target',
        fieldLabel: 'Target RO',
        currentValue: `Target: 0, Realisasi: ${realisasi}`,
        severity: 'error',
        message: 'Terdapat realisasi volume output pada target RO yang bernilai 0.',
        suggestion: 'Isi target volume RO sesuai target target DIPA agar RVRO dapat dihitung secara matematis.'
      });
    }

    if (pcro < 0 || pcro > 100) {
      issues.push({
        id: `co-pcro-out-range-${idx}`,
        indicatorKey: 'capaianOutput',
        rowIdentifier: rowId,
        fieldName: 'persenProgress',
        fieldLabel: 'Progress Capaian (PCRO)',
        currentValue: `${pcro}%`,
        severity: 'warning',
        message: 'Persentase progres capaian rincian output (PCRO) umumnya bernilai antara 0% s.d. 100%.',
        suggestion: 'Pastikan angka progress fisik yang diinput tidak melebihi 100% kecuali ada justifikasi khusus.'
      });
    }

    if (target > 0 && realisasi > target * 2) {
      issues.push({
        id: `co-real-extreme-${idx}`,
        indicatorKey: 'capaianOutput',
        rowIdentifier: rowId,
        fieldName: 'realisasiRO',
        fieldLabel: 'Realisasi RO (RVRO)',
        currentValue: `Realisasi: ${realisasi} vs Target: ${target} (${((realisasi / target) * 100).toFixed(0)}%)`,
        severity: 'warning',
        message: 'Realisasi volume RO melebihi 200% dari target DIPA.',
        suggestion: 'Konfirmasi kembali apakah terjadi kesalahan ketik atau memang terjadi lonjakan capaian output.'
      });
    }
  });

  return issues;
}

/**
 * 8. Validasi Dispensasi SPM
 */
export function validateDispensasiSPM(dispensasi?: DispensasiSPMInput): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!dispensasi) return issues;

  const spm = Number(dispensasi.jumlahSPMTriwulanIV) || 0;
  const disp = Number(dispensasi.jumlahDispensasiSPM) || 0;

  if (spm < 0 || disp < 0) {
    issues.push({
      id: 'disp-neg',
      indicatorKey: 'dispensasiSPM',
      rowIdentifier: 'Data Dispensasi Triwulan IV',
      fieldName: 'jumlahSPMTriwulanIV',
      fieldLabel: 'Jumlah SPM / Dispensasi',
      currentValue: `SPM: ${spm}, Dispensasi: ${disp}`,
      severity: 'error',
      message: 'Jumlah SPM maupun Dispensasi tidak boleh negatif.',
      suggestion: 'Masukkan angka positif atau 0.'
    });
  }

  if (disp > spm && spm > 0) {
    issues.push({
      id: 'disp-exceed',
      indicatorKey: 'dispensasiSPM',
      rowIdentifier: 'Data Dispensasi Triwulan IV',
      fieldName: 'jumlahDispensasiSPM',
      fieldLabel: 'Jumlah Dispensasi SPM',
      currentValue: `Dispensasi: ${disp} > Total SPM TW IV: ${spm}`,
      severity: 'error',
      message: 'Jumlah dispensasi SPM tidak boleh melebihi total SPM yang diajukan pada Triwulan IV.',
      suggestion: 'Koreksi jumlah dispensasi SPM agar tidak melampaui jumlah total SPM Triwulan IV.'
    });
  }

  return issues;
}

/**
 * Universal Inspector untuk memeriksa validitas data per indikator
 */
export function getIndicatorValidationSummary(
  indicatorKey: string,
  project: SimulationProject
): ValidationSummary {
  let issues: ValidationIssue[] = [];

  switch (indicatorKey) {
    case 'revisiDIPA':
      issues = validateRevisiDIPA(project.revisiDIPA);
      break;
    case 'deviasiHalIII':
      issues = validateDeviasiHalIII(project.deviasiHalIII);
      break;
    case 'penyerapan':
      issues = validatePenyerapan(project.penyerapan);
      break;
    case 'belanjaKontraktual':
      issues = validateBelanjaKontraktual(project.belanjaKontraktual);
      break;
    case 'penyelesaianTagihan':
      issues = validatePenyelesaianTagihan(project.penyelesaianTagihan);
      break;
    case 'pengelolaanUPTUP':
      issues = validatePengelolaanUPTUP(project.upTUPTunai, project.upTUPKKP);
      break;
    case 'capaianOutput':
      issues = validateCapaianOutput(project.capaianOutput, project.capaianOutputKetepatan);
      break;
    case 'dispensasiSPM':
      issues = validateDispensasiSPM(project.dispensasiSPM);
      break;
  }

  const errorCount = issues.filter(i => i.severity === 'error').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;

  return {
    indicatorKey,
    hasIssues: issues.length > 0,
    errorCount,
    warningCount,
    totalIssues: issues.length,
    issues
  };
}

// Aliases for convenient importing across tabs
export const validateDeviasiHal3 = validateDeviasiHalIII;
export const validateDispensasi = validateDispensasiSPM;
export const validateKontraktual = validateBelanjaKontraktual;
export const validateTagihan = validatePenyelesaianTagihan;
export const validateUpTup = validatePengelolaanUPTUP;
