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
