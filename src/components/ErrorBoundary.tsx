import React from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    (this as any).state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ANGKASA Critical Error]', error, errorInfo);
    (this as any).setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleClearCacheAndReload = () => {
    try {
      localStorage.removeItem('kppn_satker_data');
      localStorage.removeItem('kppn_dashboard_config');
      sessionStorage.clear();
    } catch (e) {
      console.warn('Failed clearing cache:', e);
    }
    window.location.reload();
  };

  public render() {
    const state = (this as any).state as State;
    const props = (this as any).props as Props;

    if (state?.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 sm:p-6 font-sans">
          <div className="max-w-xl w-full bg-slate-800 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-rose-400" />
              </div>
              <div>
                <h1 className="text-xl font-black text-white">
                  Terjadi Kendala Memuat Aplikasi
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Sistem mendeteksi kendala pada state antarmuka atau cache lokal.
                </p>
              </div>
            </div>

            {state.error && (
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs font-mono text-rose-300 overflow-x-auto max-h-48">
                <p className="font-bold text-rose-400">{state.error.toString()}</p>
                {state.errorInfo?.componentStack && (
                  <pre className="text-[10px] text-slate-400 mt-2 whitespace-pre-wrap">
                    {state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="w-full sm:w-auto flex-1 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/30 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Muat Ulang Halaman</span>
              </button>

              <button
                onClick={this.handleClearCacheAndReload}
                className="w-full sm:w-auto flex-1 px-5 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-all border border-slate-600 cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-amber-400" />
                <span>Reset Cache &amp; Reload</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return props.children;
  }
}
