import { SatkerIKPA, IKPAPredikat } from "../types";
import rawSatkersBaseline from './satkersBaseline.json';

const baselineArray: any[] = Array.isArray(rawSatkersBaseline)
  ? rawSatkersBaseline
  : ((rawSatkersBaseline as any)?.default && Array.isArray((rawSatkersBaseline as any).default))
    ? (rawSatkersBaseline as any).default
    : [];

export const INITIAL_SATKER_DATA: SatkerIKPA[] = baselineArray.map((s: any) => ({
  ...s,
  hasIKPAData: typeof s.hasIKPAData === 'boolean' ? s.hasIKPAData : true,
  hasCapaianOutputData: typeof s.hasCapaianOutputData === 'boolean' ? s.hasCapaianOutputData : true,
})) as SatkerIKPA[];

export function getPredikatIKPA(nilai: number): IKPAPredikat {
  const n = Number.isFinite(nilai) ? nilai : 0;
  if (n >= 95) return "Sangat Baik";
  if (n >= 89) return "Baik";
  if (n >= 70) return "Cukup";
  return "Kurang";
}

export function hitungTotalIKPA(indikator: SatkerIKPA["indikator"]): number {
  if (!indikator) return 0;
  const revisi = Number.isFinite(indikator.revisiDipa) ? Number(indikator.revisiDipa) : 0;
  const deviasi = Number.isFinite(indikator.deviasiHal3Dipa) ? Number(indikator.deviasiHal3Dipa) : 0;
  const penyerapan = Number.isFinite(indikator.penyerapanAnggaran) ? Number(indikator.penyerapanAnggaran) : 0;
  const kontraktual = Number.isFinite(indikator.belanjaKontraktual) ? Number(indikator.belanjaKontraktual) : 0;
  const tagihan = Number.isFinite(indikator.penyelesaianTagihan) ? Number(indikator.penyelesaianTagihan) : 0;
  const upTup = Number.isFinite(indikator.pengelolaanUpTup) ? Number(indikator.pengelolaanUpTup) : 0;
  const dispensasi = Number.isFinite(indikator.dispensasiSpm) ? Number(indikator.dispensasiSpm) : 0;
  const caput = Number.isFinite(indikator.capaianOutput) ? Number(indikator.capaianOutput) : 0;

  const total = 
    (revisi * 0.10) +
    (deviasi * 0.10) +
    (penyerapan * 0.20) +
    (kontraktual * 0.10) +
    (tagihan * 0.10) +
    (upTup * 0.10) +
    (dispensasi * 0.05) +
    (caput * 0.25);
    
  return Number.isFinite(total) ? Number(total.toFixed(2)) : 0;
}

