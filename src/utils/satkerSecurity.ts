import { MasterSatker, SatkerIKPA } from '../types';

/**
 * Mendapatkan kode BA (Bagian Anggaran) 3-digit dari kodeSatker, kodeBa, atau nama K/L
 */
export const resolveKodeBA = (satker: {
  kodeBa?: string;
  kementerianLembaga?: string;
  kodeSatker?: string;
  namaSatker?: string;
}): string => {
  const kode = (satker.kodeSatker || '').trim();

  // Khusus Satker 527272 (KPPN Semarang I - BA 015 DJPb Eselon I 08)
  if (kode === '527272') {
    return '01508';
  }

  if (satker.kodeBa && satker.kodeBa.trim().length > 0 && satker.kodeBa.trim() !== '-' && satker.kodeBa.trim() !== '000') {
    return satker.kodeBa.trim().padStart(3, '0');
  }

  const kl = (satker.kementerianLembaga || '').toLowerCase();
  const nama = (satker.namaSatker || '').toLowerCase();
  const combined = `${kl} ${nama} ${kode}`.toLowerCase();

  // Khusus Satker Kemenkeu / DJPb
  if (combined.includes('kppn') || combined.includes('djpb') || combined.includes('perbendaharaan') || combined.includes('keuangan') || combined.includes('pajak') || combined.includes('djp') || combined.includes('bea') || combined.includes('kpknl') || combined.includes('bdk')) {
    return '015';
  }

  // Kementerian / Lembaga Lengkap
  if (combined.includes('pendidikan') || combined.includes('kebudayaan') || combined.includes('riset') || combined.includes('teknologi') || combined.includes('bbppmpv') || combined.includes('vokasi') || combined.includes('dikti') || combined.includes('universitas') || combined.includes('institut') || combined.includes('politeknik') || combined.includes('balai bahasa')) return '023';
  if (combined.includes('agama') || combined.includes('kemenag') || combined.includes('uin') || combined.includes('iain') || combined.includes('kua') || combined.includes('madrasah') || combined.includes('kanwil kemenag') || combined.includes('man ') || combined.includes('mts')) return '025';
  if (combined.includes('kepolisian') || combined.includes('polres') || combined.includes('polda') || combined.includes('polri') || combined.includes('polsek') || combined.includes('pusdik')) return '060';
  if (combined.includes('kesehatan') || combined.includes('poltekkes') || combined.includes('rsup') || combined.includes('rsud') || combined.includes('bapelkes') || combined.includes('bbpk')) return '024';
  if (combined.includes('hukum') || combined.includes('ham') || combined.includes('lapas') || combined.includes('rutan') || combined.includes('imigrasi') || combined.includes('bapas') || combined.includes('rupbasan') || combined.includes('kanwil kumham')) return '013';
  if (combined.includes('pertahanan') || combined.includes('tni') || combined.includes('kodam') || combined.includes('korem') || combined.includes('kodim') || combined.includes('lanal') || combined.includes('lanud') || combined.includes('yonif')) return '012';
  if (combined.includes('agraria') || combined.includes('tata ruang') || combined.includes('bpn') || combined.includes('pertanahan') || combined.includes('kantor pertanahan') || combined.includes('kantah')) return '056';
  if (combined.includes('statistik') || combined.includes('bps')) return '054';
  if (combined.includes('pemilihan') || combined.includes('kpu')) return '076';
  if (combined.includes('bawaslu') || combined.includes('pengawas pemilu')) return '115';
  if (combined.includes('pemeriksa keuangan') || combined.includes('bpk ') || combined.includes('bpk ri')) return '005';
  if (combined.includes('mahkamah agung') || combined.includes('pengadilan negeri') || combined.includes('pengadilan agama') || combined.includes('pengadilan tata usaha') || combined.includes('pengadilan militer') || combined.includes('pn ') || combined.includes('pa ') || combined.includes('ptun')) return '005';
  if (combined.includes('kejaksaan') || combined.includes('kejari') || combined.includes('kejati')) return '006';
  if (combined.includes('pertanian') || combined.includes('bbpptp') || combined.includes('karantina pertanian')) return '018';
  if (combined.includes('pekerjaan umum') || combined.includes('perumahan rakyat') || combined.includes('pupr') || combined.includes('bbws') || combined.includes('bpjn')) return '033';
  if (combined.includes('perhubungan') || combined.includes('dishub') || combined.includes('ksop') || combined.includes('distrik navigasi') || combined.includes('bandara')) return '022';
  if (combined.includes('kelautan') || combined.includes('perikanan') || combined.includes('kkp')) return '032';
  if (combined.includes('lingkungan hidup') || combined.includes('kehutanan') || combined.includes('klhk') || combined.includes('bbksda')) return '029';
  if (combined.includes('sosial') || combined.includes('kemensos') || combined.includes('balai sosial')) return '027';
  if (combined.includes('ketenagakerjaan') || combined.includes('kemnaker') || combined.includes('bbpvp') || combined.includes('blki')) return '026';
  if (combined.includes('komunikasi') || combined.includes('informatika') || combined.includes('kominfo') || combined.includes('monas') || combined.includes('bpptik')) return '059';
  if (combined.includes('perdagangan') || combined.includes('kemendag')) return '090';
  if (combined.includes('perindustrian') || combined.includes('kemenperin')) return '019';
  if (combined.includes('energi') || combined.includes('sumber daya mineral') || combined.includes('esdm')) return '020';
  if (combined.includes('desa') || combined.includes('daerah tertinggal') || combined.includes('transmigrasi') || combined.includes('kemendesa')) return '067';
  if (combined.includes('bmkg') || combined.includes('meteorologi')) return '035';
  if (combined.includes('basarnas') || combined.includes('pencarian dan pertolongan')) return '104';
  if (combined.includes('bnn') || combined.includes('narkotika')) return '066';
  if (combined.includes('bapeten')) return '043';
  if (combined.includes('bpom') || combined.includes('pengawas obat')) return '063';
  if (combined.includes('dpr') || combined.includes('parlemen')) return '002';
  if (combined.includes('dpd')) return '004';
  if (combined.includes('mpr')) return '001';
  if (combined.includes('kpk') || combined.includes('pemberantasan korupsi')) return '082';

  return '';
};

