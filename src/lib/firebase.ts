import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  initializeFirestore,
  memoryLocalCache,
  doc, 
  getDoc, 
  setDoc as rawSetDoc, 
  onSnapshot as rawOnSnapshot, 
  collection, 
  query,
  DocumentReference,
  SetOptions
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { emergencyPruneStorage, safeLocalStorageGet, safeLocalStorageSet } from '../utils/safeStorage';

// Ensure localStorage has clean headroom and remove any legacy firestore lock keys on bootstrap
emergencyPruneStorage();

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with memoryLocalCache to eliminate WebStorage QuotaExceededError and multi-tab coordination collisions
let firestoreDb;
try {
  firestoreDb = initializeFirestore(
    app,
    {
      localCache: memoryLocalCache(),
      experimentalAutoDetectLongPolling: true,
    },
    firebaseConfig.firestoreDatabaseId || undefined
  );
} catch (e) {
  firestoreDb = getFirestore(
    app,
    firebaseConfig.firestoreDatabaseId || undefined
  );
}

export const db = firestoreDb;

const QUOTA_EXHAUSTED_STORAGE_KEY = 'kppn_firestore_quota_exhausted_until';

export function isFirestoreQuotaExhausted(): boolean {
  try {
    const raw = safeLocalStorageGet(QUOTA_EXHAUSTED_STORAGE_KEY);
    if (!raw) return false;
    const expiry = Number(raw);
    if (isNaN(expiry)) return false;
    return Date.now() < expiry;
  } catch {
    return false;
  }
}

export function reportFirestoreQuotaExhaustion(durationMinutes = 60): void {
  try {
    const expiry = Date.now() + durationMinutes * 60 * 1000;
    safeLocalStorageSet(QUOTA_EXHAUSTED_STORAGE_KEY, String(expiry));
    console.warn(`[Firestore] Daily write quota reached. Writes paused for ${durationMinutes} minutes.`);
  } catch {
    // Ignore
  }
}

// Resilient setDoc wrapper
export async function setDoc<T = any>(
  reference: DocumentReference<T>,
  data: any,
  options?: SetOptions
): Promise<void> {
  if (isFirestoreQuotaExhausted()) {
    // Silently return to prevent SDK from attempting write & triggering backoff errors
    return;
  }

  try {
    if (options) {
      await rawSetDoc(reference, data, options);
    } else {
      await rawSetDoc(reference, data);
    }
  } catch (err: any) {
    if (
      err?.code === 'resource-exhausted' ||
      err?.message?.includes('Quota limit exceeded') ||
      err?.message?.includes('Quota exceeded') ||
      err?.message?.includes('resource-exhausted')
    ) {
      reportFirestoreQuotaExhaustion(120);
      return;
    }
    console.warn('Firestore setDoc notice:', err?.message || err);
  }
}

// Resilient onSnapshot wrapper with built-in error handler
export function onSnapshot(...args: any[]): () => void {
  try {
    const hasErrorCallback = args.some((arg, index) => index > 0 && typeof arg === 'function' && index >= 2);
    
    if (!hasErrorCallback) {
      const safeErrorCallback = (err: any) => {
        if (
          err?.code === 'resource-exhausted' ||
          err?.message?.includes('Quota limit exceeded') ||
          err?.message?.includes('Quota exceeded') ||
          err?.message?.includes('resource-exhausted')
        ) {
          reportFirestoreQuotaExhaustion(60);
          return;
        }
        console.warn('Firestore listener notice:', err?.message || err);
      };
      
      return (rawOnSnapshot as any)(...args, safeErrorCallback);
    }

    return (rawOnSnapshot as any)(...args);
  } catch (err: any) {
    console.warn('Firestore onSnapshot init notice:', err?.message || err);
    return () => {};
  }
}

export { doc, getDoc, collection, query };




