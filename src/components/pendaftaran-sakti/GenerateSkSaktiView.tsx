import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, 
  Download, 
  Eye, 
  Edit3, 
  Save, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  CheckCircle2, 
  AlertCircle, 
  Shield, 
  Calendar, 
  Building, 
  UserCheck, 
  Layers, 
  ZoomIn, 
  ZoomOut, 
  FileCheck, 
  RotateCcw,
  Sparkles,
  Info,
  Clock,
  Printer
} from 'lucide-react';
import { 
  SkSaktiDraft, 
  UserSaktiRecord, 
  PeranJabatanSakti, 
  SkAuditLog 
} from '../../types';
import { 
  createDefaultSkDraft, 
  validateSkForExport, 
  OFFICIAL_SK_TEMPLATE_VERSION 
} from '../../utils/defaultSkTemplate';
import { generateSkSaktiDocx, downloadBlobAsFile } from '../../utils/docxSkGenerator';
import { generateSkSaktiPdf } from '../../utils/pdfSkGenerator';
import { 
  PERAN_JABATAN_OPTIONS, 
  DEFAULT_JABATAN_PERBENDAHARAAN_OPTIONS 
} from '../../data/masterRoleSakti';
import { formatNIPDisplay } from '../../utils/pendaftaranSaktiValidation';

interface GenerateSkSaktiViewProps {
  kodeSatker: string;
  namaSatker: string;
  levelSatker: string;
  kpaName?: string;
  kpaNip?: string;
  users: UserSaktiRecord[];
  onUpdateUsers: (updatedUsers: UserSaktiRecord[]) => void;
  currentUser?: string;
}

