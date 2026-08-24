import { 
  VisitorTrafficSummary, 
  DailyTrafficRecord, 
  VisitorLogEntry, 
  TrafficAnalyticsData, 
  DeviceAnalytics, 
  PageVisitStat 
} from '../types';
import { db, doc, getDoc, setDoc } from '../lib/firebase';

const STORAGE_KEY_ANALYTICS = 'kppn_traffic_analytics_real_v2';
const STORAGE_KEY_DEVICE_ID = 'kppn_visitor_device_id';
const STORAGE_KEY_SESSION_ID = 'kppn_session_id';
const STORAGE_KEY_IS_TESTER = 'kppn_traffic_is_tester';
const STORAGE_KEY_EXCLUDE_TESTER = 'kppn_traffic_exclude_tester';
const STORAGE_KEY_LAST_TRACKED = 'kppn_traffic_last_tracked';

// Auto-detect if current environment is explicitly Tester/Programmer mode
export function isAutoDetectedDeveloperEnv(): boolean {
  if (typeof window === 'undefined') return false;
  const search = window.location.search || '';
  // Only explicitly if URL query param ?tester=true is set
  return search.includes('tester=true');
}

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
    if (val !== null) {
      return val === 'true';
    }
    // Default to false: Every device/browser visit counts as real visitor
    return isAutoDetectedDeveloperEnv();
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
    // Default to false to ensure all visitors are visible immediately
    return val === null ? false : val === 'true';
  } catch {
    return false;
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

// Internal Storage State Structure with strict Separation between Satker vs Tester
interface PersistedTrafficState {
  // Satker metrics (Genuine)
  satkerSummary: VisitorTrafficSummary;
  satkerDailyRecords: DailyTrafficRecord[];
  satkerDailyDevices: { [dateStr: string]: string[] }; // date -> distinct deviceIds
  satkerAllTimeDevices: string[];
  satkerPageViewCounts: { [tabId: string]: number };
  satkerDeviceCounts: { desktop: number; mobile: number; tablet: number };
  satkerBrowserCounts: { [browser: string]: number };
  satkerOsCounts: { [os: string]: number };

  // Tester / Developer metrics
  testerDailyDevices: { [dateStr: string]: string[] };
  testerAllTimeDevices: string[];
  testerTotalViews: number;

  // Realtime Logs
  recentLogs: VisitorLogEntry[];
  lastSaved: string;
}

// Initialize 100% clean, real state (0 dummy data)
function createInitialCleanState(): PersistedTrafficState {
  const now = new Date();
  return {
    satkerSummary: {
      pengunjungHariIni: 0,
      viewsHariIni: 0,
      pengunjung7Hari: 0,
      totalPengunjung: 0,
      totalViews: 0,
      lastUpdated: now.toISOString()
    },
    satkerDailyRecords: [],
    satkerDailyDevices: {},
    satkerAllTimeDevices: [],
    satkerPageViewCounts: {},
    satkerDeviceCounts: { desktop: 0, mobile: 0, tablet: 0 },
    satkerBrowserCounts: {},
    satkerOsCounts: {},

    testerDailyDevices: {},
    testerAllTimeDevices: [],
    testerTotalViews: 0,

    recentLogs: [],
    lastSaved: now.toISOString()
  };
}

// Load state from localStorage or create clean real state
export function loadPersistedTrafficState(): PersistedTrafficState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ANALYTICS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.satkerSummary && Array.isArray(parsed.satkerDailyRecords)) {
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

// Anti-Bounce & Throttle Helper
function shouldTrackVisit(tabId: string): boolean {
  try {
    const now = Date.now();
    const lastTrackedRaw = sessionStorage.getItem(STORAGE_KEY_LAST_TRACKED);
    
    if (lastTrackedRaw) {
      const last = JSON.parse(lastTrackedRaw);
      const timeDiff = now - (last.time || 0);
      
      // If same tab within 20 seconds, ignore duplicate tracking (prevents React re-render / reload spam)
      if (last.tabId === tabId && timeDiff < 20000) {
        return false;
      }
      
      // If switching tabs too quickly (< 1.5 seconds), debounce
      if (timeDiff < 1500) {
        return false;
      }
    }

    sessionStorage.setItem(STORAGE_KEY_LAST_TRACKED, JSON.stringify({ tabId, time: now }));
    return true;
  } catch {
    return true;
  }
}

// Main Tracking Function: Called on every tab change / page load
export async function trackPageView(
  tabId: string, 
  satkerContext?: { kodeSatker?: string; namaSatker?: string }
): Promise<void> {
  try {
    if (!shouldTrackVisit(tabId)) {
      return;
    }

    const deviceId = getOrCreateDeviceId();
    const isTester = isCurrentDeviceTester();
    const devInfo = parseDeviceDetails();
    const pageTitle = getTabReadableTitle(tabId);
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const hourStr = now.getHours().toString().padStart(2, '0');
    const timeStr = now.toLocaleTimeString('id-ID');

    const state = loadPersistedTrafficState();

    if (isTester) {
      // TRACK TESTER / DEVELOPER SEPARATELY (No pollution to Satker data)
      if (!state.testerDailyDevices[todayStr]) state.testerDailyDevices[todayStr] = [];
      if (!state.testerDailyDevices[todayStr].includes(deviceId)) {
        state.testerDailyDevices[todayStr].push(deviceId);
      }
      if (!state.testerAllTimeDevices.includes(deviceId)) {
        state.testerAllTimeDevices.push(deviceId);
      }
      state.testerTotalViews = (state.testerTotalViews || 0) + 1;
    } else {
      // TRACK GENUINE SATKER VISITS ACCURATELY
      if (!state.satkerDailyDevices[todayStr]) state.satkerDailyDevices[todayStr] = [];
      if (!state.satkerAllTimeDevices) state.satkerAllTimeDevices = [];

      const isNewVisitorToday = !state.satkerDailyDevices[todayStr].includes(deviceId);
      if (isNewVisitorToday) {
        state.satkerDailyDevices[todayStr].push(deviceId);
      }
      if (!state.satkerAllTimeDevices.includes(deviceId)) {
        state.satkerAllTimeDevices.push(deviceId);
      }

      // Ensure today's daily record exists
      let todayRecord = state.satkerDailyRecords.find(r => r.date === todayStr);
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
        state.satkerDailyRecords.push(todayRecord);
        if (state.satkerDailyRecords.length > 90) {
          state.satkerDailyRecords.shift();
        }
      }

      if (isNewVisitorToday) {
        todayRecord.uniqueVisitors += 1;
      }
      todayRecord.pageviews += 1;
      todayRecord.hourlyViews[hourStr] = (todayRecord.hourlyViews[hourStr] || 0) + 1;

      // Device category count
      if (devInfo.deviceType === 'Desktop') {
        todayRecord.desktopCount += 1;
        state.satkerDeviceCounts.desktop = (state.satkerDeviceCounts.desktop || 0) + 1;
      } else if (devInfo.deviceType === 'Mobile') {
        todayRecord.mobileCount += 1;
        state.satkerDeviceCounts.mobile = (state.satkerDeviceCounts.mobile || 0) + 1;
      } else {
        todayRecord.tabletCount += 1;
        state.satkerDeviceCounts.tablet = (state.satkerDeviceCounts.tablet || 0) + 1;
      }

      // Browser & OS count
      state.satkerBrowserCounts[devInfo.browser] = (state.satkerBrowserCounts[devInfo.browser] || 0) + 1;
      state.satkerOsCounts[devInfo.os] = (state.satkerOsCounts[devInfo.os] || 0) + 1;
      state.satkerPageViewCounts[tabId] = (state.satkerPageViewCounts[tabId] || 0) + 1;

      // Update Satker Summary
      state.satkerSummary.pengunjungHariIni = state.satkerDailyDevices[todayStr].length;
      state.satkerSummary.viewsHariIni = todayRecord.pageviews;
      state.satkerSummary.totalPengunjung = state.satkerAllTimeDevices.length;
      state.satkerSummary.totalViews = (state.satkerSummary.totalViews || 0) + 1;

      const last7Days = state.satkerDailyRecords.slice(-7);
      state.satkerSummary.pengunjung7Hari = last7Days.reduce((acc, r) => acc + r.uniqueVisitors, 0);
      state.satkerSummary.lastUpdated = now.toISOString();
    }

    // Add to recent logs
    const isNewVisitor = isTester 
      ? !(state.testerDailyDevices[todayStr] && state.testerDailyDevices[todayStr].length > 1)
      : !(state.satkerDailyDevices[todayStr] && state.satkerDailyDevices[todayStr].length > 1);

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
      isNewVisitor,
      isTester,
      satkerKode: satkerContext?.kodeSatker,
      satkerNama: satkerContext?.namaSatker
    };

    state.recentLogs.unshift(newLog);
    if (state.recentLogs.length > 200) {
      state.recentLogs = state.recentLogs.slice(0, 200);
    }

    state.lastSaved = now.toISOString();
    savePersistedTrafficState(state);

    if (!isTester) {
      syncTrafficSummaryToFirestore(state);
    }
  } catch (err) {
    console.error('Error tracking page view:', err);
  }
}

