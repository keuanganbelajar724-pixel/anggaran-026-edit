import React from 'react';
import {
  HelpCircle,
  X,
  Calculator,
  Percent,
  Coins,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Info,
  Scale
} from 'lucide-react';

interface DeviasiHal3LogicModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
}

export const DeviasiHal3LogicModal: React.FC<DeviasiHal3LogicModalProps> = ({
  isOpen,
  onClose,
  isDark = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div
        className={`relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border shadow-2xl transition-all ${
          isDark
            ? 'bg-slate-900 border-slate-700 text-slate-100'
            : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`sticky top-0 z-10 flex items-center justify-between p-5 border-b backdrop-blur-md ${
            isDark
              ? 'bg-slate-900/90 border-slate-800'
              : 'bg-white/90 border-slate-100'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight text-slate-900 dark:text-white">
                  Logika Perhitungan Proporsi Pagu & Deviasi Tertimbang
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                  Kolom R s.d. AB
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Bedah tuntas rumus OM-SPAN, faktor pembobotan, dan independensi pengisian data
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 text-xs leading-relaxed">
          {/* Jawaban Langsung untuk Pertanyaan User */}
          <div
            className={`p-4 rounded-xl border ${
              isDark
                ? 'bg-purple-950/20 border-purple-800/40 text-purple-200'
                : 'bg-purple-50/80 border-purple-200 text-purple-900'
            }`}
          >
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <h4 className="font-black text-sm text-purple-950 dark:text-purple-100">
                  Apakah Harus Mengisi Tab Penyerapan Dulu?
                </h4>
                <p>
                  <strong>Jawabannya: TIDAK HARUS!</strong> Tab Deviasi Halaman III DIPA dirancang mandiri. Anda tidak perlu repot mengisi tab penyerapan terlebih dahulu bila hanya ingin menghitung atau mensimulasikan Halaman III DIPA.
                </p>
                <p>
                  Usulan Anda untuk <strong>menyediakan kolom dan panel Pagu tersendiri di tab Deviasi Halaman III DIPA adalah langkah yang sangat tepat!</strong> Dengan begitu, Anda bisa langsung menginput nominal pagu atau persentase proporsi satker Anda di sini tanpa hambatan.
                </p>
              </div>
            </div>
          </div>

          {/* 1. Mengapa Nilai Deviasi Tertimbang & Proporsi Berbeda? */}
          <div className="space-y-3">
            <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600" />
              1. Mengapa Nilai Proporsi Pagu & Deviasi Tertimbang Bisa Berbeda?
            </h4>
            <p className="text-slate-600 dark:text-slate-300">
              Di OM-SPAN, kolom <strong>R:U (% Proporsi Pagu)</strong> dihitung berdasarkan komposisi Pagu DIPA satker masing-masing, bukan angka tetap acuan nasional:
            </p>

            <div
              className={`p-3.5 rounded-xl border font-mono text-center ${
                isDark ? 'bg-slate-800 border-slate-700 text-purple-300' : 'bg-slate-50 border-slate-200 text-purple-700'
              }`}
            >
              % Proporsi Pagu (Jenis Belanja) = (Pagu Belanja X ÷ Total Pagu DIPA Seluruh Belanja) × 100%
            </div>

            <p className="text-slate-600 dark:text-slate-300">
              Perbandingan pada data Satker Anda (screenshot OM-SPAN 247161):
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div
                className={`p-3.5 rounded-xl border ${
                  isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Template Default Sebelumnya (Generik):
                </div>
                <ul className="space-y-1 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                  <li>• Belanja 51 (Pegawai): <strong>38,09%</strong></li>
                  <li>• Belanja 52 (Barang): <strong>51,59%</strong></li>
                  <li>• Belanja 53 (Modal): <strong>9,34%</strong></li>
                  <li>• Belanja 57 (Bansos): <strong>0,00%</strong></li>
                </ul>
                <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-[10px] text-amber-600 dark:text-amber-400">
                  Hasil Nilai IKPA Bulan 1: <strong>44,52</strong> (karena proporsi 52 terlalu besar yaitu 51,59%)
                </div>
              </div>

              <div
                className={`p-3.5 rounded-xl border ${
                  isDark ? 'bg-emerald-950/20 border-emerald-800/50' : 'bg-emerald-50/80 border-emerald-200'
                }`}
              >
                <div className="font-bold text-emerald-900 dark:text-emerald-300 mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Data Riil Satker Anda (OM-SPAN 247161):
                </div>
                <ul className="space-y-1 text-emerald-800 dark:text-emerald-200 font-mono text-[11px]">
                  <li>• Belanja 51 (Pegawai): <strong>45,75%</strong></li>
                  <li>• Belanja 52 (Barang): <strong>41,98%</strong></li>
                  <li>• Belanja 53 (Modal): <strong>12,27%</strong></li>
                  <li>• Belanja 57 (Bansos): <strong>0,00%</strong></li>
                </ul>
                <div className="mt-2 pt-2 border-t border-emerald-200 dark:border-emerald-800 text-[10px] text-emerald-700 dark:text-emerald-300 font-bold">
                  Hasil Nilai IKPA Bulan 1: Tepat <strong>53,34</strong> (Sesuai persis dengan OM-SPAN!)
                </div>
              </div>
            </div>
          </div>

          {/* 2. Simulasi Detail Perhitungan Satker Anda */}
          <div className="space-y-3">
            <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Calculator className="w-4 h-4 text-emerald-600" />
              2. Bedah Langkah Perhitungan Bulan 01 Satker 247161
            </h4>

            <div
              className={`p-4 rounded-xl border space-y-3 ${
                isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}
            >
              {/* Step 1 */}
              <div className="space-y-1">
                <div className="font-bold text-slate-900 dark:text-white text-[11px] flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-black text-[10px]">
                    1
                  </span>
                  Hitung % Deviasi per Jenis Belanja (Kolom N s.d. Q)
                </div>
                <div className="pl-6 space-y-1 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                  <div>• Belanja 51: |1.360.767.000 - 1.220.727.139| ÷ 1.360.767.000 × 100% = <strong>10,29%</strong></div>
                  <div>• Belanja 52: |524.526.060 - 330.040| ÷ 524.526.060 × 100% = <strong>99,94%</strong></div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="space-y-1">
                <div className="font-bold text-slate-900 dark:text-white text-[11px] flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md bg-amber-500/10 text-amber-600 flex items-center justify-center font-black text-[10px]">
                    2
                  </span>
                  Hitung % Deviasi Tertimbang (Kolom V s.d. Y) = (% Deviasi × % Proporsi Pagu) ÷ 100
                </div>
                <div className="pl-6 space-y-1 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                  <div>• Belanja 51: (10,29% × <strong>45,75%</strong>) ÷ 100 = <strong>4,71%</strong> (Kolom V)</div>
                  <div>• Belanja 52: (99,94% × <strong>41,98%</strong>) ÷ 100 = <strong>41,95%</strong> (Kolom W)</div>
                  <div>• Belanja 53: (0,00% × 12,27%) ÷ 100 = <strong>0,00%</strong> (Kolom X)</div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="space-y-1">
                <div className="font-bold text-slate-900 dark:text-white text-[11px] flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md bg-orange-500/10 text-orange-600 flex items-center justify-center font-black text-[10px]">
                    3
                  </span>
                  Total Deviasi & Nilai Akhir IKPA (Kolom Z, AA, AB)
                </div>
                <div className="pl-6 space-y-1 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                  <div>• Total Seluruh Belanja (Kolom Z) = 4,71% + 41,95% + 0% = <strong>46,66%</strong></div>
                  <div>• Rata-rata Kumulatif (Kolom AA) = <strong>46,66%</strong></div>
                  <div>• Nilai IKPA (Kolom AB) = 100 - 46,66 = <strong className="text-emerald-600 dark:text-emerald-400">53,34</strong></div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Fitur Baru yang Disediakan */}
          <div className="space-y-2">
            <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Coins className="w-4 h-4 text-amber-600" />
              3. Fitur Pagu & Proporsi yang Telah Kami Sediakan
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
              <div
                className={`p-3 rounded-xl border ${
                  isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="font-bold text-slate-900 dark:text-white mb-1">
                  1. Panel Pengaturan Pagu DIPA (Atas Tabel)
                </div>
                <p className="text-slate-500 dark:text-slate-400">
                  Anda bisa menginput nominal Pagu (51, 52, 53, 57) atau mengetik langsung persentase proporsi (% 51, 52, 53, 57), lalu klik <strong>"Terapkan ke Semua Bulan"</strong>.
                </p>
              </div>

              <div
                className={`p-3 rounded-xl border ${
                  isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="font-bold text-slate-900 dark:text-white mb-1">
                  2. Kolom Pagu DIPA di Tabel & Edit Sel R:U
                </div>
                <p className="text-slate-500 dark:text-slate-400">
                  Tersedia tombol toggle <strong>"Tampilkan Kolom Pagu di Tabel"</strong> untuk melihat nominal pagu per bulan, dan sel pada Kolom R:U kini dapat diedit langsung per baris.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          className={`sticky bottom-0 z-10 flex items-center justify-end p-4 border-t backdrop-blur-md ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-100'
          }`}
        >
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition-colors"
          >
            Saya Mengerti
          </button>
        </div>
      </div>
    </div>
  );
};
