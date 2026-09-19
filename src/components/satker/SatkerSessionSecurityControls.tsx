import React, { useState } from 'react';
import { 
  Clock, 
  ShieldAlert, 
  RefreshCw, 
  Settings2, 
  ChevronDown, 
  Check, 
  Lock, 
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { TIMEOUT_OPTIONS } from '../../hooks/useSatkerInactivityTimeout';

interface SatkerSessionTimerBadgeProps {
  remainingSeconds: number;
  formattedRemaining: string;
  timeoutMinutes: number;
  isWarning: boolean;
  onResetTimer: () => void;
  onSetTimeoutMinutes: (minutes: number) => void;
  onLockNow: () => void;
  satkerKode?: string;
  satkerNama?: string;
}

export const SatkerSessionTimerBadge: React.FC<SatkerSessionTimerBadgeProps> = ({
  formattedRemaining,
  timeoutMinutes,
  isWarning,
  onResetTimer,
  onSetTimeoutMinutes,
  onLockNow,
  satkerKode
}) => {
  const [isOpenMenu, setIsOpenMenu] = useState(false);

  return (
    <div className="relative inline-block text-left">
      <div className="flex items-center gap-1">
        {/* Main Countdown Button */}
        <button
          type="button"
          onClick={() => setIsOpenMenu(!isOpenMenu)}
          title={`Sesi aktif Satker ${satkerKode || ''}. Otomatis dikunci jika tidak ada aktivitas selama ${timeoutMinutes} menit. Klik untuk opsi.`}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
            isWarning
              ? 'bg-amber-500/20 text-amber-300 border-amber-400/50 animate-pulse shadow-sm shadow-amber-500/20'
              : 'bg-teal-950/80 text-teal-300 border-teal-700/60 hover:bg-teal-900/60 hover:text-white'
          }`}
        >
          <Clock className={`w-3.5 h-3.5 ${isWarning ? 'text-amber-400 animate-spin' : 'text-teal-400'}`} />
          <span className="font-mono tracking-wider font-extrabold">{formattedRemaining}</span>
          <ChevronDown className="w-3 h-3 text-slate-400 opacity-80" />
        </button>

        {/* Quick Refresh Button if Warning */}
        {isWarning && (
          <button
            type="button"
            onClick={onResetTimer}
            className="px-2 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-all cursor-pointer flex items-center gap-1 shadow-md"
            title="Klik untuk memperpanjang sesi aktif"
          >
            <RefreshCw className="w-3 h-3" />
            <span className="hidden sm:inline">Perpanjang</span>
          </button>
        )}
      </div>

      {/* Dropdown Options */}
      {isOpenMenu && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpenMenu(false)} 
          />
          <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl p-3 z-50 text-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
              <div className="flex items-center gap-1.5 text-xs font-bold text-teal-300">
                <Settings2 className="w-3.5 h-3.5" />
                <span>Pengaturan Kunci Otomatis</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                {formattedRemaining}
              </span>
            </div>

            <p className="text-[11px] text-slate-400 mb-2.5 leading-relaxed">
              Sesi akan otomatis dikunci jika tidak ada pergerakan kursor atau input data:
            </p>

            {/* Inactivity Duration Selector */}
            <div className="space-y-1 mb-3">
              {TIMEOUT_OPTIONS.map((opt) => {
                const isSelected = timeoutMinutes === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onSetTimeoutMinutes(opt.value);
                      setIsOpenMenu(false);
                    }}
                    className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30'
                        : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-teal-400" />}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-800 space-y-1.5">
              <button
                type="button"
                onClick={() => {
                  onResetTimer();
                  setIsOpenMenu(false);
                }}
                className="w-full py-1.5 px-2.5 rounded-lg bg-teal-600/30 hover:bg-teal-600/40 text-teal-200 border border-teal-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Perpanjang Sesi Sekarang</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsOpenMenu(false);
                  onLockNow();
                }}
                className="w-full py-1.5 px-2.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Kunci Akses Satker Sekarang</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

interface SatkerSessionExpiredModalProps {
  isOpen: boolean;
  timeoutMinutes: number;
  satkerKode?: string;
  satkerNama?: string;
  onClose: () => void;
}

export const SatkerSessionExpiredModal: React.FC<SatkerSessionExpiredModalProps> = ({
  isOpen,
  timeoutMinutes,
  satkerKode,
  satkerNama,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="max-w-md w-full rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-6 text-white text-center relative overflow-hidden">
        {/* Accent Glow */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300 mb-4 shadow-inner">
          <Clock className="w-7 h-7 animate-pulse" />
        </div>

        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
          Keamanan Satker
        </span>

        <h3 className="text-lg font-black text-white mt-2">
          Sesi Satker Berakhir Otomatis
        </h3>

        <div className="my-3 p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 text-left">
          <p className="text-xs text-slate-400">Satuan Kerja:</p>
          <p className="text-sm font-bold text-white truncate">{satkerNama || 'Satker Mitra'}</p>
          <p className="text-xs font-mono font-bold text-teal-400">{satkerKode}</p>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed mb-5">
          Demi menjaga kerahasiaan dan keamanan data internal Satker, akses telah dikunci kembali secara otomatis setelah <strong>{timeoutMinutes} menit</strong> tidak ada aktivitas.
        </p>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-sm font-bold shadow-lg shadow-teal-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Buka Kembali dengan Password</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
