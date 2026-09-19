import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FileText,
  Calendar,
  Clock,
  Coins,
  CreditCard,
  Target,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Percent,
  Sliders,
  Sparkles,
  ArrowRight,
  Info,
  Layers,
  HelpCircle,
  Plus,
  Trash2,
  RotateCcw,
  Eraser,
  Cloud,
  ShieldCheck,
  ShieldAlert,
  Zap,
  Building,
  ArrowUpDown,
  FileSpreadsheet,
  Download,
  Upload,
  Printer,
  Copy,
  Edit2,
  Save,
  Lock,
  Unlock,
  KeyRound,
  Eye,
  EyeOff,
  Search,
  AlertCircle,
  LogOut,
  RefreshCw
} from 'lucide-react';
import { SatkerIKPA, AppTheme, PerhitunganIkpaExcelReference } from '../../types';
import { SimulationProject, DeviasiHal3Row, PenyerapanInput } from '../../models/ikpa';
import { calculateIKPA } from '../../calculations/ikpa';
import { buildDefault12MonthsKetepatan } from '../../calculations/capaianOutput';
import { getWorkbookSampleProject } from '../../calculations/sampleWorkbookData';
import { sanitizeProjectDates } from '../../utils/ikpaDateUtils';
import { verifySatkerPassword, resolveKodeBA } from '../../utils/satkerSecurity';
import { useSatkerInactivityTimeout } from '../../hooks/useSatkerInactivityTimeout';
import { SatkerSessionTimerBadge, SatkerSessionExpiredModal } from '../satker/SatkerSessionSecurityControls';
import {
  saveSimulationToCloud,
  fetchSimulationFromCloud,
  subscribeSimulationFromCloud,
  subscribeSyncState,
  CloudSyncState,
  fetchSatkerSimulationFromCloud,
  saveSatkerSimulationToCloud
} from '../../services/simulationCloudSync';
import {
  getAllProjects,
  getProjectById,
  saveProject,
  deleteProject,
  duplicateProject,
  getActiveProjectId,
  setActiveProjectId,
  createEmptyProject
} from '../../storage/indexedDb';

import { FormulaInspectorModal } from './formulaInspectorModal';
import { KosongkanFormulirModal } from './common/KosongkanFormulirModal';
import { CloudSatkerSyncModal } from './common/CloudSatkerSyncModal';
import { InterfaceTab } from './tabs/InterfaceTab';
import { DashboardTab } from './tabs/DashboardTab';
import { RevisiDipaTab } from './tabs/RevisiDipaTab';
import { DeviasiHal3Tab } from './tabs/DeviasiHal3Tab';
import { PenyerapanTab } from './tabs/PenyerapanTab';
import { KontraktualTab } from './tabs/KontraktualTab';
import { TagihanTab } from './tabs/TagihanTab';
import { UpTupTab } from './tabs/UpTupTab';
import { CapaianOutputTab } from './tabs/CapaianOutputTab';
import { DispensasiTab } from './tabs/DispensasiTab';
import { SkenarioTab } from './tabs/SkenarioTab';

export type MasterSimulatorTab =
  | 'interface'
  | 'dashboard'
  | 'revisi-dipa'
  | 'deviasi-hal3'
  | 'penyerapan'
  | 'kontraktual'
  | 'tagihan'
  | 'up-tup'
  | 'capaian-output'
  | 'dispensasi-spm'
  | 'skenario';

interface IndikatorPerTabSimulatorProps {
  satkers?: SatkerIKPA[];
  selectedSatkerId?: string;
  onSelectSatker?: (satkerId: string) => void;
  onApplyScoreToMainSimulator?: (indicatorId: string, score: number) => void;
  activeExcelReference?: PerhitunganIkpaExcelReference;
  theme: AppTheme;
  initialTab?: MasterSimulatorTab;
  isAdminAuthenticated?: boolean;
  onOpenAdminAuth?: () => void;
}

