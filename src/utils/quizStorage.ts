import * as XLSX from 'xlsx';
import { QuizPackage, QuizQuestion, QuizResultRecord, QuizAudience } from '../types/quiz';
import { safeLocalStorageGet, safeLocalStorageSet } from './safeStorage';
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  writeBatch 
} from 'firebase/firestore';
import { db } from '../lib/firebase';

const QUIZ_PACKAGES_STORAGE_KEY = 'kppn_quiz_packages_v1';
const QUIZ_RESULTS_STORAGE_KEY = 'kppn_quiz_results_v1';
const FIRESTORE_PACKAGES_COLLECTION = 'quiz_packages';
const FIRESTORE_RESULTS_COLLECTION = 'quiz_results';

/**
 * Checks whether a quiz package is currently open, scheduled for future, or expired.
 */
export function checkPackageScheduleStatus(pkg: QuizPackage): {
  isOpen: boolean;
  status: 'ACTIVE' | 'NOT_STARTED' | 'EXPIRED' | 'INACTIVE';
  label: string;
  details: string;
  badgeColor: string;
} {
  if (!pkg.isActive) {
    return {
      isOpen: false,
      status: 'INACTIVE',
      label: 'Nonaktif',
      details: 'Paket ditutup manual oleh Administrator.',
      badgeColor: 'bg-slate-500/20 text-slate-500 border-slate-400/40'
    };
  }

  if (!pkg.isScheduled || (!pkg.startAt && !pkg.endAt)) {
    return {
      isOpen: true,
      status: 'ACTIVE',
      label: 'Dibuka Bebas',
      details: 'Kuis terbuka setiap saat tanpa batasan waktu mulai/selesai.',
      badgeColor: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40'
    };
  }

  const now = new Date().getTime();
  const startTime = pkg.startAt ? new Date(pkg.startAt).getTime() : 0;
  const endTime = pkg.endAt ? new Date(pkg.endAt).getTime() : Infinity;

  if (startTime > 0 && now < startTime) {
    const startDateFormatted = new Date(pkg.startAt!).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    return {
      isOpen: false,
      status: 'NOT_STARTED',
      label: 'Belum Dibuka',
      details: `Kuis baru akan dibuka pada ${startDateFormatted} WIB.`,
      badgeColor: 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40'
    };
  }

  if (endTime < Infinity && now > endTime) {
    const endDateFormatted = new Date(pkg.endAt!).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    return {
      isOpen: false,
      status: 'EXPIRED',
      label: 'Sudah Ditutup',
      details: `Batas waktu pengerjaan telah berakhir pada ${endDateFormatted} WIB.`,
      badgeColor: 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/40'
    };
  }

  const endDateFormatted = pkg.endAt ? new Date(pkg.endAt).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }) : '';

  return {
    isOpen: true,
    status: 'ACTIVE',
    label: 'Sedang Berlangsung',
    details: endDateFormatted ? `Terbuka s.d. ${endDateFormatted} WIB` : 'Terbuka saat ini',
    badgeColor: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40'
  };
}

