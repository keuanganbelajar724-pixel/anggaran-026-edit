import React, { useState } from 'react';
import { CatatanDiskusiSatker, SatkerIKPA, AppTheme, StatusTindakLanjutDiskusi } from '../../types';
import { 
  Building2, 
  Calendar, 
  Clock, 
  Clock3, 
  User, 
  Phone, 
  Tag, 
  CheckCircle2, 
  AlertTriangle, 
  Edit3, 
  Trash2, 
  Printer, 
  Copy, 
  Check, 
  X, 
  Share2, 
  Bookmark, 
  ShieldCheck,
  FileText,
  ExternalLink,
  MessageSquare,
  Award,
  ChevronDown
} from 'lucide-react';

interface CatatanDiskusiDetailReaderModalProps {
  note: CatatanDiskusiSatker | null;
  satker: SatkerIKPA;
  onClose: () => void;
  onEdit: (note: CatatanDiskusiSatker) => void;
  onDelete: (id: string) => void;
  onQuickStatusChange: (id: string, status: StatusTindakLanjutDiskusi) => void;
  theme?: AppTheme;
}

const STATUS_CONFIGS: Record<StatusTindakLanjutDiskusi, { color: string; badge: string; bg: string; border: string }> = {
  'Perlu Tindak Lanjut': {
    color: 'text-rose-700 dark:text-rose-300',
    bg: 'bg-rose-50 dark:bg-rose-950/60',
    border: 'border-rose-200 dark:border-rose-800',
    badge: 'bg-rose-500'
  },
  'Dalam Proses': {
    color: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-50 dark:bg-amber-950/60',
    border: 'border-amber-200 dark:border-amber-800',
    badge: 'bg-amber-500'
  },
  'Selesai': {
    color: 'text-emerald-700 dark:text-emerald-300',
    bg: 'bg-emerald-50 dark:bg-emerald-950/60',
    border: 'border-emerald-200 dark:border-emerald-800',
    badge: 'bg-emerald-500'
  },
  'Monitoring Berkala': {
    color: 'text-blue-700 dark:text-blue-300',
    bg: 'bg-blue-50 dark:bg-blue-950/60',
    border: 'border-blue-200 dark:border-blue-800',
    badge: 'bg-blue-500'
  },
};

