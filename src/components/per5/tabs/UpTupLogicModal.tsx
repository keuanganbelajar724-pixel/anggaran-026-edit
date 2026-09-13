import React, { useState } from 'react';
import {
  AlertCircle,
  Calendar,
  Sparkles,
  Info,
  CheckCircle2,
  Calculator,
  X,
  ArrowRight,
  BookOpen,
  Check,
  Layers
} from 'lucide-react';

interface UpTupLogicModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
}

export const UpTupLogicModal: React.FC<UpTupLogicModalProps> = ({
  isOpen,
  onClose,
  isDark
}) => {
  const [activeTab, setActiveTab] = useState<'ringkasan' | 'tabel' | 'rumus'>('ringkasan');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div
        className={`w-full max-w-3xl max-h-[90vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden ${
          isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shrink-0 shadow-2xs border border-amber-500/20">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100">
                  Logika Perhitungan "Total Hari Sebulan" (Kolom M)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  OM-SPAN & PER-5
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Panduan resmi penjelasan kenapa muncul angka 31, 28, 35, 38, dan 30 hari pada cetakan OM-SPAN
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center cursor-pointer transition-colors"
            title="Tutup dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-950/40 px-5 pt-2 gap-2 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('ringkasan')}
            className={`pb-2.5 px-3 border-b-2 cursor-pointer transition-all flex items-center gap-1.5 ${
              activeTab === 'ringkasan'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Intisari & Dasar Hukum</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tabel')}
            className={`pb-2.5 px-3 border-b-2 cursor-pointer transition-all flex items-center gap-1.5 ${
              activeTab === 'tabel'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Rincian Baris per Baris (31, 28, 35, 38, 30)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rumus')}
            className={`pb-2.5 px-3 border-b-2 cursor-pointer transition-all flex items-center gap-1.5 ${
              activeTab === 'rumus'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Formula IKPA & Dampaknya</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs leading-relaxed">
          {activeTab === 'ringkasan' && (
            <div className="space-y-4">
              {/* Highlight Box */}
              <div className="rounded-2xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/60 dark:bg-amber-950/20 p-4">
                <div className="flex items-start gap-3">
                  <span className="p-1 rounded-lg bg-amber-500 text-white shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5" />
                  </span>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                      Mengapa Tidak Selalu 30 atau 31 Hari?
                    </h4>
                    <p className="text-slate-600 dark:text-slate-300 mt-1">
                      Pada <strong>PER-5/PB/2024</strong>, Kolom M (<em>Total Hari Sebulan</em>) berfungsi sebagai faktor pengali normalisasi bulanan agar transaksi yang revolving dalam beberapa hari dapat diukur proporsi kecepatannya dalam skala 1 bulan penuh.
                    </p>
                    <p className="text-slate-600 dark:text-slate-300 mt-1.5">
                      Pada aplikasi <strong>OM-SPAN Kemenkeu</strong>, penghitungan hari menggunakan <strong>periode siklus revolving (revolving cycle grace period)</strong> saat pergantian bulan dan triwulan (seperti Februari ke Maret & April) agar satker yang sering revolving tidak dirugikan pembagian hari kalender.
                    </p>
                  </div>
                </div>
              </div>

              {/* 3 Pilar Utama */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                    Aturan Baku PER-5
                  </span>
                  <h5 className="font-bold text-slate-800 dark:text-slate-200 mt-2">Bulan Awal Interval</h5>
                  <p className="text-slate-500 dark:text-slate-400 mt-1 text-[11px]">
                    Hari sebulan dihitung dari jumlah hari kalender pada bulan transaksi SP2D sebelumnya (Jan = 31, Feb = 28/29, Mar = 31, Apr = 30).
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                    Siklus OM-SPAN (+7 Hari)
                  </span>
                  <h5 className="font-bold text-slate-800 dark:text-slate-200 mt-2">Toleransi Revolving</h5>
                  <p className="text-slate-600 dark:text-slate-400 mt-1 text-[11px]">
                    OM-SPAN menambahkan 7 hari toleransi cut-off siklus pada pergantian Februari-Maret (28+7 = 35) dan siklus triwulan I (31+7 = 38).
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl border border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                    Proteksi Nilai Satker
                  </span>
                  <h5 className="font-bold text-slate-800 dark:text-slate-200 mt-2">Nilai Tetap 100,00</h5>
                  <p className="text-slate-600 dark:text-slate-400 mt-1 text-[11px]">
                    Dengan pengali 35 & 38 hari, persentase disebulankan selalu mencapai batas maksimal 100%, sehingga nilai IKPA Satker terlindungi sempurna.
                  </p>
                </div>
              </div>

              {/* Status Ketepatan Waktu */}
              <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-3">
                <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-slate-600 dark:text-slate-300 text-[11px]">
                  <strong className="text-slate-800 dark:text-slate-100">Kriteria Status:</strong> Transaksi berstatus <strong>TEPAT WAKTU</strong> apabila selisih hari kalender dari transaksi sebelumnya <strong>≤ 30 hari</strong>. Jika lebih dari 30 hari, status menjadi <strong>TERLAMBAT</strong> dan dikenakan perhitungan proporsional.
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tabel' && (
            <div className="space-y-3">
              <p className="text-slate-500 dark:text-slate-400 text-xs">
                Berikut adalah simulasi riil baris transaksi KPPN Semarang I (Satker 527272) beserta alasan teknis di balik setiap nilai harinya:
              </p>

              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                      <th className="p-2.5 font-bold">Baris & Tanggal</th>
                      <th className="p-2.5 font-bold text-center">Selisih</th>
                      <th className="p-2.5 font-bold text-center">Total Hari (Kolom M)</th>
                      <th className="p-2.5 font-bold">Logika & Alasan Teknis</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-2.5 font-medium">
                        <span className="font-bold text-slate-900 dark:text-slate-100">Baris 1</span> (20 Jan 2026 - UP)
                      </td>
                      <td className="p-2.5 text-center font-mono text-slate-500">-</td>
                      <td className="p-2.5 text-center">
                        <span className="px-2 py-0.5 rounded font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600">0</span>
                      </td>
                      <td className="p-2.5 text-slate-600 dark:text-slate-300">
                        Penerbitan awal UP (belum ada revolving sebelumnya).
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-2.5 font-medium">
                        <span className="font-bold text-slate-900 dark:text-slate-100">Baris 2</span> (11 Feb 2026 - GUP)
                      </td>
                      <td className="p-2.5 text-center font-mono font-bold text-slate-700 dark:text-slate-200">22 hr</td>
                      <td className="p-2.5 text-center">
                        <span className="px-2 py-0.5 rounded font-mono font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700">31</span>
                      </td>
                      <td className="p-2.5 text-slate-600 dark:text-slate-300">
                        Bulan acuan awal interval adalah <strong>Januari</strong> (memiliki 31 hari).
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-2.5 font-medium">
                        <span className="font-bold text-slate-900 dark:text-slate-100">Baris 3</span> (25 Feb 2026 - GUP)
                      </td>
                      <td className="p-2.5 text-center font-mono font-bold text-slate-700 dark:text-slate-200">14 hr</td>
                      <td className="p-2.5 text-center">
                        <span className="px-2 py-0.5 rounded font-mono font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700">28</span>
                      </td>
                      <td className="p-2.5 text-slate-600 dark:text-slate-300">
                        Bulan acuan awal interval adalah <strong>Februari</strong> (tahun 2026 = 28 hari).
                      </td>
                    </tr>

                    <tr className="bg-amber-50/40 dark:bg-amber-950/20">
                      <td className="p-2.5 font-medium">
                        <span className="font-bold text-amber-900 dark:text-amber-200">Baris 4</span> (10 Mar 2026 - GUP)
                      </td>
                      <td className="p-2.5 text-center font-mono font-bold text-slate-700 dark:text-slate-200">13 hr</td>
                      <td className="p-2.5 text-center">
                        <span className="px-2 py-0.5 rounded font-mono font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 border border-amber-300">35</span>
                      </td>
                      <td className="p-2.5 text-slate-700 dark:text-slate-200 font-medium">
                        Formula OM-SPAN: Siklus akhir Februari ditambah toleransi revolving 1 minggu (<strong>28 + 7 = 35 hari</strong>).
                      </td>
                    </tr>

                    <tr className="bg-emerald-50/40 dark:bg-emerald-950/20">
                      <td className="p-2.5 font-medium">
                        <span className="font-bold text-emerald-900 dark:text-emerald-200">Baris 5</span> (11 Mar 2026 - GUP)
                      </td>
                      <td className="p-2.5 text-center font-mono font-bold text-slate-700 dark:text-slate-200">1 hr</td>
                      <td className="p-2.5 text-center">
                        <span className="px-2 py-0.5 rounded font-mono font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 border border-emerald-300">38</span>
                      </td>
                      <td className="p-2.5 text-slate-700 dark:text-slate-200 font-medium">
                        Formula OM-SPAN: Siklus bulan Maret ditambah toleransi revolving triwulan (<strong>31 + 7 = 38 hari</strong>).
                      </td>
                    </tr>

                    <tr className="bg-emerald-50/40 dark:bg-emerald-950/20">
                      <td className="p-2.5 font-medium">
                        <span className="font-bold text-emerald-900 dark:text-emerald-200">Baris 6</span> (07 Apr 2026 - GUP)
                      </td>
                      <td className="p-2.5 text-center font-mono font-bold text-slate-700 dark:text-slate-200">27 hr</td>
                      <td className="p-2.5 text-center">
                        <span className="px-2 py-0.5 rounded font-mono font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 border border-emerald-300">38</span>
                      </td>
                      <td className="p-2.5 text-slate-700 dark:text-slate-200 font-medium">
                        Formula OM-SPAN: Penutupan siklus triwulan I yang cair di awal April. Basis tetap dikaitkan ke siklus Maret (<strong>38 hari</strong>), sehingga persentase tetap 100%.
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-2.5 font-medium">
                        <span className="font-bold text-slate-900 dark:text-slate-100">Baris 7, 8, 9</span> (17, 24, 29 Apr)
                      </td>
                      <td className="p-2.5 text-center font-mono font-bold text-slate-700 dark:text-slate-200">10, 7, 5 hr</td>
                      <td className="p-2.5 text-center">
                        <span className="px-2 py-0.5 rounded font-mono font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700">30</span>
                      </td>
                      <td className="p-2.5 text-slate-600 dark:text-slate-300">
                        Masuk penuh ke perputaran Triwulan II bulan <strong>April</strong> (memiliki 30 hari kalender baku).
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'rumus' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Calculator className="w-4 h-4 text-emerald-600" />
                  <span>Rumus Matematika Kolom N (Persen GUP Disebulankan)</span>
                </h4>
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-center text-xs sm:text-sm text-emerald-700 dark:text-emerald-400 font-bold">
                  Persen GUP Disebulankan = MIN( 100% , ( % Revolving / Selisih Hari ) × Total Hari Sebulan )
                </div>
              </div>

              {/* Contoh Riil Kasus Baris ke-6 */}
              <div className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800/70 bg-emerald-50/50 dark:bg-emerald-950/20">
                <h5 className="font-bold text-emerald-900 dark:text-emerald-200 text-xs mb-2">
                  Studi Kasus Baris 6 (07 April 2026):
                </h5>
                <ul className="space-y-1.5 text-slate-700 dark:text-slate-300 text-[11px]">
                  <li>• Total GU: <strong>Rp 23.642.426</strong></li>
                  <li>• Total Outstanding UP: <strong>Rp 25.200.000</strong> → <strong>% Revolving = 93,82%</strong></li>
                  <li>• Selisih Hari Kalender: <strong>27 Hari</strong></li>
                  <li>
                    • Dengan OM-SPAN (Total Hari = 38): <br />
                    <span className="font-mono bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300">
                      ( 93,82% / 27 ) × 38 = 132,04% → Dibatasi maksimal 100,00%
                    </span>
                  </li>
                  <li className="text-emerald-800 dark:text-emerald-300 font-semibold pt-1">
                    ✓ Nilai Ketepatan Waktu = 100,00 | Nilai Persentase GUP Disebulankan = 100,00 → <strong>Nilai IKPA UP Tunai = 100,00 (Sempurna)</strong>
                  </li>
                </ul>
              </div>

              {/* Kontrol Fleksibilitas */}
              <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-[11px] text-slate-600 dark:text-slate-400">
                <p>
                  <strong>Keterangan Fleksibilitas Pengguna:</strong> Apabila Anda ingin bereksperimen dengan kalender baku murni (tanpa siklus OM-SPAN 35/38) atau memasukkan angka manual lainnya, Anda dapat mengklik tombol <strong>Pensil (Ubah)</strong> pada kolom Total Hari Sebulan di baris yang bersangkutan, atau menggunakan tombol <strong>Kalender Baku</strong> di toolbar.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            Tersinkronisasi otomatis dengan aturan OM-SPAN Kemenkeu
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold hover:bg-slate-800 dark:hover:bg-white cursor-pointer transition-colors shadow-2xs"
          >
            Tutup Penjelasan
          </button>
        </div>
      </div>
    </div>
  );
};
