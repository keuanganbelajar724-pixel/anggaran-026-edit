import { DeviasiHal3Record, SatkerIKPA } from '../types';
import { INITIAL_SATKER_DATA } from './initialSatkerData';

export const NAMA_BULAN_LIST = [
  'Januari', 'Februari', 'Maret', 'April', 
  'Mei', 'Juni', 'Juli', 'Agustus', 
  'September', 'Oktober', 'November', 'Desember'
];

export const PERIODE_LIST = [
  { angka: 1, bulan: 'Januari', label: 'Periode 01 (Januari)' },
  { angka: 2, bulan: 'Februari', label: 'Periode 02 (Februari)' },
  { angka: 3, bulan: 'Maret', label: 'Periode 03 (Maret)' },
  { angka: 4, bulan: 'April', label: 'Periode 04 (April)' },
  { angka: 5, bulan: 'Mei', label: 'Periode 05 (Mei)' },
  { angka: 6, bulan: 'Juni', label: 'Periode 06 (Juni)' },
  { angka: 7, bulan: 'Juli', label: 'Periode 07 (Juli)' },
  { angka: 8, bulan: 'Agustus', label: 'Periode 08 (Agustus)' },
  { angka: 9, bulan: 'September', label: 'Periode 09 (September)' },
  { angka: 10, bulan: 'Oktober', label: 'Periode 10 (Oktober)' },
  { angka: 11, bulan: 'November', label: 'Periode 11 (November)' },
  { angka: 12, bulan: 'Desember', label: 'Periode 12 (Desember)' }
];

export function hitungSkorIKPADeviasi(persenDeviasi: number): number {
  if (persenDeviasi <= 5.0) return 100;
  if (persenDeviasi <= 10.0) {
    return Number((100 - ((persenDeviasi - 5) / 5) * 15).toFixed(2));
  }
  if (persenDeviasi <= 20.0) {
    return Number((85 - ((persenDeviasi - 10) / 10) * 25).toFixed(2));
  }
  const skor = Math.max(0, 60 - ((persenDeviasi - 20) / 30) * 60);
  return Number(skor.toFixed(2));
}

export function getStatusDeviasi(persenDeviasi: number): DeviasiHal3Record['statusDeviasi'] {
  if (persenDeviasi <= 5.0) return 'Aman (≤ 5%)';
  if (persenDeviasi <= 10.0) return 'Waspada (5% - 10%)';
  if (persenDeviasi <= 20.0) return 'Tinggi (10% - 20%)';
  return 'Kritis (> 20%)';
}

/**
 * Generate initial data Deviasi Halaman III DIPA untuk seluruh Satker mitra
 */
