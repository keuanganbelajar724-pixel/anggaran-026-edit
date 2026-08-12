import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  Info, 
  CheckCircle2, 
  X, 
  Loader2, 
  Sparkles,
  Trash2,
  RefreshCw,
  HelpCircle
} from 'lucide-react';

export interface ConfirmModalState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  iconType?: 'trash' | 'warning' | 'shield' | 'check' | 'info' | 'sparkles' | 'reload';
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

interface ModernConfirmModalProps {
  modal: ConfirmModalState | null;
  onClose: () => void;
  isDark?: boolean;
}

export const ModernConfirmModal: React.FC<ModernConfirmModalProps> = ({
  modal,
  onClose,
  isDark = false,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccessState, setIsSuccessState] = useState(false);

  useEffect(() => {
    if (modal?.isOpen) {
      setIsLoading(false);
      setIsSuccessState(false);
    }
  }, [modal?.isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && modal?.isOpen && !isLoading) {
        if (modal.onCancel) modal.onCancel();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modal?.isOpen, isLoading, modal?.onCancel, onClose]);

  if (!modal || !modal.isOpen) return null;

  const variant = modal.variant || 'danger';

  const handleExecute = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await modal.onConfirm();
      setIsSuccessState(true);
      setTimeout(() => {
        setIsLoading(false);
        setIsSuccessState(false);
        onClose();
      }, 400);
    } catch (err) {
      console.error('Error executing modal action:', err);
      setIsLoading(false);
    }
  };

  const handleCancelAction = () => {
    if (isLoading) return;
    if (modal.onCancel) modal.onCancel();
    onClose();
  };

  // Color mappings
  const themeStyles = {
    danger: {
      bgGlow: 'from-rose-500/20 via-rose-500/5 to-transparent',
      border: isDark ? 'border-rose-500/30' : 'border-rose-200',
      iconBox: 'bg-rose-500/10 text-rose-500 ring-4 ring-rose-500/10 border border-rose-500/20',
      btn: 'bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white shadow-lg shadow-rose-600/30 hover:shadow-rose-600/40',
      badge: 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border-rose-200 dark:border-rose-800'
    },
    warning: {
      bgGlow: 'from-amber-500/20 via-amber-500/5 to-transparent',
      border: isDark ? 'border-amber-500/30' : 'border-amber-200',
      iconBox: 'bg-amber-500/10 text-amber-500 ring-4 ring-amber-500/10 border border-amber-500/20',
      btn: 'bg-gradient-to-r from-amber-500 via-orange-600 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-white shadow-lg shadow-amber-600/30 hover:shadow-amber-600/40',
      badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800'
    },
    info: {
      bgGlow: 'from-sky-500/20 via-indigo-500/5 to-transparent',
      border: isDark ? 'border-sky-500/30' : 'border-sky-200',
      iconBox: 'bg-sky-500/10 text-sky-500 ring-4 ring-sky-500/10 border border-sky-500/20',
      btn: 'bg-gradient-to-r from-sky-600 via-indigo-600 to-blue-600 hover:from-sky-500 hover:to-indigo-500 text-white shadow-lg shadow-sky-600/30 hover:shadow-sky-600/40',
      badge: 'bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 border-sky-200 dark:border-sky-800'
    },
    success: {
      bgGlow: 'from-emerald-500/20 via-emerald-500/5 to-transparent',
      border: isDark ? 'border-emerald-500/30' : 'border-emerald-200',
      iconBox: 'bg-emerald-500/10 text-emerald-500 ring-4 ring-emerald-500/10 border border-emerald-500/20',
      btn: 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/30 hover:shadow-emerald-600/40',
      badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
    }
  }[variant];

  // Render main icon
  const renderIcon = () => {
    if (modal.iconType === 'trash' || (variant === 'danger' && !modal.iconType)) {
      return <Trash2 className="w-7 h-7" />;
    }
    if (modal.iconType === 'shield') {
      return <ShieldAlert className="w-7 h-7" />;
    }
    if (modal.iconType === 'check' || variant === 'success') {
      return <CheckCircle2 className="w-7 h-7" />;
    }
    if (modal.iconType === 'sparkles') {
      return <Sparkles className="w-7 h-7" />;
    }
    if (modal.iconType === 'reload') {
      return <RefreshCw className="w-7 h-7 animate-spin-slow" />;
    }
    if (variant === 'warning') {
      return <AlertTriangle className="w-7 h-7" />;
    }
    return <Info className="w-7 h-7" />;
  };

  const content = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleCancelAction}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl transition-all duration-300"
        />

        {/* Modal Window Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
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
            {/* Header Section with Animated Icon */}
            <div className="flex items-start gap-4 sm:gap-5">
              <motion.div 
                initial={{ scale: 0.5, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className={`p-4 rounded-2xl shrink-0 ${themeStyles.iconBox}`}
              >
                {renderIcon()}
              </motion.div>

              <div className="space-y-1.5 flex-1 pt-1">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${themeStyles.badge}`}>
                    {variant === 'danger' ? 'Konfirmasi Tindakan Risiko' : variant === 'warning' ? 'Peringatan Sistem' : variant === 'success' ? 'Sukses' : 'Informasi'}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight leading-snug">
                  {modal.title}
                </h3>
              </div>
            </div>

            {/* Message Body */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium whitespace-pre-line leading-relaxed">
                {modal.message}
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
                {modal.cancelText || 'Batal'}
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
                  <span>{modal.confirmText || 'Ya, Lanjutkan'}</span>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return createPortal(content, document.body);
};
