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
  HelpCircle
} from 'lucide-react';
import { BuletinConfig, RealisasiBelanjaSummary, SatkerIKPA } from '../../types';
import { formatRupiahShort, formatRupiahFull } from '../../utils/realisasiBelanjaProcessor';
import { useToast } from '../ToastNotification';

interface BuletinDataStudioEditorProps {
  buletinConfig: BuletinConfig;
  onUpdateBuletinConfig: (updated: BuletinConfig) => void;
  overallSummary?: RealisasiBelanjaSummary | null;
  satkers?: SatkerIKPA[];
  onOpenSection?: (sectionKey: string) => void;
}

// Preset photos for quick 1-click loading if admin wants official demo assets
const OFFICIAL_PRESET_IMAGES = {
  kepalaKantor: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=600',
  coverBuletin: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1200',
  narasumberSatker: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=600',
  kegiatanSatker: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=800',
  capacityBuilding1: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800',
  capacityBuilding2: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&q=80&w=800',
  purnabakti: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800',
  riverTubing: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=800',
  pagelaranBudaya: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=800',
  umkmBinaan: 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&q=80&w=800',
  kotaLama: 'https://images.unsplash.com/photo-1596401057633-54a8fe8ef647?auto=format&fit=crop&q=80&w=800',
  lawangSewu: 'https://images.unsplash.com/photo-1590073844006-33379778ae09?auto=format&fit=crop&q=80&w=800',
  gedungKppn: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800'
};

