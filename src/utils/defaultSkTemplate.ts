import { SkSaktiDraft, UserSaktiRecord } from '../types';

export const OFFICIAL_SK_TEMPLATE_VERSION = '1.0';

/**
 * Builds default SK SAKTI draft based on the official template:
 * "Format SK Penetapan User SAKTI - Satker.docx"
 */
export function createDefaultSkDraft(
  kodeSatker: string,
  namaSatker: string,
  levelSatker: string = 'SATKER',
  kpaName?: string,
  kpaNip?: string,
  userList: UserSaktiRecord[] = []
): SkSaktiDraft {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentYear = String(now.getFullYear());

  return {
    id: `sk_${kodeSatker}_${Date.now()}`,
    kodeSatker,
    namaSatker,
    levelSatker,
    nomorSk: `KEP-01/KPA/${kodeSatker}/${currentYear}`,
    tahunAnggaran: currentYear,
    tanggalSk: todayStr,
    tempatPenetapan: 'Semarang',
    tentang: `PENETAPAN PENGGUNA SISTEM SAKTI BAGI PEJABAT, OPERATOR, DAN ADMINISTRATOR TINGKAT SATUAN KERJA PADA ${namaSatker.toUpperCase()} (${kodeSatker})`,
    kopSurat: {
      kementerian: 'KEMENTERIAN KEUANGAN REPUBLIK INDONESIA',
      eselon1: 'DIREKTORAT JENDERAL PERBENDAHARAAN',
      satkerUnit: namaSatker,
      alamatKontak: 'Jalan Ki Mangunsarkoro No. 34, Semarang 50241, Telepon (024) 8311195'
    },
    menimbang: [
      {
        id: 'mnb_1',
        huruf: 'a',
        text: 'bahwa dengan telah ditetapkannya penggunaan Aplikasi Sistem Aplikasi Keuangan Tingkat Instansi (SAKTI) pada seluruh satuan kerja dalam rangka pelaksanaan APBN;'
      },
      {
        id: 'mnb_2',
        huruf: 'b',
        text: `bahwa sehubungan dengan butir a tersebut di atas, dipandang perlu menetapkan Keputusan Kuasa Pengguna Anggaran tentang Penetapan Pengguna Sistem SAKTI bagi Pejabat, Operator, dan Administrator Tingkat Satuan Kerja pada ${namaSatker} (${kodeSatker}) Tahun Anggaran ${currentYear}.`
      }
    ],
    mengingat: [
      {
        id: 'mng_1',
        nomor: 1,
        text: 'Peraturan Menteri Keuangan Nomor PMK 158 Tahun 2023 Tentang Perubahan atas Peraturan Menteri Keuangan Nomor 171/PMK.05/2021 tentang Pelaksanaan Sistem SAKTI;'
      },
      {
        id: 'mng_2',
        nomor: 2,
        text: 'Peraturan Menteri Keuangan Nomor PMK 62 Tahun 2023 Tentang Perencanaan Anggaran, Pelaksanaan Anggaran, serta Akuntansi dan Pelaporan Keuangan;'
      },
      {
        id: 'mng_3',
        nomor: 3,
        text: 'Keputusan Menteri Keuangan Nomor 6/KMK.01/2013 tentang Tata Cara penetapan Pejabat Pembuat Komitmen, Pejabat Penanda Tangan Surat Perintah Membayar, Bendahara Penerimaan dan Bendahara Pengeluaran Bagian Anggaran 015 Di Lingkungan Kementerian Keuangan;'
      },
      {
        id: 'mng_4',
        nomor: 4,
        text: 'Peraturan Direktur Jenderal Perbendaharaan Nomor PER-16/PB/2020 tentang Hak Akses Pengguna dan Pengamanan Secara Elektronik dalam Piloting Sistem Aplikasi Keuangan Tingkat Instansi;'
      },
      {
        id: 'mng_5',
        nomor: 5,
        text: 'Peraturan perundang-undangan lainnya yang terkait dengan pengelolaan keuangan negara dan perbendaharaan.'
      }
    ],
    judulMemutuskan: 'MEMUTUSKAN:',
    menetapkan: `Keputusan Kepala ${namaSatker} Tentang Penetapan User Pejabat, Operator, dan Administrator Pengguna Aplikasi Sistem SAKTI Kantor ${namaSatker} Tahun Anggaran ${currentYear}.`,
    diktum: [
      {
        id: 'dik_1',
        label: 'PERTAMA',
        text: `Menunjuk Nama/NIP, Pangkat/Golongan, Jabatan, dan Peran User Pada Aplikasi SAKTI sebagaimana lampiran Surat Ketetapan sebagai User Pengguna Aplikasi SAKTI pada Kantor ${namaSatker}.`,
        isCustomizable: false
      },
      {
        id: 'dik_2',
        label: 'KEDUA',
        text: `Segala biaya yang timbul sebagai akibat ditetapkannya Keputusan ini dibebankan pada DIPA Kantor ${namaSatker} Tahun Anggaran ${currentYear}.`,
        isCustomizable: true
      },
      {
        id: 'dik_3',
        label: 'KETIGA',
        text: 'Pejabat/Pegawai yang ditunjuk sebagaimana dimaksud dalam Diktum Pertama, dalam melaksanakan kewenangannya harus memperhatikan ketentuan peraturan perundang-undangan.',
        isCustomizable: false
      },
      {
        id: 'dik_4',
        label: 'KEEMPAT',
        text: 'Surat Keputusan ini berlaku sejak tanggal ditetapkan dan apabila terdapat kekeliruan maka akan diadakan perbaikan sebagaimana mestinya.',
        isCustomizable: false
      }
    ],
    pejabat: {
      namaPejabat: kpaName || '',
      nipPejabat: kpaNip || '',
      jabatan: 'Kuasa Pengguna Anggaran',
      unitKerja: namaSatker
    },
    selectedUserIds: userList.map(u => u.id),
    hideInstructionPage: true, // Default true untuk dokumen final
    templateVersion: OFFICIAL_SK_TEMPLATE_VERSION,
    status: 'DRAFT',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    exportHistory: []
  };
}

