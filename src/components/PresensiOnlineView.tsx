import React, { useState, useRef, useEffect } from 'react';
import { 
  ClipboardCheck, 
  PenTool, 
  RotateCcw, 
  Check, 
  Calendar, 
  Clock, 
  MapPin, 
  Building2, 
  UserCheck, 
  Lock, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2,
  Phone,
  User,
  Hash,
  Download,
  ArrowRight,
  ShieldCheck,
  QrCode
} from 'lucide-react';
import { 
  PresensiKegiatan, 
  PesertaPresensi, 
  AppTheme, 
  SatkerIKPA, 
  DashboardConfig 
} from '../types';

interface PresensiOnlineViewProps {
  kegiatanList?: PresensiKegiatan[];
  pesertaList?: PesertaPresensi[];
  satkers?: SatkerIKPA[];
  theme?: AppTheme;
  dashboardConfig?: DashboardConfig;
  isAdminAuthenticated?: boolean;
  onSavePesertaPresensi: (peserta: PesertaPresensi) => void;
  onDeletePesertaPresensi?: (pesertaId: string) => void;
  onSaveKegiatan?: (kegiatan: PresensiKegiatan) => void;
  onDeleteKegiatan?: (kegiatanId: string) => void;
  onGoToAdmin?: () => void;
}

export const INITIAL_DEFAULT_KEGIATAN: PresensiKegiatan[] = [
  {
    id: 'kegiatan-presensi-1',
    judulKegiatan: 'Sosialisasi & Bimtek Akselerasi IKPA & Capaian Output SAKTI TA 2026',
    subJudul: 'Penyampaian Strategi Kinerja Anggaran & Reformasi PER-5/PB/2024',
    tanggal: '15 Agustus 2026',
    jamMulai: '08:30',
    jamSelesai: '12:00 WIB',
    jenis: 'Hybrid',
    lokasi: 'Aula Lantai 2 KPPN Semarang I / Zoom Meeting Hybrid',
    deskripsi: 'Wajib dihadiri oleh KPA/PPK/PPSPM dan Pejabat/Operator Satker lingkup pembayaran KPPN Semarang I (026).',
    penyelenggara: 'Seksi MSKI KPPN Semarang I',
    isActive: true,
    isLocked: false,
    createdAt: new Date().toISOString()
  }
];

