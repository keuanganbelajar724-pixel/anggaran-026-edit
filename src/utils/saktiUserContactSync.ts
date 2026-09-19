import { doc, collection, onSnapshot, getDocs, db } from '../lib/firebase';
import { UserSaktiRecord, PendaftaranUserSaktiDraft } from '../types';
import { SAKTI_DRAFT_COLLECTION, SAKTI_HISTORY_COLLECTION } from './saktiFirestoreSync';

export const SAKTI_USERS_CHANGED_EVENT = 'sakti_users_changed_event';

/**
 * Dispatch a window-level event so any active view (e.g. Kelola Data Satker)
 * instantly updates without waiting for network or tab refresh.
 */
export function dispatchSaktiUsersChanged(kodeSatker: string, users: UserSaktiRecord[]): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(SAKTI_USERS_CHANGED_EVENT, {
        detail: { kodeSatker, users }
      })
    );
  }
}

/**
 * Clean phone number into an international WhatsApp-ready format
 * e.g. "0812-3456-7890" -> "6281234567890"
 */
export function formatWhatsAppUrl(phone?: string, customMessage?: string): string {
  if (!phone) return '';
  let clean = phone.replace(/[^0-9]/g, '');
  if (!clean) return '';
  if (clean.startsWith('0')) {
    clean = '62' + clean.slice(1);
  } else if (!clean.startsWith('62')) {
    clean = '62' + clean;
  }
  const textParam = customMessage ? `?text=${encodeURIComponent(customMessage)}` : '';
  return `https://wa.me/${clean}${textParam}`;
}

/**
 * Clean phone for tel: link
 */
export function formatTelUrl(phone?: string): string {
  if (!phone) return '';
  const clean = phone.replace(/[^0-9+]/g, '');
  return `tel:${clean}`;
}

/**
 * Read all locally saved SAKTI users grouped by kodeSatker
 */
export function getAllLocalSaktiUsersMap(): Record<string, UserSaktiRecord[]> {
  const map: Record<string, UserSaktiRecord[]> = {};

  if (typeof localStorage === 'undefined') return map;

  try {
    // 1. Scan all active drafts: keys starting with "sakti_draft_"
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sakti_draft_')) {
        const kodeSatker = key.replace('sakti_draft_', '').trim();
        if (kodeSatker) {
          try {
            const raw = localStorage.getItem(key);
            if (raw) {
              const draft = JSON.parse(raw) as PendaftaranUserSaktiDraft;
              if (draft && Array.isArray(draft.users) && draft.users.length > 0) {
                map[kodeSatker] = draft.users;
              }
            }
          } catch (e) {
            // ignore JSON parse errors
          }
        }
      }
    }

    // 2. Scan finalized history drafts
    const histRaw = localStorage.getItem('sakti_pendaftaran_all_history');
    if (histRaw) {
      try {
        const historyList = JSON.parse(histRaw) as PendaftaranUserSaktiDraft[];
        if (Array.isArray(historyList)) {
          historyList.forEach((h) => {
            if (h && h.kodeSatker && Array.isArray(h.users) && h.users.length > 0) {
              // If not already populated or if history has users, merge or populate
              if (!map[h.kodeSatker] || map[h.kodeSatker].length === 0) {
                map[h.kodeSatker] = h.users;
              }
            }
          });
        }
      } catch (e) {
        // ignore
      }
    }
  } catch (err) {
    console.warn('[saktiUserContactSync] Error reading local drafts:', err);
  }

  return map;
}

/**
 * Subscribe to all SAKTI users across all Satkers in real-time.
 * Automatically combines:
 * 1. Immediate local storage state
 * 2. Window custom events (when a user is added, edited, or deleted in the same tab)
 * 3. Window storage events (when modified in another browser tab)
 * 4. Cloud Firestore collection listener (when modified across Google AI Studio & deployment)
 */
export function subscribeAllSaktiUserContacts(
  callback: (map: Record<string, UserSaktiRecord[]>) => void
): () => void {
  let inMemoryMap = getAllLocalSaktiUsersMap();

  // Send initial snapshot immediately
  callback(inMemoryMap);

  // 1. Listen to same-tab custom events
  const handleCustomEvent = (e: Event) => {
    const customEvt = e as CustomEvent<{ kodeSatker: string; users: UserSaktiRecord[] }>;
    if (customEvt.detail) {
      const { kodeSatker, users } = customEvt.detail;
      if (kodeSatker) {
        inMemoryMap = {
          ...inMemoryMap,
          [kodeSatker]: users || []
        };
        callback(inMemoryMap);
      }
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener(SAKTI_USERS_CHANGED_EVENT, handleCustomEvent);
  }

  // 2. Listen to cross-tab storage events
  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key && (e.key.startsWith('sakti_draft_') || e.key === 'sakti_pendaftaran_all_history')) {
      inMemoryMap = getAllLocalSaktiUsersMap();
      callback(inMemoryMap);
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorageEvent);
  }

  // 3. Listen to Cloud Firestore collection updates
  let firestoreUnsubscribe: (() => void) | null = null;
  try {
    const draftsCol = collection(db, SAKTI_DRAFT_COLLECTION);
    firestoreUnsubscribe = onSnapshot(
      draftsCol,
      (snapshot: any) => {
        if (!snapshot || !snapshot.docs) return;
        const updatedMap = { ...inMemoryMap };
        let hasChanges = false;

        snapshot.docs.forEach((d: any) => {
          const data = d.data();
          const kodeSatker = data?.kodeSatker || d.id;
          const users = Array.isArray(data?.users) ? data.users : [];
          if (kodeSatker) {
            updatedMap[kodeSatker] = users;
            hasChanges = true;
          }
        });

        if (hasChanges) {
          inMemoryMap = updatedMap;
          callback(inMemoryMap);
        }
      },
      (err: any) => {
        console.warn('[saktiUserContactSync] Firestore collection listener notice:', err);
      }
    );
  } catch (err) {
    console.warn('[saktiUserContactSync] Error creating Firestore listener:', err);
  }

  // Cleanup all listeners
  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener(SAKTI_USERS_CHANGED_EVENT, handleCustomEvent);
      window.removeEventListener('storage', handleStorageEvent);
    }
    if (firestoreUnsubscribe) {
      firestoreUnsubscribe();
    }
  };
}
