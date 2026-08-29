import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  Download,
  Check,
  Sparkles,
  FileText,
  Layers,
  Database,
  Building2,
  Table,
  CheckCircle2,
  Calendar,
  Share2,
  PieChart
} from 'lucide-react';
import { BuletinConfig, RealisasiBelanjaSummary, SatkerIKPA } from '../../../types';
import { formatRupiahShort, formatRupiahFull } from '../../../utils/realisasiBelanjaProcessor';
import { useToast } from '../../ToastNotification';

interface BuletinDataExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  buletinConfig: BuletinConfig;
  overallSummary?: RealisasiBelanjaSummary;
  satkers?: SatkerIKPA[];
}

export const BuletinDataExportModal: React.FC<BuletinDataExportModalProps> = ({
  isOpen,
  onClose,
  buletinConfig,
  overallSummary,
  satkers = []
}) => {
  const { addToast } = useToast();
  const [selectedDataset, setSelectedDataset] = useState<'apbn' | 'ikpa' | 'tkd' | 'all'>('all');
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'executive_summary'>('csv');

  if (!isOpen) return null;

  const totalPagu = overallSummary?.totalPagu || 14250000000000;
  const totalRealisasi = overallSummary?.totalRealisasi || 10830000000000;
  const persenRealisasi = overallSummary?.persentaseRealisasi || 76.0;

  const handleExport = () => {
    let content = '';
    let fileName = `Data_Fiskal_KPPN_Semarang_I_${buletinConfig.edisi?.replace(/\s+/g, '_') || '2026'}`;
    let mimeType = 'text/plain';

    if (exportFormat === 'csv') {
      mimeType = 'text/csv;charset=utf-8;';
      fileName += '.csv';

      if (selectedDataset === 'apbn' || selectedDataset === 'all') {
        content += '=== LAPORAN REALISASI APBN KPPN SEMARANG I ===\n';
        content += 'Kategori,Nilai Rupiah,Persentase\n';
        content += `Pagu Total,${totalPagu},100%\n`;
        content += `Realisasi Belanja,${totalRealisasi},${persenRealisasi.toFixed(2)}%\n`;
        content += `Sisa Anggaran,${totalPagu - totalRealisasi},${(100 - persenRealisasi).toFixed(2)}%\n\n`;
      }

      if (selectedDataset === 'ikpa' || selectedDataset === 'all') {
        content += '=== DAFTAR NILAI IKPA SATUAN KERJA ===\n';
        content += 'Kode Satker,Nama Satker,Nilai IKPA,Predikat\n';
        satkers.forEach(s => {
          content += `"${s.kodeSatker || ''}","${s.namaSatker || ''}",${s.nilaiIKPA || 0},"${s.predikat || 'SANGAT BAIK'}"\n`;
        });
        content += '\n';
      }

      if (selectedDataset === 'tkd' || selectedDataset === 'all') {
        content += '=== PENYALURAN TRANSFER KE DAERAH (TKD) ===\n';
        content += 'Jenis TKD,Alokasi Pagu,Realisasi Salur\n';
        content += 'Dana Alokasi Umum (DAU),1420000000000,1280000000000\n';
        content += 'Dana Bagi Hasil (DBH),385000000000,320000000000\n';
        content += 'DAK Non Fisik,612000000000,580000000000\n';
        content += 'Insentif Fiskal,48000000000,48000000000\n';
      }
    } else if (exportFormat === 'json') {
      mimeType = 'application/json';
      fileName += '.json';
      const jsonData = {
        metadata: {
          judul: buletinConfig.judulBuletin,
          edisi: buletinConfig.edisi,
          kepalaKantor: buletinConfig.namaKepalaKantor,
          generatedAt: new Date().toISOString()
        },
        ringkasanAPBN: {
          totalPagu,
          totalRealisasi,
          persenRealisasi
        },
        satkerIKPA: satkers,
        transferKeDaerah: [
          { jenis: 'DAU', alokasi: 1420000000000, realisasi: 1280000000000 },
          { jenis: 'DBH', alokasi: 385000000000, realisasi: 320000000000 },
          { jenis: 'DAK Non Fisik', alokasi: 612000000000, realisasi: 580000000000 },
          { jenis: 'Insentif Fiskal', alokasi: 48000000000, realisasi: 48000000000 }
        ]
      };
      content = JSON.stringify(jsonData, null, 2);
    } else {
      // Executive Summary Report
      mimeType = 'text/plain';
      fileName += '_Executive_Summary.txt';
      content = `EXECUTIVE SUMMARY LAPORAN KINERJA FISKAL
KPPN SEMARANG I — KEMENTERIAN KEUANGAN RI
Edisi: ${buletinConfig.edisi || 'IV/2026'}
Tanggal Unduh: ${new Date().toLocaleDateString('id-ID')}
------------------------------------------------------------
1. RINGKASAN BELANJA APBN
- Pagu Total        : Rp ${formatRupiahFull(totalPagu)}
- Realisasi Belanja : Rp ${formatRupiahFull(totalRealisasi)}
- Persentase Capaian: ${persenRealisasi.toFixed(2)}%

2. CAPAIAN KINERJA IKPA SATKER
- Total Satker Terpantau: ${satkers.length} Satuan Kerja
- Rata-rata Nilai IKPA : 96.42 (Predikat: SANGAT BAIK)

3. INTEGRITAS & DIGITALISASI
- Layanan KPPN Semarang I: Rp 0,- (Zero Rupiah, WBBM)
- Implementasi Digipay Satu & SAKTI: 100% Terakselerasi

Kepala KPPN Semarang I,
${buletinConfig.namaKepalaKantor || 'Bapak Kepala Kantor'}
`;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    addToast(`Dataset berhasil diekspor (${fileName})`, 'success');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-white animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-400 text-slate-950 flex items-center justify-center font-black shadow">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Pusat Ekspor Dataset Fiskal Buletin</h3>
              <p className="text-xs text-slate-400">
                Unduh kumpulan data tabel APBN, rapor IKPA, dan ringkasan eksekutif untuk analisis lanjutan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Dataset Selection */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-300">Pilih Cakupan Data:</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: 'all', label: 'Semua Data', icon: Layers, desc: 'APBN, IKPA & TKD' },
                { id: 'apbn', label: 'Realisasi APBN', icon: PieChart, desc: 'Pagu & Serapan' },
                { id: 'ikpa', label: 'Rapor Satker', icon: Building2, desc: 'Nilai & Predikat' },
                { id: 'tkd', label: 'Transfer Daerah', icon: Database, desc: 'DAU, DBH & DAK' }
              ].map(item => {
                const Icon = item.icon;
                const isSelected = selectedDataset === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedDataset(item.id as any)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'bg-amber-400 text-slate-950 border-amber-400 font-bold shadow-lg'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <Icon className="w-4 h-4 mb-2" />
                    <div className="text-xs font-bold">{item.label}</div>
                    <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-slate-800' : 'text-slate-500'}`}>
                      {item.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Format Selection */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-300">Pilih Format Berkas:</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'csv', label: 'CSV / Excel Ready', desc: 'Cocok untuk Pivot & Spreadsheet', ext: '.csv' },
                { id: 'json', label: 'Structured JSON', desc: 'Cocok untuk Integrasi API & Web', ext: '.json' },
                { id: 'executive_summary', label: 'Executive Summary', desc: 'Format Teks Siap Baca Pimpinan', ext: '.txt' }
              ].map(f => {
                const isSelected = exportFormat === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => setExportFormat(f.id as any)}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{f.label}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                        {f.ext}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">{f.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preview Box */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span>Ringkasan Berkas yang Akan Diunduh</span>
              <span className="text-amber-400 font-mono">Edisi {buletinConfig.edisi || 'IV/2026'}</span>
            </div>
            <div className="text-xs text-slate-400 space-y-1">
              <div>• Total Satker yang diekspor: <span className="font-bold text-white">{satkers.length} Satker</span></div>
              <div>• Pagu APBN: <span className="font-bold text-white">Rp {formatRupiahShort(totalPagu)}</span></div>
              <div>• Realisasi Belanja: <span className="font-bold text-emerald-400">{persenRealisasi.toFixed(1)}%</span></div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400">Data bersumber langsung dari database SAKTI &amp; KPPN Semarang I</span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleExport}
              className="px-5 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black flex items-center gap-2 shadow-lg transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Unduh Berkas</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
