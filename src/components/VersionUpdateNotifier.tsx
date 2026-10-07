import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Sparkles, X, CheckCircle2 } from 'lucide-react';

interface VersionInfo {
  status: string;
  buildId: string;
  serverStartTime: string;
  version: string;
  name: string;
}

/**
 * Memaksa browser melakukan hard-refresh dan memuat ulang kode terbaru
 * tanpa menghilangkan session login atau data penting di localStorage.
 */
export function forceCleanAppReload() {
  try {
    // Tambahkan timestamp query parameter untuk memastikan browser bypass disk & memory cache
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('_v', Date.now().toString());
    window.location.href = currentUrl.toString();
  } catch {
    window.location.reload();
  }
}

export function VersionUpdateNotifier() {
  const [initialBuildId, setInitialBuildId] = useState<string | null>(null);
  const [hasNewVersion, setHasNewVersion] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [justUpdated, setJustUpdated] = useState(false);

  // Periksa apakah baru saja melakukan refresh update
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('_v')) {
      setJustUpdated(true);
      // Bersihkan param _v dari URL tanpa reload ulang
      window.history.replaceState({}, document.title, window.location.pathname);
      const timer = setTimeout(() => {
        setJustUpdated(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  const checkVersion = useCallback(async () => {
    try {
      const res = await fetch(`/api/app-version?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      if (!res.ok) return;
      const data: VersionInfo = await res.json();
      
      if (data && data.buildId) {
        if (!initialBuildId) {
          setInitialBuildId(data.buildId);
        } else if (initialBuildId !== data.buildId) {
          // Versi baru terdeteksi!
          setHasNewVersion(true);
          setDismissed(false);
        }
      }
    } catch {
      // Abaikan jika network offline
    }
  }, [initialBuildId]);

  // Cek versi saat pertama kali load, saat window dapat fokus, dan setiap 3 menit
  useEffect(() => {
    checkVersion();

    const handleFocus = () => {
      checkVersion();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkVersion();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    const interval = setInterval(checkVersion, 3 * 60 * 1000); // Setiap 3 menit

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
    };
  }, [checkVersion]);

  const handleUpdateNow = () => {
    setIsUpdating(true);
    setTimeout(() => {
      forceCleanAppReload();
    }, 300);
  };

  // Toast berhasil diperbarui
  if (justUpdated) {
    return (
      <div className="fixed top-4 right-4 z-50 animate-bounce duration-300">
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-xl shadow-emerald-900/30 border border-emerald-400/40 text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
          <span>Tampilan ANGKASA Berhasil Dimuat dalam Versi Terbaru!</span>
        </div>
      </div>
    );
  }

  if (!hasNewVersion || dismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-md w-[calc(100vw-2.5rem)] animate-slide-up duration-300">
      <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950 border-2 border-amber-400/80 shadow-2xl shadow-indigo-950/60 text-white relative backdrop-blur-xl">
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-2.5 right-2.5 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Tutup pemberitahuan"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 shrink-0 mt-0.5">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>

          <div className="flex-1 pr-4">
            <h4 className="text-xs font-black text-amber-300 flex items-center gap-1.5 uppercase tracking-wider">
              Pembaruan Sistem Tersedia
              <span className="text-[10px] bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded font-extrabold normal-case">
                Baru
              </span>
            </h4>
            <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
              Terdapat pembaruan data &amp; modul terbaru dari Admin KPPN. Perbarui halaman agar tampilan sinkron dan lancar.
            </p>

            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={handleUpdateNow}
                disabled={isUpdating}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : ''}`} />
                <span>{isUpdating ? 'Memperbarui...' : 'Perbarui Sekarang'}</span>
              </button>

              <button
                onClick={() => setDismissed(true)}
                className="px-2.5 py-1.5 rounded-xl text-[11px] font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Nanti Saja
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
