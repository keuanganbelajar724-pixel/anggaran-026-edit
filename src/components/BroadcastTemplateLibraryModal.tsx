import { safeLocalStorageSet } from '../utils/safeStorage';
import React, { useState, useMemo, useEffect } from 'react';
import {
  Copy,
  Check,
  Search,
  FileText,
  X,
  Share2,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Award,
  CreditCard,
  Zap,
  Globe,
  AlertTriangle,
  Building2,
  Wand2,
  Bot,
  Sliders,
  Send,
  Plus,
  Trash2,
  CheckCircle2,
  RefreshCw,
  Clock,
  Tag,
  ArrowRight,
  BookmarkPlus,
  BookOpen,
  HelpCircle,
  Play
} from 'lucide-react';
import { generateGeminiContent, getClientStoredApiKey } from '../services/geminiService';
import { REMINDER_TEMPLATES } from '../data/reminderTemplates';
import { TemplateMessage, MasterSatker } from '../types';

interface BroadcastTemplateLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  masterSatkers?: MasterSatker[];
  onApplyTemplate?: (templateText: string) => void;
  showToast?: (opts: { type: 'success' | 'error' | 'warning' | 'info'; title: string; message: string }) => void;
  theme?: string;
  isDark?: boolean;
}

export type AiGeneratorTopic = 
  | 'capaian_output'
  | 'deviasi_hal3'
  | 'penyerapan_spm'
  | 'lpj_bendahara'
  | 'gup_up'
  | 'kkp_digipay'
  | 'apresiasi_ikpa'
  | 'peringatan_perhatian'
  | 'llat_akhir_tahun'
  | 'sosialisasi_juknis'
  | 'custom';

export type AiGeneratorTone = 
  | 'formal'
  | 'urgent'
  | 'persuasif'
  | 'apresiasi'
  | 'grup_umum';

export interface CustomSavedTemplate {
  id: string;
  judul: string;
  jenis: string;
  isiWa: string;
  createdAt: string;
  isAiGenerated?: boolean;
}

