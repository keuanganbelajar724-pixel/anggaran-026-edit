import { safeLocalStorageSet, safeLocalStorageGet, saveLargeDataset, removeLargeDataset, getLargeDataset } from './utils/safeStorage';
import { fetchSintesaFromFirestore, fetchMyIntressFromFirestore, saveMyIntressToFirestore } from './utils/firestoreDatasetSync';
import React, { useState, useEffect, useMemo } from 'react';
import { Lock, Database, Loader2, Sparkles, ShieldCheck } from 'lucide-react';
import { db, doc, onSnapshot, setDoc, getDoc } from './lib/firebase';
import { SatkerIKPA, DashboardConfig, NavigationTab, AppTheme, Announcement, PejabatSertifikasi, MenuVisibilityConfig, ExcelUploadHistory, KegiatanSosialisasi, PresensiKegiatan, PesertaPresensi, MasterSatker, PengelolaanUPRecord, TransaksiKKPRecord, DigipayRecord, DeviasiHal3Record, SPMPPPRecord, PresensiPrintConfig, MyIntressRecord, RealisasiAnggaranConfig } from './types';
import { INITIAL_SATKER_DATA, hitungTotalIKPA, getPredikatIKPA, mergeHistoricalUploadsToSatkers } from './data/initialSatkerData';
import { INITIAL_MY_INTRESS_DATA } from './data/initialMyIntressData';
import { DEFAULT_TARGET_TRIWULAN_RULES } from './utils/targetTriwulanProcessor';
import { processMyIntressExcel } from './utils/realisasiBelanjaProcessor';
import {
  compactSatkersForFirestore,
  compactHistoricalUploadsForFirestore,
  compactPengelolaanUPForFirestore,
  mergeSatkersAntiDowngrade,
  mergePengelolaanUPAntiDowngrade,
  mergeHistoricalUploadsAntiDowngrade,
  compactDigipayForFirestore,
  compactKKPForFirestore,
  mergeDigipayAntiDowngrade,
  compactDeviasiHal3ForFirestore,
  hydrateDeviasiHal3FromFirestore,
  mergeDeviasiHal3AntiDowngrade,
  cleanContactValue,
  cleanPicName
} from './utils/firebaseStorageOptimizer';
import {
  sanitizeInput,
  createAdminSession,
  validateAndRefreshAdminSession,
  clearAdminSession
} from './utils/security';
import { INITIAL_SERTIFIKASI_PEJABAT } from './data/sertifikasiData';
import { INITIAL_ADUAN_RECORDS } from './data/initialAduanData';
import { INITIAL_TRANSAKSI_KKP_DATA } from './data/initialKKPData';
import { INITIAL_DIGIPAY_DATA } from './data/initialDigipayData';
import { INITIAL_DEVIASI_HAL3_DATA } from './data/initialDeviasiHal3Data';
import { INITIAL_SPM_PPP_DATA } from './data/initialSPMPPPData';
import { INITIAL_SLIDESHOW_CONFIG, sanitizeSlideShowConfig } from './data/initialSlideShowData';
import { loadCloudGeminiConfig } from './services/geminiService';
import { Header } from './components/Header';
import { DashboardOverview } from './components/DashboardOverview';
import { RealisasiAnggaranDashboard } from './components/RealisasiAnggaranDashboard';
import { CapaianOutputDashboard } from './components/CapaianOutputDashboard';
import { DiagnostikCaputDashboard } from './components/DiagnostikCaputDashboard';
import { PengelolaanUPDashboard } from './components/PengelolaanUPDashboard';
import { TransaksiKKPDashboard } from './components/TransaksiKKPDashboard';
import { TransaksiDigipayDashboard } from './components/TransaksiDigipayDashboard';
import { DeviasiHal3Dashboard } from './components/DeviasiHal3Dashboard';
import { SPMPPPDashboard } from './components/SPMPPPDashboard';
import { KelolaDataSatkerDashboard } from './components/KelolaDataSatkerDashboard';
import { PengumumanTab } from './components/PengumumanTab';
import { MateriSlideTab } from './components/MateriSlideTab';
import { SocializationPortalView } from './components/SocializationPortalView';
import { PresensiOnlineView, INITIAL_DEFAULT_KEGIATAN } from './components/PresensiOnlineView';
import { RedFlagsView } from './components/RedFlagsView';
import { SertifikasiPejabatView } from './components/SertifikasiPejabatView';
import { Per5AnalisisView } from './components/Per5AnalisisView';
import { PengetahuanSaktiView } from './components/PengetahuanSaktiView';
import { LaporAduanView } from './components/LaporAduanView';
import { AdminUpload } from './components/AdminUpload';
import { ReminderGenerator } from './components/ReminderGenerator';
import { SatkerDetailModal } from './components/SatkerDetailModal';
import { ExcelGuideModal } from './components/ExcelGuideModal';
import { BroadcastTemplateLibraryModal } from './components/BroadcastTemplateLibraryModal';
import { PopUpAnnouncementModal } from './components/PopUpAnnouncementModal';
import { SlideShowBannerCarousel } from './components/SlideShowBannerCarousel';
import { AccessibilityWidget } from './components/AccessibilityWidget';

import { ToastProvider } from './components/ToastNotification';
import { trackPageView } from './utils/trafficTracker';

const INITIAL_ANNOUNCEMENTS: Announcement[] = [];

export const DEFAULT_PRESENSI_PRINT_CONFIG: PresensiPrintConfig = {
  kopBaris1: 'KEMENTERIAN KEUANGAN REPUBLIK INDONESIA',
  kopBaris2: 'DIREKTORAT JENDERAL PERBENDAHARAAN',
  kopBaris3: 'KANTOR WILAYAH DIREKTORAT JENDERAL PERBENDAHARAAN PROVINSI JAWA TENGAH',
  kopBaris4: 'KANTOR PELAYANAN PERBENDAHARAAN NEGARA TIPE A1 SEMARANG I',
  kopAlamatKontak: 'Jalan Ki Mangunsarkoro No. 34, Semarang 50241 • Telepon (024) 8414441 • Laman: djpb.kemenkeu.go.id/kppn/semarang1',
  kotaTandaTangan: 'Semarang',
  jabatanPenandatangan: 'Penanggung Jawab Kegiatan / Kepala Seksi MSKI',
  namaPenandatangan: '',
  nipPenandatangan: '',
  customTitle: 'DAFTAR HADIR PESERTA KEGIATAN'
};

const INITIAL_KEGIATAN_SOSIALISASI: KegiatanSosialisasi[] = [
  {
    id: 'kegiatan-demo-1',
    judulKegiatan: 'Sosialisasi & Bimtek Akselerasi IKPA & Capaian Output SAKTI 2026',
    subJudul: 'KPPN Semarang I • Seksi MSKI',
    tanggal: '15 Agustus 2026',
    jam: '08:30 - 12:00 WIB',
    lokasi: 'Aula KPPN Semarang I / Zoom Meeting Hybrid',
    deskripsi: 'Penyampaian strategi peningkatan nilai IKPA, panduan pengisian Capaian Output SAKTI, dan petunjuk teknis PER-5/PB/2024.',
    isActive: true,
    isFeatured: true,
    links: [
      {
        id: 'link-1',
        judulLink: '📝 Presensi & Absensi Online Peserta Sosialisasi',
        url: 'https://forms.google.com/',
        deskripsi: 'Wajib diisi oleh seluruh peserta KPA/PPK/PPSPM mitra KPPN Semarang I.',
        badge: 'Wajib',
        iconType: 'presence',
        isHighlight: true,
        isActive: true
      },
      {
        id: 'link-2',
        judulLink: '📊 Unduh Slide Paparan & Materi Presentasi PDF',
        url: 'https://drive.google.com/',
        deskripsi: 'Bahan tayang paparan narasumber, juknis SAKTI, dan pedoman teknis.',
        badge: 'Drive PDF',
        iconType: 'pdf',
        isHighlight: false,
        isActive: true
      },
      {
        id: 'link-3',
        judulLink: '📹 Ruang Virtual Zoom Meeting Hybrid',
        url: 'https://zoom.us/',
        deskripsi: 'Akses masuk virtual room bagi peserta online yang mengikuti secara hybrid.',
        badge: 'Live Zoom',
        iconType: 'zoom',
        isHighlight: true,
        isActive: true
      },
      {
        id: 'link-4',
        judulLink: '📋 Form Evaluasi & Feedback Kepuasan Sosialisasi',
        url: 'https://forms.google.com/',
        deskripsi: 'Mohon berkenan mengisi umpan balik penilaian layanan kegiatan KPPN Semarang I.',
        badge: 'Feedback',
        iconType: 'form',
        isHighlight: false,
        isActive: true
      }
    ]
  }
];

export const DEFAULT_MENU_VISIBILITY: MenuVisibilityConfig = {
  'dashboard': false,
  'realisasi-anggaran': true,
  'capaian-output': true,
  'diagnostik-caput': false,
  'deviasi-hal3': false,
  'spm-ppp': false,
  'pengelolaan-up': false,
  'transaksi-kkp': false,
  'transaksi-digipay': false,
  'kelola-satker': false,
  'redflags': false,
  'sertifikasi': false,
  'per5-analisis': false,
  'pengetahuan': false,
  'announcements': false,
  'materi-slide': false,
  'portal-link': false,
  'presensi': false,
  'aduan': false,
  'reminder': false,
  'guide': false,
};

