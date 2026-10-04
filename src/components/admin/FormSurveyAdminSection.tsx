import React, { useState, useEffect, useMemo } from 'react';
import { 
  ClipboardList, 
  BarChart3, 
  FileSpreadsheet, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  AlertCircle, 
  Star, 
  Check, 
  X, 
  Download, 
  Search, 
  Building2, 
  Clock, 
  Sparkles, 
  ShieldCheck, 
  FileUp, 
  FileText, 
  Upload, 
  RotateCcw,
  MessageSquare,
  ThumbsUp,
  PieChart,
  Lock,
  Link2,
  RefreshCw,
  Printer,
  QrCode,
  Tablet,
  ExternalLink,
  Award,
  TrendingUp,
  Share2,
  BookOpen
} from 'lucide-react';
import { 
  KppnForm, 
  FormResponseRecord, 
  FormField, 
  FormFieldType, 
  FormCategory,
  FormAnalyticsSummary
} from '../../types/form';
import { AppUser, AppTheme, MasterSatker } from '../../types';
import { 
  getKppnForms, 
  subscribeToKppnForms, 
  saveKppnForm, 
  deleteKppnForm, 
  getFormResponses, 
  subscribeToFormResponses, 
  deleteFormResponse, 
  clearFormResponses, 
  computeFormAnalytics, 
  exportFormResponsesToExcel,
  importGoogleFormData,
  resetToOfficialDefaultFormsAndResponses,
  syncFormFromGoogleSheetUrl
} from '../../utils/formStorage';
import { 
  parseGoogleFormFile, 
  parseGoogleFormPastedText,
  fetchGoogleSheetCsvData,
  OFFICIAL_GOVERNMENT_TEMPLATES
} from '../../utils/googleFormParser';
import { FormOfficialReportModal } from '../forms/FormOfficialReportModal';
import { FormQrShareModal } from '../forms/FormQrShareModal';
import { FormKioskModal } from '../forms/FormKioskModal';
import { QuestionBankHub } from '../forms/QuestionBankHub';
import { QuestionBankSelectorModal } from '../forms/QuestionBankSelectorModal';

interface FormSurveyAdminSectionProps {
  currentUser?: AppUser | null;
  theme?: AppTheme;
  masterSatkers?: MasterSatker[];
  isDashboardActive?: boolean;
  onToggleDashboardActive?: (active: boolean) => void;
}

type AdminSubTab = 'CHARTS' | 'RESPONSES' | 'IMPORT_GFORM' | 'QUESTION_BANK' | 'MANAGE_FORMS';

