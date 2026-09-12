import {
  SimulationProject,
  DEFAULT_WEIGHTS,
  DeviasiHalIIIInput,
  PenyerapanInput,
  UPTUPKKPInput,
  CapaianOutputKetepatanInput
} from '../models/ikpa';
import { calculateIKPA } from '../calculations/ikpa';
import { sanitizeProjectDates } from '../utils/ikpaDateUtils';

const DB_NAME = 'IKPA_SIMULATOR_DB';
const DB_VERSION = 1;
const STORE_NAME = 'simulation_projects';
const ACTIVE_PROJECT_KEY = 'ikpa_simulator_active_id';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported in this environment'));
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = event => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Fallback to localStorage if IndexedDB fails or is unavailable
const LOCAL_STORAGE_BACKUP_KEY = 'ikpa_sim_projects_backup';

function getLocalStorageProjects(): SimulationProject[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_BACKUP_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalStorageProjects(projects: SimulationProject[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_BACKUP_KEY, JSON.stringify(projects));
  } catch (err) {
    console.warn('LocalStorage backup quota reached or unavailable:', err);
  }
}

export async function getAllProjects(): Promise<SimulationProject[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => {
        const results = req.result as SimulationProject[];
        if (!results || results.length === 0) {
          // Check local backup
          resolve(getLocalStorageProjects().map(p => sanitizeProjectDates(p)));
        } else {
          resolve(results.map(p => sanitizeProjectDates(p)));
        }
      };
      req.onerror = () => resolve(getLocalStorageProjects().map(p => sanitizeProjectDates(p)));
    });
  } catch {
    return getLocalStorageProjects().map(p => sanitizeProjectDates(p));
  }
}

export async function getProjectById(id: string): Promise<SimulationProject | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);

      req.onsuccess = () => {
        const result = req.result as SimulationProject | undefined;
        if (!result) {
          const fromBackup = getLocalStorageProjects().find(p => p.id === id);
          resolve(fromBackup ? sanitizeProjectDates(fromBackup) : null);
        } else {
          resolve(sanitizeProjectDates(result));
        }
      };
      req.onerror = () => {
        const fromBackup = getLocalStorageProjects().find(p => p.id === id);
        resolve(fromBackup ? sanitizeProjectDates(fromBackup) : null);
      };
    });
  } catch {
    const fromBackup = getLocalStorageProjects().find(p => p.id === id);
    return fromBackup ? sanitizeProjectDates(fromBackup) : null;
  }
}

export async function saveProject(project: SimulationProject): Promise<void> {
  const updatedProject: SimulationProject = {
    ...project,
    updatedAt: new Date().toISOString()
  };

  // Keep calculation up to date
  updatedProject.output = calculateIKPA(updatedProject);

  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(updatedProject);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn('Saving to IndexedDB failed, saving to local backup:', e);
  }

  // Also maintain local storage backup
  const all = getLocalStorageProjects();
  const index = all.findIndex(p => p.id === updatedProject.id);
  if (index >= 0) {
    all[index] = updatedProject;
  } else {
    all.push(updatedProject);
  }
  saveLocalStorageProjects(all);
}

export async function deleteProject(id: string): Promise<void> {
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn('IndexedDB delete failed, deleting from backup:', e);
  }

  const all = getLocalStorageProjects().filter(p => p.id !== id);
  saveLocalStorageProjects(all);
}

export async function duplicateProject(
  sourceId: string,
  newName: string
): Promise<SimulationProject | null> {
  const source = await getProjectById(sourceId);
  if (!source) return null;

  const now = new Date().toISOString();
  const newProject: SimulationProject = {
    ...JSON.parse(JSON.stringify(source)),
    id: 'proj_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    name: newName,
    parentId: source.id,
    isBaseline: false,
    createdAt: now,
    updatedAt: now
  };

  newProject.output = calculateIKPA(newProject);
  await saveProject(newProject);
  return newProject;
}

export function getActiveProjectId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_PROJECT_KEY);
  } catch {
    return null;
  }
}

export function setActiveProjectId(id: string): void {
  try {
    localStorage.setItem(ACTIVE_PROJECT_KEY, id);
  } catch (e) {
    console.warn('Failed to set active project id:', e);
  }
}

export function createEmptyProject(
  name: string = 'Simulasi Mandiri (Mulai dari 0)',
  isBaseline: boolean = true,
  initialMetadata?: Partial<SimulationProject['metadata']>
): SimulationProject {
  const now = new Date().toISOString();

  // Pengaturan awal: 0 baris (kosong) agar Satker dapat menambah baris mandiri
  // sesuai kebutuhan riil tanpa dibebani kewajiban mengisi 12 bulan/banyak baris
  const proj: SimulationProject = {
    id: 'proj_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    name,
    description: isBaseline ? 'Skenario Kondisi Awal (Mulai dari 0)' : 'Skenario Simulasi Perbaikan',
    createdAt: now,
    updatedAt: now,
    isBaseline,
    calculationVersion: 'IKPA-2026-EXCEL-COMPATIBLE-v1',
    calculationMode: 'excel_compatible',
    metadata: {
      tahunAnggaran: 2026,
      kodeKementerian: '',
      namaKementerian: '',
      kodeSatker: initialMetadata?.kodeSatker || '',
      namaSatker: initialMetadata?.namaSatker || 'Simulasi Mandiri',
      kodeKPPN: initialMetadata?.kodeKPPN || '026',
      periodeCutoff: 12,
      ...initialMetadata
    },
    weights: { ...DEFAULT_WEIGHTS },
    activeIndicators: {
      revisiDIPA: true,
      deviasiHalIII: true,
      penyerapan: true,
      belanjaKontraktual: true,
      penyelesaianTagihan: true,
      pengelolaanUPTUP: true,
      capaianOutput: true
    },
    revisiDIPA: [],
    deviasiHalIII: [],
    penyerapan: [],
    belanjaKontraktual: [],
    penyelesaianTagihan: [],
    upTUPTunai: [],
    upTUPKKP: [],
    dispensasiSPM: {
      jumlahSPMTriwulanIV: 0,
      jumlahDispensasiSPM: 0
    },
    capaianOutput: [],
    capaianOutputKetepatan: []
  };

  proj.output = calculateIKPA(proj);
  return proj;
}
