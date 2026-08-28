import { BuletinConfig } from '../types';

export interface BuletinMonthPreset {
  id: string;
  monthIndex: number; // 1 - 12
  monthName: string; // e.g. "Januari", "Februari", etc.
  quarter: 'TW I' | 'TW II' | 'TW III' | 'TW IV';
  edisi: string;
  periodeLabel: string;
  themeTitle: string;
  subTitle: string;
  config: Partial<BuletinConfig>;
}

export const OFFICIAL_PRESET_IMAGES = {
  kepalaKantor: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=600',
  coverBuletin: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1200',
  narasumberSatker: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=600',
  kegiatanSatker: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=800',
  capacityBuilding1: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800',
  capacityBuilding2: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&q=80&w=800',
  purnabakti: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800',
  riverTubing: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=800',
  pagelaranBudaya: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=800',
  umkmBinaan: 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&q=80&w=800',
  kotaLama: 'https://images.unsplash.com/photo-1596401057633-54a8fe8ef647?auto=format&fit=crop&q=80&w=800',
  lawangSewu: 'https://images.unsplash.com/photo-1590073844006-33379778ae09?auto=format&fit=crop&q=80&w=800',
  gedungKppn: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800'
};

export const BULETIN_MONTH_PRESETS: BuletinMonthPreset[] = [
  {
    id: 'preset_januari',
    monthIndex: 1,
    monthName: 'Januari',
    quarter: 'TW I',
    edisi: 'EDISI 1 | JANUARI 2026',
    periodeLabel: 'Januari 2026 (Awal Tahun Anggaran)',
    themeTitle: 'AKSELERASI AWAL TAHUN: KICK-OFF DIPA & PENETAPAN PEJABAT PERBENDAHARAAN',
    subTitle: 'Penguatan Perencanaan Anggaran, Tertib Administrasi SAKTI, dan Percepatan SPM Perdana',
    config: {
      namaBuletin: 'WARTA SEMARANG SATU',
      taglineBuletin: 'Mengawal Kinerja Fiskal & Tata Kelola Keuangan Prima di Wilayah KPPN Semarang I',
      sambutanKepala: 'Selamat mengawali Tahun Anggaran 2026. Momentum awal tahun ini adalah pondasi krusial bagi keberhasilan seluruh program kerja. KPPN Tipe A1 Semarang I siap mendampingi setiap Satker dalam percepatan penetapan SK Pejabat Perbendaharaan, penyusunan RPD Halaman III DIPA yang presisi, serta penerbitan SPM perdana tanpa kendala teknis.',
      tajukRencana: 'Fokus bulan Januari diarahkan pada mitigasi dini deviasi Halaman III DIPA. Pengalaman tahun-tahun sebelumnya membuktikan bahwa satker yang disiplin memetakan rencana penarikan dana sejak bulan pertama akan konsisten mengamankan nilai IKPA di atas 95.00 hingga akhir tahun.',
      wawancaraSatker: {
        judul: 'Kiat Satker Mengamankan SPM Gaji Induk & Tagihan Kontraktual Awal Tahun',
        narasumber: 'Drs. Supriyadi, M.M.',
        jabatan: 'Kepala Bagian Keuangan / PPK',
        satker: 'Polda Jawa Tengah - Satker Terpadu Semarang',
        isiWawancara: 'Sejak minggu pertama Januari, kami langsung mengunci SK Pengelola Perbendaharaan di SAKTI dan menyelesaikan pendaftaran user OTP. Koordinasi intensif dengan Helpdesk KPPN Semarang I memungkinkan pengajuan SPM Gaji Induk dan UP berjalan zero defect.',
        isiWawancara2: 'Kami juga melakukan review menyeluruh terhadap paket pengadaan barang/jasa agar lelang dini dapat segera dieksekusi sebelum akhir triwulan I, sehingga serapan belanja modal tidak menumpuk di semester II.',
        kutipanPenting: 'Awal tahun yang terencana dengan baik adalah kunci 90% keberhasilan pengelolaan anggaran sepanjang tahun.',
        prestasiSatker: 'Peringkat 1 Satker Tercepat Penyelesaian Administrasi Awal Tahun TA 2026.'
      },
      sarwaSarwi: {
        judul: 'Semangat Baru Mengawal APBN 2026',
        temaKegiatan: 'Rapat Koordinasi Pembinaan Integritas & Kick-off Layanan Prima KPPN Semarang I',
        tanggal: '15 Januari 2026',
        lokasi: 'Aula Sumbing KPPN Semarang I',
        ceritaBagian1: 'Memasuki pekan kedua Januari, seluruh jajaran pegawai KPPN Semarang I menyatukan tekad melalui Rapat Koordinasi dan Penandatanganan Pakta Integritas 2026.',
        ceritaBagian2: 'Kepala Kantor menekankan pentingnya responsivitas tanpa batas waktu dalam melayani konsultasi SAKTI bagi satker mitra demi menjamin kelancaran pencairan dana APBN.',
        ceritaBagian3Purnabakti: 'Dalam kesempatan ini juga diserahkan piagam penghargaan loyalitas kepada para pegawai senior yang telah mengabdi lebih dari 25 tahun di Ditjen Perbendaharaan.',
        ceritaBagian4RiverTubing: 'Sesi ramah tamah ditutup dengan makan siang bersama dan penyusunan komitmen bersama menuju predikat Wilayah Birokrasi Bersih dan Melayani (WBBM).',
        pesanKepala: 'Jadikan setiap detik pelayanan kita sebagai ibadah dan pengabdian tulus bagi kemakmuran rakyat Indonesia.'
      }
    }
  },
  {
    id: 'preset_maret',
    monthIndex: 3,
    monthName: 'Maret',
    quarter: 'TW I',
    edisi: 'EDISI 3 | TW.I/2026',
    periodeLabel: 'Triwulan I 2026 (Penutupan TW I)',
    themeTitle: 'EVALUASI TRIWULAN I: AKSELERASI TARGET REALISASI 20% & PENGUATAN IKPA',
    subTitle: 'Pengawalan Kualitas Belanja Modal, Tertib Rekonsiliasi SAKTI, & Realisasi TKD Kota Semarang',
    config: {
      namaBuletin: 'WARTA SEMARANG SATU',
      taglineBuletin: 'Publikasi Kinerja Anggaran & Kiprah Perbendaharaan Wilayah KPPN Semarang I',
      sambutanKepala: 'Puji syukur kita panjatkan ke hadirat Tuhan Yang Maha Esa. Triwulan I TA 2026 telah kita lewati dengan capaian yang membanggakan. Penyerapan belanja negara di lingkup KPPN Semarang I berhasil melampaui target triwulanan nasional berkat sinergi erat seluruh Satker dan Pemda mitra kerja.',
      tajukRencana: 'Triwulan I menjadi tolok ukur efektivitas eksekusi program. Evaluasi menyeluruh dilakukan terhadap satker dengan deviasi Halaman III DIPA di atas 5% dan keterlambatan pendaftaran kontrak pengadaan barang/jasa.',
      wawancaraSatker: {
        judul: 'Strategi Mengunci Nilai IKPA 100 & Zero Retur SP2D pada Triwulan I',
        narasumber: 'Budi Santoso, S.E., Ak.',
        jabatan: 'Pejabat Pembuat Komitmen (PPK)',
        satker: 'Politeknik Ilmu Pelayaran (PIP) Semarang',
        isiWawancara: 'Kunci keberhasilan kami adalah melakukan rekonsiliasi internal setiap hari Jumat serta memastikan data suplier dan nomor rekening penerima telah divalidasi ke bank sebelum penerbitan SPM.',
        isiWawancara2: 'Kami juga memaksimalkan transaksi non-tunai melalui KKP (Kartu Kredit Pemerintah) dan Digipay Satu untuk belanja operasional kantor, sehingga pengelolaan UP/TUP selalu tertib dan tepat waktu.',
        kutipanPenting: 'Disiplin rekonsiliasi dan koordinasi harian dengan KPPN Semarang I menghindarkan satker dari potensi retur SP2D.',
        prestasiSatker: 'Peraih Nilai IKPA Sempurna 100.00 Kategori Pagu Sedang Periode Triwulan I 2026.'
      },
      sarwaSarwi: {
        judul: 'Capacity Building & Peningkatan Sinergi Tim',
        temaKegiatan: 'Outbound Insan Perbendaharaan: Sinergi dan Kolaborasi Tingkatkan Prestasi',
        tanggal: '20 Maret 2026',
        lokasi: 'Kawasan Wisata Bandungan, Kab. Semarang',
        ceritaBagian1: 'Guna menyegarkan semangat kerja dan mempererat rasa kekeluargaan, KPPN Semarang I menyelenggarakan Capacity Building bagi seluruh pejabat, fungsional, pelaksana, dan PPNPN.',
        ceritaBagian2: 'Rangkaian permainan kerja tim melatih fokus, kecepatan adaptasi, dan kepemimpinan kolektif di tengah derasnya dinamika regulasi perbendaharaan.',
        ceritaBagian3Purnabakti: 'Suasana haru menyelimuti saat pelepasan pegawai purnabakti yang telah mendedikasikan tenaga dan pikiran terbaiknya untuk negeri.',
        ceritaBagian4RiverTubing: 'Keseruan river tubing di aliran sungai pegunungan menjadi puncak kebersamaan yang tak terlupakan bagi seluruh insan KPPN Semarang I.',
        pesanKepala: 'Kekompakan di lapangan adalah cerminan soliditas kita dalam memberikan pelayanan prima di loket dan sistem perbendaharaan.'
      }
    }
  },
  {
    id: 'preset_juni',
    monthIndex: 6,
    monthName: 'Juni',
    quarter: 'TW II',
    edisi: 'EDISI 6 | SEMESTER I/2026',
    periodeLabel: 'Juni 2026 (Penutupan Semester I & Gaji 13)',
    themeTitle: 'KONSOLIDASI SEMESTER I: SUKSES PENYALURAN GAJI KE-13 & AKSIS BELANJA MODAL',
    subTitle: 'Penguatan Efektivitas APBN sebagai Shock Absorber Ekonomi & Akselerasi Digitalisasi Digipay Satu',
    config: {
      namaBuletin: 'WARTA SEMARANG SATU',
      taglineBuletin: 'Kiprah Perbendaharaan & Kinerja APBN Wilayah KPPN Semarang I',
      sambutanKepala: 'Memasuki penghujung Semester I TA 2026, KPPN Semarang I berhasil menuntaskan penyaluran Gaji dan Tunjangan Ke-13 bagi seluruh aparatur negara, prajurit TNI, anggota Polri, dan pensiunan secara tepat waktu, tepat jumlah, dan tanpa kendala. Hal ini memberikan dorongan daya beli signifikan bagi masyarakat Kota Semarang.',
      tajukRencana: 'Semester I adalah momentum evaluasi paruh waktu. Penyerapan belanja barang dan modal terus dipacu untuk mendukung percepatan proyek-proyek strategis daerah sebelum memasuki triwulan III.',
      wawancaraSatker: {
        judul: 'Akselerasi Pengadaan Digital & Transparansi Belanja Melalui Digipay Satu',
        narasumber: 'Hj. Endang Rahayu, S.Sos., M.Si.',
        jabatan: 'Bendahara Pengeluaran',
        satker: 'Universitas Diponegoro (Undip) - Satker Mitra KPPN',
        isiWawancara: 'Implementasi Digipay Satu memberikan kemudahan luar biasa dalam memberdayakan UMKM lokal sekitar kampus sekaligus memastikan transparansi perpajakan otomatis terpotong langsung oleh sistem perbankan.',
        isiWawancara2: 'Kami rutin berkonsultasi dengan CSO KPPN Semarang I setiap kali ada pembaruan modul pembayaran dan komitmen anggaran di aplikasi SAKTI.',
        kutipanPenting: 'Digitalisasi belanja bukan hanya tentang kepraktisan, melainkan tentang akuntabilitas dan keberpihakan pada UMKM lokal.',
        prestasiSatker: 'Juara 1 Transaksi Digipay Satu Terbanyak Wilayah Pembayaran KPPN Semarang I.'
      },
      sarwaSarwi: {
        judul: 'Semarak Hari Bakti Perbendaharaan & Donor Darah',
        temaKegiatan: 'Bakti Sosial Kemenkeu Satu: Peduli Sesama, Mengabdi untuk Bangsa',
        tanggal: '10 Juni 2026',
        lokasi: 'Gedung Keuangan Negara (GKN) Semarang',
        ceritaBagian1: 'Dalam rangka memperingati Hari Bakti Perbendaharaan, jajaran KPPN Semarang I berkolaborasi dengan unit vertikal Kemenkeu Satu menggelar aksi donor darah dan pembagian sembako bagi warga sekitar.',
        ceritaBagian2: 'Ratusan kantong darah berhasil dihimpun untuk disalurkan melalui PMI Kota Semarang guna membantu pasien yang membutuhkan.',
        ceritaBagian3Purnabakti: 'Kegiatan dilanjutkan dengan temu alumni dan silaturahmi purnabakti Ditjen Perbendaharaan yang berlangsung penuh kehangatan.',
        ceritaBagian4RiverTubing: 'Bazar kuliner binaan UMKM KPPN turut memeriahkan suasana dengan transaksi non-tunai QRIS.',
        pesanKepala: 'Insan perbendaharaan harus senantiasa hadir memberi manfaat nyata bagi masyarakat di sekitar kita.'
      }
    }
  },
  {
    id: 'preset_agustus',
    monthIndex: 8,
    monthName: 'Agustus',
    quarter: 'TW III',
    edisi: 'EDISI 8 | AGUSTUS 2026',
    periodeLabel: 'Agustus 2026 (Semarak Kemerdekaan RI)',
    themeTitle: 'GELORA KEMERDEKAAN: APBN UNTUK KEDAULATAN EKONOMI & KESEJAHTERAAN RAKYAT',
    subTitle: 'Pengawalan Belanja Bantuan Sosial, Sinergi TKD, & Pemberdayaan UMKM Kemenkeu Satu',
    config: {
      namaBuletin: 'WARTA SEMARANG SATU',
      taglineBuletin: 'Mengawal Kinerja Fiskal & Tata Kelola Keuangan Prima di Wilayah KPPN Semarang I',
      sambutanKepala: 'Dirgahayu Republik Indonesia ke-81. Semangat kemerdekaan menginspirasi KPPN Semarang I untuk terus mengawal setiap rupiah dana APBN agar benar-benar dirasakan manfaatnya oleh seluruh lapisan masyarakat, mulai dari penyaluran bantuan sosial hingga dukungan fasilitas pembiayaan UMKM.',
      tajukRencana: 'Di bulan kemerdekaan ini, fokus perbendaharaan tertuju pada optimalisasi belanja yang berdampak langsung pada pengentasan kemiskinan ekstrem dan penurunan stunting di wilayah Kota Semarang dan sekitarnya.',
      wawancaraSatker: {
        judul: 'Penyaluran Bantuan Sosial & Pemenuhan Layanan Dasar Berbasis SAKTI',
        narasumber: 'Dra. Sri Wahyuni, M.Pd.',
        jabatan: 'KPA / Kepala Kantor',
        satker: 'Kementerian Agama Kota Semarang',
        isiWawancara: 'Penyaluran dana Bantuan Operasional Sekolah (BOS) dan tunjangan profesi guru madrasah berjalan lancar berkat percepatan verifikasi SPM oleh KPPN Semarang I.',
        isiWawancara2: 'Kami selalu mengedepankan prinsip kehati-hatian dan kepatuhan regulasi agar dana APBN tepat sasaran bagi anak didik dan pendidik.',
        kutipanPenting: 'Layanan pencairan SPM yang cepat di KPPN Semarang I sangat membantu kelancaran operasional pendidikan di daerah.',
        prestasiSatker: 'Predikat Kepatuhan Penyampaian Laporan Pertanggungjawaban (LPJ) Bendahara Tepat Waktu 100%.'
      },
      sarwaSarwi: {
        judul: 'Pesta Rakyat & Lomba Kemerdekaan Insan KPPN',
        temaKegiatan: 'Semarak 17 Agustus: Kebersamaan dalam Keberagaman Menuju Nusantara Maju',
        tanggal: '17 Agustus 2026',
        lokasi: 'Halaman Kantor KPPN Semarang I',
        ceritaBagian1: 'Upacara bendera peringatan HUT Kemerdekaan RI berlangsung khidmat dengan mengenakan busana adat nusantara dari berbagai penjuru tanah air.',
        ceritaBagian2: 'Kegiatan dilanjutkan dengan aneka lomba tradisional yang memicu gelak tawa dan keakraban antar seksi dan subbagian.',
        ceritaBagian3Purnabakti: 'Para purnabakti yang hadir turut memberikan motivasi dan wejangan bagi para pegawai muda perbendaharaan.',
        ceritaBagian4RiverTubing: 'Penyerahan hadiah lomba dan panggung hiburan musik akustik menutup perayaan dengan semarak.',
        pesanKepala: 'Pertahankan kemerdekaan dengan integritas kerja yang tak tergoyahkan dan dedikasi tiada henti.'
      }
    }
  },
  {
    id: 'preset_november',
    monthIndex: 11,
    monthName: 'November',
    quarter: 'TW IV',
    edisi: 'EDISI 11 | LLAT/2026',
    periodeLabel: 'November 2026 (Langkah-Langkah Akhir Tahun)',
    themeTitle: 'PANDUAN LANGKAH AKHIR TAHUN (LLAT): TERTIB BAST & PENGAWALAN SP2D 24/7',
    subTitle: 'Pedoman Batas Waktu Pengajuan SPM, Rekonsiliasi LPJ, & Mitigasi Penumpukan Akhir Tahun',
    config: {
      namaBuletin: 'WARTA SEMARANG SATU',
      taglineBuletin: 'Kiprah Perbendaharaan & Kinerja APBN Wilayah KPPN Semarang I',
      sambutanKepala: 'Memasuki masa krusial Langkah-Langkah Akhir Tahun (LLAT) TA 2026, KPPN Semarang I membuka layanan asistensi intensif untuk memastikan seluruh tagihan kontraktual dan belanja modal terselesaikan dengan tertib sesuai batas waktu yang telah ditetapkan dalam Perdirjen Perbendaharaan.',
      tajukRencana: 'Kunci sukses penutupan anggaran adalah kepatuhan terhadap jadwal pengajuan SPM kontraktual, pendaftaran BAST/BAPP bertahap, serta penertiban sisa UP/TUP agar tidak terjadi kegagalan pencairan di detik-detik terakhir.',
      wawancaraSatker: {
        judul: 'Strategi Eksekusi Belanja Modal Fisik & Pengawalan BAST Tanpa Keterlambatan',
        narasumber: 'Ir. Hendro Wijayanto, S.T., M.T.',
        jabatan: 'PPK Proyek Infrastruktur',
        satker: 'Balai Besar Pelaksanaan Jalan Nasional (BBPJN) Jateng-DIY',
        isiWawancara: 'Kami membentuk tim pemantau harian progres fisik lapangan untuk memastikan berita acara serah terima (BAST) diterbitkan tepat waktu sebelum batas cut-off LLAT KPPN.',
        isiWawancara2: 'Koordinasi real-time melalui grup WhatsApp Helpdesk KPPN Semarang I sangat membantu kami mengantisipasi potensi penolakan SPM akibat kesalahan akun atau data supplier.',
        kutipanPenting: 'Tidak menunda pengajuan SPM hingga batas akhir adalah bentuk profesionalisme dan pencegahan risiko gagal bayar.',
        prestasiSatker: 'Satker dengan Serapan Belanja Modal Terbesar dan Tertib BAST TA 2026.'
      },
      sarwaSarwi: {
        judul: 'Posko Siaga LLAT 2026 KPPN Semarang I',
        temaKegiatan: 'Pelayanan Sepenuh Hati: Mengawal Tutup Tahun Anggaran Tanpa Cela',
        tanggal: '25 November 2026',
        lokasi: 'Front Office & Ruang Konsultasi KPPN Semarang I',
        ceritaBagian1: 'KPPN Semarang I mengaktifkan Posko Siaga LLAT dengan layanan konsultasi terpadu hingga malam hari untuk memandu satker yang memiliki SPM volume besar.',
        ceritaBagian2: 'Tim Seksi Pencairan Dana dan Verifikasi Akuntansi bersiaga melakukan pengecekan berkas dan penyelesaian konfirmasi SP2D secara cepat dan akurat.',
        ceritaBagian3Purnabakti: 'Dukungan logistik dan vitamin bagi petugas piket disiapkan demi menjaga kebugaran insan perbendaharaan.',
        ceritaBagian4RiverTubing: 'Suasana kerja yang profesional dan penuh keramahan membuat para pengelola keuangan satker merasa nyaman dalam menyelesaikan kewajiban anggarannya.',
        pesanKepala: 'Terima kasih atas kerja keras tanpa lelah seluruh tim. Mari kita kawal penutupan tahun anggaran ini dengan rekor terbaik.'
      }
    }
  },
  {
    id: 'preset_desember',
    monthIndex: 12,
    monthName: 'Desember',
    quarter: 'TW IV',
    edisi: 'EDISI 12 | PARIPURNA/2026',
    periodeLabel: 'Desember 2026 (Tutup Buku & Laporan Keuangan)',
    themeTitle: 'PARIPURNA TA 2026: SUKSES TUTUP BUKU, AKUNTABILITAS LK, & REFLEKSI TAHUNAN',
    subTitle: 'Realisasi Paripurna APBN, Penganugerahan Satker Terbaik, & Kesiapan Menyongsong TA 2027',
    config: {
      namaBuletin: 'WARTA SEMARANG SATU',
      taglineBuletin: 'Kiprah Perbendaharaan & Kinerja APBN Wilayah KPPN Semarang I',
      sambutanKepala: 'Alhamdulillah, Tahun Anggaran 2026 berhasil kita tutup dengan capaian paripurna. Seluruh target penyerapan belanja, penyaluran TKD, dan kepatuhan pertanggungjawaban keuangan negara terlaksana dengan sukses. Terima kasih atas dedikasi dan kerja sama luar biasa seluruh Satker dan Pemerintah Daerah mitra KPPN Semarang I.',
      tajukRencana: 'Tutup buku bukan sekadar akhir administrasi, melainkan wujud nyata pertanggungjawaban fiskal kepada rakyat. Langkah selanjutnya adalah menyusun Laporan Keuangan Kementerian Negara/Lembaga (LKKL) dan LKPD yang berkualitas demi mempertahankan opini Wajar Tanpa Pengecualian (WTP).',
      wawancaraSatker: {
        judul: 'Refleksi Satu Tahun Pengelolaan Keuangan Negara: Sinergi Menuju WTP',
        narasumber: 'Kolonel (K) drg. Ratna Susilowati, Sp.KGA',
        jabatan: 'Kuasa Pengguna Anggaran (KPA)',
        satker: 'Rumah Sakit Tk. II Bhakti Wira Tamtama Semarang (Kesdam IV/Diponegoro)',
        isiWawancara: 'Tahun 2026 ini kami berhasil merealisasikan 99.4% anggaran layanan kesehatan dengan tata kelola Badan Layanan Umum (BLU) yang semakin transparan dan efisien.',
        isiWawancara2: 'Bimbingan teknis berkala dari KPPN Semarang I menjadi katalis penting dalam peningkatan mutu akuntansi dan kepatuhan perpajakan rumah sakit.',
        kutipanPenting: 'Akuntabilitas bukan beban, melainkan benteng kehormatan institusi dalam melayani kesehatan prajurit dan masyarakat.',
        prestasiSatker: 'Satker BLU Terbaik dalam Kinerja Anggaran & Pelaporan Keuangan TA 2026.'
      },
      sarwaSarwi: {
        judul: 'Treasury Awards 2026 & Malam Apresiasi KPPN Semarang I',
        temaKegiatan: 'Penganugerahan Satker Terbaik & Evaluasi Tahunan Pengelolaan APBN',
        tanggal: '22 Desember 2026',
        lokasi: 'Ballroom Hotel Tentrem Semarang',
        ceritaBagian1: 'KPPN Semarang I menggelar ajang bergengsi Treasury Awards 2026 untuk memberikan penghargaan kepada satker-satker dengan kinerja IKPA dan pengelolaan kas terbaik.',
        ceritaBagian2: 'Ratusan KPA dan pejabat perbendaharaan hadir menyaksikan penyerahan trofi dan piagam penghargaan dalam suasana megah dan penuh kebanggaan.',
        ceritaBagian3Purnabakti: 'Momen refleksi akhir tahun ditandai dengan pemutaran video kilas balik perjalanan pengawalan APBN sepanjang tahun 2026.',
        ceritaBagian4RiverTubing: 'Acara ditutup dengan doa bersama dan optimisme menyongsong Tahun Anggaran 2027 yang lebih berdaya guna bagi bangsa.',
        pesanKepala: 'Selamat kepada seluruh pemenang. Mari kita pertahankan prestasi ini dan terus berinovasi tiada henti.'
      }
    }
  }
];

