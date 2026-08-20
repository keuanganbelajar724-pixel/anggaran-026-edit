import { SatkerIKPA, IKPAPredikat } from "../types";

export function getPredikatIKPA(nilai: number): IKPAPredikat {
  if (nilai >= 95) return "Sangat Baik";
  if (nilai >= 89) return "Baik";
  if (nilai >= 70) return "Cukup";
  return "Kurang";
}

export function hitungTotalIKPA(indikator: SatkerIKPA["indikator"]): number {
  const total = 
    (indikator.revisiDipa * 0.10) +
    (indikator.deviasiHal3Dipa * 0.10) +
    (indikator.penyerapanAnggaran * 0.20) +
    (indikator.belanjaKontraktual * 0.10) +
    (indikator.penyelesaianTagihan * 0.10) +
    (indikator.pengelolaanUpTup * 0.10) +
    (indikator.dispensasiSpm * 0.05) +
    (indikator.capaianOutput * 0.25);
    
  return Number(total.toFixed(2));
}

export const INITIAL_SATKER_DATA: SatkerIKPA[] = [];

export function mergeHistoricalUploadsToSatkers(histories: any[]): SatkerIKPA[] {
  if (!Array.isArray(histories) || histories.length === 0) return [];
  const ikpaHistories = histories.filter(h => (!h.category || h.category === 'IKPA') && Array.isArray(h.satkersData) && h.satkersData.length > 0);
  if (ikpaHistories.length === 0) return [];

  const monthsOrder = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  // Sort histories chronologically
  const sortedHistories = [...ikpaHistories].sort((a, b) => {
    const idxA = monthsOrder.findIndex(m => (a.periode || '').toLowerCase().includes(m.toLowerCase()));
    const idxB = monthsOrder.findIndex(m => (b.periode || '').toLowerCase().includes(m.toLowerCase()));
    return (idxA !== -1 ? idxA : 0) - (idxB !== -1 ? idxB : 0);
  });

  const satkerMap = new Map<string, SatkerIKPA>();

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

      const finalIKPA = typeof s.nilaiTotalIKPA === 'number' && s.nilaiTotalIKPA > 0 
        ? s.nilaiTotalIKPA 
        : (existing?.nilaiTotalIKPA || hitungTotalIKPA(effectiveIndikator));

      const mergedSatker: SatkerIKPA = {
        ...(existing || {}),
        ...s,
        id: existing?.id || s.id || `satker-${kode}`,
        kodeSatker: kode,
        namaSatker: s.namaSatker || existing?.namaSatker || kode,
        kementerianLembaga: s.kementerianLembaga || existing?.kementerianLembaga || '-',
        hasIKPAData: true,
        hasCapaianOutputData: existing ? existing.hasCapaianOutputData : (s.hasCapaianOutputData || false),
        nilaiTotalIKPA: finalIKPA,
        predikat: s.predikat || (existing?.predikat) || getPredikatIKPA(finalIKPA),
        paguAnggaran: s.paguAnggaran || existing?.paguAnggaran || 0,
        realisasiAnggaran: s.realisasiAnggaran || existing?.realisasiAnggaran || 0,
        persenPenyerapan: s.persenPenyerapan || existing?.persenPenyerapan || 0,
        statusCapaianOutput: existing?.statusCapaianOutput || s.statusCapaianOutput || 'Belum Terlaporkan',
        indikator: effectiveIndikator,
        riwayatBulanan: mergedHistory
      };

      satkerMap.set(kode, mergedSatker);
    });
  });

  return Array.from(satkerMap.values());
}