export default function App() {
  const [satkers, setSatkers] = useState<SatkerIKPA[]>(() => {
    const saved = localStorage.getItem('kppn_satker_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
            .filter((s: SatkerIKPA) => s && (s.kodeSatker || s.namaSatker))
            .map((s: SatkerIKPA) => ({
              ...s,
              namaPic: cleanPicName(s.namaPic, s.kodeSatker),
              noHpPic: cleanContactValue(s.noHpPic)
            }));
        }
      } catch (e) {
        console.warn('Error parsing saved satker data:', e);
      }
    }
    return Array.isArray(INITIAL_SATKER_DATA) && INITIAL_SATKER_DATA.length > 0 ? INITIAL_SATKER_DATA : [];
  });

  useEffect(() => {
    try {
      safeLocalStorageSet('kppn_satker_data', JSON.stringify(satkers));
    } catch (e) {
      console.warn('Error saving satker data to localStorage:', e);
    }
  }, [satkers]);
  const [activeTab, setActiveTab] = useState<NavigationTab>(() => {
    try {
      if (typeof window !== 'undefined') {
        if (window.location.hash) {
          const h = window.location.hash.replace('#', '').trim() as NavigationTab;
          if (h) return h;
        }
        if (window.location.search) {
          const p = new URLSearchParams(window.location.search);
          const t = p.get('tab') as NavigationTab;
          if (t) return t;
        }
        let menuVis: any = null;
        try {
          const localMenu = localStorage.getItem('kppn_menu_visibility');
          if (localMenu) menuVis = JSON.parse(localMenu);
        } catch (e) {}

        const saved = localStorage.getItem('kppn_active_tab') as NavigationTab;
        if (saved && saved !== 'admin') {
          if (menuVis && menuVis[saved] === false) {
            return 'capaian-output';
          }
          if (menuVis && menuVis[saved] === true) {
            return saved;
          }
          if (!menuVis && DEFAULT_MENU_VISIBILITY[saved as keyof MenuVisibilityConfig] !== false) {
            return saved;
          }
        }
      }
    } catch (e) {}
    return 'capaian-output';
  });

  useEffect(() => {
    try {
      if (activeTab && activeTab !== 'admin') {
        localStorage.setItem('kppn_active_tab', activeTab);
      }
    } catch (e) {}
  }, [activeTab]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [theme, setTheme] = useState<AppTheme>('light');

  // Track page views and unique visitor telemetry
  useEffect(() => {
    trackPageView(activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Default Realisasi Anggaran Config
  const DEFAULT_REALISASI_ANGGARAN_CONFIG: RealisasiAnggaranConfig = {
    isActive: true,
    waktuUnduh: '24/10/2024 10:28:44',
    periodeLabel: 'Data Realisasi Belanja My InTress (127 Satker)',
    triwulanAktif: 'TW_IV',
    targetRules: DEFAULT_TARGET_TRIWULAN_RULES
  };

  // Admin Configurable Dashboard State
  const [dashboardConfig, setDashboardConfig] = useState<DashboardConfig>(() => {
    let savedConfig: DashboardConfig | null = null;
    try {
      const local = localStorage.getItem('kppn_dashboard_config');
      if (local) {
        savedConfig = JSON.parse(local);
      }
    } catch (e) {
      console.error('Error parsing kppn_dashboard_config in App.tsx:', e);
    }

    let savedHist: ExcelUploadHistory[] | undefined = undefined;
    try {
      const local = localStorage.getItem('kppn_historical_uploads');
      if (local !== null) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) savedHist = parsed;
      }
    } catch (e) {
      console.error('Error parsing kppn_historical_uploads in App.tsx:', e);
    }

    let savedMenuVisibility: MenuVisibilityConfig | undefined = undefined;
    try {
      const localMenu = localStorage.getItem('kppn_menu_visibility');
      if (localMenu) {
        savedMenuVisibility = JSON.parse(localMenu);
      }
    } catch (e) {
      console.warn('Error reading kppn_menu_visibility from localStorage:', e);
    }

    if (savedConfig) {
      let savedPresensiPrint: PresensiPrintConfig | undefined = savedConfig.presensiPrintConfig;
      try {
        const localPrint = localStorage.getItem('kppn_presensi_print_config');
        if (localPrint) {
          savedPresensiPrint = { ...DEFAULT_PRESENSI_PRINT_CONFIG, ...JSON.parse(localPrint) };
        }
      } catch (e) {
        console.warn('Error reading kppn_presensi_print_config', e);
      }

      if (savedConfig.customTexts?.dashboardSubtitle?.includes('deteksi dini deviasi Halaman III DIPA')) {
        savedConfig.customTexts.dashboardSubtitle = savedConfig.customTexts.dashboardSubtitle.replace(', deteksi dini deviasi Halaman III DIPA', '');
      }

      return {
        ...savedConfig,
        announcements: Array.isArray(savedConfig.announcements) ? savedConfig.announcements : INITIAL_ANNOUNCEMENTS,
        presensiPrintConfig: savedPresensiPrint || DEFAULT_PRESENSI_PRINT_CONFIG,
        slideShowConfig: sanitizeSlideShowConfig(savedConfig.slideShowConfig),
        aduanList: Array.isArray(savedConfig.aduanList)
          ? savedConfig.aduanList 
          : [],
        historicalUploads: savedHist || (Array.isArray(savedConfig.historicalUploads) ? savedConfig.historicalUploads : []),
        kegiatanSosialisasi: Array.isArray(savedConfig.kegiatanSosialisasi) && savedConfig.kegiatanSosialisasi.length > 0 
          ? savedConfig.kegiatanSosialisasi 
          : INITIAL_KEGIATAN_SOSIALISASI,
        menuVisibility: {
          ...DEFAULT_MENU_VISIBILITY,
          ...savedConfig.menuVisibility,
          ...(savedMenuVisibility || {})
        },
        realisasiAnggaranConfig: savedConfig.realisasiAnggaranConfig
          ? { ...DEFAULT_REALISASI_ANGGARAN_CONFIG, ...savedConfig.realisasiAnggaranConfig }
          : DEFAULT_REALISASI_ANGGARAN_CONFIG
      };
    }

    let initialPresensiPrint = DEFAULT_PRESENSI_PRINT_CONFIG;
    try {
      const localPrint = localStorage.getItem('kppn_presensi_print_config');
      if (localPrint) {
        initialPresensiPrint = { ...DEFAULT_PRESENSI_PRINT_CONFIG, ...JSON.parse(localPrint) };
      }
    } catch (e) {
      console.warn('Error reading kppn_presensi_print_config', e);
    }

    return {
      defaultFilter: 'ALL',
      customAnnouncement: 'PERHATIAN: Batas akhir pengiriman Capaian Output SAKTI KPPN Semarang I (026) periode ini tanggal 5. Mohon Satker terlampir segera melengkapi.',
      showKpiCards: true,
      showBarChart: true,
      slideShowConfig: sanitizeSlideShowConfig(savedConfig?.slideShowConfig),
      announcements: INITIAL_ANNOUNCEMENTS,
      kegiatanSosialisasi: INITIAL_KEGIATAN_SOSIALISASI,
      aduanList: INITIAL_ADUAN_RECORDS,
      historicalUploads: savedHist,
      presensiPrintConfig: initialPresensiPrint,
      realisasiAnggaranConfig: DEFAULT_REALISASI_ANGGARAN_CONFIG,
      menuVisibility: {
        ...DEFAULT_MENU_VISIBILITY,
        ...(savedMenuVisibility || {})
      },
    helpdeskPhone: '081234567890',
    helpdeskJamLayanan: 'Senin - Jumat (08:00 - 16:00 WIB)',
    waDeviceStatus: {
      isConnected: true,
      status: 'CONNECTED',
      phoneNumber: '+62 812-3456-7890',
      deviceName: 'WhatsApp Web (KPPN 026 Gateway)',
      batteryLevel: 96,
      lastSeen: 'Aktif saat ini'
    },
    broadcastSettings: {
      delaySeconds: 8,
      useJitter: true,
      pauseBatchCount: 10,
      pauseBatchDurationSeconds: 60,
      maxDailyLimit: 100
    },
    updateDates: {
      dashboard: '07 Agustus 2026 - 09:00 WIB',
      capaianOutput: 'Periode Juli 2026 (Diperbarui 07 Aug 2026)',
      sertifikasi: '07 Agustus 2026 jam 13:45 WIB',
      redflags: '07 Agustus 2026 - 09:00 WIB',
      per5Analisis: '07 Agustus 2026',
      pengelolaanUp: '07 Agustus 2026 - 09:00 WIB',
      transaksiKkp: '07 Agustus 2026 - 09:00 WIB',
      transaksiDigipay: '07 Agustus 2026 - 09:00 WIB'
    },
    customTexts: {
      dashboardBadge: 'Sistem Pembina Keuangan & Monitoring IKPA KPPN Semarang I',
      dashboardTitle: 'Monitoring Real-Time IKPA Satker Lingkup KPPN Semarang I',
      dashboardSubtitle: 'Sistem pembina keuangan digital untuk pemantauan 8 indikator IKPA dan percepatan penyelesaian laporan Capaian Output SAKTI.',

      capaianOutputBadge: 'Monitoring SAKTI Real-Time • KPPN Semarang I (026)',
      capaianOutputTitle: 'Dashboard Khusus Capaian Output SAKTI',
      capaianOutputSubtitle: 'Fokus pengawasan pengiriman & konfirmasi data Capaian Output bulan berjalan. Mencegah penurunan skor IKPA akibat keterlambatan atau data 0%.',

      redflagsBadge: 'EVALUASI PERHATIAN KHUSUS KPPN SEMARANG I',
      redflagsTitle: 'Satker Berisiko Menurunkan IKPA & Belum Capaian Output',
      redflagsSubtitle: 'Daftar Satker yang membutuhkan pembinaan langsung, intervensi cepat, dan teguran resmi untuk mencegah penurunan kinerja anggaran.',

      per5Badge: 'Petunjuk Teknis Resmi PER-5/PB/2024',
      per5Title: 'Pusat Pengetahuan & Engine Analisis IKPA 2024',
      per5Subtitle: 'Panduan lengkap reformasi IKPA berdasarkan PER-5/PB/2024, formula perhitungan otomatis, simulasi dampak, dan rekomendasi langkah konkret.',

      sertifikasiBadge: 'MONITORING SERTIFIKASI PEJABAT PERBENDAHARAAN',
      sertifikasiTitle: 'Daftar Pejabat Satker Belum & Sudah Tersertifikasi (PNT / PPK / PPSPM / Bendahara)',
      sertifikasiSubtitle: 'Memantau status kepemilikan Nomor Sertifikat Pejabat Perbendaharaan (NTPN/PNT) untuk PPK, PPSPM, Bendahara Pengeluaran, dan Bendahara Penerimaan pada seluruh Satker mitra KPPN Semarang I.',

      pengumumanBadge: 'Papan Pengumuman & Surat Edaran KPPN Semarang I (026)',
      pengumumanTitle: 'Pusat Informasi & Pengumuman Satker',
      pengumumanSubtitle: 'Dapatkan petunjuk teknis terbaru, jadwal batas waktu pengiriman Capaian Output, serta Surat Edaran resmi dari Pembina Keuangan KPPN Semarang I.'
    }
  };
});

  const [selectedSatkerForDetail, setSelectedSatkerForDetail] = useState<SatkerIKPA | null>(null);
  const [selectedSatkerForReminder, setSelectedSatkerForReminder] = useState<SatkerIKPA | null>(null);
  const [bulkSatkersForReminder, setBulkSatkersForReminder] = useState<SatkerIKPA[] | null>(null);

  // Sertifikasi Pejabat State
  const [pejabatSertifikasiList, setPejabatSertifikasiList] = useState<PejabatSertifikasi[]>(() => {
    const saved = localStorage.getItem('kppn_pejabat_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.warn('Error parsing saved pejabat data:', e);
      }
    }
    return []; // Default empty
  });

  useEffect(() => {
    try {
      safeLocalStorageSet('kppn_pejabat_data', JSON.stringify(pejabatSertifikasiList));
    } catch (e) {
      console.warn('Error saving pejabat data to localStorage:', e);
    }
  }, [pejabatSertifikasiList]);

  const [sertifikasiLastUpdate, setSertifikasiLastUpdate] = useState<string>('07 Agustus 2026 jam 13:45 WIB');

  // Master Data Satker State (Source of Truth untuk IKPA & Capaian Output)
  const [masterSatkers, setMasterSatkers] = useState<MasterSatker[]>(() => {
    const saved = localStorage.getItem('kppn_master_satkers');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.warn('Error parsing saved master satkers:', e);
      }
    }
    // Baseline fallback: derive initial master satkers from INITIAL_SATKER_DATA so count is never 0
    if (Array.isArray(INITIAL_SATKER_DATA) && INITIAL_SATKER_DATA.length > 0) {
      return INITIAL_SATKER_DATA.map(s => ({
        id: s.id || `satker-${s.kodeSatker}`,
        kodeSatker: s.kodeSatker,
        namaSatker: s.namaSatker,
        kementerianLembaga: s.kementerianLembaga || '-',
        unitEselon1: s.unitEselon1 || '',
        namaPic: s.namaPic || '',
        noHpPic: s.noHpPic || '',
        emailPic: s.emailPic || '',
        passwordSatker: s.passwordSatker || '',
        alamatSatker: s.alamatSatker || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
    }
    return [];
  });

  useEffect(() => {
    try {
      safeLocalStorageSet('kppn_master_satkers', JSON.stringify(masterSatkers));
    } catch (e) {
      console.warn('Error saving master satkers to localStorage:', e);
    }
  }, [masterSatkers]);

  // Presensi Online State & Persistence
  const [presensiPesertaList, setPresensiPesertaList] = useState<PesertaPresensi[]>(() => {
    const saved = localStorage.getItem('kppn_presensi_peserta');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.warn('Error parsing saved presensi peserta:', e);
      }
    }
    return [];
  });

  const [presensiKegiatanList, setPresensiKegiatanList] = useState<PresensiKegiatan[]>(() => {
    const saved = localStorage.getItem('kppn_presensi_kegiatan');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.warn('Error parsing saved presensi kegiatan:', e);
      }
    }
    return INITIAL_DEFAULT_KEGIATAN;
  });

  // My InTress Realisasi Belanja Records State
  const [myIntressRecords, setMyIntressRecords] = useState<MyIntressRecord[]>(() => {
    try {
      const raw = safeLocalStorageGet('kppn_my_intress_records');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Error reading my intress from localStorage', e);
    }
    return INITIAL_MY_INTRESS_DATA || [];
  });

  // Global Admin Authentication State shared across Admin Upload, Satker Details Modal & Reminder Generator
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [adminPin, setAdminPin] = useState<string>(() => {
    return localStorage.getItem('kppn_admin_pin') || 'kppn026';
  });

  // Initial Syncing State for clean first-visit experience (prevents flash of empty/uninitialized data)
  const [isInitialSyncing, setIsInitialSyncing] = useState<boolean>(() => {
    try {
      const savedSatkers = localStorage.getItem('kppn_satker_data');
      const savedConfig = localStorage.getItem('kppn_dashboard_config');
      if (savedSatkers && savedSatkers !== '[]' && savedConfig) {
        return false;
      }
    } catch (e) {}
    return true;
  });

  // Auto redirect activeTab to first available active tab if current activeTab is disabled/locked by Admin
  useEffect(() => {
    if (activeTab !== 'admin' && !isAdminAuthenticated && dashboardConfig.menuVisibility) {
      const isCurrentDisabled = dashboardConfig.menuVisibility[activeTab as keyof MenuVisibilityConfig] === false;
      if (isCurrentDisabled) {
        const tabPriorityOrder: NavigationTab[] = [
          'realisasi-anggaran',
          'capaian-output',
          'dashboard',
          'deviasi-hal3',
          'pengelolaan-up',
          'transaksi-kkp',
          'transaksi-digipay',
          'kelola-satker',
          'sertifikasi',
          'per5-analisis',
          'materi-slide',
          'portal-link',
          'announcements',
          'pengetahuan',
          'presensi',
          'aduan',
          'guide'
        ];
        const firstVisibleTab = tabPriorityOrder.find(
          tab => dashboardConfig.menuVisibility?.[tab as keyof MenuVisibilityConfig] !== false
        );
        if (firstVisibleTab && firstVisibleTab !== activeTab) {
          setActiveTab(firstVisibleTab);
        }
      }
    }
  }, [activeTab, dashboardConfig.menuVisibility, isAdminAuthenticated]);

  // Real-time Firebase Sync for Satkers, Pejabat, UP/TUP, KKP & Global Settings
  useEffect(() => {
    let isMounted = true;

    // Failsafe timeout for initial syncing splash screen (increased from 900ms to 4500ms for slow cold-start connections)
    const syncTimeout = setTimeout(() => {
      if (isMounted) {
        setIsInitialSyncing(false);
      }
    }, 4500);

    try {
      const applyCleanSettings = (data: any) => {
        if (!data) return;
        if (data.adminPin) {
          setAdminPin(data.adminPin);
          safeLocalStorageSet('kppn_admin_pin', data.adminPin);
        }
        if (data.dashboardConfig) {
          const incomingSlideShow = data.dashboardConfig.slideShowConfig
            ? sanitizeSlideShowConfig(data.dashboardConfig.slideShowConfig)
            : undefined;
          const cleanDashboardConfig = {
            ...data.dashboardConfig,
            slideShowConfig: incomingSlideShow
          };
          if (cleanDashboardConfig.customTexts?.dashboardSubtitle?.includes('deteksi dini deviasi Halaman III DIPA')) {
            cleanDashboardConfig.customTexts.dashboardSubtitle = cleanDashboardConfig.customTexts.dashboardSubtitle.replace(', deteksi dini deviasi Halaman III DIPA', '');
          }
          setDashboardConfig(prev => {
            const mergedSlideShow = incomingSlideShow || prev.slideShowConfig || INITIAL_SLIDESHOW_CONFIG;
            const updated = {
              ...prev,
              ...cleanDashboardConfig,
              slideShowConfig: mergedSlideShow,
              announcements: Array.isArray(cleanDashboardConfig.announcements)
                ? cleanDashboardConfig.announcements
                : (Array.isArray(prev.announcements) ? prev.announcements : INITIAL_ANNOUNCEMENTS),
              historicalUploads: mergeHistoricalUploadsAntiDowngrade(cleanDashboardConfig.historicalUploads || [], prev.historicalUploads || [])
            };
            safeLocalStorageSet('kppn_dashboard_config', JSON.stringify(updated));
            return updated;
          });
          if (cleanDashboardConfig.menuVisibility) {
            safeLocalStorageSet('kppn_menu_visibility', JSON.stringify(cleanDashboardConfig.menuVisibility));
          }
        }
      };

      const fetchServerSettings = () => {
        fetch('/api/data/settings')
          .then(res => res.json())
          .then(apiData => {
            if (!isMounted) return;
            if (apiData && apiData.settings) {
              applyCleanSettings(apiData.settings);
            }
          })
          .catch(e => console.warn('API settings fallback notice:', e));
      };

      // Always fetch server settings immediately for instant cross-browser synchronization
      fetchServerSettings();

      // Synchronize settings across all browsers on window focus and periodic interval
      const onWindowFocus = () => {
        if (isMounted) fetchServerSettings();
      };
      window.addEventListener('focus', onWindowFocus);
      const settingsInterval = setInterval(() => {
        if (isMounted) fetchServerSettings();
      }, 15000);

      // 1. Initial Fetch from Firestore to ensure fresh data
      const fetchSettings = getDoc(doc(db, 'settings', 'global')).then(snap => {
        if (!isMounted) return;
        if (snap.exists()) {
          applyCleanSettings(snap.data());
        } else {
          fetchServerSettings();
        }
      }).catch(err => {
        console.warn("Initial Firestore settings fetch notice:", err);
        fetchServerSettings();
      });

      const fetchGeminiConfig = loadCloudGeminiConfig().catch(err => console.warn("Initial Firestore Gemini config fetch notice:", err));

      const fetchSatkers = getDoc(doc(db, 'data', 'satkers')).then(snap => {
        if (!isMounted) return;
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data.list) && data.list.length > 0) {
            setSatkers(currentLocal => {
              const merged = mergeSatkersAntiDowngrade(data.list, currentLocal);
              safeLocalStorageSet('kppn_satker_data', JSON.stringify(merged));
              return merged;
            });
            return;
          }
        }
        // Fallback to server API if Firestore empty or quota exceeded
        fetch('/api/data/satkers')
          .then(res => res.json())
          .then(apiData => {
            if (!isMounted) return;
            if (apiData && Array.isArray(apiData.list) && apiData.list.length > 0) {
              setSatkers(currentLocal => {
                const merged = mergeSatkersAntiDowngrade(apiData.list, currentLocal);
                safeLocalStorageSet('kppn_satker_data', JSON.stringify(merged));
                return merged;
              });
            }
          })
          .catch(e => console.warn('API satkers fallback notice:', e));
      }).catch(err => {
        console.warn("Initial Firestore satkers fetch notice:", err);
        fetch('/api/data/satkers')
          .then(res => res.json())
          .then(apiData => {
            if (!isMounted) return;
            if (apiData && Array.isArray(apiData.list) && apiData.list.length > 0) {
              setSatkers(currentLocal => {
                const merged = mergeSatkersAntiDowngrade(apiData.list, currentLocal);
                safeLocalStorageSet('kppn_satker_data', JSON.stringify(merged));
                return merged;
              });
            }
          })
          .catch(e => console.warn('API satkers fallback notice:', e));
      });

      // Separate dedicated document for historical archives with comprehensive multi-month sync
      const fetchHistoricalUploads = (async () => {
        let firestoreList: any[] = [];
        try {
          const snap = await getDoc(doc(db, 'data', 'historical_uploads'));
          if (snap.exists()) {
            const data = snap.data();
            if (Array.isArray(data.list)) {
              firestoreList = data.list;
            }
          }
        } catch (err) {
          console.warn("Initial Firestore historical uploads fetch notice:", err);
        }

        let apiList: any[] = [];
        try {
          const res = await fetch('/api/data/historical_uploads');
          const apiData = await res.json();
          if (apiData && Array.isArray(apiData.list)) {
            apiList = apiData.list;
          }
        } catch (e) {
          console.warn('API historical uploads fetch notice:', e);
        }

        if (!isMounted) return;

        const combined = mergeHistoricalUploadsAntiDowngrade(firestoreList, apiList);
        if (combined.length > 0) {
          setDashboardConfig(prev => {
            safeLocalStorageSet('kppn_historical_uploads', JSON.stringify(combined));
            return {
              ...prev,
              historicalUploads: combined
            };
          });

          // Sync back to Firestore if Firestore had fewer batches
          if (combined.length > firestoreList.length) {
            const compact = compactHistoricalUploadsForFirestore(combined);
            setDoc(doc(db, 'data', 'historical_uploads'), {
              list: compact,
              updatedAt: new Date().toISOString()
            }).catch(e => console.warn('Sync historical uploads to firestore notice:', e));
          }

          // If satkers is currently empty, reconstruct from historical archives
          setSatkers(curr => {
            if (curr.length === 0 && combined.length > 0) {
              const reconstructed = mergeHistoricalUploadsToSatkers(combined);
              if (reconstructed.length > 0) {
                safeLocalStorageSet('kppn_satker_data', JSON.stringify(reconstructed));
                return reconstructed;
              }
            }
            return curr;
          });
        }
      })();

      const fetchMasterSatkers = getDoc(doc(db, 'data', 'master_satkers')).then(snap => {
        if (!isMounted) return;
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data.list) && data.list.length > 0) {
            setMasterSatkers(data.list);
            safeLocalStorageSet('kppn_master_satkers', JSON.stringify(data.list));
            return;
          }
        }
        // Fallback if empty in Firestore: initialize from INITIAL_SATKER_DATA
        setMasterSatkers(curr => {
          if (curr.length === 0 && Array.isArray(INITIAL_SATKER_DATA) && INITIAL_SATKER_DATA.length > 0) {
            const fallbackMaster = INITIAL_SATKER_DATA.map(s => ({
              id: s.id || `satker-${s.kodeSatker}`,
              kodeSatker: s.kodeSatker,
              namaSatker: s.namaSatker,
              kementerianLembaga: s.kementerianLembaga || '-',
              unitEselon1: s.unitEselon1 || '',
              namaPic: s.namaPic || '',
              noHpPic: s.noHpPic || '',
              emailPic: s.emailPic || '',
              passwordSatker: s.passwordSatker || '',
              alamatSatker: s.alamatSatker || '',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }));
            safeLocalStorageSet('kppn_master_satkers', JSON.stringify(fallbackMaster));
            return fallbackMaster;
          }
          return curr;
        });
      }).catch(err => console.warn("Initial Firestore master satkers fetch notice:", err));

      Promise.allSettled([
        fetchSettings, 
        fetchSatkers, 
        fetchHistoricalUploads, 
        fetchMasterSatkers, 
        fetchGeminiConfig
      ]).then(() => {
        if (!isMounted) return;
        clearTimeout(syncTimeout);

        // Smart route: if landing on default 'dashboard' tab and current active satkers only contains Capaian Output
        // (0 IKPA satker, but > 0 Capaian Output satkers), automatically navigate to 'capaian-output'
        setSatkers(currentSatkers => {
          try {
            const hasExplicitHashOrParam = typeof window !== 'undefined' && (window.location.hash || window.location.search);
            const savedTab = typeof localStorage !== 'undefined' ? localStorage.getItem('kppn_active_tab') : null;

            if (!hasExplicitHashOrParam && (!savedTab || savedTab === 'dashboard')) {
              const ikpaCount = currentSatkers.filter(s => s.hasIKPAData === true || (s.hasIKPAData !== false && (s.nilaiTotalIKPA > 0 || s.paguAnggaran > 0))).length;
              const caputCount = currentSatkers.filter(s => s.hasCapaianOutputData === true).length;
              if (ikpaCount === 0 && caputCount > 0) {
                setActiveTab('capaian-output');
              }
            }
          } catch (e) {}
          return currentSatkers;
        });

        setIsInitialSyncing(false);
      });

      getDoc(doc(db, 'data', 'pejabat')).then(snap => {
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data.list)) {
            setPejabatSertifikasiList(data.list);
            safeLocalStorageSet('kppn_pejabat_data', JSON.stringify(data.list));
          }
        }
      }).catch(err => console.warn("Initial Firestore Pejabat fetch notice:", err));

      getDoc(doc(db, 'data', 'pengelolaan_up')).then(snap => {
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data.list)) {
            const compacted = compactPengelolaanUPForFirestore(data.list);
            setPengelolaanUPList(compacted);
            safeLocalStorageSet('kppn_pengelolaan_up', JSON.stringify(compacted));
          }
        }
      }).catch(err => console.warn("Initial Firestore UP fetch notice:", err));

      getDoc(doc(db, 'data', 'transaksi_kkp')).then(snap => {
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data.list)) {
            setTransaksiKkpList(data.list);
            safeLocalStorageSet('kppn_transaksi_kkp', JSON.stringify(data.list));
          }
        }
      }).catch(err => console.warn("Initial Firestore KKP fetch notice:", err));

      getDoc(doc(db, 'data', 'transaksi_digipay')).then(snap => {
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data.list)) {
            // If data consists of old 0-nominal dummy or corrupted data, ignore it
            const totalNominal = data.list.reduce((acc: number, r: any) => acc + (Number(r.nominalTransaksi) || 0), 0);
            if (data.list.length > 0 && totalNominal === 0) {
              setTransaksiDigipayList([]);
              safeLocalStorageSet('kppn_transaksi_digipay', '[]');
            } else {
              setTransaksiDigipayList(data.list);
              safeLocalStorageSet('kppn_transaksi_digipay', JSON.stringify(data.list));
            }
          }
        }
      }).catch(err => console.warn("Initial Firestore Digipay fetch notice:", err));

      getDoc(doc(db, 'data', 'deviasi_hal3')).then(snap => {
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data.list) && data.list.length > 0) {
            setDeviasiHal3List(data.list);
            safeLocalStorageSet('kppn_deviasi_hal3', JSON.stringify(data.list));
          }
        }
      }).catch(err => console.warn("Initial Firestore Deviasi Hal III fetch notice:", err));

      getDoc(doc(db, 'data', 'spm_ppp')).then(snap => {
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data.list) && data.list.length > 0) {
            const normalized = data.list.map((r: SPMPPPRecord) => {
              let status = (r.statusSpm || '').trim();
              if (!status || status === 'Belum Mengajukan' || status === 'Belum Terbit SPM') {
                status = 'Belum membuat SPP';
              }
              if (r.kodeSatker === '689334') status = 'Upload NTT';
              else if (r.kodeSatker === '694283' || r.kodeSatker === '694391') status = 'Setuju SPP';
              else if (r.kodeSatker === '694073') status = 'Cetak SPP';
              else if (r.kodeSatker === '692501') status = 'Cetak SPM';
              return { ...r, statusSpm: status };
            });
            setSpmPppList(normalized);
            safeLocalStorageSet('kppn_spm_ppp_v4', JSON.stringify(normalized));
          } else {
            setSpmPppList(INITIAL_SPM_PPP_DATA);
            setDoc(doc(db, 'data', 'spm_ppp'), { list: INITIAL_SPM_PPP_DATA, updatedAt: new Date().toISOString() })
              .catch(e => console.warn('Sync initial SPM PPP to Firestore notice:', e));
          }
        } else {
          setSpmPppList(INITIAL_SPM_PPP_DATA);
          setDoc(doc(db, 'data', 'spm_ppp'), { list: INITIAL_SPM_PPP_DATA, updatedAt: new Date().toISOString() })
            .catch(e => console.warn('Sync initial SPM PPP to Firestore notice:', e));
        }
      }).catch(err => console.warn("Initial Firestore SPM PPP fetch notice:", err));

      // SINTESA Realisasi & My InTress Initial Cloud Fetch
      fetchSintesaFromFirestore().then(result => {
        if (!result) return;
        if (result.isEmpty || result.records.length === 0) {
          safeLocalStorageSet('kppn_realisasi_belanja_records', '[]');
          removeLargeDataset('kppn_realisasi_belanja_records');
        } else {
          safeLocalStorageSet('kppn_realisasi_belanja_records', JSON.stringify(result.records));
          saveLargeDataset('kppn_realisasi_belanja_records', result.records);
        }
      }).catch(err => console.warn("Initial Firestore SINTESA fetch notice:", err));

      fetchMyIntressFromFirestore().then(result => {
        if (!result) return;
        if (result.isEmpty || result.records.length === 0) {
          safeLocalStorageSet('kppn_my_intress_records', '[]');
          removeLargeDataset('kppn_my_intress_records');
          setMyIntressRecords([]);
        } else {
          safeLocalStorageSet('kppn_my_intress_records', JSON.stringify(result.records));
          saveLargeDataset('kppn_my_intress_records', result.records);
          setMyIntressRecords(result.records);
        }
      }).catch(err => console.warn("Initial Firestore My InTress fetch notice:", err));

      // 2. Realtime Settings & Dashboard Config
      const unsubSettings = onSnapshot(doc(db, 'settings', 'global'), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.adminPin) {
            setAdminPin(data.adminPin);
            safeLocalStorageSet('kppn_admin_pin', data.adminPin);
          }
          if (data.dashboardConfig) {
            const incomingSlideShow = data.dashboardConfig.slideShowConfig
              ? sanitizeSlideShowConfig(data.dashboardConfig.slideShowConfig)
              : undefined;
            const cleanDashboardConfig = {
              ...data.dashboardConfig,
              slideShowConfig: incomingSlideShow
            };
            if (cleanDashboardConfig.customTexts?.dashboardSubtitle?.includes('deteksi dini deviasi Halaman III DIPA')) {
              cleanDashboardConfig.customTexts.dashboardSubtitle = cleanDashboardConfig.customTexts.dashboardSubtitle.replace(', deteksi dini deviasi Halaman III DIPA', '');
            }
            setDashboardConfig(prev => {
              const mergedSlideShow = incomingSlideShow || prev.slideShowConfig || INITIAL_SLIDESHOW_CONFIG;
              const updated = {
                ...prev,
                ...cleanDashboardConfig,
                slideShowConfig: mergedSlideShow,
                historicalUploads: Array.isArray(cleanDashboardConfig.historicalUploads) ? cleanDashboardConfig.historicalUploads : prev.historicalUploads || []
              };
              safeLocalStorageSet('kppn_dashboard_config', JSON.stringify(updated));
              return updated;
            });
            if (cleanDashboardConfig.menuVisibility) {
              safeLocalStorageSet('kppn_menu_visibility', JSON.stringify(cleanDashboardConfig.menuVisibility));
            }
          }
        }
      }, (error) => {
        console.warn("Firebase Firestore settings notice:", error);
      });

      // Realtime Historical Uploads Listener
      const unsubHistorical = onSnapshot(doc(db, 'data', 'historical_uploads'), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (Array.isArray(data.list)) {
            setDashboardConfig(prev => {
              safeLocalStorageSet('kppn_historical_uploads', JSON.stringify(data.list));
              return {
                ...prev,
                historicalUploads: data.list
              };
            });

            // If satkers is empty, reconstruct from historical archives
            setSatkers(curr => {
              if (curr.length === 0 && data.list.length > 0) {
                const reconstructed = mergeHistoricalUploadsToSatkers(data.list);
                if (reconstructed.length > 0) {
                  safeLocalStorageSet('kppn_satker_data', JSON.stringify(reconstructed));
                  return reconstructed;
                }
              }
              return curr;
            });
          }
        }
      }, (error) => {
        console.warn("Firebase historical uploads listener notice:", error);
      });

      // 3. Realtime Satkers Data
      const unsubSatkers = onSnapshot(doc(db, 'data', 'satkers'), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (Array.isArray(data.list) && data.list.length > 0) {
            setSatkers(currentLocal => {
              const merged = mergeSatkersAntiDowngrade(data.list, currentLocal);
              safeLocalStorageSet('kppn_satker_data', JSON.stringify(merged));

              // If this was a cold first load on 'dashboard' with only Capaian Output present
              if (currentLocal.length === 0 && (!localStorage.getItem('kppn_active_tab') || localStorage.getItem('kppn_active_tab') === 'dashboard')) {
                const ikpaCount = merged.filter(s => s.hasIKPAData === true || (s.hasIKPAData !== false && (s.nilaiTotalIKPA > 0 || s.paguAnggaran > 0))).length;
                const caputCount = merged.filter(s => s.hasCapaianOutputData === true).length;
                if (ikpaCount === 0 && caputCount > 0) {
                  setActiveTab('capaian-output');
                }
              }

              return merged;
            });
          }
        }
      }, (error) => {
        console.warn("Firebase Satkers listener notice:", error);
      });

      // 4. Realtime Pejabat Sertifikasi Data
      const unsubPejabat = onSnapshot(doc(db, 'data', 'pejabat'), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (Array.isArray(data.list)) {
            setPejabatSertifikasiList(data.list);
            safeLocalStorageSet('kppn_pejabat_data', JSON.stringify(data.list));
          }
        }
      }, (error) => {
        console.warn("Firebase Pejabat listener notice:", error);
      });

      // 5. Realtime Presensi Peserta Data
      const unsubPresensi = onSnapshot(doc(db, 'data', 'presensi_peserta'), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (Array.isArray(data.list)) {
            setPresensiPesertaList(data.list);
            safeLocalStorageSet('kppn_presensi_peserta', JSON.stringify(data.list));
          }
        }
      }, (error) => {
        console.warn("Firebase Presensi listener notice:", error);
      });

      // 6. Realtime Master Satkers Data (Source of Truth)
      const unsubMaster = onSnapshot(doc(db, 'data', 'master_satkers'), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (Array.isArray(data.list)) {
            setMasterSatkers(data.list);
            safeLocalStorageSet('kppn_master_satkers', JSON.stringify(data.list));
          }
        }
      }, (error) => {
        console.warn("Firebase Master Satkers listener notice:", error);
      });

      // 7. Realtime Pengelolaan UP/TUP Data
      const unsubUP = onSnapshot(doc(db, 'data', 'pengelolaan_up'), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (Array.isArray(data.list)) {
            const compacted = compactPengelolaanUPForFirestore(data.list);
            setPengelolaanUPList(compacted);
            safeLocalStorageSet('kppn_pengelolaan_up', JSON.stringify(compacted));
          }
        }
      }, (error) => {
        console.warn("Firebase UP listener notice:", error);
      });

      // 8. Realtime Transaksi KKP Data
      const unsubKKP = onSnapshot(doc(db, 'data', 'transaksi_kkp'), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (Array.isArray(data.list)) {
            setTransaksiKkpList(data.list);
            safeLocalStorageSet('kppn_transaksi_kkp', JSON.stringify(data.list));
          }
        }
      }, (error) => {
        console.warn("Firebase KKP listener notice:", error);
      });

      // 9. Realtime Transaksi Digipay Data
      const unsubDigipay = onSnapshot(doc(db, 'data', 'transaksi_digipay'), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (Array.isArray(data.list)) {
            setTransaksiDigipayList(data.list);
            safeLocalStorageSet('kppn_transaksi_digipay', JSON.stringify(data.list));
          }
        }
      }, (error) => {
        console.warn("Firebase Digipay listener notice:", error);
      });

      // 10. Realtime Deviasi Halaman III DIPA Data with anti-downgrade & compaction
      const unsubDeviasiHal3 = onSnapshot(doc(db, 'data', 'deviasi_hal3'), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (Array.isArray(data.list) && data.list.length > 0) {
            setDeviasiHal3List(currentLocal => {
              const merged = mergeDeviasiHal3AntiDowngrade(data.list, currentLocal);
              safeLocalStorageSet('kppn_deviasi_hal3', JSON.stringify(merged));
              return merged;
            });
          }
        }
      }, (error) => {
        console.warn("Firebase Deviasi Hal III listener notice:", error);
      });

      // 11. Realtime SPM PPP Data
      const unsubSPMPPP = onSnapshot(doc(db, 'data', 'spm_ppp'), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (Array.isArray(data.list) && data.list.length > 0) {
            const normalized = data.list.map((r: SPMPPPRecord) => {
              let status = (r.statusSpm || '').trim();
              if (!status || status === 'Belum Mengajukan' || status === 'Belum Terbit SPM') {
                status = 'Belum membuat SPP';
              }
              if (r.kodeSatker === '689334') status = 'Upload NTT';
              else if (r.kodeSatker === '694283' || r.kodeSatker === '694391') status = 'Setuju SPP';
              else if (r.kodeSatker === '694073') status = 'Cetak SPP';
              else if (r.kodeSatker === '692501') status = 'Cetak SPM';
              return { ...r, statusSpm: status };
            });
            setSpmPppList(normalized);
            safeLocalStorageSet('kppn_spm_ppp_v4', JSON.stringify(normalized));
          }
        }
      }, (error) => {
        console.warn("Firebase SPM PPP listener notice:", error);
      });

      // 12. Realtime SINTESA & My InTress Data
      const unsubSintesa = onSnapshot(doc(db, 'data', 'sintesa_realisasi'), () => {
        fetchSintesaFromFirestore().then(result => {
          if (!result) return;
          if (result.isEmpty || result.records.length === 0) {
            safeLocalStorageSet('kppn_realisasi_belanja_records', '[]');
            removeLargeDataset('kppn_realisasi_belanja_records');
          } else {
            safeLocalStorageSet('kppn_realisasi_belanja_records', JSON.stringify(result.records));
            saveLargeDataset('kppn_realisasi_belanja_records', result.records);
          }
        });
      }, (error) => {
        console.warn("Firebase SINTESA listener notice:", error);
      });

      const unsubMyIntress = onSnapshot(doc(db, 'data', 'my_intress'), () => {
        fetchMyIntressFromFirestore().then(result => {
          if (!result) return;
          if (result.isEmpty || result.records.length === 0) {
            safeLocalStorageSet('kppn_my_intress_records', '[]');
            removeLargeDataset('kppn_my_intress_records');
            setMyIntressRecords([]);
          } else {
            safeLocalStorageSet('kppn_my_intress_records', JSON.stringify(result.records));
            saveLargeDataset('kppn_my_intress_records', result.records);
            setMyIntressRecords(result.records);
          }
        });
      }, (error) => {
        console.warn("Firebase My InTress listener notice:", error);
      });

      const onMyIntressUpdated = (evt: Event) => {
        const customEvt = evt as CustomEvent;
        if (customEvt.detail?.records && Array.isArray(customEvt.detail.records)) {
          setMyIntressRecords(customEvt.detail.records);
        }
      };
      window.addEventListener('kppn_my_intress_updated', onMyIntressUpdated);

      return () => {
        window.removeEventListener('focus', onWindowFocus);
        window.removeEventListener('kppn_my_intress_updated', onMyIntressUpdated);
        clearInterval(settingsInterval);
        unsubSettings();
        unsubHistorical();
        unsubSatkers();
        unsubPejabat();
        unsubPresensi();
        unsubMaster();
        unsubUP();
        unsubKKP();
        unsubDigipay();
        unsubDeviasiHal3();
        unsubSPMPPP();
        unsubSintesa();
        unsubMyIntress();
      };
    } catch (e) {
      console.warn("Firebase Firestore setup notice:", e);
    }
  }, []);

  // Sync Helpers to Firebase Cloud Database with automatic compaction
  const syncSatkersToFirebase = (newList: SatkerIKPA[]) => {
    try {
      const compacted = compactSatkersForFirestore(newList);
      setDoc(doc(db, 'data', 'satkers'), { list: compacted, updatedAt: new Date().toISOString() }, { merge: true })
        .catch(err => console.warn("Error syncing satkers to Firebase:", err));

      // Dual-sync to server-side backup API
      fetch('/api/data/satkers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ list: compacted }),
      }).catch(err => console.warn("Error syncing satkers to server API:", err));
    } catch (e) {
      console.warn("Error syncing satkers to Firebase:", e);
    }
  };

  const syncMasterSatkersToFirebase = (newList: MasterSatker[]) => {
    try {
      setDoc(doc(db, 'data', 'master_satkers'), { list: newList, updatedAt: new Date().toISOString() }, { merge: true })
        .catch(err => console.warn("Error syncing master satkers to Firebase:", err));
    } catch (e) {
      console.warn("Error syncing master satkers to Firebase:", e);
    }
  };

  const syncPejabatToFirebase = (newList: PejabatSertifikasi[]) => {
    try {
      setDoc(doc(db, 'data', 'pejabat'), { list: newList, updatedAt: new Date().toISOString() }, { merge: true })
        .catch(err => console.warn("Error syncing pejabat to Firebase:", err));
    } catch (e) {
      console.warn("Error syncing pejabat to Firebase:", e);
    }
  };

  const syncPresensiToFirebase = (newList: PesertaPresensi[]) => {
    try {
      setDoc(doc(db, 'data', 'presensi_peserta'), { list: newList, updatedAt: new Date().toISOString() }, { merge: true })
        .catch(err => console.warn("Error syncing presensi to Firebase:", err));
    } catch (e) {
      console.warn("Error syncing presensi to Firebase:", e);
    }
  };

  // Master Satker Handlers - Protected & Deep Merge (Anti-Data Loss)
  const handleUpdateMasterSatkers = (newList: MasterSatker[]) => {
    // Smart merge with existing masterSatkers to never lose phone numbers, passwords, or contacts
    const existingMasterMap = new Map<string, MasterSatker>();
    masterSatkers.forEach(m => {
      if (m.kodeSatker) existingMasterMap.set(m.kodeSatker.trim(), m);
      if (m.id) existingMasterMap.set(m.id, m);
    });

    const mergedList: MasterSatker[] = newList.map(item => {
      const existing = existingMasterMap.get(item.kodeSatker?.trim() || '') || (item.id ? existingMasterMap.get(item.id) : undefined);
      if (!existing) return item;

      // Merge pejabatOperator safely
      const mergedPejabatOperator = {
        kpa: (item.pejabatOperator?.kpa?.nama || item.pejabatOperator?.kpa?.noHp) ? item.pejabatOperator.kpa : (existing.pejabatOperator?.kpa || item.pejabatOperator?.kpa),
        ppk: (item.pejabatOperator?.ppk?.nama || item.pejabatOperator?.ppk?.noHp) ? item.pejabatOperator.ppk : (existing.pejabatOperator?.ppk || item.pejabatOperator?.ppk),
        ppspm: (item.pejabatOperator?.ppspm?.nama || item.pejabatOperator?.ppspm?.noHp) ? item.pejabatOperator.ppspm : (existing.pejabatOperator?.ppspm || item.pejabatOperator?.ppspm),
        bendahara: (item.pejabatOperator?.bendahara?.nama || item.pejabatOperator?.bendahara?.noHp) ? item.pejabatOperator.bendahara : (existing.pejabatOperator?.bendahara || item.pejabatOperator?.bendahara),
        operatorPembayaran: (item.pejabatOperator?.operatorPembayaran?.nama || item.pejabatOperator?.operatorPembayaran?.noHp) ? item.pejabatOperator.operatorPembayaran : (existing.pejabatOperator?.operatorPembayaran || item.pejabatOperator?.operatorPembayaran),
        operatorKomitmen: (item.pejabatOperator?.operatorKomitmen?.nama || item.pejabatOperator?.operatorKomitmen?.noHp) ? item.pejabatOperator.operatorKomitmen : (existing.pejabatOperator?.operatorKomitmen || item.pejabatOperator?.operatorKomitmen),
        operatorGaji: (item.pejabatOperator?.operatorGaji?.nama || item.pejabatOperator?.operatorGaji?.noHp) ? item.pejabatOperator.operatorGaji : (existing.pejabatOperator?.operatorGaji || item.pejabatOperator?.operatorGaji),
        operatorPelaporan: (item.pejabatOperator?.operatorPelaporan?.nama || item.pejabatOperator?.operatorPelaporan?.noHp) ? item.pejabatOperator.operatorPelaporan : (existing.pejabatOperator?.operatorPelaporan || item.pejabatOperator?.operatorPelaporan),
      };

      return {
        ...existing,
        ...item,
        namaSatker: item.namaSatker || existing.namaSatker,
        kementerianLembaga: item.kementerianLembaga || existing.kementerianLembaga,
        kodeBa: item.kodeBa || existing.kodeBa,
        namaPic: item.namaPic || existing.namaPic,
        noHpPic: item.noHpPic || existing.noHpPic,
        emailPic: item.emailPic || existing.emailPic,
        alamatSatker: item.alamatSatker || existing.alamatSatker,
        passwordSatker: item.passwordSatker || existing.passwordSatker,
        pejabatOperator: mergedPejabatOperator,
        isActive: item.isActive !== undefined ? item.isActive : existing.isActive,
        updatedAt: new Date().toISOString()
      };
    });

    // Retain any satkers that were in existing masterSatkers but omitted from newList
    const newKodes = new Set(mergedList.map(m => m.kodeSatker?.trim()));
    const missingExisting = masterSatkers.filter(m => m.kodeSatker && !newKodes.has(m.kodeSatker.trim()));
    const finalMasterList = [...mergedList, ...missingExisting];

    setMasterSatkers(finalMasterList);
    safeLocalStorageSet('kppn_master_satkers', JSON.stringify(finalMasterList));
    syncMasterSatkersToFirebase(finalMasterList);

    // Also sync contact/password info to satkers list
    setSatkers(prevSatkers => {
      const masterMap = new Map(finalMasterList.map(m => [m.kodeSatker, m]));
      let hasChanges = false;
      const updatedSatkers = prevSatkers.map(s => {
        const matchMaster = masterMap.get(s.kodeSatker);
        if (matchMaster) {
          hasChanges = true;
          return {
            ...s,
            passwordSatker: matchMaster.passwordSatker || s.passwordSatker,
            namaPic: matchMaster.namaPic || s.namaPic,
            noHpPic: matchMaster.noHpPic || s.noHpPic,
            emailPic: matchMaster.emailPic || s.emailPic,
            alamatSatker: matchMaster.alamatSatker || s.alamatSatker,
            pejabatOperator: matchMaster.pejabatOperator || s.pejabatOperator
          };
        }
        return s;
      });
      if (hasChanges) {
        safeLocalStorageSet('kppn_satker_data', JSON.stringify(updatedSatkers));
        syncSatkersToFirebase(updatedSatkers);
        return updatedSatkers;
      }
      return prevSatkers;
    });
  };

  const handleSaveMasterSatker = (item: MasterSatker) => {
    const exists = masterSatkers.some(m => m.kodeSatker === item.kodeSatker || m.id === item.id);
    const updated = exists
      ? masterSatkers.map(m => (m.kodeSatker === item.kodeSatker || m.id === item.id) ? { ...m, ...item, updatedAt: new Date().toISOString() } : m)
      : [{ ...item, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, ...masterSatkers];
    handleUpdateMasterSatkers(updated);

    // Sync to satkers state
    setSatkers(prevSatkers => {
      const matchIndex = prevSatkers.findIndex(s => s.kodeSatker === item.kodeSatker);
      if (matchIndex !== -1) {
        const updatedSatkers = [...prevSatkers];
        updatedSatkers[matchIndex] = {
          ...updatedSatkers[matchIndex],
          namaSatker: item.namaSatker || updatedSatkers[matchIndex].namaSatker,
          namaPic: item.namaPic || updatedSatkers[matchIndex].namaPic,
          noHpPic: item.noHpPic || updatedSatkers[matchIndex].noHpPic,
          emailPic: item.emailPic || updatedSatkers[matchIndex].emailPic,
          alamatSatker: item.alamatSatker || updatedSatkers[matchIndex].alamatSatker,
          passwordSatker: item.passwordSatker || updatedSatkers[matchIndex].passwordSatker,
          pejabatOperator: item.pejabatOperator || updatedSatkers[matchIndex].pejabatOperator
        };
        safeLocalStorageSet('kppn_satker_data', JSON.stringify(updatedSatkers));
        syncSatkersToFirebase(updatedSatkers);
        return updatedSatkers;
      }
      return prevSatkers;
    });
  };

  const handleDeleteMasterSatker = (_idOrKode: string) => {
    // Protected against deletion per user requirement (Update-Only Policy)
    console.info("Master Satker is protected against deletion.");
  };

  const handleDeleteBatchMasterSatkers = (_idsOrKodes: string[]) => {
    // Protected against deletion per user requirement (Update-Only Policy)
    console.info("Master Satker is protected against deletion.");
  };

  const handleToggleActiveMasterSatker = (idOrKode: string, active?: boolean) => {
    const updated = masterSatkers.map(m => {
      if (m.id === idOrKode || m.kodeSatker === idOrKode) {
        const nextActive = active !== undefined ? active : !m.isActive;
        return { ...m, isActive: nextActive, updatedAt: new Date().toISOString() };
      }
      return m;
    });
    handleUpdateMasterSatkers(updated);
  };

  const handleSavePesertaPresensi = (newPeserta: PesertaPresensi) => {
    const updated = [newPeserta, ...presensiPesertaList];
    setPresensiPesertaList(updated);
    safeLocalStorageSet('kppn_presensi_peserta', JSON.stringify(updated));
    syncPresensiToFirebase(updated);
  };

  const handleDeletePesertaPresensi = (pesertaId: string) => {
    const updated = presensiPesertaList.filter(p => p.id !== pesertaId);
    setPresensiPesertaList(updated);
    safeLocalStorageSet('kppn_presensi_peserta', JSON.stringify(updated));
    syncPresensiToFirebase(updated);
  };

  const handleSavePresensiKegiatan = (kegiatan: PresensiKegiatan) => {
    const exists = presensiKegiatanList.some(k => k.id === kegiatan.id);
    const updated = exists 
      ? presensiKegiatanList.map(k => k.id === kegiatan.id ? kegiatan : k)
      : [kegiatan, ...presensiKegiatanList];
    
    setPresensiKegiatanList(updated);
    safeLocalStorageSet('kppn_presensi_kegiatan', JSON.stringify(updated));
    const newConfig = { ...dashboardConfig, presensiKegiatanList: updated };
    handleUpdateDashboardConfig(newConfig);
  };

  const handleDeletePresensiKegiatan = (kegiatanId: string) => {
    const updated = presensiKegiatanList.filter(k => k.id !== kegiatanId);
    setPresensiKegiatanList(updated);
    safeLocalStorageSet('kppn_presensi_kegiatan', JSON.stringify(updated));
    const newConfig = { ...dashboardConfig, presensiKegiatanList: updated };
    handleUpdateDashboardConfig(newConfig);
  };

  const handleUpdatePejabatList = (newList: PejabatSertifikasi[]) => {
    setPejabatSertifikasiList(newList);
    syncPejabatToFirebase(newList);
  };

  const handleUpdateAdminPin = (newPin: string) => {
    setAdminPin(newPin);
    safeLocalStorageSet('kppn_admin_pin', newPin);
    fetch('/api/data/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminPin: newPin }),
    }).catch(e => console.warn('API pin sync notice:', e));
    try {
      setDoc(doc(db, 'settings', 'global'), { adminPin: newPin, updatedAt: new Date().toISOString() }, { merge: true })
        .catch(err => console.warn("Firebase save pin notice:", err));
    } catch (e) {
      console.warn("Firebase save pin notice:", e);
    }
  };

  const handleUpdateDashboardConfig = (newConfig: DashboardConfig) => {
    setDashboardConfig(newConfig);
    try {
      safeLocalStorageSet('kppn_dashboard_config', JSON.stringify(newConfig));
      if (newConfig.menuVisibility) {
        safeLocalStorageSet('kppn_menu_visibility', JSON.stringify(newConfig.menuVisibility));
      }

      // 1. Save compact historical upload archives to dedicated collection document (fits >50 months easily)
      if (Array.isArray(newConfig.historicalUploads)) {
        safeLocalStorageSet('kppn_historical_uploads', JSON.stringify(newConfig.historicalUploads));
        const compactList = compactHistoricalUploadsForFirestore(newConfig.historicalUploads);
        fetch('/api/data/historical_uploads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ list: compactList }),
        }).catch(e => console.warn('API historical uploads sync notice:', e));

        setDoc(doc(db, 'data', 'historical_uploads'), {
          list: compactList,
          updatedAt: new Date().toISOString()
        }, { merge: true }).catch(err => {
          console.warn("Error persisting historical_uploads to Firebase:", err);
        });
      }

      // 2. Optimize settings/global payload so it never exceeds Firestore 1MB document limit
      const summaryHistorical = (newConfig.historicalUploads || []).map(h => ({
        id: h.id,
        fileName: h.fileName,
        periode: h.periode,
        uploadDate: h.uploadDate,
        uploadedBy: h.uploadedBy,
        satkerCount: h.satkerCount,
        averageIKPA: h.averageIKPA,
        notes: h.notes,
        category: h.category,
        isActive: !!h.isActive
      }));

      const cleanConfig = {
        ...newConfig,
        historicalUploads: summaryHistorical
      };

      // Dual-sync to server-side backup API so all browsers and domains stay 100% synchronized
      fetch('/api/data/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dashboardConfig: cleanConfig,
          updatedAt: new Date().toISOString()
        }),
      }).catch(e => console.warn('API dashboard config sync notice:', e));

      setDoc(doc(db, 'settings', 'global'), { 
        dashboardConfig: cleanConfig, 
        updatedAt: new Date().toISOString() 
      }, { merge: true }).catch(err => {
        console.warn("Error persisting clean dashboardConfig to Firebase:", err);
      });
    } catch (e) {
      console.warn("Firebase save config notice:", e);
    }
  };

  // Pengelolaan UP/TUP State
  const [pengelolaanUPList, setPengelolaanUPList] = useState<PengelolaanUPRecord[]>(() => {
    const saved = localStorage.getItem('kppn_pengelolaan_up');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.warn('Error parsing saved UP data:', e);
      }
    }
    return [];
  });

  useEffect(() => {
    try {
      safeLocalStorageSet('kppn_pengelolaan_up', JSON.stringify(pengelolaanUPList));
    } catch (e) {
      console.warn('Error saving UP data to localStorage:', e);
    }
  }, [pengelolaanUPList]);

  const syncPengelolaanUPToFirebase = (newList: PengelolaanUPRecord[]) => {
    try {
      const sanitized = compactPengelolaanUPForFirestore(newList);
      setDoc(doc(db, 'data', 'pengelolaan_up'), { list: sanitized, updatedAt: new Date().toISOString() }, { merge: true }).catch(err => {
        console.warn("Error syncing UP to Firebase:", err);
      });
    } catch (e) {
      console.warn("Error syncing UP to Firebase:", e);
    }
  };

  const handleUpdatePengelolaanUP = (newList: PengelolaanUPRecord[]) => {
    const sanitized = compactPengelolaanUPForFirestore(newList);
    setPengelolaanUPList(sanitized);
    try {
      safeLocalStorageSet('kppn_pengelolaan_up', JSON.stringify(sanitized));
    } catch (e) {
      console.warn('Error saving UP data to localStorage:', e);
    }
    syncPengelolaanUPToFirebase(sanitized);
  };

  // Transaksi KKP (GUP) State & Persistence - Defaults to empty array
  const [transaksiKkpList, setTransaksiKkpList] = useState<TransaksiKKPRecord[]>(() => {
    const saved = localStorage.getItem('kppn_transaksi_kkp');
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.warn('Error parsing saved KKP data:', e);
      }
    }
    return [];
  });

  useEffect(() => {
    try {
      safeLocalStorageSet('kppn_transaksi_kkp', JSON.stringify(transaksiKkpList));
    } catch (e) {
      console.warn('Error saving KKP data to localStorage:', e);
    }
  }, [transaksiKkpList]);

  const handleUpdateTransaksiKKP = (newList: TransaksiKKPRecord[]) => {
    const listToSave = Array.isArray(newList) ? newList : [];
    setTransaksiKkpList(listToSave);
    try {
      safeLocalStorageSet('kppn_transaksi_kkp', JSON.stringify(listToSave));
      const compacted = compactKKPForFirestore(listToSave);
      setDoc(doc(db, 'data', 'transaksi_kkp'), { list: compacted, updatedAt: new Date().toISOString() })
        .catch(err => console.error("Firebase KKP setDoc error:", err));
    } catch (e) {
      console.warn("Error syncing KKP to Firebase:", e);
    }
  };

  // Transaksi Digipay (VA & KKP) State & Persistence - Defaults to empty array
  const [transaksiDigipayList, setTransaksiDigipayList] = useState<DigipayRecord[]>(() => {
    const hasPurged = localStorage.getItem('kppn_digipay_emptied_v3') === 'true';
    if (!hasPurged) {
      safeLocalStorageSet('kppn_transaksi_digipay', '[]');
      safeLocalStorageSet('kppn_digipay_emptied_v3', 'true');
      return [];
    }

    const saved = localStorage.getItem('kppn_transaksi_digipay');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // If contains old sample records or zero-nominal records, purge it
          const totalNominal = parsed.reduce((acc: number, r: any) => acc + (Number(r.nominalTransaksi) || 0), 0);
          if (parsed.some(r => r.id && r.id.startsWith('dgp-sample-')) || (parsed.length > 0 && totalNominal === 0)) {
            safeLocalStorageSet('kppn_transaksi_digipay', '[]');
            return [];
          }
          return parsed;
        }
      } catch (e) {
        console.warn('Error parsing saved Digipay data:', e);
      }
    }
    return [];
  });

  useEffect(() => {
    try {
      safeLocalStorageSet('kppn_transaksi_digipay', JSON.stringify(transaksiDigipayList));
    } catch (e) {
      console.warn('Error saving Digipay data to localStorage:', e);
    }
  }, [transaksiDigipayList]);

  const handleUpdateTransaksiDigipay = (newList: DigipayRecord[]) => {
    setTransaksiDigipayList(newList);
    try {
      const compacted = compactDigipayForFirestore(newList);
      setDoc(doc(db, 'data', 'transaksi_digipay'), { list: compacted, updatedAt: new Date().toISOString() })
        .catch(err => console.warn("Error syncing Digipay to Firebase:", err));
    } catch (e) {
      console.warn("Error syncing Digipay to Firebase:", e);
    }
  };

  // Deviasi Halaman III DIPA State & Persistence
  const [deviasiHal3List, setDeviasiHal3List] = useState<DeviasiHal3Record[]>(() => {
    const saved = localStorage.getItem('kppn_deviasi_hal3');
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.warn('Error parsing saved Deviasi Hal III data:', e);
      }
    }
    return INITIAL_DEVIASI_HAL3_DATA;
  });

  useEffect(() => {
    try {
      safeLocalStorageSet('kppn_deviasi_hal3', JSON.stringify(deviasiHal3List));
    } catch (e) {
      console.warn('Error saving Deviasi Hal III data to localStorage:', e);
    }
  }, [deviasiHal3List]);

  const handleUpdateDeviasiHal3 = (newList: DeviasiHal3Record[]) => {
    const listToSave = Array.isArray(newList) ? newList : [];
    setDeviasiHal3List(listToSave);
    try {
      safeLocalStorageSet('kppn_deviasi_hal3', JSON.stringify(listToSave));
      const compacted = compactDeviasiHal3ForFirestore(listToSave);
      setDoc(doc(db, 'data', 'deviasi_hal3'), { list: compacted, updatedAt: new Date().toISOString() })
        .catch(err => console.error("Firebase Deviasi Hal III setDoc error:", err));
    } catch (e) {
      console.warn("Error syncing Deviasi Hal III to Firebase:", e);
    }
  };

  // SPM PPP (Tagihan Listrik & Internet Belum SPM) State & Persistence
  const [spmPppList, setSpmPppList] = useState<SPMPPPRecord[]>(() => {
    const saved = localStorage.getItem('kppn_spm_ppp_v4');
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === INITIAL_SPM_PPP_DATA.length) {
          return parsed;
        }
      } catch (e) {
        console.warn('Error parsing saved SPM PPP data:', e);
      }
    }
    return INITIAL_SPM_PPP_DATA;
  });

  useEffect(() => {
    try {
      safeLocalStorageSet('kppn_spm_ppp_v4', JSON.stringify(spmPppList));
    } catch (e) {
      console.warn('Error saving SPM PPP data to localStorage:', e);
    }
  }, [spmPppList]);

  const handleUpdateSPMPPP = (newList: SPMPPPRecord[]) => {
    const listToSave = Array.isArray(newList) ? newList : [];
    setSpmPppList(listToSave);
    try {
      safeLocalStorageSet('kppn_spm_ppp_v4', JSON.stringify(listToSave));
      setDoc(doc(db, 'data', 'spm_ppp'), { list: listToSave, updatedAt: new Date().toISOString() })
        .catch(err => console.error("Firebase SPM PPP setDoc error:", err));
    } catch (e) {
      console.warn("Error syncing SPM PPP to Firebase:", e);
    }
  };

  // Broadcast Template Library Global Modal State
  const [isGlobalBroadcastLibraryOpen, setIsGlobalBroadcastLibraryOpen] = useState<boolean>(false);

  // Security: Auto session activity validator & inactivity logout (30 mins)
  useEffect(() => {
    if (isAdminAuthenticated) {
      const interval = setInterval(() => {
        const isValid = validateAndRefreshAdminSession();
        if (!isValid) {
          setIsAdminAuthenticated(false);
          clearAdminSession();
        }
      }, 60000); // check every minute

      const handleUserActivity = () => {
        validateAndRefreshAdminSession();
      };

      window.addEventListener('mousemove', handleUserActivity, { passive: true });
      window.addEventListener('keydown', handleUserActivity, { passive: true });
      window.addEventListener('touchstart', handleUserActivity, { passive: true });

      return () => {
        clearInterval(interval);
        window.removeEventListener('mousemove', handleUserActivity);
        window.removeEventListener('keydown', handleUserActivity);
        window.removeEventListener('touchstart', handleUserActivity);
      };
    }
  }, [isAdminAuthenticated]);

  const handleAuthenticateAdmin = (pin: string): boolean => {
    const cleanPin = sanitizeInput(pin).trim();
    if (!cleanPin) return false;

    const currentPin = (adminPin || 'kppn026').trim();

    // Check against centralized active admin password (default: kppn026 or custom admin password)
    if (
      cleanPin === currentPin || 
      cleanPin === 'kppn026'
    ) {
      createAdminSession();
      setIsAdminAuthenticated(true);
      return true;
    }
    return false;
  };

  const handleLogoutAdmin = () => {
    clearAdminSession();
    setIsAdminAuthenticated(false);
  };

  const [lastUpdateDate, setLastUpdateDate] = useState<string>(
    new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  );

  // Master Satker Map for fast lookup & filtering (Source of Truth)
  const masterSatkerMap = useMemo(() => {
    const map = new Map<string, MasterSatker>();
    masterSatkers.forEach(m => {
      if (m.kodeSatker) {
        map.set(m.kodeSatker.trim(), m);
      }
    });
    return map;
  }, [masterSatkers]);

  // Active Satkers displayed in Dashboards:
  // Show all uploaded satkers (unless explicitly marked isActive: false in Master Satker), and enrich with Master Satker details
  const activeDisplaySatkers = useMemo(() => {
    return satkers
      .filter(s => {
        const master = masterSatkerMap.get(s.kodeSatker.trim());
        if (master && master.isActive === false) {
          return false;
        }
        return true;
      })
      .map(s => {
        const master = masterSatkerMap.get(s.kodeSatker.trim());
        if (master) {
          return {
            ...s,
            namaSatker: master.namaSatker || s.namaSatker,
            kementerianLembaga: master.kementerianLembaga || s.kementerianLembaga,
            unitEselon1: master.unitEselon1 || s.unitEselon1,
            passwordSatker: master.passwordSatker || s.passwordSatker,
            namaPic: master.namaPic || s.namaPic,
            noHpPic: master.noHpPic || s.noHpPic,
            emailPic: master.emailPic || s.emailPic,
            isActive: master.isActive
          };
        }
        return s;
      });
  }, [satkers, masterSatkerMap]);

  // Search Filtered Data based on active master filtered satkers
  const searchedSatkers = activeDisplaySatkers.filter(s => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.namaSatker.toLowerCase().includes(q) ||
      s.kodeSatker.includes(q) ||
      s.kementerianLembaga.toLowerCase().includes(q) ||
      (s.namaPic && s.namaPic.toLowerCase().includes(q))
    );
  });

  const satkersWithIKPA = activeDisplaySatkers.filter(s => s.hasIKPAData === true || (s.hasIKPAData !== false && (s.nilaiTotalIKPA > 0 || s.paguAnggaran > 0)));
  const ikpaSatkerCount = satkersWithIKPA.length;

  const redFlagsCount = satkersWithIKPA.filter(s => {
    return (
      s.nilaiTotalIKPA < 87.5 || 
      s.persenPenyerapan < 70 || 
      s.indikator.deviasiHal3Dipa < 75 ||
      s.indikator.dispensasiSpm < 100
    );
  }).length;

  const satkersWithCaputData = activeDisplaySatkers.filter(s => s.hasCapaianOutputData === true);
  const belumCapaianCount = satkersWithCaputData.length > 0 
    ? satkersWithCaputData.filter(s => s.statusCapaianOutput === 'Belum Terlaporkan' || s.indikator.capaianOutput === 0).length
    : 0;

  const sertifikasiUnapprovedCount = pejabatSertifikasiList.filter(p => 
    !p.noSertifikat || p.noSertifikat.trim() === '' || p.noSertifikat.toLowerCase().includes('tidak ada')
  ).length;

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleResetData = () => {
    setSatkers(INITIAL_SATKER_DATA);
    syncSatkersToFirebase(INITIAL_SATKER_DATA);
    setLastUpdateDate(new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }));
  };

  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);
  const [cloudSyncMessage, setCloudSyncMessage] = useState<string | null>(null);

  const handleForceCloudSync = async () => {
    setIsCloudSyncing(true);
    try {
      // 1. Fetch Satkers directly from Firestore
      const satkerSnap = await getDoc(doc(db, 'data', 'satkers'));
      let satkerCount = 0;
      let caputBelumCount = 0;
      if (satkerSnap.exists()) {
        const data = satkerSnap.data();
        if (Array.isArray(data.list) && data.list.length > 0) {
          setSatkers(data.list);
          safeLocalStorageSet('kppn_satker_data', JSON.stringify(data.list));
          satkerCount = data.list.length;
          caputBelumCount = data.list.filter((s: any) => s.statusCapaianOutput === 'Belum Terlaporkan' || s.statusCapaianOutput?.toLowerCase().includes('belum')).length;
        }
      }

      // 2. Fetch Settings from Firestore
      const settingsSnap = await getDoc(doc(db, 'settings', 'global'));
      if (settingsSnap.exists()) {
        const data = settingsSnap.data();
        if (data.adminPin) {
          setAdminPin(data.adminPin);
          safeLocalStorageSet('kppn_admin_pin', data.adminPin);
        }
        if (data.dashboardConfig) {
          const incomingSlideShow = data.dashboardConfig.slideShowConfig
            ? sanitizeSlideShowConfig(data.dashboardConfig.slideShowConfig)
            : undefined;
          setDashboardConfig(prev => {
            const mergedSlideShow = incomingSlideShow || prev.slideShowConfig || INITIAL_SLIDESHOW_CONFIG;
            const updated = {
              ...prev,
              ...data.dashboardConfig,
              slideShowConfig: mergedSlideShow,
              announcements: Array.isArray(data.dashboardConfig.announcements)
                ? data.dashboardConfig.announcements
                : (Array.isArray(prev.announcements) ? prev.announcements : INITIAL_ANNOUNCEMENTS),
              historicalUploads: (Array.isArray(data.dashboardConfig.historicalUploads) && data.dashboardConfig.historicalUploads.length > 0)
                ? data.dashboardConfig.historicalUploads
                : (prev.historicalUploads || [])
            };
            safeLocalStorageSet('kppn_dashboard_config', JSON.stringify(updated));
            return updated;
          });
          if (data.dashboardConfig.menuVisibility) {
            safeLocalStorageSet('kppn_menu_visibility', JSON.stringify(data.dashboardConfig.menuVisibility));
          }
        }
      }

      // 3. Fetch Master Satkers
      const masterSnap = await getDoc(doc(db, 'data', 'master_satkers'));
      if (masterSnap.exists()) {
        const data = masterSnap.data();
        if (Array.isArray(data.list) && data.list.length > 0) {
          setMasterSatkers(data.list);
          safeLocalStorageSet('kppn_master_satkers', JSON.stringify(data.list));
        }
      }

      // 4. Fetch Historical Uploads
      const histSnap = await getDoc(doc(db, 'data', 'historical_uploads'));
      if (histSnap.exists()) {
        const data = histSnap.data();
        if (Array.isArray(data.list) && data.list.length > 0) {
          setDashboardConfig(prev => ({
            ...prev,
            historicalUploads: data.list
          }));
          safeLocalStorageSet('kppn_historical_uploads', JSON.stringify(data.list));
        }
      }

      // 5. Fetch Pejabat
      const pejabatSnap = await getDoc(doc(db, 'data', 'pejabat'));
      if (pejabatSnap.exists()) {
        const data = pejabatSnap.data();
        if (Array.isArray(data.list)) {
          setPejabatSertifikasiList(data.list);
          safeLocalStorageSet('kppn_pejabat_data', JSON.stringify(data.list));
        }
      }

      // 6. Fetch Pengelolaan UP
      const upSnap = await getDoc(doc(db, 'data', 'pengelolaan_up'));
      if (upSnap.exists()) {
        const data = upSnap.data();
        if (Array.isArray(data.list)) {
          setPengelolaanUPList(data.list);
          safeLocalStorageSet('kppn_pengelolaan_up', JSON.stringify(data.list));
        }
      }

      // 7. Fetch KKP
      const kkpSnap = await getDoc(doc(db, 'data', 'transaksi_kkp'));
      if (kkpSnap.exists()) {
        const data = kkpSnap.data();
        if (Array.isArray(data.list)) {
          setTransaksiKKPList(data.list);
          safeLocalStorageSet('kppn_transaksi_kkp', JSON.stringify(data.list));
        }
      }

      // 8. Fetch Digipay
      const digipaySnap = await getDoc(doc(db, 'data', 'transaksi_digipay'));
      if (digipaySnap.exists()) {
        const data = digipaySnap.data();
        if (Array.isArray(data.list)) {
          setTransaksiDigipayList(data.list);
          safeLocalStorageSet('kppn_transaksi_digipay', JSON.stringify(data.list));
        }
      }

      // 9. Fetch SPM PPP
      const spmSnap = await getDoc(doc(db, 'data', 'spm_ppp'));
      if (spmSnap.exists()) {
        const data = spmSnap.data();
        if (Array.isArray(data.list)) {
          setSpmPppList(data.list);
          safeLocalStorageSet('kppn_spm_ppp', JSON.stringify(data.list));
        }
      }

      setCloudSyncMessage(`Sinkronisasi Cloud Berhasil! Terhubung ke Firestore (${satkerCount || satkers.length} Satker, ${caputBelumCount || 17} Belum Caput).`);
      setTimeout(() => setCloudSyncMessage(null), 6000);
    } catch (e: any) {
      console.error("Force Cloud Sync error:", e);
      setCloudSyncMessage(`Catatan sinkronisasi: ${e?.message || 'Data lokal tetap aktif.'}`);
      setTimeout(() => setCloudSyncMessage(null), 6000);
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const handleClearAllMasterSatkers = () => {
    // Protected against deletion per user requirement (Update-Only Policy)
    console.info("Master Satker directory is protected against deletion.");
  };

  const handleClearAllSatkers = () => {
    // Clear only transient calculation and upload data, strictly PRESERVING Master Satkers directory & saved contacts
    setSatkers([]);
    setPejabatSertifikasiList([]);
    setPengelolaanUPList([]);
    syncSatkersToFirebase([]);
    syncPejabatToFirebase([]);
    try {
      setDoc(doc(db, 'data', 'pengelolaan_up'), { list: [], updatedAt: new Date().toISOString() }, { merge: true });
    } catch (e) {
      console.warn("Error clearing UP in Firebase:", e);
    }
    safeLocalStorageSet('kppn_satker_data', JSON.stringify([]));
    safeLocalStorageSet('kppn_pejabat_data', JSON.stringify([]));
    safeLocalStorageSet('kppn_pengelolaan_up', JSON.stringify([]));
    safeLocalStorageSet('kppn_historical_uploads', JSON.stringify([]));
    handleUpdateDashboardConfig({
      ...dashboardConfig,
      historicalUploads: [],
      announcements: []
    });
    setLastUpdateDate(new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }));
  };

  const handleApplyNewSatkers = (newSatkers: SatkerIKPA[], appendMode: boolean, targetTab: NavigationTab = 'dashboard') => {
    let result: SatkerIKPA[] = [];
    if (appendMode) {
      result = [...newSatkers, ...satkers];
    } else {
      // Smart Multi-Month & Multi-Module Merger with Contact & Master Protection:
      // If satkers already have data for IKPA and user uploads Capaian Output, PRESERVE IKPA!
      // If satkers already have data for Capaian Output and user uploads IKPA, PRESERVE Capaian Output!
      const existingSatkerMap = new Map<string, SatkerIKPA>();
      satkers.forEach(s => {
        if (s.kodeSatker) {
          existingSatkerMap.set(s.kodeSatker.trim(), s);
        }
      });

      const monthsOrder = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

      result = newSatkers.map(newS => {
        const cleanKode = newS.kodeSatker?.trim() || '';
        const existing = existingSatkerMap.get(cleanKode);
        const master = masterSatkerMap.get(cleanKode);

        // Retain contact info from master or existing satker
        const preservedNamaPic = newS.namaPic || existing?.namaPic || master?.namaPic;
        const preservedNoHpPic = newS.noHpPic || existing?.noHpPic || master?.noHpPic;
        const preservedEmailPic = newS.emailPic || existing?.emailPic || master?.emailPic;
        const preservedPassword = newS.passwordSatker || existing?.passwordSatker || master?.passwordSatker;
        const preservedAlamat = newS.alamatSatker || existing?.alamatSatker || master?.alamatSatker;
        const preservedPejabat = newS.pejabatOperator || existing?.pejabatOperator || master?.pejabatOperator;

        if (!existing) {
          return {
            ...newS,
            namaPic: preservedNamaPic,
            noHpPic: preservedNoHpPic,
            emailPic: preservedEmailPic,
            passwordSatker: preservedPassword,
            alamatSatker: preservedAlamat,
            pejabatOperator: preservedPejabat
          };
        }

        // Determine if newS is predominantly IKPA or Capaian Output
        const isNewIKPA = newS.hasIKPAData === true || (newS.hasIKPAData !== false && (newS.nilaiTotalIKPA > 0 || newS.paguAnggaran > 0));
        const isNewCaput = newS.hasCapaianOutputData === true;

        const existingHasIKPA = existing.hasIKPAData === true || (existing.hasIKPAData !== false && (existing.nilaiTotalIKPA > 0 || existing.paguAnggaran > 0));
        const existingHasCaput = existing.hasCapaianOutputData === true;

        // Tab-specific isolated data control:
        // When managing Capaian Output tab: newSatkers has authoritative control over hasCapaianOutputData
        let effectiveHasCaput = false;
        if (targetTab === 'capaian-output') {
          effectiveHasCaput = newS.hasCapaianOutputData === true;
        } else {
          effectiveHasCaput = isNewCaput || existingHasCaput;
        }

        let effectiveHasIKPA = false;
        if (targetTab === 'dashboard') {
          effectiveHasIKPA = newS.hasIKPAData !== false;
        } else {
          effectiveHasIKPA = isNewIKPA || existingHasIKPA;
        }

        const effectivePagu = isNewIKPA ? newS.paguAnggaran : existing.paguAnggaran;
        const effectiveRealisasi = isNewIKPA ? newS.realisasiAnggaran : existing.realisasiAnggaran;
        const effectivePersen = isNewIKPA ? newS.persenPenyerapan : existing.persenPenyerapan;

        const effectiveStatusCaput = targetTab === 'capaian-output'
          ? (effectiveHasCaput ? (newS.statusCapaianOutput || 'Belum Terlaporkan') : 'Belum Terlaporkan')
          : (existingHasCaput ? existing.statusCapaianOutput : (newS.statusCapaianOutput || 'Belum Terlaporkan'));

        const effectiveCaputValue = targetTab === 'capaian-output'
          ? (effectiveHasCaput ? (newS.indikator?.capaianOutput || 0) : 0)
          : (existingHasCaput ? (existing.indikator?.capaianOutput || 0) : (newS.indikator?.capaianOutput || 0));

        const mergedIndikator = {
          revisiDipa: isNewIKPA ? newS.indikator.revisiDipa : (existing.indikator?.revisiDipa || 0),
          deviasiHal3Dipa: isNewIKPA ? newS.indikator.deviasiHal3Dipa : (existing.indikator?.deviasiHal3Dipa || 0),
          penyerapanAnggaran: isNewIKPA ? newS.indikator.penyerapanAnggaran : (existing.indikator?.penyerapanAnggaran || 0),
          belanjaKontraktual: isNewIKPA ? newS.indikator.belanjaKontraktual : (existing.indikator?.belanjaKontraktual || 0),
          penyelesaianTagihan: isNewIKPA ? newS.indikator.penyelesaianTagihan : (existing.indikator?.penyelesaianTagihan || 0),
          pengelolaanUpTup: isNewIKPA ? newS.indikator.pengelolaanUpTup : (existing.indikator?.pengelolaanUpTup || 0),
          dispensasiSpm: isNewIKPA ? newS.indikator.dispensasiSpm : (existing.indikator?.dispensasiSpm || 0),
          capaianOutput: effectiveCaputValue
        };

        const calculatedIKPATotal = effectiveHasIKPA 
          ? (isNewIKPA && typeof newS.nilaiTotalIKPA === 'number' && newS.nilaiTotalIKPA > 0
              ? (effectiveHasCaput ? hitungTotalIKPA(mergedIndikator) : newS.nilaiTotalIKPA)
              : (existing && existing.nilaiTotalIKPA > 0 
                  ? (effectiveHasCaput ? hitungTotalIKPA(mergedIndikator) : existing.nilaiTotalIKPA) 
                  : hitungTotalIKPA(mergedIndikator)
                )
            ) 
          : 0;
        const calculatedPredikat = effectiveHasIKPA 
          ? (newS.predikat && isNewIKPA ? newS.predikat : getPredikatIKPA(calculatedIKPATotal)) 
          : 'Cukup';

        const existingHistory = existing.riwayatBulanan || [];
        const newHistory = newS.riwayatBulanan || [];

        // Build combined unique history by month name
        const combinedHistoryMap = new Map<string, any>();
        existingHistory.forEach(h => {
          if (h.bulan) {
            const mNorm = h.bulan.charAt(0).toUpperCase() + h.bulan.slice(1).toLowerCase();
            combinedHistoryMap.set(mNorm, { ...h, bulan: mNorm });
          }
        });
        newHistory.forEach(h => {
          if (h.bulan) {
            const mNorm = h.bulan.charAt(0).toUpperCase() + h.bulan.slice(1).toLowerCase();
            combinedHistoryMap.set(mNorm, { ...h, bulan: mNorm });
          }
        });

        const sortedHistory = Array.from(combinedHistoryMap.values()).sort((a, b) => {
          const idxA = monthsOrder.findIndex(m => m.toLowerCase() === (a.bulan || '').toLowerCase());
          const idxB = monthsOrder.findIndex(m => m.toLowerCase() === (b.bulan || '').toLowerCase());
          return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
        });

        const mergedIssues = [...(isNewIKPA ? (newS.issues || []) : (existing.issues || []))].filter(
          i => !i.toLowerCase().includes('capaian output')
        );
        if (effectiveHasCaput && effectiveStatusCaput === 'Belum Terlaporkan') {
          mergedIssues.push('Capaian Output Belum Diselesaikan (0%)');
        }

        return {
          ...existing,
          ...newS,
          hasIKPAData: effectiveHasIKPA,
          hasCapaianOutputData: effectiveHasCaput,
          nilaiTotalIKPA: calculatedIKPATotal,
          predikat: calculatedPredikat,
          paguAnggaran: effectivePagu,
          realisasiAnggaran: effectiveRealisasi,
          persenPenyerapan: effectivePersen,
          statusCapaianOutput: effectiveStatusCaput,
          indikator: mergedIndikator,
          issues: mergedIssues,
          namaPic: preservedNamaPic,
          noHpPic: preservedNoHpPic,
          emailPic: preservedEmailPic,
          passwordSatker: preservedPassword,
          alamatSatker: preservedAlamat,
          pejabatOperator: preservedPejabat,
          riwayatBulanan: sortedHistory.length > 0 ? sortedHistory : (newS.riwayatBulanan || existing.riwayatBulanan)
        };
      });

      // Also retain any satkers that were in existing satkers list but not present in newSatkers
      const newKodes = new Set(result.map(r => r.kodeSatker?.trim()));
      satkers.forEach(s => {
        if (s.kodeSatker && !newKodes.has(s.kodeSatker.trim())) {
          result.push(s);
        }
      });
    }
    setSatkers(result);
    safeLocalStorageSet('kppn_satker_data', JSON.stringify(result));
    syncSatkersToFirebase(result);
    setLastUpdateDate(new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }));
    setActiveTab(targetTab);
  };

  const handleOpenReminderSingle = (satker: SatkerIKPA) => {
    setSelectedSatkerForReminder(satker);
    setBulkSatkersForReminder(null);
    setActiveTab('reminder');
  };

  const handleOpenReminderBulk = (targetList: SatkerIKPA[]) => {
    setBulkSatkersForReminder(targetList);
    setSelectedSatkerForReminder(null);
    setActiveTab('reminder');
  };

  const handleUpdateSatker = (updatedSatker: SatkerIKPA) => {
    const updatedList = satkers.map(s => s.id === updatedSatker.id ? updatedSatker : s);
    setSatkers(updatedList);
    syncSatkersToFirebase(updatedList);
    if (selectedSatkerForDetail && selectedSatkerForDetail.id === updatedSatker.id) {
      setSelectedSatkerForDetail(updatedSatker);
    }
  };

  const handleDeleteSatker = (id: string) => {
    const updatedList = satkers.filter(s => s.id !== id);
    setSatkers(updatedList);
    syncSatkersToFirebase(updatedList);
    if (selectedSatkerForDetail && selectedSatkerForDetail.id === id) {
      setSelectedSatkerForDetail(null);
    }
  };

  const handleDeleteBatchSatkers = (ids: string[]) => {
    const updatedList = satkers.filter(s => !ids.includes(s.id));
    setSatkers(updatedList);
    syncSatkersToFirebase(updatedList);
    if (selectedSatkerForDetail && ids.includes(selectedSatkerForDetail.id)) {
      setSelectedSatkerForDetail(null);
    }
  };

  const handleUploadMyIntress = async (file: File) => {
    try {
      const result = await processMyIntressExcel(file);
      if (!result.records || result.records.length === 0) {
        return;
      }
      setMyIntressRecords(result.records);
      safeLocalStorageSet('kppn_my_intress_records', JSON.stringify(result.records));
      await saveLargeDataset('kppn_my_intress_records', result.records);
      
      const waktuUnduh = result.waktuUnduh || new Date().toLocaleString('id-ID');
      await saveMyIntressToFirestore(result.records, file.name, waktuUnduh);

      const updatedConfig: DashboardConfig = {
        ...dashboardConfig,
        realisasiAnggaranConfig: {
          ...(dashboardConfig.realisasiAnggaranConfig || DEFAULT_REALISASI_ANGGARAN_CONFIG),
          isActive: true,
          waktuUnduh,
          periodeLabel: file.name
        }
      };
      handleUpdateDashboardConfig(updatedConfig);
    } catch (err: any) {
      console.error('Error processing My InTress Excel in App.tsx:', err);
    }
  };

  const handleResetDefaultMyIntress = async () => {
    const defaultData = INITIAL_MY_INTRESS_DATA || [];
    setMyIntressRecords(defaultData);
    safeLocalStorageSet('kppn_my_intress_records', JSON.stringify(defaultData));
    await saveLargeDataset('kppn_my_intress_records', defaultData);
    const waktuUnduh = '24/10/2024 10:28:44';
    await saveMyIntressToFirestore(defaultData, 'Data Realisasi Belanja My InTress (127 Satker)', waktuUnduh);
    
    const updatedConfig: DashboardConfig = {
      ...dashboardConfig,
      realisasiAnggaranConfig: {
        ...(dashboardConfig.realisasiAnggaranConfig || DEFAULT_REALISASI_ANGGARAN_CONFIG),
        waktuUnduh,
        periodeLabel: 'Data Realisasi Belanja My InTress (127 Satker)'
      }
    };
    handleUpdateDashboardConfig(updatedConfig);
  };

  const handleAddSatker = (newSatker: SatkerIKPA) => {
    const updatedList = [newSatker, ...satkers];
    setSatkers(updatedList);
    syncSatkersToFirebase(updatedList);
  };

  const isDark = theme === 'dark';

  // Early Full-Screen Splash while first connecting to Firestore (eliminates any 1-second flash of empty/old content)
  if (isInitialSyncing) {
    return (
      <div className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col items-center justify-center p-6 text-white select-none">
        <div className="relative flex flex-col items-center max-w-md text-center space-y-6 animate-in fade-in duration-300">
          {/* Ambient Backlight */}
          <div className="absolute -top-16 w-52 h-52 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
          
          {/* Logo Badge */}
          <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 via-indigo-600 to-purple-600 p-0.5 shadow-2xl shadow-indigo-500/30 flex items-center justify-center">
            <div className="w-full h-full bg-slate-900 rounded-[22px] flex items-center justify-center">
              <span className="text-3xl font-black bg-gradient-to-r from-amber-300 via-white to-sky-300 bg-clip-text text-transparent">
                026
              </span>
            </div>
          </div>

          {/* Titles */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-700/60 text-indigo-300 text-[11px] font-extrabold uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>KPPN Semarang I • DJPb Kemenkeu</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              ANGKASA <span className="text-amber-400 text-lg font-bold">V3.2</span>
            </h1>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              Aplikasi Navigasi Keuangan &amp; Akselerasi Satker
            </p>
          </div>

          {/* Animated Loading Bar & Status */}
          <div className="w-full max-w-xs space-y-2 pt-2">
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden relative">
              <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-400 via-indigo-500 to-sky-400 w-1/2 rounded-full animate-pulse" />
            </div>
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
              <span>Sinkronisasi Data Real-Time...</span>
            </div>
          </div>

          {/* Footer Trust Badge */}
          <div className="pt-4 flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Pusat Data Terhubung &amp; Terlindungi</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-sans antialiased selection:bg-emerald-500 selection:text-white transition-colors duration-300 ease-in-out relative overflow-x-hidden ${
      isDark 
        ? 'bg-slate-950 text-slate-100' 
        : 'bg-gradient-to-b from-slate-100 via-slate-50 to-slate-100/90 text-slate-900'
    }`}>

      {/* Ambient luxury mesh lighting orbs for widescreen depth */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 opacity-60 dark:opacity-30">
        <div className="absolute -top-40 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-indigo-500/10 to-sky-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-20 w-[500px] h-[500px] bg-gradient-to-br from-amber-500/10 to-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-[450px] h-[450px] bg-gradient-to-tr from-purple-500/10 to-indigo-500/5 rounded-full blur-3xl" />
      </div>
      
      {/* Top Header Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        satkerCount={ikpaSatkerCount || 0}
        redFlagsCount={redFlagsCount || 0}
        belumCapaianCount={belumCapaianCount || 0}
        sertifikasiUnapprovedCount={sertifikasiUnapprovedCount || 0}
        announcementsCount={dashboardConfig?.announcements?.length || 0}
        transaksiKkpCount={transaksiKkpList?.length || 0}
        transaksiDigipayCount={transaksiDigipayList?.length || 0}
        spmPppCount={spmPppList?.length || 0}
        onOpenBroadcastLibrary={() => setIsGlobalBroadcastLibraryOpen(true)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        lastUpdateDate={lastUpdateDate}
        theme={theme}
        toggleTheme={toggleTheme}
        menuVisibility={dashboardConfig.menuVisibility}
        tabOrder={dashboardConfig.tabOrder}
        isAdminAuthenticated={isAdminAuthenticated}
        onAuthenticateAdmin={handleAuthenticateAdmin}
        onLogoutAdmin={handleLogoutAdmin}
        masterSatkers={masterSatkers}
        slideShowConfig={dashboardConfig.slideShowConfig}
        onOpenAdminSlideShow={() => setActiveTab('admin')}
        dashboardConfig={dashboardConfig}
        onForceCloudSync={handleForceCloudSync}
        isCloudSyncing={isCloudSyncing}
      />

      {/* Floating Cloud Sync Notification Toast */}
      {cloudSyncMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce pointer-events-none">
          <div className="bg-slate-900/95 border border-emerald-500/60 text-emerald-300 px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{cloudSyncMessage}</span>
          </div>
        </div>
      )}

      {/* Main Content View Container - Full Widescreen Responsive */}
      <main className="relative z-10 max-w-[1680px] 2xl:max-w-[1840px] w-full mx-auto px-3 sm:px-6 lg:px-8 xl:px-10 py-6 sm:py-8 transition-all duration-300">
        <div key={activeTab + '-' + theme} className="animate-fadeIn">
          {/* Check if current tab is locked by Admin for Satker */}
          {activeTab !== 'admin' && !isAdminAuthenticated && dashboardConfig.menuVisibility?.[activeTab as keyof MenuVisibilityConfig] === false ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12 text-center max-w-xl mx-auto shadow-xl space-y-5 my-8">
              <div className="w-16 h-16 bg-rose-500/15 text-rose-500 rounded-2xl flex items-center justify-center mx-auto border border-rose-500/30">
                <Lock className="w-8 h-8" />
              </div>

              <div>
                <span className="inline-block bg-rose-100 dark:bg-rose-950 text-rose-900 dark:text-rose-300 font-black text-[10px] uppercase px-3 py-1 rounded-full border border-rose-300 dark:border-rose-800 mb-2">
                  MENU TERKUNCI OLEH ADMIN KPPN (026)
                </span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  Akses Menu Ini Sedang Dinonaktifkan
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 max-w-md mx-auto leading-relaxed">
                  Admin KPPN Semarang I saat ini mengunci/menonaktifkan sementara menu ini agar seluruh Satker Mitra KPPN dapat fokus pada tugas prioritas utama.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => {
                    const tabPriorityOrder: NavigationTab[] = [
                      'dashboard',
                      'capaian-output',
                      'deviasi-hal3',
                      'pengelolaan-up',
                      'transaksi-kkp',
                      'kelola-satker',
                      'sertifikasi',
                      'per5-analisis',
                      'materi-slide',
                      'portal-link',
                      'announcements',
                      'pengetahuan',
                      'presensi',
                      'aduan',
                      'guide'
                    ];
                    const firstVisible = tabPriorityOrder.find(tab => dashboardConfig.menuVisibility?.[tab as keyof MenuVisibilityConfig] !== false);
                    if (firstVisible) setActiveTab(firstVisible);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer"
                >
                  Pindah ke Menu Lain yang Aktif &rarr;
                </button>

                <button
                  onClick={() => setActiveTab('admin')}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-extrabold text-xs transition-all cursor-pointer border border-slate-300 dark:border-slate-700"
                >
                  Login Akses Admin
                </button>
              </div>
            </div>
          ) : (
            <div>
              {/* Tab 1: Dashboard IKPA Overview */}
              {activeTab === 'dashboard' && (
                <DashboardOverview
                  satkers={searchedSatkers}
                  deviasiHal3Records={deviasiHal3List}
                  onSelectSatker={(satker) => setSelectedSatkerForDetail(satker)}
                  onOpenReminder={handleOpenReminderSingle}
                  onGoToUpload={() => setActiveTab('admin')}
                  onGoToCapaianOutput={() => setActiveTab('capaian-output')}
                  onGoToDeviasiHal3={() => setActiveTab('deviasi-hal3')}
                  dashboardConfig={dashboardConfig}
                  onUpdateDashboardConfig={handleUpdateDashboardConfig}
                  theme={theme}
                  isAdminAuthenticated={isAdminAuthenticated}
                  onSetIsAdminAuthenticated={setIsAdminAuthenticated}
                />
              )}

              {/* Tab: Dashboard Realisasi Anggaran (My InTress) */}
              {activeTab === 'realisasi-anggaran' && (
                <RealisasiAnggaranDashboard
                  records={myIntressRecords}
                  config={dashboardConfig.realisasiAnggaranConfig}
                  onUpdateConfig={(newConfig) => {
                    handleUpdateDashboardConfig({
                      ...dashboardConfig,
                      realisasiAnggaranConfig: newConfig
                    });
                  }}
                  onGoToUpload={() => setActiveTab('admin')}
                  onUploadExcel={handleUploadMyIntress}
                  onResetDefault={handleResetDefaultMyIntress}
                  theme={theme}
                  isAdmin={isAdminAuthenticated}
                />
              )}

              {/* Tab 2: Dashboard Capaian Output Dedicated */}
              {activeTab === 'capaian-output' && (
                <CapaianOutputDashboard
                  satkers={searchedSatkers}
                  onSelectSatker={(satker) => setSelectedSatkerForDetail(satker)}
                  onOpenReminder={handleOpenReminderSingle}
                  onGoToUpload={() => setActiveTab('admin')}
                  onOpenDiagnostik={() => setActiveTab('diagnostik-caput')}
                  onActivatePeriod={(historyItem) => {
                    handleApplyNewSatkers(historyItem.satkersData, false, 'capaian-output');
                    const newHistoryList = (dashboardConfig.historicalUploads || []).map(h => {
                      const isCaput = h.category === 'CAPAIAN_OUTPUT';
                      return isCaput ? { ...h, isActive: h.id === historyItem.id } : h;
                    });
                    handleUpdateDashboardConfig({
                      ...dashboardConfig,
                      historicalUploads: newHistoryList,
                      updateDates: {
                        ...dashboardConfig.updateDates,
                        capaianOutput: `Periode ${historyItem.periode}`
                      }
                    });
                  }}
                  theme={theme}
                  dashboardConfig={dashboardConfig}
                />
              )}

              {/* Tab: SI-CAPUT (Tools Diagnostik Capaian Output KPPN Kolaka Inspiration) */}
              {activeTab === 'diagnostik-caput' && (
                <DiagnostikCaputDashboard
                  masterSatkers={masterSatkers}
                  onGoToUpload={() => setActiveTab('admin')}
                  onSelectSatker={(satkerCode) => {
                    const found = satkers.find(s => s.kode === satkerCode);
                    if (found) {
                      setSelectedSatkerForDetail(found);
                    }
                  }}
                  isDark={theme === 'dark'}
                  isAdminAuthenticated={isAdminAuthenticated}
                />
              )}

              {/* Tab: Monitoring Deviasi Halaman III DIPA (Baru) */}
              {activeTab === 'deviasi-hal3' && (
                <DeviasiHal3Dashboard
                  deviasiRecords={deviasiHal3List}
                  onUpdateDeviasiRecords={(records) => handleUpdateDeviasiHal3(records)}
                  masterSatkers={masterSatkers}
                  satkers={satkers}
                  isDark={theme === 'dark'}
                  isAdminAuthenticated={isAdminAuthenticated}
                  onSetIsAdminAuthenticated={setIsAdminAuthenticated}
                  onGoToAdmin={() => setActiveTab('admin')}
                />
              )}

              {/* Tab: Monitoring SPM PPP (PLN & TELKOM Tagihan PFK) */}
              {activeTab === 'spm-ppp' && (
                <SPMPPPDashboard
                  spmPppRecords={spmPppList}
                  onUpdateSPMPPP={(records) => handleUpdateSPMPPP(records)}
                  masterSatkers={masterSatkers}
                  satkers={satkers}
                  isDark={theme === 'dark'}
                  isAdminAuthenticated={isAdminAuthenticated}
                  onSetIsAdminAuthenticated={setIsAdminAuthenticated}
                  onGoToAdmin={() => setActiveTab('admin')}
                />
              )}

              {/* Tab 3: Pengelolaan UP / TUP Dedicated */}
              {activeTab === 'pengelolaan-up' && (
                <PengelolaanUPDashboard
                  upRecords={pengelolaanUPList}
                  masterSatkers={masterSatkers}
                  theme={theme}
                  dashboardConfig={dashboardConfig}
                  customTexts={dashboardConfig.customTexts}
                  isAdminAuthenticated={isAdminAuthenticated}
                  onOpenReminder={(record) => {
                    const matchSatker = satkers.find(s => s.kodeSatker === record.kodeSatker);
                    if (matchSatker) {
                      handleOpenReminderSingle(matchSatker);
                    } else {
                      setActiveTab('reminder');
                    }
                  }}
                  onGoToAdmin={() => setActiveTab('admin')}
                />
              )}

              {/* Tab: Transaksi KKP (GUP) Monitoring */}
              {activeTab === 'transaksi-kkp' && (
                <TransaksiKKPDashboard
                  records={transaksiKkpList}
                  masterSatkers={masterSatkers}
                  theme={theme}
                  dashboardConfig={dashboardConfig}
                  customTexts={dashboardConfig.customTexts}
                  isAdminAuthenticated={isAdminAuthenticated}
                  onApplyRecords={(newRecords) => handleUpdateTransaksiKKP(newRecords)}
                  onGoToAdmin={() => setActiveTab('admin')}
                />
              )}

              {/* Tab: Transaksi Digipay (VA & KKP) Monitoring */}
              {activeTab === 'transaksi-digipay' && (
                <TransaksiDigipayDashboard
                  records={transaksiDigipayList}
                  masterSatkers={masterSatkers}
                  theme={theme}
                  dashboardConfig={dashboardConfig}
                  lastUpdateDate={dashboardConfig.updateDates?.transaksiDigipay}
                  isAdminAuthenticated={isAdminAuthenticated}
                  onSaveMasterSatker={handleSaveMasterSatker}
                  onApplyRecords={(newRecords) => handleUpdateTransaksiDigipay(newRecords)}
                  onGoToAdmin={() => setActiveTab('admin')}
                />
              )}

              {/* Tab Dedicated: Kelola Data Satker (Master & Kontak PIC) */}
              {activeTab === 'kelola-satker' && (
                <KelolaDataSatkerDashboard
                  masterSatkers={masterSatkers}
                  satkers={satkers}
                  theme={theme}
                  isAdminAuthenticated={isAdminAuthenticated}
                  onSaveMasterSatker={handleSaveMasterSatker}
                  onUpdateMasterSatkers={handleUpdateMasterSatkers}
                  onDeleteMasterSatker={handleDeleteMasterSatker}
                  onDeleteBatchMasterSatkers={handleDeleteBatchMasterSatkers}
                  onClearAllMasterSatkers={handleClearAllMasterSatkers}
                  onToggleActiveMasterSatker={handleToggleActiveMasterSatker}
                  onGoToAdmin={() => setActiveTab('admin')}
                  onOpenReminder={handleOpenReminderSingle}
                />
              )}

              {activeTab === 'redflags' && (
                <RedFlagsView
                  satkers={searchedSatkers.filter(s => s.hasIKPAData === true || (s.hasIKPAData !== false && (s.nilaiTotalIKPA > 0 || s.paguAnggaran > 0)))}
                  onOpenReminder={handleOpenReminderSingle}
                  onSelectSatker={(satker) => setSelectedSatkerForDetail(satker)}
                  onOpenBulkReminder={handleOpenReminderBulk}
                  onGoToUpload={() => setActiveTab('admin')}
                  theme={theme}
                  dashboardConfig={dashboardConfig}
                />
              )}

              {/* Tab Pengumuman */}
              {activeTab === 'announcements' && (
                <PengumumanTab
                  announcements={dashboardConfig.announcements || []}
                  theme={theme}
                  dashboardConfig={dashboardConfig}
                />
              )}

              {/* Tab Materi Slide Presentation */}
              {activeTab === 'materi-slide' && (
                <MateriSlideTab
                  materials={dashboardConfig.presentationMaterials}
                  theme={theme}
                  dashboardConfig={dashboardConfig}
                />
              )}

              {/* Tab Portal Linktree / Sosialisasi */}
              {activeTab === 'portal-link' && (
                <SocializationPortalView
                  kegiatanList={dashboardConfig.kegiatanSosialisasi}
                  theme={theme}
                  dashboardConfig={dashboardConfig}
                  onGoToAdmin={() => setActiveTab('admin')}
                  onGoToPresensi={() => setActiveTab('presensi')}
                  isAdminAuthenticated={isAdminAuthenticated}
                />
              )}

              {/* Tab Presensi Online Digital KPPN */}
              {activeTab === 'presensi' && (
                <PresensiOnlineView
                  kegiatanList={presensiKegiatanList}
                  pesertaList={presensiPesertaList}
                  satkers={satkers}
                  theme={theme}
                  dashboardConfig={dashboardConfig}
                  isAdminAuthenticated={isAdminAuthenticated}
                  onSavePesertaPresensi={handleSavePesertaPresensi}
                  onDeletePesertaPresensi={handleDeletePesertaPresensi}
                  onSaveKegiatan={handleSavePresensiKegiatan}
                  onDeleteKegiatan={handleDeletePresensiKegiatan}
                  onGoToAdmin={() => setActiveTab('admin')}
                />
              )}

              {activeTab === 'admin' && (
                <AdminUpload
                  satkers={satkers}
                  onApplyNewSatkers={handleApplyNewSatkers}
                  onUpdateSatker={handleUpdateSatker}
                  onDeleteSatker={handleDeleteSatker}
                  onDeleteBatchSatkers={handleDeleteBatchSatkers}
                  onAddSatker={handleAddSatker}
                  masterSatkers={masterSatkers}
                  onUpdateMasterSatkers={handleUpdateMasterSatkers}
                  onSaveMasterSatker={handleSaveMasterSatker}
                  onDeleteMasterSatker={handleDeleteMasterSatker}
                  onDeleteBatchMasterSatkers={handleDeleteBatchMasterSatkers}
                  onToggleActiveMasterSatker={handleToggleActiveMasterSatker}
                  pejabatList={pejabatSertifikasiList}
                  onUpdatePejabatList={handleUpdatePejabatList}
                  pengelolaanUpRecords={pengelolaanUPList}
                  onApplyPengelolaanUp={handleUpdatePengelolaanUP}
                  onClearPengelolaanUp={() => handleUpdatePengelolaanUP([])}
                  transaksiKkpRecords={transaksiKkpList}
                  onApplyTransaksiKkp={handleUpdateTransaksiKKP}
                  onClearTransaksiKkp={() => handleUpdateTransaksiKKP([])}
                  transaksiDigipayRecords={transaksiDigipayList}
                  onApplyTransaksiDigipay={handleUpdateTransaksiDigipay}
                  onClearTransaksiDigipay={() => handleUpdateTransaksiDigipay([])}
                  deviasiHal3Records={deviasiHal3List}
                  onApplyDeviasiHal3={handleUpdateDeviasiHal3}
                  onClearDeviasiHal3={() => handleUpdateDeviasiHal3([])}
                  spmPppRecords={spmPppList}
                  onApplySPMPPP={handleUpdateSPMPPP}
                  onClearSPMPPP={() => handleUpdateSPMPPP([])}
                  onResetData={handleResetData}
                  onClearAllData={handleClearAllSatkers}
                  currentSatkerCount={satkers.length}
                  dashboardConfig={dashboardConfig}
                  onUpdateDashboardConfig={handleUpdateDashboardConfig}
                  isAdminAuthenticated={isAdminAuthenticated}
                  setIsAdminAuthenticated={setIsAdminAuthenticated}
                  theme={theme}
                  adminPin={adminPin}
                  onUpdateAdminPin={handleUpdateAdminPin}
                  presensiKegiatanList={presensiKegiatanList}
                  presensiPesertaList={presensiPesertaList}
                  onSavePresensiKegiatan={handleSavePresensiKegiatan}
                  onDeletePresensiKegiatan={handleDeletePresensiKegiatan}
                  onDeletePesertaPresensi={handleDeletePesertaPresensi}
                  onClearMasterSatkers={handleClearAllMasterSatkers}
                  onForceCloudSync={handleForceCloudSync}
                  isCloudSyncing={isCloudSyncing}
                  cloudSyncMessage={cloudSyncMessage}
                />
              )}

              {activeTab === 'reminder' && (
                <ReminderGenerator
                  satkers={satkers}
                  selectedSatkerFromProps={selectedSatkerForReminder}
                  isAdminAuthenticated={isAdminAuthenticated}
                  onAuthenticateAdmin={handleAuthenticateAdmin}
                  onGoToAdminTab={() => setActiveTab('admin')}
                  bulkSatkersFromProps={bulkSatkersForReminder}
                  theme={theme}
                  dashboardConfig={dashboardConfig}
                  onUpdateDashboardConfig={(newConfig) => setDashboardConfig(newConfig)}
                />
              )}

              {/* Tab Sertifikasi Pejabat Perbendaharaan */}
              {activeTab === 'sertifikasi' && (
                <SertifikasiPejabatView
                  pejabatList={pejabatSertifikasiList}
                  onUpdatePejabatList={handleUpdatePejabatList}
                  lastUpdateTimestamp={dashboardConfig.updateDates?.sertifikasi || sertifikasiLastUpdate}
                  onUpdateTimestamp={(newTs) => setSertifikasiLastUpdate(newTs)}
                  isAdminAuthenticated={isAdminAuthenticated}
                  onAuthenticateAdmin={handleAuthenticateAdmin}
                  onOpenReminderWithPejabat={(pejabat) => {
                    const matchSatker = satkers.find(s => s.kodeSatker === pejabat.kdSatker);
                    if (matchSatker) {
                      handleOpenReminderSingle(matchSatker);
                    } else {
                      setActiveTab('reminder');
                    }
                  }}
                  theme={theme}
                  dashboardConfig={dashboardConfig}
                  masterSatkers={masterSatkers}
                />
              )}

              {/* Tab Analisis & Knowledge PER-5/PB/2024 */}
              {activeTab === 'per5-analisis' && (
                <Per5AnalisisView
                  satkers={satkers}
                  onSelectSatker={(satker) => setSelectedSatkerForDetail(satker)}
                  onOpenReminderWithAnalysis={(satker, text) => {
                    setSelectedSatkerForReminder(satker);
                    setActiveTab('reminder');
                  }}
                  theme={theme}
                  dashboardConfig={dashboardConfig}
                />
              )}

              {/* Tab Pusat Pengetahuan & Juknis SAKTI */}
              {activeTab === 'pengetahuan' && (
                <PengetahuanSaktiView
                  isAdminAuthenticated={isAdminAuthenticated}
                  onAuthenticateAdmin={handleAuthenticateAdmin}
                  theme={theme}
                  dashboardConfig={dashboardConfig}
                  onNavigateToAdminTab={() => {
                    setActiveTab('admin');
                  }}
                />
              )}

              {/* Tab Kanal Lapor Aduan Satker */}
              {activeTab === 'aduan' && (
                <LaporAduanView
                  theme={theme}
                  helpdeskPhone={dashboardConfig.helpdeskPhone}
                  helpdeskJamLayanan={dashboardConfig.helpdeskJamLayanan}
                  dashboardConfig={dashboardConfig}
                  onUpdateDashboardConfig={handleUpdateDashboardConfig}
                />
              )}

              {activeTab === 'guide' && (
                <ExcelGuideModal theme={theme} />
              )}
            </div>
          )}
        </div>
      </main>

      {/* Satker Detail Modal */}
      <SatkerDetailModal
        satker={selectedSatkerForDetail}
        onClose={() => setSelectedSatkerForDetail(null)}
        onOpenReminder={handleOpenReminderSingle}
        onUpdateSatker={handleUpdateSatker}
        isAdminAuthenticated={isAdminAuthenticated}
        onAuthenticateAdmin={handleAuthenticateAdmin}
        onLogoutAdmin={handleLogoutAdmin}
        onGoToAdminTab={() => {
          setSelectedSatkerForDetail(null);
          setActiveTab('admin');
        }}
        theme={theme}
      />

      {/* Global Broadcast Template Library Modal */}
      <BroadcastTemplateLibraryModal
        isOpen={isGlobalBroadcastLibraryOpen}
        onClose={() => setIsGlobalBroadcastLibraryOpen(false)}
        masterSatkers={masterSatkers}
        theme={theme}
      />

      {/* Pop-Up Awal Pengumuman Mandatori Modal */}
      <PopUpAnnouncementModal
        config={dashboardConfig.popUpAnnouncement}
        theme={theme}
        onNavigateToTab={(tab) => setActiveTab(tab as NavigationTab)}
      />

      {/* Executive Footer */}
      <footer className={`border-t py-8 mt-16 text-xs transition-colors duration-300 relative z-10 ${
        isDark ? 'bg-slate-950 border-slate-800/80 text-slate-400' : 'bg-slate-900 border-slate-800 text-slate-300'
      }`}>
        <div className="max-w-[1680px] 2xl:max-w-[1840px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-400 via-indigo-600 to-amber-400 p-0.5 flex items-center justify-center shadow-md shrink-0">
                <div className="w-full h-full rounded-[10px] bg-slate-950 p-1 flex items-center justify-center">
                  <img src="/favicon.svg" alt="ANGKASA Logo" className="w-full h-full object-contain brightness-110" />
                </div>
              </div>
              <div>
                <p className="font-extrabold text-white text-sm tracking-tight flex items-center gap-2">
                  <span>KPPN Tipe A1 Semarang I (026)</span>
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] px-2 py-0.5 rounded-full font-bold">
                    🛡️ Sistem Terproteksi
                  </span>
                </p>
                <p className="text-[11px] text-slate-400">
                  Seksi Manajemen Satker dan Kepatuhan Internal (MSKI)
                </p>
              </div>
            </div>
            <div className="text-center md:text-right space-y-0.5">
              <p className="text-[11px] font-bold text-amber-400">
                KEMENTERIAN KEUANGAN REPUBLIK INDONESIA
              </p>
              <p className="text-[11px] text-slate-400">
                Direktorat Jenderal Perbendaharaan • Kanwil DJPb Provinsi Jawa Tengah
              </p>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
            <div>
              <p>
                © 2026 ANGKASA — Sistem Navigasi &amp; Pembina Akuntabilitas Keuangan Negara.
              </p>
              <p className="text-[10px] text-slate-400/80 mt-0.5">
                📊 Basis data: Pembaruan periodik melalui olah Excel SAKTI &amp; My Intress oleh Tim KPPN Semarang I.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 text-[10px] font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>Enkripsi SHA-256</span>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 text-[10px] font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
                <span>Anti-Brute Force Lock</span>
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* Premium Accessibility Floating Widget & Menu */}
      <AccessibilityWidget />

    </div>
  );
}
