import React, { useState } from 'react';
import { 
  X, 
  Send, 
  Link2, 
  FileText, 
  AlertCircle, 
  Building2, 
  Calendar, 
  Sparkles, 
  BookOpen, 
  Check, 
  Info,
  HelpCircle
} from 'lucide-react';
import { DispensasiIKPARecord, JenisDispensasiIKPA, SatkerIKPA } from '../../types';
import { 
  KRITERIA_DISPENSASI_ND1423, 
  getIndikatorDispensasiConfig, 
  CATATAN_KAKI_ND1423,
  KriteriaDispensasiItem 
} from '../../data/kriteriaDispensasiData';
import { KriteriaND1423Modal } from './KriteriaND1423Modal';

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
  const [jenisDispensasi, setJenisDispensasi] = useState<JenisDispensasiIKPA>('PENYERAPAN_ANGGARAN');
  const [selectedKriteriaKode, setSelectedKriteriaKode] = useState<string>('3.a');
  const [alasanDispensasi, setAlasanDispensasi] = useState<string>(
    'Perubahan alokasi anggaran karena adanya penambahan anggaran yang bersumber dari kebijakan pemerintah di bidang penganggaran dan pelaksanaan anggaran.'
  );
  const [linkDokumenCso, setLinkDokumenCso] = useState<string>('');
  const [linkDokumenPendukung, setLinkDokumenPendukung] = useState<string>('');
  const [isPedomanModalOpen, setIsPedomanModalOpen] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentSelectedSatker = satkers.find(s => s.kodeSatker === selectedKodeSatker);
  const currentIndikatorConfig = getIndikatorDispensasiConfig(jenisDispensasi);

  const handlePilihJenis = (newJenis: JenisDispensasiIKPA) => {
    setJenisDispensasi(newJenis);
    const cfg = getIndikatorDispensasiConfig(newJenis);
    if (cfg.kriteria.length > 0) {
      setSelectedKriteriaKode(cfg.kriteria[0].id);
      setAlasanDispensasi(cfg.kriteria[0].teks);
    } else {
      setSelectedKriteriaKode('');
      setAlasanDispensasi('');
    }
  };

  const handlePilihKriteriaItem = (item: KriteriaDispensasiItem) => {
    setSelectedKriteriaKode(item.id);
    setAlasanDispensasi(item.teks);
  };

  const selectedKriteriaDetail = currentIndikatorConfig.kriteria.find(k => k.id === selectedKriteriaKode);

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
    if (!alasanDispensasi.trim()) {
      alert('Pilih atau isi alasan pengajuan dispensasi/penyesuaian');
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
      kriteriaKode: selectedKriteriaKode || undefined,
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
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-fadeIn">
        <div className={`relative w-full max-w-2xl rounded-3xl shadow-2xl border my-6 transition-colors overflow-hidden ${
          isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          {/* Header */}
          <div className={`flex items-center justify-between px-6 py-4 border-b ${
            isDark ? 'border-slate-800 bg-slate-950/80' : 'border-slate-100 bg-gradient-to-r from-emerald-50 via-sky-50 to-indigo-50'
          }`}>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-indigo-600 text-white shadow-md shadow-emerald-500/20">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                    ND-1423/PB.2/2026
                  </span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    CSO KPPN Semarang I
                  </span>
                </div>
                <h3 className="font-extrabold text-base leading-tight mt-0.5 text-slate-900 dark:text-white">
                  Formulir Pengajuan Penyesuaian &amp; Dispensasi IKPA
                </h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-2xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[78vh] overflow-y-auto">
            {/* Regulatory Basis Banner with Open Reference Button */}
            <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
                  <strong>Pedomani ND-1423/PB.2/2026:</strong> Permohonan penyesuaian/dispensasi diajukan secara selektif sesuai kriteria resmi untuk 8 indikator IKPA.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPedomanModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs shrink-0 cursor-pointer transition-all active:scale-95 self-start sm:self-auto"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Lihat Tabel Kriteria</span>
              </button>
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

            {/* 2. Jenis Dispensasi / Indikator IKPA */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Indikator IKPA yang Diajukan Penyesuaian <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  8 Indikator ND-1423/PB.2/2026
                </span>
              </div>
              <select
                value={jenisDispensasi}
                onChange={(e) => handlePilihJenis(e.target.value as JenisDispensasiIKPA)}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs border font-bold transition-colors ${
                  isDark 
                    ? 'bg-slate-800 border-slate-700 text-slate-100 focus:border-indigo-500' 
                    : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-500 focus:bg-white'
                }`}
              >
                <option value="PENYERAPAN_ANGGARAN">
                  ⭐ 3. Penyerapan Anggaran (Kriteria ND-1423/PB.2/2026)
                </option>
                <option value="REVISI_DIPA">
                  1. Revisi DIPA (Kriteria ND-1423/PB.2/2026)
                </option>
                <option value="DEVIASI_HAL3">
                  2. Deviasi Halaman III DIPA (Kriteria ND-1423/PB.2/2026)
                </option>
                <option value="KONTRAKTUAL">
                  4. Belanja Kontraktual (Kriteria ND-1423/PB.2/2026)
                </option>
                <option value="PENYELESAIAN_TAGIHAN">
                  5. Penyelesaian Tagihan (Kriteria ND-1423/PB.2/2026)
                </option>
                <option value="UP_TUP">
                  6. Pengelolaan UP / TUP (Kriteria ND-1423/PB.2/2026)
                </option>
                <option value="DISPENSASI_SPM">
                  7. Dispensasi SPM Terlambat (Akhir Tahun)
                </option>
                <option value="CAPAIAN_OUTPUT">
                  8. Capaian Output (Kriteria ND-1423/PB.2/2026)
                </option>
                <option value="LAINNYA">
                  9. Lainnya / Keadaan Kahar (Force Majeure)
                </option>
              </select>
            </div>

            {/* 3. Pilihan Kriteria Resmi ND-1423/PB.2/2026 */}
            {currentIndikatorConfig.kriteria.length > 0 && (
              <div className={`p-3.5 rounded-2xl border transition-colors ${
                isDark ? 'bg-slate-800/60 border-slate-700/80' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 dark:text-slate-200">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">
                      {currentIndikatorConfig.nomor}
                    </span>
                    <span>Pilihan Kriteria Resmi {currentIndikatorConfig.nama} (ND-1423):</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Klik untuk memilih</span>
                </div>

                <div className="space-y-2">
                  {currentIndikatorConfig.kriteria.map(item => {
                    const isSelected = selectedKriteriaKode === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => handlePilihKriteriaItem(item)}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-2.5 ${
                          isSelected
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/20 text-slate-900 dark:text-white'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                          isSelected
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                        }`}>
                          {item.kode}
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className={`font-semibold leading-relaxed ${isSelected ? 'font-bold' : ''}`}>
                            {item.teks}
                          </p>
                          {item.memerlukanSuratMenteri && (
                            <span className="inline-block text-[10px] px-2 py-0.5 rounded font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300">
                              *) Perlu Surat/Keputusan Kepala Badan/Menteri
                            </span>
                          )}
                          {item.memerlukanDipaIVB && (
                            <span className="inline-block text-[10px] px-2 py-0.5 rounded font-bold bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-300 border border-sky-300">
                              **) Perlu Catatan DIPA Halaman IVB
                            </span>
                          )}
                        </div>
                        {isSelected && (
                          <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Syarat Dokumen Pendukung Banner */}
                {selectedKriteriaDetail?.memerlukanSuratMenteri && (
                  <div className="mt-3 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 flex items-start gap-2 text-xs text-amber-900 dark:text-amber-200">
                    <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Perhatian Dokumen Pendukung (*):</strong> {CATATAN_KAKI_ND1423.kebijakanKL} Pastikan dilampirkan pada isian link dokumen pendukung di bawah.
                    </div>
                  </div>
                )}

                {selectedKriteriaDetail?.memerlukanDipaIVB && (
                  <div className="mt-3 p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-300 dark:border-sky-700/60 flex items-start gap-2 text-xs text-sky-900 dark:text-sky-200">
                    <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Perhatian BA BUN (**):</strong> {CATATAN_KAKI_ND1423.anggaranBUN}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 4. Nomor & Tanggal Surat */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nomor Surat Satker <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={nomorSurat}
                  onChange={(e) => setNomorSurat(e.target.value)}
                  placeholder="Contoh: S-145/KPA/X/2026"
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

            {/* 5. Link Dokumen yang Diajukan ke CSO KPPN */}
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
                Pastikan akses link berkas disetel ke <em>&quot;Siapa saja yang memiliki link dapat melihat&quot;</em>.
              </p>
            </div>

            {/* 6. Link Lampiran / Dokumen Pendukung */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-emerald-500" />
                  Link Lampiran / Dokumen Pendukung (Opsional / Jika ada catatan khusus)
                </span>
                <span className="text-[11px] font-normal text-slate-500">SK Menteri, DIPA IVB, SPTJM</span>
              </label>
              <input
                type="url"
                value={linkDokumenPendukung}
                onChange={(e) => setLinkDokumenPendukung(e.target.value)}
                placeholder="https://drive.google.com/... (Surat Menteri / DIPA IVB / SPTJM)"
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs border font-medium transition-colors ${
                  isDark 
                    ? 'bg-slate-800 border-slate-700 text-slate-100 focus:border-indigo-500' 
                    : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-500 focus:bg-white'
                }`}
              />
            </div>

            {/* 7. Uraian Alasan / Kronologis Lengkap */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Uraian Alasan &amp; Kronologis Penyesuaian IKPA <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-slate-400">
                  Dapat disesuaikan atau ditambah rincian spesifik satker
                </span>
              </div>
              <textarea
                value={alasanDispensasi}
                onChange={(e) => setAlasanDispensasi(e.target.value)}
                rows={3}
                placeholder="Pilih dari kriteria di atas atau ketik kronologis permohonan penyesuaian..."
                required
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs border font-medium transition-colors leading-relaxed ${
                  isDark 
                    ? 'bg-slate-800 border-slate-700 text-slate-100 focus:border-indigo-500' 
                    : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-500 focus:bg-white'
                }`}
              />
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={() => setIsPedomanModalOpen(true)}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <BookOpen className="w-3.5 h-3.5" />
                Matriks Kriteria ND-1423
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-700 hover:to-indigo-700 text-white shadow-md shadow-emerald-600/30 transition-all hover:scale-[1.01] cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  Kirim Pengajuan ke CSO KPPN
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Modal Matriks Kriteria ND-1423 */}
      <KriteriaND1423Modal
        isOpen={isPedomanModalOpen}
        onClose={() => setIsPedomanModalOpen(false)}
        onSelectKriteria={(jenis, kriteriaId, kriteriaTeks) => {
          setJenisDispensasi(jenis);
          setSelectedKriteriaKode(kriteriaId);
          setAlasanDispensasi(kriteriaTeks);
        }}
        isDark={isDark}
      />
    </>
  );
};