export const GenerateSkSaktiView: React.FC<GenerateSkSaktiViewProps> = ({
  kodeSatker,
  namaSatker,
  levelSatker,
  kpaName,
  kpaNip,
  users,
  onUpdateUsers,
  currentUser = 'Operator Satker'
}) => {
  const storageKey = `sakti_sk_draft_${kodeSatker}`;

  // Active view mode: PREVIEW or EDIT
  const [viewMode, setViewMode] = useState<'PREVIEW' | 'EDIT'>('PREVIEW');

  // Zoom level for A4 paper preview (50% to 125%)
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // Template Info Modal state
  const [showTemplateModal, setShowTemplateModal] = useState<boolean>(false);

  // Status message for actions
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Initialize draft from localStorage or default
  const [draft, setDraft] = useState<SkSaktiDraft>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure auto fields are in sync with current satker
        parsed.kodeSatker = kodeSatker;
        parsed.namaSatker = namaSatker;
        parsed.levelSatker = levelSatker;
        return parsed;
      }
    } catch (e) {
      console.error('Failed to parse saved SK draft', e);
    }
    return createDefaultSkDraft(kodeSatker, namaSatker, levelSatker, kpaName, kpaNip, users);
  });

  // Keep selectedUserIds synchronized if users list changes
  useEffect(() => {
    setDraft(prev => {
      const currentIds = new Set(users.map(u => u.id));
      const validSelected = prev.selectedUserIds.filter(id => currentIds.has(id));
      // If none selected, default to all
      const finalSelected = validSelected.length > 0 ? validSelected : users.map(u => u.id);
      return {
        ...prev,
        kodeSatker,
        namaSatker,
        levelSatker,
        selectedUserIds: finalSelected
      };
    });
  }, [users, kodeSatker, namaSatker, levelSatker]);

  // Pre-flight validation
  const validationResult = useMemo(() => {
    return validateSkForExport(draft, users);
  }, [draft, users]);

  // Filter selected users for preview/table
  const selectedUsers = useMemo(() => {
    return users.filter(u => draft.selectedUserIds.includes(u.id));
  }, [users, draft.selectedUserIds]);

  // Show temporary notice
  const showNotice = (type: 'success' | 'error' | 'info', text: string) => {
    setActionNotice({ type, text });
    setTimeout(() => {
      setActionNotice(null);
    }, 4000);
  };

  // Save draft to localStorage and update status
  const handleSaveDraft = (logAction: 'CREATE' | 'UPDATE' = 'UPDATE', customMsg?: string) => {
    const newLog: SkAuditLog = {
      id: `log_${Date.now()}`,
      action: logAction,
      user: currentUser,
      timestamp: new Date().toISOString(),
      details: customMsg || (validationResult.isValid ? 'Draft disimpan (Status: READY)' : 'Draft disimpan (Status: DRAFT)')
    };

    const updatedDraft: SkSaktiDraft = {
      ...draft,
      status: validationResult.isValid ? 'READY' : 'DRAFT',
      updatedAt: new Date().toISOString(),
      exportHistory: [newLog, ...(draft.exportHistory || [])]
    };

    setDraft(updatedDraft);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updatedDraft));
      showNotice('success', 'Draft SK SAKTI berhasil disimpan.');
    } catch (e) {
      showNotice('error', 'Gagal menyimpan draft ke memori lokal.');
    }
  };

  // Reset to default template
  const handleResetToDefault = () => {
    if (confirm('Kembalikan draft SK ke format default template resmi? Perubahan teks kustom Anda akan disetel ulang.')) {
      const freshDraft = createDefaultSkDraft(kodeSatker, namaSatker, levelSatker, kpaName, kpaNip, users);
      setDraft(freshDraft);
      localStorage.setItem(storageKey, JSON.stringify(freshDraft));
      showNotice('info', 'Format SK telah dikembalikan ke template resmi standar.');
    }
  };

  // Export to native Word (.docx)
  const [isExportingWord, setIsExportingWord] = useState(false);
  const handleExportWord = async () => {
    if (!validationResult.isValid) {
      alert(`Mohon lengkapi data SK sebelum mengunduh Word:\n• ${validationResult.errors.join('\n• ')}`);
      return;
    }

    setIsExportingWord(true);
    try {
      const blob = await generateSkSaktiDocx(draft, users);
      const fileName = `SK_Penetapan_User_SAKTI_${draft.kodeSatker}_TA${draft.tahunAnggaran}.docx`;
      downloadBlobAsFile(blob, fileName);

      // Log audit
      const exportLog: SkAuditLog = {
        id: `log_${Date.now()}`,
        action: 'EXPORT_WORD',
        user: currentUser,
        timestamp: new Date().toISOString(),
        details: `Berhasil mengunduh dokumen Word (.docx): ${fileName}`
      };

      const updatedDraft: SkSaktiDraft = {
        ...draft,
        status: 'EXPORTED',
        exportedAt: new Date().toISOString(),
        exportHistory: [exportLog, ...(draft.exportHistory || [])]
      };
      setDraft(updatedDraft);
      localStorage.setItem(storageKey, JSON.stringify(updatedDraft));

      showNotice('success', `Dokumen Word (.docx) berhasil dibuat dan diunduh.`);
    } catch (err) {
      console.error('Word export error:', err);
      showNotice('error', 'Terjadi kesalahan saat meng-generate dokumen Word.');
    } finally {
      setIsExportingWord(false);
    }
  };

  // Export to PDF (.pdf)
  const handleExportPdf = () => {
    if (!validationResult.isValid) {
      alert(`Mohon lengkapi data SK sebelum mengunduh PDF:\n• ${validationResult.errors.join('\n• ')}`);
      return;
    }

    try {
      generateSkSaktiPdf(draft, users);

      // Log audit
      const exportLog: SkAuditLog = {
        id: `log_${Date.now()}`,
        action: 'EXPORT_PDF',
        user: currentUser,
        timestamp: new Date().toISOString(),
        details: `Berhasil mengunduh dokumen PDF (.pdf)`
      };

      const updatedDraft: SkSaktiDraft = {
        ...draft,
        status: 'EXPORTED',
        exportedAt: new Date().toISOString(),
        exportHistory: [exportLog, ...(draft.exportHistory || [])]
      };
      setDraft(updatedDraft);
      localStorage.setItem(storageKey, JSON.stringify(updatedDraft));

      showNotice('success', `Dokumen PDF resmi berhasil dibuat dan diunduh.`);
    } catch (err) {
      console.error('PDF export error:', err);
      showNotice('error', 'Terjadi kesalahan saat meng-generate dokumen PDF.');
    }
  };

  // Toggle user inclusion in SK
  const handleToggleUserInclusion = (userId: string) => {
    setDraft(prev => {
      const isIncluded = prev.selectedUserIds.includes(userId);
      const nextIds = isIncluded
        ? prev.selectedUserIds.filter(id => id !== userId)
        : [...prev.selectedUserIds, userId];
      return { ...prev, selectedUserIds: nextIds };
    });
  };

  // Select all or deselect all users
  const handleSelectAllUsers = (select: boolean) => {
    setDraft(prev => ({
      ...prev,
      selectedUserIds: select ? users.map(u => u.id) : []
    }));
  };

  // Quick edit user attribute in SK view (single source of truth)
  const handleQuickUpdateUser = (userId: string, updates: Partial<UserSaktiRecord>) => {
    const updated = users.map(u => u.id === userId ? { ...u, ...updates } : u);
    onUpdateUsers(updated);
  };

  // Format date helper for display
  const formatIndoDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const months = [
          'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
          'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];
        const day = parseInt(parts[2], 10);
        const month = months[parseInt(parts[1], 10) - 1] || parts[1];
        const year = parts[0];
        return `${day} ${month} ${year}`;
      }
    } catch {
      // fallback
    }
    return dateStr;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-4 sm:p-6 transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                <Sparkles className="w-3 h-3" />
                Template Resmi Kemenkeu v{OFFICIAL_SK_TEMPLATE_VERSION}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <FileCheck className="w-3 h-3" />
                Status: {draft.status}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                🔒 AUTO DATA: {draft.namaSatker} ({draft.kodeSatker})
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              Generate SK Penetapan User SAKTI
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-3xl">
              Dibuat otomatis mengacu pada template resmi <em>Format SK Penetapan User SAKTI - Satker.docx</em>. Menggunakan satu sumber data pendaftaran tanpa double entry.
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            {/* View Mode Switcher */}
            <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setViewMode('PREVIEW')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'PREVIEW'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                Preview A4
              </button>
              <button
                type="button"
                onClick={() => setViewMode('EDIT')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'EDIT'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                Form &amp; Editor SK
              </button>
            </div>

            {/* Simpan Draft */}
            <button
              type="button"
              onClick={() => handleSaveDraft('UPDATE')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all border border-slate-200 dark:border-slate-700"
            >
              <Save className="w-3.5 h-3.5 text-slate-500" />
              Simpan Draft
            </button>

            {/* Download Word (.docx) */}
            <button
              type="button"
              disabled={isExportingWord}
              onClick={handleExportWord}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all disabled:opacity-50"
              title="Unduh file Microsoft Word asli (.docx) yang dapat diedit langsung"
            >
              <FileText className="w-3.5 h-3.5" />
              {isExportingWord ? 'Membuat Word...' : 'Download Word (.docx)'}
            </button>

            {/* Download PDF (.pdf) */}
            <button
              type="button"
              onClick={handleExportPdf}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
              title="Unduh dokumen resmi format PDF"
            >
              <Download className="w-3.5 h-3.5" />
              Download PDF
            </button>

            {/* Info Template */}
            <button
              type="button"
              onClick={() => setShowTemplateModal(true)}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              title="Informasi Template Resmi"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Temporary Action Notice */}
        {actionNotice && (
          <div className={`mt-4 p-3 rounded-xl text-xs font-medium flex items-center gap-2 border ${
            actionNotice.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800'
              : actionNotice.type === 'error'
                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-800'
                : 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-800'
          }`}>
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{actionNotice.text}</span>
          </div>
        )}

        {/* Pre-flight Warning / Validation Summary */}
        {!validationResult.isValid && (
          <div className="mt-4 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold">Dokumen Belum Memenuhi Syarat Ekspor Final ({validationResult.errors.length} hal perlu dilengkapi):</p>
              <ul className="list-disc pl-5 mt-1 space-y-0.5 text-[11px]">
                {validationResult.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
              <p className="mt-2 text-[11px] text-amber-800 dark:text-amber-300">
                Klik tab <strong>"Form &amp; Editor SK"</strong> untuk melengkapi kolom yang belum terisi.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* VIEW MODE 1: LIVE A4 PAPER PREVIEW                                    */}
      {/* ===================================================================== */}
      {viewMode === 'PREVIEW' && (
        <div className="space-y-4">
          {/* Preview Controls Bar */}
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <Eye className="w-4 h-4 text-indigo-500" />
              <span>Simulasi Tampilan Lembar A4 Dokumen Resmi</span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Total {draft.hideInstructionPage ? '3 Halaman' : '4 Halaman'}
              </span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <span className="text-slate-700 dark:text-slate-300">
                {selectedUsers.length} User Masuk Lampiran
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Zoom:</span>
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.max(50, prev - 25))}
                disabled={zoomLevel <= 50}
                className="p-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-mono font-bold w-12 text-center text-slate-800 dark:text-slate-200">
                {zoomLevel}%
              </span>
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.min(125, prev + 25))}
                disabled={zoomLevel >= 125}
                className="p-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Scaled Multi-Page Container */}
          <div className="overflow-x-auto p-4 sm:p-8 bg-slate-200/70 dark:bg-slate-950/70 rounded-2xl flex flex-col items-center gap-8">
            <div 
              className="flex flex-col gap-10 transition-transform origin-top"
              style={{ transform: `scale(${zoomLevel / 100})` }}
            >
              {/* PAGE 1: KOP, JUDUL, MENIMBANG, MENGINGAT */}
              <div className="w-[210mm] min-h-[297mm] bg-white text-slate-900 shadow-2xl p-[25mm] relative font-serif text-[11pt] leading-relaxed select-text">
                <div className="absolute bottom-4 right-8 text-[9pt] font-sans text-slate-400">
                  Halaman 1 dari {draft.hideInstructionPage ? '3' : '4'}
                </div>

                {/* Kop Surat */}
                <div className="text-center font-bold font-sans tracking-wide">
                  {draft.kopSurat.kementerian && (
                    <div className="text-[12pt] leading-tight">{draft.kopSurat.kementerian.toUpperCase()}</div>
                  )}
                  {draft.kopSurat.eselon1 && (
                    <div className="text-[12pt] leading-tight mt-0.5">{draft.kopSurat.eselon1.toUpperCase()}</div>
                  )}
                  <div className="text-[13pt] leading-tight mt-0.5">
                    {(draft.kopSurat.satkerUnit || draft.namaSatker).toUpperCase()}
                  </div>
                  {draft.kopSurat.alamatKontak && (
                    <div className="text-[8.5pt] font-normal text-slate-600 mt-1">
                      {draft.kopSurat.alamatKontak}
                    </div>
                  )}
                </div>

                {/* Double divider line */}
                <div className="mt-3 mb-6 border-b-2 border-slate-900"></div>

                {/* Judul SK */}
                <div className="text-center font-bold mb-6">
                  <div className="text-[11.5pt]">
                    KEPUTUSAN {(draft.pejabat.jabatan || 'KUASA PENGGUNA ANGGARAN').toUpperCase()} {draft.namaSatker.toUpperCase()}
                  </div>
                  <div className="text-[11.5pt] mt-1">
                    NOMOR {draft.nomorSk || 'KEP-    /    /    /2026'}
                  </div>
                  <div className="text-[11.5pt] mt-2">TENTANG</div>
                  <div className="text-[11.5pt] mt-1 px-8 leading-snug">
                    {draft.tentang.toUpperCase()}
                  </div>
                  <div className="text-[11pt] mt-5">
                    {(draft.pejabat.jabatan || 'KUASA PENGGUNA ANGGARAN').toUpperCase()} {draft.namaSatker.toUpperCase()},
                  </div>
                </div>

                {/* Menimbang */}
                <div className="flex gap-4 mb-4">
                  <div className="w-24 font-bold shrink-0">Menimbang :</div>
                  <div className="flex-1 space-y-2 text-justify">
                    {draft.menimbang.map((item, i) => (
                      <div key={item.id} className="flex gap-2">
                        <span className="font-bold shrink-0">{item.huruf || String.fromCharCode(97 + i)}.</span>
                        <span>{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mengingat */}
                <div className="flex gap-4">
                  <div className="w-24 font-bold shrink-0">Mengingat   :</div>
                  <div className="flex-1 space-y-2 text-justify">
                    {draft.mengingat.map((item, i) => (
                      <div key={item.id} className="flex gap-2">
                        <span className="font-bold shrink-0">{item.nomor || i + 1}.</span>
                        <span>{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* PAGE 2: MEMUTUSKAN, DIKTUM PERTAMA - KEEMPAT, PEJABAT */}
              <div className="w-[210mm] min-h-[297mm] bg-white text-slate-900 shadow-2xl p-[25mm] relative font-serif text-[11pt] leading-relaxed select-text">
                <div className="absolute bottom-4 right-8 text-[9pt] font-sans text-slate-400">
                  Halaman 2 dari {draft.hideInstructionPage ? '3' : '4'}
                </div>

                <div className="text-center font-bold text-[12pt] mb-4">
                  MEMUTUSKAN:
                </div>

                <div className="flex gap-4 mb-4">
                  <div className="w-24 font-bold shrink-0">Menetapkan :</div>
                  <div className="flex-1 text-justify font-bold">
                    {draft.menetapkan}
                  </div>
                </div>

                {/* Diktum Pertama s/d Keempat */}
                <div className="space-y-3 mb-10">
                  {draft.diktum.map((dik) => (
                    <div key={dik.id} className="flex gap-4">
                      <div className="w-24 font-bold shrink-0">{dik.label} :</div>
                      <div className="flex-1 text-justify">
                        {dik.text}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tanda Tangan KPA */}
                <div className="ml-auto w-80 text-right mt-16">
                  <div>Ditetapkan di {draft.tempatPenetapan || 'Semarang'}</div>
                  <div className="mb-2">pada tanggal {formatIndoDate(draft.tanggalSk) || '                   '}</div>
                  <div className="font-bold leading-snug">
                    {(draft.pejabat.jabatan || 'Kuasa Pengguna Anggaran').toUpperCase()} {draft.namaSatker.toUpperCase()},
                  </div>
                  
                  {/* Tanda Tangan Box */}
                  <div className="h-24 flex items-center justify-center text-xs text-slate-400 font-sans italic">
                    (tanda tangan &amp; cap dinas)
                  </div>

                  <div className="font-bold underline text-[11.5pt]">
                    {draft.pejabat.namaPejabat || '( .................................................... )'}
                  </div>
                  <div className="text-[10pt] font-sans">
                    NIP {draft.pejabat.nipPejabat || '....................................'}
                  </div>
                </div>
              </div>

              {/* PAGE 3: LAMPIRAN TABEL PENGGUNA SAKTI */}
              <div className="w-[210mm] min-h-[297mm] bg-white text-slate-900 shadow-2xl p-[22mm] relative font-serif text-[10pt] leading-normal select-text">
                <div className="absolute bottom-4 right-8 text-[9pt] font-sans text-slate-400">
                  Halaman 3 dari {draft.hideInstructionPage ? '3' : '4'}
                </div>

                {/* Header Lampiran */}
                <div className="font-bold text-[9.5pt] mb-3">
                  <div>LAMPIRAN KEPUTUSAN {(draft.pejabat.jabatan || 'KUASA PENGGUNA ANGGARAN').toUpperCase()} {draft.namaSatker.toUpperCase()}</div>
                  <div className="flex gap-2"><span>NOMOR</span><span>: {draft.nomorSk}</span></div>
                  <div className="flex gap-2"><span>TANGGAL</span><span>: {formatIndoDate(draft.tanggalSk)}</span></div>
                </div>

                <div className="text-center font-bold mb-4">
                  <div className="text-[10.5pt]">DAFTAR PEJABAT, OPERATOR, DAN ADMINISTRATOR PENGGUNA SISTEM SAKTI</div>
                  <div className="text-[10.5pt]">TINGKAT SATUAN KERJA</div>
                  <div className="text-[10.5pt]">PADA {draft.namaSatker.toUpperCase()} ({draft.kodeSatker})</div>
                  <div className="text-[10.5pt]">TAHUN ANGGARAN {draft.tahunAnggaran}</div>
                </div>

                {/* Tabel Pengguna SAKTI */}
                <table className="w-full border-collapse border border-slate-400 text-[8.5pt] font-sans mb-8">
                  <thead>
                    <tr className="bg-slate-100 text-slate-900 text-center font-bold">
                      <th className="border border-slate-400 px-2 py-2 w-10">NO</th>
                      <th className="border border-slate-400 px-3 py-2 text-left">NAMA / NIP / PANGKAT / GOLONGAN</th>
                      <th className="border border-slate-400 px-3 py-2 text-left">JABATAN</th>
                      <th className="border border-slate-400 px-2 py-2 w-28">PERAN JABATAN</th>
                      <th className="border border-slate-400 px-3 py-2 text-left">JABATAN PERBENDAHARAAN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="border border-slate-400 p-4 text-center text-slate-400 italic font-sans">
                          Belum ada pengguna yang dipilih untuk dimasukkan ke dalam SK.
                        </td>
                      </tr>
                    ) : (
                      selectedUsers.map((user, idx) => (
                        <tr key={user.id} className="align-top">
                          <td className="border border-slate-400 px-2 py-2 text-center font-mono">{idx + 1}</td>
                          <td className="border border-slate-400 px-3 py-2">
                            <div className="font-bold text-slate-900">{user.namaLengkap || '-'}</div>
                            <div className="text-slate-600 font-mono text-[8pt]">NIP. {user.nip || '-'}</div>
                            <div className="text-slate-700 text-[8pt]">{user.pangkatGolongan || 'Penata / III/c'}</div>
                          </td>
                          <td className="border border-slate-400 px-3 py-2 text-slate-800">
                            {user.jabatan || 'Pengelola Keuangan / Pelaksana'}
                          </td>
                          <td className="border border-slate-400 px-2 py-2 text-center font-bold">
                            <span className={`inline-block px-2 py-0.5 rounded text-[8pt] ${
                              user.peranJabatan === 'Approval' ? 'bg-purple-100 text-purple-900' :
                              user.peranJabatan === 'Validator' ? 'bg-amber-100 text-amber-900' :
                              user.peranJabatan === 'Admin' ? 'bg-rose-100 text-rose-900' :
                              'bg-blue-100 text-blue-900'
                            }`}>
                              {user.peranJabatan || 'Operator'}
                            </span>
                          </td>
                          <td className="border border-slate-400 px-3 py-2 font-medium text-slate-800">
                            {user.jabatanPerbendaharaan || 'Operator Anggaran'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                {/* Tanda Tangan Lampiran */}
                <div className="ml-auto w-80 text-right mt-6">
                  <div>Ditetapkan di {draft.tempatPenetapan || 'Semarang'}</div>
                  <div className="mb-1">pada tanggal {formatIndoDate(draft.tanggalSk) || '                   '}</div>
                  <div className="font-bold leading-snug">
                    {(draft.pejabat.jabatan || 'Kuasa Pengguna Anggaran').toUpperCase()} {draft.namaSatker.toUpperCase()},
                  </div>
                  
                  <div className="h-20 flex items-center justify-center text-xs text-slate-400 font-sans italic">
                    (tanda tangan &amp; cap dinas)
                  </div>

                  <div className="font-bold underline text-[10.5pt]">
                    {draft.pejabat.namaPejabat || '( .................................................... )'}
                  </div>
                  <div className="text-[9pt] font-sans">
                    NIP {draft.pejabat.nipPejabat || '....................................'}
                  </div>
                </div>
              </div>

              {/* PAGE 4 (OPSIONAL): PETUNJUK PENGISIAN */}
              {!draft.hideInstructionPage && (
                <div className="w-[210mm] min-h-[297mm] bg-white text-slate-900 shadow-2xl p-[25mm] relative font-sans text-[10pt] leading-relaxed select-text">
                  <div className="absolute bottom-4 right-8 text-[9pt] text-slate-400">
                    Halaman 4 dari 4 (Petunjuk Pengisian)
                  </div>

                  <div className="text-center font-bold text-[12pt] mb-6 border-b pb-3 border-slate-300">
                    PETUNJUK PENGISIAN FORMAT SK PENETAPAN USER SAKTI
                  </div>

                  <ol className="list-decimal pl-6 space-y-3 text-justify text-slate-700">
                    <li>
                      <strong>Format Surat Keputusan (SK)</strong> ini merupakan format baku penetapan pengguna SAKTI tingkat satuan kerja sesuai pedoman resmi Kementerian Keuangan.
                    </li>
                    <li>
                      <strong>NAMA / NIP / PANGKAT / GOLONGAN</strong> diisi nama lengkap pegawai sesuai data resmi kepegawaian (BKN), NIP 18 digit tanpa spasi/titik, serta pangkat/golongan ruang terakhir.
                    </li>
                    <li>
                      <strong>JABATAN</strong> diisi jabatan kedinasan definitif pegawai pada struktur organisasi satuan kerja (misal: Kepala Seksi, Kepala Subbagian Umum, Analis Anggaran, Pelaksana).
                    </li>
                    <li>
                      <strong>PERAN JABATAN</strong> wajib dipilih salah satu dari 4 (empat) peran kewenangan resmi SAKTI:
                      <ul className="list-disc pl-5 mt-1 space-y-1 text-[9.5pt]">
                        <li><em>Approval</em>: Pejabat yang berwenang menyetujui transaksi anggaran/komitmen (KPA, PPK).</li>
                        <li><em>Validator</em>: Pejabat yang bertugas menguji dan memvalidasi kebenaran dokumen perintah pembayaran (PPSPM).</li>
                        <li><em>Operator</em>: Pelaksana teknis perekaman dan pengolahan data modul (Anggaran, Komitmen, Pembayaran, Bendahara, Aset, Persediaan, GLP).</li>
                        <li><em>Admin</em>: Pengelola administrasi pengguna, pembagian kewenangan user, dan pemeliharaan teknis di tingkat Satker.</li>
                      </ul>
                    </li>
                    <li>
                      <strong>JABATAN PERBENDAHARAAN</strong> mencantumkan peran pengelolaan keuangan negara yang diampu (KPA, PPK, PPSPM, Bendahara Pengeluaran, Bendahara Penerimaan, Operator Komitmen, Operator Pembayaran, Operator Anggaran, Administrator SAKTI).
                    </li>
                    <li>
                      <strong>Asas Pemisahan Kewenangan (Segregation of Duties)</strong> wajib dipatuhi. Dilarang merangkap jabatan yang saling menguji (misal: PPK merangkap PPSPM atau Bendahara merangkap PPK/PPSPM).
                    </li>
                    <li>
                      Surat Keputusan yang telah ditandatangani KPA dan dibubuhi cap dinas resmi diunggah melalui formulir elektronik pendaftaran user SAKTI atau disampaikan ke KPPN Semarang I.
                    </li>
                  </ol>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* VIEW MODE 2: FORM & DOCUMENT EDITOR                                   */}
      {/* ===================================================================== */}
      {viewMode === 'EDIT' && (
        <div className="space-y-6">
          {/* Section 1: Kop Surat & Identitas SK */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-500" />
              1. Kop Surat &amp; Identitas Keputusan
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Kementerian / Lembaga */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Kementerian / Lembaga (Baris Kop 1)
                </label>
                <input
                  type="text"
                  value={draft.kopSurat.kementerian}
                  onChange={e => setDraft({
                    ...draft,
                    kopSurat: { ...draft.kopSurat, kementerian: e.target.value }
                  })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              {/* Unit Eselon 1 */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Unit Eselon I / Ditjen (Baris Kop 2)
                </label>
                <input
                  type="text"
                  value={draft.kopSurat.eselon1}
                  onChange={e => setDraft({
                    ...draft,
                    kopSurat: { ...draft.kopSurat, eselon1: e.target.value }
                  })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              {/* Satuan Kerja (Auto) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Satuan Kerja (Baris Kop 3)
                  </label>
                  <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400">🔒 AUTO DATA</span>
                </div>
                <input
                  type="text"
                  value={draft.kopSurat.satkerUnit}
                  onChange={e => setDraft({
                    ...draft,
                    kopSurat: { ...draft.kopSurat, satkerUnit: e.target.value }
                  })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              {/* Alamat & Kontak Kop */}
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Alamat &amp; Kontak Instansi (Baris Bawah Kop)
                </label>
                <input
                  type="text"
                  value={draft.kopSurat.alamatKontak}
                  onChange={e => setDraft({
                    ...draft,
                    kopSurat: { ...draft.kopSurat, alamatKontak: e.target.value }
                  })}
                  placeholder="Contoh: Jalan Ki Mangunsarkoro No. 34, Semarang 50241, Telepon (024) 8311195"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              {/* Nomor SK */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nomor Surat Keputusan (SK) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={draft.nomorSk}
                  onChange={e => setDraft({ ...draft, nomorSk: e.target.value })}
                  placeholder="KEP-01/KPA/308365/2026"
                  className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              {/* Tahun Anggaran */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tahun Anggaran <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={4}
                  value={draft.tahunAnggaran}
                  onChange={e => setDraft({ ...draft, tahunAnggaran: e.target.value })}
                  placeholder="2026"
                  className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              {/* Tanggal SK */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tanggal SK Ditetapkan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={draft.tanggalSk}
                  onChange={e => setDraft({ ...draft, tanggalSk: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              {/* Tempat Penetapan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tempat Penetapan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={draft.tempatPenetapan}
                  onChange={e => setDraft({ ...draft, tempatPenetapan: e.target.value })}
                  placeholder="Semarang"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              {/* Tentang SK */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tentang / Judul Penetapan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={draft.tentang}
                  onChange={e => setDraft({ ...draft, tentang: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none font-medium"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Butir Menimbang & Mengingat */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Menimbang Editor */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                    2. Poin Menimbang
                  </h4>
                  <p className="text-[11px] text-slate-400">Pertimbangan penetapan SK SAKTI</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const nextHuruf = String.fromCharCode(97 + draft.menimbang.length);
                    setDraft({
                      ...draft,
                      menimbang: [
                        ...draft.menimbang,
                        { id: `mnb_${Date.now()}`, huruf: nextHuruf, text: 'bahwa ...' }
                      ]
                    });
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tambah Butir
                </button>
              </div>

              <div className="space-y-3">
                {draft.menimbang.map((item, idx) => (
                  <div key={item.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        Butir ({item.huruf || String.fromCharCode(97 + idx)}.)
                      </span>
                      <div className="flex items-center gap-1">
                        {idx > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              const arr = [...draft.menimbang];
                              [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
                              // reassign huruf
                              arr.forEach((it, i) => it.huruf = String.fromCharCode(97 + i));
                              setDraft({ ...draft, menimbang: arr });
                            }}
                            className="p-1 text-slate-400 hover:text-slate-600"
                            title="Pindah ke Atas"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {idx < draft.menimbang.length - 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const arr = [...draft.menimbang];
                              [arr[idx + 1], arr[idx]] = [arr[idx], arr[idx + 1]];
                              arr.forEach((it, i) => it.huruf = String.fromCharCode(97 + i));
                              setDraft({ ...draft, menimbang: arr });
                            }}
                            className="p-1 text-slate-400 hover:text-slate-600"
                            title="Pindah ke Bawah"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {draft.menimbang.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const filtered = draft.menimbang.filter(m => m.id !== item.id);
                              filtered.forEach((it, i) => it.huruf = String.fromCharCode(97 + i));
                              setDraft({ ...draft, menimbang: filtered });
                            }}
                            className="p-1 text-rose-500 hover:text-rose-700"
                            title="Hapus Butir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <textarea
                      rows={2}
                      value={item.text}
                      onChange={e => {
                        const updated = draft.menimbang.map(m => m.id === item.id ? { ...m, text: e.target.value } : m);
                        setDraft({ ...draft, menimbang: updated });
                      }}
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Mengingat Editor */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                    3. Dasar Hukum (Mengingat)
                  </h4>
                  <p className="text-[11px] text-slate-400">Regulasi resmi penetapan SAKTI</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setDraft({
                      ...draft,
                      mengingat: [
                        ...draft.mengingat,
                        { id: `mng_${Date.now()}`, nomor: draft.mengingat.length + 1, text: 'Peraturan ...' }
                      ]
                    });
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tambah Peraturan
                </button>
              </div>

              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                {draft.mengingat.map((item, idx) => (
                  <div key={item.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        Dasar Hukum #{item.nomor || idx + 1}
                      </span>
                      <div className="flex items-center gap-1">
                        {idx > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              const arr = [...draft.mengingat];
                              [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
                              arr.forEach((it, i) => it.nomor = i + 1);
                              setDraft({ ...draft, mengingat: arr });
                            }}
                            className="p-1 text-slate-400 hover:text-slate-600"
                            title="Pindah ke Atas"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {idx < draft.mengingat.length - 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const arr = [...draft.mengingat];
                              [arr[idx + 1], arr[idx]] = [arr[idx], arr[idx + 1]];
                              arr.forEach((it, i) => it.nomor = i + 1);
                              setDraft({ ...draft, mengingat: arr });
                            }}
                            className="p-1 text-slate-400 hover:text-slate-600"
                            title="Pindah ke Bawah"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {draft.mengingat.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const filtered = draft.mengingat.filter(m => m.id !== item.id);
                              filtered.forEach((it, i) => it.nomor = i + 1);
                              setDraft({ ...draft, mengingat: filtered });
                            }}
                            className="p-1 text-rose-500 hover:text-rose-700"
                            title="Hapus Peraturan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <textarea
                      rows={2}
                      value={item.text}
                      onChange={e => {
                        const updated = draft.mengingat.map(m => m.id === item.id ? { ...m, text: e.target.value } : m);
                        setDraft({ ...draft, mengingat: updated });
                      }}
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Diktum Memutuskan & Pejabat Penandatangan */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-5">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-500" />
              4. Diktum Keputusan &amp; Pejabat Penandatangan
            </h3>

            {/* Menetapkan */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Kalimat Menetapkan:
              </label>
              <textarea
                rows={2}
                value={draft.menetapkan}
                onChange={e => setDraft({ ...draft, menetapkan: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Diktum Pertama s/d Keempat */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {draft.diktum.map((dik, idx) => (
                <div key={dik.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                    <span>DIKTUM {dik.label}</span>
                    {dik.isCustomizable ? (
                      <span className="text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded font-bold">
                        Bisa Disesuaikan Satker
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">Format Baku Template</span>
                    )}
                  </div>
                  <textarea
                    rows={3}
                    value={dik.text}
                    onChange={e => {
                      const updated = draft.diktum.map(d => d.id === dik.id ? { ...d, text: e.target.value } : d);
                      setDraft({ ...draft, diktum: updated });
                    }}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              ))}
            </div>

            {/* Pejabat Penandatangan */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-indigo-500" />
                Pejabat Yang Menetapkan (KPA / Kepala Satker)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Jabatan Pejabat <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={draft.pejabat.jabatan}
                    onChange={e => setDraft({
                      ...draft,
                      pejabat: { ...draft.pejabat, jabatan: e.target.value }
                    })}
                    placeholder="Kuasa Pengguna Anggaran"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Lengkap &amp; Gelar <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={draft.pejabat.namaPejabat}
                    onChange={e => setDraft({
                      ...draft,
                      pejabat: { ...draft.pejabat, namaPejabat: e.target.value }
                    })}
                    placeholder="Contoh: Drs. Bambang Wijaya, M.M."
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    NIP Pejabat (18 Digit) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={18}
                    value={draft.pejabat.nipPejabat}
                    onChange={e => setDraft({
                      ...draft,
                      pejabat: { ...draft.pejabat, nipPejabat: e.target.value.replace(/\D/g, '').slice(0, 18) }
                    })}
                    placeholder="197508201998031001"
                    className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  {draft.pejabat.nipPejabat && draft.pejabat.nipPejabat.length === 18 && (
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {formatNIPDisplay(draft.pejabat.nipPejabat)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Tabel Seleksi & Kelengkapan Data User Lampiran SK */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-500" />
                  5. Pilih Pengguna Masuk Lampiran SK SAKTI
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Data diambil dari satu sumber pendaftaran formulir. Anda dapat mengoreksi data langsung di tabel ini.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleSelectAllUsers(true)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-slate-700 dark:text-slate-300"
                >
                  Pilih Semua ({users.length})
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectAllUsers(false)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-medium text-slate-500"
                >
                  Batal Pilih
                </button>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3 w-12 text-center">SK?</th>
                    <th className="p-3 w-10 text-center">NO</th>
                    <th className="p-3 min-w-[200px]">NAMA &amp; NIP (18 DIGIT)</th>
                    <th className="p-3 min-w-[150px]">PANGKAT / GOLONGAN</th>
                    <th className="p-3 min-w-[180px]">JABATAN KEDINASAN</th>
                    <th className="p-3 min-w-[140px]">PERAN JABATAN</th>
                    <th className="p-3 min-w-[180px]">JABATAN PERBENDAHARAAN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-400 italic">
                        Belum ada user terdaftar. Silakan tambahkan user pada tab "Formulir Pendaftaran".
                      </td>
                    </tr>
                  ) : (
                    users.map((user, idx) => {
                      const isChecked = draft.selectedUserIds.includes(user.id);
                      return (
                        <tr 
                          key={user.id} 
                          className={`transition-colors ${
                            isChecked ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/50 dark:bg-slate-950/30 opacity-60'
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleUserInclusion(user.id)}
                              className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
                            />
                          </td>

                          {/* Index */}
                          <td className="p-3 text-center font-mono text-slate-400">
                            {idx + 1}
                          </td>

                          {/* Nama & NIP */}
                          <td className="p-3">
                            <div className="font-bold text-slate-900 dark:text-white">
                              {user.namaLengkap}
                            </div>
                            <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                              NIP. {user.nip || '-'}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate max-w-xs mt-0.5">
                              Role SAKTI: {user.roles?.join(', ') || '-'}
                            </div>
                          </td>

                          {/* Pangkat / Golongan (Inline Edit) */}
                          <td className="p-3">
                            <input
                              type="text"
                              value={user.pangkatGolongan || ''}
                              placeholder="Penata / III/c"
                              onChange={e => handleQuickUpdateUser(user.id, { pangkatGolongan: e.target.value })}
                              className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
                            />
                          </td>

                          {/* Jabatan Kedinasan (Inline Edit) */}
                          <td className="p-3">
                            <input
                              type="text"
                              value={user.jabatan || ''}
                              placeholder="Pengelola Keuangan"
                              onChange={e => handleQuickUpdateUser(user.id, { jabatan: e.target.value })}
                              className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
                            />
                          </td>

                          {/* Peran Jabatan (Dropdown) */}
                          <td className="p-3">
                            <select
                              value={user.peranJabatan || 'Operator'}
                              onChange={e => handleQuickUpdateUser(user.id, { peranJabatan: e.target.value as PeranJabatanSakti })}
                              className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-teal-500"
                            >
                              {PERAN_JABATAN_OPTIONS.map(pj => (
                                <option key={pj} value={pj}>{pj}</option>
                              ))}
                            </select>
                          </td>

                          {/* Jabatan Perbendaharaan (Inline Edit / Select) */}
                          <td className="p-3">
                            <input
                              type="text"
                              value={user.jabatanPerbendaharaan || ''}
                              placeholder="Operator Anggaran"
                              onChange={e => handleQuickUpdateUser(user.id, { jabatanPerbendaharaan: e.target.value })}
                              className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 5: Opsi Dokumen Final & Reset */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="hideInstructionPage"
                checked={draft.hideInstructionPage}
                onChange={e => setDraft({ ...draft, hideInstructionPage: e.target.checked })}
                className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
              />
              <label htmlFor="hideInstructionPage" className="text-xs text-slate-700 dark:text-slate-300 select-none cursor-pointer">
                <strong>Sembunyikan Halaman Petunjuk Pengisian pada Dokumen Final</strong> (Default: Ya, untuk tanda tangan resmi)
              </label>
            </div>

            <button
              type="button"
              onClick={handleResetToDefault}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Format ke Template Awal
            </button>
          </div>

          {/* Section 6: Audit History Log */}
          {draft.exportHistory && draft.exportHistory.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                Riwayat Pembuatan &amp; Ekspor SK Satker
              </h4>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {draft.exportHistory.map(log => (
                  <div key={log.id} className="text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">[{log.action}]</span> {log.details}
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      {new Date(log.timestamp).toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: INFO TEMPLATE RESMI KEMENKEU                                   */}
      {/* ===================================================================== */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-500" />
                Informasi Master Template SK SAKTI
              </h3>
              <button
                type="button"
                onClick={() => setShowTemplateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-1 border border-slate-200 dark:border-slate-700">
                <div><strong>Nama Template:</strong> Format SK Penetapan User SAKTI - Satker.docx</div>
                <div><strong>Versi Master:</strong> {OFFICIAL_SK_TEMPLATE_VERSION}</div>
                <div><strong>Status:</strong> <span className="text-emerald-600 font-bold">ACTIVE (RESMI)</span></div>
                <div><strong>Acuan Utama:</strong> PMK 158/2023 &amp; Petunjuk Teknis Pelaksanaan SAKTI DJPb</div>
              </div>

              <div className="space-y-1.5">
                <p className="font-bold text-slate-900 dark:text-white">Struktur Dokumen Terstandarisasi:</p>
                <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
                  <li><strong>Page 1:</strong> Kop Surat Instansi, Nomor SK, Tentang, Menimbang (butir a, b), Mengingat (5 Dasar Hukum).</li>
                  <li><strong>Page 2:</strong> MEMUTUSKAN, Menetapkan, Diktum Pertama s/d Keempat, Tanda Tangan KPA.</li>
                  <li><strong>Page 3:</strong> Lampiran Daftar Pejabat, Operator &amp; Administrator Pengguna SAKTI (Tabel 5 Kolom), Tanda Tangan Lampiran.</li>
                  <li><strong>Page 4:</strong> Petunjuk Pengisian Resmi (Dapat disembunyikan untuk dokumen final).</li>
                </ul>
              </div>

              <p className="text-[11px] text-slate-400">
                Peringatan: Dokumen Word (.docx) yang dihasilkan berisi teks asli dan tabel yang dapat langsung diedit di Microsoft Word.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-right">
              <button
                type="button"
                onClick={() => setShowTemplateModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white dark:bg-white dark:text-slate-900"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
