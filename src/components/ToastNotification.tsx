import React, { useEffect, useState, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number; // in ms
}

export type ToastOptions = Omit<ToastItem, 'id'>;

export interface ToastContextType {
  showToast: (toastOrMessage: ToastOptions | string, type?: ToastType, title?: string) => void;
  addToast: (toastOrMessage: ToastOptions | string, type?: ToastType, title?: string) => void;
  toast: (toastOrMessage: ToastOptions | string, type?: ToastType, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const defaultTitles: Record<ToastType, string> = {
  success: 'Berhasil',
  error: 'Terjadi Kesalahan',
  warning: 'Perhatian',
  info: 'Informasi'
};

function normalizeToastParam(toastOrMessage: ToastOptions | string, type?: ToastType, title?: string): ToastOptions {
  if (typeof toastOrMessage === 'string') {
    const selectedType = type || 'info';
    return {
      type: selectedType,
      title: title || defaultTitles[selectedType] || 'Notifikasi',
      message: toastOrMessage
    };
  }
  return {
    ...toastOrMessage,
    type: toastOrMessage.type || 'info',
    title: toastOrMessage.title || defaultTitles[toastOrMessage.type || 'info'] || 'Notifikasi'
  };
}

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    // Fallback if used outside Provider
    const fallbackHandler = (toastOrMessage: ToastOptions | string, type?: ToastType, title?: string) => {
      const normalized = normalizeToastParam(toastOrMessage, type, title);
      console.log(`[TOAST] ${normalized.type}: ${normalized.title} - ${normalized.message || ''}`);
    };
    return {
      showToast: fallbackHandler,
      addToast: fallbackHandler,
      toast: fallbackHandler
    };
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode; isDark?: boolean }> = ({ children, isDark = false }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const handleToast = (toastOrMessage: ToastOptions | string, type?: ToastType, title?: string) => {
    const normalized = normalizeToastParam(toastOrMessage, type, title);
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastItem = {
      id,
      duration: normalized.duration || 4000,
      ...normalized,
    };
    setToasts((prev) => [newToast, ...prev].slice(0, 5)); // Keep max 5 toasts
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const contextValue: ToastContextType = {
    showToast: handleToast,
    addToast: handleToast,
    toast: handleToast
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {typeof document !== 'undefined' && createPortal(
        <div className="fixed top-5 right-5 z-[999999] flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none px-4 sm:px-0">
          {toasts.map((toast) => (
            <ToastContainer key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} isDark={isDark} />
          ))}
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
      bg: isDark ? 'bg-slate-900/95 text-slate-100' : 'bg-white/95 text-slate-900',
    },
    error: {
      border: 'border-rose-500/30',
      iconBg: 'bg-rose-500/15 text-rose-500 ring-2 ring-rose-500/20',
      icon: <AlertCircle className="w-5 h-5 shrink-0" />,
      bg: isDark ? 'bg-slate-900/95 text-slate-100' : 'bg-white/95 text-slate-900',
    },
    warning: {
      border: 'border-amber-500/30',
      iconBg: 'bg-amber-500/15 text-amber-500 ring-2 ring-amber-500/20',
      icon: <AlertTriangle className="w-5 h-5 shrink-0" />,
      bg: isDark ? 'bg-slate-900/95 text-slate-100' : 'bg-white/95 text-slate-900',
    },
    info: {
      border: 'border-sky-500/30',
      iconBg: 'bg-sky-500/15 text-sky-500 ring-2 ring-sky-500/20',
      icon: <Info className="w-5 h-5 shrink-0" />,
      bg: isDark ? 'bg-slate-900/95 text-slate-100' : 'bg-white/95 text-slate-900',
    },
  }[toast.type];

  return (
    <div
      className={`pointer-events-auto relative overflow-hidden rounded-2xl p-4 shadow-xl border backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200 ${styles.bg} ${styles.border}`}
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
    </div>
  );
};
