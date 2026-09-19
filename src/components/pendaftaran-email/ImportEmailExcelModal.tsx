import React, { useState, useRef } from 'react';
import { 
  X, 
  UploadCloud, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  RefreshCw, 
  AlertCircle,
  FileCheck,
  Info
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { PegawaiEmailRecord, EmployeeStatusCode } from '../../types';
import { downloadPendaftaranEmailTemplate, getStatusNameByCode } from '../../utils/pendaftaranEmailExport';

interface ImportEmailExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (importedList: PegawaiEmailRecord[]) => void;
  kodeKppn: string;
  kodeSatker: string;
  existingPegawaiList: PegawaiEmailRecord[];
}

interface ParsedRowResult {
  rowNumber: number;
  data: PegawaiEmailRecord;
  errors: string[];
  warnings: string[];
  isValid: boolean;
}

export const ImportEmailExcelModal: React.FC<ImportEmailExcelModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
  kodeKppn,
  kodeSatker,
  existingPegawaiList
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedRowResult[]>([]);
  const [hasValidated, setHasValidated] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleReset = () => {
    setFile(null);
    setParsedRows([]);
    setHasValidated(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      processExcelFile(selected);
    }
  };

  const processExcelFile = async (uploadedFile: File) => {
    setIsProcessing(true);
    setHasValidated(false);

    try {
      const buffer = await uploadedFile.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = wb.SheetNames[0];
      const sheet = wb.Sheets[firstSheetName];

      if (!sheet) {
        throw new Error('Lembar kerja (Sheet) tidak ditemukan dalam file.');
      }

      // Convert sheet to array of arrays (header included)
      const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        raw: false, // Reads formatted string to prevent scientific notation truncation
        defval: ''
      });

      if (rawRows.length <= 1) {
        throw new Error('File tidak memiliki data atau hanya berisi baris judul.');
      }

      // Parse and validate rows
      // Headers at index 0
      // Columns:
      // A (0) = Kode KPPN
      // B (1) = Kode Satker
      // C (2) = Nama Pegawai
      // D (3) = NIP / NRP
      // E (4) = NIK
      // F (5) = Status (1=TNI; 2=POLRI; 3=PNS; 4=PPNPN; 5=P3K)
      
      const nipMap = new Map<string, number>();
      const nikMap = new Map<string, number>();

      // Track existing NIP/NIK to check collision with current draft
      const existingNipSet = new Set(existingPegawaiList.map(p => (p.nipNrp || '').trim().replace(/\s+/g, '')));
      const existingNikSet = new Set(existingPegawaiList.map(p => (p.nik || '').trim().replace(/\D/g, '')));

      const results: ParsedRowResult[] = [];

      for (let i = 1; i < rawRows.length; i++) {
        const row = rawRows[i];
        if (!row || row.every((c: any) => String(c || '').trim() === '')) {
          continue; // Skip empty row
        }

        const rowNum = i + 1;
        const rowErrors: string[] = [];
        const rowWarnings: string[] = [];

        const colKppn = String(row[0] || '').trim();
        const colSatker = String(row[1] || '').trim();
        const colNama = String(row[2] || '').trim();
        const colNip = String(row[3] || '').trim().replace(/\s+/g, '');
        const colNik = String(row[4] || '').trim().replace(/\D/g, '');
        const rawStatus = String(row[5] || '').trim();

        // 1. Validasi Nama
        if (!colNama) {
          rowErrors.push('Nama Pegawai kosong');
        }

        // 2. Validasi NIP / NRP
        if (!colNip) {
          rowErrors.push('NIP / NRP kosong');
        } else {
          // Check internal file duplicate
          if (nipMap.has(colNip)) {
            rowErrors.push(`Duplicate NIP/NRP (sama dengan baris ${nipMap.get(colNip)})`);
          } else {
            nipMap.set(colNip, rowNum);
          }

          // Check duplicate with existing draft
          if (existingNipSet.has(colNip)) {
            rowErrors.push(`NIP/NRP ${colNip} sudah ada di daftar draft saat ini`);
          }
        }

        // 3. Validasi NIK
        if (!colNik) {
          rowErrors.push('NIK kosong');
        } else {
          if (colNik.length !== 16) {
            rowWarnings.push(`NIK ${colNik.length} digit (standar 16 digit)`);
          }

          if (nikMap.has(colNik)) {
            rowErrors.push(`Duplicate NIK (sama dengan baris ${nikMap.get(colNik)})`);
          } else {
            nikMap.set(colNik, rowNum);
          }

          if (existingNikSet.has(colNik)) {
            rowErrors.push(`NIK ${colNik} sudah ada di daftar draft saat ini`);
          }
        }

        // 4. Validasi Status
        // Convert status string like "3", "3 - PNS", "PNS"
        let parsedStatusCode: EmployeeStatusCode = 3;
        if (rawStatus === '1' || rawStatus.toUpperCase().includes('TNI')) {
          parsedStatusCode = 1;
        } else if (rawStatus === '2' || rawStatus.toUpperCase().includes('POLRI')) {
          parsedStatusCode = 2;
        } else if (rawStatus === '3' || rawStatus.toUpperCase().includes('PNS')) {
          parsedStatusCode = 3;
        } else if (rawStatus === '4' || rawStatus.toUpperCase().includes('PPNPN')) {
          parsedStatusCode = 4;
        } else if (rawStatus === '5' || rawStatus.toUpperCase().includes('P3K') || rawStatus.toUpperCase().includes('PPPK')) {
          parsedStatusCode = 5;
        } else {
          const numStatus = parseInt(rawStatus, 10);
          if ([1, 2, 3, 4, 5].includes(numStatus)) {
            parsedStatusCode = numStatus as EmployeeStatusCode;
          } else {
            rowErrors.push(`Status "${rawStatus}" tidak valid (harus 1=TNI, 2=POLRI, 3=PNS, 4=PPNPN, 5=P3K)`);
          }
        }

        // Satker check warning if differs
        if (colSatker && colSatker !== kodeSatker) {
          rowWarnings.push(`Kode Satker di file (${colSatker}) akan diselaraskan dengan Satker aktif (${kodeSatker})`);
        }

        const dataRecord: PegawaiEmailRecord = {
          id: `email-peg-import-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
          kodeKppn: kodeKppn || '136',
          kodeSatker: kodeSatker,
          namaPegawai: colNama,
          nipNrp: colNip,
          nik: colNik,
          status: parsedStatusCode
        };

        results.push({
          rowNumber: rowNum,
          data: dataRecord,
          errors: rowErrors,
          warnings: rowWarnings,
          isValid: rowErrors.length === 0
        });
      }

      setParsedRows(results);
      setHasValidated(true);
    } catch (err: any) {
      alert(`Gagal memproses file Excel: ${err?.message || err}`);
      handleReset();
    } finally {
      setIsProcessing(false);
    }
  };

  const totalValid = parsedRows.filter(r => r.isValid).length;
  const totalError = parsedRows.filter(r => !r.isValid).length;

  const handleConfirmImport = (onlyValid = false) => {
    const targetRows = onlyValid ? parsedRows.filter(r => r.isValid) : parsedRows;
    if (targetRows.length === 0) {
      alert('Tidak ada data yang valid untuk diimpor.');
      return;
    }

    const importedData = targetRows.map(r => r.data);
    onImportSuccess(importedData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                📥 Import Data Pegawai dari Excel
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Format: Kode KPPN | Kode Satker | Nama Pegawai | NIP/NRP | NIK | Status (1-5)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 dark:text-slate-400 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Template Download Prompt */}
        <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <p className="text-xs text-indigo-900 dark:text-indigo-200">
              Belum memiliki format resmi? Unduh template Excel kosong siap pakai.
            </p>
          </div>
          <button
            type="button"
            onClick={() => downloadPendaftaranEmailTemplate(kodeKppn, kodeSatker)}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 border border-indigo-300 dark:border-indigo-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh Template Excel</span>
          </button>
        </div>

        {/* Upload Zone */}
        {!file && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-3xl p-8 text-center bg-slate-50/50 dark:bg-slate-800/30 transition-all cursor-pointer space-y-3 group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-white">
                Pilih atau seret file spreadsheet (.xlsx / .csv)
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Sistem akan memverifikasi kolom, duplikasi NIP/NIK, dan validitas kode status kepegawaian.
              </p>
            </div>
          </div>
        )}

        {/* Processing State */}
        {isProcessing && (
          <div className="py-12 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
              Membaca dan memvalidasi file Excel...
            </p>
          </div>
        )}

        {/* Validation Results Display */}
        {hasValidated && (
          <div className="flex-1 overflow-hidden flex flex-col space-y-3">
            {/* Status Summary */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Total Terbaca: <strong>{parsedRows.length}</strong> Baris
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  ✓ {totalValid} Valid
                </span>
                {totalError > 0 && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                    ✕ {totalError} Gagal Validasi
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
              >
                Ganti File
              </button>
            </div>

            {/* Error & Rows List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 border border-slate-200 dark:border-slate-800 rounded-2xl p-2.5">
              {parsedRows.map((r) => (
                <div
                  key={r.rowNumber}
                  className={`p-2.5 rounded-xl border text-xs transition-all ${
                    r.isValid
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                      : 'bg-rose-50/50 dark:bg-rose-950/25 border-rose-200 dark:border-rose-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700">
                        Row {r.rowNumber}
                      </span>
                      <span className="font-bold text-slate-800 dark:text-white truncate max-w-[180px]">
                        {r.data.namaPegawai || '(Tanpa Nama)'}
                      </span>
                      <span className="font-mono text-[10px] text-slate-500">
                        NIP: {r.data.nipNrp || '-'}
                      </span>
                      <span className="font-mono text-[10px] text-slate-500">
                        NIK: {r.data.nik || '-'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-white dark:bg-slate-800 border">
                        {getStatusNameByCode(r.data.status)} ({r.data.status})
                      </span>
                      {r.isValid ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                    </div>
                  </div>

                  {/* Errors display */}
                  {r.errors.length > 0 && (
                    <div className="mt-1.5 pt-1 border-t border-rose-200 dark:border-rose-800/40 space-y-0.5">
                      {r.errors.map((err, idx) => (
                        <p key={idx} className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                          <span>❌</span>
                          <span>{err}</span>
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Warnings display */}
                  {r.warnings.length > 0 && (
                    <div className="mt-1 pt-1 border-t border-amber-200 dark:border-amber-800/40 space-y-0.5">
                      {r.warnings.map((warn, idx) => (
                        <p key={idx} className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <span>⚠</span>
                          <span>{warn}</span>
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
          >
            Tutup
          </button>

          {hasValidated && (
            <div className="flex items-center gap-2">
              {totalError > 0 && totalValid > 0 && (
                <button
                  type="button"
                  onClick={() => handleConfirmImport(true)}
                  className="px-3.5 py-2 text-xs font-bold rounded-xl bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700 transition-all cursor-pointer"
                >
                  Impor {totalValid} Baris Valid Saja
                </button>
              )}

              <button
                type="button"
                disabled={totalError > 0 || totalValid === 0}
                onClick={() => handleConfirmImport(false)}
                className={`px-5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  totalError === 0 && totalValid > 0
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Simpan {totalValid} Pegawai ke Draft</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
