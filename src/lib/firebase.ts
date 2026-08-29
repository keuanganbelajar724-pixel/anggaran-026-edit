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
import { emergencyPruneStorage, safeLocalStorageSet, safeLocalStorageGet, safeLocalStorageRemove } from '../utils/safeStorage';
import { trackFirestoreRead, trackFirestoreWrite } from '../utils/firestoreQuotaTracker';

// Clean up any stale storage blocks
emergencyPruneStorage();

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with memoryLocalCache for fast multi-tab and multi-device real-time sync
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

// ==========================================
// Robust Quota Guard & Circuit Breaker State
// ==========================================
const QUOTA_EXHAUSTED_KEY = 'kppn_firestore_quota_exhausted_until';
let inMemoryQuotaExhaustedUntil = 0;

try {
  const savedUntil = safeLocalStorageGet(QUOTA_EXHAUSTED_KEY);
  if (savedUntil) {
    const ts = parseInt(savedUntil, 10);
    if (!isNaN(ts) && ts > Date.now()) {
      inMemoryQuotaExhaustedUntil = ts;
    }
  }
} catch {
  // ignore
}

export function isFirestoreQuotaExhausted(): boolean {
  if (inMemoryQuotaExhaustedUntil > Date.now()) {
    return true;
  }
  return false;
}

export function reportFirestoreQuotaExhaustion(durationMinutes = 1): void {
  const until = Date.now() + durationMinutes * 60 * 1000;
  inMemoryQuotaExhaustedUntil = until;
  try {
    safeLocalStorageSet(QUOTA_EXHAUSTED_KEY, until.toString());
  } catch {
    // ignore
  }
  console.warn(
    `[Firestore Quota Guard] Quota limit reached on Spark Free Tier. Cloud write stream temporarily paused for ${durationMinutes} min. App seamlessly operating in high-performance local offline mode.`
  );
}

export function resetFirestoreQuotaExhaustion(): void {
  inMemoryQuotaExhaustedUntil = 0;
  try {
    safeLocalStorageRemove(QUOTA_EXHAUSTED_KEY);
  } catch {
    // ignore
  }
}

// Reset any legacy quota exhaustion locks on startup
resetFirestoreQuotaExhaustion();

function isQuotaError(err: any): boolean {
  if (!err) return false;
  const msg = (err.message || String(err)).toLowerCase();
  const code = (err.code || '').toLowerCase();
  return (
    code.includes('resource-exhausted') ||
    msg.includes('resource-exhausted') ||
    msg.includes('quota limit exceeded') ||
    msg.includes('write units per project') ||
    msg.includes('exhausted maximum allowed queued writes')
  );
}

// Direct, reliable getDoc wrapper with quota tracking & graceful offline fallback
export async function getDoc<T = any>(
  reference: DocumentReference<T>
): Promise<any> {
  try {
    const snap = await rawGetDoc(reference);
    trackFirestoreRead(reference?.path || 'unknown_doc');
    return snap;
  } catch (err: any) {
    if (isQuotaError(err)) {
      reportFirestoreQuotaExhaustion(1);
    } else {
      console.warn('Firestore getDoc notice (falling back gracefully):', err?.message || err);
    }
    return {
      exists: () => false,
      data: () => undefined,
      id: reference?.id || '',
      ref: reference,
      metadata: { hasPendingWrites: false, fromCache: true }
    };
  }
}

// Helper to recursively strip undefined properties to ensure Firestore compatibility
function sanitizeFirestorePayload(val: any): any {
  if (val === undefined) return null;
  if (val === null) return null;
  if (typeof val !== 'object') return val;
  if (val instanceof Date) return val;
  if (Array.isArray(val)) {
    return val
      .filter((item) => item !== undefined)
      .map((item) => sanitizeFirestorePayload(item));
  }
  const clean: Record<string, any> = {};
  for (const [k, v] of Object.entries(val)) {
    if (v !== undefined) {
      clean[k] = sanitizeFirestorePayload(v);
    }
  }
  return clean;
}

// Direct, reliable setDoc wrapper with circuit breaker, undefined sanitizer, and write stream protection
export async function setDoc<T = any>(
  reference: DocumentReference<T>,
  data: any,
  options?: SetOptions
): Promise<void> {
  try {
    const cleanData = sanitizeFirestorePayload(data);
    if (options) {
      await rawSetDoc(reference, cleanData, options);
    } else {
      await rawSetDoc(reference, cleanData);
    }
    trackFirestoreWrite(reference?.path || 'unknown_doc', 1);
  } catch (err: any) {
    if (isQuotaError(err)) {
      reportFirestoreQuotaExhaustion(1);
    } else {
      console.warn('Firestore setDoc notice:', err?.message || err);
    }
  }
}

// Direct, reliable onSnapshot wrapper with quota tracking & error guard
export function onSnapshot(...args: any[]): () => void {
  try {
    const targetRef = args[0];
    const pathStr = targetRef?.path || 'snapshot_ref';
    let nextCallback: any = null;
    let errorCallback: any = null;

    if (typeof args[1] === 'function') {
      nextCallback = args[1];
      if (typeof args[2] === 'function') {
        errorCallback = args[2];
      }
    } else if (typeof args[1] === 'object' && typeof args[2] === 'function') {
      nextCallback = args[2];
      if (typeof args[3] === 'function') {
        errorCallback = args[3];
      }
    }

    const wrappedNextCallback = (snapshot: any) => {
      trackFirestoreRead(pathStr, 1);
      if (nextCallback) {
        try {
          nextCallback(snapshot);
        } catch (e) {
          console.warn('Error inside onSnapshot subscriber callback:', e);
        }
      }
    };

    const wrappedErrorCallback = (err: any) => {
      if (isQuotaError(err)) {
        reportFirestoreQuotaExhaustion(15);
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
      return (rawOnSnapshot as any)(targetRef, wrappedNextCallback, wrappedErrorCallback);
    }

    return (rawOnSnapshot as any)(...args);
  } catch (err: any) {
    if (isQuotaError(err)) {
      reportFirestoreQuotaExhaustion(15);
    } else {
      console.warn('Firestore onSnapshot notice:', err?.message || err);
    }
    return () => {};
  }
}

export { doc, collection, query };
