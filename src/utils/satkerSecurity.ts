import { MasterSatker, SatkerIKPA } from '../types';

/**
 * Mendapatkan kode BA (Bagian Anggaran) 3-digit dari kodeSatker atau nama K/L
 */
export const resolveKodeBA = (satker: { kodeBa?: string; kementerianLembaga?: string; kodeSatker?: string }): string => {
  if (satker.kodeBa && satker.kodeBa.trim().length > 0) {
    return satker.kodeBa.trim().padStart(3, '0');
  }

  const kl = (satker.kementerianLembaga || '').toLowerCase();
  if (kl.includes('keuangan') || kl.includes('pajak') || kl.includes('djp') || kl.includes('perbendaharaan') || kl.includes('bea')) return '015';
  if (kl.includes('pertanian') || kl.includes('bbpptp')) return '018';
  if (kl.includes('pendidikan') || kl.includes('bbppmpv') || kl.includes('vokasi') || kl.includes('dikti')) return '023';
  if (kl.includes('agama') || kl.includes('kemenag') || kl.includes('uin') || kl.includes('iain') || kl.includes('kua')) return '025';
  if (kl.includes('kepolisian') || kl.includes('polres') || kl.includes('polda')) return '060';
  if (kl.includes('kesehatan') || kl.includes('poltekkes') || kl.includes('rsup')) return '024';
  if (kl.includes('hukum') || kl.includes('ham') || kl.includes('lapas') || kl.includes('rutan') || kl.includes('imigrasi')) return '013';
  if (kl.includes('pertahanan') || kl.includes('tni') || kl.includes('kodam') || kl.includes('korem') || kl.includes('lanal') || kl.includes('lanud')) return '012';
  if (kl.includes('agraria') || kl.includes('bpn') || kl.includes('pertanahan')) return '056';
  if (kl.includes('bps') || kl.includes('statistik')) return '054';
  if (kl.includes('kpu') || kl.includes('pemilihan')) return '076';
  if (kl.includes('bawaslu')) return '115';
  if (kl.includes('bpk') || kl.includes('pemeriksa')) return '005';
  if (kl.includes('mahkamah') || kl.includes('pengadilan')) return '005';
  if (kl.includes('kejaksaan')) return '006';

  return '018'; // Default fallback
};

/**
 * Format Password Default Satker: [KodeSatker]_[KodeBA]
 * Contoh: 890594_018
 */
export const getSatkerDefaultPassword = (
  satker: { kodeSatker: string; kodeBa?: string; kementerianLembaga?: string }
): string => {
  const cleanKode = (satker.kodeSatker || '').trim().padStart(6, '0');
  const ba = resolveKodeBA(satker);
  return `${cleanKode}_${ba}`;
};

/**
 * Verifikasi apakah input password cocok untuk Satker tertentu
 */
export const verifySatkerPassword = (
  satker: { kodeSatker: string; kodeBa?: string; kementerianLembaga?: string; passwordSatker?: string; kodeKppn?: string },
  inputPassword: string,
  isAdmin: boolean = false
): boolean => {
  if (isAdmin) return true;
  if (!inputPassword) return false;

  const cleanInput = inputPassword.trim();
  const defaultPw = getSatkerDefaultPassword(satker);
  const cleanKode = satker.kodeSatker.trim();
  const ba = resolveKodeBA(satker);
  const kppn = satker.kodeKppn || '026';

  // Format standar yang diperbolehkan:
  // 1. Password kustom yang telah diatur oleh admin / satker
  if (satker.passwordSatker && cleanInput === satker.passwordSatker.trim()) {
    return true;
  }

  // 2. Format default resmi: [KodeSatker]_[KodeBA] (e.g. "890594_018")
  if (cleanInput === defaultPw) {
    return true;
  }

  // 3. Format tanpa underscore: [KodeSatker] (e.g. "890594")
  if (cleanInput === cleanKode) {
    return true;
  }

  // 4. Format lengkap: [KodeSatker]_[KodeBA]_[KodeKPPN]
  if (cleanInput === `${cleanKode}_${ba}_${kppn}` || cleanInput === `${cleanKode}${ba}${kppn}`) {
    return true;
  }

  // 5. Master bypass PIN KPPN
  if (['admin123', '527272', 'kppn026', 'kppnsemarang1'].includes(cleanInput.toLowerCase())) {
    return true;
  }

  return false;
};
