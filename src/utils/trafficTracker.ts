import { 
  VisitorTrafficSummary, 
  DailyTrafficRecord, 
  VisitorLogEntry, 
  TrafficAnalyticsData, 
  DeviceAnalytics, 
  PageVisitStat 
} from '../types';
import { db, doc, getDoc, setDoc } from '../lib/firebase';

const STORAGE_KEY_ANALYTICS = 'kppn_traffic_analytics_real_v1';
const STORAGE_KEY_DEVICE_ID = 'kppn_visitor_device_id';
const STORAGE_KEY_SESSION_ID = 'kppn_session_id';
const STORAGE_KEY_IS_TESTER = 'kppn_traffic_is_tester';
const STORAGE_KEY_EXCLUDE_TESTER = 'kppn_traffic_exclude_tester';

// Generate or retrieve persistent unique Device ID
export function getOrCreateDeviceId(): string {
  try {
    let deviceId = localStorage.getItem(STORAGE_KEY_DEVICE_ID);
    if (!deviceId) {
      const randomSalt = Math.random().toString(36).substring(2, 10);
      const timestamp = Date.now().toString(36);
      deviceId = `dev-${randomSalt}-${timestamp}`;
      localStorage.setItem(STORAGE_KEY_DEVICE_ID, deviceId);
    }
    return deviceId;
  } catch {
    return 'dev-generic-' + Math.random().toString(36).substring(2, 8);
  }
}

// Generate or retrieve Session ID
export function getOrCreateSessionId(): string {
  try {
    let sessionId = sessionStorage.getItem(STORAGE_KEY_SESSION_ID);
    if (!sessionId) {
      sessionId = `ses-${Math.random().toString(36).substring(2, 10)}-${Date.now().toString(36)}`;
      sessionStorage.setItem(STORAGE_KEY_SESSION_ID, sessionId);
    }
    return sessionId;
  } catch {
    return 'ses-fallback';
  }
}

// Check if current device is flagged as Tester / Programmer
export function isCurrentDeviceTester(): boolean {
  try {
    const val = localStorage.getItem(STORAGE_KEY_IS_TESTER);
    return val === 'true';
  } catch {
    return false;
  }
}

export function setDeviceTesterStatus(isTester: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY_IS_TESTER, isTester ? 'true' : 'false');
  } catch (e) {
    console.error('Error saving tester status:', e);
  }
}

export function getExcludeTesterPreference(): boolean {
  try {
    const val = localStorage.getItem(STORAGE_KEY_EXCLUDE_TESTER);
    // Default to true (filter tester) for clean analytics
    return val === null ? true : val === 'true';
  } catch {
    return true;
  }
}

export function setExcludeTesterPreference(exclude: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY_EXCLUDE_TESTER, exclude ? 'true' : 'false');
  } catch (e) {
    console.error('Error saving exclude tester pref:', e);
  }
}

// Hardware and User-Agent Details Parser
export function parseDeviceDetails() {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const screenRes = typeof window !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : '1920x1080';
  
  // Detect Device Type
  let deviceType: 'Desktop' | 'Mobile' | 'Tablet' = 'Desktop';
  const isTablet = /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk)/i.test(ua) ||
    (typeof navigator !== 'undefined' && navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isMobile = /mobile|iphone|ipod|android|blackberry|opera mini|iemobile|wpdesktop/i.test(ua);

  if (isTablet) {
    deviceType = 'Tablet';
  } else if (isMobile) {
    deviceType = 'Mobile';
  } else {
    deviceType = 'Desktop';
  }

  // Detect Operating System
  let os = 'Windows';
  if (/android/i.test(ua)) os = 'Android';
  else if (/ipad|iphone|ipod/i.test(ua)) os = 'iOS';
  else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';
  else if (/windows phone/i.test(ua)) os = 'Windows Phone';
  else if (/windows nt/i.test(ua)) os = 'Windows';
  else if (/cros/i.test(ua)) os = 'Chrome OS';
  else if (/linux/i.test(ua)) os = 'Linux';

  // Detect Browser
  let browser = 'Chrome';
  if (/edg/i.test(ua)) browser = 'Microsoft Edge';
  else if (/opr|opera/i.test(ua)) browser = 'Opera';
  else if (/samsungbrowser/i.test(ua)) browser = 'Samsung Internet';
  else if (/chrome|crios/i.test(ua)) browser = 'Google Chrome';
  else if (/firefox|fxios/i.test(ua)) browser = 'Mozilla Firefox';
  else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) browser = 'Safari';

  return {
    deviceType,
    os,
    browser,
    screenResolution: screenRes
  };
}

