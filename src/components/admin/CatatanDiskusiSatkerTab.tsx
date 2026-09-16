import React, { useState, useEffect, useMemo } from 'react';
import { 
  CatatanDiskusiSatker, 
  JenisPertemuanDiskusi, 
  StatusTindakLanjutDiskusi, 
  SatkerIKPA, 
  AppTheme 
} from '../../types';
import { 
  fetchCatatanDiskusiSatker, 
  saveCatatanDiskusiSatker, 
  subscribeCatatanDiskusiSatker 
} from '../../services/catatanDiskusiService';
import { 
  MessageSquareText, 
  Plus, 
  Calendar, 
  Clock, 
  User, 
  Building2, 
  Tag, 
  CheckCircle2, 
  AlertTriangle, 
  Clock3, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Download, 
  Printer, 
  Phone, 
  ShieldCheck, 
  Sparkles, 
  FileText, 
  Check, 
  X, 
  ChevronDown,
  ChevronUp,
  MapPin,
  Laptop,
  Users2,
  HelpCircle,
  Bookmark,
  Eye,
  LayoutGrid,
  Table as TableIcon,
  MessageSquare,
  Copy,
  ArrowUpDown,
  CheckCheck,
  Send,
  Share2
} from 'lucide-react';
import { CatatanDiskusiDetailReaderModal } from './CatatanDiskusiDetailReaderModal';
import { CatatanDiskusiDeleteModal } from './CatatanDiskusiDeleteModal';

interface CatatanDiskusiSatkerTabProps {
  satker: SatkerIKPA;
  theme?: AppTheme;
  isAdminAuthenticated: boolean;
  onAuthenticateAdmin?: (pin: string) => boolean;
}

const INDIKATOR_OPTIONS = [
  'Revisi DIPA (10%)',
  'Deviasi Hal III DIPA (10%)',
  'Penyerapan Anggaran (20%)',
  'Belanja Kontraktual (10%)',
  'Penyelesaian Tagihan SPM (10%)',
  'Pengelolaan UP dan TUP (10%)',
  'Dispensasi SPM (5%)',
  'Capaian Output SAKTI (25%)',
  'Digitalisasi Pembayaran / KKP / Digipay',
  'Saldo Rekening / LPJ Bendahara',
  'Umum / Tata Kelola Anggaran'
];

const JENIS_PERTEMUAN_OPTIONS: { label: JenisPertemuanDiskusi; icon: any }[] = [
  { label: 'Tatap Muka di KPPN', icon: Building2 },
  { label: 'Kunjungan Lapangan / Monev Satker', icon: MapPin },
  { label: 'Konsultasi Online / Zoom', icon: Laptop },
  { label: 'WhatsApp / Telepon', icon: Phone },
  { label: 'Sosialisasi / FGD', icon: Users2 },
  { label: 'Lainnya', icon: MessageSquareText },
];

const STATUS_OPTIONS: { label: StatusTindakLanjutDiskusi; color: string; badge: string; accent: string }[] = [
  { 
    label: 'Perlu Tindak Lanjut', 
    color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-900', 
    badge: 'bg-rose-500',
    accent: 'border-l-rose-500'
  },
  { 
    label: 'Dalam Proses', 
    color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-900', 
    badge: 'bg-amber-500',
    accent: 'border-l-amber-500'
  },
  { 
    label: 'Selesai', 
    color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-900', 
    badge: 'bg-emerald-500',
    accent: 'border-l-emerald-500'
  },
  { 
    label: 'Monitoring Berkala', 
    color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-900', 
    badge: 'bg-blue-500',
    accent: 'border-l-blue-500'
  },
];