export const IndikatorPerTabSimulator: React.FC<IndikatorPerTabSimulatorProps> = ({
  satkers = [],
  selectedSatkerId,
  onSelectSatker,
  onApplyScoreToMainSimulator,
  activeExcelReference,
  theme,
  initialTab = 'interface',
  isAdminAuthenticated = false,
  onOpenAdminAuth
}) => {
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState<MasterSimulatorTab>(
    initialTab === 'dashboard' ? 'interface' : initialTab
  );

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab === 'dashboard' ? 'interface' : initialTab);
    }
  }, [initialTab]);

  // Satker Authentication State (Security Gatekeeper)
  // KEAMANAN AKSES: Status login Satker hanya disimpan di memori (React state).
  // Saat browser di-refresh (F5), reload, atau ditutup, status login otomatis HANGUS / LOGOUT
  // sehingga pengguna wajib memasukkan password kembali demi menjaga keamanan data satker.
  const [unlockedSatkerKode, setUnlockedSatkerKode] = useState<string>('');

  // Pastikan sesi penyimpanan browser lama dibersihkan saat halaman dimuat
  useEffect(() => {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('kppn_unlocked_simulasi_satker');
    }
  }, []);

  // Keep unlockedSatkerKode aligned if Admin switches selectedSatkerId
  useEffect(() => {
    if (isAdminAuthenticated && selectedSatkerId) {
      setUnlockedSatkerKode(selectedSatkerId);
    } else if (!isAdminAuthenticated && selectedSatkerId && selectedSatkerId !== unlockedSatkerKode) {
      // Keamanan Satker: setiap pergantian satker otomatis mengunci & logout sesi sebelumnya
      setUnlockedSatkerKode('');
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('kppn_unlocked_simulasi_satker');
      }
    }
  }, [isAdminAuthenticated, selectedSatkerId]);

  // Determine if simulation is unlocked
  const isUnlocked = useMemo(() => {
    if (isAdminAuthenticated) return true;
    if (!unlockedSatkerKode) return false;
    return satkers.some(s => s.kodeSatker === unlockedSatkerKode);
  }, [isAdminAuthenticated, unlockedSatkerKode, satkers]);

  // Authenticated Satker object
  const authenticatedSatker = useMemo(() => {
    if (isAdminAuthenticated) {
      return satkers.find(s => s.kodeSatker === (selectedSatkerId || unlockedSatkerKode) || s.id === (selectedSatkerId || unlockedSatkerKode)) || satkers[0];
    }
    return satkers.find(s => s.kodeSatker === unlockedSatkerKode || s.id === unlockedSatkerKode);
  }, [isAdminAuthenticated, selectedSatkerId, unlockedSatkerKode, satkers]);

  // Gatekeeper Form States
  const [authSelectedKode, setAuthSelectedKode] = useState<string>(() => {
    if (selectedSatkerId) return selectedSatkerId;
    return satkers[0]?.kodeSatker || '';
  });
  const [authPasswordInput, setAuthPasswordInput] = useState<string>('');
  const [showAuthPassword, setShowAuthPassword] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSearchQuery, setAuthSearchQuery] = useState<string>('');

  // Sync authSelectedKode if selectedSatkerId or satkers change
  useEffect(() => {
    if (selectedSatkerId && satkers.some(s => s.kodeSatker === selectedSatkerId)) {
      setAuthSelectedKode(selectedSatkerId);
    } else if (!authSelectedKode && satkers.length > 0) {
      setAuthSelectedKode(satkers[0].kodeSatker);
    }
  }, [selectedSatkerId, satkers]);

  // Selected satker in gatekeeper card
  const currentAuthTargetSatker = useMemo(() => {
    return satkers.find(s => s.kodeSatker === authSelectedKode) || satkers[0];
  }, [satkers, authSelectedKode]);

  // Filtered Satkers for gatekeeper selector
  const filteredAuthSatkers = useMemo(() => {
    if (!authSearchQuery.trim()) return satkers;
    const q = authSearchQuery.toLowerCase();
    return satkers.filter(s =>
      (s.kodeSatker || '').toLowerCase().includes(q) ||
      (s.namaSatker || '').toLowerCase().includes(q) ||
      (s.kementerianLembaga || '').toLowerCase().includes(q)
    );
  }, [satkers, authSearchQuery]);

  // Pastikan authSelectedKode selalu sinkron dengan satker yang tampil di filter
  useEffect(() => {
    if (filteredAuthSatkers.length > 0) {
      const isCurrentInFiltered = filteredAuthSatkers.some(s => s.kodeSatker === authSelectedKode);
      if (!isCurrentInFiltered) {
        setAuthSelectedKode(filteredAuthSatkers[0].kodeSatker);
      }
    }
  }, [filteredAuthSatkers, authSelectedKode]);

  const [projects, setProjects] = useState<SimulationProject[]>([]);
  const [activeProject, setActiveProject] = useState<SimulationProject>(() => {
    return createEmptyProject('Simulasi Mandiri (Mulai dari 0)');
  });
  const [baselineProject, setBaselineProject] = useState<SimulationProject>(() => {
    return createEmptyProject('Kondisi Awal (Mulai dari 0)');
  });

  // Sinkronisasi otomatis identitas Satker aktif ke metadata skenario & baris formulir yang belum terisi
  useEffect(() => {
    if (!authenticatedSatker) return;

    const satkerKode = authenticatedSatker.kodeSatker;
    const satkerNama = authenticatedSatker.namaSatker;
    const kppnKode = authenticatedSatker.kodeKppn || '026';

    const currentMeta = activeProject.metadata;
    const needsMetaUpdate =
      !currentMeta?.kodeSatker ||
      currentMeta.kodeSatker !== satkerKode ||
      !currentMeta?.namaSatker ||
      currentMeta.namaSatker === 'Simulasi Mandiri' ||
      !currentMeta?.kodeKPPN ||
      currentMeta.kodeKPPN !== kppnKode;

    const needsTunaiRowsUpdate = (activeProject.upTUPTunai || []).some(
      r => !r.kodeSatker || !r.namaSatker || !r.kodeKPPN || r.kodeKPPN !== kppnKode
    );

    const needsKkpRowsUpdate = (activeProject.upTUPKKP || []).some(
      r => !r.kodeSatker || !r.namaSatker || !r.kodeKPPN || r.kodeKPPN !== kppnKode
    );

    const needsKontraktualUpdate = (activeProject.belanjaKontraktual || []).some(
      r => !r.kodeSatker || r.kodeSatker === '000000' || !r.namaSatker || r.namaSatker === 'SATKER CONTOH' || !r.kodeKPPN || r.kodeKPPN !== kppnKode
    );

    if (needsMetaUpdate || needsTunaiRowsUpdate || needsKkpRowsUpdate || needsKontraktualUpdate) {
      setActiveProject(prev => {
        const updated: SimulationProject = {
          ...prev,
          metadata: {
            ...prev.metadata,
            kodeSatker: satkerKode,
            namaSatker: satkerNama,
            kodeKPPN: kppnKode
          },
          upTUPTunai: (prev.upTUPTunai || []).map(r => {
            const isAccidentalDummy = r.totalGUP === 50000000 && r.totalOutstandingUP === 300000000;
            return {
              ...r,
              kodeSatker: r.kodeSatker || satkerKode,
              namaSatker: r.namaSatker || satkerNama,
              kodeKPPN: r.kodeKPPN || kppnKode,
              totalGUP: isAccidentalDummy ? 0 : r.totalGUP,
              totalOutstandingUP: isAccidentalDummy ? 0 : r.totalOutstandingUP,
              selisihHariKalender: isAccidentalDummy ? 0 : r.selisihHariKalender,
              status: isAccidentalDummy ? '-' : r.status
            };
          }),
          upTUPKKP: (prev.upTUPKKP || []).map(r => ({
            ...r,
            kodeSatker: r.kodeSatker || satkerKode,
            namaSatker: r.namaSatker || satkerNama,
            kodeKPPN: r.kodeKPPN || kppnKode
          })),
          belanjaKontraktual: (prev.belanjaKontraktual || []).map(r => ({
            ...r,
            kodeSatker: (!r.kodeSatker || r.kodeSatker === '000000') ? satkerKode : r.kodeSatker,
            namaSatker: (!r.namaSatker || r.namaSatker === 'SATKER CONTOH') ? satkerNama : r.namaSatker,
            kodeKPPN: (!r.kodeKPPN || r.kodeKPPN === '000') ? kppnKode : r.kodeKPPN
          }))
        };
        updated.output = calculateIKPA(updated);
        saveProject(updated).catch(() => {});
        return updated;
      });
    }
  }, [authenticatedSatker, activeProject.id]);

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cloud Synchronization State (AI Studio ↔ Deployment)
  const [cloudSyncState, setCloudSyncState] = useState<CloudSyncState>({
    isConnected: true,
    lastSyncedAt: null,
    lastOrigin: null,
    isSyncing: false
  });

  useEffect(() => {
    const unsub = subscribeSyncState(setCloudSyncState);
    return () => unsub();
  }, []);

  // Modal States
  const [isKosongkanModalOpen, setIsKosongkanModalOpen] = useState(false);
  const [isCloudSyncModalOpen, setIsCloudSyncModalOpen] = useState(false);

  // Formula Inspector state
  const [inspectorState, setInspectorState] = useState<{
    isOpen: boolean;
    title: string;
    cell: string;
    formula: string;
    score: string;
    details: any[];
  }>({
    isOpen: false,
    title: '',
    cell: '',
    formula: '',
    score: '',
    details: []
  });

  const showNotification = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Load projects from IndexedDB / Storage on mount & synchronize with Cloud
  useEffect(() => {
    let isMounted = true;
    let unsubscribeCloudSnapshot: (() => void) | null = null;

    async function loadData() {
      try {
        const storedProjects = await getAllProjects();
        // Filter out automatic sample workbook project so user starts with a clean slate (0)
        const cleanProjects = storedProjects.filter(p => p.id !== 'proj_sample_workbook_2026');

        if (cleanProjects.length > 0) {
          const sanitizedProjects = cleanProjects.map(p => {
            const sanitized = sanitizeProjectDates(p);
            // Pastikan 12 periode ketepatan waktu pelaporan selalu terisi lengkap
            if (!sanitized.capaianOutputKetepatan || sanitized.capaianOutputKetepatan.length < 12) {
              sanitized.capaianOutputKetepatan = buildDefault12MonthsKetepatan(
                sanitized.capaianOutputKetepatan,
                'Tepat Waktu',
                sanitized.metadata?.kodeSatker || '',
                sanitized.metadata?.namaSatker || ''
              );
            }
            // Pastikan kodeKPPN selalu 026 (KPPN Semarang I)
            if (!sanitized.metadata.kodeKPPN) {
              sanitized.metadata.kodeKPPN = '026';
            }
            sanitized.output = calculateIKPA(sanitized);
            return sanitized;
          });

          // Deduplicate projects: prevent identical baseline projects appearing multiple times
          const deduplicatedList: SimulationProject[] = [];
          const seenNames = new Set<string>();
          let hasBaseline = false;

          for (const proj of sanitizedProjects) {
            const trimmedName = (proj.name || 'Simulasi Mandiri').trim();
            const isDefaultName = trimmedName === 'Simulasi Mandiri (Mulai dari 0)' || trimmedName === 'Simulasi Mandiri';

            if (isDefaultName) {
              if (seenNames.has(trimmedName)) {
                // Orphan duplicate found, delete from storage
                deleteProject(proj.id).catch(() => {});
                continue;
              }
              seenNames.add(trimmedName);
            }

            if (proj.isBaseline) {
              if (hasBaseline) {
                proj.isBaseline = false;
              } else {
                hasBaseline = true;
              }
            }

            // Bersihkan baris template yang sebelumnya terisi nilai dummy 50jt/300jt
            if (proj.upTUPTunai && proj.upTUPTunai.length > 0) {
              proj.upTUPTunai = proj.upTUPTunai.map(r => {
                if (r.totalGUP === 50000000 && r.totalOutstandingUP === 300000000) {
                  return {
                    ...r,
                    totalGUP: 0,
                    totalOutstandingUP: 0,
                    selisihHariKalender: 0,
                    status: '-' as const
                  };
                }
                return r;
              });
            }

            deduplicatedList.push(proj);
          }

          if (deduplicatedList.length === 0) {
            const cleanZero = createEmptyProject('Simulasi Mandiri (Mulai dari 0)', true);
            await saveProject(cleanZero);
            deduplicatedList.push(cleanZero);
          }

          setProjects(deduplicatedList);
          const activeId = getActiveProjectId();
          let current = deduplicatedList.find(p => p.id === activeId) || deduplicatedList[0];
          current.output = calculateIKPA(current);
          setActiveProject(current);
          const baseline = deduplicatedList.find(p => p.isBaseline) || deduplicatedList[0];
          baseline.output = calculateIKPA(baseline);
          setBaselineProject(baseline);

          // Check Cloud Firestore for active simulation state (AI Studio ↔ Deployment synchronization)
          fetchSimulationFromCloud().then(cloudRes => {
            if (!isMounted) return;
            if (cloudRes.project) {
              const cloudProj = cloudRes.project;
              const cloudScore = cloudProj.output?.finalScore ?? 0;
              const localScore = current.output?.finalScore ?? 0;
              const cloudTime = cloudRes.updatedAt ? new Date(cloudRes.updatedAt).getTime() : 0;
              const localTime = current.updatedAt ? new Date(current.updatedAt).getTime() : 0;

              // Adopt cloud state if:
              // 1. Local is untouched zero (score <= 10) and cloud has actual data
              // 2. Or cloud timestamp is newer and has calculation data
              // 3. Or cloud has designated satker code and local doesn't
              const shouldAdoptCloud =
                (localScore <= 10.01 && cloudScore > 10.01) ||
                (cloudTime > localTime && cloudScore > 0) ||
                (cloudProj.metadata?.kodeSatker && !current.metadata?.kodeSatker);

              if (shouldAdoptCloud) {
                setActiveProject(cloudProj);
                setProjects(prev => {
                  const exists = prev.some(p => p.id === cloudProj.id);
                  if (exists) {
                    return prev.map(p => p.id === cloudProj.id ? cloudProj : p);
                  }
                  return [cloudProj, ...prev];
                });
                saveProject(cloudProj).catch(() => {});
                showNotification('Data disinkronkan dari Cloud (AI Studio ↔ Deployment)', 'info');
              } else if (localScore > 10.01) {
                // Local in AI Studio already has user data (e.g. 87.46), push to Cloud immediately!
                saveSimulationToCloud(current, true).catch(() => {});
              }
            } else if (current.output && current.output.finalScore > 10.01) {
              // Cloud is empty, seed with current local data
              saveSimulationToCloud(current, true).catch(() => {});
            }
          }).catch(err => {
            console.warn('[CloudSync] Initial fetch error:', err);
          });
        } else {
          // Local storage is empty (e.g. first load in Deployment). Check Cloud before creating zero project!
          const cloudRes = await fetchSimulationFromCloud().catch(() => ({ project: null }));
          if (cloudRes.project) {
            const cloudProj = cloudRes.project;
            await saveProject(cloudProj);
            setProjects([cloudProj]);
            setActiveProject(cloudProj);
            setBaselineProject(cloudProj);
            setActiveProjectId(cloudProj.id);
            showNotification('Data simulasi berhasil dimuat dari Cloud (AI Studio ↔ Deployment)', 'success');
          } else {
            // Initialize with zero project (all inputs at 0)
            const cleanZero = createEmptyProject('Simulasi Mandiri (Mulai dari 0)', true);
            await saveProject(cleanZero);
            setProjects([cleanZero]);
            setActiveProject(cleanZero);
            setBaselineProject(cleanZero);
            setActiveProjectId(cleanZero.id);
          }
        }

        // Establish real-time Firestore listener for bidirectional updates
        unsubscribeCloudSnapshot = subscribeSimulationFromCloud((remoteProject, meta) => {
          if (!isMounted) return;
          setActiveProject(remoteProject);
          setProjects(prev => {
            const exists = prev.some(p => p.id === remoteProject.id);
            if (exists) {
              return prev.map(p => p.id === remoteProject.id ? remoteProject : p);
            }
            return [remoteProject, ...prev];
          });
          // Cache locally without echoing
          saveProject(remoteProject).catch(() => {});
          const originLabel = (meta.origin && meta.origin.includes('dev')) ? 'Google AI Studio' : 'Deployment';
          showNotification(`Penyelarasan Real-Time: Nilai diselaraskan dari ${originLabel}`, 'info');
        });

      } catch (err) {
        console.error('Failed to load projects from storage:', err);
      }
    }

    loadData();

    return () => {
      isMounted = false;
      if (unsubscribeCloudSnapshot) {
        unsubscribeCloudSnapshot();
      }
    };
  }, []);

  // Handle Project update with local and Cloud synchronization
  const handleUpdateProject = (updated: SimulationProject) => {
    const sanitized = sanitizeProjectDates(updated);
    const recomputed: SimulationProject = {
      ...sanitized,
      updatedAt: new Date().toISOString()
    };
    recomputed.output = calculateIKPA(recomputed);
    setActiveProject(recomputed);

    // 1. Save to IndexedDB / local storage
    saveProject(recomputed).then(() => {
      setProjects(prev => prev.map(p => p.id === recomputed.id ? recomputed : p));
    }).catch(err => {
      console.warn('Auto-save error:', err);
    });

    // 2. Save to Firestore Cloud (debounced)
    saveSimulationToCloud(recomputed, false).catch(err => {
      console.warn('Cloud auto-save error:', err);
    });
  };

  // Force manual cloud sync (Push & Pull)
  const handleForceCloudSync = async () => {
    try {
      showNotification('Menyinkronkan data dengan Cloud Database...', 'info');
      await saveSimulationToCloud(activeProject, true);
      const cloudRes = await fetchSimulationFromCloud();
      if (cloudRes.project) {
        setActiveProject(cloudRes.project);
        setProjects(prev => {
          const exists = prev.some(p => p.id === cloudRes.project!.id);
          if (exists) {
            return prev.map(p => p.id === cloudRes.project!.id ? cloudRes.project! : p);
          }
          return [cloudRes.project!, ...prev];
        });
        showNotification('Sinkronisasi Sukses: AI Studio & Deployment selaras 100%!', 'success');
      } else {
        showNotification('Data simulasi berhasil disimpan ke Cloud Database.', 'success');
      }
    } catch (e) {
      console.warn('Manual cloud sync error:', e);
      showNotification('Gagal menyinkronkan ke cloud, periksa koneksi.', 'error');
    }
  };

  // Switch active project
  const handleSelectProject = (id: string) => {
    const target = projects.find(p => p.id === id);
    if (target) {
      target.output = calculateIKPA(target);
      setActiveProject(target);
      setActiveProjectId(id);
      showNotification(`Memuat skenario: ${target.name}`, 'info');
    }
  };

  // Create new project
  const handleCreateNewProject = async () => {
    const name = `Simulasi ${projects.length + 1}`;
    const newProj = createEmptyProject(name, false, {
      kodeSatker: authenticatedSatker?.kodeSatker || activeProject?.metadata?.kodeSatker || '',
      namaSatker: authenticatedSatker?.namaSatker || (activeProject?.metadata?.namaSatker !== 'Simulasi Mandiri' ? activeProject?.metadata?.namaSatker : '') || 'Simulasi Mandiri',
      kodeKPPN: authenticatedSatker?.kodeKppn || activeProject?.metadata?.kodeKPPN || '026'
    });
    await saveProject(newProj);
    setProjects(prev => [...prev, newProj]);
    setActiveProject(newProj);
    setActiveProjectId(newProj.id);
    showNotification(`Skenario baru dibuat: ${name}`);
  };

  // Duplicate project
  const handleDuplicateProject = async () => {
    const copyName = `${activeProject.name} (Salinan)`;
    const duplicated = await duplicateProject(activeProject.id, copyName);
    if (duplicated) {
      setProjects(prev => [...prev, duplicated]);
      setActiveProject(duplicated);
      setActiveProjectId(duplicated.id);
      showNotification(`Berhasil menduplikasi skenario: ${copyName}`);
    }
  };

  // Delete project
  const handleDeleteProject = async (id: string) => {
    if (projects.length <= 1) {
      showNotification('Tidak dapat menghapus skenario satu-satunya.', 'error');
      return;
    }
    await deleteProject(id);
    const remaining = projects.filter(p => p.id !== id);
    setProjects(remaining);
    const nextActive = remaining[0];
    nextActive.output = calculateIKPA(nextActive);
    setActiveProject(nextActive);
    setActiveProjectId(nextActive.id);
    showNotification('Skenario berhasil dihapus.');
  };

  // Reset all simulation data to 0 (clean slate)
  const handleResetToZero = async () => {
    const currentName = activeProject?.name || 'Simulasi Mandiri (Mulai dari 0)';
    const isBaseline = activeProject?.isBaseline ?? false;
    const cleanZero = createEmptyProject(currentName, isBaseline, {
      kodeSatker: authenticatedSatker?.kodeSatker || activeProject?.metadata?.kodeSatker || '',
      namaSatker: authenticatedSatker?.namaSatker || (activeProject?.metadata?.namaSatker !== 'Simulasi Mandiri' ? activeProject?.metadata?.namaSatker : '') || 'Simulasi Mandiri',
      kodeKPPN: authenticatedSatker?.kodeKppn || activeProject?.metadata?.kodeKPPN || '026'
    });
    if (activeProject?.id) {
      cleanZero.id = activeProject.id;
    }
    cleanZero.output = calculateIKPA(cleanZero);
    await saveProject(cleanZero);
    setProjects(prev => {
      const exists = prev.some(p => p.id === cleanZero.id);
      if (exists) {
        return prev.map(p => p.id === cleanZero.id ? cleanZero : p);
      }
      return prev.map(p => p.id === activeProject?.id ? cleanZero : p);
    });
    setActiveProject(cleanZero);
    if (cleanZero.isBaseline) {
      setBaselineProject(cleanZero);
    }
    setActiveProjectId(cleanZero.id);
    showNotification('Simulasi berhasil di-reset: seluruh formulir kembali bersih ke nilai 0.', 'success');
  };

  // Get active tab title
  const getActiveTabTitle = (): string => {
    switch (activeTab) {
      case 'interface': return 'Ringkasan & Interface';
      case 'dashboard': return 'Dashboard Monitoring';
      case 'revisi-dipa': return 'Revisi DIPA';
      case 'deviasi-hal3': return 'Deviasi Halaman III DIPA';
      case 'penyerapan': return 'Penyerapan Anggaran';
      case 'kontraktual': return 'Belanja Kontraktual';
      case 'tagihan': return 'Penyelesaian Tagihan';
      case 'up-tup': return 'Pengelolaan UP dan TUP';
      case 'capaian-output': return 'Capaian Output';
      case 'dispensasi-spm': return 'Dispensasi SPM';
      case 'skenario': return 'Skenario Rekomendasi';
      default: return 'Indikator';
    }
  };

  // Clear specific active tab
  const handleClearActiveTab = () => {
    switch (activeTab) {
      case 'revisi-dipa':
        handleUpdateProject({ ...activeProject, revisiDIPA: [] });
        showNotification('Formulir Revisi DIPA berhasil dikosongkan.', 'success');
        break;
      case 'deviasi-hal3': {
        handleUpdateProject({ ...activeProject, deviasiHalIII: [] });
        showNotification('Formulir Deviasi Halaman III DIPA berhasil dikosongkan.', 'success');
        break;
      }
      case 'penyerapan': {
        handleUpdateProject({ ...activeProject, penyerapan: [] });
        showNotification('Formulir Penyerapan Anggaran berhasil dikosongkan (0 baris).', 'success');
        break;
      }
      case 'kontraktual':
        handleUpdateProject({ ...activeProject, belanjaKontraktual: [] });
        showNotification('Formulir Belanja Kontraktual berhasil dikosongkan.', 'success');
        break;
      case 'tagihan':
        handleUpdateProject({ ...activeProject, penyelesaianTagihan: [] });
        showNotification('Formulir Penyelesaian Tagihan berhasil dikosongkan.', 'success');
        break;
      case 'up-tup':
        handleUpdateProject({
          ...activeProject,
          upTUPTunai: [],
          upTUPKKP: Array.from({ length: 12 }, (_, i) => ({
            periode: String(i + 1).padStart(2, '0'),
            kodeSatker: authenticatedSatker?.kodeSatker || activeProject.metadata?.kodeSatker || '',
            namaSatker: authenticatedSatker?.namaSatker || (activeProject.metadata?.namaSatker !== 'Simulasi Mandiri' ? activeProject.metadata?.namaSatker : '') || '',
            kodeKPPN: authenticatedSatker?.kodeKppn || activeProject.metadata?.kodeKPPN || '026',
            upKKPPerBulan: 0,
            penggunaanKKP: 0
          }))
        });
        showNotification('Formulir Pengelolaan UP & TUP berhasil dikosongkan.', 'success');
        break;
      case 'capaian-output':
        handleUpdateProject({
          ...activeProject,
          capaianOutput: [],
          capaianOutputKetepatan: buildDefault12MonthsKetepatan(
            [],
            'Tidak Tepat Waktu',
            activeProject.metadata?.kodeSatker || '',
            activeProject.metadata?.namaSatker || ''
          )
        });
        showNotification('Formulir Capaian Output berhasil dikosongkan (12 periode siap diinput).', 'success');
        break;
      case 'dispensasi-spm':
        handleUpdateProject({
          ...activeProject,
          dispensasiSPM: { jumlahSPMTriwulanIV: 0, jumlahDispensasiSPM: 0 }
        });
        showNotification('Formulir Dispensasi SPM berhasil dikosongkan.', 'success');
        break;
      default:
        handleResetToZero();
        break;
    }
  };

  // Reset to sample workbook
  const handleLoadSampleWorkbook = async () => {
    const sample = getWorkbookSampleProject();
    sample.name = 'Data Referensi Workbook 2026';
    sample.output = calculateIKPA(sample);
    await saveProject(sample);
    setProjects(prev => {
      const exists = prev.find(p => p.id === sample.id);
      return exists ? prev.map(p => p.id === sample.id ? sample : p) : [...prev, sample];
    });
    setActiveProject(sample);
    setBaselineProject(sample);
    setActiveProjectId(sample.id);
    showNotification('Berhasil memuat data referensi Workbook Excel 2026.', 'info');
  };

  // Mode Toggle: Excel Compatible vs Validation
  const toggleCalculationMode = () => {
    const nextMode = activeProject.calculationMode === 'excel_compatible' ? 'validation' : 'excel_compatible';
    const updated: SimulationProject = {
      ...activeProject,
      calculationMode: nextMode
    };
    handleUpdateProject(updated);
    showNotification(
      nextMode === 'excel_compatible'
        ? 'Mode beralih ke: Excel Compatible (Default 100% Formula Workbook)'
        : 'Mode beralih ke: Standard / Validation Mode',
      'info'
    );
  };

  // Rename current project
  const handleSaveName = () => {
    if (editedName.trim()) {
      handleUpdateProject({ ...activeProject, name: editedName.trim() });
    }
    setIsEditingName(false);
  };

  // Export JSON
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(activeProject, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `simulasi_ikpa_2026_${activeProject.name.replace(/\s+/g, '_')}.json`);
    dlAnchor.click();
    showNotification('Skenario simulasi diekspor sebagai JSON.');
  };

  // Import JSON
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string) as SimulationProject;
        parsed.id = 'proj_' + Date.now();
        parsed.name = `${parsed.name || 'Imported'} (Impor)`;
        parsed.output = calculateIKPA(parsed);
        await saveProject(parsed);
        setProjects(prev => [...prev, parsed]);
        setActiveProject(parsed);
        setActiveProjectId(parsed.id);
        showNotification('Skenario simulasi berhasil diimpor!');
      } catch (err) {
        showNotification('Format file JSON tidak valid.', 'error');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Export CSV
  const handleExportCsv = () => {
    if (!activeProject.output) return;
    const output = activeProject.output;
    const lines = [
      'Indikator IKPA,Bobot (%),Nilai Kinerja (Raw),Nilai Akhir (Capped),Nilai Tertimbang',
      `Revisi DIPA,${output.indicators?.revisiDIPA?.weight ?? 0},${output.indicators?.revisiDIPA?.rawValue ?? 0},${output.indicators?.revisiDIPA?.cappedValue ?? 0},${output.indicators?.revisiDIPA?.weightedValue ?? 0}`,
      `Deviasi Halaman III DIPA,${output.indicators?.deviasiHalIII?.weight ?? 0},${output.indicators?.deviasiHalIII?.rawValue ?? 0},${output.indicators?.deviasiHalIII?.cappedValue ?? 0},${output.indicators?.deviasiHalIII?.weightedValue ?? 0}`,
      `Penyerapan Anggaran,${output.indicators?.penyerapan?.weight ?? 0},${output.indicators?.penyerapan?.rawValue ?? 0},${output.indicators?.penyerapan?.cappedValue ?? 0},${output.indicators?.penyerapan?.weightedValue ?? 0}`,
      `Belanja Kontraktual,${output.indicators?.belanjaKontraktual?.weight ?? 0},${output.indicators?.belanjaKontraktual?.rawValue ?? 0},${output.indicators?.belanjaKontraktual?.cappedValue ?? 0},${output.indicators?.belanjaKontraktual?.weightedValue ?? 0}`,
      `Penyelesaian Tagihan,${output.indicators?.penyelesaianTagihan?.weight ?? 0},${output.indicators?.penyelesaianTagihan?.rawValue ?? 0},${output.indicators?.penyelesaianTagihan?.cappedValue ?? 0},${output.indicators?.penyelesaianTagihan?.weightedValue ?? 0}`,
      `Pengelolaan UP dan TUP,${output.indicators?.pengelolaanUPTUP?.weight ?? 0},${output.indicators?.pengelolaanUPTUP?.rawValue ?? 0},${output.indicators?.pengelolaanUPTUP?.cappedValue ?? 0},${output.indicators?.pengelolaanUPTUP?.weightedValue ?? 0}`,
      `Capaian Output,${output.indicators?.capaianOutput?.weight ?? 0},${output.indicators?.capaianOutput?.rawValue ?? 0},${output.indicators?.capaianOutput?.cappedValue ?? 0},${output.indicators?.capaianOutput?.weightedValue ?? 0}`,
      '',
      `Pengurang Dispensasi SPM TW IV,-,-,-,-${output.dispensasiReduction ?? 0}`,
      `Total Tertimbang,-,-,-,${output.totalWeighted ?? 0}`,
      `Konversi Bobot,-,-,-,${((output.weightConversion ?? 1) * 100).toFixed(0)}%`,
      `NILAI AKHIR IKPA,-,-,-,${output.finalScore ?? 0}`,
      `PREDIKAT KINERJA,-,-,-,${output.predikat ?? '-'}`
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(lines.join('\n'));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', csvContent);
    dlAnchor.setAttribute('download', `laporan_ikpa_2026_${activeProject.name.replace(/\s+/g, '_')}.csv`);
    dlAnchor.click();
    showNotification('Laporan CSV berhasil diunduh.');
  };

  // Open Formula Inspector
  const handleOpenInspector = (title: string, cell: string, formula: string, score: string, details: any[]) => {
    setInspectorState({
      isOpen: true,
      title,
      cell,
      formula,
      score,
      details
    });
  };

  // Handle Verify Satker Password
  const handleVerifySatker = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentAuthTargetSatker) {
      setAuthError('Silakan pilih Satker terlebih dahulu.');
      return;
    }

    const isValid = verifySatkerPassword(currentAuthTargetSatker, authPasswordInput, isAdminAuthenticated);
    if (isValid) {
      setUnlockedSatkerKode(currentAuthTargetSatker.kodeSatker);
      // PENTING: Jangan simpan di sessionStorage agar setiap kali refresh, sesi otomatis log out
      setAuthError(null);
      setAuthPasswordInput('');

      const satkerKode = currentAuthTargetSatker.kodeSatker;
      const satkerNama = currentAuthTargetSatker.namaSatker;
      const kppnKode = currentAuthTargetSatker.kodeKppn || '026';

      // Auto update active project metadata and all form rows to the unlocked Satker
      const updatedProj: SimulationProject = {
        ...activeProject,
        metadata: {
          ...activeProject.metadata,
          namaSatker: satkerNama,
          kodeSatker: satkerKode,
          kodeKPPN: kppnKode
        },
        upTUPTunai: (activeProject.upTUPTunai || []).map(r => ({
          ...r,
          kodeSatker: r.kodeSatker || satkerKode,
          namaSatker: r.namaSatker || satkerNama,
          kodeKPPN: r.kodeKPPN || kppnKode
        })),
        upTUPKKP: (activeProject.upTUPKKP || []).map(r => ({
          ...r,
          kodeSatker: r.kodeSatker || satkerKode,
          namaSatker: r.namaSatker || satkerNama,
          kodeKPPN: r.kodeKPPN || kppnKode
        })),
        belanjaKontraktual: (activeProject.belanjaKontraktual || []).map(r => ({
          ...r,
          kodeSatker: (!r.kodeSatker || r.kodeSatker === '000000') ? satkerKode : r.kodeSatker,
          namaSatker: (!r.namaSatker || r.namaSatker === 'SATKER CONTOH') ? satkerNama : r.namaSatker,
          kodeKPPN: (!r.kodeKPPN || r.kodeKPPN === '000') ? kppnKode : r.kodeKPPN
        }))
      };
      updatedProj.output = calculateIKPA(updatedProj);
      handleUpdateProject(updatedProj);

      if (onSelectSatker) {
        onSelectSatker(currentAuthTargetSatker.kodeSatker);
      }
      showNotification(`Akses Simulasi Satker ${currentAuthTargetSatker.namaSatker} (${currentAuthTargetSatker.kodeSatker}) berhasil dibuka!`, 'success');

      // Auto check if this Satker already has a cloud simulation state saved from AI Studio or previous session
      fetchSatkerSimulationFromCloud(satkerKode).then(cloudSatkerProj => {
        if (cloudSatkerProj && cloudSatkerProj.output && cloudSatkerProj.output.finalScore > 10.01) {
          handleUpdateProject(cloudSatkerProj);
          showNotification(`Data simulasi Satker ${satkerNama} berhasil disinkronkan dari Cloud!`, 'info');
        }
      }).catch(err => {
        console.warn('Error checking cloud satker project:', err);
      });
    } else {
      setAuthError('Password Satker tidak sesuai. Silakan masukkan password resmi Satker Anda atau hubungi Admin KPPN.');
    }
  };

  // Lock session / Log Out Satker
  const handleLockSatker = () => {
    setUnlockedSatkerKode('');
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('kppn_unlocked_simulasi_satker');
    }
    setAuthPasswordInput('');
    setAuthError(null);
    showNotification('Sesi Satker telah berhasil di-logout dan dikunci kembali. Silakan login ulang untuk membuka akses.', 'info');
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
    isEnabled: Boolean(isUnlocked && !isAdminAuthenticated && unlockedSatkerKode),
    satkerKode: unlockedSatkerKode,
    onTimeout: () => {
      handleLockSatker();
      setIsSessionExpiredModalOpen(true);
    }
  });

  // Sync actual Satker identity to project
  const handleSyncSatkerToProject = () => {
    if (!authenticatedSatker) return;
    handleUpdateProject({
      ...activeProject,
      metadata: {
        ...activeProject.metadata,
        namaSatker: authenticatedSatker.namaSatker,
        kodeSatker: authenticatedSatker.kodeSatker,
        kodeKPPN: authenticatedSatker.kodeKppn || '026'
      }
    });
    showNotification(`Identitas Satker ${authenticatedSatker.namaSatker} (${authenticatedSatker.kodeSatker}) disinkronkan ke skenario aktif.`, 'success');
  };

  const tabsConfig: { id: MasterSimulatorTab; label: string; icon: any; badge?: string }[] = [
    { id: 'interface', label: 'Interface (Ringkasan)', icon: ShieldCheck, badge: 'Utama' },
    { id: 'revisi-dipa', label: '1. Revisi DIPA', icon: FileText, badge: '10%' },
    { id: 'deviasi-hal3', label: '2. Deviasi Hal III', icon: Calendar, badge: '15%' },
    { id: 'penyerapan', label: '3. Penyerapan', icon: TrendingUp, badge: '20%' },
    { id: 'kontraktual', label: '4. Kontraktual', icon: Building, badge: '10%' },
    { id: 'tagihan', label: '5. Penyelesaian Tagihan', icon: Clock, badge: '10%' },
    { id: 'up-tup', label: '6. Pengelolaan UP/TUP', icon: Coins, badge: '10%' },
    { id: 'capaian-output', label: '7. Capaian Output', icon: Target, badge: '25%' },
    { id: 'dispensasi-spm', label: 'Dispensasi SPM', icon: AlertTriangle, badge: 'Minus' },
    { id: 'skenario', label: 'Perbandingan Skenario', icon: Layers }
  ];

  // =========================================================================
  // GATEKEEPER CARD: TAMPILKAN JIKA AKSES BELUM DIBUKA DENGAN PASSWORD SATKER
  // =========================================================================
  if (!isUnlocked) {
    return (
      <div className={`space-y-6 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
        {/* Gatekeeper Card Container */}
        <div className={`rounded-3xl border p-6 sm:p-10 shadow-xl transition-all max-w-3xl mx-auto ${
          isDark ? 'bg-slate-900/95 border-amber-500/30 shadow-amber-500/5' : 'bg-white border-amber-300 shadow-amber-500/10'
        }`}>
          <div className="text-center max-w-xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500/15 text-amber-800 dark:text-amber-400 border border-amber-500/30">
              <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Akses Dilindungi Password Satker</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Ruang Simulasi 8 Modul Indikator IKPA
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Untuk melindungi kerahasiaan strategi proyeksi anggaran dan data indikator Satker mitra KPPN Semarang I, silakan pilih Satker Anda dan masukkan password resmi sebelum mengakses formulir simulasi.
            </p>
          </div>

          {/* Form Otentikasi Satker */}
          <form onSubmit={handleVerifySatker} className="mt-8 max-w-xl mx-auto space-y-5">
            {/* 1. Pilih Satker */}
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                1. Pilih Satker Anda:
              </label>

              {/* Filter Search */}
              <div className="relative mb-2">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama Satker / 6-digit kode satker..."
                  value={authSearchQuery}
                  onChange={e => {
                    const val = e.target.value;
                    setAuthSearchQuery(val);
                    setAuthError(null);
                    if (val.trim()) {
                      const trimmed = val.trim().toLowerCase();
                      const exact = satkers.find(s => s.kodeSatker === trimmed);
                      if (exact) {
                        setAuthSelectedKode(exact.kodeSatker);
                      }
                    }
                  }}
                  className={`w-full text-xs rounded-xl pl-10 pr-4 py-2.5 border transition-all ${
                    isDark
                      ? 'bg-slate-950/80 border-slate-800 text-white placeholder-slate-500 focus:border-amber-500'
                      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-amber-500'
                  }`}
                />
              </div>

              {/* Satker Dropdown */}
              <select
                value={authSelectedKode}
                onChange={e => {
                  setAuthSelectedKode(e.target.value);
                  setAuthError(null);
                }}
                className={`w-full text-xs font-semibold rounded-xl px-3.5 py-3 border transition-all ${
                  isDark
                    ? 'bg-slate-950 border-slate-800 text-white focus:border-amber-500'
                    : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500'
                }`}
              >
                {filteredAuthSatkers.length === 0 ? (
                  <option value="">Tidak ada Satker yang cocok dengan pencarian</option>
                ) : (
                  filteredAuthSatkers.map(s => {
                    const klClean = (s.kementerianLembaga && s.kementerianLembaga.trim() !== '-' && s.kementerianLembaga.trim() !== '- ')
                      ? ` - ${s.kementerianLembaga}`
                      : '';
                    return (
                      <option key={s.id || s.kodeSatker} value={s.kodeSatker}>
                        [{s.kodeSatker}] {s.namaSatker}{klClean}
                      </option>
                    );
                  })
                )}
              </select>
            </div>

            {/* Satker Summary Card Preview */}
            {currentAuthTargetSatker && (
              <div className={`p-4 rounded-2xl border text-left flex items-start justify-between gap-4 ${
                isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-amber-50/50 border-amber-200'
              }`}>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                      {currentAuthTargetSatker.namaSatker}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 space-x-2">
                    <span>Kode Satker: <strong className="font-mono text-slate-700 dark:text-slate-200">{currentAuthTargetSatker.kodeSatker}</strong></span>
                    <span>•</span>
                    <span>KPPN Mitra: <strong className="font-mono text-slate-700 dark:text-slate-200">{currentAuthTargetSatker.kodeKppn || '026'} Semarang I</strong></span>
                  </div>
                </div>
                <span className="shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20">
                  Satker Terdaftar
                </span>
              </div>
            )}

            {/* 2. Password Satker Input */}
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                2. Password / PIN Satker:
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showAuthPassword ? 'text' : 'password'}
                  placeholder="Masukkan password satker..."
                  value={authPasswordInput}
                  onChange={e => {
                    setAuthPasswordInput(e.target.value);
                    if (authError) setAuthError(null);
                  }}
                  className={`w-full text-xs font-mono rounded-xl pl-10 pr-10 py-3.5 border transition-all ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-white focus:border-amber-500'
                      : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500'
                  }`}
                  required
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowAuthPassword(!showAuthPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showAuthPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error Banner */}
            {authError && (
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-xs flex items-start gap-2.5 text-left">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed font-medium">{authError}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm py-3.5 rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Unlock className="w-4 h-4" />
              <span>Buka Akses Simulasi 8 Modul Satker</span>
            </button>

            {/* Info Box Privasi & Keamanan Akses Satker */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 text-left">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  <strong className="text-slate-800 dark:text-slate-200">Keamanan Ruang Simulasi Satker:</strong>
                  <p className="mt-0.5 text-slate-500 dark:text-slate-400">
                    Akses formulir simulasi dilindungi untuk menjaga kerahasiaan strategi dan proyeksi anggaran masing-masing unit kerja Satker mitra. Masukkan password resmi Satker Anda. Jika membutuhkan bantuan akses atau verifikasi, silakan koordinasikan dengan Petugas Admin KPPN Semarang I.
                  </p>
                </div>
              </div>
            </div>

            {/* Admin Login Option */}
            {onOpenAdminAuth && (
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={onOpenAdminAuth}
                  className="text-xs font-semibold text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 underline transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Petugas Admin KPPN? Masuk dengan PIN Administrator untuk akses penuh</span>
                </button>
              </div>
            )}
          </form>
        </div>

        {/* 8 Modul Preview Cards */}
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-3">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
              8 Modul Indikator Terpadu yang Akan Terbuka:
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {tabsConfig.filter(t => t.id !== 'skenario' && t.id !== 'interface').map((t) => {
              const IconComp = t.icon;
              return (
                <div
                  key={t.id}
                  className={`p-3.5 rounded-2xl border flex flex-col justify-between transition-all ${
                    isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
                      <IconComp className="w-4 h-4" />
                    </div>
                    {t.badge && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {t.badge}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-tight">
                      {t.label}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      PER-5/PB/2024
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
      {/* 1. MASTER HEADER: Identitas Satker, Manajemen Skenario, Mode Switch, dan Tools */}
      <div className={`rounded-2xl border p-5 shadow-xs transition-all ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
          {/* Skenario Selector & Project Name */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-emerald-500/10 px-2.5 py-0.5 text-xs font-mono font-bold text-emerald-600">
                MASTER SIMULATOR IKPA 2026
              </span>
              <span className="rounded-md bg-blue-500/10 px-2.5 py-0.5 text-xs font-mono font-semibold text-blue-600">
                100% Logika Excel Workbook
              </span>
            </div>

            <div className="flex items-center gap-2">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editedName}
                    onChange={e => setEditedName(e.target.value)}
                    className="rounded-xl border px-3 py-1 text-base font-bold dark:bg-slate-800 dark:border-slate-700"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveName}
                    className="rounded-lg bg-emerald-600 p-1.5 text-white hover:bg-emerald-700"
                  >
                    <Save className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                    {activeProject.name}
                  </h1>
                  <button
                    onClick={() => {
                      setEditedName(activeProject.name);
                      setIsEditingName(true);
                    }}
                    className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    title="Ubah Nama Skenario"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span>Skenario: <strong className="text-slate-700 dark:text-slate-200">{activeProject.metadata.namaSatker || 'Simulasi Mandiri'}</strong></span>
              {activeProject.metadata.kodeSatker && (
                <>
                  <span>•</span>
                  <span>Kode Satker: <strong className="font-mono text-slate-700 dark:text-slate-200">{activeProject.metadata.kodeSatker}</strong></span>
                </>
              )}
              {activeProject.metadata.kodeKPPN && (
                <>
                  <span>•</span>
                  <span>KPPN: <strong className="font-mono text-slate-700 dark:text-slate-200">{activeProject.metadata.kodeKPPN}</strong></span>
                </>
              )}
              <span>•</span>
              <span>TA: <strong className="font-mono text-slate-700 dark:text-slate-200">{activeProject.metadata.tahunAnggaran || 2026}</strong></span>
              <span>•</span>
              {isAdminAuthenticated ? (
                <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-300 font-bold bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 rounded-md">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" /> Mode Admin KPPN
                </span>
              ) : authenticatedSatker ? (
                <div className="inline-flex items-center gap-2 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 font-bold px-3 py-1 rounded-xl border border-emerald-500/30">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Satker Aktif: <strong>{authenticatedSatker.kodeSatker}</strong></span>
                  <button
                    onClick={handleLockSatker}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-600 hover:text-white px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-800 transition-all cursor-pointer"
                    title="Log Out dari sesi Satker ini dan kunci kembali simulasi"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>Log Out</span>
                  </button>
                </div>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">Terbuka untuk Seluruh Satker</span>
              )}
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Mode Toggle Switch */}
            <button
              onClick={toggleCalculationMode}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold shadow-xs transition-colors ${
                activeProject.calculationMode === 'excel_compatible'
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                  : 'border-slate-300 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
              title="Ganti Mode Kalkulasi"
            >
              <Zap className="h-3.5 w-3.5 text-emerald-600" />
              Mode: {activeProject.calculationMode === 'excel_compatible' ? 'Excel Compatible' : 'Validation'}
            </button>

            {/* Skenario Dropdown */}
            <div className="flex items-center gap-1.5">
              <select
                value={activeProject.id}
                onChange={e => handleSelectProject(e.target.value)}
                className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 font-sans shadow-xs focus:ring-2 focus:ring-emerald-500"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.isBaseline ? '(Baseline)' : ''}
                  </option>
                ))}
              </select>

              {projects.length > 1 && (
                <button
                  onClick={() => handleDeleteProject(activeProject.id)}
                  className="p-2 rounded-xl border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                  title="Hapus Skenario Ini"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Project Management Buttons */}
            <button
              onClick={handleCreateNewProject}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-xs"
              title="Buat Skenario Baru"
            >
              <Plus className="h-3.5 w-3.5 text-emerald-600" /> Baru
            </button>

            <button
              onClick={handleDuplicateProject}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-xs"
              title="Duplikasi Skenario"
            >
              <Copy className="h-3.5 w-3.5 text-blue-600" /> Duplikasi
            </button>

            {/* Cloud Real-Time Sync Status (AI Studio ↔ Deployment) */}
            <button
              onClick={handleForceCloudSync}
              disabled={cloudSyncState.isSyncing}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all shadow-xs cursor-pointer ${
                cloudSyncState.isConnected
                  ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                  : 'border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100'
              }`}
              title="Sinkronisasi Cloud Real-Time antara Google AI Studio & Deployment (Klik untuk sinkronkan manual sekarang)"
            >
              <span className={`w-2 h-2 rounded-full ${cloudSyncState.isSyncing ? 'bg-amber-500 animate-ping' : 'bg-emerald-500 animate-pulse'}`} />
              <Cloud className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>
                {cloudSyncState.isSyncing
                  ? 'Menyinkronkan...'
                  : 'Cloud Sync: AI Studio ↔ Deployment'}
              </span>
              <RefreshCw className={`h-3 w-3 text-emerald-600 dark:text-emerald-400 ${cloudSyncState.isSyncing ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => setIsKosongkanModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 px-3 py-2 text-xs font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors shadow-xs cursor-pointer"
              title="Kosongkan formulir simulasi (Pilihan per tab atau semua tab)"
            >
              <Eraser className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
              <span>Kosongkan Formulir</span>
            </button>

            <button
              onClick={() => setIsCloudSyncModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-sky-200 dark:border-sky-900/50 bg-sky-50 dark:bg-sky-950/40 px-3 py-2 text-xs font-semibold text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/60 transition-colors shadow-xs cursor-pointer"
              title="Simpan atau Buka Skenario Satker dari Cloud Database (Password Satker)"
            >
              <Cloud className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
              <span>Cloud Satker</span>
            </button>

            <button
              onClick={handleLoadSampleWorkbook}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-xs cursor-pointer"
              title="Muat Data Contoh Workbook Excel 2026 (Sebagai Referensi)"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" /> Muat Contoh Workbook
            </button>

            {authenticatedSatker && (
              <button
                onClick={handleSyncSatkerToProject}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors shadow-xs cursor-pointer"
                title={`Sinkronkan data & identitas Satker ${authenticatedSatker.namaSatker} ke skenario ini`}
              >
                <Building className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Pakai Satker {authenticatedSatker.kodeSatker}</span>
              </button>
            )}

            {!isAdminAuthenticated && (
              <>
                <SatkerSessionTimerBadge
                  remainingSeconds={remainingSeconds}
                  formattedRemaining={formattedRemaining}
                  timeoutMinutes={timeoutMinutes}
                  isWarning={isSessionWarning}
                  onResetTimer={resetSessionTimer}
                  onSetTimeoutMinutes={setTimeoutMinutes}
                  onLockNow={handleLockSatker}
                  satkerKode={authenticatedSatker?.kodeSatker || unlockedSatkerKode}
                  satkerNama={authenticatedSatker?.namaSatker}
                />

                <button
                  onClick={handleLockSatker}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-2 text-xs font-bold transition-all shadow-xs cursor-pointer"
                  title="Keluar / Log Out dari sesi Satker dan kunci kembali ruang simulasi"
                >
                  <LogOut className="h-3.5 w-3.5 text-white" />
                  <span>Log Out Satker {authenticatedSatker ? `(${authenticatedSatker.kodeSatker})` : ''}</span>
                </button>
              </>
            )}

            {/* Export & Import Tools */}
            <button
              onClick={handleExportJson}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
              title="Ekspor Proyek JSON"
            >
              <Download className="h-4 w-4" />
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
              title="Impor Proyek JSON"
            >
              <Upload className="h-4 w-4" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportJson}
              accept=".json"
              className="hidden"
            />

            <button
              onClick={handleExportCsv}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
              title="Ekspor Laporan CSV"
            >
              <FileSpreadsheet className="h-4 w-4" />
            </button>

            <button
              onClick={() => window.print()}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
              title="Cetak Laporan Simulasi"
            >
              <Printer className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Live Notification Bar */}
        {notification && (
          <div className={`mt-3 flex items-center gap-2 rounded-xl p-3 text-xs font-semibold animate-fade-in ${
            notification.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
              : notification.type === 'error'
                ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20'
                : 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20'
          }`}>
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {notification.message}
          </div>
        )}
      </div>

      {/* 2. DEDICATED NAVIGATION TABS (10 TABS) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800 scrollbar-thin">
        {tabsConfig.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm font-bold'
                  : isDark
                    ? 'bg-slate-900/70 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/60'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`rounded-md px-1.5 py-0.2 text-[10px] font-mono ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. TAB VIEW CONTENT */}
      <div>
        {(activeTab === 'interface' || activeTab === 'dashboard') && (
          <InterfaceTab
            project={activeProject}
            onNavigateTab={(t) => setActiveTab(t === 'dashboard' ? 'interface' : t)}
            onOpenInspector={handleOpenInspector}
            onUpdateProject={handleUpdateProject}
            onResetProjectToClean={handleResetToZero}
            isDark={isDark}
          />
        )}

        {activeTab === 'revisi-dipa' && (
          <RevisiDipaTab
            project={activeProject}
            onUpdateProject={handleUpdateProject}
            onOpenInspector={handleOpenInspector}
            isDark={isDark}
          />
        )}

        {activeTab === 'deviasi-hal3' && (
          <DeviasiHal3Tab
            project={activeProject}
            onUpdateProject={handleUpdateProject}
            onOpenInspector={handleOpenInspector}
            isDark={isDark}
          />
        )}

        {activeTab === 'penyerapan' && (
          <PenyerapanTab
            project={activeProject}
            onUpdateProject={handleUpdateProject}
            onOpenInspector={handleOpenInspector}
            isDark={isDark}
          />
        )}

        {activeTab === 'kontraktual' && (
          <KontraktualTab
            project={activeProject}
            onUpdateProject={handleUpdateProject}
            onOpenInspector={handleOpenInspector}
            isDark={isDark}
          />
        )}

        {activeTab === 'tagihan' && (
          <TagihanTab
            project={activeProject}
            onUpdateProject={handleUpdateProject}
            onOpenInspector={handleOpenInspector}
            isDark={isDark}
          />
        )}

        {activeTab === 'up-tup' && (
          <UpTupTab
            project={activeProject}
            onUpdateProject={handleUpdateProject}
            onOpenInspector={handleOpenInspector}
            isDark={isDark}
          />
        )}

        {activeTab === 'capaian-output' && (
          <CapaianOutputTab
            project={activeProject}
            onUpdateProject={handleUpdateProject}
            onOpenInspector={handleOpenInspector}
            isDark={isDark}
          />
        )}

        {activeTab === 'dispensasi-spm' && (
          <DispensasiTab
            project={activeProject}
            onUpdateProject={handleUpdateProject}
            onOpenInspector={handleOpenInspector}
            isDark={isDark}
          />
        )}

        {activeTab === 'skenario' && (
          <SkenarioTab
            baselineProject={baselineProject}
            currentProject={activeProject}
            onApplyScenario={handleUpdateProject}
            isDark={isDark}
          />
        )}
      </div>

      {/* 4. FORMULA INSPECTOR MODAL */}
      <FormulaInspectorModal
        isOpen={inspectorState.isOpen}
        onClose={() => setInspectorState(prev => ({ ...prev, isOpen: false }))}
        title={inspectorState.title}
        excelCell={inspectorState.cell}
        excelFormula={inspectorState.formula}
        scoreFormatted={inspectorState.score}
        details={inspectorState.details}
        isDark={isDark}
      />

      {/* 5. KOSONGKAN FORMULIR MODAL */}
      <KosongkanFormulirModal
        isOpen={isKosongkanModalOpen}
        onClose={() => setIsKosongkanModalOpen(false)}
        activeTab={activeTab}
        tabTitle={getActiveTabTitle()}
        onClearActiveTab={handleClearActiveTab}
        onClearAllTabs={handleResetToZero}
        onLoadSampleWorkbook={handleLoadSampleWorkbook}
        isDark={isDark}
      />

      {/* 6. CLOUD SATKER SYNC MODAL (FIRESTORE) */}
      <CloudSatkerSyncModal
        isOpen={isCloudSyncModalOpen}
        onClose={() => setIsCloudSyncModalOpen(false)}
        activeProject={activeProject}
        onLoadProject={(loaded) => {
          handleUpdateProject(loaded);
          showNotification(`Skenario "${loaded.name}" berhasil dimuat dari Cloud Satker.`, 'success');
        }}
        satkers={satkers}
        selectedSatkerId={selectedSatkerId}
        onSelectSatker={onSelectSatker}
        isDark={isDark}
      />

      {/* 7. INACTIVITY AUTO-LOCK EXPIRED MODAL */}
      <SatkerSessionExpiredModal
        isOpen={isSessionExpiredModalOpen}
        timeoutMinutes={timeoutMinutes}
        satkerKode={authenticatedSatker?.kodeSatker || unlockedSatkerKode}
        satkerNama={authenticatedSatker?.namaSatker}
        onClose={() => setIsSessionExpiredModalOpen(false)}
      />
    </div>
  );
};
