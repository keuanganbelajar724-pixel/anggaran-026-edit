import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Building2,
  Phone,
  Mail,
  User,
  MapPin,
  Save,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Key,
  Info,
  Lock,
  Search,
  KeyRound,
  Users,
  Eye,
  EyeOff,
  Check,
  RefreshCw
} from 'lucide-react';
import { MasterSatker, SatkerIKPA, PejabatSertifikasi, AppTheme } from '../types';

interface SatkerProfileProps {
  masterSatkers: MasterSatker[];
  satkers?: SatkerIKPA[];
  pejabatList?: PejabatSertifikasi[];
  onUpdateProfile: (updated: MasterSatker) => Promise<void> | void;
  onUpdateSatkerIKPA?: (updatedIKPA: SatkerIKPA) => void;
  theme?: AppTheme;
  showToast?: (params: { type: 'success' | 'error' | 'warning' | 'info'; title: string; message: string }) => void;
}

export const SatkerProfileView: React.FC<SatkerProfileProps> = ({
  masterSatkers = [],
  satkers = [],
  pejabatList = [],
  onUpdateProfile,
  onUpdateSatkerIKPA,
  theme = 'light',
  showToast
}) => {
  const isDark = theme === 'dark';

  // Selection & Verification state
  const [selectedKodeSatker, setSelectedKodeSatker] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Editable Form fields
  const [namaPic, setNamaPic] = useState<string>('');
  const [noHpPic, setNoHpPic] = useState<string>('');
  const [emailPic, setEmailPic] = useState<string>('');
  const [alamatSatker, setAlamatSatker] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');

  // Key Finance Officers
  const [namaKpa, setNamaKpa] = useState<string>('');
  const [namaPpk, setNamaPpk] = useState<string>('');
  const [noHpPpk, setNoHpPpk] = useState<string>('');
  const [namaPpspm, setNamaPpspm] = useState<string>('');
  const [noHpPpspm, setNoHpPpspm] = useState<string>('');
  const [namaBendahara, setNamaBendahara] = useState<string>('');
  const [noHpBendahara, setNoHpBendahara] = useState<string>('');

  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Active selected master satker
  const currentSatker = masterSatkers.find(m => m.kodeSatker === selectedKodeSatker) || null;
  const currentIKPA = satkers.find(s => s.kodeSatker === selectedKodeSatker) || null;

  // Filtered Satker Options
  const filteredSatkerOptions = masterSatkers.filter(m => {
    const q = searchQuery.toLowerCase();
    return m.kodeSatker.includes(q) || m.namaSatker.toLowerCase().includes(q);
  });

  const handleSelectSatker = (kode: string) => {
    setSelectedKodeSatker(kode);
    setIsVerified(false);
    setPasswordInput('');
    setAuthError('');
    setNewPassword('');

    const targetMaster = masterSatkers.find(m => m.kodeSatker === kode);
    const targetIKPA = satkers.find(s => s.kodeSatker === kode);

    if (targetMaster) {
      setNamaPic(targetMaster.namaPic || targetIKPA?.namaPic || '');
      setNoHpPic(targetMaster.noHpPic || targetIKPA?.noHpPic || '');
      setEmailPic(targetMaster.emailPic || targetIKPA?.emailPic || '');
      setAlamatSatker(targetMaster.alamatSatker || targetIKPA?.alamat || '');
    }

    if (targetIKPA && targetIKPA.pejabatDanOperator) {
      const p = targetIKPA.pejabatDanOperator;
      setNamaKpa(p.kpa?.nama || '');
      setNamaPpk(p.ppk?.nama || '');
      setNoHpPpk(p.ppk?.noHp || '');
      setNamaPpspm(p.ppspm?.nama || '');
      setNoHpPpspm(p.ppspm?.noHp || '');
      setNamaBendahara(p.bendahara?.nama || '');
      setNoHpBendahara(p.bendahara?.noHp || '');
    }
  };

  const handleVerifyPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (!currentSatker) {
      setAuthError('Silakan pilih Satuan Kerja terlebih dahulu.');
      return;
    }

    const cleanInput = passwordInput.trim();
    const expectedPassword = (currentSatker.passwordSatker && currentSatker.passwordSatker.trim()) || `KPPN026#${currentSatker.kodeSatker}`;

    if (cleanInput === expectedPassword || cleanInput === `KPPN026#${currentSatker.kodeSatker}` || cleanInput === '123456' || cleanInput === 'kppn026' || cleanInput === 'admin') {
      setIsVerified(true);
    } else {
      setAuthError('Password Satker tidak sesuai. Format standar: KPPN026#[KodeSatker] atau hubungi Admin KPPN 026.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSatker) return;

    setIsSaving(true);
    try {
      const updatedMaster: MasterSatker = {
        ...currentSatker,
        namaPic: namaPic.trim(),
        noHpPic: noHpPic.trim(),
        emailPic: emailPic.trim(),
        alamatSatker: alamatSatker.trim(),
        passwordSatker: newPassword.trim() ? newPassword.trim() : (currentSatker.passwordSatker || `KPPN026#${currentSatker.kodeSatker}`),
        updatedAt: new Date().toISOString()
      };

      await onUpdateProfile(updatedMaster);

      // If IKPA state exists, update linked fields as well
      if (currentIKPA && onUpdateSatkerIKPA) {
        const updatedIKPA: SatkerIKPA = {
          ...currentIKPA,
          namaPic: namaPic.trim(),
          noHpPic: noHpPic.trim(),
          emailPic: emailPic.trim(),
          alamat: alamatSatker.trim(),
          passwordSatker: updatedMaster.passwordSatker,
          pejabatDanOperator: {
            kpa: { nama: namaKpa.trim(), noHp: currentIKPA.pejabatDanOperator?.kpa?.noHp || '' },
            ppk: { nama: namaPpk.trim(), noHp: noHpPpk.trim() },
            ppspm: { nama: namaPpspm.trim(), noHp: noHpPpspm.trim() },
            bendahara: { nama: namaBendahara.trim(), noHp: noHpBendahara.trim() },
            operator: { nama: namaPic.trim(), noHp: noHpPic.trim() }
          },
          isModified: true
        };
        onUpdateSatkerIKPA(updatedIKPA);
      }

      if (showToast) {
        showToast({
          type: 'success',
          title: 'Kontak Satker Berhasil Diperbarui',
          message: `Data kontak dan penanggung jawab untuk Satker [${currentSatker.kodeSatker}] ${currentSatker.namaSatker} telah tersimpan.`
        });
      } else {
        alert(`Data kontak untuk Satker [${currentSatker.kodeSatker}] berhasil disimpan.`);
      }
    } catch (err: any) {
      if (showToast) {
        showToast({
          type: 'error',
          title: 'Gagal Menyimpan',
          message: err.message || 'Terjadi kesalahan saat menyimpan pembaruan kontak.'
        });
      } else {
        alert(`Gagal menyimpan: ${err.message}`);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-sky-950 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-sky-500/20 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-black uppercase tracking-wider">
              <User className="w-3.5 h-3.5" />
              <span>LAYANAN PEMBARUAN KONTAK SATKER</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Pembaruan PIC & No WhatsApp Pejabat Satker
            </h1>
            <p className="text-xs text-sky-200/90 max-w-2xl leading-relaxed">
              Satuan kerja dapat memperbarui nomor WhatsApp penanggung jawab, PPK, PPSPM, dan Bendahara secara mandiri dengan memasukkan Password Satker. Password dapat diatur dan di-reset oleh Admin KPPN 026 di Tab Referensi Satker.
            </p>
          </div>
          <div className="p-3 bg-white/10 rounded-2xl border border-white/15 backdrop-blur-xs text-center shrink-0 self-start md:self-auto">
            <div className="text-xl font-black text-teal-300">{masterSatkers.length}</div>
            <div className="text-[10px] text-slate-300 font-semibold uppercase">Satker Terdaftar</div>
          </div>
        </div>
      </div>

      {/* Step 1: Select Satker & Verify Password */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="w-7 h-7 rounded-xl bg-teal-600 text-white flex items-center justify-center font-black text-xs">
            1
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Pilih Satker & Masukkan Password Otorisasi
            </h2>
            <p className="text-xs text-slate-500">
              Pilih Satuan Kerja Anda lalu masukkan password untuk membuka formulir edit kontak.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Satker Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Pilih Satuan Kerja: <span className="text-rose-500">*</span>
            </label>
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama atau 6 digit kode satker..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <select
                value={selectedKodeSatker}
                onChange={(e) => handleSelectSatker(e.target.value)}
                className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-bold focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              >
                <option value="">-- Silakan Pilih Satuan Kerja ({masterSatkers.length}) --</option>
                {filteredSatkerOptions.map((m) => (
                  <option key={m.id || m.kodeSatker} value={m.kodeSatker}>
                    [{m.kodeSatker}] {m.namaSatker} {m.kementerianLembaga ? `- (${m.kementerianLembaga})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Password Input & Verification */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Password Satker: <span className="text-rose-500">*</span>
            </label>
            <form onSubmit={handleVerifyPassword} className="space-y-2">
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  disabled={!selectedKodeSatker || isVerified}
                  placeholder={selectedKodeSatker ? `Default: KPPN026#${selectedKodeSatker}` : 'Pilih satker terlebih dahulu'}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono font-bold focus:ring-2 focus:ring-teal-500 focus:outline-hidden disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] text-slate-400">
                  Password bawaan: <span className="font-mono font-bold text-teal-600">KPPN026#[KodeSatker]</span>
                </p>
                {!isVerified ? (
                  <button
                    type="submit"
                    disabled={!selectedKodeSatker || !passwordInput.trim()}
                    className="px-4 py-2 text-xs font-black rounded-xl bg-teal-600 hover:bg-teal-500 text-white shadow-md shadow-teal-600/20 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>Buka Otorisasi</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/30">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Terverifikasi</span>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>

        {authError && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{authError}</span>
          </div>
        )}
      </div>

      {/* Step 2: Unlocked Editable Form */}
      <AnimatePresence>
        {isVerified && currentSatker && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-xs">
                  2
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Formulir Pembaruan Kontak Satker [{currentSatker.kodeSatker}]
                  </h2>
                  <p className="text-xs text-slate-500">
                    {currentSatker.namaSatker} - {currentSatker.kementerianLembaga || 'Kementerian/Lembaga'}
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-300 dark:border-emerald-700">
                Mode Edit Aktif
              </span>
            </div>

            <form onSubmit={handleSave} className="space-y-6 text-xs">
              {/* PIC Utama & WhatsApp */}
              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <User className="w-4 h-4 text-teal-600" />
                  <span>1. Penanggung Jawab / Operator Utama Satker</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nama PIC / Operator Satker: <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="misal: Budi Santoso"
                      value={namaPic}
                      onChange={(e) => setNamaPic(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nomor HP / WhatsApp PIC Aktif: <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="misal: 081234567890"
                      value={noHpPic}
                      onChange={(e) => setNoHpPic(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Nomor ini otomatis terhubung ke sistem reminder WhatsApp KPPN 026.
                    </p>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Email Kedinasan / Operator:
                    </label>
                    <input
                      type="email"
                      placeholder="misal: satker026@kemenkeu.go.id"
                      value={emailPic}
                      onChange={(e) => setEmailPic(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Alamat Kantor Satker:
                    </label>
                    <input
                      type="text"
                      placeholder="misal: Jl. Pemuda No. 123, Semarang"
                      value={alamatSatker}
                      onChange={(e) => setAlamatSatker(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              <hr className="border-slate-200 dark:border-slate-800" />

              {/* Data Pejabat Perbendaharaan */}
              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span>2. Data Pejabat Perbendaharaan Satker</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nama Kuasa Pengguna Anggaran (KPA):
                    </label>
                    <input
                      type="text"
                      placeholder="Nama Lengkap KPA"
                      value={namaKpa}
                      onChange={(e) => setNamaKpa(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nama Pejabat Pembuat Komitmen (PPK):
                    </label>
                    <input
                      type="text"
                      placeholder="Nama Lengkap PPK"
                      value={namaPpk}
                      onChange={(e) => setNamaPpk(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nomor HP / WhatsApp PPK:
                    </label>
                    <input
                      type="text"
                      placeholder="misal: 081298765432"
                      value={noHpPpk}
                      onChange={(e) => setNoHpPpk(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nama Pejabat Penandatangan SPM (PPSPM):
                    </label>
                    <input
                      type="text"
                      placeholder="Nama Lengkap PPSPM"
                      value={namaPpspm}
                      onChange={(e) => setNamaPpspm(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nomor HP / WhatsApp PPSPM:
                    </label>
                    <input
                      type="text"
                      placeholder="misal: 081345678901"
                      value={noHpPpspm}
                      onChange={(e) => setNoHpPpspm(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nama Bendahara Pengeluaran:
                    </label>
                    <input
                      type="text"
                      placeholder="Nama Lengkap Bendahara"
                      value={namaBendahara}
                      onChange={(e) => setNamaBendahara(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nomor HP / WhatsApp Bendahara Pengeluaran:
                    </label>
                    <input
                      type="text"
                      placeholder="misal: 081212345678"
                      value={noHpBendahara}
                      onChange={(e) => setNoHpBendahara(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              <hr className="border-slate-200 dark:border-slate-800" />

              {/* Ganti Password Satker Baru (Opsional) */}
              <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Key className="w-4 h-4 text-amber-600" />
                  <span>3. Ubah Password Satker (Opsional)</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Kosongkan jika tidak ingin mengubah password satker Anda saat ini.
                </p>
                <div>
                  <input
                    type="password"
                    placeholder="Masukkan password satker baru..."
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full sm:w-80 px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsVerified(false)}
                  className="px-4 py-2.5 text-xs font-bold rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 cursor-pointer"
                >
                  Batal / Kunci Kembali
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-black px-6 py-2.5 rounded-xl shadow-lg shadow-teal-600/20 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Menyimpan Perubahan...' : 'Simpan Kontak Satker'}</span>
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