export const DEFAULT_BULETIN_FULL_CONFIG: BuletinConfig = {
  id: 'buletin_kppn_current',
  edisi: 'EDISI 2 | TW.II/2026',
  bulanTahun: 'Triwulan II 2026',
  namaBuletin: 'WARTA SEMARANG SATU',
  taglineBuletin: 'Kiprah Perbendaharaan & Kinerja APBN Wilayah KPPN Semarang I',
  judulUtama: 'OPTIMALISASI PENYERAPAN BELANJA APBN & PENGUATAN TATA KELOLA KEUANGAN',
  subJudul: 'Kinerja Fiskal Berkualitas, Akselerasi Digitalisasi SAKTI, & Transformasi Layanan Menuju WBBM',
  layoutFormat: 'executive_magazine',
  highlightMissingData: true,
  
  // Hal 1: Cover Images & Highlights
  fotoCoverUrl: OFFICIAL_PRESET_IMAGES.coverBuletin,
  coverHighlight1: 'CAPACITY BUILDING: SINERGI & KOLABORASI TINGKATKAN PRESTASI',
  coverHighlight2: 'FESTIVAL KOTA LAMA & AKSELERASI PRODUK UMKM BINAAN KEMENKEU SATU',

  // Hal 2: Kepala Kantor & Editorial
  namaKepalaKantor: 'Drs. H. Ahmad Fauzi, M.Si.',
  jabatanKepala: 'Kepala KPPN Tipe A1 Semarang I',
  fotoKepalaUrl: OFFICIAL_PRESET_IMAGES.kepalaKantor,
  sambutanKepala: 'Puji syukur kita panjatkan ke hadirat Tuhan Yang Maha Esa. Melalui Warta Semarang Satu ini, KPPN Tipe A1 Semarang I terus berkomitmen mengawal pelaksanaan anggaran satker agar senantiasa efektif, transparan, dan akuntabel guna mendukung pertumbuhan ekonomi Kota Semarang dan Jawa Tengah.',

  // Hal 3: Sekilas Tentang Buletin & Tim Redaksi
  sekilasBuletin: 'Buletin WARTA SEMARANG SATU merupakan media publikasi berkala yang disusun secara mandiri oleh Seksi Manajemen Satker dan Kepatuhan Internal (MSKI) KPPN Tipe A1 Semarang I. Buletin ini diterbitkan sebagai sarana penyebarluasan informasi kinerja perbendaharaan, edukasi regulasi pengelolaan keuangan negara, serta wadah sinergi dan penguatan integritas bersama seluruh Satuan Kerja mitra kerja.',
  tajukRencana: 'Fokus triwulan ini diarahkan pada percepatan penyelesaian tagihan kontraktual, mitigasi deviasi Halaman III DIPA, serta pemanfaatan optimal instrumen digital perbendaharaan seperti KKP dan Digipay demi mendorong efisiensi belanja pemerintah.',
  redaksiTim: {
    pelindung: 'Kepala Kantor Wilayah Ditjen Perbendaharaan Provinsi Jawa Tengah',
    penanggungJawab: 'Drs. H. Ahmad Fauzi, M.Si. (Kepala KPPN Semarang I)',
    pemimpinRedaksi: 'Kepala Seksi Manajemen Satker dan Kepatuhan Internal (MSKI)',
    redakturPelaksana: 'Kepala Seksi Pencairan Dana & Kepala Seksi Bank',
    timLiputan: 'Staf Seksi MSKI, Seksi Verifikasi Akuntansi, & Tim Pengelola IT',
    desainTataLetak: 'Tim Media Kreatif & Publikasi Digital KPPN Semarang I',
    sekretariat: 'Subbagian Umum KPPN Tipe A1 Semarang I, Jl. Ki Mangunsarkoro No. 34'
  },
  temaWarna: 'navy',
  showRealisasiBelanja: true,
  showIKPASection: true,
  showPojokSakti: true,
  showSambutan: true,
  showAgendaKegiatan: true,

  // Hal 8: Transfer Ke Daerah (TKD)
  tkdData: {
    dbh: 182450000000,
    dau: 1482000000000,
    dakFisik: 45800000000,
    dakNonFisik: 512180000000,
    insentifFiskal: 38200000000,
    danaKelurahan: 86500000000,
    catatanTkd: 'Dana Transfer Ke Daerah (TKD) adalah instrumen desentralisasi fiskal APBN yang disalurkan ke kas daerah Pemerintah Kota Semarang dan daerah mitra untuk mendanai urusan pemerintahan wajib dan pelayanan publik. KPPN Semarang I memastikan penyaluran tepat waktu guna mendukung kelancaran pembangunan infrastruktur, pemenuhan layanan kesehatan dasar, serta peningkatan kesejahteraan masyarakat luas.'
  },

  // Hal 9 & 10: Guyub Rukun (Wawancara Satker)
  wawancaraSatker: {
    judul: 'Kiat Sukses Mengamankan Nilai IKPA 100 & Zero Retur SP2D pada Triwulan II',
    narasumber: 'Budi Santoso, S.E., Ak.',
    jabatan: 'PPK / Pengelola Keuangan Negara',
    satker: 'Politeknik Ilmu Pelayaran (PIP) Semarang',
    fotoNarasumberUrl: OFFICIAL_PRESET_IMAGES.narasumberSatker,
    fotoKegiatanSatkerUrl: OFFICIAL_PRESET_IMAGES.kegiatanSatker,
    isiWawancara: 'Kunci utama mencapai kinerja penyerapan anggaran yang optimal dan raihan IKPA maksimal terletak pada disiplin pemutakhiran RPD Halaman III DIPA setiap awal triwulan serta rekonsiliasi berkala sebelum tanggal cut-off SAKTI.',
    isiWawancara2: 'Dalam pemanfaatan alokasi belanja operasional dan pemeliharaan, satker senantiasa menerapkan Indikator Kinerja Utama (IKU) sebagai tolok ukur efektivitas setiap rupiah anggaran negara. Penerapan Cash Management System (CMS) dan Kartu Kredit Pemerintah (KKP) juga terus dioptimalkan.',
    kutipanPenting: 'Koordinasi aktif dengan Helpdesk KPPN Semarang I membuat seluruh kendala teknis SP2D dan SAKTI terselesaikan dalam hitungan jam.',
    prestasiSatker: 'Peringkat 1 Realisasi Belanja & IKPA Kategori Pagu Besar dengan Nilai 99.85 Wilayah KPPN Semarang I.'
  },

  // Hal 11 - 14: Sarwa Sarwi KPPN
  sarwaSarwi: {
    judul: 'Sinergi dan Kolaborasi Tingkatkan Prestasi',
    temaKegiatan: 'Capacity Building & Outbound Insan KPPN Semarang I',
    tanggal: '18 Juni 2026',
    lokasi: 'Kawasan Wisata Bandungan, Kab. Semarang',
    ceritaBagian1: 'Capacity Building diselenggarakan sebagai wujud nyata penguatan sinergi internal serta penyegaran semangat kerja insan KPPN Tipe A1 Semarang I. Kegiatan diselenggarakan di kawasan sejuk Bandungan, Kabupaten Semarang.',
    ceritaBagian2: 'Seluruh pegawai tanpa terkecuali, mulai dari Kepala Kantor, para Kepala Seksi, Pejabat Fungsional, Pelaksana, hingga PPNPN turut ambil bagian dengan penuh antusias dan kegembiraan.',
    ceritaBagian3Purnabakti: 'Memasuki siang hari, suasana penuh kehangatan menyelimuti aula saat dilangsungkannya acara pelepasan pegawai purnabakti yang telah mendedikasikan tenaga dan pikirannya selama puluhan tahun bagi Kementerian Keuangan.',
    ceritaBagian4RiverTubing: 'Keseruan river tubing di jeram sungai pegunungan menguji kekompakan dan nyali kebersamaan seluruh tim tanpa membedakan jabatan atau posisi dinas.',
    pesanKepala: 'Semoga rasa kebersamaan, kekompakan, dan energi positif yang terbangun selama Capacity Building ini terus menyala dalam pelaksanaan tugas sehari-hari demi memberikan pelayanan prima tanpa celah bagi seluruh mitra kerja KPPN Semarang I.',
    fotoCapacityBuilding1Url: OFFICIAL_PRESET_IMAGES.capacityBuilding1,
    fotoCapacityBuilding2Url: OFFICIAL_PRESET_IMAGES.capacityBuilding2,
    fotoPurnabaktiUrl: OFFICIAL_PRESET_IMAGES.purnabakti,
    fotoRiverTubingUrl: OFFICIAL_PRESET_IMAGES.riverTubing
  },

  // Hal 15 & 16: Pagelaran Semarang
  pagelaranSemarang: {
    judulEvent: 'SEMARANG NIGHT CARNIVAL & FESTIVAL BUDAYA',
    tanggalEvent: '02 Mei 2026',
    lokasiEvent: 'Kawasan Simpang Lima & Jl. Pemuda Semarang',
    deskripsiEvent: 'Kemeriahan parade budaya Kota Semarang menampilkan ragam pesona kriya dan busana adiluhung yang memadukan akulturasi budaya Jawa, Tionghoa, Arab, dan Kolonial. Ribuan masyarakat tumpah ruah menyaksikan pawai yang menggerakkan perputaran ekonomi kreatif lokal.',
    judulUmkm: 'PEMBERDAYAAN UMKM BINAAN KEMENKEU SATU',
    deskripsiUmkm: 'KPPN Semarang I secara aktif mendorong pemberdayaan Usaha Mikro, Kecil, dan Menengah (UMKM) melalui fasilitasi pembiayaan Ultra Mikro (UMi) dan digitalisasi transaksi pengadaan pemerintah lewat platform Digipay Satu. Beragam produk unggulan kuliner dan batik semarangan berhasil menembus pasar nasional.',
    fotoEvent1Url: OFFICIAL_PRESET_IMAGES.pagelaranBudaya,
    fotoEvent2Url: OFFICIAL_PRESET_IMAGES.pagelaranBudaya,
    fotoUmkmUrl: OFFICIAL_PRESET_IMAGES.umkmBinaan
  },

  // Hal 17 & 18: Teropong Semarang
  teropongSemarang: {
    lokasi1Nama: 'KAWASAN KOTA LAMA SEMARANG (LITTLE NETHERLAND)',
    lokasi1Deskripsi: 'Kawasan Kota Lama Semarang dengan deretan bangunan bersejarah abad ke-18 seperti Gereja Blenduk dan Gedung Marba menjadi magnet pariwisata yang tak lekang oleh waktu. Penataan pedestrian yang asri menjadikannya ruang publik yang inklusif, sarat nilai edukasi sejarah, dan penggerak ekonomi wisata.',
    fotoTeropong1Url: OFFICIAL_PRESET_IMAGES.kotaLama,
    lokasi2Nama: 'LANDMARK LAWANG SEWU & KAWASAN TUGU MUDA',
    lokasi2Deskripsi: 'Lawang Sewu di bundaran Tugu Muda berdiri megah sebagai ikon perkeretaapian nasional dan saksi perjuangan Pertempuran Lima Hari di Semarang. Kawasan ini telah direvitalisasi menjadi destinasi cagar budaya berkelas dunia.',
    fotoTeropong2Url: OFFICIAL_PRESET_IMAGES.lawangSewu
  },

  // Hal 19: Zona Integritas & Pantun
  pantunAntiKorupsi: {
    bait1: 'Jalan-jalan ke Simpang Lima membeli lumpia,',
    bait2: 'Mampir kulineran tahu gimbal nikmat tiada tara;',
    bait3: 'KPPN Semarang I melayani dengan tulus dan prima,',
    bait4: 'Tanpa suap, tolak gratifikasi, integritas nomor satu selamanya!',
    pesanIntegritas: 'KPPN Tipe A1 Semarang I berkomitmen menjaga integritas tanpa kompromi. Seluruh layanan perbendaharaan, penerbitan SP2D, bimbingan SAKTI, dan konsultasi anggaran diberikan GRATIS (Rp0,-). Laporkan segala bentuk pungutan liar atau gratifikasi melalui saluran resmi SIPANDU Kemkeu dan WBS Kemenkeu.'
  },

  // Hal 20: Back Cover & Kontak
  kontakKppn: {
    alamat: 'Jl. Ki Mangunsarkoro No. 34, Karangkidul, Kec. Semarang Tengah, Kota Semarang, Jawa Tengah 50241',
    telepon: '(024) 8414002 / 8414003',
    whatsappHelpdesk: '+62 811-2700-026 (Helpdesk CSO SAKTI)',
    email: 'kppnsemarang1@kemenkeu.go.id',
    website: 'djpb.kemenkeu.go.id/kppn/semarang1',
    instagram: '@kppnsemarang1',
    youtube: 'KPPN Semarang I Official',
    fotoGedungUrl: OFFICIAL_PRESET_IMAGES.gedungKppn,
    qrCodeText: 'https://djpb.kemenkeu.go.id/kppn/semarang1'
  },

  kegiatanKppn: {
    judul: 'Bimtek Tata Kelola Keuangan & Sosialisasi Antikorupsi',
    subJudul: 'Penguatan Integritas dan Mitigasi Deviasi Halaman III DIPA Satker Mitra',
    tanggal: '12 Juni 2026',
    lokasi: 'Aula Sumbing KPPN Semarang I, Jl. Ki Mangunsarkoro No. 34',
    deskripsi: 'Kegiatan dihadiri oleh seluruh KPA dan PPK Satuan Kerja guna mengevaluasi realisasi belanja semester I serta menyamakan persepsi mitigasi deviasi RPD.'
  },

  tipsSaktiCustom: [
    'Pastikan SPM Kontraktual diterbitkan maksimal 17 hari kerja sejak BAST ditandatangani untuk menjaga indikator Ketepatan Waktu.',
    'Lakukan Rekonsiliasi Eksternal SAKTI-SPAN setiap bulan sebelum batas cut-off tanggal 10 pukul 23:59 WIB.',
    'Optimalkan penggunaan CMS dan KKP untuk meminimalkan saldo idle kas tunai pada rekening Bendahara Pengeluaran.'
  ],
  catatanAnalis: 'Realisasi Belanja Modal perlu diakselerasi melalui monitoring berkala terhadap progres fisik pengadaan barang/jasa sebelum batas akhir tahun anggaran.',
  canvaTemplateUrl: 'https://www.canva.com/templates/?query=newsletter+annual+report+a4'
};