// Map navigation tab IDs to human-readable labels
export function getTabReadableTitle(tabId: string): string {
  const map: Record<string, string> = {
    'dashboard': 'Dashboard Utama IKPA',
    'capaian-output': 'Capaian Output SAKTI',
    'pengelolaan-up': 'Pengelolaan UP/TUP',
    'transaksi-kkp': 'Transaksi KKP Satker',
    'transaksi-digipay': 'Transaksi Digipay Satu',
    'kelola-satker': 'Kelola Profil & Kontak Satker',
    'redflags': 'Red Flags & Deteksi Dini',
    'sertifikasi': 'Sertifikasi Pejabat Perbendaharaan',
    'per5-analisis': 'Kalkulator & Analisis PER-5',
    'announcements': 'Pengumuman & Edaran KPPN',
    'materi-slide': 'Materi Paparan & Slide Show',
    'portal-link': 'Portal Link Sosialisasi',
    'presensi': 'Presensi Online Kegiatan',
    'pengetahuan': 'Juknis & Pengetahuan SAKTI',
    'aduan': 'Layanan Aduan & Tiket Satker',
    'admin': 'Panel Kontrol Admin MSKI',
    'reminder': 'Generator Pesan Pengingat',
    'guide': 'Panduan Format Excel'
  };
  return map[tabId] || tabId;
}

// Internal Storage State Structure
interface PersistedTrafficState {
  summary: VisitorTrafficSummary;
  dailyRecords: DailyTrafficRecord[];
  dailyDevices: { [dateStr: string]: string[] }; // date -> list of deviceIds
  testerDailyDevices: { [dateStr: string]: string[] };
  allTimeDevices: string[]; // List of all distinct deviceIds seen
  recentLogs: VisitorLogEntry[];
  pageViewCounts: { [tabId: string]: number };
  deviceCounts: { desktop: number; mobile: number; tablet: number };
  browserCounts: { [browser: string]: number };
  osCounts: { [os: string]: number };
  lastSaved: string;
}

// Initialize 100% clean, real state (0 dummy data)
function createInitialCleanState(): PersistedTrafficState {
  const now = new Date();
  return {
    summary: {
      pengunjungHariIni: 0,
      viewsHariIni: 0,
      pengunjung7Hari: 0,
      totalPengunjung: 0,
      totalViews: 0,
      lastUpdated: now.toISOString()
    },
    dailyRecords: [],
    dailyDevices: {},
    testerDailyDevices: {},
    allTimeDevices: [],
    recentLogs: [],
    pageViewCounts: {},
    deviceCounts: {
      desktop: 0,
      mobile: 0,
      tablet: 0
    },
    browserCounts: {},
    osCounts: {},
    lastSaved: now.toISOString()
  };
}

// Load state from localStorage or create clean real state
export function loadPersistedTrafficState(): PersistedTrafficState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ANALYTICS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.summary && Array.isArray(parsed.dailyRecords)) {
        if (!parsed.allTimeDevices) parsed.allTimeDevices = [];
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading traffic analytics state:', e);
  }
  const initial = createInitialCleanState();
  savePersistedTrafficState(initial);
  return initial;
}

// Save state to localStorage
export function savePersistedTrafficState(state: PersistedTrafficState): void {
  try {
    localStorage.setItem(STORAGE_KEY_ANALYTICS, JSON.stringify(state));
  } catch (e) {
    console.error('Error saving traffic analytics state:', e);
  }
}

