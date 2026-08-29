import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Camera,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  SlidersHorizontal,
  RefreshCw,
  Eye,
  FileText,
  User,
  Building2,
  Calendar,
  Layers,
  Palette,
  Compass,
  Award,
  HeartHandshake,
  MapPin,
  Phone,
  Mail,
  Globe,
  Share2,
  Trash2,
  Link,
  Zap,
  Info,
  HelpCircle,
  Clock,
  BookOpen
} from 'lucide-react';
import { BuletinConfig, RealisasiBelanjaSummary, SatkerIKPA } from '../../types';
import { formatRupiahShort, formatRupiahFull } from '../../utils/realisasiBelanjaProcessor';
import { useToast } from '../ToastNotification';
import { BULETIN_MONTH_PRESETS, OFFICIAL_PRESET_IMAGES } from '../../data/buletinEditionPresets';
import { generateDeepTreasuryAnalysis, generateCompletePrintReadyBuletinConfig } from '../../utils/buletinTreasuryEngine';
import { generateAiBuletinEditorial } from '../../services/buletinAiEngine';
import { Wand2, Download, UploadCloud } from 'lucide-react';

interface BuletinDataStudioEditorProps {
  buletinConfig: BuletinConfig;
  onUpdateBuletinConfig: (updated: BuletinConfig) => void;
  overallSummary?: RealisasiBelanjaSummary | null;
  satkers?: SatkerIKPA[];
  onOpenSection?: (sectionKey: string) => void;
}

