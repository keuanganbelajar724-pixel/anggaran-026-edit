import React, { useState } from 'react';
import { 
  X, 
  Save, 
  AlertCircle, 
  Calendar, 
  Clock, 
  Tag, 
  Users, 
  BookOpen, 
  FileText, 
  HelpCircle,
  CheckCircle2
} from 'lucide-react';
import { 
  LLATEvent, 
  LLATCategory, 
  LLATPrioritas, 
  LLATStatus, 
  LLATStatusMode, 
  LLATPublikasi,
  LLATTargetPengguna 
} from '../../types/llat';

interface LLATEventFormModalProps {
  eventToEdit?: LLATEvent | null;
  categories: LLATCategory[];
  currentYear: number;
  existingEvents: LLATEvent[];
  onClose: () => void;
  onSave: (event: LLATEvent) => void;
}

const TARGET_OPTIONS: { id: LLATTargetPengguna; label: string }[] = [
  { id: 'SEMUA_SATKER', label: 'Semua Satuan Kerja' },
  { id: 'BENDAHARA', label: 'Bendahara Pengeluaran / Penerimaan' },
  { id: 'PPK', label: 'Pejabat Pembuat Komitmen (PPK)' },
  { id: 'PPSPM', label: 'Pejabat Penandatangan SPM (PPSPM)' },
  { id: 'KPA', label: 'Kuasa Pengguna Anggaran (KPA)' },
  { id: 'OPERATOR', label: 'Operator SAKTI (Komitmen/Pembayaran/GLP)' },
  { id: 'ADMIN', label: 'Admin / Petugas Internal KPPN' },
  { id: 'UAKPA', label: 'Petugas Akuntansi / UAKPA' },
  { id: 'BLU', label: 'Satker BLU (Badan Layanan Umum)' }
];