// Seed Initial Quiz Packages
export const SEED_QUIZ_PACKAGES: QuizPackage[] = [
  {
    id: 'quiz_ikpa_satker_01',
    title: 'Simulasi CAT Pemahaman Indikator IKPA & Regulasi Perbendaharaan 2026',
    description: 'Uji kompetensi interaktif pemahaman 8 indikator IKPA, deviasi Hal III DIPA, dispensasi SPM, dan optimalisasi penyerapan anggaran untuk Satuan Kerja mitra KPPN.',
    category: 'IKPA & Regulasi 2026',
    targetAudience: 'satker',
    durationMinutes: 15,
    passingGrade: 70,
    isActive: true,
    createdAt: '2026-01-15T08:00:00.000Z',
    updatedAt: '2026-03-01T10:00:00.000Z',
    questions: [
      {
        id: 'q_ikpa_01',
        number: 1,
        questionText: 'Berapakah batas deviasi maksimal antara realisasi bulanan dengan rencana penarikan dana pada Halaman III DIPA agar Satuan Kerja memperoleh nilai optimal pada indikator Deviasi Hal III DIPA?',
        optionA: 'Maksimal 5%',
        optionB: 'Maksimal 10%',
        optionC: 'Maksimal 15%',
        optionD: 'Maksimal 20%',
        correctAnswer: 'A',
        explanation: 'Sesuai regulasi IKPA (Perdirjen Perbendaharaan), deviasi bulanan yang ditoleransi untuk mendapatkan nilai maksimal adalah maksimal 5% pada masing-masing jenis belanja.',
        points: 10
      },
      {
        id: 'q_ikpa_02',
        number: 2,
        questionText: 'Berapa hari kerja batas waktu penyampaian SPM LS Kontraktual ke KPPN terhitung sejak Berita Acara Serah Terima (BAST) ditandatangani?',
        optionA: '5 hari kerja',
        optionB: '7 hari kerja',
        optionC: '14 hari kerja',
        optionD: '17 hari kerja',
        correctAnswer: 'D',
        explanation: 'Batas penyampaian SPM LS Kontraktual ke KPPN adalah paling lambat 17 hari kerja setelah penandatanganan Berita Acara Serah Terima (BAST).',
        points: 10
      },
      {
        id: 'q_ikpa_03',
        number: 3,
        questionText: 'Manakah dari pernyataan berikut mengenai pengajuan revisi DIPA yang TIDAK mengurangi nilai IKPA Indikator Revisi DIPA?',
        optionA: 'Revisi Pagu Berubah kewenangan Ditjen Anggaran',
        optionB: 'Revisi administratif perubahan pejabat perbendaharaan / KPA',
        optionC: 'Revisi reguler kewenangan Kanwil DJPb lebih dari 1 kali per triwulan',
        optionD: 'Revisi pergeseran anggaran antar program',
        correctAnswer: 'B',
        explanation: 'Revisi administratif (seperti perubahan nama KPA/PPK/Bendahara, ralat akun nonsignifikan, atau revisi POK kewenangan KPA) tidak dihitung sebagai faktor pengurang frekuensi revisi DIPA pada IKPA.',
        points: 10
      },
      {
        id: 'q_ikpa_04',
        number: 4,
        questionText: 'Pada indikator Pengelolaan UP dan TUP, berapa lama batas waktu pertanggungjawaban (revolving) UP Tunai sejak SPM-UP diterbitkan?',
        optionA: '15 hari kalender',
        optionB: '30 hari kalender (1 bulan)',
        optionC: '60 hari kalender',
        optionD: '90 hari kalender',
        correctAnswer: 'B',
        explanation: 'Satker wajib melakukan revolving/pertanggungjawaban UP sekurang-kurangnya 1 (satu) kali dalam 1 (satu) bulan (30 hari kalender) dengan persentase revolving minimal 50% dari besaran UP.',
        points: 10
      },
      {
        id: 'q_ikpa_05',
        number: 5,
        questionText: 'Kapan batas akhir waktu pelaporan Capaian Output (konfirmasi capaian rincian output) bulanan pada aplikasi SAKTI ke KPPN?',
        optionA: 'Hari kerja kelima bulan berikutnya',
        optionB: 'Hari kerja kesepuluh bulan berikutnya',
        optionC: 'Hari kerja kelima belas bulan berikutnya',
        optionD: 'Akhir bulan berjalan',
        correctAnswer: 'A',
        explanation: 'Pelaporan data Capaian Output pada aplikasi SAKTI wajib diselesaikan paling lambat pada hari kerja ke-5 (kelima) bulan berikutnya setelah bulan berkenaan berakhir.',
        points: 10
      },
      {
        id: 'q_ikpa_06',
        number: 6,
        questionText: 'Apa dampak penolakan SPM oleh KPPN terhadap nilai IKPA Satuan Kerja berkenaan?',
        optionA: 'Mengurangi nilai indikator Akurasi Surat Perintah Membayar (SPM)',
        optionB: 'Mengurangi nilai indikator Deviasi Halaman III DIPA',
        optionC: 'Mengurangi persentase realisasi anggaran belanja modal',
        optionD: 'Tidak berdampak apapun selama diajukan ulang di hari yang sama',
        correctAnswer: 'A',
        explanation: 'SPM yang ditolak (retur/reject) oleh KPPN secara langsung mengurangi skor pada indikator Pengurangan Retur SPM / Akurasi SPM.',
        points: 10
      },
      {
        id: 'q_ikpa_07',
        number: 7,
        questionText: 'Dalam pemanfaatan Kartu Kredit Pemerintah (KKP), transaksi pengadaan barang/jasa melalui KKP dipertanggungjawabkan menggunakan jenis SPM apa?',
        optionA: 'SPM-LS Non Kontraktual',
        optionB: 'SPM-GUP KKP',
        optionC: 'SPM-TUP Tunai',
        optionD: 'SPM-Nihil Non Anggaran',
        correctAnswer: 'B',
        explanation: 'Pertanggungjawaban tagihan pembayaran KKP dilakukan dengan penerbitan SPM-GUP KKP (Penggantian Uang Persediaan KKP) ke rekening bank penerbit KKP.',
        points: 10
      },
      {
        id: 'q_ikpa_08',
        number: 8,
        questionText: 'Berapakah target persentase penyerapan anggaran Triwulan I untuk Belanja Barang (52) yang diatur dalam target triwulanan?',
        optionA: '10%',
        optionB: '15%',
        optionC: '25%',
        optionD: '50%',
        correctAnswer: 'B',
        explanation: 'Target penyerapan anggaran belanja barang pada Triwulan I adalah minimal 15%, belanja modal 10%, belanja pegawai 20%, dan belanja bansos 25%.',
        points: 10
      },
      {
        id: 'q_ikpa_09',
        number: 9,
        questionText: 'Dokumen apakah yang wajib dilampirkan Satker jika penyampaian SPM terlambat melewati batas waktu jatuh tempo yang telah ditetapkan?',
        optionA: 'Surat Keputusan Menteri Keuangan',
        optionB: 'Surat Dispensasi dari Kepala Kantor Wilayah DJPb / Kepala KPPN',
        optionC: 'Nota Dinas dari PPK Satker',
        optionD: 'Surat Keterangan Lurah setempat',
        correctAnswer: 'B',
        explanation: 'Keterlambatan penyampaian SPM hanya dapat diproses KPPN apabila telah memperoleh Surat Persetujuan Dispensasi resmi dari Kepala Kantor Wilayah DJPb atau Kepala KPPN sesuai kewenangannya.',
        points: 10
      },
      {
        id: 'q_ikpa_10',
        number: 10,
        questionText: 'Siapakah pejabat perbendaharaan yang berwenang menandatangani dan menerbitkan Surat Perintah Membayar (SPM)?',
        optionA: 'Pejabat Pembuat Komitmen (PPK)',
        optionB: 'Pejabat Penandatangan Surat Perintah Membayar (PPSPM)',
        optionC: 'Bendahara Pengeluaran',
        optionD: 'Kuasa Pengguna Anggaran (KPA) merangkap Bendahara',
        correctAnswer: 'B',
        explanation: 'PPSPM (Pejabat Penandatangan Surat Perintah Membayar) bertugas menguji kebenaran SPP beserta dokumen pendukung dan menandatangani SPM untuk disampaikan ke KPPN.',
        points: 10
      }
    ]
  },
  {
    id: 'quiz_sakti_satker_02',
    title: 'Quiz Pengetahuan Operasional Modul Pembayaran & Bendahara SAKTI',
    description: 'Uji pemahaman alur kerja aplikasi SAKTI, pembuatan SPP/SPM, verifikasi OTP, dan penatausahaan LPJ Bendahara bagi Satker.',
    category: 'Operasional SAKTI',
    targetAudience: 'satker',
    durationMinutes: 10,
    passingGrade: 65,
    isActive: true,
    createdAt: '2026-02-01T08:00:00.000Z',
    updatedAt: '2026-03-01T10:00:00.000Z',
    questions: [
      {
        id: 'q_sakti_01',
        number: 1,
        questionText: 'Dalam aplikasi SAKTI, peran pejabat yang bertugas melakukan perekaman dokumen SPP (Surat Permintaan Pembayaran) adalah:',
        optionA: 'Operator Modul Pembayaran',
        optionB: 'Pejabat Pembuat Komitmen (PPK - Validator)',
        optionC: 'Pejabat Penandatangan SPM (PPSPM - Approver)',
        optionD: 'Admin Satker',
        correctAnswer: 'A',
        explanation: 'Perekaman tagihan/SPP dilakukan oleh Operator Modul Pembayaran, kemudian divalidasi/disetujui oleh PPK (Validator).',
        points: 10
      },
      {
        id: 'q_sakti_02',
        number: 2,
        questionText: 'Metode pengamanan autentikasi yang digunakan oleh PPSPM saat menyetujui dan mengirim SPM ke KPPN pada aplikasi SAKTI adalah:',
        optionA: 'Captcha Gambar',
        optionB: 'One-Time Password (OTP) SMS / WhatsApp / Email terdaftar',
        optionC: 'Tanda tangan basah yang di-scan',
        optionD: 'Fingerprint lokal',
        correctAnswer: 'B',
        explanation: 'Persetujuan dan pengiriman SPM oleh PPSPM menggunakan autentikasi digital OTP (One-Time Password) yang terverifikasi.',
        points: 10
      },
      {
        id: 'q_sakti_03',
        number: 3,
        questionText: 'Berapa batas waktu penyampaian Laporan Pertanggungjawaban (LPJ) Bendahara Pengeluaran ke KPPN setiap bulannya?',
        optionA: 'Paling lambat tanggal 5 bulan berikutnya',
        optionB: 'Paling lambat tanggal 10 bulan berikutnya',
        optionC: 'Paling lambat tanggal 15 bulan berikutnya',
        optionD: 'Paling lambat akhir bulan berikutnya',
        correctAnswer: 'B',
        explanation: 'LPJ Bendahara Pengeluaran dan Bendahara Penerimaan wajib disampaikan ke KPPN paling lambat tanggal 10 bulan berikutnya.',
        points: 10
      },
      {
        id: 'q_sakti_04',
        number: 4,
        questionText: 'Jika terjadi selisih kas pada Berita Acara Pemeriksaan Kas LPJ Bendahara, langkah pertama yang harus dilakukan adalah:',
        optionA: 'Mengubah angka pembukuan secara paksa',
        optionB: 'Menelusuri mutasi rekening koran dan pembukuan kas/buku pembantu untuk mencari penyebab selisih',
        optionC: 'Menutup rekening dinas di bank',
        optionD: 'Mengajukan surat pengunduran diri',
        correctAnswer: 'B',
        explanation: 'Bendahara harus melakukan rekonsiliasi internal antara buku kas umum, buku pembantu bank, dan rekening koran guna mengidentifikasi mutasi yang belum dibukukan.',
        points: 10
      },
      {
        id: 'q_sakti_05',
        number: 5,
        questionText: 'Status SPAN apakah yang menandakan dana SPM telah berhasil ditransfer ke rekening penerima/supplier?',
        optionA: 'SPM Diterima',
        optionB: 'SP2D Diterbitkan (Selesai Proses Bank / Buka Kas)',
        optionC: 'SPM Ditolak',
        optionD: 'SPM Menunggu Persetujuan',
        correctAnswer: 'B',
        explanation: 'Status SP2D Diterbitkan pada SPAN/MonSAKTI menandakan KPPN telah menerbitkan Surat Perintah Pencairan Dana ke bank operasional.',
        points: 10
      }
    ]
  },
  {
    id: 'quiz_kppn_internal_01',
    title: 'Uji Kompetensi & Kepatuhan Internal Pegawai KPPN Semarang I',
    description: 'Paket evaluasi khusus pegawai internal KPPN meliputi tugas Front Office/CSO, pengujian SPM, kepatuhan internal, dan kode etik ASN Kemenkeu.',
    category: 'KPPN Internal & Kepatuhan',
    targetAudience: 'kppn_internal',
    durationMinutes: 20,
    passingGrade: 75,
    isActive: true,
    createdAt: '2026-02-15T08:00:00.000Z',
    updatedAt: '2026-03-01T10:00:00.000Z',
    questions: [
      {
        id: 'q_kppn_01',
        number: 1,
        questionText: 'Sesuai Standar Operasional Prosedur (SOP) KPPN, berapakah jangka waktu penyelesaian penerbitan SP2D sejak SPM diterima lengkap dan benar oleh KPPN untuk SPM Gaji Induk?',
        optionA: 'Paling lambat 1 (satu) jam',
        optionB: 'Paling lambat 1 (satu) hari kerja',
        optionC: 'Paling lambat 2 (dua) hari kerja',
        optionD: 'Paling lambat 3 (tiga) hari kerja',
        correctAnswer: 'A',
        explanation: 'Layanan penerbitan SP2D di KPPN memiliki norma waktu standar pelayanan: untuk SPM Gaji Induk dan SPM Non-Gaji berstandar hitungan jam / 1 jam setelah pengujian verifikator selesai.',
        points: 10
      },
      {
        id: 'q_kppn_02',
        number: 2,
        questionText: 'Apa fungsi utama Seksi Manajemen Satker dan Kepatuhan Internal (MSKI) pada struktur organisasi KPPN Tipe A1?',
        optionA: 'Hanya mencetak laporan keuangan tahunan',
        optionB: 'Melakukan bimbingan teknis Satker, monitoring IKPA, pemantauan pengendalian intern, dan penegakan kode etik',
        optionC: 'Menyetujui SPM tanpa verifikasi dokumen',
        optionD: 'Mengelola persediaan logistik kantor semata',
        correctAnswer: 'B',
        explanation: 'Seksi MSKI bertugas membina satker (CSO/bimtek/monitoring IKPA) serta melaksanakan fungsi kepatuhan internal, pengendalian intern, dan pengawasan kode etik pegawai di lingkungan KPPN.',
        points: 10
      },
      {
        id: 'q_kppn_03',
        number: 3,
        questionText: 'Prinsip Segregation of Duties (Pemisahan Kewenangan) dalam pengelolaan perbendaharaan melarang perangkapan jabatan antara:',
        optionA: 'PPK dengan PPSPM atau Bendahara dengan PPK/PPSPM',
        optionB: 'KPA dengan Kepala Satuan Kerja',
        optionC: 'Staf pelaksana dengan operator komputer',
        optionD: 'Pengemudi dengan petugas keamanan',
        correctAnswer: 'A',
        explanation: 'Asas pemisahan kewenangan mutlak melarang PPK merangkap PPSPM, serta Bendahara merangkap PPK maupun PPSPM guna mencegah konflik kepentingan dan fraud.',
        points: 10
      },
      {
        id: 'q_kppn_04',
        number: 4,
        questionText: 'Sikap yang WAJIB diambil oleh pegawai KPPN apabila menerima pemberian bingkisan/hadiah dari Satuan Kerja terkait layanan pencairan dana adalah:',
        optionA: 'Menerima dengan senang hati karena dianggap tanda terima kasih',
        optionB: 'Menolak secara santun dan melaporkan ke Unit Pengendalian Gratifikasi (UPG) KPPN',
        optionC: 'Menerima lalu membagikannya ke staf lain tanpa melapor',
        optionD: 'Meminta tambahan hadiah uang tunai',
        correctAnswer: 'B',
        explanation: 'Seluruh insan perbendaharaan wajib menjunjung tinggi integritas Zona Integritas WBK/WBBM, menolak segala bentuk gratifikasi, dan melapor ke UPG.',
        points: 10
      },
      {
        id: 'q_kppn_05',
        number: 5,
        questionText: 'Dalam verifikasi data supplier pada SPAN, apakah yang menjadi parameter validasi utama nomor rekening penerima tagihan?',
        optionA: 'Nama bank, nomor rekening aktif, dan kesesuaian nama pemilik rekening pada sistem perbankan',
        optionB: 'Hanya warna buku tabungan',
        optionC: 'Alamat rumah pemilik rekening',
        optionD: 'Nomor plat kendaraan dinas Satker',
        correctAnswer: 'A',
        explanation: 'Validasi supplier SPAN memverifikasi keaktifan nomor rekening, kode bank, dan nama pemilik rekening secara elektronis dengan gateway perbankan.',
        points: 10
      }
    ]
  }
];

