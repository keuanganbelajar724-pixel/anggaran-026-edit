import React from 'react';
import { downloadExcelTemplate } from '../utils/excelProcessor';
import { 
  BookOpen, 
  Download, 
  CheckCircle2, 
  Sparkles, 
  FileSpreadsheet, 
  HelpCircle,
  Zap,
  ShieldCheck
} from 'lucide-react';

export const ExcelGuideModal: React.FC = () => {
  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 rounded-2xl text-white border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full text-xs font-bold mb-2">
            <BookOpen className="w-3.5 h-3.5" />
            DOKUMENTASI SISTEM &amp; FORMAT EXCEL
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">
            Panduan Pengolahan Data Excel Mentah IKPA
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl">
            Sistem pengolah data otomatis KPPN Semarang I dirancang toleran terhadap format file Excel mentah yang berbeda-beda dari OM-SPAN, SAKTI, maupun rekap manual.
          </p>
        </div>

        <button
          onClick={downloadExcelTemplate}
          className="bg-indigo-500 hover:bg-indigo-400 text-white font-extrabold text-xs sm:text-sm px-5 py-3 rounded-xl transition-all shadow-lg flex items-center gap-2 self-start md:self-center cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Download Template Standard (.xlsx)</span>
        </button>
      </div>

      {/* Guide Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Card 1: Apa Saja yang Diperbaiki Otomatis */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <span>Fitur Perbaikan Otomatis ("Otomatis Perbaiki")</span>
          </h3>

          <ul className="space-y-3 text-xs text-slate-700">
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 block font-bold">Standardisasi Kode Satker (6 Digit)</strong>
                Aplikasi otomatis menambahkan digit nol di depan jika kode terpotong (misal <code>15432</code> menjadi <code>015432</code>).
              </div>
            </li>

            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 block font-bold">Pembersihan Teks &amp; Spasi Liar</strong>
                Otomatis menghapus spasi ganda, spasi di awal/akhir kata, dan karakter rahasia Excel yang sering membuat error pencarian.
              </div>
            </li>

            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 block font-bold">Konversi Format Angka &amp; Persentase</strong>
                Format seperti <code>Rp 150.000.000,00</code>, <code>85,50%</code>, atau <code>90.5 </code> otomatis diubah menjadi angka JavaScript murni.
              </div>
            </li>

            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 block font-bold">Kalkulasi Ulang Nilai IKPA DJPb</strong>
                Jika kolom nilai total kosong, sistem menghitung otomatis berdasarkan 8 bobot indikator resmi Peraturan Dirjen Perbendaharaan.
              </div>
            </li>

            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 block font-bold">Deteksi Masalah &amp; Flag Risiko</strong>
                Satker dengan status Capaian Output belum terlaporkan, IKPA &lt; 87.50, atau penyerapan &lt; 70% otomatis ditandai dengan peringatan khusus.
              </div>
            </li>
          </ul>
        </div>

        {/* Card 2: Pemetaan Kolom Excel */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
            <span>Fleksibilitas Nama Kolom Excel</span>
          </h3>

          <p className="text-xs text-slate-600">
            Sistem mengenali berbagai variasi nama header kolom secara cerdas. Berikut contoh nama kolom yang didukung:
          </p>

          <div className="space-y-2 text-xs">
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-900 block">Kode Satker:</span>
              <code className="text-indigo-700 text-[11px]">Kode Satker, Kode, KdSatker, SatkerCode</code>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-900 block">Nama Satker:</span>
              <code className="text-indigo-700 text-[11px]">Nama Satker, Satker, NmSatker, Nama</code>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-900 block">Pagu &amp; Realisasi:</span>
              <code className="text-indigo-700 text-[11px]">Pagu Anggaran, Realisasi, Penyerapan, % Penyerapan</code>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-900 block">8 Indikator IKPA:</span>
              <code className="text-indigo-700 text-[11px]">Revisi DIPA, Deviasi Hal III DIPA, Capaian Output, Belanja Kontraktual, Penyelesaian Tagihan, UP TUP, Dispensasi SPM</code>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-900 block">Kontak PIC:</span>
              <code className="text-indigo-700 text-[11px]">Nama PIC, No HP PIC, Email PIC, Alamat</code>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