// Background Firestore Sync (Synchronizes summary, device tallies, and latest activity across all devices)
export async function syncTrafficSummaryToFirestore(state: PersistedTrafficState): Promise<void> {
  try {
    const trafficDocRef = doc(db, 'traffic', 'overview');
    await setDoc(trafficDocRef, {
      ...state.satkerSummary,
      dailyRecords: state.satkerDailyRecords.slice(-30),
      deviceCounts: state.satkerDeviceCounts,
      browserCounts: state.satkerBrowserCounts,
      osCounts: state.satkerOsCounts,
      pageViewCounts: state.satkerPageViewCounts,
      recentLogs: state.recentLogs.slice(0, 50),
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    // Non-blocking catch for offline/dev modes
  }
}

// Merge remote Firestore data into local traffic analytics state
export function mergeRemoteTrafficState(remoteData: any): PersistedTrafficState {
  const local = loadPersistedTrafficState();
  if (!remoteData) return local;

  try {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Merge summary counters by taking the maximums or combining distinct devices
    const remoteHariIni = remoteData.pengunjungHariIni || 0;
    const remoteViewsHariIni = remoteData.viewsHariIni || 0;
    const remoteTotalPengunjung = remoteData.totalPengunjung || 0;
    const remoteTotalViews = remoteData.totalViews || 0;

    local.satkerSummary.pengunjungHariIni = Math.max(local.satkerSummary.pengunjungHariIni, remoteHariIni);
    local.satkerSummary.viewsHariIni = Math.max(local.satkerSummary.viewsHariIni, remoteViewsHariIni);
    local.satkerSummary.totalPengunjung = Math.max(local.satkerSummary.totalPengunjung, remoteTotalPengunjung);
    local.satkerSummary.totalViews = Math.max(local.satkerSummary.totalViews, remoteTotalViews);
    if (remoteData.pengunjung7Hari) {
      local.satkerSummary.pengunjung7Hari = Math.max(local.satkerSummary.pengunjung7Hari, remoteData.pengunjung7Hari);
    }
    local.satkerSummary.lastUpdated = remoteData.updatedAt || now.toISOString();

    // Merge recent logs (avoid duplicate IDs)
    if (Array.isArray(remoteData.recentLogs)) {
      const existingLogIds = new Set(local.recentLogs.map(l => l.id));
      const newLogs = remoteData.recentLogs.filter((l: VisitorLogEntry) => !existingLogIds.has(l.id));
      local.recentLogs = [...newLogs, ...local.recentLogs]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 200);
    }

    // Merge daily records
    if (Array.isArray(remoteData.dailyRecords) && remoteData.dailyRecords.length > 0) {
      const dailyMap = new Map<string, DailyTrafficRecord>();
      local.satkerDailyRecords.forEach(r => dailyMap.set(r.date, { ...r }));
      remoteData.dailyRecords.forEach((r: DailyTrafficRecord) => {
        if (!dailyMap.has(r.date)) {
          dailyMap.set(r.date, r);
        } else {
          const cur = dailyMap.get(r.date)!;
          cur.pageviews = Math.max(cur.pageviews, r.pageviews || 0);
          cur.uniqueVisitors = Math.max(cur.uniqueVisitors, r.uniqueVisitors || 0);
        }
      });
      local.satkerDailyRecords = Array.from(dailyMap.values())
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-90);
    }

    // Merge device and page metrics
    if (remoteData.deviceCounts) {
      local.satkerDeviceCounts.desktop = Math.max(local.satkerDeviceCounts.desktop, remoteData.deviceCounts.desktop || 0);
      local.satkerDeviceCounts.mobile = Math.max(local.satkerDeviceCounts.mobile, remoteData.deviceCounts.mobile || 0);
      local.satkerDeviceCounts.tablet = Math.max(local.satkerDeviceCounts.tablet, remoteData.deviceCounts.tablet || 0);
    }

    if (remoteData.pageViewCounts && typeof remoteData.pageViewCounts === 'object') {
      Object.entries(remoteData.pageViewCounts).forEach(([tab, count]) => {
        local.satkerPageViewCounts[tab] = Math.max(local.satkerPageViewCounts[tab] || 0, Number(count) || 0);
      });
    }

    local.lastSaved = now.toISOString();
    savePersistedTrafficState(local);
  } catch (e) {
    console.warn('Error merging remote traffic data:', e);
  }

  return local;
}