export const CatatanDiskusiSatkerTab: React.FC<CatatanDiskusiSatkerTabProps> = ({
  satker,
  theme = 'light',
  isAdminAuthenticated,
  onAuthenticateAdmin
}) => {
  const isDark = theme === 'dark';

  // State: Discussions list
  const [discussions, setDiscussions] = useState<CatatanDiskusiSatker[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modal states
  const [selectedNoteForView, setSelectedNoteForView] = useState<CatatanDiskusiSatker | null>(null);
  const [deletingNote, setDeletingNote] = useState<CatatanDiskusiSatker | null>(null);

  // View Display Mode: cards or table
  const [displayMode, setDisplayMode] = useState<'cards' | 'table'>('cards');

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Search & Filter & Sort
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | StatusTindakLanjutDiskusi>('ALL');
  const [indikatorFilter, setIndikatorFilter] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Form Input State
  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    waktu: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':'),
    jenisPertemuan: 'Tatap Muka di KPPN' as JenisPertemuanDiskusi,
    petugasKPPN: 'Seksi MSKI KPPN Semarang I',
    perwakilanSatker: '',
    kontakSatker: '',
    indikatorTerkait: [] as string[],
    topikDiskusi: '',
    poinPembahasan: '',
    tindakLanjut: '',
    statusTindakLanjut: 'Perlu Tindak Lanjut' as StatusTindakLanjutDiskusi,
    targetSelesai: '',
    catatanTambahan: ''
  });

  // Notification State
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const triggerNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Helper for phone sanitization
  const getCleanPhone = (phone?: string) => {
    if (!phone) return '';
    let p = phone.replace(/[^0-9]/g, '');
    if (p.startsWith('0')) {
      p = '62' + p.substring(1);
    }
    return p;
  };

  // Load and Subscribe to discussions
  useEffect(() => {
    if (!satker?.kodeSatker) return;
    setIsLoading(true);

    fetchCatatanDiskusiSatker(satker.kodeSatker).then((list) => {
      setDiscussions(list);
      setIsLoading(false);
    }).catch(() => {
      setIsLoading(false);
    });

    const unsub = subscribeCatatanDiskusiSatker(satker.kodeSatker, (updatedList) => {
      setDiscussions(updatedList);
    });

    return () => unsub();
  }, [satker.kodeSatker]);

  // Reset form to defaults
  const resetForm = () => {
    setFormData({
      tanggal: new Date().toISOString().split('T')[0],
      waktu: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':'),
      jenisPertemuan: 'Tatap Muka di KPPN',
      petugasKPPN: 'Seksi MSKI KPPN Semarang I',
      perwakilanSatker: '',
      kontakSatker: '',
      indikatorTerkait: [],
      topikDiskusi: '',
      poinPembahasan: '',
      tindakLanjut: '',
      statusTindakLanjut: 'Perlu Tindak Lanjut',
      targetSelesai: '',
      catatanTambahan: ''
    });
    setEditingId(null);
    setIsFormOpen(false);
  };

  // Handle Edit existing note
  const handleStartEdit = (note: CatatanDiskusiSatker) => {
    setEditingId(note.id);
    setFormData({
      tanggal: note.tanggal,
      waktu: note.waktu || '',
      jenisPertemuan: note.jenisPertemuan,
      petugasKPPN: note.petugasKPPN,
      perwakilanSatker: note.perwakilanSatker,
      kontakSatker: note.kontakSatker || '',
      indikatorTerkait: note.indikatorTerkait || [],
      topikDiskusi: note.topikDiskusi,
      poinPembahasan: note.poinPembahasan,
      tindakLanjut: note.tindakLanjut || '',
      statusTindakLanjut: note.statusTindakLanjut || 'Perlu Tindak Lanjut',
      targetSelesai: note.targetSelesai || '',
      catatanTambahan: note.catatanTambahan || ''
    });
    setIsFormOpen(true);
  };

  // Toggle Indikator selection in form
  const toggleIndikator = (ind: string) => {
    setFormData(prev => {
      const exists = prev.indikatorTerkait.includes(ind);
      if (exists) {
        return { ...prev, indikatorTerkait: prev.indikatorTerkait.filter(i => i !== ind) };
      } else {
        return { ...prev, indikatorTerkait: [...prev.indikatorTerkait, ind] };
      }
    });
  };

  // Save or Update discussion
  const handleSaveDiscussion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.topikDiskusi.trim() || !formData.poinPembahasan.trim()) {
      triggerNotification('Judul topik dan ringkasan pembahasan wajib diisi.', 'error');
      return;
    }

    try {
      const now = new Date().toISOString();
      let updatedList: CatatanDiskusiSatker[] = [...discussions];

      if (editingId) {
        // Update existing item
        updatedList = updatedList.map(item => {
          if (item.id === editingId) {
            return {
              ...item,
              ...formData,
              updatedAt: now
            };
          }
          return item;
        });
      } else {
        // Create new discussion item
        const newRecord: CatatanDiskusiSatker = {
          id: `disc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          kodeSatker: satker.kodeSatker,
          namaSatker: satker.namaSatker,
          ...formData,
          createdAt: now,
          updatedAt: now
        };
        // Prepend to show most recent first
        updatedList = [newRecord, ...updatedList];
      }

      await saveCatatanDiskusiSatker(satker.kodeSatker, updatedList);
      setDiscussions(updatedList);
      triggerNotification(
        editingId ? 'Catatan notula diskusi berhasil diperbarui.' : 'Catatan diskusi baru berhasil direkam.',
        'success'
      );
      resetForm();
    } catch (err) {
      triggerNotification('Gagal menyimpan catatan diskusi.', 'error');
    }
  };

  // Prompt delete dialog
  const handlePromptDelete = (note: CatatanDiskusiSatker) => {
    setDeletingNote(note);
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!deletingNote) return;
    try {
      const updatedList = discussions.filter(d => d.id !== deletingNote.id);
      await saveCatatanDiskusiSatker(satker.kodeSatker, updatedList);
      setDiscussions(updatedList);
      if (selectedNoteForView?.id === deletingNote.id) {
        setSelectedNoteForView(null);
      }
      setDeletingNote(null);
      triggerNotification('Catatan diskusi berhasil dihapus.', 'info');
    } catch (err) {
      triggerNotification('Gagal menghapus catatan diskusi.', 'error');
    }
  };

  // Quick change status
  const handleQuickStatusChange = async (id: string, newStatus: StatusTindakLanjutDiskusi) => {
    try {
      const updatedList = discussions.map(item => {
        if (item.id === id) {
          return {
            ...item,
            statusTindakLanjut: newStatus,
            updatedAt: new Date().toISOString()
          };
        }
        return item;
      });
      await saveCatatanDiskusiSatker(satker.kodeSatker, updatedList);
      setDiscussions(updatedList);
      triggerNotification(`Status diperbarui menjadi: ${newStatus}`, 'success');
    } catch (err) {
      triggerNotification('Gagal memperbarui status.', 'error');
    }
  };

  // Direct WhatsApp share for a card
  const handleShareToWhatsApp = (item: CatatanDiskusiSatker) => {
    let message = `Yth. Petugas Pengelola Keuangan *${satker.namaSatker}*,\n\n`;
    message += `Berikut ringkasan hasil asistensi/pembinaan IKPA bersama Tim KPPN Semarang I:\n`;
    message += `📅 Tanggal: ${item.tanggal} (${item.waktu || '-'})\n`;
    message += `📌 Topik: *${item.topikDiskusi}*\n`;
    message += `🏷️ Status: *${item.statusTindakLanjut}*\n`;
    if (item.targetSelesai) message += `⏰ Target Selesai: ${item.targetSelesai}\n`;
    if (item.tindakLanjut) {
      message += `\n*Rencana Aksi & Tindak Lanjut:*\n${item.tindakLanjut}\n`;
    }
    message += `\nMohon dapat ditindaklanjuti untuk optimalisasi IKPA Satker. Terima kasih atas kerja samanya.\n`;
    message += `_KPPN Semarang I_`;

    const cleanPhone = getCleanPhone(item.kontakSatker);
    const encoded = encodeURIComponent(message);
    const waUrl = cleanPhone 
      ? `https://wa.me/${cleanPhone}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;
    window.open(waUrl, '_blank');
  };

  // Quick copy text
  const handleCopyNote = (item: CatatanDiskusiSatker) => {
    let text = `NOTULA PEMBINAAN IKPA - KPPN SEMARANG I\n`;
    text += `Satker: ${satker.namaSatker} (${satker.kodeSatker})\n`;
    text += `Tanggal: ${item.tanggal} (${item.waktu || '-'}) | ${item.jenisPertemuan}\n`;
    text += `Petugas KPPN: ${item.petugasKPPN}\n`;
    text += `Perwakilan Satker: ${item.perwakilanSatker || '-'}\n`;
    text += `Status: ${item.statusTindakLanjut}\n`;
    text += `\nTOPIK: ${item.topikDiskusi}\n`;
    text += `\nFAKTA & PEMBAHASAN:\n${item.poinPembahasan}\n`;
    if (item.tindakLanjut) {
      text += `\nRENCANA TINDAK LANJUT:\n${item.tindakLanjut}\n`;
    }
    navigator.clipboard.writeText(text).then(() => {
      triggerNotification('Teks notula berhasil disalin ke clipboard.', 'success');
    });
  };

  // Export full report summary as TXT
  const handleExportSummary = () => {
    if (discussions.length === 0) {
      triggerNotification('Belum ada riwayat diskusi untuk diekspor.', 'info');
      return;
    }

    let report = `========================================================================\n`;
    report += `LEMBAR RIWAYAT DISKUSI & ASISTENSI PEMBINAAN IKPA\n`;
    report += `KANTOR PELAYANAN PERBENDAHARAAN NEGARA (KPPN) TIPE A1 SEMARANG I\n`;
    report += `========================================================================\n\n`;
    report += `Satker              : ${satker.namaSatker}\n`;
    report += `Kode Satker         : ${satker.kodeSatker}\n`;
    report += `Nilai IKPA Saat Ini : ${satker.nilaiTotalIKPA.toFixed(2)} (${satker.predikat})\n`;
    report += `Tanggal Ekspor      : ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}\n`;
    report += `Total Pertemuan     : ${discussions.length} Sesi\n`;
    report += `\n------------------------------------------------------------------------\n\n`;

    discussions.forEach((d, idx) => {
      report += `[SESI #${idx + 1}] ${d.tanggal} (${d.waktu || '-'}) - ${d.jenisPertemuan}\n`;
      report += `Judul Topik        : ${d.topikDiskusi}\n`;
      report += `Petugas KPPN       : ${d.petugasKPPN}\n`;
      report += `Perwakilan Satker  : ${d.perwakilanSatker || '-'}${d.kontakSatker ? ` (HP: ${d.kontakSatker})` : ''}\n`;
      if (d.indikatorTerkait && d.indikatorTerkait.length > 0) {
        report += `Indikator Terkait  : ${d.indikatorTerkait.join(', ')}\n`;
      }
      report += `\nRINGKASAN PEMBAHASAN / KENDALA:\n${d.poinPembahasan}\n\n`;
      report += `RENCANA AKSI & KESEPAKATAN TINDAK LANJUT:\n${d.tindakLanjut || '-'}\n\n`;
      report += `Status Follow-up   : ${d.statusTindakLanjut}\n`;
      if (d.targetSelesai) {
        report += `Target Selesai     : ${d.targetSelesai}\n`;
      }
      if (d.catatanTambahan) {
        report += `Catatan Tambahan   : ${d.catatanTambahan}\n`;
      }
      report += `\n------------------------------------------------------------------------\n\n`;
    });

    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Riwayat_Diskusi_KPPN_${satker.kodeSatker}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    triggerNotification('File ringkasan riwayat diskusi berhasil diunduh.', 'success');
  };

  // Filtered discussions with sorting
  const filteredDiscussions = useMemo(() => {
    let list = discussions.filter(item => {
      const matchStatus = statusFilter === 'ALL' || item.statusTindakLanjut === statusFilter;
      const matchIndikator = indikatorFilter === 'ALL' || (item.indikatorTerkait && item.indikatorTerkait.includes(indikatorFilter));
      const query = searchQuery.toLowerCase().trim();
      const matchQuery = !query || 
        item.topikDiskusi.toLowerCase().includes(query) ||
        item.poinPembahasan.toLowerCase().includes(query) ||
        item.petugasKPPN.toLowerCase().includes(query) ||
        item.perwakilanSatker.toLowerCase().includes(query) ||
        (item.tindakLanjut && item.tindakLanjut.toLowerCase().includes(query)) ||
        (item.indikatorTerkait && item.indikatorTerkait.some(i => i.toLowerCase().includes(query)));
      return matchStatus && matchIndikator && matchQuery;
    });

    return list.sort((a, b) => {
      const dateA = new Date(a.tanggal).getTime();
      const dateB = new Date(b.tanggal).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
  }, [discussions, statusFilter, indikatorFilter, searchQuery, sortOrder]);

  // Status Metrics & Completion Rate
  const stats = useMemo(() => {
    const total = discussions.length;
    const pending = discussions.filter(d => d.statusTindakLanjut === 'Perlu Tindak Lanjut').length;
    const inProgress = discussions.filter(d => d.statusTindakLanjut === 'Dalam Proses').length;
    const completed = discussions.filter(d => d.statusTindakLanjut === 'Selesai').length;
    const monitoring = discussions.filter(d => d.statusTindakLanjut === 'Monitoring Berkala').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const lastSession = discussions.length > 0 ? discussions[0] : null;
    return { total, pending, inProgress, completed, monitoring, completionRate, lastSession };
  }, [discussions]);

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold transition-all ${
          notification.type === 'success' 
            ? 'bg-emerald-500 text-white border-emerald-400 shadow-emerald-500/20' 
            : notification.type === 'error'
            ? 'bg-rose-500 text-white border-rose-400 shadow-rose-500/20'
            : 'bg-blue-600 text-white border-blue-500 shadow-blue-500/20'
        }`}>
          {notification.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
          {notification.type === 'error' && <AlertTriangle className="w-4 h-4 shrink-0" />}
          {notification.type === 'info' && <Sparkles className="w-4 h-4 shrink-0" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* TOP EXECUTIVE HERO CARD */}
      <div className={`p-6 sm:p-8 rounded-3xl border relative overflow-hidden transition-all ${
        isDark 
          ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/80 border-indigo-900/60 shadow-2xl' 
          : 'bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white border-indigo-800 shadow-2xl'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black bg-amber-400 text-slate-950 shadow-md">
                <ShieldCheck className="w-3.5 h-3.5" />
                MODUL PEMBINAAN RESMI KPPN
              </span>
              <span className="text-xs text-amber-200/90 font-mono font-bold px-2.5 py-0.5 rounded-full bg-white/10">
                KODE: {satker.kodeSatker}
              </span>
              {stats.lastSession && (
                <span className="text-xs text-indigo-200 font-medium hidden sm:inline-flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-400" />
                  Sesi Terakhir: {stats.lastSession.tanggal}
                </span>
              )}
            </div>
            
            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-400/20 text-amber-400 flex items-center justify-center shrink-0">
                <MessageSquareText className="w-6 h-6" />
              </div>
              <span>Rekam Diskusi &amp; Log Pembinaan Satker</span>
            </h3>

            <p className="text-xs sm:text-sm text-indigo-100/85 max-w-3xl leading-relaxed">
              Dokumentasi terpusat seluruh sesi audiensi, asistensi kendala SAKTI, dan bimbingan teknis IKPA dengan <strong>{satker.namaSatker}</strong>. Riwayat ini tersimpan permanen di Cloud demi kesinambungan pembinaan antar-petugas KPPN.
            </p>
          </div>

          {/* Quick Header Actions */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => {
                if (isFormOpen && !editingId) {
                  setIsFormOpen(false);
                } else {
                  resetForm();
                  setIsFormOpen(true);
                }
              }}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black bg-amber-400 hover:bg-amber-300 text-slate-950 transition-all shadow-lg hover:shadow-xl cursor-pointer transform active:scale-95"
            >
              <Plus className="w-4 h-4 font-bold" />
              <span>{isFormOpen && !editingId ? 'Tutup Form' : '+ Rekam Diskusi Baru'}</span>
            </button>

            <button
              onClick={handleExportSummary}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all cursor-pointer"
              title="Unduh seluruh ringkasan riwayat notula (.txt)"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Ekspor Notula</span>
            </button>
          </div>
        </div>

        {/* PROGRESS BAR: TINGKAT PENYELESAIAN KOMITMEN */}
        <div className="mt-6 pt-5 border-t border-indigo-800/60 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-indigo-200 font-bold flex items-center gap-1.5">
              <CheckCheck className="w-4 h-4 text-emerald-400" />
              Tingkat Penyelesaian Tindak Lanjut Satker:
            </span>
            <span className="font-mono font-black text-amber-300 text-sm">
              {stats.completionRate}% <span className="text-xs text-indigo-300 font-normal">({stats.completed} dari {stats.total} Selesai)</span>
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden p-0.5 border border-white/15">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-500 shadow-xs"
              style={{ width: `${Math.max(stats.completionRate, stats.total > 0 ? 5 : 0)}%` }}
            />
          </div>
        </div>

        {/* METRIC PILLS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 backdrop-blur-xs">
            <span className="text-[10px] uppercase font-bold text-indigo-200 block">Total Pertemuan</span>
            <span className="text-2xl font-black text-white">{stats.total} <span className="text-xs font-normal text-indigo-300">Sesi</span></span>
          </div>
          
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-3.5 backdrop-blur-xs">
            <span className="text-[10px] uppercase font-bold text-rose-300 block flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> Perlu Tindak Lanjut
            </span>
            <span className="text-2xl font-black text-rose-300">{stats.pending} <span className="text-xs font-normal text-rose-200/80">Pending</span></span>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 backdrop-blur-xs">
            <span className="text-[10px] uppercase font-bold text-amber-300 block">Dalam Proses</span>
            <span className="text-2xl font-black text-amber-300">{stats.inProgress} <span className="text-xs font-normal text-amber-200/80">Follow-up</span></span>
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3.5 backdrop-blur-xs">
            <span className="text-[10px] uppercase font-bold text-emerald-300 block flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Selesai / Teratasi
            </span>
            <span className="text-2xl font-black text-emerald-300">{stats.completed} <span className="text-xs font-normal text-emerald-200/80">Tuntas</span></span>
          </div>
        </div>
      </div>

      {/* FORM: TAMBAH / EDIT DISKUSI */}
      {isFormOpen && (
        <form onSubmit={handleSaveDiscussion} className={`p-6 sm:p-8 rounded-3xl border shadow-xl space-y-6 transition-all ${
          isDark ? 'bg-slate-900/95 border-slate-800 text-slate-100' : 'bg-white border-indigo-100 text-slate-800 shadow-indigo-100/50'
        }`}>
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                {editingId ? <Edit3 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              </div>
              <div>
                <h4 className="text-base font-black">
                  {editingId ? 'Edit Catatan Notula Diskusi' : 'Form Rekam Diskusi & Pendampingan Baru'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Satuan Kerja: <strong className="text-slate-700 dark:text-slate-200">{satker.namaSatker}</strong> ({satker.kodeSatker})
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={resetForm}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Tanggal */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                Tanggal Pertemuan: *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  value={formData.tanggal}
                  onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                  className={`w-full text-xs font-semibold rounded-xl pl-10 pr-3 py-2.5 border transition-all ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                  required
                />
              </div>
            </div>

            {/* Waktu */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                Waktu Pertemuan:
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Misal: 09:30 WIB"
                  value={formData.waktu}
                  onChange={(e) => setFormData({ ...formData, waktu: e.target.value })}
                  className={`w-full text-xs font-semibold rounded-xl pl-10 pr-3 py-2.5 border transition-all ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>

            {/* Jenis Pertemuan */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                Media / Lokasi Pertemuan:
              </label>
              <select
                value={formData.jenisPertemuan}
                onChange={(e) => setFormData({ ...formData, jenisPertemuan: e.target.value as JenisPertemuanDiskusi })}
                className={`w-full text-xs font-semibold rounded-xl px-3 py-2.5 border transition-all ${
                  isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              >
                {JENIS_PERTEMUAN_OPTIONS.map((opt) => (
                  <option key={opt.label} value={opt.label}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Petugas KPPN */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                Petugas Pembina KPPN: *
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Contoh: Seksi MSKI / Anton"
                  value={formData.petugasKPPN}
                  onChange={(e) => setFormData({ ...formData, petugasKPPN: e.target.value })}
                  className={`w-full text-xs font-semibold rounded-xl pl-10 pr-3 py-2.5 border transition-all ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                  required
                />
              </div>
            </div>

            {/* Perwakilan Satker */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                Perwakilan Satker yang Hadir:
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Contoh: Pak Budi (PPK) & Bu Siti (Bendahara)"
                  value={formData.perwakilanSatker}
                  onChange={(e) => setFormData({ ...formData, perwakilanSatker: e.target.value })}
                  className={`w-full text-xs font-semibold rounded-xl pl-10 pr-3 py-2.5 border transition-all ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>

            {/* No Kontak / WhatsApp Satker */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                No. Kontak / WhatsApp Satker:
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-500" />
                <input
                  type="text"
                  placeholder="Contoh: 081234567890"
                  value={formData.kontakSatker}
                  onChange={(e) => setFormData({ ...formData, kontakSatker: e.target.value })}
                  className={`w-full text-xs font-semibold rounded-xl pl-10 pr-3 py-2.5 border transition-all ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Indikator Terkait Chips Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">
              Indikator / Aspek IKPA yang Disorot:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {INDIKATOR_OPTIONS.map((ind) => {
                const isSelected = formData.indikatorTerkait.includes(ind);
                return (
                  <button
                    type="button"
                    key={ind}
                    onClick={() => toggleIndikator(ind)}
                    className={`text-[11px] px-3 py-1.5 rounded-xl font-bold transition-all border cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : isDark
                        ? 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                        : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 inline mr-1" />}
                    {ind}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Judul / Topik Diskusi */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
              Judul / Pokok Masalah Diskusi: *
            </label>
            <input
              type="text"
              placeholder="Misal: Evaluasi Deviasi Hal III DIPA Triwulan III dan Keterlambatan SPM Kontraktual"
              value={formData.topikDiskusi}
              onChange={(e) => setFormData({ ...formData, topikDiskusi: e.target.value })}
              className={`w-full text-xs font-bold rounded-xl px-4 py-2.5 border transition-all ${
                isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
              required
            />
          </div>

          {/* Poin Pembahasan & Kendala */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
              Ringkasan Hasil Pembahasan, Fakta Lapangan &amp; Kendala Satker: *
            </label>
            <textarea
              rows={3}
              placeholder="Uraikan kendala faktual dari satker (misal perubahan jadwal lelang, pergantian pejabat perbendaharaan, kendala validasi SAKTI)..."
              value={formData.poinPembahasan}
              onChange={(e) => setFormData({ ...formData, poinPembahasan: e.target.value })}
              className={`w-full text-xs font-normal leading-relaxed rounded-xl p-3.5 border transition-all ${
                isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
              required
            />
          </div>

          {/* Rencana Aksi & Tindak Lanjut */}
          <div className="p-5 rounded-2xl border bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Kesepakatan Solusi &amp; Rencana Tindak Lanjut (Action Plan):</span>
            </div>
            <textarea
              rows={3}
              placeholder="Komitmen satker dan arahan KPPN (misal satker akan melakukan revisi Hal III sebelum tanggal 20, KPPN membantu asistensi SAKTI)..."
              value={formData.tindakLanjut}
              onChange={(e) => setFormData({ ...formData, tindakLanjut: e.target.value })}
              className={`w-full text-xs font-normal leading-relaxed rounded-xl p-3.5 border transition-all ${
                isDark ? 'bg-slate-950 border-emerald-900 text-white' : 'bg-white border-emerald-200 text-slate-900'
              }`}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Status Tindak Lanjut */}
              <div>
                <label className="block text-[11px] font-bold text-emerald-900 dark:text-emerald-300 mb-1">
                  Status Tindak Lanjut:
                </label>
                <select
                  value={formData.statusTindakLanjut}
                  onChange={(e) => setFormData({ ...formData, statusTindakLanjut: e.target.value as StatusTindakLanjutDiskusi })}
                  className={`w-full text-xs font-bold rounded-xl px-3 py-2.5 border transition-all ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-emerald-300 text-slate-900'
                  }`}
                >
                  {STATUS_OPTIONS.map((st) => (
                    <option key={st.label} value={st.label}>
                      {st.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Deadline */}
              <div>
                <label className="block text-[11px] font-bold text-emerald-900 dark:text-emerald-300 mb-1">
                  Target Tanggal Penyelesaian:
                </label>
                <input
                  type="date"
                  value={formData.targetSelesai}
                  onChange={(e) => setFormData({ ...formData, targetSelesai: e.target.value })}
                  className={`w-full text-xs font-semibold rounded-xl px-3 py-2.5 border transition-all ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-emerald-300 text-slate-900'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Catatan Tambahan */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
              Catatan Tambahan / Saran Petugas Pembina (Opsional):
            </label>
            <input
              type="text"
              placeholder="Catatan tambahan internal untuk sesi berikutnya..."
              value={formData.catatanTambahan}
              onChange={(e) => setFormData({ ...formData, catatanTambahan: e.target.value })}
              className={`w-full text-xs font-normal rounded-xl px-3.5 py-2.5 border transition-all ${
                isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={resetForm}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md cursor-pointer flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>{editingId ? 'Simpan Perubahan' : 'Rekam ke Riwayat KPPN'}</span>
            </button>
          </div>
        </form>
      )}

      {/* FILTER, SEARCH & SORT TOOLBAR */}
      <div className={`p-4 sm:p-5 rounded-3xl border flex flex-col lg:flex-row items-center justify-between gap-4 transition-all ${
        isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
      }`}>
        
        {/* Left: Search input */}
        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari topik, masalah, atau nama petugas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full text-xs rounded-xl pl-9 pr-8 py-2.5 border transition-all ${
              isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
            }`}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Center: Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full lg:w-auto">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all border cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 border-transparent shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 border-transparent'
            }`}
          >
            Semua ({discussions.length})
          </button>

          {STATUS_OPTIONS.map((st) => {
            const count = discussions.filter(d => d.statusTindakLanjut === st.label).length;
            const isSelected = statusFilter === st.label;
            return (
              <button
                key={st.label}
                onClick={() => setStatusFilter(st.label)}
                className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all border cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? `${st.color} border-current ring-1 ring-current shadow-xs`
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 border-transparent'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${st.badge}`} />
                <span>{st.label}</span>
                <span className="opacity-70 text-[10px]">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Right: Sort & Display Mode */}
        <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
          {/* Sort order toggle */}
          <button
            type="button"
            onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
              isDark 
                ? 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white' 
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
            title="Urutkan tanggal"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-indigo-500" />
            <span>{sortOrder === 'newest' ? 'Terbaru' : 'Terlama'}</span>
          </button>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 p-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950">
            <button
              type="button"
              onClick={() => setDisplayMode('cards')}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                displayMode === 'cards'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Tampilan Timeline & Kartu Lega"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kartu</span>
            </button>

            <button
              type="button"
              onClick={() => setDisplayMode('table')}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                displayMode === 'table'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Tampilan Tabel Lengkap"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Tabel</span>
            </button>
          </div>
        </div>

      </div>

      {/* DISCUSSIONS TIMELINE & CARDS */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="p-16 text-center text-slate-400 text-xs font-semibold">
            <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Memuat riwayat pembinaan Satker...
          </div>
        ) : filteredDiscussions.length === 0 ? (
          <div className={`p-12 rounded-3xl border text-center space-y-3 ${
            isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mx-auto">
              <MessageSquareText className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-slate-800 dark:text-white">
              {searchQuery || statusFilter !== 'ALL'
                ? 'Tidak ada catatan diskusi yang cocok dengan filter'
                : 'Belum ada catatan diskusi tercatat untuk Satker ini'}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              {searchQuery || statusFilter !== 'ALL'
                ? 'Coba atur ulang kata kunci pencarian atau filter status tindak lanjut.'
                : 'Catat sesi audiensi, konsultasi, atau pendampingan IKPA yang dilakukan bersama pengelola Satker ini agar tersimpan rapi untuk pertemuan mendatang.'}
            </p>
            {(!searchQuery && statusFilter === 'ALL') && (
              <button
                onClick={() => {
                  resetForm();
                  setIsFormOpen(true);
                }}
                className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-500 text-white transition-all cursor-pointer shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Mulai Catat Diskusi Pertama</span>
              </button>
            )}
          </div>
        ) : displayMode === 'table' ? (
          /* ========================================================
             VIEW MODE 1: TABEL LEBAR, RAPI & TERSTRUKTUR (WIDE TABLE)
             ======================================================== */
          <div className={`rounded-3xl border shadow-xs overflow-hidden ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className={`border-b text-[11px] font-black uppercase tracking-wider ${
                    isDark ? 'bg-slate-950/80 text-slate-400 border-slate-800' : 'bg-slate-50 text-slate-500 border-slate-200'
                  }`}>
                    <th className="py-4 px-4 w-12 text-center">No</th>
                    <th className="py-4 px-4 min-w-[140px]">Tanggal &amp; Media</th>
                    <th className="py-4 px-4 min-w-[280px]">Topik Masalah &amp; Bahasan</th>
                    <th className="py-4 px-4 min-w-[200px]">Pihak Terlibat</th>
                    <th className="py-4 px-4 min-w-[160px]">Status &amp; Target</th>
                    <th className="py-4 px-4 min-w-[220px] text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {filteredDiscussions.map((item, idx) => {
                    const statusConfig = STATUS_OPTIONS.find(s => s.label === item.statusTindakLanjut) || STATUS_OPTIONS[0];

                    return (
                      <tr 
                        key={item.id} 
                        className="transition-colors group hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                      >
                        {/* No Urut */}
                        <td className="py-4 px-4 text-center font-mono font-bold text-slate-400 group-hover:text-indigo-600">
                          #{idx + 1}
                        </td>

                        {/* Tanggal & Media */}
                        <td className="py-4 px-4 align-top space-y-1">
                          <div className="flex items-center gap-1.5 font-black text-slate-900 dark:text-white">
                            <Calendar className="w-3.5 h-3.5 text-amber-500" />
                            <span>{item.tanggal}</span>
                          </div>
                          {item.waktu && (
                            <div className="text-[11px] text-slate-400 font-medium">
                              Pukul {item.waktu}
                            </div>
                          )}
                          <div className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                            <Building2 className="w-3 h-3 text-indigo-500" />
                            <span>{item.jenisPertemuan}</span>
                          </div>
                        </td>

                        {/* Topik & Ringkasan */}
                        <td className="py-4 px-4 align-top space-y-1.5">
                          <div 
                            onClick={() => setSelectedNoteForView(item)}
                            className="font-black text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer text-sm leading-snug line-clamp-2"
                          >
                            {item.topikDiskusi}
                          </div>

                          <p className="text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                            {item.poinPembahasan}
                          </p>

                          {item.indikatorTerkait && item.indikatorTerkait.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {item.indikatorTerkait.slice(0, 3).map(ind => (
                                <span key={ind} className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                                  {ind}
                                </span>
                              ))}
                              {item.indikatorTerkait.length > 3 && (
                                <span className="text-[10px] text-slate-400">+{item.indikatorTerkait.length - 3} lainnya</span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Pihak Terlibat */}
                        <td className="py-4 px-4 align-top space-y-1.5">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">KPPN:</span>
                            <span className="font-extrabold text-slate-800 dark:text-slate-200">
                              {item.petugasKPPN}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Satker:</span>
                            <span className="font-bold text-slate-700 dark:text-slate-300">
                              {item.perwakilanSatker || 'Pengelola Keuangan'}
                            </span>
                            {item.kontakSatker && (
                              <a 
                                href={`https://wa.me/${getCleanPhone(item.kontakSatker)}`} 
                                target="_blank" 
                                rel="noreferrer"
                                className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 hover:underline"
                              >
                                <Phone className="w-2.5 h-2.5" /> {item.kontakSatker}
                              </a>
                            )}
                          </div>
                        </td>

                        {/* Status & Target */}
                        <td className="py-4 px-4 align-top space-y-1.5">
                          <span className={`inline-flex items-center gap-1.5 text-[11px] font-black px-2.5 py-1 rounded-xl border ${statusConfig.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.badge}`} />
                            <span>{item.statusTindakLanjut}</span>
                          </span>

                          {item.targetSelesai && (
                            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                              <Clock3 className="w-3 h-3 text-amber-500" />
                              <span>Batas: {item.targetSelesai}</span>
                            </div>
                          )}
                        </td>

                        {/* Aksi Lengkap */}
                        <td className="py-4 px-4 align-top text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Tombol Lihat Detail */}
                            <button
                              type="button"
                              onClick={() => setSelectedNoteForView(item)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs transition-all cursor-pointer"
                              title="Buka notula resmi layar penuh"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Lihat</span>
                            </button>

                            {/* Tombol WhatsApp */}
                            <button
                              type="button"
                              onClick={() => handleShareToWhatsApp(item)}
                              className="p-1.5 rounded-xl text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors cursor-pointer border border-emerald-200 dark:border-emerald-800"
                              title="Kirim ke WhatsApp Satker"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>

                            {/* Tombol Ubah */}
                            <button
                              type="button"
                              onClick={() => handleStartEdit(item)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                              title="Ubah isi catatan diskusi"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-amber-500" />
                              <span>Ubah</span>
                            </button>

                            {/* Tombol Hapus */}
                            <button
                              type="button"
                              onClick={() => handlePromptDelete(item)}
                              className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-600 transition-colors cursor-pointer border border-transparent hover:border-rose-200"
                              title="Hapus catatan diskusi ini"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* ========================================================
             VIEW MODE 2: KARTU TIMELINE LEGA DENGAN DESAIN PRESTISIUS
             ======================================================== */
          <div className="space-y-5">
            {filteredDiscussions.map((item, idx) => {
              const statusConfig = STATUS_OPTIONS.find(s => s.label === item.statusTindakLanjut) || STATUS_OPTIONS[0];

              return (
                <div 
                  key={item.id}
                  className={`p-6 sm:p-7 rounded-3xl border shadow-sm transition-all hover:shadow-md space-y-4 border-l-4 ${statusConfig.accent} ${
                    isDark ? 'bg-slate-900/85 border-slate-800' : 'bg-white border-slate-200'
                  }`}
                >
                  {/* Header of Note */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Nomor Urut Sesi */}
                        <span className="text-[11px] font-black px-2.5 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono">
                          SESI #{filteredDiscussions.length - idx}
                        </span>

                        {/* Tanggal & Waktu */}
                        <span className="inline-flex items-center gap-1.5 text-xs font-black text-slate-800 dark:text-white bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-xl">
                          <Calendar className="w-3.5 h-3.5 text-amber-500" />
                          <span>{item.tanggal}</span>
                          {item.waktu && <span className="text-slate-400 font-normal">({item.waktu})</span>}
                        </span>

                        {/* Jenis Media / Lokasi */}
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-2.5 py-1 rounded-xl">
                          <Building2 className="w-3 h-3 text-indigo-500" />
                          <span>{item.jenisPertemuan}</span>
                        </span>

                        {/* Status Tindak Lanjut Pill */}
                        <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-xl border ${statusConfig.color}`}>
                          <span className={`w-2 h-2 rounded-full ${statusConfig.badge} ${item.statusTindakLanjut === 'Perlu Tindak Lanjut' ? 'animate-ping' : ''}`} />
                          <span>{item.statusTindakLanjut}</span>
                        </span>
                      </div>

                      <h4 
                        onClick={() => setSelectedNoteForView(item)}
                        className="text-base sm:text-lg font-black text-slate-900 dark:text-white pt-1 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition-colors leading-snug"
                      >
                        {item.topikDiskusi}
                      </h4>
                    </div>

                    {/* Top Action Quick Button */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                      {item.statusTindakLanjut !== 'Selesai' && (
                        <button
                          onClick={() => handleQuickStatusChange(item.id, 'Selesai')}
                          className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer"
                          title="Tandai tindak lanjut telah selesai"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Tandai Selesai</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Info Pihak Terlibat - Lega & Luas */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-100 dark:border-slate-800/80">
                      <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-xs shrink-0">
                        KPPN
                      </div>
                      <div className="truncate">
                        <span className="text-[10px] text-slate-400 block font-bold uppercase">Petugas Pembina KPPN:</span>
                        <span className="font-extrabold text-slate-800 dark:text-slate-200">{item.petugasKPPN}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-100 dark:border-slate-800/80">
                      <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black text-xs shrink-0">
                        SATKER
                      </div>
                      <div className="truncate flex-1">
                        <span className="text-[10px] text-slate-400 block font-bold uppercase">Perwakilan Satker yang Hadir:</span>
                        <span className="font-extrabold text-slate-800 dark:text-slate-200">
                          {item.perwakilanSatker || 'Petugas Pengelola Keuangan'}
                        </span>
                        {item.kontakSatker && (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                              WA: {item.kontakSatker}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Indikator Terkait Chips */}
                  {item.indikatorTerkait && item.indikatorTerkait.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                        <Tag className="w-3 h-3 text-indigo-500" /> Fokus Indikator IKPA:
                      </span>
                      {item.indikatorTerkait.map(ind => (
                        <span 
                          key={ind} 
                          className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                        >
                          {ind}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Ringkasan Poin Pembahasan */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] uppercase tracking-wider font-extrabold text-slate-500 dark:text-slate-400 block">
                      Ringkasan Fakta Lapangan &amp; Pokok Bahasan:
                    </span>
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-100 dark:border-slate-800 text-xs sm:text-sm leading-relaxed whitespace-pre-line text-slate-700 dark:text-slate-300">
                      {item.poinPembahasan}
                    </div>
                  </div>

                  {/* Rencana Aksi & Tindak Lanjut Box (Lega & Jelas) */}
                  {item.tindakLanjut && (
                    <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/50 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs uppercase tracking-wider font-black text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Kesepakatan Solusi &amp; Rencana Tindak Lanjut:
                        </span>
                        {item.targetSelesai && (
                          <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 flex items-center gap-1 border border-emerald-300 dark:border-emerald-800">
                            <Clock3 className="w-3.5 h-3.5" /> Target: {item.targetSelesai}
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm leading-relaxed text-emerald-950 dark:text-emerald-200 font-medium whitespace-pre-line">
                        {item.tindakLanjut}
                      </p>
                    </div>
                  )}

                  {/* EXPLICIT ACTION TOOLBAR: LIHAT DETAIL, WA, UBAH, HAPUS */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400 font-medium">
                        Diperbarui: {new Date(item.updatedAt).toLocaleDateString('id-ID')}
                      </span>
                      <button
                        onClick={() => handleCopyNote(item)}
                        className="text-[11px] font-bold text-slate-400 hover:text-indigo-600 flex items-center gap-1 cursor-pointer ml-2"
                        title="Salin ringkasan ke clipboard"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Salin</span>
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Tombol Kirim WhatsApp ke Satker */}
                      <button
                        type="button"
                        onClick={() => handleShareToWhatsApp(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-all cursor-pointer"
                        title="Kirimkan notula ini langsung ke WhatsApp Satker"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </button>

                      {/* Tombol Lihat Detail Catatan */}
                      <button
                        type="button"
                        onClick={() => setSelectedNoteForView(item)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs transition-all cursor-pointer"
                        title="Baca notula secara penuh di layar lebar"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Lihat Notula</span>
                      </button>

                      {/* Tombol Ubah Catatan */}
                      <button
                        type="button"
                        onClick={() => handleStartEdit(item)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                        title="Edit isi catatan diskusi ini"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-amber-500" />
                        <span>Ubah</span>
                      </button>

                      {/* Tombol Hapus Catatan */}
                      <button
                        type="button"
                        onClick={() => handlePromptDelete(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-rose-200 dark:border-rose-900 transition-colors cursor-pointer"
                        title="Hapus catatan dari riwayat"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* BOTTOM ACTION: TAMBAH CATATAN DISKUSI LAINNYA (MULTI-RECORD) */}
        {!isLoading && filteredDiscussions.length > 0 && !isFormOpen && (
          <div className="pt-3 flex items-center justify-center">
            <button
              type="button"
              onClick={() => {
                resetForm();
                setIsFormOpen(true);
              }}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl text-xs font-black bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shadow-sm transition-all cursor-pointer transform active:scale-95"
            >
              <Plus className="w-4 h-4 text-indigo-600" />
              <span>+ Rekam Catatan Diskusi Pembinaan Baru ({discussions.length + 1})</span>
            </button>
          </div>
        )}
      </div>

      {/* MODAL: WIDE OFFICIAL DOSSIER READER VIEW */}
      <CatatanDiskusiDetailReaderModal
        note={selectedNoteForView}
        satker={satker}
        onClose={() => setSelectedNoteForView(null)}
        onEdit={(note) => {
          setSelectedNoteForView(null);
          handleStartEdit(note);
        }}
        onDelete={(id) => {
          const noteToDelete = discussions.find(d => d.id === id);
          if (noteToDelete) {
            handlePromptDelete(noteToDelete);
          }
        }}
        onQuickStatusChange={(id, status) => {
          handleQuickStatusChange(id, status);
          if (selectedNoteForView && selectedNoteForView.id === id) {
            setSelectedNoteForView({ ...selectedNoteForView, statusTindakLanjut: status });
          }
        }}
        theme={theme}
      />

      {/* MODAL: DELETE CONFIRMATION */}
      <CatatanDiskusiDeleteModal
        note={deletingNote}
        isOpen={deletingNote !== null}
        onClose={() => setDeletingNote(null)}
        onConfirm={handleConfirmDelete}
        theme={theme}
      />

    </div>
  );
};
