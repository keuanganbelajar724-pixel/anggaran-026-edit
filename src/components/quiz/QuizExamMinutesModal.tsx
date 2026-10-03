import React from 'react';
import { FileText, Printer, X, ShieldCheck, CheckCircle2, AlertTriangle, Users } from 'lucide-react';
import { QuizPackage, QuizResultRecord } from '../../types/quiz';

interface QuizExamMinutesModalProps {
  isOpen: boolean;
  onClose: () => void;
  pkg: QuizPackage | null;
  results: QuizResultRecord[];
}

export const QuizExamMinutesModal: React.FC<QuizExamMinutesModalProps> = ({
  isOpen,
  onClose,
  pkg,
  results
}) => {
  if (!isOpen || !pkg) return null;

  const pkgResults = results.filter(r => r.packageId === pkg.id);
  const totalParticipants = pkgResults.length;
  const passedCount = pkgResults.filter(r => r.passed).length;
  const failedCount = totalParticipants - passedCount;
  const passRate = totalParticipants > 0 ? Math.round((passedCount / totalParticipants) * 100) : 0;

  const scores = pkgResults.map(r => r.score);
  const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
  const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  const now = new Date();
  const dateStr = now.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const bapNumber = `BA-CAT/KPPN.026/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${pkg.id.slice(-4).toUpperCase()}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[96vh] rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col overflow-hidden text-white">
        
        {/* Top Header */}
        <div className="px-6 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <span className="font-black text-sm text-slate-200">
              Berita Acara Pelaksanaan Ujian (BAP) CAT Resmi
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Berita Acara</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-4 sm:p-8 overflow-y-auto flex justify-center bg-slate-950/90 print:p-0 print:bg-white">
          <div 
            id="bap-print-area"
            className="w-full max-w-3xl bg-white text-slate-900 p-8 sm:p-12 rounded-3xl border border-slate-300 shadow-2xl space-y-6 print:border-none print:shadow-none print:w-full print:max-w-none text-xs"
          >
            {/* Header Instansi */}
            <div className="text-center space-y-1 pb-4 border-b-2 border-slate-900">
              <h4 className="font-black tracking-widest uppercase text-slate-700 text-xs">
                KEMENTERIAN KEUANGAN REPUBLIK INDONESIA
              </h4>
              <p className="text-[10px] font-bold text-slate-600 uppercase">
                DIREKTORAT JENDERAL PERBENDAHARAAN • KANTOR WILAYAH PROVINSI JAWA TENGAH
              </p>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                KANTOR PELAYANAN PERBENDAHARAAN NEGARA TIPE A1 SEMARANG I
              </h2>
            </div>

            {/* Document Title */}
            <div className="text-center space-y-1 py-2">
              <h1 className="text-base sm:text-lg font-black uppercase tracking-wider text-slate-900 underline decoration-slate-900">
                BERITA ACARA PELAKSANAAN UJI KOMPETENSI CAT
              </h1>
              <p className="font-mono text-xs text-slate-600">
                Nomor: {bapNumber}
              </p>
            </div>

            {/* Content paragraph */}
            <p className="leading-relaxed text-slate-700">
              Pada hari ini, <strong>{dateStr}</strong>, bertempat di lingkungan kerja Kantor Pelayanan Perbendaharaan Negara (KPPN) Semarang I dan melalui Sistem Aplikasi Simulasi Ujian CAT Terintegrasi, telah dilaksanakan Uji Kompetensi Berbasis Komputer dengan rincian data sebagai berikut:
            </p>

            {/* Metadata Table */}
            <div className="border border-slate-300 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <tbody className="divide-y divide-slate-200">
                  <tr className="bg-slate-50">
                    <td className="py-2 px-3 font-bold w-48 text-slate-700">Paket Ujian CAT</td>
                    <td className="py-2 px-3 font-black text-slate-900">{pkg.title}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-slate-700">Kategori &amp; Sasaran</td>
                    <td className="py-2 px-3 text-slate-800">{pkg.category} ({pkg.targetAudience === 'kppn_internal' ? 'KPPN Internal' : 'Mitra Satker'})</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="py-2 px-3 font-bold text-slate-700">Jumlah Butir Soal</td>
                    <td className="py-2 px-3 text-slate-800">{pkg.questions?.length || 0} Soal (Pilihan Ganda)</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-slate-700">Alokasi Waktu Ujian</td>
                    <td className="py-2 px-3 text-slate-800">{pkg.durationMinutes} Menit</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="py-2 px-3 font-bold text-slate-700">Nilai Ambang Batas (Passing Grade)</td>
                    <td className="py-2 px-3 font-black text-emerald-700">{pkg.passingGrade} dari 100</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Statistical Summary Box */}
            <div className="space-y-2">
              <h3 className="font-black text-xs uppercase tracking-wider text-slate-800">
                A. REKAPITULASI HASIL PELAKSANAAN
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                  <span className="text-[10px] text-slate-500 block font-semibold">Total Peserta</span>
                  <span className="text-xl font-black text-slate-900 font-mono">{totalParticipants}</span>
                </div>
                <div className="p-3 rounded-xl border border-slate-200 bg-emerald-50">
                  <span className="text-[10px] text-emerald-700 block font-semibold">Lulus (Memenuhi)</span>
                  <span className="text-xl font-black text-emerald-700 font-mono">{passedCount} ({passRate}%)</span>
                </div>
                <div className="p-3 rounded-xl border border-slate-200 bg-rose-50">
                  <span className="text-[10px] text-rose-700 block font-semibold">Tidak Lulus</span>
                  <span className="text-xl font-black text-rose-700 font-mono">{failedCount}</span>
                </div>
                <div className="p-3 rounded-xl border border-slate-200 bg-amber-50">
                  <span className="text-[10px] text-amber-700 block font-semibold">Nilai Rata-Rata</span>
                  <span className="text-xl font-black text-amber-800 font-mono">{avgScore}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center pt-1">
                <div className="p-2 rounded-xl border border-slate-200 bg-slate-50">
                  <span className="text-[10px] text-slate-500 font-semibold">Nilai Tertinggi: </span>
                  <strong className="text-emerald-700 font-mono text-sm">{highestScore}</strong>
                </div>
                <div className="p-2 rounded-xl border border-slate-200 bg-slate-50">
                  <span className="text-[10px] text-slate-500 font-semibold">Nilai Terendah: </span>
                  <strong className="text-rose-700 font-mono text-sm">{lowestScore}</strong>
                </div>
              </div>
            </div>

            {/* Top 5 Participants */}
            {pkgResults.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-black text-xs uppercase tracking-wider text-slate-800">
                  B. DAFTAR PERINGKAT TERBAIK (TOP 5)
                </h3>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 font-bold text-slate-700">
                      <tr>
                        <th className="py-2 px-3 text-center w-12">Peringkat</th>
                        <th className="py-2 px-3">Nama Peserta</th>
                        <th className="py-2 px-3">Satker / Unit</th>
                        <th className="py-2 px-3 text-center">Skor</th>
                        <th className="py-2 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {pkgResults
                        .sort((a, b) => b.score - a.score || a.timeSpentSeconds - b.timeSpentSeconds)
                        .slice(0, 5)
                        .map((r, idx) => (
                          <tr key={r.id}>
                            <td className="py-1.5 px-3 text-center font-bold">#{idx + 1}</td>
                            <td className="py-1.5 px-3 font-semibold">{r.participantName}</td>
                            <td className="py-1.5 px-3 text-slate-600">{r.satkerOrUnit}</td>
                            <td className="py-1.5 px-3 text-center font-mono font-bold text-amber-600">{r.score}</td>
                            <td className="py-1.5 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                                r.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                              }`}>
                                {r.passed ? 'LULUS' : 'TIDAK'}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Statement Conclusion */}
            <div className="space-y-2 pt-2 text-slate-700">
              <h3 className="font-black text-xs uppercase tracking-wider text-slate-800">
                C. CATATAN &amp; INTEGRITAS PENGAWASAN
              </h3>
              <p className="leading-relaxed">
                Seluruh tahapan ujian CAT telah dilaksanakan dengan menerapkan pengawasan integritas sistem (deteksi alih tabulasi dan anti kecurangan). Demikian Berita Acara ini dibuat dengan sebenarnya untuk dipergunakan sebagaimana mestinya.
              </p>
            </div>

            {/* Signatures */}
            <div className="pt-8 border-t border-slate-300 mt-6 grid grid-cols-2 gap-8 text-center">
              <div>
                <p className="text-slate-600">Mengetahui,</p>
                <p className="font-bold text-slate-800">Kepala Seksi MSKI KPPN Semarang I</p>
                <div className="h-16 flex items-center justify-center">
                  <span className="text-[10px] text-slate-400 italic">[Tanda Tangan &amp; Cap KPPN]</span>
                </div>
                <p className="font-black text-slate-900 underline">HERU PRASETYO, S.E.</p>
                <p className="text-[10px] text-slate-500 font-mono">NIP. 197805122002121002</p>
              </div>

              <div>
                <p className="text-slate-600">Semarang, {dateStr}</p>
                <p className="font-bold text-slate-800">Pengawas / Administrator CAT</p>
                <div className="h-16 flex items-center justify-center">
                  <span className="text-[10px] text-slate-400 italic">[Tanda Tangan Pengawas]</span>
                </div>
                <p className="font-black text-slate-900 underline">TIM PENGELOLA CAT KPPN 026</p>
                <p className="text-[10px] text-slate-500 font-mono">NIP. 199104052014021001</p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
