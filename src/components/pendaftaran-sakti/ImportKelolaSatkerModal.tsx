import React, { useState } from 'react';
import { 
  X, 
  Users, 
  Check, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  UserCheck,
  Building,
  Info
} from 'lucide-react';
import { MasterSatker, UserSaktiRecord, PejabatRoleInfo } from '../../types';
import { formatNIPDisplay } from '../../utils/pendaftaranSaktiValidation';

interface ImportKelolaSatkerModalProps {
  isOpen: boolean;
  onClose: () => void;
  satker: MasterSatker;
  onImportUsers: (users: UserSaktiRecord[], kpaInfo?: { nama: string; nip: string }) => void;
}

interface OfficerCandidate {
  roleTitle: string;
  mappedSaktiRoles: string[];
  officer: PejabatRoleInfo;
}

export const ImportKelolaSatkerModal: React.FC<ImportKelolaSatkerModalProps> = ({
  isOpen,
  onClose,
  satker,
  onImportUsers
}) => {
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

  if (!isOpen) return null;

  const po = satker.pejabatOperator;

  // Build list of available candidates from Kelola Satker
  const candidates: OfficerCandidate[] = [];

  if (po?.kpa?.nama) {
    candidates.push({
      roleTitle: 'Kuasa Pengguna Anggaran (KPA)',
      mappedSaktiRoles: ['KPA'],
      officer: po.kpa
    });
  }

  if (po?.ppk?.nama) {
    candidates.push({
      roleTitle: 'Pejabat Pembuat Komitmen (PPK)',
      mappedSaktiRoles: ['KOM'],
      officer: po.ppk
    });
  }

  if (po?.ppspm?.nama) {
    candidates.push({
      roleTitle: 'Pejabat Penandatangan SPM (PPSPM)',
      mappedSaktiRoles: ['BYR'],
      officer: po.ppspm
    });
  }

  if (po?.bendahara?.nama) {
    candidates.push({
      roleTitle: 'Bendahara Pengeluaran',
      mappedSaktiRoles: ['BNG'],
      officer: po.bendahara
    });
  }

  if (po?.operatorKomitmen?.nama) {
    candidates.push({
      roleTitle: 'Operator Komitmen',
      mappedSaktiRoles: ['KOM'],
      officer: po.operatorKomitmen
    });
  }

  if (po?.operatorPembayaran?.nama) {
    candidates.push({
      roleTitle: 'Operator Pembayaran',
      mappedSaktiRoles: ['BYR'],
      officer: po.operatorPembayaran
    });
  }

  if (po?.operatorGaji?.nama) {
    candidates.push({
      roleTitle: 'Operator SPM Gaji',
      mappedSaktiRoles: ['GAJI'],
      officer: po.operatorGaji
    });
  }

  if (po?.operatorPelaporan?.nama) {
    candidates.push({
      roleTitle: 'Operator GL dan Pelaporan',
      mappedSaktiRoles: ['GLP'],
      officer: po.operatorPelaporan
    });
  }

  // Cross-reference with kppn_pejabat_perbendaharaan_satker_data in localStorage
  if (typeof localStorage !== 'undefined') {
    try {
      const rawPejabat = localStorage.getItem('kppn_pejabat_perbendaharaan_satker_data');
      if (rawPejabat) {
        const list = JSON.parse(rawPejabat);
        if (Array.isArray(list)) {
          const matching = list.filter((p: any) => p.kodeSatker === satker.kodeSatker && p.nama);
          matching.forEach((m: any) => {
            const exists = candidates.some(c => 
              (c.officer.nip && m.nip && c.officer.nip.replace(/\D/g, '') === String(m.nip).replace(/\D/g, '')) ||
              (c.officer.nama && m.nama && c.officer.nama.trim().toLowerCase() === String(m.nama).trim().toLowerCase())
            );
            if (!exists) {
              const j = (m.jabatan || '').toUpperCase();
              let title = m.jabatan || 'Pejabat Satker';
              let roles = ['KOM'];
              if (j.includes('KPA')) {
                title = 'Kuasa Pengguna Anggaran (KPA)';
                roles = ['KPA'];
              } else if (j.includes('PPK')) {
                title = 'Pejabat Pembuat Komitmen (PPK)';
                roles = ['KOM'];
              } else if (j.includes('PPSPM')) {
                title = 'Pejabat Penandatangan SPM (PPSPM)';
                roles = ['BYR'];
              } else if (j.includes('BENDAHARA')) {
                title = 'Bendahara Pengeluaran';
                roles = ['BNG'];
              }
              candidates.push({
                roleTitle: title,
                mappedSaktiRoles: roles,
                officer: {
                  nama: m.nama,
                  nip: m.nip || '',
                  noHp: m.noHp || m.nomorTelepon || '',
                  email: m.email || '',
                  pangkatGolongan: m.pangkatGolongan || '',
                  jabatan: m.jabatan || title
                }
              });
            }
          });
        }
      }
    } catch (e) {}
  }

  // Check PIC Satker if available
  if (satker.namaPic && satker.namaPic.trim() && satker.namaPic !== '-') {
    const exists = candidates.some(c => 
      c.officer.nama && c.officer.nama.trim().toLowerCase() === satker.namaPic?.trim().toLowerCase()
    );
    if (!exists) {
      candidates.push({
        roleTitle: 'PIC / Operator Satker',
        mappedSaktiRoles: ['ADM'],
        officer: {
          nama: satker.namaPic,
          noHp: satker.noHpPic || '',
          email: satker.emailPic || '',
          jabatan: 'Administrator Satker'
        }
      });
    }
  }

  const handleToggleSelectAll = () => {
    if (selectedIndices.size === candidates.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(candidates.map((_, i) => i)));
    }
  };

  const handleToggleIndex = (idx: number) => {
    const next = new Set(selectedIndices);
    if (next.has(idx)) {
      next.delete(idx);
    } else {
      next.add(idx);
    }
    setSelectedIndices(next);
  };

  const handleExecuteImport = () => {
    const today = new Date().toISOString().split('T')[0];
    const importedList: UserSaktiRecord[] = [];
    let kpaFound: { nama: string; nip: string } | undefined = undefined;

    candidates.forEach((cand, idx) => {
      if (selectedIndices.has(idx)) {
        const cleanNip = (cand.officer.nip || '').replace(/[^0-9]/g, '');
        let peran: 'Approval' | 'Validator' | 'Operator' | 'Admin' = 'Operator';
        let jabatanPerb = 'Operator SAKTI';

        if (cand.roleTitle.includes('KPA')) {
          peran = 'Approval';
          jabatanPerb = 'Kuasa Pengguna Anggaran';
        } else if (cand.roleTitle.includes('PPK')) {
          peran = 'Validator';
          jabatanPerb = 'Pejabat Pembuat Komitmen';
        } else if (cand.roleTitle.includes('PPSPM')) {
          peran = 'Validator';
          jabatanPerb = 'Pejabat Penandatangan SPM';
        } else if (cand.roleTitle.includes('Bendahara')) {
          peran = 'Operator';
          jabatanPerb = 'Bendahara Pengeluaran';
        } else if (cand.roleTitle.includes('Admin')) {
          peran = 'Admin';
          jabatanPerb = 'Administrator Satker';
        }

        importedList.push({
          id: `user_import_${Date.now()}_${idx}`,
          namaLengkap: cand.officer.nama.trim(),
          nip: cleanNip || '000000000000000000',
          pangkatGolongan: cand.officer.pangkatGolongan || 'Penata / III/c',
          jabatan: cand.officer.jabatan || cand.roleTitle,
          peranJabatan: peran,
          jabatanPerbendaharaan: jabatanPerb,
          email: cand.officer.email?.trim() || `${cand.officer.nama.toLowerCase().replace(/[^a-z0-9]/g, '')}@kemenkeu.go.id`,
          noHp: cand.officer.noHp?.trim() || '08123456789',
          roles: cand.mappedSaktiRoles,
          nomorSk: cand.officer.skJabatan || 'KEP-01/WPB.14/KP.02/2026',
          tanggalSk: cand.officer.tglSk || today,
          keterangan: `Diimpor dari data ${cand.roleTitle} Kelola Satker`
        });

        if (cand.roleTitle.includes('KPA') && cand.officer.nama) {
          kpaFound = {
            nama: cand.officer.nama.trim(),
            nip: cleanNip
          };
        }
      }
    });

    onImportUsers(importedList, kpaFound);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white flex items-center justify-between border-b border-teal-500/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                Impor Data dari Kelola Satker
              </h3>
              <p className="text-xs text-slate-300">
                Tarik data pejabat &amp; operator yang sudah tercatat di database Kelola Data Satker
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 flex-1 overflow-y-auto">
          {candidates.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 space-y-3">
              <Users className="w-10 h-10 mx-auto text-slate-400" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Belum Ada Kontak Pejabat Tersimpan
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Satker <strong>{satker.namaSatker}</strong> belum memiliki daftar pejabat / operator di menu <strong>Kelola Data Satker</strong>. Anda dapat mengisi data pengguna secara manual pada formulir ini.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  Ditemukan <strong>{candidates.length}</strong> pejabat &amp; operator dari database Satker.
                </div>
                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
                >
                  {selectedIndices.size === candidates.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
                </button>
              </div>

              <div className="space-y-2">
                {candidates.map((cand, idx) => {
                  const isChecked = selectedIndices.has(idx);
                  return (
                    <div
                      key={idx}
                      onClick={() => handleToggleIndex(idx)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isChecked
                          ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-500/60 shadow-xs'
                          : 'bg-white dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              {cand.officer.nama}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                              {cand.roleTitle}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                            <span className="font-mono">NIP: {cand.officer.nip ? formatNIPDisplay(cand.officer.nip) : '-'}</span>
                            <span>•</span>
                            <span>Role SAKTI: <strong className="text-teal-600 dark:text-teal-400">{cand.mappedSaktiRoles.join(', ')}</strong></span>
                          </p>
                        </div>
                      </div>

                      {isChecked && (
                        <div className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs shrink-0">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            Batal
          </button>

          <button
            type="button"
            disabled={selectedIndices.size === 0}
            onClick={handleExecuteImport}
            className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white text-xs font-bold shadow-md shadow-teal-600/20 transition-all cursor-pointer flex items-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Impor {selectedIndices.size} Pegawai Terpilih</span>
          </button>
        </div>
      </div>
    </div>
  );
};
