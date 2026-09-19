import React, { useState } from 'react';
import { 
  Lock, 
  KeyRound, 
  ShieldAlert, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Building2, 
  ShieldCheck, 
  AlertCircle,
  Search,
  Sparkles,
  Info
} from 'lucide-react';
import { MasterSatker } from '../../types';
import { verifySatkerPassword } from '../../utils/satkerSecurity';

interface SatkerPasswordGatekeeperProps {
  satker: MasterSatker;
  onSuccess: () => void;
  onOpenSatkerSelector: () => void;
  isAdminAuthenticated?: boolean;
}

export const SatkerPasswordGatekeeper: React.FC<SatkerPasswordGatekeeperProps> = ({
  satker,
  onSuccess,
  onOpenSatkerSelector,
  isAdminAuthenticated = false
}) => {
  const [inputPassword, setInputPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPassword.trim() && !isAdminAuthenticated) {
      setError('Silakan masukkan password satker');
      return;
    }

    setIsVerifying(true);
    setError(null);

    // Verify password using centralized security helper
    const isValid = verifySatkerPassword(satker, inputPassword, isAdminAuthenticated);

    setTimeout(() => {
      setIsVerifying(false);
      if (isValid) {
        onSuccess();
      } else {
        setError(
          'Password Satker tidak sesuai. Silakan periksa kembali kata sandi resmi Satker Anda. Jika belum menerima atau lupa kata sandi, silakan hubungi Tim Pembina / Helpdesk KPPN Semarang I.'
        );
      }
    }, 250);
  };

  return (
    <div className="max-w-xl mx-auto py-8 px-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header Ribbon */}
        <div className="p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 text-white relative">
          <div className="absolute right-3 top-3 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 shadow-inner">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-400/30">
                Akses Internal Privat
              </span>
              <h3 className="text-lg font-black text-white mt-0.5">
                Verifikasi Password Satker
              </h3>
            </div>
          </div>

          {/* Satker Information Box */}
          <div className="mt-4 p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-teal-300 uppercase tracking-wider">
                Satuan Kerja Terpilih:
              </p>
              <h4 className="text-sm font-black text-white truncate">
                {satker.namaSatker}
              </h4>
              <p className="text-xs text-slate-300 flex items-center gap-2 mt-0.5">
                <span className="font-mono font-bold text-teal-200">{satker.kodeSatker}</span>
                <span>•</span>
                <span className="truncate">{satker.kementerianLembaga || 'K/L Mitra'}</span>
              </p>
            </div>

            <button
              type="button"
              onClick={onOpenSatkerSelector}
              className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-all shrink-0 cursor-pointer border border-white/20 flex items-center gap-1.5"
              title="Ganti ke Satker lain"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Ganti Satker</span>
            </button>
          </div>
        </div>

        {/* Content Body & Form */}
        <div className="p-6 space-y-5">
          <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-amber-50 dark:bg-amber-950/30 p-3.5 rounded-2xl border border-amber-200 dark:border-amber-800/50 flex items-start gap-3">
            <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-amber-900 dark:text-amber-200">
                Kerahasiaan Data Pegawai &amp; Riwayat Pendaftaran
              </p>
              <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                Formulir pendaftaran memuat data pribadi sensitif (NIP, NIK, NPWP, Nomor HP kedinasan) serta riwayat pembentukan peran SAKTI yang hanya boleh diketahui oleh internal Satker bersangkutan.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  Password Akses Satker:
                </span>
                <span className="text-[10px] text-slate-400 font-normal">
                  Sama dengan password Kelola Satker
                </span>
              </label>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={inputPassword}
                  onChange={(e) => {
                    setInputPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Ketik password satker Anda..."
                  autoFocus
                  className="w-full text-sm font-mono px-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
              <button
                type="submit"
                disabled={isVerifying}
                className="w-full sm:flex-1 py-3 px-5 rounded-2xl bg-teal-600 hover:bg-teal-500 active:scale-[0.98] text-white font-bold text-xs shadow-lg shadow-teal-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isVerifying ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Memverifikasi...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Buka Akses Formulir &amp; Riwayat</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onOpenSatkerSelector}
                className="w-full sm:w-auto py-3 px-4 rounded-2xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Building2 className="w-4 h-4 text-slate-400" />
                <span>Pilih Satker Lain</span>
              </button>
            </div>
          </form>

          {/* Security Notice Footer */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
            <p className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              Perlindungan Privasi Data Satker:
            </p>
            <p>
              Formulir pendaftaran dan riwayat pembentukan user SAKTI dilindungi kata sandi resmi masing-masing Satker untuk mencegah pembukaan data oleh pihak lain.
            </p>
            <p className="text-[10px] text-slate-400">
              * Silakan hubungi Tim Pembina / Helpdesk KPPN Semarang I apabila membutuhkan informasi atau konfirmasi kata sandi Satker Anda.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
