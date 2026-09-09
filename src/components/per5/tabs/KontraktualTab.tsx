import React, { useState } from 'react';
import {
  FileCheck,
  Sliders,
  Calculator,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';
import { SimulationProject, BelanjaKontraktualInput } from '../../../models/ikpa';
import { normalizeDateToIso } from '../../../utils/ikpaDateUtils';

interface KontraktualTabProps {
  project: SimulationProject;
  onUpdateProject: (updated: SimulationProject) => void;
  onOpenInspector: (title: string, cell: string, formula: string, score: string, details: any[]) => void;
  isDark?: boolean;
}

export const KontraktualTab: React.FC<KontraktualTabProps> = ({
  project,
  onUpdateProject,
  onOpenInspector,
  isDark = false
}) => {
  const result = project.output?.indicators.belanjaKontraktual;
  const rows = project.belanjaKontraktual;

  const handleUpdateRow = (index: number, field: keyof BelanjaKontraktualInput, val: any) => {
    const newRows = [...rows];
    const isDateField = field === 'tanggalKontrak' || field === 'tanggalMasuk' || field === 'tanggalPenyelesaian';
    const processedVal = isDateField ? normalizeDateToIso(val) : val;
    newRows[index] = { ...newRows[index], [field]: processedVal };
    onUpdateProject({ ...project, belanjaKontraktual: newRows });
  };

  const handleAddRow = () => {
    const nextNo = rows.length + 1;
    const newRow: BelanjaKontraktualInput = {
      no: nextNo,
      nomorKontrak: `KTR-${String(nextNo).padStart(3, '0')}/2026`,
      jenisBelanja: '53',
      nilaiKontrak: 500000000,
      tanggalKontrak: '2026-02-10',
      tanggalMasuk: '2026-02-12',
      tanggalPenyelesaian: '2026-06-30',
      isEarlyContract: true
    };
    onUpdateProject({ ...project, belanjaKontraktual: [...rows, newRow] });
  };

  const handleDeleteRow = (index: number) => {
    onUpdateProject({
      ...project,
      belanjaKontraktual: rows.filter((_, i) => i !== index)
    });
  };

  // Quick optimization: Make all contracts on-time
  const handleOptimizeAllOnTime = () => {
    const newRows = rows.map(r => {
      // make tanggalMasuk within 2 days of tanggalKontrak
      return {
        ...r,
        tanggalMasuk: r.tanggalKontrak
      };
    });
    onUpdateProject({ ...project, belanjaKontraktual: newRows });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Banner */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border p-5 ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-mono font-semibold text-emerald-600">
              Bobot 10% | Sel N30
            </span>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
              Simulasi Pengelolaan Belanja Kontraktual
            </h3>
          </div>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Formula: (20% * Distribusi Akselerasi) + (40% * Kontrak Dini) + (40% * Akselerasi Belanja Modal 53).
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-[11px] text-slate-400 uppercase block font-medium">Nilai Akhir (N30)</span>
            <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              {result ? result.cappedValue.toFixed(2) : '0.00'}
            </div>
          </div>
          <button
            onClick={() => onOpenInspector(
              'Indikator Belanja Kontraktual',
              'N30',
              '=(20%*Distribusi) + (40%*KontrakDini) + (40%*Akselerasi53)',
              result ? result.cappedValue.toFixed(2) : '0.00',
              result?.details || []
            )}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <Calculator className="h-3.5 w-3.5 text-emerald-600" />
            Formula Inspector
          </button>
        </div>
      </div>

      {/* Component Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'}`}>
          <span className="text-xs font-medium text-slate-500 block">Komponen 1 (Bobot 20%)</span>
          <span className="font-bold text-sm text-slate-800 dark:text-slate-200 block mt-0.5">
            Distribusi Akselerasi Kontrak
          </span>
          <p className="text-[11px] text-slate-400 mt-1">
            Ketepatan pendaftaran SPK/Kontrak ke KPPN dalam batas waktu &lt; 5 hari kerja.
          </p>
        </div>
        <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'}`}>
          <span className="text-xs font-medium text-slate-500 block">Komponen 2 (Bobot 40%)</span>
          <span className="font-bold text-sm text-slate-800 dark:text-slate-200 block mt-0.5">
            Kontrak Dini (Pra-DIPA)
          </span>
          <p className="text-[11px] text-slate-400 mt-1">
            Penandatanganan kontrak sebelum tahun anggaran berjalan atau Januari ({'>='} 110 poin).
          </p>
        </div>
        <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'}`}>
          <span className="text-xs font-medium text-slate-500 block">Komponen 3 (Bobot 40%)</span>
          <span className="font-bold text-sm text-slate-800 dark:text-slate-200 block mt-0.5">
            Akselerasi Belanja Modal 53
          </span>
          <p className="text-[11px] text-slate-400 mt-1">
            Penyelesaian kontrak belanja modal semester I untuk mempercepat perputaran ekonomi.
          </p>
        </div>
      </div>

      {/* Action / Quick Optimize */}
      <div className={`flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border ${
        isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex items-center gap-2">
          <Sliders className="h-4 w-4 text-emerald-600" />
          <span className="text-xs font-semibold">Simulasi Optimasi Cepat:</span>
          <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Setel seluruh pendaftaran kontrak menjadi tepat waktu (&lt; 5 hari)
          </span>
        </div>
        <button
          onClick={handleOptimizeAllOnTime}
          className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors shadow-xs"
        >
          Optimalkan Semua Tepat Waktu
        </button>
      </div>

      {/* Contracts Table */}
      <div className={`rounded-2xl border overflow-hidden shadow-xs ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <h4 className="font-semibold text-sm">Daftar Kontrak / SPK Komitmen</h4>
          <button
            onClick={handleAddRow}
            className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" /> Tambah Kontrak
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className={`border-b font-semibold ${
              isDark ? 'bg-slate-800/60 text-slate-300 border-slate-800' : 'bg-slate-50 text-slate-700 border-slate-200'
            }`}>
              <tr>
                <th className="px-3 py-2.5">No</th>
                <th className="px-3 py-2.5">Nomor Kontrak</th>
                <th className="px-3 py-2.5">Jenis Belanja</th>
                <th className="px-3 py-2.5 text-right">Nilai Kontrak (Rp)</th>
                <th className="px-3 py-2.5">Tgl Kontrak</th>
                <th className="px-3 py-2.5">Tgl Masuk KPPN</th>
                <th className="px-3 py-2.5">Kontrak Dini?</th>
                <th className="px-3 py-2.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
              {rows.map((r, idx) => (
                <tr key={idx} className={isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50/70'}>
                  <td className="px-3 py-2 font-medium">{r.no}</td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={r.nomorKontrak || ''}
                      onChange={e => handleUpdateRow(idx, 'nomorKontrak', e.target.value)}
                      className="w-36 rounded border px-2 py-0.5 text-[11px] dark:bg-slate-800 dark:border-slate-700"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={r.jenisBelanja}
                      onChange={e => handleUpdateRow(idx, 'jenisBelanja', e.target.value)}
                      className="rounded border px-2 py-0.5 text-[11px] font-semibold dark:bg-slate-800 dark:border-slate-700"
                    >
                      <option value="53">53 (Modal)</option>
                      <option value="52">52 (Barang)</option>
                      <option value="51">51 (Pegawai)</option>
                    </select>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <input
                      type="number"
                      value={r.nilaiKontrak}
                      onChange={e => handleUpdateRow(idx, 'nilaiKontrak', Number(e.target.value))}
                      className="w-32 text-right rounded border px-2 py-0.5 text-[11px] dark:bg-slate-800 dark:border-slate-700"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="date"
                      value={normalizeDateToIso(r.tanggalKontrak)}
                      onChange={e => handleUpdateRow(idx, 'tanggalKontrak', e.target.value)}
                      className="w-32 rounded border px-2 py-0.5 text-[11px] font-mono dark:bg-slate-800 dark:border-slate-700"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="date"
                      value={normalizeDateToIso(r.tanggalMasuk)}
                      onChange={e => handleUpdateRow(idx, 'tanggalMasuk', e.target.value)}
                      className="w-32 rounded border px-2 py-0.5 text-[11px] font-mono dark:bg-slate-800 dark:border-slate-700"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={r.isEarlyContract ? 'ya' : 'tidak'}
                      onChange={e => handleUpdateRow(idx, 'isEarlyContract', e.target.value === 'ya')}
                      className="rounded border px-2 py-0.5 text-[11px] dark:bg-slate-800 dark:border-slate-700"
                    >
                      <option value="ya">Ya (Early)</option>
                      <option value="tidak">Tidak</option>
                    </select>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => handleDeleteRow(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
