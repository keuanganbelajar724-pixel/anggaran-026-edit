import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  FileText, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  Clock, 
  Users, 
  ShieldCheck, 
  Eye, 
  Plus, 
  ArrowRight, 
  Download, 
  Calendar, 
  Search,
  Building,
  Lock,
  Sparkles,
  AlertCircle,
  X,
  Shield,
  FileCheck
} from 'lucide-react';
import { PendaftaranUserSaktiDraft, MasterSatker, UserSaktiRecord } from '../../types';
import { formatNIPDisplay } from '../../utils/pendaftaranSaktiValidation';
import { MASTER_ROLE_MAP } from '../../data/masterRoleSakti';

interface RiwayatPembentukanUserViewProps {
  satker: MasterSatker;
  historyDrafts: PendaftaranUserSaktiDraft[];
  onLoadDraft: (draft: PendaftaranUserSaktiDraft) => void;
  onDeleteHistory: (draftId: string) => void;
  onExportExcel: (draft: PendaftaranUserSaktiDraft) => void;
  onExportPDF: (draft: PendaftaranUserSaktiDraft) => void;
  onCreateNewForm: () => void;
  isAdminAuthenticated?: boolean;
}

export const RiwayatPembentukanUserView: React.FC<RiwayatPembentukanUserViewProps> = ({
  satker,
  historyDrafts = [],
  onLoadDraft,
  onDeleteHistory,
  onExportExcel,
  onExportPDF,
  onCreateNewForm,
  isAdminAuthenticated = false
}) => {
  const [selectedDraftForDetail, setSelectedDraftForDetail] = useState<PendaftaranUserSaktiDraft | null>(null);
  const [searchHistory, setSearchHistory] = useState('');
  const [showMaskedNip, setShowMaskedNip] = useState(false);

  // Filter history for current Satker only (PRIVACY ISOLATION)
  const satkerHistory = historyDrafts.filter(h => h.kodeSatker === satker.kodeSatker);

  const filteredHistory = satkerHistory.filter(h => {
    const q = searchHistory.toLowerCase().trim();
    if (!q) return true;
    return (
      (h.judulPengajuan && h.judulPengajuan.toLowerCase().includes(q)) ||
      h.createdAt.toLowerCase().includes(q) ||
      h.users.some(u => 
        u.namaLengkap.toLowerCase().includes(q) || 
        u.nip.includes(q) ||
        u.roles.some(r => r.toLowerCase().includes(q))
      )
    );
  });

  const formatDate = (isoString?: string) => {
    if (!isoString) return '-';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) + ' WIB';
    } catch (e) {
      return isoString;
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Riwayat Module Header */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
              <Lock className="w-2.5 h-2.5" />
              Arsip Privat Satker
            </span>
            <span className="text-xs font-mono font-bold text-slate-500">
              Kode: {satker.kodeSatker}
            </span>
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            📜 Riwayat Pembentukan &amp; Registrasi User SAKTI
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Daftar pengajuan dan arsip pendaftaran user SAKTI yang pernah dibuat untuk <strong>{satker.namaSatker}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onCreateNewForm}
            className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-md shadow-teal-600/20 transition-all cursor-pointer flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Formulir Pendaftaran Baru</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      {satkerHistory.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama pegawai, NIP, atau peran..."
              value={searchHistory}
              onChange={(e) => setSearchHistory(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <span>Total Arsip: <strong>{satkerHistory.length}</strong> Riwayat</span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {satkerHistory.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto border border-teal-200 dark:border-teal-800">
            <FileCheck className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h4 className="text-base font-black text-slate-900 dark:text-white">
              Belum Ada Riwayat Pendaftaran
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Satker <strong>{satker.namaSatker}</strong> belum memiliki arsip pendaftaran user SAKTI. Formulir yang Anda simpan atau ekspor akan otomatis tercatat dan tersimpan secara privat di sini.
            </p>
          </div>
          <button
            type="button"
            onClick={onCreateNewForm}
            className="px-5 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-lg shadow-teal-600/25 transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Mulai Buat Formulir Sekarang</span>
          </button>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-400">
          <p className="text-xs font-semibold">Tidak ada riwayat yang sesuai dengan pencarian.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredHistory.map((item) => {
            const totalRoles = item.users.reduce((acc, u) => acc + (u.roles?.length || 0), 0);
            const isExported = item.status === 'EXPORTED' || Boolean(item.exportedAt);

            return (
              <div 
                key={item.id}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all space-y-4"
              >
                {/* Header Card */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Status Badge */}
                      {isExported ? (
                        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Dokumen Resmi Terekspor
                        </span>
                      ) : item.status === 'VALID' ? (
                        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-indigo-600" />
                          Siap Ekspor (Valid)
                        </span>
                      ) : (
                        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-600" />
                          Draft
                        </span>
                      )}

                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(item.updatedAt || item.createdAt)}
                      </span>
                    </div>

                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                      {item.judulPengajuan || `Pendaftaran User SAKTI (${item.users.length} Pegawai)`}
                    </h4>
                  </div>

                  {/* Top Stats */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-teal-600" />
                      {item.users.length} Pegawai
                    </span>
                    <span className="px-2.5 py-1 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 text-xs font-bold border border-teal-200 dark:border-teal-800 flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5" />
                      {totalRoles} Role
                    </span>
                  </div>
                </div>

                {/* User List Preview */}
                <div className="space-y-2">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Daftar Pegawai &amp; Peran Terdaftar:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {item.users.slice(0, 6).map((u, idx) => (
                      <div 
                        key={u.id || idx}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-slate-900 dark:text-white truncate">
                            {u.namaLengkap}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 shrink-0">
                            {formatNIPDisplay(u.nip)}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {u.roles.map(r => (
                            <span 
                              key={r}
                              className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 border border-slate-200 dark:border-slate-700"
                              title={MASTER_ROLE_MAP[r]?.deskripsi}
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                    {item.users.length > 6 && (
                      <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-xs font-bold text-slate-500">
                        +{item.users.length - 6} Pegawai Lainnya
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedDraftForDetail(item)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>Lihat Rincian</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onLoadDraft(item)}
                      className="px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                      title="Muat data ini kembali ke formulir aktif untuk diedit atau diperbarui"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Muat ke Editor Aktif</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onExportExcel(item)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                      title="Unduh Excel 2-sheet resmi"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Excel</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onExportPDF(item)}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                      title="Unduh PDF Resmi dengan Kop & Nilai IKPA"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>PDF</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteHistory(item.id)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                      title="Hapus riwayat ini"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Detail User SAKTI History */}
      {selectedDraftForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 bg-gradient-to-r from-slate-900 to-teal-950 text-white flex items-center justify-between border-b border-teal-500/20 shrink-0">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-400/30">
                  Rincian Riwayat Pembentukan User
                </span>
                <h3 className="text-base font-black text-white">
                  {selectedDraftForDetail.judulPengajuan || 'Formulir Registrasi SAKTI'}
                </h3>
                <p className="text-xs text-slate-300">
                  {selectedDraftForDetail.namaSatker} ({selectedDraftForDetail.kodeSatker}) • {formatDate(selectedDraftForDetail.updatedAt)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedDraftForDetail(null)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Table of Users */}
            <div className="p-4 flex-1 overflow-y-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase">
                    <th className="py-2.5 px-3">No</th>
                    <th className="py-2.5 px-3">Nama Pegawai</th>
                    <th className="py-2.5 px-3">NIP / NIK</th>
                    <th className="py-2.5 px-3">Email &amp; No HP</th>
                    <th className="py-2.5 px-3">Peran SAKTI</th>
                    <th className="py-2.5 px-3">SK Penetapan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {selectedDraftForDetail.users.map((u, i) => (
                    <tr key={u.id || i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-bold text-slate-400">{i + 1}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">{u.namaLengkap}</td>
                      <td className="py-2.5 px-3 font-mono">
                        <div>{formatNIPDisplay(u.nip)}</div>
                        {u.nik && <div className="text-[10px] text-slate-400">NIK: {u.nik}</div>}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                        <div>{u.email}</div>
                        <div className="text-[10px] text-slate-400">{u.noHp}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {u.roles.map(r => (
                            <span key={r} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                              {r}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                        <div className="font-semibold">{u.nomorSk || '-'}</div>
                        <div className="text-[10px]">{u.tanggalSk || '-'}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="text-xs text-slate-500">
                Penetapan KPA: <strong>{selectedDraftForDetail.namaKpa || '-'}</strong> ({selectedDraftForDetail.tempatPenetapan || 'Semarang'})
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onExportExcel(selectedDraftForDetail);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Unduh Excel</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onExportPDF(selectedDraftForDetail);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Unduh PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onLoadDraft(selectedDraftForDetail);
                    setSelectedDraftForDetail(null);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Muat ke Editor</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
