import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Phone, 
  ExternalLink, 
  Lock, 
  EyeOff, 
  Send, 
  CheckCircle2, 
  ShieldCheck, 
  Mail, 
  ArrowRight
} from 'lucide-react';
import { AppTheme } from '../types';

interface LaporAduanViewProps {
  theme?: AppTheme;
  helpdeskPhone?: string;
  helpdeskJamLayanan?: string;
}

export const LaporAduanView: React.FC<LaporAduanViewProps> = ({
  theme = 'light',
  helpdeskPhone = '081234567890',
  helpdeskJamLayanan = 'Senin - Jumat (08:00 - 16:00 WIB)'
}) => {
  const isDark = theme === 'dark';

  // Format clean phone number for WhatsApp link
  const rawDigits = (helpdeskPhone || '081234567890').replace(/\D/g, '');
  const cleanWaPhone = rawDigits.startsWith('0') ? '62' + rawDigits.slice(1) : rawDigits;

  // Confidential Form State (Fully Anonymous Option)
  const [formData, setFormData] = useState({
    aliasPelapor: 'Anonim (Rahasia)',
    kategori: 'Pengaduan Gratifikasi / Imbalan' as 'Pengaduan Gratifikasi / Imbalan' | 'Pelanggaran Kode Etik / Sikap Petugas' | 'Pengaduan Layanan / Disiplin' | 'Indikasi Fraud / Penyimpangan',
    deskripsi: ''
  });

  const [isSubmitSuccess, setIsSubmitSuccess] = useState<boolean>(false);

  // Submit via WhatsApp or confidential route
  const handleDirectWaReport = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.deskripsi.trim()) {
      alert('Mohon isi rincian atau ringkasan aduan penyimpangan.');
      return;
    }

    const textMsg = encodeURIComponent(
      `*Lapor Pengaduan Integritas / Gratifikasi / Pelayanan KPPN Semarang I (026)*\n\n` +
      `*Pelapor:* ${formData.aliasPelapor || 'Anonim'}\n` +
      `*Kategori:* ${formData.kategori}\n` +
      `*Rincian Aduan:* ${formData.deskripsi}\n\n` +
      `_(Catatan: Laporan ini dikirim secara rahasia untuk ditindaklanjuti Seksi Kepatuhan Internal KPPN Semarang I)_`
    );

    window.open(`https://wa.me/${cleanWaPhone}?text=${textMsg}`, '_blank');
    setIsSubmitSuccess(true);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Top Banner Header */}
      <div className={`${
        isDark 
          ? 'bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 border-slate-800' 
          : 'bg-gradient-to-r from-slate-900 via-rose-900 to-rose-950'
      } p-6 sm:p-8 rounded-3xl border text-white shadow-xl relative overflow-hidden`}>
        <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-8 w-72 h-72 bg-rose-500/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-rose-500/20 text-rose-300 border border-rose-500/30 px-3 py-1 rounded-full text-xs font-semibold">
              <ShieldAlert className="w-3.5 h-3.5" />
              Kanal Pengaduan Integritas &amp; Pelayanan KPPN Semarang I (026)
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Lapor Pengaduan, Gratifikasi &amp; Pelanggaran
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Komitmen penuh KPPN Semarang I mewujudkan Wilayah Bebas dari Korupsi (WBK) &amp; Wilayah Birokrasi Bersih dan Melayani (WBBM). Seluruh layanan bersifat <strong className="text-white">GRATIS (Rp 0,-)</strong>. Identitas Anda dijamin 100% RAHASIA tanpa perlu nama orang maupun nama Satker.
            </p>
          </div>

          <div className="shrink-0 bg-slate-800/90 border border-rose-500/30 p-4 rounded-2xl flex items-center gap-3">
            <div className="p-3 bg-rose-500/20 text-rose-400 rounded-xl">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-rose-300 uppercase tracking-wider">Jaminan Kerahasiaan</div>
              <div className="text-lg font-black text-white">100% Anonim &amp; Aman</div>
              <div className="text-[11px] text-slate-400 font-medium">Bebas Pungli &amp; Gratifikasi</div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Guarantee Alert */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3">
        <EyeOff className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="font-extrabold text-slate-900 dark:text-white">Prinsip Kerahasiaan Identitas Pelapor:</strong> Anda tidak perlu menyebutkan nama asli maupun nama Satuan Kerja. Laporan akan ditangani secara profesional &amp; rahasia oleh Seksi Kepatuhan Internal KPPN Semarang I &amp; Kementerian Keuangan RI.
        </div>
      </div>

      {/* Main Section Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Direct WhatsApp & Confidential Form */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Direct WhatsApp Callout Card */}
          <div className={`p-6 sm:p-8 rounded-3xl border shadow-xl relative overflow-hidden ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between border-b pb-4 mb-5 border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black">
                    Aduan Cepat via WhatsApp CS / Integritas
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Kirim pesan rahasia secara langsung ke petugas KPPN Semarang I
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20">
                Respon Cepat
              </span>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-600 dark:text-slate-300">Nomor WhatsApp CS / Pengaduan:</span>
                  <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">{helpdeskPhone}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Jam Operasional Layanan:</span>
                  <span>{helpdeskJamLayanan}</span>
                </div>
              </div>

              <a
                href={`https://wa.me/${cleanWaPhone}?text=Halo%20Seksi%20Kepatuhan%20Internal%20KPPN%20Semarang%20I%20(026),%20saya%20ingin%20berkonsultasi%20/%20melaporkan%20pengaduan%20pelayanan%20atau%20gratifikasi%20secara%20rahasia.`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-600/25 transition-all cursor-pointer group"
              >
                <Phone className="w-5 h-5" />
                <span>Hubungi WhatsApp Pengaduan ({helpdeskPhone})</span>
                <ExternalLink className="w-4 h-4 opacity-80 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>
          </div>

          {/* Confidential Form Box */}
          <div className={`p-6 sm:p-8 rounded-3xl border shadow-xl ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between border-b pb-4 mb-5 border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-rose-500/10 text-rose-500 rounded-xl">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black">
                    Formulir Draf Aduan Rahasia (Tanpa Nama &amp; Tanpa Satker)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Susun rincian aduan untuk dikirimkan secara anonim ke WhatsApp
                  </p>
                </div>
              </div>
            </div>

            {isSubmitSuccess && (
              <div className="mb-4 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between">
                <span className="flex items-center gap-2 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Draf pengaduan telah dialihkan ke WhatsApp.
                </span>
                <button
                  onClick={() => setIsSubmitSuccess(false)}
                  className="underline text-[11px] font-semibold cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            )}

            <form onSubmit={handleDirectWaReport} className="space-y-4 text-xs">
              <div>
                <label className="block font-black text-slate-950 dark:text-slate-200 mb-1">
                  Identitas / Alias Pelapor (Opsional / Boleh Inisial / Anonim):
                </label>
                <input
                  type="text"
                  value={formData.aliasPelapor}
                  onChange={(e) => setFormData({ ...formData, aliasPelapor: e.target.value })}
                  placeholder="Contoh: Anonim / Inisial / Nama Panggilan"
                  className={`w-full p-2.5 rounded-xl border text-xs font-bold focus:outline-none focus:ring-2 focus:ring-rose-500 placeholder-slate-500 ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-950'
                  }`}
                />
              </div>

              <div>
                <label className="block font-black text-slate-950 dark:text-slate-200 mb-1">
                  Kategori Pengaduan Integritas:
                </label>
                <select
                  value={formData.kategori}
                  onChange={(e) => setFormData({ ...formData, kategori: e.target.value as any })}
                  className={`w-full p-2.5 rounded-xl border text-xs font-bold focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-950'
                  }`}
                >
                  <option value="Pengaduan Gratifikasi / Imbalan">Pengaduan Permintaan / Penerimaan Gratifikasi</option>
                  <option value="Pelanggaran Kode Etik / Sikap Petugas">Pelanggaran Kode Etik / Sikap Petugas Pelayanan</option>
                  <option value="Pengaduan Layanan / Disiplin">Pengaduan Diskriminasi / Keterlambatan Layanan</option>
                  <option value="Indikasi Fraud / Penyimpangan">Indikasi Fraud / Penyimpangan Prosedur</option>
                </select>
              </div>

              <div>
                <label className="block font-black text-slate-950 dark:text-slate-200 mb-1">
                  Rincian &amp; Ringkasan Penyimpangan <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Tuliskan kronologi singkat atau bentuk pelanggaran layanan yang ingin disampaikan secara rahasia..."
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  className={`w-full p-3 rounded-xl border text-xs font-bold focus:outline-none focus:ring-2 focus:ring-rose-500 leading-relaxed placeholder-slate-500 ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-950'
                  }`}
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 hover:brightness-110 cursor-pointer transition-all"
              >
                <Send className="w-4 h-4" />
                <span>Kirim Draf ke WhatsApp Pengaduan Integritas</span>
              </button>
            </form>

          </div>

        </div>

        {/* Right Column: Official Kemenkeu Integrity Channels */}
        <div className="lg:col-span-5 space-y-4">
          
          <div className={`p-5 sm:p-6 rounded-3xl border space-y-3 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <h3 className="text-sm font-black uppercase tracking-wider text-rose-500 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              Kanal Pengaduan Resmi Kemenkeu
            </h3>
            <p className="text-xs text-slate-950 dark:text-slate-200 font-bold leading-relaxed">
              Anda juga dapat menyampaikan pengaduan pelanggaran, penyalahgunaan wewenang, maupun indikasi korupsi secara terpusat melalui saluran independen Kementerian Keuangan RI:
            </p>
          </div>

          <div className="space-y-3">
            
            {/* SIPUMA */}
            <div className={`p-4 rounded-2xl border space-y-2.5 transition-all ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-rose-500 bg-rose-500/10 px-2.5 py-0.5 rounded-lg border border-rose-500/20">
                  SIPUMA Kemenkeu
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <h4 className="text-xs font-black text-slate-900 dark:text-white">
                Sistem Pengaduan Utama Kementerian Keuangan
              </h4>
              <p className="text-[11px] text-slate-950 dark:text-slate-300 font-bold leading-relaxed">
                Kanal resmi pengaduan pelayanan publik, pelanggaran kode etik, dan penyalahgunaan wewenang.
              </p>
              <a
                href="https://sipuma.kemenkeu.go.id"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:underline pt-1"
              >
                Akses sipuma.kemenkeu.go.id <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* WISE Kemenkeu */}
            <div className={`p-4 rounded-2xl border space-y-2.5 transition-all ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-indigo-500 bg-indigo-500/10 px-2.5 py-0.5 rounded-lg border border-indigo-500/20">
                  WISE Kemenkeu
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <h4 className="text-xs font-black text-slate-900 dark:text-white">
                Whistleblowing System (WISE Kemenkeu)
              </h4>
              <p className="text-[11px] text-slate-950 dark:text-slate-300 font-bold leading-relaxed">
                Aplikasi pengaduan bagi pelapor yang memiliki informasi perbuatan berindikasi pelanggaran atau fraud.
              </p>
              <a
                href="https://wise.kemenkeu.go.id"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:underline pt-1"
              >
                Akses wise.kemenkeu.go.id <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* SP4N LAPOR */}
            <div className={`p-4 rounded-2xl border space-y-2.5 transition-all ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-sky-500 bg-sky-500/10 px-2.5 py-0.5 rounded-lg border border-sky-500/20">
                  SP4N LAPOR!
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <h4 className="text-xs font-black text-slate-900 dark:text-white">
                Layanan Aspirasi &amp; Pengaduan Online Rakyat
              </h4>
              <p className="text-[11px] text-slate-950 dark:text-slate-300 font-bold leading-relaxed">
                Kanal pengaduan pelayanan publik nasional terintegrasi untuk seluruh instansi pemerintah.
              </p>
              <a
                href="https://www.lapor.go.id"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 hover:underline pt-1"
              >
                Akses lapor.go.id <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Email KPPN */}
            <div className={`p-4 rounded-2xl border space-y-2.5 transition-all ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-amber-600 bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-500/20">
                  Surel Resmi
                </span>
                <Mail className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <h4 className="text-xs font-black text-slate-900 dark:text-white">
                Email Seksi Kepatuhan Internal KPPN Semarang I
              </h4>
              <p className="text-[11px] text-slate-950 dark:text-slate-300 font-bold leading-relaxed">
                Kirimkan laporan bersurat atau dokumen langsung ke surel pengaduan KPPN.
              </p>
              <a
                href="mailto:kppn.semarang1@kemenkeu.go.id"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:underline pt-1"
              >
                kppn.semarang1@kemenkeu.go.id <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