// Load All Packages from Local Cache
export function getQuizPackages(): QuizPackage[] {
  const raw = safeLocalStorageGet(QUIZ_PACKAGES_STORAGE_KEY);
  if (!raw) {
    safeLocalStorageSet(QUIZ_PACKAGES_STORAGE_KEY, JSON.stringify(SEED_QUIZ_PACKAGES));
    return SEED_QUIZ_PACKAGES;
  }
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.error('[QuizStorage] Error parsing stored packages:', err);
  }
  return SEED_QUIZ_PACKAGES;
}

// Subscribe to Quiz Packages in Real-Time (Firestore + Local fallback)
export function subscribeToQuizPackages(callback: (packages: QuizPackage[]) => void): () => void {
  // 1. Immediately invoke with cached packages
  const cached = getQuizPackages();
  callback(cached);

  if (!db) {
    return () => {};
  }

  try {
    const colRef = collection(db, FIRESTORE_PACKAGES_COLLECTION);
    const unsubscribe = onSnapshot(colRef, async (snapshot) => {
      if (!snapshot.empty) {
        const cloudPackages: QuizPackage[] = [];
        snapshot.forEach(docSnap => {
          cloudPackages.push(docSnap.data() as QuizPackage);
        });
        cloudPackages.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        safeLocalStorageSet(QUIZ_PACKAGES_STORAGE_KEY, JSON.stringify(cloudPackages));
        callback(cloudPackages);
      } else {
        // Seed default packages to Firestore if collection is empty
        try {
          const batch = writeBatch(db);
          SEED_QUIZ_PACKAGES.forEach(pkg => {
            const docRef = doc(db, FIRESTORE_PACKAGES_COLLECTION, pkg.id);
            batch.set(docRef, pkg);
          });
          await batch.commit();
        } catch (seedErr) {
          console.warn('[QuizStorage] Could not seed packages to Firestore:', seedErr);
        }
        callback(cached);
      }
    }, (error) => {
      console.warn('[QuizStorage] Firestore packages listener notice:', error);
      callback(getQuizPackages());
    });

    return unsubscribe;
  } catch (err) {
    console.warn('[QuizStorage] Error subscribing to packages:', err);
    return () => {};
  }
}

