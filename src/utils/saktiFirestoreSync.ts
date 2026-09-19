import { db, doc, getDoc, setDoc, onSnapshot } from '../lib/firebase';
import { PendaftaranUserSaktiDraft } from '../types';

/**
 * Collection paths for SAKTI user management in Firestore
 */
const SAKTI_DRAFT_COLLECTION = 'sakti_pendaftaran_drafts';
const SAKTI_HISTORY_COLLECTION = 'sakti_pendaftaran_history';

/**
 * Helper to get local storage keys
 */
export const getLocalDraftKey = (kodeSatker: string) => `sakti_pendaftaran_draft_${kodeSatker}`;
export const getLocalHistoryKey = () => 'sakti_pendaftaran_all_history';

/**
 * Save SAKTI Pendaftaran Draft to Firestore with isolated satker document
 */
export async function saveSaktiDraftToFirestore(draft: PendaftaranUserSaktiDraft): Promise<boolean> {
  if (!draft || !draft.kodeSatker) return false;
  try {
    const docRef = doc(db, SAKTI_DRAFT_COLLECTION, draft.kodeSatker);
    const payload = {
      ...draft,
      cloudSyncedAt: new Date().toISOString()
    };
    await setDoc(docRef, payload);
    return true;
  } catch (err) {
    console.warn('[saktiFirestoreSync] Notice saving draft to Firestore:', err);
    return false;
  }
}

/**
 * Fetch SAKTI Pendaftaran Draft from Firestore for a specific Satker
 */
export async function fetchSaktiDraftFromFirestore(kodeSatker: string): Promise<PendaftaranUserSaktiDraft | null> {
  if (!kodeSatker) return null;
  try {
    const docRef = doc(db, SAKTI_DRAFT_COLLECTION, kodeSatker);
    const snap = await getDoc(docRef);
    if (snap && snap.exists()) {
      const data = snap.data() as PendaftaranUserSaktiDraft;
      return data;
    }
    return null;
  } catch (err) {
    console.warn('[saktiFirestoreSync] Notice fetching draft from Firestore:', err);
    return null;
  }
}

/**
 * Save all history records to Firestore
 */
export async function saveSaktiHistoryToFirestore(historyList: PendaftaranUserSaktiDraft[]): Promise<boolean> {
  if (!Array.isArray(historyList)) return false;
  try {
    const docRef = doc(db, SAKTI_HISTORY_COLLECTION, 'all');
    await setDoc(docRef, {
      records: historyList,
      totalCount: historyList.length,
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (err) {
    console.warn('[saktiFirestoreSync] Notice saving history to Firestore:', err);
    return false;
  }
}

/**
 * Fetch all history records from Firestore
 */
export async function fetchSaktiHistoryFromFirestore(): Promise<PendaftaranUserSaktiDraft[] | null> {
  try {
    const docRef = doc(db, SAKTI_HISTORY_COLLECTION, 'all');
    const snap = await getDoc(docRef);
    if (snap && snap.exists()) {
      const data = snap.data();
      if (Array.isArray(data?.records)) {
        return data.records;
      }
    }
    return null;
  } catch (err) {
    console.warn('[saktiFirestoreSync] Notice fetching history from Firestore:', err);
    return null;
  }
}

/**
 * Smart merge between Local Draft and Cloud Draft:
 * Protects against accidental overwrites by empty local templates.
 */
export function resolveLatestDraft(
  localDraft: PendaftaranUserSaktiDraft | null,
  cloudDraft: PendaftaranUserSaktiDraft | null
): { draft: PendaftaranUserSaktiDraft; source: 'local' | 'cloud' | 'equal' } | null {
  if (!localDraft && !cloudDraft) return null;
  if (!localDraft && cloudDraft) return { draft: cloudDraft, source: 'cloud' };
  if (localDraft && !cloudDraft) return { draft: localDraft, source: 'local' };

  const localUsersCount = localDraft?.users?.length || 0;
  const cloudUsersCount = cloudDraft?.users?.length || 0;

  // RULE 1: If Cloud Draft has user records and Local Draft has 0 users (e.g. freshly opened browser/deployment session),
  // CLOUD MUST ALWAYS PREVAIL! Never allow an empty template to overwrite real cloud data.
  if (cloudUsersCount > 0 && localUsersCount === 0) {
    return { draft: cloudDraft!, source: 'cloud' };
  }

  // RULE 2: If Local Draft has user records and Cloud Draft has 0 users, Local Draft wins and will be synced to Cloud.
  if (localUsersCount > 0 && cloudUsersCount === 0) {
    return { draft: localDraft!, source: 'local' };
  }

  // RULE 3: If both have users (or both are empty), compare timestamps
  const localTime = new Date(localDraft!.updatedAt || localDraft!.createdAt || 0).getTime();
  const cloudTime = new Date(cloudDraft!.updatedAt || cloudDraft!.createdAt || 0).getTime();

  if (cloudTime > localTime) {
    return { draft: cloudDraft!, source: 'cloud' };
  } else if (localTime > cloudTime) {
    return { draft: localDraft!, source: 'local' };
  }

  // If timestamps are equal, choose the one with more user records
  if (cloudUsersCount >= localUsersCount) {
    return { draft: cloudDraft!, source: 'cloud' };
  }

  return { draft: localDraft!, source: 'equal' };
}

/**
 * Subscribe to real-time updates for a Satker draft from Cloud Firestore
 */
export function subscribeSaktiDraftFromFirestore(
  kodeSatker: string,
  onUpdate: (draft: PendaftaranUserSaktiDraft) => void
): () => void {
  if (!kodeSatker) return () => {};
  try {
    const docRef = doc(db, SAKTI_DRAFT_COLLECTION, kodeSatker);
    const unsubscribe = onSnapshot(
      docRef,
      (snap) => {
        if (snap && snap.exists()) {
          const data = snap.data() as PendaftaranUserSaktiDraft;
          if (data && data.kodeSatker === kodeSatker) {
            onUpdate(data);
          }
        }
      },
      (err) => {
        console.warn('[saktiFirestoreSync] onSnapshot listener notice:', err);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn('[saktiFirestoreSync] subscribe notice:', err);
    return () => {};
  }
}
