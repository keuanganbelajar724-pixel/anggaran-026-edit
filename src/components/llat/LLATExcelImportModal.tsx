import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle,
  FileCheck,
  RefreshCw,
  Table
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { LLATEvent, LLATCategory, LLATPrioritas } from '../../types/llat';

interface LLATExcelImportModalProps {
  onClose: () => void;
  onImportSuccess: (importedEvents: LLATEvent[]) => void;
  existingEvents: LLATEvent[];
  currentYear: number;
}

export const LLATExcelImportModal: React.FC<LLATExcelImportModalProps> = ({
  onClose,
  onImportSuccess,
  existingEvents,
  currentYear
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File & Workbook state
  const [fileName, setFileName] = useState<string>('');
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [rawRows, setRawRows] = useState<any[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);

  // Column Mapping state
  const [mapping, setMapping] = useState<{
    kode: string;
    nama: string;
    kategori: string;
    tanggal_batas: string;
    jam_batas: string;
    prioritas: string;
    target: string;
    dasar_hukum: string;
    deskripsi: string;
  }>({
    kode: '',
    nama: '',
    kategori: '',
    tanggal_batas: '',
    jam_batas: '',
    prioritas: '',
    target: '',
    dasar_hukum: '',
    deskripsi: ''
  });

  // Validation results
  const [validatedData, setValidatedData] = useState<{
    validEvents: LLATEvent[];
    errors: { row: number; field: string; message: string }[];
    duplicateCount: number;
  }>({
    validEvents: [],
    errors: [],
    duplicateCount: 0
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const sheets = workbook.SheetNames;
        setSheetNames(sheets);
        const firstSheet = sheets[0] || '';
        setSelectedSheet(firstSheet);

        parseSheetData(workbook, firstSheet);
        setStep(2);
      } catch (err) {
        console.error('Error reading excel file:', err);
        alert('Gagal membaca file Excel. Pastikan format file valid (.xlsx atau .xls).');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const parseSheetData = (workbook: XLSX.WorkBook, sheetName: string) => {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) return;

    const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    if (json.length > 0) {
      // Find header row (usually first non-empty row)
      const headerRow = json[0] || [];
      const headerList = headerRow.map((h, i) => (h ? String(h).trim() : `Kolom_${i + 1}`));
      setHeaders(headerList);
      setRawRows(json.slice(1).filter((r) => r.some((c) => c !== undefined && c !== null && String(c).trim() !== '')));

      // Auto-detect best mapping guesses
      const guessMapping: any = { ...mapping };
      headerList.forEach((h) => {
        const lower = h.toLowerCase();
        if (lower.includes('kode')) guessMapping.kode = h;
        else if (lower.includes('kegiatan') || lower.includes('nama') || lower.includes('uraian')) guessMapping.nama = h;
        else if (lower.includes('kategori') || lower.includes('jenis')) guessMapping.kategori = h;
        else if (lower.includes('batas') || lower.includes('deadline') || lower.includes('tanggal')) guessMapping.tanggal_batas = h;
        else if (lower.includes('jam') || lower.includes('pukul') || lower.includes('waktu')) guessMapping.jam_batas = h;
        else if (lower.includes('prioritas') || lower.includes('urgensi')) guessMapping.prioritas = h;
        else if (lower.includes('target') || lower.includes('satker') || lower.includes('pengguna')) guessMapping.target = h;
        else if (lower.includes('hukum') || lower.includes('dasar') || lower.includes('peraturan')) guessMapping.dasar_hukum = h;
        else if (lower.includes('ketentuan') || lower.includes('deskripsi') || lower.includes('catatan')) guessMapping.deskripsi = h;
      });
      setMapping(guessMapping);
    }
  };

  const handleValidateMapping = () => {
    if (!mapping.nama || !mapping.tanggal_batas) {
      alert('Kolom "Nama Kegiatan" dan "Tanggal Batas" wajib dipetakan!');
      return;
    }

    const colIndexMap: Record<string, number> = {};
    Object.entries(mapping).forEach(([key, val]) => {
      colIndexMap[key] = headers.indexOf(val);
    });

    const validList: LLATEvent[] = [];
    const errorList: { row: number; field: string; message: string }[] = [];
    let dupCount = 0;

    const existingCodes = new Set(existingEvents.map((e) => e.kode_kegiatan.toUpperCase()));

    rawRows.forEach((row, idx) => {
      const rowNum = idx + 2; // excel 1-based row with header
      const namaVal = colIndexMap.nama >= 0 ? String(row[colIndexMap.nama] || '').trim() : '';
      const rawDateVal = colIndexMap.tanggal_batas >= 0 ? row[colIndexMap.tanggal_batas] : '';

      if (!namaVal) {
        errorList.push({ row: rowNum, field: 'Nama Kegiatan', message: 'Nama kegiatan kosong' });
        return;
      }

      // Parse date
      let parsedDate = '';
      if (rawDateVal instanceof Date) {
        parsedDate = rawDateVal.toISOString().split('T')[0];
      } else if (typeof rawDateVal === 'number') {
        // Excel serial date
        const d = XLSX.SSF.parse_date_code(rawDateVal);
        if (d) {
          parsedDate = `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
        }
      } else if (typeof rawDateVal === 'string') {
        const cleanDate = rawDateVal.trim();
        // check YYYY-MM-DD
        if (/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
          parsedDate = cleanDate;
        } else if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(cleanDate)) {
          // DD/MM/YYYY
          const parts = cleanDate.split(/[\/\-]/);
          parsedDate = `${parts[2]}-${String(parts[1]).padStart(2, '0')}-${String(parts[0]).padStart(2, '0')}`;
        }
      }

      if (!parsedDate) {
        errorList.push({ row: rowNum, field: 'Tanggal Batas', message: `Tanggal tidak valid: "${rawDateVal}"` });
        return;
      }

      // Kode
      let kodeVal = colIndexMap.kode >= 0 ? String(row[colIndexMap.kode] || '').trim() : '';
      if (!kodeVal) {
        kodeVal = `LLAT-${String(existingEvents.length + validList.length + 1).padStart(2, '0')}`;
      }

      if (existingCodes.has(kodeVal.toUpperCase())) {
        dupCount++;
        kodeVal = `${kodeVal}-DUP${validList.length + 1}`;
      }

      // Prioritas
      let prioVal: LLATPrioritas = 'NORMAL';
      const rawPrio = colIndexMap.prioritas >= 0 ? String(row[colIndexMap.prioritas] || '').toUpperCase() : '';
      if (rawPrio.includes('KRITIS') || rawPrio.includes('TINGGI') || rawPrio.includes('HIGH')) {
        prioVal = 'KRITIS';
      } else if (rawPrio.includes('PENTING') || rawPrio.includes('SEDANG') || rawPrio.includes('MEDIUM')) {
        prioVal = 'PENTING';
      }

      // Kategori
      const katVal = colIndexMap.kategori >= 0 ? String(row[colIndexMap.kategori] || '').trim() || 'Lainnya' : 'Lainnya';
      const jamVal = colIndexMap.jam_batas >= 0 ? String(row[colIndexMap.jam_batas] || '').trim() || '17:00' : '17:00';
      const deskVal = colIndexMap.deskripsi >= 0 ? String(row[colIndexMap.deskripsi] || '').trim() : '';
      const dasarVal = colIndexMap.dasar_hukum >= 0 ? String(row[colIndexMap.dasar_hukum] || '').trim() : 'Peraturan DJPb LLAT';
      const rawTarget = colIndexMap.target >= 0 ? String(row[colIndexMap.target] || '').trim() : '';
      const targetList = rawTarget ? rawTarget.split(/[,;\/]/).map((t) => t.trim().toUpperCase().replace(/\s+/g, '_')) : ['SEMUA_SATKER'];

      validList.push({
        llat_id: `llat-imp-${Date.now()}-${validList.length}`,
        tahun_anggaran: currentYear,
        kode_kegiatan: kodeVal,
        nama_kegiatan: namaVal,
        kategori: katVal,
        deskripsi: deskVal || `Batas akhir ${namaVal}`,
        tanggal_mulai: `${currentYear}-12-01`,
        tanggal_batas: parsedDate,
        jam_batas: jamVal,
        timezone: 'WIB',
        status: 'BERJALAN',
        status_mode: 'AUTO',
        prioritas: prioVal,
        target_pengguna: targetList,
        dasar_hukum: dasarVal,
        nomor_peraturan: dasarVal,
        urutan: existingEvents.length + validList.length + 1,
        is_active: true,
        publikasi: 'DRAFT', // initial draft for admin safety
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        version: 1
      });
    });

    setValidatedData({
      validEvents: validList,
      errors: errorList,
      duplicateCount: dupCount
    });

    setStep(3);
  };

  const handleFinalImport = () => {
    if (validatedData.validEvents.length === 0) {
      alert('Tidak ada data valid yang dapat diimpor.');
      return;
    }
    onImportSuccess(validatedData.validEvents);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Import Kalender LLAT dari File Excel
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Langkah {step} dari 3: {step === 1 ? 'Pilih File' : step === 2 ? 'Pemetaan Kolom' : 'Validasi & Hasil'}
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

        {/* Step Indicator */}
        <div className="grid grid-cols-3 border-b border-slate-100 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-800/40 text-center text-xs font-bold py-2">
          <div className={`flex items-center justify-center gap-1.5 ${step >= 1 ? 'text-indigo-600 dark:text-indigo-400 font-extrabold' : 'text-slate-400'}`}>
            <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-[11px]">1</span>
            <span>Upload File</span>
          </div>
          <div className={`flex items-center justify-center gap-1.5 ${step >= 2 ? 'text-indigo-600 dark:text-indigo-400 font-extrabold' : 'text-slate-400'}`}>
            <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-[11px]">2</span>
            <span>Mapping Kolom</span>
          </div>
          <div className={`flex items-center justify-center gap-1.5 ${step >= 3 ? 'text-indigo-600 dark:text-indigo-400 font-extrabold' : 'text-slate-400'}`}>
            <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-[11px]">3</span>
            <span>Validasi &amp; Simpan</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
          {/* STEP 1: Upload */}
          {step === 1 && (
            <div className="space-y-4">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 rounded-2xl p-8 text-center cursor-pointer transition-all bg-slate-50/50 dark:bg-slate-800/30 group"
              >
                <Upload className="w-12 h-12 text-indigo-500 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                  Klik untuk Memilih File Excel Kalender (.xlsx / .xls)
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Sistem akan membaca susunan sheet dan baris tanpa mengubah file asli Anda
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 space-y-1">
                <span className="font-extrabold flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-blue-600" />
                  Petunjuk Pengunggahan:
                </span>
                <p className="text-[11px] leading-relaxed">
                  Tidak perlu khawatir jika format Excel Anda berbeda. Pada tahap berikutnya, Anda dapat memilih kolom mana yang merupakan Nama Kegiatan, Batas Waktu, Kategori, dan Prioritas.
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: Sheet Selector & Column Mapping */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500">File Terpilih:</span>
                  <p className="font-black text-slate-900 dark:text-white">{fileName}</p>
                </div>

                <div className="flex items-center gap-2">
                  <label className="font-bold text-slate-600 dark:text-slate-300">Pilih Sheet:</label>
                  <select
                    value={selectedSheet}
                    onChange={(e) => setSelectedSheet(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  >
                    {sheetNames.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Preview 3 Sample Rows */}
              <div>
                <span className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mb-2">
                  <Table className="w-4 h-4 text-indigo-500" />
                  Preview 3 Baris Data Awal dari Excel:
                </span>
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                  <table className="w-full text-[11px]">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black">
                      <tr>
                        {headers.map((h, i) => (
                          <th key={i} className="p-2 border-b border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rawRows.slice(0, 3).map((r, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          {headers.map((_, cIdx) => (
                            <td key={cIdx} className="p-2 border-b border-r border-slate-100 dark:border-slate-800 whitespace-nowrap text-slate-600 dark:text-slate-400">
                              {String(r[cIdx] !== undefined ? r[cIdx] : '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mapping Controls */}
              <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-3">
                <h4 className="font-black text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5 text-xs">
                  <ArrowRight className="w-4 h-4 text-indigo-600" />
                  Sesuaikan Pemetaan Kolom (Column Mapping)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nama Kegiatan <span className="text-rose-500">* (Wajib)</span>
                    </label>
                    <select
                      value={mapping.nama}
                      onChange={(e) => setMapping({ ...mapping, nama: e.target.value })}
                      className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                    >
                      <option value="">-- Pilih Kolom --</option>
                      {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Tanggal Batas (Deadline) <span className="text-rose-500">* (Wajib)</span>
                    </label>
                    <select
                      value={mapping.tanggal_batas}
                      onChange={(e) => setMapping({ ...mapping, tanggal_batas: e.target.value })}
                      className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                    >
                      <option value="">-- Pilih Kolom --</option>
                      {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Kode Kegiatan (Opsional)
                    </label>
                    <select
                      value={mapping.kode}
                      onChange={(e) => setMapping({ ...mapping, kode: e.target.value })}
                      className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    >
                      <option value="">-- Otomatis Digenerate --</option>
                      {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Kategori (Opsional)
                    </label>
                    <select
                      value={mapping.kategori}
                      onChange={(e) => setMapping({ ...mapping, kategori: e.target.value })}
                      className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    >
                      <option value="">-- Default: Lainnya --</option>
                      {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Prioritas (Opsional)
                    </label>
                    <select
                      value={mapping.prioritas}
                      onChange={(e) => setMapping({ ...mapping, prioritas: e.target.value })}
                      className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    >
                      <option value="">-- Default: NORMAL --</option>
                      {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Dasar Hukum / Peraturan (Opsional)
                    </label>
                    <select
                      value={mapping.dasar_hukum}
                      onChange={(e) => setMapping({ ...mapping, dasar_hukum: e.target.value })}
                      className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    >
                      <option value="">-- Kosongkan Jika Tidak Ada --</option>
                      {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Validation Result Preview */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200">
                  <span className="text-[10px] uppercase font-bold">Data Valid Siap Import</span>
                  <h4 className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                    {validatedData.validEvents.length} Item
                  </h4>
                </div>

                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200">
                  <span className="text-[10px] uppercase font-bold">Duplikasi Kode Diselaraskan</span>
                  <h4 className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">
                    {validatedData.duplicateCount} Item
                  </h4>
                </div>

                <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200">
                  <span className="text-[10px] uppercase font-bold">Baris Diabaikan (Invalid)</span>
                  <h4 className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1">
                    {validatedData.errors.length} Baris
                  </h4>
                </div>
              </div>

              {/* Sample of Validated Events */}
              <div>
                <span className="font-extrabold text-slate-800 dark:text-slate-200 mb-2 block">
                  Contoh Data yang Berhasil Divalidasi:
                </span>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {validatedData.validEvents.slice(0, 5).map((ev, i) => (
                    <div key={i} className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between text-[11px]">
                      <div>
                        <span className="font-mono font-bold text-slate-900 dark:text-white mr-2">{ev.kode_kegiatan}</span>
                        <span className="font-extrabold">{ev.nama_kegiatan}</span>
                      </div>
                      <span className="font-mono text-rose-600 font-bold">{ev.tanggal_batas}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 text-[11px]">
                <p className="font-bold">Catatan Publikasi:</p>
                <p>Seluruh data yang diimpor akan disimpan dengan status <strong>DRAFT</strong> agar Anda dapat meninjau kembali sebelum mempublikasikannya kepada Satuan Kerja.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((s) => Math.max(1, s - 1) as any)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold"
              >
                Kembali
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold"
            >
              Batal
            </button>

            {step === 2 && (
              <button
                type="button"
                onClick={handleValidateMapping}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black shadow-md flex items-center gap-1.5"
              >
                <span>Validasi Data</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {step === 3 && (
              <button
                type="button"
                onClick={handleFinalImport}
                disabled={validatedData.validEvents.length === 0}
                className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black shadow-md flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Simpan &amp; Import {validatedData.validEvents.length} Kegiatan</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
