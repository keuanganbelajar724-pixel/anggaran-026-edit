/**
 * Firestore Spark Plan Quota Tracker & Telemetry Service
 * Tracks daily estimated Firestore Reads, Writes, Deletes, and Stored Data Payload
 * based on Google Firebase Spark (Free Tier) Limits.
 */

export interface SparkPlanLimits {
  dailyReadsLimit: number;
  dailyWritesLimit: number;
  dailyDeletesLimit: number;
  storedDataLimitMB: number;
  monthlyEgressLimitMB: number;
  maxConcurrentConnections: number;
}

export const SPARK_LIMITS: SparkPlanLimits = {
  dailyReadsLimit: 50000,
  dailyWritesLimit: 20000,
  dailyDeletesLimit: 20000,
  storedDataLimitMB: 1024, // 1 GiB
  monthlyEgressLimitMB: 10240, // 10 GiB
  maxConcurrentConnections: 100
};

export interface CollectionUsageStat {
  collectionName: string;
  documentPath: string;
  category: string;
  readCount: number;
  writeCount: number;
  estimatedDocCount: number;
  estimatedSizeBytes: number;
  lastAccessed: string;
}

export interface DailyQuotaUsage {
  date: string; // YYYY-MM-DD
  reads: number;
  writes: number;
  deletes: number;
  estimatedEgressBytes: number;
  collectionBreakdown: Record<string, { reads: number; writes: number; deletes: number }>;
}

export interface QuotaHealthStatus {
  status: 'EXCELLENT' | 'GOOD' | 'WARNING' | 'CRITICAL';
  statusLabel: string;
  readsUsagePercent: number;
  writesUsagePercent: number;
  storageUsagePercent: number;
  readsRemaining: number;
  writesRemaining: number;
  storageRemainingMB: number;
  safetyDaysRemainingAtCurrentPace: number;
  recommendation: string;
}

const STORAGE_KEY_DAILY_QUOTA = 'kppn_firestore_daily_quota_stats';
const STORAGE_KEY_HISTORICAL_QUOTA = 'kppn_firestore_quota_history_7d';

function getTodayKey(): string {
  const now = new Date();
  return now.toISOString().slice(0, 10);
}

// In-memory runtime session counters
let sessionReads = 0;
let sessionWrites = 0;
let sessionDeletes = 0;

/**
 * Load today's persisted usage stats from local storage
 */
export function getDailyQuotaUsage(): DailyQuotaUsage {
  const today = getTodayKey();
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DAILY_QUOTA);
    if (raw) {
      const parsed: DailyQuotaUsage = JSON.parse(raw);
      if (parsed.date === today) {
        return parsed;
      }
      // New day: archive yesterday and initialize new day
      archivePastDay(parsed);
    }
  } catch (e) {
    console.warn('Failed to parse daily quota usage', e);
  }

  const initial: DailyQuotaUsage = {
    date: today,
    reads: sessionReads,
    writes: sessionWrites,
    deletes: sessionDeletes,
    estimatedEgressBytes: 0,
    collectionBreakdown: {}
  };
  saveDailyQuotaUsage(initial);
  return initial;
}

function saveDailyQuotaUsage(usage: DailyQuotaUsage) {
  try {
    localStorage.setItem(STORAGE_KEY_DAILY_QUOTA, JSON.stringify(usage));
  } catch (e) {
    console.warn('Failed to save daily quota usage', e);
  }
}

function archivePastDay(pastUsage: DailyQuotaUsage) {
  try {
    const rawHistory = localStorage.getItem(STORAGE_KEY_HISTORICAL_QUOTA);
    let history: DailyQuotaUsage[] = rawHistory ? JSON.parse(rawHistory) : [];
    history = [pastUsage, ...history.filter(h => h.date !== pastUsage.date)].slice(0, 14);
    localStorage.setItem(STORAGE_KEY_HISTORICAL_QUOTA, JSON.stringify(history));
  } catch (e) {
    console.warn('Failed to archive past day quota usage', e);
  }
}

/**
 * Get the last 7 days of quota usage
 */
export function get7DaysQuotaHistory(): DailyQuotaUsage[] {
  try {
    const rawHistory = localStorage.getItem(STORAGE_KEY_HISTORICAL_QUOTA);
    const history: DailyQuotaUsage[] = rawHistory ? JSON.parse(rawHistory) : [];
    const current = getDailyQuotaUsage();
    return [current, ...history.filter(h => h.date !== current.date)].slice(0, 7);
  } catch {
    return [getDailyQuotaUsage()];
  }
}

/**
 * Track a Firestore Read operation
 */
export function trackFirestoreRead(docOrCollectionPath: string, count: number = 1) {
  sessionReads += count;
  const usage = getDailyQuotaUsage();
  usage.reads = (usage.reads || 0) + count;
  
  const pathKey = docOrCollectionPath || 'data/unknown';
  if (!usage.collectionBreakdown[pathKey]) {
    usage.collectionBreakdown[pathKey] = { reads: 0, writes: 0, deletes: 0 };
  }
  usage.collectionBreakdown[pathKey].reads += count;
  
  saveDailyQuotaUsage(usage);
}

