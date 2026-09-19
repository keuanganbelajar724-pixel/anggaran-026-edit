import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  MASTER_ROLE_SAKTI_LIST,
  MASTER_ROLE_MAP,
  ROLE_CATEGORIES,
  sortRolesByMasterOrder,
  isRoleBluOnly,
  normalizeRoleCode,
  RoleCategory
} from '../../data/masterRoleSakti';
import { Search, Plus, X, ShieldAlert, Check, ChevronDown, Layers } from 'lucide-react';

interface RoleMultiSelectorProps {
  selectedRoles: string[];
  onChange: (roles: string[]) => void;
  isBLU: boolean;
  disabled?: boolean;
}

export const RoleMultiSelector: React.FC<RoleMultiSelectorProps> = ({
  selectedRoles,
  onChange,
  isBLU,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sorted list of current selections
  const sortedSelected = useMemo(() => {
    return sortRolesByMasterOrder(selectedRoles);
  }, [selectedRoles]);

  // Filtered available roles for selection
  const filteredRoles = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return MASTER_ROLE_SAKTI_LIST.filter(role => {
      // Category filter
      if (selectedCategory !== 'ALL' && role.category !== selectedCategory) {
        return false;
      }
      // Text search
      if (!q) return true;
      const matchCode = role.roleCode.toLowerCase().includes(q);
      const matchName = role.roleName.toLowerCase().includes(q);
      const matchDesc = role.description.toLowerCase().includes(q);
      return matchCode || matchName || matchDesc;
    });
  }, [searchTerm, selectedCategory]);

  const handleToggleRole = (roleCode: string) => {
    if (disabled) return;
    const norm = normalizeRoleCode(roleCode) || roleCode;
    const isSelected = selectedRoles.some(r => r === roleCode || normalizeRoleCode(r) === norm);

    if (isSelected) {
      onChange(sortRolesByMasterOrder(selectedRoles.filter(r => r !== roleCode && normalizeRoleCode(r) !== norm)));
      return;
    }

    const roleMeta = MASTER_ROLE_MAP.get(norm) || MASTER_ROLE_MAP.get(roleCode);

    // Check BLU requirement
    if (!isBLU && isRoleBluOnly(norm)) {
      setWarningMessage(
        `Role "${roleMeta?.roleName || norm}" (${norm}) hanya diperuntukkan bagi Satker BLU (Badan Layanan Umum).`
      );
      return;
    }

    setWarningMessage(null);
    const nextRoles = [...selectedRoles, norm];
    onChange(sortRolesByMasterOrder(nextRoles));
  };

  const handleRemoveRole = (roleCode: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    const norm = normalizeRoleCode(roleCode) || roleCode;
    onChange(sortRolesByMasterOrder(selectedRoles.filter(r => r !== roleCode && normalizeRoleCode(r) !== norm)));
  };

  return (
    <div className="space-y-2 relative" ref={dropdownRef}>
      {/* Selected Chips View */}
      <div className="min-h-[46px] p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl flex flex-wrap items-center gap-1.5 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
        {sortedSelected.length === 0 ? (
          <span className="text-xs text-slate-400 italic px-2">
            Belum ada peran SAKTI dipilih. Klik tombol "+ Tambah Peran" di bawah.
          </span>
        ) : (
          sortedSelected.map(code => {
            const meta = MASTER_ROLE_MAP.get(code) || MASTER_ROLE_MAP.get(normalizeRoleCode(code));
            return (
              <span
                key={code}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80 shadow-xs"
                title={`${code} - ${meta?.description || ''}`}
              >
                <span>{meta ? meta.roleName : code}</span>
                <span className="text-[10px] text-indigo-400 font-mono">({code})</span>
                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => handleRemoveRole(code, e)}
                    className="ml-0.5 hover:bg-rose-100 dark:hover:bg-rose-950/80 hover:text-rose-600 rounded-full p-1 text-indigo-600 dark:text-indigo-400 cursor-pointer transition-colors"
                    title={`Hapus role ${code}`}
                    aria-label={`Hapus ${code}`}
                  >
                    <X className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                )}
              </span>
            );
          })
        )}

        {!disabled && (
          <button
            type="button"
            onClick={() => setIsOpen(prev => !prev)}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-300 border border-dashed border-slate-300 dark:border-slate-600 cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Peran</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {/* Warning message banner */}
      {warningMessage && (
        <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2 animate-in fade-in duration-200">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">{warningMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setWarningMessage(null)}
            className="text-amber-600 hover:text-amber-800 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Dropdown Menu Picker */}
      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header search & filter */}
          <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari kode role, nama peran, atau deskripsi SAKTI..."
                className="w-full pl-9 pr-8 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                autoFocus
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar text-[11px]">
              <button
                type="button"
                onClick={() => setSelectedCategory('ALL')}
                className={`px-2 py-0.5 rounded-md font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === 'ALL'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300'
                }`}
              >
                Semua ({MASTER_ROLE_SAKTI_LIST.length})
              </button>
              {ROLE_CATEGORIES.map(cat => {
                const count = MASTER_ROLE_SAKTI_LIST.filter(r => r.category === cat).length;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2 py-0.5 rounded-md font-medium whitespace-nowrap transition-colors ${
                      selectedCategory === cat
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300'
                    }`}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Roles list */}
          <div className="max-h-72 overflow-y-auto p-2 space-y-1 divide-y divide-slate-100 dark:divide-slate-800/60">
            {filteredRoles.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                Tidak ditemukan role yang cocok dengan kata kunci pencarian.
              </div>
            ) : (
              filteredRoles.map(role => {
                const isSelected = selectedRoles.includes(role.roleCode);
                const isBlu = role.specialRequirement === 'BLU_ONLY';
                const isBlocked = !isBLU && isBlu;

                return (
                  <div
                    key={role.roleCode}
                    onClick={() => !isBlocked && handleToggleRole(role.roleCode)}
                    className={`pt-1.5 pb-1.5 px-2.5 rounded-xl cursor-pointer transition-all flex items-start gap-2.5 ${
                      isBlocked
                        ? 'opacity-50 bg-slate-50 dark:bg-slate-900/40 cursor-not-allowed'
                        : isSelected
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/80'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="pt-0.5">
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-900 dark:text-white">
                          {role.roleName}
                        </span>
                        <span className="px-1.5 py-0.5 rounded font-mono text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {role.roleCode}
                        </span>
                        {isBlu && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                            KHUSUS BLU
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {role.description}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer note */}
          <div className="p-2.5 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
            <span>{selectedRoles.length} peran terpilih</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold cursor-pointer"
            >
              Selesai Memilih
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
