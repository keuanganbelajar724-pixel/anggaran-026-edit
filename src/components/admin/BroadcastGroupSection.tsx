import React, { useState, useMemo, useEffect } from 'react';
import {
  MessageSquare,
  Copy,
  ExternalLink,
  Check,
  RotateCcw,
  Sparkles,
  Search,
  Users,
  Building2,
  Calendar,
  Clock,
  AlertTriangle,
  FileText,
  Award,
  Download,
  CheckCircle2,
  ListChecks,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Sliders,
  Send,
  Wand2,
  Info
} from 'lucide-react';
import { SatkerIKPA, PejabatSertifikasi, DashboardConfig } from '../../types';
import { generateGeminiContent, getClientStoredApiKey } from '../../services/geminiService';

export type GroupBroadcastCategory = 
  | 'CAPUT' 
  | 'SERTIFIKASI' 
  | 'IKPA_PERHATIAN' 
  | 'REKONSILIASI' 
  | 'UP_TUP' 
  | 'CUSTOM';

interface BroadcastGroupSectionProps {
  satkers: SatkerIKPA[];
  pejabatList?: PejabatSertifikasi[];
  dashboardConfig: DashboardConfig;
  isDark?: boolean;
  showToast?: (opts: { type: 'success' | 'error' | 'warning' | 'info'; title: string; message: string }) => void;
}

