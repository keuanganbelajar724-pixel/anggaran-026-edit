import React, { useState } from 'react';
import { X, Send, Link2, FileText, AlertCircle, Building2, Calendar, Sparkles } from 'lucide-react';
import { DispensasiIKPARecord, JenisDispensasiIKPA, SatkerIKPA } from '../../types';

interface AjukanDispensasiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (record: Omit<DispensasiIKPARecord, 'id' | 'nomorTiket' | 'updatedAt'>) => void;
  satkers: SatkerIKPA[];
  currentSatkerKode?: string;
  isDark?: boolean;
}

export const AjukanDispensasiModal: React.FC<AjukanDispensasiModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  satkers,
  currentSatkerKode,
  isDark = false
}) => {
  const initialSatker = satkers.find(s => s.kodeSatker === currentSatkerKode) || satkers[0];

  const [selectedKodeSatker, setSelectedKodeSatker] = useState<string>(initialSatker?.kodeSatker || '');
  const [nomorSurat, setNomorSurat] = useState<string>('');
  const [tanggalSurat, setTanggalSurat] = useState<string>(new Date().toISOString().split('T')[0]);
  const [jenisDispensasi, setJenisDispensasi] = useState<JenisDispensasiIKPA>('DEVIASI_HAL3');
  const [alasanDispensasi, setAlasanDispensasi] = useState<string>('');
  const [linkDokumenCso, setLinkDokumenCso] = useState<string>('');
  const [linkDokumenPendukung, setLinkDokumenPendukung] = useState<string>('');

  if (!isOpen) return null;

  const currentSelectedSatker = satkers.find(s => s.kodeSatker === selectedKodeSatker);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKodeSatker) {
      alert('Pilih Satuan Kerja pemohon dispensasi');
      return;
    }
    if (!nomorSurat.trim()) {
      alert('Masukkan nomor surat permohonan satker');
      return;
    }
    if (!linkDokumenCso.trim()) {
      alert('Masukkan link dokumen surat pengajuan ke CSO KPPN (Google Drive / Tautan Berkas)');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];

    onSubmit({
      kodeSatker: selectedKodeSatker,
      namaSatker: currentSelectedSatker?.namaSatker || `SATKER ${selectedKodeSatker}`,
      kementerianLembaga: currentSelectedSatker?.kementerianLembaga || '-',
      nomorSurat: nomorSurat.trim(),
      tanggalSurat: tanggalSurat || todayStr,
      tanggalPengajuan: todayStr,
      jenisDispensasi,
      alasanDispensasi: alasanDispensasi.trim(),
      linkDokumenCso: linkDokumenCso.trim(),
      linkDokumenPendukung: linkDokumenPendukung.trim() || undefined,
      namaPemohon: '-',
      jabatanPemohon: '-',
      kontakPemohon: '-',
      emailPemohon: undefined,
      status: 'VERIFIKASI_KPPN',
      checklistTahapan: {
        csoDiterima: true,
        csoTanggal: `${todayStr} ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`,
        csoPetugas: 'Sistem CSO Online KPPN Semarang I'
      }
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-fadeIn">
      <div className={`relative w-full max-w-2xl rounded-2xl shadow-2xl border my-8 transition-colors ${
        isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${
          isDark ? 'border-slate-800 bg-slate-900/90' : 'border-slate-100 bg-slate-50'
        } rounded-t-2xl`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-md shadow-indigo-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Formulir Pengajuan Dispensasi IKPA</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Layanan CSO KPPN Semarang I • Penanganan Dispensasi IKPA Resmi (PER-5/PB/2024)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Petunjuk Banner */}
          <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
              <strong>Ketentuan Pengajuan:</strong> Dispensasi IKPA diajukan oleh Satker melalui CSO KPPN dengan melampirkan surat permohonan KPA dan dokumen pendukung (SPTJM/kronologis). Berkas akan diproses bertahap: <em>Verifikasi KPPN &rarr; Kanwil DJPb &rarr; Kantor Pusat DJPb</em>.
            </div>
          </div>

          {/* 1. Pilih Satuan Kerja */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-indigo-500" />
              Satuan Kerja Pemohon <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedKodeSatker}
              onChange={(e) => setSelectedKodeSatker(e.target.value)}
              required
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs border font-medium transition-colors ${
                isDark 
                  ? 'bg-slate-800 border-slate-700 text-slate-100 focus:border-indigo-500' 
                  : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-500 focus:bg-white'
              }`}
            >
              {satkers.map(s => (
                <option key={s.kodeSatker} value={s.kodeSatker}>
                  [{s.kodeSatker}] {s.namaSatker}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Jenis Dispensasi */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Jenis Dispensasi Indikator IKPA <span className="text-rose-500">*</span>
            </label>
            <select
              value={jenisDispensasi}
              onChange={(e) => setJenisDispensasi(e.target.value as JenisDispensasiIKPA)}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs border font-medium transition-colors ${
                isDark 
                  ? 'bg-slate-800 border-slate-700 text-slate-100 focus:border-indigo-500' 
                  : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-500 focus:bg-white'
              }`}
            >
              <option value="DEVIASI_HAL3">Dispensasi Deviasi Halaman III DIPA</option>
              <option value="DISPENSASI_SPM">Dispensasi Keterlambatan Pengajuan SPM (Akhir Tahun / TW IV)</option>
              <option value="KONTRAKTUAL">Dispensasi Pendaftaran Kontrak (Belanja Kontraktual)</option>
              <option value="CAPAIAN_OUTPUT">Dispensasi Konfirmasi / Pelaporan Capaian Output SAKTI</option>
              <option value="UP_TUP">Dispensasi Pengelolaan & Pertanggungjawaban UP / TUP</option>
              <option value="LAINNYA">Dispensasi Lainnya / Keadaan Kahar (Force Majeure)</option>
            </select>
          </div>

          {/* 3. Nomor & Tanggal Surat */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Nomor Surat Satker <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={nomorSurat}
                onChange={(e) => setNomorSurat(e.target.value)}
                placeholder="Contoh: S-145/KPA/IX/2026"
                required
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs border font-medium transition-colors ${
                  isDark 
                    ? 'bg-slate-800 border-slate-700 text-slate-100 focus:border-indigo-500' 
                    : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-500 focus:bg-white'
                }`}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Tanggal Surat <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={tanggalSurat}
                onChange={(e) => setTanggalSurat(e.target.value)}
                required
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs border font-medium transition-colors ${
                  isDark 
                    ? 'bg-slate-800 border-slate-700 text-slate-100 focus:border-indigo-500' 
                    : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-500 focus:bg-white'
                }`}
              />
            </div>
          </div>

          {/* 4. Link Dokumen yang Diajukan ke CSO KPPN */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-blue-500" />
                Link Dokumen Surat Permohonan (CSO KPPN) <span className="text-rose-500">*</span>
              </span>
              <span className="text-[11px] font-normal text-slate-500">Google Drive / OneDrive / Dropbox</span>
            </label>
            <input
              type="url"
              value={linkDokumenCso}
              onChange={(e) => setLinkDokumenCso(e.target.value)}
              placeholder="https://drive.google.com/file/d/... atau https://..."
              required
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs border font-medium transition-colors ${
                isDark 
                  ? 'bg-slate-800 border-slate-700 text-slate-100 focus:border-indigo-500' 
                  : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-500 focus:bg-white'
              }`}
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Pastikan akses link berkas disetel ke <em>"Siapa saja yang memiliki link dapat melihat"</em> agar tim CSO & verifikator KPPN dapat membaca dokumen secara langsung.
            </p>
          </div>

          {/* 5. Link Lampiran / Dokumen Pendukung */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-emerald-500" />
                Link Lampiran / Dokumen Pendukung (Opsional)
              </span>
              <span className="text-[11px] font-normal text-slate-500">SPTJM, screenshot kendala, bukti transfer, dll</span>
            </label>
            <input
              type="url"
              value={linkDokumenPendukung}
              onChange={(e) => setLinkDokumenPendukung(e.target.value)}
              placeholder="https://drive.google.com/... (jika ada lampiran terpisah)"
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs border font-medium transition-colors ${
                isDark 
                  ? 'bg-slate-800 border-slate-700 text-slate-100 focus:border-indigo-500' 
                  : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-500 focus:bg-white'
              }`}
            />
          </div>

          {/* 6. Uraian Alasan / Kendala */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Uraian Alasan & Kronologis Pengajuan Dispensasi <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={alasanDispensasi}
              onChange={(e) => setAlasanDispensasi(e.target.value)}
              rows={3}
              placeholder="Jelaskan alasan keterlambatan/kendala, penyebab terjadinya deviasi, serta upaya yang telah dilakukan..."
              required
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs border font-medium transition-colors ${
                isDark 
                  ? 'bg-slate-800 border-slate-700 text-slate-100 focus:border-indigo-500' 
                  : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-500 focus:bg-white'
              }`}
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.01]"
            >
              <Send className="w-4 h-4" />
              Kirim Pengajuan ke CSO KPPN
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