// Save Single Package (Local + Cloud Firestore)
export async function saveQuizPackage(pkg: QuizPackage): Promise<QuizPackage[]> {
  const packages = getQuizPackages();
  const existingIdx = packages.findIndex(p => p.id === pkg.id);
  const now = new Date().toISOString();
  
  const updatedPkg: QuizPackage = {
    ...pkg,
    updatedAt: now
  };

  let updatedList: QuizPackage[];
  if (existingIdx >= 0) {
    updatedList = [...packages];
    updatedList[existingIdx] = updatedPkg;
  } else {
    updatedPkg.createdAt = updatedPkg.createdAt || now;
    updatedList = [updatedPkg, ...packages];
  }

  // 1. Save local
  safeLocalStorageSet(QUIZ_PACKAGES_STORAGE_KEY, JSON.stringify(updatedList));

  // 2. Save to Firestore
  if (db) {
    try {
      await setDoc(doc(db, FIRESTORE_PACKAGES_COLLECTION, updatedPkg.id), updatedPkg, { merge: true });
    } catch (err) {
      console.warn('[QuizStorage] Could not save package to Firestore:', err);
    }
  }

  return updatedList;
}

// Delete Package (Local + Cloud Firestore)
export async function deleteQuizPackage(packageId: string): Promise<QuizPackage[]> {
  const packages = getQuizPackages();
  const updatedList = packages.filter(p => p.id !== packageId);
  safeLocalStorageSet(QUIZ_PACKAGES_STORAGE_KEY, JSON.stringify(updatedList));

  if (db) {
    try {
      await deleteDoc(doc(db, FIRESTORE_PACKAGES_COLLECTION, packageId));
    } catch (err) {
      console.warn('[QuizStorage] Could not delete package from Firestore:', err);
    }
  }

  return updatedList;
}

