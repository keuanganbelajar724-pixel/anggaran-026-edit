import { MasterSatker, SatkerIKPA } from '../types';

/**
 * Mendapatkan kode BA (Bagian Anggaran) 3-digit dari kodeSatker, kodeBa, atau nama K/L
 */
export const resolveKodeBA = (satker: { kodeBa?: string; kementerianLembaga?: string; kodeSatker?: string }): string => {
  if (satker.kodeBa && satker.kodeBa.trim().length > 0) {
    return satker.kodeBa.trim().padStart(3, '0');
  }

  const kl = (satker.kementerianLembaga || '').toLowerCase();
  
  // Kementerian / Lembaga Lengkap
  if (kl.includes('keuangan') || kl.includes('pajak') || kl.includes('djp') || kl.includes('perbendaharaan') || kl.includes('bea') || kl.includes('kppn')) return '015';
  if (kl.includes('pendidikan') || kl.includes('kebudayaan') || kl.includes('riset') || kl.includes('teknologi') || kl.includes('bbppmpv') || kl.includes('vokasi') || kl.includes('dikti') || kl.includes('universitas') || kl.includes('institut') || kl.includes('politeknik')) return '023';
  if (kl.includes('agama') || kl.includes('kemenag') || kl.includes('uin') || kl.includes('iain') || kl.includes('kua') || kl.includes('madrasah') || kl.includes('kanwil kemenag')) return '025';
  if (kl.includes('kepolisian') || kl.includes('polres') || kl.includes('polda') || kl.includes('polri') || kl.includes('polsek') || kl.includes('pusdik')) return '060';
  if (kl.includes('kesehatan') || kl.includes('poltekkes') || kl.includes('rsup') || kl.includes('rsud') || kl.includes('bapelkes') || kl.includes('bbpk')) return '024';
  if (kl.includes('hukum') || kl.includes('ham') || kl.includes('lapas') || kl.includes('rutan') || kl.includes('imigrasi') || kl.includes('bapas') || kl.includes('rupbasan')) return '013';
  if (kl.includes('pertahanan') || kl.includes('tni') || kl.includes('kodam') || kl.includes('korem') || kl.includes('kodim') || kl.includes('lanal') || kl.includes('lanud') || kl.includes('yonif')) return '012';
  if (kl.includes('agraria') || kl.includes('tata ruang') || kl.includes('bpn') || kl.includes('pertanahan') || kl.includes('kantor pertanahan')) return '056';
  if (kl.includes('statistik') || kl.includes('bps')) return '054';
  if (kl.includes('pemilihan') || kl.includes('kpu')) return '076';
  if (kl.includes('bawaslu') || kl.includes('pengawas pemilu')) return '115';
  if (kl.includes('pemeriksa keuangan') || kl.includes('bpk ')) return '005';
  if (kl.includes('mahkamah agung') || kl.includes('pengadilan negeri') || kl.includes('pengadilan agama') || kl.includes('pengadilan tata usaha') || kl.includes('pengadilan militer') || kl.includes('pn ') || kl.includes('pa ')) return '005';
  if (kl.includes('kejaksaan') || kl.includes('kejari') || kl.includes('kejati')) return '006';
  if (kl.includes('pertanian') || kl.includes('bbpptp') || kl.includes('karantina pertanian')) return '018';
  if (kl.includes('pekerjaan umum') || kl.includes('perumahan rakyat') || kl.includes('pupr') || kl.includes('bbws') || kl.includes('bpjn')) return '033';
  if (kl.includes('perhubungan') || kl.includes('dishub') || kl.includes('ksop') || kl.includes('distrik navigasi') || kl.includes('bandara')) return '022';
  if (kl.includes('kelautan') || kl.includes('perikanan') || kl.includes('kkp')) return '032';
  if (kl.includes('lingkungan hidup') || kl.includes('kehutanan') || kl.includes('klhk') || kl.includes('bbksda')) return '029';
  if (kl.includes('sosial') || kl.includes('kemensos') || kl.includes('balai sosial')) return '027';
  if (kl.includes('ketenagakerjaan') || kl.includes('kemnaker') || kl.includes('bbpvp') || kl.includes('blki')) return '026';
  if (kl.includes('komunikasi') || kl.includes('informatika') || kl.includes('kominfo') || kl.includes('monas')) return '059';
  if (kl.includes('perdagangan') || kl.includes('kemendag')) return '090';
  if (kl.includes('perindustrian') || kl.includes('kemenperin')) return '019';
  if (kl.includes('energi') || kl.includes('sumber daya mineral') || kl.includes('esdm')) return '020';
  if (kl.includes('desa') || kl.includes('daerah tertinggal') || kl.includes('transmigrasi') || kl.includes('kemendesa')) return '067';
  if (kl.includes('bmkg') || kl.includes('meteorologi')) return '035';
  if (kl.includes('basarnas') || kl.includes('pencarian dan pertolongan')) return '104';
  if (kl.includes('bnn') || kl.includes('narkotika')) return '066';
  if (kl.includes('bapeten')) return '043';
  if (kl.includes('bpom') || kl.includes('pengawas obat')) return '063';
  if (kl.includes('dpr') || kl.includes('parlemen')) return '002';
  if (kl.includes('dpd')) return '004';
  if (kl.includes('mpr')) return '001';
  if (kl.includes('kpk') || kl.includes('pemberantasan korupsi')) return '082';

  return '';
};

