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
  Fingerprint,
  User,
  Crown,
  Mail,
  ArrowLeft,
  Send,
  CheckCircle2,
  Copy,
  ExternalLink,
  HelpCircle
} from 'lucide-react';
import { AppTheme, AppUser } from '../types';
import { 
  getRateLimitStatus, 
  recordFailedLoginAttempt, 
  resetFailedLoginAttempts, 
  sanitizeInput,
  createAdminSession
} from '../utils/security';
import { 
  authenticateUser, 
  requestPasswordResetOtp, 
  verifyOtpAndResetPassword 
} from '../utils/userManager';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticateAdmin?: (pin: string) => boolean;
  onLoginSuccess?: (user: AppUser) => void;
  theme?: AppTheme;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onAuthenticateAdmin,
  onLoginSuccess,
  theme = 'light'
}) => {
  const isDark = theme === 'dark';
  const [viewMode, setViewMode] = useState<'login' | 'forgot' | 'verify'>('login');
  const [loginMode, setLoginMode] = useState<'account' | 'pin'>('account');
  const [usernameInput, setUsernameInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [pinInput, setPinInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [successUser, setSuccessUser] = useState<AppUser | null>(null);
  
  // High Security State: Rate Limiting & Brute Force Lockout
  const [lockoutSeconds, setLockoutSeconds] = useState<number>(0);
  const [failedCount, setFailedCount] = useState<number>(0);

  // Forgot Password States
  const [resetIdentifier, setResetIdentifier] = useState<string>('');
  const [resetTargetUser, setResetTargetUser] = useState<AppUser | null>(null);
  const [maskedEmail, setMaskedEmail] = useState<string>('');
  const [generatedOtp, setGeneratedOtp] = useState<string>('');
  const [enteredOtp, setEnteredOtp] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmNewPassword, setConfirmNewPassword] = useState<string>('');
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [isProcessingReset, setIsProcessingReset] = useState<boolean>(false);
  const [copiedOtp, setCopiedOtp] = useState<boolean>(false);

  // Check rate limiter status on open or timer tick
  useEffect(() => {
    if (isOpen) {
      const status = getRateLimitStatus();
      setLockoutSeconds(status.remainingSeconds);
      setFailedCount(status.failedAttempts);
      setErrorMsg(null);
      setInfoMsg(null);
      setSuccessUser(null);
      setViewMode('login');
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

  const handleCopyOtp = () => {
    if (!generatedOtp) return;
    navigator.clipboard.writeText(generatedOtp);
    setCopiedOtp(true);
    setTimeout(() => setCopiedOtp(false), 2000);
  };

  const handleOpenEmailClient = () => {
    if (!resetTargetUser || !resetTargetUser.email) return;
    const subject = encodeURIComponent('Kode Verifikasi Reset Kata Sandi ANGKASA KPPN Semarang I');
    const body = encodeURIComponent(
      `Yth. ${resetTargetUser.displayName},\n\n` +
      `Berikut adalah kode verifikasi OTP untuk reset kata sandi akun ANGKASA Anda:\n\n` +
      `KODE VERIFIKASI: ${generatedOtp}\n\n` +
      `Kode ini berlaku selama 15 menit. Jika Anda tidak meminta reset ini, abaikan pesan ini.\n\n` +
      `Salam,\nAdministrator KPPN Semarang I (026)`
    );
    window.open(`mailto:${resetTargetUser.email}?subject=${subject}&body=${body}`, '_blank');
  };

  // Submit Request Reset OTP via Email
  const handleRequestResetOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    const cleanInput = sanitizeInput(resetIdentifier).trim();
    if (!cleanInput) {
      setErrorMsg('Masukkan username atau alamat email terdaftar Anda.');
      return;
    }

    setIsProcessingReset(true);
    try {
      const res = requestPasswordResetOtp(cleanInput);
      if (res.success && res.user && res.otp && res.maskedEmail) {
        setResetTargetUser(res.user);
        setMaskedEmail(res.maskedEmail);
        setGeneratedOtp(res.otp);
        setEnteredOtp('');
        setNewPassword('');
        setConfirmNewPassword('');
        setViewMode('verify');
        setInfoMsg(`Kode verifikasi 6-digit telah dikirim ke alamat email: ${res.maskedEmail}`);
      } else {
        setErrorMsg(res.message || 'Akun tidak ditemukan atau belum mendaftarkan email.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat memproses reset password.');
    } finally {
      setIsProcessingReset(false);
    }
  };

  // Submit OTP Verification and New Password
  const handleVerifyOtpAndSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    if (!resetTargetUser) {
      setErrorMsg('Data pengguna tidak valid. Silakan ulangi langkah pemulihan.');
      return;
    }

    const cleanOtp = enteredOtp.trim();
    if (!cleanOtp || cleanOtp.length < 6) {
      setErrorMsg('Masukkan 6-digit kode verifikasi OTP yang dikirim ke email Anda.');
      return;
    }

    if (!newPassword || newPassword.length < 4) {
      setErrorMsg('Kata sandi baru minimal harus 4 karakter.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMsg('Konfirmasi kata sandi baru tidak cocok. Harap periksa kembali.');
      return;
    }

    setIsProcessingReset(true);
    try {
      const res = await verifyOtpAndResetPassword(resetTargetUser.id, cleanOtp, newPassword);
      if (res.success) {
        // Automatically authenticate user
        resetFailedLoginAttempts();
        createAdminSession();
        setSuccessUser(resetTargetUser);
        setErrorMsg(null);
        setInfoMsg('Kata sandi berhasil diperbarui! Mengarahkan masuk ke sistem...');

        if (onLoginSuccess) {
          onLoginSuccess(resetTargetUser);
        }
        if (onAuthenticateAdmin) {
          onAuthenticateAdmin(newPassword);
        }

        setTimeout(() => {
          setSuccessUser(null);
          setViewMode('login');
          onClose();
        }, 1500);
      } else {
        setErrorMsg(res.message || 'Kode verifikasi tidak cocok atau telah kedaluwarsa.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memverifikasi OTP.');
    } finally {
      setIsProcessingReset(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isCurrentlyLocked) {
      setErrorMsg(`Akses login sementara dikunci demi keamanan. Harap tunggu ${lockoutSeconds} detik.`);
      return;
    }

    if (loginMode === 'account') {
      const cleanUser = sanitizeInput(usernameInput).trim();
      const cleanPass = passwordInput.trim();

      if (!cleanUser || !cleanPass) {
        setErrorMsg('Harap isi Username dan Kata Sandi.');
        return;
      }

      const result = authenticateUser(cleanUser, cleanPass);
      if (result.success && result.user) {
        resetFailedLoginAttempts();
        createAdminSession();
        setErrorMsg(null);
        setSuccessUser(result.user);
        setFailedCount(0);

        if (onLoginSuccess) {
          onLoginSuccess(result.user);
        }
        if (onAuthenticateAdmin) {
          onAuthenticateAdmin(cleanPass);
        }

        setTimeout(() => {
          setSuccessUser(null);
          setUsernameInput('');
          setPasswordInput('');
          onClose();
        }, 1100);
      } else {
        const lockStatus = recordFailedLoginAttempt();
        setFailedCount(lockStatus.failedAttempts);

        if (lockStatus.isLocked) {
          setLockoutSeconds(lockStatus.remainingSeconds);
          setErrorMsg(
            `Terlalu banyak percobaan gagal (${lockStatus.failedAttempts}x). Akses dikunci selama ${lockStatus.remainingSeconds} detik untuk mencegah serangan brute-force.`
          );
        } else {
          setErrorMsg(result.message || 'Username atau Kata Sandi salah.');
        }
      }
    } else {
      // PIN Mode
      const sanitizedPin = sanitizeInput(pinInput).trim();
      if (!sanitizedPin) {
        setErrorMsg('Masukkan PIN Akses Admin.');
        return;
      }

      const result = authenticateUser(sanitizedPin);
      if (result.success && result.user) {
        resetFailedLoginAttempts();
        createAdminSession();
        setErrorMsg(null);
        setSuccessUser(result.user);
        setFailedCount(0);

        if (onLoginSuccess) {
          onLoginSuccess(result.user);
        }
        if (onAuthenticateAdmin) {
          onAuthenticateAdmin(sanitizedPin);
        }

        setTimeout(() => {
          setSuccessUser(null);
          setPinInput('');
          onClose();
        }, 1100);
      } else {
        const lockStatus = recordFailedLoginAttempt();
        setFailedCount(lockStatus.failedAttempts);

        if (lockStatus.isLocked) {
          setLockoutSeconds(lockStatus.remainingSeconds);
          setErrorMsg(
            `Terlalu banyak percobaan gagal (${lockStatus.failedAttempts}x). Akses dikunci selama ${lockStatus.remainingSeconds} detik.`
          );
        } else {
          const remainingTries = 5 - lockStatus.failedAttempts;
          setErrorMsg(
            `PIN Administrator salah. Sisa kesempatan sebelum terkunci: ${remainingTries > 0 ? remainingTries : 1} kali.`
          );
        }
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
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

          <div className="w-14 h-14 bg-indigo-500/20 border border-indigo-400/40 rounded-2xl flex items-center justify-center mx-auto mb-3 text-amber-400 shadow-inner">
            {viewMode === 'login' ? (
              <ShieldCheck className="w-7 h-7" />
            ) : (
              <KeyRound className="w-7 h-7 text-amber-400 animate-pulse" />
            )}
          </div>

          <div className="inline-flex items-center gap-1.5 bg-amber-400/20 text-amber-300 border border-amber-400/30 px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-wide mb-2">
            <Building2 className="w-3.5 h-3.5" />
            PORTAL LOGIN RESMI KPPN SEMARANG I (026)
          </div>

          <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
            {viewMode === 'login' 
              ? 'Login Admin Super & Pegawai' 
              : viewMode === 'forgot'
                ? 'Pemulihan Kata Sandi Akun'
                : 'Verifikasi OTP & Reset Sandi'}
          </h3>
          <p className="text-slate-300 text-xs mt-1 max-w-xs mx-auto leading-relaxed">
            {viewMode === 'login'
              ? 'Akses masuk khusus pegawai dan administrator internal KPPN Semarang I.'
              : viewMode === 'forgot'
                ? 'Kirim kode OTP ke alamat email terdaftar untuk reset kata sandi mandiri.'
                : `Masukkan kode verifikasi yang telah dikirim ke ${maskedEmail || 'email Anda'}.`}
          </p>

          {/* Mode Switcher Tabs (Only in Login View) */}
          {viewMode === 'login' && (
            <div className="flex items-center gap-2 mt-4 bg-slate-900/80 p-1 rounded-xl border border-indigo-500/30">
              <button
                type="button"
                onClick={() => { setLoginMode('account'); setErrorMsg(null); }}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  loginMode === 'account'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Akun Username &amp; Password</span>
              </button>
              <button
                type="button"
                onClick={() => { setLoginMode('pin'); setErrorMsg(null); }}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  loginMode === 'pin'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>PIN Cepat Admin</span>
              </button>
            </div>
          )}
        </div>

        {/* Notice for Public Satker */}
        {viewMode === 'login' && (
          <div className="px-5 pt-3 pb-0">
            <div className="p-3 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 text-indigo-950 dark:text-indigo-200 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-extrabold text-[11px]">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>Info Satker &amp; Pengunjung:</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-normal">
                Satuan Kerja dapat langsung memantau data IKPA, Capaian Output, &amp; Layanan tanpa perlu login.
              </p>
            </div>
          </div>
        )}

        {/* VIEW 1: LOGIN FORM */}
        {viewMode === 'login' && (
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
            {successUser ? (
              <div className="py-6 text-center space-y-3 animate-fadeIn">
                <div className="w-14 h-14 bg-emerald-500/20 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/40">
                  <Check className="w-7 h-7 stroke-[3]" />
                </div>
                <div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 mb-1">
                    {successUser.role === 'superadmin' ? '👑 Admin Super' : '🏛️ Pegawai KPPN'}
                  </span>
                  <h4 className="text-base font-black text-slate-900 dark:text-white">
                    Selamat Datang, {successUser.displayName}!
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {successUser.customGreeting || 'Membuka hak akses modul operasional KPPN...'}
                  </p>
                </div>
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
                {loginMode === 'account' ? (
                  <>
                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                        Username Pengguna
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="misal: admin atau pegawai"
                          value={usernameInput}
                          onChange={(e) => {
                            setUsernameInput(e.target.value);
                            if (errorMsg) setErrorMsg(null);
                          }}
                          disabled={isCurrentlyLocked}
                          className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-bold rounded-xl pl-10 pr-4 py-2.5 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          autoFocus
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          Kata Sandi / Password
                        </label>
                        {failedCount > 0 && (
                          <span className="text-amber-500 text-[10px] font-bold">
                            Percobaan gagal: {failedCount}/5
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Masukkan kata sandi..."
                          value={passwordInput}
                          onChange={(e) => {
                            setPasswordInput(e.target.value);
                            if (errorMsg) setErrorMsg(null);
                          }}
                          disabled={isCurrentlyLocked}
                          className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-mono font-bold rounded-xl pl-10 pr-10 py-2.5 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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

                      {/* Lupa Kata Sandi Trigger Link */}
                      <div className="flex justify-end mt-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setErrorMsg(null);
                            setInfoMsg(null);
                            setResetIdentifier(usernameInput || '');
                            setViewMode('forgot');
                          }}
                          className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Lupa Kata Sandi? Reset via Email</span>
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                      <span>Masukkan PIN Cepat Admin</span>
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
                        placeholder="Masukkan PIN Cepat Administrator..."
                        value={pinInput}
                        onChange={(e) => {
                          setPinInput(e.target.value);
                          if (errorMsg) setErrorMsg(null);
                        }}
                        disabled={isCurrentlyLocked}
                        className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-mono font-bold rounded-xl pl-10 pr-10 py-3 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
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
                )}

                {errorMsg && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 rounded-xl text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isCurrentlyLocked}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-600 text-white font-extrabold text-xs py-3 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:cursor-not-allowed"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Masuk Sekarang</span>
                </button>
              </>
            )}
          </form>
        )}

        {/* VIEW 2: REQUEST RESET OTP VIA EMAIL */}
        {viewMode === 'forgot' && (
          <form onSubmit={handleRequestResetOtp} className="p-5 sm:p-6 space-y-4">
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-2xl text-xs text-amber-900 dark:text-amber-200 space-y-1">
              <div className="flex items-center gap-1.5 font-black text-[11px] uppercase tracking-wide">
                <Mail className="w-3.5 h-3.5 text-amber-600" />
                <span>Pemulihan Mandiri via Email:</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                Sistem akan memverifikasi akun Anda dan mengirimkan 6-digit kode OTP ke alamat email resmi yang terdaftar pada profil pengguna.
              </p>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Username atau Alamat Email Terdaftar
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="contoh: admin, budi, atau email@kemenkeu.go.id"
                  value={resetIdentifier}
                  onChange={(e) => {
                    setResetIdentifier(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-bold rounded-xl pl-10 pr-4 py-2.5 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  autoFocus
                  required
                />
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 rounded-xl text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setViewMode('login');
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-extrabold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Batal</span>
              </button>

              <button
                type="submit"
                disabled={isProcessingReset}
                className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs py-2.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                {isProcessingReset ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Kirim Kode OTP</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* VIEW 3: VERIFY OTP AND ENTER NEW PASSWORD */}
        {viewMode === 'verify' && (
          <form onSubmit={handleVerifyOtpAndSavePassword} className="p-5 sm:p-6 space-y-4">
            {infoMsg && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 rounded-2xl text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-black text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Kode Verifikasi Berhasil Dibuat:</span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                  Kode OTP telah dikirimkan ke: <strong className="text-emerald-700 dark:text-emerald-300 font-mono">{maskedEmail}</strong>.
                </p>
                
                {/* Fast Testing & Email Link Trigger */}
                <div className="pt-2 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleOpenEmailClient}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[10px] flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Buka Aplikasi Email</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyOtp}
                    className="px-2.5 py-1 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-slate-200 rounded-lg font-bold text-[10px] flex items-center gap-1 transition-all cursor-pointer font-mono"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedOtp ? 'Tersalin: ' + generatedOtp : 'Salin Kode: ' + generatedOtp}</span>
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Kode Verifikasi OTP (6 Digit)
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  value={enteredOtp}
                  onChange={(e) => {
                    setEnteredOtp(e.target.value.replace(/\D/g, ''));
                    if (errorMsg) setErrorMsg(null);
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm font-mono tracking-widest font-black rounded-xl pl-10 pr-4 py-2.5 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center"
                  autoFocus
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Kata Sandi Baru
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="Minimal 4 karakter"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-mono font-bold rounded-xl px-3 py-2.5 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Konfirmasi Sandi
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="Ulangi sandi baru"
                    value={confirmNewPassword}
                    onChange={(e) => {
                      setConfirmNewPassword(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-mono font-bold rounded-xl px-3 py-2.5 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showNewPassword}
                  onChange={(e) => setShowNewPassword(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Tampilkan Kata Sandi</span>
              </label>

              <button
                type="button"
                onClick={handleRequestResetOtp}
                className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
              >
                Kirim Ulang OTP
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 rounded-xl text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setViewMode('forgot');
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-extrabold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kembali</span>
              </button>

              <button
                type="submit"
                disabled={isProcessingReset}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-xs py-2.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                {isProcessingReset ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verifikasi &amp; Simpan Sandi Baru</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
