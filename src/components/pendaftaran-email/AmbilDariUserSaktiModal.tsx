import React, { useState } from 'react';
import { UserSaktiRecord, PegawaiEmailRecord } from '../../types';
import { Users, CheckSquare, Square, X, ArrowDownRight, Search } from 'lucide-react';

interface AmbilDariUserSaktiModalProps {
  isOpen: boolean;
  onClose: () => void;
  usersSakti: UserSaktiRecord[];
  kodeKppn: string;
  kodeSatker: string;
  existingEmailNips: Set<string>;
  onImport: (newRecords: PegawaiEmailRecord[]) => void;
}

export const AmbilDariUserSaktiModal: React.FC<AmbilDariUserSaktiModalProps> = ({
  isOpen,
  onClose,
  usersSakti,
  kodeKppn,
  kodeSatker,
  existingEmailNips,
  onImport
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [defaultStatus, setDefaultStatus] = useState<1 | 2 | 3 | 4 | 5>(3); // 3=PNS default

  if (!isOpen) return null;

  const filteredUsers = usersSakti.filter(u => {
    const q = searchTerm.toLowerCase();
    const nama = (u.namaLengkap || '').toLowerCase();
    const nip = (u.nip || '').replace(/\D/g, '');
    const nik = (u.nik || '').replace(/\D/g, '');
    return nama.includes(q) || nip.includes(q) || nik.includes(q);
  });

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredUsers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredUsers.map(u => u.id)));
    }
  };

  const handleExecuteImport = () => {
    const usersToImport = usersSakti.filter(u => selectedIds.has(u.id));
    const newRecords: PegawaiEmailRecord[] = usersToImport.map(u => ({
      id: `email-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`,
      kodeKppn: kodeKppn || '136',
      kodeSatker,
      nama: u.namaLengkap || '',
      nip: (u.nip || '').replace(/\D/g, ''),
      nik: (u.nik || '').replace(/\D/g, ''),
      status: defaultStatus,
      jabatan: u.jabatan || u.peranJabatan || 'Pengguna SAKTI',
      keterangan: 'Diimpor dari User SAKTI'
    }));

    onImport(newRecords);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Ambil Data dari Pendaftaran User SAKTI
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pilih pengguna SAKTI untuk langsung didaftarkan ke permohonan email Kemenkeu
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3 bg-white dark:bg-slate-900">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari nama, NIP, atau NIK..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 whitespace-nowrap">Status Kepegawaian:</span>
              <select
                value={defaultStatus}
                onChange={(e) => setDefaultStatus(Number(e.target.value) as any)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
              >
                <option value={1}>1 = TNI</option>
                <option value={2}>2 = POLRI</option>
                <option value={3}>3 = PNS</option>
                <option value={4}>4 = PPNPN</option>
                <option value={5}>5 = P3K</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <button
              type="button"
              onClick={handleSelectAll}
              className="font-semibold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1.5 cursor-pointer"
            >
              {selectedIds.size === filteredUsers.length && filteredUsers.length > 0 ? (
                <CheckSquare className="w-4 h-4" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              <span>Pilih Semua ({filteredUsers.length} orang)</span>
            </button>
            <span className="text-slate-500">
              {selectedIds.size} dipilih
            </span>
          </div>
        </div>

        {/* User list */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2">
          {filteredUsers.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Tidak ada data user SAKTI yang tersedia untuk diimpor.
            </div>
          ) : (
            filteredUsers.map(u => {
              const isSelected = selectedIds.has(u.id);
              const cleanNip = (u.nip || '').replace(/\D/g, '');
              const isAlreadyInEmail = existingEmailNips.has(cleanNip);

              return (
                <div
                  key={u.id}
                  onClick={() => handleToggleSelect(u.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-teal-50/70 dark:bg-teal-950/40 border-teal-300 dark:border-teal-800'
                      : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-teal-600 dark:text-teal-400">
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white text-xs">
                          {u.namaLengkap}
                        </span>
                        {isAlreadyInEmail && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400">
                            Sudah Ada
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 text-[11px] text-slate-500 font-mono mt-0.5">
                        <span>NIP: {u.nip || '-'}</span>
                        <span>NIK: {u.nik || '-'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right text-[11px] text-slate-500">
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {u.peranJabatan || 'Operator'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {selectedIds.size} pegawai siap ditambahkan ke permohonan email.
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleExecuteImport}
              disabled={selectedIds.size === 0}
              className="px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>Impor ({selectedIds.size}) Pegawai</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
