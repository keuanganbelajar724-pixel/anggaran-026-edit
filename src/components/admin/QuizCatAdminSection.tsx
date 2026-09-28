import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  HelpCircle, 
  Plus, 
  Trash2, 
  Edit3, 
  FileSpreadsheet, 
  Download, 
  Upload, 
  Check, 
  X, 
  AlertCircle, 
  Clock, 
  Award, 
  ShieldAlert, 
  ShieldCheck, 
  Eye, 
  Search, 
  Save, 
  Building2, 
  Lock, 
  Unlock, 
  Sparkles, 
  Users, 
  CheckCircle2, 
  BookOpen, 
  ArrowLeft,
  ChevronRight
} from 'lucide-react';
import { QuizPackage, QuizQuestion, QuizResultRecord, QuizAudience } from '../../types/quiz';
import { AppUser, AppTheme } from '../../types';
import { 
  getQuizPackages, 
  saveQuizPackage, 
  deleteQuizPackage, 
  getQuizResults, 
  generateQuizExcelTemplate, 
  parseQuizQuestionsFromExcel,
  exportQuizResultsToExcel 
} from '../../utils/quizStorage';

interface QuizCatAdminSectionProps {
  currentUser: AppUser | null;
  theme?: AppTheme;
}

type AdminSubView = 'PACKAGES_LIST' | 'PACKAGE_FORM' | 'MANAGE_QUESTIONS' | 'RESULTS_LEADERBOARD';

