import React, { useState, useMemo } from 'react';
import {
  Copy,
  Check,
  Search,
  FileText,
  X,
  Share2,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Award,
  CreditCard,
  Zap,
  Globe,
  AlertTriangle,
  Building2
} from 'lucide-react';
import { REMINDER_TEMPLATES } from '../data/reminderTemplates';
import { TemplateMessage, MasterSatker } from '../types';

interface BroadcastTemplateLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  masterSatkers?: MasterSatker[];
  showToast?: (opts: { type: 'success' | 'error' | 'warning' | 'info'; title: string; message: string }) => void;
}

export const BroadcastTemplateLibraryModal: React.FC<BroadcastTemplateLibraryModalProps> = ({
  isOpen,
  onClose,
  masterSatkers = [],
  showToast
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateMessage>(REMINDER_TEMPLATES[0]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Variable customization states
  const [customVars, setCustomVars] = useState({
    namaSatker: 'PUSDIKBINMAS LEMDIKLAT POLRI',
    kodeSatker: '643340',
    namaPic: 'Bapak/Ibu Pengelola Keuangan',
    nilaiIkpa: '94.80',
    predikat: 'SANGAT BAIK',
    capaianOutput: '88.50',
    statusOutput: 'Sudah Terlaporkan',
    penyerapan: '78.40',
    deviasiHal3: '86.20',
    sisaPagu: '1.250.000.000',
    batasWaktu: 'Hari ini',
    noSurat: 'S-1284/KPN.1401/2026',
    masalahList: 'Akselerasi sisa pagu belanja barang & pemutakhiran RPD Hal III DIPA'
  });

  // Filter templates
  const categories = useMemo(() => {
    const cats = new Set<string>();
    REMINDER_TEMPLATES.forEach(t => cats.add(t.jenis));
    return ['ALL', ...Array.from(cats)];
  }, []);

  const filteredTemplates = useMemo(() => {
    return REMINDER_TEMPLATES.filter(t => {
      const matchCat = activeCategory === 'ALL' || t.jenis === activeCategory;
      const q = searchQuery.toLowerCase();
      const matchSearch =
        t.judul.toLowerCase().includes(q) ||
        t.jenis.toLowerCase().includes(q) ||
        t.isiWa.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [activeCategory, searchQuery]);

  // Rendered Message with variables
  const renderedWaText = useMemo(() => {
    if (!selectedTemplate) return '';
    let text = selectedTemplate.isiWa;
    text = text
      .replace(/\{NAMA_SATKER\}/g, customVars.namaSatker)
      .replace(/\{KODE_SATKER\}/g, customVars.kodeSatker)
      .replace(/\{NAMA_PIC\}/g, customVars.namaPic)
      .replace(/\{NILAI_IKPA\}/g, customVars.nilaiIkpa)
      .replace(/\{PREDIKAT\}/g, customVars.predikat)
      .replace(/\{CAPAIAN_OUTPUT\}/g, customVars.capaianOutput)
      .replace(/\{STATUS_OUTPUT\}/g, customVars.statusOutput)
      .replace(/\{PENYERAPAN\}/g, customVars.penyerapan)
      .replace(/\{DEVIASI_HAL3\}/g, customVars.deviasiHal3)
      .replace(/\{SISA_PAGU\}/g, customVars.sisaPagu)
      .replace(/\{BATAS_WAKTU\}/g, customVars.batasWaktu)
      .replace(/\{NO_SURAT\}/g, customVars.noSurat)
      .replace(/\{MASALAH_LIST\}/g, customVars.masalahList);
    return text;
  }, [selectedTemplate, customVars]);

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);

    if (showToast) {
      showToast({
        type: 'success',
        title: 'Template Berhasil Disalin! 📋',
        message: 'Teks pesan WhatsApp siap di-paste langsung ke grup WhatsApp Satker.'
      });
    }
  };

  const handleSatkerChange = (kd: string) => {
    const found = masterSatkers.find(m => m.kodeSatker === kd);
    if (found) {
      setCustomVars(prev => ({
        ...prev,
        kodeSatker: found.kodeSatker,
        namaSatker: found.namaSatker,
        namaPic: found.namaPic || 'Bapak/Ibu Pengelola Keuangan'
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-6xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-sky-500/10 dark:from-rose-950/40 dark:via-amber-950/40 dark:to-sky-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-rose-600 to-amber-500 text-white rounded-2xl shadow-md">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100">
                  Katalog Template Pesan Broadcast Siap Copy
                </h3>
                <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                  Format WhatsApp + Portal Referensi
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Kompilasi pengumuman &amp; notifikasi resmi lintas dashboard (IKPA, Output, UP/TUP, Sertifikasi, KKP, Portal Mandiri <strong className="text-rose-600 dark:text-rose-400 font-mono">anggaran-026.my.id</strong>).
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-2xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800">
          
          {/* Left Column: Template Catalog & Filters */}
          <div className="lg:col-span-5 p-5 space-y-4 flex flex-col bg-slate-50/50 dark:bg-slate-950/40">
            
            {/* Search Box */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari kata kunci template (misal: KKP, Output, UP)..."
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            {/* Category Badges */}
            <div className="flex flex-wrap gap-1.5">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeCategory === cat
                      ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/30'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  {cat === 'ALL' ? 'Semua Topik' : cat}
                </button>
              ))}
            </div>

            {/* Template List Cards */}
            <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[500px] pr-1">
              {filteredTemplates.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  Tidak ditemukan template yang cocok.
                </div>
              ) : (
                filteredTemplates.map(template => {
                  const isSelected = selectedTemplate.id === template.id;
                  return (
                    <div
                      key={template.id}
                      onClick={() => setSelectedTemplate(template)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-white dark:bg-slate-900 border-rose-500 shadow-md ring-2 ring-rose-500/20'
                          : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                          {template.jenis}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTemplate(template);
                            handleCopyText(template.isiWa, template.id);
                          }}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-rose-600 hover:text-white text-slate-700 dark:text-slate-300 transition-all flex items-center gap-1 cursor-pointer"
                          title="Salin langsung template ini"
                        >
                          {copiedId === template.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedId === template.id ? 'Tersalin' : 'Copy'}</span>
                        </button>
                      </div>

                      <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 line-clamp-2">
                        {template.judul}
                      </h4>

                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 font-mono">
                        {template.isiWa.slice(0, 100)}...
                      </p>
                    </div>
                  );
                })
              )}
            </div>

          </div>

          {/* Right Column: Live Formatter Preview & Copy Action */}
          <div className="lg:col-span-7 p-5 sm:p-6 space-y-5 flex flex-col justify-between bg-white dark:bg-slate-900">
            
            <div className="space-y-4">
              
              {/* Quick Satker Picker */}
              {masterSatkers.length > 0 && (
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-sky-500" />
                    <span className="font-bold text-slate-700 dark:text-slate-300">Pilih Satker Contoh Otomatis:</span>
                  </div>
                  <select
                    value={customVars.kodeSatker}
                    onChange={(e) => handleSatkerChange(e.target.value)}
                    className="p-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs focus:ring-1 focus:ring-rose-500"
                  >
                    {masterSatkers.slice(0, 60).map(m => (
                      <option key={m.kodeSatker} value={m.kodeSatker}>
                        [{m.kodeSatker}] {m.namaSatker.slice(0, 35)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Title & Badge */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider block">
                    KATEGORI: {selectedTemplate.jenis}
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">
                    {selectedTemplate.judul}
                  </h3>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleCopyText(renderedWaText, 'main-btn')}
                    className="bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-black text-xs px-5 py-2.5 rounded-2xl shadow-lg shadow-rose-600/30 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                  >
                    {copiedId === 'main-btn' ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedId === 'main-btn' ? 'Berhasil Tersalin! 📋' : 'Salin Pesan WhatsApp (1-Klik)'}</span>
                  </button>
                </div>
              </div>

              {/* WhatsApp Mockup Preview Box */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                  <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <MessageSquare className="w-4 h-4" />
                    Preview Tampilan Pesan WhatsApp (Siap Kirim):
                  </span>
                  <span className="font-mono text-[11px] text-slate-400">
                    Tautan Aktif: anggaran-026.my.id
                  </span>
                </div>

                <div className="bg-[#e5ddd5] dark:bg-slate-950 p-4 sm:p-5 rounded-3xl border border-slate-300 dark:border-slate-800 shadow-inner max-h-[360px] overflow-y-auto">
                  <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-md text-xs font-sans text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap select-text border border-emerald-500/20">
                    {renderedWaText}
                  </div>
                </div>
              </div>

            </div>

            {/* Quick Share to WA Web */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                <Globe className="w-4 h-4 text-sky-500" />
                <span>Portal Resmi KPPN 026: <strong>https://anggaran-026.my.id</strong></span>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(renderedWaText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Buka Langsung di WhatsApp Web</span>
                </a>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