export const BroadcastTemplateLibraryModal: React.FC<BroadcastTemplateLibraryModalProps> = ({
  isOpen,
  onClose,
  masterSatkers = [],
  onApplyTemplate,
  showToast,
  theme,
  isDark: propIsDark
}) => {
  const isDark = propIsDark ?? (theme === 'dark');

  // Active View Tab: 'CATALOG' vs 'AI_GENERATOR'
  const [modalViewMode, setModalViewMode] = useState<'CATALOG' | 'AI_GENERATOR'>('CATALOG');

  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateMessage>(REMINDER_TEMPLATES[0]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Custom User/AI Saved Templates
  const [customSavedTemplates, setCustomSavedTemplates] = useState<CustomSavedTemplate[]>(() => {
    const saved = localStorage.getItem('kppn_custom_broadcast_templates');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse custom templates', e);
      }
    }
    return [];
  });

  // Save custom templates to localStorage
  useEffect(() => {
    try {
      safeLocalStorageSet('kppn_custom_broadcast_templates', JSON.stringify(customSavedTemplates));
    } catch (e) {
      console.warn('Failed to save custom templates to storage', e);
    }
  }, [customSavedTemplates]);

  // Variable customization states for live preview
  const [customVars, setCustomVars] = useState({
    namaSatker: 'PUSDIKBINMAS LEMDIKLAT POLRI',
    kodeSatker: '643340',
    namaPic: 'Bapak/Ibu Pengelola Keuangan',
    nilaiIkpa: '94.80',
    predikat: 'SANGAT BAIK',
    capaianOutput: '88.50',
    statusOutput: 'Sudah Terlaporkan',
    penyerapan: '78.40',
    deviasiHal3: '86.20',
    sisaPagu: '1.250.000.000',
    batasWaktu: '10 Bulan Ini / Pukul 17.00 WIB',
    noSurat: 'S-1284/KPN.1401/2026',
    masalahList: 'Akselerasi sisa pagu belanja barang & pemutakhiran RPD Hal III DIPA'
  });

  // --- AI Generator State ---
  const [aiTopic, setAiTopic] = useState<AiGeneratorTopic>('capaian_output');
  const [aiTone, setAiTone] = useState<AiGeneratorTone>('formal');
  const [aiCustomTopicTitle, setAiCustomTopicTitle] = useState<string>('');
  const [aiCustomInstructions, setAiCustomInstructions] = useState<string>('');
  const [aiTargetRole, setAiTargetRole] = useState<string>('KPA / PPK / Operator Satker');
  const [aiDeadlineInput, setAiDeadlineInput] = useState<string>('Tanggal 10 bulan ini pukul 17.00 WIB');
  const [aiIncludeVariables, setAiIncludeVariables] = useState({
    satkerName: true,
    satkerCode: true,
    picName: true,
    ikpaScore: true,
    deadline: true,
    portalLink: true,
    noSurat: false,
    sisaPagu: false
  });
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedTemplateTitle, setGeneratedTemplateTitle] = useState<string>('');
  const [generatedTemplateCategory, setGeneratedTemplateCategory] = useState<string>('Capaian Output');
  const [generatedTemplateContent, setGeneratedTemplateContent] = useState<string>('');
  const [isAiPolishActive, setIsAiPolishActive] = useState<boolean>(false);

  // Combine standard and custom templates for catalog display
  const allAvailableTemplates = useMemo(() => {
    const standard = REMINDER_TEMPLATES;
    const custom = customSavedTemplates.map(c => ({
      id: c.id,
      jenis: c.jenis,
      judul: c.judul,
      isiWa: c.isiWa,
      deskripsi: 'Template Kustom / Dihasilkan oleh AI Gemini'
    }));
    return [...custom, ...standard];
  }, [customSavedTemplates]);

  // Filter categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    allAvailableTemplates.forEach(t => cats.add(t.jenis));
    return ['ALL', '✨ Template AI Saya', ...Array.from(cats)];
  }, [allAvailableTemplates]);

  const filteredTemplates = useMemo(() => {
    return allAvailableTemplates.filter(t => {
      let matchCat = false;
      if (activeCategory === 'ALL') {
        matchCat = true;
      } else if (activeCategory === '✨ Template AI Saya') {
        matchCat = customSavedTemplates.some(c => c.id === t.id);
      } else {
        matchCat = t.jenis === activeCategory;
      }

      const q = searchQuery.toLowerCase();
      const matchSearch =
        t.judul.toLowerCase().includes(q) ||
        t.jenis.toLowerCase().includes(q) ||
        t.isiWa.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [activeCategory, searchQuery, allAvailableTemplates, customSavedTemplates]);

  // Rendered Message with dynamic variables
  const renderedWaText = useMemo(() => {
    if (!selectedTemplate) return '';
    let text = selectedTemplate.isiWa;
    text = text
      .replace(/\{NAMA_SATKER\}/g, customVars.namaSatker)
      .replace(/\{KODE_SATKER\}/g, customVars.kodeSatker)
      .replace(/\{NAMA_PIC\}/g, customVars.namaPic)
      .replace(/\{NAMA_PEJABAT\}/g, customVars.namaPic)
      .replace(/\{PERAN_PEJABAT\}/g, aiTargetRole)
      .replace(/\{NILAI_IKPA\}/g, customVars.nilaiIkpa)
      .replace(/\{PREDIKAT\}/g, customVars.predikat)
      .replace(/\{CAPAIAN_OUTPUT\}/g, customVars.capaianOutput)
      .replace(/\{STATUS_OUTPUT\}/g, customVars.statusOutput)
      .replace(/\{PENYERAPAN\}/g, customVars.penyerapan)
      .replace(/\{DEVIASI_HAL3\}/g, customVars.deviasiHal3)
      .replace(/\{SISA_PAGU\}/g, customVars.sisaPagu)
      .replace(/\{BATAS_WAKTU\}/g, customVars.batasWaktu)
      .replace(/\{NO_SURAT\}/g, customVars.noSurat)
      .replace(/\{MASALAH_LIST\}/g, customVars.masalahList)
      .replace(/\{PERIODE_BULAN\}/g, 'Bulan Berjalan 2026');
    return text;
  }, [selectedTemplate, customVars, aiTargetRole]);

  // Rendered preview for generated AI template
  const renderedGeneratedWaText = useMemo(() => {
    if (!generatedTemplateContent) return '';
    let text = generatedTemplateContent;
    text = text
      .replace(/\{NAMA_SATKER\}/g, customVars.namaSatker)
      .replace(/\{KODE_SATKER\}/g, customVars.kodeSatker)
      .replace(/\{NAMA_PIC\}/g, customVars.namaPic)
      .replace(/\{NAMA_PEJABAT\}/g, customVars.namaPic)
      .replace(/\{PERAN_PEJABAT\}/g, aiTargetRole)
      .replace(/\{NILAI_IKPA\}/g, customVars.nilaiIkpa)
      .replace(/\{PREDIKAT\}/g, customVars.predikat)
      .replace(/\{CAPAIAN_OUTPUT\}/g, customVars.capaianOutput)
      .replace(/\{STATUS_OUTPUT\}/g, customVars.statusOutput)
      .replace(/\{PENYERAPAN\}/g, customVars.penyerapan)
      .replace(/\{DEVIASI_HAL3\}/g, customVars.deviasiHal3)
      .replace(/\{SISA_PAGU\}/g, customVars.sisaPagu)
      .replace(/\{BATAS_WAKTU\}/g, customVars.batasWaktu)
      .replace(/\{NO_SURAT\}/g, customVars.noSurat)
      .replace(/\{MASALAH_LIST\}/g, customVars.masalahList)
      .replace(/\{PERIODE_BULAN\}/g, 'Bulan Berjalan 2026');
    return text;
  }, [generatedTemplateContent, customVars, aiTargetRole]);

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);

    if (showToast) {
      showToast({
        type: 'success',
        title: 'Template Berhasil Disalin! 📋',
        message: 'Teks pesan WhatsApp siap di-paste langsung ke grup WhatsApp Satker.'
      });
    }
  };

  const handleSatkerChange = (kd: string) => {
    const found = masterSatkers.find(m => m.kodeSatker === kd);
    if (found) {
      setCustomVars(prev => ({
        ...prev,
        kodeSatker: found.kodeSatker,
        namaSatker: found.namaSatker,
        namaPic: found.namaPic || 'Bapak/Ibu Pengelola Keuangan'
      }));
    }
  };

  // Local Intelligent Synthesizer (Instant Fallback & AI Synthesis Engine)
  const generateLocalBroadcastTemplate = (
    topic: AiGeneratorTopic,
    tone: AiGeneratorTone,
    customPrompt: string,
    targetRole: string,
    deadline: string,
    existingTemplateToPolish?: string
  ): { title: string; category: string; content: string } => {
    if (existingTemplateToPolish) {
      let polished = existingTemplateToPolish;
      // Enhance structure, formatting and official polish
      if (!polished.includes('KPPN SEMARANG I')) {
        polished = `*PEMBERITAHUAN RESMI - KPPN SEMARANG I (026)*\n*SEKSI MANAJEMEN SATKER DAN KEPATUHAN INTERNAL (MSKI)*\n\n${polished}`;
      }
      if (!polished.includes('anggaran-026.my.id')) {
        polished += `\n\n🌐 *Portal Akselerasi & Monitoring Mandiri KPPN 026:*\nhttps://anggaran-026.my.id\n\n_Layanan KPPN Semarang I: Handal, Transparan, Bebas Biaya & Bebas Gratifikasi (WBBM)._`;
      }
      return {
        title: `Polesan AI: ${selectedTemplate.judul}`,
        category: selectedTemplate.jenis || 'Kustom AI',
        content: polished
      };
    }

    const cleanPrompt = (customPrompt || '').trim();
    const promptLower = cleanPrompt.toLowerCase();

    // Detect actual intended topic from prompt keywords if custom or to enrich content
    const isDeviasiIntent = topic === 'deviasi_hal3' || promptLower.includes('deviasi') || promptLower.includes('halaman iii') || promptLower.includes('hal iii') || promptLower.includes('rpd') || promptLower.includes('rencana penarikan');
    const isOutputIntent = topic === 'capaian_output' || promptLower.includes('output') || promptLower.includes('rvro') || promptLower.includes('cro') || promptLower.includes('capaian');
    const isPenyerapanIntent = topic === 'penyerapan_spm' || promptLower.includes('serap') || promptLower.includes('spm') || promptLower.includes('kontraktual') || promptLower.includes('bast') || promptLower.includes('tagihan');
    const isLpjIntent = topic === 'lpj_bendahara' || promptLower.includes('lpj') || promptLower.includes('bendahara') || promptLower.includes('rekonsiliasi kas');
    const isUpGupIntent = topic === 'gup_up' || promptLower.includes('gup') || promptLower.includes('uang persediaan') || promptLower.includes('revolving') || promptLower.includes('tup');
    const isKkpDigipayIntent = topic === 'kkp_digipay' || promptLower.includes('kkp') || promptLower.includes('digipay') || promptLower.includes('kartu kredit') || promptLower.includes('marketplace');
    const isApresiasiIntent = topic === 'apresiasi_ikpa' || promptLower.includes('apresiasi') || promptLower.includes('selamat') || promptLower.includes('100') || promptLower.includes('sempurna') || promptLower.includes('penghargaan');
    const isLlatIntent = topic === 'llat_akhir_tahun' || promptLower.includes('llat') || promptLower.includes('akhir tahun') || promptLower.includes('tutup buku');

    let title = '';
    let category = 'Kustom AI';
    let content = '';

    const greeting = tone === 'apresiasi' 
      ? `*APRESIASI KINERJA PELAKSANAAN ANGGARAN - KPPN SEMARANG I*\n*SEKSI MANAJEMEN SATKER DAN KEPATUHAN INTERNAL (MSKI)*`
      : tone === 'urgent'
      ? `🚨 *PERINGATAN BATAS WAKTU (HIGH URGENCY) - KPPN SEMARANG I (026)*\n*SEKSI MANAJEMEN SATKER DAN KEPATUHAN INTERNAL (MSKI)*`
      : tone === 'persuasif'
      ? `🤝 *PANDUAN & EDUKASI PERBENDAHARAAN - KPPN SEMARANG I (026)*\n*SEKSI MANAJEMEN SATKER DAN KEPATUHAN INTERNAL (MSKI)*`
      : `*PEMBERITAHUAN RESMI - KPPN SEMARANG I (KODE: 026)*\n*SEKSI MANAJEMEN SATKER DAN KEPATUHAN INTERNAL (MSKI)*`;

    const recipient = `Yth. ${targetRole || 'Kuasa Pengguna Anggaran / PPK / Operator Satker'}\n*Satker: {NAMA_SATKER} (Kode: {KODE_SATKER})*`;

    if (isDeviasiIntent) {
      title = '[AI] Edukasi Pemutakhiran RPD & Penekanan Deviasi Halaman III DIPA SAKTI';
      category = 'IKPA & Evaluasi';
      content = `${greeting}

${recipient}

Dalam rangka menjaga akuntabilitas pelaksanaan anggaran dan optimalisasi penilaian indikator *Deviasi Halaman III DIPA (Rencana Penarikan Dana)* pada IKPA SAKTI, kami mengimbau perhatian Bapak/Ibu untuk melakukan pemutakhiran jadwal penarikan dana bulanan.

📊 *Status Indikator Deviasi Satker:*
• Nilai Deviasi Hal III DIPA: *{DEVIASI_HAL3} Poin*
• Nilai Total IKPA: *{NILAI_IKPA} ({PREDIKAT})*
• Batas Akhir Pemutakhiran/Revisi: *${deadline || 'Tanggal 10 Bulan Berjalan'}*

📌 *Panduan Teknis Langkah Revisi Halaman III DIPA pada Aplikasi SAKTI:*
1. *Login SAKTI Modul Penganggaran:* Masuk menggunakan user *Operator Penganggaran*.
2. *Akses Menu RUH:* Buka menu *RUH -> Belanja -> Petunjuk Operasional Kegiatan (POK)* atau *Rencana Penarikan Dana (RPD) Bulanan*.
3. *Sinkronisasi Jadwal Penarikan:* Sesuaikan proyeksi penarikan dana per jenis belanja (51, 52, 53) pada setiap bulan kalender dengan jadwal riil eksekusi kegiatan dan BAST pengadaan.
4. *Validasi Data:* Lakukan validasi data pada level Operator, lalu lakukan persetujuan berjenjang oleh *PPK* dan *KPA*.
5. *Pengajuan Usulan Revisi:* Kirimkan ADK Usulan Revisi Halaman III DIPA Triwulanan ke Kanwil DJPb Provinsi Jawa Tengah sebelum batas cut-off triwulan berjalan.
6. *Disiplin Pengajuan SPM:* Pastikan penerbitan dan pengajuan SPM ke KPPN Semarang I selalu mengacu pada rencana bulan yang tertera di Hal III DIPA (deviasi maksimal 5% untuk meraih poin IKPA 100).

⚠️ *Catatan Penting:* Deviasi yang melebihi ambang batas toleransi 5% akan mengurangi skor IKPA secara kumulatif dan memengaruhi indeks kesehatan fiskal satker.

🌐 *Cek Simulasi RPD & Panduan Lengkap:*
https://anggaran-026.my.id

_Layanan KPPN Semarang I: Handal, Transparan, Bebas Biaya & Tanpa Gratifikasi (WBBM)._`;
    } else if (isOutputIntent) {
      title = '[AI] Peringatan Batas Waktu Konfirmasi Capaian Output SAKTI';
      category = 'Capaian Output';
      content = `${greeting}

${recipient}

Berdasarkan hasil monitoring terpadu perbendaharaan pada Aplikasi SAKTI & MyIntress, kami mengingatkan kewajiban pelaporan dan konfirmasi *Data Capaian Output (RVRO & CRO)* periode berjalan.

📊 *Status Konfirmasi Output Satker:*
• Status Pelaporan: *{STATUS_OUTPUT}*
• Nilai Capaian Output: *{CAPAIAN_OUTPUT}*
• Batas Akhir Konfirmasi: *${deadline || 'Tanggal 10 Pukul 17.00 WIB'}*

📌 *Langkah-Langkah Pengisian & Konfirmasi di SAKTI:*
1. *Operator Komitmen:* Buka *Modul Komitmen -> RUH -> Pencatatan Capaian Output*.
2. *Input Capaian Riil:* Rekam Realisasi Volume Rincian Output (RVRO) dan Progres Capaian Rincian Output (PCRO) secara akurat, serta sertakan keterangan kendala jika realisasi belum memenuhi target.
3. *Unggah Bukti Dukung:* Sertakan dokumen pendukung (laporan kegiatan, foto dokumentasi, atau sertifikat).
4. *Persetujuan PPK:* Login user *PPK* pada SAKTI, lakukan verifikasi dan tekan tombol *Konfirmasi/Setuju* sebelum cut-off sistem.

⚠️ *Konsekuensi Keterlambatan:* Keterlambatan pelaporan data capaian output akan menyebabkan nilai indikator menjadi 0 (nol) serta risiko penundaan penerbitan SP2D.

🌐 *Rekapitulasi Capaian Output Satker:*
https://anggaran-026.my.id

_Seksi MSKI - KPPN Semarang I Siap Memberikan Bimbingan Teknis._`;
    } else if (isLpjIntent) {
      title = '[AI] Pengingat Batas Akhir Penyampaian LPJ Bendahara Pengeluaran/Penerimaan';
      category = 'Pengelolaan UP/TUP';
      content = `${greeting}

${recipient}

Disampaikan pengingat resmi bahwa batas akhir *Penyampaian dan Rekonsiliasi Laporan Pertanggungjawaban (LPJ) Bendahara* periode bulan lalu ke KPPN Semarang I adalah:

⏰ *Batas Akhir Penyampaian: ${deadline || 'Tanggal 10 Pukul 17.00 WIB'}*

📌 *Checklist Prosedur Penyusunan LPJ SAKTI:*
1. *Rekonsiliasi Internal:* Pastikan seluruh transaksi pembukuan kas bendahara telah cocok dengan laporan UAKPA pada *Modul GLP SAKTI*.
2. *Pemeriksaan Kas:* Buat Berita Acara Pemeriksaan Kas & Rekonsiliasi Bank yang telah ditandatangani oleh KPA.
3. *Kirim LPJ SAKTI:* Akses *Modul Bendahara -> Cetak -> LPJ Bendahara*, lakukan validasi dan kirim data LPJ ke KPPN secara elektronik.
4. *Pantau Verifikasi KPPN:* Pastikan status pada SAKTI berubah menjadi *Terbit Surat Hasil Pemeriksaan (SHP-LPJ)* dengan status Sesuai.

⚠️ *Peringatan Regulasi:* Keterlambatan penyampaian LPJ Bendahara dapat dikenakan sanksi berupa surat teguran dan penolakan penerbitan SP2D untuk SPM yang diajukan berikutnya.

🌐 *Format & Blangko Resmi LPJ KPPN 026:*
https://anggaran-026.my.id`;
    } else if (isUpGupIntent) {
      title = '[AI] Pengingat Batas Waktu Revolving Uang Persediaan (GUP) Bulanan';
      category = 'Pengelolaan UP/TUP';
      content = `${greeting}

${recipient}

Berdasarkan ketentuan *PER-5/PB/2024 tentang Petunjuk Teknis Penilaian Indikator Kinerja Pelaksanaan Anggaran (IKPA)*, kami mengimbau Satker untuk segera melakukan penggantian Uang Persediaan (*SPM-GUP*).

📊 *Ketentuan Pengelolaan UP/TUP SAKTI:*
• Kewajiban Revolving: *Minimal 1 (satu) kali dalam 1 (satu) bulan kalender*.
• Besaran Penggunaan: *Minimal 50% dari total besaran dana UP*.
• Batas Waktu Pengajuan: *${deadline || 'Sebelum 30 hari kalender sejak revolving terakhir'}*

📌 *Langkah Tindak Lanjut Satker:*
1. Kumpulkan kuitansi dan bukti pembayaran yang sah atas belanja operasional UP.
2. Rekam SPP dan SPM-GUP pada *SAKTI Modul Pembayaran*.
3. Lakukan verifikasi pengujian tagihan oleh PPSPM dan kirimkan ADK SPM-GUP ke KPPN Semarang I.
4. Jika terdapat dana TUP yang belum habis pada batas waktu, segera lakukan penyetoran sisa dana ke Kas Negara via SSBP atau ajukan perpanjangan izin TUP.

🌐 *Simulasi & Monitoring UP/TUP Satker:*
https://anggaran-026.my.id`;
    } else if (isKkpDigipayIntent) {
      title = '[AI] Optimalisasi Pemanfaatan KKP & Transaksi Belanja Marketplace Digipay Satu';
      category = 'Transaksi KKP & Digipay';
      content = `${greeting}

${recipient}

Dalam rangka mendukung agenda modernisasi perbendaharaan negara, Gerakan Belanja Produk Dalam Negeri (PDN), dan digitalisasi belanja APBN, kami mendorong Satker untuk mengoptimalkan pemanfaatan *Kartu Kredit Pemerintah (KKP)* dan transaksi *Digipay Satu*.

💳 *Fasilitas Transaksi Non-Tunai Pemerintah:*
• Proporsi Penggunaan UP KKP: *Minimal 40% dari total porsi UP*.
• Belanja Melalui Digipay Satu: *Diutamakan untuk pengadaan ATK, jamuan rapat, pemeliharaan, dan tiket dinas via UMKM lokal*.

📌 *Keuntungan bagi Satker:*
1. *Aman & Akuntabel:* Menghilangkan risiko pencurian atau kehilangan uang tunai di brankas bendahara.
2. *Poin IKPA Maksimal:* Mendongkrak nilai indikator Pengelolaan UP/TUP dan Indeks Digitalisasi Pembayaran.
3. *Bebas Biaya Admin:* Seluruh transaksi belanja operasional melalui KKP dan Digipay Satu bebas biaya admin bank.

🌐 *Panduan Pendaftaran Vendor Digipay & Monitoring Satker:*
https://anggaran-026.my.id

Hubungi Tim Inovasi Digital MSKI KPPN Semarang I untuk pendampingan teknis.`;
    } else if (isPenyerapanIntent) {
      title = '[AI] Akselerasi Realisasi Belanja & Penyampaian SPM Kontraktual/Non-Kontraktual';
      category = 'Pengetahuan & Juknis';
      content = `${greeting}

${recipient}

Menindaklanjuti evaluasi realisasi penyerapan anggaran Triwulan berjalan, kami mengimbau jajaran pengelola keuangan Satker untuk segera melakukan *akselerasi penyelesaian tagihan dan pengajuan SPM*.

📊 *Posisi Realisasi Satker:*
• Realisasi Penyerapan: *{PENYERAPAN}%*
• Batas Akhir Pengajuan SPM: *${deadline || 'Akhir Triwulan Berjalan'}*

📌 *Kepatuhan Batas Waktu Administrasi Pembayaran:*
1. *Pendaftaran Kontrak:* Wajib didaftarkan ke KPPN maksimal *5 (lima) hari kerja* setelah kontrak ditandatangani.
2. *Pengajuan SPM-LS:* Wajib diajukan ke KPPN maksimal *17 (tujuh belas) hari kerja* setelah Berita Acara Serah Terima (BAST) diterbitkan.
3. *Validasi Supplier & Rekening:* Pastikan kebenaran data supplier dan nomor rekening aktif untuk menghindari retur SP2D.

🌐 *Portal Blangko & Monitoring Penyerapan:*
https://anggaran-026.my.id

_KPPN Semarang I: Handal, Transparan, Bebas Biaya._`;
    } else if (isApresiasiIntent) {
      title = '[AI] Apresiasi Kinerja IKPA Sangat Baik / Nilai Sempurna Satker';
      category = 'IKPA & Evaluasi';
      content = `${greeting}

${recipient}

Pimpinan dan segenap jajaran *KPPN Tipe A1 Semarang I* menyampaikan apresiasi setinggi-tingginya kepada Kuasa Pengguna Anggaran (KPA), Pejabat Pembuat Komitmen (PPK), Pejabat Penandatangan SPM (PPSPM), Bendahara Pengeluaran, dan seluruh Tim Pengelola Keuangan atas capaian:

🏆 *PRESTASI KINERJA PELAKSANAAN ANGGARAN SANGAT BAIK*
• Nilai Total IKPA: *{NILAI_IKPA}*
• Kategori Predikat: *{PREDIKAT}*
• Capaian Output: *{STATUS_OUTPUT}*

Pencapaian luar biasa ini mencerminkan komitmen tinggi, disiplin tata kelola keuangan negara, dan integritas prima dalam mewujudkan belanja berkualitas (*Spending Better*).

Semoga prestasi ini senantiasa dipertahankan dan menjadi inspirasi bagi satuan kerja lainnya.

🌐 *Pantau Rekapitulasi Prestasi Satker:*
https://anggaran-026.my.id

_Terima kasih atas sinergi prima yang terjalin erat bersama KPPN Semarang I._`;
    } else if (isLlatIntent) {
      title = '[AI] Pedoman Langkah-Langkah Akhir Tahun Anggaran (LLAT) & Batas Kritis SPM';
      category = 'Pengetahuan & Juknis';
      content = `${greeting}

${recipient}

Menghadapi periode tutup tahun anggaran, berikut kami sampaikan jadwal kritis pelaksanaan *Langkah-Langkah Akhir Tahun Anggaran (LLAT)* lingkup KPPN Semarang I:

📅 *Jadwal Kritis Batas Pengajuan Dokumen:*
• Pendaftaran Kontrak Baru / BAST Akhir Tahun: *${deadline || 'Sesuai Surat Edaran LLAT'}*
• Pengajuan SPM-LS Non-Kontraktual / Honorarium: *Batas Jadwal Kritis LLAT*
• Pengajuan SPM GUP Nihil / Penyetoran Sisa UP: *Sebelum Penutupan Kas Negara*

📌 *Kewajiban Pokok Tim Keuangan Satker:*
1. Pastikan seluruh pekerjaan kontraktual telah dilengkapi BAST fisik dan jaminan bank yang sah.
2. Nihilkan seluruh sisa dana UP/TUP melalui SPM-GUP Nihil atau setoran SSBP ke kas negara.
3. Pantau status penolakan SPM pada SAKTI/SPAN dan segera lakukan perbaikan sebelum jam operasional tutup.

🌐 *Unduh Juknis Lengkap & Blangko LLAT:*
https://anggaran-026.my.id

Seksi Pencairan Dana & MSKI - KPPN Semarang I`;
    } else {
      title = aiCustomTopicTitle ? `[AI] ${aiCustomTopicTitle}` : '[AI] Broadcast Pengumuman Resmi & Edukasi Perbendaharaan KPPN 026';
      category = 'Kustom AI';
      content = `${greeting}

${recipient}

Menindaklanjuti program pembinaan dan monitoring evaluasi perbendaharaan terpadu, kami menyampaikan arahan resmi terkait tata kelola pelaksanaan anggaran Satker Bapak/Ibu:

📌 *Substansi Pengumuman & Arahan Pembinaan:*
1. Lakukan pemantauan berkala atas 8 indikator IKPA pada Aplikasi SAKTI & OM-SPAN.
2. Pastikan ketepatan waktu penyampaian dokumen pembayaran (SPM), pelaporan Capaian Output, dan LPJ Bendahara.
3. Koordinasikan hambatan teknis secara berkala bersama Tim Pembina MSKI KPPN Semarang I.
${cleanPrompt ? `\n💡 *Pokok Perhatian Khusus:* \n• ${cleanPrompt.replace(/\n/g, '\n• ')}\n` : ''}
📊 *Data Rekapitulasi Kinerja Satker:*
• Kode Satker: *{KODE_SATKER}*
• Nama Satker: *{NAMA_SATKER}*
• Nilai IKPA: *{NILAI_IKPA} ({PREDIKAT})*
• Batas Waktu Tindak Lanjut: *${deadline || 'Sesuai Ketentuan Terjadwal'}*

🌐 *Portal Monitoring Mandiri & Layanan Terpadu:*
https://anggaran-026.my.id

_Layanan KPPN Semarang I: Handal, Transparan, Bebas Biaya & Tanpa Gratifikasi (WBBM)._`;
    }

    return { title, category, content };
  };

  // Generate Broadcast Template using Gemini API or Smart Treasury Synthesizer
  const handleGenerateTemplateWithAi = async () => {
    setIsGenerating(true);

    const apiKey = getClientStoredApiKey();

    try {
      const systemPrompt = `Anda adalah Asisten Ahli Komunikasi Resmi & Analis Senior Perbendaharaan di KPPN Tipe A1 Semarang I (Kode 026), Ditjen Perbendaharaan (DJPb), Kementerian Keuangan RI.
Tugas Anda adalah MEMPROSES instruksi/topik dari Admin KPPN dan MENGUBAHNYA menjadi DRAF PESAN BROADCAST WHATSAPP KEDINASAN yang sangat lengkap, edukatif, jelas, elegan, dan siap dikirim ke Satuan Kerja (KPA/PPK/PPSPM/Bendahara/Operator).

ATURAN SANGAT PENTING:
1. DILARANG KERAS menyalin atau menampilkan kalimat instruksi/prompt mentah pengguna (seperti "buatkan...", "jelaskan...", "tolong ingatkan satker...").
2. SEMUA INSTRUKSI HARUS DIOLAH menjadi substansi pesan broadcast resmi Kemenkeu yang berisi:
   - Judul & Header Resmi MSKI KPPN Semarang I.
   - Sapaan hormat kedinasan kepada pejabat/operator satker.
   - Uraian latar belakang kebijakan perbendaharaan / dasar hukum (PER-5/PB/2024 / Juknis Ditjen Perbendaharaan).
   - Penjelasan substansi teknis & langkah-langkah klik-demi-klik di SAKTI / SPAN / Portal Mandiri.
   - Poin-poin checklist tindak lanjut yang wajib dilakukan Satker.
   - Batas waktu / cut-off dan konsekuensi/mitigasi risiko nilai IKPA.
   - Tautan portal mandiri: https://anggaran-026.my.id
   - Slogan integritas WBBM & kontak layanan KPPN Semarang I.
3. Gunakan placeholder variabel baku: {NAMA_SATKER}, {KODE_SATKER}, {NAMA_PEJABAT}, {NILAI_IKPA}, {PREDIKAT}, {STATUS_OUTPUT}, {DEVIASI_HAL3}, {PENYERAPAN}, {BATAS_WAKTU}.
4. Format pesan harus rapi dengan format WhatsApp (*tebal*, _miring_, numbering, dan emoji kedinasan).
5. Langsung keluarkan teks pesan WhatsApp seutuhnya tanpa kata pengantar apa pun.`;

      let userPrompt = '';
      if (isAiPolishActive && selectedTemplate) {
        userPrompt = `Poles dan sempurnakan template pesan WhatsApp berikut agar lebih elegan, rapi, menggunakan penekanan tebal/miring yang tepat, dan memiliki tata bahasa kedinasan Kemenkeu yang sempurna:

Judul Asli: ${selectedTemplate.judul}
Isi Asli:
${selectedTemplate.isiWa}

Instruksi Tambahan dari Admin:
- Nada/Gaya Bicara: ${aiTone}
- Penerima: ${aiTargetRole}
- Batas Waktu: ${aiDeadlineInput}
- Arahan Khusus: ${aiCustomInstructions || 'Sempurnakan dengan langkah teknis SAKTI dan regulasi perbendaharaan'}`;
      } else {
        userPrompt = `Buatkan Pesan WhatsApp Broadcast Resmi KPPN Semarang I dengan spesifikasi:
- Topik / Skenario: ${aiTopic === 'custom' ? aiCustomTopicTitle || 'Pengumuman Pelaksanaan Anggaran' : aiTopic}
- Gaya Bahasa: ${aiTone}
- Target Penerima: ${aiTargetRole}
- Batas Waktu: ${aiDeadlineInput}
- Pokok Materi yang Wajib Dijelaskan: ${aiCustomInstructions || 'Jelaskan tata cara dan langkah teknis penyelesaian di aplikasi SAKTI serta dampaknya pada IKPA'}

PENTING: Jangan tulis kalimat prompt ini di hasil akhir. Langsung buatkan isi pengumuman/edukasi lengkapnya!`;
      }

      const response = await generateGeminiContent({
        model: 'gemini-3.7-flash',
        prompt: userPrompt,
        systemInstruction: systemPrompt,
        apiKey: apiKey || undefined
      });

      const reply = response.text || '';
      if (reply) {
        const generatedTitle = isAiPolishActive && selectedTemplate
          ? `[Polesan AI] ${selectedTemplate.judul}`
          : aiTopic === 'custom' && aiCustomTopicTitle
          ? `[AI] ${aiCustomTopicTitle}`
          : aiTopic === 'deviasi_hal3'
          ? '[AI] Edukasi Pemutakhiran RPD & Penekanan Deviasi Hal III DIPA'
          : aiTopic === 'capaian_output'
          ? '[AI] Peringatan Batas Waktu Konfirmasi Capaian Output SAKTI'
          : aiTopic === 'penyerapan_spm'
          ? '[AI] Akselerasi Realisasi Belanja & Penyampaian SPM'
          : aiTopic === 'lpj_bendahara'
          ? '[AI] Batas Waktu Penyampaian LPJ Bendahara'
          : aiTopic === 'gup_up'
          ? '[AI] Pengingat Revolving Uang Persediaan (GUP) Bulanan'
          : aiTopic === 'kkp_digipay'
          ? '[AI] Optimalisasi Pemanfaatan KKP & Digipay Satu'
          : aiTopic === 'apresiasi_ikpa'
          ? '[AI] Apresiasi Kinerja IKPA Sangat Baik'
          : aiTopic === 'llat_akhir_tahun'
          ? '[AI] Pedoman Langkah-Langkah Akhir Tahun (LLAT)'
          : '[AI] Broadcast Pengumuman Resmi KPPN 026';

        const genCat = isAiPolishActive && selectedTemplate 
          ? selectedTemplate.jenis 
          : aiTopic === 'capaian_output' 
          ? 'Capaian Output' 
          : aiTopic === 'deviasi_hal3' || aiTopic === 'apresiasi_ikpa' 
          ? 'IKPA & Evaluasi' 
          : aiTopic === 'kkp_digipay' 
          ? 'Transaksi KKP & Digipay' 
          : aiTopic === 'gup_up' || aiTopic === 'lpj_bendahara' 
          ? 'Pengelolaan UP/TUP' 
          : 'Kustom AI';

        setGeneratedTemplateTitle(generatedTitle);
        setGeneratedTemplateCategory(genCat);
        setGeneratedTemplateContent(reply.trim());

        if (showToast) {
          showToast({
            type: 'success',
            title: 'Template AI Gemini Berhasil Dibuat! ✨',
            message: 'Template broadcast telah diproses dan siap dipasang ke editor.'
          });
        }
      } else {
        throw new Error('Respon Gemini kosong.');
      }
    } catch (err: any) {
      console.warn('Gemini generate template error, fallback to smart local synthesizer', err);
      const fallbackResult = generateLocalBroadcastTemplate(
        aiTopic,
        aiTone,
        aiCustomInstructions,
        aiTargetRole,
        aiDeadlineInput,
        isAiPolishActive ? selectedTemplate?.isiWa : undefined
      );
      setGeneratedTemplateTitle(fallbackResult.title);
      setGeneratedTemplateCategory(fallbackResult.category);
      setGeneratedTemplateContent(fallbackResult.content);

      if (showToast) {
        showToast({
          type: 'info',
          title: 'Template AI Siap! ✨',
          message: 'Template disusun otomatis melalui mesin sintesis cerdas perbendaharaan.'
        });
      }
    } finally {
      setIsGenerating(false);
      setIsAiPolishActive(false);
    }
  };

  // Save generated template to Custom Library
  const handleSaveToCustomLibrary = () => {
    if (!generatedTemplateContent) return;

    const newCustomTemplate: CustomSavedTemplate = {
      id: `custom-ai-${Date.now()}`,
      judul: generatedTemplateTitle || 'Template Kustom AI Gemini',
      jenis: generatedTemplateCategory || 'Kustom AI',
      isiWa: generatedTemplateContent,
      createdAt: new Date().toLocaleDateString('id-ID'),
      isAiGenerated: true
    };

    setCustomSavedTemplates(prev => [newCustomTemplate, ...prev]);
    setSelectedTemplate({
      id: newCustomTemplate.id,
      jenis: newCustomTemplate.jenis,
      judul: newCustomTemplate.judul,
      isiWa: newCustomTemplate.isiWa
    });
    setModalViewMode('CATALOG');
    setActiveCategory('✨ Template AI Saya');

    if (showToast) {
      showToast({
        type: 'success',
        title: 'Template Tersimpan di Katalog! 💾',
        message: 'Template kustom AI telah ditambahkan ke katalog template Anda.'
      });
    }
  };

  // Delete Custom Saved Template
  const handleDeleteCustomTemplate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Hapus template kustom ini dari koleksi Anda?')) {
      setCustomSavedTemplates(prev => prev.filter(t => t.id !== id));
      if (selectedTemplate.id === id) {
        setSelectedTemplate(REMINDER_TEMPLATES[0]);
      }
      if (showToast) {
        showToast({
          type: 'info',
          title: 'Template Dihapus',
          message: 'Template kustom telah dihapus dari koleksi.'
        });
      }
    }
  };

  // Apply to Broadcast Masif Section
  const handleApplyToBroadcast = (textToApply: string) => {
    if (onApplyTemplate) {
      onApplyTemplate(textToApply);
      onClose();
    } else {
      handleCopyText(textToApply, 'apply-btn');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-6xl w-full max-h-[94vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        
        {/* Modal Header with Mode Switcher */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-indigo-500/10 dark:from-rose-950/40 dark:via-amber-950/40 dark:to-indigo-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-rose-600 via-purple-600 to-indigo-600 text-white rounded-2xl shadow-md">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">
                  Katalog Template &amp; Generator AI Broadcast WhatsApp
                </h3>
                <span className="bg-gradient-to-r from-indigo-600 to-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs">
                  Gemini 3.7 Flash + Portal Mandiri
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Koleksi template siap salin &amp; Asisten AI untuk membuat pesan broadcast perbendaharaan dalam hitungan detik.
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-2 self-end sm:self-center">
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setModalViewMode('CATALOG')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                  modalViewMode === 'CATALOG'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Katalog Template ({allAvailableTemplates.length})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setModalViewMode('AI_GENERATOR');
                  if (!generatedTemplateContent) {
                    handleGenerateTemplateWithAi();
                  }
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                  modalViewMode === 'AI_GENERATOR'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm'
                    : 'text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>✨ Buat Template AI</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-2xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content - VIEW 1: Standard Catalog Browser */}
        {modalViewMode === 'CATALOG' && (
          <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800">
            
            {/* Left Column: Template Catalog & Filters */}
            <div className="lg:col-span-5 p-5 space-y-4 flex flex-col bg-slate-50/50 dark:bg-slate-950/40">
              
              {/* Quick AI Create Banner Button */}
              <button
                type="button"
                onClick={() => {
                  setModalViewMode('AI_GENERATOR');
                  if (!generatedTemplateContent) {
                    handleGenerateTemplateWithAi();
                  }
                }}
                className="w-full p-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-600 hover:opacity-95 text-white font-extrabold text-xs shadow-md flex items-center justify-between gap-2 cursor-pointer transition-all active:scale-98"
              >
                <div className="flex items-center gap-2 text-left">
                  <div className="p-1.5 rounded-xl bg-white/20">
                    <Sparkles className="w-4 h-4 text-amber-300" />
                  </div>
                  <div>
                    <span className="block leading-tight font-black">Butuh Template Khusus?</span>
                    <span className="text-[10px] text-indigo-100 block font-medium">Buatkan format baru otomatis dengan AI Gemini</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-white/80 shrink-0" />
              </button>

              {/* Search Box */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari kata kunci template (misal: KKP, Output, UP)..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* Category Badges */}
              <div className="flex flex-wrap gap-1.5">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeCategory === cat
                        ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/30'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    {cat === 'ALL' ? 'Semua Topik' : cat}
                  </button>
                ))}
              </div>

              {/* Template List Cards */}
              <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[460px] pr-1">
                {filteredTemplates.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-xs">
                    Tidak ditemukan template yang cocok.
                  </div>
                ) : (
                  filteredTemplates.map(template => {
                    const isSelected = selectedTemplate.id === template.id;
                    const isCustom = customSavedTemplates.some(c => c.id === template.id);

                    return (
                      <div
                        key={template.id}
                        onClick={() => setSelectedTemplate(template)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                          isSelected
                            ? 'bg-white dark:bg-slate-900 border-rose-500 shadow-md ring-2 ring-rose-500/20'
                            : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                              {template.jenis}
                            </span>
                            {isCustom && (
                              <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5" /> AI Kustom
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            {isCustom && (
                              <button
                                type="button"
                                onClick={(e) => handleDeleteCustomTemplate(template.id, e)}
                                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-all cursor-pointer"
                                title="Hapus template kustom ini"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTemplate(template);
                                handleCopyText(template.isiWa, template.id);
                              }}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-rose-600 hover:text-white text-slate-700 dark:text-slate-300 transition-all flex items-center gap-1 cursor-pointer"
                              title="Salin langsung template ini"
                            >
                              {copiedId === template.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                              <span>{copiedId === template.id ? 'Tersalin' : 'Copy'}</span>
                            </button>
                          </div>
                        </div>

                        <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 line-clamp-2">
                          {template.judul}
                        </h4>

                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 font-mono">
                          {template.isiWa.slice(0, 100)}...
                        </p>
                      </div>
                    );
                  })
                )}
              </div>

            </div>

            {/* Right Column: Live Formatter Preview & Copy Action */}
            <div className="lg:col-span-7 p-5 sm:p-6 space-y-4 flex flex-col justify-between bg-white dark:bg-slate-900">
              
              <div className="space-y-4">
                
                {/* Quick Satker Picker */}
                {masterSatkers.length > 0 && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-sky-500" />
                      <span className="font-bold text-slate-700 dark:text-slate-300">Pilih Satker Contoh Otomatis:</span>
                    </div>
                    <select
                      value={customVars.kodeSatker}
                      onChange={(e) => handleSatkerChange(e.target.value)}
                      className="p-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs focus:ring-1 focus:ring-rose-500 max-w-xs"
                    >
                      {masterSatkers.slice(0, 60).map(m => (
                        <option key={m.kodeSatker} value={m.kodeSatker}>
                          [{m.kodeSatker}] {m.namaSatker.slice(0, 35)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Title & Action Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider block">
                      KATEGORI: {selectedTemplate.jenis}
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">
                      {selectedTemplate.judul}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {/* Polish with AI Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsAiPolishActive(true);
                        setModalViewMode('AI_GENERATOR');
                        setAiCustomInstructions(`Poles template "${selectedTemplate.judul}" ini agar lebih persuasif, rapi, dan sesuai dengan situasi satker.`);
                        handleGenerateTemplateWithAi();
                      }}
                      className="px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                      title="Gunakan AI untuk memoles dan menyesuaikan template ini"
                    >
                      <Wand2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>Poles dengan AI</span>
                    </button>

                    {/* Copy Button */}
                    <button
                      onClick={() => handleCopyText(renderedWaText, 'main-btn')}
                      className="bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-black text-xs px-4 py-2 rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                    >
                      {copiedId === 'main-btn' ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedId === 'main-btn' ? 'Tersalin! 📋' : 'Salin Pesan WA'}</span>
                    </button>

                    {/* Apply to Broadcast Button (if prop passed) */}
                    {onApplyTemplate && (
                      <button
                        type="button"
                        onClick={() => handleApplyToBroadcast(selectedTemplate.isiWa)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-4 py-2 rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                        title="Pasang template ini langsung ke Form Kirim Broadcast Masif"
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-300" />
                        <span>Pasang ke Broadcast</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* WhatsApp Mockup Preview Box */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                    <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <MessageSquare className="w-4 h-4" />
                      Preview Tampilan Pesan WhatsApp (Siap Kirim):
                    </span>
                    <span className="font-mono text-[11px] text-slate-400">
                      Tautan Aktif: anggaran-026.my.id
                    </span>
                  </div>

                  <div className="bg-[#e5ddd5] dark:bg-slate-950 p-4 sm:p-5 rounded-3xl border border-slate-300 dark:border-slate-800 shadow-inner max-h-[360px] overflow-y-auto space-y-3">
                    
                    {/* WhatsApp Rich Link Preview Card Simulation */}
                    <div className="bg-[#f0f2f5] dark:bg-slate-800/90 rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-700 shadow-sm max-w-sm ml-auto">
                      <div className="w-full h-24 bg-slate-900 overflow-hidden relative flex items-center justify-center">
                        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-900/80 via-purple-900/70 to-slate-900 z-0" />
                        <div className="relative z-10 text-center px-4">
                          <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider block">KPPN SEMARANG I (026)</span>
                          <h5 className="text-white font-black text-xs leading-tight mt-0.5">ANGKASA V3.2 - Portal Akselerasi &amp; Juknis Satker</h5>
                          <span className="text-[9px] text-slate-300 block mt-1 font-mono">anggaran-026.my.id</span>
                        </div>
                      </div>
                      <div className="p-2.5 bg-white dark:bg-slate-800 text-[11px]">
                        <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">
                          ANGKASA - Aplikasi Navigasi Keuangan &amp; Akselerasi Satuan Kerja
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                          Monitoring IKPA, Capaian Output SAKTI, Batas Waktu UP/TUP, Juknis &amp; Blangko Resmi.
                        </span>
                      </div>
                    </div>

                    {/* Main Bubble Message Text */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-md text-xs font-sans text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap select-text border border-emerald-500/20">
                      {renderedWaText}
                    </div>
                  </div>

                  {/* WA Link Card Tip */}
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/60 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong>Tips Tampilan Banner WhatsApp:</strong> Saat mem-<em>paste</em> teks ke WhatsApp, <strong>tunggu 2-3 detik</strong> sebelum menekan tombol kirim agar thumbnail web <code>https://anggaran-026.my.id</code> muncul otomatis.
                    </div>
                  </div>
                </div>

              </div>

              {/* Bottom Bar: Quick Share to WA Web */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                  <Globe className="w-4 h-4 text-sky-500" />
                  <span>Portal Resmi KPPN 026: <strong>https://anggaran-026.my.id</strong></span>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(renderedWaText)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Buka Langsung di WhatsApp Web</span>
                  </a>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* Modal Content - VIEW 2: AI TEMPLATE GENERATOR CONSOLE */}
        {modalViewMode === 'AI_GENERATOR' && (
          <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800">
            
            {/* Left Column: AI Parameters & Generation Controls */}
            <div className="lg:col-span-5 p-5 space-y-4 flex flex-col bg-slate-50/70 dark:bg-slate-950/60 overflow-y-auto max-h-[78vh]">
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-xs">
                    <Wand2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      Parameter Pembuatan Template AI
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Tentukan topik, gaya bahasa, dan instruksi khusus Anda.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setModalViewMode('CATALOG')}
                  className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                >
                  Lihat Katalog
                </button>
              </div>

              {/* Topic Scenario Picker */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-indigo-500" />
                  Pilih Topik / Skenario Broadcast:
                </label>
                <select
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value as AiGeneratorTopic)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="capaian_output">🔴 Konfirmasi &amp; Batas Capaian Output SAKTI</option>
                  <option value="deviasi_hal3">📊 Deviasi Hal III DIPA &amp; Pemutakhiran RPD</option>
                  <option value="penyerapan_spm">💸 Akselerasi Realisasi Belanja &amp; SPM Kontraktual</option>
                  <option value="lpj_bendahara">⏱️ Batas Waktu Penyampaian LPJ Bendahara</option>
                  <option value="gup_up">⏳ Revolving Uang Persediaan (SPM GUP) Bulanan</option>
                  <option value="kkp_digipay">💳 Transaksi KKP &amp; Belanja Marketplace Digipay Satu</option>
                  <option value="apresiasi_ikpa">🏆 Apresiasi Kinerja IKPA Sangat Baik / Nilai 100</option>
                  <option value="llat_akhir_tahun">🚨 Langkah-Langkah Akhir Tahun Anggaran (LLAT)</option>
                  <option value="custom">✍️ Topik Kustom Lainnya (Ketik Manual)...</option>
                </select>
              </div>

              {/* Custom Topic Title (If Custom selected) */}
              {aiTopic === 'custom' && (
                <div className="space-y-1 animate-fadeIn">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Judul Topik Kustom:
                  </label>
                  <input
                    type="text"
                    value={aiCustomTopicTitle}
                    onChange={(e) => setAiCustomTopicTitle(e.target.value)}
                    placeholder="Misal: Undangan Sosialisasi Peraturan Baru..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              {/* Tone / Gaya Bahasa */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-purple-500" />
                  Gaya Bahasa (Tone of Voice):
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAiTone('formal')}
                    className={`p-2 rounded-xl text-xs font-bold border text-left transition-all ${
                      aiTone === 'formal'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    💼 Kedinasan Resmi
                  </button>
                  <button
                    type="button"
                    onClick={() => setAiTone('urgent')}
                    className={`p-2 rounded-xl text-xs font-bold border text-left transition-all ${
                      aiTone === 'urgent'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    🚨 Peringatan Tegas / Urgent
                  </button>
                  <button
                    type="button"
                    onClick={() => setAiTone('persuasif')}
                    className={`p-2 rounded-xl text-xs font-bold border text-left transition-all ${
                      aiTone === 'persuasif'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    🤝 Santun &amp; Edukatif
                  </button>
                  <button
                    type="button"
                    onClick={() => setAiTone('apresiasi')}
                    className={`p-2 rounded-xl text-xs font-bold border text-left transition-all ${
                      aiTone === 'apresiasi'
                        ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs font-black'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    🏆 Apresiasi / Pujian
                  </button>
                </div>
              </div>

              {/* Target Role & Deadline Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Target Penerima:
                  </label>
                  <input
                    type="text"
                    value={aiTargetRole}
                    onChange={(e) => setAiTargetRole(e.target.value)}
                    placeholder="KPA / PPK / Bendahara"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Batas Waktu (Deadline):
                  </label>
                  <input
                    type="text"
                    value={aiDeadlineInput}
                    onChange={(e) => setAiDeadlineInput(e.target.value)}
                    placeholder="Tanggal 10 Pukul 17.00 WIB"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Custom Freeform Prompt Instructions */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Instruksi Khusus untuk AI:</span>
                  <span className="text-[10px] text-slate-400 font-normal">Opsional</span>
                </label>
                <textarea
                  rows={2}
                  value={aiCustomInstructions}
                  onChange={(e) => setAiCustomInstructions(e.target.value)}
                  placeholder="Contoh: Tekankan sanksi penundaan SP2D, tambahkan nomor kontak helpdesk MSKI 0812-3456-7890..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Action Button to Generate with AI */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleGenerateTemplateWithAi}
                  disabled={isGenerating}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:opacity-95 text-white font-black text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                      <span>Menyusun Pesan dengan AI Gemini...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>✨ Susun Template Pesan Ini (1-Klik)</span>
                    </>
                  )}
                </button>
              </div>

              {/* Quick Prompt Suggestions */}
              <div className="space-y-1 pt-1">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Saran Cepat:</span>
                <div className="flex flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setAiTopic('capaian_output');
                      setAiTone('urgent');
                      setAiCustomInstructions('Tuliskan peringatan keras batas waktu pengisian konfirmasi capaian output sebelum tanggal 10.');
                      handleGenerateTemplateWithAi();
                    }}
                    className="text-[10px] bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer"
                  >
                    ⚡ Output Deadline Alert
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAiTopic('deviasi_hal3');
                      setAiTone('formal');
                      setAiCustomInstructions('Jelaskan tata cara revisi Hal III DIPA di SAKTI dan sinkronisasi RPD.');
                      handleGenerateTemplateWithAi();
                    }}
                    className="text-[10px] bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer"
                  >
                    ⚡ Panduan RPD Hal III
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAiTopic('apresiasi_ikpa');
                      setAiTone('apresiasi');
                      setAiCustomInstructions('Berikan ucapan selamat atas perolehan nilai IKPA 100 kepada seluruh tim satker.');
                      handleGenerateTemplateWithAi();
                    }}
                    className="text-[10px] bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer"
                  >
                    ⚡ Apresiasi Nilai 100
                  </button>
                </div>
              </div>

            </div>

            {/* Right Column: AI Output Result, Editor & Actions */}
            <div className="lg:col-span-7 p-5 sm:p-6 space-y-4 flex flex-col justify-between bg-white dark:bg-slate-900 overflow-y-auto">
              
              <div className="space-y-4">
                
                {/* Result Header & Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                        HASIL GENERATOR AI: {generatedTemplateCategory}
                      </span>
                      <span className="px-2 py-0.2 rounded-full text-[9px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        Siap Kirim WhatsApp
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 mt-0.5">
                      {generatedTemplateTitle || 'Template Pesan Broadcast AI'}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Copy Result */}
                    <button
                      type="button"
                      onClick={() => handleCopyText(renderedGeneratedWaText || generatedTemplateContent, 'ai-copy-btn')}
                      disabled={!generatedTemplateContent}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {copiedId === 'ai-copy-btn' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId === 'ai-copy-btn' ? 'Tersalin' : 'Salin Teks'}</span>
                    </button>

                    {/* Save to Catalog Button */}
                    <button
                      type="button"
                      onClick={handleSaveToCustomLibrary}
                      disabled={!generatedTemplateContent}
                      className="px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      title="Simpan ke daftar katalog template permanen"
                    >
                      <BookmarkPlus className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>Simpan ke Katalog</span>
                    </button>

                    {/* Apply to Broadcast Section Button */}
                    {onApplyTemplate && (
                      <button
                        type="button"
                        onClick={() => handleApplyToBroadcast(generatedTemplateContent)}
                        disabled={!generatedTemplateContent}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                        title="Pasang template hasil AI ini ke Editor Broadcast Utama"
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-300" />
                        <span>Pasang ke Broadcast</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Editable Content Box / WhatsApp Mockup */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                    <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <MessageSquare className="w-4 h-4" />
                      Preview Pesan WhatsApp (Dapat Diedit Langsung):
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {generatedTemplateContent.length} karakter
                    </span>
                  </div>

                  {/* Direct Editable Textarea */}
                  <textarea
                    rows={12}
                    value={generatedTemplateContent}
                    onChange={(e) => setGeneratedTemplateContent(e.target.value)}
                    placeholder="Hasil template dari AI Gemini akan muncul di sini dan dapat Anda edit bebas..."
                    className="w-full p-4 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-900 dark:text-slate-100 leading-relaxed focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-inner resize-y max-h-[380px]"
                  />

                  {/* WhatsApp Rich Link Preview Card */}
                  <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <span className="text-indigo-900 dark:text-indigo-200 text-[11px]">
                        Tautan Portal Mandiri Tersemat: <strong>https://anggaran-026.my.id</strong>
                      </span>
                    </div>
                    <span className="text-[10px] bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full font-bold border border-indigo-200 dark:border-indigo-800 shrink-0">
                      Auto Rich Link WA
                    </span>
                  </div>
                </div>

              </div>

              {/* Bottom Actions Bar */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Didukung Mesin Sintesis Format DJPb &amp; Google Gemini</span>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(renderedGeneratedWaText || generatedTemplateContent)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-sm transition-all ${
                      !generatedTemplateContent ? 'opacity-50 pointer-events-none' : ''
                    }`}
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Kirim Lewat WhatsApp Web</span>
                  </a>
                </div>
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
};
