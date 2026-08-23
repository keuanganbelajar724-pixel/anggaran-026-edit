import { SatkerIKPA, PengelolaanUPRecord, TransaksiKKPRecord, DigipayRecord } from '../types';

export function generateLocalFinancialAnalysis(
  query: string,
  persona: string,
  satkers: SatkerIKPA[],
  stats: {
    total: number;
    avgIKPA: number;
    satkerDalamPerhatian: SatkerIKPA[];
    belowIKPA: SatkerIKPA[];
    belowOutput: SatkerIKPA[];
    belowDeviasi: SatkerIKPA[];
    belowPenyerapan: SatkerIKPA[];
  },
  targetSatker?: SatkerIKPA | null
): string {
  const isTargetSingle = !!targetSatker;
  const lowerQuery = query.toLowerCase();

  // If specific single satker is selected
  if (isTargetSingle && targetSatker) {
    const s = targetSatker;
    const deviasi = s.indikator?.deviasiHal3Dipa || 0;
    const penyerapan = s.indikator?.penyerapanAnggaran || 0;
    const upTup = s.indikator?.pengelolaanUpTup || 0;
    const kontraktual = s.indikator?.belanjaKontraktual || 0;
    const output = s.indikator?.capaianOutput || 0;
    const tagihan = s.indikator?.penyelesaianTagihan || 0;
    const dispensasi = s.indikator?.dispensasiSpm || 0;
    const revisi = s.indikator?.revisiDipa || 0;

    let roleIntro = '';
    if (persona === 'pakar_keuangan_negara') {
      roleIntro = `📊 **TELAAH STRATEGIS KEUANGAN NEGARA & VALUE FOR MONEY (VfM)**\n*Oleh: Chief Financial Analyst (CFA) Kemenkeu*\n\n`;
    } else if (persona === 'forecaster_likuiditas') {
      roleIntro = `📈 **PROYEKSI LIKUIDITAS & ARUS KAS SATKER**\n*Oleh: Spesialis Manajemen Kas Negara*\n\n`;
    } else if (persona === 'kepala_kppn') {
      roleIntro = `🏛️ **ARAHAN EKSEKUTIF KEPALA KPPN SEMARANG I**\n\n`;
    } else {
      roleIntro = `📋 **DIAGNOSIS KOMPREHENSIF KINERJA ANGGARAN & IKPA**\n*Oleh: Seksi MSKI KPPN Semarang I*\n\n`;
    }

    return `${roleIntro}### 🏢 Satker: **[${s.kodeSatker}] ${s.namaSatker}**
- **Nilai Total IKPA:** **${s.nilaiTotalIKPA.toFixed(2)}** (Predikat: *${s.predikat}*)
- **Pagu Anggaran:** Rp${(s.paguAnggaran || 0).toLocaleString('id-ID')}
- **Realisasi Anggaran:** Rp${(s.realisasiAnggaran || 0).toLocaleString('id-ID')} (**${(s.persenPenyerapan || 0).toFixed(2)}%**)
- **Status Capaian Output:** **${s.statusCapaianOutput}**

---

### 1. 🔍 Matriks Skor 8 Indikator IKPA (Analisis Deviasi & Risiko)
| No | Indikator IKPA | Skor Riil | Status Kinerja | Rekomendasi Remedial |
|:---|:---|:---:|:---:|:---|
| 1 | Revisi DIPA | ${revisi.toFixed(1)} | ${revisi >= 90 ? '🟢 Optimal' : '🔴 Perlu Perbaikan'} | Batasi frekuensi revisi anggaran maksimal 1x per triwulan |
| 2 | Deviasi Halaman III DIPA | ${deviasi.toFixed(1)} | ${deviasi >= 85 ? '🟢 Baik' : '🔴 Kritis'} | Selaraskan RPD Bulanan pada SAKTI dengan kalender riil kegiatan |
| 3 | Penyerapan Anggaran | ${penyerapan.toFixed(1)} | ${penyerapan >= 90 ? '🟢 Baik' : '🟡 Lambat'} | Akselerasi eksekusi pengadaan barang/jasa dan SPM berkala |
| 4 | Belanja Kontraktual | ${kontraktual.toFixed(1)} | ${kontraktual >= 90 ? '🟢 Baik' : '🔴 Terlambat'} | Daftarkan kontrak ke KPPN maksimal 5 hari kerja setelah TTD |
| 5 | Penyelesaian Tagihan | ${tagihan.toFixed(1)} | ${tagihan >= 90 ? '🟢 Baik' : '🔴 Lewat Tempo'} | Terbitkan SPP/SPM maksimal 17 hari kerja sejak BAST |
| 6 | Pengelolaan UP & TUP | ${upTup.toFixed(1)} | ${upTup >= 90 ? '🟢 Patuh' : '🔴 Mengendap'} | Revolving GUP minimal 1x sebulan & maksimalkan KKP/Digipay Satu |
| 7 | Dispensasi SPM | ${dispensasi.toFixed(1)} | ${dispensasi >= 95 ? '🟢 Nihil' : '🔴 Ada Dispensasi'} | Hindari pengajuan SPM melewati batas waktu ketentuan |
| 8 | Capaian Output | ${output.toFixed(1)} | ${s.statusCapaianOutput === 'Sudah Terlaporkan' ? '🟢 Selesai' : '🔴 Belum Lapor'} | Segera unggah & konfirmasi capaian RVRO pada modul Komitmen |

---

### 2. 💡 Rekomendasi Aksi Berjenjang (Action Plan):
- **Kuasa Pengguna Anggaran (KPA):** Memimpin rapat koordinasi percepatan pelaksanaan anggaran mingguan dan menandatangani komitmen perbaikan RPD Triwulanan.
- **Pejabat Pembuat Komitmen (PPK):** Mempercepat penyelesaian BAST pekerjaan kontraktual dan tidak menunda pendaftaran kontrak ke KPPN.
- **Pejabat Penandatangan SPM (PPSPM):** Melakukan pengujian berkas tagihan secara ketat dalam batas waktu 17 hari kerja untuk mencegah penalti indikator tagihan.
- **Bendahara Pengeluaran:** Mempercepat pertanggungjawaban UP (GUP) dan memperbanyak porsi transaksi non-tunai melalui KKP dan Digipay Satu.

---

### 📱 Draf Pesan WhatsApp Resmi untuk PIC Satker:
> *"Yth. KPA / PIC Satker [${s.kodeSatker}] ${s.namaSatker},\nBerdasarkan monitoring evaluasi KPPN Semarang I, nilai IKPA Satker Anda saat ini tercatat sebesar **${s.nilaiTotalIKPA}** (${s.predikat}). Mohon perkenan Bapak/Ibu segera mengoptimalkan indikator yang masih memerlukan perbaikan, khususnya pemutakhiran RPD Hal III DIPA dan pelaporan Capaian Output pada aplikasi SAKTI. Terima kasih atas kerja sama dan dedikasi Bapak/Ibu dalam mengawal keuangan negara."*`;
  }

  // Aggregate / Macro Analysis
  if (lowerQuery.includes('vfm') || lowerQuery.includes('efisiensi') || persona === 'pakar_keuangan_negara') {
    return `📊 **ANALISIS STRATEGIS EFISIENSI KEUANGAN NEGARA & VALUE FOR MONEY (VfM)**
*Disusun oleh: Chief Financial Analyst (Pakar Keuangan Negara Kemenkeu)*

---

### 🏛️ Ringkasan Eksekutif Fiskal KPPN Semarang I:
- **Total Satker Aktif:** **${stats.total} Satker**
- **Rata-Rata IKPA Wilayah KPPN:** **${stats.avgIKPA.toFixed(2)} Poin**
- **Satker Kritis / Dalam Perhatian:** **${stats.satkerDalamPerhatian.length} Satker**
- **Satker Belum Lapor Capaian Output:** **${stats.belowOutput.length} Satker**

---

### 1. 🔍 Evaluasi 3 Pilar Utama Keuangan Negara:
1. **Efisiensi Alokatif (Allocative Efficiency):**
   - Tingkat deviasi RPD Halaman III DIPA masih terdapat **${stats.belowDeviasi.length} Satker** di bawah 75%. Hal ini mengindikasikan adanya selisih antara perencanaan penarikan kas dengan realisasi fisik di lapangan.
   - **Rekomendasi:** Lakukan asistensi klinis pemutakhiran RPD Triwulanan pada modul Penganggaran SAKTI sebelum cut-off pembukaan revisi.

2. **Efektivitas Belanja (Spending Effectiveness):**
   - Sebanyak **${stats.belowPenyerapan.length} Satker** mengalami perlambatan penyerapan anggaran. Terjadi konsentrasi belanja barang di akhir periode yang berisiko menciptakan *rush handling* pada penerbitan SPM.
   - **Rekomendasi:** Dorong penerbitan SPM kontraktual bertahap (termin) dan hindari penumpukan pembayaran uang muka di triwulan akhir.

3. **Kepatuhan Regulasi & Akuntabilitas (Economy & Compliance):**
   - Transaksi non-tunai melalui Digipay Satu dan Kartu Kredit Pemerintah (KKP) perlu terus didorong untuk mengurangi *idle cash* pada rekening bendahara pengeluaran.

---

### 2. 🎯 Rencana Aksi Remedial (30 Hari ke Depan):
| Jenjang Waktu | Target Tindakan | Penanggung Jawab | Output |
|:---|:---|:---|:---|
| **Minggu I** | Pemanggilan & FGD Pembinaan Khusus bagi ${stats.satkerDalamPerhatian.length} Satker Kritis | Kepala KPPN & Kasi MSKI | Berita Acara Komitmen Perbaikan IKPA |
| **Minggu II** | Asistensi One-on-One Pengunggahan Capaian Output | Tim Pembina SAKTI KPPN | 100% Satker Terlaporkan |
| **Minggu III** | Review Akurasi RPD Hal III DIPA | PPK & Bendahara Satker | Deviasi Kas RPD Terkendali < 10% |
| **Minggu IV** | Evaluasi Transaksi Digital KKP & Digipay Marketplace | Seksi Bank / MSKI | Peningkatan Skor Pengelolaan UP |`;
  }

  if (lowerQuery.includes('forecast') || lowerQuery.includes('likuiditas') || lowerQuery.includes('kas') || persona === 'forecaster_likuiditas') {
    return `📈 **MODEL FORECASTING LIKUIDITAS & ARUS KAS APBN KPPN SEMARANG I**
*Disusun oleh: Spesialis Manajemen Kas Negara (Cash Flow Planner)*

---

### 🌊 Simulasi Proyeksi Kebutuhan Likuiditas Kas:
- **Basis Satker:** **${stats.total} Satker Lingkup KPPN 026**
- **Estimasi Penyerapan Belanja Pegawai (Akun 51):** Berjalan stabil dan terjadwal secara bulanan melalui SPM Gaji Induk (rata-rata kepatuhan > 98%).
- **Estimasi Penyerapan Belanja Barang & Operasional (Akun 52):** Terjadi lonjakan frekuensi pengajuan SPM pada minggu ke-3 dan ke-4 setiap bulan.
- **Estimasi Penyerapan Belanja Modal (Akun 53):** Membutuhkan pemantauan khusus pada jadwal termin pembayaran BAST pekerjaan fisik agar tidak menumpuk di bulan Desember.

---

### ⚠️ Matriks Peringatan Dini (Early Warning System Likuiditas):
1. **Risiko Idle Cash (Kas Mengendap):**
   - Pantau rekening bendahara satker yang belum melakukan revolving GUP lebih dari 1 bulan kalender.
2. **Mitigasi Penumpukan SPM Akhir Tahun (LLAT):**
   - Tetapkan batas akhir pendaftaran kontrak (BAST) bertahap untuk mencegah kegagalan *settlement* SP2D pada akhir tahun anggaran.
3. **Penyelesaian Sisa UP/TUP:**
   - Seluruh sisa TUP wajib disetorkan kembali ke Kas Negara sebelum tanggal batas akhir LLAT tahun anggaran berjalan.`;
  }

  // General default response
  return `🤖 **HASIL TELAAH ANALIS KEUANGAN & IKPA SAKTI KPPN SEMARANG I**

### 📊 Ringkasan Kondisi Saat Ini:
- **Total Satker Aktif:** ${stats.total} Satker
- **Rata-Rata Nilai IKPA KPPN:** ${stats.avgIKPA.toFixed(2)}
- **Jumlah Satker Dalam Perhatian:** ${stats.satkerDalamPerhatian.length} Satker
- **Jumlah Satker Belum Lapor Capaian Output:** ${stats.belowOutput.length} Satker
- **Jumlah Satker Deviasi Hal III Kritis (< 75%):** ${stats.belowDeviasi.length} Satker

---

### 📌 Rekomendasi Utama:
1. Lakukan pendampingan intensif bagi **${stats.satkerDalamPerhatian.length} satker dalam perhatian**.
2. Segera terbitkan surat pemberitahuan tagihan pelaporan konfirmasi Capaian Output bagi **${stats.belowOutput.length} satker**.
3. Jadwalkan klinik bimbingan teknis pemutakhiran RPD Hal III DIPA untuk memitigasi deviasi anggaran.

*(Analisis dihasilkan oleh Mesin Analitik Finansial Cerdas KPPN Semarang I).*`;
}
