import { SlideShowConfig } from '../types';

export const INITIAL_SLIDESHOW_CONFIG: SlideShowConfig = {
  isEnabled: true,
  autoPlay: true,
  intervalSeconds: 5,
  aspectRatioMode: 'responsive',
  showOnTabs: ['ALL'],
  pauseOnHover: true,
  slides: [
    {
      id: 'slide-ramadhan-1446h',
      title: 'Spectrum Ramadhan 1446 H',
      subtitle: 'Meningkatkan Iman, Taqwa, dan Ukhuwah untuk Menggapai Maghfirah',
      badge: 'EVENT',
      imageUrl: 'https://images.unsplash.com/photo-1591604466107-ec97de577aff?auto=format&fit=crop&w=1920&q=80',
      eventDate: 'Jumat, 21 Februari 2025',
      eventTime: '09.30 s.d 12.15 WIB',
      eventLocation: 'Zoom ID: 432 277 387 738 (pass: iu63Po97) • MT. Tazkiyatun Nufus',
      linkUrl: 'https://zoom.us',
      linkLabel: 'Gabung Zoom Acara',
      targetTabs: ['ALL'],
      isActive: true,
      order: 1,
      createdAt: '2026-08-22'
    },
    {
      id: 'slide-sosialisasi-ikpa',
      title: 'Akselerasi IKPA & Pengelolaan UP/TUP KPPN Semarang I',
      subtitle: 'Petunjuk Teknis Batas Waktu 30 Hari Revolving GUP & Monitoring Sertifikasi Pejabat Perbendaharaan',
      badge: 'SOSIALISASI RESMI',
      imageUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1920&q=80',
      eventDate: 'Selasa, 25 Agustus 2026',
      eventTime: '08.30 - 12.00 WIB',
      eventLocation: 'Ruang Aula KPPN Semarang I / Hybrid Zoom',
      linkUrl: 'https://anggaran-026.my.id',
      linkLabel: 'Lihat Materi & Panduan',
      targetTabs: ['ALL'],
      isActive: true,
      order: 2,
      createdAt: '2026-08-22'
    }
  ]
};
