import { doc, getDoc, setDoc, onSnapshot, db } from '../lib/firebase';
import { CatatanDiskusiSatker, SatkerDiskusiPayload } from '../types';

const LOCAL_STORAGE_KEY_PREFIX = 'kppn_catatan_diskusi_';

function getLocalKey(kodeSatker: string): string {
  return `${LOCAL_STORAGE_KEY_PREFIX}${kodeSatker.trim()}`;
}

export function getLocalCatatanDiskusi(kodeSatker: string): CatatanDiskusiSatker[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(getLocalKey(kodeSatker));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
      if (Array.isArray(parsed.list)) return parsed.list;
    }
  } catch (err) {
    console.warn('Error reading local catatan diskusi:', err);
  }
  return [];
}

export function saveLocalCatatanDiskusi(kodeSatker: string, list: CatatanDiskusiSatker[]): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(getLocalKey(kodeSatker), JSON.stringify(list));
  } catch (err) {
    console.warn('Error saving local catatan diskusi:', err);
  }
}

/**
 * Fetch all notes for a specific satker from Firestore, falling back to localStorage
 */
export async function fetchCatatanDiskusiSatker(kodeSatker: string): Promise<CatatanDiskusiSatker[]> {
  const cleanKode = kodeSatker.trim();
  const localList = getLocalCatatanDiskusi(cleanKode);

  try {
    const ref = doc(db, 'catatan_diskusi_satker', cleanKode);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data() as SatkerDiskusiPayload;
      if (Array.isArray(data.list)) {
        // Cache to local storage
        saveLocalCatatanDiskusi(cleanKode, data.list);
        return data.list;
      }
    }
  } catch (err) {
    console.warn('[CatatanDiskusi] Fetch error from cloud, using local:', err);
  }

  return localList;
}

/**
 * Save / update the entire list of notes for a Satker in Firestore and localStorage
 */
export async function saveCatatanDiskusiSatker(
  kodeSatker: string, 
  namaSatker: string, 
  list: CatatanDiskusiSatker[]
): Promise<void> {
  const cleanKode = kodeSatker.trim();
  
  // 1. Save locally first for instant responsiveness
  saveLocalCatatanDiskusi(cleanKode, list);

  // 2. Persist to Firestore
  try {
    const ref = doc(db, 'catatan_diskusi_satker', cleanKode);
    const payload: SatkerDiskusiPayload = {
      kodeSatker: cleanKode,
      namaSatker: namaSatker.trim(),
      list,
      updatedAt: new Date().toISOString()
    };
    await setDoc(ref, payload);
  } catch (err) {
    console.warn('[CatatanDiskusi] Failed to persist to Firestore:', err);
  }
}

/**
 * Subscribe to real-time updates for a Satker's discussion notes
 */
export function subscribeCatatanDiskusiSatker(
  kodeSatker: string,
  onUpdate: (list: CatatanDiskusiSatker[]) => void
): () => void {
  const cleanKode = kodeSatker.trim();
  try {
    const ref = doc(db, 'catatan_diskusi_satker', cleanKode);
    const unsubscribe = onSnapshot(ref, (snap: any) => {
      if (snap.exists()) {
        const data = snap.data() as SatkerDiskusiPayload;
        if (Array.isArray(data.list)) {
          saveLocalCatatanDiskusi(cleanKode, data.list);
          onUpdate(data.list);
        }
      }
    });
    return unsubscribe;
  } catch (err) {
    console.warn('[CatatanDiskusi] Snapshot error:', err);
    return () => {};
  }
}
