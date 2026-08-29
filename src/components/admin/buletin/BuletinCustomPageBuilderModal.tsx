import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Edit3,
  Layers,
  Sparkles,
  CheckCircle2,
  FileText,
  PieChart,
  Quote,
  Table as TableIcon,
  Image as ImageIcon,
  ChevronUp,
  ChevronDown,
  Eye,
  SlidersHorizontal,
  Copy,
  Zap
} from 'lucide-react';
import { BuletinConfig, CustomBuletinPage } from '../../../types';
import { useToast } from '../../ToastNotification';

interface BuletinCustomPageBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  buletinConfig: BuletinConfig;
  onUpdateBuletinConfig: (updated: BuletinConfig) => void;
}

const TEMPLATE_OPTIONS = [
  {
    id: 'split_article',
    title: 'Artikel & Sorotan (2 Kolom)',
    desc: 'Teks narasi mendalam, kutipan penting, dan foto pendukung.',
    icon: FileText
  },
  {
    id: 'infographic_cards',
    title: 'Kartu Infografis & Statistik',
    desc: '3 kartu metrik statistik besar, narasi, dan visual data.',
    icon: PieChart
  },
  {
    id: 'interview_spotlight',
    title: 'Wawancara & Profil Narasumber',
    desc: 'Format tanya-jawab (Q&A) elegan dengan profil narasumber.',
    icon: Quote
  },
  {
    id: 'photo_story',
    title: 'Foto Cerita & Dokumentasi',
    desc: 'Foto lanskap resolusi tinggi dengan narasi cerita mendalam.',
    icon: ImageIcon
  },
  {
    id: 'data_table',
    title: 'Tabel Data & Matriks Khusus',
    desc: 'Tabel 4 kolom yang fleksibel untuk data satker, anggaran, atau proyek.',
    icon: TableIcon
  }
];

