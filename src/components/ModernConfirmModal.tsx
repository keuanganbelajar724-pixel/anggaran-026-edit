import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  AlertTriangle, 
  Trash2, 
  RefreshCw, 
  Sparkles, 
  CheckCircle2, 
  X, 
  HelpCircle,
  Loader2,
  Info,
  ShieldAlert
} from 'lucide-react';

export type ConfirmVariant = 'danger' | 'warning' | 'primary' | 'success' | 'default';

export interface ConfirmModalConfig {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  iconType?: 'trash' | 'reset' | 'sparkles' | 'alert' | 'check' | 'info';
  onConfirm: () => Promise<void> | void;
  onCancel?: () => void;
}

export type ConfirmModalState = ConfirmModalConfig;

interface ModernConfirmModalProps {
  modal: ConfirmModalConfig | null;
  onClose: () => void;
  isDark?: boolean;
}

export const ModernConfirmModal: React.FC<ModernConfirmModalProps> = ({
  modal,
  onClose,
  isDark = false,
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSuccessState, setIsSuccessState] = useState<boolean>(false);

  if (!modal || !modal.isOpen) return null;

  // Defensive extraction in case modal.title or modal.message is an object or improperly passed
  const displayTitle: string = typeof modal.title === 'string' 
    ? modal.title 
    : (typeof (modal.title as any)?.title === 'string' 
      ? (modal.title as any).title 
      : 'Konfirmasi Tindakan');

  const displayMessage: string = typeof modal.message === 'string' 
    ? modal.message 
    : (typeof (modal.title as any)?.message === 'string' 
      ? (modal.title as any).message 
      : '');

  const variant = modal.variant || (modal.title as any)?.type || (modal.title as any)?.variant || 'default';
  const effectiveConfirmText = modal.confirmText || (modal.title as any)?.confirmText || 'Ya, Lanjutkan';
  const effectiveCancelText = modal.cancelText || (modal.title as any)?.cancelText || 'Batal';

  const handleExecute = async () => {
    try {
      setIsLoading(true);
      const res = modal.onConfirm();
      if (res instanceof Promise) {
        await res;
      }
      setIsSuccessState(true);
      setTimeout(() => {
        setIsSuccessState(false);
        setIsLoading(false);
        onClose();
      }, 400);
    } catch (err) {
      console.error('Action error in confirm modal:', err);
      setIsLoading(false);
    }
  };

  const handleCancelAction = () => {
    if (isLoading) return;
    if (modal.onCancel) {
      modal.onCancel();
    }
    onClose();
  };

  const getThemeStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          iconBox: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 shadow-lg shadow-rose-950/20',
          btn: 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-lg shadow-rose-950/40 border border-rose-400/40',
          badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
          border: 'border-rose-500/30',
          bgGlow: 'from-rose-500/10 to-transparent',
        };
      case 'warning':
        return {
          iconBox: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-lg shadow-amber-950/20',
          btn: 'bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-slate-950 shadow-lg shadow-amber-950/40 border border-amber-400/40',
          badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
          border: 'border-amber-500/30',
          bgGlow: 'from-amber-500/10 to-transparent',
        };
      case 'success':
        return {
          iconBox: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-950/20',
          btn: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-950/40 border border-emerald-400/40',
          badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
          border: 'border-emerald-500/30',
          bgGlow: 'from-emerald-500/10 to-transparent',
        };
      case 'primary':
      default:
        return {
          iconBox: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 shadow-lg shadow-indigo-950/20',
          btn: 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-lg shadow-indigo-950/40 border border-indigo-400/40',
          badge: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
          border: 'border-indigo-500/30',
          bgGlow: 'from-indigo-500/10 to-transparent',
        };
    }
  };

  const themeStyles = getThemeStyles();

  const renderIcon = () => {
    if (modal.iconType === 'trash' || variant === 'danger') {
      return <Trash2 className="w-7 h-7" />;
    }
    if (modal.iconType === 'reset') {
      return <RefreshCw className="w-7 h-7" />;
    }
    if (modal.iconType === 'sparkles') {
      return <Sparkles className="w-7 h-7" />;
    }
    if (modal.iconType === 'alert' || variant === 'warning') {
      return <AlertTriangle className="w-7 h-7" />;
    }
    if (modal.iconType === 'check' || variant === 'success') {
      return <CheckCircle2 className="w-7 h-7" />;
    }
    return <Info className="w-7 h-7" />;
  };

  const content = (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      {/* Backdrop Overlay */}
      <div
        onClick={handleCancelAction}
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl transition-all duration-300"
      />

      {/* Modal Window Container */}
      <div
        className={`relative w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border transition-colors ${themeStyles.border} ${
          isDark 
            ? 'bg-slate-900/95 text-slate-100 shadow-slate-950/90' 
            : 'bg-white/95 text-slate-900 shadow-slate-900/20'
        }`}
      >
        {/* Top Ambient Glow Pattern */}
        <div className={`absolute -top-24 -left-24 -right-24 h-48 bg-radial ${themeStyles.bgGlow} pointer-events-none rounded-full blur-2xl opacity-70`} />

        {/* Close X Button */}
        <button
          disabled={isLoading}
          onClick={handleCancelAction}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer z-10 disabled:opacity-30"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="relative p-6 sm:p-8">
          {/* Header Section with Icon */}
          <div className="flex items-start gap-4 sm:gap-5">
            <div 
              className={`p-4 rounded-2xl shrink-0 ${themeStyles.iconBox}`}
            >
              {renderIcon()}
            </div>

            <div className="space-y-1.5 flex-1 pt-1">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${themeStyles.badge}`}>
                  {variant === 'danger' ? 'Konfirmasi Tindakan Risiko' : variant === 'warning' ? 'Peringatan Sistem' : variant === 'success' ? 'Sukses' : 'Informasi'}
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black tracking-tight leading-snug">
                {displayTitle}
              </h3>
            </div>
          </div>

          {/* Message Body */}
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium whitespace-pre-line leading-relaxed">
              {displayMessage}
            </p>
          </div>

          {/* Action Buttons Footer */}
          <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              disabled={isLoading}
              onClick={handleCancelAction}
              className="px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all cursor-pointer disabled:opacity-40"
            >
              {effectiveCancelText}
            </button>

            <button
              type="button"
              disabled={isLoading}
              onClick={handleExecute}
              className={`px-6 py-3 rounded-2xl text-xs sm:text-sm font-black active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2.5 min-w-[130px] ${themeStyles.btn} disabled:opacity-60`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Memproses...</span>
                </>
              ) : isSuccessState ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Selesai!</span>
                </>
              ) : (
                <span>{effectiveConfirmText}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};
