import React, { useState } from 'react';
import { DiagnostikCaputResult, DiagnostikCaputROItem } from '../types';
import { SAKTI_REFERENSI_LIST, formatRupiahCaput } from '../utils/diagnostikCaputProcessor';
import { 
  FileText, 
  Copy, 
  Check, 
  Printer, 
  Download, 
  Building, 
  Calendar, 
  Send,
  AlertTriangle,
  Info,
  Sliders
} from 'lucide-react';

interface SuratKlarifikasiKppnViewProps {
  data: DiagnostikCaputResult;
  kppnName?: string;
  isDark?: boolean;
}

export const SuratKlarifikasiKppnView: React.FC<SuratKlarifikasiKppnViewProps> = ({
  data,
  kppnName = 'KPPN Semarang I',
  isDark = false
}) => {
  const [nomorSurat, setNomorSurat] = useState<string>(`S-    /KPA.${data.summary.kodeSatker}/2026`);
  const [tanggalSurat, setTanggalSurat] = useState<string>(
    new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  );
  const [namaPejabat, setNamaPejabat] = useState<string>('Pejabat Pembuat Komitmen / KPA');
  const [nipPejabat, setNipPejabat] = useState<string>('19850101 201012 1 001');
  const [jabatanPejabat, setJabatanPejabat] = useState<string>('Pejabat Pembuat Komitmen (PPK)');
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Filter problematic or early warning ROs, or all if none
  const roKlarifikasi = data.items.filter(it => it.diagnosaSeverity !== 'OPTIMAL');
  const activeList = roKlarifikasi.length > 0 ? roKlarifikasi : data.items;

  // Generate plain text format for 1-click copy
  const generatePlainText = () => {
    let text = `KEMENTERIAN / LEMBAGA\nSATUAN KERJA ${data.summary.namaSatker.toUpperCase()} (${data.summary.kodeSatker})\n\n`;
    text += `Nomor    : ${nomorSurat}\n`;
    text += `Tanggal  : ${tanggalSurat}\n`;
    text += `Sifat    : Segera / Penting\n`;
    text += `Lampiran : 1 (satu) Berkas\n`;
    text += `Hal      : Klarifikasi dan Penjelasan Deviasi Capaian Output Periode ${data.summary.periode}\n\n`;
    text += `Yth. Kepala ${kppnName}\ndi Tempat\n\n`;
    text += `Sehubungan dengan hasil monitoring dan evaluasi Indikator Kinerja Pelaksanaan Anggaran (IKPA) khususnya indikator Capaian Output periode ${data.summary.periode}, bersama ini kami sampaikan penjelasan serta rincian pertanggungjawaban atas Rincian Output (RO) yang terdeteksi mengalami deviasi capaian fisik/penyerapan pada aplikasi SAKTI sebagai berikut:\n\n`;

    activeList.forEach((ro, idx) => {
      const refObj = SAKTI_REFERENSI_LIST.find(r => r.kode === (ro.selectedReferensiSakti || '07')) || SAKTI_REFERENSI_LIST[6];
      text += `[${idx + 1}] RO: ${ro.kodeRo} - ${ro.namaRo}\n`;
      text += `    - Target (TPCRO): ${ro.targetProgres.toFixed(2)}% | Volume Target: ${ro.volumeTarget} vol\n`;
      text += `    - Realisasi (PCRO): ${ro.realisasiProgres.toFixed(2)}% | Volume Realisasi: ${ro.volumeRealisasi} vol\n`;
      text += `    - Nilai Kolom Z : ${ro.nilaiKomponenRo.toFixed(2)} / 100 (${ro.diagnosaSeverity})\n`;
      text += `    - Kode Referensi: ${refObj.kode}) ${refObj.judul}\n`;
      text += `    - Penjelasan SAKTI: ${ro.templateKeteranganSakti || '-'}\n\n`;
    });

    text += `Demikian surat klarifikasi dan penjelasan ini kami sampaikan untuk dipergunakan sebagaimana mestinya dalam rangka konfirmasi keabsahan data pelaporan Capaian Output Satker.\n\n`;
    text += `${jabatanPejabat}\n\n\n\n`;
    text += `${namaPejabat}\n`;
    text += `NIP ${nipPejabat}\n`;

    return text;
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(generatePlainText());
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadDoc = () => {
    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><title>Surat Klarifikasi Caput ${data.summary.kodeSatker}</title>
      <style>
        body { font-family: 'Arial', sans-serif; font-size: 11pt; line-height: 1.4; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 15px; }
        th, td { border: 1px solid #000; padding: 6px; font-size: 9pt; text-align: left; vertical-align: top; }
        th { background-color: #f2f2f2; font-weight: bold; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
      </style>
      </head>
      <body>
        <div style="text-align: center; font-weight: bold; font-size: 13pt; margin-bottom: 5px;">
          KEMENTERIAN / LEMBAGA REPUBLIK INDONESIA<br/>
          SATUAN KERJA ${data.summary.namaSatker.toUpperCase()}
        </div>
        <hr style="border: 1.5px solid #000; margin-bottom: 20px;"/>
        
        <table style="border: none; margin-bottom: 15px;">
          <tr style="border: none;"><td style="border: none; width: 100px;">Nomor</td><td style="border: none;">: ${nomorSurat}</td><td style="border: none; text-align: right;">${tanggalSurat}</td></tr>
          <tr style="border: none;"><td style="border: none;">Sifat</td><td style="border: none;">: Segera</td><td style="border: none;"></td></tr>
          <tr style="border: none;"><td style="border: none;">Lampiran</td><td style="border: none;">: 1 (satu) Berkas</td><td style="border: none;"></td></tr>
          <tr style="border: none;"><td style="border: none;">Hal</td><td style="border: none;">: <strong>Klarifikasi dan Penjelasan Deviasi Capaian Output Periode ${data.summary.periode}</strong></td><td style="border: none;"></td></tr>
        </table>

        <p>Yth. Kepala ${kppnName}<br/>di Tempat</p>

        <p>Sehubungan dengan monitoring indikator Kinerja Capaian Output (IKPA) periode ${data.summary.periode}, bersama ini kami sampaikan rincian klarifikasi dan data konfirmasi atas Rincian Output (RO) yang memiliki deviasi capaian fisik/penyerapan sebagai berikut:</p>

        <table>
          <thead>
            <tr>
              <th class="text-center" style="width: 30px;">No</th>
              <th>Kode &amp; Rincian Output (RO)</th>
              <th class="text-center" style="width: 60px;">Target (TPCRO)</th>
              <th class="text-center" style="width: 60px;">Realisasi (PCRO)</th>
              <th class="text-center" style="width: 50px;">Nilai Z</th>
              <th>Kode Referensi</th>
              <th>Penjelasan Keterangan SAKTI</th>
            </tr>
          </thead>
          <tbody>
            ${activeList.map((ro, idx) => {
              const refObj = SAKTI_REFERENSI_LIST.find(r => r.kode === (ro.selectedReferensiSakti || '07')) || SAKTI_REFERENSI_LIST[6];
              return `
                <tr>
                  <td class="text-center">${idx + 1}</td>
                  <td><strong>${ro.kodeRo}</strong><br/>${ro.namaRo}</td>
                  <td class="text-center">${ro.targetProgres.toFixed(2)}%</td>
                  <td class="text-center">${ro.realisasiProgres.toFixed(2)}%</td>
                  <td class="text-center font-bold">${ro.nilaiKomponenRo.toFixed(2)}</td>
                  <td><strong>${refObj.kode}</strong> - ${refObj.judul}</td>
                  <td>${ro.templateKeteranganSakti || '-'}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <p>Demikian surat penjelasan ini disampaikan untuk menjadi bahan evaluasi dan verifikasi konfirmasi pelaporan pada aplikasi SAKTI / MyIntress.</p>

        <div style="margin-top: 40px; float: right; width: 300px; text-align: center;">
          ${jabatanPejabat},<br/><br/><br/><br/>
          <strong>${namaPejabat}</strong><br/>
          NIP ${nipPejabat}
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Surat_Klarifikasi_Caput_${data.summary.kodeSatker}_${data.summary.periode.replace(/\s+/g, '_')}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Action & Customization Controls */}
      <div className={`p-6 rounded-3xl border ${isDark ? 'bg-slate-800/90 border-slate-700' : 'bg-white border-slate-200 shadow-sm'} space-y-5`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-cyan-300 text-xs font-bold mb-2">
              <FileText className="w-3.5 h-3.5" />
              <span>Format Standar DJPb • Verifikasi KPPN</span>
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              Generator Surat Klarifikasi &amp; Berita Acara Capaian Output ke KPPN
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl leading-relaxed">
              Dokumen resmi siap cetak dan salin untuk menjawab konfirmasi KPPN atas RO anomali / early warning (Validasi SAKTI 02, 05, 07, 08).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCopyText}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
            >
              {isCopied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{isCopied ? 'Teks Surat Tersalin!' : 'Salin Format Teks'}</span>
            </button>
            <button
              onClick={handleDownloadDoc}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Unduh Dokumen (.doc)</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-2 border border-slate-200 dark:border-slate-600 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / PDF</span>
            </button>
          </div>
        </div>

        {/* Input Fields for Meta Letter Data */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Nomor Surat Satker</label>
            <input
              type="text"
              value={nomorSurat}
              onChange={(e) => setNomorSurat(e.target.value)}
              className="w-full text-xs font-mono font-bold px-3 py-1.5 rounded-xl border bg-transparent border-slate-300 dark:border-slate-700 focus:border-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Tanggal Surat</label>
            <input
              type="text"
              value={tanggalSurat}
              onChange={(e) => setTanggalSurat(e.target.value)}
              className="w-full text-xs font-bold px-3 py-1.5 rounded-xl border bg-transparent border-slate-300 dark:border-slate-700 focus:border-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Nama Pejabat (PPK/KPA)</label>
            <input
              type="text"
              value={namaPejabat}
              onChange={(e) => setNamaPejabat(e.target.value)}
              className="w-full text-xs font-bold px-3 py-1.5 rounded-xl border bg-transparent border-slate-300 dark:border-slate-700 focus:border-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">NIP Pejabat</label>
            <input
              type="text"
              value={nipPejabat}
              onChange={(e) => setNipPejabat(e.target.value)}
              className="w-full text-xs font-mono px-3 py-1.5 rounded-xl border bg-transparent border-slate-300 dark:border-slate-700 focus:border-indigo-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* PAPER LETTER PREVIEW (Printable Container) */}
      <div className={`p-8 sm:p-12 rounded-3xl border max-w-4xl mx-auto font-sans leading-relaxed shadow-lg ${
        isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Kop Surat */}
        <div className="text-center border-b-2 border-slate-900 dark:border-slate-100 pb-4 mb-6">
          <h3 className="font-black text-base sm:text-lg uppercase tracking-wider">
            KEMENTERIAN / LEMBAGA REPUBLIK INDONESIA
          </h3>
          <h4 className="font-bold text-sm sm:text-base uppercase tracking-wide text-indigo-600 dark:text-cyan-400">
            SATUAN KERJA {data.summary.namaSatker.toUpperCase()} ({data.summary.kodeSatker})
          </h4>
        </div>

        {/* Letter Metadata */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 text-xs font-serif mb-6">
          <div className="space-y-1">
            <div className="flex"><span className="w-20 font-bold">Nomor</span><span>: {nomorSurat}</span></div>
            <div className="flex"><span className="w-20 font-bold">Sifat</span><span>: Segera</span></div>
            <div className="flex"><span className="w-20 font-bold">Lampiran</span><span>: 1 (satu) Berkas</span></div>
            <div className="flex"><span className="w-20 font-bold">Hal</span><span>: <strong>Klarifikasi dan Penjelasan Deviasi Capaian Output Periode {data.summary.periode}</strong></span></div>
          </div>
          <div className="font-semibold text-right">
            {tanggalSurat}
          </div>
        </div>

        {/* Recipient */}
        <div className="text-xs mb-5">
          <p>Yth. <strong>Kepala {kppnName}</strong></p>
          <p>di Tempat</p>
        </div>

        {/* Letter Intro */}
        <div className="text-xs leading-relaxed text-justify space-y-3 mb-6">
          <p>
            Sehubungan dengan pelaksanaan pemantauan indikator Kinerja Pelaksanaan Anggaran (IKPA) khususnya indikator <strong>Capaian Output</strong> periode <strong>{data.summary.periode}</strong> serta tindak lanjut atas <em>Early Warning</em> / anomali validasi sistem SAKTI (Juknis SAKTI Ver 3.2 Tahun 2026), bersama ini kami sampaikan penjelasan dan klarifikasi substantif atas Rincian Output (RO) satuan kerja kami sebagai berikut:
          </p>
        </div>

        {/* Table of Problematic ROs */}
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-[11px] border border-slate-300 dark:border-slate-700 border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                <th className="p-2 border border-slate-300 dark:border-slate-700 text-center w-8">No</th>
                <th className="p-2 border border-slate-300 dark:border-slate-700 text-left">Kode &amp; Nama RO</th>
                <th className="p-2 border border-slate-300 dark:border-slate-700 text-center w-16">TPCRO</th>
                <th className="p-2 border border-slate-300 dark:border-slate-700 text-center w-16">PCRO</th>
                <th className="p-2 border border-slate-300 dark:border-slate-700 text-center w-16">Kolom Z</th>
                <th className="p-2 border border-slate-300 dark:border-slate-700 text-left w-36">Kode Referensi</th>
                <th className="p-2 border border-slate-300 dark:border-slate-700 text-left">Keterangan &amp; Tindak Lanjut SAKTI</th>
              </tr>
            </thead>
            <tbody>
              {activeList.map((ro, idx) => {
                const refObj = SAKTI_REFERENSI_LIST.find(r => r.kode === (ro.selectedReferensiSakti || '07')) || SAKTI_REFERENSI_LIST[6];
                return (
                  <tr key={ro.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-2 border border-slate-300 dark:border-slate-700 text-center font-bold">{idx + 1}</td>
                    <td className="p-2 border border-slate-300 dark:border-slate-700 font-sans">
                      <strong className="font-mono text-indigo-600 dark:text-cyan-400">{ro.kodeRo}</strong>
                      <p className="text-[10px] text-slate-600 dark:text-slate-400 line-clamp-2">{ro.namaRo}</p>
                    </td>
                    <td className="p-2 border border-slate-300 dark:border-slate-700 text-center font-mono">{ro.targetProgres.toFixed(1)}%</td>
                    <td className="p-2 border border-slate-300 dark:border-slate-700 text-center font-mono font-bold">{ro.realisasiProgres.toFixed(1)}%</td>
                    <td className="p-2 border border-slate-300 dark:border-slate-700 text-center font-mono font-black text-indigo-600 dark:text-cyan-400">
                      {ro.nilaiKomponenRo.toFixed(2)}
                    </td>
                    <td className="p-2 border border-slate-300 dark:border-slate-700 font-sans">
                      <span className="font-bold text-[10px] block">{refObj.kode}) {refObj.judul}</span>
                    </td>
                    <td className="p-2 border border-slate-300 dark:border-slate-700 font-sans text-[10px] text-slate-700 dark:text-slate-300 leading-relaxed">
                      {ro.templateKeteranganSakti || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Letter Closing */}
        <div className="text-xs leading-relaxed text-justify space-y-3 mb-10">
          <p>
            Seluruh data tahapan aktivitas di atas telah diverifikasi dan disetujui oleh Pejabat Pembuat Komitmen (PPK) pada Modul Komitmen aplikasi SAKTI. Demikian surat klarifikasi ini kami sampaikan untuk menjadi bahan verifikasi dalam pembentukan nilai IKPA Capaian Output Satuan Kerja.
          </p>
        </div>

        {/* Signatures */}
        <div className="flex justify-end text-xs">
          <div className="text-center space-y-12 w-64">
            <div>
              <p className="font-semibold">{jabatanPejabat},</p>
            </div>
            <div>
              <strong className="block underline font-black text-sm">{namaPejabat}</strong>
              <span className="font-mono text-[11px]">NIP {nipPejabat}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