const PRESETS: Array<{
  name: string;
  category: string;
  data: Omit<CustomBuletinPage, 'id' | 'createdAt'>;
}> = [
  {
    name: 'Sorotan Satker Teladan IKPA 100',
    category: 'Prestasi',
    data: {
      title: 'Kiat Sukses Satker Peraih Nilai IKPA 100 Sempurna',
      section: 'Sorotan Prestasi',
      template: 'interview_spotlight',
      subtitle: 'Disiplin Halaman III DIPA dan Ketepatan LPJ Bendahara Menjadi Kunci Utama',
      quote: 'Kunci nilai 100 bukan hanya cepat belanja, tetapi tepat sasaran, patuh regulasi, dan tanpa deviasi.',
      quoteAuthor: 'Kepala Bagian Keuangan Satker Teladan',
      contentParagraph1: 'Kami menerapkan monitoring harian pada setiap SPM yang akan diajukan ke KPPN Semarang I. Rekonsiliasi internal dilakukan sebelum tanggal 5 setiap bulannya untuk memastikan tidak ada selisih saldo kas.',
      contentParagraph2: 'Komunikasi intensif dengan Customer Service Officer (CSO) KPPN Semarang I sangat membantu kami dalam mengantisipasi penolakan SPM dan memastikan seluruh dokumen pendukung telah lengkap.',
      contentParagraph3: 'Ke depan, kami siap mengimplementasikan 100% transaksi non-tunai melalui KKP dan Digipay Satu guna mewujudkan tata kelola kas yang akuntabel dan transparan.',
      tags: ['IKPA', 'SatkerTeladan', 'Sinergi']
    }
  },
  {
    name: 'Infografis Akselerasi Digipay Satu & Cashless',
    category: 'Digitalisasi',
    data: {
      title: 'Revolusi Pembayaran Digital: Digipay Satu & KKP',
      section: 'Digitalisasi Fiskal',
      template: 'infographic_cards',
      subtitle: 'Memodernisasi Pengadaan Pemerintah dan Memberdayakan UMKM Lokal',
      contentParagraph1: 'KPPN Semarang I terus mendorong percepatan digitalisasi belanja negara. Melalui platform Digipay Satu dan Kartu Kredit Pemerintah (KKP), seluruh proses pengadaan barang dan jasa instansi pemerintah kini berlangsung lebih cepat, aman, dan tanpa uang tunai.',
      stats: [
        { label: 'Total Transaksi Digipay', value: '1.420+', desc: 'Transaksi pengadaan digital sukses' },
        { label: 'Vendor UMKM Terdaftar', value: '450+ Mitra', desc: 'Pelaku usaha lokal di Semarang' },
        { label: 'Efisiensi Waktu Salur', value: '99.4%', desc: 'Penyelesaian pembayaran instan' }
      ],
      contentParagraph2: 'Penggunaan KKP domestik berbasis QRIS juga meminimalisir risiko pengelolaan uang tunai di bendahara serta mempercepat *cash flow* para pelaku UMKM rekanan satker.',
      tags: ['DigipaySatu', 'KKP', 'CashlessTreasury']
    }
  },
  {
    name: 'Tabel Monitoring Proyek Strategis SBSN',
    category: 'Data Khusus',
    data: {
      title: 'Matriks Realisasi Proyek Strategis Nasional (SBSN)',
      section: 'Proyek Strategis',
      template: 'data_table',
      subtitle: 'Pemantauan Berkala Proyek Infrastruktur Berkelanjutan Wilayah Semarang',
      contentParagraph1: 'Berikut adalah rekapitulasi progres fisik dan penyerapan dana proyek yang didanai melalui Surat Berharga Syariah Negara (SBSN) yang disalurkan melalui KPPN Semarang I:',
      tableHeaders: ['Kode / No', 'Nama Proyek & Lokasi', 'Pagu SBSN', 'Realisasi Fisik & Keuangan'],
      tableData: [
        { col1: 'SBSN-01', col2: 'Gedung Laboratorium Terpadu Universitas', col3: 'Rp 45.000.000.000', col4: '92.4% (On Schedule)' },
        { col1: 'SBSN-02', col2: 'Fasilitas Layanan Publik Terpadu Wilayah', col3: 'Rp 28.500.000.000', col4: '88.1% (On Schedule)' },
        { col1: 'SBSN-03', col2: 'Pusat Riset Agrikultur & Ketahanan Pangan', col3: 'Rp 34.200.000.000', col4: '95.0% (Lanjutan)' },
        { col1: 'SBSN-04', col2: 'Modernisasi Sarana Transportasi Wilayah', col3: 'Rp 19.800.000.000', col4: '100% (Selesai BAST)' }
      ],
      contentParagraph2: 'Seluruh proyek berjalan tepat waktu dengan koordinasi aktif antara PPK, konsultan pengawas, dan KPPN Semarang I.',
      tags: ['SBSN', 'Infrastruktur', 'ProyekStrategis']
    }
  }
];