const QUIZ_DELETED_RESULTS_KEY = 'kppn_deleted_quiz_result_ids_v1';

function getDeletedResultIds(): Set<string> {
  const raw = safeLocalStorageGet(QUIZ_DELETED_RESULTS_KEY);
  if (!raw) return new Set();
  try {
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function addDeletedResultIds(ids: string[]): void {
  const current = getDeletedResultIds();
  ids.forEach(id => current.add(id));
  safeLocalStorageSet(QUIZ_DELETED_RESULTS_KEY, JSON.stringify(Array.from(current).slice(-2000)));
}

/**
 * Ranks quiz results based on CAT competition rules:
 * 1. Score (highest first)
 * 2. Completion speed / timeSpentSeconds (fastest first for ties)
 * 3. Submission date (earliest first)
 */
export function rankQuizResults(results: QuizResultRecord[]): (QuizResultRecord & { rank: number })[] {
  const sorted = [...results].sort((a, b) => {
    // 1. Highest score
    if ((b.score || 0) !== (a.score || 0)) {
      return (b.score || 0) - (a.score || 0);
    }
    // 2. Fastest speed (lowest timeSpentSeconds)
    if ((a.timeSpentSeconds || 0) !== (b.timeSpentSeconds || 0)) {
      return (a.timeSpentSeconds || 0) - (b.timeSpentSeconds || 0);
    }
    // 3. Earliest submission
    return new Date(a.completedAt || 0).getTime() - new Date(b.completedAt || 0).getTime();
  });

  return sorted.map((r, idx) => ({
    ...r,
    rank: idx + 1
  }));
}

// Quick helper to update schedule and active window for an exam package
export async function updatePackageSchedule(
  packageId: string,
  schedule: { isScheduled: boolean; startAt?: string; endAt?: string; isActive?: boolean }
): Promise<QuizPackage[]> {
  const packages = getQuizPackages();
  const pkg = packages.find(p => p.id === packageId);
  if (!pkg) return packages;
  const updatedPkg: QuizPackage = {
    ...pkg,
    ...schedule,
    updatedAt: new Date().toISOString()
  };
  return await saveQuizPackage(updatedPkg);
}

// Results Storage: Load from Local Cache
export function getQuizResults(): QuizResultRecord[] {
  const raw = safeLocalStorageGet(QUIZ_RESULTS_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const deleted = getDeletedResultIds();
    return parsed.filter(r => r && r.id && !deleted.has(r.id));
  } catch (err) {
    console.error('[QuizStorage] Error parsing results:', err);
    return [];
  }
}

// Subscribe to Quiz Results in Real-Time (Firestore + Local fallback)
export function subscribeToQuizResults(callback: (results: QuizResultRecord[]) => void): () => void {
  // 1. Immediately provide cached results
  const cached = getQuizResults();
  callback(cached);

  // 2. Custom local window event listener (for intra-session immediate updates)
  const handleLocalUpdate = () => {
    callback(getQuizResults());
  };
  window.addEventListener('kppn_quiz_results_updated', handleLocalUpdate);

  if (!db) {
    return () => {
      window.removeEventListener('kppn_quiz_results_updated', handleLocalUpdate);
    };
  }

  try {
    const colRef = collection(db, FIRESTORE_RESULTS_COLLECTION);
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const deletedIds = getDeletedResultIds();
      const cloudResults: QuizResultRecord[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data && data.id && !deletedIds.has(data.id)) {
          cloudResults.push(data as QuizResultRecord);
        }
      });

      // Merge with local results so recent submissions never disappear
      const localResults = getQuizResults();
      const mergedMap = new Map<string, QuizResultRecord>();
      localResults.forEach(r => {
        if (r && r.id && !deletedIds.has(r.id)) mergedMap.set(r.id, r);
      });
      cloudResults.forEach(r => {
        if (r && r.id && !deletedIds.has(r.id)) mergedMap.set(r.id, r);
      });

      const combined = Array.from(mergedMap.values());
      // Sort newest first for default list
      combined.sort((a, b) => new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime());
      
      // Update local cache with latest merged results
      safeLocalStorageSet(QUIZ_RESULTS_STORAGE_KEY, JSON.stringify(combined.slice(0, 1000)));
      callback(combined);
    }, (error) => {
      console.warn('[QuizStorage] Firestore results listener notice:', error);
      callback(getQuizResults());
    });

    return () => {
      unsubscribe();
      window.removeEventListener('kppn_quiz_results_updated', handleLocalUpdate);
    };
  } catch (err) {
    console.warn('[QuizStorage] Error subscribing to results:', err);
    return () => {
      window.removeEventListener('kppn_quiz_results_updated', handleLocalUpdate);
    };
  }
}