export interface SkValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates SK Draft and included users before allowing Word/PDF export
 */
export function validateSkForExport(
  draft: SkSaktiDraft,
  allUsers: UserSaktiRecord[]
): SkValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!draft.nomorSk || !draft.nomorSk.trim()) {
    errors.push('Nomor Surat Keputusan (SK) wajib diisi.');
  }

  if (!draft.tahunAnggaran || !draft.tahunAnggaran.trim()) {
    errors.push('Tahun Anggaran wajib diisi (contoh: 2026).');
  }

  if (!draft.tanggalSk) {
    errors.push('Tanggal Surat Keputusan wajib dipilih.');
  }

  if (!draft.tempatPenetapan || !draft.tempatPenetapan.trim()) {
    errors.push('Tempat penetapan SK wajib diisi (contoh: Semarang).');
  }

  if (!draft.pejabat.namaPejabat || !draft.pejabat.namaPejabat.trim()) {
    errors.push('Nama pejabat penandatangan (KPA / Kepala Satker) wajib diisi.');
  }

  const cleanNipPejabat = (draft.pejabat.nipPejabat || '').replace(/\D/g, '');
  if (!cleanNipPejabat || cleanNipPejabat.length !== 18) {
    warnings.push(`NIP pejabat penandatangan disarankan 18 digit (saat ini ${cleanNipPejabat.length} digit).`);
  }

  if (draft.menimbang.length === 0) {
    errors.push('Poin Menimbang minimal harus memiliki 1 butir.');
  }

  if (draft.mengingat.length === 0) {
    errors.push('Dasar Hukum (Mengingat) minimal harus memiliki 1 peraturan.');
  }

  const selectedUsers = allUsers.filter(u => draft.selectedUserIds.includes(u.id));
  if (selectedUsers.length === 0) {
    errors.push('Lampiran SK wajib memuat minimal 1 (satu) user SAKTI.');
  }

  // Check each selected user
  selectedUsers.forEach((u, i) => {
    const userLabel = u.namaLengkap ? `User #${i + 1} (${u.namaLengkap})` : `User #${i + 1}`;
    if (!u.namaLengkap || !u.namaLengkap.trim()) {
      errors.push(`${userLabel}: Nama lengkap belum diisi.`);
    }
    const cleanNip = (u.nip || '').replace(/\D/g, '');
    if (cleanNip.length !== 18) {
      errors.push(`${userLabel}: NIP harus 18 digit angka (saat ini ${cleanNip.length} digit).`);
    }
    if (!u.pangkatGolongan || !u.pangkatGolongan.trim()) {
      warnings.push(`${userLabel}: Pangkat/Golongan disarankan diisi agar tabel lampiran lengkap.`);
    }
    if (!u.jabatan || !u.jabatan.trim()) {
      warnings.push(`${userLabel}: Jabatan dinas disarankan diisi.`);
    }
    if (!u.peranJabatan) {
      errors.push(`${userLabel}: Peran Jabatan (Approval / Validator / Operator / Admin) wajib dipilih.`);
    }
    if (!u.jabatanPerbendaharaan || !u.jabatanPerbendaharaan.trim()) {
      errors.push(`${userLabel}: Jabatan Perbendaharaan wajib diisi.`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
