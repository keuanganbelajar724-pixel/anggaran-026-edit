import React, { useState } from 'react';
import { DiagnostikCaputResult, DiagnostikCaputROItem } from '../types';
import { 
  X, 
  Download, 
  Copy, 
  Check, 
  FileSpreadsheet, 
  FileText, 
  CheckCircle2, 
  Sparkles, 
  Filter,
  Layers,
  ArrowDownToLine
} from 'lucide-react';

interface SaktiBatchPayloadExportModalProps {
  data: DiagnostikCaputResult | null;
  isOpen: boolean;
  onClose: () => void;
  customRefMap?: Record<string, string>;
  customNarrativeMap?: Record<string, string>;
  isDark?: boolean;
}

export const SaktiBatchPayloadExportModal: React.FC<SaktiBatchPayloadExportModalProps> = ({
  data,
  isOpen,
  onClose,
  customRefMap = {},
  customNarrativeMap = {},
  isDark = false
}) => {
  const [exportScope, setExportScope] = useState<'ALL' | 'BERMASALAH_ONLY' | 'OPTIMAL_ONLY'>('ALL');
  const [includeHeaders, setIncludeHeaders] = useState<boolean>(true);
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  if (!isOpen || !data) return null;

  const satkerCode = data.summary.satkerCode || 'Satker';
  const periode = data.summary.periode;

  // Filter items
  const exportItems = data.items.filter(it => {
    if (exportScope === 'BERMASALAH_ONLY') {
      return it.diagnosaSeverity !== 'OPTIMAL' || it.validasiSaktiCode !== '00' || it.nilaiKomponenRo < 100;
    }
    if (exportScope === 'OPTIMAL_ONLY') {
      return it.diagnosaSeverity === 'OPTIMAL' && it.validasiSaktiCode === '00';
    }
    return true;
  });

  // Generate Tab-Delimited text (Excel Clipboard compatible)
  const generateTabDelimited = (): string => {
    const rows: string[] = [];
    if (includeHeaders) {
      rows.push(['No', 'Kode RO', 'Nama Rincian Output', 'Target Vol (TVRO)', 'Satuan', 'Realisasi Vol (RVRO)', 'Target Fisik (TPCRO %)', 'Realisasi Fisik (PCRO %)', 'Penyerapan (PPA %)', 'Nilai Z (IKPA)', 'Kode Referensi SAKTI', 'Uraian Referensi', 'Narasi Keterangan 3 Elemen'].join('\t'));
    }

    exportItems.forEach((ro, idx) => {
      const refCode = customRefMap[ro.id] || ro.rekomendasiRefCode || ro.kodeRefOriginal || '01';
      const refName = ro.rekomendasiRefName || 'Tahapan Pelaksanaan Belum Selesai';
      const narrative = (customNarrativeMap[ro.id] || ro.smartNarrativeDraft || ro.keterangan || '').replace(/[\t\r\n]+/g, ' ');

      rows.push([
        (idx + 1).toString(),
        ro.kodeRo,
        ro.namaRo,
        ro.targetVolume.toString(),
        ro.satuan || 'Layanan',
        ro.realisasiVolume.toString(),
        ro.targetProgres.toFixed(2),
        ro.realisasiProgres.toFixed(2),
        ro.realisasiAnggaran.toFixed(2),
        ro.nilaiKomponenRo.toFixed(2),
        refCode,
        refName,
        narrative
      ].join('\t'));
    });

    return rows.join('\n');
  };

  // Generate CSV text
  const generateCSV = (): string => {
    const rows: string[] = [];
    if (includeHeaders) {
      rows.push(['No', 'Kode RO', 'Nama Rincian Output', 'TVRO', 'Satuan', 'RVRO', 'TPCRO', 'PCRO', 'PPA', 'Nilai Z', 'Kode Referensi', 'Nama Referensi', 'Narasi Keterangan'].map(v => `"${v}"`).join(','));
    }

    exportItems.forEach((ro, idx) => {
      const refCode = customRefMap[ro.id] || ro.rekomendasiRefCode || ro.kodeRefOriginal || '01';
      const refName = ro.rekomendasiRefName || 'Tahapan Pelaksanaan Belum Selesai';
      const narrative = (customNarrativeMap[ro.id] || ro.smartNarrativeDraft || ro.keterangan || '').replace(/"/g, '""');

      rows.push([
        idx + 1,
        `"${ro.kodeRo}"`,
        `"${ro.namaRo.replace(/"/g, '""')}"`,
        ro.targetVolume,
        `"${ro.satuan || 'Layanan'}"`,
        ro.realisasiVolume,
        ro.targetProgres.toFixed(2),
        ro.realisasiProgres.toFixed(2),
        ro.realisasiAnggaran.toFixed(2),
        ro.nilaiKomponenRo.toFixed(2),
        `"${refCode}"`,
        `"${refName.replace(/"/g, '""')}"`,
        `"${narrative}"`
      ].join(','));
    });

    return rows.join('\n');
  };

  // Generate SAKTI Quick Matrix (Simplified 4-column payload for operator typing)
  const generateSaktiPayload = (): string => {
    const rows: string[] = [];
    rows.push(['Kode RO', 'PCRO (%)', 'RVRO', 'Kode Ref', 'Narasi Keterangan SAKTI'].join('\t'));

    exportItems.forEach(ro => {
      const refCode = customRefMap[ro.id] || ro.rekomendasiRefCode || ro.kodeRefOriginal || '01';
      const narrative = (customNarrativeMap[ro.id] || ro.smartNarrativeDraft || ro.keterangan || '').replace(/[\t\r\n]+/g, ' ');
      rows.push([
        ro.kodeRo,
        ro.realisasiProgres.toFixed(2),
        ro.realisasiVolume.toString(),
        refCode,
        narrative
      ].join('\t'));
    });

    return rows.join('\n');
  };

  const handleCopy = (formatType: 'EXCEL_TABLE' | 'SAKTI_PAYLOAD' | 'CSV') => {
    let content = '';
    if (formatType === 'EXCEL_TABLE') content = generateTabDelimited();
    else if (formatType === 'SAKTI_PAYLOAD') content = generateSaktiPayload();
    else content = generateCSV();

    navigator.clipboard.writeText(content);
    setCopiedFormat(formatType);
    setTimeout(() => setCopiedFormat(null), 2500);
  };

  const handleDownloadCSV = () => {
    const csvContent = generateCSV();
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Rekap_Caput_SAKTI_${satkerCode}_${periode.replace(/[^a-zA-Z0-9]/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className={`relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden ${
        isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-current/10 bg-indigo-600 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/20">
              <ArrowDownToLine className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-black leading-tight">
                Batch Payload Exporter &amp; Rekapitulasi SAKTI 2026
              </h3>
              <p className="text-xs text-indigo-100 font-medium">
                Salin Cepat Format Input SAKTI / Unduh Data Siap Olah Spreadsheet
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/20 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Cakupan Data yang Diekspor:
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setExportScope('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    exportScope === 'ALL'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : isDark ? 'bg-slate-700 text-slate-300' : 'bg-white text-slate-700 border border-slate-200'
                  }`}
                >
                  Semua Output ({data.items.length})
                </button>
                <button
                  onClick={() => setExportScope('BERMASALAH_ONLY')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    exportScope === 'BERMASALAH_ONLY'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : isDark ? 'bg-slate-700 text-amber-300' : 'bg-white text-amber-700 border border-slate-200'
                  }`}
                >
                  ⚠️ Bermasalah Saja ({data.items.filter(it => it.diagnosaSeverity !== 'OPTIMAL' || it.nilaiKomponenRo < 100).length})
                </button>
                <button
                  onClick={() => setExportScope('OPTIMAL_ONLY')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    exportScope === 'OPTIMAL_ONLY'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : isDark ? 'bg-slate-700 text-emerald-300' : 'bg-white text-emerald-700 border border-slate-200'
                  }`}
                >
                  ✅ Optimal Saja ({data.items.filter(it => it.diagnosaSeverity === 'OPTIMAL' && it.validasiSaktiCode === '00').length})
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeHeaders}
                  onChange={(e) => setIncludeHeaders(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Sertakan Baris Judul (Header)</span>
              </label>
            </div>
          </div>

          {/* 3 Export Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: 1-Click SAKTI Operator Payload */}
            <div className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 ${
              isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-indigo-50/50 border-indigo-200'
            }`}>
              <div>
                <div className="flex items-center gap-2 font-bold text-xs text-indigo-700 dark:text-cyan-300 mb-1">
                  <Sparkles className="w-4 h-4" />
                  <span>Payload Input SAKTI</span>
                </div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  Format Ringkas Operator SAKTI
                </h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Kolom esensial: Kode RO, PCRO, RVRO, Kode Ref, dan Narasi 3 Elemen. Sangat pas untuk operator yang menginput manual baris demi baris di SAKTI.
                </p>
              </div>

              <button
                onClick={() => handleCopy('SAKTI_PAYLOAD')}
                className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  copiedFormat === 'SAKTI_PAYLOAD'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20'
                }`}
              >
                {copiedFormat === 'SAKTI_PAYLOAD' ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Tersalin ke Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Salin Format SAKTI</span>
                  </>
                )}
              </button>
            </div>

            {/* Card 2: Full Excel Clipboard Table */}
            <div className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 ${
              isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-emerald-50/50 border-emerald-200'
            }`}>
              <div>
                <div className="flex items-center gap-2 font-bold text-xs text-emerald-700 dark:text-emerald-300 mb-1">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Excel Paste Ready</span>
                </div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  Tabel Lengkap Siap Paste Excel
                </h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Tab-delimited 13 kolom lengkap: TVRO, RVRO, TPCRO, PCRO, PPA, Nilai Z, Uraian Ref, dan Narasi 3 Elemen. Tinggal <em>Ctrl+V</em> di lembar Excel.
                </p>
              </div>

              <button
                onClick={() => handleCopy('EXCEL_TABLE')}
                className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  copiedFormat === 'EXCEL_TABLE'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20'
                }`}
              >
                {copiedFormat === 'EXCEL_TABLE' ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Tersalin ke Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Salin Tabel Excel</span>
                  </>
                )}
              </button>
            </div>

            {/* Card 3: Download CSV */}
            <div className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 ${
              isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}>
              <div>
                <div className="flex items-center gap-2 font-bold text-xs text-slate-700 dark:text-slate-300 mb-1">
                  <Download className="w-4 h-4" />
                  <span>File Download (.csv)</span>
                </div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  Unduh File CSV / Spreadsheet
                </h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Unduh berkas CSV UTF-8 dengan pemisah koma terstandar untuk arsip atau pengolahan lanjutan di Microsoft Excel / Google Sheets.
                </p>
              </div>

              <button
                onClick={handleDownloadCSV}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-black dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Unduh File CSV (.csv)</span>
              </button>
            </div>
          </div>

          {/* Data Preview Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Pratinjau Data Output ({exportItems.length} RO):
              </span>
              <span className="text-[11px] text-slate-400">
                Nilai narasi otomatis menyertakan modifikasi kustom Anda
              </span>
            </div>

            <div className="max-h-64 overflow-y-auto border border-current/10 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className={`text-[11px] font-bold uppercase tracking-wider sticky top-0 ${
                  isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                }`}>
                  <tr>
                    <th className="p-2.5">No</th>
                    <th className="p-2.5">Kode RO</th>
                    <th className="p-2.5">Nama RO</th>
                    <th className="p-2.5 text-center">PCRO</th>
                    <th className="p-2.5 text-center">RVRO</th>
                    <th className="p-2.5 text-center">Ref</th>
                    <th className="p-2.5">Narasi 3 Elemen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-current/5">
                  {exportItems.map((ro, idx) => {
                    const refCode = customRefMap[ro.id] || ro.rekomendasiRefCode || ro.kodeRefOriginal || '01';
                    const narrative = customNarrativeMap[ro.id] || ro.smartNarrativeDraft || ro.keterangan || '-';

                    return (
                      <tr key={ro.id} className="hover:bg-slate-500/5">
                        <td className="p-2.5 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="p-2.5 font-mono font-bold text-indigo-600 dark:text-cyan-400 whitespace-nowrap">{ro.kodeRo}</td>
                        <td className="p-2.5 max-w-xs truncate font-medium">{ro.namaRo}</td>
                        <td className="p-2.5 text-center font-mono font-bold">{ro.realisasiProgres.toFixed(1)}%</td>
                        <td className="p-2.5 text-center font-mono">{ro.realisasiVolume}</td>
                        <td className="p-2.5 text-center font-mono font-bold text-indigo-600">{refCode}</td>
                        <td className="p-2.5 max-w-sm truncate text-slate-500 text-[11px]">{narrative}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-current/10 bg-slate-50 dark:bg-slate-800/60">
          <div className="text-[11px] text-slate-500">
            💡 Format tab-delimited dapat langsung di-paste ke aplikasi Excel tanpa format yang rusak.
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
