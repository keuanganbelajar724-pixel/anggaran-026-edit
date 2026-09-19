import React, { useState, useMemo } from 'react';
import { UserSaktiRecord } from '../../types';
import { Search, UserCheck, X, Users, Check, Shield, Mail, Phone, FileText } from 'lucide-react';
import { MASTER_ROLE_MAP } from '../../data/masterRoleSakti';

interface PilihUserDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableUsers: UserSaktiRecord[];
  alreadySelectedUserIds: string[];
  onSelectUsers: (selectedUsers: UserSaktiRecord[]) => void;
}

export const PilihUserDataModal: React.FC<PilihUserDataModalProps> = ({
  isOpen,
  onClose,
  availableUsers,
  alreadySelectedUserIds,
  onSelectUsers
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [checkedUserIds, setCheckedUserIds] = useState<string[]>([]);

  // Filter users by search term (Nama, NIP, NIK, E-mail, No. HP, Roles)
  const filteredUsers = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return availableUsers;
    return availableUsers.filter(u => {
      const matchName = (u.namaLengkap || '').toLowerCase().includes(q);
      const matchNip = (u.nip || '').includes(q);
      const matchNik = (u.nik || '').includes(q);
      const matchEmail = (u.email || '').toLowerCase().includes(q);
      const matchPhone = (u.noHp || '').includes(q);
      const matchRole = (u.roles || []).some(r => r.toLowerCase().includes(q));
      return matchName || matchNip || matchNik || matchEmail || matchPhone || matchRole;
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
    const allSelected = selectable.length > 0 && selectable.every(id => checkedUserIds.includes(id));
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
            <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Pilih Pengguna SAKTI untuk Pemutakhiran Data</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Cari dan pilih pengguna dari master database Satker untuk memuat data saat ini ke dalam formulir
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
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Cari nama, NIP, NIK, email, no HP, atau role..."
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-teal-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <button
              type="button"
              onClick={handleSelectAllFiltered}
              className="text-xs text-teal-400 hover:text-teal-300 px-3 py-1.5 rounded-lg bg-teal-500/10 border border-teal-500/20 hover:bg-teal-500/20 transition-colors cursor-pointer"
            >
              Pilih / Batal Semua
            </button>
            <span className="text-xs text-slate-400">
              {checkedUserIds.length} dipilih
            </span>
          </div>
        </div>

        {/* User List */}
        <div className="p-4 overflow-y-auto space-y-2.5 flex-1 divide-y divide-slate-800/60">
          {filteredUsers.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-30 text-slate-500" />
              <p className="text-sm font-medium">Pengguna SAKTI tidak ditemukan</p>
              <p className="text-xs text-slate-500 mt-1">
                Silakan ubah kata kunci pencarian atau daftarkan pengguna baru terlebih dahulu.
              </p>
            </div>
          ) : (
            filteredUsers.map(user => {
              const isAlreadyAdded = alreadySelectedUserIds.includes(user.id);
              const isChecked = checkedUserIds.includes(user.id);

              return (
                <div
                  key={user.id}
                  onClick={() => !isAlreadyAdded && handleToggleCheck(user.id)}
                  className={`pt-2.5 first:pt-0 p-3 rounded-xl transition-all flex items-start gap-3.5 ${
                    isAlreadyAdded
                      ? 'opacity-50 bg-slate-950/40 cursor-not-allowed border border-slate-800/40'
                      : isChecked
                      ? 'bg-teal-950/30 border border-teal-500/40 cursor-pointer'
                      : 'hover:bg-slate-800/40 border border-transparent cursor-pointer'
                  }`}
                >
                  <div className="pt-0.5">
                    <input
                      type="checkbox"
                      checked={isChecked || isAlreadyAdded}
                      disabled={isAlreadyAdded}
                      onChange={() => !isAlreadyAdded && handleToggleCheck(user.id)}
                      className="rounded border-slate-700 text-teal-500 focus:ring-teal-500 bg-slate-950 h-4 w-4"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-semibold text-white truncate">
                        {user.namaLengkap}
                      </h4>
                      {isAlreadyAdded ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                          Sudah Masuk Formulir
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                          {user.roles?.length || 0} Role
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-400 mt-2">
                      <div>
                        <span className="text-slate-500">NIP:</span> {user.nip || '-'}
                      </div>
                      <div>
                        <span className="text-slate-500">NIK:</span> {user.nik || '-'}
                      </div>
                      <div className="truncate">
                        <span className="text-slate-500">E-mail:</span> {user.email || '-'}
                      </div>
                      <div>
                        <span className="text-slate-500">HP:</span> {user.noHp || '-'}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Shield className="w-3 h-3 text-teal-400" /> Peran Saat Ini:
                      </span>
                      {(user.roles || []).slice(0, 3).map(r => (
                        <span
                          key={r}
                          className="text-[10px] px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700 text-slate-300 font-mono"
                        >
                          {r}
                        </span>
                      ))}
                      {(user.roles || []).length > 3 && (
                        <span className="text-[10px] text-slate-500">
                          +{user.roles.length - 3} lainnya
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-850 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {checkedUserIds.length} pengguna terpilih untuk dimutakhirkan
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={checkedUserIds.length === 0}
              onClick={handleConfirm}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-teal-600 hover:bg-teal-500 text-white disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-teal-950 transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Muat Data ke Formulir ({checkedUserIds.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