export const LLATEventFormModal: React.FC<LLATEventFormModalProps> = ({
  eventToEdit,
  categories,
  currentYear,
  existingEvents,
  onClose,
  onSave
}) => {
  const isEdit = Boolean(eventToEdit);

  // Form states
  const [tahunAnggaran, setTahunAnggaran] = useState<number>(eventToEdit?.tahun_anggaran || currentYear);
  const [kodeKegiatan, setKodeKegiatan] = useState<string>(
    eventToEdit?.kode_kegiatan || `LLAT-${String(existingEvents.length + 1).padStart(2, '0')}`
  );
  const [namaKegiatan, setNamaKegiatan] = useState<string>(eventToEdit?.nama_kegiatan || '');
  const [kategori, setKategori] = useState<string>(eventToEdit?.kategori || categories[0]?.nama || 'SPM');
  const [deskripsi, setDeskripsi] = useState<string>(eventToEdit?.deskripsi || '');
  const [tanggalMulai, setTanggalMulai] = useState<string>(
    eventToEdit?.tanggal_mulai || `${currentYear}-12-01`
  );
  const [tanggalBatas, setTanggalBatas] = useState<string>(
    eventToEdit?.tanggal_batas || `${currentYear}-12-15`
  );
  const [jamBatas, setJamBatas] = useState<string>(eventToEdit?.jam_batas || '17:00');
  const [timezone, setTimezone] = useState<string>(eventToEdit?.timezone || 'WIB');
  const [prioritas, setPrioritas] = useState<LLATPrioritas>(eventToEdit?.prioritas || 'NORMAL');
  const [statusMode, setStatusMode] = useState<LLATStatusMode>(eventToEdit?.status_mode || 'AUTO');
  const [manualStatus, setManualStatus] = useState<LLATStatus>(eventToEdit?.manual_status || 'BERJALAN');
  const [targetPengguna, setTargetPengguna] = useState<string[]>(
    eventToEdit?.target_pengguna || ['SEMUA_SATKER']
  );
  const [dasarHukum, setDasarHukum] = useState<string>(
    eventToEdit?.dasar_hukum || 'Pedoman Pelaksanaan Penerimaan dan Pengeluaran Negara Akhir Tahun Anggaran'
  );
  const [nomorPeraturan, setNomorPeraturan] = useState<string>(
    eventToEdit?.nomor_peraturan || 'PER-17/PB/2025'
  );
  const [sumberUrl, setSumberUrl] = useState<string>(eventToEdit?.sumber_url || '');
  const [catatan, setCatatan] = useState<string>(eventToEdit?.catatan || '');
  const [publikasi, setPublikasi] = useState<LLATPublikasi>(eventToEdit?.publikasi || 'PUBLISHED');
  const [isActive, setIsActive] = useState<boolean>(eventToEdit?.is_active ?? true);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const toggleTarget = (targetId: string) => {
    if (targetPengguna.includes(targetId)) {
      const filtered = targetPengguna.filter((t) => t !== targetId);
      setTargetPengguna(filtered.length > 0 ? filtered : ['SEMUA_SATKER']);
    } else {
      setTargetPengguna([...targetPengguna, targetId]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation checks
    if (!kodeKegiatan.trim()) {
      setErrorMessage('Kode kegiatan wajib diisi.');
      return;
    }
    if (!namaKegiatan.trim()) {
      setErrorMessage('Nama kegiatan wajib diisi.');
      return;
    }
    if (!tanggalMulai) {
      setErrorMessage('Tanggal mulai wajib diisi.');
      return;
    }
    if (!tanggalBatas) {
      setErrorMessage('Tanggal batas (deadline) wajib diisi.');
      return;
    }
    if (tanggalBatas < tanggalMulai) {
      setErrorMessage('Tanggal batas akhir tidak boleh lebih awal dari tanggal mulai kegiatan.');
      return;
    }

    // Duplicate check for kode (if changed or new)
    const isDuplicate = existingEvents.some(
      (ev) => ev.kode_kegiatan.toUpperCase() === kodeKegiatan.trim().toUpperCase() && ev.llat_id !== eventToEdit?.llat_id
    );
    if (isDuplicate) {
      setErrorMessage(`Kode kegiatan "${kodeKegiatan.trim()}" sudah digunakan pada kegiatan lain.`);
      return;
    }

    const payload: LLATEvent = {
      llat_id: eventToEdit?.llat_id || `llat-${Date.now()}`,
      tahun_anggaran: Number(tahunAnggaran),
      kode_kegiatan: kodeKegiatan.trim().toUpperCase(),
      nama_kegiatan: namaKegiatan.trim(),
      kategori,
      deskripsi: deskripsi.trim(),
      tanggal_mulai: tanggalMulai,
      tanggal_batas: tanggalBatas,
      jam_batas: jamBatas.trim() || '17:00',
      timezone: timezone.trim() || 'WIB',
      status: statusMode === 'MANUAL' ? manualStatus : (eventToEdit?.status || 'BERJALAN'),
      status_mode: statusMode,
      manual_status: manualStatus,
      prioritas,
      target_pengguna: targetPengguna,
      dasar_hukum: dasarHukum.trim(),
      nomor_peraturan: nomorPeraturan.trim(),
      sumber_url: sumberUrl.trim(),
      catatan: catatan.trim(),
      urutan: eventToEdit?.urutan || (existingEvents.length + 1),
      is_active: isActive,
      publikasi,
      created_at: eventToEdit?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: (eventToEdit?.version || 1) + (isEdit ? 1 : 0)
    };

    onSave(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              {isEdit ? 'Edit Kegiatan LLAT' : 'Tambah Kegiatan Baru Kalender LLAT'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isEdit ? `Memperbarui rincian untuk ${eventToEdit?.kode_kegiatan}` : 'Entri jadwal dan batas waktu resmi akhir tahun'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span className="font-bold">{errorMessage}</span>
            </div>
          )}

          {/* Row 1: Tahun & Kode & Kategori */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Tahun Anggaran <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                value={tahunAnggaran}
                onChange={(e) => setTahunAnggaran(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Kode Kegiatan <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={kodeKegiatan}
                onChange={(e) => setKodeKegiatan(e.target.value)}
                placeholder="misal LLAT-01"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold uppercase"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Kategori <span className="text-rose-500">*</span>
              </label>
              <select
                value={kategori}
                onChange={(e) => setKategori(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.nama}>{c.nama}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Nama Kegiatan */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Nama Kegiatan LLAT <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={namaKegiatan}
              onChange={(e) => setNamaKegiatan(e.target.value)}
              placeholder="misal: Batas Pengajuan SPM-LS Gaji Induk Januari 2027"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-extrabold text-sm text-slate-900 dark:text-white"
              required
            />
          </div>

          {/* Deskripsi */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Deskripsi &amp; Ketentuan Teknis
            </label>
            <textarea
              rows={2}
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              placeholder="Rincian ketentuan, berkas yang harus dilampirkan, atau penjelasan proses..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            />
          </div>

          {/* Row 2: Tanggal Mulai & Tanggal Batas & Jam */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Tanggal Mulai <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={tanggalMulai}
                onChange={(e) => setTanggalMulai(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-rose-600 dark:text-rose-400">
                Tanggal Batas (Deadline) <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={tanggalBatas}
                onChange={(e) => setTanggalBatas(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-rose-300 dark:border-rose-700 bg-white dark:bg-slate-800 font-bold text-rose-600 dark:text-rose-400"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Jam Batas &amp; Timezone
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={jamBatas}
                  onChange={(e) => setJamBatas(e.target.value)}
                  placeholder="17:00"
                  className="w-2/3 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                />
                <input
                  type="text"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  placeholder="WIB"
                  className="w-1/3 px-2 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-center"
                />
              </div>
            </div>
          </div>

          {/* Row 3: Prioritas & Status Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Tingkat Prioritas Kegiatan
              </label>
              <select
                value={prioritas}
                onChange={(e) => setPrioritas(e.target.value as LLATPrioritas)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
              >
                <option value="NORMAL">NORMAL (Biru)</option>
                <option value="PENTING">PENTING (Kuning/Oranye)</option>
                <option value="KRITIS">KRITIS (Merah)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Metode Penentuan Status
              </label>
              <select
                value={statusMode}
                onChange={(e) => setStatusMode(e.target.value as LLATStatusMode)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
              >
                <option value="AUTO">AUTO (Dihitung Otomatis Berdasarkan Tanggal)</option>
                <option value="MANUAL">MANUAL (Admin Menentukan Status Tertentu)</option>
              </select>
            </div>
          </div>

          {statusMode === 'MANUAL' && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300">
              <label className="block font-bold text-amber-900 dark:text-amber-200 mb-1">
                Pilih Status Manual:
              </label>
              <select
                value={manualStatus}
                onChange={(e) => setManualStatus(e.target.value as LLATStatus)}
                className="w-full px-3 py-1.5 rounded-lg border border-amber-400 bg-white dark:bg-slate-800 font-bold"
              >
                <option value="BELUM_DIMULAI">BELUM DIMULAI</option>
                <option value="BERJALAN">BERJALAN</option>
                <option value="SEGERA">SEGERA JATUH TEMPO</option>
                <option value="HARI_INI">HARI INI</option>
                <option value="SELESAI">SELESAI</option>
                <option value="TERLEWAT">TERLEWAT</option>
              </select>
            </div>
          )}

          {/* Target Pengguna (Multi-Select Pills) */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Target Pengguna / Satuan Kerja (Klik untuk memilih)
            </label>
            <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              {TARGET_OPTIONS.map((opt) => {
                const isSelected = targetPengguna.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggleTarget(opt.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700 hover:border-indigo-400'
                    }`}
                  >
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dasar Hukum & Nomor Peraturan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nomor Peraturan / Juknis
              </label>
              <input
                type="text"
                value={nomorPeraturan}
                onChange={(e) => setNomorPeraturan(e.target.value)}
                placeholder="misal: PER-17/PB/2025"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Dasar Hukum / Peraturan DJPb
              </label>
              <input
                type="text"
                value={dasarHukum}
                onChange={(e) => setDasarHukum(e.target.value)}
                placeholder="Perdirjen Perbendaharaan LLAT"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
          </div>

          {/* Sumber URL & Catatan Petugas */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Link Sumber Resmi / Dokumen Sosialisasi (URL)
            </label>
            <input
              type="url"
              value={sumberUrl}
              onChange={(e) => setSumberUrl(e.target.value)}
              placeholder="https://djpb.kemenkeu.go.id/kppn/semarang1/..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-[11px]"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Catatan Khusus KPPN / Mitigasi Kendala Satker
            </label>
            <textarea
              rows={2}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Peringatan khusus atau tips penyelesaian dokumen..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>

          {/* Publikasi & Aktif Toggle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Status Publikasi
              </label>
              <select
                value={publikasi}
                onChange={(e) => setPublikasi(e.target.value as LLATPublikasi)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
              >
                <option value="PUBLISHED">PUBLISHED (Tampil di Dashboard Satker)</option>
                <option value="DRAFT">DRAFT (Hanya Terlihat oleh Admin)</option>
                <option value="ARCHIVED">ARCHIVED (Diarsipkan)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Visibilitas Item
              </label>
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-rose-600 text-white shadow-xs'
                  }`}
                >
                  {isActive ? '🟢 AKTIF' : '🔴 NONAKTIF'}
                </button>
                <span className="text-[11px] text-slate-500">
                  {isActive ? 'Dapat diakses sesuai status publikasi' : 'Disembunyikan dari satker'}
                </span>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-md flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>{isEdit ? 'Perbarui Jadwal LLAT' : 'Simpan Kegiatan'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