/**
 * Format Password Default Satker:
 * Jika ada Kode BA: [KodeSatker]_[KodeBA] (contoh: 890594_023)
 * Jika tidak ada Kode BA: [KodeSatker] (contoh: 890594)
 */
export const getSatkerDefaultPassword = (
  satker: { kodeSatker: string; kodeBa?: string; kementerianLembaga?: string }
): string => {
  const cleanKode = (satker.kodeSatker || '').trim().padStart(6, '0');
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
  satker: { kodeSatker: string; kodeBa?: string; kementerianLembaga?: string; passwordSatker?: string; kodeKppn?: string },
  inputPassword: string,
  isAdmin: boolean = false
): boolean => {
  if (isAdmin) return true;
  if (!inputPassword) return false;

  const cleanInput = inputPassword.trim();
  const cleanKode = (satker.kodeSatker || '').trim();
  const defaultPw = getSatkerDefaultPassword(satker);
  const ba = resolveKodeBA(satker);
  const kppn = satker.kodeKppn || '026';

  // 1. Password kustom yang telah diatur oleh admin / satker
  if (satker.passwordSatker && cleanInput === satker.passwordSatker.trim()) {
    return true;
  }

  // 2. Format default resmi: getSatkerDefaultPassword(satker)
  if (cleanInput === defaultPw) {
    return true;
  }

  // 3. Format KodeSatker saja (e.g. "890594")
  if (cleanInput === cleanKode || cleanInput === cleanKode.padStart(6, '0')) {
    return true;
  }

  // 4. Format [KodeSatker]_[KodeBA] (misal satker coba input dengan BA)
  if (ba && cleanInput === `${cleanKode}_${ba}`) {
    return true;
  }

  // 5. Format fallback dengan '018' jika sebelumnya pernah dipakai
  if (cleanInput === `${cleanKode}_018`) {
    return true;
  }

  // 6. Format lengkap: [KodeSatker]_[KodeBA]_[KodeKPPN]
  if (cleanInput === `${cleanKode}_${ba}_${kppn}` || cleanInput === `${cleanKode}${ba}${kppn}`) {
    return true;
  }

  // 7. Master bypass PIN KPPN
  if (['admin123', '527272', 'kppn026', 'kppn033', 'kppnsemarang1'].includes(cleanInput.toLowerCase())) {
    return true;
  }

  return false;
};

