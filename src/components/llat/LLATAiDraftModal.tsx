import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Bot, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  RefreshCw,
  Clock
} from 'lucide-react';
import { LLATEvent } from '../../types/llat';

interface LLATAiDraftModalProps {
  onClose: () => void;
  onApplyDrafts: (draftEvents: LLATEvent[]) => void;
  currentYear: number;
  existingCount: number;
}

export const LLATAiDraftModal: React.FC<LLATAiDraftModalProps> = ({
  onClose,
  onApplyDrafts,
  currentYear,
  existingCount
}) => {
  const [inputText, setInputText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [generatedDrafts, setGeneratedDrafts] = useState<LLATEvent[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const sampleTemplate = `Perdirjen Perbendaharaan Pedoman LLAT TA ${currentYear}:
1. Batas Pendaftaran Kontrak BAST s.d. 30 November diajukan paling lambat 4 Desember ${currentYear} pukul 17:00 WIB. Kategori: Kontrak. Prioritas: Penting.
2. Batas Pengajuan SPM-LS Gaji Induk Januari tahun berikutnya disampaikan paling lambat 8 Desember ${currentYear} pukul 17:00 WIB. Kategori: Gaji. Prioritas: Kritis.
3. Batas Pengajuan SPM-TUP dan GUP Akhir Tahun diajukan paling lambat 15 Desember ${currentYear} pukul 17:00 WIB. Kategori: UP/TUP. Prioritas: Kritis.
4. Batas SPM-LS Kontraktual dengan Jaminan Bank (Bank Garansi) diajukan paling lambat 21 Desember ${currentYear} pukul 17:00 WIB. Kategori: Kontrak. Prioritas: Kritis.
5. Batas Penyetoran Sisa Kas UP/TUP Tunai ke Kas Negara paling lambat 28 Desember ${currentYear} pukul 17:00 WIB. Kategori: UP/TUP. Prioritas: Kritis.`;

  const handleAnalyzeText = async () => {
    if (!inputText.trim()) {
      setErrorMsg('Masukkan teks ringkasan peraturan atau petunjuk LLAT terlebih dahulu.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      // Send to server Gemini API or use smart extraction rule
      let parsedEvents: any[] = [];
      const resp = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Analisis teks panduan/peraturan LLAT (Langkah-Langkah Akhir Tahun) berikut untuk Tahun Anggaran ${currentYear}.
Ekstrak daftar kegiatan, tanggal batas, jam batas, kategori, dan tingkat prioritas (KRITIS/PENTING/NORMAL).
Wajib berikan format JSON murni:
[
  {
    "kode_kegiatan": "LLAT-AI-01",
    "nama_kegiatan": "...",
    "kategori": "Gaji|SPM|Kontrak|UP/TUP|Rekonsiliasi|Pelaporan|BMN|Hibah|Lainnya",
    "deskripsi": "...",
    "tanggal_mulai": "${currentYear}-12-01",
    "tanggal_batas": "YYYY-MM-DD",
    "jam_batas": "17:00",
    "prioritas": "KRITIS|PENTING|NORMAL",
    "dasar_hukum": "Perdirjen LLAT ${currentYear}",
    "nomor_peraturan": "PER-LLAT-${currentYear}"
  }
]
Teks:
${inputText}`
        })
      });

      if (resp.ok) {
        const json = await resp.json();
        const rawContent = json.text || json.content || '';
        // Extract json array block
        const match = rawContent.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (match) {
          parsedEvents = JSON.parse(match[0]);
        }
      }
      
      // Fallback parser if API doesn't return or isn't configured
      if (!parsedEvents || parsedEvents.length === 0) {
        // Smart regex extractor for dates and lines
        const lines = inputText.split('\n').filter(l => l.trim().length > 5);
        parsedEvents = lines.map((line, idx) => {
          // Detect dates like "8 Desember", "2026-12-08", etc.
          let dateStr = `${currentYear}-12-15`;
          const m1 = line.match(/(\d{1,2})\s+(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)/i);
          if (m1) {
            const day = String(m1[1]).padStart(2, '0');
            const monthNames = ['januari', 'februari', 'maret', 'april', 'mei', 'juni', 'juli', 'agustus', 'september', 'oktober', 'november', 'desember'];
            const mIndex = monthNames.indexOf(m1[2].toLowerCase());
            if (mIndex >= 0) {
              const yearTarget = mIndex === 0 ? currentYear + 1 : currentYear;
              dateStr = `${yearTarget}-${String(mIndex + 1).padStart(2, '0')}-${day}`;
            }
          }

          let prio: any = 'NORMAL';
          if (line.toLowerCase().includes('kritis') || line.toLowerCase().includes('gaji') || line.toLowerCase().includes('nihil')) prio = 'KRITIS';
          else if (line.toLowerCase().includes('penting') || line.toLowerCase().includes('kontrak') || line.toLowerCase().includes('tup')) prio = 'PENTING';

          let kat = 'SPM';
          if (line.toLowerCase().includes('gaji')) kat = 'Gaji';
          else if (line.toLowerCase().includes('kontrak')) kat = 'Kontrak';
          else if (line.toLowerCase().includes('up') || line.toLowerCase().includes('tup')) kat = 'UP/TUP';
          else if (line.toLowerCase().includes('rekon')) kat = 'Rekonsiliasi';
          else if (line.toLowerCase().includes('lpj') || line.toLowerCase().includes('lapor')) kat = 'Pelaporan';

          return {
            kode_kegiatan: `LLAT-AI-${String(idx + 1).padStart(2, '0')}`,
            nama_kegiatan: line.replace(/^\d+[\.\-\)]\s*/, '').slice(0, 80),
            kategori: kat,
            deskripsi: line,
            tanggal_mulai: `${currentYear}-12-01`,
            tanggal_batas: dateStr,
            jam_batas: '17:00',
            prioritas: prio,
            dasar_hukum: `Dokumen LLAT ${currentYear}`,
            nomor_peraturan: `PER-LLAT-${currentYear}`
          };
        });
      }

      const formattedList: LLATEvent[] = parsedEvents.map((pe, idx) => ({
        llat_id: `llat-ai-${Date.now()}-${idx}`,
        tahun_anggaran: currentYear,
        kode_kegiatan: pe.kode_kegiatan || `LLAT-AI-${String(idx + 1).padStart(2, '0')}`,
        nama_kegiatan: pe.nama_kegiatan || `Kegiatan AI Draft ${idx + 1}`,
        kategori: pe.kategori || 'SPM',
        deskripsi: pe.deskripsi || '',
        tanggal_mulai: pe.tanggal_mulai || `${currentYear}-12-01`,
        tanggal_batas: pe.tanggal_batas || `${currentYear}-12-15`,
        jam_batas: pe.jam_batas || '17:00',
        timezone: 'WIB',
        status: 'BERJALAN',
        status_mode: 'AUTO',
        prioritas: pe.prioritas || 'NORMAL',
        target_pengguna: ['SEMUA_SATKER'],
        dasar_hukum: pe.dasar_hukum || `Perdirjen Perbendaharaan LLAT ${currentYear}`,
        nomor_peraturan: pe.nomor_peraturan || `PER-LLAT-${currentYear}`,
        urutan: existingCount + idx + 1,
        is_active: true,
        publikasi: 'DRAFT', // Always DRAFT as requested
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        version: 1
      }));

      setGeneratedDrafts(formattedList);
      setIsProcessing(false);
    } catch (e: any) {
      console.error('AI Draft Generation error:', e);
      setIsProcessing(false);
      setErrorMsg('Gagal menyusun draft dengan AI: ' + (e.message || 'Periksa koneksi sistem.'));
    }
  };

  const handleApply = () => {
    if (generatedDrafts.length === 0) return;
    onApplyDrafts(generatedDrafts);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 dark:from-purple-950/40 dark:via-indigo-950/30 dark:to-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>AI Bantu Susun Kalender LLAT</span>
                <Sparkles className="w-4 h-4 text-amber-500" />
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Otomatis membaca naskah peraturan &amp; menyusun usulan draft kegiatan
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

        <div className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 text-rose-800 dark:text-rose-200 font-bold">
              {errorMsg}
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                Salin Teks Perdirjen / Ringkasan Jadwal LLAT:
              </label>
              <button
                type="button"
                onClick={() => setInputText(sampleTemplate)}
                className="text-purple-600 hover:underline font-bold"
              >
                Gunakan Contoh Teks
              </button>
            </div>
            <textarea
              rows={6}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Tempelkan paragraf petunjuk batas akhir SPM, kontrak, TUP, LPJ dari Surat Edaran / Peraturan Perbendaharaan di sini..."
              className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-[11px]"
            />
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-[11px]">
            <p className="font-bold">Ketentuan Integritas Data (Section 37):</p>
            <p>Hasil generate AI akan berstatus <strong>DRAFT</strong>. Anda sebagai Admin dapat meninjau, mengubah tanggal, dan menyetujui sebelum mempublikasikan ke Satker.</p>
          </div>

          {generatedDrafts.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="font-black text-slate-900 dark:text-white block">
                Hasil Deteksi AI ({generatedDrafts.length} Kegiatan Diusulkan):
              </span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {generatedDrafts.map((d, i) => (
                  <div key={i} className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between text-[11px]">
                    <div className="min-w-0 pr-2">
                      <span className="font-mono font-bold mr-1.5 text-purple-600">{d.kode_kegiatan}</span>
                      <span className="font-extrabold truncate">{d.nama_kegiatan}</span>
                    </div>
                    <span className="font-mono text-rose-600 font-bold shrink-0">{d.tanggal_batas}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs"
          >
            Batal
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isProcessing || !inputText.trim()}
              onClick={handleAnalyzeText}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-black text-xs shadow-md flex items-center gap-1.5"
            >
              {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>{isProcessing ? 'Menganalisis Naskah...' : 'Analisis & Buat Draft'}</span>
            </button>

            {generatedDrafts.length > 0 && (
              <button
                type="button"
                onClick={handleApply}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Simpan {generatedDrafts.length} Draft Kegiatan</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
