/**
 * Safe LocalStorage Manager with automatic quota management & pruning
 */

export function safeLocalStorageSet(key: string, value: string): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e: any) {
    console.warn(`[safeStorage] QuotaExceededError while setting key "${key}". Running emergency cleanup...`);
    
    // 1. Run emergency pruning
    emergencyPruneStorage();
    
    // 2. Retry set
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (retryErr) {
      console.warn(`[safeStorage] Failed to save key "${key}" even after emergency cleanup:`, retryErr);
      return false;
    }
  }
}

export function safeLocalStorageGet(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeLocalStorageRemove(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore
  }
}

// -------------------------------------------------------------
// IndexedDB Large Dataset Storage (Zero Size Limit Persistence)
// -------------------------------------------------------------
const IDB_NAME = 'KPPN_Semarang1_Storage';
const IDB_STORE = 'app_datasets';
const IDB_VERSION = 1;

function openAppIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }
    const request = indexedDB.open(IDB_NAME, IDB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveLargeDataset<T = any>(key: string, data: T): Promise<boolean> {
  try {
    const db = await openAppIndexedDB();
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      store.put(data, key);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => {
        console.warn(`[safeStorage] IndexedDB put error for key ${key}:`, tx.error);
        resolve(false);
      };
    });
  } catch (err) {
    console.warn(`[safeStorage] IndexedDB open failed for key ${key}:`, err);
    return false;
  }
}

export async function getLargeDataset<T = any>(key: string): Promise<T | null> {
  try {
    const db = await openAppIndexedDB();
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result !== undefined ? req.result : null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function removeLargeDataset(key: string): Promise<void> {
  try {
    const db = await openAppIndexedDB();
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      store.delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // Ignore
  }
}

/**
 * Emergency Pruning to free up LocalStorage headroom
 */
export function emergencyPruneStorage(): void {
  if (typeof window === 'undefined') return;

  try {
    // 1. Remove all legacy firestore client coordination lock keys
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('firestore_') || k.startsWith('firebase:'))) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach(k => {
      try { localStorage.removeItem(k); } catch { /* Ignore */ }
    });

    // 2. Prune traffic analytics state
    const trafficKey = 'kppn_traffic_analytics_real_v2';
    const trafficRaw = localStorage.getItem(trafficKey);
    if (trafficRaw) {
      try {
        const parsed = JSON.parse(trafficRaw);
        if (parsed) {
          if (Array.isArray(parsed.recentLogs)) {
            parsed.recentLogs = parsed.recentLogs.slice(0, 25);
          }
          if (Array.isArray(parsed.satkerDailyRecords)) {
            parsed.satkerDailyRecords = parsed.satkerDailyRecords.slice(-14);
          }
          if (parsed.satkerDailyDevices && typeof parsed.satkerDailyDevices === 'object') {
            const dateKeys = Object.keys(parsed.satkerDailyDevices).sort().slice(-7);
            const prunedDaily: Record<string, string[]> = {};
            dateKeys.forEach(dk => { prunedDaily[dk] = parsed.satkerDailyDevices[dk]; });
            parsed.satkerDailyDevices = prunedDaily;
          }
          if (parsed.testerDailyDevices && typeof parsed.testerDailyDevices === 'object') {
            const dateKeys = Object.keys(parsed.testerDailyDevices).sort().slice(-3);
            const prunedDaily: Record<string, string[]> = {};
            dateKeys.forEach(dk => { prunedDaily[dk] = parsed.testerDailyDevices[dk]; });
            parsed.testerDailyDevices = prunedDaily;
          }
          if (Array.isArray(parsed.satkerAllTimeDevices) && parsed.satkerAllTimeDevices.length > 100) {
            parsed.satkerAllTimeDevices = parsed.satkerAllTimeDevices.slice(-100);
          }
          if (Array.isArray(parsed.testerAllTimeDevices) && parsed.testerAllTimeDevices.length > 50) {
            parsed.testerAllTimeDevices = parsed.testerAllTimeDevices.slice(-50);
          }
          localStorage.setItem(trafficKey, JSON.stringify(parsed));
        }
      } catch {
        // If corrupted, remove
        try { localStorage.removeItem(trafficKey); } catch { /* Ignore */ }
      }
    }

    // 3. Prune admin logs
    const adminLogKey = 'kppn_admin_activity_logs_v1';
    const adminLogRaw = localStorage.getItem(adminLogKey);
    if (adminLogRaw) {
      try {
        const parsedLogs = JSON.parse(adminLogRaw);
        if (Array.isArray(parsedLogs)) {
          localStorage.setItem(adminLogKey, JSON.stringify(parsedLogs.slice(0, 20)));
        }
      } catch {
        try { localStorage.removeItem(adminLogKey); } catch { /* Ignore */ }
      }
    }

    // 4. Prune Gemini chat history
    const geminiChatKey = 'kppn_gemini_chat_history';
    const geminiChatRaw = localStorage.getItem(geminiChatKey);
    if (geminiChatRaw) {
      try {
        const parsedChats = JSON.parse(geminiChatRaw);
        if (Array.isArray(parsedChats) && parsedChats.length > 20) {
          localStorage.setItem(geminiChatKey, JSON.stringify(parsedChats.slice(-20)));
        }
      } catch {
        try { localStorage.removeItem(geminiChatKey); } catch { /* Ignore */ }
      }
    }
  } catch (err) {
    console.warn('[safeStorage] Emergency prune failed:', err);
  }
}
