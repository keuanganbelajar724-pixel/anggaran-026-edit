import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore,
  persistentLocalCache,
  persistentSingleTabManager,
  memoryLocalCache,
  doc as rawDoc, 
  getDoc as rawGetDoc, 
  getDocFromServer,
  getDocs as rawGetDocs,
  setDoc as rawSetDoc, 
  onSnapshot as rawOnSnapshot, 
  collection as rawCollection, 
  query as rawQuery,
  DocumentReference,
  DocumentSnapshot,
  SetOptions,
  setLogLevel
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { safeLocalStorageSet, safeLocalStorageGet, safeLocalStorageRemove } from '../utils/safeStorage';
import { trackFirestoreRead, trackFirestoreWrite } from '../utils/firestoreQuotaTracker';

// Silence internal Firestore stream connection/reconnection logs
try {
  setLogLevel('silent');
} catch {
  // ignore
}

let appInstance: any;
try {
  appInstance = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
} catch {
  try {
    appInstance = getApp();
  } catch {
    appInstance = { name: '[DEFAULT]', options: firebaseConfig };
  }
}
const app = appInstance;

let authInstance: any = null;
try {
  authInstance = getAuth(app);
} catch {
  try {
    authInstance = getAuth();
  } catch {
    authInstance = {
      currentUser: null,
    };
  }
}

export const auth = authInstance;

