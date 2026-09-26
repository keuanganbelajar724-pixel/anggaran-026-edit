import { SidebarConfig } from '../types/sidebar';

export const INITIAL_SIDEBAR_CONFIG: SidebarConfig = {
  isEnabled: true,
  title: 'Aplikasi Internal KPPN',
  subtitle: 'Pusat Pintasan Sistem Informasi DJPb & Mitra Perbendaharaan',
  themePreset: 'navy_kemenkeu',
  position: 'left',
  widthMode: 'standard',
  customBgColor: '#0f172a',
  customHeaderColor: '#1e3a8a',
  customTextColor: '#f8fafc',
  customAccentColor: '#38bdf8',
  items: [
    {
      id: 'app-sakti',
      title: 'SAKTI (Sistem Aplikasi Keuangan Tingkat Instansi)',
      category: 'Aplikasi Inti DJPb',
      description: 'Aplikasi tunggal transaksi keuangan negara, SPP/SPM, komitmen, dan pelaporan satker.',
      icon: 'Cpu',
      badge: 'SSO UTAMA',
      isActive: true,
      order: 1,
      submenus: [
        {
          id: 'sub-sakti-prod',
          title: 'SAKTI Production (Live Transaksi)',
          url: 'https://sakti.kemenkeu.go.id/',
          description: 'Akses login pengguna live satker & KPPN (Modul Anggaran, Komitmen, Pembayaran, Bendahara, GLP)',
          badge: 'PRODUKSI',
          isActive: true
        },
        {
          id: 'sub-sakti-pandu',
          title: 'Pandu SAKTI (Training & Simulasi)',
          url: 'https://pandu-sakti.kemenkeu.go.id/',
          description: 'Lingkungan latihan dan uji coba transaksi anggaran sebelum diterapkan pada server live',
          badge: 'LATIHAN',
          isActive: true
        },
        {
          id: 'sub-sakti-faq',
          title: 'Portal Petunjuk Teknis & Video SAKTI',
          url: 'https://djpb.kemenkeu.go.id/portal/id/layanan/sakti.html',
          description: 'Dokumentasi, juknis, FAQ resmi, dan tata cara penanganan kendala aplikasi SAKTI',
          badge: 'JUKNIS',
          isActive: true
        }
      ]
    },
    {
      id: 'app-span',
      title: 'SPAN & OM-SPAN (Monitoring Perbendaharaan)',
      category: 'Aplikasi Inti DJPb',
      description: 'Sistem Perbendaharaan dan Anggaran Negara & Online Monitoring realisasi DIPA nasional.',
      icon: 'Database',
      badge: 'MONITORING',
      isActive: true,
      order: 2,
      submenus: [
        {
          id: 'sub-omspan',
          title: 'OM-SPAN Online Monitoring DJPb',
          url: 'https://spanint.kemenkeu.go.id/',
          description: 'Pantau status SP2D, realisasi penyerapan, pagu minus, retur, dan rekonsiliasi laporan',
          badge: 'ONLINE',
          isActive: true
        },
        {
          id: 'sub-span-prod',
          title: 'SPAN Produksi Internal KPPN',
          url: 'https://span.kemenkeu.go.id/',
          description: 'Aplikasi backend proses konversi SPM ke SP2D, settlement kas negara, dan akuntansi',
          badge: 'INTERNAL',
          isActive: true
        }
      ]
    },
    {
      id: 'app-haicso',
      title: 'HAI DJPb Service Desk & CSO Tiket',
      category: 'Layanan Satker',
      description: 'Pusat layanan konsultasi, pengaduan kendala teknis SAKTI, dan helpdesk resmi Kemenkeu.',
      icon: 'LifeBuoy',
      badge: 'HELPDESK',
      isActive: true,
      order: 3,
      submenus: [
        {
          id: 'sub-hai-portal',
          title: 'HAI DJPb Service Desk (Portal Tiket)',
          url: 'https://hai.kemenkeu.go.id/',
          description: 'Buka tiket kendala, pemutakhiran data, konsultasi teknis, dan eskalasi ke Kantor Pusat',
          badge: 'TIKET',
          isActive: true
        },
        {
          id: 'sub-cso-kppn',
          title: 'CSO Online KPPN Semarang I',
          url: 'https://djpb.kemenkeu.go.id/kppn/semarang1',
          description: 'Kanal informasi layanan tatap muka & daring Seksi MSKI KPPN Semarang I',
          badge: 'KPPN 026',
          isActive: true
        }
      ]
    },
    {
      id: 'app-digipay',
      title: 'Digipay Satu (Marketplace Pengadaan)',
      category: 'Belanja & Perbankan',
      description: 'Platform marketplace pengadaan barang/jasa pemerintah dan pemberdayaan UMKM mitra.',
      icon: 'ShoppingBag',
      badge: 'MARKETPLACE',
      isActive: true,
      order: 4,
      submenus: [
        {
          id: 'sub-digipay-portal',
          title: 'Portal Digipay Satu DJPb',
          url: 'https://digipaysatu.kemenkeu.go.id/',
          description: 'Pemesanan barang/jasa pemerintah secara elektronik menggunakan Virtual Account & KKP',
          badge: 'TRANSAKSI',
          isActive: true
        },
        {
          id: 'sub-digipay-panduan',
          title: 'Panduan Transaksi Digipay Satker',
          url: 'https://djpb.kemenkeu.go.id/portal/id/layanan/digipay.html',
          description: 'Tata cara pendaftaran vendor, verifikasi pejabat pengadaan, dan revolving KKP',
          badge: 'PANDUAN',
          isActive: true
        }
      ]
    },
    {
      id: 'app-sprint',
      title: 'SPRINT (Pengelolaan Rekening Pemerintah)',
      category: 'Belanja & Perbankan',
      description: 'Sistem perizinan pembukaan rekening, monitoring saldo kas, dan pelaporan bendahara.',
      icon: 'CreditCard',
      badge: 'REKENING',
      isActive: true,
      order: 5,
      submenus: [
        {
          id: 'sub-sprint-portal',
          title: 'Portal SPRINT DJPb',
          url: 'https://sprint.kemenkeu.go.id/',
          description: 'Pengajuan izin pembukaan rekening giro/deposito satker serta monitoring saldo harian',
          badge: 'IZIN & SALDO',
          isActive: true
        }
      ]
    },
    {
      id: 'app-simaspati',
      title: 'SIMASPATI & Sertifikasi Pejabat',
      category: 'SDM & Jabatan Perbendaharaan',
      description: 'Sistem Informasi Manajemen Sertifikasi Pejabat Perbendaharaan (PPK, PPSPM, Bendahara).',
      icon: 'Award',
      badge: 'SERTIFIKASI',
      isActive: true,
      order: 6,
      submenus: [
        {
          id: 'sub-simaspati-portal',
          title: 'Portal SIMASPATI Kemenkeu',
          url: 'https://simaspati.kemenkeu.go.id/',
          description: 'Pendaftaran uji kompetensi sertifikasi, penerbitan PNT/NTPN, dan perpanjangan sertifikat',
          badge: 'UJI KOMPETENSI',
          isActive: true
        }
      ]
    },
    {
      id: 'app-banking-cms',
      title: 'CMS Perbankan Giro Pemerintah (Bank Persepsi)',
      category: 'Belanja & Perbankan',
      description: 'Cash Management System internet banking bank mitra untuk transaksi non-tunai bendahara.',
      icon: 'Building2',
      badge: 'BANK MITRA',
      isActive: true,
      order: 7,
      submenus: [
        {
          id: 'sub-cms-bri',
          title: 'CMS Bank BRI (Internet Banking Giro)',
          url: 'https://ib.bri.co.id/',
          description: 'Layanan CMS pengelolaan rekening bendahara pengeluaran/penerimaan Bank BRI',
          badge: 'BRI',
          isActive: true
        },
        {
          id: 'sub-cms-mandiri',
          title: 'CMS Bank Mandiri (MCM 2.0)',
          url: 'https://mcm2.bankmandiri.co.id/',
          description: 'Mandiri Cash Management transaksi giro operasional satuan kerja',
          badge: 'MANDIRI',
          isActive: true
        },
        {
          id: 'sub-cms-bni',
          title: 'BNI Direct (CMS Bank BNI)',
          url: 'https://bnidirect.bni.co.id/',
          description: 'Portal transaksi perbankan korporasi & satker pemerintah Bank BNI',
          badge: 'BNI',
          isActive: true
        },
        {
          id: 'sub-cms-jateng',
          title: 'CMS Bank Jateng (BPD)',
          url: 'https://ibanking.bankjateng.co.id/',
          description: 'Layanan internet banking giro daerah & kas satuan kerja Bank Jateng',
          badge: 'BPD JATENG',
          isActive: true
        }
      ]
    },
    {
      id: 'app-internal-kemenkeu',
      title: 'Internal E-Office & Tata Persuratan Kemenkeu',
      category: 'Internal KPPN',
      description: 'Aplikasi persuratan resmi, kepegawaian HRMS, dan portal terpadu Kemenkeu Satu.',
      icon: 'FileText',
      badge: 'E-OFFICE',
      isActive: true,
      order: 8,
      submenus: [
        {
          id: 'sub-nadine',
          title: 'Nadine Kemenkeu (Naskah Dinas Elektronik)',
          url: 'https://office.kemenkeu.go.id/',
          description: 'Pembuatan surat dinas resmi, nota dinas, disposisi pimpinan, dan tanda tangan digital',
          badge: 'SURAT',
          isActive: true
        },
        {
          id: 'sub-hrms',
          title: 'HRMS Kemenkeu (Sistem Kepegawaian)',
          url: 'https://hrms.kemenkeu.go.id/',
          description: 'Pengelolaan data profil pegawai, SKP kinerja, izin/cuti, dan mutasi internal',
          badge: 'SDM',
          isActive: true
        },
        {
          id: 'sub-kemenkeu-satu',
          title: 'Portal Kemenkeu Satu Terpadu',
          url: 'https://kemenkeu.go.id/',
          description: 'Dashboard single sign-on seluruh portal aplikasi Kementerian Keuangan',
          badge: 'PORTAL',
          isActive: true
        }
      ]
    }
  ]
};

