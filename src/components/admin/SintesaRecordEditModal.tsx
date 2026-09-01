import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Building2, 
  Layers, 
  DollarSign, 
  Tag, 
  HelpCircle,
  FileSpreadsheet
} from 'lucide-react';
import { RealisasiBelanjaRecord } from '../../types';
import { formatRupiahFull } from '../../utils/realisasiBelanjaProcessor';

interface SintesaRecordEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: RealisasiBelanjaRecord) => void;
  initialRecord: RealisasiBelanjaRecord | null;
  defaultSatkerKode?: string;
  defaultSatkerUraian?: string;
  defaultKemKode?: string;
  defaultKemUraian?: string;
}

export const SintesaRecordEditModal: React.FC<SintesaRecordEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialRecord,
  defaultSatkerKode = '',
  defaultSatkerUraian = '',
  defaultKemKode = '',
  defaultKemUraian = ''
}) => {
  const [formData, setFormData] = useState<Partial<RealisasiBelanjaRecord>>({
    satkerKode: defaultSatkerKode,
    satkerUraian: defaultSatkerUraian,
    kementerianKode: defaultKemKode,
    kementerianUraian: defaultKemUraian,
    eselonIKode: '04',
    eselonIUraian: '',
    kewenanganKode: 'KD',
    kewenanganUraian: 'Kantor Daerah',
    fungsiKode: '',
    fungsiUraian: '',
    subfungsiKode: '',
    subfungsiUraian: '',
    programKode: '',
    programUraian: '',
    kegiatanKode: '',
    kegiatanUraian: '',
    outputKroKode: '',
    outputKroUraian: '',
    akunKode: '521111',
    akunUraian: 'Belanja Pengadaan Bahan',
    sumberdanaKode: '01',
    sumberdanaUraian: 'RM',
    paguDipa: 0,
    realisasi: 0,
    blokir: 0
  });

  useEffect(() => {
    if (initialRecord) {
      setFormData({ ...initialRecord });
    } else {
      setFormData({
        id: `sintesa_custom_${Date.now()}`,
        satkerKode: defaultSatkerKode || '000000',
        satkerUraian: defaultSatkerUraian || '',
        kementerianKode: defaultKemKode || '000',
        kementerianUraian: defaultKemUraian || '',
        eselonIKode: '04',
        eselonIUraian: '',
        kewenanganKode: 'KD',
        kewenanganUraian: 'Kantor Daerah',
        fungsiKode: '',
        fungsiUraian: '',
        subfungsiKode: '',
        subfungsiUraian: '',
        programKode: '',
        programUraian: '',
        kegiatanKode: '',
        kegiatanUraian: '',
        outputKroKode: '',
        outputKroUraian: '',
        akunKode: '521111',
        akunUraian: 'Belanja Pengadaan Bahan',
        sumberdanaKode: '01',
        sumberdanaUraian: 'RM',
        paguDipa: 0,
        realisasi: 0,
        blokir: 0
      });
    }
  }, [initialRecord, defaultSatkerKode, defaultSatkerUraian, defaultKemKode, defaultKemUraian, isOpen]);

  if (!isOpen) return null;

  const pagu = Number(formData.paguDipa) || 0;
  const real = Number(formData.realisasi) || 0;
  const sisa = Math.max(0, pagu - real);
  const persen = pagu > 0 ? (real / pagu) * 100 : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.satkerUraian || !formData.satkerKode) {
      alert('Mohon lengkapi Kode dan Nama Satker.');
      return;
    }

    const recordToSave: RealisasiBelanjaRecord = {
      id: formData.id || `sintesa_custom_${Date.now()}`,
      satkerKode: formData.satkerKode || '000000',
      satkerUraian: formData.satkerUraian || 'Satuan Kerja',
      kementerianKode: formData.kementerianKode || '000',
      kementerianUraian: formData.kementerianUraian || 'Kementerian / Lembaga',
      eselonIKode: formData.eselonIKode || '',
      eselonIUraian: formData.eselonIUraian || '',
      kewenanganKode: formData.kewenanganKode || 'KD',
      kewenanganUraian: formData.kewenanganUraian || 'Kantor Daerah',
      fungsiKode: formData.fungsiKode || '',
      fungsiUraian: formData.fungsiUraian || '',
      subfungsiKode: formData.subfungsiKode || '',
      subfungsiUraian: formData.subfungsiUraian || '',
      programKode: formData.programKode || '',
      programUraian: formData.programUraian || '',
      kegiatanKode: formData.kegiatanKode || '',
      kegiatanUraian: formData.kegiatanUraian || '',
      outputKroKode: formData.outputKroKode || '',
      outputKroUraian: formData.outputKroUraian || '',
      akunKode: formData.akunKode || '521111',
      akunUraian: formData.akunUraian || 'Belanja Negara',
      jenisBelanjaKode: (formData.akunKode || '').substring(0, 2) || '52',
      jenisBelanjaUraian: formData.jenisBelanjaUraian || 'Belanja Negara',
      sumberdanaKode: formData.sumberdanaKode || '01',
      sumberdanaUraian: formData.sumberdanaUraian || 'RM',
      paguDipa: pagu,
      realisasi: real,
      blokir: Number(formData.blokir) || 0,
      sisaPagu: sisa,
      persenRealisasi: persen
    };

    onSave(recordToSave);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                {initialRecord ? 'Edit / Sesuaikan Baris Data SINTESA' : 'Tambah Baris Data Realisasi SINTESA'}
              </h3>
              <p className="text-xs text-slate-300">
                Lengkapi seluruh dimensi SINTESA (Kolom B s.d. AQ) untuk pembaruan akurat.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm font-bold cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section 1: Satker & K/L */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              <span>1. Satuan Kerja &amp; Kementerian / Lembaga</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Kode Satker (Kolom O) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.satkerKode || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, satkerKode: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-mono"
                  placeholder="e.g. 527189"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Nama Satuan Kerja (Kolom P) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.satkerUraian || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, satkerUraian: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. PELAKSANAAN PRASARANA STRATEGIS JAWA TENGAH"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Kode K/L (Kolom B Kode)
                </label>
                <input
                  type="text"
                  value={formData.kementerianKode || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, kementerianKode: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  placeholder="e.g. 033"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Uraian K/L (Kolom B Uraian)
                </label>
                <input
                  type="text"
                  value={formData.kementerianUraian || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, kementerianUraian: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  placeholder="e.g. KEMENTERIAN PEKERJAAN UMUM"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Eselon I, Kewenangan & Fungsi */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>2. Eselon I, Kewenangan &amp; Fungsi</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Kode Eselon I (Kolom C) &amp; Uraian (Kolom D)
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <input
                    type="text"
                    value={formData.eselonIKode || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, eselonIKode: e.target.value }))}
                    className="px-2 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    placeholder="Kode C"
                  />
                  <input
                    type="text"
                    value={formData.eselonIUraian || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, eselonIUraian: e.target.value }))}
                    className="col-span-2 px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    placeholder="Uraian Eselon I (D)"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Kode Kewenangan (Kolom E) &amp; Uraian (Kolom F)
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <input
                    type="text"
                    value={formData.kewenanganKode || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, kewenanganKode: e.target.value }))}
                    className="px-2 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    placeholder="Kode E"
                  />
                  <input
                    type="text"
                    value={formData.kewenanganUraian || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, kewenanganUraian: e.target.value }))}
                    className="col-span-2 px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    placeholder="e.g. Kantor Daerah / Pusat"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Kode Fungsi (Kolom Q) &amp; Uraian Fungsi (Kolom R)
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <input
                    type="text"
                    value={formData.fungsiKode || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, fungsiKode: e.target.value }))}
                    className="px-2 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    placeholder="Kode Q"
                  />
                  <input
                    type="text"
                    value={formData.fungsiUraian || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, fungsiUraian: e.target.value }))}
                    className="col-span-2 px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    placeholder="Uraian Fungsi (R)"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Kode Subfungsi (Kolom S) &amp; Uraian Subfungsi (Kolom T)
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <input
                    type="text"
                    value={formData.subfungsiKode || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, subfungsiKode: e.target.value }))}
                    className="px-2 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    placeholder="Kode S"
                  />
                  <input
                    type="text"
                    value={formData.subfungsiUraian || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, subfungsiUraian: e.target.value }))}
                    className="col-span-2 px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    placeholder="Uraian Subfungsi (T)"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Program, Kegiatan & KRO */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              <span>3. Program (V), Kegiatan (X), dan Output KRO (Z)</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1 sm:col-span-3">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Kode &amp; Uraian Program (Kolom U &amp; V)
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  <input
                    type="text"
                    value={formData.programKode || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, programKode: e.target.value }))}
                    className="px-2 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    placeholder="Kode U"
                  />
                  <input
                    type="text"
                    value={formData.programUraian || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, programUraian: e.target.value }))}
                    className="col-span-3 px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    placeholder="Uraian Program (Kolom V)"
                  />
                </div>
              </div>

              <div className="space-y-1 sm:col-span-3">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Kode &amp; Uraian Kegiatan (Kolom W &amp; X)
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  <input
                    type="text"
                    value={formData.kegiatanKode || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, kegiatanKode: e.target.value }))}
                    className="px-2 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    placeholder="Kode W"
                  />
                  <input
                    type="text"
                    value={formData.kegiatanUraian || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, kegiatanUraian: e.target.value }))}
                    className="col-span-3 px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    placeholder="Uraian Kegiatan (Kolom X)"
                  />
                </div>
              </div>

              <div className="space-y-1 sm:col-span-3">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Kode &amp; Uraian Output KRO (Kolom Y &amp; Z)
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  <input
                    type="text"
                    value={formData.outputKroKode || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, outputKroKode: e.target.value }))}
                    className="px-2 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    placeholder="Kode KRO (Y)"
                  />
                  <input
                    type="text"
                    value={formData.outputKroUraian || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, outputKroUraian: e.target.value }))}
                    className="col-span-3 px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    placeholder="Uraian Output KRO (Kolom Z)"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Akun & Sumber Dana */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5" />
              <span>4. Akun 6-Digit (AA &amp; AB) &amp; Sumber Dana (AC &amp; AD)</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Kode Akun 6-Digit (Kolom AA) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.akunKode || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, akunKode: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  placeholder="e.g. 521111 / 532111"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Uraian Akun Lengkap (Kolom AB) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.akunUraian || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, akunUraian: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  placeholder="e.g. Belanja Pengadaan Bahan"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Kode Sumber Dana
                </label>
                <input
                  type="text"
                  value={formData.sumberdanaKode || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, sumberdanaKode: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  placeholder="e.g. 01 / 19 / 06"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Uraian Sumber Dana
                </label>
                <input
                  type="text"
                  value={formData.sumberdanaUraian || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, sumberdanaUraian: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  placeholder="e.g. Rupiah Murni (RM) / SBSN / PNBP"
                />
              </div>
            </div>

            {/* Quick Presets for Sumber Dana */}
            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                Pilihan Cepat Standar Sumber Dana:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { kode: '01', uraian: 'Rupiah Murni (RM)', label: '🏛️ Rupiah Murni (01)' },
                  { kode: '19', uraian: 'SBSN Pembiayaan Proyek', label: '🕌 SBSN Proyek (19)' },
                  { kode: '10', uraian: 'SBSN Project Based Sukuk (PBS)', label: '🕌 SBSN PBS (10)' },
                  { kode: '06', uraian: 'Penerimaan Negara Bukan Pajak (PNBP)', label: '📊 PNBP (06)' },
                  { kode: '07', uraian: 'Badan Layanan Umum (BLU)', label: '🏥 BLU (07)' },
                  { kode: '03', uraian: 'Pinjaman Luar Negeri (PLN)', label: '🌍 PLN (03)' },
                  { kode: '02', uraian: 'Rupiah Murni Pendamping (RMP)', label: '🏛️ RMP (02)' },
                ].map(preset => (
                  <button
                    key={preset.kode}
                    type="button"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      sumberdanaKode: preset.kode,
                      sumberdanaUraian: preset.uraian
                    }))}
                    className="px-2 py-1 rounded text-[11px] font-medium bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 dark:bg-slate-700 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 transition-colors cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 5: Pagu & Realisasi */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5" />
              <span>5. Angka Pagu DIPA (AP) &amp; Realisasi (AQ)</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Pagu DIPA (Kolom AP) (Rp) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.paguDipa ?? 0}
                  onChange={(e) => setFormData(prev => ({ ...prev, paguDipa: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                />
                <span className="text-[10px] text-slate-500 font-mono">
                  {formatRupiahFull(pagu)}
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  Realisasi Belanja (Kolom AQ) (Rp) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.realisasi ?? 0}
                  onChange={(e) => setFormData(prev => ({ ...prev, realisasi: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 font-mono font-bold"
                />
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                  {formatRupiahFull(real)}
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Kalkulasi Sisa Pagu &amp; Capaian
                </label>
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Sisa Pagu:</span>
                    <span className="font-mono font-bold text-amber-600">{formatRupiahFull(sisa)}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-slate-500">Capaian:</span>
                    <span className="font-black text-blue-600 dark:text-blue-400">{persen.toFixed(2)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Baris Data SINTESA</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