export const BuletinCustomPageBuilderModal: React.FC<BuletinCustomPageBuilderModalProps> = ({
  isOpen,
  onClose,
  buletinConfig,
  onUpdateBuletinConfig
}) => {
  const { addToast } = useToast();
  const customPages = buletinConfig.customPages || [];

  const [activeTab, setActiveTab] = useState<'list' | 'editor'>('list');
  const [editingPageId, setEditingPageId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Omit<CustomBuletinPage, 'id' | 'createdAt'>>({
    title: '',
    section: 'Sorotan Khusus',
    template: 'split_article',
    subtitle: '',
    contentParagraph1: '',
    contentParagraph2: '',
    contentParagraph3: '',
    quote: '',
    quoteAuthor: '',
    stats: [
      { label: 'Metrik Utama', value: '100%', desc: 'Deskripsi singkat capaian' },
      { label: 'Efisiensi', value: '98.5%', desc: 'Tingkat efisiensi anggaran' },
      { label: 'Mitra Terlibat', value: '50+ Satker', desc: 'Jumlah satuan kerja' }
    ],
    photoUrl: '',
    photoCaption: '',
    tableHeaders: ['No', 'Uraian', 'Pagu', 'Realisasi'],
    tableData: [
      { col1: '01', col2: 'Kegiatan A', col3: 'Rp 1.000.000.000', col4: '95.0%' },
      { col1: '02', col2: 'Kegiatan B', col3: 'Rp 2.500.000.000', col4: '98.2%' }
    ],
    tags: ['Fiskal', 'KPPNSemarangI']
  });

  if (!isOpen) return null;

  const handleStartCreateNew = () => {
    setEditingPageId(null);
    setFormData({
      title: 'Judul Halaman Kustom Baru',
      section: 'Sorotan Khusus',
      template: 'split_article',
      subtitle: 'Subjudul atau keterangan pengantar halaman',
      contentParagraph1: 'Tuliskan paragraf pertama isi artikel atau ulasan mendalam di sini...',
      contentParagraph2: 'Tuliskan paragraf kedua mengenai analisis atau tindak lanjut strategis...',
      contentParagraph3: 'Tuliskan kesimpulan dan rekomendasi penutup di sini...',
      quote: 'Integritas dan dedikasi prima adalah pondasi kokoh perbendaharaan negara.',
      quoteAuthor: 'Kepala KPPN Semarang I',
      stats: [
        { label: 'Pagu Alokasi', value: 'Rp 50 M+', desc: 'Total anggaran proyek' },
        { label: 'Capaian Output', value: '99.2%', desc: 'Realisasi fisik terlaksana' },
        { label: 'Kepatuhan RPD', value: '98.0%', desc: 'Sesuai Hal III DIPA' }
      ],
      photoUrl: '',
      photoCaption: 'Dokumentasi kegiatan resmi KPPN Semarang I',
      tableHeaders: ['No / Kode', 'Uraian / Satker', 'Alokasi Pagu', 'Realisasi (%)'],
      tableData: [
        { col1: '01', col2: 'Program Kerja Prioritas A', col3: 'Rp 5.000.000.000', col4: '98.5%' },
        { col1: '02', col2: 'Program Kerja Prioritas B', col3: 'Rp 3.200.000.000', col4: '94.2%' }
      ],
      tags: ['KPPNSemarangI', 'Fiskal']
    });
    setActiveTab('editor');
  };

  const handleApplyPreset = (preset: typeof PRESETS[0]) => {
    setFormData({ ...preset.data });
    setEditingPageId(null);
    setActiveTab('editor');
    addToast(`Template "${preset.name}" dimuat ke editor. Silakan sesuaikan datanya.`, 'info');
  };

  const handleEditExisting = (page: CustomBuletinPage) => {
    setEditingPageId(page.id);
    setFormData({
      title: page.title,
      section: page.section,
      template: page.template,
      subtitle: page.subtitle || '',
      contentParagraph1: page.contentParagraph1 || '',
      contentParagraph2: page.contentParagraph2 || '',
      contentParagraph3: page.contentParagraph3 || '',
      quote: page.quote || '',
      quoteAuthor: page.quoteAuthor || '',
      stats: page.stats || [
        { label: 'Metrik Utama', value: '100%', desc: '' },
        { label: 'Efisiensi', value: '95%', desc: '' },
        { label: 'Mitra', value: '50 Satker', desc: '' }
      ],
      photoUrl: page.photoUrl || '',
      photoCaption: page.photoCaption || '',
      tableHeaders: page.tableHeaders || ['No', 'Uraian', 'Pagu', 'Status'],
      tableData: page.tableData || [],
      tags: page.tags || []
    });
    setActiveTab('editor');
  };

  const handleSavePage = () => {
    if (!formData.title.trim()) {
      addToast('Judul halaman tidak boleh kosong.', 'error');
      return;
    }

    let updatedList: CustomBuletinPage[];
    if (editingPageId) {
      updatedList = customPages.map(p =>
        p.id === editingPageId
          ? {
              ...p,
              ...formData
            }
          : p
      );
      addToast('Halaman kustom berhasil diperbarui!', 'success');
    } else {
      const newPage: CustomBuletinPage = {
        id: `custom_page_${Date.now()}`,
        createdAt: new Date().toISOString(),
        ...formData
      };
      updatedList = [...customPages, newPage];
      addToast('Halaman kustom baru berhasil ditambahkan ke buletin!', 'success');
    }

    onUpdateBuletinConfig({
      ...buletinConfig,
      customPages: updatedList
    });

    setActiveTab('list');
    setEditingPageId(null);
  };

  const handleDeletePage = (id: string) => {
    const updatedList = customPages.filter(p => p.id !== id);
    onUpdateBuletinConfig({
      ...buletinConfig,
      customPages: updatedList
    });
    addToast('Halaman kustom telah dihapus.', 'info');
  };

  const handleMovePage = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= customPages.length) return;

    const newPages = [...customPages];
    const temp = newPages[index];
    newPages[index] = newPages[targetIdx];
    newPages[targetIdx] = temp;

    onUpdateBuletinConfig({
      ...buletinConfig,
      customPages: newPages
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-4xl w-full h-[90vh] flex flex-col shadow-2xl overflow-hidden text-white animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-300 text-slate-950 flex items-center justify-center font-black shadow-lg">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">Studio Penambah &amp; Pengelola Halaman Kustom</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  {customPages.length} Halaman Aktif
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Buat artikel baru, infografis, profil satker, atau tabel data untuk disisipkan langsung ke majalah
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="px-6 py-2 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('list')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'list'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Daftar Halaman ({customPages.length})
            </button>
            <button
              onClick={() => {
                if (activeTab !== 'editor') handleStartCreateNew();
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'editor'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {editingPageId ? 'Edit Halaman' : '+ Buat Halaman Baru'}
            </button>
          </div>

          {activeTab === 'list' && (
            <button
              onClick={handleStartCreateNew}
              className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Halaman</span>
            </button>
          )}
        </div>

        {/* TAB 1: LIST OF CUSTOM PAGES & PRESETS */}
        {activeTab === 'list' && (
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            {/* Quick Template Presets */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Pilih dari Template Siap Pakai:
                </span>
                <span className="text-[10px] text-slate-500">1-Klik untuk memuat layout &amp; contoh teks</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleApplyPreset(preset)}
                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-400/50 text-left space-y-2 group transition-all cursor-pointer hover:bg-slate-900"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-400">
                        {preset.category}
                      </span>
                      <Copy className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400" />
                    </div>
                    <div className="text-xs font-bold text-white group-hover:text-amber-300">
                      {preset.name}
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-2">
                      {preset.data.subtitle}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Existing Custom Pages List */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-300">
                Halaman Kustom Buletin Saat Ini ({customPages.length}):
              </span>

              {customPages.length === 0 ? (
                <div className="p-8 rounded-3xl border-2 border-dashed border-slate-800 bg-slate-950 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 text-amber-400 flex items-center justify-center mx-auto">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-bold text-white">Belum Ada Halaman Kustom</div>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Tambahkan halaman baru untuk memperkaya buletin Anda dengan wawancara satker, infografis capaian, atau ulasan proyek khusus.
                  </p>
                  <button
                    onClick={handleStartCreateNew}
                    className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs inline-flex items-center gap-2 shadow-lg transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Buat Halaman Pertama</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {customPages.map((page, idx) => (
                    <div
                      key={page.id}
                      className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4 hover:border-slate-700 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-800 text-amber-400 flex items-center justify-center font-bold text-xs">
                          {idx + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                              {page.section}
                            </span>
                            <span className="text-xs font-bold text-white">{page.title}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                            {page.subtitle || page.contentParagraph1 || 'Tidak ada subjudul'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleMovePage(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
                          title="Geser ke Atas"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleMovePage(idx, 'down')}
                          disabled={idx === customPages.length - 1}
                          className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
                          title="Geser ke Bawah"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditExisting(page)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs flex items-center gap-1 transition-all"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeletePage(page.id)}
                          className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors"
                          title="Hapus Halaman"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: PAGE EDITOR FORM */}
        {activeTab === 'editor' && (
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            {/* Template Chooser */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300">Pilih Model Template Layout:</label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {TEMPLATE_OPTIONS.map(tpl => {
                  const Icon = tpl.icon;
                  const isSelected = formData.template === tpl.id;
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, template: tpl.id as any }))}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-400 text-slate-950 border-amber-400 font-bold shadow-lg'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <Icon className="w-4 h-4 mb-2" />
                      <div className="text-xs font-bold">{tpl.title}</div>
                      <div className={`text-[9px] mt-0.5 line-clamp-2 ${isSelected ? 'text-slate-800' : 'text-slate-500'}`}>
                        {tpl.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="sm:col-span-8 space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">Judul Utama Halaman:</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Contoh: Kiat Sukses Satker Teladan IKPA 100"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-4 space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">Rubrik / Kategori:</label>
                <input
                  type="text"
                  value={formData.section}
                  onChange={e => setFormData(prev => ({ ...prev, section: e.target.value }))}
                  placeholder="Contoh: Sorotan Khusus / Opini"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">Subjudul / Deskripsi Singkat:</label>
              <input
                type="text"
                value={formData.subtitle || ''}
                onChange={e => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                placeholder="Contoh: Optimalisasi Perbendaharaan Melalui Sinergi SAKTI dan Digipay Satu"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none"
              />
            </div>

            {/* Narrative Paragraphs */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-300">Isi Naskah &amp; Narasi:</label>
              
              <div className="space-y-1">
                <span className="text-[11px] text-slate-400">Paragraf 1 (Pengantar / Pembuka):</span>
                <textarea
                  rows={3}
                  value={formData.contentParagraph1 || ''}
                  onChange={e => setFormData(prev => ({ ...prev, contentParagraph1: e.target.value }))}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  placeholder="Tuliskan pembuka artikel..."
                />
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-slate-400">Paragraf 2 (Pembahasan / Analisis Inti):</span>
                <textarea
                  rows={3}
                  value={formData.contentParagraph2 || ''}
                  onChange={e => setFormData(prev => ({ ...prev, contentParagraph2: e.target.value }))}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  placeholder="Tuliskan analisis atau rincian kegiatan..."
                />
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-slate-400">Paragraf 3 (Penutup / Rekomendasi):</span>
                <textarea
                  rows={3}
                  value={formData.contentParagraph3 || ''}
                  onChange={e => setFormData(prev => ({ ...prev, contentParagraph3: e.target.value }))}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  placeholder="Tuliskan kesimpulan..."
                />
              </div>
            </div>

            {/* Quote & Author */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Quote className="w-4 h-4" />
                Kutipan Penting / Sorotan Narasumber (Callout Quote):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-8">
                  <input
                    type="text"
                    value={formData.quote || ''}
                    onChange={e => setFormData(prev => ({ ...prev, quote: e.target.value }))}
                    placeholder="Contoh: Integritas dan kepatuhan adalah kunci sukses."
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                  />
                </div>
                <div className="sm:col-span-4">
                  <input
                    type="text"
                    value={formData.quoteAuthor || ''}
                    onChange={e => setFormData(prev => ({ ...prev, quoteAuthor: e.target.value }))}
                    placeholder="Nama / Jabatan Tokoh"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Photo Attachment */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-7 space-y-1">
                <label className="block text-xs font-bold text-slate-300">URL / Tautan Foto:</label>
                <input
                  type="text"
                  value={formData.photoUrl || ''}
                  onChange={e => setFormData(prev => ({ ...prev, photoUrl: e.target.value }))}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                />
              </div>
              <div className="sm:col-span-5 space-y-1">
                <label className="block text-xs font-bold text-slate-300">Keterangan Foto (Caption):</label>
                <input
                  type="text"
                  value={formData.photoCaption || ''}
                  onChange={e => setFormData(prev => ({ ...prev, photoCaption: e.target.value }))}
                  placeholder="Dokumentasi KPPN Semarang I"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                />
              </div>
            </div>
          </div>
        )}

        {/* Footer Buttons */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs">
          {activeTab === 'editor' ? (
            <>
              <button
                type="button"
                onClick={() => setActiveTab('list')}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-colors cursor-pointer"
              >
                Kembali ke Daftar
              </button>
              <button
                type="button"
                onClick={handleSavePage}
                className="px-6 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black flex items-center gap-2 shadow-lg transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{editingPageId ? 'Simpan Perubahan' : 'Tambahkan ke Majalah'}</span>
              </button>
            </>
          ) : (
            <>
              <span className="text-slate-400">Halaman kustom otomatis diintegrasikan ke daftar isi &amp; flipbook</span>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black transition-all cursor-pointer"
              >
                Selesai
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
