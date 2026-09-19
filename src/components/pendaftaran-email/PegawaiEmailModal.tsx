import React, { useState, useEffect } from 'react';
import { X, UserPlus, AlertTriangle, CheckCircle2, User, CreditCard, Shield, Hash } from 'lucide-react';
import { PegawaiEmailRecord, EMPLOYEE_STATUS_LIST, EmployeeStatusCode } from '../../types';

interface PegawaiEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (pegawai: PegawaiEmailRecord) => void;
  editingPegawai?: PegawaiEmailRecord | null;
  existingPegawaiList: PegawaiEmailRecord[];
  kodeKppn: string;
  kodeSatker: string;
}

export const PegawaiEmailModal: React.FC<PegawaiEmailModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingPegawai,
  existingPegawaiList,
  kodeKppn,
  kodeSatker
}) => {
  const [namaPegawai, setNamaPegawai] = useState('');
  const [nipNrp, setNipNrp] = useState('');
  const [nik, setNik] = useState('');
  const [status, setStatus] = useState<EmployeeStatusCode>(3); // Default 3 = PNS
  const [catatan, setCatatan] = useState('');

  // Duplicate warning modal state
  const [duplicateWarning, setDuplicateWarning] = useState<{
    field: 'NIP' | 'NIK';
    value: string;
    existingName: string;
  } | null>(null);

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingPegawai) {
      setNamaPegawai(editingPegawai.namaPegawai || '');
      setNipNrp(editingPegawai.nipNrp || '');
      setNik(editingPegawai.nik || '');
      setStatus(editingPegawai.status || 3);
      setCatatan(editingPegawai.catatan || '');
    } else {
      setNamaPegawai('');
      setNipNrp('');
      setNik('');
      setStatus(3);
      setCatatan('');
    }
    setDuplicateWarning(null);
    setFormErrors({});
  }, [editingPegawai, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    const cleanNama = namaPegawai.trim();
    const cleanNip = nipNrp.trim().replace(/\s+/g, '');
    const cleanNik = nik.trim().replace(/\D/g, '');

    if (!cleanNama) errors.namaPegawai = 'Nama Pegawai wajib diisi';
    if (!cleanNip) errors.nipNrp = 'NIP / NRP wajib diisi';
    if (!cleanNik) errors.nik = 'NIK wajib diisi';
    else if (cleanNik.length !== 16) errors.nik = 'NIK harus tepat 16 digit angka';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    // Duplicate Check: Check other records excluding the one being edited
    const otherRecords = existingPegawaiList.filter(p => !editingPegawai || p.id !== editingPegawai.id);
    
    // Check NIP duplicate
    const dupNip = otherRecords.find(p => (p.nipNrp || '').trim().replace(/\s+/g, '') === cleanNip);
    if (dupNip) {
      setDuplicateWarning({
        field: 'NIP',
        value: cleanNip,
        existingName: dupNip.namaPegawai
      });
      return;
    }

    // Check NIK duplicate
    const dupNik = otherRecords.find(p => (p.nik || '').trim().replace(/\D/g, '') === cleanNik);
    if (dupNik) {
      setDuplicateWarning({
        field: 'NIK',
        value: cleanNik,
        existingName: dupNik.namaPegawai
      });
      return;
    }

    // Proceed to save
    const record: PegawaiEmailRecord = {
      id: editingPegawai?.id || `email-peg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      kodeKppn: kodeKppn || '136',
      kodeSatker: kodeSatker,
      namaPegawai: cleanNama,
      nipNrp: cleanNip,
      nik: cleanNik,
      status: Number(status) as EmployeeStatusCode,
      catatan: catatan.trim() || undefined
    };

    onSave(record);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      {/* Duplicate Alert Modal */}
      {duplicateWarning && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border-2 border-amber-500 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                ⚠ DATA DUPLIKAT
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Pegawai dengan {duplicateWarning.field} <span className="font-mono font-bold text-amber-600 dark:text-amber-400">"{duplicateWarning.value}"</span> sudah terdapat dalam daftar atas nama:
              </p>
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800/60 text-xs font-bold text-slate-800 dark:text-amber-200">
                👤 {duplicateWarning.existingName}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDuplicateWarning(null)}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                Periksa Data
              </button>
              <button
                type="button"
                onClick={() => {
                  setDuplicateWarning(null);
                  onClose();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-rose-600/20"
              >
                Batalkan
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-black">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                {editingPegawai ? 'Ubah Data Pegawai' : 'Tambah Pegawai Pendaftaran Email'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Format resmi pendaftaran akun email kedinasan Satker {kodeSatker}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 dark:text-slate-400 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Satker Metadata Badges (READONLY) */}
        <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Kode KPPN (Readonly)
            </span>
            <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1 mt-0.5">
              🔒 {kodeKppn || '136'} (Semarang I)
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Kode Satker (Readonly)
            </span>
            <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1 mt-0.5">
              🔒 {kodeSatker}
            </span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nama Pegawai */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-teal-500" />
              <span>Nama Pegawai Lengkap *</span>
            </label>
            <input
              type="text"
              value={namaPegawai}
              onChange={(e) => {
                setNamaPegawai(e.target.value);
                if (formErrors.namaPegawai) setFormErrors(prev => ({ ...prev, namaPegawai: '' }));
              }}
              placeholder="Contoh: Ahmad Fauzan, S.E."
              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-medium focus:ring-2 transition-all outline-none ${
                formErrors.namaPegawai
                  ? 'border-rose-400 bg-rose-50/50 dark:bg-rose-950/20 text-rose-900 dark:text-rose-100 focus:ring-rose-400'
                  : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-teal-500/20 focus:border-teal-500'
              }`}
              autoFocus
            />
            {formErrors.namaPegawai && (
              <p className="text-[11px] text-rose-500 font-semibold">{formErrors.namaPegawai}</p>
            )}
          </div>

          {/* NIP / NRP & NIK Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* NIP / NRP */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-teal-500" />
                <span>NIP / NRP * (Format Teks)</span>
              </label>
              <input
                type="text"
                value={nipNrp}
                onChange={(e) => {
                  setNipNrp(e.target.value);
                  if (formErrors.nipNrp) setFormErrors(prev => ({ ...prev, nipNrp: '' }));
                }}
                placeholder="198501012010121001 atau NRP"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono font-medium focus:ring-2 transition-all outline-none ${
                  formErrors.nipNrp
                    ? 'border-rose-400 bg-rose-50/50 dark:bg-rose-950/20 text-rose-900 dark:text-rose-100 focus:ring-rose-400'
                    : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-teal-500/20 focus:border-teal-500'
                }`}
              />
              {formErrors.nipNrp ? (
                <p className="text-[11px] text-rose-500 font-semibold">{formErrors.nipNrp}</p>
              ) : (
                <p className="text-[10px] text-slate-400">Tersimpan sebagai teks, anti-scientific notation.</p>
              )}
            </div>

            {/* NIK */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-teal-500" />
                <span>NIK * (16 Digit)</span>
              </label>
              <input
                type="text"
                maxLength={16}
                value={nik}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/\D/g, '');
                  setNik(cleaned);
                  if (formErrors.nik) setFormErrors(prev => ({ ...prev, nik: '' }));
                }}
                placeholder="3374010101850001"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono font-medium focus:ring-2 transition-all outline-none ${
                  formErrors.nik
                    ? 'border-rose-400 bg-rose-50/50 dark:bg-rose-950/20 text-rose-900 dark:text-rose-100 focus:ring-rose-400'
                    : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-teal-500/20 focus:border-teal-500'
                }`}
              />
              {formErrors.nik ? (
                <p className="text-[11px] text-rose-500 font-semibold">{formErrors.nik}</p>
              ) : (
                <p className="text-[10px] text-slate-400">
                  {nik.length}/16 digit {nik.length === 16 && '✓'}
                </p>
              )}
            </div>
          </div>

          {/* Status Kepegawaian (DROPDOWN WAJIB) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-teal-500" />
                <span>Status Kepegawaian * (Dropdown Standar)</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">
                Output Excel = Kode Angka (1-5)
              </span>
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(Number(e.target.value) as EmployeeStatusCode)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all outline-none cursor-pointer"
            >
              {EMPLOYEE_STATUS_LIST.map((opt) => (
                <option key={opt.code} value={opt.code}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Pilihan aktif:
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-300 dark:border-teal-800">
                {EMPLOYEE_STATUS_LIST.find(s => s.code === status)?.name} (Kode Excel: {status})
              </span>
            </div>
          </div>

          {/* Catatan Tambahan (Opsional) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
              Catatan Internal (Opsional)
            </label>
            <input
              type="text"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Misal: Operator SPAN / Unit Kepegawaian"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all outline-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-500 text-white shadow-md shadow-teal-600/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{editingPegawai ? 'Simpan Perubahan' : 'Tambahkan Pegawai'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