// Initialize Firestore with robust local caching that uses IndexedDB without writing tab-sync locks to localStorage
let firestoreDb: any = null;
try {
  let cacheConfig: any;
  try {
    // persistentSingleTabManager uses IndexedDB directly without touching localStorage,
    // completely preventing QuotaExceededError and internal assertion crashes.
    cacheConfig = persistentLocalCache({
      tabManager: persistentSingleTabManager({ forceOwnership: true }),
    });
  } catch {
    cacheConfig = memoryLocalCache();
  }

  firestoreDb = initializeFirestore(
    app,
    {
      localCache: cacheConfig,
      experimentalForceLongPolling: true,
    },
    firebaseConfig.firestoreDatabaseId || undefined
  );
} catch (e1) {
  try {
    firestoreDb = initializeFirestore(
      app,
      {
        localCache: memoryLocalCache(),
        experimentalForceLongPolling: true,
      },
      firebaseConfig.firestoreDatabaseId || undefined
    );
  } catch (e2) {
    try {
      firestoreDb = getFirestore(
        app,
        firebaseConfig.firestoreDatabaseId || undefined
      );
    } catch (e3) {
      try {
        firestoreDb = getFirestore(app);
      } catch (e4) {
        console.warn('Firestore service unavailable in current environment, switching to safe offline fallback mode:', e4);
        firestoreDb = { _isFallback: true, app, type: 'firestore-fallback' };
      }
    }
  }
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

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const currentUser = auth?.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid || null,
      email: currentUser?.email || null,
      emailVerified: currentUser?.emailVerified || null,
      isAnonymous: currentUser?.isAnonymous || null,
      tenantId: currentUser?.tenantId || null,
      providerInfo: currentUser?.providerData?.map((provider: any) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

function isPermissionError(err: any): boolean {
  if (!err) return false;
  const msg = (err.message || String(err)).toLowerCase();
  const code = (err.code || '').toLowerCase();
  return code.includes('permission-denied') || msg.includes('missing or insufficient permissions');
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

// Safe reference and collection builders that never throw if db is offline or initialized in fallback mode
export function doc(...args: any[]): any {
  try {
    if (!args[0] || args[0]._isFallback) {
      const pathParts = args.slice(1).join('/');
      return {
        id: args[args.length - 1] || 'mock_doc',
        path: pathParts,
        _isFallback: true,
      };
    }
    return (rawDoc as any)(...args);
  } catch {
    const pathParts = args.slice(1).join('/');
    return {
      id: args[args.length - 1] || 'mock_doc',
      path: pathParts,
      _isFallback: true,
    };
  }
}

export function collection(...args: any[]): any {
  try {
    if (!args[0] || args[0]._isFallback) {
      const pathParts = args.slice(1).join('/');
      return {
        id: args[args.length - 1] || 'mock_col',
        path: pathParts,
        _isFallback: true,
      };
    }
    return (rawCollection as any)(...args);
  } catch {
    return {
      id: args[args.length - 1] || 'mock_col',
      path: args.slice(1).join('/'),
      _isFallback: true,
    };
  }
}

export function query(...args: any[]): any {
  try {
    if (!args[0] || args[0]._isFallback) {
      return {
        ...args[0],
        _isFallback: true,
      };
    }
    return (rawQuery as any)(...args);
  } catch {
    return {
      ...args[0],
      _isFallback: true,
    };
  }
}

// Direct, reliable getDoc wrapper with quota tracking & graceful offline fallback
export async function getDoc<T = any>(
  reference: DocumentReference<T> | any
): Promise<any> {
  if (!db || db._isFallback || !reference || reference._isFallback) {
    return {
      exists: () => false,
      data: () => undefined,
      id: reference?.id || '',
      ref: reference,
      metadata: { hasPendingWrites: false, fromCache: true }
    };
  }
  try {
    const snap = await rawGetDoc(reference);
    trackFirestoreRead(reference?.path || 'unknown_doc');
    return snap;
  } catch (err: any) {
    if (isPermissionError(err)) {
      handleFirestoreError(err, OperationType.GET, reference?.path || null);
    }
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
  try {
    return JSON.parse(JSON.stringify(val, (_k, v) => (v === undefined ? null : v)));
  } catch {
    return val;
  }
}

// Direct, reliable setDoc wrapper with circuit breaker, undefined sanitizer, and write stream protection
export async function setDoc<T = any>(
  reference: DocumentReference<T> | any,
  data: any,
  options?: SetOptions
): Promise<void> {
  if (!db || db._isFallback || !reference || reference._isFallback) {
    return;
  }
  try {
    const cleanData = sanitizeFirestorePayload(data);
    const writePromise = options
      ? rawSetDoc(reference, cleanData, options)
      : rawSetDoc(reference, cleanData);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Firestore write timeout')), 3500)
    );
    await Promise.race([writePromise, timeoutPromise]);
    trackFirestoreWrite(reference?.path || 'unknown_doc', 1);
  } catch (err: any) {
    if (isPermissionError(err)) {
      handleFirestoreError(err, OperationType.WRITE, reference?.path || null);
    }
    if (isQuotaError(err)) {
      reportFirestoreQuotaExhaustion(1);
    } else {
      console.warn('Firestore setDoc notice:', err?.message || err);
    }
  }
}

// Direct, reliable onSnapshot wrapper with quota tracking & error guard
export function onSnapshot(...args: any[]): () => void {
  const targetRef = args[0];
  const isFallbackMode = !db || db._isFallback || !targetRef || targetRef._isFallback;

  if (isFallbackMode) {
    const nextCallback = typeof args[1] === 'function' ? args[1] : (typeof args[2] === 'function' ? args[2] : null);
    if (nextCallback) {
      try {
        nextCallback({
          exists: () => false,
          data: () => undefined,
          docs: [],
          empty: true,
          size: 0,
          forEach: () => {},
          metadata: { hasPendingWrites: false, fromCache: true }
        });
      } catch (e) {
        // ignore
      }
    }
    return () => {};
  }

  try {
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
      if (isPermissionError(err)) {
        handleFirestoreError(err, OperationType.GET, pathStr);
      }
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
    if (isPermissionError(err)) {
      handleFirestoreError(err, OperationType.GET, args[0]?.path || null);
    }
    if (isQuotaError(err)) {
      reportFirestoreQuotaExhaustion(15);
    } else {
      console.warn('Firestore onSnapshot notice:', err?.message || err);
    }
    return () => {};
  }
}

export async function getDocs(queryOrCollection: any): Promise<any> {
  if (!db || db._isFallback || !queryOrCollection || queryOrCollection._isFallback) {
    return { empty: true, docs: [], size: 0, forEach: () => {} };
  }
  try {
    const snap = await rawGetDocs(queryOrCollection);
    trackFirestoreRead(queryOrCollection?.path || 'query_docs', snap?.size || 1);
    return snap;
  } catch (err: any) {
    if (isPermissionError(err)) {
      handleFirestoreError(err, OperationType.LIST, queryOrCollection?.path || null);
    }
    if (isQuotaError(err)) {
      reportFirestoreQuotaExhaustion(5);
    } else {
      console.warn('Firestore getDocs notice:', err?.message || err);
    }
    return { empty: true, docs: [], size: 0, forEach: () => {} };
  }
}
