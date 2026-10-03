import React, { useState, useEffect, useMemo } from 'react';
import { 
  ClipboardList, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Star, 
  Check, 
  Clock, 
  ShieldCheck, 
  ArrowRight, 
  Lock, 
  History, 
  User,
  QrCode,
  Share2,
  Award,
  Sparkles
} from 'lucide-react';
import { 
  KppnForm, 
  FormResponseRecord
} from '../../types/form';
import { AppUser, AppTheme, MasterSatker } from '../../types';
import { 
  subscribeToKppnForms, 
  subscribeToFormResponses, 
  saveFormResponse
} from '../../utils/formStorage';
import { FormQrShareModal } from './FormQrShareModal';

interface FormSurveyModuleProps {
  currentUser: AppUser | null;
  isAdminAuthenticated: boolean;
  theme?: AppTheme;
  masterSatkers?: MasterSatker[];
  onOpenLoginModal?: () => void;
  isDashboardActive?: boolean;
  onNavigateToAdmin?: () => void;
}

type SatkerTab = 'FILL_FORM' | 'MY_HISTORY';

export const FormSurveyModule: React.FC<FormSurveyModuleProps> = ({
  currentUser,
  isAdminAuthenticated,
  theme = 'light',
  masterSatkers = [],
  onOpenLoginModal,
  isDashboardActive = true,
  onNavigateToAdmin
}) => {
  const isDark = theme === 'dark';
  const isSuperAdmin = currentUser?.role === 'superadmin' || isAdminAuthenticated;

  // Active Tab: Satker only has Fill Form and My Submission History
  const [activeTab, setActiveTab] = useState<SatkerTab>('FILL_FORM');
  const [forms, setForms] = useState<KppnForm[]>([]);
  const [responses, setResponses] = useState<FormResponseRecord[]>([]);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Form Filler State
  const [activeFillingForm, setActiveFillingForm] = useState<KppnForm | null>(null);
  const [respName, setRespName] = useState<string>('');
  const [respSatker, setRespSatker] = useState<string>('');
  const [respSatkerKode, setRespSatkerKode] = useState<string>('');
  const [respEmail, setRespEmail] = useState<string>('');
  const [respNoHp, setRespNoHp] = useState<string>('');
  const [currentAnswers, setCurrentAnswers] = useState<Record<string, string | number>>({});
  const [submittedSuccess, setSubmittedSuccess] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [qrShareForm, setQrShareForm] = useState<KppnForm | null>(null);

  // Real-time subscriptions
  useEffect(() => {
    const unsubForms = subscribeToKppnForms(list => {
      setForms(list);
    });
    const unsubResp = subscribeToFormResponses(list => {
      setResponses(list);
    });
    return () => {
      unsubForms();
      unsubResp();
    };
  }, []);

  // Auto-open form from URL query parameter ?formId=...
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const targetFormId = params.get('formId');
    if (targetFormId && forms.length > 0 && !activeFillingForm) {
      const matched = forms.find(f => f.id === targetFormId);
      if (matched && matched.isActive) {
        handleOpenFillForm(matched);
      }
    }
  }, [forms, activeFillingForm]);

  // Pre-fill user satker & profile data
  useEffect(() => {
    if (currentUser) {
      if (!respName) setRespName(currentUser.displayName || currentUser.username);
      const matched = masterSatkers.find(m => 
        (currentUser.displayName && m.namaPic?.toLowerCase().includes(currentUser.displayName.toLowerCase())) ||
        (currentUser.username && m.kodeSatker === currentUser.username)
      );
      if (matched) {
        setRespSatkerKode(matched.kodeSatker);
        setRespSatker(matched.namaSatker);
      } else if (!respSatker) {
        setRespSatker(currentUser.seksi || 'Mitra Satker KPPN Semarang I');
      }
    }
  }, [currentUser, masterSatkers]);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  // Satker's Own Submissions
  const mySubmissions = useMemo(() => {
    if (!currentUser) return [];
    const userName = (currentUser.displayName || currentUser.username).toLowerCase();

    return responses.filter(r => {
      if (userName && r.respondentName.toLowerCase() === userName) return true;
      if (respSatkerKode && r.respondentSatkerKode === respSatkerKode) return true;
      return false;
    });
  }, [responses, currentUser, respSatkerKode]);

  // Check if Module is Deactivated by Admin
  if (!isSuperAdmin && isDashboardActive === false) {
    return (
      <div className="p-8 sm:p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm max-w-xl mx-auto my-12 space-y-5 animate-in fade-in duration-300">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 mx-auto shadow-sm">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            Akses Ditutup Sementara
          </span>
          <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">
            Modul Formulir &amp; Survei Sedang Dinonaktifkan
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
            Modul Formulir &amp; Survei Layanan saat ini sedang dinonaktifkan oleh Administrator KPPN Semarang I. Silakan hubungi petugas Seksi MSKI untuk informasi kuesioner resmi.
          </p>
        </div>
      </div>
    );
  }

  // Questionnaire Submission Handlers
  const handleOpenFillForm = (form: KppnForm) => {
    setActiveFillingForm(form);
    setCurrentAnswers({});
    setValidationErrors({});
    setSubmittedSuccess(false);
    setActiveTab('FILL_FORM');
  };

  const handleAnswerChange = (fieldId: string, value: string | number) => {
    setCurrentAnswers(prev => ({ ...prev, [fieldId]: value }));
    if (validationErrors[fieldId]) {
      setValidationErrors(prev => {
        const copy = { ...prev };
        delete copy[fieldId];
        return copy;
      });
    }
  };

  const handleSubmitFormResponse = async () => {
    if (!activeFillingForm) return;

    const errors: Record<string, string> = {};
    if (!respName.trim()) errors['respName'] = 'Nama lengkap wajib diisi.';
    if (!respSatker.trim()) errors['respSatker'] = 'Nama Satuan Kerja wajib diisi.';

    activeFillingForm.fields.forEach(f => {
      if (f.required) {
        const val = currentAnswers[f.id];
        if (val === undefined || val === null || val === '') {
          errors[f.id] = `Pertanyaan ini wajib dijawab.`;
        }
      }
    });

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      showToast('Mohon lengkapi seluruh isian wajib yang ditandai merah.', 'error');
      return;
    }

    const answersRecord = activeFillingForm.fields.map(f => ({
      fieldId: f.id,
      fieldLabel: f.label,
      fieldType: f.type,
      value: currentAnswers[f.id] ?? ''
    }));

    const newRecord: FormResponseRecord = {
      id: `resp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      formId: activeFillingForm.id,
      formTitle: activeFillingForm.title,
      respondentName: respName.trim(),
      respondentSatker: respSatker.trim(),
      respondentSatkerKode: respSatkerKode.trim() || undefined,
      respondentEmail: respEmail.trim() || undefined,
      respondentNoHp: respNoHp.trim() || undefined,
      submittedAt: new Date().toISOString(),
      answers: answersRecord
    };

    try {
      const updated = await saveFormResponse(newRecord);
      setResponses(updated);
      setSubmittedSuccess(true);
      showToast('Terima kasih! Respon survei Anda telah berhasil dikirimkan ke KPPN.', 'success');
    } catch (err: any) {
      showToast(`Gagal menyimpan respon: ${err.message || 'Error'}`, 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {feedbackMsg && (
        <div className={`p-4 rounded-2xl text-xs font-bold shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2 ${
          feedbackMsg.type === 'success'
            ? 'bg-emerald-600 text-white shadow-emerald-600/20'
            : 'bg-rose-600 text-white shadow-rose-600/20'
        }`}>
          {feedbackMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Admin Notice (Discrete banner for logged in Admin only) */}
      {isSuperAdmin && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 font-bold flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-amber-950 dark:text-amber-200">
                Mode Pratinjau Satker (Login Administrator)
              </span>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Halaman ini khusus untuk pengisian formulir dari sudut pandang Satker. Visualisasi grafik, persentase hasil, olah data, dan import Google Form hanya dapat diakses melalui Modul Admin.
              </p>
            </div>
          </div>
          {onNavigateToAdmin && (
            <button
              type="button"
              onClick={onNavigateToAdmin}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shrink-0 cursor-pointer shadow-xs flex items-center gap-1.5 transition-all"
            >
              <span>Lihat Grafik &amp; Olah Data di Modul Admin (Sub-tab 15)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Hero Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-sky-600 via-indigo-600 to-sky-700 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="relative z-10 space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[11px] font-black uppercase tracking-wider">
            <ClipboardList className="w-3.5 h-3.5 text-sky-200" />
            <span>KPPN E-Form &amp; Live Survey Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Formulir &amp; Survei Kepuasan Layanan Satker
          </h1>
          <p className="text-xs sm:text-sm text-sky-100/90 leading-relaxed">
            Pengumpulan data instan kuesioner evaluasi persepsi integritas, kepuasan pelayanan, serta registrasi kegiatan dinas KPPN Semarang I secara langsung dan terintegrasi.
          </p>
        </div>

        {/* Satker Clean Navigation Tabs (Only Form Filling & My Submission History) */}
        <div className="relative z-10 flex flex-wrap items-center gap-1.5 bg-black/25 p-1.5 rounded-2xl backdrop-blur-md self-stretch sm:self-auto">
          <button
            type="button"
            onClick={() => { setActiveTab('FILL_FORM'); setActiveFillingForm(null); }}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'FILL_FORM'
                ? 'bg-white text-slate-950 shadow-md'
                : 'text-sky-100 hover:text-white'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>1. Isi Formulir</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('MY_HISTORY')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'MY_HISTORY'
                ? 'bg-white text-slate-950 shadow-md'
                : 'text-sky-100 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>2. Riwayat Jawaban ({mySubmissions.length})</span>
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* VIEW 1: FILL FORM / DAFTAR FORMULIR TERSEDIA */}
      {/* ===================================================================== */}
      {activeTab === 'FILL_FORM' && (
        <div className="space-y-6">
          {!activeFillingForm ? (
            /* List of available active forms to fill */
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-sky-500" />
                    <span>Pilih Formulir / Survei yang Sedang Dibuka</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Silakan klik pada salah satu formulir di bawah ini untuk mengisi kuesioner dinas KPPN Semarang I.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {forms.map(form => {
                  return (
                    <div
                      key={form.id}
                      className={`p-6 rounded-3xl border-2 flex flex-col justify-between transition-all shadow-md ${
                        form.isActive
                          ? isDark ? 'bg-slate-900 border-slate-800 text-slate-100 hover:border-sky-500/50' : 'bg-white border-slate-200 text-slate-900 hover:border-sky-400 hover:shadow-xl'
                          : 'border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 opacity-70'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30">
                            {form.category === 'SURVEI_LAYANAN' ? 'Survei Kepuasan' : form.category === 'PENDAFTARAN_BIMTEK' ? 'Registrasi Bimtek' : 'Formulir Dinas'}
                          </span>

                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                            form.isActive
                              ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-500 border-slate-400'
                          }`}>
                            {form.isActive ? '● Sedang Dibuka' : '○ Ditutup'}
                          </span>
                        </div>

                        <h3 className="font-black text-base leading-snug">
                          {form.title}
                        </h3>

                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">
                          {form.description}
                        </p>

                        <div className="py-2 px-3 rounded-2xl bg-slate-100/70 dark:bg-slate-800/60 text-center text-xs">
                          <span className="text-[10px] text-slate-500 block">Total Pertanyaan</span>
                          <span className="font-black text-slate-900 dark:text-white">{form.fields.length} Butir Soal</span>
                        </div>
                      </div>

                      <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => setQrShareForm(form)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                          title="Bagikan QR Code / Link ke Teman Satker"
                        >
                          <QrCode className="w-3.5 h-3.5 text-sky-500" />
                          <span className="hidden sm:inline">QR / Tautan</span>
                        </button>

                        <button
                          type="button"
                          disabled={!form.isActive}
                          onClick={() => handleOpenFillForm(form)}
                          className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            form.isActive
                              ? 'bg-sky-600 hover:bg-sky-500 text-white hover:scale-105 active:scale-95'
                              : 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{form.isActive ? 'Isi Formulir Ini' : 'Formulir Ditutup'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Active Form Questionnaire Interface */
            <div className={`p-6 sm:p-8 rounded-3xl border shadow-2xl space-y-6 ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            }`}>
              {/* Back button & Form Hero */}
              <div className="pb-5 border-b border-slate-200 dark:border-slate-800 space-y-3">
                <button
                  type="button"
                  onClick={() => setActiveFillingForm(null)}
                  className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                  <span>Kembali ke Daftar Formulir</span>
                </button>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-sky-500/15 text-sky-700 dark:text-sky-300">
                      {activeFillingForm.category}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600">● Dibuka</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black mt-1">
                    {activeFillingForm.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {activeFillingForm.description}
                  </p>
                </div>
              </div>

              {submittedSuccess ? (
                /* Celebration State upon successful submission */
                <div className="py-12 px-6 text-center space-y-5 max-w-lg mx-auto animate-in zoom-in-95 duration-300">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-black">Respon Berhasil Terkirim!</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Terima kasih atas partisipasi dan kontribusi Anda. Data telah tersimpan secara *real-time* ke database KPPN Semarang I.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveFillingForm(null);
                        setActiveTab('MY_HISTORY');
                      }}
                      className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      <History className="w-3.5 h-3.5" />
                      <span>Lihat Riwayat Jawaban Saya</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveFillingForm(null)}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
                    >
                      Kembali ke Daftar Formulir
                    </button>
                  </div>
                </div>
              ) : (
                /* Form Fields */
                <div className="space-y-6">
                  {/* Respondent Profile Information */}
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-2">
                      <User className="w-4 h-4 text-sky-500" />
                      <span>Identitas Responden Satker</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold mb-1">
                          Nama Lengkap Responden <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={respName}
                          onChange={e => setRespName(e.target.value)}
                          placeholder="Nama lengkap pejabat / operator..."
                          className={`w-full px-3.5 py-2 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-sky-500 ${
                            validationErrors['respName'] ? 'border-rose-500 bg-rose-50/50' : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900'
                          }`}
                        />
                        {validationErrors['respName'] && (
                          <span className="text-[10px] text-rose-500 font-bold mt-1 block">
                            {validationErrors['respName']}
                          </span>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-bold mb-1">
                          Satuan Kerja / Instansi <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={respSatker}
                          onChange={e => setRespSatker(e.target.value)}
                          placeholder="Nama Satker atau Seksi..."
                          className={`w-full px-3.5 py-2 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-sky-500 ${
                            validationErrors['respSatker'] ? 'border-rose-500 bg-rose-50/50' : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900'
                          }`}
                        />
                        {validationErrors['respSatker'] && (
                          <span className="text-[10px] text-rose-500 font-bold mt-1 block">
                            {validationErrors['respSatker']}
                          </span>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-bold mb-1">
                          Email (Opsional)
                        </label>
                        <input
                          type="email"
                          value={respEmail}
                          onChange={e => setRespEmail(e.target.value)}
                          placeholder="email@kemenkeu.go.id..."
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium focus:ring-2 focus:ring-sky-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold mb-1">
                          No. WhatsApp / HP (Opsional)
                        </label>
                        <input
                          type="text"
                          value={respNoHp}
                          onChange={e => setRespNoHp(e.target.value)}
                          placeholder="081234567890..."
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium focus:ring-2 focus:ring-sky-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Questionnaire Questions List */}
                  <div className="space-y-5">
                    {activeFillingForm.fields.map((field, idx) => {
                      const val = currentAnswers[field.id];
                      const error = validationErrors[field.id];

                      return (
                        <div
                          key={field.id}
                          className={`p-5 rounded-2xl border transition-all ${
                            error 
                              ? 'border-rose-500 bg-rose-50/30' 
                              : isDark ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50/70 border-slate-200'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="space-y-1">
                              <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-start gap-2">
                                <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-600 dark:text-sky-400 font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                                  {idx + 1}
                                </span>
                                <span>{field.label}</span>
                                {field.required && <span className="text-rose-500 font-bold">*</span>}
                              </h4>
                              {field.description && (
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 pl-7">
                                  {field.description}
                                </p>
                              )}
                            </div>

                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 shrink-0 font-mono">
                              {field.type}
                            </span>
                          </div>

                          {/* Question Input Types */}
                          <div className="pl-7">
                            {/* Rating Stars (1 s/d 5) */}
                            {field.type === 'RATING' && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  {[1, 2, 3, 4, 5].map(ratingValue => {
                                    const isSelected = Number(val) >= ratingValue;
                                    return (
                                      <button
                                        key={ratingValue}
                                        type="button"
                                        onClick={() => handleAnswerChange(field.id, ratingValue)}
                                        className={`p-2 sm:p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                                          Number(val) === ratingValue
                                            ? 'bg-amber-500 text-white border-amber-600 shadow-md scale-105'
                                            : isSelected
                                              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 border-amber-400'
                                              : 'bg-white dark:bg-slate-900 text-slate-300 border-slate-200 dark:border-slate-700 hover:text-amber-400'
                                        }`}
                                      >
                                        <Star className={`w-4 h-4 sm:w-5 sm:h-5 ${isSelected ? 'fill-current' : ''}`} />
                                        <span className="text-xs font-black">{ratingValue}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                                <div className="flex items-center justify-between text-[10px] text-slate-400 max-w-xs">
                                  <span>1 = Sangat Kurang</span>
                                  <span>5 = Sangat Memuaskan</span>
                                </div>
                              </div>
                            )}

                            {/* Multiple Choice Radio */}
                            {field.type === 'MULTIPLE_CHOICE' && (
                              <div className="space-y-2">
                                {(field.options || []).map(opt => {
                                  const isSelected = val === opt.label;
                                  return (
                                    <label
                                      key={opt.id}
                                      onClick={() => handleAnswerChange(field.id, opt.label)}
                                      className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                                        isSelected
                                          ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-400 text-sky-900 dark:text-sky-200 shadow-xs'
                                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                                      }`}
                                    >
                                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                        isSelected ? 'border-sky-600 bg-sky-600 text-white' : 'border-slate-300'
                                      }`}>
                                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                      </div>
                                      <span>{opt.label}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            )}

                            {/* Yes / No Buttons */}
                            {field.type === 'YES_NO' && (
                              <div className="flex items-center gap-3">
                                {['Ya', 'Tidak'].map(opt => {
                                  const isSelected = val === opt;
                                  return (
                                    <button
                                      key={opt}
                                      type="button"
                                      onClick={() => handleAnswerChange(field.id, opt)}
                                      className={`px-5 py-2.5 rounded-xl text-xs font-black border transition-all cursor-pointer flex items-center gap-2 ${
                                        isSelected
                                          ? opt === 'Ya'
                                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-md'
                                            : 'bg-rose-600 text-white border-rose-700 shadow-md'
                                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                                      }`}
                                    >
                                      <Check className={`w-3.5 h-3.5 ${isSelected ? 'inline' : 'hidden'}`} />
                                      <span>{opt}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}

                            {/* Short Text */}
                            {field.type === 'SHORT_TEXT' && (
                              <input
                                type="text"
                                value={String(val || '')}
                                onChange={e => handleAnswerChange(field.id, e.target.value)}
                                placeholder="Ketikkan jawaban Anda di sini..."
                                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium focus:ring-2 focus:ring-sky-500"
                              />
                            )}

                            {/* Paragraph / Suggestions */}
                            {field.type === 'PARAGRAPH' && (
                              <textarea
                                rows={3}
                                value={String(val || '')}
                                onChange={e => handleAnswerChange(field.id, e.target.value)}
                                placeholder="Ketikkan tanggapan, ulasan, atau saran Anda..."
                                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium focus:ring-2 focus:ring-sky-500 leading-relaxed"
                              />
                            )}

                            {error && (
                              <span className="text-[10px] text-rose-500 font-bold mt-1.5 block">
                                {error}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveFillingForm(null)}
                      className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold cursor-pointer"
                    >
                      Batal
                    </button>

                    <button
                      type="button"
                      onClick={handleSubmitFormResponse}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg flex items-center gap-2 cursor-pointer hover:scale-102 active:scale-98 transition-all"
                    >
                      <Send className="w-4 h-4" />
                      <span>Kirim Jawaban Survei</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* VIEW 2: RIWAYAT JAWABAN SAYA */}
      {/* ===================================================================== */}
      {activeTab === 'MY_HISTORY' && (
        <div className="space-y-5">
          <div className={`p-6 rounded-3xl border shadow-sm ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-black flex items-center gap-2">
                <History className="w-5 h-5 text-sky-500" />
                <span>Riwayat Pengisian Formulir Satker</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Daftar kuesioner dan formulir yang telah berhasil dikirimkan oleh akun Satker Anda ke KPPN Semarang I.
              </p>
            </div>

            {mySubmissions.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <Clock className="w-12 h-12 text-slate-300 mx-auto" />
                <h4 className="text-sm font-black">Belum Ada Riwayat Jawaban</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Anda belum pernah mengisi formulir survei yang tersedia.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('FILL_FORM')}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs cursor-pointer"
                >
                  Pilih Formulir Sekarang
                </button>
              </div>
            ) : (
              <div className="space-y-4 mt-6">
                {mySubmissions.map((sub, sIdx) => (
                  <div
                    key={sub.id}
                    className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-sky-500 text-white font-mono text-xs flex items-center justify-center font-black">
                          #{sIdx + 1}
                        </span>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white">
                          {sub.formTitle}
                        </h4>
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {new Date(sub.submittedAt).toLocaleDateString('id-ID', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })} WIB
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {sub.answers.map((ans, ai) => (
                        <div key={ai} className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                          <span className="text-[10px] text-slate-400 block truncate" title={ans.fieldLabel}>
                            {ans.fieldLabel}
                          </span>
                          <span className="font-black text-sky-600 dark:text-sky-400 mt-0.5 block">
                            {String(ans.value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* QR Code & Sharing Modal for Satker */}
      {qrShareForm && (
        <FormQrShareModal
          isOpen={Boolean(qrShareForm)}
          onClose={() => setQrShareForm(null)}
          form={qrShareForm}
        />
      )}
    </div>
  );
};
