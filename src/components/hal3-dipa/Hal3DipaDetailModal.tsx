import React, { useState } from 'react';
import { 
  X, 
  Building2, 
  Calendar, 
  Clock, 
  FileText, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  Phone, 
  User, 
  MessageSquare, 
  History, 
  Save, 
  Info,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Plus
} from 'lucide-react';
import { 
  MonitoringHal3Item, 
  TindakLanjutHal3, 
  HistoriHal3Item,
  StatusTindakLanjutHal3, 
  KeputusanSatkerHal3, 
  MediaKonfirmasiHal3, 
  STANDAR_ALASAN_TIDAK_MENGAJUKAN 
} from '../../types/hal3Dipa';

interface Hal3DipaDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: MonitoringHal3Item | null;
  onSaveTindakLanjut: (
    recordId: string, 
    updatedTindakLanjut: TindakLanjutHal3, 
    historiEntry: HistoriHal3Item
  ) => void;
  currentUser?: { name?: string; role?: string } | null;
}

export const Hal3DipaDetailModal: React.FC<Hal3DipaDetailModalProps> = ({
  isOpen,
  onClose,
  record,
  onSaveTindakLanjut,
  currentUser
}) => {
  if (!isOpen || !record) return null;

  const currentTl = record.tindak_lanjut;

  const [activeTab, setActiveTab] = useState<'tindak-lanjut' | 'histori'>('tindak-lanjut');

  // Form states
  const [statusTindakLanjut, setStatusTindakLanjut] = useState<StatusTindakLanjutHal3>(
    currentTl?.status_tindak_lanjut || 'Belum Ditindaklanjuti'
  );
  const [keputusanSatker, setKeputusanSatker] = useState<KeputusanSatkerHal3>(
    currentTl?.keputusan_satker || ''
  );
  const [alasanKode, setAlasanKode] = useState<string>(
    currentTl?.alasan_kode || ''
  );
  const [alasanDetail, setAlasanDetail] = useState<string>(
    currentTl?.alasan_detail || ''
  );
  const [tanggalKonfirmasi, setTanggalKonfirmasi] = useState<string>(
    currentTl?.tanggal_konfirmasi || new Date().toISOString().split('T')[0]
  );
  const [namaPic, setNamaPic] = useState<string>(currentTl?.nama_pic || '');
  const [jabatanPic, setJabatanPic] = useState<string>(currentTl?.jabatan_pic || '');
  const [noHpPic, setNoHpPic] = useState<string>(currentTl?.no_hp_pic || '');
  const [mediaKonfirmasi, setMediaKonfirmasi] = useState<MediaKonfirmasiHal3>(
    currentTl?.media_konfirmasi || 'WhatsApp'
  );
  const [catatanHasil, setCatatanHasil] = useState<string>(currentTl?.catatan_kppn || '');
  const [rencanaTindakLanjut, setRencanaTindakLanjut] = useState<string>(
    currentTl?.rencana_tindak_lanjut || ''
  );
  const [tanggalFollowUp, setTanggalFollowUp] = useState<string>(
    currentTl?.tanggal_follow_up || ''
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validasi
    if (keputusanSatker === 'Tidak Mengajukan') {
      if (!alasanKode) {
        setErrorMsg('Silakan pilih salah satu alasan mengapa satker tidak mengajukan revisi.');
        return;
      }
      if (alasanKode === 'Lainnya.' && !alasanDetail.trim()) {
        setErrorMsg('Untuk alasan "Lainnya", wajib mengisi penjelasan detail pada kolom penjelasan.');
        return;
      }
    }

    const now = new Date().toISOString();
    const petugasNama = currentUser?.name || 'Petugas KPPN Semarang I';

    const updatedTl: TindakLanjutHal3 = {
      id: currentTl?.id || `tl-${record.kode_satker}-${Date.now()}`,
      monitoring_id: record.id,
      status_tindak_lanjut: statusTindakLanjut,
      keputusan_satker: keputusanSatker,
      alasan_kode: alasanKode,
      alasan_detail: alasanDetail,
      tanggal_konfirmasi: tanggalKonfirmasi,
      nama_pic: namaPic,
      jabatan_pic: jabatanPic,
      no_hp_pic: noHpPic,
      media_konfirmasi: mediaKonfirmasi,
      catatan_kppn: catatanHasil,
      rencana_tindak_lanjut: rencanaTindakLanjut,
      tanggal_follow_up: tanggalFollowUp,
      petugas_id: currentUser?.role || 'staff',
      petugas_nama: petugasNama,
      created_at: currentTl?.created_at || now,
      updated_at: now
    };

    // Keterangan Histori
    let keteranganHistori = `Pembaruan tindak lanjut: Status ${statusTindakLanjut}`;
    if (keputusanSatker) {
      keteranganHistori += `, Keputusan satker: ${keputusanSatker}`;
    }
    if (alasanKode) {
      keteranganHistori += `. Alasan: ${alasanKode}`;
    }

    const historiItem: HistoriHal3Item = {
      id: `hist-${record.kode_satker}-${Date.now()}`,
      monitoring_id: record.id,
      tanggal: now,
      jenis_perubahan: 
        statusTindakLanjut === 'Selesai' 
          ? 'SELESAI' 
          : keputusanSatker 
            ? 'KEPUTUSAN_SATKER' 
            : 'TINDAK_LANJUT_DIHUBUNGI',
      status_lama: currentTl?.status_tindak_lanjut || 'Belum Ditindaklanjuti',
      status_baru: statusTindakLanjut,
      keterangan: keteranganHistori,
      user_nama: petugasNama,
      created_at: now
    };

    onSaveTindakLanjut(record.id, updatedTl, historiItem);
    setSuccessToast('Data tindak lanjut berhasil disimpan.');
    setTimeout(() => {
      setSuccessToast(null);
    }, 3000);
  };

  const isSudahMengajukan = record.status_kanwil === 'Sudah Mengajukan';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden my-auto">
        {/* Header Modal */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300 font-black shadow-inner">
              📑
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] uppercase font-black tracking-widest px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-400/30">
                  DETAIL MONITORING HAL III DIPA
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {record.periode} TA {record.tahun_anggaran}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white mt-0.5 truncate max-w-md sm:max-w-xl">
                {record.kode_satker} - {record.nama_satker || record.nama_satker_source}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigasi Modal */}
        <div className="px-6 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('tindak-lanjut')}
              className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'tindak-lanjut'
                  ? 'bg-teal-600 text-white shadow-xs shadow-teal-600/30'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Form Tindak Lanjut KPPN</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('histori')}
              className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'histori'
                  ? 'bg-teal-600 text-white shadow-xs shadow-teal-600/30'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Linimasa Histori ({record.histori?.length || 0})</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-500 font-semibold hidden sm:block">
            KPPN Semarang I &bull; Kode 026
          </div>
        </div>

        {/* Body Modal */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {successToast && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-3 animate-fade-in shadow-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successToast}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-bold flex items-center gap-3 animate-fade-in">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section: Status dari Kanwil (SOURCE DATA) */}
          <div className="p-4.5 rounded-2xl border border-sky-200 dark:border-sky-900/60 bg-sky-50/70 dark:bg-sky-950/30 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-sky-600 text-white tracking-wider">
                  SOURCE DATA
                </span>
                <h3 className="text-xs font-black text-sky-950 dark:text-sky-200 uppercase tracking-wider">
                  STATUS DARI KANWIL DJPB
                </h3>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Sumber File: <strong className="text-slate-800 dark:text-slate-200">{record.source_file_name}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-400">Status Kanwil</div>
                <div className="mt-1 flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black ${
                    isSudahMengajukan
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${isSudahMengajukan ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`} />
                    {record.status_kanwil}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-400">Tanggal Data</div>
                <div className="mt-1 text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{record.tanggal_data || '06 Oktober 2026'}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-400">Status Upload Terkini</div>
                <div className="mt-1 text-xs font-bold text-slate-800 dark:text-slate-200">
                  {record.is_in_latest_upload !== false ? (
                    <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Aktif pada upload terbaru
                    </span>
                  ) : (
                    <span className="text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Tidak terdapat pada upload terbaru
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {activeTab === 'tindak-lanjut' ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="p-5 rounded-2xl border border-teal-200 dark:border-teal-900/60 bg-teal-50/40 dark:bg-teal-950/20 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-teal-600 text-white tracking-wider">
                    INTERNAL KPPN
                  </span>
                  <h3 className="text-xs font-black text-teal-950 dark:text-teal-200 uppercase tracking-wider">
                    TINDAK LANJUT KPPN SEMARANG I
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Status Tindak Lanjut */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Status Tindak Lanjut <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={statusTindakLanjut}
                      onChange={(e) => setStatusTindakLanjut(e.target.value as StatusTindakLanjutHal3)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 outline-none"
                    >
                      <option value="Belum Ditindaklanjuti">🔴 Belum Ditindaklanjuti</option>
                      <option value="Sudah Dihubungi">📞 Sudah Dihubungi</option>
                      <option value="Menunggu Jawaban">⏳ Menunggu Jawaban</option>
                      <option value="Akan Mengajukan">📤 Akan Mengajukan</option>
                      <option value="Tidak Mengajukan">📝 Tidak Mengajukan</option>
                      <option value="Hal III Sudah Sesuai">🟢 Hal III Sudah Sesuai</option>
                      <option value="Selesai">✅ Selesai</option>
                      <option value="Lainnya">⚪ Lainnya</option>
                    </select>
                  </div>

                  {/* Keputusan Satker */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Keputusan / Pernyataan Satker
                    </label>
                    <select
                      value={keputusanSatker}
                      onChange={(e) => {
                        const val = e.target.value as KeputusanSatkerHal3;
                        setKeputusanSatker(val);
                        if (val === 'Hal III Sudah Sesuai') {
                          setAlasanKode('Hal III DIPA sudah sesuai dengan kebutuhan.');
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 outline-none"
                    >
                      <option value="">-- Pilih Keputusan Satker --</option>
                      <option value="Akan Mengajukan">Akan Mengajukan</option>
                      <option value="Tidak Mengajukan">Tidak Mengajukan</option>
                      <option value="Masih Dalam Proses/Koordinasi">Masih Dalam Proses/Koordinasi</option>
                      <option value="Hal III Sudah Sesuai">Hal III Sudah Sesuai</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>
                </div>

                {/* Form Alasan Tidak Mengajukan */}
                {(keputusanSatker === 'Tidak Mengajukan' || statusTindakLanjut === 'Tidak Mengajukan' || keputusanSatker === 'Hal III Sudah Sesuai') && (
                  <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-3 animate-fade-in">
                    <div>
                      <label className="block text-xs font-black text-amber-950 dark:text-amber-200 mb-1">
                        Alasan Tidak Mengajukan Revisi <span className="text-rose-500">*</span>
                      </label>
                      <p className="text-[11px] text-amber-700 dark:text-amber-400 mb-2">
                        Pilihan kategori internal KPPN untuk pemetaan dan bahan laporan pimpinan.
                      </p>
                      <select
                        value={alasanKode}
                        onChange={(e) => setAlasanKode(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500 outline-none"
                      >
                        <option value="">-- Pilih Kategori Alasan --</option>
                        {STANDAR_ALASAN_TIDAK_MENGAJUKAN.map((alasan, i) => (
                          <option key={i} value={alasan}>
                            {i + 1}. {alasan}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Penjelasan Tambahan {alasanKode === 'Lainnya.' && <span className="text-rose-500">* (Wajib diisi untuk alasan Lainnya)</span>}
                      </label>
                      <textarea
                        rows={2}
                        value={alasanDetail}
                        onChange={(e) => setAlasanDetail(e.target.value)}
                        placeholder="Uraikan penjelasan atau dasar pertimbangan satker..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Form Informasi PIC & Komunikasi */}
                <div className="space-y-3 pt-2 border-t border-teal-200/60 dark:border-teal-900/40">
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-teal-600" />
                    Informasi PIC Satker & Media Komunikasi
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Nama PIC Satker
                      </label>
                      <input
                        type="text"
                        value={namaPic}
                        onChange={(e) => setNamaPic(e.target.value)}
                        placeholder="Contoh: Budi Santoso"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-200"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Jabatan PIC
                      </label>
                      <input
                        type="text"
                        value={jabatanPic}
                        onChange={(e) => setJabatanPic(e.target.value)}
                        placeholder="Contoh: Bendahara / PPK / Operator"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-200"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        No. HP / WA PIC
                      </label>
                      <input
                        type="text"
                        value={noHpPic}
                        onChange={(e) => setNoHpPic(e.target.value)}
                        placeholder="Contoh: 081234567890"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-200"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Media Konfirmasi
                      </label>
                      <select
                        value={mediaKonfirmasi}
                        onChange={(e) => setMediaKonfirmasi(e.target.value as MediaKonfirmasiHal3)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200"
                      >
                        <option value="WhatsApp">📱 WhatsApp</option>
                        <option value="Telepon">📞 Telepon</option>
                        <option value="Email">✉️ Email</option>
                        <option value="Surat">📄 Surat</option>
                        <option value="Tatap Muka">🤝 Tatap Muka</option>
                        <option value="Lainnya">⚪ Lainnya</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Tanggal Konfirmasi
                      </label>
                      <input
                        type="date"
                        value={tanggalKonfirmasi}
                        onChange={(e) => setTanggalKonfirmasi(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-200"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Tanggal Follow Up Berikutnya
                      </label>
                      <input
                        type="date"
                        value={tanggalFollowUp}
                        onChange={(e) => setTanggalFollowUp(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-200"
                      />
                    </div>
                  </div>
                </div>

                {/* Catatan Internal & Rencana */}
                <div className="space-y-3 pt-2 border-t border-teal-200/60 dark:border-teal-900/40">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Catatan Hasil Konfirmasi & Pembicaraan
                    </label>
                    <textarea
                      rows={2}
                      value={catatanHasil}
                      onChange={(e) => setCatatanHasil(e.target.value)}
                      placeholder="Catatan hasil diskusi dengan satker..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Rencana Tindak Lanjut KPPN
                    </label>
                    <input
                      type="text"
                      value={rencanaTindakLanjut}
                      onChange={(e) => setRencanaTindakLanjut(e.target.value)}
                      placeholder="Contoh: Monitoring pengiriman revisi sampai dengan batas akhir LLAT"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-black shadow-lg shadow-teal-600/30 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>💾 Simpan Tindak Lanjut</span>
                </button>
              </div>
            </form>
          ) : (
            /* Tab Histori */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                  <History className="w-4 h-4 text-teal-600" />
                  Kronologi Perubahan & Tindak Lanjut
                </h4>
                <span className="text-[11px] text-slate-500">
                  Total: {record.histori?.length || 0} Aktivitas
                </span>
              </div>

              {(!record.histori || record.histori.length === 0) ? (
                <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-500 font-medium">Belum ada riwayat aktivitas yang tercatat untuk satker ini.</p>
                </div>
              ) : (
                <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
                  {record.histori.map((hist, idx) => (
                    <div key={hist.id || idx} className="relative group">
                      <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-teal-500 border-2 border-white dark:border-slate-900 shadow-xs" />
                      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            {hist.jenis_perubahan}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(hist.tanggal).toLocaleString('id-ID')}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {hist.keterangan}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                          <span>Petugas: <strong>{hist.user_nama}</strong></span>
                          {hist.status_baru && (
                            <>
                              <span>&bull;</span>
                              <span>Status: <strong className="text-teal-600">{hist.status_baru}</strong></span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
