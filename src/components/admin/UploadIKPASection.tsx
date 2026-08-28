import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  FolderArchive,
  Trash2,
  RotateCcw,
  Sparkles,
  Calendar,
  Layers,
  FileDown,
  Building2,
  TrendingUp,
  Check,
  BarChart3
} from 'lucide-react';
import { SatkerIKPA, ExcelUploadHistory, MasterSatker, IndikatorIKPA } from '../../types';
import { processExcelFile, downloadExcelTemplate, exportSatkersToExcel } from '../../utils/excelProcessor';
import { hitungTotalIKPA, getPredikatIKPA, mergeHistoricalUploadsToSatkers } from '../../data/initialSatkerData';
import { PeriodDropdownSelector } from './PeriodDropdownSelector';

interface UploadIKPASectionProps {
  isDark: boolean;
  satkers: SatkerIKPA[];
  masterSatkers?: MasterSatker[];
  historicalUploads: ExcelUploadHistory[];
  onApplySatkers: (satkers: SatkerIKPA[], appendMode: boolean) => void;
  onSaveHistoricalUploads: (newList: ExcelUploadHistory[]) => void;
  onClearIKPAData: () => void;
  requestConfirm: (
    title: string,
    message: string,
    onConfirm: () => void | Promise<void>,
    options?: {
      confirmText?: string;
      cancelText?: string;
      variant?: 'danger' | 'warning' | 'info' | 'success';
      iconType?: 'trash' | 'warning' | 'shield' | 'check' | 'info' | 'sparkles' | 'reload';
    }
  ) => void;
  showToast: (opts: { type: 'success' | 'error' | 'warning' | 'info'; title: string; message: string }) => void;
  addLog: (action: string, category: 'AUTH' | 'UPLOAD' | 'SETTINGS' | 'ANNOUNCEMENT', details: string, status?: 'SUCCESS' | 'WARNING' | 'INFO') => void;
}