// Save Quiz Result (Local + Cloud Firestore for cross-device & real-time sync)
export async function saveQuizResult(result: QuizResultRecord): Promise<QuizResultRecord[]> {
  const results = getQuizResults();
  const filtered = results.filter(r => r.id !== result.id);
  const updated = [result, ...filtered].slice(0, 1000);
  
  // 1. Save local immediately
  safeLocalStorageSet(QUIZ_RESULTS_STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('kppn_quiz_results_updated'));

  // 2. Save to Firestore Cloud Collection
  if (db) {
    try {
      await setDoc(doc(db, FIRESTORE_RESULTS_COLLECTION, result.id), result, { merge: true });
    } catch (err) {
      console.warn('[QuizStorage] Could not persist quiz result to Firestore:', err);
    }
  }

  return updated;
}

// Delete a single Quiz Result by ID
export async function deleteQuizResult(resultId: string): Promise<QuizResultRecord[]> {
  addDeletedResultIds([resultId]);
  const results = getQuizResults();
  const updated = results.filter(r => r.id !== resultId);
  safeLocalStorageSet(QUIZ_RESULTS_STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('kppn_quiz_results_updated'));

  if (db) {
    try {
      await deleteDoc(doc(db, FIRESTORE_RESULTS_COLLECTION, resultId));
    } catch (err) {
      console.warn('[QuizStorage] Could not delete result from Firestore:', err);
    }
  }

  return updated;
}

