import React, { useState, useEffect } from 'react';
import {
  X,
  Bookmark,
  StickyNote,
  Plus,
  Trash2,
  Copy,
  Check,
  Tag,
  BookOpen,
  Sparkles,
  ArrowRight,
  Download
} from 'lucide-react';
import { useToast } from '../../ToastNotification';
import { playChimeSound } from '../../../utils/buletinSoundEffects';

export interface BuletinAnnotation {
  id: string;
  pageNum: number;
  category: 'Koreksi Data' | 'Catatan KPA' | 'Ide Redaksi' | 'Tindak Lanjut' | 'Umum';
  content: string;
  author: string;
  createdAt: string;
}

interface BuletinAnnotationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentPageNum: number;
  totalPages: number;
  onJumpToPage: (pageNum: number) => void;
  soundEnabled?: boolean;
}

export const BuletinAnnotationDrawer: React.FC<BuletinAnnotationDrawerProps> = ({
  isOpen,
  onClose,
  currentPageNum,
  totalPages,
  onJumpToPage,
  soundEnabled = true
}) => {
  const { addToast } = useToast();
  const [annotations, setAnnotations] = useState<BuletinAnnotation[]>([]);
  const [bookmarks, setBookmarks] = useState<number[]>([]);

  // New Note Form
  const [newCategory, setNewCategory] = useState<BuletinAnnotation['category']>('Catatan KPA');
  const [newContent, setNewContent] = useState<string>('');
  const [targetPage, setTargetPage] = useState<number>(currentPageNum);
  const [authorName, setAuthorName] = useState<string>('Reviewer KPPN');
  const [copiedAll, setCopiedAll] = useState<boolean>(false);

  // Sync targetPage when drawer opens
  useEffect(() => {
    setTargetPage(currentPageNum);
  }, [currentPageNum, isOpen]);

  // Load from localStorage
  useEffect(() => {
    try {
      const savedNotes = localStorage.getItem('warta_semarang_notes');
      if (savedNotes) {
        setAnnotations(JSON.parse(savedNotes));
      }
      const savedBookmarks = localStorage.getItem('warta_semarang_bookmarks');
      if (savedBookmarks) {
        setBookmarks(JSON.parse(savedBookmarks));
      }
    } catch (e) {
      console.warn(e);
    }
  }, []);

  // Save to localStorage
  const persistNotes = (updated: BuletinAnnotation[]) => {
    setAnnotations(updated);
    try {
      localStorage.setItem('warta_semarang_notes', JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }
  };

  const persistBookmarks = (updated: number[]) => {
    setBookmarks(updated);
    try {
      localStorage.setItem('warta_semarang_bookmarks', JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }
  };

  const handleAddAnnotation = () => {
    if (!newContent.trim()) {
      addToast('Isi catatan tidak boleh kosong!', 'warning');
      return;
    }

    const newNote: BuletinAnnotation = {
      id: Date.now().toString(),
      pageNum: targetPage,
      category: newCategory,
      content: newContent.trim(),
      author: authorName.trim() || 'Reviewer',
      createdAt: new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    const updated = [newNote, ...annotations];
    persistNotes(updated);
    setNewContent('');
    playChimeSound(soundEnabled);
    addToast(`Catatan berhasil ditambahkan pada Halaman ${targetPage}!`, 'success');
  };

  const handleDeleteAnnotation = (id: string) => {
    const updated = annotations.filter(a => a.id !== id);
    persistNotes(updated);
    addToast('Catatan dihapus.', 'info');
  };

  const toggleBookmark = (pageNum: number) => {
    let updated: number[];
    if (bookmarks.includes(pageNum)) {
      updated = bookmarks.filter(b => b !== pageNum);
      addToast(`Bookmark Halaman ${pageNum} dihapus.`, 'info');
    } else {
      updated = [...bookmarks, pageNum].sort((a, b) => a - b);
      playChimeSound(soundEnabled);
      addToast(`⭐ Halaman ${pageNum} ditandai sebagai bookmark!`, 'success');
    }
    persistBookmarks(updated);
  };

  const copyAllNotesToClipboard = () => {
    if (annotations.length === 0) {
      addToast('Belum ada catatan untuk disalin.', 'warning');
      return;
    }

    const digest = annotations
      .map(
        (a, i) =>
          `${i + 1}. [Hal ${a.pageNum}] [${a.category}] ${a.content} (Oleh: ${a.author}, ${a.createdAt})`
      )
      .join('\n\n');

    navigator.clipboard.writeText(`=== CATATAN REVIEW MAJALAH WARTA SEMARANG SATU ===\n\n${digest}`);
    setCopiedAll(true);
    playChimeSound(soundEnabled);
    addToast('Seluruh catatan berhasil disalin ke clipboard!', 'success');
    setTimeout(() => setCopiedAll(false), 2000);
  };

  if (!isOpen) return null;

  const categoryColorMap = {
    'Catatan KPA': 'bg-amber-400/20 text-amber-300 border-amber-400/40',
    'Koreksi Data': 'bg-red-400/20 text-red-300 border-red-400/40',
    'Ide Redaksi': 'bg-indigo-400/20 text-indigo-300 border-indigo-400/40',
    'Tindak Lanjut': 'bg-emerald-400/20 text-emerald-300 border-emerald-400/40',
    'Umum': 'bg-slate-400/20 text-slate-300 border-slate-400/40'
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-slate-900 border-l border-slate-700 shadow-2xl flex flex-col text-white animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
            <StickyNote className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white">Catatan &amp; Bookmark</h3>
            <span className="text-[10px] text-slate-400">Review &amp; Kolaborasi Edisi Majalah</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Bookmarks Strip */}
      <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-300 flex items-center gap-1.5">
            <Bookmark className="w-3.5 h-3.5 text-amber-400" />
            <span>Bookmark Halaman:</span>
          </span>
          <button
            onClick={() => toggleBookmark(currentPageNum)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
              bookmarks.includes(currentPageNum)
                ? 'bg-amber-400 text-slate-950 border-amber-400'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            {bookmarks.includes(currentPageNum) ? '★ Halaman Ini Ditandai' : '+ Tandai Hal Ini'}
          </button>
        </div>

        {bookmarks.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {bookmarks.map(num => (
              <button
                key={num}
                onClick={() => onJumpToPage(num)}
                className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-amber-400 hover:text-slate-950 border border-slate-700 text-amber-300 font-mono text-[10px] font-bold transition-colors"
              >
                Hal {num}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="p-4 overflow-y-auto flex-1 space-y-4">
        {/* Add Note Form */}
        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Catatan Baru</span>
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-400">Hal:</span>
              <select
                value={targetPage}
                onChange={e => setTargetPage(Number(e.target.value))}
                className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-xs font-mono text-amber-300"
              >
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={newCategory}
              onChange={e => setNewCategory(e.target.value as any)}
              className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200"
            >
              <option value="Catatan KPA">📌 Catatan KPA / Pimpinan</option>
              <option value="Koreksi Data">⚠️ Koreksi Data / Angka</option>
              <option value="Ide Redaksi">💡 Ide Liputan &amp; Redaksi</option>
              <option value="Tindak Lanjut">✅ Tindak Lanjut Rapat</option>
              <option value="Umum">📝 Catatan Umum</option>
            </select>
          </div>

          <textarea
            rows={3}
            value={newContent}
            onChange={e => setNewContent(e.target.value)}
            placeholder="Tuliskan masukan koreksi angka, kutipan penting, atau tindak lanjut..."
            className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />

          <div className="flex items-center justify-between gap-2">
            <input
              type="text"
              value={authorName}
              onChange={e => setAuthorName(e.target.value)}
              placeholder="Nama Anda"
              className="w-1/2 px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-[11px] text-slate-300"
            />
            <button
              onClick={handleAddAnnotation}
              className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1 shrink-0"
            >
              <span>Simpan</span>
            </button>
          </div>
        </div>

        {/* Notes List */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Daftar Catatan ({annotations.length})</span>
            {annotations.length > 0 && (
              <button
                onClick={copyAllNotesToClipboard}
                className="text-[11px] font-bold text-indigo-300 hover:text-indigo-200 flex items-center gap-1"
              >
                {copiedAll ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedAll ? 'Tersalin' : 'Salin Semua'}</span>
              </button>
            )}
          </div>

          {annotations.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              Belum ada catatan. Tambahkan catatan review untuk menandai revisi majalah.
            </div>
          ) : (
            annotations.map(note => (
              <div
                key={note.id}
                className="p-3 rounded-xl bg-slate-800/90 border border-slate-700 space-y-2 relative group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onJumpToPage(note.pageNum)}
                      className="px-2 py-0.5 rounded bg-slate-950 text-amber-300 font-mono font-bold text-[10px] hover:bg-amber-400 hover:text-slate-950 transition-colors"
                      title="Klik untuk loncat ke halaman ini"
                    >
                      Hal {note.pageNum}
                    </button>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${
                        categoryColorMap[note.category] || 'text-slate-300'
                      }`}
                    >
                      {note.category}
                    </span>
                  </div>

                  <button
                    onClick={() => handleDeleteAnnotation(note.id)}
                    className="opacity-40 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-400 transition-opacity"
                    title="Hapus catatan"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {note.content}
                </p>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-700/60">
                  <span>Oleh: {note.author}</span>
                  <span>{note.createdAt}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 bg-slate-950 border-t border-slate-800 text-center text-[10px] text-slate-500">
        Catatan tersimpan otomatis di perangkat Anda
      </div>
    </div>
  );
};