export const PresensiOnlineView: React.FC<PresensiOnlineViewProps> = ({
  kegiatanList = INITIAL_DEFAULT_KEGIATAN,
  satkers = [],
  theme = 'light',
  dashboardConfig,
  isAdminAuthenticated = false,
  onSavePesertaPresensi,
  onGoToAdmin
}) => {
  const isDark = theme === 'dark';

  // Active Events Filter
  const events = kegiatanList.length > 0 ? kegiatanList : INITIAL_DEFAULT_KEGIATAN;
  const activeEvents = events.filter(e => e.isActive);
  
  const [selectedEventId, setSelectedEventId] = useState<string>(() => {
    return activeEvents[0]?.id || events[0]?.id || '';
  });

  // Ensure valid selection
  const currentEvent = events.find(e => e.id === selectedEventId) || activeEvents[0] || events[0];

  // Participant Form State (Strictly clean & simplified)
  const [namaLengkap, setNamaLengkap] = useState('');
  const [nip, setNip] = useState('');
  const [asalInstansi, setAsalInstansi] = useState('');
  const [kodeSatker, setKodeSatker] = useState('');
  const [noHp, setNoHp] = useState('');

  // Autocomplete suggestions for Satker
  const [satkerSuggestions, setSatkerSuggestions] = useState<SatkerIKPA[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Signature Canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [penColor, setPenColor] = useState<string>('#0f172a'); // formal dark
  const [penSize, setPenSize] = useState<number>(2.5);

  // Success State & Confirmation Modal
  const [lastSubmittedPeserta, setLastSubmittedPeserta] = useState<PesertaPresensi | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Setup Canvas
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [penColor, penSize, selectedEventId]);

  // Handle Satker input suggestions
  const handleSatkerChange = (text: string) => {
    setAsalInstansi(text);
    if (!text.trim()) {
      setSatkerSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const q = text.toLowerCase();
    const matches = satkers.filter(s => 
      s.namaSatker.toLowerCase().includes(q) || 
      s.kodeSatker.includes(q)
    ).slice(0, 5);
    setSatkerSuggestions(matches);
    setShowSuggestions(matches.length > 0);
  };

  const handleSelectSatker = (satker: SatkerIKPA) => {
    setAsalInstansi(satker.namaSatker);
    setKodeSatker(satker.kodeSatker);
    setShowSuggestions(false);
  };

  // Drawing Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penSize;
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  // Submit Presensi
  const handleSubmitPresensi = (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentEvent) {
      alert('Kegiatan presensi belum dipilih.');
      return;
    }

    if (currentEvent.isLocked) {
      alert('Pengisian presensi untuk kegiatan ini telah ditutup oleh Admin.');
      return;
    }

    if (!namaLengkap.trim()) {
      alert('Mohon masukkan Nama Lengkap Anda.');
      return;
    }

    if (!nip.trim()) {
      alert('Mohon masukkan NIP / NIK / Nomor Identitas Anda.');
      return;
    }

    if (!asalInstansi.trim()) {
      alert('Mohon masukkan Asal Satker / Instansi / Unit Kerja Anda.');
      return;
    }

    if (!hasSignature || !canvasRef.current) {
      alert('Mohon bubuhkan Tanda Tangan Digital Anda pada kanvas yang disediakan.');
      return;
    }

    setIsSubmitting(true);

    try {
      const signatureDataUrl = canvasRef.current.toDataURL('image/png');
      const now = new Date();
      const waktuPresensi = now.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) + ' WIB';

      const newPeserta: PesertaPresensi = {
        id: `presensi-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        kegiatanId: currentEvent.id,
        namaLengkap: namaLengkap.trim(),
        nip: nip.trim(),
        asalInstansi: asalInstansi.trim(),
        kodeSatker: kodeSatker.trim() || undefined,
        noHp: noHp.trim() || undefined,
        waktuPresensi,
        tandaTanganUrl: signatureDataUrl,
        statusKehadiran: 'Hadir',
        createdAt: now.toISOString()
      };

      onSavePesertaPresensi(newPeserta);
      setLastSubmittedPeserta(newPeserta);
      setShowSuccessModal(true);

      // Reset form
      setNamaLengkap('');
      setNip('');
      setAsalInstansi('');
      setKodeSatker('');
      setNoHp('');
      clearSignature();
    } catch (err: any) {
      alert('Gagal menyimpan presensi: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Banner Header */}
      <div className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 border shadow-2xl transition-all ${
        isDark 
          ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950/80 border-slate-800/80 text-white' 
          : 'bg-gradient-to-br from-teal-950 via-slate-900 to-indigo-950 border-teal-900/50 text-white'
      }`}>
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 rounded-full bg-teal-500/20 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-64 h-64 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
                PRESENSI DIGITAL RESMI
              </span>
              <span className="bg-sky-500/20 text-sky-300 border border-sky-500/40 px-2.5 py-1 rounded-full text-xs font-bold">
                KPPN Semarang I (026)
              </span>
            </div>

            {onGoToAdmin && (
              <button
                onClick={onGoToAdmin}
                className="inline-flex items-center gap-1.5 bg-slate-900/80 hover:bg-slate-800 text-white font-extrabold px-3 py-1.5 rounded-xl border border-teal-400/40 text-xs shadow-md transition-all cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-amber-300" />
                <span>{isAdminAuthenticated ? 'Monitoring & Cetak di Admin' : 'Panel Admin Presensi'}</span>
              </button>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight text-white">
            Formulir Presensi Peserta (Sosialisasi &amp; Bimtek)
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
            Khusus peserta sosialisasi/bimtek KPPN Semarang I: Silakan pilih kegiatan yang Anda hadiri, isi identitas peserta, dan bubuhkan tanda tangan digital resmi Anda.
          </p>
        </div>
      </div>

      {/* Select Event Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                Pilih Kegiatan Sosialisasi
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pilih kegiatan yang sedang Anda ikuti
              </p>
            </div>
          </div>

          {currentEvent?.isLocked && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
              <Lock className="w-3.5 h-3.5" />
              Presensi Ditutup
            </span>
          )}
        </div>

        {/* If multiple active events, show buttons or dropdown */}
        {activeEvents.length > 1 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activeEvents.map((evt) => {
              const isSelected = evt.id === selectedEventId;
              return (
                <button
                  key={evt.id}
                  type="button"
                  onClick={() => setSelectedEventId(evt.id)}
                  className={`text-left p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                    isSelected
                      ? 'bg-teal-50 dark:bg-teal-950/50 border-teal-500 shadow-md ring-2 ring-teal-500/20'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-teal-400'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200">
                        {evt.jenis || 'Sosialisasi'}
                      </span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-teal-600" />}
                    </div>
                    <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white line-clamp-2">
                      {evt.judulKegiatan}
                    </h3>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <span>{evt.tanggal}</span>
                    {evt.jamMulai && <span>• {evt.jamMulai} WIB</span>}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-50 via-slate-50 to-teal-50 dark:from-slate-800 dark:via-slate-850 dark:to-slate-800 border border-teal-200 dark:border-teal-800/60 space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-teal-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase">
                {currentEvent?.jenis || 'Kegiatan Aktif'}
              </span>
              {currentEvent?.penyelenggara && (
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {currentEvent.penyelenggara}
                </span>
              )}
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              {currentEvent?.judulKegiatan || 'Sosialisasi & Bimtek KPPN Semarang I'}
            </h3>
            {currentEvent?.subJudul && (
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                {currentEvent.subJudul}
              </p>
            )}
          </div>
        )}

        {/* Event Quick Details Badges */}
        {currentEvent && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs text-slate-600 dark:text-slate-300">
            {currentEvent.tanggal && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-bold truncate">{currentEvent.tanggal}</span>
              </div>
            )}
            {(currentEvent.jamMulai || currentEvent.jamSelesai) && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <Clock className="w-4 h-4 text-sky-600 shrink-0" />
                <span className="font-bold truncate">{currentEvent.jamMulai} - {currentEvent.jamSelesai || 'Selesai'}</span>
              </div>
            )}
            {currentEvent.lokasi && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <MapPin className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-bold truncate">{currentEvent.lokasi}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Attendance Form */}
      {currentEvent?.isLocked ? (
        <div className="bg-rose-50 dark:bg-rose-950/40 rounded-3xl p-8 border-2 border-rose-200 dark:border-rose-800 text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-rose-100 dark:bg-rose-900 text-rose-600 dark:text-rose-300 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-black text-rose-900 dark:text-rose-200">
            Pengisian Presensi Telah Ditutup
          </h3>
          <p className="text-xs sm:text-sm text-rose-700 dark:text-rose-300 max-w-md mx-auto">
            Batas waktu presensi untuk kegiatan <strong>"{currentEvent.judulKegiatan}"</strong> telah dikunci oleh Panitia/Admin KPPN Semarang I.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmitPresensi} className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-teal-600" />
              <span>Isi Identitas Peserta</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Mohon isi data diri dengan teliti untuk kelengkapan daftar hadir resmi
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Nama Lengkap */}
            <div className="md:col-span-2">
              <label className="block text-xs font-black uppercase tracking-wider mb-1.5 text-slate-700 dark:text-slate-300">
                Nama Lengkap &amp; Gelar <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={namaLengkap}
                  onChange={(e) => setNamaLengkap(e.target.value)}
                  placeholder="Contoh: Dr. Budi Santoso, S.E., M.M."
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white placeholder:font-normal placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all shadow-xs"
                />
              </div>
            </div>

            {/* NIP / NIK */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider mb-1.5 text-slate-700 dark:text-slate-300">
                NIP / NIK / Nomor Identitas <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Hash className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={nip}
                  onChange={(e) => setNip(e.target.value)}
                  placeholder="Contoh: 198501012010121001"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white placeholder:font-normal placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all shadow-xs"
                />
              </div>
            </div>

            {/* No WhatsApp / HP */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider mb-1.5 text-slate-700 dark:text-slate-300">
                Nomor WhatsApp / HP <span className="text-slate-400 font-normal">(Opsional)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  value={noHp}
                  onChange={(e) => setNoHp(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white placeholder:font-normal placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all shadow-xs"
                />
              </div>
            </div>

            {/* Asal Satker / Instansi */}
            <div className="md:col-span-2 relative">
              <label className="block text-xs font-black uppercase tracking-wider mb-1.5 text-slate-700 dark:text-slate-300">
                Asal Satker / Instansi / Unit Kerja <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Building2 className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={asalInstansi}
                  onChange={(e) => handleSatkerChange(e.target.value)}
                  onFocus={() => {
                    if (asalInstansi.trim() && satkerSuggestions.length > 0) setShowSuggestions(true);
                  }}
                  placeholder="Ketik nama atau kode Satker (contoh: 527272 / BPS Provinsi Jawa Tengah)"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white placeholder:font-normal placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all shadow-xs"
                />
              </div>

              {/* Suggestions Dropdown */}
              {showSuggestions && satkerSuggestions.length > 0 && (
                <div className="absolute z-30 left-0 right-0 mt-1 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-700">
                  <div className="p-2 bg-slate-50 dark:bg-slate-850 text-[11px] font-bold text-slate-500 uppercase">
                    Pilih Saran Satker Resmi:
                  </div>
                  {satkerSuggestions.map((s) => (
                    <button
                      key={s.kodeSatker}
                      type="button"
                      onClick={() => handleSelectSatker(s)}
                      className="w-full text-left p-3 hover:bg-teal-50 dark:hover:bg-teal-950/50 flex items-center justify-between text-xs cursor-pointer transition-colors"
                    >
                      <div>
                        <div className="font-black text-slate-900 dark:text-white">{s.namaSatker}</div>
                        <div className="text-[11px] text-slate-500">Kode: {s.kodeSatker}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 text-[10px] font-bold">
                        Pilih
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Digital Signature Canvas Box */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <PenTool className="w-4 h-4 text-teal-600" />
                <span>Tanda Tangan Digital Resmi</span>
                <span className="text-rose-500">*</span>
              </label>

              {/* Pen Color Controls & Reset */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setPenColor('#0f172a')}
                    className={`w-5 h-5 rounded-full bg-slate-900 border transition-all ${
                      penColor === '#0f172a' ? 'ring-2 ring-teal-500 scale-110 border-white' : 'border-transparent opacity-60'
                    }`}
                    title="Tinta Hitam Formal"
                  />
                  <button
                    type="button"
                    onClick={() => setPenColor('#1d4ed8')}
                    className={`w-5 h-5 rounded-full bg-blue-700 border transition-all ${
                      penColor === '#1d4ed8' ? 'ring-2 ring-teal-500 scale-110 border-white' : 'border-transparent opacity-60'
                    }`}
                    title="Tinta Biru Resmi"
                  />
                </div>

                <button
                  type="button"
                  onClick={clearSignature}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 border border-rose-200 dark:border-rose-800 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Hapus / Ulang</span>
                </button>
              </div>
            </div>

            <div className="relative border-2 border-dashed border-teal-500/60 dark:border-teal-500/40 rounded-2xl overflow-hidden bg-white shadow-inner">
              <canvas
                ref={canvasRef}
                width={600}
                height={200}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-44 sm:h-48 touch-none cursor-crosshair bg-white"
              />
              
              {!hasSignature && (
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-400 gap-1">
                  <PenTool className="w-6 h-6 opacity-40 animate-bounce" />
                  <span className="text-xs font-bold">Goreskan Tanda Tangan Anda di Sini</span>
                  <span className="text-[10px] text-slate-400">Gunakan jari tangan di HP atau mouse di Laptop/PC</span>
                </div>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Tanda tangan digital ini akan direkam sebagai bukti otentik daftar hadir resmi KPPN Semarang I.
            </p>
          </div>

          {/* Submit Button */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 hover:from-teal-500 hover:to-emerald-600 text-white font-black text-sm sm:text-base shadow-xl shadow-teal-700/20 hover:shadow-teal-700/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Menyimpan Presensi...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Kirim Konfirmasi Presensi Digital</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Confirmation Success Modal */}
      {showSuccessModal && lastSubmittedPeserta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-teal-500 shadow-2xl space-y-5"
          >
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                Presensi Berhasil Dikirim!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Data kehadiran dan tanda tangan digital Anda telah tersimpan secara resmi.
              </p>
            </div>

            {/* Digital Attendance Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                <span className="text-[10px] font-black uppercase text-teal-600">Tanda Terima Kehadiran</span>
                <span className="text-[10px] font-mono text-slate-400">{lastSubmittedPeserta.id}</span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Nama: </span>
                  <strong className="text-slate-900 dark:text-white">{lastSubmittedPeserta.namaLengkap}</strong>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">NIP: </span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{lastSubmittedPeserta.nip}</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Satker: </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{lastSubmittedPeserta.asalInstansi}</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Kegiatan: </span>
                  <span className="font-bold text-teal-700 dark:text-teal-300">{currentEvent?.judulKegiatan}</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Waktu: </span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{lastSubmittedPeserta.waktuPresensi}</span>
                </div>
              </div>

              {/* Signature Preview */}
              {lastSubmittedPeserta.tandaTanganUrl && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 block mb-1">Tanda Tangan Terekam:</span>
                  <div className="p-2 bg-white rounded-xl border border-slate-200 dark:border-slate-600 flex items-center justify-center">
                    <img 
                      src={lastSubmittedPeserta.tandaTanganUrl} 
                      alt="Tanda Tangan" 
                      className="h-12 object-contain" 
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowSuccessModal(false)}
                className="flex-1 py-3 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs sm:text-sm transition-all shadow-md cursor-pointer"
              >
                Selesai / Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