// Clear all Quiz Results (optionally filtered by packageId to reset a specific exam contest)
export async function clearAllQuizResults(packageId?: string): Promise<QuizResultRecord[]> {
  const results = getQuizResults();
  let updated: QuizResultRecord[];
  let toDeleteIds: string[] = [];

  if (packageId) {
    toDeleteIds = results.filter(r => r.packageId === packageId).map(r => r.id);
    updated = results.filter(r => r.packageId !== packageId);
  } else {
    toDeleteIds = results.map(r => r.id);
    updated = [];
  }

  addDeletedResultIds(toDeleteIds);
  safeLocalStorageSet(QUIZ_RESULTS_STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('kppn_quiz_results_updated'));

  if (db) {
    try {
      // Delete in batches of 400
      const batchSize = 400;
      for (let i = 0; i < toDeleteIds.length; i += batchSize) {
        const batch = writeBatch(db);
        const chunk = toDeleteIds.slice(i, i + batchSize);
        chunk.forEach(id => {
          batch.delete(doc(db, FIRESTORE_RESULTS_COLLECTION, id));
        });
        await batch.commit();
      }
    } catch (err) {
      console.warn('[QuizStorage] Could not clear results from Firestore:', err);
    }
  }

  return updated;
}

// ============================================================================
// EXCEL TEMPLATE GENERATION & EXCEL PARSER FOR QUIZ QUESTIONS
// ============================================================================

/**
 * Generates an Excel Template for importing CAT Quiz Questions
 */