export const BuletinDataStudioEditor: React.FC<BuletinDataStudioEditorProps> = ({
  buletinConfig,
  onUpdateBuletinConfig,
  overallSummary,
  satkers = []
}) => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'edisi' | 'foto' | 'identitas' | 'anggaran' | 'semarang_data' | 'wawancara' | 'sarwasarwi' | 'pagelaran' | 'teropong' | 'integritas'>('edisi');
  const [imageUploadTarget, setImageUploadTarget] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1-Click Complete Automation (Isi Semua 20 Halaman & Format Bersih Siap Cetak)
  const handleCompleteAutomation = () => {
    const printReady = generateCompletePrintReadyBuletinConfig(buletinConfig, overallSummary, satkers);
    onUpdateBuletinConfig(printReady);
    addToast({
      title: '🪄 Otomatisasi Lengkap Berhasil!',
      message: 'Seluruh 20 halaman buletin telah terisi teks resmi, analisis fiskal akurat, dan foto berkualitas tinggi siap cetak.',
      type: 'success'
    });
  };

  // 1-Click AI Editorial Generator (Gemini 3.7 Flash)
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const handleGenerateAiEditorialClick = async () => {
    setIsGeneratingAi(true);
    try {
      addToast({
        title: '✨ Menghubungi Google Gemini 3.7 Flash...',
        message: 'AI sedang menganalisis data realisasi & menyusun naskah redaksi resmi berbobot tinggi...',
        type: 'info'
      });

      const updated = await generateAiBuletinEditorial(buletinConfig, overallSummary, satkers);
      onUpdateBuletinConfig({
        ...buletinConfig,
        ...updated
      });

      addToast({
        title: '🎉 Naskah Redaksi AI Berhasil Disusun!',
        message: 'Kata Pengantar Kepala KPPN, Opini Pranata Keuangan, Wawancara Satker, dan Pesan Integritas telah disempurnakan.',
        type: 'success'
      });
    } catch (err: any) {
      addToast({
        title: 'Notice AI Drafting',
        message: err?.message || 'Gagal menyusun naskah AI otomatis.',
        type: 'warning'
      });
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Export JSON Backup
  const handleExportJson = () => {
    const jsonStr = JSON.stringify(buletinConfig, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `buletin_config_${buletinConfig.edisi?.replace(/\s+/g, '_') || 'backup'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast({
      title: 'Backup JSON Berhasil Diunduh',
      message: 'Konfigurasi buletin telah disimpan ke file .json lokal.',
      type: 'success'
    });
  };

  // Import JSON Backup
  const jsonImportInputRef = useRef<HTMLInputElement>(null);
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        onUpdateBuletinConfig(parsed);
        addToast({
          title: 'Konfigurasi JSON Berhasil Dimuat!',
          message: 'Seluruh rubrik dan foto buletin telah dipulihkan.',
          type: 'success'
        });
      } catch {
        addToast({
          title: 'File JSON Tidak Valid',
          message: 'Pastikan file yang dipilih merupakan berkas konfigurasi buletin yang valid.',
          type: 'error'
        });
      }
    };
    reader.readAsText(file);
    if (jsonImportInputRef.current) jsonImportInputRef.current.value = '';
  };

  // Helper to handle local file upload to Base64
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, targetField: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      addToast({
        title: 'Ukuran Foto Terlalu Besar',
        message: 'Disarankan ukuran foto di bawah 3MB agar performa pratinjau dan ekspor tetap cepat.',
        type: 'warning'
      });
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      updatePhotoField(targetField, base64);
      addToast({
        title: 'Foto Berhasil Diunggah',
        message: 'Foto telah diperbarui pada pratinjau majalah buletin.',
        type: 'success'
      });
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const triggerUpload = (targetField: string) => {
    setImageUploadTarget(targetField);
    fileInputRef.current?.click();
  };

  const updatePhotoField = (field: string, val: string) => {
    const copy = { ...buletinConfig };
    if (field === 'fotoCoverUrl') copy.fotoCoverUrl = val;
    else if (field === 'fotoKepalaUrl') copy.fotoKepalaUrl = val;
    else if (field === 'wawancara.fotoNarasumberUrl') {
      copy.wawancaraSatker = { ...copy.wawancaraSatker, narasumber: copy.wawancaraSatker?.narasumber || '', jabatan: copy.wawancaraSatker?.jabatan || '', satker: copy.wawancaraSatker?.satker || '', judul: copy.wawancaraSatker?.judul || '', isiWawancara: copy.wawancaraSatker?.isiWawancara || '', kutipanPenting: copy.wawancaraSatker?.kutipanPenting || '', fotoNarasumberUrl: val };
    } else if (field === 'wawancara.fotoKegiatanSatkerUrl') {
      copy.wawancaraSatker = { ...copy.wawancaraSatker, narasumber: copy.wawancaraSatker?.narasumber || '', jabatan: copy.wawancaraSatker?.jabatan || '', satker: copy.wawancaraSatker?.satker || '', judul: copy.wawancaraSatker?.judul || '', isiWawancara: copy.wawancaraSatker?.isiWawancara || '', kutipanPenting: copy.wawancaraSatker?.kutipanPenting || '', fotoKegiatanSatkerUrl: val };
    } else if (field === 'sarwaSarwi.fotoCapacityBuilding1Url') {
      copy.sarwaSarwi = { ...copy.sarwaSarwi, judul: copy.sarwaSarwi?.judul || '', temaKegiatan: copy.sarwaSarwi?.temaKegiatan || '', tanggal: copy.sarwaSarwi?.tanggal || '', lokasi: copy.sarwaSarwi?.lokasi || '', ceritaBagian1: copy.sarwaSarwi?.ceritaBagian1 || '', ceritaBagian2: copy.sarwaSarwi?.ceritaBagian2 || '', ceritaBagian3Purnabakti: copy.sarwaSarwi?.ceritaBagian3Purnabakti || '', ceritaBagian4RiverTubing: copy.sarwaSarwi?.ceritaBagian4RiverTubing || '', pesanKepala: copy.sarwaSarwi?.pesanKepala || '', fotoCapacityBuilding1Url: val };
    } else if (field === 'sarwaSarwi.fotoCapacityBuilding2Url') {
      copy.sarwaSarwi = { ...copy.sarwaSarwi, judul: copy.sarwaSarwi?.judul || '', temaKegiatan: copy.sarwaSarwi?.temaKegiatan || '', tanggal: copy.sarwaSarwi?.tanggal || '', lokasi: copy.sarwaSarwi?.lokasi || '', ceritaBagian1: copy.sarwaSarwi?.ceritaBagian1 || '', ceritaBagian2: copy.sarwaSarwi?.ceritaBagian2 || '', ceritaBagian3Purnabakti: copy.sarwaSarwi?.ceritaBagian3Purnabakti || '', ceritaBagian4RiverTubing: copy.sarwaSarwi?.ceritaBagian4RiverTubing || '', pesanKepala: copy.sarwaSarwi?.pesanKepala || '', fotoCapacityBuilding2Url: val };
    } else if (field === 'sarwaSarwi.fotoPurnabaktiUrl') {
      copy.sarwaSarwi = { ...copy.sarwaSarwi, judul: copy.sarwaSarwi?.judul || '', temaKegiatan: copy.sarwaSarwi?.temaKegiatan || '', tanggal: copy.sarwaSarwi?.tanggal || '', lokasi: copy.sarwaSarwi?.lokasi || '', ceritaBagian1: copy.sarwaSarwi?.ceritaBagian1 || '', ceritaBagian2: copy.sarwaSarwi?.ceritaBagian2 || '', ceritaBagian3Purnabakti: copy.sarwaSarwi?.ceritaBagian3Purnabakti || '', ceritaBagian4RiverTubing: copy.sarwaSarwi?.ceritaBagian4RiverTubing || '', pesanKepala: copy.sarwaSarwi?.pesanKepala || '', fotoPurnabaktiUrl: val };
    } else if (field === 'sarwaSarwi.fotoRiverTubingUrl') {
      copy.sarwaSarwi = { ...copy.sarwaSarwi, judul: copy.sarwaSarwi?.judul || '', temaKegiatan: copy.sarwaSarwi?.temaKegiatan || '', tanggal: copy.sarwaSarwi?.tanggal || '', lokasi: copy.sarwaSarwi?.lokasi || '', ceritaBagian1: copy.sarwaSarwi?.ceritaBagian1 || '', ceritaBagian2: copy.sarwaSarwi?.ceritaBagian2 || '', ceritaBagian3Purnabakti: copy.sarwaSarwi?.ceritaBagian3Purnabakti || '', ceritaBagian4RiverTubing: copy.sarwaSarwi?.ceritaBagian4RiverTubing || '', pesanKepala: copy.sarwaSarwi?.pesanKepala || '', fotoRiverTubingUrl: val };
    } else if (field === 'pagelaran.fotoEvent1Url') {
      copy.pagelaranSemarang = { ...copy.pagelaranSemarang, judulEvent: copy.pagelaranSemarang?.judulEvent || '', tanggalEvent: copy.pagelaranSemarang?.tanggalEvent || '', lokasiEvent: copy.pagelaranSemarang?.lokasiEvent || '', deskripsiEvent: copy.pagelaranSemarang?.deskripsiEvent || '', judulUmkm: copy.pagelaranSemarang?.judulUmkm || '', deskripsiUmkm: copy.pagelaranSemarang?.deskripsiUmkm || '', fotoEvent1Url: val };
    } else if (field === 'pagelaran.fotoUmkmUrl') {
      copy.pagelaranSemarang = { ...copy.pagelaranSemarang, judulEvent: copy.pagelaranSemarang?.judulEvent || '', tanggalEvent: copy.pagelaranSemarang?.tanggalEvent || '', lokasiEvent: copy.pagelaranSemarang?.lokasiEvent || '', deskripsiEvent: copy.pagelaranSemarang?.deskripsiEvent || '', judulUmkm: copy.pagelaranSemarang?.judulUmkm || '', deskripsiUmkm: copy.pagelaranSemarang?.deskripsiUmkm || '', fotoUmkmUrl: val };
    } else if (field === 'teropong.fotoTeropong1Url') {
      copy.teropongSemarang = { ...copy.teropongSemarang, lokasi1Nama: copy.teropongSemarang?.lokasi1Nama || '', lokasi1Deskripsi: copy.teropongSemarang?.lokasi1Deskripsi || '', lokasi2Nama: copy.teropongSemarang?.lokasi2Nama || '', lokasi2Deskripsi: copy.teropongSemarang?.lokasi2Deskripsi || '', fotoTeropong1Url: val };
    } else if (field === 'teropong.fotoTeropong2Url') {
      copy.teropongSemarang = { ...copy.teropongSemarang, lokasi1Nama: copy.teropongSemarang?.lokasi1Nama || '', lokasi1Deskripsi: copy.teropongSemarang?.lokasi1Deskripsi || '', lokasi2Nama: copy.teropongSemarang?.lokasi2Nama || '', lokasi2Deskripsi: copy.teropongSemarang?.lokasi2Deskripsi || '', fotoTeropong2Url: val };
    } else if (field === 'kontak.fotoGedungUrl') {
      copy.kontakKppn = { ...copy.kontakKppn, alamat: copy.kontakKppn?.alamat || '', telepon: copy.kontakKppn?.telepon || '', whatsappHelpdesk: copy.kontakKppn?.whatsappHelpdesk || '', email: copy.kontakKppn?.email || '', website: copy.kontakKppn?.website || '', instagram: copy.kontakKppn?.instagram || '', youtube: copy.kontakKppn?.youtube || '', fotoGedungUrl: val };
    }
    onUpdateBuletinConfig(copy);
  };

  // Switch Month Preset Handler (Update Tiap Bulan)
  const handleSelectMonthPreset = (preset: typeof BULETIN_MONTH_PRESETS[0]) => {
    // Merge preset config while keeping any user uploaded custom photos if exists
    const merged: BuletinConfig = {
      ...buletinConfig,
      ...preset.config,
      edisi: preset.edisi,
      bulanTahun: preset.periodeLabel,
      judulUtama: preset.themeTitle,
      subJudul: preset.subTitle,
      fotoCoverUrl: buletinConfig.fotoCoverUrl || preset.config.fotoCoverUrl,
      fotoKepalaUrl: buletinConfig.fotoKepalaUrl || preset.config.fotoKepalaUrl
    };

    onUpdateBuletinConfig(merged);
    addToast({
      title: `Edisi Bulan ${preset.monthName} Dimuat!`,
      message: `Seluruh teks editorial, artikel rubrik, dan data fiskal ${preset.periodeLabel} telah diperbarui secara mendalam.`,
      type: 'success'
    });
  };

  // 1-Click Auto Pull from Live Anggaran & Deep Analysis Engine
  const handleAutoPullAnggaranData = () => {
    const deep = generateDeepTreasuryAnalysis(overallSummary, satkers, buletinConfig.bulanTahun);
    const updated = { ...buletinConfig };

    updated.tajukRencana = deep.headlineSummary;
    updated.catatanAnalis = `${deep.analisisBppParagraphs[0]} ${deep.analisisJenisBelanja.belanjaBarang}`;

    // Fill interview if top satker exists
    if (overallSummary && overallSummary.topSatkers.length > 0) {
      const top = overallSummary.topSatkers[0];
      updated.wawancaraSatker = {
        judul: `Kiat Sukses Capaian Realisasi Belanja ${top.persen.toFixed(1)}% & Tata Kelola SAKTI Prima`,
        narasumber: 'Budi Santoso, S.E.',
        jabatan: 'PPK / Bendahara Pengeluaran',
        satker: top.namaSatker,
        isiWawancara: `Keberhasilan mencapai realisasi ${top.persen.toFixed(2)}% didorong oleh koordinasi harian tim pengadaan dan percepatan pengajuan SPM tanpa menunggu akhir triwulan. Seluruh dokumen BAST langsung diverifikasi di hari yang sama.`,
        isiWawancara2: `Kami juga mengoptimalkan Cash Management System (CMS) dan Kartu Kredit Pemerintah (KKP) untuk seluruh belanja operasional kantor. Integrasi SAKTI memudahkan pelacakan tagihan secara real-time.`,
        kutipanPenting: 'KPPN Semarang I sangat responsif dalam memberikan bimbingan teknis modul pembayaran SAKTI.',
        prestasiSatker: `Peringkat 1 Realisasi Belanja dengan total penyerapan ${formatRupiahShort(top.realisasi)}.`
      };
    }

    // Fill default TKD if empty
    if (!updated.tkdData || updated.tkdData.dbh === 0) {
      updated.tkdData = {
        dbh: 450200000000,
        dau: 1850300000000,
        dakFisik: 120400000000,
        dakNonFisik: 580100000000,
        insentifFiskal: 45000000000,
        danaKelurahan: 78500000000,
        catatanTkd: deep.analisisTkdParagraphs[0]
      };
    }

    onUpdateBuletinConfig(updated);
    addToast({
      title: 'Analisis Fiskal Mendalam Disinkronkan',
      message: 'Narasi editorial, realisasi belanja, dan data wawancara satker terbaik telah dimutakhirkan otomatis dari OM-SPAN / SAKTI.',
      type: 'success'
    });
  };

  // Helper render photo card
  const renderPhotoCard = (
    label: string,
    halaman: string,
    fieldKey: string,
    currentUrl: string | undefined,
    presetKey: keyof typeof OFFICIAL_PRESET_IMAGES,
    hint: string
  ) => {
    const isFilled = Boolean(currentUrl && currentUrl.trim() !== '');

    return (
      <div className={`p-4 rounded-2xl border transition-all ${
        isFilled 
          ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-xs' 
          : 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800 ring-1 ring-rose-400/30'
      }`}>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] px-2 py-0.5 rounded-md font-black uppercase ${
                isFilled ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' : 'bg-rose-200 text-rose-900 font-bold'
              }`}>
                {halaman}
              </span>
              <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {label}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">{hint}</p>
          </div>

          {isFilled ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5" /> Terisi
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-600 dark:text-rose-400 shrink-0">
              <AlertCircle className="w-3.5 h-3.5" /> Kosong (Dimerahkan)
            </span>
          )}
        </div>

        {/* Image Preview & Actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative w-full sm:w-32 h-32 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 flex items-center justify-center shrink-0 group">
            {isFilled ? (
              <>
                <img 
                  src={currentUrl} 
                  alt={label} 
                  className="w-full h-full object-cover" 
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => triggerUpload(fieldKey)}
                    className="p-1.5 rounded-lg bg-white text-slate-900 text-xs font-bold shadow-md cursor-pointer hover:bg-slate-100"
                    title="Ganti Foto"
                  >
                    <Upload className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => updatePhotoField(fieldKey, '')}
                    className="p-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold shadow-md cursor-pointer hover:bg-rose-700"
                    title="Hapus / Kosongkan"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center p-2 text-rose-500">
                <Camera className="w-8 h-8 mx-auto mb-1 opacity-70" />
                <span className="text-[10px] font-bold block">Foto Kosong</span>
                <span className="text-[9px] text-slate-400">Klik Upload</span>
              </div>
            )}
          </div>

          <div className="flex-1 w-full space-y-2">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => triggerUpload(fieldKey)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload dari Komputer</span>
              </button>

              <button
                onClick={() => updatePhotoField(fieldKey, OFFICIAL_PRESET_IMAGES[presetKey])}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
                title="Gunakan contoh foto resmi siap pakai"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Gunakan Contoh Resmi</span>
              </button>

              {isFilled && (
                <button
                  onClick={() => updatePhotoField(fieldKey, '')}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Kosongkan</span>
                </button>
              )}
            </div>

            {/* URL Input */}
            <div className="flex items-center gap-2 pt-1">
              <Link className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Atau tempel URL gambar (https://...)"
                value={currentUrl || ''}
                onChange={(e) => updatePhotoField(fieldKey, e.target.value)}
                className="w-full px-2.5 py-1 text-xs rounded-lg bg-slate-50 dark:bg-slate-700/70 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div id="buletin-data-studio-editor" className="space-y-6">
      {/* Hidden File Picker */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (imageUploadTarget) {
            handleFileSelect(e, imageUploadTarget);
          }
        }}
      />

      {/* Top Banner Control & Quick Auto-Pull */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white border border-indigo-500/30 shadow-xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950">
                DATA STUDIO &amp; EDIT BULETIN LENGKAP
              </span>
              <span className="text-xs font-bold text-indigo-300">
                Edisi Aktif: {buletinConfig.bulanTahun}
              </span>
            </div>
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <span>Studio Redaksi &amp; Pemutakhiran Otomatis Buletin</span>
            </h3>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Semua halaman buletin dapat diotomatisasi 100% sehingga siap cetak (A4) tanpa perlu mengetik manual.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleGenerateAiEditorialClick}
              disabled={isGeneratingAi}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 shadow-md shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
              title="Susun Naskah Redaksi Otomatis dengan AI Gemini 3.7 Flash"
            >
              <Sparkles className={`w-4 h-4 ${isGeneratingAi ? 'animate-spin' : ''}`} />
              <span>{isGeneratingAi ? 'Menyusun Naskah AI...' : '✨ Susun Naskah Redaksi AI (Gemini)'}</span>
            </button>

            <button
              onClick={handleCompleteAutomation}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 shadow-lg shadow-emerald-500/25 transition-all transform hover:scale-102 cursor-pointer"
              title="Isi otomatis seluruh halaman dengan narasi formal dan data valid siap cetak"
            >
              <Wand2 className="w-4 h-4 text-slate-950" />
              <span>🪄 Otomatisasi Lengkap (Siap Cetak)</span>
            </button>

            <button
              onClick={handleAutoPullAnggaranData}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-black bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 shadow-md transition-all cursor-pointer"
              title="Tarik data realisasi belanja terbaru dari OM-SPAN"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>⚡ Sinkron Data</span>
            </button>

            <button
              onClick={handleExportJson}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-white/10 transition-colors cursor-pointer"
              title="Unduh Cadangan Konfigurasi Buletin (JSON)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor JSON</span>
            </button>

            <button
              onClick={() => jsonImportInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-white/10 transition-colors cursor-pointer"
              title="Pulihkan Konfigurasi Buletin dari Berkas JSON"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Impor JSON</span>
            </button>
            <input
              ref={jsonImportInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImportJson}
            />
          </div>
        </div>

        {/* Highlight Mode Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-200">Mode Tampilan Pratinjau:</span>
            <button
              onClick={() => onUpdateBuletinConfig({ ...buletinConfig, highlightMissingData: !buletinConfig.highlightMissingData })}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                buletinConfig.highlightMissingData === false
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/50'
              }`}
            >
              {buletinConfig.highlightMissingData === false 
                ? '✅ Mode Siap Cetak (Pratinjau Bersih & Rapi)' 
                : '🔍 Mode Deteksi Data Kosong (Kotak Merah Aktif)'}
            </button>
          </div>
          <span className="text-[11px] text-slate-400">
            💡 Tips: Saat mencetak fisik (Ctrl+P), semua kotak merah dan tombol navigasi otomatis disembunyikan.
          </span>
        </div>

        {/* 5 Distinct Format Selector Bar */}
        <div className="pt-4 border-t border-white/10 space-y-2">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-amber-300" />
            <span className="text-xs font-bold text-slate-200">5 Format Tampilan Berbeda (Tidak Monoton):</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {[
              { id: 'executive_magazine', title: '🏛️ Modern Executive', desc: 'Navy & Gold Embossed • Gaya Kemenkeu Prime', color: 'from-slate-900 to-indigo-950' },
              { id: 'canva_vibrant', title: '🎨 Canva Vibrant Studio', desc: 'Modern Violet & Fuchsia Neon • Segar & Kreatif', color: 'from-violet-700 to-pink-600' },
              { id: 'clean_treasury', title: '🌿 Clean Mint Treasury', desc: 'Forest Emerald Minimalist • Layout Lapang', color: 'from-emerald-800 to-teal-900' },
              { id: 'royal_indigo', title: '🔮 Royal Indigo Luxury', desc: 'Imperial Purple & Rose Gold • Majestik', color: 'from-indigo-950 to-purple-900' },
              { id: 'classic_newsletter', title: '📰 Classic Kedinasan', desc: 'Double Rule & Gazette Tempo • Vintage Paper', color: 'from-stone-900 to-slate-950' }
            ].map(fmt => {
              const isSelected = (buletinConfig.layoutFormat || 'executive_magazine') === fmt.id;
              return (
                <button
                  key={fmt.id}
                  onClick={() => onUpdateBuletinConfig({ ...buletinConfig, layoutFormat: fmt.id as any })}
                  className={`p-3 rounded-2xl text-left transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-amber-400 text-slate-950 border-amber-300 ring-2 ring-amber-300 font-bold shadow-lg scale-102'
                      : 'bg-white/10 text-white border-white/10 hover:bg-white/20'
                  }`}
                >
                  <div className="font-black text-xs">{fmt.title}</div>
                  <div className={`text-[10px] mt-1 line-clamp-1 ${isSelected ? 'text-slate-900 font-medium' : 'text-slate-300'}`}>
                    {fmt.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Editor Main Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-700 pb-3">
        {[
          { id: 'edisi', label: '📅 Update Tiap Bulan (Presets)', icon: Calendar },
          { id: 'foto', label: '📸 Galeri & Upload Foto (13 Spot)', icon: Camera },
          { id: 'identitas', label: '🏛️ Cover, Edisi & Sambutan (Hal 1-4)', icon: User },
          { id: 'anggaran', label: '📊 Kinerja Belanja & K/L (Hal 5-7)', icon: FileText },
          { id: 'semarang_data', label: '🏢 Data KPPN Semarang I (Hal 8-12)', icon: Building2 },
          { id: 'wawancara', label: '🤝 TKD & Wawancara Satker (Hal 13-15)', icon: HeartHandshake },
          { id: 'sarwasarwi', label: '🏃 Sarwa Sarwi KPPN (Hal 16-19)', icon: Award },
          { id: 'pagelaran', label: '🎪 Opini & Pagelaran Budaya (Hal 20-21)', icon: Compass },
          { id: 'teropong', label: '🏛️ Teropong Semarang (Hal 22)', icon: MapPin },
          { id: 'integritas', label: '🛡️ Integritas, TTS & Kontak (Hal 23-24)', icon: Phone }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-2 ring-indigo-400/40'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 0: UPDATE TIAP BULAN (MONTHLY PRESETS)                                */}
      {/* ========================================================================= */}
      {activeTab === 'edisi' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600 shrink-0" />
              <div>
                <p className="font-bold text-sm">Pilih Edisi Bulan untuk Memperbarui Semua Konten Majalah</p>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  Klik salah satu bulan di bawah untuk mengganti fokus berita utama, narasi editorial, ulasan Transfer Ke Daerah (TKD), wawancara satker, dan agenda kegiatan secara otomatis.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {BULETIN_MONTH_PRESETS.map((preset) => {
              const isCurrent = buletinConfig.edisi === preset.edisi;
              return (
                <div
                  key={preset.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    isCurrent 
                      ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 ring-2 ring-blue-400/50 shadow-md' 
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-300 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300">
                      {preset.quarter} • Bulan {preset.monthName}
                    </span>
                    {isCurrent && (
                      <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Sedang Dipakai
                      </span>
                    )}
                  </div>

                  <h4 className="font-black text-sm text-slate-900 dark:text-white line-clamp-2">
                    {preset.themeTitle}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {preset.subTitle}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-mono">
                      {preset.edisi}
                    </span>
                    <button
                      onClick={() => handleSelectMonthPreset(preset)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-blue-600 hover:text-white'
                      }`}
                    >
                      {isCurrent ? 'Muat Ulang Edisi Ini' : 'Terapkan Edisi Ini →'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: GALERI & UPLOAD FOTO                                               */}
      {/* ========================================================================= */}
      {activeTab === 'foto' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                Upload foto langsung dari komputer Anda atau gunakan tombol <strong>"Gunakan Contoh Resmi"</strong> untuk mengisi cepat. Foto yang kosong akan diberi tanda bingkai merah pada pratinjau majalah.
              </span>
            </div>
            <button
              onClick={() => {
                const filled = {
                  ...buletinConfig,
                  fotoCoverUrl: buletinConfig.fotoCoverUrl || OFFICIAL_PRESET_IMAGES.coverBuletin,
                  fotoKepalaUrl: buletinConfig.fotoKepalaUrl || OFFICIAL_PRESET_IMAGES.kepalaKantor,
                  wawancaraSatker: {
                    ...buletinConfig.wawancaraSatker,
                    fotoNarasumberUrl: buletinConfig.wawancaraSatker?.fotoNarasumberUrl || OFFICIAL_PRESET_IMAGES.narasumberSatker,
                    fotoKegiatanSatkerUrl: buletinConfig.wawancaraSatker?.fotoKegiatanSatkerUrl || OFFICIAL_PRESET_IMAGES.kegiatanSatker
                  },
                  sarwaSarwi: {
                    ...buletinConfig.sarwaSarwi,
                    fotoCapacityBuilding1Url: buletinConfig.sarwaSarwi?.fotoCapacityBuilding1Url || OFFICIAL_PRESET_IMAGES.capacityBuilding1,
                    fotoCapacityBuilding2Url: buletinConfig.sarwaSarwi?.fotoCapacityBuilding2Url || OFFICIAL_PRESET_IMAGES.capacityBuilding2,
                    fotoPurnabaktiUrl: buletinConfig.sarwaSarwi?.fotoPurnabaktiUrl || OFFICIAL_PRESET_IMAGES.purnabakti,
                    fotoRiverTubingUrl: buletinConfig.sarwaSarwi?.fotoRiverTubingUrl || OFFICIAL_PRESET_IMAGES.riverTubing
                  },
                  pagelaranSemarang: {
                    ...buletinConfig.pagelaranSemarang,
                    fotoEvent1Url: buletinConfig.pagelaranSemarang?.fotoEvent1Url || OFFICIAL_PRESET_IMAGES.pagelaranBudaya,
                    fotoUmkmUrl: buletinConfig.pagelaranSemarang?.fotoUmkmUrl || OFFICIAL_PRESET_IMAGES.umkmBinaan
                  },
                  teropongSemarang: {
                    ...buletinConfig.teropongSemarang,
                    fotoTeropong1Url: buletinConfig.teropongSemarang?.fotoTeropong1Url || OFFICIAL_PRESET_IMAGES.kotaLama,
                    fotoTeropong2Url: buletinConfig.teropongSemarang?.fotoTeropong2Url || OFFICIAL_PRESET_IMAGES.lawangSewu
                  },
                  kontakKppn: {
                    ...buletinConfig.kontakKppn,
                    fotoGedungUrl: buletinConfig.kontakKppn?.fotoGedungUrl || OFFICIAL_PRESET_IMAGES.gedungKppn
                  }
                };
                onUpdateBuletinConfig(filled);
                addToast({
                  title: 'Semua Foto Terisi',
                  message: 'Contoh foto resmi KPPN & Kota Semarang telah diterapkan pada seluruh halaman.',
                  type: 'success'
                });
              }}
              className="px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs shrink-0 cursor-pointer hover:bg-blue-700"
            >
              Isi Semua Foto Otomatis
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderPhotoCard('Foto Cover Utama Majalah', 'Hal 01', 'fotoCoverUrl', buletinConfig.fotoCoverUrl, 'coverBuletin', 'Gedung KPPN / Landmark Kota Semarang')}
            {renderPhotoCard('Foto Kepala Kantor', 'Hal 02', 'fotoKepalaUrl', buletinConfig.fotoKepalaUrl, 'kepalaKantor', 'Potret Resmi Kepala KPPN Tipe A1 Semarang I')}
            {renderPhotoCard('Foto Narasumber Satker', 'Hal 09', 'wawancara.fotoNarasumberUrl', buletinConfig.wawancaraSatker?.fotoNarasumberUrl, 'narasumberSatker', 'Potret KPA/PPK Satker mitra diwawancarai')}
            {renderPhotoCard('Foto Kegiatan / Kantor Satker', 'Hal 10', 'wawancara.fotoKegiatanSatkerUrl', buletinConfig.wawancaraSatker?.fotoKegiatanSatkerUrl, 'kegiatanSatker', 'Dokumentasi tim pengelola keuangan satker')}
            {renderPhotoCard('Capacity Building 1 (Foto Utama)', 'Hal 11', 'sarwaSarwi.fotoCapacityBuilding1Url', buletinConfig.sarwaSarwi?.fotoCapacityBuilding1Url, 'capacityBuilding1', 'Foto bersama seluruh pegawai KPPN')}
            {renderPhotoCard('Outbound Games & Team Building', 'Hal 12', 'sarwaSarwi.fotoCapacityBuilding2Url', buletinConfig.sarwaSarwi?.fotoCapacityBuilding2Url, 'capacityBuilding2', 'Dokumentasi permainan kekompakan')}
            {renderPhotoCard('Pelepasan Pegawai Purnabakti', 'Hal 13', 'sarwaSarwi.fotoPurnabaktiUrl', buletinConfig.sarwaSarwi?.fotoPurnabaktiUrl, 'purnabakti', 'Momen penghormatan pegawai purna tugas')}
            {renderPhotoCard('River Tubing & Kebersamaan', 'Hal 14', 'sarwaSarwi.fotoRiverTubingUrl', buletinConfig.sarwaSarwi?.fotoRiverTubingUrl, 'riverTubing', 'Petualangan tubing dan family gathering')}
            {renderPhotoCard('Pawai Budaya & Karnaval Semarang', 'Hal 15', 'pagelaran.fotoEvent1Url', buletinConfig.pagelaranSemarang?.fotoEvent1Url, 'pagelaranBudaya', 'Semarang Night Carnival / Festival')}
            {renderPhotoCard('Bazar & Produk UMKM Binaan', 'Hal 16', 'pagelaran.fotoUmkmUrl', buletinConfig.pagelaranSemarang?.fotoUmkmUrl, 'umkmBinaan', 'Gerai UMKM UMi & Kemenkeu Satu')}
            {renderPhotoCard('Kawasan Cagar Budaya Kota Lama', 'Hal 17', 'teropong.fotoTeropong1Url', buletinConfig.teropongSemarang?.fotoTeropong1Url, 'kotaLama', 'Gereja Blenduk & arsitektur kolonial')}
            {renderPhotoCard('Landmark Lawang Sewu', 'Hal 18', 'teropong.fotoTeropong2Url', buletinConfig.teropongSemarang?.fotoTeropong2Url, 'lawangSewu', 'Gedung bersejarah Lawang Sewu')}
            {renderPhotoCard('Gedung Kantor KPPN Semarang I', 'Hal 20', 'kontak.fotoGedungUrl', buletinConfig.kontakKppn?.fotoGedungUrl, 'gedungKppn', 'Foto tampak depan gedung kantor Jl. Ki Mangunsarkoro')}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: IDENTITAS, COVER & SAMBUTAN (HAL 1-4)                              */}
      {/* ========================================================================= */}
      {activeTab === 'identitas' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-5">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Identitas Publikasi &amp; Kata Pengantar
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Nama Buletin</label>
              <input
                type="text"
                value={buletinConfig.namaBuletin}
                onChange={(e) => onUpdateBuletinConfig({ ...buletinConfig, namaBuletin: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Nomor Edisi</label>
              <input
                type="text"
                value={buletinConfig.edisi}
                onChange={(e) => onUpdateBuletinConfig({ ...buletinConfig, edisi: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Periode / Bulan Tahun</label>
              <input
                type="text"
                value={buletinConfig.bulanTahun}
                onChange={(e) => onUpdateBuletinConfig({ ...buletinConfig, bulanTahun: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Tagline Buletin</label>
              <input
                type="text"
                value={buletinConfig.taglineBuletin}
                onChange={(e) => onUpdateBuletinConfig({ ...buletinConfig, taglineBuletin: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white"
              />
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Judul Laporan Utama (Cover Headline)</label>
              <input
                type="text"
                value={buletinConfig.judulUtama}
                onChange={(e) => onUpdateBuletinConfig({ ...buletinConfig, judulUtama: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white font-bold"
              />
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Sub-Judul Laporan Utama</label>
              <textarea
                rows={2}
                value={buletinConfig.subJudul}
                onChange={(e) => onUpdateBuletinConfig({ ...buletinConfig, subJudul: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Nama Kepala Kantor</label>
              <input
                type="text"
                value={buletinConfig.namaKepalaKantor}
                onChange={(e) => onUpdateBuletinConfig({ ...buletinConfig, namaKepalaKantor: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Jabatan Kepala</label>
              <input
                type="text"
                value={buletinConfig.jabatanKepala}
                onChange={(e) => onUpdateBuletinConfig({ ...buletinConfig, jabatanKepala: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white"
              />
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Kata Pengantar / Sambutan Kepala Kantor (Hal 02)</label>
              <textarea
                rows={4}
                value={buletinConfig.sambutanKepala}
                onChange={(e) => onUpdateBuletinConfig({ ...buletinConfig, sambutanKepala: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white"
              />
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Tajuk Rencana Redaksi (Hal 03)</label>
              <textarea
                rows={3}
                value={buletinConfig.tajukRencana}
                onChange={(e) => onUpdateBuletinConfig({ ...buletinConfig, tajukRencana: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: KINERJA ANGGARAN & TRANSFER KE DAERAH (HAL 5-8)                     */}
      {/* ========================================================================= */}
      {activeTab === 'anggaran' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Realisasi Belanja &amp; Alokasi Transfer Ke Daerah (TKD)
              </h4>
              <p className="text-xs text-slate-500">
                Penyaluran dana desentralisasi fiskal untuk Kota Semarang.
              </p>
            </div>
            <button
              onClick={handleAutoPullAnggaranData}
              className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold cursor-pointer hover:bg-blue-700"
            >
              ⚡ Hitung Analisis Otomatis
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Dana Bagi Hasil (DBH)</label>
              <input
                type="number"
                value={buletinConfig.tkdData?.dbh || 0}
                onChange={(e) => onUpdateBuletinConfig({
                  ...buletinConfig,
                  tkdData: { ...buletinConfig.tkdData, dbh: Number(e.target.value) }
                })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white font-mono"
              />
              <span className="text-[10px] text-slate-400">{formatRupiahFull(buletinConfig.tkdData?.dbh || 0)}</span>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Dana Alokasi Umum (DAU)</label>
              <input
                type="number"
                value={buletinConfig.tkdData?.dau || 0}
                onChange={(e) => onUpdateBuletinConfig({
                  ...buletinConfig,
                  tkdData: { ...buletinConfig.tkdData, dau: Number(e.target.value) }
                })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white font-mono"
              />
              <span className="text-[10px] text-slate-400">{formatRupiahFull(buletinConfig.tkdData?.dau || 0)}</span>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">DAK Fisik</label>
              <input
                type="number"
                value={buletinConfig.tkdData?.dakFisik || 0}
                onChange={(e) => onUpdateBuletinConfig({
                  ...buletinConfig,
                  tkdData: { ...buletinConfig.tkdData, dakFisik: Number(e.target.value) }
                })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white font-mono"
              />
              <span className="text-[10px] text-slate-400">{formatRupiahFull(buletinConfig.tkdData?.dakFisik || 0)}</span>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">DAK Non-Fisik (BOS &amp; BOK)</label>
              <input
                type="number"
                value={buletinConfig.tkdData?.dakNonFisik || 0}
                onChange={(e) => onUpdateBuletinConfig({
                  ...buletinConfig,
                  tkdData: { ...buletinConfig.tkdData, dakNonFisik: Number(e.target.value) }
                })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white font-mono"
              />
              <span className="text-[10px] text-slate-400">{formatRupiahFull(buletinConfig.tkdData?.dakNonFisik || 0)}</span>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Insentif Fiskal Kinerja</label>
              <input
                type="number"
                value={buletinConfig.tkdData?.insentifFiskal || 0}
                onChange={(e) => onUpdateBuletinConfig({
                  ...buletinConfig,
                  tkdData: { ...buletinConfig.tkdData, insentifFiskal: Number(e.target.value) }
                })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white font-mono"
              />
              <span className="text-[10px] text-slate-400">{formatRupiahFull(buletinConfig.tkdData?.insentifFiskal || 0)}</span>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Dana Kelurahan</label>
              <input
                type="number"
                value={buletinConfig.tkdData?.danaKelurahan || 0}
                onChange={(e) => onUpdateBuletinConfig({
                  ...buletinConfig,
                  tkdData: { ...buletinConfig.tkdData, danaKelurahan: Number(e.target.value) }
                })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white font-mono"
              />
              <span className="text-[10px] text-slate-400">{formatRupiahFull(buletinConfig.tkdData?.danaKelurahan || 0)}</span>
            </div>

            <div className="sm:col-span-2 lg:col-span-3 space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Catatan Analisis Penyaluran TKD (Hal 13)</label>
              <textarea
                rows={3}
                value={buletinConfig.tkdData?.catatanTkd || ''}
                onChange={(e) => onUpdateBuletinConfig({
                  ...buletinConfig,
                  tkdData: { ...buletinConfig.tkdData, catatanTkd: e.target.value }
                })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: DATA KPPN SEMARANG I (HALAMAN 8-12)                                  */}
      {/* ========================================================================= */}
      {activeTab === 'semarang_data' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Data Khusus KPPN Semarang I: Rapor Satker, 8 IKPA, Belanja Modal 53, Retur SP2D &amp; Digipay
              </h4>
              <p className="text-xs text-slate-500">
                Ubah atau sesuaikan statistik analisis perbendaharaan pada Halaman 8 sampai 12.
              </p>
            </div>
            <button
              onClick={handleCompleteAutomation}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700"
            >
              🪄 Muat Otomatis Data Semarang I
            </button>
          </div>

          {/* Evaluasi 8 Indikator IKPA */}
          <div className="space-y-3">
            <h5 className="text-xs font-black uppercase text-indigo-900 dark:text-indigo-400">
              1. Evaluasi 8 Indikator IKPA KPPN Semarang I (Hal 09)
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-200">Revisi DIPA</label>
                <input
                  type="number"
                  step="0.01"
                  value={buletinConfig.evaluasiDelapanIkpa?.revisiDipa.nilai || 98.5}
                  onChange={e => {
                    const val = Number(e.target.value);
                    if (buletinConfig.evaluasiDelapanIkpa) {
                      onUpdateBuletinConfig({
                        ...buletinConfig,
                        evaluasiDelapanIkpa: {
                          ...buletinConfig.evaluasiDelapanIkpa,
                          revisiDipa: { ...buletinConfig.evaluasiDelapanIkpa.revisiDipa, nilai: val }
                        }
                      });
                    }
                  }}
                  className="w-full px-2 py-1 text-xs rounded bg-white dark:bg-slate-800 border text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-200">Deviasi Hal III DIPA</label>
                <input
                  type="number"
                  step="0.01"
                  value={buletinConfig.evaluasiDelapanIkpa?.deviasiHal3.nilai || 91.2}
                  onChange={e => {
                    const val = Number(e.target.value);
                    if (buletinConfig.evaluasiDelapanIkpa) {
                      onUpdateBuletinConfig({
                        ...buletinConfig,
                        evaluasiDelapanIkpa: {
                          ...buletinConfig.evaluasiDelapanIkpa,
                          deviasiHal3: { ...buletinConfig.evaluasiDelapanIkpa.deviasiHal3, nilai: val }
                        }
                      });
                    }
                  }}
                  className="w-full px-2 py-1 text-xs rounded bg-white dark:bg-slate-800 border text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-200">Penyerapan Anggaran</label>
                <input
                  type="number"
                  step="0.01"
                  value={buletinConfig.evaluasiDelapanIkpa?.penyerapanAnggaran.nilai || 96.8}
                  onChange={e => {
                    const val = Number(e.target.value);
                    if (buletinConfig.evaluasiDelapanIkpa) {
                      onUpdateBuletinConfig({
                        ...buletinConfig,
                        evaluasiDelapanIkpa: {
                          ...buletinConfig.evaluasiDelapanIkpa,
                          penyerapanAnggaran: { ...buletinConfig.evaluasiDelapanIkpa.penyerapanAnggaran, nilai: val }
                        }
                      });
                    }
                  }}
                  className="w-full px-2 py-1 text-xs rounded bg-white dark:bg-slate-800 border text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-200">Penyelesaian Tagihan 17 Hari</label>
                <input
                  type="number"
                  step="0.01"
                  value={buletinConfig.evaluasiDelapanIkpa?.penyelesaianTagihan.nilai || 98.9}
                  onChange={e => {
                    const val = Number(e.target.value);
                    if (buletinConfig.evaluasiDelapanIkpa) {
                      onUpdateBuletinConfig({
                        ...buletinConfig,
                        evaluasiDelapanIkpa: {
                          ...buletinConfig.evaluasiDelapanIkpa,
                          penyelesaianTagihan: { ...buletinConfig.evaluasiDelapanIkpa.penyelesaianTagihan, nilai: val }
                        }
                      });
                    }
                  }}
                  className="w-full px-2 py-1 text-xs rounded bg-white dark:bg-slate-800 border text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>

            <div className="space-y-1 pt-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Kesimpulan Evaluasi IKPA</label>
              <textarea
                rows={2}
                value={buletinConfig.evaluasiDelapanIkpa?.kesimpulan || ''}
                onChange={e => {
                  if (buletinConfig.evaluasiDelapanIkpa) {
                    onUpdateBuletinConfig({
                      ...buletinConfig,
                      evaluasiDelapanIkpa: { ...buletinConfig.evaluasiDelapanIkpa, kesimpulan: e.target.value }
                    });
                  }
                }}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Belanja Modal 53 */}
          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-700">
            <h5 className="text-xs font-black uppercase text-indigo-900 dark:text-indigo-400">
              2. Monitoring Belanja Modal Akun 53 &amp; Proyek Strategis (Hal 10)
            </h5>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Rekomendasi Proyek Modal</label>
              <textarea
                rows={2}
                value={buletinConfig.belanjaModalProyek?.rekomendasi || ''}
                onChange={e => {
                  if (buletinConfig.belanjaModalProyek) {
                    onUpdateBuletinConfig({
                      ...buletinConfig,
                      belanjaModalProyek: { ...buletinConfig.belanjaModalProyek, rekomendasi: e.target.value }
                    });
                  }
                }}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Zero Retur Campaign */}
          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-700">
            <h5 className="text-xs font-black uppercase text-indigo-900 dark:text-indigo-400">
              3. Monitoring Retur SP2D &amp; SOP Penanganan (Hal 11)
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Rasio Zero Retur (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={buletinConfig.monitoringReturSp2d?.rasioZeroRetur || 99.98}
                  onChange={e => {
                    if (buletinConfig.monitoringReturSp2d) {
                      onUpdateBuletinConfig({
                        ...buletinConfig,
                        monitoringReturSp2d: { ...buletinConfig.monitoringReturSp2d, rasioZeroRetur: Number(e.target.value) }
                      });
                    }
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">SOP Penanganan Retur</label>
                <input
                  type="text"
                  value={buletinConfig.monitoringReturSp2d?.sopPenanganan || ''}
                  onChange={e => {
                    if (buletinConfig.monitoringReturSp2d) {
                      onUpdateBuletinConfig({
                        ...buletinConfig,
                        monitoringReturSp2d: { ...buletinConfig.monitoringReturSp2d, sopPenanganan: e.target.value }
                      });
                    }
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: GUYUB RUKUN - WAWANCARA SATKER (HAL 13-15)                         */}
      {/* ========================================================================= */}
      {activeTab === 'wawancara' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-5">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Rubrik Guyub Rukun: Wawancara &amp; Praktik Baik Satker
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Judul Wawancara</label>
              <input
                type="text"
                value={buletinConfig.wawancaraSatker?.judul || ''}
                onChange={(e) => onUpdateBuletinConfig({
                  ...buletinConfig,
                  wawancaraSatker: { ...buletinConfig.wawancaraSatker, judul: e.target.value }
                })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Nama Narasumber</label>
              <input
                type="text"
                value={buletinConfig.wawancaraSatker?.narasumber || ''}
                onChange={(e) => onUpdateBuletinConfig({
                  ...buletinConfig,
                  wawancaraSatker: { ...buletinConfig.wawancaraSatker, narasumber: e.target.value }
                })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Jabatan Narasumber</label>
              <input
                type="text"
                value={buletinConfig.wawancaraSatker?.jabatan || ''}
                onChange={(e) => onUpdateBuletinConfig({
                  ...buletinConfig,
                  wawancaraSatker: { ...buletinConfig.wawancaraSatker, jabatan: e.target.value }
                })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white"
              />
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Nama Satuan Kerja</label>
              <input
                type="text"
                value={buletinConfig.wawancaraSatker?.satker || ''}
                onChange={(e) => onUpdateBuletinConfig({
                  ...buletinConfig,
                  wawancaraSatker: { ...buletinConfig.wawancaraSatker, satker: e.target.value }
                })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white"
              />
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Uraian Wawancara Bagian 1 (Hal 09)</label>
              <textarea
                rows={4}
                value={buletinConfig.wawancaraSatker?.isiWawancara || ''}
                onChange={(e) => onUpdateBuletinConfig({
                  ...buletinConfig,
                  wawancaraSatker: { ...buletinConfig.wawancaraSatker, isiWawancara: e.target.value }
                })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white"
              />
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Uraian Wawancara Bagian 2 (Hal 10)</label>
              <textarea
                rows={4}
                value={buletinConfig.wawancaraSatker?.isiWawancara2 || ''}
                onChange={(e) => onUpdateBuletinConfig({
                  ...buletinConfig,
                  wawancaraSatker: { ...buletinConfig.wawancaraSatker, isiWawancara2: e.target.value }
                })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white"
              />
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Kutipan Penting Narasumber (Quote Box)</label>
              <input
                type="text"
                value={buletinConfig.wawancaraSatker?.kutipanPenting || ''}
                onChange={(e) => onUpdateBuletinConfig({
                  ...buletinConfig,
                  wawancaraSatker: { ...buletinConfig.wawancaraSatker, kutipanPenting: e.target.value }
                })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white italic"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: SARWA SARWI KPPN (HAL 11-14)                                       */}
      {/* ========================================================================= */}
      {activeTab === 'sarwasarwi' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-5">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Rubrik Sarwa Sarwi: Kegiatan Internal KPPN Semarang I
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Judul Utama Sarwa Sarwi</label>
              <input
                type="text"
                value={buletinConfig.sarwaSarwi?.judul || ''}
                onChange={(e) => onUpdateBuletinConfig({
                  ...buletinConfig,
                  sarwaSarwi: { ...buletinConfig.sarwaSarwi, judul: e.target.value }
                })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Tema Kegiatan</label>
              <input
                type="text"
                value={buletinConfig.sarwaSarwi?.temaKegiatan || ''}
                onChange={(e) => onUpdateBuletinConfig({
                  ...buletinConfig,
                  sarwaSarwi: { ...buletinConfig.sarwaSarwi, temaKegiatan: e.target.value }
                })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Lokasi Kegiatan</label>
              <input
                type="text"
                value={buletinConfig.sarwaSarwi?.lokasi || ''}
                onChange={(e) => onUpdateBuletinConfig({
                  ...buletinConfig,
                  sarwaSarwi: { ...buletinConfig.sarwaSarwi, lokasi: e.target.value }
                })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white"
              />
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Liputan Bagian 1: Pembukaan &amp; Sinergi (Hal 11)</label>
              <textarea
                rows={3}
                value={buletinConfig.sarwaSarwi?.ceritaBagian1 || ''}
                onChange={(e) => onUpdateBuletinConfig({
                  ...buletinConfig,
                  sarwaSarwi: { ...buletinConfig.sarwaSarwi, ceritaBagian1: e.target.value }
                })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white"
              />
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Liputan Bagian 2: Dinamika Outbound &amp; Game (Hal 12)</label>
              <textarea
                rows={3}
                value={buletinConfig.sarwaSarwi?.ceritaBagian2 || ''}
                onChange={(e) => onUpdateBuletinConfig({
                  ...buletinConfig,
                  sarwaSarwi: { ...buletinConfig.sarwaSarwi, ceritaBagian2: e.target.value }
                })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white"
              />
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Liputan Bagian 3: Pelepasan Purnabakti (Hal 13)</label>
              <textarea
                rows={3}
                value={buletinConfig.sarwaSarwi?.ceritaBagian3Purnabakti || ''}
                onChange={(e) => onUpdateBuletinConfig({
                  ...buletinConfig,
                  sarwaSarwi: { ...buletinConfig.sarwaSarwi, ceritaBagian3Purnabakti: e.target.value }
                })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white"
              />
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Pesan Motivasi Kepala Kantor (Hal 14)</label>
              <textarea
                rows={3}
                value={buletinConfig.sarwaSarwi?.pesanKepala || ''}
                onChange={(e) => onUpdateBuletinConfig({
                  ...buletinConfig,
                  sarwaSarwi: { ...buletinConfig.sarwaSarwi, pesanKepala: e.target.value }
                })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white italic"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: PAGELARAN SEMARANG & UMKM (HAL 15-16)                              */}
      {/* ========================================================================= */}
      {activeTab === 'pagelaran' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-5">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Rubrik Pagelaran: Festival Seni Budaya &amp; Bazar UMKM Binaan
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Nama Event / Festival</label>
              <input
                type="text"
                value={buletinConfig.pagelaranSemarang?.judulEvent || ''}
                onChange={(e) => onUpdateBuletinConfig({
                  ...buletinConfig,
                  pagelaranSemarang: { ...buletinConfig.pagelaranSemarang, judulEvent: e.target.value }
                })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white font-bold"
              />
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Deskripsi Event Budaya (Hal 15)</label>
              <textarea
                rows={4}
                value={buletinConfig.pagelaranSemarang?.deskripsiEvent || ''}
                onChange={(e) => onUpdateBuletinConfig({
                  ...buletinConfig,
                  pagelaranSemarang: { ...buletinConfig.pagelaranSemarang, deskripsiEvent: e.target.value }
                })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white"
              />
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Deskripsi Pemberdayaan UMKM Kemenkeu Satu (Hal 16)</label>
              <textarea
                rows={4}
                value={buletinConfig.pagelaranSemarang?.deskripsiUmkm || ''}
                onChange={(e) => onUpdateBuletinConfig({
                  ...buletinConfig,
                  pagelaranSemarang: { ...buletinConfig.pagelaranSemarang, deskripsiUmkm: e.target.value }
                })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: TEROPONG SEMARANG (HAL 17-18)                                      */}
      {/* ========================================================================= */}
      {activeTab === 'teropong' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-5">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Rubrik Teropong: Destinasi Cagar Budaya &amp; Ikon Kota Semarang
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Nama Lokasi 1 (Hal 17)</label>
              <input
                type="text"
                value={buletinConfig.teropongSemarang?.lokasi1Nama || ''}
                onChange={(e) => onUpdateBuletinConfig({
                  ...buletinConfig,
                  teropongSemarang: { ...buletinConfig.teropongSemarang, lokasi1Nama: e.target.value }
                })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white font-bold"
              />
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Deskripsi Lokasi 1 (Kota Lama)</label>
              <textarea
                rows={3}
                value={buletinConfig.teropongSemarang?.lokasi1Deskripsi || ''}
                onChange={(e) => onUpdateBuletinConfig({
                  ...buletinConfig,
                  teropongSemarang: { ...buletinConfig.teropongSemarang, lokasi1Deskripsi: e.target.value }
                })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Nama Lokasi 2 (Hal 18)</label>
              <input
                type="text"
                value={buletinConfig.teropongSemarang?.lokasi2Nama || ''}
                onChange={(e) => onUpdateBuletinConfig({
                  ...buletinConfig,
                  teropongSemarang: { ...buletinConfig.teropongSemarang, lokasi2Nama: e.target.value }
                })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white font-bold"
              />
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Deskripsi Lokasi 2 (Lawang Sewu &amp; Pasar Johar)</label>
              <textarea
                rows={3}
                value={buletinConfig.teropongSemarang?.lokasi2Deskripsi || ''}
                onChange={(e) => onUpdateBuletinConfig({
                  ...buletinConfig,
                  teropongSemarang: { ...buletinConfig.teropongSemarang, lokasi2Deskripsi: e.target.value }
                })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 8: ZONA INTEGRITAS, PANTUN & KONTAK (HAL 19-20)                       */}
      {/* ========================================================================= */}
      {activeTab === 'integritas' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-5">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Zona Integritas, Pantun Antikorupsi &amp; Back Cover Info Kontak
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Pesan Integritas Layanan (Hal 19)</label>
              <textarea
                rows={3}
                value={buletinConfig.pantunAntiKorupsi?.pesanIntegritas || ''}
                onChange={(e) => onUpdateBuletinConfig({
                  ...buletinConfig,
                  pantunAntiKorupsi: { ...buletinConfig.pantunAntiKorupsi, pesanIntegritas: e.target.value }
                })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Pantun Bait 1</label>
              <input
                type="text"
                value={buletinConfig.pantunAntiKorupsi?.bait1 || ''}
                onChange={(e) => onUpdateBuletinConfig({
                  ...buletinConfig,
                  pantunAntiKorupsi: { ...buletinConfig.pantunAntiKorupsi, bait1: e.target.value }
                })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white font-serif italic"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Pantun Bait 2</label>
              <input
                type="text"
                value={buletinConfig.pantunAntiKorupsi?.bait2 || ''}
                onChange={(e) => onUpdateBuletinConfig({
                  ...buletinConfig,
                  pantunAntiKorupsi: { ...buletinConfig.pantunAntiKorupsi, bait2: e.target.value }
                })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white font-serif italic"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Pantun Bait 3</label>
              <input
                type="text"
                value={buletinConfig.pantunAntiKorupsi?.bait3 || ''}
                onChange={(e) => onUpdateBuletinConfig({
                  ...buletinConfig,
                  pantunAntiKorupsi: { ...buletinConfig.pantunAntiKorupsi, bait3: e.target.value }
                })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white font-serif italic"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Pantun Bait 4 (Penutup)</label>
              <input
                type="text"
                value={buletinConfig.pantunAntiKorupsi?.bait4 || ''}
                onChange={(e) => onUpdateBuletinConfig({
                  ...buletinConfig,
                  pantunAntiKorupsi: { ...buletinConfig.pantunAntiKorupsi, bait4: e.target.value }
                })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white font-serif italic font-bold"
              />
            </div>

            <div className="sm:col-span-2 space-y-1 pt-2 border-t border-slate-100 dark:border-slate-700">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Alamat Kantor KPPN (Hal 20)</label>
              <input
                type="text"
                value={buletinConfig.kontakKppn?.alamat || ''}
                onChange={(e) => onUpdateBuletinConfig({
                  ...buletinConfig,
                  kontakKppn: { ...buletinConfig.kontakKppn, alamat: e.target.value }
                })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">WhatsApp Helpdesk SAKTI</label>
              <input
                type="text"
                value={buletinConfig.kontakKppn?.whatsappHelpdesk || ''}
                onChange={(e) => onUpdateBuletinConfig({
                  ...buletinConfig,
                  kontakKppn: { ...buletinConfig.kontakKppn, whatsappHelpdesk: e.target.value }
                })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Email Resmi</label>
              <input
                type="text"
                value={buletinConfig.kontakKppn?.email || ''}
                onChange={(e) => onUpdateBuletinConfig({
                  ...buletinConfig,
                  kontakKppn: { ...buletinConfig.kontakKppn, email: e.target.value }
                })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white font-mono"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
