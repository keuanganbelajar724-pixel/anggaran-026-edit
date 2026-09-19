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
 * Prefers the one with the later updatedAt timestamp.
 */
export function resolveLatestDraft(
  localDraft: PendaftaranUserSaktiDraft | null,
  cloudDraft: PendaftaranUserSaktiDraft | null
): { draft: PendaftaranUserSaktiDraft; source: 'local' | 'cloud' | 'equal' } | null {
  if (!localDraft && !cloudDraft) return null;
  if (!localDraft && cloudDraft) return { draft: cloudDraft, source: 'cloud' };
  if (localDraft && !cloudDraft) return { draft: localDraft, source: 'local' };

  const localTime = new Date(localDraft!.updatedAt || localDraft!.createdAt || 0).getTime();
  const cloudTime = new Date(cloudDraft!.updatedAt || cloudDraft!.createdAt || 0).getTime();

  if (cloudTime > localTime) {
    return { draft: cloudDraft!, source: 'cloud' };
  } else if (localTime > cloudTime) {
    return { draft: localDraft!, source: 'local' };
  }

  // If equal, prefer the one with users if one has users and the other is empty
  const localUsersCount = localDraft!.users?.length || 0;
  const cloudUsersCount = cloudDraft!.users?.length || 0;

  if (cloudUsersCount > localUsersCount) {
    return { draft: cloudDraft!, source: 'cloud' };
  }

  return { draft: localDraft!, source: 'equal' };
}
