import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot, 
  collection, 
  query 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with robust multi-tab persistent cache and auto-detecting transport to prevent network/offline unavailable errors
let firestoreDb;
try {
  firestoreDb = initializeFirestore(
    app,
    {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      }),
      experimentalAutoDetectLongPolling: true,
    },
    firebaseConfig.firestoreDatabaseId || undefined
  );
} catch (e) {
  // If already initialized or fallback needed
  firestoreDb = getFirestore(
    app,
    firebaseConfig.firestoreDatabaseId || undefined
  );
}

export const db = firestoreDb;
export { doc, getDoc, setDoc, onSnapshot, collection, query };



