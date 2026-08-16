import React, { useState } from 'react';
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Upload,
  Clock,
  Building2,
  ArrowRight,
  ShieldAlert,
  Loader2,
  ChevronRight,
  Info
} from 'lucide-react';
import { ExcelValidationPreview } from '../types';

interface ModularUploadConfirmModalProps<T> {
  preview: ExcelValidationPreview<T> | null;
  isOpen: boolean;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  modulName: string;
}

export function ModularUploadConfirmModal<T>({
  preview,
  isOpen,
  isLoading,
  onConfirm,
  onCancel,
  title,
  modulName
}: ModularUploadConfirmModalProps<T>) {
  const [activeTab, setActiveTab] = useState<'VALID' | 'INVALID' | 'UNREGISTERED'>('VALID');

  if (!isOpen || !preview) return null;

  const validCount = preview.validData.length;
  const invalidCount = preview.invalidRows.length;
  const unregCount = preview.unregisteredSatkers.length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 text-[11px] font-black uppercase tracking-wider">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>PREVIEW & VALIDASI UPLOAD EXCEL {modulName}</span>
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">
              {title}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              File: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{preview.fileName}</span> (Periode: <span className="font-bold text-sky-600">{preview.periode}</span>)
            </p>
          </div>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl text-lg font-bold"
          >
            ✕
          </button>
        </div>

        {/* Summary Status Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-4 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Data Satker Valid</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
              {validCount} <span className="text-xs font-normal">Satker</span>
            </div>
            <p className="text-[10px] text-emerald-600 mt-0.5">Siap diimpor ke dashboard</p>
          </div>

          <div className={`p-4 rounded-2xl border ${
            unregCount > 0
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
              : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">Satker Belum Terdaftar</span>
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black mt-1">
              {unregCount} <span className="text-xs font-normal">Satker</span>
            </div>
            <p className="text-[10px] text-amber-600 mt-0.5">Tidak ada di Master Referensi</p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Total Baris Terbaca</span>
              <Building2 className="w-4 h-4 text-slate-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
              {preview.totalRows} <span className="text-xs font-normal">Baris</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">Seluruh rekaman dalam Excel</p>
          </div>
        </div>

        {/* Warning If Unregistered Satkers Exist */}
        {unregCount > 0 && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl space-y-1.5">
            <div className="flex items-center gap-2 text-rose-800 dark:text-rose-200 font-bold text-xs">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Validasi Master Satker Menemukan {unregCount} Satker Tidak Terdaftar</span>
            </div>
            <p className="text-xs text-rose-700 dark:text-rose-300 leading-relaxed">
              Data dari {unregCount} satker tersebut <strong>tidak akan dimasukkan ke dashboard</strong> untuk menjaga integritas data KPPN 026. Anda dapat menambahkan satker tersebut ke <strong>Tab Referensi Satker</strong> terlebih dahulu jika satker tersebut valid.
            </p>
          </div>
        )}

        {/* Preview Tabs */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            <button
              onClick={() => setActiveTab('VALID')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'VALID'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              Data Valid ({validCount})
            </button>
            {unregCount > 0 && (
              <button
                onClick={() => setActiveTab('UNREGISTERED')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'UNREGISTERED'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                }`}
              >
                Satker Tidak Ditemukan ({unregCount})
              </button>
            )}
            {invalidCount > 0 && (
              <button
                onClick={() => setActiveTab('INVALID')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'INVALID'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                }`}
              >
                Data Ditolak ({invalidCount})
              </button>
            )}
          </div>

          {/* Tab Content Preview */}
          <div className="max-h-60 overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-2">
            {activeTab === 'VALID' && (
              <div className="space-y-1.5 text-xs">
                {preview.validData.slice(0, 100).map((item: any, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sky-600 dark:text-sky-400">{item.kodeSatker}</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{item.namaSatker}</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-md">
                      Valid
                    </span>
                  </div>
                ))}
                {validCount > 100 && (
                  <div className="text-center text-xs text-slate-400 py-2">
                    ...dan {validCount - 100} data satker valid lainnya
                  </div>
                )}
              </div>
            )}

            {activeTab === 'UNREGISTERED' && (
              <div className="space-y-1.5 text-xs">
                {preview.unregisteredSatkers.map((unreg, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/60 flex items-center justify-between">
                    <div>
                      <div className="font-mono font-black text-amber-700 dark:text-amber-400">{unreg.kodeSatker}</div>
                      <div className="text-slate-700 dark:text-slate-300 font-semibold">{unreg.namaSatker || 'Nama Satker Tidak Diketahui'}</div>
                    </div>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-md">
                      {unreg.reason}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'INVALID' && (
              <div className="space-y-1.5 text-xs">
                {preview.invalidRows.map((inv, idx) => (
                  <div key={idx} className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800/60 flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-slate-500 mr-2">Baris #{inv.rowNumber}</span>
                      <span className="font-mono font-black text-rose-600">{inv.kodeSatker || '-'}</span>
                      <span className="ml-2 text-slate-700 dark:text-slate-300">{inv.namaSatker || ''}</span>
                    </div>
                    <span className="text-[10px] text-rose-600 font-bold">{inv.reason}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs cursor-pointer transition-all"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading || validCount === 0}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan Data ({validCount} Satker)...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>KONFIRMASI & IMPORT {validCount} DATA VALID</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