export function generateQuizExcelTemplate(packageTitle: string = 'Simulasi CAT'): void {
  const wb = XLSX.utils.book_new();

  // Header and sample rows
  const wsData = [
    [
      'No',
      'Pertanyaan / Soal',
      'Pilihan A',
      'Pilihan B',
      'Pilihan C',
      'Pilihan D',
      'Kunci Jawaban (A/B/C/D)',
      'Pembahasan / Penjelasan Materi'
    ],
    [
      1,
      'Berapa toleransi deviasi maksimal pada Halaman III DIPA agar nilai IKPA tetap optimal?',
      'Maksimal 5%',
      'Maksimal 10%',
      'Maksimal 15%',
      'Maksimal 20%',
      'A',
      'Sesuai ketentuan IKPA terbaru, deviasi maksimal rencana penarikan bulanan adalah 5% per jenis belanja.'
    ],
    [
      2,
      'Berapa batas waktu penyampaian SPM LS Kontraktual ke KPPN setelah penandatanganan BAST?',
      '5 hari kerja',
      '10 hari kerja',
      '14 hari kerja',
      '17 hari kerja',
      'D',
      'Batas pengajuan SPM LS Kontraktual ke KPPN paling lambat 17 hari kerja sejak BAST ditandatangani.'
    ],
    [
      3,
      'Kapan batas waktu penyampaian LPJ Bendahara Pengeluaran ke KPPN setiap bulannya?',
      'Tanggal 5 bulan berikutnya',
      'Tanggal 10 bulan berikutnya',
      'Tanggal 15 bulan berikutnya',
      'Tanggal 20 bulan berikutnya',
      'B',
      'Penyampaian LPJ Bendahara wajib dikirim ke KPPN paling lambat tanggal 10 bulan berikutnya.'
    ]
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Column Widths
  ws['!cols'] = [
    { wch: 6 },   // No
    { wch: 60 },  // Soal
    { wch: 30 },  // A
    { wch: 30 },  // B
    { wch: 30 },  // C
    { wch: 30 },  // D
    { wch: 25 },  // Kunci
    { wch: 50 }   // Pembahasan
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Template Soal CAT');

  // Second Sheet: Petunjuk Pengisian
  const petunjukData = [
    ['PANDUAN & PETUNJUK FORMAT EXCEL SOAL CAT KPPN'],
    [''],
    ['1. Jangan mengubah nama kolom pada baris pertama (Header).'],
    ['2. Kolom "Kunci Jawaban (A/B/C/D)" WAJIB diisi salah satu huruf kapital: A, B, C, atau D.'],
    ['3. Kolom "Pertanyaan / Soal" tidak boleh kosong.'],
    ['4. Keempat pilihan jawaban (Pilihan A, B, C, D) wajib diisi lengkap.'],
    ['5. Kolom "Pembahasan / Penjelasan Materi" bersifat opsional namun sangat dianjurkan untuk edukasi peserta.'],
    ['6. Simpan file dalam format .xlsx dan upload pada menu Kelola Paket Soal Admin.']
  ];
  const wsPetunjuk = XLSX.utils.aoa_to_sheet(petunjukData);
  XLSX.utils.book_append_sheet(wb, wsPetunjuk, 'Petunjuk Pengisian');

  const cleanTitle = packageTitle.replace(/[^a-zA-Z0-9_-]/g, '_');
  XLSX.writeFile(wb, `Template_Soal_CAT_${cleanTitle}.xlsx`);
}

/**
 * Parses an uploaded Excel file and returns validated QuizQuestion list
 */
export async function parseQuizQuestionsFromExcel(file: File): Promise<{
  success: boolean;
  questions: QuizQuestion[];
  errors: string[];
}> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const sheetName = wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (!rawJson || rawJson.length < 2) {
          resolve({
            success: false,
            questions: [],
            errors: ['File Excel kosong atau tidak memiliki baris data soal.']
          });
          return;
        }

        const headers: string[] = (rawJson[0] || []).map((h: any) => String(h || '').trim().toLowerCase());

        // Find column indices
        const findColIdx = (keywords: string[]) => {
          return headers.findIndex(h => keywords.some(k => h.includes(k)));
        };

        const idxSoal = findColIdx(['pertanyaan', 'soal', 'soal / pertanyaan']);
        const idxA = findColIdx(['pilihan a', 'opsi a', 'a']);
        const idxB = findColIdx(['pilihan b', 'opsi b', 'b']);
        const idxC = findColIdx(['pilihan c', 'opsi c', 'c']);
        const idxD = findColIdx(['pilihan d', 'opsi d', 'd']);
        const idxKunci = findColIdx(['kunci', 'jawaban', 'kunci jawaban']);
        const idxPembahasan = findColIdx(['pembahasan', 'penjelasan', 'keterangan']);

        const errors: string[] = [];
        const parsedQuestions: QuizQuestion[] = [];

        for (let i = 1; i < rawJson.length; i++) {
          const row = rawJson[i];
          if (!row || row.length === 0) continue;

          // Default fallback columns if headers not found by name
          const questionText = String(row[idxSoal >= 0 ? idxSoal : 1] || '').trim();
          if (!questionText) continue; // skip blank row

          const optionA = String(row[idxA >= 0 ? idxA : 2] || '').trim();
          const optionB = String(row[idxB >= 0 ? idxB : 3] || '').trim();
          const optionC = String(row[idxC >= 0 ? idxC : 4] || '').trim();
          const optionD = String(row[idxD >= 0 ? idxD : 5] || '').trim();
          const rawKunci = String(row[idxKunci >= 0 ? idxKunci : 6] || '').trim().toUpperCase();
          const explanation = String(row[idxPembahasan >= 0 ? idxPembahasan : 7] || '').trim();

          let validatedKunci: 'A' | 'B' | 'C' | 'D' = 'A';
          if (['A', 'B', 'C', 'D'].includes(rawKunci)) {
            validatedKunci = rawKunci as 'A' | 'B' | 'C' | 'D';
          } else {
            errors.push(`Baris ke-${i + 1}: Kunci jawaban "${rawKunci}" tidak valid (harus A, B, C, atau D). Menggunakan default A.`);
          }

          if (!optionA || !optionB) {
            errors.push(`Baris ke-${i + 1}: Pilihan A atau B tidak boleh kosong.`);
            continue;
          }

          parsedQuestions.push({
            id: `q_${Date.now()}_${i}`,
            number: parsedQuestions.length + 1,
            questionText,
            optionA,
            optionB,
            optionC: optionC || '-',
            optionD: optionD || '-',
            correctAnswer: validatedKunci,
            explanation: explanation || undefined,
            points: 10
          });
        }

        if (parsedQuestions.length === 0) {
          resolve({
            success: false,
            questions: [],
            errors: errors.length > 0 ? errors : ['Tidak ada soal yang berhasil dibaca dari file Excel. Pastikan format kolom sesuai template.']
          });
          return;
        }

        resolve({
          success: true,
          questions: parsedQuestions,
          errors
        });
      } catch (err: any) {
        resolve({
          success: false,
          questions: [],
          errors: [`Gagal membaca file Excel: ${err?.message || 'Format tidak didukung'}`]
        });
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Exports participants' quiz submissions to Excel
 */
export function exportQuizResultsToExcel(results: QuizResultRecord[]): void {
  const wb = XLSX.utils.book_new();

  const data = [
    [
      'No',
      'Nama Peserta',
      'Satker / Unit Kerja',
      'Paket Ujian CAT',
      'Kategori',
      'Target Audiens',
      'Total Soal',
      'Benar',
      'Salah',
      'Kosong',
      'Skor Akhir (0-100)',
      'Status Kelulusan',
      'Durasi Pengerjaan',
      'Waktu Selesai'
    ],
    ...results.map((r, idx) => {
      const minutes = Math.floor(r.timeSpentSeconds / 60);
      const seconds = r.timeSpentSeconds % 60;
      return [
        idx + 1,
        r.participantName,
        r.satkerOrUnit,
        r.packageTitle,
        r.category,
        r.targetAudience === 'kppn_internal' ? 'KPPN Internal' : 'Mitra Satker',
        r.totalQuestions,
        r.correctCount,
        r.wrongCount,
        r.unansweredCount,
        r.score,
        r.passed ? 'LULUS' : 'TIDAK LULUS',
        `${minutes}m ${seconds}d`,
        new Date(r.completedAt).toLocaleString('id-ID')
      ];
    })
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [
    { wch: 6 },
    { wch: 25 },
    { wch: 30 },
    { wch: 35 },
    { wch: 20 },
    { wch: 16 },
    { wch: 12 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 22 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Hasil Ujian CAT');
  XLSX.writeFile(wb, `Rekap_Hasil_Simulasi_CAT_${new Date().toISOString().split('T')[0]}.xlsx`);
}
