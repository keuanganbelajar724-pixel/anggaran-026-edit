import React, { useState, useEffect } from 'react';
import { 
  Maximize2, 
  Minimize2, 
  Star, 
  Send, 
  CheckCircle2, 
  Lock, 
  Building2, 
  User, 
  Sparkles,
  ShieldCheck,
  RotateCcw,
  X
} from 'lucide-react';
import { KppnForm, FormResponseRecord, FormAnswer } from '../../types/form';
import { saveFormResponse } from '../../utils/formStorage';
import { MasterSatker } from '../../types';

interface FormKioskModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: KppnForm;
  masterSatkers?: MasterSatker[];
}

export const FormKioskModal: React.FC<FormKioskModalProps> = ({
  isOpen,
  onClose,
  form,
  masterSatkers = []
}) => {
  const [respName, setRespName] = useState<string>('');
  const [respSatker, setRespSatker] = useState<string>('');
  const [currentAnswers, setCurrentAnswers] = useState<Record<string, string | number>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(5);

  // Security Exit PIN Dialog
  const [showExitPinModal, setShowExitPinModal] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');

  const kioskPin = form.kioskModePin || '1234';

  useEffect(() => {
    let timer: any;
    if (submitSuccess) {
      setCountdown(5);
      timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            // Reset form for next visitor
            handleResetForm();
            return 5;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [submitSuccess]);

  if (!isOpen) return null;

  const handleResetForm = () => {
    setRespName('');
    setRespSatker('');
    setCurrentAnswers({});
    setValidationErrors({});
    setSubmitSuccess(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    const errors: Record<string, string> = {};
    if (!respName.trim()) {
      errors.name = 'Nama responden wajib diisi.';
    }
    if (!respSatker.trim()) {
      errors.satker = 'Pilih atau tuliskan nama satker/instansi Anda.';
    }

    form.fields.forEach(field => {
      if (field.required && (currentAnswers[field.id] === undefined || currentAnswers[field.id] === '')) {
        errors[field.id] = 'Pertanyaan ini wajib dijawab.';
      }
    });

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const answers: FormAnswer[] = form.fields.map(field => ({
        fieldId: field.id,
        fieldLabel: field.label,
        fieldType: field.type,
        value: currentAnswers[field.id] !== undefined ? currentAnswers[field.id] : '-'
      }));

      const record: FormResponseRecord = {
        id: `resp_kiosk_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        formId: form.id,
        formTitle: form.title,
        respondentName: respName.trim(),
        respondentSatker: respSatker.trim(),
        answers,
        submittedAt: new Date().toISOString(),
        source: 'KIOSK_FO'
      };

      await saveFormResponse(record);
      setSubmitSuccess(true);
    } catch (err) {
      alert('Terjadi kesalahan saat menyimpan respon.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExitPinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === kioskPin) {
      setShowExitPinModal(false);
      setPinInput('');
      setPinError('');
      onClose();
    } else {
      setPinError('PIN salah! Hubungi Administrator KPPN.');
      setPinInput('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col overflow-hidden select-none animate-in fade-in duration-300">
      
      {/* Top Kiosk Bar */}
      <header className="px-6 py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-500/15 text-sky-400 text-[10px] font-black uppercase">
              <Sparkles className="w-3 h-3" />
              <span>Kiosk Tablet Front Office • KPPN Semarang I</span>
            </div>
            <h2 className="text-base font-black text-white truncate max-w-md">
              {form.title}
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowExitPinModal(true)}
          className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer transition-all flex items-center gap-1 text-xs font-bold"
          title="Keluar dari Mode Kiosk (Memerlukan PIN)"
        >
          <Lock className="w-4 h-4" />
          <span className="hidden sm:inline">Keluar Kiosk</span>
        </button>
      </header>

      {/* Main Kiosk Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-8 flex items-center justify-center">
        
        {submitSuccess ? (
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-5 animate-in zoom-in-95 duration-300 shadow-2xl">
            <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center shadow-lg border border-emerald-500/30">
              <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white">
                Terima Kasih Banyak!
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Penilaian dan masukan Anda sangat berharga bagi kami dalam mewujudkan pelayanan perbendaharaan yang prima, transparan, dan bebas biaya.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
              <span className="text-xs text-slate-400 block mb-1">
                Layar akan kembali otomatis untuk pengunjung berikutnya dalam:
              </span>
              <span className="text-3xl font-black text-sky-400 font-mono">
                {countdown} Detik
              </span>
            </div>

            <button
              type="button"
              onClick={handleResetForm}
              className="w-full py-3 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-black text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Isi Respon Baru Sekarang</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="max-w-2xl w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 space-y-8 shadow-2xl backdrop-blur-md">
            
            {/* Identity */}
            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-sky-400 flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>Identitas Responden Satker</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Nama Lengkap / Petugas <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={respName}
                    onChange={e => setRespName(e.target.value)}
                    placeholder="Nama Anda..."
                    className="w-full px-4 py-3 rounded-2xl border border-slate-700 bg-slate-800 text-sm font-bold text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                  {validationErrors.name && (
                    <span className="text-[11px] text-rose-400 font-bold block mt-1">{validationErrors.name}</span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Nama Satker / Instansi <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    list="satker-kiosk-list"
                    value={respSatker}
                    onChange={e => setRespSatker(e.target.value)}
                    placeholder="Ketik atau pilih satker..."
                    className="w-full px-4 py-3 rounded-2xl border border-slate-700 bg-slate-800 text-sm font-bold text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                  <datalist id="satker-kiosk-list">
                    {masterSatkers.map(s => (
                      <option key={s.kodeSatker} value={s.namaSatker} />
                    ))}
                  </datalist>
                  {validationErrors.satker && (
                    <span className="text-[11px] text-rose-400 font-bold block mt-1">{validationErrors.satker}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Questions */}
            <div className="space-y-6 pt-4 border-t border-slate-800">
              <h3 className="text-sm font-black uppercase tracking-wider text-sky-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                <span>Pertanyaan Penilaian Layanan</span>
              </h3>

              {form.fields.map((field, idx) => (
                <div 
                  key={field.id}
                  className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700/60 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="text-sm font-black text-white leading-snug">
                      {idx + 1}. {field.label} {field.required && <span className="text-rose-400">*</span>}
                    </h4>
                  </div>
                  {field.description && (
                    <p className="text-xs text-slate-400">{field.description}</p>
                  )}

                  {/* Rating 1 - 5 Large Stars */}
                  {field.type === 'RATING' && (
                    <div className="pt-2">
                      <div className="flex items-center justify-center sm:justify-start gap-2 sm:gap-4">
                        {[1, 2, 3, 4, 5].map(star => {
                          const isSelected = Number(currentAnswers[field.id]) >= star;
                          return (
                            <button
                              key={star}
                              type="button"
                              onClick={() => handleAnswerChange(field.id, star)}
                              className={`p-3 sm:p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                                isSelected
                                  ? 'bg-amber-500/20 border-amber-400 text-amber-400 scale-105 shadow-lg'
                                  : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-600'
                              }`}
                            >
                              <Star className={`w-6 h-6 sm:w-8 sm:h-8 ${isSelected ? 'fill-current' : ''}`} />
                              <span className="text-xs font-black">{star}</span>
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-400 mt-2 max-w-xs px-1">
                        <span>1 ({field.minRatingLabel || 'Kurang'})</span>
                        <span>5 ({field.maxRatingLabel || 'Sangat Baik'})</span>
                      </div>
                    </div>
                  )}

                  {/* Multiple Choice */}
                  {(field.type === 'MULTIPLE_CHOICE' || field.type === 'DROPDOWN') && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {(field.options || []).map(opt => {
                        const isSelected = currentAnswers[field.id] === opt.label;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => handleAnswerChange(field.id, opt.label)}
                            className={`p-3 rounded-xl border text-left text-xs font-black transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-sky-600 border-sky-400 text-white shadow-md'
                                : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Yes / No */}
                  {field.type === 'YES_NO' && (
                    <div className="flex gap-3 pt-1">
                      {['Ya', 'Tidak'].map(val => {
                        const isSelected = currentAnswers[field.id] === val;
                        return (
                          <button
                            key={val}
                            type="button"
                            onClick={() => handleAnswerChange(field.id, val)}
                            className={`flex-1 py-3 rounded-xl border text-sm font-black transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-600 border-emerald-400 text-white shadow-md'
                                : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                            }`}
                          >
                            {val}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Paragraph / Text */}
                  {(field.type === 'PARAGRAPH' || field.type === 'SHORT_TEXT') && (
                    <textarea
                      rows={field.type === 'PARAGRAPH' ? 3 : 2}
                      value={String(currentAnswers[field.id] || '')}
                      onChange={e => handleAnswerChange(field.id, e.target.value)}
                      placeholder={field.placeholder || 'Tuliskan tanggapan Anda...'}
                      className="w-full p-3.5 rounded-2xl border border-slate-700 bg-slate-800 text-xs font-medium text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  )}

                  {validationErrors[field.id] && (
                    <span className="text-[11px] text-rose-400 font-bold block">{validationErrors[field.id]}</span>
                  )}
                </div>
              ))}
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-sky-500 via-sky-600 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-black text-base shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.02] active:scale-98 disabled:opacity-50"
              >
                <Send className="w-5 h-5 stroke-[2.5]" />
                <span>{isSubmitting ? 'Menyimpan...' : 'Kirim Penilaian Kuesioner'}</span>
              </button>
            </div>

          </form>
        )}

      </main>

      {/* Exit PIN Security Modal */}
      {showExitPinModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-sm w-full bg-slate-900 border border-slate-700 rounded-3xl p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 mx-auto">
              <Lock className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h4 className="text-base font-black text-white">Masukkan PIN Petugas</h4>
              <p className="text-xs text-slate-400">PIN diperlukan untuk mengakhiri Mode Kiosk Front Office</p>
            </div>

            <form onSubmit={handleExitPinSubmit} className="space-y-3">
              <input
                type="password"
                maxLength={8}
                autoFocus
                value={pinInput}
                onChange={e => setPinInput(e.target.value)}
                placeholder="PIN Admin (Default: 1234)"
                className="w-full py-2.5 text-center text-xl font-mono tracking-widest rounded-xl border border-slate-700 bg-slate-800 text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
              {pinError && (
                <span className="text-xs text-rose-400 font-bold block">{pinError}</span>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowExitPinModal(false);
                    setPinInput('');
                    setPinError('');
                  }}
                  className="flex-1 py-2 rounded-xl text-xs font-bold border border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl text-xs font-black bg-sky-600 hover:bg-sky-500 text-white shadow-md"
                >
                  Buka Kunci
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