/**
 * Track a Firestore Write / setDoc operation
 */
export function trackFirestoreWrite(docOrCollectionPath: string, count: number = 1, payloadSizeBytes: number = 0) {
  sessionWrites += count;
  const usage = getDailyQuotaUsage();
  usage.writes = (usage.writes || 0) + count;
  usage.estimatedEgressBytes = (usage.estimatedEgressBytes || 0) + payloadSizeBytes;

  const pathKey = docOrCollectionPath || 'data/unknown';
  if (!usage.collectionBreakdown[pathKey]) {
    usage.collectionBreakdown[pathKey] = { reads: 0, writes: 0, deletes: 0 };
  }
  usage.collectionBreakdown[pathKey].writes += count;

  saveDailyQuotaUsage(usage);
}

/**
 * Track a Firestore Delete operation
 */
export function trackFirestoreDelete(docOrCollectionPath: string, count: number = 1) {
  sessionDeletes += count;
  const usage = getDailyQuotaUsage();
  usage.deletes = (usage.deletes || 0) + count;

  const pathKey = docOrCollectionPath || 'data/unknown';
  if (!usage.collectionBreakdown[pathKey]) {
    usage.collectionBreakdown[pathKey] = { reads: 0, writes: 0, deletes: 0 };
  }
  usage.collectionBreakdown[pathKey].deletes += count;

  saveDailyQuotaUsage(usage);
}

/**
 * Calculate approximate byte size of stored data payload in JSON
 */
export function calculateObjectSizeBytes(obj: any): number {
  try {
    const str = JSON.stringify(obj);
    return new Blob([str]).size;
  } catch {
    return 0;
  }
}

/**
 * Compute real-time Quota Health Analysis
 */
export function calculateQuotaHealth(
  dailyUsage: DailyQuotaUsage,
  totalStoredBytes: number
): QuotaHealthStatus {
  const reads = dailyUsage.reads || 0;
  const writes = dailyUsage.writes || 0;
  const storedMB = totalStoredBytes / (1024 * 1024);

  const readsUsagePercent = Number(((reads / SPARK_LIMITS.dailyReadsLimit) * 100).toFixed(2));
  const writesUsagePercent = Number(((writes / SPARK_LIMITS.dailyWritesLimit) * 100).toFixed(2));
  const storageUsagePercent = Number(((storedMB / SPARK_LIMITS.storedDataLimitMB) * 100).toFixed(3));

  const maxUsagePercent = Math.max(readsUsagePercent, writesUsagePercent, storageUsagePercent);

  let status: QuotaHealthStatus['status'] = 'EXCELLENT';
  let statusLabel = 'Sangat Sehat (Kuota Melimpah)';
  let recommendation = 'Penggunaan kuota Firestore Spark Plan sangat optimal dan efisien. Tidak ada kendala penggunaan.';

  if (maxUsagePercent >= 90) {
    status = 'CRITICAL';
    statusLabel = 'Kritis (>90% Kuota Terpakai)';
    recommendation = 'Peringatan: Kuota harian Firestore hampir habis. Disarankan mengaktifkan Mode Hemat Kuota (Cache-Only) atau menunggu reset otomatis pukul 14:00 WIB (00:00 UTC).';
  } else if (maxUsagePercent >= 70) {
    status = 'WARNING';
    statusLabel = 'Waspada (70%-90% Kuota Terpakai)';
    recommendation = 'Penggunaan kuota cukup tinggi hari ini. Batasi pengunggahan file Excel masif berulang atau gunakan fitur Smart Caching.';
  } else if (maxUsagePercent >= 40) {
    status = 'GOOD';
    statusLabel = 'Baik & Stabil (<70% Kuota Terpakai)';
    recommendation = 'Sistem berjalan normal dengan batas aman yang longgar. Kuota masih sangat mencukupi untuk operasional harian KPPN.';
  }

  const readsRemaining = Math.max(0, SPARK_LIMITS.dailyReadsLimit - reads);
  const writesRemaining = Math.max(0, SPARK_LIMITS.dailyWritesLimit - writes);
  const storageRemainingMB = Math.max(0, SPARK_LIMITS.storedDataLimitMB - storedMB);

  return {
    status,
    statusLabel,
    readsUsagePercent,
    writesUsagePercent,
    storageUsagePercent,
    readsRemaining,
    writesRemaining,
    storageRemainingMB: Number(storageRemainingMB.toFixed(2)),
    safetyDaysRemainingAtCurrentPace: reads > 0 ? Math.floor(readsRemaining / Math.max(reads, 100)) : 30,
    recommendation
  };
}

/**
 * Direct link to Firebase Console for project
 */
export function getFirebaseConsoleUrl(projectId: string = 'ai-studio-monitoringikpakp-206fe31a-ed73-4490-9e83-a99e5e98fbf3'): string {
  return `https://console.firebase.google.com/project/${projectId}/firestore/usage`;
}

/**
 * Format bytes to readable unit (Bytes, KB, MB, GB)
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