// Fetch analytics formatted data with options (filter tester, custom date ranges)
export function getTrafficAnalytics(options?: { excludeTester?: boolean; remoteData?: any }): TrafficAnalyticsData {
  let state = loadPersistedTrafficState();
  if (options?.remoteData) {
    state = mergeRemoteTrafficState(options.remoteData);
  }
  const excludeTester = options?.excludeTester ?? getExcludeTesterPreference();

  const filteredLogs = excludeTester 
    ? state.recentLogs.filter(l => !l.isTester) 
    : state.recentLogs;

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const todayRecord = state.satkerDailyRecords.find(r => r.date === todayStr);

  const hourlyToday = Array.from({ length: 24 }, (_, i) => {
    const hourKey = i.toString().padStart(2, '0');
    const views = todayRecord?.hourlyViews?.[hourKey] || 0;
    return {
      hour: hourKey,
      label: `${hourKey}:00`,
      views,
      visitors: Math.ceil(views * 0.5)
    };
  });

  const pageCounts = excludeTester ? state.satkerPageViewCounts : { ...state.satkerPageViewCounts };
  const totalPageviews = Object.values(pageCounts).reduce((a, b) => a + b, 0) || 1;
  const topPages: PageVisitStat[] = Object.entries(pageCounts)
    .map(([tabId, count]) => ({
      tabId,
      title: getTabReadableTitle(tabId),
      count,
      percentage: Math.round((count / totalPageviews) * 1000) / 10
    }))
    .sort((a, b) => b.count - a.count);

  const osCounts = excludeTester ? state.satkerOsCounts : { ...state.satkerOsCounts };
  const totalOS = Object.values(osCounts).reduce((a, b) => a + b, 0) || 1;
  const osList = Object.entries(osCounts)
    .map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / totalOS) * 1000) / 10
    }))
    .sort((a, b) => b.count - a.count);

  const browserCounts = excludeTester ? state.satkerBrowserCounts : { ...state.satkerBrowserCounts };
  const totalBrowsers = Object.values(browserCounts).reduce((a, b) => a + b, 0) || 1;
  const browserList = Object.entries(browserCounts)
    .map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / totalBrowsers) * 1000) / 10
    }))
    .sort((a, b) => b.count - a.count);

  const deviceCounts = excludeTester ? state.satkerDeviceCounts : { ...state.satkerDeviceCounts };
  const deviceStats: DeviceAnalytics = {
    desktop: deviceCounts.desktop || 0,
    mobile: deviceCounts.mobile || 0,
    tablet: deviceCounts.tablet || 0,
    osList,
    browserList
  };

  const summary: VisitorTrafficSummary = excludeTester
    ? {
        pengunjungHariIni: state.satkerSummary.pengunjungHariIni || 0,
        viewsHariIni: state.satkerSummary.viewsHariIni || 0,
        pengunjung7Hari: state.satkerSummary.pengunjung7Hari || 0,
        totalPengunjung: state.satkerSummary.totalPengunjung || 0,
        totalViews: state.satkerSummary.totalViews || 0,
        lastUpdated: state.satkerSummary.lastUpdated || now.toISOString()
      }
    : {
        pengunjungHariIni: (state.satkerSummary.pengunjungHariIni || 0) + (state.testerDailyDevices[todayStr]?.length || 0),
        viewsHariIni: (state.satkerSummary.viewsHariIni || 0) + (state.testerTotalViews || 0),
        pengunjung7Hari: (state.satkerSummary.pengunjung7Hari || 0) + (state.testerAllTimeDevices?.length || 0),
        totalPengunjung: (state.satkerSummary.totalPengunjung || 0) + (state.testerAllTimeDevices?.length || 0),
        totalViews: (state.satkerSummary.totalViews || 0) + (state.testerTotalViews || 0),
        lastUpdated: now.toISOString()
      };

  return {
    summary,
    dailyHistory: state.satkerDailyRecords || [],
    hourlyToday,
    deviceStats,
    topPages,
    recentLogs: filteredLogs,
    totalLogCount: filteredLogs.length
  };
}

// Reset/Clear Log Traffic (Admin Action - Reset to pure clean 0 on both Local & Remote Firestore)
export function resetTrafficData(): PersistedTrafficState {
  const fresh = createInitialCleanState();
  savePersistedTrafficState(fresh);
  try {
    sessionStorage.removeItem(STORAGE_KEY_LAST_TRACKED);
    const trafficDocRef = doc(db, 'traffic', 'overview');
    setDoc(trafficDocRef, {
      pengunjungHariIni: 0,
      viewsHariIni: 0,
      pengunjung7Hari: 0,
      totalPengunjung: 0,
      totalViews: 0,
      lastUpdated: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }).catch(e => console.warn('Reset firestore traffic notice:', e));
  } catch (e) {
    console.warn('Error resetting remote traffic:', e);
  }
  return fresh;
}