export const UploadIKPASection: React.FC<UploadIKPASectionProps> = ({
  isDark,
  satkers,
  masterSatkers = [],
  historicalUploads,
  onApplySatkers,
  onSaveHistoricalUploads,
  onClearIKPAData,
  requestConfirm,
  showToast,
  addLog
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentFileName, setCurrentFileName] = useState<string>('');
  const [previewSatkers, setPreviewSatkers] = useState<SatkerIKPA[]>([]);
  const [uploadPeriode, setUploadPeriode] = useState<string>('Agustus 2026');
  const [uploadNotes, setUploadNotes] = useState<string>('Rekonsiliasi IKPA SAKTI 8 Indikator');
  const [appendMode, setAppendMode] = useState<boolean>(false);
  const [searchHistory, setSearchHistory] = useState<string>('');

  // Filter history khusus IKPA
  const ikpaHistories = historicalUploads.filter(h => !h.category || h.category === 'IKPA');
  const ikpaSatkerCount = satkers.filter(s => s.hasIKPAData !== false && s.nilaiTotalIKPA > 0).length;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setCurrentFileName(file.name);
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const result = await processExcelFile(file, 'IKPA');
      if (result.satkers.length === 0) {
        throw new Error('Tidak ada data Satker IKPA yang valid dalam file Excel.');
      }

      setPreviewSatkers(result.satkers);
      if (result.satkers.length > 0 && result.satkers[0].periodeUpdate) {
        setUploadPeriode(result.satkers[0].periodeUpdate);
      }

      addLog(
        'Upload Excel IKPA',
        'UPLOAD',
        `File "${file.name}" diunggah. ${result.satkers.length} Satker IKPA dibersihkan & diproses. Periode: ${result.satkers[0]?.periodeUpdate || 'Januari 2026'}.`,
        'SUCCESS'
      );

      showToast({
        type: 'success',
        title: 'File Excel IKPA Terbaca',
        message: `${result.satkers.length} data Satker berhasil dianalisis. Silakan tinjau preview sebelum menerapkan ke Database IKPA.`
      });
    } catch (err: any) {
      const errMsg = err.message || 'Gagal memproses file Excel IKPA.';
      setErrorMessage(errMsg);
      addLog('Gagal Olah File Excel IKPA', 'UPLOAD', `Gagal olah file "${file.name}": ${errMsg}`, 'WARNING');
      showToast({
        type: 'error',
        title: 'Gagal Olah Excel IKPA',
        message: errMsg
      });
    } finally {
      setIsProcessing(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleApplyPreview = (overwriteActive: boolean) => {
    if (previewSatkers.length === 0) return;

    const fileNameToUse = currentFileName || `Laporan_IKPA_${uploadPeriode.replace(/\s+/g, '_')}.xlsx`;
    const avgIKPA = Number(
      (previewSatkers.reduce((acc, s) => acc + (s.nilaiTotalIKPA || 0), 0) / (previewSatkers.length || 1)).toFixed(2)
    );

    // Check if period already exists in historical uploads -> Overwrite / Replace previous upload for the same period
    const monthsOrder = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const uploadMonthName = monthsOrder.find(m => uploadPeriode.toLowerCase().includes(m.toLowerCase())) || 'Januari';

    // Tandai data memiliki IKPA secara tegas (tidak mencampuradukkan status capaian output kecuali sudah diupload)
    const formattedData = previewSatkers.map(s => {
      const existing = satkers.find(curr => curr.kodeSatker === s.kodeSatker);

      // Build or update monthly history entry for this uploaded month
      const newMonthEntry = {
        bulan: uploadMonthName,
        nilaiIKPA: s.nilaiTotalIKPA,
        capaianOutput: s.indikator?.capaianOutput || 0,
        deviasiHal3Dipa: s.indikator?.deviasiHal3Dipa || 0,
        penyerapanAnggaran: s.indikator?.penyerapanAnggaran || 0,
        revisiDipa: s.indikator?.revisiDipa || 0,
        belanjaKontraktual: s.indikator?.belanjaKontraktual || 0,
        penyelesaianTagihan: s.indikator?.penyelesaianTagihan || 0,
        pengelolaanUpTup: s.indikator?.pengelolaanUpTup || 0,
        dispensasiSpm: s.indikator?.dispensasiSpm || 0
      };

      let mergedHistory = existing?.riwayatBulanan ? [...existing.riwayatBulanan] : [];
      mergedHistory = mergedHistory.filter(h => h.bulan.toLowerCase() !== uploadMonthName.toLowerCase());
      mergedHistory.push(newMonthEntry);
      mergedHistory.sort((a, b) => {
        const idxA = monthsOrder.findIndex(m => m.toLowerCase() === (a.bulan || '').toLowerCase());
        const idxB = monthsOrder.findIndex(m => m.toLowerCase() === (b.bulan || '').toLowerCase());
        return (idxA !== -1 ? idxA : 0) - (idxB !== -1 ? idxB : 0);
      });

      return {
        ...s,
        hasIKPAData: true,
        hasCapaianOutputData: existing ? existing.hasCapaianOutputData : false,
        statusCapaianOutput: (existing && existing.hasCapaianOutputData) ? existing.statusCapaianOutput : s.statusCapaianOutput,
        periodeUpdate: uploadPeriode,
        riwayatBulanan: mergedHistory
      };
    });

    const newHistoryItem: ExcelUploadHistory = {
      id: `hist-ikpa-${Date.now()}`,
      fileName: fileNameToUse,
      periode: uploadPeriode.trim() || 'Agustus 2026',
      uploadDate: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WIB',
      uploadedBy: 'Seksi MSKI KPPN Semarang I',
      satkerCount: formattedData.length,
      averageIKPA: avgIKPA,
      notes: uploadNotes.trim() || 'Upload Data IKPA (8 Indikator)',
      satkersData: formattedData,
      category: 'IKPA',
      isActive: overwriteActive
    };

    // Filter out existing historical upload with SAME period & IKPA category to guarantee overwrite
    const normalizedPeriode = uploadPeriode.trim().toLowerCase();
    const filteredHistory = historicalUploads.filter(h => {
      const isIKPA = !h.category || h.category === 'IKPA';
      const samePeriode = (h.periode || '').trim().toLowerCase() === normalizedPeriode;
      return !(isIKPA && samePeriode);
    });

    if (overwriteActive) {
      onApplySatkers(formattedData, appendMode);
      const updatedHistory = [
        newHistoryItem,
        ...filteredHistory.map(h => (!h.category || h.category === 'IKPA' ? { ...h, isActive: false } : h))
      ];
      onSaveHistoricalUploads(updatedHistory);

      addLog(
        'Update Database IKPA (Menimpa Periode Sama)',
        'UPLOAD',
        `${formattedData.length} Satker IKPA periode "${uploadPeriode}" berhasil menimpa periode sebelumnya dan diperbarui ke Dashboard IKPA Utama.`,
        'SUCCESS'
      );

      showToast({
        type: 'success',
        title: 'Database IKPA Diperbarui',
        message: `${formattedData.length} data Satker periode "${uploadPeriode}" berhasil menimpa data lama dan kini aktif di Dashboard IKPA.`
      });
    } else {
      const updatedHistory = [newHistoryItem, ...filteredHistory];
      onSaveHistoricalUploads(updatedHistory);

      addLog(
        'Simpan Arsip IKPA (Menimpa Periode Sama)',
        'UPLOAD',
        `File "${fileNameToUse}" (${formattedData.length} Satker) tersimpan di Arsip IKPA menimpa arsip lama periode "${uploadPeriode}".`,
        'INFO'
      );

      showToast({
        type: 'info',
        title: 'Tersimpan di Arsip IKPA',
        message: `File IKPA periode "${uploadPeriode}" berhasil menimpa arsip lama dan tersimpan di Arsip Historical.`
      });
    }

    setPreviewSatkers([]);
    setCurrentFileName('');
  };

  const handleActivateHistorical = (item: ExcelUploadHistory) => {
    requestConfirm(
      'Jadikan Periode Acuan Utama',
      `Apakah Anda yakin ingin menjadikan data IKPA periode "${item.periode}" (${item.fileName}) sebagai periode acuan utama di Dashboard IKPA?\n\n💡 Catatan: Seluruh riwayat bulanan dari periode lain tetap aktif dan terintegrasi di profil Satker.`,
      () => {
        // Merge all historical uploads so all months stay active, but set target item values as primary
        const merged = mergeHistoricalUploadsToSatkers(historicalUploads);
        // If target item has direct satkersData, we make sure target values take precedence
        const targetMap = new Map((item.satkersData || []).map(s => [s.kodeSatker?.trim(), s]));
        const adjustedList = merged.map(s => {
          const targetItem = targetMap.get(s.kodeSatker?.trim());
          if (targetItem) {
            return {
              ...s,
              nilaiTotalIKPA: targetItem.nilaiTotalIKPA || s.nilaiTotalIKPA,
              predikat: targetItem.predikat || s.predikat,
              paguAnggaran: targetItem.paguAnggaran || s.paguAnggaran,
              realisasiAnggaran: targetItem.realisasiAnggaran || s.realisasiAnggaran,
              persenPenyerapan: targetItem.persenPenyerapan || s.persenPenyerapan,
              indikator: targetItem.indikator || s.indikator,
              periodeUpdate: item.periode
            };
          }
          return s;
        });

        onApplySatkers(adjustedList.length > 0 ? adjustedList : (item.satkersData || []), false);
        const updated = historicalUploads.map(h => {
          if (!h.category || h.category === 'IKPA') {
            return { ...h, isActive: h.id === item.id };
          }
          return h;
        });
        onSaveHistoricalUploads(updated);

        addLog(
          'Beralih Periode Utama IKPA',
          'UPLOAD',
          `Dashboard IKPA Utama dialihkan ke periode acuan "${item.periode}" (${item.satkerCount} Satker) dengan seluruh riwayat bulanan tetap aktif.`,
          'SUCCESS'
        );

        showToast({
          type: 'success',
          title: 'Periode IKPA Diaktifkan',
          message: `Periode "${item.periode}" kini menjadi acuan utama di Dashboard IKPA dan seluruh riwayat bulanan tetap aktif.`
        });
      },
      { confirmText: 'Jadikan Acuan Utama', variant: 'warning' }
    );
  };

  const handleMergeAllHistoricalPeriods = () => {
    if (ikpaHistories.length === 0) return;
    requestConfirm(
      'Gabungkan & Aktifkan Seluruh Periode',
      `Apakah Anda ingin menggabungkan seluruh data dari ${ikpaHistories.length} batch arsip IKPA ke Dashboard Utama?\n\nSemua riwayat bulanan (Januari, Februari, dll.) akan diintegrasikan secara komprehensif ke profil setiap Satker.`,
      () => {
        const mergedList = mergeHistoricalUploadsToSatkers(historicalUploads);
        if (mergedList.length === 0) {
          showToast({ type: 'error', title: 'Gagal Menggabungkan', message: 'Tidak ada data satker yang dapat digabungkan dari arsip.' });
          return;
        }

        onApplySatkers(mergedList, false);
        
        // Ensure latest period is marked as active in historical uploads
        const monthsOrder = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        let latestHist = ikpaHistories[0];
        let maxIdx = -1;
        ikpaHistories.forEach(h => {
          const idx = monthsOrder.findIndex(m => (h.periode || '').toLowerCase().includes(m.toLowerCase()));
          if (idx >= maxIdx) {
            maxIdx = idx;
            latestHist = h;
          }
        });

        const updatedHistory = historicalUploads.map(h => {
          if (!h.category || h.category === 'IKPA') {
            return { ...h, isActive: h.id === latestHist.id };
          }
          return h;
        });
        onSaveHistoricalUploads(updatedHistory);

        addLog(
          'Gabungkan Seluruh Periode IKPA',
          'UPLOAD',
          `${mergedList.length} Satker berhasil digabungkan dari ${ikpaHistories.length} batch arsip IKPA dengan riwayat bulanan lengkap.`,
          'SUCCESS'
        );

        showToast({
          type: 'success',
          title: 'Seluruh Periode Terintegrasi',
          message: `${mergedList.length} Satker berhasil disinkronkan dengan riwayat bulanan lengkap (${ikpaHistories.length} Batch).`
        });
      },
      { confirmText: 'Gabungkan Semua', variant: 'info' }
    );
  };

  const handleDeleteHistorical = (id: string) => {
    const target = historicalUploads.find(h => h.id === id);
    const monthsOrder = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const targetMonth = monthsOrder.find(m => (target?.periode || '').toLowerCase().includes(m.toLowerCase()));

    requestConfirm(
      'Hapus Arsip IKPA & Bersihkan Dashboard',
      `Apakah Anda yakin ingin menghapus arsip file IKPA periode "${target?.periode || ''}" (${target?.fileName || ''})?\n\n⚠️ Menghapus arsip ini akan otomatis membersihkan data peserta terkait di Dashboard.`,
      () => {
        const newHistoryList = historicalUploads.filter(h => h.id !== id);
        const remainingIKPA = newHistoryList.filter(h => !h.category || h.category === 'IKPA');

        if (remainingIKPA.length === 0) {
          // Tidak ada arsip IKPA yang tersisa -> Bersihkan total data IKPA di dashboard peserta
          const clearedSatkers = satkers.map(s => ({
            ...s,
            hasIKPAData: false,
            nilaiTotalIKPA: 0,
            predikat: 'Cukup' as const,
            riwayatBulanan: [],
            paguAnggaran: 0,
            realisasiAnggaran: 0,
            persenPenyerapan: 0,
            issues: [],
            indikator: {
              capaianOutput: s.indikator?.capaianOutput || 0,
              deviasiHal3Dipa: 0,
              penyerapanAnggaran: 0,
              revisiDipa: 0,
              belanjaKontraktual: 0,
              penyelesaianTagihan: 0,
              pengelolaanUpTup: 0,
              dispensasiSpm: 0
            }
          }));
          onApplySatkers(clearedSatkers, false);
          onSaveHistoricalUploads(newHistoryList);
          if (onClearIKPAData) {
            onClearIKPAData();
          }
          addLog('Hapus Arsip & Bersihkan Dashboard IKPA', 'UPLOAD', `Seluruh arsip IKPA dihapus. Data peserta IKPA di dashboard telah dikosongkan (0 Satker).`, 'INFO');
          showToast({
            type: 'info',
            title: 'Arsip Dihapus & Dashboard Dikosongkan',
            message: `Seluruh arsip IKPA telah dihapus. Data IKPA pada dashboard peserta otomatis dibersihkan (0 Satker).`
          });
        } else {
          // Masih ada arsip IKPA lain
          if (target?.isActive) {
            // Aktifkan arsip IKPA teratas yang tersisa
            const nextActive = remainingIKPA[0];
            const updatedWithActive = newHistoryList.map(h => {
              if (!h.category || h.category === 'IKPA') {
                return { ...h, isActive: h.id === nextActive.id };
              }
              return h;
            });
            onSaveHistoricalUploads(updatedWithActive);
            onApplySatkers(nextActive.satkersData || [], false);
            addLog('Hapus Arsip IKPA & Alihkan Dashboard', 'UPLOAD', `Arsip IKPA "${target?.fileName}" dihapus. Dashboard dialihkan ke periode "${nextActive.periode}".`, 'INFO');
            showToast({
              type: 'info',
              title: 'Arsip Dihapus & Data Disinkronkan',
              message: `Arsip IKPA "${target?.periode}" dihapus. Dashboard IKPA kini menampilkan data periode "${nextActive.periode}".`
            });
          } else {
            // Hapus riwayat bulan dari riwayatBulanan peserta jika ada
            if (targetMonth) {
              const cleanedSatkers = satkers.map(s => ({
                ...s,
                riwayatBulanan: (s.riwayatBulanan || []).filter(r => r.bulan.toLowerCase() !== targetMonth.toLowerCase())
              }));
              onApplySatkers(cleanedSatkers, false);
            }
            onSaveHistoricalUploads(newHistoryList);
            addLog('Hapus Arsip IKPA', 'UPLOAD', `Arsip IKPA "${target?.fileName}" periode "${target?.periode}" berhasil dihapus.`, 'INFO');
            showToast({
              type: 'info',
              title: 'Arsip Dihapus',
              message: `Arsip IKPA periode "${target?.periode}" telah dihapus dan disinkronkan.`
            });
          }
        }
      },
      { confirmText: 'Ya, Hapus & Bersihkan', variant: 'danger' }
    );
  };

  const handleClearAllIKPAHistories = () => {
    if (ikpaHistories.length === 0) return;
    requestConfirm(
      'Hapus Semua Arsip IKPA',
      `Apakah Anda yakin ingin menghapus seluruh (${ikpaHistories.length} batch) arsip IKPA?\n\n⚠️ Tindakan ini akan mengosongkan data IKPA peserta di dashboard dan disinkronkan ke Firestore.`,
      () => {
        const remainingOtherHistory = historicalUploads.filter(h => h.category && h.category !== 'IKPA');
        const clearedSatkers = satkers.map(s => ({
          ...s,
          hasIKPAData: false,
          nilaiTotalIKPA: 0,
          predikat: 'Cukup' as const,
          riwayatBulanan: [],
          paguAnggaran: 0,
          realisasiAnggaran: 0,
          persenPenyerapan: 0,
          issues: [],
          indikator: {
            capaianOutput: s.indikator?.capaianOutput || 0,
            deviasiHal3Dipa: 0,
            penyerapanAnggaran: 0,
            revisiDipa: 0,
            belanjaKontraktual: 0,
            penyelesaianTagihan: 0,
            pengelolaanUpTup: 0,
            dispensasiSpm: 0
          }
        }));
        onApplySatkers(clearedSatkers, false);
        onSaveHistoricalUploads(remainingOtherHistory);
        if (onClearIKPAData) {
          onClearIKPAData();
        }
        addLog('Hapus Semua Arsip IKPA', 'UPLOAD', `Seluruh (${ikpaHistories.length} batch) arsip IKPA dihapus dan dashboard dikosongkan.`, 'WARNING');
        showToast({
          type: 'info',
          title: 'Semua Arsip IKPA Dihapus',
          message: `Seluruh (${ikpaHistories.length} batch) arsip IKPA telah dihapus dan disinkronkan.`
        });
      },
      { confirmText: 'Ya, Hapus Semua Arsip', variant: 'danger' }
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-sky-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-sky-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-sky-500/20 text-sky-300 border border-sky-400/30 px-3 py-1 rounded-full text-xs font-black mb-2">
            <BarChart3 className="w-4 h-4 text-sky-400" />
            <span>MODUL DATABASE KHUSUS EXCEL IKPA (8 INDIKATOR)</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black tracking-tight">
            Upload &amp; Pengelolaan Data Excel IKPA
          </h3>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
            Database ini khusus untuk memproses 8 indikator IKPA resmi (Revisi DIPA, Deviasi Hal III, Penyerapan, Kontraktual, UP/TUP, Dispensasi SPM, dll). Data ini terisolasi dan tidak tercampur dengan Capaian Output, Sertifikasi, atau UP/TUP.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={downloadExcelTemplate}
            className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Format Template IKPA</span>
          </button>

          <button
            type="button"
            onClick={() => exportSatkersToExcel(satkers, `Database_IKPA_KPPN026_${new Date().toISOString().slice(0, 10)}.xlsx`)}
            className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <FileDown className="w-4 h-4" />
            <span>Export Database IKPA</span>
          </button>
        </div>
      </div>

      {/* KPI Stats IKPA */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-sky-50/50 border-sky-100'}`}>
          <span className="text-slate-500 dark:text-slate-400 block font-semibold">Satker Terdaftar IKPA</span>
          <span className="text-2xl font-black text-sky-600 dark:text-sky-400 mt-1 block">
            {ikpaSatkerCount} <span className="text-xs font-normal text-slate-400">Satker</span>
          </span>
        </div>

        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-emerald-50/50 border-emerald-100'}`}>
          <span className="text-slate-500 dark:text-slate-400 block font-semibold">Rata-Rata Nilai IKPA</span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
            {satkers.length > 0 ? (satkers.reduce((acc, s) => acc + s.nilaiTotalIKPA, 0) / satkers.length).toFixed(2) : '0.00'}
          </span>
        </div>

        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-purple-50/50 border-purple-100'}`}>
          <span className="text-slate-500 dark:text-slate-400 block font-semibold">Total Arsip Batch IKPA</span>
          <span className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1 block">
            {ikpaHistories.length} <span className="text-xs font-normal text-slate-400">Batch</span>
          </span>
        </div>

        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-amber-50/50 border-amber-100'}`}>
          <span className="text-slate-500 dark:text-slate-400 block font-semibold">Periode Aktif IKPA</span>
          <span className="text-lg font-black text-amber-600 dark:text-amber-400 mt-1 block truncate">
            {historicalUploads.find(h => (!h.category || h.category === 'IKPA') && h.isActive)?.periode || satkers[0]?.periodeUpdate || 'Agustus 2026'}
          </span>
        </div>
      </div>

      {/* Upload Box */}
      <div className={`${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'} rounded-3xl border shadow-xl p-6 sm:p-8 space-y-6`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h4 className="text-lg font-black flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <Upload className="w-5 h-5 text-sky-600" />
              <span>Unggah File Excel IKPA (SAKTI / My Intress)</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Format file otomatis mendeteksi header kolom kode satker, pagu, realisasi, dan 8 indikator IKPA.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                requestConfirm(
                  'Kosongkan Database IKPA',
                  `Apakah Anda yakin ingin mengosongkan seluruh data IKPA aktif (${satkers.length} Satker)? Data Capaian Output & Sertifikasi tidak akan terpengaruh.`,
                  () => {
                    onClearIKPAData();
                    addLog('Kosongkan Data IKPA', 'UPLOAD', 'Seluruh data IKPA aktif dikosongkan.', 'WARNING');
                    showToast({
                      type: 'info',
                      title: 'Data IKPA Dikosongkan',
                      message: 'Database IKPA telah dikosongkan (0 Satker).'
                    });
                  },
                  { confirmText: 'Kosongkan IKPA', variant: 'danger' }
                );
              }}
              className="bg-rose-100 dark:bg-rose-950/60 hover:bg-rose-200 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 text-xs font-bold px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Kosongkan Data IKPA Aktif</span>
            </button>
          </div>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".xlsx, .xls, .csv"
          className="hidden"
        />

        <div className="border-2 border-dashed border-sky-300 dark:border-sky-800 hover:border-sky-500 bg-sky-50/40 dark:bg-sky-950/20 rounded-2xl p-8 text-center transition-all">
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-14 h-14 bg-sky-100 dark:bg-sky-900/60 text-sky-600 dark:text-sky-300 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <FileSpreadsheet className="w-7 h-7" />
            </div>

            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Pilih File Excel Laporan IKPA
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Tarik file ke sini atau klik tombol di bawah untuk memilih file (.xlsx, .xls, .csv)
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="mt-3 bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md cursor-pointer inline-flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>{isProcessing ? 'Memproses File IKPA...' : 'Pilih File Excel IKPA'}</span>
              </button>
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 rounded-2xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Preview Table Section */}
        {previewSatkers.length > 0 && (
          <div className="bg-slate-50 dark:bg-slate-950/80 rounded-2xl border border-sky-200 dark:border-sky-900 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="bg-sky-600 text-white font-black text-xs px-2.5 py-0.5 rounded-md">
                  PREVIEW ({previewSatkers.length} SATKER)
                </span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  File: {currentFileName}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <PeriodDropdownSelector
                  value={uploadPeriode}
                  onChange={setUploadPeriode}
                  isDark={isDark}
                  themeColor="sky"
                />

                <button
                  type="button"
                  onClick={() => handleApplyPreview(true)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-4 py-2 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Terapkan ke Dashboard Utama</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyPreview(false)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <FolderArchive className="w-4 h-4" />
                  <span>Simpan ke Arsip Saja</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto max-h-72">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-200 dark:bg-slate-800 font-extrabold text-slate-700 dark:text-slate-300 uppercase sticky top-0">
                  <tr>
                    <th className="py-2 px-3">No</th>
                    <th className="py-2 px-3">Kode &amp; Nama Satker</th>
                    <th className="py-2 px-3 text-right">Pagu</th>
                    <th className="py-2 px-3 text-right">Realisasi</th>
                    <th className="py-2 px-3 text-center">Nilai IKPA</th>
                    <th className="py-2 px-3 text-center">Predikat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {previewSatkers.slice(0, 10).map((s, idx) => (
                    <tr key={s.id || idx}>
                      <td className="py-2 px-3 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-2 px-3">
                        <div className="font-mono font-bold text-sky-700 dark:text-sky-300">{s.kodeSatker}</div>
                        <div className="font-medium text-slate-800 dark:text-slate-200">{s.namaSatker}</div>
                      </td>
                      <td className="py-2 px-3 text-right font-mono">Rp {s.paguAnggaran.toLocaleString('id-ID')}</td>
                      <td className="py-2 px-3 text-right font-mono">Rp {s.realisasiAnggaran.toLocaleString('id-ID')}</td>
                      <td className="py-2 px-3 text-center font-black font-mono text-emerald-600">{s.nilaiTotalIKPA}</td>
                      <td className="py-2 px-3 text-center">
                        <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">
                          {s.predikat}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {previewSatkers.length > 10 && (
              <p className="text-[11px] text-slate-400 text-center italic">
                Menampilkan 10 dari {previewSatkers.length} Satker yang siap diimpor.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Arsip Periode Khusus IKPA */}
      <div className={`${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'} rounded-3xl border shadow-xl p-6 sm:p-8 space-y-4`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 px-2.5 py-0.5 rounded-full text-xs font-bold mb-1">
              <FolderArchive className="w-3.5 h-3.5 text-blue-600" />
              <span>ARSIP HISTORICAL KHUSUS IKPA</span>
            </div>
            <h4 className="text-lg font-black text-slate-900 dark:text-slate-100">
              Riwayat &amp; Arsip Periode Laporan IKPA ({ikpaHistories.length} Batch)
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Seluruh periode yang diunggah otomatis tersinkronisasi ke riwayat bulanan seluruh Satker.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {ikpaHistories.length > 1 && (
              <button
                type="button"
                onClick={handleMergeAllHistoricalPeriods}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-3.5 py-2 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                title="Gabungkan seluruh periode (Januari, Februari, dll.) ke riwayat dashboard"
              >
                <Sparkles className="w-4 h-4 text-emerald-200 animate-pulse" />
                <span>Gabungkan &amp; Aktifkan Semua Periode ({ikpaHistories.length} Batch)</span>
              </button>
            )}

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-56">
                <input
                  type="text"
                  value={searchHistory}
                  onChange={(e) => setSearchHistory(e.target.value)}
                  placeholder="Cari arsip IKPA..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200"
                />
              </div>
              {ikpaHistories.length > 0 && (
                <button
                  type="button"
                  id="btn-clear-all-ikpa-histories"
                  onClick={handleClearAllIKPAHistories}
                  className="shrink-0 inline-flex items-center gap-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-800 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
                  title="Hapus Semua Arsip IKPA"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Hapus Semua</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {ikpaHistories.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <FolderArchive className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="font-bold text-xs">Belum ada riwayat arsip file IKPA.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {ikpaHistories
              .filter(h => !searchHistory || h.fileName.toLowerCase().includes(searchHistory.toLowerCase()) || h.periode.toLowerCase().includes(searchHistory.toLowerCase()))
              .map((item) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                    item.isActive
                      ? 'bg-sky-50/70 dark:bg-sky-950/40 border-sky-400 ring-2 ring-sky-500/20'
                      : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-black text-sm text-slate-900 dark:text-slate-100">
                          {item.periode}
                        </span>
                        {item.isActive ? (
                          <span className="bg-emerald-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                            <Check className="w-3 h-3" />
                            <span>PERIODE UTAMA AKTIF</span>
                          </span>
                        ) : (
                          <span className="bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Check className="w-3 h-3 text-sky-500" />
                            <span>TERINTEGRASI DI RIWAYAT</span>
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 truncate max-w-xs">
                        {item.fileName}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Diunggah: {item.uploadDate} • {item.satkerCount} Satker • Rata-rata IKPA: {item.averageIKPA}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                    {!item.isActive && (
                      <button
                        type="button"
                        onClick={() => handleActivateHistorical(item)}
                        className="bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-1"
                        title="Jadikan periode ini sebagai nilai acuan utama di Dashboard"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Jadikan Periode Utama</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => exportSatkersToExcel(item.satkersData || [], `Arsip_IKPA_${item.periode.replace(/\s+/g, '_')}.xlsx`)}
                      className="bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-300 font-bold text-xs px-2.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1"
                      title="Download Arsip Excel IKPA"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteHistorical(item.id)}
                      className="bg-rose-100 hover:bg-rose-200 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 p-1.5 rounded-xl text-xs transition-all cursor-pointer"
                      title="Hapus Arsip"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};