export const BuletinDataStudioEditor: React.FC<BuletinDataStudioEditorProps> = ({
  buletinConfig,
  onUpdateBuletinConfig,
  overallSummary,
  satkers = []
}) => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'foto' | 'identitas' | 'anggaran' | 'wawancara' | 'sarwasarwi' | 'pagelaran' | 'teropong' | 'integritas'>('foto');
  const [imageUploadTarget, setImageUploadTarget] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to handle local file upload to Base64 (snappy & persists in local/firebase)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, targetField: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size (< 2MB recommended for performance)
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

  // 1-Click Auto Pull from Live Anggaran & IKPA Data
  const handleAutoPullAnggaranData = () => {
    const updated = { ...buletinConfig };

    if (overallSummary) {
      updated.tajukRencana = `Realisasi belanja APBN lingkup KPPN Semarang I telah mencapai ${overallSummary.persenRealisasiTotal.toFixed(2)}% (${formatRupiahShort(overallSummary.totalRealisasi)}) dari pagu ${formatRupiahShort(overallSummary.totalPagu)}. Akselerasi terus dioptimalkan pada belanja modal dan bantuan sosial.`;
      
      updated.catatanAnalis = `Dari ${overallSummary.totalSatkerCount} satuan kerja mitra, realisasi Belanja Pegawai mencapai ${overallSummary.breakdownJenisBelanja.find(b => b.kode === '51')?.persen.toFixed(1) || '0'}%, Belanja Barang ${overallSummary.breakdownJenisBelanja.find(b => b.kode === '52')?.persen.toFixed(1) || '0'}%, dan Belanja Modal ${overallSummary.breakdownJenisBelanja.find(b => b.kode === '53')?.persen.toFixed(1) || '0'}%.`;

      // If top satker exists, auto fill interview
      if (overallSummary.topSatkers.length > 0) {
        const top = overallSummary.topSatkers[0];
        updated.wawancaraSatker = {
          judul: `Kiat Sukses Capaian Realisasi Belanja ${top.persen.toFixed(1)}% & Tata Kelola SAKTI Prima`,
          narasumber: 'Pengelola Keuangan Terbaik',
          jabatan: 'PPK / Bendahara Pengeluaran',
          satker: top.namaSatker,
          isiWawancara: `Keberhasilan mencapai realisasi ${top.persen.toFixed(2)}% didorong oleh koordinasi harian tim pengadaan dan percepatan pengajuan SPM tanpa menunggu akhir triwulan.`,
          kutipanPenting: 'KPPN Semarang I sangat responsif dalam memberikan bimbingan teknis modul pembayaran SAKTI.',
          prestasiSatker: `Peringkat 1 Realisasi Belanja Kategori Satker Besar dengan total penyerapan ${formatRupiahShort(top.realisasi)}.`
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
          catatanTkd: 'Penyaluran Transfer Ke Daerah untuk Kota Semarang dan wilayah sekitar disalurkan tepat waktu langsung ke Kas Daerah.'
        };
      }
    }

    onUpdateBuletinConfig(updated);
    addToast({
      title: 'Data Anggaran Berhasil Disinkronkan',
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

  // Count filled vs total
  const stats = {
    fotoFilled: [
      buletinConfig.fotoCoverUrl,
      buletinConfig.fotoKepalaUrl,
      buletinConfig.wawancaraSatker?.fotoNarasumberUrl,
      buletinConfig.wawancaraSatker?.fotoKegiatanSatkerUrl,
      buletinConfig.sarwaSarwi?.fotoCapacityBuilding1Url,
      buletinConfig.sarwaSarwi?.fotoCapacityBuilding2Url,
      buletinConfig.sarwaSarwi?.fotoPurnabaktiUrl,
      buletinConfig.sarwaSarwi?.fotoRiverTubingUrl,
      buletinConfig.pagelaranSemarang?.fotoEvent1Url,
      buletinConfig.pagelaranSemarang?.fotoUmkmUrl,
      buletinConfig.teropongSemarang?.fotoTeropong1Url,
      buletinConfig.teropongSemarang?.fotoTeropong2Url,
      buletinConfig.kontakKppn?.fotoGedungUrl
    ].filter(Boolean).length,
    fotoTotal: 13
  };

  return (
    <div className="space-y-6">
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
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white border border-indigo-500/30 shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950">
                DATA STUDIO &amp; EDIT FOTO
              </span>
              <span className="text-xs font-bold text-indigo-300">
                Kelengkapan Foto: {stats.fotoFilled}/{stats.fotoTotal} Terisi
              </span>
            </div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <span>Studio Redaksi, Rubrikasi &amp; Galeri Foto Buletin</span>
            </h3>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Edit seluruh narasi tajuk, sambutan kepala kantor, artikel rubrik, serta kelola foto dokumentasi. Kolom yang belum diisi akan otomatis <strong>dikosongkan dan dimerahin</strong> di pratinjau majalah agar mudah dikoreksi sebelum dicetak.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleAutoPullAnggaranData}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Zap className="w-4 h-4" />
              <span>⚡ Tarik Data Anggaran &amp; IKPA Otomatis</span>
            </button>
          </div>
        </div>

        {/* Format Buletin Multi-Style Picker */}
        <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-amber-300" />
            <span className="text-xs font-bold text-slate-200">Format Desain Buletin:</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { id: 'executive_magazine', label: '🏛️ Modern Executive Magazine', desc: 'Navy & Gold Editorial' },
              { id: 'canva_vibrant', label: '🎨 Vibrant Canva Creative', desc: 'Modern Bold Gradient' },
              { id: 'clean_treasury', label: '🌿 Minimalist Clean Treasury', desc: 'Emerald Crisp White' },
              { id: 'royal_indigo', label: '🔮 Royal Indigo Luxury', desc: 'Cyber Gold & Deep Indigo' },
              { id: 'classic_newsletter', label: '📰 Classic Warta Kedinasan', desc: '2-Column Formal Border' }
            ].map(fmt => (
              <button
                key={fmt.id}
                onClick={() => onUpdateBuletinConfig({ ...buletinConfig, layoutFormat: fmt.id as any })}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  (buletinConfig.layoutFormat || 'executive_magazine') === fmt.id
                    ? 'bg-amber-400 text-slate-950 font-black shadow-md ring-2 ring-amber-300/60'
                    : 'bg-white/10 text-slate-200 hover:bg-white/20'
                }`}
              >
                {fmt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Editor Sub-Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-700 pb-3">
        {[
          { id: 'foto', label: '📸 Galeri & Upload Foto (13 Spot)', icon: Camera },
          { id: 'identitas', label: '🏛️ Cover, Edisi & Sambutan (Hal 1-4)', icon: User },
          { id: 'anggaran', label: '📊 Kinerja Belanja & TKD (Hal 5-8)', icon: FileText },
          { id: 'wawancara', label: '🤝 Guyub Rukun Satker (Hal 9-10)', icon: HeartHandshake },
          { id: 'sarwasarwi', label: '🏃 Sarwa Sarwi KPPN (Hal 11-14)', icon: Award },
          { id: 'pagelaran', label: '🎪 Pagelaran Budaya & UMKM (Hal 15-16)', icon: Compass },
          { id: 'teropong', label: '🏛️ Teropong Semarang (Hal 17-18)', icon: MapPin },
          { id: 'integritas', label: '🛡️ Integritas, Pantun & Kontak (Hal 19-20)', icon: Phone }
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
                    narasumber: buletinConfig.wawancaraSatker?.narasumber || 'Budi Santoso, S.E.',
                    jabatan: buletinConfig.wawancaraSatker?.jabatan || 'PPK / Bendahara',
                    satker: buletinConfig.wawancaraSatker?.satker || 'Satuan Kerja Mitra KPPN',
                    judul: buletinConfig.wawancaraSatker?.judul || 'Pentingnya Disiplin RPD',
                    isiWawancara: buletinConfig.wawancaraSatker?.isiWawancara || 'Kunci sukses realisasi...',
                    kutipanPenting: buletinConfig.wawancaraSatker?.kutipanPenting || 'Koordinasi aktif...',
                    fotoNarasumberUrl: buletinConfig.wawancaraSatker?.fotoNarasumberUrl || OFFICIAL_PRESET_IMAGES.narasumberSatker,
                    fotoKegiatanSatkerUrl: buletinConfig.wawancaraSatker?.fotoKegiatanSatkerUrl || OFFICIAL_PRESET_IMAGES.kegiatanSatker
                  },
                  sarwaSarwi: {
                    ...buletinConfig.sarwaSarwi,
                    judul: buletinConfig.sarwaSarwi?.judul || 'Sinergi dan Kolaborasi Tingkatkan Prestasi',
                    temaKegiatan: buletinConfig.sarwaSarwi?.temaKegiatan || 'Capacity Building KPPN Semarang I',
                    tanggal: buletinConfig.sarwaSarwi?.tanggal || 'Mei 2026',
                    lokasi: buletinConfig.sarwaSarwi?.lokasi || 'Bandungan',
                    ceritaBagian1: buletinConfig.sarwaSarwi?.ceritaBagian1 || 'Kegiatan berlangsung semarak...',
                    ceritaBagian2: buletinConfig.sarwaSarwi?.ceritaBagian2 || 'Seluruh pegawai antusias...',
                    ceritaBagian3Purnabakti: buletinConfig.sarwaSarwi?.ceritaBagian3Purnabakti || 'Pelepasan purnabakti...',
                    ceritaBagian4RiverTubing: buletinConfig.sarwaSarwi?.ceritaBagian4RiverTubing || 'Keseruan river tubing...',
                    pesanKepala: buletinConfig.sarwaSarwi?.pesanKepala || 'Tetap kompak...',
                    fotoCapacityBuilding1Url: buletinConfig.sarwaSarwi?.fotoCapacityBuilding1Url || OFFICIAL_PRESET_IMAGES.capacityBuilding1,
                    fotoCapacityBuilding2Url: buletinConfig.sarwaSarwi?.fotoCapacityBuilding2Url || OFFICIAL_PRESET_IMAGES.capacityBuilding2,
                    fotoPurnabaktiUrl: buletinConfig.sarwaSarwi?.fotoPurnabaktiUrl || OFFICIAL_PRESET_IMAGES.purnabakti,
                    fotoRiverTubingUrl: buletinConfig.sarwaSarwi?.fotoRiverTubingUrl || OFFICIAL_PRESET_IMAGES.riverTubing
                  },
                  pagelaranSemarang: {
                    ...buletinConfig.pagelaranSemarang,
                    judulEvent: buletinConfig.pagelaranSemarang?.judulEvent || 'Pawai Seni & Budaya Kota Semarang',
                    tanggalEvent: buletinConfig.pagelaranSemarang?.tanggalEvent || '2026',
                    lokasiEvent: buletinConfig.pagelaranSemarang?.lokasiEvent || 'Simpang Lima',
                    deskripsiEvent: buletinConfig.pagelaranSemarang?.deskripsiEvent || 'Pawai semarak...',
                    judulUmkm: buletinConfig.pagelaranSemarang?.judulUmkm || 'Batik & Kuliner Binaan Kemenkeu Satu',
                    deskripsiUmkm: buletinConfig.pagelaranSemarang?.deskripsiUmkm || 'Pemberdayaan UMKM...',
                    fotoEvent1Url: buletinConfig.pagelaranSemarang?.fotoEvent1Url || OFFICIAL_PRESET_IMAGES.pagelaranBudaya,
                    fotoUmkmUrl: buletinConfig.pagelaranSemarang?.fotoUmkmUrl || OFFICIAL_PRESET_IMAGES.umkmBinaan
                  },
                  teropongSemarang: {
                    ...buletinConfig.teropongSemarang,
                    lokasi1Nama: buletinConfig.teropongSemarang?.lokasi1Nama || 'Kawasan Kota Lama Semarang',
                    lokasi1Deskripsi: buletinConfig.teropongSemarang?.lokasi1Deskripsi || 'Gereja Blenduk...',
                    lokasi2Nama: buletinConfig.teropongSemarang?.lokasi2Nama || 'Landmark Lawang Sewu',
                    lokasi2Deskripsi: buletinConfig.teropongSemarang?.lokasi2Deskripsi || 'Ikon bersejarah...',
                    fotoTeropong1Url: buletinConfig.teropongSemarang?.fotoTeropong1Url || OFFICIAL_PRESET_IMAGES.kotaLama,
                    fotoTeropong2Url: buletinConfig.teropongSemarang?.fotoTeropong2Url || OFFICIAL_PRESET_IMAGES.lawangSewu
                  },
                  kontakKppn: {
                    ...buletinConfig.kontakKppn,
                    alamat: buletinConfig.kontakKppn?.alamat || 'Jl. Ki Mangunsarkoro No. 34, Semarang',
                    telepon: buletinConfig.kontakKppn?.telepon || '(024) 8311545',
                    whatsappHelpdesk: buletinConfig.kontakKppn?.whatsappHelpdesk || '0811-270-1545',
                    email: buletinConfig.kontakKppn?.email || 'kppnsemarang1@kemenkeu.go.id',
                    website: buletinConfig.kontakKppn?.website || 'djpb.kemenkeu.go.id/kppn/semarang1',
                    instagram: buletinConfig.kontakKppn?.instagram || '@kppnsemarang1',
                    youtube: buletinConfig.kontakKppn?.youtube || 'KPPN Semarang I Official',
                    fotoGedungUrl: buletinConfig.kontakKppn?.fotoGedungUrl || OFFICIAL_PRESET_IMAGES.gedungKppn
                  }
                };
                onUpdateBuletinConfig(filled);
                addToast({
                  title: 'Semua Contoh Foto Berhasil Dimuat',
                  message: 'Seluruh 13 slot foto resmi majalah telah terisi secara otomatis.',
                  type: 'success'
                });
              }}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shrink-0 cursor-pointer"
            >
              ⚡ Isi Semua Foto Contoh
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderPhotoCard('Foto Cover Depan', 'Hal 1', 'fotoCoverUrl', buletinConfig.fotoCoverUrl, 'coverBuletin', 'Cover utama majalah edisi terbit')}
            {renderPhotoCard('Foto Resmi Kepala KPPN', 'Hal 2', 'fotoKepalaUrl', buletinConfig.fotoKepalaUrl, 'kepalaKantor', 'Potret formal Kepala Kantor')}
            {renderPhotoCard('Foto Narasumber Satker (Guyub Rukun)', 'Hal 9', 'wawancara.fotoNarasumberUrl', buletinConfig.wawancaraSatker?.fotoNarasumberUrl, 'narasumberSatker', 'Narasumber KPA/PPK Satker')}
            {renderPhotoCard('Foto Dokumentasi Satker', 'Hal 10', 'wawancara.fotoKegiatanSatkerUrl', buletinConfig.wawancaraSatker?.fotoKegiatanSatkerUrl, 'kegiatanSatker', 'Aktivitas tata kelola satker')}
            {renderPhotoCard('Foto Capacity Building 1 (Kolektif)', 'Hal 11', 'sarwaSarwi.fotoCapacityBuilding1Url', buletinConfig.sarwaSarwi?.fotoCapacityBuilding1Url, 'capacityBuilding1', 'Foto bersama insan KPPN')}
            {renderPhotoCard('Foto Outbound & Games', 'Hal 12', 'sarwaSarwi.fotoCapacityBuilding2Url', buletinConfig.sarwaSarwi?.fotoCapacityBuilding2Url, 'capacityBuilding2', 'Permainan tim & yel-yel')}
            {renderPhotoCard('Foto Pelepasan Purna Bakti', 'Hal 13', 'sarwaSarwi.fotoPurnabaktiUrl', buletinConfig.sarwaSarwi?.fotoPurnabaktiUrl, 'purnabakti', 'Momen pelepasan pegawai')}
            {renderPhotoCard('Foto River Tubing & Air', 'Hal 14', 'sarwaSarwi.fotoRiverTubingUrl', buletinConfig.sarwaSarwi?.fotoRiverTubingUrl, 'riverTubing', 'Wahana wisata air pegawai')}
            {renderPhotoCard('Foto Pawai Budaya Semarang', 'Hal 15', 'pagelaran.fotoEvent1Url', buletinConfig.pagelaranSemarang?.fotoEvent1Url, 'pagelaranBudaya', 'Festival kearifan lokal')}
            {renderPhotoCard('Foto Produk UMKM Binaan', 'Hal 16', 'pagelaran.fotoUmkmUrl', buletinConfig.pagelaranSemarang?.fotoUmkmUrl, 'umkmBinaan', 'Gerai batik & kuliner')}
            {renderPhotoCard('Foto Cagar Budaya Kota Lama', 'Hal 17', 'teropong.fotoTeropong1Url', buletinConfig.teropongSemarang?.fotoTeropong1Url, 'kotaLama', 'Gereja Blenduk & taman')}
            {renderPhotoCard('Foto Lawang Sewu & Tugu Muda', 'Hal 18', 'teropong.fotoTeropong2Url', buletinConfig.teropongSemarang?.fotoTeropong2Url, 'lawangSewu', 'Monumen bersejarah')}
            {renderPhotoCard('Foto Gedung KPPN & Pelayanan', 'Hal 20', 'kontak.fotoGedungUrl', buletinConfig.kontakKppn?.fotoGedungUrl, 'gedungKppn', 'Back cover kantor')}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: IDENTITAS, COVER, EDISI & SAMBUTAN                                 */}
      {/* ========================================================================= */}
      {activeTab === 'identitas' && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
            <h4 className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">
              Identitas &amp; Cover Majalah (Halaman 1)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Nama Buletin / Majalah</label>
                <input
                  type="text"
                  value={buletinConfig.namaBuletin || ''}
                  placeholder="e.g. WARTA SEMARANG SATU"
                  onChange={(e) => onUpdateBuletinConfig({ ...buletinConfig, namaBuletin: e.target.value })}
                  className={`w-full px-3 py-2 text-xs rounded-xl border ${
                    buletinConfig.namaBuletin ? 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 font-bold' : 'bg-rose-50 border-rose-300 text-rose-700'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Edisi / Volume</label>
                <input
                  type="text"
                  value={buletinConfig.edisi || ''}
                  placeholder="e.g. EDISI 2 | TW.II/2026"
                  onChange={(e) => onUpdateBuletinConfig({ ...buletinConfig, edisi: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Periode Terbit</label>
                <input
                  type="text"
                  value={buletinConfig.bulanTahun || ''}
                  placeholder="e.g. Triwulan II 2026"
                  onChange={(e) => onUpdateBuletinConfig({ ...buletinConfig, bulanTahun: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Judul Tajuk Utama (Headline Cover)</label>
                <textarea
                  rows={2}
                  value={buletinConfig.judulUtama || ''}
                  placeholder="e.g. OPTIMALISASI PENYERAPAN BELANJA APBN..."
                  onChange={(e) => onUpdateBuletinConfig({ ...buletinConfig, judulUtama: e.target.value })}
                  className={`w-full px-3 py-2 text-xs rounded-xl border ${
                    buletinConfig.judulUtama ? 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 font-bold' : 'bg-rose-50 border-rose-300 text-rose-700'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Sub-Judul / Tema Warta</label>
                <textarea
                  rows={2}
                  value={buletinConfig.subJudul || ''}
                  placeholder="e.g. Kinerja Fiskal Berkualitas, Akselerasi Digitalisasi..."
                  onChange={(e) => onUpdateBuletinConfig({ ...buletinConfig, subJudul: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Highlight Cover 1</label>
                <input
                  type="text"
                  value={buletinConfig.coverHighlight1 || ''}
                  placeholder="e.g. CAPACITY BUILDING: SINERGI & KOLABORASI..."
                  onChange={(e) => onUpdateBuletinConfig({ ...buletinConfig, coverHighlight1: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Highlight Cover 2</label>
                <input
                  type="text"
                  value={buletinConfig.coverHighlight2 || ''}
                  placeholder="e.g. FESTIVAL KOTA LAMA & AKSELERASI PRODUK UMKM..."
                  onChange={(e) => onUpdateBuletinConfig({ ...buletinConfig, coverHighlight2: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600"
                />
              </div>
            </div>
          </div>

          {/* Kata Pengantar Kepala Kantor (Hal 2) */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
            <h4 className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">
              Kata Pengantar Kepala KPPN (Halaman 2)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Nama Kepala Kantor</label>
                <input
                  type="text"
                  value={buletinConfig.namaKepalaKantor || ''}
                  placeholder="e.g. Drs. H. Ahmad Fauzi, M.Si."
                  onChange={(e) => onUpdateBuletinConfig({ ...buletinConfig, namaKepalaKantor: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Jabatan Penandatangan</label>
                <input
                  type="text"
                  value={buletinConfig.jabatanKepala || ''}
                  placeholder="e.g. Kepala KPPN Tipe A1 Semarang I"
                  onChange={(e) => onUpdateBuletinConfig({ ...buletinConfig, jabatanKepala: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Sambutan / Pengantar Editorial Kepala Kantor</label>
              <textarea
                rows={4}
                value={buletinConfig.sambutanKepala || ''}
                placeholder="Tuliskan sambutan kepala kantor..."
                onChange={(e) => onUpdateBuletinConfig({ ...buletinConfig, sambutanKepala: e.target.value })}
                className={`w-full p-3 text-xs rounded-xl border leading-relaxed ${
                  buletinConfig.sambutanKepala ? 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600' : 'bg-rose-50 border-rose-300 text-rose-700'
                }`}
              />
            </div>
          </div>

          {/* Sekilas Buletin & Tim Redaksi (Hal 3) */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
            <h4 className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">
              Sekilas Buletin &amp; Susunan Redaksi (Halaman 3)
            </h4>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Deskripsi Sekilas Buletin</label>
              <textarea
                rows={3}
                value={buletinConfig.sekilasBuletin || ''}
                placeholder="Deskripsi tujuan penerbitan buletin perbendaharaan..."
                onChange={(e) => onUpdateBuletinConfig({ ...buletinConfig, sekilasBuletin: e.target.value })}
                className="w-full p-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500">Pelindung</label>
                <input
                  type="text"
                  value={buletinConfig.redaksiTim?.pelindung || 'Kepala Kantor Wilayah DJPb Provinsi Jawa Tengah'}
                  onChange={(e) => onUpdateBuletinConfig({ ...buletinConfig, redaksiTim: { ...buletinConfig.redaksiTim, pelindung: e.target.value } })}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500">Penanggung Jawab</label>
                <input
                  type="text"
                  value={buletinConfig.redaksiTim?.penanggungJawab || 'Kepala KPPN Tipe A1 Semarang I'}
                  onChange={(e) => onUpdateBuletinConfig({ ...buletinConfig, redaksiTim: { ...buletinConfig.redaksiTim, penanggungJawab: e.target.value } })}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500">Pemimpin Redaksi</label>
                <input
                  type="text"
                  value={buletinConfig.redaksiTim?.pemimpinRedaksi || 'Kepala Seksi MSKI KPPN Semarang I'}
                  onChange={(e) => onUpdateBuletinConfig({ ...buletinConfig, redaksiTim: { ...buletinConfig.redaksiTim, pemimpinRedaksi: e.target.value } })}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: KINERJA ANGGARAN & TKD                                             */}
      {/* ========================================================================= */}
      {activeTab === 'anggaran' && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">
                Catatan Analisis Realisasi Belanja (Halaman 5-7)
              </h4>
              <button
                onClick={handleAutoPullAnggaranData}
                className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Muat Ulang dari OM-SPAN Terkini</span>
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Catatan Tajuk Rencana / Strategi Anggaran</label>
              <textarea
                rows={3}
                value={buletinConfig.tajukRencana || ''}
                placeholder="Tuliskan ulasan strategi percepatan penyerapan anggaran..."
                onChange={(e) => onUpdateBuletinConfig({ ...buletinConfig, tajukRencana: e.target.value })}
                className="w-full p-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Catatan Analis Belanja Negara (Halaman 6)</label>
              <textarea
                rows={3}
                value={buletinConfig.catatanAnalis || ''}
                placeholder="Tuliskan catatan khusus per jenis belanja (51, 52, 53, 57)..."
                onChange={(e) => onUpdateBuletinConfig({ ...buletinConfig, catatanAnalis: e.target.value })}
                className="w-full p-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600"
              />
            </div>
          </div>

          {/* Transfer Ke Daerah (TKD - Hal 8) */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
            <h4 className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">
              Data Penyaluran Transfer Ke Daerah (TKD) (Halaman 8)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500">Dana Bagi Hasil (DBH) (Rp)</label>
                <input
                  type="number"
                  value={buletinConfig.tkdData?.dbh || 0}
                  onChange={(e) => onUpdateBuletinConfig({
                    ...buletinConfig,
                    tkdData: { ...buletinConfig.tkdData, dbh: Number(e.target.value) || 0, dau: buletinConfig.tkdData?.dau || 0, dakFisik: buletinConfig.tkdData?.dakFisik || 0, dakNonFisik: buletinConfig.tkdData?.dakNonFisik || 0, insentifFiskal: buletinConfig.tkdData?.insentifFiskal || 0, danaKelurahan: buletinConfig.tkdData?.danaKelurahan || 0 }
                  })}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500">Dana Alokasi Umum (DAU) (Rp)</label>
                <input
                  type="number"
                  value={buletinConfig.tkdData?.dau || 0}
                  onChange={(e) => onUpdateBuletinConfig({
                    ...buletinConfig,
                    tkdData: { ...buletinConfig.tkdData, dbh: buletinConfig.tkdData?.dbh || 0, dau: Number(e.target.value) || 0, dakFisik: buletinConfig.tkdData?.dakFisik || 0, dakNonFisik: buletinConfig.tkdData?.dakNonFisik || 0, insentifFiskal: buletinConfig.tkdData?.insentifFiskal || 0, danaKelurahan: buletinConfig.tkdData?.danaKelurahan || 0 }
                  })}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500">DAK Fisik (Rp)</label>
                <input
                  type="number"
                  value={buletinConfig.tkdData?.dakFisik || 0}
                  onChange={(e) => onUpdateBuletinConfig({
                    ...buletinConfig,
                    tkdData: { ...buletinConfig.tkdData, dbh: buletinConfig.tkdData?.dbh || 0, dau: buletinConfig.tkdData?.dau || 0, dakFisik: Number(e.target.value) || 0, dakNonFisik: buletinConfig.tkdData?.dakNonFisik || 0, insentifFiskal: buletinConfig.tkdData?.insentifFiskal || 0, danaKelurahan: buletinConfig.tkdData?.danaKelurahan || 0 }
                  })}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500">DAK Non Fisik (Rp)</label>
                <input
                  type="number"
                  value={buletinConfig.tkdData?.dakNonFisik || 0}
                  onChange={(e) => onUpdateBuletinConfig({
                    ...buletinConfig,
                    tkdData: { ...buletinConfig.tkdData, dbh: buletinConfig.tkdData?.dbh || 0, dau: buletinConfig.tkdData?.dau || 0, dakFisik: buletinConfig.tkdData?.dakFisik || 0, dakNonFisik: Number(e.target.value) || 0, insentifFiskal: buletinConfig.tkdData?.insentifFiskal || 0, danaKelurahan: buletinConfig.tkdData?.danaKelurahan || 0 }
                  })}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500">Insentif Fiskal (Rp)</label>
                <input
                  type="number"
                  value={buletinConfig.tkdData?.insentifFiskal || 0}
                  onChange={(e) => onUpdateBuletinConfig({
                    ...buletinConfig,
                    tkdData: { ...buletinConfig.tkdData, dbh: buletinConfig.tkdData?.dbh || 0, dau: buletinConfig.tkdData?.dau || 0, dakFisik: buletinConfig.tkdData?.dakFisik || 0, dakNonFisik: buletinConfig.tkdData?.dakNonFisik || 0, insentifFiskal: Number(e.target.value) || 0, danaKelurahan: buletinConfig.tkdData?.danaKelurahan || 0 }
                  })}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500">Dana Kelurahan (Rp)</label>
                <input
                  type="number"
                  value={buletinConfig.tkdData?.danaKelurahan || 0}
                  onChange={(e) => onUpdateBuletinConfig({
                    ...buletinConfig,
                    tkdData: { ...buletinConfig.tkdData, dbh: buletinConfig.tkdData?.dbh || 0, dau: buletinConfig.tkdData?.dau || 0, dakFisik: buletinConfig.tkdData?.dakFisik || 0, dakNonFisik: buletinConfig.tkdData?.dakNonFisik || 0, insentifFiskal: buletinConfig.tkdData?.insentifFiskal || 0, danaKelurahan: Number(e.target.value) || 0 }
                  })}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-mono font-bold"
                />
              </div>
            </div>

            <div className="space-y-1 pt-2">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Catatan Penyaluran TKD</label>
              <textarea
                rows={2}
                value={buletinConfig.tkdData?.catatanTkd || ''}
                placeholder="Catatan percepatan penyaluran TKD..."
                onChange={(e) => onUpdateBuletinConfig({
                  ...buletinConfig,
                  tkdData: { ...buletinConfig.tkdData, dbh: buletinConfig.tkdData?.dbh || 0, dau: buletinConfig.tkdData?.dau || 0, dakFisik: buletinConfig.tkdData?.dakFisik || 0, dakNonFisik: buletinConfig.tkdData?.dakNonFisik || 0, insentifFiskal: buletinConfig.tkdData?.insentifFiskal || 0, danaKelurahan: buletinConfig.tkdData?.danaKelurahan || 0, catatanTkd: e.target.value }
                })}
                className="w-full p-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: WAWANCARA SATKER (GUYUB RUKUN)                                      */}
      {/* ========================================================================= */}
      {activeTab === 'wawancara' && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
          <h4 className="text-xs font-black uppercase text-emerald-700 dark:text-emerald-400 tracking-wider">
            Rubrik Guyub Rukun: Wawancara &amp; Praktik Baik Satker (Halaman 9 &amp; 10)
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Nama Narasumber</label>
              <input
                type="text"
                value={buletinConfig.wawancaraSatker?.narasumber || ''}
                placeholder="e.g. Budi Santoso, S.E."
                onChange={(e) => onUpdateBuletinConfig({
                  ...buletinConfig,
                  wawancaraSatker: { ...buletinConfig.wawancaraSatker, judul: buletinConfig.wawancaraSatker?.judul || '', jabatan: buletinConfig.wawancaraSatker?.jabatan || '', satker: buletinConfig.wawancaraSatker?.satker || '', isiWawancara: buletinConfig.wawancaraSatker?.isiWawancara || '', kutipanPenting: buletinConfig.wawancaraSatker?.kutipanPenting || '', narasumber: e.target.value }
                })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Jabatan Narasumber</label>
              <input
                type="text"
                value={buletinConfig.wawancaraSatker?.jabatan || ''}
                placeholder="e.g. PPK / Bendahara Pengeluaran"
                onChange={(e) => onUpdateBuletinConfig({
                  ...buletinConfig,
                  wawancaraSatker: { ...buletinConfig.wawancaraSatker, judul: buletinConfig.wawancaraSatker?.judul || '', narasumber: buletinConfig.wawancaraSatker?.narasumber || '', satker: buletinConfig.wawancaraSatker?.satker || '', isiWawancara: buletinConfig.wawancaraSatker?.isiWawancara || '', kutipanPenting: buletinConfig.wawancaraSatker?.kutipanPenting || '', jabatan: e.target.value }
                })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Satuan Kerja Narasumber</label>
              <input
                type="text"
                value={buletinConfig.wawancaraSatker?.satker || ''}
                placeholder="e.g. Politeknik Ilmu Pelayaran Semarang"
                onChange={(e) => onUpdateBuletinConfig({
                  ...buletinConfig,
                  wawancaraSatker: { ...buletinConfig.wawancaraSatker, judul: buletinConfig.wawancaraSatker?.judul || '', narasumber: buletinConfig.wawancaraSatker?.narasumber || '', jabatan: buletinConfig.wawancaraSatker?.jabatan || '', isiWawancara: buletinConfig.wawancaraSatker?.isiWawancara || '', kutipanPenting: buletinConfig.wawancaraSatker?.kutipanPenting || '', satker: e.target.value }
                })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-bold"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Judul Artikel Wawancara</label>
            <input
              type="text"
              value={buletinConfig.wawancaraSatker?.judul || ''}
              placeholder="e.g. Pentingnya Disiplin RPD dan Transparansi Anggaran..."
              onChange={(e) => onUpdateBuletinConfig({
                ...buletinConfig,
                wawancaraSatker: { ...buletinConfig.wawancaraSatker, narasumber: buletinConfig.wawancaraSatker?.narasumber || '', jabatan: buletinConfig.wawancaraSatker?.jabatan || '', satker: buletinConfig.wawancaraSatker?.satker || '', isiWawancara: buletinConfig.wawancaraSatker?.isiWawancara || '', kutipanPenting: buletinConfig.wawancaraSatker?.kutipanPenting || '', judul: e.target.value }
              })}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-bold"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Isi Wawancara (Bagian 1 - Hal 9)</label>
            <textarea
              rows={3}
              value={buletinConfig.wawancaraSatker?.isiWawancara || ''}
              placeholder="Tuliskan petikan wawancara..."
              onChange={(e) => onUpdateBuletinConfig({
                ...buletinConfig,
                wawancaraSatker: { ...buletinConfig.wawancaraSatker, judul: buletinConfig.wawancaraSatker?.judul || '', narasumber: buletinConfig.wawancaraSatker?.narasumber || '', jabatan: buletinConfig.wawancaraSatker?.jabatan || '', satker: buletinConfig.wawancaraSatker?.satker || '', kutipanPenting: buletinConfig.wawancaraSatker?.kutipanPenting || '', isiWawancara: e.target.value }
              })}
              className="w-full p-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Kutipan Penting (Quote Box)</label>
            <input
              type="text"
              value={buletinConfig.wawancaraSatker?.kutipanPenting || ''}
              placeholder="e.g. Koordinasi aktif dengan Helpdesk KPPN Semarang I membuat kendala terselesaikan..."
              onChange={(e) => onUpdateBuletinConfig({
                ...buletinConfig,
                wawancaraSatker: { ...buletinConfig.wawancaraSatker, judul: buletinConfig.wawancaraSatker?.judul || '', narasumber: buletinConfig.wawancaraSatker?.narasumber || '', jabatan: buletinConfig.wawancaraSatker?.jabatan || '', satker: buletinConfig.wawancaraSatker?.satker || '', isiWawancara: buletinConfig.wawancaraSatker?.isiWawancara || '', kutipanPenting: e.target.value }
              })}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 italic font-semibold"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Kelanjutan Artikel / Praktik Baik (Bagian 2 - Hal 10)</label>
            <textarea
              rows={3}
              value={buletinConfig.wawancaraSatker?.isiWawancara2 || ''}
              placeholder="Tuliskan kelanjutan artikel praktik baik dan evaluasi kinerja..."
              onChange={(e) => onUpdateBuletinConfig({
                ...buletinConfig,
                wawancaraSatker: { ...buletinConfig.wawancaraSatker, judul: buletinConfig.wawancaraSatker?.judul || '', narasumber: buletinConfig.wawancaraSatker?.narasumber || '', jabatan: buletinConfig.wawancaraSatker?.jabatan || '', satker: buletinConfig.wawancaraSatker?.satker || '', isiWawancara: buletinConfig.wawancaraSatker?.isiWawancara || '', kutipanPenting: buletinConfig.wawancaraSatker?.kutipanPenting || '', isiWawancara2: e.target.value }
              })}
              className="w-full p-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600"
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: SARWA SARWI KPPN (HAL 11-14)                                       */}
      {/* ========================================================================= */}
      {activeTab === 'sarwasarwi' && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
          <h4 className="text-xs font-black uppercase text-purple-700 dark:text-purple-400 tracking-wider">
            Rubrik Sarwa Sarwi: Capacity Building &amp; Outbound Internal (Halaman 11-14)
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Judul Liputan</label>
              <input
                type="text"
                value={buletinConfig.sarwaSarwi?.judul || ''}
                placeholder="e.g. Sinergi dan Kolaborasi Tingkatkan Prestasi"
                onChange={(e) => onUpdateBuletinConfig({
                  ...buletinConfig,
                  sarwaSarwi: { ...buletinConfig.sarwaSarwi, temaKegiatan: buletinConfig.sarwaSarwi?.temaKegiatan || '', tanggal: buletinConfig.sarwaSarwi?.tanggal || '', lokasi: buletinConfig.sarwaSarwi?.lokasi || '', ceritaBagian1: buletinConfig.sarwaSarwi?.ceritaBagian1 || '', ceritaBagian2: buletinConfig.sarwaSarwi?.ceritaBagian2 || '', ceritaBagian3Purnabakti: buletinConfig.sarwaSarwi?.ceritaBagian3Purnabakti || '', ceritaBagian4RiverTubing: buletinConfig.sarwaSarwi?.ceritaBagian4RiverTubing || '', pesanKepala: buletinConfig.sarwaSarwi?.pesanKepala || '', judul: e.target.value }
                })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Tema Kegiatan</label>
              <input
                type="text"
                value={buletinConfig.sarwaSarwi?.temaKegiatan || ''}
                placeholder="e.g. Capacity Building & Outbound Insan KPPN"
                onChange={(e) => onUpdateBuletinConfig({
                  ...buletinConfig,
                  sarwaSarwi: { ...buletinConfig.sarwaSarwi, judul: buletinConfig.sarwaSarwi?.judul || '', tanggal: buletinConfig.sarwaSarwi?.tanggal || '', lokasi: buletinConfig.sarwaSarwi?.lokasi || '', ceritaBagian1: buletinConfig.sarwaSarwi?.ceritaBagian1 || '', ceritaBagian2: buletinConfig.sarwaSarwi?.ceritaBagian2 || '', ceritaBagian3Purnabakti: buletinConfig.sarwaSarwi?.ceritaBagian3Purnabakti || '', ceritaBagian4RiverTubing: buletinConfig.sarwaSarwi?.ceritaBagian4RiverTubing || '', pesanKepala: buletinConfig.sarwaSarwi?.pesanKepala || '', temaKegiatan: e.target.value }
                })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Lokasi Kegiatan</label>
              <input
                type="text"
                value={buletinConfig.sarwaSarwi?.lokasi || ''}
                placeholder="e.g. Bandungan, Kabupaten Semarang"
                onChange={(e) => onUpdateBuletinConfig({
                  ...buletinConfig,
                  sarwaSarwi: { ...buletinConfig.sarwaSarwi, judul: buletinConfig.sarwaSarwi?.judul || '', temaKegiatan: buletinConfig.sarwaSarwi?.temaKegiatan || '', tanggal: buletinConfig.sarwaSarwi?.tanggal || '', ceritaBagian1: buletinConfig.sarwaSarwi?.ceritaBagian1 || '', ceritaBagian2: buletinConfig.sarwaSarwi?.ceritaBagian2 || '', ceritaBagian3Purnabakti: buletinConfig.sarwaSarwi?.ceritaBagian3Purnabakti || '', ceritaBagian4RiverTubing: buletinConfig.sarwaSarwi?.ceritaBagian4RiverTubing || '', pesanKepala: buletinConfig.sarwaSarwi?.pesanKepala || '', lokasi: e.target.value }
                })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Cerita Pembuka (Hal 11)</label>
              <textarea
                rows={3}
                value={buletinConfig.sarwaSarwi?.ceritaBagian1 || ''}
                placeholder="Deskripsi pembuka acara capacity building..."
                onChange={(e) => onUpdateBuletinConfig({
                  ...buletinConfig,
                  sarwaSarwi: { ...buletinConfig.sarwaSarwi, judul: buletinConfig.sarwaSarwi?.judul || '', temaKegiatan: buletinConfig.sarwaSarwi?.temaKegiatan || '', tanggal: buletinConfig.sarwaSarwi?.tanggal || '', lokasi: buletinConfig.sarwaSarwi?.lokasi || '', ceritaBagian2: buletinConfig.sarwaSarwi?.ceritaBagian2 || '', ceritaBagian3Purnabakti: buletinConfig.sarwaSarwi?.ceritaBagian3Purnabakti || '', ceritaBagian4RiverTubing: buletinConfig.sarwaSarwi?.ceritaBagian4RiverTubing || '', pesanKepala: buletinConfig.sarwaSarwi?.pesanKepala || '', ceritaBagian1: e.target.value }
                })}
                className="w-full p-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Keseruan Outbound &amp; Games (Hal 12)</label>
              <textarea
                rows={3}
                value={buletinConfig.sarwaSarwi?.ceritaBagian2 || ''}
                placeholder="Cerita permainan tim dan yel-yel..."
                onChange={(e) => onUpdateBuletinConfig({
                  ...buletinConfig,
                  sarwaSarwi: { ...buletinConfig.sarwaSarwi, judul: buletinConfig.sarwaSarwi?.judul || '', temaKegiatan: buletinConfig.sarwaSarwi?.temaKegiatan || '', tanggal: buletinConfig.sarwaSarwi?.tanggal || '', lokasi: buletinConfig.sarwaSarwi?.lokasi || '', ceritaBagian1: buletinConfig.sarwaSarwi?.ceritaBagian1 || '', ceritaBagian3Purnabakti: buletinConfig.sarwaSarwi?.ceritaBagian3Purnabakti || '', ceritaBagian4RiverTubing: buletinConfig.sarwaSarwi?.ceritaBagian4RiverTubing || '', pesanKepala: buletinConfig.sarwaSarwi?.pesanKepala || '', ceritaBagian2: e.target.value }
                })}
                className="w-full p-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Momen Penghormatan Purnabakti (Hal 13)</label>
              <textarea
                rows={3}
                value={buletinConfig.sarwaSarwi?.ceritaBagian3Purnabakti || ''}
                placeholder="Cerita pelepasan pegawai purnabakti..."
                onChange={(e) => onUpdateBuletinConfig({
                  ...buletinConfig,
                  sarwaSarwi: { ...buletinConfig.sarwaSarwi, judul: buletinConfig.sarwaSarwi?.judul || '', temaKegiatan: buletinConfig.sarwaSarwi?.temaKegiatan || '', tanggal: buletinConfig.sarwaSarwi?.tanggal || '', lokasi: buletinConfig.sarwaSarwi?.lokasi || '', ceritaBagian1: buletinConfig.sarwaSarwi?.ceritaBagian1 || '', ceritaBagian2: buletinConfig.sarwaSarwi?.ceritaBagian2 || '', ceritaBagian4RiverTubing: buletinConfig.sarwaSarwi?.ceritaBagian4RiverTubing || '', pesanKepala: buletinConfig.sarwaSarwi?.pesanKepala || '', ceritaBagian3Purnabakti: e.target.value }
                })}
                className="w-full p-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">River Tubing &amp; Pesan Penutup (Hal 14)</label>
              <textarea
                rows={3}
                value={buletinConfig.sarwaSarwi?.ceritaBagian4RiverTubing || ''}
                placeholder="Cerita keseruan river tubing dan pesan penutup..."
                onChange={(e) => onUpdateBuletinConfig({
                  ...buletinConfig,
                  sarwaSarwi: { ...buletinConfig.sarwaSarwi, judul: buletinConfig.sarwaSarwi?.judul || '', temaKegiatan: buletinConfig.sarwaSarwi?.temaKegiatan || '', tanggal: buletinConfig.sarwaSarwi?.tanggal || '', lokasi: buletinConfig.sarwaSarwi?.lokasi || '', ceritaBagian1: buletinConfig.sarwaSarwi?.ceritaBagian1 || '', ceritaBagian2: buletinConfig.sarwaSarwi?.ceritaBagian2 || '', ceritaBagian3Purnabakti: buletinConfig.sarwaSarwi?.ceritaBagian3Purnabakti || '', pesanKepala: buletinConfig.sarwaSarwi?.pesanKepala || '', ceritaBagian4RiverTubing: e.target.value }
                })}
                className="w-full p-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: PAGELARAN SEMARANG & UMKM BINAAN (HAL 15-16)                       */}
      {/* ========================================================================= */}
      {activeTab === 'pagelaran' && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
          <h4 className="text-xs font-black uppercase text-amber-700 dark:text-amber-400 tracking-wider">
            Rubrik Pagelaran: Pawai Budaya &amp; UMKM Binaan Kemenkeu Satu (Halaman 15 &amp; 16)
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Event Budaya (Hal 15) */}
            <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 space-y-3">
              <div className="font-bold text-xs text-amber-900 dark:text-amber-300">
                Pawai &amp; Kebudayaan Semarang (Hal 15)
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500">Judul Event / Festival</label>
                <input
                  type="text"
                  value={buletinConfig.pagelaranSemarang?.judulEvent || ''}
                  placeholder="e.g. Semarak Pawai Seni Budaya Kota Semarang"
                  onChange={(e) => onUpdateBuletinConfig({
                    ...buletinConfig,
                    pagelaranSemarang: { ...buletinConfig.pagelaranSemarang, tanggalEvent: buletinConfig.pagelaranSemarang?.tanggalEvent || '', lokasiEvent: buletinConfig.pagelaranSemarang?.lokasiEvent || '', deskripsiEvent: buletinConfig.pagelaranSemarang?.deskripsiEvent || '', judulUmkm: buletinConfig.pagelaranSemarang?.judulUmkm || '', deskripsiUmkm: buletinConfig.pagelaranSemarang?.deskripsiUmkm || '', judulEvent: e.target.value }
                  })}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500">Deskripsi Event Budaya</label>
                <textarea
                  rows={4}
                  value={buletinConfig.pagelaranSemarang?.deskripsiEvent || ''}
                  placeholder="Ulasan keseruan pawai budaya warga Semarang..."
                  onChange={(e) => onUpdateBuletinConfig({
                    ...buletinConfig,
                    pagelaranSemarang: { ...buletinConfig.pagelaranSemarang, judulEvent: buletinConfig.pagelaranSemarang?.judulEvent || '', tanggalEvent: buletinConfig.pagelaranSemarang?.tanggalEvent || '', lokasiEvent: buletinConfig.pagelaranSemarang?.lokasiEvent || '', judulUmkm: buletinConfig.pagelaranSemarang?.judulUmkm || '', deskripsiUmkm: buletinConfig.pagelaranSemarang?.deskripsiUmkm || '', deskripsiEvent: e.target.value }
                  })}
                  className="w-full p-2.5 text-xs rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600"
                />
              </div>
            </div>

            {/* UMKM Binaan (Hal 16) */}
            <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 space-y-3">
              <div className="font-bold text-xs text-amber-900 dark:text-amber-300">
                Pemberdayaan UMKM Binaan Kemenkeu Satu (Hal 16)
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500">Nama / Judul UMKM Binaan</label>
                <input
                  type="text"
                  value={buletinConfig.pagelaranSemarang?.judulUmkm || ''}
                  placeholder="e.g. Galeri Batik &amp; Kuliner Tradisional Binaan Kemenkeu Satu"
                  onChange={(e) => onUpdateBuletinConfig({
                    ...buletinConfig,
                    pagelaranSemarang: { ...buletinConfig.pagelaranSemarang, judulEvent: buletinConfig.pagelaranSemarang?.judulEvent || '', tanggalEvent: buletinConfig.pagelaranSemarang?.tanggalEvent || '', lokasiEvent: buletinConfig.pagelaranSemarang?.lokasiEvent || '', deskripsiEvent: buletinConfig.pagelaranSemarang?.deskripsiEvent || '', deskripsiUmkm: buletinConfig.pagelaranSemarang?.deskripsiUmkm || '', judulUmkm: e.target.value }
                  })}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500">Deskripsi Pembinaan &amp; Produk UMKM</label>
                <textarea
                  rows={4}
                  value={buletinConfig.pagelaranSemarang?.deskripsiUmkm || ''}
                  placeholder="Ulasan bantuan pembiayaan UMi, pelatihan sertifikasi halal, dan pemasaran..."
                  onChange={(e) => onUpdateBuletinConfig({
                    ...buletinConfig,
                    pagelaranSemarang: { ...buletinConfig.pagelaranSemarang, judulEvent: buletinConfig.pagelaranSemarang?.judulEvent || '', tanggalEvent: buletinConfig.pagelaranSemarang?.tanggalEvent || '', lokasiEvent: buletinConfig.pagelaranSemarang?.lokasiEvent || '', deskripsiEvent: buletinConfig.pagelaranSemarang?.deskripsiEvent || '', judulUmkm: buletinConfig.pagelaranSemarang?.judulUmkm || '', deskripsiUmkm: e.target.value }
                  })}
                  className="w-full p-2.5 text-xs rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: TEROPONG SEMARANG (HAL 17-18)                                      */}
      {/* ========================================================================= */}
      {activeTab === 'teropong' && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
          <h4 className="text-xs font-black uppercase text-rose-700 dark:text-rose-400 tracking-wider">
            Rubrik Teropong: Kearifan Lokal &amp; Wisata Bersejarah (Halaman 17 &amp; 18)
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Lokasi 1: Kota Lama (Hal 17) */}
            <div className="p-4 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/60 space-y-3">
              <div className="font-bold text-xs text-rose-900 dark:text-rose-300">
                Lokasi Wisata 1 (Hal 17)
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500">Nama Ikon Wisata 1</label>
                <input
                  type="text"
                  value={buletinConfig.teropongSemarang?.lokasi1Nama || ''}
                  placeholder="e.g. Kawasan Cagar Budaya Kota Lama Semarang"
                  onChange={(e) => onUpdateBuletinConfig({
                    ...buletinConfig,
                    teropongSemarang: { ...buletinConfig.teropongSemarang, lokasi1Deskripsi: buletinConfig.teropongSemarang?.lokasi1Deskripsi || '', lokasi2Nama: buletinConfig.teropongSemarang?.lokasi2Nama || '', lokasi2Deskripsi: buletinConfig.teropongSemarang?.lokasi2Deskripsi || '', lokasi1Nama: e.target.value }
                  })}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500">Ulasan &amp; Nilai Historis</label>
                <textarea
                  rows={4}
                  value={buletinConfig.teropongSemarang?.lokasi1Deskripsi || ''}
                  placeholder="Ulasan cagar budaya Gereja Blenduk, Taman Srigunting..."
                  onChange={(e) => onUpdateBuletinConfig({
                    ...buletinConfig,
                    teropongSemarang: { ...buletinConfig.teropongSemarang, lokasi1Nama: buletinConfig.teropongSemarang?.lokasi1Nama || '', lokasi2Nama: buletinConfig.teropongSemarang?.lokasi2Nama || '', lokasi2Deskripsi: buletinConfig.teropongSemarang?.lokasi2Deskripsi || '', lokasi1Deskripsi: e.target.value }
                  })}
                  className="w-full p-2.5 text-xs rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600"
                />
              </div>
            </div>

            {/* Lokasi 2: Lawang Sewu (Hal 18) */}
            <div className="p-4 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/60 space-y-3">
              <div className="font-bold text-xs text-rose-900 dark:text-rose-300">
                Lokasi Wisata 2 (Hal 18)
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500">Nama Ikon Wisata 2</label>
                <input
                  type="text"
                  value={buletinConfig.teropongSemarang?.lokasi2Nama || ''}
                  placeholder="e.g. Landmark Lawang Sewu &amp; Kawasan Tugu Muda"
                  onChange={(e) => onUpdateBuletinConfig({
                    ...buletinConfig,
                    teropongSemarang: { ...buletinConfig.teropongSemarang, lokasi1Nama: buletinConfig.teropongSemarang?.lokasi1Nama || '', lokasi1Deskripsi: buletinConfig.teropongSemarang?.lokasi1Deskripsi || '', lokasi2Deskripsi: buletinConfig.teropongSemarang?.lokasi2Deskripsi || '', lokasi2Nama: e.target.value }
                  })}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500">Ulasan &amp; Nilai Historis</label>
                <textarea
                  rows={4}
                  value={buletinConfig.teropongSemarang?.lokasi2Deskripsi || ''}
                  placeholder="Ulasan sejarah perkeretaapian dan museum Lawang Sewu..."
                  onChange={(e) => onUpdateBuletinConfig({
                    ...buletinConfig,
                    teropongSemarang: { ...buletinConfig.teropongSemarang, lokasi1Nama: buletinConfig.teropongSemarang?.lokasi1Nama || '', lokasi1Deskripsi: buletinConfig.teropongSemarang?.lokasi1Deskripsi || '', lokasi2Nama: buletinConfig.teropongSemarang?.lokasi2Nama || '', lokasi2Deskripsi: e.target.value }
                  })}
                  className="w-full p-2.5 text-xs rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 8: ZONA INTEGRITAS, PANTUN & KONTAK (HAL 19-20)                       */}
      {/* ========================================================================= */}
      {activeTab === 'integritas' && (
        <div className="space-y-4">
          {/* Hal 19: Pantun & Integritas */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
            <h4 className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">
              Zona Integritas &amp; Pantun Antikorupsi (Halaman 19)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500">Bait 1</label>
                <input
                  type="text"
                  value={buletinConfig.pantunAntiKorupsi?.bait1 || ''}
                  placeholder="e.g. Jalan-jalan ke Simpang Lima membeli lumpia,"
                  onChange={(e) => onUpdateBuletinConfig({
                    ...buletinConfig,
                    pantunAntiKorupsi: { ...buletinConfig.pantunAntiKorupsi, bait2: buletinConfig.pantunAntiKorupsi?.bait2 || '', bait3: buletinConfig.pantunAntiKorupsi?.bait3 || '', bait4: buletinConfig.pantunAntiKorupsi?.bait4 || '', bait1: e.target.value }
                  })}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500">Bait 2</label>
                <input
                  type="text"
                  value={buletinConfig.pantunAntiKorupsi?.bait2 || ''}
                  placeholder="e.g. Mampir kulineran tahu gimbal nikmat tiada tara;"
                  onChange={(e) => onUpdateBuletinConfig({
                    ...buletinConfig,
                    pantunAntiKorupsi: { ...buletinConfig.pantunAntiKorupsi, bait1: buletinConfig.pantunAntiKorupsi?.bait1 || '', bait3: buletinConfig.pantunAntiKorupsi?.bait3 || '', bait4: buletinConfig.pantunAntiKorupsi?.bait4 || '', bait2: e.target.value }
                  })}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500">Bait 3</label>
                <input
                  type="text"
                  value={buletinConfig.pantunAntiKorupsi?.bait3 || ''}
                  placeholder="e.g. KPPN Semarang I melayani dengan tulus dan prima,"
                  onChange={(e) => onUpdateBuletinConfig({
                    ...buletinConfig,
                    pantunAntiKorupsi: { ...buletinConfig.pantunAntiKorupsi, bait1: buletinConfig.pantunAntiKorupsi?.bait1 || '', bait2: buletinConfig.pantunAntiKorupsi?.bait2 || '', bait4: buletinConfig.pantunAntiKorupsi?.bait4 || '', bait3: e.target.value }
                  })}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500">Bait 4</label>
                <input
                  type="text"
                  value={buletinConfig.pantunAntiKorupsi?.bait4 || ''}
                  placeholder="e.g. Tanpa suap, tolak gratifikasi, integritas nomor satu selamanya!"
                  onChange={(e) => onUpdateBuletinConfig({
                    ...buletinConfig,
                    pantunAntiKorupsi: { ...buletinConfig.pantunAntiKorupsi, bait1: buletinConfig.pantunAntiKorupsi?.bait1 || '', bait2: buletinConfig.pantunAntiKorupsi?.bait2 || '', bait3: buletinConfig.pantunAntiKorupsi?.bait3 || '', bait4: e.target.value }
                  })}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-bold text-emerald-700 dark:text-emerald-400"
                />
              </div>
            </div>
          </div>

          {/* Hal 20: Back Cover & Kontak */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
            <h4 className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">
              Informasi Kontak &amp; Saluran Pengaduan KPPN (Halaman 20)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500">Alamat Kantor</label>
                <input
                  type="text"
                  value={buletinConfig.kontakKppn?.alamat || ''}
                  placeholder="e.g. Jl. Ki Mangunsarkoro No. 34, Semarang"
                  onChange={(e) => onUpdateBuletinConfig({
                    ...buletinConfig,
                    kontakKppn: { ...buletinConfig.kontakKppn, telepon: buletinConfig.kontakKppn?.telepon || '', whatsappHelpdesk: buletinConfig.kontakKppn?.whatsappHelpdesk || '', email: buletinConfig.kontakKppn?.email || '', website: buletinConfig.kontakKppn?.website || '', instagram: buletinConfig.kontakKppn?.instagram || '', youtube: buletinConfig.kontakKppn?.youtube || '', alamat: e.target.value }
                  })}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500">Telepon / Fax</label>
                <input
                  type="text"
                  value={buletinConfig.kontakKppn?.telepon || ''}
                  placeholder="e.g. (024) 8311545"
                  onChange={(e) => onUpdateBuletinConfig({
                    ...buletinConfig,
                    kontakKppn: { ...buletinConfig.kontakKppn, alamat: buletinConfig.kontakKppn?.alamat || '', whatsappHelpdesk: buletinConfig.kontakKppn?.whatsappHelpdesk || '', email: buletinConfig.kontakKppn?.email || '', website: buletinConfig.kontakKppn?.website || '', instagram: buletinConfig.kontakKppn?.instagram || '', youtube: buletinConfig.kontakKppn?.youtube || '', telepon: e.target.value }
                  })}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500">WhatsApp Helpdesk</label>
                <input
                  type="text"
                  value={buletinConfig.kontakKppn?.whatsappHelpdesk || ''}
                  placeholder="e.g. 0811-270-1545"
                  onChange={(e) => onUpdateBuletinConfig({
                    ...buletinConfig,
                    kontakKppn: { ...buletinConfig.kontakKppn, alamat: buletinConfig.kontakKppn?.alamat || '', telepon: buletinConfig.kontakKppn?.telepon || '', email: buletinConfig.kontakKppn?.email || '', website: buletinConfig.kontakKppn?.website || '', instagram: buletinConfig.kontakKppn?.instagram || '', youtube: buletinConfig.kontakKppn?.youtube || '', whatsappHelpdesk: e.target.value }
                  })}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-mono font-bold text-emerald-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500">Email Resmi</label>
                <input
                  type="text"
                  value={buletinConfig.kontakKppn?.email || ''}
                  placeholder="e.g. kppnsemarang1@kemenkeu.go.id"
                  onChange={(e) => onUpdateBuletinConfig({
                    ...buletinConfig,
                    kontakKppn: { ...buletinConfig.kontakKppn, alamat: buletinConfig.kontakKppn?.alamat || '', telepon: buletinConfig.kontakKppn?.telepon || '', whatsappHelpdesk: buletinConfig.kontakKppn?.whatsappHelpdesk || '', website: buletinConfig.kontakKppn?.website || '', instagram: buletinConfig.kontakKppn?.instagram || '', youtube: buletinConfig.kontakKppn?.youtube || '', email: e.target.value }
                  })}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500">Website Resmi</label>
                <input
                  type="text"
                  value={buletinConfig.kontakKppn?.website || ''}
                  placeholder="e.g. djpb.kemenkeu.go.id/kppn/semarang1"
                  onChange={(e) => onUpdateBuletinConfig({
                    ...buletinConfig,
                    kontakKppn: { ...buletinConfig.kontakKppn, alamat: buletinConfig.kontakKppn?.alamat || '', telepon: buletinConfig.kontakKppn?.telepon || '', whatsappHelpdesk: buletinConfig.kontakKppn?.whatsappHelpdesk || '', email: buletinConfig.kontakKppn?.email || '', instagram: buletinConfig.kontakKppn?.instagram || '', youtube: buletinConfig.kontakKppn?.youtube || '', website: e.target.value }
                  })}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500">Instagram Resmi</label>
                <input
                  type="text"
                  value={buletinConfig.kontakKppn?.instagram || ''}
                  placeholder="e.g. @kppnsemarang1"
                  onChange={(e) => onUpdateBuletinConfig({
                    ...buletinConfig,
                    kontakKppn: { ...buletinConfig.kontakKppn, alamat: buletinConfig.kontakKppn?.alamat || '', telepon: buletinConfig.kontakKppn?.telepon || '', whatsappHelpdesk: buletinConfig.kontakKppn?.whatsappHelpdesk || '', email: buletinConfig.kontakKppn?.email || '', website: buletinConfig.kontakKppn?.website || '', youtube: buletinConfig.kontakKppn?.youtube || '', instagram: e.target.value }
                  })}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
