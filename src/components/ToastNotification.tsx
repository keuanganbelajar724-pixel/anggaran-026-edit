import React, { useEffect, useState, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X, Sparkles } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number; // in ms
}

interface ToastContextType {
  showToast: (toast: Omit<ToastItem, 'id'>) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    // Fallback if used outside Provider
    return {
      showToast: (toast: Omit<ToastItem, 'id'>) => {
        console.log(`[TOAST] ${toast.type}: ${toast.title} ${toast.message || ''}`);
      }
    };
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode; isDark?: boolean }> = ({ children, isDark = false }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = (toast: Omit<ToastItem, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastItem = {
      id,
      duration: 4000,
      ...toast,
    };
    setToasts((prev) => [newToast, ...prev].slice(0, 5)); // Keep max 5 toasts
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {createPortal(
        <div className="fixed top-5 right-5 z-[999999] flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none px-4 sm:px-0">
          <AnimatePresence>
            {toasts.map((toast) => (
              <ToastContainer key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} isDark={isDark} />
            ))}
          </AnimatePresence>
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
};

const ToastContainer: React.FC<{ toast: ToastItem; onClose: () => void; isDark?: boolean }> = ({ toast, onClose, isDark }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [toast.duration, onClose]);

  const styles = {
    success: {
      border: 'border-emerald-500/30',
      iconBg: 'bg-emerald-500/15 text-emerald-500 ring-2 ring-emerald-500/20',
      icon: <CheckCircle2 className="w-5 h-5 shrink-0" />,
      progressBg: 'bg-emerald-500',
      bg: isDark ? 'bg-slate-900/95 text-slate-100' : 'bg-white/95 text-slate-900',
    },
    error: {
      border: 'border-rose-500/30',
      iconBg: 'bg-rose-500/15 text-rose-500 ring-2 ring-rose-500/20',
      icon: <AlertCircle className="w-5 h-5 shrink-0" />,
      progressBg: 'bg-rose-500',
      bg: isDark ? 'bg-slate-900/95 text-slate-100' : 'bg-white/95 text-slate-900',
    },
    warning: {
      border: 'border-amber-500/30',
      iconBg: 'bg-amber-500/15 text-amber-500 ring-2 ring-amber-500/20',
      icon: <AlertTriangle className="w-5 h-5 shrink-0" />,
      progressBg: 'bg-amber-500',
      bg: isDark ? 'bg-slate-900/95 text-slate-100' : 'bg-white/95 text-slate-900',
    },
    info: {
      border: 'border-sky-500/30',
      iconBg: 'bg-sky-500/15 text-sky-500 ring-2 ring-sky-500/20',
      icon: <Info className="w-5 h-5 shrink-0" />,
      progressBg: 'bg-sky-500',
      bg: isDark ? 'bg-slate-900/95 text-slate-100' : 'bg-white/95 text-slate-900',
    },
  }[toast.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`pointer-events-auto relative overflow-hidden rounded-2xl p-4 shadow-xl border backdrop-blur-xl ${styles.bg} ${styles.border}`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-xl ${styles.iconBg}`}>{styles.icon}</div>

        <div className="flex-1 pr-2">
          <h4 className="text-sm font-black tracking-tight leading-snug">{toast.title}</h4>
          {toast.message && (
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 leading-relaxed">
              {toast.message}
            </p>
          )}
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress timer bar */}
      <motion.div
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: (toast.duration || 4000) / 1000, ease: 'linear' }}
        className={`absolute bottom-0 left-0 h-1 ${styles.progressBg}`}
      />
    </motion.div>
  );
};
