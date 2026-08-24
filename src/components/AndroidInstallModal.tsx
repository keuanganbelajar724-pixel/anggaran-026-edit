import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, CheckCircle2, Globe, Sparkles, Share2, Layers, ShieldCheck, ArrowRight, Compass } from 'lucide-react';

interface AndroidInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
}

type BrowserType = 'chrome' | 'opera' | 'samsung' | 'edge' | 'firefox' | 'safari';

export const AndroidInstallModal: React.FC<AndroidInstallModalProps> = ({
  isOpen,
  onClose,
  isDark = false
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [selectedBrowser, setSelectedBrowser] = useState<BrowserType>('chrome');

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
      alert('Untuk memasang aplikasi di HP:\n\n1. Buka menu browser Anda (titik tiga ⋮ atau garis tiga ☰ atau logo browser).\n2. Pilih "Tambahkan ke Layar Utama" / "Install Aplikasi" / "Add to Home Screen".\n3. Ikon ANGKASA 026 akan langsung muncul di menu HP Anda!');
    }
  };

  if (!isOpen) return null;

  const browserGuides: Record<BrowserType, { name: string; icon: string; steps: string[] }> = {
    chrome: {
      name: 'Google Chrome',
      icon: '🌐',
      steps: [
        'Buka laman anggaran-026.my.id di Google Chrome.',
        'Ketuk ikon titik tiga (⋮) di pojok kanan atas browser.',
        'Pilih opsi "Install Aplikasi" atau "Tambahkan ke Layar Utama".'
      ]
    },
    opera: {
      name: 'Opera / Opera Mini',
      icon: '🔴',
      steps: [
        'Buka laman anggaran-026.my.id di browser Opera.',
        'Ketuk ikon titik tiga (⋮) di pojok kanan atas ATAU logo Opera di kanan bawah.',
        'Pilih "Layar Beranda" / "Home Screen" / "Install App".'
      ]
    },
    samsung: {
      name: 'Samsung Internet',
      icon: '🪐',
      steps: [
        'Buka laman anggaran-026.my.id di Samsung Internet.',
        'Ketuk ikon tanda tambah (+) di bilah alamat, ATAU menu garis tiga (☰) di kanan bawah.',
        'Pilih "Tambahkan halaman ke" -> lalu pilih "Layar Depan".'
      ]
    },
    edge: {
      name: 'Microsoft Edge',
      icon: '🌊',
      steps: [
        'Buka laman anggaran-026.my.id di Microsoft Edge Android.',
        'Ketuk menu titik tiga (...) di bagian bawah browser.',
        'Pilih "Tambahkan ke Layar Utama" / "Install".'
      ]
    },
    firefox: {
      name: 'Mozilla Firefox',
      icon: '🦊',
      steps: [
        'Buka laman anggaran-026.my.id di Mozilla Firefox.',
        'Ketuk ikon titik tiga (⋮) di samping bilah alamat.',
        'Pilih "Pasang" / "Install" ke Layar Beranda.'
      ]
    },
    safari: {
      name: 'iPhone (Safari)',
      icon: '🍏',
      steps: [
        'Buka laman anggaran-026.my.id di Safari iPhone.',
        'Ketuk tombol Bagikan / Share (ikon kotak dengan panah ke atas di bilah bawah).',
        'Gulir ke bawah dan pilih "Add to Home Screen" (Tambah ke Layar Utama).'
      ]
    }
  };

  const activeGuide = browserGuides[selectedBrowser];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className={`relative w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden max-h-[90vh] flex flex-col ${
        isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 p-6 text-white relative shrink-0">
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
                <span>BISA DI SEMUA BROWSER HP (ANDROID &amp; IPHONE)</span>
              </div>
              <h3 className="text-xl font-black tracking-tight">
                Pasang Aplikasi ANGKASA di HP
              </h3>
            </div>
          </div>
          <p className="text-xs text-emerald-100 mt-2 leading-relaxed">
            Dapat dipasang di <b>Chrome, Opera, Samsung Internet, Edge, Firefox, dan Safari iPhone</b> tanpa perlu mengetik URL berulang kali.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          
          {/* Quick Install Action Box */}
          <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-emerald-50/70 border-emerald-200'
          }`}>
            <div className="space-y-0.5 text-center sm:text-left">
              <h4 className="text-xs font-black text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                Instalasi Otomatis
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Pasang langsung ke App Drawer &amp; Home Screen HP Anda.
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

          {/* Browser Selector Tabs */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-emerald-500" />
              <span>Pilih Browser yang Anda Gunakan di HP:</span>
            </label>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-xs font-bold">
              {(Object.keys(browserGuides) as BrowserType[]).map((key) => {
                const b = browserGuides[key];
                const isSelected = selectedBrowser === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedBrowser(key)}
                    className={`py-2 px-1 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md scale-102'
                        : isDark
                          ? 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                          : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span className="text-base">{b.icon}</span>
                    <span className="text-[10px] leading-none text-center truncate w-full px-0.5">{b.name.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step-by-Step for Selected Browser */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center justify-between">
              <span>Panduan Pasang di {activeGuide.name}:</span>
              <span className="text-base">{activeGuide.icon}</span>
            </h4>

            <div className="space-y-2 text-xs">
              {activeGuide.steps.map((step, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border flex items-start gap-3 ${
                    isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </div>
                  <div className="text-slate-700 dark:text-slate-200 font-medium leading-relaxed">
                    {step}
                  </div>
                </div>
              ))}
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
              <span className="text-slate-600 dark:text-slate-300">Bisa Semua Browser HP</span>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t flex items-center justify-between shrink-0 ${
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
