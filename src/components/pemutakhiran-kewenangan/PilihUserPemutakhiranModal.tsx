import React, { useState, useMemo } from 'react';
import { UserSaktiRecord } from '../../types';
import { Search, UserCheck, X, Users, Check, Shield } from 'lucide-react';
import { MASTER_ROLE_MAP } from '../../data/masterRoleSakti';

interface PilihUserPemutakhiranModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableUsers: UserSaktiRecord[];
  alreadySelectedUserIds: string[];
  onSelectUsers: (selectedUsers: UserSaktiRecord[]) => void;
}

export const PilihUserPemutakhiranModal: React.FC<PilihUserPemutakhiranModalProps> = ({
  isOpen,
  onClose,
  availableUsers,
  alreadySelectedUserIds,
  onSelectUsers
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [checkedUserIds, setCheckedUserIds] = useState<string[]>([]);

  // Filter users by search term
  const filteredUsers = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return availableUsers;
    return availableUsers.filter(u => {
      const matchName = (u.namaLengkap || '').toLowerCase().includes(q);
      const matchNip = (u.nip || '').includes(q);
      const matchNik = (u.nik || '').includes(q);
      const matchRole = (u.roles || []).some(r => r.toLowerCase().includes(q));
      return matchName || matchNip || matchNik || matchRole;
    });
  }, [availableUsers, searchTerm]);

  if (!isOpen) return null;

  const handleToggleCheck = (userId: string) => {
    setCheckedUserIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleSelectAllFiltered = () => {
    const selectable = filteredUsers
      .filter(u => !alreadySelectedUserIds.includes(u.id))
      .map(u => u.id);
    const allSelected = selectable.every(id => checkedUserIds.includes(id));
    if (allSelected) {
      setCheckedUserIds(prev => prev.filter(id => !selectable.includes(id)));
    } else {
      setCheckedUserIds(prev => Array.from(new Set([...prev, ...selectable])));
    }
  };

  const handleConfirm = () => {
    const usersToAdd = availableUsers.filter(u => checkedUserIds.includes(u.id));
    onSelectUsers(usersToAdd);
    setCheckedUserIds([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Pilih Pengguna SAKTI untuk Dimutakhirkan</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Pilih satu atau beberapa pengguna dari database Satker untuk dimasukkan ke Formulir Pemutakhiran Kewenangan
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Actions Bar */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-900/60 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Cari nama, NIK, NIP, atau role..."
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleSelectAllFiltered}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
            >
              Pilih / Batal Semua ({filteredUsers.length})
            </button>
            <span className="text-xs text-indigo-300 font-semibold px-2.5 py-1 bg-indigo-950/60 rounded-md border border-indigo-800/50">
              {checkedUserIds.length} Dipilih
            </span>
          </div>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 divide-y divide-slate-800/40">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">Tidak ada data pengguna yang cocok</p>
              <p className="text-xs mt-1 text-slate-600">Coba kata kunci pencarian yang lain</p>
            </div>
          ) : (
            filteredUsers.map(user => {
              const isAlreadyAdded = alreadySelectedUserIds.includes(user.id);
              const isChecked = checkedUserIds.includes(user.id);

              return (
                <div
                  key={user.id}
                  onClick={() => {
                    if (!isAlreadyAdded) handleToggleCheck(user.id);
                  }}
                  className={`pt-2.5 first:pt-0 pb-1 flex items-start gap-3 p-2.5 rounded-xl transition-all cursor-pointer ${
                    isAlreadyAdded
                      ? 'opacity-50 bg-slate-950/40 cursor-not-allowed border border-dashed border-slate-800'
                      : isChecked
                      ? 'bg-indigo-950/40 border border-indigo-500/40'
                      : 'hover:bg-slate-800/50 border border-transparent'
                  }`}
                >
                  <input
                    type="checkbox"
                    disabled={isAlreadyAdded}
                    checked={isChecked || isAlreadyAdded}
                    onChange={() => handleToggleCheck(user.id)}
                    className="mt-1 rounded-sm border-slate-700 text-indigo-600 focus:ring-indigo-500"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-white truncate">{user.namaLengkap}</span>
                      {isAlreadyAdded && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-semibold border border-slate-700">
                          Sudah di Daftar
                        </span>
                      )}
                      <span className="text-xs text-slate-400 font-mono">NIK: {user.nik || '-'}</span>
                      <span className="text-xs text-slate-500 font-mono">NIP: {user.nip || '-'}</span>
                    </div>

                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {(user.roles || []).map(r => {
                        const meta = MASTER_ROLE_MAP.get(r);
                        return (
                          <span
                            key={r}
                            className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono"
                          >
                            {meta?.roleName || r}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-850 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            {alreadySelectedUserIds.length} pengguna telah ada di form pemutakhiran
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={checkedUserIds.length === 0}
              onClick={handleConfirm}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Tambahkan ({checkedUserIds.length}) Pengguna</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