export function mergeHistoricalUploadsToSatkers(histories: any[]): SatkerIKPA[] {
  if (!Array.isArray(histories) || histories.length === 0) return [];
  const ikpaHistories = histories.filter(h => (!h.category || h.category === 'IKPA') && Array.isArray(h.satkersData) && h.satkersData.length > 0);
  const caputHistories = histories.filter(h => h.category === 'CAPAIAN_OUTPUT' && Array.isArray(h.satkersData) && h.satkersData.length > 0);

  if (ikpaHistories.length === 0 && caputHistories.length === 0) return [];

  // Active or latest Capaian Output archive
  const activeCaputHistory = caputHistories.find(h => h.isActive) || (caputHistories.length > 0 ? caputHistories[0] : null);
  const caputMap = new Map<string, any>();
  if (activeCaputHistory && Array.isArray(activeCaputHistory.satkersData)) {
    activeCaputHistory.satkersData.forEach((c: any) => {
      if (c.kodeSatker) caputMap.set(c.kodeSatker.trim(), c);
    });
  }

  const monthsOrder = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  // Sort histories chronologically
  const sortedHistories = [...ikpaHistories].sort((a, b) => {
    const idxA = monthsOrder.findIndex(m => (a.periode || '').toLowerCase().includes(m.toLowerCase()));
    const idxB = monthsOrder.findIndex(m => (b.periode || '').toLowerCase().includes(m.toLowerCase()));
    return (idxA !== -1 ? idxA : 0) - (idxB !== -1 ? idxB : 0);
  });

  const satkerMap = new Map<string, SatkerIKPA>();
  const latestIkpa = sortedHistories.length > 0 ? sortedHistories[sortedHistories.length - 1] : null;
  const effectivePeriode = latestIkpa?.periode || 's.d. Juli 2026';

  sortedHistories.forEach(hist => {
    const monthName = monthsOrder.find(m => (hist.periode || '').toLowerCase().includes(m.toLowerCase())) || hist.periode;
    
    (hist.satkersData || []).forEach((s: any) => {
      const kode = s.kodeSatker?.trim();
      if (!kode) return;

      const existing = satkerMap.get(kode);
      
      const newMonthEntry = {
        bulan: monthName,
        nilaiIKPA: s.nilaiTotalIKPA || 0,
        capaianOutput: s.indikator?.capaianOutput || 0,
        deviasiHal3Dipa: s.indikator?.deviasiHal3Dipa || 0,
        penyerapanAnggaran: s.indikator?.penyerapanAnggaran || 0,
        revisiDipa: s.indikator?.revisiDipa || 0,
        belanjaKontraktual: s.indikator?.belanjaKontraktual || 0,
        penyelesaianTagihan: s.indikator?.penyelesaianTagihan || 0,
        pengelolaanUpTup: s.indikator?.pengelolaanUpTup || 0,
        dispensasiSpm: s.indikator?.dispensasiSpm || 0
      };

      let mergedHistory = existing?.riwayatBulanan ? [...existing.riwayatBulanan] : [];
      mergedHistory = mergedHistory.filter(h => (h.bulan || '').toLowerCase() !== monthName.toLowerCase());
      mergedHistory.push(newMonthEntry);
      mergedHistory.sort((a, b) => {
        const idxA = monthsOrder.findIndex(m => m.toLowerCase() === (a.bulan || '').toLowerCase());
        const idxB = monthsOrder.findIndex(m => m.toLowerCase() === (b.bulan || '').toLowerCase());
        return (idxA !== -1 ? idxA : 0) - (idxB !== -1 ? idxB : 0);
      });

      const effectiveIndikator = s.indikator || existing?.indikator || {
        revisiDipa: 0,
        deviasiHal3Dipa: 0,
        penyerapanAnggaran: 0,
        belanjaKontraktual: 0,
        penyelesaianTagihan: 0,
        pengelolaanUpTup: 0,
        dispensasiSpm: 0,
        capaianOutput: 0
      };

      const rawIKPA = Number(s.nilaiTotalIKPA);
      const existingIKPA = Number(existing?.nilaiTotalIKPA);
      const finalIKPA = (Number.isFinite(rawIKPA) && rawIKPA > 0)
        ? rawIKPA 
        : ((Number.isFinite(existingIKPA) && existingIKPA > 0) ? existingIKPA : hitungTotalIKPA(effectiveIndikator));

      const caputMatch = caputMap.get(kode);
      const hasCaput = Boolean(activeCaputHistory && caputMatch);

      const mergedIndikator = {
        ...effectiveIndikator,
        capaianOutput: hasCaput ? (Number(caputMatch.indikator?.capaianOutput) || 0) : 0
      };

      const mergedSatker: SatkerIKPA = {
        ...(existing || {}),
        ...s,
        id: existing?.id || s.id || `satker-${kode}`,
        kodeSatker: kode,
        namaSatker: s.namaSatker || existing?.namaSatker || kode,
        kementerianLembaga: s.kementerianLembaga || existing?.kementerianLembaga || '-',
        hasIKPAData: true,
        hasCapaianOutputData: hasCaput,
        nilaiTotalIKPA: Number.isFinite(finalIKPA) ? finalIKPA : 0,
        predikat: s.predikat || (existing?.predikat) || getPredikatIKPA(finalIKPA),
        paguAnggaran: Number(s.paguAnggaran) || Number(existing?.paguAnggaran) || 0,
        realisasiAnggaran: Number(s.realisasiAnggaran) || Number(existing?.realisasiAnggaran) || 0,
        persenPenyerapan: Number(s.persenPenyerapan) || Number(existing?.persenPenyerapan) || 0,
        statusCapaianOutput: hasCaput ? (caputMatch.statusCapaianOutput || 'Belum Terlaporkan') : 'Belum Terlaporkan',
        periodeUpdate: effectivePeriode,
        indikator: mergedIndikator,
        riwayatBulanan: mergedHistory
      };

      satkerMap.set(kode, mergedSatker);
    });
  });

  // If there are Capaian Output satkers not in IKPA, also include them
  if (activeCaputHistory) {
    (activeCaputHistory.satkersData || []).forEach((c: any) => {
      const kode = c.kodeSatker?.trim();
      if (kode && !satkerMap.has(kode)) {
        satkerMap.set(kode, {
          ...c,
          id: c.id || `satker-${kode}`,
          kodeSatker: kode,
          namaSatker: c.namaSatker || kode,
          kementerianLembaga: c.kementerianLembaga || '-',
          hasIKPAData: false,
          hasCapaianOutputData: true,
          nilaiTotalIKPA: 0,
          predikat: 'Cukup',
          paguAnggaran: 0,
          realisasiAnggaran: 0,
          persenPenyerapan: 0,
          statusCapaianOutput: c.statusCapaianOutput || 'Belum Terlaporkan',
          indikator: c.indikator || {
            revisiDipa: 0,
            deviasiHal3Dipa: 0,
            penyerapanAnggaran: 0,
            belanjaKontraktual: 0,
            penyelesaianTagihan: 0,
            pengelolaanUpTup: 0,
            dispensasiSpm: 0,
            capaianOutput: c.indikator?.capaianOutput || 0
          },
          riwayatBulanan: []
        });
      }
    });
  }

  return Array.from(satkerMap.values());
}