export const CatatanDiskusiDetailReaderModal: React.FC<CatatanDiskusiDetailReaderModalProps> = ({
  note,
  satker,
  onClose,
  onEdit,
  onDelete,
  onQuickStatusChange,
  theme = 'light'
}) => {
  const isDark = theme === 'dark';
  const [copied, setCopied] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  if (!note) return null;

  const currentStatus = note.statusTindakLanjut || 'Perlu Tindak Lanjut';
  const statusCfg = STATUS_CONFIGS[currentStatus] || STATUS_CONFIGS['Perlu Tindak Lanjut'];

  // Format Official Nomor Agenda
  const nomorAgenda = `NOT-IKPA/${satker.kodeSatker}/${note.tanggal.replace(/-/g, '')}/${note.id.substring(0, 4).toUpperCase()}`;

  const getCleanPhone = (phone?: string) => {
    if (!phone) return '';
    let p = phone.replace(/[^0-9]/g, '');
    if (p.startsWith('0')) {
      p = '62' + p.substring(1);
    }
    return p;
  };

  const handleCopyText = () => {
    let text = `*LEMBAR NOTULA ASISTENSI & PEMBINAAN KINERJA IKPA*\n`;
    text += `*KPPN SEMARANG I*\n`;
    text += `No. Agenda: ${nomorAgenda}\n`;
    text += `─────────────────────────\n`;
    text += `*Satuan Kerja:* ${satker.namaSatker} (${satker.kodeSatker})\n`;
    text += `*Waktu / Media:* ${note.tanggal} ${note.waktu ? `(${note.waktu})` : ''} | ${note.jenisPertemuan}\n`;
    text += `*Petugas KPPN:* ${note.petugasKPPN}\n`;
    text += `*Perwakilan Satker:* ${note.perwakilanSatker || 'Pengelola Keuangan'}${note.kontakSatker ? ` (${note.kontakSatker})` : ''}\n`;
    text += `*Status Komitmen:* ${note.statusTindakLanjut}\n`;
    if (note.targetSelesai) text += `*Target Selesai:* ${note.targetSelesai}\n`;
    text += `─────────────────────────\n`;
    text += `*POKOK MASALAH & BAHASAN:*\n${note.topikDiskusi}\n`;
    if (note.indikatorTerkait && note.indikatorTerkait.length > 0) {
      text += `*Indikator Terkait:* ${note.indikatorTerkait.join(', ')}\n`;
    }
    text += `\n*FAKTA LAPANGAN & KENDALA SATKER:*\n${note.poinPembahasan}\n`;
    if (note.tindakLanjut) {
      text += `\n*KESEPAKATAN SOLUSI & RENCANA TINDAK LANJUT:*\n${note.tindakLanjut}\n`;
    }
    if (note.catatanTambahan) {
      text += `\n*CATATAN TAMBAHAN PEMBINA:*\n${note.catatanTambahan}\n`;
    }
    text += `─────────────────────────\n`;
    text += `_Disusun dan diverifikasi melalui Modul Pembinaan IKPA KPPN Semarang I_`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleSendWhatsApp = () => {
    let message = `Yth. Bapak/Ibu Petugas Pengelola Keuangan *${satker.namaSatker}*,\n\n`;
    message += `Berikut ringkasan komitmen hasil diskusi/pembinaan IKPA bersama Tim KPPN Semarang I:\n\n`;
    message += `*Topik Bahasan:* ${note.topikDiskusi}\n`;
    message += `*Tanggal:* ${note.tanggal} | *Status:* ${note.statusTindakLanjut}\n`;
    if (note.targetSelesai) message += `*Target Penyelesaian:* ${note.targetSelesai}\n`;
    if (note.tindakLanjut) {
      message += `\n*Kesepakatan Tindak Lanjut:*\n${note.tindakLanjut}\n`;
    }
    message += `\nMohon dapat ditindaklanjuti sesuai target waktu yang disepakati untuk optimalisasi nilai IKPA Satker. Terima kasih atas kerja sama dan dedikasi Bapak/Ibu.\n\n`;
    message += `_Salam hormat,_\n*Tim Pembina IKPA KPPN Semarang I*`;

    const cleanPhone = getCleanPhone(note.kontakSatker);
    const encoded = encodeURIComponent(message);
    const waUrl = cleanPhone 
      ? `https://wa.me/${cleanPhone}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;
    window.open(waUrl, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-fade-in print:p-0 print:bg-white">
      <div 
        className={`relative w-full max-w-4xl max-h-[94vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden transition-all print:max-w-none print:max-h-none print:border-none print:shadow-none print:rounded-none ${
          isDark ? 'bg-slate-900 border-slate-700/80 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER: FORMAL GOVERNMENT DOSSIER HEADER */}
        <div className={`p-5 sm:p-6 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0 print:hidden ${
          isDark 
            ? 'bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border-slate-800' 
            : 'bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white border-slate-200'
        }`}>
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-black bg-amber-400 text-slate-950 shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5" />
                DOKUMEN RESMI NOTULA KPPN
              </span>
              <span className="font-mono text-[11px] text-amber-200/90 font-bold px-2 py-0.5 rounded-md bg-white/10">
                {nomorAgenda}
              </span>
            </div>
            <h2 className="text-base sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Lembar Notula Asistensi &amp; Pembinaan IKPA</span>
            </h2>
            <p className="text-xs text-indigo-100/90">
              Satker: <strong className="text-white">{satker.namaSatker}</strong> &bull; Kode: <span className="font-mono text-amber-300 font-bold">{satker.kodeSatker}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
            {/* Direct WhatsApp Share */}
            <button
              onClick={handleSendWhatsApp}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-all cursor-pointer"
              title="Kirim notula ini langsung ke WhatsApp Satker"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Kirim WhatsApp</span>
            </button>

            {/* Print button */}
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all cursor-pointer text-xs font-bold"
              title="Cetak format notula resmi (PDF/Kertas)"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Cetak</span>
            </button>

            {/* Copy button */}
            <button
              onClick={handleCopyText}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all cursor-pointer"
              title="Salin isi ringkasan teks"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Tersalin!' : 'Salin'}</span>
            </button>

            {/* Close button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all cursor-pointer"
              title="Tutup jendela baca"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINT ONLY LETTERHEAD (KOP RESMI KPPN) */}
        <div className="hidden print:block p-8 border-b-2 border-slate-900 text-center space-y-1">
          <p className="text-xs font-extrabold tracking-wider uppercase text-slate-800">
            KEMENTERIAN KEUANGAN REPUBLIK INDONESIA
          </p>
          <p className="text-xs font-bold tracking-wider uppercase text-slate-800">
            DIREKTORAT JENDERAL PERBENDAHARAAN &bull; KANWIL DJPB PROVINSI JAWA TENGAH
          </p>
          <h1 className="text-sm font-black uppercase text-slate-950">
            KANTOR PELAYANAN PERBENDAHARAAN NEGARA TIPE A1 SEMARANG I
          </h1>
          <p className="text-[10px] text-slate-600">
            Jalan Ki Mangunsarkoro No. 34, Semarang &bull; Layanan Pengaduan &amp; CS: (024) 8414545
          </p>
          <div className="pt-3">
            <h2 className="text-base font-black uppercase underline decoration-2 tracking-wide text-slate-950">
              LEMBAR NOTULA KONSULTASI &amp; ASISTENSI KINERJA IKPA SATKER
            </h2>
            <p className="text-xs font-bold text-slate-700 font-mono mt-0.5">
              Nomor: {nomorAgenda}
            </p>
          </div>
        </div>

        {/* MODAL BODY: SPACIOUS, WIDE, EXECUTIVE GOVERNMENT DOSSIER LAYOUT */}
        <div className="p-6 sm:p-8 md:p-10 overflow-y-auto space-y-6 flex-1 text-slate-800 dark:text-slate-100 print:p-6 print:space-y-5">
          
          {/* TOP EXECUTIVE STATUS & METADATA BAR */}
          <div className={`p-4 sm:p-5 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
            isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex flex-wrap items-center gap-3">
              {/* Tanggal & Waktu */}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-500" />
                <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                  {note.tanggal}
                </span>
                {note.waktu && (
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                    ({note.waktu})
                  </span>
                )}
              </div>

              <span className="text-slate-300 dark:text-slate-700">&bull;</span>

              {/* Media Pertemuan */}
              <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                <Building2 className="w-4 h-4 text-indigo-500" />
                <span>{note.jenisPertemuan}</span>
              </div>
            </div>

            {/* Status Follow-up Badge & Dropdown Selector */}
            <div className="relative flex items-center gap-2 print:hidden">
              <button
                type="button"
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                className={`inline-flex items-center gap-2 text-xs font-black px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer ${statusCfg.bg} ${statusCfg.border} ${statusCfg.color} hover:shadow-xs`}
                title="Klik untuk mengubah status tindak lanjut secara cepat"
              >
                <span className={`w-2 h-2 rounded-full ${statusCfg.badge} ${currentStatus === 'Perlu Tindak Lanjut' ? 'animate-ping' : ''}`} />
                <span>Status: {currentStatus}</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </button>

              {/* Status Change Dropdown Menu */}
              {showStatusMenu && (
                <div className={`absolute right-0 top-full mt-2 w-52 rounded-2xl border shadow-xl p-1.5 z-20 ${
                  isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
                }`}>
                  <div className="text-[10px] font-extrabold uppercase text-slate-400 px-3 py-1">
                    Ubah Status Sesi:
                  </div>
                  {(['Perlu Tindak Lanjut', 'Dalam Proses', 'Selesai', 'Monitoring Berkala'] as StatusTindakLanjutDiskusi[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => {
                        onQuickStatusChange(note.id, st);
                        setShowStatusMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer ${
                        currentStatus === st 
                          ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400' 
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${STATUS_CONFIGS[st].badge}`} />
                      <span>{st}</span>
                    </button>
                  ))}
                </div>
              )}

              {currentStatus !== 'Selesai' && (
                <button
                  onClick={() => onQuickStatusChange(note.id, 'Selesai')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 rounded-xl transition-colors cursor-pointer border border-emerald-300 dark:border-emerald-800"
                  title="Tandai komitmen telah selesai"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Selesaikan</span>
                </button>
              )}
            </div>
          </div>

          {/* JUDUL / TOPIK DISKUSI (BESAR, JELAS, ELEGAN) */}
          <div className="space-y-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
              Pokok Permasalahan &amp; Topik Asistensi:
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-snug">
              {note.topikDiskusi}
            </h3>
            
            {/* Indikator Terkait Chips */}
            {note.indikatorTerkait && note.indikatorTerkait.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-xs font-bold text-slate-400 flex items-center gap-1 mr-1">
                  <Tag className="w-3.5 h-3.5 text-indigo-500" /> Indikator IKPA Terkait:
                </span>
                {note.indikatorTerkait.map(ind => (
                  <span 
                    key={ind} 
                    className="text-xs font-bold px-3 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                  >
                    {ind}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* PIHAK YANG TERLIBAT: LEBAR & JELAS DENGAN AKSI KONTAK */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Petugas KPPN */}
            <div className={`p-4 sm:p-5 rounded-2xl border ${
              isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50/80 border-slate-200'
            }`}>
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                  KPPN
                </div>
                <div>
                  <span className="text-[10px] uppercase font-extrabold text-slate-400 block tracking-wider">
                    Petugas Pembina / Pendamping KPPN:
                  </span>
                  <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                    {note.petugasKPPN}
                  </p>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                    KPPN Semarang I &bull; Pembina IKPA Satker
                  </p>
                </div>
              </div>
            </div>

            {/* Perwakilan Satker */}
            <div className={`p-4 sm:p-5 rounded-2xl border ${
              isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50/80 border-slate-200'
            }`}>
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                  SATKER
                </div>
                <div className="flex-1">
                  <span className="text-[10px] uppercase font-extrabold text-slate-400 block tracking-wider">
                    Perwakilan Satker yang Hadir:
                  </span>
                  <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                    {note.perwakilanSatker || 'Petugas Pengelola Keuangan'}
                  </p>
                  
                  {note.kontakSatker ? (
                    <div className="flex items-center gap-2 mt-1">
                      <a 
                        href={`https://wa.me/${getCleanPhone(note.kontakSatker)}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                      >
                        <Phone className="w-3 h-3" /> {note.kontakSatker} (Buka WhatsApp)
                      </a>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                      Pengelola Perbendaharaan Satker
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* BAGIAN 1: RINGKASAN HASIL PEMBAHASAN, FAKTA & KENDALA SATKER (LEGA & SANGAT NYAMAN DIBACA) */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                1. Ringkasan Fakta Lapangan, Hasil Pembahasan &amp; Kendala Satker:
              </h4>
            </div>
            
            <div className={`p-5 sm:p-6 rounded-2xl border leading-relaxed text-sm sm:text-base font-normal whitespace-pre-wrap ${
              isDark 
                ? 'bg-slate-950 border-slate-800 text-slate-200' 
                : 'bg-slate-50/90 border-slate-200 text-slate-800'
            }`}>
              {note.poinPembahasan}
            </div>
          </div>

          {/* BAGIAN 2: KESEPAKATAN SOLUSI & RENCANA TINDAK LANJUT (FULL WIDTH LEBAR & SANGAT JELAS) */}
          {note.tindakLanjut && (
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                    2. Kesepakatan Solusi &amp; Rencana Tindak Lanjut (Action Plan):
                  </h4>
                </div>

                {note.targetSelesai && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700">
                    <Clock3 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-300" />
                    Target Selesai: {note.targetSelesai}
                  </span>
                )}
              </div>

              <div className={`p-5 sm:p-6 rounded-2xl border leading-relaxed text-sm sm:text-base font-medium whitespace-pre-wrap ${
                isDark 
                  ? 'bg-emerald-950/30 border-emerald-800/80 text-emerald-100' 
                  : 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
              }`}>
                {note.tindakLanjut}
              </div>
            </div>
          )}

          {/* BAGIAN 3: CATATAN TAMBAHAN (JIKA ADA) */}
          {note.catatanTambahan && (
            <div className="space-y-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 block">
                3. Catatan Tambahan / Saran Petugas Pembina:
              </span>
              <div className={`p-4 sm:p-5 rounded-2xl border text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-100/70 border-slate-200 text-slate-700'
              }`}>
                {note.catatanTambahan}
              </div>
            </div>
          )}

          {/* FORMAL SIGNATURE BLOCKS FOR PRINT / PDF */}
          <div className="hidden print:grid grid-cols-2 gap-8 pt-10 border-t border-slate-300 text-xs">
            <div className="text-center space-y-16">
              <div>
                <p className="font-bold text-slate-800">Mengetahui / Menyetujui,</p>
                <p className="font-extrabold text-slate-900">Perwakilan Satuan Kerja</p>
                <p className="text-[11px] text-slate-600">{satker.namaSatker}</p>
              </div>
              <div>
                <p className="font-bold text-slate-900 underline">
                  ( {note.perwakilanSatker || 'Petugas Pengelola Keuangan'} )
                </p>
                <p className="text-[10px] text-slate-500">NIP / Jabatan</p>
              </div>
            </div>

            <div className="text-center space-y-16">
              <div>
                <p className="font-bold text-slate-800">Semarang, {note.tanggal}</p>
                <p className="font-extrabold text-slate-900">Petugas Pembina / Pendamping IKPA</p>
                <p className="text-[11px] text-slate-600">KPPN Tipe A1 Semarang I</p>
              </div>
              <div>
                <p className="font-bold text-slate-900 underline">
                  ( {note.petugasKPPN} )
                </p>
                <p className="text-[10px] text-slate-500">Petugas Seksi MSKI KPPN</p>
              </div>
            </div>
          </div>

        </div>

        {/* MODAL FOOTER: ACTION BUTTONS (UBAH, HAPUS, TUTUP) */}
        <div className={`p-4 sm:p-5 border-t flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden ${
          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-2">
            {/* Tombol Hapus */}
            <button
              type="button"
              onClick={() => onDelete(note.id)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-rose-200 dark:border-rose-900 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4 text-rose-500" />
              <span>Hapus Catatan Ini</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Tombol Ubah / Edit */}
            <button
              type="button"
              onClick={() => onEdit(note)}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-all cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
              <span>Ubah Catatan</span>
            </button>

            {/* Tombol Tutup */}
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