export const BroadcastGroupSection: React.FC<BroadcastGroupSectionProps> = ({
  satkers,
  pejabatList = [],
  dashboardConfig,
  isDark = false,
  showToast
}) => {
  // Category Tab
  const [activeCategory, setActiveCategory] = useState<GroupBroadcastCategory>('CAPUT');

  // General Header & Time Config
  const [namaKppn, setNamaKppn] = useState<string>(() => {
    return dashboardConfig.namaKppn || 'KPPN Semarang I';
  });
  
  // Waktu Monitoring (contoh: "3 September 2026 pukul 14.20 WITA" / "WIB")
  const [waktuMonitoring, setWaktuMonitoring] = useState<string>('3 September 2026 pukul 14.20 WIB');
  const [periodeBulan, setPeriodeBulan] = useState<string>('Agustus 2026');
  const [batasWaktu, setBatasWaktu] = useState<string>('7 September 2026');
  const [periodeTriwulanSertifikasi, setPeriodeTriwulanSertifikasi] = useState<string>('Triwulan IV Tahun 2026');

  // SI-CAPUT & Options
  const [includeSiCaputGuide, setIncludeSiCaputGuide] = useState<boolean>(true);
  const [includePcroWarning, setIncludePcroWarning] = useState<boolean>(true);
  const [linkSiCaput, setLinkSiCaput] = useState<string>('s.kemenkeu.go.id/Caput156');
  const [includePplNote, setIncludePplNote] = useState<boolean>(true);
  const [includeSimaspatenAlert, setIncludeSimaspatenAlert] = useState<boolean>(true);

  // Search & Filter Satker / Pejabat
  const [searchSatkerQuery, setSearchSatkerQuery] = useState<string>('');
  
  // Selected IDs for Caput
  const [selectedCaputSatkerIds, setSelectedCaputSatkerIds] = useState<string[]>([]);
  // Selected IDs for Sertifikasi
  const [selectedSertifikasiPejabatIds, setSelectedSertifikasiPejabatIds] = useState<string[]>([]);
  // Selected IDs for IKPA Perhatian
  const [selectedIkpaSatkerIds, setSelectedIkpaSatkerIds] = useState<string[]>([]);

  // Manual edited text override (null if auto-synced)
  const [manualText, setManualText] = useState<string | null>(null);
  const [isManualEditMode, setIsManualEditMode] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // AI Polish modal state
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [aiTone, setAiTone] = useState<'tegas' | 'formal' | 'ringkas' | 'apresiatif'>('tegas');
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);
  const [aiPreview, setAiPreview] = useState<string>('');

  // -------------------------------------------------------------
  // Data Filtering for CAPUT
  // -------------------------------------------------------------
  const caputCandidateSatkers = useMemo(() => {
    // Look for satkers with statusCapaianOutput !== 'Sudah Terlaporkan' or caput < 70 or caput == 0
    const filtered = satkers.filter((s) => {
      const indCaput = s.indikator?.capaianOutput;
      const isNotReported = s.statusCapaianOutput !== 'Sudah Terlaporkan';
      const isLow = typeof indCaput === 'number' && (indCaput === 0 || indCaput < 70);
      return isNotReported || isLow;
    });

    if (filtered.length > 0) return filtered;

    // Fallback: If all 127 satkers happen to be reported, pick top 14 satkers with lowest scores
    return [...satkers]
      .sort((a, b) => (a.indikator?.capaianOutput ?? 100) - (b.indikator?.capaianOutput ?? 100))
      .slice(0, 14);
  }, [satkers]);

  // Initialize selectedCaputSatkerIds
  useEffect(() => {
    if (caputCandidateSatkers.length > 0 && selectedCaputSatkerIds.length === 0) {
      setSelectedCaputSatkerIds(caputCandidateSatkers.map((s) => s.id || s.kodeSatker));
    }
  }, [caputCandidateSatkers]);

  // -------------------------------------------------------------
  // Data Filtering for SERTIFIKASI
  // -------------------------------------------------------------
  const sertifikasiCandidatePejabat = useMemo(() => {
    if (pejabatList && pejabatList.length > 0) {
      // Find officials that are in need of renewal or directly renewed
      return pejabatList;
    }
    return [];
  }, [pejabatList]);

  // Initialize selectedSertifikasiPejabatIds
  useEffect(() => {
    if (sertifikasiCandidatePejabat.length > 0 && selectedSertifikasiPejabatIds.length === 0) {
      // Select up to 15 key records by default
      const priorityIds = sertifikasiCandidatePejabat
        .filter((p) => p.status === 'Belum Perpanjangan' || p.kategoriData === 'BELUM_PERPANJANGAN' || p.statusUsulan?.toLowerCase().includes('langsung'))
        .map((p) => p.id);
      setSelectedSertifikasiPejabatIds(priorityIds.length > 0 ? priorityIds : sertifikasiCandidatePejabat.slice(0, 10).map((p) => p.id));
    }
  }, [sertifikasiCandidatePejabat]);

  // -------------------------------------------------------------
  // Data Filtering for IKPA PERHATIAN
  // -------------------------------------------------------------
  const ikpaCandidateSatkers = useMemo(() => {
    const filtered = satkers.filter((s) => {
      const isLow = s.nilaiTotalIKPA < 87.5;
      const isDeviasiLow = (s.indikator?.deviasiHal3Dipa ?? 100) < 75;
      const isPenyerapanLow = (s.indikator?.penyerapanAnggaran ?? 100) < 75;
      return isLow || isDeviasiLow || isPenyerapanLow;
    });

    if (filtered.length > 0) return filtered;
    return [...satkers].sort((a, b) => a.nilaiTotalIKPA - b.nilaiTotalIKPA).slice(0, 10);
  }, [satkers]);

  useEffect(() => {
    if (ikpaCandidateSatkers.length > 0 && selectedIkpaSatkerIds.length === 0) {
      setSelectedIkpaSatkerIds(ikpaCandidateSatkers.map((s) => s.id || s.kodeSatker));
    }
  }, [ikpaCandidateSatkers]);

  // -------------------------------------------------------------
  // GENERATOR TEMPLATE UTAMA
  // -------------------------------------------------------------
  const generatedBroadcastText = useMemo(() => {
    if (activeCategory === 'CAPUT') {
      const activeSatkers = caputCandidateSatkers.filter((s) => 
        selectedCaputSatkerIds.includes(s.id || s.kodeSatker)
      );

      const listSatkerFormatted = activeSatkers.length > 0
        ? activeSatkers.map((s) => `${s.kodeSatker} – ${s.namaSatker}`).join('\n')
        : '*(Tidak ada satker yang dipilih)*';

      let text = `📢 *[PENGUMUMAN]* 📢\n\n`;
      text += `Yth. Bapak/Ibu Satuan Kerja Lingkup ${namaKppn},\n\n`;
      text += `Berdasarkan hasil monitoring MyIntress per ${waktuMonitoring}, masih terdapat beberapa satker yang belum melakukan pengisian dan/atau approval Realisasi Capaian Output (CAPUT) periode ${periodeBulan} pada Modul Komitmen SAKTI.\n\n`;
      text += `⏳ Batas waktu pengisian: *${batasWaktu}*\n\n`;
      text += `Mohon kepada satker berikut agar segera melakukan pengisian dan approval CAPUT:\n\n`;
      text += `${listSatkerFormatted}\n\n`;

      if (includePcroWarning) {
        text += `📌 *Perhatian:*\n`;
        text += `Mohon agar pengisian TPCRO dan PCRO dilakukan sesuai kondisi realisasi. Jika TPCRO dan PCRO masih 0, maka progress RO tidak terbentuk dan dapat menyebabkan nilai capaian output menjadi 0 sehingga berpengaruh terhadap kinerja satker.\n\n`;
      }

      if (includeSiCaputGuide) {
        text += `🔎 *${namaKppn} juga menyediakan Tools Diagnostik Capaian Output (SI-CAPUT)*\n`;
        text += `Tools ini dapat membantu satker mengetahui RO yang menyebabkan capaian output belum maksimal, diagnosis permasalahan, rekomendasi perbaikan, serta template keterangan SAKTI.\n\n`;
        text += `Cara menggunakan SI-CAPUT:\n`;
        text += `1️⃣ Login MyIntress → Tematik → Indikator Pelaksanaan Anggaran\n`;
        text += `2️⃣ Pilih periode ${periodeBulan} → KIRIM\n`;
        text += `3️⃣ Klik nilai pada kolom Capaian Output\n`;
        text += `4️⃣ Klik Detail pada baris bulan terakhir\n`;
        text += `5️⃣ Unduh data menggunakan tombol XLSX\n`;
        text += `6️⃣ Buka SI-CAPUT – ${linkSiCaput}\n`;
        text += `7️⃣ Upload file Excel dan klik Jalankan Analisis\n\n`;
      }

      text += `Mohon agar CAPUT ${periodeBulan} segera diselesaikan sebelum batas waktu ${batasWaktu}.\n\n`;
      text += `Demikian disampaikan, atas perhatian dan kerja samanya kami ucapkan terima kasih.`;
      return text;
    }

    if (activeCategory === 'SERTIFIKASI') {
      const activePejabat = sertifikasiCandidatePejabat.filter((p) => 
        selectedSertifikasiPejabatIds.includes(p.id)
      );

      // Split into "Sudah Perpanjangan Langsung" vs "Perlu Tindak Lanjut / Belum Perpanjangan"
      const sudahLangsung = activePejabat.filter((p) => 
        p.statusUsulan?.toLowerCase().includes('langsung') || p.keterangan?.toLowerCase().includes('langsung')
      );
      const belumPerpanjang = activePejabat.filter((p) => 
        !p.statusUsulan?.toLowerCase().includes('langsung') && !p.keterangan?.toLowerCase().includes('langsung')
      );

      let text = `📢 *[PENGUMUMAN – PERPANJANGAN SERTIFIKAT KOMPETENSI PPK, PPSPM, DAN BENDAHARA ${periodeTriwulanSertifikasi.toUpperCase()}]* 📢\n\n`;
      text += `Yth. Bapak/Ibu Satuan Kerja Lingkup ${namaKppn},\n\n`;
      text += `Izin menyampaikan informasi terkait Perpanjangan Masa Berlaku Sertifikat Kompetensi PPK, PPSPM, dan Bendahara Periode ${periodeTriwulanSertifikasi}.\n\n`;
      text += `Berdasarkan hasil identifikasi, terdapat sertifikat kompetensi pada satker lingkup ${namaKppn} yang masuk dalam periode perpanjangan, dengan status sebagai berikut:\n\n`;

      if (sudahLangsung.length > 0) {
        text += `✅ *Sudah dilakukan perpanjangan – Perpanjangan Langsung:*\n`;
        sudahLangsung.forEach((p) => {
          text += `${p.kdSatker} – ${p.nmSatker}\n`;
          text += `👤 ${p.nama}\n`;
          text += `➡️ Status: Perpanjangan Langsung\n\n`;
        });
      }

      if (belumPerpanjang.length > 0) {
        text += `⏳ *Masuk Periode Perpanjangan / Belum Selesai Perpanjangan:*\n`;
        belumPerpanjang.forEach((p) => {
          text += `${p.kdSatker} – ${p.nmSatker}\n`;
          text += `👤 ${p.nama} (${p.nmJabatan || 'Pejabat Perbendaharaan'})\n`;
          text += `➡️ Status: ${p.statusUsulan || p.status || 'Perlu Rekam Usulan'}\n`;
          if (p.noSertifikat && p.noSertifikat !== 'Belum Ada') {
            text += `📜 No. Sertifikat: ${p.noSertifikat}\n`;
          }
          text += `\n`;
        });
      }

      if (activePejabat.length === 0) {
        text += `*(Belum ada pejabat yang dicentang pada daftar sasaran)*\n\n`;
      }

      if (includePplNote) {
        text += `📌 *Perhatian:*\n`;
        text += `Untuk PPK/PPSPM, perpanjangan langsung dapat dilakukan apabila yang bersangkutan masih menduduki jabatan dan telah mengikuti paling sedikit 1 kali PPL yang relevan dengan kompetensi jabatan.\n\n`;
      }

      if (includeSimaspatenAlert) {
        text += `Mohon agar satker yang sertifikatnya akan kedaluwarsa pada ${periodeTriwulanSertifikasi} dapat segera melakukan pengecekan dan menindaklanjuti proses perpanjangannya melalui SIMASPATEN, sehingga tidak sampai melewati masa berlaku sertifikat.\n\n`;
      }

      text += `Demikian disampaikan, atas perhatian dan kerja samanya diucapkan terima kasih.`;
      return text;
    }

    if (activeCategory === 'IKPA_PERHATIAN') {
      const activeSatkers = ikpaCandidateSatkers.filter((s) => 
        selectedIkpaSatkerIds.includes(s.id || s.kodeSatker)
      );

      let text = `📢 *[PENGUMUMAN – EVALUASI TERPADU KINERJA IKPA SATKER]* 📢\n\n`;
      text += `Yth. Kuasa Pengguna Anggaran (KPA) dan Pengelola Keuangan Lingkup ${namaKppn},\n\n`;
      text += `Berdasarkan rekapitulasi penilaian kinerja Indikator Kinerja Pelaksanaan Anggaran (IKPA) periode ${periodeBulan}, diimbau kepada Satker berikut untuk melakukan akselerasi dan perbaikan indikator pelaksanaan anggaran:\n\n`;

      if (activeSatkers.length > 0) {
        activeSatkers.forEach((s, idx) => {
          text += `${idx + 1}. ${s.kodeSatker} – ${s.namaSatker}\n`;
          text += `   • Nilai IKPA: *${s.nilaiTotalIKPA.toFixed(2)}* (${s.predikat})\n`;
          text += `   • Capaian Output: ${s.indikator?.capaianOutput ?? 0}% | Deviasi Hal III: ${s.indikator?.deviasiHal3Dipa ?? 0}%\n`;
          text += `   • Penyerapan: ${s.persenPenyerapan.toFixed(1)}%\n\n`;
        });
      } else {
        text += `*(Tidak ada satker yang dipilih)*\n\n`;
      }

      text += `📌 *Rekomendasi Tindak Lanjut:*\n`;
      text += `1. Segera selesaikan perekaman dan approval Capaian Output SAKTI sebelum batas open period.\n`;
      text += `2. Selaraskan Rencana Penarikan Dana (RPD) Hal III DIPA dengan realisasi aktual agar deviasi tidak melebihi 5%.\n`;
      text += `3. Percepat penyerapan belanja kontraktual dan penyelesaian tagihan LS 17 hari kerja.\n\n`;
      text += `Konsultasi dan pendampingan dapat dilakukan secara langsung di Front Office Seksi MSKI ${namaKppn}.\n\n`;
      text += `Terima kasih atas dedikasi dan kerja sama Bapak/Ibu sekalian.`;
      return text;
    }

    if (activeCategory === 'REKONSILIASI') {
      let text = `📢 *[PENGUMUMAN – REKONSILIASI DATA SINTESA vs MY INTRESS]* 📢\n\n`;
      text += `Yth. Bapak/Ibu Petugas Rekonsiliasi & Bendahara Satuan Kerja Lingkup ${namaKppn},\n\n`;
      text += `Diberitahukan bahwa dalam rangka penyusunan Laporan Keuangan yang akuntabel, terdapat beberapa Satker yang teridentifikasi memiliki selisih angka realisasi belanja / pagu antara sistem SINTESA dan MY INTRESS per ${waktuMonitoring}.\n\n`;
      text += `Mohon kepada Satker terkait untuk segera melakukan cross-check pada pos akun belanja dan membuka konfirmasi melalui petugas Front Office KPPN.\n\n`;
      text += `⏳ Batas konfirmasi data: *${batasWaktu}*\n\n`;
      text += `Demikian disampaikan, atas perhatiannya diucapkan terima kasih.`;
      return text;
    }

    if (activeCategory === 'UP_TUP') {
      let text = `📢 *[PENGUMUMAN – MONITORING PENGELOLAAN UANG PERSEDIAAN (UP/TUP)]* 📢\n\n`;
      text += `Yth. Bapak/Ibu Pejabat Pembuat Komitmen dan Bendahara Pengeluaran Lingkup ${namaKppn},\n\n`;
      text += `Mengingat batas waktu revolving Uang Persediaan (UP) paling lambat 1 (satu) bulan setelah SP2D diterbitkan, diimbau kepada Satuan Kerja yang revolving UP-nya masih di bawah target 50% atau telah mendekati batas waktu 30 hari untuk segera mengajukan SPM GUP ke KPPN.\n\n`;
      text += `Hal ini krusial agar terhindar dari pemotongan besaran UP 50% oleh sistem KPPN sesuai regulasi yang berlaku.\n\n`;
      text += `Demikian disampaikan untuk dipedomani. Terima kasih.`;
      return text;
    }

    // CUSTOM
    return `📢 *[PENGUMUMAN KHUSUS SATKER]* 📢\n\nYth. Bapak/Ibu Satuan Kerja Lingkup ${namaKppn},\n\n(Tuliskan pesan pengumuman grup WhatsApp Anda di sini...)\n\nDemikian disampaikan, terima kasih.`;
  }, [
    activeCategory,
    namaKppn,
    waktuMonitoring,
    periodeBulan,
    batasWaktu,
    periodeTriwulanSertifikasi,
    includePcroWarning,
    includeSiCaputGuide,
    linkSiCaput,
    includePplNote,
    includeSimaspatenAlert,
    caputCandidateSatkers,
    selectedCaputSatkerIds,
    sertifikasiCandidatePejabat,
    selectedSertifikasiPejabatIds,
    ikpaCandidateSatkers,
    selectedIkpaSatkerIds
  ]);

  // Current active display text (either manual override or auto-generated)
  const currentDisplayText = manualText !== null ? manualText : generatedBroadcastText;

  // Copy Handler
  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(currentDisplayText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
      if (showToast) {
        showToast({
          type: 'success',
          title: 'Teks Pengumuman Grup Disalin! 📋',
          message: 'Pesan telah disalin ke clipboard dan siap langsung di-paste ke grup WhatsApp Satker.'
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Open WhatsApp Web with text
  const handleOpenWhatsAppWeb = () => {
    const encoded = encodeURIComponent(currentDisplayText);
    window.open(`https://web.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  // Download as TXT file
  const handleDownloadTxt = () => {
    const element = document.createElement('a');
    const file = new Blob([currentDisplayText], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `Pengumuman_Grup_WA_${activeCategory}_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    if (showToast) {
      showToast({
        type: 'info',
        title: 'File Teks Diunduh',
        message: 'Draf pengumuman grup berhasil disimpan sebagai file teks (.txt).'
      });
    }
  };

  // Reset to Auto-Generated Format
  const handleResetToAuto = () => {
    setManualText(null);
    setIsManualEditMode(false);
    if (showToast) {
      showToast({
        type: 'info',
        title: 'Format Di-reset',
        message: 'Pesan dikembalikan ke format generator otomatis.'
      });
    }
  };

  // Toggle selection for CAPUT
  const handleToggleCaputSatker = (id: string) => {
    if (manualText !== null) setManualText(null); // Return to reactive mode
    setSelectedCaputSatkerIds((prev) => 
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllCaput = () => {
    if (manualText !== null) setManualText(null);
    setSelectedCaputSatkerIds(caputCandidateSatkers.map((s) => s.id || s.kodeSatker));
  };

  const handleDeselectAllCaput = () => {
    if (manualText !== null) setManualText(null);
    setSelectedCaputSatkerIds([]);
  };

  // Toggle selection for SERTIFIKASI
  const handleToggleSertifikasiPejabat = (id: string) => {
    if (manualText !== null) setManualText(null);
    setSelectedSertifikasiPejabatIds((prev) => 
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // AI Polish Execution
  const handleGenerateAiPolish = async () => {
    setIsAiGenerating(true);
    setAiPreview('');

    try {
      const toneGuidance = 
        aiTone === 'tegas' ? 'Nada instruktif, tegas, menekankan batas waktu/deadline yang sangat mendesak namun tetap santun dan profesional.' :
        aiTone === 'formal' ? 'Nada kedinasan resmi, sangat formal, mengedepankan asas akuntabilitas perbendaharaan.' :
        aiTone === 'ringkas' ? 'Format to-the-point, sangat ringkas, hilangkan kalimat bertele-tele, tonjolkan daftar aksi dan batas waktu.' :
        'Nada mengayomi, mengapresiasi kinerja Satker terlebih dahulu sebelum memberikan pengingat.';

      const prompt = `Kamu adalah Kepala Seksi Manajemen Satker dan Kepatuhan Internal (MSKI) di ${namaKppn}.
Tolong poles dan susun ulang pesan siaran WhatsApp untuk Grup Satker berikut agar lebih menarik, rapi dengan emoji yang tepat, dan memiliki dampak kepatuhan yang tinggi:

[Pesan Asli]:
${currentDisplayText}

[Instruksi Khusus]:
1. ${toneGuidance}
2. Pertahankan daftar kode dan nama satker/pejabat agar tidak hilang.
3. Tetap gunakan format WhatsApp (tanda bintang *teks* untuk bold, format list rapi).
4. Jangan menambahkan tautan fiktif.`;

      const res = await generateGeminiContent(prompt);
      setAiPreview(res);
    } catch (err: any) {
      console.error(err);
      if (showToast) {
        showToast({
          type: 'error',
          title: 'Gagal Memproses AI',
          message: err?.message || 'Terjadi kesalahan saat memanggil asisten AI.'
        });
      }
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleApplyAiPreview = () => {
    if (!aiPreview) return;
    setManualText(aiPreview);
    setIsManualEditMode(true);
    setIsAiModalOpen(false);
    if (showToast) {
      showToast({
        type: 'success',
        title: 'Hasil AI Diterapkan! ✨',
        message: 'Pengumuman grup berhasil diperbarui dengan hasil polesan AI.'
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner Pengantar Mode Grup */}
      <div className={`p-5 rounded-3xl border shadow-xs relative overflow-hidden transition-all ${
        isDark 
          ? 'bg-gradient-to-r from-emerald-950/50 via-slate-900 to-teal-950/40 border-emerald-800/40' 
          : 'bg-gradient-to-r from-emerald-50 via-white to-teal-50/70 border-emerald-200'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20 flex-shrink-0">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                  Mode Siaran Grup WA
                </span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Konsolidasi Pesan Satker Tunggal
                </span>
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                Generator Pengumuman Grup WhatsApp Satker
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed mt-0.5">
                Fitur ini merangkum daftar satker spesifik (seperti satker belum input/approval CAPUT atau pejabat belum perpanjangan sertifikat) ke dalam <strong>1 pesan pengumuman grup terpadu</strong> yang siap disalin langsung ke WhatsApp Grup Satker KPPN.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap flex-shrink-0">
            <button
              type="button"
              onClick={handleCopyText}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer ${
                isCopied
                  ? 'bg-emerald-700 text-white ring-2 ring-emerald-400'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white hover:shadow-md'
              }`}
            >
              {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{isCopied ? 'Tersalin ke Clipboard!' : 'Salin Pesan Grup'}</span>
            </button>

            <button
              type="button"
              onClick={handleOpenWhatsAppWeb}
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white flex items-center gap-2 shadow-sm cursor-pointer transition-all"
              title="Buka WhatsApp Web dengan isi pesan ini"
            >
              <ExternalLink className="w-4 h-4 text-emerald-400" />
              <span>Buka WA Web</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Kategori Pengumuman Grup */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 bg-slate-100 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
        {[
          {
            id: 'CAPUT' as GroupBroadcastCategory,
            label: '1. Capaian Output (CAPUT)',
            icon: ListChecks,
            badge: `${caputCandidateSatkers.length} Satker`,
            badgeColor: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
          },
          {
            id: 'SERTIFIKASI' as GroupBroadcastCategory,
            label: '2. Perpanjangan Sertifikat',
            icon: Award,
            badge: `${sertifikasiCandidatePejabat.length} Data`,
            badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
          },
          {
            id: 'IKPA_PERHATIAN' as GroupBroadcastCategory,
            label: '3. Satker Perhatian IKPA',
            icon: AlertTriangle,
            badge: `${ikpaCandidateSatkers.length} Satker`,
            badgeColor: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300'
          },
          {
            id: 'REKONSILIASI' as GroupBroadcastCategory,
            label: '4. Rekonsiliasi Belanja',
            icon: RefreshCw,
            badge: 'Sintesa-Intress',
            badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
          },
          {
            id: 'UP_TUP' as GroupBroadcastCategory,
            label: '5. Revolving UP/TUP',
            icon: Clock,
            badge: 'Peringatan 30 Hari',
            badgeColor: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
          },
          {
            id: 'CUSTOM' as GroupBroadcastCategory,
            label: '6. Pesan Kustom Bebas',
            icon: FileText,
            badge: 'Draf Mandiri',
            badgeColor: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
          }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeCategory === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveCategory(tab.id);
                setManualText(null); // reset manual edit on tab change
              }}
              className={`p-3 rounded-xl text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                isActive
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-md ring-2 ring-emerald-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${tab.badgeColor}`}>
                  {tab.badge}
                </span>
              </div>
              <span className="text-xs font-black truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Two-Column Layout: Parameters & Selector (Left) vs Real-Time Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* KOLOM KIRI: Konfigurasi Parameter & Daftar Centang Satker (5/12 cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Panel Parameter Header Pengumuman */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800/95 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-500" />
                <span>Parameter Pengumuman Grup</span>
              </h4>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                Live Dynamic
              </span>
            </div>

            {/* Nama KPPN */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Nama Kantor KPPN:
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={namaKppn}
                  onChange={(e) => {
                    setNamaKppn(e.target.value);
                    if (manualText !== null) setManualText(null);
                  }}
                  placeholder="KPPN Semarang I / KPPN Kolaka"
                  className="w-full px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              {/* Quick Select Buttons */}
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                {['KPPN Semarang I', 'KPPN Kolaka', 'KPPN Kendari', 'KPPN Surakarta'].map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => {
                      setNamaKppn(k);
                      if (manualText !== null) setManualText(null);
                    }}
                    className={`text-[10px] px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                      namaKppn === k
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>

            {/* Waktu Monitoring & Periode */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Waktu Monitoring:
                </label>
                <div className="relative">
                  <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={waktuMonitoring}
                    onChange={(e) => {
                      setWaktuMonitoring(e.target.value);
                      if (manualText !== null) setManualText(null);
                    }}
                    className="w-full pl-8 pr-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  {activeCategory === 'SERTIFIKASI' ? 'Periode Triwulan:' : 'Periode Bulan:'}
                </label>
                <div className="relative">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  {activeCategory === 'SERTIFIKASI' ? (
                    <input
                      type="text"
                      value={periodeTriwulanSertifikasi}
                      onChange={(e) => {
                        setPeriodeTriwulanSertifikasi(e.target.value);
                        if (manualText !== null) setManualText(null);
                      }}
                      className="w-full pl-8 pr-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  ) : (
                    <input
                      type="text"
                      value={periodeBulan}
                      onChange={(e) => {
                        setPeriodeBulan(e.target.value);
                        if (manualText !== null) setManualText(null);
                      }}
                      className="w-full pl-8 pr-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Batas Waktu / Deadline */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                ⏳ Batas Waktu / Deadline Pengisian:
              </label>
              <input
                type="text"
                value={batasWaktu}
                onChange={(e) => {
                  setBatasWaktu(e.target.value);
                  if (manualText !== null) setManualText(null);
                }}
                placeholder="Contoh: 7 September 2026"
                className="w-full px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Toggle Opsi Spesifik Kategori */}
            {activeCategory === 'CAPUT' && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={includePcroWarning}
                    onChange={(e) => {
                      setIncludePcroWarning(e.target.checked);
                      if (manualText !== null) setManualText(null);
                    }}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Sertakan Peringatan TPCRO &amp; PCRO = 0</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={includeSiCaputGuide}
                    onChange={(e) => {
                      setIncludeSiCaputGuide(e.target.checked);
                      if (manualText !== null) setManualText(null);
                    }}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Sertakan Panduan Tools Diagnostik (SI-CAPUT)</span>
                </label>

                {includeSiCaputGuide && (
                  <div className="pl-6 pt-1">
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">
                      Tautan / Shortlink SI-CAPUT:
                    </label>
                    <input
                      type="text"
                      value={linkSiCaput}
                      onChange={(e) => {
                        setLinkSiCaput(e.target.value);
                        if (manualText !== null) setManualText(null);
                      }}
                      className="w-full px-2.5 py-1 rounded-lg text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                )}
              </div>
            )}

            {activeCategory === 'SERTIFIKASI' && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={includePplNote}
                    onChange={(e) => {
                      setIncludePplNote(e.target.checked);
                      if (manualText !== null) setManualText(null);
                    }}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Sertakan Catatan Syarat PPL untuk Perpanjangan Langsung</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={includeSimaspatenAlert}
                    onChange={(e) => {
                      setIncludeSimaspatenAlert(e.target.checked);
                      if (manualText !== null) setManualText(null);
                    }}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Sertakan Peringatan Tindak Lanjut via SIMASPATEN</span>
                </label>
              </div>
            )}
          </div>

          {/* Panel Seleksi Satker / Pejabat yang Masuk ke Daftar */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800/95 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-500" />
                  <span>
                    {activeCategory === 'SERTIFIKASI'
                      ? 'Pilih Pejabat / Satker Target'
                      : 'Pilih Satker yang Dicantumkan'}
                  </span>
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Centang untuk memasukkan ke dalam daftar pesan grup
                </p>
              </div>

              {activeCategory === 'CAPUT' && (
                <span className="px-2 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  {selectedCaputSatkerIds.length} Terpilih
                </span>
              )}
              {activeCategory === 'SERTIFIKASI' && (
                <span className="px-2 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  {selectedSertifikasiPejabatIds.length} Terpilih
                </span>
              )}
            </div>

            {/* Quick Action Buttons & Search */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={searchSatkerQuery}
                  onChange={(e) => setSearchSatkerQuery(e.target.value)}
                  placeholder="Cari kode satker atau nama satker..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                {activeCategory === 'CAPUT' && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllCaput}
                      className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-bold cursor-pointer"
                    >
                      Pilih Semua ({caputCandidateSatkers.length})
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={handleDeselectAllCaput}
                      className="text-[11px] text-rose-600 dark:text-rose-400 hover:underline font-bold cursor-pointer"
                    >
                      Batalkan Semua
                    </button>
                  </div>
                )}

                {activeCategory === 'SERTIFIKASI' && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (manualText !== null) setManualText(null);
                        setSelectedSertifikasiPejabatIds(sertifikasiCandidatePejabat.map((p) => p.id));
                      }}
                      className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-bold cursor-pointer"
                    >
                      Pilih Semua ({sertifikasiCandidatePejabat.length})
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (manualText !== null) setManualText(null);
                        setSelectedSertifikasiPejabatIds([]);
                      }}
                      className="text-[11px] text-rose-600 dark:text-rose-400 hover:underline font-bold cursor-pointer"
                    >
                      Batalkan Semua
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* List Satker Item Box */}
            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/60 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 p-1">
              {activeCategory === 'CAPUT' && (
                <>
                  {caputCandidateSatkers
                    .filter((s) => {
                      const q = searchSatkerQuery.toLowerCase();
                      return s.kodeSatker.includes(q) || s.namaSatker.toLowerCase().includes(q);
                    })
                    .map((satker) => {
                      const id = satker.id || satker.kodeSatker;
                      const isSelected = selectedCaputSatkerIds.includes(id);
                      return (
                        <label
                          key={id}
                          className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-emerald-50 dark:bg-emerald-950/40'
                              : 'hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleCaputSatker(id)}
                            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 mt-0.5"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[11px] font-black text-slate-800 dark:text-slate-200">
                                {satker.kodeSatker}
                              </span>
                              <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.2 rounded">
                                {satker.indikator?.capaianOutput ?? 0}%
                              </span>
                            </div>
                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
                              {satker.namaSatker}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                </>
              )}

              {activeCategory === 'SERTIFIKASI' && (
                <>
                  {sertifikasiCandidatePejabat
                    .filter((p) => {
                      const q = searchSatkerQuery.toLowerCase();
                      return (
                        p.kdSatker.includes(q) ||
                        p.nmSatker.toLowerCase().includes(q) ||
                        p.nama.toLowerCase().includes(q)
                      );
                    })
                    .map((pej) => {
                      const isSelected = selectedSertifikasiPejabatIds.includes(pej.id);
                      const isLangsung = pej.statusUsulan?.toLowerCase().includes('langsung');
                      return (
                        <label
                          key={pej.id}
                          className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-amber-50 dark:bg-amber-950/40'
                              : 'hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSertifikasiPejabat(pej.id)}
                            className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 mt-0.5"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono text-[11px] font-black text-slate-800 dark:text-slate-200">
                                {pej.kdSatker}
                              </span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                isLangsung
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              }`}>
                                {isLangsung ? 'Perpanjangan Langsung' : (pej.status || 'Belum Perpanjang')}
                              </span>
                            </div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {pej.nama}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {pej.nmSatker}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                </>
              )}

              {activeCategory === 'IKPA_PERHATIAN' && (
                <>
                  {ikpaCandidateSatkers
                    .filter((s) => {
                      const q = searchSatkerQuery.toLowerCase();
                      return s.kodeSatker.includes(q) || s.namaSatker.toLowerCase().includes(q);
                    })
                    .map((satker) => {
                      const id = satker.id || satker.kodeSatker;
                      const isSelected = selectedIkpaSatkerIds.includes(id);
                      return (
                        <label
                          key={id}
                          className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-orange-50 dark:bg-orange-950/40'
                              : 'hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              if (manualText !== null) setManualText(null);
                              setSelectedIkpaSatkerIds((prev) =>
                                prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
                              );
                            }}
                            className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 mt-0.5"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[11px] font-black text-slate-800 dark:text-slate-200">
                                {satker.kodeSatker}
                              </span>
                              <span className="text-[10px] font-bold text-orange-700 dark:text-orange-400 bg-orange-100 dark:bg-orange-950/60 px-1.5 py-0.2 rounded">
                                IKPA: {satker.nilaiTotalIKPA.toFixed(2)}
                              </span>
                            </div>
                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
                              {satker.namaSatker}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                </>
              )}
            </div>
          </div>

        </div>

        {/* KOLOM KANAN: Real-time WhatsApp Preview & Actions (7/12 cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Header Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-800/95 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                Pratinjau Pesan Grup WhatsApp
              </span>

              {manualText !== null && (
                <span className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-2 py-0.5 rounded-md text-[10px] font-extrabold flex items-center gap-1">
                  ✏️ Telah Diedit
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Reset to Auto Button */}
              {manualText !== null && (
                <button
                  type="button"
                  onClick={handleResetToAuto}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-1 cursor-pointer"
                  title="Kembalikan format ke generator otomatis"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Format</span>
                </button>
              )}

              {/* AI Polish Button */}
              <button
                type="button"
                onClick={() => setIsAiModalOpen(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Poles AI (Gemini)</span>
              </button>

              {/* Download TXT */}
              <button
                type="button"
                onClick={handleDownloadTxt}
                className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer border border-slate-200 dark:border-slate-700"
                title="Unduh draf teks (.txt)"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* WhatsApp Chat Simulation Frame */}
          <div className="rounded-3xl border border-emerald-700/30 overflow-hidden shadow-xl bg-[#0b141a] relative">
            
            {/* WhatsApp Top Bar */}
            <div className="bg-[#202c33] px-4 py-3 border-b border-[#2a3942] flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center font-black text-sm text-white shadow-sm">
                  📢
                </div>
                <div>
                  <h5 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                    Grup Resmi Pengelola Keuangan {namaKppn}
                  </h5>
                  <p className="text-[10px] text-slate-400">
                    127 Peserta Satker • Pesan Siaran Resmi
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyText}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#00a884] hover:bg-[#02906f] text-white flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? 'Tersalin' : 'Salin WA'}</span>
                </button>
              </div>
            </div>

            {/* WhatsApp Wallpaper Container */}
            <div className="p-4 sm:p-6 min-h-[460px] bg-[#0b141a] bg-opacity-95 relative flex flex-col justify-start">
              
              {/* WhatsApp Bubble */}
              <div className="max-w-2xl bg-[#005c4b] text-[#e9edef] rounded-2xl rounded-tl-xs p-4 sm:p-5 shadow-md border border-[#02735e]/40 space-y-3 relative">
                
                {/* Chat Sender Header */}
                <div className="flex items-center justify-between text-[11px] pb-2 border-b border-[#02735e]/60 text-emerald-200">
                  <span className="font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                    Admin KPPN / Seksi MSKI
                  </span>
                  <span className="text-[10px] text-emerald-300/80">
                    Hari Ini, {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                  </span>
                </div>

                {/* Main Message Text / Editable Textarea */}
                {isManualEditMode ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] text-amber-300">
                      <span>✏️ Mode Edit Teks Langsung Aktif</span>
                      <button
                        type="button"
                        onClick={() => setIsManualEditMode(false)}
                        className="underline hover:text-white cursor-pointer"
                      >
                        Selesai Mengedit
                      </button>
                    </div>
                    <textarea
                      value={currentDisplayText}
                      onChange={(e) => setManualText(e.target.value)}
                      rows={18}
                      className="w-full p-3 rounded-xl bg-[#024a3c] border border-emerald-400/40 text-white font-mono text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>
                ) : (
                  <div className="font-sans text-xs sm:text-[13px] leading-relaxed whitespace-pre-wrap select-text text-white">
                    {currentDisplayText}
                  </div>
                )}

                {/* Bubble Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-[#02735e]/40 text-[10px] text-emerald-200/70">
                  <button
                    type="button"
                    onClick={() => setIsManualEditMode(!isManualEditMode)}
                    className="hover:text-white underline cursor-pointer"
                  >
                    {isManualEditMode ? 'Tutup Editor' : '✏️ Klik untuk Edit Teks Ini'}
                  </button>

                  <div className="flex items-center gap-1 font-mono text-[10px]">
                    <span>{new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="text-cyan-300">✓✓</span>
                  </div>
                </div>

              </div>

            </div>

            {/* Bottom Actions inside Frame */}
            <div className="bg-[#202c33] p-3.5 border-t border-[#2a3942] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-300 text-[11px]">
                <Info className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>
                  Teks ini telah dioptimasi dengan format WhatsApp (*bold*, emoji, &amp; baris rapi).
                </span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleCopyText}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl font-black bg-[#00a884] hover:bg-[#02906f] text-white flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-all"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Pesan</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenWhatsAppWeb}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl font-bold bg-[#111b21] hover:bg-[#2a3942] text-slate-200 flex items-center justify-center gap-2 border border-[#2a3942] cursor-pointer transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Buka WA Web</span>
                </button>
              </div>
            </div>

          </div>

          {/* Quick Copy Snippet (List Satker Saja) */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/95 border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-between gap-3">
            <div>
              <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Butuh Hanya Daftar Kode &amp; Nama Satker Saja?
              </h5>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Salin baris daftar satker tanpa pembuka dan penutup pengumuman.
              </p>
            </div>
            <button
              type="button"
              onClick={async () => {
                let snippet = '';
                if (activeCategory === 'CAPUT') {
                  const active = caputCandidateSatkers.filter((s) => selectedCaputSatkerIds.includes(s.id || s.kodeSatker));
                  snippet = active.map((s) => `${s.kodeSatker} – ${s.namaSatker}`).join('\n');
                } else if (activeCategory === 'SERTIFIKASI') {
                  const active = sertifikasiCandidatePejabat.filter((p) => selectedSertifikasiPejabatIds.includes(p.id));
                  snippet = active.map((p) => `${p.kdSatker} – ${p.nmSatker} (${p.nama})`).join('\n');
                } else {
                  snippet = caputCandidateSatkers.map((s) => `${s.kodeSatker} – ${s.namaSatker}`).join('\n');
                }
                await navigator.clipboard.writeText(snippet);
                if (showToast) {
                  showToast({
                    type: 'success',
                    title: 'Daftar Satker Tersalin',
                    message: 'Daftar satker berhasil disalin ke clipboard.'
                  });
                }
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-1.5 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Salin Daftar Saja</span>
            </button>
          </div>

        </div>

      </div>

      {/* MODAL POLESAN AI GEMINI */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full p-5 sm:p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    Poles Pengumuman Grup dengan AI Gemini
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Sesuaikan gaya bahasa pengumuman agar memiliki kepatuhan tinggi di grup satker
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAiModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Pilihan Gaya Bahasa / Tone */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Pilih Gaya Bahasa:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'tegas' as const, label: '🚨 Sangat Tegas (Urgent)', desc: 'Batas waktu dekat' },
                  { id: 'formal' as const, label: '🏛️ Formal & Kedinasan', desc: 'Sesuai regulasi' },
                  { id: 'ringkas' as const, label: '⚡ Singkat & Padat', desc: 'Tanpa basa-basi' },
                  { id: 'apresiatif' as const, label: '🤝 Apresiatif & Santun', desc: 'Pendekatan ramah' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setAiTone(item.id)}
                    className={`p-2.5 rounded-xl text-left border text-xs cursor-pointer transition-all ${
                      aiTone === item.id
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-300 font-bold'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="truncate">{item.label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Trigger */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleGenerateAiPolish}
                disabled={isAiGenerating}
                className="w-full py-2.5 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                {isAiGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Gemini AI sedang memformulasikan pengumuman...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    <span>Mulai Formulasikan Ulang dengan AI</span>
                  </>
                )}
              </button>
            </div>

            {/* Hasil Polesan AI */}
            {aiPreview && (
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" /> Hasil Polesan AI Gemini:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(aiPreview);
                      if (showToast) {
                        showToast({ type: 'success', title: 'Tersalin', message: 'Teks AI disalin.' });
                      }
                    }}
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Salin</span>
                  </button>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-indigo-500/30 font-mono text-xs whitespace-pre-wrap max-h-56 overflow-y-auto leading-relaxed text-slate-800 dark:text-slate-200">
                  {aiPreview}
                </div>
              </div>
            )}

            {/* Modal Buttons */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsAiModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Batal
              </button>
              {aiPreview && (
                <button
                  type="button"
                  onClick={handleApplyAiPreview}
                  className="px-4 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Pasang ke Pratinjau Pengumuman</span>
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
