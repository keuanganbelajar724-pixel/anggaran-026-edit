import { db, doc, setDoc, onSnapshot } from '../lib/firebase';

export type AdminLogCategory = 'AUTH' | 'UPLOAD' | 'SETTINGS' | 'ANNOUNCEMENT' | 'BROADCAST' | 'TICKET';
export type AdminLogStatus = 'SUCCESS' | 'WARNING' | 'INFO' | 'ERROR';

export interface AdminActivityLog {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  category: AdminLogCategory;
  details: string;
  status: AdminLogStatus;
}

const STORAGE_KEY_ADMIN_LOGS = 'kppn_admin_activity_logs_v2';

const DEFAULT_INITIAL_LOGS: AdminActivityLog[] = [
  {
    id: 'log-seed-1',
    timestamp: '25 Agu 2026, 06.21 WIB',
    action: 'Otentikasi Login Admin',
    user: 'Seksi MSKI KPPN Semarang I (026)',
    category: 'AUTH',
    details: 'Login berhasil sebagai Administrator KPPN Semarang I via Password PIN Resmi.',
    status: 'SUCCESS'
  },
  {
    id: 'log-seed-2',
    timestamp: '24 Agu 2026, 14:15 WIB',
    action: 'Sinkronisasi Otomatis Firestore',
    user: 'Sistem Telemetri KPPN 026',
    category: 'SETTINGS',
    details: 'Pembaruan data dan konfigurasi disinkronisasikan ke seluruh perangkat Satker aktif.',
    status: 'SUCCESS'
  },
  {
    id: 'log-seed-3',
    timestamp: '20 Agu 2026, 11:30 WIB',
    action: 'Olah Data Excel SAKTI',
    user: 'Operator Data KPPN 026',
    category: 'UPLOAD',
    details: 'Data capaian output & evaluasi IKPA Satker berhasil diunggah dan diverifikasi.',
    status: 'SUCCESS'
  },
  {
    id: 'log-seed-4',
    timestamp: '18 Agu 2026, 15:45 WIB',
    action: 'Publikasi Pengumuman',
    user: 'Seksi MSKI KPPN Semarang I',
    category: 'ANNOUNCEMENT',
    details: 'Pengumuman batas akhir konfirmasi capaian output dipublikasikan ke running text dashboard.',
    status: 'INFO'
  }
];

export function getLocalAdminLogs(): AdminActivityLog[] {
  if (typeof window === 'undefined') return DEFAULT_INITIAL_LOGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ADMIN_LOGS);
    if (!raw) {
      saveLocalAdminLogs(DEFAULT_INITIAL_LOGS);
      return DEFAULT_INITIAL_LOGS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_INITIAL_LOGS;
  } catch (err) {
    console.warn('Error reading admin logs from storage:', err);
    return DEFAULT_INITIAL_LOGS;
  }
}

export function saveLocalAdminLogs(logs: AdminActivityLog[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_ADMIN_LOGS, JSON.stringify(logs.slice(0, 300)));
  } catch (err) {
    console.warn('Error writing admin logs to storage:', err);
  }
}

export async function syncAdminLogsToFirestore(logs: AdminActivityLog[]): Promise<void> {
  try {
    const logDocRef = doc(db, 'admin_logs', 'overview');
    await setDoc(logDocRef, {
      logs: logs.slice(0, 150),
      totalCount: logs.length,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    // Non-blocking for offline/dev
  }
}

export function recordAdminActivityLog(
  action: string,
  category: AdminLogCategory,
  details: string,
  status: AdminLogStatus = 'SUCCESS',
  user: string = 'Seksi MSKI KPPN Semarang I (026)'
): AdminActivityLog {
  const now = new Date();
  const timestampStr = now.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }) + ', ' + now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  }) + ' WIB';

  const newLog: AdminActivityLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    timestamp: timestampStr,
    action,
    user,
    category,
    details,
    status
  };

  const currentLogs = getLocalAdminLogs();
  const updatedLogs = [newLog, ...currentLogs].slice(0, 300);

  saveLocalAdminLogs(updatedLogs);
  syncAdminLogsToFirestore(updatedLogs);

  return newLog;
}

export function clearAdminActivityLogs(): void {
  const emptyLogs: AdminActivityLog[] = [];
  saveLocalAdminLogs(emptyLogs);
  syncAdminLogsToFirestore(emptyLogs);
}

export function resetAdminActivityLogsToDefault(): AdminActivityLog[] {
  saveLocalAdminLogs(DEFAULT_INITIAL_LOGS);
  syncAdminLogsToFirestore(DEFAULT_INITIAL_LOGS);
  return DEFAULT_INITIAL_LOGS;
}

export function subscribeAdminLogs(onUpdate: (logs: AdminActivityLog[]) => void): () => void {
  // Fire initial local immediately
  onUpdate(getLocalAdminLogs());

  try {
    const logDocRef = doc(db, 'admin_logs', 'overview');
    const unsubscribe = onSnapshot(logDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (Array.isArray(data.logs) && data.logs.length > 0) {
          const local = getLocalAdminLogs();
          // Merge by ID avoiding duplicates
          const seen = new Set<string>();
          const merged: AdminActivityLog[] = [];

          [...data.logs, ...local].forEach(l => {
            if (l && l.id && !seen.has(l.id)) {
              seen.add(l.id);
              merged.push(l);
            }
          });

          // Sort by creation or approximate
          saveLocalAdminLogs(merged);
          onUpdate(merged);
          return;
        }
      }
      onUpdate(getLocalAdminLogs());
    }, (err) => {
      console.warn('Admin log listener error, fallback to local:', err);
      onUpdate(getLocalAdminLogs());
    });

    return unsubscribe;
  } catch (err) {
    return () => {};
  }
}

export function exportAdminLogsToCSV(logs: AdminActivityLog[]): void {
  if (!logs || logs.length === 0) return;

  const headers = ['ID', 'Waktu (WIB)', 'Kategori', 'Aksi / Aktivitas', 'Status', 'Operator / User', 'Rincian Detail'];
  const rows = logs.map(l => [
    `"${l.id}"`,
    `"${l.timestamp}"`,
    `"${l.category}"`,
    `"${(l.action || '').replace(/"/g, '""')}"`,
    `"${l.status}"`,
    `"${(l.user || '').replace(/"/g, '""')}"`,
    `"${(l.details || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Log_Aktivitas_Admin_KPPN_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