export const SIDEBAR_THEME_PRESETS: Record<string, {
  name: string;
  description: string;
  headerGradient: string;
  bgClass: string;
  accentClass: string;
  borderClass: string;
  badgeBg: string;
  badgeText: string;
  activeIndicator: string;
}> = {
  navy_kemenkeu: {
    name: 'Kemenkeu Navy (Standar Resmi)',
    description: 'Biru Tua Kemenkeu dipadukan dengan aksen emas berwibawa khas Perbendaharaan',
    headerGradient: 'from-blue-900 via-indigo-950 to-slate-900',
    bgClass: 'bg-slate-950',
    accentClass: 'text-sky-400',
    borderClass: 'border-blue-900/60',
    badgeBg: 'bg-amber-400',
    badgeText: 'text-slate-950',
    activeIndicator: 'border-l-sky-400'
  },
  emerald_djpb: {
    name: 'Emerald Perbendaharaan',
    description: 'Hijau zamrud modern melambangkan ketelitian, akurasi, dan integritas kas negara',
    headerGradient: 'from-emerald-900 via-teal-950 to-slate-900',
    bgClass: 'bg-slate-950',
    accentClass: 'text-emerald-400',
    borderClass: 'border-emerald-900/60',
    badgeBg: 'bg-emerald-400',
    badgeText: 'text-slate-950',
    activeIndicator: 'border-l-emerald-400'
  },
  midnight_indigo: {
    name: 'Midnight Tech Indigo',
    description: 'Indigo gelap modern berpadu ungu neon tech futuristik & elegan',
    headerGradient: 'from-indigo-900 via-purple-950 to-slate-950',
    bgClass: 'bg-slate-950',
    accentClass: 'text-indigo-400',
    borderClass: 'border-indigo-900/60',
    badgeBg: 'bg-indigo-500',
    badgeText: 'text-white',
    activeIndicator: 'border-l-indigo-400'
  },
  slate_dark: {
    name: 'Clean Charcoal Dark',
    description: 'Abu-abu gelap pekat netral minimalis yang nyaman di mata',
    headerGradient: 'from-slate-900 via-slate-950 to-black',
    bgClass: 'bg-slate-950',
    accentClass: 'text-slate-200',
    borderClass: 'border-slate-800',
    badgeBg: 'bg-slate-700',
    badgeText: 'text-white',
    activeIndicator: 'border-l-slate-400'
  },
  royal_purple: {
    name: 'Royal Majesty Purple',
    description: 'Ungu bangsawan anggun dengan sentuhan fuchsia dan emas mewah',
    headerGradient: 'from-purple-900 via-fuchsia-950 to-slate-950',
    bgClass: 'bg-slate-950',
    accentClass: 'text-fuchsia-400',
    borderClass: 'border-purple-900/60',
    badgeBg: 'bg-fuchsia-500',
    badgeText: 'text-white',
    activeIndicator: 'border-l-fuchsia-400'
  },
  crimson_maroon: {
    name: 'Prestige Crimson Maroon',
    description: 'Merah marun tegas melambangkan disiplin dan ketegasan anggaran',
    headerGradient: 'from-rose-950 via-red-950 to-slate-950',
    bgClass: 'bg-slate-950',
    accentClass: 'text-rose-400',
    borderClass: 'border-rose-900/60',
    badgeBg: 'bg-rose-500',
    badgeText: 'text-white',
    activeIndicator: 'border-l-rose-400'
  },
  custom: {
    name: 'Kustom Warna Mandiri',
    description: 'Pilihan warna bebas yang disesuaikan oleh Super Admin',
    headerGradient: 'from-slate-900 to-slate-950',
    bgClass: 'bg-slate-950',
    accentClass: 'text-sky-400',
    borderClass: 'border-slate-800',
    badgeBg: 'bg-sky-400',
    badgeText: 'text-slate-950',
    activeIndicator: 'border-l-sky-400'
  }
};