// Main Tracking Function: Called on every tab change / page load
export async function trackPageView(
  tabId: string, 
  satkerContext?: { kodeSatker?: string; namaSatker?: string }
): Promise<void> {
  try {
    const deviceId = getOrCreateDeviceId();
    const isTester = isCurrentDeviceTester();
    const devInfo = parseDeviceDetails();
    const pageTitle = getTabReadableTitle(tabId);
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const hourStr = now.getHours().toString().padStart(2, '0');
    const timeStr = now.toLocaleTimeString('id-ID');

    const state = loadPersistedTrafficState();

    // Ensure today's daily record exists
    let todayRecord = state.dailyRecords.find(r => r.date === todayStr);
    if (!todayRecord) {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      todayRecord = {
        date: todayStr,
        displayDate: `${now.getDate()} ${monthNames[now.getMonth()]}`,
        uniqueVisitors: 0,
        pageviews: 0,
        desktopCount: 0,
        mobileCount: 0,
        tabletCount: 0,
        hourlyViews: {}
      };
      state.dailyRecords.push(todayRecord);
      // Keep max 90 days of history
      if (state.dailyRecords.length > 90) {
        state.dailyRecords.shift();
      }
    }

    if (!state.dailyDevices[todayStr]) {
      state.dailyDevices[todayStr] = [];
    }
    if (!state.testerDailyDevices[todayStr]) {
      state.testerDailyDevices[todayStr] = [];
    }
    if (!state.allTimeDevices) {
      state.allTimeDevices = [];
    }

    // Check if this device is new for today
    const targetDailyDeviceList = isTester ? state.testerDailyDevices[todayStr] : state.dailyDevices[todayStr];
    const isNewVisitorToday = !targetDailyDeviceList.includes(deviceId);

    if (isNewVisitorToday) {
      targetDailyDeviceList.push(deviceId);
      todayRecord.uniqueVisitors += 1;
      
      if (!state.allTimeDevices.includes(deviceId)) {
        state.allTimeDevices.push(deviceId);
      }
    }

    // Summary calculation (real Satker visitors)
    state.summary.pengunjungHariIni = state.dailyDevices[todayStr].length + (isTester ? 0 : 0);
    state.summary.totalPengunjung = state.allTimeDevices.length;

    // Increment pageviews
    todayRecord.pageviews += 1;
    state.summary.viewsHariIni += 1;
    state.summary.totalViews += 1;

    // Hourly views
    todayRecord.hourlyViews[hourStr] = (todayRecord.hourlyViews[hourStr] || 0) + 1;

    // Device counts
    if (devInfo.deviceType === 'Desktop') {
      todayRecord.desktopCount += 1;
      state.deviceCounts.desktop = (state.deviceCounts.desktop || 0) + 1;
    } else if (devInfo.deviceType === 'Mobile') {
      todayRecord.mobileCount += 1;
      state.deviceCounts.mobile = (state.deviceCounts.mobile || 0) + 1;
    } else {
      todayRecord.tabletCount += 1;
      state.deviceCounts.tablet = (state.deviceCounts.tablet || 0) + 1;
    }

    // Browser & OS counts
    state.browserCounts[devInfo.browser] = (state.browserCounts[devInfo.browser] || 0) + 1;
    state.osCounts[devInfo.os] = (state.osCounts[devInfo.os] || 0) + 1;
    state.pageViewCounts[tabId] = (state.pageViewCounts[tabId] || 0) + 1;

    // 7-day unique visitor calculation (sum of unique daily visitors across last 7 recorded days)
    const last7Days = state.dailyRecords.slice(-7);
    state.summary.pengunjung7Hari = last7Days.reduce((acc, r) => acc + r.uniqueVisitors, 0);
    state.summary.lastUpdated = now.toISOString();

    // Add to recent logs
    const newLog: VisitorLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: now.toISOString(),
      date: todayStr,
      time: timeStr,
      deviceId,
      deviceType: devInfo.deviceType,
      os: devInfo.os,
      browser: devInfo.browser,
      screenResolution: devInfo.screenResolution,
      page: pageTitle,
      tabId,
      isNewVisitor: isNewVisitorToday,
      isTester,
      satkerKode: satkerContext?.kodeSatker,
      satkerNama: satkerContext?.namaSatker
    };

    state.recentLogs.unshift(newLog);
    // Keep max 200 recent logs
    if (state.recentLogs.length > 200) {
      state.recentLogs = state.recentLogs.slice(0, 200);
    }

    state.lastSaved = now.toISOString();
    savePersistedTrafficState(state);

    // Asynchronously sync summary to Firestore if available
    syncTrafficSummaryToFirestore(state.summary);
  } catch (err) {
    console.error('Error tracking page view:', err);
  }
}

