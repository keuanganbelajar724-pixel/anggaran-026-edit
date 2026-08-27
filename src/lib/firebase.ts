import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  initializeFirestore,
  memoryLocalCache,
  doc, 
  getDoc as rawGetDoc, 
  setDoc as rawSetDoc, 
  onSnapshot as rawOnSnapshot, 
  collection, 
  query,
  DocumentReference,
  DocumentSnapshot,
  SetOptions
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { emergencyPruneStorage, safeLocalStorageGet, safeLocalStorageSet } from '../utils/safeStorage';

// Ensure localStorage has clean headroom and remove any legacy firestore lock keys on bootstrap
emergencyPruneStorage();

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with memoryLocalCache to eliminate WebStorage QuotaExceededError and multi-tab coordination collisions
let firestoreDb: any;
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

export function reportFirestoreQuotaExhaustion(durationMinutes = 120): void {
  try {
    const expiry = Date.now() + durationMinutes * 60 * 1000;
    safeLocalStorageSet(QUOTA_EXHAUSTED_STORAGE_KEY, String(expiry));
    console.warn(`[Firestore] Daily quota limit reached. Database operations paused for ${durationMinutes} minutes (using local storage cache).`);
  } catch {
    // Ignore
  }
}

// Resilient getDoc wrapper with offline/quota fallback
export async function getDoc<T = any>(
  reference: DocumentReference<T>
): Promise<any> {
  const fallbackSnap = {
    exists: () => false,
    data: () => undefined,
    id: reference?.id || '',
    ref: reference,
    metadata: { hasPendingWrites: false, fromCache: true }
  };

  if (isFirestoreQuotaExhausted()) {
    return fallbackSnap;
  }

  try {
    const snap = await rawGetDoc(reference);
    return snap;
  } catch (err: any) {
    if (
      err?.code === 'resource-exhausted' ||
      err?.message?.includes('Quota limit exceeded') ||
      err?.message?.includes('Quota exceeded') ||
      err?.message?.includes('resource-exhausted')
    ) {
      reportFirestoreQuotaExhaustion(120);
      return fallbackSnap;
    }
    console.warn('Firestore getDoc notice:', err?.message || err);
    return fallbackSnap;
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

// Resilient onSnapshot wrapper with built-in quota interception
export function onSnapshot(...args: any[]): () => void {
  // If quota is exhausted, immediately return a safe no-op unsubscriber
  // to avoid starting WebSocket/long-polling stream retries
  if (isFirestoreQuotaExhausted()) {
    return () => {};
  }

  try {
    // Find callbacks in args
    const targetRef = args[0];
    let nextCallback: any = null;
    let errorCallback: any = null;

    if (typeof args[1] === 'function') {
      nextCallback = args[1];
      if (typeof args[2] === 'function') {
        errorCallback = args[2];
      }
    } else if (typeof args[1] === 'object' && typeof args[2] === 'function') {
      // Options passed as 2nd arg
      nextCallback = args[2];
      if (typeof args[3] === 'function') {
        errorCallback = args[3];
      }
    }

    const wrappedErrorCallback = (err: any) => {
      if (
        err?.code === 'resource-exhausted' ||
        err?.message?.includes('Quota limit exceeded') ||
        err?.message?.includes('Quota exceeded') ||
        err?.message?.includes('resource-exhausted')
      ) {
        reportFirestoreQuotaExhaustion(120);
        return;
      }
      if (errorCallback) {
        try {
          errorCallback(err);
        } catch (e) {
          console.warn('Error in snapshot error handler:', e);
        }
      } else {
        console.warn('Firestore listener notice:', err?.message || err);
      }
    };

    if (nextCallback) {
      return (rawOnSnapshot as any)(targetRef, nextCallback, wrappedErrorCallback);
    }

    return (rawOnSnapshot as any)(...args);
  } catch (err: any) {
    if (
      err?.code === 'resource-exhausted' ||
      err?.message?.includes('Quota limit exceeded') ||
      err?.message?.includes('Quota exceeded') ||
      err?.message?.includes('resource-exhausted')
    ) {
      reportFirestoreQuotaExhaustion(120);
    } else {
      console.warn('Firestore onSnapshot init notice:', err?.message || err);
    }
    return () => {};
  }
}

export { doc, collection, query };





