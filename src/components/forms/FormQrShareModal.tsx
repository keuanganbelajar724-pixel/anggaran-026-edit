import React, { useState } from 'react';
import { 
  QrCode, 
  Copy, 
  Check, 
  ExternalLink, 
  X, 
  Share2, 
  MessageSquare, 
  Printer, 
  Sparkles,
  Building2,
  ShieldCheck
} from 'lucide-react';
import { KppnForm } from '../../types/form';

interface FormQrShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: KppnForm;
  appBaseUrl?: string;
}

export const FormQrShareModal: React.FC<FormQrShareModalProps> = ({
  isOpen,
  onClose,
  form,
  appBaseUrl = window.location.origin
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedWa, setCopiedWa] = useState(false);

  if (!isOpen) return null;

  // Construct shareable link targeting this specific form
  const formShareUrl = `${appBaseUrl}/?tab=form_survey&formId=${encodeURIComponent(form.id)}`;
  const qrCodeApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=12&data=${encodeURIComponent(formShareUrl)}`;

  const waBroadcastText = `*KUESIONER RESMI KPPN SEMARANG I*\n\nYth. Bapak/Ibu Kuasa Pengguna Anggaran / Pejabat Perbendaharaan Satker Mitra Kerja KPPN Semarang I,\n\nDalam rangka evaluasi dan peningkatan mutu pelayanan perbendaharaan, kami memohon kesediaan Bapak/Ibu untuk meluangkan waktu 2 menit mengisi kuesioner:\n\n📋 *${form.title}*\n🔗 *Tautan Survei:* ${formShareUrl}\n\nSeluruh masukan Bapak/Ibu sangat berharga untuk perbaikan layanan prima tanpa biaya / Rp0. Terima kasih atas partisipasi dan kerjasamanya.\n\n_Seksi Manajemen Satker & Kepatuhan Internal (MSKI)_\n*KPPN Tipe A1 Semarang I*`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(formShareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyWa = () => {
    navigator.clipboard.writeText(waBroadcastText);
    setCopiedWa(true);
    setTimeout(() => setCopiedWa(false), 2500);
  };

  const handlePrintDeskQr = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Stiker QR Kuesioner Meja CSO - ${form.title}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; text-align: center; padding: 40px; }
            .card { border: 3px solid #0284c7; border-radius: 24px; padding: 30px; max-width: 450px; margin: 0 auto; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
            h2 { color: #0369a1; margin: 0 0 8px 0; font-size: 20px; font-weight: 900; }
            h3 { color: #0f172a; margin: 0 0 16px 0; font-size: 16px; }
            p { color: #475569; font-size: 12px; margin: 4px 0; }
            img { width: 220px; height: 220px; margin: 15px 0; border: 2px dashed #cbd5e1; border-radius: 16px; padding: 8px; }
            .badge { display: inline-block; background: #e0f2fe; color: #0284c7; padding: 4px 12px; border-radius: 999px; font-weight: 800; font-size: 11px; text-transform: uppercase; }
          </style>
        </head>
        <body>
          <div class="card">
            <span class="badge">Kemenkeu • KPPN Semarang I</span>
            <h2>SCAN QR UNTUK MENGISI KUESIONER</h2>
            <h3>${form.title}</h3>
            <img src="${qrCodeApiUrl}" alt="QR Code" />
            <p><strong>Arahkan kamera smartphone Anda ke QR Code di atas</strong></p>
            <p>Masukan Anda mewujudkan Pelayanan Prima &amp; Zona Integritas Bebas Korupsi</p>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden text-slate-900 dark:text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/20 text-sky-600 dark:text-sky-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-tight">
                Bagikan Kuesioner &amp; QR Code Meja CSO
              </h3>
              <p className="text-[11px] text-slate-400">
                Akses instan satker via smartphone, WhatsApp, atau scan kamera
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          
          {/* Card Info */}
          <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/60 flex items-start gap-3">
            <div className="p-2 bg-sky-600 text-white rounded-xl shrink-0 mt-0.5">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-sky-700 dark:text-sky-300">
                Formulir Aktif
              </span>
              <h4 className="text-sm font-black text-slate-900 dark:text-white truncate">
                {form.title}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                {form.description}
              </p>
            </div>
          </div>

          {/* QR Code & Printable Desk Stand */}
          <div className="flex flex-col sm:flex-row items-center gap-5 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-center sm:text-left">
            <div className="w-36 h-36 bg-white p-2 rounded-2xl border-2 border-slate-300 shadow-sm shrink-0 flex items-center justify-center">
              <img 
                src={qrCodeApiUrl} 
                alt="QR Code Survei" 
                className="w-full h-full object-contain"
                crossOrigin="anonymous"
              />
            </div>

            <div className="space-y-2 flex-1 min-w-0">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-black uppercase">
                <ShieldCheck className="w-3 h-3" />
                <span>QR Resmi KPPN</span>
              </div>
              <h5 className="text-xs font-black text-slate-800 dark:text-slate-200">
                Stiker Meja CSO &amp; Front Office
              </h5>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Cetak stiker QR Code ini untuk diletakkan di loket Customer Service Officer (CSO) agar satker dapat langsung scan kuesioner seusai pelayanan.
              </p>
              
              <button
                type="button"
                onClick={handlePrintDeskQr}
                className="px-3.5 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Stand / Stiker QR</span>
              </button>
            </div>
          </div>

          {/* Direct Link Copier */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Tautan Formulir Langsung:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={formShareUrl}
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-xs font-mono text-slate-700 dark:text-slate-300 select-all"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                  copiedLink
                    ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                    : 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-600/20'
                }`}
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Tersalin!' : 'Salin Tautan'}</span>
              </button>
            </div>
          </div>

          {/* WhatsApp Broadcast Copier */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                <span>Format Pesan Broadcast WhatsApp Satker:</span>
              </label>
              <button
                type="button"
                onClick={handleCopyWa}
                className="text-[11px] font-black text-emerald-600 hover:text-emerald-500 flex items-center gap-1 cursor-pointer"
              >
                {copiedWa ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedWa ? 'Pesan Tersalin!' : 'Salin Teks WA'}</span>
              </button>
            </div>

            <textarea
              readOnly
              rows={4}
              value={waBroadcastText}
              className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[11px] text-slate-700 dark:text-slate-300 font-mono leading-relaxed"
            />
          </div>

        </div>

      </div>
    </div>
  );
};
