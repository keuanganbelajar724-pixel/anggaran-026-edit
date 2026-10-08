const fs = require('fs');

const raw = JSON.parse(fs.readFileSync('llat_generated.json', 'utf8'));

// Format to TypeScript defaultLlatData.ts
const header = `import { 
  LLATCategory, 
  LLATEvent, 
  LLATSettings, 
  LLATStatus, 
  LLATPrioritas,
  LLATStatusVerifikasi,
  LLATStatusPenyelesaian,
  LLATKetentuanWaktu
} from '../types/llat';

export const DEFAULT_LLAT_CATEGORIES: LLATCategory[] = ${JSON.stringify(raw.categories, null, 2)};

export const DEFAULT_LLAT_SETTINGS: LLATSettings = ${JSON.stringify(raw.settings, null, 2)};

export const DEFAULT_LLAT_EVENTS_2026: LLATEvent[] = ${JSON.stringify(raw.events, null, 2)};
`;

// Now append all badge and calculation helper functions
const helpers = `
export function calculateEventStatus(event: LLATEvent): LLATStatus {
  if (event.status_penyelesaian === 'SELESAI') {
    return 'SELESAI';
  }

  const now = new Date();
  const todayStr = \`\${now.getFullYear()}-\${String(now.getMonth() + 1).padStart(2, '0')}-\${String(now.getDate()).padStart(2, '0')}\`;

  const deadline = event.tanggal_penerimaan || event.tanggal_batas;
  if (!deadline) {
    return 'BERJALAN';
  }

  if (deadline < todayStr) {
    return 'TERLEWAT';
  }

  if (deadline === todayStr) {
    return 'HARI_INI';
  }

  const dDead = new Date(deadline + 'T00:00:00');
  const dToday = new Date(todayStr + 'T00:00:00');
  const diffTime = dDead.getTime() - dToday.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 7 && diffDays > 0) {
    return 'SEGERA';
  }

  return 'BERJALAN';
}

export function getCountdownInfo(event: LLATEvent): {
  text: string;
  badgeClass: string;
  borderClass: string;
  isPast: boolean;
  isToday: boolean;
  daysRemaining: number;
} {
  const targetDateStr = event.tanggal_penerimaan || event.tanggal_batas;
  if (!targetDateStr) {
    return {
      text: 'Aturan Relatif',
      badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      borderClass: 'border-slate-300',
      isPast: false,
      isToday: false,
      daysRemaining: 999
    };
  }

  const now = new Date();
  const todayStr = \`\${now.getFullYear()}-\${String(now.getMonth() + 1).padStart(2, '0')}-\${String(now.getDate()).padStart(2, '0')}\`;

  if (targetDateStr === todayStr) {
    return {
      text: '🚨 HARI INI JATUH TEMPO',
      badgeClass: 'bg-red-600 text-white font-black animate-pulse',
      borderClass: 'border-red-500',
      isPast: false,
      isToday: true,
      daysRemaining: 0
    };
  }

  const dDead = new Date(targetDateStr + 'T00:00:00');
  const dToday = new Date(todayStr + 'T00:00:00');
  const diffTime = dDead.getTime() - dToday.getTime();
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (days < 0) {
    return {
      text: \`Lewat \${Math.abs(days)} Hari\`,
      badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-200 font-bold',
      borderClass: 'border-rose-300',
      isPast: true,
      isToday: false,
      daysRemaining: days
    };
  }

  if (days <= 3) {
    return {
      text: \`🔥 \${days} HARI LAGI\`,
      badgeClass: 'bg-orange-100 text-orange-800 dark:bg-orange-950/80 dark:text-orange-200 font-black',
      borderClass: 'border-orange-400',
      isPast: false,
      isToday: false,
      daysRemaining: days
    };
  }

  if (days <= 7) {
    return {
      text: \`🟡 \${days} HARI LAGI\`,
      badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-200 font-extrabold',
      borderClass: 'border-amber-300',
      isPast: false,
      isToday: false,
      daysRemaining: days
    };
  }

  return {
    text: \`🔵 \${days} HARI LAGI\`,
    badgeClass: 'bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-200 font-bold',
    borderClass: 'border-sky-300',
    isPast: false,
    isToday: false,
    daysRemaining: days
  };
}

export function getPriorityBadge(prioritas: LLATPrioritas): { label: string; badgeClass: string; dotClass: string } {
  switch (prioritas) {
    case 'KRITIS':
      return {
        label: 'KRITIS',
        badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950/90 dark:text-rose-200 border border-rose-300 dark:border-rose-800',
        dotClass: 'bg-rose-500'
      };
    case 'PENTING':
      return {
        label: 'PENTING',
        badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/90 dark:text-amber-200 border border-amber-300 dark:border-amber-800',
        dotClass: 'bg-amber-500'
      };
    case 'NORMAL':
    default:
      return {
        label: 'NORMAL',
        badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950/90 dark:text-blue-200 border border-blue-300 dark:border-blue-800',
        dotClass: 'bg-blue-500'
      };
  }
}

export function getStatusBadge(status: LLATStatus): { label: string; badgeClass: string; dotClass: string } {
  switch (status) {
    case 'HARI_INI':
      return {
        label: 'HARI INI',
        badgeClass: 'bg-red-600 text-white font-extrabold shadow-xs animate-pulse',
        dotClass: 'bg-white'
      };
    case 'SEGERA':
      return {
        label: 'SEGERA JATUH TEMPO',
        badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/90 dark:text-amber-300 border border-amber-300 font-extrabold',
        dotClass: 'bg-amber-500'
      };
    case 'BERJALAN':
      return {
        label: 'BERJALAN',
        badgeClass: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/90 dark:text-indigo-300 border border-indigo-300',
        dotClass: 'bg-indigo-500'
      };
    case 'BELUM_DIMULAI':
      return {
        label: 'BELUM DIMULAI',
        badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300',
        dotClass: 'bg-slate-400'
      };
    case 'SELESAI':
      return {
        label: 'SELESAI',
        badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/90 dark:text-emerald-300 border border-emerald-300 font-bold',
        dotClass: 'bg-emerald-500'
      };
    case 'TERLEWAT':
    default:
      return {
        label: 'TENGGAT LEWAT',
        badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950/90 dark:text-rose-300 border border-rose-300 font-bold',
        dotClass: 'bg-rose-500'
      };
  }
}

export function getVerificationBadge(statusVerifikasi?: LLATStatusVerifikasi): {
  label: string;
  badgeClass: string;
  dotClass: string;
} {
  switch (statusVerifikasi) {
    case 'TERVERIFIKASI':
      return {
        label: 'Terverifikasi Sumber',
        badgeClass: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
        dotClass: 'bg-emerald-500'
      };
    case 'PERLU_PEMERIKSAAN_MANUAL':
      return {
        label: 'Perlu Pemeriksaan Manual',
        badgeClass: 'bg-amber-50 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
        dotClass: 'bg-amber-500'
      };
    case 'BELUM_DIVERIFIKASI':
    default:
      return {
        label: 'Belum Diverifikasi',
        badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700',
        dotClass: 'bg-slate-400'
      };
  }
}

export function getCompletionBadge(statusPenyelesaian?: LLATStatusPenyelesaian): {
  label: string;
  badgeClass: string;
} {
  switch (statusPenyelesaian) {
    case 'SELESAI':
      return {
        label: 'Dikonfirmasi Selesai',
        badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300'
      };
    case 'BELUM_SELESAI':
      return {
        label: 'Belum Selesai',
        badgeClass: 'bg-amber-50 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200'
      };
    case 'TIDAK_ADA_STATUS':
    default:
      return {
        label: 'Tanpa Status Konfirmasi',
        badgeClass: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200'
      };
  }
}

export function getDeadlineTypeBadge(jenis?: string): { label: string; badgeClass: string } {
  const j = (jenis || '').toLowerCase();
  if (j.includes('penerimaan') || j.includes('diterima')) {
    return {
      label: jenis || 'Penerimaan Dokumen',
      badgeClass: 'bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
    };
  }
  if (j.includes('penyelesaian') || j.includes('sp2d')) {
    return {
      label: jenis || 'Batas Penyelesaian SP2D',
      badgeClass: 'bg-indigo-50 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
    };
  }
  if (j.includes('kontrak') || j.includes('pendaftaran')) {
    return {
      label: jenis || 'Pendaftaran Kontrak',
      badgeClass: 'bg-purple-50 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
    };
  }
  if (j.includes('setor') || j.includes('kas')) {
    return {
      label: jenis || 'Penyetoran Kas',
      badgeClass: 'bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
    };
  }
  if (j.includes('rekon') || j.includes('lpj') || j.includes('laporan')) {
    return {
      label: jenis || 'Rekonsiliasi & Pelaporan',
      badgeClass: 'bg-teal-50 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200 dark:border-teal-800'
    };
  }
  if (j.includes('operasional')) {
    return {
      label: jenis || 'Ketentuan Operasional',
      badgeClass: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700'
    };
  }
  return {
    label: jenis || 'Tenggat LLAT',
    badgeClass: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700'
  };
}
`;

fs.writeFileSync('src/data/defaultLlatData.ts', header + helpers, 'utf8');
console.log("Successfully synced src/data/defaultLlatData.ts!");