// Background Firestore Sync
async function syncTrafficSummaryToFirestore(summary: VisitorTrafficSummary): Promise<void> {
  try {
    const trafficDocRef = doc(db, 'traffic', 'overview');
    await setDoc(trafficDocRef, {
      ...summary,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch {
    // Non-blocking catch for offline/dev modes
  }
}

// Fetch analytics formatted data with options (filter tester, custom date ranges)
export function getTrafficAnalytics(options?: { excludeTester?: boolean }): TrafficAnalyticsData {
  const state = loadPersistedTrafficState();
  const excludeTester = options?.excludeTester ?? getExcludeTesterPreference();

  // Filter logs if excluding tester
  const filteredLogs = excludeTester 
    ? state.recentLogs.filter(l => !l.isTester) 
    : state.recentLogs;

  // Build hourly today data (24 hours: 00:00 to 23:00)
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const todayRecord = state.dailyRecords.find(r => r.date === todayStr);

  const hourlyToday = Array.from({ length: 24 }, (_, i) => {
    const hourKey = i.toString().padStart(2, '0');
    const views = todayRecord?.hourlyViews?.[hourKey] || 0;
    return {
      hour: hourKey,
      label: `${hourKey}:00`,
      views,
      visitors: Math.ceil(views * 0.45)
    };
  });

  // Calculate Top Visited Pages
  const totalPageviews = Object.values(state.pageViewCounts).reduce((a, b) => a + b, 0) || 1;
  const topPages: PageVisitStat[] = Object.entries(state.pageViewCounts)
    .map(([tabId, count]) => ({
      tabId,
      title: getTabReadableTitle(tabId),
      count,
      percentage: Math.round((count / totalPageviews) * 1000) / 10
    }))
    .sort((a, b) => b.count - a.count);

  // Calculate Device & OS & Browser Analytics
  const totalOS = Object.values(state.osCounts).reduce((a, b) => a + b, 0) || 1;
  const osList = Object.entries(state.osCounts)
    .map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / totalOS) * 1000) / 10
    }))
    .sort((a, b) => b.count - a.count);

  const totalBrowsers = Object.values(state.browserCounts).reduce((a, b) => a + b, 0) || 1;
  const browserList = Object.entries(state.browserCounts)
    .map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / totalBrowsers) * 1000) / 10
    }))
    .sort((a, b) => b.count - a.count);

  const deviceStats: DeviceAnalytics = {
    desktop: state.deviceCounts.desktop,
    mobile: state.deviceCounts.mobile,
    tablet: state.deviceCounts.tablet,
    osList,
    browserList
  };

  return {
    summary: state.summary,
    dailyHistory: state.dailyRecords,
    hourlyToday,
    deviceStats,
    topPages,
    recentLogs: filteredLogs,
    totalLogCount: filteredLogs.length
  };
}

// Reset/Clear Log Traffic (Admin Action - Reset to pure clean 0)
export function resetTrafficData(): PersistedTrafficState {
  const fresh = createInitialCleanState();
  savePersistedTrafficState(fresh);
  return fresh;
}