export function generateInitialDeviasiHal3Data(satkerList: SatkerIKPA[] = INITIAL_SATKER_DATA): DeviasiHal3Record[] {
  const currentYear = 2026;
  const periods = [
    { angka: 8, bulan: 'Agustus', tw: 'TW III' as const },
    { angka: 9, bulan: 'September', tw: 'TW III' as const }
  ];

  const specialMonth9: Record<string, { d51: number; d52: number; d53: number; d57: number }> = {
    '693967': { d51: 0, d52: 14198337, d53: 232099578380, d57: 0 },
    '691508': { d51: 0, d52: 204407795079, d53: 11440416000, d57: 0 },
    '691295': { d51: 0, d52: 92515659888, d53: 18069967653, d57: 0 },
    '694211': { d51: 0, d52: 40160778681, d53: 45419167350, d57: 0 },
    '694039': { d51: 0, d52: 37337818529, d53: 17581597000, d57: 0 },
    '694073': { d51: 0, d52: 42428140000, d53: 6130640850, d57: 0 }
  };

  const records: DeviasiHal3Record[] = [];

  for (const p of periods) {
    const currentMonth = p.bulan;
    const currentPeriode = p.angka;

    satkerList.forEach((s, index) => {
      const paguTotal = s.paguAnggaran || 15_000_000_000;
      
      let persenDeviasi = 4.2;
      if (index % 5 === 0) {
        persenDeviasi = Number((18.5 + (index % 12)).toFixed(2));
      } else if (index % 3 === 0) {
        persenDeviasi = Number((8.5 + (index % 6)).toFixed(2));
      } else if (index % 2 === 0) {
        persenDeviasi = Number((5.2 + (index % 4) * 0.8).toFixed(2));
      } else {
        persenDeviasi = Number((1.2 + (index % 4) * 0.9).toFixed(2));
      }

      // Porsi belanja
      const pagu51 = Math.round(paguTotal * 0.45); // Pegawai
      const pagu52 = Math.round(paguTotal * 0.35); // Barang
      const pagu53 = Math.round(paguTotal * 0.20); // Modal
      const pagu57 = 0; // Bansos

      // RPD bulan ini
      const rpd51 = Math.round(pagu51 * 0.082);
      const rpd52 = Math.round(pagu52 * 0.091);
      const rpd53 = Math.round(pagu53 * 0.075);
      const rpd57 = 0;
      const rpdTotal = rpd51 + rpd52 + rpd53 + rpd57;

      let deviasi51Nominal = 0;
      let deviasi52Nominal = 0;
      let deviasi53Nominal = 0;
      let deviasi57Nominal = 0;

      let realisasi51 = 0;
      let realisasi52 = 0;
      let realisasi53 = 0;
      let realisasi57 = 0;

      if (currentPeriode === 9 && specialMonth9[s.kodeSatker]) {
        const spec = specialMonth9[s.kodeSatker];
        deviasi51Nominal = spec.d51;
        deviasi52Nominal = spec.d52;
        deviasi53Nominal = spec.d53;
        deviasi57Nominal = spec.d57;

        realisasi51 = rpd51 + deviasi51Nominal;
        realisasi52 = rpd52 + deviasi52Nominal;
        realisasi53 = rpd53 + deviasi53Nominal;
        realisasi57 = 0;
      } else {
        const multiplier = index % 2 === 0 ? (1 + persenDeviasi / 100) : (1 - persenDeviasi / 100);
        realisasi51 = Math.round(rpd51 * (1 + (persenDeviasi * 0.3) / 100));
        realisasi52 = Math.round(rpd52 * multiplier);
        realisasi53 = Math.round(rpd53 * (1 - (persenDeviasi * 1.5) / 100));
        realisasi57 = 0;

        deviasi51Nominal = Math.abs(realisasi51 - rpd51);
        deviasi52Nominal = Math.abs(realisasi52 - rpd52);
        deviasi53Nominal = Math.abs(realisasi53 - rpd53);
        deviasi57Nominal = 0;
      }

      const realisasiTotal = realisasi51 + realisasi52 + realisasi53 + realisasi57;

      const persen51 = Number(((deviasi51Nominal / (rpd51 || 1)) * 100).toFixed(2));
      const persen52 = Number(((deviasi52Nominal / (rpd52 || 1)) * 100).toFixed(2));
      const persen53 = Number(((deviasi53Nominal / (rpd53 || 1)) * 100).toFixed(2));
      const persen57 = 0;

      const deviasiNominalTotal = deviasi51Nominal + deviasi52Nominal + deviasi53Nominal + deviasi57Nominal;
      const actualPersenDeviasi = Number(((deviasiNominalTotal / (rpdTotal || 1)) * 100).toFixed(2));
      const skorIKPA = hitungSkorIKPADeviasi(actualPersenDeviasi);
      const statusDeviasi = getStatusDeviasi(actualPersenDeviasi);

      const b51 = {
        jenisBelanja: 'Belanja Pegawai (51)',
        akun: '51',
        paguDipa: pagu51,
        rpd: rpd51,
        realisasi: realisasi51,
        deviasiNominal: deviasi51Nominal,
        persenDeviasi: persen51,
        status: (persen51 <= 5 ? 'Aman' : persen51 <= 10 ? 'Waspada' : 'Tinggi') as any
      };

      const b52 = {
        jenisBelanja: 'Belanja Barang (52)',
        akun: '52',
        paguDipa: pagu52,
        rpd: rpd52,
        realisasi: realisasi52,
        deviasiNominal: deviasi52Nominal,
        persenDeviasi: persen52,
        status: (persen52 <= 5 ? 'Aman' : persen52 <= 10 ? 'Waspada' : persen52 <= 20 ? 'Tinggi' : 'Kritis') as any
      };

      const b53 = {
        jenisBelanja: 'Belanja Modal (53)',
        akun: '53',
        paguDipa: pagu53,
        rpd: rpd53,
        realisasi: realisasi53,
        deviasiNominal: deviasi53Nominal,
        persenDeviasi: persen53,
        status: (persen53 <= 5 ? 'Aman' : persen53 <= 10 ? 'Waspada' : persen53 <= 20 ? 'Tinggi' : 'Kritis') as any
      };

      const b57 = {
        jenisBelanja: 'Belanja Bansos (57)',
        akun: '57',
        paguDipa: pagu57,
        rpd: rpd57,
        realisasi: realisasi57,
        deviasiNominal: deviasi57Nominal,
        persenDeviasi: persen57,
        status: 'Aman' as any
      };

      // Klasifikasi Satker & Revisi
      let klasifikasiSatker = 'NON BLU/NON FULL BLOKIR';
      let noRevisiTerakhir: string | number = 2;
      let tanggalPosting = '19-02-2026';

      if (index % 7 === 0) {
        klasifikasiSatker = 'BLU/FULL BLOKIR';
        noRevisiTerakhir = 1;
        tanggalPosting = '30-12-2025';
      } else if (index % 11 === 0) {
        klasifikasiSatker = 'NON BLU/FULL BLOKIR';
        noRevisiTerakhir = 2;
        tanggalPosting = '27-04-2026';
      } else if (index % 5 === 0) {
        klasifikasiSatker = 'BLU/NON FULL BLOKIR';
        noRevisiTerakhir = 4;
        tanggalPosting = '10-05-2026';
      } else if (index % 3 === 0) {
        noRevisiTerakhir = 5;
        tanggalPosting = '15-07-2026';
      }

      records.push({
        id: `deviasi-${s.kodeSatker}-${currentPeriode}-${currentYear}`,
        kodeSatker: s.kodeSatker,
        namaSatker: s.namaSatker,
        kementerianLembaga: s.kementerianLembaga || 'Kementerian/Lembaga Mitra',
        kodeKppn: s.kodeKppn || '026',
        kodeEselon1: '01',
        unitEselon1: s.unitEselon1 || '-',
        periodeAngka: currentPeriode,
        periodeBulan: currentMonth,
        periodeFormatted: `Periode ${String(currentPeriode).padStart(2, '0')} (${currentMonth})`,
        triwulan: p.tw,
        tahun: currentYear,
        tanggalPosting,
        noRevisiTerakhir,
        klasifikasiSatker,
        paguTotal,
        rpdTotal,
        realisasiTotal,
        deviasiNominalTotal,
        persenDeviasiTotal: actualPersenDeviasi,
        skorIKPADeviasi: skorIKPA,
        statusDeviasi,
        rincianJenisBelanja: {
          belanjaPegawai: b51,
          belanjaBarang: b52,
          belanjaModal: b53,
          belanjaBansos: b57,
          belanja51: b51,
          belanja52: b52,
          belanja53: b53,
          belanja57: b57
        },
        earlyWarningAlert: actualPersenDeviasi > 10.0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    });
  }

  return records;
}

export const INITIAL_DEVIASI_HAL3_DATA: DeviasiHal3Record[] = generateInitialDeviasiHal3Data(INITIAL_SATKER_DATA);
