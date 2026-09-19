import React, { useState, useMemo } from 'react';
import { UserSaktiRecord } from '../../types';
import { MASTER_ROLE_MAP } from '../../data/masterRoleSakti';
import { Search, UserCheck, X, Users, BadgeCheck, AlertCircle } from 'lucide-react';

interface UserSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserSaktiRecord[];
  onSelectUser: (user: UserSaktiRecord) => void;
  namaSatker: string;
  kodeSatker: string;
}

export const UserSelectorModal: React.FC<UserSelectorModalProps> = ({
  isOpen,
  onClose,
  users,
  onSelectUser,
  namaSatker,
  kodeSatker
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return users;
    return users.filter(u => {
      const nama = (u.namaLengkap || '').toLowerCase();
      const nip = (u.nip || '').replace(/\D/g, '');
      const nik = (u.nik || '').replace(/\D/g, '');
      const jabatan = (u.jabatan || '').toLowerCase();
      const rolesStr = (u.roles || []).join(' ').toLowerCase();

      return nama.includes(q) || nip.includes(q) || nik.includes(q) || jabatan.includes(q) || rolesStr.includes(q);
    });
  }, [users, searchTerm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Pilih User SAKTI Terdaftar</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold">
                  {users.length} Pegawai
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {kodeSatker} - {namaSatker}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari berdasarkan Nama, NIP (18 digit), atau NIK (16 digit)..."
              className="w-full pl-9 pr-8 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              autoFocus
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* User List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2.5">
          {users.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-amber-500 mx-auto opacity-75" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Belum Ada Data User SAKTI Tersimpan
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Satker ini belum memiliki pengguna SAKTI yang tersimpan di Tab 1 (Pendaftaran User SAKTI). Silakan rekam atau import pengguna di Tab 1 terlebih dahulu.
                </p>
              </div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
              Tidak ditemukan pegawai yang sesuai dengan kata kunci "{searchTerm}".
            </div>
          ) : (
            filteredUsers.map(user => {
              const rolesList = user.roles || [];
              return (
                <div
                  key={user.id}
                  onClick={() => {
                    onSelectUser(user);
                    onClose();
                  }}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/40 hover:border-indigo-300 dark:hover:border-indigo-800/80 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {user.namaLengkap}
                      </span>
                      {user.peranJabatan && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          {user.peranJabatan}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 font-mono">
                      <span>NIP: {user.nip || '-'}</span>
                      <span>NIK: {user.nik || '-'}</span>
                      {user.email && <span className="font-sans">✉ {user.email}</span>}
                    </div>

                    {/* Roles Badges */}
                    <div className="flex flex-wrap items-center gap-1 pt-0.5">
                      {rolesList.length === 0 ? (
                        <span className="text-[11px] text-amber-500 italic">Belum ada role SAKTI</span>
                      ) : (
                        rolesList.map(r => (
                          <span
                            key={r}
                            className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                          >
                            {MASTER_ROLE_MAP.get(r)?.roleName || r}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="sm:self-center shrink-0">
                    <button
                      type="button"
                      className="w-full sm:w-auto px-3.5 py-1.5 rounded-xl bg-indigo-600 group-hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors pointer-events-none"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Pilih User</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>Menampilkan {filteredUsers.length} dari {users.length} pengguna</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
