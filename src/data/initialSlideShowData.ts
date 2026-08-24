import { SlideShowConfig } from '../types';

export const INITIAL_SLIDESHOW_CONFIG: SlideShowConfig = {
  isEnabled: true,
  autoPlay: true,
  intervalSeconds: 6,
  aspectRatioMode: 'responsive',
  showOnTabs: ['ALL'],
  pauseOnHover: true,
  slides: [
    {
      id: 'slide-akselerasi-ikpa-utama',
      title: 'Akselerasi IKPA & Capaian Output SAKTI',
      subtitle: 'Monitoring Kinerja Pelaksanaan Anggaran & Kepatuhan Konfirmasi Capaian Output Satker Mitra KPPN Semarang I',
      badge: 'MONITORING REAL-TIME',
      imageUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1920&q=80',
      eventDate: 'Periode Berjalan 2026',
      eventTime: '08.00 - 16.00 WIB',
      eventLocation: 'KPPN Semarang I • Seksi MSKI',
      linkUrl: 'https://anggaran-026.my.id',
      linkLabel: 'Lihat Evaluasi & Data',
      targetTabs: ['ALL'],
      isActive: true,
      order: 1,
      createdAt: '2026-08-24'
    },
    {
      id: 'slide-revolving-up-tup',
      title: 'Petunjuk Teknis Batas 30 Hari Revolving GUP & TUP',
      subtitle: 'Tertib Administrasi Pengelolaan Uang Persediaan dan Akselerasi Penggunaan Kartu Kredit Pemerintah (KKP)',
      badge: 'PANDUAN PERBENDAHARAAN',
      imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1920&q=80',
      eventDate: 'Update Harian',
      eventTime: 'Layanan Aktif',
      eventLocation: 'Helpdesk KPPN Semarang I',
      linkUrl: 'https://anggaran-026.my.id',
      linkLabel: 'Pelajari Juknis',
      targetTabs: ['ALL'],
      isActive: true,
      order: 2,
      createdAt: '2026-08-24'
    }
  ]
};
