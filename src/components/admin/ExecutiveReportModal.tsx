import React, { useRef } from 'react';
import { 
  FileText, 
  Printer, 
  X, 
  ShieldCheck, 
  Sparkles
} from 'lucide-react';
import { SatkerIKPA, DashboardConfig } from '../../types';

interface ExecutiveReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  satkers: SatkerIKPA[];
  dashboardConfig: DashboardConfig;
  isDark?: boolean;
}

export const ExecutiveReportModal: React.FC<ExecutiveReportModalProps> = ({
  isOpen,
  onClose,
  satkers,
  dashboardConfig,
  isDark = false
}) => {
  const printContentRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // Compute key analytics
  const totalSatker = satkers.length;
  const totalIKPA = satkers.reduce((acc, s) => acc + (s.nilaiTotalIKPA || 0), 0);
  const avgIKPA = totalSatker > 0 ? (totalIKPA / totalSatker).toFixed(2) : '0.00';
  const avgNum = parseFloat(avgIKPA);

  // Distribution
  const sangatBaik = satkers.filter(s => (s.nilaiTotalIKPA || 0) >= 95);
  const baik = satkers.filter(s => (s.nilaiTotalIKPA || 0) >= 89 && (s.nilaiTotalIKPA || 0) < 95);

  // Red attention satkers (<89 or incomplete outputs or deviasi > 10)
  const attentionSatkers = satkers
    .filter(s => (s.nilaiTotalIKPA || 0) < 89 || (s.indikator?.capaianOutput !== undefined && s.indikator.capaianOutput < 90) || s.statusCapaianOutput !== 'Sudah Terlaporkan')
    .sort((a, b) => (a.nilaiTotalIKPA || 0) - (b.nilaiTotalIKPA || 0));

  // Bottom 7 / Priority Satkers
  const bottomSatkers = attentionSatkers.slice(0, 7);

  // Indicator analysis across all satkers
  const avgDeviasi = (satkers.reduce((acc, s) => acc + (s.indikator?.deviasiHal3Dipa || 0), 0) / (totalSatker || 1)).toFixed(2);
  const avgPenyerapan = (satkers.reduce((acc, s) => acc + (s.persenPenyerapan || s.indikator?.penyerapanAnggaran || 0), 0) / (totalSatker || 1)).toFixed(2);
  const avgOutput = (satkers.reduce((acc, s) => acc + (s.indikator?.capaianOutput || 0), 0) / (totalSatker || 1)).toFixed(2);
  const avgUP = (satkers.reduce((acc, s) => acc + (s.indikator?.pengelolaanUPTUP || 0), 0) / (totalSatker || 1)).toFixed(2);

  const currentDateStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className={`relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden ${
        isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        
        {/* Header Action Bar (Not Printed) */}
        <div className="print:hidden p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center">
              <FileText className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 bg-indigo-500/20 text-indigo-300 text-[10px] font-black px-2 py-0.5 rounded-full mb-0.5">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>EXECUTIVE REPORT GENERATOR</span>
              </div>
              <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
                Laporan Eksekutif Kinerja IKPA KPPN Semarang I
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-black shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Simpan PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Report Content Body (Printable Area) */}
        <div className="p-4 sm:p-8 overflow-y-auto print:p-0 print:overflow-visible">
          <div 
            ref={printContentRef}
            className="bg-white text-slate-900 p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-sm max-w-[850px] mx-auto print:border-none print:shadow-none print:p-0 print:max-w-none text-xs font-sans space-y-6"
            style={{ minHeight: '1000px' }}
          >
            
            {/* Kop Surat KPPN */}
            <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-slate-600 tracking-wider uppercase block">
                  KEMENTERIAN KEUANGAN REPUBLIK INDONESIA
                </span>
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                  DIREKTORAT JENDERAL PERBENDAHARAAN • KANTOR PELAYANAN PERBENDAHARAAN NEGARA SEMARANG I
                </h2>
                <p className="text-[10px] text-slate-500">
                  Jl. Ki Mangunsarkoro No. 34, Semarang • Seksi Manajemen Satker dan Kepatuhan Internal (MSKI)
                </p>
              </div>

              <div className="text-right shrink-0">
                <div className="inline-block px-3 py-1 bg-indigo-900 text-white font-black text-[11px] rounded-lg tracking-wider">
                  KPPN 026
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-1">
                  Tanggal: {currentDateStr}
                </div>
              </div>
            </div>

            {/* Document Title */}
            <div className="text-center space-y-1 py-1">
              <h1 className="text-base font-black uppercase tracking-wider text-slate-900">
                LAPORAN EKSEKUTIF KINERJA PELAKSANAAN ANGGARAN (IKPA)
              </h1>
              <p className="text-xs text-slate-600 font-medium">
                Evaluasi Kepatuhan, Kinerja 8 Indikator IKPA, &amp; Prioritas Pendampingan Satuan Kerja Mitra
              </p>
            </div>

            {/* Section 1: Ringkasan Eksekutif Makro */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-black uppercase text-indigo-900 border-l-4 border-indigo-600 pl-2">
                I. Ringkasan Eksekutif &amp; Capaian Makro KPPN Semarang I
              </h3>

              <div className="grid grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-500 font-bold block">Rata-Rata IKPA KPPN</span>
                  <span className={`text-xl font-black block mt-0.5 ${
                    avgNum >= 95 ? 'text-emerald-700' : avgNum >= 89 ? 'text-indigo-700' : 'text-amber-700'
                  }`}>
                    {avgIKPA}
                  </span>
                  <span className="text-[9px] font-bold text-slate-500">
                    {avgNum >= 95 ? 'Sangat Baik' : avgNum >= 89 ? 'Baik' : 'Perlu Akselerasi'}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-500 font-bold block">Total Satker Terdata</span>
                  <span className="text-xl font-black text-slate-800 block mt-0.5">{totalSatker}</span>
                  <span className="text-[9px] font-bold text-slate-500">Satuan Kerja Mitra</span>
                </div>

                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 text-center">
                  <span className="text-[10px] text-emerald-800 font-bold block">Satker Kategori Baik/Sangat Baik</span>
                  <span className="text-xl font-black text-emerald-700 block mt-0.5">
                    {sangatBaik.length + baik.length}
                  </span>
                  <span className="text-[9px] font-bold text-emerald-600">
                    {totalSatker > 0 ? (((sangatBaik.length + baik.length) / totalSatker) * 100).toFixed(1) : 0}% Kepatuhan
                  </span>
                </div>

                <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-200 text-center">
                  <span className="text-[10px] text-rose-800 font-bold block">Satker Perlu Pendampingan</span>
                  <span className="text-xl font-black text-rose-700 block mt-0.5">
                    {attentionSatkers.length}
                  </span>
                  <span className="text-[9px] font-bold text-rose-600">
                    Nilai IKPA &lt; 89 / Output Rendah
                  </span>
                </div>
              </div>
            </div>

            {/* Section 2: Analisis Rata-Rata Indikator Krusial */}
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase text-indigo-900 border-l-4 border-indigo-600 pl-2">
                II. Analisis Rata-Rata 4 Indikator Krusial KPPN
              </h3>

              <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
                <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
                  <span className="text-[10px] text-slate-500 font-semibold block">Deviasi Hal III DIPA</span>
                  <span className="text-sm font-black text-slate-800">{avgDeviasi}</span>
                </div>
                <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
                  <span className="text-[10px] text-slate-500 font-semibold block">Penyerapan Anggaran</span>
                  <span className="text-sm font-black text-slate-800">{avgPenyerapan}</span>
                </div>
                <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
                  <span className="text-[10px] text-slate-500 font-semibold block">Capaian Output SAKTI</span>
                  <span className="text-sm font-black text-slate-800">{avgOutput}</span>
                </div>
                <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
                  <span className="text-[10px] text-slate-500 font-semibold block">Pengelolaan UP &amp; TUP</span>
                  <span className="text-sm font-black text-slate-800">{avgUP}</span>
                </div>
              </div>
            </div>

            {/* Section 3: Daftar Satker Prioritas Pendampingan Khusus */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase text-rose-900 border-l-4 border-rose-600 pl-2">
                  III. Daftar Prioritas Satker Perlu Pendampingan Khusus (Atensi Merah)
                </h3>
                <span className="text-[10px] text-slate-500 font-semibold">
                  Menampilkan {bottomSatkers.length} Satker Terbawah
                </span>
              </div>

              <table className="w-full border-collapse border border-slate-300 text-[10px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-black">
                    <th className="border border-slate-300 p-1.5 text-center w-8">No</th>
                    <th className="border border-slate-300 p-1.5 text-center w-16">Kode</th>
                    <th className="border border-slate-300 p-1.5 text-left">Nama Satuan Kerja</th>
                    <th className="border border-slate-300 p-1.5 text-center w-16">Deviasi DIPA</th>
                    <th className="border border-slate-300 p-1.5 text-center w-16">Penyerapan</th>
                    <th className="border border-slate-300 p-1.5 text-center w-16">Output</th>
                    <th className="border border-slate-300 p-1.5 text-center w-16">Total IKPA</th>
                    <th className="border border-slate-300 p-1.5 text-left w-36">Fokus Kendala</th>
                  </tr>
                </thead>
                <tbody>
                  {bottomSatkers.map((s, idx) => {
                    const kendala: string[] = [];
                    const deviasiVal = Number(s.indikator?.deviasiHal3Dipa) || 100;
                    const penyerapanVal = Number(s.persenPenyerapan ?? s.indikator?.penyerapanAnggaran) || 100;
                    const outputVal = Number(s.indikator?.capaianOutput) || 100;
                    const upVal = Number(s.indikator?.pengelolaanUPTUP) || 100;

                    if (deviasiVal < 85) kendala.push('Deviasi Hal III');
                    if (penyerapanVal < 85) kendala.push('Penyerapan Rendah');
                    if (outputVal < 85 || s.statusCapaianOutput !== 'Sudah Terlaporkan') kendala.push('Konfirmasi Output');
                    if (upVal < 85) kendala.push('Revolving UP');

                    return (
                      <tr key={s.kodeSatker} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        <td className="border border-slate-300 p-1.5 text-center font-bold">{idx + 1}</td>
                        <td className="border border-slate-300 p-1.5 text-center font-mono font-bold text-slate-700">{s.kodeSatker}</td>
                        <td className="border border-slate-300 p-1.5 font-bold text-slate-800">{s.namaSatker}</td>
                        <td className="border border-slate-300 p-1.5 text-center">{(Number.isFinite(deviasiVal) ? deviasiVal : 0).toFixed(1)}</td>
                        <td className="border border-slate-300 p-1.5 text-center">{(Number.isFinite(penyerapanVal) ? penyerapanVal : 0).toFixed(1)}</td>
                        <td className="border border-slate-300 p-1.5 text-center font-bold text-rose-700">{(Number.isFinite(outputVal) ? outputVal : 0).toFixed(1)}</td>
                        <td className="border border-slate-300 p-1.5 text-center font-black text-rose-700">{(Number.isFinite(s.nilaiTotalIKPA) ? s.nilaiTotalIKPA : 0).toFixed(2)}</td>
                        <td className="border border-slate-300 p-1.5 text-slate-600 font-medium">
                          {kendala.length > 0 ? kendala.join(', ') : 'Nilai Komposit Rendah'}
                        </td>
                      </tr>
                    );
                  })}
                  {bottomSatkers.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-4 text-center text-slate-500 font-bold">
                        Seluruh Satker Memiliki Nilai IKPA Memenuhi Standar (&gt;= 89.00)
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Section 4: Rekomendasi & Rencana Aksi */}
            <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <h3 className="text-xs font-black uppercase text-slate-900">
                IV. Rekomendasi Tindak Lanjut &amp; Akselerasi KPPN:
              </h3>
              <ol className="list-decimal list-inside space-y-1 text-[10px] text-slate-700 leading-relaxed font-medium">
                <li>Melakukan pemanggilan dan asistensi khusus (*one-on-one pendampingan*) kepada <b>{attentionSatkers.length} Satker</b> yang berada pada kategori Cukup/Kurang.</li>
                <li>Mendorong satker untuk melakukan percepatan revolving Uang Persediaan (UP) sebelum jatuh tempo 30 hari kalender.</li>
                <li>Mewajibkan Satker mengonfirmasi data Capaian Output pada aplikasi SAKTI sebelum tanggal 5 bulan berikutnya.</li>
                <li>Melakukan rekonsiliasi rencana penarikan dana (RPD) pada Halaman III DIPA pada awal triwulan berjalan guna meminimalisir deviasi.</li>
              </ol>
            </div>

            {/* Tanda Tangan Pimpinan */}
            <div className="pt-6 grid grid-cols-2 text-center text-[10px]">
              <div>
                <span className="text-slate-500 block">Mengetahui,</span>
                <span className="font-bold text-slate-800 block">Kepala Kantor KPPN Semarang I</span>
                <div className="h-16 flex items-center justify-center text-slate-300 italic">
                  (Tanda Tangan &amp; Cap Dinas)
                </div>
                <span className="font-bold text-slate-900 block underline uppercase">
                  {dashboardConfig?.contactPerson?.name || 'Kepala KPPN Semarang I'}
                </span>
                <span className="text-slate-500 block">NIP. 19750815 199602 1 001</span>
              </div>

              <div>
                <span className="text-slate-500 block">Semarang, {currentDateStr}</span>
                <span className="font-bold text-slate-800 block">Kepala Seksi MSKI KPPN Semarang I</span>
                <div className="h-16 flex items-center justify-center text-slate-300 italic">
                  (Tanda Tangan &amp; Cap Dinas)
                </div>
                <span className="font-bold text-slate-900 block underline uppercase">
                  Seksi Manajemen Satker &amp; Kepatuhan Internal
                </span>
                <span className="text-slate-500 block">KPPN Semarang I</span>
              </div>
            </div>

          </div>
        </div>

        {/* Footer info (Not Printed) */}
        <div className="print:hidden px-6 py-3 bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Format Laporan Resmi A4 Siap Cetak &amp; Disposisi Pimpinan</span>
          </div>
          <span className="font-mono text-[11px]">KPPN Semarang I • DJPb Kemenkeu</span>
        </div>

      </div>
    </div>
  );
};
