import { RealisasiBelanjaRecord } from "../types";
import { INITIAL_MY_INTRESS_DATA } from "./initialMyIntressData";

// Construct full SINTESA dataset across all 127 Satkers KPPN Semarang I
function buildCompleteInitialRealisasiBelanja(): RealisasiBelanjaRecord[] {
  const records: RealisasiBelanjaRecord[] = [];

  INITIAL_MY_INTRESS_DATA.forEach((s) => {
    const kode = (s.kodeSatker || "").trim();
    if (!kode) return;

    const klName = s.namaSatker.split(" ").slice(0, 3).join(" ") || "KEMENTERIAN/LEMBAGA";
    const klKode = kode.substring(0, 3);

    // Belanja Pegawai (51)
    if (s.paguPegawai > 0 || s.realPegawai > 0) {
      records.push({
        id: "sintesa_" + kode + "_51",
        kementerianKode: klKode,
        kementerianUraian: klName,
        kanwilKode: "13",
        kanwilUraian: "SEMARANG",
        kppnKode: "026",
        kppnUraian: "SEMARANG I",
        satkerKode: kode,
        satkerUraian: s.namaSatker,
        akunKode: "511111",
        akunUraian: "Belanja Gaji Pokok & Tunjangan Pegawai",
        jenisBelanjaKode: "51",
        jenisBelanjaUraian: "Belanja Pegawai (51)",
        sumberdanaKode: "01",
        sumberdanaUraian: "RM",
        paguDipa: s.paguPegawai,
        realisasi: s.realPegawai,
        blokir: 0,
        sisaPagu: Math.max(0, s.paguPegawai - s.realPegawai),
        persenRealisasi: s.paguPegawai > 0 ? (s.realPegawai / s.paguPegawai) * 100 : 0
      });
    }

    // Belanja Barang (52)
    if (s.paguBarang > 0 || s.realBarang > 0) {
      records.push({
        id: "sintesa_" + kode + "_52",
        kementerianKode: klKode,
        kementerianUraian: klName,
        kanwilKode: "13",
        kanwilUraian: "SEMARANG",
        kppnKode: "026",
        kppnUraian: "SEMARANG I",
        satkerKode: kode,
        satkerUraian: s.namaSatker,
        akunKode: "521111",
        akunUraian: "Belanja Barang Operasional & Non Operasional",
        jenisBelanjaKode: "52",
        jenisBelanjaUraian: "Belanja Barang (52)",
        sumberdanaKode: "01",
        sumberdanaUraian: "RM",
        paguDipa: s.paguBarang,
        realisasi: s.realBarang,
        blokir: 0,
        sisaPagu: Math.max(0, s.paguBarang - s.realBarang),
        persenRealisasi: s.paguBarang > 0 ? (s.realBarang / s.paguBarang) * 100 : 0
      });
    }

    // Belanja Modal (53)
    if (s.paguModal > 0 || s.realModal > 0) {
      records.push({
        id: "sintesa_" + kode + "_53",
        kementerianKode: klKode,
        kementerianUraian: klName,
        kanwilKode: "13",
        kanwilUraian: "SEMARANG",
        kppnKode: "026",
        kppnUraian: "SEMARANG I",
        satkerKode: kode,
        satkerUraian: s.namaSatker,
        akunKode: "532111",
        akunUraian: "Belanja Modal Peralatan, Mesin & Fisik",
        jenisBelanjaKode: "53",
        jenisBelanjaUraian: "Belanja Modal (53)",
        sumberdanaKode: "01",
        sumberdanaUraian: "RM",
        paguDipa: s.paguModal,
        realisasi: s.realModal,
        blokir: 0,
        sisaPagu: Math.max(0, s.paguModal - s.realModal),
        persenRealisasi: s.paguModal > 0 ? (s.realModal / s.paguModal) * 100 : 0
      });
    }

    // Belanja Bansos (57)
    if (s.paguBansos > 0 || s.realBansos > 0) {
      records.push({
        id: "sintesa_" + kode + "_57",
        kementerianKode: klKode,
        kementerianUraian: klName,
        kanwilKode: "13",
        kanwilUraian: "SEMARANG",
        kppnKode: "026",
        kppnUraian: "SEMARANG I",
        satkerKode: kode,
        satkerUraian: s.namaSatker,
        akunKode: "571111",
        akunUraian: "Belanja Bantuan Sosial",
        jenisBelanjaKode: "57",
        jenisBelanjaUraian: "Belanja Bansos (57)",
        sumberdanaKode: "01",
        sumberdanaUraian: "RM",
        paguDipa: s.paguBansos,
        realisasi: s.realBansos,
        blokir: 0,
        sisaPagu: Math.max(0, s.paguBansos - s.realBansos),
        persenRealisasi: s.paguBansos > 0 ? (s.realBansos / s.paguBansos) * 100 : 0
      });
    }

    // Belanja Transfer (58)
    if (s.paguTransfer > 0 || s.realTransfer > 0) {
      records.push({
        id: "sintesa_" + kode + "_58",
        kementerianKode: klKode,
        kementerianUraian: klName,
        kanwilKode: "13",
        kanwilUraian: "SEMARANG",
        kppnKode: "026",
        kppnUraian: "SEMARANG I",
        satkerKode: kode,
        satkerUraian: s.namaSatker,
        akunKode: "581111",
        akunUraian: "Belanja Transfer ke Daerah / Lainnya",
        jenisBelanjaKode: "58",
        jenisBelanjaUraian: "Belanja Transfer (58)",
        sumberdanaKode: "01",
        sumberdanaUraian: "RM",
        paguDipa: s.paguTransfer,
        realisasi: s.realTransfer,
        blokir: 0,
        sisaPagu: Math.max(0, s.paguTransfer - s.realTransfer),
        persenRealisasi: s.paguTransfer > 0 ? (s.realTransfer / s.paguTransfer) * 100 : 0
      });
    }
  });

  return records;
}

export const INITIAL_REALISASI_BELANJA: RealisasiBelanjaRecord[] = buildCompleteInitialRealisasiBelanja();