/**
 * Format Password Default Satker:
 * - Khusus KPPN Semarang I (527272): 527272_01508 (BA 015 DJPb Eselon I 08)
 * - Jika ada Kode BA: [KodeSatker]_[KodeBA] (contoh: 890594_023)
 * - Jika tidak ada Kode BA: [KodeSatker] (contoh: 890594)
 */
export const getSatkerDefaultPassword = (
  satker: { kodeSatker: string; kodeBa?: string; kementerianLembaga?: string; namaSatker?: string; passwordSatker?: string }
): string => {
  const cleanKode = (satker.kodeSatker || '').trim().padStart(6, '0');
  if (satker.passwordSatker && satker.passwordSatker.trim() !== '') {
    return satker.passwordSatker.trim();
  }

  // Khusus Satker 527272 (KPPN Semarang I / DJPb Eselon I 08)
  if (cleanKode === '527272') {
    return '527272_01508';
  }

  const ba = resolveKodeBA(satker);
  if (ba && ba.length > 0) {
    return `${cleanKode}_${ba}`;
  }
  return cleanKode;
};

/**
 * Verifikasi apakah input password cocok untuk Satker tertentu
 */
export const verifySatkerPassword = (
  satker: { kodeSatker: string; kodeBa?: string; kementerianLembaga?: string; namaSatker?: string; passwordSatker?: string; kodeKppn?: string },
  inputPassword: string,
  isAdmin: boolean = false
): boolean => {
  if (isAdmin) return true;
  if (!inputPassword) return false;

  const cleanInput = inputPassword.trim();
  const cleanKode = (satker.kodeSatker || '').trim();

  // 1. Master bypass PIN KPPN (uses centralized admin password or default 'kppn026')
  const currentAdminPin = (typeof localStorage !== 'undefined' && localStorage.getItem('kppn_admin_pin')) || 'kppn026';
  if (cleanInput === currentAdminPin || cleanInput.toLowerCase() === currentAdminPin.toLowerCase() || cleanInput.toLowerCase() === 'kppn026') {
    return true;
  }

  // 2. Password kustom yang telah diatur oleh admin / satker
  if (satker.passwordSatker && cleanInput.toLowerCase() === satker.passwordSatker.trim().toLowerCase()) {
    return true;
  }

  // 3. Khusus KPPN Semarang I (527272): password resmi adalah 527272_01508 (DJPb: BA 015 Unit Eselon I 08)
  // TIDAK diizinkan login dengan 527272_015 atau hanya kode satker
  if (cleanKode === '527272') {
    const norm = cleanInput.replace(/\./g, '').toLowerCase();
    return norm === '527272_01508';
  }

  const defaultPw = getSatkerDefaultPassword(satker);
  const ba = resolveKodeBA(satker);
  const kppn = satker.kodeKppn || '026';

  // 4. Format default resmi: getSatkerDefaultPassword(satker)
  if (cleanInput.toLowerCase() === defaultPw.toLowerCase()) {
    return true;
  }

  // 5. Format [KodeSatker]_[KodeBA] atau [KodeSatker]_[KodeBA][UnitEselon]
  // Contoh: 651046_02504, 651046_025
  const normalizedInput = cleanInput.replace(/\./g, '').toLowerCase();
  if (ba && ba.length >= 2) {
    if (
      normalizedInput === `${cleanKode}_${ba}`.toLowerCase() ||
      normalizedInput === `${cleanKode}_${ba.padStart(3, '0')}`.toLowerCase() ||
      normalizedInput.startsWith(`${cleanKode}_${ba}`.toLowerCase()) ||
      normalizedInput.startsWith(`${cleanKode}_${ba.padStart(3, '0')}`.toLowerCase())
    ) {
      return true;
    }
  }

  // 6. Format KPPN026#[KodeSatker] atau KPPN#[KodeSatker]
  if (
    cleanInput.toLowerCase() === `kppn026#${cleanKode.toLowerCase()}` ||
    cleanInput.toLowerCase() === `kppn#${cleanKode.toLowerCase()}` ||
    cleanInput.toLowerCase() === `kppn026${cleanKode.toLowerCase()}`
  ) {
    return true;
  }

  // 7. Format lengkap: [KodeSatker]_[KodeBA]_[KodeKPPN]
  if (ba && (cleanInput === `${cleanKode}_${ba}_${kppn}` || cleanInput === `${cleanKode}${ba}${kppn}`)) {
    return true;
  }

  return false;
};