export const QuizCatAdminSection: React.FC<QuizCatAdminSectionProps> = ({
  currentUser,
  theme = 'light'
}) => {
  const isDark = theme === 'dark';

  // STRICT ACCESS CONTROL: ONLY SUPER ADMIN CAN OPEN THIS TAB
  const isSuperAdmin = currentUser?.role === 'superadmin';

  if (!isSuperAdmin) {
    return (
      <div className="bg-white dark:bg-slate-900 p-8 sm:p-12 rounded-3xl border border-rose-200 dark:border-rose-900 shadow-xl text-center space-y-4 max-w-xl mx-auto my-12 animate-in fade-in">
        <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto border border-rose-200 dark:border-rose-800">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-black text-slate-900 dark:text-white">
          Akses Khusus Super Admin
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Modul manajemen dan konfigurasi paket soal kuis CAT hanya dapat diakses oleh Super Admin. Pegawai KPPN tidak memiliki wewenang untuk membuka, menambah, atau mengedit materi kuis ini.
        </p>
      </div>
    );
  }

  // State
  const [subView, setSubView] = useState<AdminSubView>('PACKAGES_LIST');
  const [packages, setPackages] = useState<QuizPackage[]>([]);
  const [results, setResults] = useState<QuizResultRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Active package for editing or managing questions
  const [editingPackage, setEditingPackage] = useState<QuizPackage | null>(null);

  // Package Form State
  const [pkgTitle, setPkgTitle] = useState<string>('');
  const [pkgDesc, setPkgDesc] = useState<string>('');
  const [pkgCategory, setPkgCategory] = useState<string>('IKPA & SAKTI');
  const [pkgAudience, setPkgAudience] = useState<QuizAudience>('satker');
  const [pkgDuration, setPkgDuration] = useState<number>(15);
  const [pkgPassingGrade, setPkgPassingGrade] = useState<number>(70);
  const [pkgIsActive, setPkgIsActive] = useState<boolean>(true);

  // Manual Question Form State
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState<boolean>(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [qText, setQText] = useState<string>('');
  const [qOptionA, setQOptionA] = useState<string>('');
  const [qOptionB, setQOptionB] = useState<string>('');
  const [qOptionC, setQOptionC] = useState<string>('');
  const [qOptionD, setQOptionD] = useState<string>('');
  const [qCorrect, setQCorrect] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [qExplanation, setQExplanation] = useState<string>('');

  // Excel Upload State
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploadingExcel, setIsUploadingExcel] = useState<boolean>(false);
  const [excelPreviewQuestions, setExcelPreviewQuestions] = useState<QuizQuestion[] | null>(null);
  const [excelErrors, setExcelErrors] = useState<string[]>([]);

  // Load data
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = () => {
    setPackages(getQuizPackages());
    setResults(getQuizResults());
  };

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  // Open Create Package Form
  const handleOpenCreatePackage = () => {
    setEditingPackage(null);
    setPkgTitle('');
    setPkgDesc('');
    setPkgCategory('IKPA & SAKTI');
    setPkgAudience('satker');
    setPkgDuration(15);
    setPkgPassingGrade(70);
    setPkgIsActive(true);
    setSubView('PACKAGE_FORM');
  };

  // Open Edit Package Form
  const handleOpenEditPackage = (pkg: QuizPackage) => {
    setEditingPackage(pkg);
    setPkgTitle(pkg.title);
    setPkgDesc(pkg.description);
    setPkgCategory(pkg.category);
    setPkgAudience(pkg.targetAudience);
    setPkgDuration(pkg.durationMinutes);
    setPkgPassingGrade(pkg.passingGrade);
    setPkgIsActive(pkg.isActive);
    setSubView('PACKAGE_FORM');
  };

  // Save Package Form
  const handleSavePackageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkgTitle.trim()) {
      showToast('Judul paket materi tidak boleh kosong.', 'error');
      return;
    }

    const newPkg: QuizPackage = {
      id: editingPackage ? editingPackage.id : `quiz_${Date.now()}`,
      title: pkgTitle.trim(),
      description: pkgDesc.trim(),
      category: pkgCategory.trim() || 'Umum',
      targetAudience: pkgAudience,
      durationMinutes: Number(pkgDuration) || 15,
      passingGrade: Number(pkgPassingGrade) || 70,
      isActive: pkgIsActive,
      questions: editingPackage ? editingPackage.questions : [],
      createdAt: editingPackage ? editingPackage.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updated = saveQuizPackage(newPkg);
    setPackages(updated);
    showToast(editingPackage ? 'Paket soal berhasil diperbarui!' : 'Paket soal baru berhasil dibuat!');
    setSubView('PACKAGES_LIST');
  };

  // Delete Package
  const handleDeletePackage = (pkgId: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus paket materi kuis ini beserta seluruh soalnya?')) return;
    const updated = deleteQuizPackage(pkgId);
    setPackages(updated);
    showToast('Paket soal berhasil dihapus.');
  };

  // Toggle Active status
  const handleTogglePackageActive = (pkg: QuizPackage) => {
    const updatedPkg = { ...pkg, isActive: !pkg.isActive };
    const updated = saveQuizPackage(updatedPkg);
    setPackages(updated);
    showToast(`Paket "${pkg.title}" status sekarang: ${updatedPkg.isActive ? 'Aktif' : 'Nonaktif'}`);
  };

  // Open Manage Questions view
  const handleOpenManageQuestions = (pkg: QuizPackage) => {
    setEditingPackage(pkg);
    setExcelPreviewQuestions(null);
    setExcelErrors([]);
    setSubView('MANAGE_QUESTIONS');
  };

  // Open Question Modal
  const handleOpenAddQuestion = () => {
    setEditingQuestionId(null);
    setQText('');
    setQOptionA('');
    setQOptionB('');
    setQOptionC('');
    setQOptionD('');
    setQCorrect('A');
    setQExplanation('');
    setIsQuestionModalOpen(true);
  };

  const handleOpenEditQuestion = (q: QuizQuestion) => {
    setEditingQuestionId(q.id);
    setQText(q.questionText);
    setQOptionA(q.optionA);
    setQOptionB(q.optionB);
    setQOptionC(q.optionC);
    setQOptionD(q.optionD);
    setQCorrect(q.correctAnswer);
    setQExplanation(q.explanation || '');
    setIsQuestionModalOpen(true);
  };

  // Save Question (Manual)
  const handleSaveQuestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPackage) return;

    if (!qText.trim() || !qOptionA.trim() || !qOptionB.trim() || !qOptionC.trim() || !qOptionD.trim()) {
      showToast('Pertanyaan dan semua pilihan (A, B, C, D) wajib diisi.', 'error');
      return;
    }

    const currentQuestions = editingPackage.questions || [];
    let updatedQuestions: QuizQuestion[];

    if (editingQuestionId) {
      // Edit existing
      updatedQuestions = currentQuestions.map(item => {
        if (item.id === editingQuestionId) {
          return {
            ...item,
            questionText: qText.trim(),
            optionA: qOptionA.trim(),
            optionB: qOptionB.trim(),
            optionC: qOptionC.trim(),
            optionD: qOptionD.trim(),
            correctAnswer: qCorrect,
            explanation: qExplanation.trim() || undefined
          };
        }
        return item;
      });
    } else {
      // Add new
      const newQuestion: QuizQuestion = {
        id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        number: currentQuestions.length + 1,
        questionText: qText.trim(),
        optionA: qOptionA.trim(),
        optionB: qOptionB.trim(),
        optionC: qOptionC.trim(),
        optionD: qOptionD.trim(),
        correctAnswer: qCorrect,
        explanation: qExplanation.trim() || undefined,
        points: 10
      };
      updatedQuestions = [...currentQuestions, newQuestion];
    }

    // Re-index numbers
    updatedQuestions = updatedQuestions.map((q, idx) => ({ ...q, number: idx + 1 }));

    const updatedPkg = { ...editingPackage, questions: updatedQuestions };
    const allUpdated = saveQuizPackage(updatedPkg);
    setPackages(allUpdated);
    setEditingPackage(updatedPkg);
    setIsQuestionModalOpen(false);
    showToast('Soal berhasil disimpan!');
  };

  // Delete Single Question
  const handleDeleteQuestion = (questionId: string) => {
    if (!editingPackage) return;
    if (!window.confirm('Hapus butir soal ini?')) return;

    const remaining = (editingPackage.questions || []).filter(q => q.id !== questionId);
    const reindexed = remaining.map((q, idx) => ({ ...q, number: idx + 1 }));

    const updatedPkg = { ...editingPackage, questions: reindexed };
    const allUpdated = saveQuizPackage(updatedPkg);
    setPackages(allUpdated);
    setEditingPackage(updatedPkg);
    showToast('Butir soal berhasil dihapus.');
  };

  // Handle Excel Upload
  const handleExcelFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingPackage) return;

    setIsUploadingExcel(true);
    setExcelErrors([]);

    const res = await parseQuizQuestionsFromExcel(file);
    setIsUploadingExcel(false);

    if (!res.success) {
      setExcelErrors(res.errors);
      showToast('Gagal memproses file Excel.', 'error');
      return;
    }

    setExcelPreviewQuestions(res.questions);
    setExcelErrors(res.errors);
    showToast(`Berhasil membaca ${res.questions.length} butir soal dari Excel.`);
  };

  // Confirm and Append Excel Questions to Package
  const handleConfirmImportExcel = (mode: 'APPEND' | 'REPLACE') => {
    if (!editingPackage || !excelPreviewQuestions) return;

    let finalQuestions: QuizQuestion[];
    if (mode === 'REPLACE') {
      finalQuestions = excelPreviewQuestions.map((q, idx) => ({ ...q, number: idx + 1 }));
    } else {
      const existing = editingPackage.questions || [];
      finalQuestions = [...existing, ...excelPreviewQuestions].map((q, idx) => ({ ...q, number: idx + 1 }));
    }

    const updatedPkg = { ...editingPackage, questions: finalQuestions };
    const allUpdated = saveQuizPackage(updatedPkg);
    setPackages(allUpdated);
    setEditingPackage(updatedPkg);
    setExcelPreviewQuestions(null);
    setExcelErrors([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    showToast(`Berhasil mengimpor soal ke dalam paket "${editingPackage.title}"!`);
  };

  // Filtered results
  const filteredResults = useMemo(() => {
    return results.filter(r => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          r.participantName.toLowerCase().includes(q) ||
          r.satkerOrUnit.toLowerCase().includes(q) ||
          r.packageTitle.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [results, searchQuery]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {feedbackMsg && (
        <div className={`p-4 rounded-2xl text-xs font-bold shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2 ${
          feedbackMsg.type === 'success'
            ? 'bg-emerald-600 text-white shadow-emerald-600/20'
            : 'bg-rose-600 text-white shadow-rose-600/20'
        }`}>
          {feedbackMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Admin Module Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-[10px] font-black uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-200" />
            <span>Khusus Super Admin • KPPN Semarang I</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black">
            Manajemen Paket &amp; Soal Kuis CAT
          </h2>
          <p className="text-xs text-amber-100/90 mt-1 max-w-2xl">
            Input paket materi, kelola bank soal pilihan ganda (ABCD) secara manual atau via upload Excel (.xlsx), dan monitor rekap hasil ujian peserta.
          </p>
        </div>

        {/* Sub navigation pills */}
        <div className="flex items-center gap-1.5 bg-black/20 p-1.5 rounded-2xl backdrop-blur-md">
          <button
            type="button"
            onClick={() => { setSubView('PACKAGES_LIST'); setEditingPackage(null); }}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              subView === 'PACKAGES_LIST' || subView === 'PACKAGE_FORM' || subView === 'MANAGE_QUESTIONS'
                ? 'bg-white text-slate-950 shadow-md'
                : 'text-amber-100 hover:text-white'
            }`}
          >
            📚 Paket Soal ({packages.length})
          </button>
          <button
            type="button"
            onClick={() => setSubView('RESULTS_LEADERBOARD')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              subView === 'RESULTS_LEADERBOARD'
                ? 'bg-white text-slate-950 shadow-md'
                : 'text-amber-100 hover:text-white'
            }`}
          >
            🏆 Rekap Hasil ({results.length})
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 1. LIST OF QUIZ PACKAGES */}
      {/* ===================================================================== */}
      {subView === 'PACKAGES_LIST' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari paket ujian..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => generateQuizExcelTemplate('Master_Template')}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-slate-300 dark:border-slate-700"
                title="Unduh master template Excel kosong untuk format pengisian soal CAT"
              >
                <Download className="w-3.5 h-3.5 text-emerald-500" />
                <span>Unduh Format Excel</span>
              </button>

              <button
                type="button"
                onClick={handleOpenCreatePackage}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer hover:scale-105 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Buat Paket Soal Baru</span>
              </button>
            </div>
          </div>

          {/* Table / Cards of Packages */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {packages
              .filter(p => !searchQuery.trim() || p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.category.toLowerCase().includes(searchQuery.toLowerCase()))
              .map(pkg => {
                const isInternal = pkg.targetAudience === 'kppn_internal';

                return (
                  <div
                    key={pkg.id}
                    className={`rounded-3xl border-2 p-5 flex flex-col justify-between transition-all shadow-md ${
                      isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
                    }`}
                  >
                    <div>
                      {/* Top tags */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {pkg.category}
                        </span>

                        {isInternal ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                            <Lock className="w-3 h-3 text-indigo-500" />
                            <span>Khusus KPPN Internal</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                            <Building2 className="w-3 h-3 text-emerald-500" />
                            <span>Mitra Satker</span>
                          </span>
                        )}
                      </div>

                      <h3 className="font-black text-base leading-snug mb-1">
                        {pkg.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">
                        {pkg.description || 'Tidak ada deskripsi tambahan.'}
                      </p>

                      <div className="grid grid-cols-3 gap-2 py-2 px-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/60 text-center text-xs mb-4">
                        <div>
                          <span className="text-[10px] text-slate-500 block">Total Soal</span>
                          <span className="font-black">{pkg.questions?.length || 0}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Waktu</span>
                          <span className="font-black">{pkg.durationMinutes}m</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Passing</span>
                          <span className="font-black text-emerald-600">{pkg.passingGrade}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleTogglePackageActive(pkg)}
                          className={`text-[10px] font-black px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                            pkg.isActive
                              ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                          }`}
                        >
                          {pkg.isActive ? '● Aktif' : '○ Nonaktif'}
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenManageQuestions(pkg)}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1 transition-all shadow-xs cursor-pointer"
                          title="Kelola butir soal dan kunci jawaban"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Kelola Soal</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEditPackage(pkg)}
                          className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
                          title="Edit info paket"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeletePackage(pkg.id)}
                          className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 transition-all cursor-pointer"
                          title="Hapus paket"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2. FORM CREATE / EDIT PACKAGE */}
      {/* ===================================================================== */}
      {subView === 'PACKAGE_FORM' && (
        <div className={`p-6 sm:p-8 rounded-3xl border shadow-xl max-w-3xl mx-auto ${
          isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSubView('PACKAGES_LIST')}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h3 className="font-black text-base sm:text-lg">
                {editingPackage ? 'Edit Paket Materi Ujian' : 'Buat Paket Materi Ujian Baru'}
              </h3>
            </div>
          </div>

          <form onSubmit={handleSavePackageSubmit} className="space-y-4 text-xs font-semibold">
            <div>
              <label className="block font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Judul Paket Ujian CAT <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={pkgTitle}
                onChange={e => setPkgTitle(e.target.value)}
                placeholder="misal: Simulasi CAT IKPA & Regulasi SAKTI 2026"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-sm font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Deskripsi Singkat / Keterangan
              </label>
              <textarea
                rows={3}
                value={pkgDesc}
                onChange={e => setPkgDesc(e.target.value)}
                placeholder="Jelaskan cakupan materi atau tujuan evaluasi kuis ini..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Kategori Materi
                </label>
                <input
                  type="text"
                  value={pkgCategory}
                  onChange={e => setPkgCategory(e.target.value)}
                  placeholder="misal: IKPA 2026, SAKTI, Kepatuhan Internal"
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Target Audiens &amp; Hak Akses
                </label>
                <select
                  value={pkgAudience}
                  onChange={e => setPkgAudience(e.target.value as QuizAudience)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-hidden cursor-pointer"
                >
                  <option value="satker">📋 Mitra Satker &amp; Umum (Dapat diakses Satker)</option>
                  <option value="kppn_internal">🔒 Khusus Internal Pegawai KPPN (Satker TIDAK BISA buka)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Durasi Pengerjaan (Menit)
                </label>
                <input
                  type="number"
                  min={1}
                  max={180}
                  value={pkgDuration}
                  onChange={e => setPkgDuration(Number(e.target.value))}
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs font-bold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Passing Grade Standar (%)
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={pkgPassingGrade}
                  onChange={e => setPkgPassingGrade(Number(e.target.value))}
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs font-bold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Status Publikasi
                </label>
                <select
                  value={pkgIsActive ? '1' : '0'}
                  onChange={e => setPkgIsActive(e.target.value === '1')}
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-hidden cursor-pointer"
                >
                  <option value="1">Aktif (Dapat Dikerjakan)</option>
                  <option value="0">Draft / Nonaktif</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSubView('PACKAGES_LIST')}
                className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-md cursor-pointer hover:scale-105 active:scale-95 transition-all"
              >
                Simpan Paket
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 3. MANAGE QUESTIONS IN PACKAGE (MANUAL & EXCEL IMPORT) */}
      {/* ===================================================================== */}
      {subView === 'MANAGE_QUESTIONS' && editingPackage && (
        <div className="space-y-6">
          {/* Header Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSubView('PACKAGES_LIST')}
                className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Paket: {editingPackage.title}</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 font-bold">
                    {editingPackage.questions?.length || 0} Soal
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Target: {editingPackage.targetAudience === 'kppn_internal' ? '🔒 Khusus KPPN Internal' : '📋 Mitra Satker'} • Durasi: {editingPackage.durationMinutes} menit
                </p>
              </div>
            </div>

            {/* Quick Actions: Add Manual, Download Template, Import Excel */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => generateQuizExcelTemplate(editingPackage.title)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-all border border-slate-300 dark:border-slate-700 cursor-pointer"
                title="Unduh master template Excel kosong untuk format pengisian soal paket ini"
              >
                <Download className="w-3.5 h-3.5 text-emerald-500" />
                <span>Unduh Format Excel</span>
              </button>

              <label className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>{isUploadingExcel ? 'Membaca...' : 'Upload File Excel'}</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleExcelFileChange}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={handleOpenAddQuestion}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer hover:scale-105 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Soal Manual</span>
              </button>
            </div>
          </div>

          {/* Excel Preview Modal / Alert if file parsed */}
          {excelPreviewQuestions && excelPreviewQuestions.length > 0 && (
            <div className="p-5 rounded-3xl border-2 border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xl space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  <h4 className="font-black text-sm text-emerald-900 dark:text-emerald-200">
                    Pratinjau Hasil Pembacaan Excel ({excelPreviewQuestions.length} Soal Berhasil Dikenali)
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setExcelPreviewQuestions(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {excelErrors.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs space-y-1">
                  <span className="font-bold block">Peringatan:</span>
                  {excelErrors.slice(0, 3).map((err, i) => (
                    <p key={i}>• {err}</p>
                  ))}
                </div>
              )}

              {/* Sample 3 rows preview */}
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {excelPreviewQuestions.slice(0, 5).map((q, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-white dark:bg-slate-900 border text-xs">
                    <span className="font-black text-slate-400 mr-2">No. {idx + 1}</span>
                    <strong className="text-slate-800 dark:text-slate-200">{q.questionText}</strong>
                    <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-500">
                      <span>Kunci: <strong className="text-emerald-600 font-black">{q.correctAnswer}</strong></span>
                      <span>A: {q.optionA.substring(0, 20)}...</span>
                      <span>B: {q.optionB.substring(0, 20)}...</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-emerald-500/30">
                <button
                  type="button"
                  onClick={() => setExcelPreviewQuestions(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-emerald-100/50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmImportExcel('APPEND')}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md cursor-pointer"
                >
                  Tambahkan ke Soal yang Ada (+{excelPreviewQuestions.length})
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmImportExcel('REPLACE')}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md cursor-pointer"
                >
                  Gantikan Seluruh Soal Lama
                </button>
              </div>
            </div>
          )}

          {/* List of Questions in Package */}
          <div className="space-y-3">
            {(editingPackage.questions || []).map((q, idx) => (
              <div
                key={q.id}
                className={`p-5 rounded-3xl border transition-all ${
                  isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black text-xs">
                        {idx + 1}
                      </span>
                      <h4 className="font-bold text-sm sm:text-base leading-snug">
                        {q.questionText}
                      </h4>
                    </div>

                    {/* Options Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-xs">
                      {[
                        { key: 'A', text: q.optionA },
                        { key: 'B', text: q.optionB },
                        { key: 'C', text: q.optionC },
                        { key: 'D', text: q.optionD }
                      ].map(opt => {
                        const isCorrect = q.correctAnswer === opt.key;
                        return (
                          <div
                            key={opt.key}
                            className={`p-2 rounded-xl border flex items-center justify-between gap-2 ${
                              isCorrect
                                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-800 dark:text-emerald-300 font-bold'
                                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            <span><strong>{opt.key}.</strong> {opt.text}</span>
                            {isCorrect && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-600 text-white font-black">
                                KUNCI
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    {q.explanation && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 bg-slate-100/60 dark:bg-slate-800/40 p-2.5 rounded-xl">
                        💡 <strong>Pembahasan:</strong> {q.explanation}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEditQuestion(q)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
                      title="Edit soal"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 transition-all cursor-pointer"
                      title="Hapus soal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {(editingPackage.questions || []).length === 0 && (
              <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                <HelpCircle className="w-12 h-12 mx-auto text-slate-400 mb-3 opacity-60" />
                <h4 className="font-bold">Paket Ini Belum Memiliki Soal</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Klik tombol <strong>"Tambah Soal Manual"</strong> untuk membuat soal satu per satu, atau klik <strong>"Upload File Excel"</strong> untuk mengimpor dari file .xlsx.
                </p>
              </div>
            )}
          </div>

          {/* Modal Input Soal Manual */}
          {isQuestionModalOpen && (
            <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in overflow-y-auto">
              <div className={`w-full max-w-2xl rounded-3xl p-6 sm:p-7 border-2 shadow-2xl space-y-4 my-8 ${
                isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
              }`}>
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                  <h3 className="font-black text-base">
                    {editingQuestionId ? 'Edit Butir Soal' : 'Tambah Butir Soal Pilihan Ganda (ABCD)'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsQuestionModalOpen(false)}
                    className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveQuestionSubmit} className="space-y-4 text-xs font-semibold">
                  <div>
                    <label className="block font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                      Pertanyaan / Teks Soal <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={qText}
                      onChange={e => setQText(e.target.value)}
                      placeholder="Tuliskan teks pertanyaan soal di sini..."
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                        Pilihan A <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={qOptionA}
                        onChange={e => setQOptionA(e.target.value)}
                        placeholder="Teks opsi A..."
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                        Pilihan B <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={qOptionB}
                        onChange={e => setQOptionB(e.target.value)}
                        placeholder="Teks opsi B..."
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                        Pilihan C <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={qOptionC}
                        onChange={e => setQOptionC(e.target.value)}
                        placeholder="Teks opsi C..."
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                        Pilihan D <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={qOptionD}
                        onChange={e => setQOptionD(e.target.value)}
                        placeholder="Teks opsi D..."
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                      Kunci Jawaban yang Benar <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {(['A', 'B', 'C', 'D'] as const).map(k => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => setQCorrect(k)}
                          className={`py-2 rounded-xl font-black text-xs transition-all cursor-pointer border ${
                            qCorrect === k
                              ? 'bg-emerald-600 text-white border-emerald-700 shadow-md ring-2 ring-emerald-400/40'
                              : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                          }`}
                        >
                          Pilihan {k}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                      Pembahasan &amp; Penjelasan Edukatif (Muncul saat ujian selesai)
                    </label>
                    <textarea
                      rows={2}
                      value={qExplanation}
                      onChange={e => setQExplanation(e.target.value)}
                      placeholder="Jelaskan alasan kunci jawaban benar sesuai regulasi perbendaharaan/SAKTI..."
                      className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsQuestionModalOpen(false)}
                      className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-md cursor-pointer hover:scale-105 active:scale-95 transition-all"
                    >
                      Simpan Butir Soal
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* 4. RESULTS & LEADERBOARD REKAP */}
      {/* ===================================================================== */}
      {subView === 'RESULTS_LEADERBOARD' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari peserta / satker..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>

            <button
              type="button"
              disabled={results.length === 0}
              onClick={() => exportQuizResultsToExcel(filteredResults)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor Hasil ke Excel ({filteredResults.length})</span>
            </button>
          </div>

          <div className={`rounded-3xl border overflow-hidden shadow-lg ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 font-black">
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4">Nama Peserta</th>
                    <th className="py-3 px-4">Satker / Unit</th>
                    <th className="py-3 px-4">Paket Ujian</th>
                    <th className="py-3 px-4 text-center">Benar / Salah</th>
                    <th className="py-3 px-4 text-center">Skor Akhir</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4">Waktu Ujian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredResults.map((r, idx) => (
                    <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 text-center font-mono text-slate-400 font-bold">{idx + 1}</td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {r.participantName}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {r.satkerOrUnit}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-xs truncate" title={r.packageTitle}>
                        {r.packageTitle}
                      </td>
                      <td className="py-3 px-4 text-center font-mono">
                        <span className="text-emerald-600 font-bold">{r.correctCount}</span> / <span className="text-rose-500 font-bold">{r.wrongCount}</span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-black text-sm text-amber-500">
                        {r.score}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          r.passed
                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/40'
                        }`}>
                          {r.passed ? 'LULUS' : 'GAGAL'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[11px] text-slate-400">
                        {new Date(r.completedAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                    </tr>
                  ))}

                  {filteredResults.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        Belum ada riwayat hasil simulasi kuis CAT yang tercatat.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
