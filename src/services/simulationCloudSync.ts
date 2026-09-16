import { db, doc, getDoc, setDoc, onSnapshot } from '../lib/firebase';
import { SimulationProject } from '../models/ikpa';
import { sanitizeProjectDates } from '../utils/ikpaDateUtils';
import { calculateIKPA } from '../calculations/ikpa';

// Generate unique session identifier per browser tab / environment
export const CLIENT_SESSION_ID = `sess_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;

// Memory cache of last saved timestamp to prevent echo loops
let lastLocalSavedTimestamp = 0;
let saveTimeout: any = null;

export interface CloudSyncState {
  isConnected: boolean;
  lastSyncedAt: Date | null;
  lastOrigin: string | null;
  isSyncing: boolean;
}

// Listeners for sync state changes
type SyncStateListener = (state: CloudSyncState) => void;
const syncStateListeners: Set<SyncStateListener> = new Set();

let currentSyncState: CloudSyncState = {
  isConnected: true,
  lastSyncedAt: null,
  lastOrigin: null,
  isSyncing: false
};

function updateSyncState(patch: Partial<CloudSyncState>) {
  currentSyncState = { ...currentSyncState, ...patch };
  syncStateListeners.forEach(listener => {
    try {
      listener(currentSyncState);
    } catch (e) {
      console.warn('Error in sync state listener:', e);
    }
  });
}

export function subscribeSyncState(listener: SyncStateListener): () => void {
  syncStateListeners.add(listener);
  listener(currentSyncState);
  return () => {
    syncStateListeners.delete(listener);
  };
}

/**
 * Clean and serialize a SimulationProject so it safely saves to Firestore.
 */
function prepareProjectForFirestore(project: SimulationProject): any {
  const sanitized = sanitizeProjectDates(project);
  // Ensure output is fresh
  const withOutput = {
    ...sanitized,
    output: calculateIKPA(sanitized)
  };
  // JSON serialization strips any non-serializable prototype methods or undefined properties
  return JSON.parse(JSON.stringify(withOutput));
}

/**
 * Saves the active simulation project to Firestore with debouncing.
 * This guarantees changes made in either Google AI Studio or Deployment
 * are written to the shared cloud database in real time.
 */
export function saveSimulationToCloud(
  project: SimulationProject,
  immediate: boolean = false
): Promise<void> {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
    saveTimeout = null;
  }

  const doSave = async () => {
    try {
      updateSyncState({ isSyncing: true });
      const prepared = prepareProjectForFirestore(project);
      const nowIso = new Date().toISOString();
      lastLocalSavedTimestamp = Date.now();

      const payload = {
        id: project.id,
        name: project.name || 'Simulasi IKPA',
        updatedAt: nowIso,
        lastModifiedBy: CLIENT_SESSION_ID,
        origin: typeof window !== 'undefined' ? window.location.origin : 'unknown',
        projectData: prepared,
        activeProjectId: project.id,
        kodeSatker: project.metadata?.kodeSatker || '',
        namaSatker: project.metadata?.namaSatker || '',
        finalScore: prepared.output?.finalScore ?? 0
      };

      // 1. Save to the main active simulation document
      const activeDocRef = doc(db, 'simulasi_state', 'active_simulation');
      await setDoc(activeDocRef, payload);

      // 2. Also save to the specific project ID document
      const projectDocRef = doc(db, 'simulasi_projects', project.id);
      await setDoc(projectDocRef, payload);

      // 3. If a satker is identified, also update the satker-specific document
      if (project.metadata?.kodeSatker) {
        const satkerDocRef = doc(db, 'simulasi_ikpa_satker', project.metadata.kodeSatker);
        await setDoc(satkerDocRef, {
          kodeSatker: project.metadata.kodeSatker,
          namaSatker: project.metadata.namaSatker || '',
          lastUpdated: nowIso,
          projectName: project.name,
          finalScore: prepared.output?.finalScore ?? 0,
          projectData: prepared
        });
      }

      updateSyncState({
        isConnected: true,
        lastSyncedAt: new Date(),
        lastOrigin: typeof window !== 'undefined' ? window.location.origin : 'unknown',
        isSyncing: false
      });
    } catch (err: any) {
      console.warn('[CloudSync] Failed to save simulation to Cloud Firestore:', err);
      updateSyncState({ isSyncing: false, isConnected: false });
    }
  };

  if (immediate) {
    return doSave();
  }

  return new Promise((resolve) => {
    saveTimeout = setTimeout(() => {
      doSave().then(resolve);
    }, 600); // 600ms debounce
  });
}

/**
 * Fetch the latest active simulation project from Cloud Firestore.
 */
export async function fetchSimulationFromCloud(): Promise<{
  project: SimulationProject | null;
  updatedAt?: string;
  origin?: string;
}> {
  try {
    updateSyncState({ isSyncing: true });
    const activeDocRef = doc(db, 'simulasi_state', 'active_simulation');
    const snap = await getDoc(activeDocRef);

    if (snap.exists()) {
      const data = snap.data();
      if (data && data.projectData) {
        const loadedProject: SimulationProject = sanitizeProjectDates(data.projectData);
        loadedProject.output = calculateIKPA(loadedProject);
        updateSyncState({
          isConnected: true,
          lastSyncedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
          lastOrigin: data.origin || null,
          isSyncing: false
        });
        return {
          project: loadedProject,
          updatedAt: data.updatedAt,
          origin: data.origin
        };
      }
    }
    updateSyncState({ isSyncing: false });
    return { project: null };
  } catch (err: any) {
    console.warn('[CloudSync] Failed to fetch simulation from Cloud:', err);
    updateSyncState({ isSyncing: false, isConnected: false });
    return { project: null };
  }
}

/**
 * Subscribes to real-time Cloud Firestore updates on the active simulation.
 * Whenever an edit occurs in another window/tab/deployment, the callback is fired.
 */
export function subscribeSimulationFromCloud(
  onUpdate: (project: SimulationProject, meta: { lastModifiedBy: string; origin: string; updatedAt: string }) => void
): () => void {
  try {
    const activeDocRef = doc(db, 'simulasi_state', 'active_simulation');
    
    const unsubscribe = onSnapshot(activeDocRef, (snap: any) => {
      if (!snap.exists()) return;
      const data = snap.data();
      if (!data || !data.projectData) return;

      // Ignore echoes from this current tab/session
      if (data.lastModifiedBy === CLIENT_SESSION_ID) {
        return;
      }

      // Ignore if local save happened very recently (within 800ms) to prevent race conditions
      if (Date.now() - lastLocalSavedTimestamp < 800) {
        return;
      }

      try {
        const remoteProject: SimulationProject = sanitizeProjectDates(data.projectData);
        remoteProject.output = calculateIKPA(remoteProject);
        
        updateSyncState({
          isConnected: true,
          lastSyncedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
          lastOrigin: data.origin || null,
          isSyncing: false
        });

        onUpdate(remoteProject, {
          lastModifiedBy: data.lastModifiedBy || 'external',
          origin: data.origin || 'Cloud',
          updatedAt: data.updatedAt || new Date().toISOString()
        });
      } catch (err) {
        console.warn('[CloudSync] Error parsing remote project update:', err);
      }
    }, (error: any) => {
      console.warn('[CloudSync] Firestore subscription error:', error);
      updateSyncState({ isConnected: false });
    });

    return unsubscribe;
  } catch (err) {
    console.warn('[CloudSync] Failed to establish real-time snapshot listener:', err);
    return () => {};
  }
}

/**
 * Fetch Satker-specific simulation from Firestore.
 */
export async function fetchSatkerSimulationFromCloud(kodeSatker: string): Promise<SimulationProject | null> {
  if (!kodeSatker) return null;
  try {
    const snap = await getDoc(doc(db, 'simulasi_ikpa_satker', kodeSatker));
    if (snap.exists()) {
      const data = snap.data();
      if (data && data.projectData) {
        const loaded: SimulationProject = sanitizeProjectDates(data.projectData);
        loaded.output = calculateIKPA(loaded);
        return loaded;
      }
    }
    return null;
  } catch (e) {
    console.warn('[CloudSync] Error fetching satker simulation from cloud:', e);
    return null;
  }
}

/**
 * Save Satker-specific simulation to Firestore.
 */
export async function saveSatkerSimulationToCloud(
  kodeSatker: string,
  project: SimulationProject
): Promise<boolean> {
  if (!kodeSatker) return false;
  try {
    const prepared = prepareProjectForFirestore(project);
    const nowIso = new Date().toISOString();
    await setDoc(doc(db, 'simulasi_ikpa_satker', kodeSatker), {
      kodeSatker,
      namaSatker: project.metadata?.namaSatker || '',
      lastUpdated: nowIso,
      projectName: project.name,
      finalScore: prepared.output?.finalScore ?? 0,
      projectData: prepared
    });
    return true;
  } catch (e) {
    console.warn('[CloudSync] Error saving satker simulation to cloud:', e);
    return false;
  }
}

