import React, { useState } from 'react';
import { X, Save, MessageSquare, Building2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { DispensasiIKPARecord, DispensasiIKPAStatus } from '../../types';
import { getLabelJenisDispensasi, getLabelStatusDispensasi } from '../../utils/dispensasiExportHelper';

interface UpdateStatusDispensasiModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: DispensasiIKPARecord | null;
  onUpdate: (updated: DispensasiIKPARecord) => void;
  isDark?: boolean;
}

export const UpdateStatusDispensasiModal: React.FC<UpdateStatusDispensasiModalProps> = ({
  isOpen,
  onClose,
  record,
  onUpdate,
  isDark = false
}) => {
  if (!isOpen || !record) return null;

  const [status, setStatus] = useState<DispensasiIKPAStatus>(record.status);
  const [catatanAdmin, setCatatanAdmin] = useState<string>(record.catatanAdmin || '');
  const [nomorSuratHasil, setNomorSuratHasil] = useState<string>(record.nomorSuratHasil || '');

  // 4 Stages:
  // 1. Diterima KPPN -> 2. Posisi Kanwil -> 3. Posisi Kanpus -> 4. Putusan Akhir (Kantor Pusat)
  const [stage1Kppn, setStage1Kppn] = useState<boolean>(record.checklistTahapan?.csoDiterima ?? true);
  const [stage2Kanwil, setStage2Kanwil] = useState<boolean>(
    record.checklistTahapan?.kanwilVerifikasi ?? (record.status === 'VERIFIKASI_KANWIL' || record.status === 'DIAJUKAN_PUSAT' || record.status === 'DISETUJUI' || record.status === 'DITOLAK')
  );
  const [stage3Kanpus, setStage3Kanpus] = useState<boolean>(
    record.checklistTahapan?.pusatDiajukan ?? (record.status === 'DIAJUKAN_PUSAT' || record.status === 'DISETUJUI' || record.status === 'DITOLAK')
  );
  const [stage4Keputusan, setStage4Keputusan] = useState<boolean>(
    record.checklistTahapan?.keputusanFinal ?? (record.status === 'DISETUJUI' || record.status === 'DITOLAK')
  );

  const handleStatusChange = (newStatus: DispensasiIKPAStatus) => {
    setStatus(newStatus);
    
    if (newStatus === 'VERIFIKASI_KPPN' || newStatus === 'DIAJUKAN_CSO') {
      setStage1Kppn(true);
      setStage2Kanwil(false);
      setStage3Kanpus(false);
      setStage4Keputusan(false);
    } else if (newStatus === 'VERIFIKASI_KANWIL') {
      setStage1Kppn(true);
      setStage2Kanwil(true);
      setStage3Kanpus(false);
      setStage4Keputusan(false);
    } else if (newStatus === 'DIAJUKAN_PUSAT') {
      setStage1Kppn(true);
      setStage2Kanwil(true);
      setStage3Kanpus(true);
      setStage4Keputusan(false);
    } else if (newStatus === 'DISETUJUI' || newStatus === 'DITOLAK') {
      setStage1Kppn(true);
      setStage2Kanwil(true);
      setStage3Kanpus(true);
      setStage4Keputusan(true);
    }
  };

  const handleSave = () => {
    const nowFormatted = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';

    const updatedTahapan = {
      csoDiterima: stage1Kppn,
      csoTanggal: record.checklistTahapan?.csoTanggal || nowFormatted,
      kppnVerifikasi: stage1Kppn,
      kanwilVerifikasi: stage2Kanwil,
      kanwilTanggal: stage2Kanwil ? (record.checklistTahapan?.kanwilTanggal || nowFormatted) : undefined,
      pusatDiajukan: stage3Kanpus,
      pusatTanggal: stage3Kanpus ? (record.checklistTahapan?.pusatTanggal || nowFormatted) : undefined,
      keputusanFinal: stage4Keputusan,
      keputusanTanggal: stage4Keputusan ? (record.checklistTahapan?.keputusanTanggal || nowFormatted) : undefined
    };

    onUpdate({
      ...record,
      status,
      checklistTahapan: updatedTahapan,
      catatanAdmin: catatanAdmin.trim() || undefined,
      nomorSuratHasil: nomorSuratHasil.trim() || undefined,
      updatedAt: new Date().toISOString(),
      updatedBy: 'Admin KPPN'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
      <div className={`w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                {record.nomorTiket}
              </span>
              <span className="text-xs text-slate-500 font-semibold">
                Update Status Posisi Pengajuan
              </span>
            </div>
            <h3 className="text-base font-black text-slate-900 dark:text-white mt-1">
              {record.namaSatker} ({record.kodeSatker})
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Info Summary */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs">
            <div>
              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
                {getLabelJenisDispensasi(record.jenisDispensasi)}
              </span>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Surat: <strong>{record.nomorSurat}</strong> ({record.tanggalSurat})
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-slate-400">Status Saat Ini:</div>
              <div className="font-extrabold text-indigo-600 dark:text-indigo-400">
                {getLabelStatusDispensasi(record.status)}
              </div>
            </div>
          </div>

          {/* 1. Pilih Status Posisi Pengajuan */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Pilih Status Posisi Pengajuan:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleStatusChange('VERIFIKASI_KPPN')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  status === 'VERIFIKASI_KPPN' || status === 'DIAJUKAN_CSO'
                    ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200 font-bold ring-2 ring-sky-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-sky-600" />
                  <span className="text-xs font-bold">1. Diterima KPPN</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5 pl-6">
                  Berkas diterima KPPN dan akan diteruskan ke Kanwil.
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleStatusChange('VERIFIKASI_KANWIL')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  status === 'VERIFIKASI_KANWIL'
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 font-bold ring-2 ring-purple-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-bold">2. Posisi Kanwil</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5 pl-6">
                  Kanwil DJPb Jawa Tengah meneruskan rekomendasi.
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleStatusChange('DIAJUKAN_PUSAT')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  status === 'DIAJUKAN_PUSAT'
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-bold ring-2 ring-amber-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-bold">3. Posisi Kanpus (Kantor Pusat)</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5 pl-6">
                  Sedang dalam verifikasi Kantor Pusat DJPb.
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleStatusChange('DISETUJUI')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  status === 'DISETUJUI'
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-bold ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold">4. Disetujui</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5 pl-6">
                  Disetujui oleh Kantor Pusat DJPb.
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleStatusChange('DITOLAK')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  status === 'DITOLAK'
                    ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 font-bold ring-2 ring-rose-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span className="text-xs font-bold">4. Ditolak</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5 pl-6">
                  Ditolak oleh Kantor Pusat DJPb.
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleStatusChange('PERBAIKAN_DOKUMEN')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  status === 'PERBAIKAN_DOKUMEN'
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/40 text-orange-900 dark:text-orange-200 font-bold ring-2 ring-orange-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-600" />
                  <span className="text-xs font-bold">Perbaikan Dokumen</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5 pl-6">
                  Perlu kelengkapan data tambahan dari Satker.
                </div>
              </button>
            </div>
          </div>

          {/* 2. Checklist 4 Tahapan */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Checklist 4 Tahapan Posisi:
            </label>
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2.5">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={stage1Kppn}
                  onChange={(e) => setStage1Kppn(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Tahap 1: Diterima KPPN Semarang I (Meneruskan Berkas)
                </span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={stage2Kanwil}
                  onChange={(e) => setStage2Kanwil(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Tahap 2: Posisi Kanwil DJPb Prov. Jawa Tengah (Meneruskan Rekomendasi)
                </span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={stage3Kanpus}
                  onChange={(e) => setStage3Kanpus(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Tahap 3: Posisi Kantor Pusat DJPb (Verifikasi Teknis &amp; Substantif)
                </span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={stage4Keputusan}
                  onChange={(e) => setStage4Keputusan(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Tahap 4: Keputusan Selesai (Disetujui / Ditolak oleh Kantor Pusat DJPb)
                </span>
              </label>
            </div>
          </div>

          {/* 3. Catatan / Arahan dari KPPN */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
              Catatan / Posisi Keterangan untuk Satker
            </label>
            <textarea
              value={catatanAdmin}
              onChange={(e) => setCatatanAdmin(e.target.value)}
              rows={2}
              placeholder="Contoh: Berkas telah diteruskan ke Kanwil DJPb melalui Nota Dinas No. ND-..."
              className="w-full px-3.5 py-2.5 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Simpan Perubahan
          </button>
        </div>
      </div>
    </div>
  );
};
