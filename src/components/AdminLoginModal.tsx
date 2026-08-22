import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Lock, 
  KeyRound, 
  ShieldCheck, 
  AlertCircle, 
  Building2, 
  X, 
  Eye, 
  EyeOff, 
  Sparkles, 
  Check, 
  Zap, 
  ShieldAlert,
  Clock,
  Fingerprint
} from 'lucide-react';
import { AppTheme } from '../types';
import { 
  getRateLimitStatus, 
  recordFailedLoginAttempt, 
  resetFailedLoginAttempts, 
  sanitizeInput,
  createAdminSession
} from '../utils/security';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticateAdmin: (pin: string) => boolean;
  theme?: AppTheme;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onAuthenticateAdmin,
  theme = 'light'
}) => {
  const isDark = theme === 'dark';
  const [pinInput, setPinInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successLogin, setSuccessLogin] = useState<boolean>(false);
  
  // High Security State: Rate Limiting & Brute Force Lockout
  const [lockoutSeconds, setLockoutSeconds] = useState<number>(0);
  const [failedCount, setFailedCount] = useState<number>(0);

  // Check rate limiter status on open or timer tick
  useEffect(() => {
    if (isOpen) {
      const status = getRateLimitStatus();
      setLockoutSeconds(status.remainingSeconds);
      setFailedCount(status.failedAttempts);
    }
  }, [isOpen]);

  // Lockout countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (lockoutSeconds > 0) {
      timer = setInterval(() => {
        setLockoutSeconds(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  if (!isOpen) return null;

  const isCurrentlyLocked = lockoutSeconds > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isCurrentlyLocked) {
      setErrorMsg(`Akses admin sementara dikunci demi keamanan. Harap tunggu ${lockoutSeconds} detik.`);
      return;
    }

    const sanitizedPin = sanitizeInput(pinInput);
    if (!sanitizedPin) {
      setErrorMsg('Masukkan password admin.');
      return;
    }

    if (onAuthenticateAdmin(sanitizedPin)) {
      resetFailedLoginAttempts();
      createAdminSession();
      setErrorMsg(null);
      setSuccessLogin(true);
      setFailedCount(0);
      setTimeout(() => {
        setSuccessLogin(false);
        setPinInput('');
        onClose();
      }, 900);
    } else {
      const lockStatus = recordFailedLoginAttempt();
      setFailedCount(lockStatus.failedAttempts);

      if (lockStatus.isLocked) {
        setLockoutSeconds(lockStatus.remainingSeconds);
        setErrorMsg(
          `Terlalu banyak percobaan gagal (${lockStatus.failedAttempts}x). Akses dikunci selama ${lockStatus.remainingSeconds} detik untuk mencegah serangan brute-force.`
        );
      } else {
        const remainingTries = 5 - lockStatus.failedAttempts;
        setErrorMsg(
          `Password Administrator salah. Sisa kesempatan sebelum terkunci: ${remainingTries > 0 ? remainingTries : 1} kali.`
        );
      }
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[99999] overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-md m-auto rounded-3xl border-2 shadow-2xl overflow-hidden transition-all ${
          isDark ? 'bg-slate-900 border-indigo-500/40 text-slate-100 shadow-indigo-950/50' : 'bg-white border-indigo-200 text-slate-900 shadow-indigo-500/10'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800/40 hover:bg-slate-800/70 text-slate-300 hover:text-white transition-colors z-20 cursor-pointer"
          title="Tutup Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Banner Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-6 sm:p-7 text-white text-center relative overflow-hidden border-b border-indigo-500/30">
          {/* Background Glow */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none"></div>

          <div className="w-14 h-14 bg-indigo-500/20 border border-indigo-400/40 rounded-2xl flex items-center justify-center mx-auto mb-3 text-amber-400 shadow-inner">
            <ShieldCheck className="w-7 h-7" />
          </div>

          <div className="inline-flex items-center gap-1.5 bg-amber-400/20 text-amber-300 border border-amber-400/30 px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-wide mb-2">
            <Building2 className="w-3.5 h-3.5" />
            PORTAL EKSKLUSIF ADMIN KPPN (026)
          </div>

          <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
            Otentikasi Administrator
          </h3>
          <p className="text-slate-300 text-xs mt-1 max-w-xs mx-auto leading-relaxed">
            Khusus pengelola KPPN Semarang I untuk olah Excel SAKTI, WhatsApp Broadcast, dan kontrol sistem.
          </p>

          {/* High Security Badge */}
          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
              <Fingerprint className="w-3 h-3" /> Anti-Brute-Force
            </span>
            <span className="bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[9px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
              <Lock className="w-3 h-3" /> SHA-256 Hardened
            </span>
          </div>
        </div>

        {/* Notice for Public Satker */}
        <div className="px-5 pt-4 pb-0">
          <div className="p-3 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 text-indigo-950 dark:text-indigo-200 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-extrabold text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span>Info Satker &amp; Peserta:</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-normal">
              Satker dan Peserta dapat langsung mengakses Dashboard IKPA, Capaian Output, &amp; Presensi tanpa perlu login admin ini.
            </p>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {successLogin ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 bg-emerald-500/20 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/40">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>
              <h4 className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                Otentikasi Berhasil!
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Membuka seluruh hak akses eksklusif Administrator KPPN...
              </p>
            </div>
          ) : isCurrentlyLocked ? (
            <div className="py-6 px-4 bg-rose-50 dark:bg-rose-950/60 border-2 border-rose-500/50 rounded-2xl text-center space-y-3 animate-pulse">
              <div className="w-12 h-12 bg-rose-500/20 text-rose-500 rounded-2xl flex items-center justify-center mx-auto border border-rose-500/40">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-black text-rose-600 dark:text-rose-400">
                  Sistem Terkunci Sementara
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  Proteksi anti-pembobolan aktif karena beberapa kali gagal login berturut-turut.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 text-rose-600 dark:text-rose-300 font-mono font-black text-sm bg-rose-500/10 py-2 px-3 rounded-xl border border-rose-500/20">
                <Clock className="w-4 h-4 animate-spin" />
                <span>Buka kunci dalam: {lockoutSeconds} detik</span>
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Masukkan Password Administrator</span>
                  {failedCount > 0 && (
                    <span className="text-amber-500 text-[10px] font-bold">
                      Percobaan gagal: {failedCount}/5
                    </span>
                  )}
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Masukkan password admin..."
                    value={pinInput}
                    onChange={(e) => {
                      setPinInput(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    disabled={isCurrentlyLocked}
                    className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-mono font-bold rounded-xl pl-10 pr-10 py-3 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all disabled:opacity-50"
                    autoFocus
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 rounded-xl text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isCurrentlyLocked}
                className="w-full bg-sky-600 hover:bg-sky-500 disabled:bg-slate-600 text-white font-extrabold text-xs py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:cursor-not-allowed"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Masuk Sesi Admin</span>
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