export const FormSurveyAdminSection: React.FC<FormSurveyAdminSectionProps> = ({
  currentUser,
  theme = 'light',
  masterSatkers = [],
  isDashboardActive = true,
  onToggleDashboardActive
}) => {
  const isDark = theme === 'dark';

  // SubTab State
  const [subTab, setSubTab] = useState<AdminSubTab>('CHARTS');
  const [forms, setForms] = useState<KppnForm[]>([]);
  const [responses, setResponses] = useState<FormResponseRecord[]>([]);
  const [selectedFormId, setSelectedFormId] = useState<string>('');
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Response Filter
  const [searchRespondent, setSearchRespondent] = useState<string>('');

  // Chart View Modes per question ('BAR' | 'DONUT' | 'TABLE')
  const [chartViewModes, setChartViewModes] = useState<Record<string, 'BAR' | 'DONUT' | 'TABLE'>>({});

  // Google Form Import States
  const [gformImportMode, setGformImportMode] = useState<'URL' | 'FILE' | 'PASTE' | 'TEMPLATES'>('URL');
  const [gformSpreadsheetUrl, setGformSpreadsheetUrl] = useState<string>('');
  const [pastedSpreadsheetData, setPastedSpreadsheetData] = useState<string>('');
  const [gformCustomTitle, setGformCustomTitle] = useState<string>('');
  const [isImportLoading, setIsImportLoading] = useState<boolean>(false);
  const [isSyncingLiveUrl, setIsSyncingLiveUrl] = useState<boolean>(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('tpl_skm_permenpan');
  const [importPreview, setImportPreview] = useState<{
    form: KppnForm;
    responses: FormResponseRecord[];
    summary: { totalRows: number; detectedQuestionsCount: number; detectedSatkersCount: number; filename?: string };
  } | null>(null);

  // Modal States
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isQrShareModalOpen, setIsQrShareModalOpen] = useState<boolean>(false);
  const [isKioskModalOpen, setIsKioskModalOpen] = useState<boolean>(false);
  const [isQuestionBankSelectorOpen, setIsQuestionBankSelectorOpen] = useState<boolean>(false);

  // Form Builder State
  const [isBuilderModalOpen, setIsBuilderModalOpen] = useState<boolean>(false);
  const [editingFormId, setEditingFormId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState<string>('');
  const [formDesc, setFormDesc] = useState<string>('');
  const [formCat, setFormCat] = useState<FormCategory>('SURVEI_LAYANAN');
  const [formAudience, setFormAudience] = useState<'ALL' | 'satker' | 'kppn_internal'>('satker');
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [formPublicStats, setFormPublicStats] = useState<boolean>(true);
  const [formGoogleSheetUrl, setFormGoogleSheetUrl] = useState<string>('');
  const [formSkmPeriod, setFormSkmPeriod] = useState<string>('');
  const [formFields, setFormFields] = useState<FormField[]>([]);

  // Delete Confirm Modal
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    isOpen: boolean;
    mode: 'SINGLE_RESPONSE' | 'ALL_RESPONSES' | 'FORM';
    targetId?: string;
    targetTitle?: string;
  } | null>(null);

  // Real-time Subscriptions
  useEffect(() => {
    const unsubForms = subscribeToKppnForms(list => {
      setForms(list);
      if (list.length > 0 && !selectedFormId) {
        setSelectedFormId(list[0].id);
      }
    });
    const unsubResp = subscribeToFormResponses(list => {
      setResponses(list);
    });
    return () => {
      unsubForms();
      unsubResp();
    };
  }, [selectedFormId]);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const currentSelectedForm = useMemo(() => {
    return forms.find(f => f.id === selectedFormId) || forms[0] || null;
  }, [forms, selectedFormId]);

  const analyticsSummary: FormAnalyticsSummary | null = useMemo(() => {
    if (!currentSelectedForm) return null;
    return computeFormAnalytics(currentSelectedForm, responses);
  }, [currentSelectedForm, responses]);

  const filteredResponses = useMemo(() => {
    if (!currentSelectedForm) return [];
    let list = responses.filter(r => r.formId === currentSelectedForm.id);
    if (searchRespondent.trim()) {
      const q = searchRespondent.toLowerCase();
      list = list.filter(r => 
        r.respondentName.toLowerCase().includes(q) || 
        r.respondentSatker.toLowerCase().includes(q)
      );
    }
    return list;
  }, [responses, currentSelectedForm, searchRespondent]);

  // Google Form Import Handlers
  const handleFetchGoogleSheetUrl = async () => {
    if (!gformSpreadsheetUrl.trim()) {
      showToast('Masukkan link/tautan Google Sheets atau Form terlebih dahulu.', 'error');
      return;
    }
    setIsImportLoading(true);
    try {
      const csvText = await fetchGoogleSheetCsvData(gformSpreadsheetUrl.trim());
      const result = parseGoogleFormPastedText(csvText, gformCustomTitle.trim() || undefined);
      result.form.googleSheetUrl = gformSpreadsheetUrl.trim();
      result.form.lastSyncedAt = new Date().toISOString();
      setImportPreview(result);
      setGformCustomTitle(result.form.title);
      showToast(`Berhasil membaca data dari Google Sheets! Ditemukan ${result.summary.totalRows} baris respon dan ${result.summary.detectedQuestionsCount} pertanyaan.`, 'success');
    } catch (err: any) {
      showToast(`Gagal menarik spreadsheet: ${err.message || 'Error'}`, 'error');
    } finally {
      setIsImportLoading(false);
    }
  };

  const handleSyncCurrentFormLive = async () => {
    if (!currentSelectedForm || !currentSelectedForm.googleSheetUrl) return;
    setIsSyncingLiveUrl(true);
    try {
      const res = await syncFormFromGoogleSheetUrl(currentSelectedForm);
      showToast(`Sinkronisasi berhasil! Ditambahkan ${res.addedResponsesCount} respon baru dari Google Sheets (Total: ${res.totalResponses} respon).`, 'success');
    } catch (err: any) {
      showToast(`Gagal sinkronisasi: ${err.message || 'Error'}`, 'error');
    } finally {
      setIsSyncingLiveUrl(false);
    }
  };

  const handleDeployOfficialTemplate = async (templateId: string) => {
    const tpl = OFFICIAL_GOVERNMENT_TEMPLATES.find(t => t.id === templateId);
    if (!tpl) return;

    const newForm: KppnForm = {
      id: `form_official_${Date.now()}`,
      title: tpl.name,
      description: tpl.description,
      category: tpl.category,
      targetAudience: 'satker',
      isActive: true,
      isPublicStatsVisible: true,
      allowMultipleSubmissions: false,
      isOfficialSkm: tpl.isOfficialSkm,
      skmPeriod: 'Triwulan I 2026',
      fields: tpl.fields,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const sampleSatkersList = masterSatkers.slice(0, 18);
    const demoResponses: FormResponseRecord[] = sampleSatkersList.map((stk, idx) => ({
      id: `resp_tpl_${newForm.id}_${idx + 1}`,
      formId: newForm.id,
      formTitle: newForm.title,
      respondentName: stk.namaPic || `Pejabat Perbendaharaan ${stk.kodeSatker}`,
      respondentSatker: stk.namaSatker,
      respondentSatkerKode: stk.kodeSatker,
      respondentEmail: stk.emailSatker || `${stk.kodeSatker}@kemenkeu.go.id`,
      respondentNoHp: stk.noHpPic || '081234567890',
      submittedAt: new Date(Date.now() - (idx * 3600000 * 3)).toISOString(),
      answers: newForm.fields.map(f => {
        let val: any = 5;
        if (f.type === 'RATING') {
          val = (idx % 5 === 0) ? 4 : 5;
        } else if (f.type === 'YES_NO') {
          val = f.id.includes('1') ? 'Tidak' : 'Ya';
        } else if (f.type === 'MULTIPLE_CHOICE') {
          val = f.options?.[0]?.label || 'Sangat Cukup';
        } else {
          val = `Pelayanan perbendaharaan dan koordinasi dengan KPPN Semarang I sangat memuaskan bagi satker ${stk.namaSatker}.`;
        }
        return {
          fieldId: f.id,
          fieldLabel: f.label,
          fieldType: f.type,
          value: val
        };
      })
    }));

    await importGoogleFormData(newForm, demoResponses);
    setSelectedFormId(newForm.id);
    setSubTab('CHARTS');
    showToast(`Template resmi "${newForm.title}" berhasil diterapkan dan siap digunakan!`, 'success');
  };

  const handleChangePreviewFieldType = (fieldId: string, newType: FormFieldType) => {
    if (!importPreview) return;
    setImportPreview({
      ...importPreview,
      form: {
        ...importPreview.form,
        fields: importPreview.form.fields.map(f => {
          if (f.id === fieldId) {
            return {
              ...f,
              type: newType,
              minRating: newType === 'RATING' ? 1 : undefined,
              maxRating: newType === 'RATING' ? 5 : undefined
            };
          }
          return f;
        })
      }
    });
  };

  const handleRemovePreviewField = (fieldId: string) => {
    if (!importPreview) return;
    setImportPreview({
      ...importPreview,
      form: {
        ...importPreview.form,
        fields: importPreview.form.fields.filter(f => f.id !== fieldId)
      }
    });
  };

  const handleFileUploadGoogleForm = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImportLoading(true);
    try {
      const result = await parseGoogleFormFile(file);
      setImportPreview(result);
      setGformCustomTitle(result.form.title);
      showToast(`Berhasil membaca file "${file.name}"! Ditemukan ${result.summary.totalRows} respon dan ${result.summary.detectedQuestionsCount} pertanyaan.`, 'success');
    } catch (err: any) {
      showToast(`Gagal membaca file: ${err.message || 'Format tidak didukung'}`, 'error');
    } finally {
      setIsImportLoading(false);
      e.target.value = '';
    }
  };

  const handleParsePastedSpreadsheet = () => {
    if (!pastedSpreadsheetData.trim()) {
      showToast('Tempelkan data respon tabel Google Form terlebih dahulu.', 'error');
      return;
    }
    setIsImportLoading(true);
    try {
      const result = parseGoogleFormPastedText(pastedSpreadsheetData, gformCustomTitle.trim() || undefined);
      setImportPreview(result);
      showToast(`Berhasil mem-parsing teks! Ditemukan ${result.summary.totalRows} respon dan ${result.summary.detectedQuestionsCount} pertanyaan.`, 'success');
    } catch (err: any) {
      showToast(`Gagal mem-parsing: ${err.message || 'Format tidak sesuai'}`, 'error');
    } finally {
      setIsImportLoading(false);
    }
  };

  const handleSaveImportedGoogleForm = async () => {
    if (!importPreview) return;
    const finalForm = {
      ...importPreview.form,
      title: gformCustomTitle.trim() || importPreview.form.title
    };
    await importGoogleFormData(finalForm, importPreview.responses);
    setSelectedFormId(finalForm.id);
    setImportPreview(null);
    setPastedSpreadsheetData('');
    setSubTab('CHARTS');
    showToast(`Formulir "${finalForm.title}" berhasil diimpor! Grafik otomatis langsung tersusun.`, 'success');
  };

  const handleLoadSampleGoogleFormData = async () => {
    const sampleForm: KppnForm = {
      id: `form_gform_sample_${Date.now()}`,
      title: 'Survei Kepuasan Mitra Kerja & Layanan Digital KPPN 2026',
      description: 'Hasil respon langsung dari formulir kuesioner Google Form KPPN Semarang I dengan partisipasi perwakilan Satker mitra kerja.',
      category: 'SURVEI_LAYANAN',
      targetAudience: 'satker',
      isActive: true,
      isPublicStatsVisible: true,
      allowMultipleSubmissions: true,
      fields: [
        {
          id: 'q_speed',
          type: 'RATING',
          label: 'Kecepatan Proses Penerbitan SP2D dan Respon Helpdesk KPPN',
          description: 'Skala 1 (Sangat Lambat) s.d 5 (Sangat Cepat)',
          required: true,
          minRating: 1,
          maxRating: 5
        },
        {
          id: 'q_satisfaction',
          type: 'RATING',
          label: 'Kepuasan Terhadap Keramahan & Kejelasan Edukasi Petugas CSO',
          description: 'Skala 1 (Kurang) s.d 5 (Sangat Memuaskan)',
          required: true,
          minRating: 1,
          maxRating: 5
        },
        {
          id: 'q_favorite_channel',
          type: 'MULTIPLE_CHOICE',
          label: 'Kanal Layanan Konsultasi yang Paling Efektif Membantu Satker',
          required: true,
          options: [
            { id: 'o1', label: 'WhatsApp Helpdesk / Broadcast Masif' },
            { id: 'o2', label: 'Tatap Muka di CSO KPPN' },
            { id: 'o3', label: 'Bimtek Online & Zoom Class' },
            { id: 'o4', label: 'Aplikasi Web ANGKASA Mandiri' }
          ]
        },
        {
          id: 'q_integrity',
          type: 'YES_NO',
          label: 'Apakah seluruh layanan perbendaharaan diberikan tanpa pungutan biaya / gratifikasi?',
          required: true
        },
        {
          id: 'q_suggestions',
          type: 'PARAGRAPH',
          label: 'Masukan & Saran Peningkatan Pelayanan KPPN',
          required: false
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const sampleSatkersList = masterSatkers.slice(0, 15);
    const demoResponses: FormResponseRecord[] = sampleSatkersList.map((stk, idx) => ({
      id: `resp_gform_demo_${idx + 1}`,
      formId: sampleForm.id,
      formTitle: sampleForm.title,
      respondentName: stk.namaPic || `Pejabat Perbendaharaan ${stk.kodeSatker}`,
      respondentSatker: stk.namaSatker,
      respondentSatkerKode: stk.kodeSatker,
      respondentEmail: stk.emailSatker || `${stk.kodeSatker}@kemenkeu.go.id`,
      respondentNoHp: stk.noHpPic || '081234567890',
      submittedAt: new Date(Date.now() - (idx * 3600000 * 4)).toISOString(),
      answers: [
        { fieldId: 'q_speed', fieldLabel: sampleForm.fields[0].label, fieldType: 'RATING', value: (idx % 4 === 0) ? 4 : 5 },
        { fieldId: 'q_satisfaction', fieldLabel: sampleForm.fields[1].label, fieldType: 'RATING', value: 5 },
        { fieldId: 'q_favorite_channel', fieldLabel: sampleForm.fields[2].label, fieldType: 'MULTIPLE_CHOICE', value: (idx % 2 === 0) ? 'WhatsApp Helpdesk / Broadcast Masif' : 'Aplikasi Web ANGKASA Mandiri' },
        { fieldId: 'q_integrity', fieldLabel: sampleForm.fields[3].label, fieldType: 'YES_NO', value: 'Ya' },
        { fieldId: 'q_suggestions', fieldLabel: sampleForm.fields[4].label, fieldType: 'PARAGRAPH', value: `Pelayanan KPPN Semarang I sangat memuaskan bagi satker ${stk.namaSatker}. Sistem ANGKASA sangat informatif.` }
      ]
    }));

    await importGoogleFormData(sampleForm, demoResponses);
    setSelectedFormId(sampleForm.id);
    setSubTab('CHARTS');
    showToast(`Contoh data Google Form (${demoResponses.length} respon) berhasil dimuat! Grafik langsung tersusun.`, 'success');
  };

  // Form Builder Handlers
  const handleOpenCreateForm = () => {
    setEditingFormId(null);
    setFormTitle('');
    setFormDesc('');
    setFormCat('SURVEI_LAYANAN');
    setFormAudience('satker');
    setFormIsActive(true);
    setFormPublicStats(true);
    setFormGoogleSheetUrl('');
    setFormSkmPeriod('Triwulan I 2026');
    setFormFields([
      {
        id: `f_${Date.now()}_1`,
        type: 'RATING',
        label: 'Tingkat Kepuasan Terhadap Kecepatan Pelayanan Petugas KPPN',
        required: true,
        minRating: 1,
        maxRating: 5,
        minRatingLabel: 'Kurang',
        maxRatingLabel: 'Sangat Memuaskan'
      },
      {
        id: `f_${Date.now()}_2`,
        type: 'MULTIPLE_CHOICE',
        label: 'Kanal Konsultasi yang Paling Sering Digunakan Satker',
        required: true,
        options: [
          { id: 'opt_1', label: 'WhatsApp Helpdesk KPPN' },
          { id: 'opt_2', label: 'Tatap Muka di CSO KPPN' },
          { id: 'opt_3', label: 'Zoom Bimtek Online' }
        ]
      },
      {
        id: `f_${Date.now()}_3`,
        type: 'PARAGRAPH',
        label: 'Kritik, Saran & Usulan Peningkatan Layanan KPPN',
        required: false,
        placeholder: 'Tuliskan masukan Anda...'
      }
    ]);
    setIsBuilderModalOpen(true);
  };

  const handleOpenEditForm = (form: KppnForm) => {
    setEditingFormId(form.id);
    setFormTitle(form.title);
    setFormDesc(form.description);
    setFormCat(form.category);
    setFormAudience(form.targetAudience);
    setFormIsActive(form.isActive);
    setFormPublicStats(form.isPublicStatsVisible);
    setFormGoogleSheetUrl(form.googleSheetUrl || '');
    setFormSkmPeriod(form.skmPeriod || '');
    setFormFields(form.fields);
    setIsBuilderModalOpen(true);
  };

  const handleAddFieldToBuilder = (type: FormFieldType) => {
    const newField: FormField = {
      id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      type,
      label: type === 'RATING' ? 'Tingkat Kepuasan Layanan' : type === 'YES_NO' ? 'Apakah terdapat kendala?' : 'Pertanyaan baru...',
      required: true,
      options: (type === 'MULTIPLE_CHOICE' || type === 'DROPDOWN')
        ? [
            { id: 'opt_1', label: 'Sangat Puas' },
            { id: 'opt_2', label: 'Puas' },
            { id: 'opt_3', label: 'Cukup' }
          ]
        : undefined,
      minRating: type === 'RATING' ? 1 : undefined,
      maxRating: type === 'RATING' ? 5 : undefined,
      minRatingLabel: type === 'RATING' ? 'Kurang' : undefined,
      maxRatingLabel: type === 'RATING' ? 'Sangat Baik' : undefined
    };
    setFormFields(prev => [...prev, newField]);
  };

  const handleRemoveFieldFromBuilder = (fieldId: string) => {
    setFormFields(prev => prev.filter(f => f.id !== fieldId));
  };

  const handleInsertFieldsFromQuestionBank = (fields: FormField[]) => {
    setFormFields(prev => [...prev, ...fields]);
    showToast(`${fields.length} butir soal berhasil disisipkan dari Bank Soal!`, 'success');
  };

  const handleSaveFormBuilder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      showToast('Judul formulir tidak boleh kosong.', 'error');
      return;
    }
    if (formFields.length === 0) {
      showToast('Formulir harus memiliki minimal 1 pertanyaan.', 'error');
      return;
    }

    const newForm: KppnForm = {
      id: editingFormId ? editingFormId : `form_${Date.now()}`,
      title: formTitle.trim(),
      description: formDesc.trim(),
      category: formCat,
      targetAudience: formAudience,
      isActive: formIsActive,
      isPublicStatsVisible: formPublicStats,
      allowMultipleSubmissions: formCat === 'PENDAFTARAN_BIMTEK',
      googleSheetUrl: formGoogleSheetUrl.trim() || undefined,
      skmPeriod: formSkmPeriod.trim() || undefined,
      fields: formFields,
      createdAt: editingFormId ? (forms.find(f => f.id === editingFormId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updated = await saveKppnForm(newForm);
    setForms(updated);
    setSelectedFormId(newForm.id);
    setIsBuilderModalOpen(false);
    showToast(editingFormId ? 'Formulir berhasil diperbarui!' : 'Formulir baru berhasil diterbitkan!', 'success');
  };

  const handleToggleFormActive = async (form: KppnForm) => {
    const updatedForm = { ...form, isActive: !form.isActive };
    const updated = await saveKppnForm(updatedForm);
    setForms(updated);
    showToast(`Formulir "${form.title}" sekarang ${updatedForm.isActive ? '🟢 Dibuka' : '🔴 Ditutup'}`);
  };

  const confirmExecuteDeletion = async () => {
    if (!deleteConfirmModal) return;
    const { mode, targetId, targetTitle } = deleteConfirmModal;

    try {
      if (mode === 'SINGLE_RESPONSE' && targetId) {
        const updated = await deleteFormResponse(targetId);
        setResponses(updated);
        showToast('Respon berhasil dihapus.', 'success');
      } else if (mode === 'ALL_RESPONSES' && targetId) {
        const updated = await clearFormResponses(targetId);
        setResponses(updated);
        showToast(`Seluruh respon formulir "${targetTitle || ''}" berhasil dibersihkan!`, 'success');
      } else if (mode === 'FORM' && targetId) {
        const updated = await deleteKppnForm(targetId);
        setForms(updated);
        if (selectedFormId === targetId && updated.length > 0) {
          setSelectedFormId(updated[0].id);
        }
        showToast('Formulir dan seluruh responnya berhasil dihapus.', 'success');
      }
    } catch (err: any) {
      showToast(`Gagal menghapus: ${err?.message || 'Error'}`, 'error');
    } finally {
      setDeleteConfirmModal(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
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

      {/* Header Admin Tab 22 */}
      <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-sky-700 via-indigo-800 to-slate-900 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative overflow-hidden">
        <div className="space-y-2 max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-white text-[11px] font-black uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
            <span>Modul Admin #22 • Google Form &amp; Survey Engine</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Manajemen Formulir, Kuesioner &amp; Google Form
          </h2>
          <p className="text-xs sm:text-sm text-sky-100/90 leading-relaxed">
            Pusat kendali admin untuk membaca file ekspor Google Form, merancang kuesioner dinamis, mengolah data respon Satker, menyusun grafik persentase otomatis, serta mengoptimalkan memori penyimpanan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 relative z-10 self-stretch sm:self-auto justify-end">
          <button
            type="button"
            onClick={handleOpenCreateForm}
            className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-black text-xs shadow-md flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Buat Formulir Baru</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (confirm('Kembalikan seluruh formulir & respon ke data bawaan resmi KPPN?')) {
                resetToOfficialDefaultFormsAndResponses();
                showToast('Data berhasil direset ke formulir resmi KPPN!', 'success');
              }
            }}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-all"
            title="Reset ke Formulir Bawaan Resmi KPPN"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Executive Status Banner & Satker Access Control (Persists to Cloud/Database) */}
      <div className={`p-4 sm:p-5 rounded-3xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm transition-all ${
        isDashboardActive
          ? isDark 
            ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-100' 
            : 'bg-emerald-50/90 border-emerald-300 text-emerald-950 shadow-emerald-500/5'
          : isDark 
            ? 'bg-rose-950/40 border-rose-800/60 text-rose-100' 
            : 'bg-rose-50/90 border-rose-300 text-rose-950 shadow-rose-500/5'
      }`}>
        <div className="flex items-center gap-3.5 min-w-0">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 shadow-xs ${
            isDashboardActive 
              ? 'bg-emerald-600 text-white shadow-emerald-600/30' 
              : 'bg-rose-600 text-white shadow-rose-600/30'
          }`}>
            {isDashboardActive ? <CheckCircle2 className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-black tracking-tight">
                Status Menu di Dashboard Satker:
              </span>
              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-2xs ${
                isDashboardActive 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-rose-600 text-white'
              }`}>
                {isDashboardActive ? '🟢 AKTIF (TAMPIL DI SATKER)' : '🔴 NONAKTIF (DISEMBUNYIKAN)'}
              </span>
            </div>
            <p className={`text-xs mt-0.5 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              {isDashboardActive
                ? 'Menu "Formulir & Survei" saat ini aktif dan dapat dibuka oleh Satker untuk mengisi kuesioner dinas. Seluruh visualisasi grafik persentase evaluasi dan olah data terpusat aman di Modul Admin ini.'
                : 'Menu "Formulir & Survei" sedang dinonaktifkan dari Satker. Satker tidak dapat melihat tab ini dan seluruh data aman hanya diolah oleh Administrator KPPN.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch md:self-auto shrink-0 justify-end">
          {onToggleDashboardActive && (
            <button
              type="button"
              onClick={() => {
                const nextState = !isDashboardActive;
                onToggleDashboardActive(nextState);
                showToast(
                  `Menu Formulir & Survei ${nextState ? '🟢 Diaktifkan' : '🔴 Dinonaktifkan'} untuk Satker & tersinkron ke Database!`,
                  nextState ? 'success' : 'error'
                );
              }}
              className={`w-full md:w-auto px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm hover:scale-[1.02] active:scale-98 ${
                isDashboardActive
                  ? 'bg-rose-600 hover:bg-rose-700 text-white border border-rose-700'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-700'
              }`}
            >
              {isDashboardActive ? (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Kunci / Nonaktifkan Menu</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Buka / Aktifkan ke Satker</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setSubTab('CHARTS')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
            subTab === 'CHARTS'
              ? 'bg-sky-600 text-white shadow-md'
              : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>1. Grafik &amp; Analitik Otomatis</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('RESPONSES')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
            subTab === 'RESPONSES'
              ? 'bg-sky-600 text-white shadow-md'
              : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>2. Olah Data Respon ({responses.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('IMPORT_GFORM')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
            subTab === 'IMPORT_GFORM'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-800 hover:bg-emerald-100'
          }`}
        >
          <FileUp className="w-4 h-4 text-emerald-500" />
          <span>3. Baca / Import Google Form</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('QUESTION_BANK')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
            subTab === 'QUESTION_BANK'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 border border-indigo-300/60 dark:border-indigo-800 hover:bg-indigo-100'
          }`}
        >
          <BookOpen className="w-4 h-4 text-indigo-500" />
          <span>4. 📚 Bank Soal &amp; Referensi Pintar</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('MANAGE_FORMS')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
            subTab === 'MANAGE_FORMS'
              ? 'bg-sky-600 text-white shadow-md'
              : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>5. Kelola Form ({forms.length})</span>
        </button>
      </div>

      {/* ===================================================================== */}
      {/* SUB-TAB 1: GRAFIK & ANALITIK OTOMATIS */}
      {/* ===================================================================== */}
      {subTab === 'CHARTS' && (
        <div className="space-y-6">
          <div className={`p-5 rounded-3xl border shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex-1 max-w-md">
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                Pilih Formulir / Kuesioner untuk Melihat Grafik:
              </label>
              <select
                value={selectedFormId}
                onChange={e => setSelectedFormId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 cursor-pointer"
              >
                {forms.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.title} ({responses.filter(r => r.formId === f.id).length} respon)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-2 justify-end">
              {currentSelectedForm?.googleSheetUrl && (
                <button
                  type="button"
                  disabled={isSyncingLiveUrl}
                  onClick={handleSyncCurrentFormLive}
                  className="px-3.5 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                  title={`Tersinkron ke: ${currentSelectedForm.googleSheetUrl}`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingLiveUrl ? 'animate-spin' : ''}`} />
                  <span>{isSyncingLiveUrl ? 'Menyinkronkan...' : 'Sinkronkan Live Sheets'}</span>
                </button>
              )}

              {currentSelectedForm && (
                <>
                  <button
                    type="button"
                    onClick={() => setIsReportModalOpen(true)}
                    className="px-3.5 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all hover:scale-105 active:scale-95"
                    title="Cetak Laporan Resmi Format Dinas KPPN / Permenpan RB"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Laporan Resmi (BAP)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsQrShareModalOpen(true)}
                    className="px-3.5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all hover:scale-105 active:scale-95"
                    title="Buat QR Code Meja CSO & Link WhatsApp Satker"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>QR Meja &amp; Tautan</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsKioskModalOpen(true)}
                    className="px-3.5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all hover:scale-105 active:scale-95"
                    title="Buka Layar Penuh Tablet Kiosk untuk Front Office KPPN"
                  >
                    <Tablet className="w-3.5 h-3.5" />
                    <span>Mode Kiosk Tablet</span>
                  </button>

                  <button
                    type="button"
                    disabled={!analyticsSummary || analyticsSummary.totalResponses === 0}
                    onClick={() => exportFormResponsesToExcel(currentSelectedForm, responses)}
                    className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Ekspor Excel</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Linked Google Sheet Status Badge */}
          {currentSelectedForm?.googleSheetUrl && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                <Link2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span className="font-bold">
                  Terhubung ke Google Sheets Live:{' '}
                  <span className="font-mono underline truncate max-w-xs inline-block align-bottom">{currentSelectedForm.googleSheetUrl}</span>
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">
                Terakhir Sinkron: {currentSelectedForm.lastSyncedAt ? new Date(currentSelectedForm.lastSyncedAt).toLocaleString('id-ID') : 'Belum pernah'}
              </span>
            </div>
          )}

          {analyticsSummary && (
            <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-500 block">Total Respon Masuk</span>
                    <span className="text-3xl font-black text-slate-900 dark:text-white font-mono mt-1 block">
                      {analyticsSummary.totalResponses}
                    </span>
                    <span className="text-[10px] text-slate-400">Responden terverifikasi</span>
                  </div>
                  <div className="p-3 bg-sky-500/20 text-sky-600 dark:text-sky-400 rounded-2xl">
                    <ClipboardList className="w-6 h-6" />
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-500 block">Satker Terlibat</span>
                    <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1 block">
                      {analyticsSummary.uniqueSatkersCount}
                    </span>
                    <span className="text-[10px] text-slate-400">Satker unik berpartisipasi</span>
                  </div>
                  <div className="p-3 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                    <Building2 className="w-6 h-6" />
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-500 block">Status Formulir</span>
                    <span className="text-lg font-black text-sky-600 dark:text-sky-400 mt-1 block">
                      {currentSelectedForm?.isActive ? '🟢 Aktif Dibuka' : '🔴 Ditutup'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Transparansi: {currentSelectedForm?.isPublicStatsVisible ? 'Publik Satker' : 'Internal Admin'}
                    </span>
                  </div>
                  <div className="p-3 bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                    <Clock className="w-6 h-6" />
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-500 block">Indeks Kepuasan (IKM)</span>
                    <span className="text-2xl font-black text-amber-500 font-mono mt-1 block">
                      {analyticsSummary.ikmAnalytics ? `${analyticsSummary.ikmAnalytics.ikmConversion}` : 'N/A'}
                    </span>
                    <span className="text-[10px] font-black text-emerald-600">
                      {analyticsSummary.ikmAnalytics ? `Mutu: ${analyticsSummary.ikmAnalytics.grade} (${analyticsSummary.ikmAnalytics.predikat})` : 'Butuh Rating'}
                    </span>
                  </div>
                  <div className="p-3 bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-2xl">
                    <Award className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* INDEKS KEPUASAN MASYARAKAT (IKM) SCORECARD */}
              {analyticsSummary.ikmAnalytics && (
                <div className={`p-6 rounded-3xl border-2 shadow-lg space-y-4 ${
                  isDark ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border-indigo-900/60' : 'bg-gradient-to-br from-white via-indigo-50/40 to-sky-50/60 border-indigo-200'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-200/40 dark:border-indigo-800/40 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold">
                        <Award className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                          <span>Indeks Kepuasan Masyarakat (IKM) Permenpan-RB 14/2017</span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            Mutu: {analyticsSummary.ikmAnalytics.grade}
                          </span>
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Kalkulasi bobot rata-rata tertimbang (NRR) dari {analyticsSummary.ikmAnalytics.totalElements} indikator penilaian
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsReportModalOpen(true)}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-sm hover:scale-105 transition-all"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Cetak BAP Resmi</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">NRR Tertimbang</span>
                      <span className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1 block">
                        {analyticsSummary.ikmAnalytics.nrrTotal.toFixed(3)}
                      </span>
                      <span className="text-[10px] text-slate-400">Skala 1 - 5</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Nilai Konversi IKM</span>
                      <span className="text-2xl font-black text-sky-600 dark:text-sky-400 font-mono mt-1 block">
                        {analyticsSummary.ikmAnalytics.ikmConversion.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-slate-400">Skala 25 - 100</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Mutu Pelayanan</span>
                      <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1 block">
                        {analyticsSummary.ikmAnalytics.grade}
                      </span>
                      <span className="text-[10px] text-emerald-600 font-black">{analyticsSummary.ikmAnalytics.predikat}</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Kategori Penilaian</span>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200 mt-2 block leading-snug">
                        {analyticsSummary.ikmAnalytics.kategoriMutuText}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* SENTIMENT & FEEDBACK WORD CLOUD */}
              {analyticsSummary.sentimentSummary && analyticsSummary.sentimentSummary.topKeywords.length > 0 && (
                <div className={`p-5 rounded-3xl border shadow-md space-y-3 ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-emerald-500" />
                      <span>Analisis Sentimen &amp; Kata Kunci Saran Satker</span>
                    </h4>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-600 font-bold">
                        {analyticsSummary.sentimentSummary.positiveCount} Apresiasi Positif
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-600 font-bold">
                        {analyticsSummary.sentimentSummary.constructiveCount} Masukan Konstruktif
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {analyticsSummary.sentimentSummary.topKeywords.map((item, idx) => (
                      <span 
                        key={item.word}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                          idx === 0 
                            ? 'bg-sky-500 text-white shadow-xs' 
                            : idx < 3 
                              ? 'bg-sky-500/20 text-sky-700 dark:text-sky-300' 
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        #{item.word} <span className="opacity-70 font-mono text-[10px]">({item.count})</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* AUTOMATIC VISUAL CHARTS & PERCENTAGES PER QUESTION */}
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-sky-500" />
                    <span>Visualisasi Grafik Hasil per Pertanyaan</span>
                  </h3>
                  <span className="text-xs text-slate-400 font-bold">
                    {analyticsSummary.fieldsAnalytics.length} Indikator Dianalisis
                  </span>
                </div>

                {analyticsSummary.totalResponses === 0 ? (
                  <div className="p-12 text-center rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-2 opacity-50" />
                    <h4 className="font-black text-slate-800 dark:text-slate-200 text-sm">Belum ada respon untuk formulir ini</h4>
                    <p className="text-xs text-slate-500 mt-1">Grafik dan persentase akan otomatis terbentuk begitu ada respon masuk atau diimpor dari Google Form.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {analyticsSummary.fieldsAnalytics.map((fa, idx) => (
                      <div
                        key={fa.fieldId}
                        className={`p-6 rounded-3xl border-2 shadow-md space-y-4 ${
                          isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
                        }`}
                      >
                        {/* Question Header & Chart Mode Toggle */}
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                          <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-sky-500/15 text-sky-700 dark:text-sky-300">
                              Pertanyaan #{idx + 1} • {fa.fieldType}
                            </span>
                            <h4 className="font-black text-sm leading-snug">
                              {fa.fieldLabel}
                            </h4>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                            <span className="text-[11px] font-bold text-slate-400 font-mono">
                              {fa.totalAnswered} Jawaban
                            </span>

                            {(fa.fieldType === 'RATING' || fa.fieldType === 'MULTIPLE_CHOICE' || fa.fieldType === 'DROPDOWN' || fa.fieldType === 'YES_NO') && (
                              <div className="inline-flex rounded-lg p-0.5 bg-slate-100 dark:bg-slate-800 text-[10px] font-bold">
                                <button
                                  type="button"
                                  onClick={() => setChartViewModes(prev => ({ ...prev, [fa.fieldId]: 'BAR' }))}
                                  className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                                    (chartViewModes[fa.fieldId] || 'BAR') === 'BAR'
                                      ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-xs'
                                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                                  }`}
                                  title="Diagram Batang & Persentase"
                                >
                                  📊 Batang %
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setChartViewModes(prev => ({ ...prev, [fa.fieldId]: 'DONUT' }))}
                                  className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                                    chartViewModes[fa.fieldId] === 'DONUT'
                                      ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-xs'
                                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                                  }`}
                                  title="Diagram Lingkaran / Donut"
                                >
                                  🍩 Donut
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setChartViewModes(prev => ({ ...prev, [fa.fieldId]: 'TABLE' }))}
                                  className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                                    chartViewModes[fa.fieldId] === 'TABLE'
                                      ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-xs'
                                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                                  }`}
                                  title="Tabel Rincian Respon"
                                >
                                  📋 Rincian
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 1. VISUAL CHART FOR RATING (STARS & IKM) */}
                        {fa.fieldType === 'RATING' && fa.ratingDistribution && (() => {
                          const ikmScore = Number(((fa.averageRating || 0) / 5 * 100).toFixed(1));
                          const ikmPredikat = ikmScore >= 88.31 ? 'A (Sangat Baik)' : ikmScore >= 76.61 ? 'B (Baik)' : ikmScore >= 65 ? 'C (Kurang Baik)' : 'D (Buruk)';
                          const currentMode = chartViewModes[fa.fieldId] || 'BAR';

                          return (
                            <div className="space-y-3">
                              {/* Big Average Score Hero with IKM Badge */}
                              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase block">Indeks Kepuasan Rata-Rata</span>
                                  <div className="flex items-baseline gap-2 mt-0.5">
                                    <span className="text-3xl font-black text-amber-500 font-mono">
                                      {fa.averageRating}
                                    </span>
                                    <span className="text-xs text-slate-400 font-bold">/ 5.00 ⭐</span>
                                  </div>
                                </div>

                                <div className="sm:text-right space-y-1">
                                  <span className="text-[10px] font-bold text-slate-500 block">Konversi IKM KemenPAN-RB:</span>
                                  <span className="inline-block px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-black font-mono">
                                    {ikmScore}% • Mutu {ikmPredikat}
                                  </span>
                                </div>
                              </div>

                              {/* Mode A: Bar Chart */}
                              {currentMode === 'BAR' && (
                                <div className="space-y-2 pt-1">
                                  {[5, 4, 3, 2, 1].map(starVal => {
                                    const data = fa.ratingDistribution![starVal] || { count: 0, percentage: 0 };
                                    const barColor = 
                                      starVal === 5 ? 'bg-emerald-500' :
                                      starVal === 4 ? 'bg-sky-500' :
                                      starVal === 3 ? 'bg-amber-500' :
                                      starVal === 2 ? 'bg-orange-500' : 'bg-rose-500';

                                    return (
                                      <div key={starVal} className="space-y-1">
                                        <div className="flex items-center justify-between text-xs">
                                          <span className="font-bold flex items-center gap-1">
                                            <span>{starVal} Bintang</span>
                                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                          </span>
                                          <span className="font-mono font-bold text-slate-500">
                                            {data.count} ({data.percentage}%)
                                          </span>
                                        </div>
                                        <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                          <div
                                            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                                            style={{ width: `${data.percentage}%` }}
                                          />
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {/* Mode B: Donut Chart representation */}
                              {currentMode === 'DONUT' && (
                                <div className="flex items-center justify-around gap-4 py-3">
                                  <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                                    <div className="w-24 h-24 rounded-full border-8 border-emerald-500/20 flex items-center justify-center">
                                      <div className="text-center">
                                        <span className="text-lg font-black text-amber-500 block font-mono">{fa.averageRating}</span>
                                        <span className="text-[9px] text-slate-400 font-bold block">Rating ★</span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="space-y-1.5 flex-1">
                                    {[5, 4, 3, 2, 1].map(s => {
                                      const d = fa.ratingDistribution![s] || { count: 0, percentage: 0 };
                                      if (d.count === 0) return null;
                                      return (
                                        <div key={s} className="flex items-center justify-between text-xs">
                                          <span className="flex items-center gap-1 font-bold text-slate-700 dark:text-slate-300">
                                            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                                            <span>{s} Bintang</span>
                                          </span>
                                          <span className="font-mono font-bold text-slate-500">
                                            {d.count} ({d.percentage}%)
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* Mode C: Table Rincian */}
                              {currentMode === 'TABLE' && (
                                <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                                  <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-500">
                                      <tr>
                                        <th className="py-2 px-3">Tingkat Penilaian</th>
                                        <th className="py-2 px-3 text-center">Jumlah Suara</th>
                                        <th className="py-2 px-3 text-right">Persentase</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                      {[5, 4, 3, 2, 1].map(st => {
                                        const d = fa.ratingDistribution![st] || { count: 0, percentage: 0 };
                                        return (
                                          <tr key={st}>
                                            <td className="py-2 px-3 font-semibold">{st} Bintang ★</td>
                                            <td className="py-2 px-3 text-center font-mono font-bold">{d.count} Satker</td>
                                            <td className="py-2 px-3 text-right font-mono font-black text-sky-600">{d.percentage}%</td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        {/* 2. VISUAL CHART FOR MULTIPLE CHOICE, DROPDOWN & YES_NO */}
                        {(fa.fieldType === 'MULTIPLE_CHOICE' || fa.fieldType === 'DROPDOWN' || fa.fieldType === 'YES_NO') && fa.optionDistribution && (() => {
                          const currentMode = chartViewModes[fa.fieldId] || 'BAR';
                          const colors = [
                            'bg-sky-500',
                            'bg-indigo-500',
                            'bg-emerald-500',
                            'bg-amber-500',
                            'bg-rose-500',
                            'bg-purple-500'
                          ];

                          return (
                            <div className="space-y-3">
                              {/* Mode A: Bar Chart */}
                              {currentMode === 'BAR' && (
                                <div className="space-y-3">
                                  {Object.entries(fa.optionDistribution).map(([optName, data], optIdx) => {
                                    const colorClass = colors[optIdx % colors.length];

                                    return (
                                      <div key={optName} className="space-y-1">
                                        <div className="flex items-center justify-between text-xs">
                                          <span className="font-bold truncate max-w-[220px]" title={optName}>
                                            {optName}
                                          </span>
                                          <span className="font-mono font-bold text-slate-500 shrink-0">
                                            {data.count} Respon ({data.percentage}%)
                                          </span>
                                        </div>
                                        <div className="w-full h-3.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                          <div
                                            className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
                                            style={{ width: `${data.percentage}%` }}
                                          />
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {/* Mode B: Donut Chart representation */}
                              {currentMode === 'DONUT' && (
                                <div className="space-y-2 py-2">
                                  <div className="flex flex-wrap gap-2 justify-center">
                                    {Object.entries(fa.optionDistribution).map(([optName, data], optIdx) => (
                                      <div key={optName} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-center min-w-[120px] flex-1">
                                        <span className="text-[10px] text-slate-400 font-bold block truncate" title={optName}>{optName}</span>
                                        <span className="text-xl font-black text-sky-600 font-mono mt-0.5 block">{data.percentage}%</span>
                                        <span className="text-[10px] text-slate-500 font-semibold">{data.count} Respon</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Mode C: Table Rincian */}
                              {currentMode === 'TABLE' && (
                                <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                                  <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-500">
                                      <tr>
                                        <th className="py-2 px-3">Pilihan Opsi</th>
                                        <th className="py-2 px-3 text-center">Pemilih</th>
                                        <th className="py-2 px-3 text-right">Persentase</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                      {Object.entries(fa.optionDistribution).map(([optName, data]) => (
                                        <tr key={optName}>
                                          <td className="py-2 px-3 font-semibold">{optName}</td>
                                          <td className="py-2 px-3 text-center font-mono font-bold">{data.count}</td>
                                          <td className="py-2 px-3 text-right font-mono font-black text-sky-600">{data.percentage}%</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        {/* 3. LIST OF TEXT / PARAGRAPH RESPONSES */}
                        {(fa.fieldType === 'SHORT_TEXT' || fa.fieldType === 'PARAGRAPH') && fa.textAnswers && (
                          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                            {fa.textAnswers.length === 0 ? (
                              <p className="text-xs text-slate-400 italic">Belum ada jawaban teks terisi.</p>
                            ) : (
                              fa.textAnswers.map((txt, tIdx) => (
                                <div
                                  key={tIdx}
                                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs space-y-1"
                                >
                                  <p className="font-medium text-slate-800 dark:text-slate-200 italic">
                                    "{txt.text}"
                                  </p>
                                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                                    <span>{txt.respondentName} ({txt.satker})</span>
                                    <span>{new Date(txt.submittedAt).toLocaleDateString('id-ID')}</span>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUB-TAB 2: OLAH DATA RESPON SATKER */}
      {/* ===================================================================== */}
      {subTab === 'RESPONSES' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchRespondent}
                onChange={e => setSearchRespondent(e.target.value)}
                placeholder="Cari nama / satker responden..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="flex items-center gap-2">
              {currentSelectedForm && (
                <>
                  <button
                    type="button"
                    disabled={filteredResponses.length === 0}
                    onClick={() => exportFormResponsesToExcel(currentSelectedForm, responses)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Ekspor Respon ({filteredResponses.length})</span>
                  </button>

                  <button
                    type="button"
                    disabled={filteredResponses.length === 0}
                    onClick={() => setDeleteConfirmModal({
                      isOpen: true,
                      mode: 'ALL_RESPONSES',
                      targetId: currentSelectedForm.id,
                      targetTitle: currentSelectedForm.title
                    })}
                    className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                    title="Bersihkan respon formulir ini untuk menghemat memori"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Bersihkan Respon</span>
                  </button>
                </>
              )}
            </div>
          </div>

          <div className={`rounded-3xl border overflow-hidden shadow-lg ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 font-black">
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4">Nama Responden</th>
                    <th className="py-3 px-4">Satker / Unit</th>
                    <th className="py-3 px-4">Waktu Pengisian</th>
                    <th className="py-3 px-4">Ringkasan Jawaban</th>
                    <th className="py-3 px-4 text-center w-16">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredResponses.map((r, idx) => (
                    <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 text-center font-mono text-slate-400 font-bold">{idx + 1}</td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {r.respondentName}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {r.respondentSatker}
                      </td>
                      <td className="py-3 px-4 text-[11px] text-slate-400">
                        {new Date(r.submittedAt).toLocaleString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="py-3 px-4 max-w-md">
                        <div className="space-y-1">
                          {r.answers.slice(0, 3).map((ans, aIdx) => (
                            <div key={aIdx} className="text-[11px] truncate">
                              <span className="font-bold text-slate-500">{ans.fieldLabel}:</span>{' '}
                              <span className="text-slate-800 dark:text-slate-200 font-semibold">{String(ans.value)}</span>
                            </div>
                          ))}
                          {r.answers.length > 3 && (
                            <span className="text-[10px] text-slate-400 font-italic">+{r.answers.length - 3} jawaban lainnya</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmModal({
                            isOpen: true,
                            mode: 'SINGLE_RESPONSE',
                            targetId: r.id
                          })}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer transition-all"
                          title="Hapus respon ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {filteredResponses.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        Belum ada respon yang masuk untuk formulir ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUB-TAB 3: BACA & IMPORT GOOGLE FORM */}
      {/* ===================================================================== */}
      {subTab === 'IMPORT_GFORM' && (
        <div className="space-y-6 max-w-3xl">
          <div className={`p-6 rounded-3xl border shadow-md space-y-5 ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <FileUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-base">Baca &amp; Import Respon Google Form</h3>
                <p className="text-xs text-slate-500">Membaca file Excel (.xlsx) / CSV hasil Google Form dan menyusun grafik otomatis</p>
              </div>
            </div>

            {/* Import Mode Switcher */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => setGformImportMode('URL')}
                className={`py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  gformImportMode === 'URL'
                    ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>Link Live Sheets</span>
              </button>

              <button
                type="button"
                onClick={() => setGformImportMode('FILE')}
                className={`py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  gformImportMode === 'FILE'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Excel</span>
              </button>

              <button
                type="button"
                onClick={() => setGformImportMode('PASTE')}
                className={`py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  gformImportMode === 'PASTE'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Paste Teks</span>
              </button>

              <button
                type="button"
                onClick={() => setGformImportMode('TEMPLATES')}
                className={`py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  gformImportMode === 'TEMPLATES'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>Template Resmi</span>
              </button>
            </div>

            {/* Mode 1: URL LIVE SYNC */}
            {gformImportMode === 'URL' && (
              <div className="space-y-4 p-5 rounded-2xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800/60">
                <div className="space-y-1">
                  <h4 className="text-xs font-black uppercase text-sky-800 dark:text-sky-300 flex items-center gap-1.5">
                    <Link2 className="w-4 h-4 text-sky-600" />
                    <span>Sinkronisasi Otomatis Tautan Google Sheets / Form</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Tempelkan tautan spreadsheet Google Form respon Anda. Sistem akan langsung mengunduh baris jawaban secara online dan menghubungkan pembaruan data secara berkala.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tautan Google Sheets / Google Form:
                  </label>
                  <input
                    type="url"
                    value={gformSpreadsheetUrl}
                    onChange={e => setGformSpreadsheetUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
                  />
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Pastikan file Google Sheet diatur: <em>"Siapa saja dengan link dapat melihat" (Anyone with the link can view)</em>.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Judul Kuesioner (Opsional):
                  </label>
                  <input
                    type="text"
                    value={gformCustomTitle}
                    onChange={e => setGformCustomTitle(e.target.value)}
                    placeholder="Contoh: Survei Kepuasan Triwulan I 2026 KPPN Semarang I..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleFetchGoogleSheetUrl}
                  disabled={isImportLoading || !gformSpreadsheetUrl.trim()}
                  className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50 cursor-pointer transition-all hover:scale-[1.01] active:scale-98"
                >
                  <RefreshCw className={`w-4 h-4 ${isImportLoading ? 'animate-spin' : ''}`} />
                  <span>{isImportLoading ? 'Menghubungi Server Google...' : 'Tarik Data Live & Deteksi Pertanyaan'}</span>
                </button>
              </div>
            )}

            {/* Mode 2: FILE UPLOAD */}
            {gformImportMode === 'FILE' && (
              <div className="border-2 border-dashed border-emerald-500/40 rounded-3xl p-8 text-center bg-emerald-500/5 hover:bg-emerald-500/10 transition-all relative">
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUploadGoogleForm}
                  disabled={isImportLoading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="space-y-2 pointer-events-none">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                    <Upload className="w-6 h-6" />
                  </div>
                  <h4 className="font-black text-sm text-slate-800 dark:text-slate-200">
                    {isImportLoading ? 'Sedang membaca file...' : 'Klik atau Tarik File Hasil Google Form ke Sini'}
                  </h4>
                  <p className="text-xs text-slate-500">
                    Format didukung: File Excel Google Form (<strong>.xlsx</strong>) atau CSV (<strong>.csv</strong>)
                  </p>
                </div>
              </div>
            )}

            {/* Mode 3: PASTE TEXT */}
            {gformImportMode === 'PASTE' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Judul Kuesioner (Opsional):
                  </label>
                  <input
                    type="text"
                    value={gformCustomTitle}
                    onChange={e => setGformCustomTitle(e.target.value)}
                    placeholder="Contoh: Survei Kepuasan Bimtek SAKTI 2026..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Paste Data Tabel (Salin dari Google Sheets / Excel):
                  </label>
                  <textarea
                    rows={6}
                    value={pastedSpreadsheetData}
                    onChange={e => setPastedSpreadsheetData(e.target.value)}
                    placeholder="Buka Google Sheets respon form Anda, pilih semua sel (Ctrl+A), salin (Ctrl+C), lalu paste (Ctrl+V) di sini..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleParsePastedSpreadsheet}
                  disabled={isImportLoading || !pastedSpreadsheetData.trim()}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50 cursor-pointer transition-all"
                >
                  <FileText className="w-4 h-4" />
                  <span>Proses &amp; Deteksi Pertanyaan</span>
                </button>
              </div>
            )}

            {/* Mode 4: OFFICIAL GOVERNMENT TEMPLATES */}
            {gformImportMode === 'TEMPLATES' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-black uppercase text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-indigo-500" />
                    <span>Template Standar Resmi Kemenkeu &amp; Permenpan-RB</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Terapkan instrumen survei standar kepuasan masyarakat (SKM 9 Unsur), Zona Integritas WBK/WBBM, atau evaluasi bimbingan teknis satker dengan 1 klik.
                  </p>
                </div>

                <div className="space-y-3">
                  {OFFICIAL_GOVERNMENT_TEMPLATES.map(tpl => (
                    <div 
                      key={tpl.id}
                      className="p-4 rounded-2xl border-2 border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                            {tpl.badge}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 font-mono">
                            {tpl.fields.length} Indikator
                          </span>
                        </div>
                        <h5 className="font-black text-sm text-slate-900 dark:text-white">
                          {tpl.name}
                        </h5>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {tpl.description}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeployOfficialTemplate(tpl.id)}
                        className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shrink-0 cursor-pointer shadow-md flex items-center justify-center gap-1.5 hover:scale-105 active:scale-95 transition-all"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Terapkan Template</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Instant Sample Trial Button */}
            <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="space-y-0.5 text-center sm:text-left">
                <span className="text-xs font-black text-sky-800 dark:text-sky-300 flex items-center gap-1.5 justify-center sm:justify-start">
                  <Sparkles className="w-4 h-4 text-sky-500" />
                  <span>Ingin Coba Langsung dengan Data Realistis?</span>
                </span>
                <p className="text-[11px] text-slate-500">
                  Muat simulasi hasil Google Form Survei Kepuasan Layanan 15 Satker KPPN Semarang I.
                </p>
              </div>

              <button
                type="button"
                onClick={handleLoadSampleGoogleFormData}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs shrink-0 cursor-pointer shadow-sm hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Coba Contoh Google Form</span>
              </button>
            </div>

            {/* Detected Preview Results with Interactive Column Mapper */}
            {importPreview && (
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Kolom Google Form Berhasil Terbaca &amp; Siap Dipetakan!</span>
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 font-mono">
                    {importPreview.summary.totalRows} Responden
                  </span>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                    Nama / Judul Formulir:
                  </label>
                  <input
                    type="text"
                    value={gformCustomTitle}
                    onChange={e => setGformCustomTitle(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-black"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs py-2 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Total Respon</span>
                    <span className="font-black text-emerald-600 text-sm font-mono">{importPreview.summary.totalRows} Baris</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Pertanyaan</span>
                    <span className="font-black text-sky-600 text-sm font-mono">{importPreview.form.fields.length} Butir</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Satker Terlibat</span>
                    <span className="font-black text-indigo-600 text-sm font-mono">{importPreview.summary.detectedSatkersCount} Satker</span>
                  </div>
                </div>

                {/* Smart Interactive Column Mapping Table */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase text-slate-500">
                      Pemetaan Tipe Soal &amp; Label Pertanyaan:
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Anda dapat mengubah tipe data atau menghapus kolom yang tidak relevan
                    </span>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {importPreview.form.fields.map((f, i) => (
                      <div 
                        key={f.id} 
                        className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="font-mono text-slate-400 font-bold shrink-0">#{i + 1}</span>
                          <input
                            type="text"
                            value={f.label}
                            onChange={e => {
                              const val = e.target.value;
                              setImportPreview({
                                ...importPreview,
                                form: {
                                  ...importPreview.form,
                                  fields: importPreview.form.fields.map(fl => fl.id === f.id ? { ...fl, label: val } : fl)
                                }
                              });
                            }}
                            className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-xs font-semibold text-slate-800 dark:text-slate-200"
                          />
                        </div>

                        <div className="flex items-center gap-2 shrink-0 justify-end">
                          <select
                            value={f.type}
                            onChange={e => handleChangePreviewFieldType(f.id, e.target.value as FormFieldType)}
                            className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-[11px] font-black text-sky-600 dark:text-sky-400 cursor-pointer"
                          >
                            <option value="RATING">⭐ Rating (1-5)</option>
                            <option value="MULTIPLE_CHOICE">🥧 Pilihan Ganda</option>
                            <option value="YES_NO">👍 Ya / Tidak</option>
                            <option value="PARAGRAPH">💬 Uraian Panjang</option>
                            <option value="SHORT_TEXT">📝 Teks Singkat</option>
                          </select>

                          <button
                            type="button"
                            onClick={() => handleRemovePreviewField(f.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                            title="Abaikan kolom ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveImportedGoogleForm}
                  className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.01] active:scale-98 transition-all"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Simpan &amp; Susun Grafik Otomatis Sekarang</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUB-TAB 4: BANK SOAL & REFERENSI PINTAR */}
      {/* ===================================================================== */}
      {subTab === 'QUESTION_BANK' && (
        <QuestionBankHub
          onFormCreated={(newForm) => {
            setForms(prev => [newForm, ...prev]);
            setSelectedFormId(newForm.id);
            setSubTab('MANAGE_FORMS');
          }}
          onSelectFormForBuilder={(formId) => {
            const target = forms.find(f => f.id === formId);
            if (target) {
              handleOpenEditForm(target);
            }
          }}
        />
      )}

      {/* ===================================================================== */}
      {/* SUB-TAB 5: KELOLA & BUAT FORMULIR (BUILDER) */}
      {/* ===================================================================== */}
      {subTab === 'MANAGE_FORMS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Bank Formulir &amp; Kuesioner KPPN
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Kelola formulir, edit butir pertanyaan dinamis, buka/tutup kuesioner, dan atur izin transparansi ke Satker.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenCreateForm}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Buat Formulir Baru</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {forms.map(form => (
              <div
                key={form.id}
                className={`p-5 rounded-3xl border-2 flex flex-col justify-between transition-all ${
                  isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {form.category}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleFormActive(form)}
                      className={`text-[10px] font-black px-2.5 py-1 rounded-lg cursor-pointer transition-all ${
                        form.isActive
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {form.isActive ? '● Aktif Dibuka' : '○ Ditutup'}
                    </button>
                  </div>

                  <h4 className="font-black text-base leading-snug">{form.title}</h4>
                  <p className="text-xs text-slate-500 line-clamp-2">{form.description}</p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {form.fields.length} Pertanyaan • {responses.filter(r => r.formId === form.id).length} Respon • Transparansi: {form.isPublicStatsVisible ? 'Publik' : 'Internal'}
                  </p>
                </div>

                <div className="pt-3 mt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEditForm(form)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer"
                    title="Edit formulir"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmModal({
                      isOpen: true,
                      mode: 'FORM',
                      targetId: form.id,
                      targetTitle: form.title
                    })}
                    className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 cursor-pointer"
                    title="Hapus formulir"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 1: FORM BUILDER (CREATE / EDIT FORMULIR) */}
      {/* ===================================================================== */}
      {isBuilderModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className={`w-full max-w-3xl max-h-[90vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <h3 className="font-black text-base flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-sky-500" />
                <span>{editingFormId ? 'Edit Formulir' : 'Buat Formulir / Survei Baru'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsBuilderModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFormBuilder} className="overflow-y-auto p-6 space-y-5">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Judul Formulir <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={e => setFormTitle(e.target.value)}
                    placeholder="Contoh: Survei Persepsi Korupsi Satker 2026..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Deskripsi / Pengantar Formulir
                  </label>
                  <textarea
                    rows={2}
                    value={formDesc}
                    onChange={e => setFormDesc(e.target.value)}
                    placeholder="Jelaskan maksud dan tujuan pengisian kuesioner..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Kategori Formulir:
                    </label>
                    <select
                      value={formCat}
                      onChange={e => setFormCat(e.target.value as FormCategory)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold"
                    >
                      <option value="SURVEI_LAYANAN">Survei Kepuasan Layanan</option>
                      <option value="PENDAFTARAN_BIMTEK">Pendaftaran Bimtek / Sosialisasi</option>
                      <option value="KONFIRMASI_SATKER">Konfirmasi Satker / Rekonsiliasi</option>
                      <option value="EVALUASI_IKPA">Evaluasi Capaian IKPA</option>
                      <option value="UMUM">Formulir Umum</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Periode Survei / Tahun (Opsional):
                    </label>
                    <input
                      type="text"
                      value={formSkmPeriod}
                      onChange={e => setFormSkmPeriod(e.target.value)}
                      placeholder="Contoh: Triwulan I 2026..."
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Tautan Google Sheets Live (Opsional):
                    </label>
                    <input
                      type="url"
                      value={formGoogleSheetUrl}
                      onChange={e => setFormGoogleSheetUrl(e.target.value)}
                      placeholder="https://docs.google.com/spreadsheets/d/..."
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
                    />
                  </div>

                  <div className="flex items-center gap-4 pt-5">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold">
                      <input
                        type="checkbox"
                        checked={formPublicStats}
                        onChange={e => setFormPublicStats(e.target.checked)}
                        className="rounded text-sky-600 focus:ring-sky-500"
                      />
                      <span>Tampilkan Grafik ke Satker (Transparansi)</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Dynamic Field Builder */}
              <div className="space-y-4 pt-3 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                    Daftar Butir Pertanyaan ({formFields.length})
                  </h4>

                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsQuestionBankSelectorOpen(true)}
                      className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 transition-transform"
                      title="Pilih soal langsung dari Bank Soal & Pengetahuan Pintar"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>📚 Ambil dari Bank Soal</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddFieldToBuilder('RATING')}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-400 font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                    >
                      <Star className="w-3 h-3 fill-current" />
                      <span>+ Rating Bintang</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddFieldToBuilder('MULTIPLE_CHOICE')}
                      className="px-2.5 py-1 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-700 dark:text-sky-400 font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                    >
                      <PieChart className="w-3 h-3" />
                      <span>+ Pilihan Ganda</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddFieldToBuilder('YES_NO')}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-400 font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                    >
                      <ThumbsUp className="w-3 h-3" />
                      <span>+ Ya / Tidak</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddFieldToBuilder('PARAGRAPH')}
                      className="px-2.5 py-1 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 text-purple-700 dark:text-purple-400 font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>+ Teks Saran</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {formFields.map((field, fIdx) => (
                    <div
                      key={field.id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2 relative"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-black uppercase text-sky-600 dark:text-sky-400">
                          #{fIdx + 1} Tipe: {field.type}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFieldFromBuilder(field.id)}
                          className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                          title="Hapus butir pertanyaan ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <input
                        type="text"
                        value={field.label}
                        onChange={e => {
                          const val = e.target.value;
                          setFormFields(prev => prev.map(f => f.id === field.id ? { ...f, label: val } : f));
                        }}
                        placeholder="Tuliskan butir pertanyaan..."
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                      />

                      {(field.type === 'MULTIPLE_CHOICE' || field.type === 'DROPDOWN') && (
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[10px] font-bold text-slate-400">Opsi Pilihan (pisahkan dengan koma):</span>
                          <input
                            type="text"
                            value={(field.options || []).map(o => o.label).join(', ')}
                            onChange={e => {
                              const raw = e.target.value;
                              const opts = raw.split(',').map((s, idx) => ({ id: `opt_${idx}`, label: s.trim() })).filter(o => o.label);
                              setFormFields(prev => prev.map(f => f.id === field.id ? { ...f, options: opts } : f));
                            }}
                            placeholder="Sangat Puas, Cukup Puas, Kurang Puas..."
                            className="w-full px-3 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBuilderModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan &amp; Terbitkan Form</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2: KONFIRMASI HAPUS */}
      {/* ===================================================================== */}
      {deleteConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className={`w-full max-w-md rounded-3xl border shadow-2xl p-6 space-y-4 ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-base">Konfirmasi Hapus Data</h3>
                <p className="text-xs text-slate-500">Pembersihan Memori &amp; Database</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-900 dark:text-rose-200 text-xs leading-relaxed">
              {deleteConfirmModal.mode === 'SINGLE_RESPONSE' && (
                <p>Apakah Anda yakin ingin menghapus respon peserta ini?</p>
              )}
              {deleteConfirmModal.mode === 'ALL_RESPONSES' && (
                <p>
                  Apakah Anda yakin ingin membersihkan <strong>seluruh data respon</strong> untuk formulir "{deleteConfirmModal.targetTitle}"? Tindakan ini akan menghemat kapasitas memori database.
                </p>
              )}
              {deleteConfirmModal.mode === 'FORM' && (
                <p>
                  Apakah Anda yakin ingin menghapus formulir "{deleteConfirmModal.targetTitle}" beserta seluruh respon yang pernah masuk?
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDeleteConfirmModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmExecuteDeletion}
                className="px-5 py-2 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-500 text-white shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ya, Hapus Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Executive Report Modal */}
      {isReportModalOpen && currentSelectedForm && (
        <FormOfficialReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          form={currentSelectedForm}
          responses={responses}
        />
      )}

      {/* QR Code & Share Modal */}
      {isQrShareModalOpen && currentSelectedForm && (
        <FormQrShareModal
          isOpen={isQrShareModalOpen}
          onClose={() => setIsQrShareModalOpen(false)}
          form={currentSelectedForm}
        />
      )}

      {/* Front Office Kiosk Tablet Mode Modal */}
      {isKioskModalOpen && currentSelectedForm && (
        <FormKioskModal
          isOpen={isKioskModalOpen}
          onClose={() => setIsKioskModalOpen(false)}
          form={currentSelectedForm}
          masterSatkers={masterSatkers}
        />
      )}

      {/* Question Bank Selector Modal (for Form Builder) */}
      {isQuestionBankSelectorOpen && (
        <QuestionBankSelectorModal
          isOpen={isQuestionBankSelectorOpen}
          onClose={() => setIsQuestionBankSelectorOpen(false)}
          onInsertFields={handleInsertFieldsFromQuestionBank}
        />
      )}
    </div>
  );
};
