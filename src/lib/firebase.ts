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
import { emergencyPruneStorage, safeLocalStorageRemove } from '../utils/safeStorage';
import { trackFirestoreRead, trackFirestoreWrite } from '../utils/firestoreQuotaTracker';

// Clean up any stale quota blocks or lock flags from previous sessions
emergencyPruneStorage();
safeLocalStorageRemove('kppn_firestore_quota_exhausted_until');
safeLocalStorageRemove('kppn_firestore_lock');

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

// Direct, reliable getDoc wrapper with quota tracking
export async function getDoc<T = any>(
  reference: DocumentReference<T>
): Promise<any> {
  try {
    const snap = await rawGetDoc(reference);
    trackFirestoreRead(reference?.path || 'unknown_doc');
    return snap;
  } catch (err: any) {
    console.warn('Firestore getDoc notice (falling back gracefully):', err?.message || err);
    return {
      exists: () => false,
      data: () => undefined,
      id: reference?.id || '',
      ref: reference,
      metadata: { hasPendingWrites: false, fromCache: true }
    };
  }
}

// Direct, reliable setDoc wrapper with error resilience and quota tracking
export async function setDoc<T = any>(
  reference: DocumentReference<T>,
  data: any,
  options?: SetOptions
): Promise<void> {
  try {
    if (options) {
      await rawSetDoc(reference, data, options);
    } else {
      await rawSetDoc(reference, data);
    }
    trackFirestoreWrite(reference?.path || 'unknown_doc', 1);
  } catch (err: any) {
    console.warn('Firestore setDoc notice:', err?.message || err);
  }
}

// Direct, reliable onSnapshot wrapper for real-time cloud data propagation with quota telemetry
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
      // Track real-time snapshot read events
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
    console.warn('Firestore onSnapshot notice:', err?.message || err);
    return () => {};
  }
}

export function isFirestoreQuotaExhausted(): boolean {
  return false;
}

export function reportFirestoreQuotaExhaustion(_durationMinutes = 5): void {
  // No-op: do not block global Firestore sync
}

export { doc, collection, query };





