import React from 'react';
import {
  Eraser,
  RotateCcw,
  AlertTriangle,
  X,
  Layers,
  FileSpreadsheet,
  Check
} from 'lucide-react';
import { MasterSimulatorTab } from '../IndikatorPerTabSimulator';

interface KosongkanFormulirModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: MasterSimulatorTab;
  tabTitle: string;
  onClearActiveTab: () => void;
  onClearAllTabs: () => void;
  onLoadSampleWorkbook?: () => void;
  isDark?: boolean;
}

export const KosongkanFormulirModal: React.FC<KosongkanFormulirModalProps> = ({
  isOpen,
  onClose,
  activeTab,
  tabTitle,
  onClearActiveTab,
  onClearAllTabs,
  onLoadSampleWorkbook,
  isDark = false
}) => {
  if (!isOpen) return null;

  const isIndicatorTab = activeTab !== 'interface' && activeTab !== 'skenario';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden flex flex-col ${
          isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-rose-50/50 dark:bg-rose-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50">
              <Eraser className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Kosongkan Formulir Simulasi
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pilih opsi pengosongan data formulir yang Anda inginkan.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="p-3 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/60 dark:bg-amber-950/20 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <span>
              Tindakan ini akan mengosongkan nilai input formulir. Anda dapat memuat kembali data acuan kapan saja melalui tombol <strong>Muat Contoh Workbook</strong>.
            </span>
          </div>

          <div className="space-y-3">
            {/* Opsi 1: Kosongkan Tab Aktif Saja (jika berada di tab indikator) */}
            {isIndicatorTab && (
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2.5 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Layers className="h-4 w-4 text-sky-600" />
                    <span>Kosongkan Tab Ini Saja ({tabTitle})</span>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-800/50">
                    Tab Aktif
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Hanya mengosongkan data pada modul <strong>{tabTitle}</strong>. Data di 6 indikator lainnya tetap aman dan tidak berubah.
                </p>
                <button
                  onClick={() => {
                    onClearActiveTab();
                    onClose();
                  }}
                  className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:border-rose-300 dark:hover:border-rose-800 text-rose-700 dark:text-rose-400 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Eraser className="h-3.5 w-3.5" />
                  <span>Kosongkan Tab "{tabTitle}"</span>
                </button>
              </div>
            )}

            {/* Opsi 2: Kosongkan Seluruh 7 Indikator */}
            <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/10 space-y-2.5 hover:border-rose-300 dark:hover:border-rose-800 transition-colors">
              <div className="flex items-center justify-between">
                <div className="font-bold text-xs text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
                  <Eraser className="h-4 w-4 text-rose-600" />
                  <span>Kosongkan Seluruh Formulir (Semua 7 Indikator)</span>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50">
                  Total Reset
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Mengosongkan seluruh formulir di semua tab (Revisi DIPA, Hal III, Penyerapan, Kontraktual, Tagihan, UP/TUP, Capaian Output, dan Dispensasi). Seluruh nilai IKPA akan kembali ke 0.00 bersih.
              </p>
              <button
                onClick={() => {
                  onClearAllTabs();
                  onClose();
                }}
                className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Eraser className="h-3.5 w-3.5" />
                <span>Kosongkan Seluruh 7 Indikator (Mulai dari 0)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
          {onLoadSampleWorkbook && (
            <button
              onClick={() => {
                onLoadSampleWorkbook();
                onClose();
              }}
              className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium cursor-pointer"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
              <span>Muat Contoh Workbook</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors ml-auto"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
};
