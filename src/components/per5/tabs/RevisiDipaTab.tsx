import React, { useState } from 'react';
import {
  FileText,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Calculator,
  Info,
  Layers
} from 'lucide-react';
import { SimulationProject, RevisiDIPAInput } from '../../../models/ikpa';
import { DAFTAR_14_JENIS_REVISI_DIPA } from '../../../utils/excelReferenceDataHelper';

interface RevisiDipaTabProps {
  project: SimulationProject;
  onUpdateProject: (updated: SimulationProject) => void;
  onOpenInspector: (title: string, cell: string, formula: string, score: string, details: any[]) => void;
  isDark?: boolean;
}

export const RevisiDipaTab: React.FC<RevisiDipaTabProps> = ({
  project,
  onUpdateProject,
  onOpenInspector,
  isDark = false
}) => {
  const result = project.output?.indicators.revisiDIPA;
  const rows = project.revisiDIPA;

  const handleUpdateRow = (index: number, field: keyof RevisiDIPAInput, value: any) => {
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], [field]: value };
    onUpdateProject({ ...project, revisiDIPA: newRows });
  };

  const handleAddRow = () => {
    const nextNo = rows.length + 1;
    const newRow: RevisiDIPAInput = {
      no: nextNo,
      periode: String(Math.min(12, nextNo)).padStart(2, '0'),
      revisiKe: nextNo,
      tanggalRevisi: '',
      kodeJenisRevisi: '201',
      paguDipaSebelum: 0,
      paguDipaMenjadi: 0,
      jenisRevisi14: 'tidak',
      keterangan: nextNo <= 6 ? 'Semester I' : 'Semester II'
    };
    onUpdateProject({ ...project, revisiDIPA: [...rows, newRow] });
  };

  const handleDeleteRow = (index: number) => {
    const newRows = rows.filter((_, i) => i !== index);
    onUpdateProject({ ...project, revisiDIPA: newRows });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner Card */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border p-5 ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-mono font-semibold text-emerald-600">
              Bobot 10% | Sel M15
            </span>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
              Simulasi Indikator Revisi DIPA
            </h3>
          </div>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Maks. 1 kali revisi yang diperhitungkan per semester. 14 jenis revisi (kode 201-214) tidak mengurangi nilai.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-[11px] text-slate-400 uppercase block font-medium">Nilai Akhir (M15)</span>
            <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              {result ? result.cappedValue.toFixed(2) : '0.00'}
            </div>
          </div>
          <button
            onClick={() => onOpenInspector(
              'Indikator Revisi DIPA',
              'M15',
              '=MIN(100, M15)',
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

      {/* 14 Types of Revisi Reference Callout */}
      <div className={`rounded-xl border p-4 text-xs ${
        isDark ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex items-center gap-2 font-semibold text-slate-850 dark:text-slate-200 mb-2">
          <Info className="h-4 w-4 text-blue-500" />
          Daftar 14 Jenis Revisi yang Tidak Diperhitungkan (Pengecualian / Tidak Mengurangi Nilai):
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 font-mono text-[11px]">
          {DAFTAR_14_JENIS_REVISI_DIPA.map(j => (
            <div key={j.kode} className="flex items-start gap-1.5 text-slate-600 dark:text-slate-400">
              <span className="font-bold text-emerald-600 dark:text-emerald-400">[{j.kode}]</span>
              <span className="font-sans text-[11px]">{j.uraian}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Table of Revisions */}
      <div className={`rounded-2xl border overflow-hidden shadow-xs ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <h4 className="font-semibold text-sm">Daftar Riwayat & Usulan Revisi DIPA</h4>
          <button
            onClick={handleAddRow}
            className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" /> Tambah Baris Revisi
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className={`border-b font-semibold ${
              isDark ? 'bg-slate-800/60 text-slate-300 border-slate-800' : 'bg-slate-50 text-slate-700 border-slate-200'
            }`}>
              <tr>
                <th className="px-3 py-2.5">No</th>
                <th className="px-3 py-2.5">Bulan/Periode</th>
                <th className="px-3 py-2.5">Revisi Ke</th>
                <th className="px-3 py-2.5">Kode Revisi</th>
                <th className="px-3 py-2.5">Termasuk 14 Jenis?</th>
                <th className="px-3 py-2.5">Semester</th>
                <th className="px-3 py-2.5">Pagu DIPA Sebelum</th>
                <th className="px-3 py-2.5">Pagu DIPA Menjadi</th>
                <th className="px-3 py-2.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map((r, idx) => (
                <tr key={idx} className={isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50/70'}>
                  <td className="px-3 py-2 font-mono font-medium">{r.no}</td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={r.periode}
                      onChange={e => handleUpdateRow(idx, 'periode', e.target.value)}
                      className="w-14 rounded-md border px-2 py-1 font-mono text-xs dark:bg-slate-800 dark:border-slate-700"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      value={r.revisiKe ?? idx + 1}
                      onChange={e => handleUpdateRow(idx, 'revisiKe', Number(e.target.value))}
                      className="w-16 rounded-md border px-2 py-1 font-mono text-xs dark:bg-slate-800 dark:border-slate-700"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={r.kodeJenisRevisi || ''}
                      onChange={e => handleUpdateRow(idx, 'kodeJenisRevisi', e.target.value)}
                      placeholder="e.g. 212, 315"
                      className="w-28 rounded-md border px-2 py-1 font-mono text-xs dark:bg-slate-800 dark:border-slate-700"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={r.jenisRevisi14}
                      onChange={e => handleUpdateRow(idx, 'jenisRevisi14', e.target.value)}
                      className="rounded-md border px-2 py-1 text-xs dark:bg-slate-800 dark:border-slate-700 font-medium"
                    >
                      <option value="ya">Ya (Dikecualikan)</option>
                      <option value="tidak">Tidak (Diperhitungkan)</option>
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={r.keterangan || (Number(r.periode) <= 6 ? 'Semester I' : 'Semester II')}
                      onChange={e => handleUpdateRow(idx, 'keterangan', e.target.value)}
                      className="rounded-md border px-2 py-1 text-xs dark:bg-slate-800 dark:border-slate-700"
                    >
                      <option value="Semester I">Semester I</option>
                      <option value="Semester II">Semester II</option>
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      value={r.paguDipaSebelum || 0}
                      onChange={e => handleUpdateRow(idx, 'paguDipaSebelum', Number(e.target.value))}
                      className="w-32 rounded-md border px-2 py-1 font-mono text-xs text-right dark:bg-slate-800 dark:border-slate-700"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      value={r.paguDipaMenjadi || 0}
                      onChange={e => handleUpdateRow(idx, 'paguDipaMenjadi', Number(e.target.value))}
                      className="w-32 rounded-md border px-2 py-1 font-mono text-xs text-right dark:bg-slate-800 dark:border-slate-700"
                    />
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
