import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, CheckCircle2, Globe, Sparkles, Share2, Layers, ShieldCheck, ArrowRight } from 'lucide-react';

interface AndroidInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
}

export const AndroidInstallModal: React.FC<AndroidInstallModalProps> = ({
  isOpen,
  onClose,
  isDark = false
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    } else {
      alert('Untuk memasang aplikasi di Android:\n\n1. Ketuk ikon titik tiga (⋮) di pojok kanan atas browser Google Chrome.\n2. Pilih menu "Tambahkan ke Layar Utama" atau "Install Aplikasi".\n3. Ikon ANGKASA 026 akan langsung muncul di layar HP Anda layaknya aplikasi Play Store!');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className={`relative w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden ${
        isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-lg">
              <Smartphone className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 bg-white/20 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full mb-1">
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>PWA &amp; ANDROID APP RESMI</span>
              </div>
              <h3 className="text-xl font-black tracking-tight">
                Pasang Aplikasi ANGKASA di HP
              </h3>
            </div>
          </div>
          <p className="text-xs text-emerald-100 mt-2 leading-relaxed">
            Akses cepat tanpa perlu mengetik URL. Berjalan ringan, layar penuh (*full-screen*), bebas kuota berulang, dan otomatis tersinkronisasi.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          
          {/* Quick Install Action Box */}
          <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-emerald-50/70 border-emerald-200'
          }`}>
            <div className="space-y-0.5 text-center sm:text-left">
              <h4 className="text-xs font-black text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                Instalasi 1-Klik di Android
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Pasang langsung ke App Drawer &amp; Home Screen Android.
              </p>
            </div>
            <button
              onClick={handleInstallClick}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all shrink-0 hover:scale-105 active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>{isInstalled ? 'Aplikasi Terpasang' : 'Pasang Sekarang'}</span>
            </button>
          </div>

          {/* 3 Step Tutorial */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Cara Pasang Manual Lewat Google Chrome:
            </h4>

            <div className="space-y-2 text-xs">
              <div className={`p-3 rounded-xl border flex items-start gap-3 ${
                isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                  1
                </div>
                <div>
                  <span className="font-bold text-slate-900 dark:text-slate-100 block">Buka Web di Google Chrome Android</span>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">Buka alamat <code>anggaran-026.my.id</code> dari browser HP Anda.</span>
                </div>
              </div>

              <div className={`p-3 rounded-xl border flex items-start gap-3 ${
                isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                  2
                </div>
                <div>
                  <span className="font-bold text-slate-900 dark:text-slate-100 block">Ketuk Menu Titik Tiga (⋮)</span>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">Terletak di pojok kanan atas browser Google Chrome HP Anda.</span>
                </div>
              </div>

              <div className={`p-3 rounded-xl border flex items-start gap-3 ${
                isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                  3
                </div>
                <div>
                  <span className="font-bold text-slate-900 dark:text-slate-100 block">Pilih "Install Aplikasi" / "Tambahkan ke Layar Utama"</span>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">Aplikasi ANGKASA akan otomatis terpasang dengan ikon resmi KPPN Semarang I.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Keunggulan PWA Android */}
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${
              isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="text-slate-600 dark:text-slate-300">Ukuran Ringan (&lt; 2 MB)</span>
            </div>
            <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${
              isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="text-slate-600 dark:text-slate-300">Tampilan Full Screen</span>
            </div>
            <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${
              isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="text-slate-600 dark:text-slate-300">Update Otomatis Realtime</span>
            </div>
            <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${
              isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="text-slate-600 dark:text-slate-300">Aman &amp; Terverifikasi</span>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t flex items-center justify-between ${
          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>KPPN Semarang I • DJPb Kemenkeu</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
