import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  FileSpreadsheet, 
  FileText, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Save, 
  Eye, 
  RefreshCw, 
  ShieldCheck, 
  Building, 
  Users, 
  Search, 
  Download, 
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Lock,
  Unlock,
  ArrowRight,
  ListFilter,
  Check,
  Calendar,
  User,
  Info,
  History,
  Shield,
  Clock,
  RotateCcw,
  Mail,
  Cloud
} from 'lucide-react';
import { 
  PendaftaranUserSaktiDraft, 
  UserSaktiRecord, 
  SatkerIKPA, 
  MasterSatker,
  PendaftaranValidationResult 
} from '../types';
import { LEVEL_SATKER_OPTIONS, formatRolesForExcel, MASTER_ROLE_MAP } from '../data/masterRoleSakti';
import { validatePendaftaranDraft, formatNIPDisplay } from '../utils/pendaftaranSaktiValidation';
import { exportPendaftaranSaktiToExcel, exportPendaftaranSaktiToPDF } from '../utils/pendaftaranSaktiExport';
import { resolveKodeBA, resolveSatkerKementerian, verifySatkerPassword } from '../utils/satkerSecurity';
import { 
  saveSaktiDraftToFirestore, 
  fetchSaktiDraftFromFirestore, 
  saveSaktiHistoryToFirestore, 
  fetchSaktiHistoryFromFirestore,
  resolveLatestDraft,
  subscribeSaktiDraftFromFirestore
} from '../utils/saktiFirestoreSync';
import { dispatchSaktiUsersChanged } from '../utils/saktiUserContactSync';
import { useSatkerInactivityTimeout } from '../hooks/useSatkerInactivityTimeout';
import { SatkerSessionTimerBadge, SatkerSessionExpiredModal } from './satker/SatkerSessionSecurityControls';
import INITIAL_SATKER_DATA from '../data/satkersBaseline.json';

import { UserSaktiModal } from './pendaftaran-sakti/UserSaktiModal';
import { ValidationSummaryModal } from './pendaftaran-sakti/ValidationSummaryModal';
import { ExcelPreviewModal } from './pendaftaran-sakti/ExcelPreviewModal';
import { SatkerPasswordGatekeeper } from './pendaftaran-sakti/SatkerPasswordGatekeeper';
import { SatkerSelectorModal } from './pendaftaran-sakti/SatkerSelectorModal';
import { RiwayatPembentukanUserView } from './pendaftaran-sakti/RiwayatPembentukanUserView';
import { ImportKelolaSatkerModal } from './pendaftaran-sakti/ImportKelolaSatkerModal';
import { GenerateSkSaktiView } from './pendaftaran-sakti/GenerateSkSaktiView';
import { PerubahanUserSaktiTab } from './perubahan-user-sakti/PerubahanUserSaktiTab';
import { PemutakhiranKewenanganTab } from './pemutakhiran-kewenangan/PemutakhiranKewenanganTab';
import { PemutakhiranDataPenggunaTab } from './pemutakhiran-data-pengguna/PemutakhiranDataPenggunaTab';
import { PendaftaranEmailTab } from './pendaftaran-email/PendaftaranEmailTab';
import { db, setDoc } from '../lib/firebase';
import { doc } from 'firebase/firestore';

interface PendaftaranUserSaktiViewProps {
  satkers: SatkerIKPA[];
  masterSatkers?: MasterSatker[];
  isAdminAuthenticated?: boolean;
  onOpenAdminLogin?: () => void;
  isDark?: boolean;
}

const STORAGE_SESSION_UNLOCKED = 'sakti_unlocked_satkers';

