import React, { useState } from 'react';
import {
  Calculator,
  X,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Zap,
  Info,
  Layers,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  FileSpreadsheet
} from 'lucide-react';
import { IndicatorResult } from '../../../models/ikpa';
import { ValidationIssue } from '../../../utils/indikatorValidation';

interface IndikatorCalculateModalProps {
  isOpen: boolean;
  onClose: () => void;
  indicatorKey: string;
  indicatorName: string;
  weight: number;
  indicatorResult: IndicatorResult;
  validationIssues: ValidationIssue[];
  satkerName?: string;
  isDark?: boolean;
}

export const IndikatorCalculateModal: React.FC<IndikatorCalculateModalProps> = ({
  isOpen,
  onClose,
  indicatorKey,
  indicatorName,
  weight,
  indicatorResult,
  validationIssues,
  satkerName = 'SATKER',
  isDark = false
}) => {
  const [copied, setCopied] = useState(false);
  const [isDataConfirmed, setIsDataConfirmed] = useState(false);

  if (!isOpen) return null;

  const rawValue = indicatorResult.rawValue ?? 0;
  const cappedValue = indicatorResult.cappedValue ?? 0;
  const weightedValue = indicatorResult.weightedValue ?? (cappedValue * (weight / 100));
  const errorCount = validationIssues.filter(i => i.severity === 'error').length;
  const warningCount = validationIssues.filter(i => i.severity === 'warning').length;

  const handleCopySummary = () => {
    const lines = [
      `=== RINGKASAN PERHITUNGAN INDIKATOR IKPA 2026 ===`,
      `Satker        : ${satkerName}`,
      `Indikator     : ${indicatorName}`,
      `Bobot         : ${weight}%`,
      `Nilai Mentah  : ${rawValue.toFixed(2)}`,
      `Nilai Akhir   : ${cappedValue.toFixed(2)} (Maks 100)`,
      `Nilai Tertimbang : ${weightedValue.toFixed(2)} poin`,
      `Status Data   : ${errorCount > 0 ? `Terdapat ${errorCount} kesalahan isian` : warningCount > 0 ? `Terdapat ${warningCount} peringatan data` : 'Semua data valid'}`,
      `Waktu Audit   : ${new Date().toLocaleString('id-ID')}`,
      `-------------------------------------------------`,
      `Langkah Perhitungan:`,
      ...(indicatorResult.details || []).map((d, i) => ` ${i + 1}. ${d.step}: ${d.value} (${d.formulaHuman || ''})`),
      `=================================================`
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Rekomendasi dinamis berdasarkan nilai indikator
  const getIndicatorAdvice = () => {
    if (cappedValue >= 95) {
      return {
        tone: 'excellent',
        title: 'Kinerja Sangat Baik',
        text: 'Nilai indikator ini sudah optimal (Kategori Sangat Baik). Pertahankan kepatuhan jadwal dan akurasi data sampai akhir tahun anggaran.'
      };
    }
    if (cappedValue >= 80) {
      return {
        tone: 'good',
        title: 'Kinerja Baik - Masih Bisa Ditingkatkan',
        text: 'Nilai indikator dalam batas aman, namun masih terdapat potensi peningkatan menuju 100 dengan meminimalisir deviasi atau mempercepat siklus transaksi.'
      };
    }
    return {
      tone: 'critical',
      title: 'Perhatian Khusus Diperlukan',
      text: 'Nilai indikator masih di bawah target minimal (80.00). Periksa kembali data transaksi, ajukan revisi RPD Hal III bila diperlukan, dan percepat penyampaian SPM ke KPPN.'
    };
  };

  const advice = getIndicatorAdvice();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in">
      <div
        className={`w-full max-w-3xl rounded-2xl border shadow-2xl transition-all max-h-[90vh] flex flex-col overflow-hidden ${
          isDark
            ? 'border-slate-800 bg-slate-900 text-slate-100'
            : 'border-slate-200 bg-white text-slate-900'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between border-b px-6 py-4 shrink-0 ${
            isDark ? 'border-slate-800 bg-slate-900/80' : 'border-slate-100 bg-slate-50/80'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base tracking-tight">{indicatorName}</h3>
                <span className="rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 px-2 py-0.5 text-xs font-mono font-bold">
                  Bobot {weight}%
                </span>
              </div>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Hasil Kalkulasi Mandiri & Audit Validasi Data Satker
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`rounded-lg p-2 transition-colors cursor-pointer ${
              isDark
                ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800'
            }`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Note: Realtime explanation */}
          <div
            className={`p-3.5 rounded-xl border flex items-start gap-2.5 ${
              isDark
                ? 'bg-blue-950/20 border-blue-900/50 text-blue-300'
                : 'bg-blue-50/80 border-blue-200 text-blue-800'
            }`}
          >
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Info Sistem:</strong> Perhitungan di simulator ini sebenarnya berjalan{' '}
              <strong>otomatis secara real-time</strong> setiap kali data berubah. Panel ini
              disediakan khusus bagi Satker yang ingin menguji dan melihat audit nilai per indikator
              secara mandiri, memverifikasi kevalidan data, serta memastikan tidak ada kesalahan input.
            </p>
          </div>

          {/* 3 Main Result Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Card 1: Nilai Akhir Capped */}
            <div
              className={`p-4 rounded-xl border ${
                isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                Nilai Akhir Indikator
              </div>
              <div className="text-3xl font-mono font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {cappedValue.toFixed(2)}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Nilai Mentah: <span className="font-mono font-semibold">{rawValue.toFixed(2)}</span>{' '}
                {rawValue > 100 ? '(Capped 100)' : ''}
              </div>
            </div>

            {/* Card 2: Nilai Tertimbang */}
            <div
              className={`p-4 rounded-xl border ${
                isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                Kontribusi ke IKPA Total
              </div>
              <div className="text-3xl font-mono font-bold text-blue-600 dark:text-blue-400 mt-1">
                {weightedValue.toFixed(2)}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Nilai Akhir × {weight}%
              </div>
            </div>

            {/* Card 3: Status Validasi */}
            <div
              className={`p-4 rounded-xl border ${
                errorCount > 0
                  ? isDark
                    ? 'bg-rose-950/20 border-rose-900/60 text-rose-300'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                  : warningCount > 0
                    ? isDark
                      ? 'bg-amber-950/20 border-amber-900/60 text-amber-300'
                      : 'bg-amber-50 border-amber-200 text-amber-800'
                    : isDark
                      ? 'bg-emerald-950/20 border-emerald-900/60 text-emerald-300'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}
            >
              <div className="text-[10px] uppercase font-semibold opacity-75 tracking-wider">
                Status Validasi Data
              </div>
              <div className="text-lg font-bold mt-1 flex items-center gap-1.5">
                {errorCount > 0 ? (
                  <>
                    <AlertTriangle className="h-5 w-5 text-rose-600" />
                    <span>{errorCount} Isian Salah</span>
                  </>
                ) : warningCount > 0 ? (
                  <>
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                    <span>{warningCount} Peringatan</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <span>Semua Valid</span>
                  </>
                )}
              </div>
              <div className="text-[11px] opacity-80 mt-0.5">
                {errorCount === 0 && warningCount === 0
                  ? 'Data siap dihitung dan sesuai standar'
                  : 'Periksa daftar kesalahan di bawah'}
              </div>
            </div>
          </div>

          {/* Validation Issues Checklist (If Any) */}
          {validationIssues.length > 0 && (
            <div
              className={`p-4 rounded-xl border ${
                isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Daftar Isian yang Perlu Dikonfirmasi ({validationIssues.length} Item)
                </h4>

                <button
                  onClick={() => setIsDataConfirmed(!isDataConfirmed)}
                  type="button"
                  className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-all cursor-pointer ${
                    isDataConfirmed
                      ? 'bg-emerald-500 text-white border-emerald-600'
                      : 'bg-white dark:bg-slate-700 border-slate-300 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <ShieldCheck className="h-3 w-3" />
                  {isDataConfirmed ? 'Sudah Dikonfirmasi' : 'Konfirmasi Telah Diperiksa'}
                </button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {validationIssues.map((v, i) => (
                  <div
                    key={v.id || i}
                    className={`p-2.5 rounded-lg border flex items-start justify-between gap-2 text-[11px] ${
                      v.severity === 'error'
                        ? 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300'
                        : 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300'
                    }`}
                  >
                    <div>
                      <span className="font-bold">{v.rowIdentifier}</span> •{' '}
                      <span className="font-medium">{v.fieldLabel}</span>: {v.message}
                      <div className="text-slate-500 dark:text-slate-400 text-[10px] mt-0.5">
                        Saran: {v.suggestion}
                      </div>
                    </div>
                    <span className="font-mono font-bold shrink-0">{String(v.currentValue)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step-by-Step Calculation Details */}
          <div>
            <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-emerald-600" />
              Rincian Tahapan & Komponen Perhitungan
            </h4>

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  <tr>
                    <th className="p-2.5 font-semibold">Tahap / Variabel</th>
                    <th className="p-2.5 font-semibold">Rumus / Formula</th>
                    <th className="p-2.5 font-semibold text-right">Nilai</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(indicatorResult.details || []).map((detail, index) => (
                    <tr
                      key={index}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="p-2.5 font-medium text-slate-800 dark:text-slate-200">
                        {detail.step}
                        {detail.note && (
                          <div className="text-[10px] text-slate-400 font-normal">
                            {detail.note}
                          </div>
                        )}
                      </td>
                      <td className="p-2.5 font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                        {detail.formulaHuman || detail.formulaTechnical || '-'}
                      </td>
                      <td className="p-2.5 font-mono font-bold text-slate-800 dark:text-slate-100 text-right">
                        {typeof detail.value === 'number'
                          ? Number(detail.value).toLocaleString('id-ID', {
                              maximumFractionDigits: 2
                            })
                          : detail.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Advice & Recommendation */}
          <div
            className={`p-3.5 rounded-xl border ${
              advice.tone === 'excellent'
                ? isDark
                  ? 'bg-emerald-950/20 border-emerald-900/50 text-emerald-300'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : advice.tone === 'good'
                  ? isDark
                    ? 'bg-blue-950/20 border-blue-900/50 text-blue-300'
                    : 'bg-blue-50 border-blue-200 text-blue-900'
                  : isDark
                    ? 'bg-rose-950/20 border-rose-900/50 text-rose-300'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            <div className="font-bold flex items-center gap-1.5 mb-1">
              <TrendingUp className="h-4 w-4" />
              <span>Analisis & Rekomendasi: {advice.title}</span>
            </div>
            <p className="leading-relaxed text-xs opacity-90">{advice.text}</p>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          className={`flex flex-wrap items-center justify-between border-t px-6 py-4 gap-3 shrink-0 ${
            isDark ? 'border-slate-800 bg-slate-900/90' : 'border-slate-100 bg-slate-50/90'
          }`}
        >
          <button
            onClick={handleCopySummary}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer shadow-2xs"
          >
            {copied ? (
              <Check className="h-4 w-4 text-emerald-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            <span>{copied ? 'Tersalin ke Clipboard!' : 'Salin Ringkasan Nilai'}</span>
          </button>

          <button
            onClick={onClose}
            type="button"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors cursor-pointer shadow-xs"
          >
            <span>Tutup & Kembali ke Tabel</span>
          </button>
        </div>
      </div>
    </div>
  );
};
