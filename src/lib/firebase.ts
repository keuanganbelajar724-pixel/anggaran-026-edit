import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  initializeFirestore, 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot,
  collection,
  query,
  getDocFromServer
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with forced long-polling to prevent WebChannel connection drops in iframe/sandboxed environments
let firestoreDb;
try {
  firestoreDb = initializeFirestore(app, {
    experimentalForceLongPolling: true
  }, firebaseConfig.firestoreDatabaseId || undefined);
} catch {
  firestoreDb = getFirestore(
    app,
    firebaseConfig.firestoreDatabaseId || undefined
  );
}

export const db = firestoreDb;
export { doc, getDoc, setDoc, onSnapshot, collection, query, getDocFromServer };

