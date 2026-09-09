import React from 'react';
import {
  Clock,
  Sliders,
  Calculator,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';
import { SimulationProject, PenyelesaianTagihanInput } from '../../../models/ikpa';
import { normalizeDateToIso } from '../../../utils/ikpaDateUtils';

interface TagihanTabProps {
  project: SimulationProject;
  onUpdateProject: (updated: SimulationProject) => void;
  onOpenInspector: (title: string, cell: string, formula: string, score: string, details: any[]) => void;
  isDark?: boolean;
}

export const TagihanTab: React.FC<TagihanTabProps> = ({
  project,
  onUpdateProject,
  onOpenInspector,
  isDark = false
}) => {
  const result = project.output?.indicators.penyelesaianTagihan;
  const rows = project.penyelesaianTagihan;

  const handleUpdateRow = (index: number, field: keyof PenyelesaianTagihanInput, val: any) => {
    const newRows = [...rows];
    const isDateField = field === 'tanggalSP2D' || field === 'tanggalSPM' || field === 'tanggalBAST' || field === 'tanggalBAPP' || field === 'tanggalMulaiPerhitungan' || field === 'tanggalKonversiADK';
    const processedVal = isDateField ? normalizeDateToIso(val) : val;
    newRows[index] = { ...newRows[index], [field]: processedVal };
    onUpdateProject({ ...project, penyelesaianTagihan: newRows });
  };

  const handleAddRow = () => {
    const nextNo = rows.length + 1;
    const newRow: PenyelesaianTagihanInput = {
      no: nextNo,
      nomorSPM: `SPM-${String(nextNo).padStart(4, '0')}/2026`,
      tanggalSPM: '2026-03-10',
      nomorSP2D: `SP2D-${String(nextNo).padStart(5, '0')}`,
      tanggalSP2D: '2026-03-11',
      nilaiSP2D: 150000000,
      tanggalBAST: '2026-03-01',
      tanggalMulaiPerhitungan: '2026-03-01',
      tanggalKonversiADK: '2026-03-10',
      jumlahHariLibur: 2
    };
    onUpdateProject({ ...project, penyelesaianTagihan: [...rows, newRow] });
  };

  const handleDeleteRow = (index: number) => {
    onUpdateProject({
      ...project,
      penyelesaianTagihan: rows.filter((_, i) => i !== index)
    });
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
              Simulasi Penyelesaian Tagihan (SPM LS Kontraktual)
            </h3>
          </div>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Persentase ketepatan waktu pengajuan SPM ke KPPN maksimal 17 hari kerja sejak timbulnya hak tagih (BAST/BAPP).
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
              'Indikator Penyelesaian Tagihan',
              'N30',
              '=ROUND((JumlahSPMTepatWaktu / TotalSPM) * 100, 2)',
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

      {/* Table of Tagihan */}
      <div className={`rounded-2xl border overflow-hidden shadow-xs ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <h4 className="font-semibold text-sm">Daftar SPM LS Kontraktual</h4>
          <button
            onClick={handleAddRow}
            className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" /> Tambah SPM
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className={`border-b font-semibold ${
              isDark ? 'bg-slate-800/60 text-slate-300 border-slate-800' : 'bg-slate-50 text-slate-700 border-slate-200'
            }`}>
              <tr>
                <th className="px-3 py-2.5">No</th>
                <th className="px-3 py-2.5">Nomor SPM</th>
                <th className="px-3 py-2.5">Nomor SP2D</th>
                <th className="px-3 py-2.5 text-right">Nilai SP2D (Rp)</th>
                <th className="px-3 py-2.5">Tgl BAST</th>
                <th className="px-3 py-2.5">Tgl Konversi ADK</th>
                <th className="px-3 py-2.5 text-right">Hari Libur</th>
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
                      value={r.nomorSPM}
                      onChange={e => handleUpdateRow(idx, 'nomorSPM', e.target.value)}
                      className="w-28 rounded border px-2 py-0.5 text-[11px] dark:bg-slate-800 dark:border-slate-700"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={r.nomorSP2D}
                      onChange={e => handleUpdateRow(idx, 'nomorSP2D', e.target.value)}
                      className="w-28 rounded border px-2 py-0.5 text-[11px] dark:bg-slate-800 dark:border-slate-700"
                    />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <input
                      type="number"
                      value={r.nilaiSP2D}
                      onChange={e => handleUpdateRow(idx, 'nilaiSP2D', Number(e.target.value))}
                      className="w-28 text-right rounded border px-2 py-0.5 text-[11px] dark:bg-slate-800 dark:border-slate-700"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="date"
                      value={normalizeDateToIso(r.tanggalBAST || r.tanggalMulaiPerhitungan || '')}
                      onChange={e => handleUpdateRow(idx, 'tanggalBAST', e.target.value)}
                      className="w-32 rounded border px-1.5 py-0.5 text-[11px] font-mono dark:bg-slate-800 dark:border-slate-700"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="date"
                      value={normalizeDateToIso(r.tanggalKonversiADK || '')}
                      onChange={e => handleUpdateRow(idx, 'tanggalKonversiADK', e.target.value)}
                      className="w-32 rounded border px-1.5 py-0.5 text-[11px] font-mono dark:bg-slate-800 dark:border-slate-700"
                    />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <input
                      type="number"
                      value={r.jumlahHariLibur || 0}
                      onChange={e => handleUpdateRow(idx, 'jumlahHariLibur', Number(e.target.value))}
                      className="w-16 text-right rounded border px-2 py-0.5 text-[11px] dark:bg-slate-800 dark:border-slate-700"
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
