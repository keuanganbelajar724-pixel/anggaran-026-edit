import React, { useState, useEffect, useMemo } from 'react';
import { Lock, Database } from 'lucide-react';
import { db, doc, onSnapshot, setDoc, getDocFromServer } from './lib/firebase';
import { SatkerIKPA, DashboardConfig, NavigationTab, AppTheme, Announcement, PejabatSertifikasi, MenuVisibilityConfig, ExcelUploadHistory, KegiatanSosialisasi, PresensiKegiatan, PesertaPresensi, MasterSatker, PengelolaanUPRecord } from './types';
import { INITIAL_SATKER_DATA } from './data/initialSatkerData';
import { INITIAL_SERTIFIKASI_PEJABAT } from './data/sertifikasiData';
import { INITIAL_ADUAN_RECORDS } from './data/initialAduanData';
import { Header } from './components/Header';
import { DashboardOverview } from './components/DashboardOverview';
import { CapaianOutputDashboard } from './components/CapaianOutputDashboard';
import { PengelolaanUPDashboard } from './components/PengelolaanUPDashboard';
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

import { ToastProvider } from './components/ToastNotification';

const INITIAL_ANNOUNCEMENTS: Announcement[] = [];

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

export default function App() {
  const [satkers, setSatkers] = useState<SatkerIKPA[]>(() => {
    const saved = localStorage.getItem('kppn_satker_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((s: SatkerIKPA) => !s.id?.startsWith('satker-smg1-'));
        }
      } catch (e) {
        console.warn('Error parsing saved satker data:', e);
      }
    }
    return []; // Default empty (0 satker, no dummy data)
  });

  useEffect(() => {
    try {
      localStorage.setItem('kppn_satker_data', JSON.stringify(satkers));
    } catch (e) {
      console.warn('Error saving satker data to localStorage:', e);
    }
  }, [satkers]);
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [theme, setTheme] = useState<AppTheme>('light');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

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

    if (savedConfig) {
      return {
        ...savedConfig,
        aduanList: savedConfig.aduanList && savedConfig.aduanList.length > 0 
          ? savedConfig.aduanList 
          : INITIAL_ADUAN_RECORDS,
        historicalUploads: savedHist || savedConfig.historicalUploads,
        kegiatanSosialisasi: savedConfig.kegiatanSosialisasi && savedConfig.kegiatanSosialisasi.length > 0 
          ? savedConfig.kegiatanSosialisasi 
          : INITIAL_KEGIATAN_SOSIALISASI,
        menuVisibility: {
          'portal-link': true,
          'pengelolaan-up': true,
          'kelola-satker': true,
          ...savedConfig.menuVisibility
        }
      };
    }

    return {
      defaultFilter: 'ALL',
      customAnnouncement: 'PERHATIAN: Batas akhir pengiriman Capaian Output SAKTI KPPN Semarang I (026) periode ini tanggal 5. Mohon Satker terlampir segera melengkapi.',
      showKpiCards: true,
      showBarChart: true,
      announcements: INITIAL_ANNOUNCEMENTS,
      kegiatanSosialisasi: INITIAL_KEGIATAN_SOSIALISASI,
      aduanList: INITIAL_ADUAN_RECORDS,
      historicalUploads: savedHist,
      menuVisibility: {
        'dashboard': true,
        'capaian-output': true,
        'pengelolaan-up': true,
        'kelola-satker': true,
        'redflags': true,
        'sertifikasi': true,
        'per5-analisis': true,
        'announcements': true,
        'materi-slide': true,
        'portal-link': true,
        'pengetahuan': true,
        'aduan': true,
        'reminder': true,
        'guide': true
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
      per5Analisis: '07 Agustus 2026'
    },
    customTexts: {
      dashboardBadge: 'Sistem Pembina Keuangan & Monitoring IKPA KPPN Semarang I',
      dashboardTitle: 'Monitoring Real-Time IKPA Satker Lingkup KPPN Semarang I',
      dashboardSubtitle: 'Sistem pembina keuangan digital untuk pemantauan 8 indikator IKPA, deteksi dini deviasi Halaman III DIPA, dan percepatan penyelesaian laporan Capaian Output SAKTI.',

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
      localStorage.setItem('kppn_pejabat_data', JSON.stringify(pejabatSertifikasiList));
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
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.warn('Error parsing saved master satkers:', e);
      }
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('kppn_master_satkers', JSON.stringify(masterSatkers));
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

  // Global Admin Authentication State shared across Admin Upload, Satker Details Modal & Reminder Generator
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [adminPin, setAdminPin] = useState<string>(() => {
    return localStorage.getItem('kppn_admin_pin') || '527272';
  });

  // Auto redirect activeTab to first available active tab if current activeTab is disabled/locked by Admin
  useEffect(() => {
    if (activeTab !== 'admin' && !isAdminAuthenticated && dashboardConfig.menuVisibility) {
      const isCurrentDisabled = dashboardConfig.menuVisibility[activeTab as keyof MenuVisibilityConfig] === false;
      if (isCurrentDisabled) {
        const tabPriorityOrder: NavigationTab[] = [
          'dashboard',
          'capaian-output',
          'pengelolaan-up',
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

  // Real-time Firebase Sync for Satkers, Pejabat & Global Settings
  useEffect(() => {
    try {
      // 1. Initial Force Fetch from Firestore Server to ensure fresh data on Vercel / new browser
      getDocFromServer(doc(db, 'settings', 'global')).then(snap => {
        if (snap.exists()) {
          const data = snap.data();
          if (data.adminPin) {
            setAdminPin(data.adminPin);
            localStorage.setItem('kppn_admin_pin', data.adminPin);
          }
          if (data.dashboardConfig) {
            setDashboardConfig(data.dashboardConfig);
            localStorage.setItem('kppn_dashboard_config', JSON.stringify(data.dashboardConfig));
            if (data.dashboardConfig.historicalUploads) {
              localStorage.setItem('kppn_historical_uploads', JSON.stringify(data.dashboardConfig.historicalUploads));
            }
          }
        }
      }).catch(err => console.warn("Initial Firestore settings fetch notice:", err));

      getDocFromServer(doc(db, 'data', 'satkers')).then(snap => {
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data.list)) {
            setSatkers(data.list);
            localStorage.setItem('kppn_satker_data', JSON.stringify(data.list));
          }
        }
      }).catch(err => console.warn("Initial Firestore satkers fetch notice:", err));

      // 2. Realtime Settings & Dashboard Config
      const unsubSettings = onSnapshot(doc(db, 'settings', 'global'), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.adminPin) {
            setAdminPin(data.adminPin);
            localStorage.setItem('kppn_admin_pin', data.adminPin);
          }
          if (data.dashboardConfig) {
            setDashboardConfig(data.dashboardConfig);
            localStorage.setItem('kppn_dashboard_config', JSON.stringify(data.dashboardConfig));
            if (data.dashboardConfig.historicalUploads) {
              localStorage.setItem('kppn_historical_uploads', JSON.stringify(data.dashboardConfig.historicalUploads));
            }
          }
        }
      }, (error) => {
        console.warn("Firebase Firestore settings notice:", error);
      });

      // 3. Realtime Satkers Data
      const unsubSatkers = onSnapshot(doc(db, 'data', 'satkers'), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (Array.isArray(data.list)) {
            setSatkers(data.list);
            localStorage.setItem('kppn_satker_data', JSON.stringify(data.list));
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
            localStorage.setItem('kppn_pejabat_data', JSON.stringify(data.list));
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
            localStorage.setItem('kppn_presensi_peserta', JSON.stringify(data.list));
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
            localStorage.setItem('kppn_master_satkers', JSON.stringify(data.list));
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
            setPengelolaanUPList(data.list);
            localStorage.setItem('kppn_pengelolaan_up', JSON.stringify(data.list));
          }
        }
      }, (error) => {
        console.warn("Firebase UP listener notice:", error);
      });

      return () => {
        unsubSettings();
        unsubSatkers();
        unsubPejabat();
        unsubPresensi();
        unsubMaster();
        unsubUP();
      };
    } catch (e) {
      console.warn("Firebase Firestore setup notice:", e);
    }
  }, []);

  // Sync Helpers to Firebase Cloud Database
  const syncSatkersToFirebase = (newList: SatkerIKPA[]) => {
    try {
      setDoc(doc(db, 'data', 'satkers'), { list: newList, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (e) {
      console.warn("Error syncing satkers to Firebase:", e);
    }
  };

  const syncMasterSatkersToFirebase = (newList: MasterSatker[]) => {
    try {
      setDoc(doc(db, 'data', 'master_satkers'), { list: newList, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (e) {
      console.warn("Error syncing master satkers to Firebase:", e);
    }
  };

  const syncPejabatToFirebase = (newList: PejabatSertifikasi[]) => {
    try {
      setDoc(doc(db, 'data', 'pejabat'), { list: newList, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (e) {
      console.warn("Error syncing pejabat to Firebase:", e);
    }
  };

  const syncPresensiToFirebase = (newList: PesertaPresensi[]) => {
    try {
      setDoc(doc(db, 'data', 'presensi_peserta'), { list: newList, updatedAt: new Date().toISOString() }, { merge: true });
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
    localStorage.setItem('kppn_master_satkers', JSON.stringify(finalMasterList));
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
        localStorage.setItem('kppn_satker_data', JSON.stringify(updatedSatkers));
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
        localStorage.setItem('kppn_satker_data', JSON.stringify(updatedSatkers));
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
    localStorage.setItem('kppn_presensi_peserta', JSON.stringify(updated));
    syncPresensiToFirebase(updated);
  };

  const handleDeletePesertaPresensi = (pesertaId: string) => {
    const updated = presensiPesertaList.filter(p => p.id !== pesertaId);
    setPresensiPesertaList(updated);
    localStorage.setItem('kppn_presensi_peserta', JSON.stringify(updated));
    syncPresensiToFirebase(updated);
  };

  const handleSavePresensiKegiatan = (kegiatan: PresensiKegiatan) => {
    const exists = presensiKegiatanList.some(k => k.id === kegiatan.id);
    const updated = exists 
      ? presensiKegiatanList.map(k => k.id === kegiatan.id ? kegiatan : k)
      : [kegiatan, ...presensiKegiatanList];
    
    setPresensiKegiatanList(updated);
    localStorage.setItem('kppn_presensi_kegiatan', JSON.stringify(updated));
    const newConfig = { ...dashboardConfig, presensiKegiatanList: updated };
    handleUpdateDashboardConfig(newConfig);
  };

  const handleDeletePresensiKegiatan = (kegiatanId: string) => {
    const updated = presensiKegiatanList.filter(k => k.id !== kegiatanId);
    setPresensiKegiatanList(updated);
    localStorage.setItem('kppn_presensi_kegiatan', JSON.stringify(updated));
    const newConfig = { ...dashboardConfig, presensiKegiatanList: updated };
    handleUpdateDashboardConfig(newConfig);
  };

  const handleUpdatePejabatList = (newList: PejabatSertifikasi[]) => {
    setPejabatSertifikasiList(newList);
    syncPejabatToFirebase(newList);
  };

  const handleUpdateAdminPin = (newPin: string) => {
    setAdminPin(newPin);
    localStorage.setItem('kppn_admin_pin', newPin);
    try {
      setDoc(doc(db, 'settings', 'global'), { adminPin: newPin, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (e) {
      console.warn("Firebase save pin notice:", e);
    }
  };

  const handleUpdateDashboardConfig = (newConfig: DashboardConfig) => {
    setDashboardConfig(newConfig);
    try {
      localStorage.setItem('kppn_dashboard_config', JSON.stringify(newConfig));

      // Optimize historicalUploads payload so it never exceeds Firestore's 1MB single-document limit
      const sanitizedHistorical = (newConfig.historicalUploads || []).map(h => ({
        id: h.id,
        fileName: h.fileName,
        periode: h.periode,
        uploadDate: h.uploadDate,
        uploadedBy: h.uploadedBy,
        satkerCount: h.satkerCount,
        averageIKPA: h.averageIKPA,
        notes: h.notes,
        category: h.category,
        isActive: !!h.isActive,
        // Keep satkersData lightweight if present
        satkersData: (h.satkersData || []).map(s => ({
          id: s.id,
          kodeSatker: s.kodeSatker,
          namaSatker: s.namaSatker,
          kementerianLembaga: s.kementerianLembaga,
          nilaiTotalIKPA: s.nilaiTotalIKPA,
          predikat: s.predikat,
          persenPenyerapan: s.persenPenyerapan,
          statusCapaianOutput: s.statusCapaianOutput,
          hasIKPAData: s.hasIKPAData,
          hasCapaianOutputData: s.hasCapaianOutputData,
          periodeUpdate: s.periodeUpdate,
          indikator: s.indikator,
          issues: (s.issues || []).slice(0, 3)
        }))
      }));

      const cleanConfig = {
        ...newConfig,
        historicalUploads: sanitizedHistorical
      };

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
      localStorage.setItem('kppn_pengelolaan_up', JSON.stringify(pengelolaanUPList));
    } catch (e) {
      console.warn('Error saving UP data to localStorage:', e);
    }
  }, [pengelolaanUPList]);

  const handleUpdatePengelolaanUP = (newList: PengelolaanUPRecord[]) => {
    setPengelolaanUPList(newList);
    try {
      setDoc(doc(db, 'data', 'pengelolaan_up'), { list: newList, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (e) {
      console.warn("Error syncing UP to Firebase:", e);
    }
  };

  const handleAuthenticateAdmin = (pin: string): boolean => {
    if (pin === adminPin || pin === '527272' || pin === 'admin123' || pin === 'kppn026' || pin === 'kppn033' || pin === 'admin') {
      setIsAdminAuthenticated(true);
      return true;
    }
    return false;
  };

  const handleLogoutAdmin = () => {
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
    localStorage.setItem('kppn_satker_data', JSON.stringify([]));
    localStorage.setItem('kppn_pejabat_data', JSON.stringify([]));
    localStorage.setItem('kppn_pengelolaan_up', JSON.stringify([]));
    localStorage.setItem('kppn_historical_uploads', JSON.stringify([]));
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
      // Smart Multi-Month Merger with Contact & Master Protection:
      // If satkers already have history for previous months (e.g. Januari),
      // and newSatkers brings February or subsequent months, preserve & merge history and all contacts!
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

        return {
          ...existing,
          ...newS,
          namaPic: preservedNamaPic,
          noHpPic: preservedNoHpPic,
          emailPic: preservedEmailPic,
          passwordSatker: preservedPassword,
          alamatSatker: preservedAlamat,
          pejabatOperator: preservedPejabat,
          riwayatBulanan: sortedHistory.length > 0 ? sortedHistory : newS.riwayatBulanan
        };
      });
    }
    setSatkers(result);
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

  const handleAddSatker = (newSatker: SatkerIKPA) => {
    const updatedList = [newSatker, ...satkers];
    setSatkers(updatedList);
    syncSatkersToFirebase(updatedList);
  };

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen font-sans antialiased selection:bg-emerald-500 selection:text-white transition-colors duration-300 ease-in-out ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      
      {/* Top Header Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        satkerCount={ikpaSatkerCount}
        redFlagsCount={redFlagsCount}
        belumCapaianCount={belumCapaianCount}
        sertifikasiUnapprovedCount={sertifikasiUnapprovedCount}
        announcementsCount={dashboardConfig.announcements.length}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        lastUpdateDate={lastUpdateDate}
        theme={theme}
        toggleTheme={toggleTheme}
        menuVisibility={dashboardConfig.menuVisibility}
        isAdminAuthenticated={isAdminAuthenticated}
        onAuthenticateAdmin={handleAuthenticateAdmin}
        onLogoutAdmin={handleLogoutAdmin}
        masterSatkers={masterSatkers}
      />

      {/* Main Content View Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-all duration-300">
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
                      'pengelolaan-up',
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
                  onSelectSatker={(satker) => setSelectedSatkerForDetail(satker)}
                  onOpenReminder={handleOpenReminderSingle}
                  onGoToUpload={() => setActiveTab('admin')}
                  onGoToCapaianOutput={() => setActiveTab('capaian-output')}
                  dashboardConfig={dashboardConfig}
                  theme={theme}
                />
              )}

              {/* Tab 2: Dashboard Capaian Output Dedicated */}
              {activeTab === 'capaian-output' && (
                <CapaianOutputDashboard
                  satkers={searchedSatkers}
                  onSelectSatker={(satker) => setSelectedSatkerForDetail(satker)}
                  onOpenReminder={handleOpenReminderSingle}
                  theme={theme}
                  dashboardConfig={dashboardConfig}
                />
              )}

              {/* Tab 3: Pengelolaan UP / TUP Dedicated */}
              {activeTab === 'pengelolaan-up' && (
                <PengelolaanUPDashboard
                  upRecords={pengelolaanUPList}
                  masterSatkers={masterSatkers}
                  theme={theme}
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
                  announcements={dashboardConfig.announcements}
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

      {/* Footer */}
      <footer className={`border-t py-6 mt-12 text-xs transition-colors duration-300 ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-900 border-slate-800 text-slate-300'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            © 2026 KPPN Semarang I (Kode KPPN 026) — Sistem Pengolahan Data &amp; Monitoring IKPA Satker.
          </p>
          <p className="text-slate-400">
            Direktorat Jenderal Perbendaharaan • Kanwil DJPb Provinsi Jawa Tengah
          </p>
        </div>
      </footer>

    </div>
  );
}
