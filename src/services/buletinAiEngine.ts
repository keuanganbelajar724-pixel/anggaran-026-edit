import { BuletinConfig, RealisasiBelanjaSummary, SatkerIKPA } from '../types';
import { generateGeminiContent } from './geminiService';
import { formatRupiahShort } from '../utils/realisasiBelanjaProcessor';

/**
 * AI-Powered High-Tier Editorial Writer for KPPN Semarang I Bulletin
 * Powered by Google Gemini 3.7 Flash
 */
export async function generateAiBuletinEditorial(
  currentConfig: BuletinConfig,
  summary?: RealisasiBelanjaSummary | null,
  satkers: SatkerIKPA[] = []
): Promise<Partial<BuletinConfig>> {
  const paguStr = summary ? formatRupiahShort(summary.totalPagu) : 'Rp12,85 Triliun';
  const realStr = summary ? formatRupiahShort(summary.totalRealisasi) : 'Rp8,42 Triliun';
  const persenStr = summary ? `${summary.persenRealisasiTotal.toFixed(1)}%` : '65.5%';
  const periode = currentConfig.bulanTahun || 'Triwulan II 2026';
  const topSatkerNama = summary?.topSatkers?.[0]?.namaSatker || satkers[0]?.namaSatker || 'Polrestabes Semarang';

  const prompt = `Anda adalah Redaktur Senior & Pakar Komunikasi Publik Direktorat Jenderal Perbendaharaan (DJPb) Kementerian Keuangan RI.
Tugas Anda: Susun dan perbarui naskah redaksi resmi berbobot tinggi untuk Majalah "WARTA SEMARANG SATU" KPPN Tipe A1 Semarang I (${periode}).

DATA FISKAL RIIL:
- Total Pagu Kelolaan: ${paguStr}
- Realisasi Belanja: ${realStr} (${persenStr})
- Satker Terbaik / Champion: ${topSatkerNama}
- Total Satker Mitra: ${summary?.totalSatkerCount || 127} Satker

Tolong hasilkan data JSON yang valid dan lengkap dengan struktur persis berikut:
{
  "judulUtama": "string (Judul Utama sampul majalah formal & bersemangat)",
  "subJudul": "string (Sub judul pendukung)",
  "sambutanKepala": "string (Teks lengkap sambutan/kata pengantar Kepala KPPN 3-4 paragraf yang mengapresiasi kinerja belanja APBN, akselerasi IKPA, digitalisasi SAKTI Digipay KKP, dan komitmen WBBM)",
  "tajukRencana": "string (Tajuk Rencana mendalam tentang stabilitas fiskal regional)",
  "opiniPranata": {
    "judul": "string (Judul opini ilmiah populer seputar APBN & digitalisasi SAKTI)",
    "penulis": "string (Nama Pranata Keuangan APBN)",
    "jabatanPenulis": "string (Pranata Keuangan APBN Penyelia KPPN Semarang I)",
    "kutipanOpini": "string (1 kalimat kutipan tajam)",
    "isiOpini": "string (2 paragraf mendalam tentang efisiensi belanja dan Green Budgeting)"
  },
  "wawancaraSatker": {
    "judul": "string (Judul wawancara eksklusif)",
    "narasumber": "string (Nama Pejabat/KPA/PPK Satker Juara)",
    "jabatan": "string (KPA / PPK)",
    "satker": "${topSatkerNama}",
    "kutipanPenting": "string (Kiat sukses meraih nilai IKPA 100)",
    "isiWawancara": "string (Naskah tanya jawab kiat lelang dini, ketertiban RPD Hal III DIPA, dan zero retur SP2D)",
    "prestasiSatker": "string (Peringkat 1 Realisasi Belanja)"
  },
  "pantunAntiKorupsi": {
    "bait1": "string",
    "bait2": "string",
    "bait3": "string",
    "bait4": "string",
    "pesanIntegritas": "string"
  }
}

HANYA berikan JSON yang valid tanpa tanda petik markdown triple backticks.`;

  try {
    const response = await generateGeminiContent({
      prompt,
      model: 'gemini-3.7-flash',
      systemInstruction: 'Anda adalah Redaktur Ahli Majalah Perbendaharaan Kementerian Keuangan RI. Hasilkan output JSON valid berbobot tinggi tanpa teks pengantar.'
    });

    let cleaned = response.text.trim();
    if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/^```json/, '').replace(/```$/, '').trim();
    else if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```/, '').replace(/```$/, '').trim();

    const parsed = JSON.parse(cleaned);
    return {
      judulUtama: parsed.judulUtama || currentConfig.judulUtama,
      subJudul: parsed.subJudul || currentConfig.subJudul,
      sambutanKepala: parsed.sambutanKepala || currentConfig.sambutanKepala,
      tajukRencana: parsed.tajukRencana || currentConfig.tajukRencana,
      opiniPranata: {
        ...currentConfig.opiniPranata,
        ...parsed.opiniPranata
      },
      wawancaraSatker: {
        ...currentConfig.wawancaraSatker,
        ...parsed.wawancaraSatker
      },
      pantunAntiKorupsi: {
        ...currentConfig.pantunAntiKorupsi,
        ...parsed.pantunAntiKorupsi
      }
    };
  } catch (err) {
    console.warn('AI Buletin Editorial generation notice (fallback to engine):', err);
    throw err;
  }
}
