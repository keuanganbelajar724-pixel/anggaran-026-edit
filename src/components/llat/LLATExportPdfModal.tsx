import React, { useState } from 'react';
import { 
  X, 
  FileDown, 
  Printer, 
  CheckCircle2, 
  AlertCircle,
  FileText
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { LLATEvent, LLATCategory } from '../../types/llat';

interface LLATExportPdfModalProps {
  events: LLATEvent[];
  categories: LLATCategory[];
  currentYear: number;
  onClose: () => void;
}

export const LLATExportPdfModal: React.FC<LLATExportPdfModalProps> = ({
  events,
  categories,
  currentYear,
  onClose
}) => {
  const [filterMonth, setFilterMonth] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [kopOption, setKopOption] = useState<string>('resmi');
  const [ttdPejabat, setTtdPejabat] = useState<string>('Kepala Seksi Manajemen Satker dan Kepatuhan Internal');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Filter events
  const filteredEvents = events.filter((ev) => {
    if (filterMonth !== 'ALL') {
      const monthNum = String(ev.tanggal_batas).split('-')[1];
      if (monthNum !== filterMonth) return false;
    }
    if (filterCategory !== 'ALL' && ev.kategori !== filterCategory) return false;
    if (filterPriority !== 'ALL' && ev.prioritas !== filterPriority) return false;
    return true;
  }).sort((a, b) => a.tanggal_batas.localeCompare(b.tanggal_batas));

  const handleGeneratePdf = () => {
    try {
      setIsGenerating(true);
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();

      // KOP KPPN Semarang I
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(20, 20, 20);
      doc.text('KEMENTERIAN KEUANGAN REPUBLIK INDONESIA', pageWidth / 2, 13, { align: 'center' });
      doc.setFontSize(10);
      doc.text('DIREKTORAT JENDERAL PERBENDAHARAAN', pageWidth / 2, 18, { align: 'center' });
      doc.text('KANTOR WILAYAH DIREKTORAT JENDERAL PERBENDAHARAAN PROVINSI JAWA TENGAH', pageWidth / 2, 23, { align: 'center' });
      doc.text('KANTOR PELAYANAN PERBENDAHARAAN NEGARA TIPE A1 SEMARANG I', pageWidth / 2, 28, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(80, 80, 80);
      doc.text('Gedung Keuangan Negara Semarang I, Jl. Pemuda No. 2, Semarang 50139 | Telepon (024) 3543851 | Email: kppn026@kemenkeu.go.id', pageWidth / 2, 33, { align: 'center' });

      // Garis Kop Dobel
      doc.setDrawColor(20, 20, 20);
      doc.setLineWidth(0.8);
      doc.line(14, 36, pageWidth - 14, 36);
      doc.setLineWidth(0.2);
      doc.line(14, 37.2, pageWidth - 14, 37.2);

      // Judul Dokumen
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text(`KALENDER LANGKAH-LANGKAH DALAM MENGHADAPI AKHIR TAHUN (LLAT)`, pageWidth / 2, 45, { align: 'center' });
      doc.setFontSize(11);
      doc.setTextColor(71, 85, 105);
      doc.text(`TAHUN ANGGARAN ${currentYear} - KPPN SEMARANG I (026)`, pageWidth / 2, 51, { align: 'center' });

      // Metadata filter info
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      const printDateStr = new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      doc.text(`Dicetak melalui Aplikasi ANGKASA KPPN 026 pada: ${printDateStr} | Total: ${filteredEvents.length} Kegiatan Terjadwal`, 14, 57);

      // AutoTable
      const tableData = filteredEvents.map((item, idx) => [
        idx + 1,
        item.kode_kegiatan,
        `${item.tanggal_batas}\n(${item.jam_batas} ${item.timezone})`,
        `${item.nama_kegiatan}\n\nKetentuan: ${item.deskripsi || '-'}`,
        item.kategori,
        item.prioritas,
        item.target_pengguna?.join(', ') || 'Semua Satker',
        item.nomor_peraturan || item.dasar_hukum || '-'
      ]);

      autoTable(doc, {
        startY: 60,
        margin: { left: 14, right: 14 },
        head: [[
          'No', 
          'Kode', 
          'Batas Waktu', 
          'Nama Kegiatan & Ketentuan Teknis', 
          'Kategori', 
          'Prioritas', 
          'Target Satker', 
          'Dasar Hukum / Ketentuan'
        ]],
        body: tableData,
        theme: 'grid',
        styles: {
          fontSize: 8,
          cellPadding: 2.5,
          valign: 'middle'
        },
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center'
        },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
          2: { cellWidth: 26, halign: 'center' },
          3: { cellWidth: 85 },
          4: { cellWidth: 22, halign: 'center' },
          5: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
          6: { cellWidth: 38 },
          7: { cellWidth: 49 }
        },
        didDrawPage: (data) => {
          // Footer
          const str = `Halaman ${data.pageNumber} dari ${doc.getNumberOfPages()}`;
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(120, 120, 120);
          doc.text(str, pageWidth - 14, doc.internal.pageSize.getHeight() - 10, { align: 'right' });
          doc.text('ANGKASA - Aplikasi Navigasi & Kinerja Satker Akurat | KPPN Semarang I', 14, doc.internal.pageSize.getHeight() - 10);
        }
      });

      // Signature Box on last page
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      const ttdX = pageWidth - 90;

      // Check if space allows, otherwise add page
      if (finalY + 35 > doc.internal.pageSize.getHeight() - 15) {
        doc.addPage();
        const newY = 25;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(20, 20, 20);
        doc.text(`Semarang, ${printDateStr}`, ttdX, newY);
        doc.text(ttdPejabat, ttdX, newY + 5);
        doc.text('KPPN Tipe A1 Semarang I', ttdX, newY + 10);
        doc.setFont('helvetica', 'bold');
        doc.text('( ............................................................ )', ttdX, newY + 30);
      } else {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(20, 20, 20);
        doc.text(`Semarang, ${printDateStr}`, ttdX, finalY);
        doc.text(ttdPejabat, ttdX, finalY + 5);
        doc.text('KPPN Tipe A1 Semarang I', ttdX, finalY + 10);
        doc.setFont('helvetica', 'bold');
        doc.text('( ............................................................ )', ttdX, finalY + 30);
      }

      // Download file
      doc.save(`Kalender_LLAT_TA_${currentYear}_KPPN_Semarang_I.pdf`);
      setIsGenerating(false);
      onClose();
    } catch (e) {
      console.error('Failed to generate PDF:', e);
      setIsGenerating(false);
      alert('Gagal membuat dokumen PDF. Silakan coba kembali.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Cetak &amp; Export Dokumen Resmi LLAT PDF
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Format resmi KPPN Semarang I siap cetak &amp; sosialisasi
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {/* Filter Bulan */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Bulan Batas Waktu
            </label>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold"
            >
              <option value="ALL">Semua Bulan (Seluruh Kalender LLAT)</option>
              <option value="11">November</option>
              <option value="12">Desember (Puncak Akhir Tahun)</option>
              <option value="01">Januari (Penyelesaian &amp; Pelaporan)</option>
            </select>
          </div>

          {/* Filter Kategori */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Kategori Kegiatan
            </label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold"
            >
              <option value="ALL">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.nama}>{c.nama}</option>
              ))}
            </select>
          </div>

          {/* Filter Prioritas */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Tingkat Prioritas
            </label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold"
            >
              <option value="ALL">Semua Prioritas</option>
              <option value="KRITIS">Hanya KRITIS (Wajib Perhatian Utama)</option>
              <option value="PENTING">Hanya PENTING</option>
              <option value="NORMAL">Hanya NORMAL</option>
            </select>
          </div>

          {/* Pejabat Penandatangan */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Kolom Tanda Tangan / Verifikator Dokumen
            </label>
            <input
              type="text"
              value={ttdPejabat}
              onChange={(e) => setTtdPejabat(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold"
            />
          </div>

          {/* Preview Record Count */}
          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between text-indigo-900 dark:text-indigo-200">
            <span className="font-bold">Total item yang akan tercetak:</span>
            <span className="font-black px-2 py-0.5 rounded bg-indigo-600 text-white font-mono">
              {filteredEvents.length} Kegiatan
            </span>
          </div>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={isGenerating || filteredEvents.length === 0}
            onClick={handleGeneratePdf}
            className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-black text-xs transition-all shadow-md flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>{isGenerating ? 'Menyusun PDF...' : 'Unduh Dokumen PDF'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