export const PendaftaranUserSaktiView: React.FC<PendaftaranUserSaktiViewProps> = ({
  satkers = [],
  masterSatkers = [],
  isAdminAuthenticated = false,
  isDark = false
}) => {
  // 1. Unified Master Satker Reference List (Lengkap & Terverifikasi)
  const completeSatkerList: MasterSatker[] = useMemo(() => {
    const map = new Map<string, MasterSatker>();

    // Input from masterSatkers first
    if (Array.isArray(masterSatkers)) {
      masterSatkers.forEach(m => {
        if (!m.kodeSatker) return;
        const cleanKode = m.kodeSatker.trim();
        const ba = m.kodeBa || resolveKodeBA(m);
        const kl = resolveSatkerKementerian({ ...m, kodeBa: ba });
        map.set(cleanKode, {
          ...m,
          kodeSatker: cleanKode,
          kodeBa: ba,
          kementerianLembaga: kl,
          isActive: m.isActive ?? true
        });
      });
    }

    // Input from satkers (merge additional details)
    if (Array.isArray(satkers)) {
      satkers.forEach(s => {
        if (!s.kodeSatker) return;
        const cleanKode = s.kodeSatker.trim();
        const existing = map.get(cleanKode);
        const ba = existing?.kodeBa || resolveKodeBA(s);
        const kl = resolveSatkerKementerian({
          ...s,
          kodeBa: ba,
          kementerianLembaga: existing?.kementerianLembaga || s.kementerianLembaga
        });
        map.set(cleanKode, {
          id: existing?.id || s.id || `satker-${cleanKode}`,
          kodeSatker: cleanKode,
          namaSatker: existing?.namaSatker || s.namaSatker,
          kodeBa: ba,
          kementerianLembaga: kl,
          isActive: existing?.isActive ?? true,
          unitEselon1: existing?.unitEselon1 || s.unitEselon1 || '',
          alamatSatker: existing?.alamatSatker || s.alamatSatker || '',
          passwordSatker: existing?.passwordSatker || s.passwordSatker || '',
          namaPic: existing?.namaPic || s.namaPic || '',
          noHpPic: existing?.noHpPic || s.noHpPic || '',
          emailPic: existing?.emailPic || s.emailPic || '',
          pejabatOperator: existing?.pejabatOperator || s.pejabatOperator
        });
      });
    }

    // Fallback to INITIAL_SATKER_DATA baseline so count is never empty
    if (map.size === 0 && Array.isArray(INITIAL_SATKER_DATA)) {
      INITIAL_SATKER_DATA.forEach(s => {
        if (!s.kodeSatker) return;
        const cleanKode = s.kodeSatker.trim();
        const ba = resolveKodeBA(s);
        const kl = resolveSatkerKementerian({ ...s, kodeBa: ba });
        map.set(cleanKode, {
          id: `satker-${cleanKode}`,
          kodeSatker: cleanKode,
          namaSatker: s.namaSatker,
          kodeBa: ba,
          kementerianLembaga: kl,
          isActive: true
        });
      });
    }

    return Array.from(map.values()).sort((a, b) => a.kodeSatker.localeCompare(b.kodeSatker));
  }, [masterSatkers, satkers]);

  // 2. Active Satker Selection
  const [selectedSatkerKode, setSelectedSatkerKode] = useState<string>(() => {
    if (typeof localStorage !== 'undefined') {
      const activeKode = localStorage.getItem('kppn_current_satker');
      if (activeKode) return activeKode;
    }
    return completeSatkerList[0]?.kodeSatker || '890594';
  });

  const currentSatker: MasterSatker = useMemo(() => {
    const found = completeSatkerList.find(s => s.kodeSatker === selectedSatkerKode);
    if (found) return found;
    return completeSatkerList[0] || {
      id: 'satker-default',
      kodeSatker: '527272',
      namaSatker: 'KPPN SEMARANG I',
      isActive: true,
      kodeBa: '01508',
      kementerianLembaga: 'Kementerian Keuangan'
    };
  }, [completeSatkerList, selectedSatkerKode]);

  // 3. Password Gatekeeper & Active Satker Session State
  // KEAMANAN TINGGI: Sesi Satker hanya disimpan di memori runtime (React State).
  // Setiap REFRESH halaman atau setiap GANTI SATKER otomatis LOG OUT & TERKUNCI kembali
  // demi melindungi kerahasiaan data pengguna SAKTI Satker.
  const STORAGE_ACTIVE_UNLOCKED_SATKER = 'sakti_active_unlocked_satker';
  const [activeUnlockedSatkerKode, setActiveUnlockedSatkerKode] = useState<string | null>(null);

  // Pastikan sesi penyimpanan browser lama dibersihkan saat halaman dimuat / di-refresh
  useEffect(() => {
    if (typeof sessionStorage !== 'undefined') {
      try {
        sessionStorage.removeItem(STORAGE_ACTIVE_UNLOCKED_SATKER);
      } catch (e) {}
    }
  }, []);

  // Setiap kali Satker berganti, otomatis log out & kunci kembali sesi sebelumnya
  useEffect(() => {
    setActiveUnlockedSatkerKode(null);
    if (typeof sessionStorage !== 'undefined') {
      try {
        sessionStorage.removeItem(STORAGE_ACTIVE_UNLOCKED_SATKER);
      } catch (e) {}
    }
  }, [selectedSatkerKode]);

  const isCurrentSatkerUnlocked = useMemo(() => {
    if (isAdminAuthenticated) return true;
    return Boolean(activeUnlockedSatkerKode && activeUnlockedSatkerKode === currentSatker.kodeSatker);
  }, [isAdminAuthenticated, activeUnlockedSatkerKode, currentSatker.kodeSatker]);

  const handleUnlockSuccess = () => {
    setActiveUnlockedSatkerKode(currentSatker.kodeSatker);
    setSaveToast(`✓ Akses internal Satker ${currentSatker.kodeSatker} berhasil dibuka`);
  };

  const handleLockCurrentSatker = () => {
    setActiveUnlockedSatkerKode(null);
    if (typeof sessionStorage !== 'undefined') {
      try {
        sessionStorage.removeItem(STORAGE_ACTIVE_UNLOCKED_SATKER);
      } catch (e) {}
    }
    setSaveToast(`Akses Satker ${currentSatker.kodeSatker} dikunci kembali`);
  };

  // Inactivity Timeout Auto-Lock for Satker security
  const [isSessionExpiredModalOpen, setIsSessionExpiredModalOpen] = useState<boolean>(false);

  const {
    remainingSeconds,
    formattedRemaining,
    timeoutMinutes,
    setTimeoutMinutes,
    isWarning: isSessionWarning,
    resetTimer: resetSessionTimer
  } = useSatkerInactivityTimeout({
    isEnabled: Boolean(isCurrentSatkerUnlocked && !isAdminAuthenticated),
    satkerKode: currentSatker.kodeSatker,
    onTimeout: () => {
      handleLockCurrentSatker();
      setIsSessionExpiredModalOpen(true);
    }
  });

  // Cloud Sync State (Bridges Google AI Studio dev and Server Deployment)
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'synced' | 'syncing' | 'idle' | 'error'>('idle');
  const [lastCloudSyncTime, setLastCloudSyncTime] = useState<string | null>(null);

  // 4. Workspace View Mode: Form vs Perubahan vs Pemutakhiran vs Pemutakhiran Data vs Generate SK vs Email vs Riwayat
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'FORM' | 'PERUBAHAN' | 'PEMUTAKHIRAN' | 'PEMUTAKHIRAN_DATA' | 'GENERATE_SK' | 'EMAIL' | 'RIWAYAT'>('FORM');

  // 5. Draft State (Per Satker Storage)
  const getDraftStorageKey = (kode: string) => `sakti_pendaftaran_draft_${kode}`;
  const getHistoryStorageKey = (kode: string) => `sakti_pendaftaran_history_${kode}`;

  const [draft, setDraft] = useState<PendaftaranUserSaktiDraft>(() => {
    const today = new Date().toISOString().split('T')[0];
    const isSatkerBLU = currentSatker.namaSatker?.toLowerCase().includes('blu') || false;

    if (typeof localStorage !== 'undefined') {
      try {
        const saved = localStorage.getItem(getDraftStorageKey(currentSatker.kodeSatker));
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.kodeSatker === currentSatker.kodeSatker) {
            return parsed;
          }
        }
      } catch (e) {}
    }

    return {
      id: `draft_${currentSatker.kodeSatker}_${Date.now()}`,
      kodeSatker: currentSatker.kodeSatker,
      namaSatker: currentSatker.namaSatker,
      levelSatker: isSatkerBLU ? 'Badan Layanan Umum (BLU)' : 'Satker Daerah (KD)',
      isBLU: isSatkerBLU,
      judulPengajuan: `Pendaftaran User SAKTI - TA ${new Date().getFullYear()}`,
      users: [],
      status: 'DRAFT',
      tempatPenetapan: 'Semarang',
      tanggalPenetapan: today,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  });

  // 6. History Drafts (Loaded from satker specific key + global fallback)
  const [historyDrafts, setHistoryDrafts] = useState<PendaftaranUserSaktiDraft[]>(() => {
    if (typeof localStorage !== 'undefined') {
      try {
        const hist = localStorage.getItem('sakti_pendaftaran_all_history');
        if (hist) {
          const parsed = JSON.parse(hist);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch (e) {}
    }
    return [];
  });

  // Bidirectional Cloud Synchronization logic
  const syncWithCloud = async (
    targetKode: string,
    currentLocalDraft: PendaftaranUserSaktiDraft,
    currentLocalHistory: PendaftaranUserSaktiDraft[],
    forcePush = false
  ) => {
    setIsCloudSyncing(true);
    setCloudSyncStatus('syncing');
    try {
      const [cloudDraft, cloudHistory] = await Promise.all([
        fetchSaktiDraftFromFirestore(targetKode),
        fetchSaktiHistoryFromFirestore()
      ]);

      // 1. Process Draft (compare local vs cloud)
      if (cloudDraft && !forcePush) {
        const resolved = resolveLatestDraft(currentLocalDraft, cloudDraft);
        if (resolved && resolved.source === 'cloud') {
          setDraft(resolved.draft);
          if (typeof localStorage !== 'undefined') {
            try {
              localStorage.setItem(getDraftStorageKey(resolved.draft.kodeSatker), JSON.stringify(resolved.draft));
            } catch (e) {}
          }
        } else if (resolved && resolved.source === 'local') {
          // Only save local to cloud if local actually has content/users
          if (currentLocalDraft.users && currentLocalDraft.users.length > 0) {
            await saveSaktiDraftToFirestore(currentLocalDraft);
          }
        }
      } else if (!cloudDraft && !forcePush) {
        // Fallback: If cloud has no active draft, check if cloudHistory has records for this Satker with users
        if (Array.isArray(cloudHistory) && cloudHistory.length > 0) {
          const matchingHist = cloudHistory.find(h => h.kodeSatker === targetKode && h.users && h.users.length > 0);
          if (matchingHist) {
            setDraft(matchingHist);
            if (typeof localStorage !== 'undefined') {
              try {
                localStorage.setItem(getDraftStorageKey(matchingHist.kodeSatker), JSON.stringify(matchingHist));
              } catch (e) {}
            }
            await saveSaktiDraftToFirestore(matchingHist);
          } else if (currentLocalDraft.users && currentLocalDraft.users.length > 0) {
            await saveSaktiDraftToFirestore(currentLocalDraft);
          }
        } else if (currentLocalDraft.users && currentLocalDraft.users.length > 0) {
          await saveSaktiDraftToFirestore(currentLocalDraft);
        }
      } else if (forcePush || (currentLocalDraft.users && currentLocalDraft.users.length > 0)) {
        await saveSaktiDraftToFirestore(currentLocalDraft);
      }

      // 2. Process History (merge local & cloud records)
      if (Array.isArray(cloudHistory) && cloudHistory.length > 0) {
        const historyMap = new Map<string, PendaftaranUserSaktiDraft>();
        cloudHistory.forEach(h => {
          if (h && h.id) historyMap.set(h.id, h);
        });
        currentLocalHistory.forEach(h => {
          if (!h || !h.id) return;
          const existing = historyMap.get(h.id);
          if (!existing) {
            historyMap.set(h.id, h);
          } else {
            const localTime = new Date(h.updatedAt || h.createdAt || 0).getTime();
            const cloudTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
            if (localTime > cloudTime) {
              historyMap.set(h.id, h);
            }
          }
        });

        const mergedHistory = Array.from(historyMap.values()).sort((a, b) => {
          const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
          const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
          return timeB - timeA;
        });

        setHistoryDrafts(mergedHistory);
        if (typeof localStorage !== 'undefined') {
          try {
            localStorage.setItem('sakti_pendaftaran_all_history', JSON.stringify(mergedHistory));
          } catch (e) {}
        }
        await saveSaktiHistoryToFirestore(mergedHistory);
      } else if (currentLocalHistory.length > 0) {
        await saveSaktiHistoryToFirestore(currentLocalHistory);
      }

      setCloudSyncStatus('synced');
      setLastCloudSyncTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      console.warn('[PendaftaranUserSaktiView] Cloud sync error:', err);
      setCloudSyncStatus('error');
    } finally {
      setIsCloudSyncing(false);
    }
  };

  // When selectedSatkerKode changes, re-sync draft locally & with Cloud Firestore
  useEffect(() => {
    const isSatkerBLU = currentSatker.namaSatker?.toLowerCase().includes('blu') || false;
    const today = new Date().toISOString().split('T')[0];

    let loadedDraft: PendaftaranUserSaktiDraft | null = null;
    if (typeof localStorage !== 'undefined') {
      try {
        const saved = localStorage.getItem(getDraftStorageKey(currentSatker.kodeSatker));
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.kodeSatker === currentSatker.kodeSatker) {
            loadedDraft = parsed;
          }
        }
      } catch (e) {}
    }

    const activeLocalDraft = loadedDraft || {
      id: `draft_${currentSatker.kodeSatker}_${Date.now()}`,
      kodeSatker: currentSatker.kodeSatker,
      namaSatker: currentSatker.namaSatker,
      levelSatker: isSatkerBLU ? 'Badan Layanan Umum (BLU)' : 'Satker Daerah (KD)',
      isBLU: isSatkerBLU,
      judulPengajuan: `Pendaftaran User SAKTI - TA ${new Date().getFullYear()}`,
      users: [],
      status: 'DRAFT',
      tempatPenetapan: 'Semarang',
      tanggalPenetapan: today,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setDraft(activeLocalDraft);

    // Concurrently synchronize with Cloud Firestore
    syncWithCloud(currentSatker.kodeSatker, activeLocalDraft, historyDrafts);
  }, [currentSatker.kodeSatker, currentSatker.namaSatker]);

  // Real-time listener: receive updates immediately when saved from other browser tabs / Google AI Studio / Deployment
  useEffect(() => {
    const unsubscribe = subscribeSaktiDraftFromFirestore(currentSatker.kodeSatker, (remoteDraft) => {
      if (!remoteDraft || remoteDraft.kodeSatker !== currentSatker.kodeSatker) return;
      setDraft(prevLocalDraft => {
        const resolved = resolveLatestDraft(prevLocalDraft, remoteDraft);
        if (resolved && resolved.source === 'cloud') {
          if (typeof localStorage !== 'undefined') {
            try {
              localStorage.setItem(getDraftStorageKey(remoteDraft.kodeSatker), JSON.stringify(remoteDraft));
            } catch (e) {}
          }
          return resolved.draft;
        }
        return prevLocalDraft;
      });
      setCloudSyncStatus('synced');
      setLastCloudSyncTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
    });

    return () => {
      unsubscribe();
    };
  }, [currentSatker.kodeSatker]);

  // Count of history records for active satker
  const currentSatkerHistory = useMemo(() => {
    return historyDrafts.filter(h => h.kodeSatker === currentSatker.kodeSatker);
  }, [historyDrafts, currentSatker.kodeSatker]);

  // Auto-save draft to localStorage and debounced auto-sync to Cloud Firestore whenever draft has content
  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(getDraftStorageKey(draft.kodeSatker), JSON.stringify(draft));
      } catch (e) {}
    }

    // Notify all active modules (e.g. Kelola Data Satker) immediately
    dispatchSaktiUsersChanged(draft.kodeSatker, draft.users || []);

    // Automatically sync to Cloud Firestore
    const timer = setTimeout(() => {
      saveSaktiDraftToFirestore(draft).then(() => {
        setCloudSyncStatus('synced');
        setLastCloudSyncTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
      }).catch((err) => {
        console.warn('Auto cloud sync notice:', err);
      });
    }, 1200);
    return () => clearTimeout(timer);
  }, [draft]);

  // UI Navigation & Modals State
  const [viewMode, setViewMode] = useState<'TABLE' | 'WIZARD'>('TABLE');
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [isUserModalOpen, setIsUserModalOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<UserSaktiRecord | null>(null);
  const [isValidModalOpen, setIsValidModalOpen] = useState<boolean>(false);
  const [isExcelPreviewOpen, setIsExcelPreviewOpen] = useState<boolean>(false);
  const [isSatkerSelectorOpen, setIsSatkerSelectorOpen] = useState<boolean>(false);
  const [isImportKelolaModalOpen, setIsImportKelolaModalOpen] = useState<boolean>(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserSaktiRecord | null>(null);
  const [historyToDeleteId, setHistoryToDeleteId] = useState<string | null>(null);
  const [isConfirmNewFormOpen, setIsConfirmNewFormOpen] = useState<boolean>(false);

  // Validation Result
  const validationResult: PendaftaranValidationResult = useMemo(() => {
    return validatePendaftaranDraft(draft);
  }, [draft]);

  // Total role count
  const totalRoleCount = useMemo(() => {
    return draft.users.reduce((acc, u) => acc + (u.roles?.length || 0), 0);
  }, [draft.users]);

  // Toast auto-hide
  useEffect(() => {
    if (saveToast) {
      const timer = setTimeout(() => setSaveToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [saveToast]);

  // Handle Satker Switcher from Selector Modal
  const handleSelectSatker = (selected: MasterSatker) => {
    const nextKode = selected.kodeSatker;
    setSelectedSatkerKode(nextKode);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('kppn_current_satker', nextKode);
    }
    // Strict privacy enforcement: ALWAYS log out and lock access whenever switching or selecting satker
    setActiveUnlockedSatkerKode(null);
    if (typeof sessionStorage !== 'undefined') {
      try {
        sessionStorage.removeItem(STORAGE_ACTIVE_UNLOCKED_SATKER);
      } catch (e) {}
    }
    setIsSatkerSelectorOpen(false);
  };

  // Add / Edit User Handler
  const handleSaveUser = (user: UserSaktiRecord) => {
    setDraft(prev => {
      const existingIdx = prev.users.findIndex(u => u.id === user.id);
      let updatedUsers: UserSaktiRecord[];
      if (existingIdx >= 0) {
        updatedUsers = [...prev.users];
        updatedUsers[existingIdx] = user;
      } else {
        updatedUsers = [...prev.users, user];
      }

      return {
        ...prev,
        users: updatedUsers,
        status: 'DRAFT',
        updatedAt: new Date().toISOString()
      };
    });
    setSaveToast('Pengguna berhasil disimpan ke dalam daftar');
  };

  // Delete User Handler - prompts confirmation modal
  const handleDeleteUser = (userId: string) => {
    const target = draft.users.find(u => u.id === userId);
    if (target) {
      setUserToDelete(target);
    }
  };

  // Perform actual user deletion after confirmation
  const handleConfirmDeleteUser = () => {
    if (!userToDelete) return;
    const targetId = userToDelete.id;
    const targetName = userToDelete.namaLengkap;

    const updatedUsers = draft.users.filter(u => u.id !== targetId);
    const updatedDraft: PendaftaranUserSaktiDraft = {
      ...draft,
      users: updatedUsers,
      updatedAt: new Date().toISOString()
    };

    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(getDraftStorageKey(updatedDraft.kodeSatker), JSON.stringify(updatedDraft));
      } catch (e) {}
    }

    // Instant notification & Cloud sync on delete
    dispatchSaktiUsersChanged(updatedDraft.kodeSatker, updatedUsers);
    saveSaktiDraftToFirestore(updatedDraft).catch(() => {});

    setDraft(updatedDraft);
    setUserToDelete(null);
    setSaveToast(`Data pengguna "${targetName}" berhasil dihapus`);
  };

  // Save Draft (Local + Satker History + Cloud Firestore)
  const handleSaveDraft = async () => {
    try {
      const nowStr = new Date().toISOString();
      const updatedDraft: PendaftaranUserSaktiDraft = {
        ...draft,
        status: validationResult.isValid ? 'VALID' : 'DRAFT',
        updatedAt: nowStr
      };
      setDraft(updatedDraft);

      // 1. Save locally for this Satker
      const filtered = historyDrafts.filter(h => h.id !== updatedDraft.id);
      const newHist = [updatedDraft, ...filtered];
      setHistoryDrafts(newHist);

      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(getDraftStorageKey(updatedDraft.kodeSatker), JSON.stringify(updatedDraft));
        localStorage.setItem('sakti_pendaftaran_all_history', JSON.stringify(newHist));
      }

      // 3. Cloud Firestore Persistence (Bidirectional sync across Google AI Studio & Deployment)
      try {
        await Promise.all([
          saveSaktiDraftToFirestore(updatedDraft),
          saveSaktiHistoryToFirestore(newHist)
        ]);
        setCloudSyncStatus('synced');
        setLastCloudSyncTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
      } catch (cloudErr) {
        console.warn('Draft saved locally, cloud sync deferred:', cloudErr);
      }

      setSaveToast('✓ Formulir draft pendaftaran berhasil disimpan & tersinkron ke Cloud!');
    } catch (err) {
      console.error(err);
      setSaveToast('Gagal menyimpan draft');
    }
  };

  // IKPA Metrics Helper for Satker
  const getIkpaInfoForSatker = (kodeSatker: string) => {
    const s = satkers.find(item => item.kodeSatker === kodeSatker);
    if (!s) return undefined;
    const sorted = [...satkers].sort((a, b) => (b.nilaiTotalIKPA || (b as any).totalNilai || 0) - (a.nilaiTotalIKPA || (a as any).totalNilai || 0));
    const rankIndex = sorted.findIndex(item => item.kodeSatker === s.kodeSatker);
    return {
      totalNilai: s.nilaiTotalIKPA || (s as any).totalNilai || 0,
      predikat: s.predikat,
      rank: rankIndex >= 0 ? rankIndex + 1 : undefined,
      capaianOutput: s.indikator?.capaianOutput || (s as any).konfirmasiCapaianOutput,
      penyerapanAnggaran: s.indikator?.penyerapanAnggaran || (s as any).penyerapanAnggaran
    };
  };

  const selectedSatkerIkpa = useMemo(() => {
    return getIkpaInfoForSatker(draft.kodeSatker);
  }, [satkers, draft.kodeSatker]);

  // Export to Excel Handler (Supports historical exports or active draft)
  const handleExportExcel = async (draftToExport?: PendaftaranUserSaktiDraft) => {
    const target = draftToExport || draft;
    if (!target.users || target.users.length === 0) {
      alert('Tidak dapat mengekspor atau mencetak formulir: Belum ada data pengguna yang ditambahkan.');
      return;
    }

    const targetValidation = validatePendaftaranDraft(target);
    if (!targetValidation.isValid) {
      setIsValidModalOpen(true);
      alert('Pencetakan/Ekspor Ditolak: Seluruh pengguna wajib melengkapi data NIK (16 digit) dan NPWP (15 atau 16 digit angka tanpa simbol) sebelum formulir dapat diekspor.');
      return;
    }

    try {
      await exportPendaftaranSaktiToExcel(target);
      const exportedDraft: PendaftaranUserSaktiDraft = {
        ...target,
        status: 'EXPORTED',
        exportedAt: new Date().toISOString()
      };

      if (!draftToExport || draftToExport.id === draft.id) {
        setDraft(exportedDraft);
      }

      // Record exported in history
      setHistoryDrafts(prev => {
        const filtered = prev.filter(h => h.id !== target.id);
        const next = [exportedDraft, ...filtered];
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('sakti_pendaftaran_all_history', JSON.stringify(next));
        }
        saveSaktiHistoryToFirestore(next).catch(() => {});
        return next;
      });

      setSaveToast('✓ File Excel resmi berhasil diunduh dan dicatat di riwayat');
    } catch (err: any) {
      alert(`Gagal mengekspor file Excel: ${err?.message || err}`);
    }
  };

  // Export to PDF Handler
  const handleExportPDF = (draftToExport?: PendaftaranUserSaktiDraft) => {
    const target = draftToExport || draft;
    if (!target.users || target.users.length === 0) {
      alert('Tidak dapat mengekspor atau mencetak formulir: Belum ada data pengguna yang ditambahkan.');
      return;
    }

    const targetValidation = validatePendaftaranDraft(target);
    if (!targetValidation.isValid) {
      setIsValidModalOpen(true);
      alert('Pencetakan/Ekspor Ditolak: Seluruh pengguna wajib melengkapi data NIK (16 digit) dan NPWP (15 atau 16 digit angka tanpa simbol) sebelum formulir dapat dicetak.');
      return;
    }

    try {
      const ikpaData = getIkpaInfoForSatker(target.kodeSatker);
      exportPendaftaranSaktiToPDF(target, ikpaData);
      const exportedDraft: PendaftaranUserSaktiDraft = {
        ...target,
        status: 'EXPORTED',
        exportedAt: new Date().toISOString()
      };

      if (!draftToExport || draftToExport.id === draft.id) {
        setDraft(exportedDraft);
      }

      // Record in history
      setHistoryDrafts(prev => {
        const filtered = prev.filter(h => h.id !== target.id);
        const next = [exportedDraft, ...filtered];
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('sakti_pendaftaran_all_history', JSON.stringify(next));
        }
        saveSaktiHistoryToFirestore(next).catch(() => {});
        return next;
      });

      setSaveToast('✓ Dokumen PDF resmi berhasil diunduh dan dicatat di riwayat');
    } catch (err: any) {
      alert(`Gagal mencetak PDF: ${err?.message || err}`);
      setSaveToast(`Gagal mengekspor PDF: ${err?.message || err}`);
    }
  };

  // Execute Create Fresh New Form
  const executeCreateNewForm = () => {
    if (draft.users.length > 0) {
      handleSaveDraft();
    }

    const today = new Date().toISOString().split('T')[0];
    const isSatkerBLU = currentSatker.namaSatker?.toLowerCase().includes('blu') || false;

    const newDraft: PendaftaranUserSaktiDraft = {
      id: `draft_${currentSatker.kodeSatker}_${Date.now()}`,
      kodeSatker: currentSatker.kodeSatker,
      namaSatker: currentSatker.namaSatker,
      levelSatker: isSatkerBLU ? 'Badan Layanan Umum (BLU)' : 'Satker Daerah (KD)',
      isBLU: isSatkerBLU,
      judulPengajuan: `Pendaftaran User SAKTI Baru - ${new Date().toLocaleDateString('id-ID')}`,
      users: [],
      status: 'DRAFT',
      tempatPenetapan: 'Semarang',
      tanggalPenetapan: today,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setDraft(newDraft);
    setWizardStep(1);
    setActiveWorkspaceTab('FORM');
    setIsConfirmNewFormOpen(false);
    setSaveToast('Formulir baru siap diisi');
  };

  // Create Fresh New Form trigger
  const handleCreateNewForm = () => {
    if (draft.users.length > 0) {
      setIsConfirmNewFormOpen(true);
      return;
    }
    executeCreateNewForm();
  };

  // Load draft from history to active editor
  const handleLoadDraftFromHistory = (historicalDraft: PendaftaranUserSaktiDraft) => {
    setDraft(historicalDraft);
    setActiveWorkspaceTab('FORM');
    setSaveToast(`Memuat data "${historicalDraft.judulPengajuan || 'Pendaftaran SAKTI'}" ke formulir aktif`);
  };

  // Delete draft from history - triggers modal
  const handleDeleteHistory = (draftId: string) => {
    setHistoryToDeleteId(draftId);
  };

  // Confirm delete draft from history
  const handleConfirmDeleteHistory = () => {
    if (!historyToDeleteId) return;
    setHistoryDrafts(prev => {
      const next = prev.filter(h => h.id !== historyToDeleteId);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('sakti_pendaftaran_all_history', JSON.stringify(next));
      }
      saveSaktiHistoryToFirestore(next).catch(() => {});
      return next;
    });
    setHistoryToDeleteId(null);
    setSaveToast('Catatan riwayat berhasil dihapus');
  };

  // Import users from Kelola Satker
  const handleImportUsersFromKelolaSatker = (
    importedUsers: UserSaktiRecord[],
    kpaInfo?: { nama: string; nip: string }
  ) => {
    setDraft(prev => {
      // Merge users, avoid exact duplicate NIP
      const existingNips = new Set(prev.users.map(u => u.nip.replace(/\D/g, '')));
      const newUsersToAdd = importedUsers.filter(u => !existingNips.has(u.nip.replace(/\D/g, '')));

      return {
        ...prev,
        users: [...prev.users, ...newUsersToAdd],
        namaKpa: kpaInfo?.nama || prev.namaKpa,
        nipKpa: kpaInfo?.nip || prev.nipKpa,
        status: 'DRAFT',
        updatedAt: new Date().toISOString()
      };
    });
    setSaveToast(`✓ Berhasil mengimpor ${importedUsers.length} data pegawai dari Kelola Data Satker`);
  };

  const kodeBaCurrent = currentSatker.kodeBa || resolveKodeBA(currentSatker);
  const klCurrent = currentSatker.kementerianLembaga || resolveSatkerKementerian(currentSatker);

  return (
    <div className="space-y-5 pb-12">
      {/* Toast Notification */}
      {saveToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-emerald-500/40 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold">{saveToast}</span>
        </div>
      )}

      {/* Main Module Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 text-white p-5 sm:p-7 border border-teal-500/30 shadow-xl">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          {/* Title & Description */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-400/30 flex items-center gap-1.5 shadow-xs">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Modul Registrasi Resmi
              </span>
              <span className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                Template SAKTI Kemenkeu
              </span>
              {isAdminAuthenticated ? (
                <span className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full bg-purple-500/30 text-purple-200 border border-purple-400/40 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-purple-300" />
                  Mode Administrator KPPN
                </span>
              ) : isCurrentSatkerUnlocked ? (
                <span className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                  <Unlock className="w-3 h-3 text-emerald-300" />
                  Akses Satker Terverifikasi
                </span>
              ) : (
                <span className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full bg-slate-500/30 text-slate-300 border border-slate-400/30 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-slate-300" />
                  Terlindungi Password
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              📝 Administrasi User & Email
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Modul administrasi terpadu pendaftaran pengguna SAKTI, pengajuan perubahan user & peran, penerbitan SK penetapan resmi, dan permohonan email kedinasan Kemenkeu per Satker.
            </p>
          </div>

          {/* Metrics / Status Badges */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
            {/* User Count Badge */}
            <div className="px-3.5 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-left">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Jumlah User</p>
              <p className="text-base sm:text-lg font-black text-white flex items-center gap-1.5">
                <Users className="w-4 h-4 text-teal-400" />
                {draft.users.length} <span className="text-xs font-normal text-slate-300">Pegawai</span>
              </p>
            </div>

            {/* Total Roles Badge */}
            <div className="px-3.5 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-left">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Jumlah Role</p>
              <p className="text-base sm:text-lg font-black text-teal-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                {totalRoleCount} <span className="text-xs font-normal text-slate-300">Role</span>
              </p>
            </div>

            {/* Riwayat Count Badge */}
            <div 
              onClick={() => setActiveWorkspaceTab('RIWAYAT')}
              className="px-3.5 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-left cursor-pointer hover:bg-white/20 transition-all"
              title="Buka riwayat pendaftaran Satker"
            >
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Riwayat Satker</p>
              <p className="text-base sm:text-lg font-black text-white flex items-center gap-1.5">
                <History className="w-4 h-4 text-indigo-400" />
                {currentSatkerHistory.length} <span className="text-xs font-normal text-slate-300">Arsip</span>
              </p>
            </div>

            {/* Validation Status Badge */}
            <div 
              onClick={() => setIsValidModalOpen(true)}
              className={`px-3.5 py-2 rounded-2xl border text-left cursor-pointer transition-all hover:scale-105 ${
                validationResult.isValid
                  ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                  : 'bg-rose-500/20 border-rose-400/40 text-rose-300'
              }`}
              title="Klik untuk melihat rincian audit validasi"
            >
              <p className="text-[10px] font-bold uppercase tracking-wider">Status Validasi</p>
              <p className="text-sm sm:text-base font-black flex items-center gap-1.5">
                {validationResult.isValid ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>SIAP EKSPOR</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                    <span>{validationResult.issues.filter(i => i.severity === 'ERROR').length} PERLU DIUBAH</span>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Workspace Active Satker Ribbon & Tab Switcher */}
        <div className="mt-5 pt-4 border-t border-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Active Satker Badge with Lock/Unlock controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="p-1 rounded-xl bg-slate-950/70 border border-slate-700 flex items-center gap-2 px-3 py-1.5">
              <span className="text-xs font-mono font-bold text-teal-300 bg-teal-950/60 px-2 py-0.5 rounded border border-teal-800">
                {currentSatker.kodeSatker}
              </span>
              <span className="text-xs font-bold text-white max-w-[220px] sm:max-w-xs truncate">
                {currentSatker.namaSatker}
              </span>
              {isAdminAuthenticated && kodeBaCurrent && (
                <span className="text-[10px] font-bold text-indigo-300 bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-800">
                  BA: {kodeBaCurrent}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsSatkerSelectorOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer border border-white/20 flex items-center gap-1.5"
              title="Buka daftar referensi lengkap Satker KPPN Semarang I"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Ganti Satker ({completeSatkerList.length})</span>
            </button>

            {isCurrentSatkerUnlocked && !isAdminAuthenticated && (
              <>
                <SatkerSessionTimerBadge
                  remainingSeconds={remainingSeconds}
                  formattedRemaining={formattedRemaining}
                  timeoutMinutes={timeoutMinutes}
                  isWarning={isSessionWarning}
                  onResetTimer={resetSessionTimer}
                  onSetTimeoutMinutes={setTimeoutMinutes}
                  onLockNow={handleLockCurrentSatker}
                  satkerKode={currentSatker.kodeSatker}
                  satkerNama={currentSatker.namaSatker}
                />

                <button
                  type="button"
                  onClick={handleLockCurrentSatker}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-400/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  title="Kunci kembali akses privat Satker ini"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Kunci Kembali</span>
                </button>
              </>
            )}

            {/* Cloud Firestore Sync Button / Badge */}
            <button
              type="button"
              onClick={() => syncWithCloud(currentSatker.kodeSatker, draft, historyDrafts, true)}
              disabled={isCloudSyncing}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 shadow-xs ${
                cloudSyncStatus === 'synced'
                  ? 'bg-emerald-950/70 text-emerald-300 border-emerald-700/80 hover:bg-emerald-900/60'
                  : isCloudSyncing
                  ? 'bg-sky-950/70 text-sky-300 border-sky-700/80 animate-pulse'
                  : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white'
              }`}
              title={`Sinkronisasi Cloud Firestore. Menjaga data formulir & riwayat tetap sinkron antara Google AI Studio & Server Deployment. ${lastCloudSyncTime ? `Terakhir disinkronkan: ${lastCloudSyncTime}` : 'Klik untuk sinkronkan sekarang.'}`}
            >
              <Cloud className={`w-3.5 h-3.5 ${isCloudSyncing ? 'animate-bounce text-sky-400' : cloudSyncStatus === 'synced' ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span>
                {isCloudSyncing ? 'Sinkronisasi...' : cloudSyncStatus === 'synced' ? `Cloud Sinkron${lastCloudSyncTime ? ` (${lastCloudSyncTime})` : ''}` : 'Sinkronkan Cloud'}
              </span>
            </button>
          </div>

          {/* Primary View Switcher: 4 Integrated Tabs + Arsip */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-700/80">
            {/* Tab 1: Pendaftaran User SAKTI */}
            <button
              type="button"
              onClick={() => setActiveWorkspaceTab('FORM')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeWorkspaceTab === 'FORM'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>📋 Pendaftaran User</span>
            </button>

            {/* Tab 2: Perubahan User SAKTI */}
            <button
              type="button"
              onClick={() => setActiveWorkspaceTab('PERUBAHAN')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeWorkspaceTab === 'PERUBAHAN'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Pengajuan perubahan peran dan data pengguna SAKTI yang sudah terdaftar"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-300" />
              <span>🔄 Perubahan User</span>
            </button>

            {/* Tab 3: Pemutakhiran Kewenangan */}
            <button
              type="button"
              onClick={() => setActiveWorkspaceTab('PEMUTAKHIRAN')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeWorkspaceTab === 'PEMUTAKHIRAN'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Formulir Pemutakhiran Kewenangan Pengguna SAKTI (Master Template Asli)"
            >
              <Lock className="w-3.5 h-3.5 text-amber-300" />
              <span>🔐 Pemutakhiran Kewenangan</span>
            </button>

            {/* Tab 4: Pemutakhiran Data Pengguna */}
            <button
              type="button"
              onClick={() => setActiveWorkspaceTab('PEMUTAKHIRAN_DATA')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeWorkspaceTab === 'PEMUTAKHIRAN_DATA'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Formulir Pemutakhiran Data Pengguna SAKTI (Master Template 10 Kolom)"
            >
              <Users className="w-3.5 h-3.5 text-teal-300" />
              <span>👤 Pemutakhiran Data</span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-teal-400/20 text-teal-300 font-black border border-teal-400/30">
                BARU
              </span>
            </button>

            {/* Tab 5: Generate SK SAKTI */}
            <button
              type="button"
              onClick={() => setActiveWorkspaceTab('GENERATE_SK')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeWorkspaceTab === 'GENERATE_SK'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Generate Surat Keputusan (SK) Penetapan User SAKTI sesuai template resmi"
            >
              <FileText className="w-3.5 h-3.5 text-amber-300" />
              <span>📄 Generate SK</span>
            </button>

            {/* Tab 4: Pendaftaran Email */}
            <button
              type="button"
              onClick={() => setActiveWorkspaceTab('EMAIL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeWorkspaceTab === 'EMAIL'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Pendaftaran email kedinasan Kemenkeu pegawai Satker"
            >
              <Mail className="w-3.5 h-3.5 text-teal-300" />
              <span>📧 Pendaftaran Email</span>
            </button>

            {/* Tab Arsip Riwayat */}
            <button
              type="button"
              onClick={() => setActiveWorkspaceTab('RIWAYAT')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                activeWorkspaceTab === 'RIWAYAT'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Arsip ({currentSatkerHistory.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* CONDITIONAL GATEKEEPER RENDER */}
      {!isCurrentSatkerUnlocked ? (
        <SatkerPasswordGatekeeper
          satker={currentSatker}
          onSuccess={handleUnlockSuccess}
          onOpenSatkerSelector={() => setIsSatkerSelectorOpen(true)}
          isAdminAuthenticated={isAdminAuthenticated}
        />
      ) : activeWorkspaceTab === 'PERUBAHAN' ? (
        /* TAB 2: PERUBAHAN USER SAKTI VIEW */
        <PerubahanUserSaktiTab
          satker={currentSatker}
          existingUsers={draft.users}
          levelSatker={draft.levelSatker}
          kpaName={draft.namaKpa}
          kpaNip={draft.nipKpa}
          userName={isAdminAuthenticated ? 'Admin KPPN' : currentSatker.namaSatker}
        />
      ) : activeWorkspaceTab === 'PEMUTAKHIRAN' ? (
        /* TAB 3: PEMUTAKHIRAN KEWENANGAN SAKTI VIEW */
        <PemutakhiranKewenanganTab
          satker={currentSatker}
          existingUsers={draft.users}
          levelSatker={draft.levelSatker}
          kpaName={draft.namaKpa}
          kpaNip={draft.nipKpa}
          userName={isAdminAuthenticated ? 'Admin KPPN' : currentSatker.namaSatker}
        />
      ) : activeWorkspaceTab === 'PEMUTAKHIRAN_DATA' ? (
        /* TAB 4: PEMUTAKHIRAN DATA PENGGUNA SAKTI VIEW */
        <PemutakhiranDataPenggunaTab
          satker={currentSatker}
          existingUsers={draft.users}
          levelSatker={draft.levelSatker}
          kpaName={draft.namaKpa}
          kpaNip={draft.nipKpa}
          userName={isAdminAuthenticated ? 'Admin KPPN' : currentSatker.namaSatker}
          onSaveUserToMaster={(updatedUser) => {
            setDraft(prev => ({
              ...prev,
              users: prev.users.map(u => u.id === updatedUser.id ? updatedUser : u),
              updatedAt: new Date().toISOString()
            }));
          }}
        />
      ) : activeWorkspaceTab === 'EMAIL' ? (
        /* TAB 4: PENDAFTARAN EMAIL VIEW */
        <PendaftaranEmailTab
          satker={currentSatker}
          userSaktiDraft={draft}
          userName={isAdminAuthenticated ? 'Admin KPPN' : currentSatker.namaSatker}
        />
      ) : activeWorkspaceTab === 'GENERATE_SK' ? (
        /* TAB 3: GENERATE SK SAKTI VIEW */
        <GenerateSkSaktiView
          kodeSatker={currentSatker.kodeSatker}
          namaSatker={currentSatker.namaSatker}
          levelSatker={draft.levelSatker}
          kpaName={draft.namaKpa}
          kpaNip={draft.nipKpa}
          users={draft.users}
          onUpdateUsers={(updatedUsers) => {
            setDraft(prev => ({
              ...prev,
              users: updatedUsers,
              updatedAt: new Date().toISOString()
            }));
          }}
          currentUser={isAdminAuthenticated ? 'Admin KPPN' : currentSatker.namaSatker}
        />
      ) : activeWorkspaceTab === 'RIWAYAT' ? (
        /* RIWAYAT VIEW */
        <RiwayatPembentukanUserView
          satker={currentSatker}
          historyDrafts={historyDrafts}
          onLoadDraft={handleLoadDraftFromHistory}
          onDeleteHistory={handleDeleteHistory}
          onExportExcel={handleExportExcel}
          onExportPDF={handleExportPDF}
          onCreateNewForm={handleCreateNewForm}
          isAdminAuthenticated={isAdminAuthenticated}
        />
      ) : (
        /* FORMULIR PENDAFTARAN VIEW */
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Sub-bar Form Controls & Wizard Mode Switcher */}
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setViewMode('TABLE')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    viewMode === 'TABLE'
                      ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <ListFilter className="w-3.5 h-3.5" />
                  <span>Tampilan Tabel</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('WIZARD')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    viewMode === 'WIZARD'
                      ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Panduan Langkah (Wizard)</span>
                </button>
              </div>

              {/* Import from Kelola Satker button */}
              <button
                type="button"
                onClick={() => setIsImportKelolaModalOpen(true)}
                className="px-3.5 py-2 text-xs font-bold rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                title="Tarik data pejabat & operator yang sudah tercatat di Kelola Data Satker"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Ambil dari Kelola Satker</span>
              </button>

              {/* Shortcut to Generate SK SAKTI */}
              <button
                type="button"
                onClick={() => setActiveWorkspaceTab('GENERATE_SK')}
                className="px-3.5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                title="Buka pembuat Surat Keputusan (SK) SAKTI resmi"
              >
                <FileText className="w-3.5 h-3.5 text-amber-300" />
                <span>Generate SK SAKTI</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCreateNewForm}
                className="px-3 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Formulir Baru</span>
              </button>

              <button
                type="button"
                onClick={handleSaveDraft}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-500 text-white shadow-md shadow-teal-600/20 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Draft</span>
              </button>
            </div>
          </div>

          {/* Wizard Progress Steps (If Wizard Mode is active) */}
          {viewMode === 'WIZARD' && (
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between overflow-x-auto no-scrollbar gap-2">
                {[
                  { step: 1, label: 'Info Satker' },
                  { step: 2, label: 'Daftar Pegawai' },
                  { step: 3, label: 'Audit Validasi' },
                  { step: 4, label: 'Ekspor Berkas' }
                ].map((s) => (
                  <button
                    key={s.step}
                    type="button"
                    onClick={() => setWizardStep(s.step)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      wizardStep === s.step
                        ? 'bg-teal-600 text-white shadow-sm'
                        : wizardStep > s.step
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                      wizardStep === s.step
                        ? 'bg-white text-teal-700'
                        : wizardStep > s.step
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}>
                      {wizardStep > s.step ? '✓' : s.step}
                    </span>
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Section 1: Informasi Satker & Penandatangan */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Building className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    1. Informasi Satuan Kerja (Satker)
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      Terverifikasi KPPN
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Data Satker tersinkronisasi otomatis dengan basis referensi resmi KPPN Semarang I
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSatkerSelectorOpen(true)}
                  className="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:border-teal-500 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-all cursor-pointer bg-slate-50 dark:bg-slate-800"
                >
                  <Search className="w-3.5 h-3.5 text-slate-400" />
                  <span>Pilih dari 125 Satker</span>
                </button>
              </div>
            </div>

            {/* Satker Information Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* Kode Satker (READONLY) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span>Kode Satker</span>
                  <span className="text-[10px] text-slate-400 font-normal flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> Terkunci
                  </span>
                </label>
                <input
                  type="text"
                  readOnly
                  value={draft.kodeSatker}
                  className="w-full text-xs font-mono font-black px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 cursor-not-allowed select-all"
                />
              </div>

              {/* Nama Satker (READONLY) */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span>Nama Satker</span>
                  <span className="text-[10px] text-slate-400 font-normal flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> Terkunci
                  </span>
                </label>
                <input
                  type="text"
                  readOnly
                  value={draft.namaSatker}
                  className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 cursor-not-allowed select-all truncate"
                />
              </div>

              {/* Level Satker (Dropdown Reference) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Level Satker <span className="text-rose-500">*</span>
                </label>
                <select
                  value={draft.levelSatker}
                  onChange={e => {
                    const val = e.target.value;
                    const isBLU = val === 'Badan Layanan Umum (BLU)';
                    setDraft(prev => ({
                      ...prev,
                      levelSatker: val,
                      isBLU: isBLU || prev.isBLU,
                      updatedAt: new Date().toISOString()
                    }));
                  }}
                  className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                >
                  {LEVEL_SATKER_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Judul Pengajuan & Satker Meta Detail */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Keterangan / Judul Pengajuan Internal:
                </label>
                <input
                  type="text"
                  value={draft.judulPengajuan || ''}
                  onChange={e => setDraft(prev => ({ ...prev, judulPengajuan: e.target.value }))}
                  placeholder="Contoh: Pemutakhiran Operator SPM & Komitmen SAKTI TA 2026"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Kementerian / Lembaga:
                </label>
                <input
                  type="text"
                  readOnly
                  value={klCurrent}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 truncate cursor-not-allowed"
                />
              </div>
            </div>

            {/* BLU Indicator & Info */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={draft.isBLU}
                  onChange={e => setDraft(prev => ({ ...prev, isBLU: e.target.checked }))}
                  className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Satker Berstatus BLU (Badan Layanan Umum)
                </span>
              </label>

              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {draft.isBLU 
                  ? '🟢 Role khusus BLU (Validator Anggaran & SPI) terbuka untuk dipilih'
                  : '🔒 Role Validator Anggaran & SPI khusus untuk satker berstatus BLU'}
              </span>
            </div>
          </div>

          {/* Section 2: Action Toolbar & User List */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-teal-600" />
                  2. Daftar Pengguna SAKTI ({draft.users.length} Pengguna)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Kelola data nama, NIP, kontak, dasar SK, dan peran SAKTI untuk masing-masing pegawai
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Import from Kelola Satker Button */}
                <button
                  type="button"
                  onClick={() => setIsImportKelolaModalOpen(true)}
                  className="px-3.5 py-2 text-xs font-bold rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                  title="Tarik data pejabat & operator yang sudah tercatat di database Satker"
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Ambil dari Kelola Satker</span>
                </button>

                {/* Add User Button */}
                <button
                  type="button"
                  onClick={() => {
                    setEditingUser(null);
                    setIsUserModalOpen(true);
                  }}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white shadow-md shadow-teal-600/20 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Masukan Data Pengguna</span>
                </button>

                {/* Validate Button */}
                <button
                  type="button"
                  onClick={() => setIsValidModalOpen(true)}
                  className="px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4 text-indigo-500" />
                  <span>Validasi Formulir</span>
                </button>

                {/* Excel Preview Button */}
                <button
                  type="button"
                  onClick={() => setIsExcelPreviewOpen(true)}
                  className="px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Eye className="w-4 h-4 text-amber-500" />
                  <span>Preview Excel</span>
                </button>

                {/* Download Excel Button */}
                <button
                  type="button"
                  onClick={() => handleExportExcel()}
                  disabled={!validationResult.isValid}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md ${
                    validationResult.isValid
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400 border border-slate-300 dark:border-slate-700 cursor-not-allowed opacity-60'
                  }`}
                  title={validationResult.isValid ? 'Unduh file Excel resmi' : 'Selesaikan audit validasi untuk mengunduh Excel'}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Download Excel</span>
                </button>

                {/* Download PDF Button */}
                <button
                  type="button"
                  onClick={() => handleExportPDF()}
                  disabled={!validationResult.isValid}
                  className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md ${
                    validationResult.isValid
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400 border border-slate-300 dark:border-slate-700 cursor-not-allowed opacity-60'
                  }`}
                  title={validationResult.isValid ? 'Unduh berkas PDF resmi' : 'Selesaikan audit validasi untuk mengunduh PDF'}
                >
                  <FileText className="w-4 h-4" />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>

            {/* Users Table / Choice Panel */}
            {draft.users.length === 0 ? (
              <div className="p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 space-y-6">
                <div className="text-center max-w-xl mx-auto space-y-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 inline-block">
                    Satker {currentSatker.kodeSatker} - {currentSatker.namaSatker}
                  </span>
                  <h4 className="text-base sm:text-lg font-black text-slate-800 dark:text-white">
                    Pilih Cara Pengisian Data Pengguna SAKTI
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Formulir belum memiliki data pengguna. Anda dapat menarik data pejabat &amp; operator yang sudah ada di database Satker atau memasukkan data baru secara manual.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                  {/* Card 1: Ambil dari Kelola Satker */}
                  <div
                    onClick={() => setIsImportKelolaModalOpen(true)}
                    className="p-5 rounded-2xl border-2 border-indigo-200 dark:border-indigo-800/80 bg-white dark:bg-slate-800/80 hover:border-indigo-500 dark:hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Sparkles className="w-5 h-5 text-amber-500" />
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                          Otomatis
                        </span>
                      </div>
                      <div>
                        <h5 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          Ambil dari Kelola Satker
                        </h5>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                          Tarik data pejabat (KPA, PPK, PPSPM, Bendahara) &amp; operator yang telah terdaftar di database master Satker KPPN Semarang I.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsImportKelolaModalOpen(true);
                      }}
                      className="mt-4 w-full py-2.5 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Ambil Data Satker</span>
                    </button>
                  </div>

                  {/* Card 2: Masukan Data Satker Secara Manual */}
                  <div
                    onClick={() => {
                      setEditingUser(null);
                      setIsUserModalOpen(true);
                    }}
                    className="p-5 rounded-2xl border-2 border-teal-200 dark:border-teal-800/80 bg-white dark:bg-slate-800/80 hover:border-teal-500 dark:hover:border-teal-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/80 text-teal-600 dark:text-teal-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Plus className="w-5 h-5" />
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300">
                          Manual
                        </span>
                      </div>
                      <div>
                        <h5 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                          Masukan Data Satker Baru
                        </h5>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                          Input formulir pendaftaran pengguna SAKTI secara mandiri dengan memilih peran jabatan dan kewenangan modul SAKTI.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingUser(null);
                        setIsUserModalOpen(true);
                      }}
                      className="mt-4 w-full py-2.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white shadow-md shadow-teal-600/20 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Masukan Data Pengguna</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[950px]">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold border-b border-slate-200 dark:border-slate-700">
                      <th className="py-3 px-3 w-10 text-center">No</th>
                      <th className="py-3 px-3">Nama &amp; NIP / Kedinasan</th>
                      <th className="py-3 px-3">Kewenangan SK</th>
                      <th className="py-3 px-3">NIK &amp; NPWP</th>
                      <th className="py-3 px-3">Kontak Aktif</th>
                      <th className="py-3 px-4">Role SAKTI Terpilih</th>
                      <th className="py-3 px-3">Dasar SK</th>
                      <th className="py-3 px-3 text-center w-24">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                    {draft.users.map((user, idx) => {
                      const roleString = formatRolesForExcel(user.roles || []);
                      const cleanPhone = user.noHp || '-';
                      const cleanNIP = user.nip || '-';

                      return (
                        <tr key={user.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-3 text-center font-mono font-bold text-slate-400">
                            {idx + 1}
                          </td>

                          {/* Nama & NIP & Kedinasan */}
                          <td className="py-3 px-3">
                            <p className="font-bold text-slate-900 dark:text-white">
                              {user.namaLengkap}
                            </p>
                            <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              NIP. {cleanNIP}
                            </p>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-1.5">
                              {user.pangkatGolongan && (
                                <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">
                                  {user.pangkatGolongan}
                                </span>
                              )}
                              {user.jabatan && (
                                <span className="text-slate-400 truncate max-w-[140px]" title={user.jabatan}>
                                  • {user.jabatan}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Kewenangan SK SAKTI */}
                          <td className="py-3 px-3">
                            <div className="space-y-1">
                              <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                user.peranJabatan === 'Approval' ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800' :
                                user.peranJabatan === 'Validator' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800' :
                                user.peranJabatan === 'Admin' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800' :
                                'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                              }`}>
                                {user.peranJabatan || 'Operator'}
                              </span>
                              <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[160px]" title={user.jabatanPerbendaharaan}>
                                {user.jabatanPerbendaharaan || 'Operator Anggaran'}
                              </p>
                            </div>
                          </td>

                          {/* NIK & NPWP */}
                          <td className="py-3 px-3">
                            <p className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                              NIK: {user.nik || '-'}
                            </p>
                            <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              NPWP: {user.npwp || '-'}
                            </p>
                          </td>

                          {/* Kontak */}
                          <td className="py-3 px-3">
                            <p className="text-[11px] text-slate-700 dark:text-slate-300 truncate max-w-[180px]">
                              {user.email}
                            </p>
                            <p className="font-mono text-[11px] text-teal-700 dark:text-teal-400 mt-0.5">
                              {cleanPhone}
                            </p>
                          </td>

                          {/* Roles */}
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap items-center gap-1 mb-1">
                              {user.roles?.map(code => (
                                <span 
                                  key={code}
                                  className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800"
                                >
                                  {MASTER_ROLE_MAP[code]?.roleName || code}
                                </span>
                              ))}
                            </div>
                            <p className="font-mono text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-sm" title={roleString}>
                              Excel: {roleString}
                            </p>
                          </td>

                          {/* SK */}
                          <td className="py-3 px-3">
                            <p className="text-[11px] font-medium text-slate-900 dark:text-white">
                              {user.nomorSk}
                            </p>
                            <p className="font-mono text-[11px] text-slate-400 mt-0.5">
                              Tgl: {user.tanggalSk}
                            </p>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingUser(user);
                                  setIsUserModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                title="Edit Data Pengguna"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(user.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                title="Hapus Pengguna"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 3: Pengaturan Penandatangan KPA */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <FileText className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                3. Data Penandatangan Dokumen (Kuasa Pengguna Anggaran / KPA)
              </h3>
              <span className="text-[10px] text-slate-400">Khusus Tanda Tangan PDF Resmi</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Nama Kepala Satker / KPA
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Dr. Ir. Sutrisno, M.M."
                  value={draft.namaKpa || ''}
                  onChange={e => setDraft({ ...draft, namaKpa: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  NIP Kepala Satker / KPA
                </label>
                <input
                  type="text"
                  placeholder="197501021998031001"
                  value={draft.nipKpa || ''}
                  onChange={e => setDraft({ ...draft, nipKpa: e.target.value.replace(/\D/g, '').slice(0, 18) })}
                  className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Tempat Penetapan
                </label>
                <input
                  type="text"
                  placeholder="Semarang"
                  value={draft.tempatPenetapan || ''}
                  onChange={e => setDraft({ ...draft, tempatPenetapan: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Tanggal Penetapan
                </label>
                <input
                  type="date"
                  value={draft.tanggalPenetapan || ''}
                  onChange={e => setDraft({ ...draft, tanggalPenetapan: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <UserSaktiModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        onSave={handleSaveUser}
        initialData={editingUser}
        isBLU={draft.isBLU}
        existingUsers={draft.users}
      />

      <ValidationSummaryModal
        isOpen={isValidModalOpen}
        onClose={() => setIsValidModalOpen(false)}
        validationResult={validationResult}
        users={draft.users}
        onSelectUserToEdit={(user) => {
          setEditingUser(user);
          setIsUserModalOpen(true);
        }}
        onExportExcel={() => handleExportExcel()}
        onExportPDF={() => handleExportPDF()}
      />

      <ExcelPreviewModal
        isOpen={isExcelPreviewOpen}
        onClose={() => setIsExcelPreviewOpen(false)}
        draft={draft}
        onDownload={() => handleExportExcel()}
      />

      {/* Satker Reference Selector Modal */}
      <SatkerSelectorModal
        isOpen={isSatkerSelectorOpen}
        onClose={() => setIsSatkerSelectorOpen(false)}
        satkers={completeSatkerList}
        selectedKodeSatker={currentSatker.kodeSatker}
        activeUnlockedSatkerKode={activeUnlockedSatkerKode}
        onSelectSatker={handleSelectSatker}
        isAdminAuthenticated={isAdminAuthenticated}
      />

      {/* Import from Kelola Satker Modal */}
      <ImportKelolaSatkerModal
        isOpen={isImportKelolaModalOpen}
        onClose={() => setIsImportKelolaModalOpen(false)}
        satker={currentSatker}
        onImportUsers={handleImportUsersFromKelolaSatker}
      />

      {/* In-App Confirmation Modal: Hapus Pengguna SAKTI */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  Hapus Data Pengguna?
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Apakah Anda yakin ingin menghapus data pegawai ini dari daftar formulir pendaftaran SAKTI?
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-slate-900 dark:text-white text-sm truncate">
                  {userToDelete.namaLengkap}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 shrink-0">
                  {userToDelete.peranJabatan || 'Operator'}
                </span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                NIP. {userToDelete.nip || '-'}
              </p>
              {userToDelete.email && (
                <p className="text-slate-500 dark:text-slate-400 text-[11px] truncate">
                  Email: {userToDelete.email}
                </p>
              )}
              {userToDelete.roles && userToDelete.roles.length > 0 && (
                <div className="pt-1 flex flex-wrap gap-1">
                  {userToDelete.roles.map(r => (
                    <span 
                      key={r} 
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800"
                    >
                      {MASTER_ROLE_MAP[r]?.roleName || r}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 text-xs font-bold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteUser}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Pengguna</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Confirmation Modal: Hapus Arsip Riwayat */}
      {historyToDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  Hapus Arsip Riwayat?
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Apakah Anda yakin ingin menghapus catatan arsip riwayat pendaftaran ini dari basis data lokal Satker?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setHistoryToDeleteId(null)}
                className="px-4 py-2 text-xs font-bold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteHistory}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Riwayat</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Confirmation Modal: Buat Formulir Baru */}
      {isConfirmNewFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-teal-100 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                <Plus className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  Buat Formulir Baru?
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Formulir saat ini ({draft.users.length} pengguna) akan otomatis disimpan ke dalam arsip riwayat Satker sebelum formulir baru dikosongkan.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmNewFormOpen(false)}
                className="px-4 py-2 text-xs font-bold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={executeCreateNewForm}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-500 text-white shadow-md shadow-teal-600/20 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Ya, Buat Formulir Baru</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auto-Lock / Inactivity Session Expired Modal */}
      <SatkerSessionExpiredModal
        isOpen={isSessionExpiredModalOpen}
        timeoutMinutes={timeoutMinutes}
        satkerKode={currentSatker.kodeSatker}
        satkerNama={currentSatker.namaSatker}
        onClose={() => setIsSessionExpiredModalOpen(false)}
      />
    </div>
  );
};
